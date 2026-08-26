// redmine-sync.js — Fetch assigned Redmine tickets, classify, optionally create Task folders
// Usage:
//   node redmine-sync.js           — run once
//   node redmine-sync.js --poll    — poll every POLL_INTERVAL_MINUTES

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const REDMINE_BASE  = 'http://172.16.90.169/redmine';
const REDMINE_KEY   = '9565c21aa6cd9672fd3c7c2c7fec4c934c2f7c66';
const TASKS_ROOT    = require('path').join(require('os').homedir(), 'OneDrive - Pymsoft Sdn Bhd', '1. Tasks'); // machine-independent (GHOST-HOOKS-2 fix 2026-07-19)
const TASKS_FOLDER  = require('path').join(TASKS_ROOT, 'Melaka'); // default state — unchanged for Melaka
const POLL_INTERVAL_MINUTES = 15;

// State routing (2026-08-26, miya — first Perak ticket #275092): a ticket's STATE lives in
// issue.project.name, never the tracker. Perak/Selangor tickets must land in their own
// sibling folder, not Melaka\. Default stays Melaka so every existing Melaka path is unchanged.
// Patterns from the live Redmine project census (305 projects, 2026-08-26): each state appears
// as "eSOKONGAN <STATE>", "e-Tanah <State>[ FAT/PAT/UAT]", "eTanah <State>", and module
// projects prefixed "<ABBR>_NN_" (PRK_/KED_/TRG_/MLK_). Melaka + plain "eSOKONGAN" = default.
const STATE_FOLDERS = [
    { match: /perak|^PRK_/i,      folder: 'Perak' },
    { match: /selangor|^SEL_/i,   folder: 'Selangor' },
    { match: /terengganu|^TRG_/i, folder: 'Terengganu' },
    { match: /kedah|^KED_/i,      folder: 'Kedah' },
    { match: /labuan/i,           folder: 'Labuan' },
    { match: /putrajaya/i,        folder: 'Putrajaya' },
    { match: /pulau pinang/i,     folder: 'PulauPinang' },
];
function taskBaseFor(issue) {
    const proj = (issue && issue.project && issue.project.name) || '';
    const hit = STATE_FOLDERS.find(s => s.match.test(proj));
    return hit ? path.join(TASKS_ROOT, hit.folder) : TASKS_FOLDER;
}

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

// Single-issue fetch (2026-08-26, retrieval audit): `node quest/redmine-sync.js <num>` is the
// command retrieve-sync-gate mandates, yet the number was silently IGNORED — only --poll/--create
// were parsed, and the assigned-to-me list is the only source. A ticket that left the assigned
// list (#275092: resolved+reassigned 3 min after first sync) was unretrievable. By-ID fetch works
// regardless of current assignee — naming the ticket explicitly IS the authorization.
function fetchSingleIssue(id) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '172.16.90.169',
            path: `/redmine/issues/${id}.json`,
            headers: { 'X-Redmine-API-Key': REDMINE_KEY }
        };
        http.get(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) { reject(new Error(`Redmine returned ${res.statusCode} for #${id}`)); return; }
                try { resolve(JSON.parse(data).issue || null); }
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

// Ticket-type abbreviation (2026-08-24, miya): folder names carry a short type code so many
// open tickets are searchable at a glance. Any `(BRACKET)` on the tracker name (e.g.
// "INTERNAL ISSUE (PROD)") is moved to the END of the whole folder name, not kept in the head.
const TYPE_ABBR = {
    'ESOKONGAN':      'ES',
    'INTERNAL ISSUE': 'II',
    'ADHOC':          'AH',
    'DATA PATCHING':  'DP',
    'REQUIREMENT':    'RQ',
};
function abbreviateType(trackerName) {
    const raw = (trackerName || 'UNKNOWN').toUpperCase().trim();
    const bm  = raw.match(/^(.*?)\s*(\([^)]*\))\s*$/);
    const base = (bm ? bm[1] : raw).trim();
    const bracket = bm ? bm[2] : '';
    return { abbr: TYPE_ABBR[base] || base, bracket };
}

function buildFolderSlug(issue, parsed) {
    const f = parseDescriptionFields(issue.description);
    const { abbr, bracket } = abbreviateType(parsed.prefix);
    const head = `${abbr} #${parsed.number}`;
    const tail = bracket ? ` ${bracket}` : '';

    if (f.urusan && f.tugasan && f.issue) {
        // ENV from description (e.g. "MLK FAT" → take last word "FAT") or subject first segment
        const env = f.env ? f.env.split(/\s+/).pop() : issue.subject.split(' - ')[0].trim();
        return [
            head,
            sanitize(env, 10),
            sanitize(f.urusan, 40),
            sanitize(f.tugasan, 30),
            sanitize(f.issue, 50),
        ].filter(Boolean).join(' - ') + tail;
    }

    // Fallback: use subject
    return `${head} - ${sanitize(issue.subject, 70)}${tail}`;
}

