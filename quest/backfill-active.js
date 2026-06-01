#!/usr/bin/env node
// backfill-active.js — one-shot: append a status=hold block to active.txt for every
// non-Archive Task folder in 1. Tasks\Melaka\ that doesn't already have one.
//
// Why: created 2026-06-01 alongside the redmine-sync.js auto-append fix. Going forward
// every NEW Redmine retrieval will land in active.txt automatically; this script seeds
// the 17 historical folders that pre-dated the fix. Idempotent — re-running is safe
// (active-cli.js start refuses to duplicate existing QA-<num> blocks).
//
// Usage: node quest/backfill-active.js [--dry-run]

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const TASKS_FOLDER = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka';
const CLI = path.join(__dirname, 'active-cli.js');
const DRY = process.argv.includes('--dry-run');

function parseFolderName(name) {
    // Pattern: "<n>. QA #<NUM> - <env> - <urusan> - <tugasan> - <issue>"
    //     or:  "<n>. QA #<NUM> - <subject>"
    const m = name.match(/^\d+\.\s+(\w+)\s+#(\d+)\s*-\s*(.+)$/);
    if (!m) return null;
    const [, prefix, num, rest] = m;
    const parts = rest.split(' - ').map(s => s.trim()).filter(Boolean);
    // Env is typically the first segment if all-caps short token (FAT/UAT/MLK FAT/etc.)
    let env = null, urusan = null, tugasan = null, issue = rest;
    if (parts.length >= 4 && /^[A-Z]{2,4}( [A-Z]{2,4})?$/.test(parts[0])) {
        [env, urusan, tugasan, ...issue] = parts;
        issue = issue.join(' - ');
    } else {
        issue = rest;
    }
    return { prefix, num, env, urusan, tugasan, issue };
}

function activeTxtHas(qa) {
    try {
        execFileSync('node', [CLI, 'read', qa], { encoding: 'utf8', stdio: 'pipe' });
        return true;
    } catch { return false; }
}

function appendBlock(folderName, parsed) {
    const qa = `QA-${parsed.num}`;
    const absPath = path.join(TASKS_FOLDER, folderName);
    const oneLiner = (parsed.tugasan && parsed.issue) ? `${parsed.tugasan} — ${parsed.issue}` : parsed.issue;
    const fields = [
        `task_folder=${absPath}`,
        `phase=0`,
        `status=hold`,
        `ticket_type=bug`,
        `env=${parsed.env || 'unknown'}`,
        `issue_one_liner=${oneLiner.substring(0, 160)}`,
        `note=backfilled 2026-06-01 from disk truth; pre-dated redmine-sync auto-append fix`,
    ];
    if (parsed.urusan)  fields.push(`urusan=${parsed.urusan}`);
    if (parsed.tugasan) fields.push(`tugasan=${parsed.tugasan}`);

    if (DRY) {
        console.log(`[dry] start ${qa} → ${absPath}`);
        return 'dry';
    }
    try {
        execFileSync('node', [CLI, 'start', qa, ...fields], { encoding: 'utf8' });
        return 'added';
    } catch (e) {
        const msg = (e.stderr || e.stdout || e.message || '').toString().trim();
        if (msg.includes('already exists')) return 'skip-exists';
        console.error(`  ❌ ${qa}: ${msg}`);
        return 'error';
    }
}

function main() {
    const entries = fs.readdirSync(TASKS_FOLDER, { withFileTypes: true })
        .filter(e => e.isDirectory() && e.name !== 'Archive')
        .map(e => e.name);

    let added = 0, skipped = 0, errors = 0, unparsed = 0;
    for (const name of entries) {
        const parsed = parseFolderName(name);
        if (!parsed) { console.log(`  ⚠️  unparseable: ${name}`); unparsed++; continue; }
        const qa = `QA-${parsed.num}`;
        if (activeTxtHas(qa)) { console.log(`  ⏭  ${qa} already in active.txt or archive`); skipped++; continue; }
        const r = appendBlock(name, parsed);
        if (r === 'added') { console.log(`  ✓ ${qa} appended`); added++; }
        else if (r === 'skip-exists') skipped++;
        else if (r === 'error') errors++;
    }
    console.log(`\nbackfill ${DRY ? '[dry-run] ' : ''}— ${entries.length} folders · ${added} added · ${skipped} skipped · ${errors} errors · ${unparsed} unparsed`);
}

main();
