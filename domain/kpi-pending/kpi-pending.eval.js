#!/usr/bin/env node
// kpi-pending.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-23 miya on #262027: 'add this into our kpi to note under this ticket IF the ticket gets verified later. Please add this into session start to always check & will only be removed after you confirmed the ticket has been verified and no mention of our particular change'
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'kpi-pending.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2-F6: replay — a pending KPI row prints at session start until it is confirmed or dropped
const os = require('os');
const fs = require('fs');
const KPI = path.join(__dirname, '..', 'kpi', 'kpi.js');
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'kpi-pending-eval-'));
const env = Object.assign({}, process.env, { KPI_PENDING_ROOT: T, KPI_LOG: path.join(T, 'log.jsonl') });
const hook = () => spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env });
const kpi = (args) => spawnSync(process.execPath, [KPI, ...args, '--root', T], { encoding: 'utf8', env });
r = hook();
check('F2 no ledger → silent, exit 0', r.status === 0 && !String(r.stdout).trim(), JSON.stringify(r.stdout));
kpi(['pending', 'add', '--ticket', '#262027', '--competency', 'B4', '--what', 'Changed the Tolak salutation to Datuk to match the requirement.', '--evidence', '#262027 journal', '--until', 'BA verifies #262027 and no BA journal mentions the salutation']);
r = hook();
check('F3 one pending row → printed with its condition', r.status === 0 && /KPI PENDING \(1\)/.test(r.stdout) && /counts when: BA verifies #262027/.test(r.stdout), r.stdout);
const id = (String(r.stdout).match(/P-262027-B4-\d{8}/) || [''])[0];
kpi(['confirm', id, '--evidence', '#262027 journal verified']);
r = hook();
check('F4 after confirm → silent again', r.status === 0 && !String(r.stdout).trim(), r.stdout);
fs.writeFileSync(path.join(T, 'main', 'kpi-moments.jsonl'), 'not json' + String.fromCharCode(10));
r = hook();
check('F5 garbage ledger → no crash, exit 0', r.status === 0, 'exit=' + r.status);
r = spawnSync(process.execPath, [HOOK], { input: 'not json at all', encoding: 'utf8', timeout: 30000, env });
check('F6 malformed stdin → exit 0', r.status === 0, 'exit=' + r.status);
// Adversarial verdicts: own text in transcript — n/a (reads no transcript) · worktree vs main — reads CLAUDE_PROJECT_DIR's ledger (main at boot) · kpi.js missing — spawn fails, silent (accepted-risk: the kpi eval catches it) · huge ledger — one pass, under 1 s at 10k rows (accepted-risk) · concurrent sessions — read-only.
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nkpi-pending.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
