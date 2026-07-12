#!/usr/bin/env node
// core/state-check.eval.js — fixtures: valid file · fused blocks (missing blank line) · dup qa · bad status
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const CHECK = path.join(__dirname, 'state-check.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'state-check-eval-'));
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }
function run(content, strict) {
  const f = path.join(TMP, 'active-' + results.length + '.txt');
  fs.writeFileSync(f, content);
  return spawnSync(process.execPath, [CHECK, '--file', f].concat(strict ? ['--strict'] : []), { encoding: 'utf8', timeout: 30000 });
}

// F1 valid: 2 well-formed open blocks → exit 0, no errors
let r = run('active:\n\nqa=QA-1\nstatus=active\ntask_folder=X\nqa_doc=Y\n\nqa=QA-2\nstatus=hold\ntask_folder=X\nqa_doc=Y\n', true);
check('F1 valid file exits 0 under --strict', r.status === 0, 'exit=' + r.status);
check('F1 no ERROR lines', !/ERROR/.test(r.stdout), r.stdout.slice(0, 150));

// F2 FUSED blocks (qa= with no blank line — the hand-edit killer) → strict exit 1
r = run('qa=QA-1\nstatus=active\nqa=QA-2\nstatus=hold\n', true);
check('F2 fused blocks detected as ERROR', /FUSED/.test(r.stdout), r.stdout.slice(0, 200));
check('F2 strict exits 1', r.status === 1, 'exit=' + r.status);

// F3 duplicate qa → strict exit 1
r = run('qa=QA-1\nstatus=active\n\nqa=QA-1\nstatus=hold\n', true);
check('F3 duplicate qa detected', /duplicate qa=QA-1/.test(r.stdout), r.stdout.slice(0, 200));

// F4 bad status enum → strict exit 1
r = run('qa=QA-9\nstatus=wip\n', true);
check('F4 bad status detected', /not in enum/.test(r.stdout), r.stdout.slice(0, 200));

// F5 non-strict never exits 1 (non-breaking promise)
r = run('qa=QA-1\nstatus=active\nqa=QA-2\nstatus=hold\n', false);
check('F5 non-strict is non-breaking (exit 0 even with errors)', r.status === 0, 'exit=' + r.status);

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log(`\nstate-check.eval: ${results.length - failed}/${results.length} green`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
process.exit(failed ? 1 : 0);
