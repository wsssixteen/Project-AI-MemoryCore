#!/usr/bin/env node
// eval for lib/quest-cleanup.js — replay of #285768 (2026-10-22): quest saved with a TEMP folder,
// scratchpad drafts, Office junk and a work worktree left behind.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.resolve(__dirname, '..', '..', 'lib', 'quest-cleanup.js');
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + (extra ? '  ' + extra : '')); } };

function fixture() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'qc-eval-'));
  const tmp = path.join(base, 'tmp'), task = path.join(base, 'task'), work = path.join(base, 'work');
  const sp = path.join(tmp, 'claude', 'proj', 'sess', 'scratchpad');
  for (const d of [path.join(tmp, 'q285768'), path.join(tmp, 'q999999'), sp, path.join(task, '2. Fix'), path.join(work, 'wt-common-285768')]) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(tmp, 'q285768', 't.docx'), 'x');
  fs.writeFileSync(path.join(sp, 'QA-285768.md'), 'x');
  fs.writeFileSync(path.join(sp, 'fix285768.py'), 'x');
  fs.writeFileSync(path.join(sp, 'other-111111.md'), 'x');
  fs.writeFileSync(path.join(task, '2. Fix', '~$rat.docx'), 'x');
  fs.writeFileSync(path.join(task, '2. Fix', 'surat.docx.bak'), 'x');
  fs.writeFileSync(path.join(task, '2. Fix', 'surat-MaklumanPembatalan.docx'), 'x');
  fs.mkdirSync(path.join(tmp, 'q2857681'));
  const old = new Date(Date.now() - 2 * 3600 * 1000);
  const age = (p) => { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const q = path.join(p, e.name); if (e.isDirectory()) age(q); fs.utimesSync(q, old, old); } };
  age(base);
  return { base, tmp, task, work, sp };
}
const run = (f, qa, extra) => execFileSync('node', [SCRIPT, qa, '--tmp', f.tmp, '--task', f.task, '--work', f.work, ...extra], { encoding: 'utf8' });

// 1 · list only: everything found, nothing deleted
let f = fixture();
let out = run(f, 'QA-285768', []);
ok('replay #285768 list: line printed', /^QUEST-CLEANUP: QA-285768 · listed only · removed 0 · kept 1 · listed 5/m.test(out), out.split('\n')[0]);
ok('replay #285768 list: temp folder found', out.includes('q285768'));
ok('replay #285768 list: worktree kept', /kept\s+worktree .*wt-common-285768/.test(out));
ok('list: nothing deleted', fs.existsSync(path.join(f.tmp, 'q285768')) && fs.existsSync(path.join(f.sp, 'QA-285768.md')));

// 2 · apply: safe items removed, worktree + unrelated + deliverables stay
out = run(f, '285768', ['--apply']);
ok('apply: line counts', /removed 5 · kept 1 · listed 0 · failed 0/.test(out), out.split('\n')[0]);
ok('apply: temp + scratch removed', !fs.existsSync(path.join(f.tmp, 'q285768')) && !fs.existsSync(path.join(f.sp, 'fix285768.py')));
ok('apply: Office junk removed', !fs.existsSync(path.join(f.task, '2. Fix', '~$rat.docx')) && !fs.existsSync(path.join(f.task, '2. Fix', 'surat.docx.bak')));
ok('apply: deliverable kept', fs.existsSync(path.join(f.task, '2. Fix', 'surat-MaklumanPembatalan.docx')));
ok('apply: other tickets untouched', fs.existsSync(path.join(f.tmp, 'q999999')) && fs.existsSync(path.join(f.sp, 'other-111111.md')));
ok('apply: worktree kept without --drop-worktree', fs.existsSync(path.join(f.work, 'wt-common-285768')));

ok('boundary: q2857681 never matched for 285768', fs.existsSync(path.join(f.tmp, 'q2857681')));

// 2b · live-session guard: a scratch file touched just now is kept
fs.writeFileSync(path.join(f.sp, 'live-285768.md'), 'x');
out = run(f, 'QA-285768', ['--apply']);
ok('recent: fresh scratch kept', fs.existsSync(path.join(f.sp, 'live-285768.md')) && /kept\s+scratch .*live-285768\.md .*last 30 min/.test(out), out);

// 3 · negative: a ticket with nothing left behind
out = run(f, 'QA-123456', ['--apply']);
ok('negative: nothing to clean', /removed 0 · kept 0 · listed 0/.test(out) && out.includes('nothing left behind'));

// 4 · usage error
let code = 0; try { execFileSync('node', [SCRIPT], { stdio: 'pipe' }); } catch (e) { code = e.status; }
ok('usage: exit 2 with no ticket', code === 2);

// 5 · wiring: quest save and DE both call the script
const root = path.resolve(__dirname, '..', '..');
const cp = fs.readFileSync(path.join(root, '.claude', 'skills', 'close-phase', 'SKILL.md'), 'utf8');
const de = fs.readFileSync(path.join(root, '.claude', 'skills', 'domain-expansion', 'SKILL.md'), 'utf8');
ok('wiring: close-phase Save-quest step 1b calls it', /1b\. \*\*Clean up the quest's temp files[\s\S]*?lib\/quest-cleanup\.js <QA> --apply/.test(cp));
ok('wiring: DE step 2c calls it', /\| 2c \|[^\n]*lib\/quest-cleanup\.js <QA> --apply/.test(de));

fs.rmSync(f.base, { recursive: true, force: true });
console.log(`${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
