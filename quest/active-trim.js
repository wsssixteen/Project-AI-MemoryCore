#!/usr/bin/env node
/*
 * quest/active-trim.js — keep active.txt as WORKING MEMORY (open quests only).
 *
 * Why: active.txt had drifted to append-only — every closed/archived quest stayed in it
 * (~694 lines / 100 KB). That conflates working memory (current open quests) with
 * long-term episodic memory (closed-quest history). Per agentic-memory architecture,
 * working memory holds only what's needed NOW; closed-quest history belongs in the
 * long-term stores that already exist (QA-NNN.md + post-mortems.md + kpi-tracker.md).
 *
 * This is the SAME bug class as "standing flags not clearing after a task is done":
 * completion does not trigger working-memory cleanup. Fix = move done blocks out.
 *
 * Open  = status in {active, hold, blocked, delegated}  -> stay in active.txt
 * Done  = anything else (archived, closed, complete, ...) -> moved to active-archive.txt
 *
 * Data-preserving: moves blocks, never deletes. On --apply it first backs up active.txt.
 *
 * Usage:
 *   node quest/active-trim.js           # dry run — prints classification, writes nothing
 *   node quest/active-trim.js --apply   # backup + rewrite active.txt + append to active-archive.txt
 */
'use strict';
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const activePath = path.join(dir, 'active.txt');
const archivePath = path.join(dir, 'active-archive.txt');
const apply = process.argv.includes('--apply');

const OPEN = new Set(['active', 'hold', 'blocked', 'delegated']);

const raw = fs.readFileSync(activePath, 'utf8');
// drop standalone section-header lines ("active:" / "closed:")
const body = raw.split(/\r?\n/).filter((l) => !/^(active|closed):\s*$/.test(l)).join('\n');
// split into blocks at every line beginning with "qa="
const blocks = body.split(/\n(?=qa=)/).map((b) => b.trim()).filter((b) => b.startsWith('qa='));

const open = [];
const done = [];
const noStatus = [];
for (const b of blocks) {
  const m = b.match(/^status=([\w-]+)/m);
  const status = m ? m[1] : '';
  const phaseDone = /^phase=(complete|1-complete|2-complete)/m.test(b); // legacy blocks: phase= instead of status=
  if (status && OPEN.has(status)) { open.push(b); continue; }
  if (status || phaseDone) { done.push(b); continue; }
  noStatus.push(b); open.push(b); // safe default: keep only when neither an open status nor a done-phase
}

const qaOf = (b) => (b.match(/^qa=(\S+)/m) || [null, '?'])[1];
console.log(`blocks total=${blocks.length}  open=${open.length}  done=${done.length}  no-status(kept)=${noStatus.length}`);
console.log('OPEN kept :', open.map(qaOf).join(', '));
console.log('DONE moved:', done.map(qaOf).join(', '));

if (!apply) { console.log('\nDRY RUN — re-run with --apply to write.'); process.exit(0); }

// backup
const stamp = new Date().toISOString().slice(0, 10);
let bak = activePath + '.bak_' + stamp + '_pre_trim';
let _i = 1; while (fs.existsSync(bak)) { _i++; bak = activePath + '.bak_' + stamp + '_pre_trim' + _i; }
fs.copyFileSync(activePath, bak); // never clobber the original pre-trim backup

const openOut = 'active:\n\n' + open.join('\n\n') + '\n';
fs.writeFileSync(activePath, openOut, 'utf8');

const archivePreamble =
  '# active-archive.txt — episodic store of CLOSED/ARCHIVED quest state-blocks moved out of active.txt.\n' +
  '# active.txt is WORKING MEMORY (open quests only). Canonical long-term homes remain\n' +
  '# QA-NNN.md + main/post-mortems.md + main/kpi-tracker.md; these blocks are a pointer-grade mirror.\n';
let archive = fs.existsSync(archivePath) ? fs.readFileSync(archivePath, 'utf8') : archivePreamble;
archive += `\n# ---- archived ${stamp} (moved from active.txt by active-trim.js) ----\n\n` + done.join('\n\n') + '\n';
fs.writeFileSync(archivePath, archive, 'utf8');

console.log(`\nAPPLIED.\n  backup   -> ${bak}\n  active   -> ${open.length} open block(s)\n  archive  -> +${done.length} block(s) in ${archivePath}`);
