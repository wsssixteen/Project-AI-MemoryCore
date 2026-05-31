#!/usr/bin/env node
// active-cli.js — token-zero CRUD over quest/active.txt + quest/active-archive.txt
// Blocks = `qa=QA-NNNN` ... blank-line separator. No header/footer/index to maintain.
//
// Subcommands:
//   start   <QA> <field=val> [field=val ...]   append a new block to active.txt
//   read    <QA>                                print the block (active.txt → active-archive.txt fallback)
//   update  <QA> <field=val> [field=val ...]   in-place field replace within the block (in active.txt)
//   archive <QA>                                cut block from active.txt, append to active-archive.txt
//
// Optional: --file <path> to override target (used by self-test against active.txt.test)

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
// Resolved lazily inside main() so that --file/--archive CLI overrides apply BEFORE first use.
let ACTIVE, ARCHIVE;
function defaultActive()  { return path.join(REPO_ROOT, 'quest', 'active.txt'); }
function defaultArchive() { return path.join(REPO_ROOT, 'quest', 'active-archive.txt'); }

function readText(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; }

// Split into blocks: each block starts at `qa=QA-...` and runs until the next blank-line-then-qa= OR EOF.
// Preserves whatever sits BEFORE the first qa= block (header / banners) as `header`.
function parseBlocks(text) {
    const lines = text.split(/\r?\n/);
    const header = [];
    const blocks = [];
    let cur = null;
    for (const line of lines) {
        const isQaHead = /^qa=QA-\d+/.test(line);
        if (isQaHead) {
            if (cur) blocks.push(cur);
            const m = line.match(/^qa=(QA-\d+)/);
            cur = { qa: m[1], lines: [line] };
        } else if (cur) {
            cur.lines.push(line);
        } else {
            header.push(line);
        }
    }
    if (cur) blocks.push(cur);
    // Trim trailing blank lines from each block — keep ONE separator blank line on render
    for (const b of blocks) {
        while (b.lines.length && b.lines[b.lines.length - 1].trim() === '') b.lines.pop();
    }
    return { header: header.join('\n'), blocks };
}

function renderBlocks(header, blocks) {
    const parts = [];
    if (header && header.trim()) parts.push(header.replace(/\s+$/, ''));
    for (const b of blocks) parts.push(b.lines.join('\n'));
    return parts.join('\n\n') + '\n';
}

function findBlock(blocks, qa) { return blocks.find(b => b.qa === qa) || null; }

function writeAtomic(p, content) {
    const tmp = p + '.tmp_' + process.pid;
    fs.writeFileSync(tmp, content);
    fs.renameSync(tmp, p);
}

// ─── Subcommands ─────────────────────────────────────────────────────────────

function cmdStart(qa, kvs) {
    const { header, blocks } = parseBlocks(readText(ACTIVE));
    if (findBlock(blocks, qa)) throw new Error(`${qa} already exists in active.txt`);
    const lines = [`qa=${qa}`];
    for (const kv of kvs) {
        if (!/^[a-zA-Z_][\w-]*=/.test(kv)) throw new Error(`bad field syntax: ${kv}`);
        lines.push(kv);
    }
    blocks.push({ qa, lines });
    writeAtomic(ACTIVE, renderBlocks(header || 'active:', blocks));
    console.log(`✓ start ${qa} → ${ACTIVE} (block has ${lines.length} lines)`);
}

function cmdRead(qa) {
    for (const target of [ACTIVE, ARCHIVE]) {
        const { blocks } = parseBlocks(readText(target));
        const b = findBlock(blocks, qa);
        if (b) {
            console.log(`# from ${path.basename(target)}`);
            console.log(b.lines.join('\n'));
            return;
        }
    }
    throw new Error(`${qa} not found in active or archive`);
}

function cmdUpdate(qa, kvs) {
    const { header, blocks } = parseBlocks(readText(ACTIVE));
    const b = findBlock(blocks, qa);
    if (!b) throw new Error(`${qa} not found in active.txt`);
    const updates = new Map();
    for (const kv of kvs) {
        const idx = kv.indexOf('=');
        if (idx < 0) throw new Error(`bad field: ${kv}`);
        updates.set(kv.slice(0, idx), kv.slice(idx + 1));
    }
    const seen = new Set();
    for (let i = 0; i < b.lines.length; i++) {
        const m = b.lines[i].match(/^([a-zA-Z_][\w-]*)=/);
        if (m && updates.has(m[1])) {
            b.lines[i] = `${m[1]}=${updates.get(m[1])}`;
            seen.add(m[1]);
        }
    }
    // Append new fields that didn't exist
    for (const [k, v] of updates) {
        if (!seen.has(k)) b.lines.push(`${k}=${v}`);
    }
    writeAtomic(ACTIVE, renderBlocks(header, blocks));
    console.log(`✓ update ${qa} → ${updates.size} field(s) (${[...updates.keys()].join(', ')})`);
}

function cmdArchive(qa) {
    const activeText = readText(ACTIVE);
    const { header: aHeader, blocks: aBlocks } = parseBlocks(activeText);
    const b = findBlock(aBlocks, qa);
    if (!b) throw new Error(`${qa} not found in active.txt`);
    const remaining = aBlocks.filter(x => x.qa !== qa);

    const archText = readText(ARCHIVE);
    const { header: archHeader, blocks: archBlocks } = parseBlocks(archText);
    if (findBlock(archBlocks, qa)) throw new Error(`${qa} ALREADY in active-archive.txt (would duplicate)`);
    archBlocks.push(b);

    writeAtomic(ACTIVE,  renderBlocks(aHeader || 'active:', remaining));
    writeAtomic(ARCHIVE, renderBlocks(archHeader, archBlocks));
    console.log(`✓ archive ${qa} → cut from active.txt (${remaining.length} remain), appended to active-archive.txt (${archBlocks.length} total)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
    const args = process.argv.slice(2);
    let fileOverride = null, archOverride = null;
    const fileIdx = args.indexOf('--file');
    if (fileIdx >= 0) { fileOverride = args[fileIdx + 1]; args.splice(fileIdx, 2); }
    const archIdx = args.indexOf('--archive');
    if (archIdx >= 0) { archOverride = args[archIdx + 1]; args.splice(archIdx, 2); }
    ACTIVE  = fileOverride || process.env.ACTIVE_TXT  || defaultActive();
    ARCHIVE = archOverride || process.env.ACTIVE_ARCH || defaultArchive();

    const [cmd, qa, ...rest] = args;
    try {
        switch (cmd) {
            case 'start':   if (!qa) throw new Error('usage: start <QA> <field=val>...');   cmdStart(qa, rest); break;
            case 'read':    if (!qa) throw new Error('usage: read <QA>');                    cmdRead(qa); break;
            case 'update':  if (!qa || !rest.length) throw new Error('usage: update <QA> <field=val>...'); cmdUpdate(qa, rest); break;
            case 'archive': if (!qa) throw new Error('usage: archive <QA>');                 cmdArchive(qa); break;
            default:
                console.error('Subcommands: start | read | update | archive');
                console.error('Options:    [--file <active.txt>] [--archive <active-archive.txt>]');
                process.exit(2);
        }
    } catch (e) {
        console.error(`✗ ${e.message}`);
        process.exit(1);
    }
}

if (require.main === module) main();
module.exports = { parseBlocks, renderBlocks };
