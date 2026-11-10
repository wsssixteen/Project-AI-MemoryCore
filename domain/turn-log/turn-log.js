#!/usr/bin/env node
// turn-log.js — the writer library of domain/turn-log (born 2026-11-10 via core/forge.js, stage 8 of the over-complexity audit).
// his-words: not an approval reader — monitoring: reads tool_use / tool_result rows and the turn boundary to log them; his text itself comes from lib/his-words.js
//
// symptom: miya 2026-11-06: "I can bet my life that you've failed to reach the goal of what I told you on what I expect of
//          Monitoring and Observability. You wont have enough data logged."
// goal: every audit question (what did he ask, what did I understand, what did I choose, what did it cost) is answered from one file in one query.
// goal_signal: after a Stop, system/telemetry/turn-log/<machine>-<YYYY-MM>.jsonl holds a turn row whose turn_id equals the open stamp turn_id.
// retention: rotate monthly (one file per machine per month; month files older than 180 days are deleted by lib/housekeeping.js).
//
// Rows (one JSON object per line, field `kind`):
//   turn   one per Stop (a re-entry after a Stop block writes a newer `rev` of the same turn_id; readers keep the highest rev)
//   tool   one per tool call of the turn (written once: the stamp keeps tools_written)
//   signal how he reacted to the PREVIOUS turn (reask / correction / nod), written by the turn that received it
// A field the Stop hook cannot know is null, never guessed.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const ASK_CAP = 20000;        // his words are kept verbatim up to this many characters
const STAMP_SLACK_MS = 2000;  // window start when his prompt row cannot be matched: the stamp time minus this
const REPLY_LINES = {
  restated: /^[ \t>*_#-]*\**(?:you asked|restated ask)\**\s*[:—-]\s*(.+?)\s*$/im,
  cause: /\bcause step\**\s*[:—-]\s*(.+?)(?=\s*(?:·|\||;|\bchange\b\s*[:—-]|$))/im,
  change: /\bchange\**\s*[:—-]?\s*(\d+)\s*lines?\b/i,
  newParts: /\bnew parts?\**\s*[:—-]?\s*(\d+)\b/i,
  quote: /\bhis words\**\s*[:—-]\s*["“«](.+?)["”»]/i,
};

function lib(name, root) { try { return require(path.join(root || ROOT, 'lib', name)); } catch (_) { return null; } }
function machine(root) { const h = lib('hook-runtime.js', root); return h && h.machineName ? h.machineName() : 'unknown'; }
function logDir(root) { return path.join(root || ROOT, 'system', 'telemetry', 'turn-log'); }
function logFile(root, iso) { return path.join(logDir(root), machine(root) + '-' + String(iso || new Date().toISOString()).slice(0, 7) + '.jsonl'); }
function newId() { return Date.now().toString(36) + '-' + crypto.randomBytes(5).toString('hex'); }
function sid8(sid) { return String(sid || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 8) || 'nosid'; }
function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

// ---------- file helpers ----------
function readTail(file, bytes) {
  try {
    const st = fs.statSync(file); const n = Math.min(bytes, st.size);
    const fd = fs.openSync(file, 'r'); const buf = Buffer.alloc(n);
    fs.readSync(fd, buf, 0, n, st.size - n); fs.closeSync(fd);
    const s = buf.toString('utf8');
    return st.size > n ? s.slice(s.indexOf('\n') + 1) : s;
  } catch (_) { return ''; }
}
function parseLines(text) {
  const out = [];
  for (const line of String(text).split('\n')) { if (!line.trim()) continue; try { out.push(JSON.parse(line)); } catch (_) {} }
  return out;
}
function appendRow(root, row) {
  const full = Object.assign({ v: 2, event_id: newId(), machine: machine(root), ts: new Date().toISOString() }, row);
  const f = logFile(root, full.ts);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.appendFileSync(f, JSON.stringify(full) + '\n');
  return { file: f, row: full };
}
// Several rows of one Stop: one write per month file (a turn with 6,000 tool calls is one append, not 6,000).
function appendRows(root, list) {
  const byFile = new Map(); const out = [];
  for (const row of list) {
    const full = Object.assign({ v: 2, event_id: newId(), machine: machine(root), ts: new Date().toISOString() }, row);
    const f = logFile(root, full.ts);
    if (!byFile.has(f)) byFile.set(f, []);
    byFile.get(f).push(full); out.push({ file: f, row: full });
  }
  for (const [f, rows] of byFile) { try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.appendFileSync(f, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); } catch (_) { for (const w of out) if (w.file === f) w.failed = true; } }
  return out.filter(w => !w.failed);
}

