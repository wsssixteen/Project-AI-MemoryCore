#!/usr/bin/env node
/**
 * eval.js — convention-check-gate fixtures (5)
 *
 * Runs the hook via spawnSync against temp transcripts. The hook is COPIED into a
 * temp sandbox dir first so eval fires write their log.jsonl in the sandbox, never
 * polluting the real domain/convention-check-gate/log.jsonl.
 *
 * Exit 0 only if 5/5 PASS.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK_SRC = path.resolve(__dirname, 'convention-check-gate.gate.hook.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ccg-eval-'));
const SANDBOX = path.join(TMP, 'domain', 'convention-check-gate');
fs.mkdirSync(SANDBOX, { recursive: true });
const HOOK = path.join(SANDBOX, 'convention-check-gate.gate.hook.js');
fs.copyFileSync(HOOK_SRC, HOOK);
const SANDBOX_LOG = path.join(SANDBOX, 'log.jsonl');

function writeTranscript(name, content) {
  const p = path.join(TMP, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

function runHook(inputObj) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(inputObj),
    encoding: 'utf8',
    timeout: 15000,
  });
  let out = null;
  if (r.stdout && r.stdout.trim()) {
    try { out = JSON.parse(r.stdout); } catch (_) { out = null; }
  }
  return { status: r.status, stdout: r.stdout || '', out };
}

function lastLogAction() {
  try {
    const lines = fs.readFileSync(SANDBOX_LOG, 'utf8').trim().split('\n');
    return JSON.parse(lines[lines.length - 1]).action;
  } catch (_) { return null; }
}

const JAVA_FILE = 'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\melaka\\MlkMaklumatPajakanForm.java';
const results = [];

// ── Fixture 1: etanah .java Edit + transcript WITHOUT analog citation → deny ──
{
  const t = writeTranscript('t1.txt', 'plain chatter, no citation of anything here.\nStill nothing.\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: JAVA_FILE }, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = !!(hso && hso.permissionDecision === 'deny' &&
    /analog|sibling/i.test(hso.permissionDecisionReason || '') &&
    lastLogAction() === 'blocked');
  results.push({ name: '1. java edit, no citation -> deny (reason mentions analog/sibling)', pass });
}

// ── Fixture 2: same + transcript containing "← sibling MlkFoo.java:123" → allow ──
{
  const t = writeTranscript('t2.txt', 'Per-file sibling-diff: MlkBar.java:88 ← sibling MlkFoo.java:123: attrs ok\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: JAVA_FILE }, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = !!(hso && !hso.permissionDecision &&
    typeof hso.additionalContext === 'string' &&
    hso.additionalContext.includes('convention-check-gate') &&
    lastLogAction() === 'allowed');
  results.push({ name: '2. java edit, "← sibling MlkFoo.java:123" cited -> allow (advisory only)', pass });
}

// ── Fixture 3: same + bypass token → allow ──
{
  const t = writeTranscript('t3.txt', 'audit context. [skip-convention-check: test] proceeding.\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: JAVA_FILE }, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = !!(hso && !hso.permissionDecision &&
    typeof hso.additionalContext === 'string' &&
    lastLogAction() === 'allowed');
  results.push({ name: '3. java edit + [skip-convention-check: test] -> allow', pass });
}

// ── Fixture 4: .docx edit → advisory additionalContext present, NO deny ──
{
  const t = writeTranscript('t4.txt', 'no citations here either\n');
  const r = runHook({
    tool_name: 'Edit',
    tool_input: { file_path: 'E:\\Projects\\Melaka\\etanah-pelupusan\\resources\\template\\KertasTemplate.docx' },
    transcript_path: t,
  });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = !!(hso && !hso.permissionDecision &&
    typeof hso.additionalContext === 'string' &&
    hso.additionalContext.includes('.docx template') &&
    lastLogAction() === 'advisory');
  results.push({ name: '4. .docx edit -> advisory present, no deny', pass });
}

// ── Fixture 5: unmatched file (.md) → silent ──
{
  const t = writeTranscript('t5.txt', 'irrelevant\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: 'C:\\notes\\README.md' }, transcript_path: t });
  const pass = r.status === 0 && r.stdout.trim() === '';
  results.push({ name: '5. .md edit -> silent (exit 0, no output)', pass });
}

// ── Report ──
let failed = 0;
for (const r of results) {
  console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.name);
  if (!r.pass) failed++;
}
console.log('---');
console.log('convention-check-gate eval: ' + (results.length - failed) + '/' + results.length);

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed === 0 ? 0 : 1);
