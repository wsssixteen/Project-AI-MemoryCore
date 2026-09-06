#!/usr/bin/env node
// turn-ledger.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-09-04 session §1d — 12 blocks, 7 false positives, reconstructed by hand.
// Fixtures: synthetic transcript in a temp dir + _test* overrides (same convention as de-close-gate).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'turn-ledger.check.hook.js');
const M = require(HOOK);
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'turn-ledger-eval-'));
const TURNS = path.join(TMP, 'turns.jsonl');

function row(type, content, ts) { return JSON.stringify({ type, timestamp: ts, message: { role: type, content } }); }
function transcript(name, lines) { const p = path.join(TMP, name); fs.writeFileSync(p, lines.join('\n') + '\n'); return p; }
function run(data) { return spawnSync(process.execPath, [HOOK], { input: JSON.stringify(data), encoding: 'utf8', timeout: 30000, env: process.env }); }
function lastRow() { const l = fs.readFileSync(TURNS, 'utf8').trim().split('\n'); return JSON.parse(l[l.length - 1]); }

// F1: clean input → exit 0
const realTurns = path.join(__dirname, '..', '..', 'system', 'telemetry', 'turns.jsonl');
const realLen = (() => { try { return fs.statSync(realTurns).size; } catch (_) { return 0; } })();
let r = run({});
check('F1 empty stdin exits 0 and writes NO row to the real ledger', r.status === 0 && ((() => { try { return fs.statSync(realTurns).size; } catch (_) { return 0; } })() === realLen), 'exit=' + r.status);

// E1: 3 user turns; last turn has 5 tool_use + bypass tokens (one fp, one legit); 2 blocked hook rows
const t1 = transcript('t1.jsonl', [
  row('user', 'first prompt', '2026-09-06T01:00:00Z'),
  row('assistant', [{ type: 'text', text: 'reply one' }], '2026-09-06T01:00:05Z'),
  row('user', 'second prompt', '2026-09-06T01:01:00Z'),
  row('assistant', [{ type: 'tool_use', name: 'Read' }], '2026-09-06T01:01:02Z'),
  row('user', [{ type: 'tool_result' }], '2026-09-06T01:01:03Z'),
  row('user', 'third prompt', '2026-09-06T01:02:00Z'),
  row('assistant', [{ type: 'tool_use', name: 'Read' }, { type: 'tool_use', name: 'Read' }, { type: 'tool_use', name: 'Bash' }], '2026-09-06T01:02:02Z'),
  row('user', [{ type: 'tool_result' }], '2026-09-06T01:02:03Z'),
  row('assistant', [{ type: 'tool_use', name: 'Edit' }, { type: 'tool_use', name: 'Grep' }], '2026-09-06T01:02:05Z'),
  row('assistant', [{ type: 'text', text: 'done.\n```\n[skip-show-gate: quoted inside code, must NOT count]\n```\n[skip-predicate-box: fp: no .java edited] [skip-patch-script-gate: script already stamped]' }], '2026-09-06T01:02:09Z'),
]);
const stamp = { turn_id: 'evalsid-3', session_id: 'evalsid-1', opened_ts: '2026-09-06T01:02:00Z', qa: 'QA-1', phase: 'Apply', status: 'active', prompt_head: 'third prompt' };
const hookRows = [
  { hook: 'predicate-box', blocked: true, reason: 'no predicate box', dur_ms: 40, turn_id: 'evalsid-3' },
  { hook: 'patch-script-gate', blocked: true, reason: 'no -- N rows', dur_ms: 30, turn_id: 'evalsid-3' },
  { hook: 'terse-gate', blocked: false, fired: false, dur_ms: 20, turn_id: 'evalsid-3' },
];
r = run({ session_id: 'evalsid-1', transcript_path: t1, _testStamp: stamp, _testHookRows: hookRows, _testTokenMap: { 'skip-predicate-box': 'predicate-box', 'skip-patch-script-gate': 'patch-script-gate' }, _testTurnsPath: TURNS });
check('E1 exit 0', r.status === 0, 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 120));
let x = lastRow();
check('E1 tool_calls=5 for the LAST turn only', x.tool_calls === 5, 'tool_calls=' + x.tool_calls);
check('E1 tool_names counted', x.tool_names.Read === 2 && x.tool_names.Edit === 1, JSON.stringify(x.tool_names));
check('E1 blocks.length=2', x.blocks.length === 2, JSON.stringify(x.blocks));
check('E1 bypasses: fp true then false, fenced token ignored (scenario 6)', x.bypasses.length === 2 && x.bypasses[0].fp === true && x.bypasses[1].fp === false && x.bypasses[0].hook === 'predicate-box', JSON.stringify(x.bypasses));
check('E1 hook_ms summed', x.hook_ms === 90, 'hook_ms=' + x.hook_ms);
check('E1 qa/phase from stamp', x.qa === 'QA-1' && x.phase === 'Apply' && x.turn_id === 'evalsid-3', x.qa + '/' + x.phase);
check('E1 user_signal none', x.user_signal === 'none', x.user_signal);

