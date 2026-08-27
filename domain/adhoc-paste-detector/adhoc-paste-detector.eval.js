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
