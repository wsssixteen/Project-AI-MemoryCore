#!/usr/bin/env node
// citation-cross-check.eval.js — replay eval for domain/citation-cross-check/citation-cross-check.check.hook.js (Stop hook)
// Mechanism: reads {transcript_path, stop_hook_active} from stdin, reads the transcript
// JSONL file itself, finds the last assistant text + the Read/Grep/Glob tool_use inputs
// since the last user message, and — for a trace-shaped reply (Scout/Recon/class-chain)
// citing >=2 file:line locations where >=1 basename was never touched — logs a SILENT
// telemetry row (spawn_tool + unbacked_citations) to system/telemetry/hook-fires.jsonl.
// Never writes to stdout. Never blocks.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'citation-cross-check.check.hook.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const TELEMETRY_FILE = path.join(REPO_ROOT, 'meta', 'telemetry', 'hook-fires.jsonl');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function msg(role, blocks) {
  return { type: role, message: { role, content: blocks } };
}
function textBlock(t) { return { type: 'text', text: t }; }
function toolUse(name, input) { return { type: 'tool_use', name, input }; }

function writeTranscript(name, lines) {
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, lines.map((l) => JSON.stringify(l)).join('\n') + '\n', 'utf8');
  return p;
}

function run(transcriptPath) {
  const input = JSON.stringify({ transcript_path: transcriptPath, stop_hook_active: false });
  return spawnSync(process.execPath, [HOOK], {
    input, encoding: 'utf8', timeout: 30000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: REPO_ROOT },
  });
}

function telemetryLineCount() {
  try { return fs.readFileSync(TELEMETRY_FILE, 'utf8').split(/\r?\n/).filter(Boolean).length; } catch (_) { return 0; }
}
function telemetryTail(n) {
  try { return fs.readFileSync(TELEMETRY_FILE, 'utf8').split(/\r?\n/).filter(Boolean).slice(-n); } catch (_) { return []; }
}

// ---------------------------------------------------------------------------
// F1: clean, no-fire — no trace signal at all, plain reply → exit 0, empty stdout,
// only the standard runHook telemetry row (fired never surfaces, no spawn_tool).
const f1Path = writeTranscript('fixture-ccc-clean.jsonl', [
  msg('user', [textBlock('what does this function do?')]),
  msg('assistant', [toolUse('Read', { file_path: 'src/FileA.java' })]),
  msg('assistant', [textBlock('FileA.java simply returns the cached value at line 10, nothing else notable here.')]),
]);
let before = telemetryLineCount();
let r = run(f1Path);
check('F1 clean input exits 0', r.status === 0, 'exit=' + r.status);
check('F1 clean input stdout empty', (r.stdout || '') === '', JSON.stringify(r.stdout));
let after = telemetryLineCount();
check('F1 telemetry gains exactly 1 row (standard only)', after - before === 1, 'delta=' + (after - before));
check('F1 telemetry row has no spawn_tool', !/spawn_tool/.test(telemetryTail(1).join('')), telemetryTail(1).join(''));

// ---------------------------------------------------------------------------
// F2: TRIGGER — trace-shaped reply citing 2 files, only one of which was actually
// Read/Grep/Glob'd this turn → must FIRE silently (stdout stays empty; telemetry
// gains 2 rows: the standard runHook row + the manual spawn_tool row).
const f2Path = writeTranscript('fixture-ccc-trigger.jsonl', [
  msg('user', [textBlock('trace the bug through the class chain')]),
  msg('assistant', [toolUse('Read', { file_path: 'src/main/java/mlk/FileA.java' })]),
  msg('assistant', [toolUse('Grep', { pattern: 'populateLuas', path: 'src/main/java/mlk' })]),
  msg('assistant', [textBlock(
    'Scout emit — class chain: FileA.java:120 calls the populator, which writes into ' +
    'FileB.xhtml:42 where the CC tag renders the stale value.'
  )]),
]);
before = telemetryLineCount();
r = run(f2Path);
check('F2 trigger exits 0', r.status === 0, 'exit=' + r.status);
check('F2 trigger stdout empty (silent advisory)', (r.stdout || '') === '', JSON.stringify(r.stdout));
after = telemetryLineCount();
check('F2 telemetry gains 2 rows (standard + spawn_tool)', after - before === 2, 'delta=' + (after - before));
const f2Tail = telemetryTail(2).join('\n');
check('F2 telemetry row carries spawn_tool', /"spawn_tool":"verify-unbacked-citation"/.test(f2Tail), f2Tail.slice(0, 200));
check('F2 telemetry row names the unbacked citation (FileB.xhtml)', /FileB\.xhtml:42/.test(f2Tail), f2Tail.slice(0, 200));
check('F2 telemetry row does NOT flag the backed citation (FileA.java)', !/"unbacked_citations":\["[^"]*FileA/.test(f2Tail), f2Tail.slice(0, 200));

// ---------------------------------------------------------------------------
// F3: edge case — trace-shaped reply, 2 citations, but BOTH basenames were touched
// by Read/Grep/Glob this turn → must NOT fire (no unbacked citation exists).
const f3Path = writeTranscript('fixture-ccc-allbacked.jsonl', [
  msg('user', [textBlock('trace the bug through the class chain')]),
  msg('assistant', [toolUse('Read', { file_path: 'src/main/java/mlk/FileA.java' })]),
  msg('assistant', [toolUse('Read', { file_path: 'src/main/webapp/FileB.xhtml' })]),
  msg('assistant', [textBlock(
    'Recon emit — class chain: FileA.java:120 calls the populator, which writes into ' +
    'FileB.xhtml:42 where the CC tag renders the stale value.'
  )]),
]);
before = telemetryLineCount();
r = run(f3Path);
check('F3 all-backed citations exits 0', r.status === 0, 'exit=' + r.status);
check('F3 all-backed citations stdout empty', (r.stdout || '') === '', JSON.stringify(r.stdout));
after = telemetryLineCount();
check('F3 telemetry gains exactly 1 row (standard only, no fire)', after - before === 1, 'delta=' + (after - before));
check('F3 telemetry row has no spawn_tool', !/spawn_tool/.test(telemetryTail(1).join('')), telemetryTail(1).join(''));

// cleanup tmp fixtures
for (const p of [f1Path, f2Path, f3Path]) { try { fs.unlinkSync(p); } catch (_) {} }

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\ncitation-cross-check.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
