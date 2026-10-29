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
// Every adhoc brief carries the reply to the BA in two versions, Short then Full (miya 2026-10-22, ADHOC-MLMS-2026-1).
// A round with nothing for the BA says so in one line: "BA reply: none (<reason>)".
const BA_HEAD_RE = /^#{1,4}[^\n]*\b(?:reply to (?:the )?BA|BA reply)\b[^\n]*$/im;
const BA_NONE_RE = /^[ \t>*`-]*BA reply:\s*none\s*\([^)\n]+\)/im;
const DIAGRAM_NONE_RE = /^[ \t>*`-]*Diagram:\s*none\s*\([^)\n]+\)/im;
const ROUTE_RE = /^[ \t>*`|-]*Adhoc route:\s*(?:(?:PATCH|ALTER)(?:\s*\+\s*CODE-FIX)?\b(?!\s*\+)|(?:ANSWER|USER-STEP|CODE-FIX|OWNED-ELSEWHERE|CR)\b(?!\s*\+)|none\s*\([^)\n]+\))/im;
function hasBaReply(text) {
  if (BA_NONE_RE.test(text)) return true;
  const m = text.match(BA_HEAD_RE);
  if (!m) return false;
  const after = text.slice(m.index);
  return /\bShort\b/.test(after) && /\bFull\b/.test(after);
}
// A step the BA is told to click / fill / add is traced through the screen's disabled/rendered conditions for THIS
// record first, and says how it was tested (miya 2026-10-22, ADHOC-MLMS-2026-1: "Tambah Kawasan, isi luas" was sent;
// the luas fields are disabled for MLMS when kwsnAsal=false, which the analog record did not share).
const ACTION_RE = /\b(?:klik|click|tekan|tambah|isi|pilih|simpan|hantar)\b/i;
const USER_STEP_RE = /^[ \t>*`|-]*User-step:/im;
function baSection(text) {
  const m = text.match(BA_HEAD_RE);
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length);
  const next = rest.search(/^#{1,4}\s/m);
  return next === -1 ? rest : rest.slice(0, next);
}
// "How sure are you" is answered with a Confidence table, never a bare % (same day, same adhoc: 85% given after
// reading only the save path).
const SURE_ASK_RE = /\bhow (?:sure|confident)\b|\bberapa (?:yakin|pasti)\b|\bconfidence\b.*\?|\bsure\b.*\bin\s*%/i;
const PCT_RE = /\b\d{1,3}\s?%/;
const CONF_TABLE_RE = /^#{1,4}[^\n]*\bConfidence table\b/im;
function confidenceCheck(turn) {
  if (!SURE_ASK_RE.test(turn.prompt || '')) return null;
  const said = turn.events.filter(e => e.kind === 'text').map(e => e.text).join('\n');
  if (!PCT_RE.test(said) || CONF_TABLE_RE.test(said)) return null;
  return {
    fired: true, blocked: true,
    blockReason: [
      '⛔ adhoc-brief-first: a % was given to "how sure" with no Confidence table.',
      '   Add "## Confidence table": one row per check, ⬜ caps the %: read AND write path incl. the screen\'s',
      '   disabled/rendered conditions (cap 50) · THIS record\'s value of each condition field (cap 50) · analog',
      '   compared on those fields (cap 60) · build-match PROD = local, behind 0 (cap 70) · falsifier checked (cap 80)',
      '   · live test or photo after the step (needed for 90+). Steps: .claude/skills/adhoc-save/SKILL.md step 1.',
      '   ⚡ DELTA ONLY: send just the table and the corrected %.',
    ].join('\n') + '\n',
  };
}
function stopCheck(data) {
  let all;
  try { all = turns(parse(data.transcript_path || '')); } catch (_) { return { fired: false }; }
  if (!all.length) return { fired: false };
  const conf = confidenceCheck(all[all.length - 1]);
  if (conf) return conf;
  const ev = all[all.length - 1].events;
  let first = ev.findIndex(e => e.kind === 'text' && MARK_RE.test(e.text));
  let id;
  if (first !== -1) {
    id = ev[first].text.match(MARK_RE)[1];
  } else {
    // No marker, but the save agent started in this turn: the brief still owes the BA reply and the picture
    // (miya 2026-10-28, ADHOC-MCL-2026-1: marker left out, save started inline, neither check ran).
    const agent = ev.findIndex(e => {
      if (e.kind !== 'tool' || e.name !== 'Agent') return false;
      try { return isSaveAgent('Agent', JSON.parse(e.input)); } catch (_) { return false; }
    });
    if (agent === -1) return { fired: false };
    id = (ev[agent].input.match(/ADHOC-[A-Z0-9]+-\d{4}-\d+/i) || ['this adhoc'])[0];
    first = agent - 1;
  }
  const said = ev.filter(e => e.kind === 'text').map(e => e.text).join('\n');
  if (!hasBaReply(said)) {
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ adhoc-brief-first: the brief for ' + id + ' has no reply to the BA.',
        '   Every adhoc brief carries "## Reply to BA" with two versions, Short then Full,',
        '   drafted with Pena (profile whatsapp-dev + module plain), placed just above Next steps (miya 2026-10-22).',
        '   Nothing to tell the BA this round? One line instead: BA reply: none (<reason>).',
        '   ⚡ DELTA ONLY: send just the Reply to BA section, then start the save agent.',
      ].join('\n') + '\n',
    };
  }
  // The finding is also drawn as ONE picture (explain-diagram skill) and sent, so the BA gets it with the reply
  // (miya 2026-10-28, ADHOC-MCL-2026-1). A round with nothing to draw says so: "Diagram: none (<reason>)".
  const sentPicture = ev.some(e => e.kind === 'tool' && e.name === 'SendUserFile' && /\.(?:png|jpe?g|svg)\b/i.test(e.input));
  if (!sentPicture && !DIAGRAM_NONE_RE.test(said)) {
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ adhoc-brief-first: the brief for ' + id + ' has no picture of the finding.',
        '   Draw the cause as ONE picture with the explain-diagram skill (render: node lib/diagram-render.js),',
        '   look at the PNG, then send it with SendUserFile, placed with the Reply to BA (miya 2026-10-28).',
        '   Nothing to draw this round? One line instead: Diagram: none (<reason>).',
        '   ⚡ DELTA ONLY: send just the picture.',
      ].join('\n') + '\n',
    };
  }
  // Fix ladder rung 2: a data patch in the brief carries the code's own read run on the after-state
  // (ADHOC-MLMS-2026-1: two area rows with different units would have made the fee ~RM0.04).
  if (/\b(?:UPDATE\s+[\w.]+\s+SET|DELETE\s+FROM|INSERT\s+INTO)\b/i.test(said) && !/^[ \t>*`|-]*After-state:/im.test(said)) {
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ adhoc-brief-first: the brief for ' + id + ' offers a data patch with no After-state line.',
        '   Run the code\'s own read on the rows as they will be AFTER the patch and write one line:',
        '   After-state: <code read, file:line> on <rows after patch> → <what the screen/fee/flow gets> · checked: <SELECT|code trace>',
        '   ⚡ DELTA ONLY: send just the After-state line.',
      ].join('\n') + '\n',
    };
  }
  if (!BA_NONE_RE.test(said) && ACTION_RE.test(baSection(said)) && !USER_STEP_RE.test(said)) {
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ adhoc-brief-first: the reply to the BA for ' + id + ' tells the user to act on a screen, with no User-step trace.',
        '   For each field or button named: the xhtml disabled=/rendered= on it, the flag it reads, that flag\'s value',
        '   for THIS record, the analog\'s value, and how it was tested. One line each:',
        '   User-step: <field/button> · gate <xhtml:line> <expr> · flag <col>=<this> (analog <that>) · ENABLED|DISABLED · tested: <code trace|DB|photo|not tested>',
        '   A DISABLED step is not sent to the BA (miya 2026-10-22, ADHOC-MLMS-2026-1).',
        '   ⚡ DELTA ONLY: send just the User-step lines (and a corrected Reply to BA if a step is DISABLED).',
      ].join('\n') + '\n',
    };
  }
  // The brief ends with ONE route line: what the BA/TSO does next for this finding (miya 2026-10-29, ADHOC-MCL-2026-2).
  // Names and pick rules: .claude/skills/adhoc-save/SKILL.md section "Adhoc route".
  if (!ROUTE_RE.test(said)) {
    return {
      fired: true, blocked: true,
      blockReason: [
        '⛔ adhoc-brief-first: the brief for ' + id + ' has no route line.',
        '   One line: Adhoc route: <ANSWER | USER-STEP | PATCH | ALTER | CODE-FIX | OWNED-ELSEWHERE | CR> — <evidence>',
        '   (PATCH or ALTER may add "+ CODE-FIX" when the code keeps making bad records; show the sweep count).',
        '   No finding yet this round? Adhoc route: none (<reason>). The Reply to BA ends with the matching ask.',
        '   Pick rules: .claude/skills/adhoc-save/SKILL.md section "Adhoc route" (miya 2026-10-29).',
        '   ⚡ DELTA ONLY: send just the route line.',
      ].join('\n') + '\n',
    };
  }
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
