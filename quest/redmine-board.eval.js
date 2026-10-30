#!/usr/bin/env node
/**
 * redmine-board.eval.js — fixtures for the per-state boards of quest/redmine-board.js (2026-10-03).
 *
 * Rule under test: a ticket assigned to him on a project of ANOTHER active state of the registry
 * (redmine.project_names) gets its own ranked table under that state's heading; a project no
 * registered state names keeps the one-line "OUTSIDE Melaka" note; the Melaka board prints the
 * same bytes whether or not such tickets exist.
 *
 * Sandboxed: http.get is stubbed in-process with a canned issue list (no Redmine call, no write),
 * the registry is a temp copy of system/states.json. The live half stays in domain/list-redmine/eval.js.
 *
 * Run: node quest/redmine-board.eval.js      Exit: 0 = all green, 1 = any red
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { EventEmitter } = require('events');

const REPO = path.resolve(__dirname, '..');
const SB = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-eval-'));
const REAL = JSON.parse(fs.readFileSync(path.join(REPO, 'system', 'states.json'), 'utf8'));
{
    // Sandbox registry = the real one, plus a project name on a NON-active state (selangor is
    // `scaffold`) so "registered but not active" stays covered.
    const reg = JSON.parse(JSON.stringify(REAL));
    reg.states.selangor.redmine.project_names = ['eSOKONGAN SELANGOR'];
    fs.writeFileSync(path.join(SB, 'states.json'), JSON.stringify(reg, null, 2));
}
process.env.STATES_FILE = path.join(SB, 'states.json');
process.env.STATES_LOCAL_FILE = path.join(SB, 'states.local.json'); // absent on purpose
delete process.env.ETANAH_STATE;

const ME = { id: 1311, name: 'Ahmad Ridhwan Anuar (Dev PLP)' };
const P = { Medium: 4, High: 5, Low: 3 };
function iss(id, project, trackerId, tracker, priority, o = {}) {
    return {
        id, project: { name: project }, tracker: { id: trackerId, name: tracker }, priority: { id: P[priority], name: priority },
        status: { name: o.status || 'In Progress' }, assigned_to: o.assignee || ME, start_date: o.start || '2026-09-01',
        due_date: o.due || null, subject: o.subject || `subject ${id}`, description: o.description || '', created_on: (o.start || '2026-09-01') + 'T00:00:00Z',
    };
}
const MLK = [
    iss(1001, 'eSOKONGAN MELAKA', 51, 'eSOKONGAN', 'Medium', { due: '2026-10-09' }),
    iss(1002, 'MLK_03_Pelupusan', 53, 'Internal Issue', 'Medium', { start: '2026-09-10' }),
    iss(1003, 'eSOKONGAN MELAKA', 64, 'Data Patching (PROD)', 'High'),
    iss(1004, 'eSOKONGAN MELAKA', 53, 'Internal Issue', 'Medium', { assignee: { id: 9, name: 'Somebody Else' } }),
];
const TRG = [
    iss(2001, 'eSOKONGAN TERENGGANU', 52, 'eSOKONGAN-CR', 'High', { start: '2026-09-20' }),
    iss(2002, 'eSOKONGAN TERENGGANU', 71, 'Internal Issue (PROD)', 'Medium', { description: 'mohon SEGERA alter tugasan PTTRG/07/01/L/PLPS/2026/135' }),
    iss(2003, 'TRG_03_Pelupusan', 51, 'eSOKONGAN', 'Medium', { due: '2026-10-20' }),
    iss(2004, 'eSOKONGAN TERENGGANU', 51, 'eSOKONGAN', 'High', { due: '2026-10-30' }),
    iss(2005, 'eSOKONGAN TERENGGANU', 53, 'Internal Issue', 'Medium', { start: '2026-08-01' }),
    iss(2006, 'eSOKONGAN TERENGGANU', 53, 'Internal Issue', 'Medium', { status: 'Resolved' }),
    iss(2007, 'esokongan terengganu ', 77, 'Internal Issue (Permanent Fix)', 'Low'),
];
const PRK = [iss(3001, 'eSOKONGAN PERAK', 53, 'Internal Issue', 'Medium')];
const STRAY = [
    iss(4001, 'TRG_04_SPOC_Hasil', 53, 'Internal Issue', 'Medium', { subject: 'unregistered TRG project' }),
    iss(4002, 'eSOKONGAN SELANGOR', 53, 'Internal Issue', 'Medium', { subject: 'scaffold state' }),
    iss(4003, 'Some [Other] Programme', 53, 'Internal Issue', 'Medium', { subject: 'no state at all' }),
];

// ── http stub: the scoped Melaka passes get the Melaka list, the unscoped pass gets everything
//    assigned to him; journals/versions/users answer just enough for the board to run.
let WORLD = [];
let writes = 0;
http.get = (url, opts, cb) => {
    const req = new EventEmitter();
    const u = String(url);
    let body;
    if (/\/projects\/[^/]+\/issues\.json/.test(u)) body = { issues: WORLD.filter(i => MLK.includes(i)) };
    else if (/\/redmine\/issues\.json/.test(u)) {
        const who = (/assigned_to_id=([^&]+)/.exec(u) || [])[1] || '';
        const wanted = who === 'me' ? [ME.id] : who.split('|').map(Number);
        body = { issues: WORLD.filter(i => wanted.includes(i.assigned_to.id)) };
    }
    else if (/\/users\/current\.json/.test(u)) body = { user: { id: ME.id } };
    else if (/\/issues\/(\d+)\.json/.test(u)) { const i = WORLD.find(x => x.id === Number(/\/issues\/(\d+)\.json/.exec(u)[1])); body = { issue: { created_on: i.created_on, journals: [] } }; }
    else body = {};
    const res = new EventEmitter(); res.statusCode = 200;
    setImmediate(() => { cb(res); res.emit('data', JSON.stringify(body)); res.emit('end'); });
    return req;
};
for (const m of ['request']) { const orig = http[m]; http[m] = (...a) => { writes++; return orig.apply(http, a); }; }

const B = require(path.join(__dirname, 'redmine-board.js'));
async function board(world, args = []) {
    WORLD = world;
    const lines = [];
    const log = console.log;
    console.log = (...a) => lines.push(a.join(' '));
    try { await B.main(args); } finally { console.log = log; }
    return lines.join('\n');
}

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail }); }
const ids = txt => [...txt.matchAll(/^\| (\d+) \|/gm)].map(m => Number(m[1]));
const section = (txt, heading) => { const at = txt.indexOf(heading); return at < 0 ? '' : txt.slice(at).split(/\n(?=### |_🚨)/)[0]; };

(async () => {
    const trgReal = REAL.states.terengganu;
    check('R1 real registry: terengganu is active and names its Redmine projects',
        trgReal.work_scope === 'active' && ['eSOKONGAN TERENGGANU', 'TRG_03_Pelupusan', 'TRG_16_Awam', 'e-Tanah Terengganu'].every(n => trgReal.redmine.project_names.includes(n)),
        JSON.stringify(trgReal.redmine));

    // ── Melaka unchanged ────────────────────────────────────────────────────────────────
    const mlkOnly = await board(MLK);
    const mlkOnlyAgain = await board(MLK);
    check('M1 Melaka-only: no state heading, no OUTSIDE note', !/### Terengganu|### Perak|OUTSIDE Melaka/.test(mlkOnly), mlkOnly);
    check('M2 Melaka-only: exactly the three Melaka tables', (mlkOnly.match(/^### /gm) || []).length === 3
        && /^### 1\. PROD .* — 1 open/m.test(mlkOnly) && /^### 2\. eSOKONGAN tracker \(SLA\) — 1 open/m.test(mlkOnly) && /^### 3\. Internal fixes & other — 1 open/m.test(mlkOnly)
        && mlkOnly.indexOf('### 1. PROD') < mlkOnly.indexOf('### 2. eSOKONGAN'), mlkOnly);
    check('M3 Melaka-only: same input, same bytes', mlkOnly === mlkOnlyAgain, '');
    const withTrg = await board([...MLK, ...TRG]);
    const cut = withTrg.indexOf('\n\n### Terengganu');
    check('M4 with Terengganu tickets: everything above the Terengganu table is byte-identical to the Melaka-only board',
        cut > 0 && withTrg.slice(0, cut) === mlkOnly, withTrg);
    for (const flag of ['--tracking', '--all-statuses', '--all-trains', '--json']) {
        const a = await board(MLK, [flag]);
        check(`M5 ${flag}: Melaka-only output carries no state table / key`, !/### Terengganu|"states"/.test(a) && a.length > 0, a.slice(0, 200));
    }
    const jsonMlk = JSON.parse(await board(MLK, ['--json']));
    check('M6 --json keys unchanged when nothing is outside Melaka',
        Object.keys(jsonMlk).join(',') === 'mine,patch,esokongan,other,others,dropped,offProject' && jsonMlk.offProject.length === 0, Object.keys(jsonMlk).join(','));

    // ── Terengganu table ────────────────────────────────────────────────────────────────
    const trgSec = section(withTrg, '### Terengganu');
    check('T1 Terengganu heading counts his open tickets (Resolved hidden like Melaka)', /^### Terengganu — 6 open, assigned to you/m.test(trgSec), trgSec.split('\n')[0]);
    check('T2 same columns as the Melaka tables', trgSec.includes('| # | Severity | Days | Due date | Subject | State |'), trgSec);
    // PROD first, then eSOKONGAN tracker (High before Medium), then the rest by tracker tier:
    // Permanent Fix 2007 (tier 2), Internal Issue 2005 (tier 3), eSOKONGAN-CR 2001 (not placed, last)
    check('T3 ranked: PROD, then eSOKONGAN tracker, then the rest by tracker tier', ids(trgSec).join(',') === '2002,2004,2003,2007,2005,2001', ids(trgSec).join(','));
    check('T4 no Terengganu ticket leaks into a Melaka table or the OUTSIDE note',
        !ids(withTrg.slice(0, cut)).some(i => i >= 2000) && !/OUTSIDE Melaka/.test(withTrg), withTrg);
    check('T5 urgent word in the description is flagged in the Severity cell', /\| 2002 \| Medium · URGENT \(segera\) \|/.test(trgSec), trgSec);
    check('T6 project name matches case/space-insensitively (#2007)', ids(trgSec).includes(2007), ids(trgSec).join(','));
    check('T7 two runs of the Terengganu board are byte-identical', withTrg === await board([...MLK, ...TRG]), '');

    // ── other states + unregistered projects ────────────────────────────────────────────
    const all = await board([...MLK, ...TRG, ...PRK, ...STRAY]);
    check('O1 Perak (board_slot interleave) prints its rest table right after Melaka table 3, not a lone table at the end',
        /^### 3b\. Perak Internal fixes & other — 1 open, assigned to you \(/m.test(all) && ids(section(all, '### 3b. Perak')).join(',') === '3001'
        && !/^### Perak —/m.test(all) && all.indexOf('### 3b. Perak') > all.indexOf('### 3. Internal') && all.indexOf('### 3b. Perak') < all.indexOf('### Terengganu'), all);
    const note = (all.match(/^_🚨 Assigned to you OUTSIDE Melaka.*$/m) || [''])[0];
    check('O2 unregistered project / non-active state / stateless project keep the one-line note',
        /OUTSIDE Melaka \(3\)/.test(note) && ['#4001 [TRG_04_SPOC_Hasil]', '#4002 [eSOKONGAN SELANGOR]', '#4003 [Some [Other] Programme]'].every(s => note.includes(s)), note);
    const tables = all.slice(all.indexOf('### 1.')); // the steal-risk banner above repeats a Melaka id by design
    check('O3 no ticket is lost: every one of his open ids is in exactly one table',
        [1001, 1002, 1003, 2001, 2002, 2003, 2004, 2005, 2007, 3001].every(i => ids(tables).filter(x => x === i).length === 1)
        && [4001, 4002, 4003].every(i => (all.match(new RegExp('#' + i + ' ', 'g')) || []).length === 1), all);
    const strayOnly = await board([...MLK, ...STRAY]);
    check('O4 only unregistered tickets: the note is exactly today\'s text',
        strayOnly === mlkOnly + '\n\n_🚨 Assigned to you OUTSIDE Melaka (3): #4001 [TRG_04_SPOC_Hasil] unregistered TRG project · #4002 [eSOKONGAN SELANGOR] scaffold state · #4003 [Some [Other] Programme] no state at all_', strayOnly);
    const jsonAll = JSON.parse(await board([...MLK, ...TRG, ...STRAY], ['--json']));
    check('O5 --json: offProject still carries every off-Melaka row; states[] added',
        jsonAll.offProject.length === 9 && jsonAll.states.length === 1 && jsonAll.states[0].state === 'terengganu' && jsonAll.states[0].rows.length === 6, Object.keys(jsonAll).join(','));

    // ── --state <key> ───────────────────────────────────────────────────────────────────
    const onlyTrg = await board([...MLK, ...TRG, ...PRK], ['--state', 'terengganu']);
    check('S1 --state terengganu prints only that table', onlyTrg === trgSec.trimEnd() && (onlyTrg.match(/^### /gm) || []).length === 1, onlyTrg);
    check('S2 --state accepts alias / capitalised / code', await board([...MLK, ...TRG], ['--state', 'Terengganu']) === onlyTrg && await board([...MLK, ...TRG], ['--state', 'TRG']) === onlyTrg, '');
    const empty = await board(MLK, ['--state', 'terengganu']);
    check('S3 --state terengganu with no ticket → an empty table, not an error', /^### Terengganu — 0 open, assigned to you/.test(empty) && ids(empty).length === 0, empty);
    const unk = await board(MLK, ['--state', 'johor']);
    check('S4 unknown key says "state UNKNOWN" and prints no table', /state UNKNOWN/.test(unk) && !/###/.test(unk), unk);
    const noKey = await board(MLK, ['--state']);
    check('S5 --state with no key says "state UNKNOWN"', /state UNKNOWN/.test(noKey) && !/###/.test(noKey), noKey);
    const scaffold = await board([...MLK, ...STRAY], ['--state', 'selangor']);
    check('S6 non-active state says it has no board (never an empty table that reads as "nothing open")', /state selangor has no board — work_scope=scaffold/.test(scaffold) && !/###/.test(scaffold), scaffold);
    check('S7 --state melaka prints the normal Melaka board', await board([...MLK, ...TRG], ['--state', 'melaka']) === withTrg, '');
    const sj = JSON.parse(await board([...MLK, ...TRG], ['--state', 'terengganu', '--json']));
    check('S8 --state terengganu --json → that board only', sj.state === 'terengganu' && sj.rows.map(r => r.id).join(',') === '2002,2004,2003,2007,2005,2001', JSON.stringify(sj).slice(0, 120));

    // ── tracker tier inside table 3 (miya 2026-10-19) ───────────────────────────────────
    const TIER = [
        iss(1101, 'MLK_03_Pelupusan', 12, 'Development', 'High', { start: '2026-08-01' }),
        iss(1102, 'MLK_03_Pelupusan', 68, 'CR', 'Medium'),
        iss(1103, 'MLK_03_Pelupusan', 15, 'QA', 'Medium'),
        iss(1104, 'MLK_03_Pelupusan', 53, 'Internal Issue', 'Low'),
        iss(1105, 'MLK_03_Pelupusan', 77, 'Internal Issue (Permanent Fix)', 'Low'),
        iss(1106, 'MLK_03_Pelupusan', 57, 'UAT-OR', 'Low'),
        iss(1107, 'MLK_03_Pelupusan', 79, 'Internal Issue (MA Fix)', 'High'),
    ];
    MLK.push(...TIER);
    const tierSec = section(await board(MLK), '### 3. Internal fixes & other');
    MLK.splice(MLK.length - TIER.length, TIER.length);
    // tier 1 UAT · tier 2 MA Fix (High) + Permanent Fix (Low) · tier 3 QA + Internal Issue (Medium before Low,
    // then oldest) · tier 4 Development + CR (High before Medium)
    check('K1 table 3 sorts by tracker tier before priority', ids(tierSec).join(',') === '1106,1107,1105,1103,1002,1104,1101,1102', ids(tierSec).join(','));

    // ── Perak interleave + shared assignee Ammar (miya 2026-10-30) ────────────────────────
    const AMMAR = { id: 1218, name: 'Ammar Zakwan (Dev PLP)' };
    const PRK2 = [
        iss(3101, 'eSOKONGAN PERAK', 51, 'eSOKONGAN', 'Medium', { assignee: AMMAR, due: '2026-11-16', status: 'New' }),
        iss(3102, 'eSOKONGAN PERAK', 51, 'eSOKONGAN', 'High', { assignee: AMMAR, due: '2026-11-20', status: 'New' }),
        iss(3103, 'eSOKONGAN PERAK', 71, 'Internal Issue (PROD)', 'Medium', { assignee: AMMAR, status: 'Rework' }),
        iss(3104, 'eSOKONGAN PERAK', 77, 'Internal Issue (Permanent Fix)', 'Medium', { assignee: AMMAR }),
        iss(3105, 'eSOKONGAN PERAK', 51, 'eSOKONGAN', 'Medium', { due: '2026-11-10' }),                  // his own Perak eSOKONGAN
        iss(3106, 'eSOKONGAN PERAK', 53, 'Internal Issue', 'Medium', { assignee: AMMAR, status: 'Resolved' }),
        iss(3107, 'eSOKONGAN MELAKA', 53, 'Internal Issue', 'High', { assignee: AMMAR, subject: 'Ammar Melaka row' }),
        iss(3108, 'eSOKONGAN TERENGGANU', 51, 'eSOKONGAN', 'Medium', { assignee: AMMAR, subject: 'Ammar TRG row' }),
    ];
    const pr = await board([...MLK, ...PRK2]);
    const order = ['### 1. PROD', '### 1b. Perak PROD', '### 2. eSOKONGAN', '### 2b. Perak eSOKONGAN', '### 3. Internal', '### 3b. Perak Internal'].map(h => pr.indexOf(h));
    check('P1 order: each Perak table sits right after the Melaka table of the same category', order.every((x, n) => x >= 0 && (n === 0 || x > order[n - 1])), order.join(','));
    check('P2 Perak eSOKONGAN: High first, then nearest due; his own row and Ammar\'s together', ids(section(pr, '### 2b. Perak')).join(',') === '3102,3105,3101', ids(section(pr, '### 2b. Perak')).join(','));
    check('P3 Perak PROD and rest tables carry Ammar\'s rows', ids(section(pr, '### 1b. Perak')).join(',') === '3103' && ids(section(pr, '### 3b. Perak')).join(',') === '3104', pr);
    check('P4 heading names the shared colleague', /^### 2b\. Perak eSOKONGAN tracker — 3 open, assigned to you or Ammar Zakwan \(/m.test(pr), pr);
    check('P5 Ammar\'s row with no quest block shows who holds it and its status', /\| 3101 \|.*\| Ammar Zakwan · New \|$/m.test(pr) && /\| 3105 \|.*\| Not drafted \|$/m.test(pr), pr);
    check('P6 Ammar\'s Resolved Perak row is hidden like any Resolved row', !ids(pr).includes(3106), ids(pr).join(','));
    check('P7 Ammar\'s rows outside Perak projects never enter the board (Melaka-scoped passes miss 3107 by stub design; TRG not shared)',
        !ids(pr).includes(3107) && !ids(pr).includes(3108) && !/OUTSIDE Melaka/.test(pr), pr);
    check('P8 Melaka tables keep their bytes: the board minus the Perak tables equals the Melaka-only board',
        pr.split(/\n\n(?=### \db\. Perak)/).map(p => p.replace(/^### \db\. Perak[\s\S]*?(?=\n\n### |$)/, '')).join('').replace(/\n+$/, '') === mlkOnly.replace(/\n+$/, ''), pr);
    const onlyPrk = await board([...MLK, ...PRK2], ['--state', 'perak']);
    check('P9 --state perak still prints ONE combined table: PROD, eSOKONGAN, rest', /^### Perak — 5 open, assigned to you or Ammar Zakwan/.test(onlyPrk) && ids(onlyPrk).join(',') === '3103,3102,3105,3101,3104', onlyPrk);
    const noPrkSot = await board([...MLK, iss(3201, 'eSOKONGAN PERAK', 51, 'eSOKONGAN', 'Low', { assignee: AMMAR })]);
    check('P10 a Perak category with no row prints no table (only 2b here)', /### 2b\. Perak/.test(noPrkSot) && !/### 1b\.|### 3b\./.test(noPrkSot), noPrkSot);
    const jp = JSON.parse(await board([...MLK, ...PRK2], ['--json']));
    check('P11 --json: Perak board in states[] carries the shared rows; mine[] never does', jp.states.find(s => s.state === 'perak').rows.length === 5 && !jp.mine.some(r => r.id > 3100), JSON.stringify(jp.states.map(s => s.state)));
    check('P12 two runs are byte-identical', pr === await board([...MLK, ...PRK2]), '');

    // ── pure helpers ────────────────────────────────────────────────────────────────────
    const sp = B.splitByState([]);
    check('H1 splitByState([]) → no boards, no rest', sp.boards.length === 0 && sp.rest.length === 0, JSON.stringify(sp));
    const sp2 = B.splitByState([{ id: 1, project: undefined }, { id: 2, project: '' }, { id: 3, project: 'eSOKONGAN MELAKA' }]);
    check('H2 blank / missing project and a Melaka project name never open a state board', sp2.boards.length === 0 && sp2.rest.length === 3, JSON.stringify(sp2.boards));
    check('H3 the eval made no HTTP write (http.request never called)', writes === 0, String(writes));

    fs.rmSync(SB, { recursive: true, force: true });
    let failed = 0;
    for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : ' → ' + String(x.detail).slice(0, 600))); }
    console.log('\nredmine-board.eval: ' + (results.length - failed) + '/' + results.length + ' green');
    process.exit(failed ? 1 : 0);
})();
