#!/usr/bin/env node
// eval-stag-catchup.js — post-baseline stag-env catch-up (release-prep.js stag-catchup + the init and
// merge-to-master guards) on SCRATCH repos, never a real etanah repo. Born 2026-10-23 (#246964).
// Fixture: bare origins etanah-pelupusan.git + etanah-awam.git, a work clone of each, and an
// etanah-common repo beside them whose version commits carry the version as subject:
//   1.0.1-MLK ── 1.0.2-MLK            (main line)
//        └──── 1.0.1-MLK.beta.patch1  (beta line: neither contains 1.0.2)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'release-prep.js');
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stagcu-eval-'));
const workRoot = path.join(tmp, 'work');
const plp = path.join(workRoot, 'etanah-pelupusan');
const awam = path.join(workRoot, 'etanah-awam');
const common = path.join(workRoot, 'etanah-common');
const stateDir = path.join(tmp, 'state');
const logFile = path.join(tmp, 'stag-catchup.log.jsonl');
// compile stub: records each tree it was asked to compile; fails while the flag file exists
const compileStub = path.join(tmp, 'compile-stub.js'), compiled = path.join(tmp, 'compiled.txt'), failFlag = path.join(tmp, 'compile-fail.flag');
fs.writeFileSync(compileStub, `const fs=require('fs');fs.appendFileSync(${JSON.stringify(compiled)},process.argv[2]+'\\n');process.exit(fs.existsSync(${JSON.stringify(failFlag)})?1:0);`);
const env = { ...process.env, STAG_CATCHUP_COMPILE: JSON.stringify([process.execPath, compileStub]), RELEASE_MLK_PLP_STATE_DIR: stateDir, CARRY_OVER_FILE: path.join(stateDir, 'carry-over.json'), STAG_CATCHUP_WORK_ROOT: workRoot, STAG_CATCHUP_LOG: logFile };

