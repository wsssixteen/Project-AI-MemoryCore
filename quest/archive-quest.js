#!/usr/bin/env node
// archive-quest.js — Quest Phase 2 archive harness (atomic 3-step Phase 2 close)
//
// What it does — per CLAUDE.md v1.39 "Phase 2 Closure — Archive Hygiene":
//   1. Move Task folder:   1. Tasks\Melaka\<n>. QA #N ...\   →   1. Tasks\Melaka\Archive\<n>. QA #N ...\
//   2. Move project doc:   projects/coding-projects/active/QA-<num>/   →   archive/QA-<num>/
//   3. Active.txt block:   set status=archived, rewrite task_folder= to new path, then cut
//                          block from active.txt and append to active-archive.txt
//
// Why this exists — the rule lived ONLY in non-boot-loaded quest-protocol.md (Phase 2 step 4/5)
// + later boot-loaded in CLAUDE.md v1.39. Got silently skipped repeatedly anyway (QA-258004,
// QA-259702, QA-259342 in this session alone — all 3 had status=archived but blocks + folders
// stayed in active locations until manual cleanup). Deterministic mechanical script kills the
// recurrence — `status=archived` becomes truly atomic with the moves.
//
// Idempotent: if folder already in Archive\, project already in archive/, or block already in
// active-archive.txt — each step skips with ⏭ and the others still run.
//
// Usage:
//   node quest/archive-quest.js <QA>                       — archive
//   node quest/archive-quest.js <QA> --dry-run             — preview moves without writing
//   node quest/archive-quest.js <QA> --commit <SHA>        — also stamp commit= into block
//   node quest/archive-quest.js <QA> --branch <name>       — also stamp branch=
//   node quest/archive-quest.js <QA> --tasks <path>        — override Tasks folder (used by self-test)
//
// Exit codes: 0 ok · 1 partial fail (folder move OK, block update failed) · 2 usage

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_TASKS = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka';
const ARCHIVE_SUBFOLDER = 'Archive';
const PROJECT_ACTIVE  = path.join(REPO_ROOT, 'projects', 'coding-projects', 'active');
const PROJECT_ARCHIVE = path.join(REPO_ROOT, 'projects', 'coding-projects', 'archive');
const ACTIVE_TXT = path.join(REPO_ROOT, 'quest', 'active.txt');
const ACTIVE_CLI = path.join(__dirname, 'active-cli.js');

function readActiveTxtBlock(qa) {
    if (!fs.existsSync(ACTIVE_TXT)) return null;
    const text = fs.readFileSync(ACTIVE_TXT, 'utf8');
    const lines = text.split(/\r?\n/);
    const block = [];
    let inBlock = false;
    for (const line of lines) {
        if (/^qa=QA-\d+/.test(line)) {
            if (inBlock) break;
            if (line.trim() === `qa=${qa}`) {
                inBlock = true;
                block.push(line);
                continue;
            }
        }
        if (inBlock) {
            if (line.trim() === '') break;
            block.push(line);
        }
    }
    return block.length ? block.join('\n') : null;
}

function getField(block, key) {
    if (!block) return null;
    const re = new RegExp(`^${key}=(.*)$`, 'm');
    const m = block.match(re);
    return m ? m[1].trim() : null;
}

function isInArchive(taskFolder, tasksRoot) {
    return taskFolder && taskFolder.includes(path.sep + ARCHIVE_SUBFOLDER + path.sep);
}

function archivedPath(taskFolder, tasksRoot) {
    if (isInArchive(taskFolder, tasksRoot)) return taskFolder;
    const folderName = path.basename(taskFolder);
    return path.join(tasksRoot, ARCHIVE_SUBFOLDER, folderName);
}

function blockExistsInArchiveTxt(qa) {
    try {
        const out = execFileSync('node', [ACTIVE_CLI, 'read', qa], { encoding: 'utf8', stdio: 'pipe' });
        return out.includes('active-archive.txt');
    } catch { return false; }
}

