#!/usr/bin/env node
// eval.js — next-steps-shape back gate (pre-reply-contract.discipline.hook.js)
// Replay: 2026-09-30 miya "not sure what you're talking about ... next steps without short explanation."
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'next-steps-shape.check.hook.js');
const results = [];
function run(text) { return spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ _testText: text }), encoding: 'utf8', timeout: 30000 }); }
function check(n, cond, d) { results.push({ n, pass: !!cond, d }); }

// N1 — the EXACT table miya flagged (no meaning column) → BLOCK
const flagged = 'Done.\n\n**Next steps**\n\n| # | Action | Your reply |\n|---|---|---|\n| 1 | Rule the 11 overdue watches (ok or anomaly) | "resolve watches" / "later" |\n| 2 | PPJK and PSBS guards at line 647: fix in a future release or leave as reference | "fix later" / "leave" |\n';
let r = run(flagged);
check('N1 2026-09-30 flagged table (no meaning column) → block', r.status === 2 && /What it means/.test(r.stderr) && /DELTA ONLY/.test(r.stderr), 'exit=' + r.status);

// P1 — same items with a plain meaning column → pass
const fixed = 'Done.\n\n## 1. Check 11 recent system changes\nThey wait for your ok.\n\n## 2. The PPJK and PSBS permit bug\nNothing on PROD yet.\n\n**Next steps**\n\n| # | Action | What it means | Your reply |\n|---|---|---|---|\n| 1 | Check 11 recent system changes | Each change I made is on a list to confirm it behaves; I need your ok to mark them checked. | "check them" / "later" |\n| 2 | PPJK and PSBS permit bug | Two urusan could give out a permit number too early; nothing has happened on PROD yet. | "fix later" / "leave" |\n';
r = run(fixed);
check('P1 meaning column with plain sentences → pass', r.status === 0, 'exit=' + r.status + ' ' + r.stderr);

// N2 — meaning column present but one cell is a 2-word stub → block naming the row
const stub = '**Next steps**\n\n| # | Action | What it means | Your reply |\n|---|---|---|---|\n| 1 | Resolve watches | overdue watches | "ok" |\n| 2 | Something | This row has a proper plain explanation here. | "yes" |\n';
r = run(stub);
check('N2 2-word meaning cell → block naming row 1', r.status === 2 && /: 1\b/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr);

// P2 — no Next steps section at all → pass (presence is the injector's job)
r = run('Plain answer with no table at all, which is fine for a yes/no question.');
check('P2 no Next steps → pass', r.status === 0, 'exit=' + r.status);

// P3 — bypass token honoured
r = run(flagged + '\n[skip-next-steps-shape: miya asked for a bare list]');
check('P3 bypass → pass', r.status === 0, 'exit=' + r.status);

// P4 — Next steps table inside a code fence (quoted example) → ignored → pass
r = run('Example:\n```\n**Next steps**\n| # | Action | Your reply |\n|---|---|---|\n| 1 | x | y |\n```\n');
check('P4 fenced example ignored → pass', r.status === 0, 'exit=' + r.status);

// P5 — "## Next steps" markdown heading with good table → pass
r = run('## 1. Publish on staging\nThe fix is ready for the BA.\n\n## Next steps\n\n| # | Action | Why | Your reply |\n|---|---|---|---|\n| 1 | Publish on staging | So the BA can test the fix on the real flow. | "published" |\n');
check('P5 ## heading + Why column → pass', r.status === 0, 'exit=' + r.status + ' ' + r.stderr);

// N3 — 2026-10-14, his exact reply: the row "End the old download goal" has no section above (headings: where we are, what's left) → block
const his = 'Those last few replies answered an automatic check on your old goal.\n\n## Where we are\n\n| Done today | Where it is |\n|---|---|\n| Change an earlier answer | Version 47 |\n\n## What\'s left\n\n| Waiting on you | Then I do |\n|---|---|\n| How much the page may collect | Nothing if A |\n\n**Next steps**\n\n| # | Action | What it means | Your reply |\n|---|---|---|---|\n| 1 | End the old download goal | It is met; ending it stops the repeated checks | end it yourself |\n| 2 | How much the page may collect | A keeps nothing and costs nothing | "A", "B" or "C" |\n';
r = run(his);
check('N3 2026-10-14 row with no section above → block naming it', r.status === 2 && /no section above/.test(r.stderr) && /download goal/.test(r.stderr) && !/collect/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr);

// P7 — the same reply with the row's own heading → pass
r = run(his.replace('## Where we are', '## 1. The old download goal\nIt is met. Clearing it stops the checks.\n\n## Where we are'));
check('P7 same reply, the row has its own heading → pass', r.status === 0, 'exit=' + r.status + ' ' + r.stderr);

// P8 — a short reply with no headings whose text names the row → pass
r = run('The fix is ready to publish on staging today.\n\n**Next steps**\n\n| # | Action | What it means | Your reply |\n|---|---|---|---|\n| 1 | Publish on staging | The BA can then test the fix on the real flow. | "go" |\n');
check('P8 no headings, row words in the text above → pass', r.status === 0, 'exit=' + r.status + ' ' + r.stderr);

