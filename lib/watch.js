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
//       → decrements sessions-remaining on every active watch (SessionStart calls after check)
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
function active() {
  const state = new Map();
  for (const r of rows()) {
    if (r.kind === 'watch') state.set(r.id, r);
    if (r.kind === 'resolve') state.delete(r.id);
    if (r.kind === 'tick' && state.has(r.id)) state.get(r.id).sessions_left = r.sessions_left;
  }
  return [...state.values()];
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
if (cmd === 'tick') {
  for (const w of active()) append({ kind: 'tick', id: w.id, ts: new Date().toISOString(), sessions_left: w.sessions_left - 1 });
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
console.error('usage: watch.js add|check|tick|resolve'); process.exit(2);
