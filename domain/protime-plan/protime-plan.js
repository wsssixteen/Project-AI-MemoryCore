#!/usr/bin/env node
// protime-plan.js — keeps miya's ProTime "My Weekly Planning" true, twice every working day.
//
//   node domain/protime-plan/protime-plan.js              dry morning run: prints, writes nothing
//   node domain/protime-plan/protime-plan.js --night      dry night run
//   ... --live                                            writes, then reads back
//   ... --day 2026-10-12                                  settle that one day only (dry unless --live)
//   ... --auto --live --once --notify                     the scheduled form (08:30, 23:00, at logon):
//                                                         before 18:00 = morning run, from 18:00 = night run
//   ... --status                                          what happened today, and the next action
//
// MORNING RUN (miya 2026-10-13)
//   1. settle the previous working day, ALWAYS (even when last night's run did it)
//   2. top up today to 4 tickets from his open board
//   3. plan the rest of the week: 4 a day; if the tickets cannot fill every open day at 4, then 3 a day
// NIGHT RUN
//   settle today
// SETTLE A DAY = make the day say what was really worked
//   worked   = a ticket with 2+ turns in our turn ledger that day, or a Redmine note of his that day,
//              plus every adhoc started or worked that day
//   add      = a worked ticket of his that is missing -> PLAN entry (the ticket number)
//              a worked ticket that was never his      -> ADHOC entry "<number> - Assist" (or the block's title)
//              an adhoc that is missing                -> ADHOC entry, his ProTime wording (protimeLine)
//   remove   = a PLAN entry THIS SCRIPT placed, still PENDING, still the bare number, and not worked
//   never    = an entry he typed, an entry he edited, a RESOLVED entry, a day off
//
// ProTime (read from its own web bundle, service "weeklyPlanningForm"; proven 2026-10-13 on an empty day):
//   GET    staff-plan/self?startDate&endDate          every entry has an id
//   POST   staff-plan/bulk/create [{...}]              ADD ONLY, returns the new ids
//   DELETE staff-plan/<id>                             removes one entry
//   staff-plan/bulk/create-or-update REPLACES the whole day for that category: never used here.
//
// Exit codes: 0 done or nothing to do · 1 retryable (Redmine / ProTime unreachable, login throttled) · 2 read-back mismatch

'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
// The untracked records (quest/active.txt, the turn ledger, this log) live in the MAIN checkout only.
const MAIN = ROOT.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/i, '');
const PYMTIME = process.env.PYMTIME_DIR || 'E:\\Dev\\scripts\\PymTime';
const LOG = path.join(MAIN, 'domain', 'protime-plan', 'log.jsonl');
const MODULE_ID = 101;          // "E-tanah" project module, hardcoded the same way by ProTime's own form
const PER_DAY_MAX = 4;
const PER_DAY_MIN = 3;
const NIGHT_FROM_HOUR = 18;     // a night run that fires late (laptop was asleep at 23:00) must not settle the NEXT day
const LEDGER_MIN_TURNS = 2;     // one turn that names a ticket is a mention, not work

// ---------- pure helpers (covered by protime-plan.eval.js) ----------
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromDmy = s => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || '')); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; };
const atNoon = s => new Date(s + 'T12:00:00');

// Mon..Fri of the week that holds `now`.
function weekDays(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const back = (d.getDay() + 6) % 7;            // Mon=0 .. Sun=6
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
  return [0, 1, 2, 3, 4].map(i => iso(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i)));
}

// The working day before `now` (Monday -> last Friday). Holidays and leave are checked by the caller.
function prevWorkday(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  do { d.setDate(d.getDate() - 1); } while (d.getDay() === 0 || d.getDay() === 6);
  return iso(d);
}

// ProTime's staff-plan/self answer -> { 'yyyy-MM-dd': { plan: [{id,name,status}], adhoc: [...] } }
function entriesByDate(data) {
  const out = {};
  const list = a => (Array.isArray(a) ? a : []).map(p => ({ id: p.id, name: String(p.planName || '').trim(), status: p.status || '' })).filter(e => e.name);
  for (const day of Array.isArray(data) ? data : []) {
    const k = fromDmy(day && day.date);
    if (!k) continue;
    const t = day.tasks || {};
    out[k] = { plan: list(t.plan), adhoc: list(t.adhoc) };
  }
  return out;
}

