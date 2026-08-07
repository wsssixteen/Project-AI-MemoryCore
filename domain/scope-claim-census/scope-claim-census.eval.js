#!/usr/bin/env node
// scope-claim-census.eval.js — born via core/forge.js (2026-08-07)
//
// Rule-6-v1.2: prove the RED path FIRST, then green, then silent. A checker
// that can only ever return green is the exact failure this Feature exists to
// stop (main-memory 2026-08-04: "when I build a check, I must prove the RED
// path, not just watch it pass").
//
// Run: node domain/scope-claim-census/scope-claim-census.eval.js
'use strict';
const { evaluate } = require('./scope-claim-census.check.hook.js');

const PAD = ' '.repeat(420); // clear the 400-char short-reply short-circuit

const CASES = [
  // ── RED — must BLOCK. These are the verbatim slips from 2026-08-07 #273455.
  {
    name: 'RED replay — "no other urusan" with zero census',
    text: 'Scope answer.' + PAD + '\nNo other urusan collects sempadan on the public side, so nothing needs widening.',
    want: 'blocked',
  },
  {
    name: 'RED — "the only caller", no count',
    text: 'Blast radius.' + PAD + '\nThis is the only caller of the method, so the change is contained.',
    want: 'blocked',
  },
  {
    name: 'RED — "it is only PT", no denominator',
    text: 'Answering the scope question.' + PAD + '\nIt is only PT, so the guard is right as written.',
    want: 'blocked',
  },
  {
    name: 'RED — "nothing else is affected"',
    text: 'Change summary.' + PAD + '\nNothing else is affected by this edit.',
    want: 'blocked',
  },
  {
    name: 'RED — "only PSBS uses" form',
    text: 'Routing note.' + PAD + '\nOnly PSBS uses that writer, so the rest are safe.',
    want: 'blocked',
  },

  // ── GREEN — claim present AND census cited.
  {
    name: 'GREEN — denominator count',
    text: 'Scope answer.' + PAD + '\nNo other urusan loses it — the counter arm lost 0 of 102 rows.',
    want: 'passed',
  },
  {
    name: 'GREEN — the query itself',
    text: 'Scope answer.' + PAD + '\nThe only table involved is umm_p_hkmlk. SELECT kod, count(*) FROM et_main.umm_p_hkmlk GROUP BY kod',
    want: 'passed',
  },
  {
    name: 'GREEN — grepped + N call-sites',
    text: 'Blast radius.' + PAD + '\nNo other caller exists — grepped populateMaklumatTanahVOListFromAppHakmilik -> 13 call-sites.',
    want: 'passed',
  },
  {
    name: 'GREEN — explicit zero result',
    text: 'Absence check.' + PAD + '\nThe only screen binding it is this one; the sweep returned 0 matches elsewhere.',
    want: 'passed',
  },

  // ── SILENT — must not fire at all.
  {
    name: 'SILENT — short reply',
    text: 'Only PT. Done.',
    want: 'silent',
  },
  {
    name: 'SILENT — bypass token',
    text: 'Scope note.' + PAD + '\nNo other urusan is affected. [skip-scope-census: PROD unreachable this session]',
    want: 'silent',
  },
  {
    name: 'SILENT — casual "only", no system noun',
    text: 'Progress note.' + PAD + '\nIt only took a moment, and I only had to touch the guard once.',
    want: 'silent',
  },
  {
    name: 'SILENT — the claim is a QUOTE, not my assertion',
    text: 'Relaying his words.' + PAD + '\n> No other urusan matters here.\nI will verify that before acting on it.',
    want: 'silent',
  },
  {
    name: 'SILENT — Domain Expansion turn',
    text: '═══ [ Domain Expansion ] ═══' + PAD + '\nNo other urusan is affected.',
    want: 'silent',
  },
];

let pass = 0;
const fails = [];
for (const c of CASES) {
  const got = evaluate(c.text).verdict;
  if (got === c.want) pass++;
  else fails.push(`${c.name}\n       want=${c.want}  got=${got}`);
}

const redCases = CASES.filter(c => c.want === 'blocked');
const redPass = redCases.filter(c => evaluate(c.text).verdict === 'blocked').length;

console.log(`scope-claim-census.eval: ${pass}/${CASES.length} green`);
console.log(`  RED path proven: ${redPass}/${redCases.length} blocking cases actually block`);

if (redPass === 0) {
  console.log('FAIL: no RED case blocks — this checker can only return green.');
  process.exit(1);
}
if (fails.length) {
  console.log('FAILURES:');
  fails.forEach(f => console.log('  - ' + f));
  process.exit(1);
}
process.exit(0);
