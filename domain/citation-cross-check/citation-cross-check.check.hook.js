#!/usr/bin/env node
// citation-cross-check.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: Scout/Recon-shaped reply cites file:line for files never Read/Grepped this turn
// ACTION: advisory listing unbacked citations
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'citation-cross-check', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  // TODO(forge): implement NARROW detection for the replay case, then widen with evidence.
  const fired = false;
  if (!fired) return { fired: false };
  return { fired: true, blocked: false, contextOut: 'citation-cross-check: advisory\n' };
});
