#!/usr/bin/env node
// arabic-nudge.check.hook.js — born via core/forge.js (2026-09-06)
// TRIGGER: every session boot; silent unless projects/learning-projects/active/arabic/data/words.json exists
// ACTION: print ONE line: 📖 Arabic: N/5 reviews this week · not yet today|done today; nothing if data absent
// Engine: .claude/skills/arabic/arabic.js nudge (SPEC.md §7). Advisory — never blocks. Fail-open on any error.
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const ENGINE = path.join(ROOT, '.claude', 'skills', 'arabic', 'arabic.js');
const LOG = path.join(__dirname, 'log.jsonl');

runHook({ name: 'arabic-nudge', event: 'SessionStart' }, () => {
  if (!fs.existsSync(ENGINE)) return { fired: false };
  let line = '';
  try { line = require(ENGINE).main(['node', 'arabic.js', 'nudge']) || ''; } catch { return { fired: false }; }
  line = String(line).split('\n')[0].trim();          // exactly one line, never more
  if (!line || !line.startsWith('📖 Arabic:')) return { fired: false };
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), line }) + '\n'); } catch {}
  return { fired: true, blocked: false, contextOut: line + '\n' };
});
