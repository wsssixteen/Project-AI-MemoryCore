/**
 * patch-script-gate.discipline.hook.js — Stop hook
 * Power: domain/patch-script-gate/  (hook-only — no skill, no eval, no trigger)
 *
 * PURPOSE (per みや 2026-06-29, after PROD patch for 0402DIS2025000170 +
 * observing the colleague's `-- 7 rows.` annotation convention):
 *
 * Every patch SCRIPT must end with an expected-outcome annotation — a trailing
 * SQL comment stating expected row count + action verb:
 *     -- 1 row updated
 *     -- 4 rows deleted
 *     -- 2 rows inserted
 *
 * The executor (みや or whoever runs the script) verifies the actual
 * `<n> rows affected` output matches the annotation. Mismatch = STOP (don't
 * commit, surface the discrepancy). Without the annotation, a patch silently
 * affecting 0 rows or 100 rows instead of the intended 1 goes unseen until BA
 * catches it.
 *
 * Pair rule (CLAUDE.md §9, hardened 2026-06-29): ONLY UPDATE WHAT IS REQUIRED
 *   — no `version+1` proactively (even on transactional rows, unless `version`
 *   IS the fix), no audit-column touches, no scope-creep. That part is
 *   semantic, enforced by self-discipline + みや review; this hook only
 *   enforces the mechanical annotation check.
 *
 * TWO checks (advisory v1, per /system-rules R4 — both flip to block once validated):
 *   CHECK 1 — Expected-outcome annotation:
 *   - Reply contains a SQL DML statement (UPDATE … SET / DELETE FROM / INSERT INTO)
 *     inside a fenced code block
 *   - AND lacks `-- N rows {updated|deleted|inserted}` annotation
 *   → ADVISORY: remind to add the annotation + the minimal-footprint rule.
 *
 *   CHECK 2 — Stage-Match Block (added 2026-06-29 per みや methodology refinement):
 *   - Reply contains UPDATE on a transactional/workflow table
 *     (`umm_aplikasi` / `umm_a_*` / `umm_p_*` / `dft_a_*` / `pks_a_*`)
 *   - AND lacks a "Stage-Match" / "stage-match" marker OR an
 *     `⏭ N/A — reference table` token in the same reply
 *   → ADVISORY: remind to emit the 5-step Stage-Match Block before scripting.
 *     Reference tables (`ind_*` / `rjk_*` / `kod_*`) are exempt — they don't
 *     match the transactional-table regex.
 *
 * HONEST CAN / CANNOT:
 *   CAN  (shape ~100%): SQL DML in a fenced block + missing trailing annotation.
 *   CANNOT (correctness): that N is right, the WHERE clause is portable, the
 *           patch is genuinely minimal-footprint. Those need みや's glance.
 *   GUARANTEE: no SILENT patch-script emit. NEVER discovery.
 *
 * SAFETY: stop_hook_active anti-loop (line 1) · fail-OPEN on parse error ·
 *   EXEMPT token + bypass [skip-patch-gate: <reason>].
 * Log: domain/patch-script-gate/log.jsonl.
 *
 * Layer choice (/system-design R7): HOOK-ONLY. No procedure to invoke (no
 *   skill); reliability not yet a question (no eval — fires v1 advisory first);
 *   trigger is mechanical (no front-gate trigger.hook.js needed).
 * Trigger MOMENT (/system-design R8): Stop. Patch scripts emit in any
 *   conversation context — no narrower predicate reliably wraps them, and
 *   UserPromptSubmit can't see the assistant's output.
 *
 * system-audit: registered in settings.json Stop array.
 * Created 2026-06-29 per みや; routed through /system-design + /system-rules.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

const EXEMPT = /\[skip-patch-gate:|═══ ▶ YOUR MOVE|るり結界|Domain Expansion/;

// SQL DML statement inside a fenced code block. The fence-pairing constraint
// (```…```) filters out inline-prose mentions of UPDATE/DELETE/INSERT.
const SQL_DML_IN_FENCE = /```[\w]*\s*[\s\S]*?(\bUPDATE\s+[\w."`]+\s+SET\b|\bDELETE\s+FROM\b|\bINSERT\s+INTO\b)[\s\S]*?```/i;

// Expected-outcome annotation — case-insensitive; allows "row" or "rows";
// covers updated/deleted/inserted (the three みや named).
const OUTCOME_ANNOTATION = /--\s*\d+\s+rows?\s+(updated|deleted|inserted)\b/i;

// UPDATE on a transactional/workflow table inside a fenced code block. Schema-
// prefix optional (et_main / et_main_uat / et_main_stg1 / et_main_mlit / etc).
// Covered prefixes: umm_aplikasi · umm_a_* · umm_p_* · dft_a_* · pks_a_*.
// Reference tables (ind_*, rjk_*, kod_*) intentionally NOT matched — they have
// no workflow stage so Stage-Match Block doesn't apply.
const TXN_TABLE_UPDATE = /```[\w]*\s*[\s\S]*?\bUPDATE\s+(?:[\w]+\.)?(?:umm_aplikasi|umm_a_\w+|umm_p_\w+|dft_a_\w+|pks_a_\w+)\s+SET\b[\s\S]*?```/i;

// Stage-Match marker — either the block heading, or the explicit N/A token.
const STAGE_MATCH_MARKER = /Stage-Match\s+Block|stage-match\s+block|⏭\s*N\/A\s*[—-]?\s*reference\s+table/i;

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
    if (data.stop_hook_active) process.exit(0);          // anti-loop, line 1

    const text = lastAssistantText(data.transcript_path || '');
    if (!text || text.length < 200) process.exit(0);     // short reply / ack
    if (EXEMPT.test(text)) process.exit(0);

    const hasSqlDml = SQL_DML_IN_FENCE.test(text);
    const hasTxnUpdate = TXN_TABLE_UPDATE.test(text);

    if (!hasSqlDml && !hasTxnUpdate) process.exit(0);    // neither check applies

    const advisories = [];

    // CHECK 1 — Expected-outcome annotation (fires on any SQL DML in fence)
    if (hasSqlDml && !OUTCOME_ANNOTATION.test(text)) {
      advisories.push([
        '⚙️  patch-script-gate CHECK 1 — Expected-outcome annotation MISSING.',
        '   Your reply has a SQL UPDATE/DELETE/INSERT patch script with no',
        '   `-- N rows {updated|deleted|inserted}` trailing annotation.',
        '   Per CLAUDE.md §9 rule (5): every patch ends with expected row count + verb:',
        '     -- 1 row updated',
        '     -- 4 rows deleted',
        '     -- 2 rows inserted',
        '   Executor verifies actual `<n> rows affected` matches; mismatch = STOP.',
      ].join('\n'));
      logFire('advisory-no-outcome', 'sql-dml-no-rowcount-annotation');
    }

    // CHECK 2 — Stage-Match Block (fires on transactional-table UPDATE without marker)
    if (hasTxnUpdate && !STAGE_MATCH_MARKER.test(text)) {
      advisories.push([
        '⚙️  patch-script-gate CHECK 2 — Stage-Match Block MISSING.',
        '   Your reply UPDATEs a transactional/workflow table (umm_aplikasi / umm_a_* /',
        '   umm_p_* / dft_a_* / pks_a_*) without a Stage-Match Block in the same reply.',
        '   Per CLAUDE.md §9 rule (4): before scripting, derive the row\'s workflow stage',
        '   from the DB AND locate the code method that writes these columns at that stage.',
        '   Emit a 5-step block:',
        '     1. Row stage      → urusan / current_tugasan / langkah (cite SQL)',
        '     2. Code owner     → Class.method():line (or "no normal forward owner — revert-shape")',
        '     3. Column-match scan → owner writes (A,B,C); patch sets (A,B); gap=C',
        '     4. FK companions  → child rows needing parallel patches (umm_a_tgsn / aliran / audit)',
        '     5. Verdict        → ✓ matches owner | ⚠️ revert-shape | 🚨 mismatch',
        '   Reference table (ind_*/rjk_*/kod_*)? emit "⏭ N/A — reference table" instead.',
      ].join('\n'));
      logFire('advisory-no-stage-match', 'txn-table-update-no-block');
    }

    if (advisories.length === 0) {
      // both checks passed (or neither triggered)
      if (hasSqlDml) logFire('passed-check1', 'sql-dml-with-outcome');
      if (hasTxnUpdate) logFire('passed-check2', 'txn-update-with-stage-match');
      process.exit(0);
    }

    advisories.push('   Also remember: ONLY UPDATE WHAT IS REQUIRED — no `version+1` proactively, no audit-column touches, no scope-creep.');
    advisories.push('   Bypass either check: add [skip-patch-gate: <reason>].');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext: advisories.join('\n\n'),
      },
    }));
    process.exit(0);
  } catch (e) {
    process.exit(0); // fail-OPEN
  }
});
