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
 *
 * v1.7 2026-09-27 — MAIN-ROOT TARGETING (per みや). projectRoot (__dirname/../..) is the checkout
 * that booted; in a worktree session that is the WORKTREE root, so step 5 scanned the worktree's
 * own empty .claude/worktrees and main's folder was never swept from a worktree boot. The log
 * forked into per-worktree copies too.
 *   symptom:     2026-09-27 — 66 folders / 19 GB under main's .claude/worktrees, 2 registered; dry run of sweepOrphans(main) = 27 deletable (8.2 GB), 37 kept
 *   goal:        a boot from main OR any in-tree worktree sweeps MAIN's .claude/worktrees and logs to MAIN's worktree-cleanup-log.jsonl
 *   goal_signal: main's log gains one row per completed boot, naming main's folders
 *   retention:   keep (.claude/state/worktree-cleanup-log.jsonl — append-only "why was X deleted" ledger)
 *   Changed: MAIN_ROOT = mainRootOf(projectRoot) (repo idiom: lib/states.js mainRoot · quest/active-cli.js)
 *     drives step 5 + LOG + the sweepOrphans/neverCommittedFiles defaults · `here` takes a LIST
 *     (this checkout + CLAUDE_PROJECT_DIR + cwd) and protects any folder CONTAINING one of them — a
 *     de-registered live session is not in git's list, only its path protects it · neverCommittedFiles
 *     fails CLOSED when ls-files / hash-object fail (v1.6 read a failure as "no files" = safe).
 *   Spec preservation vs v1.6: steps 1 · 1.5 · 1.6 · 2 · 2.5 · 2.6 · 3+4 · 6 still act on the booting
 *     checkout — unchanged. Delete rule unchanged (every non-ignored file reachable from a ref or
 *     byte-identical to main). Registered + current never swept — kept, current widened to path
 *     containment. Dropped: none. Eval fixtures R · S · T · U.
 *
 * v1.8 2026-09-27 — BOOT DELETES FROZEN (per みや's "have you confirmed it is safe to delete?").
 *   The delete rule proves only committed + non-ignored files. An audit of the 22 "deletable"
 *   folders found gitignored / mirror-path files the rule never looks at, newer than main or
 *   missing from main (quest docs, etanah-knowledge edits, feature logs). A v1.6 main-root boot
 *   deleted the first 4 of those folders alphabetically before its 30 s kill.
 *   symptom:     2026-09-27 — 4 planned-delete folders vanished between two dry runs; audit: 250 files newer than main + 158 absent from main in the 22 folders
 *   goal:        no boot deletes a folder until the rule also proves ignored-path content, or みや opts in
 *   goal_signal: boot sweep log rows carry dry:true unless WORKTREE_CLEANUP_DELETE=1
 *   retention:   keep (same log)
 *   Changed: step 5 sweep is report-only unless WORKTREE_CLEANUP_DELETE=1. Direct sweepOrphans()
 *     calls keep their explicit dryRun. Spec preservation: every v1.7 spec intact; boot-time
 *     deletion SUSPENDED (named, reversible: set the env var). Eval fixture V.
 *
 * v1.9 2026-09-28 — OPEN-QUEST HOLD (per みや).
 *   symptom:     2026-09-27T01:09 manual salvage-and-sweep deleted internal-tickets-review-ffefc6, the cwd of the live
 *                session "279411 - All urusan - Ulasan JT" (QA-279411 status=hold); session became unusable. The folder
 *                name held no ticket number; the branch (claude/redmine-279411-566a70) survived only in the session transcript.
 *   goal:        no sweep or step-3 removal deletes a worktree folder tied to a ticket with an OPEN block in quest/active.txt
 *   goal_signal: sweep log rows carry skippedOpenQuest[] / openQuestSkips[] naming the held folder + qa + source
 *   retention:   keep (same log)
 *   Changed: openQuestHold() reads ticket numbers from folder name · admin HEAD · session-transcript gitBranch + session
 *     title (custom-title record; 3 newest transcripts, >32 MB skipped — dry smoke found "256334 - CR -" held only by title), matches
 *     MAIN's active.txt (active/hold/blocked/delegated); unreadable active.txt → every numbered folder held (fail closed).
 *     Applied in sweepOrphans (orphans) and step 3 (registered merged worktrees; branch kept too).
 *   Spec preservation: every v1.8 spec intact (report-only default, delete rule, current-session path protection).
 *     Additive only. Dropped: none. Eval fixtures W1-W9.
 *
 * v2.0 2026-10-05 — BACKGROUND RUN (per みや, boot audit; installed as a Feature the same day).
 *   symptom:     the hook took ~30 s at every boot and the 30 s hook limit killed it on 168 of 190 runs in
 *                30 days — boot waited the full 30 s AND the cleanup + the worktree content-sync almost never finished.
 *   goal:        boot does not wait for the cleanup, and the cleanup always runs to its end.
 *   goal_signal: the SessionStart telemetry row for this hook is under 1 s; each background run appends a
 *                {run:'finished', dur_ms} row to domain/worktree-cleanup-boot/log.jsonl (the sweep log is untouched).
 *   Changed: the hook entry is now a LAUNCHER — it prints the report of the last finished run (with its age),
 *     starts the real work as a detached process (`--run`), and exits. One run per checkout at a time
 *     (lock file, 15 min stale-out). The work itself (main()) is byte-for-byte the v1.9 body.
 *     WORKTREE_CLEANUP_FOREGROUND=1 keeps the old wait-for-it behaviour (the eval uses it).
 *   Spec preservation: every v1.9 step and guard intact. One spec is CHANGED and named: the report a boot
 *     shows is the PREVIOUS run's (labelled with its age); the first boot of a brand-new checkout shows none.
 *   Eval fixtures B1-B6.
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');                 // the checkout that booted (main OR a worktree)
// v1.7 — the sweep + its log always target the MAIN repo, whichever checkout booted
const mainRootOf = dir => String(dir).replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/i, '');
const MAIN_ROOT = mainRootOf(projectRoot);
const skillsDir = path.join(projectRoot, '.claude', 'skills');
const DRY = process.env.WORKTREE_CLEANUP_DRY_RUN === '1';
const BOOT_DELETES = process.env.WORKTREE_CLEANUP_DELETE === '1';     // v1.8: boot sweep is report-only unless opted in
const LOG = path.join(MAIN_ROOT, '.claude', 'state', 'worktree-cleanup-log.jsonl');

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
  const r = root || MAIN_ROOT;
  const gitDir = path.join(r, '.git');
  const ls = runFull(`git --git-dir="${gitDir}" --work-tree="${dir}" ls-files -co --exclude-standard`, r);
  if (!ls.ok) return [`(ls-files failed, unverified: ${ls.err.split('\n')[0]})`];   // v1.7: fail CLOSED
  const listed = ls.out;
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
    if (hashed.split('\n').length !== files.length) return files;          // v1.7: fail CLOSED — an unhashed file is never proven safe
    const reach = reachableBlobs(r);
    const missing = [];
    hashed.split('\n').forEach((h, i) => { h = h.trim(); if (files[i] && !reach.has(h) && !sameAsMain(files[i])) missing.push(files[i]); });
    return missing;
  } finally {
    try { fs.unlinkSync(tmpP); } catch {}
    try { fs.unlinkSync(tmpH); } catch {}
  }
}

