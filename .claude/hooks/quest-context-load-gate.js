/**
 * quest-context-load-gate.js — Stop hook
 *
 * VERIFIES (at turn-end) that an OPEN quest's ground-truth context was actually
 * READ this session: the BA Description, the BA History journal, the 0. Brief/
 * attachments, and the main quest md. Closes the "loading ≠ following" gap:
 * quest-resume-preflight.js (UserPromptSubmit) REMINDS to load these; this hook
 * CHECKS they were loaded and flags whatever is missing.
 *
 * Built 2026-07-02 (per みや, QA-268273 PRBB slip). Root cause it closes:
 *   BA's Description LISTED PRBB among the affected urusan, but the Description
 *   was never re-anchored — so a mechanism-gap finding got mis-framed as a SCOPE
 *   question ("confirm before scoping to PRBB") against a BA-listed urusan.
 *   OBJECTIVE-LOCK rule #4 (no scope-contraction of a BA-listed item) failed to
 *   fire because the BA scope source (Description.txt) wasn't in context.
 *   The existing preflight loads History/Notes/qa_doc but NOT Description/attachments.
 *
 * ── WHAT THIS CAN AND CANNOT DO ─────────────────────────────────────────────
 *   CAN  (presence): confirm the transcript shows a read of each ground-truth
 *        file (Description.txt · History.txt · QA-<n>.md · a 0. Brief/ attachment).
 *   CANNOT (comprehension): confirm I UNDERSTOOD / re-anchored the BA scope.
 *        Reading ≠ following — that stays model judgment (RCRL + OBJECTIVE-LOCK #4).
 *
 * Fires ONLY when ALL hold:
 *   (a) quest/active.txt TOP block status ∈ {active, hold, blocked, delegated}
 *       (an OPEN quest) AND phase ∈ {0, 1}  (the load/resume window), AND
 *   (b) the session transcript is MISSING one or more ground-truth reads.
 *   Otherwise → ALLOW (exit 0, silent).
 *
 * Fail-OPEN: any error (no transcript, no active.txt, parse fail) → ALLOW.
 * Bypass: include [skip-context-load: <reason>] anywhere in the session.
 *
 * v1: REPORT-ONLY — emits an advisory via stderr; never blocks the Stop.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');
const OPEN_STATUSES = new Set(['active', 'hold', 'blocked', 'delegated']);

// Parse EVERY qa= block (active.txt interleaves many; top-block heuristic is unsafe).
function parseAllBlocks() {
  let text;
  try { text = fs.readFileSync(ACTIVE_TXT, 'utf8'); } catch { return []; }
  const parts = text.split(/^qa=/m).slice(1); // each part = one block body, sans the 'qa=' prefix
  return parts.map((p) => {
    const block = 'qa=' + p;
    const get = (k) => (block.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1];
    return {
      qa: ((p.match(/^(\S+)/) || [])[1] || '').trim(),
      phase: (get('phase') || '').trim(),
      status: (get('status') || '').trim(),
      task_folder: (get('task_folder') || '').trim(),
      qa_doc: (get('qa_doc') || '').trim(),
    };
  });
}

// The in-focus quest = the OPEN, load-window quest MOST referenced in this session's
// transcript. Counting occurrences beats "top block" (unordered) and beats a plain
// includes() (the objective-lock hook injects every open quest's id each turn, so the
// actively-worked quest is the one that recurs far more often).
function inFocusOpenQuest(blocks, transcript) {
  const candidates = blocks
    .filter((b) => b.qa && OPEN_STATUSES.has(b.status) && (b.phase === '0' || b.phase === '1'))
    .map((b) => ({ b, count: transcript.split(b.qa).length - 1 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  return candidates.length ? candidates[0].b : null;
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    let transcript = '';
    try { transcript = fs.readFileSync(data.transcript_path, 'utf8'); } catch { process.exit(0); }

    if (/\[skip-context-load:/i.test(transcript)) process.exit(0);

    const active = inFocusOpenQuest(parseAllBlocks(), transcript);
    if (!active || !active.qa) process.exit(0);

    // Ground-truth reads: each satisfied if its filename appears in the transcript
    // (a Read tool call / result surfaces the path). Loose by design — v1 advisory.
    const qaMd = `${active.qa}.md`;
    const checks = [
      { label: 'BA Description', ok: /Description\.txt/i.test(transcript), hint: `${active.task_folder}\\0. Brief\\Description.txt` },
      { label: 'BA History journal', ok: /History\.txt/i.test(transcript), hint: `${active.task_folder}\\0. Brief\\History.txt` },
      { label: 'main quest doc', ok: transcript.includes(qaMd), hint: active.qa_doc || `projects/coding-projects/active/${active.qa}/${qaMd}` },
      { label: '0. Brief attachments (photos/pdf/video)', ok: /0\.\s*Brief/i.test(transcript), hint: `${active.task_folder}\\0. Brief\\ — open EVERY file, emit 1 line each` },
    ];

    const missing = checks.filter(c => !c.ok);
    if (missing.length === 0) process.exit(0);

    const lines = [
      '',
      `📂 quest-context-load-gate (ADVISORY): ${active.qa} is an OPEN quest (status=${active.status}, phase=${active.phase})`,
      `   but this session's transcript shows NO read of ${missing.length} ground-truth source(s).`,
      `   BA's WRITTEN scope is GROUND TRUTH — load it before any scope / fix / recon judgment:`,
      '',
    ];
    for (const c of missing) lines.push(`     🔴 ${c.label} — ${c.hint}`);
    lines.push('');
    lines.push('   Reading ≠ following: after loading, re-anchor to BA\'s exact urusan/issue list');
    lines.push('   (OBJECTIVE-LOCK #4 — NEVER question a BA-listed item\'s scope; a mechanism gap is a');
    lines.push('   test-watch note, not a scope question). Genuine non-quest turn? [skip-context-load: <reason>]');

    process.stderr.write(lines.join('\n') + '\n');
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-open
  }
});
