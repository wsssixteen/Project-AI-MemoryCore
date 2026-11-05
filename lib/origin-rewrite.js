#!/usr/bin/env node
// origin-rewrite.js — the ONE allowed way to move an origin branch backwards (Tool, born 2026-11-05, #287811).
//
// symptom: 2026-11-05 — two origin rewrites (ticket branch, int-env) with miya's clone never reset; his pull merged
//          the five failed commits back and SourceTree showed the mess he had asked to be cleaned.
// goal:    after a rewrite, origin AND his clone hold the same tip, in the same step, and he is told to refresh.
// goal_signal: stdout ends with "Refresh SourceTree." and his clone's branch equals origin's (printed).
// retention: keep (no data of its own; one row per run in lib/origin-rewrite.log.jsonl, rotate monthly)
// self_audit: after the push it re-reads origin and his clone and prints both tips; a mismatch exits 4.
//
// Usage:
//   node lib/origin-rewrite.js --repo <work clone or worktree> --branch mlk/... --lease <old origin sha>
//                              [--his-clone <dir>]   (default: E:\Projects\Melaka\<repo folder name>)
//                              [--no-his]            (skip his clone on purpose; printed)
// Refuses (exit 2 usage · 3 his clone dirty · 4 tips differ after the run). deploy-guard allows a force push ONLY
// through this script.
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const a = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null; };
const has = (n) => process.argv.includes('--' + n);
const repo = a('repo'), branch = a('branch'), lease = a('lease');
if (!repo || !branch || !lease || !/^mlk\//.test(branch) || !/^[0-9a-f]{7,40}$/i.test(lease)) {
  console.error('usage: node lib/origin-rewrite.js --repo <dir> --branch mlk/... --lease <old origin sha> [--his-clone <dir>] [--no-his]');
  process.exit(2);
}
const git = (args, cwd) => execSync('git ' + args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const LOG = process.env.ORIGIN_REWRITE_LOG || path.join(__dirname, 'origin-rewrite.log.jsonl');
const row = (o) => { try { fs.appendFileSync(LOG, JSON.stringify(Object.assign({ ts: new Date().toISOString(), branch }, o)) + '\n'); } catch (_) {} };

let hisClone = a('his-clone');
if (!hisClone && !has('no-his')) {
  const name = path.basename(git('rev-parse --show-toplevel', repo)).replace(/^wt-.*$/, '');   // a worktree folder has no repo name
  const top = git('rev-parse --show-toplevel', repo);
  const remote = git('remote get-url origin', repo);
  const m = remote.match(/([^/:]+?)(?:\.git)?$/);
  hisClone = path.join(process.env.HIS_CLONE_ROOT || 'E:\\Projects\\Melaka', (name || (m && m[1]) || path.basename(top)));
}

// 1. push with lease: refuses when origin moved since the lease sha
git(`push --force-with-lease=${branch}:${lease} origin ${branch}`, repo);
const originTip = git(`rev-parse origin/${branch}`, repo);
console.log(`origin/${branch} = ${originTip}`);
row({ step: 'push', originTip, lease });

// 2. his clone: fetch, then reset the same branch when the tree is clean
if (hisClone) {
  if (!fs.existsSync(path.join(hisClone, '.git'))) { console.error(`his clone not found: ${hisClone} (pass --his-clone or --no-his)`); row({ step: 'his', outcome: 'missing', hisClone }); process.exit(2); }
  if (git('status --porcelain', hisClone)) {
    console.error(`his clone ${hisClone} has uncommitted changes: NOT reset. After he commits or stashes: git fetch origin; git reset --hard origin/${branch}`);
    row({ step: 'his', outcome: 'dirty', hisClone }); process.exit(3);
  }
  git('fetch origin', hisClone);
  const current = git('branch --show-current', hisClone);
  if (current === branch) git(`reset --hard origin/${branch}`, hisClone);
  else git(`branch -f ${branch} origin/${branch}`, hisClone);
  const hisTip = git(`rev-parse ${branch}`, hisClone);
  console.log(`his clone ${hisClone} ${branch} = ${hisTip}`);
  row({ step: 'his', outcome: 'reset', hisClone, hisTip });
  if (hisTip !== originTip) { console.error('tips differ after the run'); row({ step: 'audit', outcome: 'mismatch' }); process.exit(4); }
} else {
  console.log('his clone skipped (--no-his)');
}
console.log('Refresh SourceTree.');
row({ step: 'audit', outcome: 'ok' });
