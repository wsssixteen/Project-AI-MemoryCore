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
    else if (/\/redmine\/issues\.json/.test(u)) body = { issues: WORLD.filter(i => i.assigned_to.id === ME.id) };
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
        && /^### 1\. eSOKONGAN tracker \(SLA\) — 1 open/m.test(mlkOnly) && /^### 2\. PROD .* — 1 open/m.test(mlkOnly) && /^### 3\. Internal fixes & other — 1 open/m.test(mlkOnly), mlkOnly);
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
    // eSOKONGAN tracker first (High before Medium), then PROD, then the rest (High, then Medium oldest first, then Low)
    check('T3 ranked: eSOKONGAN tracker, then PROD, then the rest', ids(trgSec).join(',') === '2004,2003,2002,2001,2005,2007', ids(trgSec).join(','));
    check('T4 no Terengganu ticket leaks into a Melaka table or the OUTSIDE note',
        !ids(withTrg.slice(0, cut)).some(i => i >= 2000) && !/OUTSIDE Melaka/.test(withTrg), withTrg);
    check('T5 urgent word in the description is flagged in the Severity cell', /\| 2002 \| Medium · URGENT \(segera\) \|/.test(trgSec), trgSec);
    check('T6 project name matches case/space-insensitively (#2007)', ids(trgSec).includes(2007), ids(trgSec).join(','));
    check('T7 two runs of the Terengganu board are byte-identical', withTrg === await board([...MLK, ...TRG]), '');

    // ── other states + unregistered projects ────────────────────────────────────────────
    const all = await board([...MLK, ...TRG, ...PRK, ...STRAY]);
    check('O1 a second active state (Perak) gets its own table', /^### Perak — 1 open, assigned to you/m.test(all) && ids(section(all, '### Perak')).join(',') === '3001', all);
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
    check('S8 --state terengganu --json → that board only', sj.state === 'terengganu' && sj.rows.map(r => r.id).join(',') === '2004,2003,2002,2001,2005,2007', JSON.stringify(sj).slice(0, 120));

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
