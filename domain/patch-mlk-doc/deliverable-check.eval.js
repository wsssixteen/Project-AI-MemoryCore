#!/usr/bin/env node
// Fixture eval for deliverable-check.js — builds temp Task folders and asserts PASS/FAIL per case.
const fs = require('fs'), os = require('os'), path = require('path');
const { check } = require('./deliverable-check');

const GOOD_SQL = [
  '-- Ticket: #999',
  '-- Env: Melaka PROD (etprdmlk) — schema et_dms',
  '-- Permohonan: PTMLK/02/L/PT/2026/4 (aplikasi_id 1)',
  '-- Fix: reset PDF from the replaced file',
  '',
  'SELECT * FROM et_dms.dokumen_revision WHERE dokumen_revision_id = 1;',
  '',
  'UPDATE et_dms.dokumen_revision SET lokasi_fail_pdf = NULL WHERE dokumen_revision_id = 1;',
  '-- 1 row updated',
  ''].join('\n');
const DOCX = Buffer.from('PK\u0003\u0004rest', 'latin1');
const MAIN = 'LAIN-1_1.main';

function folder(files) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'pmd-')); const fix = path.join(d, '2. Fix'); fs.mkdirSync(fix);
  for (const [n, c] of Object.entries(files)) fs.writeFileSync(path.join(fix, n), c);
  return d;
}
const cases = [
  ['good folder passes', { '999.sql': GOOD_SQL, [MAIN]: DOCX }, true],
  ['retrieved BA docx alongside is allowed', { '999.sql': GOOD_SQL, [MAIN]: DOCX, 'Minit Bebas - x.docx': DOCX }, true],
  ['check script allowed', { '999.sql': GOOD_SQL, '999-check.sql': 'SELECT 1;', [MAIN]: DOCX }, true],
  ['PATCH-REQUEST txt banned', { '999.sql': GOOD_SQL, [MAIN]: DOCX, 'PATCH-REQUEST-999.txt': 'Hi infra' }, false],
  ['missing 999.sql', { [MAIN]: DOCX }, false],
  ['descriptive sql name banned', { '999.sql': GOOD_SQL, 'patch-999-pdf.sql': GOOD_SQL, [MAIN]: DOCX }, false],
  ['-2 sql banned', { '999.sql': GOOD_SQL, '999-2.sql': GOOD_SQL, [MAIN]: DOCX }, false],
  ['script as txt banned', { '999.sql': GOOD_SQL, 'reset.txt': 'UPDATE x SET a=1;', [MAIN]: DOCX }, false],
  ['missing header', { '999.sql': GOOD_SQL.replace('-- Fix: reset PDF from the replaced file\n', ''), [MAIN]: DOCX }, false],
  ['missing row annotation', { '999.sql': GOOD_SQL.replace('-- 1 row updated', ''), [MAIN]: DOCX }, false],
  ['unqualified table', { '999.sql': GOOD_SQL.replace('UPDATE et_dms.', 'UPDATE '), [MAIN]: DOCX }, false],
  ['JOIN banned', { '999.sql': GOOD_SQL.replace('WHERE dokumen_revision_id = 1;\n\nUPDATE', 'JOIN et_dms.dokumen d ON 1=1;\n\nUPDATE'), [MAIN]: DOCX }, false],
  ['two UPDATEs', { '999.sql': GOOD_SQL.replace('-- 1 row updated', 'UPDATE et_dms.dokumen_revision SET versi=1 WHERE dokumen_revision_id=1;\n-- 1 row updated'), [MAIN]: DOCX }, false],
  ['no before SELECT', { '999.sql': GOOD_SQL.replace(/SELECT[^\n]*\n/, ''), [MAIN]: DOCX }, false],
  ['.main missing (docx under its own name only)', { '999.sql': GOOD_SQL, 'Minit Bebas (1)(1).docx': DOCX }, false],
  ['.main not a docx', { '999.sql': GOOD_SQL, [MAIN]: 'plain text' }, false],
  ['"from" word inside header comment does not trip', { '999.sql': GOOD_SQL.replace('reset PDF from the replaced file', 'rebuild PDF from Word file'), [MAIN]: DOCX }, true],
];
let bad = 0;
for (const [name, files, expectPass] of cases) {
  const d = folder(files);
  const fails = check(d, '999', MAIN);
  const ok = (fails.length === 0) === expectPass;
  if (!ok) { bad++; console.error(`FAIL: ${name} → ${fails.join(' | ') || 'passed unexpectedly'}`); }
  fs.rmSync(d, { recursive: true, force: true });
}
// wrong basename argument
if (check(folder({ '999.sql': GOOD_SQL }), '999', 'Minit.docx').length === 0) { bad++; console.error('FAIL: bad basename accepted'); }
if (bad) { console.error(`${bad} case(s) failed`); process.exit(1); }
console.log(`PASS: deliverable-check ${cases.length + 1}/${cases.length + 1} fixtures`);
