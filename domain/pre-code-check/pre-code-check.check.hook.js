#!/usr/bin/env node
// pre-code-check.check.hook.js — born via core/forge.js (2026-07-14), implemented same day
// TRIGGER: Edit/Write on etanah .java/.xhtml/.docx path — require CODE-CHECK compact emit line
// ACTION: block Edit if CODE-CHECK emit line missing OR any check ✗ without justification
// v1.1 (2026-07-31, miya, QA-271985 cycle3): judgment-bearing checks (EVIDENCE_CHECKS) must carry
//   parenthetical evidence >= EVIDENCE_MIN chars — a bare ✓ is a guess. No new checks added
//   (system-rules R1/R2: refine in place). v1.0 specs preserved: missing-name block, bare-✗ block,
//   confidence-required. Smoke: the QA-271985 all-bare line blocks; evidence-bearing line passes.
// v1.3 (2026-08-03, miya, QA-272867 pemohon-2 still-crashing guard): NEW check `all-writers`
//   (required + evidence-bearing) — a null/bad-value fix must grep EVERY writer/constructor of the
//   failing symbol; guarding one of four sites shipped a fix that crashed identically. ✗(N/A — <kind>)
//   for non-value changes.
// v1.2 (2026-08-03, miya, QA-272943 pelan-shrink): (a) NEW check `necessity` (required + evidence-
//   bearing) — every added line maps to the DEFECT; anything copied from the analog but not needed
//   by the fix is scope creep (scaleToFitA4Strict copied wholesale shrank the pelan); (b) BA-expected
//   ✓ must cite an OBSERVATION (OBSERVATION_TOKEN_RX) — a prediction ("appearance unchanged") must be
//   written ✗(unverified — <risk>) so unknowns are visible BEFORE miya's build. Smoke: the 272943
//   shipping line blocks on both; honest line passes. v1.0/v1.1 specs preserved.
// v1.5 (2026-08-16, grand-audit wf_097d9bae — 13 agents, 10 angles vs 183-commit census):
//   (a) TYPE-GATED rows — docx-template (31/163 fixes = 19%) and *Constant.java populators were
//       forced through stateful-flow rows (logic-matrix/peranan-map/flowable-contract...) that have
//       nothing to bind to in a CC-tag change; that structurally invited fabricated-but-passing
//       evidence. Each change-type now gets only the rows that apply (TYPE_DROP below).
//   (b) config-json (.json) added to the trigger — a config fix shipped ungated (c38bc07a90/266039).
//   (c) sibling + sibling-diff moved INTO EVIDENCE_CHECKS — a bare ✓ passed while the exact failure
//       they exist to stop shipped (#259112: wrong-shape analog, miya caught wrong wiring).
//   COVERAGE NOTE: .sql is DELIBERATELY absent — SQL patch scripts never land in git (handed to miya
//   unqualified) and are governed by the patch-script-gate/convention-check-gate/prod-db-confirm
//   family, not this hook. `etanah-teknikal` in the path regex never fires today (module not checked
//   out locally) — kept because it costs nothing and covers a future checkout.
//   Spec preservation: all v1.0-v1.4 specs intact for plain .java/.xhtml (row set unchanged there);
//   drops are TYPE-SCOPED only. Finding 5 (intake-phase BPMN gate + prior-fix per-ticket memoization)
//   deferred → proposal slip.
// v1.7 (2026-09-22, workflow refine C1-C6, today's 17-block trace): (a) evidence capture replaced with
//   a balanced-paren scanner — `[^)]+` truncated nested-paren evidence like
//   `fallback-precedence ✓((a) … (b) … (c) …)` to `(a`, which the hook's OWN guidance (below) tells the
//   writer to produce; (b) CODE-CHECK lookup now checks `latest` (since the last user entry of any kind)
//   first, then falls back to `turn` (since the last HUMAN user entry, skipping tool_result-only user
//   entries) for a SAME-FILE-only re-use of the last passed emit — every tool_result is its own
//   role=user entry, so a multi-Edit turn had to re-emit the line before every Edit; (c) new
//   `config-source` row, TRIGGER-gated (not TYPE_DROP-gated) on config/maintenance-page language,
//   requiring `<table.column> = <value> on <env>` — kod-resolution existed but only enforced length, and
//   env-split config values (METER vs LOT) need the env named; (d) `lightEdit()` classifies import-only
//   and rename-only Edits and skips the gate deterministically instead of spending a `[skip-pre-code-
//   check:]` bypass on them; (e) the missing-emit AND malformed blocks now share one GUIDANCE body so
//   the first rejection carries everything the writer needs, not just the next one.
//   Spec preservation: v1.0-v1.6 row set / evidence-min / bare-✗ / prediction-tick specs unchanged for
//   plain .java/.xhtml; all additions are additive (new row, new light-path early-return, richer text).
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = process.env.PRE_CODE_CHECK_LOG || path.join(__dirname, 'log.jsonl');

