#!/usr/bin/env node
// pena.eval.js — fixtures for the writing-style engine (lib/pena.js).
// Replay case: #279554 2026-10-08, five correction rounds on one Redmine mapping note.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ENGINE = path.join(ROOT, 'lib', 'pena.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pena-eval-'));
for (const f of ['modules.json', 'profiles.json', 'corpus.jsonl', 'keywords.jsonl']) fs.copyFileSync(path.join(__dirname, f), path.join(TMP, f));
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d: d || '' });
const run = (a, dir) => spawnSync(process.execPath, [ENGINE, ...a], { encoding: 'utf8', timeout: 30000, windowsHide: true, env: Object.assign({}, process.env, { PENA_DIR: dir || TMP }) });
const draft = (name, text) => { const f = path.join(TMP, name); fs.writeFileSync(f, text); return f; };
const has = (r, mod) => new RegExp('\\[' + mod + '\\] line').test(r.stdout);

const FINAL = [
  'Salam Anis,', '', 'Mapping as below. Start from No. Permit.', '',
  'One No. Permit can have more than one row. Ganti Hari, Tambah Kuantiti and PDBB in progress carry the same number.',
  'The earliest row (created_date) is the original permit.', 'Use its aplikasi_id for the tables below.', '',
  '*1. Rekod Permohonan*', '', '|_. Field |_. Table |_. Column |', '| No. Permit | umm_a_permit_lesen | no_permit_lesen |', '',
  '*Scripts*', '', '1. Rekod Permohonan', '<pre>',
  'SELECT no_permit_lesen, trkh_mula, aplikasi_id, created_date', 'FROM umm_a_permit_lesen', "WHERE no_permit_lesen = 'C01/2026/20'", 'ORDER BY created_date;', '',
  'SELECT nama, flag_pemohon', 'FROM umm_a_pihak_bkptg', "WHERE flag_pemohon = 'Y'",
  "AND aplikasi_id = (SELECT aplikasi_id FROM umm_a_permit_lesen WHERE no_permit_lesen = 'C01/2026/20' ORDER BY created_date LIMIT 1);",
  '</pre>', '', 'Thank you.'
].join('\n');
const P = 'redmine-dev-mapping';

// --- replay: the accepted note is clean, each rejected round is caught ---
let r = run(['check', '--profile', P, '--file', draft('final.txt', FINAL)]);
check('01 replay: the note he accepted passes', r.status === 0 && /0 finding/.test(r.stdout), r.stdout);
check('02 the PENA line names the profile (goal signal)', /^PENA: profile=redmine-dev-mapping/.test(r.stdout), r.stdout);
check('03 proven is listed as a by-hand question, never auto-passed', /\[proven\] by hand:/.test(r.stdout), r.stdout);

r = run(['check', '--profile', P, '--file', draft('r1.txt', FINAL.replace('Start from No. Permit.', 'Everything starts from the No. Permit.'))]);
check('04 round 1: lead-in "Everything starts" caught by lean', r.status === 1 && has(r, 'lean'), r.stdout);

r = run(['check', '--profile', P, '--file', draft('r2.txt', FINAL.replace(/\|_\. Field[^\n]*\n[^\n]*\n/, '   Table  : umm_a_permit_lesen\n   Column : no_permit_lesen\n'))]);
check('05 round 2: Table/Column label lines with no table caught by table', r.status === 1 && has(r, 'table'), r.stdout);

const jammed = FINAL.replace('*Scripts*', '<pre>\nSELECT nama\nFROM umm_a_pihak_bkptg;\n</pre>\n\n*2. Maklumat Tanah*\n\n|_. Field |_. Table |_. Column |\n| Daerah | umm_a_permohonan_tnh | daerah_id |\n\n*Scripts*');
r = run(['check', '--profile', P, '--file', draft('r3.txt', jammed)]);
check('06 round 2: a script between two mapping tables caught by separate', r.status === 1 && has(r, 'separate'), r.stdout);

r = run(['check', '--profile', P, '--file', draft('r4.txt', FINAL.replace('SELECT nama, flag_pemohon', 'SELECT *'))]);
check('07 round 3: SELECT * caught by script', r.status === 1 && has(r, 'script') && /SELECT \*/.test(r.stdout), r.stdout);

