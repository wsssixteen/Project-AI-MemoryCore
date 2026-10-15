#!/usr/bin/env node
// archive-hold — keep a quest or adhoc out of every archive move until the hold is cleared.
// symptom: 2026-10-15 miya: "put an alert to not be archived or auto-archived ... a ticket might be created later than usual" (ADHOC-PRBB-2026-14)
// goal: a held quest or adhoc stays live (Task folder, active.txt block, project folder) whatever archive path runs, until the hold is cleared or its ticket arrives
// goal_signal: every archive mover refuses a held id and names the hold; `list` shows each hold with its reason
// retention: keep
// footprint: on-demand: 1 node process per call, reads quest/active.txt, about 0.1 s; nothing running otherwise
//
// The hold is ONE field on the active.txt block:  archive_hold=<YYYY-MM-DD>: <reason>
// Empty or absent = no hold. Movers that honour it (each calls holdIn() on the block it is about to move):
//   quest/archive-quest.js · quest/delegate-quest.js · quest/active-cli.js archive · quest/active-trim.js
//   domain/adhoc-lifecycle/adhoc-lifecycle.js archive (and promote releases it: the ticket it waited for arrived)
// Deciders that report it: lib/save-quest.js (verdict HELD) · lib/adhoc-save-audit.js (a held adhoc is not told to archive).
//
// USAGE:
//   node domain/archive-hold/archive-hold.js set   <ID> --reason "<why it must stay>"
//   node domain/archive-hold/archive-hold.js clear <ID>
//   node domain/archive-hold/archive-hold.js check <ID>        exit 0 = not held · 3 = held (reason printed)
//   node domain/archive-hold/archive-hold.js list
//   flags: --file <active.txt> (tests) · --json
// state-scoped: no. active.txt holds every state's blocks; the hold is per id.
'use strict';
const fs = require('fs');
const path = require('path');

const FIELD = 'archive_hold';
// Same main-root rule as quest/active-cli.js: active.txt is shared, a worktree must use main's copy.
const MAIN_ROOT = path.resolve(__dirname, '..', '..').replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
const LOG = process.env.ARCHIVE_HOLD_LOG || path.join(__dirname, 'log.jsonl');

function arg(name) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : null; }
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

// Hold reason from a block given as text or as an array of lines; null when not held.
function holdIn(block) {
  if (!block) return null;
  const lines = Array.isArray(block) ? block : String(block).split(/\r?\n/);
  for (const l of lines) {
    const m = String(l).match(/^archive_hold=(.*)$/);
    if (m && m[1].trim()) return m[1].trim();
  }
  return null;
}

// Split active.txt text into { header, blocks: [{ id, lines }] } — same block rule as active-cli.js.
function parse(text) {
  const header = [], blocks = [];
  let cur = null;
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = line.match(/^qa=(\S+)/);
    if (m) { cur = { id: m[1], lines: [line] }; blocks.push(cur); }
    else if (cur) cur.lines.push(line);
    else header.push(line);
  }
  for (const b of blocks) while (b.lines.length && !b.lines[b.lines.length - 1].trim()) b.lines.pop();
  return { header: header.join('\n'), blocks };
}
// Same output as quest/active-cli.js renderBlocks, so a hold edit never reflows the file.
function render(header, blocks) {
  const parts = [];
  if (header && header.trim()) parts.push(header.replace(/\s+$/, ''));
  for (const b of blocks) parts.push(b.lines.join('\n'));
  return parts.join('\n\n') + '\n';
}

function activePath() { return arg('file') || process.env.ACTIVE_TXT || path.join(MAIN_ROOT, 'quest', 'active.txt'); }

// Reason the id is held, read from active.txt; null when not held or not found.
function holdOf(id, file) {
  try { const b = parse(fs.readFileSync(file || activePath(), 'utf8')).blocks.find(x => x.id === id); return b ? holdIn(b.lines) : null; }
  catch (_) { return null; }
}

