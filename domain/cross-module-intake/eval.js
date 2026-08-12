#!/usr/bin/env node
/* eval for cross-module-intake/scan.js — the QA-274318 regression + negatives. */
const { execFileSync } = require('child_process');
const path = require('path');
const scan = path.join(__dirname, 'scan.js');

function run(args) {
  try { return { out: execFileSync('node', [scan, ...args], { encoding: 'utf8' }), code: 0 }; }
  catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status }; }
}

const cases = [
  {
    name: 'QA-274318 (the missed ticket) → MUST flag cross-module',
    args: ['--folder', 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka\\132. ESOKONGAN #274318 - Pelupusan - Kemaskini Jabatan Teknikal dan JPPH tidak Tepat'],
    expectCode: 2,
    expectContains: ['our issue or Common', 'CROSS-MODULE'],
  },
  {
    name: 'clean pelupusan ticket → no cross-module signal',
    args: ['--text', 'Env: ESOKONGAN\nPLPS surat nilaian tarikh salah pada template. Sila betulkan tarikh.'],
    expectCode: 0,
    expectContains: ['clean'],
  },
  {
    name: 'priority signal → flagged as priority',
    args: ['--text', 'URGENT: PROD down, sila semak segera.'],
    expectCode: 0,
    expectContains: ['PRIORITY'],
  },
];

let pass = 0;
for (const c of cases) {
  const r = run(c.args);
  const codeOk = r.code === c.expectCode;
  const textOk = c.expectContains.every(s => r.out.includes(s));
  const ok = codeOk && textOk;
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${c.name}` + (ok ? '' : `  (code ${r.code} want ${c.expectCode}; contains=${textOk})`));
  if (ok) pass++;
}
console.log(`\n${pass}/${cases.length} passed`);
process.exit(pass === cases.length ? 0 : 1);
