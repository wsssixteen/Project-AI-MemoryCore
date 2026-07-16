#!/usr/bin/env node
// release-mlk-plp-ask.check.hook.js — born via core/forge.js (2026-07-16)
// TRIGGER: prompt asks to prepare a Melaka Pelupusan release - release number, deploy pelupusan, BAQA release message
// ACTION: inject advisory to invoke the release-mlk-plp skill so the pipeline runs through its stop-points
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
// False-positive cost: one 4-line advisory. NEGATIVE guard: "release notes" chatter.
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const TRIGGER = /(prepare|create|start|buat|sediakan)[^\n.]{0,40}\brelease\b|\brelease\s+branch\b|\bdeploy\s+pelupusan\b|\bplanned\s+release\s+melaka\b|\bmlk\/release\/\d/i;
const NEGATIVE = /release\s+notes?\b/i;

runHook({ name: 'release-mlk-plp-ask', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const prompt = data.prompt || '';
  if (!TRIGGER.test(prompt) || NEGATIVE.test(prompt)) return { fired: false };
  return {
    fired: true, blocked: false,
    contextOut: [
      '⚙️  release-mlk-plp-ask: release-preparation ask detected.',
      '   Invoke the `release-mlk-plp` skill (Skill tool) — no ad-hoc git for a release.',
      '   Pipeline: PLAN(V1) → release-prep.js branch/merge(V2 on conflict)/verify(V3) → push (gated)',
      '   → BUILD server (V4/V5) → DEPLOY server (V6) → Google Sheet (V7). Endpoints: servers.local.json.',
      '',
    ].join('\n'),
  };
});
