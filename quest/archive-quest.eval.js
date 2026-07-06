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

function makeWorkspace({ qa, hasBounty, alsoArchived }) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-eval-'));
    fs.mkdirSync(path.join(root, 'quest'), { recursive: true });
    fs.mkdirSync(path.join(root, 'domain', 'quest-bounty'), { recursive: true });

    // Copy the real scripts into the temp workspace (they resolve REPO_ROOT via __dirname/..)
    fs.copyFileSync(REAL_ARCHIVE, path.join(root, 'quest', 'archive-quest.js'));
    fs.copyFileSync(REAL_ACTIVE_CLI, path.join(root, 'quest', 'active-cli.js'));

    // Fake Tasks root (avoids touching the real OneDrive folder)
    const tasksRoot = path.join(root, 'Tasks');
    const taskFolderName = `99. QA #${qa.replace(/^QA-/, '')} - Test - eval fixture`;
    const taskFolderPath = path.join(tasksRoot, taskFolderName);
    if (!alsoArchived) {
        fs.mkdirSync(taskFolderPath, { recursive: true });
    } else {
        fs.mkdirSync(path.join(tasksRoot, 'Archive', taskFolderName), { recursive: true });
    }

    // active.txt block (or active-archive.txt if alsoArchived)
    const blockLines = [
        `qa=${qa}`,
        `task_folder=${alsoArchived ? path.join(tasksRoot, 'Archive', taskFolderName) : taskFolderPath}`,
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

    return { root, tasksRoot, taskFolderPath };
}

function runArchive({ root, qa, tasksRoot, dryRun = false }) {
    const args = [path.join(root, 'quest', 'archive-quest.js'), qa, '--tasks', tasksRoot];
    if (dryRun) args.push('--dry-run');
    const r = spawnSync('node', args, { encoding: 'utf8', timeout: 15000, cwd: root });
    return { stdout: r.stdout || '', stderr: r.stderr || '', exit: r.status };
}

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