const ETANAH_PATH = /[\\\/]etanah-(pelupusan|common|awam|teknikal)[\\\/].+\.(java|xhtml|docx|json)$/i;

// v1.6 (2026-08-20, miya, #276349 growl-not-refreshed): FOLDED into sibling-diff — NOT a new row.
//   The growl bug (onGoNext added a ralat; nextProcessBtn had update="@this" -> message created,
//   never rendered) is a per-file coupling miss sibling-diff already owns (QA-258004 lists `update`
//   as a coupling attr). A separate `msg-render` row was tried then reverted as bloat (self-audit
//   inv-1 orphan; repeats grand-audit defect #2/#3). sibling-diff guidance below now names the
//   growl-in-update coupling explicitly. Spec-preservation: no row added/removed vs v1.5.
const REQUIRED_CHECKS = [
  'analog', 'in-file', 'sibling', 'existing-reuse', 'name-by-purpose',
  'minimal-diff', 'logic-matrix', 'blast-radius', 'predicate', 'falsifier',
  'read+write-path', 'BA-expected', 'full-address', 'sibling-diff', 'necessity', 'all-writers',
  'kod-resolution', 'prior-fix', 'class-chain', 'peranan-map', 'flowable-contract',
  'fallback-precedence',
];
const CONFIDENCE_RX = /\bconfidence\s+\d+\s*%/i;

const EVIDENCE_CHECKS = ['analog', 'sibling', 'sibling-diff', 'existing-reuse', 'blast-radius', 'read+write-path', 'falsifier', 'necessity', 'all-writers', 'kod-resolution', 'prior-fix', 'class-chain', 'peranan-map', 'flowable-contract', 'fallback-precedence'];
const EVIDENCE_MIN = 12;

// v1.5 type-gating: rows that DON'T apply to a change-type are dropped from its required set.
// A dropped row may still appear in the line (ignored) — absence is no longer a block for that type.
function changeType(fp) {
  if (/\.docx$/i.test(fp)) return 'docx-template';
  if (/\.json$/i.test(fp)) return 'config-json';
  if (/Constant\.java$/i.test(fp)) return 'constant-populator';
  return 'code';
}
const TYPE_DROP = {
  'docx-template': ['logic-matrix', 'blast-radius', 'class-chain', 'all-writers', 'peranan-map', 'flowable-contract', 'read+write-path', 'fallback-precedence', 'predicate'],
  'config-json': ['logic-matrix', 'class-chain', 'all-writers', 'read+write-path', 'predicate', 'fallback-precedence', 'flowable-contract'],
  'constant-populator': ['peranan-map', 'flowable-contract'],
  'code': [],
};

// v1.2: a ✓ on BA-expected must cite an OBSERVATION (something read/queried/rendered), never a
// prediction ("appearance unchanged", "should work"). If the outcome is only observable after a
// build/render you cannot run, the honest form is ✗(unverified — <specific risk>).
const OBSERVATION_TOKEN_RX = /observed|verified|read|grep|query|queried|screenshot|photo|pdf|rendered|:\d+|SELECT/i;

