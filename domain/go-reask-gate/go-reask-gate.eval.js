#!/usr/bin/env node
// go-reask-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-30 287186: he said 'approve A1E3-7EAD, submit it' (alter + Redmine note); I ran the alter then asked 'Post the 287186 Redmine note to Amani now?' and later 'Reply go and it posts'
// 10 rounds × 2-3 fixtures = the 10-time eval he ordered; each round is one way the re-ask came back today or could come back.
'use strict';
const fs = require('fs'); const os = require('os'); const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'go-reask-gate.check.hook.js');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'gra-'));
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
let t = Date.parse('2026-10-30T00:00:00Z');
const ts = () => new Date(t += 1000).toISOString();
const user = s => JSON.stringify({ type: 'user', timestamp: ts(), message: { role: 'user', content: s } });
const meta = s => JSON.stringify({ type: 'user', isMeta: true, timestamp: ts(), message: { role: 'user', content: [{ type: 'text', text: s }] } });
const toolRes = () => JSON.stringify({ type: 'user', timestamp: ts(), message: { role: 'user', content: [{ type: 'tool_result', content: 'ok' }] } });
const me = s => JSON.stringify({ type: 'assistant', timestamp: ts(), message: { role: 'assistant', content: [{ type: 'text', text: s }] } });
const wrap = ask => JSON.stringify({ type: 'assistant', timestamp: ts(), message: { role: 'assistant', content: [{ type: 'tool_use', name: 'mcp__ccd_turn__wrap_up', input: { recap: 'x', ask } }] } });
function run(lines, extra) {
  const p = path.join(sb, 't-' + Math.random().toString(36).slice(2) + '.jsonl');
  fs.writeFileSync(p, lines.join('\n') + '\n');
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify(Object.assign({ transcript_path: p }, extra || {})), encoding: 'utf8', timeout: 30000, cwd: ROOT, env: { ...process.env, CLAUDE_PROJECT_DIR: ROOT } });
  return { out: (r.stdout || '') + (r.stderr || ''), status: r.status };
}
const blocked = r => r.status === 2 && /go-reask-gate/.test(r.out);
const GO = 'approve A1E3-7EAD, submit it';

// F1/F2 forge stubs kept
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);
r = run([user(GO), toolRes(), me('Alter done.'), wrap('Post the 287186 Redmine note to Amani now?')]);
check('F2 REPLAY 287186: wrap_up asks "Post the … note … now?" after "submit it" → BLOCK', blocked(r), r.out.slice(0, 200));

