#!/usr/bin/env node
// session-name.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-09-23: miya renamed every session by hand (sidebar full of long app-made titles like 'Claude Code session naming format')
// v2 replay (2026-10-28): 9c200d4c 'QA tickets review' and child alter-sim 'Build alter-sim…' stayed undated — the upsm-mode
//   bundle was killed at the 30 s harness timeout (open-quest-surfacer 22-26 s), and goal_met was written at fire time.
// Every fixture runs the real hook in a child process with its own temp seen-file and log (SESSION_NAME_SEEN / SESSION_NAME_LOG).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'session-name.check.hook.js');
const ROOT = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'session-name-eval-'));
const LOGF = path.join(TMP, 'log.jsonl');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
let k = 0;
function env(seen, extra) { return { ...process.env, CLAUDE_PROJECT_DIR: ROOT, SESSION_NAME_SEEN: seen, SESSION_NAME_LOG: LOGF, SESSION_NAME_NOW: '2026-10-28T09:00:00+08:00', HOOK_TELEMETRY_OFF: '1', ...(extra || {}) }; }
function run(input, opts = {}) {
  const seen = opts.seen || path.join(TMP, 'seen' + (k++) + '.json');
  const r = spawnSync(process.execPath, [opts.hook || HOOK], { input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8', timeout: 30000, env: env(seen) });
  return { status: r.status, out: r.stdout || '', err: r.stderr || '', seen };
}
function transcript(lines) { const f = path.join(TMP, 't' + (k++) + '.jsonl'); fs.writeFileSync(f, lines.map(o => typeof o === 'string' ? o : JSON.stringify(o)).join('\n') + '\n'); return f; }
const typed = (text) => ({ type: 'user', message: { role: 'user', content: text } });
const typedArr = (text) => ({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } });
const toolRes = () => ({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'x' }] } });
const meta = (text) => ({ type: 'user', isMeta: true, message: { role: 'user', content: text } });
const typedAt = (text, ts) => ({ type: 'user', timestamp: ts, entrypoint: 'claude-desktop', message: { role: 'user', content: text } });
const app = () => ({ type: 'bridge-session', entrypoint: 'claude-desktop' });
const titleRec = (t) => ({ type: 'custom-title', customTitle: t, sessionId: 'x' });
const renameCall = (title, sid) => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', name: 'mcp__ccd_session_mgmt__set_session_title', input: { session_id: sid || 'self', title } }] } });
const seenT = (file, sid) => { const v = JSON.parse(fs.readFileSync(file, 'utf8'))[sid]; return typeof v === 'number' ? v : v && v.t; };
const seenS = (file, sid) => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8'))[sid]; return v && v.s; } catch { return undefined; } };
const rows = (sid) => { try { return fs.readFileSync(LOGF, 'utf8').split('\n').filter(Boolean).map(JSON.parse).filter(x => !sid || x.sid === sid); } catch { return []; } };
const stop = (sid, tp, extra) => ({ hook_event_name: 'Stop', session_id: sid, transcript_path: tp, ...(extra || {}) });
const DATE = '28/10/2026 - ';

