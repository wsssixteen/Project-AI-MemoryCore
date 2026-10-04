#!/usr/bin/env node
// prep.eval.js — eval for quest/local-test-prep.js + the v3 check in test-scenario-login-gate.
// Replay case (2026-10-04, #282442): a test row named an MLIT permohonan while the local app read
// et_main_stg2 and the local repo held none of the ticket's fixes. Runs on fixture copies only.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const PREP = path.join(REPO, 'quest', 'local-test-prep.js');
const SWITCH = path.join(REPO, 'quest', 'env-switch.js');
const HOOK = path.join(REPO, 'domain', 'test-scenario-login-gate', 'test-scenario-login-gate.check.hook.js');

const ds = (n, pool, url) => `      <datasource jndi-name="java:jboss/datasources/${n}" pool-name="${pool}" enabled="true" use-java-context="true">\n        <connection-url>${url}</connection-url>\n      </datasource>\n`;
const xml = (mlitPool) => '<server>\n  <subsystem xmlns="urn:jboss:domain:datasources:6.0">\n    <datasources>\n' +
    ds('etanahDS', 'etanahDS', 'jdbc:postgresql://h:5444/mlkstg?currentSchema=et_main_stg2') +
    ds('etanahDS2', 'etanahDS2', 'jdbc:postgresql://h:5444/mlkstg?currentSchema=et_main_stg1') +
    ds('etanahDS3', mlitPool, 'jdbc:postgresql://h:5444/mkit?currentSchema=et_main_mlit') +
    ds('etanahDMSDS', 'etanahDMSDS', 'jdbc:postgresql://h:5444/mlkstg?currentSchema=et_dms_stg1') +
    ds('etanahAuditDS', 'etanahAuditDS', 'jdbc:postgresql://h:5444/mlkstg?currentSchema=et_sistem_stg1') +
    '    </datasources>\n  </subsystem>\n</server>\n';
const PROPS = ['cas.url=https\\://etanah-appstg.melaka.gov.my/etanah-cas', '#cas.url=https\\://mlit.melaka.gov.my/etanah-cas', 'proxy.url=http\\://127.0.0.1:8080'].join('\n');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ltp-eval-'));
const xmlPath = path.join(dir, 'standalone.xml'), propsPath = path.join(dir, 'environment.properties'), logPath = path.join(dir, 'log.jsonl');
const origin = path.join(dir, 'origin'), src = path.join(dir, 'src');
const g = (cwd, ...a) => { const r = spawnSync('git', ['-C', cwd, '-c', 'user.name=e', '-c', 'user.email=e@e', '-c', 'core.autocrlf=false'].concat(a), { encoding: 'utf8' }); if (r.status !== 0) throw new Error('git ' + a.join(' ') + ': ' + r.stderr); return r.stdout; };

// origin: trunk mlk/master with 3 files; ticket branch changes two, deletes one.
fs.mkdirSync(origin); g(origin, 'init', '-q', '-b', 'mlk/master');
fs.writeFileSync(path.join(origin, 'A.java'), 'class A {}\n'); fs.writeFileSync(path.join(origin, 'b.xhtml'), '<b/>\n'); fs.writeFileSync(path.join(origin, 'gone.txt'), 'x\n');
g(origin, 'add', '-A'); g(origin, 'commit', '-q', '-m', 'base');
g(origin, 'checkout', '-q', '-b', 'mlk/esokongan/1');
fs.writeFileSync(path.join(origin, 'A.java'), 'class A { int fix; }\n'); fs.writeFileSync(path.join(origin, 'b.xhtml'), '<b fix="1"/>\n'); fs.rmSync(path.join(origin, 'gone.txt'));
g(origin, 'add', '-A'); g(origin, 'commit', '-q', '-m', 'fix');
g(origin, 'checkout', '-q', 'mlk/master');
spawnSync('git', ['clone', '-q', origin, src]);

