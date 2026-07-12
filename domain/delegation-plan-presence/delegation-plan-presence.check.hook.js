#!/usr/bin/env node
// delegation-plan-presence.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: turn spawned 2+ subagents (Task/Agent/Workflow tool_use) with no DELEGATION PLAN table in the reply
// ACTION: advisory reminding the Delegation Economy rule
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'delegation-plan-presence', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  // TODO(forge): implement NARROW detection for the replay case, then widen with evidence.
  const fired = false;
  if (!fired) return { fired: false };
  return { fired: true, blocked: false, contextOut: 'delegation-plan-presence: advisory\n' };
});
