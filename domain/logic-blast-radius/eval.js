#!/usr/bin/env node
/**
 * eval.js — smoke test for logic-blast-radius.discipline.hook.js (v2, quest-independent)
 *
 * Fixture-driven: writes temp transcript files under the OS temp dir, spawns the
 * hook via child_process.spawnSync with PreToolUse JSON on stdin, asserts BOTH
 * exit behavior AND output content (fire check + effect check).
 *
 * Fixture 6 proves quest-independence: the v2 hook no longer reads quest/active.txt
 * at all, so it denies regardless of any active.txt presence or content.
 *
 * Run: node domain/logic-blast-radius/eval.js
 * Exit: 0 = all 6 pass, 1 = any fail
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK = path.join(__dirname, 'logic-blast-radius.discipline.hook.js');

const STATEFUL_PATH =
  'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\melaka\\MlkMaklumatTanahForm.java';
const NON_ETANAH_PATH =
  'E:\\Projects\\Other\\some-app\\src\\main\\java\\com\\acme\\CustomerForm.java';
const NON_STATEFUL_PATH =
  'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\melaka\\SomeConstant.java';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lbr-eval-'));
const logPath = path.join(tmpRoot, 'eval-log.jsonl');

function makeTranscript(name, content) {
  const p = path.join(tmpRoot, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

const T_NO_BANNER = makeTranscript(
  't-no-banner.txt',
  'Session chatter. Scout done, Recon done. About to edit the form init method now.'
);
const T_WITH_BANNER = makeTranscript(
  't-with-banner.txt',
  'Rubric complete.\n═══ LOGIC BLAST RADIUS ═══\n| Scenario | Change fires? | Outcome | Safe? | Evidence |\n| init | yes | ok | yes | Form.java:42 |\n'
);
const T_WITH_BYPASS = makeTranscript(
  't-with-bypass.txt',
  'Audit-mode edit ahead. [skip-logic-blast: test] Proceeding with the compliance edit.'
);
const T_NO_BANNER_2 = makeTranscript(
  't-no-banner-2.txt',
  'Ad-hoc fix outside any quest. No matrix emitted, no active quest anywhere.'
);

function runHook(filePath, transcriptPath) {
  const stdin = JSON.stringify({
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: filePath },
    transcript_path: transcriptPath,
  });
  const r = spawnSync('node', [HOOK], {
    input: stdin,
    encoding: 'utf8',
    timeout: 10000,
    env: Object.assign({}, process.env, { LOGIC_BLAST_LOG: logPath }),
  });
  const raw = (r.stdout || '').trim();
  let parsed = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch (_) {}
  const denied =
    !!(parsed &&
      parsed.hookSpecificOutput &&
      parsed.hookSpecificOutput.permissionDecision === 'deny');
  const reason = denied ? parsed.hookSpecificOutput.permissionDecisionReason || '' : '';
  return { raw, parsed, denied, reason, exitCode: r.status, stderr: (r.stderr || '').trim() };
}

const tests = [
  {
    name: '1. stateful etanah .java + NO banner → DENY, reason mentions LOGIC BLAST RADIUS',
    run: () => runHook(STATEFUL_PATH, T_NO_BANNER),
    check: (r) =>
      r.exitCode === 0 && r.denied && /LOGIC BLAST RADIUS/i.test(r.reason),
  },
  {
    name: '2. stateful etanah .java + banner present → ALLOW (no deny)',
    run: () => runHook(STATEFUL_PATH, T_WITH_BANNER),
    check: (r) => r.exitCode === 0 && !r.denied,
  },
  {
    name: '3. stateful etanah .java + [skip-logic-blast: test] → ALLOW',
    run: () => runHook(STATEFUL_PATH, T_WITH_BYPASS),
    check: (r) => r.exitCode === 0 && !r.denied,
  },
  {
    name: '4. non-etanah .java path → silent exit 0, no output',
    run: () => runHook(NON_ETANAH_PATH, T_NO_BANNER),
    check: (r) => r.exitCode === 0 && r.raw === '',
  },
  {
    name: '5. etanah .java but non-stateful filename (SomeConstant.java) → silent',
    run: () => runHook(NON_STATEFUL_PATH, T_NO_BANNER),
    check: (r) => r.exitCode === 0 && r.raw === '',
  },
  {
    name: '6. NO quest/active.txt anywhere → STILL denies (quest-independence, v2)',
    // v2 hook does not read quest/active.txt at all; run from a bare temp cwd
    // that contains no quest folder to prove no quest context is consulted.
    run: () => {
      const bareCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'lbr-noquest-'));
      const stdin = JSON.stringify({
        hook_event_name: 'PreToolUse',
        tool_name: 'Edit',
        tool_input: { file_path: STATEFUL_PATH },
        transcript_path: T_NO_BANNER_2,
      });
      const r = spawnSync('node', [HOOK], {
        input: stdin,
        encoding: 'utf8',
        timeout: 10000,
        cwd: bareCwd,
        env: Object.assign({}, process.env, { LOGIC_BLAST_LOG: logPath }),
      });
      fs.rmSync(bareCwd, { recursive: true, force: true });
      const raw = (r.stdout || '').trim();
      let parsed = null;
      try {
        parsed = raw ? JSON.parse(raw) : null;
      } catch (_) {}
      const denied =
        !!(parsed &&
          parsed.hookSpecificOutput &&
          parsed.hookSpecificOutput.permissionDecision === 'deny');
      const reason = denied ? parsed.hookSpecificOutput.permissionDecisionReason || '' : '';
      return { raw, parsed, denied, reason, exitCode: r.status, stderr: (r.stderr || '').trim() };
    },
    check: (r) =>
      r.exitCode === 0 && r.denied && /LOGIC BLAST RADIUS/i.test(r.reason),
  },
];

let pass = 0;
let fail = 0;
console.log('\n===== logic-blast-radius eval results =====');
for (const t of tests) {
  let r;
  let ok = false;
  try {
    r = t.run();
    ok = t.check(r);
  } catch (e) {
    r = { raw: '', denied: false, reason: '', exitCode: -1, stderr: String(e) };
  }
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${t.name}`);
  if (!ok || process.env.VERBOSE) {
    console.log(
      `       exit=${r.exitCode} denied=${r.denied} out=${(r.raw || '(none)').slice(0, 120)}`
    );
    if (r.stderr) console.log(`       stderr: ${r.stderr.slice(0, 120)}`);
  }
}

fs.rmSync(tmpRoot, { recursive: true, force: true });

console.log(`\nTotal: ${pass}/${tests.length} pass · ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
