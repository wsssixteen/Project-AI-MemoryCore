#!/usr/bin/env node
// component-birth-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: the 15 ghost hooks of 2026-05-25 + branch-at-apply built to a worktree path 2026-06-20
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'component-birth-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: REPLAY — Write creating a NEW hook file (the ghost-hook birth path) → must BLOCK (exit 2)
const ghostPath = path.resolve(__dirname, '..', 'ghost-probe', 'ghost-probe.check.hook.js');
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: ghostPath } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F2 new-component Write BLOCKED (exit 2)', r.status === 2, 'exit=' + r.status);
check('F2 block reason names the forge', /core\/forge\.js/.test(r.stderr), (r.stderr || '').slice(0, 120));

// F3: Edit to an EXISTING component (this gate itself) → pass (refine path stays open)
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: HOOK } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F3 existing-component edit passes', r.status === 0, 'exit=' + r.status);

// F4: non-component path → pass
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: 'C:/tmp/notes.md' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4 non-component path passes', r.status === 0, 'exit=' + r.status);

// F4b/F4c — Rule 13 (2026-09-06): new Feature README without goal:/retention: is blocked; with both it passes
const readmePath = path.join(__dirname, '..', 'zz-probe-feature-' + Date.now(), 'README.md');
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: readmePath, content: '# probe\n\n**What fires when**: Stop\n' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4b README without goal/retention BLOCKED', r.status === 2 && /goal:/.test(r.stderr), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 80));
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: readmePath, content: '# probe\n\nsymptom: s\ngoal: an outcome\ngoal_signal: sig\nretention: keep\n' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4d README with goal+retention but no footprint BLOCKED (Rule 7)', r.status === 2 && /footprint:/.test(r.stderr), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 80));
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: readmePath, content: '# probe\n\nsymptom: s\ngoal: an outcome\ngoal_signal: sig\nretention: keep\nfootprint: on-demand: 1 node process while running, <50 MB\n' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4e README with goal+retention+footprint but no self_audit BLOCKED (Rule 16)', r.status === 2 && /self_audit:/.test(r.stderr) && /against the goal/.test(r.stderr), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 120));
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: readmePath, content: '# probe\n\nsymptom: s\ngoal: an outcome\ngoal_signal: sig\nretention: keep\nfootprint: on-demand: 1 node process while running, <50 MB\nself_audit: the script re-reads its output and checks it against the goal\n' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4f README with every key but diagram: BLOCKED (Rule 17)', r.status === 2 && /diagram:/.test(r.stderr) && /diagram-census/.test(r.stderr), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 120));
// system-rules Rule 9 (2026-10-30): boundary: covers · never · stops — missing or half-shaped is blocked; the full shape passes
const FIVE = '# probe\n\nsymptom: s\ngoal: an outcome\ngoal_signal: sig\nretention: keep\nfootprint: on-demand: 1 node process while running, <50 MB\nself_audit: the script re-reads its output and checks it against the goal\ndiagram: diagram.png\n';
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: readmePath, content: FIVE } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4g README with every key but boundary: BLOCKED (Rule 9)', r.status === 2 && /boundary:/.test(r.stderr) && /covers/.test(r.stderr) && /never/.test(r.stderr) && /stops/.test(r.stderr), 'exit=' + r.status + ' ' + (r.stderr || '').slice(0, 160));
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: readmePath, content: FIVE + 'boundary: covers the Stop turn · never edits a file\n' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4h boundary without a stops part BLOCKED (Rule 9)', r.status === 2 && /boundary:/.test(r.stderr), 'exit=' + r.status);
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: readmePath, content: FIVE + 'boundary: covers the Stop turn and the transcript · never edits a file, never blocks twice · stops at a block naming the failed condition\n' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4c README with goal+retention+footprint+self_audit+diagram+boundary passes', r.status === 0, 'exit=' + r.status);
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: readmePath, content: FIVE + 'boundary: covers one transcript ; never writes ; stops none: report only\n' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4i boundary with ";" separators and "stops none: report only" passes', r.status === 0, 'exit=' + r.status);


// F5: forge's own birth (FORGE_BIRTH=1) → pass
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: ghostPath } }), encoding: 'utf8', timeout: 30000, env: { ...process.env, FORGE_BIRTH: '1' } });
check('F5 forge-authorized birth passes', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\ncomponent-birth-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