// v1.7.1 (2026-09-23, reviewer findings A-E on v1.7): (A) rename-only light path REMOVED — `return a`
//   → `return b` was classified as a rename and skipped its CODE-CHECK; import-only stays. (B) blank
//   `✗()` evidence = no evidence. (C) a turn-sourced CODE-CHECK is accepted for the first Edit of a
//   file when no pass exists, the last pass is this file, or the last pass predates this turn.
//   (D) config-source trigger scoped to the turn text, the file path and only the active.txt block of
//   a ticket named in the turn; bare "maintenance" no longer triggers. (E) eval EV map gains configSource.
//   Spec preservation: v1.7 row set, evidence-min, bare-✗, prediction-tick, config-source evidence
//   shape, single-pass combined report and the import-only light path are unchanged.
// v1.7 C3: config-source — TRIGGER-gated row (not TYPE_DROP-gated). Fires when the turn text, the
// file path, or an active quest/active.txt block mentions a maintenance/config-page vocabulary.
const CONFIG_PAGE_RX = /\b(maintenance (?:page|screen|form|setup)|(?:fi|kadar|config) maintenance|penyelenggaraan|setup ?manager|FiSetup|hsl_fi_\w+|fi_pejabat|fi_kadar|unit_pengiraan|kadar_pengiraan|Kadar Pengiraan Per|config(?:uration)? (?:page|screen|table))\b/i;
const CONFIG_EVIDENCE_RX = /\b[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\s*=\s*[^;)]+?\s+on\s+(prod|stg1|stg2|mlit|int-env|stag-env|staging|training|trn|local)\b/i;
const CONFIG_DECLINE_RX = /^N\/A\s*—\s*.{8,}/i; // "N/A — <reason>" with a real reason, total >= 12 chars enforced by caller

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

// v1.7 C1: balanced-paren evidence scanner. `idx` is the string index right AFTER the matched glyph
// (✓/✗). Returns the inner text of the FIRST parenthesized group immediately following the glyph
// (optional whitespace allowed), walking nesting depth to the MATCHING close-paren — so nested
// parens inside the evidence (e.g. fallback-precedence's (a)/(b)/(c) shape) are captured whole
// instead of truncated at the first `)`. Unbalanced parens (never close) => no evidence (null),
// same as "no evidence present" today.
function evidenceAfter(line, idx) {
  let i = idx;
  while (i < line.length && /\s/.test(line[i])) i++;
  if (line[i] !== '(') return null;
  let depth = 0;
  const start = i + 1;
  for (let j = i; j < line.length; j++) {
    if (line[j] === '(') depth++;
    else if (line[j] === ')') {
      depth--;
      if (depth === 0) { const inner = line.slice(start, j); return inner.trim() ? inner : null; }
    }
  }
  return null; // unbalanced -> treat as no evidence
}

// v1.7 C2: is this a role='user' transcript entry a HUMAN message, or a tool_result-only entry
// (every Edit/Bash/etc. tool call produces one of these, role=user, with no text block)? Same idiom
// as domain/redmine-write-gate/redmine-write-gate.check.hook.js:45.
function isHumanUserEntry(m) {
  const c = m.content;
  if (typeof c === 'string') return true;
  if (Array.isArray(c)) return c.some(b => b && b.type === 'text' && b.text);
  return false;
}

// v1.7 C2: returns { latest, turn }.
//   latest = assistant text since the last user entry of ANY kind (v1.0-v1.6 behaviour, unchanged).
//   turn   = assistant text since the last HUMAN user entry, skipping user entries that are
//            tool_result-only — so a CODE-CHECK line emitted earlier in a multi-Edit turn is still
//            visible to a later Edit in the SAME turn even though each Edit's tool_result is its own
//            role=user transcript line.
function readLastAssistantTurn(tp) {
  let raw;
  try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return { latest: '', turn: '' }; }
  const L = raw.split(/\r?\n/).filter(Boolean);
  let latest = '', turn = '', turnStart = null;
  let latestOpen = true, turnOpen = true;
  for (let i = L.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    const m = o.message || o;
    const role = m.role || o.type;
    if (role === 'user') {
      latestOpen = false;
      if (isHumanUserEntry(m)) { turnOpen = false; if (turnStart === null) turnStart = o.timestamp || null; }
      if (!latestOpen && !turnOpen) break;
      continue;
    }
    if (role !== 'assistant') continue;
    const c = m.content;
    let localText = '';
    if (typeof c === 'string') localText = c;
    else if (Array.isArray(c)) {
      for (const b of c) { if (b && b.type === 'text' && b.text) localText += b.text + '\n'; }
    }
    if (latestOpen) latest = localText + latest;
    if (turnOpen) turn = localText + turn;
  }
  return { latest, turn, turnStart };
}

// v1.7 C2 / v1.7.1 (finding C): the last 'passed' row in log.jsonl as { file, ts } — decides whether a
// `turn`-sourced (not `latest`) CODE-CHECK line may be reused for this Edit.
function lastPassed() {
  let raw;
  try { raw = fs.readFileSync(LOG, 'utf8'); } catch (_) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(lines[i]); } catch (_) { continue; }
    if (o.action === 'passed') return { file: o.file, ts: o.ts || null };
  }
  return null;
}

