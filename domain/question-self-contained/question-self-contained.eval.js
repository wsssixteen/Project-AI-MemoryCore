#!/usr/bin/env node
// question-self-contained.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: Which conclusion lines should the page print? (The side-by-side table is in chat above: 25 steps, the line now and a simpler one.)
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'question-self-contained.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
const fire = stdin => spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env });
const ask = questions => fire(JSON.stringify({ tool_name: 'AskUserQuestion', tool_input: { questions } }));
const said = r => (r.stdout || '') + (r.stderr || '');

// F1: clean input → must NOT block (exit 0)
let r = fire('{}');
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2 and F3: THE TWO QUESTIONS OF 2026-10-13, word for word. He could answer neither from the popup.
const LINES = { question: 'Which conclusion lines should the page print? (The side-by-side table is in chat above: 25 steps, the line now and a simpler one.)', header: 'Lines', multiSelect: false, options: [
  { label: 'Simpler, keep the tests (Recommended)', description: "Every line takes the simpler wording, except that steps 8a to 8d, 9, 10b and 10d keep 'Test 1 ... Test 4 passed', so the four tests stay visible as one thread." },
  { label: 'All simpler', description: "Every line takes the simpler wording from the table. The words 'Test 1' to 'Test 4' disappear from the lines." },
  { label: 'Keep as they are', description: 'No line changes. The simpler column is dropped.' }] };
const EDGE = { question: "The own-words box is waiting at the viewer's own 'Use Claude' dialog in the open Edge tab (a test remark is typed under question 7a). Only you can grant that. What now?", header: 'Own words', multiSelect: false, options: [
  { label: 'I pressed Continue', description: 'I then look at that tab and report what the page did with the remark.' },
  { label: 'Not now', description: 'The box stays as built and tested outside the viewer; the live check waits.' },
  { label: 'Take the box out', description: 'The page goes back to yes and no only; nothing is sent to an assistant.' }] };
r = ask([LINES]);
check('F2 the question about lines he could not see ("the table is in chat above") is BLOCKED', r.status === 2 && /"(in chat|above)"/.test(said(r)) && /popup hides the chat/.test(said(r)), 'exit=' + r.status + ' ' + said(r).slice(0, 120));
r = ask([EDGE]);
check('F3 the question about a dialog in a browser tab he was not looking at is BLOCKED', r.status === 2 && /another window or tab/.test(said(r)), 'exit=' + r.status + ' ' + said(r).slice(0, 120));
r = ask([LINES, EDGE]);
check('F4 both together: both are named in one block', r.status === 2 && /question 1/.test(said(r)) && /question 2/.test(said(r)), 'exit=' + r.status);

// F5: the pointer taken out is not enough: he is still asked to choose between lines that are not shown
r = ask([Object.assign({}, LINES, { question: 'Which conclusion lines should the page print?' , options: LINES.options.map(o => ({ label: o.label, description: 'One of the three sets.' })) })]);
check('F5 a choice between lines that are not shown is BLOCKED even with no pointing word', r.status === 2 && /not shown/.test(said(r)), 'exit=' + r.status + ' ' + said(r).slice(0, 120));

// F6: the same question made answerable: each option SHOWS its lines in a preview → passes
r = ask([{ question: 'Which conclusion lines should the page print?', header: 'Lines', multiSelect: false, options: [
  { label: 'Simpler', description: 'Shorter words.', preview: 'Step 2: There was never nothing.\nStep 3: The universe began. So it is not the thing that always was.' },
  { label: 'As now', description: 'No change.', preview: 'Step 2: Something has always existed.\nStep 3: The universe began. It is not what always existed, so something other than it did.' }] }]);
check('F6 the same choice with the lines shown in each option passes', r.status === 0, 'exit=' + r.status + ' ' + said(r).slice(0, 120));

// F7: an ordinary question whose labels ARE the candidates passes
r = ask([{ question: 'Which name should the tab of the page carry?', header: 'Name', multiSelect: false, options: [{ label: 'A walk by reason', description: 'The name it has now.' }, { label: 'Reason to Islam', description: 'The name of the project.' }] }]);
check('F7 a question that carries its own candidates passes', r.status === 0, 'exit=' + r.status + ' ' + said(r).slice(0, 120));

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12: opposing / out-of-spec cases, each with its verdict.
//  1. its own block text read back as a question: it reads tool_input only, never the transcript → handled.
//  2. malformed JSON on stdin → fixture A1 (must not block).
//  3. no "questions", or not a list → fixture A2 (must not block).
//  4. the word "above" inside a PREVIEW (content shown to him, not a pointer) → fixture A3 (must not block).
//  5. another tool reaching this hook by a loose matcher → fixture A4 (must not block).
//  6. a quoted candidate in the description instead of a preview ("...") counts as shown → fixture A5 (must not block).
//  7. "above" in an honest sense ("above 5 MB") → it blocks; accepted-risk: rewording costs one line, a wrong pass costs his time.
//  8. a question in Malay that points up ("di atas") → not caught; accepted-risk: he is asked in English.
//  9. a question that truly needs him at another window ("press Continue in Edge") → blocked BY DESIGN: that is not a question, it is said in the reply.
// 10. the simplest instruction it could invert: batch-ask says "ask in the popup" and this gate blocks the popup → it never blocks a
//     question that shows its own content (F6, F7), and the block text says how to fix the question, so the popup stays usable.
// 11. two sessions / a worktree copy: no state is kept; ROOT falls back to the folder two levels up → handled.
r = fire('{not json');
check('A1 malformed stdin does not block', r.status === 0, 'exit=' + r.status);
r = fire(JSON.stringify({ tool_name: 'AskUserQuestion', tool_input: { questions: 'none' } }));
check('A2 a call with no list of questions does not block', r.status === 0, 'exit=' + r.status);
r = ask([{ question: 'Which of these two replies should the card carry?', header: 'Reply', multiSelect: false, options: [{ label: 'First', description: 'The short one.', preview: 'Was there ever a time with nothing at all? (see the verse above it on the card)' }, { label: 'Second', description: 'The long one.', preview: 'Had there been, would there be anything now?' }] }]);
check('A3 a pointing word inside a preview is content, not a pointer', r.status === 0, 'exit=' + r.status + ' ' + said(r).slice(0, 100));
r = fire(JSON.stringify({ tool_name: 'Read', tool_input: { questions: [LINES] } }));
check('A4 another tool is left alone', r.status === 0, 'exit=' + r.status);
r = ask([{ question: 'Which wording should step 2 print?', header: 'Step 2', multiSelect: false, options: [{ label: 'Now', description: 'It reads "Something has always existed."' }, { label: 'Simpler', description: 'It would read "There was never nothing."' }] }]);
check('A5 candidates quoted in the descriptions count as shown', r.status === 0, 'exit=' + r.status + ' ' + said(r).slice(0, 100));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nquestion-self-contained.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
