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
 * Reads the MAIN-repo quest/active.txt (authoritative; worktree copies drift).
 * v1: REPORT-ONLY — emits to stdout, never blocks.
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
    const scope = [urusan, tugasan].filter(Boolean).join(' / ');
    active.push({ qa, scope, issue });
  }
  if (active.length === 0) return; // silent — no active quest

  const lines = [];
  for (const a of active) {
    lines.push(`\u{1F3AF} OBJECTIVE LOCK — ${a.qa}${a.scope ? ' (' + a.scope + ')' : ''}`);
    lines.push(`   ISSUE: ${a.issue}`);
  }
  lines.push('   ── stay anchored ──');
  lines.push("   1. The reported symptom is GROUND TRUTH — re-read BA/みや's exact words; never restate the symptom from memory.");
  lines.push('   2. Do NOT declare a root cause past VERIFIED evidence (a DB row, a code line, a screenshot みや confirmed). Mid-test ≠ done.');
  lines.push('   3. Every claim about behaviour cites its verification. If a correction was just given, re-anchor to it before continuing.');
  console.log(lines.join('\n'));
}

try { main(); } catch (e) {
  process.stderr.write(`quest-objective-anchor error: ${e.message}\n`);
}