// v1.7 C3 / v1.7.1 (finding D): does this turn/file context trigger the config-source row? Scope = the
// turn text, the file path, and ONLY the active.txt block(s) of a ticket number named in the turn —
// scanning every status=active block let an unrelated quest's "maintenance" wording force config-source
// on every etanah edit. PRE_CODE_CHECK_ACTIVE_TXT overrides the active.txt path (eval fixtures).
function configSourceTriggered(turnText, filePath) {
  if (CONFIG_PAGE_RX.test(turnText || '')) return true;
  if (CONFIG_PAGE_RX.test(filePath || '')) return true;
  const nums = [...new Set(String(turnText || '').match(/\b\d{6}\b/g) || [])];
  if (!nums.length) return false;
  try {
    const activePath = process.env.PRE_CODE_CHECK_ACTIVE_TXT || path.join(ROOT, 'quest', 'active.txt');
    const activeTxt = fs.readFileSync(activePath, 'utf8');
    const blocks = activeTxt.split(/\r?\n\s*\r?\n/);
    for (const b of blocks) {
      if (!nums.some(n => b.includes(n))) continue;
      if (CONFIG_PAGE_RX.test(b)) return true;
    }
  } catch (_) { /* missing file = no trigger */ }
  return false;
}

const CONFIG_SOURCE_GUIDANCE = [
  '     config-source    ✓(<table.column> = <value> on <env>; …, = <value2> on <env2> — cite the LIVE',
  '                       config read, not the code that consumes it) — e.g.',
  '                       "config-source ✓(hsl_fi_pejabat.unit_pengiraan_id = JNS_PER_FI_METER on prod;',
  '                       = JNS_PER_FI_LOT on stg2, mlit)"',
  '                     | ✗(N/A — <reason ≥12 chars>) — logged config-source-declined, auditable',
  '     A code-analog citation (PelupusanBayaranOnlineStrategy:173-210) is NOT config-source evidence —',
  '     config-driven fixes need the LIVE config row read, because the value itself can differ per env',
  '     (the METER-vs-LOT split only exists across environments).',
].join('\n');