// ─── TASK FOLDER CHECK ───────────────────────────────────────────────────────

function findExistingFolder(prefix, number, base = TASKS_FOLDER) {
    if (!fs.existsSync(base)) return null;
    const idTarget = `#${number}`;

    // Check active folder
    const active = fs.readdirSync(base).find(e => e.includes(idTarget));
    if (active) return active;

    // Check Archive subfolder (added 2026-05-12 — closed tickets relocated here at Phase 2)
    // Returns 'Archive/<folderName>' so callers see the actual on-disk location and don't
    // mistake an archived ticket for a brand-new one (which would re-create + duplicate).
    const archivePath = path.join(base, 'Archive');
    if (fs.existsSync(archivePath)) {
        const archived = fs.readdirSync(archivePath).find(e => e.includes(idTarget));
        if (archived) return path.join('Archive', archived);
    }

    return null;
}

function getNextFolderNumber(base = TASKS_FOLDER) {
    if (!fs.existsSync(base)) return 1;
    const entries = fs.readdirSync(base);
    // Archived tickets keep their numbers — increment from the highest across active + Archive,
    // else an emptied active folder restarts at 1 and collides with archived #1. (Mirrors findExistingFolder.)
    const archivePath = path.join(base, 'Archive');
    if (fs.existsSync(archivePath)) {
        entries.push(...fs.readdirSync(archivePath));
    }
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

// v2 (2026-08-03, QA-273201): the old version piped ANY response — including a 404 body — into the
// destination file and then resolve()d, so a failed attachment was indistinguishable from a good one.
// Result: 'eSOKONGAN #273201 - Semakan.mp4' (10,104,585 bytes on Redmine) never landed in 0. Brief/,
// the sync printed no error, and the ticket's evidence base was silently incomplete.
// Now: status-code checked, byte-size verified against Redmine's filesize, failures reported.
// v3 (2026-08-05): bounded retry. A 46.7MB video (attachment 985431) died with ECONNRESET
// mid-stream and succeeded on the very next attempt — a single-shot download turns a transient
// socket reset into a permanently missing piece of BA evidence. 3 attempts, 1.5s apart; the
// size check below is what makes a retry safe (a truncated file fails and is deleted).
async function downloadFile(contentUrl, destPath, expectedSize) {
    let last = { ok: false, why: 'not attempted' };
    for (let attempt = 1; attempt <= 3; attempt++) {
        last = await downloadFileOnce(contentUrl, destPath, expectedSize);
        if (last.ok) return last;
        if (/HTTP 4\d\d/.test(last.why || '')) return last; // 404/403 won't fix itself
        if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
    }
    return { ...last, why: `${last.why} (after 3 attempts)` };
}

function downloadFileOnce(contentUrl, destPath, expectedSize) {
    return new Promise(resolve => {
        const urlPath = contentUrl.replace(/^https?:\/\/[^/]+/, '');
        const options = {
            hostname: '172.16.90.169',
            path: urlPath,
            headers: { 'X-Redmine-API-Key': REDMINE_KEY }
        };
        const file = fs.createWriteStream(destPath);
        const fail = (why) => {
            try { file.close(); } catch (_) {}
            fs.unlink(destPath, () => {});
            resolve({ ok: false, why });
        };
        http.get(options, res => {
            if (res.statusCode !== 200) { res.resume(); return fail(`HTTP ${res.statusCode}`); }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                let bytes = 0;
                try { bytes = fs.statSync(destPath).size; } catch (_) { return fail('not written'); }
                if (expectedSize && bytes !== expectedSize) {
                    return fail(`size ${bytes} != redmine ${expectedSize}`);
                }
                resolve({ ok: true, bytes });
            });
        }).on('error', e => fail(e.message));
    });
}

// ─── JOURNAL / COMMENT FETCH (Q1 todo 2026-05-07 — added 2026-05-11) ─────────

function fetchIssueJournals(id) {
    return new Promise(resolve => {
        const options = {
            hostname: '172.16.90.169',
            path: `/redmine/issues/${id}.json?include=journals`,
            headers: { 'X-Redmine-API-Key': REDMINE_KEY }
        };
        http.get(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data).issue?.journals || []); }
                catch (e) { resolve([]); }
            });
        }).on('error', () => resolve([]));
    });
}

