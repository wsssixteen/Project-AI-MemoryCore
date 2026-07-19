#!/usr/bin/env node
// delegate-quest.js — Quest delegation harness (atomic delegate-and-archive)
//
// What it does — per quest-protocol.md "delegated" status + Quest State Transitions:
//   1. Stamp block:        status=delegated + delegated_to= + delegated_date=@now
//                          + delegated_commit= + learning_marker=<date> — delegated, pending review
//   2. Move Task folder:   1. Tasks\Melaka\<n>. QA #N ...\  →  1. Tasks\Melaka\Archive\<n>. QA #N ...\
//   3. Active.txt block:   rewrite task_folder= to new Archive\ path, then cut block from
//                          active.txt and append to active-archive.txt
//   4. Project doc:        DO NOT touch — projects/coding-projects/active/QA-<num>/ stays put,
//                          live for みや's review until the delegated fix is verified.
//
// Why this exists — `delegated` archives IMMEDIATELY (Task folder + active.txt block move out),
// but the per-quest QA-NNN.md must stay live in active/ for review (it carries the ## Delegated
// Resolution section). Doing the three moves by hand is the exact slip class archive-quest.js
// kills for Phase 2 — same deterministic mechanical script here, minus the project-doc move.
//
// Idempotent: if folder already in Archive\ or block already in active-archive.txt — each step
// skips with ⏭ and the others still run.
//
// Usage:
//   node quest/delegate-quest.js <QA> [delegated_to] [commit]    — delegate + archive folder/block
//   node quest/delegate-quest.js <QA> --dry-run                  — preview moves without writing
//   node quest/delegate-quest.js <QA> --to <name> --commit <SHA> — explicit flag form
//   node quest/delegate-quest.js <QA> --tasks <path>             — override Tasks folder (used by self-test)
//
// Exit codes: 0 ok · 1 partial fail (folder move OK, block update failed) · 2 usage

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_TASKS = require('path').join(require('os').homedir(), 'OneDrive - Pymsoft Sdn Bhd', '1. Tasks', 'Melaka'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19)
const ARCHIVE_SUBFOLDER = 'Archive';
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

function isInArchive(taskFolder) {
    return taskFolder && taskFolder.includes(path.sep + ARCHIVE_SUBFOLDER + path.sep);
}

function archivedPath(taskFolder, tasksRoot) {
    if (isInArchive(taskFolder)) return taskFolder;
    const folderName = path.basename(taskFolder);
    return path.join(tasksRoot, ARCHIVE_SUBFOLDER, folderName);
}

function blockExistsInArchiveTxt(qa) {
    try {
        const out = execFileSync('node', [ACTIVE_CLI, 'read', qa], { encoding: 'utf8', stdio: 'pipe' });
        return out.includes('active-archive.txt');
    } catch { return false; }
}

