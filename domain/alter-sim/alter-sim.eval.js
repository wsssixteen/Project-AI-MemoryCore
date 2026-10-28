#!/usr/bin/env node
// alter-sim.eval.js — pins the runner, the PROD refusal at all three layers, the self-audit and compare.
// Uses stubs for PowerShell/Java and for alter.js; one real spawn of as.ps1 (refusal only, no boot).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HERE = __dirname;
const RUNNER = path.join(HERE, 'alter-sim.js');
const TOOL = process.env.ALTER_SIM_HOME || 'E:\\Dev\\scripts\\AlterSim';
const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'alter-sim-eval-'));
const LOG = path.join(sb, 'log.jsonl');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function run(args, env) {
  return spawnSync(process.execPath, [RUNNER].concat(args), { encoding: 'utf8', env: Object.assign({}, process.env, { ALTER_SIM_LOG: LOG }, env || {}) });
}
const out = r => (r.stdout || '') + (r.stderr || '');
const ID = 'PTMLK/02/L/PSBS/2026/1';

// stub tool: prints what as.ps1 + Java print, writes alter-sim.json into -Out, exits with STUB_EXIT
const stub = path.join(sb, 'stub.js');
fs.writeFileSync(stub, `
const fs = require('fs'), path = require('path');
const a = process.argv.slice(2); const outDir = a[a.indexOf('-Out') + 1];
fs.mkdirSync(outDir, { recursive: true });
const mode = process.env.STUB_MODE || 'ok';
const result = mode === 'empty' ? [] : [{ kod: 'KKMMKN', pengguna: 'a@melaka.gov.my', peranan_semasa: 'KPT', status_tugasan: 'Dalam Tindakan', task_def_key_: 'sid-X', name_: '26.0 Keputusan', engine_task_found: 'true' }];
fs.writeFileSync(path.join(outDir, 'alter-sim.json'), JSON.stringify({ env: 'stg1', id: '${ID}', result, rollbackProven: mode !== 'norollback' }));
if (mode !== 'empty') console.log('   umm_a_tgsn KKMMKN Dalam Tindakan KPT a@melaka.gov.my  ->  act_ru_task sid-X "26.0 Keputusan"');
console.log(mode === 'norollback' ? 'ROLLBACK NOT PROVEN: x' : 'ROLLBACK PROVEN: a fresh connection reads the same rows as BEFORE.');
process.exit(Number(process.env.STUB_EXIT || 0));
`);

// F1-F9 argument guards
let r = run([]);
check('F1 no arguments → exit 2 + usage', r.status === 2 && /usage/.test(out(r)), out(r).slice(0, 120));
r = run(['preview', '--env', 'prod', '--id', ID, '--target', 'KKMMKN']);
check('F2 --env prod → REFUSED exit 3, nothing spawned', r.status === 3 && /REFUSED/.test(out(r)) && /PROD is never previewed/.test(out(r)), out(r).slice(0, 160));
r = run(['preview', '--id', ID, '--target', 'KKMMKN']);
check('F3 no --env → exit 2', r.status === 2 && /--env/.test(out(r)), out(r).slice(0, 120));
r = run(['preview', '--env', 'stg1', '--id', "x'; drop table umm_a_tgsn;--", '--target', 'KKMMKN']);
check('F4 hostile --id → exit 2', r.status === 2, out(r).slice(0, 120));
r = run(['preview', '--env', 'stg1', '--id', ID, '--target', 'KKMMKN"; rm']);
check('F5 hostile --target → exit 2', r.status === 2, out(r).slice(0, 120));
const fakeLog = path.join(sb, 'dry.json'); fs.writeFileSync(fakeLog, '{}');
r = run(['preview', '--env', 'stg1', '--from-log', fakeLog, '--id', ID]);
check('F6 --from-log plus --id → exit 2', r.status === 2 && /do not also pass/.test(out(r)), out(r).slice(0, 120));
r = run(['preview', '--env', 'stg1', '--from-log', path.join(sb, 'nope.json')]);
check('F7 --from-log missing file → exit 2', r.status === 2 && /not found/.test(out(r)), out(r).slice(0, 120));
r = run(['preview', '--env', 'stg1', '--id', ID, '--target', 'KKMMKN', '--var', 'bad var']);
check('F8 malformed --var → exit 2', r.status === 2 && /--var/.test(out(r)), out(r).slice(0, 120));
r = run(['preview', '--env', 'mlit', '--id', ID, '--target', 'KKMMKN', '--read-only', '--dry-run']);
check('F9 --dry-run prints the as.ps1 command with -Env mlit -ReadOnly', r.status === 0 && /as\.ps1 -Env mlit/.test(out(r)) && /-ReadOnly/.test(out(r)), out(r).slice(0, 200));

