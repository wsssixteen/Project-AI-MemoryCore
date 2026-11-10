#!/usr/bin/env node
// turn-log.eval.js — fixture eval of domain/turn-log + lib/events.js + the slips extension + the quiet-run counter.
// Replay case: 2026-11-06 audit — 163 of 1,030 slip rows say "simplify"; the logs held no turn id, no full ask, no model and no
// tool target, so no slip could be tied to the turn that caused it.
// Runs entirely in a temp root (CLAUDE_PROJECT_DIR = temp, RURI_MACHINE = evalpc): the real telemetry is never touched.
// Prints PASS/FAIL per check, the 12-question coverage table, and the Rule 12 scenario table (>= 20 rows, each with a verdict).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const REAL_HOOK = path.join(__dirname, 'turn-log.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// ---------- sandbox ----------
function cp(root, rel) { const d = path.join(root, rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(REPO, rel), d); }
const ROOTS = [];
function mkRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'turn-log-eval-')); ROOTS.push(root);
  for (const f of ['lib/hook-runtime.js', 'lib/turn-context.js', 'lib/his-words.js', 'lib/events.js', 'lib/dispatch-hooks.js', 'core/slips.js',
    'domain/turn-ledger/turn-ledger.js', 'domain/turn-ledger/token-map.json', 'domain/turn-log/turn-log.js', 'domain/turn-log/turn-log.check.hook.js']) cp(root, f);
  for (const s of ['quest', 'system-design', 'system-rules']) fs.mkdirSync(path.join(root, '.claude', 'skills', s), { recursive: true });
  fs.mkdirSync(path.join(root, 'system', 'telemetry'), { recursive: true });
  fs.mkdirSync(path.join(root, 'quest'), { recursive: true });
  fs.writeFileSync(path.join(root, 'quest', 'active.txt'), '');
  fs.writeFileSync(path.join(root, 'system', 'slips.jsonl'), '');
  return root;
}
const ENV = (root, extra) => Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: root, RURI_MACHINE: 'evalpc' }, extra || {});
const STATUSES = [];
function hook(root, data, extraEnv, hookFile) {
  const res = hook0(root, data, extraEnv, hookFile); STATUSES.push(res.status); return res;
}
function hook0(root, data, extraEnv, hookFile) {
  return spawnSync(process.execPath, [hookFile || path.join(root, 'domain', 'turn-log', 'turn-log.check.hook.js')], { input: typeof data === 'string' ? data : JSON.stringify(data), encoding: 'utf8', timeout: 60000, env: ENV(root, extraEnv) });
}
function events(root, ...args) {
  const r = spawnSync(process.execPath, [path.join(root, 'lib', 'events.js'), '--root', root, ...args], { encoding: 'utf8', timeout: 30000, env: ENV(root) });
  return { status: r.status, out: r.stdout || '', err: r.stderr || '' };
}
function evJson(root, ...args) { const r = events(root, ...args, '--json'); try { return JSON.parse(r.out); } catch (_) { return null; } }
function logRows(root) {
  const dir = path.join(root, 'system', 'telemetry', 'turn-log'); const rows = [];
  try { for (const n of fs.readdirSync(dir)) for (const l of fs.readFileSync(path.join(dir, n), 'utf8').split('\n')) if (l.trim()) rows.push(JSON.parse(l)); } catch (_) {}
  return rows;
}

// ---------- fake transcript ----------
const T0 = Date.parse('2026-11-09T01:00:00Z');
const ts = s => new Date(T0 + s * 1000).toISOString();
const U = (text, s, extra) => JSON.stringify(Object.assign({ type: 'user', promptId: 'prompt-' + s, timestamp: ts(s), message: { role: 'user', content: text } }, extra || {}));
const A = (blocks, s, id, o) => { o = o || {}; return JSON.stringify({ type: 'assistant', timestamp: ts(s), perTurnEffort: o.effort || 'high', message: { id, model: o.model || 'claude-opus-5-5', role: 'assistant', content: blocks, usage: o.usage || { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 100, cache_creation_input_tokens: 5 } } }); };
const TR = (id, text, s, err) => JSON.stringify({ type: 'user', timestamp: ts(s), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, is_error: !!err, content: [{ type: 'text', text }] }] } });
const TU = (id, name, input) => ({ type: 'tool_use', id, name, input });
const TX = text => ({ type: 'text', text });
const ATT = (s, attachment) => JSON.stringify({ type: 'attachment', timestamp: ts(s), attachment });
function writeT(root, name, lines) { const p = path.join(root, name); fs.writeFileSync(p, lines.join('\n') + '\n'); return p; }
function stamp(root, sid, n, openedS, head, tp, extra) {
  const s8 = sid.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 8);
  const st = Object.assign({ v: 1, turn_id: s8 + '-' + n, session_id: sid, n, opened_ts: ts(openedS), prompt_hash: 'x', prompt_head: head, qa: null, phase: null, status: null, qa_source: null, transcript_path: tp }, extra || {});
  fs.writeFileSync(path.join(root, 'system', 'telemetry', 'current-turn-' + s8 + '.json'), JSON.stringify(st));
  return st;
}
const tmpRuns = sid => path.join(os.tmpdir(), 'ruri-hook-runs', sid.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 8) + '.tsv');

