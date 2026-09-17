#!/usr/bin/env node
/**
 * ticket-load-verify.eval.js — fixture-driven eval for the CYCLE line (v1.2, #278699).
 *
 * Builds a fake Tasks root (TLV_TASKS_ROOT) per case with a synced-looking History.txt and
 * numbered cycle folders, runs ticket-load-verify.js, and asserts the "CYCLE:" line.
 *   (1) two reopens + two cycle folders + status Rework   → REWORK cycle 3, no warning
 *   (2) two reopens + ONE cycle folder (the 278699 slip)   → warning "cycle folder is missing"
 *   (3) no reopens, no folders, status New                 → NEW
 *   (4) newest folder "3. New"                             → ADDITION
 *   (5) --json carries the cycle object
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
    check('(2) 2 reopens vs 1 folder → REWORK cycle 2 + missing-folder warning', /verdict=REWORK cycle 2$/.test(line) && /2 reopen\(s\) in the journal vs 1 cycle folder\(s\)/.test(r.out) && /redmine-sync\.js 990001/.test(r.out), line);
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

let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : ' → ' + x.detail)); }
console.log('\nticket-load-verify.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
