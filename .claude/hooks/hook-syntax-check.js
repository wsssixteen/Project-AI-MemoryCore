/**
 * hook-syntax-check.js — SessionStart hook
 *
 * WHY (2026-06-20): silent-claim-drift-gate.js was a SYNTAX-GHOST for ~3 weeks —
 *   registered in settings.json but it threw on every invocation (a comment-closing
 *   sequence inside a header comment broke the file). meta-layer-audit checks
 *   REGISTRATION, not SYNTAX, so it never noticed; a broken hook fails-OPEN (looks
 *   active, does nothing). branch-at-apply-gate had a sibling (path) ghost.
 *
 * WHAT: at SessionStart, parse .claude/settings.json, collect every registered
 *   `node "<path>.js"` hook command, run `node --check` on each, and REPORT any
 *   that are MISSING or FAIL to parse. Silent when all parse. Closes the
 *   syntax-ghost class that meta-layer-audit cannot see.
 *
 * Standalone for now (no dependency on the pending meta-layer-audit → system-boot-check
 *   rename); folds into system-boot-check when that rename ships. Hook-only Power.
 *   Fail-OPEN on any error. v1 checks ALL hooks (~50 node spawns, a few seconds at
 *   boot); v1.1 candidate: mtime-cache to skip unchanged files.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SETTINGS = path.resolve(__dirname, '..', 'settings.json');

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
    const cmds = new Set();
    for (const event of Object.values(settings.hooks || {})) {
      for (const group of (event || [])) {
        for (const h of (group.hooks || [])) {
          const m = (h.command || '').match(/node\s+"([^"]+\.js)"/i);
          if (m) cmds.add(m[1]);
        }
      }
    }

    const broken = [];
    const ROOT = process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..');
    for (const p of cmds) {
      const resolved = p.replace(/\$\{CLAUDE_PROJECT_DIR\}/g, ROOT);   // CC substitutes this at run-time; the audit must too
      if (!fs.existsSync(resolved)) { broken.push(`${path.basename(p)} — MISSING FILE (path ghost)`); continue; }
      try {
        execFileSync('node', ['--check', resolved], { stdio: 'pipe' });
      } catch (e) {
        const err = (e.stderr ? e.stderr.toString() : e.message) || '';
        const line = err.split('\n').find(l => /Error|Unexpected|SyntaxError/.test(l)) || 'parse error';
        broken.push(`${path.basename(p)} — ${line.trim().slice(0, 110)}`);
      }
    }
    if (broken.length === 0) process.exit(0);   // all parse → silent

    const out = [
      '',
      `🐛 hook-syntax-check: ${broken.length} registered hook(s) are GHOSTS (registered but won't run):`,
      ...broken.map(b => '   • ' + b),
      '   A syntax/path-broken hook fails-OPEN silently — looks active, never fires. Fix before relying on it.',
      '',
    ].join('\n');
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: out } }));
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-OPEN
  }
});
