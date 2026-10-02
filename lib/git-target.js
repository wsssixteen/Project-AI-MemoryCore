#!/usr/bin/env node
// git-target.js — which repo does a shell command act on?
//
// Two steps, both needed by every git gate:
//   1. cmdDir(cmd)      — the directory the command runs git in: `git -C <dir>` wins, else the LAST
//                         cd / Set-Location / sl / Push-Location / pushd before the git verb.
//                         Quotes and a trailing ; or && are never part of the path.
//   2. repoIdentity(dir) — the repo's real name from `git remote get-url origin` (etanah-awam),
//                         falling back to the top-level folder name when there is no remote.
//
// WHY (2026-10-02, AWAM stag-env PDBB fix): the push gate read `cd E:\…\stag-awam-pdbb; git push`
// as repo "E:\…\stag-awam-pdbb;" (semicolon kept), and both gates decided "is this etanah-awam?"
// from the folder NAME — a worktree named stag-awam-pdbb is etanah-awam but matched only by luck
// ("etanah-work" in the parent path), and E:\Dev\etanah-work\etanah-pelupusan matched as FOREIGN.
// The remote URL is the repo's identity; the folder name is not.
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

const Q = String.raw`(?:"([^"]+)"|'([^']+)'|([^\s;&|"']+))`;
const CD_RX = new RegExp(String.raw`(?:^|[;&|\n(]\s*)(?:cd|chdir|sl|Set-Location|Push-Location|pushd)\s+(?:/d\s+)?(?:-(?:LiteralPath|Path)\s+)?` + Q, 'gi');
// A real git invocation (start of command or after ; & | newline), optional -C <dir>, then the verb.
function gitCallRx(verb) {
  return new RegExp(String.raw`(?:^|[;&|\n(]\s*)git\s+(?:-C\s+` + Q + String.raw`\s+)?(` + (verb || '[a-z][\w-]*') + String.raw`)\b`, 'gi');
}

function clean(p) {
  return String(p || '').trim().replace(/[;&|]+$/, '').replace(/^["']|["']$/g, '');
}

// Directory a command runs `git <verb>` in (any verb when omitted), or null when it never changes directory.
// The git call's own -C wins; else the LAST cd before that call. Text inside quotes after the call never counts.
function cmdDir(cmd, verb) {
  const c = String(cmd || '');
  const call = gitCallRx(verb).exec(c);
  if (call && (call[1] || call[2] || call[3])) return clean(call[1] || call[2] || call[3]);
  const limit = call ? call.index + 1 : c.length;
  let m, last = null;
  const cd = new RegExp(CD_RX.source, 'gi');
  while ((m = cd.exec(c)) !== null && m.index < limit) last = m[1] || m[2] || m[3];
  return last ? clean(last) : null;
}

function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).trim();
}

// { dir, top, remote, name } — name = repo name from the origin URL ("etanah-awam"); null when not a repo.
function repoIdentity(dir) {
  if (!dir) return null;
  let top;
  try { top = path.resolve(git(dir, ['rev-parse', '--show-toplevel'])); } catch (_) { return null; }
  let remote = '';
  try { remote = git(dir, ['remote', 'get-url', 'origin']); } catch (_) {}
  const fromRemote = remote ? remote.replace(/[\\/]+$/, '').split(/[\\/:]/).pop().replace(/\.git$/i, '') : '';
  return { dir, top, remote, name: fromRemote || path.basename(top) };
}

// The repo a command's `git <verb>` acts on: its own -C / cd, else the tool's cwd.
function targetRepo(cmd, fallbackCwd, verb) {
  const dir = cmdDir(cmd, verb) || fallbackCwd || null;
  return { dir, id: repoIdentity(dir) };
}

// True when the command really invokes `git <verb>` (not just mentions it inside a quoted message).
function invokesGit(cmd, verb) { return gitCallRx(verb).test(String(cmd || '')); }

module.exports = { cmdDir, repoIdentity, targetRepo, invokesGit, clean };

if (require.main === module) {
  const cmd = process.argv.slice(2).join(' ');
  console.log(JSON.stringify(targetRepo(cmd, process.cwd()), null, 2));
}
