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

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nbug-db.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
