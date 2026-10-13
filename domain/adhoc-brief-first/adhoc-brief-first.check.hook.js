#!/usr/bin/env node
// adhoc-brief-first.check.hook.js — born via core/forge.js (2026-10-13)
// TRIGGER: an adhoc save-set write (Task folder, active-cli start/update ADHOC, register row, ADHOC quest doc,
//          notes.js, the audit) or the START of the adhoc save agent, in a turn where no brief was shown yet
// ACTION: BLOCK it and tell me to end the turn with the brief first
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// Order this gate holds (miya 2026-10-13): investigate → BRIEF ends the turn → the Stop half of this Feature
// (adhoc-brief-first.discipline.hook.js) asks for the background save agent → the agent saves.
//
// PASS when any of these holds:
//   1. the call comes from a subagent (the background save agent itself: agent_id, or its own prompt opens the turn)
//   2. this turn already shows a brief (assistant text of BRIEF_MIN_CHARS or more) — then the agent may start,
//      and a save-set write on the main thread is let through (no agent tool in the session)
//   3. a save-set write when this turn already started the adhoc save agent (the agent's call seen from the parent)
//   4. miya's own prompt of this turn carries [skip-brief-first: <reason>] (assistant text never counts)
// Transcript unreadable = fail-open (never block on a file we cannot read).
'use strict';
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
const SAVE_AGENT_RE = /ADHOC-[A-Z0-9]+-\d{4}-\d+[\s\S]*(?:save-set|adhoc-save-audit|active-cli|ADHOC-REGISTER)|(?:save-set|adhoc-save-audit|active-cli|ADHOC-REGISTER)[\s\S]*ADHOC-[A-Z0-9]+-\d{4}-\d+/i;

function isSaveAgent(tool, input) {
  return tool === 'Agent' && input && typeof input === 'object' && SAVE_AGENT_RE.test(String(input.prompt || ''));
}
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
  if (isSaveAgent(tool, input)) return 'start of the adhoc save agent';
  return null;
}

// ── Stop half (same file, also listed in the stop bundle): the closing reply is an adhoc brief that carries
//    "Saving in the background next: ADHOC-<...>" and no save agent was started AFTER it → block the stop once
//    and ask for the ONE background save agent. The brief is already on his screen, so the save starts after it.
const MARK_RE = /^[ \t>*`-]*Saving in the background next:[ \t`*]*(ADHOC-[A-Z0-9]+-\d{4}-\d+)/im;
function stopCheck(data) {
  let all;
  try { all = turns(parse(data.transcript_path || '')); } catch (_) { return { fired: false }; }
  if (!all.length) return { fired: false };
  const ev = all[all.length - 1].events;
  const first = ev.findIndex(e => e.kind === 'text' && MARK_RE.test(e.text));
  if (first === -1) return { fired: false };
  const id = ev[first].text.match(MARK_RE)[1];
  const started = ev.slice(first + 1).some(e => e.kind === 'tool' && e.name === 'Agent' && e.input.includes(id));
  if (started) return { fired: true, blocked: false };
  return {
    fired: true, blocked: true,
    blockReason: [
      '▶ adhoc-brief-first: the brief for ' + id + ' is delivered. Now start the background save.',
      '   ONE Agent call: model sonnet, run_in_background true. Its prompt opens with',
      '   [skip-brief-first: background save agent] and carries the ADHOC id, title, env, Task folder name,',
      '   every file to MOVE, the register row text and the full quest doc text; it runs the adhoc-save',
      '   "Each round" steps until the audit is green.',
      '   Then end with ONE line (no second brief): save started in the background for ' + id + '.',
    ].join('\n') + '\n',
  };
}

runHook({ name: 'adhoc-brief-first', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  if (data.hook_event_name === 'Stop') return stopCheck(data);
  const part = savePart(data.tool_name, data.tool_input);
  if (!part) return { fired: false };
  if (data.agent_id || data.agent_type) return { fired: true, blocked: false };

  let all;
  try { all = turns(parse(data.transcript_path || '')); } catch (_) { return { fired: true, blocked: false }; }
  if (!all.length) return { fired: true, blocked: false };
  const turn = all[all.length - 1];
  if (BYPASS_RE.test(turn.prompt || '')) return { fired: true, blocked: false };
  const briefed = turn.events.some(e => e.kind === 'text' && e.text.length >= BRIEF_MIN_CHARS);
  if (briefed) return { fired: true, blocked: false };
  const agentStarted = turn.events.some(e => {
    if (e.kind !== 'tool' || e.name !== 'Agent') return false;
    try { return isSaveAgent('Agent', JSON.parse(e.input)); } catch (_) { return false; }
  });
  if (data.tool_name !== 'Agent' && agentStarted) return { fired: true, blocked: false };

  return {
    fired: true, blocked: true,
    blockReason: [
      '⛔ adhoc-brief-first: ' + part + ' — and miya has not been briefed in this turn.',
      '   He reads the finding FIRST. Saving comes after the brief, in the background (miya 2026-10-13).',
      '   Do this instead:',
      '     1. END THE TURN with the brief (Title line, finding, evidence, Next steps) and close it with the line',
      '        Saving in the background next: <ADHOC-ID>',
      '     2. the stop check then asks for ONE background Agent (model sonnet) that writes the whole save-set and runs the audit;',
      '     3. when the agent reports, give him one line: adhoc saved → <ADHOC-ID>: audit N/N PASS.',
      '   Steps: .claude/skills/adhoc-save/SKILL.md, section "Brief first".',
      '   Only miya can waive it, in his own message: the skip-brief-first token with a reason.',
    ].join('\n') + '\n',
  };
});
