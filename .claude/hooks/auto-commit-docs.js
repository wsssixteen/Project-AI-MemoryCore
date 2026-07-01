#!/usr/bin/env node
/**
 * auto-commit-docs.js — Stop hook (fire-and-forget background commit of MemoryCore docs)
 *
 * みや /goal 2026-07-01: "if there is a change in our documents that is tracked, please
 * straight away commit, push & merge in the background ... check briefly & update me in
 * a single line." Answered forks: MemoryCore-only · fire at Stop · deterministic script
 * (Haiku message = v1.1) · merge-at-DE (this hook does commit+push; DE main-sync merges).
 *
 * Flow:  Stop → find MemoryCore root → SAFETY guards → `git status --porcelain -uno`
 *        (tracked changes only) → if dirty, spawn auto-commit-worker.js DETACHED (zero
 *        turn latency, true background) → emit a one-line additionalContext for Ruri to relay.
 *
 * SAFETY (why this can't touch etanah):
 *   - root must contain master-memory.md (MemoryCore fingerprint)
 *   - hard-block any path containing etanah / \Melaka\ / E:\Projects (etanah ticket code
 *     stays behind the stop-at-stage gate — NEVER auto-committed). The worker re-asserts this.
 *   - -uno = tracked files only (per みや's "documents that is tracked"); untracked docs are
 *     surfaced in the one-liner (count) but NOT auto-added.
 *
 * Bypass:  [skip-auto-commit] anywhere in the turn.
 * Debounce: a 20s lockfile prevents a double-fire from stacking two workers.
 * Log:     .claude/hooks/auto-commit-docs.log.jsonl (shared with the worker).
 * Fail-OPEN: any error → exit 0 silently (never blocks Stop, never nags on our own bug).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const LOG = path.join(__dirname, 'auto-commit-docs.log.jsonl');
const LOCK = path.join(__dirname, '.auto-commit-docs.lock');
const WORKER = path.join(__dirname, 'auto-commit-worker.js');
const BYPASS = /\[skip-auto-commit\]/i;

function log(entry) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'); } catch (_) {}
}
function findRoot(start) {
  let dir = start;
  for (let i = 0; i < 25 && dir; i++) {
    if (fs.existsSync(path.join(dir, 'master-memory.md'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => (input += d));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');

    // Bypass token anywhere in the transcript this turn.
    try {
      if (data.transcript_path && BYPASS.test(fs.readFileSync(data.transcript_path, 'utf8'))) {
        return process.exit(0);
      }
    } catch (_) {}

    const root = findRoot(__dirname);
    if (!root) { log({ action: 'skip', reason: 'no-root' }); return process.exit(0); }

    const rl = root.toLowerCase();
    if (rl.includes('etanah') || rl.includes('\\melaka\\') || rl.startsWith('e:\\projects')) {
      log({ action: 'skip', reason: 'etanah-guard', root });
      return process.exit(0);
    }

    // Debounce — if a run happened <20s ago, skip (avoid stacking workers on rapid stops).
    try {
      if (fs.existsSync(LOCK) && (Date.now() - fs.statSync(LOCK).mtimeMs) < 20000) {
        return process.exit(0);
      }
    } catch (_) {}

    // Tracked changes only.
    let porcelain = '';
    try {
      porcelain = execFileSync('git', ['-C', root, 'status', '--porcelain', '-uno'], { encoding: 'utf8', timeout: 15000 });
    } catch (e) {
      log({ action: 'skip', reason: 'git-status-failed', error: String(e.message || e).slice(0, 200) });
      return process.exit(0);
    }
    const changed = porcelain.split(/\r?\n/).filter(Boolean);
    if (!changed.length) return process.exit(0); // clean → silent no-op, no cost

    // Untracked docs (informational only — not auto-added).
    let untracked = 0;
    try {
      untracked = execFileSync('git', ['-C', root, 'ls-files', '--others', '--exclude-standard'], { encoding: 'utf8', timeout: 15000 })
        .split(/\r?\n/).filter(Boolean).length;
    } catch (_) {}

    // Stamp lock, spawn detached worker.
    try { fs.writeFileSync(LOCK, String(Date.now())); } catch (_) {}
    const child = spawn(process.execPath, [WORKER, root], { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();

    log({ action: 'dispatched', count: changed.length, untracked });

    const names = changed.map(l => l.slice(3).split('/').pop()).slice(0, 3).join(', ');
    const untrackedNote = untracked ? ` (⚠ ${untracked} untracked doc(s) NOT auto-added — add manually if wanted)` : '';
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext: [
          `🔁 auto-commit-docs: ${changed.length} tracked MemoryCore doc(s) changed → committing+pushing in the background.`,
          `   Files: ${names}${changed.length > 3 ? ' …' : ''}${untrackedNote}`,
          `   Relay ONE line to みや, e.g.  "📦 auto-saved ${changed.length} doc(s) → pushing in background."`,
          `   Result lands in auto-commit-docs.log.jsonl — verify + confirm the push on the next quiet turn.`,
        ].join('\n'),
      },
    }));
    process.exit(0);
  } catch (e) {
    log({ action: 'error', error: String(e.message || e).slice(0, 300) });
    process.exit(0);
  }
});
