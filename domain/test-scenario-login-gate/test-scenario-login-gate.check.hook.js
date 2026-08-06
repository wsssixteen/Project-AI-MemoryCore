#!/usr/bin/env node
// test-scenario-login-gate.check.hook.js — born via core/forge.js (2026-08-05)
// TRIGGER: a test-scenario / hand-back emit that carries no login username
// ACTION: BLOCK the stop until a login is named, or a bypass token is given
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// WHY THIS EXISTS (replay case, 2026-08-05, ESOKONGAN #273919):
//   A complete Test Scenario went out — env, file:line, two numbered steps — with
//   no username. みや: "You failed to give me a username, please fix this for AWAM
//   you kept failing this."
//
//   The existing rule is officer-shaped: "TEST SCENARIO = LIVE TASK STATE, give the
//   LOGIN", derived from a umm_a_tgsn query. AWAM has no tugasan, so that path never
//   fires and nothing replaced it. This gate keys on the LOGIN itself, not on the
//   tugasan, so it covers AWAM and pelupusan alike.
//
//   The login is always derivable — never ask みや for it:
//     officer side → umm_a_tgsn + ind_tgsn + pcp_pengguna, current holder
//     AWAM side    → umm_p_aplikasi.created_by for that urusan on the target schema
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

// Emit shapes that mean "みや is about to go and test this".
const HANDBACK_RE = /test scenario|test data|testing steps?|steps? to (?:test|reproduce)|ready (?:to|for) test|sila uji|cuba uji|go test/i;

// A login = an email address. Every etanah account is one, on both sides.
const LOGIN_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

// Escape for a genuinely account-less screen (public unauthenticated page).
const BYPASS_RE = /\[skip-login-gate:\s*[^\]]+\]/i;

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

runHook({ name: 'test-scenario-login-gate', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }

  // Never re-block — same discipline as show-gate / awam-no-resit-gate.
  if (data.stop_hook_active) return { fired: false };

  const text = lastAssistantText(data);
  if (!text || text.length < 200) return { fired: false };
  if (BYPASS_RE.test(text)) return { fired: false };
  if (!HANDBACK_RE.test(text)) return { fired: false };
  if (LOGIN_RE.test(text)) return { fired: false };

  return {
    fired: true,
    blocked: true,
    reason:
      '⛔ test-scenario-login-gate: a test scenario was emitted with NO login.\n' +
      '   みや cannot test without a username. Derive it, do not ask him:\n' +
      '     • officer side → umm_a_tgsn + ind_tgsn + pcp_pengguna, the CURRENT holder\n' +
      '     • AWAM side    → umm_p_aplikasi.created_by for that urusan on the target schema\n' +
      '   Add a Login row, then re-send.\n' +
      '   Genuinely no account needed (public unauthenticated page)? [skip-login-gate: <reason>]\n',
  };
});
