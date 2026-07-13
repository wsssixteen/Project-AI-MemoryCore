#!/usr/bin/env node
// deliverable-lands-on-main.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-07-13 audit sprint: 19 commits + Domain Expansion closed on claude/ruri-310f81 while live main sat at bf8d3f2; same class as 2026-05-13 three stranded branches
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'deliverable-lands-on-main.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const fs = require('fs');
const os = require('os');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dlom-eval-'));
function transcript(text) {
  const p = path.join(TMP, 'tx-' + results.length + '.jsonl');
  fs.writeFileSync(p, JSON.stringify({ type: 'user', message: { role: 'user', content: 'x' } }) + '\n' +
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } }) + '\n');
  return p;
}
function run(text, envExtra) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ transcript_path: transcript(text), stop_hook_active: false }),
    encoding: 'utf8', timeout: 30000, env: { ...process.env, ...envExtra },
  });
}
const BANNER = '═══ [ Domain Expansion — closed ] ═══\nBarrier settles. sprint COMPLETE.';

// F1: no close-signal → pass
let r = run('just a normal working reply with nothing final about it', { DLOM_BRANCH: 'claude/x', DLOM_AHEAD: '5' });
check('F1 no close-signal passes', r.status === 0, 'exit=' + r.status);

// F2 REPLAY: close banner on a non-main branch with unmerged commits → BLOCK (exit 2)
r = run(BANNER, { DLOM_BRANCH: 'claude/ruri-310f81', DLOM_AHEAD: '19' });
check('F2 stranded close BLOCKED (exit 2)', r.status === 2, 'exit=' + r.status);
check('F2 reason names main + commit count', /NOT on main/.test(r.stderr) && /19 commit/.test(r.stderr), (r.stderr || '').slice(0, 120));

// F3: close on main → pass
r = run(BANNER, { DLOM_BRANCH: 'main', DLOM_AHEAD: '0' });
check('F3 close on main passes', r.status === 0, 'exit=' + r.status);

// F4: non-main but nothing ahead → pass
r = run(BANNER, { DLOM_BRANCH: 'claude/x', DLOM_AHEAD: '0' });
check('F4 non-main with 0 ahead passes', r.status === 0, 'exit=' + r.status);

// F5: bypass token → pass (bypass recorded in telemetry)
r = run(BANNER + '\n[skip-lands-on-main: handoff block item 1 carries the push]', { DLOM_BRANCH: 'claude/x', DLOM_AHEAD: '5' });
check('F5 bypass token passes', r.status === 0, 'exit=' + r.status);

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ndeliverable-lands-on-main.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
