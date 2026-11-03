#!/usr/bin/env node
/**
 * sla-hours.eval.js — fixtures for lib/sla-hours.js. Every expected value is worked out by hand from the
 * rule, or read from the verified appraisal evidence (the three September 2026 tickets).
 * Run: node lib/sla-hours.eval.js      Exit: 0 = all green, 1 = any red
 */
'use strict';
const { LIMITS, HOLIDAYS_KNOWN_YEARS, workedHours, hoursLeft, stateOfProject } = require('./sla-hours');

let pass = 0, fail = 0;
function check(name, ok, got) { if (ok) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + '  got: ' + got); } }
const near = (a, b) => Math.abs(a - b) < 0.05;
const t = s => s + '+08:00';

check('L1 limits are his message: Critical 6, High 10, Medium 22, Low 31', LIMITS.critical === 6 && LIMITS.high === 10 && LIMITS.medium === 22 && LIMITS.low === 31, JSON.stringify(LIMITS));

// The timer
let h = workedHours(t('2026-10-05T08:00:00'), t('2026-10-05T17:00:00'));
check('C1 a full Monday is 9 hours, lunch counted', h === 9, h);
h = workedHours(t('2026-10-05T07:00:00'), t('2026-10-05T07:59:00'));
check('C2 before 8am counts nothing', h === 0, h);
h = workedHours(t('2026-10-05T16:00:00'), t('2026-10-05T23:00:00'));
check('C3 after 5pm counts nothing', h === 1, h);
h = workedHours(t('2026-10-02T16:00:00'), t('2026-10-05T09:00:00'));
check('C4 a weekend counts nothing: Fri 16:00 to Mon 09:00 is 2 hours', h === 2, h);
h = workedHours(t('2026-10-05T10:00:00'), t('2026-10-05T09:00:00'));
check('C5 an end before the start is 0, never negative', h === 0, h);

// Holidays: the case that caught the bug
h = workedHours(t('2026-09-15T16:00:00'), t('2026-09-17T09:00:00'));
check('H1 Malaysia Day is out: Tue 16:00 to Thu 09:00 is 2 hours', h === 2, h);
h = workedHours(t('2026-08-21T16:00:00'), t('2026-08-24T09:00:00'), 'melaka');
check('H2 Melaka Governor birthday (24 Aug) is out in Melaka', h === 1, h);
h = workedHours(t('2026-08-21T16:00:00'), t('2026-08-24T09:00:00'), 'perak');
check('H3 that Melaka holiday still counts in Perak', h === 2, h);
check('H4 the holiday list covers the current year', HOLIDAYS_KNOWN_YEARS.includes(new Date().getFullYear()), new Date().getFullYear());

// Terengganu works Sunday to Thursday
h = workedHours(t('2026-10-02T09:00:00'), t('2026-10-02T17:00:00'), 'terengganu');
check('T1 Friday counts nothing in Terengganu', h === 0, h);
h = workedHours(t('2026-10-04T08:00:00'), t('2026-10-04T17:00:00'), 'terengganu');
check('T2 Sunday is a full day in Terengganu', h === 9, h);
h = workedHours(t('2026-10-04T08:00:00'), t('2026-10-04T17:00:00'), 'melaka');
check('T3 Sunday counts nothing in Melaka', h === 0, h);
check('T4 project names map to states', stateOfProject('eSOKONGAN TERENGGANU') === 'terengganu' && stateOfProject('TRG_03_Pelupusan') === 'terengganu' && stateOfProject('eSOKONGAN PERAK') === 'perak' && stateOfProject('eSOKONGAN MELAKA') === 'melaka', '');

// The September 2026 tickets his manager counted: 1 miss, not 3
h = workedHours(t('2026-09-14T13:29:00'), t('2026-09-17T19:29:00'));
check('S1 279711 is 21.5 hours, inside 22', near(h, 21.5), h);
h = workedHours(t('2026-09-14T17:14:00'), t('2026-09-17T19:27:00'));
check('S2 279787 is 18 hours, inside 22', near(h, 18), h);
h = workedHours(t('2026-09-14T08:39:00'), t('2026-09-15T19:19:00')) + workedHours(t('2026-09-17T08:22:00'), t('2026-09-17T18:52:00'));
check('S3 279615 is 26 hours, the one real miss', near(h, 26), h);

// Hours left
let left = hoursLeft('Medium', t('2026-10-05T08:00:00'), new Date(t('2026-10-05T12:30:00')));
check('H5 Medium, 4.5 hours used, shows 17 (rounded down)', left === 17, left);
left = hoursLeft('Critical', t('2026-10-05T08:00:00'), new Date(t('2026-10-05T17:00:00')));
check('H6 Critical over its limit is negative: -3', left === -3, left);
left = hoursLeft('High', t('2026-10-05T08:00:00'), new Date(t('2026-10-05T08:00:00')));
check('H7 High, just assigned, shows 10', left === 10, left);
left = hoursLeft('Low', t('2026-10-05T08:00:00'), new Date(t('2026-10-05T08:00:00')));
check('H8 Low, just assigned, shows 31', left === 31, left);
check('H9 an unknown priority gives no number', hoursLeft('Immediate', t('2026-10-05T08:00:00')) === null, '');
check('H10 no start gives no number', hoursLeft('Medium', null) === null && hoursLeft('Medium', 'nonsense') === null, '');

console.log(`\nsla-hours.eval: ${pass}/${pass + fail} green`);
process.exit(fail ? 1 : 0);