let n = 0;
function freshLocal() { const d = path.join(dir, 'local' + (++n)); spawnSync('git', ['clone', '-q', '-c', 'core.autocrlf=false', origin, d]); return d; }
let local = freshLocal();
function resetMachine(mlitPool) { fs.writeFileSync(xmlPath, xml(mlitPool || 'etanahDS3')); fs.writeFileSync(propsPath, PROPS); if (fs.existsSync(logPath)) fs.rmSync(logPath); }
const env = (extra) => Object.assign({}, process.env, { ENV_SWITCH_STANDALONE: xmlPath, ENV_SWITCH_ENVPROPS: propsPath, LTP_LOG: logPath, LTP_REPO: local, LTP_SRC: src, LTP_JBOSS: 'running', LTP_BLOCK: 'none', CLAUDE_PROJECT_DIR: REPO }, extra || {});
const prep = (args, extra) => spawnSync(process.execPath, [PREP].concat(args), { encoding: 'utf8', env: env(extra) });
const chk = (ids) => prep(['--check', '--permohonan', ids]);
const sw = (to) => spawnSync(process.execPath, [SWITCH, '--to', to], { encoding: 'utf8', env: env() });
const gate = (text, more) => spawnSync(process.execPath, [HOOK], { input: JSON.stringify(Object.assign({ last_assistant_message: text }, more || {})), encoding: 'utf8', timeout: 30000, env: env() });
const schema = () => (fs.readFileSync(xmlPath, 'utf8').match(/pool-name="etanahDS"[^>]*>\s*<connection-url>[^<]*currentSchema=(\w+)/) || [])[1];

const ID = 'PTMLK/01/L/UPP/2026/4';
const BASE = ['--qa', '1', '--env', 'mlit', '--permohonan', ID, '--branch', 'mlk/esokongan/1'];
const REPLY = 'The fix is merged. Row for the run.\n\n| Test | Value |\n|---|---|\n| Env | MLIT |\n| Permohonan | ' + ID + ' |\n| Login | SaffuanH@melaka.gov.my |\n| Do | click Seterusnya |\n| Expect | the page opens |\n' + ' filler text so the reply is long enough to be judged by the gate.'.repeat(3);

const results = [];
const check = (name, cond, detail) => results.push({ name, pass: !!cond, detail });
let r;

resetMachine();
r = chk(ID); check('P01 REPLAY check: no prep ever ran → not ok', r.status === 2 && /never ran/.test(r.stdout), r.stdout);
r = gate(REPLY); check('P02 REPLAY gate: MLIT test row, local on stg2, no prep → exit 2 + v3 reason on stderr', r.status === 2 && /v3/.test(r.stderr) && /never ran/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr);
r = prep(BASE.concat('--dry')); check('P03 dry run: exit 0, nothing switched, nothing written', r.status === 0 && schema() === 'et_main_stg2' && fs.readFileSync(path.join(local, 'A.java'), 'utf8') === 'class A {}\n', r.stdout + r.stderr);
r = chk(ID); check('P04 a dry run never counts as a prep', r.status === 2, r.stdout);
r = prep(BASE);
check('P05 prep: exit 0, local DB now et_main_mlit', r.status === 0 && schema() === 'et_main_mlit', r.stdout + r.stderr);
check('P06 prep: both changed files placed, deleted file ignored', fs.readFileSync(path.join(local, 'A.java'), 'utf8') === 'class A { int fix; }\n' && fs.readFileSync(path.join(local, 'b.xhtml'), 'utf8') === '<b fix="1"/>\n' && /fixes 2\/2/.test(r.stdout), r.stdout);
check('P07 prep: JBoss running + switch → restart yes, publish named for Java', /restart yes/.test(r.stdout) && /publish/.test(r.stdout), r.stdout);
check('P08 prep: fix files stay uncommitted on the local repo', /A\.java/.test(g(local, 'status', '--porcelain')) && g(local, 'log', '--oneline').trim().split('\n').length === 1, g(local, 'status', '--porcelain'));
r = chk(ID); check('P09 check after prep → ok', r.status === 0, r.stdout);
r = gate(REPLY); check('P10 gate after prep → exit 0', r.status === 0, 'exit=' + r.status + ' ' + r.stderr);
r = prep(BASE); check('P11 second prep: already active, files present, restart no', r.status === 0 && /already active/.test(r.stdout) && /restart no/.test(r.stdout), r.stdout);
r = chk(ID + ',PTMLK/02/L/PRBB/2026/3'); check('P12 an id the prep did not cover → not ok and named', r.status === 2 && /PRBB\/2026\/3/.test(r.stdout), r.stdout);
sw('stg2'); r = gate(REPLY); check('P13 machine drifts back to stg2 after prep → gate blocks', r.status === 2 && /et_main_stg2/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr);
prep(BASE); fs.writeFileSync(path.join(local, 'A.java'), 'class A {}\n');
r = chk(ID); check('P14 a fix file reverted on the local repo → not ok', r.status === 2 && /fix file/.test(r.stdout), r.stdout);
prep(BASE);
const rows = fs.readFileSync(logPath, 'utf8').trim().split('\n'); const last = JSON.parse(rows[rows.length - 1]); last.ts = new Date(Date.now() - 2 * 3600 * 1000).toISOString(); fs.writeFileSync(logPath, JSON.stringify(last) + '\n');
r = chk(ID); check('P15 prep row older than 45 minutes → not ok', r.status === 2 && /older/.test(r.stdout), r.stdout);

