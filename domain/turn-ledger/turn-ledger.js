#!/usr/bin/env node
// turn-ledger.js — the analysis library of the per-turn judgments (born as a Stop hook via core/forge.js 2026-09-06, plan §M M3/M4/M7).
// 2026-11-10 (turn-log, stage 8 of the over-complexity audit): the WRITER moved to domain/turn-log (one file, one row per turn).
// This file keeps what is judgment, not logging: bypass tokens in the reply, his reaction (user signal), the goal lens for
// features that BLOCKED this turn, and the wrong-fix advisory. It registers nothing and writes only domain/<feature>/goal-log.jsonl.
// symptom: 2026-09-04 miya "you still haven't answered the monitoring part" — no ledger says which quest/phase a block served, whether it was true or false.
// goal: a feature that blocked a turn is judged against its goal_signal_regex without model input, and the judgment is a row in that feature's goal-log.jsonl.
// goal_signal: after a Stop that blocked a feature with a goal_signal_regex, that feature's goal-log.jsonl has a row for the turn.
// retention: keep (goal-log.jsonl is the optimization dataset).
// Fail-open: any error → nothing blocked. A monitor must never break the monitored.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const TOKEN_MAP = path.join(__dirname, 'token-map.json');
const GOAL_PROMPT_CAP = 3;

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
    out.push({ token, hook: (tokenMap || {})[token] || '?', fp: /^fp:/i.test(reason), reason });
  }
  return out;
}

function loadTokenMap() { try { return JSON.parse(fs.readFileSync(TOKEN_MAP, 'utf8')); } catch (_) { return {}; } }
function featureOf(hookName) { return String(hookName).replace(/\.(check|gate|discipline|trigger)?\.?hook$/, ''); }
function readmeKeys(feature, root) {
  const p = path.join(root || ROOT, 'domain', feature, 'README.md');
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

// M7 — goal lens for features that BLOCKED this turn. A feature with a goal_signal_regex is judged here;
// the others get one advisory line (cap 3). 2026-11-10: the prompts are no longer parked in goal-lens-pending.jsonl
// (1,250 prompts, 14 judgments in 60 days: a queue nobody answered); the advisory line is the only prompt.
function goalLens(hookRows, lastText, turnId, root) {
  const blocked = [...new Set(hookRows.filter(r => r.blocked).map(r => featureOf(r.hook)))];
  const prompts = [];
  let mechanical = 0;
  for (const feature of blocked) {
    const keys = readmeKeys(feature, root);
    if (!keys || !keys.goal) continue; // goal-less feature: no prompt, no false verdict (scenario 25)
    if (keys.regex) {
      let met = null;
      try { met = new RegExp(keys.regex, 'i').test(lastText); } catch (_) { met = null; }
      appendJsonl(path.join(root || ROOT, 'domain', feature, 'goal-log.jsonl'), { ts: new Date().toISOString(), turn_id: turnId, feature, met: met === null ? 'unknown' : (met ? 'y' : 'n'), mode: 'mechanical', evidence: turnId });
      mechanical++;
    } else if (prompts.length < GOAL_PROMPT_CAP) {
      prompts.push({ feature, goal: keys.goal });
    }
  }
  return { prompts, mechanical, blockedFeatures: blocked };
}

// The lines a first Stop prints: goal-lens prompts, and 9a (2026-09-07) a refute verdict on a known quest with no wrong-fix row today.
function advisoryLines(lens, qa, lastText, turnId) {
  const lines = lens.prompts.map(p => `goal-lens: ${p.feature} BLOCKED this turn — goal: ${p.goal}\n   Met? gap? improve? → node lib/goal-lens.js note ${p.feature} --turn ${turnId || '<turn_id>'} --met y|n|partial --gap "<what fell short>" --improve "<change that reaches the goal>"`);
  if (qa && /\b(REFUTED|refuted|reverted|not the (root )?cause|wrong fix|does not fix|did not fix)\b/.test(lastText)) {
    let hasToday = false;
    try { const wf = require(path.join(ROOT, 'lib', 'wrong-fix.js')); const p = wf.docPath(qa); const d = new Date().toISOString().slice(0, 10); hasToday = !!p && wf.readRows(fs.readFileSync(p, 'utf8')).rows.some(r => r.date === d); } catch (_) {}
    if (!hasToday) lines.push(`wrong-fix: this reply refutes a fix on ${qa} but the qa_doc has no Wrong-fixes row today → node lib/wrong-fix.js add ${qa} --was "<fix>" --why "<how refuted>" --learned "<rule>"  (Phase 2 cannot archive until every row has a verdict)`);
  }
  return lines;
}

module.exports = { parseBypasses, userSignal, goalLens, advisoryLines, loadTokenMap, stripFences, featureOf };
