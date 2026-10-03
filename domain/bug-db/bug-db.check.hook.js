#!/usr/bin/env node
// bug-db.check.hook.js — born via core/forge.js (2026-08-16), implemented 2026-08-17
// TRIGGER: prompt mentions a 6-digit ticket number (same predicate family as ticket-gate)
// ACTION: score the prompt against the structured bug index (etanah-knowledge/melaka/
//   bug-db-index.jsonl, built by build-index.js from BUG-BESTIARY.md) and inject the top-3
//   similar past bugs — Phase 0 starts already knowing "we've seen this shape" (miya 2026-08-17).
// Fail-open everywhere: no index / no hits / any error = silent pass-through, zero tokens added.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
// state-scoped: yes — keyed by state via lib/states.js (2026-10-03, Terengganu support): the ticket's
// quest/active.txt block (state= / task_folder), then a permohonan prefix in the prompt, pick the state.
// A resolved state is handed to lookup.js through ETANAH_STATE (its documented input; this hook is its own
// process), so a non-reference ticket is scored against ITS index only — an absent index is lookup.js's silent
// no-hits. Nothing resolves = the reference-state index, as before.
const states = require(path.join(__dirname, '..', '..', 'lib', 'states.js'));
const ACTIVE = process.env.BUG_DB_ACTIVE_TXT || path.join(states.mainRoot(), 'quest', 'active.txt'); // env override = eval-fixture path
const LOG = path.join(__dirname, 'log.jsonl');
function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

// Ticket number in the prompt → its qa= block (same split as .claude/hooks/ticket-gate.js readQAState).
function activeBlockFor(prompt) {
  let text; try { text = fs.readFileSync(ACTIVE, 'utf8'); } catch (_) { return null; }
  const blocks = text.split(/^(?=qa=)/m);
  for (const n of prompt.match(/\b\d{4,7}\b/g) || []) {
    const head = new RegExp('^qa=(?:QA-)?' + n + '\\b');
    const b = blocks.find(x => head.test(x));
    if (b) return b;
  }
  return null;
}

runHook({ name: 'bug-db', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const prompt = String(data.prompt || '');
  if (!/#?\d{6}\b/.test(prompt)) return { fired: false }; // narrow trigger: ticket engagement only
  let hits = [];
  let st = { state: null, record: states.get(states.reference()) };
  try {
    const r = states.resolve({ activeBlock: activeBlockFor(prompt), text: prompt });
    if (r.state) { st = r; process.env.ETANAH_STATE = r.state; }
    hits = require(path.join(__dirname, 'lookup.js')).lookup(prompt, 3);
  } catch (_) { return { fired: false }; }
  if (!hits.length) { log({ action: 'no-hits', prompt: prompt.slice(0, 120) }); return { fired: false }; }
  log({ action: 'injected', hits: hits.map(h => h.source), prompt: prompt.slice(0, 120) });
  const lines = ['🐛 bug-db: ' + hits.length + ' similar past bug(s) — read the source section BEFORE fresh tracing:'];
  for (const h of hits) {
    lines.push('  [' + h.score + '] ' + h.title);
    lines.push('      → projects/coding-projects/active/etanah-knowledge/' + st.record.knowledge_dir + '/' + h.source + ' · matched: ' + h.why.join(', '));
  }
  lines.push('  (index: bug-db-index.jsonl · rebuild after bestiary append: node domain/bug-db/build-index.js' + (st.state && st.state !== states.reference() ? ' --state ' + st.state : '') + ')');
  return { fired: true, blocked: false, contextOut: lines.join('\n') + '\n' };
});
