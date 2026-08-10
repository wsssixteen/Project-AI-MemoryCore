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
const STAMPS = path.join(DIR, 'stamps.jsonl');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sqlverify-'));
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
  /\('et_flowable17','act_ru_deadletter_job','proc_inst_id_'\)/.test(out),
  'deadletter+proc_inst_id_ must appear in the VALUES list');

// 2 — the valid sibling ref is surfaced too (no false narrowing)
t('2 valid ref also surfaced',
  /\('et_flowable17','act_ru_task','proc_inst_id_'\)/.test(out),
  'act_ru_task legitimately uses proc_inst_id_');

// 3 — emitted SQL is a runnable catalog check
t('3 emits a pg_attribute check',
  /pg_attribute/.test(out) && /WHERE\s+a\.attname IS NULL/.test(out),
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

// cleanup stamps written by this eval
try {
  const keep = fs.readFileSync(STAMPS, 'utf8').split('\n')
    .filter(l => l && !l.includes('sqlverify-')).join('\n');
  fs.writeFileSync(STAMPS, keep ? keep + '\n' : '');
} catch (_) {}
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}

const passed = results.filter(r => r.pass).length;
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  — ' + r.detail}`);
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
