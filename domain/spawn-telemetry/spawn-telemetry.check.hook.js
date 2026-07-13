#!/usr/bin/env node
// spawn-telemetry.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: any subagent or workflow spawn completes (tool_name matches Task|Agent|Workflow)
// ACTION: append a silent telemetry row so delegation-economy tiering is measurable
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook, appendTelemetry } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'spawn-telemetry', event: 'PostToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const toolName = data.tool_name || '';
  // NARROW trigger: only the known spawn-shaped tools.
  const fired = /^(Task|Agent|Workflow)$/.test(toolName);
  if (!fired) return { fired: false };
  const toolInput = data.tool_input || {};
  appendTelemetry({
    hook: 'spawn-telemetry',
    event: 'PostToolUse',
    mode: 'native',
    spawn_tool: toolName,
    model: toolInput.model || toolInput.subagent_type || 'unspecified',
  });
  // Silent — no contextOut, no stdout, never blocks.
  return { fired: true, blocked: false };
});
