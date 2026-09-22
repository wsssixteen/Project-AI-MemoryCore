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
// v1.7 (2026-09-22, miya, QA-280540 PPTPB unit_pengiraan over-copy): `necessity` now demands a CENSUS
//   when the diff ADDS a branch chain keyed on enum/reference values. The fee fix copied six
//   `unit_pengiraan` branches wholesale from the AWAM analog (PelupusanBayaranOnlineStrategy.java:173-210);
//   a 4/4-env census showed the field only ever holds Meter Persegi or Lot — Plot/Hakmilik/Permohonan/
//   Urusan covered 0 rows. The line said `necessity ✓(no analog-copied extras)` and PASSED: model-
//   attested, nothing counted. Mechanical form (scope-claim-census pattern — the AUTHOR counts, the hook
//   only checks the citation exists; no DB call here): when tool_input adds >= ENUM_BRANCH_MIN keys via
//   `"X".equals(` / `CONST_X.equals(` / `case X:`, the necessity parenthetical must (a) carry a count with
//   a denominator (N/M · N of M · count(*) · SELECT..FROM · 0 rows · grepped..N — the bare word "census"
//   is NOT evidence here), (b) NAME every added key, (c) not KEEP a key it cites at 0 coverage without a
//   because/justified/spec/BA/ticket/required reason. Keys already in old_string are context, not adds.
//   Explicit waiver form: `census N/A — <reason>` inside the necessity cell (visible at miya's review).
//   Spec preservation: no row added/removed (system-rules R1/R2 refine-in-place, same as v1.6); fires only
//   when the diff itself adds the chain — every prior fixture carries no new_string and is untouched.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');

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