// v1.7 C5: hoisted per-check evidence-shape guidance -- shared by buildGuidance() (missing-emit)
// and the malformed-line bareEvidence branch, so the FIRST rejection already carries it.
const EVIDENCE_DETAIL_LINES = [
  '   These MUST carry evidence in parentheses -- what you READ, not what you believe:',
  '     analog          ✓(<file:line> of the code you copied the shape from — NAME its operation',
  '                       SHAPE too, e.g. root-level vs array-scoped: #259112 cited a real line whose',
  '                       shape did not match and the wrong-wired fix shipped)',
  '     sibling         ✓(<working sibling file:line> actually read this session — a bare ✓ here',
  '                       is how #259112 reused a minimal-attrs formField over the fully-wired one)',
  '     sibling-diff    ✓(vs <sibling>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓ — or name the divergence.',
  '                       🚨 JSF action that adds a FacesMessage: the trigger control update= MUST include the',
  '                       growl/messages component or the message renders NOWHERE — #276349 nextProcessBtn had',
  '                       update="@this" only, no popup; working sibling tambahBtn updates msgs.)',
  '     existing-reuse  ✓(grepped <symbol> -> reused <Class.method():line>) | ✓(grepped <symbol> -> 0 existing resolvers)',
  '     blast-radius    ✓(grepped <symbol> -> N call-sites: <file:line>, ...)',
  '     read+write-path ✓(<Class.method():line> persists it) | ✓(grepped <getter> -> 0 persisters)',
  '     falsifier       ✓(the record shape that would break this + how it differs from the one you tested)',
  '     flowable-contract ✓(for ANY tugasan/BPM-submit edit: name the BpmNameValues the form SENDS',
  '                       and what CONSUMES them — quote the prepareBpmValuesFor_tgsn_<KOD>() line AND',
  '                       the reader, e.g. FlowableTaskListener.receiveUserTask():150. Compare against a',
  '                       SIBLING tugasan that works.) | ✗(N/A — edit does not touch a tugasan submit path)',
  '                       QA-273201: fixed the RENDER half, never traced the SUBMIT half —',
  '                       prepareBpmValuesFor_tgsn_KKPT():2376 omits nextUser (1 of 2 of 19), so the',
  '                       listener got null and assigned the ROLE group instead of the chosen officer.',
  '                       A rendering fix is only half a tugasan fix. BA reworked the ticket.',
  '     class-chain     ✓(for ANY super./override/inherited-field claim: quote the actual EXTENDS',
  '                       chain you READ, class:line each hop — e.g. MlkKertasTemplateForm:102 ->',
  '                       BasePelupusanDokumenForm:114 -> BasePenyediaanDokumenForm:173 -> BaseBpmForm:197)',
  '                     | ✗(N/A — edit touches no inherited member)',
  '                       QA-273201: assumed BasePelupusanDokumenForm extends BasePelupusanForm from the',
  '                       NAMES. It does not. The whitelist I patched was unreachable dead code.',
  '     peranan-map     ✓(fix touches roles / agihan / capaian / tugasan-routing? Then CITE',
  '                       etanah-knowledge/melaka/PERANAN-MAP.md:<line> — the FILE, read THIS session.',
  '                       A role code you recognise is not a role code you verified.)',
  '                     | ✗(N/A — <why this fix cannot touch roles>)',
  '                       #273201 rework-2: went straight to code 3 sessions running. PERANAN-MAP.md',
  '                       sections 4-5 already documented this exact service. Unread, PPTT reads like a',
  '                       typo for PPTNT — they are two DIFFERENT live roles (30290 vs 18503). Shipping',
  '                       the wrong one resolves to zero users and reworks the ticket a third time.',
  '                       This check exists because a check literally named hierarchy PASSED on the bad',
  '                       fix — satisfied with a Java class chain while the role chain went unread.',
  '     prior-fix       ✓(git log --grep + -S on the SYMPTOM words, not the file — quote the SHA and',
  '                       what it did, or "0 hits") — QA-273201: f33f8632d8 says verbatim "Agihan Kepada',
  '                       field not populate after user click button Selesai on Senarai Dokumen Panel",',
  '                       the same bug already solved via onRefreshComponent(); two fixes were built on',
  '                       paths the BA never uses because this search was skipped.',
  '     kod-resolution  ✓(each kod/urusan/status literal resolved via the REFERENCE TABLE row you read —',
  '                       ind_tgsn.nama / ind_ursn.nama / rjk_* — quote kod + pk, e.g.',
  '                       "Perakuan Pentadbir Tanah" -> PPTPRBB, ind_tgsn 5134409, ursn_id 45)',
  '                     | ✗(N/A — change keys on no kod/urusan/status literal)',
  '     fallback-precedence ✓(for ANY fallback / default / if-empty-then-other-source branch, state all THREE:',
  '                       (a) PRIMARY READ FIRST — cite the line that assigns the real value before the guard',
  '                       (b) GUARD ON ABSENCE — the condition tests the primary being null/blank, never the',
  '                           fallback being present, so a real value is never overwritten',
  '                       (c) DELIBERATE-EMPTY — say what happens when the USER intentionally clears the',
  '                           field. A fallback cannot tell "never filled" from "emptied on purpose", so it',
  '                           will resurrect the old value on next load. Name that, or prove the UI cannot',
  '                           produce an empty. "It only fills blanks" is NOT an answer to (c).)',
  '                     | ✗(N/A — no fallback/default branch in this diff)',
  '                       2026-08-07 #273455: ten fallback guards shipped and the deliberate-clear case was',
  '                       surfaced only because みや asked. (a) and (b) were sound; (c) was never considered.',
  '   A ✓ you cannot cite is a guess. Go run the grep/query first.',
];

