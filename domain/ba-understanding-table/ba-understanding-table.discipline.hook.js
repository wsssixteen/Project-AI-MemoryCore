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
function ticketTextWasReadInFull(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return true; } // unreadable -> don't block
  const TICKET_FILE = /(History|Description)\.txt/i;
  const FILTERED = /\b(grep|rg|Select-String|findstr|head\b|tail\b|sed\b|awk\b)/i;
  for (const line of raw.split(/\r?\n/)) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch (_) { continue; }
    const m = o.message || o;
    const c = m && m.content;
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (!b || b.type !== 'tool_use' || !b.input) continue;
      if (b.name === 'Read' && TICKET_FILE.test(String(b.input.file_path || ''))) return true;
      if ((b.name === 'Bash' || b.name === 'PowerShell')) {
        const cmd = String(b.input.command || '');
        if (TICKET_FILE.test(cmd) && !FILTERED.test(cmd)) return true;
      }
    }
  }
  return false;
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
      if (ticketTextWasReadInFull(data.transcript_path || '')) process.exit(0); // table + full read -> good
      try { fs.appendFileSync(LEDGER, JSON.stringify({ ts: new Date().toISOString(), kind: 'ba-table-from-filtered-read' }) + '\n'); } catch (_) {}
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: [
          '⛔ ba-understanding-table v1.1: BA table emitted, but the ticket text was never READ IN FULL this session.',
          '   Only filtered access (grep / Select-String / head / -A -B) to History.txt / Description.txt was found.',
          '   A table built from a grep reads authoritative while silently missing journal entries —',
          '   QA-273201: grepping the REMARK block hid the entry naming the tested tugasan (SRPT + KKPT)',
          '   and the trigger scenario ("Tindakan = Pembetulan > Klik butang Selesai"), which produced two',
          '   false statements to miya and a fix aimed at the wrong trigger.',
          '   FIX: Read the whole 0. Brief/History.txt (and Description.txt), then rebuild the table',
          '   with ONE ROW PER JOURNAL ENTRY + one row per attachment.',
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
