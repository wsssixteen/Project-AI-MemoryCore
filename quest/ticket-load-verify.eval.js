#!/usr/bin/env node
/**
 * ticket-load-verify.eval.js — fixture-driven eval for the CYCLE line (v1.2, #278699).
 *
 * Builds a fake Tasks root (TLV_TASKS_ROOT) per case with a synced-looking History.txt and
 * numbered cycle folders, runs ticket-load-verify.js, and asserts the "CYCLE:" line.
 *   (1) two reopens + two cycle folders + status Rework   → REWORK cycle 3, no warning
 *   (2) two reopens + ONE cycle folder                     → REWORK cycle 2, no folder warning (v13)
 *   (3) no reopens, no folders, status New                 → NEW
 *   (4) newest folder "3. New"                             → ADDITION
 *   (5) --json carries the cycle object
 *   (6)-(17) v1.3 any-state Task folder: Terengganu / Perak / Archive / active.txt block /
 *            two-state clash / stale block / override — and Melaka output byte-identical
 *
 * Run: node quest/ticket-load-verify.eval.js      Exit: 0 = all green, 1 = any red
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'ticket-load-verify.js');
const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail }); }

function history(status, entries) {
    const head = [
        `Redmine ticket journal — synced 2026-09-14T03:03:35.848Z`,
        `Issue: ESOKONGAN #990001 — eval fixture`,
        `Status: ${status} | Last updated: 2026-09-11T10:55:17Z`,
        `TICKET FIELDS (non-empty only):`,
        `   Module = Pelupusan`,
        `🔗 RELATIONS: none`,
        '─'.repeat(70),
        '',
    ];
    const body = entries.map(e => [`--- ${e.ts} by ${e.by} ---`, ...(e.lines || []), ''].join('\n'));
    return head.join('\n') + body.join('\n') + '\n';
}
function fixture({ status, entries, cycles }) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tlv-eval-'));
    const folder = path.join(root, '7. ES #990001 - eval fixture');
    fs.mkdirSync(path.join(folder, '0. Brief'), { recursive: true });
    fs.mkdirSync(path.join(folder, '2. Fix'), { recursive: true });
    for (const c of cycles) fs.mkdirSync(path.join(folder, c), { recursive: true });
    fs.writeFileSync(path.join(folder, '0. Brief', 'History.txt'), history(status, entries));
    fs.writeFileSync(path.join(folder, '0. Brief', 'Description.txt'), 'Isu: eval\nExpected: eval\n');
    return root;
}
function run(root, extra = []) {
    const r = spawnSync(process.execPath, [SCRIPT, '990001', ...extra], { encoding: 'utf8', timeout: 30000, env: { ...process.env, TLV_TASKS_ROOT: root } });
    return { out: (r.stdout || '') + (r.stderr || ''), status: r.status };
}
const attr = (from, to) => `  [attr] status_id: ${from} → ${to}`;
const twoReopens = [
    { ts: '2026-09-08T02:19:43Z', by: 'ITSO', lines: ['  [attachment] a.png'] },
    { ts: '2026-09-08T12:50:33Z', by: 'Dev', lines: [attr(2, 3)] },
    { ts: '2026-09-09T03:53:49Z', by: 'BA', lines: [attr(3, 23)] },
    { ts: '2026-09-09T18:11:53Z', by: 'Dev', lines: [attr(23, 3)] },
    { ts: '2026-09-11T10:55:17Z', by: 'BA', lines: [attr(3, 23)] },
];

// (1) two reopens + two folders + Rework
{
    const root = fixture({ status: 'Rework', entries: twoReopens, cycles: ['3. Rework', '4. Rework'] });
    fs.writeFileSync(path.join(root, '7. ES #990001 - eval fixture', '0. Brief', 'a.png'), '');
    const r = run(root);
    const line = (r.out.match(/CYCLE:.*/) || [''])[0];
    check('(1) REWORK cycle 3 when 2 reopens + 2 folders', /verdict=REWORK cycle 3$/.test(line) && /folders=3\. Rework · 4\. Rework/.test(line) && /reopens-in-journal=2 \(latest 2026-09-11T10:55:17Z\)/.test(line), line);
    check('(1b) no missing-folder warning', !/cycle folder is missing/.test(r.out) && r.status === 0, 'exit=' + r.status);
    fs.rmSync(root, { recursive: true, force: true });
}
// (2) two reopens + one folder → warning (the 278699 slip)
{
    const root = fixture({ status: 'Rework', entries: twoReopens, cycles: ['3. Rework'] });
    fs.writeFileSync(path.join(root, '7. ES #990001 - eval fixture', '0. Brief', 'a.png'), '');
    const r = run(root);
    const line = (r.out.match(/CYCLE:.*/) || [''])[0];
    // v13 (2026-09-30): cycle folders track OUR deploys; 2 reopens vs 1 folder is normal
    // (a colleague's rework) — no warning, and never a prompt to let the sync make a folder.
    check('(2) 2 reopens vs 1 folder → REWORK cycle 2, no folder warning', /verdict=REWORK cycle 2$/.test(line) && !/cycle folder\(s\) on disk/.test(r.out), line);
    fs.rmSync(root, { recursive: true, force: true });
}
// (3) NEW
{
    const root = fixture({ status: 'New', entries: [{ ts: '2026-09-08T02:19:43Z', by: 'ITSO', lines: [attr(1, 2)] }], cycles: [] });
    const r = run(root);
    const line = (r.out.match(/CYCLE:.*/) || [''])[0];
    check('(3) no reopens + no folders + status New → NEW', /folders=none · reopens-in-journal=0 · verdict=NEW$/.test(line), line);
    fs.rmSync(root, { recursive: true, force: true });
}
// (4) ADDITION
{
    const root = fixture({ status: 'Rework', entries: twoReopens.slice(0, 3), cycles: ['3. New'] });
    const r = run(root);
    const line = (r.out.match(/CYCLE:.*/) || [''])[0];
    check('(4) newest folder "3. New" → ADDITION', /verdict=ADDITION \(cycle 2, newest folder "3\. New"\)/.test(line), line);
    fs.rmSync(root, { recursive: true, force: true });
}
// (5) --json
{
    const root = fixture({ status: 'Rework', entries: twoReopens, cycles: ['3. Rework', '4. Rework'] });
    const r = run(root, ['--json']);
    let ok = false, detail = r.out.slice(0, 200);
    try { const o = JSON.parse(r.out); ok = o.cycle && o.cycle.verdict === 'REWORK cycle 3' && o.cycle.reopens.length === 2 && o.cycle.folders.length === 2 && typeof o.cycle.line === 'string'; detail = JSON.stringify(o.cycle); } catch (_) {}
    check('(5) --json carries cycle {status, folders, reopens, verdict, line}', ok, detail);
    fs.rmSync(root, { recursive: true, force: true });
}