// ─── ASSIGNED-TO-ME DATE (added 2026-06-04, work-date drift fix) ──────────────
// "When the ticket became mine" — distinct from retrieve/quest-start/close.
// fetchIssues() only pulls tickets CURRENTLY assigned to the API-key user, so the
// MOST RECENT journal that changed `assigned_to_id` is the moment it became mine.
// No such journal (assigned at creation) → fall back to issue.created_on.
// Output is GMT+8 calendar date (matches みや's weekly-sheet day granularity).
function toGmt8Date(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso).substring(0, 10);
    return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().substring(0, 10);
}

function extractAssignedToMeDate(journals, issue) {
    let latest = null;
    for (const j of journals || []) {
        const isAssigneeChange = (j.details || []).some(
            d => d.property === 'attr' && d.name === 'assigned_to_id'
        );
        if (isAssigneeChange && j.created_on) {
            if (!latest || new Date(j.created_on) > new Date(latest)) latest = j.created_on;
        }
    }
    const iso = latest || issue.created_on || null;
    return iso ? toGmt8Date(iso) : null;
}

function formatJournalsForHistory(journals) {
    if (!journals || !journals.length) return '(no journal entries)';
    return journals.map(j => {
        const date  = j.created_on || '';
        const user  = j.user?.name || 'Unknown';
        const notes = (j.notes || '').trim();
        const details = (j.details || []).map(d => {
            if (d.property === 'attr')       return `  [attr] ${d.name}: ${d.old_value || '∅'} → ${d.new_value || '∅'}`;
            if (d.property === 'relation')   return `  [relation] ${d.name}: ${d.new_value || ''}`;
            if (d.property === 'attachment') return `  [attachment] ${d.new_value || d.name || ''}`;
            if (d.property === 'cf')         return `  [cf] field#${d.name}: ${d.old_value || '∅'} → ${d.new_value || '∅'}`;
            return `  [${d.property}] ${JSON.stringify(d)}`;
        }).join('\n');
        const body = [];
        if (details) body.push(details);
        if (notes) {
            body.push('  notes:');
            body.push(notes.split('\n').map(l => '    ' + l).join('\n'));
        }
        return `--- ${date} by ${user} ---\n${body.join('\n')}`;
    }).join('\n\n');
}

// v1.1 (2026-08-03, miya, QA-272867 wrong-test-data root cause): BA-given IDs live in journals and
// keep getting outranked by doc-pack records. Scan journals (LATEST first) for permohonan IDs +
// env words; surface them at the TOP of History.txt and on stdout so intake cannot bury them.
const PERMOHONAN_RX = /PT[A-Z]{3}\/\d{2}\/[A-Z]\/[A-Z]+\/\d{4}\/\d+/g;
const ENV_RX = /\b(staging|stg1|stg2|prod|production|mlit|uat|fat)\b/i;
function extractBaGivenTestData(journals) {
    const rows = [];
    for (const j of [...(journals || [])].reverse()) {
        const notes = j.notes || '';
        const ids = notes.match(PERMOHONAN_RX);
        if (!ids) continue;
        const env = (notes.match(ENV_RX) || [])[0] || '';
        for (const id of new Set(ids)) {
            rows.push(`${id}${env ? ' @ ' + env : ''} — ${(j.created_on || '').slice(0, 10)} by ${j.user?.name || 'Unknown'}`);
        }
    }
    return rows;
}

function writeHistoryFile(briefFolder, journals, issueMeta) {
    const baGiven = extractBaGivenTestData(journals);
    const header = [
        `Redmine ticket journal — synced ${new Date().toISOString()}`,
        `Issue: ${issueMeta.prefix} #${issueMeta.number} — ${issueMeta.subject}`,
        `Status: ${issueMeta.status} | Last updated: ${issueMeta.updated_on || ''}`,
        ...(baGiven.length ? [
            '🚨 BA-GIVEN TEST DATA (from journals, LATEST first — this OUTRANKS any doc/pack/memory record):',
            ...baGiven.map(r => '   ' + r),
        ] : []),
        '─'.repeat(70),
        '',
    ].join('\n');
    const body = formatJournalsForHistory(journals);
    fs.writeFileSync(path.join(briefFolder, 'History.txt'), header + body + '\n');
    if (baGiven.length) console.log('🚨 BA-GIVEN TEST DATA (latest first):\n' + baGiven.map(r => '   ' + r).join('\n'));
}

