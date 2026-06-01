#!/usr/bin/env node
// migrate-post-mortems.js — one-shot: move every entry from main/post-mortems.md
// into the per-quest projects/coding-projects/archive/<TICKET>/<TICKET>.md doc.
//
// Strategy: each `### <ticket-id> — <name> — <date>` entry in post-mortems.md becomes
// a `## Post-Mortem (migrated from main/post-mortems.md, <orig-date>)` section appended
// to the per-quest doc. If the per-quest doc / archive folder doesn't exist yet, create
// a minimal stub with just the post-mortem section (preserves the historical record).
//
// Ticket-id normalization (for folder names):
//   QA-262233            → QA-262233
//   QA-262233 cycle 2    → QA-262233 (cycle in heading preserved)
//   PPJK #246512         → PPJK-246512
//   PRZ  #255637         → PRZ-255637
//   FAT-OR-255106        → FAT-OR-255106
//   UAT-CR-239225        → UAT-CR-239225
//
// After migration: post-mortems.md is replaced with a thin redirect stub.
//
// Usage:
//   node quest/migrate-post-mortems.js --dry-run   — preview entries + destinations
//   node quest/migrate-post-mortems.js             — perform migration

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PM_FILE   = path.join(REPO_ROOT, 'main', 'post-mortems.md');
const ARCHIVE   = path.join(REPO_ROOT, 'projects', 'coding-projects', 'archive');
const DRY_RUN   = process.argv.includes('--dry-run');

function parseEntries(text) {
    const lines = text.split('\n');
    const entries = [];
    let header = [];
    let current = null;
    let headerEnded = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const m = line.match(/^### (.+?)\s*—\s*(.+?)\s*(?:—\s*(.+?))?$/);
        if (m) {
            headerEnded = true;
            if (current) entries.push(current);
            const ticketRaw = m[1].trim();
            const titleRaw = m[2].trim();
            const dateRaw = (m[3] || '').trim();
            // Skip the template placeholder
            if (/^QA-#+$/.test(ticketRaw) || /^\[Short name\]/.test(titleRaw)) {
                current = null;
                continue;
            }
            current = { ticketRaw, titleRaw, dateRaw, headingLine: line, body: [] };
        } else if (current) {
            current.body.push(line);
        } else if (!headerEnded) {
            header.push(line);
        }
    }
    if (current) entries.push(current);
    return { header: header.join('\n'), entries };
}

function normalizeTicketKey(raw) {
    // Strip parenthetical sub-qualifiers like " (rework cycle 2)" + " cycle N"
    let key = raw.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+cycle\s+\d+/gi, '').trim();
    // <prefix>[<sep>]#<digits> → <prefix>-<digits>  (handles "PPJK #246512", "FAT-OR #255637", "PRZ  #255106")
    key = key.replace(/^(\w[\w-]*)\s+#?(\d+)$/, '$1-$2');
    // Collapse stray internal spaces
    key = key.replace(/\s+/g, '-');
    return key;
}

function buildPostMortemSection(entry) {
    const body = entry.body.join('\n').replace(/^\s+|\s+$/g, '');
    const stamp = entry.dateRaw || '(date not stated in original)';
    const cycleQualifier = entry.ticketRaw.match(/cycle\s+\d+/i);
    const cycleNote = cycleQualifier ? ` ${cycleQualifier[0]}` : '';
    return `\n## Post-Mortem${cycleNote} (migrated from main/post-mortems.md, ${stamp})\n\n` +
           `> Title: ${entry.titleRaw}\n` +
           `> Source-file pre-migration: \`main/post-mortems.md\`\n\n` +
           `${body}\n`;
}

function buildStubDoc(key, entry, section) {
    return `# ${key} — ${entry.titleRaw}\n\n` +
           `> Stub doc created 2026-06-01 by \`migrate-post-mortems.js\` to home the historical post-mortem entry below.\n` +
           `> This quest pre-dated the single-canonical-doc convention (introduced 2026-05-28). The migrated post-mortem IS the surviving record; Discovery/Recon/Rubric/Apply sections were not retro-captured.\n` +
           section;
}

