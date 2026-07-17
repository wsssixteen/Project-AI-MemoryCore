#!/usr/bin/env node
// eval-recon.js — pins redmine-recon.js's classification + detection patterns.
// Pure/offline by design: classify() and the regexes take no network, so every real-world
// failure of 2026-07-16 is replayable as a fixture forever.
'use strict';
const { classify, SQL_BODY, COMMON_VER, TRACKER_BRANCH } = require('./redmine-recon.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// ── C1-C2: the two REAL misses of 2026-07-16 (regression pins — never loosen these) ──

// C1 REPLAY (#269802): sql.txt body uses a table ALIAS — "UPDATE ind_tgsn it SET".
// The old /update\s+\w+\s+set/ silently missed it → ticket reported NO-EVIDENCE.
const REAL_269802 = `UPDATE ind_tgsn it set nama = 'Semakan Keputusan JKBB dan Surat Keputusan', perihal = 'Semakan Keputusan JKBB dan Surat Keputusan'
where ursn_id = (select ursn_id from ind_ursn iu where kod = 'PRBB')
and kod = 'SKJKBB';`;
check('C1 replay: aliased UPDATE ("UPDATE t it SET") detected as SQL', SQL_BODY.test(REAL_269802), 'the #269802 sql.txt false-negative');

// C2 REPLAY (#270952): the common version lives in the RELATED ticket's journal text.
const REAL_270253 = 'Please use common *1.0.129-MLK* onward.';
const cv = COMMON_VER.exec(REAL_270253);
check('C2 replay: "common *1.0.129-MLK*" parsed from journal', cv && cv[1] === '1.0.129-MLK', 'got ' + (cv && cv[1]));

// ── SQL_BODY shape coverage ──
check('C3 plain UPDATE (no alias) still detected', SQL_BODY.test('UPDATE ind_tgsn SET nama = 1;'), '');
check('C4 ALTER TABLE detected', SQL_BODY.test('ALTER TABLE umm_aplikasi ADD COLUMN x varchar(40);'), '');
check('C5 INSERT INTO detected', SQL_BODY.test('insert into rjk_pertubuhan (nama) values (1);'), '');
check('C6 DELETE FROM detected', SQL_BODY.test('DELETE FROM umm_a_tgsn WHERE id = 5;'), '');
check('C7 prose without SQL is NOT flagged (no false positive)',
  !SQL_BODY.test('Please update the screen and set the field to 40 characters. Deployed to staging.'), 'prose must not trip SQL detection');

// ── classify() verdict matrix ──
check('C8 branch only → CODE-BRANCH',
  classify({ branch: 'mlk/internal-issue/269939', sqlAttachments: [] }).verdict === 'CODE-BRANCH', '');

check('C9 replay #269802: sql attachment, no branch → SQL-PATCH, sheetEntry not a question',
  (() => { const v = classify({ branch: '', sqlAttachments: ['#269802 sql.txt'] });
    return v.verdict === 'SQL-PATCH' && v.sheetEntry === true && v.askBa === false && /NOT a git merge/.test(v.action); })(),
  'a SQL-only fix must never be reported as mergeable; it routes to the Google Sheet, not the ask-list');

check('C10 branch AND sql → CODE+SQL (the SQL half must NOT be swallowed by the merge)',
  (() => { const v = classify({ branch: 'mlk/qa/1', sqlAttachments: ['fix.sql'] });
    return v.verdict === 'CODE+SQL' && v.sheetEntry === true && /deliver the SQL separately/.test(v.action); })(),
  'miya red flag: code fix present must not hide an accompanying SQL fix');

check('C10b code-only → NOT a sheet entry (SQL field stays empty)',
  classify({ branch: 'mlk/qa/1', sqlAttachments: [] }).sheetEntry === false, '');

check('C11 replay #270952: common-ver + bump already on release → nothing to merge, no BA ask',
  (() => { const v = classify({ branch: '', sqlAttachments: [], commonVersion: '1.0.129-MLK',
      commonBumpOnRelease: 'd19b0b2b0a common version increase to: 1.0.129-MLK', related: [270253] });
    return v.verdict === 'COMMON-VER' && v.askBa === false && /already shipped via common/.test(v.action); })(),
  'must recognise a fix that shipped via the common bump');

check('C12 common-ver but bump MISSING from release → ask',
  (() => { const v = classify({ branch: '', sqlAttachments: [], commonVersion: '1.0.130-MLK', commonBumpOnRelease: '', related: [] });
    return v.verdict === 'COMMON-VER' && v.askBa === true; })(), '');

check('C13 relation only → VIA-RELATED + ask',
  (() => { const v = classify({ branch: '', sqlAttachments: [], related: [270253] });
    return v.verdict === 'VIA-RELATED' && v.askBa === true; })(), '');

check('C14 unlabelled commit found by git log --grep → CODE-BRANCH + ask',
  (() => { const v = classify({ branch: '', sqlAttachments: [], related: [], unlabelledCommit: 'abc1234' });
    return v.verdict === 'CODE-BRANCH' && v.askBa === true; })(), '');

check('C15 the nightmare case: zero evidence anywhere → NO-EVIDENCE + ask',
  (() => { const v = classify({ branch: '', sqlAttachments: [], related: [], commonVersion: '', unlabelledCommit: '' });
    return v.verdict === 'NO-EVIDENCE' && v.askBa === true && /ASK BA/.test(v.action); })(),
  'miya: "BA suddenly requests release with no hints" must surface, never silently pass');

check('C16 sqlTalk (no attachment) still flags SQL',
  classify({ branch: '', sqlAttachments: [], sqlTalk: true }).verdict === 'SQL-PATCH', '');

// ── tracker → branch prefix map ──
check('C17 tracker map covers the live trackers seen on 1.0.9',
  ['internal issue', 'training', 'esokongan', 'qa', 'cr', 'requirement'].every(t => TRACKER_BRANCH[t]),
  'Training → mlk/internal was only learned from the live #270825 run');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nredmine-recon eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