/**
 * v1.9 — OPEN-QUEST HOLD. Ticket numbers (6 digits) tied to a worktree folder, from every source that
 * survives a de-registration: the folder name, the branch in the folder's own git admin HEAD, and the
 * gitBranch + session title (custom-title) the Claude desktop recorded in that folder's session transcripts
 * (~/.claude/projects/<cwd with non [A-Za-z0-9-] chars as '-'>/*.jsonl). Returns the first number with
 * an OPEN block in MAIN's quest/active.txt, else null. active.txt unreadable → any numbered folder is held.
 */
const OPEN_STATUSES = /^(active|hold|blocked|delegated)$/;
function openQuestMap(root) {
  try {
    const txt = fs.readFileSync(path.join(root, 'quest', 'active.txt'), 'utf8');
    const map = new Map();
    for (const b of txt.split(/^(?=qa=)/m)) {
      const qa = (b.match(/^qa=(\S+)/m) || [])[1];
      const st = ((b.match(/^status=(\S+)/m) || [])[1] || '').trim();
      const num = qa && (qa.match(/(\d{6})/) || [])[1];
      if (num && OPEN_STATUSES.test(st)) map.set(num, { qa, status: st });
    }
    return map;
  } catch { return null; }
}
function ticketSources(dir, name, transcriptsRoot) {
  const found = [];                                                     // [{num, source}]
  const add = (text, source) => { for (const m of String(text || '').matchAll(/(?<!\d)(\d{6})(?!\d)/g)) found.push({ num: m[1], source }); };
  add(name, 'folder name');
  try {
    const link = fs.readFileSync(path.join(dir, '.git'), 'utf8').match(/^gitdir:\s*(.+)$/m);
    if (link) add(fs.readFileSync(path.join(link[1].trim(), 'HEAD'), 'utf8'), 'admin HEAD');
  } catch {}
  try {
    const tdir = path.join(transcriptsRoot, path.resolve(dir).replace(/[^A-Za-z0-9-]/g, '-'));
    const newest = fs.readdirSync(tdir).filter(f => f.endsWith('.jsonl'))
      .map(f => ({ f, t: fs.statSync(path.join(tdir, f)).mtimeMs })).sort((a, b) => b.t - a.t).slice(0, 3);
    for (const n of newest) {
      const p = path.join(tdir, n.f);
      if (fs.statSync(p).size > 32 * 1048576) continue;                 // a runaway transcript is skipped, never a boot stall
      const text = fs.readFileSync(p, 'utf8');
      for (const m of text.matchAll(/"gitBranch":"([^"]+)"/g)) add(m[1], 'session transcript branch');
      for (const m of text.matchAll(/"type":"custom-title","customTitle":"([^"]*)"/g)) add(m[1], 'session title');
    }
  } catch {}
  return found;
}
function openQuestHold(dir, name, root, transcriptsRoot, map) {
  const src = ticketSources(dir, name, transcriptsRoot);
  if (!src.length) return null;
  if (map === null) return { qa: `#${src[0].num}`, status: 'unknown (active.txt unreadable)', source: src[0].source };
  for (const s of src) { const q = map.get(s.num); if (q) return { qa: q.qa, status: q.status, source: s.source }; }
  return null;
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
  const r = root || MAIN_ROOT;
  const o = Object.assign({ dryRun: DRY, baseRef: null, here: null, transcriptsRoot: path.join(os.homedir(), '.claude', 'projects') }, opts || {});
  const wtDir = path.join(r, '.claude', 'worktrees');
  const res = { registered: 0, orphans: [], deleted: [], kept: [], skippedOpenQuest: [], baseRef: null };
  const questMap = openQuestMap(r);                                     // v1.9
  if (!fs.existsSync(wtDir)) return res;
  const base = o.baseRef || mergeBaseRef(r);
  res.baseRef = base;
  const reg = registeredWorktrees(r);
  res.registered = reg.length;
  const regSet = new Set(reg.map(w => norm(w.path)));
  const here = [].concat(o.here || r).filter(Boolean).map(norm);       // v1.7: one path or a list
  const dirs = fs.readdirSync(wtDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  for (const name of dirs) {
    const full = path.join(wtDir, name);
    if (regSet.has(norm(full)) || here.some(h => h === norm(full) || h.startsWith(norm(full) + '/'))) continue;   // registered, or holds the current session → not ours
    const branch = `claude/${name}`;
    const hasBranch = !!run(`git show-ref --verify --quiet "refs/heads/${branch}" && echo y`, r);
    const hold = openQuestHold(full, name, r, o.transcriptsRoot, questMap);   // v1.9: an open quest's session folder is never swept
    if (hold) {
      const entry = { name, verdict: 'keep', why: `open quest ${hold.qa} (${hold.status}) via ${hold.source}`, hasBranch };
      res.orphans.push(entry); res.kept.push(entry);
      res.skippedOpenQuest.push({ name, qa: hold.qa, status: hold.status, source: hold.source });
      continue;
    }
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
      deleted: res.deleted.map(e => e.name), kept: res.kept.map(e => ({ name: e.name, why: e.why })), skippedOpenQuest: res.skippedOpenQuest }) + '\n');
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

