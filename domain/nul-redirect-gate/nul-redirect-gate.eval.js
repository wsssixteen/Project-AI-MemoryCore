#!/usr/bin/env node
// nul-redirect-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-09-25 a Git Bash command ran ssh-keyscan 10.16.63.27 > NUL inside worktree colleague-cr-issue-ed8731; Git Bash wrote a real file named NUL; OneDrive popped Rename 1 item on 2026-09-28
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'nul-redirect-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function run(stdin) {
  return spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env });
}
function bash(command) { return run(JSON.stringify({ tool_name: 'Bash', tool_input: { command } })); }
function blocks(n, command) {
  const r = bash(command);
  check(n + ' BLOCKS', r.status === 2 && /nul-redirect-gate/.test(r.stderr || ''), 'exit=' + r.status + ' stderr=' + (r.stderr || '').slice(0, 80));
}
function passes(n, command) {
  const r = bash(command);
  check(n + ' passes', r.status === 0, 'exit=' + r.status);
}

// F1: clean input → must NOT block
let r = run('{}');
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: the founding replay case — blocks AND the reason reaches stderr (effect check)
r = bash('ssh-keyscan 10.16.63.27 > NUL');
check('F2 replay ssh-keyscan > NUL BLOCKS', r.status === 2, 'exit=' + r.status);
check('F2 block reason names /dev/null', /\/dev\/null/.test(r.stderr || ''), (r.stderr || '').slice(0, 120));

// ═══ ADVERSARIAL SCENARIOS (system-design Rule 12) ═══
blocks('S1 lower-case 2>nul', 'git fetch 2>nul');
blocks('S2 no space >NUL', 'echo hi >NUL');
blocks('S3 append >> nul', 'ls >> nul');
blocks('S4 &> NUL', 'npm test &> NUL');
blocks('S5 1> Nul mixed case', 'cmd 1> Nul');
blocks('S6 after pipe', 'cat a | grep b > nul && echo ok');
blocks('S7 multi-line command', 'cd x\nmake 2>NUL\necho done');
blocks('S8 empty bypass reason still blocks', 'ls > nul [skip-nul-redirect: ]');
passes('S9 /dev/null', 'git fetch 2>/dev/null');
passes('S10 nul.txt filename', 'echo hi > nul.txt');
passes('S11 nullable word', 'echo hi > nullable');
passes('S12 nul directory path', 'echo hi > nul/out.log');
passes('S13 quoted echo text', 'echo "use > NUL in cmd"');
passes('S14 cmd //c with quoted nul', 'cmd //c "dir >nul"');
passes('S15 grep for the word nul', 'grep -i nul file.txt');
passes('S16 2>&1 redirect', 'make 2>&1 | tee log');
passes('S17 bypass with reason', 'ls > nul [skip-nul-redirect: testing the gate itself]');
passes('S18 variable named NUL_COUNT', 'echo $NUL_COUNT > out.txt');
// S19: PowerShell tool is out of scope (PowerShell maps NUL itself)
r = run(JSON.stringify({ tool_name: 'PowerShell', tool_input: { command: 'dir > NUL' } }));
check('S19 PowerShell tool passes', r.status === 0, 'exit=' + r.status);
// S20: malformed JSON stdin fails open
r = run('not json at all');
check('S20 malformed stdin passes', r.status === 0, 'exit=' + r.status);
// S21: Bash with no command field
r = run(JSON.stringify({ tool_name: 'Bash', tool_input: {} }));
check('S21 empty command passes', r.status === 0, 'exit=' + r.status);
// S22: huge command (1 MB) still decides fast
const big = 'echo ' + 'x'.repeat(1024 * 1024) + ' > nul';
r = bash(big);
check('S22 1MB command still BLOCKS', r.status === 2, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nnul-redirect-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
