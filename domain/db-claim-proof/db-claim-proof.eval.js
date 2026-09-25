#!/usr/bin/env node
// db-claim-proof.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-09-24 #281392: told miya PDTJ.600-2/9/79 is DMMLMS with no SELECT; miya: you claimed but did not provide script
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'db-claim-proof.check.hook.js');
const { currentTurn, decide } = require('./db-claim-proof.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const J = (o) => JSON.stringify(o);
const prompt = (t) => J({ type: 'user', message: { role: 'user', content: t } });
const toolUse = (name) => J({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 'x', name, input: {} }] } });
const toolRes = () => J({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'rows' }] } });
const say = (t) => J({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: t }] } });
const PG = 'mcp__postgres-mlkprod-pg__query_database';
const turn = (...lines) => decide(currentTurn(lines));

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: THE REPLAY — DB query then a bare claim → BLOCK
check('F2 replay: query + "is DMMLMS" with no SELECT → BLOCK', turn(prompt('check PROD'), toolUse(PG), toolRes(), say('PDTJ.600-2/9/79 is urusan DMMLMS (908).')).block === true);
check('F3 claim + proving SELECT → pass', turn(prompt('check'), toolUse(PG), toolRes(), say('DMMLMS:\n```sql\nSELECT id_pengenalan, ursn_id FROM umm_aplikasi WHERE id_pengenalan = \'PDTJ.600-2/9/79\';\n```')).block === false);
check('F4 no DB tool this turn → no fire', turn(prompt('x'), toolUse('Read'), toolRes(), say('It is DMMLMS.')).fire === false);
check('F5 DB tool in an EARLIER turn only → no fire', turn(prompt('a'), toolUse(PG), toolRes(), say('x'), prompt('b'), say('It is DMMLMS.')).fire === false);
check('F6 oracle query tool counts', turn(prompt('x'), toolUse('mcp__oracle-prk-prod__query_database'), toolRes(), say('value is 3')).block === true);
check('F7 count_rows counts', turn(prompt('x'), toolUse('mcp__postgres-mlkstg-pg__count_rows'), toolRes(), say('2 rows')).block === true);
check('F8 get_schema_info alone → no fire', turn(prompt('x'), toolUse('mcp__postgres-mlkstg-pg__get_schema_info'), toolRes(), say('columns listed')).fire === false);
check('F9 bypass with real reason → pass', turn(prompt('x'), toolUse(PG), toolRes(), say('Reset done. [skip-db-proof: health check only, no fact stated]')).block === false);
check('F10 own help text "[skip-db-proof: <why>]" does NOT bypass', turn(prompt('x'), toolUse(PG), toolRes(), say('add [skip-db-proof: <why>] to it')).block === true);
check('F11 quoted "SELECT ... FROM ..." is NOT proof', turn(prompt('x'), toolUse(PG), toolRes(), say('needs SELECT ... FROM ... here')).block === true);
check('F12 tool_result user lines do not end the turn walk', currentTurn([prompt('x'), toolUse(PG), toolRes(), say('a'), toolUse(PG), toolRes(), say('b')]).dbTools.length === 2);
check('F13 isMeta companion does not end the turn', turn(prompt('x'), J({ type: 'user', isMeta: true, message: { content: [{ type: 'text', text: '[Image]' }] } }), toolUse(PG), toolRes(), say('value 3')).block === true);
check('F14 proof SELECT earlier in the same turn text → pass', turn(prompt('x'), say('```sql\nSELECT * FROM ind_versi_permit_lesen WHERE versi_dok = 0;\n```'), toolUse(PG), toolRes(), say('versi 0 holds it')).block === false);
check('F15 lowercase select … from counts', turn(prompt('x'), toolUse(PG), toolRes(), say('select kod from ind_ursn where ursn_id = 908;')).block === false);
check('F16 empty reply text → no fire', turn(prompt('x'), toolUse(PG), toolRes()).fire === false);
// F17: binary end-to-end — block reaches stderr with exit 2; stop_hook_active never re-blocks
const tp = path.join(os.tmpdir(), 'dbcp-eval-transcript.jsonl');
fs.writeFileSync(tp, [prompt('x'), toolUse(PG), toolRes(), say('It is DMMLMS.')].join('\n'));
const env = { ...process.env, DBCP_LOG: path.join(os.tmpdir(), 'dbcp-eval.jsonl') };
r = spawnSync(process.execPath, [HOOK], { input: J({ transcript_path: tp }), encoding: 'utf8', timeout: 30000, env });
check('F17 binary: exit 2 + reason on stderr', r.status === 2 && /db-claim-proof/.test(r.stderr) && /DELTA ONLY/.test(r.stderr), 'exit=' + r.status);
r = spawnSync(process.execPath, [HOOK], { input: J({ transcript_path: tp, stop_hook_active: true }), encoding: 'utf8', timeout: 30000, env });
check('F18 stop_hook_active → exit 0 (no loop)', r.status === 0, 'exit=' + r.status);
r = spawnSync(process.execPath, [HOOK], { input: J({ transcript_path: 'Z:\\missing.jsonl' }), encoding: 'utf8', timeout: 30000, env });
check('F19 missing transcript → exit 0 (fail-open)', r.status === 0, 'exit=' + r.status);
check('F20 malformed stdin → exit 0', spawnSync(process.execPath, [HOOK], { input: 'nope', encoding: 'utf8', timeout: 30000, env }).status === 0);

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12
//  1 own help text disarms gate ..................... fixture-added F10
//  2 own block text "SELECT ... FROM" read as proof . fixture-added F11
//  3 tool_result lines mistaken for user prompt ..... fixture-added F12
//  4 image meta companion ends the turn early ....... fixture-added F13
//  5 proof shown before the last query .............. fixture-added F14
//  6 lowercase SQL .................................. fixture-added F15
//  7 Oracle (Perak/WP) query tools .................. fixture-added F6
//  8 schema-only tool (get_schema_info) ............. fixture-added F8
//  9 query ran in a previous turn ................... fixture-added F5 (accepted-risk: a later-turn DB claim without a fresh query is not caught)
// 10 Stop re-entry loop ............................. fixture-added F18
// 11 missing / unreadable transcript ................ fixture-added F19
// 12 malformed stdin ................................ fixture-added F20
// 13 health-check query, reply states no fact ....... handled: bypass with a real reason (F9)
// 14 SELECT shown but wrong / MCP-qualified .......... accepted-risk: gate checks presence, not correctness; script-check owns shape
// 15 psql via Bash instead of MCP ................... accepted-risk: not used in this setup; widen on a logged miss
// 16 subagent ran the query, controller reports ..... accepted-risk: Agent tool_use not matched; controller-verifies rule covers
// 17 huge transcript ................................ handled: single pass from the end, stops at the last prompt
// 18 two sessions writing log.jsonl ................. accepted-risk: single-line appends
// 19 miya says "just answer yes/no" ................. handled: the bypass needs a stated reason; the SELECT is one line
// 20 DB fact inside a table without SQL ............. handled: table is not proof → block (F2 class)
// 21 PROD MCP query + patch script with BEFORE SELECT handled: the patch's SELECT satisfies proof
// 22 hook throws .................................... handled: runHook fail-open

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ndb-claim-proof.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
