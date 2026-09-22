/**
 * eval.js — routine-wrap guard behaviour.
 * The motivating miss: a NEW ticket with no committed qa_doc must be caught so the
 * routine cannot silently "save" and leave a ticket un-resumable in a new worktree.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkNewTickets, parseIds } = require('../../quest/routine-wrap');

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`  ${cond ? '✓' : '✗'} ${name}`); };

// Fixture: 111 has a qa_doc; 222 has a dir but no .md; 333 absent entirely.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-eval-'));
fs.mkdirSync(path.join(tmp, 'QA-111'));
fs.writeFileSync(path.join(tmp, 'QA-111', 'QA-111.md'), '# Resume Point');
fs.mkdirSync(path.join(tmp, '222')); // dir, but no markdown inside

const r = checkNewTickets(['111', '222', '333'], tmp);
check('found ticket WITH a qa_doc (111)', r.found.includes('111'));
check('dir-without-md flagged missing (222)', r.missing.includes('222'));
check('absent ticket flagged missing (333)', r.missing.includes('333'));
check('parseIds strips QA- prefix + splits', JSON.stringify(parseIds('QA-273919, 274046')) === JSON.stringify(['273919', '274046']));
check('MISS CASE: new ticket lacking qa_doc is caught (guard would exit 1)', checkNewTickets(['999'], tmp).missing.length === 1);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${fail === 0 ? '✅' : '❌'} routine-wrap eval: ${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
