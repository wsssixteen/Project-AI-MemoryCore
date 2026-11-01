#!/usr/bin/env node
// remote-access-check.check.hook.js — born via core/forge.js (2026-11-01)
// TRIGGER: a session starts on the work laptop PJNBRidhwan
// ACTION: test the RustDesk server ports read from RustDesk config, the internet control and the RustDesk and AnyDesk services; print one line when healthy, a flag naming the failed part when not
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'remote-access-check', event: 'SessionStart' }, () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, [path.join(__dirname, 'remote-access-check.js')], { encoding: 'utf8', timeout: 6000, windowsHide: true, env: process.env });
  const out = String(r.stdout || '').trim();
  if (!out) return { fired: false };
  return { fired: true, blocked: false, contextOut: out + '\n' };
});
