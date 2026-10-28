#!/usr/bin/env node
// clean-words.eval.js — pins lib/clean-words.js (word list + memory path test).
'use strict';
const { findSwears, isMemoryPath } = require('./clean-words.js');
const F = 'fu' + 'ck', S = 'sh' + 'it';
const results = [];
function check(n, c) { results.push({ n, pass: !!c }); }
check('C1 finds a swear word with its line', findSwears('ok\nwhat the ' + F).length === 1 && findSwears('ok\nwhat the ' + F)[0].line === 2);
check('C2 upper case is found', findSwears(F.toUpperCase() + 'ING').length === 1);
check('C3 "damning" is clean', findSwears('the evidence was damning').length === 0);
check('C4 clean text has no hits', findSwears('what is this reply? (frustrated)').length === 0);
check('C5 ' + S + ' is found', findSwears('did ' + S).length === 1);
check('C6 diary path is memory', isMemoryPath('C:\\repo\\daily-diary\\current\\2026-10-28.md'));
check('C7 main/ file is memory', isMemoryPath('C:/repo/main/main-memory.md'));
check('C8 auto-memory note is memory', isMemoryPath('C:/repo/.claude/auto-memory/feedback_x.md'));
check('C9 domain/<file> is not memory', !isMemoryPath('C:/repo/domain/notes.md'));
check('C10 a skill file is not memory', !isMemoryPath('C:/repo/.claude/skills/x/SKILL.md'));
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n); }
console.log('\nclean-words.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
