#!/usr/bin/env node
// branch-guard.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: QA-274745 fix landed on mlk/int-env 845 commits off master, blocking server switch
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'branch-guard.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// Replay-case + logic: pure decide() (branch supplied, no live git → deterministic).
const { decide } = require('./branch-guard.check.hook.js');
const PLP = 'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\PelupusanService.java';
const SPOC = 'E:\\Projects\\Melaka\\etanah-spoc-hasil\\src\\main\\java\\X.java';
check('F2 replay: pelupusan on mlk/int-env → BLOCK', decide(PLP, 'mlk/int-env', '').block === true, 'the QA-274745 slip');
check('F3 pelupusan on mlk/master → pass', decide(PLP, 'mlk/master', '').block === false);
check('F4 pelupusan on ticket branch → BLOCK', decide(PLP, 'mlk/esokongan/274745', '').block === true);
check('F5 spoc-hasil on master → pass (its trunk)', decide(SPOC, 'master', '').block === false);
check('F6 spoc-hasil on mlk/master → BLOCK', decide(SPOC, 'mlk/master', '').block === true);
check('F7 bypass token → pass', decide(PLP, 'mlk/int-env', '[skip-branch-check: intentional]').block === false);
check('F8 non-etanah file → pass', decide('C:\\repo\\foo.js', 'x', '').block === false);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nbranch-guard.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
