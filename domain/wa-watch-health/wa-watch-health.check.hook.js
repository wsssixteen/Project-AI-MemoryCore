#!/usr/bin/env node
// wa-watch-health.check.hook.js — born via core/forge.js (2026-11-10)
// TRIGGER: every session start (startup, resume, compact)
// ACTION: reads the tail of the WaRead events log and the last 3 day registries; prints one alarm line per
//         problem with its fix command; silent when healthy or when WaRead is not installed.
// boundary: covers the WaRead events log and day registry files under the user profile, read only · never
//           starts, stops or connects the watcher, never reads message text, never writes outside its own folder
//           · stops none: report only
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const EVAL = !!process.env.WA_WATCH_HEALTH_HOME;                       // the eval points the check at a temp folder
const HOME = process.env.WA_WATCH_HEALTH_HOME || process.env.WA_READ_HOME || path.join(os.homedir(), '.wa-read');
const WA_ROOT = process.env.WA_READ_ROOT || 'E:\\Dev\\scripts\\WaRead';   // machine path, recorded in the README
const TAIL_BYTES = 256 * 1024;
const BEAT_STALE_MIN = 12;                                             // the daemon beats every 5 minutes

const now = () => (process.env.WA_WATCH_HEALTH_NOW ? Date.parse(process.env.WA_WATCH_HEALTH_NOW) : Date.now());
const tsOf = (e) => (e ? (typeof e.ts === 'number' ? e.ts : Date.parse(e.ts)) : 0);
const pad = (n) => String(n).padStart(2, '0');
const local = (ms) => { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const dayOf = (ms) => { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const ago = (min) => (min < 90 ? min + ' min' : min < 48 * 60 ? Math.round(min / 60) + ' h' : Math.round(min / 1440) + ' days');

// The last TAIL_BYTES of the events log, watcher rows only. A half line at the cut and any broken line are dropped.
function watchEvents(file) {
  let raw;
  try {
    const size = fs.statSync(file).size, n = Math.min(size, TAIL_BYTES);
    const fd = fs.openSync(file, 'r'); const buf = Buffer.alloc(n);
    fs.readSync(fd, buf, 0, n, size - n); fs.closeSync(fd);
    raw = buf.toString('utf8');
  } catch (_) { return null; }                                           // no log: WaRead is not installed here
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try { const e = JSON.parse(line); if (e && e.cmd === 'watch') out.push(e); } catch (_) { /* cut or broken line */ }
  }
  return out;
}

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e && e.code === 'EPERM'; }
}

// How many starts are waiting in the last 3 day registries, and since when. Reads counts and times only.
function waiting(dir, nowMs) {
  let count = 0, oldest = 0, login = false;
  for (let i = 0; i < 3; i++) {
    let r; try { r = JSON.parse(fs.readFileSync(path.join(dir, 'registry-' + dayOf(nowMs - i * 86400000) + '.json'), 'utf8')); } catch (_) { continue; }
    for (const p of Array.isArray(r && r.pending) ? r.pending : []) {
      count++; if (p && p.login) login = true;
      if (p && typeof p.ts === 'number' && (!oldest || p.ts < oldest)) oldest = p.ts;
    }
  }
  return { count, oldest, login };
}

function problems() {
  const nowMs = now();
  const w = watchEvents(path.join(HOME, 'events.jsonl'));
  if (!w || !w.length) return [];                                        // not installed, or the watcher never ran: nothing to guard
  const last = (pred) => { for (let i = w.length - 1; i >= 0; i--) if (pred(w[i])) return w[i]; return null; };
  const out = [];

  const beat = last((e) => e.event === 'heartbeat' || e.event === 'daemon-start');
  const stop = last((e) => e.event === 'daemon-stop');
  if (beat || stop) {
    const stopped = stop && (!beat || tsOf(stop) >= tsOf(beat));
    const ageMin = beat ? Math.round((nowMs - tsOf(beat)) / 60000) : null;
    const stale = !beat || ageMin > BEAT_STALE_MIN;
    const asleep = stale && !stopped && beat && pidAlive(beat.pid);     // laptop just woke: the process is there, its timer is late
    if (stopped || (stale && !asleep)) {
      const seen = stopped ? tsOf(stop) : tsOf(beat);
      const why = stopped ? 'last stop reason: ' + String(stop.reason || 'not recorded').slice(0, 80) : 'no stop row: it was killed or the laptop shut down';
      out.push({ kind: 'stopped', line: 'the WhatsApp watcher is STOPPED (last sign of life ' + local(seen) + ', ' + ago(Math.round((nowMs - seen) / 60000)) + ' ago; ' + why + '). No WhatsApp message starts a session until it runs. Start it: schtasks /run /tn "WaRead Watcher"' });
    }
  }

  const authText = (s) => /authenticat|oauth|logged in|login/i.test(String(s || ''));
  const loginEv = last((e) => e.event === 'check-login' || e.event === 'child-done' || (e.event === 'child-failed' && e.login) || (e.event === 'judge' && (e.ok || authText(e.err))) || (e.event === 'judge-fallback' && authText(e.why)));
  const loginOk = loginEv ? (loginEv.event === 'check-login' || loginEv.event === 'judge' ? !!loginEv.ok : loginEv.event === 'child-done') : true;
  if (!loginOk) out.push({ kind: 'login', line: 'the watcher\'s Claude login is DEAD (seen ' + local(tsOf(loginEv)) + '). The judge runs on rules only and no session can start. His step: claude login   then: node ' + path.join(WA_ROOT, 'wa-watch.js') + ' check-login' });

  const q = waiting(path.join(HOME, 'watcher'), nowMs);
  if (q.count) out.push({ kind: 'waiting', line: q.count + ' WhatsApp start(s) are WAITING' + (q.oldest ? ' (oldest ' + local(q.oldest) + ')' : '') + (q.login ? ': the login was dead when they fired; they start by themselves within 5 minutes of a good check-login' : ': the session failed to start; the running watcher retries every 5 minutes, up to 5 times') + '. List: node ' + path.join(WA_ROOT, 'wa-watch.js') + ' status' });
  return out;
}

runHook({ name: 'wa-watch-health', event: 'SessionStart' }, () => {
  let found = [];
  try { found = problems(); } catch (_) { return { fired: false }; }      // a broken read never blocks a session start
  if (!found.length) return { fired: false };
  if (!EVAL) { try { fs.appendFileSync(path.join(__dirname, 'log.jsonl'), JSON.stringify({ ts: new Date().toISOString(), problems: found.map((p) => p.kind) }) + '\n'); } catch (_) { /* the alarm matters more than its log row */ } }
  const text = found.map((p) => 'WA-WATCH: ' + p.line).join('\n') + '\n   Say each WA-WATCH line to miya in the first reply of this session, as it is.\n';
  return { fired: true, blocked: false, contextOut: text };
});
