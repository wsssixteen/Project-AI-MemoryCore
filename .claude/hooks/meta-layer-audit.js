/**
 * meta-layer-audit.js — SessionStart hook
 *
 * Layer 0 structural-integrity audit of the meta-layer. Fires at every
 * session boot to surface drifts between:
 *   - hook files on disk (.claude/hooks/*.js)
 *   - registered hooks (.claude/settings.json hooks block)
 *   - documented hooks (CLAUDE.md "Triggered enforcement" section)
 *   - scope-split rule (settings.local.json should NOT have hooks block)
 *
 * Why this exists (the slip it prevents):
 *   2026-05-25 audit discovered 7 of 8 meta-layer hooks documented in
 *   CLAUDE.md were never registered in settings.json — "ghost hooks"
 *   that never fired. The hooks existed as files, the documentation
 *   claimed they were active, but the actual harness didn't run them.
 *   No existing mechanism caught this at boot. This hook closes that
 *   gap so the same shape can never recur silently.
 *
 * Pairs with: boot-load-verification.js (boot-file integrity),
 *   boot-required-read-gate.js (CLAUDE.md cross-ref integrity).
 *
 * Design Memo: emitted inline 2026-05-25 per みや's directive
 *   "create a proper system where we do not have to rely on too many things".
 *
 * Failure modes considered:
 *   - False positives on experimental hooks → opt-out via header comment
 *     `// meta-layer-audit: skip-ghost-check` in the hook file
 *   - Self-skip risk → recursive self-check (this hook verifies its own
 *     registration as the first check)
 *
 * v1: REPORT-ONLY (advisory, never blocks boot).
 * Automation candidacy at v2+ after ≥3 cycles with みや's approval.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\0. AI\\Project-AI-MemoryCore';
const HOOKS_DIR = path.join(REPO_ROOT, '.claude', 'hooks');
const SETTINGS_JSON = path.join(REPO_ROOT, '.claude', 'settings.json');
const SETTINGS_LOCAL = path.join(REPO_ROOT, '.claude', 'settings.local.json');
const CLAUDE_MD = path.join(REPO_ROOT, '.claude', 'CLAUDE.md');
const SELF_NAME = 'meta-layer-audit';

function safeRead(p) {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return null; }
}
function safeReadJSON(p) {
  const t = safeRead(p);
  if (!t) return null;
  try { return JSON.parse(t); } catch { return null; }
}

function collectRegisteredHooks(settings) {
  // Walk settings.hooks[event][i].hooks[j].command, extract <name>.js from each
  const names = new Set();
  if (!settings || !settings.hooks) return names;
  for (const event of Object.keys(settings.hooks)) {
    for (const block of settings.hooks[event] || []) {
      for (const h of block.hooks || []) {
        const cmd = h.command || '';
        const m = cmd.match(/([\w-]+)\.js/);
        if (m) names.add(m[1]);
      }
    }
  }
  return names;
}

function collectHookFiles(dir) {
  // List *.js files under .claude/hooks/, with opt-out header detection
  const names = new Set();
  const skip = new Set();
  try {
    for (const fn of fs.readdirSync(dir)) {
      if (!fn.endsWith('.js')) continue;
      const base = fn.replace(/\.js$/, '');
      names.add(base);
      const body = safeRead(path.join(dir, fn)) || '';
      if (/\bmeta-layer-audit:\s*skip-ghost-check\b/.test(body)) skip.add(base);
    }
  } catch {}
  return { names, skip };
}

function collectDocumentedHooks(claudeMd, onDisk) {
  // Parse the "Triggered enforcement" section of CLAUDE.md, extract all <name>.js
  // Filter to names that actually exist on disk OR look like our hook convention —
  // eliminates false positives from prose references like "settings.json", "settings.local.json".
  if (!claudeMd) return new Set();
  const section = claudeMd.split(/Triggered enforcement/i)[1];
  if (!section) return new Set();
  const stop = section.split(/Atomic primitive skills/i)[0];
  const raw = new Set();
  for (const m of stop.matchAll(/([a-zA-Z][\w-]+)\.js/g)) raw.add(m[1]);
  // Intersect with onDisk — only count names that are actual hook files.
  // (Belt-and-suspenders: hooks are the only `.js` references that should appear
  // in this section anyway, so prose like `settings.json` is filtered cleanly.)
  return new Set([...raw].filter(n => onDisk.has(n)));
}

function setDiff(a, b) {
  return [...a].filter(x => !b.has(x));
}

// ─── Run audit ──────────────────────────────────────────────────────
const settings = safeReadJSON(SETTINGS_JSON);
const settingsLocal = safeReadJSON(SETTINGS_LOCAL);
const claudeMd = safeRead(CLAUDE_MD);

const registered = collectRegisteredHooks(settings);
const local = collectRegisteredHooks(settingsLocal);
const { names: onDisk, skip } = collectHookFiles(HOOKS_DIR);
const documented = collectDocumentedHooks(claudeMd, onDisk);

const findings = [];

// CHECK 1 — Self-check (recursive integrity)
if (!registered.has(SELF_NAME)) {
  findings.push(`⚠ SELF: ${SELF_NAME}.js is on disk but NOT registered in settings.json — this audit hook itself is a ghost. Add to settings.json SessionStart block.`);
}

// CHECK 2 — Ghost hooks (on disk, not registered, not opted-out)
const ghostHooks = setDiff(onDisk, registered).filter(n => !skip.has(n) && n !== SELF_NAME);
if (ghostHooks.length) {
  findings.push(`⚠ GHOST HOOKS (${ghostHooks.length}) — file exists but NOT registered in settings.json: ${ghostHooks.join(', ')}`);
  findings.push(`   → either register in .claude/settings.json hooks block OR add header comment "// meta-layer-audit: skip-ghost-check" to opt out`);
}

// CHECK 3 — Dangling registrations (registered, not on disk)
const dangling = setDiff(registered, onDisk);
if (dangling.length) {
  findings.push(`🚨 DANGLING (${dangling.length}) — registered in settings.json but file missing from disk: ${dangling.join(', ')}`);
  findings.push(`   → hook will fail to run; either restore file OR remove from settings.json`);
}

// CHECK 4 — Scope-split sanity (settings.local.json should NOT have hooks)
if (local.size > 0) {
  findings.push(`⚠ SCOPE: settings.local.json contains ${local.size} hook(s): ${[...local].join(', ')}`);
  findings.push(`   → hooks should live in project-scope .claude/settings.json (committed) so they propagate across machines. Move them out.`);
}

// CHECK 5 — Documentation drift (CLAUDE.md vs registered)
const docOnly = setDiff(documented, registered);
const regOnly = setDiff(registered, documented);
if (docOnly.length) {
  findings.push(`⚠ DOC DRIFT (claimed but unregistered, ${docOnly.length}): ${docOnly.join(', ')}`);
  findings.push(`   → CLAUDE.md says these are active but they're NOT in settings.json. Either register or update doc.`);
}
if (regOnly.length) {
  findings.push(`ℹ DOC DRIFT (registered but undocumented, ${regOnly.length}): ${regOnly.join(', ')}`);
  findings.push(`   → these run but CLAUDE.md doesn't mention them. Add to "Triggered enforcement" section for visibility.`);
}

// ─── Output ─────────────────────────────────────────────────────────
if (findings.length === 0) {
  process.stdout.write([
    '',
    '🛡  meta-layer-audit: PASS — hook-registration integrity verified.',
    `   ${onDisk.size} on disk · ${registered.size} registered · ${documented.size} documented · 0 ghosts · 0 dangling · 0 doc drift`,
    ''
  ].join('\n'));
  process.exit(0);
}

process.stdout.write([
  '',
  '🛡  meta-layer-audit findings (Layer 0 structural integrity):',
  '',
  ...findings.map(f => '  ' + f),
  '',
  `Snapshot: ${onDisk.size} hook files · ${registered.size} registered · ${documented.size} documented · ${skip.size} opted-out`,
  '',
  '(advisory — does not block boot. See .claude/hooks/meta-layer-audit.js for the audit rules.)',
  ''
].join('\n'));
process.exit(0);
