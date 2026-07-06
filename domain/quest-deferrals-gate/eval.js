#!/usr/bin/env node
/**
 * eval.js — smoke test for quest-deferrals-gate.discipline.hook.js
 *
 * Fixture-driven: creates a temp workspace with mock qa_docs, spawns the hook
 * with each test text over stdin, checks decisions. No real transcript I/O
 * (uses _testText + _testWorkspaceRoot injection hooks).
 *
 * Run: node domain/quest-deferrals-gate/eval.js
 * Exit: 0 = all pass, 1 = any fail
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK = path.join(__dirname, 'quest-deferrals-gate.discipline.hook.js');

function makeWorkspace(qaFiles) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qdg-eval-'));
  fs.mkdirSync(path.join(root, 'quest'), { recursive: true });
  fs.writeFileSync(path.join(root, 'quest', 'active.txt'), '');
  for (const [num, content] of Object.entries(qaFiles)) {
    const dir = path.join(root, 'projects', 'coding-projects', 'active', `QA-${num}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `QA-${num}.md`), content);
  }
  return root;
}

function runHook(text, workspaceRoot) {
  const stdin = JSON.stringify({
    _testText: text,
    _testWorkspaceRoot: workspaceRoot,
    stop_hook_active: false,
    transcript_path: '',
  });
  const r = spawnSync('node', [HOOK], { input: stdin, encoding: 'utf8', timeout: 10000 });
  const raw = (r.stdout || '').trim();
  let parsed = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch (_) {}
  return { raw, parsed, stderr: (r.stderr || '').trim(), exitCode: r.status };
}

const QA_VALID = `# QA-100001
Some content.
## Deferred to follow-up
| # | Deferral | Home |
|---|---|---|
| 1 | Follow-up item | main/todo.md Q1 Rule entry (added 2026-07-06) |
| 2 | Another follow-up | Own ticket TBD-99999 tracked in ~ETANAH-KB~ |
`;

const QA_NO_SECTION = `# QA-100002
Ship — Apply done. No deferred section here.
`;

const QA_EMPTY_HOME = `# QA-100003
## Deferred to follow-up
| # | Deferral | Home |
|---|---|---|
| 1 | Something to defer | |
`;

const QA_PLACEHOLDER_HOME = `# QA-100005
## Deferred to follow-up
| # | Deferral | Home |
|---|---|---|
| 1 | Deferral A | TBD |
| 2 | Deferral B | main/todo.md Q1 |
`;

const QA_NONE_SENTINEL = `# QA-100004
## Deferred to follow-up

_none this quest_
`;

const workspace = makeWorkspace({
  '100001': QA_VALID,
  '100002': QA_NO_SECTION,
  '100003': QA_EMPTY_HOME,
  '100004': QA_NONE_SENTINEL,
  '100005': QA_PLACEHOLDER_HOME,
});

const tests = [
  {
    name: '1. no Phase-2 signal, has QA ref → skip',
    text: 'Just discussing QA-100001 mid-quest without any close-out language, just a status update in progress.',
    expect: 'skip',
  },
  {
    name: '2. Phase-2 signal + qa_doc valid → pass (silent)',
    text: 'Starting /quest-bounty harvest for QA-100001 now that Phase 1 is complete on origin. Ready for archive hygiene next.',
    expect: 'skip',
  },
  {
    name: '3. Phase-2 signal + qa_doc missing § Deferred → BLOCK',
    text: 'Beginning phase 2 close for QA-100002 and preparing the archive hygiene move now.',
    expect: 'block',
    expectMatch: /section missing/i,
  },
  {
    name: '4. Phase-2 signal + qa_doc empty Home cell → BLOCK',
    text: 'Running /quest-bounty for QA-100003 as the Phase 2 harvest step.',
    expect: 'block',
    expectMatch: /empty\/placeholder Home cell/i,
  },
  {
    name: '5. Phase-2 signal + "_none this quest_" sentinel → pass',
    text: '/quest-bounty on QA-100004 — moving into Phase 2 archive hygiene now.',
    expect: 'skip',
  },
  {
    name: '6. Phase-2 signal + qa_doc "TBD" placeholder Home → BLOCK',
    text: '/quest-bounty starting for QA-100005 Phase 2 close.',
    expect: 'block',
    expectMatch: /placeholder Home cell/i,
  },
  {
    name: '7. Phase-2 signal + bypass token → skip',
    text: '/quest-bounty for QA-100002 [skip-deferrals-gate: known incomplete, will patch next session].',
    expect: 'skip',
  },
  {
    name: '8. Phase-2 signal + no qa_doc on disk → skip (fail-open)',
    text: 'phase 2 close for QA-999999 — running the archive move now.',
    expect: 'skip',
  },
  {
    name: '9. Phase-2 signal + BOTH a valid AND an invalid qa_doc → BLOCK on the invalid one',
    text: '/quest-bounty running for QA-100001 and QA-100002 both, Phase 2 close for the batch.',
    expect: 'block',
    expectMatch: /QA-100002/,
  },
];

let pass = 0, fail = 0;
const results = [];
for (const t of tests) {
  const r = runHook(t.text, workspace);
  const gotBlock = r.parsed && r.parsed.decision === 'block';
  const gotSkip = !r.raw;
  const gotState = gotBlock ? 'block' : (gotSkip ? 'skip' : 'other');
  const stateOk = t.expect === gotState;
  const matchOk = !t.expectMatch || (r.parsed && t.expectMatch.test(r.parsed.reason || ''));
  const passed = stateOk && matchOk;
  if (passed) pass++; else fail++;
  results.push({
    name: t.name,
    expect: t.expect,
    got: gotState,
    passed,
    snippet: (r.parsed && r.parsed.reason ? r.parsed.reason.split('\n').slice(0, 3).join(' \\n ') : '(no output)').slice(0, 150),
    stderr: r.stderr.slice(0, 80),
  });
}

fs.rmSync(workspace, { recursive: true, force: true });

console.log('\n===== quest-deferrals-gate eval results =====');
for (const r of results) {
  console.log(`  ${r.passed ? '✅' : '🔴'} ${r.name}`);
  console.log(`     expect=${r.expect}  got=${r.got}`);
  if (!r.passed || process.env.VERBOSE) console.log(`     out: ${r.snippet}`);
  if (r.stderr) console.log(`     stderr: ${r.stderr}`);
}
console.log(`\nTotal: ${pass}/${results.length} pass · ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