// v1.7: enum/reference-keyed branch heads. Each regex captures the KEY (string literal or UPPER_SNAKE constant).
const BRANCH_KEY_RXS = [
  /"([^"\n]+)"\s*\.\s*equals(?:IgnoreCase)?\s*\(/g,                                            // "Lot".equals(unit)
  /\.\s*equals(?:IgnoreCase)?\s*\(\s*"([^"\n]+)"\s*\)/g,                                        // unit.equals("Lot")
  /\b(?:[A-Za-z_]\w*\.)*([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\s*\.\s*equals(?:IgnoreCase)?\s*\(/g,   // URS_PT.equals(kod)
  /\.\s*equals(?:IgnoreCase)?\s*\(\s*(?:[A-Za-z_]\w*\.)*([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\s*\)/g, // kod.equals(URS_PT)
  /\bcase\s+(?:"([^"\n]+)"|([A-Z][A-Z0-9_]*))\s*(?::|->)/g,                                    // case "Lot": · case LOT ->
];
const ENUM_BRANCH_MIN = 2; // a CHAIN — one equals-guard is ordinary control flow
// Denominator-bearing count (scope-claim-census EVIDENCE minus the bare word "census").
const CENSUS_COUNT_RX = /\b\d+\s*(?:of|\/)\s*\d+\b|\bcount\(\*\)|\bSELECT\b[\s\S]{0,400}\bFROM\b|\b0\s+(?:rows|matches|hits)\b|\bgrepp?ed\b[^\n]{0,80}\d+/i;
const CENSUS_WAIVER_RX = /\bcensus\s+N\/A\s*[—-]\s*\S.{11,}/i;
const FIRST_COUNT_RX = /\b(\d+)\s*(?:of|\/)\s*\d+\b|\b(\d+)\s+rows\b/i; // the key's OWN count = first count after its name
const ZERO_JUSTIFIED_RX = /\bbecause\b|\bjustif|\bspec\b|\bBA\b|\bticket\b|\brequired\b/i;

function branchKeys(code) {
  const keys = new Set();
  for (const rx of BRANCH_KEY_RXS) for (const m of String(code || '').matchAll(rx)) keys.add((m[1] || m[2] || '').trim());
  keys.delete('');
  return keys;
}
// URS_PT -> [URS_PT, PT] · UNIT_METER_PERSEGI -> [UNIT_METER_PERSEGI, METER PERSEGI, PERSEGI] · "Meter Persegi" -> itself
function keyAliases(key) {
  const out = [key];
  if (/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/.test(key)) { out.push(key.slice(key.indexOf('_') + 1).replace(/_/g, ' ')); out.push(key.slice(key.lastIndexOf('_') + 1)); }
  return out;
}
const esc = (s) => s.replace(/[.+*?^$()[\]{}|\\]/g, '\\$&');
// Returns { unnamed: [...keys], dead: [...keys] } — empty arrays = census satisfied.
function enumCensusGaps(keys, necessityText) {
  const t = String(necessityText || '');
  const unnamed = [], dead = [];
  for (const key of keys) {
    const alias = keyAliases(key).find(a => new RegExp('\\b' + esc(a) + '\\b', 'i').test(t));
    if (!alias) { unnamed.push(key); continue; }
    const seg = t.match(new RegExp('\\b' + esc(alias) + '\\b[^·;]*', 'i'));
    const first = seg && seg[0].slice(alias.length, alias.length + 80).match(FIRST_COUNT_RX);
    if (first && (first[1] || first[2]) === '0' && !ZERO_JUSTIFIED_RX.test(seg[0])) dead.push(key);
  }
  return { unnamed, dead };
}

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

function readLastAssistantTurn(tp) {
  let raw;
  try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return ''; }
  const L = raw.split(/\r?\n/).filter(Boolean);
  let text = '';
  for (let i = L.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    const m = o.message || o;
    const role = m.role || o.type;
    if (role === 'user') break;
    if (role !== 'assistant') continue;
    const c = m.content;
    if (typeof c === 'string') { text = c + '\n' + text; continue; }
    if (Array.isArray(c)) {
      let localText = '';
      for (const b of c) {
        if (!b) continue;
        if (b.type === 'text' && b.text) localText += b.text + '\n';
      }
      text = localText + text;
    }
  }
  return text;
}

runHook({ name: 'pre-code-check', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }

  const toolInput = data.tool_input || {};
  const filePath = String(toolInput.file_path || '');
  if (!ETANAH_PATH.test(filePath)) return { fired: false };

  const bypassMatch = (readLastAssistantTurn(data.transcript_path || '') || '').match(/\[skip-pre-code-check:\s*([^\]]+)\]/);
  if (bypassMatch) { log({ action: 'bypass', reason: bypassMatch[1], file: filePath }); return { fired: false }; }

  const text = readLastAssistantTurn(data.transcript_path || '');
  if (!text) { log({ action: 'no-transcript', file: filePath }); return { fired: false }; }

  const type = changeType(filePath);
  const REQUIRED = REQUIRED_CHECKS.filter(n => !TYPE_DROP[type].includes(n));

  const codeCheckMatch = text.match(/CODE-CHECK:\s*([^\n]+)/i);
  if (!codeCheckMatch) {
    log({ action: 'blocked-missing-emit', file: filePath, type });
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ pre-code-check: etanah code Edit blocked — no CODE-CHECK emit line in this turn.',
        '   File: ' + filePath + '  (change-type: ' + type + ' → ' + REQUIRED.length + ' rows apply)',
        '   Emit ONE compact line before the Edit, the ' + REQUIRED.length + ' applicable checks with ✓ or ✗(reason):',
        '',
        '     CODE-CHECK: analog ✓ · in-file ✓ · sibling ✓ · existing-reuse ✓ · name-by-purpose ✓',
        '              · minimal-diff ✓ · logic-matrix ✓ · blast-radius ✓ · predicate ✓ · falsifier ✓',
        '              · read+write-path ✓ · BA-expected ✓(observed <how>) · full-address ✓ · sibling-diff ✓',
        '              · necessity ✓(each hunk -> the defect need it serves; analog-copied extras stripped) · confidence 85%',
        '',
        '   necessity = every added line maps to the DEFECT, not to the analog (2026-08-03 QA-272943:',
        '   scaleToFitA4Strict copied wholesale from the analog shrank the pelan — size was the only issue).',
        '   🚨 Adding >= 2 branches keyed on enum/reference values ("Lot".equals / URS_PT.equals / case X:)?',
        '   necessity MUST cite a CENSUS naming every key with a denominator — e.g. necessity ✓(census',
        '   PPTPBL.unit_pengiraan 4/4 envs: Meter Persegi 3/4 · Lot 1/4 — Plot/Hakmilik/Permohonan/Urusan',
        '   0/4 DROPPED). A key you keep at 0 rows needs a because/spec/BA reason (QA-280540: 4 of 6 copied',
        '   branches covered 0 rows across 4 envs and shipped behind "no analog-copied extras").',
        '   BA-expected ✓ must cite an OBSERVATION; unobservable before a build -> ✗(unverified — <risk>).',
        '   all-writers = when guarding/fixing a null-or-bad VALUE, grep EVERY site that writes/constructs',
        '   the failing symbol and state each is safe: all-writers ✓(grep setAlamatBerdaftar -> 4 sites, each',
        '   init-safe) — guarding ONE site of a multi-writer symbol shipped a still-crashing fix (2026-08-03',
        '   QA-272867 pemohon-2). Not a value fix -> ✗(N/A — <what kind of change this is>).',
        '',
        '   🚨 value-domain (parse/conversion guards — new BigDecimal / parseInt / valueOf / Date.parse):',
        '   the falsifier MUST enumerate EVERY malformed-input CLASS the conversion rejects — null · empty/',
        '   blank · grouping-separator (","/".") · non-numeric — and the guard must cover the CLASS, not the',
        '   one observed value. #277439 (Perak): fixed the observed PROD value "10,000.00" (comma) ONLY;',
        '   new BigDecimal("") still NFE (empty-string case, flagged by Dev). Complete guard = isNotBlank +',
        '   strip-separator at ALL parse sites.',
        '',
        '   Any ✗ needs a parenthetical reason: analog ✗(novel defensive helper).',
        '   Genuinely trivial edit (rename-only / typo) → [skip-pre-code-check: <reason>].',
      ].join('\n'),
    };
  }

  const line = codeCheckMatch[1];
  const missing = [];
  const bareCross = [];
  const bareEvidence = [];
  const predictionTick = [];
  for (const name of REQUIRED) {
    const escaped = name.replace(/[.+*?^$()[\]{}|\\]/g, '\\$&');
    const rx = new RegExp(escaped + '\\s*([✓✗])(\\s*\\(([^)]+)\\))?', 'i');
    const m = line.match(rx);
    if (!m) { missing.push(name); continue; }
    if (m[1] === '✗' && !m[2]) bareCross.push(name);
    if (EVIDENCE_CHECKS.includes(name) && (!m[3] || m[3].trim().length < EVIDENCE_MIN)) bareEvidence.push(name);
    if (name === 'BA-expected' && m[1] === '✓' && (!m[3] || !OBSERVATION_TOKEN_RX.test(m[3]))) predictionTick.push(name);
  }
  if (!CONFIDENCE_RX.test(line)) missing.push('confidence <N>%');

  if (missing.length > 0 || bareCross.length > 0 || bareEvidence.length > 0 || predictionTick.length > 0) {
    log({ action: 'blocked-malformed', file: filePath, type, missing, bareCross, bareEvidence, predictionTick });
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
    if (bareEvidence.length > 0) {
      reasons.push(
        '   Bare glyph on judgment-bearing check(s): ' + bareEvidence.join(', '),
        '   These MUST carry evidence in parentheses — what you READ, not what you believe:',
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
      );
    }
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ pre-code-check: CODE-CHECK line present but malformed.',
        '   File: ' + filePath,
        ...reasons,
        '   Full expected list (' + type + '): ' + REQUIRED.join(' · '),
      ].join('\n'),
    };
  }

  // v1.7: enum-keyed branch chain ADDED by this edit → necessity must carry a census naming every key.
  const addedKeys = [...branchKeys(toolInput.new_string || toolInput.content)].filter(k => !branchKeys(toolInput.old_string).has(k));
  if (addedKeys.length >= ENUM_BRANCH_MIN) {
    const necMatch = line.match(/necessity\s*[✓✗]\s*\(([^)]+)\)/i);
    const necText = necMatch ? necMatch[1] : '';
    const waived = CENSUS_WAIVER_RX.test(necText);
    const gaps = waived ? { unnamed: [], dead: [] } : enumCensusGaps(addedKeys, necText);
    const noCount = !waived && !CENSUS_COUNT_RX.test(necText);
    if (noCount || gaps.unnamed.length > 0 || gaps.dead.length > 0) {
      log({ action: 'blocked-enum-census', file: filePath, type, addedKeys, noCount, unnamed: gaps.unnamed, dead: gaps.dead });
      return {
        fired: true, blocked: true,
        blockReason: [
          '⛔ pre-code-check: this edit ADDS ' + addedKeys.length + ' enum/reference-keyed branches with no census behind them.',
          '   File: ' + filePath,
          '   Added keys: ' + addedKeys.join(' · '),
          ...(noCount ? ['   necessity cites NO count with a denominator (N/M · N of M · count(*) · SELECT..FROM · 0 rows · grepped..N).'] : []),
          ...(gaps.unnamed.length ? ['   Keys NOT named in the necessity census: ' + gaps.unnamed.join(' · ')] : []),
          ...(gaps.dead.length ? ['   Keys cited at 0 coverage yet still in the diff, no because/spec/BA reason: ' + gaps.dead.join(' · ')] : []),
          '',
          '   A branch per enum value is a claim that the POPULATION uses that value. Count it first —',
          '   one GROUP BY on the keyed column per env — then cite it per key inside necessity:',
          '     necessity ✓(census PPTPBL.unit_pengiraan 4/4 envs: Meter Persegi 3/4 · Lot 1/4 —',
          '                 Plot/Hakmilik/Permohonan/Urusan 0/4 DROPPED)',
          '   Keys are not population values (Y/N flag, BA-spec statuses)? necessity ✓(... census N/A — <why>).',
          '',
          '   2026-09-22 QA-280540: six unit_pengiraan branches copied from PelupusanBayaranOnlineStrategy:173-210;',
          '   the field holds only Meter Persegi or Lot on 4/4 Melaka envs — four branches were dead on arrival',
          '   and the line read "necessity ✓(no analog-copied extras)".',
        ].join('\n'),
      };
    }
  }

  log({ action: 'passed', file: filePath, line: line.slice(0, 200) });
  return { fired: false };
});
