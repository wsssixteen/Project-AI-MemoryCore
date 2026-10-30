#!/usr/bin/env node
// stale-hooks-warn.check.hook.js — born via core/forge.js (2026-10-30)
// TRIGGER: UserPromptSubmit in a session folder (.claude/worktrees/<x>): origin/main holds commits on .claude/hooks, .claude/settings.json, domain/*/*.hook.js, domain/bundles or lib/ that this worktree's HEAD lacks; at most once per 30 min per worktree
// ACTION: ADVISORY: name the stale part count and tell me to sync now (sync_with_base_branch, else git merge origin/main) before any gated write
// Replay (287186, 2026-10-30): 26 commits behind main, so redmine-write-gate v1.7 ran instead of v1.8 and refused a submit he had ordered.
// No fetch here (slow, network): every session shares one .git, so origin/main moves whenever any session fetches or pushes.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const RUNTIME = [path.join(ROOT, 'lib', 'hook-runtime.js'), path.resolve(__dirname, '..', '..', 'lib', 'hook-runtime.js')].find(p => fs.existsSync(p));
const { runHook } = require(RUNTIME);
const QUIET_MS = 30 * 60 * 1000;
const PATHS = ['.claude/hooks', '.claude/settings.json', '.claude/skills', 'domain', 'lib', 'core'];

runHook({ name: 'stale-hooks-warn', event: 'UserPromptSubmit' }, () => {
  if (!/[\\/]\.claude[\\/]worktrees[\\/]/i.test(ROOT)) return { fired: false };
  const stampDir = process.env.STALE_HOOKS_STAMP_DIR || os.tmpdir();
  const stamp = path.join(stampDir, 'stale-hooks-warn-' + path.basename(ROOT).replace(/[^\w.-]/g, '_') + '.stamp');
  try { if (Date.now() - fs.statSync(stamp).mtimeMs < QUIET_MS) return { fired: false }; } catch (_) { /* no stamp yet */ }
  let n = 0;
  try {
    n = parseInt(execFileSync('git', ['-C', ROOT, 'rev-list', '--count', 'HEAD..origin/main', '--', ...PATHS], { encoding: 'utf8', timeout: 5000, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 10) || 0;
  } catch (_) { return { fired: false }; }
  if (!n) return { fired: false };
  try { fs.writeFileSync(stamp, new Date().toISOString()); } catch (_) { /* advisory still shown */ }
  return { fired: true, blocked: false, contextOut: [
    `⚠️ stale-hooks-warn: this session folder is ${n} commit(s) behind main on hooks, gates, skills or lib.`,
    '   The gates running here are OLDER than main: a fix he already ordered may not be live in this session.',
    '   Sync NOW, before any gated write: mcp__ccd_host__sync_with_base_branch, else `git merge --no-edit origin/main` (commit or stash nothing of his first).',
    '',
  ].join('\n') };
});