// ── v3: quest reply that asks him to decide carries a picture (2026-10-29 miya on 286655) ──
function runP(text, turn, tickets, extra) { return spawnSync(process.execPath, [HOOK], { input: JSON.stringify(Object.assign({ _testText: text, _testTurn: turn, _testTickets: tickets }, extra || {})), encoding: 'utf8', timeout: 30000 }); }
const TK = ['286655', '262027'];
const quest = '## 4. OMLPS decision\nNo OMLPS app sits at PB on STG1, so 286655 OMLPS cannot be tested in the browser.\n\n## Next steps\n\n| # | Action | What it means | Your reply |\n|---|---|---|---|\n| 1 | OMLPS decision | No OMLPS app is ready to test, so either we create one or you accept the risk. | New app / Accept risk |\n';
const png = { kind: 'tool', name: 'SendUserFile', input: '{"files":["C:\\\\x\\\\286655-decide.png"]}' };
r = runP(quest, [{ kind: 'text', text: 'x' }], TK);
check('Q1 the 2026-10-29 286655 reply, no picture this turn → block naming the ticket', r.status === 2 && /286655/.test(r.stderr) && /explain-diagram/.test(r.stderr) && /DELTA ONLY/.test(r.stderr), 'exit=' + r.status + ' ' + r.stderr);
r = runP(quest, [png], TK);
check('Q2 same reply, PNG sent with SendUserFile this turn → pass', r.status === 0, 'exit=' + r.status + ' ' + r.stderr);
r = runP(quest + '\nDiagram: none (commit go-ahead only; the picture went out last turn)\n', [], TK);
check('Q3 Diagram: none (<reason>) line → pass', r.status === 0, 'exit=' + r.status);
r = runP(quest + '\nDiagram: none ()\n', [], TK);
check('Q4 Diagram: none with an empty reason → block', r.status === 2, 'exit=' + r.status);
r = runP(quest.replace(/286655/g, '111111'), [], TK);
check('Q5 ticket not an active quest → pass', r.status === 0, 'exit=' + r.status);
r = runP(quest, [], []);
check('Q6 no active quests at all → pass', r.status === 0, 'exit=' + r.status);
r = runP('286655 is on staging now.', [], TK);
check('Q7 v4: quest reply with no Next steps table and no picture → block', r.status === 2 && /286655/.test(r.stderr), 'exit=' + r.status);
r = runP('287273 Phase 0 done: the portal lists each owner row as one name.', [png], ['287273']);
check('Q17 v4: quest reply with no Next steps, picture sent → pass', r.status === 0, 'exit=' + r.status + ' ' + r.stderr);
r = runP('Your yes/no: yes, 287273 is ours.\nDiagram: none (yes/no answer; the issue picture went out last turn)', [], ['287273']);
check('Q18 v4: short quest answer with a Diagram: none line → pass', r.status === 0, 'exit=' + r.status);
r = runP(quest.replace(/286655/g, '1286655'), [], TK);
check('Q8 ticket number only inside a longer number → pass', r.status === 0, 'exit=' + r.status);
r = runP(quest, [{ kind: 'tool', name: 'SendUserFile', input: '{"files":["C:\\\\x\\\\286655.sql"]}' }], TK);
check('Q9 a non-image file sent → still block', r.status === 2, 'exit=' + r.status);
r = runP(quest, [{ kind: 'tool', name: 'Read', input: '{"file_path":"C:\\\\x\\\\286655-decide.png"}' }], TK);
check('Q10 PNG only Read, never sent → block', r.status === 2, 'exit=' + r.status);
r = runP(quest, [], TK, { stop_hook_active: true });
check('Q11 second stop in the same turn (stop_hook_active) → pass, blocks once only', r.status === 0, 'exit=' + r.status);
r = runP(quest + '\n[skip-next-steps-shape: miya asked for text only]', [], TK);
check('Q12 bypass token → pass', r.status === 0, 'exit=' + r.status);
r = runP('Example:\n```\n## Next steps\n| # | Action | What it means | Your reply |\n|---|---|---|---|\n| 1 | 286655 | a b c d e f | x |\n```\nNoted.', [], TK);
check('Q13 ticket named only inside a code fence → pass', r.status === 0, 'exit=' + r.status);
r = runP('```\nDiagram: none (quoted)\n```\n' + quest, [], TK);
check('Q14 Diagram: none only inside a code fence → still block', r.status === 2, 'exit=' + r.status);
r = runP(quest, [{ kind: 'tool', name: 'SendUserFile', input: '{"files":["C:\\\\x\\\\286655-flow.JPG"]}' }], TK);
check('Q15 upper-case .JPG sent → pass', r.status === 0, 'exit=' + r.status);
r = run(quest);
check('Q16 no transcript path (real hook call without one) → fail-open pass', r.status === 0, 'exit=' + r.status);

// P6 — broken stdin → fail-open
r = spawnSync(process.execPath, [HOOK], { input: 'not json {{', encoding: 'utf8', timeout: 30000 });
check('P6 broken stdin → fail-open exit 0', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nnext-steps-shape eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
