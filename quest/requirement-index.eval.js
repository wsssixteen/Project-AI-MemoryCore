#!/usr/bin/env node
'use strict';
/**
 * quest/requirement-index.eval.js — fixtures for quest/requirement-index.js and its Phase 0 wirings.
 * No network: search and render run on fixture rows; the CLI cases use --no-refresh or an unregistered state.
 * The K cases replay the five real tickets judged on 2026-10-27; they need the machine's real index
 * and are skipped (counted green) when it is absent.
 * Run: node quest/requirement-index.eval.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'req-index-eval-'));
// Sandbox active.txt + Task folders for localTicket: set before the require, the module reads it at load.
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
// An older sync with no Author line (the header-strip bug Fable found on 281324).
const OLD = path.join(SB, '201. #281324 - Semua urusan PLP - Penerimaan Bukti Penyampaian');
fs.mkdirSync(path.join(OLD, '0. Brief'), { recursive: true });
fs.writeFileSync(path.join(OLD, '0. Brief', 'Description.txt'), [
  '2026-09-28', '', 'Ticket issue description:', '', 'Env: INTERNAL ISSUE', 'Ticket: INTERNAL ISSUE #281324',
  'Subject: Semua urusan PLP - Penerimaan Bukti Penyampaian Pos Berdaftar', '', 'ID PErmohonan: PTMLK/03/L/PRBB/2026/8', 'Klik Hantar > Error',
].join('\n'));
fs.writeFileSync(path.join(SB, 'active.txt'), `qa=QA-286315\nstatus=active\ntask_folder=${TASK}\n\nqa=QA-281324\ntask_folder=${OLD}\n\nqa=QA-999\ntask_folder=${path.join(SB, 'gone')}\n`);
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

// --- the failing case: a TSO ask on 286315 must surface the original Requirement 220489
t('F1 286315 TSO ask → original requirement 220489 is the top match', () => {
  const tk = R.localTicket(286315);
  if (!tk) return 'localTicket found no Task folder';
  const id = top({ subject: tk.subject, body: tk.description });
  return id === 220489 || `top was ${id}`;
});
t('F2 localTicket reads Subject from Description.txt, not the folder name', () => {
  const tk = R.localTicket(286315);
  return (tk && tk.subject === 'PPTPB > Kemaskini Kertas Risalat > Ulasan Jabatan Teknikal' && tk.source === 'Task folder') || JSON.stringify(tk);
});
t('F3 localTicket body drops the header (Env/Ticket/Author lines)', () => {
  const tk = R.localTicket(286315);
  return (!/ITSO Melaka Admin|Env:|Ticket issue description/.test(tk.description) && /boldkan/.test(tk.description)) || tk.description.slice(0, 120);
});
t('F4 header strip works on an older sync with no Author line (Fable bug)', () => {
  const tk = R.localTicket(281324);
  return (tk && !/Env:|Ticket issue description|INTERNAL ISSUE #/.test(tk.description) && /^ID PErmohonan/.test(tk.description)) || JSON.stringify(tk && tk.description.slice(0, 80));
});
t('N1 a block whose folder is gone and no folder on disk → null, never a guess', () => R.localTicket(999) === null || 'not null');

// --- search
t('S1 stop words alone return nothing', () => R.search(ROWS, 'dan yang di untuk pada').length === 0 || 'hits on stop words');
t('S2 empty query returns nothing', () => R.search(ROWS, '').length === 0 || 'hits on empty');
t('S3 subject hit outranks a description-only hit', () => top('ulasan jabatan teknikal risalat') === 220489 || 'wrong top');
t('S4 urusan code in the subject weighs up (PRBB)', () => top('PRBB tambah kuantiti') === 277706 || 'wrong top');
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
t('S8 HTML in a description is not tokenised as words', () => R.tokenize('<p>risalat</p><br/>').join(',') === 'risalat' || R.tokenize('<p>risalat</p>').join(','));
t('S9 a long subject does not win by collecting common words', () => {
  const rows = [row(1, 'PLPS - Fi PLPSL', 'Pelupusan'), row(2, 'PLPS - Template Borang Permohonan Surat Kertas Pertimbangan Risalat MMKN Fi kiraan maklumat', 'Pelupusan')];
  const id = (R.search(rows, { subject: 'PLPS - Sewa Tahunan tidak auto kira, kod Fi PLPSL', body: 'maklumat permohonan surat kertas' })[0] || { row: {} }).row.id;
  return id === 1 || 'top ' + id;
});
t('S10 urusan code in the subject earns the bonus (PT beats PLTP on the same words)', () => {
  const rows = [row(1, 'PLTP - Template Risalat MMKN', 'Pelupusan'), row(2, 'PT - Template Risalat MMKN', 'Pelupusan')];
  const id = R.search(rows, 'PT - Risalat MMKN tak papar')[0].row.id;
  return id === 2 || 'top ' + id;
});
t('S11 the body never outvotes the subject', () => {
  const rows = [row(1, 'PPTPB Risalat MMKN', 'Pelupusan'), row(2, 'Hasil Resit', 'Hasil', { snippet: 'resit kaunter cetakan bayaran cukai' })];
  const id = R.search(rows, { subject: 'PPTPB Risalat', body: 'resit kaunter cetakan bayaran cukai' })[0].row.id;
  return id === 1 || 'top ' + id;
});
t('S12 every hit carries a match label strong | weak | none', () => R.search(ROWS, 'PPTPB Tugasan Penyediaan Risalat MMKN PTG').every(h => ['strong', 'weak', 'none'].includes(h.match)) || 'no label');
t('N2 an unrelated ask (resit cukai) does not match the Risalat requirement', () => top('cetakan resit cukai tanah kaunter') === 300001 || 'wrong top');

// --- key: the five real tickets judged 2026-10-27 (Fable audit + controller check)
const realIdx = R.load('melaka');
const REAL = !realIdx.missing && realIdx.rows.length > 1000;
const runReal = args => spawnSync(process.execPath, [path.join(__dirname, 'requirement-index.js'), ...args], { encoding: 'utf8', env: { ...process.env, REQ_ACTIVE_FILE: '' }, timeout: 30000 });
const KEY = [[265109, [219690]], [282587, [223339, 223347]], [286315, [220489]], [278909, [221027, 220410, 236336]]];
for (const [num, ok] of KEY) {
  t(`K${num} top 3 holds the right requirement (${ok.join(' / ')})${REAL ? '' : ' — skipped, no real index'}`, () => {
    if (!REAL) return true;
    const r = runReal(['--ticket', String(num), '--no-refresh', '--top', '3', '--json']);
    let j; try { j = JSON.parse(r.stdout); } catch (_) { return 'no JSON: ' + (r.stdout || r.stderr).slice(0, 120); }
    return j.hits.some(h => ok.includes(h.row.id)) || 'top 3 ' + j.hits.map(h => h.row.id).join(',');
  });
}
t(`K281324 (no requirement exists) is flagged weak, not presented as a match${REAL ? '' : ' — skipped'}`, () => {
  if (!REAL) return true;
  const r = runReal(['--ticket', '281324', '--no-refresh', '--top', '3']);
  return /top match is weak on the subject/.test(r.stdout) || r.stdout.slice(0, 300);
});

// --- render
t('R1 MD has one table row per requirement and a heading per module', () => {
  const md = R.renderMd(ROWS, { label: 'Melaka', project: 'e-tanah-melaka', built: '2026-10-27T00:00:00Z' });
  const rows = (md.match(/^\| \d+ \|/gm) || []).length;
  return (rows === ROWS.length && /^## Pelupusan \(\d+\)$/m.test(md) && /^## \(no module\) \(1\)$/m.test(md)) || `rows ${rows}`;
});
t('R2 MD is slim: 4 columns, parent as a plain id', () => {
  const md = R.renderMd(ROWS, { label: 'x', project: 'p', built: '2026-10-27' });
  return (/^\| # \| Subject \| Status \| Parent \|$/m.test(md) && /^\| 300004 \| Pelupusan - Risalat \| Resolved \| 220489 \|$/m.test(md)) || 'not slim';
});
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
t('C3 the usage log is git-ignored (a call never dirties the tree)', () => {
  const r = spawnSync('git', ['check-ignore', '-q', 'quest/requirement-index.log.jsonl'], { cwd: REPO });
  return r.status === 0 || 'not ignored';
});
t('C4 a stale index is answered from at once; the rebuild is detached, never awaited', () => {
  const src = read('quest/requirement-index.js').replace(/\r\n/g, '\n'); // main checks out CRLF
  const body = (src.match(/async function ensure[\s\S]*?\n}\n/) || [''])[0];
  return (/detached: true/.test(body) && /\.unref\(\)/.test(body) && !/ageDays > STALE_DAYS\)[^]*?await build/.test(body.replace(/if \(idx\.missing\)[\s\S]*?\} else/, ''))) || 'stale path awaits a build';
});

// --- wiring: the Phase 0 steps must stay wired (the 2026-10-27 orphan slip)
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
t('W8 ticket-gate checklist renders row 1e with both commands for the ticket', () => {
  const r = spawnSync(process.execPath, [path.join(REPO, '.claude', 'hooks', 'ticket-gate.js')], { input: JSON.stringify({ prompt: 'lets start ticket 999991', session_id: 'eval' }), encoding: 'utf8', timeout: 20000 });
  return /1e\. ⬜ .*ticket-load-verify\.js 999991.*requirement-index\.js --ticket 999991/.test(r.stdout) || 'row 1e missing: exit ' + r.status;
});

let failed = 0;
for (const r of results) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  — ' + r.why}`); }
console.log(`\nrequirement-index.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(SB, { recursive: true, force: true }); } catch (_) { /* temp */ }
process.exit(failed ? 1 : 0);
