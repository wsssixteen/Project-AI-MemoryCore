#!/usr/bin/env node
// turn-ledger.check.hook.js — born via core/forge.js (2026-09-06) — plan §M M3/M4/M7
// symptom: 2026-09-04 miya "you still haven't answered the monitoring part" — no ledger says which
//          quest/phase a block served, whether it was true or false, or what a turn cost.
// goal: ONE wide row per user turn in system/telemetry/turns.jsonl (tool calls · hooks · blocks ·
//       bypasses with fp: convention · user signal · qa/phase) + goal_met per blocking feature.
// goal_signal: after a Stop, turns.jsonl has a row whose turn_id == current-turn-<sid>.json turn_id.
// retention: rotate monthly (turns.jsonl) · goal-lens-pending.jsonl regenerate.
// TRIGGER: every Stop that is not stop_hook_active.
// ACTION: append the turn row; absorb reply-log's fields; evaluate goal_signal_regex for features that
//         BLOCKED this turn (mechanical goal_met) or emit ONE goal-lens advisory (cap 3) for the rest.
// Fail-open: any error → exit 0, nothing blocked. A monitor must never break the monitored.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
let turnCtx = null; try { turnCtx = require(path.join(ROOT, 'lib', 'turn-context.js')); } catch (_) {}

const TELEMETRY_DIR = path.join(ROOT, 'system', 'telemetry');
const TURNS = path.join(TELEMETRY_DIR, 'turns.jsonl');
const HOOK_FIRES = path.join(TELEMETRY_DIR, 'hook-fires.jsonl');
const STATE = path.join(TELEMETRY_DIR, 'turn-ledger-state.json');
const PENDING = path.join(__dirname, 'goal-lens-pending.jsonl');
const LOG = path.join(__dirname, 'log.jsonl');
const TOKEN_MAP = path.join(__dirname, 'token-map.json');
const TAIL_BYTES = 400 * 1024;
const GOAL_PROMPT_CAP = 3;

function readTail(file, bytes) {
  try {
    const st = fs.statSync(file);
    const fd = fs.openSync(file, 'r');
    const len = Math.min(bytes, st.size);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, st.size - len);
    fs.closeSync(fd);
    const s = buf.toString('utf8');
    return st.size > len ? s.slice(s.indexOf('\n') + 1) : s; // drop a partial first line
  } catch (_) { return ''; }
}
function parseLines(text) {
  const out = [];
  for (const line of String(text).split('\n')) { if (!line.trim()) continue; try { out.push(JSON.parse(line)); } catch (_) {} }
  return out;
}

// Transcript window = rows after the LAST user prompt (string-content user row).
function transcriptWindow(transcriptPath) {
  const rows = parseLines(readTail(transcriptPath, TAIL_BYTES));
  let start = -1;
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r.type === 'user' && r.message && typeof r.message.content === 'string') { start = i; break; }
  }
  const win = start >= 0 ? rows.slice(start) : rows;
  const toolNames = {};
  let toolCalls = 0, assistantMsgs = 0, replyChars = 0, lastText = '', toolText = '';
  const tokens = { in: 0, out: 0, cache_read: 0, cache_create: 0 };
  for (const r of win) {
    if (r.type !== 'assistant' || !r.message) continue;
    assistantMsgs++;
    const content = Array.isArray(r.message.content) ? r.message.content : [];
    let text = '';
    for (const b of content) {
      if (b.type === 'tool_use') { toolCalls++; toolNames[b.name] = (toolNames[b.name] || 0) + 1; toolText += ' ' + JSON.stringify(b.input || {}).slice(0, 2000); }
      else if (b.type === 'text' && typeof b.text === 'string') text += b.text;
    }
    if (text) { replyChars += text.length; lastText = text; }
    // 9e blind spot: model tokens per turn (transcript `usage` rows) — summed per assistant message
    const u = r.message.usage;
    if (u && typeof u === 'object') {
      tokens.in += u.input_tokens || 0; tokens.out += u.output_tokens || 0;
      tokens.cache_read += u.cache_read_input_tokens || 0; tokens.cache_create += u.cache_creation_input_tokens || 0;
    }
  }
  return { found: rows.length > 0, toolCalls, toolNames, assistantMsgs, replyChars, lastText, toolText, tokens, promptTs: start >= 0 ? rows[start].timestamp || null : null };
}

