#!/usr/bin/env node
// terse-gate.eval.js — replay eval for domain/terse-gate/terse-gate.discipline.hook.js (Stop hook).
// Mechanism: reads transcript_path JSONL off disk, finds last assistant text, counts "heavy" prose
// lines (trimmed >150 chars, not a '|' table row, no box/arrow chars) outside code fences.
// heavy>=6 AND text.length>=800 AND not EXEMPT -> decision-json {decision:'block',...} on stdout, exit 0.
// Otherwise exits 0 with no decision-json.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'terse-gate.discipline.hook.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function writeTranscript(file, assistantText) {
  const p = path.join(os.tmpdir(), file);
  const lines = [
    JSON.stringify({ message: { role: 'user', content: [{ type: 'text', text: 'please answer' }] } }),
    JSON.stringify({ message: { role: 'assistant', content: [{ type: 'text', text: assistantText }] } }),
  ];
  fs.writeFileSync(p, lines.join('\n') + '\n', 'utf8');
  return p;
}

function runHook(transcriptPath) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ transcript_path: transcriptPath, stop_hook_active: false }),
    encoding: 'utf8',
    timeout: 30000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO_ROOT },
  });
}

function isBlocked(r) {
  if (!r.stdout) return false;
  try { return JSON.parse(r.stdout.trim()).decision === 'block'; } catch (_) { return false; }
}

// --- F1: clean input passes (no block) ---
// >800 chars total, but the long content is formatted as table rows ('|' prefix) + a box diagram
// line, so "heavy" count of >150-char prose lines stays 0.
const tableRow = '| Root cause | The listener attribute was missing from the dropdown | Fix | Copied the working sibling wiring exactly as-is including process and update attributes |';
const cleanLines = [];
for (let i = 0; i < 8; i++) cleanLines.push(tableRow);
cleanLines.push('┌──────────────┐');
cleanLines.push('│ before → after │');
cleanLines.push('└──────────────┘');
let cleanText = cleanLines.join('\n');
while (cleanText.length < 850) cleanText += '\nshort line.';
const cleanPath = writeTranscript('fixture-terse-clean.jsonl', cleanText);

let r = runHook(cleanPath);
check('F1 clean (table+diagram) input passes (no block)', r.status === 0 && !isBlocked(r), 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 120));

// --- F2: trigger input BLOCKS ---
// 6+ separate plain-prose lines, each >150 chars, no leading '|', no box/arrow chars, outside
// any code fence, total text length > 800 chars.
const proseSentence = 'This is a long-winding plain prose paragraph written as a single line that goes on and on without any table formatting or diagram characters and simply keeps blabbering past one hundred fifty characters easily every single time it is written this way.';
const heavyLines = [];
for (let i = 0; i < 7; i++) heavyLines.push(proseSentence + ' (line ' + i + ')');
const triggerText = heavyLines.join('\n');
const triggerPath = writeTranscript('fixture-terse-trigger.jsonl', triggerText);

r = runHook(triggerPath);
check('F2 trigger (6+ heavy prose lines) BLOCKS', r.status === 0 && isBlocked(r), 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 200));
if (isBlocked(r)) {
  const parsed = JSON.parse(r.stdout.trim());
  check('F2 block reason names terse-gate', /terse-gate/.test(parsed.reason), parsed.reason.slice(0, 80));
}

// --- F3: bypass token passes ---
// Same heavy-prose shape as F2, but with the [skip-terse: ...] bypass token present -> EXEMPT.
const bypassText = triggerText + '\n[skip-terse: personal reflection, prose is intentional here]';
const bypassPath = writeTranscript('fixture-terse-bypass.jsonl', bypassText);

r = runHook(bypassPath);
check('F3 [skip-terse:] bypass token passes (no block)', r.status === 0 && !isBlocked(r), 'exit=' + r.status + ' stdout=' + (r.stdout || '').slice(0, 120));

// --- F4 (bonus): short reply (<800 chars) passes even if it looks heavy ---
const shortHeavy = proseSentence; // single line, well under 800 total chars
const shortPath = writeTranscript('fixture-terse-short.jsonl', shortHeavy);
r = runHook(shortPath);
check('F4 short reply (<800 chars) passes regardless of shape', r.status === 0 && !isBlocked(r), 'exit=' + r.status);

// cleanup tmp fixtures
for (const p of [cleanPath, triggerPath, bypassPath, shortPath]) { try { fs.unlinkSync(p); } catch (_) {} }

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nterse-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
