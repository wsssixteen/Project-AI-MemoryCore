#!/usr/bin/env node
'use strict';

/**
 * eval.js — behavioural fixtures for live-action-safety-gate.
 * Asserts the hook BLOCKS (exit 2) real live-action commands and ALLOWS (exit 0)
 * dry/safe/approved ones. Run: node domain/live-action-safety-gate/eval.js
 */

const { spawnSync } = require('child_process');
const path = require('path');

const HOOK = path.join(__dirname, 'live-action-safety.check.hook.js');

function run(command, tool_name = 'Bash') {
  const payload = JSON.stringify({ tool_name, tool_input: { command } });
  const r = spawnSync(process.execPath, [HOOK], { input: payload, encoding: 'utf8' });
  return { code: r.status, err: r.stderr || '' };
}

const CASES = [
  // [name, command, expectedExit]  2 = blocked, 0 = allowed
  ['blocks bare live clock-in run',            'node run.js', 2],
  ['blocks headless live run',                 'node run.js --headless', 2],
  ['blocks the exact 00:22 incident command',  'node run.js --headless --now', 2],
  ['blocks cd-then-run form',                  'cd /d E:\\Dev\\scripts\\PymTime && node run.js', 2],
  ['blocks attendance.js live run',            'node attendance.js', 2],
  ['blocks pymclaims live run',                'node pymclaims.js', 2],
  ['blocks PowerShell-tool live run',          'node run.js --headless', 2],
  ['allows --dry run',                         'node run.js --dry', 0],
  ['allows --dry with other flags',            'node run.js --headful --dry', 0],
  ['allows syntax check',                      'node --check run.js', 0],
  ['allows the self-test suite',               'node _selftest.js', 0],
  ['allows --help',                            'node run.js --help', 0],
  ['allows --status',                          'node run.js --status', 0],
  ['allows explicit approval token',           'node run.js --live [live-action-approved: scheduled production run]', 0],
  ['ignores unrelated commands',               'git status', 0],
  ['ignores node on other scripts',            'node setup.js', 0],
  ['ignores non-Bash tools',                   'node run.js', 0]
];

let pass = 0, fail = 0;
for (const [name, cmd, expected] of CASES) {
  const tool = name.includes('PowerShell-tool') ? 'PowerShell' : name.includes('non-Bash') ? 'Read' : 'Bash';
  const { code } = run(cmd, tool);
  const ok = code === expected;
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${name}  (exit ${code}, expected ${expected})`);
  ok ? pass++ : fail++;
}

// effect check: the block message must actually render the rule
const blocked = run('node run.js');
const hasRule = /safety gate comes BEFORE the first test run/.test(blocked.err) && /live-action-approved/.test(blocked.err);
console.log(`${hasRule ? '[PASS]' : '[FAIL]'} block message renders the rule + bypass token`);
hasRule ? pass++ : fail++;

console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
