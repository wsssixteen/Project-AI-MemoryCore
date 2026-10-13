#!/usr/bin/env node
// adhoc-brief-first.check.hook.js — born via core/forge.js (2026-10-13)
// TRIGGER: the main thread is about to write an adhoc save-set part (Task folder, active-cli start ADHOC, register row, ADHOC quest doc, notes.js, the audit) in a turn where no brief was shown and no background save agent was started
// ACTION: BLOCK the write and tell me to start one background save agent and end the turn with the brief
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// PASS when any of these holds:
//   1. the call comes from a subagent (the background save agent itself)
//   2. this turn already started an Agent whose prompt is about an adhoc (the save was handed over)
//   3. this turn already shows a brief (assistant text of BRIEF_MIN_CHARS or more)
//   4. miya's own prompt of this turn carries [skip-brief-first: <reason>] (assistant text never counts)
// Transcript unreadable = fail-open (never block on a file we cannot read).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const { parse, turns, BRIEF_MIN_CHARS } = require(path.join(ROOT, 'lib', 'adhoc-brief-first.js'));

const DOC_PATH_RE = /(?:^|[\\/])(?:ADHOC-[A-Z0-9]+-\d{4}-\d+\.md|ADHOC-REGISTER\.md)$/i;
const CMD_RE = [
  /node[^|;\n]*active-cli\.js\S*\s+(?:start|update|archive)\s+ADHOC-/i,
  /node[^|;\n]*archive-quest\.js\S*\s+ADHOC-/i,
  /node[^|;\n]*adhoc-save-audit\.js/i,
  /node[^|;\n]*notes\.js\S*\s+--qa\s+ADHOC-/i,
  /(?:Add-Content|Set-Content|Out-File)[^|;\n]*ADHOC-REGISTER/i,
  /(?:New-Item|mkdir)[^|;\n]*\d+\. AH - /i,
];
const BYPASS_RE = /\[skip-brief-first:\s*[^\]\s][^\]]*\]/i;

function savePart(tool, input) {
  if (!input || typeof input !== 'object') return null;
  if (tool === 'Write' || tool === 'Edit') {
    const p = String(input.file_path || '');
    return DOC_PATH_RE.test(p) ? path.basename(p) : null;
  }
  if (tool === 'PowerShell' || tool === 'Bash') {
    const c = String(input.command || '');
    const hit = CMD_RE.find(r => r.test(c));
    return hit ? (c.match(hit) || [''])[0].slice(0, 80) : null;
  }
  return null;
}

runHook({ name: 'adhoc-brief-first', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  const part = savePart(data.tool_name, data.tool_input);
  if (!part) return { fired: false };
  if (data.agent_id || data.agent_type) return { fired: true, blocked: false };

  let all;
  try { all = turns(parse(data.transcript_path || '')); } catch (_) { return { fired: true, blocked: false }; }
  if (!all.length) return { fired: true, blocked: false };
  const turn = all[all.length - 1];
  if (BYPASS_RE.test(turn.prompt || '')) return { fired: true, blocked: false };
  const handedOver = turn.events.some(e => e.kind === 'tool' && e.name === 'Agent' && /adhoc/i.test(e.input));
  const briefed = turn.events.some(e => e.kind === 'text' && e.text.length >= BRIEF_MIN_CHARS);
  if (handedOver || briefed) return { fired: true, blocked: false };

  return {
    fired: true, blocked: true,
    blockReason: [
      '⛔ adhoc-brief-first: this is an adhoc save-set write (' + part + ') and miya has not been briefed in this turn.',
      '   He reads the finding FIRST. The save runs in the background (miya 2026-10-13).',
      '   Do this instead:',
      '     1. start ONE background Agent (model sonnet) that writes the whole save-set and runs the audit',
      '        (prompt: the ADHOC id, title, env, Task folder name, register row text, full quest doc text);',
      '     2. end the turn with the brief (Title line, finding, evidence, Next steps);',
      '     3. when the agent reports, give him one line: adhoc saved → <ADHOC-ID>: audit N/N PASS.',
      '   Steps: .claude/skills/adhoc-save/SKILL.md, section "Brief first".',
      '   Only miya can waive it, in his own message: the skip-brief-first token with a reason.',
    ].join('\n') + '\n',
  };
});
