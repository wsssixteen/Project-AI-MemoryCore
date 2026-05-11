// redmine-sync.js — Fetch assigned Redmine tickets, classify, optionally create Task folders
// Usage:
//   node redmine-sync.js           — run once
//   node redmine-sync.js --poll    — poll every POLL_INTERVAL_MINUTES

const http = require('http');
const fs   = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const REDMINE_BASE  = 'http://172.16.90.169/redmine';
const REDMINE_KEY   = '9565c21aa6cd9672fd3c7c2c7fec4c934c2f7c66';
const TASKS_FOLDER  = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka';
const POLL_INTERVAL_MINUTES = 15;

// Known env prefixes — order matters (longer matches first)
const TICKET_PREFIXES = ['FAT-OR', 'UAT-CR', 'FAT-CR', 'FAT', 'UAT', 'CR', 'QA'];

// ─── REDMINE API ─────────────────────────────────────────────────────────────

function fetchIssueStatus(id) {
    return new Promise(resolve => {
        const options = {
            hostname: '172.16.90.169',
            path: `/redmine/issues/${id}`,
            headers: { 'X-Redmine-API-Key': REDMINE_KEY }
        };
        http.get(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/<td[^>]*class="status"[^>]*>\s*(.*?)\s*<\/td>/i);
                resolve(match ? match[1].replace(/<[^>]+>/g, '').trim() : 'Unknown');
            });
        }).on('error', () => resolve('N/A'));
    });
}

async function enrichWithHtmlStatus(issues) {
    await Promise.all(issues.map(async issue => {
        issue._status = await fetchIssueStatus(issue.id);
    }));
}

function fetchIssues() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '172.16.90.169',
            path: '/redmine/issues.json?assigned_to_id=me&status_id=open&limit=50',
            headers: { 'X-Redmine-API-Key': REDMINE_KEY }
        };
        http.get(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`Redmine returned ${res.statusCode}: ${data}`));
                    return;
                }
                try { resolve(JSON.parse(data).issues || []); }
                catch (e) { reject(new Error('Failed to parse Redmine response')); }
            });
        }).on('error', reject);
    });
}

// ─── TICKET PARSING ──────────────────────────────────────────────────────────

function parseTicketId(issue) {
    // Prefix: tracker name from Redmine (QA, FAT-OR, UAT-CR, etc.) — NOT subject
    const prefix = (issue.tracker?.name || 'UNKNOWN').toUpperCase();
    return { prefix, number: String(issue.id) };
}

function parseDescriptionFields(description) {
    if (!description) return {};
    // Strip Redmine bold/italic markup (*text*, _text_) before parsing
    const clean = description.replace(/\*([^*]+)\*/g, '$1').replace(/_([^_]+)_/g, '$1');
    const get = (key) => {
        const m = clean.match(new RegExp(`^${key}:\\s*(.+)`, 'mi'));
        return m ? m[1].replace(/\(.*?\)/g, '').trim() : null;
    };
    const issueMatch = clean.match(/Issue:\s*\n?\s*\d+\)\s*(.+)/i);
    return {
        env:     get('Env'),
        urusan:  get('Urusan'),
        tugasan: get('Tugasan'),
        issue:   issueMatch ? issueMatch[1].trim() : null,
    };
}