// ... -> { 'yyyy-MM-dd': ['282061', ...] } (PLAN entries only).
function planByDate(data) {
  const e = entriesByDate(data);
  return Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.plan.map(p => p.name)]));
}

// The distribution rule. openDays in order, tickets in rank order.
function distribute(tickets, openDays) {
  const perDay = tickets.length >= PER_DAY_MAX * openDays.length ? PER_DAY_MAX : PER_DAY_MIN;
  const placed = {};
  let i = 0;
  for (const day of openDays) {
    const chunk = tickets.slice(i, i + perDay);
    if (!chunk.length) break;                   // not enough tickets: the rest of the days stay empty
    placed[day] = chunk;
    i += chunk.length;
  }
  return { perDay, placed, unplaced: tickets.slice(i) };
}

// Everything the plan step decides, with no network: which days, which tickets, where.
// topUp: today, when it already has 1..3 plan entries, is filled up to 4 first (miya 2026-10-13).
function decide({ today, board, existing, holidays = [], leave = [], topUp = false }) {
  const todayIso = iso(today);
  const days = weekDays(today).filter(d => d >= todayIso);
  const skipped = [];
  const candidates = [];
  let room = 0;
  for (const d of days) {
    if (holidays.includes(d)) { skipped.push({ date: d, why: 'public holiday' }); continue; }
    if (leave.includes(d)) { skipped.push({ date: d, why: 'on leave' }); continue; }
    const n = (existing[d] || []).length;
    if (n && topUp && d === todayIso && n < PER_DAY_MAX) { room = PER_DAY_MAX - n; continue; }
    if (n) { skipped.push({ date: d, why: 'already planned' }); continue; }
    candidates.push(d);
  }
  // a ticket already on this week's remaining plan is not planned twice
  const onPlan = new Set(days.flatMap(d => existing[d] || []).flatMap(ticketsIn));
  const tickets = [...new Set(board.map(String))].filter(t => !onPlan.has(t));
  const top = tickets.slice(0, room);
  const rest = distribute(tickets.slice(top.length), candidates);
  const placed = top.length ? { [todayIso]: top, ...rest.placed } : rest.placed;
  return { days, skipped, alreadyOnPlan: [...onPlan], perDay: rest.perDay, placed, unplaced: rest.unplaced, toppedUp: top };
}

// Redmine ticket numbers named in an entry ("264355 & 274266 - Debug" -> both). Tickets are 6 digits.
function ticketsIn(name) { return (String(name || '').match(/(?<!\d)\d{6}(?!\d)/g) || []); }

// Two adhoc titles are the same adhoc when their meaningful words mostly agree
// (he may have typed today's adhoc by hand in other words; a second copy must not be added).
const STOP = new Set(['the', 'and', 'for', 'dan', 'yang', 'dalam', 'with', 'from', 'not', 'issue', 'check', 'assist', 'prod', 'internal', 'mlit', 'staging', 'stag', 'mlk', 'trg', 'prk', 'awam', 'plp']);
const words = s => [...new Set(String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter(w => w.length >= 3 && !STOP.has(w)))];
function sameTitle(a, b) {
  const A = words(a), B = words(b);
  if (!A.length || !B.length) return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  const shared = A.filter(w => B.includes(w)).length;
  return shared >= 2 && shared / Math.min(A.length, B.length) >= 0.6;
}

