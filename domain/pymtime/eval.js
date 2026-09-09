#!/usr/bin/env node
/**
 * eval.js — /pymtime skill fixture eval
 *
 * /pymtime is the remote path for みや's PymTime clock-in skips ("skip today",
 * "skip attendance", "EL today"). Its value is the ASK-BACK: a loose phrase must
 * never act by itself — the skill confirms the real calendar date first, then
 * runs skip.js and quotes its verification line + fires a toast on the laptop.
 *
 * This eval pins: the trigger phrases, the ask-back rule with a real date, the
 * "never act on the phrase alone" rule, the exact CLI it maps to, the two-place
 * confirmation, and — when the PymTime repo is present — that the CLI's date
 * parser agrees with the skill's examples.
 *
 * Run: node domain/pymtime/eval.js
 */

const fs = require('fs');
const path = require('path');

const SKILL = path.resolve(__dirname, '..', '..', '.claude', 'skills', 'pymtime', 'SKILL.md');
const PYMTIME = 'E:\\Dev\\scripts\\PymTime';

let pass = 0, fail = 0;
function check(name, cond, detail) { if (cond) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); } }

console.log('eval: /pymtime skill\n');
if (!fs.existsSync(SKILL)) { console.log(`  FAIL  SKILL.md exists at ${SKILL}`); process.exit(1); }
const src = fs.readFileSync(SKILL, 'utf8');
const fm = src.slice(0, src.indexOf('---', 4) + 3);

// 1. triggering
check('name is pymtime', /^name:\s*pymtime\s*$/m.test(fm));
for (const p of ['skip today', 'skip clock in', 'skip pymtime', 'skip attendance', 'EL today', 'emergency leave', 'did pymtime run', 'pause pymtime', 'undo skip']) check(`trigger phrase "${p}"`, fm.toLowerCase().includes(p.toLowerCase()));
check('description says the phrase alone never acts', /phrase alone never triggers an action/i.test(fm));

// 2. ask-back rules
check('ask-back names the REAL calendar date', /Always name the real calendar date/i.test(src) && /Mon 7 Sep 2026/.test(src));
check('"skip today" alone is treated as ambiguous', /"skip today" \/ "skip" alone[\s\S]{0,40}ambiguous/i.test(src));
check('window-closed = no-op rule present', /after the window has closed[\s\S]{0,60}no-op/i.test(src));
check('already-clocked-in-today rule present', /already clocked in[\s\S]{0,120}changes nothing/i.test(src));
check('only a one-word yes proceeds', /One-word "yes" from him = go/i.test(src));

// 3. the exact CLI mapping
check('maps to skip.js today --source remote', /skip\.js today --source remote/.test(src));
check('maps to skip.js tomorrow --source remote', /skip\.js tomorrow --source remote/.test(src));
check('maps to a date range form', /skip\.js \d{4}-\d{2}-\d{2} \d{4}-\d{2}-\d{2} --source remote/.test(src));
check('maps undo to skip.js clear', /skip\.js clear/.test(src));
check('status command reads lastRun + tasksState + listSkips', /lastRun:s\.lastRun\(\)/.test(src) && /tasksState\(\)/.test(src) && /listSkips\(\)/.test(src));

// 4. two-place confirmation
check('chat confirmation quotes the verification line', /quote the command's `verification` line verbatim/i.test(src));
check('laptop confirmation = toast', /fires a Windows toast/i.test(src));
check('error → re-ask, never guess a date', /never retry with a guessed date/i.test(src));

// 5. the CLI it depends on agrees (only when the PymTime repo is on this machine)
const skipLib = path.join(PYMTIME, 'lib', 'skip.js');
if (fs.existsSync(skipLib)) {
  const os = require('os');
  process.env.PYMTIME_HOME = path.join(os.tmpdir(), 'pymtime-eval-' + process.pid);
  const skip = require(skipLib);
  const NOW = new Date(2026, 8, 7);
  check('skip.parseDate("today") on 2026-09-07 = 20260907', skip.parseDate('today', NOW) === '20260907');
  check('skip.parseDate("tomorrow") = 20260908', skip.parseDate('tomorrow', NOW) === '20260908');
  check('skip.label matches the ask-back date shape', skip.label('20260907') === 'Mon 7 Sep 2026');
  check('skip.rangeKeys 10→11 Sep = 2 days (matches the range example)', skip.rangeKeys('2026-09-10', '2026-09-11').length === 2);
  check('skip.js CLI file exists', fs.existsSync(path.join(PYMTIME, 'skip.js')));
  try { fs.rmSync(process.env.PYMTIME_HOME, { recursive: true, force: true }); } catch (_) {}
} else {
  console.log('  SKIP  PymTime repo not on this machine — CLI agreement checks skipped');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
