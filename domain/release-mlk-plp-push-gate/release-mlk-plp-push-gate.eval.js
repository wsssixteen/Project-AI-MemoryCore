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

// v6 (2026-10-05): F10/F11/F15 used a path that does not exist (E:\x\etanah-pelupusan) and passed only because
// v5 let an unidentifiable repo through. They now point at a real fixture repo; what each one tests is unchanged.
const plp0 = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-v2-')), 'etanah-pelupusan');
mkRepo(plp0, '10.16.63.27:etanah/etanah-pelupusan.git');
// F10: `git -C <path> push` form matches (original /git\s+push/ was blind to it since birth)
r = run(pwsh('git -C ' + plp0 + ' push --force-with-lease origin mlk/release/8.8.8'));
check('F10 git -C form with no state blocks', r.status === 2 && /no pipeline state/.test(r.stderr), 'exit=' + r.status);

// F11: manual mlk/master push BANNED regardless of state (V8: master moves only via merge-to-master)
r = run(pwsh('git -C ' + plp0 + ' push origin mlk/master'));
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
r = run(pwsh('git fetch origin; git -C "' + plp0 + '" push origin HEAD:mlk/master'));
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
// F34 (spec CHANGED in v6, 2026-10-05): a named directory the gate cannot identify + a shared branch → BLOCK.
//      v5 asserted the opposite ("not treated as foreign", exit 0). In PowerShell `cd <bad>; git push` pushes
//      from the OLD directory, so an unknown repo is the unsafe case.
r = run(pw(`cd ${path.join(v5, 'nope')}; git push origin HEAD:mlk/stag-env`, ''));
check('F34 named dir that is not a repo + shared branch: blocks (fail closed), no crash', r.status === 2 && /cannot tell which repo/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 160));
// F35: pushd + & separator (cmd style) resolves
r = run(pw(`pushd ${wt} & git push origin HEAD:mlk/stag-env`, ''));
check('F35 pushd form resolves the repo', r.status === 2 && /etanah-common at/.test(r.stderr), 'exit=' + r.status);

// ── v6/v7 cases (2026-10-05). Two independent reviews proved 37 ways through the gate; every shape below is one
//    of them, or a legitimate daily shape pinned as PASS so that closing a hole cannot quietly block real work. ──
const msys = p => '/' + p[0].toLowerCase() + p.slice(2).replace(/\\/g, '/');     // C:\a\b → /c/a/b (Git Bash form)
const withCwd = (payload, cwd) => Object.assign({}, payload, { cwd });
const bsh = (command, userText) => ({ tool_name: 'Bash', tool_input: { command }, transcript_path: userText == null ? '' : transcript(userText) });
const term = (command, cwd) => ({ tool_name: 'mcp__terminal__run_in_terminal', tool_input: Object.assign({ command }, cwd ? { cwd } : {}), transcript_path: '' });
const gitq = (dir, ...a) => spawnSync('git', ['-C', dir, '-c', 'user.email=e@e', '-c', 'user.name=e', ...a], { encoding: 'utf8' });
const FOREIGN = r => r.status === 2 && /ANOTHER team/.test(r.stderr);
const UNKNOWN = r => r.status === 2 && /cannot tell which repo/.test(r.stderr);
const PASS = r => r.status === 0;
const dbg = r => 'exit=' + r.status + ' ' + String(r.stderr || '').slice(0, 170);
// extra fixture repos
const cur = path.join(v5, 'awam-on-stag');                                   // another team's repo with the SHARED branch checked out
mkRepo(cur, '10.16.63.27:etanah/etanah-common.git'); gitq(cur, 'checkout', '-q', '-b', 'mlk/stag-env');
const tk = path.join(v5, 'awam-on-ticket');                                  // another team's repo on a ticket branch
mkRepo(tk, '10.16.63.27:etanah/etanah-common.git'); gitq(tk, 'checkout', '-q', '-b', 'mlk/cr/256334');
const dollar = path.join(v5, 'awam$x');                                      // a folder name the old parser read as a variable
mkRepo(dollar, '10.16.63.27:etanah/etanah-common.git');
gitq(wt, 'checkout', '-q', '-b', 'other'); gitq(wt, 'commit', '-q', '--allow-empty', '-m', 'other'); gitq(wt, 'checkout', '-q', '-');   // a local branch at ANOTHER commit; HEAD stays at wtSha

