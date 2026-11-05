#!/usr/bin/env node
// ticket-close-block.eval — pins the exact --alter note (ALTER-TICKET-PLAYBOOK §5.1 points here).
// Runs a copy of the script in a temp folder, so the real log.jsonl gets no test rows.
// node domain/ticket-close-block/ticket-close-block.eval.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const sb = fs.mkdtempSync(path.join(os.tmpdir(), 'tcb-eval-'));
for (const f of ['ticket-close-block.js', 'ba-names.json']) fs.copyFileSync(path.join(__dirname, f), path.join(sb, f));
const run = args => {
  const r = spawnSync(process.execPath, [path.join(sb, 'ticket-close-block.js'), ...args], { encoding: 'utf8' });
  return { out: (r.stdout || '').replace(/\r\n/g, '\n'), err: r.stderr || '', status: r.status };
};
let pass = 0, total = 0;
function check(name, ok, detail) {
  total++; if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + String(detail).slice(0, 300).replace(/\n/g, '\\n')}`);
}

// F1 alter only
let r = run(['--alter', '--ticket', '284775', '--ba', 'Nurhafizah Hasan', '--id', 'PTMLK/02/L/PT/2026/343', '--tugasan', 'Penyediaan Borang 4Ae', '--user', 'irwanf@melaka.gov.my']);
const want1 = [
  'Salam Fizah, have altered as below. Please help to verify.',
  '',
  '<pre>',
  'ID Permohonan: PTMLK/02/L/PT/2026/343',
  'Tugasan: Penyediaan Borang 4Ae',
  'User ID: irwanf@melaka.gov.my',
  '</pre>',
  '',
  'Thank you.',
  '',
].join('\n');
check('F1 alter only: exact note, exit 0, no warning', r.status === 0 && r.out === want1 && !/warn/.test(r.err), r.out + ' | ' + r.err);

// F2 patch + alter with --resit and --prod-script (a path: only its file name is printed)
r = run(['--alter', '--ticket', '288533', '--ba', 'mira', '--id', 'PTMLK/02/L/PRBB/2026/9', '--tugasan', 'Semakan Permohonan', '--user', 'aminah@melaka.gov.my',
  '--resit', 'R100, R101', '--patched', '--prod-script', 'C:\\Tasks\\2. Fix\\288533.sql']);
const want2 = [
  'Salam Mira, have patched the data and altered as below. Can proceed to verify.',
  '',
  '<pre>',
  'ID Permohonan: PTMLK/02/L/PRBB/2026/9',
  'No. Resit: R100, R101',
  'Tugasan: Semakan Permohonan',
  'User ID: aminah@melaka.gov.my',
  '</pre>',
  '',
  'Attached is the script for PROD (288533.sql).',
  '',
  'Thank you.',
  '',
].join('\n');
check('F2 patch+alter with --resit and --prod-script: exact note, BA name case-insensitive', r.status === 0 && r.out === want2, r.out);

// F3 unknown BA: warning on stderr, greeted as given, still exit 0
r = run(['--alter', '--ticket', '1', '--ba', 'Zulaikha', '--id', 'X/1', '--tugasan', 'T', '--user', 'u@melaka.gov.my']);
check('F3 unknown BA prints a warning and greets the name as given', r.status === 0 && /warn: no short name for "Zulaikha"/.test(r.err) && r.out.startsWith('Salam Zulaikha, have altered as below.'), r.out + ' | ' + r.err);

// F4 missing args: exit 1, names each missing flag, prints no note
r = run(['--alter', '--ticket', '1', '--ba', 'Fizah']);
check('F4 missing args exit 1 and name --id --tugasan --user', r.status === 1 && /--alter needs: --id --tugasan --user/.test(r.err) && r.out === '', r.status + ' ' + r.err);

// F5 a flag given with no value counts as missing
r = run(['--alter', '--ticket', '1', '--ba', 'Fizah', '--id', 'X/1', '--tugasan', 'T', '--user']);
check('F5 --user with no value -> exit 1', r.status === 1 && /--user/.test(r.err), r.status + ' ' + r.err);

// F6 every --alter run writes one log row (the monitoring layer)
const rows = fs.readFileSync(path.join(sb, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
check('F6 log rows: one per printed note, mode alter, patched flag kept', rows.length === 3 && rows.every(x => x.mode === 'alter' && x.outcome === 'printed') && rows[1].patched === true && rows[0].patched === false, JSON.stringify(rows));

// ── one non-merge commit per cycle (2026-11-05, #287811: five failed commits reached origin before the note) ──
const { execFileSync } = require('child_process');
const g = (cwd, args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const repo = path.join(sb, 'repo'); fs.mkdirSync(repo);
g(repo, ['init', '-q']); g(repo, ['config', 'user.email', 'ridhwan@x']); g(repo, ['config', 'user.name', 'Ridhwan']);
fs.writeFileSync(path.join(repo, 'a.txt'), '1\n'); g(repo, ['add', '-A']); g(repo, ['commit', '-q', '-m', 'base']);
g(repo, ['branch', '-m', 'mlk/master']);
g(repo, ['checkout', '-q', '-b', 'mlk/internal/287811']);
fs.writeFileSync(path.join(repo, 'a.txt'), '2\n'); g(repo, ['commit', '-q', '-am', 'Ref #287811 - fix 1']);
fs.writeFileSync(path.join(repo, 'a.txt'), '3\n'); g(repo, ['commit', '-q', '-am', 'Ref #287811 - fix 2']);
const note = extra => run(['--repo', repo, '--ticket', '287811', '--module', 'pelupusan', '--branch', 'mlk/internal/287811', '--ba', 'mira', ...(extra || [])]);
r = note();
check('F7 two non-merge commits in cycle 1 -> refused exit 3, names the count and origin-rewrite', r.status === 3 && /2 non-merge commits/.test(r.err) && /origin-rewrite/.test(r.err) && !/Salam/.test(r.out), r.status + ' ' + r.err.slice(0, 200));
r = note(['--multi-ok', 'miya 2026-11-05: keep both, he said so']);
check('F8 --multi-ok "<his words>" -> note printed, exit 0', r.status === 0 && /Salam Mira/.test(r.out), r.status + ' ' + r.err.slice(0, 120));
g(repo, ['reset', '-q', '--soft', 'mlk/master']); g(repo, ['commit', '-q', '-m', 'Ref #287811 - one commit']);
r = note();
check('F9 squashed to one commit -> note printed, exit 0', r.status === 0 && /Salam Mira/.test(r.out) && /one commit/.test(r.out), r.status + ' ' + r.err.slice(0, 120));
g(repo, ['checkout', '-q', 'mlk/master']); fs.writeFileSync(path.join(repo, 'b.txt'), 'm\n'); g(repo, ['add', '-A']); g(repo, ['commit', '-q', '-m', 'master moves']);
g(repo, ['checkout', '-q', 'mlk/internal/287811']); g(repo, ['merge', '-q', '--no-edit', 'mlk/master']);
r = note();
check('F10 a master merge on the branch is not counted -> exit 0', r.status === 0 && /Salam Mira/.test(r.out), r.status + ' ' + r.err.slice(0, 120));
const rows2 = fs.readFileSync(path.join(sb, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
check('F11 log carries refused-multi-commit (n=2, cycles=1) and multi-ok rows', rows2.some(x => x.outcome === 'refused-multi-commit' && x.n === 2 && x.cycles === 1) && rows2.some(x => x.outcome === 'multi-ok'), JSON.stringify(rows2.slice(-5)));

fs.rmSync(sb, { recursive: true, force: true });
console.log(`\nticket-close-block.eval: ${pass}/${total} ${pass === total ? 'green' : 'RED'}`);
process.exit(pass === total ? 0 : 1);
