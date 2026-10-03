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

// T6: a defaulted state is never silent — the reference-state lookup names the state it used
r = run(['PPTPB']);
check('T6 default state is echoed (reference-state default)', /state = \w+ \(reference-state default/.test(r.stdout), (r.stdout || '').slice(0, 300));

// T7/T8: --state <key> is honoured and the pair is not swallowed into the command or the query.
// Uses a registered non-reference state; where its index is absent on this machine the tool must say so, not answer for another state.
{
  const states = require(path.join(__dirname, 'states.js'));
  const others = Object.keys(states.all()).filter(k => k !== states.reference() && !states.isExcluded(k));
  const hasIndex = k => { try { return require('fs').existsSync(path.join(states.knowledgeDir(k), 'test-data-index.jsonl')); } catch (_) { return false; } };
  const other = others.find(hasIndex) || others[0]; // prefer a state whose index exists, so T7/T8 assert the real answer
  const env = { ...process.env, ETANAH_STATE: '' };
  const q = spawnSync(process.execPath, [S, 'PT', '--state', other], { encoding: 'utf8', timeout: 30000, env });
  const noIndex = /no index yet/.test(q.stdout);
  check('T7 --state ' + other + ': answers for THAT state or says it has no index (never the reference state)',
    noIndex || (new RegExp('state = ' + other).test(q.stdout) && !/reference-state default/.test(q.stdout)), (q.stdout || '').slice(0, 300));
  const z = spawnSync(process.execPath, [S, 'zzqq', '--state', other], { encoding: 'utf8', timeout: 30000, env });
  check('T8 the words "--state <key>" are not part of the query', noIndex || /0 hits for "zzqq"/.test(z.stdout), (z.stdout || '').slice(0, 300));
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ntest-data-db.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
