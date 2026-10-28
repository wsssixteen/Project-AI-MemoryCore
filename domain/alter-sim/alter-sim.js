#!/usr/bin/env node
// alter-sim.js — runner for the Flowable alter rollback preview (E:\Dev\scripts\AlterSim\as.ps1).
// Adds: the env allow-list (PROD refused before anything starts), an ALTER-SIM summary line, a log row per run,
// a read-back of the tool's own JSON (self-audit), and compare: preview rows vs the real AFTER rows.
//
//   node domain/alter-sim/alter-sim.js preview --env stg1 --from-log <alter.js dry-run log .json>
//   node domain/alter-sim/alter-sim.js preview --env stg1 --id <ID> --target <KOD> [--task <id>] [--var k=v ...] [--read-only]
//   node domain/alter-sim/alter-sim.js compare <out>\alter-sim.json
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TOOL_HOME = process.env.ALTER_SIM_HOME || 'E:\\Dev\\scripts\\AlterSim';
const ALTER_HOME = process.env.FLOWABLE_ALTER_HOME || 'E:\\Dev\\scripts\\FlowableAlter';
// One log for every session: a worktree copy of this file still writes into the main checkout's domain/alter-sim/.
const WORKTREE = path.sep + '.claude' + path.sep + 'worktrees' + path.sep;
const MAIN_HOME = __dirname.includes(WORKTREE) ? path.join(__dirname.split(WORKTREE)[0], 'domain', 'alter-sim') : __dirname;
const LOG = process.env.ALTER_SIM_LOG || path.join(MAIN_HOME, 'log.jsonl');
const ENVS = ['stg1', 'stg2', 'mlit'];
// where the real AFTER rows are read (alter.js liveState): the db-gateway MCP name + main schema of each env
const LIVE = {
  stg1: { mcp: 'postgres-mlkstg1-pg', schema: 'et_main_stg1' },
  stg2: { mcp: 'postgres-mlkstg-pg', schema: 'et_main_stg2' },
  mlit: { mcp: 'postgres-mlit-pg', schema: 'et_main_mlit' },
};
const EXIT = { 0: 'PREVIEW OK', 1: 'FAILED', 2: 'BAD ARGUMENTS', 3: 'REFUSED', 4: 'NOT FOUND', 5: 'BLOCKED (calls outside the JVM)', 6: 'NOT RELIABLE (inner rollback)', 7: 'ROLLBACK NOT PROVEN' };
const FIELDS = ['kod', 'pengguna', 'peranan_semasa', 'status_tugasan', 'task_def_key_', 'name_'];

function die(code, msg) { process.stderr.write('alter-sim: ' + msg + '\n'); process.exit(code); }

function parseArgs(argv) {
  const opt = { vars: [], flags: new Set(), rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { if (!opt.mode) opt.mode = a; else opt.rest.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      if (key === 'var') opt.vars.push(next); else opt[key] = next;
      i++;
    } else opt.flags.add(key);
  }
  return opt;
}

function logRow(row) {
  try { fs.appendFileSync(LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString() }, row)) + '\n'); } catch (_) { /* a log failure never fails the run */ }
}

