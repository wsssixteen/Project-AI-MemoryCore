#!/usr/bin/env node
// Eval for session-audit.js: one positive + one negative per class, then the real session when it is on disk.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { audit, toEvents, parse } = require('./session-audit');

let pass = 0; let fail = 0;
const check = (name, ok) => { if (ok) pass++; else { fail++; console.log('FAIL ' + name); } };
const has = (ev, cls) => audit(ev).some((f) => f.class === cls);
const hook = (text, extra = {}) => ({ kind: 'hook', type: 'hook_success', event: 'UserPromptSubmit', text, ...extra });
const tool = (id, name, input, ts) => ({ kind: 'tool', id, name, input, ts });
const res = (id, text, error = false, ts) => ({ kind: 'result', id, text, error, ts });
const demand = hook('Read NOW:\n   - projects/x/FLOWABLE-KNOWLEDGE.md');

// demanded-read-missing + gate-false-pass
const failedRead = [demand, tool('1', 'Read', { file_path: 'a/FLOWABLE-KNOWLEDGE.md' }), res('1', 'File does not exist', true)];
check('failed read is found', has(failedRead, 'demanded-read-missing'));
check('failed read is a gate false pass', has(failedRead, 'gate-false-pass'));
const goodRead = [demand, tool('1', 'Read', { file_path: 'b/FLOWABLE-KNOWLEDGE.md' }), res('1', 'text')];
check('good read is clean', !has(goodRead, 'demanded-read-missing') && !has(goodRead, 'gate-false-pass'));
check('retry at the right path is clean', !has([...failedRead, tool('2', 'Read', { file_path: 'b/FLOWABLE-KNOWLEDGE.md' }), res('2', 'text')], 'demanded-read-missing'));

// slow-repeat
const run = (id, sec) => [tool(id, 'PowerShell', { command: 'run.ps1 alter-flow --id X | Select-Object -First 60' }, '2026-10-30T10:00:00Z'), res(id, 'x', false, `2026-10-30T10:0${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}Z`)];
check('slow command run twice', has([...run('1', 180), ...run('2', 180)], 'slow-repeat'));
check('fast command run twice is clean', !has([...run('1', 2), ...run('2', 2)], 'slow-repeat'));

// query-miss
check('0 rows', has([tool('1', 'mcp__p__query_database', { query: 'SELECT 1' }), res('1', 'Results (0 rows):')], 'query-miss'));
check('query error', has([tool('1', 'mcp__p__query_database', { query: 'SELECT 1' }), res('1', 'Error executing query: x')], 'query-miss'));
check('rows found is clean', !has([tool('1', 'mcp__p__query_database', { query: 'SELECT 1' }), res('1', 'Results (6 rows):')], 'query-miss'));

// gate-silent
const alterAsk = { kind: 'prompt', text: 'I have altered but issue', hasImage: true };
check('alter gate silent', has([alterAsk, { kind: 'prompt', text: 'next' }, hook('ALTER-TICKET GATE')], 'gate-silent'));
check('alter gate on time is clean', !has([alterAsk, hook('ALTER-TICKET GATE'), { kind: 'prompt', text: 'next' }], 'gate-silent'));

// advisory-ignored
const adv = { kind: 'hook', type: 'hook_additional_context', event: 'Stop', text: 'silent-claim-drift-gate: check it' };
check('advisory then words only', has([adv, { kind: 'say', text: 'I did verify' }], 'advisory-ignored'));
check('advisory then a tool is clean', !has([adv, tool('1', 'Grep', {}), { kind: 'say', text: 'ok' }], 'advisory-ignored'));

// foreign-lock
check('foreign lock', has([{ kind: 'prompt', text: 'alter this' }, hook('OBJECTIVE LOCK — QA-274323 (PRBB)')], 'foreign-lock'));
check('named lock is clean', !has([{ kind: 'prompt', text: 'work on 274323' }, hook('OBJECTIVE LOCK — QA-274323 (PRBB)')], 'foreign-lock'));

