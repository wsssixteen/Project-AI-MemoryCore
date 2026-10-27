#!/usr/bin/env node
// handover-check eval — the 286462 note that went out (must FAIL) and a note built from the Expected only (must PASS).
'use strict';
const { check } = require('./handover-check.js');

const HISTORY = `Description by: ITSO Melaka Admin [TSO, shared account] — a TSO report, not the BA spec.
──────────────────────────────────────────────────────────────────────
--- 2026-10-23T06:38:56Z by Muhammad Shafiq Mohd Yohani ---
  [role] TSO
  [attr] description: PDTAG → PDTAG
--- 2026-10-26T02:09:45Z by Nurul  Amani ---
  [role] QA
  notes:
    Same issue found when simulate in Awam STAG
`;
const DESCRIPTION = `Author: ITSO Melaka Admin [TSO, shared account]

Actual:
Public isi *Plot 3* tapi pada dokumen papar *No.Lot 3*. Public dah klik jana semula masih sama jugak

Expected:
Papar Plot 3 pada dokumen
`;
const SENT_NOTE = `Salam Fatin,

Isu ni dari PlpLaporanPermohonanPRBB_Sub01.jrxml.
Bila unit tanah Plot, draf papar "No. Lot /PT" sebab PLOT masuk sekali dengan UNITLT_LOT.

|_. Unit dipilih |_. Draf sekarang |_. Sepatutnya |
| Lot 3 | No. Lot -/PT- 3 | No. Lot 3 |
| PT 3 | -No. Lot/- PT 3 | No. PT 3 |
| Plot 3 | No. Lot -/PT- 3 | No. Plot 3 |

Baris yang terlibat: Sub01 615, 661, 705, 749, 781 dan Sub05 199.
Data dah betul, kod unit tersimpan PLOT.`;
const GOOD_NOTE = `Salam Fatin,

|_. Unit dipilih |_. Draf sekarang |_. Sepatutnya |
| Lot 3 | No. Lot -/PT- 3 | No. Lot -/PT- 3 |
| PT 3 | -No. Lot/- PT 3 | -No. Lot/- PT 3 |
| Plot 3 | No. Lot -/PT- 3 | No. Plot 3 |

Line 615, 661, 705, 749, 781 dalam PlpLaporanPermohonanPRBB_Sub01.jrxml kat etanah-awam mlk/master.`;

let pass = 0, fail = 0;
function t(name, ok, detail) { if (ok) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (detail ? ' :: ' + detail : '')); } }

const bad = check(HISTORY, DESCRIPTION, SENT_NOTE);
t('286462 sent note: Expected source named as TSO, not BA', /ITSO Melaka Admin \(TSO, shared account\)/.test(bad.lines[0]) && bad.lines.some(l => /NOT A BA SPEC/.test(l)), bad.lines.join(' / '));
t('286462 sent note: TSO editor named', bad.lines.some(l => /Muhammad Shafiq Mohd Yohani \(TSO\)/.test(l)), bad.lines.join(' / '));
t('286462 sent note: Lot row flagged (not asked)', bad.findings.some(f => /row "Lot 3/.test(f)), bad.findings.join(' / '));
t('286462 sent note: PT row flagged (not asked)', bad.findings.some(f => /row "PT 3/.test(f)), bad.findings.join(' / '));
t('286462 sent note: Plot row NOT flagged (asked)', !bad.findings.some(f => /row "Plot 3/.test(f)), bad.findings.join(' / '));
t('286462 sent note: bare line numbers flagged', bad.findings.some(f => /line numbers without/.test(f)), bad.findings.join(' / '));
const good = check(HISTORY, DESCRIPTION, GOOD_NOTE);
t('Expected-only note passes clean', good.findings.length === 0, good.findings.join(' / '));

console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
