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
 *
 * v1.4 2026-08-05 — Stat-cache refresh (step 1.6), per みや after the
 * "Archive session with uncommitted changes?" dialog recurred across several sessions.
 * v1.3's robocopy is what CAUSED it: touching mtimes on tracked files under projects/
 * makes git report them " M" with an EMPTY diff. Step 1.6 runs
 * `git update-index --refresh` right after the sync so the phantom rows never reach
 * the dialog. Paired with `.gitignore` now ignoring `meta/` wholesale (the third
 * phantom row was meta/slip-counts.jsonl, an orphan left by the meta/ -> system/ rename).
 *
 * v1.6 2026-09-04 — ORPHAN-FOLDER SWEEP + the four defects that let 213 folders
 * (15.10 GB) pile up under .claude/worktrees inside the OneDrive-synced repo while
 * this hook fired 6× a day, exit 0, and reported silence as success (per みや:
 * "I thought I've been trying to prevent this the first thing when I build the
 * session boot"). Verified on disk 2026-09-04: 208/213 folders had a `.git` link to
 * a `.git/worktrees/<x>` admin dir that no longer existed (de-registered, folder
 * left behind — OneDrive syncs `.git/` across two laptops; the other machine's
 * `worktree prune` drops the admin entry, the folder survives here); 192/213 had no
 * branch at all (step 4 had deleted it in a past boot).
 *   D1 — cleanup keyed off `git worktree list`, so a de-registered folder was invisible
 *        to every step forever.            → step 5 reads the DIRECTORY.
 *   D2 — step 4 deleted the branch whether or not step 3's `worktree remove` succeeded
 *        (run() swallows errors, nobody checked). → branch -d only after the removal
 *        actually succeeded; a refusal is surfaced and the branch is KEPT.
 *   D3 — "silent unless it can't clean" was a lie: nothing ever wrote on failure.
 *        → one summary line every boot: registered · orphans · deleted · kept, plus a
 *        row in .claude/state/worktree-cleanup-log.jsonl (system-rules Rule 5).
 *   D4 — merged set came from LOCAL `main`, which lags origin on a two-laptop repo;
 *        merged-on-origin branches read as unmerged and never cleaned.
 *        → quiet `git fetch origin main`, then merge-test against origin/main.
 *   Safety — before deleting any branchless orphan, every non-ignored file in it is
 *        hashed; a blob git has never seen anywhere = never-committed work → the
 *        folder is KEPT and surfaced, never deleted. `WORKTREE_CLEANUP_DRY_RUN=1`
 *        prints the plan without deleting. Eval: worktree-cleanup-boot.eval.js.
 *   Spec preservation vs v1.5: steps 1 · 1.5 · 1.6 · 2.5 · 2.6 · decay-scan unchanged.
 *   Changed: step 2 merge base (main → origin/main, D4) · steps 3+4 coupled (D2).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const skillsDir = path.join(projectRoot, '.claude', 'skills');
const DRY = process.env.WORKTREE_CLEANUP_DRY_RUN === '1';
const LOG = path.join(projectRoot, '.claude', 'state', 'worktree-cleanup-log.jsonl');

function run(cmd, cwd) {
  try {
    return execSync(cmd, { cwd: cwd || projectRoot, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }).toString().trim();
  } catch (e) { return null; }
}
// v1.6 — same as run() but never loses the failure: {ok, out, err}
function runFull(cmd, cwd) {
  try {
    const out = execSync(cmd, { cwd: cwd || projectRoot, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }).toString().trim();
    return { ok: true, out, err: '' };
  } catch (e) {
    return { ok: false, out: (e.stdout || '').toString().trim(), err: (e.stderr || e.message || '').toString().trim() };
  }
}
const norm = p => path.resolve(p).replace(/\\/g, '/').toLowerCase();

/** v1.6 — which ref is "main truth" for merge tests: origin/main after a quiet fetch, else local main. */
function mergeBaseRef(root) {
  const r = root || projectRoot;
  run('git fetch origin main --quiet', r);              // best-effort; offline = fall through
  return run('git rev-parse --verify --quiet origin/main', r) ? 'origin/main' : 'main';
}

/** v1.6 — registered worktrees from porcelain: [{path, branch}] */
function registeredWorktrees(root) {
  const r = root || projectRoot;
  const out = run('git worktree list --porcelain', r) || '';
  const list = []; let cur = {};
  for (const line of out.split('\n')) {
    if (line.startsWith('worktree ')) cur = { path: line.slice(9).trim() };
    else if (line.startsWith('branch ')) cur.branch = line.slice(7).trim().replace(/^refs\/heads\//, '');
    else if (line.trim() === '') { if (cur.path) list.push(cur); cur = {}; }
  }
  if (cur.path) list.push(cur);
  return list;
}

/**
 * v1.6 — does this folder hold content git has NEVER seen in any commit?
 * Lists tracked + untracked-not-ignored files (main's ignore rules), hashes them,
 * asks the object DB. Returns the list of never-committed paths ([] = safe).
 */
/**
 * v1.6 — blobs reachable from ANY ref (commits, tags, remotes). Built once per sweep.
 * Why not `cat-file -e`: a blob merely present in the object DB may be staged in some
 * worktree's index or left by a reset — reachable from no commit, prunable by gc, NOT
 * durable. Found live 2026-09-04: staging a salvage copy in a sibling worktree made the
 * orphan's never-committed files look "committed" and the folder was deleted.
 */
let _reachable = null;
function reachableBlobs(root) {
  if (_reachable) return _reachable;
  const out = run('git rev-list --objects --all', root || projectRoot) || '';
  _reachable = new Set(out.split('\n').map(l => l.slice(0, 40)).filter(h => h.length === 40));
  return _reachable;
}

function neverCommittedFiles(dir, root) {
  const r = root || projectRoot;
  const gitDir = path.join(r, '.git');
  const listed = run(`git --git-dir="${gitDir}" --work-tree="${dir}" ls-files -co --exclude-standard`, r) || '';
  // NOISE — runtime state that is not gitignored but is never "work": bounty stamps, gate
  // locks/flags, per-machine launch config, .claude/state, ledgers. Verified 2026-09-04 on
  // 182 orphans: without this line ~8 folders would be kept for a `.verify-notified` alone.
  //   + projects/ (step 1.5 robocopy MIRRORS main's working copy into every worktree — a
  //     never-committed edit there is main's, not the worktree's) · meta/ (legacy rename)
  //     · outputs-temp/ · Time-Aware runtime json · slip-dashboard (generated).
  const NOISE = /(^|\/)(system\/telemetry\/|\.claude\/worktrees\/|\.claude\/state\/|node_modules\/|projects\/|meta\/|outputs-temp\/|Feature\/Time-Based-Aware-System\/)|(\.verify-notified|\.lock|\.flag|\.jsonl|\.pyc|slip-dashboard\.md)$|(^|\/)\.claude\/launch\.json$/;
  const files = listed.split('\n').map(s => s.trim()).filter(Boolean)
    .filter(f => !NOISE.test(f))
    .filter(f => { try { return fs.statSync(path.join(dir, f)).isFile(); } catch { return false; } });
  if (files.length === 0) return [];
  // a blob git has never committed can still be SAFE if it is byte-identical to the main
  // checkout's current working copy (an uncommitted edit that lives in main, not only here)
  const sameAsMain = f => { try { const a = fs.readFileSync(path.join(dir, f)); const b = fs.readFileSync(path.join(r, f)); return a.equals(b); } catch { return false; } };
  const tmpP = path.join(os.tmpdir(), `wt-blobs-${process.pid}-${Date.now()}.txt`);
  const tmpH = `${tmpP}.h`;
  try {
    fs.writeFileSync(tmpP, files.join('\n') + '\n');
    const hashed = run(`git --git-dir="${gitDir}" hash-object --stdin-paths < "${tmpP}"`, dir) || '';
    const reach = reachableBlobs(r);
    const missing = [];
    hashed.split('\n').forEach((h, i) => { h = h.trim(); if (files[i] && h && !reach.has(h) && !sameAsMain(files[i])) missing.push(files[i]); });
    return missing;
  } finally {
    try { fs.unlinkSync(tmpP); } catch {}
    try { fs.unlinkSync(tmpH); } catch {}
  }
}

/**
 * v1.6 — ORPHAN-FOLDER SWEEP. Reads .claude/worktrees on DISK, not git's list.
 * For every folder that is NOT a registered worktree and NOT the current one:
 *   no branch / branch merged into <baseRef>  → delete folder (+ branch), unless it
 *                                                holds never-committed content → keep + surface
 *   branch unmerged                            → keep + surface (never auto-deleted)
 * Returns a plan/result object; performs deletes unless opts.dryRun.
 */
function sweepOrphans(root, opts) {
  const r = root || projectRoot;
  const o = Object.assign({ dryRun: DRY, baseRef: null, here: null }, opts || {});
  const wtDir = path.join(r, '.claude', 'worktrees');
  const res = { registered: 0, orphans: [], deleted: [], kept: [], baseRef: null };
  if (!fs.existsSync(wtDir)) return res;
  const base = o.baseRef || mergeBaseRef(r);
  res.baseRef = base;
  const reg = registeredWorktrees(r);
  res.registered = reg.length;
  const regSet = new Set(reg.map(w => norm(w.path)));
  const here = norm(o.here || r);
  const dirs = fs.readdirSync(wtDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  for (const name of dirs) {
    const full = path.join(wtDir, name);
    if (regSet.has(norm(full)) || norm(full) === here) continue;       // registered or current → not ours
    const branch = `claude/${name}`;
    const hasBranch = !!run(`git show-ref --verify --quiet "refs/heads/${branch}" && echo y`, r);
    let verdict, why;
    if (hasBranch) {
      const merged = !!run(`git merge-base --is-ancestor "${branch}" ${base} && echo y`, r);
      if (!merged) { verdict = 'keep'; why = `branch ${branch} UNMERGED vs ${base}`; }
      else { verdict = 'delete'; why = `branch ${branch} merged into ${base}`; }
    } else { verdict = 'delete'; why = 'no branch (deleted as merged in a past boot)'; }
    if (verdict === 'delete') {
      const nc = neverCommittedFiles(full, r);
      if (nc.length) { verdict = 'keep'; why = `${nc.length} never-committed file(s): ${nc.slice(0, 4).join(', ')}${nc.length > 4 ? ', …' : ''}`; }
    }
    const entry = { name, verdict, why, hasBranch };
    res.orphans.push(entry);
    if (verdict === 'keep') { res.kept.push(entry); continue; }
    if (o.dryRun) { res.deleted.push(entry); continue; }
    try {
      fs.rmSync(full, { recursive: true, force: true });
      if (fs.existsSync(full)) throw new Error('folder still present after rmSync (locked by another process?)');
      if (hasBranch) run(`git branch -D "${branch}"`, r);               // content proven on base → -D is safe
      res.deleted.push(entry);
    } catch (e) {
      entry.verdict = 'keep'; entry.why = `delete failed: ${e.message.split('\n')[0]}`; res.kept.push(entry);
    }
  }
  _reachable = null;                                                    // fresh per sweep
  // system-rules Rule 5 — every sweep (boot OR direct call) leaves a row: why was X deleted = a grep
  try {
    const logPath = path.join(r, '.claude', 'state', 'worktree-cleanup-log.jsonl');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), dry: !!o.dryRun, baseRef: base, registered: res.registered,
      deleted: res.deleted.map(e => e.name), kept: res.kept.map(e => ({ name: e.name, why: e.why })) }) + '\n');
  } catch {}
  return res;
}

