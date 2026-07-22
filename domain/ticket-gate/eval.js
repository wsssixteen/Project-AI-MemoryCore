#!/usr/bin/env node
// domain/ticket-gate/eval.js — pin for .claude/hooks/ticket-gate.js (added 2026-07-13 with the
// bare-number refine: the CLAUDE.md trigger table promised bare-number injection; now the hook delivers).
// Uses TICKET_GATE_ACTIVE_TXT override so fixtures never touch the real quest/active.txt.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const HOOK = path.join(ROOT, '.claude', 'hooks', 'ticket-gate.js');
const REAL_ACTIVE = path.join(ROOT, 'quest', 'active.txt');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ticket-gate-eval-'));
const FIXTURE = path.join(TMP, 'active.txt');
fs.writeFileSync(FIXTURE,
  'active:\n\nqa=QA-90001\nstatus=hold\nphase=0\n' +
  '\nqa=90002\nstatus=hold\nphase=0\n' +
  // 90003 = AWAM no-resit urusan (the #271721 shape) · 90004 = non-no-resit urusan
  '\nqa=90003\nstatus=hold\nphase=0\nurusan=PRBB\nissue_one_liner=Pelupusan - PRBB - Tidak Papar Ratusan\n' +
  '\nqa=90004\nstatus=hold\nphase=0\nurusan=PRZ\nissue_one_liner=PRZ - Bil Mesyuarat\n');

const realHashBefore = crypto.createHash('sha1').update(fs.readFileSync(REAL_ACTIVE)).digest('hex');

function run(prompt) {
  return spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000,
    env: { ...process.env, TICKET_GATE_ACTIVE_TXT: FIXTURE, CLAUDE_PROJECT_DIR: ROOT },
  });
}
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1 prefixed mention fires
let r = run('QA 90001 please');
check('F1 prefixed mention fires QUEST GATE', /QUEST GATE/.test(r.stdout), (r.stdout || '').slice(0, 80));

// F2 BARE number cross-matching an active.txt block fires (the 2026-07-13 refine)
r = run('lets start with 90002');
check('F2 bare number fires (cross-matched to qa=90002)', /QUEST GATE/.test(r.stdout), (r.stdout || '').slice(0, 80));
check('F2 exit 0', r.status === 0, 'exit=' + r.status);

// F3 bare number NOT in active.txt stays silent
r = run('the number 90009 means nothing');
check('F3 unknown bare number silent', r.status === 0 && !(r.stdout || '').trim(), (r.stdout || '').slice(0, 60));

// F4 no signal stays silent
r = run('good morning, how are we doing');
check('F4 no signal silent', r.status === 0 && !(r.stdout || '').trim(), '');

// F6 AWAM no-resit urusan (PRBB) injects row 7 — the #271721 replay
r = run('lets start with 90003');
check('F6 PRBB injects the No-Resit row 7', /7\. ⬜ .*No-Resit urusan detected \(PRBB\)/.test(r.stdout), (r.stdout || '').slice(0, 120));
check('F6 row names the derive method + notes.js', /TEST-PERMOHONAN-INDEX/.test(r.stdout) && /notes\.js/.test(r.stdout), '');
check('F6 row warns module is etanah-awam', /etanah-awam/.test(r.stdout), '');
// The row must NOT assert AWAM as fact — a no-resit urusan can be a staff-side ticket.
check('F6 row makes みや settle AWAM-vs-APPS first', /Which side is this ticket/.test(r.stdout), '');
check('F6 row offers a staff-side N/A escape hatch', /N\/A — staff-side/.test(r.stdout), '');
check('F6 closing line extends to rows 0-6+7', /rows 0-6\+7/.test(r.stdout), '');

// F7 non-no-resit urusan (PRZ) must NOT get the row — no false injection
r = run('lets start with 90004');
check('F7 PRZ does NOT inject the No-Resit row', /QUEST GATE/.test(r.stdout) && !/No-Resit urusan detected/.test(r.stdout), (r.stdout || '').slice(0, 120));
check('F7 PRZ closing line stays rows 0-6', /rows 0-6 are/.test(r.stdout), '');

// F8 word-boundary: PRZ must not match inside PRBB and vice versa
r = run('QA 90001 please');
check('F8 urusan-less block injects nothing', !/No-Resit urusan detected/.test(r.stdout), '');

// F9 🐛 LAST-BLOCK REGRESSION (found live 2026-07-22): the terminator used `\Z`, which JS treats
// as a literal "Z", so the final block in active.txt never matched and ALL its fields read empty.
// 90005 is deliberately the last block in the fixture and carries a no-resit urusan.
// NOTE: must stay phase=0/status=hold — a past-Phase-0 quest exits silently by design (:103).
fs.appendFileSync(FIXTURE, '\nqa=90005\nstatus=hold\nphase=0\nurusan=PSBS\nissue_one_liner=PSBS - last block in file\n');
r = run('lets start with 90005');
check('F9 LAST block parses (status read from the block)', /status=hold/.test(r.stdout), (r.stdout || '').slice(0, 140));
check('F9 LAST block injects the No-Resit row', /No-Resit urusan detected \(PSBS\)/.test(r.stdout), (r.stdout || '').slice(0, 140));

// F10 past-Phase-0 quest stays silent even when it IS a no-resit urusan (no nag after Phase 0)
fs.appendFileSync(FIXTURE, '\nqa=90006\nstatus=active\nphase=1\nurusan=PRBB\nissue_one_liner=PRBB - past phase 0\n');
r = run('lets start with 90006');
check('F10 past-Phase-0 no-resit quest stays silent', r.status === 0 && !(r.stdout || '').trim(), (r.stdout || '').slice(0, 100));

// F5 real active.txt untouched by the whole eval
const realHashAfter = crypto.createHash('sha1').update(fs.readFileSync(REAL_ACTIVE)).digest('hex');
check('F5 real quest/active.txt byte-identical', realHashBefore === realHashAfter, '');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log(`\nticket-gate.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
