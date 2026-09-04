#!/usr/bin/env node
// staging-schema-tracker.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: QA-273460 2026-08-10 — env declared 'ready' without ever checking standalone.xml against the live stg2 target
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'staging-schema-tracker.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2..F7: behavioural — back up the real state file, restore at the end.
const fs = require('fs');
const STATE = path.join(__dirname, '..', '..', 'system', 'melaka-env-state.json');
const backup = fs.existsSync(STATE) ? fs.readFileSync(STATE, 'utf8') : null;
function run(prompt) {
  const rr = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000, env: process.env });
  return (rr.stdout || '') + (rr.stderr || '');
}
try {
  check('F2 env-prompt injects live target', /Melaka staging target = stg[12]/.test(run('please prepare the env for me to test')), 'no target line');
  check('F3 env-prompt emits a standalone verdict', /(matches|MISMATCH|not readable)/.test(run('here is the test scenario')), 'no verdict');

  run('we switched to stg1 now');
  const s1 = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  check('F4 switch rewrites schema to stg1', s1.melaka_staging_schema === 'stg1', 'schema=' + s1.melaka_staging_schema);
  check('F5 switch updates mcp_server', s1.mcp_server === 'postgres-mlkstg1-pg', 'mcp=' + s1.mcp_server);
  check('F6 switch back to stg2 confirms', /Recorded: Melaka staging → stg2/.test(run('actually use stg2 from now')), 'no confirm');

  const before = JSON.parse(fs.readFileSync(STATE, 'utf8')).melaka_staging_schema;
  run('which stg are we on?');
  const after = JSON.parse(fs.readFileSync(STATE, 'utf8')).melaka_staging_schema;
  check('F7 question does not clobber the pointer', before === after, before + '->' + after);

  check('F8 unrelated prompt is silent', run('what is the capital of France').trim() === '', 'not silent');
} finally {
  if (backup !== null) fs.writeFileSync(STATE, backup);
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nstaging-schema-tracker.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
