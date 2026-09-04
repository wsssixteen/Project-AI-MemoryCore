#!/usr/bin/env node
// etanah-intake-gate.check.hook.js — born via core/forge.js (2026-08-21)
// TRIGGER: Free-text etanah work signal (hakmilik ID / etanah table / mutation-verb + env / error signal) with NO Redmine ticket number and NO labelled-field adhoc paste
// ACTION: Classify into lane DATA-PATCH | ADHOC-CANDIDATE | LOOKUP and inject the lane's compact pre-flight: routed etanah-knowledge file(s), key-path-evidence rule, input-IDs-verbatim rule, cross-verify rule
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// REPLAY (2026-08-21, hakmilik-luas): "boleh tolong patch luas hakmilik to 6 hektar @ stg & it"
// + 3 bare hakmilik IDs matched NO gate — ticket-gate needs a QA number, adhoc-paste-detector
// needs labelled fields, knowledge-first-gate needs a source-file Read. The prompt sailed through
// with zero injected discipline: a wrong banked 1:1 linkage was trusted, the wrong rows were
// patched twice, and one input ID was silently substituted. The real path (ind_versi_dhd
// flag_aktif='Y' -> mklmt_hkmlk_id) was one pg_constraint read away.
//
// OWNERSHIP BOUNDARIES (stay SILENT — the sibling owns the surface):
//   ticket number present                                     -> ticket-gate + adhoc-register
//   labelled-field paste (>=3 of Urusan:/Tugasan:/Id:/User:)  -> adhoc-paste-detector
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const BYPASS_RE = /\[skip-etanah-intake:\s*[^\]]+\]/i;
// Keep in sync with adhoc-paste-detector TICKET_NUM_RE (same silence surface).
const TICKET_NUM_RE = /\b(?:QA|FAT-OR|UAT-CR|FAT|UAT|eSOKONGAN|ESOKONGAN|REQUIREMENT|INTERNAL(?:\s+ISSUE)?)\s*#?\s*\d{4,}\b|#\s?\d{5,7}\b/i;
const LABELLED_FIELDS = [/^\s*urusan\s*:/im, /^\s*tugasan\s*:/im, /^\s*id\s*(?:permohonan)?\s*:\s*\S/im, /^\s*(?:user|pengguna)\s*:/im];

// ── etanah signals ──────────────────────────────────────────────────────────
// id_hkmlk shape: digits + kod_hakmilik letters + running number, e.g. 040140PM00000100 / 040327HSM00001293.
const HAKMILIK_ID_RE = /\b\d{4,7}(?:GM|GMM|GRN|PM|PMM|PN|HSM|HSD|HMM|IR|PSD)\d{4,}\b/i;
const PERMOHONAN_ID_RE = /\b[A-Z]{2,5}\/\d{2}\/[A-Z]\/[A-Z]+\/\d{4}\/\d+\b/i;
const ETANAH_TABLE_RE = /\b(?:ind|umm|rjk|kod|skg|dft|pks|pcp|act)_[a-z_]{2,}\b|\bfatmk\b/i;
// Safe single-word domain vocabulary (won't appear in ordinary English/system prompts).
const DOMAIN_WORD_RE = /\b(?:hakmilik|hkmlk|permohonan|tugasan|urusan|pelupusan|etanah|carian\s+rasmi|no\s+resit|kadar\s+cukai|luas)\b/i;
const MUTATION_RE = /\b(?:patch|update|tukar(?:kan)?|betulkan|set(?:kan)?|insert|delete|reset|fix)\b/i;
// "it" is only an env when addressed as a place: "@ it", "& it", "di it", "ke it", "it env".
const ENV_RE = /\b(?:stg\d?|staging|mlit|int-env|internal|prod|production)\b|(?:[@&]|\bdi\b|\bke\b)\s*it\b|\bit\s+env\b/i;
const ERROR_RE = /\b(?:NPE|NullPointer\w*|exception|stack\s?trace|error|ralat|gagal|fail(?:ed|s)?)\b|\b(?:tak|tidak|x)\s+(?:boleh|papar|keluar|jana|muncul)\b/i;

