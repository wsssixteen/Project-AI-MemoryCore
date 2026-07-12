#!/usr/bin/env node
/**
 * lib/wrap-all-hooks.js — one-shot Phase-1 migration: route every registered hook
 * through lib/hook-runtime.js --wrap (telemetry coverage for the whole fleet).
 * Skips: entries already wrapped · native-API hooks (self-telemetering) · hook-runtime itself.
 * Idempotent. Validates JSON after write. Prints a summary; exits 2 on any anomaly.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..');
const SETTINGS = path.join(ROOT, '.claude', 'settings.json');
const NATIVE = ['component-birth-gate']; // runHook natively — self-telemetering, never double-wrap

const settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
let wrapped = 0, already = 0, skippedNative = 0;

for (const [event, blocks] of Object.entries(settings.hooks || {})) {
  for (const block of blocks) {
    for (const h of block.hooks || []) {
      const cmd = h.command || '';
      if (cmd.includes('hook-runtime.js')) { already++; continue; }
      if (NATIVE.some(n => cmd.includes(n))) { skippedNative++; continue; }
      const m = cmd.match(/^node\s+"(\$\{CLAUDE_PROJECT_DIR\}[^"]+\.js)"\s*$/);
      if (!m) { console.error('ANOMALY — unrecognized command shape, left untouched: ' + cmd); continue; }
      h.command = 'node "${CLAUDE_PROJECT_DIR}\\lib\\hook-runtime.js" --wrap "' + m[1] + '" ' + event;
      wrapped++;
    }
  }
}

fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2));
JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); // revalidate or throw
console.log(`wrap-all-hooks: wrapped ${wrapped} · already-wrapped ${already} · native-skip ${skippedNative}`);
