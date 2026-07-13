#!/usr/bin/env node
// verify-basis-gate.eval.js — replay eval (みや 2026-06-24, "you're lying, you didn't check flowables").
// Verifies: a "verified/checked/from … evidence" claim with ZERO tool_use blocks this turn BLOCKS;
// the same claim with a tool_use block, or with the [skip-verify-basis:] bypass, PASSES.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'verify-basis-gate.discipline.hook.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const tmpFiles = [];
function writeTranscript(name, lines) {
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, lines.map(l => JSON.stringify(l)).join('\n') + '\n', 'utf8');
  tmpFiles.push(p);
  return p;
}

function userLine() {
  return { type: 'user', message: { role: 'user', content: 'please look into this' } };
}
function assistantLine(contentArr) {
  return { type: 'assistant', message: { role: 'assistant', content: contentArr } };
}

const BASIS_TEXT = 'I checked the flowable and confirmed the BPMN routes to pelupusan.';

function run(transcriptPath) {
  const stdin = JSON.stringify({ transcript_path: transcriptPath, stop_hook_active: false });
  return spawnSync(process.execPath, [HOOK], {
    input: stdin,
    encoding: 'utf8',
    timeout: 30000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO_ROOT },
  });
}

// F1: clean input — assistant made a tool_use BEFORE the basis-claim text → must NOT block
const cleanPath = writeTranscript('fixture-verify-basis-clean.jsonl', [
  userLine(),
  assistantLine([
    { type: 'tool_use', name: 'Read', input: { file_path: 'some.bpmn20.xml' } },
    { type: 'text', text: BASIS_TEXT },
  ]),
]);
let r = run(cleanPath);
let out = {};
try { out = JSON.parse((r.stdout || '').trim() || '{}'); } catch (_) {}
check('F1 clean input (tool_use present) does not block', r.status === 0 && out.decision !== 'block', 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 200));

// F2: trigger input — same basis-claim text, ZERO tool_use blocks this turn → must BLOCK
const triggerPath = writeTranscript('fixture-verify-basis-trigger.jsonl', [
  userLine(),
  assistantLine([
    { type: 'text', text: BASIS_TEXT },
  ]),
]);
r = run(triggerPath);
out = {};
try { out = JSON.parse((r.stdout || '').trim() || '{}'); } catch (_) {}
check('F2 trigger input (no tools, basis claim) BLOCKS', r.status === 0 && out.decision === 'block', 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 200));
check('F2 block reason names verify-basis-gate', /verify-basis-gate/.test(out.reason || ''), (out.reason || '').slice(0, 120));

// F3: bypass token — same zero-tool basis claim, but carries [skip-verify-basis: ...] → must PASS
const bypassPath = writeTranscript('fixture-verify-basis-bypass.jsonl', [
  userLine(),
  assistantLine([
    { type: 'text', text: BASIS_TEXT + ' [skip-verify-basis: verified last turn]' },
  ]),
]);
r = run(bypassPath);
out = {};
try { out = JSON.parse((r.stdout || '').trim() || '{}'); } catch (_) {}
check('F3 bypass token passes (no block)', r.status === 0 && out.decision !== 'block', 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 200));

// F4: no basis-claim text at all, zero tools → must NOT block (no trigger phrase present)
const noClaimPath = writeTranscript('fixture-verify-basis-no-claim.jsonl', [
  userLine(),
  assistantLine([
    { type: 'text', text: 'Here is a plain summary of the change with no verification language at all, just facts.' },
  ]),
]);
r = run(noClaimPath);
out = {};
try { out = JSON.parse((r.stdout || '').trim() || '{}'); } catch (_) {}
check('F4 no basis-claim text does not block', r.status === 0 && out.decision !== 'block', 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 200));

// cleanup tmp fixture files
for (const f of tmpFiles) { try { fs.unlinkSync(f); } catch (_) {} }

let failed = 0;
for (const x of results) { console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); if (!x.pass) failed++; }
console.log('\nverify-basis-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
