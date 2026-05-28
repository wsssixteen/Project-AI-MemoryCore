/**
 * worktree-cleanup-boot.js — SessionStart hook
 *
 * On session start: git worktree prune + delete merged claude/* worktrees
 * + delete merged claude/* branches. Silent unless something can't be
 * cleaned (then surface to stderr).
 *
 * Per session-briefing.md Pre-briefing housekeeping (added 2026-05-20).
 *
 * v1.1 2026-05-28 — Plan Phase 4 + C4 fix:
 * Added decay-date scanner for redirect-stub skills. Each SKILL.md may carry
 * frontmatter `decay-date: YYYY-MM-DD`. Hook scans all .claude/skills/* /SKILL.md;
 * if decay-date is reached or past → flag to stderr. If within 3 days → warning.
 * Current decay-pending: `rubric` (2026-06-07, plan Phase 4 absorption).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const skillsDir = path.join(projectRoot, '.claude', 'skills');

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

  // 4. Decay-date scanner (v1.1, 2026-05-28 plan Phase 4 + C4 fix)
  try {
    if (fs.existsSync(skillsDir)) {
      const today = new Date();
      const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory());
      for (const d of skillDirs) {
        const skillPath = path.join(skillsDir, d.name, 'SKILL.md');
        if (!fs.existsSync(skillPath)) continue;
        const content = fs.readFileSync(skillPath, 'utf-8');
        const m = content.match(/decay[-\s]?date\s*:\s*(\d{4}-\d{2}-\d{2})/i);
        if (!m) continue;
        const decay = new Date(m[1] + 'T00:00:00');
        const days = Math.ceil((decay - today) / (24 * 60 * 60 * 1000));
        if (days <= 0) {
          process.stderr.write(`⏰ DECAY EXPIRED: skill "${d.name}" decayed on ${m[1]} (${-days} day(s) past). Final cleanup required — delete directory + absorb triggers into target homes.\n`);
        } else if (days <= 3) {
          process.stderr.write(`⏰ DECAY SOON: skill "${d.name}" decays on ${m[1]} (in ${days} day(s)). Plan the cleanup window.\n`);
        }
      }
    }
  } catch (e) {
    process.stderr.write(`worktree-cleanup-boot decay-scan: ${e.message}\n`);
  }

  // Silent success (no stderr unless we couldn't clean OR decay flagged)
  process.exit(0);
} catch (e) {
  process.stderr.write(`worktree-cleanup-boot: ${e.message}\n`);
  process.exit(0);
}
