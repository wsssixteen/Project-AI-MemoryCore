#!/usr/bin/env node
// session-name.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-09-23: miya renamed every session by hand (sidebar full of long app-made titles like 'Claude Code session naming format')
// Every fixture runs the real hook in a child process with its own temp seen-file, log untouched (SESSION_NAME_SEEN).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'session-name.check.hook.js');
const ROOT = path.resolve(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'session-name-eval-'));
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
let k = 0;
function run(input, opts = {}) {
  const seen = opts.seen || path.join(TMP, 'seen' + (k++) + '.json');
  const env = { ...process.env, CLAUDE_PROJECT_DIR: opts.root || ROOT, SESSION_NAME_SEEN: seen, SESSION_NAME_LOG: path.join(TMP, 'log.jsonl'), SESSION_NAME_NOW: '2026-10-28T09:00:00+08:00', HOOK_TELEMETRY_OFF: '1' };
  const r = spawnSync(process.execPath, [opts.hook || HOOK], { input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8', timeout: 30000, env });
  return { status: r.status, out: r.stdout || '', err: r.stderr || '', seen };
}
function transcript(lines) { const f = path.join(TMP, 't' + (k++) + '.jsonl'); fs.writeFileSync(f, lines.map(o => JSON.stringify(o)).join('\n') + '\n'); return f; }
const typed = (text) => ({ type: 'user', message: { role: 'user', content: text } });
const typedArr = (text) => ({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } });
const toolRes = () => ({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'x' }] } });
const meta = (text) => ({ type: 'user', isMeta: true, message: { role: 'user', content: text } });
const DATE = '28/10/2026 - ';

