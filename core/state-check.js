#!/usr/bin/env node
/**
 * core/state-check.js — K2 step 1 (blueprint: "non-breaking first step"): validate the
 * CURRENT quest/active.txt format. Read-only; changes nothing; exit 0 with warnings
 * by default, --strict exits 1 on structural errors.
 *
 * Checks:
 *   S1 every block opens with qa=            (structural)
 *   S2 no duplicate qa ids                   (structural — the fused-block killer)
 *   S3 status present + in the canonical enum (structural)
 *   W1 closed/archived blocks still in active.txt (working-memory rule — Phase-2 hygiene)
 *   W2 open blocks missing task_folder or qa_doc  (cold-resume risk)
 *   W3 field census: keys seen once ever (typo candidates)
 *
 * USAGE: node core/state-check.js [--file <path>] [--strict] [--json]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const fileArgIdx = process.argv.indexOf('--file');
const FILE = fileArgIdx > 0 ? path.resolve(process.argv[fileArgIdx + 1]) : path.join(ROOT, 'quest', 'active.txt');
const STRICT = process.argv.includes('--strict');
const AS_JSON = process.argv.includes('--json');
const STATUS_ENUM = ['active', 'hold', 'blocked', 'delegated', 'closed', 'archived'];
const OPEN_SET = ['active', 'hold', 'blocked', 'delegated'];

const raw = fs.readFileSync(FILE, 'utf8');
const errors = [], warnings = [];

// parse: blocks separated by ≥1 blank line; ignore a leading "active:" banner line
const blocks = [];
let cur = null;
const lines = raw.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) { if (cur) { blocks.push(cur); cur = null; } continue; }
  if (/^active:\s*$/.test(line.trim())) continue;
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (!m) {
    (cur ? warnings : errors).push(`line ${i + 1}: unparseable line ${cur ? 'inside block ' + (cur.qa || '?') : 'outside any block'}: "${line.slice(0, 60)}"`);
    continue;
  }
  if (!cur) cur = { _start: i + 1, _fields: {} };
  if (m[1] === 'qa' && cur.qa) {
    // qa= mid-block with no blank line = two blocks FUSED (the hand-edit failure class)
    errors.push(`line ${i + 1}: qa=${m[2]} starts while block ${cur.qa} (line ${cur._start}) is still open — blocks FUSED (missing blank line)`);
    blocks.push(cur);
    cur = { _start: i + 1, _fields: {} };
  }
  cur[m[1]] = m[2];
  cur._fields[m[1]] = (cur._fields[m[1]] || 0) + 1;
  if (cur._fields[m[1]] > 1) warnings.push(`block ${cur.qa || '?'}: duplicate field "${m[1]}"`);
}
if (cur) blocks.push(cur);

// S1/S2/S3
const seen = new Map();
for (const b of blocks) {
  if (!b.qa) { errors.push(`block at line ${b._start}: no qa= opener`); continue; }
  if (seen.has(b.qa)) errors.push(`duplicate qa=${b.qa} (lines ${seen.get(b.qa)} and ${b._start})`);
  seen.set(b.qa, b._start);
  if (!b.status) errors.push(`block ${b.qa}: missing status=`);
  else if (!STATUS_ENUM.includes(b.status)) errors.push(`block ${b.qa}: status "${b.status}" not in enum [${STATUS_ENUM}]`);
}
// W1/W2
const stale = blocks.filter(b => b.status && !OPEN_SET.includes(b.status));
if (stale.length) warnings.push(`${stale.length} closed/archived block(s) still in active.txt (should live in active-archive.txt): ${stale.map(b => b.qa).join(', ')}`);
for (const b of blocks.filter(b => OPEN_SET.includes(b.status))) {
  if (!b.task_folder) warnings.push(`open block ${b.qa}: no task_folder (cold-resume risk)`);
  if (!b.qa_doc) warnings.push(`open block ${b.qa}: no qa_doc (cold-resume risk)`);
}
// W3 field census
const census = {};
for (const b of blocks) for (const k of Object.keys(b)) if (!k.startsWith('_')) census[k] = (census[k] || 0) + 1;
const singletons = Object.entries(census).filter(([k, v]) => v === 1).map(([k]) => k);
if (singletons.length) warnings.push(`field names used exactly once (typo candidates): ${singletons.join(', ')}`);

const result = { file: path.relative(ROOT, FILE), blocks: blocks.length, open: blocks.filter(b => OPEN_SET.includes(b.status)).length, errors, warnings };
if (AS_JSON) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`state-check: ${result.blocks} blocks (${result.open} open) in ${result.file}`);
  for (const e of errors) console.log('  ERROR ' + e);
  for (const w of warnings) console.log('  warn  ' + w);
  console.log(`state-check: ${errors.length} error(s), ${warnings.length} warning(s)`);
}
process.exit(STRICT && errors.length ? 1 : 0);
