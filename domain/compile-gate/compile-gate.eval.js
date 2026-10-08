#!/usr/bin/env node
// compile-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: QA-275456 2026-08-18 — fix used mh.getBandar() (MaklumatHakmilik has none);
// never compiled; reported tested-PASSED from a green DB read; int-env BUILD failed; mlit DOWN.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const { decide } = require('./compile-gate.check.hook.js');
const HOOK = path.join(__dirname, 'compile-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean/empty input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2 (replay): a git commit in etanah-pelupusan must NOT pass on decide() alone — it must route to verify (block===null)
const d1 = decide('cd "E:/Projects/Melaka/etanah-pelupusan" && git commit -m "fix"', '');
check('F2 etanah commit routes to verify (block===null)', d1.block === null && d1.mod === 'etanah-pelupusan', JSON.stringify(d1));

// F3: bypass token in the turn → no block
const d2 = decide('cd "E:/Projects/Melaka/etanah-awam" && git commit -m "x"', 'ok [skip-compile-gate: docs only]');
check('F3 bypass token → no block', d2.block === false && d2.bypass === true, JSON.stringify(d2));

// F4: a non-commit command (status) → no block
const d3 = decide('cd "E:/Projects/Melaka/etanah-pelupusan" && git status', '');
check('F4 non-commit → pass', d3.block === false, JSON.stringify(d3));

// F5: a MemoryCore (non-etanah) commit → no block
const d4 = decide('git commit -m "DE save"', '');
check('F5 non-etanah commit → pass', d4.block === false, JSON.stringify(d4));

// F6 (regression — the self-inflicted false positive): a MemoryCore commit whose MESSAGE mentions
// etanah-pelupusan must NOT block — only a cd/-C INTO an etanah repo counts.
const d5 = decide('cd "C:/Users/x/MemoryCore/.claude/worktrees/keen" && git commit -m "build compile-gate for etanah-pelupusan commits"', '');
check('F6 message mentions etanah but cwd is MemoryCore → pass', d5.block === false, JSON.stringify(d5));

// F7: git -C into an etanah repo also detected
const d6 = decide('git -C "E:/Projects/Melaka/etanah-common" commit -m "bump"', '');
check('F7 git -C etanah repo routes to verify', d6.block === null && d6.mod === 'etanah-common', JSON.stringify(d6));

// ── v2 cases (2026-10-02, AWAM stag-env PDBB fix: worktree target, offline→online, labelled failures) ──
const fs = require('fs');
const os = require('os');
const { classify, compileErrors } = require('./compile-check.js');
const CHECK = path.join(__dirname, 'compile-check.js');
const FAKE = path.join(__dirname, 'fake-mvn.eval-fixture.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-v2-'));
function mkRepo(dir, remote) {
  fs.mkdirSync(path.join(dir, 'src', 'main', 'java'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'main', 'java', 'X.java'), 'class X {}');
  spawnSync('git', ['init', '-q', dir]);
  if (remote) spawnSync('git', ['-C', dir, 'remote', 'add', 'origin', remote]);
  return dir;
}
const awam = mkRepo(path.join(tmp, 'stag-pdbb'), '10.16.63.27:etanah/etanah-awam.git');   // worktree-style name
const memc = mkRepo(path.join(tmp, 'memorycore'), 'https://github.com/x/Project-AI-MemoryCore.git');
const cenv = (mode) => ({ ...process.env, COMPILE_GATE_MVN: `node "${FAKE}"`, FAKE_MVN_MODE: mode,
  COMPILE_GATE_STATE_DIR: path.join(tmp, 'state'), COMPILE_GATE_LOG: path.join(tmp, 'log.jsonl') });
const cc = (args, mode) => spawnSync(process.execPath, [CHECK, ...args], { encoding: 'utf8', env: cenv(mode), timeout: 60000 });
const logRows = () => { try { return fs.readFileSync(path.join(tmp, 'log.jsonl'), 'utf8').trim().split('\n').map(JSON.parse); } catch (_) { return []; } };

