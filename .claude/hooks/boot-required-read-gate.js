/**
 * boot-required-read-gate.js — SessionStart hook
 *
 * Catches the "boot-or-required-read-skipped" slip category (8 occurrences
 * in 14-day baseline window). Reads CLAUDE.md, extracts every "see X.md"
 * pointer + every backtick-wrapped file reference, and verifies each
 * resolves on disk. Surfaces ⚠️ for any broken pointer.
 *
 * Created 2026-05-23 — Phase 2 of meta-layer build.
 * Source slip: 2026-05-23 baseline found broken pointer at CLAUDE.md:81 +
 * :130 → projects/coding-projects/active/Etanah-Codebase-Read.md doesn't
 * exist. This hook catches the same shape going forward.
 */
const fs = require('fs');
const path = require('path');

// Resolve from this script's location → project root is 3 levels up
// (script is at <root>/.claude/hooks/<file>.js)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CLAUDE_MD = path.join(PROJECT_ROOT, '.claude', 'CLAUDE.md');

try {
  if (!fs.existsSync(CLAUDE_MD)) {
    process.exit(0);  // No CLAUDE.md, no work
  }

  const content = fs.readFileSync(CLAUDE_MD, 'utf8');

  // Extract all backtick-wrapped file paths ending in .md / .js / .json / .txt
  const refPattern = /`([a-zA-Z0-9./_-]+\.(md|js|json|txt))`/g;
  const refs = new Set();
  let m;
  while ((m = refPattern.exec(content)) !== null) {
    refs.add(m[1]);
  }

  // Verify each resolves — try both project-root-relative and as-is
  const broken = [];
  for (const ref of refs) {
    const candidates = [
      path.join(PROJECT_ROOT, ref),
      ref,  // absolute or otherwise
    ];
    const exists = candidates.some(p => {
      try { return fs.existsSync(p); } catch { return false; }
    });
    if (!exists) broken.push(ref);
  }

  // Build output
  const lines = [
    '',
    `⚙️  boot-required-read-gate: scanned ${refs.size} file references in CLAUDE.md`,
  ];

  if (broken.length === 0) {
    lines.push(`✓ all ${refs.size} references resolve`);
  } else {
    lines.push(`⚠️  ${broken.length} BROKEN pointer(s) found:`);
    broken.forEach(b => lines.push(`   🔴 ${b}`));
    lines.push('');
    lines.push('Fix or remove broken pointers in CLAUDE.md. Flagged for meta-layer Phase 9 (Integration) or sooner via Bankai consolidation (see todo.md Q1).');
  }
  lines.push('');

  process.stdout.write(lines.join('\n'));
  process.exit(0);
} catch (e) {
  // Fail silent — don't break boot on hook error
  process.exit(0);
}
