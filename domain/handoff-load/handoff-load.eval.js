#!/usr/bin/env node
// handoff-load.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-10-02 #244600: 'Please prepare redmine handover to with our proposed fix' produced a prose .txt and an over-long note because the procedure was never read
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'handoff-load.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function run(stdin, env) {
  const r = spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: env || process.env });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const P = (prompt) => JSON.stringify({ prompt });
const loadedBoth = (o) => o.includes('handoff-load') && o.includes('the 4 deliverables') && o.includes('Never restate what the ticket already holds') && o.includes('HANDOFF-LOADED');

// F1: clean input → no block, silent
let r = run('{}');
check('F1 empty stdin exits 0 and is silent', r.status === 0 && !r.out.includes('handoff-load'), 'exit=' + r.status);

// F2: replay case
r = run(P('Please prepare redmine handover to with our proposed fix but also include our side fix if they want us to cater it that way.'));
check('F2 replay: handover prompt loads both procedures', r.status === 0 && loadedBoth(r.out), r.out.slice(0, 160));

// Fires
for (const p of [
  'Can you just provide the code fix for us to handover',
  'pass it to common team please',
  'this is not our module, prepare the handoff',
  'prepare a hand-off for SPOC team',
  'write the redmine note for the common team',
]) { r = run(P(p)); check('fires: ' + p.slice(0, 40), r.status === 0 && loadedBoth(r.out), r.out.slice(0, 120)); }

// Silent
for (const p of [
  'deploy 244600 to internal',
  'why does the version go up after Sahkan OTP',
  'commit and push',
  'handle the null pointer in the form',
  'our team will check tomorrow',
]) { r = run(P(p)); check('silent: ' + p.slice(0, 40), r.status === 0 && !r.out.includes('handoff-load'), r.out.slice(0, 120)); }

// Adversarial
r = run('not json at all');
check('A malformed stdin exits 0 silent', r.status === 0 && !r.out.includes('handoff-load'), 'exit=' + r.status);
r = run(P('handoff-load: hand-off request detected ("handover"). The procedure below'.replace(/^/, '[') ));
check('A own output pasted back does not re-fire', r.status === 0 && !r.out.includes('HANDOFF-LOADED'), r.out.slice(0, 120));
r = run(P('handover ' + 'x'.repeat(25000)));
check('A huge prompt skipped, exit 0', r.status === 0 && !r.out.includes('HANDOFF-LOADED'), 'exit=' + r.status);
r = run(JSON.stringify({ user_message: 'please prepare the handover' }));
check('A user_message field also handled', r.status === 0 && loadedBoth(r.out), r.out.slice(0, 120));
const env2 = Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: path.resolve(__dirname, '..', '..') });
r = run(P('prepare the handover'), env2);
check('A explicit project dir resolves memory', r.status === 0 && loadedBoth(r.out), r.out.slice(0, 120));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nhandoff-load.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