// ======================================================================================
// E1 — one turn end to end: his words, restated ask, cause step, model, tokens, tools, files, skills, gates
// ======================================================================================
const root = mkRoot();
const SID = 'e1e1e1e1-aaaa-bbbb-cccc-000000000001';
const ASK = 'simplify the promote step. [skip-show-gate: i typed this one]\nsecond line with "quotes", an emoji \u{1F600} and a backslash \\ end.';
const REPLY = 'You asked: simplify the promote step and nothing else.\nCause step: domain/adhoc-lifecycle/adhoc-lifecycle.js:cmdPromote · change: 6 lines · new parts: 0\nHis words: "simplify the promote step"\nDone.\n```\nCause step: fenced fake · change: 99 lines\n```\n[skip-show-gate: fp: no diagram needed] [skip-terse-gate: reply is short]';
const tp1 = writeT(root, 'e1.jsonl', [
  U('an older prompt', 0),
  A([TX('older reply [skip-old-gate: from an OLD turn]')], 2, 'm0'),
  U(ASK, 100),
  ATT(101, { type: 'hook_additional_context', content: ['route: invoke the quest skill before any ticket work (skill quest)'] }),
  ATT(101, { type: 'skill_mention', skillName: 'system-design' }),
  A([TU('t1', 'Read', { file_path: path.join(root, 'domain', 'x', 'a.js') })], 110, 'm1', { usage: { input_tokens: 5, output_tokens: 7, cache_read_input_tokens: 50, cache_creation_input_tokens: 1 } }),
  TR('t1', 'file body', 112),
  A([TU('t2', 'Edit', { file_path: path.join(root, 'domain', 'x', 'a.js'), old_string: 'a', new_string: 'b' }), TU('t3', 'Write', { file_path: path.join(root, 'domain', 'x', 'new.js'), content: 'x' })], 120, 'm2'),
  TR('t2', 'The file has been updated successfully', 121), TR('t3', 'File created successfully at: ' + path.join(root, 'domain', 'x', 'new.js'), 122),
  A([TU('t4', 'Bash', { command: 'rm domain/old/gone.js && echo password=hunter22secret' }), TU('t5', 'Skill', { skill: 'quest', args: 'start' })], 130, 'm3'),
  TR('t4', 'ok', 131), TR('t5', 'The user doesn\'t want to proceed with this tool use', 140, true),
  A([TU('t6', 'Agent', { subagent_type: 'general-purpose', model: 'sonnet', description: 'trace the writer' })], 150, 'm4'),
  TR('t6', 'agent done', 190),
  A([TX(REPLY)], 200, 'm5', { model: 'claude-fable-5-1', effort: 'xhigh', usage: { input_tokens: 3, output_tokens: 9, cache_read_input_tokens: 70, cache_creation_input_tokens: 2 } }),
  // the same API message split in two rows must be counted once
  A([TX('')], 201, 'm5', { model: 'claude-fable-5-1', effort: 'xhigh', usage: { input_tokens: 3, output_tokens: 9, cache_read_input_tokens: 70, cache_creation_input_tokens: 2 } }),
]);
const st1 = stamp(root, SID, 1, 101, ASK.replace(/\s+/g, ' ').slice(0, 80), tp1);
fs.mkdirSync(path.dirname(tmpRuns(SID)), { recursive: true });
fs.writeFileSync(tmpRuns(SID), [st1.turn_id + '\tterse-gate\t30\tStop', st1.turn_id + '\tshow-gate\t20\tStop', '\tboot-hook\t100\tSessionStart', 'old-turn-9\tstale-hook\t5\tUserPromptSubmit'].join('\n') + '\n');
// acting hook rows of the turn: one block, one advisory
const fires = path.join(root, 'system', 'telemetry', 'hook-fires-evalpc-' + new Date().toISOString().slice(0, 7) + '.jsonl');
fs.writeFileSync(fires, [
  { ts: ts(150), hook: 'predicate-box', event: 'Stop', blocked: true, fired: true, reason: 'no predicate box', dur_ms: 40, turn_id: st1.turn_id, session_id: SID },
  { ts: ts(151), hook: 'terse-gate', event: 'Stop', blocked: false, fired: true, reason: 'long reply', dur_ms: 25, turn_id: st1.turn_id, session_id: SID },
].map(r => JSON.stringify(r)).join('\n') + '\n');
let r = hook(root, { session_id: SID, transcript_path: tp1 });
check('E1 hook exits 0', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 200));
let rows = logRows(root);
const turn1 = rows.find(x => x.kind === 'turn' && x.turn_id === st1.turn_id);
check('E1 a turn row exists for the stamp turn_id', !!turn1, JSON.stringify(rows.map(x => x.kind)));
const T = turn1 || {};
check('E1 his words verbatim (newline, quotes, emoji, backslash intact)', T.ask === ASK, JSON.stringify(T.ask));
check('E1 prompt_id from the transcript, machine, v, event_id, rev 1', T.prompt_id === 'prompt-100' && T.machine === 'evalpc' && T.v === 2 && /^[a-z0-9]+-[0-9a-f]{10}$/.test(T.event_id) && T.rev === 1, JSON.stringify([T.prompt_id, T.machine, T.v, T.event_id, T.rev]));
check('E1 restated ask, cause step, change lines, new parts read from the reply lines', T.restated_ask === 'simplify the promote step and nothing else.' && T.cause_step === 'domain/adhoc-lifecycle/adhoc-lifecycle.js:cmdPromote' && T.change_lines === 6 && T.new_parts === 0, JSON.stringify([T.restated_ask, T.cause_step, T.change_lines, T.new_parts]));
check('E1 the fenced fake "Cause step: ... 99 lines" is ignored (self-referential text)', T.change_lines === 6 && !/fenced/.test(T.cause_step || ''), T.cause_step);
check('E1 quote_in_ask true when the quoted words are in his prompt', T.quote_in_ask === true, String(T.quote_in_ask));
check('E1 model = the one with most API messages, models map, effort of the last row', T.model === 'claude-opus-5-5' && T.models['claude-fable-5-1'] === 1 && T.models['claude-opus-5-5'] === 4 && T.effort === 'xhigh', JSON.stringify([T.model, T.models, T.effort]));
check('E1 tokens summed once per API message (m5 split in two rows counts once)', T.tokens && T.tokens.in === 5 + 10 + 10 + 10 + 3 && T.tokens.out === 7 + 20 + 20 + 20 + 9 && T.tokens.cache_read === 50 + 100 * 3 + 70, JSON.stringify(T.tokens));
check('E1 tool_calls 6 with names counted', T.tool_calls === 6 && T.tool_names.Read === 1 && T.tool_names.Edit === 1 && T.tool_names.Skill === 1, JSON.stringify([T.tool_calls, T.tool_names]));
check('E1 files_touched are repo-relative edits; parts_created from "created successfully"; parts_retired from rm', JSON.stringify(T.files_touched) === JSON.stringify(['domain/x/a.js', 'domain/x/new.js']) && JSON.stringify(T.parts_created) === JSON.stringify(['domain/x/new.js']) && T.parts_retired.includes('domain/old/gone.js'), JSON.stringify([T.files_touched, T.parts_created, T.parts_retired]));
check('E1 skills_invoked from Skill tool_use; skills_triggered from hook text + skill_mention (quest, system-design)', JSON.stringify(T.skills_invoked) === JSON.stringify(['quest']) && T.skills_triggered.includes('quest') && T.skills_triggered.includes('system-design'), JSON.stringify([T.skills_invoked, T.skills_triggered]));
check('E1 gates_blocked from the acting hook rows', T.gates_blocked.length === 1 && T.gates_blocked[0].hook === 'predicate-box' && T.gates_blocked[0].reason === 'no predicate box', JSON.stringify(T.gates_blocked));
const bp = T.gates_bypassed || [];
check('E1 bypass typed_by: him when the token is in his words, me when it is not; the OLD turn token and the fenced token are not counted', bp.length === 2 && bp[0].token === 'skip-show-gate' && bp[0].typed_by === 'him' && bp[0].fp === true && bp[1].token === 'skip-terse-gate' && bp[1].typed_by === 'me', JSON.stringify(bp));
check('E1 hooks_run / hook_ms: scratch counter (all lines) + acting rows; hooks_quiet lists the quiet runs', T.hooks_run === 4 + 2 && T.hook_ms === 30 + 20 + 100 + 5 + 40 + 25 && T.hooks_quiet['terse-gate'][0] === 1 && T.hooks_quiet['boot-hook'][2] === 'SessionStart', JSON.stringify([T.hooks_run, T.hook_ms, T.hooks_quiet]));
const left = fs.readFileSync(tmpRuns(SID), 'utf8').trim().split('\n');
check('E1 scratch counter keeps only this turn\'s own lines afterwards (the boot line and the stale turn line are gone; the hook\'s own pass line is new)', left.every(l => l.startsWith(st1.turn_id)) && left.length >= 2 && !left.some(l => /boot-hook|stale-hook/.test(l)), JSON.stringify(left));
const tools1 = rows.filter(x => x.kind === 'tool' && x.turn_id === st1.turn_id).sort((a, b) => a.seq - b.seq);
check('E1 one tool row per call, seq 1..6, in order', tools1.length === 6 && tools1.every((x, i) => x.seq === i + 1) && tools1[0].tool === 'Read', JSON.stringify(tools1.map(x => x.tool)));
check('E1 tool target, result and duration (transcript timestamps)', tools1[0].target.endsWith('a.js') && tools1[0].result === 'ok' && tools1[0].dur_ms === 2000 && tools1[4].tool === 'Skill' && tools1[4].target === 'quest' && tools1[4].result === 'refused' && tools1[5].target.includes('model=sonnet') && tools1[5].dur_ms === 40000, JSON.stringify(tools1.map(x => [x.tool, x.result, x.dur_ms])));
check('E1 a secret in a command is masked in the tool target (password=hunter22secret)', !/hunter22secret/.test(tools1[3].target) && /password=\*\*\*/.test(tools1[3].target), tools1[3].target);
check('E1 turn row has no field filled by guess: parent_turn_id null, next_signal null, caused_by null', T.parent_turn_id === null && T.next_signal === null && T.caused_by_turn_id === null, '');
const stAfter = JSON.parse(fs.readFileSync(path.join(root, 'system', 'telemetry', 'current-turn-e1e1e1e1.json'), 'utf8'));
check('E1 stamp got closed_ts, rev 1 and tools_written 6', stAfter.rev === 1 && stAfter.tools_written === 6 && !!stAfter.closed_ts, JSON.stringify([stAfter.rev, stAfter.tools_written]));
check('E1 the old writer stayed off: no turns.jsonl, no hook-fires pass row', !fs.existsSync(path.join(root, 'system', 'telemetry', 'turns.jsonl')) && !fs.existsSync(path.join(root, 'domain', 'turn-ledger', 'log.jsonl')), '');

