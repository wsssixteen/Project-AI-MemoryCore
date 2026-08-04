/**
 * ba-understanding-table.discipline.hook.js — Stop hook (Power: ba-understanding-table)
 *
 * WHY (QA-267382, 2026-06-25 — みや directed):
 *   At quest intake I read the BA brief + 3 attachments, then OVERRODE the BA's
 *   verbatim screenshot annotation ("Tarik pelan yang salah — expected pelan public
 *   upload" = WRONG plan) with my own inference ("just resized") and stamped it
 *   VERIFIED. The cure みや asked for: FORCE, at pre-Phase-0, a 2-column table —
 *   col 1 = what the BA said VERBATIM (one row PER attachment too), col 2 = my
 *   pre-Phase-0 understanding — so the BA's words are the written anchor BEFORE any
 *   analysis can drift off them. Same stage + content as the quest persistent checklist.
 *
 * WHAT: on a quest-INTAKE Stop turn (a ticket id + brief/attachment signals present)
 *   that has NO "BA said | my understanding" table -> ADVISORY (additionalContext).
 *   Advisory now; flips to block once the ledger validates low false-positive.
 *   Front gate = a line in ticket-gate.js Phase-0 injection (announces the mandate).
 *
 * v1.2 (2026-08-04, QA-270900 cycle-2, miya MANDATORY): require BOTH Description.txt AND History.txt
 *   AND every attachment in 0. Brief/ + any N. Rework|Addition folder of the active quest. v1.1's
 *   `History OR Description` accepted one and let the other stay unopened — the exact hole this fell through.
 *
 * SAFETY: stop_hook_active guard (anti-loop, line 1); fail-OPEN on any parse error;
 *   only fires when BOTH ticket + intake signals present (not on ordinary turns);
 *   bypass [skip-ba-table: <reason>].
 *
 * Ledger: domain/ba-understanding-table/log.jsonl  (per system-rules Rule 5)
 * system-audit: registered in settings.json Stop at the ${CLAUDE_PROJECT_DIR} path.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LEDGER = path.resolve(__dirname, 'log.jsonl');

const EXEMPT = /\[skip-ba-table:|═══|るり結界|Domain Expansion/;
const TICKET = /\b(QA[-\s]?\d{5,}|ESOKONGAN\s*#?\d+|FAT-?OR?\s*#?\d+|UAT-?CR?\s*#?\d+|REQUIREMENT\s*#?\d+|PTMLK\/)/i;
const INTAKE = /\b(Description\.txt|History\.txt|0\.\s*Brief|attachment|annotation|Issue Checklist|Quest Prep(aration)?|Phase 0|BA('?s)? (said|wrote|annotation|complaint|expect|report)|the brief)\b/i;
// required table: a header row pairing BA's words with my understanding
const BA_TABLE = /\|[^|\n]*\bBA\b[^|\n]*\|[^|\n]*\b(underst|reading|interpret|my take)/i;

// v1.1 (2026-08-03, QA-273201 — ticket-source-skipped escalated 7d=2): a BA table built from a GREP
// is worse than none — it reads authoritative while silently missing journal entries. Require proof
// the ticket text was READ IN FULL this session: a Read tool call on History.txt/Description.txt, or
// a `cat` of it with no pattern filter. A grep/Select-String/-A/-B/head over History.txt does NOT count.
// v1.2 (2026-08-04, QA-270900 cycle-2 — ticket-source-skipped repeat, miya-caught + MANDATORY):
// v1.1 accepted History.txt OR Description.txt. That `or` IS the hole: I read History.txt, the gate
// went green, and Description.txt + BOTH 0. Brief attachments were never opened all session.
// miya: "skipping reading latest BA issue (NOT LATEST MESSAGE IN HISTORY) AND its attachments".
// The BA ISSUE lives in Description.txt; History.txt is only the journal on top of it. Require BOTH,
// and require every attachment in 0. Brief/ + any rework folder to have been actually opened.
function unreadTicketSources(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return []; } // unreadable -> don't block
  const FILTERED = /\b(grep|rg|Select-String|findstr|head\b|tail\b|sed\b|awk\b)/i;
  const opened = new Set();
  for (const line of raw.split(/\r?\n/)) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch (_) { continue; }
    const m = o.message || o;
    const c = m && m.content;
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (!b || b.type !== 'tool_use' || !b.input) continue;
      if (b.name === 'Read') opened.add(path.basename(String(b.input.file_path || '')).toLowerCase());
      else if (b.name === 'Bash' || b.name === 'PowerShell') {
        const cmd = String(b.input.command || '');
        if (FILTERED.test(cmd)) continue; // a grep is not a read
        for (const f of requiredSourceFiles()) {
          if (cmd.toLowerCase().includes(f.toLowerCase())) opened.add(f.toLowerCase());
        }
      }
    }
  }
  return requiredSourceFiles().filter(f => !opened.has(f.toLowerCase()));
}

// Enumerate the ACTIVE quest's primary BA sources from disk: 0. Brief/* plus any "N. Rework"/"N. Addition"
// folder (a rework cycle's screenshot is a primary source too). Falls back to the two .txt names when the
// task folder cannot be resolved, so the gate degrades to v1.1 behaviour rather than failing open silently.
let _cachedRequired = null;
function requiredSourceFiles() {
  if (_cachedRequired) return _cachedRequired;
  const fallback = ['Description.txt', 'History.txt'];
  try {
    let root = __dirname;
    while (root !== path.dirname(root) && !fs.existsSync(path.join(root, 'quest', 'active.txt'))) root = path.dirname(root);
    const activePath = path.join(root, 'quest', 'active.txt');
    if (!fs.existsSync(activePath)) { _cachedRequired = fallback; return _cachedRequired; }
    const blocks = fs.readFileSync(activePath, 'utf8').split(/\n\s*\n/);
    const live = blocks.filter(b => /^\s*status=active\s*$/m.test(b));
    const folders = live.map(b => (b.match(/^task_folder=(.+)$/m) || [])[1]).filter(Boolean);
    const files = new Set(fallback);
    for (const tf of folders) {
      for (const sub of ['0. Brief'].concat(
        (fs.existsSync(tf) ? fs.readdirSync(tf) : []).filter(d => /^\d+\.\s*(Rework|Addition)/i.test(d))
      )) {
        const dir = path.join(tf, sub);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir)) if (!f.startsWith('~$')) files.add(f);
      }
    }
    _cachedRequired = [...files];
  } catch (_) { _cachedRequired = fallback; }
  return _cachedRequired;
}

function readLastAssistantText(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return null; }
  const objs = raw.split(/\r?\n/).filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } });
  let boundary = -1;
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i]; if (!o) continue; const m = o.message || o;
    if ((m.role || o.type) !== 'user') continue;
    const c = m.content;
    if ((typeof c === 'string') || (Array.isArray(c) && c.some(b => b && b.type !== 'tool_result'))) { boundary = i; break; }
  }
  let text = '';
  for (let i = (boundary < 0 ? 0 : boundary + 1); i < objs.length; i++) {
    const o = objs[i]; if (!o) continue; const m = o.message || o;
    if ((m.role || o.type) !== 'assistant') continue;
    const c = m.content;
    if (Array.isArray(c)) { for (const b of c) if (b && b.type === 'text' && b.text) text = b.text; }
    else if (typeof c === 'string') text = c;
  }
  return text;
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) process.exit(0);
    const text = readLastAssistantText(data.transcript_path || '');
    if (!text || text.length < 600) process.exit(0);
    if (EXEMPT.test(text)) process.exit(0);
    if (!TICKET.test(text) || !INTAKE.test(text)) process.exit(0); // not a quest-intake turn
    if (BA_TABLE.test(text)) {
      const unread = unreadTicketSources(data.transcript_path || '');
      if (!unread.length) process.exit(0); // table + every source opened -> good
      try { fs.appendFileSync(LEDGER, JSON.stringify({ ts: new Date().toISOString(), kind: 'ba-source-unread', unread }) + '\n'); } catch (_) {}
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: [
          '⛔ ba-understanding-table v1.2: BA table emitted, but these PRIMARY BA SOURCES were never opened this session:',
          ...unread.map(f => `     • ${f}`),
          '   Open EVERY one (Read for text/images; the annotations skill for PDFs), then rebuild the table',
          '   with ONE ROW PER JOURNAL ENTRY + ONE ROW PER ATTACHMENT.',
          '   A grep / Select-String / head does NOT count as reading.',
          '',
          '   🚨 Description.txt is the BA ISSUE. History.txt is only the journal on top of it.',
          '   Reading one is NOT reading the other — that `or` was the v1.1 hole (QA-270900 cycle-2, miya:',
          '   "skipping reading latest BA issue (NOT LATEST MESSAGE IN HISTORY) AND its attachments. MANDATORY").',
          '   Prior cost — QA-273201: grepping the REMARK block hid the entry naming the tested tugasan',
          '   (SRPT + KKPT) and the trigger scenario, producing two false statements to miya.',
          '   Genuinely not a ticket-intake turn -> [skip-ba-table: <reason>].',
        ].join('\n'),
      }));
      process.exit(0);
    }
    try { fs.appendFileSync(LEDGER, JSON.stringify({ ts: new Date().toISOString(), kind: 'ba-table-missing' }) + '\n'); } catch (_) {}
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext: [
          '⚙️  ba-understanding-table (ADVISORY): a quest-intake turn with NO "BA said | my understanding" table.',
          '   Before ANY analysis/diagnosis, emit a 2-column table — col 1 = what the BA said VERBATIM, with one',
          '   row PER attachment too (photo annotation text, PDF FreeText, each journal line); col 2 = your',
          '   pre-Phase-0 understanding of that exact statement.',
          '   The BA\'s words are GROUND TRUTH; this table is the anchor that stops inference from overriding them (QA-267382).',
          '   Bypass once justified: [skip-ba-table: <reason>].',
        ].join('\n'),
      },
    }));
    process.exit(0);
  } catch (_) {
    process.exit(0); // fail-OPEN
  }
});