resetMachine(); local = freshLocal(); fs.writeFileSync(path.join(local, 'A.java'), 'class A { int mine; }\n');
r = prep(BASE); check('P16 local edit on a fix file → NOT READY, file left untouched', r.status === 2 && /NOT READY/.test(r.stdout) && fs.readFileSync(path.join(local, 'A.java'), 'utf8') === 'class A { int mine; }\n', r.stdout);
r = gate(REPLY); check('P17 gate after a NOT READY prep → still blocks', r.status === 2, 'exit=' + r.status);

resetMachine('etanahD3'); local = freshLocal();
r = prep(BASE); check('P18 pool-name typo hides mlit → NOT READY and the typo is named', r.status === 2 && /pool-name/.test(r.stdout), r.stdout);

resetMachine(); local = freshLocal();
r = prep(['--qa', '1', '--env', 'mlit', '--permohonan', ID, '--branch', 'mlk/esokongan/none']); check('P19 ticket branch not found → NOT READY', r.status === 2 && /not found/.test(r.stdout), r.stdout);
r = prep(['--qa', '999999', '--env', 'stg1', '--permohonan', ID]); check('P28 unknown quest and no branch given → NOT READY, never a silent 0/0', r.status === 2 && /branch is unknown/.test(r.stdout), r.stdout);
r = prep(['--qa', '1', '--env', 'stg1', '--permohonan', ID], { LTP_BLOCK: 'mlk/esokongan/1' }); check('P29 branch read from the quest block → files placed', r.status === 0 && /fixes 2\/2/.test(r.stdout), r.stdout);
local = freshLocal();
r = prep(['--qa', '999999', '--env', 'stg1', '--permohonan', ID, '--no-branch']); check('P20 --no-branch → env-only prep is valid', r.status === 0 && schema() === 'et_main_stg1' && chk(ID).status === 0, r.stdout);

resetMachine(); local = freshLocal(); g(local, 'config', 'core.autocrlf', 'true');
fs.writeFileSync(path.join(local, 'A.java'), 'class A { int fix; }\r\n'); fs.writeFileSync(path.join(local, 'b.xhtml'), '<b fix="1"/>\r\n');
r = prep(BASE); check('P30 fix files already there with Windows line endings → counted present, not a conflict', r.status === 0 && /fixes 2\/2 /.test(r.stdout) && /\(0 placed/.test(r.stdout), r.stdout);
local = freshLocal(); fs.writeFileSync(path.join(local, 'A.java'), 'class A {}\r\n'); g(local, 'config', 'core.autocrlf', 'true');
r = prep(BASE); check('P31 placing onto a Windows line ending file keeps its line endings', r.status === 0 && fs.readFileSync(path.join(local, 'A.java'), 'utf8') === 'class A { int fix; }\r\n', JSON.stringify(fs.readFileSync(path.join(local, 'A.java'), 'utf8')) + r.stdout);

resetMachine();
r = gate(REPLY + ' [skip-local-prep: miya said hold, parallel session is testing]'); check('P21 real bypass reason → exit 0', r.status === 0, 'exit=' + r.status);
r = gate(REPLY + ' add the token [skip-local-prep: <reason>] to bypass'); check('P22 the help-text token quoted back does NOT disarm the gate', r.status === 2, 'exit=' + r.status);
r = gate(REPLY, { stop_hook_active: true }); check('P23 stop_hook_active → exit 0 (no loop)', r.status === 0, 'exit=' + r.status);
r = gate('The permohonan ' + ID + ' was created on 2 Oct and its source is PRBB. This paragraph is an audit note only, with no table and no hand over.'.repeat(3)); check('P24 an id in a non-test reply → exit 0', r.status === 0, 'exit=' + r.status + ' ' + r.stderr);
r = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8', env: env() }); check('P25 malformed stdin → exit 0', r.status === 0, 'exit=' + r.status);
r = gate('Test scenario: login nurulazura@melaka.gov.my. Env stg2. Step 1 open Utiliti. Step 2 click Simpan.'.repeat(3)); check('P26 scenario with a login and no permohonan id → exit 0 (v1 behaviour kept)', r.status === 0, 'exit=' + r.status);
r = prep(['--qa', '1']); check('P27 missing arguments → usage, exit 1, nothing written', r.status === 1 && !fs.existsSync(logPath), r.stderr);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : '\n      → ' + String(x.detail).trim().split('\n').slice(0, 6).join('\n        '))); }
console.log('\nlocal-test-prep eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) { /* temp dir */ }
process.exit(failed ? 1 : 0);
