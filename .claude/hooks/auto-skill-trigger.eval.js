#!/usr/bin/env node
// auto-skill-trigger.eval — fire check (exit 0 + the routing text rendered) and silence on neutral prompts.
// node .claude/hooks/auto-skill-trigger.eval.js
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const hook = path.join(__dirname, 'auto-skill-trigger.js');
const cases = [
  // his phrases of 2026-11-05
  ['fire', 'This is unacceptable, the note is wrong again'],
  ['fire', "I thought I've asked you to use the generator"],
  ['fire', 'I thought I asked you to load the format'],
  ['fire', 'why is the quest skill not loaded for this ticket?'],
  ['fire', 'why are the alter rules not loaded'],
  // older patterns still fire
  ['fire', 'you forgot the User ID line'],
  ['fire', 'I already told you to generate it'],
  // neutral prompts stay silent
  ['silent', 'please list my tickets for today'],
  ['silent', 'the note looks good, post it after I check'],
  ['silent', 'is the quest skill loaded?'],
  ['silent', 'acceptable, go ahead'],
];
let pass = 0;
for (const [want, prompt] of cases) {
  const r = spawnSync(process.execPath, [hook], { input: JSON.stringify({ prompt }), encoding: 'utf8' });
  const got = /auto-skill-trigger fired/.test(r.stdout) && /auto-skill-on-mistake/.test(r.stdout) ? 'fire' : 'silent';
  const ok = got === want && r.status === 0;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  want=${want} got=${got} exit=${r.status} :: ${prompt}`);
}
const r = spawnSync(process.execPath, [hook], { input: 'not json', encoding: 'utf8' });
const okBad = r.status === 0 && r.stdout === '';
if (okBad) pass++;
console.log(`${okBad ? 'PASS' : 'FAIL'}  bad JSON stdin -> silent exit 0`);
const total = cases.length + 1;
console.log(`\nauto-skill-trigger.eval: ${pass}/${total} ${pass === total ? 'green' : 'RED'}`);
process.exit(pass === total ? 0 : 1);