// F8: classify the REAL offline-miss text → dependency
const DEPTXT = 'Cannot access nexus (http://172.16.90.169/nexus/content/groups/public/) in offline mode and the artifact my.gov.etanah:etanah-common:jar:classes:1.7.21-MLK.beta.patch.282299.1 has not been downloaded from it before.';
check('F8 offline-miss text classified dependency', classify(DEPTXT) === 'dependency', classify(DEPTXT));
// F9: classify the REAL toolchain text → toolchain
check('F9 missing-JDK text classified toolchain', classify('Misconfigured toolchains.: Non-existing JDK home configuration at E:\\Java\\java8') === 'toolchain', '');
// F10: compile errors parsed to file:line, de-duplicated (maven prints the last one twice)
const errs = compileErrors('[ERROR] D:\\x\\src\\main\\java\\my\\A.java:[791,21] error: method m() is already defined\n[ERROR] D:\\x\\src\\main\\java\\my\\A.java:[791,21] error: method m() is already defined');
check('F10 compile errors parsed + de-duplicated', errs.length === 1 && errs[0] === 'my\\A.java:791 method m() is already defined', JSON.stringify(errs));
// F11: path target (worktree) offline miss → ONE online retry → green, marker + log row say online
let c = cc(['run', awam], 'dep-then-ok');
const lr = logRows().pop() || {};
check('F11 offline miss retries online once and records green', c.status === 0 && /retrying ONCE online/.test(c.stdout) && lr.outcome === 'green' && lr.mode === 'online' && typeof lr.dur_ms === 'number', 'exit=' + c.status + ' ' + c.stdout.slice(-200) + JSON.stringify(lr));
// F12: verify on the same path → green
c = cc(['verify', awam], 'ok');
check('F12 verify by path after green run passes', c.status === 0, 'exit=' + c.status + ' ' + c.stderr);
// F13: a .java edited after the green run → verify fails
const later = new Date(Date.now() + 5000); fs.utimesSync(path.join(awam, 'src', 'main', 'java', 'X.java'), later, later);
c = cc(['verify', awam], 'ok');
check('F13 .java edited after green → verify fails', c.status === 1 && /edited AFTER/.test(c.stderr), 'exit=' + c.status);
// F14: real duplicate-merge errors → KIND=compile, 3 unique errors listed with file:line (effect check on the text)
c = cc(['run', awam], 'compile');
check('F14 compile failure labelled + listed', c.status === 1 && /KIND=compile \(3 errors\)/.test(c.stderr) && /PelupusanReportService\.java:791 method getPlpLaporanBorangPDBB/.test(c.stderr), 'exit=' + c.status + ' ' + c.stderr.slice(-400));
// F15: offline AND online both miss → KIND=dependency with the VPN/nexus hint
c = cc(['run', awam], 'dep-both');
check('F15 dependency miss on both tries labelled with VPN hint', c.status === 1 && /KIND=dependency/.test(c.stderr) && /VPN/.test(c.stderr), 'exit=' + c.status + ' ' + c.stderr.slice(-200));
// F16: toolchain failure → KIND=toolchain (no online retry for it)
c = cc(['run', awam], 'toolchain');
check('F16 toolchain failure labelled, no online retry', c.status === 1 && /KIND=toolchain/.test(c.stderr) && !/retrying ONCE online/.test(c.stdout), 'exit=' + c.status);
// F17: non-etanah repo path refused with usage exit 2
c = cc(['run', memc], 'ok');
check('F17 non-etanah repo refused (exit 2)', c.status === 2 && /not an etanah git repo/.test(c.stderr), 'exit=' + c.status);
// F18: every run that reached maven wrote one log row with outcome + dur_ms (Rule 5) — F11/F14/F15/F16 = 4; F17 is refused before maven
check('F18 each maven run logged with outcome + dur_ms', logRows().filter(x => x.action === 'run' && x.outcome && typeof x.dur_ms === 'number').length === 4, JSON.stringify(logRows().length));

