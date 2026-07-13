#!/usr/bin/env node
// spawn-telemetry.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: delegation economy unmeasurable - zero spawn telemetry existed
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'spawn-telemetry.check.hook.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const TELEMETRY_FILE = path.join(REPO_ROOT, 'meta', 'telemetry', 'hook-fires.jsonl');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

// NOTE: lib/hook-runtime's runHook() ALSO appends its own generic bookkeeping row
// (hook:'spawn-telemetry', no spawn_tool field) on EVERY invocation regardless of
// whether our fn fired. We only count/inspect OUR spec'd row — identified by the
// presence of the spawn_tool field — so generic framework rows don't skew the count.
function countSpawnRows() {
  try {
    const lines = fs.readFileSync(TELEMETRY_FILE, 'utf8').split('\n').filter(Boolean);
    return lines.filter((l) => { try { const row = JSON.parse(l); return row.hook === 'spawn-telemetry' && row.spawn_tool !== undefined; } catch (_) { return false; } }).length;
  } catch (_) { return 0; }
}

function lastSpawnRow() {
  try {
    const lines = fs.readFileSync(TELEMETRY_FILE, 'utf8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try { const row = JSON.parse(lines[i]); if (row.hook === 'spawn-telemetry' && row.spawn_tool !== undefined) return row; } catch (_) { /* skip */ }
    }
  } catch (_) { /* none */ }
  return null;
}

// F1: clean input (non-spawn tool) → must NOT fire, must NOT block, empty stdout
const before1 = countSpawnRows();
let r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'x.txt' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);
check('F1 clean input stdout EMPTY (silent)', (r.stdout || '') === '', JSON.stringify(r.stdout));
check('F1 clean input does NOT append telemetry row', countSpawnRows() === before1, 'before=' + before1 + ' after=' + countSpawnRows());

// F2: REPLAY — Task spawn with subagent_type → must FIRE silently, telemetry row lands, stdout EMPTY
const before2 = countSpawnRows();
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Task', tool_input: { subagent_type: 'general-purpose', description: 'do a thing' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F2 Task spawn exits 0 (advisory, never blocks)', r.status === 0, 'exit=' + r.status);
check('F2 Task spawn stdout EMPTY (silent — no advisory text)', (r.stdout || '') === '', JSON.stringify(r.stdout));
const after2 = countSpawnRows();
check('F2 telemetry row appended', after2 === before2 + 1, 'before=' + before2 + ' after=' + after2);
const row2 = lastSpawnRow();
check('F2 telemetry row shape correct', !!row2 && row2.event === 'PostToolUse' && row2.mode === 'native' && row2.spawn_tool === 'Task' && row2.model === 'general-purpose', JSON.stringify(row2));

// F3: edge case — Workflow spawn with explicit model field (no subagent_type) → fires, model field used
const before3 = countSpawnRows();
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Workflow', tool_input: { model: 'haiku' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F3 Workflow spawn exits 0', r.status === 0, 'exit=' + r.status);
check('F3 Workflow spawn stdout EMPTY', (r.stdout || '') === '', JSON.stringify(r.stdout));
check('F3 telemetry row appended', countSpawnRows() === before3 + 1, 'before=' + before3 + ' after=' + countSpawnRows());
const row3 = lastSpawnRow();
check('F3 telemetry row uses model field, spawn_tool=Workflow', !!row3 && row3.spawn_tool === 'Workflow' && row3.model === 'haiku', JSON.stringify(row3));

// F4: edge case — Agent spawn with neither model nor subagent_type → fires, model falls back to 'unspecified'
const before4 = countSpawnRows();
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Agent', tool_input: {} }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F4 Agent spawn exits 0', r.status === 0, 'exit=' + r.status);
const row4 = lastSpawnRow();
check('F4 telemetry row falls back to unspecified', countSpawnRows() === before4 + 1 && !!row4 && row4.model === 'unspecified', JSON.stringify(row4));

// F5: non-matching tool name (e.g. "TaskRunner") must NOT fire — narrow-trigger check
const before5 = countSpawnRows();
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'TaskRunner', tool_input: { model: 'x' } }), encoding: 'utf8', timeout: 30000, env: process.env });
check('F5 non-matching tool_name does not fire', countSpawnRows() === before5, 'before=' + before5 + ' after=' + countSpawnRows());

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nspawn-telemetry.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
