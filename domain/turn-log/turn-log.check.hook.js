#!/usr/bin/env node
// turn-log.check.hook.js — born via core/forge.js (2026-11-10)
// TRIGGER: every Stop of the main session (first Stop of a turn, and the re-entry after a Stop block).
// ACTION: domain/turn-log/turn-log.js record(): one turn row + one tool row per new tool call in
//         system/telemetry/turn-log/<machine>-<YYYY-MM>.jsonl; prints the goal-lens / wrong-fix advisory lines of the
//         old turn-ledger hook (first Stop only). Replaces the turn-ledger writer, same registration slot.
// Fail-open: any error → exit 0, nothing blocked. A monitor must never break the monitored.
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'turn-log', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  if (!data.session_id && !data.transcript_path) return { fired: false }; // empty payload (smoke-fire / eval F1): nothing to log
  const res = require(path.join(__dirname, 'turn-log.js')).record(data);
  if (res.advisories && res.advisories.length) return { fired: true, blocked: false, contextOut: res.advisories.join('\n') + '\n' };
  return { fired: false };
});
