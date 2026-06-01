/**
 * quest-active-grounding.js — UserPromptSubmit hook
 *
 * Standing-context emit: when at least one quest in quest/active.txt is
 * status=active AND NOT past-testing (i.e. NOT (phase=1 AND
 * local_test_confirmed=true)), emit a single grounding line per quest so
 * Ruri always sees the high-hierarchy quest context before responding.
 *
 * Format per quest:
 *   Active quest: QA-X · Scope: <urusan/module> · Phase: <Recon|Rubric|Apply|...> · Local test: <yes|no>
 *
 * Phase-aware silencing (per みや's option (b) 2026-06-01):
 *   - Hook silent for blocks with status != active (hold/blocked/delegated/closed)
 *   - Hook silent for blocks where phase=1 AND local_test_confirmed=true
 *     → matches the natural "we're past the real work" transition
 *   - Hook silent if no matching blocks → zero output
 *
 * Why this exists:
 *   2026-06-01 — みや: "the proper use of flags is for example, when we start
 *   a quest, it will always show like the most highest hierarchy of info like
 *   'We are in a quest right now, Scope: PRBB, ...'. Simple but effective to
 *   ground you." Hooks-as-harness: standing context injected at trigger points
 *   to keep high-priority quest context visible on every prompt, not just at
 *   boot (which is what open-quest-surfacer.js handles).
 *
 * Pairs with: open-quest-surfacer.js (SessionStart counterpart — fires once
 *   at boot, this fires every prompt during active engagement).
 *
 * v1: REPORT-ONLY — emits to stdout, never blocks.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\0. AI\\Project-AI-MemoryCore';
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

function deriveScope(block) {
  // Prefer explicit urusan/scope_anchor; fall back to test_app or env.
  const urusan = fieldOf(block, 'urusan');
  if (urusan) return urusan;
  const oneLiner = fieldOf(block, 'issue_one_liner') || '';
  // Try to extract urusan-shape token from one-liner (e.g. "PRBB ...", "PT-PSBS-MCL ...").
  const m = oneLiner.match(/^([A-Z][A-Z0-9_\-]{1,15})\b/);
  if (m) return m[1];
  return fieldOf(block, 'env') || '?';
}

function isPastTesting(block) {
  const phase = fieldOf(block, 'phase');
  const ltc = fieldOf(block, 'local_test_confirmed');
  return phase === '1' && (ltc === 'true' || ltc === 'yes');
}

function main() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) return; // silent on read failure (don't noise the prompt)

  const blocks = parseBlocks(text);
  const grounding = [];

  for (const block of blocks) {
    if (!blockHasQA(block)) continue;
    const qa = fieldOf(block, 'qa');
    const status = fieldOf(block, 'status');
    if (!qa || status !== 'active') continue;
    if (isPastTesting(block)) continue; // option (b) phase-aware silencing

    const scope = deriveScope(block);
    const phase = fieldOf(block, 'phase') || '?';
    const currentPhase = fieldOf(block, 'current_phase') || `phase-${phase}`;
    const ltc = fieldOf(block, 'local_test_confirmed');
    const ltcLabel = (ltc === 'true' || ltc === 'yes') ? 'yes' : 'no';

    grounding.push(`Active quest: ${qa} · Scope: ${scope} · Phase: ${currentPhase} · Local test: ${ltcLabel}`);
  }

  if (grounding.length === 0) return; // silent — no active quests past-testing-or-active

  console.log('🎯 ' + grounding.join('\n🎯 '));
}

try { main(); } catch (e) {
  // Silent on error — don't break prompts. Log to stderr for debug only.
  process.stderr.write(`quest-active-grounding error: ${e.message}\n`);
}
