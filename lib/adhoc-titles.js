#!/usr/bin/env node
// adhoc-titles — born 2026-10-04
// symptom: 2026-10-04 miya: 'compile the title for today's adhocs for me to write into protime ... I don't want to keep on repeating to ask for a simple short keyword title'
// goal: one command prints the ProTime titles of the day's adhocs, nothing else to ask for
// goal_signal: exit 0 and every listed adhoc has a title
// retention: keep
//
// Lists the ProTime title (block key `title=`) of every adhoc worked on a given day.
// An adhoc counts for the day when its block has ticket_type=adhoc AND
//   (a) quest_start = the day, or
//   (b) its qa_doc file was modified on the day (an older adhoc picked up again).
// Reads quest/active.txt + quest/active-archive.txt of the MAIN checkout. Read-only.
// Exit 0 = every listed adhoc has a title · 1 = a listed adhoc has no title · 2 = usage error.
//
// USAGE: node lib/adhoc-titles.js [--date YYYY-MM-DD] [--root <memorycore root>] [--json]
// state-scoped: no, one list across every state (the block's state= is printed beside the title).
'use strict';
const fs = require('fs');
const path = require('path');

function arg(n) { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; }
function localDay(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

const DATE = arg('date') || localDay(new Date());
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE)) { console.error('usage: node lib/adhoc-titles.js [--date YYYY-MM-DD] [--root <path>] [--json]'); process.exit(2); }

const ROOT = arg('root') || process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
let MAIN = ROOT;
if (!arg('root')) {
  try { MAIN = require(path.join(__dirname, 'states.js')).mainRoot(ROOT); } catch (_) { MAIN = ROOT; }
}

function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; } }
function blocks(text) {
  const out = [];
  let cur = null;
  for (const line of (text || '').split(/\r?\n/)) {
    const m = line.match(/^([a-z0-9_]+)=(.*)$/i);
    if (m && m[1] === 'qa') { cur = { qa: m[2].trim() }; out.push(cur); continue; }
    if (!line.trim()) { cur = null; continue; }
    if (m && cur) cur[m[1]] = m[2].trim();
  }
  return out;
}
function docDay(b) {
  if (!b.qa_doc) return '';
  const p = path.isAbsolute(b.qa_doc) ? b.qa_doc : path.join(MAIN, ...b.qa_doc.split('/'));
  try { return localDay(fs.statSync(p).mtime); } catch (_) { return ''; }
}

const all = blocks(read(path.join(MAIN, 'quest', 'active.txt'))).concat(blocks(read(path.join(MAIN, 'quest', 'active-archive.txt'))));
const seen = new Set();
const rows = [];
for (const b of all) {
  if ((b.ticket_type || '').toLowerCase() !== 'adhoc') continue;
  if (seen.has(b.qa)) continue;
  const started = (b.quest_start || '').slice(0, 10) === DATE;
  const touched = !started && docDay(b) === DATE;
  if (!started && !touched) continue;
  seen.add(b.qa);
  rows.push({ id: b.qa, title: b.title || '', state: b.state || '', env: b.env || '', how: started ? 'new' : 'continued' });
}

if (arg('json') !== undefined || process.argv.includes('--json')) {
  console.log(JSON.stringify({ date: DATE, rows }, null, 2));
} else if (!rows.length) {
  console.log('adhoc-titles ' + DATE + ': no adhoc worked on this day');
} else {
  console.log('adhoc-titles ' + DATE + ': ' + rows.length + ' adhoc');
  for (const r of rows) console.log((r.title || '(NO TITLE)') + '   | ' + r.id + ' | ' + (r.state || '-') + ' ' + (r.env || '-') + ' | ' + r.how);
}
process.exit(rows.some(r => !r.title) ? 1 : 0);
