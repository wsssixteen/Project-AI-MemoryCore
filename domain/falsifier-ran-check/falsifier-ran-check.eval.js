#!/usr/bin/env node
// falsifier-ran-check.eval.js — replay eval for domain/falsifier-ran-check/falsifier-ran-check.check.hook.js (Stop hook)
// Mechanism: reads {transcript_path, stop_hook_active} from stdin, reads the transcript JSONL
// file itself, extracts the last assistant text block, and (native runHook mode) writes the
// advisory contextOut to stdout, exit 0, when a QA-PROBE is claimed planted + confirmed with
// no probe-fired evidence cited. Never blocks (exit code is always 0 for this hook).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'falsifier-ran-check.check.hook.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function writeTranscript(name, assistantText) {
  const p = path.join(os.tmpdir(), name);
  const lines = [
    JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'did the fix work?' }] } }),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: assistantText }] } }),
  ];
  fs.writeFileSync(p, lines.join('\n') + '\n', 'utf8');
  return p;
}

function run(transcriptPath, stopHookActive) {
  const input = JSON.stringify({ transcript_path: transcriptPath, stop_hook_active: !!stopHookActive });
  return spawnSync(process.execPath, [HOOK], {
    input, encoding: 'utf8', timeout: 30000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO_ROOT },
  });
}

// F1: clean — reply has nothing to do with probes at all → must NOT fire (exit 0, empty stdout)
const cleanText = 'The fix updates the listener attribute on the dropdown so the selected value now reaches ' +
  'the backing bean and persists on save. Ready for you to test on the UAT permohonan.';
const cleanPath = writeTranscript('fixture-falsifier-clean.jsonl', cleanText);
let r = run(cleanPath);
check('F1 clean input exits 0 (no false fire)', r.status === 0, 'exit=' + r.status);
check('F1 clean input emits empty stdout', (r.stdout || '') === '', JSON.stringify(r.stdout));

// F2: trigger — QA-PROBE planted + claims confirmation, but no probe-fired evidence cited → must FIRE (advisory in stdout)
const triggerText = 'I planted a QA268273-PROBE logger at the branch to catch the stale-flag case. ' +
  'Confirmed the fix works after testing on UAT — the dropdown now saves correctly on the second click.';
const triggerPath = writeTranscript('fixture-falsifier-trigger.jsonl', triggerText);
r = run(triggerPath);
check('F2 trigger input exits 0 (advisory, never blocks)', r.status === 0, 'exit=' + r.status);
check('F2 trigger input FIRES (advisory text in stdout)', /falsifier-ran-check/.test(r.stdout || ''), (r.stdout || '').slice(0, 160));
check('F2 advisory mentions no-fired-evidence', /no evidence|never (blocks|fired)|cite the probe/i.test(r.stdout || ''), (r.stdout || '').slice(0, 200));

// F3: edge case — QA-PROBE planted + confirmed, AND probe-fired evidence IS cited (server.log shows it firing) → must NOT fire
const edgeText = 'I planted a QA268273-PROBE logger to catch the stale-flag case. Confirmed the fix works — ' +
  'server.log shows the QA268273-PROBE line fired exactly once on the second click, matching the expected trace.';
const edgePath = writeTranscript('fixture-falsifier-edge.jsonl', edgeText);
r = run(edgePath);
check('F3 edge (probe-fired evidence cited) exits 0', r.status === 0, 'exit=' + r.status);
check('F3 edge (probe-fired evidence cited) emits empty stdout (no false fire)', (r.stdout || '') === '', JSON.stringify(r.stdout));

// cleanup tmp fixtures
for (const p of [cleanPath, triggerPath, edgePath]) {
  try { fs.unlinkSync(p); } catch (_) {}
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nfalsifier-ran-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
