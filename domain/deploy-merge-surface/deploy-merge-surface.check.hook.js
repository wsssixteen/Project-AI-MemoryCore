#!/usr/bin/env node
// deploy-merge-surface.check.hook.js — born via core/forge.js (2026-08-20)
// TRIGGER: a NEW `git cherry-pick <sha>` (not --continue/--abort/--skip/--quit) in a work repo.
// ACTION: BLOCK until the merge-vs-cherry-pick tradeoff was SURFACED to miya — he must have
//         seen `git log --oneline <env>..<ticket-branch>` count + whether a merge drags version
//         bumps or other tickets, and chosen. Silent cherry-picking is banned.
// WHY: 2026-08-20 #276181/276182 — cherry-picked to int-env 5+ times silently because a merge of
//      esokongan/275505 drags 18 release/1.3.5 commits; the choice was never shown to miya. He was
//      furious that no hook caught it.
// SATISFY: emit the tradeoff to miya, then add the bypass token with what he was shown/decided:
//   [deploy-merge-decision: merge|cherrypick - <the N..M count you showed miya>]
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

function lastAssistantText(tp, howMany) {
  const max = howMany || 1;
  const found = [];
  try {
    const lines = fs.readFileSync(tp, 'utf8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0 && found.length < max; i--) {
      let o; try { o = JSON.parse(lines[i]); } catch (_) { continue; }
      const m = o.message || o;
      if ((m.role || o.type) !== 'assistant') continue;
      const c = m.content;
      let t = '';
      if (typeof c === 'string') t = c;
      else if (Array.isArray(c)) t = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
      if (t.trim()) found.push(t);
    }
    if (found.length) return found.join('\n');
  } catch (_) {}
  return '';
}

const BLOCK = `⛔ deploy-merge-surface: a git cherry-pick — but you never showed みや the merge alternative.
   BANNED: silently cherry-picking onto an env branch. He decides merge vs cherry-pick, not you.
   FIRST surface it to him:
     git log --oneline <env-branch>..<ticket-branch>        (how many commits a merge would bring)
     say whether a merge drags a pom/version bump or OTHER tickets (then int-env is not clean),
     or whether it is just this ticket's commits (then merge is the clean, conflict-free choice).
   Let みや choose. Then add the bypass with what you showed him:
     [deploy-merge-decision: merge|cherrypick - <the N..M count + what it drags>]`;

runHook({ name: 'deploy-merge-surface', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  if (data.tool_name !== 'Bash') return { fired: false };
  const cmd = (data.tool_input && data.tool_input.command) || '';
  if (!/\bgit\b[^|;&\n]*\bcherry-pick\b/.test(cmd)) return { fired: false };
  if (/cherry-pick\s+--(continue|abort|skip|quit)\b/.test(cmd)) return { fired: false };
  // v3 (2026-08-21, per みや): pre-deploy BUILD safety — an env cherry-pick needs a fresh
  // green compile marker (domain/compile-gate) from the last 3 hours, else block.
  const compileFresh = (() => {
    try {
      const stateDir = path.join(ROOT, '.claude', 'state');
      return fs.readdirSync(stateDir).some(f => {
        if (!/^compile-ok-.*\.json$/.test(f)) return false;
        try {
          const j = JSON.parse(fs.readFileSync(path.join(stateDir, f), 'utf8'));
          return j.ok === true && (Date.now() - j.ts) < 3 * 60 * 60 * 1000;
        } catch (_) { return false; }
      });
    } catch (_) { return false; }
  })();
  if (!compileFresh && !/\[skip-compile-verify:\s*[^\]]+\]/i.test(cmd)) {
    return { fired: true, blocked: true, contextOut:
      '⛔ deploy-merge-surface v3: no FRESH green compile marker (<3h) before this env cherry-pick.\n' +
      '   Run: node domain/compile-gate/compile-check.js run <module>   (BUILD SUCCESS writes the marker)\n' +
      '   then retry. Compiled elsewhere this session? [skip-compile-verify: <where/when>] in the command.' };
  }

  const turn = lastAssistantText(data.transcript_path || '', 5);
  if (/\[deploy-merge-decision:\s*[^\]]+\]/i.test(turn) || /\[deploy-merge-decision:\s*[^\]]+\]/i.test(cmd)) {
    return { fired: true, bypassed: true, bypassToken: 'deploy-merge-decision' };
  }
  return { fired: true, blocked: true, contextOut: BLOCK };
});
