/**
 * worktree-cleanup-boot.js — SessionStart hook
 *
 * On session start: git worktree prune + delete merged claude/* worktrees
 * + delete merged claude/* branches. Silent unless something can't be
 * cleaned (then surface to stderr).
 *
 * Per session-briefing.md Pre-briefing housekeeping (added 2026-05-20).
 */
const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  } catch (e) { return null; }
}

try {
  // 1. Prune stale worktree records
  run('git worktree prune');

  // 2. Find merged claude/* worktrees + branches
  const mergedBranches = (run('git branch --merged main') || '').split('\n')
    .map(s => s.trim().replace(/^\*\s*/, ''))
    .filter(b => /^claude\//.test(b));

  if (mergedBranches.length === 0) process.exit(0);

  // 3. Delete the merged claude/* branches
  for (const b of mergedBranches) {
    run(`git branch -d "${b}"`);
  }

  // Silent success (no stderr unless we couldn't clean)
  process.exit(0);
} catch (e) {
  process.stderr.write(`worktree-cleanup-boot: ${e.message}\n`);
  process.exit(0);
}