// His ProTime wording for an adhoc (read from 121 adhoc entries he keyed, 2026-07-13 to 2026-10-12):
//   "<ENV> - <title>", ENV = PROD / Internal / Staging; a state other than Melaka goes second: "PROD - TRG - <title>".
//   A title that already opens with an env word, "Assist", "BA", "Baseline" or a ticket number is his own line: kept as it is.
const OWN_LINE = /^(PROD|Internal|MLIT|MLKIT|Staging|STAG|AWAM|BA|Assist|Baseline|MLK Baseline)\b|^\d{6}\b/i;
function envWord(env) {
  const e = String(env || '');
  if (/prod/i.test(e)) return 'PROD';
  if (/mlit|internal|\bint\b/i.test(e)) return 'Internal';
  if (/stg|stag/i.test(e)) return 'Staging';
  return '';
}
function stateWord(state) {
  const s = String(state || '');
  if (/tereng|trg/i.test(s)) return 'TRG';
  if (/perak|prk/i.test(s)) return 'PRK';
  if (/selangor|sgr/i.test(s)) return 'SGR';
  if (/kedah|kdh/i.test(s)) return 'KDH';
  if (/\bwp\b|kuala lumpur|\bkl\b/i.test(s)) return 'WP';
  return '';                                     // Melaka, or unknown: no state word
}
function protimeLine(block) {
  const t = String((block && block.title) || '').trim();
  if (!t) return '';
  if (OWN_LINE.test(t)) return t;
  return [envWord(block.env), stateWord(block.state), t].filter(Boolean).join(' - ');
}

// What settling one day changes. No network.
//   existing: { plan: [{id,name,status}], adhoc: [...] }   worked: [{ id:'284201', own:true|false, title? }]
//   adhocs: ['PROD - ...']   mine: entry => true when this script created that entry
function settle({ existing, worked = [], adhocs = [], mine = () => false, canRemove = true }) {
  const plan = (existing && existing.plan) || [], adhoc = (existing && existing.adhoc) || [];
  const onDay = new Set([...plan, ...adhoc].flatMap(e => ticketsIn(e.name)));
  const addPlan = [], addAdhoc = [];
  for (const w of worked) {
    if (onDay.has(String(w.id))) continue;
    if (w.own) addPlan.push(String(w.id)); else addAdhoc.push(w.title || `${w.id} - Assist`);
    onDay.add(String(w.id));
  }
  for (const line of adhocs) {
    if (!line) continue;
    if ([...adhoc, ...plan].some(e => sameTitle(e.name, line)) || addAdhoc.some(x => sameTitle(x, line))) continue;
    if (ticketsIn(line).length && ticketsIn(line).every(t => onDay.has(t))) continue;
    addAdhoc.push(line);
  }
  const workedIds = new Set(worked.map(w => String(w.id)));
  const remove = canRemove
    ? plan.filter(e => mine(e) && e.status === 'PENDING' && /^\d{6}$/.test(e.name) && !workedIds.has(e.name)).map(e => ({ id: e.id, name: e.name }))
    : [];
  return { addPlan, addAdhoc, remove };
}

// Which entries this script created: ids from its own log, plus the names the old weekly script placed (it kept no ids).
function mineOf(rows) {
  const ids = new Set(), legacy = new Set();
  for (const r of rows) {
    if (r.mode !== 'live' || (r.result !== 'ok' && r.result !== 'ok-partial')) continue;
    for (const c of r.created || []) ids.add(c.id);
    if (!r.created) for (const [d, names] of Object.entries(r.placed || {})) for (const n of names) legacy.add(d + '|' + n);
  }
  return (entry, day) => ids.has(entry.id) || legacy.has(day + '|' + entry.name);
}

// Every result the script can log -> the one next action. Written into each failed log row and printed by --status.
const NEXT = {
  'ok': 'nothing to do',
  'redmine-unreachable': 'connect to the office network or VPN; the task retries by itself, or run: node domain/protime-plan/protime-plan.js --live',
  'no-protime-login': 'open the PymTime page, type the ProTime password, Save, then run --live',
  'protime-wrong-credentials': 'ProTime password changed: set it on the PymTime page, then run --live',
  'protime-throttled': 'ProTime locked logins for a few minutes: wait 15 minutes, then run --live ONCE',
  'protime-unreachable': 'connect to the office network or VPN; the task retries by itself, or run --live',
  'protime-cert-error': 'ProTime certificate problem: check the address on the PymTime page, then run --live',
  'protime-login-failed': 'run --live once more; if it repeats, open ProTime in the browser and check the login',
  'protime-read-failed': 'run --live once more; if it repeats, ProTime changed its API: re-read staff-plan in its web bundle',
  'protime-write-failed': 'run --live once more (it adds only what is still missing); if it repeats, ProTime changed its API',
  'read-back-mismatch': 'ProTime accepted the write but the read-back differs: open My Weekly Planning and compare with the log row BEFORE any rerun',
  'crash': 'a script error: read `detail` in the log row and fix protime-plan.js, then run the eval and --live',
};
const nextFor = result => NEXT[result] || 'unknown result: read the log row';

