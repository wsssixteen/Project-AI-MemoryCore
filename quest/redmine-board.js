// redmine-board.js — LIVE Melaka-Pelupusan ticket board for session boot.
//
// Usage:
//   node quest/redmine-board.js             — miya's list only (boot default)
//   node quest/redmine-board.js --tracking  — also show colleagues' tickets
//   node quest/redmine-board.js --all-trains / --all-statuses — undo a filter
//   node quest/redmine-board.js --json      — raw rows, for other tooling
//
// Scope (miya 2026-08-05): every OPEN Melaka ticket whose Module is Pelupusan,
// across eSOKONGAN + every Internal Issue variant + Data Patching (PROD) —
// REGARDLESS of assignee, because miya tracks colleagues' tickets too.
// Redmine's own list carries columns he does not want; this renders his shape.
//
// Ranking (3-DAY RULE, miya 2026-07-27): descending days elapsed since
// start_date, tie-break on nearer due date. Days is a bare number.
// Deadline column is a plain word — no glyphs, no "+3d", no "days left".

const http = require('http');
const fs   = require('fs');
const path = require('path');

const { renderStealBanner } = require('../domain/steal-risk-flag/steal-risk');

const ACTIVE_TXT = path.join(__dirname, 'active.txt');

const REDMINE_BASE = 'http://172.16.90.169/redmine';
const REDMINE_KEY  = '9565c21aa6cd9672fd3c7c2c7fec4c934c2f7c66'; // same constant as redmine-sync.js:14
const PROJECT      = 'helpdesk_melaka';
const ME           = 'Ahmad Ridhwan Anuar';
const INTERNAL_DEADLINE_DAYS = 3;

// Redmine appends a role suffix to the display name — "Ahmad Ridhwan Anuar (Dev PLP)".
// Match on the name with any trailing "(...)" role tag stripped, so a role change on
// Redmine never silently empties his board (2026-09-22: the suffix classified all 14
// of his open tickets as colleagues' -> mine=0 -> an empty boot board).
const isMe = name => (name || '').replace(/\s*\([^)]*\)\s*$/, '').trim() === ME;

// Three passes, unioned by issue id. Module=Pelupusan alone is NOT enough:
// #273919 (miya's own, Apply-ready) carries Module='Awam' + Awam Sub Module=
// 'Awam Pelupusan', so a single cf_17 filter silently dropped it. The
// assigned_to_id=me pass is the safety net — a mislabelled module must never
// hide his own work (undercount hides miya's work, 2026-08-04).
// Scoped to the Melaka project.
const FILTERS = [
    'cf_17=Pelupusan',              // Module
    'cf_77=Awam%20Pelupusan',       // Awam Sub Module
    'assigned_to_id=me',
];

// UNSCOPED pass — no project, no tracker, no module (miya 2026-08-05: "who knows
// I might receive other tickets from other states"). Everything above is filtered
// to helpdesk_melaka, so a ticket assigned to him on ANOTHER state's project
// would be invisible. This pass cannot miss it; anything it finds outside the
// Melaka project is surfaced on its own line, never merged into the ranked list.
// His Melaka work spans TWO Redmine projects — the eSOKONGAN tracker lives under
// 'eSOKONGAN MELAKA', the Internal Issue / Data Patching tickets under 'MLK_03_Pelupusan'.
// Both must be recognised as Melaka, or his own tickets get mis-flagged "outside Melaka"
// and dropped from the board (2026-09-22: 4 real Melaka tickets excluded this way).
const MELAKA_PROJECTS = new Set(['eSOKONGAN MELAKA', 'MLK_03_Pelupusan']);

// 51 eSOKONGAN · 53 Internal Issue · 63 Internal Issue (PROD-CR) · 64 Data Patching (PROD)
// 71 Internal Issue (PROD) · 77 Internal Issue (Permanent Fix) · 79 Internal Issue (MA Fix)
const TRACKER_IDS = [51, 53, 63, 64, 71, 77, 79];

// Statuses hidden from the board (miya 2026-08-05): a fix is already delivered and
// sitting with the BA — nothing for us to do, so it is noise on a work board.
// Pass --all-statuses to see them.
const HIDDEN_STATUSES = new Set(['Resolved', 'Verified']);

