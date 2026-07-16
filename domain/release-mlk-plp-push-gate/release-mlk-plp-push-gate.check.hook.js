#!/usr/bin/env node
// release-mlk-plp-push-gate.check.hook.js — born via core/forge.js (2026-07-16)
// TRIGGER: a Bash git push references a mlk/release/* ref
// ACTION: block unless ref matches mlk/release/x.y[.z] AND release-prep state phase is verified or pushed
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// Defense-in-depth: domain/release-mlk-plp/release-prep.js `push` enforces the same rules
// internally (its child-process git calls never pass through Bash-tool hooks) — this gate
// catches MANUAL `git push` attempts around the pipeline. Fail-CLOSED on missing state:
// a release-ref push with no pipeline state is exactly the unsafe case.
// Bypass: include RELEASE_GATE_BYPASS in the command (visible in transcript = auditable).
// State dir override for evals: RELEASE_MLK_PLP_STATE_DIR.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const STATE_DIR = process.env.RELEASE_MLK_PLP_STATE_DIR
  || path.join(ROOT, 'domain', 'release-mlk-plp', 'state');
const REF_RE = /mlk\/release\/([^\s'"]+)/;
const GOOD_VER = /^\d+\.\d+(\.\d+)?$/;

runHook({ name: 'release-mlk-plp-push-gate', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  if ((data.tool_name || '') !== 'Bash') return { fired: false };
  const cmd = (data.tool_input && data.tool_input.command) || '';
  if (!/git\s+push/.test(cmd)) return { fired: false };
  const m = REF_RE.exec(cmd);
  if (!m) return { fired: false };
  if (/RELEASE_GATE_BYPASS/.test(cmd)) {
    return { fired: true, blocked: false, bypassed: true, bypassToken: 'RELEASE_GATE_BYPASS' };
  }
  const ver = m[1];
  if (!GOOD_VER.test(ver)) {
    return {
      fired: true, blocked: true,
      blockReason: `⛔ release-mlk-plp-push-gate: ref "mlk/release/${ver}" does not match mlk/release/<x.y[.z]> — release pushes go through domain/release-mlk-plp/release-prep.js. Bypass: RELEASE_GATE_BYPASS in the command.`,
    };
  }
  let st = null;
  try { st = JSON.parse(fs.readFileSync(path.join(STATE_DIR, `release-${ver}.json`), 'utf8')); } catch (_) { st = null; }
  if (!st) {
    return {
      fired: true, blocked: true,
      blockReason: `⛔ release-mlk-plp-push-gate: no pipeline state for release ${ver} — run release-prep.js init→branch→merge→verify→push instead of a raw push.`,
    };
  }
  if (st.phase !== 'verified' && st.phase !== 'pushed') {
    return {
      fired: true, blocked: true,
      blockReason: `⛔ release-mlk-plp-push-gate: release ${ver} is at phase "${st.phase}" — merge-verification has not passed; push refused.`,
    };
  }
  return { fired: true, blocked: false };
});
