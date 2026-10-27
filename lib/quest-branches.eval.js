#!/usr/bin/env node
// Eval for lib/quest-branches.js (offline cases). Live check: node lib/quest-branches.js 264355
const { missingBranches, moduleLabel, table } = require('./quest-branches.js');

const B = [{ module: 'Awam', branch: 'mlk/qa/264355v2', tip: '7544d52688', subject: 's', intEnv: 'yes', stagEnv: 'no', trunk: 'no' },
           { module: 'Pelupusan', branch: 'mlk/qa/264355', tip: '2736c9a0be', subject: 's', intEnv: 'no', stagEnv: 'no', trunk: 'no' }];
const cases = [
  ['no section -> every branch missing', () => { const r = missingBranches('# QA\n## Debugging\nx', B); return !r.section && r.missing.length === 2; }],
  ['both named -> nothing missing', () => missingBranches('## Branches\n| Awam | `mlk/qa/264355v2` |\n| Pelupusan | `mlk/qa/264355` |\n', B).missing.length === 0],
  ['only Awam named -> Pelupusan missing', () => { const r = missingBranches('## Branches\n| Awam | `mlk/qa/264355v2` |\n## Next\nmlk/qa/264355 named outside the section', B); return r.missing.length === 1 && r.missing[0] === 'mlk/qa/264355'; }],
  ['v2 name does not satisfy the plain name', () => missingBranches('## Branches\nmlk/qa/264355v2\n', [B[1]]).missing.length === 1],
  ['section at end of file is read', () => missingBranches('# QA\n## Branches\nmlk/qa/264355v2 mlk/qa/264355', B).missing.length === 0],
  ['module labels', () => moduleLabel('etanah-awam') === 'Awam' && moduleLabel('etanah-pelupusan') === 'Pelupusan' && moduleLabel('etanah-common') === 'Common'],
  ['table labels each branch with its module', () => { const t = table(B); return t.includes('`mlk/qa/264355v2` (Awam)') && t.includes('`mlk/qa/264355` (Pelupusan)'); }],
  ['empty -> explicit no-branch row', () => table([]).includes('no ticket branch in any repo')],
];
let pass = 0;
for (const [name, fn] of cases) { let ok = false; try { ok = !!fn(); } catch (e) { ok = false; } console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (ok) pass++; }
console.log(`quest-branches eval: ${pass}/${cases.length}`);
process.exit(pass === cases.length ? 0 : 1);