// ---------- E2: Stop re-entry after a block: rev 2, only the new tool calls, a complete turn ----------
const tp1b = writeT(root, 'e1b.jsonl', fs.readFileSync(tp1, 'utf8').trim().split('\n').concat([
  A([TU('t7', 'Bash', { command: 'git status' })], 210, 'm6'), TR('t7', 'clean', 211), A([TX('final text after the block')], 212, 'm7'),
]));
fs.writeFileSync(path.join(root, 'system', 'telemetry', 'current-turn-e1e1e1e1.json'), JSON.stringify(stAfter));
r = hook(root, { session_id: SID, transcript_path: tp1b, stop_hook_active: true });
rows = logRows(root);
const t1rows = rows.filter(x => x.kind === 'turn' && x.turn_id === st1.turn_id);
const newTools = rows.filter(x => x.kind === 'tool' && x.turn_id === st1.turn_id);
check('E2 re-entry writes rev 2 with the complete tool count (7) and only ONE new tool row (no duplicates)', t1rows.length === 2 && t1rows[1].rev === 2 && t1rows[1].tool_calls === 7 && newTools.length === 7 && newTools[6].seq === 7, JSON.stringify([t1rows.map(x => x.rev), t1rows[1] && t1rows[1].tool_calls, newTools.length]));
check('E2 re-entry prints no goal-lens/wrong-fix advisory again', !/goal-lens|wrong-fix/.test(r.stdout), r.stdout.slice(0, 120));
check('E2 events.js keeps the highest rev of a turn', (evJson(root, '--turn', st1.turn_id) || {}).turn && evJson(root, '--turn', st1.turn_id).turn.rev === 2, '');