// v1.7 C5: GUIDANCE is the single evidence-shape body shared by BOTH the missing-emit block (so the
// FIRST rejection carries everything the writer needs) and the malformed block.
function buildGuidance(REQUIRED, configTrig) {
  const lines = [
    'CODE-CHECK: analog ✓ · in-file ✓ · sibling ✓ · existing-reuse ✓ · name-by-purpose ✓',
    '         · minimal-diff ✓ · logic-matrix ✓ · blast-radius ✓ · predicate ✓ · falsifier ✓',
    '         · read+write-path ✓ · BA-expected ✓(observed <how>) · full-address ✓ · sibling-diff ✓',
    '         · necessity ✓(each hunk -> the defect need it serves; analog-copied extras stripped) · confidence 85%',
    '',
    'necessity = every added line maps to the DEFECT, not to the analog (2026-08-03 QA-272943:',
    'scaleToFitA4Strict copied wholesale from the analog shrank the pelan — size was the only issue).',
    'BA-expected ✓ must cite an OBSERVATION; unobservable before a build -> ✗(unverified — <risk>).',
    'all-writers = when guarding/fixing a null-or-bad VALUE, grep EVERY site that writes/constructs',
    'the failing symbol and state each is safe: all-writers ✓(grep setAlamatBerdaftar -> 4 sites, each',
    'init-safe) — guarding ONE site of a multi-writer symbol shipped a still-crashing fix (2026-08-03',
    'QA-272867 pemohon-2). Not a value fix -> ✗(N/A — <what kind of change this is>).',
    '',
    '🚨 value-domain (parse/conversion guards — new BigDecimal / parseInt / valueOf / Date.parse):',
    'the falsifier MUST enumerate EVERY malformed-input CLASS the conversion rejects — null · empty/',
    'blank · grouping-separator (","/".") · non-numeric — and the guard must cover the CLASS, not the',
    'one observed value. #277439 (Perak): fixed the observed PROD value "10,000.00" (comma) ONLY;',
    'new BigDecimal("") still NFE (empty-string case, flagged by Dev). Complete guard = isNotBlank +',
    'strip-separator at ALL parse sites.',
    '',
    'nested parens inside evidence are fine — the scanner walks to the MATCHING close-paren, e.g.',
    'fallback-precedence ✓((a) primary read … (b) guard-on-absence … (c) deliberate-clear …) is one',
    'evidence block, not truncated at the first `)`.',
    'one CODE-CHECK per turn covers further Edits of the SAME file — no need to re-emit the line before',
    'every Edit in a multi-hunk turn, as long as the file path matches.',
    'import-only Edits pass without a CODE-CHECK line (lightEdit auto-classifies them).',
  ];
  if (configTrig) {
    lines.push('', 'config-source (TRIGGERED — this turn/file mentions a config/maintenance-page):');
    lines.push(CONFIG_SOURCE_GUIDANCE);
  }
  lines.push('', 'Evidence shape for judgment-bearing checks (kod-resolution, sibling, fallback-precedence, ...):');
  lines.push(EVIDENCE_DETAIL_LINES.join('\n'));
  lines.push('', 'Any ✗ needs a parenthetical reason: analog ✗(novel defensive helper).');
  lines.push('Genuinely trivial edit (rename-only / typo) → [skip-pre-code-check: <reason>].');
  return lines.join('\n');
}

