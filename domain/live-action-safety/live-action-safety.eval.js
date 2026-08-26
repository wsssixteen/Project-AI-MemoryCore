#!/usr/bin/env node
// live-action-safety.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-08-27 PymTime ran node run.js at 00:22 as a test and created a REAL unremovable attendance record on miya live Protime
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'live-action-safety.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// ── fixture driver ───────────────────────────────────────────────────────────
function fire(command, tool_name = 'Bash') {
  const payload = JSON.stringify({ tool_name, tool_input: { command } });
  const r2 = spawnSync(process.execPath, [HOOK], { input: payload, encoding: 'utf8', timeout: 30000, env: process.env });
  return { code: r2.status, err: (r2.stderr || '') + (r2.stdout || '') };
}
const BLOCKED = 2, ALLOWED = 0;

// F2: THE REPLAY CASE — the exact command that made the real 00:22 record.
const replay = fire('node run.js --headless --now');
check('F2 replay case (node run.js --headless --now) is BLOCKED', replay.code === BLOCKED, 'exit=' + replay.code);
// F2b: the block must SURFACE a message that identifies the gate and warns about
// the live action (full text verified via _dbg_block.js; harness may truncate).
const replayErr = fire('node run.js --headless --now').err;
check('F2b block message surfaces the gate name + live-action warning',
  /live-action-safety/.test(replayErr) && /REAL/.test(replayErr) && /live system/.test(replayErr),
  'stderr=' + JSON.stringify(replayErr.slice(0, 140)));

// ── core behaviour ───────────────────────────────────────────────────────────
const CASES = [
  ['bare live run blocked',            'node run.js', 'Bash', BLOCKED],
  ['headless live run blocked',        'node run.js --headless', 'Bash', BLOCKED],
  ['cd-then-run blocked',              'cd /d E:\\Dev\\scripts\\PymTime && node run.js', 'Bash', BLOCKED],
  ['PowerShell tool blocked too',      'node run.js --headless', 'PowerShell', BLOCKED],
  ['attendance.js blocked',            'node attendance.js', 'Bash', BLOCKED],
  ['pymclaims.js blocked',             'node pymclaims.js', 'Bash', BLOCKED],
  ['--dry allowed',                    'node run.js --dry', 'Bash', ALLOWED],
  ['--headful --dry allowed',          'node run.js --headful --dry', 'Bash', ALLOWED],
  ['node --check allowed',             'node --check run.js', 'Bash', ALLOWED],
  ['self-test suite allowed',          'node _selftest.js', 'Bash', ALLOWED],
  ['--help allowed',                   'node run.js --help', 'Bash', ALLOWED],
  ['--status allowed',                 'node run.js --status', 'Bash', ALLOWED],
  ['approval token allows live',       'node run.js --live [live-action-approved: production schedule]', 'Bash', ALLOWED],
  ['unrelated command ignored',        'git status', 'Bash', ALLOWED],
  ['other script ignored',             'node setup.js', 'Bash', ALLOWED],
  ['non-shell tool ignored',           'node run.js', 'Read', ALLOWED]
];
for (const [name, cmd, tool, expect] of CASES) {
  const out = fire(cmd, tool);
  check(name, out.code === expect, 'exit=' + out.code + ' expected=' + expect);
}

// ── adversarial / out-of-spec (Rule 12) ──────────────────────────────────────
check('A1 malformed JSON stdin → no false block',
  spawnSync(process.execPath, [HOOK], { input: 'not-json{{', encoding: 'utf8', env: process.env }).status === ALLOWED);
check('A2 empty command → no false block', fire('').code === ALLOWED);
check('A3 missing tool_input → no false block',
  spawnSync(process.execPath, [HOOK], { input: '{"tool_name":"Bash"}', encoding: 'utf8', env: process.env }).status === ALLOWED);
check('A4 self-disarm: hook own help text quoted does NOT auto-allow a live run',
  fire('node run.js # docs mention live-action-approved usage').code === ALLOWED ? false : true,
  'quoted-token must not disarm unless real token present');
check('A5 substring safety: "rerun.js" is not run.js', fire('node rerun.js').code === ALLOWED);
check('A6 path-prefixed script still blocked', fire('node E:\\Dev\\scripts\\PymTime\\run.js').code === BLOCKED);
check('A7 uppercase variant still blocked', fire('node RUN.JS').code === BLOCKED);
check('A8 --dry anywhere in a long command allowed', fire('cd x && node run.js --headful --dry && echo ok').code === ALLOWED);
check('A9 huge command string handled', fire('node run.js ' + 'x'.repeat(50000)).code === BLOCKED);
check('A10 npm-style (not node-exec) NOT blocked', fire('npm run start -- run.js').code === ALLOWED);
// interference guards — real work / mentions must NEVER be blocked
check('A11 cat a .md about run.js allowed', fire('cat run.js.md').code === ALLOWED);
check('A12 echo mentioning run.js allowed', fire('echo "see run.js for details"').code === ALLOWED);
check('A13 hyphenated sibling run-report.js allowed', fire('node run-report.js').code === ALLOWED);
check('A14 substring forerun.js allowed', fire('node forerun.js').code === ALLOWED);
check('A15 grep for attendance allowed', fire('grep -r attendance src/').code === ALLOWED);
check('A16 node core/ script allowed', fire('node core/slips.js add --category x').code === ALLOWED);
check('A17 mvn build allowed', fire('mvn clean install').code === ALLOWED);
check('A18 path-prefixed node run.js still blocked', fire('node E:\\Dev\\scripts\\PymTime\\run.js').code === BLOCKED);
// quoted-DATA class — the string appearing inside quotes must NOT block (found by self-audit)
check('A19 node run.js inside double-quotes (data) allowed', fire('echo "run node run.js later"').code === ALLOWED);
check('A20 JSON payload containing node run.js allowed', fire('node hook.js <<< \'{"command":"node run.js"}\'').code === ALLOWED);
check('A21 grep pattern mentioning node run.js allowed', fire('grep "node run.js" *.md').code === ALLOWED);
check('A22 real unquoted node run.js STILL blocked', fire('cd x && node run.js').code === BLOCKED);
check('A23 git commit message mentioning it (single quotes) allowed', fire("git commit -m 'note about node run.js'").code === ALLOWED);

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12 (2026-08-21): enumerate >=10 OPPOSING /
// OUT-OF-SPEC scenarios BEFORE shipping; verdict each: handled | fixture-added | accepted-risk.
// Encode the credible ones as fixtures below. Classes to mine (invent more):
//   1. own help/bypass text appearing in the transcript (the 9-gate self-disarm bug)
//   2. malformed JSON stdin / empty transcript / plain-text transcript
//   3. worktree vs main repo path resolution (__dirname vs CLAUDE_PROJECT_DIR)
//   4. eval-sandbox copy of the hook (lib not adjacent)
//   5. bundle dispatch vs direct registration (stdout JSON forwarding)
//   6. two concurrent sessions / stale dual-copy files
//   7. dependency file deleted or renamed
//   8. bypass token in an OLD turn / echoed by another hook
//   9. huge transcript (multi-MB) — timeout / memory
//  10. the simplest user instruction the feature could invert or lose
// TODO(forge): verdicts + fixtures — ship is NOT done while this block is unresolved.

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nlive-action-safety.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
