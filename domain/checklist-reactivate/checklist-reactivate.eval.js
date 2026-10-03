#!/usr/bin/env node
// checklist-reactivate.eval.js — fixture eval for resume-readiness.js + checklist-show.js.
// Why: quest/active.txt and the qa_doc under projects/ are untracked and exist only in the MAIN checkout. Until
// 2026-10-03 both scripts read them from their own tree, so a run from a worktree session printed
// "cannot read quest/active.txt" and exited 0 (a silent no-op at /quest hold and at session end).
// Run: node domain/checklist-reactivate/checklist-reactivate.eval.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HERE = __dirname;
const REPO = path.resolve(HERE, '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'checklist-reactivate-eval-'));
const MAIN = path.join(tmp, 'main');
const WT = path.join(MAIN, '.claude', 'worktrees', 'x');

function put(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
function copyTree(root) {
  for (const f of ['resume-readiness.js', 'checklist-show.js']) put(path.join(root, 'domain', 'checklist-reactivate', f), fs.readFileSync(path.join(HERE, f)));
  put(path.join(root, 'lib', 'states.js'), fs.readFileSync(path.join(REPO, 'lib', 'states.js')));
  put(path.join(root, 'system', 'states.json'), fs.readFileSync(path.join(REPO, 'system', 'states.json')));
}
function run(root, script, arg) {
  const r = spawnSync(process.execPath, [path.join(root, 'domain', 'checklist-reactivate', script)].concat(arg ? [arg] : []), { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: '', STATES_FILE: '', STATES_LOCAL_FILE: '' } });
  return (r.stdout || '') + (r.stderr || '');
}

// Untracked data lives ONLY at the main root. The id is the two-block shape (a second 2-digit block).
put(path.join(MAIN, 'quest', 'active.txt'), [
  'qa=QA-900001', 'status=hold', 'qa_doc=projects/coding-projects/active/QA-900001/QA-900001.md', 'branch=x/esokongan/900001', 'env=staging', '',
  'qa=QA-900002', 'status=closed', 'qa_doc=projects/coding-projects/active/QA-900002/QA-900002.md', 'branch=x/qa/900002', 'env=staging', '',
].join('\n'));
put(path.join(MAIN, 'projects', 'coding-projects', 'active', 'QA-900001', 'QA-900001.md'), [
  '# QA-900001', '', '## 0. Resume Point', 'Test id PTXXX/07/01/L/PLPS/2026/135 as officer@example.gov.my. File Foo.java. Then build.', '',
  '## Next-Steps Checklist', '| # | Item | Owner | Status |', '|---|---|---|---|', '| 1 | Rebuild and retest | me | pending |', '| 2 | Old step | me | ✅ done |', '',
].join('\n'));
copyTree(MAIN);
copyTree(WT);

let pass = 0, fail = 0;
function check(name, ok, detail) { if (ok) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + (detail ? '\n      ' + String(detail).slice(0, 400) : '')); } }

const rrWt = run(WT, 'resume-readiness.js');
check('F1 resume-readiness from a worktree copy reads the MAIN active.txt', /QA-900001/.test(rrWt) && !/cannot read quest\/active\.txt/.test(rrWt), rrWt);
check('F2 resume-readiness from a worktree copy reads the MAIN qa_doc (no "unreadable")', !/qa_doc unreadable/.test(rrWt) && /COLD-RESUME READY — QA-900001/.test(rrWt), rrWt);
check('F3 the two-block permohonan id counts as a test id', /✓ qa_doc: test permohonan ID present/.test(rrWt), rrWt);
check('F4 a closed quest is not listed', !/QA-900002/.test(rrWt), rrWt);

const csWt = run(WT, 'checklist-show.js');
check('F5 checklist-show from a worktree copy lists the open item', /QA-900001 — 1 open item/.test(csWt) && /Rebuild and retest/.test(csWt), csWt);
check('F6 a done row is not listed', !/Old step/.test(csWt), csWt);

const rrMain = run(MAIN, 'resume-readiness.js');
check('F7 resume-readiness from the main copy gives the same verdict (parity)', /COLD-RESUME READY — QA-900001/.test(rrMain), rrMain);
const csMain = run(MAIN, 'checklist-show.js', '900001');
check('F8 checklist-show from the main copy with a ticket filter (parity)', /QA-900001 — 1 open item/.test(csMain), csMain);

check('F9 the log is written on the script\'s own tree (worktree copy), not moved to main by this change',
  fs.existsSync(path.join(WT, 'domain', 'checklist-reactivate', 'log.jsonl')));

// A tree with NO active.txt anywhere still says so out loud (the message is the only signal: exit stays 0).
const EMPTY = path.join(tmp, 'empty'); copyTree(EMPTY);
check('F10 no active.txt anywhere -> the "cannot read" line is printed', /cannot read quest\/active\.txt/.test(run(EMPTY, 'resume-readiness.js')));

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
console.log('\nchecklist-reactivate.eval: ' + pass + '/' + (pass + fail) + (fail ? ' — FAILURES' : ' green'));
process.exit(fail ? 1 : 0);
