#!/usr/bin/env node
/**
 * delegate-quest.eval.js — sandboxed eval for delegate-quest.js's archive root (H-07, 2026-10-03).
 *
 * Same sandbox as archive-quest.eval.js: quest/*.js copied to a temp root, active.txt written there,
 * Task folders under a FAKE home (<root>\home\OneDrive - Pymsoft Sdn Bhd\1. Tasks\<State>), child run with
 * USERPROFILE/HOME pointed at it and a fixture registry. Redmine check stubbed. Never touches the real
 * Tasks tree, the real active.txt, Redmine or git.
 *
 * Run: node quest/delegate-quest.eval.js      Exit: 0 = all pass, 1 = any fail
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..');
const FAKE_TASKS = ['OneDrive - Pymsoft Sdn Bhd', '1. Tasks'];
const STUB_REDMINE = `module.exports = { checkOne: async () => null, checkAll: async () => [], checkMissing: async () => [] };\n`;

function makeWorkspace({ qa, stateFolder, state, folderName, noTaskFolder, startInArchive }) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'delegate-eval-'));
    fs.mkdirSync(path.join(root, 'quest'), { recursive: true });
    for (const f of fs.readdirSync(path.join(REPO_ROOT, 'quest'))) {
        if (f.endsWith('.js') && !f.endsWith('.eval.js')) fs.copyFileSync(path.join(REPO_ROOT, 'quest', f), path.join(root, 'quest', f));
    }
    fs.writeFileSync(path.join(root, 'quest', 'redmine-status-check.js'), STUB_REDMINE);
    fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
    fs.copyFileSync(path.join(REPO_ROOT, 'lib', 'states.js'), path.join(root, 'lib', 'states.js'));
    const home = path.join(root, 'home');
    fs.writeFileSync(path.join(root, 'states.fixture.json'), JSON.stringify({
        reference_state: 'melaka', tasks_root: FAKE_TASKS.join('/'), tasks_root_override: path.join(home, ...FAKE_TASKS),
        knowledge_root: 'k', repos_root: 'E:/none',
        states: {
            melaka: { label: 'Melaka', code: 'MLK', aliases: ['Melaka'], permohonan_prefix: 'PTMLK', task_folder: 'Melaka' },
            terengganu: { label: 'Terengganu', code: 'TRG', aliases: ['Terengganu'], permohonan_prefix: 'PTTRG', task_folder: 'Terengganu' },
        },
    }));
    const tasksRoot = path.join(home, ...FAKE_TASKS, stateFolder);
    const taskFolderName = folderName || `99. QA #${qa.replace(/^QA-/, '')} - Test - eval fixture`;
    const taskFolderPath = startInArchive ? path.join(tasksRoot, 'Archive', taskFolderName) : path.join(tasksRoot, taskFolderName);
    fs.mkdirSync(taskFolderPath, { recursive: true });
    const block = [`qa=${qa}`, ...(noTaskFolder ? [] : [`task_folder=${taskFolderPath}`]), ...(state ? [`state=${state}`] : []),
        'phase=1', 'status=active', 'ticket_type=bug', 'issue_one_liner=eval fixture'];
    fs.writeFileSync(path.join(root, 'quest', 'active.txt'), `active:\n\n${block.join('\n')}\n\n`);
    fs.writeFileSync(path.join(root, 'quest', 'active-archive.txt'), 'active-archive:\n\n');
    return { root, home, tasksRoot, taskFolderPath, taskFolderName };
}
function run(ws, qa, extra) {
    const env = { ...process.env, USERPROFILE: ws.home, HOME: ws.home, ETANAH_STATE: '', CLAUDE_PROJECT_DIR: ws.root, STATES_ROOT: ws.root,
                  STATES_FILE: path.join(ws.root, 'states.fixture.json'), STATES_LOCAL_FILE: path.join(ws.root, 'no-states.local.json') };
    const r = spawnSync('node', [path.join(ws.root, 'quest', 'delegate-quest.js'), qa, 'Ammar', ...(extra || [])], { encoding: 'utf8', timeout: 15000, cwd: ws.root, env });
    return { stdout: r.stdout || '', stderr: r.stderr || '', exit: r.status };
}
function fakeTasks(ws, stateFolder) { return path.join(ws.home, ...FAKE_TASKS, stateFolder); }
function archivedField(ws, key) {
    const m = fs.readFileSync(path.join(ws.root, 'quest', 'active-archive.txt'), 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'));
    return m ? m[1].trim() : null;
}

const tests = [
    {
        name: '1. TERENGGANU quest (state=Terengganu, bracket folder name) → Terengganu\\Archive, status=delegated, never Melaka',
        setup: () => makeWorkspace({ qa: 'QA-910001', stateFolder: 'Terengganu', state: 'Terengganu', folderName: '4. ESOKONGAN #910001 - [STG] - PLPS - eval fixture' }),
        assert: (ws) => {
            const r = run(ws, 'QA-910001');
            const want = path.join(fakeTasks(ws, 'Terengganu'), 'Archive', ws.taskFolderName);
            const tf = archivedField(ws, 'task_folder');
            return {
                pass: r.exit === 0 && fs.existsSync(want) && !fs.existsSync(ws.taskFolderPath) && !fs.existsSync(fakeTasks(ws, 'Melaka')) && tf === want
                      && archivedField(ws, 'status') === 'delegated' && r.stdout.includes(`Tasks root: ${fakeTasks(ws, 'Terengganu')}\n`),
                got: `exit=${r.exit} task_folder=${tf} status=${archivedField(ws, 'status')} err=${r.stderr.trim().slice(0, 200)}`,
            };
        },
    },
    {
        name: '2. MELAKA quest (no state= field) → DEFAULT root: same header + same Melaka\\Archive path as before',
        setup: () => makeWorkspace({ qa: 'QA-910002', stateFolder: 'Melaka' }),
        assert: (ws) => {
            const r = run(ws, 'QA-910002');
            const def = fakeTasks(ws, 'Melaka');
            const want = path.join(def, 'Archive', ws.taskFolderName);
            const tf = archivedField(ws, 'task_folder');
            return { pass: r.exit === 0 && fs.existsSync(want) && tf === want && r.stdout.includes(`Tasks root: ${def}\n`) && !/state UNKNOWN/.test(r.stdout),
                     got: `exit=${r.exit} task_folder=${tf}` };
        },
    },
    {
        name: '3. PERAK folder, block has NO state= → Perak\\Archive',
        setup: () => makeWorkspace({ qa: 'QA-910003', stateFolder: 'Perak' }),
        assert: (ws) => {
            const r = run(ws, 'QA-910003');
            const want = path.join(fakeTasks(ws, 'Perak'), 'Archive', ws.taskFolderName);
            return { pass: r.exit === 0 && fs.existsSync(want) && archivedField(ws, 'task_folder') === want && !fs.existsSync(fakeTasks(ws, 'Melaka')),
                     got: `exit=${r.exit} task_folder=${archivedField(ws, 'task_folder')}` };
        },
    },
    {
        name: '4. --tasks override still WINS over the block',
        setup: () => makeWorkspace({ qa: 'QA-910004', stateFolder: 'Terengganu', state: 'Terengganu' }),
        assert: (ws) => {
            const other = path.join(ws.root, 'Override');
            const r = run(ws, 'QA-910004', ['--tasks', other]);
            const want = path.join(other, 'Archive', ws.taskFolderName);
            return { pass: r.exit === 0 && fs.existsSync(want) && archivedField(ws, 'task_folder') === want, got: `exit=${r.exit} exists=${fs.existsSync(want)}` };
        },
    },
    {
        name: '5. --dry-run on a Terengganu quest → previews Terengganu\\Archive, moves nothing, block stays active',
        setup: () => makeWorkspace({ qa: 'QA-910005', stateFolder: 'Terengganu', state: 'Terengganu' }),
        assert: (ws) => {
            const r = run(ws, 'QA-910005', ['--dry-run']);
            const want = path.join(fakeTasks(ws, 'Terengganu'), 'Archive', ws.taskFolderName);
            return { pass: r.exit === 0 && r.stdout.includes(`→ ${want}`) && fs.existsSync(ws.taskFolderPath) && !fs.existsSync(want) && archivedField(ws, 'status') === null,
                     got: `exit=${r.exit} preview=${r.stdout.includes(`→ ${want}`)}` };
        },
    },
    {
        name: '6. Folder ALREADY under Terengganu\\Archive → no move, no Archive\\Archive, root = Terengganu',
        setup: () => makeWorkspace({ qa: 'QA-910006', stateFolder: 'Terengganu', state: 'terengganu', startInArchive: true }),
        assert: (ws) => {
            const r = run(ws, 'QA-910006');
            const nested = fs.existsSync(path.join(fakeTasks(ws, 'Terengganu'), 'Archive', 'Archive'));
            return { pass: r.exit === 0 && archivedField(ws, 'task_folder') === ws.taskFolderPath && !nested && r.stdout.includes(`Tasks root: ${fakeTasks(ws, 'Terengganu')}\n`),
                     got: `exit=${r.exit} nested=${nested} task_folder=${archivedField(ws, 'task_folder')}` };
        },
    },
    {
        name: '7. NO task_folder= + state=Terengganu → root from lib/states.js taskFolder; state=Atlantis → "state UNKNOWN"',
        setup: () => makeWorkspace({ qa: 'QA-910007', stateFolder: 'Terengganu', state: 'Terengganu', noTaskFolder: true }),
        assert: (ws) => {
            const r1 = run(ws, 'QA-910007', ['--dry-run']);
            const p = path.join(ws.root, 'quest', 'active.txt');
            fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('state=Terengganu', 'state=Atlantis'));
            const r2 = run(ws, 'QA-910007', ['--dry-run']);
            return {
                pass: r1.exit === 0 && r1.stdout.includes(`Tasks root: ${fakeTasks(ws, 'Terengganu')}\n`)
                      && r2.exit === 0 && /state UNKNOWN — state=Atlantis/.test(r2.stdout) && r2.stdout.includes(`Tasks root: ${fakeTasks(ws, 'Melaka')}\n`),
                got: `exit=${r1.exit}/${r2.exit} unknown=${/state UNKNOWN/.test(r2.stdout)}`,
            };
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

console.log('\n===== delegate-quest.js archive-root eval results =====');
for (const r of results) {
    console.log(`  ${r.passed ? '✅' : '🔴'} ${r.name}`);
    if (!r.passed || process.env.VERBOSE) console.log(`     ${r.got}`);
}
console.log(`\nTotal: ${pass}/${results.length} pass · ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
