// meta-layer-audit: skip-ghost-check — eval harness, run by hand, NOT an event hook (marked 2026-07-19 system-check)
/**
 * boot-required-read-gate.eval.js — runnable eval for the fixed resolver.
 * Run:  node .claude/hooks/boot-required-read-gate.eval.js   (exit 0 = PASS)
 *
 * Guards BOTH directions:
 *  - known-good subdir refs must NOT be flagged (the 95%-false-positive bug)
 *  - a genuinely-missing ref MUST still be flagged (no over-suppression)
 *  - placeholders + external-absent refs are skipped, not flagged
 *  - integration: real CLAUDE.md broken-count is small (was 42)
 */
const fs = require('fs');
const path = require('path');
const { extractRefs, resolveRefs } = require('./boot-required-read-gate.js');
const ROOT = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗ FAIL:', name); }
}

// 1. Subdir + path-prefixed refs resolve (these are all tracked + present).
const good = resolveRefs(new Set([
  'Feature/Domain-Expansion/expansion-protocol.md',   // relpath, 2 deep
  'meta/discipline-INDEX.md',                          // relpath, 1 deep
  'personality.md',                                    // bare basename in .claude/
  'quest-protocol.md',                                 // bare basename in quest/
]), ROOT);
check(`subdir/bare refs resolve (0 broken, got ${good.broken.length})`, good.broken.length === 0);

// 2. A genuinely-missing ref is STILL flagged (over-suppression guard).
const bad = resolveRefs(new Set(['totally-fake-nonexistent-zzz.md']), ROOT);
check('genuinely-missing ref IS flagged broken', bad.broken.includes('totally-fake-nonexistent-zzz.md'));

// 3. Placeholder pattern skipped, not flagged.
const ph = resolveRefs(new Set(['QA-NNNN.md']), ROOT);
check('QA-NNNN.md skipped as placeholder', ph.broken.length === 0 && ph.skippedPlaceholder === 1);

// 4. External/gitignored ref skipped, not flagged.
const ext = resolveRefs(new Set(['settings.local.json']), ROOT);
check('settings.local.json skipped as external', ext.broken.length === 0 && ext.skippedExternal === 1);

// 5. INTEGRATION — real CLAUDE.md: broken count must be small (was 42).
const content = fs.readFileSync(path.join(ROOT, '.claude', 'CLAUDE.md'), 'utf8');
const real = resolveRefs(extractRefs(content), ROOT);
check(`real CLAUDE.md broken <= 3 (got ${real.broken.length}, was 42)`, real.broken.length <= 3);
console.log('    real broken list:', JSON.stringify(real.broken));
console.log(`    real counts: ${real.total} refs · ${real.skippedPlaceholder} placeholder · ${real.skippedExternal} external`);

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
