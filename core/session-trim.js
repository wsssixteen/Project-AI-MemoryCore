#!/usr/bin/env node
/*
 * core/session-trim.js — keep main/current-session.md as WORKING MEMORY.
 *
 * Why: main/session-format.md:54-57 already says "Session memory must not exceed 500 lines.
 * This prevents context window overflow and keeps session memory lightweight." Nothing
 * enforced it, so the file reached 1665 lines / 135 KB holding 20+ session blocks back to
 * 2026-07-27.
 *
 * The consequence is not cosmetic. CLAUDE.md boot step 5 reads current-session.md to build
 * the Session Briefing. Past ~25k tokens the Read tool TRUNCATES, so boot silently sees a
 * partial file and the briefing is built on partial context — which is exactly the
 * "briefing breaks every time / is inaccurate" symptom みや reported 2026-08-04.
 *
 * Same bug class as quest/active-trim.js: working memory drifted to append-only because
 * completion never triggers cleanup. Same cure: move old blocks to a long-term store.
 *
 * Newest N session blocks -> stay in current-session.md
 * Everything older        -> moved to main/session-archive.md (never deleted)
 *
 * Data-preserving: moves blocks, never deletes. On --apply it first backs up the source.
 *
 * Usage:
 *   node core/session-trim.js                # dry run — prints classification, writes nothing
 *   node core/session-trim.js --apply        # backup + rewrite + append to session-archive.md
 *   node core/session-trim.js --keep 5       # keep newest 5 blocks instead of the default 3
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'main', 'current-session.md');
const ARCHIVE = path.join(ROOT, 'main', 'session-archive.md');
const LIMIT = 500; // main/session-format.md:57

const apply = process.argv.includes('--apply');
const keepArg = process.argv.indexOf('--keep');
const KEEP = keepArg !== -1 && process.argv[keepArg + 1] ? parseInt(process.argv[keepArg + 1], 10) : 3;

if (!fs.existsSync(SRC)) {
  console.error('session-trim: not found — ' + SRC);
  process.exit(1);
}

const raw = fs.readFileSync(SRC, 'utf8');
const lines = raw.split(/\r?\n/);

// Everything before the first "## " heading is the file preamble (title etc.) and always stays.
let firstBlock = lines.findIndex((l) => /^## /.test(l));
if (firstBlock === -1) {
  console.log('session-trim: no "## " session blocks found — nothing to do.');
  process.exit(0);
}
const preamble = lines.slice(0, firstBlock).join('\n').replace(/\s+$/, '');
const body = lines.slice(firstBlock).join('\n');

// Blocks are prepended by Domain Expansion step 2, so file order IS newest-first.
const blocks = body.split(/\n(?=## )/).map((b) => b.replace(/\s+$/, '')).filter((b) => b.trim());

const keep = blocks.slice(0, KEEP);
const move = blocks.slice(KEEP);

const title = (b) => b.split(/\r?\n/)[0].replace(/^##\s*/, '').slice(0, 88);
const countLines = (arr) => arr.reduce((n, b) => n + b.split(/\r?\n/).length + 1, 0);

const beforeLines = lines.length;
const afterLines = preamble.split(/\r?\n/).length + countLines(keep);

console.log('session-trim: ' + SRC);
console.log('  blocks found : ' + blocks.length + '  (keep newest ' + KEEP + ')');
console.log('  lines        : ' + beforeLines + ' -> ' + afterLines + '   (limit ' + LIMIT + ', session-format.md:57)');
console.log('');
console.log('  KEEP:');
keep.forEach((b) => console.log('    · ' + title(b)));
if (move.length) {
  console.log('  MOVE to main/session-archive.md:');
  move.forEach((b) => console.log('    → ' + title(b)));
} else {
  console.log('  MOVE: none');
}

if (afterLines > LIMIT) {
  console.log('');
  console.log('  ⚠️  still over the ' + LIMIT + '-line limit after trim — lower --keep or shorten the newest blocks.');
}

if (!apply) {
  console.log('');
  console.log('  DRY RUN — nothing written. Re-run with --apply.');
  process.exit(0);
}

if (!move.length) {
  console.log('');
  console.log('  Nothing to move; file left untouched.');
  process.exit(0);
}

// Back up before any write.
const backup = SRC + '.bak';
fs.writeFileSync(backup, raw, 'utf8');

// Prepend moved blocks to the archive so it also reads newest-first.
let archiveBody = '';
if (fs.existsSync(ARCHIVE)) {
  const existing = fs.readFileSync(ARCHIVE, 'utf8');
  const idx = existing.indexOf('\n## ');
  archiveBody = idx === -1 ? '' : existing.slice(idx + 1);
}
const archiveHeader = [
  '# Session Archive',
  '',
  '> Long-term episodic store for `main/current-session.md`.',
  '> Rotated out by `core/session-trim.js` so working memory stays under the',
  '> 500-line limit in `main/session-format.md:57`. Newest first. Nothing is ever deleted.',
  '',
].join('\n');
fs.writeFileSync(ARCHIVE, archiveHeader + '\n' + move.join('\n\n') + (archiveBody ? '\n\n' + archiveBody : '') + '\n', 'utf8');

fs.writeFileSync(SRC, preamble + '\n\n' + keep.join('\n\n') + '\n', 'utf8');

const nowLines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/).length;
console.log('');
console.log('  ✓ moved ' + move.length + ' block(s) to main/session-archive.md');
console.log('  ✓ current-session.md now ' + nowLines + ' lines' + (nowLines <= LIMIT ? ' (under limit)' : ' (STILL OVER LIMIT)'));
console.log('  ✓ backup at ' + path.basename(backup));
