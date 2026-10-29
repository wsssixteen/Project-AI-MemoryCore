#!/usr/bin/env node
// eval-merge-request.js — Phase F through a GitLab merge request (release-prep.js merge-to-master),
// on SCRATCH repos only. Born 2026-10-29: mlk/master became a protected branch ("You are not allowed to
// push code to protected branches"), so prepare must never push; --record-mr / --abandon-mr / --check
// carry the state. The reviewer's merge is simulated by pushing to the bare origin.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'release-prep.js');
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mr-eval-'));
const bare = path.join(tmp, 'origin', 'etanah-pelupusan.git');
const repo = path.join(tmp, 'etanah-pelupusan');
const stateDir = path.join(tmp, 'state');
const cfg = path.join(tmp, 'servers.local.json');
const WEB = 'http://gitlab.test/gitlab', PROJECT = 'etanah/etanah-pelupusan';
const writeCfg = obj => fs.writeFileSync(cfg, JSON.stringify(obj));
const goodCfg = { gitlab: { web: WEB, project: PROJECT, reviewers: [{ name: 'Aaron', username: 'aaron' }, { name: 'Alex', username: 'alexk' }] } };
const env = { ...process.env, RELEASE_MLK_PLP_STATE_DIR: stateDir, RELEASE_MLK_PLP_CONFIG: cfg, CARRY_OVER_FILE: path.join(stateDir, 'carry-over.json') };

function sh(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed in ${cwd}:\n${r.stderr || r.stdout}`);
  return r.stdout.trim();
}
const prep = args => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env, timeout: 120000 });
const all = r => (r.stdout || '') + (r.stderr || '');
const tip = b => { sh(repo, ['fetch', '-q', 'origin']); return sh(repo, ['rev-parse', `origin/${b}`]); };
const state = v => JSON.parse(fs.readFileSync(path.join(stateDir, `release-${v}.json`), 'utf8'));
function commitOn(branch, file, text, msg, pushTo) {
  sh(repo, ['fetch', '-q', 'origin']);
  sh(repo, ['checkout', '-q', '-B', 'fx', `origin/${branch}`]);
  fs.writeFileSync(path.join(repo, file), text);
  sh(repo, ['add', '-A']); sh(repo, ['commit', '-q', '-m', msg]);
  sh(repo, ['push', '-q', '-f', 'origin', `HEAD:${pushTo || branch}`]);
  sh(repo, ['checkout', '-q', '--detach']);
  return sh(repo, ['rev-parse', 'HEAD']);
}
function newRelease(ver, files) {
  let head;
  files.forEach(([f, t], i) => { head = commitOn(i ? `mlk/release/${ver}` : 'mlk/master', f, t, `Ref #10000${i} - ${f}`, `mlk/release/${ver}`); });
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, `release-${ver}.json`), JSON.stringify({ release: ver, branch: `mlk/release/${ver}`, repo, tickets: [], phase: 'pushed', headSha: head }));
  return head;
}

