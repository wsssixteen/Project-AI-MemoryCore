#!/usr/bin/env node
// agent-spend-gate.check.hook.js — born via core/forge.js (2026-07-19)
// TRIGGER: Agent tool call without explicit model param, or Workflow launched by canned name instead of scriptPath
// ACTION: HARD-BLOCK: Agent must carry explicit model (inheritance banned); Workflow must use scriptPath (fan-out read first); scriptPath without agent-cap comment = advisory WARN; bypass [skip-spend-gate: reason]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const fs = require('fs');

runHook({ name: 'agent-spend-gate', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const tool = String(data.tool_name || '');
  const ti = data.tool_input || {};

  // Rule 1 — canned Workflow by name: BLOCK. Replay: deep-research by name → 105 session-model
  // agents, 4.08M tokens (2026-07-19). scriptPath forces the fan-out to be READ first.
  if (tool === 'Workflow' && ti.name && !ti.scriptPath) {
    return { fired: true, blocked: true, contextOut:
      '⛔ agent-spend-gate: Workflow launched by canned NAME ("' + ti.name + '") — BANNED.\n' +
      '   Read the script (agent count × model), then launch via scriptPath.\n' +
      '   Replay this kills: deep-research-by-name → 105 Fable agents, 4.08M tokens (2026-07-19).\n' +
      '   Bypass: include [skip-spend-gate: <reason>] in the reply.\n' };
  }

  // Rule 2 — Agent without explicit model: BLOCK (session-model inheritance banned).
  if (tool === 'Agent' && !ti.model) {
    return { fired: true, blocked: true, contextOut:
      '⛔ agent-spend-gate: Agent launch WITHOUT explicit model — session-model inheritance is\n' +
      '   the 2026-07-19 blowup root. Add model: haiku|sonnet|opus per Delegation Economy tiering.\n' +
      '   Bypass: include [skip-spend-gate: <reason>] in the reply.\n' };
  }

  // Rule 3 — scriptPath Workflow without a visible agent-count cap: advisory WARN (count axis).
  if (tool === 'Workflow' && ti.scriptPath) {
    let hasCap = false;
    try { hasCap = /max[_-]?agents|MAX_AGENTS|agent[_-]?cap/i.test(fs.readFileSync(ti.scriptPath, 'utf8')); } catch (_) {}
    if (!hasCap) {
      return { fired: true, blocked: false, contextOut:
        '⚠️ agent-spend-gate: scriptPath workflow has no agent-count cap marker (maxAgents/MAX_AGENTS).\n' +
        '   Verify the fan-out size before this launch; >20 agents needs みや\'s nod.\n' };
    }
  }

  return { fired: false };
});
