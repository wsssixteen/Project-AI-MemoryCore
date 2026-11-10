#!/usr/bin/env node
/**
 * eval.js — convention-check-gate fixtures (5 base + the v1.9 DELETE set, 2026-11-10)
 *
 * Runs the hook via spawnSync against temp transcripts. The hook is COPIED into a
 * temp sandbox dir first so eval fires write their log.jsonl in the sandbox, never
 * polluting the real domain/convention-check-gate/log.jsonl.
 *
 * Exit 0 only if every fixture passes.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK_SRC = path.resolve(__dirname, 'convention-check-gate.gate.hook.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ccg-eval-'));
const SANDBOX = path.join(TMP, 'domain', 'convention-check-gate');
fs.mkdirSync(SANDBOX, { recursive: true });
const HOOK = path.join(SANDBOX, 'convention-check-gate.gate.hook.js');
fs.copyFileSync(HOOK_SRC, HOOK);
const SANDBOX_LOG = path.join(SANDBOX, 'log.jsonl');

function writeTranscript(name, content) {
  const p = path.join(TMP, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

function runHook(inputObj) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(inputObj),
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: path.resolve(__dirname, '..', '..') }, // lib resolution for the sandboxed copy (2026-08-21)
  });
  let out = null;
  if (r.stdout && r.stdout.trim()) {
    try { out = JSON.parse(r.stdout); } catch (_) { out = null; }
  }
  return { status: r.status, stdout: r.stdout || '', out };
}

function lastLogAction() {
  try {
    const lines = fs.readFileSync(SANDBOX_LOG, 'utf8').trim().split('\n');
    return JSON.parse(lines[lines.length - 1]).action;
  } catch (_) { return null; }
}

const JAVA_FILE = 'E:\\Projects\\Melaka\\etanah-pelupusan\\src\\main\\java\\my\\gov\\melaka\\MlkMaklumatPajakanForm.java';
const results = [];

// ── Fixture 1: etanah .java Edit + transcript WITHOUT analog citation → deny ──
{
  const t = writeTranscript('t1.txt', 'plain chatter, no citation of anything here.\nStill nothing.\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: JAVA_FILE }, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = !!(hso && hso.permissionDecision === 'deny' &&
    /analog|sibling/i.test(hso.permissionDecisionReason || '') &&
    lastLogAction() === 'blocked');
  results.push({ name: '1. java edit, no citation -> deny (reason mentions analog/sibling)', pass });
}

// ── Fixture 2: same + transcript containing "← sibling MlkFoo.java:123" → allow ──
{
  const t = writeTranscript('t2.txt', 'Per-file sibling-diff: MlkBar.java:88 ← sibling MlkFoo.java:123: attrs ok\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: JAVA_FILE }, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = !!(hso && !hso.permissionDecision &&
    typeof hso.additionalContext === 'string' &&
    hso.additionalContext.includes('convention-check-gate') &&
    lastLogAction() === 'allowed');
  results.push({ name: '2. java edit, "← sibling MlkFoo.java:123" cited -> allow (advisory only)', pass });
}

// ── Fixture 3: same + bypass token → allow ──
{
  // new bypass contract (2026-08-21): token counts only in current-turn ASSISTANT text (JSONL)
  const t = writeTranscript('t3.txt',
    JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'do it' }] } }) + '\n' +
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'audit context. [skip-convention-check: test] proceeding.' }] } }) + '\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: JAVA_FILE }, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = !!(hso && !hso.permissionDecision &&
    typeof hso.additionalContext === 'string' &&
    lastLogAction() === 'allowed');
  results.push({ name: '3. java edit + [skip-convention-check: test] -> allow', pass });
}

// ── Fixture 4: .docx edit → advisory additionalContext present, NO deny ──
{
  const t = writeTranscript('t4.txt', 'no citations here either\n');
  const r = runHook({
    tool_name: 'Edit',
    tool_input: { file_path: 'E:\\Projects\\Melaka\\etanah-pelupusan\\resources\\template\\KertasTemplate.docx' },
    transcript_path: t,
  });
  const hso = r.out && r.out.hookSpecificOutput;
  const pass = !!(hso && !hso.permissionDecision &&
    typeof hso.additionalContext === 'string' &&
    hso.additionalContext.includes('.docx template') &&
    lastLogAction() === 'advisory');
  results.push({ name: '4. .docx edit -> advisory present, no deny', pass });
}

// ── Fixture 5: unmatched file (.md) → silent ──
{
  const t = writeTranscript('t5.txt', 'irrelevant\n');
  const r = runHook({ tool_name: 'Edit', tool_input: { file_path: 'C:\\notes\\README.md' }, transcript_path: t });
  const pass = r.status === 0 && r.stdout.trim() === '';
  results.push({ name: '5. .md edit -> silent (exit 0, no output)', pass });
}

// ── Fixtures 6+: v1.9 DELETE assessed in a .sql patch (288625, script-check rule 4) ──
// why = the expected deny reason in log.jsonl ('proof' | 'truncate' | 'no-where' | 'no-child-check'), or null = not denied.
const SQL_FILE = path.join(TMP, '288625.sql'); // not on disk unless a fixture writes it
const CHILD0 = "SELECT * FROM et_main.umm_a_dok_ruj WHERE dok_keluaran_id IN (11, 12);\n-- 0 rows\n";
function lastLogDetail() {
  try { const l = fs.readFileSync(SANDBOX_LOG, 'utf8').trim().split('\n'); return JSON.parse(l[l.length - 1]).detail || ''; } catch (_) { return ''; }
}
function sqlCase(name, input, why, transcript) {
  const t = writeTranscript('sql-' + results.length + '.txt', transcript || 'no token\n');
  const r = runHook({ ...input, transcript_path: t });
  const hso = r.out && r.out.hookSpecificOutput;
  const denied = !!(hso && hso.permissionDecision === 'deny');
  const pass = why ? (denied && /v1\.9/.test(hso.permissionDecisionReason || '') && lastLogAction() === 'blocked-delete' && lastLogDetail().startsWith(why + ' ')) : !denied;
  results.push({ name, pass });
}
const W = content => ({ tool_name: 'Write', tool_input: { file_path: SQL_FILE, content } });

sqlCase('6. DELETE on umm_aplikasi, pinned id -> deny (proof table)', W("DELETE FROM et_main.umm_aplikasi WHERE id_pengenalan = '02MH1579/2026';\n-- 1 row deleted\n"), 'proof');
sqlCase('7. unlink UPDATE -> not denied', W("UPDATE et_main.umm_aplikasi SET hubungan_aplikasi_id = NULL WHERE id_pengenalan = '02MH1579/2026';\n-- 1 row updated\n"), null);
sqlCase('8. DELETE FROM only inside a -- comment -> not denied', W("-- never DELETE FROM a table here\nUPDATE et_main.umm_aplikasi SET hubungan_aplikasi_id = NULL WHERE aplikasi_id = 1;\n"), null);
sqlCase('9. DELETE on the receipt table hsl_bayaran, child check present -> deny (proof)', W(CHILD0 + "DELETE FROM et_main.hsl_bayaran WHERE bayaran_id IN (5);\n-- 1 row deleted\n"), 'proof');
sqlCase('10. DELETE on registry ind_permit_lesen -> deny (proof)', W(CHILD0 + "DELETE FROM ind_permit_lesen WHERE no_permit_lesen IN ('A01/2026/2');\n-- 1 row deleted\n"), 'proof');
sqlCase('11. DELETE on tkr_log -> deny (log table)', W(CHILD0 + "DELETE FROM et_main.tkr_log WHERE log_id IN (1);\n-- 1 row deleted\n"), 'proof');
sqlCase('12. DELETE on pcp_audit_aktiviti -> deny (audit table)', W(CHILD0 + "DELETE FROM pcp_audit_aktiviti WHERE id IN (1);\n-- 1 row deleted\n"), 'proof');
sqlCase('13. DELETE on umm_sejarah_pengagihan -> deny (history table)', W(CHILD0 + "DELETE FROM umm_sejarah_pengagihan WHERE id IN (1);\n-- 1 row deleted\n"), 'proof');
sqlCase('14. DELETE on md_catalogs ("log" inside a word), child check present -> not denied', W(CHILD0 + "DELETE FROM md_catalogs WHERE id IN (1);\n-- 1 row deleted\n"), null);
sqlCase('15. TRUNCATE -> deny', W("TRUNCATE TABLE et_main.umm_a_dok_keluaran;\n"), 'truncate');
sqlCase('16. DELETE with no WHERE -> deny', W(CHILD0 + "DELETE FROM et_main.umm_a_dok_keluaran;\n-- 9 rows deleted\n"), 'no-where');
sqlCase('17. DELETE on a plain table, no child check above -> deny', W("DELETE FROM et_main.umm_a_dok_keluaran WHERE dok_keluaran_id IN (11, 12);\n-- 2 rows deleted\n"), 'no-child-check');
sqlCase('18. same DELETE with a "-- 0 rows" SELECT above -> not denied', W(CHILD0 + "DELETE FROM et_main.umm_a_dok_keluaran WHERE dok_keluaran_id IN (11, 12);\n-- 2 rows deleted\n"), null);
sqlCase('19. child SELECT says "-- 2 rows" -> deny', W(CHILD0.replace('-- 0 rows', '-- 2 rows') + "DELETE FROM et_main.umm_a_dok_keluaran WHERE dok_keluaran_id IN (11, 12);\n-- 2 rows deleted\n"), 'no-child-check');
sqlCase('20. the "-- 0 rows" SELECT sits AFTER the DELETE -> deny', W("DELETE FROM et_main.umm_a_dok_keluaran WHERE dok_keluaran_id IN (11, 12);\n-- 2 rows deleted\n" + CHILD0), 'no-child-check');
sqlCase('21. "-- 0 rows" on the same line as the SELECT -> not denied', W("SELECT * FROM umm_a_dok_ruj WHERE dok_keluaran_id IN (11); -- 0 rows\nDELETE FROM umm_a_dok_keluaran WHERE dok_keluaran_id IN (11);\n-- 1 row deleted\n"), null);
sqlCase('22. quoted upper-case "ET_MAIN"."UMM_APLIKASI" -> deny (proof)', W(CHILD0 + 'DELETE FROM "ET_MAIN"."UMM_APLIKASI" WHERE aplikasi_id IN (1);\n-- 1 row deleted\n'), 'proof');
sqlCase('23. unpaid fee row hsl_bayaran_fi (not a listed proof table), child check present -> not denied', W(CHILD0 + "DELETE FROM et_main.hsl_bayaran_fi WHERE bayaran_fi_id IN (7);\n-- 1 row deleted\n"), null);
sqlCase('24. fee config hsl_fi_kadar (no module-prefix deny), child check present -> not denied', W(CHILD0 + "DELETE FROM et_main.hsl_fi_kadar WHERE fi_kadar_id IN (7);\n-- 1 row deleted\n"), null);
sqlCase('25. proof-table DELETE + [skip-convention-check] in this turn -> not denied', W("DELETE FROM et_main.umm_aplikasi WHERE aplikasi_id IN (1);\n-- 1 row deleted\n"), null,
  JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'do it' }] } }) + '\n' +
  JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '[skip-convention-check: draft shell, he approved] proceeding.' }] } }) + '\n');
sqlCase('31. "-- 10 rows" is not "-- 0 rows" -> deny', W(CHILD0.replace('-- 0 rows', '-- 10 rows') + "DELETE FROM umm_a_dok_keluaran WHERE dok_keluaran_id IN (11);\n-- 1 row deleted\n"), 'no-child-check');
sqlCase('32. DELETE only inside a /* */ block -> not denied', W("/* DELETE FROM umm_aplikasi; */\nUPDATE umm_a_hkmlk SET flag_aktif = 'N' WHERE a_hkmlk_id IN (3);\n-- 1 row updated\n"), null);
sqlCase('33. child check written as a WITH query -> not denied', W("WITH c AS (SELECT * FROM umm_a_dok_ruj WHERE dok_keluaran_id IN (11)) SELECT * FROM c;\n-- 0 rows\nDELETE FROM umm_a_dok_keluaran WHERE dok_keluaran_id IN (11);\n-- 1 row deleted\n"), null);
sqlCase('34. first DELETE fine, second DELETE on a proof table -> deny (proof)', W(CHILD0 + "DELETE FROM umm_a_dok_keluaran WHERE dok_keluaran_id IN (11);\n-- 1 row deleted\nDELETE FROM umm_a_tgsn WHERE a_tgsn_id IN (9);\n-- 1 row deleted\n"), 'proof');
sqlCase('35. lower-case delete from umm_a_tgsn -> deny (proof)', W(CHILD0 + "delete from umm_a_tgsn where a_tgsn_id in (9);\n-- 1 row deleted\n"), 'proof');
sqlCase('36. "-- 0 rows" after a DELETE statement is not a child check -> deny', W("DELETE FROM umm_a_dok_ruj WHERE dok_keluaran_id IN (99);\n-- 0 rows\nDELETE FROM umm_a_dok_keluaran WHERE dok_keluaran_id IN (11);\n-- 1 row deleted\n"), 'no-child-check');

