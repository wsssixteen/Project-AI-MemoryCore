#!/usr/bin/env node
// stg1-block.eval.js — replay eval.
// Replay case: #284544 2026-10-12: stg1 read unasked and reported as a BA staging repro; 2026-10-14 stg1 offered again after the ban.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'stg1-block.check.hook.js');
const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'stg1-block-'));
const U = t => ({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: t }] } });
const UM = t => ({ type: 'user', isMeta: true, message: { role: 'user', content: [{ type: 'text', text: t }] } });
const A = t => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: t }] } });
let n = 0;
function fire(tool, events, raw) {
  let tp;
  if (events) { tp = path.join(TMP, 't' + (++n) + '.jsonl'); fs.writeFileSync(tp, events.map(e => JSON.stringify(e)).join('\n') + '\n'); }
  const input = raw !== undefined ? raw : JSON.stringify({ tool_name: tool, tool_input: { query: 'SELECT 1' }, ...(tp ? { transcript_path: tp } : {}) });
  return spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
}
const Q1 = 'mcp__postgres-mlkstg1-pg__query_database';
const blocked = r => r.status === 2 && /stg1-block/.test(r.stderr || '');

let r = fire(Q1, [U('check the staging test data for 284544')]);
check('F1 replay: stg1 query while miya did not name stg1 -> BLOCK', blocked(r), 'exit=' + r.status);
check('F2 block text names stg2 as the one to use', /stg2/.test(r.stderr || ''), r.stderr);
r = fire(Q1, [U('please check stg1 for the BA test')]);
check('F3 miya names stg1 in his latest message -> allowed', r.status === 0, 'exit=' + r.status + ' ' + r.stderr);
r = fire(Q1, [U('check stg1'), A('done'), U('now prepare the local test')]);
check('F4 stg1 named in an OLDER message only -> BLOCK', blocked(r), 'exit=' + r.status);
r = fire(Q1, [U('prepare local test'), A('I could check stg1 for you')]);
check('F5 stg1 in my own text does not unlock it -> BLOCK', blocked(r), 'exit=' + r.status);
r = fire(Q1, [U('prepare local test'), UM('<system-reminder>stg1 is NOT used</system-reminder>')]);
check('F6 a meta / reminder message naming stg1 does not unlock it -> BLOCK', blocked(r), 'exit=' + r.status);
r = fire(Q1, [U('prepare local test'), U('<system-reminder>stg1</system-reminder>')]);
check('F7 a reminder block typed as user text does not unlock it -> BLOCK', blocked(r), 'exit=' + r.status);
r = fire('mcp__postgres-mlkstg-pg__query_database', [U('anything')]);
check('F8 stg2 query is never touched -> exit 0, silent', r.status === 0 && !(r.stderr || '').trim(), 'exit=' + r.status);
r = fire('mcp__postgres-mlkstg1-pg__get_schema_info', [U('look at the schema')]);
check('F9 every stg1 tool, not only query_database -> BLOCK', blocked(r), 'exit=' + r.status);
r = fire(Q1, null);
check('F10 no transcript path -> BLOCK (no proof miya asked)', blocked(r), 'exit=' + r.status);
r = fire(null, null, '');
check('F11 empty stdin -> exit 0', r.status === 0, 'exit=' + r.status);
r = fire(null, null, 'not json');
check('F12 malformed stdin -> exit 0', r.status === 0, 'exit=' + r.status);
r = fire(Q1, [U('the stg10 schema')]);
check('F13 "stg10" does not count as stg1 -> BLOCK', blocked(r), 'exit=' + r.status);
r = fire(Q1, [U('use STG1 this time')]);
check('F14 upper case STG1 from miya -> allowed', r.status === 0, 'exit=' + r.status);
{ let reg = false;
  try { const s = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
    for (const g of (s.hooks.PreToolUse || [])) for (const h of g.hooks || []) if (/stg1-block/.test(h.command) && /mlkstg1/.test(g.matcher || '')) reg = true; } catch (_) {}
  check('F15 registered in settings.json PreToolUse on the stg1 tools', reg, 'not registered'); }

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nstg1-block.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
