#!/usr/bin/env node
// archive-hold.eval.js — fixture eval: the hold field round-trips, and each archive mover refuses a held id.
// Replay: 2026-10-15 ADHOC-PRBB-2026-14 — an answered adhoc whose Redmine ticket may come late must not be archived.
// Every fixture runs in a temp dir; the real active.txt, Task folders and register are never touched.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..');
const HOLD = path.join(__dirname, 'archive-hold.js');
const lib = require(HOLD);
const ID = 'ADHOC-TEST-2099-1';
// Keep eval rows out of the real log (child processes inherit this).
process.env.ARCHIVE_HOLD_LOG = path.join(os.tmpdir(), 'archive-hold-eval-log.jsonl');

let pass = 0, fail = 0;
function ok(name, cond, detail) { if (cond) { pass++; console.log('  PASS ' + name); } else { fail++; console.log('  FAIL ' + name + (detail ? '\n       ' + String(detail).slice(0, 400) : '')); } }
function node(args, env) { const r = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 30000, env: Object.assign({}, process.env, env || {}) }); return { out: (r.stdout || '') + (r.stderr || ''), status: r.status }; }

function workspace(extraLines) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-hold-'));
  fs.mkdirSync(path.join(root, 'quest'), { recursive: true });
  const block = [`qa=${ID}`, 'status=closed', 'ticket_type=adhoc', 'adhoc_register_row=A99', `task_folder=${path.join(root, 'tasks', '1. AH - STG - TEST - x')}`].concat(extraLines || []);
  const other = ['qa=QA-999001', 'status=active'];
  const text = 'active:\n\n' + block.join('\n') + '\n\n' + other.join('\n') + '\n';
  fs.writeFileSync(path.join(root, 'quest', 'active.txt'), text);
  fs.writeFileSync(path.join(root, 'quest', 'active-archive.txt'), '');
  fs.mkdirSync(path.join(root, 'tasks', '1. AH - STG - TEST - x'), { recursive: true });
  return { root, active: path.join(root, 'quest', 'active.txt'), archive: path.join(root, 'quest', 'active-archive.txt'), text };
}

console.log('archive-hold eval');

// H1 holdIn reads text and line arrays; blank value = no hold
ok('H1 holdIn: text block', lib.holdIn('qa=X\narchive_hold=2026-10-15: wait ticket') === '2026-10-15: wait ticket');
ok('H1 holdIn: line array (delegate-quest shape)', lib.holdIn(['qa=X', 'archive_hold=2026-10-15: wait']) === '2026-10-15: wait');
ok('H1 holdIn: empty value is no hold', lib.holdIn('qa=X\narchive_hold=') === null);
ok('H1 holdIn: absent is no hold', lib.holdIn('qa=X\nstatus=closed') === null);

// H2 CLI round trip: set → check (exit 3) → list → clear → file byte-identical to the start
{
  const w = workspace();
  const set = node([HOLD, 'set', ID, '--reason', 'waiting for the Redmine ticket', '--file', w.active]);
  ok('H2 set exits 0', set.status === 0, set.out);
  ok('H2 set writes the field', /^archive_hold=\d{4}-\d{2}-\d{2}: waiting for the Redmine ticket$/m.test(fs.readFileSync(w.active, 'utf8')));
  const chk = node([HOLD, 'check', ID, '--file', w.active]);
  ok('H2 check on a held id exits 3', chk.status === 3, chk.out);
  const lst = node([HOLD, 'list', '--file', w.active]);
  ok('H2 list names the held id', lst.out.includes(ID) && lst.out.includes('1 held'), lst.out);
  const clr = node([HOLD, 'clear', ID, '--file', w.active]);
  ok('H2 clear exits 0', clr.status === 0, clr.out);
  ok('H2 set then clear leaves the file byte-identical', fs.readFileSync(w.active, 'utf8') === w.text, JSON.stringify(fs.readFileSync(w.active, 'utf8')));
  const chk2 = node([HOLD, 'check', ID, '--file', w.active]);
  ok('H2 check after clear exits 0', chk2.status === 0, chk2.out);
  const noReason = node([HOLD, 'set', ID, '--file', w.active]);
  ok('H2 set without --reason is refused (exit 2)', noReason.status === 2, noReason.out);
}

