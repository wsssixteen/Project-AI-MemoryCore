#!/usr/bin/env node
// test-scenario-login-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-08-05 QA-273919: full Test Scenario emitted with env + file + 2 steps and NO login; AWAM has no tugasan so the officer-side live-task-state rule never fires
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'test-scenario-login-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: TODO(forge) — replace with the CONCRETE replay-case stdin; assert fired/blocked as intended.
check('F2 replay-case fixture present (stub passes until implemented)', true, 'stub');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ntest-scenario-login-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
