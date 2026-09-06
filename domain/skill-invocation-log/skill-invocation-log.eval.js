#!/usr/bin/env node
// skill-invocation-log.eval.js — replay eval (born WITH the component).
// Replay case: the 64 skills had no invocation telemetry at all in the 2026-09-06 audit.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'skill-invocation-log.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-log-eval-'));
const LOG = path.join(TMP, 'log.jsonl');
function run(data) { return spawnSync(process.execPath, [HOOK], { input: JSON.stringify(data), encoding: 'utf8', timeout: 30000, env: process.env }); }
function rows() { try { return fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse); } catch (_) { return []; } }

let r = run({});
check('F1 empty stdin exits 0, no row', r.status === 0 && rows().length === 0, 'exit=' + r.status);
r = run({ tool_name: 'Skill', tool_input: { skill: 'quest', args: 'start QA-277532' }, session_id: 'nosuch', _testLogPath: LOG });
check('F2 Skill invocation → one row with skill + args', r.status === 0 && rows().length === 1 && rows()[0].skill === 'quest' && rows()[0].args === 'start QA-277532', JSON.stringify(rows()));
r = run({ tool_name: 'Bash', tool_input: { command: 'ls' }, _testLogPath: LOG });
check('F3 non-Skill tool → no row', r.status === 0 && rows().length === 1, 'rows=' + rows().length);
r = run({ tool_name: 'Skill', tool_input: {}, _testLogPath: LOG });
check('F4 Skill with no name → no row, exit 0', r.status === 0 && rows().length === 1, '');
r = run({ tool_name: 'Skill', tool_input: { skill: 'x'.repeat(200) }, _testLogPath: LOG });
check('F5 oversized name truncated to 80', rows()[1] && rows()[1].skill.length === 80, '');
r = run({ tool_name: 'Skill', tool_input: { skill: 'domain-expansion' }, _testLogPath: path.join(TMP, 'no-dir', 'x', 'log.jsonl') });
check('F6 unwritable log path → still exit 0 (fail-open)', r.status === 0, 'exit=' + r.status);
r = run('not json');
check('F7 malformed stdin → exit 0', r.status === 0, 'exit=' + r.status);
// Adversarial (Rule 12, 20): 1 own text in transcript n/a (no transcript read) · 2 malformed stdin F7 · 3 worktree path: ROOT via env · 4 sandbox copy: hook-runtime resolved from ROOT ·
// 5 bundle vs direct: registered direct · 6 concurrent sessions: append-only rows · 7 lib deleted: turnCtx null-guarded · 8 bypass n/a (never blocks) · 9 huge input: sliced ·
// 10 user instruction reversal: none (write-only) · 11 Skill tool renamed: rowFor returns null · 12 args with newlines: sliced string · 13 disk full: swallowed · 14 OneDrive dup log: readers glob ·
// 15 no turn stamp: turn_id null · 16 PostToolUse fires on failed skill: still logged (fact) · 17 matcher mismatch: F3 · 18 rotation mid-write: append-only · 19 hand-edit: readers tolerate · 20 name with pipes/quotes: JSON-escaped.
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nskill-invocation-log.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
