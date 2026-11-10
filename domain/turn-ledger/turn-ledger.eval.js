#!/usr/bin/env node
// turn-ledger.eval.js — unit eval of the analysis library (the writer moved to domain/turn-log 2026-11-10; its eval covers the rows).
// Replay case: 2026-09-04 session §1d — 12 blocks, 7 false positives, reconstructed by hand.
'use strict';
const fs = require('fs');
const path = require('path');
const M = require('./turn-ledger.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// S6: a bypass token inside a fenced code block does not count; two real tokens do (fp first, plain second)
const lastText = 'done.\n```\n[skip-show-gate: quoted inside code, must NOT count]\n```\n[skip-predicate-box: fp: no .java edited] [skip-patch-script-gate: script already stamped]';
const bp = M.parseBypasses(lastText, { 'skip-predicate-box': 'predicate-box', 'skip-patch-script-gate': 'patch-script-gate' });
check('S6 fenced token ignored; fp true then false; hook mapped', bp.length === 2 && bp[0].fp === true && bp[1].fp === false && bp[0].hook === 'predicate-box', JSON.stringify(bp));

// S7: reason with ] and newlines → truncated at first ], collapsed
const b = M.parseBypasses('[skip-x-gate: fp: line one\nline two] tail', {});
check('S7 reason stops at ] and collapses newlines', b.length === 1 && b[0].reason === 'fp: line one line two' && b[0].fp === true, JSON.stringify(b));

// S9: unknown token → hook "?" counted
const u = M.parseBypasses('[skip-new-thing: because]', {});
check('S9 unknown token → hook "?"', u.length === 1 && u[0].hook === '?', JSON.stringify(u));

// user_signal: reask hook fired → 'reask'; correction; nod prompt → 'nod'; nothing → none
check('user_signal reask', M.userSignal([{ hook: 'reask', fired: true }], 'x') === 'reask', '');
check('user_signal correction', M.userSignal([{ hook: 'auto-skill-trigger', fired: true }], 'x') === 'correction', '');
check('user_signal nod', M.userSignal([], 'ok go ahead') === 'nod', '');
check('user_signal none', M.userSignal([], 'build it') === 'none', '');

// A1 (2026-09-07 regression): a refute verdict on a quest with no wrong-fix row today → the advisory line is produced
const adv = M.advisoryLines({ prompts: [] }, 'QA-000001', 'The stashed fix is REFUTED: the key is never written.');
check('A1 refute verdict → wrong-fix advisory', adv.length === 1 && /wrong-fix: this reply refutes a fix on QA-000001/.test(adv[0]), JSON.stringify(adv));
check('A2 refute verdict with no attributed quest → no advisory', M.advisoryLines({ prompts: [] }, null, 'REFUTED').length === 0, '');

// M7 goal-lens: a blocked feature with goal_signal_regex → mechanical goal-log row; without regex → prompt (cap 3); prompts are NOT parked in a file
const featDir = path.join(__dirname, '..', 'zz-eval-feature-' + process.pid);
const pendFile = path.join(__dirname, 'goal-lens-pending.jsonl');
const pendBefore = fs.existsSync(pendFile) ? fs.readFileSync(pendFile) : null;
fs.mkdirSync(featDir, { recursive: true });
fs.writeFileSync(path.join(featDir, 'README.md'), 'symptom: s\ngoal: the reply carries -- N rows\ngoal_signal: next reply contains -- N rows\ngoal_signal_regex: --\\s*\\d+\\s*rows\nretention: keep\n');
const feat = path.basename(featDir);
const lens = M.goalLens([{ hook: feat + '.check.hook', blocked: true }], 'patched.\n-- 3 rows updated', 'evalsid-9');
let gl = [];
try { gl = fs.readFileSync(path.join(featDir, 'goal-log.jsonl'), 'utf8').trim().split('\n').map(JSON.parse); } catch (_) {}
check('M7 mechanical goal_met=y written from regex', lens.mechanical === 1 && gl.length === 1 && gl[0].met === 'y' && gl[0].turn_id === 'evalsid-9', JSON.stringify(gl));
fs.writeFileSync(path.join(featDir, 'README.md'), 'symptom: s\ngoal: a judged outcome\ngoal_signal: needs judgment\nretention: keep\n');
const lens2 = M.goalLens([{ hook: feat, blocked: true }, { hook: 'no-such-feature-zz', blocked: true }], 'text', 'evalsid-10');
check('M7 no regex → one prompt; goal-less feature → no prompt (scenario 25)', lens2.prompts.length === 1 && lens2.prompts[0].feature === feat, JSON.stringify(lens2.prompts));
const many = Array.from({ length: 6 }, () => ({ hook: feat, blocked: true }));
check('M7 same feature deduped to 1 prompt (scenario 23)', M.goalLens(many, 't', 'evalsid-11').prompts.length === 1, '');
const pendAfter = fs.existsSync(pendFile) ? fs.readFileSync(pendFile) : null;
check('M7 prompts are no longer parked in goal-lens-pending.jsonl', (pendBefore === null && pendAfter === null) || (pendBefore && pendAfter && pendBefore.equals(pendAfter)), 'pending file changed');
fs.rmSync(featDir, { recursive: true, force: true });

// the library registers nothing and has no main: requiring it printed nothing and exited
check('library has no hook entry point (no runHook call)', !/runHook\(/.test(fs.readFileSync(path.join(__dirname, 'turn-ledger.js'), 'utf8').replace(/\/\/.*$/gm, '')), '');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nturn-ledger.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
