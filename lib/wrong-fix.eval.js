#!/usr/bin/env node
// lib/wrong-fix.eval.js — pins for the wrong-fix ledger (plan §9a/9b). Uses a throwaway qa_doc under a temp ROOT.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const SCRIPT = path.join(__dirname, 'wrong-fix.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'wrong-fix-eval-'));
const QA = 'QA-999998';
fs.mkdirSync(path.join(TMP, 'projects', 'coding-projects', 'active', QA), { recursive: true });
fs.mkdirSync(path.join(TMP, 'domain', 'quest-bounty'), { recursive: true });
fs.mkdirSync(path.join(TMP, 'system'), { recursive: true });
const DOC = path.join(TMP, 'projects', 'coding-projects', 'active', QA, QA + '.md');
fs.writeFileSync(DOC, '# ' + QA + '\n\n## Ticket Summary\nx\n\n## Notes\ny\n');
fs.writeFileSync(path.join(TMP, 'system', 'slips.jsonl'), JSON.stringify({ ts: new Date().toISOString(), type: 'slip', category: 'assume-not-verify', qa: QA, evidence: 'guessed the column' }) + '\n');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function run(args) { return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: TMP } }); }

let r = run(['add', QA, '--was', 'fix A', '--why', 'refuted by DB row', '--learned', 'rule X']);
check('F1 add → exit 0 + table row in qa_doc', r.status === 0 && /\| 1 \| \d{4}-\d{2}-\d{2} \| fix A \| refuted by DB row \| rule X \| \|/.test(fs.readFileSync(DOC, 'utf8')), r.stderr);
check('F1b Notes section preserved after the table', /## Notes\ny/.test(fs.readFileSync(DOC, 'utf8')), '');
r = run(['add', QA, '--was', 'fix B', '--why', 'w', '--learned', 'l']);
check('F2 second add → row 2', r.status === 0 && /\| 2 \|/.test(fs.readFileSync(DOC, 'utf8')), '');
r = run(['add', QA, '--was', 'fix C', '--why', 'w']);
check('F3 missing --learned → exit 2', r.status === 2, 'exit=' + r.status);
r = run(['pending', QA]);
check('F4 pending → exit 1 with 2 rows', r.status === 1 && /2 wrong-fix row/.test(r.stdout), r.stdout);
r = run(['today', QA]);
check('F5 today → exit 0', r.status === 0, 'exit=' + r.status);
r = run(['verdict', QA, '--row', '1', '--verdict', 'maybe']);
check('F6 bad verdict shape → exit 2', r.status === 2, 'exit=' + r.status);
r = run(['verdict', QA, '--row', '1', '--verdict', 'knowledge: BUG-BESTIARY.md']);
check('F7 verdict written into row 1', r.status === 0 && /\| 1 \|[^\n]*\| knowledge: BUG-BESTIARY.md \|/.test(fs.readFileSync(DOC, 'utf8')), '');
r = run(['upgrade-table', QA]);
check('F8 upgrade-table lists wrong-fix rows + the slip and names the unruled row', /wrong-fix \| 1/.test(r.stdout) && /wrong-fix \| 2/.test(r.stdout) && /slip \| s1/.test(r.stdout) && /1 wrong-fix row\(s\) unruled/.test(r.stdout), r.stdout.slice(0, 200));
r = run(['verdict', QA, '--row', '2', '--verdict', 'none: one-off typo']);
r = run(['pending', QA]);
check('F9 all ruled → pending exit 0', r.status === 0, 'exit=' + r.status);
const mirror = fs.readFileSync(path.join(TMP, 'domain', 'quest-bounty', 'log.jsonl'), 'utf8').trim().split('\n');
check('F10 mirror rows in quest-bounty log (2 adds + 2 verdicts)', mirror.length === 4, 'rows=' + mirror.length);
r = run(['add', 'QA-000000', '--was', 'a', '--why', 'b', '--learned', 'c']);
check('F11 no qa_doc → exit 2', r.status === 2, 'exit=' + r.status);
r = run(['add', 'not-a-ticket', '--was', 'a', '--why', 'b', '--learned', 'c']);
check('F12 bad ticket id → exit 2', r.status === 2, 'exit=' + r.status);
r = run(['add', QA, '--was', 'pipe | inside', '--why', 'w', '--learned', 'l']);
check('F13 pipe in text is escaped, table intact', r.status === 0 && /pipe \\\| inside/.test(fs.readFileSync(DOC, 'utf8')), '');
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nwrong-fix.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