// ---------- transcript window ----------
// Rows at or after sinceMs. Reads backwards in growing chunks until the window start is inside the chunk (cap 48 MB).
function readRowsSince(tp, sinceMs) {
  let size; try { size = fs.statSync(tp).size; } catch (_) { return null; }
  let rows = [], truncated = false;
  for (const cap of [1 << 20, 4 << 20, 16 << 20, 48 << 20]) {
    const text = readTail(tp, cap);
    rows = parseLines(text);
    const whole = Math.min(cap, size) >= size;
    const first = rows.find(r => r && r.timestamp);
    const reached = !sinceMs || whole || (first && Date.parse(first.timestamp) <= sinceMs);
    truncated = !reached;
    if (reached) break;
  }
  return { rows: sinceMs ? rows.filter(r => r.timestamp && Date.parse(r.timestamp) >= sinceMs) : rows, truncated };
}

// His prompt of this turn, in his own words (lib/his-words.js), matched to the stamp's prompt head.
function findAsk(tp, stamp, root) {
  const hw = lib('his-words.js', root);
  if (!tp || !hw) return null;
  const head = stamp ? norm(stamp.prompt_head) : '';
  let msgs = [];
  for (const tail of [600000, 4000000, 16000000]) {
    msgs = hw.hisMessages(tp, { limit: 8, tailBytes: tail });
    if (!head || msgs.some(m => norm(m.text).startsWith(head))) break;
  }
  if (!msgs.length) return null;
  const hit = head ? msgs.find(m => norm(m.text).startsWith(head)) : null;
  return hit ? Object.assign({ matched: true }, hit) : Object.assign({ matched: false }, msgs[0]);
}

function flat(c) {
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map(x => (x && typeof x.text === 'string' ? x.text : '')).join('\n');
  return '';
}
function analyse(rows) {
  const uses = [], results = {}, byId = {}, modelById = {}, triggerText = [], skillMentions = [];
  let lastText = '', allText = '', replyChars = 0, effort = null, promptId = null;
  const seenUse = new Set();
  for (const r of rows) {
    if (!r) continue;
    if (!promptId && r.type === 'user' && r.promptId) promptId = r.promptId;
    if (r.type === 'assistant' && r.message) {
      const id = r.message.id || r.uuid;
      if (r.message.usage) byId[id] = r.message.usage;
      if (r.message.model) modelById[id] = r.message.model;
      if (r.perTurnEffort || r.effort) effort = r.perTurnEffort || r.effort;
      const content = Array.isArray(r.message.content) ? r.message.content : [];
      let text = '';
      for (const b of content) {
        if (b.type === 'tool_use' && !seenUse.has(b.id)) { seenUse.add(b.id); uses.push({ id: b.id, name: b.name, input: b.input || {}, ts: r.timestamp || null }); }
        else if (b.type === 'text' && typeof b.text === 'string') text += b.text;
      }
      if (text) { replyChars += text.length; lastText = text; allText += text + '\n'; }
    } else if (r.type === 'user' && r.message && Array.isArray(r.message.content)) {
      for (const b of r.message.content) if (b && b.type === 'tool_result') results[b.tool_use_id] = { ts: r.timestamp || null, err: !!b.is_error, text: flat(b.content).slice(0, 300) };
    } else if (r.type === 'attachment' && r.attachment) {
      const a = r.attachment;
      if (a.type === 'hook_additional_context' && Array.isArray(a.content)) triggerText.push(a.content.join('\n'));
      else if (a.type === 'hook_blocking_error' && a.blockingError) triggerText.push(String(a.blockingError.blockingError || ''));
      else if (a.type === 'skill_mention' && a.skillName) skillMentions.push(String(a.skillName));
    }
  }
  const tokens = { in: 0, out: 0, cache_read: 0, cache_create: 0 };
  for (const u of Object.values(byId)) { tokens.in += u.input_tokens || 0; tokens.out += u.output_tokens || 0; tokens.cache_read += u.cache_read_input_tokens || 0; tokens.cache_create += u.cache_creation_input_tokens || 0; }
  const models = {}; for (const m of Object.values(modelById)) models[m] = (models[m] || 0) + 1;
  const model = Object.keys(models).sort((a, b) => models[b] - models[a])[0] || null;
  return { uses, results, tokens, models, model, effort, lastText, allText, replyChars, assistantMsgs: Object.keys(modelById).length || Object.keys(byId).length, promptId, triggerText: triggerText.join('\n'), skillMentions };
}

