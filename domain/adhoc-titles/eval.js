#!/usr/bin/env node
// adhoc-titles eval — the skill's behaviour lives in lib/adhoc-titles.js; this runs its fixture eval
// and checks the skill file carries its trigger phrases and its script call. Exit 0 = all pass.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
let fail = 0;
function check(name, ok) { console.log((ok ? 'PASS  ' : 'FAIL  ') + name); if (!ok) fail++; }

const lib = spawnSync(process.execPath, [path.join(ROOT, 'lib', 'adhoc-titles.eval.js')], { encoding: 'utf8' });
process.stdout.write(lib.stdout || '');
check('lib/adhoc-titles.eval.js green', lib.status === 0);

const skill = (() => { try { return fs.readFileSync(path.join(ROOT, '.claude', 'skills', 'adhoc-titles', 'SKILL.md'), 'utf8'); } catch (_) { return ''; } })();
check('skill names the script', /node lib\/adhoc-titles\.js/.test(skill));
for (const phrase of ['adhoc titles', 'protime titles', 'tajuk protime']) check('skill description carries trigger "' + phrase + '"', skill.split('\n').slice(0, 5).join('\n').toLowerCase().includes(phrase));
check('skill carries goal + retention + footprint keys', /^goal: /m.test(skill) && /^retention: /m.test(skill) && /^footprint: /m.test(skill));

console.log('adhoc-titles eval: ' + (6 - fail) + '/6');
process.exit(fail ? 1 : 0);
