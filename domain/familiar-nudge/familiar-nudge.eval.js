#!/usr/bin/env node
// familiar-nudge.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 500-line reads repeatedly done inline, protocol rule prose-only (miya delegation-checks block a)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'familiar-nudge.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function makeFile(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'familiar-nudge-'));
  const fp = path.join(dir, name);
  fs.writeFileSync(fp, content);
  return fp;
}

function run(fp) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: fp } }),
    encoding: 'utf8', timeout: 30000, env: process.env,
  });
}

// F1: clean input → must NOT block (exit 0), empty stdout (no false fire)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);
check('F1 clean input stdout empty (no false fire)', (r.stdout || '') === '', JSON.stringify(r.stdout));

// F2: TRIGGER — a real file with >500 lines → must FIRE (advisory in stdout), never block
const bigFile = makeFile('big.txt', Array.from({ length: 600 }, (_, i) => 'line ' + i + ' '.repeat(40)).join('\n'));
r = run(bigFile);
check('F2 >500-line file exits 0 (advisory, not a block)', r.status === 0, 'exit=' + r.status);
check('F2 >500-line file FIRES — advisory text in stdout', /familiar-nudge/.test(r.stdout || ''), JSON.stringify(r.stdout));
check('F2 advisory mentions /familiar', /familiar/i.test(r.stdout || ''), JSON.stringify(r.stdout));

// F3a: small, ordinary file → must NOT fire
const smallFile = makeFile('small.txt', 'just a few short lines\nline2\nline3\n');
r = run(smallFile);
check('F3a small clean file does not fire', r.status === 0 && (r.stdout || '') === '', 'exit=' + r.status + ' stdout=' + JSON.stringify(r.stdout));

// F3b: EDGE CASE — a large file (>50KB) but under an EXCLUDED path (meta/telemetry) → must NOT fire
const telemetryDir = path.join(os.tmpdir(), 'meta', 'telemetry');
fs.mkdirSync(telemetryDir, { recursive: true });
const telemetryFile = path.join(telemetryDir, 'hook-fires.jsonl');
fs.writeFileSync(telemetryFile, 'x'.repeat(60 * 1024));
r = run(telemetryFile);
check('F3b large file under meta/telemetry/ excluded — does not fire', r.status === 0 && (r.stdout || '') === '', 'exit=' + r.status + ' stdout=' + JSON.stringify(r.stdout));

// F3c: EDGE CASE — nonexistent file_path → must NOT fire (no crash, no throw on statSync)
r = run(path.join(os.tmpdir(), 'this-file-does-not-exist-' + Date.now() + '.txt'));
check('F3c nonexistent file does not fire / does not crash', r.status === 0 && (r.stdout || '') === '', 'exit=' + r.status + ' stdout=' + JSON.stringify(r.stdout));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nfamiliar-nudge.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