function sanitize(str, cap) {
    if (!str) return '';
    const s = str.replace(/[\\/:*?"<>|]/g, '-').trim();
    const truncated = s.length > cap ? s.substring(0, cap).trimEnd() : s;
    // Strip trailing dots/spaces — Windows + OneDrive cannot sync folders ending in '.' or ' ' (caught 2026-05-08, QA #260298 folder)
    return truncated.replace(/[. ]+$/, '');
}

function buildFolderSlug(issue, parsed) {
    const f = parseDescriptionFields(issue.description);

    if (f.urusan && f.tugasan && f.issue) {
        // ENV from description (e.g. "MLK FAT" → take last word "FAT") or subject first segment
        const env = f.env ? f.env.split(/\s+/).pop() : issue.subject.split(' - ')[0].trim();
        return [
            `${parsed.prefix} #${parsed.number}`,
            sanitize(env, 10),
            sanitize(f.urusan, 40),
            sanitize(f.tugasan, 30),
            sanitize(f.issue, 50),
        ].filter(Boolean).join(' - ');
    }

    // Fallback: use subject
    return `${parsed.prefix} #${parsed.number} - ${sanitize(issue.subject, 70)}`;
}

// ─── TASK FOLDER CHECK ───────────────────────────────────────────────────────

function findExistingFolder(prefix, number) {
    if (!fs.existsSync(TASKS_FOLDER)) return null;
    const entries = fs.readdirSync(TASKS_FOLDER);
    // Match on issue ID alone — prefix format in folder name may vary
    const idTarget = `#${number}`;
    return entries.find(e => e.includes(idTarget)) || null;
}

function getNextFolderNumber() {
    if (!fs.existsSync(TASKS_FOLDER)) return 1;
    const entries = fs.readdirSync(TASKS_FOLDER);
    const nums = entries
        .map(e => parseInt(e.split('.')[0]))
        .filter(n => !isNaN(n));
    return nums.length ? Math.max(...nums) + 1 : 1;
}

// ─── ATTACHMENT DOWNLOAD ─────────────────────────────────────────────────────

function fetchAttachments(id) {
    return new Promise(resolve => {
        const options = {
            hostname: '172.16.90.169',
            path: `/redmine/issues/${id}.json?include=attachments`,
            headers: { 'X-Redmine-API-Key': REDMINE_KEY }
        };
        http.get(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data).issue?.attachments || []); }
                catch (e) { resolve([]); }
            });
        }).on('error', () => resolve([]));
    });
}

