#!/usr/bin/env node
// kpi-pending.check.hook.js — born via core/forge.js (2026-10-23)
// TRIGGER: a session starts and main/kpi-moments.jsonl holds a pending KPI row (one whose condition has not been confirmed or dropped)
// ACTION: print each pending row, its condition and the confirm / drop commands; print nothing when there is none
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
// self_audit: kpi.js pending --boot re-reads the ledger each run; kpi-pending.eval.js pins quiet / one row / gone after confirm.
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'kpi-pending', event: 'SessionStart' }, (input) => {
  // Prints every open pending KPI row (domain/kpi) at session start; prints nothing when there is none.
  const { spawnSync } = require('child_process');
  const args = [path.join(ROOT, 'domain', 'kpi', 'kpi.js'), 'pending', '--boot'];
  if (process.env.KPI_PENDING_ROOT) args.push('--root', process.env.KPI_PENDING_ROOT); // eval only
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 5000, windowsHide: true, env: process.env });
  const out = String(r.stdout || '').trim();
  if (r.status !== 0 || !out) return { fired: false };
  return { fired: true, blocked: false, contextOut: out + '\n' };
});