r = run(['check', '--profile', P, '--file', draft('r5.txt', FINAL.replace("SELECT nama, flag_pemohon\nFROM umm_a_pihak_bkptg\nWHERE flag_pemohon = 'Y'", "SELECT nama, flag_pemohon FROM umm_a_pihak_bkptg WHERE flag_pemohon = 'Y'"))]);
check('08 round 4: a whole script on one line caught by script', r.status === 1 && /one clause per line/.test(r.stdout), r.stdout);

// --- line module ---
r = run(['check', '--module', 'line', '--text', 'This is one fact here. This is a second fact here. This is a third fact here.']);
check('09 three sentences on one line caught', r.status === 1 && has(r, 'line'), r.stdout);
r = run(['check', '--module', 'line', '--text', 'One No. Permit can have more than one row. Ganti Hari and PDBB reuse the same number.']);
check('10 two related sentences on one line pass ("No." is not a sentence end)', r.status === 0, r.stdout);
r = run(['check', '--module', 'line', '--text', 'Have altered PTMLK/01/L/PLPS/2026/3 and PTMLK/01/L/PLPS/2026/4 and PTMLK/01/L/PLPS/2026/5 to the tugasan']);
check('11 three ids inside one sentence caught', r.status === 1 && /3 or more ids/.test(r.stdout), r.stdout);
r = run(['check', '--module', 'line', '--text', 'Config sudah merujuk templat ini jadi bila Tidak Boleh Dipertimbangkan atau Tolak dan pemohon ada pemilikan tanah sistem akan papar ralat tidak boleh load file itu']);
check('12 long sentence joined by "jadi" caught', r.status === 1 && /jadi/.test(r.stdout), r.stdout);

// --- other modules ---
r = run(['check', '--module', 'script', '--text', '<pre>\nSELECT nama\nFROM et_main_mlit.umm_a_pihak_bkptg p\nJOIN umm_aplikasi a ON a.aplikasi_id = p.aplikasi_id;\n</pre>']);
check('13 schema prefix and JOIN both caught', r.status === 1 && /schema prefix/.test(r.stdout) && /JOIN;/.test(r.stdout), r.stdout);
r = run(['check', '--module', 'plain', '--text', 'The fix is in MlkBorang4CeForm.java at the save step.']);
check('14 file name in a BA note caught by plain', r.status === 1 && has(r, 'plain'), r.stdout);
r = run(['check', '--module', 'plain', '--text', 'Deployed at 11:17 on 28/09/2026. PRBB at Portal Awam now allows only one hakmilik.']);
check('15 a clock time is not read as a line number', r.status === 0, r.stdout);
r = run(['check', '--module', 'rojak', '--text', 'Ringkasnya, kod kosong dihantar ke GIS.']);
check('16 formal Malay caught by rojak', r.status === 1 && has(r, 'rojak'), r.stdout);
r = run(['check', '--module', 'rojak', '--text', 'Basically, sistem hantar kod pejabat kosong ke GIS. Refer point 2.']);
check('17 his rojak passes', r.status === 0, r.stdout);
r = run(['check', '--module', 'greet', '--text', 'Hi Nurhafizah, fix sudah di deploy.\n\nPlease test.']);
check('18 wrong greeting and missing closing both caught', r.status === 1 && (r.stdout.match(/\[greet\] line/g) || []).length === 2, r.stdout);
r = run(['check', '--module', 'lean', '--text', 'The fix is DB-proven on staging.']);
check('19 verdict word caught by lean', r.status === 1 && has(r, 'lean'), r.stdout);

// --- out-of-spec inputs ---
r = run(['check', '--profile', 'nope', '--text', 'x y z']);
check('20 unknown profile: exit 2 and the known profiles are named', r.status === 2 && /Known: redmine-dev-mapping/.test(r.stderr), r.stderr);
r = run(['check', '--profile', P]);
check('21 no draft given: exit 2, never a silent pass', r.status === 2 && /--file/.test(r.stderr), r.stderr);
r = run(['check', '--profile', P, '--text', '   ']);
check('22 empty draft: exit 2', r.status === 2 && /empty/.test(r.stderr), r.stderr);
r = run(['check', '--profile', P, '--file', path.join(TMP, 'missing.txt')]);
check('23 missing draft file: exit 2', r.status === 2 && /not found/.test(r.stderr), r.stderr);
r = run(['check', '--module', 'lean', '--text', 'He wrote: "PENA: profile=x · 0 finding(s)" in the note. Everything starts here.']);
check('24 a pasted PENA line inside the draft does not make it pass', r.status === 1 && has(r, 'lean'), r.stdout);
r = run(['check', '--module', 'script', '--text', 'Start from No. Permit, then select the row.']);
check('25 the words select / from in a normal sentence are not read as SQL', r.status === 0, r.stdout);
r = run(['check', '--module', 'table,separate', '--text', '| a | b |\n| c | d |']);
check('26 a table with no header row is caught', r.status === 1 && /header row/.test(r.stdout), r.stdout);
const BAD = fs.mkdtempSync(path.join(os.tmpdir(), 'pena-bad-'));
fs.writeFileSync(path.join(BAD, 'modules.json'), '{ not json');
r = run(['list'], BAD);
check('27 broken modules.json: exit 2 with the file named', r.status === 2 && /modules\.json/.test(r.stderr), r.stderr);
fs.appendFileSync(path.join(TMP, 'corpus.jsonl'), 'this is not json\n');
r = run(['show', '--module', 'lean']);
check('28 a broken corpus row is skipped, show still works', r.status === 0 && /== lean/.test(r.stdout), r.stdout + r.stderr);

