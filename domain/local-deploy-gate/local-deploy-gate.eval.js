#!/usr/bin/env node
// local-deploy-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-07-24 SECOND occurrence, ~2h lost: DEV-TESTING-HACKS.md already documented this exact error and explicitly banned suggesting Maven Update/Clean/republish - it was not consulted and all three were suggested
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'local-deploy-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// Helper: run the hook with a prompt, report whether it fired.
function fire(prompt) {
  const rr = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ prompt }), encoding: 'utf8', timeout: 30000, env: process.env,
  });
  return /local-deploy-gate/.test((rr.stdout || '') + (rr.stderr || ''));
}

// --- MUST FIRE: verbatim signatures from the 2026-07-24 outage ---
check('F2 replay: hibernate CNFE verbatim',
  fire('Caused by: java.lang.ClassNotFoundException: org.hibernate.HibernateException'), 'did not fire');
check('F3 replay: spring CNFE sibling signature',
  fire('ClassNotFoundException: org.springframework.web.context.support.HttpRequestHandlerServlet'), 'did not fire');
check('F4 replay: POST_MODULE phase failure',
  fire('WFLYSRV0153: Failed to process phase POST_MODULE of deployment etanah-awam.war'), 'did not fire');

// --- MUST FIRE: plain language, the way みや actually reported it that night ---
check('F5 replay: "cannot start my local server"',
  fire('I want to continue debugging why I cannot start my local server, there is still an issue'), 'did not fire');
check('F6 replay: "THE SAME ISSUE IS HAPPENING"',
  fire('THE SAME FUCKING ISSUE IS HAPPENING, the war deployment failed again'), 'did not fire');
check('F7 plain: jboss not deploying',
  fire('jboss is not deploying the war, what is the problem'), 'did not fire');

// --- MUST NOT FIRE: unrelated work (false-positive guard) ---
check('F8 no-fire: quest work',
  !fire('lets start QA-271985, run the verify SELECTs first'), 'false positive');
check('F9 no-fire: deploy mentioned without failure',
  !fire('after we deploy to stag please update the release sheet'), 'false positive');
check('F10 no-fire: generic SQL error, no server context',
  !fire('there is an error in the SQL script you gave me'), 'false positive');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nlocal-deploy-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