// Hook decisions — stubbed identity so they do not depend on this machine's repos
const ID = (map) => (cmd, cwd, verb) => { const { cmdDir } = require('../../lib/git-target.js'); const d = cmdDir(cmd, verb) || cwd; return map[d] || null; };
const stub = ID({ 'E:\\wt\\stag-pdbb': { mod: 'etanah-awam', top: 'E:\\wt\\stag-pdbb' }, 'E:\\mc': null });
// F19: `cd <worktree>; git commit` with no "etanah" in the path → routes to verify (v1: ungated)
let d = decide('cd E:\\wt\\stag-pdbb; git commit -q -m "Ref #1 - x"', '', 'E:\\mc', stub);
check('F19 worktree commit (cd-semicolon) routes to verify', d.block === null && d.mod === 'etanah-awam' && d.top === 'E:\\wt\\stag-pdbb', JSON.stringify(d));
// F20: raw mvn compile in an etanah repo → block:true, points at compile-check.js
d = decide('cd E:\\wt\\stag-pdbb; mvn -o -q compile', '', 'E:\\mc', stub);
check('F20 raw mvn compile in etanah repo blocks', d.block === true && d.rawMvn === true, JSON.stringify(d));
// F21: mvn WITH -t toolchains is allowed
d = decide('cd E:\\wt\\stag-pdbb; mvn -q -t "C:\\x\\toolchains.xml" compile', '', 'E:\\mc', stub);
check('F21 mvn with -t toolchains not blocked', d.block === false, JSON.stringify(d));
// F22: raw mvn compile outside etanah (MemoryCore cwd) ignored
d = decide('mvn -q compile', '', 'E:\\mc', stub);
check('F22 raw mvn outside etanah ignored', d.block === false, JSON.stringify(d));
// F23: raw mvn bypass token honoured
d = decide('cd E:\\wt\\stag-pdbb; mvn -o -q compile', 'ok [skip-compile-gate: testing maven itself]', 'E:\\mc', stub);
check('F23 raw mvn bypass honoured', d.block === false && d.bypass === true, JSON.stringify(d));
// F24: "git commit" only inside a quoted echo is not a commit
d = decide('echo "remember to git commit later"', '', 'E:\\wt\\stag-pdbb', stub);
check('F24 quoted "git commit" text is not a commit', d.block === false, JSON.stringify(d));
// F25: `mvn package` (deploy build) is not touched
d = decide('cd E:\\wt\\stag-pdbb; mvn -q package', '', 'E:\\mc', stub);
check('F25 mvn package not touched', d.block === false, JSON.stringify(d));
// F26: end-to-end hook (fire + effect): raw mvn in a real etanah-awam worktree-style repo → exit 2 + message names the tool
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'PowerShell', tool_input: { command: `cd ${awam}; mvn -o -q compile` }, cwd: memc }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F26 hook blocks raw mvn end-to-end with the tool command', r.status === 2 && r.stderr.includes(`compile-check.js run "${awam}"`), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
// F27: end-to-end hook: commit in that repo with no marker → blocked, message carries the repo path
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'PowerShell', tool_input: { command: `cd ${awam}; git commit -q -m "Ref #1 - x"` }, cwd: memc }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F27 hook gates a worktree commit end-to-end', r.status === 2 && /etanah-awam was NOT compiled/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));