// ── UserPromptSubmit: new sessions (v1 fixtures, kept) ──
let r = run('{}');
check('F1 empty JSON exits 0, silent', r.status === 0 && !r.out, 'exit=' + r.status + ' out=' + r.out);
r = run({ session_id: 's2', prompt: 'help me check the arabic review app', transcript_path: transcript([]) });
check('F2 replay: first message, no ticket → rename line with date + keywords slot', r.status === 0 && r.out.includes('"' + DATE + '<2-4 keywords>"') && r.out.includes('set_session_title'), r.out);
r = run({ session_id: 's3', prompt: 'lets start on 286650 PLTP SPI ralat', transcript_path: transcript([typed('lets start on 286650 PLTP SPI ralat')]) });
check('F3 ticket number → exact title "28/10/2026 - 286650"', r.out.includes('"' + DATE + '286650"'), r.out);
r = run({ session_id: 's4', prompt: 'check #279711 please', transcript_path: transcript([]) });
check('F4 "#279711" → title without the hashtag', r.out.includes('"' + DATE + '279711"'), r.out);
const seen5 = path.join(TMP, 'seen-shared.json');
run({ session_id: 's5', prompt: 'first', transcript_path: transcript([]) }, { seen: seen5 });
r = run({ session_id: 's5', prompt: 'second', transcript_path: transcript([typed('first'), typed('second')]) }, { seen: seen5 });
check('F5 second prompt of a session is silent', r.status === 0 && !r.out, r.out);
// F6 v2: resumed old session with an undated title → fires, dated by its FIRST typed prompt, ticket from that prompt
r = run({ session_id: 's6', prompt: 'okay what is left', transcript_path: transcript([titleRec('Old long app title'), typedAt('look at 285532 please', '2026-10-20T01:00:00Z'), toolRes(), typed('okay what is left')]) });
check('F6 resumed undated session → its start date "20/10/2026 - 285532"', r.out.includes('"20/10/2026 - 285532"') && r.out.includes('no dated title yet'), r.out);
check('F7 resumed session gets marked seen (transcript read once)', seenT(r.seen, 's6') > 0, 'not marked');
// F8 v2: size no longer decides; a 600 KB transcript with no title and no typed prompt is a new session
const big = path.join(TMP, 'big.jsonl'); fs.writeFileSync(big, 'x'.repeat(600 * 1024));
r = run({ session_id: 's8', prompt: 'hello', transcript_path: big });
check('F8 600 KB transcript with no dated title → fires', r.out.includes('set_session_title'), r.out);
r = run({ session_id: 's9', prompt: '<task-notification>done</task-notification>', transcript_path: transcript([]) });
check('F9 task notification as first prompt: silent and NOT marked', !r.out && !fs.existsSync(r.seen), r.out);
r = run({ session_id: 's10', prompt: '<cross-session-message from="x">do y</cross-session-message>', transcript_path: transcript([]) });
check('F10 cross-session message: silent, not marked', !r.out && !fs.existsSync(r.seen), r.out);
r = run({ session_id: 's11', prompt: 'real first ask', transcript_path: transcript([meta('Caveat: local command'), typed('<task-notification>x</task-notification>'), toolRes(), typed('real first ask')]) });
check('F11 meta, tool results and machine notices are not typed prompts → fires', r.out.includes('first message of this session'), r.out);
r = run({ session_id: 's12', prompt: 'array shaped', transcript_path: transcript([typedArr('array shaped')]) });
check('F12 current prompt present as array content → still first → fires', r.out.includes('session-name'), r.out);
r = run({ session_id: 's13', prompt: 'no transcript yet' });
check('F13 no transcript_path → treated as new → fires', r.out.includes('session-name'), r.out);
r = run({ session_id: 's14', prompt: 'x', transcript_path: path.join(TMP, 'nope.jsonl') });
check('F14 missing transcript file → fires (fail toward naming)', r.out.includes('session-name'), r.out);
r = run('not json at all');
check('F15 malformed stdin exits 0, silent', r.status === 0 && !r.out, r.out + r.err);
r = run({ prompt: 'hi', transcript_path: transcript([]) });
check('F16 no session_id → silent', !r.out, r.out);
r = run({ session_id: 's17', prompt: 'PTMLK/01/L/PRBB/2026/12 error', transcript_path: transcript([]) });
check('F17 permohonan id is not read as a ticket', r.out.includes('<2-4 keywords>'), r.out);
r = run({ session_id: 's18', prompt: 'apl 3408184 crashes', transcript_path: transcript([]) });
check('F18 7-digit aplikasi id is not a ticket', r.out.includes('<2-4 keywords>'), r.out);
r = run({ session_id: 's19', prompt: '📛 session-name: first message of this session. Rename it now', transcript_path: transcript([]) });
check('F19 own help text pasted as first message still fires once (no self-disarm)', r.out.includes('set_session_title'), r.out);
const bad = path.join(TMP, 'bad-seen.json'); fs.writeFileSync(bad, '{{{');
r = run({ session_id: 's20', prompt: 'x', transcript_path: transcript([]) }, { seen: bad });
check('F20 corrupt seen file → fires and rewrites it', r.out.includes('session-name') && seenT(bad, 's20') > 0, r.out);
const shared = path.join(TMP, 'seen-two.json');
run({ session_id: 'a', prompt: 'x', transcript_path: transcript([]) }, { seen: shared });
run({ session_id: 'b', prompt: 'y', transcript_path: transcript([]) }, { seen: shared });
check('F21 two sessions both kept in the seen file', seenT(shared, 'a') > 0 && seenT(shared, 'b') > 0, fs.readFileSync(shared, 'utf8'));
const old = path.join(TMP, 'seen-old.json'); fs.writeFileSync(old, JSON.stringify({ ancient: Date.now() - 10 * 24 * 3600 * 1000, ancientObj: { t: Date.now() - 10 * 24 * 3600 * 1000, s: 'done' } }));
run({ session_id: 'new', prompt: 'x', transcript_path: transcript([]) }, { seen: old });
const oldJ = JSON.parse(fs.readFileSync(old, 'utf8'));
check('F22 seen entries older than 3 days are pruned (number and object shapes)', !('ancient' in oldJ) && !('ancientObj' in oldJ), JSON.stringify(oldJ));
r = run({ session_id: 's23', prompt: 'x', transcript_path: transcript([]) });
check('F23 date is D/M/YYYY without zero padding', /"28\/10\/2026 - /.test(r.out), r.out);
check('F24 output is one line under 400 characters', r.out.trim().split('\n').length === 1 && r.out.length < 400, r.out.length + ' chars');

// ── Registration (F25 v2): first child of upsm-mode + budget; Stop child; one narrow PreToolUse registration ──
const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'domain', 'bundles', 'upsm-mode.json'), 'utf8'));
const stopB = JSON.parse(fs.readFileSync(path.join(ROOT, 'domain', 'bundles', 'stop-reply-shape.json'), 'utf8'));
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8'));
const REL = 'domain/session-name/session-name.check.hook.js';
const standalone = Object.entries(settings.hooks).flatMap(([ev, gs]) => gs.flatMap(g => g.hooks.filter(h => /session-name\.check\.hook/.test(h.command)).map(() => ev + ':' + (g.matcher || ''))));
check('F25a upsm-mode: session-name is the FIRST child (inside the 2 KB persisted-output preview) and budget_ms is 15000-25000', bundle.children[0] === REL && bundle.budget_ms >= 15000 && bundle.budget_ms <= 25000, JSON.stringify(bundle).slice(0, 160));
check('F25b stop-reply-shape carries the Stop check', stopB.children.includes(REL), stopB.children.join(','));
check('F25c only standalone registration = PreToolUse start_session|hand_off_to_session', standalone.length === 1 && standalone[0] === 'PreToolUse:mcp__ccd_session__start_session|mcp__ccd_session__hand_off_to_session', standalone.join(' | '));
const a = spawnSync(process.execPath, [HOOK, '--audit'], { encoding: 'utf8', timeout: 30000, env: env(path.join(TMP, 'audit-seen.json')) });
check('F26 --audit prints a verdict and exits 0 or 1', (a.status === 0 || a.status === 1) && /session-name audit:/.test(a.stdout), a.stdout + a.stderr);

