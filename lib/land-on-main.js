#!/usr/bin/env node
// land-on-main — born via forge
// symptom: 2026-10-14 two regressions in one day landing session-folder commits into the diverged main folder by hand (b4f614f6 undone; stale index for 7 files); slip tracker escalation regression 2 in 7d
// goal: a session-folder commit reaches the main folder with exactly its own change and nothing else, and the shared index is left clean
// goal_signal: land-on-main exits 0 with 'index clean' and 'net change = commit change' for every file
// retention: rotate monthly (system/telemetry/land-on-main.jsonl)
// footprint: on-demand: 1 node process per call plus a few git processes, ~40 MB, exits after printing
//
// USAGE (run from the session folder that holds the commit)
//   node lib/land-on-main.js <commit> [--main <main folder>] [--dry-run] [--except-dirty]
//   --except-dirty: commit the files main has no own edits on; for a file main HAS edits on, add only this
//   commit's lines to its working copy (uncommitted), never touch a staged entry, report each. An append-only .jsonl
//   (the commit only adds rows) that will not patch over main's unsaved tail gets the rows main lacks appended instead.
// Never `git checkout <commit> -- <file>` into a diverged main (it carries the OTHER side's lines too) and never
// `git apply --index` there (main's index is shared; a path-limited commit can leave it stale). system-design Rule 15.
// Exit 0 = landed and proven · 1 = landed but a proof failed (revert it) · 2 = refused, nothing changed.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = process.cwd();
const LOG = process.env.LAND_ON_MAIN_LOG || path.join(__dirname, '..', 'system', 'telemetry', 'land-on-main.jsonl');
const git = (cwd, args, input) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', input, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const mainOf = (p) => p.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+[\\/]?$/, '');
// the +/- lines of one file's diff, CRLF-insensitive, so main's net change can be compared with the commit's
const changeLines = (diff) => diff.split('\n').filter(l => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l)).map(l => l.replace(/\r$/, '')).join('\n');

