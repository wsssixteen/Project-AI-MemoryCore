/**
 * quest-objective-anchor.js — UserPromptSubmit hook
 *
 * Sibling to quest-active-grounding.js. That hook emits the STATUS line
 * (scope / phase / local-test). This hook goes one level deeper: when a quest
 * is active, it injects an OBJECTIVE LOCK — the verbatim BA-reported issue +
 * an anti-drift discipline block — so Ruri stays anchored to THE issue and
 * does not (a) restate the symptom from memory, or (b) declare a root cause
 * past verified evidence.
 *
 * Why this exists (2026-06-16, QA-261517):
 *   みや: "we should have an objective hook when we start quest. It should
 *   pull you to focus on the issue." Built after Ruri repeatedly drifted this
 *   session — mis-stated the symptom ("rows missing" when it was only
 *   "lampiran missing") and declared a root cause from an INTERMEDIATE test
 *   state before the test was finished. The anchor re-pins the issue + the
 *   verify-before-conclude rule on EVERY quest-active turn, not just at boot.
 *
 * v1.1 (2026-06-30, QA-267976): pulls the BA's VERBATIM Issue+Expected blocks
 *   from the task folder's History.txt (most-recent block of each kind wins)
 *   and surfaces them under the active.txt one-liner. Why: the one-liner is
 *   Ruri's PARAPHRASE — when Ruri (or みや) scope-contracts ("template-only,
 *   defer issue #4+#5"), the paraphrase silently agrees because it never
 *   enumerates the BA's full list. The verbatim block is the counter-quote
 *   source. Adds Rule 4: any scope-contraction of a BA-listed numbered issue
 *   MUST be preceded by a verbatim quote of THAT specific issue and an
 *   explicit nod-request — even if みや himself proposed the contraction.
 *
 * Reads the MAIN-repo quest/active.txt (authoritative; worktree copies drift).
 * v1.1: still REPORT-ONLY — emits to stdout, never blocks.
 *
 * Audit log: appends one JSON line per fire to
 *   domain/quest-objective-anchor/log.jsonl (per /system-rules Rule 5).
 *
 * Pairs with: quest-active-grounding.js (status line) · open-quest-surfacer.js
 *   (SessionStart boot counterpart). Distinct concern: status vs discipline.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\0. AI\\Project-AI-MemoryCore';
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');

function safeRead(p) { try { return fs.readFileSync(p, 'utf-8'); } catch { return null; } }

function parseBlocks(text) {
  const blocks = []; let cur = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line === '') { if (cur.length) { blocks.push(cur); cur = []; } }
    else cur.push(line);
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

function fieldOf(block, key) {
  for (const line of block) {
    const s = line.replace(/^\s+/, '');
    if (s.startsWith(key + '=')) return s.slice(key.length + 1).trim();
  }
  return null;
}

function isPastTesting(block) {
  const phase = fieldOf(block, 'phase');
  const ltc = fieldOf(block, 'local_test_confirmed');
  return phase === '1' && (ltc === 'true' || ltc === 'yes');
}

/**
 * Extract the MOST-RECENT verbatim Issue:/Expected: blocks from History.txt.
 * Returns { issues: string[], expected: string[], cycleStamp: string|null }.
 * Tolerates Redmine markdown bold (*Issue:*) and bare (Issue:) markers.
 * Returns empty arrays if file missing or no markers found.
 */
function extractVerbatimBA(historyPath) {
  const txt = safeRead(historyPath);
  if (!txt) return { issues: [], expected: [], cycleStamp: null };
  const lines = txt.split(/\r?\n/);

  // Marker regex — `Issue:` / `*Issue:*` / `**Issue:**` (case-insensitive)
  const isMarker = (l, word) =>
    new RegExp(`^\\s*\\*{0,2}${word}\\s*:?\\s*\\*{0,2}\\s*$`, 'i').test(l);
  // Author/timestamp line: `--- 2026-06-30T01:00:29Z by Anis Nabilah ---`
  const stampRe = /^---\s*(\S+)\s+by\s+(.+?)\s*---\s*$/;
  // Numbered item: `1. ...` or `  1. ...`
  const itemRe  = /^\s*(\d+)\.\s+(.+\S)\s*$/;

  // Track all marker-blocks in order; last wins for each kind.
  const blocks = { issue: [], expected: [] };
  let curStamp = null;
  let curKind = null;        // 'issue' | 'expected' | null
  let curItems = [];

  function flush() {
    if (curKind && curItems.length) {
      blocks[curKind].push({ stamp: curStamp, items: curItems.slice() });
    }
    curItems = [];
  }

  for (const raw of lines) {
    const m = raw.match(stampRe);
    if (m) {
      flush();
      curStamp = m[1];
      curKind = null;
      continue;
    }
    if (isMarker(raw, 'Issue')) {
      flush();
      curKind = 'issue';
      continue;
    }
    if (isMarker(raw, 'Expected')) {
      flush();
      curKind = 'expected';
      continue;
    }
    if (curKind) {
      const im = raw.match(itemRe);
      if (im) {
        curItems.push(`${im[1]}. ${im[2]}`);
      } else if (raw.trim() === '' && curItems.length) {
        // blank line ends the block
        flush();
        curKind = null;
      }
    }
  }
  flush();

  const last = (arr) => (arr.length ? arr[arr.length - 1] : null);
  const lastIssue = last(blocks.issue);
  const lastExpected = last(blocks.expected);
  return {
    issues: lastIssue ? lastIssue.items : [],
    expected: lastExpected ? lastExpected.items : [],
    cycleStamp: (lastIssue && lastIssue.stamp) || (lastExpected && lastExpected.stamp) || null,
  };
}

