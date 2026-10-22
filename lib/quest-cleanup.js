#!/usr/bin/env node
// quest-cleanup — born via forge
// symptom: 2026-10-22 miya #285768: 'check if you've added into quest save that you will always clean all the temp files, a general cleanup of the session related to the quest'
// goal: every quest save leaves no temp file, scratch copy or work worktree of that quest behind unless it is listed as kept on purpose
// goal_signal: quest-save replies carry a QUEST-CLEANUP line with removed and kept counts
// retention: keep
// footprint: on-demand: one node process under 1 second per quest, ~40 MB
//
// Lists every temp leftover tied to ONE quest and, with --apply, removes the safe ones.
// Called by close-phase "Save-quest mode" step 1b and by Domain Expansion step 2c.
//
// What it finds (by the ticket number in the name):
//   temp      <TEMP>\*<num>*                         folders/files made while checking   -> removed on --apply
//   scratch   <TEMP>\claude\*\*\scratchpad\*<num>*   scratch drafts / scripts             -> removed on --apply
//   junk      <Task folder>\** ~$* · *.bak* · *.tmp  Office locks and backups             -> removed on --apply
//   worktree  <work root>\wt-*<num>*                 etanah work worktrees + their branch -> KEPT unless --drop-worktree
//   The number must stand alone in the name (285768 never matches 2857681). Anything touched in the
//   last 30 minutes is kept: it may belong to another live session on the same ticket.
//             (a worktree can hold staged or unpushed work, so only miya's yes removes it)
//
// USAGE: node lib/quest-cleanup.js <QA-id | ticket number> [--apply] [--drop-worktree] [--json]
//   eval-only: --tmp <dir> --work <dir> --task <dir> (override the roots)
// Exit 0 = ran · 2 = usage error.
// Log: <main root>/domain/quest-cleanup/log.jsonl, one row per run.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const flag = (n) => args.includes('--' + n);
const opt = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined; };
const target = args.find((a) => !a.startsWith('--') && !['--tmp', '--work', '--task'].includes(args[args.indexOf(a) - 1]));
if (!target) { console.error('usage: node lib/quest-cleanup.js <QA-id | ticket number> [--apply] [--drop-worktree] [--json]'); process.exit(2); }
const num = (target.match(/\d{5,}/) || [])[0];
if (!num) { console.error('quest-cleanup: no ticket number in "' + target + '"'); process.exit(2); }
const qa = 'QA-' + num;
const NUM_RE = new RegExp('(^|\\D)' + num + '(\\D|$)');
const has = (name) => NUM_RE.test(name);
const RECENT_MS = 30 * 60 * 1000; // a file touched in the last 30 min may belong to a live session: keep it
const recent = (p) => { try { return Date.now() - fs.statSync(p).mtimeMs < RECENT_MS; } catch { return false; } };

function mainRoot() {
  const here = path.resolve(__dirname, '..');
  const i = here.toLowerCase().indexOf(path.sep + '.claude' + path.sep + 'worktrees' + path.sep);
  return i >= 0 ? here.slice(0, i) : here;
}
const ROOT = mainRoot();

function taskFolder() {
  if (opt('task')) return opt('task');
  for (const f of ['quest/active.txt', 'quest/active-archive.txt']) {
    let text;
    try { text = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { continue; }
    const lines = text.split(/\r?\n/);
    const at = lines.findIndex((l) => l.trim() === 'qa=' + qa);
    if (at < 0) continue;
    for (let j = at + 1; j < lines.length && !/^qa=/.test(lines[j]); j++) {
      const m = lines[j].match(/^task_folder=(.+)$/);
      if (m) return m[1].trim();
    }
  }
  return null;
}

function ls(dir) { try { return fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; } }
function walk(dir, out, depth) {
  if (depth > 6) return;
  for (const e of ls(dir)) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out, depth + 1); else out.push(p);
  }
}

const TMP = opt('tmp') || os.tmpdir();
const WORK = opt('work') || 'E:\\Dev\\etanah-work';
const items = [];

// temp: top level of TEMP carrying the number
for (const e of ls(TMP)) if (has(e.name)) items.push({ kind: 'temp', path: path.join(TMP, e.name), dir: e.isDirectory() });

