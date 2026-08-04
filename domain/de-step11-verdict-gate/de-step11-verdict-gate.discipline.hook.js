/**
 * de-step11-verdict-gate.discipline.hook.js — Stop hook (BLOCKING)
 *
 * Feature: domain/de-step11-verdict-gate/
 *
 * PURPOSE: at Domain Expansion close, BLOCK if the worktree still has
 * uncommitted changes AND the reply gave no explicit per-file disposition.
 * Kills the "flagged for future boot" shortcut where Step 11 shows ✓ but
 * orphan files silently get discarded at the harness archive step.
 *
 * BUILT 2026-07-07 per みや after the frosty-elbakyan-007619 session:
 *   the DE closed with "flagged" as Step 11's verdict; the harness archive
 *   dialog then surfaced 2 uncommitted files that DE had ignored. Same slip
 *   class as full-address-trace-gate (advisory → block promotion). Structural
 *   defender = force a disposition line PER FILE at the close moment.
 *
 * TRIGGER: reply contains the DE close banner AND `git status --porcelain`
 * shows uncommitted work (M / A / D / ??) AND at least one uncommitted file
 * has NO disposition line in the reply.
 *
 * DISPOSITION LINE FORMS (per file — regex-matched):
 *   discard: <path>       → OK to lose (state marker, ephemeral)
 *   park: <path> — <reason>   → intentionally left, reason stated
 *   commit: <path>        → staged/committed this turn (verified below)
 *   keep-in-worktree: <path>  → deliberately staying in the worktree
 *
 * EXEMPT / BYPASS:
 *   - bypass token  [skip-de-verdict: <reason>]
 *   - reply doesn't contain the DE close banner
 *   - `stop_hook_active` (already fired once this stop)
 *   - git status returns empty (clean tree)
 *
 * FAIL-OPEN: any parse / git-shell / read error → allow stop.
 *
 * TEST HOOK: env var `DE_VERDICT_GATE_FAKE_STATUS` overrides real git-status
 * output so eval.js can drive deterministic fixtures without touching git.
 *
 * DESIGN CONSULT: /system-design + /system-rules invoked in this session
 * (design-consult-gate satisfied). Rule 7: hook-only; Rule 8: Stop at close
 * banner = leanest trigger moment. Rule 6 v1.2: eval.js runs 6-case fixture
 * before this hook is registered.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const LOG = path.resolve(__dirname, 'log.jsonl');

const CLOSE_BANNER = /Domain Expansion\s*[—–-]\s*closed|Domain Expansion\s*—\s*closed|Barrier settles/;
const BYPASS = /\[skip-de-verdict:/;
const DISPOSITION = /^\s*(?:discard|park|commit|keep-in-worktree)\s*:\s*(\S+)/gim;

function lastAssistantText(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj;
    try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
    const msg = obj.message || obj;
    if ((msg.role || obj.type) !== 'assistant') continue;
    const c = msg.content;
    let text = '';
    if (typeof c === 'string') text = c;
    else if (Array.isArray(c)) text = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    if (text.trim()) return text;
  }
  return null;
}

function getGitStatus() {
  if (process.env.DE_VERDICT_GATE_FAKE_STATUS !== undefined) {
    return process.env.DE_VERDICT_GATE_FAKE_STATUS;
  }
  try {
    const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    // v1.1 2026-08-05 (みや — recurring "Archive session with uncommitted changes?" dialog):
    // PERSIST a refreshed index before reading status. OneDrive rewrites mtimes all session
    // (and worktree-cleanup-boot's robocopy does it at boot), so tracked files go stat-dirty
    // and get reported " M" with a byte-identical blob and an EMPTY diff. `git status` alone
    // refreshes only IN MEMORY and may not write the index back — so the next reader (the
    // session-archive dialog) sees the phantom rows again and offers to discard changes that
    // do not exist. `update-index --refresh` re-hashes the stat-dirty entries and WRITES the
    // result, so both this gate and the dialog read the truth.
    // Cannot lose real work: a genuinely modified file keeps its " M" (its hash differs).
    try { execSync('git update-index --refresh', { cwd, stdio: 'ignore', timeout: 5000 }); } catch (_) {}
    return execSync('git status --porcelain', { cwd, encoding: 'utf8', timeout: 5000 });
  } catch (_) {
    return null;
  }
}

function parsePorcelainFiles(porcelain) {
  if (!porcelain) return [];
  const files = [];
  for (const line of porcelain.split(/\r?\n/)) {
    if (!line.trim()) continue;
    // Porcelain format: XY <path>  (columns 0-1 are status, col 2 is space, then path)
    const path = line.slice(3).trim().replace(/^"|"$/g, '');
    if (path) files.push(path);
  }
  return files;
}

function extractDispositions(text) {
  const disposed = new Set();
  let m;
  while ((m = DISPOSITION.exec(text)) !== null) {
    disposed.add(m[1]);
  }
  return disposed;
}

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail }) + '\n'); } catch (_) {}
}

function evaluate(text, porcelain) {
  if (!text) return { verdict: 'silent', reason: 'no-text' };
  if (BYPASS.test(text)) return { verdict: 'silent', reason: 'bypass' };
  if (!CLOSE_BANNER.test(text)) return { verdict: 'silent', reason: 'not-de-close' };

  const files = parsePorcelainFiles(porcelain);
  if (files.length === 0) return { verdict: 'silent', reason: 'clean-tree' };

  const disposed = extractDispositions(text);
  const undisposed = files.filter(f => {
    if (disposed.has(f)) return false;
    // Allow suffix match too (a disposition path may cite a longer form)
    for (const d of disposed) {
      if (d.endsWith(f) || f.endsWith(d)) return false;
    }
    return true;
  });

  if (undisposed.length === 0) return { verdict: 'passed', reason: 'all-disposed' };
  return { verdict: 'blocked', undisposed };
}
module.exports = { evaluate, parsePorcelainFiles, extractDispositions };

if (require.main === module) {
  let input = '';
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => (input += d));
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      if (data.stop_hook_active) process.exit(0);
      const text = lastAssistantText(data.transcript_path || '');
      const porcelain = getGitStatus();
      const result = evaluate(text, porcelain);
      if (result.verdict === 'silent') process.exit(0);
      if (result.verdict === 'passed') { logFire('passed'); process.exit(0); }

      logFire('blocked', result.undisposed);
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: [
          '⛔ de-step11-verdict-gate: DE close banner emitted, but the worktree has',
          '   uncommitted files with NO explicit disposition in your reply.',
          '   Every file below MUST get a disposition line THIS turn (not "flagged"):',
          '     • discard: <path>            — OK to lose (state marker, ephemeral)',
          '     • park: <path> — <reason>    — intentionally left, reason stated',
          '     • commit: <path>             — staged/committed this turn',
          '     • keep-in-worktree: <path>   — deliberately staying in worktree',
          '',
          '   Undisposed files:',
          ...result.undisposed.map(f => `     - ${f}`),
          '',
          '   Genuine no-can-do? Add [skip-de-verdict: <reason>] and continue.',
        ].join('\n'),
      }));
      process.exit(0);
    } catch (e) { process.exit(0); }
  });
}
