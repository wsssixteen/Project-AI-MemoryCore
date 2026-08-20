#!/usr/bin/env node
// adhoc-lifecycle.check.hook.js — born via core/forge.js (2026-08-19)
// TRIGGER: first boot of a new ISO week (guard file stamps the week; silent on repeat boots).
// ACTION: count terminal-status adhoc rows in the register + surface a propose-only sweep nudge.
//         PROPOSE-ONLY — never moves files itself.
// WHY boot-not-DE (system-design Rule 8): boot ALWAYS fires; Domain Expansion only fires if invoked,
//         so a DE-triggered sweep silently skips on sessions that never wrap. miya 2026-08-19.
// STATE-SCOPE (system-design Rule 11): state-scoped: YES, keyed by <state> — melaka register only for now.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const STATE = 'melaka';
const GUARD = path.join(__dirname, '.last-sweep-week');

function mainRoot() { const m = path.join('.claude', 'worktrees'); const i = ROOT.indexOf(m); return i > 0 ? ROOT.slice(0, i) : ROOT; }
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return t.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

runHook({ name: 'adhoc-lifecycle', event: 'SessionStart' }, () => {
  let week;
  try { week = isoWeek(new Date()); } catch (_) { return { fired: false }; } // no clock → stay silent
  let last = null;
  try { last = fs.readFileSync(GUARD, 'utf8').trim(); } catch (_) {}
  if (last === week) return { fired: false }; // already surfaced this week

  const regFile = path.join(mainRoot(), 'projects', 'coding-projects', 'active', 'etanah-knowledge', STATE, 'ADHOC-REGISTER.md');
  let terminalRows = 0; const sample = [];
  try {
    const md = fs.readFileSync(regFile, 'utf8');
    const TERMINAL = /\b(ANSWERED|OWNED-ELSEWHERE|TICKETED|RESOLVED)\b/;
    for (const line of md.split(/\r?\n/)) {
      const t = line.trim();
      if (!/^\|\s*[A-Z]?\d+\s*\|/.test(t)) continue;
      const cells = t.split('|').slice(1, -1).map(c => c.trim());
      if (cells.length >= 7 && TERMINAL.test(cells[6])) { terminalRows++; if (sample.length < 4) sample.push(cells[0]); }
    }
  } catch (_) { return { fired: false }; } // no register in this tree → silent

  try { fs.writeFileSync(GUARD, week); } catch (_) {} // stamp once/week regardless of action

  if (!terminalRows) return { fired: false };

  return {
    fired: true,
    contextOut:
      '🧹 adhoc-lifecycle (weekly): ' + terminalRows + ' terminal-status adhoc row(s) ripe for archive — ' + sample.join(', ') +
      (terminalRows > sample.length ? ' …' : '') + '\n' +
      '   ANSWERED / TICKETED / OWNED-ELSEWHERE / RESOLVED — they owe nothing and clutter active surfacing.\n' +
      '   Review:  node domain/adhoc-lifecycle/adhoc-lifecycle.js sweep\n' +
      '   Archive: node domain/adhoc-lifecycle/adhoc-lifecycle.js archive --row <id> [--slug <dir>]\n' +
      '   Reversible: unarchive --row <id>. (Surfaced once per ISO week.)\n',
  };
});
