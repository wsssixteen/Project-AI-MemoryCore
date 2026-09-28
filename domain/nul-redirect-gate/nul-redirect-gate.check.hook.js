#!/usr/bin/env node
// nul-redirect-gate.check.hook.js — born via core/forge.js (2026-09-28)
// TRIGGER: a Bash tool command redirects output to the Windows device name NUL (> NUL, 2>nul, &>NUL)
// ACTION: BLOCK exit 2; tell Ruri to use /dev/null in Git Bash (or $null in PowerShell); bypass [skip-nul-redirect: reason]
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

// A redirect operator (>, >>, 2>, 1>>, &>) followed by the bare word NUL, any case.
// NUL must end the word: `> nul.txt`, `> nullable`, `> nul/x` do not match.
const NUL_REDIRECT = /(?:^|[^\w>])(?:\d|&)?>>?\s*nul(?![\w.\/\\-])/i;
const BYPASS = /\[skip-nul-redirect:\s*[^\]\s][^\]]*\]/i;

const BLOCK_MSG = [
  '⛔ nul-redirect-gate: this Bash command redirects to NUL.',
  '',
  '   Git Bash does not treat NUL as the null device. It writes a REAL file named',
  '   NUL, a Windows-reserved name that OneDrive cannot sync (2026-09-28 popup:',
  '   worktree colleague-cr-issue-ed8731 got a NUL file from an ssh-keyscan redirect).',
  '',
  '   Use /dev/null in Bash (or $null in PowerShell) and re-run.',
  '   Deliberate? append the skip-nul-redirect token with a reason to the command.'
].join('\n');

runHook({ name: 'nul-redirect-gate', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  if ((data.tool_name || '') !== 'Bash') return { fired: false };
  const cmd = String((data.tool_input && data.tool_input.command) || '');
  if (!cmd) return { fired: false };
  // Quoted spans are data or another shell's text (echo "> nul", cmd //c "x >nul"
  // where cmd.exe handles NUL correctly) — only the unquoted part is Bash syntax.
  const unquoted = cmd.replace(/"[^"]*"/g, ' ').replace(/'[^']*'/g, ' ');
  if (!NUL_REDIRECT.test(unquoted)) return { fired: false };
  if (BYPASS.test(cmd)) return { fired: false };
  return { fired: true, blocked: true, blockReason: BLOCK_MSG + '\n' };
});