// M4 — bypass tokens in the LAST assistant message, outside fenced code (scenario 6).
function stripFences(t) { return String(t).replace(/```[\s\S]*?```/g, ''); }
function parseBypasses(lastText, tokenMap) {
  const out = [];
  const re = /\[(skip-[a-z0-9-]+|verified-blocked)[^:\]]*:\s*([^\]]*)\]/g;
  let m;
  const t = stripFences(lastText);
  while ((m = re.exec(t))) {
    const token = m[1];
    const reason = m[2].replace(/\s+/g, ' ').trim().slice(0, 160);
    out.push({ token, hook: tokenMap[token] || '?', fp: /^fp:/i.test(reason), reason });
  }
  return out;
}

function loadTokenMap() { try { return JSON.parse(fs.readFileSync(TOKEN_MAP, 'utf8')); } catch (_) { return {}; } }
function hookRowsForTurn(turnId) {
  if (!turnId) return [];
  return parseLines(readTail(HOOK_FIRES, 2 * 1024 * 1024)).filter(r => r.turn_id === turnId && r.hook !== 'turn-ledger');
}
function featureOf(hookName) { return String(hookName).replace(/\.(check|gate|discipline|trigger)?\.?hook$/, ''); }
function readmeKeys(feature) {
  const p = path.join(ROOT, 'domain', feature, 'README.md');
  try {
    const t = fs.readFileSync(p, 'utf8');
    const get = k => { const m = t.match(new RegExp('^\\s*\\**' + k + '\\**\\s*:\\s*(.+)$', 'mi')); return m ? m[1].trim() : null; };
    return { goal: get('goal'), signal: get('goal_signal'), regex: get('goal_signal_regex') };
  } catch (_) { return null; }
}
function appendJsonl(file, row) { try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.appendFileSync(file, JSON.stringify(row) + '\n'); } catch (_) {} }

function userSignal(hookRows, promptHead) {
  if (hookRows.some(r => r.hook === 'reask' && (r.fired || r.blocked))) return 'reask';
  if (hookRows.some(r => /^auto-skill-trigger/.test(r.hook) && (r.fired || r.blocked))) return 'correction';
  if (/^(ok|okay|yes|yup|go|good|great|nice|perfect|thanks|thank you)\b/i.test(promptHead || '')) return 'nod';
  return 'none';
}

// M7 — goal lens for features that BLOCKED this turn.
function goalLens(hookRows, lastText, turnId) {
  const blocked = [...new Set(hookRows.filter(r => r.blocked).map(r => featureOf(r.hook)))];
  const prompts = [];
  let mechanical = 0;
  for (const feature of blocked) {
    const keys = readmeKeys(feature);
    if (!keys || !keys.goal) continue; // goal-less feature: no prompt, no false verdict (scenario 25)
    if (keys.regex) {
      let met = null;
      try { met = new RegExp(keys.regex, 'i').test(lastText); } catch (_) { met = null; }
      appendJsonl(path.join(ROOT, 'domain', feature, 'goal-log.jsonl'), { ts: new Date().toISOString(), turn_id: turnId, feature, met: met === null ? 'unknown' : (met ? 'y' : 'n'), mode: 'mechanical', evidence: turnId });
      mechanical++;
    } else if (prompts.length < GOAL_PROMPT_CAP) {
      prompts.push({ feature, goal: keys.goal });
      appendJsonl(PENDING, { ts: new Date().toISOString(), turn_id: turnId, feature, goal: keys.goal });
    }
  }
  return { prompts, mechanical, blockedFeatures: blocked };
}