function dirBytes(p) {
  let n = 0;
  try {
    for (const d of fs.readdirSync(p, { withFileTypes: true })) {
      const f = path.join(p, d.name);
      if (d.isDirectory()) n += dirBytes(f); else if (d.isFile()) { try { n += fs.statSync(f).size; } catch {} }
    }
  } catch {}
  return n;
}

module.exports = { sweepOrphans, neverCommittedFiles, registeredWorktrees, mergeBaseRef, dirBytes };

function main() {
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

  // 1.6 Stat-cache refresh (v1.4 2026-08-05, みや — recurring session-archive dialog).
  //     Step 1.5's robocopy rewrites mtimes on files under projects/ EVERY boot. A few of
  //     those are git-TRACKED (projects/ is gitignored today, but files added before that
  //     rule stay tracked — e.g. etanah-knowledge/melaka/DATABASE.md and
  //     projects/coding-projects/active/salvage-2026-05-26/convention-check-gate.js).
  //     Git compares mtime+size first, sees the fresh mtime, and reports " M" even though
  //     the content is byte-identical (blob hash matches; `git diff` is EMPTY).
  //     Those phantom rows are what the "Archive session with uncommitted changes?" dialog
  //     counted, session after session, threatening to discard changes that did not exist.
  //     `git update-index --refresh` re-hashes the suspect entries and drops the false rows.
  //     Cheap (only re-hashes stat-dirty paths), and it can NEVER discard real work:
  //     a genuinely modified file keeps its " M" because its hash differs.
  run('git update-index --refresh');

  // 2. Find merged claude/* branches — v1.6: against origin/main (D4), not the lagging local main
  const baseRef = mergeBaseRef();
  const mergedBranches = (run(`git branch --merged ${baseRef}`) || '').split('\n')
    .map(s => s.trim().replace(/^[*+]\s*/, ''))
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
      const cherry = run(`git cherry ${baseRef} "${b}"`) || '';
      const ahead = cherry.split('\n').filter(l => l.startsWith('+ ')).length;
      if (ahead > 0) stranded.push(`${b} (+${ahead} unmerged)`);
    }
    if (stranded.length > 0) {
      process.stderr.write(`⚠️ STRANDED WORKTREE WORK — ${stranded.length} unmerged claude/* branch(es) with commits NOT on ${baseRef}:\n   ${stranded.join('\n   ')}\n   → run /worktree-retrieve to survey + salvage to main, or delete if superseded.\n`);
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
    const NOISE = /(^|\/)(meta\/telemetry\/|node_modules\/|\.verify-notified$|slip-dashboard\.md$|slips?\.jsonl$|slip-counts\.jsonl$|quest\/active\.txt$)/;
    const paths = registeredWorktrees().map(w => w.path);
    const dirty = [];
    for (const wt of paths) {
      if (norm(wt) === norm(projectRoot)) continue;                  // never report ourselves
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

  // 3+4. Remove merged claude/* WORKTREE DIRECTORIES, then their branches — v1.6 COUPLED (D2):
  //      a branch is deleted ONLY if its worktree was removed (or it had none). A refused
  //      removal (dirty/locked) is surfaced and the branch is kept, so the folder can never
  //      again be orphaned with its branch gone.
  const here = norm(projectRoot);
  const refused = [];
  const wtByBranch = new Map(registeredWorktrees().filter(w => w.branch).map(w => [w.branch, w.path]));
  for (const b of mergedBranches) {
    const wt = wtByBranch.get(b);
    if (wt && norm(wt) === here) continue;                             // never self-remove
    if (wt) {
      if (DRY) continue;
      const rm = runFull(`git worktree remove "${wt}"`);
      if (!rm.ok) { refused.push(`${path.basename(wt)} (${b}): ${rm.err.split('\n')[0]}`); continue; }
    }
    if (!DRY) run(`git branch -d "${b}"`);
  }
  if (refused.length) {
    process.stderr.write(`⚠️ worktree-cleanup-boot: ${refused.length} merged worktree(s) REFUSED removal — branch kept:\n   ${refused.join('\n   ')}\n`);
  }

  // 5. ORPHAN-FOLDER SWEEP (v1.6, D1) — folders on disk that git no longer lists.
  try {
    const sw = sweepOrphans(projectRoot, { dryRun: DRY, baseRef, here: projectRoot });
    const gb = b => (b / 1073741824).toFixed(2);
    let keptBytes = 0, delBytes = 0;
    for (const e of sw.kept) keptBytes += dirBytes(path.join(projectRoot, '.claude', 'worktrees', e.name));
    if (DRY) for (const e of sw.deleted) delBytes += dirBytes(path.join(projectRoot, '.claude', 'worktrees', e.name));
    const line = `worktrees: ${sw.registered} registered · ${sw.orphans.length} orphan folder(s)` +
      (sw.orphans.length ? ` → ${DRY ? 'would delete' : 'deleted'} ${sw.deleted.length}${DRY ? ` (${gb(delBytes)} GB)` : ''} · kept ${sw.kept.length}${sw.kept.length ? ` (${gb(keptBytes)} GB)` : ''}` : '') +
      (DRY ? '  [DRY RUN]' : '');
    process.stderr.write(line + '\n');                                 // D3: a number every boot, never silence
    if (sw.kept.length) {
      process.stderr.write(`   kept (never auto-deleted — /worktree-retrieve or inspect):\n   ${sw.kept.map(e => `${e.name} — ${e.why}`).join('\n   ')}\n`);
    }
    if (DRY && sw.deleted.length) {
      process.stderr.write(`   would delete:\n   ${sw.deleted.map(e => `${e.name} — ${e.why}`).join('\n   ')}\n`);
    }
    // (sweep row already written inside sweepOrphans; add the step-3 refusals if any)
    if (refused.length) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), refused }) + '\n'); } catch {} }
  } catch (e) {
    process.stderr.write(`worktree-cleanup-boot orphan-sweep: ${e.message}\n`);
  }

  // 6. Decay-date scanner (v1.1, 2026-05-28 plan Phase 4 + C4 fix)
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

  process.exit(0);
} catch (e) {
  process.stderr.write(`worktree-cleanup-boot: ${e.message}\n`);
  process.exit(0);
}
}

if (require.main === module) main();
