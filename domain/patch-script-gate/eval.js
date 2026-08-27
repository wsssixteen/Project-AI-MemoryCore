/*
 * eval.js — fixture-driven eval for patch-script-gate (CHECK 1/2/3/4).
 * Spawns the hook against many crafted assistant replies and asserts which
 * advisories fire. Run: node domain/patch-script-gate/eval.js
 * Added 2026-08-10 per みや (goal: "run evals, many scripts, check it creates the type of script").
 */
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOOK = path.resolve(__dirname, 'patch-script-gate.discipline.hook.js');
const TMP = path.resolve(__dirname, '.eval-tmp');
try { fs.mkdirSync(TMP, { recursive: true }); } catch (_) {}
const PAD = ' padding'.repeat(30); // clear the hook's 200-char short-reply guard
const SM = '\nStage-Match Block: revert-shape.'; // satisfies CHECK 2

// Each fixture: reply text + which checks SHOULD fire (c1 outcome, c2 stage-match, c3 broad-LIKE, c4 ind_-delete, c5 display-col, c6 generator-state).
const ANN = '\n-- 1 row updated'; // satisfies CHECK 1 so c5 fixtures isolate CHECK 5
const GEN = '\n-- generator: sis_no_turutan left untouched — gap permanent & expected'; // satisfies CHECK 6 so older fixtures stay isolated
const F = [
  // CHECK 5 — display-column verification (the QA-275009 perihal miss)
  { n: 'ind nama only (THE MISS, c5)', c5: true,  t: "```sql\nUPDATE ind_tgsn SET nama = 'Semakan Minit Bebas' WHERE tgsn_id = 5134754 AND kod = 'SMB';" + ANN + "\n```" },
  { n: 'rjk label only (c5)',          c5: true,  t: "```sql\nUPDATE rjk_negeri SET nama = 'MELAKA' WHERE negeri_id = 4;" + ANN + "\n```" },
  { n: 'ind nama+perihal both (safe)', c5: false, t: "```sql\nUPDATE ind_tgsn SET nama = 'Semakan Minit Bebas', perihal = 'Semakan Minit Bebas' WHERE tgsn_id = 5134754;" + ANN + "\n```" },
  { n: 'ind nama + verify marker',     c5: false, t: "The grid reads perihal — verified.\n```sql\nUPDATE ind_tgsn SET nama = 'Semakan Minit Bebas' WHERE tgsn_id = 5134754;" + ANN + "\n```" },
  { n: 'ind nama + skip-display token', c5: false, t: "```sql\nUPDATE ind_tgsn SET nama = 'X' WHERE tgsn_id = 5134754;" + ANN + "\n```\n[skip-display-col: grid reads nama, grepped xhtml]" },
  { n: 'ind non-label col (turutan)',  c5: false, t: "```sql\nUPDATE ind_tgsn SET turutan = 5 WHERE tgsn_id = 5134754;" + ANN + "\n```" },
  { n: 'umm_a nama (not ref, c5 off)', c5: false, t: "```sql\nUPDATE umm_a_pihak_bkptg SET nama = 'X' WHERE a_pihak_bkptg_id = 1;" + ANN + "\n```\nStage-Match Block: revert-shape." },
  // CHECK 3 — broad LIKE (also c4 because target is ind_*)
  { n: 'DELETE ind LIKE A%',          c3: true,  c4: true, t: "```sql\nDELETE FROM ind_permit_lesen WHERE no_permit_lesen LIKE 'A%';\n-- 3 rows deleted\n```" + SM + GEN },
  { n: 'DELETE ind LIKE %2026',       c3: true,  c4: true, t: "```sql\nDELETE FROM ind_versi_permit_lesen WHERE kod LIKE '%2026';\n-- 1 rows deleted\n```" + SM },
  { n: 'UPDATE umm_a LIKE A% (c3)',   c3: true,  c4: false, t: "```sql\nUPDATE umm_a_permit_lesen SET no_permit_lesen = NULL WHERE no_permit_lesen LIKE 'A%';\n-- 3 rows updated\n```" + SM + GEN },
  // CHECK 4 — ind_ delete even when pinned/safe-looking
  { n: 'DELETE ind pinned (c4 only)', c3: false, c4: true, t: "```sql\nDELETE FROM ind_permit_lesen WHERE no_permit_lesen IN ('A01/2026/2') AND trkh_mula IS NULL;\n-- 1 rows deleted\n```" + SM + GEN },
  { n: 'DELETE ind schema-qual',      c3: false, c4: true, t: "```sql\nDELETE FROM et_main.ind_mklmt_tnh_permit_lesen WHERE permit_lesen_id IN (1,2,3);\n-- 3 rows deleted\n```" + SM },
  { n: 'DELETE ind + skip-ind token', c3: false, c4: false, t: "```sql\nDELETE FROM ind_permit_lesen WHERE no_permit_lesen IN ('A01/2026/2');\n-- 1 rows deleted\n```\n[skip-ind-delete: Aaron approved, true orphan]" + SM + GEN },
  // safe app-side ops — no c3, no c4
  { n: 'UPDATE umm_a pinned',         c3: false, c4: false, t: "```sql\nUPDATE umm_a_permit_lesen SET no_permit_lesen = NULL WHERE no_permit_lesen IN ('A01/2026/2');\n-- 1 rows updated\n```" + SM + GEN },
  // CHECK 6 — generator-state disclosure (the #273461 sis_no_turutan miss)
  { n: 'null no_ NO generator (c6)',  c6: true,  t: "```sql\nUPDATE umm_a_permit_lesen SET no_permit_lesen = NULL, versi_permit_lesen_id = NULL WHERE a_permit_lesen_id IN (15138,15130,15166);\n-- 3 rows updated\n```" + SM },
  { n: 'delete by no_ NO generator',  c6: true,  c4: true, t: "```sql\nDELETE FROM ind_permit_lesen WHERE no_permit_lesen IN ('A01/2026/2','A01/2026/3');\n-- 2 rows deleted\n```" + SM },
  { n: 'null no_ + generator line',   c6: false, t: "```sql\nUPDATE umm_a_permit_lesen SET no_permit_lesen = NULL WHERE a_permit_lesen_id IN (15138);\n-- 1 rows updated\n```" + SM + GEN },
  { n: 'null no_ + skip-gen token',   c6: false, t: "```sql\nUPDATE umm_a_permit_lesen SET no_permit_lesen = NULL WHERE a_permit_lesen_id IN (15138);\n-- 1 rows updated\n```" + SM + "\n[skip-generator-check: value is user-entered, no counter]" },
  { n: 'no_ in WHERE only, UPDATE other col', c6: false, t: "```sql\nUPDATE umm_a_permit_lesen SET version = 2 WHERE no_permit_lesen IN ('A01/2026/2');\n-- 1 rows updated\n```" + SM },
  { n: 'DELETE umm_a (not ind)',      c3: false, c4: false, t: "```sql\nDELETE FROM umm_a_dok_keluaran WHERE aplikasi_id IN (1,2);\n-- 2 rows deleted\n```" + SM },
  // negatives
  { n: 'SELECT ind (no DML delete)',  c3: false, c4: false, t: "```sql\nSELECT * FROM ind_permit_lesen WHERE no_permit_lesen LIKE 'A%';\n```" + PAD },
  { n: 'ind delete in prose only',    c3: false, c4: false, t: "We must never DELETE FROM ind_permit_lesen in a script." + PAD },
  // CHECK 1 — outcome annotation
  { n: 'DELETE umm_a no rowcount',    c1: true,  c3: false, c4: false, t: "```sql\nDELETE FROM umm_a_dok_keluaran WHERE aplikasi_id IN (1);\n```" + SM },
  { n: 'DELETE umm_a with rowcount',  c1: false, c3: false, c4: false, t: "```sql\nDELETE FROM umm_a_dok_keluaran WHERE aplikasi_id IN (1);\n-- 1 row deleted\n```" + SM },
  // CHECK 2 — stage-match on txn UPDATE
  { n: 'txn UPDATE no stage-match',   c2: true,  t: "```sql\nUPDATE umm_a_permit_lesen SET no_permit_lesen = NULL WHERE no_permit_lesen IN ('A01/2026/2');\n-- 1 row updated\n```" + PAD + GEN },
  // nothing / bypass
  { n: 'no sql',                      t: 'A normal reply about the ticket.' + PAD },
  { n: 'bypass patch-gate',           t: "```sql\nDELETE FROM ind_permit_lesen WHERE no_permit_lesen LIKE 'A%';\n```\n[skip-patch-gate: eval]" + PAD },
];