function nowDate() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function main() {
    const args = process.argv.slice(2);
    const qa = args[0];
    if (!qa || !/^QA-\d+$/.test(qa)) {
        console.error('Usage: node quest/delegate-quest.js <QA-NNNNNN> [delegated_to] [commit] [--dry-run] [--to <name>] [--commit <SHA>] [--tasks <path>]');
        process.exit(2);
    }
    const dryRun = args.includes('--dry-run');

    // Positional [delegated_to] [commit] (any arg after QA that isn't a flag / flag-value)
    const flagNames = ['--dry-run', '--to', '--commit', '--tasks'];
    const positionals = [];
    for (let i = 1; i < args.length; i++) {
        if (flagNames.includes(args[i])) {
            if (args[i] !== '--dry-run') i++; // skip the flag's value
            continue;
        }
        positionals.push(args[i]);
    }
    const toIdx = args.indexOf('--to');
    const commitIdx = args.indexOf('--commit');
    const tasksIdx = args.indexOf('--tasks');
    const delegatedTo = toIdx >= 0 ? args[toIdx + 1] : (positionals[0] || null);
    const commit = commitIdx >= 0 ? args[commitIdx + 1] : (positionals[1] || null);
    const tasksRoot = tasksIdx >= 0 ? args[tasksIdx + 1] : DEFAULT_TASKS;

    console.log(`\n🤝 Delegate harness — ${qa}${dryRun ? ' (DRY-RUN)' : ''}\n   Tasks root: ${tasksRoot}`);

    // ── Step 0: locate the block (may already be delegated/archived) ───────
    const block = readActiveTxtBlock(qa);
    const alreadyArchivedBlock = !block && blockExistsInArchiveTxt(qa);
    if (!block && !alreadyArchivedBlock) {
        console.error(`\n❌ ${qa} not found in active.txt OR active-archive.txt — nothing to delegate.`);
        process.exit(1);
    }
    const taskFolderFromBlock = getField(block, 'task_folder');

    // ── Step 1: move Task folder ───────────────────────────────────────────
    let folderState; // 'moved' | 'already-archived' | 'no-folder' | 'dry'
    let dst = null;
    if (taskFolderFromBlock && fs.existsSync(taskFolderFromBlock) && !isInArchive(taskFolderFromBlock)) {
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
    } else if (taskFolderFromBlock && isInArchive(taskFolderFromBlock)) {
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

    // ── Step 2: project doc stays put (NOT moved — left live in active/) ───
    console.log(`  ⏭ Step 2: project doc projects/coding-projects/active/${qa}/ KEPT in active/ (live for review)`);

    // ── Step 3: stamp delegation fields + archive the block ───────────────
    let blockState; // 'delegated' | 'already-archived' | 'dry'
    if (alreadyArchivedBlock) {
        console.log(`  ⏭ Step 3: block already in active-archive.txt`);
        blockState = 'already-archived';
    } else if (dryRun) {
        const preview = ['status=delegated'];
        if (delegatedTo) preview.push(`delegated_to=${delegatedTo}`);
        preview.push('delegated_date=@now');
        if (commit) preview.push(`delegated_commit=${commit}`);
        preview.push(`learning_marker=${nowDate()} — delegated, pending review`);
        if (dst && folderState !== 'no-folder') preview.push(`task_folder=${dst}`);
        console.log(`  [dry] Step 3: update ${preview.join(' · ')}, then archive block`);
        blockState = 'dry';
    } else {
        const updates = ['status=delegated'];
        if (delegatedTo) updates.push(`delegated_to=${delegatedTo}`);
        updates.push('delegated_date=@now');
        if (commit) updates.push(`delegated_commit=${commit}`);
        updates.push(`learning_marker=${nowDate()} — delegated, pending review`);
        if (dst && folderState !== 'no-folder') updates.push(`task_folder=${dst}`);
        try {
            execFileSync('node', [ACTIVE_CLI, 'update', qa, ...updates], { encoding: 'utf8' });
            execFileSync('node', [ACTIVE_CLI, 'archive', qa], { encoding: 'utf8' });
            console.log(`  ✓ Step 3: block stamped delegated + cut to active-archive.txt`);
            blockState = 'delegated';
        } catch (e) {
            const msg = (e.stderr || e.stdout || e.message || '').toString().trim();
            console.error(`  ❌ Step 3 FAILED: ${msg}`);
            process.exit(1);
        }
    }

    // ── Emit the hygiene line ─────────────────────────────────────────────
    const folderIcon = folderState === 'moved' ? '✓' : folderState === 'already-archived' ? '✓ (was already)' : folderState === 'dry' ? '[dry]' : '⬜';
    const blockIcon  = blockState === 'delegated' ? '✓' : blockState === 'already-archived' ? '✓ (was already)' : blockState === 'dry' ? '[dry]' : '⬜';
    const who = delegatedTo ? ` → ${delegatedTo}` : '';
    console.log(`\n🤝 Delegate hygiene — ${qa}${who}: folder→Archive\\ ${folderIcon} · active.txt block→active-archive.txt ${blockIcon} · project doc KEPT in active/ (review)\n`);
}

main();
