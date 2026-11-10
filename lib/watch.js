#!/usr/bin/env node
// lib/watch.js — the change-observation + rollback ledger (claude-md-watch Feature core).
// miya 2026-08-16: "when we change something, we do not only run tests, we set up a thing
// to OBSERVE the specific thing(s) we touched" — self-alert next run, amend or revert.
//
//   node lib/watch.js add --target <path> --observe "<what to watch for>" [--sessions N]
//       → snapshots the target's CURRENT git SHA as the rollback anchor, appends a watch row
//   node lib/watch.js check
//       → prints every ACTIVE watch + its exact rollback command (SessionStart hook calls this)
//   node lib/watch.js resolve <id> ok|anomaly [--note "<why>"]
//       → closes a watch; anomaly keeps the rollback line printed in the resolution row
//   node lib/watch.js tick
//       → no-op since 2026-11-10 (the countdown is derived from the watch date; see active())
// Ledger: system/claude-md-watchlist.jsonl (append-only; resolution = new row, never edit)
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'system', 'claude-md-watchlist.jsonl');

function rows() {
  try { return fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); }
  catch (_) { return []; }
}
function append(r) { fs.appendFileSync(LEDGER, JSON.stringify(r) + '\n'); }
// 2026-11-10 (turn-log stop list): the countdown is DERIVED, not written. 'tick' used to append one row per watch per day
// (5,583 of 5,617 ledger rows). Now sessions_left = the number on the watch row (or on its last legacy tick row) minus the
// calendar days since that row. Legacy tick rows are still read; nothing writes new ones.
function active() {
  const state = new Map();
  for (const r of rows()) {
    if (r.kind === 'watch') state.set(r.id, Object.assign({}, r, { _base: r.sessions_left, _from: r.ts }));
    if (r.kind === 'resolve') state.delete(r.id);
    if (r.kind === 'tick' && state.has(r.id)) { const w = state.get(r.id); w._base = r.sessions_left; w._from = r.ts; }
  }
  const today = new Date().toLocaleDateString('en-CA');
  return [...state.values()].map(w => {
    const days = Math.max(0, Math.round((Date.parse(today) - Date.parse(new Date(w._from).toLocaleDateString('en-CA'))) / 86400000));
    w.sessions_left = w._base - (Number.isFinite(days) ? days : 0);
    return w;
  });
}
function arg(name, def) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; }

const cmd = process.argv[2];
if (cmd === 'add') {
  const target = arg('target'); const observe = arg('observe'); const sessions = parseInt(arg('sessions', '3'), 10);
  if (!target || !observe) { console.error('usage: watch.js add --target <path> --observe "<what>" [--sessions N]'); process.exit(2); }
  let sha = 'untracked';
  try { sha = execSync('git log -1 --format=%H -- "' + target + '"', { cwd: ROOT, encoding: 'utf8', windowsHide: true }).trim() || 'untracked'; } catch (_) {}
  const id = 'w' + Date.now().toString(36);
  append({ kind: 'watch', id, ts: new Date().toISOString(), target, observe, sessions_left: sessions, rollback_sha: sha });
  console.log('WATCH ADDED ' + id + ' — target=' + target + ' · anchor=' + sha.slice(0, 10));
  console.log('rollback (if anomaly): git checkout ' + sha.slice(0, 10) + ' -- "' + target + '"');
  process.exit(0);
}
if (cmd === 'check') {
  const a = active();
  if (!a.length) { process.exit(0); } // silent when nothing to watch — no boot bloat
  console.log('🔭 CHANGE-WATCH: ' + a.length + ' active observation(s) — VERIFY each this session:');
  for (const w of a) {
    console.log('  [' + w.id + '] ' + w.target + ' (changed ' + w.ts.slice(0, 10) + ', ' + w.sessions_left + ' session(s) left)');
    console.log('     OBSERVE: ' + w.observe);
    console.log('     revert : git checkout ' + w.rollback_sha.slice(0, 10) + ' -- "' + w.target + '"');
    console.log('     close  : node lib/watch.js resolve ' + w.id + ' ok|anomaly --note "<evidence>"');
    if (w.sessions_left <= 0) console.log('     ⚠ OVERDUE — resolve NOW or the alert repeats every boot');
  }
  process.exit(0);
}
// brief (2026-10-06, boot audit batch 2): what session start prints. `check` printed 5 lines per watch
// (36 watches = ~18,000 characters at every start). The reminder a start needs is "N changes still wait to be
// checked, the oldest are these, the full list is one command away". `check` is unchanged and stays the full list.
if (cmd === 'brief') {
  const a = active().sort((x, y) => (x.ts < y.ts ? -1 : 1));
  if (!a.length) { process.exit(0); }
  const overdue = a.filter(w => w.sessions_left <= 0).length;
  console.log('🔭 CHANGE-WATCH: ' + a.length + ' open · ' + overdue + ' overdue · oldest ' + a[0].ts.slice(0, 10));
  for (const w of a.slice(0, 3)) console.log('  [' + w.id + '] ' + w.target + ' — ' + String(w.observe).replace(/\s+/g, ' ').slice(0, 100));
  console.log('  ' + (a.length > 3 ? '+' + (a.length - 3) + ' more · ' : '') + 'full list with revert lines: node lib/watch.js check · close one: node lib/watch.js resolve <id> ok|anomaly --note "<evidence>"');
  process.exit(0);
}
if (cmd === 'tick') {
  // 2026-11-10: kept so old callers still exit 0. The countdown is derived from dates in active(); no row is written.
  process.exit(0);
}
if (cmd === 'resolve') {
  const id = process.argv[3]; const verdict = process.argv[4];
  if (!id || !['ok', 'anomaly'].includes(verdict)) { console.error('usage: watch.js resolve <id> ok|anomaly [--note "<why>"]'); process.exit(2); }
  const w = active().find(x => x.id === id);
  if (!w) { console.error('no active watch ' + id); process.exit(1); }
  append({ kind: 'resolve', id, ts: new Date().toISOString(), verdict, note: arg('note', ''), rollback_sha: w.rollback_sha, target: w.target });
  console.log('RESOLVED ' + id + ' ' + verdict + (verdict === 'anomaly' ? ' — revert: git checkout ' + w.rollback_sha.slice(0, 10) + ' -- "' + w.target + '"' : ''));
  process.exit(0);
}
console.error('usage: watch.js add|check|brief|tick|resolve'); process.exit(2);