function appendAuditLog(entry) {
  try {
    const logDir = path.join(REPO_ROOT, 'domain', 'quest-objective-anchor');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'log.jsonl'), JSON.stringify(entry) + '\n');
  } catch { /* silent — logging must never break the hook */ }
}

function main() {
  const text = safeRead(ACTIVE_TXT);
  if (!text) return; // silent on read failure — never noise the prompt

  const blocks = parseBlocks(text);
  const active = [];
  for (const block of blocks) {
    const qa = fieldOf(block, 'qa');
    const status = fieldOf(block, 'status');
    if (!qa || status !== 'active') continue;
    if (isPastTesting(block)) continue;
    const urusan = fieldOf(block, 'urusan') || '';
    const tugasan = fieldOf(block, 'tugasan') || '';
    const issue = fieldOf(block, 'issue_one_liner') || '(no issue_one_liner recorded — read the qa_doc Ticket Summary)';
    const taskFolder = fieldOf(block, 'task_folder') || '';
    const scope = [urusan, tugasan].filter(Boolean).join(' / ');
    let verbatim = { issues: [], expected: [], cycleStamp: null };
    if (taskFolder) {
      const historyPath = path.join(taskFolder, '0. Brief', 'History.txt');
      verbatim = extractVerbatimBA(historyPath);
    }
    active.push({ qa, scope, issue, verbatim });
  }
  if (active.length === 0) return; // silent — no active quest

  const lines = [];
  for (const a of active) {
    lines.push(`\u{1F3AF} OBJECTIVE LOCK — ${a.qa}${a.scope ? ' (' + a.scope + ')' : ''}`);
    lines.push(`   ISSUE (paraphrase): ${a.issue}`);
    if (a.verbatim.issues.length) {
      lines.push(`   BA ISSUES (verbatim, latest cycle ${a.verbatim.cycleStamp || '?'}):`);
      for (const it of a.verbatim.issues) lines.push(`      ${it}`);
    }
    if (a.verbatim.expected.length) {
      lines.push(`   BA EXPECTED (verbatim):`);
      for (const it of a.verbatim.expected) lines.push(`      ${it}`);
    }
  }
  lines.push('   ── stay anchored ──');
  lines.push("   1. The reported symptom is GROUND TRUTH — re-read BA/みや's exact words; never restate the symptom from memory.");
  lines.push('   2. Do NOT declare a root cause past VERIFIED evidence (a DB row, a code line, a screenshot みや confirmed). Mid-test ≠ done.');
  lines.push('   3. Every claim about behaviour cites its verification. If a correction was just given, re-anchor to it before continuing.');
  lines.push('   4. ANY scope-contraction of a BA-listed numbered issue (defer / out-of-scope / "code-only, separate ticket") MUST first quote that');
  lines.push('      specific issue VERBATIM (from the block above) and ask みや for explicit nod — even if みや himself proposed the contraction.');
  console.log(lines.join('\n'));

  appendAuditLog({
    ts: new Date().toISOString(),
    quests: active.map(a => ({
      qa: a.qa,
      scope: a.scope,
      verbatimIssueCount: a.verbatim.issues.length,
      verbatimExpectedCount: a.verbatim.expected.length,
      cycleStamp: a.verbatim.cycleStamp,
    })),
  });
}

try { main(); } catch (e) {
  process.stderr.write(`quest-objective-anchor error: ${e.message}\n`);
}
