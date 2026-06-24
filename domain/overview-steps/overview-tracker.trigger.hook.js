/**
 * overview-tracker.trigger.hook.js — UserPromptSubmit hook
 * Power: domain/overview-steps/
 *
 * PURPOSE (みや 2026-06-24): inject the active ticket's OVERVIEW STEPS + % done every
 *   turn, so it is shown at the end of every turn until complete.
 * STATE: domain/overview-steps/state/<ticket>.json
 *   = { ticket, steps: [ {n, label, status} ] }, status ∈ done|partial|todo.
 *   % = (done + 0.5*partial) / total. Any state file with % < 100 is injected.
 * UPDATE: edit the state file's step statuses as work progresses (the hook reads it).
 * FAIL-OPEN: error → exit 0.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');
const STATE = path.resolve(__dirname, 'state');

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

let input = '';
process.stdin.resume(); process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    JSON.parse(input || '{}'); // validate (prompt unused; fires every turn while state exists)
    let files = [];
    try { files = fs.readdirSync(STATE).filter(f => f.endsWith('.json')); } catch (_) { process.exit(0); }
    const out = [];
    const ic = { done: '✓', partial: '◐', todo: '⬜' };
    for (const f of files) {
      let s; try { s = JSON.parse(fs.readFileSync(path.join(STATE, f), 'utf8')); } catch (_) { continue; }
      if (!s.steps || !s.steps.length) continue;
      const done = s.steps.filter(x => x.status === 'done').length;
      const part = s.steps.filter(x => x.status === 'partial').length;
      const pct = Math.round((done + 0.5 * part) / s.steps.length * 100);
      if (pct >= 100) continue;
      out.push('📋 OVERVIEW — ' + (s.ticket || f) + '  (' + pct + '% done) — SHOW this at turn-end + update the state file:');
      for (const x of s.steps) out.push('   ' + (ic[x.status] || '⬜') + ' ' + x.n + '. ' + x.label);
    }
    if (!out.length) process.exit(0);
    log({ action: 'fired', files: files.length });
    process.stdout.write(JSON.stringify({ additionalContext: out.join('\n') }));
    process.exit(0);
  } catch (e) { process.exit(0); }
});