// F10-F14 full preview through the stub
const o1 = path.join(sb, 'o1');
r = run(['preview', '--env', 'stg1', '--id', ID, '--target', 'KKMMKN', '--out', o1], { ALTER_SIM_PS: stub });
check('F10 stub preview → ALTER-SIM: PREVIEW OK + result + rollback proven + self-audit PASS', r.status === 0 && /ALTER-SIM: PREVIEW OK · result KKMMKN -> sid-X · rollback proven · self-audit PASS/.test(out(r)), out(r).slice(-220));
const rows = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
const last = rows[rows.length - 1] || {};
check('F11 log row carries ts, env, exit, goal_met, self_audit, dur_ms', last.ts && last.env === 'stg1' && last.exit === 0 && last.goal_met === true && last.self_audit === 'PASS' && typeof last.dur_ms === 'number', JSON.stringify(last).slice(0, 200));
r = run(['preview', '--env', 'stg1', '--id', ID, '--target', 'KKMMKN', '--out', path.join(sb, 'o2')], { ALTER_SIM_PS: stub, STUB_MODE: 'empty' });
check('F12 exit 0 with no new row → self-audit FAIL, exit non-zero', r.status !== 0 && /self-audit FAIL/.test(out(r)), out(r).slice(-200));
r = run(['preview', '--env', 'stg1', '--id', ID, '--target', 'KKMMKN', '--out', path.join(sb, 'o3')], { ALTER_SIM_PS: stub, STUB_MODE: 'norollback', STUB_EXIT: '7' });
check('F13 rollback not proven → exit 7, summary says NOT proven, self-audit FAIL', r.status === 7 && /ROLLBACK NOT PROVEN/.test(out(r)) && /rollback NOT proven/.test(out(r)) && /self-audit FAIL/.test(out(r)), out(r).slice(-200));
r = run(['preview', '--env', 'stg1', '--id', ID, '--target', 'KKMMKN', '--out', path.join(sb, 'o4')], { ALTER_SIM_PS: stub, STUB_EXIT: '5' });
check('F14 a blocked outside call → exit 5, BLOCKED in the line', r.status === 5 && /ALTER-SIM: BLOCKED/.test(out(r)), out(r).slice(-200));

