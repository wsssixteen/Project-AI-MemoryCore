#!/usr/bin/env node
// change-card.eval.js — fixture eval for the What/Why/How/When/Where card checker.
// Replay: 2026-11-05 miya asked for a five-line card before and after every system change.
'use strict';
const os = require('os');
const path = require('path');
process.env.CHANGE_CARD_LOG = path.join(os.tmpdir(), 'change-card-eval-log.jsonl');
const { check } = require('./change-card.js');

let pass = 0, fail = 0;
function ok(name, cond, detail) { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); } }

const GOOD = [
  '## Change card (before)',
  '- What: A new skill shows every system change as five one-sentence lines.',
  '- Why: He reviews a change faster when each answer is one sentence.',
  '- How: The skill fills the five lines, then draws the flow and the change map.',
  '  ![flow](change-card-flow.png)',
  '- When: It runs at change route step 3 before the nod and again at step 8.',
  '- Where: It lives in `domain/change-card/` with its skill in `.claude/skills/change-card/`.',
  '  ![where](change-map.png)',
  '',
  'Where picture = the change map (lib/change-map.js).',
].join('\n');

let r = check(GOOD, 'before');
ok('E1 good card passes', r.pass, r.reasons.join(' · '));

r = check(GOOD.replace('- When: It runs at change route step 3 before the nod and again at step 8.\n', ''), null);
ok('E2 missing When fails', !r.pass && r.reasons.some(x => /When: missing/.test(x)));

r = check(GOOD.replace('five one-sentence lines.', 'five lines. Each is one sentence.'), null);
ok('E3 two sentences in What fails', !r.pass && r.reasons.some(x => /What: not one sentence/.test(x)));

r = check(GOOD.replace('  ![flow](change-card-flow.png)\n', ''), null);
ok('E4 How without a picture fails', !r.pass && r.reasons.some(x => /How: no flow picture/.test(x)));

r = check(GOOD.replace('  ![where](change-map.png)\n', ''), null);
ok('E5 Where without the change map fails', !r.pass && r.reasons.some(x => /Where: no change map/.test(x)));

r = check(GOOD.replace('Where picture = the change map (lib/change-map.js).', ''), null);
ok('E6 missing closing name line fails', !r.pass && r.reasons.some(x => /closing line missing/.test(x)));

r = check(GOOD.replace('one sentence.', 'one sentence; it is short.'), null);
ok('E7 semicolon fails', !r.pass && r.reasons.some(x => /semicolon/.test(x)));

r = check(GOOD, 'after');
ok('E8 stage word after missing fails', !r.pass && r.reasons.some(x => /stage word "after"/.test(x)));

const TABLE = [
  '| Q | Answer |', '|---|---|',
  '| What | A new skill shows every system change as five one-sentence lines. |',
  '| Why | He reviews a change faster when each answer is one sentence. |',
  '| How | The skill fills the five lines, then draws the flow. ![flow](f.png) |',
  '| When | It runs at change route step 3 and again at step 8. |',
  '| Where | It lives in `domain/change-card/`. ![where](change-map.png) |',
  'Where picture = the change map (lib/change-map.js). Card after the build.',
].join('\n');
r = check(TABLE, 'after');
ok('E9 table form passes', r.pass, r.reasons.join(' · '));

r = check(GOOD.replace('`domain/change-card/`', 'domain/change-card/README.md'), 'before');
ok('E10 a file name dot is not a sentence end', r.pass, r.reasons.join(' · '));

const SESSION = [
  'STEP-3: something', 'session: x', '',
  GOOD.replace('## Change card (before)', 'CHANGE-CARD (before): old').replace('one-sentence lines.', 'lines. Two sentences.'), '',
  'More notes here.', '',
  GOOD.replace('## Change card (before)', 'CHANGE-CARD (before): new'), '',
  'Later text.',
].join('\n');
r = check(SESSION, 'before');
ok('E11 session file: the LAST before block is checked', r.pass, r.reasons.join(' · '));

r = check(SESSION, 'after');
ok('E12 session file with no after block fails on stage', !r.pass);

r = check(GOOD.replace(/\n/g, '\r\n'), 'before');
ok('E13 Windows line ends pass', r.pass, r.reasons.join(' · '));

r = check('', null);
ok('E14 empty input fails on every line', !r.pass && r.reasons.length >= 5);

r = check(GOOD.replace('- What:', '- **What**:').replace('- Why:', '**Why:**'), 'before');
ok('E15 bold labels pass', r.pass, r.reasons.join(' · '));

r = check(GOOD.replace('one sentence.', 'one sentence in 0.1 s.'), 'before');
ok('E16 a decimal number is not a sentence end', r.pass, r.reasons.join(' · '));

r = check(GOOD.replace('Where picture = the change map (lib/change-map.js).', 'The change map is the Where picture.'), 'before');
ok('E17 a reworded closing line fails (exact name line required)', !r.pass);

const BEFORE_BLOCK = GOOD.replace('## Change card (before)', 'CHANGE-CARD (before): x');
const AFTER_COPY = BEFORE_BLOCK.replace('CHANGE-CARD (before): x', 'CHANGE-CARD (after): x');
r = check(BEFORE_BLOCK + '\n\n' + AFTER_COPY, 'after');
ok('E18 AFTER card copied word for word from BEFORE fails', !r.pass && r.reasons.some(x => /word-for-word copy/.test(x)), r.reasons.join(' · '));

const AFTER_REAL = AFTER_COPY.replace('- When: It runs at change route step 3 before the nod and again at step 8.', '- When: It ran at step 3 of this change and again at step 8 after landing.');
r = check(BEFORE_BLOCK + '\n\n' + AFTER_REAL, 'after');
ok('E19 AFTER card rewritten from what landed passes', r.pass, r.reasons.join(' · '));

console.log(`change-card eval: ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
