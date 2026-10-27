#!/usr/bin/env node
// handover-check-gate eval — the 286462 note to Fatin (must BLOCK) plus the scenarios around it.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { evaluate } = require('./handover-check-gate.check.hook.js');

const TABLE = `|_. Unit dipilih |_. Draf sekarang |_. Sepatutnya |
| Plot 3 | No. Lot -/PT- 3 | No. Plot 3 |`;
const MD_TABLE = `| Unit | Now | Expected |\n|---|---|---|\n| Plot 3 | No. Lot /PT 3 | No. Plot 3 |`;
const CLEAN = 'EXPECTED SOURCE: ITSO Melaka Admin (TSO, shared account)\nHANDOVER-CHECK: 0 finding(s)';
const SENT_286462 = `Salam Fatin,\n\nIsu ni dari PlpLaporanPermohonanPRBB_Sub01.jrxml.\n\n${TABLE}\n\nBaris yang terlibat: Sub01 615.\n\nThank you.`;

const cases = [
  ['286462 note to Fatin, no check line -> block', SENT_286462, 'block'],
  ['286462 note to Fatin WITH clean check line -> block (not kak Yati)', SENT_286462 + '\n' + CLEAN, 'block'],
  ['kak Yati + jrxml + clean check -> pass', SENT_286462.replace('Salam Fatin', 'Salam kak Yati') + '\n' + CLEAN, 'pass'],
  ['kak Yati + jrxml, no check line -> block', SENT_286462.replace('Salam Fatin', 'Salam kak Yati'), 'block'],
  ['BA pass note (no jrxml) + clean check -> pass', `Salam Anis,\n\n${MD_TABLE}\n\n${CLEAN}`, 'pass'],
  ['BA pass note (no jrxml), no check -> block', `Salam Anis,\n\n${MD_TABLE}`, 'block'],
  ['check line with findings -> block', `Salam Anis,\n\n${MD_TABLE}\nHANDOVER-CHECK: 2 finding(s)`, 'block'],
  ['Salam but no Expected table (plain BA pass) -> pass', 'Salam Anis,\n\nFix dah deploy ke internal.\n\nThank you.', 'pass'],
  ['Expected table but no Salam (chat analysis) -> pass', `Audit:\n\n${MD_TABLE}`, 'pass'],
  ['no text -> pass', '', 'pass'],
  ['bypass with reason -> pass', SENT_286462 + '\n[skip-handover-check: quoting the old note for the audit]', 'pass'],
  ['empty bypass -> block', SENT_286462 + '\n[skip-handover-check: ]', 'block'],
  ['lower-case "salam fatin" still caught -> block', SENT_286462.replace('Salam Fatin', 'salam Fatin'), 'block'],
  ['"Dijangka" header caught -> block', `Salam Anis,\n\n| Unit | Dijangka |\n|---|---|\n| Plot 3 | No. Plot 3 |`, 'block'],
];

let pass = 0, fail = 0;
for (const [name, text, want] of cases) {
  const got = evaluate(text).verdict;
  if (got === want) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + ' :: got ' + got); }
}

// fire + effect check through the real hook process (stdin JSON, transcript file)
const tmp = path.join(os.tmpdir(), 'hcg-eval-' + process.pid + '.jsonl');
fs.writeFileSync(tmp, JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: SENT_286462 }] } }) + '\n');
const r = spawnSync(process.execPath, [path.join(__dirname, 'handover-check-gate.check.hook.js')], { input: JSON.stringify({ transcript_path: tmp }), encoding: 'utf8' });
const fired = /"decision":"block"/.test(r.stdout) && /kak Yati/.test(r.stdout) && /handover-check\.js/.test(r.stdout);
if (fired) { pass++; console.log('PASS hook process blocks the 286462 note and names kak Yati + the check command'); } else { fail++; console.log('FAIL hook process :: ' + r.stdout); }
const r2 = spawnSync(process.execPath, [path.join(__dirname, 'handover-check-gate.check.hook.js')], { input: 'not json', encoding: 'utf8' });
if (r2.status === 0 && !r2.stdout) { pass++; console.log('PASS bad stdin fails open'); } else { fail++; console.log('FAIL bad stdin'); }
try { fs.unlinkSync(tmp); } catch (_) {}

console.log(`handover-check-gate.eval: ${pass}/${pass + fail} green`);
process.exit(fail ? 1 : 0);
