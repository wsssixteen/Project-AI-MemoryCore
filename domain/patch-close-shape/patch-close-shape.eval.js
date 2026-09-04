#!/usr/bin/env node
// patch-close-shape.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: #277291 PROD data-patch close-out — handoff verbose, then at top not end, then blank
// line between greeting and #ticket — 3 corrections by miya.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'patch-close-shape.check.hook.js');
const { evaluate } = require(HOOK);

const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d: d || '' }); }

// F1: empty stdin → hook must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 empty stdin exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

const GOOD = [
  '```',
  'Hi infra, please assist. Thank you.',
  '#277291: PLTP - patch data supaya tab Maklumat Tanah papar.',
  '',
  "UPDATE et_main.umm_a_permohonan_tnh SET mklmt_tmbhn = '{...}'",
  "WHERE aplikasi_id = (SELECT aplikasi_id FROM et_main.umm_aplikasi WHERE id_pengenalan = 'PTPK/03/E/PLTP/2026/28');",
  '-- 1 row updated',
  '```',
].join('\n');
const j = (...p) => p.join('\n\n');

// [name, text, expectFire, matchOrNull] — the >=20 adversarial/out-of-spec scenarios (Rule 12).
const CASES = [
  // happy path
  ['1 correct + last', j('Bottom line.', GOOD), false, null],
  ['2 no handoff (non-patch reply)', j('Normal answer.', '```sql\nSELECT 1;\n```'), false, null],
  ['3 DO THIS before, handoff last', j('*DO THIS:*\n1. send', GOOD), false, null],
  // CHECK A — adjacency
  ['4 blank line between greeting/#ticket', j('x', ['```', 'Hi infra, please assist. Thank you.', '', '#277291: x.', '', 'UPDATE et_main.umm_a_x SET a=1;', '```'].join('\n')), true, /CHECK A/],
  ['5 prose line between', j('x', ['```', 'Hi infra, please assist. Thank you.', 'Please run.', '#277291: x.', '', 'UPDATE et_main.umm_a_x SET a=1;', '```'].join('\n')), true, /CHECK A/],
  ['6 no #ticket line', j('x', ['```', 'Hi infra, please assist. Thank you.', '', 'UPDATE et_main.umm_a_x SET a=1;', '```'].join('\n')), true, /CHECK A/],
  ['7 #ticket empty after colon', j('x', ['```', 'Hi infra, please assist. Thank you.', '#277291:', '', 'UPDATE et_main.umm_a_x SET a=1;', '```'].join('\n')), true, /CHECK A/],
  // CHECK B — handoff-last
  ['8 content after handoff', j(GOOD, 'And more explanation.'), true, /CHECK B/],
  ['9 handoff at top, big body after', j(GOOD, 'Root cause: ...', 'Evidence: ...'), true, /CHECK B/],
  ['10 non-infra fenced block after (diff)', j(GOOD, '```diff\n- a\n+ b\n```'), true, /CHECK B/],
  ['11 both A and B wrong', j(['```', 'Hi infra, please assist. Thank you.', '', '#277291: x.', 'UPDATE et_main.umm_a_x SET a=1;', '```'].join('\n'), 'trailing prose'), true, /CHECK A[\s\S]*CHECK B|CHECK B[\s\S]*CHECK A/],
  // adversarial / out-of-spec
  ['12 bypass token present', j('[skip-patch-close-shape: comparison turn]', GOOD, 'text after'), false, null],
  ['13 greeting in prose only, no fence', 'The handoff starts with "Hi infra, please assist. Thank you." then the ticket.', false, null],
  ['14 greeting in inline-code span', 'Use `Hi infra, please assist. Thank you.` as line 1 of the block.', false, null],
  ['15 two handoff fences, last correct+last', j('Before:', GOOD.replace('#277291', '#0000'), 'After:', GOOD), false, null],
  ['16 two handoff fences, last one wrong', j('Before:', GOOD, 'After:', ['```', 'Hi infra, please assist. Thank you.', '', '#277291: x.', 'UPDATE et_main.umm_a_x SET a=1;', '```'].join('\n')), true, /CHECK A/],
  ['17 empty text', '', false, null],
  ['18 whitespace-only trailer', j(GOOD) + '\n\n   \n\t\n', false, null],
  ['19 md-punctuation-only trailer (---,***)', j(GOOD, '---', '***'), false, null],
  ['20 different casing greeting still matched, correct+last', j('x', GOOD.replace('Hi infra, please assist. Thank you.', 'hi infra, PLEASE assist. thank you.')), false, null],
  ['21 CRLF line endings, correct', j('x', GOOD).replace(/\n/g, '\r\n'), false, null],
  ['22 tilde fences (~~~) not treated as handoff', j('x', GOOD.replace(/```/g, '~~~')), false, null],
  ['23 empty trailing fenced block accepted (no substantive content; cf. case 10)', j(GOOD) + '\n```\n   \n```', false, null],
  ['24 very long reply, handoff correct at end', j('x'.repeat(5000), GOOD), false, null],
  ['25 short multi-digit ticket', j('x', GOOD.replace('#277291:', '#12:')), false, null],
  ['26 malformed: greeting fence never closed', j('x', '```\nHi infra, please assist. Thank you.\n#277291: x.'), false, null],
];

for (const [name, text, expectFire, match] of CASES) {
  const { fire, advisories } = evaluate(text);
  const joined = advisories.join('\n');
  let ok = fire === expectFire;
  if (ok && match) ok = match.test(joined);
  check(name, ok, `expectFire=${expectFire} got=${fire}` + (match ? ` match=${match}` : ''));
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\npatch-close-shape.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