// scratch: Claude session scratchpads
for (const a of ls(path.join(TMP, 'claude'))) {
  if (!a.isDirectory()) continue;
  for (const b of ls(path.join(TMP, 'claude', a.name))) {
    if (!b.isDirectory()) continue;
    const sp = path.join(TMP, 'claude', a.name, b.name, 'scratchpad');
    for (const e of ls(sp)) if (has(e.name)) items.push({ kind: 'scratch', path: path.join(sp, e.name), dir: e.isDirectory() });
  }
}

// junk: Office locks and backups inside the Task folder
const tf = taskFolder();
if (tf) {
  const files = []; walk(tf, files, 0);
  for (const f of files) {
    const b = path.basename(f);
    if (/^~\$/.test(b) || /\.bak/i.test(b) || /\.tmp$/i.test(b)) items.push({ kind: 'junk', path: f, dir: false });
  }
}

// worktree: etanah work worktrees named for the ticket
for (const e of ls(WORK)) {
  if (!e.isDirectory() || !/^wt-/.test(e.name) || !has(e.name)) continue;
  const wt = path.join(WORK, e.name);
  let branch = '', dirty = 0, repo = '';
  try { branch = execFileSync('git', ['-C', wt, 'branch', '--show-current'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
  try { dirty = execFileSync('git', ['-C', wt, 'status', '--porcelain'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean).length; } catch {}
  try {
    const g = fs.readFileSync(path.join(wt, '.git'), 'utf8').match(/gitdir:\s*(.+)/);
    if (g) repo = path.resolve(g[1].trim(), '..', '..', '..');
  } catch {}
  items.push({ kind: 'worktree', path: wt, dir: true, branch, dirty, repo });
}

const apply = flag('apply');
const dropWt = flag('drop-worktree');
for (const it of items) {
  if (it.kind === 'worktree') {
    if (!(apply && dropWt)) { it.result = 'kept'; it.why = 'worktree: removed only on miya\'s yes (--drop-worktree)' + (it.dirty ? `, ${it.dirty} changed file(s)` : ''); continue; }
    try {
      execFileSync('git', ['-C', it.repo || it.path, 'worktree', 'remove', '--force', it.path], { stdio: 'pipe' });
      if (it.branch && it.repo) { try { execFileSync('git', ['-C', it.repo, 'branch', '-D', it.branch], { stdio: 'pipe' }); } catch {} }
      it.result = 'removed';
    } catch (e) { it.result = 'failed'; it.why = String(e.message).split('\n')[0]; }
    continue;
  }
  if (recent(it.path)) { it.result = 'kept'; it.why = 'touched in the last 30 min, may belong to a live session'; continue; }
  if (!apply) { it.result = 'listed'; continue; }
  try { fs.rmSync(it.path, { recursive: true, force: true }); it.result = fs.existsSync(it.path) ? 'failed' : 'removed'; }
  catch (e) { it.result = 'failed'; it.why = String(e.message).split('\n')[0]; }
}

const count = (r) => items.filter((i) => i.result === r).length;
const line = `QUEST-CLEANUP: ${qa} · ${apply ? 'applied' : 'listed only'} · removed ${count('removed')} · kept ${count('kept')} · listed ${count('listed')} · failed ${count('failed')}`;
if (flag('json')) console.log(JSON.stringify({ line, items }, null, 1));
else {
  console.log(line);
  for (const i of items) console.log(`  ${i.result.padEnd(7)} ${i.kind.padEnd(8)} ${i.path}${i.branch ? '  [branch ' + i.branch + ']' : ''}${i.why ? '  (' + i.why + ')' : ''}`);
  if (!items.length) console.log('  nothing left behind for ' + qa);
}

try {
  const logDir = path.join(ROOT, 'domain', 'quest-cleanup');
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(path.join(logDir, 'log.jsonl'), JSON.stringify({ ts: new Date().toISOString(), qa, apply, removed: count('removed'), kept: count('kept'), listed: count('listed'), failed: count('failed') }) + '\n');
} catch {}
