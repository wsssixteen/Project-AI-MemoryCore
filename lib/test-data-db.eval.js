#!/usr/bin/env node
// test-data-db.eval.js — battery-enumerated fixtures (Rule 6: fire + effect).
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const S = path.join(__dirname, 'test-data-db.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d: d || '' }); }
function run(args) { return spawnSync(process.execPath, [S].concat(args), { encoding: 'utf8', timeout: 30000 }); }

// T1: build green, >= 10 entries
let r = run(['build']);
check('T1 build >= 10 entries', r.status === 0 && /test-data index: \d+ entries/.test(r.stdout), (r.stdout || '').trim().slice(0, 60));

// T2: urusan lookup hits PPTPB, and R1 live-state rule leads the output
r = run(['PPTPB']);
check('T2 PPTPB hit + live-state rule first', /RULE 1[\s\S]*LIVE TASK STATE/.test(r.stdout) && /PPTPB/.test(r.stdout), '');

// T3: R5 mlit caveat present in every lookup
check('T3 mlit stale-snapshot caveat', /mlit = stale test-DB snapshot/.test(r.stdout));

// T4: No-Resit section reachable by free text, flagged AWAM where applicable
r = run(['no resit carian rasmi PSBS receipt']);
check('T4 No-Resit lookup hits', /[Rr]esit/.test(r.stdout) && !/0 hits/.test(r.stdout), (r.stdout || '').slice(0, 80));

// T5: nonsense stays quiet (0 hits) but still prints the live-state rule (never a bare empty)
r = run(['zzqq gibberish nothing']);
check('T5 nonsense -> 0 hits + rule still shown', /0 hits/.test(r.stdout) && /LIVE TASK STATE/.test(r.stdout));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ntest-data-db.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
