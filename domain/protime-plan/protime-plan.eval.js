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
eq('S5 20 tickets -> 3 a day (his KPI), 5 left unplaced', (r => [r.perDay, Object.values(r.placed).map(x => x.length), r.unplaced.length])(decide({ today: D('2026-10-05'), board: T(20), existing: none })), [3, [3, 3, 3, 3, 3], 5]);
eq('S6 25 tickets -> 3 a day, 10 unplaced', (r => [r.perDay, r.unplaced.length])(decide({ today: D('2026-10-05'), board: T(25), existing: none })), [3, 10]);
eq('S7 19 tickets -> 3 a day, 15 placed, 4 unplaced', (r => [r.perDay, Object.values(r.placed).flat().length, r.unplaced.length])(decide({ today: D('2026-10-05'), board: T(19), existing: none })), [3, 15, 4]);
eq('S8 7 tickets -> 3,3,1 then Thu/Fri empty', (r => Object.fromEntries(Object.entries(r.placed).map(([k, v]) => [k, v.length])))(decide({ today: D('2026-10-05'), board: T(7), existing: none })), { '2026-10-05': 3, '2026-10-06': 3, '2026-10-07': 1 });
eq('S9 0 tickets -> nothing placed, no crash', decide({ today: D('2026-10-05'), board: [], existing: none }).placed, {});
eq('S10 rank order kept (first ticket on Monday)', decide({ today: D('2026-10-05'), board: ['282587', '275043'], existing: none }).placed['2026-10-05'], ['282587', '275043']);

// midweek / manual entries
eq('S11 Wed run -> only Wed..Fri considered', decide({ today: D('2026-10-07'), board: T(12), existing: none }).days, WEEK.slice(2));
eq('S12 a day with ANY plan entry is never touched', Object.keys(decide({ today: D('2026-10-05'), board: T(12), existing: { '2026-10-05': ['Baseline MLK PLP 1.8.0'] } }).placed).includes('2026-10-05'), false);
eq('S13 2 open days, 8 tickets -> still 3 a day (the KPI is the cap)', decide({ today: D('2026-10-08'), board: T(8), existing: none }).perDay, 3);
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

// status: every outcome names its next action
const { statusOf, nextFor, NEXT } = require('./protime-plan.js');
const W = '2026-10-05';
const row = (result, extra) => ({ week: W, mode: 'live', result, ...extra });
eq('S27 filled week -> FILLED, nothing to do', (s => [s.verdict, s.next])(statusOf([row('ok', { placed: { [W]: ['274323'] } })], D('2026-10-05'))), ['FILLED', 'nothing to do']);
eq('S28 ok with nothing placed -> NOTHING TO FILL', statusOf([row('ok', { placed: {} })], D('2026-10-06')).verdict, 'NOTHING TO FILL');
eq('S29 failure -> FAILED with that result\'s action', (s => [s.verdict, s.next])(statusOf([row('protime-throttled')], D('2026-10-05'))), ['FAILED', NEXT['protime-throttled']]);
eq('S30 failure then success -> FILLED (retry worked)', statusOf([row('redmine-unreachable'), row('ok', { placed: { [W]: ['1'] } })], D('2026-10-05')).verdict, 'FILLED');
eq('S31 no row, before Monday 08:30 -> NOT DUE YET', statusOf([], new Date('2026-10-05T07:00:00')).verdict, 'NOT DUE YET');
eq('S32 no row, after Monday 08:30 -> DID NOT RUN', statusOf([], new Date('2026-10-05T12:00:00')).verdict, 'DID NOT RUN');
eq('S33 last week\'s ok row does not count for this week', statusOf([{ week: '2026-09-28', mode: 'live', result: 'ok', placed: { x: ['1'] } }], new Date('2026-10-05T12:00:00')).verdict, 'DID NOT RUN');
eq('S34 dry rows never count as filled', statusOf([{ week: W, mode: 'dry', result: 'ok', placed: { x: ['1'] } }], new Date('2026-10-05T12:00:00')).verdict, 'DID NOT RUN');
eq('S35 every result the script can log has a next action', ['redmine-unreachable', 'no-protime-login', 'protime-wrong-credentials', 'protime-throttled', 'protime-unreachable', 'protime-cert-error', 'protime-login-failed', 'protime-read-failed', 'protime-write-failed', 'read-back-mismatch', 'crash'].filter(r => !NEXT[r]), []);
eq('S36 unknown result still answers', nextFor('something-new'), 'unknown result: read the log row');

