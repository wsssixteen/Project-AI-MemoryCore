#!/usr/bin/env node
// protime-plan.js — fills miya's ProTime "My Weekly Planning" from his open Redmine tickets.
//
//   node domain/protime-plan/protime-plan.js            dry run: prints the plan, writes nothing
//   node domain/protime-plan/protime-plan.js --live     writes the plan, reads it back
//   ... --live --once-per-week --notify                 the scheduled form (Monday 08:00 + at logon)
//
// Rules (miya 2026-09-30):
//   - tickets = his open board, in board order (eSOKONGAN -> PROD patch -> rest), from quest/redmine-board.js --json
//   - days    = Mon..Fri of this week, from today on, minus public holidays and his own leave
//   - a day that already has ANY plan entry is never touched (his manual entries win)
//   - 4 tickets a day; if the tickets cannot fill every open day at 4, then 3 a day;
//     days left over stay empty; each ticket is planned once
//
// ProTime access reuses PymTime (E:\Dev\scripts\PymTime): its saved login + one API login per run.
// Endpoints (read from ProTime's own web bundle, service "weeklyPlanningForm"):
//   GET  staff-plan/self?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd
//   POST staff-plan/bulk/create-or-update  [{moduleId:101, planName, status:'PENDING', categoryTask:'PLAN', planDate}]
//
// Exit codes: 0 done or nothing to do · 1 retryable (Redmine / ProTime unreachable, login throttled) · 2 read-back mismatch

'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PYMTIME = process.env.PYMTIME_DIR || 'E:\\Dev\\scripts\\PymTime';
const LOG = path.join(__dirname, 'log.jsonl');
const MODULE_ID = 101;          // "E-tanah" project module, hardcoded the same way by ProTime's own form
const PER_DAY_MAX = 4;
const PER_DAY_MIN = 3;

// ---------- pure helpers (covered by protime-plan.eval.js) ----------
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromDmy = s => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || '')); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; };

// Mon..Fri of the week that holds `now`.
function weekDays(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const back = (d.getDay() + 6) % 7;            // Mon=0 .. Sun=6
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
  return [0, 1, 2, 3, 4].map(i => iso(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i)));
}

// ProTime's staff-plan/self answer -> { 'yyyy-MM-dd': ['282061', ...] } (PLAN entries only).
function planByDate(data) {
  const out = {};
  for (const day of Array.isArray(data) ? data : []) {
    const k = fromDmy(day && day.date);
    if (!k) continue;
    const plan = (day.tasks && Array.isArray(day.tasks.plan)) ? day.tasks.plan : [];
    out[k] = plan.map(p => String(p.planName || '').trim()).filter(Boolean);
  }
  return out;
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

// Everything the run decides, with no network: which days, which tickets, where.
function decide({ today, board, existing, holidays = [], leave = [] }) {
  const days = weekDays(today).filter(d => d >= iso(today));
  const skipped = [];
  const candidates = [];
  for (const d of days) {
    if (holidays.includes(d)) { skipped.push({ date: d, why: 'public holiday' }); continue; }
    if (leave.includes(d)) { skipped.push({ date: d, why: 'on leave' }); continue; }
    if ((existing[d] || []).length) { skipped.push({ date: d, why: 'already planned' }); continue; }
    candidates.push(d);
  }
  // a ticket already on this week's remaining plan is not planned twice
  const onPlan = new Set(days.flatMap(d => existing[d] || []).map(n => (/^(\d{5,7})\b/.exec(n) || [])[1]).filter(Boolean));
  const tickets = [...new Set(board.map(String))].filter(t => !onPlan.has(t));
  return { days, skipped, alreadyOnPlan: [...onPlan], ...distribute(tickets, candidates) };
}

// ---------- side effects ----------
const STARTED = Date.now();
function logRow(row) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), dur_ms: Date.now() - STARTED, ...row }) + '\n'); } catch (_) {} }
function doneThisWeek(monday) {
  try { return fs.readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).some(r => r.week === monday && r.mode === 'live' && r.result === 'ok'); } catch (_) { return false; }
}

function readBoard() {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'quest', 'redmine-board.js'), '--json'], { encoding: 'utf8', timeout: 180000, windowsHide: true });
  if (r.status !== 0) return { ok: false, error: (r.stderr || r.error || 'redmine-board failed').toString().slice(0, 300) };
  try {
    const j = JSON.parse(r.stdout);
    const ids = [...(j.esokongan || []), ...(j.patch || []), ...(j.other || [])].map(x => String(x.id));
    return { ok: true, ids };
  } catch (e) { return { ok: false, error: 'board json unreadable: ' + e.message }; }
}