// ── knowledge routing: topic regex -> files to Read (up to 3 injected) ──────
// STATE-SCOPE: melaka literal (see README). A second state parameterizes KNOWLEDGE_DIR.
const KNOWLEDGE_DIR = 'projects/coding-projects/active/etanah-knowledge/melaka';
const ROUTES = [
  { re: /hakmilik|hkmlk|fatmk|luas|geran|strata|kadar\s+cukai/i, files: [KNOWLEDGE_DIR + '/DATABASE.md', '.claude/auto-memory/reference_hakmilik_change_map.md'] },
  { re: /flowable|bpmn|aliran|langkah|alterflow|act_/i, files: [KNOWLEDGE_DIR + '/FLOWABLE-KNOWLEDGE.md'] },
  { re: /tugasan|routing|nextuser/i, files: [KNOWLEDGE_DIR + '/FLOWABLE-WORKFLOWS.md'] },
  { re: /peranan|agih|capaian/i, files: [KNOWLEDGE_DIR + '/PERANAN-MAP.md'] },
  { re: /resit|test\s+data|login|pengguna\s+semasa/i, files: [KNOWLEDGE_DIR + '/TEST-PERMOHONAN-INDEX.md'] },
  { re: /xhtml|papar|dropdown|butang|skrin|screen|field/i, files: [KNOWLEDGE_DIR + '/JSF-WIRING.md', KNOWLEDGE_DIR + '/FRONTEND-PATTERNS.md'] },
  { re: /template|docx|surat|borang/i, files: [KNOWLEDGE_DIR + '/WORD-TEMPLATE-RENDERING.md'] },
  { re: /jasper|jrxml|report/i, files: [KNOWLEDGE_DIR + '/JASPER-REPORTS.md'] },
  { re: /deploy|branch|env(?:ironment)?s?\b/i, files: [KNOWLEDGE_DIR + '/ENV-ARCHITECTURE.md', KNOWLEDGE_DIR + '/BRANCH-AND-DEPLOY.md'] },
  { re: /\burusan\b|flow\b/i, files: [KNOWLEDGE_DIR + '/URUSAN-FLOW.md'] },
];

function routeKnowledge(prompt) {
  const files = [];
  for (const r of ROUTES) {
    if (files.length >= 3) break;
    if (r.re.test(prompt)) for (const f of r.files) if (!files.includes(f) && files.length < 3) files.push(f);
  }
  if (!files.length) files.push(KNOWLEDGE_DIR + "/index.md — maps every file's SCOPE; route from there");
  return files;
}

runHook({ name: 'etanah-intake-gate', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }
  const prompt = String((data && data.prompt) || '');
  if (!prompt) return { fired: false };
  if (BYPASS_RE.test(prompt)) return { fired: false };

  // Sibling-owned surfaces -> silent.
  if (TICKET_NUM_RE.test(prompt)) return { fired: false };
  if (LABELLED_FIELDS.reduce((n, re) => n + (re.test(prompt) ? 1 : 0), 0) >= 3) return { fired: false };

  const hasId = HAKMILIK_ID_RE.test(prompt) || PERMOHONAN_ID_RE.test(prompt);
  const etanahContext = hasId || ETANAH_TABLE_RE.test(prompt) || DOMAIN_WORD_RE.test(prompt);
  if (!etanahContext) return { fired: false };

  const knowledge = routeKnowledge(prompt).map(f => '      - ' + f).join('\n');
  let lane, lines;

  if (MUTATION_RE.test(prompt) && (hasId || ETANAH_TABLE_RE.test(prompt) || ENV_RE.test(prompt))) {
    lane = 'DATA-PATCH';
    lines = [
      '🗄 etanah-intake: DATA-PATCH lane (no ticket #) — pre-flight BEFORE any query or script:',
      '   1. KNOWLEDGE-FIRST — Read NOW:',
      knowledge,
      '   2. KEY-PATH EVIDENCE — prove every WHERE-key linkage THIS session via pg_constraint / entity',
      '      annotations / a knowledge file that cites them. Memory one-liners + MEMORY.md index lines are',
      '      HINTS, not proof (2026-08-21: banked "1:1" linkage was wrong; real path = ind_versi_dhd',
      "      flag_aktif='Y' -> mklmt_hkmlk_id).",
      '   3. IDs VERBATIM — exact-match every input ID first. 0 rows -> STOP: report the mismatch + nearest',
      '      candidates, ASK. Silent substitution/truncation of an input ID is BANNED.',
      '   4. CROSS-VERIFY — confirm the target rows against a SECOND source before writing the script',
      '      (application ind_* side vs registry fatmk.* side; values should corroborate).',
      '   5. script-check skill (all rules) before handing any mutation.',
      '   6. ALL named envs — STG = TWO schemas (et_main_stg1 + et_main_stg2); echo current_schema() per',
      '      connection; "it" = mlit (et_main_mlit).',
      '   Scaffold test: >1 exchange or real investigation expected -> treat as ADHOC (scaffold per ADHOC-REGISTER).',
    ];
  } else if (ERROR_RE.test(prompt)) {
    lane = 'ADHOC-CANDIDATE';
    lines = [
      '🆕 etanah-intake: ADHOC-CANDIDATE lane (error signal, no ticket #):',
      '   Deterministic test — needs a repro OR code-trace OR multi-table forensics -> ADHOC: scaffold the',
      '   Task folder + active.txt block + ADHOC-REGISTER row (same procedure as adhoc-paste-detector).',
      '   Single-lookup answer -> answer inline, then write the fact back to the knowledge file.',
      '   KNOWLEDGE-FIRST — Read NOW:',
      knowledge,
    ];
  } else {
    lane = 'LOOKUP';
    lines = [
      '📖 etanah-intake: LOOKUP lane — KNOWLEDGE-FIRST before grep/codegraph/SQL. Read NOW:',
      knowledge,
      '   After answering, write any new reusable fact back to the knowledge file (next lookup is cheap).',
    ];
  }

  return { fired: true, blocked: false, lane, contextOut: lines.join('\n') + '\n' };
});
