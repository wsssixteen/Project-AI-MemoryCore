#!/usr/bin/env node
// wa-watch-health.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-11-10: the events log shows daemon-stop on 2026-11-03 with no later heartbeat and
// check-login ok:false; expected one alarm naming both.
// Every fixture builds a temp WaRead home (events.jsonl + watcher\registry-<day>.json) and runs the real hook on it.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'wa-watch-health.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const NOW = '2026-11-10T06:00:00.000Z';
const at = (min) => new Date(Date.parse(NOW) - min * 60000).toISOString();
const pad = (n) => String(n).padStart(2, '0');
const dayOf = (ms) => { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const W = (min, event, more) => JSON.stringify({ ts: at(min), cmd: 'watch', event, ...(more || {}) });
let seq = 0;
function run({ events, registries, stdin, noHome, rawEvents }) {
  const home = path.join(os.tmpdir(), 'wa-watch-health-eval-' + process.pid + '-' + (++seq));
  if (!noHome) {
    fs.mkdirSync(path.join(home, 'watcher'), { recursive: true });
    if (rawEvents !== undefined) fs.writeFileSync(path.join(home, 'events.jsonl'), rawEvents);
    else if (events) fs.writeFileSync(path.join(home, 'events.jsonl'), events.join('\n') + '\n');
    for (const [day, body] of Object.entries(registries || {})) fs.writeFileSync(path.join(home, 'watcher', 'registry-' + day + '.json'), typeof body === 'string' ? body : JSON.stringify(body));
  }
  const r = spawnSync(process.execPath, [HOOK], { input: stdin === undefined ? '{}' : stdin, encoding: 'utf8', timeout: 30000, env: { ...process.env, WA_WATCH_HEALTH_HOME: home, WA_WATCH_HEALTH_NOW: NOW } });
  try { fs.rmSync(home, { recursive: true, force: true }); } catch (_) {}
  const out = String(r.stdout || '');
  return { status: r.status, out, lines: out.split('\n').filter((l) => l.startsWith('WA-WATCH: ')) };
}
const healthy = [W(9, 'check-login', { ok: true }), W(3, 'heartbeat', { conn: 'open', pid: 999999 })];

// F1: clean input, no WaRead on this machine → silent, exit 0
let r = run({ noHome: true });
check('F1 no WaRead home: exit 0 and silent', r.status === 0 && r.lines.length === 0, 'exit=' + r.status + ' out=' + r.out.slice(0, 120));

// F2: THE REPLAY CASE (2026-11-10): stopped on 2026-11-03 with no reason, login dead → two lines, both fixes named
r = run({ events: [W(10240, 'daemon-start'), W(10239, 'daemon-stop'), W(210, 'check-login', { ok: false })] });
check('F2 replay: STOPPED line + login DEAD line, exactly two', r.status === 0 && r.lines.length === 2 && /STOPPED/.test(r.lines[0]) && /not recorded/.test(r.lines[0]) && /schtasks \/run \/tn "WaRead Watcher"/.test(r.lines[0]) && /login is DEAD/.test(r.lines[1]) && /claude login/.test(r.lines[1]), r.out.slice(0, 300));
check('F2b the alarm tells the session to say it in the first reply', /first reply/.test(r.out), r.out.slice(-160));

// F3: healthy (beat 3 min ago, login ok) → silent
r = run({ events: healthy });
check('F3 healthy watcher: silent', r.status === 0 && r.out.trim() === '', r.out.slice(0, 200));

// F4: heartbeat 30 min old, process gone, no stop row → STOPPED (killed or shut down)
r = run({ events: [W(40, 'check-login', { ok: true }), W(30, 'heartbeat', { pid: 999999 })] });
check('F4 stale heartbeat + dead pid: STOPPED, "killed or the laptop shut down"', r.lines.length === 1 && /STOPPED/.test(r.lines[0]) && /killed or the laptop shut down/.test(r.lines[0]), r.out.slice(0, 300));

// F5: heartbeat 30 min old but the process is alive (laptop just woke) → silent
r = run({ events: [W(40, 'check-login', { ok: true }), W(30, 'heartbeat', { pid: process.pid })] });
check('F5 stale heartbeat + live pid (sleep and wake): silent', r.lines.length === 0, r.out.slice(0, 300));

// F6: a stop row after the last beat wins even when that pid number is alive (pid reuse) and names its reason
r = run({ events: [W(40, 'check-login', { ok: true }), W(5, 'heartbeat', { pid: process.pid }), W(4, 'daemon-stop', { reason: 'SIGHUP' })] });
check('F6 stop row after the beat: STOPPED with reason SIGHUP', r.lines.length === 1 && /last stop reason: SIGHUP/.test(r.lines[0]), r.out.slice(0, 300));

// F7: a start waiting in YESTERDAY's registry (login failure) → waiting line with the count; no session name, no message words
const yesterday = dayOf(Date.parse(NOW) - 86400000);
r = run({ events: healthy, registries: { [yesterday]: { day: yesterday, pending: [{ key: 'K1', name: 'MLK ADHOC - PT - rahsia perkataan mesej', handoverFile: 'h.md', login: true, reason: 'OAuth session expired', ts: Date.parse(NOW) - 600 * 60000 }] } } });
check('F7 one start waiting from yesterday: counted', r.lines.length === 1 && /^WA-WATCH: 1 WhatsApp start\(s\) are WAITING/.test(r.lines[0]) && /check-login/.test(r.lines[0]), r.out.slice(0, 300));
check('F7b the waiting line never prints the session name (it carries message words)', !/rahsia|perkataan|ADHOC - PT/.test(r.out), r.out.slice(0, 300));

// F8: broken lines in the log and a broken registry file → no crash, healthy rows still read
r = run({ rawEvents: 'not json\n{"ts":\n' + healthy.join('\n') + '\n{"half":', registries: { [dayOf(Date.parse(NOW))]: '{broken' } });
check('F8 broken log lines + broken registry: exit 0 and silent', r.status === 0 && r.lines.length === 0, 'exit=' + r.status + ' ' + r.out.slice(0, 200));

// F9: stdin is not JSON / empty → exit 0, still alarms on a stopped watcher
r = run({ stdin: 'garbage', events: [W(100, 'daemon-start'), W(99, 'daemon-stop', { reason: 'crash: boom' })] });
check('F9 garbage stdin: exit 0 and the alarm still prints', r.status === 0 && r.lines.length === 1 && /crash: boom/.test(r.lines[0]), 'exit=' + r.status + ' ' + r.out.slice(0, 200));

// F10: a judge TIMEOUT is not a dead login
r = run({ events: [W(9, 'check-login', { ok: true }), W(4, 'judge', { ok: false, err: 'timed out after 180000 ms' }), W(3, 'heartbeat', { pid: 999999 })] });
check('F10 judge timeout: login not called dead', r.lines.length === 0, r.out.slice(0, 200));

// F11: a judge auth failure after a good check-login IS a dead login; a later good child clears it
r = run({ events: [W(60, 'check-login', { ok: true }), W(4, 'judge', { ok: false, err: 'Failed to authenticate: OAuth session expired' }), W(3, 'heartbeat', { pid: 999999 })] });
check('F11 judge auth failure: login DEAD', r.lines.length === 1 && /login is DEAD/.test(r.lines[0]), r.out.slice(0, 200));
r = run({ events: [W(60, 'check-login', { ok: false }), W(10, 'child-done', {}), W(3, 'heartbeat', { pid: 999999 })] });
check('F11b a later finished child: login alive again, silent', r.lines.length === 0, r.out.slice(0, 200));

// F12: a log far larger than the tail window (2 MB of other rows first) → only the tail is read, verdict still right, fast
const filler = JSON.stringify({ ts: at(5000), cmd: 'sync', event: 'done', pad: 'x'.repeat(900) }) + '\n';
const t0 = Date.now();
r = run({ rawEvents: filler.repeat(2200) + healthy.join('\n') + '\n' });
check('F12 2 MB log: silent on a healthy tail, under 5 s', r.status === 0 && r.lines.length === 0 && Date.now() - t0 < 5000, 'ms=' + (Date.now() - t0) + ' ' + r.out.slice(0, 120));

// F13: WaRead installed but the watcher never ran (only sync rows) → silent
r = run({ events: [JSON.stringify({ ts: at(50), cmd: 'sync', event: 'done' })] });
check('F13 no watcher rows at all: silent', r.lines.length === 0, r.out.slice(0, 200));

// F14: its own alarm text pasted into the log as a field does not create a second alarm
r = run({ events: [W(9, 'check-login', { ok: true }), W(4, 'error', { message: 'WA-WATCH: the WhatsApp watcher is STOPPED daemon-stop' }), W(3, 'heartbeat', { pid: 999999 })] });
check('F14 own alarm text inside a log field: silent', r.lines.length === 0, r.out.slice(0, 200));

// F15: old rows with no pid field (the daemon before 2026-11-10) → a stale daemon-start reads as stopped, no crash
r = run({ events: [W(9000, 'daemon-start')] });
check('F15 old daemon-start with no pid and no stop row: STOPPED', r.status === 0 && r.lines.length === 1 && /STOPPED/.test(r.lines[0]), r.out.slice(0, 200));

// F16: all three problems at once → exactly three lines, one each
r = run({ events: [W(300, 'daemon-start'), W(299, 'daemon-stop', { reason: 'SIGINT' }), W(200, 'check-login', { ok: false })], registries: { [dayOf(Date.parse(NOW))]: { pending: [{ key: 'a', ts: 1, login: false }, { key: 'b', login: false }] } } });
check('F16 stopped + login dead + 2 waiting: three lines', r.lines.length === 3 && /2 WhatsApp start\(s\) are WAITING/.test(r.lines[2]) && /retries every 5 minutes/.test(r.lines[2]), r.out.slice(0, 400));

// F17: a registry whose "pending" is not a list → ignored
r = run({ events: healthy, registries: { [dayOf(Date.parse(NOW))]: { pending: 'yes' } } });
check('F17 pending is not a list: silent', r.status === 0 && r.lines.length === 0, r.out.slice(0, 200));

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12: the 20-row table with verdicts is in README.md §Adversarial scenarios.
// Fixtures above cover: self-referential text (F14), malformed inputs (F8, F9, F17), huge log (F12), dependency
// missing (F1, F13), old-format rows (F15), pid reuse (F6), sleep and wake (F5), message text leaking (F7b).

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nwa-watch-health.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
