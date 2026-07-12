#!/usr/bin/env node
// delegation-plan-presence.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: quest-system-audit run 1: 23 agents fanned out on session model, 2.1M tokens, died at usage limit
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'delegation-plan-presence.check.hook.js');
const ROOT = path.resolve(__dirname, '..', '..');
const TELEMETRY_FILE = path.join(ROOT, 'meta', 'telemetry', 'hook-fires.jsonl');

const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function line(obj) { return JSON.stringify(obj) + '\n'; }
function userMsg(text) { return { type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } }; }
function assistantMsg(blocks) { return { type: 'assistant', message: { role: 'assistant', content: blocks } }; }
function toolUse(name) { return { type: 'tool_use', name, input: {} }; }
function textBlock(text) { return { type: 'text', text }; }

function writeTranscript(basename, entries) {
  const fp = path.join(os.tmpdir(), 'dpp-eval-' + basename + '-' + process.pid + '-' + Date.now() + '.jsonl');
  fs.writeFileSync(fp, entries.map(line).join(''));
  return fp;
}

function run(transcriptPath, extraEnv) {
  const stdinPayload = JSON.stringify({ transcript_path: transcriptPath });
  return spawnSync(process.execPath, [HOOK], {
    input: stdinPayload, encoding: 'utf8', timeout: 30000,
    env: { ...process.env, ...extraEnv },
  });
}

// ---------- F1: clean no-fire ----------
// F1a: no transcript_path at all
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1a no transcript_path exits 0, empty stdout', r.status === 0 && (r.stdout || '') === '', 'exit=' + r.status + ' stdout=' + JSON.stringify(r.stdout));

// F1b: only 1 spawn since last user message → below the >=2 threshold
const t1b = writeTranscript('f1b-one-spawn', [
  userMsg('please fix the bug'),
  assistantMsg([toolUse('Task'), textBlock('done, single agent handled it.')]),
]);
r = run(t1b, {});
check('F1b single-spawn turn does not fire (exit 0, empty stdout)', r.status === 0 && (r.stdout || '') === '', 'exit=' + r.status + ' stdout=' + JSON.stringify(r.stdout));

// F1c: 2+ spawns but reply already carries a DELEGATION PLAN table → suppressed
const t1c = writeTranscript('f1c-plan-present', [
  userMsg('audit the whole repo'),
  assistantMsg([
    toolUse('Task'), toolUse('Agent'),
    textBlock('DELEGATION PLAN\n| stage | # agents | model | effort |\n|---|---|---|---|\n| scout | 3 | haiku | low |\n\ndone.'),
  ]),
]);
r = run(t1c, {});
check('F1c plan-present turn does not fire (exit 0, empty stdout)', r.status === 0 && (r.stdout || '') === '', 'exit=' + r.status + ' stdout=' + JSON.stringify(r.stdout));

// ---------- F2: REPLAY — trigger case FIRES ----------
const marker = 'dpp-test-' + process.pid + '-' + Date.now();
const t2 = writeTranscript('f2-trigger', [
  userMsg('run a full audit fanning out to subagents'),
  assistantMsg([
    toolUse('Task'), toolUse('Task'), toolUse('Workflow'),
    textBlock('Spawned 23 agents on the session model. Findings below.'),
  ]),
]);
r = run(t2, { DPP_TEST_MARKER: marker });
check('F2 trigger case exits 0 (never blocks)', r.status === 0, 'exit=' + r.status);
check('F2 trigger case stdout EMPTY (telemetry, not stdout, carries the advisory)', (r.stdout || '') === '', 'stdout=' + JSON.stringify(r.stdout));

let telemetryRow = '';
try {
  const rows = fs.readFileSync(TELEMETRY_FILE, 'utf8').split('\n').filter((l) => l.includes(marker));
  telemetryRow = rows[rows.length - 1] || '';
} catch (_) { /* file missing */ }
check('F2 telemetry row lands with spawn_tool', /"spawn_tool"/.test(telemetryRow) && telemetryRow.includes(marker), telemetryRow.slice(0, 160));

// ---------- F3: edge case — spawns BEFORE the latest user message don't count ----------
const t3 = writeTranscript('f3-boundary', [
  userMsg('first ask'),
  assistantMsg([toolUse('Task'), toolUse('Task'), textBlock('spawned 2 agents on the old ask.')]),
  userMsg('second ask, unrelated, no fan-out needed'),
  assistantMsg([textBlock('handled directly, no subagents this turn.')]),
]);
r = run(t3, {});
check('F3 spawns before the latest user turn are not counted (exit 0, empty stdout)', r.status === 0 && (r.stdout || '') === '', 'exit=' + r.status + ' stdout=' + JSON.stringify(r.stdout));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ndelegation-plan-presence.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