// E2: no stamp (current-turn.json missing) → row still written, turn_id null, exit 0 (scenario 2/11)
r = run({ session_id: 'nosuchsid', transcript_path: t1, _testStamp: null, _testHookRows: [], _testTurnsPath: TURNS });
x = lastRow();
check('E2 no stamp → exit 0 + row with turn_id null', r.status === 0 && x.turn_id === null && x.tool_calls === 5, 'exit=' + r.status + ' turn_id=' + x.turn_id);

// E2b: transcript missing (scenario 5) → tool_calls null, row written
r = run({ session_id: 'evalsid-1', transcript_path: path.join(TMP, 'missing.jsonl'), _testStamp: stamp, _testHookRows: [], _testTurnsPath: TURNS });
x = lastRow();
check('E2b missing transcript → tool_calls null, exit 0', r.status === 0 && x.tool_calls === null, 'tool_calls=' + x.tool_calls);

// S3: stop_hook_active → silent, no row
const before = fs.readFileSync(TURNS, 'utf8').length;
r = run({ session_id: 'evalsid-1', stop_hook_active: true, transcript_path: t1, _testStamp: stamp, _testTurnsPath: TURNS });
check('S3 stop_hook_active → no row', r.status === 0 && fs.readFileSync(TURNS, 'utf8').length === before, '');

// S7: reason with ] and newlines → truncated at first ], collapsed
const b = M.parseBypasses('[skip-x-gate: fp: line one\nline two] tail', {});
check('S7 reason stops at ] and collapses newlines', b.length === 1 && b[0].reason === 'fp: line one line two' && b[0].fp === true, JSON.stringify(b));

// S9: unknown token → hook "?" counted
const u = M.parseBypasses('[skip-new-thing: because]', {});
check('S9 unknown token → hook "?"', u.length === 1 && u[0].hook === '?', JSON.stringify(u));

// S19: /command turn with no reply text → reply_chars 0, row written
const t2 = transcript('t2.jsonl', [row('user', '/goal x', '2026-09-06T02:00:00Z'), row('assistant', [{ type: 'tool_use', name: 'Skill' }], '2026-09-06T02:00:01Z')]);
r = run({ session_id: 'evalsid-1', transcript_path: t2, _testStamp: { ...stamp, turn_id: 'evalsid-4' }, _testHookRows: [], _testTurnsPath: TURNS });
x = lastRow();
check('S19 command turn → reply_chars 0, tool_calls 1', r.status === 0 && x.reply_chars === 0 && x.tool_calls === 1, JSON.stringify([x.reply_chars, x.tool_calls]));