// ── Start kinds (v2) ──
r = run({ session_id: 'k2', prompt: 'build alter-sim', transcript_path: transcript([app(), titleRec('28/10/2026 - alter-sim build'), typed('build alter-sim')]) });
check('K2 child session whose parent gave a dated title → silent', r.status === 0 && !r.out, r.out);
check('K2 … logged already-dated with goal_met true, marked done', rows('k2').some(x => x.outcome === 'already-dated' && x.goal_met === true) && seenS(r.seen, 'k2') === 'done', JSON.stringify(rows('k2')));
r = run({ session_id: 'k3', prompt: 'Background: … Task: build the alter-sim rollback preview', transcript_path: transcript([app(), titleRec('Build alter-sim: rollback preview of Flowable alters'), typed('Background: … Task: build the alter-sim rollback preview')]) });
check('K3 child session with an undated parent title → fires and names the current title to keep its topic', r.out.includes('first message of this session') && r.out.includes('current title "Build alter-sim'), r.out);
r = run({ session_id: 'k5', prompt: 'continue', transcript_path: transcript([app(), titleRec('21/10/2026 - 285532'), typedAt('285532 start', '2026-10-21T01:00:00Z'), typed('continue')]) });
check('K5 resumed session already dated → silent', !r.out && rows('k5').some(x => x.outcome === 'already-dated'), r.out);
r = run({ session_id: 'k6', prompt: 'next', transcript_path: transcript([app(), titleRec('20/10/2026 - x'), titleRec('Renamed later'), typed('first'), typed('next')]) });
check('K6 the LAST title record decides (undated later rename → fires)', r.out.includes('no dated title yet'), r.out);
const torn = transcript([app(), '{"type":"custom-title","customTitle":"28/10/2026 - tor', typed('hello torn')]);
r = run({ session_id: 'k7', prompt: 'hello torn', transcript_path: torn });
check('K7 a torn title line → no crash, fires', r.status === 0 && r.out.includes('set_session_title'), r.status + ' ' + r.out + r.err);
check('G1 a UserPromptSubmit fire writes goal_met null (pending), never true', rows('s2').every(x => x.goal_met === null) && rows('s2').length > 0, JSON.stringify(rows('s2')));

