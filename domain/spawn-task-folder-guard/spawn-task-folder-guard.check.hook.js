#!/usr/bin/env node
// spawn-task-folder-guard.check.hook.js — born via core/forge.js (2026-10-17)
// TRIGGER: a spawn_task start button is about to be offered for a job whose folder (cwd) or a path its prompt names is gitignored or untracked in its git repo
// ACTION: block the spawn_task call: the button opens a fresh git worktree copy, which never holds gitignored or untracked folders, so the job cannot run there; name the path and the alternatives
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// Replay: 2026-10-17 DawahMap ticket 11. spawn_task with cwd = <MemoryCore>\projects\coding-projects\active\DawahMap
// (projects/ is gitignored). The started session landed in DawahMap\.claude\worktrees\funny-swirles-d55a3d, a copy
// without DawahMap, and could not run. The spawn_task reply had said "fresh worktree".
// Fails OPEN: any error (no git, bad input, unreadable path) lets the call through and logs why.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = path.join(__dirname, 'log.jsonl');
const BYPASS_RE = /\[skip-spawn-task-folder-guard:\s*[^\]\s][^\]]*\]/i;
const MAX_SEGMENTS = 5;   // a path named in the prompt is checked down to this depth below its repo root

function git(cwd, args) {
  const r = spawnSync('git', ['-c', 'safe.directory=*'].concat(args), { cwd, encoding: 'utf8', timeout: 8000, windowsHide: true });
  return { ok: r.status === 0, status: r.status, out: (r.stdout || '').trim(), err: r.error };
}
// nearest existing folder at or above p (git needs an existing cwd)
function existingDir(p) {
  let d = p;
  for (let i = 0; i < 40 && d; i++) {
    try { if (fs.statSync(d).isDirectory()) return d; } catch (_) {}
    const up = path.dirname(d); if (up === d) break; d = up;
  }
  return null;
}
// → null when fine, or { path, why } when the worktree copy will not hold it
function checkPath(p) {
  const abs = path.resolve(String(p).replace(/\//g, path.sep));
  const dir = existingDir(abs);
  if (!dir) return null;
  const top = git(dir, ['rev-parse', '--show-toplevel']);
  if (!top.ok || !top.out) return null;                       // not inside a git repo: no worktree copy is made from it
  const repo = path.resolve(top.out);
  const rel = path.relative(repo, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;   // the repo root itself is always in the copy
  if (!fs.existsSync(abs)) return null;                       // not on disk here: the job may create it
  if (git(repo, ['check-ignore', '-q', '--', rel]).status === 0) return { path: abs, why: 'gitignored' };
  const tracked = git(repo, ['ls-files', '--', rel]);
  if (tracked.ok && !tracked.out) return { path: abs, why: 'untracked (no file under it is in git)' };
  return null;
}
// absolute Windows paths named in the prompt, cut to at most MAX_SEGMENTS segments below their drive-rooted prefix
function pathsIn(text) {
  const out = new Set();
  // one match per drive letter: a match stops where the next "X:\" starts
  const re = /([A-Za-z]:[\\/](?:(?![A-Za-z]:[\\/])[^\r\n"'`<>|*?])+)/g;
  let m;
  while ((m = re.exec(String(text || '')))) {
    const segs = m[1].replace(/[\\/]+\s*$/, '').split(/[\\/]/);
    // keep the longest prefix that exists on disk; the last segment is also tried word by word,
    // so names with spaces are kept whole and words after the path ("DawahMap  (gitignored)", "lib then") fall away
    let found = null;
    for (let n = segs.length; n >= 2 && !found; n--) {
      const base = segs.slice(0, n - 1), words = segs[n - 1].split(' ');
      for (let k = words.length; k >= 1 && !found; k--) {
        const last = words.slice(0, k).join(' ').replace(/[.,;:)\]]+$/, '').trim();
        if (!last) continue;
        const cand = base.concat([last]).join(path.sep);
        if (fs.existsSync(cand)) found = cand;
      }
    }
    if (found) out.add(found);
  }
  return [...out];
}
function log(row) { try { fs.appendFileSync(LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString() }, row)) + '\n'); } catch (_) {} }

function decide(data) {
  if (!data || typeof data !== 'object') return { fired: false };
  const name = String(data.tool_name || '');
  if (name && !/spawn_task$/.test(name)) return { fired: false };
  const ti = data.tool_input && typeof data.tool_input === 'object' ? data.tool_input : {};
  const prompt = String(ti.prompt || '');
  if (BYPASS_RE.test(prompt)) { log({ decision: 'bypassed', token: (prompt.match(BYPASS_RE) || [''])[0] }); return { fired: true, blocked: false, bypassed: true }; }
  const cands = [];
  if (typeof ti.cwd === 'string' && ti.cwd.trim()) cands.push(ti.cwd.trim());
  for (const p of pathsIn(prompt)) cands.push(p);
  const bad = [];
  for (const c of cands) { try { const r = checkPath(c); if (r && !bad.some(b => b.path === r.path)) bad.push(r); } catch (e) { log({ decision: 'fail-open', path: c, error: String(e && e.message || e).slice(0, 160) }); } }
  if (!bad.length) { log({ decision: 'pass', checked: cands.length }); return { fired: false }; }
  log({ decision: 'block', paths: bad.map(b => b.path + ' (' + b.why + ')') });
  const msg = [
    '⛔ spawn-task-folder-guard: this start button would open its session in a fresh git worktree copy of the repo,',
    '   and the copy never holds gitignored or untracked folders. These are not in it, so the job cannot run there:',
    ...bad.map(b => '   - ' + b.path + '  (' + b.why + ')'),
    '   Do the job in THIS session instead, or move a session into that folder with mcp__ccd_directory__change_directory',
    '   after he nods. Never offer him the button for it.',
    '   Bypass only if the task truly needs none of these paths: [skip-spawn-task-folder-guard: <reason>] inside the task prompt.',
  ].join('\n') + '\n';
  return { fired: true, blocked: true, blockReason: msg };
}

if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'spawn-task-folder-guard', event: 'PreToolUse' }, (input) => {
    let data = input;
    if (typeof input === 'string') { try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; } }
    try { return decide(data); } catch (e) { log({ decision: 'fail-open', error: String(e && e.message || e).slice(0, 160) }); return { fired: false }; }
  });
}
module.exports = { decide, checkPath, pathsIn };