// ---- daily runs (miya 2026-10-13): top-up, settle, his adhoc wording ----
const { settle, sameTitle, protimeLine, prevWorkday, entriesByDate, mineOf, ticketsIn } = require('./protime-plan.js');
const E = (id, name, status = 'PENDING') => ({ id, name, status });
const mineIds = ids => e => ids.includes(e.id);

eq('S37 top-up: today has 1 entry -> 2 more today (KPI 3), rest of week 3 a day', (r => [r.placed['2026-10-05'].length, r.placed['2026-10-06'].length])(decide({ today: D('2026-10-05'), board: T(20), existing: { '2026-10-05': ['Baseline'] }, topUp: true })), [2, 3]);
eq('S38 top-up: today already has 4 -> today left alone', decide({ today: D('2026-10-05'), board: T(8), existing: { '2026-10-05': ['a', 'b', 'c', 'd'] }, topUp: true }).placed['2026-10-05'], undefined);
eq('S39 top-up never repeats a ticket already on today', decide({ today: D('2026-10-05'), board: ['284201', '281324'], existing: { '2026-10-05': ['284201'] }, topUp: true }).placed['2026-10-05'], ['281324']);
eq('S40 top-up only for today: a later day with an entry stays untouched', Object.keys(decide({ today: D('2026-10-05'), board: T(20), existing: { '2026-10-06': ['x'] }, topUp: true }).placed).includes('2026-10-06'), false);
eq('S41 Monday -> previous working day is last Friday', prevWorkday(D('2026-10-12')), '2026-10-09');
eq('S42 Wednesday -> Tuesday', prevWorkday(D('2026-10-14')), '2026-10-13');

eq('S43 worked own ticket missing from the day -> added to PLAN', settle({ existing: { plan: [], adhoc: [] }, worked: [{ id: '284544', own: true }] }).addPlan, ['284544']);
eq('S44 worked ticket already on the day (his own words) -> not added again', settle({ existing: { plan: [E(1, '284544 - 50%')], adhoc: [] }, worked: [{ id: '284544', own: true }] }).addPlan, []);
eq('S45 worked ticket that was never his -> ADHOC "<number> - Assist"', settle({ existing: { plan: [], adhoc: [] }, worked: [{ id: '283286', own: false }] }).addAdhoc, ['283286 - Assist']);
eq('S46 ... already keyed by him as adhoc -> not added again', settle({ existing: { plan: [], adhoc: [E(2, '283286 - Assist deploy & check issue.')] }, worked: [{ id: '283286', own: false }] }).addAdhoc, []);
eq('S47 placed by the script, not worked -> removed', settle({ existing: { plan: [E(10, '274323'), E(11, '284201')], adhoc: [] }, worked: [{ id: '284201', own: true }], mine: mineIds([10, 11]) }).remove, [{ id: 10, name: '274323' }]);
eq('S48 typed by him, not worked -> NEVER removed', settle({ existing: { plan: [E(10, '274323')], adhoc: [] }, worked: [], mine: mineIds([]) }).remove, []);
eq('S49 placed by the script but he edited the text -> never removed', settle({ existing: { plan: [E(10, '274323 - 50%')], adhoc: [] }, worked: [], mine: mineIds([10]) }).remove, []);
eq('S50 placed by the script and he marked it RESOLVED -> never removed', settle({ existing: { plan: [E(10, '274323', 'RESOLVED')], adhoc: [] }, worked: [], mine: mineIds([10]) }).remove, []);
eq('S51 Redmine unreachable (canRemove false) -> nothing removed', settle({ existing: { plan: [E(10, '274323')], adhoc: [] }, worked: [], mine: mineIds([10]), canRemove: false }).remove, []);
eq('S52 adhoc of the day missing -> added', settle({ existing: { plan: [], adhoc: [] }, adhocs: ['PROD (MLK) - MLPS Borang 4Ae cop tak papar'] }).addAdhoc, ['PROD (MLK) - MLPS Borang 4Ae cop tak papar']);
eq('S53 adhoc he already typed in near-same words -> not added again', settle({ existing: { plan: [], adhoc: [E(3, 'PROD - TRG - PLPS SKM tiada dalam senarai')] }, adhocs: ['PROD - TRG - PLPS tugasan SKM tiada dalam inbox'] }).addAdhoc, []);
eq('S54 the same adhoc twice in one run -> added once', settle({ existing: { plan: [], adhoc: [] }, adhocs: ['PROD (MLK) - PRBB surat keputusan tandatangan issue', 'PROD (MLK) - PRBB surat keputusan tandatangan issue'] }).addAdhoc.length, 1);
eq('S55 an adhoc entry is never removed', settle({ existing: { plan: [], adhoc: [E(4, '283286')] }, worked: [], mine: mineIds([4]) }).remove, []);

