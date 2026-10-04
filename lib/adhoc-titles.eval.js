#!/usr/bin/env node
// adhoc-titles.eval — fixture run of lib/adhoc-titles.js against a temp root. Exit 0 = all cases pass.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'adhoc-titles-'));
fs.mkdirSync(path.join(tmp, 'quest'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
const oldDoc = path.join(tmp, 'docs', 'old.md');
fs.writeFileSync(oldDoc, 'x');
fs.utimesSync(oldDoc, new Date('2026-10-04T10:00:00'), new Date('2026-10-04T10:00:00'));

fs.writeFileSync(path.join(tmp, 'quest', 'active.txt'), [
  'qa=ADHOC-A-2026-1', 'ticket_type=adhoc', 'quest_start=2026-10-04', 'state=Terengganu', 'env=PROD', 'title=PLPS SKM tiada dalam senarai', '',
  'qa=ADHOC-B-2026-1', 'ticket_type=adhoc', 'quest_start=2026-10-04', 'title=', '',
  'qa=QA-111', 'ticket_type=bug', 'quest_start=2026-10-04', 'title=not an adhoc', '',
  'qa=ADHOC-C-2026-1', 'ticket_type=adhoc', 'quest_start=2026-09-01', 'qa_doc=' + oldDoc, 'title=PRBB lama sambung', '',
  'qa=ADHOC-D-2026-1', 'ticket_type=adhoc', 'quest_start=2026-09-02', 'title=other day', ''
].join('\r\n'));
fs.writeFileSync(path.join(tmp, 'quest', 'active-archive.txt'), ['qa=ADHOC-E-2026-1', 'ticket_type=adhoc', 'quest_start=2026-10-04', 'title=MLPS arkib hari ini', '',
  'qa=ADHOC-A-2026-1', 'ticket_type=adhoc', 'quest_start=2026-10-04', 'title=stale archived copy', '',
  'qa=ADHOC-F-2026-1', 'ticket_type=ADHOC', 'quest_start=2026-10-04T09:15:00', 'title=PT huruf besar dan masa', ''].join('\n'));

function run(date) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'adhoc-titles.js'), '--date', date, '--root', tmp, '--json'], { encoding: 'utf8' });
  return { code: r.status, out: JSON.parse(r.stdout || '{"rows":[]}') };
}
let fail = 0;
function check(name, ok) { console.log((ok ? 'PASS  ' : 'FAIL  ') + name); if (!ok) fail++; }

const a = run('2026-10-04');
const ids = a.out.rows.map(r => r.id);
check('new adhoc of the day listed', ids.includes('ADHOC-A-2026-1'));
check('archived adhoc of the day listed', ids.includes('ADHOC-E-2026-1'));
check('older adhoc with a doc touched today listed as continued', (a.out.rows.find(r => r.id === 'ADHOC-C-2026-1') || {}).how === 'continued');
check('non-adhoc ticket not listed', !ids.includes('QA-111'));
check('adhoc of another day not listed', !ids.includes('ADHOC-D-2026-1'));
check('missing title makes exit 1', a.code === 1);
check('same id in active and archive listed once, active copy wins', a.out.rows.filter(r => r.id === 'ADHOC-A-2026-1').length === 1 && a.out.rows.find(r => r.id === 'ADHOC-A-2026-1').title === 'PLPS SKM tiada dalam senarai');
check('CRLF file still parsed', a.out.rows.length >= 4);
check('upper-case ticket_type and a start with a time still match', ids.includes('ADHOC-F-2026-1'));
const bad = spawnSync(process.execPath, [path.join(__dirname, 'adhoc-titles.js'), '--date', '04-10-2026', '--root', tmp], { encoding: 'utf8' });
check('wrong date shape exits 2', bad.status === 2);
const none = spawnSync(process.execPath, [path.join(__dirname, 'adhoc-titles.js'), '--date', '2026-10-04', '--root', path.join(tmp, 'nowhere')], { encoding: 'utf8' });
check('missing quest files exit 0 with the empty line', none.status === 0 && /no adhoc worked/.test(none.stdout));
const b = run('2026-09-02');
check('day with only titled adhocs exits 0', b.code === 0 && b.out.rows.length === 1);
const c = run('2026-01-01');
check('empty day exits 0 with no rows', c.code === 0 && c.out.rows.length === 0);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('adhoc-titles.eval: ' + (13 - fail) + '/13');
process.exit(fail ? 1 : 0);
