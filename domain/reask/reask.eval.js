#!/usr/bin/env node
// reask.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: みや says 'why are you rambling? answer in one sentence' → hook fires with category=reask/rambling+reask/verbose
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'reask.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

function runHook(prompt) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ prompt }),
    encoding: 'utf8',
    timeout: 30000,
    env: process.env,
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function firedWithCategory(prompt, expectedCat) {
  const r = runHook(prompt);
  const combined = r.stdout + r.stderr;
  return r.status === 0 && combined.includes('reask-detect') && combined.includes(expectedCat);
}

function silent(prompt) {
  const r = runHook(prompt);
  return r.status === 0 && !r.stdout.includes('reask-detect') && !r.stderr.includes('reask-detect');
}

// F1: clean input (empty prompt) → no fire, no block
let r1 = runHook('');
check('F1 empty prompt exits 0, no fire', r1.status === 0 && !r1.stdout.includes('reask-detect'), 'exit=' + r1.status);

// F2: canonical replay-case (compound trigger)
check('F2 replay: rambling + verbose combined',
  firedWithCategory("why are you rambling? answer in one sentence", 'reask/rambling'),
  'canonical fixture');

// F3-F8: one per category
check('F3 verbose',        firedWithCategory('Answer in one sentence: what is X?',            'reask/verbose'),        'verbose category');
check('F4 rambling',       firedWithCategory("why are you rambling? Just tell me.",          'reask/rambling'),       'rambling category');
check('F5 hallucination',  firedWithCategory("that's a hallucination, you're making that up", 'reask/hallucination'),  'hallucination category');
check('F6 buried-answer',  firedWithCategory("you didn't answer my question",                'reask/buried-answer'),  'buried-answer category');
check('F7 redundant',      firedWithCategory('I already told you this yesterday',            'reask/redundant'),      'redundant category');
check('F8 rephrase-check', firedWithCategory('wait so is it because of the header?',         'reask/rephrase-check'), 'rephrase-check category');

// F9-F10: clean prompts must be silent (no false positive)
check('F9 clean-1 no fire',  silent("let's continue with the fix on QA-270052"), 'clean quest continuation');
check('F10 clean-2 no fire', silent('proceed with candidate 3'),                 'clean approval');

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nreask.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
