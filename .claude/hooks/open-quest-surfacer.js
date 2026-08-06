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
 * Pairs with: system-audit.js (Layer 0 audit), boot-load-verification.js,
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
  '   ── 📅 3-DAY RULE — how to shape this list (miya 2026-07-27, revised 2026-08-05) ──',
  '   The LIVE board below is printed by quest/redmine-board.js. It is the source for the',
  '   briefing table. active.txt is working memory and it rots — NEVER take dates from it.',
  '   1. Scope (miya 2026-08-05): every OPEN Melaka ticket on tracker eSOKONGAN + every',
  '      Internal Issue variant + Data Patching (PROD), Module Pelupusan OR Awam-Pelupusan,',
  '      REGARDLESS of assignee — he tracks colleagues\' tickets too.',
  '   2. Rank DESCENDING by days elapsed since start_date. Tie-break on nearer due date.',
  '   3. Columns for HIS rows: # · Days · Deadline · Redmine due · Subject · State.',
  '      Days = bare number. Deadline = the plain word overdue/today/ok.',
  '      BANNED: a Start column · "+3d" · "Days left" · glyph markers like "past".',
  '      State is the only column I fill by hand — from active.txt + the qa_doc.',
  '   4. Colleagues\' rows go in a second tracking table: # · Tracker · Status · Assignee · Subject.',
  '   5. Difficulty/ease is NOT the sort axis — secondary column ON REQUEST only.',
  '   Specs: Feature/Session-Briefing-System/session-briefing.md · .claude/save-commands.md',
].join('\n');

function printLiveBoard() {
  // Run the board at boot rather than telling the model to run it. A boot step that
  // depends on me remembering to run a command is a wish, not a step (2026-07-22).
  try {
    const { execFileSync } = require('child_process');
    const script = path.join(REPO_ROOT, 'quest', 'redmine-board.js');
    if (!fs.existsSync(script)) return;
    const out = execFileSync(process.execPath, [script], { encoding: 'utf-8', timeout: 30000 });
    console.log('\n📋 LIVE REDMINE BOARD (Melaka Pelupusan — all trackers, all assignees):\n');
    console.log(out.trimEnd());
  } catch (e) {
    console.log(`⚠️  live board unavailable (${e.message.split('\n')[0]}) — fall back to quest/active.txt`);
  }
}

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
  printLiveBoard();

  // 2026-08-04: catch drift caused OUTSIDE active-cli (someone resolves/reassigns on Redmine while
  // we sleep). ~0.4s measured for 3 quests in parallel. The primary capture points are in
  // active-cli.js start/update/archive; this is the safety net, not the mechanism.
  try {
    const rsc = require(require('path').join(__dirname, '..', '..', 'quest', 'redmine-status-check'));
    rsc.checkAll(open.map(q => ({ qa: q.qa, status: String(q.status).split(' ')[0] })));
    // 2026-08-04: the REVERSE direction. checkAll can only judge blocks that exist; it is blind to
    // a ticket assigned on Redmine that was never added locally. On 2026-08-04 boot that blindness
    // reported 3 open quests when 8 were assigned — an undercount hides miya's own work.
    rsc.checkMissing(open.map(q => q.qa));
  } catch (_) { /* never let a boot check break boot */ }
}

try { main(); } catch (e) {
  console.log(`⚠️  open-quest-surfacer: error — ${e.message}`);
}
