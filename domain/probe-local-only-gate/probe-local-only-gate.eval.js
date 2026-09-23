#!/usr/bin/env node
// probe-local-only-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-09-22 #280176: probe commit 3ba0dd4985 merged into the staging + internal env branches, reverted next merge
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'probe-local-only-gate.check.hook.js');
const { decide, repoOf, gitWrites, sourceRef, targetOf } = require(HOOK);
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: replay case — merge of the probe branch while checked out on stag-env → BLOCK (marker supplied)
const MERGE = 'Set-Location "E:\\Dev\\etanah-work\\etanah-pelupusan"; git merge --no-ff mlk/esokongan/280176 -m "Merge #280176 debug probe into stag-env"';
check('F2 replay: merge probe branch into stag-env → BLOCK', decide(MERGE, '', true, 'mlk/stag-env').block === true);
check('F3 same merge, marker-free source → pass', decide(MERGE, '', false, 'mlk/stag-env').block === false);
check('F4 push HEAD:int-env with markers → BLOCK', decide('git -C "E:\\Dev\\etanah-work\\etanah-pelupusan" push origin HEAD:mlk/int-env', '', true, 'x').block === true);
check('F5 push plain ticket branch (no protected target) → pass', decide('git push origin mlk/esokongan/280176', '', true, 'mlk/esokongan/280176').block === false);
check('F6 bypass token in turn → pass', decide(MERGE, '[skip-probe-gate: intentional]', true, 'mlk/stag-env').block === false);
check('F7 non-git command → pass', decide('mvn -o -q compile', '', true, 'mlk/stag-env').block === false);
check('F8 read-only git verb mentioning stag-env → pass', decide('git log origin/mlk/stag-env -5', '', true, 'mlk/stag-env').block === false);
// Rule 12 adversarial: free text that merely mentions a protected branch + the verb must NOT trip (the release gate false positive)
check('F9 node command whose quoted arg mentions the trunk and push → pass', decide('node core/forge.js new check x --signal "a git push into mlk/master is BLOCKED"', '', true, 'main').block === false);
check('F10 slips.js add evidence mentioning merge into mlk/int-env → pass', decide('node core/slips.js add --evidence "merge into mlk/int-env blocked"', '', true, 'main').block === false);
check('F11 merge on a ticket branch (current branch not protected) → pass', decide('git merge origin/mlk/master', '', true, 'mlk/esokongan/280176').block === false);
check('F12 cherry-pick onto mlk/master with markers → BLOCK', decide('git cherry-pick 3ba0dd4985', '', true, 'mlk/master').block === true);
check('F13 rebase onto prk/stag-env with markers → BLOCK', decide('git rebase prk/feature', '', true, 'prk/stag-env').block === true);
check('F14 push to mlk/release/1.6.3 with markers → BLOCK', decide('git push origin HEAD:mlk/release/1.6.3', '', true, 'x').block === true);
check('F15 chained: fetch; merge on stag-env → BLOCK', decide('git fetch origin; git merge --no-ff mlk/esokongan/280176', '', true, 'mlk/stag-env').block === true);
check('F16 bypass token spelled without reason → still BLOCK', decide(MERGE, '[skip-probe-gate:]', true, 'mlk/stag-env').block === true);
check('F17 repoOf picks git -C path', repoOf('git -C "E:\\Dev\\etanah-work\\etanah-pelupusan" merge x') === 'E:\\Dev\\etanah-work\\etanah-pelupusan');
check('F18 gitWrites finds verb after -C', gitWrites('git -C "E:\\x" push origin HEAD:mlk/int-env')[0].verb === 'push');
check('F19 sourceRef merge', sourceRef('merge', ' --no-ff mlk/esokongan/280176 -m "x"') === 'mlk/esokongan/280176');
check('F20 sourceRef push src:dst', sourceRef('push', ' origin mlk/esokongan/280176:mlk/int-env') === 'mlk/esokongan/280176');
check('F21 targetOf push HEAD:dst', targetOf('push', ' origin HEAD:mlk/master') === 'mlk/master');
check('F22 malformed stdin exits 0', spawnSync(process.execPath, [HOOK], { input: '{not json', encoding: 'utf8', timeout: 30000, env: process.env }).status === 0);
check('F23 branch name as substring (mlk/master-ish) → not protected', decide('git push origin HEAD:mlk/master-backup', '', true, 'x').block === false);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + (x.d || ''))); }
console.log('\nprobe-local-only-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
