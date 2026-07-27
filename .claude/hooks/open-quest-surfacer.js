/**
 * open-quest-surfacer.js — SessionStart hook
 *
 * Reads quest/active.txt in full (bypassing Read-tool token cap) and
 * surfaces every block with status ∈ {active, hold, blocked, delegated}
 * as a single "📌 OPEN QUESTS" line at session boot.
 *
 * Why this exists (the slip it prevents):
 *   2026-05-25 — boot briefing missed QA-262783 + QA-262869 (both
 *   status=hold from 2026-05-22) because Read tool truncated active.txt
 *   at line 309 of 640. The "reconciliation autoscan" in CLAUDE.md Step 5
 *   was prose-only — soft documentation depending on model attention.
 *   みや caught it 3 days late: "I'm still concerned you missed
 *   open/active quests in session start. That needs fixing."
 *
 *   Same shape as the 2026-05-25 ghost-hook discovery: documentation
 *   claimed enforcement that wasn't deterministic. Cure: convert the
 *   attention-dependent rule into a hook that fires every boot.
 *
 * Pairs with: meta-layer-audit.js (Layer 0 audit), boot-load-verification.js,
 *   silent-claim-drift-gate.js (same "deterministic gate beats prose" pattern).
 *
 * v1: REPORT-ONLY — emits to stdout, never blocks boot.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = require('path').resolve(__dirname, '..', '..'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19)
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');

const OPEN_STATUSES = new Set(['active', 'hold', 'blocked', 'delegated']);

// 3-DAY RULE (miya 2026-07-27): any open-ticket list must be ranked by days
// elapsed since the Redmine start_date, not by difficulty and not by the order
// they happen to sit in active.txt. Injected here rather than left as prose in
// session-briefing.md because a rule that depends on me re-reading a spec file
// is a wish, not a rule (same cure as this hook's own origin story above).
const RANK_RULE = [
  '   ── 📅 3-DAY RULE — how to rank this list (miya 2026-07-27) ──',
  '   1. Pull start_date + due_date LIVE from Redmine:',
  '      issues.json?assigned_to_id=me&status_id=open&limit=50',
  '      NEVER take dates from active.txt — it is working memory and it rots.',
  '   2. days_elapsed = today - start_date · internal_deadline = start_date + 3 days',
  '   3. Rank DESCENDING by days_elapsed (oldest start = do first). Tie-break on nearer due_date.',
  '   4. Table columns: # · Subject · Start · +3d · Redmine due · Days left · State',
  '      Mark rows past the internal deadline, and rows hitting it today.',
  '   5. Difficulty/ease is NOT the sort axis — secondary column ON REQUEST only.',
  '   6. Reconcile against Redmine BEFORE showing: drop anything closed/reassigned there.',
  '   Specs: Feature/Session-Briefing-System/session-briefing.md · .claude/save-commands.md',
].join('\n');

function safeRead(p) {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return null; }
}

function parseBlocks(text) {
  // Split on blank lines. Each block is a paragraph of `key=value` lines.
  // First block can start with bare `active:` / `closed:` marker — strip it.
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
  // Find `key=value` line; tolerates leading whitespace + bare-marker lines.
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

function main() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) {
    console.log('⚠️  open-quest-surfacer: cannot read quest/active.txt — skipping');
    return;
  }

  const blocks = parseBlocks(text);
  const open = [];

  for (const block of blocks) {
    if (!blockHasQA(block)) continue;
    const qa = fieldOf(block, 'qa');
    const status = fieldOf(block, 'status');
    if (!qa || !status) continue;
    if (!OPEN_STATUSES.has(status)) continue;

    const oneLiner = fieldOf(block, 'issue_one_liner')
      || fieldOf(block, 'note')
      || fieldOf(block, 'scope_anchor')
      || '(no one-liner)';
    const phase = fieldOf(block, 'phase') || '?';
    const delegated = fieldOf(block, 'delegated_to');
    const statusLabel = delegated ? `${status} → ${delegated}` : status;
    open.push({ qa, status: statusLabel, phase, oneLiner: oneLiner.slice(0, 120) });
  }

  if (open.length === 0) {
    console.log('📌 OPEN QUESTS: none (active.txt has zero entries with status ∈ {active, hold, blocked, delegated})');
    return;
  }

  console.log(`📌 OPEN QUESTS — ${open.length} entry/entries in active.txt with status ∈ {active, hold, blocked, delegated}:`);
  for (const q of open) {
    console.log(`   ${q.qa} (phase=${q.phase}, status=${q.status}) — ${q.oneLiner}`);
  }
  console.log('   → Surface these in Session Briefing Standing Flags. If briefing omits any, that is a 🔴 verify failure.');
  console.log(RANK_RULE);
}

try { main(); } catch (e) {
  console.log(`⚠️  open-quest-surfacer: error — ${e.message}`);
}
