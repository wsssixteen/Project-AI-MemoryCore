#!/usr/bin/env node
// redmine-upload-path.eval.js — replay eval (born WITH the component).
// Replay case: 286462 2026-10-27: BA screenshots attached to Redmine straight from 1. Brief.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'redmine-upload-path.check.hook.js');
const { allowed, decide } = require(HOOK);
const T = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka\\321. ES #286462 - Pelupusan - PRBB';
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);
check('F2 replay 286462: upload from 1. Brief blocks', decide([T + '\\1. Brief\\Screenshot_201.png']).block === true);
check('F3 upload from 2. Fix passes', decide([T + '\\2. Fix\\1. Maklumat Tapak - Plot 3.png']).block === false);
check('F4 upload from a Rework root passes', allowed(T + '\\3. Rework\\1. After fix.png') === true);
check('F5 upload from Rework\\Brief blocks', allowed(T + '\\3. Rework\\Brief\\ba.png') === false);
check('F6 upload from a scratch folder blocks', decide(['C:\\Users\\Ridhwan\\AppData\\Local\\Temp\\x.png']).block === true);
check('F7 mixed list blocks and names only the bad one', (() => { const d = decide([T + '\\2. Fix\\a.png', T + '\\1. Brief\\b.png']); return d.block && d.bad.length === 1; })());
check('F8 bypass token passes', decide([T + '\\1. Brief\\b.png'], '[skip-upload-path: miya asked to attach the BA original]').block === false);
check('F9 forward slashes still checked', allowed(T.replace(/\\/g, '/') + '/2. Fix/a.jrxml') === true);
check('F10 malformed stdin does not block', spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8', timeout: 30000, env: process.env }).status === 0);
// Adversarial verdicts: own help text in transcript = handled (bypass needs the full token) · malformed stdin = F10 ·
// worktree vs main = ROOT fallback + require guarded · bundle dispatch = not bundled · empty paths = no fire ·
// a file in 2. Fix subfolder = blocked on purpose (only the cycle-folder root is the fact-check home).

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nredmine-upload-path.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
