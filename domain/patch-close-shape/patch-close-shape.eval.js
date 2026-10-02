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
  ['26 malformed: greeting fence never closed → CHECK E advisory (not copy-safe)', j('x', '```\nHi infra, please assist. Thank you.\n#277291: x.'), true, /CHECK E/],
  // CHECK C — PROD patch routed to infra with no handoff (#281638 replay, 2026-09-28)
  ['C1 #281638 replay: send path to infra, PROD, no handoff', j('Checked against PROD today.', '| 2 | Send `C:\\Users\\R\\1. Tasks\\Melaka\\232. II #281638 - Pelupusan - PRBB - Papar Ralat selepas Klik Button hantar (PROD)\\2. Fix\\281638.sql` to infra. |'), true, /CHECK C/],
  ['C2 "Infra runs 281638.sql" PROD', 'PROD fix. Infra runs `2. Fix\\281638.sql` (1 row).', true, /CHECK C/],
  ['C3 hand to infra', 'Hand 281319.sql to infra for PROD.', true, /CHECK C/],
  ['C4 same text + correct handoff at end → pass', j('PROD. Send 281638.sql to infra.', GOOD), false, null],
  ['C5 same text + handoff wrong shape → CHECK A not C', j('PROD. Send 281638.sql to infra.', ['```', 'Hi infra, please assist. Thank you.', '', '#281638: x.', 'UPDATE a SET b=1;', '```'].join('\n')), true, /CHECK A/],
  ['C6 past tense: infra ran it (verify turn)', 'PROD verified: infra ran 281638.sql, 1 row updated.', false, null],
  ['C7 no PROD word (staging patch)', 'Send 281638.sql to infra for staging.', false, null],
  ['C8 no .sql named', 'PROD patch. Send it to infra.', false, null],
  ['C9 .sql + PROD, no infra route (miya runs locally)', 'PROD data in 281638.sql for review.', false, null],
  ['C10 bypass token', '[skip-patch-close-shape: review-only turn] Send 281638.sql to infra, PROD.', false, null],
  ['C11 lowercase prod word only', 'send 281638.sql to infra for prod', false, null],
  ['C12 5-digit sql name', 'PROD. Send 28163.sql to infra.', false, null],
  ['C13 infra in inline code only still routes', 'PROD. Send `281638.sql` to `infra`.', true, /CHECK C/],
  ['C14 routing verb on another line from infra', 'PROD 281638.sql.\nSend it.\nAsk infra later.', false, null],
  ['C15 handoff greeting only in prose (not fenced) → still missing', 'PROD. Send 281638.sql to infra. Start with Hi infra, please assist. Thank you.', true, /CHECK C/],
  ['C16 tilde-fenced handoff not recognised → still missing', j('PROD. Send 281638.sql to infra.', GOOD.replace(/```/g, '~~~')), true, /CHECK C/],
  ['C17 empty text', '', false, null],
  ['C18 Next-steps table row routes to infra', '| 2 | Forward 279882.sql to infra | "infra ran it" |\nEnv PROD', true, /CHECK C/],
  ['C19 "infra will run" future', 'PROD: infra will run 281638.sql tomorrow.', true, /CHECK C/],
  ['C20 hotfix doc patch without .sql', 'PROD: send the edited docx to infra.', false, null],
  ['C21 CHECK C marks block=true', 'PROD. Send 281638.sql to infra.', true, /CHECK C/],
  // CHECK D — #ticket one-liner length (#282721 replay, 2026-10-02)
  ['D1 #282721 replay: 15-word line', j('x', GOOD.replace('#277291: PLTP - patch data supaya tab Maklumat Tanah papar.', '#282721: PRBB - data patch untuk asingkan 4 bil fi pendua yang belum berbayar daripada permohonan')), true, /CHECK D/],
  ['D2 exactly 10 words passes', j('x', GOOD.replace('#277291: PLTP - patch data supaya tab Maklumat Tanah papar.', '#282721: PRBB - unlink 4 bil fi pendua dari ID permohonan')), false, null],
  ['D3 11 words fires', j('x', GOOD.replace('#277291: PLTP - patch data supaya tab Maklumat Tanah papar.', '#282721: a b c d e f g h i j k')), true, /CHECK D/],
  ['D4 D stays advisory', j('x', GOOD.replace('#277291: PLTP - patch data supaya tab Maklumat Tanah papar.', '#282721: a b c d e f g h i j k')), true, /^(?![\s\S]*CHECK C)/],
  // CHECK E — greeting outside a fence (#282721 replay)
  ['E1 #282721 replay: greeting + ticket unfenced, DML fenced', j('This handoff is for the unlink.', 'Hi infra, please assist. Thank you.\n#282721: PRBB - unlink bil pendua', '```sql\nUPDATE et_main.hsl_bayaran_fi SET aplikasi_id = NULL WHERE bayaran_fi_id IN (1);\n-- 1 row updated\n```'), true, /CHECK E/],
  ['E2 greeting line unfenced, nothing else', 'Hi infra, please assist. Thank you.', true, /CHECK E/],
  ['E3 greeting inside fence → no E', j('x', GOOD), false, null],
  ['E4 bypass token suppresses E', j('[skip-patch-close-shape: quoting format]', 'Hi infra, please assist. Thank you.'), false, null],
];
{ const rE = evaluate('Hi infra, please assist. Thank you.'); check('E5 CHECK E is advisory (block not set)', !rE.block, 'block=' + rE.block); }

{ const r0 = evaluate('PROD. Send 281638.sql to infra.'); check('C21b block flag set', r0.block === true, 'block=' + r0.block); }
{ const r1 = evaluate(j('x', GOOD, 'after')); check('C22 CHECK B stays advisory (block not set)', !r1.block, 'block=' + r1.block); }

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