try {
  fs.mkdirSync(path.dirname(bare), { recursive: true });
  sh(tmp, ['init', '-q', '--bare', bare]);
  sh(tmp, ['clone', '-q', bare, repo]);
  sh(repo, ['config', 'user.email', 'eval@local']); sh(repo, ['config', 'user.name', 'eval']);
  sh(repo, ['checkout', '-q', '-b', 'mlk/master']);
  fs.writeFileSync(path.join(repo, 'a.txt'), 'base\n');
  sh(repo, ['add', '-A']); sh(repo, ['commit', '-q', '-m', 'base']);
  sh(repo, ['push', '-q', 'origin', 'mlk/master', 'mlk/master:mlk/stag-env']);
  sh(repo, ['checkout', '-q', '-b', 'mlk/hotfix/1']);   // みや's checkout sits on another branch
  const relTip = newRelease('9.9.20', [['r1.txt', 'one\n'], ['r2.txt', 'two\n']]);
  sh(repo, ['checkout', '-q', 'mlk/hotfix/1']);
  const master0 = tip('mlk/master');
  let r;

  r = prep(['merge-to-master', '--release', '9.9.20']);
  check('M1 no --ba-approved → refused (V8)', r.status === 2 && /V8/.test(all(r)), all(r));
  fs.rmSync(cfg, { force: true });
  r = prep(['merge-to-master', '--release', '9.9.20', '--ba-approved']);
  check('M2 no gitlab config → refused with the block to add', r.status === 2 && /gitlab\.web/.test(all(r)) && /"reviewers"/.test(all(r)), all(r));
  writeCfg({ gitlab: { web: WEB, project: PROJECT, reviewers: [{ name: 'Aaron', username: '<GitLab username>' }] } });
  r = prep(['merge-to-master', '--release', '9.9.20', '--ba-approved']);
  check('M3 placeholder username is not a reviewer → refused', r.status === 2 && /gitlab\.reviewers/.test(all(r)), all(r));
  writeCfg(goodCfg);

  r = prep(['merge-to-master', '--release', '9.9.20', '--ba-approved']);
  const s1 = state('9.9.20');
  check('M4 prepare: exit 0, phase mr-pending, nothing pushed', r.status === 0 && s1.phase === 'mr-pending' && tip('mlk/master') === master0, all(r));
  check('M5 prepare never switches みや\'s checkout and makes no tag', sh(repo, ['branch', '--show-current']) === 'mlk/hotfix/1' && !sh(repo, ['tag', '-l']), sh(repo, ['branch', '--show-current']));
  check('M6 form: exact title, counts, both reviewers, squash/delete OFF', /title\s+Release Pelupusan 9\.9\.20/.test(all(r)) && /commits\s+2 /.test(all(r)) && /files\s+2 /.test(all(r)) && /Aaron \(@aaron\)/.test(all(r)) && /Alex \(@alexk\)/.test(all(r)) && /squash\s+OFF/.test(all(r)) && /delete src\s+OFF/.test(all(r)), all(r));
  check('M7 URL pre-fills source, target and title, url-encoded', s1.mr.newUrl === `${WEB}/${PROJECT}/-/merge_requests/new?merge_request%5Bsource_branch%5D=mlk%2Frelease%2F9.9.20&merge_request%5Btarget_branch%5D=mlk%2Fmaster&merge_request%5Btitle%5D=Release%20Pelupusan%209.9.20&merge_request%5Bdescription%5D=Need%20assistance%20to%20merge.%20Thank%20you.`, s1.mr.newUrl);
  check('M7b form: fixed description', /description Need assistance to merge\. Thank you\./.test(all(r)), all(r));
  check('M8 self-audit reads the state back', /self-audit: state read back/.test(all(r)), all(r));

  r = prep(['merge-to-master', '--release', '9.9.20', '--check']);
  check('M9 --check before any MR → exit 3, says none recorded', r.status === 3 && /no MR recorded/.test(all(r)), all(r));
  r = prep(['merge-to-master', '--release', '9.9.20', '--record-mr', 'http://evil.test/gitlab/etanah/etanah-pelupusan/-/merge_requests/5', '--reviewer', 'Aaron']);
  check('M10 record-mr on another host → refused', r.status === 2 && /not a merge request of/.test(all(r)), all(r));
  r = prep(['merge-to-master', '--release', '9.9.20', '--record-mr', `${WEB}/etanah/other/-/merge_requests/5`, '--reviewer', 'Aaron']);
  check('M11 record-mr on another project → refused', r.status === 2, all(r));
  r = prep(['merge-to-master', '--release', '9.9.20', '--record-mr', `${WEB}/${PROJECT}/-/merge_requests/5`, '--reviewer', 'Bob']);
  check('M12 record-mr with a reviewer not in the list → refused', r.status === 2 && /must be one of/.test(all(r)), all(r));
  r = prep(['merge-to-master', '--release', '9.9.20', '--record-mr', `${WEB}/${PROJECT}/-/merge_requests/5`, '--reviewer', 'aaron']);
  check('M13 record-mr ok (name case-insensitive) → url + reviewer stored', r.status === 0 && state('9.9.20').mr.url.endsWith('/5') && state('9.9.20').mr.reviewer.name === 'Aaron', all(r));
  r = prep(['merge-to-master', '--release', '9.9.20', '--record-mr', `${WEB}/${PROJECT}/-/merge_requests/5`, '--reviewer', '@alexk']);
  check('M14 reviewer unavailable → re-record with the other one', r.status === 0 && state('9.9.20').mr.reviewer.name === 'Alex', all(r));
  r = prep(['merge-to-master', '--release', '9.9.20', '--ba-approved']);
  check('M15 prepare again keeps the recorded MR and warns against a second one', r.status === 0 && /do NOT open a second one/.test(all(r)) && state('9.9.20').mr.url.endsWith('/5'), all(r));
  r = prep(['merge-to-master', '--release', '9.9.20', '--check']);
  check('M16 --check before the merge → exit 3 with the MR link', r.status === 3 && /not merged yet/.test(all(r)) && /merge_requests\/5/.test(all(r)), all(r));

  const moved = commitOn('mlk/release/9.9.20', 'r3.txt', 'late\n', 'late push');
  r = prep(['merge-to-master', '--release', '9.9.20', '--check']);
  check('M17 release branch moved after prepare → refused, names the commit', r.status === 2 && /moved after the MR was prepared/.test(all(r)) && /late push/.test(all(r)), all(r));
  sh(repo, ['push', '-q', '-f', 'origin', `${relTip}:refs/heads/mlk/release/9.9.20`]);

  // reviewer merges with a merge commit, deletes the source branch
  sh(repo, ['fetch', '-q', 'origin']);
  sh(repo, ['checkout', '-q', '-B', 'mrg', 'origin/mlk/master']);
  sh(repo, ['merge', '-q', '--no-ff', '-m', "Merge branch 'mlk/release/9.9.20' into 'mlk/master'", relTip]);
  sh(repo, ['push', '-q', 'origin', 'HEAD:mlk/master', ':mlk/release/9.9.20']);
  sh(repo, ['checkout', '-q', 'mlk/hotfix/1']);
  r = prep(['merge-to-master', '--release', '9.9.20', '--check']);
  const s2 = state('9.9.20');
  check('M18 merge commit + source branch deleted → merged-to-master (ancestry on the SHA)', r.status === 0 && s2.phase === 'merged-to-master' && s2.mergeShape === 'merge-commit', all(r));
  check('M19 --check points at Phase G when stag-env lacks the release', /NEXT \(mandatory\).*stag-catchup --release 9\.9\.20/.test(all(r)), all(r));
  check('M20 local mlk/master (not checked out) follows origin', sh(repo, ['rev-parse', 'mlk/master']) === tip('mlk/master') && sh(repo, ['branch', '--show-current']) === 'mlk/hotfix/1', sh(repo, ['rev-parse', 'mlk/master']));
  r = prep(['merge-to-master', '--release', '9.9.20', '--check']);
  check('M21 --check again → already merged, exit 0', r.status === 0 && /already merged-to-master/.test(all(r)), all(r));
  r = prep(['merge-to-master', '--release', '9.9.20', '--abandon-mr']);
  check('M22 abandon after merge → refused', r.status === 2, all(r));

  // squash merge: the files arrive, the commits do not
  const sqTip = newRelease('9.9.21', [['s1.txt', 's1\n'], ['s2.txt', 's2\n']]);
  sh(repo, ['checkout', '-q', 'mlk/hotfix/1']);
  r = prep(['merge-to-master', '--release', '9.9.21', '--ba-approved']);
  check('M23 second release prepares', r.status === 0, all(r));
  sh(repo, ['fetch', '-q', 'origin']);
  sh(repo, ['checkout', '-q', '-B', 'sq', 'origin/mlk/master']);
  sh(repo, ['merge', '-q', '--squash', sqTip]); sh(repo, ['commit', '-q', '-m', 'squashed release']);
  sh(repo, ['push', '-q', 'origin', 'HEAD:mlk/master']);
  sh(repo, ['checkout', '-q', 'mlk/hotfix/1']);
  r = prep(['merge-to-master', '--release', '9.9.21', '--check']);
  check('M24 squash merge → stopped, asks for a merge commit', r.status === 2 && /squash or rebase/.test(all(r)) && state('9.9.21').phase === 'mr-pending', all(r));
  r = prep(['merge-to-master', '--release', '9.9.21', '--abandon-mr']);
  check('M25 abandon clears the MR, phase stays mr-pending', r.status === 0 && state('9.9.21').mr.url === null && state('9.9.21').phase === 'mr-pending', all(r));

  // a hotfix lands on master after the release was cut → prepare refuses
  newRelease('9.9.22', [['h1.txt', 'h1\n']]);
  commitOn('mlk/master', 'hot.txt', 'hot\n', 'Ref #200 - hotfix on master');
  sh(repo, ['checkout', '-q', 'mlk/hotfix/1']);
  r = prep(['merge-to-master', '--release', '9.9.22', '--ba-approved']);
  check('M26 master ahead of the release → refused, names the hotfix', r.status === 2 && /hotfix on master/.test(all(r)) && state('9.9.22').phase === 'pushed', all(r));

  const logRows = fs.readFileSync(path.join(__dirname, 'log.jsonl'), 'utf8').trim().split('\n').slice(-40).map(l => { try { return JSON.parse(l); } catch (_) { return {}; } });
  check('M27 log rows: prepared · recorded · waiting · ok', ['mr-prepared', 'mr-recorded', 'mr-waiting', 'mr-abandoned', 'ok'].every(k => logRows.some(x => x.cmd === 'merge-to-master' && x.result === k)), JSON.stringify(logRows.map(x => x.result)));
} catch (e) {
  check('FIXTURE setup/run crashed', false, e.message.slice(0, 400));
}

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + String(x.d).slice(-500))); }
console.log(`\nmerge-request eval: ${results.length - failed}/${results.length} green`);
process.exit(failed ? 1 : 0);
