#!/usr/bin/env node
// claude-md-watch.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-08-16 miya: when we change something we do not only run tests, we set up a thing to OBSERVE the specific things we touched, so next run you self-alert and we amend or revert
// 2026-10-06 (boot audit batch 2): real fixtures replace the stub. Session start prints the short form; the full
// list, the revert lines, add and resolve are unchanged; the countdown steps once a day.
// Runs on a temp ledger (CLAUDE_PROJECT_DIR): the real watch list is never touched.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'claude-md-watch.check.hook.js');
const REAL_ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-eval-'));
for (const d of ['lib', 'system', path.join('system', 'telemetry')]) fs.mkdirSync(path.join(tmp, d), { recursive: true });
for (const f of ['watch.js', 'hook-runtime.js', 'turn-context.js']) { try { fs.copyFileSync(path.join(REAL_ROOT, 'lib', f), path.join(tmp, 'lib', f)); } catch (_) {} }
const LEDGER = path.join(tmp, 'system', 'claude-md-watchlist.jsonl');
const env = { ...process.env, CLAUDE_PROJECT_DIR: tmp };
const w = (...a) => spawnSync(process.execPath, [path.join(tmp, 'lib', 'watch.js'), ...a], { encoding: 'utf8', timeout: 30000, env, cwd: tmp });
const hook = () => spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env });
const rows = () => { try { return fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch (_) { return []; } };
const seed = list => fs.writeFileSync(LEDGER, list.map(r => JSON.stringify(r)).join('\n') + '\n');
const iso = daysAgo => new Date(Date.now() - daysAgo * 86400000).toISOString();

// F1: no watch at all → silent, exit 0 (as before)
let r = hook();
check('F1 no open watch: session start prints nothing, exit 0', r.status === 0 && !/CHANGE-WATCH/.test(r.stdout + r.stderr), 'exit=' + r.status + ' ' + (r.stdout + r.stderr).slice(0, 80));

// five watches of different ages, one already overdue
seed([5, 4, 3, 2, 1].map((d, i) => ({ kind: 'watch', id: 'w' + i, ts: iso(d), target: 'file' + i + '.js', observe: 'observe text ' + i + ' ' + 'x'.repeat(200), sessions_left: i === 0 ? 0 : 3, rollback_sha: 'abcdef1234567890' })));
const full = w('check').stdout;
check('F2 `check` is unchanged: 5 watches, each with OBSERVE, the revert line and the close line', (full.match(/OBSERVE:/g) || []).length === 5 && (full.match(/revert : git checkout abcdef1234 -- /g) || []).length === 5 && (full.match(/close  : node lib\/watch\.js resolve /g) || []).length === 5 && /5 active observation/.test(full), full.slice(0, 120));
const brief = w('brief').stdout;
const bl = brief.trimEnd().split('\n');
check('F3 `brief`: count, overdue count and the oldest date on the first line', /^🔭 CHANGE-WATCH: 5 open · 1 overdue · oldest \d{4}-\d{2}-\d{2}$/.test(bl[0]), bl[0]);
check('F4 `brief`: exactly the 3 OLDEST watches, oldest first, each cut to one line', bl.length === 5 && /^\s+\[w0\] file0\.js — /.test(bl[1]) && /\[w1\]/.test(bl[2]) && /\[w2\]/.test(bl[3]) && bl.slice(1, 4).every(l => l.length < 160), JSON.stringify(bl.slice(1, 4).map(l => l.length)));
check('F5 `brief`: says how many more there are and names the command for the full list and for closing one', /\+2 more/.test(bl[4]) && /node lib\/watch\.js check/.test(bl[4]) && /node lib\/watch\.js resolve <id> ok\|anomaly/.test(bl[4]), bl[4]);
check('F6 the short form is a fraction of the full list', brief.length < full.length / 3 && brief.length < 900, brief.length + ' vs ' + full.length);

// session start: prints the short form, never the long one
const t0 = rows().filter(x => x.kind === 'tick').length;
r = hook();
const out = r.stdout + r.stderr;
check('F7 session start prints the short form (not 5 lines per watch)', r.status === 0 && /CHANGE-WATCH: 5 open/.test(out) && !/OBSERVE:/.test(out), out.slice(0, 160));
const t1 = rows().filter(x => x.kind === 'tick').length;
check('F8 the first start of the day steps the countdown once per watch', t1 === t0 + 5, t0 + ' → ' + t1);
hook(); hook();
check('F9 two more starts the same day do NOT step it again', rows().filter(x => x.kind === 'tick').length === t1, String(rows().filter(x => x.kind === 'tick').length));
check('F10 after the tick: w0 is at -1, the others at 2 (one step, not three)', /\[w0\] file0\.js \(changed .*, -1 session/.test(w('check').stdout) && /\[w1\] file1\.js \(changed .*, 2 session/.test(w('check').stdout));
// yesterday's tick does not block today's
seed(rows().map(x => (x.kind === 'tick' ? { ...x, ts: iso(1) } : x)));
hook();
check('F11 a tick from yesterday does not stop today\'s step', rows().filter(x => x.kind === 'tick').length === t1 + 5, String(rows().filter(x => x.kind === 'tick').length));

// resolve + add still work as before
r = w('resolve', 'w0', 'ok', '--note', 'seen working');
check('F12 resolve closes a watch and it leaves both lists', r.status === 0 && /RESOLVED w0 ok/.test(r.stdout) && !/\[w0\]/.test(w('check').stdout) && /CHANGE-WATCH: 4 open/.test(w('brief').stdout));
r = w('resolve', 'w1', 'anomaly', '--note', 'broke');
check('F13 an anomaly verdict still prints the revert command', /RESOLVED w1 anomaly — revert: git checkout abcdef1234 -- "file1\.js"/.test(r.stdout), r.stdout);
r = w('add', '--target', 'new.js', '--observe', 'watch me');
check('F14 add writes a watch row and prints its rollback line', r.status === 0 && /WATCH ADDED w/.test(r.stdout) && /rollback \(if anomaly\): git checkout /.test(r.stdout) && rows().some(x => x.kind === 'watch' && x.target === 'new.js' && x.sessions_left === 3));
check('F15 resolve of an unknown id fails with exit 1, bad verdict with exit 2', w('resolve', 'nope', 'ok').status === 1 && w('resolve', 'w2', 'maybe').status === 2);
// a broken ledger line never breaks session start
fs.appendFileSync(LEDGER, '{ not json\n');
r = hook();
check('F16 a corrupt ledger line: session start still prints, exit 0', r.status === 0 && /CHANGE-WATCH: \d+ open/.test(r.stdout + r.stderr));
// three or fewer watches: no "+N more"
seed([{ kind: 'watch', id: 'a', ts: iso(1), target: 'a.js', observe: 'o', sessions_left: 3, rollback_sha: 'untracked' }]);
check('F17 one watch: one row and no "+N more"', /CHANGE-WATCH: 1 open · 0 overdue/.test(w('brief').stdout) && !/more ·/.test(w('brief').stdout));

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nclaude-md-watch.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