// F1 clean input
let r = run('{}');
check('F1 empty JSON exits 0, silent', r.status === 0 && !r.out, 'exit=' + r.status + ' out=' + r.out);
// F2 replay: first message, no ticket
r = run({ session_id: 's2', prompt: 'help me check the arabic review app', transcript_path: transcript([]) });
check('F2 replay: first message, no ticket → rename line with date + keywords slot', r.status === 0 && r.out.includes('"' + DATE + '<2-4 keywords>"') && r.out.includes('set_session_title'), r.out);
// F3 first message with a ticket number
r = run({ session_id: 's3', prompt: 'lets start on 286650 PLTP SPI ralat', transcript_path: transcript([typed('lets start on 286650 PLTP SPI ralat')]) });
check('F3 ticket number → exact title "28/10/2026 - 286650"', r.out.includes('"' + DATE + '286650"'), r.out);
// F4 ticket written with a hashtag
r = run({ session_id: 's4', prompt: 'check #279711 please', transcript_path: transcript([]) });
check('F4 "#279711" → title without the hashtag', r.out.includes('"' + DATE + '279711"'), r.out);
// F5 second prompt of the same session (seen marker)
const seen5 = path.join(TMP, 'seen-shared.json');
run({ session_id: 's5', prompt: 'first', transcript_path: transcript([]) }, { seen: seen5 });
r = run({ session_id: 's5', prompt: 'second', transcript_path: transcript([typed('first'), typed('second')]) }, { seen: seen5 });
check('F5 second prompt of a session is silent', r.status === 0 && !r.out, r.out);
// F6 resumed old session: earlier typed prompts, no marker
r = run({ session_id: 's6', prompt: 'okay what is left', transcript_path: transcript([typed('old ask'), toolRes(), typed('okay what is left')]) });
check('F6 resumed old session (earlier typed prompt) is silent', !r.out, r.out);
// F7 old session marked so the transcript is read only once
check('F7 old session gets marked seen', JSON.parse(fs.readFileSync(r.seen, 'utf8')).s6 > 0, 'not marked');
// F8 huge transcript = old session
const big = path.join(TMP, 'big.jsonl'); fs.writeFileSync(big, 'x'.repeat(600 * 1024));
r = run({ session_id: 's8', prompt: 'hello', transcript_path: big });
check('F8 transcript over 512 KB is treated as an old session (silent)', !r.out, r.out);
// F9 machine notice first: wait, no mark
r = run({ session_id: 's9', prompt: '<task-notification>done</task-notification>', transcript_path: transcript([]) });
check('F9 task notification as first prompt: silent and NOT marked', !r.out && !fs.existsSync(r.seen), r.out);
// F10 cross-session message first: wait
r = run({ session_id: 's10', prompt: '<cross-session-message from="x">do y</cross-session-message>', transcript_path: transcript([]) });
check('F10 cross-session message: silent, not marked', !r.out && !fs.existsSync(r.seen), r.out);
// F11 machine notices + tool results + meta in the transcript do not count as typed prompts
r = run({ session_id: 's11', prompt: 'real first ask', transcript_path: transcript([meta('Caveat: local command'), typed('<task-notification>x</task-notification>'), toolRes(), typed('real first ask')]) });
check('F11 meta, tool results and machine notices are not typed prompts → fires', r.out.includes('session-name'), r.out);
// F12 current prompt already in the transcript as an array content
r = run({ session_id: 's12', prompt: 'array shaped', transcript_path: transcript([typedArr('array shaped')]) });
check('F12 current prompt present as array content → still first → fires', r.out.includes('session-name'), r.out);
// F13 missing transcript path
r = run({ session_id: 's13', prompt: 'no transcript yet' });
check('F13 no transcript_path → treated as new → fires', r.out.includes('session-name'), r.out);
// F14 transcript path that does not exist
r = run({ session_id: 's14', prompt: 'x', transcript_path: path.join(TMP, 'nope.jsonl') });
check('F14 missing transcript file → fires (fail toward naming)', r.out.includes('session-name'), r.out);
// F15 malformed stdin
r = run('not json at all');
check('F15 malformed stdin exits 0, silent', r.status === 0 && !r.out, r.out + r.err);
// F16 no session_id
r = run({ prompt: 'hi', transcript_path: transcript([]) });
check('F16 no session_id → silent', !r.out, r.out);
// F17 permohonan id is not a ticket
r = run({ session_id: 's17', prompt: 'PTMLK/01/L/PRBB/2026/12 error', transcript_path: transcript([]) });
check('F17 permohonan id is not read as a ticket', r.out.includes('<2-4 keywords>'), r.out);
// F18 7-digit aplikasi id is not a ticket
r = run({ session_id: 's18', prompt: 'apl 3408184 crashes', transcript_path: transcript([]) });
check('F18 7-digit aplikasi id is not a ticket', r.out.includes('<2-4 keywords>'), r.out);
// F19 the hook's own line pasted back as his first message
r = run({ session_id: 's19', prompt: '📛 session-name: first message of this session. Rename it now', transcript_path: transcript([]) });
check('F19 own help text pasted as first message still fires once (no self-disarm)', r.out.includes('set_session_title'), r.out);
// F20 corrupt seen file
const bad = path.join(TMP, 'bad-seen.json'); fs.writeFileSync(bad, '{{{');
r = run({ session_id: 's20', prompt: 'x', transcript_path: transcript([]) }, { seen: bad });
check('F20 corrupt seen file → fires and rewrites it', r.out.includes('session-name') && JSON.parse(fs.readFileSync(bad, 'utf8')).s20 > 0, r.out);
// F21 two sessions share the seen file without clobbering
const shared = path.join(TMP, 'seen-two.json');
run({ session_id: 'a', prompt: 'x', transcript_path: transcript([]) }, { seen: shared });
run({ session_id: 'b', prompt: 'y', transcript_path: transcript([]) }, { seen: shared });
const j = JSON.parse(fs.readFileSync(shared, 'utf8'));
check('F21 two sessions both kept in the seen file', j.a > 0 && j.b > 0, JSON.stringify(j));
// F22 old seen entries pruned
const old = path.join(TMP, 'seen-old.json'); fs.writeFileSync(old, JSON.stringify({ ancient: Date.now() - 10 * 24 * 3600 * 1000 }));
run({ session_id: 'new', prompt: 'x', transcript_path: transcript([]) }, { seen: old });
check('F22 seen entries older than 3 days are pruned', !('ancient' in JSON.parse(fs.readFileSync(old, 'utf8'))), fs.readFileSync(old, 'utf8'));
// F23 date has no zero padding (matches his sidebar "21/9/2026")
r = run({ session_id: 's23', prompt: 'x', transcript_path: transcript([]) });
check('F23 date is D/M/YYYY without zero padding', /"28\/10\/2026 - /.test(r.out), r.out);
// F24 output is one line, short
check('F24 output is one line under 400 characters', r.out.trim().split('\n').length === 1 && r.out.length < 400, r.out.length + ' chars');
// F25 registered in the upsm-mode bundle, not standalone
const bundle = fs.readFileSync(path.join(ROOT, 'domain', 'bundles', 'upsm-mode.json'), 'utf8');
const settings = fs.readFileSync(path.join(ROOT, '.claude', 'settings.json'), 'utf8');
check('F25 registered as a child of the upsm-mode bundle, not a standalone hook', bundle.includes('domain/session-name/session-name.check.hook.js') && !settings.includes('session-name.check.hook.js'), 'registration');
// F26 --audit runs and exits 0/1
const a = spawnSync(process.execPath, [HOOK, '--audit'], { encoding: 'utf8', timeout: 30000 });
check('F26 --audit prints a verdict and exits 0 or 1', (a.status === 0 || a.status === 1) && /session-name audit:/.test(a.stdout), a.stdout + a.stderr);

fs.rmSync(TMP, { recursive: true, force: true });
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nsession-name.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
