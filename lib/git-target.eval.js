#!/usr/bin/env node
// git-target.eval.js — the "which repo" reader shared by the commit guard and the push guard.
// Pins the 2026-10-09 fix (per みや: "it was reading wrongly … please proceed"): a Git Bash style folder
// (/e/Dev/x) is the same folder as E:\Dev\x. Before the fix git could not be asked in that folder, the repo
// name came back empty, the commit guard refused a green commit (2026-10-04) and the push guard skipped its
// "another team's repo" check.
'use strict';
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const { cmdDir, repoIdentity, targetRepo, clean } = require('./git-target.js');

const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });
const WIN = process.platform === 'win32';
const bashPath = p => '/' + p[0].toLowerCase() + p.slice(2).replace(/\\/g, '/');     // C:\a\b → /c/a/b

// ── A. the folder text ──
check('A1 /e/Dev/x after cd is read as E:\\Dev\\x', !WIN || cmdDir('cd /e/Dev/x && git push origin b', 'push') === 'E:\\Dev\\x', cmdDir('cd /e/Dev/x && git push origin b', 'push'));
check('A2 git -C with a Git Bash path', !WIN || cmdDir('git -C /c/Users/a/repo push origin b', 'push') === 'C:\\Users\\a\\repo', cmdDir('git -C /c/Users/a/repo push origin b', 'push'));
check('A3 quoted, with spaces', !WIN || cmdDir('cd "/c/Users/a/One Drive/repo" && git commit -m x', 'commit') === 'C:\\Users\\a\\One Drive\\repo', cmdDir('cd "/c/Users/a/One Drive/repo" && git commit -m x', 'commit'));
check('A4 WSL style /mnt/e/x', !WIN || clean('/mnt/e/Dev/x') === 'E:\\Dev\\x', clean('/mnt/e/Dev/x'));
check('A5 Cygwin style /cygdrive/e/x', !WIN || clean('/cygdrive/e/Dev/x') === 'E:\\Dev\\x', clean('/cygdrive/e/Dev/x'));
check('A6 a bare drive /e', !WIN || clean('/e') === 'E:\\', clean('/e'));
check('A7 trailing ; is still dropped', !WIN || cmdDir('cd /e/Dev/x; git push', 'push') === 'E:\\Dev\\x', cmdDir('cd /e/Dev/x; git push', 'push'));
// negatives: nothing else is rewritten
check('A8 NEGATIVE a Windows path is unchanged', clean('E:\\Dev\\x') === 'E:\\Dev\\x', clean('E:\\Dev\\x'));
check('A9 NEGATIVE /tmp/x is not a drive', clean('/tmp/x') === '/tmp/x', clean('/tmp/x'));
check('A10 NEGATIVE /usr/bin is not a drive', clean('/usr/bin') === '/usr/bin', clean('/usr/bin'));
check('A11 NEGATIVE a relative path is unchanged', clean('./e/x') === './e/x' && clean('../etanah-awam') === '../etanah-awam', clean('./e/x'));
check('A12 NEGATIVE a network path is unchanged', clean('//server/share/x') === '//server/share/x', clean('//server/share/x'));
check('A13 NEGATIVE a shell variable is unchanged', clean('$repo') === '$repo', clean('$repo'));
check('A14 NEGATIVE no folder in the command = null', cmdDir('git push origin b', 'push') === null);

// ── B. the repo really found (a temp git repo with a remote) ──
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gt-eval-'));
const mk = (name, remote) => { const d = path.join(tmp, name); fs.mkdirSync(d, { recursive: true }); spawnSync('git', ['init', '-q', d]); if (remote) spawnSync('git', ['-C', d, 'remote', 'add', 'origin', remote]); return d; };
const common = mk('wt-neutral-name', '10.16.63.27:etanah/etanah-common.git');
const plain = mk('no-remote');
check('B1 Windows path → repo name from the remote', (repoIdentity(common) || {}).name === 'etanah-common', JSON.stringify(repoIdentity(common)));
check('B2 the same repo, Git Bash path → the same name (was empty)', !WIN || (repoIdentity(bashPath(common)) || {}).name === 'etanah-common', JSON.stringify(repoIdentity(bashPath(common))));
check('B3 targetRepo on a Git Bash cd names it and returns the Windows folder', !WIN || (() => { const t = targetRepo(`cd ${bashPath(common)} && git push origin b`, null, 'push'); return t.id && t.id.name === 'etanah-common' && t.dir === common; })(), JSON.stringify(targetRepo(`cd ${bashPath(common)} && git push origin b`, null, 'push')));
check('B4 a repo with no remote is named by its folder, both styles', (repoIdentity(plain) || {}).name === 'no-remote' && (!WIN || (repoIdentity(bashPath(plain)) || {}).name === 'no-remote'));
check('B5 NEGATIVE a folder that does not exist = no identity, no crash', repoIdentity(path.join(tmp, 'nope')) === null && repoIdentity(bashPath(path.join(tmp, 'nope'))) === null);
check('B6 NEGATIVE a shell variable = no identity, no crash', repoIdentity('$repo') === null);
check('B7 NEGATIVE empty folder text = no identity', repoIdentity('') === null && repoIdentity(null) === null);
check('B8 the tool folder is used when the command names none', (targetRepo('git push origin b', common, 'push').id || {}).name === 'etanah-common');

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ngit-target.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