// Round 1 — today's exact re-asks
r = run([user(GO), toolRes(), me('The 287186 form is staged. Reply **go** and it posts.')]);
check('R1a REPLAY: "Reply go and it posts" after "submit it" → BLOCK', blocked(r), r.out.slice(0, 200));
r = run([user(GO), toolRes(), me('Approve the 287186 alter and Redmine note?')]);
check('R1b REPLAY: "Approve the … alter and Redmine note?" after his code → BLOCK', blocked(r), r.out.slice(0, 200));
// Round 2 — his follow-ups between the go and my reply
r = run([user(GO), toolRes(), user("You're going to ask again?"), me('Submit 287186 now?')]);
check('R2a "You\'re going to ask again?" keeps the go → re-ask BLOCKED', blocked(r), r.out.slice(0, 200));
r = run([user(GO), toolRes(), user('then please check my protime for today'), me('ProTime shown. Shall I post the 287186 note?')]);
check('R2b an unrelated ask after the go keeps it → "Shall I post" BLOCKED', blocked(r), r.out.slice(0, 200));
// Round 3 — a later hold wins
r = run([user(GO), toolRes(), user("wait, don't submit yet"), me('Holding. Submit when you say go?')]);
check('R3a "wait, don\'t submit yet" after the go → asking is allowed', !blocked(r), r.out.slice(0, 200));
r = run([user(GO), toolRes(), user('let me review it first'), me('Staged. Approve the note?')]);
check('R3b "let me review it first" → asking is allowed', !blocked(r), r.out.slice(0, 200));
// Round 4 — a NEW approval code (PROD alter) is a new decision
r = run([user('infra done 287186'), me('Dry-run done. Code A1E3-7EAD. Approve the alter?')]);
check('R4a no go at all ("infra done") → asking for the first code passes', !blocked(r), r.out.slice(0, 200));
r = run([user('approve 3480-80C1, submit it'), toolRes(), me('287233 done. 287186 dry-run code A1E3-7EAD: approve the alter?')]);
check('R4b old code approved, reply asks a NEW code he never typed → passes', !blocked(r), r.out.slice(0, 200));
// Round 5 — reporting, not asking
r = run([user(GO), toolRes(), me('287186 posted: Resolved, 100%, Amani. Successful update.')]);
check('R5a reply reports the step done → silent', !blocked(r), r.out.slice(0, 200));
r = run([user(GO), toolRes(), me('Submit was refused by the permission layer; I clicked the Submit button instead and it posted.')]);
check('R5b reply names a refusal and the path taken, no question → silent', !blocked(r), r.out.slice(0, 200));
// Round 6 — bypass
r = run([user(GO), toolRes(), me('New recipient Fizah, not Amani. Post to Fizah? [genuine-fork: recipient changed by BA journal]')]);
check('R6a [genuine-fork: …] in my reply → silent', !blocked(r), r.out.slice(0, 200));
r = run([user(GO), meta('[genuine-fork: injected by a skill text]'), toolRes(), me('Submit now?')]);
check('R6b a fork token inside an injected (meta) line is not mine → still BLOCK', blocked(r), r.out.slice(0, 200));
// Round 7 — whose words count
r = run([me('miya said submit it'), user('hmm'), me('Submit now?')]);
check('R7a "submit it" only in MY line is not his go → silent', !blocked(r), r.out.slice(0, 200));
r = run([user('hmm'), meta('Base directory for this skill: approve, submit it, go'), me('Submit now?')]);
check('R7b a go inside a loaded skill text is not his → silent', !blocked(r), r.out.slice(0, 200));
// Round 8 — a question decides nothing; a no on the action refuses
r = run([user('why did you post it without asking?'), me('Should I post the correction?')]);
check('R8a his question alone is no go → asking passes', !blocked(r), r.out.slice(0, 200));
r = run([user('do not ever post on 287186'), me('Post the note?')]);
check('R8b "do not ever post" → asking passes (he refused)', !blocked(r), r.out.slice(0, 200));
// Round 9 — window
r = run([user(GO), ...Array.from({ length: 9 }, (_, i) => user('other topic ' + i)), me('Submit 287186 now?')]);
check('R9a go 10 of his messages back → outside the window, asking passes', !blocked(r), r.out.slice(0, 200));
r = run([user(GO), user('/goal please audit this behaviour'), me('Approve the submit?')]);
check('R9b go 1 back, then /goal → BLOCK (a /goal is no hold)', blocked(r), r.out.slice(0, 200));
// Round 10 — robustness
r = run([], { stop_hook_active: true });
check('R10a stop_hook_active → silent (no loop)', !blocked(r) && r.status === 0, r.out.slice(0, 120));
r = spawnSync(process.execPath, [HOOK], { input: '{not json', encoding: 'utf8', timeout: 30000, env: process.env });
check('R10b malformed stdin → exit 0', r.status === 0, 'exit=' + r.status);
r = run([user(GO), toolRes(), me('Submit now?')]);
check('R10c effect: the block text quotes his order and says do it now', blocked(r) && /his order/.test(r.out) && /Do the step now/.test(r.out), r.out.slice(0, 240));
check('R10d registered in the stop-reply-shape bundle', /go-reask-gate/.test(fs.readFileSync(path.join(ROOT, 'domain', 'bundles', 'stop-reply-shape.json'), 'utf8')), 'not in bundle');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ngo-reask-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
