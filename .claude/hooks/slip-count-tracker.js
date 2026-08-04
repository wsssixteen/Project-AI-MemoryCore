/**
 * slip-count-tracker.js — PostToolUse hook (Edit | Write on system/slip-log.md)
 *
 * WHY (みや 2026-06-20, item 4): the slip-log running-count table is hand-maintained
 *   → stale (its header still said "this session 2026-06-01"). みや's wider intent:
 *   the slip-log is our general WORKFLOW-AUDIT tracker (not just feature slips) and
 *   the count must be accurate without me remembering to update a markdown table.
 *
 * WHAT: when a new slip ENTRY row is appended to system/slip-log.md, record
 *   {ts, categories[]} to system/slip-counts.jsonl (the machine source-of-truth),
 *   then emit the rolling 7-day / 30-day tally per root_category and FLAG any
 *   category at/over the escalation threshold (>=2 in 7 days). The markdown
 *   running-count table becomes a VIEW of this ledger; the ledger is the truth.
 *
 * ROBUSTNESS: a slip ENTRY row is identified by a DATE in column 1 (`| 2026-06-20 ...`);
 *   the running-count TABLE rows start with a category name (no date) and are skipped,
 *   so the hook never double-counts itself. root_category = column 3 (the documented
 *   schema position). Unparseable rows are ignored, never block (PostToolUse advisory).
 *   Fail-OPEN on any error.
 *
 * Layer: hook-only Power (per /system-design Rule 7). Ledger doubles as the audit log
 *   (per /system-rules Rule 5). v1 = ledger + advisory tally. v1.1 candidate: regenerate
 *   the markdown running-count table from the ledger directly.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const LEDGER = path.join(PROJECT_ROOT, 'system', 'slip-counts.jsonl');
const DATE_CELL = /^\d{4}-\d{2}-\d{2}/;            // col-1 date ⇒ this is a slip ENTRY row
const SEVEN_DAY_ESCALATION = 2;

function addedText(toolName, ti) {
  if (toolName === 'Write') return String(ti.content || '');
  if (toolName === 'Edit') return String(ti.new_string || '');
  if (toolName === 'MultiEdit' && Array.isArray(ti.edits)) return ti.edits.map(e => e.new_string || '').join('\n');
  return '';
}

// Extract root_category from each appended slip ENTRY row (date in col 1, category in col 3).
function parseCategories(text) {
  const cats = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    if (/^\|[\s:-]+\|/.test(line)) continue;                    // separator row
    const cells = line.split('|').map(c => c.trim());           // ['', c1, c2, c3, ...]
    if (cells.length < 5) continue;
    if (!DATE_CELL.test(cells[1] || '')) continue;              // not a dated entry → skip (incl. count-table)
    const cat = (cells[3] || '').replace(/\(.*?\)/g, '').trim();// drop parentheticals
    if (cat && cat.length <= 80) cats.push(cat.toLowerCase());
  }
  return [...new Set(cats)];
}

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name || '';
    const ti = data.tool_input || {};

    // v2 RETARGET (2026-07-19 system-check Task #1): slip-log.md froze 2026-07-13; the live
    // pipeline is `node core/slips.js add` (Bash) → system/slips.jsonl. Fire on THAT command;
    // slips.js already appends both ledgers + regenerates the dashboard, so this hook's sole
    // remaining job is the rolling 7d/30d escalation tally the old version emitted.
    let cats = [];
    if (toolName === 'Bash' && /core[\\\/]slips\.js\s+add/.test(String(ti.command || ''))) {
      const m = String(ti.command || '').match(/--category\s+"?([\w\/-]+)"?/);
      if (m) cats = [m[1].toLowerCase()];
    } else {
      // legacy path kept for archive edits (rare, e.g. history corrections)
      const filePath = ti.file_path || ti.path || '';
      if (!/slip-log\.md$/i.test(filePath)) process.exit(0);
      cats = parseCategories(addedText(toolName, ti));
    }
    if (cats.length === 0) process.exit(0);
    // NOTE: no append here in the Bash path — core/slips.js already wrote both ledgers.

    // Roll up the ledger for the categories just added
    let ledger = [];
    try {
      ledger = fs.readFileSync(LEDGER, 'utf8').split(/\r?\n/).filter(Boolean)
        .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    } catch (_) {}
    const d7 = daysAgo(7), d30 = daysAgo(30);

    const lines = ['', '⚙️  slip-count-tracker: rolling tally for ' + cats.length + ' slip-categor' + (cats.length === 1 ? 'y' : 'ies') + ' (ledger: system/slips.jsonl via core/slips.js)', ''];
    for (const c of cats) {
      const entries = ledger.filter(e => e.category === c);
      const n7 = entries.filter(e => new Date(e.ts) >= d7).length;
      const n30 = entries.filter(e => new Date(e.ts) >= d30).length;
      const flag = n7 >= SEVEN_DAY_ESCALATION ? '  🚨 ESCALATION (>=2 in 7d — redesign the defender, do not just reword)' : '';
      lines.push(`   • ${c}: 7d=${n7} · 30d=${n30}${flag}`);
    }
    lines.push('', '   (ledger is the source of truth; the slip-log running-count table is a view of it.)', '');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: lines.join('\n') },
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-OPEN
  }
});
