#!/usr/bin/env node
// agent-spend-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-07-19: canned deep-research by name spawned 105 agents inheriting session model Fable - 4.08M tokens, monthly spend limit hit mid-verify
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'agent-spend-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2-F7: concrete fixtures. blocked = stdout carries the ⛔ marker; warn = ⚠️ marker.
const fx = (tool_name, tool_input) => spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name, tool_input }), encoding: 'utf8', timeout: 30000, env: process.env });
let rr = fx('Workflow', { name: 'deep-research', args: 'x' });
check('F2 replay: canned Workflow by name BLOCKED', (rr.stdout || '').includes('⛔'), rr.stdout.slice(0, 80));
rr = fx('Agent', { prompt: 'do a thing', subagent_type: 'Explore' });
check('F3 Agent without model BLOCKED', (rr.stdout || '').includes('⛔'), rr.stdout.slice(0, 80));
rr = fx('Agent', { prompt: 'do a thing', model: 'sonnet' });
check('F4 Agent WITH model passes', !(rr.stdout || '').includes('⛔'), rr.stdout.slice(0, 80));
rr = fx('Workflow', { scriptPath: __filename }); // this eval file has no cap marker
check('F5 scriptPath without cap marker WARNS (not block)', (rr.stdout || '').includes('⚠️') && !(rr.stdout || '').includes('⛔'), rr.stdout.slice(0, 80));
rr = fx('Workflow', { scriptPath: HOOK }); // hook file contains max[_-]?agents pattern text
check('F6 scriptPath WITH cap marker passes silent', !(rr.stdout || '').includes('⚠️') && !(rr.stdout || '').includes('⛔'), rr.stdout.slice(0, 80));
rr = fx('Edit', { file_path: 'x.md' });
check('F7 unrelated tool passes silent', !(rr.stdout || '').includes('agent-spend-gate:'), rr.stdout.slice(0, 80));

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nagent-spend-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