function checkPreviewArgs(opt) {
  if (!opt.env) return 'give --env stg1|stg2|mlit';
  if (!ENVS.includes(opt.env)) return 'REFUSED: --env ' + opt.env + ' is not a test target (stg1, stg2, mlit). PROD is never previewed.';
  if (opt['from-log']) {
    if (!fs.existsSync(opt['from-log'])) return '--from-log file not found: ' + opt['from-log'];
    if (opt.id || opt.target || opt.vars.length) return '--from-log carries the ID, target and variables; do not also pass --id/--target/--var';
    return null;
  }
  if (!opt.id || !/^PT[A-Z]{3}\/\d{2}\/[A-Z]\/[A-Z0-9]+\/\d{4}\/\d+$/.test(opt.id)) return 'give --id <ID Permohonan, e.g. PTMLK/02/L/PSBS/2026/1> or --from-log';
  if (!opt.target || /[;"'`]/.test(opt.target)) return 'give --target <KOD | activity id | page label>';
  if (opt.task && !/^\d+$/.test(opt.task)) return '--task is a numeric engine task id';
  for (const v of opt.vars) if (!/^[A-Za-z_][A-Za-z0-9_]*=/.test(v)) return '--var needs name=value, got ' + v;
  return null;
}

// the summary line: one per run, read by the eval and by the reply
function summarise(text, code) {
  const result = [];
  const re = /^\s+umm_a_tgsn (\S+) (.*?)  ->  act_ru_task (\S+) "(.*)"$/gm;
  let m;
  while ((m = re.exec(text))) result.push(m[1] + ' -> ' + m[3]);
  const proven = /ROLLBACK PROVEN/.test(text);
  return 'ALTER-SIM: ' + (EXIT[code] || 'EXIT ' + code) + ' · result ' + (result.length ? result.join(', ') : 'no new live row') + ' · rollback ' + (proven ? 'proven' : 'NOT proven');
}

// self-audit (system-design Rule 16): read the tool's own JSON back and check it against the goal
function audit(jsonPath, code) {
  if (code === 2 || code === 3 || code === 4) return { ok: true, why: 'stopped before the call (exit ' + code + ')' };
  if (!fs.existsSync(jsonPath)) return { ok: false, why: 'no alter-sim.json written' };
  let j;
  try { j = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch (e) { return { ok: false, why: 'alter-sim.json unreadable: ' + e.message }; }
  if (j.rollbackProven !== true) return { ok: false, why: 'rollback not proven' };
  if (code === 0 && !(j.result || []).length) return { ok: false, why: 'exit 0 but no new live umm_a_tgsn row in the preview' };
  if (code === 0 && (j.result || []).some(r => r.engine_task_found !== 'true')) return { ok: false, why: 'a preview row points at no engine task' };
  return { ok: true, why: 'rollback proven' + (code === 0 ? ', ' + j.result.length + ' result row(s)' : '') };
}

function preview(opt) {
  const bad = checkPreviewArgs(opt);
  if (bad) die(bad.startsWith('REFUSED') ? 3 : 2, bad);
  const out = opt.out || path.join(TOOL_HOME, 'out', new Date().toISOString().replace(/[:.]/g, '-'));
  const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(TOOL_HOME, 'as.ps1'), '-Env', opt.env, '-Out', out];
  if (opt['from-log']) args.push('-FromLog', opt['from-log']);
  if (opt.id) args.push('-Id', opt.id, '-Target', opt.target);
  if (opt.task) args.push('-Task', opt.task);
  for (const v of opt.vars) args.push('-Var', v);
  if (opt.flags.has('read-only')) args.push('-ReadOnly');
  if (opt.flags.has('dry-run')) { console.log('powershell ' + args.join(' ')); return 0; }
  const started = Date.now();
  // ALTER_SIM_PS=<stub.js> lets the eval stand in for PowerShell + Java
  const stub = process.env.ALTER_SIM_PS && /\.js$/.test(process.env.ALTER_SIM_PS);
  const r = stub ? spawnSync(process.execPath, [process.env.ALTER_SIM_PS].concat(args), { encoding: 'utf8', windowsHide: true })
    : spawnSync('powershell', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  const text = (r.stdout || '') + (r.stderr || '');
  const code = r.status === null ? 1 : r.status;
  process.stdout.write(text.split('\n').filter(l => !/^\s+at |^\s+\.\.\. \d+ more/.test(l)).join('\n'));
  const line = summarise(text, code);
  const a = audit(path.join(out, 'alter-sim.json'), code);
  console.log('\n' + line + ' · self-audit ' + (a.ok ? 'PASS' : 'FAIL') + ' (' + a.why + ')');
  logRow({ via: 'alter-sim.js', mode: 'preview', env: opt.env, id: opt.id || null, from_log: opt['from-log'] || null, target: opt.target || null, read_only: opt.flags.has('read-only'), exit: code, summary: line, goal_met: code === 0 && a.ok, self_audit: a.ok ? 'PASS' : 'FAIL', dur_ms: Date.now() - started, out });
  return a.ok ? code : (code === 0 ? 1 : code);
}

// compare: the preview's new live rows vs the real AFTER rows read now (alter.js liveState, SELECT only)
async function compare(file, opt) {
  if (!file || !fs.existsSync(file)) die(2, 'compare needs the preview alter-sim.json');
  const p = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!ENVS.includes(p.env)) die(3, 'REFUSED: preview env ' + p.env + ' is not a test target');
  const alter = require(path.join(ALTER_HOME, 'alter.js'));
  const target = Object.assign({}, LIVE[p.env]);
  const st = await alter.liveState(target, p.id);
  const real = st.tgsn.map(r => {
    const t = st.tasks.find(x => x.id_ === r.id_bpm_task) || {};
    return { kod: r.kod, pengguna: r.pengguna, peranan_semasa: r.peranan_semasa, status_tugasan: r.status_tugasan, task_def_key_: t.task_def_key_ || null, name_: t.name_ || null };
  });
  const rows = [];
  let ok = (p.result || []).length > 0 && real.length > 0;
  for (const want of p.result || []) {
    const got = real.find(r => r.kod === want.kod) || {};
    const cells = FIELDS.map(f => ({ f, preview: want[f], real: got[f] === undefined ? null : got[f], same: String(want[f]) === String(got[f]) }));
    if (cells.some(c => !c.same)) ok = false;
    rows.push(cells);
  }
  if (real.length !== (p.result || []).length) ok = false;
  console.log('\n' + p.id + ' (' + p.env + '): preview ' + (p.result || []).length + ' new live row(s), real ' + real.length + ' live row(s)');
  console.log('| field | preview | real AFTER | same |\n|---|---|---|---|');
  rows.forEach(cells => cells.forEach(c => console.log('| ' + c.f + ' | ' + c.preview + ' | ' + c.real + ' | ' + (c.same ? 'yes' : 'NO') + ' |')));
  real.filter(r => !(p.result || []).some(w => w.kod === r.kod)).forEach(r => console.log('| (real only) ' + r.kod + ' | - | ' + FIELDS.map(f => r[f]).join(' / ') + ' | NO |'));
  const line = 'ALTER-SIM COMPARE: ' + (ok ? 'MATCH' : 'MISMATCH') + ' · ' + p.id + ' ' + p.env;
  console.log('\n' + line);
  logRow({ via: 'alter-sim.js', mode: 'compare', env: p.env, id: p.id, exit: ok ? 0 : 1, summary: line, goal_met: ok, self_audit: 'PASS', preview: p.result, real });
  return ok ? 0 : 1;
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.mode === 'preview') process.exit(preview(opt));
  if (opt.mode === 'compare') process.exit(await compare(opt.rest[0], opt));
  die(2, 'usage: alter-sim.js preview --env stg1|stg2|mlit (--from-log <dry-run log> | --id <ID> --target <KOD>) | compare <alter-sim.json>');
}

if (require.main === module) main().catch(e => die(1, e.stack || String(e)));
module.exports = { parseArgs, checkPreviewArgs, summarise, audit, ENVS, LIVE };
