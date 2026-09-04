#!/usr/bin/env node
/**
 * ticket-load-verify.js — the DETERMINISTIC half of `/quest resume <ticket>`.
 *
 * miya 2026-08-06: "you WILL load it yourself, ROBUSTLY verify if you load the
 * ticket THROUGH Redmine by reading ALL of its content. VERIFY deterministically
 * you read the ALL conversations and ALL attachments. THEN you load the quest MD
 * file and check against it. THEN reconcile OR your theory is solidified."
 *
 * The problem this kills: on resume I read the qa_doc — my own derived artifact —
 * and treat it as the ticket. The ticket moves (new journals, new attachments,
 * a BA answer that supersedes the Description) and the doc does not.
 *
 * What it does: enumerates the ticket's REAL content from the synced Redmine
 * files on disk and prints it as a numbered manifest. The numbering comes from
 * the files, not from memory, so a skipped item is visible as a missing echo.
 * It verifies nothing about comprehension — it makes omission COUNTABLE.
 *
 * Usage:  node quest/ticket-load-verify.js 273461
 *         node quest/ticket-load-verify.js 273461 --json
 *
 * Exit 0 = manifest printed. Exit 1 = ticket folder not found / sync missing.
 * Exit 2 = integrity problem (journal names an attachment absent from disk,
 *          or History.txt is older than the Redmine `Last updated` it records).
 */

const fs = require('fs');
const path = require('path');

// TLV_TASKS_ROOT exists so the red-path eval can point at a fixture instead of
// creating throwaway folders inside miya's real Tasks tree.
const TASKS_ROOT = process.env.TLV_TASKS_ROOT
    || 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka';
const REPO_ROOT = path.resolve(__dirname, '..');

function die(msg, code) {
    console.error(`\u26d4 ticket-load-verify: ${msg}`);
    process.exit(code === undefined ? 1 : code);
}

function findTaskFolder(num) {
    const roots = [TASKS_ROOT, path.join(TASKS_ROOT, 'Archive')];
    for (const root of roots) {
        if (!fs.existsSync(root)) continue;
        const hit = fs.readdirSync(root, { withFileTypes: true })
            .filter(e => e.isDirectory() && e.name.includes(num))
            .map(e => path.join(root, e.name));
        if (hit.length === 1) return { folder: hit[0], archived: root !== TASKS_ROOT };
        if (hit.length > 1) die(`${hit.length} task folders match "${num}":\n   ${hit.join('\n   ')}`);
    }
    return null;
}

// Journal entries are written by redmine-sync.js as:  --- <iso-ts> by <author> ---
function parseJournals(historyText) {
    const lines = historyText.split(/\r?\n/);
    const entries = [];
    let cur = null;
    for (const line of lines) {
        const head = line.match(/^---\s+(\S+)\s+by\s+(.+?)\s+---$/);
        if (head) {
            if (cur) entries.push(cur);
            cur = { ts: head[1], author: head[2], attachments: [], hasNotes: false, body: [] };
            continue;
        }
        if (!cur) continue;
        const att = line.match(/^\s*\[attachment\]\s+(.+?)\s*$/);
        if (att) cur.attachments.push(att[1]);
        if (/^\s*notes:\s*$/.test(line)) cur.hasNotes = true;
        cur.body.push(line);
    }
    if (cur) entries.push(cur);
    return entries;
}

function firstNote(entry) {
    const idx = entry.body.findIndex(l => /^\s*notes:\s*$/.test(l));
    if (idx === -1) return '(no notes — field/attr change only)';
    const rest = entry.body.slice(idx + 1).map(l => l.trim()).filter(Boolean);
    return rest.length ? rest[0].slice(0, 90) : '(empty note)';
}

function walk(dir, base) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(full, base));
        else out.push({ rel: path.relative(base, full), size: fs.statSync(full).size });
    }
    return out;
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const num = args.find(a => /^\d{4,}$/.test(a));
if (!num) die('usage: node quest/ticket-load-verify.js <ticket-number> [--json]');

const found = findTaskFolder(num);
if (!found) die(`no task folder containing "${num}" under\n   ${TASKS_ROOT}\n   Run: node quest/redmine-sync.js ${num} --create`);
const { folder, archived } = found;

