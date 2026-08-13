#!/usr/bin/env node
// adhoc-paste-detector.check.hook.js — born via core/forge.js (2026-08-13)
// TRIGGER: miya pastes a BA-relayed issue as labelled fields (Urusan:/Tugasan:/Id:<PTMLK.../>/User:) with NO Redmine number
// ACTION: inject the MANDATORY ADHOC-scaffold procedure (task folder + active.txt block + ADHOC-REGISTER row + qa_doc) so the issue is captured like a Redmine retrieval, not answered inline and lost
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// NOD: miya 2026-08-13 — "auto-create an adhoc ticket when I paste this format, like Redmine retrieval or /quest start."
// SLIP REPLAY: 2026-08-13 PPTPB Teknikal Selangor issue pasted several times; each answered inline, no scaffold.
// WHY UserPromptSubmit (not Stop): the scaffold is knowable BEFORE the reply — capture at intake.
// PRIMITIVE: hook-only (Rule 7) — deterministic paste-detection; no procedural state to hold.
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const BYPASS_RE = /\[skip-adhoc-paste:\s*[^\]]+\]/i;

// A Redmine ticket signal means the normal quest/retrieval path owns it — do NOT treat as ADHOC.
const TICKET_NUM_RE = /\b(?:QA|FAT-OR|UAT-CR|FAT|UAT|eSOKONGAN|ESOKONGAN|REQUIREMENT|INTERNAL(?:\s+ISSUE)?)\s*#?\s*\d{4,}\b|#\s?\d{5,7}\b/i;

// The BA-paste fingerprint: labelled fields, one per line. Malay/English label variants.
const F_URUSAN  = /^\s*urusan\s*:/im;
const F_TUGASAN = /^\s*tugasan\s*:/im;
const F_ID      = /^\s*id\s*(?:permohonan)?\s*:\s*\S/im;
const F_USER    = /^\s*(?:user|pengguna)\s*:/im;
// The Id line usually carries a permohonan id like PTMLK/03/L/PPTPB/2026/4 (state/office/L/urusan/year/n).
const PERMOHONAN_ID_RE = /\b[A-Z]{2,5}\/\d{2}\/[A-Z]\/[A-Z]+\/\d{4}\/\d+\b/i;

function fieldCount(prompt) {
  return [F_URUSAN, F_TUGASAN, F_ID, F_USER].reduce((n, re) => n + (re.test(prompt) ? 1 : 0), 0);
}
function extractUrusan(prompt) {
  const m = prompt.match(/^\s*urusan\s*:\s*([A-Za-z]+)/im);
  return m ? m[1].toUpperCase() : 'XXX';
}

runHook({ name: 'adhoc-paste-detector', event: 'UserPromptSubmit' }, (input) => {
  let data = input;
  if (typeof input === 'string') {
    try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  }
  const prompt = (data && data.prompt) || '';
  if (!prompt) return { fired: false };
  if (BYPASS_RE.test(prompt)) return { fired: false };

  // Already a Redmine ticket → the normal quest/retrieval flow owns it, not ADHOC.
  if (TICKET_NUM_RE.test(prompt)) return { fired: false };

  // Need the labelled-field fingerprint (>=3 of 4 labels) AND a permohonan-id shaped Id.
  if (fieldCount(prompt) < 3) return { fired: false };
  if (!PERMOHONAN_ID_RE.test(prompt)) return { fired: false };

  const urusan = extractUrusan(prompt);
  const lines = [
    '🆕 adhoc-paste-detector: BA-relayed issue in "field:" format with NO Redmine number.',
    '   → This is an ADHOC. Create the SAME scaffold a Redmine retrieval / /quest start does —',
    '     do NOT merely answer inline (the answer is lost to chat and re-investigated later).',
    '',
    '   MANDATORY scaffold (all in this turn, before/with the diagnosis):',
    '     1. Task folder: "1. Tasks\\Melaka\\<N+1>. ADHOC - <ENV> - ' + urusan + ' - <short desc>"',
    '        + 0. Brief/brief.txt (BA verbatim Isu/Expected/ask) + notes via:',
    '        node quest/notes.js --folder "<folder>" --qa ADHOC-' + urusan + '-<year>-<n> --env <ENV> --urusan ' + urusan + ' --id "<permohonan>" --user "<login>" --reset',
    '     2. active.txt block:',
    '        node quest/active-cli.js start ADHOC-' + urusan + '-<year>-<n> phase=0 status=active ticket_type=adhoc env=<ENV> urusan=' + urusan + ' quest_start=@now local_test_confirmed=false adhoc_register_row=<A#> qa_doc=<path> task_folder="<folder>" issue_one_liner="<...>"',
    '     3. ADHOC-REGISTER.md: append the next A# row (grep-able identifiers, honest Status).',
    '     4. qa_doc: projects/coding-projects/active/ADHOC-<slug>/ADHOC-<slug>.md — full investigation.',
    '',
    '   Bypass (genuinely not an ADHOC / already scaffolded): [skip-adhoc-paste: <reason>]',
  ];
  return { fired: true, blocked: false, contextOut: lines.join('\n') + '\n' };
});
