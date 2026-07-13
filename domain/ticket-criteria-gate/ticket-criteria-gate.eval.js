#!/usr/bin/env node
// ticket-criteria-gate.eval.js — replay eval for the ticket-criteria-gate Stop hook.
// Replay case: QA-261986 close (bogus self-asserted completeness) + QA-266503 (VERIFIED
// claimed on a no-collision shape that never reproduced the BA symptom).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'ticket-criteria-gate.discipline.hook.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const tmpFiles = [];
function writeTranscript(name, assistantText) {
  const p = path.join(os.tmpdir(), name);
  const line = JSON.stringify({ message: { role: 'assistant', content: [{ type: 'text', text: assistantText }] } });
  fs.writeFileSync(p, line + '\n', 'utf8');
  tmpFiles.push(p);
  return p;
}

function run(stdinObj) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(stdinObj),
    encoding: 'utf8',
    timeout: 30000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO_ROOT },
  });
}

function isBlock(stdout) {
  try { return JSON.parse(stdout).decision === 'block'; } catch (_) { return false; }
}

// ---- F1: clean input — ticket ref + done-claim + CRITERIA COVERAGE table + evidence token -> must NOT block
const cleanText = [
  'Wrapping up QA-268888 — the fix is done and ready to test.',
  '',
  'CRITERIA COVERAGE',
  '| BA criterion (verbatim) | Addressed? | Evidence |',
  '|---|---|---|',
  '| dropdown value persists after save | yes | MlkSemakanForm.java:214 |',
  '| no duplicate rows created on resave | yes | server.log line confirms single INSERT |',
  '',
  'Everything above is backed by a concrete file:line or a server.log read-back, not a bare checkmark. ',
  'Padding this reply past the 300-char processing threshold so the hook actually evaluates it fully.',
].join('\n');
const cleanPath = writeTranscript('fixture-criteria-clean.jsonl', cleanText);
let r = run({ transcript_path: cleanPath, stop_hook_active: false });
check('F1 clean input (table+evidence) does NOT block', !isBlock(r.stdout), 'stdout=' + (r.stdout || '').slice(0, 200));

// ---- F2: trigger input — done-claim + ticket ref, NO CRITERIA COVERAGE table, NO evidence token -> must BLOCK
const triggerText = [
  'Wrapping up QA-268888 — the fix is done and ready to test.',
  'I went through the dropdown listener, wired it like the sibling component, and confirmed the panel',
  'renders correctly now. Everything looks good on my end so this should be good to test whenever you get a chance.',
  'No further changes are needed and the behaviour matches what was reported in the ticket description.',
  'Padding this reply past the 300-char processing threshold so the hook actually evaluates it fully.',
].join('\n');
const triggerPath = writeTranscript('fixture-criteria-trigger.jsonl', triggerText);
r = run({ transcript_path: triggerPath, stop_hook_active: false });
check('F2 trigger input (done-claim, no coverage table/evidence) BLOCKS', isBlock(r.stdout), 'stdout=' + (r.stdout || '').slice(0, 200));
check('F2 block reason names ticket-criteria-gate', /ticket-criteria-gate/.test(r.stdout || ''), (r.stdout || '').slice(0, 120));

// ---- F3: bypass token — same done-claim shape as F2 but with [skip-criteria-gate: ...] -> must NOT block
const bypassText = [
  'Wrapping up QA-268888 — the fix is done and ready to test. [skip-criteria-gate: draft note, not a real close]',
  'I went through the dropdown listener, wired it like the sibling component, and confirmed the panel',
  'renders correctly now. Everything looks good on my end so this should be good to test whenever you get a chance.',
  'No further changes are needed and the behaviour matches what was reported in the ticket description.',
  'Padding this reply past the 300-char processing threshold so the hook actually evaluates it fully.',
].join('\n');
const bypassPath = writeTranscript('fixture-criteria-bypass.jsonl', bypassText);
r = run({ transcript_path: bypassPath, stop_hook_active: false });
check('F3 bypass token [skip-criteria-gate:] does NOT block', !isBlock(r.stdout), 'stdout=' + (r.stdout || '').slice(0, 200));

// ---- F4 (bonus): Check C — VERIFIED/PASS claim with NO before-fix reproduction -> must BLOCK
const reproTriggerText = [
  'For QA-268888: both issues PASS. local_test_confirmed=true — the fix works and the row is not deleted.',
  'I re-ran the save flow on the test permohonan and the values persist correctly through simpan.',
  'Confirmed working end to end, ready to move this to the next stage whenever convenient for you.',
  'Padding this reply past the 300-char processing threshold so the hook actually evaluates it fully.',
].join('\n');
const reproTriggerPath = writeTranscript('fixture-criteria-repro-trigger.jsonl', reproTriggerText);
r = run({ transcript_path: reproTriggerPath, stop_hook_active: false });
check('F4 VERIFIED claim with no before-fix repro BLOCKS (Check C)', isBlock(r.stdout), 'stdout=' + (r.stdout || '').slice(0, 200));

// ---- F5 (bonus): Check C clean — VERIFIED/PASS claim WITH before-fix reproduction -> must NOT block
const reproCleanText = [
  'For QA-268888: both issues PASS. local_test_confirmed=true — the fix works and the row is not deleted.',
  'Before the fix, reproducing the BA symptom on the same test permohonan showed the row being deleted on resave',
  '(old code drops the child row). After applying the fix, the same data shape now keeps the row and persists',
  'correctly through simpan — verified on the identical collision shape BA reported.',
  'Padding this reply past the 300-char processing threshold so the hook actually evaluates it fully.',
].join('\n');
const reproCleanPath = writeTranscript('fixture-criteria-repro-clean.jsonl', reproCleanText);
r = run({ transcript_path: reproCleanPath, stop_hook_active: false });
check('F5 VERIFIED claim WITH before-fix repro does NOT block', !isBlock(r.stdout), 'stdout=' + (r.stdout || '').slice(0, 200));

for (const f of tmpFiles) { try { fs.unlinkSync(f); } catch (_) {} }

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nticket-criteria-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
