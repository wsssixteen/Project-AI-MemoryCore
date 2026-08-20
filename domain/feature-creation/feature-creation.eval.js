#!/usr/bin/env node
// feature-creation.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-08-19 miya: "create/update/refine FEATURE should be a keyword phrase
// to invoke proper feature creation"
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'feature-creation.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function run(stdin) {
  return spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env });
}

// F1: clean input → must NOT block (exit 0), no injection
let r = run('{}');
check('F1 clean input exits 0, silent', r.status === 0 && !(r.stdout || '').includes('feature-creation keyword'), 'exit=' + r.status);

// F2: replay case — "create this feature" fires + injects the pipeline naming both skills
r = run(JSON.stringify({ prompt: 'Please create this feature ("create/update/refine FEATURE" should be a keyword phrase)' }));
check('F2 replay fires + pipeline injected', r.status === 0 && r.stdout.includes('system-rules') && r.stdout.includes('system-design') && r.stdout.includes('forge'), 'stdout=' + (r.stdout || '').slice(0, 80));

// F3: "refine the template-cc-preflight feature" fires
r = run(JSON.stringify({ prompt: 'refine the template-cc-preflight feature please' }));
check('F3 refine-verb fires', r.status === 0 && r.stdout.includes('forge'), 'stdout=' + (r.stdout || '').slice(0, 60));

// F4: NEGATIVE — feature mentioned without a create/update/refine verb adjacent → silent
r = run(JSON.stringify({ prompt: 'the feature papar blank di skrin teknikal, tolong check' }));
check('F4 no-verb mention stays silent', r.status === 0 && !(r.stdout || '').includes('pipeline'), 'stdout=' + (r.stdout || '').slice(0, 60));

// F5: NEGATIVE — "update" separated by punctuation → silent
r = run(JSON.stringify({ prompt: 'update: the feature is still broken on staging' }));
check('F5 punctuation-separated verb stays silent', r.status === 0 && !(r.stdout || '').includes('pipeline'), 'stdout=' + (r.stdout || '').slice(0, 60));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nfeature-creation.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