module.exports = { sweepOrphans, neverCommittedFiles, registeredWorktrees, mergeBaseRef, dirBytes, mainRootOf, openQuestMap, openQuestHold, ticketSources };

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
  const openQuestSkips = [];                                           // v1.9
  const questMap3 = openQuestMap(MAIN_ROOT);
  const transcripts = path.join(os.homedir(), '.claude', 'projects');
  const wtByBranch = new Map(registeredWorktrees().filter(w => w.branch).map(w => [w.branch, w.path]));
  for (const b of mergedBranches) {
    const wt = wtByBranch.get(b);
    if (wt && norm(wt) === here) continue;                             // never self-remove
    if (wt) {
      const hold = openQuestHold(wt, `${path.basename(wt)} ${b}`, MAIN_ROOT, transcripts, questMap3);
      if (hold) { openQuestSkips.push({ name: path.basename(wt), branch: b, qa: hold.qa, status: hold.status, source: hold.source }); continue; }   // branch kept too
      if (DRY || !BOOT_DELETES) continue;                              // v1.8: `worktree remove` ignores gitignored files → frozen too
      const rm = runFull(`git worktree remove "${wt}"`);
      if (!rm.ok) { refused.push(`${path.basename(wt)} (${b}): ${rm.err.split('\n')[0]}`); continue; }
    }
    if (!DRY) run(`git branch -d "${b}"`);
  }
  if (refused.length) {
    process.stderr.write(`⚠️ worktree-cleanup-boot: ${refused.length} merged worktree(s) REFUSED removal — branch kept:\n   ${refused.join('\n   ')}\n`);
  }

  // 5. ORPHAN-FOLDER SWEEP (v1.6, D1) — folders on disk that git no longer lists.
  //    v1.7: always MAIN's folder, whichever checkout booted; this session is protected by path.
  try {
    const dry = DRY || !BOOT_DELETES;                                  // v1.8: report-only unless WORKTREE_CLEANUP_DELETE=1
    const sw = sweepOrphans(MAIN_ROOT, { dryRun: dry, baseRef, here: [projectRoot, process.env.CLAUDE_PROJECT_DIR, process.cwd()] });
    const gb = b => (b / 1073741824).toFixed(2);
    let keptBytes = 0, delBytes = 0;
    for (const e of sw.kept) keptBytes += dirBytes(path.join(MAIN_ROOT, '.claude', 'worktrees', e.name));
    if (dry) for (const e of sw.deleted) delBytes += dirBytes(path.join(MAIN_ROOT, '.claude', 'worktrees', e.name));
    const line = `worktrees: ${sw.registered} registered · ${sw.orphans.length} orphan folder(s)` +
      (sw.orphans.length ? ` → ${dry ? 'would delete' : 'deleted'} ${sw.deleted.length}${dry ? ` (${gb(delBytes)} GB)` : ''} · kept ${sw.kept.length}${sw.kept.length ? ` (${gb(keptBytes)} GB)` : ''}` : '') +
      (DRY ? '  [DRY RUN]' : dry ? '  [REPORT ONLY — boot deletes frozen, WORKTREE_CLEANUP_DELETE=1 to enable]' : '');
    process.stderr.write(line + '\n');                                 // D3: a number every boot, never silence
    if (sw.kept.length) {
      process.stderr.write(`   kept (never auto-deleted — /worktree-retrieve or inspect):\n   ${sw.kept.map(e => `${e.name} — ${e.why}`).join('\n   ')}\n`);
    }
    if (dry && sw.deleted.length) {
      process.stderr.write(`   would delete:\n   ${sw.deleted.map(e => `${e.name} — ${e.why}`).join('\n   ')}\n`);
    }
    // (sweep row already written inside sweepOrphans; add the step-3 refusals if any)
    if (refused.length || openQuestSkips.length) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), refused, openQuestSkips }) + '\n'); } catch {} }
    const held = sw.skippedOpenQuest.concat(openQuestSkips);
    if (held.length) process.stderr.write(`   held for open quests (never removed):\n   ${held.map(e => `${e.name} — ${e.qa} (${e.status}) via ${e.source}`).join('\n   ')}\n`);
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