// ask-no-picture
const ask = { kind: 'say', text: '| # | Action | What it means | Your reply |' };
check('ask with no picture', has([{ kind: 'prompt', text: 'x' }, ask], 'ask-no-picture'));
check('ask after a picture is clean', !has([{ kind: 'prompt', text: 'x' }, tool('1', 'PowerShell', { command: 'node lib/diagram-render.js a.html' }), ask], 'ask-no-picture'));

// emit-missing
check('rows not emitted', has([hook('EMIT the rows as ✓/⬜'), { kind: 'say', text: 'done' }], 'emit-missing'));
check('rows emitted is clean', !has([hook('EMIT the rows as ✓/⬜'), { kind: 'say', text: 'A4 ✓ Alter Flow' }], 'emit-missing'));

// read-blocked
check('guard refuses a Read', has([tool('1', 'Read', { file_path: 'x.java' }), res('1', 'PreToolUse:Read hook error: branch-guard', true)], 'read-blocked'));
check('plain missing file is not a guard', !has([tool('1', 'Read', { file_path: 'x.java' }), res('1', 'File does not exist', true)], 'read-blocked'));

// notification-as-turn
check('hooks on a notification', has([{ kind: 'notification', text: '<task-notification>' }, hook('x')], 'notification-as-turn'));
check('notification with no hook is clean', !has([{ kind: 'notification', text: '<task-notification>' }, { kind: 'say', text: 'ok' }], 'notification-as-turn'));

// --until stops the audit before the message that contains the text
const rows = [{ type: 'user', message: { content: 'first' } }, { type: 'user', message: { content: 'STOP here' } }, { type: 'user', message: { content: 'after' } }];
check('until cuts the session', toEvents(rows, 'STOP').length === 1);

// A message that carries an app reminder is still his message; one that is only a reminder is not.
const withReminder = toEvents([{ type: 'user', message: { content: [{ type: 'text', text: '<system-reminder>x</system-reminder>' }, { type: 'text', text: 'I have altered but issue' }] } }]);
check('reminder before his words keeps the prompt', withReminder.length === 1 && withReminder[0].kind === 'prompt');
check('reminder alone is not a prompt', toEvents([{ type: 'user', message: { content: '<system-reminder>x</system-reminder>' } }]).every((e) => e.text !== '<system-reminder>x</system-reminder>'));
check('empty transcript gives no findings', audit(toEvents(parse(''))).length === 0);
check('bad line is skipped', parse('{bad\n{"type":"x"}\n').length === 1);

// The first real case: session 22cc0457 (audit of the audit, 2026-10-30). Must catch 9 of the 10 mechanical failures.
const real = path.join(os.homedir(), '.claude', 'projects',
  'C--Users-Ridhwan-OneDrive---Pymsoft-Sdn-Bhd-0--AI-Project-AI-MemoryCore--claude-worktrees-pembatalan-dropdown-popup-251828',
  '22cc0457-be4e-46cc-a719-9c5390676515.jsonl');
if (fs.existsSync(real)) {
  const found = new Set(audit(toEvents(parse(fs.readFileSync(real, 'utf8')), '<command-name>/goal')).map((f) => f.class));
  const expected = ['gate-silent', 'demanded-read-missing', 'gate-false-pass', 'query-miss', 'slow-repeat', 'advisory-ignored', 'emit-missing', 'read-blocked', 'foreign-lock', 'ask-no-picture'];
  const caught = expected.filter((c) => found.has(c));
  console.log(`real session: ${caught.length} of ${expected.length}; missing: ${expected.filter((c) => !found.has(c)).join(', ') || 'none'}`);
  check('real session catches at least 9 of 10', caught.length >= 9);
} else console.log('real session: transcript not on this machine, skipped');

console.log(`session-audit eval: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
