#!/usr/bin/env node
// bug-db.eval.js — fixtures for the bug-db trinity (builder + lookup + injection hook).
// Battery-enumerated. Fire check + effect check per system-design Rule 6 v1.2.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const DIR = __dirname;
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d: d || '' }); }
function runHook(prompt) {
  return spawnSync(process.execPath, [path.join(DIR, 'bug-db.check.hook.js')], {
    input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000, env: process.env,
  });
}

// B1: builder runs green and the index exists with >= 15 rows
const b = spawnSync(process.execPath, [path.join(DIR, 'build-index.js')], { encoding: 'utf8', timeout: 30000 });
const INDEX = require(path.join(DIR, 'lookup.js')).INDEX;
let rowCount = 0; try { rowCount = fs.readFileSync(INDEX, 'utf8').trim().split('\n').length; } catch (_) {}
check('B1 builder green, index >= 15 rows', b.status === 0 && rowCount >= 15, 'exit=' + b.status + ' rows=' + rowCount);

// B2: lookup finds the known pattern by its exception name
const { lookup } = require(path.join(DIR, 'lookup.js'));
const h1 = lookup('NonUniqueResultException findJabatanTeknikalByAplikasiAndAgensi');
check('B2 lookup exact-pattern hit', h1.length >= 1 && /NonUniqueResultException/.test(h1[0].title), 'hits=' + h1.length);

// B3: lookup returns zero on unrelated text (no noise injection)
check('B3 lookup zero-noise', lookup('completely unrelated gibberish zzz').length === 0);

// B4: hook FIRES on a ticket prompt with a known symptom — effect check: context reaches stdout
let r = runHook('BA reports #260302 again: NonUniqueResultException findJabatanTeknikalByAplikasiAndAgensi on Simpan');
check('B4 hook injects on ticket+symptom', r.status === 0 && /bug-db: \d similar/.test(r.stdout) && /NonUniqueResultException/.test(r.stdout), 'out=' + (r.stdout || '').slice(0, 80));

// B5: hook SILENT when no ticket number in prompt (narrow trigger)
r = runHook('NonUniqueResultException appeared somewhere, thoughts?');
check('B5 silent without ticket number', r.status === 0 && !(r.stdout || '').trim());

// B6: hook SILENT on ticket number with no matching symptom (no-hits pass-through)
r = runHook('please retrieve ticket #999999 about qqzzqq');
check('B6 silent on no-hits', r.status === 0 && !(r.stdout || '').trim());

// ── 2026-10-03 (Terengganu support): the hook scores against the TICKET's state index (sandboxed knowledge root) ──
const os = require('os');
const sand = fs.mkdtempSync(path.join(os.tmpdir(), 'bug-db-'));
const ACT = path.join(sand, 'active.txt');
fs.mkdirSync(path.join(sand, 'melaka'), { recursive: true });
fs.mkdirSync(path.join(sand, 'terengganu'), { recursive: true });
fs.writeFileSync(path.join(sand, 'melaka', 'bug-db-index.jsonl'), JSON.stringify({ title: 'MLK fixture pattern', source: 'BUG-BESTIARY.md#mlk', tickets: ['111111'], keywords: [], summary: 's' }) + '\n');
fs.writeFileSync(ACT, '');
function runSand(prompt) {
  const env = Object.assign({}, process.env, { KNOWLEDGE_ROOT: sand, BUG_DB_ACTIVE_TXT: ACT });
  delete env.ETANAH_STATE;
  return spawnSync(process.execPath, [path.join(DIR, 'bug-db.check.hook.js')], { input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000, env });
}
// B7: no state information → reference index, output text as before
r = runSand('BA reports #111111 again');
check('B7 no state info keeps the reference index + path', /etanah-knowledge\/melaka\/BUG-BESTIARY\.md#mlk · matched: #111111/.test(r.stdout) && /build-index\.js\)\n$/.test(r.stdout), 'out=' + (r.stdout || '').slice(0, 200));
// B8: Melaka id in the prompt → same Melaka output
const mlkOut = r.stdout;
r = runSand('BA reports #111111 again PTMLK/02/L/PT/2026/1');
check('B8 Melaka prompt output identical to the no-state output', r.stdout === mlkOut && !!mlkOut, 'out=' + (r.stdout || '').slice(0, 200));
// B9: Terengganu id in the prompt, Terengganu has NO index → SILENT (the Melaka hit is not presented)
r = runSand('BA reports #111111 again PTTRG/07/01/L/PLPS/2026/135');
check('B9 Terengganu prompt + no TRG index is SILENT', r.status === 0 && !(r.stdout || '').trim(), 'out=' + (r.stdout || '').slice(0, 120));
// B10: bare ticket number whose active.txt block says state=Terengganu → SILENT too
fs.writeFileSync(ACT, 'qa=QA-111111\nstatus=active\nstate=Terengganu\n');
r = runSand('start 111111');
check('B10 bare TRG ticket (active.txt block) + no TRG index is SILENT', r.status === 0 && !(r.stdout || '').trim(), 'out=' + (r.stdout || '').slice(0, 120));
// B11: Terengganu index exists → its hit, its path, its rebuild hint; never the Melaka row
fs.writeFileSync(path.join(sand, 'terengganu', 'bug-db-index.jsonl'), JSON.stringify({ title: 'TRG fixture pattern', source: 'BUG-BESTIARY.md#trg', tickets: ['111111'], keywords: [], summary: 's' }) + '\n');
r = runSand('start 111111');
check('B11 TRG ticket hits the TRG index + TRG path', /TRG fixture pattern/.test(r.stdout) && /etanah-knowledge\/terengganu\/BUG-BESTIARY\.md#trg/.test(r.stdout) && /build-index\.js --state terengganu\)/.test(r.stdout) && !/MLK fixture|knowledge\/melaka/.test(r.stdout), 'out=' + (r.stdout || '').slice(0, 200));
// B12: the block's state outranks a Melaka id quoted in the prompt
r = runSand('start 111111, same shape as PTMLK/02/L/PT/2026/1');
check('B12 block state outranks a quoted foreign id', /TRG fixture pattern/.test(r.stdout) && !/MLK fixture/.test(r.stdout), 'out=' + (r.stdout || '').slice(0, 200));
// B13: a ticket with no block and no id still gets the reference index even though a TRG index exists
fs.writeFileSync(ACT, '');
r = runSand('BA reports #111111 again');
check('B13 unresolved prompt still reads the reference index', /MLK fixture pattern/.test(r.stdout) && !/TRG fixture/.test(r.stdout), 'out=' + (r.stdout || '').slice(0, 200));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nbug-db.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
