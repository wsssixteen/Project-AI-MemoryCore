#!/usr/bin/env node
// protime-plan.eval.js — behaviour fixtures for the planning rule (no network, no ProTime write).
'use strict';
const { weekDays, planByDate, distribute, decide } = require('./protime-plan.js');

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const T = n => Array.from({ length: n }, (_, i) => String(280000 + i));
const D = s => new Date(s + 'T08:00:00');
const WEEK = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];
const none = {};

// week shape
eq('S1 Monday -> Mon..Fri of the same week', weekDays(D('2026-10-05')), WEEK);
eq('S2 Sunday belongs to the week that ENDS on it', weekDays(D('2026-10-04'))[0], '2026-09-28');
eq('S3 Saturday -> same Mon..Fri', weekDays(D('2026-10-10'))[0], '2026-10-05');
eq('S4 month/year boundary', weekDays(D('2026-12-31')), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01']);

// the 4 / 3 / empty rule on a full Monday
eq('S5 20 tickets -> 4 a day, all placed', (r => [r.perDay, Object.values(r.placed).map(x => x.length), r.unplaced.length])(decide({ today: D('2026-10-05'), board: T(20), existing: none })), [4, [4, 4, 4, 4, 4], 0]);
eq('S6 25 tickets -> 4 a day, 5 unplaced', (r => [r.perDay, r.unplaced.length])(decide({ today: D('2026-10-05'), board: T(25), existing: none })), [4, 5]);
eq('S7 19 tickets -> 3 a day, 15 placed, 4 unplaced', (r => [r.perDay, Object.values(r.placed).flat().length, r.unplaced.length])(decide({ today: D('2026-10-05'), board: T(19), existing: none })), [3, 15, 4]);
eq('S8 7 tickets -> 3,3,1 then Thu/Fri empty', (r => Object.fromEntries(Object.entries(r.placed).map(([k, v]) => [k, v.length])))(decide({ today: D('2026-10-05'), board: T(7), existing: none })), { '2026-10-05': 3, '2026-10-06': 3, '2026-10-07': 1 });
eq('S9 0 tickets -> nothing placed, no crash', decide({ today: D('2026-10-05'), board: [], existing: none }).placed, {});
eq('S10 rank order kept (first ticket on Monday)', decide({ today: D('2026-10-05'), board: ['282587', '275043'], existing: none }).placed['2026-10-05'], ['282587', '275043']);

// midweek / manual entries
eq('S11 Wed run -> only Wed..Fri considered', decide({ today: D('2026-10-07'), board: T(12), existing: none }).days, WEEK.slice(2));
eq('S12 a day with ANY plan entry is never touched', Object.keys(decide({ today: D('2026-10-05'), board: T(12), existing: { '2026-10-05': ['Baseline MLK PLP 1.8.0'] } }).placed).includes('2026-10-05'), false);
eq('S13 capacity uses OPEN days only (2 open, 8 tickets -> 4 a day)', decide({ today: D('2026-10-08'), board: T(8), existing: none }).perDay, 4);
eq('S14 the 2026-09-30 real case: 7 tickets, Thu+Fri open -> 3 a day, 1 unplaced', (r => [r.perDay, r.unplaced])(decide({ today: D('2026-09-30'), board: ['275043', '274323', '246923', '265109', '244600', '281324', '282587'], existing: { '2026-09-30': ['281650'] } })), [3, ['282587']]);
eq('S15 ticket already on a remaining day ("282198 - 50%") is not planned twice', decide({ today: D('2026-10-05'), board: ['282198', '281324'], existing: { '2026-10-05': ['282198 - 50% (Pending user update)'] } }).placed, { '2026-10-06': ['281324'] });
eq('S16 duplicate ids on the board collapse to one', Object.values(decide({ today: D('2026-10-05'), board: ['1', '1', '2'].map(x => '28000' + x), existing: none }).placed).flat(), ['280001', '280002']);
eq('S17 numeric ids from JSON are treated as strings', decide({ today: D('2026-10-05'), board: [282587], existing: none }).placed['2026-10-05'], ['282587']);

// days off
eq('S18 public holiday skipped', decide({ today: D('2026-10-05'), board: T(3), existing: none, holidays: ['2026-10-05'] }).placed, { '2026-10-06': T(3) });
eq('S19 own approved leave skipped', decide({ today: D('2026-10-05'), board: T(20), existing: none, leave: ['2026-10-09'] }).placed['2026-10-09'], undefined);
eq('S20 whole week off -> nothing placed', decide({ today: D('2026-10-05'), board: T(5), existing: none, holidays: WEEK }).placed, {});
eq('S21 Saturday run -> no weekday left, nothing placed', decide({ today: D('2026-10-10'), board: T(5), existing: none }).placed, {});

// ProTime answer shapes
eq('S22 staff-plan/self parsed, PLAN only (adhoc ignored)', planByDate([{ date: '01/10/2026', tasks: { plan: [{ planName: '275043' }], adhoc: [{ planName: 'X' }], resolved: [] } }]), { '2026-10-01': ['275043'] });
eq('S23 bad / empty answer -> empty map, no crash', planByDate(null), {});
eq('S24 day with no tasks object -> empty list (day counts as open)', planByDate([{ date: '02/10/2026' }]), { '2026-10-02': [] });
eq('S25 blank planName ignored', planByDate([{ date: '02/10/2026', tasks: { plan: [{ planName: '  ' }] } }]), { '2026-10-02': [] });
eq('S26 distribute with no open day -> everything unplaced', distribute(T(3), []).unplaced.length, 3);

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
