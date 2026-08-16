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
// §8-3 rank descending by days; difficulty on request only
check('3 3-DAY-RULE ranking; difficulty on request', /descending days since `?start_date`?/i.test(s) && /difficulty\/ease is NOT a column unless miya asks/i.test(s));
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

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' ' + x.d)); }
console.log('\nsweep contract eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
