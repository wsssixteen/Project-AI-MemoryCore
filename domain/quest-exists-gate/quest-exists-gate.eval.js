#!/usr/bin/env node
// quest-exists-gate.eval.js — replay eval (born WITH the component; forge blocks ship until green).
// Replay case: 2026-09-24 hotfix #281392: 4 commits + staging scripts with no quest/Task folder; first commits labelled with the closed #280176
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const HOOK = path.join(__dirname, 'quest-exists-gate.check.hook.js');
const { decide, parseBlocks } = require('./quest-exists-gate.check.hook.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const PLP = 'E:\\Dev\\etanah-work\\etanah-pelupusan';
const commit = (msg, repo = PLP) => `git -C ${repo} commit -m "${msg}"`;
const FOLDER = 'C:\\Tasks\\224. ES #281392';
const ACTIVE_OK = `qa=QA-281392\ntask_folder=${FOLDER}\nstatus=active\n\nqa=QA-280176\ntask_folder=C:\\Tasks\\old\nstatus=archived\n`;
const exists = (p) => p === FOLDER;
const run = (o) => decide({ activeText: ACTIVE_OK, branch: 'mlk/hotfix/281392', folderExists: exists, turnText: '', ...o });

// F1: clean input → must NOT block (exit 0)
let r = spawnSync(process.execPath, [HOOK], { input: '{}', encoding: 'utf8', timeout: 30000, env: process.env });
check('F1 clean input exits 0 (no false block)', r.status === 0, 'exit=' + r.status);

// F2: the replay — commit #281392 with no quest block → BLOCK, remedy names redmine-sync
let d = run({ command: commit('#281392 - DMMLMS - Borang 4Ae - tambah DMMLMS'), activeText: '' });
check('F2 replay: #281392 commit with no quest block → BLOCK', d.block === true && /redmine-sync\.js 281392/.test(d.reason), JSON.stringify(d));
// F3: the other half of the replay — hotfix branch 281392 but message says closed #280176 → BLOCK
d = run({ command: commit('#280176 - OMLPS - Pengeluaran Lesen') });
check('F3 replay: branch mlk/hotfix/281392 + message #280176 → BLOCK', d.block === true && /hotfix for #281392/.test(d.reason), JSON.stringify(d));
check('F4 quest block + folder exists → pass', run({ command: commit('#281392 - x') }).block === false);
check('F5 block present but task_folder missing on disk → BLOCK', run({ command: commit('#281392 - x'), folderExists: () => false }).block === true);
check('F6 archived quest → BLOCK (released ticket ⇒ hotfix)', run({ command: commit('#280176 - x'), branch: 'mlk/esokongan/280176' }).block === true);
check('F7 MemoryCore commit naming #281392 → no fire', run({ command: 'git commit -m "QA-281392 save #281392"' }).fire === false);
check('F8 etanah commit without #ticket → no fire', run({ command: commit('merge fix'), activeText: '' }).fire === false);
check('F9 git log --grep commit → no fire', run({ command: `git -C ${PLP} log --grep "commit #281392"`, activeText: '' }).fire === false);
check('F10 bypass token with a real reason → pass', run({ command: commit('#281392 - x'), activeText: '', turnText: '[skip-quest-exists: renumber revert]' }).block !== true);
check('F11 own help text "[skip-quest-exists: <reason>]" does NOT bypass', run({ command: commit('#281392 - x'), activeText: '', turnText: 'add [skip-quest-exists: <reason>] to your message' }).block === true);
check('F12 empty-reason bypass does NOT bypass', run({ command: commit('#281392 - x'), activeText: '', turnText: '[skip-quest-exists: ]' }).block === true);
check('F13 heredoc message body → ticket found', run({ command: `git -C ${PLP} commit -m "$(cat <<'EOF'\n#281392 - x\nEOF\n)"`, activeText: '' }).block === true);
check('F14 bash path /e/Dev/etanah-work/etanah-pelupusan → fires', run({ command: commit('#281392 - x', '/e/Dev/etanah-work/etanah-pelupusan'), activeText: '' }).block === true);
check('F15 etanah-awam repo → fires', run({ command: commit('#281392 - x', 'E:\\Projects\\Melaka\\etanah-awam'), activeText: '' }).block === true);
check('F16 non-hotfix branch, ticket mismatch not judged → pass', run({ command: commit('#281392 - x'), branch: 'mlk/esokongan/999999' }).block === false);
check('F17 CRLF active.txt parses', parseBlocks(ACTIVE_OK.replace(/\n/g, '\r\n'))['QA-281392'].task_folder === FOLDER);
check('F18 malformed stdin → exit 0', spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8', timeout: 30000 }).status === 0);
check('F19 git -c key=val commit → fires', run({ command: `git -C ${PLP} -c core.editor=true commit -m "#281392 - x"`, activeText: '' }).block === true);
// F20: end-to-end effect check — the hook binary blocks (exit 2) and the reason reaches stderr
r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: commit('#999998 - eval fixture') } }), encoding: 'utf8', timeout: 30000, env: { ...process.env, QEG_LOG: path.join(require('os').tmpdir(), 'qeg-eval.jsonl') } });
// live work clone may sit on a hotfix branch → either block reason is correct; both name the ticket
check('F20 binary: unknown ticket → exit 2 + reason on stderr', r.status === 2 && /quest-exists-gate: commit for #999998/.test(r.stderr) && /(redmine-sync\.js 999998|hotfix for #)/.test(r.stderr), 'exit=' + r.status + ' err=' + r.stderr.slice(0, 120));

// ═══ ADVERSARIAL SCENARIOS — system-design Rule 12 (verdicts; table displayed at ship)
//  1 own help text in transcript disarms gate ............ fixture-added F11
//  2 empty bypass reason ................................... fixture-added F12
//  3 malformed JSON stdin .................................. fixture-added F18
//  4 heredoc commit message ................................ fixture-added F13
//  5 bash-style /e/ path ................................... fixture-added F14
//  6 git -c option before commit ........................... fixture-added F19
//  7 'git log --grep commit' false fire .................... fixture-added F9
//  8 MemoryCore commit naming a ticket ..................... fixture-added F7
//  9 etanah commit with no ticket (merge/amend) ............ fixture-added F8
// 10 closed-ticket label on a hotfix branch ................ fixture-added F3
// 11 task_folder deleted/moved ............................. fixture-added F5
// 12 released+archived ticket reworked ..................... fixture-added F6
// 13 CRLF active.txt ....................................... fixture-added F17
// 14 worktree session (active.txt lives in main repo) ...... handled: MAIN_ROOT strips .claude/worktrees/<name>
// 15 cd <repo>; git commit (no path in command) ............ accepted-risk: every etanah commit this year used git -C; widen on a logged miss
// 16 git commit -F msgfile ................................. accepted-risk: ticket not visible in the command; never used for etanah
// 17 branch lookup fails (git missing / bad path) .......... handled: branch='' → hotfix check skipped, quest check still runs
// 18 active.txt missing/unreadable ......................... handled: '' → block with the redmine-sync remedy (fail-closed on a commit is cheap: bypass exists)
// 19 hook throws ........................................... handled: runHook fail-open (hook-runtime.js:132)
// 20 two sessions append log.jsonl ......................... accepted-risk: appendFileSync single-line rows; interleave harmless
// 21 user says "just commit it" (instruction reversal) ..... handled: block text names the one-command remedy; bypass needs a written reason
// 22 ADHOC work (no ticket #) .............................. handled: no # → no fire (F8)

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nquest-exists-gate.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
