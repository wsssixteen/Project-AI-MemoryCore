#!/usr/bin/env node
// stale-hooks-warn.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-30 287186: this worktree was 26 commits behind main; redmine-write-gate v1.7 ran instead of v1.8.
'use strict';
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync, execFileSync } = require('child_process');
const HOOK = path.join(__dirname, 'stale-hooks-warn.check.hook.js');
const REAL = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'shw-'));
const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
// origin (bare) → main clone that pushes → a "session folder" clone under .claude/worktrees/x
const origin = path.join(sb, 'origin.git'); git(sb, 'init', '--bare', '-q', '-b', 'main', origin);
const mainDir = path.join(sb, 'main'); git(sb, 'clone', '-q', origin, mainDir);
const id = d => { git(d, 'config', 'user.email', 'e@x'); git(d, 'config', 'user.name', 'e'); };
id(mainDir);
fs.mkdirSync(path.join(mainDir, 'lib'), { recursive: true });
fs.writeFileSync(path.join(mainDir, 'lib', 'hook-runtime.js'), fs.readFileSync(path.join(REAL, 'lib', 'hook-runtime.js')));
fs.writeFileSync(path.join(mainDir, 'README.md'), 'x');
git(mainDir, 'add', '-A'); git(mainDir, 'commit', '-q', '-m', 'base'); git(mainDir, 'push', '-q', 'origin', 'main');
const wt = path.join(sb, 'repo', '.claude', 'worktrees', 'sess-a'); fs.mkdirSync(path.dirname(wt), { recursive: true });
git(sb, 'clone', '-q', origin, wt); id(wt);
const stampDir = path.join(sb, 'stamps'); fs.mkdirSync(stampDir);
const run = (root, env) => {
  const r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_PROJECT_DIR: root, STALE_HOOKS_STAMP_DIR: stampDir, ...(env || {}) } });
  return { out: (r.stdout || '') + (r.stderr || ''), status: r.status };
};
const warned = r => /stale-hooks-warn/.test(r.out) && /behind main/.test(r.out);

let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);
r = run(wt);
check('S1 session folder level with main → silent', !warned(r) && r.status === 0, r.out.slice(0, 160));
// main gains a gate change
fs.writeFileSync(path.join(mainDir, 'lib', 'his-words.js'), '// v1.8');
git(mainDir, 'add', '-A'); git(mainDir, 'commit', '-q', '-m', 'gate fix'); git(mainDir, 'push', '-q', 'origin', 'main');
git(wt, 'fetch', '-q', 'origin');
r = run(wt);
check('F2 REPLAY: session folder behind main on lib/ → advisory names the count and says sync now', warned(r) && /1 commit/.test(r.out) && /Sync NOW/.test(r.out) && r.status === 0, r.out.slice(0, 200));
r = run(wt);
check('S2 second prompt within 30 min → silent (quiet window)', !warned(r), r.out.slice(0, 160));
// main changes only a doc: not a gate
fs.readdirSync(stampDir).forEach(f => fs.unlinkSync(path.join(stampDir, f)));
git(wt, 'merge', '-q', '--no-edit', 'origin/main');
fs.writeFileSync(path.join(mainDir, 'README.md'), 'doc only');
git(mainDir, 'add', '-A'); git(mainDir, 'commit', '-q', '-m', 'doc'); git(mainDir, 'push', '-q', 'origin', 'main');
git(wt, 'fetch', '-q', 'origin');
r = run(wt);
check('S3 behind main on a doc file only → silent', !warned(r), r.out.slice(0, 160));
r = run(mainDir);
check('S4 the main folder itself (not under .claude/worktrees) → silent', !warned(r), r.out.slice(0, 160));
r = run(path.join(sb, 'repo', '.claude', 'worktrees', 'no-such'));
check('S5 a worktree path that is not a git repo → silent, exit 0', !warned(r) && r.status === 0, r.out.slice(0, 160));
check('S6 registered in the upsm-mode bundle', /stale-hooks-warn/.test(fs.readFileSync(path.join(REAL, 'domain', 'bundles', 'upsm-mode.json'), 'utf8')), 'not in bundle');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nstale-hooks-warn.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
