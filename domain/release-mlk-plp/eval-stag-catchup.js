#!/usr/bin/env node
// eval-stag-catchup.js — post-baseline stag-env catch-up (release-prep.js stag-catchup + the init and
// merge-to-master guards) on SCRATCH repos, never a real etanah repo. Born 2026-10-23 (#246964).
// Common-pin rule (miya 2026-10-23): after the merge, the env pins the RELEASE's own common, set in a
// separate "Ref #<num> - Up common to <ver>" commit, only if that version is published in nexus.
// Fixture: bare origins etanah-pelupusan.git + etanah-awam.git, a work clone of each, a nexus
// maven-metadata.xml file, and a compile stub.
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
const stateDir = path.join(tmp, 'state');
const logFile = path.join(tmp, 'stag-catchup.log.jsonl');
const nexus = path.join(tmp, 'maven-metadata.xml');
const setNexus = vers => fs.writeFileSync(nexus, `<metadata><versioning><versions>${vers.map(v => `<version>${v}</version>`).join('')}</versions></versioning></metadata>`);
// compile stub: records each tree it was asked to compile; fails while the flag file exists
const compileStub = path.join(tmp, 'compile-stub.js'), compiled = path.join(tmp, 'compiled.txt'), failFlag = path.join(tmp, 'compile-fail.flag');
fs.writeFileSync(compileStub, `const fs=require('fs');fs.appendFileSync(${JSON.stringify(compiled)},process.argv[2]+'\\n');process.exit(fs.existsSync(${JSON.stringify(failFlag)})?1:0);`);
const gitlabCfg = path.join(tmp, 'servers.local.json');
fs.writeFileSync(gitlabCfg, JSON.stringify({ gitlab: { web: 'http://gitlab.test/gitlab', project: 'etanah/etanah-pelupusan', reviewers: [{ name: 'Aaron', username: 'aaron' }] } }));
const env = { ...process.env, RELEASE_MLK_PLP_STATE_DIR: stateDir, CARRY_OVER_FILE: path.join(stateDir, 'carry-over.json'), RELEASE_MLK_PLP_CONFIG: gitlabCfg,
  STAG_CATCHUP_WORK_ROOT: workRoot, STAG_CATCHUP_LOG: logFile, STAG_CATCHUP_NEXUS_METADATA: nexus,
  STAG_CATCHUP_COMPILE: JSON.stringify([process.execPath, compileStub]) };

