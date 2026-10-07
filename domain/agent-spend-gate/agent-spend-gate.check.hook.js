#!/usr/bin/env node
// agent-spend-gate.check.hook.js — born via core/forge.js (2026-07-19) · v2 2026-10-07
// TRIGGER: an Agent tool call, or a Workflow tool call (by name, by scriptPath, or with an inline script)
// ACTION: HARD-BLOCK an agent that names no model (it would inherit the session model), a haiku agent, and a
//         Workflow launched by canned name. Advisory WARN: opus/fable agent with no stated reason · a session that is
//         not on the orchestrator model · a scriptPath with no agent-count cap. Bypass: miya writes
//         [skip-spend-gate: <reason>] in his LAST message.
// Rule this hardens: CLAUDE.md "Delegation Economy" — Opus 5.5 orchestrates, every delegated agent runs on
//         Sonnet 5.5 unless a reason for opus is stated (miya 2026-10-07).
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const fs = require('fs');
const { agentCalls, reasonCount } = require(path.join(__dirname, 'workflow-models.js'));

const ORCHESTRATOR = /claude-opus-5-5/;         // the orchestrator model named in CLAUDE.md Delegation Economy
const DEFAULT_TIER = 'sonnet';                  // Sonnet 5.5: the default and the floor for delegated agents
const BANNED = new Set(['haiku']);              // banned from delegation since CLAUDE.md v1.68
const NEEDS_REASON = new Set(['opus', 'fable']);
const BYPASS = /\[skip-spend-gate:\s*[^\]\s][^\]]*\]/i;
const NOT_A_TURN_START = /^\s*(<system-reminder>|<task-notification|Stop hook feedback)/i;

function transcriptTail(p) {
  try {
    const size = fs.statSync(p).size, want = 400000;
    const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(Math.min(size, want));
    fs.readSync(fd, buf, 0, buf.length, Math.max(0, size - buf.length)); fs.closeSync(fd);
    return buf.toString('utf8');
  } catch (_) { return ''; }
}
// miya's last typed message, and the model that wrote the last assistant entry.
function readSession(transcriptPath) {
  let lastUser = '', model = '';
  if (!transcriptPath) return { lastUser, model };
  for (const line of transcriptTail(String(transcriptPath)).split('\n')) {
    let o; try { o = JSON.parse(line); } catch (_) { continue; }
    const m = o && o.message;
    if (!m) continue;
    if (m.role === 'assistant' && typeof m.model === 'string' && /^claude-/.test(m.model) && !o.isSidechain) model = m.model;
    if (m.role === 'user' && !o.isMeta) {
      const t = typeof m.content === 'string' ? m.content
        : Array.isArray(m.content) ? m.content.filter(x => x && x.type === 'text').map(x => x.text).join('\n') : '';
      if (t && !NOT_A_TURN_START.test(t)) lastUser = t;
    }
  }
  return { lastUser, model };
}

const RULE = '   Delegation Economy (CLAUDE.md): Opus 5.5 orchestrates; every delegated agent runs on model: \'sonnet\' (Sonnet 5.5).\n' +
  '   model: \'opus\' only with a reason: in a workflow script  // opus-reason: <why>  · for the Agent tool, in the DELEGATION PLAN row.\n';
const HOW_BYPASS = '   Bypass: miya writes [skip-spend-gate: <reason>] in his last message.\n';

