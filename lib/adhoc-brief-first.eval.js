#!/usr/bin/env node
// adhoc-brief-first.eval.js — fixture eval for lib/adhoc-brief-first.js (must be green before ship).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parse, turns, check } = require('./adhoc-brief-first.js');

const T = s => ({ kind: 'text', text: s });
const tool = (name, input) => ({ kind: 'tool', name, input: JSON.stringify(input) });
const BRIEF = 'Title: MLKSTG - MLPS tandatangan Borang 4Ae ralat GIS\n' + 'The Tandatangan click fails because the licence write to GIS fails. '.repeat(8);
const NARRATION = 'Investigation is done; now saving the adhoc (Task folder, quest block, register row, quest doc) and running its audit before I give you the result.';

const SAVE_FOLDER = tool('PowerShell', { command: "New-Item -ItemType Directory -Force -Path 'C:\\Tasks\\Melaka\\291. AH - STG - MLPS - Tandatangan Borang 4Ae L1e ralat GIS\\1. Brief'" });
const SAVE_BLOCK = tool('PowerShell', { command: 'node "$m\\quest\\active-cli.js" start ADHOC-MLPS-2026-4 phase=0 status=active ticket_type=adhoc' });
const SAVE_DOC = tool('Write', { file_path: 'C:\\x\\projects\\coding-projects\\active\\ADHOC-MLPS-2026-4\\ADHOC-MLPS-2026-4.md', content: '# doc' });
const SAVE_AUDIT = tool('PowerShell', { command: 'node "$m\\lib\\adhoc-save-audit.js" ADHOC-MLPS-2026-4' });
const QUERY = tool('mcp__postgres-mlkstg1-pg__query_database', { query: 'SELECT 1' });
const READ_DOC = tool('Read', { file_path: 'C:\\x\\projects\\coding-projects\\active\\ADHOC-MLPS-2026-3\\ADHOC-MLPS-2026-3.md' });
const GREP_REG = tool('Grep', { pattern: 'gisRequestService', path: 'C:\\x\\ADHOC-REGISTER.md' });
const BG_AGENT = tool('Agent', { description: 'Save adhoc save-set', prompt: 'Write the adhoc save-set for ADHOC-MLPS-2026-4 and run the audit', run_in_background: true });

const cases = [
  // The exact miss of 2026-10-13 (ADHOC-MLPS-2026-4), event order captured from the session transcript lines 240-271.
  ['R1 the 2026-10-13 miss: narration, 5 save writes, THEN the brief', [QUERY, T(NARRATION), SAVE_FOLDER, SAVE_DOC, SAVE_BLOCK, SAVE_DOC, SAVE_AUDIT, T(BRIEF)], false],
  ['F1 save-set written with no brief at all', [QUERY, SAVE_BLOCK, SAVE_AUDIT], false],
  ['F2 a short narration line is not a brief', [T(NARRATION), SAVE_BLOCK, T(BRIEF)], false],
  ['P1 brief first, then the save handed to a background agent', [QUERY, T(BRIEF), BG_AGENT], true],
  ['P2 brief first, then save writes on the main thread', [QUERY, T(BRIEF), SAVE_FOLDER, SAVE_BLOCK, SAVE_AUDIT], true],
  ['P3 investigation only: reads of a quest doc and the register are not saves', [READ_DOC, GREP_REG, QUERY, T(BRIEF)], true],
  ['P4 no brief and no save (a plain question turn)', [QUERY, T('Yes.')], true],
];

let pass = 0;
for (const [name, events, want] of cases) {
  const got = check({ prompt: 'x', events });
  const ok = got.pass === want;
  if (ok) pass++;
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name + '  → ' + (got.pass ? 'PASS' : 'FAIL') + ' (' + got.reason + ')');
}

// Parser case: a transcript file with hook feedback inside the turn stays ONE turn.
const tmp = path.join(os.tmpdir(), 'adhoc-brief-first-eval-' + process.pid + '.jsonl');
const L = o => JSON.stringify(o);
fs.writeFileSync(tmp, [
  L({ type: 'user', message: { content: 'start adhoc quest for staging' } }),
  L({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'PowerShell', input: { command: 'node quest\\active-cli.js start ADHOC-X-2026-1 phase=0' } }] } }),
  L({ type: 'user', message: { content: [{ type: 'tool_result', content: 'ok' }] } }),
  L({ type: 'assistant', message: { content: [{ type: 'text', text: BRIEF }] } }),
  L({ type: 'user', message: { content: 'Stop hook feedback:\nBLOCKED' } }),
  L({ type: 'assistant', message: { content: [{ type: 'text', text: 'delta' }] } }),
].join('\n'));
const tr = turns(parse(tmp));
fs.unlinkSync(tmp);
const okParse = tr.length === 1 && check(tr[0]).pass === false;
if (okParse) pass++;
console.log((okParse ? 'PASS  ' : 'FAIL  ') + 'T1 transcript file: hook feedback does not split the turn; save-before-brief is caught  → turns=' + tr.length);

const total = cases.length + 1;
console.log('\nadhoc-brief-first eval: ' + pass + '/' + total + ' passed');
process.exit(pass === total ? 0 : 1);
