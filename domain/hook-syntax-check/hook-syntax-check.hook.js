/**
 * hook-syntax-check.hook.js — SessionStart hook (installed as a Feature 2026-10-05, was .claude/hooks/hook-syntax-check.js)
 *
 * WHY (2026-06-20): silent-claim-drift-gate.js was a SYNTAX-GHOST for ~3 weeks —
 *   registered in settings.json but it threw on every invocation (a comment-closing
 *   sequence inside a header comment broke the file). system-audit checks
 *   REGISTRATION, not SYNTAX, so it never noticed; a broken hook fails-OPEN (looks
 *   active, does nothing). branch-at-apply-gate had a sibling (path) ghost.
 *
 * WHAT: at SessionStart, collect every .js a registration runs, `node --check` each, and REPORT any
 *   that are MISSING, FAIL to parse, or are not git-tracked. Silent when all are clean. Fail-OPEN.
 *
 * v2 (2026-10-05, boot audit — it cost ~20 s at every boot, 17 timeouts in 30 days):
 *   1. CACHE: a file whose mtime + size are unchanged since it last PASSED is not re-checked.
 *      A failing or missing file is never cached, so it is re-reported every boot until fixed.
 *   2. ONE `git ls-files` for the ship-check instead of one git spawn per hook.
 *   3. COVERAGE: v1 read only the first quoted .js in a command, so a hook run through
 *      `hook-runtime.js --wrap <target>` or listed in a bundle manifest was NEVER checked
 *      (it checked the wrapper instead). v2 checks wrapped targets and bundle children too —
 *      the same registration sources lib/feature-census.js reads.
 *   Every run appends one row to log.jsonl: checked · cached · broken · dur_ms.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..');
const SETTINGS = path.join(ROOT, '.claude', 'settings.json');
const CACHE = process.env.HOOK_SYNTAX_CACHE || path.join(__dirname, 'cache.json');
const LOG = process.env.HOOK_SYNTAX_LOG || path.join(__dirname, 'log.jsonl');
const SAVE_EVERY = Math.max(1, parseInt(process.env.HOOK_SYNTAX_SAVE_EVERY || '20', 10) || 20);

// Every .js a registration runs: direct commands, wrapped targets, and bundle-manifest children.
function registeredJs() {
  const out = new Set();
  const settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  const manifests = new Set();
  for (const groups of Object.values(settings.hooks || {})) for (const g of (groups || [])) for (const h of (g.hooks || [])) {
    const cmd = h.command || '';
    const rx = /"([^"]+\.js)"/g; let m;
    while ((m = rx.exec(cmd)) !== null) out.add(m[1]);
    const mm = /--manifest\s+"?([^"\s]+\.json)"?/.exec(cmd);
    if (mm) manifests.add(mm[1]);
  }
  for (const man of manifests) {
    const file = man.replace(/\$\{CLAUDE_PROJECT_DIR\}/g, ROOT);
    try {
      const j = JSON.parse(fs.readFileSync(path.isAbsolute(file) ? file : path.join(ROOT, file), 'utf8'));
      for (const c of (j.children || [])) out.add(path.join(ROOT, String(c)));
    } catch (_) { out.add(path.isAbsolute(file) ? file : path.join(ROOT, file)); }   // unreadable manifest → reported as missing/broken below
  }
  return out;
}

function run() {
  const t0 = Date.now();
  let cache = {}; try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (_) {}
  let tracked = null;                                           // null = git unavailable → ship-check skipped (fail-open)
  try {
    tracked = new Set(execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 27 }).toString().split('\0').filter(Boolean));
  } catch (_) { tracked = null; }

  const broken = []; const next = {}; let checked = 0, cached = 0;
  for (const p of registeredJs()) {
    const resolved = path.normalize(p.replace(/\$\{CLAUDE_PROJECT_DIR\}/g, ROOT));
    const name = path.basename(resolved);
    let st;
    try { st = fs.statSync(resolved); } catch (_) { broken.push(`${name} — MISSING FILE (path ghost)`); continue; }
    const rel = path.relative(ROOT, resolved).replace(/\\/g, '/');
    const sig = st.mtimeMs + ':' + st.size;
    if (resolved.endsWith('.js')) {
      if (cache[rel] === sig) { cached++; next[rel] = sig; }
      else {
        checked++;
        // A cold run checks every file (~18 s for 138) and the hook wrapper kills at 30 s. Save progress as it
        // goes, so a killed cold run still leaves the next boot less to do instead of starting from zero.
        if (checked % SAVE_EVERY === 0) { try { fs.writeFileSync(CACHE, JSON.stringify(Object.assign({}, cache, next))); } catch (_) {} }
        try { execFileSync(process.execPath, ['--check', resolved], { stdio: 'pipe' }); next[rel] = sig; }
        catch (e) {
          const err = (e.stderr ? e.stderr.toString() : e.message) || '';
          const line = err.split('\n').find(l => /Error|Unexpected|SyntaxError/.test(l)) || 'parse error';
          broken.push(`${name} — ${line.trim().slice(0, 110)}`);
        }
      }
    } else { broken.push(`${name} — bundle manifest unreadable`); }
    // SHIP-CHECK (2026-07-03, audit E5): a registered hook whose FILE is not git-tracked ships the
    // registration but not the file → other checkouts run a ghost. Skipped for files outside the repo.
    if (tracked && !rel.startsWith('..') && !path.isAbsolute(rel) && !tracked.has(rel)) {
      broken.push(`${name} — SHIP-CHECK: registered but NOT git-tracked (git add + commit it — registration propagates, file won't)`);
    }
  }
  try { fs.writeFileSync(CACHE, JSON.stringify(next)); } catch (_) {}
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), checked, cached, broken: broken.length, dur_ms: Date.now() - t0 }) + '\n'); } catch (_) {}
  return broken;
}

try {
  const broken = run();
  if (broken.length) {
    const out = [
      '',
      `🐛 hook-syntax-check: ${broken.length} registered hook(s) are GHOSTS (registered but won't run):`,
      ...broken.map(b => '   • ' + b),
      '   A syntax/path-broken hook fails-OPEN silently — looks active, never fires. Fix before relying on it.',
      '',
    ].join('\n');
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: out } }));
  }
} catch (e) { /* fail-OPEN */ }
process.exit(0);
