// redmine-sync.js — Fetch assigned Redmine tickets, classify, optionally create Task folders
// Usage:
//   node redmine-sync.js           — run once
//   node redmine-sync.js --poll    — poll every POLL_INTERVAL_MINUTES

const http = require('http');
const fs   = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const REDMINE_BASE  = 'http://172.16.90.169/redmine';
const REDMINE_KEY   = 'PASTE_API_KEY_HERE';
const TASKS_FOLDER  = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka';
const POLL_INTERVAL_MINUTES = 15;

// Known ticket prefixes — extend if new types appear
const TICKET_PREFIXES = ['FAT-OR', 'UAT-CR', 'FAT-CR', 'CR', 'QA'];

// ─── REDMINE API ─────────────────────────────────────────────────────────────

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

function parseTicketId(subject) {
    // Matches: "QA #257569", "FAT-OR #255637", "UAT-CR #239225" etc.
    const pattern = new RegExp(
        `(${TICKET_PREFIXES.map(p => p.replace('-', '\\-')).join('|')})\\s*#(\\d+)`,
        'i'
    );
    const match = subject.match(pattern);
    if (!match) return null;
    return { prefix: match[1].toUpperCase(), number: match[2] };
}

// ─── TASK FOLDER CHECK ───────────────────────────────────────────────────────

function findExistingFolder(prefix, number) {
    if (!fs.existsSync(TASKS_FOLDER)) return null;
    const entries = fs.readdirSync(TASKS_FOLDER);
    const target = `${prefix} #${number}`.toLowerCase();
    return entries.find(e => e.toLowerCase().includes(target)) || null;
}

function getNextFolderNumber() {
    if (!fs.existsSync(TASKS_FOLDER)) return 1;
    const entries = fs.readdirSync(TASKS_FOLDER);
    const nums = entries
        .map(e => parseInt(e.split('.')[0]))
        .filter(n => !isNaN(n));
    return nums.length ? Math.max(...nums) + 1 : 1;
}

// ─── TASK FOLDER CREATION ────────────────────────────────────────────────────

function createTaskFolder(issue, parsed) {
    const num    = getNextFolderNumber();
    const slug   = issue.subject.replace(/[\\/:*?"<>|]/g, '-').substring(0, 80).trim();
    const folder = path.join(TASKS_FOLDER, `${num}. ${slug}`);

    // Standard structure — always created
    fs.mkdirSync(path.join(folder, '0. Brief'),    { recursive: true });
    fs.mkdirSync(path.join(folder, '1. Simulate'), { recursive: true });
    fs.mkdirSync(path.join(folder, '2. Fix'),      { recursive: true });

    // 3. Rework — only for rework tickets
    if (issue._rework) {
        fs.mkdirSync(path.join(folder, '3. Rework'), { recursive: true });
    }

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

    // 1. Notes.txt — blank, みや fills in
    fs.writeFileSync(path.join(folder, '1. Notes.txt'), '');

    return folder;
}

// ─── CLASSIFY + REPORT ───────────────────────────────────────────────────────

function classifyIssues(issues) {
    const results = { new: [], rework: [], unrecognised: [] };

    for (const issue of issues) {
        const parsed = parseTicketId(issue.subject);
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
            console.log(`       ID: ${i.id} | Status: ${i.status?.name} | Updated: ${i.updated_on?.substring(0,10)}`);
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
        const issues  = await fetchIssues();
        const results = classifyIssues(issues);
        printReport(results);

        // Auto-create folders for new tickets (prompt first)
        if (results.new.length) {
            console.log('  Run with --create to auto-create Task folders for new tickets.\n');
        }
    } catch (err) {
        console.error(`\n  ❌ Error: ${err.message}\n`);
    }
}

async function runWithCreate() {
    try {
        const issues  = await fetchIssues();
        const results = classifyIssues(issues);
        printReport(results);

        for (const issue of results.new) {
            const folder = createTaskFolder(issue, issue._parsed);
            console.log(`  📁 Created: ${folder}`);
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
