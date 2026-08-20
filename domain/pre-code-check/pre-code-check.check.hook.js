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
        '   BA-expected ✓ must cite an OBSERVATION; unobservable before a build -> ✗(unverified — <risk>).',
        '   all-writers = when guarding/fixing a null-or-bad VALUE, grep EVERY site that writes/constructs',
        '   the failing symbol and state each is safe: all-writers ✓(grep setAlamatBerdaftar -> 4 sites, each',
        '   init-safe) — guarding ONE site of a multi-writer symbol shipped a still-crashing fix (2026-08-03',
        '   QA-272867 pemohon-2). Not a value fix -> ✗(N/A — <what kind of change this is>).',
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

  log({ action: 'passed', file: filePath, line: line.slice(0, 200) });
  return { fired: false };
});
