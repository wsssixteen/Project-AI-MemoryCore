#!/usr/bin/env node
// skill-invocation-log.check.hook.js — born via core/forge.js (2026-09-07) — plan §9e blind spot
// symptom: DE 12.5 skill-load counter suspended since 2026-08-16 — skill invocations were unlogged
// goal: every Skill tool invocation is one row in domain/skill-invocation-log/log.jsonl with turn_id + skill
// goal_signal: invoking any skill appends a row carrying that skill's name
// retention: rotate monthly
// TRIGGER: PostToolUse, matcher Skill. ACTION: append the row; never blocks; fail-open.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');
let turnCtx = null; try { turnCtx = require(path.join(ROOT, 'lib', 'turn-context.js')); } catch (_) {}

function rowFor(data) {
  if (data.tool_name !== 'Skill') return null;
  const ti = data.tool_input || {};
  const skill = ti.skill || ti.name || null;
  if (!skill) return null;
  let ctx = {}; try { ctx = turnCtx ? turnCtx.contextFor(data) : {}; } catch (_) {}
  return { ts: new Date().toISOString(), turn_id: ctx.turn_id || null, qa: ctx.qa || null, skill: String(skill).slice(0, 80), args: String(ti.args || '').slice(0, 160) };
}

runHook({ name: 'skill-invocation-log', event: 'PostToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  const row = rowFor(data);
  if (!row) return { fired: false };
  const target = data._testLogPath || LOG;
  try { fs.appendFileSync(target, JSON.stringify(row) + '\n'); } catch (_) {}
  return { fired: true, blocked: false };
});

module.exports = { rowFor };
