#!/usr/bin/env node
/**
 * eval.js — quest-phase-gate fixtures (30; 6-16 = v3 requirement read, 2026-11-03 287811;
 *           17-30 = v4 REQUIREMENT-RULES ledger, 2026-11-05)
 *
 * The hook locates active.txt via path.resolve(__dirname, '..', '..') + quest/active.txt
 * (two levels up from the hook file — NOT env, NOT cwd). So the eval sandbox-copies the
 * hook into a temp depth-2 tree (<tmp>/domain/quest-phase-gate/) and writes a controlled
 * <tmp>/quest/active.txt beside it. This also keeps eval fires out of the real log.jsonl.
 *
 * Exit 0 only if every fixture PASSes.
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
const PHASES = ['Issue Checklist', '═══ SCOUT ═══', '═══ RECON ═══', '═══ RUBRIC ═══',
  'git log --oneline -20 -- src/main/java/my/gov/melaka/MlkFooForm.java', 'ENTRY-POINT: someForm.xhtml:42 -> MlkFooForm.onSave()'];
const READ_223236 = 'REQUIREMENT-READ #223236 for 287811 · Requirement · Rework';
const MATCH_223236 = 'REQUIREMENT-MATCH: 287811 → #223236 "MCL - TUGASAN PENYEDIAAN/SEMAKAN" — contradicts — read: "status dokumen adalah Sedia"';
// v4: every read needs a ledger row; the v3 allow fixtures (2, 9, 15) carry one so they still test v3 alone.
const RULES_223236 = 'REQUIREMENT-RULES: R1 · #223236 · "status dokumen adalah Sedia" · applies to SDK · our value Draf';
const REQ_OK = READ_223236 + '\n' + MATCH_223236 + '\n' + RULES_223236;
function reqCase(n, name, extra, expectAllow) {
  setActive(ACTIVE_BLOCK);
  const t = writeTranscript('r' + n + '.txt', [...PHASES, ...extra, ''].join('\n'));
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: ETANAH_JAVA }, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = expectAllow
    ? r.status === 0 && r.stdout.trim() === '' && lastLogAction() === 'allowed'
    : !!(hso && hso.permissionDecision === 'deny' && /Requirement read/.test(hso.permissionDecisionReason || '') && /--read <req>/.test(hso.permissionDecisionReason || '') && lastLogAction() === 'blocked');
  results.push({ name: n + '. ' + name + (expectAllow ? ' -> allow' : ' -> deny'), pass });
}

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
    REQ_OK,
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

// ── Fixtures 6-16: v3 requirement read ──
reqCase(6, 'phases present, no REQUIREMENT-MATCH line', [], false);
reqCase(7, 'subject-only verdict, no read quote (the 287811 slip)', [READ_223236, 'REQUIREMENT-MATCH: 287811 → #223236 "MCL - TUGASAN" — aligned — a prepared letter carries forward'], false);
reqCase(8, 'quoted verdict but the requirement was never read this session', ['REQUIREMENT-MATCH: 287811 → #223236 "MCL - TUGASAN" — aligned — read: "Sedia"'], false);
reqCase(9, 'quoted verdict + REQUIREMENT-READ of the same req', [REQ_OK], true);
reqCase(10, 'none found', ['REQUIREMENT-MATCH: 287811 → none — none found — no requirement covers this screen'], true);
reqCase(11, 'not needed (alter request)', ['REQUIREMENT-MATCH: 287811 → none — not needed — alter request'], true);
reqCase(12, 'ticket-gate template text only (self-disarm guard)', ['emit `REQUIREMENT-MATCH: 287811 → <req> — aligned | extends | contradicts | none found | not needed`'], false);
reqCase(13, 'requirement-index --ticket Next line only', ['  Next: read it in full before any verdict: node quest/requirement-index.js --read 223236 --for 287811 (a subject match is never a verdict). Then write REQUIREMENT-MATCH: 287811 → #<req> "<subject>" — <aligned | extends | contradicts> — read: "<the rule that decides, quoted>", or none found / not needed.'], false);
reqCase(14, 'requirement-index --read Next line + READ banner, no verdict of mine', [READ_223236, '  Next: quote the rule that decides in the line: REQUIREMENT-MATCH: 287811 → #223236 "MCL - TUGASAN PENYEDIAAN/SEMAKAN DAN PENGESAHAN SURAT KEPUTUSAN DAN NOTIS 5A - PDT" — <aligned | extends | contradicts> — read: "<quoted rule>"'], false);
reqCase(15, 'JSONL-escaped quote in assistant text', [JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: READ_223236 }] } }), JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'REQUIREMENT-MATCH: 287811 → #223236 "MCL - TUGASAN" — contradicts — read: "status Sedia"\n\n' + RULES_223236 }] } })], true);
reqCase(16, 'READ banner is for a different requirement', ['REQUIREMENT-READ #111111 for 287811', 'REQUIREMENT-MATCH: 287811 → #223236 "MCL - TUGASAN" — aligned — read: "Sedia"'], false);

// ── Fixtures 17-29: v4 REQUIREMENT-RULES ledger (2026-11-05, handoff item 7) ──
// Every transcript passes v3 (READ #223236 + quoted MATCH), so the outcome turns on the ledger alone.
const READ_248531 = 'REQUIREMENT-READ #248531 for 287811 · Requirement · Closed';
const V3_BASE = [READ_223236, MATCH_223236];
function rulesCase(n, name, extra, expectAllow, named, notNamed, raw) {
  setActive(ACTIVE_BLOCK);
  const t = writeTranscript('v' + n + '.txt', raw || [...PHASES, ...V3_BASE, ...extra, ''].join('\n'));
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: ETANAH_JAVA }, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const why = (hso && hso.permissionDecisionReason) || '';
  const line = why.split('\n').find(l => /Requirement rules:/.test(l)) || '';
  const pass = expectAllow
    ? r.status === 0 && r.stdout.trim() === '' && lastLogAction() === (expectAllow === 'bypassed' ? 'bypassed' : 'allowed')
    : !!(hso && hso.permissionDecision === 'deny' && !/Requirement read/.test(why) && line
        && (named || []).every(q => line.includes('#' + q)) && !(notNamed || []).some(q => line.includes('#' + q))
        && line.includes('write `REQUIREMENT-RULES:` with `R<n> · #<req> · "<quote>"` or `R0 none`')
        && lastLogAction() === 'blocked');
  results.push({ name: n + '. ' + name + (expectAllow ? ' -> allow' : ' -> deny'), pass });
}
const jl = (type, text) => JSON.stringify(type === 'tool'
  ? { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: text }] } }
  : { type, message: { role: type, content: [{ type: 'text', text }] } });

rulesCase(17, 'one read, one-line ledger row for it', [RULES_223236], true);
rulesCase(18, 'two reads, a row for only one (names the other)', [READ_248531, RULES_223236], false, ['248531'], ['223236']);
rulesCase(19, 'two reads, marker + R0 none on one line', [READ_248531, 'REQUIREMENT-RULES:' + ' R0 none'], true); // split: a Read of this file must not pass the gate
rulesCase(20, 'R0 none on its own line under the marker', [READ_248531, 'REQUIREMENT-RULES:', '- R0 none'], true);
rulesCase(21, 'two reads, two rows in a multi-line block', [READ_248531, 'REQUIREMENT-RULES:',
  'R1 · #223236 · "status dokumen adalah Sedia" · applies to SDK · our value Draf',
  'R2 · #248531 · "daftar nota mohon juga perlu mengikut pejabat Hakmilik" · applies to SPIL · our value 02'], true);
rulesCase(22, 'row names the wrong requirement number', ['REQUIREMENT-RULES: R1 · #223237 · "status dokumen adalah Sedia"'], false, ['223236'], ['223237']);
rulesCase(23, 'ledger written before the read (order free)', [], true, null, null,
  [...PHASES, RULES_223236, '', ...V3_BASE, ''].join('\n'));
rulesCase(24, 'template rows in tool output only (requirement-index hint)', [], false, ['223236'], null,
  [...PHASES, jl('tool', READ_223236 + '\n  Next: write REQUIREMENT-RULES: R<n> · #223236 · "<the deciding sentence, quoted>" · applies to <tugasan>\n  R1 · #223236 · "<quote>" · or R0 none when none'), MATCH_223236, ''].join('\n'));
rulesCase(25, 'an earlier v4 deny in the transcript (self-disarm guard)', [], false, ['223236'], null,
  [...PHASES, ...V3_BASE, jl('tool', '   Requirement rules: no REQUIREMENT-RULES row for read #223236 — write `REQUIREMENT-RULES:` with `R<n> · #<req> · "<quote>"` or `R0 none`\n\n   This gate checks'), ''].join('\n'));
rulesCase(26, 'row with no REQUIREMENT-RULES marker', ['R1 · #223236 · "status dokumen adalah Sedia"'], false, ['223236']);
rulesCase(27, 'R0 none in prose, no marker', ['the ledger is R0 none for this one'], false, ['223236']);
rulesCase(28, 'JSONL assistant block (escaped newlines and quotes)', [], true, null, null,
  [...PHASES, jl('tool', READ_223236 + '\n' + READ_248531), jl('assistant', MATCH_223236 + '\n\nREQUIREMENT-RULES:\nR1 · #223236 · "status Sedia"\nR2 · #248531 · "mengikut pejabat Hakmilik"\n\nNext I edit the form.'), ''].join('\n'));
rulesCase(29, 'bypass token, reads with no rows', [], 'bypassed', null, null,
  [jl('user', 'walk through'), jl('tool', READ_223236 + '\n' + READ_248531), jl('assistant', 'audit edit. [skip-phase-gate: test] continuing.')].join('\n') + '\n');
rulesCase(30, 'block ends at a blank line; a row after it does not count', [READ_248531, 'REQUIREMENT-RULES: R1 · #223236 · "Sedia"', '', 'R2 · #248531 · "Hakmilik"'], false, ['248531'], ['223236']);

// ── Fixtures 31-33: v5 branch binding (2026-11-05, #287811) ──
// The edited repo's branch names the ticket; THAT block must be status=active, whatever other blocks say.
{
  const runBranch = (branch, inputObj) => spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(inputObj), encoding: 'utf8', timeout: 20000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: path.resolve(__dirname, '..', '..'), QUEST_PHASE_GATE_BRANCH: branch },
  });
  const t = writeTranscript('t31.txt', [...PHASES, ...V3_BASE, RULES_223236, ''].join('\n'));
  setActive('qa=QA-287811\nstatus=closed\nlocal_test_confirmed=true\nclosed=2026-11-03\n\n' + ACTIVE_BLOCK);
  let r = runBranch('mlk/internal/287811', { tool_name: 'Edit', tool_input: { file_path: ETANAH_JAVA }, transcript_path: t });
  results.push({ name: '31. v5 branch ticket 287811 is status=closed while another block is active -> deny (the 287811 shape)', pass: r.status === 0 && /"deny"/.test(r.stdout) && /not status=active/.test(r.stdout) && /active-cli\.js update QA-287811/.test(r.stdout) });
  setActive('qa=QA-287811\nstatus=active\nlocal_test_confirmed=false\nclosed=2026-11-03\n\n' + ACTIVE_BLOCK);
  r = runBranch('mlk/internal/287811', { tool_name: 'Edit', tool_input: { file_path: ETANAH_JAVA }, transcript_path: t });
  results.push({ name: '32. v5 branch ticket 287811 re-opened (status=active) + all banners -> allow', pass: r.status === 0 && r.stdout.trim() === '' });
  setActive(ACTIVE_BLOCK);
  r = runBranch('mlk/master', { tool_name: 'Edit', tool_input: { file_path: ETANAH_JAVA }, transcript_path: t });
  results.push({ name: '33. v5 branch without a ticket number falls back to the old predicate (any active block) -> allow', pass: r.status === 0 && r.stdout.trim() === '' });
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
