#!/usr/bin/env node
// compile-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: QA-275456 2026-08-18 — fix used mh.getBandar() (MaklumatHakmilik has none);
// never compiled; reported tested-PASSED from a green DB read; int-env BUILD failed; mlit DOWN.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const { decide } = require('./compile-gate.check.hook.js');
const HOOK = path.join(__dirname, 'compile-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean/empty input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2 (replay): a git commit in etanah-pelupusan must NOT pass on decide() alone — it must route to verify (block===null)
const d1 = decide('cd "E:/Projects/Melaka/etanah-pelupusan" && git commit -m "fix"', '');
check('F2 etanah commit routes to verify (block===null)', d1.block === null && d1.mod === 'etanah-pelupusan', JSON.stringify(d1));

// F3: bypass token in the turn → no block
const d2 = decide('cd "E:/Projects/Melaka/etanah-awam" && git commit -m "x"', 'ok [skip-compile-gate: docs only]');
check('F3 bypass token → no block', d2.block === false && d2.bypass === true, JSON.stringify(d2));

// F4: a non-commit command (status) → no block
const d3 = decide('cd "E:/Projects/Melaka/etanah-pelupusan" && git status', '');
check('F4 non-commit → pass', d3.block === false, JSON.stringify(d3));

// F5: a MemoryCore (non-etanah) commit → no block
const d4 = decide('git commit -m "DE save"', '');
check('F5 non-etanah commit → pass', d4.block === false, JSON.stringify(d4));

// F6 (regression — the self-inflicted false positive): a MemoryCore commit whose MESSAGE mentions
// etanah-pelupusan must NOT block — only a cd/-C INTO an etanah repo counts.
const d5 = decide('cd "C:/Users/x/MemoryCore/.claude/worktrees/keen" && git commit -m "build compile-gate for etanah-pelupusan commits"', '');
check('F6 message mentions etanah but cwd is MemoryCore → pass', d5.block === false, JSON.stringify(d5));

// F7: git -C into an etanah repo also detected
const d6 = decide('git -C "E:/Projects/Melaka/etanah-common" commit -m "bump"', '');
check('F7 git -C etanah repo routes to verify', d6.block === null && d6.mod === 'etanah-common', JSON.stringify(d6));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ncompile-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
