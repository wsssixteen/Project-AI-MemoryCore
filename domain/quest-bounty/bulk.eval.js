#!/usr/bin/env node
/**
 * bulk.eval.js — sandboxed eval for bulk.js's Archive-folder population (H-23, 2026-10-03).
 *
 * Temp root carries a COPY of bulk.js + lib/states.js and a fixture registry whose tasks_root_override
 * points at temp Task folders. bulk.js is read-only; the sandbox keeps it off the real Tasks tree and
 * the real log.jsonl. Never touches active.txt, Redmine or git.
 *
 * Run: node domain/quest-bounty/bulk.eval.js      Exit: 0 = all pass, 1 = any fail
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function makeWorkspace({ archives }) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bulk-eval-'));
    fs.mkdirSync(path.join(root, 'domain', 'quest-bounty'), { recursive: true });
    fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
    fs.mkdirSync(path.join(root, 'quest'), { recursive: true });
    fs.copyFileSync(path.join(REPO_ROOT, 'domain', 'quest-bounty', 'bulk.js'), path.join(root, 'domain', 'quest-bounty', 'bulk.js'));
    fs.copyFileSync(path.join(REPO_ROOT, 'lib', 'states.js'), path.join(root, 'lib', 'states.js'));
    fs.writeFileSync(path.join(root, 'quest', 'active-archive.txt'), 'active-archive:\n\nqa=QA-930000\nstatus=archived\n\n');
    fs.writeFileSync(path.join(root, 'domain', 'quest-bounty', 'log.jsonl'), JSON.stringify({ qa: 'QA-930000', archive_atomic: true, qa_doc_has_bounty: true }) + '\n');
    const tasks = path.join(root, 'Tasks');
    fs.writeFileSync(path.join(root, 'states.fixture.json'), JSON.stringify({
        reference_state: 'melaka', tasks_root: 'x', tasks_root_override: tasks, knowledge_root: 'k', repos_root: 'E:/none',
        states: {
            melaka: { label: 'Melaka', code: 'MLK', aliases: [], permohonan_prefix: 'PTMLK', task_folder: 'Melaka' },
            terengganu: { label: 'Terengganu', code: 'TRG', aliases: [], permohonan_prefix: 'PTTRG', task_folder: 'Terengganu' },
            perak: { label: 'Perak', code: 'PRK', aliases: [], permohonan_prefix: 'PTPK', task_folder: 'Perak' },
            selangor: { label: 'Selangor', code: 'SEL', aliases: [], permohonan_prefix: 'PTSEL', task_folder: null },
        },
    }));
    for (const [state, names] of Object.entries(archives)) for (const n of names) fs.mkdirSync(path.join(tasks, state, 'Archive', n), { recursive: true });
    return { root };
}
function run(ws) {
    const env = { ...process.env, ETANAH_STATE: '', CLAUDE_PROJECT_DIR: ws.root, STATES_ROOT: ws.root,
                  STATES_FILE: path.join(ws.root, 'states.fixture.json'), STATES_LOCAL_FILE: path.join(ws.root, 'no-states.local.json') };
    const r = spawnSync('node', [path.join(ws.root, 'domain', 'quest-bounty', 'bulk.js'), '--debt'], { encoding: 'utf8', timeout: 15000, cwd: ws.root, env });
    return { stdout: (r.stdout || '').replace(/\r/g, ''), stderr: r.stderr || '', exit: r.status };
}

const tests = [
    {
        name: '1. MELAKA only — Archive folder debt listed exactly as before, no warning',
        setup: () => makeWorkspace({ archives: { Melaka: ['7. QA #930001 - [FAT] melaka fixture', 'not a ticket folder'] } }),
        assert: (ws) => {
            const r = run(ws);
            return { pass: r.exit === 0 && r.stdout === 'QA-930001\n1 unharvested (population: 2 archived quests · 1 logged rows)\n' && !/warn/.test(r.stderr), got: JSON.stringify(r.stdout) + ' ' + r.stderr.trim() };
        },
    },
    {
        name: '2. TERENGGANU + PERAK Archive folders now join the population (were invisible)',
        setup: () => makeWorkspace({ archives: { Melaka: ['7. QA #930001 - melaka'], Terengganu: ['2. ESOKONGAN #930002 - [STG] trg'], Perak: ['1. QA #930003 - prk'] } }),
        assert: (ws) => {
            const r = run(ws);
            return { pass: r.exit === 0 && r.stdout === 'QA-930001\nQA-930002\nQA-930003\n3 unharvested (population: 4 archived quests · 1 logged rows)\n' && !/warn/.test(r.stderr), got: JSON.stringify(r.stdout) };
        },
    },
    {
        name: '3. States with no Archive folder yet (Melaka, Perak here) + a state with no Task folder (Selangor) → skipped silently, no crash',
        setup: () => makeWorkspace({ archives: { Terengganu: ['2. ESOKONGAN #930002 - trg'] } }),
        assert: (ws) => {
            const r = run(ws);
            // (the "unreadable" warning stays tied to the real default Archive path, which a sandbox never reads)
            return { pass: r.exit === 0 && r.stdout === 'QA-930002\n1 unharvested (population: 2 archived quests · 1 logged rows)\n' && !/warn/.test(r.stderr), got: JSON.stringify(r.stdout) + ' ' + r.stderr.trim() };
        },
    },
];

let pass = 0, fail = 0;
const results = [];
for (const t of tests) {
    let ws;
    try {
        ws = t.setup();
        const r = t.assert(ws);
        if (r.pass) pass++; else fail++;
        results.push({ name: t.name, passed: r.pass, got: r.got });
    } catch (e) {
        fail++;
        results.push({ name: t.name, passed: false, got: `EXCEPTION: ${e.message}` });
    } finally {
        if (ws && ws.root) { try { fs.rmSync(ws.root, { recursive: true, force: true }); } catch {} }
    }
}

console.log('\n===== quest-bounty/bulk.js archive-population eval results =====');
for (const r of results) {
    console.log(`  ${r.passed ? '✅' : '🔴'} ${r.name}`);
    if (!r.passed || process.env.VERBOSE) console.log(`     ${r.got}`);
}
console.log(`\nTotal: ${pass}/${results.length} pass · ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
