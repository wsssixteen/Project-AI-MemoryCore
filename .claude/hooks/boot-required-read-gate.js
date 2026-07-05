/**
 * boot-required-read-gate.js — SessionStart hook
 *
 * Catches the "boot-or-required-read-skipped" slip category. Reads CLAUDE.md,
 * extracts every backtick-wrapped file reference, and verifies each resolves
 * on disk. Surfaces ⚠️ for any GENUINELY-broken pointer.
 *
 * Created 2026-05-23 — Phase 2 of meta-layer build.
 * Rewritten 2026-07-05 — resolver was basename-only (checked <root>/name + raw
 *   ref, no subdir walk) → 95% false-positive rate (42 flagged, ~40 present in
 *   subdirs). Now: recursive relpath+basename index, placeholder-skip, and an
 *   ignore-list for gitignored/external refs. Core split into pure functions +
 *   module.exports so boot-required-read-gate.eval.js can test it (system-design
 *   Rule 6: ship with a runnable eval).
 */
const fs = require('fs');
const path = require('path');

// Script is at <root>/.claude/hooks/<file>.js → project root is 2 levels up.
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CLAUDE_MD = path.join(PROJECT_ROOT, '.claude', 'CLAUDE.md');

// Refs intentionally absent from this repo/worktree — NOT broken:
//  - settings.local.json is gitignored (real file, just not committed)
//  - the etanah *.config.json trio + Etanah-Codebase-Read.md live in the etanah
//    codebases / main-repo-confidential tree, never inside MemoryCore
const IGNORE_REFS = new Set([
  'settings.local.json',
  'tindakan.config.json', 'tugasan.config.json', 'template.config.json',
  'Etanah-Codebase-Read.md', 'et_main_uat.sql',
]);

// Documentation placeholders (e.g. QA-NNNN.md) — a pattern, never a real file.
const PLACEHOLDER_RE = /N{3,}/;

// Index every file under root ONCE — by relative path AND by basename — so a
// bare `DATABASE.md` reference resolves even when the file lives several folders
// deep. Basename-blindness was the 95%-false-positive bug.
function buildFileIndex(root) {
  const byRel = new Set();
  const byBase = new Set();
  const SKIP = new Set(['.git', 'node_modules', '.m2', 'target', 'database-archive', 'worktrees']);
  (function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (SKIP.has(e.name)) continue;
        walk(full);
      } else {
        byBase.add(e.name);
        byRel.add(path.relative(root, full).split(path.sep).join('/'));
      }
    }
  })(root);
  return { byRel, byBase };
}

// Extract backtick-wrapped file references ending in .md / .js / .json / .txt.
function extractRefs(content) {
  const refPattern = /`([a-zA-Z0-9./_-]+\.(md|js|json|txt))`/g;
  const refs = new Set();
  let m;
  while ((m = refPattern.exec(content)) !== null) refs.add(m[1]);
  return refs;
}

// Classify each ref: resolves / placeholder-skip / external-skip / broken.
function resolveRefs(refs, root) {
  const { byRel, byBase } = buildFileIndex(root);
  const broken = [];
  let skippedPlaceholder = 0;
  let skippedExternal = 0;
  for (const ref of refs) {
    const base = ref.split('/').pop();
    if (PLACEHOLDER_RE.test(ref)) { skippedPlaceholder++; continue; }
    if (IGNORE_REFS.has(base)) { skippedExternal++; continue; }
    const norm = ref.replace(/^\.\//, '');
    const resolves = byRel.has(norm) || byBase.has(base)
      || fs.existsSync(path.join(root, ref)) || fs.existsSync(ref);
    if (!resolves) broken.push(ref);
  }
  return { total: refs.size, broken, skippedPlaceholder, skippedExternal };
}

function main() {
  try {
    if (!fs.existsSync(CLAUDE_MD)) process.exit(0);
    const content = fs.readFileSync(CLAUDE_MD, 'utf8');
    const refs = extractRefs(content);
    const { broken, skippedPlaceholder, skippedExternal } = resolveRefs(refs, PROJECT_ROOT);
    const resolved = refs.size - broken.length - skippedPlaceholder - skippedExternal;

    const lines = [
      '',
      `⚙️  boot-required-read-gate: ${refs.size} refs — ${resolved} resolve · ${skippedPlaceholder} placeholder · ${skippedExternal} external-absent`,
    ];
    if (broken.length === 0) {
      lines.push('✓ all resolvable references resolve');
    } else {
      lines.push(`⚠️  ${broken.length} genuinely-broken pointer(s) in CLAUDE.md:`);
      broken.forEach(b => lines.push(`   🔴 ${b}`));
      lines.push('');
      lines.push('Fix or remove these in CLAUDE.md.');
    }
    lines.push('');
    process.stdout.write(lines.join('\n'));
  } catch (e) {
    // Fail silent — never break boot on a hook error.
  }
  process.exit(0);
}

if (require.main === module) main();

module.exports = { buildFileIndex, extractRefs, resolveRefs, IGNORE_REFS, PLACEHOLDER_RE };
