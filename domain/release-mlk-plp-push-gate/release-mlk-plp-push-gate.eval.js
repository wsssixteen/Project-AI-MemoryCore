#!/usr/bin/env node
// release-mlk-plp-push-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: manual git push origin mlk/release/1.0.9 attempted before merge-verification passed
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'release-mlk-plp-push-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-gate-eval-'));
const env = { ...process.env, RELEASE_MLK_PLP_STATE_DIR: stateDir };
function run(payload) {
  return spawnSync(process.execPath, [HOOK], { input: JSON.stringify(payload), encoding: 'utf8', timeout: 30000, env });
}
function bash(command) { return { tool_name: 'Bash', tool_input: { command } }; }
function writeState(ver, phase) {
  fs.writeFileSync(path.join(stateDir, `release-${ver}.json`), JSON.stringify({ release: ver, phase }));
}

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2 REPLAY: push with NO pipeline state → BLOCK (exit 2)
r = run(bash('git push origin mlk/release/1.0.9'));
check('F2 replay: push with no state blocks (exit 2)', r.status === 2 && /no pipeline state/.test(r.stderr), 'exit=' + r.status + ' stderr=' + r.stderr.slice(0, 80));

// F3: state phase=merged (verify not passed) → BLOCK
writeState('1.0.9', 'merged');
r = run(bash('git push -u origin mlk/release/1.0.9'));
check('F3 phase=merged blocks', r.status === 2 && /phase "merged"/.test(r.stderr), 'exit=' + r.status);

// F4: state phase=verified → ALLOW
writeState('1.0.9', 'verified');
r = run(bash('git push -u origin mlk/release/1.0.9'));
check('F4 phase=verified passes', r.status === 0, 'exit=' + r.status + ' stderr=' + r.stderr.slice(0, 80));

// F5: malformed release ref (mlk/release/fat) → BLOCK
r = run(bash('git push origin mlk/release/fat'));
check('F5 malformed ref blocks', r.status === 2 && /does not match/.test(r.stderr), 'exit=' + r.status);

// F6: non-release push → NOT fired (exit 0)
r = run(bash('git push origin mlk/qa/262762'));
check('F6 non-release push ignored', r.status === 0, 'exit=' + r.status);

// F7 (v4): self-typed bypass token WITHOUT miya's approval → BLOCK (the 2026-09-30 #256334 form)
r = run(bash('git push origin mlk/release/7.7.7  # RELEASE_GATE_BYPASS'));
check('F7 self-typed bypass without approval blocks', r.status === 2 && /only counts when miya/.test(r.stderr), 'exit=' + r.status);

// F8: non-Bash tool → NOT fired
r = run({ tool_name: 'Edit', tool_input: { file_path: 'x' } });
check('F8 non-Bash tool ignored', r.status === 0, 'exit=' + r.status);

// ── v2 cases (2026-08-19/20, baseline-1.3.5 incident) ──
function pwsh(command) { return { tool_name: 'PowerShell', tool_input: { command } }; }

// F9: PowerShell tool is inspected too (the incident's manual pushes used PowerShell)
r = run(pwsh('git push origin mlk/release/1.0.9'));
check('F9 PowerShell release push (phase=verified) passes like Bash', r.status === 0, 'exit=' + r.status);

// 2026-10-09 (v6): F10, F11 and F15 name a folder, so it must be one the guard can NAME: a real fixture repo whose remote
// is etanah-pelupusan. A named folder that cannot be named is refused with its own reason now (F34, F42).
const plpEarly = fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-plp-'));
spawnSync('git', ['init', '-q', plpEarly]); spawnSync('git', ['-C', plpEarly, 'remote', 'add', 'origin', '10.16.63.27:etanah/etanah-pelupusan.git']);
// F10: `git -C <path> push` form matches (original /git\s+push/ was blind to it since birth)
r = run(pwsh(`git -C "${plpEarly}" push --force-with-lease origin mlk/release/8.8.8`));
check('F10 git -C form with no state blocks', r.status === 2 && /no pipeline state/.test(r.stderr), 'exit=' + r.status);

// F11: manual mlk/master push BANNED regardless of state (V8: master moves only via merge-to-master)
r = run(pwsh(`git -C "${plpEarly}" push origin mlk/master`));
check('F11 manual mlk/master push blocks', r.status === 2 && /mlk\/master is BANNED/.test(r.stderr), 'exit=' + r.status);

// F12: MemoryCore-style push untouched by the master ban
r = run(pwsh('git push origin HEAD:main'));
check('F12 HEAD:main push ignored', r.status === 0, 'exit=' + r.status);

