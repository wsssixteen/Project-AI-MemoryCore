#!/usr/bin/env node
// commit-subject-gate.check.hook.js — born via core/forge.js (2026-09-02)
// TRIGGER: the reply carries an etanah commit subject — a fenced block whose only line matches
//          ^(QA|Ref) #NNN - …, or a `git commit -m "…"` string inside a fenced block.
// ACTION: BLOCK when the subject breaks the deterministic shape:
//   R1  ';' anywhere
//   R2  en/em dash anywhere, or a spaced " - " beyond the 3 allowed segment separators
//       (prefix - URUSAN - TUGASAN - description); intra-word hyphens (int-env, e-Doket) are fine
//   R3  arrows (->, =>, →) or pipes
//   R4  a NON-CHANGE word in the description: keep/kept/keeping/leave/leaving/left/untouched/unchanged/
//       retain(ed)/remain(s)/still — a commit subject describes what CHANGED, never what did not
//   R5  subject longer than 100 characters
//   R6  a REDRAFT for the same ticket that is LONGER than the previous draft in this transcript —
//       a correction rewrite must be shorter or equal, never longer
// WHY: QA-277697 2026-09-02 — five drafts of one subject, each longer than the last, carrying ';', dashes
//      and "keep 3 trg pages" (a non-change), until miya wrote the message himself. A prose rule existed
//      in .claude/commit-conventions.md and was skipped five times in one hour.
// SATISFY: rewrite the subject so every rule holds, then re-send.
// Bypass: [skip-commit-subject: <reason>]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const SUBJECT_RE = /^(QA|Ref) #(\d{4,}) - /i;
const NON_CHANGE = /\b(keep|kept|keeping|leave|leaving|left|untouched|unchanged|retain|retained|retains|remain|remains|remained|still)\b/i;
const MAX_LEN = 100;
const MAX_SEPARATORS = 3;

function assistantTexts(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return []; }
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line) continue;
    let obj; try { obj = JSON.parse(line); } catch (_) { continue; }
    const msg = obj.message || obj;
    if ((msg.role || obj.type) !== 'assistant') continue;
    const c = msg.content;
    let text = '';
    if (typeof c === 'string') text = c;
    else if (Array.isArray(c)) text = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    if (text.trim()) out.push(text);
  }
  return out;
}

// Subjects = single-line fenced blocks matching SUBJECT_RE, plus -m "…" strings in fenced blocks.
function extractSubjects(text) {
  const subjects = [];
  const fence = /```[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = fence.exec(text))) {
    const body = m[1].replace(/\r/g, '').trim();
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 1 && SUBJECT_RE.test(lines[0])) { subjects.push(lines[0]); continue; }
    const mm = /git\s+commit[^\n]*?-m\s+(["'])([\s\S]*?)\1/.exec(body);
    if (mm && SUBJECT_RE.test(mm[2].trim())) subjects.push(mm[2].trim());
  }
  return subjects;
}

function violations(subject, previousSameTicket) {
  const v = [];
  const ticket = (SUBJECT_RE.exec(subject) || [])[2];
  const parts = subject.split(' - ');
  const description = parts[parts.length - 1];
  if (/;/.test(subject)) v.push('R1 ";" is banned');
  if (/[–—]/.test(subject) || parts.length - 1 > MAX_SEPARATORS) v.push('R2 dash: only " - " between prefix/URUSAN/TUGASAN/description is allowed, none inside the description');
  if (/-{1,2}>|=>|→|\|/.test(subject)) v.push('R3 arrows and pipes are banned');
  const nc = NON_CHANGE.exec(description);
  if (nc) v.push(`R4 non-change word "${nc[1]}": a subject says what CHANGED, never what was left alone`);
  if (subject.length > MAX_LEN) v.push(`R5 ${subject.length} chars, max ${MAX_LEN}`);
  if (previousSameTicket && subject.length > previousSameTicket.length) {
    v.push(`R6 redraft is LONGER than the previous draft (${subject.length} > ${previousSameTicket.length}); a correction rewrite gets shorter, never longer`);
  }
  return { ticket, v };
}

runHook({ name: 'commit-subject-gate', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const texts = assistantTexts(data.transcript_path || '');
  if (!texts.length) return { fired: false };
  const last = texts[texts.length - 1];
  const subjects = extractSubjects(last);
  if (!subjects.length) return { fired: false };
  if (/\[skip-commit-subject:\s*[^\]]+\]/i.test(last)) return { fired: true, bypassed: true, bypassToken: 'skip-commit-subject' };

  // Previous drafts for the same ticket, most recent first, from EARLIER assistant messages only.
  const previous = {};
  for (let i = texts.length - 2; i >= 0; i--) {
    for (const s of extractSubjects(texts[i])) {
      const t = (SUBJECT_RE.exec(s) || [])[2];
      if (t && !previous[t]) previous[t] = s;
    }
  }

  const problems = [];
  for (const s of subjects) {
    const t = (SUBJECT_RE.exec(s) || [])[2];
    const { v } = violations(s, previous[t]);
    if (v.length) problems.push({ s, v });
  }
  if (!problems.length) return { fired: true, blocked: false };

  const lines = ['⛔ commit-subject-gate: the drafted commit subject breaks the deterministic shape.'];
  for (const p of problems) {
    lines.push(`   Subject: ${p.s}`);
    for (const x of p.v) lines.push(`     - ${x}`);
  }
  lines.push('   Shape: `Ref #<num> - <URUSAN> - <TUGASAN> - <what changed>`  (QA # for the QA tracker)');
  lines.push('   Description verbs come from the staged diff only: add / remove / rename / fix / change. Join with "," or "and" or "&".');
  lines.push('   Rewrite it SHORTER, then re-send. Bypass only with a reason: [skip-commit-subject: <reason>]');
  return { fired: true, blocked: true, contextOut: lines.join('\n') };
});
