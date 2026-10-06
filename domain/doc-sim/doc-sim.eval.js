#!/usr/bin/env node
// doc-sim.eval.js — fixtures for the runner, the skill text and the quest awareness rows.
// Replay case: QA-244600 2026-10-05 — a no-edit Word save read as CHANGED, first difference in
// paragraph 91, format only, inside jabatanTeknikalPT.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const RUNNER = path.join(__dirname, 'doc-sim.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-sim-eval-'));
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d: d || '' }); }
function run(args, env) {
  return spawnSync(process.execPath, [RUNNER, ...args], { encoding: 'utf8', timeout: 120000, windowsHide: true, env: Object.assign({}, process.env, { DOC_SIM_LOG: path.join(TMP, 'log.jsonl') }, env || {}) });
}
function jboss(name, datasourceXml) {
  const dir = path.join(TMP, name, 'standalone', 'configuration');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'standalone.xml'), '<server><datasources>' + datasourceXml + '</datasources></server>');
  return path.join(TMP, name);
}
function ds(schema) {
  return '<datasource jndi-name="java:jboss/datasources/etanahDS"><connection-url>jdbc:postgresql://h:1/db?currentSchema=' + schema + '</connection-url></datasource>';
}
function toolHome(name, body) {
  const dir = path.join(TMP, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'tg.ps1'), body);
  return dir;
}

const STG = jboss('jb-stg', ds('et_main_stg2'));
const LIVE = jboss('jb-live', ds('et_main'));
const NODS = jboss('jb-nods', '<datasource jndi-name="java:jboss/datasources/other"><connection-url>x</connection-url></datasource>');
const PID = 'PTMLK/01/L/PPTPB/2026/15';

const CHANGED = [
  '[config] 1 template(s) configured for PPTPBPRMMKNPDT; \'*\' = picked',
  '   * PLP_RSLT_MMKN  <-  TemplateRisalatMMKN_PDT_PPTPB.docx',
  '[gen] PLP_RSLT_MMKN: action CREATE, filled in 22580 ms -> X:\\out\\a__filled.docx',
  '[ERROR] PelupusanTemplateUtil: Something went wrong while populating content-control: fooTag',
  '   someTag    TEXT    TIMEOUT    -  TIMEOUT over 120 s',
  '   note: errors are printed above; a slow tag shows TIMEOUT',
  '[compare] code from BasePelupusanDokumenForm.java @ HEAD (f14c58ae64)',
  '   RESULT: CHANGED -> the system would keep the draft, versi goes up',
  '   differing paragraphs by content control (tag in A): {jabatanTeknikalPT=8, namaJT=2}',
  '   first difference: paragraph 91 -> FORMAT (text is identical)',
  '     A: [b;sz=24;] "9.9.9"',
  '   pasted earlier line: DOC-SIM: something old',
].join('\n');
const SAME = CHANGED.replace(/RESULT: CHANGED[^\n]*/, 'RESULT: SAME -> the system would discard the draft, versi stays').replace(/\n[^\n]*first difference[^\n]*/, '').replace(/\n[^\n]*differing paragraphs by[^\n]*/, '');
const GEN_ONLY = CHANGED.split('\n').slice(0, 3).join('\n');
fs.writeFileSync(path.join(TMP, 'changed.txt'), CHANGED);
fs.writeFileSync(path.join(TMP, 'same.txt'), SAME);
fs.writeFileSync(path.join(TMP, 'gen.txt'), GEN_ONLY);
fs.writeFileSync(path.join(TMP, 'empty.txt'), '');

let r;

// --- argument and guard fixtures (no tool needed) ---
r = run([]);
check('F1 no arguments -> usage, exit 2', r.status === 2 && /usage:/.test(r.stderr), 'exit=' + r.status);
r = run(['gen', '--jboss', STG]);
check('F2 gen without --permohonan -> exit 2', r.status === 2 && /--permohonan is required/.test(r.stderr), 'exit=' + r.status);
r = run(['gen', '--permohonan', "x'; drop table y", '--jboss', STG]);
check('F3 hostile permohonan text refused -> exit 2', r.status === 2 && /not a permohonan id/.test(r.stderr), 'exit=' + r.status);
r = run(['explode', '--permohonan', PID]);
check('F4 unknown mode -> usage, exit 2', r.status === 2, 'exit=' + r.status);
r = run(['gen', '--permohonan', PID, '--jboss', STG, '--template-dir', path.join(TMP, 'nope')]);
check('F5 missing --template-dir -> exit 2', r.status === 2 && /template-dir not found/.test(r.stderr), 'exit=' + r.status);
r = run(['compare', '--a', path.join(TMP, 'same.txt')]);
check('F6 compare with one file -> exit 2', r.status === 2, 'exit=' + r.status);
r = run(['gen', '--permohonan', PID, '--jboss', LIVE, '--dry-run']);
check('F7 non-test schema refused -> exit 3, names the schema', r.status === 3 && /"et_main"/.test(r.stderr) && /refused/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr.slice(0, 120));
r = run(['gen', '--permohonan', PID, '--jboss', LIVE, '--allow-schema', 'et_main_other', '--dry-run']);
check('F8 --allow-schema for a different name does not open the guard', r.status === 3, 'exit=' + r.status);
r = run(['gen', '--permohonan', PID, '--jboss', NODS, '--dry-run']);
check('F9 no etanahDS datasource -> exit 3 with reason', r.status === 3 && /etanahDS not found/.test(r.stderr), 'exit=' + r.status);
r = run(['gen', '--permohonan', PID, '--jboss', path.join(TMP, 'no-such-jboss'), '--dry-run']);
check('F10 missing JBoss home -> exit 3, not a crash', r.status === 3 && /standalone\.xml not found/.test(r.stderr), 'exit=' + r.status);

