#!/usr/bin/env node
// deploy-plan eval — replays 290517 on a throwaway git origin: the QA asked for staging, the ticket branch carried two
// commits naming 290517 (Reports' jrxml + our xhtml), the merge must change only those two files and run only on an approved code.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const TOOL = path.join(__dirname, 'deploy-plan.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-plan-eval-'));
const ORIGIN = path.join(TMP, 'origin.git'), WORK = path.join(TMP, 'work'), PLANS = path.join(TMP, 'plans');
const ENV = { ...process.env, DEPLOY_PLANS: PLANS, DEPLOY_LOG: path.join(TMP, 'log.jsonl'), GIT_TERMINAL_PROMPT: '0' };
let pass = 0, fail = 0;
function t(n, c, d) { if (c) { pass++; console.log('PASS  ' + n); } else { fail++; console.log('FAIL  ' + n + (d ? '  :: ' + String(d).slice(0, 300) : '')); } }
function g(dir, ...a) { const r = spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8', windowsHide: true }); if (r.status !== 0) throw new Error(a.join(' ') + ': ' + r.stderr); return r.stdout.trim(); }
function file(rel, text) { const p = path.join(WORK, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); }
function commit(msg, author) { g(WORK, 'add', '-A'); g(WORK, '-c', 'user.name=' + (author || 'Ridhwan'), '-c', 'user.email=x@y', 'commit', '-q', '-m', msg); }
function tool(...a) { const r = spawnSync(process.execPath, [TOOL, ...a], { encoding: 'utf8', env: ENV, timeout: 120000 }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; }
const codeOf = out => (out.match(/DEPLOY-PLAN: ([0-9A-F]{4}-[0-9A-F]{4}) sealed/) || [])[1];
const approve = c => fs.writeFileSync(path.join(PLANS, c.replace('-', '') + '.miya.json'), JSON.stringify({ code: c, ts: new Date().toISOString(), his: 'approve deploy ' + c }));

// fixture: sgr/master + sgr/int-env + sgr/stag-env, ticket branch sgr/esokongan/290517 with two commits
spawnSync('git', ['init', '-q', '--bare', ORIGIN]);
spawnSync('git', ['clone', '-q', ORIGIN, WORK]);
g(WORK, 'config', 'user.name', 'Ridhwan'); g(WORK, 'config', 'user.email', 'x@y');
g(WORK, 'checkout', '-q', '-b', 'sgr/master');
file('pom.xml', '<version>1.78.0</version>\n'); file('reports/LaporanBorangA.jrxml', 'NO_LOT first\n'); file('web/plpMaklumatTanahForm.xhtml', 'box swaps\n');
commit('base');
for (const b of ['sgr/int-env', 'sgr/stag-env']) g(WORK, 'branch', b);
g(WORK, 'checkout', '-q', '-b', 'sgr/esokongan/290517');
file('web/plpMaklumatTanahForm.xhtml', 'box keeps NO_PT\n'); commit('Ref #290517 - PT - Senarai Semakan Hakmilik Sementara - fix No PT box for all units');
file('reports/LaporanBorangA.jrxml', 'NO_PT first\n'); commit('Ref#290517 - fix No Lot LaporanBorangA', 'dayana');
g(WORK, 'push', '-q', 'origin', 'sgr/master', 'sgr/int-env', 'sgr/stag-env', 'sgr/esokongan/290517');
const SRC = g(WORK, 'rev-parse', 'HEAD');

// 1. plan for staging seals a code, two files, a warning for the other author
let p = tool('plan', '--ticket', '290517', '--env', 'staging', '--state', 'selangor', '--repo', WORK, '--ba', 'Amani');
const C1 = codeOf(p.out);
t('P1 290517 staging plan is sealed with a code', p.code === 0 && C1, p.out);
t('P2 the plan lists exactly the two fix files', /file\s+reports\/LaporanBorangA\.jrxml/.test(p.out) && /file\s+web\/plpMaklumatTanahForm\.xhtml/.test(p.out) && !/pom\.xml/.test(p.out), p.out);
t('P3 a commit by another author is a warning shown to him', /WARN\s+commit by dayana/.test(p.out), p.out);
t('P4 the BA note is in the plan', /Salam Amani, have deployed fixes to staging/.test(p.out), p.out);

// 2. run without his approval is refused; nothing pushed
let r = tool('run', '--approve', C1);
t('R1 run with no approval record is refused', r.code === 1 && /no approval from miya/.test(r.out), r.out);
t('R2 staging untouched after the refusal', g(WORK, 'ls-remote', 'origin', 'refs/heads/sgr/stag-env').split('\t')[0] === g(WORK, 'rev-parse', 'sgr/stag-env'));

// 3. the source moves after the plan → stale, refused
approve(C1);
file('web/extra.txt', 'late\n'); commit('Ref #290517 - late change'); g(WORK, 'push', '-q', 'origin', 'sgr/esokongan/290517');
r = tool('run', '--approve', C1);
t('R3 source moved since the plan → refused, new plan needed', r.code === 1 && /moved since the plan/.test(r.out), r.out);
g(WORK, 'reset', '-q', '--hard', SRC); g(WORK, 'push', '-q', '-f', 'origin', 'sgr/esokongan/290517');

// 4. approved run merges and pushes; the code is single use
p = tool('plan', '--ticket', '290517', '--env', 'staging', '--state', 'selangor', '--repo', WORK);
const C2 = codeOf(p.out); approve(C2);
r = tool('run', '--approve', C2);
g(WORK, 'fetch', '-q', 'origin');
const merged = spawnSync('git', ['-C', WORK, 'merge-base', '--is-ancestor', SRC, 'origin/sgr/stag-env']).status === 0;
t('R4 approved run merges into sgr/stag-env and pushes', r.code === 0 && /merged/.test(r.out) && merged, r.out);
t('R5 the merge commit has the team message', g(WORK, 'log', '-1', '--format=%s', 'origin/sgr/stag-env') === "Merge branch 'sgr/esokongan/290517' into sgr/stag-env");
t('R6 the merge changes only the two fix files', g(WORK, 'diff', '--name-only', 'origin/sgr/stag-env~1', 'origin/sgr/stag-env').split('\n').sort().join(',') === 'reports/LaporanBorangA.jrxml,web/plpMaklumatTanahForm.xhtml');
r = tool('run', '--approve', C2);
t('R7 the same code cannot run twice', r.code === 1 && /already run/.test(r.out), r.out);
t('R8 no temporary work folder is left behind', g(WORK, 'worktree', 'list').split('\n').length === 1, g(WORK, 'worktree', 'list'));

// 5. stops
p = tool('plan', '--ticket', '290517', '--env', 'staging', '--state', 'selangor', '--repo', WORK);
t('S1 already in staging → stop, no code', p.code === 1 && /already in sgr\/stag-env/.test(p.out) && !codeOf(p.out), p.out);
p = tool('plan', '--ticket', '290517', '--env', 'prod', '--state', 'selangor', '--repo', WORK);
t('S2 PROD is refused', p.code === 1 && /not internal or staging/.test(p.out), p.out);
g(WORK, 'checkout', '-q', '-b', 'sgr/esokongan/290999', 'sgr/master');
file('pom.xml', '<version>1.79.0</version>\n'); commit('Ref #290999 - bump');
g(WORK, 'push', '-q', 'origin', 'sgr/esokongan/290999');
p = tool('plan', '--ticket', '290999', '--env', 'internal', '--state', 'selangor', '--repo', WORK);
t('S3 a pom.xml change stops the plan', p.code === 1 && /pom\.xml/.test(p.out), p.out);
g(WORK, 'checkout', '-q', '-b', 'sgr/esokongan/291000', 'sgr/master');
file('web/a.txt', 'a\n'); commit('Ref #291000 - fix'); file('web/b.txt', 'b\n'); commit('Ref #280001 - another ticket');
g(WORK, 'push', '-q', 'origin', 'sgr/esokongan/291000');
p = tool('plan', '--ticket', '291000', '--env', 'internal', '--state', 'selangor', '--repo', WORK);
t('S4 a commit that does not name the ticket stops the plan', p.code === 1 && /do not name 291000/.test(p.out), p.out);
p = tool('plan', '--ticket', '291999', '--env', 'internal', '--state', 'selangor', '--repo', WORK);
t('S5 no branch for the ticket → stop', p.code === 1 && /no sgr\/ branch ends with 291999/.test(p.out), p.out);
g(WORK, 'checkout', '-q', '-b', 'sgr/esokongan/291001', 'sgr/master');
file('reports/LaporanBorangA.jrxml', 'conflict A\n'); commit('Ref #291001 - A');
g(WORK, 'checkout', '-q', 'sgr/int-env'); file('reports/LaporanBorangA.jrxml', 'conflict B\n'); commit('other on int-env');
g(WORK, 'push', '-q', 'origin', 'sgr/esokongan/291001', 'sgr/int-env');
p = tool('plan', '--ticket', '291001', '--env', 'internal', '--state', 'selangor', '--repo', WORK);
t('S6 a merge conflict stops the plan', p.code === 1 && /conflicts/.test(p.out), p.out);

const logRows = fs.readFileSync(path.join(TMP, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
t('L1 the log has planned, stopped and merged rows', ['planned', 'stopped', 'merged'].every(o => logRows.some(x => x.outcome === o)), logRows.map(x => x.outcome).join(','));

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* temp */ }
console.log(`deploy-plan.eval: ${pass}/${pass + fail} ${fail ? 'FAILED' : 'green'}`);
process.exit(fail ? 1 : 0);