// ── v3 cases (2026-09-23, #280176 DE: two false blocks on non-git commands) ──
// F13: free text in a quoted argument mentioning "push" + mlk/master is NOT a push → ignored
r = run(pwsh('node core/forge.js new check x --signal "a git push into mlk/master is BLOCKED"'));
check('F13 quoted free text mentioning push + mlk/master ignored', r.status === 0, 'exit=' + r.status + ' stderr=' + r.stderr.slice(0, 80));
// F14: slips.js evidence text mentioning push of mlk/master → ignored
r = run(pwsh('node core/slips.js add --evidence "manual push of mlk/master blocked"'));
check('F14 slips evidence text ignored', r.status === 0, 'exit=' + r.status);
// F15: real chained push to mlk/master after a separator → still BLOCKED
r = run(pwsh(`git fetch origin; git -C "${plpEarly}" push origin HEAD:mlk/master`));
check('F15 chained real mlk/master push still blocks', r.status === 2 && /mlk\/master is BANNED/.test(r.stderr), 'exit=' + r.status);

// ── v4 cases (2026-09-30, #256334 AWAM: pushed to another team's release branch twice, self-bypassed) ──
const fDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-foreign-'));
env.FOREIGN_CHECK_STATE_DIR = fDir;
const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'etanah-common-'));
spawnSync('git', ['init', '-q', repoDir]); spawnSync('git', ['-C', repoDir, '-c', 'user.email=e@e', '-c', 'user.name=e', 'commit', '-q', '--allow-empty', '-m', 'x']);
const sha = spawnSync('git', ['-C', repoDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
function transcript(userText) {
  const tp = path.join(fDir, `t-${Math.random().toString(36).slice(2)}.jsonl`);
  fs.writeFileSync(tp, JSON.stringify({ type: 'user', message: { role: 'user', content: userText } }) + '\n');
  return tp;
}
function pw(command, userText) { return { tool_name: 'PowerShell', tool_input: { command }, transcript_path: userText == null ? '' : transcript(userText) }; }
const push = `git -C "${repoDir}" push origin HEAD:mlk/release/1.11.1`;
// F16: foreign repo, no report, no approval → BLOCK
r = run(pw(push, 'lets do the merging ourselves'));
check('F16 foreign push, no check + no approval blocks', r.status === 2 && /ANOTHER team/.test(r.stderr), 'exit=' + r.status);
// F17: foreign repo, approval but no report → BLOCK
r = run(pw(push, 'ok push it'));
check('F17 foreign push, approval but no full check blocks', r.status === 2 && /❌ full check/.test(r.stderr), 'exit=' + r.status);
// F18: foreign repo, report but no approval → BLOCK
fs.writeFileSync(path.join(fDir, `foreign-check-${sha}.json`), '{}');
r = run(pw(push, 'check the code please'));
check('F18 foreign push, check but no approval blocks', r.status === 2 && /❌ miya/.test(r.stderr), 'exit=' + r.status);
// F19: foreign repo, report + approval → ALLOW
r = run(pw(push, 'go ahead and push'));
check('F19 foreign push, check + approval passes', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 120));
// F20: angry question containing "push" is NOT approval
r = run(pw(push, 'who the fuck asks you to push to release branch'));
check('F20 "who asks you to push" is not approval', r.status === 2, 'exit=' + r.status);
// F21: bypass token does not open a foreign push without approval
r = run(pw(push + '  # RELEASE_GATE_BYPASS', 'why did you push'));
check('F21 bypass token cannot open foreign push', r.status === 2, 'exit=' + r.status);
// F22: foreign repo, own ticket branch → not a shared branch → ignored
r = run(pw(`git -C "${repoDir}" push origin mlk/cr/256334`, ''));
check('F22 foreign own-ticket branch push ignored', r.status === 0, 'exit=' + r.status);
// F23: foreign stag-env push gated too
r = run(pw(`git -C "${repoDir}" push origin HEAD:mlk/stag-env`, ''));
check('F23 foreign stag-env push blocks', r.status === 2, 'exit=' + r.status);
// F24: report for an OLDER sha does not count after a new commit
spawnSync('git', ['-C', repoDir, '-c', 'user.email=e@e', '-c', 'user.name=e', 'commit', '-q', '--allow-empty', '-m', 'y']);
r = run(pw(push, 'go ahead and push'));
check('F24 stale report (older HEAD) blocks', r.status === 2 && /❌ full check/.test(r.stderr), 'exit=' + r.status);
// F25: "don't push" is not approval
r = run(pw(push + '  # RELEASE_GATE_BYPASS', "don't push it yet"));
check('F25 negated "don\'t push it" is not approval', r.status === 2, 'exit=' + r.status);

// ── v5 cases (2026-10-02, AWAM stag-env PDBB fix: repo named by its origin remote, not its folder) ──
function mkRepo(dir, remote) {
  fs.mkdirSync(dir, { recursive: true });
  spawnSync('git', ['init', '-q', dir]);
  spawnSync('git', ['-C', dir, '-c', 'user.email=e@e', '-c', 'user.name=e', 'commit', '-q', '--allow-empty', '-m', 'x']);
  if (remote) spawnSync('git', ['-C', dir, 'remote', 'add', 'origin', remote]);
  return spawnSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
}
const v5 = fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-v5-'));
const wt = path.join(v5, 'stag-pdbb');                                   // worktree-style name, no "etanah" anywhere
const wtSha = mkRepo(wt, '10.16.63.27:etanah/etanah-common.git');
const plp = path.join(v5, 'etanah-work', 'etanah-pelupusan');            // the path that used to read as foreign
mkRepo(plp, '10.16.63.27:etanah/etanah-pelupusan.git');
const mc = path.join(v5, 'memorycore');
mkRepo(mc, 'https://github.com/x/Project-AI-MemoryCore.git');
// F26: `cd X; git push` (the 2026-10-02 form) → blocked, reason names etanah-awam and the path WITHOUT the ";"
r = run(pw(`cd ${wt}; git push origin HEAD:mlk/stag-env`, 'short version go'));
check('F26 cd-semicolon form: blocks and names the clean path', r.status === 2 && r.stderr.includes(`etanah-common at ${wt})`) && !r.stderr.includes(`${wt};`), 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
// F27: worktree whose folder name has no "etanah" but whose remote is etanah-awam → still foreign (old gate: missed)
r = run(pw(`git -C "${wt}" push origin HEAD:mlk/stag-env`, ''));
check('F27 remote identity: etanah-awam worktree with neutral folder name is foreign', r.status === 2 && /ANOTHER team/.test(r.stderr), 'exit=' + r.status);
// F28: pelupusan repo under an "etanah-work" parent folder is NOT foreign (old gate: false block)
r = run(pw(`cd ${plp}; git push origin HEAD:mlk/stag-env`, ''));
check('F28 pelupusan under etanah-work parent is not foreign', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
// F29: Set-Location -LiteralPath form resolves too
r = run(pw(`Set-Location -LiteralPath "${wt}"; git push origin HEAD:mlk/int-env`, ''));
check('F29 Set-Location -LiteralPath form blocks foreign int-env push', r.status === 2 && /etanah-common at/.test(r.stderr), 'exit=' + r.status);
// F30: cd-semicolon form with report + approval → passes (the semicolon no longer breaks the sha lookup)
fs.writeFileSync(path.join(fDir, `foreign-check-${wtSha}.json`), '{}');
r = run(pw(`cd ${wt}; git push origin HEAD:mlk/stag-env`, 'push it'));
check('F30 cd-semicolon form with check + approval passes', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
// F31: two cds — the one before the push wins (non-etanah repo) → not foreign
r = run(pw(`cd ${wt} && git fetch && cd ${mc}; git push origin HEAD:mlk/stag-env`, ''));
check('F31 last cd before the push decides the repo', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
// F32: -C on the push beats an earlier cd
r = run(pw(`cd ${mc}; git -C "${wt}" push origin HEAD:mlk/stag-env`, ''));
check('F32 git -C on the push beats an earlier cd', r.status === 2 && /etanah-common at/.test(r.stderr), 'exit=' + r.status);
// F33: a cd mentioned only inside a quoted commit message after the push is ignored
r = run(pw(`git -C "${mc}" push origin HEAD:mlk/stag-env  # note "cd ${wt}"`, ''));
check('F33 cd inside trailing text does not redirect the push', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
// F34 (changed 2026-10-09, v6): a folder the guard cannot name + a SHARED branch used to pass unchecked — that was the
// hole. It is refused now, with the reason and the remedy. The same folder + a ticket branch still passes (F34b).
r = run(pw(`cd ${path.join(v5, 'nope')}; git push origin HEAD:mlk/stag-env`, ''));
check('F34 non-repo dir + shared branch: refused with the plain reason, no crash', r.status === 2 && /could not name the repo/.test(r.stderr) && /Write the folder plainly/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
r = run(pw(`cd ${path.join(v5, 'nope')}; git push origin mlk/esokongan/123456`, ''));
check('F34b NEGATIVE non-repo dir + ticket branch: passes, no crash', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
// F35: pushd + & separator (cmd style) resolves
r = run(pw(`pushd ${wt} & git push origin HEAD:mlk/stag-env`, ''));
check('F35 pushd form resolves the repo', r.status === 2 && /etanah-common at/.test(r.stderr), 'exit=' + r.status);

// ── v6 (2026-10-09, per みや: "it was reading wrongly … please proceed"): a Git Bash style folder (/c/a/b) is read as
//    the same folder, and a push to a shared branch from a folder the guard cannot name is refused ──
if (process.platform === 'win32') {
  const bashPath = p => '/' + p[0].toLowerCase() + p.slice(2).replace(/\\/g, '/');
  const bashT = (command, userText) => ({ tool_name: 'Bash', tool_input: { command }, transcript_path: userText == null ? '' : transcript(userText) });
  fs.rmSync(path.join(fDir, `foreign-check-${wtSha}.json`), { force: true });
  r = run(bashT(`cd ${bashPath(wt)} && git push origin HEAD:mlk/stag-env`, ''));
  check('F36 Git Bash style cd: another team\'s repo is recognised and blocked (was: passed unchecked)', r.status === 2 && /ANOTHER team/.test(r.stderr) && r.stderr.includes(`etanah-common at ${wt})`), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
  r = run(bashT(`git -C "${bashPath(wt)}" push origin HEAD:mlk/int-env`, ''));
  check('F37 Git Bash style git -C: blocked the same way', r.status === 2 && /etanah-common at/.test(r.stderr), 'exit=' + r.status);
  r = run(bashT(`cd ${bashPath(plp)} && git push origin HEAD:mlk/stag-env`, ''));
  check('F38 NEGATIVE our own repo in Git Bash style passes', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
  r = run(bashT(`cd ${bashPath(mc)} && git push origin HEAD:main`, ''));
  check('F39 NEGATIVE a non-etanah repo in Git Bash style passes', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
  r = run(bashT(`cd ${bashPath(wt)} && git push origin HEAD:mlk/stag-env`, 'push it'));
  check('F40 NEGATIVE approval alone is not enough: the check report for this commit is still needed', r.status === 2 && /ANOTHER team/.test(r.stderr), 'exit=' + r.status);
  fs.writeFileSync(path.join(fDir, `foreign-check-${wtSha}.json`), '{}');
  r = run(bashT(`cd ${bashPath(wt)} && git push origin HEAD:mlk/stag-env`, 'push it'));
  check('F41 Git Bash style with report + approval passes (the commit is found through the converted folder)', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
}
r = run(pw('git -C $repo push origin HEAD:mlk/stag-env', ''));
check('F42 a shell variable as the folder + shared branch: refused, the reason says how to write it', r.status === 2 && /could not name the repo/.test(r.stderr) && /Write the folder plainly/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
r = run(pw('git -C $repo push origin HEAD:mlk/stag-env  # RELEASE_GATE_BYPASS', 'push it'));
check('F43 NEGATIVE no bypass token and no approval opens the unknown-repo refusal', r.status === 2 && /could not name the repo/.test(r.stderr), 'exit=' + r.status);
r = run(pw('git -C $repo push origin mlk/esokongan/123456', ''));
check('F44 NEGATIVE unknown folder + a ticket branch passes', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
r = run(pw('git -C $m push origin HEAD:main', ''));
check('F45 NEGATIVE unknown folder + main (a MemoryCore push) passes', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
r = run(pw('git -C $repo push origin HEAD:mlk/release/1.11.1', ''));
check('F46 unknown folder + a release branch: refused', r.status === 2 && /could not name the repo/.test(r.stderr), 'exit=' + r.status);
r = run(pw(`node x.js "note: git -C $repo push origin HEAD:mlk/stag-env"`, ''));
check('F47 NEGATIVE the same words inside a quoted argument are not a push', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
try { fs.rmSync(v5, { recursive: true, force: true }); } catch (_) {}

try { fs.rmSync(fDir, { recursive: true, force: true }); fs.rmSync(repoDir, { recursive: true, force: true }); } catch (_) {}

try { fs.rmSync(stateDir, { recursive: true, force: true }); } catch (_) {}

// ── own repos (2026-10-06 per miya): etanah-awam is pushed by us like etanah-pelupusan ──
{
  const own = fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-own-'));
  const aw = path.join(own, 'awam-wt');
  fs.mkdirSync(aw, { recursive: true }); spawnSync('git', ['init', '-q', aw]);
  spawnSync('git', ['-C', aw, '-c', 'user.email=e@e', '-c', 'user.name=e', 'commit', '-q', '--allow-empty', '-m', 'x']);
  spawnSync('git', ['-C', aw, 'remote', 'add', 'origin', '10.16.63.27:etanah/etanah-awam.git']);
  r = run(pw(`git -C "${aw}" push origin HEAD:mlk/stag-env`, null));
  check('OWN1 etanah-awam push to mlk/stag-env passes with no check and no approval', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
  r = run(pw(`git -C "${aw}" push origin HEAD:mlk/int-env`, null));
  check('OWN2 etanah-awam push to mlk/int-env passes', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
  r = run(pw(`git -C "${aw}" push origin HEAD:mlk/master`, null));
  check('OWN3 the mlk/master ban holds for etanah-awam too', r.status === 2 && /mlk\/master is BANNED/.test(r.stderr), 'exit=' + r.status);
  try { fs.rmSync(own, { recursive: true, force: true }); } catch (_) {}
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nrelease-mlk-plp-push-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