// Release trains owned by OTHER teams (miya 2026-08-05). A ticket can carry
// Module=Pelupusan and still belong to another team's train, because every
// Redmine version is sharing=system — #273214 is Module=Pelupusan on
// MLK_04_SPOC_Hasil 1.5.1, and its code (my/gov/etanah/spochasil/...) exists in
// NO repo under E:\Projects\Melaka. Match on the version's OWNING PROJECT, never
// on fixed_version.name — the name is just "1.5.1", and two live versions are
// both named "1.0.13" on different projects.
// A blank target version is KEPT: all 9 of miya's own rows have none.
const FOREIGN_TRAINS = new Set(['MLK_04_SPOC_Hasil']);

// Tickets miya has claimed as his own even though Redmine still shows another
// name (miya 2026-08-05: "I believe in the future they will just assign it under
// my name — for now under our local list it should just be under me").
// ONLY miya adds to this list. Redmine stays untouched; this is a local view.
const ADOPTED_AS_MINE = new Set([
    273956, // PRBB - Tukarkan Unit METRIK TAN kepada METER PADU
    273837, // PPTPB - Patching Nama Jabatan di Surat YBJT
]);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-08-12" -> "12 Aug". Year dropped (miya 2026-08-05) — everything on this
// board is current-year by construction, so the year was four dead characters.
function shortDate(iso) {
    if (!iso) return '—';
    const [, m, d] = iso.split('-');
    return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}