// --- command mapping (dry-run against a stub tool home) ---
const OK_HOME = toolHome('tool-ok', 'Write-Output @"\n' + CHANGED + '\n"@\nexit 0\n');
r = run(['repro', '--permohonan', PID, '--jboss', STG, '--profile', '--template', 'T.docx', '--dry-run'], { DOC_SIM_HOME: OK_HOME });
check('F11 dry-run maps mode, permohonan, profile, template', r.status === 0 && / repro /.test(r.stdout) && r.stdout.includes('-Permohonan ' + PID) && /-Profile/.test(r.stdout) && /-Template T\.docx/.test(r.stdout) && /schema=et_main_stg2/.test(r.stdout), r.stdout.slice(0, 200));
r = run(['gen', '--permohonan', PID, '--jboss', STG, '--dry-run'], { DOC_SIM_HOME: OK_HOME });
check('F12 dry-run writes no log row', r.status === 0 && !fs.existsSync(path.join(TMP, 'log.jsonl')), 'log exists');
r = run(['gen', '--permohonan', PID, '--jboss', STG, '--dry-run'], { DOC_SIM_HOME: path.join(TMP, 'no-tool') });
check('F13 tool not installed -> exit 4, names the path', r.status === 4 && /tool not found/.test(r.stderr) && /tg\.ps1/.test(r.stderr), 'exit=' + r.status);

