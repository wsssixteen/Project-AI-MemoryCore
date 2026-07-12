#!/usr/bin/env node
// falsifier-ran-check.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: reply claims a falsifier/probe was planted AND claims post-test confirmation without the probe marker appearing
// ACTION: advisory: falsifier planted but never shown firing
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'falsifier-ran-check', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  // TODO(forge): implement NARROW detection for the replay case, then widen with evidence.
  const fired = false;
  if (!fired) return { fired: false };
  return { fired: true, blocked: false, contextOut: 'falsifier-ran-check: advisory\n' };
});