// What today's log rows mean. Pure: rows = parsed log.jsonl, now = Date.
// A row belongs to today by its `day`; a row of the old weekly script (no `day`) belongs to its whole week.
function statusOf(rows, now) {
  const monday = weekDays(now)[0], today = iso(now);
  const weekend = now.getDay() === 0 || now.getDay() === 6;
  const due = new Date((weekend ? monday : today) + 'T08:30:00');
  const live = rows.filter(r => r.mode === 'live' && (r.day ? r.day === today : r.week === monday));
  const ok = live.filter(r => r.result === 'ok');
  const changed = r => (r.placed && Object.keys(r.placed).length) || (r.created && r.created.length) || (r.removed && r.removed.length);
  const filled = ok.find(changed);
  if (filled) return { week: monday, verdict: 'FILLED', next: NEXT.ok, row: ok.filter(changed).pop() };
  if (ok.length) return { week: monday, verdict: 'NOTHING TO FILL', next: 'nothing to do (the plan already matched)', row: ok[ok.length - 1] };
  if (live.length) { const last = live[live.length - 1]; return { week: monday, verdict: 'FAILED', next: nextFor(last.result), row: last }; }
  if (weekend || now < due) return { week: monday, verdict: 'NOT DUE YET', next: 'nothing to do until the next working day 08:30', row: null };
  return { week: monday, verdict: 'DID NOT RUN', next: 'the Windows task never started: run --live by hand, then check `schtasks /Query /TN "\\MemoryCore\\ProTime Weekly Plan" /V /FO LIST`', row: null };
}

function readLog() { try { return fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); } catch (_) { return []; } }

// ---------- side effects ----------
const STARTED = Date.now();
function logRow(row) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), dur_ms: Date.now() - STARTED, ...row }) + '\n'); } catch (_) {} }

function readBoard() {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'quest', 'redmine-board.js'), '--json'], { encoding: 'utf8', timeout: 180000, windowsHide: true });
  if (r.status !== 0) return { ok: false, error: (r.stderr || r.error || 'redmine-board failed').toString().slice(0, 300) };
  try {
    const j = JSON.parse(r.stdout);
    const ids = [...(j.esokongan || []), ...(j.patch || []), ...(j.other || [])].map(x => String(x.id));
    return { ok: true, ids };
  } catch (e) { return { ok: false, error: 'board json unreadable: ' + e.message }; }
}

function offDays(days) {
  const holidays = [], leave = [];
  try { const h = require(path.join(PYMTIME, 'lib', 'holiday.js')); for (const d of days) if (h.isHolidayCached(new Date(d + 'T00:00:00'))) holidays.push(d); } catch (_) {}
  try { const l = require(path.join(PYMTIME, 'lib', 'leave.js')); for (const d of days) { const x = l.onLeave(new Date(d + 'T00:00:00')); if (x && x.status === 'APPROVED') leave.push(d); } } catch (_) {}
  return { holidays, leave };
}

function notify(title, msg, kind) {
  try { require(path.join(PYMTIME, 'lib', 'toast.js')).toast(title, msg, kind, null, { force: true }); } catch (_) {}
}