function land(commit, opts) {
  const main = opts.main || mainOf(SRC);
  const short = git(SRC, ['rev-parse', '--short=8', commit]).trim();
  const subject = git(SRC, ['log', '-1', '--format=%s', commit]).trim();
  const all = git(SRC, ['diff', '--name-only', commit + '~1', commit]).trim().split('\n').filter(Boolean);
  if (!all.length) return { code: 2, msg: `REFUSED — ${short} changes no file` };
  // 1. main must hold no own edit and no staged entry on these files
  const dirty = git(main, ['status', '--porcelain', '--', ...all]).replace(/\s+$/, ''); // never trim the start: column 1 is the status
  const dirtyFiles = dirty ? dirty.split('\n').map(l => l.slice(3).trim().replace(/^"|"$/g, '')) : [];
  if (dirty && !opts.exceptDirty) return { code: 2, msg: `REFUSED — main has its own edits or staged entries on the commit's files (add only your lines by hand, or rerun with --except-dirty):\n${dirty}` };
  const files = all.filter(f => !dirtyFiles.includes(f));
  // --except-dirty: a file main has its own edits on gets ONLY this commit's lines in its working copy (Rule 15:
  // "add just your lines"), uncommitted, so whoever commits that file carries both; a staged entry is never touched
  const added = [];
  // an append-only .jsonl (the commit only adds rows) whose tail in main holds another session's unsaved rows: the
  // patch's end-of-file context never matches, so add the commit's rows main does not hold yet, in main's line ending
  const appendRows = (f) => {
    const rows = git(SRC, ['diff', commit + '~1', commit, '--', f]).split('\n').filter(l => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l));
    if (!rows.length || rows.some(l => l[0] === '-')) return null;
    const p = path.join(main, f), cur = fs.readFileSync(p, 'utf8'), eol = cur.includes('\r\n') ? '\r\n' : '\n';
    const have = new Set(cur.split(/\r?\n/)), want = rows.map(l => l.slice(1).replace(/\r$/, '')).filter(Boolean), todo = want.filter(r => !have.has(r));
    if (!opts.dryRun && todo.length) fs.writeFileSync(p, cur + (cur === '' || cur.endsWith('\n') ? '' : eol) + todo.join(eol) + eol);
    return { file: f, ok: true, why: `append-only: ${opts.dryRun ? 'would append' : 'appended'} ${todo.length}, already had ${want.length - todo.length}; main's own rows kept, NOT committed` };
  };
  for (const f of dirtyFiles) {
    const st = dirty.split('\n').find(l => l.slice(3).trim().replace(/^"|"$/g, '') === f) || '';
    if (st[0] !== ' ' && st[0] !== '?') { added.push({ file: f, ok: false, why: 'staged entry in main: left untouched' }); continue; }
    const fp = path.join(os.tmpdir(), `land-${short}-${process.pid}-one.patch`);
    fs.writeFileSync(fp, git(SRC, ['diff', '--binary', commit + '~1', commit, '--', f]));
    try { git(main, ['apply', '--check', fp]); if (!opts.dryRun) git(main, ['apply', fp]); added.push({ file: f, ok: true, why: opts.dryRun ? 'would add this commit\'s lines to main\'s working copy (uncommitted)' : 'this commit\'s lines added to main\'s working copy, main\'s own edits kept, NOT committed' }); }
    catch (e) { added.push((/\.jsonl$/i.test(f) && appendRows(f)) || { file: f, ok: false, why: 'this commit\'s lines do not apply over main\'s own edits: add them by hand' }); }
    fs.unlinkSync(fp);
  }
  if (!files.length) return { code: added.every(a => a.ok) ? 0 : 1, added, msg: `nothing to commit: every file of ${short} has main's own edits (see the added lines above)` };
  // 2. the patch must apply to main as it is now
  const patch = git(SRC, ['diff', '--binary', commit + '~1', commit, '--', ...files]);
  const tmp = path.join(os.tmpdir(), `land-${short}-${process.pid}.patch`);
  fs.writeFileSync(tmp, patch);
  try { git(main, ['apply', '--check', tmp]); } catch (e) { fs.unlinkSync(tmp); return { code: 2, msg: `REFUSED — the patch does not apply to main (main diverged on these lines):\n${String(e.stderr || e.message).trim()}` }; }
  if (opts.dryRun) { fs.unlinkSync(tmp); return { code: 0, added, msg: `DRY RUN — ${short} would land cleanly: ${files.join(', ')}` }; }
  // 3. working files only, then a path-limited commit
  git(main, ['apply', tmp]); fs.unlinkSync(tmp);
  // a file the commit ADDS is unknown to main's index: intent-to-add only (an empty entry, never content), so the
  // path-limited commit can take it; the index-clean proof below confirms nothing is left staged
  const fresh = files.filter(f => { try { git(main, ['ls-files', '--error-unmatch', '--', f]); return false; } catch (_) { return fs.existsSync(path.join(main, f)); } });
  if (fresh.length) git(main, ['add', '--intent-to-add', '--', ...fresh]);
  git(main, ['commit', '-q', '-m', `${subject} (landed from ${short})`, '-m', 'Co-Authored-By: Ruri <noreply@anthropic.com>', '--', ...files]);
  const landed = git(main, ['rev-parse', '--short=8', 'HEAD']).trim();
  // 4. proofs
  const proofs = [];
  const staged = git(main, ['diff', '--cached', '--name-only', '--', ...files]).trim();
  proofs.push({ name: 'index clean for the commit\'s files', ok: !staged, detail: staged });
  for (const f of files) {
    const want = changeLines(git(SRC, ['diff', commit + '~1', commit, '--', f]));
    const got = changeLines(git(main, ['diff', 'HEAD~1', 'HEAD', '--', f]));
    proofs.push({ name: `net change = commit change: ${f}`, ok: want === got, detail: want === got ? '' : 'main\'s change differs from the commit\'s' });
  }
  const bad = proofs.filter(p => !p.ok).concat(added.filter(a => !a.ok));
  return { code: bad.length ? 1 : 0, landed, proofs, added, msg: bad.length ? `LANDED ${landed} BUT ${bad.length} proof(s) failed — revert it: git -C "${main}" revert ${landed}` : `LANDED ${short} → main ${landed}: ${files.length} file(s), index clean, net change = commit change` };
}

if (require.main === module) {
  const t0 = Date.now(); const commit = process.argv[2]; let r;
  try {
    if (!commit || commit.startsWith('--')) throw new Error('usage: node lib/land-on-main.js <commit> [--main <main folder>] [--dry-run]');
    r = land(commit, { main: arg('main'), dryRun: process.argv.includes('--dry-run'), exceptDirty: process.argv.includes('--except-dirty') });
  } catch (e) { r = { code: 2, msg: 'land-on-main: ' + String(e.stderr || e.message).trim() }; }
  for (const p of r.proofs || []) console.log(`  ${p.ok ? 'ok  ' : 'FAIL'} ${p.name}${p.detail ? ' — ' + p.detail : ''}`);
  for (const a of r.added || []) console.log(`  ${a.ok ? 'ok  ' : 'FAIL'} ${a.file}: ${a.why}`);
  console.log(r.msg);
  try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), commit, outcome: r.msg.split(' ')[0], exit: r.code, dur_ms: Date.now() - t0 }) + '\n'); } catch (_) {}
  process.exit(r.code);
}
module.exports = { land, changeLines, mainOf };