function sh(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}:\n${r.stderr || r.stdout}`);
  return r.stdout.trim();
}
const prep = args => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env, timeout: 120000 });
const all = r => (r.stdout || '') + (r.stderr || '');
const pom = (ver, pin) => `<project>\n\t<artifactId>etanah-pelupusan</artifactId>\n\t<version>${ver}</version>\n\t<name>x</name>\n\t<description>y</description>\n\t<properties>\n\t\t<etanah.common.version>${pin}</etanah.common.version>\n\t</properties>\n</project>\n`;
function setPin(repo, pin) { const p = path.join(repo, 'pom.xml'); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/(<etanah\.common\.version>)[^<]+/, `$1${pin}`)); }
// one commit on top of origin/<branch>, pushed back to it (or to `pushTo`)
function commitOn(repo, branch, edit, msg, pushTo) {
  sh(repo, ['fetch', 'origin']);
  sh(repo, ['checkout', '-q', '-B', 'fx', `origin/${branch}`]);
  edit(repo);
  sh(repo, ['add', '-A']); sh(repo, ['commit', '-q', '-m', msg]);
  sh(repo, ['push', '-q', '-f', 'origin', `HEAD:${pushTo || branch}`]);
  sh(repo, ['checkout', '-q', '--detach']);
  return sh(repo, ['rev-parse', 'HEAD']);
}
const tip = (repo, b) => { sh(repo, ['fetch', '-q', 'origin']); return sh(repo, ['rev-parse', `origin/${b}`]); };
const pinOf = (repo, b) => (sh(repo, ['show', `origin/${b}:pom.xml`]).match(/<etanah\.common\.version>([^<]+)/) || [])[1];
const worktrees = repo => sh(repo, ['worktree', 'list']).split('\n').filter(Boolean).length;
const write = (f, t) => repo => fs.writeFileSync(path.join(repo, f), t);

function makeRepo(name) {
  const bare = path.join(tmp, 'origin', `${name}.git`);
  fs.mkdirSync(path.dirname(bare), { recursive: true });
  sh(tmp, ['init', '-q', '--bare', bare]);
  const w = path.join(workRoot, name);
  sh(tmp, ['clone', '-q', bare, w]);
  sh(w, ['config', 'user.email', 'eval@local']); sh(w, ['config', 'user.name', 'eval']);
  sh(w, ['checkout', '-q', '-b', 'mlk/master']);
  fs.writeFileSync(path.join(w, 'pom.xml'), pom('9.9.8', '1.0.1-MLK'));
  fs.writeFileSync(path.join(w, 'a.txt'), 'base\n');
  sh(w, ['add', '-A']); sh(w, ['commit', '-q', '-m', 'base']);
  sh(w, ['push', '-q', 'origin', 'mlk/master', 'mlk/master:mlk/stag-env']);
  return w;
}

try {
  // ── etanah-common ──
  fs.mkdirSync(common, { recursive: true });
  sh(common, ['init', '-q']); sh(common, ['config', 'user.email', 'e@l']); sh(common, ['config', 'user.name', 'e']);
  const cpom = v => fs.writeFileSync(path.join(common, 'pom.xml'), `<project>\n\t<artifactId>etanah-common</artifactId>\n\t<version>${v}</version>\n</project>\n`);
  cpom('1.0.1-MLK'); sh(common, ['add', '-A']); sh(common, ['commit', '-q', '-m', '1.0.1-MLK']);
  sh(common, ['branch', 'beta']);
  cpom('1.0.2-MLK'); sh(common, ['commit', '-q', '-am', '1.0.2-MLK']);
  sh(common, ['checkout', '-q', 'beta']);
  fs.writeFileSync(path.join(common, 'fix.txt'), 'beta fix\n'); sh(common, ['add', '-A']); sh(common, ['commit', '-q', '-m', 'refs #900001']);
  cpom('1.0.1-MLK.beta.patch1'); sh(common, ['commit', '-q', '-am', '1.0.1-MLK.beta.patch1']);

  makeRepo('etanah-pelupusan');
  makeRepo('etanah-awam');

  // ── Phase A: env pin 1.0.2 contains the release's 1.0.1 → keep env pin, clean catch-up ──
  commitOn(plp, 'mlk/stag-env', r => setPin(r, '1.0.2-MLK'), 'Ref #100009 - Up common to 1.0.2-MLK for testing');
  commitOn(plp, 'mlk/master', write('b.txt', 'fix\n'), 'Ref #100001 - fix');
  const relA = commitOn(plp, 'mlk/master', r => fs.writeFileSync(path.join(r, 'pom.xml'), fs.readFileSync(path.join(r, 'pom.xml'), 'utf8').replace('9.9.8', '9.9.9')), 'pelupusan version: 9.9.9');
  sh(plp, ['push', '-q', 'origin', `${relA}:refs/heads/mlk/release/9.9.9`]);
  const stagA = tip(plp, 'mlk/stag-env');

  let r = prep(['stag-catchup', '--check']);
  check('S1 --check fires when stag-env lacks the release (exit 3, ticket listed)', r.status === 3 && /2 commit\(s\) behind/.test(all(r)) && /#100001/.test(all(r)), `exit=${r.status} ${all(r).slice(0, 300)}`);
  check('S2 latest passed release reported (slip A4)', /latest passed release = 9\.9\.9/.test(all(r)), all(r).slice(0, 200));

  r = prep(['stag-catchup', '--release', '9.9.9']);
  check('S3 dry run: clean merge, nothing pushed', r.status === 0 && /DRY RUN/.test(all(r)) && tip(plp, 'mlk/stag-env') === stagA, `exit=${r.status} ${all(r).slice(-300)}`);
  check('S4 dry run keeps env pin (release common inside env line)', /common pin after catch-up: 1\.0\.2-MLK/.test(all(r)), all(r).slice(0, 400));
  check('S5 dry run leaves no worktree behind', worktrees(plp) === 1, sh(plp, ['worktree', 'list']));

  r = prep(['stag-catchup', '--release', '9.9.9', '--push']);
  const stagA2 = tip(plp, 'mlk/stag-env');
  check('S6 --push lands + reads origin back', r.status === 0 && /pushed \+ read back/.test(all(r)) && spawnSync('git', ['merge-base', '--is-ancestor', relA, stagA2], { cwd: plp }).status === 0, `exit=${r.status} ${all(r).slice(-300)}`);
  check('S7 pushed stag-env keeps its pin 1.0.2-MLK', pinOf(plp, 'mlk/stag-env') === '1.0.2-MLK', pinOf(plp, 'mlk/stag-env'));
  check('S8 merge message matches the team format', sh(plp, ['log', '-1', '--format=%s', 'origin/mlk/stag-env']) === "Merge remote-tracking branch 'remotes/origin/mlk/master' into mlk/stag-env", sh(plp, ['log', '-1', '--format=%s', 'origin/mlk/stag-env']));
  check('S9 card printed (two-host stag build + deploy)', /build-pelupusan\.sh mlk\/stag-env/.test(all(r)) && /deployment-scripts\/stag/.test(all(r)), all(r).slice(-400));

  r = prep(['stag-catchup', '--check']);
  check('S10 --check silent when stag-env holds master (exit 0)', r.status === 0 && /holds origin\/mlk\/master/.test(all(r)), `exit=${r.status} ${all(r)}`);

  sh(plp, ['checkout', '-q', '-B', 'mlk/master', 'origin/mlk/master']);
  r = spawnSync(process.execPath, [SCRIPT, 'init', '--release', '9.9.10', '--repo', plp], { encoding: 'utf8', env, timeout: 60000 });
  check('S11 next baseline init passes when stag-env holds master', r.status === 0 && /stag-env check: .* holds/.test(all(r)), `exit=${r.status} ${all(r).slice(0, 300)}`);

  // ── Phase B: release moves common to the beta line, env stays on 1.0.2 → two separate lines ──
  commitOn(plp, 'mlk/master', r2 => { setPin(r2, '1.0.1-MLK.beta.patch1'); fs.writeFileSync(path.join(r2, 'c.txt'), 'x\n'); }, 'Ref #100002 - needs beta common');
  sh(plp, ['checkout', '-q', '-B', 'mlk/master', 'origin/mlk/master']);
  const stagB = tip(plp, 'mlk/stag-env');
  r = prep(['stag-catchup']);
  check('S12 separate common lines STOP (exit 2) and show both', r.status === 2 && /two separate lines/.test(all(r)) && /1\.0\.2-MLK .*lacks 2 commit/.test(all(r)) && /1\.0\.1-MLK\.beta\.patch1 .*lacks 1 commit/.test(all(r)) && /--common env/.test(all(r)), `exit=${r.status} ${all(r)}`);
  check('S13 the stop pushes nothing', tip(plp, 'mlk/stag-env') === stagB, 'stag-env moved');

  r = spawnSync(process.execPath, [SCRIPT, 'init', '--release', '9.9.10', '--repo', plp], { encoding: 'utf8', env, timeout: 60000 });
  check('S14 next baseline init REFUSES while stag-env lacks the release', r.status === 2 && /INIT REFUSED/.test(all(r)) && /#100002/.test(all(r)), `exit=${r.status} ${all(r).slice(0, 300)}`);
  r = spawnSync(process.execPath, [SCRIPT, 'init', '--release', '9.9.10', '--repo', plp, '--stag-behind-ack', 'eval: catch-up booked for tomorrow'], { encoding: 'utf8', env, timeout: 60000 });
  check('S15 init passes with --stag-behind-ack and prints the reason', r.status === 0 && /overridden by --stag-behind-ack "eval: catch-up booked/.test(all(r)), `exit=${r.status} ${all(r).slice(0, 300)}`);

  r = prep(['stag-catchup', '--common', 'env', '--push']);
  check('S16 pin-line conflict STOPS, nothing kept, nothing pushed', r.status === 2 && /CONFLICT merging/.test(all(r)) && /pom\.xml/.test(all(r)) && tip(plp, 'mlk/stag-env') === stagB && worktrees(plp) === 1, `exit=${r.status} ${all(r).slice(-300)}`);

  r = prep(['stag-catchup', '--common', '1.0.2']);
  check('S17 malformed --common refused', r.status === 2 && /--common must be env, release, or a version/.test(all(r)), `exit=${r.status} ${all(r)}`);

  // ── Phase C (int-env): merge takes the release pin; the env pin is set back inside the merge commit ──
  commitOn(plp, 'mlk/master', r2 => setPin(r2, '1.0.2-MLK'), 'common version increase to: 1.0.2-MLK');
  sh(plp, ['push', '-q', '-f', 'origin', 'origin/mlk/master:refs/heads/mlk/int-env']);
  commitOn(plp, 'mlk/master', r2 => { setPin(r2, '1.0.1-MLK'); fs.writeFileSync(path.join(r2, 'd.txt'), 'd\n'); }, 'Ref #100004 - common version revert to: 1.0.1-MLK');
  r = prep(['stag-catchup', '--env', 'mlk/int-env', '--push']);
  check('S18 int-env: merge took 1.0.1, env pin 1.0.2 restored, pushed', r.status === 0 && /pin set back to 1\.0\.2-MLK/.test(all(r)) && pinOf(plp, 'mlk/int-env') === '1.0.2-MLK', `exit=${r.status} pin=${pinOf(plp, 'mlk/int-env')} ${all(r).slice(-300)}`);
  check('S19 restored pin lives in the merge commit (2 parents, no extra commit)', sh(plp, ['log', '-1', '--format=%P', 'origin/mlk/int-env']).split(' ').length === 2, sh(plp, ['log', '-1', '--format=%P %s', 'origin/mlk/int-env']));
  check('S20 int-env deploy card is the one-function mlit card', /deployment-scripts\/mlit/.test(all(r)), all(r).slice(-300));

  // ── Phase D: unresolvable pin, guards ──
  commitOn(plp, 'mlk/int-env', r2 => setPin(r2, '7.7.7-MLK'), 'Ref #100006 - odd pin');
  commitOn(plp, 'mlk/master', write('e.txt', 'e\n'), 'Ref #100007 - more');
  r = prep(['stag-catchup', '--env', 'mlk/int-env']);
  check('S21 a pin not found in etanah-common STOPS (cannot prove the line)', r.status === 2 && /cannot place 7\.7\.7-MLK/.test(all(r)), `exit=${r.status} ${all(r)}`);

  r = prep(['stag-catchup', '--check', '--repo', 'E:\\Projects\\Melaka\\etanah-pelupusan']);
  check('S22 みや\'s working repo refused before any git', r.status === 2 && /みや's working repo/.test(all(r)), `exit=${r.status} ${all(r)}`);
  r = prep(['stag-catchup', '--check', '--module', 'awam', '--repo', plp]);
  check('S23 module guard: awam against a pelupusan origin refused', r.status === 2 && /MODULE GUARD/.test(all(r)), `exit=${r.status} ${all(r)}`);
  r = prep(['stag-catchup', '--check', '--module', 'awam']);
  check('S24 awam module resolves its work clone by default and reports current', r.status === 0 && /etanah-awam/.test(all(r)) && /holds/.test(all(r)), `exit=${r.status} ${all(r)}`);
  r = prep(['stag-catchup', '--check', '--env', 'mlk/master']);
  check('S25 --env outside stag-env/int-env refused', r.status === 2 && /--env must be one of/.test(all(r)), `exit=${r.status} ${all(r)}`);

  // ── Phase E: release not yet on master, then merge-to-master prints the mandatory next step ──
  const relE = commitOn(plp, 'mlk/master', write('f.txt', 'f\n'), 'Ref #100005 - release ticket', 'mlk/release/9.9.11');
  r = prep(['stag-catchup', '--check', '--release', '9.9.11']);
  check('S26 release not in master → uses the release branch, says so', r.status === 3 && /NOT in origin\/mlk\/master yet/.test(all(r)) && /#100005/.test(all(r)), `exit=${r.status} ${all(r)}`);
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'release-9.9.11.json'), JSON.stringify({ release: '9.9.11', branch: 'mlk/release/9.9.11', repo: plp, tickets: [], phase: 'pushed', headSha: relE }));
  sh(plp, ['checkout', '-q', '-B', 'mlk/master', 'origin/mlk/master']);
  r = prep(['merge-to-master', '--release', '9.9.11', '--ba-approved']);
  check('S27 merge-to-master ends with the mandatory stag-catchup step', r.status === 0 && /NEXT \(mandatory\).*stag-catchup --release 9\.9\.11 --push/.test(all(r)), `exit=${r.status} ${all(r).slice(-400)}`);
  r = prep(['stag-catchup', '--check', '--release', '9.9.11']);
  check('S28 after Phase F the source is mlk/master', r.status === 3 && /release 9\.9\.11 is in origin\/mlk\/master/.test(all(r)), `exit=${r.status} ${all(r)}`);

  const rows = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  check('S29 log rows written (pushed rows carry goal_met)', rows.some(x => x.result === 'pushed' && x.goal_met === true) && rows.some(x => x.result === 'stop-common') && rows.some(x => x.result === 'conflict'), JSON.stringify(rows.map(x => x.result)));
  // ── Phase F: the merged tree must compile before it is pushed ──
  const stagF = tip(plp, 'mlk/stag-env');
  fs.writeFileSync(failFlag, '1');
  r = prep(['stag-catchup', '--common', 'release', '--env', 'mlk/int-env', '--push']);
  const intF = tip(plp, 'mlk/int-env');
  fs.rmSync(failFlag);
  check('S31 compile failure STOPS, nothing pushed', r.status === 2 && /COMPILE FAILED/.test(all(r)) && sh(plp, ['rev-list', '--count', 'origin/mlk/int-env..origin/mlk/master']) !== '0', `exit=${r.status} ${all(r).slice(-300)}`);
  const compiledTrees = fs.existsSync(compiled) ? fs.readFileSync(compiled, 'utf8').trim().split(/\r?\n/) : [];
  check('S32 every --push compiled the merged temp tree first (stub saw 3 trees)', compiledTrees.length === 3 && compiledTrees.every(t => /stag-catchup-/.test(t)), JSON.stringify(compiledTrees));
  check('S33 the compile stop moved no env branch', tip(plp, 'mlk/stag-env') === stagF && intF === tip(plp, 'mlk/int-env'), 'moved');
  check('S30 no worktree left behind after every run', worktrees(plp) === 1, sh(plp, ['worktree', 'list']));
} catch (e) {
  check('FIXTURE setup/run crashed', false, e.message.slice(0, 400));
}

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log(`\nstag-catchup eval: ${results.length - failed}/${results.length} green`);
process.exit(failed ? 1 : 0);
