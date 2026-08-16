#!/usr/bin/env node
// claude-md-watch.check.hook.js — born via core/forge.js (2026-08-16)
// TRIGGER: every session boot: emit active change-watches (self-alert) until each is resolved ok/anomaly
// ACTION: reads system/claude-md-watchlist.jsonl (written by lib/watch.js add at change-time); emits each ACTIVE watch: what was changed, what to observe, sessions remaining, and the exact one-line git rollback command anchored to the pre-change SHA
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'claude-md-watch', event: 'SessionStart' }, (input) => {
  // Self-alert at every boot while any change-watch is active; silent when none.
  // Ledger + rollback anchors live in lib/watch.js / system/claude-md-watchlist.jsonl.
  const { execFileSync } = require('child_process');
  let out = '';
  try {
    out = execFileSync('node', [path.join(ROOT, 'lib', 'watch.js'), 'check'], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
    if (out.trim()) execFileSync('node', [path.join(ROOT, 'lib', 'watch.js'), 'tick'], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
  } catch (e) { out = ''; } // fail-open: a broken watcher must never block boot
  if (!out.trim()) return { fired: false };
  return { fired: true, blocked: false, contextOut: out };
});