runHook({ name: 'agent-spend-gate', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const tool = String(data.tool_name || '');
  const ti = data.tool_input || {};
  if (tool !== 'Agent' && tool !== 'Workflow') return { fired: false };

  const session = readSession(data.transcript_path);
  if (BYPASS.test(session.lastUser)) return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-spend-gate', contextOut: 'agent-spend-gate: bypassed by miya\n' };
  const block = text => ({ fired: true, blocked: true, contextOut: text + HOW_BYPASS });
  const warns = [];
  if (session.model && !ORCHESTRATOR.test(session.model)) {
    warns.push('⚠️ agent-spend-gate: this session runs on ' + session.model + ', not Opus 5.5 (the orchestrator named in CLAUDE.md Delegation Economy).\n' +
      '   Say so in the first line of the DELEGATION PLAN.\n');
  }

  // Rule 1 — canned Workflow by name: BLOCK. Replay: deep-research by name → 105 session-model
  // agents, 4.08M tokens (2026-07-19). scriptPath forces the fan-out to be READ first.
  if (tool === 'Workflow' && ti.name && !ti.scriptPath) {
    return block('⛔ agent-spend-gate: Workflow launched by canned NAME ("' + ti.name + '") — BANNED.\n' +
      '   Read the script (agent count × model), then launch via scriptPath.\n' +
      '   Replay this kills: deep-research-by-name → 105 Fable agents, 4.08M tokens (2026-07-19).\n');
  }

  if (tool === 'Agent') {
    const model = String(ti.model || '').toLowerCase();
    // Rule 2 — Agent without explicit model: BLOCK (session-model inheritance banned).
    if (!model) {
      return block('⛔ agent-spend-gate: Agent launch WITHOUT explicit model — it would run on the session model\n' +
        '   (the 2026-07-19 blowup root). Add model: \'' + DEFAULT_TIER + '\'.\n' + RULE);
    }
    if (BANNED.has(model)) {
      return block('⛔ agent-spend-gate: model: \'' + model + '\' is banned from delegation (CLAUDE.md v1.68: a reader decides what to include,\n' +
        '   and a partial retrieval cannot be seen). Use model: \'' + DEFAULT_TIER + '\'.\n');
    }
    if (NEEDS_REASON.has(model)) {
      warns.push('⚠️ agent-spend-gate: this agent runs on ' + model + '. Delegated work defaults to ' + DEFAULT_TIER + ' (Sonnet 5.5);\n' +
        '   the DELEGATION PLAN row must say why this one needs ' + model + '.\n');
    }
  }

  if (tool === 'Workflow') {
    let src = typeof ti.script === 'string' ? ti.script : '';
    if (!src && ti.scriptPath) { try { src = fs.readFileSync(ti.scriptPath, 'utf8'); } catch (_) { src = ''; } }
    if (src) {
      const calls = agentCalls(src);
      // Rule 4 — every agent() in a workflow names its model: BLOCK (the Workflow tool's own default is the session model).
      const bare = calls.filter(c => !c.model);
      if (bare.length) {
        return block('⛔ agent-spend-gate: ' + bare.length + ' of ' + calls.length + ' agent() call(s) in this workflow name no model — each would run on the session model.\n' +
          '   ' + bare.slice(0, 12).map(c => 'line ' + c.line + (c.label ? ' (' + c.label + ')' : '')).join(' · ') + (bare.length > 12 ? ' · …' : '') + '\n' + RULE);
      }
      const banned = calls.filter(c => BANNED.has(c.model));
      if (banned.length) {
        return block('⛔ agent-spend-gate: ' + banned.length + ' agent() call(s) use a model banned from delegation (' + [...new Set(banned.map(c => c.model))].join(', ') + ') — ' +
          banned.slice(0, 12).map(c => 'line ' + c.line).join(' · ') + '.\n   Use model: \'' + DEFAULT_TIER + '\'.\n');
      }
      const heavy = calls.filter(c => NEEDS_REASON.has(c.model));
      if (heavy.length > reasonCount(src)) {
        warns.push('⚠️ agent-spend-gate: ' + heavy.length + ' agent() call(s) run on opus/fable but the script states ' + reasonCount(src) + ' reason(s).\n' +
          '   Add one  // opus-reason: <why>  comment per such call (' + heavy.slice(0, 12).map(c => 'line ' + c.line).join(' · ') + '), or move it to ' + DEFAULT_TIER + '.\n');
      }
    }
    // Rule 3 — scriptPath Workflow without a visible agent-count cap: advisory WARN (count axis).
    if (ti.scriptPath && !/max[_-]?agents|MAX_AGENTS|agent[_-]?cap/i.test(src)) {
      warns.push('⚠️ agent-spend-gate: scriptPath workflow has no agent-count cap marker (maxAgents/MAX_AGENTS).\n' +
        '   Verify the fan-out size before this launch; >20 agents needs みや\'s nod.\n');
    }
  }

  return warns.length ? { fired: true, blocked: false, contextOut: warns.join('') } : { fired: false };
});
