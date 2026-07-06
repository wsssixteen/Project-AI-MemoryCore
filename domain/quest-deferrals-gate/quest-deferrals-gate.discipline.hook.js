/**
 * quest-deferrals-gate.discipline.hook.js — Stop hook
 * Power: domain/quest-deferrals-gate/
 *
 * PURPOSE (per みや 2026-07-06, QA-268415 Phase 2 rule-add): at a Phase-2 close-out
 * signal, verify the referenced QA-<n>.md holds a `## Deferred to follow-up` section
 * capturing every deferral surfaced during the quest, each row with a filled Home cell
 * (follow-up ticket / todo entry / queued protocol edit / in-doc note w/ trigger).
 * Silent-drop of a deferral (chat memory only) is exactly what this kills.
 *
 * FIRING: Stop hook, only when the last assistant text contains BOTH a Phase-2
 * close-out signal AND a ticket reference. Fail-OPEN on any parse error.
 *
 * DECISIONS:
 *   - PASS (silent) — signal absent · no ticket ref · qa_doc absent on disk · § Deferred
 *     present with either `_none this quest_` sentinel OR a valid table (all rows have
 *     a non-placeholder Home cell).
 *   - BLOCK — signal present + qa_doc EXISTS + § Deferred missing OR any row's Home
 *     cell empty / TBD / placeholder / <5 chars.
 *
 * BYPASS: `[skip-deferrals-gate: <reason>]` anywhere in text.
 *
 * TEST HOOKS (for eval): if the input JSON contains `_testText` + `_testWorkspaceRoot`,
 * those override transcript-read + workspace-root-walk. Allows fixture-based smoke tests.
 *
 * Log: domain/quest-deferrals-gate/log.jsonl
 *
 * Registration in .claude/settings.json Stop array is pending みや nod after eval passes.
 * Created 2026-07-06 per みや (QA-268415 Phase 1 close-out) — rule + hook shape
 * designed in the same conversation; this file is the implementation.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

const EXEMPT = /\[skip-deferrals-gate:/i;

const PHASE2_SIGNAL = [
  /\/quest-bounty\b/i,
  /\bphase[-\s]?2\b[^\n.]{0,30}\b(clos|arch|harvest|bounty|wrap)/i,
  /\barchive\s+hygiene\b/i,
  /\bactive-cli\.js\s+update[^\n]*status\s*=\s*archived/i,
  /\bactive-cli\.js\s+archive/i,
  /\b\/close-phase\b/i,
  /\bharvest(ing)?\s+(the\s+)?(quest|ticket)/i,
];

const QA_REF = /\b(?:QA[-\s#]?|Ref[-\s#]?|INTERNAL\s+ISSUE\s*#?|ESOKONGAN\s*#?)(\d{4,7})\b/gi;

const DEFERRED_HEADER = /^##\s+Deferred(?:\s+to\s+follow-up)?/im;
const NONE_SENTINEL = /_?none\s+this\s+quest_?/i;
const HOME_PLACEHOLDER = /^(TBD|TBC|later|placeholder|\?+|-+|\.+)$/i;

function checkQaDoc(qaNumber, workspaceRoot) {
  const candidates = [
    path.join(workspaceRoot, 'projects', 'coding-projects', 'active', `QA-${qaNumber}`, `QA-${qaNumber}.md`),
    path.join(workspaceRoot, 'projects', 'coding-projects', 'active', String(qaNumber), `${qaNumber}.md`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try { return { path: p, content: fs.readFileSync(p, 'utf8') }; } catch (_) {}
    }
  }
  return null;
}

function validateDeferred(content) {
  if (!DEFERRED_HEADER.test(content)) {
    return { ok: false, reasons: ['§ Deferred to follow-up section missing'] };
  }
  const sectionMatch = content.match(/##\s+Deferred[^\n]*\n([\s\S]*?)(?=\n##\s+|\n?$)/i);
  if (!sectionMatch) return { ok: false, reasons: ['§ Deferred section unparseable'] };
  const body = sectionMatch[1];

  if (NONE_SENTINEL.test(body)) return { ok: true, reasons: [] };

  const reasons = [];
  const tableRow = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*$/gm;
  let rowCount = 0;
  let m;
  while ((m = tableRow.exec(body)) !== null) {
    const [, col1, deferral, home] = m;
    if (/^[-:]+$/.test(col1.trim()) && /^[-:]+$/.test(deferral.trim())) continue;
    if (/^#$|^Deferral$|^Home$/i.test(col1.trim())) continue;
    if (/^#$|^Deferral$|^Home$/i.test(deferral.trim())) continue;
    rowCount++;
    const homeText = home.trim();
    if (!homeText || HOME_PLACEHOLDER.test(homeText) || homeText.length < 5) {
      const label = deferral.trim().slice(0, 50);
      reasons.push(`Row ${col1.trim()} ("${label}${label.length >= 50 ? '…' : ''}") has empty/placeholder Home cell`);
    }
  }
  if (rowCount === 0) return { ok: false, reasons: ['§ Deferred section has no rows (add table or `_none this quest_`)'] };
  return { ok: reasons.length === 0, reasons };
}

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
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), action, detail: String(detail).slice(0, 300) }) + '\n'); } catch (_) {}
}

function findWorkspaceRoot() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'quest', 'active.txt'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

let input = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) process.exit(0);

    const text = data._testText || lastAssistantText(data.transcript_path || '') || '';
    if (!text || text.length < 40) process.exit(0);
    if (EXEMPT.test(text)) process.exit(0);

    if (!PHASE2_SIGNAL.some(re => re.test(text))) process.exit(0);

    const qaNumbers = new Set();
    let m;
    QA_REF.lastIndex = 0;
    while ((m = QA_REF.exec(text)) !== null) qaNumbers.add(m[1]);
    if (qaNumbers.size === 0) process.exit(0);

    const workspaceRoot = data._testWorkspaceRoot || findWorkspaceRoot();
    if (!workspaceRoot) process.exit(0);

    const gaps = [];
    for (const num of qaNumbers) {
      const doc = checkQaDoc(num, workspaceRoot);
      if (!doc) continue;
      const r = validateDeferred(doc.content);
      if (!r.ok) gaps.push(`QA-${num}: ${r.reasons.join('; ')}`);
    }

    if (gaps.length > 0) {
      logFire('blocked', gaps.join(' | '));
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: [
          '⛔ quest-deferrals-gate: Phase-2 close-out signal detected, but the qa_doc(s)',
          '   fail the deferrals-capture rule (per quest/quest-protocol.md Phase 2):',
          ...gaps.map(g => `   • ${g}`),
          '',
          '   Fix — in each QA-<n>.md, add a `## Deferred to follow-up` section BEFORE',
          '   proceeding with Phase 2. Every table row MUST have a filled Home cell (follow-up',
          '   ticket ID / todo.md entry / queued protocol edit / in-doc note with surfacing trigger).',
          '   If there are genuinely NO deferrals this quest, add the sentinel line: `_none this quest_`',
          '',
          '   Bypass: [skip-deferrals-gate: <reason>].',
        ].join('\n'),
      }));
      process.exit(0);
    }

    logFire('passed', `qa=${Array.from(qaNumbers).join(',')}`);
    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});