function runHook(text) {
  const tf = path.join(TMP, 'fx.jsonl');
  fs.writeFileSync(tf, JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } }) + '\n');
  try { return execFileSync('node', [HOOK], { input: JSON.stringify({ transcript_path: tf }), encoding: 'utf8' }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

let pass = 0, fail = 0; const rows = [];
for (const f of F) {
  const out = runHook(f.t + PAD);
  const got = { c1: /CHECK 1/.test(out), c2: /CHECK 2/.test(out), c3: /CHECK 3/.test(out), c4: /CHECK 4/.test(out), c5: /CHECK 5/.test(out), c6: /CHECK 6/.test(out) };
  const exp = { c1: !!f.c1, c2: !!f.c2, c3: !!f.c3, c4: !!f.c4, c5: !!f.c5, c6: !!f.c6 };
  const ok = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].every(k => got[k] === exp[k]);
  ok ? pass++ : fail++;
  rows.push(`${ok ? 'PASS' : 'FAIL'}  ${f.n.padEnd(28)}  exp[${['c1','c2','c3','c4','c5','c6'].map(k => k + '=' + (+exp[k])).join(' ')}]  got[${['c1','c2','c3','c4','c5','c6'].map(k => k + '=' + (+got[k])).join(' ')}]`);
}
console.log(rows.join('\n'));
console.log(`\n${pass}/${pass + fail} passed` + (fail ? `  — ${fail} FAILED` : '  — ALL GREEN'));
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(fail ? 1 : 0);