// --- summary line ---
r = run(['--parse', path.join(TMP, 'changed.txt'), '--permohonan', PID]);
const lineChanged = (r.stdout || '').trim();
check('F14 replay: CHANGED, paragraph 91, FORMAT, tag names', /^DOC-SIM: /.test(lineChanged) && /compare CHANGED/.test(lineChanged) && /paragraph 91 FORMAT/.test(lineChanged) && /jabatanTeknikalPT=8/.test(lineChanged), lineChanged);
check('F15 summary carries permohonan and template', lineChanged.includes(PID) && /TemplateRisalatMMKN_PDT_PPTPB\.docx/.test(lineChanged), lineChanged);
check('F16 hidden errors and tag timeouts counted; the note line is not a timeout', /1 hidden error\b/.test(lineChanged) && /1 tag timeout\b/.test(lineChanged), lineChanged);
check('F17 summary never repeats document text (no quotes) and is one line', !/"/.test(lineChanged) && lineChanged.split('\n').length === 1, lineChanged);
check('F18 an old DOC-SIM line pasted inside the output does not leak into the new one', (lineChanged.match(/DOC-SIM:/g) || []).length === 1 && !/something old/.test(lineChanged), lineChanged);
r = run(['--parse', path.join(TMP, 'same.txt'), '--permohonan', PID]);
check('F19 SAME verdict, no first-difference part', /compare SAME/.test(r.stdout) && !/first diff/.test(r.stdout), r.stdout.trim());
r = run(['--parse', path.join(TMP, 'gen.txt'), '--permohonan', PID]);
check('F20 fill only -> compare n/a', /compare n\/a/.test(r.stdout) && /fill 22580 ms/.test(r.stdout), r.stdout.trim());
r = run(['--parse', path.join(TMP, 'empty.txt')]);
check('F21 empty output -> honest line, no crash', r.status === 0 && /no template picked/.test(r.stdout) && /fill n\/a/.test(r.stdout), r.stdout.trim());
r = run(['--parse', path.join(TMP, 'missing.txt')]);
check('F22 --parse on a missing file -> exit 2', r.status === 2, 'exit=' + r.status);

// --- real spawn through pwsh against stub tools (skipped where pwsh is absent) ---
const hasPwsh = spawnSync('pwsh', ['-NoProfile', '-Command', 'exit 0'], { windowsHide: true }).status === 0;
if (hasPwsh) {
  r = run(['repro', '--permohonan', PID, '--jboss', STG], { DOC_SIM_HOME: OK_HOME });
  const rows = fs.existsSync(path.join(TMP, 'log.jsonl')) ? fs.readFileSync(path.join(TMP, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  check('F23 real run: exit 0, DOC-SIM line printed last', r.status === 0 && /DOC-SIM: .*compare CHANGED/.test(r.stdout.trim().split('\n').pop()), r.stdout.slice(-200));
  check('F24 real run: one log row with mode, schema, verdict', rows.length === 1 && rows[0].mode === 'repro' && rows[0].schema === 'et_main_stg2' && rows[0].verdict === 'CHANGED' && rows[0].exit === 0, JSON.stringify(rows));
  const BAD_HOME = toolHome('tool-bad', 'Write-Output "[boot] starting"\nexit 7\n');
  r = run(['gen', '--permohonan', PID, '--jboss', STG], { DOC_SIM_HOME: BAD_HOME });
  check('F25 tool failure: exit 1 and the line says FAILED, never a clean verdict', r.status === 1 && /DOC-SIM: FAILED \(exit 7\)/.test(r.stdout), r.stdout.slice(-200));
  const SPACE_HOME = toolHome('tool with space', 'Write-Output "[gen] X: action CREATE, filled in 5 ms -> y"\nexit 0\n');
  r = run(['gen', '--permohonan', PID, '--jboss', STG], { DOC_SIM_HOME: SPACE_HOME });
  check('F26 tool path with a space still runs', r.status === 0 && /fill 5 ms/.test(r.stdout), r.stdout.slice(-200));
  const CMP_HOME = toolHome('tool-cmp', 'Write-Output "[compare] code from PelupusanWordLogUtil.kandungan() @ HEAD (abc1234), compiled whole"\nWrite-Output "   RESULT: SAME -> versi stays"\nexit 0\n');
  fs.writeFileSync(path.join(TMP, 'one.docx'), 'x'); fs.writeFileSync(path.join(TMP, 'two.docx'), 'y');
  r = run(['compare', '--a', path.join(TMP, 'one.docx'), '--b', path.join(TMP, 'two.docx')], { DOC_SIM_HOME: CMP_HOME });
  check('F33 compare mode: line names both files, the verdict and the code ref; no permohonan filler', r.status === 0 && /DOC-SIM: one\.docx vs two\.docx · compare SAME · code PelupusanWordLogUtil/.test(r.stdout) && !/no permohonan/.test(r.stdout), r.stdout.slice(-200));
  const BUILD_HOME = toolHome('tool-build', 'Write-Output "[build] ok (compare: X @ HEAD (abc1234))"\nexit 0\n');
  r = run(['build'], { DOC_SIM_HOME: BUILD_HOME });
  check('F34 build mode: line says build ok with the compare ref', r.status === 0 && /DOC-SIM: build ok \(compare: X @ HEAD/.test(r.stdout), r.stdout.slice(-200));
} else {
  check('F23-F26, F33-F34 pwsh not on this machine (skipped)', true);
}

// --- the skill, the quest rows, the Feature files ---
const skill = fs.readFileSync(path.join(ROOT, '.claude', 'skills', 'doc-sim', 'SKILL.md'), 'utf8');
check('F27 skill has frontmatter name + description with /doc-sim', /^---\s*\nname: doc-sim\s*\n/.test(skill) && /description: .*\/doc-sim/.test(skill), skill.slice(0, 120));
check('F28 skill names the four quest points and the two cases it never covers', /Phase 0/.test(skill) && /Recon/.test(skill) && /[Ff]alsifier/.test(skill) && /hand-back/i.test(skill) && /local_test_confirmed/.test(skill) && /PROD/.test(skill), '');
check('F29 skill has no TODO left from the scaffold', !/TODO/.test(skill), '');
const quest = fs.readFileSync(path.join(ROOT, '.claude', 'skills', 'quest', 'SKILL.md'), 'utf8');
check('F30 quest skill carries the awareness: start line + phase table rows + falsifier pointer', (quest.match(/doc-sim/g) || []).length >= 4 && /Skill: doc-sim/.test(quest) && /DOC-SIM:/.test(quest), 'mentions=' + (quest.match(/doc-sim/g) || []).length);
const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
check('F31 README carries symptom, goal, goal_signal, retention, footprint, state-scoped', ['symptom:', 'goal:', 'goal_signal:', 'retention:', 'footprint:', 'state-scoped:'].every(k => readme.includes(k)), '');
check('F32 NUKE-MARKER present with a rollback recipe', fs.existsSync(path.join(__dirname, 'NUKE-MARKER.md')) && /Rollback/.test(fs.readFileSync(path.join(__dirname, 'NUKE-MARKER.md'), 'utf8')), '');

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* temp cleanup is best effort */ }

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' -> ' + x.d)); }
console.log('\ndoc-sim.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
