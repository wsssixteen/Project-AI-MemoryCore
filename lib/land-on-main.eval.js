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
// --except-dirty: one clean file + one file main has its own UNSTAGED edit on (different lines)
w(path.join(wt, 'b.txt'), fs.readFileSync(path.join(wt, 'b.txt'), 'utf8').replace('b line 1\n', 'b line 1 SESSION\n'));
w(path.join(wt, 'd.txt'), 'd session file\n');
g(wt, 'add', '-A'); g(wt, 'commit', '-q', '-m', 'session change 5'); const c5 = g(wt, 'rev-parse', 'HEAD');
w(path.join(main, 'b.txt'), fs.readFileSync(path.join(main, 'b.txt'), 'utf8') + 'other session unsaved b\n');
const head3 = g(main, 'rev-parse', 'HEAD');
r = run(wt, c5, '--except-dirty');
const bNow = fs.readFileSync(path.join(main, 'b.txt'), 'utf8');
check('L16 --except-dirty: the clean file is committed, proofs ok', r.code === 0 && /LANDED/.test(r.out) && g(main, 'show', '--name-only', '--format=', 'HEAD') === 'd.txt' && g(main, 'rev-parse', 'HEAD') !== head3, r.out);
check('L17 --except-dirty: the dirty file gets ONLY this commit\'s lines, main\'s own edit kept, NOT committed', /b line 1 SESSION/.test(bNow) && /other session unsaved b/.test(bNow) && /b main extra/.test(bNow) && /^M b.txt$/.test(g(main, 'status', '--porcelain', '--', 'b.txt')) /* g() trims, so the leading status space is gone: M = unstaged only */ && /b\.txt: this commit's lines added/.test(r.out), r.out + '\n' + bNow);
check('L18 --except-dirty leaves main\'s index clean', g(main, 'diff', '--cached', '--name-only') === '', g(main, 'diff', '--cached', '--name-only'));
g(main, 'checkout', '--', 'b.txt');
w(path.join(wt, 'b.txt'), fs.readFileSync(path.join(wt, 'b.txt'), 'utf8').replace('b line 2\n', 'b line 2 S6\n')); g(wt, 'commit', '-q', '-am', 'session change 6'); const c6 = g(wt, 'rev-parse', 'HEAD');
w(path.join(main, 'b.txt'), fs.readFileSync(path.join(main, 'b.txt'), 'utf8') + 'staged by another session\n'); g(main, 'add', 'b.txt');
r = run(wt, c6, '--except-dirty');
check('L19 --except-dirty never touches a STAGED file: reported, exit 1, file unchanged', r.code === 1 && /staged entry in main: left untouched/.test(r.out) && !/b line 2 S6/.test(fs.readFileSync(path.join(main, 'b.txt'), 'utf8')), r.out);
g(main, 'reset', '-q', '--', 'b.txt'); g(main, 'checkout', '--', 'b.txt');
// append-only .jsonl: a base file on both sides, then main holds another session's unsaved row at the end (the 8f25aea7 case)
const eM = path.join(main, 'e.jsonl'), eW = path.join(wt, 'e.jsonl'), rd = (p) => fs.readFileSync(p, 'utf8');
w(eW, '{"r":1}\n{"r":2}\n'); g(wt, 'add', 'e.jsonl'); g(wt, 'commit', '-q', '-m', 'e base'); const c7 = g(wt, 'rev-parse', 'HEAD');
r = run(wt, c7);
check('L20 a new .jsonl lands on a clean main (base for the append-only cases)', r.code === 0 && /LANDED/.test(r.out), r.out);
w(eW, rd(eW) + '{"r":"s1"}\n{"r":"s2"}\n'); g(wt, 'commit', '-q', '-am', 'e session rows'); const c8 = g(wt, 'rev-parse', 'HEAD');
w(eM, rd(eM) + '{"r":"other unsaved"}\n');
r = run(wt, c8, '--except-dirty');
check('L21 append-only .jsonl under main\'s unsaved tail: the commit\'s rows appended after it, main\'s row kept, NOT committed', r.code === 0 && /appended 2, already had 0/.test(r.out) && rd(eM) === '{"r":1}\n{"r":2}\n{"r":"other unsaved"}\n{"r":"s1"}\n{"r":"s2"}\n' && /^M e\.jsonl$/.test(g(main, 'status', '--porcelain', '--', 'e.jsonl')), r.out + '\n' + rd(eM));
g(main, 'checkout', '--', 'e.jsonl'); w(eM, rd(eM) + '{"r":"other unsaved"}\n{"r":"s1"}\n');
r = run(wt, c8, '--except-dirty');
check('L22 a row main already holds is not appended twice', r.code === 0 && /appended 1, already had 1/.test(r.out) && (rd(eM).match(/"s1"/g) || []).length === 1 && /"s2"/.test(rd(eM)), r.out + '\n' + rd(eM));
g(main, 'checkout', '--', 'e.jsonl'); w(eM, rd(eM).replace(/\n/g, '\r\n') + '{"r":"other unsaved"}\r\n');
r = run(wt, c8, '--except-dirty');
check('L23 main\'s CRLF line ending is kept for the appended rows', r.code === 0 && /appended 2/.test(r.out) && !/[^\r]\n/.test(rd(eM)) && /"s2"\}\r\n$/.test(rd(eM)), r.out + '\n' + JSON.stringify(rd(eM)));
g(main, 'checkout', '--', 'e.jsonl');
w(eW, rd(eW).replace('{"r":1}\n', '') + '{"r":"s3"}\n'); g(wt, 'commit', '-q', '-am', 'e delete + add'); const c9 = g(wt, 'rev-parse', 'HEAD');
w(eM, rd(eM) + '{"r":"other unsaved"}\n'); const before24 = rd(eM);
r = run(wt, c9, '--except-dirty');
check('L24 a .jsonl change that also deletes a row is not append-only: "by hand", main\'s file unchanged', r.code === 1 && /e\.jsonl: this commit's lines do not apply/.test(r.out) && rd(eM) === before24, r.out);
g(main, 'add', 'e.jsonl'); const before25 = rd(eM);
r = run(wt, c8, '--except-dirty');
check('L25 a STAGED .jsonl in main is never touched', r.code === 1 && /e\.jsonl: staged entry in main: left untouched/.test(r.out) && rd(eM) === before25, r.out);
g(main, 'reset', '-q', '--', 'e.jsonl'); g(main, 'checkout', '--', 'e.jsonl');
w(eM, rd(eM) + '{"r":"other unsaved"}\n'); const before26 = rd(eM);
r = run(wt, c8, '--except-dirty', '--dry-run');
check('L26 --dry-run reports "would append" and writes nothing', r.code === 0 && /would append 2, already had 0/.test(r.out) && rd(eM) === before26, r.out);
g(main, 'checkout', '--', 'e.jsonl');
const { mainOf } = require(CLI);
check('L14 mainOf strips .claude/worktrees/<name> (Windows and POSIX separators)', mainOf(String.raw`C:\x\repo\.claude\worktrees\abc`) === String.raw`C:\x\repo` && mainOf('/x/repo/.claude/worktrees/abc/') === '/x/repo', '');
const logRows = fs.existsSync(LOGF) ? fs.readFileSync(LOGF, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
check('L15 every call writes a telemetry row (ts · commit · outcome · exit · dur_ms)', logRows.length >= 9 && logRows.every(x => x.ts && 'exit' in x && typeof x.dur_ms === 'number'), logRows.length + ' rows');

try { g(main, 'worktree', 'remove', '--force', wt); } catch (_) {}
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + String(x.d).slice(0, 1500))); }
console.log('\nland-on-main.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
