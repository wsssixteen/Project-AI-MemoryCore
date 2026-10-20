#!/usr/bin/env node
/**
 * eval.js — behavioural eval for sql-schema-verify (verifier + Stop gate).
 *
 * Anchor case: ESOKONGAN #274510, 2026-08-07. A hand-off .sql used `proc_inst_id_` on
 * act_ru_deadletter_job / act_ru_job / act_ru_timer_job / act_ru_suspended_job, whose real
 * column is `process_instance_id_`. Infra's run died on the first of those statements.
 *
 * Expected result: the verifier surfaces those refs for catalog checking, and the gate
 * refuses to end a turn while such a file sits unverified.
 *
 * Run: node domain/sql-schema-verify/eval.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const DIR = __dirname;
const VERIFIER = path.join(DIR, 'sql-schema-verify.js');
const GATE = path.join(DIR, 'sql-schema-verify.check.hook.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlverify-'));

// Isolate the eval from the real shared store: point every child at a throwaway store.
// (Children inherit process.env, so stamp/check/gate all agree on this location.)
process.env.SQL_SCHEMA_VERIFY_STORE = path.join(tmp, 'eval-stamps.jsonl');
const taskDir = path.join(tmp, '99. ESOKONGAN #274510 - eval');
fs.mkdirSync(taskDir, { recursive: true });

const BROKEN = `SELECT * FROM et_flowable17.act_ru_deadletter_job WHERE proc_inst_id_ IN ('17555001');
SELECT * FROM et_flowable17.act_ru_task WHERE proc_inst_id_ IN ('17555001');
`;
const FIXED = `SELECT * FROM et_flowable17.act_ru_deadletter_job WHERE process_instance_id_ IN ('17555001');
SELECT * FROM et_flowable17.act_ru_task WHERE proc_inst_id_ IN ('17555001');
`;

const sqlFile = path.join(taskDir, 'evidence-eval.sql');
const results = [];
function t(name, pass, detail) { results.push({ name, pass, detail }); }

function emit(file) {
  return execFileSync(process.execPath, [VERIFIER, 'emit', file], { encoding: 'utf8' });
}
function checkExit(file) {
  return spawnSync(process.execPath, [VERIFIER, 'check', file], { encoding: 'utf8' }).status;
}
function runGate(files) {
  const transcript = path.join(tmp, 'transcript.jsonl');
  fs.writeFileSync(transcript, files.map(f =>
    JSON.stringify({ tool_name: 'Write', tool_input: { file_path: f } })).join('\n'));
  const r = spawnSync(process.execPath, [GATE], {
    input: JSON.stringify({ transcript_path: transcript }), encoding: 'utf8',
  });
  return { status: r.status, err: r.stderr || '' };
}

// 1 — parser surfaces the exact ref that broke infra's run
fs.writeFileSync(sqlFile, BROKEN);
let out = emit(sqlFile);
t('1 broken ref surfaced for checking',
  /\(\d+,'et_flowable17','act_ru_deadletter_job','proc_inst_id_'\)/.test(out),
  'deadletter+proc_inst_id_ must appear in the VALUES list');

// 2 — the valid sibling ref is surfaced too (no false narrowing)
t('2 valid ref also surfaced',
  /\(\d+,'et_flowable17','act_ru_task','proc_inst_id_'\)/.test(out),
  'act_ru_task legitimately uses proc_inst_id_');

// 3 — emitted SQL is a runnable catalog check
t('3 emits a pg_attribute check',
  /pg_attribute/.test(out) && /HAVING NOT bool_or\(col_ok\)/.test(out) && /'missing table'/.test(out),
  'must return only MISSING refs');

// 4 — unstamped file fails check
t('4 unstamped file fails check', checkExit(sqlFile) === 1, 'exit 1 expected');

// 5 — gate BLOCKS while unverified
let g = runGate([sqlFile]);
t('5 gate blocks unverified hand-off sql',
  g.status === 2 && /sql-schema-verify/.test(g.err), `status=${g.status}`);

// 6 — stamping makes check pass
execFileSync(process.execPath, [VERIFIER, 'stamp', sqlFile, 'mlkstg1-pg'], { stdio: 'pipe' });
t('6 stamped file passes check', checkExit(sqlFile) === 0, 'exit 0 expected');

// 7 — gate passes once stamped
g = runGate([sqlFile]);
t('7 gate passes verified file', g.status === 0, `status=${g.status}`);

// 8 — editing after stamping re-arms the gate (hash binding)
fs.writeFileSync(sqlFile, FIXED);
t('8 stamp invalidated by edit', checkExit(sqlFile) === 1, 'content hash must re-arm');

// 9 — gate blocks again after the edit
g = runGate([sqlFile]);
t('9 gate re-blocks after edit', g.status === 2, `status=${g.status}`);

// 10 — non-Task .sql is out of scope (no false positives on repo scripts)
const looseSql = path.join(tmp, 'migration.sql');
fs.writeFileSync(looseSql, FIXED);
g = runGate([looseSql]);
t('10 non-Task sql ignored', g.status === 0, `status=${g.status}`);

// 11 — REGRESSION (2026-08-28): a stamp written from one git checkout must be honoured by a
// check run from a DIFFERENT checkout of the same repo. The store used to live inside each
// checkout, so a stamp in worktree A was invisible to the Stop hook in worktree B and the gate
// re-fired forever. Build a fake main-checkout + worktree sharing one .git common dir, copy the
// verifier into each, stamp via the worktree copy, and check via the main copy.
(function crossCheckout() {
  const repo = path.join(tmp, 'repo');                 // the "main" checkout
  const git = path.join(repo, '.git');                 // the shared common dir
  const wtGit = path.join(git, 'worktrees', 'wt');
  const wt = path.join(tmp, 'wt');                      // the "worktree" checkout
  const mainVerifier = path.join(repo, 'domain', 'sql-schema-verify', 'sql-schema-verify.js');
  const wtVerifier = path.join(wt, 'domain', 'sql-schema-verify', 'sql-schema-verify.js');
  for (const p of [path.dirname(mainVerifier), path.dirname(wtVerifier), wtGit]) fs.mkdirSync(p, { recursive: true });
  const src = fs.readFileSync(VERIFIER);
  fs.writeFileSync(mainVerifier, src);
  fs.writeFileSync(wtVerifier, src);
  fs.writeFileSync(wtGit + '/commondir', '../..');     // git points a worktree's gitdir at the common .git
  fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${wtGit}`);

  // A Task-folder .sql at a stable absolute path both invocations agree on.
  const taskSql = path.join(tmp, '77. TASK #999 - cross-checkout', '2. Fix', 'x-999.sql');
  fs.mkdirSync(path.dirname(taskSql), { recursive: true });
  fs.writeFileSync(taskSql, FIXED);

  // Env WITHOUT the store override, so each child resolves its store via the git common dir.
  const env = { ...process.env }; delete env.SQL_SCHEMA_VERIFY_STORE;
  execFileSync(process.execPath, [wtVerifier, 'stamp', taskSql, 'mlkstg1-pg'], { stdio: 'pipe', env });
  const status = spawnSync(process.execPath, [mainVerifier, 'check', taskSql], { encoding: 'utf8', env }).status;
  t('11 stamp in one checkout is honoured by a check in another (shared store)',
    status === 0, `cross-checkout check exit=${status} (expected 0)`);
})();

// 12-16 — v2 (2026-10-20, #285680): unqualified miya scripts + kod-subquery statements.
const MIYA = `SELECT a_tgsn_id, flag_aktif FROM umm_a_tgsn
WHERE aplikasi_id = (SELECT aplikasi_id FROM umm_aplikasi WHERE id_pengenalan = 'PTMLK/02/L/PRBB/2026/9');
SELECT * FROM umm_aplikasi WHERE id_pengenalan = 'X';
`;
const miyaFile = path.join(taskDir, '285680-check.sql');
fs.writeFileSync(miyaFile, MIYA);
let r12 = spawnSync(process.execPath, [VERIFIER, 'emit', miyaFile], { encoding: 'utf8' });
t('12 unqualified script is accepted (v1 refused it)', r12.status === 0, `exit=${r12.status} ${r12.stderr}`);
t('13 unqualified tables default to et_main',
  /\(1,'et_main','umm_a_tgsn','flag_aktif'\)/.test(r12.stdout) && /checked in: et_main/.test(r12.stdout), r12.stdout.slice(0, 200));
let r14 = spawnSync(process.execPath, [VERIFIER, 'emit', miyaFile, 'et_main_stg1'], { encoding: 'utf8' });
t('14 schema argument is used for unqualified tables', /\(2,'et_main_stg1','umm_aplikasi',NULL\)/.test(r14.stdout), r14.stdout.slice(0, 200));
t('15 kod-subquery: both tables of statement 1 carry the same statement number (a column passes on either)',
  /\(1,'et_main','umm_a_tgsn','id_pengenalan'\)/.test(r12.stdout) && /\(1,'et_main','umm_aplikasi','id_pengenalan'\)/.test(r12.stdout)
  && /GROUP\s+BY st, col HAVING NOT bool_or/.test(r12.stdout), 'statement grouping missing');
let r16 = spawnSync(process.execPath, [VERIFIER, 'emit', miyaFile, 'et_main;drop'], { encoding: 'utf8' });
t('16 a schema argument that is not a plain name is refused', r16.status === 1, `exit=${r16.status}`);
const noTable = path.join(taskDir, 'no-table.sql');
fs.writeFileSync(noTable, 'SELECT 1;\n');
let r17 = spawnSync(process.execPath, [VERIFIER, 'emit', noTable], { encoding: 'utf8' });
t('17 a file with no table still exits 1 with a reason', r17.status === 1 && /No table found/.test(r17.stderr), r17.stderr);
g = runGate([miyaFile]);
t('18 gate still blocks an unstamped unqualified script and names the schema argument (effect check)',
  g.status === 2 && /\[schema\]/.test(g.err), `status=${g.status}`);

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}

const passed = results.filter(r => r.pass).length;
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  — ' + r.detail}`);
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
