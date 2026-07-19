#!/usr/bin/env node
// retrieve-sync-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-07-16 #270297: retrieve-from-redmine answered by full Scout-Rubric on wrong on-disk ticket #270052 - wasted quest run, angriest correction of the week
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'retrieve-sync-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2-F7: concrete fixtures — fired = stdout carries the sync mandate.
const CASES = [
  ['F2 replay: retrieve+redmine+number', 'retrieve from redmine and start quest 270297', true],
  ['F3 retrieve+bare-6-digit', 'please retrieve 271049 and begin', true],
  ['F4 sync+ticket-word', 'sync the ticket first please', true],
  ['F5 retrieve-no-ticket-signal', 'retrieve the diary summary for me', false],
  ['F6 ticket-no-retrieve-word', 'let us start on 271049', false],
  ['F7 unrelated', 'good morning, what is next', false],
];
for (const [name, prompt, shouldFire] of CASES) {
  const rr = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000, env: process.env });
  const fired = (rr.stdout || '').includes('redmine-sync.js');
  check(name, fired === shouldFire, `fired=${fired} expected=${shouldFire}`);
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nretrieve-sync-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