// ── v2.1 / v2.2 cases (2026-10-05, two independent reviews): the repo is read the way the tool's SHELL reads the
//    path, every commit in the command is looked at, and "cannot tell" is said out loud ──
// Live miss 2026-10-04T08:04:57Z: `cd /e/Projects/Melaka/etanah-awam && git commit` after a green compile was
// refused with "is not an etanah git repo", and the printed remedy could not work either.
const gt = require('../../lib/git-target.js');
const msys = p => '/' + p[0].toLowerCase() + p.slice(2).replace(/\\/g, '/');
const same = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
const ctx = (cmd, shell, base, pos) => { const spans = gt.quotedSpans(cmd); return { cmd, spans, assigns: gt.assignments(cmd, spans), shell, pos: pos === undefined ? cmd.length : pos, base: base || null }; };
const rw = (text, quote, cmd, shell, base) => gt.resolveWritten(text, quote, ctx(cmd, shell, base));
// F28: how a written path is read
check('F28a Git Bash drive path is a drive path in the Bash tool', (rw('/e/Dev/x', 'bare', '', 'bash').path || '') === 'E:/Dev/x', JSON.stringify(rw('/e/Dev/x', 'bare', '', 'bash')));
check('F28b the same text in PowerShell is NOT the E: drive (it is a folder named e on the current drive)', same(rw('/e/Dev/x', 'bare', '', 'powershell', 'E:\\q').path, 'E:\\e\\Dev\\x'), JSON.stringify(rw('/e/Dev/x', 'bare', '', 'powershell', 'E:\\q')));
let c1 = "$r = 'E:\\a b\\c'; git -C $r status";
check('F28c PowerShell variable given one literal earlier in the same command', gt.resolveWritten('$r', 'bare', ctx(c1, 'powershell', null, c1.indexOf('git'))).path === 'E:\\a b\\c', JSON.stringify(gt.resolveWritten('$r', 'bare', ctx(c1, 'powershell', null, c1.indexOf('git')))));
let c2 = 'repo=/e/x; cd "$repo"';
check('F28d shell variable, quoted use', gt.resolveWritten('$repo', 'double', ctx(c2, 'bash', null, c2.indexOf('cd'))).path === 'E:/x', JSON.stringify(gt.resolveWritten('$repo', 'double', ctx(c2, 'bash', null, c2.indexOf('cd')))));
check('F28e a variable the command never sets → not resolved, with the reason', rw('$r', 'bare', 'git -C $r status', 'powershell', 'E:\\mc').path === undefined && /not set in this command/.test(rw('$r', 'bare', 'git -C $r status', 'powershell', 'E:\\mc').why), JSON.stringify(rw('$r', 'bare', 'git -C $r status', 'powershell', 'E:\\mc')));
check('F28f relative path resolved against the folder so far', same(rw('..\\b', 'bare', '', 'powershell', 'E:\\a\\c').path, 'E:\\a\\b'), '');
check('F28g relative path with no known folder → not resolved', rw('sub', 'bare', '', 'powershell', null).path === undefined, '');
check('F28h a variable inside single quotes is literal text', same(rw('$r', 'single', "$r = 'E:\\x'; cd '$r'", 'powershell', 'E:\\base').path, 'E:\\base\\$r'), JSON.stringify(rw('$r', 'single', "$r = 'E:\\x'; cd '$r'", 'powershell', 'E:\\base')));
let c3 = "$r = 'E:\\one'; git -C $r status; $r = 'E:\\two'";
check('F28i a later re-assignment is not used (position matters)', gt.resolveWritten('$r', 'bare', ctx(c3, 'powershell', null, c3.indexOf('git'))).path === 'E:\\one', '');
let c4 = "$r = 'E:\\one' + '\\x'; git -C $r status";
check('F28j a value built by an expression is not guessed', gt.resolveWritten('$r', 'bare', ctx(c4, 'powershell', null, c4.indexOf('git'))).path === undefined, JSON.stringify(gt.resolveWritten('$r', 'bare', ctx(c4, 'powershell', null, c4.indexOf('git')))));
// F29: what the reader reports for a whole command
let tr = gt.targetRepo(`cd ${msys(awam)} && git commit -m x`, memc, 'commit', 'bash');
check('F29a Bash tool, Git Bash path → the real repo identity, certain', !!tr.id && tr.id.name === 'etanah-awam' && tr.named && !tr.unresolved, JSON.stringify(tr));
tr = gt.targetRepo(`cd ${msys(awam)}; git commit -m x`, memc, 'commit', 'powershell');
check('F29b PowerShell tool, the same text → unresolved (that cd fails there), with the reason', tr.named && tr.unresolved && !tr.id && /does not exist/.test(tr.why), JSON.stringify(tr));
tr = gt.targetRepo('git -C $r commit -m x', memc, 'commit', 'powershell');
check('F29c unset variable: named + unresolved, no identity', tr.named && tr.unresolved && !tr.id, JSON.stringify(tr));
tr = gt.targetRepo('git commit -m x', awam, 'commit', 'powershell');
check('F29d no folder named: the tool folder, not "named"', !!tr.id && !tr.named && !tr.unresolved, JSON.stringify(tr));
tr = gt.targetRepo('git -c commit.gpgsign=false commit -m "x"', awam, 'commit', 'powershell');
check('F29e git -c key=value is not git -C <folder>', !!tr.id && tr.id.name === 'etanah-awam' && !tr.named, JSON.stringify(tr));
check('F29f a commit on its own line is found', gt.invokesGit('cd x\n  git commit -m "y"', 'commit') && gt.invokesGit('$o = git commit -m y', 'commit') && !gt.invokesGit('echo "git commit later"', 'commit'), '');
// end-to-end hook
const hook = (tool, command, cwd, turn) => { const tp = path.join(tmp, 't-' + Math.random().toString(36).slice(2) + '.jsonl'); fs.writeFileSync(tp, JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: turn || '' }] } }) + '\n'); return spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: tool, tool_input: { command }, cwd, transcript_path: tp }), encoding: 'utf8', timeout: 30000, env: process.env }); };
r = hook('Bash', `cd ${msys(awam)} && git commit -q -m "Ref #1 - x"`, memc);
check('F30 Bash tool, Git Bash path (the live-miss form): gated as etanah-awam, remedy names a path git can open', r.status === 2 && /etanah-awam was NOT compiled/.test(r.stderr) && !/is not an etanah git repo/.test(r.stderr) && !r.stderr.includes(`run "${msys(awam)}"`), 'exit=' + r.status + ' ' + r.stderr.slice(0, 260));
r = hook('Bash', `cd ${msys(awam)} && mvn -o -q compile`, memc);
check('F31 Bash tool, raw mvn through a Git Bash path: blocked with the tool command', r.status === 2 && /compile-check\.js run/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
c = cc(['verify', msys(awam)], 'ok');
check('F32 compile-check verify accepts a Git Bash path', !/not an etanah git repo/.test(c.stderr) && (c.status === 0 || c.status === 1), 'exit=' + c.status + ' ' + c.stderr.slice(0, 200));
r = hook('Bash', `cd ${msys(memc)} && git commit -q -m "x"`, awam);
check('F33 a non-etanah repo through a Git Bash path is not gated', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
r = hook('PowerShell', `cd ${msys(memc)}; git commit -q -m "x"`, awam);
check('F34 PowerShell tool, a Git Bash path that cannot be entered, tool folder = an etanah repo: the commit would land THERE → refused with the true reason', r.status === 2 && /cannot tell which repo this commit/.test(r.stderr) && /does not exist/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 260));
r = hook('PowerShell', `cd ${msys(awam)}; git commit -q -m "notes about etanah-pelupusan"`, memc);
check('F34b the same shape with a non-etanah tool folder and etanah only in the commit MESSAGE: not this gate\'s business', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 260));
r = hook('PowerShell', 'git -c commit.gpgsign=false commit -q -m "Ref #1 - x"', awam);
check('F35 git -c key=value commit in an etanah tool folder is gated (v2 read it as git -C and let it through)', r.status === 2 && /etanah-awam was NOT compiled/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
r = hook('PowerShell', `cd ${awam}\n  git add -A\n  git commit -q -m "Ref #1 - x"`, memc);
check('F36 a commit on its own indented line is gated', r.status === 2 && /etanah-awam was NOT compiled/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
r = hook('PowerShell', 'git -C $somewhere commit -q -m "notes"', memc);
check('F37 an unreadable folder with nothing pointing at etanah is not this gate\'s business', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
r = hook('PowerShell', 'git -C $somewhere commit -q -m "etanah notes"', memc, 'ok [skip-compile-gate: docs only, not an etanah repo]');
check('F38 the bypass token still opens the cannot-tell refusal', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
r = hook('PowerShell', `git -C "${memc}" commit -q --allow-empty -m "a"; git -C "${awam}" commit -q -m "Ref #1 - x"`, memc);
check('F39 two commits in one command: the second, in an etanah repo, is gated', r.status === 2 && /etanah-awam was NOT compiled/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
r = hook('Bash', `export r=${msys(awam)} && cd "$r" && git commit -q -m "Ref #1 - x"`, memc);
check('F40 Bash: export r=…; cd "$r"; git commit → the variable is read, the commit is gated', r.status === 2 && /etanah-awam was NOT compiled/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
r = hook('mcp__terminal__run_in_terminal', `git -C "${awam}" commit -q -m "Ref #1 - x"`, memc);
check('F41 the Terminal-panel tool is gated too', r.status === 2 && /etanah-awam was NOT compiled/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ncompile-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
