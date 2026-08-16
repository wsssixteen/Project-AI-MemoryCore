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
const { lookup } = require(path.join(__dirname, 'lookup.js'));
const LOG = path.join(__dirname, 'log.jsonl');
function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

runHook({ name: 'bug-db', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const prompt = String(data.prompt || '');
  if (!/#?\d{6}\b/.test(prompt)) return { fired: false }; // narrow trigger: ticket engagement only
  let hits = [];
  try { hits = lookup(prompt, 3); } catch (_) { return { fired: false }; }
  if (!hits.length) { log({ action: 'no-hits', prompt: prompt.slice(0, 120) }); return { fired: false }; }
  log({ action: 'injected', hits: hits.map(h => h.source), prompt: prompt.slice(0, 120) });
  const lines = ['🐛 bug-db: ' + hits.length + ' similar past bug(s) — read the source section BEFORE fresh tracing:'];
  for (const h of hits) {
    lines.push('  [' + h.score + '] ' + h.title);
    lines.push('      → projects/coding-projects/active/etanah-knowledge/melaka/' + h.source + ' · matched: ' + h.why.join(', '));
  }
  lines.push('  (index: bug-db-index.jsonl · rebuild after bestiary append: node domain/bug-db/build-index.js)');
  return { fired: true, blocked: false, contextOut: lines.join('\n') + '\n' };
});
