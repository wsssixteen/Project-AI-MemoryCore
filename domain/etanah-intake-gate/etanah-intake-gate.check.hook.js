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
// HOTFIX: a PROD break after a release. Fires BEFORE the ticket-number silence — the #281392 prompt
// named the CLOSED #280176, so ticket-gate took it as that ticket and no hotfix workflow started.
const HOTFIX_RE = /\bhot\s?-?fix\b|\breleased?\s+(?:yesterday|semalam|last\s+night|this\s+morning|tadi)\b|\bdah\s+release\b|\bafter\s+(?:the\s+)?release\b|\b(?:closed|released)\s+(?:ticket|tiket)\b|\b(?:ticket|tiket)\s+(?:is\s+|dah\s+|sudah\s+)?(?:closed|ditutup|tutup)\b/i;

// ── knowledge routing: topic regex -> files to Read (up to 3 injected) ──────
// STATE-SCOPE: melaka literal = the DEFAULT (see README). Other states render from lib/states.js — see resolveState below.
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

// ── state resolution (2026-10-03, Terengganu went active) ───────────────────
// STATE-SCOPE: the melaka literal above is this hook's DEFAULT. A prompt that names no state, or names the
// state owning KNOWLEDGE_DIR, renders today's text byte for byte. Any other registered state renders every
// lane path from its lib/states.js record (knowledge_dir · trunk + ticket branch · db primary_env/schema/MCP).
// Two states named with no single permohonan prefix -> default text + a "state UNKNOWN" line, never a silent pick.
const fs = require('fs');
let STATES = null; try { STATES = require(path.join(ROOT, 'lib', 'states.js')); } catch (_) { STATES = null; }
const isDefault = (rec) => KNOWLEDGE_DIR.endsWith('/' + rec.knowledge_dir);

