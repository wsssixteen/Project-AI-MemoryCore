#!/usr/bin/env node
// Eval for branch-ledger-check — born WITH the component. Deterministic: exercises the PURE
// parse + decide functions, no live git / no disk. Run: node quest/branch-ledger-check.eval.js
const { parseLedgerText, evaluate } = require('./branch-ledger-check.js');

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}  ${detail}`); }
};

// ---- PARSE tests (the greppable ledger format + variants) ----
const led = `
### Ledger rows
    mlk/esokongan/273461   — NEGATIVE  — v1 slice → delete
    mlk/esokongan/273461v2 — NEGATIVE  — v2 slice → delete
    mlk/esokongan/273461v4 — CANONICAL — all 3 commits
`;
let rows = parseLedgerText(led);
check('P1 parses em-dash CANONICAL', rows['mlk/esokongan/273461v4'] === 'CANONICAL', JSON.stringify(rows));
check('P2 parses NEGATIVE rows', rows['mlk/esokongan/273461'] === 'NEGATIVE' && rows['mlk/esokongan/273461v2'] === 'NEGATIVE');
check('P3 hyphen + symbol + lowercase', parseLedgerText('mlk/qa/265537v3 - +add - note')['mlk/qa/265537v3'] === 'ADD');
check('P4 pipe-table cell also parses', parseLedgerText('| mlk/internal/268510 | ~CHANGE | x |')['mlk/internal/268510'] === 'CHANGE');
check('P5 ignores prose without a tag', Object.keys(parseLedgerText('this branch mlk/esokongan/273461v3 is wrong')).length === 0);

// ---- DECIDE tests (positive / negative / extra) ----
// POSITIVE — stacked + all classified
let r = evaluate(['mlk/esokongan/273461', 'mlk/esokongan/273461v2', 'mlk/esokongan/273461v4'],
  { 'mlk/esokongan/273461': 'NEGATIVE', 'mlk/esokongan/273461v2': 'NEGATIVE', 'mlk/esokongan/273461v4': 'CANONICAL' });
check('POS stacked+classified → ok', r.ok === true && r.stacked === true && r.missing.length === 0);
check('POS negatives-alive surfaced', r.negativesAlive.length === 2, JSON.stringify(r.negativesAlive));

// NEGATIVE — stacked, one branch unclassified → fail
r = evaluate(['mlk/esokongan/273461v3', 'mlk/esokongan/273461v4'], { 'mlk/esokongan/273461v4': 'CANONICAL' });
check('NEG unclassified branch → NOT ok', r.ok === false && r.missing.includes('mlk/esokongan/273461v3'), JSON.stringify(r));

// NEGATIVE — stacked, empty ledger (quest MD missing) → all missing
r = evaluate(['mlk/esokongan/273461', 'mlk/esokongan/273461v2'], {});
check('NEG empty ledger on a stack → all missing', r.ok === false && r.missing.length === 2);

// EXTRA — single non-vN branch → ledger not required
r = evaluate(['mlk/internal/268510'], {});
check('X1 single plain branch → ok, not stacked', r.ok === true && r.stacked === false);

// EXTRA — single vN branch still requires a tag (a lone v2 means a v1 was abandoned)
r = evaluate(['mlk/esokongan/999999v2'], {});
check('X2 lone vN branch → stacked, requires tag', r.stacked === true && r.ok === false);

// EXTRA — no branches at all → ok, nothing to enforce
r = evaluate([], {});
check('X3 no branches → ok', r.ok === true && r.stacked === false);

// EXTRA — extra tag in ledger for a non-existent branch does not break a clean pass
r = evaluate(['mlk/esokongan/273461v4'], { 'mlk/esokongan/273461v4': 'CANONICAL', 'mlk/esokongan/273461v9': 'NEGATIVE' });
check('X4 stray ledger row ignored', r.ok === true);

console.log(`\n${fail === 0 ? '✅' : '🚨'} branch-ledger-check eval: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