// ---- (6)-(17) v1.3: the Task folder is found for ANY registered state ----
// Sandbox: a temp "1. Tasks" tree named by tasks_root_override in a temp COPY of the registry
// (STATES_FILE), and a temp active.txt (TLV_ACTIVE_FILE). No real Task folder or active.txt is read.
const states = require('../lib/states');
function sandbox() {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'tlv-states-'));
    const tasks = path.join(base, '1. Tasks');
    const reg = JSON.parse(fs.readFileSync(states.REG, 'utf8'));
    reg.tasks_root_override = tasks;
    const regFile = path.join(base, 'states.json');
    fs.writeFileSync(regFile, JSON.stringify(reg));
    const activeFile = path.join(base, 'active.txt');
    fs.writeFileSync(activeFile, 'active:\n\n');
    const dir = key => path.join(tasks, states.get(key).task_folder);
    return { base, tasks, regFile, activeFile, dir };
}
function ticketAt(parent, name, status) {
    const folder = path.join(parent, name);
    fs.mkdirSync(path.join(folder, '0. Brief'), { recursive: true });
    fs.writeFileSync(path.join(folder, '0. Brief', 'History.txt'), history(status || 'New', [{ ts: '2026-09-08T02:19:43Z', by: 'ITSO', lines: [attr(1, 2)] }]));
    fs.writeFileSync(path.join(folder, '0. Brief', 'Description.txt'), 'Isu: eval\nExpected: eval\n');
    return folder;
}
function runIn(sb, extra = [], env = {}) {
    const e = { ...process.env, STATES_FILE: sb.regFile, STATES_LOCAL_FILE: path.join(sb.base, 'none.json'), TLV_ACTIVE_FILE: sb.activeFile, ...env };
    if (!('TLV_TASKS_ROOT' in env)) delete e.TLV_TASKS_ROOT;
    const r = spawnSync(process.execPath, [SCRIPT, '990001', ...extra], { encoding: 'utf8', timeout: 30000, env: e });
    return { stdout: r.stdout || '', out: (r.stdout || '') + (r.stderr || ''), status: r.status };
}
const folderLine = out => (out.match(/^folder : .*$/m) || [''])[0];
const block = (qa, lines) => [`qa=${qa}`, ...lines, ''].join('\n') + '\n';