// --- memory: add, keyword, show, analyze ---
r = run(['add', '--module', 'lean', '--mine', 'Everything is as below now.', '--his', 'As below.', '--ticket', '999999', '--surface', P]);
check('29 add stores a changed sentence', r.status === 0 && /stored c\d+ under lean/.test(r.stdout), r.stdout);
r = run(['add', '--module', 'lean', '--mine', 'Everything is as below now.', '--his', 'As below.']);
check('30 the same pair is not stored twice', r.status === 0 && /already stored/.test(r.stdout), r.stdout);
r = run(['add', '--module', 'nomodule', '--mine', 'a', '--his', 'b']);
check('31 add with an unknown module is refused', r.status === 2, r.stderr);
r = run(['show', '--module', 'lean']);
check('32 show prints the new example and his keyword meanings', r.status === 0 && /999999/.test(r.stdout) && /His word "too long"/.test(r.stdout), r.stdout);
r = run(['show', '--profile', P]);
check('33 show by profile lists every module of it and the memory pointers', r.status === 0 && ['greet', 'lean', 'line', 'table', 'separate', 'script', 'proven'].every((m) => r.stdout.includes('== ' + m + ' ')) && /Also read: .*feedback_ticket_writing_style/.test(r.stdout), r.stdout);
r = run(['keyword', '--word', 'Brief', '--meant', 'at most five lines', '--evidence', 'fixture']);
r = run(['analyze', '--days', '3650']);
check('34 analyze counts per module, names repeats and flags a keyword with two meanings', r.status === 0 && /REPEATS/.test(r.stdout) && /brief\s+\[2 meanings: ask which\]/.test(r.stdout), r.stdout);
const logRows = fs.readFileSync(path.join(TMP, 'log.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
check('35 every run wrote a log row with ts and outcome', logRows.length >= 20 && logRows.every((x) => x.ts && x.outcome), String(logRows.length));
r = run([]);
check('36 no command: exit 2 with usage', r.status === 2 && /usage/.test(r.stderr), r.stderr);

// --- the real data files and the awareness rows ---
const modules = JSON.parse(fs.readFileSync(path.join(__dirname, 'modules.json'), 'utf8'));
const profiles = JSON.parse(fs.readFileSync(path.join(__dirname, 'profiles.json'), 'utf8'));
check('37 every profile names only modules that exist', Object.values(profiles).every((pr) => pr.modules.every((m) => modules[m])));
check('38 every module says what it means and how it is checked', Object.values(modules).every((m) => m.means && m.title && m.check && (m.check !== 'manual' || m.ask)));
const skill = path.join(ROOT, '.claude', 'skills', 'pena', 'SKILL.md');
check('39 the skill exists and tells the caller to run show then check', fs.existsSync(skill) && /pena\.js show/.test(fs.readFileSync(skill, 'utf8')) && /pena\.js check/.test(fs.readFileSync(skill, 'utf8')));
const quest = fs.readFileSync(path.join(ROOT, '.claude', 'skills', 'quest', 'SKILL.md'), 'utf8');
check('40 the quest hand-over section points to Pena', /lib\/pena\.js/.test(quest));

const failed = results.filter((x) => !x.pass);
for (const x of results) console.log((x.pass ? 'PASS ' : 'FAIL ') + x.n + (x.pass ? '' : '\n      ' + String(x.d).slice(0, 400)));
console.log('\npena eval: ' + (results.length - failed.length) + '/' + results.length);
process.exit(failed.length ? 1 : 0);
