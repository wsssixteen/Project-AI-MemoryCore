/**
 * mode-detector.js — UserPromptSubmit hook
 *
 * PURPOSE: Detect and surface the current operational mode so mode-scoped
 * rules (like op-follow-through per Item D 2026-06-01) can scope their
 * enforcement to the right context. Currently 2 modes; expandable later.
 *
 * Modes:
 *   - Quest-active: quest/active.txt has ≥1 block with status=active AND
 *     NOT (phase=1 AND local_test_confirmed=true). The "we're mid-quest
 *     and not yet past testing" window where op-follow-through, RCRL,
 *     scope-anchor, etc. are load-bearing.
 *   - Discussion: default (no quest active). Casual / planning / system
 *     design / off-quest work. Some Quest-mode rules silenced here.
 *
 * Why this exists (per みや Q1 answer 2026-06-01 S5):
 *   Op-follow-through "rarely fires" because the prose-only rule fires on
 *   EVERY emit — which makes it noise outside quest, ignored inside.
 *   Mode-scoping = fire reliably WHERE it matters, silent elsewhere.
 *   This hook is the lever; downstream hooks read its output and scope.
 *
 * Output format (stdout, one line):
 *   🎯 Mode: <Quest-active | Discussion>
 *   (or silent if neither mode applies — should not happen with current 2-mode design)
 *
 * Future (v1.1): Debugging-universal mode — detect stack traces / error
 *   messages / "let's debug" in last N turns. Deferred.
 *
 * Pairs with: quest-active-grounding.js (sibling — also reads active.txt
 *   but emits per-quest detail; this emits the abstract mode label).
 *
 * v1: REPORT-ONLY — emits to stdout, never blocks.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = require('path').resolve(__dirname, '..', '..'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19)
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');

function safeRead(p) {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return null; }
}

function parseBlocks(text) {
  const blocks = [];
  let current = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (line === '') {
      if (current.length) { blocks.push(current); current = []; }
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current);
  return blocks;
}

function fieldOf(block, key) {
  for (const line of block) {
    const stripped = line.replace(/^\s+/, '');
    if (stripped.startsWith(key + '=')) {
      return stripped.slice(key.length + 1).trim();
    }
  }
  return null;
}

function blockHasQA(block) {
  return block.some(l => /^\s*qa=/.test(l));
}

function isPastTesting(block) {
  const phase = fieldOf(block, 'phase');
  const ltc = fieldOf(block, 'local_test_confirmed');
  return phase === '1' && (ltc === 'true' || ltc === 'yes');
}

function detectMode() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) return 'Discussion';

  const blocks = parseBlocks(text);
  for (const block of blocks) {
    if (!blockHasQA(block)) continue;
    const status = fieldOf(block, 'status');
    if (status !== 'active') continue;
    if (isPastTesting(block)) continue;
    // Found a mid-quest active block
    return 'Quest-active';
  }
  return 'Discussion';
}

function main() {
  const mode = detectMode();
  console.log(`🎯 Mode: ${mode}`);
}

try { main(); } catch (e) {
  process.stderr.write(`mode-detector error: ${e.message}\n`);
}