// — Git Bash paths are read in the Bash tool, and only there —
r = run(bsh(`cd ${msys(wt)} && git push origin HEAD:mlk/stag-env`, ''));
check('F36 Bash tool, Git Bash path with cd (the real 2026-10-04 form): foreign shared push blocks', FOREIGN(r) && /etanah-common at/.test(r.stderr), dbg(r));
r = run(bsh(`git -C ${msys(wt)} push origin HEAD:mlk/int-env`, ''));
check('F37 Bash tool, Git Bash path with git -C: foreign shared push blocks', FOREIGN(r), dbg(r));
r = run(bsh(`cd ${msys(plp)} && git push origin HEAD:mlk/int-env`, ''));
check('F38 Bash tool, Git Bash path, our own repo: passes', PASS(r), dbg(r));
r = run(withCwd(pw(`cd ${msys(plp)}; git push origin HEAD:mlk/stag-env`, ''), wt));
check('F38b PowerShell tool, Git Bash path: that cd fails in PowerShell and the push would run in the tool folder → refused', UNKNOWN(r), dbg(r));
r = run(bsh(`cd ${msys(wt)} && git push origin HEAD:mlk/stag-env`, 'push it'));
check('F44 Bash tool, Git Bash path with check + approval passes', PASS(r), dbg(r));
r = run(bsh(`git -C ${msys(mc)} push origin HEAD:main`, ''));
check('F46 non-etanah repo, Git Bash path, main branch: untouched', PASS(r), dbg(r));

// — variables: substituted only when the value is certain —
r = run(pw(`$r = '${wt}'; git -C $r push origin HEAD:mlk/stag-env`, ''));
check('F39 variable given one quoted literal before the push: read, foreign push blocks', FOREIGN(r), dbg(r));
r = run(pw('git -C $r push origin HEAD:mlk/stag-env', ''));
check('F40 unset variable + shared branch: refused, with the reason and the plain form', UNKNOWN(r) && /ONE plain push/.test(r.stderr) && /not set in this command/.test(r.stderr), dbg(r));
r = run(pw('git -C $r push origin HEAD:main', ''));
check('F41 unset variable + a branch that is not state-shaped, no etanah in sight: not touched', PASS(r), dbg(r));
r = run(pw('git -C $r push origin mlk/cr/256334', ''));
check('F47 unset variable + a ticket branch: not touched', PASS(r), dbg(r));
r = run(pw('git -C $r push origin HEAD:mlk/stag-env  # RELEASE_GATE_BYPASS', 'push it'));
check('F50 unknown repo + bypass token + approval: still refused (identify the repo first)', UNKNOWN(r), dbg(r));
r = run(bsh(`r=${msys(wt)}; cd "$r" && git push origin mlk/stag-env`, ''));
check('F43 shell variable holding a Git Bash path: read, foreign push blocks', FOREIGN(r), dbg(r));
r = run(pw(`$r = '${wt}'; git -C $r push origin HEAD:mlk/stag-env; $r = '${plp}'`, ''));
check('V1 a later re-assignment does not change what the push used (position matters)', FOREIGN(r), dbg(r));
r = run(pw(`$r = '${plp}'; $r = '${wt}'; git -C $r push origin HEAD:mlk/stag-env`, ''));
check('V2 two assignments before the push: the last one before it counts', FOREIGN(r), dbg(r));
r = run(pw(`$r = '${plp}' -replace 'pelupusan','awam'; git -C $r push origin mlk/stag-env`, ''));
check('V3 a value built by an expression is not guessed: refused', UNKNOWN(r), dbg(r));
r = run(withCwd(pw(`$r = '${plp}'; cd '$r'; git push origin HEAD:mlk/stag-env`, ''), wt));
check('V4 a variable inside SINGLE quotes is literal text: refused, not read as the variable', UNKNOWN(r), dbg(r));
r = run(pw(`$env:WTX = '${wt}'; git -C $env:WTX push origin HEAD:mlk/stag-env`, ''));
check('V5 $env:NAME assigned in the same command is read from the command, not from the gate\'s own environment', FOREIGN(r), dbg(r));
r = run(pw(`$r = '${plp}'; if ($true) { $r = '${wt}' }; git -C $r push origin HEAD:mlk/stag-env`, ''));
check('V6 an assignment inside a block may or may not run: the value is not certain → refused, never guessed', UNKNOWN(r), dbg(r));
r = run(withCwd(pw('git push origin HEAD:mlk/stag-env', ''), dollar));
check('V7 the tool\'s own folder is a real path, never shell text: a folder named with $ is still identified', FOREIGN(r), dbg(r));

