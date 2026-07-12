#!/usr/bin/env node
// spawn-telemetry.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: any subagent or workflow spawn completes
// ACTION: append telemetry row with tool name so delegation tiering is measured
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'spawn-telemetry', event: 'PostToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  // TODO(forge): implement NARROW detection for the replay case, then widen with evidence.
  const fired = false;
  if (!fired) return { fired: false };
  return { fired: true, blocked: false, contextOut: 'spawn-telemetry: advisory\n' };
});
