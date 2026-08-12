/**
 * eval.js — behavioural eval for staging-schema-tracker.js (miya /goal 2026-08-10)
 *
 * Verifies the three measurable behaviours:
 *   1. ENV/TEST prompt → injects the live target + a standalone verdict.
 *   2. SWITCH prompt   → rewrites system/melaka-env-state.json to the new schema + confirms.
 *   3. Neither         → silent (no stdout).
 *
 * Non-destructive: backs up the real state file and restores it at the end.
 * Run: node domain/staging-schema-tracker/eval.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..', '..');
const HOOK = path.join(REPO, '.claude', 'hooks', 'staging-schema-tracker.js');
const STATE = path.join(REPO, 'system', 'melaka-env-state.json');

function run(prompt) {
  try {
    return execFileSync('node', [HOOK], { input: JSON.stringify({ prompt }), encoding: 'utf8' });
  } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log(`  ✅ ${name}`); } else { fail++; console.log(`  ❌ ${name}`); } };

const backup = fs.existsSync(STATE) ? fs.readFileSync(STATE, 'utf8') : null;
try {
  // 1. ENV/TEST injection (read-only)
  const envOut = run('please prepare the env for me to test');
  check('env-prompt injects live target', /Melaka staging target = stg[12]/.test(envOut));
  check('env-prompt emits a standalone verdict', /(matches|MISMATCH|not readable)/.test(envOut));

  const tsOut = run('here is the test scenario for QA-273460');
  check('test-scenario prompt injects target', /Melaka staging target = stg[12]/.test(tsOut));

  // 2. SWITCH rewrites the state file
  run('we switched to stg1 now');
  const afterSwitch = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  check('switch phrase rewrites schema to stg1', afterSwitch.melaka_staging_schema === 'stg1');
  check('switch updates mcp_server', afterSwitch.mcp_server === 'postgres-mlkstg1-pg');

  const switchOut = run('actually use stg2 from now');
  check('switch back to stg2 confirms', /Recorded: Melaka staging → stg2/.test(switchOut));

  // 3. Silent on unrelated
  const silent = run('what is the capital of France');
  check('unrelated prompt is silent', silent.trim() === '');

  // 4. Question about schema does NOT clobber the pointer
  const before = JSON.parse(fs.readFileSync(STATE, 'utf8')).melaka_staging_schema;
  run('which stg are we on?');
  const after = JSON.parse(fs.readFileSync(STATE, 'utf8')).melaka_staging_schema;
  check('question does not rewrite the pointer', before === after);
} finally {
  if (backup !== null) fs.writeFileSync(STATE, backup);
}

console.log(`\n${fail === 0 ? '✅ PASS' : '❌ FAIL'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