async function updateExistingTicketHistory(issue) {
    if (!issue._existing) return 0;
    const briefFolder = path.join(taskBaseFor(issue), issue._existing, '0. Brief');
    if (!fs.existsSync(briefFolder)) return 0;
    const journals = await fetchIssueJournals(issue.id);
    writeHistoryFile(briefFolder, journals, {
        prefix:    issue._parsed.prefix,
        number:    issue._parsed.number,
        subject:   issue.subject,
        status:    issue._status,
        updated_on: issue.updated_on,
    });
    return journals.length;
}

// ─── TASK FOLDER CREATION ────────────────────────────────────────────────────

async function createTaskFolder(issue, parsed) {
    const base   = taskBaseFor(issue);
    const num    = getNextFolderNumber(base);
    const slug   = buildFolderSlug(issue, parsed);
    const folder = path.join(base, `${num}. ${slug}`);

    // Base structure — 0. Brief + 2. Fix + blank Notes file (1. Simulate retired 2026-08-24, miya)
    fs.mkdirSync(path.join(folder, '0. Brief'), { recursive: true });
    fs.mkdirSync(path.join(folder, '2. Fix'),   { recursive: true });
    // Notes file is named per-ticket — `1. NNN NNN.txt` (renamed 2026-05-31 from `1. Notes.txt`,
    // adjusted same day from `1. QA-NNNN.txt` per みや → drop tracker prefix, space before last 3
    // digits so the last-3 are quickly identifiable across many open tabs/greps).
    const spaced = parsed.number.replace(/(\d+)(\d{3})$/, '$1 $2');
    const notesFilename = `1. ${spaced}.txt`;
    fs.writeFileSync(path.join(folder, notesFilename), '');

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
    const attFailed = [];
    for (const att of attachments) {
        if (!att.content_url || !att.filename) continue;
        const destPath = path.join(folder, '0. Brief', att.filename);
        const r = await downloadFile(att.content_url, destPath, att.filesize);
        if (r.ok) console.log(`    ⬇️  ${att.filename} (${r.bytes} bytes)`);
        else { attFailed.push(`${att.filename} — ${r.why}`); console.log(`    ❌ ${att.filename} — ${r.why}`); }
    }
    if (attFailed.length) {
        console.log(`\n    🚨 ${attFailed.length}/${attachments.length} ATTACHMENT(S) MISSING from 0. Brief/ — the folder is NOT the full ticket:`);
        attFailed.forEach(f => console.log(`       • ${f}`));
    }

    return folder;
}