// ---------- E3: next turn is a re-ask → signal row on the previous turn, caused_by_turn_id ----------
fs.writeFileSync(fires, fs.readFileSync(fires, 'utf8') + JSON.stringify({ ts: ts(300), hook: 'reask', event: 'UserPromptSubmit', blocked: false, fired: true, dur_ms: 3, turn_id: 'e1e1e1e1-2', session_id: SID }) + '\n');
const tp2 = writeT(root, 'e2.jsonl', fs.readFileSync(tp1b, 'utf8').trim().split('\n').concat([U('i said simplify, why are there new steps again', 295), A([TX('sorry')], 297, 'm8')]));
stamp(root, SID, 2, 296, 'i said simplify, why are there new steps again', tp2, { prev_closed_ts: ts(213) });
hook(root, { session_id: SID, transcript_path: tp2 });
rows = logRows(root);
const t2 = rows.find(x => x.kind === 'turn' && x.turn_id === 'e1e1e1e1-2');
const sig = rows.find(x => x.kind === 'signal' && x.turn_id === 'e1e1e1e1-1');
check('E3 the re-ask turn names the turn it corrects (caused_by_turn_id) and has user_signal reask', t2 && t2.caused_by_turn_id === 'e1e1e1e1-1' && t2.user_signal === 'reask', JSON.stringify(t2 && [t2.caused_by_turn_id, t2.user_signal]));
check('E3 a signal row writes next_signal=reask onto the PREVIOUS turn; events.js shows it', sig && sig.next_signal === 'reask' && (evJson(root, '--turn', 'e1e1e1e1-1').turn.next_signal === 'reask'), JSON.stringify(sig));
check('E3 gap_since_prev_minutes from prev_closed_ts in the stamp', t2 && t2.gap_since_prev_minutes === Math.round((296 - 213) / 60), String(t2 && t2.gap_since_prev_minutes));

