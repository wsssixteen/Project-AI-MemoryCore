#!/usr/bin/env node
// compile-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: QA-275456 2026-08-18 — fix used mh.getBandar() (MaklumatHakmilik has none);
// never compiled; reported tested-PASSED from a green DB read; int-env BUILD failed; mlit DOWN.
// v1.1.1 (2026-09-23): +F13 — a pre-v1.1 marker with no `repo` field must fail verify (was
// silently leniently passing for any clone — reviewer finding, compile-check.js v1.1.1).
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

// F8 (C8 replay — #280540 causes 4+8): decide() carries the CLONE the commit is issued from, not
// just the module name — a commit from the work clone must never be verified against a default clone.
const d7 = decide('cd "E:/Dev/etanah-work/etanah-pelupusan" && git commit -m "x"', '');
const expectRepo8 = path.resolve('E:/Dev/etanah-work/etanah-pelupusan');
check('F8 (C8) decide() carries the commit clone as repo', d7.repo === expectRepo8, JSON.stringify(d7) + ' expected ' + expectRepo8);

// F12: a relative `cd etanah-pelupusan` resolves against the cwd the hook was invoked from.
const d8 = decide('cd etanah-pelupusan && git commit -m "x"', '', 'E:/Dev/etanah-work');
const expectRepo12 = path.resolve('E:/Dev/etanah-work', 'etanah-pelupusan');
check('F12 (C8) relative cd resolves under supplied cwd', d8.repo === expectRepo12, JSON.stringify(d8) + ' expected ' + expectRepo12);

// ---- compile-check.js (C7) repo resolution ----
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');
const CHECK = path.join(__dirname, 'compile-check.js');
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'compile-gate-eval-'));
const tmpRepo = path.join(tmpRoot, 'etanah-pelupusan');
fs.mkdirSync(path.join(tmpRepo, 'src', 'main', 'java'), { recursive: true });
fs.writeFileSync(path.join(tmpRepo, 'src', 'main', 'java', 'A.java'), 'class A {}');
const tmpProj = path.join(tmpRoot, 'proj');
fs.mkdirSync(path.join(tmpProj, '.claude', 'state'), { recursive: true });
const markerFile = path.join(tmpProj, '.claude', 'state', 'compile-ok-etanah-pelupusan.json');
const env9 = { ...process.env, CLAUDE_PROJECT_DIR: tmpProj };

// F9: marker.repo === resolved --repo → verify exits 0
fs.writeFileSync(markerFile, JSON.stringify({ ok: true, ts: Date.now(), mod: 'etanah-pelupusan', repo: tmpRepo }));
const r9 = spawnSync(process.execPath, [CHECK, 'verify', 'etanah-pelupusan', '--repo', tmpRepo], { encoding: 'utf8', env: env9 });
check('F9 (C7) verify green marker, same clone → exit 0', r9.status === 0, 'exit=' + r9.status + ' ' + r9.stdout + r9.stderr);

// F10: marker.repo is a DIFFERENT clone → verify exits 1 "different clone"
const otherRepo = path.join(tmpRoot, 'etanah-pelupusan-OTHER');
fs.writeFileSync(markerFile, JSON.stringify({ ok: true, ts: Date.now(), mod: 'etanah-pelupusan', repo: otherRepo }));
const r10 = spawnSync(process.execPath, [CHECK, 'verify', 'etanah-pelupusan', '--repo', tmpRepo], { encoding: 'utf8', env: env9 });
check('F10 (C7) marker for a different clone → exit 1 "different clone"', r10.status === 1 && /different clone/i.test(r10.stderr || ''), 'exit=' + r10.status + ' ' + r10.stderr);

// F11: a .java edited AFTER the marker's ts → verify exits 1 "edited AFTER"
const oldTs = Date.now() - 60000;
fs.writeFileSync(markerFile, JSON.stringify({ ok: true, ts: oldTs, mod: 'etanah-pelupusan', repo: tmpRepo }));
fs.utimesSync(path.join(tmpRepo, 'src', 'main', 'java', 'A.java'), new Date(), new Date());
const r11 = spawnSync(process.execPath, [CHECK, 'verify', 'etanah-pelupusan', '--repo', tmpRepo], { encoding: 'utf8', env: env9 });
check('F11 (C7) .java edited after marker.ts → exit 1 "edited AFTER"', r11.status === 1 && /edited AFTER/i.test(r11.stderr || ''), 'exit=' + r11.status + ' ' + r11.stderr);

// F13 (v1.1.1, reviewer finding): a pre-v1.1 marker with NO `repo` field must FAIL verify for
// ANY clone — strict, no transitional leniency treating a missing repo as "matches everything".
fs.writeFileSync(markerFile, JSON.stringify({ ok: true, ts: Date.now(), mod: 'etanah-pelupusan' }));
const r13 = spawnSync(process.execPath, [CHECK, 'verify', 'etanah-pelupusan', '--repo', tmpRepo], { encoding: 'utf8', env: env9 });
check('F13 (v1.1.1) marker with no repo field → exit 1 "different clone"', r13.status === 1 && /different clone/i.test(r13.stderr || ''), 'exit=' + r13.status + ' ' + r13.stderr);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ncompile-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
