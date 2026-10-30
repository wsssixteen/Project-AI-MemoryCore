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
const STATE = path.join(TMP, 'melaka-env-state.json');
const setSwitch = s => fs.writeFileSync(STATE, JSON.stringify({ melaka_staging_schema: s }));
setSwitch('stg2');
const U = t => ({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: t }] } });
const UM = t => ({ type: 'user', isMeta: true, message: { role: 'user', content: [{ type: 'text', text: t }] } });
const A = t => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: t }] } });
let n = 0;
function fire(tool, events, raw) {
  let tp;
  if (events) { tp = path.join(TMP, 't' + (++n) + '.jsonl'); fs.writeFileSync(tp, events.map(e => JSON.stringify(e)).join('\n') + '\n'); }
  const input = raw !== undefined ? raw : JSON.stringify({ tool_name: tool, tool_input: { query: 'SELECT 1' }, ...(tp ? { transcript_path: tp } : {}) });
  return spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, STG_BLOCK_STATE: STATE } });
}
const Q1 = 'mcp__postgres-mlkstg1-pg__query_database';
const blocked = r => r.status === 2 && /stg1-block/.test(r.stderr || '');

const out = r => (r.stdout || '') + (r.stderr || '');
const WQ = (sql, ev) => { const tp = path.join(TMP, 'w' + (++n) + '.jsonl'); fs.writeFileSync(tp, ev.map(e => JSON.stringify(e)).join('\n') + '\n');
  return spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: Q1, tool_input: { query: sql }, transcript_path: tp }), encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, STG_BLOCK_STATE: STATE } }); };

let r = fire(Q1, [U('give me the flowable links for the 5 permohonan the BA made')]);
check('F1 plain read, miya did not name stg1 -> ALLOWED (exit 0)', r.status === 0, 'exit=' + r.status);
check('F2 allowed read carries the reminder: announce + no root cause / test data', /Read from stg1/.test(out(r)) && /root cause/.test(out(r)) && /test data/.test(out(r)), out(r));
r = fire(Q1, [U('please check stg1 for the BA test')]);
check('F3 miya names stg1 -> allowed, announce reminder', r.status === 0 && /Read from stg1/.test(out(r)), 'exit=' + r.status + ' ' + out(r));
r = WQ('UPDATE et_main_stg1.x SET a=1', [U('look at the data')]);
check('F4 UPDATE on stg1, stg1 not named -> BLOCK', blocked(r), 'exit=' + r.status);
r = WQ('delete from x', [U('look at the data')]);
check('F5 DELETE lower case -> BLOCK', blocked(r), 'exit=' + r.status);
for (const kw of ['INSERT INTO x VALUES (1)', 'ALTER TABLE x ADD y int', 'DROP TABLE x', 'TRUNCATE x'])
  check('F6 ' + kw.split(' ')[0] + ' -> BLOCK', blocked(WQ(kw, [U('look at the data')])), kw);
r = WQ('SELECT * FROM x', [U('look at the data')]);
check('F7 SELECT -> allowed', r.status === 0, 'exit=' + r.status);
r = fire('mcp__postgres-mlkstg-pg__query_database', [U('anything')]);
check('F8 stg2 query is never touched -> exit 0, silent', r.status === 0 && !out(r).trim(), 'exit=' + r.status);
r = fire('mcp__postgres-mlkstg1-pg__get_schema_info', [U('look at the schema')]);
check('F9 other stg1 tools, plain read -> allowed with reminder', r.status === 0 && /Read from stg1/.test(out(r)), 'exit=' + r.status);
r = fire(Q1, null);
check('F10 no transcript path, SELECT -> allowed with reminder', r.status === 0 && /Read from stg1/.test(out(r)), 'exit=' + r.status);
r = fire(null, null, '');
check('F11 empty stdin -> exit 0', r.status === 0, 'exit=' + r.status);
r = fire(null, null, 'not json');
check('F12 malformed stdin -> exit 0', r.status === 0, 'exit=' + r.status);
r = WQ('UPDATE x SET a=1', [U('the stg10 schema')]);
check('F13 "stg10" does not unlock a write -> BLOCK', blocked(r), 'exit=' + r.status);
r = WQ('UPDATE x SET a=1', [U('use STG1 this time')]);
check('F14 miya names STG1 -> write allowed', r.status === 0, 'exit=' + r.status);
r = WQ('UPDATE x SET a=1', [U('prepare local test'), UM('<system-reminder>stg1</system-reminder>')]);
check('F14b meta reminder naming stg1 does not unlock a write -> BLOCK', blocked(r), 'exit=' + r.status);{ let reg = false;
  try { const s = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
    for (const g of (s.hooks.PreToolUse || [])) for (const h of g.hooks || []) if (/stg1-block/.test(h.command)) {
      const re = new RegExp('^(?:' + (g.matcher || '') + ')$');
      if (re.test(Q1) && re.test('mcp__postgres-mlkstg-pg__query_database') && !re.test('mcp__postgres-mlkprod-pg__query_database')) reg = true; } } catch (_) {}
  check('F15 registered in settings.json PreToolUse on BOTH staging DB tools (not prod)', reg, 'not registered on both'); }

// v2 — the staging switch decides which schema is guarded
const Q2 = 'mcp__postgres-mlkstg-pg__query_database';
setSwitch('stg1');
r = fire(Q1, [U('look at the data')]);
check('F16 switch = stg1: stg1 read is silent (schema is ON)', r.status === 0 && !out(r).trim(), 'exit=' + r.status + ' ' + out(r));
r = WQ('UPDATE x SET a=1', [U('look at the data')]);
check('F17 switch = stg1: stg1 write not guarded by this hook', r.status === 0, 'exit=' + r.status);
r = fire(Q2, [U('look at the data')]);
check('F18 switch = stg1: stg2 read allowed with the reminder naming stg2 OFF', r.status === 0 && /stg2 is switched OFF/.test(out(r)) && /Read from stg2/.test(out(r)) && /use stg1/.test(out(r)), out(r));
{ const tp = path.join(TMP, 'q2w.jsonl'); fs.writeFileSync(tp, JSON.stringify(U('look at the data')) + '\n');
  r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: Q2, tool_input: { query: 'DELETE FROM x' }, transcript_path: tp }), encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT, STG_BLOCK_STATE: STATE } }); }
check('F19 switch = stg1: stg2 write refused, reason names the switch', blocked(r) && /staging switch = stg1/.test(r.stderr || ''), 'exit=' + r.status + ' ' + out(r));
fs.writeFileSync(STATE, 'not json');
r = fire(Q1, [U('look at the data')]);
check('F20 unreadable switch file -> falls back to the old rule (stg1 guarded)', r.status === 0 && /stg1 is switched OFF/.test(out(r)), out(r));
setSwitch('stg9');
r = fire(Q2, [U('look at the data')]);
check('F21 unknown switch value -> stg2 treated ON (silent), never both guarded', r.status === 0 && !out(r).trim(), out(r));
setSwitch('stg2');

r = fire(Q1, [U('read stg1 for the 5 permohonan'), { type: 'user', isMeta: true, message: { role: 'user', content: 'Base directory for this skill: x' } }, U('Base directory for this skill: y')]);
check('F22 his word naming stg1, then an injected skill line as last user line -> still read', r.status === 0 && /miya named stg1/.test(out(r)), out(r));
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\nstg1-block.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);

