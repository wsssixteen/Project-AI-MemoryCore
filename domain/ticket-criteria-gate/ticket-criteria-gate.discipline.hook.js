/**
 * ticket-criteria-gate.discipline.hook.js — Stop hook
 * Power: domain/ticket-criteria-gate/
 *
 * PURPOSE (per みや 2026-06-20, QA-261986 close — "much more critical than the
 * test stop hook"): I must NOT declare a ticket done / closed / ready-to-test
 * without SHOWING that every BA criterion is addressed-with-evidence — not a
 * bogus self-asserted ✓. The Tolak-deferred-incomplete-close + the cycle-2 bogus
 * CC-tag list (both `knowledge-transfer-incompleteness` slips) are what this kills.
 *
 * TWO checks (both Stop-side; fire only in a ticket context):
 *   A. COMPLETENESS  -> HARD BLOCK. Reply makes a done/close/ready-to-test claim
 *      for a ticket but has NO `CRITERIA COVERAGE` table OR no evidence token
 *      anywhere -> block. The table must list every BA criterion (latest cycle)
 *      + an evidence cell (file:line / test result / DB read-back / みや-confirmed
 *      / [skip:reason]).
 *   B. CHECKLIST-QUALITY -> ADVISORY (v1, start-simple per /system-rules R4).
 *      Reply emits an Issue Checklist with zero BA-source citation -> remind each
 *      item must cite Description / journal / History / photo / PDF; no invented
 *      or vague items. Flips to block once validated.
 *
 * HONEST CAN / CANNOT (same split as quest-phase-gate / veritas):
 *   CAN  (shape ~100%): a coverage table + evidence tokens EXIST before a done-claim.
 *   CANNOT (correctness — my judgment + みや's glance): that the evidence is valid,
 *   that the criteria list is exhaustive, or that an unknown bug was actually found.
 *   GUARANTEE: no SILENT done-claim. NEVER discovery.
 *
 * REWORK: same gate; criteria = the LATEST-cycle BA asks (RCRL), not the original.
 *
 * SAFETY: stop_hook_active anti-loop (line 1) · fail-OPEN on any parse error ·
 *   EXEMPT token + hand-back/closing/hedge frames abstain · bypass [skip-criteria-gate:].
 * Log: domain/ticket-criteria-gate/log.jsonl.
 *
 * meta-layer-audit: registered in settings.json Stop array at the MAIN-repo path;
 *   built in worktree zen-napier-4471cc 2026-06-20 — goes LIVE on merge to main
 *   (pending-merge until the file lands at the main path).
 *
 * Created 2026-06-20 per みや, routed through /system-design + /system-rules.
 * eval.workflow.js (eval-vs-past-tickets) = deferred to a later phase per みや.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

const EXEMPT = /\[skip-criteria-gate:|\[skip-show-gate:|═══ ▶ YOUR MOVE|るり結界|Domain Expansion/;

// ticket context — a ticket reference present in the reply
const TICKET_REF = /\bQA[-\s#]?\d{4,}\b|\bFAT-\w+|\bUAT-\w+|\bPTMLK\//i;

// done / close / hand-back-for-test claims
const DONE_CLAIM = [
  /\b(ready|done)\b[^.\n]{0,30}\b(to|for)\b[^.\n]{0,20}\btest\b/i,
  /\b(only |just )?need (you|u|みや)?\s*to test\b/i,
  /\bI only need (you|u|みや) to test\b/i,
  /\bfix is (done|complete|ready|in place|applied)\b/i,
  /\b(closing|close out|close|wrapped?|wrapping) (the |this )?(ticket|quest)\b/i,
  /\bphase 1 (is )?clos/i,
  /\bready to (commit|close|ship)\b/i,
  /\b(implemented|fixed)\b[^.\n]{0,50}\b(you|みや)?\s*(can |only )?(test|verify)\b/i,
];

// frames that route to abstain (hedge / negation / pending / not-found)
const ABSTAIN = [
  /\bnot (yet )?(done|complete|ready|fixed)\b/i,
  /\bstill (need|needs|pending|open|broken|failing|to)\b/i,
  /\b(could ?n[o']?t|cannot|can'?t|unable to) (find|reproduce|fix|confirm)\b/i,
  /\bHYPOTHESIS\b|\bBA-?Q\b/i,
];

const CRITERIA_TABLE = /CRITERIA COVERAGE/i;
const EVIDENCE_TOKEN = /\b[\w.\\/-]+\.\w{2,5}:\d+\b|server\.?log|mcp__postgres|\bSELECT\b[\s\S]{0,120}\bFROM\b|read-?back|test (passed|confirmed)|みや (confirmed|tested|verified|screenshot)|local_test_confirmed|\[skip-criteria-gate:/i;

const ISSUE_CHECKLIST = /Issue Checklist/i;
const BA_SOURCE = /Description|journal|History|0\. ?Brief|photo|PDF|annotat|red[- ]?box|BA (said|wrote|reported|asked|expects?)/i;

function lastAssistantText(transcriptPath) {
  let raw;
  try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch (_) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj;
    try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
    const msg = obj.message || obj;
    if ((msg.role || obj.type) !== 'assistant') continue;
    const c = msg.content;
    let text = '';
    if (typeof c === 'string') text = c;
    else if (Array.isArray(c)) text = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    if (text.trim()) return text;
  }
  return null;
}

function logFire(action, detail) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail: String(detail).slice(0, 200) }) + '\n'); } catch (_) {}
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) process.exit(0);           // anti-loop, line 1

    const text = lastAssistantText(data.transcript_path || '');
    if (!text || text.length < 300) process.exit(0);      // short reply / ack
    if (EXEMPT.test(text)) process.exit(0);

    const abstain = ABSTAIN.some(re => re.test(text));

    // CHECK A — completeness at a done/close/test-ready claim -> HARD BLOCK
    if (!abstain && TICKET_REF.test(text) && DONE_CLAIM.some(re => re.test(text))) {
      const hasTable = CRITERIA_TABLE.test(text);
      const hasEvidence = EVIDENCE_TOKEN.test(text);
      if (!hasTable || !hasEvidence) {
        logFire('blocked-completeness', hasTable ? 'table-no-evidence' : 'no-table');
        process.stdout.write(JSON.stringify({
          decision: 'block',
          reason: [
            '⛔ ticket-criteria-gate: you are declaring this ticket done / ready-to-test, but the reply has',
            `   ${hasTable ? 'a CRITERIA COVERAGE table with NO evidence token' : 'no CRITERIA COVERAGE table'}.`,
            '   Emit a coverage table listing EVERY BA criterion (latest cycle) with an evidence cell —',
            '   each row backed by file:line / a test result / a DB read-back / みや-confirmed, NEVER a bare ✓:',
            '     | BA criterion (verbatim) | Addressed? | Evidence |',
            '   A criterion you could NOT meet must be written openly (e.g. "not reproduced") — not silently dropped.',
            '   Genuinely not a ticket-done claim? add [skip-criteria-gate: <reason>].',
          ].join('\n'),
        }));
        process.exit(0);
      }
      logFire('passed-completeness', 'table+evidence');
    }

    // CHECK B — checklist-quality at an Issue Checklist emit -> ADVISORY (v1)
    if (ISSUE_CHECKLIST.test(text) && !BA_SOURCE.test(text)) {
      logFire('advisory-checklist', 'no-ba-source');
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'Stop',
          additionalContext: [
            '⚙️  ticket-criteria-gate (ADVISORY): your Issue Checklist cites no BA source.',
            '   Each item MUST trace to a real BA line — Description / journal / History / 0. Brief photo / PDF —',
            '   so the checklist is the ticket\'s actual criteria, not invented or vague items.',
            '   (Advisory in v1; flips to block once validated.)',
          ].join('\n'),
        },
      }));
      process.exit(0);
    }

    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-OPEN
  }
});