const briefDir = path.join(folder, '0. Brief');
const historyPath = path.join(briefDir, 'History.txt');
const descPath = path.join(briefDir, 'Description.txt');
if (!fs.existsSync(historyPath)) die(`no 0. Brief/History.txt in\n   ${folder}\n   Run: node quest/redmine-sync.js ${num}`);

const historyText = fs.readFileSync(historyPath, 'utf8');
const journals = parseJournals(historyText);

// Ticket fields live in the History.txt header, above the ─── rule, written by
// redmine-sync's formatTicketFields(). Added 2026-08-07 because the manifest
// counted conversations and attachments and NOTHING else, so a field the reporter
// set on day one could not be omitted-visibly — it was simply never present.
// #273460 is the proof: `Isu Berulang? = 1` sat on the ticket through two full
// Phase-0 passes, and it pointed at two sibling tickets that changed the analysis.
const headerText = historyText.split(/^─{10,}$/m)[0] || '';
const ticketFieldLines = headerText.split(/\r?\n/)
    .filter(l => /^\s{3}\S/.test(l) && !/^\s{3}(PT[A-Z]{3}\/|\w+@)/.test(l))
    .map(l => l.trim());
const isuBerulang = /ISU BERULANG = YES/.test(headerText);
const relationsNone = /🔗 RELATIONS: none/.test(headerText);
const relationLines = headerText.split(/\r?\n/)
    .filter(l => /^\s{3}\w+\s+→\s+#\d+/.test(l)).map(l => l.trim());
const fieldsSynced = /TICKET FIELDS|🔗 RELATIONS/.test(headerText);
const briefFiles = walk(briefDir, briefDir).filter(f => !/^(History|Description)\.txt$/i.test(f.rel));
const reworkDirs = fs.readdirSync(folder, { withFileTypes: true })
    .filter(e => e.isDirectory() && /rework|addition/i.test(e.name))
    .map(e => e.name);

// ---- integrity checks (these are the reason this exits non-zero) ----
// Search the WHOLE task folder, not just 0. Brief/ — an attachment we upload OURSELVES
// (a patch script, a test recording) is named in the journal but lives in 2. Fix/ or a
// numbered subfolder. Scoping the check to 0. Brief/ made every upload of ours a false
// integrity failure (2026-08-06, #273461: patch-273461.sql + the test mp4).
const problems = [];
const allFiles = walk(folder, folder);
const onDisk = new Map(allFiles.map(f => [path.basename(f.rel), f.rel]));
const namedInJournals = [...new Set(journals.flatMap(j => j.attachments))];
for (const a of namedInJournals) {
    if (!onDisk.has(a)) problems.push(`journal names attachment "${a}" but it is NOWHERE in the task folder`);
}
const syncedAt = (historyText.match(/synced\s+(\S+)/) || [])[1];
const lastUpdated = (historyText.match(/Last updated:\s*(\S+)/) || [])[1];
if (syncedAt && lastUpdated && new Date(syncedAt) < new Date(lastUpdated)) {
    problems.push(`History.txt synced ${syncedAt} is OLDER than the ticket's Last updated ${lastUpdated} — re-run redmine-sync`);
}

// ---- quest doc ----
const qaDocCandidates = [
    path.join(REPO_ROOT, 'projects', 'coding-projects', 'active', `QA-${num}`, `QA-${num}.md`),
    path.join(REPO_ROOT, 'projects', 'coding-projects', 'active', num, `${num}.md`),
    path.join(REPO_ROOT, 'projects', 'coding-projects', 'archive', `QA-${num}`, `QA-${num}.md`),
];
const qaDoc = qaDocCandidates.find(p => fs.existsSync(p)) || null;

if (asJson) {
    console.log(JSON.stringify({ num, folder, archived, journals: journals.length, namedInJournals, briefFiles, qaDoc, problems }, null, 2));
    process.exit(problems.length ? 2 : 0);
}

const L = [];
L.push(`\u2550\u2550\u2550 TICKET LOAD MANIFEST \u2014 #${num} \u2550\u2550\u2550`);
L.push(`folder : ${folder}${archived ? '   [ARCHIVED]' : ''}`);
L.push(`synced : ${syncedAt || 'unknown'}   ·   ticket last updated: ${lastUpdated || 'unknown'}`);
L.push('');
L.push(`A. CONVERSATIONS \u2014 ${journals.length} journal entr${journals.length === 1 ? 'y' : 'ies'} (oldest first). Echo one line each.`);
journals.forEach((j, i) => {
    const tags = [];
    if (j.hasNotes) tags.push('notes');
    if (j.attachments.length) tags.push(`attach:${j.attachments.join(', ')}`);
    L.push(`   A${i + 1}. ${j.ts}  ${j.author}  [${tags.join(' · ') || 'attr-only'}]`);
    L.push(`        ${firstNote(j)}`);
});
L.push('');
L.push(`B. DESCRIPTION \u2014 ${fs.existsSync(descPath) ? `${fs.statSync(descPath).size} bytes` : 'MISSING'}. Echo its Isu + Expected verbatim.`);
L.push('');
L.push(`C. ATTACHMENTS / BRIEF FILES \u2014 ${briefFiles.length}. Echo content per file (image = what is visible, pdf = annotation count).`);
briefFiles.forEach((f, i) => L.push(`   C${i + 1}. ${f.rel}  (${f.size} bytes)`));
if (!briefFiles.length) L.push('   (none)');
const elsewhere = namedInJournals.filter(a => onDisk.has(a) && !briefFiles.some(f => path.basename(f.rel) === a));
if (elsewhere.length) {
    L.push(`   journal-named, stored elsewhere in the task folder (ours, not the BA's):`);
    elsewhere.forEach(a => L.push(`      · ${a}  →  ${onDisk.get(a)}`));
}
if (reworkDirs.length) {
    L.push('');
    L.push(`D. REWORK/ADDITION FOLDERS \u2014 ${reworkDirs.join(' · ')}`);
}
L.push('');
L.push('D2. TICKET FIELDS + RELATIONS \u2014 the reporter\u2019s own metadata. Echo the decision-bearing ones.');
if (!fieldsSynced) {
    L.push(`   \u26a0 NOT SYNCED \u2014 this History.txt predates the fields block. Re-run: node quest/redmine-sync.js ${num}`);
} else {
    if (isuBerulang) {
        L.push('   \ud83d\udea8 ISU BERULANG = YES \u2014 the reporter says this has happened BEFORE.');
        L.push('      REQUIRED emit before Scout: a prior-occurrence search across ALL states + ALL statuses,');
        L.push('      e.g. /redmine/issues.json?status_id=*&subject=~<symptom>. State the hits and how each');
        L.push('      closed, or state "searched <terms>, no prior occurrence". A git-log for THIS ticket');
        L.push('      number does NOT satisfy it \u2014 a recurrence is a DIFFERENT ticket number by definition.');
    }
    if (relationLines.length) {
        L.push('   \ud83d\udd17 RELATIONS \u2014 read each before Scout:');
        relationLines.forEach(r => L.push(`      ${r}`));
    } else if (relationsNone) {
        L.push('   \ud83d\udd17 RELATIONS: none (verified against the API, not assumed)');
    }
    ticketFieldLines.filter(l => l.includes('=')).forEach(l => L.push(`      ${l}`));
}
L.push('');
L.push(`E. QUEST DOC \u2014 ${qaDoc ? qaDoc.replace(REPO_ROOT + path.sep, '') : 'NONE (fresh quest)'}`);
L.push('   Load AFTER A\u2013C. It is a derived artifact: the ticket outranks it.');
L.push('');
L.push('F. RECONCILE \u2014 required emit, one row per claim the doc makes that A\u2013C touch:');
L.push('   | doc claim | ticket says | verdict: HOLDS / SUPERSEDED / CONTRADICTED |');
L.push('   A doc claim with no ticket support is a HYPOTHESIS, not a finding.');
if (problems.length) {
    L.push('');
    L.push('\u26d4 INTEGRITY PROBLEMS \u2014 fix before proceeding:');
    problems.forEach(p => L.push(`   \u2022 ${p}`));
}
L.push('');
L.push(`ECHO CONTRACT: ${journals.length} conversation line(s) + ${briefFiles.length} attachment line(s) + Description + reconcile table.`);
L.push('A missing echo is a skipped read, not a shortened reply.');
console.log(L.join('\n'));
process.exit(problems.length ? 2 : 0);
