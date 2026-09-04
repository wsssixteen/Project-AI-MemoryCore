// sibling-sweep.test.js — REAL-REPO regression pin for the #275539 v2 miss (2026-08-24).
// Complements eval-merge-scenarios.js (synthetic fixtures): this one replays TODAY's actual
// incident states against the REAL etanah-pelupusan repo, through the REAL gate module
// (verify-gates.js — no duplicated logic). Read-only: ls-remote + rev-list/rev-parse only.
'use strict';
const { runGates } = require('./verify-gates.js');

const REPO = 'E:/Projects/Melaka/etanah-pelupusan';
const V1_ONLY_PUSH = '08fc1f6795780869756ab946cd4abbfa67228e36'; // the bad push (v1 only)
const FIXED_PUSH = 'd85add1ec3f3d05bbbe6df92967282380857bd3d';   // after v2 merged

let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
const hasFail = (res, gate, needle) => res.findings.some(x => x.level === 'fail' && x.gate === gate && (!needle || x.msg.includes(needle)));

// CASE 1 — today's miss, replayed: only v1 mapped, HEAD = the v1-only push
const res1 = runGates({ repo: REPO, headRef: V1_ONLY_PUSH, tickets: [{ ticket: '275539', src: 'mlk/training/275539' }] });
t('CASE 1 (pre-fix state): sibling-sweep FAILS on mlk/training/275539v2', hasFail(res1, 'sibling-sweep', '275539v2'));

// CASE 2 — corrected state: both mapped, HEAD = the fixed push → no 275539 FAIL findings
const res2 = runGates({
  repo: REPO, headRef: FIXED_PUSH,
  tickets: [{ ticket: '275539', src: 'mlk/training/275539' }, { ticket: '275539v2', src: 'mlk/training/275539v2' }],
});
t('CASE 2 (post-fix state): no FAIL finding mentions 275539', !res2.findings.some(x => x.level === 'fail' && x.msg.includes('275539')));

// CASE 3 — vN key normalization: mapping only v2 still sweeps the base number's branches
const res3 = runGates({ repo: REPO, headRef: FIXED_PUSH, tickets: [{ ticket: '275539v2', src: 'mlk/training/275539v2' }] });
t('CASE 3 (v2-only mapped): base v1 branch contained in release => no sibling-sweep FAIL', !hasFail(res3, 'sibling-sweep'));

console.log(`\n${pass} pass · ${fail} fail`);
process.exit(fail ? 1 : 0);
