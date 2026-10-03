#!/usr/bin/env node
// adhoc-paste-detector.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-08-13 PPTPB Teknikal Selangor issue pasted several times over sessions; each
// answered inline, no scaffold; a later ticket would cost a full re-investigation.
//
// CONTRACT (miya 2026-08-13): a BA-relayed issue pasted as labelled fields
//   (Urusan:/Tugasan:/Id:<PTMLK.../>/User:) with NO Redmine number MUST fire the ADHOC-scaffold
//   injection; anything else stays silent.
//   P1 real PPTPB paste → FIRES + injects scaffold + echoes urusan
//   P2 same shape WITH a Redmine number → SILENT (normal quest flow owns it)
//   P3 ordinary prose → SILENT
//   P4 only 2 of 4 labels → SILENT (below >=3 fingerprint)
//   P5 labels but Id not a permohonan-id → SILENT
//   P6 [skip-adhoc-paste:] bypass → SILENT
//   P7 clean/empty input exits 0 (no false block)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'adhoc-paste-detector.check.hook.js');
const REAL_ROOT = path.resolve(__dirname, '..', '..');

function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'adhoc-paste-'));
  fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
  fs.copyFileSync(path.join(REAL_ROOT, 'lib', 'hook-runtime.js'), path.join(root, 'lib', 'hook-runtime.js'));
  return root;
}
function run(root, prompt) {
  const r = spawnSync(process.execPath, [HOOK, 'UserPromptSubmit'], {
    input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000,
    env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: root }),
  });
  return { out: (r.stdout || '') + (r.stderr || ''), status: r.status };
}

const PASTE = [
  'PDTAG',
  'Urusan: PPTPB',
  'Tugasan: Penyediaan Laporan Pelukis Pelan',
  'Id: PTMLK/03/L/PPTPB/2026/4',
  'User: eddie@melaka.gov.my',
  '',
  'Isu: pada maklumat permohonan papar selangor',
].join('\n');

const root = makeRoot();
const results = [];
function check(n, cond, d) { results.push({ n, pass: !!cond, d: d || '' }); }