// ─── active.txt AUTO-APPEND (added 2026-06-01, root-cause fix for "1 open quest" briefing slip) ─
// Why: redmine-sync used to create the Task folder + History.txt but NEVER appended a status=hold
// block to quest/active.txt. The "add a held Phase 0 entry" step in quest-protocol.md:27 was
// prose-only — depended on the model running it manually. Result: 18 folders on disk, 1 block in
// active.txt → boot's open-quest-surfacer surfaced only 1 of 18 (correctly reading a wrong source).
// Now: after every successful createTaskFolder(), shell out to active-cli.js start so the block
// lands automatically. Failure is logged but never crashes the sync (folder is the real artifact).
function appendActiveBlock(issue, parsed, taskFolderAbs, assignedDate) {
    const f = parseDescriptionFields(issue.description);
    const env = f.env || (issue.subject.split(' - ')[0].trim() || 'unknown');
    const subjectClean = issue.subject.replace(/"/g, "'").substring(0, 140);
    const fields = [
        `task_folder=${taskFolderAbs}`,
        `phase=0`,
        `status=hold`,
        `ticket_type=bug`,
        `env=${env}`,
        `issue_one_liner=${subjectClean}`,
    ];
    // assigned_to_me = when the ticket became mine (Redmine journal). Saved at
    // retrieval; the retrieve/folder-create timestamp itself is deliberately NOT saved.
    if (assignedDate) fields.push(`assigned_to_me=${assignedDate}`);
    if (f.urusan)  fields.push(`urusan=${f.urusan}`);
    if (f.tugasan) fields.push(`tugasan=${f.tugasan}`);
    // Non-Melaka tickets carry an explicit state= field (2026-08-26, first Perak ticket).
    const stateHit = STATE_FOLDERS.find(s => s.match.test((issue.project && issue.project.name) || ''));
    if (stateHit) fields.push(`state=${stateHit.folder}`);
    try {
        const cliPath = path.join(__dirname, 'active-cli.js');
        const out = execFileSync('node', [cliPath, 'start', `QA-${parsed.number}`, ...fields], { encoding: 'utf8' });
        console.log(`    ✏️  active.txt → QA-${parsed.number} appended (status=hold)`);
        return true;
    } catch (e) {
        const msg = (e.stderr || e.stdout || e.message || '').toString().trim();
        if (msg.includes('already exists')) {
            // Idempotent — re-syncing an already-tracked ticket is fine, not an error.
            return true;
        }
        console.log(`    ❌  active.txt append FAILED for QA-${parsed.number}: ${msg}`);
        return false;
    }
}

// ─── REWORK / STATUS FOLDER HANDLING ─────────────────────────────────────────
// v5 (2026-05-20): rebuilt after QA-260876 anomaly. Three behaviours now:
//   (a) Unarchive — if the existing folder is under Archive/ and status is Rework,
//       MOVE the folder back to active with a new number (ticket is no longer closed).
//   (b) Cycle-aware folder creation — count Rework status transitions in journals
//       vs existing "Rework"/"New" subfolders; only add a new subfolder when journals
//       exceed folders (handles multi-cycle reworks correctly; idempotent on re-sync).
//   (c) Auto-download new BA attachments into the new status subfolder, comparing
//       to what's already in 0. Brief/ so each rework cycle's evidence is captured.
//
// Pre-v5 history (kept for context, not for re-derivation): v1 unconditional · v2/v4
// gated on `2. Fix/` non-empty proxy · v3 dropped that gate. Replaced wholesale 2026-05-20.

// Move a Task folder OUT of Archive/ back to the active level with a new
// number — fires when a previously-closed ticket is reopened to Rework.
// Returns the new folder NAME (relative to TASKS_FOLDER), or null if no move.
function unarchiveFolder(archiveRelPath, base = TASKS_FOLDER) {
    const oldPath = path.join(base, archiveRelPath);
    if (!fs.existsSync(oldPath)) return null;
    const baseName = path.basename(archiveRelPath);
    const slugMatch = baseName.match(/^\d+\.\s*(.+)$/);
    const slug = slugMatch ? slugMatch[1] : baseName;
    const newNum = getNextFolderNumber(base);
    const newFolderName = `${newNum}. ${slug}`;
    const newPath = path.join(base, newFolderName);
    fs.renameSync(oldPath, newPath);
    return newFolderName;
}

// Download attachments NOT already present at the candidate known-files list.
// Used at rework time to fetch the new BA screenshots that came with the reopen.
async function downloadNewAttachments(destFolder, issueId, knownFilenames) {
    const attachments = await fetchAttachments(issueId);
    const known = new Set(knownFilenames);
    const downloaded = [];
    for (const att of attachments) {
        if (!att.content_url || !att.filename) continue;
        if (known.has(att.filename)) continue;
        const destPath = path.join(destFolder, att.filename);
        const r = await downloadFile(att.content_url, destPath, att.filesize);
        if (r.ok) downloaded.push(att.filename);
        else console.log(`    ❌ ${att.filename} — ${r.why} (NOT downloaded)`);
    }
    return downloaded;
}

// addStatusFolder (v5) — async. When a ticket's Redmine status is Rework:
//   1. If folder is in Archive/, MOVE it back to active.
//   2. Count Rework transitions in journals vs existing "Rework"/"New" subfolders.
//      If journals > folders, create a new subfolder numbered next-after-max-existing.
//   3. Default label = "Rework" (sync can't classify Rework-on-same-issue vs
//      Rework-because-BA-found-new-issue — みや renames to "New" manually if BA's
//      journal note indicates a different issue).
// Returns: { folderRelPath, unarchived, statusFolderPath } or null.
async function addStatusFolder(existingFolderName, status, journals, base = TASKS_FOLDER) {
    // Loose match — the Redmine status cell carries DESCRIPTIVE labels
    // ("Rework (Requirement Update)", "Rework (Bug)"), not the bare word "rework".
    // The old `!== 'rework'` equality rejected every descriptive label, so a reopened
    // ticket was neither unarchived nor given a cycle folder. Now matches classifyIssues'
    // own `/rework/i` test for consistency. (Fixed 2026-08-21, #276181 audit — B1/B3.)
    if (!/rework/i.test(status || '')) return null;

    // (1) Unarchive if needed
    let folderRelPath = existingFolderName;
    let unarchived = false;
    if (existingFolderName.startsWith('Archive')) {
        const newName = unarchiveFolder(existingFolderName, base);
        if (!newName) return null;
        folderRelPath = newName;
        unarchived = true;
    }

    const fullPath = path.join(base, folderRelPath);
    if (!fs.existsSync(fullPath)) return null;

    // (2) Create ONE rework cycle folder per reactivation, idempotently.
    //   v8.1 (2026-08-21, #276181 audit — B5): the old `journalReworkCount >
    //   reworkSubfolderCount` count churned once isReworkTransition matched a SET of
    //   rework ids: a single reopen hops through several rework statuses (3→31→23→3→38),
    //   so one cycle counted as 3 and each re-sync spawned another empty N. Rework folder.
    //   The cycle count is NOT derivable from status hops. Rule now: add a rework folder
    //   only when NONE exists yet. Genuine 3rd/4th reopens are rare — みや adds/renames
    //   those by hand (matches the v5 note that sync cannot classify cycles perfectly).
    const entries = fs.readdirSync(fullPath);
    const reworkSubfolderCount = entries.filter(e =>
        /^\d+\.\s*(Rework|New)\s*$/i.test(e)
    ).length;

    let statusFolderPath = null;
    if (reworkSubfolderCount === 0) {
        const nums = entries
            .map(e => { const em = e.match(/^(\d+)\./); return em ? parseInt(em[1]) : null; })
            .filter(n => n !== null);
        const next = nums.length ? Math.max(...nums) + 1 : 3;
        statusFolderPath = path.join(fullPath, `${next}. Rework`);
        fs.mkdirSync(statusFolderPath, { recursive: true });
    }

    return { folderRelPath, unarchived, statusFolderPath };
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

        const existing = findExistingFolder(parsed.prefix, parsed.number, taskBaseFor(issue));
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

// v8 (2026-08-21, #276181 audit — B4): reactivate reopened tickets on the PLAIN sync path.
// Until today, addStatusFolder (unarchive Archive/ → active + create the N. Rework cycle
// folder) was called ONLY inside runWithCreate() — the `--create` path. The plain
// `node quest/redmine-sync.js <num>` command that retrieve-sync-gate mandates runs run(),
// which refreshed History.txt but NEVER unarchived or created a rework cycle folder. A
// reopened ticket (#276181: closed→reopened to "Rework (Requirement Update)") therefore
// stayed in Archive\ with no cycle folder, and Ruri had to notice + reactivate it by hand.
// Extracted here so BOTH run() and runWithCreate() reactivate. Must run BEFORE journal/
// attachment sync so those write to the reactivated (active) path.
async function reactivateReworkFolders(results) {
    for (const issue of results.rework) {
        if (!issue._existing) continue;
        const journals = await fetchIssueJournals(issue.id);
        const result = await addStatusFolder(issue._existing, issue._status, journals, taskBaseFor(issue));
        if (result && result.unarchived) {
            console.log(`  ↩️  Unarchived: ${issue._existing} → ${result.folderRelPath}`);
            issue._existing = result.folderRelPath;
        }
        if (result && result.statusFolderPath) {
            console.log(`  🔁 Status folder added: ${result.statusFolderPath}`);
        }
    }
}

async function syncJournalsForExisting(results) {
    // Q1 todo (2026-05-07, applied 2026-05-11): write/refresh History.txt for every existing ticket
    // so BA replies + status changes are visible without manually opening Redmine.
    // Idempotent — overwrites History.txt each run with the full journal dump.
    for (const issue of results.rework) {
        if (!issue._existing) continue;
        const n = await updateExistingTicketHistory(issue);
        console.log(`    📝 [${issue._parsed.prefix} #${issue._parsed.number}] History.txt → ${n} journal ${n === 1 ? 'entry' : 'entries'}`);
    }
}

// v7 (2026-08-05): attachment sync for EXISTING tickets, extracted so it runs on the plain
// `node quest/redmine-sync.js <num>` path too. Until today this logic lived ONLY inside
// runWithCreate(), so a plain sync — the exact form retrieve-sync-gate tells you to run —
// refreshed History.txt and downloaded NOTHING. 273201: API had 12 attachments, disk had 8,
// and the run reported success. Ruri briefed みや on a ticket whose BA evidence videos had
// never been fetched. Idempotent: `known` skips anything already on disk.
async function syncAttachmentsForExisting(results) {
    for (const issue of results.rework) {
        if (!issue._existing) continue;
        const ticketFullPath = path.join(taskBaseFor(issue), issue._existing);
        if (!fs.existsSync(ticketFullPath)) continue;
        const entries = fs.readdirSync(ticketFullPath);
        const reworkEntries = entries
            .map(e => { const m = e.match(/^(\d+)\.\s*(Rework|New)\s*$/i); return m ? { name: e, num: parseInt(m[1]) } : null; })
            .filter(Boolean)
            .sort((a, b) => b.num - a.num);
        const targetSubfolder = reworkEntries.length
            ? path.join(ticketFullPath, reworkEntries[0].name)
            : path.join(ticketFullPath, '0. Brief');
        const known = new Set();
        for (const e of entries) {
            const sub = path.join(ticketFullPath, e);
            try { if (fs.statSync(sub).isDirectory()) fs.readdirSync(sub).forEach(f => known.add(f)); } catch (_) {}
        }
        const downloaded = await downloadNewAttachments(targetSubfolder, issue.id, Array.from(known));
        for (const f of downloaded) {
            console.log(`    ⬇️  ${f} → ${path.basename(targetSubfolder)}/`);
        }
    }
}

async function run() {
    try {
        const issues = await fetchIssues();
        await enrichWithHtmlStatus(issues);
        const results = classifyIssues(issues);
        printReport(results);
        await reactivateReworkFolders(results);
        await syncJournalsForExisting(results);
        await syncAttachmentsForExisting(results);

        if (results.new.length) {
            console.log('\n  Run with --create to auto-create Task folders for new tickets.\n');
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

            // Fetch journals ONCE up-front — feeds both the assigned-to-me date and History.txt.
            const journals = await fetchIssueJournals(issue.id);
            const assignedDate = extractAssignedToMeDate(journals, issue);

            // Append a status=hold Phase-0 block to quest/active.txt so the boot
            // open-quest-surfacer sees it. See appendActiveBlock() header for context.
            appendActiveBlock(issue, issue._parsed, folder, assignedDate);
            if (assignedDate) console.log(`    📅 assigned_to_me=${assignedDate}`);

            // Also write History.txt at first create — covers journal entries that already exist
            // for "New"-status tickets (e.g. assignment notes from leads). 2026-05-12 fix: prior
            // behavior only wrote History.txt on re-sync (existing path), leaving net-new tickets
            // without their already-present journal context.
            if (journals.length) {
                writeHistoryFile(path.join(folder, '0. Brief'), journals, {
                    prefix:    issue._parsed.prefix,
                    number:    issue._parsed.number,
                    subject:   issue.subject,
                    status:    issue._status,
                    updated_on: issue.updated_on,
                });
                console.log(`    📝 [${issue._parsed.prefix} #${issue._parsed.number}] History.txt → ${journals.length} journal ${journals.length === 1 ? 'entry' : 'entries'}`);
            }
        }

        for (const issue of results.rework) {
            if (!issue._existing) continue;
            // Fetch journals BEFORE addStatusFolder so the v5 logic can count
            // Rework transitions and decide whether to add a new subfolder.
            const journals = await fetchIssueJournals(issue.id);
            const result = await addStatusFolder(issue._existing, issue._status, journals, taskBaseFor(issue));
            // v7 (2026-08-05): do NOT `continue` on a null result. addStatusFolder returns
            // null whenever it decides no new subfolder is needed — which is the NORMAL case
            // on a re-sync. The old `if (!result) continue;` skipped the attachment pass
            // below along with it, so a BA who added evidence WITHOUT triggering a new rework
            // cycle had her files silently withheld while the run still reported success.
            // Caught 2026-08-05 on 273201: API listed 12 attachments, disk had 8; the 4
            // missing were the BA's three latest videos + one earlier. Ruri briefed みや on
            // the ticket having never seen the BA's own evidence.
            if (result && result.unarchived) {
                console.log(`  ↩️  Unarchived: ${issue._existing} → ${result.folderRelPath}`);
                issue._existing = result.folderRelPath; // so subsequent history-update writes to the correct (active) path
            }
            if (result && result.statusFolderPath) {
                console.log(`  🔁 Status folder added: ${result.statusFolderPath}`);
            }
            // v6 (2026-05-20): ALWAYS run attachment-download on rework — even when no NEW
            // subfolder was created. Previously the download only fired when statusFolderPath
            // was truthy, so on a re-sync (folder already counted) journal attachments leaked
            // through. Caught at QA-260876: 3. Rework was created in run-1 but ulasan.png +
            // 2026-05-20_093455.png never downloaded — みや had to fetch them manually.
            // v7 (2026-08-05): status gate REMOVED. This used to require status === 'rework',
            // so a BA adding evidence to a ticket sitting at any other status (Feedback, In
            // Progress, Resolved) had it silently withheld. Attachment sync is per-FILE and
            // idempotent — `known` already prevents re-downloads — so there is no cost to
            // running it on every existing ticket, and the cost of NOT running it is briefing
            // みや on evidence nobody has seen.
            {
                const ticketFullPath = path.join(taskBaseFor(issue), issue._existing);
                if (fs.existsSync(ticketFullPath)) {
                    // Find the LATEST `N. Rework` (or `N. New`) subfolder — the active cycle's home.
                    const entries = fs.readdirSync(ticketFullPath);
                    const reworkEntries = entries
                        .map(e => { const m = e.match(/^(\d+)\.\s*(Rework|New)\s*$/i); return m ? { name: e, num: parseInt(m[1]) } : null; })
                        .filter(Boolean)
                        .sort((a, b) => b.num - a.num);
                    // v7 (2026-08-05): `result` can now be null (no new subfolder needed), so
                    // the old `result.statusFolderPath` fallback would throw. Final fallback is
                    // `0. Brief` — a ticket with no rework subfolder keeps its evidence there.
                    const targetSubfolder = reworkEntries.length
                        ? path.join(ticketFullPath, reworkEntries[0].name)
                        : (result && result.statusFolderPath) || path.join(ticketFullPath, '0. Brief');
                    if (targetSubfolder) {
                        // `known` = every file already present anywhere under the ticket folder
                        // (0. Brief + every status subfolder) so we never re-download.
                        const known = new Set();
                        const briefFolder = path.join(ticketFullPath, '0. Brief');
                        if (fs.existsSync(briefFolder)) fs.readdirSync(briefFolder).forEach(f => known.add(f));
                        for (const e of entries) {
                            const sub = path.join(ticketFullPath, e);
                            if (fs.statSync(sub).isDirectory()) {
                                try { fs.readdirSync(sub).forEach(f => known.add(f)); } catch (_) {}
                            }
                        }
                        const downloaded = await downloadNewAttachments(targetSubfolder, issue.id, Array.from(known));
                        for (const f of downloaded) {
                            console.log(`    ⬇️  ${f} → ${path.basename(targetSubfolder)}/`);
                        }
                    }
                }
            }
        }

        await syncJournalsForExisting(results);
    } catch (err) {
        console.error(`\n  ❌ Error: ${err.message}\n`);
    }
}

// By-ID sync: fetch ONE ticket regardless of assignment, create its folder if new,
// refresh journals/attachments/rework state if existing. Always creates (an explicitly
// named ticket is an explicit retrieval — no --create needed).
async function runSingle(id) {
    try {
        const issue = await fetchSingleIssue(id);
        if (!issue) { console.log(`  ❌ #${id} not found on Redmine`); return; }
        await enrichWithHtmlStatus([issue]);
        const results = classifyIssues([issue]);
        printReport(results);
        console.log(`  👤 Assigned to: ${issue.assigned_to?.name || '(nobody)'} | Project: ${issue.project?.name || '?'} → ${path.basename(taskBaseFor(issue))}\\`);
        for (const it of results.new) {
            const folder = await createTaskFolder(it, it._parsed);
            console.log(`  📁 Created: ${folder}`);
            const journals = await fetchIssueJournals(it.id);
            const assignedDate = extractAssignedToMeDate(journals, it);
            appendActiveBlock(it, it._parsed, folder, assignedDate);
            if (journals.length) {
                writeHistoryFile(path.join(folder, '0. Brief'), journals, {
                    prefix: it._parsed.prefix, number: it._parsed.number,
                    subject: it.subject, status: it._status, updated_on: it.updated_on,
                });
                console.log(`    📝 History.txt → ${journals.length} journal ${journals.length === 1 ? 'entry' : 'entries'}`);
            }
        }
        await reactivateReworkFolders(results);
        await syncJournalsForExisting(results);
        await syncAttachmentsForExisting(results);
    } catch (err) {
        console.error(`\n  ❌ Error: ${err.message}\n`);
    }
}

const args   = process.argv.slice(2);
const poll   = args.includes('--poll');
const create = args.includes('--create');
const idArg  = args.find(a => /^#?\d+$/.test(a));

if (idArg) {
    runSingle(idArg.replace(/^#/, ''));
} else if (poll) {
    console.log(`  Polling every ${POLL_INTERVAL_MINUTES} min. Ctrl+C to stop.\n`);
    const fn = create ? runWithCreate : run;
    fn();
    setInterval(fn, POLL_INTERVAL_MINUTES * 60 * 1000);
} else {
    (create ? runWithCreate : run)();
}