function buildRow(data, stamp, win, hookRows, bypasses, prev) {
  const now = new Date();
  const blocks = hookRows.filter(r => r.blocked).map(r => ({ hook: r.hook, reason: (r.reason || '').slice(0, 160) }));
  const suppressed = hookRows.filter(r => r.mode === 'orch-suppressed').length;
  const hookMs = hookRows.reduce((a, r) => a + (Number.isFinite(r.dur_ms) ? r.dur_ms : 0), 0);
  let gap = null;
  if (prev && prev.closed_ts) gap = Math.round((now.getTime() - Date.parse(prev.closed_ts)) / 60000);
  // 9h: if the prompt named no ticket, the tool paths/commands of this turn may — re-attribute at Stop.
  let qa = stamp ? stamp.qa : null, phase = stamp ? stamp.phase : null, status = stamp ? stamp.status : null, qaSource = stamp ? (stamp.qa_source || null) : null;
  if (turnCtx && turnCtx.attribute && (!qaSource || qaSource === 'top-active') && win.toolText) {
    try { const a = turnCtx.attribute(win.toolText, undefined); if (a.qa && /^named/.test(a.qa_source || '')) { qa = a.qa; phase = a.phase; status = a.status; qaSource = 'tools'; } } catch (_) {}
  }
  return {
    v: 1,
    turn_id: stamp ? stamp.turn_id : null,
    session_id: data.session_id || (stamp && stamp.session_id) || null,
    opened_ts: stamp ? stamp.opened_ts : (win.promptTs || null),
    closed_ts: now.toISOString(),
    qa, phase, status, qa_source: qaSource,
    prompt_head: stamp ? stamp.prompt_head : null,
    tool_calls: win.found ? win.toolCalls : null,
    tool_names: win.toolNames,
    assistant_msgs: win.assistantMsgs,
    reply_chars: win.replyChars,
    tokens: win.tokens,
    hooks_fired: hookRows.length,
    hook_ms: hookMs,
    blocks,
    bypasses,
    bypass_reason_unclassified: bypasses.filter(b => !b.fp && !b.reason).length,
    suppressed,
    user_signal: userSignal(hookRows, stamp ? stamp.prompt_head : ''),
    gap_since_prev_minutes: gap,
  };
}

function evaluate(data) {
  const sid = data.session_id || null;
  const stamp = data._testStamp !== undefined ? data._testStamp : (turnCtx && sid ? turnCtx.readStamp(sid) : null);
  const win = transcriptWindow(data.transcript_path || '');
  const tokenMap = data._testTokenMap || loadTokenMap();
  const hookRows = Array.isArray(data._testHookRows) ? data._testHookRows : hookRowsForTurn(stamp && stamp.turn_id);
  const bypasses = parseBypasses(win.lastText, tokenMap);
  let prev = null; try { prev = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (_) {}
  const row = buildRow(data, stamp, win, hookRows, bypasses, prev);
  const lens = goalLens(hookRows, win.lastText, row.turn_id);
  return { row, lens, lastText: win.lastText || '' };
}

if (require.main === module) {
  runHook({ name: 'turn-ledger', event: 'Stop' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    if (data.stop_hook_active) return { fired: false }; // anti-loop (scenario 3)
    if (!data.session_id && !data.transcript_path && !data._testStamp) return { fired: false }; // empty payload (smoke-fire / eval F1): nothing to ledger
    const { row, lens, lastText } = evaluate(data);
    const target = data._testTurnsPath || TURNS;
    appendJsonl(target, row);
    try { fs.writeFileSync(STATE, JSON.stringify({ closed_ts: row.closed_ts, turn_id: row.turn_id })); } catch (_) {}
    appendJsonl(LOG, { ts: row.closed_ts, turn_id: row.turn_id, tool_calls: row.tool_calls, blocks: row.blocks.length, fp: row.bypasses.filter(b => b.fp).length, goal_mechanical: lens.mechanical, goal_prompts: lens.prompts.length });
    const lines = lens.prompts.map(p => `goal-lens: ${p.feature} BLOCKED this turn — goal: ${p.goal}\n   Met? gap? improve? → node lib/goal-lens.js note ${p.feature} --turn ${row.turn_id} --met y|n|partial --gap "<what fell short>" --improve "<change that reaches the goal>"`);
    // 9a (2026-09-07): a refute verdict in this reply on a known quest with no wrong-fix row today → advisory
    if (row.qa && /\b(REFUTED|refuted|reverted|not the (root )?cause|wrong fix|does not fix|did not fix)\b/.test(lastText)) {
      let hasToday = false;
      try { const wf = require(path.join(ROOT, 'lib', 'wrong-fix.js')); const p = wf.docPath(row.qa); const d = new Date().toISOString().slice(0, 10); hasToday = !!p && wf.readRows(fs.readFileSync(p, 'utf8')).rows.some(r => r.date === d); } catch (_) {}
      if (!hasToday) lines.push(`wrong-fix: this reply refutes a fix on ${row.qa} but the qa_doc has no Wrong-fixes row today → node lib/wrong-fix.js add ${row.qa} --was "<fix>" --why "<how refuted>" --learned "<rule>"  (Phase 2 cannot archive until every row has a verdict)`);
    }
    if (lines.length) return { fired: true, blocked: false, contextOut: lines.join('\n') + '\n' };
    return { fired: true, blocked: false };
  });
}

module.exports = { evaluate, transcriptWindow, parseBypasses, userSignal, goalLens, buildRow, stripFences };
