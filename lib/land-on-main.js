#!/usr/bin/env node
// land-on-main — born via forge
// symptom: 2026-10-14 two regressions in one day landing session-folder commits into the diverged main folder by hand (b4f614f6 undone; stale index for 7 files); slip tracker escalation regression 2 in 7d
// goal: a session-folder commit reaches the main folder with exactly its own change and nothing else, and the shared index is left clean
// goal_signal: land-on-main exits 0 with 'index clean' and 'net change = commit change' for every file
// retention: rotate monthly (system/telemetry/land-on-main.jsonl)
// footprint: on-demand: 1 node process per call plus a few git processes, ~40 MB, exits after printing
//
// USAGE (run from the session folder that holds the commit)
//   node lib/land-on-main.js <commit> [--main <main folder>] [--dry-run]
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
  const files = git(SRC, ['diff', '--name-only', commit + '~1', commit]).trim().split('\n').filter(Boolean);
  if (!files.length) return { code: 2, msg: `REFUSED — ${short} changes no file` };
  // 1. main must hold no own edit and no staged entry on these files
  const dirty = git(main, ['status', '--porcelain', '--', ...files]).trim();
  if (dirty) return { code: 2, msg: `REFUSED — main has its own edits or staged entries on the commit's files (add only your lines by hand, or commit theirs first):\n${dirty}` };
  // 2. the patch must apply to main as it is now
  const patch = git(SRC, ['diff', '--binary', commit + '~1', commit]);
  const tmp = path.join(os.tmpdir(), `land-${short}-${process.pid}.patch`);
  fs.writeFileSync(tmp, patch);
  try { git(main, ['apply', '--check', tmp]); } catch (e) { fs.unlinkSync(tmp); return { code: 2, msg: `REFUSED — the patch does not apply to main (main diverged on these lines):\n${String(e.stderr || e.message).trim()}` }; }
  if (opts.dryRun) { fs.unlinkSync(tmp); return { code: 0, msg: `DRY RUN — ${short} would land cleanly: ${files.join(', ')}` }; }
  // 3. working files only, then a path-limited commit
  git(main, ['apply', tmp]); fs.unlinkSync(tmp);
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
  const bad = proofs.filter(p => !p.ok);
  return { code: bad.length ? 1 : 0, landed, proofs, msg: bad.length ? `LANDED ${landed} BUT ${bad.length} proof(s) failed — revert it: git -C "${main}" revert ${landed}` : `LANDED ${short} → main ${landed}: ${files.length} file(s), index clean, net change = commit change` };
}

if (require.main === module) {
  const t0 = Date.now(); const commit = process.argv[2]; let r;
  try {
    if (!commit || commit.startsWith('--')) throw new Error('usage: node lib/land-on-main.js <commit> [--main <main folder>] [--dry-run]');
    r = land(commit, { main: arg('main'), dryRun: process.argv.includes('--dry-run') });
  } catch (e) { r = { code: 2, msg: 'land-on-main: ' + String(e.stderr || e.message).trim() }; }
  for (const p of r.proofs || []) console.log(`  ${p.ok ? 'ok  ' : 'FAIL'} ${p.name}${p.detail ? ' — ' + p.detail : ''}`);
  console.log(r.msg);
  try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), commit, outcome: r.msg.split(' ')[0], exit: r.code, dur_ms: Date.now() - t0 }) + '\n'); } catch (_) {}
  process.exit(r.code);
}
module.exports = { land, changeLines, mainOf };