// ── Machine-first ──
const mSeen = path.join(TMP, 'seen-m.json');
const mT = transcript([app(), typed('<task-notification>x</task-notification>')]);
r = run({ session_id: 'm1', prompt: '<task-notification>x</task-notification>', transcript_path: mT }, { seen: mSeen });
const mStop = run(stop('m1', mT), { seen: mSeen });
check('M1 machine-first session: prompt waits and Stop does not block before his first real message', !r.out && mStop.status === 0 && !mStop.err, r.out + '|' + mStop.status + mStop.err);
r = run({ session_id: 'm1', prompt: 'now the real ask', transcript_path: transcript([app(), typed('<task-notification>x</task-notification>'), typed('now the real ask')]) }, { seen: mSeen });
check('M1 … his first real message then fires', r.out.includes('first message of this session'), r.out);

// ── Stop backstop ──
r = run(stop('st1', transcript([app(), typed('ask'), renameCall('28/10/2026 - ask'), titleRec('28/10/2026 - ask')])));
check('S1 Stop after the rename → silent, row "renamed" goal_met true', r.status === 0 && !r.err && rows('st1').some(x => x.outcome === 'renamed' && x.goal_met === true), r.status + r.err);
const s2Seen = path.join(TMP, 'seen-s2.json');
const s2T = transcript([app(), titleRec('QA tickets review'), typedAt('QA tickets review', '2026-10-28T02:42:00Z')]);
r = run(stop('st2', s2T), { seen: s2Seen });
check('S2 replay 9c200d4c: Stop with an undated title and no rename → blocks once (exit 2) with the rename line', r.status === 2 && r.err.includes('set_session_title') && r.err.includes('28/10/2026 - '), r.status + ' ' + r.err);
r = run(stop('st2', s2T), { seen: s2Seen });
check('S3 the second Stop does not block again → row "gave-up" goal_met false', r.status === 0 && rows('st2').some(x => x.outcome === 'gave-up' && x.goal_met === false), r.status + r.err);
r = run(stop('st4', transcript([app(), titleRec('undated'), typed('x')]), { stop_hook_active: true }));
check('S4 stop_hook_active → never blocks', r.status === 0 && !r.err, r.status + r.err);
r = run(stop('st5', transcript([app(), titleRec('undated app title'), typed('x'), renameCall('28/10/2026 - x')])));
check('S5 a dated set_session_title call counts even before the title record lands', r.status === 0 && rows('st5').some(x => x.outcome === 'renamed'), r.status + r.err);
r = run(stop('st6', transcript([app(), titleRec('undated'), typed('x'), renameCall('28/10/2026 - other', 'local_other')])));
check('S6 renaming ANOTHER session does not count → blocks', r.status === 2, r.status + r.err);
r = run(stop('st7', transcript([titleRec('undated'), typed('x')])));
check('S7 not the desktop app (no rename tool) → silent, row "no-app"', r.status === 0 && rows('st7').some(x => x.outcome === 'no-app'), r.status + r.err);
const s8Seen = path.join(TMP, 'seen-s8.json'); fs.writeFileSync(s8Seen, JSON.stringify({ st8: { t: Date.now(), s: 'done' } }));
const before8 = rows().length;
r = run(stop('st8', transcript([app(), titleRec('undated'), typed('x')])), { seen: s8Seen });
check('S8 a session already done → fast exit, no read, no row', r.status === 0 && rows().length === before8, r.status + r.err);
const s9Seen = path.join(TMP, 'seen-s9.json'); fs.writeFileSync(s9Seen, JSON.stringify({ st9: Date.now() }));
r = run(stop('st9', transcript([app(), titleRec('QA tickets review'), typed('x')])), { seen: s9Seen });
check('S9 a v1 (number) seen entry with an undated title still gets the Stop block', r.status === 2, r.status + r.err);
r = run(stop('st10', path.join(TMP, 'gone.jsonl')));
check('S10 Stop with a missing transcript → silent exit 0', r.status === 0 && !r.err, r.status + r.err);

