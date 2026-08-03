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
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');

const ETANAH_PATH = /[\\\/]etanah-(pelupusan|common|awam|teknikal)[\\\/].+\.(java|xhtml|docx)$/i;

const REQUIRED_CHECKS = [
  'analog', 'in-file', 'sibling', 'existing-reuse', 'name-by-purpose',
  'minimal-diff', 'logic-matrix', 'blast-radius', 'predicate', 'falsifier',
  'read+write-path', 'BA-expected', 'full-address', 'sibling-diff', 'necessity', 'all-writers',
];
const CONFIDENCE_RX = /\bconfidence\s+\d+\s*%/i;

const EVIDENCE_CHECKS = ['analog', 'existing-reuse', 'blast-radius', 'read+write-path', 'falsifier', 'necessity', 'all-writers'];
const EVIDENCE_MIN = 12;

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

  const codeCheckMatch = text.match(/CODE-CHECK:\s*([^\n]+)/i);
  if (!codeCheckMatch) {
    log({ action: 'blocked-missing-emit', file: filePath });
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ pre-code-check: etanah code Edit blocked — no CODE-CHECK emit line in this turn.',
        '   File: ' + filePath,
        '   Emit ONE compact line before the Edit, all 15 checks with ✓ or ✗(reason):',
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
  for (const name of REQUIRED_CHECKS) {
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
    log({ action: 'blocked-malformed', file: filePath, missing, bareCross, bareEvidence, predictionTick });
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
        '     analog          ✓(<file:line> of the code you copied the shape from)',
        '     existing-reuse  ✓(grepped <symbol> -> reused <Class.method():line>) | ✓(grepped <symbol> -> 0 existing resolvers)',
        '     blast-radius    ✓(grepped <symbol> -> N call-sites: <file:line>, ...)',
        '     read+write-path ✓(<Class.method():line> persists it) | ✓(grepped <getter> -> 0 persisters)',
        '     falsifier       ✓(the record shape that would break this + how it differs from the one you tested)',
        '   A ✓ you cannot cite is a guess. Go run the grep/query first.',
      );
    }
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ pre-code-check: CODE-CHECK line present but malformed.',
        '   File: ' + filePath,
        ...reasons,
        '   Full expected list: ' + REQUIRED_CHECKS.join(' · '),
      ].join('\n'),
    };
  }

  log({ action: 'passed', file: filePath, line: line.slice(0, 200) });
  return { fired: false };
});
