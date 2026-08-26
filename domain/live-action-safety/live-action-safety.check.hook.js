#!/usr/bin/env node
// live-action-safety.check.hook.js — born via core/forge.js (2026-08-26)
// TRIGGER: Bash/PowerShell command runs run.js/attendance.js/pymclaims.js with no dry flag
// ACTION: BLOCK exit 2; require --dry or [live-action-approved: reason]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

// Fire ONLY when node EXECUTES a live-action script — not when the name merely
// appears in a filename (run.js.md), a printed string (echo "…run.js…"), or a
// hyphenated sibling (run-report.js). Requires: `node` present AND the script as
// a bare executable arg at a path boundary, ending exactly in `.js`.
const NODE = /\bnode(?:\.exe)?\b/i;
const LIVE_SCRIPT = /(?:^|[\s"'\\/])(run|attendance|pymclaims)\.js(?=\s|$|["'])/i;
// Safe indicators — dry modes, syntax checks, help, the self-test suite.
const SAFE_FLAGS = /--dry|--check|--help|--version|--selftest|_selftest|--list|--status/i;
// Explicit opt-in token for a deliberate live run.
const APPROVED = /\[live-action-approved:/i;

const BLOCK_MSG = [
  '⛔ live-action-safety: this command runs a script that can perform a REAL',
  '   action on a live system (attendance / claims / clock), with no dry flag.',
  '',
  '   RULE (2026-08-27, PymTime 00:22 incident): the safety gate comes BEFORE the',
  '   first test run. Default must be dry; a real action needs an explicit flag.',
  '',
  '   Do ONE of:',
  '     - add a dry flag (e.g. --dry) and re-run, or',
  '     - confirm the live run is intended: append [live-action-approved: <reason>]',
  '',
  '   Never run a non-dry action against a live account to "check if it works".'
].join('\n');

runHook({ name: 'live-action-safety', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const tool = data.tool_name || '';
  if (!/^(Bash|PowerShell)$/.test(tool)) return { fired: false };
  const cmd = String((data.tool_input && data.tool_input.command) || '');
  if (!cmd) return { fired: false };
  // Strip quoted spans first: a script name inside quotes is DATA (echo, JSON,
  // a commit message, a test fixture), not an executed command. Only match the
  // unquoted part so mentioning "node run.js" never blocks unrelated work.
  const unquoted = cmd.replace(/"[^"]*"/g, ' ').replace(/'[^']*'/g, ' ');
  if (!(NODE.test(unquoted) && LIVE_SCRIPT.test(unquoted))) return { fired: false };
  if (SAFE_FLAGS.test(unquoted) || APPROVED.test(cmd)) return { fired: false };
  return { fired: true, blocked: true, blockReason: BLOCK_MSG + '\n' };
});
