#!/usr/bin/env node
// land-on-main.eval.js — a throwaway repo with a main folder and a session worktree (both under the OS temp dir).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const CLI = path.join(__dirname, 'land-on-main.js');
const results = []; const check = (n, c, d) => results.push({ n, pass: !!c, d });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'land-eval-'));
const main = path.join(tmp, 'repo'), wt = path.join(tmp, 'repo', '.claude', 'worktrees', 'sess');
const g = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const w = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const LOGF = path.join(tmp, 'log.jsonl');
const run = (cwd, ...a) => { const x = spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env: Object.assign({}, process.env, { LAND_ON_MAIN_LOG: LOGF }), timeout: 60000 }); return { code: x.status, out: (x.stdout || '') + (x.stderr || '') }; };
const lines = (n, tag) => Array.from({ length: n }, (_, i) => `${tag} line ${i + 1}`).join('\n') + '\n';

fs.mkdirSync(main, { recursive: true });
g(main, 'init', '-q', '-b', 'main'); g(main, 'config', 'user.email', 'e@x'); g(main, 'config', 'user.name', 'eval'); g(main, 'config', 'core.autocrlf', 'false');
w(path.join(main, 'a.txt'), lines(30, 'a')); w(path.join(main, 'b.txt'), lines(5, 'b')); w(path.join(main, 'c.txt'), lines(5, 'c'));
w(path.join(main, '.gitignore'), '.claude/\n');
g(main, 'add', '-A'); g(main, 'commit', '-q', '-m', 'base');
g(main, 'worktree', 'add', '-q', '-b', 'sess', wt);
g(wt, 'config', 'user.email', 'e@x'); g(wt, 'config', 'user.name', 'eval');

// main diverges: its OWN change at the bottom of a.txt (the b4f614f6 case) and in b.txt
let a = fs.readFileSync(path.join(main, 'a.txt'), 'utf8').replace('a line 29', 'a line 29 MAIN-ONLY');
w(path.join(main, 'a.txt'), a); w(path.join(main, 'b.txt'), lines(5, 'b') + 'b main extra\n');
g(main, 'commit', '-q', '-am', 'main-only change');

// session commit 1: top of a.txt + c.txt
let sa = fs.readFileSync(path.join(wt, 'a.txt'), 'utf8').replace('a line 2\n', 'a line 2 SESSION\n');
w(path.join(wt, 'a.txt'), sa); w(path.join(wt, 'c.txt'), lines(5, 'c') + 'c session\n');
g(wt, 'commit', '-q', '-am', 'session change 1'); const c1 = g(wt, 'rev-parse', 'HEAD');

