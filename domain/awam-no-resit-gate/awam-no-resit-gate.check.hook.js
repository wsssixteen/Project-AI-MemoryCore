#!/usr/bin/env node
// awam-no-resit-gate.check.hook.js — born via core/forge.js (2026-07-22)
// TRIGGER: an AWAM ticket whose urusan needs a No Resit Carian Rasmi reaches a
//          test-data / hand-back emit with no No Resit value present.
// ACTION:  BLOCK the stop. The No Resit is derivable from the DB in one query;
//          handing back without it wastes みや's build cycle.
//
// WHY THIS EXISTS (replay case, 2026-07-22, ESOKONGAN #271721):
//   CLAUDE.md carried the rule as PROSE only ("AWAM + No-Resit-urusan → derive the
//   No Resit at Phase 0"), and the ticket-gate.js Phase-0 row was explicitly PARKED.
//   Result: a PRBB AWAM ticket ran Phase 0 → Rubric → Apply → a full Test Scenario
//   emit, and the No Resit was never derived. Prose does not fire. This does.
//
// SOURCE OF TRUTH for the urusan list:
//   etanah-awam\src\main\java\my\gov\etanah\awam\consent\web\form\CarianRasmiHakmilikForm.java
//   URUSAN_CARIAN_RASMI static block :107-119. The CRHM* family are the carian-rasmi
//   urusan themselves (they GENERATE receipts) — the 5 PLP urusan below CONSUME one.
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

// The 5 PLP urusan that require a No Resit Carian Rasmi on AWAM.
const NO_RESIT_URUSAN = ['PLTP', 'PSBS', 'MCL', 'PPTPB', 'PRBB'];

// A real No Resit looks like 260707BSAT00337 — 6 digits, 2-6 letters, 4-6 digits.
const NO_RESIT_RE = /\b\d{6}[A-Z]{2,6}\d{4,6}\b/;

// Emit shapes that mean "みや is about to go test this".
const HANDBACK_RE = /test scenario|test data|testing step|steps? to (?:test|reproduce)|ready (?:to|for) test|sila uji|cuba uji|go test|build .*deploy .*test/i;

// AWAM context signals. Require one — a pelupusan-only ticket must never block.
const AWAM_RE = /\bAWAM\b|portal awam|etanah-awam|borang permohonan|p_aplikasi_id|umm_p_aplikasi|jana semula/i;

const BYPASS_RE = /\[skip-no-resit(?:-gate)?:\s*[^\]]+\]/i;

function lastAssistantText(data) {
  if (typeof data.last_assistant_message === 'string') return data.last_assistant_message;
  if (typeof data.lastAssistantText === 'string') return data.lastAssistantText;
  const t = data.transcript;
  if (Array.isArray(t)) {
    for (let i = t.length - 1; i >= 0; i--) {
      const m = t[i];
      if (m && m.role === 'assistant' && typeof m.content === 'string') return m.content;
    }
  }
  return '';
}

runHook({ name: 'awam-no-resit-gate', event: 'Stop' }, (input) => {
  let data = {};
  try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }

  // Never re-block (no loop) — same discipline as show-gate/terse-gate.
  if (data.stop_hook_active) return { fired: false };

  const text = lastAssistantText(data);
  if (!text || text.length < 200) return { fired: false };

  if (BYPASS_RE.test(text)) return { fired: false };

  // 1. Is this a hand-back / test-scenario emit?
  if (!HANDBACK_RE.test(text)) return { fired: false };

  // 2. Is it AWAM?
  if (!AWAM_RE.test(text)) return { fired: false };

  // 3. Does it concern a No-Resit urusan? (word-boundary so PRZ != PRBB)
  const hit = NO_RESIT_URUSAN.filter(u => new RegExp(`\\b${u}\\b`).test(text));
  if (!hit.length) return { fired: false };

  // 4. Is a No Resit actually present?
  if (NO_RESIT_RE.test(text)) return { fired: true, blocked: false };

  const urusan = hit.join('/');
  // state from the hand-back text (permohonan prefix) via lib/states.js — never assume melaka (2026-09-04)
  let stateDir = '<state>';
  try { const r = require(path.join(ROOT, 'lib', 'states.js')).resolve({ text }); if (r.state) stateDir = r.record.knowledge_dir; } catch (_) {}
  return {
    fired: true,
    blocked: true,
    contextOut:
      `⛔ awam-no-resit-gate: AWAM ${urusan} hand-back with NO "No Resit Carian Rasmi".\n` +
      `   ${urusan} starts at CarianRasmiHakmilikForm — みや cannot open the permohonan without a receipt,\n` +
      `   and BA almost never puts one in the ticket. It is DERIVABLE from the DB in one query.\n\n` +
      `   Fix before stopping:\n` +
      `     1. Derive it — etanah-knowledge/${stateDir}/TEST-PERMOHONAN-INDEX.md § "No Resit Carian Rasmi"\n` +
      `        (V1-V7 validations + ready query; receipt must be < 6 months old and unused for that hakmilik)\n` +
      `     2. Write it into the Task notes file:\n` +
      `        node quest/notes.js --folder "<Task folder>" --qa <n> --env <env> --urusan ${hit[0]} \\\n` +
      `             --id "No Resit: <no_resit>" --user "<login>"\n` +
      `     3. Re-emit the hand-back WITH the receipt value.\n\n` +
      `   Banned: handing back an AWAM carian-rasmi ticket with "need a No Resit from BA".\n` +
      `   Genuinely N/A (no carian-rasmi step in this ticket's flow)? Add [skip-no-resit: <reason>].\n`,
  };
});