// P7 — clean input exits 0
let r = spawnSync(process.execPath, [HOOK, 'UserPromptSubmit'], {
  input: '{}', encoding: 'utf8', timeout: 30000,
  env: Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: root }),
});
check('P7 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

const cases = [
  { id: 'P1 real PPTPB paste fires + injects scaffold + echoes urusan', prompt: PASTE,
    want: ['adhoc-paste-detector', 'MANDATORY scaffold', 'ADHOC-PPTPB', 'active-cli.js start'], notWant: [] },
  { id: 'P2 same shape WITH a Redmine number is SILENT', prompt: PASTE + '\nESOKONGAN #275999',
    want: [], notWant: ['adhoc-paste-detector'] },
  { id: 'P3 ordinary prose is SILENT', prompt: 'can you check why the surat looks wrong',
    want: [], notWant: ['adhoc-paste-detector'] },
  { id: 'P4 only 2 labels is SILENT', prompt: 'Urusan: PPTPB\nUser: eddie@melaka.gov.my',
    want: [], notWant: ['adhoc-paste-detector'] },
  { id: 'P5 labels but non-permohonan Id is SILENT', prompt: 'Urusan: PPTPB\nTugasan: X\nId: 12345\nUser: a@b.gov.my',
    want: [], notWant: ['adhoc-paste-detector'] },
  { id: 'P6 bypass honoured', prompt: PASTE + '\n[skip-adhoc-paste: already scaffolded]',
    want: [], notWant: ['adhoc-paste-detector'] },
  // ── WIDENED 2026-08-26 (miya): freeform BA relay — the exact miss that motivated the widening ──
  { id: 'P8 freeform PDTJ relay (2026-08-26 slip replay) FIRES despite related-ticket mention', prompt: [
      'PDTJ', '', 'Hi team, mohon semak', '', 'nurhafizah@melaka.gov.my', 'PTMLK/02/L/PT/2026/1',
      'related tiket eSOKONGAN #274318', '',
      'User pergi ke Menu Pelupusan > Kemaskini Ulasan Jabatan Teknikal / JPPH > User Maklum hanya papar 5 Jabatan Teknikal sahaja, sepatutnya papar 7',
    ].join('\n'),
    want: ['adhoc-paste-detector', 'MANDATORY scaffold', 'ADHOC-PT', 'id_pengenalan'], notWant: [] },
  { id: 'P9 office code alone (no permohonan-id) is SILENT', prompt: 'PDTJ ada tanya pasal isu papar senarai semalam',
    want: [], notWant: ['adhoc-paste-detector'] },
  { id: 'P10 freeform relay with OWNING ticket number is SILENT', prompt:
      'PDTMT mohon semak isu ini QA 276999\nPTMLK/01/L/PRBB/2026/9\nsurat tidak papar',
    want: [], notWant: ['adhoc-paste-detector'] },
  { id: 'P11 permohonan-id + issue words, no office code, FIRES', prompt:
      'boleh check kenapa PTMLK/03/L/MCL/2026/12 tak boleh proceed? ralat keluar',
    want: ['adhoc-paste-detector', 'ADHOC-MCL'], notWant: [] },
  // ── WIDENED 2026-09-25: AWAM relay keyed by hakmilik + resit, no permohonan-id (slip replay) ──
  { id: 'P12 AWAM PLTP relay (hakmilik + resit, 2026-09-25 slip replay) FIRES + names adhoc-save', prompt: [
      'PDTMT', '', 'Portal Awam', 'Urusan : PLTP', 'ID hakmilik : 040210PM00001265',
      'No. resit carian rasmi : 02CR3761/2026', '', 'Isu',
      'Papar "Info : Maaf syer yang dimasukkan tidak sah atau melebihi had." bila klik seterusnya',
    ].join('\n'),
    want: ['adhoc-paste-detector', 'MANDATORY scaffold', 'ADHOC-PLTP', 'adhoc-save-audit.js'], notWant: [] },
  { id: 'P13 hakmilik id without issue words is SILENT', prompt: 'hakmilik 040210PM00001265 tu luas berapa',
    want: [], notWant: ['adhoc-paste-detector'] },
  // ── 2026-09-30 (miya): downloaded BA files must be MOVED into 0. Brief\ (ADHOC-PRBB-2026-6 replay) ──
  { id: 'P14 attached Desktop file is named in the MOVE step', prompt: [
      '@"C:\\Users\\Ridhwan\\Desktop\\RalatPRBB.txt"', 'Ruri, help adhoc melaka:', 'PDTMT', '',
      'Proses Pembatalan Permohonan', 'ID Permohonan : PTMLK/01/L/PRBB/2026/13', 'ID Pengguna : SaffuanH@melaka.gov.my',
      '', 'Isu', 'Papar ralat bila klik jana',
    ].join('\n'),
    want: ['adhoc-paste-detector', '1a. MOVE', 'Desktop\\RalatPRBB.txt', 'Move-Item'], notWant: [] },
  { id: 'P15 no attachment still carries the MOVE step', prompt: 'boleh check kenapa PTMLK/03/L/MCL/2026/12 tak boleh proceed? ralat keluar',
    want: ['1a. MOVE', 'none attached'], notWant: [] },
  // ── 2026-10-03 (Terengganu support): the scaffold names the pasted state's Task folder + knowledge dir ──
  { id: 'P16 Terengganu 7-segment relay FIRES under 1. Tasks\\Terengganu + terengganu/ADHOC-TRIAGE.md', prompt: [
      'PTG', 'nurul@terengganu.gov.my', 'urusan: PLPS', 'tugasan semasa: Semakan Permohonan',
      'id permohonan: PTTRG/07/01/L/PLPS/2026/135', 'Isu: ralat bila buka tugasan',
    ].join('\n'),
    want: ['adhoc-paste-detector', '(from PTG)', '"1. Tasks\\Terengganu\\<N+1>. ADHOC - <ENV> - PLPS', 'read etanah-knowledge/terengganu/ADHOC-TRIAGE.md', 'ADHOC-PLPS'],
    notWant: ['Tasks\\Melaka', 'etanah-knowledge/melaka'] },
  { id: 'P17 Terengganu 6-segment id (no sub block) resolves the same', prompt: 'PDTKT tanya kenapa PTTRG/02/L/OPLPS/2026/47 tak boleh proceed, ralat keluar',
    want: ['(from PDTKT)', '1. Tasks\\Terengganu\\', 'etanah-knowledge/terengganu/', 'ADHOC-OPLPS'], notWant: ['Tasks\\Melaka', 'etanah-knowledge/melaka'] },
  { id: 'P18 urusan kod with "_" (UPS_PLP) is an anchor + echoed whole', prompt: 'PTTRG/02/L/UPS_PLP/2026/4 papar ralat',
    want: ['ADHOC-UPS_PLP', '1. Tasks\\Terengganu\\'], notWant: ['Tasks\\Melaka'] },
  { id: 'P19 Melaka paste text UNCHANGED (folder, knowledge dir, office)', prompt: PASTE,
    want: ['BA-relayed issue (from PDTAG) with a permohonan-id', '     0. LOAD CONTEXT FIRST — read etanah-knowledge/melaka/ADHOC-TRIAGE.md and CLASSIFY each ask',
      '     1. Task folder: "1. Tasks\\Melaka\\<N+1>. ADHOC - <ENV> - PPTPB - <short desc>"'], notWant: ['Terengganu', 'terengganu'] },
  { id: 'P20 Melaka paste naming PTG gets NO new office label', prompt: 'PTG mohon semak PTMLK/03/L/MCL/2026/12 ralat keluar',
    want: ['BA-relayed issue with a permohonan-id', '1. Tasks\\Melaka\\'], notWant: ['(from PTG)'] },
  { id: 'P21 paste naming no state (AWAM hakmilik relay) keeps the reference text', prompt: [
      'PDTMT', 'Portal Awam', 'Urusan : PLTP', 'ID hakmilik : 040210PM00001265', 'Isu', 'papar ralat',
    ].join('\n'),
    want: ['1. Tasks\\Melaka\\', 'etanah-knowledge/melaka/ADHOC-TRIAGE.md'], notWant: ['Terengganu'] },
  { id: 'P22 unregistered prefix keeps the reference text', prompt: 'PTXYZ/01/L/PT/2026/1 papar ralat',
    want: ['1. Tasks\\Melaka\\', 'etanah-knowledge/melaka/'], notWant: [] },
  { id: 'P23 Perak paste goes to the Perak folder + knowledge', prompt: 'PTPK/02/L/PT/2026/3 papar ralat',
    want: ['1. Tasks\\Perak\\', 'etanah-knowledge/perak/ADHOC-TRIAGE.md'], notWant: ['Tasks\\Melaka', 'etanah-knowledge/melaka'] },
  { id: 'P24 state with no Task folder says so (never the Melaka folder)', prompt: 'PTSGR/01/L/PT/2026/1 papar ralat',
    want: ['no Task folder registered for selangor', 'etanah-knowledge/selangor/'], notWant: ['Tasks\\Melaka'] },
  { id: 'P25 Terengganu paste WITH an owning ticket number stays SILENT', prompt: 'eSOKONGAN #283001\nPTTRG/07/01/L/PT/2024/116 ralat',
    want: [], notWant: ['adhoc-paste-detector'] },
];

for (const c of cases) {
  const { out } = run(root, c.prompt);
  const miss = c.want.filter(w => !out.includes(w));
  const leak = c.notWant.filter(w => out.includes(w));
  check(c.id, !miss.length && !leak.length, 'missing=[' + miss.join(', ') + '] leaked=[' + leak.join(', ') + ']');
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nadhoc-paste-detector.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