function fetchOne(filter, { scoped = true } = {}) {
    const qs = ['status_id=open', filter, 'limit=100'];
    if (scoped) qs.splice(2, 0, `tracker_id=${TRACKER_IDS.join('|')}`);
    const base = scoped ? `${REDMINE_BASE}/projects/${PROJECT}/issues.json` : `${REDMINE_BASE}/issues.json`;
    const url = `${base}?${qs.join('&')}`;
    return new Promise((resolve, reject) => {
        http.get(url, { headers: { 'X-Redmine-API-Key': REDMINE_KEY } }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} on ${filter}`));
                try { resolve(JSON.parse(data).issues || []); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function fetchIssues() {
    const batches = await Promise.all([
        ...FILTERS.map(f => fetchOne(f)),
        fetchOne('assigned_to_id=me', { scoped: false }), // cross-state safety net
    ]);
    const byId = new Map();
    for (const batch of batches) for (const issue of batch) byId.set(issue.id, issue);
    return [...byId.values()];
}

function fetchVersionProject(versionId) {
    return new Promise(resolve => {
        http.get(`${REDMINE_BASE}/versions/${versionId}.json`,
            { headers: { 'X-Redmine-API-Key': REDMINE_KEY } }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(data).version.project.name); }
                    catch { resolve(null); }
                });
            }).on('error', () => resolve(null));
    });
}

// Resolve each distinct version id ONCE, then stamp every row with its train.
async function resolveTrains(issues) {
    const ids = [...new Set(issues.filter(i => i.fixed_version).map(i => i.fixed_version.id))];
    const projects = await Promise.all(ids.map(fetchVersionProject));
    const byVersion = new Map(ids.map((id, n) => [id, projects[n]]));
    return byVersion;
}

// My Redmine user id — needed to find the assignment-to-me journal entry. Resolved
// once via the API key's own /users/current.
function fetchMyId() {
    return new Promise(resolve => {
        http.get(`${REDMINE_BASE}/users/current.json`,
            { headers: { 'X-Redmine-API-Key': REDMINE_KEY } }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => { try { resolve(JSON.parse(data).user.id); } catch { resolve(null); } });
            }).on('error', () => resolve(null));
    });
}

// RECEIVED date (miya 2026-09-22): the day the ticket actually landed on HIS desk —
// the LATEST journal where assigned_to_id was set to him. A reassigned rework is only
// "his" from that reassignment, so start_date (which can be months earlier, when the
// ticket was first created) is the wrong age. Fallback = created_on if it was created
// already assigned to him (no reassignment journal). Returns "YYYY-MM-DD" or null.
function fetchReceivedDate(issueId, myId) {
    return new Promise(resolve => {
        http.get(`${REDMINE_BASE}/issues/${issueId}.json?include=journals`,
            { headers: { 'X-Redmine-API-Key': REDMINE_KEY } }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        const iss = JSON.parse(data).issue;
                        let received = null;
                        for (const jr of (iss.journals || [])) {
                            for (const det of (jr.details || [])) {
                                if (det.property === 'attr' && det.name === 'assigned_to_id'
                                    && String(det.new_value) === String(myId)) {
                                    received = jr.created_on; // journals are chronological — last write wins
                                }
                            }
                        }
                        const iso = received || iss.created_on || null;
                        resolve(iso ? String(iso).slice(0, 10) : null);
                    } catch { resolve(null); }
                });
            }).on('error', () => resolve(null));
    });
}

// Stamp every "mine" row with its received-date age. Best-effort: any fetch that fails
// leaves the row's start_date-based days untouched, so an offline/journal-less run still
// renders (just with the older age basis).
async function stampReceivedDays(mineRows, today) {
    const myId = await fetchMyId();
    if (!myId) return;
    await Promise.all(mineRows.map(async r => {
        const recv = await fetchReceivedDate(r.id, myId);
        if (recv) { r.received = recv; r.days = daysSince(recv, today); }
    }));
}

// STATE — read from quest/active.txt, never hand-typed, so the column loads the
// same way every boot (miya 2026-08-05: "make the table deterministic so it will
// CONSISTENTLY load the same way").
//   no block in active.txt        -> "Not drafted"   (his term: we "draft" a ticket)
//   block carries board_state=    -> that value, verbatim  (the short phase word)
//   block carries phase= only     -> "Phase <n>"
// board_state is the single field to update when a quest moves; it is written by
// hand into the block on purpose — the phase a quest REACHED is a judgment
// (Rubric done? Apply-ready?) that no field on disk otherwise records.
function readStates() {
    const states = new Map();
    let text;
    try { text = fs.readFileSync(ACTIVE_TXT, 'utf-8'); } catch { return states; }
    for (const block of text.split(/\r?\n\s*\r?\n/)) {
        const qa = /^\s*qa=\D*(\d+)\s*$/m.exec(block);
        if (!qa) continue;
        const id = Number(qa[1]);
        const explicit = /^\s*board_state=(.+)$/m.exec(block);
        const phase = /^\s*phase=(.+)$/m.exec(block);
        if (explicit) states.set(id, explicit[1].trim());
        else if (phase) states.set(id, `Phase ${phase[1].trim()}`);
    }
    return states;
}

// WORKING days elapsed — Sat/Sun excluded (miya 2026-08-05: "esokongan tickets
// seem they do not include weekends"). Verified against Redmine's own SLA:
// #274046 Reported (TerraDesk) 2026-08-05 Wed -> Due 2026-08-14 Thu = exactly 7
// working days; the same 7 holds for #273621 and #273921. On calendar days those
// spans are 9, which matches nothing.
// The internal deadline is therefore 3 WORKING days, not 3 calendar days.
function daysSince(dateStr, today) {
    if (!dateStr) return null;
    let count = 0;
    const cursor = new Date(`${dateStr}T00:00:00`);
    while (cursor < today) {
        cursor.setDate(cursor.getDate() + 1);
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) count++;   // 0 = Sun, 6 = Sat
    }
    return count;
}

function shape(issues, today, trainByVersion, states) {
    return issues.map(i => {
        const trainProject = i.fixed_version ? (trainByVersion.get(i.fixed_version.id) || null) : null;
        const days = daysSince(i.start_date, today);
        let deadline = 'ok';
        if (days !== null) {
            if (days > INTERNAL_DEADLINE_DAYS) deadline = 'overdue';
            else if (days === INTERNAL_DEADLINE_DAYS) deadline = 'today';
        }
        return {
            id: i.id,
            tracker: i.tracker.name,
            tracker_id: i.tracker.id,
            priority: i.priority ? i.priority.name : '—',
            priority_id: i.priority ? i.priority.id : 0,
            status: i.status.name,
            assignee: i.assigned_to ? i.assigned_to.name : 'unassigned',
            start: i.start_date || null,
            due: i.due_date || null,
            days,
            deadline,
            trainProject,
            train: trainProject ? `${trainProject} ${i.fixed_version.name}` : null,
            state: states.get(i.id) || 'Not drafted',
            project: i.project ? i.project.name : '(unknown)',
            subject: (i.subject || '').trim(),
        };
    });
}

function rankMine(rows) {
    return rows.slice().sort((a, b) => {
        if (b.days !== a.days) return (b.days ?? -1) - (a.days ?? -1);
        if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
        if (a.due && !b.due) return -1;
        if (!a.due && b.due) return 1;
        return a.id - b.id;
    });
}

// THREE-TABLE SPLIT (miya 2026-09-22): his list is presented as three
// priority-ordered tables, categorised DETERMINISTICALLY by tracker_id — the
// tracker IS the category, so the split never depends on parsing a subject.
//   Table 1 Patching (PROD): where we patch dokumen / patch data / alter flowable.
//     63 Internal Issue (PROD-CR) · 64 Data Patching (PROD) · 71 Internal Issue (PROD)
//   Table 2 eSOKONGAN tracker: 51 — ranked severity DESC, then nearest due date.
//   Table 3 Internal fixes & other: everything else (53 Internal Issue · 77 Permanent
//     Fix · 79 MA Fix + any tracker not above).
const PATCH_TRACKER_IDS     = new Set([63, 64, 71]);
const ESOKONGAN_TRACKER_IDS = new Set([51]);

function categoryOf(r) {
    if (PATCH_TRACKER_IDS.has(r.tracker_id)) return 'patch';
    if (ESOKONGAN_TRACKER_IDS.has(r.tracker_id)) return 'esokongan';
    return 'other';
}

// Severity = Redmine Priority. Higher rank = more severe. Named map first (this
// instance names them per reference_redmine_sla_hours), then fall back to
// priority_id (Redmine default: higher id = higher priority).
const SEVERITY_RANK = { immediate: 5, critical: 5, urgent: 4, high: 3, normal: 2, medium: 2, low: 1 };
function severityRank(r) {
    const byName = SEVERITY_RANK[(r.priority || '').toLowerCase()];
    return byName != null ? byName : (r.priority_id || 0);
}

// eSOKONGAN order (miya 2026-09-22): severity DESC first, then nearest due date
// (soonest first; no-due rows last), then id.
function rankEsokongan(rows) {
    return rows.slice().sort((a, b) => {
        const s = severityRank(b) - severityRank(a);
        if (s !== 0) return s;
        if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
        if (a.due && !b.due) return -1;
        if (!a.due && b.due) return 1;
        return a.id - b.id;
    });
}

function renderRows5(rows) {
    return rows.map(r => `| ${r.id} | ${r.days ?? '—'} | ${shortDate(r.due)} | ${r.subject} | ${r.state} |`);
}

function renderPatch(rows) {
    return [`### 1. Patching (PROD) — ${rows.length} open (ranked: oldest start first)`, '',
        '| # | Days | Due date | Subject | State |', '|---|---|---|---|---|',
        ...renderRows5(rows)].join('\n');
}

function renderEsokongan(rows) {
    const out = [`### 2. eSOKONGAN tracker — ${rows.length} open (ranked: severity, then nearest due)`, '',
        '| # | Severity | Days | Due date | Subject | State |', '|---|---|---|---|---|---|'];
    for (const r of rows) {
        out.push(`| ${r.id} | ${r.priority} | ${r.days ?? '—'} | ${shortDate(r.due)} | ${r.subject} | ${r.state} |`);
    }
    return out.join('\n');
}

function renderOther(rows) {
    return [`### 3. Internal fixes & other — ${rows.length} open (ranked: oldest start first)`, '',
        '| # | Days | Due date | Subject | State |', '|---|---|---|---|---|',
        ...renderRows5(rows)].join('\n');
}

function renderOthers(rows) {
    const sorted = rows.slice().sort((a, b) => (a.start || '').localeCompare(b.start || '') || a.id - b.id);
    const out = [`### Tracking — ${sorted.length} open under other names`, '',
        '| # | Tracker | Status | Assignee | Train | Subject |', '|---|---|---|---|---|---|'];
    for (const r of sorted) {
        out.push(`| ${r.id} | ${r.tracker} | ${r.status} | ${r.assignee} | ${r.train || '—'} | ${r.subject} |`);
    }
    return out.join('\n');
}

async function main() {
    const args = process.argv.slice(2);
    const today = new Date(new Date().toDateString());
    const issues = await fetchIssues();
    let rows = shape(issues, today, await resolveTrains(issues), readStates());

    if (!args.includes('--all-statuses')) {
        rows = rows.filter(r => !HIDDEN_STATUSES.has(r.status));
    }

    // Foreign-train exclusion. Never silent: excluded rows are named below the
    // tables, because a hidden row reads as "covered everything" when it isn't.
    let dropped = [];
    if (!args.includes('--all-trains')) {
        dropped = rows.filter(r => r.trainProject && FOREIGN_TRAINS.has(r.trainProject));
        rows = rows.filter(r => !dropped.includes(r));
    }

    // Anything assigned to miya OUTSIDE the Melaka project — another state, another
    // programme. Surfaced separately so it can never be mistaken for Melaka work,
    // and can never be silently dropped by the Melaka-scoped filters either.
    const offProject = rows.filter(r => isMe(r.assignee) && !MELAKA_PROJECTS.has(r.project));
    rows = rows.filter(r => !offProject.includes(r));

    const isMine = r => isMe(r.assignee) || ADOPTED_AS_MINE.has(r.id);
    const mineRows = rows.filter(isMine);
    await stampReceivedDays(mineRows, today);   // Days = age since HE received it (miya 2026-09-22)
    const mine = rankMine(mineRows);            // rank AFTER re-stamping days
    const others = rows.filter(r => !isMine(r));

    // His list, split into the three priority-ordered tables (miya 2026-09-22).
    const minePatch = mine.filter(r => categoryOf(r) === 'patch');       // age-ranked (from rankMine)
    const mineEsok  = rankEsokongan(mine.filter(r => categoryOf(r) === 'esokongan')); // severity, then due
    const mineOther = mine.filter(r => categoryOf(r) === 'other');       // age-ranked (from rankMine)

    if (args.includes('--json')) {
        console.log(JSON.stringify({ mine, patch: minePatch, esokongan: mineEsok, other: mineOther, others, dropped, offProject }, null, 2));
        return;
    }
    // QUICK-WIN / steal-risk banner ABOVE the age-ranked table: a diagnosed patch
    // sitting idle is the cheapest KPI on the board and losable to whoever applies
    // it first (275587 was stolen this way, 2026-08-17). Silent when nothing
    // qualifies. Grab-risk beats age — that is why it prints first.
    const stealBanner = renderStealBanner(mine);
    if (stealBanner) { console.log(stealBanner); console.log(''); }

    // Default is MINE ONLY (miya 2026-08-05: "present to me ONLY my list").
    // The colleagues' table is still built — ask for it with --tracking.
    console.log(renderPatch(minePatch));
    console.log('');
    console.log(renderEsokongan(mineEsok));
    console.log('');
    console.log(renderOther(mineOther));
    if (args.includes('--tracking')) {
        console.log('');
        console.log(renderOthers(others));
    }
    if (offProject.length) {
        console.log('');
        console.log(`_🚨 Assigned to you OUTSIDE Melaka (${offProject.length}): ` +
            offProject.map(r => `#${r.id} [${r.project}] ${r.subject}`).join(' · ') + '_');
    }
    if (dropped.length) {
        console.log('');
        console.log(`_Excluded — other team's release train (${dropped.length}): ` +
            dropped.map(r => `#${r.id} ${r.train}`).join(' · ') + '. Show with --all-trains._');
    }
}

main().catch(e => {
    console.log(`⚠️  redmine-board: ${e.message} — Redmine unreachable, fall back to quest/active.txt`);
    process.exitCode = 0; // never break boot
});