// Ids of held blocks whose adhoc_register_row equals row (adhoc-lifecycle keys by register row).
function heldByRegisterRow(row, file) {
  try {
    return parse(fs.readFileSync(file || activePath(), 'utf8')).blocks
      .filter(b => b.lines.some(l => l.trim() === `adhoc_register_row=${row}`) && holdIn(b.lines))
      .map(b => ({ id: b.id, reason: holdIn(b.lines) }));
  } catch (_) { return []; }
}

// The refusal every mover prints, so the wording is one.
function refusal(id, reason, mover) {
  return [
    `⛔ archive-hold: ${id} is held — ${mover} will not move it.`,
    `   Hold: ${reason}`,
    `   Keep it open, or release it first:  node domain/archive-hold/archive-hold.js clear ${id}`,
  ].join('\n');
}

function writeAtomic(p, text) { const tmp = p + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, text); fs.renameSync(tmp, p); }

function setField(file, id, value) {
  const { header, blocks } = parse(fs.readFileSync(file, 'utf8'));
  const b = blocks.find(x => x.id === id);
  if (!b) return false;
  b.lines = b.lines.filter(l => !l.startsWith(FIELD + '='));
  if (value !== null) b.lines.push(`${FIELD}=${value}`);
  writeAtomic(file, render(header, blocks));
  return true;
}

function log(row) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch (_) {} }

// Release every hold waiting on this register row (adhoc-lifecycle promote: the ticket arrived).
function releaseByRegisterRow(row, ticket, file) {
  const f = file || activePath();
  const out = [];
  for (const h of heldByRegisterRow(row, f)) {
    if (setField(f, h.id, null)) { out.push(h.id); log({ cmd: 'release', id: h.id, row, ticket, reason: h.reason }); }
  }
  return out;
}

function main() {
  const t0 = Date.now();
  const [cmd, id] = process.argv.slice(2);
  const file = activePath();
  const json = process.argv.includes('--json');
  if (cmd === 'list') {
    let blocks = [];
    try { blocks = parse(fs.readFileSync(file, 'utf8')).blocks; } catch (e) { console.error('archive-hold: cannot read ' + file); process.exit(2); }
    const held = blocks.filter(b => holdIn(b.lines)).map(b => ({ id: b.id, reason: holdIn(b.lines) }));
    if (json) console.log(JSON.stringify(held));
    else if (!held.length) console.log('archive-hold: no holds');
    else { console.log(`archive-hold: ${held.length} held`); for (const h of held) console.log(`  ${h.id}  ${h.reason}`); }
    log({ cmd, count: held.length, dur_ms: Date.now() - t0 });
    return;
  }
  if (!id || !['set', 'clear', 'check'].includes(cmd)) {
    console.error('usage: archive-hold.js set <ID> --reason "<why>" | clear <ID> | check <ID> | list');
    process.exit(2);
  }
  if (cmd === 'check') {
    const r = holdOf(id, file);
    console.log(r ? `HELD ${id}: ${r}` : `not held: ${id}`);
    log({ cmd, id, held: !!r, dur_ms: Date.now() - t0 });
    process.exit(r ? 3 : 0);
  }
  if (cmd === 'set') {
    const reason = (arg('reason') || '').trim();
    if (!reason) { console.error('archive-hold: --reason is required (why it must stay open)'); process.exit(2); }
    if (!setField(file, id, `${today()}: ${reason.replace(/\r?\n/g, ' ')}`)) { console.error(`archive-hold: ${id} not found in ${file} (only an open block can be held)`); process.exit(1); }
    console.log(`✓ archive-hold set ${id}: ${reason}`);
    log({ cmd, id, reason, dur_ms: Date.now() - t0 });
    return;
  }
  const before = holdOf(id, file);
  if (!setField(file, id, null)) { console.error(`archive-hold: ${id} not found in ${file}`); process.exit(1); }
  console.log(before ? `✓ archive-hold cleared ${id} (was: ${before})` : `archive-hold: ${id} had no hold`);
  log({ cmd, id, was: before, dur_ms: Date.now() - t0 });
}

if (require.main === module) main();
module.exports = { FIELD, holdIn, holdOf, heldByRegisterRow, releaseByRegisterRow, refusal, parse };