// ── v2.0 background run ──
const crypto = require('crypto');
const STATE_DIR = path.join(MAIN_ROOT, '.claude', 'state');
const REPORT = path.join(STATE_DIR, 'worktree-cleanup-last.json');                       // newest finished run, any checkout
const LOCK = path.join(STATE_DIR, 'worktree-cleanup-' + crypto.createHash('sha1').update(norm(projectRoot)).digest('hex').slice(0, 8) + '.lock');
const LOCK_STALE_MS = 15 * 60 * 1000;
const RUN_LOG = path.join(MAIN_ROOT, 'domain', 'worktree-cleanup-boot', 'log.jsonl');       // observability of the background run: one row per finished run

/** The real work, with everything it prints captured so the NEXT boot can show it. */
function runAndRecord() {
  const t0 = Date.now(); let buf = '';
  const orig = process.stderr.write.bind(process.stderr);
  process.stderr.write = (s, ...a) => { buf += String(s); try { return orig(s, ...a); } catch (_) { return true; } };
  process.on('exit', () => {
    try {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      fs.writeFileSync(REPORT, JSON.stringify({ ts: new Date().toISOString(), dur_ms: Date.now() - t0, checkout: projectRoot, report: buf }));
      // run rows go to the Feature's OWN log — never the sweep log, whose LAST row lib/observatory.js reads as the sweep verdict
      fs.mkdirSync(path.dirname(RUN_LOG), { recursive: true });
      fs.appendFileSync(RUN_LOG, JSON.stringify({ ts: new Date().toISOString(), run: 'finished', dur_ms: Date.now() - t0, checkout: path.basename(projectRoot), lines: buf.split('\n').filter(Boolean).length }) + '\n');
    } catch (_) {}
    try { fs.unlinkSync(LOCK); } catch (_) {}
  });
  main();
}

