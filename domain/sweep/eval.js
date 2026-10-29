#!/usr/bin/env node
// domain/sweep/eval.js — the DESIGN.md §8 10-assertion contract, checked mechanically against
// the shipped SKILL.md (the procedure IS the component — skill-only layer, DESIGN §3).
// Battery-enumerated. A SKILL.md edit that drops a contract clause turns this red.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const SKILL = path.join(ROOT, '.claude', 'skills', 'sweep', 'SKILL.md');
const s = fs.readFileSync(SKILL, 'utf8');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d: d || '' }); }

// §8-1 delegation plan before fan-out
check('1 DELEGATION PLAN before any fan-out', /DELEGATION PLAN table BEFORE any fan-out/i.test(s) && /stage · #agents · model · effort/.test(s));
// §8-2 redmine first, active.txt banned as date source
check('2 Redmine-first; active.txt dates banned', /redmine-board\.js/.test(s) && /never take dates or status from active\.txt/i.test(s));
// §8-3 ranking — re-pinned 2026-10-29: the 3-DAY RULE ranking was replaced by the tracker-tier rule (miya 2026-10-19)
check('3 tracker-tier ranking; he picks the tickets', /TICKET PRIORITY RULE/.test(s) && /TRACKER_TIER/.test(s) && /he picks the day's tickets/i.test(s));
// §8-4 safety template with 7 clauses, verbatim mandate
const clauses = (s.match(/^\d\. /gm) || []).length;
check('4 safety template VERBATIM with 7 clauses', /SAFETY CONTRACT \(all 7 binding\)/.test(s) && /VERBATIM in every familiar prompt/i.test(s), 'numbered lines=' + clauses);
// §8-5 MCP tools + ToolSearch step named
check('5 MCP tools + ToolSearch step in prompts', /MCP tools you hold/.test(s) && /ToolSearch "select:/.test(s) && /2026-07-24/.test(s));
// §8-6 W3 blind clause + sibling file
check('6 W3 blind clause + sibling file', /BARRED from the qa_doc/.test(s) && /QA-<n>-wave3\.md/.test(s) && /do NOT read QA-<n>\.md/.test(s));
// §8-7 skip rules encoded
check('7 skip rules (Rubric→skip W1; 2 passes→skip W3)', /already at Rubric[\s\S]{0,40}skip W1/.test(s) && /2 independent passes[\s\S]{0,40}skip W3/.test(s));
// §8-8 controller verification line between waves
check('8 controller verification line', /WAVE <n> VERIFIED/.test(s) && /DATA, not truth/.test(s));
// §8-9 resume replays banked waves
check('9 resume replays banked, reruns only missing', /Resume, never rerun/i.test(s) && /re-runs? ONLY missing/i.test(s) && /Relaunching a banked wave is BANNED/i.test(s));
// §8-10 no writes into Task folders
check('10 Task folder untouchable', /No file is ever written into any Task folder/i.test(s));
// post-design prerequisite (miya 2026-08-16): orchestration flag with bounded TTL + cleanup + observability
check('11 orch flag: 4h TTL + delete at close + suppression telemetry check', /TTL of a FEW HOURS \(4h\)/i.test(s) && /DELETE the flag at sweep close/i.test(s) && /orch-suppressed/.test(s));
// standing constraints
check('12 never Fable · Apply not owned · distill only at Phase-2', /NEVER fable/i.test(s) && /Apply is NOT part of the sweep/i.test(s) && /ONLY at Phase-2 close/i.test(s));
// miya 2026-08-17: sweep ends with the brief table and STOPS; fixes get their own sessions; board updated
check('13 brief-table-then-STOP + own-session rule + active.txt phase update', /the table IS the close; then STOP/i.test(s) && /OWN dedicated session/i.test(s) && /active-cli\.js update/.test(s));
// miya 2026-10-29: run layout, baseline pin, scratch-then-bank, audit Tool, audit-and-refine step
check('14 goal stated: accuracy first, then speed', /\*\*Goal\*\*/.test(s) && /Accuracy first/i.test(s));
check('15 flag on/off through the audit Tool (main folder)', /audit\.js flag on/.test(s) && /audit\.js flag off/.test(s) && /MAIN folder/.test(s));
check('16 W3 launched with W1+W2; W4 per ticket on its two passes', /W1\+W2 and W3 of EVERY ticket go out together/.test(s) && /W4 of a ticket launches the moment that ticket's two passes are banked/.test(s));
check('17 code baseline pinned to origin/mlk/master + fetch before launch', /git show origin\/mlk\/master:<path>/.test(s) && /git fetch origin/.test(s));
check('18 familiar writes to scratch, controller banks', /<scratchpad>\\sweep\\QA-<n>-<wave>\.md/.test(s) && /\*\*Bank\*\*/.test(s));
check('19 W4 reads the commit that introduced each changed line', /read the commit that introduced each line the fix changes/i.test(s));
check('20 ledger row written by the audit Tool with --write', /audit\.js run --tickets/.test(s) && /--write/.test(s));
check('21 audit-and-refine step: fix loop, accuracy guard, REFINE NOW via /system-change', /audit and refine/i.test(s) && /fix loop/i.test(s) && /never proposed/.test(s) && /REFINE NOW/.test(s) && /\/system-change/.test(s));
check('22 no recursive delete in cleanup', /recursive delete of any folder is banned/i.test(s));
const ae = require('child_process').spawnSync(process.execPath, [path.join(__dirname, 'audit.eval.js')], { encoding: 'utf8', windowsHide: true });
check('23 audit Tool fixture eval green', ae.status === 0, (ae.stdout || '').trim().split('\n').pop());

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' ' + x.d)); }
console.log('\nsweep contract eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
