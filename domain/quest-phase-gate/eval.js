#!/usr/bin/env node
/**
 * eval.js — quest-phase-gate fixtures (5)
 *
 * The hook locates active.txt via path.resolve(__dirname, '..', '..') + quest/active.txt
 * (two levels up from the hook file — NOT env, NOT cwd). So the eval sandbox-copies the
 * hook into a temp depth-2 tree (<tmp>/domain/quest-phase-gate/) and writes a controlled
 * <tmp>/quest/active.txt beside it. This also keeps eval fires out of the real log.jsonl.
 *
 * Exit 0 only if 5/5 PASS.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK_SRC = path.resolve(__dirname, 'quest-phase-gate.gate.hook.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'qpg-eval-'));
const SANDBOX = path.join(TMP, 'domain', 'quest-phase-gate');
const QUEST_DIR = path.join(TMP, 'quest');
fs.mkdirSync(SANDBOX, { recursive: true });
fs.mkdirSync(QUEST_DIR, { recursive: true });
const HOOK = path.join(SANDBOX, 'quest-phase-gate.gate.hook.js');
fs.copyFileSync(HOOK_SRC, HOOK);
const SANDBOX_LOG = path.join(SANDBOX, 'log.jsonl');
const ACTIVE_TXT = path.join(QUEST_DIR, 'active.txt');

function setActive(content) { fs.writeFileSync(ACTIVE_TXT, content, 'utf8'); }
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
    env: { ...process.env, CLAUDE_PROJECT_DIR: path.resolve(__dirname, '..', '..') }, // lib resolution for the sandboxed copy (2026-08-21)
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

const ACTIVE_BLOCK = 'qa=QA-999999\nstatus=active\ntask_folder=1. Tasks\\Melaka\\99. test\n';
const ETANAH_JAVA = 'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\melaka\\MlkFooForm.java';
const results = [];

// ── Fixture 1: etanah .java edit + active quest + transcript missing banners → deny ──
{
  setActive(ACTIVE_BLOCK);
  const t = writeTranscript('t1.txt', 'plain session chatter, no phase banners anywhere.\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: ETANAH_JAVA }, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = !!(hso && hso.permissionDecision === 'deny' &&
    /Scout/i.test(hso.permissionDecisionReason || '') &&
    /Rubric/i.test(hso.permissionDecisionReason || '') &&
    lastLogAction() === 'blocked');
  results.push({ name: '1. etanah .java + active quest + no banners -> deny (lists missing phases)', pass });
}

// ── Fixture 2: same + transcript with all banners (+ v2 evidences) → allow ──
// NOTE: the hook requires FOUR markers — "Issue Checklist" in addition to the three
// banners; the transcript carries it (plus the E2/E3 evidence lines so the v2
// advisories stay quiet and the allow is fully silent).
{
  setActive(ACTIVE_BLOCK);
  const t = writeTranscript('t2.txt', [
    'Issue Checklist',
    '═══ SCOUT ═══',
    '═══ RECON ═══',
    '═══ RUBRIC ═══',
    'git log --oneline -20 -- src/main/java/my/gov/melaka/MlkFooForm.java',
    'ENTRY-POINT: someForm.xhtml:42 -> MlkFooForm.onSave()',
    '',
  ].join('\n'));
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: ETANAH_JAVA }, transcript_path: t });
  const pass = r.status === 0 && r.stdout.trim() === '' && lastLogAction() === 'allowed';
  results.push({ name: '2. same + all phase banners in transcript -> allow (silent)', pass });
}

// ── Fixture 3: same as 1 + bypass token → allow ──
{
  setActive(ACTIVE_BLOCK);
  // new bypass contract (2026-08-21): token counts only in current-turn ASSISTANT text (JSONL)
  const t = writeTranscript('t3.txt',
    JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'walk through' }] } }) + '\n' +
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'audit walk-through. [skip-phase-gate: test] continuing.' }] } }) + '\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: ETANAH_JAVA }, transcript_path: t });
  const pass = r.status === 0 && r.stdout.trim() === '' && lastLogAction() === 'bypassed';
  results.push({ name: '3. same + [skip-phase-gate: test] -> allow', pass });
}

// ── Fixture 4: NO active quest → silent (quest-gated BY DESIGN — asserted) ──
{
  setActive('qa=QA-999999\nstatus=archived\ntask_folder=1. Tasks\\Melaka\\Archive\\99. test\n');
  const t = writeTranscript('t4.txt', 'no banners, no bypass — would deny IF a quest were active.\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: ETANAH_JAVA }, transcript_path: t });
  const pass = r.status === 0 && r.stdout.trim() === '';
  results.push({ name: '4. NO active quest -> silent (quest-gated BY DESIGN)', pass });
}

// ── Fixture 5: non-etanah path → silent ──
{
  setActive(ACTIVE_BLOCK);
  const t = writeTranscript('t5.txt', 'no banners here either.\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: 'C:\\temp\\SomeOtherProject\\Foo.java' }, transcript_path: t });
  const pass = r.status === 0 && r.stdout.trim() === '';
  results.push({ name: '5. non-etanah path -> silent', pass });
}

// ── Report ──
let failed = 0;
for (const r of results) {
  console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.name);
  if (!r.pass) failed++;
}
console.log('---');
console.log('quest-phase-gate eval: ' + (results.length - failed) + '/' + results.length);

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed === 0 ? 0 : 1);
