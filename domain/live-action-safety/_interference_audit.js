'use strict';
// _interference_audit.js — does the global hook FALSELY block real work?
// Feeds real Etanah / MemoryCore / everyday commands and asserts NONE are blocked.
const { spawnSync } = require('child_process');
const path = require('path');
const HOOK = path.join(__dirname, 'live-action-safety.check.hook.js');

function fire(command, tool = 'Bash') {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: tool, tool_input: { command } }), encoding: 'utf8', env: process.env });
  return r.status;
}

// commands that MUST be allowed (exit 0) — real work, must never be blocked
const MUST_ALLOW = [
  'git status', 'git commit -m "fix"', 'git push origin HEAD',
  'mvn clean install', 'mvn compile',
  'node core/slips.js add --category x --evidence y --caught-by miya',
  'node quest/active-cli.js read QA-276436',
  'node quest/redmine-sync.js 275092',
  'node domain/bpmn-check/bpmn-check.js file.bpmn20.xml',
  'node lib/feature-census.js',
  'psql -h host -d et_main_uat',
  'schtasks /Query /TN "PymTime\\ClockIn"',
  'npm install playwright',
  'ls E:\\Projects\\Melaka',
  'python scripts/recalc.py file.xlsx',
  'node forerun.js',            // contains "run.js" as substring but is a different file
  'node prerun.js',             // substring trap
  'node scripts/dryrun.js',     // substring trap
  'cat run.js.md',              // doc about it, not executing
  'echo "see run.js for details"', // mention in a string
  'grep -r attendance src/',    // the word attendance, not the script
  'node run-report.js',         // hyphenated, different script
  'node claims-helper.js'
];

// commands that MUST be blocked (exit 2) — real live actions
const MUST_BLOCK = [
  'node run.js', 'node run.js --headless', 'node run.js --headless --now',
  'node attendance.js', 'node pymclaims.js',
  'cd E:\\Dev\\scripts\\PymTime && node run.js'
];

let pass = 0, fail = 0;
const falsePos = [], falseNeg = [];
for (const c of MUST_ALLOW) { const code = fire(c); if (code === 0) pass++; else { fail++; falsePos.push(`${c}  (exit ${code})`); } }
for (const c of MUST_BLOCK) { const code = fire(c); if (code === 2) pass++; else { fail++; falseNeg.push(`${c}  (exit ${code})`); } }

console.log('=== INTERFERENCE AUDIT: does the global hook break real work? ===');
console.log(`allowed-correctly : ${MUST_ALLOW.length - falsePos.length}/${MUST_ALLOW.length}`);
console.log(`blocked-correctly : ${MUST_BLOCK.length - falseNeg.length}/${MUST_BLOCK.length}`);
if (falsePos.length) { console.log('\n🚨 FALSE BLOCKS (real work wrongly blocked):'); falsePos.forEach(x => console.log('  ' + x)); }
if (falseNeg.length) { console.log('\n🚨 MISSED (live action wrongly allowed):'); falseNeg.forEach(x => console.log('  ' + x)); }
console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