// F15-F17 compare against a stub alter.js
const altHome = path.join(sb, 'alter'); fs.mkdirSync(altHome);
fs.writeFileSync(path.join(altHome, 'alter.js'), `
module.exports.liveState = async () => {
  const mode = process.env.LIVE_MODE || 'same';
  const tgsn = [{ kod: 'KKMMKN', pengguna: mode === 'holder' ? 'b@melaka.gov.my' : 'a@melaka.gov.my', peranan_semasa: 'KPT', status_tugasan: 'Dalam Tindakan', id_bpm_task: '9' }];
  if (mode === 'extra') tgsn.push({ kod: 'PSTP', pengguna: 'c', peranan_semasa: 'PPD', status_tugasan: 'Dalam Tindakan', id_bpm_task: '10' });
  return { tgsn, tasks: [{ id_: '9', task_def_key_: 'sid-X', name_: '26.0 Keputusan' }, { id_: '10', task_def_key_: 'sid-Y', name_: 'x' }] };
};`);
const pj = path.join(o1, 'alter-sim.json');
r = run(['compare', pj], { FLOWABLE_ALTER_HOME: altHome });
check('F15 compare, same rows → MATCH exit 0', r.status === 0 && /ALTER-SIM COMPARE: MATCH/.test(out(r)), out(r).slice(-200));
r = run(['compare', pj], { FLOWABLE_ALTER_HOME: altHome, LIVE_MODE: 'holder' });
check('F16 compare, holder differs → MISMATCH exit 1, the field shown with NO', r.status === 1 && /\| pengguna \| a@melaka\.gov\.my \| b@melaka\.gov\.my \| NO \|/.test(out(r)) && /MISMATCH/.test(out(r)), out(r).slice(-300));
r = run(['compare', pj], { FLOWABLE_ALTER_HOME: altHome, LIVE_MODE: 'extra' });
check('F17 compare, real has a row the preview lacks → MISMATCH, real-only row listed', r.status === 1 && /\(real only\) PSTP/.test(out(r)), out(r).slice(-300));
const bad = path.join(sb, 'prodprev.json'); fs.writeFileSync(bad, JSON.stringify({ env: 'prod', id: ID, result: [] }));
r = run(['compare', bad], { FLOWABLE_ALTER_HOME: altHome });
check('F18 compare of a prod preview file → REFUSED exit 3', r.status === 3 && /REFUSED/.test(out(r)), out(r).slice(0, 160));

// F19-F21 the other two refusal layers + the never-commit code
if (fs.existsSync(path.join(TOOL, 'as.ps1'))) {
  r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(TOOL, 'as.ps1'), '-Env', 'prod', '-Id', ID, '-Target', 'X'], { encoding: 'utf8', windowsHide: true });
  check('F19 as.ps1 -Env prod → REFUSED exit 3 before any build or boot', r.status === 3 && /REFUSED/.test(out(r)), out(r).slice(0, 160));
  const guard = fs.readFileSync(path.join(TOOL, 'src', 'altersim', 'Guard.java'), 'utf8');
  const envs = [...guard.matchAll(/TARGETS\.put\("([a-z0-9]+)"/g)].map(m => m[1]);
  check('F20 Guard.java allow-list = stg1, stg2, mlit only; refusal names PROD', envs.join(',') === 'stg1,stg2,mlit' && /PROD is never previewed/.test(guard), envs.join(','));
  const swallow = fs.readFileSync(path.join(TOOL, 'src', 'altersim', 'SwallowDataSource.java'), 'utf8');
  check('F21 SwallowDataSource: commit ignored, autocommit off, server idle-in-transaction limit', /case "commit":\s*commits\+\+;\s*return null;/.test(swallow) && /setAutoCommit\(false\)/.test(swallow) && /idle_in_transaction_session_timeout/.test(swallow), '');
} else {
  check('F19-F21 tool folder present', false, TOOL + ' missing');
}

// F22-F23 README keys + NUKE-MARKER
const readme = fs.readFileSync(path.join(HERE, 'README.md'), 'utf8');
check('F22 README carries symptom, goal, goal_signal, retention, footprint, self_audit, diagram, state-scoped', ['symptom', 'goal', 'goal_signal', 'retention', 'footprint', 'self_audit', 'diagram', 'state-scoped'].every(k => new RegExp('^' + k + ':\\s*\\S', 'm').test(readme)), '');
const nuke = path.join(HERE, 'NUKE-MARKER.md');
check('F23 NUKE-MARKER present with a rollback recipe', fs.existsSync(nuke) && /\| Rollback \|/.test(fs.readFileSync(nuke, 'utf8')), '');

let pass = 0;
for (const x of results) { console.log((x.pass ? 'PASS  ' : 'FAIL  ') + x.n + (x.pass ? '' : '   -> ' + x.d)); if (x.pass) pass++; }
console.log('\nalter-sim.eval: ' + pass + '/' + results.length + (pass === results.length ? ' green' : ' RED'));
fs.rmSync(sb, { recursive: true, force: true });
process.exit(pass === results.length ? 0 : 1);
