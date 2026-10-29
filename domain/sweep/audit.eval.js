#!/usr/bin/env node
// domain/sweep/audit.eval.js — fixture eval for audit.js. Builds a fake main folder + fake familiar
// transcripts in a temp dir (SWEEP_MAIN), runs the real CLI, and asserts exit codes + ledger rows.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const AUDIT = path.join(__dirname, 'audit.js');
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-audit-eval-'));
const MAIN = path.join(T, 'main');
const SUB = path.join(T, 'subagents');
const SCRATCH = path.join(T, 'scratch');
for (const d of [path.join(MAIN, 'system', 'telemetry'), path.join(MAIN, 'domain', 'sweep'), SUB, SCRATCH]) fs.mkdirSync(d, { recursive: true });
const LEDGER = path.join(MAIN, 'domain', 'sweep', 'log.jsonl');
const SINCE = '2026-10-29T03:00:00.000Z';
const at = min => new Date(Date.parse(SINCE) + min * 60000).toISOString();

let n = 0;
function fam(desc, { model = 'claude-sonnet-5-5', start = 1, tools = [], text = 'T | W | verdict | 85%', errors = 0, garbage = false, meta = true, cacheRead = 500 } = {}) {
  const id = 'f' + (++n);
  const L = [];
  L.push({ type: 'user', timestamp: at(start), message: { content: 'go' } });
  tools.forEach((t, i) => L.push({ type: 'assistant', requestId: id + 'r' + i, timestamp: at(start + 1), message: { usage: { input_tokens: 10, cache_creation_input_tokens: 100, cache_read_input_tokens: cacheRead, output_tokens: 5 }, content: [{ type: 'tool_use', name: t.name, input: t.input || {} }] } }));
  for (let e = 0; e < errors; e++) L.push({ type: 'user', timestamp: at(start + 1), message: { content: [{ type: 'tool_result', is_error: true, content: 'x' }] } });
  L.push({ type: 'assistant', requestId: id + 'end', timestamp: at(start + 5), message: { usage: { input_tokens: 10, cache_creation_input_tokens: 100, cache_read_input_tokens: cacheRead, output_tokens: 5 }, content: [{ type: 'text', text }] } });
  fs.writeFileSync(path.join(SUB, `agent-${id}.jsonl`), L.map(x => JSON.stringify(x)).join('\n') + (garbage ? '\n{not json\n' : '\n'));
  if (meta) fs.writeFileSync(path.join(SUB, `agent-${id}.meta.json`), JSON.stringify({ description: desc, model, effort: 'high' }));
}
function bank(t, files) { const d = path.join(MAIN, 'projects', 'coding-projects', 'active', `QA-${t}`); fs.mkdirSync(d, { recursive: true }); files.forEach(f => fs.writeFileSync(path.join(d, f), 'x')); }
function run(args, extra = {}) {
  const r = spawnSync(process.execPath, [AUDIT, ...args], { env: { ...process.env, SWEEP_MAIN: MAIN }, encoding: 'utf8', windowsHide: true, ...extra });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
function lastRow(type) { const rows = fs.readFileSync(LEDGER, 'utf8').trim().split('\n').map(l => JSON.parse(l)); return rows.filter(r => (type ? r.type === type : r.type !== 'self-audit')).pop(); }
const results = [];
const check = (name, ok, d) => results.push({ name, ok: !!ok, d: d || '' });

// ---- fixtures: ticket 111111 clean, 222222 dirty
fam('W1+W2 quest 111111 clean', { tools: [{ name: 'Bash', input: { command: 'git show origin/mlk/master:etanah-pelupusan/A.java' } }] });
fam('W3 blind 111111 clean', { tools: [{ name: 'Read', input: { file_path: 'C:/x/QA-111111-wave3.md' } }, { name: 'Write', input: { file_path: path.join(SCRATCH, 'QA-111111-wave3.md') } }] });
fam('W4 audit 111111 clean', { model: 'claude-opus-5-5' });
fam('W3 blind 222222 dirty', { tools: [{ name: 'Read', input: { file_path: 'C:/p/QA-222222.md' } }, { name: 'Read', input: { file_path: 'E:/Projects/Melaka/etanah-awam/src/X.java' } }] });
fam('W1+W2 quest 222222 dirty', { tools: [{ name: 'Write', input: { file_path: 'C:/Users/R/1. Tasks/Melaka/9. x/note.txt' } }, { name: 'Agent', input: {} }, { name: 'Bash', input: { command: 'sleep 99', run_in_background: true } }], text: 'no pipes here' });
fam('W4 audit 222222 dirty', { model: 'claude-fable-5-1', garbage: true, tools: [{ name: 'PowerShell', input: { command: 'Copy-Item a.md "C:\\1. Tasks\\Melaka\\x\\a.md"' } }] });
fam('W1+W2 quest 333333 other ticket', {});
fam('W1+W2 quest 111111 before since', { start: -120 });
fam('no meta file 111111', { meta: false });
fs.writeFileSync(path.join(SUB, 'agent-broken.jsonl'), '{{{\n');
bank('111111', ['QA-111111.md', 'QA-111111-wave3.md', 'QA-111111-audit.md']);
bank('222222', ['QA-222222.md']);
const hook = path.join(MAIN, 'system', 'telemetry', 'hook-fires.jsonl');
fs.writeFileSync(hook, [
  { ts: at(2), hook: 'show-gate', mode: 'orch-suppressed' }, { ts: at(3), hook: 'predicate-box', mode: 'orch-suppressed' },
  { ts: at(-30), hook: 'show-gate', mode: 'orch-suppressed' }, { ts: at(600), hook: 'show-gate', mode: 'orch-suppressed' },
  { ts: at(2), hook: 'other', mode: 'normal' }].map(x => JSON.stringify(x)).join('\n') + '\n');
fs.writeFileSync(LEDGER, [
  { run_id: 'old-1', defects: ['worktree-isolation hooks redirected 14/18 outputs'] },
  { run_id: 'old-2', defects: ['write guards refused 6 of 6'] },
  { run_id: 'old-2', defects: ['duplicate row of the same run'] }].map(x => JSON.stringify(x)).join('\n') + '\n');

// ---- 1. clean run: exit 0, no defects for 111111
let r = run(['run', '--tickets', '111111', '--since', SINCE, '--subagents', SUB, '--write', '--run-id', 'clean']);
let row = lastRow();
check('clean run exits 0', r.code === 0, r.out);
check('clean run: 3 familiars counted (before-since, other ticket, no-meta excluded)', row.agents === 3, 'agents=' + row.agents);
check('clean run: no defect classes', row.defect_classes.length === 0, JSON.stringify(row.defect_classes));
check('own wave3 file is not a blind break', !row.defect_classes.includes('blind-break'));
check('git show origin/mlk/master pins the baseline', !row.defect_classes.includes('baseline-not-pinned'));
check('orch rows inside the window counted, outside excluded', row.orch_suppressed === 2, 'count=' + row.orch_suppressed);
check('cache re-reads counted apart from new spend', row.subagent_tokens === 3 * 230 && row.cache_read_tokens === 3 * 1000, `${row.subagent_tokens}/${row.cache_read_tokens}`);
check('self-audit PASS row written', lastRow('self-audit').outcome === 'PASS' && lastRow('self-audit').run_id === 'clean');

// ---- 2. dirty run
r = run(['run', '--tickets', '222222', '--since', SINCE, '--subagents', SUB, '--write', '--run-id', 'dirty', '--scratch', SCRATCH]);
row = lastRow();
const has = c => row.defect_classes.includes(c);
check('dirty run exits 1', r.code === 1, r.out);
check('W3 reading QA-<n>.md = blind-break', has('blind-break'));
check('Write into a Task folder = task-folder-write', has('task-folder-write'));
check('shell Copy-Item into a Task folder caught', row.defects.some(d => /task-folder-write: .*shell/.test(d)));
check('write outside scratch flagged', has('write-outside-scratch'));
check('Agent launch = spawned-agent', has('spawned-agent'));
check('no pipe answer line = no-return-table', has('no-return-table'));
check('local etanah read without origin = baseline-not-pinned', has('baseline-not-pinned'));
check('run_in_background = background-job', has('background-job'));
check('fable familiar flagged', has('fable-familiar'));
check('garbage transcript lines do not crash', r.out.includes('SWEEP AUDIT'));
check('missing wave files = not-banked (wave3 + audit)', row.defects.filter(d => d.startsWith('not-banked')).length === 2, row.defects.join(' ; '));
check('every defect class has a refinement line', row.defect_classes.every(c => row.refinements.find(x => x.class === c)));
const w = row.refinements.find(x => x.class === 'write-outside-scratch');
check('legacy history counted once per run: seen in 2 earlier runs + this = REFINE NOW', w && w.runs_seen === 3 && /^REFINE NOW/.test(w.refine), JSON.stringify(w));
check('every refinement states its accuracy effect', row.refinements.every(x => x.accuracy && x.accuracy !== 'unknown'));

// ---- 3. flag
r = run(['flag', 'on', '--hours', '99']);
const flag = path.join(MAIN, 'system', 'orchestration-mode.flag');
const exp = fs.existsSync(flag) ? +fs.readFileSync(flag, 'utf8').trim() : 0;
check('flag on writes in the main folder', fs.existsSync(flag), r.out);
check('flag TTL capped at 8 hours', exp > Date.now() && exp <= Date.now() + 8 * 3600 * 1000 + 5000);
r = run(['run', '--tickets', '111111', '--since', SINCE, '--subagents', SUB]);
check('flag still present at close = flag-left, exit 1', r.code === 1 && /flag-left/.test(r.out), r.out);
r = run(['flag', 'off']);
check('flag off removes it', r.code === 0 && !fs.existsSync(flag));
check('dry run (no --write) adds no ledger row', lastRow().run_id === 'dirty');

// ---- 4. zero suppression rows = flag-never-on (warn only)
r = run(['run', '--tickets', '111111', '--since', SINCE, '--subagents', SUB, '--until', at(1)]);
check('no orch rows in window = flag-never-on, warn exits 0', r.code === 0 && /flag-never-on/.test(r.out), r.out);

// ---- 5. self-audit FAIL on a broken last row
fs.appendFileSync(LEDGER, JSON.stringify({ run_id: 'broken', ts: 'x' }) + '\n');
r = run(['audit']);
check('self-audit FAILs on a row missing keys', r.code === 1 && /missing keys/.test(r.out), r.out);

// ---- 6. usage errors
check('no tickets = exit 2', run(['run', '--since', SINCE, '--subagents', SUB]).code === 2);
check('bad --since = exit 2', run(['run', '--tickets', '1', '--since', 'yesterday', '--subagents', SUB]).code === 2);
check('missing subagents dir = exit 2', run(['run', '--tickets', '1', '--since', SINCE, '--subagents', path.join(T, 'nope')]).code === 2);
check('unknown command = exit 2', run(['frobnicate']).code === 2);

let failed = 0;
for (const x of results) { if (!x.ok) failed++; console.log((x.ok ? 'PASS' : 'FAIL') + '  ' + x.name + (x.ok ? '' : '  -> ' + x.d)); }
console.log(`\nsweep audit eval: ${results.length - failed}/${results.length} green`);
fs.rmSync(T, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
