#!/usr/bin/env node
// show-gate.eval.js — replay eval for domain/show-gate/show-gate.discipline.hook.js (Stop hook)
// Mechanism: reads {transcript_path, stop_hook_active} from stdin, reads the transcript JSONL
// file itself, extracts the last assistant text block, and decision-json blocks
// ({"decision":"block",...} on stdout, exit 0) when show-signals fire with no box/fence shown.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'show-gate.discipline.hook.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function writeTranscript(name, assistantText) {
  const p = path.join(os.tmpdir(), name);
  const lines = [
    JSON.stringify({ message: { role: 'user', content: [{ type: 'text', text: 'what changed?' }] } }),
    JSON.stringify({ message: { role: 'assistant', content: [{ type: 'text', text: assistantText }] } }),
  ];
  fs.writeFileSync(p, lines.join('\n') + '\n', 'utf8');
  return p;
}

function run(transcriptPath) {
  const input = JSON.stringify({ transcript_path: transcriptPath, stop_hook_active: false });
  const r = spawnSync(process.execPath, [HOOK], {
    input, encoding: 'utf8', timeout: 30000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO_ROOT },
  });
  return r;
}

// Shared prose base >=500 chars, matches SHOW_SIGNALS ("the root cause is", "before...after", "compared to")
// no box chars, no code fence.
const SHOW_PROSE = 'The root cause is a missing listener attribute on the dropdown. Before the change the ' +
  'dropdown had no ajax wiring at all, so the selection never reached the backing bean; after copying the ' +
  "sibling component's structure the listener now fires correctly and the chosen value persists on save, " +
  'compared to the previous broken behaviour where the field silently reverted to null every time the form ' +
  'was submitted and reopened by the officer reviewing the application, which is exactly what the BA reported ' +
  'in the latest cycle journal entry when describing the syarat dropdown losing its selected value.';

// F1: clean input — show-worthy prose but wrapped in a fenced code block → must NOT block (exit 0, no decision-json)
const cleanText = SHOW_PROSE + '\n\n```\n- listener missing\n+ listener="#{mbb.onChange}"\n```';
const cleanPath = writeTranscript('fixture-show-clean.jsonl', cleanText);
let r = run(cleanPath);
check('F1 clean input (fenced diff shown) exits 0', r.status === 0, 'exit=' + r.status);
check('F1 clean input emits no block decision', !/"decision":"block"/.test(r.stdout || ''), (r.stdout || '').slice(0, 120));

// F2: trigger input — same show-worthy prose, NO box chars, NO fence → must BLOCK via decision-json (exit 0, stdout has decision:block)
const triggerPath = writeTranscript('fixture-show-trigger.jsonl', SHOW_PROSE);
r = run(triggerPath);
check('F2 trigger input exits 0 (decision-json mechanism, not exit-code)', r.status === 0, 'exit=' + r.status);
check('F2 trigger input BLOCKS (decision-json in stdout)', /"decision":"block"/.test(r.stdout || ''), (r.stdout || '').slice(0, 160));
check('F2 block reason names show-gate', /show-gate/.test(r.stdout || ''), (r.stdout || '').slice(0, 160));

// F3: bypass token — same show-worthy prose + [skip-show-gate: ...] → must NOT block
const bypassText = SHOW_PROSE + '\n\n[skip-show-gate: nothing to show]';
const bypassPath = writeTranscript('fixture-show-bypass.jsonl', bypassText);
r = run(bypassPath);
check('F3 bypass token exits 0', r.status === 0, 'exit=' + r.status);
check('F3 bypass token emits no block decision', !/"decision":"block"/.test(r.stdout || ''), (r.stdout || '').slice(0, 120));

// F4: box-drawing diagram instead of code fence → must NOT block (covers the OTHER "shown" path)
const boxText = SHOW_PROSE + '\n\n┌─────────┐\n│ before  │\n└─────────┘';
const boxPath = writeTranscript('fixture-show-box.jsonl', boxText);
r = run(boxPath);
check('F4 box-diagram shown exits 0', r.status === 0, 'exit=' + r.status);
check('F4 box-diagram shown emits no block decision', !/"decision":"block"/.test(r.stdout || ''), (r.stdout || '').slice(0, 120));

// F5: short reply (<500 chars) with show-signal wording → exempt, must NOT block
const shortText = 'The root cause is a missing listener attribute, compared to the working sibling.';
const shortPath = writeTranscript('fixture-show-short.jsonl', shortText);
r = run(shortPath);
check('F5 short reply (<500 chars) exits 0', r.status === 0, 'exit=' + r.status);
check('F5 short reply emits no block decision', !/"decision":"block"/.test(r.stdout || ''), (r.stdout || '').slice(0, 120));

// cleanup tmp fixtures
for (const p of [cleanPath, triggerPath, bypassPath, boxPath, shortPath]) {
  try { fs.unlinkSync(p); } catch (_) {}
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nshow-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