eq('S56 two different adhocs are not the same', sameTitle('PROD - PRBB surat keputusan tandatangan issue', 'PROD - MLPS Borang 4Ae cop tak papar'), false);
eq('S57 env and state words alone do not make two titles the same', sameTitle('PROD - MLK - No Lesen missing', 'PROD - MLK - Peranan KPT missing'), false);
eq('S58 ProTime line: PROD + title', protimeLine({ env: 'PROD', title: 'MLPS Borang 4Ae cop tak papar' }), 'PROD (MLK) - MLPS Borang 4Ae cop tak papar');
eq('S59 ProTime line: MLIT is written Internal', protimeLine({ env: 'MLIT', title: 'PRBB lot luas laporan tanah kosong' }), 'Internal (MLK) - PRBB lot luas laporan tanah kosong');
eq('S60 ProTime line: staging', protimeLine({ env: 'MLKSTG', title: 'PT tugasan PSJT error' }), 'Staging (MLK) - PT tugasan PSJT error');
eq('S61 ProTime line: the state goes in brackets after the env', protimeLine({ env: 'PROD', state: 'terengganu', title: 'PLPS tugasan SKM missing' }), 'PROD (TRG) - PLPS tugasan SKM missing');
eq('S62 ProTime line: Melaka is written MLK', protimeLine({ env: 'PROD', state: 'melaka', title: 'No Lesen date issue' }), 'PROD (MLK) - No Lesen date issue');
eq('S63 ProTime line: a title that already opens with an env word is kept', protimeLine({ env: 'MLKSTG', title: 'Internal (PLP) - PPTPB sewa tahunan peraturan hardcoded' }), 'Internal (PLP) - PPTPB sewa tahunan peraturan hardcoded');
eq('S64 ProTime line: unknown env -> title alone', protimeLine({ env: 'CODE', title: 'AWAM senarai semak module check' }), 'AWAM senarai semak module check');
eq('S65 ProTime line: no title -> empty, never invented', protimeLine({ env: 'PROD' }), '');

eq('S66 entries carry id, name, status for plan and adhoc', entriesByDate([{ date: '12/10/2026', tasks: { plan: [{ id: 1, planName: '284201', status: 'PENDING' }], adhoc: [{ id: 2, planName: 'X', status: 'RESOLVED' }] } }]), { '2026-10-12': { plan: [E(1, '284201')], adhoc: [E(2, 'X', 'RESOLVED')] } });
eq('S67 mine: an id this script logged', mineOf([{ mode: 'live', result: 'ok', created: [{ id: 7 }] }])(E(7, '284201'), '2026-10-12'), true);
eq('S68 mine: the old weekly script kept names only', mineOf([{ mode: 'live', result: 'ok', placed: { '2026-10-12': ['284201'] } }])(E(99, '284201'), '2026-10-12'), true);
eq('S69 mine: a dry row never makes an entry mine', mineOf([{ mode: 'dry', result: 'ok', created: [{ id: 7 }] }])(E(7, '284201'), '2026-10-12'), false);
eq('S70 mine: same name on another day is not mine', mineOf([{ mode: 'live', result: 'ok', placed: { '2026-10-12': ['284201'] } }])(E(99, '284201'), '2026-10-13'), false);
eq('S71 two tickets in one entry are both seen', ticketsIn('264355 & 274266 - Debug & delegate to junior.'), ['264355', '274266']);
eq('S72 a date or a longer number is not a ticket', ticketsIn('Baseline 1.8.1 for 29/7/2026 and 03PLPS2026000006'), []);