function main() {
    const text = fs.readFileSync(PM_FILE, 'utf8');
    const { header, entries } = parseEntries(text);
    console.log(`Found ${entries.length} entries in post-mortems.md\n`);

    let created = 0, appended = 0, skipped = 0;
    const summary = [];
    for (const e of entries) {
        const key = normalizeTicketKey(e.ticketRaw);
        const folder = path.join(ARCHIVE, key);
        const doc = path.join(folder, `${key}.md`);
        const section = buildPostMortemSection(e);
        const folderExists = fs.existsSync(folder);
        const docExists = folderExists && fs.existsSync(doc);

        let action;
        if (DRY_RUN) {
            action = docExists ? 'append-to-existing' : (folderExists ? 'create-doc-in-existing-folder' : 'create-folder+doc');
        } else {
            if (docExists) {
                const existing = fs.readFileSync(doc, 'utf8');
                // Per-entry idempotency: match on the unique Title row of THIS entry, not any prior migration marker.
                // Two entries can share a normalized key (e.g. QA-262233 + QA-262233 cycle 2) — both must land.
                // Anchor with trailing newline so a shorter title doesn't substring-match a longer one
                const titleMarker = `> Title: ${e.titleRaw}\n`;
                if (existing.includes(titleMarker)) {
                    action = 'already-migrated';
                    skipped++;
                } else {
                    fs.writeFileSync(doc, existing.replace(/\s*$/, '') + '\n' + section);
                    action = 'appended';
                    appended++;
                }
            } else {
                fs.mkdirSync(folder, { recursive: true });
                fs.writeFileSync(doc, buildStubDoc(key, e, section));
                action = 'created-stub';
                created++;
            }
        }
        summary.push({ ticketRaw: e.ticketRaw, key, action });
    }

    console.log('Per-entry actions:');
    for (const s of summary) {
        console.log(`  ${s.key.padEnd(18)} ${s.action.padEnd(25)} (orig: ${s.ticketRaw})`);
    }
    console.log(`\nSummary: ${created} created · ${appended} appended · ${skipped} already-migrated`);

    // Replace post-mortems.md with a thin redirect stub
    if (!DRY_RUN) {
        const stub = `# main/post-mortems.md — MIGRATED 2026-06-01\n\n` +
                     `> ⚠ This file's content has been migrated into per-quest archive docs.\n` +
                     `> Each \`### <ticket> — <name> — <date>\` entry moved to \`projects/coding-projects/archive/<ticket-key>/<ticket-key>.md\` as a \`## Post-Mortem (migrated ...)\` section.\n` +
                     `> \n` +
                     `> Migration script: \`quest/migrate-post-mortems.js\` (idempotent — safe to re-run).\n` +
                     `> Migration date: 2026-06-01.\n` +
                     `> Entries migrated: ${entries.length}.\n` +
                     `\n## Lookup\n\n` +
                     `Per-quest doc lives at \`projects/coding-projects/archive/<KEY>/<KEY>.md\`. Key normalization:\n\n` +
                     `- \`QA-NNNNNN\` → \`QA-NNNNNN\`\n` +
                     `- \`PPJK #NNN\` / \`PRZ #NNN\` → \`PPJK-NNN\` / \`PRZ-NNN\`\n` +
                     `- \`FAT-OR-NNN\` / \`UAT-CR-NNN\` → preserved as-is\n` +
                     `- \`QA-NNN cycle K\` → \`QA-NNN\` (cycle preserved in section heading)\n` +
                     `\n## Why migrated\n\n` +
                     `Per CLAUDE.md v1.40, per-quest detail belongs in the single canonical \`QA-NNN.md\` doc, not in a flat 1115-line append-only file. This migration retires the flat file and consolidates record-of-truth at the per-ticket level.\n` +
                     `\n## Original heading\n\n` +
                     `Pre-migration this file was the post-mortem registry maintained by Domain Expansion Step 3.5 (now retired per みや 2026-06-01).\n`;
        fs.writeFileSync(PM_FILE, stub);
        console.log(`\n✓ post-mortems.md replaced with redirect stub (${stub.length} bytes).`);
    }
}

main();
