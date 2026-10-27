#!/usr/bin/env node
'use strict';
/**
 * quest/requirement-index.eval.js — fixtures for quest/requirement-index.js and its two Phase 0 wirings.
 * No network: search and render run on fixture rows; the CLI cases use --no-refresh or an unregistered state.
 * Run: node quest/requirement-index.eval.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'req-index-eval-'));
// Sandbox active.txt + Task folder for localTicket: set before the require, the module reads it at load.
const TASK = path.join(SB, '322. ES #286315 - PPTPB - Kemaskini Kertas Risalat - Ulasan Jabatan Teknikal');
fs.mkdirSync(path.join(TASK, '1. Brief'), { recursive: true });
// Captured from the real ticket's Description.txt (2026-10-27): a TSO ask on the Risalat MMKN screen.
fs.writeFileSync(path.join(TASK, '1. Brief', 'Description.txt'), [
  '2026-10-26', '', 'Ticket issue description:', '', 'Env: ESOKONGAN', 'Ticket: ESOKONGAN #286315',
  'Subject: PPTPB > Kemaskini Kertas Risalat > Ulasan Jabatan Teknikal', 'Author: ITSO Melaka Admin [TSO, shared account]', '',
  'PTGM - PPTPB', 'Penyediaan Risalat MMKN - PTG', 'Semakan Risalat MMKN - PTG', 'PTMLK/02/L/PPTPB/2026/1',
  'Hi team boleh bantu advise', 'User nak kemaskini Kertas Risalat', 'Pada 3. Ulasan-Ulasan Jabatan Teknikal',
  'User nak boldkan beberapa perkataan seperti', '*tiada halangan *', '*tidak menyokong *',
].join('\n'));
fs.writeFileSync(path.join(SB, 'active.txt'), `qa=QA-286315\nstatus=active\ntask_folder=${TASK}\n\nqa=QA-999\ntask_folder=${path.join(SB, 'gone')}\n`);
process.env.REQ_ACTIVE_FILE = path.join(SB, 'active.txt');
process.env.REQ_NO_LOG = '1';

const R = require('./requirement-index.js');

const row = (id, subject, module, extra) => ({ id, subject, module, project: '', tracker: 'Requirements', status: 'Resolved', author: 'Anis Nabilah J Daud', assignee: '', parent: null, created: '2025-01-01', updated: '', closed: '', snippet: '', ...extra });
const ROWS = [
  row(220489, 'PPTPB - Tugasan Penyediaan Risalat MMKN - PTG', 'Pelupusan', { snippet: 'Skrin risalat MMKN; seksyen 3 Ulasan Jabatan Teknikal dipaparkan dari ulasan JT.' }),
  row(220411, 'PPTPB - Tugasan Penyediaan Risalat MMKN - PDT', 'Pelupusan', { status: 'Rework (Requirement Update)' }),
  row(218964, 'PRU - Tugasan Penyediaan/Semakan/Perakuan Risalat MMKN - PTG', 'Pelupusan'),
  row(277706, '[SPOC] PRBB - Tambahan Jenis Permohonan = Tambah Kuantiti', '', { status: 'In Progress' }),
  row(266789, 'SPOC - PLTP - Fi Permohonan', 'SPOC', { snippet: 'Fi permohonan dikira mengikut kod fi PLTP' }),
  row(300001, 'Hasil - Cetakan Resit Cukai Tanah', 'Hasil', { snippet: 'resit cukai tanah dicetak di kaunter' }),
  row(300002, 'PPTPB - Tugasan Penyediaan Risalat MMKN - PTG (lama)', 'Pelupusan', { status: 'Cancelled' }),
  row(300003, 'Pendaftaran - Risalat Daftar', 'Pendaftaran'),
  row(300004, 'Pelupusan - Risalat', 'Pelupusan', { parent: 220489 }),
];

const results = [];
function t(name, fn) {
  try { const why = fn(); results.push({ name, ok: why === true, why: why === true ? '' : why }); }
  catch (e) { results.push({ name, ok: false, why: 'threw ' + e.message }); }
}
const top = (q, o) => (R.search(ROWS, q, o)[0] || { row: {} }).row.id;
const read = p => fs.readFileSync(path.join(REPO, p), 'utf8');

// --- the failing case: a TSO ask on #286315 must surface the original Requirement #220489
t('F1 286315 TSO ask → original requirement #220489 is the top match', () => {
  const tk = R.localTicket(286315);
  if (!tk) return 'localTicket found no Task folder';
  const id = top(`${tk.subject}\n${tk.description}`);
  return id === 220489 || `top was ${id}`;
});
t('F2 localTicket reads Subject from Description.txt, not the folder name', () => {
  const tk = R.localTicket(286315);
  return (tk && tk.subject === 'PPTPB > Kemaskini Kertas Risalat > Ulasan Jabatan Teknikal' && tk.source === 'Task folder') || JSON.stringify(tk);
});
t('F3 localTicket body drops the header (Env/Ticket/Author lines)', () => {
  const tk = R.localTicket(286315);
  return (!/ITSO Melaka Admin/.test(tk.description) && /boldkan/.test(tk.description)) || tk.description.slice(0, 120);
});
t('N1 a block whose folder is gone and no folder on disk → null, never a guess', () => R.localTicket(999) === null || 'not null');

// --- search
t('S1 stop words alone return nothing', () => R.search(ROWS, 'dan yang di untuk pada').length === 0 || 'hits on stop words');
t('S2 empty query returns nothing', () => R.search(ROWS, '').length === 0 || 'hits on empty');
t('S3 subject hit outranks a description-only hit', () => top('ulasan jabatan teknikal risalat') === 220489 || 'wrong top');
t('S4 urusan code in capitals weighs up (PRBB)', () => top('PRBB tambah kuantiti') === 277706 || 'wrong top');
t('S5 cancelled requirement ranks below the live one with the same subject', () => {
  const h = R.search(ROWS, 'PPTPB Tugasan Penyediaan Risalat MMKN PTG');
  const a = h.findIndex(x => x.row.id === 220489), b = h.findIndex(x => x.row.id === 300002);
  return (a >= 0 && b > a) || `live ${a} cancelled ${b}`;
});
t('S6 module bonus picks the same-module row on a tie', () => {
  const pick = R.search(ROWS, 'risalat', { module: 'Pendaftaran' })[0].row.id;
  return pick === 300003 || `top ${pick}`;
});
t('S7 exclude keeps the ticket itself out of its own matches', () => !R.search(ROWS, 'risalat MMKN PTG', { exclude: [220489] }).some(h => h.row.id === 220489) || 'self listed');
t('N2 an unrelated ask (resit cukai) does not match the Risalat requirement', () => top('cetakan resit cukai tanah kaunter') === 300001 || 'wrong top');
t('S8 HTML in a description is not tokenised as words', () => R.tokenize('<p>risalat</p><br/>').join(',') === 'risalat' || R.tokenize('<p>risalat</p>').join(','));

// --- render
t('R1 MD has one table row per requirement and a heading per module', () => {
  const md = R.renderMd(ROWS, { label: 'Melaka', project: 'e-tanah-melaka', built: '2026-10-27T00:00:00Z' });
  const rows = (md.match(/^\| \d+ \|/gm) || []).length;
  return (rows === ROWS.length && /^## Pelupusan \(\d+\)$/m.test(md) && /^## \(no module\) \(1\)$/m.test(md)) || `rows ${rows}`;
});
t('R2 MD names the parent subject for a parent inside the index', () => /\| 300004 \|.*#220489 PPTPB/.test(R.renderMd(ROWS, { label: 'x', project: 'p', built: '2026-10-27' })) || 'no parent subject');
t('R3 a pipe in a subject does not break the table', () => {
  const md = R.renderMd([row(1, 'A | B', 'X')], { label: 'x', project: 'p', built: '2026-10-27' });
  return /\| 1 \| A \/ B \|/.test(md) || 'pipe kept';
});
t('R4 rowFromIssue keeps module, parent and a capped snippet', () => {
  const r = R.rowFromIssue({ id: 5, subject: ' S ', description: 'x'.repeat(900), status: { name: 'New' }, author: { name: 'A' }, parent: { id: 4 }, custom_fields: [{ id: 17, value: 'Pelupusan' }], created_on: '2026-01-02T00:00:00Z' });
  return (r.module === 'Pelupusan' && r.parent === 4 && r.subject === 'S' && r.snippet.length < 420) || JSON.stringify(r).slice(0, 200);
});
t('R5 module "-Please Select-" is stored as no module', () => R.rowFromIssue({ id: 1, custom_fields: [{ id: 17, value: '-Please Select-' }] }).module === '' || 'kept placeholder');

// --- CLI (no network)
const cli = (args, env) => spawnSync(process.execPath, [path.join(__dirname, 'requirement-index.js'), ...args], { encoding: 'utf8', env: { ...process.env, ...(env || {}) }, timeout: 20000 });
t('C1 a state with no Requirement project says n/a and exits 0 (no guess, no network)', () => {
  const r = cli(['--ticket', '1', '--state', 'perak']);
  return (r.status === 0 && /REQUIREMENT-MATCH: n\/a/.test(r.stdout)) || `${r.status} ${r.stdout}${r.stderr}`;
});
t('C2 no mode prints usage and exits 2', () => { const r = cli([]); return (r.status === 2 && /usage/.test(r.stdout)) || `${r.status}`; });

// --- wiring: the two Phase 0 steps must stay wired (the 2026-10-27 orphan slip)
const WF = read('.claude/workflows/quest-phase0.js');
const SK = read('.claude/skills/quest/SKILL.md');
t('W1 quest-phase0 Discovery runs ticket-load-verify (who wrote it: BA or TSO)', () => /node quest\/ticket-load-verify\.js/.test(WF) || 'missing');
t('W2 quest-phase0 Discovery runs requirement-index --ticket', () => /node quest\/requirement-index\.js --ticket/.test(WF) || 'missing');
t('W3 Discovery schema REQUIRES specSource + requirementMatch', () => {
  const m = WF.match(/const DISCOVERY_SCHEMA = \{ type: 'object', required: \[([^\]]*)\]/);
  return (m && /'specSource'/.test(m[1]) && /'requirementMatch'/.test(m[1])) || 'not required';
});
t('W4 no "BA\'s LITERAL scope" wording left in the Discovery prompt', () => !/BA's LITERAL scope/.test(WF) || 'still there');
t('W5 SKILL Phase 0 step 2a (BA/TSO) + 2b (REQUIREMENT-MATCH) present', () => (/^2a\. .*ticket-load-verify\.js/m.test(SK) && /^2b\. .*requirement-index\.js --ticket/m.test(SK)) || 'missing');
t('W6 SKILL resume step iii echoes role and REQUIREMENT-MATCH', () => {
  const iii = (SK.match(/^\s*\| iii \|.*$/m) || [''])[0];
  return (/role \[BA \/ TSO/.test(iii) && /REQUIREMENT-MATCH/.test(iii)) || 'missing in iii';
});
t('W7 tools.json carries the requirement-index row', () => JSON.parse(read('system/tools.json')).tools.some(x => x.id === 'requirement-index' && x.home === 'quest/requirement-index.js') || 'no row');

let failed = 0;
for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  — ' + r.why}`); }
console.log(`\nrequirement-index.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(SB, { recursive: true, force: true }); } catch (_) { /* temp */ }
process.exit(failed ? 1 : 0);
