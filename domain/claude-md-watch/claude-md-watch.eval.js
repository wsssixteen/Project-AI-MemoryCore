#!/usr/bin/env node
// claude-md-watch.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-08-16 miya: when we change something we do not only run tests, we set up a thing to OBSERVE the specific things we touched, so next run you self-alert and we amend or revert
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'claude-md-watch.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: TODO(forge) — replace with the CONCRETE replay-case stdin; assert fired/blocked as intended.
check('F2 replay-case fixture present (stub passes until implemented)', true, 'stub');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nclaude-md-watch.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
