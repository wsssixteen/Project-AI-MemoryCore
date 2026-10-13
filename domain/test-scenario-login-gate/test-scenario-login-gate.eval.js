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

const fire = (text) => spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ last_assistant_message: text }), encoding: 'utf8', timeout: 30000, env: process.env });
const pad = ' Env stg2. File MlkPenyediaanBorang4AeL1eForm.java:421. Step 1 open Utiliti. Step 2 key No LPS and Tahun, click Simpan, then Borang 4Ae.'.repeat(2);

// F2: THE REPLAY — scenario with no login → exit 2 AND the reason reaches stderr
// (2026-09-24: the block returned `reason`, runHook only prints blockReason → "No stderr output").
r = fire('Test scenario:' + pad);
check('F2 replay: scenario without login → exit 2', r.status === 2, 'exit=' + r.status);
check('F3 effect: block reason rendered on stderr', /test-scenario-login-gate/.test(r.stderr || ''), 'stderr=' + JSON.stringify(r.stderr));
r = fire('Test scenario: login nurulazura@melaka.gov.my.' + pad);
check('F4 scenario with login → exit 0', r.status === 0, 'exit=' + r.status);
r = fire('Test scenario:' + pad + ' [skip-login-gate: audit reply, no hand-back]');
check('F5 bypass → exit 0', r.status === 0, 'exit=' + r.status);
r = fire('Run sh deploy-plp.sh stag then restart.' + pad);
check('F6 deploy steps without scenario → exit 2 + stderr', r.status === 2 && /v2/.test(r.stderr || ''), 'exit=' + r.status);
r = fire('Test scenario:' + pad);
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ last_assistant_message: 'Test scenario:' + pad, stop_hook_active: true }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F7 stop_hook_active → exit 0 (no loop)', r.status === 0, 'exit=' + r.status);

// ── v4 (2026-10-08, #283751): deploy card → Test scenario — <env> → Redmine handover ──
const CARD = 'DEPLOY 283751 to internal\nssh app@172.16.100.162\ncd deployment-scripts/mlit\nsh deploy-pelupusan.sh\n';
const SCEN = '\n## Test scenario — internal\n| Login | Screen | Do | Expect |\n|---|---|---|---|\n| saffuanh@melaka.gov.my | Penyediaan Permit Khas | click Papar Jadual VIII | (6) (7) (8) print |\n';
const HAND = '\n## Redmine handover\n| Root cause | Borang tidak ambil syarat tambahan. |\n| Solution | Borang kini papar syarat tambahan. |\nSalam Mira, have deployed fixes to internal. Please help to verify.\n';
r = fire(CARD + SCEN + pad);
check('V4-1 REPLAY #283751: deploy card + scenario but NO Redmine handover → exit 2 (v4)', r.status === 2 && /v4/.test(r.stderr || '') && /Redmine handover/.test(r.stderr || ''), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 160));
r = fire(CARD + SCEN + HAND + pad);
check('V4-2 deploy card → Test scenario — internal → Redmine handover passes', r.status === 0, 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 200));
r = fire(CARD + SCEN.replace(' — internal', '') + HAND + pad);
check('V4-3 Test scenario heading with no env → exit 2', r.status === 2 && /env/.test(r.stderr || ''), 'exit=' + r.status);
r = fire(CARD + HAND + SCEN + pad);
check('V4-4 Redmine handover placed before the Test scenario → exit 2', r.status === 2 && /AFTER the Test scenario/.test(r.stderr || ''), 'exit=' + r.status);
r = fire(SCEN + CARD + HAND + pad);
check('V4-5 Test scenario placed before the deploy steps → exit 2', r.status === 2 && /AFTER the deploy steps/.test(r.stderr || ''), 'exit=' + r.status);
r = fire(CARD + SCEN + HAND.replace(/\| Solution[^\n]*\n/, '') + pad);
check('V4-6 handover with no Solution row → exit 2', r.status === 2 && /Solution/.test(r.stderr || ''), 'exit=' + r.status);
r = fire(CARD + SCEN + pad + ' [skip-handover-gate: deploy for a colleague, no ticket of ours]');
check('V4-7 bypass token → exit 0', r.status === 0, 'exit=' + r.status);
r = fire('Test scenario: login nurulazura@melaka.gov.my.' + pad);
check('V4-8 a plain test scenario with no deploy steps is untouched by v4', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ntest-scenario-login-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
