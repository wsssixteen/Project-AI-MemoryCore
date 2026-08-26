#!/usr/bin/env node
// adhoc-paste-detector.check.hook.js — born via core/forge.js (2026-08-13)
// TRIGGER: miya opens with a BA-relayed issue — EITHER labelled fields (Urusan:/Tugasan:/Id:<PTMLK.../>/User:)
//          OR a freeform relay (office code PDTJ/PDTAG/PDTMT + permohonan-id + issue words) — with NO OWNING Redmine number.
// ACTION: inject the MANDATORY ADHOC-scaffold procedure (task folder + active.txt block + ADHOC-REGISTER row + qa_doc) so the issue is captured like a Redmine retrieval, not answered inline and lost
// Lifecycle: created 2026-08-13 (narrow, labelled-only). WIDENED 2026-08-26 (per miya, PDTJ jabatan-teknikal intake).
//
// NOD: miya 2026-08-13 — "auto-create an adhoc ticket when I paste this format, like Redmine retrieval or /quest start."
// NOD: miya 2026-08-26 — widen to office-code (PDTJ/PDTAG/PDTMT) + permohonan-id + issue-desc freeform relays.
// SLIP REPLAY: 2026-08-26 PDTJ "PTMLK/02/L/PT/2026/1 ... mohon semak ... related tiket eSOKONGAN #274318" — answered
//   inline for a dozen turns with NO scaffold; the old hook matched neither signal (0 labelled fields; the "related"
//   ticket number aborted via TICKET_NUM_RE). Both blind spots fixed below.
// WHY UserPromptSubmit (not Stop): the scaffold is knowable BEFORE the reply — capture at intake.
// PRIMITIVE: hook-only (Rule 7) — deterministic paste-detection; no procedural state to hold.
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const BYPASS_RE = /\[skip-adhoc-paste:\s*[^\]]+\]/i;

// A ticket number that OWNS this work → the normal quest/retrieval flow handles it, not ADHOC.
// A "related/rujuk/ref" mention of ANOTHER ticket must NOT abort (2026-08-26 slip: "related tiket
// eSOKONGAN #274318" killed the fire). Ownership = a ticket number NOT preceded by a related-marker.
const TICKET_NUM_RE = /\b(?:QA|FAT-OR|UAT-CR|FAT|UAT|eSOKONGAN|ESOKONGAN|REQUIREMENT|INTERNAL(?:\s+ISSUE)?)\s*#?\s*\d{4,}\b|#\s?\d{5,7}\b/ig;
const RELATED_RE = /(related|relate[sd]?|rujuk|ruj\.?|refs?|refer(?:ence)?|berkaitan|berkait|sama\s+dengan)\s*(dengan\s*)?(tiket|ticket)?\s*$/i;

function ownedByRedmineTicket(prompt) {
  TICKET_NUM_RE.lastIndex = 0;
  let m;
  while ((m = TICKET_NUM_RE.exec(prompt)) !== null) {
    const pre = prompt.slice(Math.max(0, m.index - 30), m.index);
    if (!RELATED_RE.test(pre)) return true; // ticket mention with NO related-marker before it → owned
  }
  return false;
}

// Labelled-fields fingerprint: one per line. Malay/English label variants.
const F_URUSAN  = /^\s*urusan\s*:/im;
const F_TUGASAN = /^\s*tugasan\s*:/im;
const F_ID      = /^\s*id\s*(?:permohonan)?\s*:\s*\S/im;
const F_USER    = /^\s*(?:user|pengguna)\s*:/im;

// Permohonan id like PTMLK/02/L/PT/2026/1 (state-office/district/L/urusan/year/n).
const PERMOHONAN_ID_RE = /\b[A-Z]{2,5}\/\d{2}\/[A-Z]\/[A-Z]+\/\d{4}\/\d+\b/i;
// Office-code the BA relay opens with (Pejabat Daerah dan Tanah — PDTJ Jasin, PDTAG Alor Gajah,
// PDTMT Melaka Tengah; tolerate other PDT* districts). Word-bounded so "PDTx" inside a path can't hit.
const OFFICE_RE = /\b(PDTJ|PDTAG|PDTMT|PDT[A-Z]{1,4})\b/;
// Issue-description signal (Malay/English) — the message is describing a problem.
const ISSUE_RE = /\b(isu|issue|mohon\s+semak|semak|papar|sepatutnya|tak\s+boleh|tidak\s+boleh|ralat|error|expected|actual|masalah|bug|salah|hilang|missing|delete[d]?)\b/i;

function fieldCount(prompt) {
  return [F_URUSAN, F_TUGASAN, F_ID, F_USER].reduce((n, re) => n + (re.test(prompt) ? 1 : 0), 0);
}
function extractUrusan(prompt) {
  const m = prompt.match(/^\s*urusan\s*:\s*([A-Za-z]+)/im);
  if (m) return m[1].toUpperCase();
  const id = prompt.match(/\b[A-Z]{2,5}\/\d{2}\/[A-Z]\/([A-Z]+)\/\d{4}\/\d+\b/i);
  if (id) return id[1].toUpperCase();
  return 'XXX';
}

runHook({ name: 'adhoc-paste-detector', event: 'UserPromptSubmit' }, (input) => {
  let data = input;
  if (typeof input === 'string') {
    try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  }
  const prompt = (data && data.prompt) || '';
  if (!prompt) return { fired: false };
  if (BYPASS_RE.test(prompt)) return { fired: false };

  // Owned by a real (non-related) Redmine/quest ticket number → that flow handles it.
  if (ownedByRedmineTicket(prompt)) return { fired: false };

  // FIRE on EITHER intake shape:
  //  (a) labelled: >=3 of 4 field labels + a permohonan-id (the original 2026-08-13 trigger), OR
  //  (b) freeform: a permohonan-id + an issue-description signal (office code alone is NOT enough —
  //      "PDTJ asked about X" with no id has nothing to scaffold; the id is the anchor).
  const labelledPath = fieldCount(prompt) >= 3 && PERMOHONAN_ID_RE.test(prompt);
  const freeformPath = PERMOHONAN_ID_RE.test(prompt) && ISSUE_RE.test(prompt);
  if (!labelledPath && !freeformPath) return { fired: false };

  const urusan = extractUrusan(prompt);
  const office = (prompt.match(OFFICE_RE) || [null, ''])[1] || '';
  const lines = [
    '🆕 adhoc-paste-detector: BA-relayed issue' + (office ? ' (from ' + office + ')' : '') + ' with a permohonan-id and NO OWNING Redmine number.',
    '   → This is an ADHOC. Create the SAME scaffold a Redmine retrieval / /quest start does —',
    '     do NOT merely answer inline (the answer is lost to chat and re-investigated later).',
    '',
    '   MANDATORY scaffold (all in this turn, before/with the diagnosis):',
    '     0. LOAD CONTEXT FIRST — read etanah-knowledge/melaka/ADHOC-TRIAGE.md and CLASSIFY each ask',
    '        (DATA-QUESTION / DATA-PATCH / DIAGNOSIS / CODE-CHECK / FLOW-RECOVERY / ...) BEFORE touching anything;',
    '        resolve aplikasi_id via umm_aplikasi.id_pengenalan = \'<permohonan>\' (DATABASE.md §4.1 recipe —',
    '        NOT umm_p_aplikasi.no_rujukan_permohonan) BEFORE any schema hunting.',
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