function resolveState(prompt) {
  if (!STATES) return { rec: null };
  try {
    const all = Object.values(STATES.all());
    const r = STATES.resolve({ text: prompt });
    if (r.state && !/^permohonan-ID prefix/.test(r.src)) return { rec: r.record, src: r.src };
    const byId = new Set();
    for (const m of prompt.matchAll(/\bPT([A-Z]{2,4})\//g)) { const s = STATES.get('PT' + m[1]); if (s) byId.add(s.key); }
    // Aliases/labels as whole words; short codes (TRG, KL, WP) only in the spelling the registry lists.
    const byName = new Set();
    for (const s of all) for (const a of [s.label].concat(s.aliases || [])) {
      if (!a) continue;
      const esc = String(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp('\\b' + esc + '\\b', a.length >= 4 ? 'i' : '').test(prompt)) byName.add(s.key);
    }
    const label = (k) => STATES.get(k).label;
    if (byId.size === 1) {
      const k = [...byId][0];
      return { rec: STATES.get(k), src: 'permohonan-ID prefix ' + STATES.get(k).permohonan_prefix, also: [...byName].filter(x => x !== k).map(label) };
    }
    if (byId.size > 1) return { rec: null, unknown: [...byId].map(label) };
    if (byName.size === 1) return { rec: STATES.get([...byName][0]), src: 'state named in the prompt' };
    if (byName.size > 1) return { rec: null, unknown: [...byName].map(label) };
  } catch (_) { /* registry unreadable -> today's default */ }
  return { rec: null };
}

// A lane file the resolved state does not have on disk -> that state's index.md + STATE-FACTS.md stand in.
function stateFiles(st, list) {
  const out = [];
  for (const f of list) {
    if (!f.startsWith(KNOWLEDGE_DIR + '/')) continue; // a banked memory of the default state is not evidence for another
    const name = f.slice(KNOWLEDGE_DIR.length + 1);
    let ok = false; try { ok = fs.existsSync(path.join(STATES.knowledgeDir(st.rec.key), name)); } catch (_) { ok = false; }
    if (ok) out.push(st.kdir + '/' + name);
    else { if (!st.missing.includes(name)) st.missing.push(name); out.push(st.kdir + '/index.md', st.kdir + '/STATE-FACTS.md'); }
  }
  return out;
}

function stateDbLines(rec) {
  const db = rec.db || {}, m = db.mcp || {}, sc = db.schemas || {};
  const envs = Object.keys(m);
  if (!envs.length) return [
    '   6. ALL named envs — state UNKNOWN envs: system/states.json holds no DB MCP for ' + rec.label + '. Read its',
    '      STATE-FACTS.md + ENV-ARCHITECTURE.md and ASK before any query.',
  ];
  const one = (e) => e + (sc[e] ? ' = ' + sc[e] : '') + ' via ' + m[e];
  const p = db.primary_env && m[db.primary_env] ? db.primary_env : null;
  const rest = envs.filter(e => e !== p).map(one);
  return [
    '   6. ALL named envs — ' + rec.label + ' (' + (db.engine || 'engine UNKNOWN') + '): ' + (p ? 'primary ' + one(p) : 'primary env UNKNOWN') + (rest.length ? '; also ' + rest.join(' · ') : '') + '.',
    '      Confirm the connected schema per connection; the MCP server name is the env discriminator, never the schema name.',
  ];
}

function stateBranchLines(rec) {
  const trunks = [...new Set(Object.values(rec.modules || {}).map(x => x.trunk).filter(Boolean))];
  const base = rec.trunk_ref || (trunks.length === 1 ? 'trunk ' + trunks[0] : "that repo's trunk (node lib/states.js show " + rec.key + ')');
  return [
    '   2. Branch off fresh ' + base + ' (work clone' + (rec.work_clone_root ? ' ' + rec.work_clone_root : '') + '). Ticket branch shape ' + (rec.ticket_branch ? '`' + rec.ticket_branch + '`' : 'UNKNOWN') + '; a hotfix',
    '      family is NOT in the registry for ' + rec.label + " — check that repo's recent branches first. Never the closed ticket branch.",
  ];
}

function routeKnowledge(prompt, st) {
  const files = [];
  for (const r of ROUTES) {
    if (files.length >= 3) break;
    if (r.re.test(prompt)) for (const f of (st ? stateFiles(st, r.files) : r.files)) if (!files.includes(f) && files.length < 3) files.push(f);
  }
  if (!files.length) files.push((st ? st.kdir : KNOWLEDGE_DIR) + "/index.md — maps every file's SCOPE; route from there");
  return files;
}

runHook({ name: 'etanah-intake-gate', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }
  const prompt = String((data && data.prompt) || '');
  if (!prompt) return { fired: false };
  if (BYPASS_RE.test(prompt)) return { fired: false };

  // HOTFIX lane — owns the prompt even when a ticket # is present (that # is usually the CLOSED one).
  const hasTicket = TICKET_NUM_RE.test(prompt);
  // st = a resolved NON-default state (null -> today's text). tail = state notes appended to any lane.
  const rs = resolveState(prompt);
  const st = rs.rec && rs.rec.knowledge_dir && !isDefault(rs.rec) ? { rec: rs.rec, kdir: path.posix.dirname(KNOWLEDGE_DIR) + '/' + rs.rec.knowledge_dir, missing: [] } : null;
  const head = st ? '   STATE — ' + st.rec.label + ' (' + st.rec.code + '), from ' + rs.src + '. Every path below is ' + st.rec.label + "'s; another state's files are not evidence for it." : null;
  const tail = [];
  if (rs.unknown) tail.push('   ⚠ state UNKNOWN — the prompt names ' + rs.unknown.join(' + ') + '. Paths above are this hook\'s default state; ASK miya which state before reading or querying.');
  if (rs.also && rs.also.length) tail.push('   ⚠ the prompt also names ' + rs.also.join(' + ') + ' — paths above follow the permohonan id (' + rs.rec.label + '). ASK if the work is for the other state.');
  const missingNote = () => (st && st.missing.length ? '\n      (no ' + st.missing.join(' / ') + ' for ' + st.rec.label + ' yet — its index.md + STATE-FACTS.md stand in)' : '');
  const hasPermohonanId = PERMOHONAN_ID_RE.test(prompt) || !!(st && prompt.match(STATES.permohonanRegex()));

  if (HOTFIX_RE.test(prompt) && (hasTicket || ENV_RE.test(prompt) || ERROR_RE.test(prompt) || DOMAIN_WORD_RE.test(prompt) || hasPermohonanId)) {
    const hot = [
      '🔥 etanah-intake: HOTFIX lane — invoke the `hotfix` skill NOW (Skill tool), then follow it in order:',
      '   0. SCAFFOLD FIRST — own ticket # given → `node quest/redmine-sync.js <num>`; none yet → ADHOC scaffold.',
      '      A # in the prompt that is CLOSED/released is a REFERENCE, never the work ticket.',
      '   1. PROD vs STAG diff — one SELECT per claim, shown with the claim.',
      '   2. Branch `mlk/hotfix/<own #>` off fresh origin/mlk/master (work clone). Never the closed ticket branch.',
      '   3. Test on a PROD-shaped staging mirror + reset script; walk the WHOLE page and every tugasan sharing it.',
      '   KNOWLEDGE — Read: ' + KNOWLEDGE_DIR + '/BRANCH-AND-DEPLOY.md §8',
    ];
    if (st) {
      hot.splice(4, 1, ...stateBranchLines(st.rec));
      hot[hot.length - 1] = '   KNOWLEDGE — Read: ' + [...new Set(stateFiles(st, [KNOWLEDGE_DIR + '/BRANCH-AND-DEPLOY.md']))].join(' + ') + missingNote();
      hot.splice(1, 0, head);
    }
    return { fired: true, blocked: false, lane: 'HOTFIX', contextOut: hot.concat(tail).join('\n') + '\n' };
  }

  // Sibling-owned surfaces -> silent.
  if (hasTicket) return { fired: false };
  if (LABELLED_FIELDS.reduce((n, re) => n + (re.test(prompt) ? 1 : 0), 0) >= 3) return { fired: false };

  const hasId = HAKMILIK_ID_RE.test(prompt) || hasPermohonanId;
  const etanahContext = hasId || ETANAH_TABLE_RE.test(prompt) || DOMAIN_WORD_RE.test(prompt);
  if (!etanahContext) return { fired: false };

  const knowledge = routeKnowledge(prompt, st).map(f => '      - ' + f).join('\n') + missingNote();
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

  if (st) {
    const i = lines.findIndex(l => l.startsWith('   6. ALL named envs'));
    if (i >= 0) lines.splice(i, 2, ...stateDbLines(st.rec));
    lines.splice(1, 0, head);
  }

  return { fired: true, blocked: false, lane, contextOut: lines.concat(tail).join('\n') + '\n' };
});