function offDays(week) {
  const holidays = [], leave = [];
  try { const h = require(path.join(PYMTIME, 'lib', 'holiday.js')); for (const d of week) if (h.isHolidayCached(new Date(d + 'T00:00:00'))) holidays.push(d); } catch (_) {}
  try { const l = require(path.join(PYMTIME, 'lib', 'leave.js')); for (const d of week) { const x = l.onLeave(new Date(d + 'T00:00:00')); if (x && x.status === 'APPROVED') leave.push(d); } } catch (_) {}
  return { holidays, leave };
}

function notify(title, msg, kind) {
  try { require(path.join(PYMTIME, 'lib', 'toast.js')).toast(title, msg, kind, null, { force: true }); } catch (_) {}
}

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes('--live');
  const today = new Date();
  const week = weekDays(today);
  const monday = week[0];
  const fail = (code, result, detail) => {
    logRow({ week: monday, mode: live ? 'live' : 'dry', result, detail });
    console.log(`ProTime plan: ${result}${detail ? ' - ' + detail : ''}`);
    // retryable failures stay quiet while the task still retries (every 30 min, and at logon);
    // from 11:00 on a failure shows, so a week that never fills is never silent
    if (live && args.includes('--notify') && (code === 2 || result === 'no-protime-login' || new Date().getHours() >= 11)) notify('ProTime plan NOT filled', `${result}. It retries by itself; or run: node domain/protime-plan/protime-plan.js --live`, 'Warning');
    process.exit(code);
  };

  if (live && args.includes('--once-per-week') && doneThisWeek(monday)) { console.log(`ProTime plan: week of ${monday} already filled - nothing to do`); return; }

  const board = readBoard();
  if (!board.ok) return fail(1, 'redmine-unreachable', board.error);

  const cfg = require(path.join(PYMTIME, 'lib', 'config.js'));
  const api = require(path.join(PYMTIME, 'lib', 'api.js'));
  const c = cfg.loadConfig();
  const pw = c && cfg.loadPassword();
  if (!c || !c.username || !pw) return fail(1, 'no-protime-login', 'PymTime has no saved ProTime login on this laptop');
  const apiBase = await api.liveApiBase(c);
  const lg = await api.login(apiBase, c.username, pw, 2);
  if (!lg.ok) return fail(1, 'protime-' + (lg.reason || 'login-failed'));

  const read = async () => {
    const r = await api.request(apiBase, `/staff-plan/self?startDate=${week[0]}&endDate=${week[4]}`, { token: lg.token });
    return r.ok && r.json && Array.isArray(r.json.data) ? planByDate(r.json.data) : null;
  };
  const existing = await read();
  if (!existing) return fail(1, 'protime-read-failed');

  const plan = decide({ today, board: board.ids, existing, ...offDays(week) });
  const lines = Object.entries(plan.placed).map(([d, t]) => `  ${d}: ${t.join(', ')}`);
  console.log(`Week of ${monday} - ${board.ids.length} open ticket(s), ${plan.perDay} a day`);
  console.log(lines.length ? lines.join('\n') : '  (no empty day to fill)');
  for (const s of plan.skipped) console.log(`  ${s.date}: left alone (${s.why})`);
  if (plan.unplaced.length) console.log(`  not placed (rule: ${plan.perDay} a day): ${plan.unplaced.join(', ')}`);

  if (!live) { logRow({ week: monday, mode: 'dry', result: 'ok', placed: plan.placed, unplaced: plan.unplaced, skipped: plan.skipped }); console.log('DRY RUN - nothing written. Add --live to write.'); return; }

  const body = Object.entries(plan.placed).flatMap(([d, t]) => t.map(id => ({ moduleId: MODULE_ID, planName: id, status: 'PENDING', categoryTask: 'PLAN', planDate: d })));
  if (body.length) {
    const w = await api.request(apiBase, '/staff-plan/bulk/create-or-update', { method: 'POST', token: lg.token, body });
    if (!w.ok) return fail(1, 'protime-write-failed', 'HTTP ' + w.status);
  }
  const after = await read();
  const missing = Object.entries(plan.placed).flatMap(([d, t]) => t.filter(id => !((after || {})[d] || []).includes(id)).map(id => `${d} ${id}`));
  if (!after || missing.length) return fail(2, 'read-back-mismatch', missing.join('; ') || 'plan unreadable after write');

  logRow({ week: monday, mode: 'live', result: 'ok', placed: plan.placed, unplaced: plan.unplaced, skipped: plan.skipped });
  console.log(`WRITTEN and read back: ${body.length} entr${body.length === 1 ? 'y' : 'ies'}`);
  if (args.includes('--notify')) notify('ProTime plan filled', body.length ? `${body.length} ticket(s) planned for the week of ${monday}` : `Week of ${monday} was already planned`, 'Info');
}

if (require.main === module) main().catch(e => { logRow({ mode: 'error', result: 'crash', detail: String(e && e.stack || e).slice(0, 400) }); console.error(e); process.exit(1); });
module.exports = { weekDays, planByDate, distribute, decide, iso, fromDmy };
