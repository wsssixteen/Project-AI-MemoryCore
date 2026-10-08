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

const REPO_ROOT = process.env.OQS_TEST_ROOT || require('path').resolve(__dirname, '..', '..'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19); OQS_TEST_ROOT = eval fixture root
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');

const OPEN_STATUSES = new Set(['active', 'hold', 'blocked', 'delegated']);

// 3-DAY RULE (miya 2026-07-27): any open-ticket list must be ranked by days
// elapsed since the Redmine start_date, not by difficulty and not by the order
// they happen to sit in active.txt. Injected here rather than left as prose in
// session-briefing.md because a rule that depends on me re-reading a spec file
// is a wish, not a rule (same cure as this hook's own origin story above).
const RANK_RULE = [
  '   ── 📅 BOARD SHAPE — 3 priority-ordered tables (miya 2026-09-22, supersedes single-Mine) ──',
  '   The LIVE board below is printed by quest/redmine-board.js. It is the source for the',
  '   briefing tables. active.txt is working memory and it rots — NEVER take dates from it.',
  '   Scope (miya 2026-08-05): every OPEN Melaka ticket on tracker eSOKONGAN + every Internal',
  '   Issue variant + Data Patching (PROD), Module Pelupusan OR Awam-Pelupusan, REGARDLESS of',
  '   assignee — he tracks colleagues\' tickets too. Present HIS list as THREE tables, in order:',
  '   1. Patching (PROD) — patch dokumen / patch data / alter flowable (trackers PROD-CR,',
  '      Data Patching (PROD), Internal Issue (PROD)). Ranked oldest start first.',
  '   2. eSOKONGAN tracker — ranked SEVERITY descending, then nearest due date. Carries a',
  '      Severity column.',
  '   3. Internal fixes & other — every remaining tracker. Ranked oldest start first.',
  '   Columns (tables 1+3): # · Days · Due date · Subject · State. Table 2 adds Severity.',
  '   Days = bare number. BANNED: a Start column · a Deadline column · "+3d" · "Days left".',
  '   State is the only column I fill by hand — from active.txt + the qa_doc.',
  '   Colleagues\' rows stay in a separate tracking table (--tracking): # · Tracker · Status ·',
  '   Assignee · Train · Subject. Omitting any of HIS tickets from the 3 tables is a 🔴 verify failure.',
  '   Specs: Feature/Session-Briefing-System/session-briefing.md · .claude/save-commands.md',
].join('\n');

function printLiveBoard() {
  // Run the board at boot rather than telling the model to run it. A boot step that
  // depends on me remembering to run a command is a wish, not a step (2026-07-22).
  try {
    const { execFileSync } = require('child_process');
    const script = path.join(REPO_ROOT, 'quest', 'redmine-board.js');
    if (!fs.existsSync(script)) return;
    // 20 s: the prompt bundle kills a child at 30 s, and a killed child prints nothing at all
    const out = execFileSync(process.execPath, [script], { encoding: 'utf-8', timeout: 20000, windowsHide: true });
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
    const rsc = require(path.join(REPO_ROOT, 'quest', 'redmine-status-check'));
    rsc.checkAll(open.map(q => ({ qa: q.qa, status: String(q.status).split(' ')[0] })));
    // 2026-08-04: the REVERSE direction. checkAll can only judge blocks that exist; it is blind to
    // a ticket assigned on Redmine that was never added locally. On 2026-08-04 boot that blindness
    // reported 3 open quests when 8 were assigned — an undercount hides miya's own work.
    rsc.checkMissing(open.map(q => q.qa));
  } catch (_) { /* never let a boot check break boot */ }
}