// Our own record of the day: quests with 2+ turns in the turn ledger where the quest was named or worked with tools
// (qa_source "top-active" is the ledger's fallback guess and is not evidence).
function ledgerDay(day) {
  const dir = path.join(MAIN, 'system', 'telemetry');
  const count = {}, seen = new Set();
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => /^turns.*\.jsonl$/.test(f)); } catch (_) {}
  for (const f of files) {
    let text = '';
    try { text = fs.readFileSync(path.join(dir, f), 'utf8'); } catch (_) { continue; }
    for (const line of text.split('\n')) {
      if (!line || line.indexOf(day.slice(0, 7)) < 0 && line.indexOf(iso(new Date(atNoon(day).getTime() - 864e5)).slice(0, 7)) < 0) continue;
      let r; try { r = JSON.parse(line); } catch (_) { continue; }
      if (!r.qa || r.qa_source === 'top-active' || !r.closed_ts) continue;
      if (iso(new Date(r.closed_ts)) !== day) continue;
      const k = r.turn_id || r.closed_ts + '|' + r.session_id;
      if (seen.has(k)) continue;
      seen.add(k);
      count[r.qa] = (count[r.qa] || 0) + 1;
    }
  }
  const quests = Object.keys(count).filter(q => count[q] >= LEDGER_MIN_TURNS);
  return { tickets: quests.map(q => (/^QA-(\d{6})$/.exec(q) || [])[1]).filter(Boolean), adhocIds: quests.filter(q => /^ADHOC-/i.test(q)) };
}

// Blocks of quest/active.txt + active-archive.txt (MAIN checkout).
function questBlocks() {
  const out = [];
  for (const f of ['active.txt', 'active-archive.txt']) {
    let text = ''; try { text = fs.readFileSync(path.join(MAIN, 'quest', f), 'utf8'); } catch (_) {}
    let cur = null;
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([a-z0-9_]+)=(.*)$/i);
      if (m && m[1] === 'qa') { cur = { qa: m[2].trim() }; out.push(cur); continue; }
      if (!line.trim()) { cur = null; continue; }
      if (m && cur) cur[m[1]] = m[2].trim();
    }
  }
  return out;
}

// The day's adhocs in his ProTime wording. An adhoc with no stored title is listed, never invented.
function adhocsOfDay(day, adhocIds, blocks) {
  const lines = [], untitled = [], seen = new Set();
  for (const b of blocks) {
    if ((b.ticket_type || '').toLowerCase() !== 'adhoc' || seen.has(b.qa)) continue;
    if ((b.quest_start || '').slice(0, 10) !== day && !adhocIds.includes(b.qa)) continue;
    seen.add(b.qa);
    const line = protimeLine(b);
    if (line) lines.push(line); else untitled.push(b.qa);
  }
  return { lines, untitled };
}