// (6) Terengganu ticket, no active block → found by the all-states search
{
    const sb = sandbox();
    const f = ticketAt(sb.dir('terengganu'), '1. II #990001 - PLPS - eval');
    const r = runIn(sb);
    check('(6) Terengganu ticket, no block → manifest, exit 0', r.status === 0 && folderLine(r.out) === `folder : ${f}`, 'exit=' + r.status + ' ' + r.out.slice(0, 200));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (7) Terengganu ticket in Terengganu\Archive, bracket characters in the folder name
{
    const sb = sandbox();
    const f = ticketAt(path.join(sb.dir('terengganu'), 'Archive'), '2. [STG] II #990001 - eval (x)');
    const r = runIn(sb);
    check('(7) Terengganu Archive + "[STG]" in the name → [ARCHIVED]', r.status === 0 && folderLine(r.out) === `folder : ${f}   [ARCHIVED]`, 'exit=' + r.status + ' ' + folderLine(r.out));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (8) active.txt block wins: state= capitalised, folder name does NOT carry the number
{
    const sb = sandbox();
    const f = ticketAt(sb.dir('terengganu'), '3. AH - STG - block-only folder');
    fs.appendFileSync(sb.activeFile, block('QA-990001', ['state=Terengganu', `task_folder=${f}`, 'status=active']));
    const r = runIn(sb);
    check('(8) block task_folder (state=Terengganu) → that folder, exit 0', r.status === 0 && folderLine(r.out) === `folder : ${f}`, 'exit=' + r.status + ' ' + r.out.slice(0, 200));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (9) MELAKA UNCHANGED: registry search output === the TLV_TASKS_ROOT (pre-v1.3 path) output, byte for byte
{
    const sb = sandbox();
    const f = ticketAt(sb.dir('melaka'), '7. ES #990001 - eval fixture', 'Rework');
    fs.mkdirSync(path.join(f, '3. Rework'));
    for (const extra of [[], ['--json']]) {
        const viaStates = runIn(sb, extra);
        const viaOverride = runIn(sb, extra, { TLV_TASKS_ROOT: sb.dir('melaka') });
        check(`(9) Melaka ticket ${extra[0] || 'text'}: all-states search == override output, byte-identical`, viaStates.status === 0 && viaOverride.status === 0 && viaStates.stdout.length > 100 && viaStates.stdout === viaOverride.stdout, 'len ' + viaStates.stdout.length + ' vs ' + viaOverride.stdout.length);
    }
    // same ticket with a block that has NO state= line (task_folder only) → still byte-identical
    fs.appendFileSync(sb.activeFile, block('QA-990001', [`task_folder=${f}`, 'status=active']));
    const viaBlock = runIn(sb);
    const viaOverride = runIn(sb, [], { TLV_TASKS_ROOT: sb.dir('melaka') });
    check('(9c) Melaka ticket via block (no state= line) == override output, byte-identical', viaBlock.status === 0 && viaBlock.stdout === viaOverride.stdout, 'len ' + viaBlock.stdout.length + ' vs ' + viaOverride.stdout.length);
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (10) Melaka Archive unchanged
{
    const sb = sandbox();
    ticketAt(path.join(sb.dir('melaka'), 'Archive'), '9. II #990001 - eval');
    const viaStates = runIn(sb);
    const viaOverride = runIn(sb, [], { TLV_TASKS_ROOT: sb.dir('melaka') });
    check('(10) Melaka Archive ticket: byte-identical to override output, [ARCHIVED]', viaStates.status === 0 && viaStates.stdout === viaOverride.stdout && /\[ARCHIVED\]$/.test(folderLine(viaStates.out)), folderLine(viaStates.out));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (11) Perak ticket
{
    const sb = sandbox();
    const f = ticketAt(sb.dir('perak'), '1. II #990001 - PT - eval (PROD)');
    const r = runIn(sb);
    check('(11) Perak ticket → found', r.status === 0 && folderLine(r.out) === `folder : ${f}`, 'exit=' + r.status + ' ' + folderLine(r.out));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (12) nowhere → exit 1, every state root that was searched is named, no state is assumed
{
    const sb = sandbox();
    fs.mkdirSync(sb.dir('melaka'), { recursive: true });
    const r = runIn(sb);
    check('(12) not found → exit 1 naming the Melaka AND Terengganu roots', r.status === 1 && r.out.includes(sb.dir('melaka')) && r.out.includes(sb.dir('terengganu')) && /redmine-sync\.js 990001 --create/.test(r.out) && !/TICKET LOAD MANIFEST/.test(r.out), r.out.slice(0, 400));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (13) the same number under two states: no silent pick → exit 1 "state UNKNOWN"; the block settles it
{
    const sb = sandbox();
    ticketAt(sb.dir('melaka'), '5. AH - mentions 990001 in passing');
    const trg = ticketAt(sb.dir('terengganu'), '6. II #990001 - eval');
    const r = runIn(sb);
    check('(13) number under 2 states, no block → exit 1 "state UNKNOWN"', r.status === 1 && /state UNKNOWN/.test(r.out) && !/TICKET LOAD MANIFEST/.test(r.out), 'exit=' + r.status + ' ' + r.out.slice(0, 200));
    fs.appendFileSync(sb.activeFile, block('QA-990001', ['state=terengganu', `task_folder=${trg}`]));
    const r2 = runIn(sb);
    check('(13b) same, with the block → the block folder', r2.status === 0 && folderLine(r2.out) === `folder : ${trg}`, 'exit=' + r2.status + ' ' + folderLine(r2.out));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (14) stale block (folder moved to Archive, block not updated) and a block with no task_folder= → fall through to the search
{
    const sb = sandbox();
    const f = ticketAt(path.join(sb.dir('terengganu'), 'Archive'), '6. II #990001 - eval');
    fs.appendFileSync(sb.activeFile, block('QA-990001', ['state=terengganu', `task_folder=${path.join(sb.dir('terengganu'), '6. II #990001 - eval')}`]));
    const r = runIn(sb);
    check('(14) block task_folder gone from disk → search finds the Archive copy', r.status === 0 && folderLine(r.out) === `folder : ${f}   [ARCHIVED]`, 'exit=' + r.status + ' ' + folderLine(r.out));
    fs.writeFileSync(sb.activeFile, 'active:\n\n' + block('QA-990001', ['state=terengganu', 'status=hold']));
    const r2 = runIn(sb);
    check('(14b) block without task_folder= → search', r2.status === 0 && folderLine(r2.out) === `folder : ${f}   [ARCHIVED]`, 'exit=' + r2.status + ' ' + folderLine(r2.out));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (15) a block for ANOTHER ticket (QA-9900019) never lends its task_folder; an archived block path flags [ARCHIVED]
{
    const sb = sandbox();
    const other = ticketAt(sb.dir('melaka'), '8. AH - other quest');
    const f = ticketAt(sb.dir('terengganu'), '6. II #990001 - eval');
    fs.appendFileSync(sb.activeFile, block('QA-9900019', ['state=melaka', `task_folder=${other}`]));
    const r = runIn(sb);
    check('(15) qa=QA-9900019 block is not the block for 990001', r.status === 0 && folderLine(r.out) === `folder : ${f}`, 'exit=' + r.status + ' ' + folderLine(r.out));
    const arch = ticketAt(path.join(sb.dir('perak'), 'Archive'), '4. AH - archived block-only');
    fs.writeFileSync(sb.activeFile, 'active:\n\n' + block('QA-990001', ['state=perak', `task_folder=${arch}`]));
    const r2 = runIn(sb);
    check('(15b) block task_folder under Archive → [ARCHIVED]', r2.status === 0 && folderLine(r2.out) === `folder : ${arch}   [ARCHIVED]`, 'exit=' + r2.status + ' ' + folderLine(r2.out));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (16) TLV_TASKS_ROOT still wins over block + registry, with the pre-v1.3 not-found text
{
    const sb = sandbox();
    const f = ticketAt(sb.dir('terengganu'), '6. II #990001 - eval');
    fs.appendFileSync(sb.activeFile, block('QA-990001', ['state=terengganu', `task_folder=${f}`]));
    const empty = path.join(sb.base, 'empty-root');
    fs.mkdirSync(empty);
    const r = runIn(sb, [], { TLV_TASKS_ROOT: empty });
    const want = `⛔ ticket-load-verify: no task folder containing "990001" under\n   ${empty}\n   Run: node quest/redmine-sync.js 990001 --create\n`;
    check('(16) TLV_TASKS_ROOT override: only that root is searched, message unchanged', r.status === 1 && r.out === want, JSON.stringify(r.out));
    fs.rmSync(sb.base, { recursive: true, force: true });
}
// (17) a state whose task_folder is null in the registry (scaffold) and a state root absent from disk are skipped, not fatal
{
    const sb = sandbox();
    const nullStates = Object.values(states.all()).filter(s => !s.task_folder).length;
    const f = ticketAt(sb.dir('terengganu'), '6. II #990001 - eval');
    const r = runIn(sb);
    check(`(17) ${nullStates} state(s) with no Task folder + missing state roots → skipped`, nullStates > 0 && r.status === 0 && folderLine(r.out) === `folder : ${f}`, 'exit=' + r.status + ' null=' + nullStates);
    fs.rmSync(sb.base, { recursive: true, force: true });
}

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : ' → ' + x.detail)); }
console.log('\nticket-load-verify.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
