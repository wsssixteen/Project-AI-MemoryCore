#!/usr/bin/env node
/**
 * archive-quest.eval.js — smoke test for archive-quest.js Step 4 (atomic bounty log-line write)
 *
 * Fixture-driven: creates a temp workspace with a mock active.txt block + qa_doc + mock Tasks folder,
 * runs archive-quest.js under that workspace, asserts:
 *   - domain/quest-bounty/log.jsonl received exactly one new line
 *   - the line's `qa_doc_has_bounty` matches whether the qa_doc had `## Bounty`
 *   - re-running (idempotent no-op) does NOT duplicate the line
 *   - --dry-run appends nothing
 *   - missing qa_doc → line with `qa_doc_has_bounty:false`
 *
 * Run: node quest/archive-quest.eval.js
 * Exit: 0 = all pass, 1 = any fail
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..');
const REAL_ARCHIVE = path.join(REPO_ROOT, 'quest', 'archive-quest.js');
const REAL_ACTIVE_CLI = path.join(REPO_ROOT, 'quest', 'active-cli.js');

// State fixtures (tests 10+, 2026-10-03, H-07): the Task folder sits under a FAKE home
// (<root>\home\OneDrive - Pymsoft Sdn Bhd\1. Tasks\<stateFolder>) and the child runs with
// USERPROFILE/HOME pointed there and NO --tasks flag, so the script's own default root resolves
// inside the sandbox — a wrong root can never reach the real Tasks tree. Redmine check is stubbed.
const FAKE_TASKS = ['OneDrive - Pymsoft Sdn Bhd', '1. Tasks'];
const STUB_REDMINE = `module.exports = { checkOne: async () => null, checkAll: async () => [], checkMissing: async () => [] };\n`;
function fixtureRegistry(home) {
    return JSON.stringify({
        reference_state: 'melaka', tasks_root: FAKE_TASKS.join('/'), tasks_root_override: path.join(home, ...FAKE_TASKS),
        knowledge_root: 'k', repos_root: 'E:/none',
        states: {
            melaka: { label: 'Melaka', code: 'MLK', aliases: ['Melaka'], permohonan_prefix: 'PTMLK', task_folder: 'Melaka' },
            terengganu: { label: 'Terengganu', code: 'TRG', aliases: ['Terengganu'], permohonan_prefix: 'PTTRG', task_folder: 'Terengganu' },
            selangor: { label: 'Selangor', code: 'SEL', aliases: ['Selangor'], permohonan_prefix: 'PTSEL', task_folder: null },
        },
    });
}

function makeWorkspace({ qa, hasBounty, alsoArchived, stateFolder, state, folderName, noTaskFolder, startInArchive }) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-eval-'));
    fs.mkdirSync(path.join(root, 'quest'), { recursive: true });
    fs.mkdirSync(path.join(root, 'domain', 'quest-bounty'), { recursive: true });

    // Copy the real scripts into the temp workspace (they resolve REPO_ROOT via __dirname/..).
    // Copy EVERY non-eval quest/*.js so sibling requires resolve (active-cli now requires
    // ./redmine-status-check — copying only 2 files broke the harness with MODULE_NOT_FOUND).
    const realQuestDir = path.join(REPO_ROOT, 'quest');
    for (const f of fs.readdirSync(realQuestDir)) {
        if (f.endsWith('.js') && !f.endsWith('.eval.js')) {
            fs.copyFileSync(path.join(realQuestDir, f), path.join(root, 'quest', f));
        }
    }

    // Fake Tasks root (avoids touching the real OneDrive folder)
    const home = path.join(root, 'home');
    const tasksRoot = stateFolder ? path.join(home, ...FAKE_TASKS, stateFolder) : path.join(root, 'Tasks');
    const taskFolderName = folderName || `99. QA #${qa.replace(/^QA-/, '')} - Test - eval fixture`;
    const taskFolderPath = startInArchive ? path.join(tasksRoot, 'Archive', taskFolderName) : path.join(tasksRoot, taskFolderName);
    if (!alsoArchived) {
        fs.mkdirSync(taskFolderPath, { recursive: true });
    } else {
        fs.mkdirSync(path.join(tasksRoot, 'Archive', taskFolderName), { recursive: true });
    }
    if (stateFolder) {
        fs.mkdirSync(home, { recursive: true });
        fs.writeFileSync(path.join(root, 'quest', 'redmine-status-check.js'), STUB_REDMINE);
        fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
        fs.copyFileSync(path.join(REPO_ROOT, 'lib', 'states.js'), path.join(root, 'lib', 'states.js'));
        fs.writeFileSync(path.join(root, 'states.fixture.json'), fixtureRegistry(home));
    }

    // active.txt block (or active-archive.txt if alsoArchived)
    const blockLines = [
        `qa=${qa}`,
        ...(noTaskFolder ? [] : [`task_folder=${alsoArchived ? path.join(tasksRoot, 'Archive', taskFolderName) : taskFolderPath}`]),
        ...(state ? [`state=${state}`] : []),
        `phase=1`,
        `status=${alsoArchived ? 'archived' : 'closed'}`,
        `ticket_type=bug`,
        `env=Test`,
        `issue_one_liner=eval fixture`,
        `commit=abc123def4`,
        `branch=mlk/test/eval`,
    ];
    if (alsoArchived) {
        blockLines.push(`qa_doc=projects/coding-projects/archive/${qa}/${qa}.md`);
        const archiveTxt = path.join(root, 'quest', 'active-archive.txt');
        fs.writeFileSync(archiveTxt, `active-archive:\n\n${blockLines.join('\n')}\n\n`);
        fs.writeFileSync(path.join(root, 'quest', 'active.txt'), 'active:\n\n');
    } else {
        fs.writeFileSync(path.join(root, 'quest', 'active.txt'), `active:\n\n${blockLines.join('\n')}\n\n`);
        fs.writeFileSync(path.join(root, 'quest', 'active-archive.txt'), 'active-archive:\n\n');
    }

    // qa_doc — content depends on fixture
    if (hasBounty !== 'skip-doc') {
        const projDir = alsoArchived
            ? path.join(root, 'projects', 'coding-projects', 'archive', qa)
            : path.join(root, 'projects', 'coding-projects', 'active',  qa);
        fs.mkdirSync(projDir, { recursive: true });
        const body = hasBounty
            ? `# ${qa}\n\nsome content\n\n## Bounty (eval fixture)\n- Harvest — Quest: fixture\n- Refinement: none\n`
            : `# ${qa}\n\nsome content\n\n## Debugging\ncontent without bounty\n`;
        fs.writeFileSync(path.join(projDir, `${qa}.md`), body);
    }

    return { root, tasksRoot, taskFolderPath, home, taskFolderName };
}

function runArchive({ root, qa, tasksRoot, dryRun = false, allowStub = true, home, noTasksFlag = false, tasksFlag }) {
    // 2026-08-16 contract change: Step -1 HARVEST GATE refuses no-bounty archives unless
    // --allow-stub. Fixtures default to the audited-stub path (the new shape of the old
    // stub flow); test 8 asserts the refusal itself with allowStub=false.
    const args = [path.join(root, 'quest', 'archive-quest.js'), qa];
    if (!noTasksFlag) args.push('--tasks', tasksFlag || tasksRoot);
    if (allowStub) args.push('--allow-stub', 'eval-fixture');
    if (dryRun) args.push('--dry-run');
    const opts = { encoding: 'utf8', timeout: 15000, cwd: root };
    if (noTasksFlag) {
        // No --tasks = the script picks the root itself → fake home + fixture registry, never the real ones.
        opts.env = { ...process.env, USERPROFILE: home, HOME: home, ETANAH_STATE: '', CLAUDE_PROJECT_DIR: root, STATES_ROOT: root,
                     STATES_FILE: path.join(root, 'states.fixture.json'), STATES_LOCAL_FILE: path.join(root, 'no-states.local.json') };
    }
    const r = spawnSync('node', args, opts);
    return { stdout: r.stdout || '', stderr: r.stderr || '', exit: r.status };
}

// Archived block's task_folder= as written by Step 3.
function archivedTaskFolder(root) {
    const m = fs.readFileSync(path.join(root, 'quest', 'active-archive.txt'), 'utf8').match(/^task_folder=(.*)$/m);
    return m ? m[1].trim() : null;
}
function fakeTasks(ws, stateFolder) { return path.join(ws.home, ...FAKE_TASKS, stateFolder); }
function sameFile(a, b) { return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase(); }

function readLog(root) {
    const p = path.join(root, 'domain', 'quest-bounty', 'log.jsonl');
    if (!fs.existsSync(p)) return [];
    return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => {
        try { return JSON.parse(l); } catch { return { PARSE_ERR: l }; }
    });
}

const tests = [
    {
        name: '1. Fresh archive + qa_doc HAS ## Bounty → log line with qa_doc_has_bounty=true',
        setup: () => makeWorkspace({ qa: 'QA-900001', hasBounty: true, alsoArchived: false }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900001' });
            const log = readLog(ws.root);
            return {
                pass: r.exit === 0 && log.length === 1 && log[0].qa === 'QA-900001'
                      && log[0].qa_doc_has_bounty === true && log[0].archive_atomic === true,
                got: `exit=${r.exit} lines=${log.length} hasBounty=${log[0]?.qa_doc_has_bounty}`,
            };
        },
    },
    {
        name: '2. Fresh archive + qa_doc missing ## Bounty → log line with qa_doc_has_bounty=false',
        setup: () => makeWorkspace({ qa: 'QA-900002', hasBounty: false, alsoArchived: false }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900002' });
            const log = readLog(ws.root);
            return {
                pass: r.exit === 0 && log.length === 1 && log[0].qa_doc_has_bounty === false
                      && /qa_doc has no ## Bounty/.test(r.stdout),
                got: `exit=${r.exit} lines=${log.length} hasBounty=${log[0]?.qa_doc_has_bounty} stubMsg=${/qa_doc has no ## Bounty/.test(r.stdout)}`,
            };
        },
    },
    {
        name: '3. Fresh archive + qa_doc file missing on disk → log line with qa_doc_has_bounty=false',
        setup: () => makeWorkspace({ qa: 'QA-900003', hasBounty: 'skip-doc', alsoArchived: false }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900003' });
            const log = readLog(ws.root);
            return {
                pass: r.exit === 0 && log.length === 1 && log[0].qa_doc_has_bounty === false,
                got: `exit=${r.exit} lines=${log.length} hasBounty=${log[0]?.qa_doc_has_bounty}`,
            };
        },
    },
    {
        name: '4. Re-run on already-archived quest → NO new log line',
        setup: () => makeWorkspace({ qa: 'QA-900004', hasBounty: true, alsoArchived: true }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900004' });
            const log = readLog(ws.root);
            return {
                pass: r.exit === 0 && log.length === 0 && /no-op archive/.test(r.stdout),
                got: `exit=${r.exit} lines=${log.length} noOp=${/no-op archive/.test(r.stdout)}`,
            };
        },
    },
    {
        name: '5. --dry-run appends NO log line',
        setup: () => makeWorkspace({ qa: 'QA-900005', hasBounty: true, alsoArchived: false }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900005', dryRun: true });
            const log = readLog(ws.root);
            return {
                pass: r.exit === 0 && log.length === 0 && /\[dry\] Step 4/.test(r.stdout),
                got: `exit=${r.exit} lines=${log.length} dryEmit=${/\[dry\] Step 4/.test(r.stdout)}`,
            };
        },
    },
    {
        name: '6. Log line records commit + branch from block',
        setup: () => makeWorkspace({ qa: 'QA-900006', hasBounty: true, alsoArchived: false }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900006' });
            const log = readLog(ws.root);
            return {
                pass: r.exit === 0 && log[0]?.commit === 'abc123def4' && log[0]?.branch === 'mlk/test/eval',
                got: `commit=${log[0]?.commit} branch=${log[0]?.branch}`,
            };
        },
    },
    {
        name: '7. Running fresh archive TWICE in a row → 1 log line (2nd run is no-op)',
        setup: () => makeWorkspace({ qa: 'QA-900007', hasBounty: true, alsoArchived: false }),
        assert: (ws) => {
            runArchive({ ...ws, qa: 'QA-900007' });   // first (real archive)
            const r2 = runArchive({ ...ws, qa: 'QA-900007' }); // second (no-op)
            const log = readLog(ws.root);
            return {
                pass: log.length === 1 && r2.exit === 0,
                got: `linesAfter2Runs=${log.length} exit2=${r2.exit}`,
            };
        },
    },
    {
        name: '8. NEW CONTRACT: no bounty + NO --allow-stub → HARVEST GATE refuses exit 3 + refusal log line',
        setup: () => makeWorkspace({ qa: 'QA-900008', hasBounty: false, alsoArchived: false }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900008', allowStub: false });
            const log = readLog(ws.root);
            const refusal = log.find(l => l.gate === 'harvest-gate' && l.action === 'refused');
            return {
                pass: r.exit === 3 && !!refusal && refusal.qa === 'QA-900008',
                got: `exit=${r.exit} refusalLogged=${!!refusal}`,
            };
        },
    },
    {
        name: '9. Video prune — .mp4 in Brief + Fix deleted, non-video kept, hygiene line reports pruned 2',
        setup: () => makeWorkspace({ qa: 'QA-900009', hasBounty: true, alsoArchived: false }),
        assert: (ws) => {
            const brief = path.join(ws.taskFolderPath, '0. Brief');
            const fix = path.join(ws.taskFolderPath, '2. Fix');
            fs.mkdirSync(brief, { recursive: true });
            fs.mkdirSync(fix, { recursive: true });
            fs.writeFileSync(path.join(brief, 'demo.mp4'), 'x'.repeat(1000));
            fs.writeFileSync(path.join(fix, 'evidence.MP4'), 'y'.repeat(2000)); // case-insensitive ext
            fs.writeFileSync(path.join(brief, 'note.txt'), 'keep me');
            const r = runArchive({ ...ws, qa: 'QA-900009' });
            const archived = path.join(ws.tasksRoot, 'Archive', path.basename(ws.taskFolderPath));
            const briefMp4 = fs.existsSync(path.join(archived, '0. Brief', 'demo.mp4'));
            const fixMp4 = fs.existsSync(path.join(archived, '2. Fix', 'evidence.MP4'));
            const txtKept = fs.existsSync(path.join(archived, '0. Brief', 'note.txt'));
            return {
                pass: r.exit === 0 && !briefMp4 && !fixMp4 && txtKept && /videos pruned 2/.test(r.stdout),
                got: `exit=${r.exit} briefMp4=${briefMp4} fixMp4=${fixMp4} txtKept=${txtKept} line=${/videos pruned 2/.test(r.stdout)}`,
            };
        },
    },
    // ── State-aware archive root (H-07) — no --tasks flag, fake home ──
    {
        name: '10. TERENGGANU quest (state=Terengganu, bracket folder name) → Terengganu\\Archive, never Melaka\\Archive',
        setup: () => makeWorkspace({ qa: 'QA-900010', hasBounty: true, alsoArchived: false, stateFolder: 'Terengganu', state: 'Terengganu',
                                     folderName: '3. ESOKONGAN #900010 - [STG] - PLPS - eval fixture' }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900010', noTasksFlag: true });
            const want = path.join(fakeTasks(ws, 'Terengganu'), 'Archive', ws.taskFolderName);
            const moved = fs.existsSync(want) && !fs.existsSync(ws.taskFolderPath);
            const melakaTouched = fs.existsSync(fakeTasks(ws, 'Melaka'));
            const tf = archivedTaskFolder(ws.root);
            return {
                pass: r.exit === 0 && moved && !melakaTouched && tf === want && r.stdout.includes(`Tasks root: ${fakeTasks(ws, 'Terengganu')}`),
                got: `exit=${r.exit} moved=${moved} melakaTouched=${melakaTouched} task_folder=${tf}`,
            };
        },
    },
    {
        name: '11. MELAKA quest (no state= field) → DEFAULT root: same header + same Melaka\\Archive path as before',
        setup: () => makeWorkspace({ qa: 'QA-900011', hasBounty: true, alsoArchived: false, stateFolder: 'Melaka' }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900011', noTasksFlag: true });
            const def = fakeTasks(ws, 'Melaka'); // = the script's DEFAULT_TASKS under the fake home
            const want = path.join(def, 'Archive', ws.taskFolderName);
            const tf = archivedTaskFolder(ws.root);
            return {
                pass: r.exit === 0 && fs.existsSync(want) && tf === want && r.stdout.includes(`Tasks root: ${def}\n`) && !/state UNKNOWN/.test(r.stdout),
                got: `exit=${r.exit} exists=${fs.existsSync(want)} task_folder=${tf}`,
            };
        },
    },
    {
        name: '12. MELAKA task_folder written lower-case → root snaps to the DEFAULT spelling (byte-identical dst)',
        setup: () => makeWorkspace({ qa: 'QA-900012', hasBounty: true, alsoArchived: false, stateFolder: 'Melaka' }),
        assert: (ws) => {
            const p = path.join(ws.root, 'quest', 'active.txt');
            fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(ws.taskFolderPath, path.join(path.dirname(ws.taskFolderPath).toLowerCase(), ws.taskFolderName)));
            const r = runArchive({ ...ws, qa: 'QA-900012', noTasksFlag: true });
            const want = path.join(fakeTasks(ws, 'Melaka'), 'Archive', ws.taskFolderName);
            const tf = archivedTaskFolder(ws.root);
            return { pass: r.exit === 0 && tf === want && fs.existsSync(want), got: `exit=${r.exit} task_folder=${tf}` };
        },
    },
    {
        name: '13. PERAK folder, block has NO state= → root from task_folder dirname → Perak\\Archive',
        setup: () => makeWorkspace({ qa: 'QA-900013', hasBounty: true, alsoArchived: false, stateFolder: 'Perak' }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900013', noTasksFlag: true });
            const want = path.join(fakeTasks(ws, 'Perak'), 'Archive', ws.taskFolderName);
            const tf = archivedTaskFolder(ws.root);
            return { pass: r.exit === 0 && fs.existsSync(want) && tf === want && !fs.existsSync(fakeTasks(ws, 'Melaka')), got: `exit=${r.exit} task_folder=${tf}` };
        },
    },
    {
        name: '14. Folder ALREADY under Terengganu\\Archive (block still active) → no move, no Archive\\Archive, root = Terengganu',
        setup: () => makeWorkspace({ qa: 'QA-900014', hasBounty: true, alsoArchived: false, stateFolder: 'Terengganu', state: 'terengganu', startInArchive: true }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900014', noTasksFlag: true });
            const tf = archivedTaskFolder(ws.root);
            const nested = fs.existsSync(path.join(fakeTasks(ws, 'Terengganu'), 'Archive', 'Archive'));
            return {
                pass: r.exit === 0 && tf === ws.taskFolderPath && fs.existsSync(ws.taskFolderPath) && !nested && r.stdout.includes(`Tasks root: ${fakeTasks(ws, 'Terengganu')}\n`),
                got: `exit=${r.exit} task_folder=${tf} nested=${nested}`,
            };
        },
    },
    {
        name: '15. --tasks override still WINS over the block (Terengganu block + explicit root)',
        setup: () => makeWorkspace({ qa: 'QA-900015', hasBounty: true, alsoArchived: false, stateFolder: 'Terengganu', state: 'Terengganu' }),
        assert: (ws) => {
            const other = path.join(ws.root, 'Override');
            const r = runArchive({ ...ws, qa: 'QA-900015', tasksFlag: other });
            const want = path.join(other, 'Archive', ws.taskFolderName);
            return { pass: r.exit === 0 && fs.existsSync(want) && archivedTaskFolder(ws.root) === want, got: `exit=${r.exit} exists=${fs.existsSync(want)}` };
        },
    },
    {
        name: '16. --dry-run on a Terengganu quest → previews Terengganu\\Archive, moves nothing',
        setup: () => makeWorkspace({ qa: 'QA-900016', hasBounty: true, alsoArchived: false, stateFolder: 'Terengganu', state: 'Terengganu' }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900016', noTasksFlag: true, dryRun: true });
            const want = path.join(fakeTasks(ws, 'Terengganu'), 'Archive', ws.taskFolderName);
            return {
                pass: r.exit === 0 && r.stdout.includes(`→ ${want}`) && fs.existsSync(ws.taskFolderPath) && !fs.existsSync(want),
                got: `exit=${r.exit} preview=${r.stdout.includes(`→ ${want}`)} stillThere=${fs.existsSync(ws.taskFolderPath)}`,
            };
        },
    },
    {
        name: '17. NO task_folder= + state=Terengganu → root from lib/states.js taskFolder (registry fallback)',
        setup: () => makeWorkspace({ qa: 'QA-900017', hasBounty: true, alsoArchived: false, stateFolder: 'Terengganu', state: 'Terengganu', noTaskFolder: true }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900017', noTasksFlag: true, dryRun: true });
            return {
                pass: r.exit === 0 && r.stdout.includes(`Tasks root: ${fakeTasks(ws, 'Terengganu')}\n`) && /no task_folder= field/.test(r.stdout),
                got: `exit=${r.exit} out=${r.stdout.split('\n').slice(0, 4).join(' | ')}`,
            };
        },
    },
    {
        name: '18. NO task_folder= + state=Atlantis (unregistered) → says "state UNKNOWN", keeps the default root, moves nothing',
        setup: () => makeWorkspace({ qa: 'QA-900018', hasBounty: true, alsoArchived: false, stateFolder: 'Terengganu', state: 'Atlantis', noTaskFolder: true }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900018', noTasksFlag: true, dryRun: true });
            return {
                pass: r.exit === 0 && /state UNKNOWN — state=Atlantis/.test(r.stdout) && r.stdout.includes(`Tasks root: ${fakeTasks(ws, 'Melaka')}\n`) && fs.existsSync(ws.taskFolderPath),
                got: `exit=${r.exit} unknown=${/state UNKNOWN/.test(r.stdout)}`,
            };
        },
    },
    {
        name: '19. state=Terengganu but task_folder sits under Melaka (mis-filed) → archived IN PLACE (Melaka\\Archive), folder never crosses states',
        setup: () => makeWorkspace({ qa: 'QA-900019', hasBounty: true, alsoArchived: false, stateFolder: 'Melaka', state: 'Terengganu' }),
        assert: (ws) => {
            const r = runArchive({ ...ws, qa: 'QA-900019', noTasksFlag: true });
            const want = path.join(fakeTasks(ws, 'Melaka'), 'Archive', ws.taskFolderName);
            return { pass: r.exit === 0 && fs.existsSync(want) && !fs.existsSync(fakeTasks(ws, 'Terengganu')), got: `exit=${r.exit} exists=${fs.existsSync(want)}` };
        },
    },
    {
        name: '20. Terengganu task_folder= path missing on disk → nothing moved, task_folder= untouched, no Melaka path written',
        setup: () => makeWorkspace({ qa: 'QA-900020', hasBounty: true, alsoArchived: false, stateFolder: 'Terengganu', state: 'Terengganu' }),
        assert: (ws) => {
            fs.rmSync(ws.taskFolderPath, { recursive: true, force: true });
            const r = runArchive({ ...ws, qa: 'QA-900020', noTasksFlag: true });
            const tf = archivedTaskFolder(ws.root);
            return { pass: r.exit === 0 && /does not exist on disk/.test(r.stdout) && sameFile(tf, ws.taskFolderPath) && !/Melaka/.test(tf), got: `exit=${r.exit} task_folder=${tf}` };
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

console.log('\n===== archive-quest.js Step 4 eval results =====');
for (const r of results) {
    console.log(`  ${r.passed ? '✅' : '🔴'} ${r.name}`);
    if (!r.passed || process.env.VERBOSE) console.log(`     ${r.got}`);
}
console.log(`\nTotal: ${pass}/${results.length} pass · ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