let r = run(wt, c1, '--dry-run');
const head0 = g(main, 'rev-parse', 'HEAD');
check('L1 dry run: lands cleanly, nothing committed', r.code === 0 && /DRY RUN/.test(r.out) && g(main, 'rev-parse', 'HEAD') === head0, r.out);
r = run(wt, c1);
const aMain = fs.readFileSync(path.join(main, 'a.txt'), 'utf8');
check('L2 lands: exit 0, both proofs ok', r.code === 0 && /LANDED/.test(r.out) && /ok\s+index clean/.test(r.out) && /ok\s+net change = commit change: a\.txt/.test(r.out), r.out);
check('L3 main\'s OWN change in the same file survives (the b4f614f6 regression)', /a line 29 MAIN-ONLY/.test(aMain) && /a line 2 SESSION/.test(aMain), aMain.slice(0, 200));
check('L4 main\'s change in a file the commit never touched survives', /b main extra/.test(fs.readFileSync(path.join(main, 'b.txt'), 'utf8')), '');
check('L5 main\'s index is clean after landing (the stale-index regression)', g(main, 'diff', '--cached', '--name-only') === '', g(main, 'diff', '--cached', '--name-only'));
check('L6 main\'s commit carries only the commit\'s files', g(main, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort().join(',') === 'a.txt,c.txt', g(main, 'show', '--name-only', '--format=', 'HEAD'));

// session commit 2 touches c.txt again; main has an UNSTAGED edit on it
w(path.join(wt, 'c.txt'), fs.readFileSync(path.join(wt, 'c.txt'), 'utf8') + 'c session 2\n'); g(wt, 'commit', '-q', '-am', 'session change 2'); const c2 = g(wt, 'rev-parse', 'HEAD');
w(path.join(main, 'c.txt'), fs.readFileSync(path.join(main, 'c.txt'), 'utf8') + 'other session unsaved\n');
const head1 = g(main, 'rev-parse', 'HEAD');
r = run(wt, c2);
check('L7 main has its own unstaged edit on the file → REFUSED, nothing committed, their edit kept', r.code === 2 && /REFUSED — main has its own edits/.test(r.out) && g(main, 'rev-parse', 'HEAD') === head1 && /other session unsaved/.test(fs.readFileSync(path.join(main, 'c.txt'), 'utf8')), r.out);
g(main, 'add', 'c.txt');
r = run(wt, c2);
check('L8 a staged entry on the file → REFUSED', r.code === 2 && /REFUSED — main has its own edits or staged/.test(r.out), r.out);
g(main, 'reset', '-q', '--', 'c.txt'); g(main, 'checkout', '--', 'c.txt');

// conflict: main changes the same line the session changes
w(path.join(main, 'a.txt'), fs.readFileSync(path.join(main, 'a.txt'), 'utf8').replace('a line 10\n', 'a line 10 MAIN\n')); g(main, 'commit', '-q', '-am', 'main line 10');
w(path.join(wt, 'a.txt'), fs.readFileSync(path.join(wt, 'a.txt'), 'utf8').replace('a line 10\n', 'a line 10 SESSION\n')); g(wt, 'commit', '-q', '-am', 'session line 10'); const c3 = g(wt, 'rev-parse', 'HEAD');
const head2 = g(main, 'rev-parse', 'HEAD');
r = run(wt, c3);
check('L9 the patch does not apply (same line changed on both sides) → REFUSED, main untouched', r.code === 2 && /does not apply/.test(r.out) && g(main, 'rev-parse', 'HEAD') === head2 && g(main, 'status', '--porcelain') === '', r.out);

// edge cases
g(wt, 'commit', '-q', '--allow-empty', '-m', 'empty'); const c4 = g(wt, 'rev-parse', 'HEAD');
r = run(wt, c4);
check('L10 a commit that changes no file → REFUSED', r.code === 2 && /changes no file/.test(r.out), r.out);
r = run(wt, 'deadbeef');
check('L11 an unknown commit → exit 2 with git\'s message', r.code === 2 && /land-on-main:/.test(r.out), r.out);
r = run(wt);
check('L12 no commit given → usage, exit 2', r.code === 2 && /usage/.test(r.out), r.out);
r = run(wt, c2, '--main', main);
check('L13 --main names the main folder explicitly (c.txt clean again → lands)', r.code === 0 && /LANDED/.test(r.out), r.out);
const { mainOf } = require(CLI);
check('L14 mainOf strips .claude/worktrees/<name> (Windows and POSIX separators)', mainOf(String.raw`C:\x\repo\.claude\worktrees\abc`) === String.raw`C:\x\repo` && mainOf('/x/repo/.claude/worktrees/abc/') === '/x/repo', '');
const logRows = fs.existsSync(LOGF) ? fs.readFileSync(LOGF, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
check('L15 every call writes a telemetry row (ts · commit · outcome · exit · dur_ms)', logRows.length >= 9 && logRows.every(x => x.ts && 'exit' in x && typeof x.dur_ms === 'number'), logRows.length + ' rows');

try { g(main, 'worktree', 'remove', '--force', wt); } catch (_) {}
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + String(x.d).slice(0, 400))); }
console.log('\nland-on-main.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