// status, daily
eq('S73 today\'s night row with a removal -> FILLED', statusOf([{ day: '2026-10-13', run: 'night', mode: 'live', result: 'ok', created: [], removed: [{ id: 1 }] }], D('2026-10-13')).verdict, 'FILLED');
eq('S74 yesterday\'s row does not count for today', statusOf([{ day: '2026-10-12', run: 'morning', mode: 'live', result: 'ok', created: [{ id: 1 }] }], new Date('2026-10-13T12:00:00')).verdict, 'DID NOT RUN');
eq('S75 Saturday -> NOT DUE YET', statusOf([], new Date('2026-10-17T12:00:00')).verdict, 'NOT DUE YET');

eq('S76 ProTime line: his own example (Penang, internal)', protimeLine({ env: 'MLIT', state: 'penang', title: 'Check SPOC service data save from Awam' }), 'Internal (PNG) - Check SPOC service data save from Awam');
// ---- the line check: his real lines pass, my known-wrong lines fail (2026-10-14) ----
const { lintLine, MANUAL, manualArgsError, rulesText } = require('./protime-plan.js');
const HIS = ['Assist BA - Query to patch Tarikh Tamat permit', 'Assist BA - Patch Tujuan permit', 'Internal (MLK) - PDF viewer error, document not showing',
  '281650 - Clarify to user', 'Internal (PNG) - Check SPOC service data save from Awam', 'Setup clone for Penang project', 'Staging (MLK) - MLPS Borang 4Ae Tandatangan error',
  '246923 - Review & deploy', '264355 & 274266 - Debug & delegate to junior.', 'Assist BA - Retrieve Data PRBB Permit & Tugasan Semua Daerah', 'PROD (MLK) - Missing Tujuan in Borang 4Ae',
  'PROD (TRG) - PLPS SKM tiada dalam senarai', 'Baseline Pelupusan 1.8.1', 'Update Redmine details (Root Cause, Solutions, etc) for tickets 276584, 276549'];
eq('S77 every line he keyed or approved passes the line check', HIS.filter(l => lintLine(l).length).map(l => l + ' -> ' + lintLine(l).join(';')), []);
const BAD = ['PROD - TRG - PLPS SKM tiada dalam senarai', 'Staging - PT tugasan PSJT ralat buka', 'AWAM slip permohonan gagal jana', 'Internal - PLP dashboard ralat Invalid path TestGis',
  '281650 - Answer user questions', 'PROD (MLK) - NPE at MlkBorang4CeForm.initMklmt()', 'Assist BA - Retrieve PRBB Permit &amp; Tugasan', 'PROD (MLK) - Wrong data PTMLK/02/L/PT/2026/7', '', 'PROD (XYZ) - Something wrong'];
eq('S78 every known-wrong line is refused', BAD.filter(l => !lintLine(l).length), []);
eq('S79 a run never writes an adhoc line that breaks his format', settle({ existing: { plan: [], adhoc: [] }, adhocs: ['Staging - PT tugasan PSJT ralat buka', 'PROD (MLK) - PT tugasan PSJT error'] }).addAdhoc, ['PROD (MLK) - PT tugasan PSJT error']);
eq('S80 --add-adhoc refuses a bad line before any login', /line refused/.test(manualArgsError('--add-adhoc', ['2026-10-14', 'PROD - TRG - X missing'])), true);
eq('S81 --add-plan needs a 6-digit ticket', manualArgsError('--add-plan', ['2026-10-14', '12345']) !== null, true);
eq('S82 --rename needs a numeric entry id', manualArgsError('--rename', ['2026-10-14', 'abc', 'PROD (MLK) - X issue']) !== null, true);
eq('S83 a good --resolve passes the argument check', manualArgsError('--resolve', ['2026-10-14', '284775']), null);
eq('S84 a bad date is refused', manualArgsError('--show', ['14-10-2026']) !== null, true);