// ── PreToolUse: parent side ──
r = run({ hook_event_name: 'PreToolUse', tool_name: 'mcp__ccd_session__start_session', tool_input: { title: 'Build alter-sim', initiation: 'own_initiative' }, session_id: 'p' });
check('P1 start_session with an undated title → refused (exit 2) with the dated title to use', r.status === 2 && r.err.includes('"28/10/2026 - Build alter-sim"'), r.status + r.err);
r = run({ hook_event_name: 'PreToolUse', tool_name: 'mcp__ccd_session__start_session', tool_input: { title: '28/10/2026 - alter-sim' }, session_id: 'p' });
check('P2 start_session with a dated title → allowed silently', r.status === 0 && !r.err && !r.out, r.status + r.err);
r = run({ hook_event_name: 'PreToolUse', tool_name: 'mcp__ccd_session__start_session', tool_input: { proposal_id: 'abc' }, session_id: 'p' });
check('P3 start_session by proposal_id only (no title) → allowed', r.status === 0, r.status + r.err);
r = run({ hook_event_name: 'PreToolUse', tool_name: 'mcp__ccd_session__hand_off_to_session', tool_input: { title: 'QA-262027 testing', remaining_plan: 'x' }, session_id: 'p' });
check('P4 hand_off_to_session with an undated title → refused', r.status === 2 && r.err.includes('28/10/2026 - QA-262027 testing'), r.status + r.err);
r = run({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { title: 'x' }, session_id: 'p' });
check('P5 any other tool → silent', r.status === 0 && !r.err, r.status + r.err);

// ── Audit: goal_met only from the real title ──
function auditWith(lines) {
  const f = path.join(TMP, 'audit' + (k++) + '.jsonl'); fs.writeFileSync(f, lines.map(x => JSON.stringify(x)).join('\n') + '\n');
  return spawnSync(process.execPath, [HOOK, '--audit'], { encoding: 'utf8', timeout: 30000, env: env(path.join(TMP, 'as.json'), { SESSION_NAME_LOG: f }) });
}
const old1 = new Date(Date.now() - 60 * 60 * 1000).toISOString(), fresh = new Date().toISOString();
let au = auditWith([{ ts: old1, sid: 'x', outcome: 'fired', title: DATE + '<2-4 keywords>', goal_met: null }]);
check('G2 audit FAILS a fire whose session never shows a dated title (the v1 self-audit passed this)', au.status === 1 && /1 never renamed/.test(au.stdout), au.stdout);
au = auditWith([{ ts: old1, sid: 'x', outcome: 'fired', title: DATE + '<2-4 keywords>', goal_met: null }, { ts: old1, sid: 'x', outcome: 'renamed', title: DATE + 'abc', goal_met: true }]);
check('G3 audit PASSES once a goal_met row exists for that session', au.status === 0, au.stdout);
au = auditWith([{ ts: fresh, sid: 'y', outcome: 'fired', title: DATE + '<2-4 keywords>', goal_met: null }]);
check('G4 audit leaves a fire younger than 15 minutes pending', au.status === 0, au.stdout);

// ── Slow bundle: the real dispatcher, a sibling slower than the budget ──
const SB = path.join(TMP, 'root');
for (const rel of ['lib/hook-runtime.js', 'lib/turn-context.js', 'lib/dispatch-hooks.js', REL]) {
  fs.mkdirSync(path.dirname(path.join(SB, rel)), { recursive: true }); fs.copyFileSync(path.join(ROOT, rel), path.join(SB, rel));
}
fs.writeFileSync(path.join(SB, 'slow.js'), 'setTimeout(() => process.stdout.write("BOARD"), 8000);');
fs.writeFileSync(path.join(SB, 'm.json'), JSON.stringify({ name: 'upsm-mode-test', budget_ms: 3000, children: [REL, 'slow.js'] }));
const t0 = Date.now();
const sb = spawnSync(process.execPath, [path.join(SB, 'lib', 'dispatch-hooks.js'), '--manifest', 'm.json', '--event', 'UserPromptSubmit'], {
  input: JSON.stringify({ hook_event_name: 'UserPromptSubmit', session_id: 'sb', prompt: 'look at 286650', transcript_path: transcript([app(), typed('look at 286650')]) }),
  encoding: 'utf8', timeout: 30000, env: { ...env(path.join(TMP, 'seen-sb.json')), CLAUDE_PROJECT_DIR: SB } });
const took = Date.now() - t0;
let sbCtx = ''; try { sbCtx = JSON.parse(sb.stdout).hookSpecificOutput.additionalContext; } catch { /* empty */ }
check('B1 slow sibling (8 s) past the bundle budget (3 s): the rename line is still delivered, first, in under 6 s', sbCtx.startsWith('📛 session-name') && sbCtx.includes(DATE + '286650') && !sbCtx.includes('BOARD') && took < 6000, 'took=' + took + ' out=' + sb.stdout.slice(0, 160));

fs.rmSync(TMP, { recursive: true, force: true });
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nsession-name.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
