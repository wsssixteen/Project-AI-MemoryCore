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
 *
 * v1.2 2026-05-30 — Absorbed DE step 11's worktree cleanup (per みや): now also
 * REMOVES merged claude/* worktree DIRECTORIES (`git worktree remove`) BEFORE
 * deleting their branches — so stranded worktrees self-clean at boot instead of
 * at session-end DE. Never removes the current worktree or any dirty/unmerged one
 * (plain `git worktree remove`, no --force, refuses those). Branch -d stays
 * merged-only. DE step 11 (c)/(d)/(e) retired to a pointer here.
 *
 * v1.3 2026-06-03 — Worktree content-sync (per みや "C+B"): worktrees check out
 * only git-TRACKED files, but the confidential work content under projects/ is
 * gitignored (untracked) — etanah-knowledge/ (incl. flowables-bpmn/ + the .md base),
 * Etanah-Codebase-Read.md, QA-NNN docs. So a fresh worktree can't see them. Now
 * mirrors projects/ from the MAIN checkout at boot (additive; robocopy skips
 * identical files; excludes the 3.9MB database-archive + node_modules + backup junk)
 * + mirrors quest/active.txt (gitignored runtime state) so boot reads real open quests.
 * Main stays canonical for writes; the worktree copy is a read mirror.
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

  // 1.5 Worktree content-sync (v1.3 2026-06-03) — mirror gitignored work content
  //     from the MAIN checkout into this worktree (only runs inside a linked worktree).
  try {
    const gitCommonDir = run('git rev-parse --git-common-dir');
    const same = (a, b) => path.resolve(a).replace(/\\/g, '/').toLowerCase() === path.resolve(b).replace(/\\/g, '/').toLowerCase();
    if (gitCommonDir) {
      const mainRoot = path.dirname(path.resolve(projectRoot, gitCommonDir));
      if (!same(mainRoot, projectRoot)) {              // we ARE in a linked worktree
        const srcProjects = path.join(mainRoot, 'projects');
        if (fs.existsSync(srcProjects)) {
          run(`robocopy "${srcProjects}" "${path.join(projectRoot, 'projects')}" /E /XD database-archive node_modules /XF "*.bak*" "~$*" /R:0 /W:0 /NFL /NDL /NJH /NJS /NP & exit /b 0`);
        }
        const srcActive = path.join(mainRoot, 'quest', 'active.txt');
        if (fs.existsSync(srcActive)) fs.copyFileSync(srcActive, path.join(projectRoot, 'quest', 'active.txt'));
      }
    }
  } catch (e) {
    process.stderr.write(`worktree-cleanup-boot content-sync: ${e.message}\n`);
  }

  // 2. Find merged claude/* branches
  const mergedBranches = (run('git branch --merged main') || '').split('\n')
    .map(s => s.trim().replace(/^\*\s*/, ''))
    .filter(b => /^claude\//.test(b));

  // 2.5 STRANDED-WORKTREE SURFACER (v1.4 2026-06-27) — the DETECT side of the
  //     worktree-retrieval gap. This hook auto-cleans MERGED branches; nothing
  //     flagged UNMERGED ones, so stranded quest work (phase-1 close commits, built
  //     Powers) sat unretrieved for days (QA-267382: 6 branches). For every NON-merged
  //     claude/* branch (excluding the current one), count commits NOT on main by
  //     patch-id (git cherry "+"); surface the list to stderr. Surface-ONLY — never
  //     auto-merges/deletes unmerged work (content-guard); /worktree-retrieve acts.
  try {
    const rawLines = (run('git branch --list "claude/*"') || '').split('\n').filter(Boolean);
    const stranded = [];
    for (const raw of rawLines) {
      const isCurrent = /^\*/.test(raw.trim());             // * = THIS worktree only → skip
      const b = raw.trim().replace(/^[*+]\s*/, '');
      if (isCurrent || mergedBranches.includes(b)) continue;
      const cherry = run(`git cherry main "${b}"`) || '';
      const ahead = cherry.split('\n').filter(l => l.startsWith('+ ')).length;
      if (ahead > 0) stranded.push(`${b} (+${ahead} unmerged)`);
    }
    if (stranded.length > 0) {
      process.stderr.write(`⚠️ STRANDED WORKTREE WORK — ${stranded.length} unmerged claude/* branch(es) with commits NOT on main:\n   ${stranded.join('\n   ')}\n   → run /worktree-retrieve to survey + salvage to main, or delete if superseded.\n`);
    }
  } catch (e) {
    process.stderr.write(`worktree-cleanup-boot stranded-surfacer: ${e.message}\n`);
  }

  // 2.6 UNCOMMITTED-WORK SURFACER (v1.5 2026-08-05) — 2.5 only sees COMMITTED work.
  //     A worktree can hold hours of edits that were never committed at all, and step 3
  //     silently refuses to remove those worktrees without saying they exist. Found the
  //     hard way: two worktrees held a day's uncommitted rules + a whole new skill.
  //     NOISE FILTER — a file counts only if it is untracked, or its diff is non-empty
  //     (`--shortstat` is blank for CRLF-only churn, which six worktrees show constantly).
  try {
    const norm0 = p => path.resolve(p).replace(/\\/g, '/').toLowerCase();
    const NOISE = /(^|\/)(meta\/telemetry\/|node_modules\/|\.verify-notified$|slip-dashboard\.md$|slips?\.jsonl$|slip-counts\.jsonl$|quest\/active\.txt$)/;
    const wtList = (run('git worktree list --porcelain') || '').split('\n');
    const paths = wtList.filter(l => l.startsWith('worktree ')).map(l => l.slice(9).trim());
    const dirty = [];
    for (const wt of paths) {
      if (norm0(wt) === norm0(projectRoot)) continue;                  // never report ourselves
      const st = (run(`git -C "${wt}" status --porcelain`) || '').split('\n').filter(Boolean);
      const real = [];
      for (const line of st) {
        const file = line.slice(3).trim().replace(/^"|"$/g, '');
        if (NOISE.test(file)) continue;
        if (line.startsWith('??')) { real.push(file); continue; }      // untracked always counts
        const stat = run(`git -C "${wt}" diff --shortstat -- "${file}"`) || '';
        if (stat.trim()) real.push(file);                              // blank => line-endings only
      }
      if (real.length) dirty.push(`${path.basename(wt)}: ${real.length} file(s) — ${real.slice(0, 4).join(', ')}${real.length > 4 ? ', …' : ''}`);
    }
    if (dirty.length) {
      process.stderr.write(`⚠️ UNCOMMITTED WORKTREE WORK — ${dirty.length} worktree(s) hold edits committed NOWHERE:\n   ${dirty.join('\n   ')}\n   → salvage before it is lost; these worktrees are never auto-removed and were previously never reported.\n`);
    }
  } catch (e) {
    process.stderr.write(`worktree-cleanup-boot uncommitted-surfacer: ${e.message}\n`);
  }

  if (mergedBranches.length === 0) process.exit(0);
  const mergedSet = new Set(mergedBranches);

  // 3. Remove merged claude/* WORKTREE DIRECTORIES (absorbed from DE step 11, 2026-05-30).
  //    Map worktree -> branch via porcelain; never self-remove the current worktree.
  //    Plain `git worktree remove` (no --force) refuses dirty/locked worktrees → safe;
  //    a merged branch means its content is already in main, so removal loses nothing.
  const norm = p => path.resolve(p).replace(/\\/g, '/').toLowerCase();
  const here = norm(projectRoot);
  const wtPorcelain = run('git worktree list --porcelain') || '';
  let cur = {};
  for (const line of wtPorcelain.split('\n')) {
    if (line.startsWith('worktree ')) cur = { path: line.slice(9).trim() };
    else if (line.startsWith('branch ')) cur.branch = line.slice(7).trim().replace(/^refs\/heads\//, '');
    else if (line.trim() === '') {
      if (cur.path && cur.branch && mergedSet.has(cur.branch) && norm(cur.path) !== here) {
        run(`git worktree remove "${cur.path}"`);
      }
      cur = {};
    }
  }
  if (cur.path && cur.branch && mergedSet.has(cur.branch) && norm(cur.path) !== here) {
    run(`git worktree remove "${cur.path}"`);
  }

  // 4. Delete the merged claude/* branches (now that their worktrees are gone;
  //    `git branch -d` still refuses any branch checked out in a remaining worktree → safe)
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