function main() {
    const args = process.argv.slice(2);
    const qa = args[0];
    if (!qa || !/^QA-\d+$/.test(qa)) {
        console.error('Usage: node quest/archive-quest.js <QA-NNNNNN> [--dry-run] [--commit <SHA>] [--branch <name>] [--tasks <path>]');
        process.exit(2);
    }
    const dryRun = args.includes('--dry-run');
    const commitIdx = args.indexOf('--commit');
    const commit = commitIdx >= 0 ? args[commitIdx + 1] : null;
    const branchIdx = args.indexOf('--branch');
    const branch = branchIdx >= 0 ? args[branchIdx + 1] : null;
    const tasksIdx = args.indexOf('--tasks');
    const tasksRoot = tasksIdx >= 0 ? args[tasksIdx + 1] : DEFAULT_TASKS;

    console.log(`\n📦 Archive harness — ${qa}${dryRun ? ' (DRY-RUN)' : ''}\n   Tasks root: ${tasksRoot}`);

    // ── Step 0: locate the block (may already be archived) ─────────────────
    const block = readActiveTxtBlock(qa);
    const alreadyArchivedBlock = !block && blockExistsInArchiveTxt(qa);
    if (!block && !alreadyArchivedBlock) {
        console.error(`\n❌ ${qa} not found in active.txt OR active-archive.txt — nothing to archive.`);
        process.exit(1);
    }
    const taskFolderFromBlock = getField(block, 'task_folder');

    // ── Step 1: move Task folder ───────────────────────────────────────────
    let folderState; // 'moved' | 'already-archived' | 'no-folder' | 'dry'
    let dst = null;
    if (taskFolderFromBlock && fs.existsSync(taskFolderFromBlock) && !isInArchive(taskFolderFromBlock, tasksRoot)) {
        dst = archivedPath(taskFolderFromBlock, tasksRoot);
        if (fs.existsSync(dst)) {
            console.log(`  ⚠ Step 1: destination already exists — ${dst}; skipping move`);
            folderState = 'already-archived';
        } else if (dryRun) {
            console.log(`  [dry] Step 1: move ${taskFolderFromBlock} → ${dst}`);
            folderState = 'dry';
        } else {
            fs.mkdirSync(path.dirname(dst), { recursive: true });
            fs.renameSync(taskFolderFromBlock, dst);
            console.log(`  ✓ Step 1: folder → Archive\\${path.basename(dst)}`);
            folderState = 'moved';
        }
    } else if (taskFolderFromBlock && isInArchive(taskFolderFromBlock, tasksRoot)) {
        console.log(`  ⏭ Step 1: folder already under Archive\\ per active.txt`);
        folderState = 'already-archived';
        dst = taskFolderFromBlock;
    } else if (taskFolderFromBlock) {
        console.log(`  ⚠ Step 1: task_folder= path does not exist on disk: ${taskFolderFromBlock}`);
        folderState = 'no-folder';
        dst = taskFolderFromBlock;
    } else {
        console.log(`  ⬜ Step 1: no task_folder= field in block`);
        folderState = 'no-folder';
    }

    // ── Step 2: move project subfolder (if exists) ────────────────────────
    const projectActive  = path.join(PROJECT_ACTIVE,  qa);
    const projectArchive = path.join(PROJECT_ARCHIVE, qa);
    let projectState; // 'moved' | 'already-archived' | 'none' | 'dry'
    if (fs.existsSync(projectActive)) {
        if (fs.existsSync(projectArchive)) {
            console.log(`  ⚠ Step 2: project subfolder already in archive/ — skipping move`);
            projectState = 'already-archived';
        } else if (dryRun) {
            console.log(`  [dry] Step 2: move ${projectActive} → ${projectArchive}`);
            projectState = 'dry';
        } else {
            fs.mkdirSync(path.dirname(projectArchive), { recursive: true });
            fs.renameSync(projectActive, projectArchive);
            console.log(`  ✓ Step 2: project subfolder → archive/${qa}/`);
            projectState = 'moved';
        }
    } else if (fs.existsSync(projectArchive)) {
        console.log(`  ⏭ Step 2: project subfolder already in archive/`);
        projectState = 'already-archived';
    } else {
        console.log(`  ⬜ Step 2: no project subfolder to move`);
        projectState = 'none';
    }

    // ── Step 3: update active.txt block + archive it ──────────────────────
    let blockState; // 'archived' | 'already-archived' | 'dry'
    if (alreadyArchivedBlock) {
        console.log(`  ⏭ Step 3: block already in active-archive.txt`);
        blockState = 'already-archived';
    } else if (dryRun) {
        console.log(`  [dry] Step 3: update task_folder=${dst} + status=archived, then archive block`);
        blockState = 'dry';
    } else {
        const updates = ['status=archived'];
        if (dst && folderState !== 'no-folder') updates.push(`task_folder=${dst}`);
        if (commit) updates.push(`commit=${commit}`);
        if (branch) updates.push(`branch=${branch}`);
        if (projectState === 'moved' || projectState === 'already-archived') {
            const qaDoc = path.relative(REPO_ROOT, path.join(projectArchive, `${qa}.md`)).replace(/\\/g, '/');
            updates.push(`qa_doc=${qaDoc}`);
        }
        try {
            execFileSync('node', [ACTIVE_CLI, 'update', qa, ...updates], { encoding: 'utf8' });
            execFileSync('node', [ACTIVE_CLI, 'archive', qa], { encoding: 'utf8' });
            console.log(`  ✓ Step 3: block updated + cut to active-archive.txt`);
            blockState = 'archived';
        } catch (e) {
            const msg = (e.stderr || e.stdout || e.message || '').toString().trim();
            console.error(`  ❌ Step 3 FAILED: ${msg}`);
            process.exit(1);
        }
    }

    // ── Emit the hygiene line in CLAUDE.md v1.39 canonical format ─────────
    const folderIcon  = folderState === 'moved' ? '✓' : folderState === 'already-archived' ? '✓ (was already)' : '⬜';
    const blockIcon   = blockState === 'archived' ? '✓' : blockState === 'already-archived' ? '✓ (was already)' : blockState === 'dry' ? '[dry]' : '⬜';
    const projectIcon = projectState === 'moved' ? '✓' : projectState === 'already-archived' ? '✓ (was already)' : projectState === 'dry' ? '[dry]' : '⬜ no-project-subfolder';
    console.log(`\n📦 Archive hygiene — ${qa}: folder→Archive\\ ${folderIcon} · active.txt block→active-archive.txt ${blockIcon} · project subfolder ${projectIcon}\n`);
}

main();