// — the folder: cd chains, relative paths, things that undo a cd —
r = run(withCwd(pw('cd stag-pdbb; git push origin HEAD:mlk/stag-env', ''), v5));
check('F42 relative cd resolved against the tool folder: foreign push blocks', FOREIGN(r), dbg(r));
r = run(withCwd(pw(`cd ${v5}; cd stag-pdbb; git push origin HEAD:mlk/stag-env`, ''), plp));
check('D1 a relative cd after an earlier cd builds on that cd, not on the tool folder', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${v5}" -C stag-pdbb push origin mlk/stag-env`, ''));
check('D2 two -C in a row are followed in order', FOREIGN(r), dbg(r));
r = run(pw('cd /q/does/not/exist && git push origin HEAD:mlk/stag-env', ''));
check('F45 missing folder + shared branch: refused', UNKNOWN(r), dbg(r));
r = run(withCwd(pw(`Push-Location "${mc}"; Get-ChildItem | Out-Null; Pop-Location; git push origin HEAD:mlk/stag-env`, ''), wt));
check('D3 Pop-Location before the push: the earlier cd no longer holds → refused (tool folder is another team\'s repo)', UNKNOWN(r), dbg(r));
r = run(pw(`Push-Location "${plp}"; git push origin HEAD:mlk/int-env; Pop-Location; Push-Location "${wt}"; git push origin HEAD:mlk/int-env; Pop-Location`, ''));
check('D4 an absolute cd after a Pop-Location is certain again: the SECOND push is judged in its own folder', FOREIGN(r), dbg(r));
r = run(pw(`cd ${wt}; Write-Host '; cd ${plp}'; git push origin HEAD:mlk/stag-env`, ''));
check('D5 a cd inside a quoted string is text, not a move', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${plp}" worktree add -q -b wtnew "${path.join(v5, 'wt-new')}" HEAD; git -C "${path.join(v5, 'wt-new')}" push origin HEAD:mlk/int-env`, ''));
check('D6 a folder the same command creates does not exist yet: refused, and the reason says so', UNKNOWN(r) && /created by this same command/.test(r.stderr), dbg(r));
r = run(pw(`git --git-dir="${path.join(wt, '.git')}" push origin HEAD:mlk/stag-env`, ''));
check('D7 git --git-dir: refused (the gate does not follow it)', UNKNOWN(r), dbg(r));
r = run(withCwd(pw('git push origin HEAD:mlk/int-env', ''), wt));
check('F48 bare git push in a foreign tool folder: blocks', FOREIGN(r), dbg(r));
r = run(withCwd(pw('git push origin HEAD:mlk/int-env', ''), v5));
check('F49 bare git push, tool folder not a repo: not touched, no crash', PASS(r), dbg(r));

// — how the push is written: every one of these was invisible before v7 —
r = run(pw(`cd ${wt}\ngit fetch origin\ngit push origin HEAD:mlk/stag-env`, ''));
check('W1 a push on its own line (newline is the only separator)', FOREIGN(r), dbg(r));
r = run(pw(`# merge to staging\r\n  git -C "${wt}" push origin HEAD:mlk/stag-env`, ''));
check('W2 an indented push after a comment line, CRLF', FOREIGN(r), dbg(r));
r = run(withCwd(pw('$out = git push origin HEAD:mlk/stag-env 2>&1; $out', ''), wt));
check('W3 a push whose output is assigned to a variable', FOREIGN(r), dbg(r));
r = run(withCwd(pw('if ($LASTEXITCODE -eq 0) { git push origin HEAD:mlk/stag-env }', ''), wt));
check('W4 a push inside an if block', FOREIGN(r), dbg(r));
r = run(withCwd(pw('try { git push origin HEAD:mlk/stag-env } catch { $_ }', ''), wt));
check('W5 a push inside try { }', FOREIGN(r), dbg(r));
r = run(withCwd(pw('(git push origin HEAD:mlk/stag-env)', ''), wt));
check('W6 a push inside parentheses', FOREIGN(r), dbg(r));
r = run(pw(`git.exe -C "${wt}" push origin HEAD:mlk/stag-env`, ''));
check('W7 git.exe', FOREIGN(r), dbg(r));
r = run(pw(`& git -C "${wt}" push origin HEAD:mlk/stag-env`, ''));
check('W8 the call operator & git', FOREIGN(r), dbg(r));
r = run(bsh(`GIT_TRACE=0 git -C ${msys(wt)} push origin mlk/stag-env`, ''));
check('W9 an environment prefix before git', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" -c push.default=current push origin mlk/stag-env`, ''));
check('W10 an option between -C and push', FOREIGN(r), dbg(r));
r = run(pw(`git -c http.sslVerify=false -C "${wt}" push origin mlk/stag-env`, ''));
check('W11 -c before -C', FOREIGN(r), dbg(r));
r = run(pw(`git --no-pager -C "${wt}" push origin mlk/stag-env`, ''));
check('W12 --no-pager before -C', FOREIGN(r), dbg(r));
r = run(withCwd(pw('git -c http.sslVerify=false push origin HEAD:mlk/int-env', ''), plp));
check('W13 git -c key=value is NOT git -C <folder>: our own repo, passes', PASS(r), dbg(r));
r = run(withCwd(pw('git -c http.sslVerify=false push origin HEAD:mlk/int-env', ''), wt));
check('W14 the same command in a foreign tool folder blocks', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${plp}" push origin mlk/qa/123456; git -C "${wt}" push origin HEAD:mlk/stag-env`, ''));
check('W15 two pushes in one command: the second one is judged too', FOREIGN(r), dbg(r));
r = run(pw(`bash -lc "cd ${msys(wt)} && git push origin mlk/stag-env"`, ''));
check('W16 a push inside a string handed to bash: refused (the gate cannot follow it)', UNKNOWN(r) && /inside a quoted string/.test(r.stderr), dbg(r));
r = run(pw(`pwsh -NoProfile -c "cd ${wt}; git push origin mlk/stag-env"`, ''));
check('W17 a push inside a string handed to pwsh: refused', UNKNOWN(r), dbg(r));
r = run(withCwd(bsh(`bash <<'EOF'\ngit push origin HEAD:mlk/stag-env\nEOF`, ''), wt));
check('W18 a push inside a heredoc fed to bash: refused', UNKNOWN(r), dbg(r));
r = run(term(`git -C "${wt}" push origin HEAD:mlk/stag-env`));
check('W19 the Terminal-panel tool is inspected too', FOREIGN(r), dbg(r));
r = run(withCwd(term('git push origin HEAD:mlk/stag-env', wt), mc));
check('W20 the Terminal-panel tool\'s own cwd is used', FOREIGN(r), dbg(r));

// — what is pushed where —
r = run(pw(`git -C "${cur}" push`, ''));
check('T1 a bare push with the shared branch checked out (no branch written anywhere)', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${cur}" push origin`, ''));
check('T2 git push origin, shared branch checked out', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${cur}" push -u origin HEAD`, ''));
check('T3 git push -u origin HEAD, shared branch checked out', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${tk}" push`, ''));
check('T4 a bare push on a ticket branch in another team\'s repo: passes', PASS(r), dbg(r));
r = run(pw(`git -C "${tk}" push -u origin HEAD`, ''));
check('T5 git push -u origin HEAD on a ticket branch: passes', PASS(r), dbg(r));
r = run(pw(`git -C "${wt}" push --all origin`, ''));
check('T6 --all in another team\'s repo', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" push --mirror origin`, ''));
check('T7 --mirror in another team\'s repo', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" push origin HEAD:trg/stag-env`, ''));
check('T8 another state\'s environment branch (trg/stag-env)', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" push origin HEAD:prk/master`, ''));
check('T9 another state\'s master (prk/master)', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" push origin HEAD:mlk/beta`, ''));
check('T10 any non-ticket branch in another team\'s repo (mlk/beta)', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" push origin HEAD:refs/heads/mlk/stag-env`, ''));
check('T11 the long refs/heads form', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" push origin +mlk/stag-env`, ''));
check('T12 a forced refspec (+branch)', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" push origin --delete mlk/stag-env`, ''));
check('T13 deleting a shared branch', FOREIGN(r) && /DELETE/.test(r.stderr), dbg(r));
r = run(pw(`git -C "${wt}" push origin :mlk/stag-env`, ''));
check('T14 deleting with the :branch form', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" push origin $b`, ''));
check('T15 a branch held in a variable in another team\'s repo', FOREIGN(r), dbg(r));
r = run(pw(`git -C "${wt}" push origin mlk/cr/256334 2>&1 | Select-Object -Last 3`, ''));
check('T16 a ticket branch with a redirection and a pipe: passes (the redirection is not a branch)', PASS(r), dbg(r));
r = run(pw(`git -C "${wt}" push origin other:mlk/stag-env`, 'push it'));
check('T17 the check must cover the commit really pushed: a report for HEAD does not open a push of another branch', FOREIGN(r) && /❌ full check/.test(r.stderr), dbg(r));
r = run(pw(`git -C "${wt}" push origin HEAD:mlk/stag-env`, 'push it'));
check('T18 the same repo, HEAD, with its report + approval: passes', PASS(r), dbg(r));
r = run(withCwd(pw('git stash push -m wip', ''), wt));
check('T19 git stash push is not a push', PASS(r), dbg(r));

// — daily legitimate shapes, pinned as PASS —
r = run(withCwd(pw('git push origin HEAD:main', ''), mc));
check('P1 MemoryCore: git push origin HEAD:main', PASS(r), dbg(r));
r = run(withCwd(pw('git add -A; git commit -m "handover: baseline 1.6.4 (mlk/release/1.6.4) pushed"; git push origin HEAD:main', ''), mc));
check('P2 MemoryCore: a commit message that names a release branch does not block the push after it', PASS(r), dbg(r));
r = run(pw(`$main = '${mc}'; git -C "$main" push origin HEAD:main`, ''));
check('P3 MemoryCore through a variable set in the same command', PASS(r), dbg(r));
r = run(pw(`git -C "${plp}" push origin mlk/qa/123456`, ''));
check('P4 our own repo, ticket branch', PASS(r), dbg(r));
r = run(pw(`cd ${plp}\ngit fetch origin\ngit merge --no-ff origin/mlk/qa/123456 -m "Merge"\ngit push origin HEAD:mlk/int-env`, ''));
check('P5 our own repo, multi-line merge then push to int-env', PASS(r), dbg(r));
r = run(pw('git -C $x push origin feature/login', ''));
check('P6 an unknown repo pushing a plain project branch: not our business', PASS(r), dbg(r));
r = run(pw(`node core/slips.js add --category gate --evidence "(cd /e/Dev/x && git push origin HEAD:mlk/stag-env) went through unchecked" --caught-by gate`, ''));
check('P7 a push that is only mentioned inside a quoted argument is text', PASS(r), dbg(r));
r = run(withCwd(bsh(`cat <<'EOF'\ngit push origin HEAD:mlk/stag-env\nEOF`, ''), wt));
check('P8 a push written inside a heredoc that is only printed is text', PASS(r), dbg(r));
r = run(pw(`git -C "${plp}" push origin HEAD:mlk/master`, ''));
check('P9 the mlk/master ban on our own repo still holds', r.status === 2 && /mlk\/master is BANNED/.test(r.stderr), dbg(r));
try { fs.rmSync(path.dirname(plp0), { recursive: true, force: true }); } catch (_) {}
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
