#!/usr/bin/env node
// delegation-plan-presence.check.hook.js — born via core/forge.js (2026-07-12)
// TRIGGER: 2+ subagents (Task/Agent/Workflow tool_use) spawned since the last user
//          message, with no DELEGATION PLAN table/mention in the final assistant reply
// ACTION: advisory — logged to telemetry only (spawn_tool field), never stdout, never blocks
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook, appendTelemetry } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const SPAWN_TOOL_RE = /^(Task|Agent|Workflow)$/;

function readTranscript(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return null; }
  return raw.split('\n').filter(Boolean).map((line) => {
    try { return JSON.parse(line); } catch (_) { return null; }
  }).filter(Boolean);
}

// Only what happened AFTER the most recent user message counts — a prior turn's
// fan-out (already reported on) must not re-trigger the advisory on a later turn.
function scanSinceLastUser(entries) {
  let lastUserIdx = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].type === 'user') { lastUserIdx = i; break; }
  }
  const spawnTools = [];
  let lastAssistantText = '';
  for (let i = lastUserIdx + 1; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry || entry.type !== 'assistant') continue;
    const blocks = (entry.message && entry.message.content) || [];
    for (const block of blocks) {
      if (!block) continue;
      if (block.type === 'tool_use' && SPAWN_TOOL_RE.test(block.name)) spawnTools.push(block.name);
      if (block.type === 'text' && typeof block.text === 'string') lastAssistantText = block.text;
    }
  }
  return { spawnTools, lastAssistantText };
}

function hasDelegationPlan(text) {
  if (/delegation plan/i.test(text)) return true;
  // or a markdown table row carrying both "model" and "effort" columns
  return text.split('\n').some((line) => line.includes('|') && /model/i.test(line) && /effort/i.test(line));
}

runHook({ name: 'delegation-plan-presence', event: 'Stop' }, (input) => {
  let data = {};
  try { data = JSON.parse(input || '{}'); } catch (_) { /* malformed stdin — fail open */ }
  const transcriptPath = data.transcript_path;
  if (!transcriptPath) return { fired: false };

  const entries = readTranscript(transcriptPath);
  if (!entries || !entries.length) return { fired: false };

  const { spawnTools, lastAssistantText } = scanSinceLastUser(entries);
  if (spawnTools.length < 2) return { fired: false };
  if (hasDelegationPlan(lastAssistantText)) return { fired: false };

  // Advisory only — writing to stdout would inject Stop-hook text into the
  // transcript; log to telemetry instead so the signal is auditable without noise.
  appendTelemetry({
    ts: new Date().toISOString(), hook: 'delegation-plan-presence', event: 'Stop', mode: 'native',
    exit: 0, blocked: false, fired: true, spawn_tool: spawnTools.join(','),
    ...(process.env.DPP_TEST_MARKER ? { test_marker: process.env.DPP_TEST_MARKER } : {}),
  });
  return { fired: true, blocked: false };
});
