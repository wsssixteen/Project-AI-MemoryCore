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

  // v2 (2026-08-21, per みや): a DEPLOY-STEPS emit must CARRY its test scenario —
  // prepare the scenario right after the deploy card, never leave testing implicit.
  const DEPLOY_RE = /deployment-scripts|sh deploy-|deploy-awam\.sh|deploy-plp\.sh/i;
  const SCENARIO_TABLE_RE = /\|\s*Login\s*\|/i;
  if (DEPLOY_RE.test(text) && !(SCENARIO_TABLE_RE.test(text) && LOGIN_RE.test(text))) {
    return {
      fired: true,
      blocked: true,
      blockReason: // runHook prints only blockReason/contextOut to stderr
        
        '⛔ test-scenario-login-gate v2: deploy steps emitted with NO test scenario attached.\n' +
        '   Append the Test Scenario table (| Login | Screen | Do | Expect |) with a real login,\n' +
        '   directly under the deploy steps, then re-send. Derive the login yourself (umm_a_tgsn\n' +
        '   holder / umm_p_aplikasi.created_by). Bypass: [skip-login-gate: <reason>]\n',
    };
  }

  // v4 (2026-10-08, per みや, #283751): a deploy card is followed, in this order, by a Test scenario
  // section that names the env he chose and a Redmine handover section (Root cause + Solution + BA note).
  // "If I say test on server, straight away prepare test scenario & redmine handover in clear separate sections."
  const HANDOVER_BYPASS_RE = /\[skip-handover-gate:\s*[^\]<]+\]/i;
  if (DEPLOY_RE.test(text) && !HANDOVER_BYPASS_RE.test(text)) {
    const deployAt = text.search(DEPLOY_RE);
    const ENV_WORD = '(?:internal|staging|training|mlit|stag|int-env|stag-env)';
    const scen = text.match(new RegExp('^#{1,4}[^\\n]*\\btest scenario\\b[^\\n]*$', 'im'));
    const hand = text.match(/^#{1,4}[^\n]*\bredmine (?:handover|hand-over|hand over)\b[^\n]*$/im);
    const missing = [];
    if (!scen) missing.push('a heading "Test scenario — <env>"');
    else {
      if (!new RegExp('\\b' + ENV_WORD + '\\b', 'i').test(scen[0])) missing.push('the env in the Test scenario heading (internal / staging / training: the one miya named)');
      if (scen.index < deployAt) missing.push('the Test scenario section AFTER the deploy steps');
    }
    if (!hand) missing.push('a heading "Redmine handover"');
    else {
      if (scen && hand.index < scen.index) missing.push('the Redmine handover section AFTER the Test scenario');
      const body = text.slice(hand.index);
      if (!/\bRoot cause\b/i.test(body)) missing.push('a Root cause row in the Redmine handover');
      if (!/\bSolution\b/i.test(body)) missing.push('a Solution row in the Redmine handover');
    }
    if (missing.length) {
      return {
        fired: true,
        blocked: true,
        blockReason:
          '⛔ test-scenario-login-gate v4: the deploy card is not followed by its two sections.\n' +
          '   Missing: ' + missing.join(' · ') + '\n' +
          '   Shape, right after the deploy steps: "## Test scenario — <env>" (table Login | Screen | Do | Expect)\n' +
          '   then "## Redmine handover" (Root cause · Solution · BA note from ticket-close-block.js · field set).\n' +
          '   miya named no env? ask him with one popup first. Bypass: [skip-handover-gate: <reason>]\n',
      };
    }
  }
  // v3 (2026-10-04, per みや, #282442): a test hand-back that names a permohonan must be backed
  // by a local-test-prep run that is still true on the machine (local DB = the schema holding
  // the test data, the ticket's fix files on his repo). He may run locally at any moment.
  const PREP_BYPASS_RE = /\[skip-local-prep:\s*[^\]<]+\]/i;
  const TEST_TABLE_RE = /\|\s*Login\s*\|[\s\S]*\|\s*(?:Do|Expect|Env)\s*\||\|\s*(?:Do|Expect|Env)\s*\|[\s\S]*\|\s*Login\s*\|/i;
  if ((HANDBACK_RE.test(text) || TEST_TABLE_RE.test(text) || DEPLOY_RE.test(text)) && !PREP_BYPASS_RE.test(text)) {
    const prep = require(path.join(ROOT, 'quest', 'local-test-prep.js'));
    const ids = Array.from(new Set(text.match(prep.PERMOHONAN_RE) || []));
    let waived = false;
    try { const F = require(path.join(ROOT, 'domain', 'falsifier-ran-check', 'check.js')); waived = (text.match(/#(\d{5,6})\b/g) || []).some(n => F.recordedOverride && F.recordedOverride('QA-' + n.slice(1))); } catch (_) {}
    if (ids.length && !waived) {
      let c; try { c = prep.check(ids); } catch (e) { c = { ok: false, reason: 'check failed: ' + e.message }; }
      if (!c.ok) {
        return {
          fired: true,
          blocked: true,
          blockReason:
            '⛔ test-scenario-login-gate v3: this test hand-back is NOT backed by a local test prep.\n' +
            '   Reason: ' + c.reason + '\n' +
            '   みや may start his local JBoss at any moment. Set his machine up BEFORE the hand-back:\n' +
            '     1. confirm by a DB query which schema holds the permohonan\n' +
            '     2. node quest/local-test-prep.js --qa <num> --env <stg1|stg2|mlit> --permohonan "' + ids.join(',') + '"\n' +
            '     3. put its LOCAL-TEST-PREP line + the restart need in the reply, then re-send\n' +
            '   みや said hold, or the module cannot run locally? add the skip-local-prep token with the real reason.\n',
        };
      }
    }
  }

  if (!HANDBACK_RE.test(text)) return { fired: false };
  if (LOGIN_RE.test(text)) return { fired: false };

  return {
    fired: true,
    blocked: true,
    blockReason: // runHook prints only blockReason/contextOut to stderr
      
      '⛔ test-scenario-login-gate: a test scenario was emitted with NO login.\n' +
      '   みや cannot test without a username. Derive it, do not ask him:\n' +
      '     • officer side → umm_a_tgsn + ind_tgsn + pcp_pengguna, the CURRENT holder\n' +
      '     • AWAM side    → umm_p_aplikasi.created_by for that urusan on the target schema\n' +
      '   Add a Login row, then re-send.\n' +
      '   Genuinely no account needed (public unauthenticated page)? [skip-login-gate: <reason>]\n',
  };
});