// ---- skill and scheduler stay one (2026-10-14: "if I update the skill or the scheduler, it will reflect each other") ----
const fsE = require('fs'), pathE = require('path');
const SKILL = pathE.join(__dirname, '..', '..', '.claude', 'skills', 'protime-plan', 'SKILL.md');
const skillText = (() => { try { return fsE.readFileSync(SKILL, 'utf8'); } catch (_) { return ''; } })();
const srcText = fsE.readFileSync(pathE.join(__dirname, 'protime-plan.js'), 'utf8');
eq('S85 the skill file exists', skillText.length > 0, true);
const skillFlags = [...new Set((skillText.match(/`--[a-z-]+/g) || []).map(s => s.slice(1)))];
eq('S86 every command the skill names exists in the script', skillFlags.filter(f => !srcText.includes(`'${f}'`)), []);
eq('S87 every on-demand command of the script is named in the skill', MANUAL.map(m => m.flag).filter(f => !skillText.includes('`' + f)), []);
eq('S88 the skill copies no rule numbers (rules come from --rules)', /4 a day|3 a day|08:30 and 23:00/.test(skillText.replace(/^description:.*$/m, '')), false);
const xml = fsE.readFileSync(pathE.join(__dirname, 'task.xml'), 'utf8');
eq('S89 --rules prints the times that are really in task.xml', [...xml.matchAll(/<StartBoundary>[^T]+T(\d\d:\d\d)/g)].every(m => rulesText().includes(m[1])), true);
eq('S90 the scheduled launcher runs the same script the skill runs', /protime-plan\.js"" --auto --live --once --notify/.test(fsE.readFileSync(pathE.join(__dirname, 'run-hidden.vbs'), 'utf8')), true);
const ADHOC_SKILL = (() => { try { return fsE.readFileSync(pathE.join(__dirname, '..', '..', '.claude', 'skills', 'adhoc-save', 'SKILL.md'), 'utf8'); } catch (_) { return ''; } })();
const ruleSection = (ADHOC_SKILL.split('## Adhoc title (ProTime)')[1] || '').split('\n## ')[0];
const ruleExamples = [...ruleSection.matchAll(/his `([^`]+)`|\| `([^`]+)` ·|`((?:PROD|Internal|Staging) \([A-Z]+\) - [^`]+)`/g)].map(m => m[1] || m[2] || m[3]).filter(x => /^(\d{6}|Assist BA|PROD|Internal|Staging)\b/.test(x));
eq('S91 the wording rule still has its examples', ruleExamples.length >= 4, true);
eq('S92 every full line in the wording rule passes the script line check', ruleExamples.filter(l => !/<|\.\.\./.test(l) && lintLine(l).length), []);
eq('S93 the wording rule names the same format the script writes', ruleSection.includes('`<ENV> (<STATE>) - <title>`') && protimeLine({ env: 'PROD', state: 'melaka', title: 'X' }) === 'PROD (MLK) - X', true);

// ---- plan or adhoc, and resolve (miya 2026-10-14) ----
const { ownerOfDay, toResolve } = require('./protime-plan.js');
const C = (date, mine, subject) => ({ date, mine, subject });
eq('S94 283345 today: Ammar wrote the fix, his commit today only removed code -> ADHOC', ownerOfDay({ commits: [C('2026-10-08', false, 'refs #283345'), C('2026-10-09', true, 'Ref #283345 - PRBB - SKM - read counter'), C('2026-10-14', false, 'refs #283345 - customizer'), C('2026-10-14', true, 'Ref #283345 - Remove checklist fix from int-env')], day: '2026-10-14' }), 'ADHOC');
eq('S95 the same ticket on the day he added his own fix -> PLAN', ownerOfDay({ commits: [C('2026-10-08', false, 'refs #283345'), C('2026-10-09', true, 'Ref #283345 - PRBB - SKM - read counter')], day: '2026-10-09' }), 'PLAN');
eq('S96 his own fix ticket -> PLAN', ownerOfDay({ commits: [C('2026-10-14', true, 'Ref #284544 - MLPS - PB4AE - fix cop')], day: '2026-10-14' }), 'PLAN');
eq('S97 only "Up common" commits by him, no other owner -> PLAN (his requirement)', ownerOfDay({ commits: [C('2026-10-14', true, 'Ref #240907 - Up common to 1.10.5-MLK')], day: '2026-10-14' }), 'PLAN');
eq('S98 our record says delegated_to a colleague -> ADHOC', ownerOfDay({ commits: [], delegatedTo: 'Ammar', day: '2026-10-14' }), 'ADHOC');
eq('S99 a colleague\'s ticket where he wrote a patch script today -> PLAN', ownerOfDay({ commits: [C('2026-10-01', false, 'refs #1')], patchToday: true, day: '2026-10-14' }), 'PLAN');
eq('S100 no commit, no other owner (his ticket at rubric) -> PLAN', ownerOfDay({ commits: [], day: '2026-10-14' }), 'PLAN');
const EX = { plan: [E(1, '240907'), E(2, '284831'), E(3, '284775', 'RESOLVED'), E(9, '284544')], adhoc: [E(4, '283345 - Assist'), E(5, 'Internal (MLK) - Document PDF not showing'), E(6, 'Setup Penang DB connections'), E(7, 'Assist BA - Typed by him')] };
const W2 = [{ id: '240907', done: true }, { id: '284831', done: false }, { id: '283345', done: true }, { id: '284544', done: false }];
const RS = toResolve({ existing: EX, worked: W2, waiting: ['Internal (MLK) - Document PDF not showing'], mine: e => e.id !== 7 }).map(e => e.id);
eq('S101 plan ticket passed on today -> resolved', RS.includes(1), true);
eq('S102 plan ticket still with him -> not resolved', RS.includes(2) || RS.includes(9), false);
eq('S103 already resolved -> not touched again', RS.includes(3), false);
eq('S104 assist adhoc on a ticket worked today -> resolved', RS.includes(4), true);
eq('S105 adhoc waiting on infra -> not resolved', RS.includes(5), false);
eq('S106 plain adhoc of the day -> resolved', RS.includes(6), true);
eq('S107 a line he typed himself -> never resolved by the run', RS.includes(7), false);
eq('S109 the run skips a day he approved line by line (no add, remove or resolve)', /if \(approvedDays\.has\(d\)\) \{ console\.log\(`\$\{d\}: approved by him line by line - left alone`\); continue; \}/.test(require('fs').readFileSync(require('path').join(__dirname, 'protime-plan.js'), 'utf8')), true);
eq('S108 an approved day is left alone: settle adds no adhoc there', settle({ existing: { plan: [], adhoc: [] }, adhocs: ['PROD (MLK) - X issue'], approvedDay: true }).addAdhoc, []);

// ---- the 3-ticket KPI at night (miya 2026-10-14: 284831 should not have been added to a day already holding 4) ----
const FULL = { plan: [E(1, '284544'), E(2, '284775'), E(3, '240907'), E(4, '283960')], adhoc: [] };
eq('S110 a day already at the KPI gets no more plan tickets', settle({ existing: FULL, worked: [{ id: '284831', own: true, done: false }] }).addPlan, []);
eq('S111 a day with 1 plan ticket gets finished ones first, up to 3', settle({ existing: { plan: [E(1, '111111')], adhoc: [] }, worked: [{ id: '222222', own: true, done: false }, { id: '333333', own: true, done: true }, { id: '444444', own: true, done: true }] }).addPlan, ['333333', '444444']);
eq('S112 assists still go to adhoc on a full day', settle({ existing: FULL, worked: [{ id: '283345', own: false }] }).addAdhoc, ['283345 - Assist']);
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
