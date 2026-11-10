#!/usr/bin/env node
// Eval for lib/housekeeping.js foldConflictCopies — runs against a temp root, never the repo.
//   node lib/housekeeping.eval.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hk-eval-'));
process.env.CLAUDE_PROJECT_DIR = root;
const { foldConflictCopies, pruneByMonth } = require('./housekeeping.js');
const tel = path.join(root, 'system', 'telemetry');
fs.mkdirSync(tel, { recursive: true });
fs.mkdirSync(path.join(root, 'domain'), { recursive: true });
const w = (rel, text) => fs.writeFileSync(path.join(root, rel), text);
const lines = rel => fs.readFileSync(path.join(root, rel), 'utf8').split(/\r?\n/).filter(Boolean);
const exists = rel => fs.existsSync(path.join(root, rel));

// jsonl ledger: base has a,b,c · shard has s1 · copy 1 has a,b,new1 · copy 2 has s1,new1,new2
w('system/telemetry/hook-fires.jsonl', '{"r":"a"}\n{"r":"b"}\n{"r":"c"}');
w('system/telemetry/hook-fires-2026-09.jsonl', '{"r":"s1"}\n');
w('system/telemetry/hook-fires-miyazaki.jsonl', '{"r":"a"}\n{"r":"b"}\n{"r":"new1"}\n');
w('system/telemetry/hook-fires-PJNBRidhwan-7.jsonl', '{"r":"s1"}\n{"r":"new1"}\n{"r":"new2"}\n');
// per-turn snapshot: copies deleted
w('system/telemetry/turn-ledger-state.json', '{"turn":9}');
w('system/telemetry/turn-ledger-state-miyazaki-2.json', '{"turn":3}');
// regenerate-class md: copy deleted
w('system/slip-dashboard.md', '# live');
w('system/slip-dashboard-PJNBRidhwan.md', '# stale');
// hand-edited md: copy reported, kept
w('system/principles.md', '# base');
w('system/principles-miyazaki.md', '# other edit');
// not a copy: a monthly shard and a versioned name stay untouched
w('system/slip-log-v2.md', '# not a conflict copy');

let fails = 0;
const check = (name, ok) => { console.log((ok ? 'PASS' : 'FAIL') + '  ' + name); if (!ok) fails++; };

const dry = foldConflictCopies(root, true);
check('dry-run lists all 5 copies', dry.length === 5);
check('dry-run touches nothing', exists('system/telemetry/hook-fires-miyazaki.jsonl') && lines('system/telemetry/hook-fires.jsonl').length === 3);

const rows = foldConflictCopies(root, false);
const base = lines('system/telemetry/hook-fires.jsonl');
check('jsonl base gains only the 2 new rows (no dup of a, b, s1)', base.length === 5 && base.includes('{"r":"new1"}') && base.includes('{"r":"new2"}') && base.filter(l => l === '{"r":"new1"}').length === 1);
check('jsonl base keeps its original rows first', base.slice(0, 3).join() === '{"r":"a"},{"r":"b"},{"r":"c"}');
check('jsonl copies deleted', !exists('system/telemetry/hook-fires-miyazaki.jsonl') && !exists('system/telemetry/hook-fires-PJNBRidhwan-7.jsonl'));
check('monthly shard untouched', exists('system/telemetry/hook-fires-2026-09.jsonl') && lines('system/telemetry/hook-fires-2026-09.jsonl').length === 1);
check('snapshot copy deleted, base kept', !exists('system/telemetry/turn-ledger-state-miyazaki-2.json') && exists('system/telemetry/turn-ledger-state.json'));
check('regenerate-class md copy deleted', !exists('system/slip-dashboard-PJNBRidhwan.md') && exists('system/slip-dashboard.md'));
check('hand-edited md copy kept and reported', exists('system/principles-miyazaki.md') && rows.some(r => r.copy === 'system/principles-miyazaki.md' && /resolve by hand/.test(r.action)));
check('versioned name is not treated as a copy', exists('system/slip-log-v2.md') && !rows.some(r => r.copy === 'system/slip-log-v2.md'));
check('second run finds nothing to fold', foldConflictCopies(root, true).filter(r => !/resolve by hand/.test(r.action)).length === 0);

// ── age prune (2026-11-10, domain/turn-log) ──
const NOW = Date.UTC(2026, 10, 10); // 2026-11-10
fs.mkdirSync(path.join(root, 'system', 'telemetry', 'turn-log'), { recursive: true });
for (const n of ['miyazaki-2026-03.jsonl', 'miyazaki-2026-05.jsonl', 'miyazaki-2026-11.jsonl', 'my_pc-2026-04.jsonl']) w('system/telemetry/turn-log/' + n, '{"kind":"turn"}' + String.fromCharCode(10));
for (const n of ['hook-fires-miyazaki-2026-09.jsonl', 'hook-fires-miyazaki-2026-11.jsonl', 'hook-fires-2026-01.jsonl']) w('system/telemetry/' + n, '{"hook":"x"}' + String.fromCharCode(10));
const preDry = pruneByMonth(root, true, NOW);
check('prune dry-run deletes nothing', exists('system/telemetry/turn-log/miyazaki-2026-03.jsonl') && preDry.length >= 3);
const pr = pruneByMonth(root, false, NOW).map(r => r.file);
check('turn-log: a month that ended over 180 d ago is deleted (March, April)', !exists('system/telemetry/turn-log/miyazaki-2026-03.jsonl') && !exists('system/telemetry/turn-log/my_pc-2026-04.jsonl'));
check('turn-log: May (ended 162 d ago) and November are kept', exists('system/telemetry/turn-log/miyazaki-2026-05.jsonl') && exists('system/telemetry/turn-log/miyazaki-2026-11.jsonl'));
check('hook-fires month file older than 30 d is deleted, the current month kept', !exists('system/telemetry/hook-fires-miyazaki-2026-09.jsonl') && exists('system/telemetry/hook-fires-miyazaki-2026-11.jsonl'));
check('the old machine-less shard hook-fires-2026-01.jsonl is never pruned', exists('system/telemetry/hook-fires-2026-01.jsonl'));
check('per-machine month files are not conflict copies (fold leaves them)', foldConflictCopies(root, true).every(r => !/turn-log|hook-fires-miyazaki-2026-11/.test(r.copy)));
check('a stale stamp (4 d) is deleted, a fresh one kept', (() => {
  w('system/telemetry/current-turn-aaaa1111.json', '{}'); w('system/telemetry/current-turn-bbbb2222.json', '{}');
  const old = new Date(NOW - 4 * 86400000); fs.utimesSync(path.join(root, 'system/telemetry/current-turn-aaaa1111.json'), old, old);
  const fresh = new Date(NOW - 3600000); fs.utimesSync(path.join(root, 'system/telemetry/current-turn-bbbb2222.json'), fresh, fresh);
  pruneByMonth(root, false, NOW);
  return !exists('system/telemetry/current-turn-aaaa1111.json') && exists('system/telemetry/current-turn-bbbb2222.json');
})());

fs.rmSync(root, { recursive: true, force: true });
console.log((fails ? 'FAIL ' + fails : 'ALL PASS') + ' — housekeeping.eval ' + (17 - fails) + '/17');
process.exit(fails ? 1 : 0);
