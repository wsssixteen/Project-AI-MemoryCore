#!/usr/bin/env node
// deliverable-lands-on-main.check.hook.js — born via core/forge.js (2026-07-13)
// TRIGGER: reply emits a DE closing banner or sprint/stage-COMPLETE claim while current git branch != main with commits not on main
// ACTION: HARD-BLOCK: a close is INCOMPLETE until the work is on main (merged+pushed) or explicitly handed off
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'deliverable-lands-on-main', event: 'Stop' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const fs = require('fs');
  const { execSync } = require('child_process');

  // last assistant text from transcript
  let text = '';
  try {
    const lines = fs.readFileSync(data.transcript_path, 'utf8').split(/\r?\n/).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      let o; try { o = JSON.parse(lines[i]); } catch (_) { continue; }
      const msg = o.message || o;
      const role = msg.role || o.type;
      if (role === 'assistant') {
        const c = msg.content;
        if (typeof c === 'string') text = c;
        else if (Array.isArray(c)) text = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
        if (text) break;
      } else if (role === 'user') break;
    }
  } catch (_) { return { fired: false }; }

  // NARROW trigger: a session-close / sprint-complete claim (the replay class)
  const CLOSE_SIGNAL = /Domain Expansion — closed|sprint (is )?COMPLETE|Stage D[^\n]*COMPLETE|barrier settles/i;
  if (!CLOSE_SIGNAL.test(text)) return { fired: false };
  if (/\[skip-lands-on-main:\s*[^\]]+\]/.test(text)) return { fired: true, blocked: false, bypassed: true, bypassToken: 'skip-lands-on-main' };

  // git state — env overrides are the eval-fixture path (DLOM_BRANCH / DLOM_AHEAD)
  let branch, ahead;
  try {
    branch = process.env.DLOM_BRANCH || execSync('git -C "' + ROOT + '" branch --show-current', { encoding: 'utf8', timeout: 10000 }).trim();
    ahead = process.env.DLOM_AHEAD != null ? parseInt(process.env.DLOM_AHEAD, 10)
      : parseInt(execSync('git -C "' + ROOT + '" rev-list --count origin/main..HEAD', { encoding: 'utf8', timeout: 10000 }).trim(), 10);
    // v1.1 (2026-08-03): compare origin/main, never the local main ref — a worktree session
    // never moves local main, so the old target false-blocked EVERY correctly-merged DE close
    // (todo Q1 row, found 2026-07-31; fired again tonight after main was already pushed).
  } catch (_) { return { fired: false }; } // fail-open on any git error

  if (branch === 'main' || !(ahead > 0)) return { fired: false };
  return {
    fired: true, blocked: true,
    blockReason: '⛔ deliverable-lands-on-main: you are closing (DE banner / COMPLETE claim) on branch "' + branch + '" with ' + ahead + ' commit(s) NOT on main.\n' +
      '   A close is INCOMPLETE until the work is merged+pushed to main OR explicitly handed off as a Tier-≥1 Handoff item.\n' +
      '   → merge: /worktree-retrieve · or bypass with [skip-lands-on-main: <where the handoff line is>]\n' +
      '   [replay class: 2026-07-13 audit sprint stranded on claude/ruri-310f81 · 2026-05-13 three stranded branches]',
  };
});
