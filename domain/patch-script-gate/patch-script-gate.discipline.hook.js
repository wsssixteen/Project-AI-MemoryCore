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
 * SEVEN checks (1-6 advisory v1, per /system-rules R4 — flip to block once validated;
 *   CHECK 7 BLOCKS from birth, 2026-09-03 per みや #277346: the infra handoff fence must hold
 *   the DML + `-- N rows …` ONLY — a file header / before-SELECT inside it = wrong artifact):
 *   CHECK 6 — generator-state disclosure (added 2026-08-26 per みや, #273461 deep-audit): a patch
 *     releasing a generated identifier (SET no_* = NULL, or DELETE keyed by a no_* value) must
 *     name the generator counter + its disposition; bypass [skip-generator-check: <reason>].
 *   CHECK 3 — reviewer-obvious safe: broad LIKE '%' in a handed DELETE/UPDATE → recommend
 *     pinned IN ('v1','v2',…) + a leading BEFORE SELECT (added 2026-08-10 per みや, #273461).
 *   CHECK 4 — never delete registry/master ind_* tables (an ind_ row = succeeded to daftar,
 *     permanent; Aaron #273461). Fires on DELETE FROM ind_*; bypass [skip-ind-delete: <reason>].
 *   Eval: node domain/patch-script-gate/eval.js (15 fixtures, all green 2026-08-10).
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

// CHECK 3 — reviewer-obvious safe (added 2026-08-10 per みや, #273461 delete audit).
// A handed DELETE/UPDATE whose target WHERE uses a broad LIKE '...%' pattern READS as
// unsafe to a reviewer even when logically bounded. Safe-by-construction that reads as
// safe (pinned IN ('v1','v2',…) + a leading BEFORE SELECT) beats safe-by-prior-check.
const BROAD_LIKE_IN_DML = /```[\w]*\s*[\s\S]*?(?:\bDELETE\s+FROM\b|\bUPDATE\s+[\w."`]+\s+SET\b)[\s\S]*?\bLIKE\s+'[^']*%[^']*'[\s\S]*?```/i;

// CHECK 4 — never delete registry/master tables (added 2026-08-10 per みや, #273461 / Aaron).
// An `ind_*` row = a record that succeeded to daftar and is PERMANENT; deleting it destroys
// registered data with almost no legitimate reason. Fires on a DELETE FROM ind_* in a fence.
const DELETE_FROM_IND = /```[\w]*\s*[\s\S]*?\bDELETE\s+FROM\s+(?:[\w]+\.)?ind_[\w]+/i;
const IND_DELETE_EXEMPT = /\[skip-ind-delete:/;

// CHECK 5 — display-column verification (added 2026-08-18 per みや, QA-275009 PT perihal miss).
// A LABEL-column UPDATE on a reference table (ind_*/rjk_*/kod_*) is meant to fix what a user
// SEES. Reference rows often carry SIBLING label columns (nama AND perihal), and the screen /
// report may render a DIFFERENT one than you set — patch the wrong column and nothing changes.
// Fires on UPDATE <ind_|rjk_|kod_> SET <nama|perihal|keterangan|tajuk|label> in a fence.
const REF_LABEL_UPDATE = /```[\w]*\s*[\s\S]*?\bUPDATE\s+(?:[\w]+\.)?(?:ind_|rjk_|kod_)\w+\s+SET\b[\s\S]*?\b(?:nama|perihal|keterangan|tajuk|label)\s*=/i;
// Suppress when the reply proves the read-column was verified, or names the [skip] token.
const DISPLAY_VERIFY_MARKER = /\[skip-display-col:|display column|which column the (?:ui|screen|grid|report)|grid reads|ui reads|report reads|renders?\s+`?(?:nama|perihal)/i;
// Suppress when BOTH sibling labels are set together (the safe form — no wrong-column risk).
const BOTH_LABELS_SET = /\bSET\b[\s\S]*?\bnama\s*=[\s\S]*?\bperihal\s*=|\bSET\b[\s\S]*?\bperihal\s*=[\s\S]*?\bnama\s*=/i;

// CHECK 6 — generator-state disclosure (added 2026-08-26 per みや, #273461 deep-audit).
// A patch that RELEASES a system-generated identifier (nulls a no_* column, or deletes rows
// keyed by a no_* value) touches only the ROWS — the GENERATOR that minted the value can be a
// separate counter (sis_no_turutan pattern: linked by a convention-built kod string, NO shared
// column — invisible to FK/column-name sweeps). Deleting rows never rolls the counter back.
// The reply must NAME the generator + its disposition (left untouched / rolled back + collision
// analysis) — or declare the column has no generator via the skip token.
const GENERATED_ID_RELEASE = /```[\w]*\s*[\s\S]*?(?:\bUPDATE\b[\s\S]*?\bSET\b[\s\S]*?\bno_\w+\s*=\s*NULL|\bDELETE\s+FROM\b[\s\S]*?\bno_\w+\b)[\s\S]*?```/i;
const GENERATOR_MARKER = /--\s*generator\s*:|sis_no_turutan|\bno_turutan\b|\[skip-generator-check:/i;

// CHECK 7 — infra HANDOFF block shape (added 2026-09-03 per みや, #277346 — BLOCKS).
// The chat message handed to infra ("Hi infra, please assist…") is a DIFFERENT artifact from
// the `.sql` file in the Task folder. The MESSAGE carries the DML statement(s) + `-- N rows …`
// ONLY. The file's 4-line header (`-- Ticket/Env/Permohonan/Fix`) and the before-SELECT belong
// to the FILE (shown in its own review section), never inside the handoff fence.
// Evaluated BEFORE the EXEMPT early-exit: the miss happened inside a ▶ YOUR MOVE hand-back.
const HANDOFF_GREETING = /Hi infra,?\s+please assist/i;
const HANDOFF_EXEMPT = /\[skip-handoff-shape:/;
const HANDOFF_HEADER = /^\s*--\s*(?:Ticket|Env|Permohonan|Fix)\s*:/im;
function handoffFenceDefect(text) {
  const g = HANDOFF_GREETING.exec(text);
  if (!g) return null;
  const fence = /```[\w]*[ \t]*\r?\n([\s\S]*?)```/.exec(text.slice(g.index));
  if (!fence) return null;
  const body = fence[1];
  const header = HANDOFF_HEADER.test(body);
  const dmlIdx = body.search(/\b(?:UPDATE|DELETE|INSERT)\b/i);
  const selIdx = body.search(/\bSELECT\b/i);
  const selectFirst = selIdx >= 0 && (dmlIdx < 0 || selIdx < dmlIdx);
  if (!header && !selectFirst) return null;
  return { header, selectFirst };
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

    // CHECK 7 — infra handoff block shape (BLOCK; runs before EXEMPT so ▶ YOUR MOVE can't mask it)
    const hd = HANDOFF_EXEMPT.test(text) ? null : handoffFenceDefect(text);
    if (hd) {
      logFire('block-handoff-shape', (hd.header ? 'header-in-handoff ' : '') + (hd.selectFirst ? 'select-before-dml' : ''));
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: [
          '⛔ patch-script-gate CHECK 7 — infra HANDOFF block has the wrong shape.',
          '   The "Hi infra, please assist" message carries ONLY the DML statement(s) + `-- N rows …`.',
          hd.header ? '   ✗ found a file header (`-- Ticket:` / `-- Env:` / `-- Permohonan:` / `-- Fix:`) inside the handoff fence.' : '',
          hd.selectFirst ? '   ✗ found a SELECT before the DML inside the handoff fence (the before-SELECT belongs to the .sql FILE only).' : '',
          '   Two artifacts, two sections, two formats (みや 2026-09-03, #277346):',
          '     1. `<ticket>.sql` in 2. Fix\\ — 4-line header + before-SELECT + DML; show it in ITS OWN review section.',
          '     2. Handoff message — greeting · `#<ticket>: <one sentence>` · fence with the DML + `-- N rows updated` and nothing else.',
          '   Bypass: [skip-handoff-shape: <reason>].',
        ].filter(Boolean).join('\n'),
      }));
      process.exit(0);
    }

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

    // CHECK 3 — reviewer-obvious safe (broad LIKE '%' in a handed DELETE/UPDATE)
    if (BROAD_LIKE_IN_DML.test(text)) {
      advisories.push([
        '⚙️  patch-script-gate CHECK 3 — reviewer-obvious safe.',
        '   Your DELETE/UPDATE targets rows with a broad `LIKE \'...%\'` pattern — it reads as',
        '   UNSAFE to a reviewer even when logically bounded (per みや, #273461). A critical/PROD',
        '   script must LOOK safe at a glance, like readable code — safe-by-construction beats',
        '   safe-by-prior-check.',
        '   Rewrite to:',
        '     1. pinned named values → WHERE <col> IN (\'v1\',\'v2\',\'v3\')  (not LIKE \'x%\')',
        '     2. a leading BEFORE SELECT that shows the exact rows before any mutation',
        '     3. simple readable guards; do not bury safety in an opaque NOT IN (SELECT …)',
        '   Ref: feedback_readable_safe_script.md.',
      ].join('\n'));
      logFire('advisory-broad-like', 'dml-broad-like-not-pinned');
    }

    // CHECK 4 — never delete registry/master ind_* tables (pillar)
    if (DELETE_FROM_IND.test(text) && !IND_DELETE_EXEMPT.test(text)) {
      advisories.push([
        '⚙️  patch-script-gate CHECK 4 — 🚨 DELETE on an ind_* (registry/master) table.',
        '   An `ind_*` row = a record that succeeded to daftar and is PERMANENT (Aaron, #273461).',
        '   Deleting `ind_permit_lesen` / any `ind_*` destroys registered data — almost NEVER correct.',
        '   Do NOT delete it. If the accidental-shell case truly needs it, confirm with a senior dev',
        '   AND use the pinned + `trkh_mula IS NULL` + orphan-guarded form, then bypass with',
        '   [skip-ind-delete: <reason + who approved>].',
        '   Default: reset the application side (umm_a_*) only; leave the registry intact.',
      ].join('\n'));
      logFire('advisory-ind-delete', 'delete-from-ind-registry');
    }

    // CHECK 5 — display-column verification (label UPDATE on a reference table)
    if (REF_LABEL_UPDATE.test(text) && !DISPLAY_VERIFY_MARKER.test(text) && !BOTH_LABELS_SET.test(text)) {
      advisories.push([
        '⚙️  patch-script-gate CHECK 5 — display-column verification.',
        '   You UPDATE a LABEL column (nama/perihal/keterangan/tajuk) on a reference table',
        '   (ind_*/rjk_*/kod_*). The screen/report may read a DIFFERENT text column than the',
        '   one you set — reference rows often carry sibling labels (nama AND perihal), and',
        '   patching the wrong one changes NOTHING on screen (QA-275009: patched nama, grid read perihal).',
        '   Before handing this patch:',
        '     1. Confirm WHICH column the UI/report renders — grep the xhtml/bean/jrxml for the',
        '        field, OR match the exact on-screen string to the column whose value equals it.',
        '     2. Align sibling label columns (set nama AND perihal together) unless you have',
        '        PROVEN only one is read.',
        '     3. Reference tables are cached — a raw UPDATE needs a full app restart to show.',
        '   Bypass: [skip-display-col: <which column the UI reads + how verified>].',
      ].join('\n'));
      logFire('advisory-display-col', 'ref-label-update-unverified-column');
    }

    // CHECK 6 — generator-state disclosure (release of a generated identifier)
    if (GENERATED_ID_RELEASE.test(text) && !GENERATOR_MARKER.test(text)) {
      advisories.push([
        '⚙️  patch-script-gate CHECK 6 — generator-state disclosure MISSING.',
        '   Your patch RELEASES a system-generated identifier (nulls a no_* column, or deletes',
        '   rows keyed by a no_* value). The rows are only half the state: the GENERATOR that',
        '   minted the value is a separate counter that does NOT roll back when rows are deleted',
        '   (#273461: sis_no_turutan, linked by a convention-built kod string — no shared column,',
        '   invisible to FK/column-name sweeps).',
        '   Before handing this patch, answer: WHERE is this value born, and WHAT remembers how',
        '   far the sequence has advanced? Then state the disposition in the script:',
        '     -- generator: <table> kod \'<key>\' left untouched — gap permanent & expected',
        '   or, if rolling it back, include the collision analysis (live numbers above the target).',
        '   No generator behind this column? Bypass: [skip-generator-check: <why none exists>].',
      ].join('\n'));
      logFire('advisory-generator-state', 'generated-id-release-no-disclosure');
    }

    if (advisories.length === 0) {
      // all checks passed (or none triggered)
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