// Edit fixtures: the gate reads the file as it will be after the Edit.
const E = (file, old_string, new_string) => ({ tool_name: 'Edit', tool_input: { file_path: file, old_string, new_string } });
{
  const f = path.join(TMP, 'e26.sql'); fs.writeFileSync(f, CHILD0 + "-- 0 rows deleted\n");
  sqlCase('26. Edit adds a DELETE under a "-- 0 rows" SELECT already in the file -> not denied', E(f, '-- 0 rows deleted\n', "DELETE FROM umm_a_dok_keluaran WHERE dok_keluaran_id IN (11);\n-- 1 row deleted\n"), null);
}
{
  const f = path.join(TMP, 'e27.sql'); fs.writeFileSync(f, "SELECT * FROM umm_a_dok_keluaran WHERE dok_keluaran_id IN (11);\n-- 1 row\nPLACEHOLDER\n");
  sqlCase('27. Edit adds a DELETE to a file with no "-- 0 rows" SELECT -> deny', E(f, 'PLACEHOLDER\n', "DELETE FROM umm_a_dok_keluaran WHERE dok_keluaran_id IN (11);\n-- 1 row deleted\n"), 'no-child-check');
}
sqlCase('28. Edit on a file not on disk, DELETE on a plain table -> not denied (child check needs the whole file)', E(path.join(TMP, 'missing28.sql'), 'x', "DELETE FROM umm_a_dok_keluaran WHERE dok_keluaran_id IN (11);\n-- 1 row deleted\n"), null);
sqlCase('29. Edit on a file not on disk, DELETE on a proof table -> deny (proof)', E(path.join(TMP, 'missing29.sql'), 'x', "DELETE FROM umm_aplikasi WHERE aplikasi_id IN (1);\n-- 1 row deleted\n"), 'proof');
{
  const f = path.join(TMP, 'e30.sql'); fs.writeFileSync(f, "DELETE FROM umm_aplikasi WHERE aplikasi_id IN (1);\n-- 1 row deleted\n");
  sqlCase('30. Edit replaces a proof-table DELETE with an unlink UPDATE -> not denied', E(f, "DELETE FROM umm_aplikasi WHERE aplikasi_id IN (1);\n-- 1 row deleted\n", "UPDATE umm_aplikasi SET hubungan_aplikasi_id = NULL WHERE aplikasi_id IN (1);\n-- 1 row updated\n"), null);
}
{
  const f = path.join(TMP, 'e37.sql'); fs.writeFileSync(f, "DELETE FROM umm_aplikasi WHERE aplikasi_id IN (1);\n-- 1 row deleted\nSELECT 1;\n-- 1 row\n");
  sqlCase('37. Edit of another line in a file that still holds a proof-table DELETE -> deny (proof)', E(f, 'SELECT 1;', 'SELECT 2;'), 'proof');
}

// ── Report ──
let failed = 0;
for (const r of results) {
  console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.name);
  if (!r.pass) failed++;
}
console.log('---');
console.log('convention-check-gate eval: ' + (results.length - failed) + '/' + results.length);

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed === 0 ? 0 : 1);
