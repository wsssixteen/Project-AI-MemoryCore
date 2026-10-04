#!/usr/bin/env node
/**
 * lib/hook-runtime.eval.js — replay eval for hook-runtime.js (built WITH the component,
 * per forge discipline: no eval green, no ship).
 *
 * Fixtures (temp children, self-contained):
 *   F1 pass-child     : exits 0 with context output    → wrapper exit 0, stdout forwarded, telemetry row
 *   F2 block-child    : exits 2 with stderr reason     → wrapper exit 2, stderr forwarded, blocked:true
 *   F3 crash-child    : throws                          → wrapper exit 0 (FAIL-OPEN), error row logged
 *   F4 missing-target : path does not exist             → wrapper exit 0, target-missing row logged
 *
 * Run: node lib/hook-runtime.eval.js   → prints PASS/FAIL per fixture + summary; exit 1 on any FAIL.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RUNTIME = path.join(__dirname, 'hook-runtime.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-runtime-eval-'));
// Isolated telemetry (2026-10-05): the wrapper writes under CLAUDE_PROJECT_DIR, so the eval points it at TMP.
// Before, the fixtures wrote into the REAL system/telemetry file: they polluted it (crash-child /
// does-not-exist showed up as hook errors) and the "exactly one new row" checks failed whenever a live
// hook appended a row at the same moment.
const TELEMETRY = path.join(TMP, 'system', 'telemetry', 'hook-fires.jsonl');
const REAL_TELEMETRY = path.join(path.resolve(__dirname, '..'), 'system', 'telemetry', 'hook-fires.jsonl');
const EVAL_ENV = Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: TMP });
const STARTED = new Date().toISOString();

function writeChild(name, body) {
  const p = path.join(TMP, name);
  fs.writeFileSync(p, body);
  return p;
}
function telemetryCount() {
  try { return fs.readFileSync(TELEMETRY, 'utf8').trim().split('\n').filter(Boolean).length; } catch (_) { return 0; }
}
function lastTelemetry() {
  const lines = fs.readFileSync(TELEMETRY, 'utf8').trim().split('\n').filter(Boolean);
  return JSON.parse(lines[lines.length - 1]);
}
function runWrap(target) {
  return spawnSync(process.execPath, [RUNTIME, '--wrap', target, 'EvalEvent'], { input: '{"fixture":true}', encoding: 'utf8', timeout: 60000, env: EVAL_ENV });
}

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail }); }

// F1 — pass-child
const passChild = writeChild('pass-child.js', 'process.stdout.write("ctx-line"); process.exit(0);');
let before = telemetryCount();
let r = runWrap(passChild);
let row = lastTelemetry();
check('F1 exit 0', r.status === 0, 'exit=' + r.status);
check('F1 stdout forwarded', r.stdout === 'ctx-line', 'stdout=' + JSON.stringify(r.stdout));
check('F1 telemetry appended', telemetryCount() === before + 1 && row.hook === 'pass-child' && row.blocked === false, JSON.stringify(row));

// F2 — block-child
const blockChild = writeChild('block-child.js', 'process.stderr.write("BLOCK-REASON"); process.exit(2);');
before = telemetryCount();
r = runWrap(blockChild);
row = lastTelemetry();
check('F2 exit 2 forwarded', r.status === 2, 'exit=' + r.status);
check('F2 stderr forwarded', r.stderr === 'BLOCK-REASON', 'stderr=' + JSON.stringify(r.stderr));
check('F2 blocked:true in telemetry', telemetryCount() === before + 1 && row.blocked === true, JSON.stringify(row));

// F3 — crash-child (fail-open)
const crashChild = writeChild('crash-child.js', 'throw new Error("boom");');
before = telemetryCount();
r = runWrap(crashChild);
row = lastTelemetry();
check('F3 crash exit forwarded as child exit (1) OR fail-open 0 — must NOT be 2/block', r.status !== 2, 'exit=' + r.status);
check('F3 telemetry row written', telemetryCount() === before + 1, JSON.stringify(row));

// F4 — missing target (ghost class)
before = telemetryCount();
r = runWrap(path.join(TMP, 'does-not-exist.js'));
row = lastTelemetry();
check('F4 fail-open exit 0', r.status === 0, 'exit=' + r.status);
check('F4 target-missing logged', telemetryCount() === before + 1 && /target-missing/.test(row.error || ''), JSON.stringify(row));

// F5 — telemetry name argument (2026-10-05, forge install): an installed hook keeps its pre-install
// name, so domain/x/x.hook.js logs as "x", not "x.hook"; without the argument the file name is used.
const namedChild = writeChild('renamed-probe.hook.js', 'process.stdout.write("ctx"); process.exit(0);');
r = spawnSync(process.execPath, [RUNTIME, '--wrap', namedChild, 'EvalEvent', 'renamed-probe'], { input: '{}', encoding: 'utf8', timeout: 60000, env: EVAL_ENV });
row = lastTelemetry();
check('F5 name argument sets the telemetry hook name', r.status === 0 && row.hook === 'renamed-probe', JSON.stringify(row));
r = runWrap(namedChild);
row = lastTelemetry();
check('F5b without the argument the file base name is used', row.hook === 'renamed-probe.hook', JSON.stringify(row));

// F6 — isolation: no fixture row of THIS run reached the real telemetry file.
let leaked = [];
try {
  const FIXTURE_NAMES = new Set(['pass-child', 'block-child', 'crash-child', 'does-not-exist', 'renamed-probe', 'renamed-probe.hook']);
  leaked = fs.readFileSync(REAL_TELEMETRY, 'utf8').trim().split('\n').slice(-500)
    .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
    .filter(x => x && FIXTURE_NAMES.has(x.hook) && x.ts >= STARTED);
} catch (_) { /* no real telemetry file here (fresh checkout) = nothing to leak into */ }
check('F6 fixture rows stay out of the real telemetry file', leaked.length === 0, leaked.length + ' leaked row(s): ' + JSON.stringify(leaked[0] || null));

// Report
let failed = 0;
for (const x of results) {
  if (!x.pass) failed++;
  console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : '  → ' + x.detail));
}
console.log(`\nhook-runtime.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