// v1.7 C4: classify a trivial Edit so it can skip the gate deterministically instead of spending a
// free-text bypass on it. Edit only — Write (whole-file replace) never qualifies.
const IMPORT_LINE_RX = /^\s*(import|package)\s+[\w.*]+;\s*$/;
function isAllImportLines(str) {
  const lines = String(str || '').split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return false;
  return lines.every(l => IMPORT_LINE_RX.test(l));
}
// v1.8 (2026-09-23, QA-280540): duplicate-literal probe — a TRUTH check, not a shape check. A kod-shaped
// string literal the Edit ADDS (absent from old_string) that already exists as a literal in ANOTHER file
// of the same module's src/main/java means the value already has a home. #280540 re-declared
// "JNS_PER_FI_METER"/"_HKTR"/"_EKAR" in a new map while PelupusanCommonConstant.UNIT_CONVERSION_MAP:34
// already mapped them and the same helper used it 3x; every CODE-CHECK row passed. Fail-open (no git,
// no repo, timeout → no hits).
const KOD_LITERAL_RX = /"([A-Z][A-Z0-9]*_[A-Z0-9_]{2,})"/g;
function duplicateLiterals(filePath, toolInput) {
  const added = String(toolInput.new_string != null ? toolInput.new_string : (toolInput.content || ''));
  const removed = String(toolInput.old_string || '');
  const lits = [...new Set([...added.matchAll(KOD_LITERAL_RX)].map(m => m[1]))]
    .filter(l => !removed.includes('"' + l + '"')).slice(0, 12);
  if (!lits.length) return [];
  const mm = filePath.replace(/\\/g, '/').match(/^(.*?)\/src\/main\//);
  if (!mm) return [];
  const repo = mm[1];
  const target = path.resolve(filePath).toLowerCase();
  const hits = [];
  for (const lit of lits) {
    let r;
    try { r = spawnSync('git', ['grep', '-n', '-F', '"' + lit + '"', '--', 'src/main/java'], { cwd: repo, encoding: 'utf8', timeout: 8000 }); } catch (_) { continue; }
    if (!r || r.status !== 0 || !r.stdout) continue;
    for (const l of r.stdout.split(/\r?\n/).filter(Boolean)) {
      const f = l.split(':')[0];
      if (path.resolve(repo, f).toLowerCase() === target) continue;
      hits.push({ lit, where: l.split(':').slice(0, 2).join(':'), cls: path.basename(f, '.java') });
      break;
    }
  }
  return hits;
}

// v1.7.1 (finding A): import-only is the ONLY light path — the v1.7 rename-only classifier treated
// `return a` → `return b` as a rename and skipped the CODE-CHECK; a genuine rename uses the bypass token.
function lightEdit(toolInput) {
  const oldStr = toolInput.old_string, newStr = toolInput.new_string;
  if (typeof oldStr !== 'string' || typeof newStr !== 'string') return null;
  if (isAllImportLines(oldStr) && isAllImportLines(newStr)) return 'import-only';
  return null;
}

runHook({ name: 'pre-code-check', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }

  const toolInput = data.tool_input || {};
  const toolName = data.tool_name || '';
  const filePath = String(toolInput.file_path || '');
  if (!ETANAH_PATH.test(filePath)) return { fired: false };

  // v1.7 C4: light path — Edit only, Write never qualifies (whole-file replace can't be trivially
  // classified this way).
  if (toolName === 'Edit') {
    const light = lightEdit(toolInput);
    if (light) { log({ action: 'light-pass', kind: light, file: filePath }); return { fired: false }; }
  }

  const { latest, turn, turnStart } = readLastAssistantTurn(data.transcript_path || '');

  // v1.7 C2 Rule 12: bypass token keeps matching `latest` only — a bypass written in an older segment
  // (before the last human message) must not carry forward.
  const bypassMatch = (latest || '').match(/\[skip-pre-code-check:\s*([^\]]+)\]/);
  if (bypassMatch) { log({ action: 'bypass', reason: bypassMatch[1], file: filePath }); return { fired: false }; }

  if (!latest && !turn) { log({ action: 'no-transcript', file: filePath }); return { fired: false }; }

  const type = changeType(filePath);
  const REQUIRED = REQUIRED_CHECKS.filter(n => !TYPE_DROP[type].includes(n));
  const configTrig = configSourceTriggered(turn, filePath);
  if (configTrig) REQUIRED.push('config-source');

  // v1.7 C2 / v1.7.1 (finding C): `latest` first; else a `turn`-sourced line is accepted when (i) no
  // passed row exists at all, (ii) the last passed row is this SAME file (once-per-turn reuse), or
  // (iii) the last passed row predates this turn (an earlier turn's pass never consumes this turn's
  // line). A pass THIS turn for a different file still denies — that line was that file's.
  let codeCheckMatch = latest.match(/CODE-CHECK:\s*([^\n]+)/i);
  let sameFileDenied = false;
  if (!codeCheckMatch) {
    const turnMatch = turn.match(/CODE-CHECK:\s*([^\n]+)/i);
    if (turnMatch) {
      const lp = lastPassed();
      const fresh = !lp || lp.file === filePath || Boolean(turnStart && lp.ts && lp.ts < turnStart);
      if (fresh) codeCheckMatch = turnMatch; else sameFileDenied = true;
    }
  }

  if (!codeCheckMatch) {
    log({ action: 'blocked-missing-emit', file: filePath, type, reason: sameFileDenied ? 'different-file-since-pass' : 'no-emit' });
    const block = [
      '⛔ pre-code-check: etanah code Edit blocked — no CODE-CHECK emit line in this turn.',
      '   File: ' + filePath + '  (change-type: ' + type + ' → ' + REQUIRED.length + ' rows apply)',
      '   Emit ONE compact line before the Edit, the ' + REQUIRED.length + ' applicable checks with ✓ or ✗(reason):',
      '',
      '     ' + buildGuidance(REQUIRED, configTrig),
    ];
    if (sameFileDenied) block.push('', '   a different file was edited since the last CODE-CHECK — emit one for ' + filePath);
    return { fired: true, blocked: true, blockReason: block.join('\n') };
  }

  const line = codeCheckMatch[1];
  const missing = [];
  const bareCross = [];
  const bareEvidence = [];
  const predictionTick = [];
  let configDeclined = false;
  for (const name of REQUIRED) {
    const escaped = name.replace(/[.+*?^$()[\]{}|\\]/g, '\\$&');
    const rx = new RegExp(escaped + '\\s*([✓✗])', 'i');
    const m = line.match(rx);
    if (!m) { missing.push(name); continue; }
    const glyphIdx = m.index + m[0].length;
    const m1 = m[1];
    const m3 = evidenceAfter(line, glyphIdx);

    if (name === 'config-source') {
      if (m1 === '✓') {
        if (m3 === null || !CONFIG_EVIDENCE_RX.test(m3)) bareEvidence.push(name);
      } else {
        const trimmed = (m3 || '').trim();
        if (m3 === null || !CONFIG_DECLINE_RX.test(trimmed) || trimmed.length < 12) bareCross.push(name);
        else configDeclined = true;
      }
      continue;
    }

    if (m1 === '✗' && m3 === null) bareCross.push(name);
    if (EVIDENCE_CHECKS.includes(name) && (m3 === null || m3.trim().length < EVIDENCE_MIN)) bareEvidence.push(name);
    if (name === 'BA-expected' && m1 === '✓' && (m3 === null || !OBSERVATION_TOKEN_RX.test(m3))) predictionTick.push(name);
  }
  if (!CONFIDENCE_RX.test(line)) missing.push('confidence <N>%');

  if (missing.length > 0 || bareCross.length > 0 || bareEvidence.length > 0 || predictionTick.length > 0) {
    log({ action: 'blocked-malformed', file: filePath, type, missing, bareCross, bareEvidence, predictionTick, defects: missing.length + bareCross.length + bareEvidence.length + predictionTick.length });
    const reasons = [];
    if (missing.length > 0) reasons.push('   Missing check names: ' + missing.join(', '));
    if (bareCross.length > 0) reasons.push('   ✗ without justification: ' + bareCross.join(', ') + ' — add "(reason)" after each ✗');
    if (predictionTick.length > 0) {
      reasons.push(
        '   BA-expected carries a ✓ with NO observation cited — a prediction wearing a tick (2026-08-03 QA-272943:',
        '   "✓(appearance unchanged)" shipped a shrunken pelan). Cite what you OBSERVED (file:line / query / rendered',
        '   artifact), or write the honest form: BA-expected ✗(unverified — <specific visual/runtime risk>).',
      );
    }
    if (bareEvidence.includes('config-source')) {
      reasons.push('   config-source (TRIGGERED) needs a live config read, not a bare glyph:', CONFIG_SOURCE_GUIDANCE);
    }
    const otherBareEvidence = bareEvidence.filter(n => n !== 'config-source');
    if (otherBareEvidence.length > 0) {
      reasons.push(
        '   Bare glyph on judgment-bearing check(s): ' + otherBareEvidence.join(', '),
        ...EVIDENCE_DETAIL_LINES,
      );
    }
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ pre-code-check: CODE-CHECK line present but malformed.',
        '   ' + (missing.length + bareCross.length + bareEvidence.length + predictionTick.length) + ' defect(s) — all listed below, fix all in ONE re-emit',
        '   File: ' + filePath,
        ...reasons,
        '   Full expected list (' + type + '): ' + REQUIRED.join(' · '),
      ].join('\n'),
    };
  }

  if (configDeclined) log({ action: 'config-source-declined', file: filePath });

  const dupes = /\.java$/i.test(filePath) ? duplicateLiterals(filePath, toolInput).filter(h => !line.includes(h.cls)) : [];
  if (dupes.length) {
    log({ action: 'blocked-duplicate-literal', file: filePath, dupes });
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ pre-code-check: this Edit adds code literal(s) that ALREADY have a home in the module:',
        ...dupes.map(h => '     "' + h.lit + '"  →  ' + h.where),
        '   Reuse that constant/map (read it first — it may already do the whole job), or, if a new',
        '   definition is genuinely right, name the existing file in existing-reuse evidence, e.g.',
        '   existing-reuse ✓(' + dupes[0].cls + ' read — <why it cannot be reused>).',
      ].join('\n'),
    };
  }
  log({ action: 'passed', file: filePath, line: line.slice(0, 200) });
  return { fired: false };
});
