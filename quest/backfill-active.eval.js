#!/usr/bin/env node
/**
 * backfill-active.eval.js — sandboxed eval for backfill-active.js's Task-folder selection (H-23, 2026-10-03).
 *
 * Temp root carries a COPY of backfill-active.js + lib/states.js, a fixture registry, and a STUB
 * active-cli.js that only records the `start` arguments (read → exit 1 = "no block yet"). Task folders
 * live under a FAKE home; the child runs with USERPROFILE/HOME pointed there. Never touches the real
 * Tasks tree, the real active.txt, Redmine or git.
 *
 * Run: node quest/backfill-active.eval.js      Exit: 0 = all pass, 1 = any fail
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..');
const FAKE_TASKS = ['OneDrive - Pymsoft Sdn Bhd', '1. Tasks'];
const STUB_CLI = `const fs=require('fs'),path=require('path');const a=process.argv.slice(2);
if(a[0]==='read')process.exit(1);
if(a[0]==='start'){fs.appendFileSync(path.join(__dirname,'starts.jsonl'),JSON.stringify(a.slice(1))+'\\n');process.exit(0);}
process.exit(2);\n`;

function makeWorkspace() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-eval-'));
    fs.mkdirSync(path.join(root, 'quest'), { recursive: true });
    fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
    fs.copyFileSync(path.join(REPO_ROOT, 'quest', 'backfill-active.js'), path.join(root, 'quest', 'backfill-active.js'));
    fs.copyFileSync(path.join(REPO_ROOT, 'lib', 'states.js'), path.join(root, 'lib', 'states.js'));
    fs.writeFileSync(path.join(root, 'quest', 'active-cli.js'), STUB_CLI);
    const home = path.join(root, 'home');
    const tasks = path.join(home, ...FAKE_TASKS);
    fs.writeFileSync(path.join(root, 'states.fixture.json'), JSON.stringify({
        reference_state: 'melaka', tasks_root: FAKE_TASKS.join('/'), tasks_root_override: tasks, knowledge_root: 'k', repos_root: 'E:/none',
        states: {
            melaka: { label: 'Melaka', code: 'MLK', aliases: ['Melaka'], permohonan_prefix: 'PTMLK', task_folder: 'Melaka' },
            terengganu: { label: 'Terengganu', code: 'TRG', aliases: ['Terengganu'], permohonan_prefix: 'PTTRG', task_folder: 'Terengganu' },
            selangor: { label: 'Selangor', code: 'SEL', aliases: ['Selangor'], permohonan_prefix: 'PTSEL', task_folder: null },
        },
    }));
    for (const d of [['Melaka', '1. QA #920001 - FAT - PLPS - SDK - melaka fixture'], ['Melaka', 'Archive'],
                     ['Terengganu', '1. ESOKONGAN #920002 - [STG] trg fixture'], ['Terengganu', 'Archive', '9. QA #920009 - archived']]) {
        fs.mkdirSync(path.join(tasks, ...d), { recursive: true });
    }
    return { root, home, tasks };
}
function run(ws, args) {
    const env = { ...process.env, USERPROFILE: ws.home, HOME: ws.home, ETANAH_STATE: '', CLAUDE_PROJECT_DIR: ws.root, STATES_ROOT: ws.root,
                  STATES_FILE: path.join(ws.root, 'states.fixture.json'), STATES_LOCAL_FILE: path.join(ws.root, 'no-states.local.json') };
    const r = spawnSync('node', [path.join(ws.root, 'quest', 'backfill-active.js'), ...args], { encoding: 'utf8', timeout: 15000, cwd: ws.root, env });
    return { stdout: r.stdout || '', stderr: r.stderr || '', exit: r.status };
}
function starts(ws) {
    const p = path.join(ws.root, 'quest', 'starts.jsonl');
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
}

const tests = [
    {
        name: '1. MELAKA default (no flags) → only the Melaka folder, task_folder under Melaka, NO state= field',
        assert: (ws) => {
            const r = run(ws, []);
            const s = starts(ws);
            const want = `task_folder=${path.join(ws.tasks, 'Melaka', '1. QA #920001 - FAT - PLPS - SDK - melaka fixture')}`;
            return { pass: r.exit === 0 && s.length === 1 && s[0][0] === 'QA-920001' && s[0].includes(want) && !s[0].some(f => f.startsWith('state=')) && /1 folders · 1 added/.test(r.stdout),
                     got: `exit=${r.exit} starts=${JSON.stringify(s)}` };
        },
    },
    {
        name: '2. --state terengganu → Terengganu folder only, Archive skipped, block stamped state=Terengganu',
        assert: (ws) => {
            const r = run(ws, ['--state', 'terengganu']);
            const s = starts(ws);
            const want = `task_folder=${path.join(ws.tasks, 'Terengganu', '1. ESOKONGAN #920002 - [STG] trg fixture')}`;
            return { pass: r.exit === 0 && s.length === 1 && s[0][0] === 'QA-920002' && s[0].includes(want) && s[0].includes('state=Terengganu'),
                     got: `exit=${r.exit} starts=${JSON.stringify(s)}` };
        },
    },
    {
        name: '3. --state written capitalised / as code ("Terengganu", "TRG") resolves the same folder',
        assert: (ws) => {
            const a = run(ws, ['--state', 'Terengganu', '--dry-run']);
            const b = run(ws, ['--state', 'TRG', '--dry-run']);
            const want = path.join(ws.tasks, 'Terengganu');
            return { pass: a.exit === 0 && b.exit === 0 && a.stdout.includes(want) && b.stdout.includes(want) && starts(ws).length === 0, got: `exit=${a.exit}/${b.exit}` };
        },
    },
    {
        name: '4. --state atlantis (unregistered) and --state selangor (no Task folder) → exit 2 "state UNKNOWN", nothing written',
        assert: (ws) => {
            const a = run(ws, ['--state', 'atlantis']);
            const b = run(ws, ['--state', 'selangor']);
            return { pass: a.exit === 2 && b.exit === 2 && /state UNKNOWN/.test(a.stderr) && /state UNKNOWN/.test(b.stderr) && starts(ws).length === 0, got: `exit=${a.exit}/${b.exit}` };
        },
    },
    {
        name: '5. --tasks <path> overrides the folder; no --state → no state= field',
        assert: (ws) => {
            const r = run(ws, ['--tasks', path.join(ws.tasks, 'Terengganu')]);
            const s = starts(ws);
            return { pass: r.exit === 0 && s.length === 1 && s[0][0] === 'QA-920002' && !s[0].some(f => f.startsWith('state=')), got: `exit=${r.exit} starts=${JSON.stringify(s)}` };
        },
    },
    {
        name: '6. --dry-run on the Melaka default → prints the Melaka path, starts nothing',
        assert: (ws) => {
            const r = run(ws, ['--dry-run']);
            return { pass: r.exit === 0 && r.stdout.includes(`[dry] start QA-920001 → ${path.join(ws.tasks, 'Melaka')}`) && !/Terengganu/.test(r.stdout) && starts(ws).length === 0, got: `exit=${r.exit}` };
        },
    },
];

let pass = 0, fail = 0;
const results = [];
for (const t of tests) {
    let ws;
    try {
        ws = makeWorkspace();
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

console.log('\n===== backfill-active.js state-folder eval results =====');
for (const r of results) {
    console.log(`  ${r.passed ? '✅' : '🔴'} ${r.name}`);
    if (!r.passed || process.env.VERBOSE) console.log(`     ${r.got}`);
}
console.log(`\nTotal: ${pass}/${results.length} pass · ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