// Redmine: tickets he wrote on that day, and whether each one was ever assigned to him.
const REDMINE = (() => {
  try {
    const src = fs.readFileSync(path.join(ROOT, 'quest', 'redmine-board.js'), 'utf8');   // the one home of the Redmine address + key
    return { base: /REDMINE_BASE\s*=\s*'([^']+)'/.exec(src)[1], key: /REDMINE_KEY\s*=\s*'([^']+)'/.exec(src)[1], project: (/PROJECT\s*=\s*'([^']+)'/.exec(src) || [])[1] || 'helpdesk_melaka' };
  } catch (_) { return null; }
})();
function rget(p) {
  return new Promise(resolve => {
    const req = http.get(REDMINE.base + p, { headers: { 'X-Redmine-API-Key': REDMINE.key }, timeout: 30000 }, res => {
      let b = ''; res.setEncoding('utf8'); res.on('data', d => b += d);
      res.on('end', () => { try { resolve(res.statusCode === 200 ? JSON.parse(b) : null); } catch (_) { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}
async function redmineDays(days, extraIds) {
  if (!REDMINE) return { ok: false, error: 'redmine address not readable' };
  const me = await rget('/users/current.json');
  if (!me || !me.user) return { ok: false, error: 'redmine unreachable' };
  const myId = me.user.id, since = [...days].sort()[0];
  const cand = new Set(extraIds.map(String));
  for (const base of [`/issues.json?status_id=*&assigned_to_id=me`, `/projects/${REDMINE.project}/issues.json?status_id=*`]) {
    for (let offset = 0; offset < 600; offset += 100) {
      const j = await rget(`${base}&updated_on=%3E%3D${since}&limit=100&offset=${offset}`);
      if (!j || !Array.isArray(j.issues)) return { ok: false, error: 'redmine list failed' };
      for (const is of j.issues) cand.add(String(is.id));
      if (offset + 100 >= (j.total_count || 0)) break;
    }
  }
  const worked = Object.fromEntries(days.map(d => [d, []]));
  for (const id of cand) {
    const j = await rget(`/issues/${id}.json?include=journals`);
    if (!j || !j.issue) continue;                                // a ticket he cannot open: skipped
    const is = j.issue, journals = is.journals || [];
    const own = (is.assigned_to && is.assigned_to.id === myId) || journals.some(jr => (jr.details || []).some(det => det.property === 'attr' && det.name === 'assigned_to_id' && (String(det.new_value) === String(myId) || String(det.old_value) === String(myId))));
    const wrote = new Set(journals.filter(jr => jr.user && jr.user.id === myId).map(jr => iso(new Date(jr.created_on))));
    for (const d of days) if (wrote.has(d) || (extraIds.includes(id) && (extraIds.byDay || {})[d] && extraIds.byDay[d].includes(id))) worked[d].push({ id, own: !!own });
  }
  return { ok: true, worked, candidates: cand.size };
}

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes('--live');
  const today = new Date();
  const todayIso = iso(today);
  const week = weekDays(today);
  const monday = week[0];
  const dayArg = (i => i >= 0 ? args[i + 1] : null)(args.indexOf('--day'));
  const run = dayArg ? 'day' : args.includes('--night') || (args.includes('--auto') && today.getHours() >= NIGHT_FROM_HOUR) ? 'night' : 'morning';
  const fail = (code, result, detail) => {
    logRow({ day: todayIso, week: monday, run, mode: live ? 'live' : 'dry', result, detail, next: nextFor(result) });
    console.log(`ProTime plan: ${result}${detail ? ' - ' + detail : ''}\nNext: ${nextFor(result)}`);
    // retryable failures stay quiet while the task still retries (every 30 min, and at logon);
    // from 11:00 on a failure shows, so a day that never fills is never silent
    if (live && args.includes('--notify') && (code === 2 || result === 'no-protime-login' || new Date().getHours() >= 11)) notify('ProTime plan NOT updated', `${result}. It retries by itself; or run: node domain/protime-plan/protime-plan.js --live`, 'Warning');
    process.exit(code);
  };

  if (args.includes('--status')) {
    const s = statusOf(readLog(), today);
    console.log(`ProTime plan, ${todayIso}: ${s.verdict}`);
    if (s.row) console.log(`  last row: ${s.row.ts} run=${s.row.run || 'weekly'} result=${s.row.result}${s.row.detail ? ' (' + s.row.detail + ')' : ''}${s.row.created ? ' added=' + s.row.created.map(c => `${c.date} ${c.name}`).join('; ') : s.row.placed ? ' placed=' + JSON.stringify(s.row.placed) : ''}${s.row.removed && s.row.removed.length ? ' removed=' + s.row.removed.map(c => `${c.date} ${c.name}`).join('; ') : ''}`);
    console.log(`  next: ${s.next}`);
    return;
  }

  if (dayArg && !/^\d{4}-\d{2}-\d{2}$/.test(dayArg)) { console.log('usage: --day YYYY-MM-DD'); process.exit(2); }
  if (run === 'night' && today.getHours() < NIGHT_FROM_HOUR && !args.includes('--force')) { console.log(`ProTime plan: a night run before ${NIGHT_FROM_HOUR}:00 would settle a day that has not happened - nothing done (the morning run settles yesterday)`); return; }
  if (run !== 'day' && (today.getDay() === 0 || today.getDay() === 6) && !args.includes('--force')) { console.log('ProTime plan: weekend - nothing to do'); return; }
  if (live && args.includes('--once') && readLog().some(r => r.day === todayIso && r.run === run && r.mode === 'live' && r.result === 'ok')) { console.log(`ProTime plan: the ${run} run of ${todayIso} is already done - nothing to do`); return; }

  const settleDays = run === 'day' ? [dayArg] : run === 'night' ? [todayIso] : [prevWorkday(today)];
  const off = offDays([...new Set([...week, ...settleDays])]);
  const isOff = d => off.holidays.includes(d) || off.leave.includes(d) || [0, 6].includes(atNoon(d).getDay());

  // what was worked
  const blocks = questBlocks();
  const ledger = Object.fromEntries(settleDays.map(d => [d, ledgerDay(d)]));
  const extra = [...new Set(settleDays.flatMap(d => ledger[d].tickets))];
  extra.byDay = Object.fromEntries(settleDays.map(d => [d, ledger[d].tickets]));
  const red = await redmineDays(settleDays, extra);
  const board = run === 'morning' ? readBoard() : { ok: true, ids: [] };
  if (!board.ok) return fail(1, 'redmine-unreachable', board.error);
  if (!red.ok && run !== 'morning') return fail(1, 'redmine-unreachable', red.error);

  // ProTime
  const cfg = require(path.join(PYMTIME, 'lib', 'config.js'));
  const api = require(path.join(PYMTIME, 'lib', 'api.js'));
  const c = cfg.loadConfig();
  const pw = c && cfg.loadPassword();
  if (!c || !c.username || !pw) return fail(1, 'no-protime-login', 'PymTime has no saved ProTime login on this laptop');
  const apiBase = await api.liveApiBase(c);
  const lg = await api.login(apiBase, c.username, pw, 2);
  if (!lg.ok) return fail(1, 'protime-' + (lg.reason || 'login-failed'));

  const from = [...settleDays, week[0]].sort()[0], to = [...settleDays, week[4]].sort().pop();
  const read = async () => {
    const r = await api.request(apiBase, `/staff-plan/self?startDate=${from}&endDate=${to}`, { token: lg.token });
    return r.ok && r.json && Array.isArray(r.json.data) ? entriesByDate(r.json.data) : null;
  };
  const before = await read();
  if (!before) return fail(1, 'protime-read-failed');

  // settle
  const mine = mineOf(readLog());
  const settled = {}, notes = [];
  for (const d of settleDays) {
    if (isOff(d)) { console.log(`${d}: day off - left alone`); continue; }
    const ad = adhocsOfDay(d, ledger[d].adhocIds, blocks);
    if (ad.untitled.length) notes.push(`${d}: adhoc with no title, not written: ${ad.untitled.join(', ')}`);
    const titleOf = id => { const b = blocks.find(x => x.qa === 'QA-' + id && x.title); return b ? protimeLine(b) : null; };
    const worked = red.ok ? red.worked[d].map(w => ({ ...w, title: w.own ? null : titleOf(w.id) })) : [];
    const s = settle({ existing: before[d] || { plan: [], adhoc: [] }, worked, adhocs: ad.lines, mine: e => mine(e, d), canRemove: red.ok });
    settled[d] = s;
    console.log(`${d} settle - worked: ${worked.map(w => w.id + (w.own ? '' : ' (not his)')).join(', ') || 'none found'}${red.ok ? '' : ' (Redmine unreachable: nothing added or removed from tickets)'}`);
    for (const n of s.addPlan) console.log(`  + plan   ${n}`);
    for (const n of s.addAdhoc) console.log(`  + adhoc  ${n}`);
    for (const r of s.remove) console.log(`  - remove ${r.name} (placed by this script, not worked)`);
    if (!s.addPlan.length && !s.addAdhoc.length && !s.remove.length) console.log('  (already true)');
  }

  // plan (morning only)
  let plan = { placed: {}, unplaced: [], skipped: [], perDay: PER_DAY_MAX };
  if (run === 'morning') {
    const existing = Object.fromEntries(week.map(d => [d, ((before[d] || {}).plan || []).map(e => e.name)]));
    plan = decide({ today, board: board.ids, existing, holidays: off.holidays, leave: off.leave, topUp: true });
    console.log(`Week of ${monday} - ${board.ids.length} open ticket(s), ${plan.perDay} a day`);
    const lines = Object.entries(plan.placed).map(([d, t]) => `  ${d}: ${t.join(', ')}${d === todayIso && plan.toppedUp.length ? ' (top-up)' : ''}`);
    console.log(lines.length ? lines.join('\n') : '  (no empty day to fill)');
    for (const s of plan.skipped) console.log(`  ${s.date}: left alone (${s.why})`);
    if (plan.unplaced.length) console.log(`  not placed (rule: ${plan.perDay} a day): ${plan.unplaced.join(', ')}`);
  }
  for (const n of notes) console.log('NOTE ' + n);

  const adds = [
    ...Object.entries(settled).flatMap(([d, s]) => [...s.addPlan.map(n => ({ date: d, name: n, cat: 'PLAN' })), ...s.addAdhoc.map(n => ({ date: d, name: n, cat: 'ADHOC' }))]),
    ...Object.entries(plan.placed).flatMap(([d, t]) => t.map(n => ({ date: d, name: n, cat: 'PLAN' }))),
  ];
  const removes = Object.entries(settled).flatMap(([d, s]) => s.remove.map(r => ({ ...r, date: d })));
  const base = { day: todayIso, week: monday, run, placed: plan.placed, unplaced: plan.unplaced, skipped: plan.skipped, notes };

  if (!live) { logRow({ ...base, mode: 'dry', result: 'ok', would_add: adds, would_remove: removes }); console.log('DRY RUN - nothing written. Add --live to write.'); return; }

  const created = [];
  if (adds.length) {
    const w = await api.request(apiBase, '/staff-plan/bulk/create', { method: 'POST', token: lg.token, body: adds.map(a => ({ moduleId: MODULE_ID, planName: a.name, status: 'PENDING', categoryTask: a.cat, planDate: a.date })) });
    if (!w.ok) return fail(1, 'protime-write-failed', 'HTTP ' + w.status);
    for (const e of (w.json && Array.isArray(w.json.data) ? w.json.data : [])) created.push({ id: e.id, name: String(e.planName || '').trim(), cat: e.categoryTask, date: fromDmy(e.planDate) });
  }
  const removed = [];
  for (const r of removes) {
    const d = await api.request(apiBase, `/staff-plan/${r.id}`, { method: 'DELETE', token: lg.token });
    if (d.ok) removed.push(r); else notes.push(`${r.date}: could not remove ${r.name} (HTTP ${d.status})`);
  }
  const after = await read();
  const has = (d, name, cat) => (((after || {})[d] || {})[cat === 'ADHOC' ? 'adhoc' : 'plan'] || []).some(e => e.name === name);
  const missing = adds.filter(a => !has(a.date, a.name, a.cat)).map(a => `${a.date} ${a.name}`);
  // ProTime's answer to a mixed PLAN + ADHOC write lists only part of what it created (2026-10-13: 3 of 4),
  // so the ids of this run's entries are taken from the read-back: same day, list and name, id not there before.
  const idsBefore = new Set(Object.values(before).flatMap(d => [...d.plan, ...d.adhoc]).map(e => e.id));
  for (const a of adds) {
    const e = ((((after || {})[a.date] || {})[a.cat === 'ADHOC' ? 'adhoc' : 'plan']) || []).find(x => x.name === a.name && !idsBefore.has(x.id) && !created.some(c => c.id === x.id));
    if (e) created.push({ id: e.id, name: a.name, cat: a.cat, date: a.date });
  }
  const still = removed.filter(r => (((after || {})[r.date] || {}).plan || []).some(e => e.id === r.id)).map(r => `${r.date} ${r.name} still there`);
  // ids are logged even on a mismatch, so a later run still knows which entries are its own
  if (!after || missing.length || still.length) { logRow({ ...base, mode: 'live', result: 'ok-partial', created, removed }); return fail(2, 'read-back-mismatch', [...missing, ...still].join('; ') || 'plan unreadable after write'); }

  logRow({ ...base, mode: 'live', result: 'ok', created, removed });
  console.log(`WRITTEN and read back: ${adds.length} added, ${removed.length} removed`);
  if (args.includes('--notify') && (adds.length || removed.length)) notify('ProTime plan updated', `${run} run: ${adds.length} added, ${removed.length} removed`, 'Info');
}

if (require.main === module) main().catch(e => { logRow({ mode: 'error', result: 'crash', detail: String(e && e.stack || e).slice(0, 400) }); console.error(e); process.exit(1); });
module.exports = { weekDays, prevWorkday, planByDate, entriesByDate, distribute, decide, settle, sameTitle, protimeLine, ticketsIn, mineOf, iso, fromDmy, statusOf, nextFor, NEXT };
