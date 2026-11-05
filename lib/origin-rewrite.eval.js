#!/usr/bin/env node
// origin-rewrite.eval.js — behavioural eval on a temp bare origin + a work clone + "his" clone.
// Run: node lib/origin-rewrite.eval.js   (exit 0 = all green)
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'origin-rewrite-eval-'));
const g = (args, cwd) => execSync('git ' + args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const TOOL = path.join(__dirname, 'origin-rewrite.js');
const LOG = path.join(TMP, 'log.jsonl');
const run = (args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', env: Object.assign({}, process.env, { ORIGIN_REWRITE_LOG: LOG }) });

const origin = path.join(TMP, 'origin.git'); fs.mkdirSync(origin); g('init --bare -q', origin);
const work = path.join(TMP, 'work'); g(`clone -q "${origin}" "${work}"`, TMP);
g('config user.email r@x', work); g('config user.name r', work);
fs.writeFileSync(path.join(work, 'a.txt'), '1\n'); g('add -A', work); g('commit -q -m base', work);
g('checkout -q -b mlk/internal/287811', work);
fs.writeFileSync(path.join(work, 'a.txt'), '2\n'); g('commit -q -am fix1', work);
fs.writeFileSync(path.join(work, 'a.txt'), '3\n'); g('commit -q -am fix2', work);
g('push -q -u origin mlk/internal/287811', work);
const oldTip = g('rev-parse HEAD', work);
const his = path.join(TMP, 'his'); g(`clone -q "${origin}" "${his}"`, TMP); g('config user.email h@x', his); g('config user.name h', his);
g('checkout -q mlk/internal/287811', his);

// rewrite in the work clone: squash the two commits into one
g('reset -q --soft HEAD~2', work); g('commit -q -m "one commit"', work);
const newTip = g('rev-parse HEAD', work);

const results = [];
const check = (n, ok, d) => results.push({ n, ok: !!ok, d: d || '' });

// 1. usage refusal
let r = run(['--repo', work]);
check('1 usage refused (exit 2)', r.status === 2, 'exit ' + r.status);

// 2. dirty his clone → push happens, his clone untouched, exit 3
fs.writeFileSync(path.join(his, 'dirty.txt'), 'x\n');
r = run(['--repo', work, '--branch', 'mlk/internal/287811', '--lease', oldTip, '--his-clone', his]);
check('2 dirty his clone exits 3', r.status === 3, 'exit ' + r.status + ' ' + (r.stderr || '').slice(0, 80));
check('2 origin moved to the new tip anyway', g('rev-parse mlk/internal/287811', origin) === newTip, '');
check('2 his clone NOT reset while dirty', g('rev-parse mlk/internal/287811', his) === oldTip, '');
fs.unlinkSync(path.join(his, 'dirty.txt'));

// 3. someone else moved origin (his clone commits and pushes): a lease on the old tip is refused by git
g('fetch -q origin', his); g('reset -q --hard origin/mlk/internal/287811', his);
fs.writeFileSync(path.join(his, 'b.txt'), 'his\n'); g('add -A', his); g('commit -q -m "his commit"', his); g('push -q origin mlk/internal/287811', his);
const hisTip = g('rev-parse HEAD', his);
r = run(['--repo', work, '--branch', 'mlk/internal/287811', '--lease', newTip, '--his-clone', his]);
check('3 stale lease refused (non-zero)', r.status !== 0 && g('rev-parse mlk/internal/287811', origin) === hisTip, 'exit ' + r.status);

// 4. clean his clone with the CURRENT lease: origin moved back to the squashed tip, his clone reset, "Refresh SourceTree."
r = run(['--repo', work, '--branch', 'mlk/internal/287811', '--lease', hisTip, '--his-clone', his]);
check('4 exit 0', r.status === 0, 'exit ' + r.status + ' ' + (r.stderr || '').slice(0, 120));
check('4 his clone reset to the new tip', g('rev-parse mlk/internal/287811', his) === newTip, '');
check('4 says Refresh SourceTree', /Refresh SourceTree\./.test(r.stdout), (r.stdout || '').slice(0, 120));
check('4 log row audit ok', fs.existsSync(LOG) && /"outcome":"ok"/.test(fs.readFileSync(LOG, 'utf8')), '');

// 5. --no-his skips his clone and still says so
r = run(['--repo', work, '--branch', 'mlk/internal/287811', '--lease', newTip, '--no-his']);
check('5 --no-his exit 0 and prints the skip', r.status === 0 && /skipped/.test(r.stdout), (r.stdout || '').slice(0, 80));

// 6. a non-mlk branch is refused
r = run(['--repo', work, '--branch', 'feature/x', '--lease', newTip, '--no-his']);
check('6 non-mlk branch refused', r.status === 2, 'exit ' + r.status);

let failed = 0;
for (const x of results) { if (!x.ok) failed++; console.log((x.ok ? 'PASS' : 'FAIL') + ' — ' + x.n + (x.ok ? '' : '  → ' + x.d)); }
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
console.log(`\norigin-rewrite.eval: ${results.length - failed}/${results.length} green`);
process.exit(failed ? 1 : 0);