// ── v2 (2026-10-06, boot audit batch 2, per みや: "nothing loads until I name a ticket, say board or ask
//    for a briefing" + "add a lot of triggers: work / redmine / tickets / …") ─────────────────────────────
// The block above is UNCHANGED. What changed is WHEN it prints: no longer at every session start (5-13 s and
// ~8,000 characters in every session, other projects included) but on the first prompt that is about work.
//   ask  = he asks for the list itself (board, my tickets, retrieve tickets, briefing …) → always printed, live
//   soft = the prompt is about ticket work (a ticket number, "redmine", "let's do some work" …) → printed when
//          this session has not had it in the last 4 hours (a compaction drops it from context; the 4 h window
//          brings it back without a boot hook)
//   none → silent, no Redmine call
// Run with no prompt on stdin (a SessionStart registration, or by hand) or with --now → prints, as before.
const os = require('os');
const SHOWN_FILE = process.env.OQS_SHOWN_FILE || path.join(os.tmpdir(), 'ruri-open-quest-surfacer-shown.json');
const REPRINT_MS = 4 * 60 * 60 * 1000;
// Words that exist in other projects too ("task", "work", "what should I do") are SOFT only: at most one
// load per 4 hours. ASK is kept to words that can only mean his ticket list.
const LIST_NOUN = String.raw`(?:redmine\s+)?(?:tickets?|tiket|redmine|quests?|backlog|esokongan)`;
const ASK_RX = [
  /(?:^|\s)\/(?:list-redmine|retrieve-redmine|brief|sweep|quest)\b/i,
  /\b(?:the|my|our|ticket|tickets|redmine|live|show|refresh|print|open)\s+board\b|^\s*board\s*[?.!]*\s*$/i,
  // "brief me the results" / "status update on the build" are NOT briefing asks (false load 2026-10-06)
  /^\s*(?:please\s+)?brief\s+me\s*(?:please)?[.!?]*\s*$|\bbrief\s+me\s+on\s+(?:(?:the|my|our)\s+)?(?:tickets?|tiket|redmine|quests?|work|board|status)\b|^\s*(?:session\s+)?briefing\s*[.!?]*\s*$|\b(?:where\s+were\s+we|where\s+are\s+we|what'?s\s+our\s+status|what\s+is\s+our\s+status|catch\s+me\s+up|standup|stand-up)\b/i,
  new RegExp(String.raw`\b(?:list|show|give|print|refresh|retrieve|fetch|pull|grab|get|check|read|load|sync|import|senaraikan|tunjuk|semak|ambil)\s+(?:me\s+)?(?:(?:the|my|all|our|any|new|open|latest|newest|recent|pending|on|of|from|semua)\s+)*` + LIST_NOUN + String.raw`\b`, 'i'),
  new RegExp(String.raw`\bupdate\s+me\s+(?:on|about|with)\s+(?:(?:the|my|our|all|any|new|open)\s+)*(?:` + LIST_NOUN + String.raw`|work|kerja|tasks?)\b|\b(?:what|which|how\s+many|any|apa|berapa)\s+(?:(?:are|is|new|open|the|my|our|ada)\s+)*` + LIST_NOUN + String.raw`\b`, 'i'),
  /\b(?:my|open|new|pending|outstanding|today'?s|assigned|overdue)\s+(?:redmine\s+)?(?:tickets|tiket|quests|esokongan)\b|\bsenarai\s+tiket\b|\bnext\s+ticket\b/i,
];
const MAJOR_RX = /\b(?:tickets|redmine)\b/i;
const MAJOR_MAX_WORDS = 8;
const SOFT_RX = [
  /\bwhat'?s\s+(?:on\s+my\s+plate|pending|left\s+to\s+do|due)\b|\bwhat\s+(?:should|shall|do|can)\s+(?:i|we)\s+(?:do|work\s+on|start|pick|tackle)\b|\bto-?do\s+list\b|\bpriorit(?:y|ies)\s+(?:today|for\s+today|this\s+week)\b|\bupdate\s+me\b/i,
  /\b(?:redmine|tickets?|tiket|esokongan|e-sokongan|quests?|backlog|sla|permohonan|urusan|tugasan)\b/i,
  /\b(?:let'?s|lets|time\s+to|start|starting|begin|resume|continue|back\s+to|do\s+some|get\s+(?:back\s+)?to|ready\s+to|jom|mula|sambung)\s+(?:(?:the|our|my|some|doing|on)\s+)*(?:work|working|kerja|tasks?|coding|fixing|quest(?:ing)?)\b/i,
  /\b(?:daily|today'?s|office|etanah|e-tanah)\s+(?:work|kerja|tasks?)\b|\bwork(?:ing)?\s+(?:on\s+)?(?:today|now|mode)\b|\bstart\s+(?:of\s+)?(?:the\s+)?(?:day|work\s*day)\b/i,
  /\b(?:QA|ADHOC|ALTER|PATCH)-[A-Za-z0-9-]+\b|#\d{5,7}\b|\b(?:QA|FAT-OR|UAT-CR|FAT|UAT|REQUIREMENT|REQ|CR|issue)\s*#?\s*\d{4,}\b|\bPT[A-Z]{2,4}\/\d{2}\//,
];
function classify(prompt, activeText) {
  const p = String(prompt || '');
  if (!p.trim() || p.length > 20000) return null;
  if (/\[SYSTEM NOTIFICATION|<task-notification>|📌 OPEN QUESTS|LIVE REDMINE BOARD/.test(p)) return null;   // machine text, or this hook's own output pasted back
  if (ASK_RX.some(rx => rx.test(p))) return 'ask';
  // Major keywords (2026-10-08 per みや: "board" is not enough, "Tickets" and "Redmine" should also be it): a SHORT
  // message that says tickets or redmine is an ask for the list, every time. In a longer message the word is a
  // work signal (below): one load per 4 hours, so a long ticket discussion does not reload the list on every prompt.
  if (MAJOR_RX.test(p) && p.trim().split(/\s+/).length <= MAJOR_MAX_WORDS) return 'ask';
  if (SOFT_RX.some(rx => rx.test(p))) return 'soft';
  // a bare ticket number that matches an open block (same test as ticket-gate.js signal A2)
  for (const n of p.match(/\b\d{5,7}\b/g) || []) if (new RegExp('^qa=(?:QA-)?' + n + '\\b', 'm').test(activeText || '')) return 'soft';
  return null;
}
function readShown() { try { const j = JSON.parse(fs.readFileSync(SHOWN_FILE, 'utf8')); return j && typeof j === 'object' ? j : {}; } catch { return {}; } }
function markShown(sid) {
  try {
    const now = Date.now(); const j = readShown();
    for (const k of Object.keys(j)) if (now - j[k] > 2 * 24 * 60 * 60 * 1000) delete j[k];
    j[sid] = now;
    fs.writeFileSync(SHOWN_FILE + '.tmp', JSON.stringify(j)); fs.renameSync(SHOWN_FILE + '.tmp', SHOWN_FILE);
  } catch { /* a missing marker only means the board prints once more */ }
}
function entry() {
  if (process.argv.includes('--now')) return main();
  let raw = '';
  try { if (!process.stdin.isTTY) raw = fs.readFileSync(0, 'utf8'); } catch { raw = ''; }
  let data = null;
  try { data = JSON.parse(raw); } catch { data = null; }
  if (!data || typeof data.prompt !== 'string') return main();                 // session start or a manual run: as before
  try { const exp = parseInt(fs.readFileSync(path.join(REPO_ROOT, 'system', 'orchestration-mode.flag'), 'utf8').split('\n')[0], 10); if (Number.isFinite(exp) && Date.now() < exp) return; } catch { /* no sweep running */ }
  const kind = classify(data.prompt, safeRead(ACTIVE_TXT));
  if (!kind) return;
  const sid = String(data.session_id || 'no-session');
  if (kind === 'soft') { const last = readShown()[sid]; if (last && Date.now() - last < REPRINT_MS) return; }
  console.log(`📌 Ticket list loaded now (${kind === 'ask' ? 'you asked for it' : 'first work signal in this session'}; live from Redmine at ${new Date().toTimeString().slice(0, 5)}). It is no longer printed at session start.`);
  main();
  markShown(sid);
}

module.exports = { classify, ASK_RX, SOFT_RX, MAJOR_RX, MAJOR_MAX_WORDS };
if (require.main === module) {
  try { entry(); } catch (e) {
    console.log(`⚠️  open-quest-surfacer: error — ${e.message}`);
  }
}