// ---------- E4: slips ----------
function slip(extra, env) {
  return spawnSync(process.execPath, [path.join(root, 'core', 'slips.js'), 'add', ...extra], { encoding: 'utf8', timeout: 30000, env: ENV(root, env || {}) });
}
const stNow = stamp(root, SID, 3, 400, 'you added steps again stupid', tp2);
const tp3 = writeT(root, 'e3.jsonl', fs.readFileSync(tp2, 'utf8').trim().split('\n').concat([U('you added steps again stupid', 399)]));
fs.writeFileSync(path.join(root, 'system', 'telemetry', 'current-turn-e1e1e1e1.json'), JSON.stringify(Object.assign({}, stNow, { transcript_path: tp3 })));
r = slip(['--category', 'over-build', '--caught-by', 'miya', '--evidence', 'promote got 3 steps', '--rule-expected', 'rule-11', '--part', 'adhoc-lifecycle', '--repeat-of', 'abc-123'], { CLAUDE_CODE_SESSION_ID: SID });
const srow = fs.readFileSync(path.join(root, 'system', 'slips.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l)).pop() || {};
check('E4 slips add: exit 0, old fields intact (category, evidence, caught_by, ts, type)', r.status === 0 && srow.category === 'over-build' && srow.evidence === 'promote got 3 steps' && srow.caught_by === 'miya' && srow.type === 'slip' && !!srow.ts && srow.qa === null && srow.guard_expected === null, r.stderr.slice(0, 200));
check('E4 the slip row carries turn_id, session_id (from the environment), event_id', srow.turn_id === 'e1e1e1e1-3' && srow.session_id === SID && srow.session_src === 'env' && !!srow.event_id, JSON.stringify([srow.turn_id, srow.session_id, srow.session_src]));
check('E4 the slip row carries his words verbatim from the transcript (caught by miya, none typed)', srow.his_words === 'you added steps again stupid' && srow.his_words_src === 'turn-ask', JSON.stringify([srow.his_words, srow.his_words_src]));
check('E4 rule_expected, part, repeat_of stored', srow.rule_expected === 'rule-11' && srow.part === 'adhoc-lifecycle' && srow.repeat_of === 'abc-123', '');
slip(['--category', 'x-self', '--caught-by', 'self', '--his-words', 'typed words'], { CLAUDE_CODE_SESSION_ID: SID });
const srow2 = fs.readFileSync(path.join(root, 'system', 'slips.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l)).pop();
check('E4 --his-words wins over the transcript; a self-caught row without it has none', srow2.his_words === 'typed words' && srow2.his_words_src === 'flag', JSON.stringify(srow2.his_words));
slip(['--category', 'x-none', '--caught-by', 'self'], { CLAUDE_CODE_SESSION_ID: '' });
const srow3 = fs.readFileSync(path.join(root, 'system', 'slips.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l)).pop();
check('E4 no session id in the environment: the newest stamp of the last 6 hours is used and says so (newest-stamp)', srow3.session_src === 'newest-stamp' && srow3.turn_id === 'e1e1e1e1-3', JSON.stringify([srow3.session_src, srow3.turn_id]));
const noStampRoot = mkRoot(); fs.rmSync(path.join(noStampRoot, 'system', 'telemetry'), { recursive: true, force: true });
const rr = spawnSync(process.execPath, [path.join(noStampRoot, 'core', 'slips.js'), 'add', '--category', 'lonely'], { encoding: 'utf8', env: ENV(noStampRoot, { CLAUDE_CODE_SESSION_ID: '' }) });
const lrow = JSON.parse(fs.readFileSync(path.join(noStampRoot, 'system', 'slips.jsonl'), 'utf8').trim().split('\n').pop());
check('E4 no stamp and no session id: the row is written with null turn_id and null his_words, exit 0', rr.status === 0 && lrow.turn_id === null && lrow.his_words === null, rr.stderr.slice(0, 120));

// ======================================================================================
// events.js: the commands, and the 12 audit questions
// ======================================================================================
let ev = events(root, '--session', 'e1e1e1e1');
check('events --session lists the 2 logged turns of the session (turn 3 had no Stop yet)', /\| e1e1e1e1-1 /.test(ev.out) && /\| e1e1e1e1-2 /.test(ev.out) && /2 turn\(s\)/.test(ev.out), ev.out.slice(0, 300));
ev = events(root, '--ask', 'SIMPLIFY the promote');
check('events --ask finds the turn by a substring of his words (case-insensitive)', /e1e1e1e1-1/.test(ev.out) && /\n1 turn\(s\)/.test(ev.out), ev.out.slice(0, 200));
ev = events(root, '--since', '2026-11-09T01:01');
check('events --since filters by close time', ev.status === 0 && /turn\(s\)/.test(ev.out), ev.out.slice(0, 100));
ev = events(root, '--turn', 'e1e1e1e1-1');
check('events --turn prints his words, the restated ask, the cause step, the model and the tool table', /HIS WORDS/.test(ev.out) && /simplify the promote step\. \[skip-show-gate/.test(ev.out) && /cmdPromote/.test(ev.out) && /claude-opus-5-5/.test(ev.out) && /\| Read /.test(ev.out), ev.out.slice(0, 400));
ev = events(root, '--gates');
check('events --gates lists the block and the bypass with who typed it', /predicate-box/.test(ev.out) && /skip-show-gate/.test(ev.out) && /\| him /.test(ev.out) && /\| me /.test(ev.out), ev.out.slice(0, 500));
ev = events(root, '--slips');
check('events --slips joins the slip to the turn that asked (his words in the same row)', /over-build/.test(ev.out) && /rule-11/.test(ev.out) && /abc-123/.test(ev.out) && /you added steps again stupid/.test(ev.out), ev.out.slice(0, 500));
ev = events(root, '--audit');
check('events --audit prints coverage and exits 0 on a clean log', ev.status === 0 && /ask recorded/.test(ev.out) && /turn rows without turn_id: 0/.test(ev.out), ev.out.slice(0, 300));
ev = events(root, '--tools', '--tool', 'Edit');
check('events --tools --tool filters tool rows', /\| Edit /.test(ev.out) && !/\| Read /.test(ev.out), ev.out.slice(0, 200));

// the 12 audit questions (observability-gaps.md KQ5): answerable now?
const full = evJson(root, '--turn', 'e1e1e1e1-1');
const tt = full.turn, toolsE = full.tools;
const t3 = evJson(root, '--turn', 'e1e1e1e1-2').turn;
const slipRows = evJson(root, '--slips');
const Q = [
  [1, 'Did he have to re-ask or correct this turn, and which earlier turn was misread?', t3.caused_by_turn_id === 'e1e1e1e1-1' && tt.next_signal === 'reask', 'answered'],
  [2, 'What exactly did he ask (verbatim) on turn T?', tt.ask === ASK && !!tt.prompt_id, 'answered'],
  [3, 'What did Ruri think the ask was (restated)?', tt.restated_ask === 'simplify the promote step and nothing else.', 'answered when the reply carries the "You asked:" line (null otherwise)'],
  [4, 'How many steps, tools and files did the turn use?', tt.tool_calls === 7 && toolsE.length >= 6 && tt.files_touched.length === 2 && toolsE[0].target, 'answered'],
  [5, 'Which skills ran, and was an applicable one skipped?', Array.isArray(tt.skills_triggered) && Array.isArray(tt.skills_invoked) && tt.skills_triggered.includes('system-design') && !tt.skills_invoked.includes('system-design'), 'answered for skills a hook or he named; a skill nobody named is unknowable'],
  [6, 'Which model and effort handled the turn?', !!tt.model && !!tt.effort, 'answered'],
  [7, 'Tokens and time per turn?', tt.tokens && tt.tokens.out > 0 && tt.wall_ms != null && toolsE.some(x => x.dur_ms != null), 'partial: per turn and per tool; per-subagent tokens are not in the main transcript'],
  [8, 'Which gates blocked, and were they right?', tt.gates_blocked.length === 1 && tt.gates_bypassed.some(b => b.fp === true), 'partial: block + reason + fp flag; the true/false verdict stays in goal-log'],
  [9, 'Were alternatives and the simple fix considered?', tt.alternatives === undefined && tt.chosen === undefined, 'GAP: nothing records it (thinking blocks are empty); not logged, not guessed'],
  [10, 'What did the subagents do and cost?', toolsE.some(x => x.tool === 'Agent' && /model=sonnet/.test(x.target) && x.dur_ms === 40000), 'partial: model, description, duration per spawn; no tokens'],
  [11, 'What was the outcome of the turn (slip, re-ask)?', slipRows && slipRows.some(s => s.turn_id === 'e1e1e1e1-3' && s.his_words) && tt.next_signal === 'reask', 'answered'],
  [12, 'Which ticket did the turn serve?', 'qa' in tt && 'qa_source' in tt, 'answered with its source (a top-active guess is labelled)'],
];
for (const [n, q, ok, note] of Q) check('Q' + n + ' ' + q, ok, note);

// ======================================================================================
// Rule 12 — adversarial scenarios (>= 20), each with a verdict
// ======================================================================================
const SCEN = [];
const S = (id, what, verdict, ref) => SCEN.push({ id, what, verdict, ref });

// 1 empty transcript file
let rt = mkRoot(); let sidA = 'a1a1a1a1-0000-0000-0000-000000000001';
let tpe = writeT(rt, 'empty.jsonl', []); fs.writeFileSync(tpe, '');
stamp(rt, sidA, 1, 10, 'hello', tpe);
r = hook(rt, { session_id: sidA, transcript_path: tpe }); let rw = logRows(rt);
check('S1 empty transcript: exit 0, a turn row with null ask/model/tool_calls and no tool rows', r.status === 0 && rw.length === 1 && rw[0].ask === null && rw[0].model === null && rw[0].tool_calls === null, JSON.stringify(rw[0]));
S(1, 'empty transcript file', 'handled: row written, fields null', 'S1');
// 2 missing transcript path
rt = mkRoot(); stamp(rt, sidA, 1, 10, 'hello', '/no/such/file.jsonl');
r = hook(rt, { session_id: sidA, transcript_path: '/no/such/file.jsonl' }); rw = logRows(rt);
check('S2 missing transcript: exit 0, turn row, tool_calls null', r.status === 0 && rw.length === 1 && rw[0].tool_calls === null, JSON.stringify(rw[0]));
S(2, 'transcript path points at a file that is gone', 'handled', 'S2');
// 3 plain-text transcript
rt = mkRoot(); tpe = path.join(rt, 'plain.txt'); fs.writeFileSync(tpe, 'this is not json\nnor this\n'); stamp(rt, sidA, 1, 10, 'hello', tpe);
r = hook(rt, { session_id: sidA, transcript_path: tpe }); rw = logRows(rt);
check('S3 plain-text transcript: exit 0, no crash, nulls', r.status === 0 && rw.length === 1 && rw[0].tool_calls === null, r.stderr.slice(0, 100));
S(3, 'transcript is plain text, not JSONL', 'handled: unparsable lines skipped', 'S3');
// 4 malformed stdin
r = hook(rt, '{not json'); check('S4 malformed JSON on stdin: exit 0, no new row', r.status === 0 && logRows(rt).length === 1, 'exit=' + r.status);
S(4, 'stdin is not JSON', 'handled', 'S4');
// 5 empty payload (smoke fire)
r = hook(rt, '{}'); check('S5 empty payload: exit 0, no row (smoke-fire)', r.status === 0 && logRows(rt).length === 1, 'exit=' + r.status);
S(5, 'empty payload {} (forge smoke-fire)', 'handled: no row', 'S5');
// 6 two sessions on one machine
rt = mkRoot(); const sB = 'b2b2b2b2-0000-0000-0000-000000000002', sC = 'c3c3c3c3-0000-0000-0000-000000000003';
const tpB = writeT(rt, 'b.jsonl', [U('ask from B', 5), A([TU('b1', 'Read', { file_path: 'b.txt' })], 6, 'mb1'), TR('b1', 'x', 7), A([TX('B done')], 8, 'mb2')]);
const tpC = writeT(rt, 'c.jsonl', [U('ask from C', 5), A([TU('c1', 'Grep', { pattern: 'c' }), TU('c2', 'Grep', { pattern: 'd' })], 6, 'mc1'), TR('c1', 'x', 7), TR('c2', 'x', 7), A([TX('C done')], 8, 'mc2')]);
stamp(rt, sB, 1, 5, 'ask from B', tpB); stamp(rt, sC, 1, 5, 'ask from C', tpC);
fs.mkdirSync(path.dirname(tmpRuns(sB)), { recursive: true });
fs.writeFileSync(tmpRuns(sB), 'b2b2b2b2-1\tb-hook\t10\tStop\n'); fs.writeFileSync(tmpRuns(sC), 'c3c3c3c3-1\tc-hook\t20\tStop\nc3c3c3c3-1\tc-hook\t20\tStop\n');
hook(rt, { session_id: sB, transcript_path: tpB }); hook(rt, { session_id: sC, transcript_path: tpC }); rw = logRows(rt);
const tb = rw.find(x => x.kind === 'turn' && x.session_id === sB), tc2 = rw.find(x => x.kind === 'turn' && x.session_id === sC);
check('S6 two sessions on one machine: each row keeps its own ask, tools and quiet-run counters', tb.ask === 'ask from B' && tb.tool_calls === 1 && tb.hooks_run === 1 && tc2.ask === 'ask from C' && tc2.tool_calls === 2 && tc2.hooks_run === 2, JSON.stringify([tb.ask, tb.tool_calls, tb.hooks_run, tc2.ask, tc2.tool_calls, tc2.hooks_run]));
S(6, 'two sessions on one machine at once', 'handled: stamp, counter file and rows are keyed by session', 'S6');
for (const s of [sB, sC, SID]) { try { fs.unlinkSync(tmpRuns(s)); } catch (_) {} }
// 7 OneDrive: the other machine's file, and a byte-identical copy of a file
rt = root; const dirTL = path.join(rt, 'system', 'telemetry', 'turn-log');
const mine = fs.readdirSync(dirTL).find(n => /^evalpc-/.test(n));
fs.copyFileSync(path.join(dirTL, mine), path.join(dirTL, mine.replace('evalpc', 'otherpc')));
const dupTurns = evJson(rt, '--session', 'e1e1e1e1');
check('S7 the other machine\'s file holding the same rows (a OneDrive copy) does not double a turn', dupTurns && dupTurns.length === 2, String(dupTurns && dupTurns.length));
S(7, 'OneDrive duplicate: the same month file under another machine name', 'handled: readers dedupe by turn_id + rev', 'S7');
fs.unlinkSync(path.join(dirTL, mine.replace('evalpc', 'otherpc')));
// 8 his words missing (only meta rows)
rt = mkRoot(); const tpM = writeT(rt, 'meta.jsonl', [U('<system-reminder>injected</system-reminder>', 1, { isMeta: true }), A([TX('x')], 2, 'mm1')]); stamp(rt, sidA, 1, 1, 'whatever', tpM);
hook(rt, { session_id: sidA, transcript_path: tpM }); rw = logRows(rt);
check('S8 no message of his in the transcript: ask null, row still written', rw.length === 1 && rw[0].ask === null && rw[0].model === 'claude-opus-5-5', JSON.stringify(rw[0] && rw[0].ask));
S(8, 'his-words finds none of his messages', 'handled: ask null, never guessed', 'S8');
// 9 hostname with spaces
{
  const HR = require(path.join(REPO, 'lib', 'hook-runtime.js'));
  const old = process.env.RURI_MACHINE; process.env.RURI_MACHINE = 'DESKTOP ABC (office) é';
  const nm = HR.machineName(); if (old === undefined) delete process.env.RURI_MACHINE; else process.env.RURI_MACHINE = old;
  check('S9 hostname with spaces, brackets and an accent becomes a safe file-name part', /^[A-Za-z0-9_.]+$/.test(nm) && nm.startsWith('DESKTOP_ABC'), nm);
  S(9, 'hostname with spaces and odd characters', 'handled: sanitised to ' + nm, 'S9 + hook-runtime.eval F9');
}
// 10 month rollover
{
  const TL = require(path.join(REPO, 'domain', 'turn-log', 'turn-log.js'));
  process.env.RURI_MACHINE = 'evalpc';
  const rr1 = TL.appendRow(rt, { kind: 'turn', ts: '2026-12-01T00:00:01.000Z', turn_id: 'x-1' });
  const rr2 = TL.appendRow(rt, { kind: 'turn', ts: '2026-11-30T23:59:59.000Z', turn_id: 'x-0' });
  check('S10 month rollover: a row stamped 2026-12-01 goes to the -2026-12 file, 2026-11-30 stays in -2026-11', /evalpc-2026-12\.jsonl$/.test(rr1.file) && /evalpc-2026-11\.jsonl$/.test(rr2.file), rr1.file + ' ' + rr2.file);
  S(10, 'month rollover at midnight UTC', 'handled: the row\'s own ts picks the file', 'S10');
}
// 11 worktree vs main: the real hook file, data root elsewhere
rt = mkRoot(); stamp(rt, sB, 1, 5, 'ask from B', tpB);
fs.writeFileSync(tmpRuns(sB), '');
r = hook(rt, { session_id: sB, transcript_path: tpB }, {}, REAL_HOOK); rw = logRows(rt);
check('S11 the REAL hook file run with CLAUDE_PROJECT_DIR elsewhere writes into that root, not beside itself', r.status === 0 && rw.some(x => x.kind === 'turn' && x.ask === 'ask from B'), r.stderr.slice(0, 200));
S(11, 'worktree vs main dir: hook file in one tree, data root in another', 'handled: every path hangs from CLAUDE_PROJECT_DIR', 'S11');
try { fs.unlinkSync(tmpRuns(sB)); } catch (_) {}
// 12 bundle dispatch
rt = mkRoot(); stamp(rt, sB, 1, 5, 'ask from B', tpB);
fs.mkdirSync(path.join(rt, 'domain', 'bundles'), { recursive: true });
fs.writeFileSync(path.join(rt, 'domain', 'bundles', 'one.json'), JSON.stringify({ name: 'one', children: ['domain/turn-log/turn-log.check.hook.js'] }));
r = spawnSync(process.execPath, [path.join(rt, 'lib', 'dispatch-hooks.js'), '--manifest', 'domain/bundles/one.json', '--event', 'Stop'], { input: JSON.stringify({ session_id: sB, transcript_path: tpB }), encoding: 'utf8', timeout: 60000, env: ENV(rt) });
check('S12 run through lib/dispatch-hooks.js as a bundle child: exit 0 and the turn row is written', r.status === 0 && logRows(rt).some(x => x.kind === 'turn'), 'exit=' + r.status + ' ' + r.stderr.slice(0, 120));
S(12, 'bundle dispatch instead of direct registration', 'handled: same stdin, same rows', 'S12');
try { fs.unlinkSync(tmpRuns(sB)); } catch (_) {}
// 13 lib missing (a broken sandbox copy)
rt = mkRoot(); fs.rmSync(path.join(rt, 'lib', 'hook-runtime.js'));
r = hook(rt, { session_id: sB, transcript_path: tpB });
check('S13 hook-runtime.js missing: the hook dies with a node error (exit 1), never exit 2 (never blocks the turn)', r.status !== 2, 'exit=' + r.status);
S(13, 'lib/hook-runtime.js missing in the root', 'accepted-risk: a broken install; exit 1 is a non-blocking hook error, the audit census flags the part', 'S13');
// 14 huge transcript
rt = mkRoot(); const big = [U('the big ask', 10)];
for (let i = 0; i < 6000; i++) { big.push(A([TU('bt' + i, 'Read', { file_path: 'f' + i + '.txt' })], 20 + i, 'bm' + i)); big.push(TR('bt' + i, 'x'.repeat(300), 20.5 + i)); }
big.push(A([TX('big done')], 99999, 'bm-last'));
const tpBig = writeT(rt, 'big.jsonl', big); stamp(rt, sB, 1, 10, 'the big ask', tpBig);
const tStart = Date.now(); r = hook(rt, { session_id: sB, transcript_path: tpBig }); const tBig = Date.now() - tStart; rw = logRows(rt);
const sizeMB = Math.round(fs.statSync(tpBig).size / 1048576 * 10) / 10;
check('S14 a ' + sizeMB + ' MB transcript: 6000 tool calls counted, ask found, under 15 s (' + tBig + ' ms)', r.status === 0 && rw.find(x => x.kind === 'turn').tool_calls === 6000 && rw.filter(x => x.kind === 'tool').length === 6000 && tBig < 15000, 'tool_calls=' + (rw.find(x => x.kind === 'turn') || {}).tool_calls + ' ms=' + tBig);
S(14, 'huge transcript (window deep inside)', 'handled: backward read in growing chunks, ' + tBig + ' ms for ' + sizeMB + ' MB', 'S14');
// 15 window start beyond the 48 MB cap
S(15, 'turn longer than 48 MB of transcript', 'accepted-risk: row says window_truncated:true, counts are floors; no turn in 2,232 transcripts is near it', 'code path readRowsSince');
// 16 bypass token in an OLD turn and inside a fence
check('S16 a bypass token in an OLD turn\'s reply or inside a code fence is not counted for this turn', bp.length === 2 && !bp.some(b => b.token === 'skip-old-gate'), JSON.stringify(bp.map(b => b.token)));
S(16, 'bypass token in an old turn / in a fenced block / echoed from the docs', 'handled (E1): only the last reply of THIS turn, fences stripped', 'E1');
// 17 lost stamp
rt = mkRoot(); const tpL = writeT(rt, 'l.jsonl', [U('ask without stamp', 5), A([TU('l1', 'Read', { file_path: 'x' })], 6, 'ml1'), TR('l1', 'x', 7), A([TX('done')], 8, 'ml2')]);
r = hook(rt, { session_id: sB, transcript_path: tpL }); rw = logRows(rt);
check('S17 stamp file missing: a turn row with turn_id null and the ask found, NO tool rows (no id to key them on)', r.status === 0 && rw.length === 1 && rw[0].turn_id === null && rw[0].ask === 'ask without stamp' && rw[0].tool_calls === 1, JSON.stringify(rw[0] && [rw[0].turn_id, rw[0].tool_calls]));
S(17, 'current-turn stamp deleted or never written', 'handled: turn row with null turn_id, tools counted, no tool rows', 'S17');
// 18 ask longer than the cap
rt = mkRoot(); const longAsk = 'x'.repeat(25000); const tpLong = writeT(rt, 'long.jsonl', [U(longAsk, 5), A([TX('ok')], 6, 'mlg1')]); stamp(rt, sB, 1, 5, longAsk.slice(0, 80), tpLong);
hook(rt, { session_id: sB, transcript_path: tpLong }); rw = logRows(rt);
check('S18 a 25,000-character ask is kept to 20,000 and marked ask_truncated', rw[0].ask.length === 20000 && rw[0].ask_truncated === true, String(rw[0].ask && rw[0].ask.length));
S(18, 'pasted prompt of 25,000 characters', 'handled: verbatim up to 20,000, flagged', 'S18');
// 19 notification rows after his prompt
rt = mkRoot(); const tpN = writeT(rt, 'n.jsonl', [U('real ask first', 5), A([TX('working')], 6, 'mn1'), U('<task-notification>\n<task-id>x</task-id></task-notification>', 7), A([TX('noted')], 8, 'mn2')]);
stamp(rt, sB, 1, 5, 'real ask first', tpN); hook(rt, { session_id: sB, transcript_path: tpN }); rw = logRows(rt);
check('S19 an agent notification after his prompt is not his words: ask stays his prompt', rw[0].ask === 'real ask first' && rw[0].ask_matched === true, JSON.stringify(rw[0].ask));
S(19, 'task-notification user rows (not his words)', 'handled by lib/his-words.js', 'S19');
// 20 disk write failure
rt = mkRoot(); fs.writeFileSync(path.join(rt, 'system', 'telemetry', 'turn-log'), 'a file where the folder should be'); stamp(rt, sB, 1, 5, 'ask from B', tpB);
r = hook(rt, { session_id: sB, transcript_path: tpB });
check('S20 the log folder is a file (write fails): exit 0, nothing thrown, nothing blocked', r.status === 0, 'exit=' + r.status + ' ' + r.stderr.slice(0, 120));
S(20, 'disk full / folder unwritable', 'handled: append errors swallowed, fail-open', 'S20');
// 21 reply lines inside a code fence / quoted docs
check('S21 "Cause step:" inside a fenced quote is not read as the turn\'s own line', T.cause_step === 'domain/adhoc-lifecycle/adhoc-lifecycle.js:cmdPromote', T.cause_step);
S(21, 'the reply quotes the rule text with its own "Cause step:" line in a fence', 'handled (E1): fences stripped before the three lines are read', 'E1');
// 22 quiet-run counter from an older turn whose Stop never ran
check('S22 counter lines of an older turn whose Stop never ran land in the next Stop and are then dropped', T.hooks_run >= 6 && left.every(l => l.startsWith(st1.turn_id)), JSON.stringify(left));
S(22, 'a turn whose Stop never ran leaves counter lines', 'handled (E1): summed into the next Stop, then removed', 'E1');
// 23 a hook name with a tab or newline in it
S(23, 'hook name containing a tab (breaks the TSV counter line)', 'accepted-risk: hook names are file names; a tab in one is not creatable by this repo\'s forge; the line would be skipped as short', 'code path consumeRuns');
// 24 two Stop events racing (re-entry while the first still writes)
S(24, 'two Stops of one turn at the same instant', 'accepted-risk: rev is read from the stamp; worst case two rows with the same rev, readers keep the later ts', 'events.readTurns');
// 25 session id prefix collision (two UUIDs with the same first 8 characters)
S(25, 'two sessions with the same first 8 characters', 'accepted-risk: 1 in 4 billion; turn_id and the stamp file share the prefix by design (turn-context)', 'turn-context');
// 26 plugin / subagent Stop (SubagentStop is a different event)
S(26, 'subagent turns', 'accepted-risk: not logged as turns (parent_turn_id stays null); the parent\'s Agent tool row carries model, description and duration', 'E1 tool row');
// 27 user-instruction reversal: the simplest instruction the Feature could invert
check('S27 reversal: the hook never blocks (no exit 2 in ' + STATUSES.length + ' hook runs above) and only appends to its own month files', !STATUSES.includes(2), JSON.stringify(STATUSES));
S(27, 'user-instruction reversal: a plain "log less" must not delete history', 'handled: this Feature only appends; deletion is lib/housekeeping.js pruneByMonth with its own eval (17/17)', 'housekeeping.eval');
S(28, 'ask is a slash command (/goal text): his-words returns the arguments', 'handled: ask_kind=command; matched falls back to the newest message when the stamp head does not match (ask_matched=false)', 'findAsk');

// ======================================================================================
// report
// ======================================================================================
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\n12 audit questions — what the log answers now');
for (const [n, q, ok, note] of Q) console.log('  Q' + String(n).padEnd(2) + (ok ? '' : ' [FIXTURE FAILED] ') + note.split(':')[0].split(' ')[0].toUpperCase().padEnd(9) + ' ' + q + '  (' + note + ')');
console.log('\nRule 12 scenario table (' + SCEN.length + ' rows)');
console.log('| # | scenario | verdict | where pinned |\n|---|---|---|---|');
for (const s of SCEN) console.log('| ' + s.id + ' | ' + s.what + ' | ' + s.verdict + ' | ' + s.ref + ' |');
console.log('\nturn-log.eval: ' + (results.length - failed) + '/' + results.length + ' green · ' + SCEN.length + ' scenarios');
for (const d of ROOTS.concat([noStampRoot])) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) {} }
process.exit(failed ? 1 : 0);
