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
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { sweepOrphans, mergeBaseRef } = require('./worktree-cleanup-boot.js');

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

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