// A1 (2026-09-07 regression: "win is not defined" swallowed by fail-open): the advisory path must RUN —
// a refute verdict on a quest with no wrong-fix row today → stdout carries the wrong-fix advisory, and no error row
const t3 = transcript('t3.jsonl', [row('user', 'check the fix', '2026-09-06T03:00:00Z'), row('assistant', [{ type: 'text', text: 'The stashed fix is REFUTED: the key is never written.' }], '2026-09-06T03:00:05Z')]);
r = run({ session_id: 'evalsid-1', transcript_path: t3, _testStamp: { ...stamp, turn_id: 'evalsid-6', qa: 'QA-000001' }, _testHookRows: [], _testTurnsPath: TURNS });
check('A1 refute verdict → wrong-fix advisory emitted on stdout', r.status === 0 && /wrong-fix: this reply refutes a fix on QA-000001/.test(r.stdout || ''), 'exit=' + r.status + ' out=' + (r.stdout || '').slice(0, 80));
r = run({ session_id: 'evalsid-1', transcript_path: t3, _testStamp: { ...stamp, turn_id: 'evalsid-7', qa: null }, _testHookRows: [], _testTurnsPath: TURNS });
check('A2 refute verdict with no attributed quest → no advisory (nothing to file it under)', r.status === 0 && !/wrong-fix:/.test(r.stdout || ''), (r.stdout || '').slice(0, 80));

// S17: orch-suppressed rows counted as suppressed, not blocks
r = run({ session_id: 'evalsid-1', transcript_path: t2, _testStamp: { ...stamp, turn_id: 'evalsid-5' }, _testHookRows: [{ hook: 'terse-gate', mode: 'orch-suppressed', blocked: false, dur_ms: 0, turn_id: 'evalsid-5' }], _testTurnsPath: TURNS });
x = lastRow();
check('S17 suppressed counted separately', x.suppressed === 1 && x.blocks.length === 0, JSON.stringify([x.suppressed, x.blocks]));

// user_signal: reask hook fired → 'reask'; nod prompt → 'nod'
check('user_signal reask', M.userSignal([{ hook: 'reask', fired: true }], 'x') === 'reask', '');
check('user_signal nod', M.userSignal([], 'ok go ahead') === 'nod', '');

// M7 goal-lens: a blocked feature with goal_signal_regex → mechanical goal-log row; without regex → prompt (cap 3)
const featDir = path.join(__dirname, '..', 'zz-eval-feature-' + process.pid);
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
const many = Array.from({ length: 6 }, (_, i) => ({ hook: feat, blocked: true }));
check('M7 prompt cap = 3 (scenario 23) — same feature deduped to 1', M.goalLens(many, 't', 'evalsid-11').prompts.length === 1, '');
fs.rmSync(featDir, { recursive: true, force: true });
try { fs.unlinkSync(path.join(__dirname, 'goal-lens-pending.jsonl')); } catch (_) {}

// ═══ ADVERSARIAL SCENARIOS (system-design Rule 12 — 22 enumerated in plan §M.6; verdicts):
//  1 concurrent sessions → stamp keyed by session (fixture in lib/turn-context via E1/E2 stamps)  · 2 no session_id → E2
//  3 stop_hook_active → S3 · 4 huge transcript → tail-only read (TAIL_BYTES) · 5 missing transcript → E2b
//  6 token inside fenced code → E1 · 7 ] / newlines in reason → S7 · 8 fp gaming → accepted-risk (weekly fp list)
//  9 unknown token → S9 · 10 silent block (empty reason) → reason:"" kept · 11 no active quest → E2 nulls
// 12 same-second turns → counter-based turn_id (turn-context) · 13 worktree telemetry copy → accepted-risk
// 14 OneDrive dup files → readers glob turns*.jsonl (turn-report) · 15 disk full → appendJsonl swallows
// 16 reply-log still registered → unregistered at birth (settings.json) · 17 orch-suppressed → S17
// 18 rotation mid-turn → housekeeping runs only at DE/audit · 19 /command turn → S19 · 20 hand-edit → v field
// 21 pure revert edit → accepted-risk (add the watch) · 22 fp: forgotten → bypass_reason_unclassified counter

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nturn-ledger.eval: ' + (results.length - failed) + '/' + results.length + ' green');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