// H3 archive-quest.js: a held id is refused before any move; dry-run reports it
{
  const w = workspace(['archive_hold=2026-10-15: waiting for the Redmine ticket']);
  const env = { ACTIVE_TXT: w.active, ACTIVE_ARCH: w.archive };
  const r = node([path.join(REPO, 'quest', 'archive-quest.js'), ID, '--tasks', path.join(w.root, 'tasks')], env);
  ok('H3 archive-quest refuses a held id (exit 3)', r.status === 3 && r.out.includes('archive-hold: ' + ID + ' is held'), r.out);
  ok('H3 archive-quest left the Task folder in place', fs.existsSync(path.join(w.root, 'tasks', '1. AH - STG - TEST - x')));
  ok('H3 archive-quest left the block in active.txt', fs.readFileSync(w.active, 'utf8').includes('qa=' + ID));
  const d = node([path.join(REPO, 'quest', 'archive-quest.js'), ID, '--tasks', path.join(w.root, 'tasks'), '--dry-run'], env);
  ok('H3 archive-quest dry-run reports the hold', d.out.includes('Step -2: ARCHIVE HOLD would BLOCK'), d.out);
  const w2 = workspace();
  const d2 = node([path.join(REPO, 'quest', 'archive-quest.js'), ID, '--tasks', path.join(w2.root, 'tasks'), '--dry-run'], { ACTIVE_TXT: w2.active, ACTIVE_ARCH: w2.archive });
  ok('H3 NEGATIVE: no hold, no hold line', !d2.out.includes('ARCHIVE HOLD') && !d2.out.includes('archive-hold:'), d2.out);
}

// H4 active-cli.js archive: a held block stays; an unheld block moves
{
  const w = workspace(['archive_hold=2026-10-15: waiting for the Redmine ticket']);
  const r = node([path.join(REPO, 'quest', 'active-cli.js'), 'archive', ID, '--file', w.active, '--archive', w.archive]);
  ok('H4 active-cli archive refuses a held block', r.status === 1 && r.out.includes('is held'), r.out);
  ok('H4 held block still in active.txt', fs.readFileSync(w.active, 'utf8').includes('qa=' + ID) && !fs.readFileSync(w.archive, 'utf8').includes('qa=' + ID));
  const w2 = workspace();
  const r2 = node([path.join(REPO, 'quest', 'active-cli.js'), 'archive', ID, '--file', w2.active, '--archive', w2.archive]);
  ok('H4 NEGATIVE: unheld block archives', r2.status === 0 && fs.readFileSync(w2.archive, 'utf8').includes('qa=' + ID), r2.out);
}

// H5 adhoc-lifecycle: archive refused for a held register row; sweep lists it apart; promote releases the hold
{
  const w = workspace(['archive_hold=2026-10-15: waiting for the Redmine ticket']);
  const regDir = path.join(w.root, 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka');
  fs.mkdirSync(regDir, { recursive: true });
  fs.writeFileSync(path.join(regDir, 'ADHOC-REGISTER.md'), '# reg\n\n| # | Date | a | b | c | d | Status |\n|---|---|---|---|---|---|---|\n| A99 | 2026-10-15 | BA | ask | concl | `' + ID + '` | `ANSWERED` — waiting ticket |\n');
  const LC = path.join(REPO, 'domain', 'adhoc-lifecycle', 'adhoc-lifecycle.js');
  const a = node([LC, 'archive', '--row', 'A99', '--reason', 'test', '--root', w.root, '--state', 'melaka'], { CLAUDE_PROJECT_DIR: w.root });
  ok('H5 adhoc-lifecycle archive refuses a held row (exit 3)', a.status === 3 && a.out.includes('is held'), a.out);
  const s = node([LC, 'sweep', '--root', w.root, '--state', 'melaka'], { CLAUDE_PROJECT_DIR: w.root });
  let sj = null; try { sj = JSON.parse(s.out.slice(s.out.indexOf('{'))); } catch (_) {}
  ok('H5 sweep lists the held row under heldRows, not terminalRows', sj && sj.heldRows.length === 1 && !sj.terminalRows.some(r => r.id === 'A99'), s.out);
  const p = node([LC, 'promote', '--row', 'A99', '--ticket', 'QA-999999', '--root', w.root, '--state', 'melaka'], { CLAUDE_PROJECT_DIR: w.root });
  ok('H5 promote releases the hold (ticket arrived)', p.out.includes('archive hold released on ' + ID) && lib.holdOf(ID, w.active) === null, p.out);
}

// H6 save-quest: a held block's Phase 2 verdict becomes HELD; Phase 1 verdicts pass through
{
  const sq = require(path.join(REPO, 'lib', 'save-quest.js'));
  const held = { qa: 'QA-1', file: 'active.txt', archive_hold: '2026-10-15: wait' };
  ok('H6 PHASE-2 + hold → HELD', sq.applyHold({ verdict: 'PHASE-2', next: 'x' }, held).verdict === 'HELD');
  ok('H6 LEARN-THEN-PHASE-2 + hold → HELD', sq.applyHold({ verdict: 'LEARN-THEN-PHASE-2', next: 'x' }, held).verdict === 'HELD');
  ok('H6 PHASE-1 + hold passes through', sq.applyHold({ verdict: 'PHASE-1', next: 'x' }, held).verdict === 'PHASE-1');
  ok('H6 NEGATIVE: PHASE-2 with no hold passes through', sq.applyHold({ verdict: 'PHASE-2', next: 'x' }, { qa: 'QA-1', file: 'active.txt' }).verdict === 'PHASE-2');
}

console.log(`\narchive-hold eval: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
