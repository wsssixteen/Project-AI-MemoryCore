#!/usr/bin/env node
// kpi.eval.js — fixtures for domain/kpi/kpi.js (fire = exit code, effect = the text and files it leaves).
// Runs every case in a throwaway --root; the real ledger and log are never touched.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const KPI = path.join(__dirname, 'kpi.js');
const REPO = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d: c ? '' : d }); }
function fresh() { return fs.mkdtempSync(path.join(os.tmpdir(), 'kpi-eval-')); }
function run(root, args) {
  const r = spawnSync(process.execPath, [KPI, ...args, '--root', root], { encoding: 'utf8', env: Object.assign({}, process.env, { KPI_LOG: path.join(root, 'log.jsonl') }) });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const ok = ['--competency', 'B4', '--what', 'Found the fix had never reached release 1.8.4.', '--evidence', 'commit 6feb2525c6 not in origin/mlk/master'];
const ledger = root => path.join(root, 'main', 'kpi-moments.jsonl');
const view = root => path.join(root, 'main', 'kpi-tracker.md');

// 1-2 happy path + ticket normalisation
let R = fresh(), r = run(R, ['add', '--ticket', 'QA-246964', ...ok]);
check('01 add a good row → exit 0 + PASS', r.code === 0 && /self-audit: PASS/.test(r.out), r.out);
check('02 QA-246964 stored as #246964', /"ticket":"#246964"/.test(fs.readFileSync(ledger(R), 'utf8')), fs.readFileSync(ledger(R), 'utf8'));
check('03 view lists the row under B4', /## B4 — Ownership & Initiative[\s\S]*\| #246964 \| Found the fix/.test(fs.readFileSync(view(R), 'utf8')), 'row missing from view');
// 4 duplicate
r = run(R, ['add', '--ticket', '#246964', ...ok]);
check('04 same row again → refused exit 2', r.code === 2 && /already in the ledger/.test(r.out), r.out);
// 5-10 refusals
r = run(R, ['add', '--ticket', '#1', ...ok]);
check('05 malformed ticket refused', r.code === 2 && /must be #NNNNNN/.test(r.out), r.out);
r = run(R, ['add', '--ticket', '#265109', '--competency', 'B9', '--what', 'x', '--evidence', '#265109 journal']);
check('06 unknown competency refused', r.code === 2 && /must be one of B1/.test(r.out), r.out);
r = run(R, ['add', '--ticket', '#265109', '--competency', 'C2', '--what', 'Traced it. Then fixed it.', '--evidence', '#265109 journal']);
check('07 two sentences refused', r.code === 2 && /more than one sentence/.test(r.out), r.out);
r = run(R, ['add', '--ticket', '#265109', '--competency', 'C2', '--what', 'Traced it.', '--evidence', 'trust me']);
check('08 evidence with no pointer refused', r.code === 2 && /no checkable pointer/.test(r.out), r.out);
r = run(R, ['add', '--ticket', '#265109', '--competency', 'C2', '--what', 'Traced it.', '--evidence', 'the defaced build']);
check('09 hex-looking word without a digit is not a commit', r.code === 2 && /no checkable pointer/.test(r.out), r.out);
r = run(R, ['add', '--date', '2999-01-01', '--ticket', '#265109', '--competency', 'C2', '--what', 'Traced it.', '--evidence', '#265109 journal']);
check('10 future date refused', r.code === 2 && /in the future/.test(r.out), r.out);
// 11-12 names
r = run(R, ['add', '--ticket', '#265109', '--competency', 'B6', '--what', 'Took over the fix from Nurul Amirah Nadiah.', '--evidence', '#265109 journal']);
check('11 a colleague named by full name refused', r.code === 2 && /names a person/.test(r.out), r.out);
r = run(R, ['add', '--ticket', '#265109', '--competency', 'B6', '--what', 'Ahmad Ridhwan Anuar reviewed and took over a colleague\'s fix.', '--evidence', '#265109 journal']);
check('12 his own name is allowed', r.code === 0, r.out);
// 13-15 accepted forms
r = run(R, ['add', '--ticket', 'none', '--competency', 'B5', '--what', 'Wrote the release hand-over, e.g. the BA reply set.', '--evidence', 'main/handoff-2026-10-05-boot-structure-audit.md']);
check('13 ticket none + "e.g." is one sentence + path evidence', r.code === 0, r.out);
r = run(R, ['add', '--ticket', 'adhoc-prbb-2026-5', '--competency', 'C2', '--what', 'Found the sibling pihak with the same null.', '--evidence', 'MlkBorang4CeForm.java:477']);
check('14 ADHOC id uppercased, file:line evidence', r.code === 0 && /ADHOC-PRBB-2026-5/.test(fs.readFileSync(ledger(R), 'utf8')), r.out);
r = run(R, ['add', '--ticket', '#265109', '--competency', 'C2', '--what', 'Proved the regression at runtime.', '--evidence', 'et_sistem_mlit.pt_application_ex_entity rows 419180-419183 | c162244010']);
check('15 a pipe in evidence is escaped and the view stays in sync', r.code === 0 && /\\\|/.test(fs.readFileSync(view(R), 'utf8')), r.out);
// 16-19 self-audit catches drift
fs.appendFileSync(view(R), 'hand edit\n');
r = run(R, ['audit']);
check('16 hand edit of the view → audit FAIL exit 1 naming render', r.code === 1 && /out of sync[\s\S]*kpi\.js render/.test(r.out), r.out);
r = run(R, ['render']);
check('17 render restores sync → PASS', r.code === 0 && /PASS/.test(r.out), r.out);
fs.appendFileSync(ledger(R), JSON.stringify({ date: '2026-10-22', ticket: '#262027', competency: 'B2', what: 'Own rework came back.', evidence: 'commit 54f4b645b4' }) + '\n');
r = run(R, ['audit']);
check('18 row appended by another session (union merge) → FAIL until render', r.code === 1 && /out of sync/.test(r.out), r.out);
fs.appendFileSync(ledger(R), '<<<<<<< HEAD\n');
r = run(R, ['render']);
check('19 a non-JSON ledger line → FAIL naming the line', r.code === 1 && /is not JSON/.test(r.out), r.out);
// 20 hand-edited bad row
R = fresh(); fs.mkdirSync(path.join(R, 'main'));
fs.writeFileSync(ledger(R), JSON.stringify({ date: '2026-10-01', ticket: '#262027', competency: 'X1', what: 'Bad code.', evidence: 'commit 54f4b645b4' }) + '\r\n');
r = run(R, ['render']);
check('20 hand-written row with a bad competency fails the audit (CRLF ledger parsed)', r.code === 1 && /competency "X1"/.test(r.out) && !/not JSON/.test(r.out), r.out);
// 21 fresh root
R = fresh(); r = run(R, ['audit']);
check('21 fresh root, no view yet → FAIL telling to render', r.code === 1 && /kpi\.js render/.test(r.out), r.out);
r = run(R, ['render']);
check('22 render on an empty ledger → PASS + every competency shows "No rows yet"', r.code === 0 && (fs.readFileSync(view(R), 'utf8').match(/_No rows yet\._/g) || []).length === 8, r.out);
// 23 list filter
R = fresh(); run(R, ['add', '--ticket', '#246964', ...ok]);
r = run(R, ['list', '--ticket', 'QA-246964']);
check('23 list --ticket QA-n finds the #n row', r.code === 0 && /1 row\(s\)/.test(r.out), r.out);
// 24 observability
const logRows = fs.readFileSync(path.join(R, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const addRow = logRows.find(x => x.cmd === 'add');
check('24 log row carries outcome · goal_met · dur_ms', addRow && addRow.outcome === 'pass' && addRow.goal_met === true && typeof addRow.dur_ms === 'number', JSON.stringify(logRows));
// 25 coverage warning (goal check)
check('25 coverage WARN names the competencies with no recent row', /no row in the last 90 days for B1 B2 B3 B5 B6 C1 C2/.test(run(R, ['audit']).out), 'no coverage warn');
// 26 usage
check('26 unknown command → exit 2', run(R, ['frobnicate']).code === 2, 'not 2');
// 27 merge rule
check('27 .gitattributes unions the ledger', /^main\/kpi-moments\.jsonl\s+merge=union/m.test(fs.readFileSync(path.join(REPO, '.gitattributes'), 'utf8')), 'no union line');
// 28 skill wiring
const skill = fs.readFileSync(path.join(REPO, '.claude', 'skills', 'kpi', 'SKILL.md'), 'utf8');
check('28 skill runs kpi.js add and the fix loop', /kpi\.js add/.test(skill) && /FAIL/.test(skill) && !/TODO\(forge\)/.test(skill), 'skill not filled');
const quest = fs.readFileSync(path.join(REPO, '.claude', 'skills', 'quest', 'SKILL.md'), 'utf8');
check('29 quest workflow invokes the kpi skill', /Skill: kpi/.test(quest), 'quest step missing');
check('30 NUKE-MARKER present', fs.existsSync(path.join(__dirname, 'NUKE-MARKER.md')), 'missing');

const fail = results.filter(x => !x.pass);
for (const x of results) console.log((x.pass ? 'PASS ' : 'FAIL ') + x.n + (x.pass ? '' : '\n      ' + String(x.d).slice(0, 300)));
console.log('kpi eval: ' + (results.length - fail.length) + '/' + results.length);
process.exit(fail.length ? 1 : 0);
