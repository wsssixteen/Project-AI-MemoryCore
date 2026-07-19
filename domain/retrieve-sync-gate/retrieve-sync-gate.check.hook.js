#!/usr/bin/env node
// retrieve-sync-gate.check.hook.js — born via core/forge.js (2026-07-19)
// TRIGGER: prompt contains retrieve/sync + a Redmine/ticket signal (6-digit, QA-n, redmine, esokongan)
// ACTION: inject MANDATORY first-action: run node quest/redmine-sync.js <n> before any disk scan - a pre-synced folder is never the retrieval
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'retrieve-sync-gate', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const p = String(data.prompt || data.user_message || '');
  // Replay case (2026-07-16 #270297): "retrieve from redmine" answered by engaging a
  // DIFFERENT already-on-disk ticket — sync must run FIRST, every time.
  const retrieveWord = /\b(retrieve|sync)\b/i.test(p);
  const ticketSignal = /\b(redmine|ticket|esokongan|#?\d{6}|QA[- ]?\d{5,7})\b/i.test(p);
  if (!retrieveWord || !ticketSignal) return { fired: false };
  return {
    fired: true,
    blocked: false,
    contextOut: [
      '🔁 retrieve-sync-gate: "retrieve/sync" + ticket signal detected.',
      '   MANDATORY FIRST ACTION: node quest/redmine-sync.js <ticket-number>',
      '   A folder already on disk is NOT the retrieval みや asked for (2026-07-16 #270297:',
      '   wrong-ticket quest run). Sync FIRST, then engage the synced ticket.',
      '',
    ].join('\n'),
  };
});
