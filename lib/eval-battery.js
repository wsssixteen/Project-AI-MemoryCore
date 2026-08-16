#!/usr/bin/env node
// eval-battery — born via forge
// Runs EVERY eval in the repo; the answer to "will this run reliably ALWAYS" is
// this script on a cadence (weekly audit + DE 12.5), not anyone's memory.
//   node lib/eval-battery.js            → run all, summary, exit 1 if any fail
//   node lib/eval-battery.js --list     → just enumerate
// Telemetry: one row per run → system/telemetry/eval-battery.jsonl
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');

// enumerate: domain/*/*eval*.js · quest/*.eval.js · core/*.eval.js
const evals = [];
try {
  for (const d of fs.readdirSync(path.join(ROOT, 'domain'), { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of fs.readdirSync(path.join(ROOT, 'domain', d.name))) {
      if (/eval.*\.js$/.test(f) && !/eval\.workflow\.js$/.test(f)) evals.push(path.join('domain', d.name, f));
    }
  }
} catch (_) {}
for (const dir of ['quest', 'core', 'lib']) {
  try { for (const f of fs.readdirSync(path.join(ROOT, dir))) if (/\.eval\.js$/.test(f)) evals.push(path.join(dir, f)); } catch (_) {}
}

if (process.argv.includes('--list')) { evals.forEach(e => console.log(e)); console.log(evals.length + ' evals'); process.exit(0); }

// Quarantine: system/eval-quarantine.jsonl rows {eval, reason, since} — classified
// non-green evals (env-dependent / repair-queued / feature-incomplete). Reported,
// never silently skipped, never counted as green.
const quarantine = new Map();
try {
  for (const line of fs.readFileSync(path.join(ROOT, 'system', 'eval-quarantine.jsonl'), 'utf8').split('\n').filter(Boolean)) {
    try { const q = JSON.parse(line); quarantine.set(q.eval.replace(/\//g, path.sep), q.reason); } catch (_) {}
  }
} catch (_) {}

const results = [];
const quarantined = [];
for (const e of evals) {
  if (quarantine.has(e)) { quarantined.push({ eval: e, reason: quarantine.get(e) }); console.log('QUAR ' + e + ' — ' + quarantine.get(e)); continue; }
  const r = spawnSync('node', [path.join(ROOT, e)], { encoding: 'utf8', timeout: 120000, windowsHide: true });
  const pass = r.status === 0;
  results.push({ eval: e, pass, exit: r.status });
  console.log((pass ? 'PASS ' : 'FAIL ') + e + (pass ? '' : ' (exit ' + r.status + ')'));
}
const fails = results.filter(r => !r.pass);
const summary = 'eval-battery: ' + (results.length - fails.length) + '/' + results.length + ' green' +
  (quarantined.length ? ' · ' + quarantined.length + ' quarantined (classified)' : '') +
  (fails.length ? ' — FAILING: ' + fails.map(f => f.eval).join(', ') : '');
console.log('\n' + summary);
try {
  fs.mkdirSync(path.join(ROOT, 'system', 'telemetry'), { recursive: true });
  fs.appendFileSync(path.join(ROOT, 'system', 'telemetry', 'eval-battery.jsonl'), JSON.stringify({ ts: new Date().toISOString(), total: results.length, fails: fails.map(f => f.eval), quarantined }) + '\n');
} catch (_) {}
process.exit(fails.length ? 1 : 0);
