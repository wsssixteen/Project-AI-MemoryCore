// system-audit: skip-ghost-check — eval harness, run by hand, NOT an event hook
/**
 * worktree-cleanup-boot.eval.js — runnable eval for v1.6's orphan-folder sweep.
 * Run:  node .claude/hooks/worktree-cleanup-boot.eval.js   (exit 0 = PASS)
 *
 * Builds a throwaway repo (origin + clone) and replays the 2026-09-04 failure shapes:
 *  A. de-registered folder, branch already deleted, all content committed → DELETED
 *  B. de-registered folder, branch MERGED into origin/main (local main LAGS) → DELETED + branch -D  (D4)
 *  C. de-registered folder, branch UNMERGED                              → KEPT (surfaced)
 *  D. de-registered folder, NO branch, holds a never-committed edit       → KEPT (safety)
 *  E. registered (live) worktree                                          → UNTOUCHED
 *  F. dry-run performs zero deletes but reports the same plan
 *  H. origin unreachable → merge base falls back to local main, sweep still runs
 *  I. folder name with spaces
 *  J. folder with NO .git file at all → still classified + blob-checked
 *  K. delete blocked by a live process CWD inside the folder → KEPT + "delete failed" surfaced, branch NOT deleted
 *  L. .claude/worktrees absent → empty result, no throw
 *  M. never-committed NOISE only (.verify-notified / .flag / .lock) → still DELETED
 *  R. (v1.7) boot fired from INSIDE a worktree session → sweeps MAIN's .claude/worktrees, logs to MAIN
 *  S. (v1.7) de-registered CURRENT session (exact path or nested path) → never deleted
 *  T. (v1.7) root resolution strips .claude/worktrees/<name> (repo idiom)
 *  U. (v1.7) ls-files failure → content check fails CLOSED (kept), never "no files = safe"
 *  V. (v1.8) boot without WORKTREE_CLEANUP_DELETE=1 → report-only: no orphan deleted, no registered worktree removed
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawn, spawnSync } = require('child_process');
const { sweepOrphans, mergeBaseRef, mainRootOf, neverCommittedFiles } = require('./worktree-cleanup-boot.hook.js');

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗ FAIL:', name); } };
const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }).toString().trim();
const g = (args, cwd) => sh(['git'].concat(args).join(' '), cwd);          // git argv built from parts
const record = (cwd, file, msg) => { g(['add', `"${file}"`], cwd); g(['commit', '-q', '-m', `"${msg}"`], cwd); };

function freshRepo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wtclean-eval-'));
  const origin = path.join(tmp, 'origin.git');
  const repo = path.join(tmp, 'repo');
  g(['init', '-q', '--bare', `"${origin}"`], tmp);
  g(['init', '-q', `"${repo}"`], tmp);
  g(['config', 'user.email', 'e@x'], repo); g(['config', 'user.name', 'eval'], repo); g(['config', 'core.autocrlf', 'false'], repo);
  fs.writeFileSync(path.join(repo, 'a.md'), 'base\n');
  record(repo, 'a.md', 'base');
  g(['branch', '-M', 'main'], repo);
  g(['remote', 'add', 'origin', `"${origin}"`], repo); g(['push', '-q', 'origin', 'main'], repo);
  fs.mkdirSync(path.join(repo, '.claude', 'worktrees'), { recursive: true });
  return { tmp, origin, repo };
}
// make a claude/<name> worktree, optionally record a file / push-to-origin-main / dirty it, then DE-REGISTER (drop admin dir)
function mkWorktree(repo, name, opts) {
  const o = opts || {};
  const dir = path.join(repo, '.claude', 'worktrees', o.folder || name);
  g(['worktree', 'add', '-q', '-b', `"claude/${name}"`, `"${dir}"`, 'main'], repo);
  if (o.commitFile) { fs.writeFileSync(path.join(dir, o.commitFile), `${name}\n`); record(dir, o.commitFile, name); }
  if (o.mergeToOrigin) g(['push', '-q', 'origin', `"claude/${name}:main"`], repo);     // lands on ORIGIN main only; local main lags
  if (o.uncommitted) fs.writeFileSync(path.join(dir, 'a.md'), `never committed ${name} ${Date.now()}\n`);
  if (o.noiseOnly) { fs.mkdirSync(path.join(dir, 'domain', 'x'), { recursive: true }); fs.writeFileSync(path.join(dir, 'domain', 'x', '.verify-notified'), `${Date.now()}\n`); fs.writeFileSync(path.join(dir, 'commit-approved-QA-1.flag'), `${Date.now()}\n`); }
  if (o.mirrorOnly) { fs.mkdirSync(path.join(dir, 'projects', 'k'), { recursive: true }); fs.writeFileSync(path.join(dir, 'projects', 'k', 'index.md'), `robocopy mirror of main's uncommitted edit ${Date.now()}\n`); }
  if (o.sameAsMainUncommitted) { const body = `uncommitted in MAIN too ${Date.now()}\n`; fs.writeFileSync(path.join(dir, 'a.md'), body); fs.writeFileSync(path.join(repo, 'a.md'), body); }
  if (!o.keepRegistered) fs.rmSync(path.join(repo, '.git', 'worktrees', name), { recursive: true, force: true }); // the OneDrive shape
  if (o.dropGitFile) fs.rmSync(path.join(dir, '.git'), { force: true });
  if (o.deleteBranch) g(['branch', '-D', `"claude/${name}"`], repo);
  return dir;
}

// ── main fixture ──
{
  const { tmp, repo } = freshRepo();
  const A = mkWorktree(repo, 'a-nobranch-clean', { deleteBranch: true });
  const B = mkWorktree(repo, 'b-merged', { commitFile: 'b.md', mergeToOrigin: true });
  const C = mkWorktree(repo, 'c-unmerged', { commitFile: 'c.md' });
  const D = mkWorktree(repo, 'd-nobranch-dirty', { deleteBranch: true, uncommitted: true });
  const E = mkWorktree(repo, 'e-live', { keepRegistered: true });
  const I = mkWorktree(repo, 'i-has-spaces', { deleteBranch: true, folder: 'i has spaces' });
  const J = mkWorktree(repo, 'j-no-gitfile', { deleteBranch: true, dropGitFile: true });
  const M = mkWorktree(repo, 'm-noise-only', { deleteBranch: true, noiseOnly: true });
  const N = mkWorktree(repo, 'n-mirror-only', { deleteBranch: true, mirrorOnly: true });
  const O = mkWorktree(repo, 'o-same-as-main-uncommitted', { deleteBranch: true, sameAsMainUncommitted: true });
  g(['fetch', '-q', 'origin'], repo);

  check('D4: merge base resolves to origin/main', mergeBaseRef(repo) === 'origin/main');
  check('D4 shape holds: b-merged NOT ancestor of local main', (() => { try { g(['merge-base', '--is-ancestor', 'claude/b-merged', 'main'], repo); return false; } catch { return true; } })());

  const dry = sweepOrphans(repo, { dryRun: true, here: repo });
  check('F dry-run: 9 orphans seen (A,B,C,D,I,J,M,N,O), live E excluded', dry.orphans.length === 9 && !dry.orphans.some(o => o.name === 'e-live'));
  check('F dry-run: nothing deleted on disk', [A, B, C, D, I, J, M, N, O].every(d => fs.existsSync(d)));
  check('F dry-run plan: C,D keep · A,B,I,J,M,N,O delete', dry.kept.map(o => o.name).sort().join('|') === 'c-unmerged|d-nobranch-dirty' && dry.deleted.length === 7);

  const res = sweepOrphans(repo, { dryRun: false, here: repo });
  check('A no-branch, all committed → deleted', !fs.existsSync(A) && res.deleted.some(o => o.name === 'a-nobranch-clean'));
  check('B merged on origin/main (local lags) → deleted + branch gone', !fs.existsSync(B) && !g(['branch', '--list', 'claude/b-merged'], repo));
  check('C unmerged → kept, surfaced as UNMERGED', fs.existsSync(C) && res.kept.some(o => o.name === 'c-unmerged' && /UNMERGED/.test(o.why)));
  check('D never-committed edit → kept, surfaced', fs.existsSync(D) && res.kept.some(o => o.name === 'd-nobranch-dirty' && /never-committed/.test(o.why)));
  check('E live registered worktree untouched', fs.existsSync(E) && !res.orphans.some(o => o.name === 'e-live'));
  check('I folder name with spaces → deleted', !fs.existsSync(I));
  check('J folder with no .git file → still swept + deleted', !fs.existsSync(J));
  check('M noise-only never-committed (.verify-notified/.flag) → deleted', !fs.existsSync(M));
  check('N projects/ robocopy-mirror edit only → deleted (mirror zone is main\'s, not the worktree\'s)', !fs.existsSync(N));
  check('O uncommitted edit byte-identical to MAIN working copy → deleted (lives in main)', !fs.existsSync(O));
  check('registered count = main + live worktree', res.registered === 2);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
}

// ── H: origin unreachable → fallback to local main ──
{
  const { tmp, repo } = freshRepo();
  g(['remote', 'remove', 'origin'], repo);
  const A = mkWorktree(repo, 'h-nobranch', { deleteBranch: true });
  check('H no origin → merge base falls back to main', mergeBaseRef(repo) === 'main');
  const res = sweepOrphans(repo, { dryRun: false, here: repo });
  check('H sweep still runs offline → orphan deleted', !fs.existsSync(A) && res.baseRef === 'main');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
}

// ── K: delete blocked by an open handle (Windows lock) → kept + surfaced, branch kept ──
if (process.platform === 'win32') {
  const { tmp, repo } = freshRepo();
  const K = mkWorktree(repo, 'k-locked', { commitFile: 'k.md', mergeToOrigin: true });
  g(['fetch', '-q', 'origin'], repo);
  // a process whose CWD is inside the folder is a REAL Windows lock (Node's own open handles share DELETE)
  const child = spawn('cmd.exe', ['/c', 'ping -n 30 127.0.0.1 >nul'], { cwd: K, windowsHide: true, stdio: 'ignore' });
  execSync('ping -n 2 127.0.0.1 >nul');
  const res = sweepOrphans(repo, { dryRun: false, here: repo });
  child.kill();
  check('K locked folder → kept with "delete failed"', res.kept.some(o => o.name === 'k-locked' && /delete failed/.test(o.why)));
  check('K locked folder → branch NOT deleted', !!g(['branch', '--list', 'claude/k-locked'], repo));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
} else {
  console.log('  – K skipped (non-Windows: open handles do not block delete)');
}

// ── P: content STAGED in a sibling worktree's index (blob in object DB, reachable from NO commit) → orphan KEPT ──
//      the 2026-09-04 live miss: staging a salvage copy elsewhere made the orphan look "committed" and it was deleted
{
  const { tmp, repo } = freshRepo();
  const P = mkWorktree(repo, 'p-staged-elsewhere', { deleteBranch: true });
  const body = `only staged, never committed ${Date.now()}\n`;
  fs.writeFileSync(path.join(P, 'work.md'), body);                                   // the orphan's never-committed file
  const S = mkWorktree(repo, 's-sibling', { keepRegistered: true });
  fs.writeFileSync(path.join(S, 'work.md'), body); g(['add', 'work.md'], S);           // same blob now in the object DB via a sibling index
  const res = sweepOrphans(repo, { dryRun: false, here: repo });
  check('P blob staged in sibling index but in no commit → orphan KEPT', fs.existsSync(P) && res.kept.some(o => o.name === 'p-staged-elsewhere' && /never-committed/.test(o.why)));
  const logP = path.join(repo, '.claude', 'state', 'worktree-cleanup-log.jsonl');
  check('P sweep wrote its log row (direct call, not only boot)', fs.existsSync(logP) && /p-staged-elsewhere/.test(fs.readFileSync(logP, 'utf8')));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
}

// ── L: no .claude/worktrees at all ──
{
  const { tmp, repo } = freshRepo();
  fs.rmSync(path.join(repo, '.claude', 'worktrees'), { recursive: true, force: true });
  const res = sweepOrphans(repo, { dryRun: false, here: repo });
  check('L worktrees dir absent → empty result, no throw', res.orphans.length === 0 && res.registered === 0);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
}

// ── R: boot fired from INSIDE a worktree session → sweeps MAIN's folder ──
//      2026-09-27 live miss: projectRoot resolved to the worktree root, so a worktree-rooted boot scanned
//      the worktree's own (empty) .claude/worktrees; 66 folders / 19 GB piled up under main.
{
  const { tmp, repo } = freshRepo();
  const W = mkWorktree(repo, 'w-session', { keepRegistered: true });                      // the live session
  const V = mkWorktree(repo, 'v-live', { keepRegistered: true, commitFile: 'v.md' });     // another live session (unmerged → step 3 leaves it)
  const Z = mkWorktree(repo, 'z-orphan', { deleteBranch: true });                         // clean orphan → delete
  const Y = mkWorktree(repo, 'y-unmerged', { commitFile: 'y.md' });                       // unmerged orphan → keep
  const M2 = mkWorktree(repo, 'm2-merged-live', { keepRegistered: true });                // merged + clean + registered → step 3 target
  const hookCopy = path.join(W, '.claude', 'hooks', 'worktree-cleanup-boot.hook.js');         // the hook as a worktree session runs it
  fs.mkdirSync(path.dirname(hookCopy), { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'worktree-cleanup-boot.hook.js'), hookCopy);
  const boot = (dry, del) => spawnSync(process.execPath, [hookCopy], { cwd: W, encoding: 'utf8', windowsHide: true, timeout: 120000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: W, WORKTREE_CLEANUP_DRY_RUN: dry ? '1' : '0', WORKTREE_CLEANUP_DELETE: del ? '1' : '0', WORKTREE_CLEANUP_FOREGROUND: '1' } });
  let b = boot(true, true);
  check('R dry boot from worktree → plans MAIN\'s orphans, deletes nothing', /2 orphan folder\(s\) → would delete 1/.test(b.stderr) && fs.existsSync(Z));
  // ── V (v1.8): a normal boot WITHOUT the opt-in is report-only — no orphan deleted, no registered worktree removed
  b = boot(false, false);
  const mainLogV = path.join(repo, '.claude', 'state', 'worktree-cleanup-log.jsonl');
  const lastRow = () => { try { const r = fs.readFileSync(mainLogV, 'utf8').trim().split('\n'); return JSON.parse(r[r.length - 1]); } catch { return {}; } };
  check('V boot without opt-in → orphan NOT deleted + line says REPORT ONLY', fs.existsSync(Z) && /REPORT ONLY/.test(b.stderr));
  check('V boot without opt-in → merged registered worktree NOT removed (step 3 frozen)', fs.existsSync(M2));
  check('V boot without opt-in → log row carries dry:true', lastRow().dry === true);
  b = boot(false, true);
  check('V opt-in boot → step 3 removes the merged registered worktree again', !fs.existsSync(M2));
  check('R boot from worktree → MAIN\'s clean orphan deleted', !fs.existsSync(Z));
  check('R boot from worktree → MAIN\'s unmerged orphan kept + surfaced', fs.existsSync(Y) && /y-unmerged — branch claude\/y-unmerged UNMERGED/.test(b.stderr));
  check('R current session + registered sibling untouched', fs.existsSync(W) && fs.existsSync(V));
  const mainLog = path.join(repo, '.claude', 'state', 'worktree-cleanup-log.jsonl');
  check('R log row lands in MAIN, not a worktree copy', fs.existsSync(mainLog) && /z-orphan/.test(fs.readFileSync(mainLog, 'utf8'))
    && !fs.existsSync(path.join(W, '.claude', 'state', 'worktree-cleanup-log.jsonl')));

  // ── B (v2.0 2026-10-05): the hook entry is a LAUNCHER — boot does not wait, the work runs to its end ──
  const stateDir = path.join(repo, '.claude', 'state');
  const reportFile = path.join(stateDir, 'worktree-cleanup-last.json');
  const readReport = () => { try { return JSON.parse(fs.readFileSync(reportFile, 'utf8')); } catch { return null; } };
  const locks = () => { try { return fs.readdirSync(stateDir).filter(f => /^worktree-cleanup-[0-9a-f]{8}\.lock$/.test(f)); } catch { return []; } };
  const waitFor = (pred, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (pred()) return true; execSync('ping -n 2 127.0.0.1 >nul'); } return pred(); };
  const fgReport = readReport();
  const runLog = path.join(repo, 'domain', 'worktree-cleanup-boot', 'log.jsonl');
  check('B1 a foreground run records its report + a finished row in the Feature log (sweep log untouched)', !!fgReport && /worktrees: \d+ registered/.test(fgReport.report) && typeof fgReport.dur_ms === 'number'
    && /"run":"finished"/.test(fs.readFileSync(runLog, 'utf8')) && !/"run":"finished"/.test(fs.readFileSync(mainLog, 'utf8')));
  const launchEnv = { ...process.env, CLAUDE_PROJECT_DIR: W, WORKTREE_CLEANUP_DRY_RUN: '1', WORKTREE_CLEANUP_DELETE: '0' };
  delete launchEnv.WORKTREE_CLEANUP_FOREGROUND;
  const launch = () => { const t = Date.now(); const r = spawnSync(process.execPath, [hookCopy], { cwd: W, encoding: 'utf8', windowsHide: true, timeout: 120000, env: launchEnv }); r.ms = Date.now() - t; return r; };
  const tsBefore = fgReport ? fgReport.ts : '';
  let l = launch();
  check('B2 launcher exits 0 without waiting for the work (well under the 30 s hook limit)', l.status === 0 && l.ms < 10000, `exit=${l.status} ms=${l.ms}`);
  check('B3 launcher shows the LAST finished run\'s headlines, labelled with its age', /last finished run \(\d+ min ago/.test(l.stderr) && /worktrees: \d+ registered/.test(l.stderr), l.stderr.slice(0, 200));
  check('B3b boot prints headlines only: indented detail stays in the file, with a pointer to it', /y-unmerged/.test(fgReport.report) && !/y-unmerged/.test(l.stderr) && /detail line\(s\) in .*worktree-cleanup-last\.json/.test(l.stderr), l.stderr.slice(0, 400));
  check('B4 the background run finishes by itself: a newer report lands and the lock is released', waitFor(() => { const r = readReport(); return r && r.ts !== tsBefore && locks().length === 0; }, 90000), JSON.stringify({ report: readReport() && readReport().ts, tsBefore, locks: locks() }));
  // B5: a run already in flight (fresh lock) → the launcher starts no second run
  const hash = require('crypto').createHash('sha1').update(path.resolve(W).replace(/\\/g, '/').toLowerCase()).digest('hex').slice(0, 8);
  const lockFile = path.join(stateDir, `worktree-cleanup-${hash}.lock`);
  const tsMid = readReport().ts;
  fs.writeFileSync(lockFile, JSON.stringify({ ts: Date.now(), pid: 1, checkout: W }));
  l = launch();
  execSync('ping -n 6 127.0.0.1 >nul');
  check('B5 fresh lock → no second run is started, the lock is left alone', l.status === 0 && readReport().ts === tsMid && fs.existsSync(lockFile), JSON.stringify({ now: readReport().ts, tsMid }));
  // B6: a stale lock (crashed run) does not block forever
  fs.writeFileSync(lockFile, JSON.stringify({ ts: Date.now() - 16 * 60 * 1000, pid: 1, checkout: W }));
  l = launch();
  check('B6 stale lock (16 min) → a fresh run starts and finishes', l.status === 0 && waitFor(() => readReport().ts !== tsMid && locks().length === 0, 90000), JSON.stringify({ now: readReport().ts, tsMid, locks: locks() }));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
}

// ── S: the current session is protected by PATH, not only by registration ──
//      the other laptop's `worktree prune` can drop THIS session's admin dir → the live session reads as an orphan
{
  const { tmp, repo } = freshRepo();
  const X = mkWorktree(repo, 'x-session-deregistered', { deleteBranch: true });           // clean + branchless + de-registered
  const X2 = mkWorktree(repo, 'x2-session-subdir', { deleteBranch: true });
  const Z = mkWorktree(repo, 'z-control', { deleteBranch: true });                         // control: proves the sweep ran
  const res = sweepOrphans(repo, { dryRun: false, here: [X, path.join(X2, 'sub', 'dir')] });
  check('S de-registered CURRENT session never deleted', fs.existsSync(X) && !res.orphans.some(o => o.name === 'x-session-deregistered'));
  check('S session path nested inside a folder protects that folder', fs.existsSync(X2));
  check('S control orphan still deleted (sweep ran)', !fs.existsSync(Z));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
}

// ── T: root resolution — repo idiom (lib/states.js mainRoot · quest/active-cli.js REPO_ROOT) ──
check('T worktree root → main root', mainRootOf('C:\\r\\.claude\\worktrees\\foo') === 'C:\\r');
check('T trailing separator + forward slashes', mainRootOf('/r/.claude/worktrees/foo/') === '/r');
check('T case-insensitive (.Claude\\Worktrees)', mainRootOf('C:\\r\\.Claude\\Worktrees\\Foo') === 'C:\\r');
check('T main root unchanged', mainRootOf('C:\\r') === 'C:\\r');

// ── U: git cannot list the folder → fail CLOSED ──
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wtclean-eval-'));
  const dir = path.join(tmp, 'folder'); const noGit = path.join(tmp, 'no-git-here');
  fs.mkdirSync(dir); fs.mkdirSync(noGit);
  fs.writeFileSync(path.join(dir, 'work.md'), 'unverifiable\n');
  const nc = neverCommittedFiles(dir, noGit);
  check('U ls-files failure → reported unverified (folder would be KEPT)', nc.length > 0 && /ls-files failed/.test(nc[0]));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
}

// ── W: (v1.9) OPEN-QUEST HOLD — 2026-09-27 live miss: the sweep deleted the cwd of a live session whose quest
//      (QA-279411) was on hold; the folder name had no ticket number, the branch lived only in the session transcript ──
{
  const { tmp, repo } = freshRepo();
  const transcripts = path.join(tmp, 'transcripts');
  const writeActive = body => { fs.mkdirSync(path.join(repo, 'quest'), { recursive: true }); fs.writeFileSync(path.join(repo, 'quest', 'active.txt'), body); };
  const transcriptFor = (dir, lines) => { const t = path.join(transcripts, path.resolve(dir).replace(/[^A-Za-z0-9-]/g, '-')); fs.mkdirSync(t, { recursive: true }); fs.writeFileSync(path.join(t, 's.jsonl'), lines); return t; };
  writeActive('qa=QA-279411\nstatus=hold\n\nqa=QA-281568\nstatus=closed\n\nqa=QA-256334\nstatus=active\n\nqa=ADHOC-PT-2026-6\nstatus=active\n');
  const W1 = mkWorktree(repo, 'ticket-256334-work', { deleteBranch: true });                 // number in folder name, open
  const W2 = mkWorktree(repo, 'internal-tickets-review-ffefc6', { deleteBranch: true });     // THE incident shape: no number in name
  transcriptFor(W2, '{"type":"user","gitBranch":"claude/redmine-279411-566a70","x":1}\n');
  const W4 = mkWorktree(repo, 'ticket-281568-done', { deleteBranch: true });                 // number present but quest CLOSED
  const W5 = mkWorktree(repo, 'ticket-999999-unknown', { deleteBranch: true });              // number not in active.txt
  const W8 = mkWorktree(repo, 'build-2794110-seven', { deleteBranch: true });                // 7 digits containing 279411 → not a ticket
  const W9 = mkWorktree(repo, 'garbage-transcript', { deleteBranch: true });
  transcriptFor(W9, 'not json at all \u0000\u0001 {"gitBranch": broken\n');
  const W12 = mkWorktree(repo, 'colleague-cr-issue-ed8731', { deleteBranch: true });         // dry-run find: number only in the session TITLE
  transcriptFor(W12, '{"type":"user","gitBranch":"claude/colleague-cr-issue-ed8731"}\n{"type":"custom-title","customTitle":"256334 - CR -","sessionId":"x"}\n');
  const W10 = mkWorktree(repo, 'transcript-no-jsonl', { deleteBranch: true });
  fs.rmSync(transcriptFor(W10, 'x'), { recursive: true, force: true }); fs.mkdirSync(path.join(transcripts, path.resolve(W10).replace(/[^A-Za-z0-9-]/g, '-')), { recursive: true });

  const dry = sweepOrphans(repo, { dryRun: true, here: repo, transcriptsRoot: transcripts });
  const held = n => dry.kept.some(o => o.name === n && /open quest/.test(o.why));
  check('W1 folder name carries an OPEN ticket → held', held('ticket-256334-work'));
  check('W2 incident shape: branch only in session transcript → held as QA-279411 (hold)', dry.skippedOpenQuest.some(s => s.name === 'internal-tickets-review-ffefc6' && s.qa === 'QA-279411' && s.status === 'hold' && /transcript/.test(s.source)));
  check('W12 number only in the session title → held as QA-256334 via session title', dry.skippedOpenQuest.some(s => s.name === 'colleague-cr-issue-ed8731' && s.qa === 'QA-256334' && s.source === 'session title'));
  check('W4 ticket whose quest is CLOSED → not held (normal rule: deletable)', dry.deleted.some(o => o.name === 'ticket-281568-done'));
  check('W5 ticket absent from active.txt → not held', dry.deleted.some(o => o.name === 'ticket-999999-unknown'));
  check('W8 7-digit run containing 279411 → not read as a ticket', dry.deleted.some(o => o.name === 'build-2794110-seven'));
  check('W9 garbage transcript → no throw, classified normally', dry.deleted.some(o => o.name === 'garbage-transcript'));
  check('W10 transcript dir without .jsonl → no throw, classified normally', dry.deleted.some(o => o.name === 'transcript-no-jsonl'));
  check('W dry run → nothing removed', [W1, W2, W4, W5, W8, W9, W10].every(d => fs.existsSync(d)));

  const live = sweepOrphans(repo, { dryRun: false, here: repo, transcriptsRoot: transcripts });
  check('W live sweep → held folders survive, closed-quest folder deleted', fs.existsSync(W1) && fs.existsSync(W2) && !fs.existsSync(W4));
  const logW = path.join(repo, '.claude', 'state', 'worktree-cleanup-log.jsonl');
  const lastW = JSON.parse(fs.readFileSync(logW, 'utf8').trim().split('\n').pop());
  check('W7 log row lists skippedOpenQuest with qa + source', Array.isArray(lastW.skippedOpenQuest) && lastW.skippedOpenQuest.some(s => s.qa === 'QA-279411' && s.source));

  // W6: active.txt unreadable → fail CLOSED for numbered folders, unnumbered ones follow the normal rule
  fs.rmSync(path.join(repo, 'quest', 'active.txt'), { force: true });
  const W6 = mkWorktree(repo, 'ticket-123456-anything', { deleteBranch: true });
  const W6b = mkWorktree(repo, 'no-number-here', { deleteBranch: true });
  const r6 = sweepOrphans(repo, { dryRun: true, here: repo, transcriptsRoot: transcripts });
  check('W6 active.txt missing → numbered folder held (fail closed)', r6.kept.some(o => o.name === 'ticket-123456-anything' && /unknown/.test(o.why)));
  check('W6 active.txt missing → unnumbered folder still deletable', r6.deleted.some(o => o.name === 'no-number-here'));

  // W3: registered worktree whose admin HEAD names an open ticket → openQuestHold reads the admin HEAD
  writeActive('qa=QA-279411\nstatus=hold\n');
  const W3 = mkWorktree(repo, 'redmine-279411-566a70', { keepRegistered: true, folder: 'plain-name' });
  const { openQuestHold, openQuestMap } = require('./worktree-cleanup-boot.hook.js');
  const h3 = openQuestHold(W3, 'plain-name', repo, transcripts, openQuestMap(repo));
  check('W3 admin HEAD branch carries the open ticket → held via admin HEAD', !!h3 && h3.qa === 'QA-279411' && h3.source === 'admin HEAD');

  // W11: step 3 (registered merged worktree) with opt-in deletes → held, folder + branch kept
  const W11 = mkWorktree(repo, 'm-279411-merged', { keepRegistered: true });
  const sess = mkWorktree(repo, 'session-w11', { keepRegistered: true });
  const hookCopy = path.join(sess, '.claude', 'hooks', 'worktree-cleanup-boot.hook.js');
  fs.mkdirSync(path.dirname(hookCopy), { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'worktree-cleanup-boot.hook.js'), hookCopy);
  const b11 = spawnSync(process.execPath, [hookCopy], { cwd: sess, encoding: 'utf8', windowsHide: true, timeout: 120000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: sess, WORKTREE_CLEANUP_DRY_RUN: '0', WORKTREE_CLEANUP_DELETE: '1', WORKTREE_CLEANUP_FOREGROUND: '1' } });
  check('W11 step 3 opt-in boot → merged registered open-quest worktree NOT removed', fs.existsSync(W11) && !!g(['branch', '--list', 'claude/m-279411-merged'], repo));
  check('W11 boot stderr names the held folder', /held for open quests[\s\S]*m-279411-merged — QA-279411/.test(b11.stderr));
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