function sh(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}:\n${r.stderr || r.stdout}`);
  return r.stdout.trim();
}
const prep = args => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env, timeout: 120000 });
const init = extra => spawnSync(process.execPath, [SCRIPT, 'init', '--release', '9.9.10', '--repo', plp, ...(extra || [])], { encoding: 'utf8', env, timeout: 60000 });
const all = r => (r.stdout || '') + (r.stderr || '');
const pom = (ver, pin) => `<project>\n\t<artifactId>etanah-pelupusan</artifactId>\n\t<version>${ver}</version>\n\t<name>x</name>\n\t<description>y</description>\n\t<properties>\n\t\t<etanah.common.version>${pin}</etanah.common.version>\n\t</properties>\n</project>\n`;
const setPin = pin => repo => { const p = path.join(repo, 'pom.xml'); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/(<etanah\.common\.version>)[^<]+/, `$1${pin}`)); };
const write = (f, t) => repo => fs.writeFileSync(path.join(repo, f), t);
const both = (...fns) => repo => fns.forEach(fn => fn(repo));
// one commit on top of origin/<branch>, pushed back to it (or to `pushTo`)
function commitOn(branch, edit, msg, pushTo) {
  sh(plp, ['fetch', '-q', 'origin']);
  sh(plp, ['checkout', '-q', '-B', 'fx', `origin/${branch}`]);
  edit(plp);
  sh(plp, ['add', '-A']); sh(plp, ['commit', '-q', '-m', msg]);
  sh(plp, ['push', '-q', '-f', 'origin', `HEAD:${pushTo || branch}`]);
  sh(plp, ['checkout', '-q', '--detach']);
  return sh(plp, ['rev-parse', 'HEAD']);
}
const tip = b => { sh(plp, ['fetch', '-q', 'origin']); return sh(plp, ['rev-parse', `origin/${b}`]); };
const pinOf = b => (sh(plp, ['show', `origin/${b}:pom.xml`]).match(/<etanah\.common\.version>([^<]+)/) || [])[1];
const subj = ref => sh(plp, ['log', '-1', '--format=%s', ref]);
const parents = ref => sh(plp, ['log', '-1', '--format=%P', ref]).split(' ').filter(Boolean).length;
const worktrees = () => sh(plp, ['worktree', 'list']).split('\n').filter(Boolean).length;
const behind = b => sh(plp, ['rev-list', '--count', `origin/${b}..origin/mlk/master`]);

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
  sh(w, ['push', '-q', 'origin', 'mlk/master', 'mlk/master:mlk/stag-env', 'mlk/master:mlk/int-env']);
}

try {
  setNexus(['1.0.1-MLK', '1.0.2-MLK']);
  makeRepo('etanah-pelupusan');
  makeRepo('etanah-awam');

  // ── Phase A: env moved its own pin to 1.0.2; release 9.9.9 pins 1.0.1 → after the merge, a separate
  //    pin commit puts stag-env on the release's 1.0.1 (lower → "Change", per version-direction) ──
  commitOn('mlk/stag-env', setPin('1.0.2-MLK'), 'Ref #100009 - Up common to 1.0.2-MLK');
  commitOn('mlk/master', write('b.txt', 'fix\n'), 'Ref #100001 - fix');
  const relA = commitOn('mlk/master', r => fs.writeFileSync(path.join(r, 'pom.xml'), fs.readFileSync(path.join(r, 'pom.xml'), 'utf8').replace('9.9.8', '9.9.9')), 'pelupusan version: 9.9.9');
  sh(plp, ['push', '-q', 'origin', `${relA}:refs/heads/mlk/release/9.9.9`]);
  const stagA = tip('mlk/stag-env');

  let r = prep(['stag-catchup', '--check']);
  check('S1 --check fires when stag-env lacks the release (exit 3, ticket listed)', r.status === 3 && /2 commit\(s\) behind/.test(all(r)) && /#100001/.test(all(r)), `exit=${r.status} ${all(r).slice(0, 300)}`);
  check('S2 latest passed release reported (slip A4)', /latest passed release = 9\.9\.9/.test(all(r)), all(r).slice(0, 200));

  r = prep(['stag-catchup', '--release', '9.9.9']);
  check('S3 pin must move but no --ticket → STOP, nothing pushed', r.status === 2 && /needs --ticket/.test(all(r)) && tip('mlk/stag-env') === stagA, `exit=${r.status} ${all(r).slice(-300)}`);

  r = prep(['stag-catchup', '--release', '9.9.9', '--ticket', '100001']);
  check('S4 dry run: merge + pin commit shown, nothing pushed', r.status === 0 && /DRY RUN/.test(all(r)) && /Ref #100001 - Change common to 1\.0\.1-MLK/.test(all(r)) && tip('mlk/stag-env') === stagA, `exit=${r.status} ${all(r).slice(-400)}`);
  check('S5 dry run leaves no worktree behind', worktrees() === 1, sh(plp, ['worktree', 'list']));

  r = prep(['stag-catchup', '--release', '9.9.9', '--ticket', '100001', '--push']);
  check('S6 --push lands + reads origin back', r.status === 0 && /pushed \+ read back/.test(all(r)) && spawnSync('git', ['merge-base', '--is-ancestor', relA, tip('mlk/stag-env')], { cwd: plp }).status === 0, `exit=${r.status} ${all(r).slice(-400)}`);
  check('S7 stag-env now pins the RELEASE common 1.0.1-MLK (not its old 1.0.2)', pinOf('mlk/stag-env') === '1.0.1-MLK', pinOf('mlk/stag-env'));
  check('S8 pin is its own commit on top: "Ref #100001 - Change common to 1.0.1-MLK" (direction-correct verb)', subj('origin/mlk/stag-env') === 'Ref #100001 - Change common to 1.0.1-MLK' && parents('origin/mlk/stag-env') === 1, subj('origin/mlk/stag-env'));
  check('S9 under it, the merge in the team format', subj('origin/mlk/stag-env~1') === "Merge remote-tracking branch 'remotes/origin/mlk/master' into mlk/stag-env" && parents('origin/mlk/stag-env~1') === 2, subj('origin/mlk/stag-env~1'));
  check('S10 card printed (two-host stag build + deploy)', /build-pelupusan\.sh mlk\/stag-env/.test(all(r)) && /deployment-scripts\/stag/.test(all(r)), all(r).slice(-400));

  r = prep(['stag-catchup', '--check']);
  check('S11 --check silent when stag-env holds master (exit 0)', r.status === 0 && /holds origin\/mlk\/master/.test(all(r)), `exit=${r.status} ${all(r)}`);
  sh(plp, ['checkout', '-q', '-B', 'mlk/master', 'origin/mlk/master']);
  r = init();
  check('S12 next baseline init passes when stag-env holds master', r.status === 0 && /stag-env check: .* holds/.test(all(r)), `exit=${r.status} ${all(r).slice(0, 300)}`);

  // ── Phase B: the release moves common UP to 1.0.3-MLK; stag-env did not touch its pin since the last
  //    catch-up, so git's clean merge already takes 1.0.3 → no pin commit, no --ticket needed ──
  commitOn('mlk/master', both(setPin('1.0.3-MLK'), write('c.txt', 'x\n')), 'Ref #100002 - needs common 1.0.3');
  sh(plp, ['checkout', '-q', '-B', 'mlk/master', 'origin/mlk/master']);
  const stagB = tip('mlk/stag-env');
  r = init();
  check('S13 next baseline init REFUSES while stag-env lacks the release', r.status === 2 && /INIT REFUSED/.test(all(r)) && /#100002/.test(all(r)), `exit=${r.status} ${all(r).slice(0, 300)}`);
  r = init(['--stag-behind-ack', 'eval: catch-up booked for tomorrow']);
  check('S14 init passes with --stag-behind-ack and prints the reason', r.status === 0 && /overridden by --stag-behind-ack "eval: catch-up booked/.test(all(r)), `exit=${r.status} ${all(r).slice(0, 300)}`);

  r = prep(['stag-catchup', '--push']);
  check('S15 release common not in nexus → STOP before any merge, nothing pushed', r.status === 2 && /1\.0\.3-MLK is NOT published in nexus/.test(all(r)) && tip('mlk/stag-env') === stagB, `exit=${r.status} ${all(r)}`);
  setNexus(['1.0.1-MLK', '1.0.2-MLK', '1.0.3-MLK']);
  r = prep(['stag-catchup', '--push']);
  check('S16 published → clean merge already carries 1.0.3, no pin commit, pushed', r.status === 0 && pinOf('mlk/stag-env') === '1.0.3-MLK' && parents('origin/mlk/stag-env') === 2 && !/pin commit:/.test(all(r)), `exit=${r.status} pin=${pinOf('mlk/stag-env')} ${all(r).slice(-300)}`);

  r = prep(['stag-catchup', '--common', 'env']);
  check('S17 --common is retired (the pin is always the release\'s)', r.status === 2 && /--common is retired/.test(all(r)), `exit=${r.status} ${all(r)}`);

  // ── Phase C: BOTH sides changed the pin line → the merge conflicts on pom.xml only → pin commit FIRST
  //    on the env side, then git merges clean (nothing hand-resolved) ──
  commitOn('mlk/stag-env', setPin('1.0.2-MLK'), 'Ref #100010 - Change common to 1.0.2-MLK for testing');
  commitOn('mlk/master', both(setPin('1.0.1-MLK'), write('d.txt', 'd\n')), 'Ref #100004 - common version revert to: 1.0.1-MLK');
  r = prep(['stag-catchup', '--ticket', '100004', '--push']);
  check('S18 pom-only conflict → pin commit first, merge again, pushed', r.status === 0 && /pin commit first, then the merge again/.test(all(r)) && pinOf('mlk/stag-env') === '1.0.1-MLK', `exit=${r.status} pin=${pinOf('mlk/stag-env')} ${all(r).slice(-400)}`);
  check('S19 shape: merge on top, the pin commit is its first parent', parents('origin/mlk/stag-env') === 2 && subj('origin/mlk/stag-env^1') === 'Ref #100004 - Change common to 1.0.1-MLK', subj('origin/mlk/stag-env^1'));

  // ── Phase D: a real conflict (a.txt) stops, keeps nothing ──
  commitOn('mlk/stag-env', write('a.txt', 'env side\n'), 'Ref #100011 - env edit');
  commitOn('mlk/master', write('a.txt', 'master side\n'), 'Ref #100012 - master edit');
  const stagD = tip('mlk/stag-env');
  r = prep(['stag-catchup', '--ticket', '100012', '--push']);
  check('S20 non-pom conflict STOPS, nothing kept, nothing pushed', r.status === 2 && /CONFLICT merging/.test(all(r)) && /a\.txt/.test(all(r)) && tip('mlk/stag-env') === stagD && worktrees() === 1, `exit=${r.status} ${all(r).slice(-300)}`);

  // ── Phase E: int-env + compile gate ──
  fs.writeFileSync(failFlag, '1');
  r = prep(['stag-catchup', '--env', 'mlk/int-env', '--ticket', '100012', '--push']);
  fs.rmSync(failFlag);
  check('S21 compile failure STOPS, nothing pushed', r.status === 2 && /COMPILE FAILED/.test(all(r)) && behind('mlk/int-env') !== '0', `exit=${r.status} ${all(r).slice(-300)}`);
  r = prep(['stag-catchup', '--env', 'mlk/int-env', '--ticket', '100012', '--push']);
  check('S22 int-env catch-up pushes and prints the one-function mlit card', r.status === 0 && behind('mlk/int-env') === '0' && /deployment-scripts\/mlit/.test(all(r)), `exit=${r.status} ${all(r).slice(-300)}`);
  const compiledTrees = fs.existsSync(compiled) ? fs.readFileSync(compiled, 'utf8').trim().split(/\r?\n/) : [];
  check('S23 every --push compiled the merged temp tree first (stub saw 5 trees)', compiledTrees.length === 5 && compiledTrees.every(t => /stag-catchup-/.test(t)), JSON.stringify(compiledTrees));

  // ── Phase F: guards ──
  r = prep(['stag-catchup', '--check', '--repo', 'E:\\Projects\\Melaka\\etanah-pelupusan']);
  check('S24 みや\'s working repo refused before any git', r.status === 2 && /みや's working repo/.test(all(r)), `exit=${r.status} ${all(r)}`);
  r = prep(['stag-catchup', '--check', '--module', 'awam', '--repo', plp]);
  check('S25 module guard: awam against a pelupusan origin refused', r.status === 2 && /MODULE GUARD/.test(all(r)), `exit=${r.status} ${all(r)}`);
  r = prep(['stag-catchup', '--check', '--module', 'awam']);
  check('S26 awam module resolves its work clone by default and reports current', r.status === 0 && /etanah-awam/.test(all(r)) && /holds/.test(all(r)), `exit=${r.status} ${all(r)}`);
  r = prep(['stag-catchup', '--check', '--env', 'mlk/master']);
  check('S27 --env outside stag-env/int-env refused', r.status === 2 && /--env must be one of/.test(all(r)), `exit=${r.status} ${all(r)}`);

  // ── Phase G: release not on master yet, then merge-to-master prints the mandatory next step ──
  const relG = commitOn('mlk/master', write('f.txt', 'f\n'), 'Ref #100005 - release ticket', 'mlk/release/9.9.11');
  r = prep(['stag-catchup', '--check', '--release', '9.9.11']);
  check('S28 release not in master → uses the release branch, says so', r.status === 3 && /NOT in origin\/mlk\/master yet/.test(all(r)) && /#100005/.test(all(r)), `exit=${r.status} ${all(r)}`);
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'release-9.9.11.json'), JSON.stringify({ release: '9.9.11', branch: 'mlk/release/9.9.11', repo: plp, tickets: [], phase: 'pushed', headSha: relG }));
  sh(plp, ['checkout', '-q', '-B', 'mlk/master', 'origin/mlk/master']);
  // mlk/master is protected (2026-10-29): prepare prints the MR form; the reviewer's merge is simulated by a push here.
  const masterBefore = tip('mlk/master');
  r = prep(['merge-to-master', '--release', '9.9.11', '--ba-approved']);
  check('S29a prepare prints the merge-request form and pushes nothing', r.status === 0 && /MERGE REQUEST FORM/.test(all(r)) && /Release Pelupusan 9\.9\.11/.test(all(r)) && tip('mlk/master') === masterBefore, `exit=${r.status} ${all(r).slice(-400)}`);
  sh(plp, ['push', '-q', 'origin', `${relG}:refs/heads/mlk/master`]);
  r = prep(['merge-to-master', '--release', '9.9.11', '--check']);
  check('S29 --check after the merge ends with the mandatory stag-catchup step', r.status === 0 && /NEXT \(mandatory\).*stag-catchup --release 9\.9\.11 --push/.test(all(r)), `exit=${r.status} ${all(r).slice(-400)}`);
  r = prep(['stag-catchup', '--check', '--release', '9.9.11']);
  check('S30 after Phase F the source is mlk/master', r.status === 3 && /release 9\.9\.11 is in origin\/mlk\/master/.test(all(r)), `exit=${r.status} ${all(r)}`);

  const rows = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  check('S31 log rows written (pushed rows carry goal_met)', rows.some(x => x.result === 'pushed' && x.goal_met === true) && rows.some(x => x.result === 'stop-nexus') && rows.some(x => x.result === 'conflict') && rows.some(x => x.result === 'compile-fail'), JSON.stringify(rows.map(x => x.result)));
  check('S32 no worktree left behind after every run', worktrees() === 1, sh(plp, ['worktree', 'list']));
} catch (e) {
  check('FIXTURE setup/run crashed', false, e.message.slice(0, 400));
}

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log(`\nstag-catchup eval: ${results.length - failed}/${results.length} green`);
process.exit(failed ? 1 : 0);