// ---------- tool rows ----------
const SECRET = /\b(password|passwd|token|secret|api[_-]?key|authorization)(\s*[=:]\s*|\s+)(\S{6,})/gi;
function oneLine(s, n) { return String(s == null ? '' : s).replace(SECRET, '$1$2***').replace(/\s+/g, ' ').trim().slice(0, n); }
function targetOf(u) {
  const i = u.input || {};
  switch (u.name) {
    case 'Edit': case 'Write': case 'Read': case 'MultiEdit': return oneLine(i.file_path, 200);
    case 'NotebookEdit': return oneLine(i.notebook_path, 200);
    case 'Skill': return oneLine(i.skill || i.name, 80);
    case 'Agent': case 'Task': return oneLine((i.subagent_type || 'general') + ' | model=' + (i.model || 'unspecified') + ' | ' + (i.description || ''), 160);
    case 'Bash': case 'PowerShell': return oneLine(i.command, 160);
    case 'Grep': case 'Glob': return oneLine((i.pattern || '') + (i.path ? ' @ ' + i.path : ''), 160);
    case 'Workflow': return oneLine(i.scriptPath || i.name || 'inline script', 160);
    case 'WebFetch': return oneLine(i.url, 160);
    default: {
      const first = Object.values(i).find(v => typeof v === 'string');
      return oneLine(first != null ? first : JSON.stringify(i), 160);
    }
  }
}
const REFUSED = /doesn't want to proceed|was denied|permission to use|user rejected|blocked by hook|refused|not allowed to/i;
function resultOf(res) {
  if (!res) return null;
  if (!res.err) return 'ok';
  return REFUSED.test(res.text) ? 'refused' : 'error';
}
function durOf(u, res) {
  if (!res || !u.ts || !res.ts) return null;
  const d = Date.parse(res.ts) - Date.parse(u.ts);
  return Number.isFinite(d) && d >= 0 ? d : null;
}
const RM = /(?:^|[\s;&|(])(?:git\s+rm|rm|del|unlink|Remove-Item)\b([^;&|\n]*)/gi;
function retiredPaths(cmd) {
  const out = [];
  let m; RM.lastIndex = 0;
  while ((m = RM.exec(String(cmd || '')))) for (const t of m[1].split(/\s+/)) { const p = t.replace(/^["']|["']$/g, ''); if (p && !/^-/.test(p) && /[\\/.]/.test(p)) out.push(p.slice(0, 200)); }
  return out;
}
function relPath(p, root) {
  const r = String(root || ROOT).replace(/[\\/]+$/, '');
  const s = String(p);
  return s.toLowerCase().startsWith(r.toLowerCase() + path.sep.toLowerCase()) || s.toLowerCase().startsWith(r.toLowerCase() + '/') ? s.slice(r.length + 1).replace(/\\/g, '/') : s;
}

// ---------- skills ----------
function knownSkills(root) { try { return fs.readdirSync(path.join(root || ROOT, '.claude', 'skills'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); } catch (_) { return []; } }
// A skill is "triggered" when a hook or he named it: a skill_mention attachment, or a line that says "skill" beside its name in hook-injected text.
function skillsTriggered(an, hookReasons, known) {
  const found = new Set(an.skillMentions.filter(n => known.includes(n)));
  if (!known.length) return [...found].slice(0, 12);
  const esc = known.slice().sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp('(?<![\\w-])(' + esc.join('|') + ')(?![\\w-])', 'g');
  for (const line of (an.triggerText + '\n' + hookReasons.join('\n')).split('\n')) {
    if (!/skill/i.test(line)) continue;
    let m; re.lastIndex = 0;
    while ((m = re.exec(line.slice(0, 600)))) found.add(m[1]);
  }
  return [...found].slice(0, 12);
}

// ---------- reply lines ----------
function replyLines(text) {
  const t = String(text || '').replace(/```[\s\S]*?```/g, ''); // a quoted rule inside a code fence is not this turn's own line
  const g = (re) => { const m = re.exec(t); return m ? m[1].trim().slice(0, 300) : null; };
  const n = (re) => { const m = re.exec(t); return m ? parseInt(m[1], 10) : null; };
  return { restated_ask: g(REPLY_LINES.restated), cause_step: g(REPLY_LINES.cause), change_lines: n(REPLY_LINES.change), new_parts: n(REPLY_LINES.newParts), quote: g(REPLY_LINES.quote) };
}

// ---------- hook rows of the turn ----------
function hookRowsForTurn(root, turnId) {
  if (!turnId) return [];
  const rows = [];
  const now = new Date(), prev = new Date(now.getTime() - 32 * 86400000);
  for (const d of [prev, now]) { const f = logFileHookFires(root, d.toISOString()); rows.push(...parseLines(readTail(f, 2 * 1024 * 1024))); }
  return rows.filter(r => r.turn_id === turnId && r.hook !== 'turn-log');
}
function logFileHookFires(root, iso) { const h = lib('hook-runtime.js', root); return h && h.hookFiresFile ? h.hookFiresFile(iso) : path.join(root || ROOT, 'system', 'telemetry', 'hook-fires-unknown.jsonl'); }

// Pass-row counters kept by lib/hook-runtime.js in the OS temp folder. Everything in the file is summed into THIS turn (a boot's
// SessionStart rows and the rows of a turn whose Stop never ran land in the first Stop after them); only this turn's own rows stay,
// so a re-entry Stop after a block sums the same turn again.
function consumeRuns(root, sid, turnId) {
  const h = lib('hook-runtime.js', root);
  const out = { hooks_run: 0, hook_ms: 0, hook_runs: {} }; // quiet runs only (a hook that did nothing)
  if (!h || !h.runsFile) return out;
  const f = h.runsFile(sid);
  let text; try { text = fs.readFileSync(f, 'utf8'); } catch (_) { return out; }
  const keep = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    const [tid, hook, ms, event] = line.split('\t');
    if (tid === (turnId || '') && tid !== '') keep.push(line);
    const d = parseInt(ms, 10) || 0;
    out.hooks_run++; out.hook_ms += d;
    const e = out.hook_runs[hook] || (out.hook_runs[hook] = [0, 0, event || '']); e[0]++; e[1] += d;
  }
  try { fs.writeFileSync(f, keep.length ? keep.join('\n') + '\n' : ''); } catch (_) {}
  return out;
}

// ---------- the record ----------
function bypassesOf(ledger, lastText, askText, tokenMap) {
  const list = ledger.parseBypasses(lastText, tokenMap);
  const mine = String(askText || '');
  return list.map(b => Object.assign({}, b, { typed_by: mine && mine.toLowerCase().includes('[' + b.token.toLowerCase()) ? 'him' : 'me' }));
}

/**
 * record(data, o) — everything one Stop writes. data = the Stop hook's stdin JSON.
 * o.root (default ROOT) · o.stamp (test) · o.tokenMap (test) · o.noPersist (test: leave the stamp file alone)
 * Returns { rows, turn, lens, lastText, advisories, audit }.
 */
function record(data, o) {
  o = o || {};
  const root = o.root || ROOT;
  const ledger = require(path.join(root, 'domain', 'turn-ledger', 'turn-ledger.js'));
  const tc = lib('turn-context.js', root);
  const sid = data.session_id || null;
  const stamp = o.stamp !== undefined ? o.stamp : (tc && sid ? tc.readStamp(sid) : null);
  const tp = data.transcript_path || (stamp && stamp.transcript_path) || '';
  const now = new Date();
  const ask = findAsk(tp, stamp, root);
  const sinceMs = ask && ask.ts ? Date.parse(ask.ts) : (stamp && stamp.opened_ts ? Date.parse(stamp.opened_ts) - STAMP_SLACK_MS : null);
  const win = tp ? readRowsSince(tp, sinceMs) : null;
  const found = !!(win && win.rows.length);
  const an = found ? analyse(win.rows) : null;
  const turnId = stamp ? stamp.turn_id : null;
  const hookRows = Array.isArray(o.hookRows) ? o.hookRows : hookRowsForTurn(root, turnId);
  const runs = consumeRuns(root, sid, turnId);
  // hooks_run / hook_ms count every run of the turn (quiet runs from the scratch counter + acting rows); hooks_quiet holds the quiet ones only
  const hooksRun = runs.hooks_run + hookRows.length;
  const hookMs = runs.hook_ms + hookRows.reduce((a, r) => a + (Number.isFinite(r.dur_ms) ? r.dur_ms : 0), 0);
  const lastText = an ? an.lastText : '';
  const askText = ask ? ask.text : null;
  const tokenMap = o.tokenMap || ledger.loadTokenMap();
  // every assistant text of THIS turn (his prompt to now), not only the last: after a Stop block the final message may be a short
  // follow-up while the "You asked:" line and the bypass tokens sit in the message the block was about
  const turnText = an ? an.allText : '';
  const bypasses = bypassesOf(ledger, turnText, askText, tokenMap);
  const reply = replyLines(turnText);

  // tool rows: only the calls not yet written for this turn
  const written = stamp && Number.isFinite(stamp.tools_written) ? stamp.tools_written : 0;
  const toolRows = [];
  if (an && turnId) {
    an.uses.slice(written).forEach((u, k) => {
      const res = an.results[u.id];
      toolRows.push({ kind: 'tool', ts: u.ts || now.toISOString(), session_id: sid, turn_id: turnId, seq: written + k + 1, tool: u.name, target: targetOf(u), result: resultOf(res), dur_ms: durOf(u, res) });
    });
  }
  const toolNames = {}; if (an) for (const u of an.uses) toolNames[u.name] = (toolNames[u.name] || 0) + 1;
  const edits = an ? an.uses.filter(u => ['Edit', 'Write', 'NotebookEdit', 'MultiEdit'].includes(u.name)) : [];
  const filesTouched = an ? [...new Set(edits.map(u => relPath((u.input || {}).file_path || (u.input || {}).notebook_path || '', root)).filter(Boolean))].slice(0, 60) : null;
  const created = an ? [...new Set(an.uses.filter(u => u.name === 'Write' && an.results[u.id] && /created successfully/i.test(an.results[u.id].text)).map(u => relPath(u.input.file_path || '', root)))].slice(0, 60) : null;
  const retired = an ? [...new Set(an.uses.filter(u => u.name === 'Bash' || u.name === 'PowerShell').flatMap(u => retiredPaths(u.input.command)))].slice(0, 30) : null;

  // ticket: the stamp, re-attributed from the files and commands of the turn when the prompt named none
  let qa = stamp ? stamp.qa : null, phase = stamp ? stamp.phase : null, status = stamp ? stamp.status : null, qaSource = stamp ? (stamp.qa_source || null) : null;
  if (tc && tc.attribute && (!qaSource || qaSource === 'top-active') && an) {
    try { const a = tc.attribute(an.uses.map(u => JSON.stringify(u.input || {}).slice(0, 2000)).join(' '), undefined); if (a.qa && /^named/.test(a.qa_source || '')) { qa = a.qa; phase = a.phase; status = a.status; qaSource = 'tools'; } } catch (_) {}
  }

  const signal = ledger.userSignal(hookRows, stamp ? stamp.prompt_head : '');
  const n = stamp && Number.isFinite(stamp.n) ? stamp.n : null;
  const prevId = (n && n > 1 && sid) ? sid8(sid) + '-' + (n - 1) : null;
  const rev = (stamp && Number.isFinite(stamp.rev) ? stamp.rev : 0) + 1;
  const tsOpen = stamp ? stamp.opened_ts : (ask && ask.ts) || null;
  const blocked = hookRows.filter(r => r.blocked).map(r => ({ hook: r.hook, reason: String(r.reason || '').slice(0, 160) }));
  const gap = stamp && stamp.prev_closed_ts && tsOpen ? Math.round((Date.parse(tsOpen) - Date.parse(stamp.prev_closed_ts)) / 60000) : null;

  const turn = {
    kind: 'turn', ts: now.toISOString(), rev,
    session_id: sid, turn_id: turnId, prompt_id: an ? an.promptId : null, parent_turn_id: null,
    ts_open: tsOpen, ts_close: now.toISOString(), wall_ms: tsOpen ? now.getTime() - Date.parse(tsOpen) : null,
    ask: askText == null ? null : askText.slice(0, ASK_CAP), ask_truncated: askText != null && askText.length > ASK_CAP ? true : undefined,
    ask_kind: ask ? ask.kind : null, ask_matched: ask ? ask.matched : null, prompt_head: stamp ? stamp.prompt_head : null,
    restated_ask: reply.restated_ask, cause_step: reply.cause_step, change_lines: reply.change_lines, new_parts: reply.new_parts,
    quote_in_ask: reply.quote && askText ? norm(askText).toLowerCase().includes(norm(reply.quote).toLowerCase()) : null,
    model: an ? an.model : null, models: an ? an.models : null, effort: an ? an.effort : null,
    tokens: an ? an.tokens : null,
    tool_calls: an ? an.uses.length : null, tool_names: an ? toolNames : null, assistant_msgs: an ? an.assistantMsgs : null, reply_chars: an ? an.replyChars : null,
    files_touched: filesTouched, parts_created: created, parts_retired: retired,
    skills_triggered: an ? skillsTriggered(an, blocked.map(b => b.reason), o.skills || knownSkills(root)) : null,
    skills_invoked: an ? [...new Set(an.uses.filter(u => u.name === 'Skill').map(u => String((u.input || {}).skill || (u.input || {}).name || '')).filter(Boolean))] : null,
    hooks_run: hooksRun, hook_ms: hookMs, hooks_quiet: runs.hook_runs,
    gates_blocked: blocked, gates_bypassed: bypasses,
    bypass_reason_unclassified: bypasses.filter(b => !b.fp && !b.reason).length,
    suppressed: hookRows.filter(r => r.mode === 'orch-suppressed').length,
    qa, phase, status, qa_source: qaSource,
    user_signal: signal, next_signal: null,
    caused_by_turn_id: (signal === 'reask' || signal === 'correction') ? prevId : null,
    gap_since_prev_minutes: gap,
    window_truncated: win && win.truncated ? true : undefined,
  };
  const batch = toolRows.concat([turn]);
  if (rev === 1 && prevId && (signal === 'reask' || signal === 'correction' || signal === 'nod')) batch.push({ kind: 'signal', session_id: sid, turn_id: prevId, next_signal: signal, by_turn_id: turnId });
  let wrote = []; try { wrote = appendRows(root, batch); } catch (_) {}
  const rows = wrote.map(w => w.row);

  // self-audit: read the turn row back from the file (system-design Rule 16)
  let audit = 'skip';
  const w = wrote.find(x => x.row.kind === 'turn');
  if (w) {
    const back = parseLines(readTail(w.file, 64 * 1024)).some(r => r.event_id === w.row.event_id && r.kind === 'turn');
    audit = back ? 'pass' : 'fail';
    if (!back) { try { fs.appendFileSync(path.join(root, 'domain', 'turn-log', 'log.jsonl'), JSON.stringify({ ts: now.toISOString(), outcome: 'fail', reason: 'turn row not found after append', turn_id: turnId }) + '\n'); } catch (_) {} }
  }

  // persist the stamp: closed_ts (next turn's gap), rev, tools_written
  if (stamp && tc && sid && !o.noPersist) {
    try { fs.writeFileSync(tc.stampPath(sid), JSON.stringify(Object.assign({}, stamp, { closed_ts: turn.ts_close, rev, tools_written: written + toolRows.length }))); } catch (_) {}
  }
  pruneStamps(root, sid);

  // goal-lens and wrong-fix advisories belong to the first Stop of a turn only
  const lens = ledger.goalLens(hookRows, lastText, turnId, root);
  const advisories = rev === 1 ? ledger.advisoryLines(lens, qa, lastText) : [];
  return { rows, turn, toolRows, lens, lastText, advisories, audit };
}

// current-turn-<sid8>.json is a live stamp, not a record: remove other sessions' stamps untouched for 3 days
function pruneStamps(root, keepSid) {
  const dir = path.join(root || ROOT, 'system', 'telemetry');
  let names = []; try { names = fs.readdirSync(dir); } catch (_) { return 0; }
  let n = 0;
  const keep = keepSid ? 'current-turn-' + sid8(keepSid) : null;
  for (const f of names) {
    if (!/^current-turn-.*\.json(\.lock)?$/.test(f) || (keep && f.startsWith(keep))) continue;
    try { const p = path.join(dir, f); if (Date.now() - fs.statSync(p).mtimeMs > 3 * 86400000) { fs.unlinkSync(p); n++; } } catch (_) {}
  }
  return n;
}

module.exports = { record, appendRow, appendRows, logFile, logDir, machine, readRowsSince, findAsk, analyse, targetOf, resultOf, durOf, retiredPaths, skillsTriggered, replyLines, consumeRuns, hookRowsForTurn, pruneStamps, parseLines, readTail, sid8, ROOT };
