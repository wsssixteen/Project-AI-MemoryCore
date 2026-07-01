#!/usr/bin/env node
/**
 * auto-commit-worker.js — detached background worker for auto-commit-docs.js
 *
 * Runs OUTSIDE the turn (spawned detached + unref'd by the Stop hook) so it never
 * adds latency to Ruri's turn-end. Does the actual git work for the MemoryCore
 * docs auto-save:  git add -u  →  commit (templated message)  →  push origin HEAD.
 *
 * v1 (2026-07-01, per みや /goal): deterministic templated commit message.
 *   Scope: MemoryCore repo ONLY — the caller (auto-commit-docs.js) already hard-blocks
 *   any etanah / E:\Projects path before spawning us, but we re-assert the guard here
 *   (defence in depth — a worker must never push etanah ticket code).
 * v1.1 candidate: draft the message via `claude -p --model haiku` with template fallback.
 *
 * Args:  node auto-commit-worker.js <repoRoot>
 * Log:   .claude/hooks/auto-commit-docs.log.jsonl  (shared with the gate)
 * Never throws to a console (detached, no reader) — every path logs + exits.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = process.argv[2];
const LOG = path.join(__dirname, 'auto-commit-docs.log.jsonl');

function log(entry) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'); } catch (_) {}
}

function git(args, opts = {}) {
  return execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', timeout: 60000, ...opts }).trim();
}

try {
  if (!repoRoot || !fs.existsSync(repoRoot)) { log({ action: 'abort', reason: 'no-repo-root', repoRoot }); process.exit(0); }

  // Defence in depth: NEVER operate on an etanah / E:\Projects tree.
  const rl = repoRoot.toLowerCase();
  if (rl.includes('etanah') || rl.includes('\\melaka\\') || rl.startsWith('e:\\projects')) {
    log({ action: 'abort', reason: 'etanah-guard', repoRoot });
    process.exit(0);
  }
  // Must look like MemoryCore.
  if (!fs.existsSync(path.join(repoRoot, 'master-memory.md'))) {
    log({ action: 'abort', reason: 'not-memorycore', repoRoot });
    process.exit(0);
  }

  // Stage tracked changes only (per みや: "documents that is tracked").
  git(['add', '-u']);

  const staged = git(['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean);
  if (!staged.length) { log({ action: 'noop', reason: 'nothing-staged' }); process.exit(0); }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const now = new Date();
  const stamp = now.toISOString().slice(0, 16).replace('T', ' ');
  const shown = staged.slice(0, 3).map(f => f.split('/').pop()).join(', ');
  const more = staged.length > 3 ? ` +${staged.length - 3} more` : '';
  const msg = `docs: auto-commit ${stamp} — ${staged.length} file(s): ${shown}${more}`;

  git(['commit', '-m', msg]);
  const sha = git(['rev-parse', '--short', 'HEAD']);

  let pushOk = false, pushErr = null;
  try { git(['push', 'origin', 'HEAD']); pushOk = true; }
  catch (e) { pushErr = String(e.stderr || e.message || e).slice(0, 300); }

  log({ action: 'committed', branch, sha, files: staged, count: staged.length, pushOk, pushErr, msg });
  process.exit(0);
} catch (e) {
  log({ action: 'error', error: String(e.stderr || e.message || e).slice(0, 400) });
  process.exit(0);
}
