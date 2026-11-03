#!/usr/bin/env node
/**
 * sla-hours.js — how many SLA hours a developer has left on a ticket.
 *
 * symptom:     2026-11-01 miya: the board's Due date is not what he is measured on; an appraisal sheet
 *              showed 3 September misses where his manager counted 1, because holidays stayed in the timer.
 * goal:        one number for each eSOKONGAN row: working hours left before the developer's limit.
 * goal_signal: quest/redmine-board.js prints it in the Hours left column; eval lib/sla-hours.eval.js.
 * retention:   keep
 * footprint:   on-demand: pure functions, no process, no network.
 * boundary:    covers a ticket's priority, the moment it reached him, and its state · never reads Redmine, writes a file, or decides a ticket's order · stops at returning one number; a manager's count outranks it
 * self_audit:  lib/sla-hours.eval.js replays the three September 2026 tickets his manager counted.
 *
 * The rule, the message he shared, word for word (.claude/auto-memory/reference_redmine_sla_hours.md):
 *   Critical - 6 hours for dev · High - 10 hours for dev · Medium - 22 hours for dev · Low - 31 hours for dev
 *   The timers will count from 8am to 5pm. For Trg is sunday to thu , the rest is monday to friday
 *
 * Not stated by the rule, so these are choices, and he may change them:
 *   lunch counts (the timer runs 8am to 5pm with no exception; this is also the stricter reading) ·
 *   public holidays are out (it matched his manager's September count) ·
 *   the clock starts when the ticket last landed on him (same basis as the board's Days column).
 *
 * Holidays: 2026 only, officeholidays.com, Melaka page, checked 2026-11-01. A state other than Melaka gets
 * the national days only. The eval goes red when the current year has no list.
 *
 * Run: node lib/sla-hours.js <Priority> <assignedISO> [melaka|perak|terengganu|...]
 */
'use strict';

const LIMITS = { critical: 6, high: 10, medium: 22, low: 31 };
const TIMER_FROM = 8, TIMER_TO = 17;
const MYT = 8 * 3600e3, HOUR = 3600e3, DAY = 24 * HOUR;
const HOLIDAYS_KNOWN_YEARS = [2026];
const NATIONAL = ['2026-02-17', '2026-02-18', '2026-03-20', '2026-03-21', '2026-03-22', '2026-03-23', '2026-05-01', '2026-05-27',
    '2026-05-31', '2026-06-01', '2026-06-17', '2026-08-25', '2026-08-31', '2026-09-16', '2026-11-08', '2026-11-09', '2026-12-25'];
const STATE_HOLIDAYS = { melaka: ['2026-01-01', '2026-02-20', '2026-03-24', '2026-04-15', '2026-08-24'] };

function workdays(state) { return String(state).toLowerCase() === 'terengganu' ? [0, 1, 2, 3, 4] : [1, 2, 3, 4, 5]; }
function holidays(state) { return new Set([...NATIONAL, ...(STATE_HOLIDAYS[String(state).toLowerCase()] || [])]); }

// The state a Redmine project belongs to, for its working week and holidays.
function stateOfProject(project) {
    const p = String(project || '');
    if (/terengganu|^TRG_/i.test(p)) return 'terengganu';
    if (/perak|^PRK_/i.test(p)) return 'perak';
    if (/penang|^PNG_/i.test(p)) return 'penang';
    return 'melaka';
}

// Hours on the timer between two instants, Malaysia time.
function workedHours(from, to, state = 'melaka') {
    const days = workdays(state), off = holidays(state);
    const start = new Date(from).getTime() + MYT, end = new Date(to).getTime() + MYT;
    if (!(end > start)) return 0;
    let total = 0;
    for (let day = Math.floor(start / DAY) * DAY; day < end; day += DAY) {
        const d = new Date(day);
        if (!days.includes(d.getUTCDay()) || off.has(d.toISOString().slice(0, 10))) continue;
        const s = Math.max(start, day + TIMER_FROM * HOUR), e = Math.min(end, day + TIMER_TO * HOUR);
        if (e > s) total += (e - s) / HOUR;
    }
    return total;
}

// Whole hours left, rounded down, negative once over. null = no limit known for this priority or no start.
function hoursLeft(priority, assignedAt, now = new Date(), state = 'melaka') {
    const limit = LIMITS[String(priority || '').toLowerCase()];
    if (limit == null || !assignedAt || Number.isNaN(new Date(assignedAt).getTime())) return null;
    return Math.floor(limit - workedHours(assignedAt, now, state));
}

module.exports = { LIMITS, HOLIDAYS_KNOWN_YEARS, workedHours, hoursLeft, stateOfProject };

if (require.main === module) {
    const [priority, assignedAt, state] = process.argv.slice(2);
    if (!priority || !assignedAt) { console.error('usage: node lib/sla-hours.js <Priority> <assignedISO> [state]'); process.exit(2); }
    console.log(hoursLeft(priority, assignedAt, new Date(), state || 'melaka'));
}
