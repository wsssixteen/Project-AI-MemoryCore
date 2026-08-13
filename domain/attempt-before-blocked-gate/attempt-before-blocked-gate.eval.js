#!/usr/bin/env node
// attempt-before-blocked-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-08-13 #275009/275152 false-blocked from ls proxy; assume-not-verify 30d=25
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'attempt-before-blocked-gate.check.hook.js');

function run(reply) {
  const payload = JSON.stringify({ hook_event_name: 'Stop', reply });
  return spawnSync(process.execPath, [HOOK], { input: payload, encoding: 'utf8', timeout: 30000, env: process.env }).status;
}

const cases = [
  // [name, reply, expectedExit]  (2 = block, 0 = pass)
  ['SLIP: false-blocked from proxy (BLOCK)',
    'redmine-sync needs redmine.local.json and that config is missing from the worktree, so I cannot retrieve 275009/275152.', 2],
  ['variant: "no redmine config" (BLOCK)',
    '275009/275152 are blocked because there is no redmine config here, so redmine-sync has no api-key to pull them.', 2],
  ['variant: "postgres not available in worktree" (BLOCK)',
    'The DB is not reachable — no postgres tool loaded in this worktree, so I cannot query stg2.', 2],
  ['bypass with real failure output (PASS)',
    'I ran it: [verified-blocked: node quest/redmine-sync.js 275009 -> Error: ENOTFOUND redmine.melaka.gov.my].', 0],
  ['explicit skip token (PASS)',
    'Not a capability claim [skip-attempt-before-blocked: discussing the ticket domain state].', 0],
  ['FALSE-POS guard: domain "blocked" (PASS)',
    'The tugasan ENTRY is blocked by status_proses Gantung on aplikasi 3398208 — a workflow state.', 0],
  ['FALSE-POS guard: clean sweep reply (PASS)',
    '274914 root cause 95%: callActivity :257 omits the pembetulanPP out-mapping. One-line BPMN fix.', 0],
  ['FALSE-POS guard: "config.json empty" domain noun (PASS)',
    'The tugasan.config.json for MLK is empty {}, so routing is via BPMN formKey — I traced and confirmed it.', 0],
];

const results = [];
for (const [n, reply, expected] of cases) {
  const got = run(reply);
  results.push({ n, pass: got === expected, d: `expected ${expected} got ${got}` });
}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nattempt-before-blocked-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