/** The hook entry: show the last report, start a fresh run in the background, return at once. */
function launch() {
  try {
    const r = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
    if (r.report && r.report.trim()) {
      const mins = Math.max(0, Math.round((Date.now() - Date.parse(r.ts)) / 60000));
      process.stderr.write(`worktree-cleanup — report of the last finished run (${mins} min ago, took ${Math.round(r.dur_ms / 1000)} s; a fresh run is starting in the background):\n` + r.report);
    }
  } catch (_) {}
  let busy = false;
  try { busy = Date.now() - JSON.parse(fs.readFileSync(LOCK, 'utf8')).ts < LOCK_STALE_MS; } catch (_) {}
  if (!busy) {
    try {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      fs.writeFileSync(LOCK, JSON.stringify({ ts: Date.now(), pid: process.pid, checkout: projectRoot }));
      spawn(process.execPath, [__filename, '--run'], { cwd: projectRoot, detached: true, stdio: 'ignore', windowsHide: true, env: process.env }).unref();
    } catch (e) {
      process.stderr.write(`worktree-cleanup-boot launch: ${e.message}\n`);
      try { fs.unlinkSync(LOCK); } catch (_) {}
    }
  }
  process.exit(0);
}

if (require.main === module) {
  if (process.argv.includes('--run') || process.env.WORKTREE_CLEANUP_FOREGROUND === '1') runAndRecord();
  else launch();
}
