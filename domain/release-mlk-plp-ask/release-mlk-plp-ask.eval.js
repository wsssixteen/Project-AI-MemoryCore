#!/usr/bin/env node
// release-mlk-plp-ask.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: miya pastes Planned Release Melaka - Deploy Pelupusan 1.0.9 message with ticket list
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'release-mlk-plp-ask.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function run(prompt) {
  return spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000, env: process.env });
}

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2 REPLAY: pasted BAQA release message → fires with skill advisory
r = run('Planned Release Melaka: 16/7/2026\nTask : Deploy Pelupusan 1.0.9\n1. Internal Issue #269802 - Verified IT');
check('F2 replay: BAQA release message fires', r.status === 0 && /release-mlk-plp/.test(r.stdout), 'stdout=' + r.stdout.slice(0, 60));

// F3: "prepare a deployment release branch" → fires
r = run('Can you prepare a deployment release branch for 1.0.9?');
check('F3 prepare-release ask fires', /release-mlk-plp/.test(r.stdout), 'stdout=' + r.stdout.slice(0, 60));

// F4: unrelated prompt → silent
r = run('fix the cop PDT missing on borang 4Ce');
check('F4 unrelated prompt silent', r.status === 0 && r.stdout.trim() === '', 'stdout=' + r.stdout.slice(0, 60));

// F5: "release notes" chatter → negative guard keeps it silent
r = run('can you write the release notes for last sprint');
check('F5 release-notes chatter silent', r.status === 0 && r.stdout.trim() === '', 'stdout=' + r.stdout.slice(0, 60));

// F6: "Baseline" — みや's company term for this workflow (added 2026-07-16) → fires
r = run('let us start the Baseline for 1.0.10');
check('F6 "baseline" fires', /release-mlk-plp/.test(r.stdout), 'stdout=' + r.stdout.slice(0, 60));

// F7 REPLAY 2026-11-12: Perak BAQA release message → no Melaka pipeline, Perak main branch = master
r = run('Planned Release PERAK : 12/11/2026\nTask : Deploy Pelupusan 1.75.7\nBaseline Pelupusan');
check('F7 Perak release: no Melaka pipeline, main branch master', /perak/.test(r.stdout) && /does NOT apply/.test(r.stdout) && /= master\b/.test(r.stdout) && !/Invoke the `release-mlk-plp` skill/.test(r.stdout), 'stdout=' + r.stdout.slice(0, 160));

// F8: Selangor release → sgr/master
r = run('prepare the Selangor release branch for 1.75.0');
check('F8 Selangor release: main branch sgr/master', /selangor/.test(r.stdout) && /sgr\/master/.test(r.stdout), 'stdout=' + r.stdout.slice(0, 160));

// F9: Melaka named → unchanged Melaka advisory
r = run('Planned Release Melaka: deploy pelupusan 1.9.4');
check('F9 Melaka release keeps the pipeline advisory', /Invoke the `release-mlk-plp` skill/.test(r.stdout) && !/does NOT apply/.test(r.stdout), 'stdout=' + r.stdout.slice(0, 160));

// F10: lowercase Perak branch code → Perak line
r = run('create the release branch from prk/esokongan/288276');
check('F10 lowercase prk branch reads as Perak', /perak/.test(r.stdout) && /= master\b/.test(r.stdout), 'stdout=' + r.stdout.slice(0, 160));

// F11: Melaka and Perak both named → Melaka advisory stays (no wrong redirect)
r = run('Planned Release Melaka, after the Perak one: deploy pelupusan 1.9.4');
check('F11 both states named keeps the Melaka advisory', /Invoke the `release-mlk-plp` skill/.test(r.stdout), 'stdout=' + r.stdout.slice(0, 160));

// F12: lowercase "kl" inside a word or sentence does not read as WP
r = run('prepare the release branch, check the klinik urusan');
check('F12 lowercase kl is not WP', !/this release is wp/.test(r.stdout), 'stdout=' + r.stdout.slice(0, 160));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nrelease-mlk-plp-ask.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