function downloadFile(contentUrl, destPath) {
    return new Promise(resolve => {
        const urlPath = contentUrl.replace(/^https?:\/\/[^/]+/, '');
        const options = {
            hostname: '172.16.90.169',
            path: urlPath,
            headers: { 'X-Redmine-API-Key': REDMINE_KEY }
        };
        const file = fs.createWriteStream(destPath);
        http.get(options, res => {
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', () => { file.close(); fs.unlink(destPath, () => {}); resolve(); });
    });
}

// ─── TASK FOLDER CREATION ────────────────────────────────────────────────────

async function createTaskFolder(issue, parsed) {
    const num    = getNextFolderNumber();
    const slug   = buildFolderSlug(issue, parsed);
    const folder = path.join(TASKS_FOLDER, `${num}. ${slug}`);

    // Base structure — always 3 folders + blank Notes file
    fs.mkdirSync(path.join(folder, '0. Brief'),    { recursive: true });
    fs.mkdirSync(path.join(folder, '1. Simulate'), { recursive: true });
    fs.mkdirSync(path.join(folder, '2. Fix'),      { recursive: true });
    fs.writeFileSync(path.join(folder, '1. Notes.txt'), '');

    // Description.txt — ticket brief
    const desc = [
        issue.updated_on ? issue.updated_on.substring(0, 10) : '',
        '',
        'Ticket issue description:',
        '',
        `Env: ${parsed.prefix}`,
        `Ticket: ${parsed.prefix} #${parsed.number}`,
        `Subject: ${issue.subject}`,
        '',
        issue.description || '(no description in Redmine)',
    ].join('\n');
    fs.writeFileSync(path.join(folder, '0. Brief', 'Description.txt'), desc);

    // Attachments — download into 0. Brief/
    const attachments = await fetchAttachments(issue.id);
    for (const att of attachments) {
        if (!att.content_url || !att.filename) continue;
        const destPath = path.join(folder, '0. Brief', att.filename);
        await downloadFile(att.content_url, destPath);
        console.log(`    ⬇️  ${att.filename}`);
    }

    return folder;
}

function addStatusFolder(existingFolderName, status) {
    const fullPath = path.join(TASKS_FOLDER, existingFolderName);
    if (!fs.existsSync(fullPath)) return null;

    // 2 conditions for creating a status subfolder (per みや 2026-05-07):
    //   (1) Status MUST be Rework (case-insensitive) — no other status triggers folder creation
    //   (2) Project folder MUST exist at projects/coding-projects/active/<TYPE>-<NUM>/ — we've previously worked on it
    const statusLower = (status || '').toLowerCase().trim();
    if (statusLower !== 'rework') return null;

    // Parse folder name "<NN>. <TYPE> #<NUM> - ..." to extract type + number
    const m = existingFolderName.match(/^\d+\.\s*([A-Z][A-Z-]*)\s+#(\d+)/);
    if (!m) return null;
    const projectFolder = path.resolve(__dirname, '..', 'projects', 'coding-projects', 'active', `${m[1]}-${m[2]}`);
    if (!fs.existsSync(projectFolder)) return null;

    const statusLabel = 'Rework';
    const entries = fs.readdirSync(fullPath);

    // Idempotent: skip if "Rework" folder already exists (re-sync should not duplicate)
    const sameStatusExists = entries.some(e => {
        const em = e.match(/^\d+\.\s*(.+?)\s*$/);
        return em && em[1].toLowerCase() === statusLabel.toLowerCase();
    });
    if (sameStatusExists) return null;

    // Find highest numbered subfolder (0. Brief, 1. Simulate, 2. Fix, 3. Rework...)
    const nums = entries
        .map(e => { const em = e.match(/^(\d+)\./); return em ? parseInt(em[1]) : null; })
        .filter(n => n !== null);
    const next = nums.length ? Math.max(...nums) + 1 : 3;

    const newPath = path.join(fullPath, `${next}. ${statusLabel}`);
    fs.mkdirSync(newPath, { recursive: true });
    return newPath;
}

// ─── CLASSIFY + REPORT ───────────────────────────────────────────────────────

function classifyIssues(issues) {
    const results = { new: [], rework: [], unrecognised: [] };

    for (const issue of issues) {
        const parsed = parseTicketId(issue);
        if (!parsed) {
            results.unrecognised.push(issue);
            continue;
        }

        const existing = findExistingFolder(parsed.prefix, parsed.number);
        const isRework = /rework/i.test(issue.subject);

        issue._parsed   = parsed;
        issue._existing = existing;
        issue._rework   = isRework || !!existing;

        if (existing || isRework) results.rework.push(issue);
        else results.new.push(issue);
    }

    return results;
}

function printReport(results) {
    const line = '─'.repeat(60);
    console.log(`\n${line}`);
    console.log(`  Redmine Sync — ${new Date().toLocaleString()}`);
    console.log(line);

    if (results.new.length) {
        console.log('\n🆕  NEW TICKETS');
        for (const i of results.new) {
            console.log(`    [${i._parsed.prefix} #${i._parsed.number}] ${i.subject}`);
            console.log(`       Priority: ${i.priority?.name} | Status: ${i._status} | Updated: ${i.updated_on?.substring(0,10)}`);
        }
    }

    if (results.rework.length) {
        console.log('\n🔁  REWORK / EXISTING');
        for (const i of results.rework) {
            const tag = i._existing ? `folder: ${i._existing}` : 'rework keyword in subject';
            console.log(`    [${i._parsed.prefix} #${i._parsed.number}] ${i.subject}`);
            console.log(`       ${tag}`);
        }
    }

    if (results.unrecognised.length) {
        console.log('\n⚠️   UNRECOGNISED (no prefix match)');
        for (const i of results.unrecognised) {
            console.log(`    [${i.id}] ${i.subject}`);
        }
    }

    if (!results.new.length && !results.rework.length && !results.unrecognised.length) {
        console.log('\n  ✅ No open tickets assigned.');
    }

    console.log(`\n${line}\n`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function run() {
    try {
        const issues = await fetchIssues();
        await enrichWithHtmlStatus(issues);
        const results = classifyIssues(issues);
        printReport(results);

        if (results.new.length) {
            console.log('  Run with --create to auto-create Task folders for new tickets.\n');
        }
    } catch (err) {
        console.error(`\n  ❌ Error: ${err.message}\n`);
    }
}

async function runWithCreate() {
    try {
        const issues = await fetchIssues();
        await enrichWithHtmlStatus(issues);
        const results = classifyIssues(issues);
        printReport(results);

        for (const issue of results.new) {
            const folder = await createTaskFolder(issue, issue._parsed);
            console.log(`  📁 Created: ${folder}`);
        }

        for (const issue of results.rework) {
            if (!issue._existing) continue;
            const newPath = addStatusFolder(issue._existing, issue._status);
            if (newPath) console.log(`  🔁 Status folder added: ${newPath}`);
        }
    } catch (err) {
        console.error(`\n  ❌ Error: ${err.message}\n`);
    }
}

const args   = process.argv.slice(2);
const poll   = args.includes('--poll');
const create = args.includes('--create');

if (poll) {
    console.log(`  Polling every ${POLL_INTERVAL_MINUTES} min. Ctrl+C to stop.\n`);
    const fn = create ? runWithCreate : run;
    fn();
    setInterval(fn, POLL_INTERVAL_MINUTES * 60 * 1000);
} else {
    (create ? runWithCreate : run)();
}
