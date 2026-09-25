#!/usr/bin/env node
/**
 * redmine-sync.eval.js — fixture-driven eval for addStatusFolder's v11 GENUINE-REOPEN rule.
 *
 * v11 (miya 2026-09-22): rework cycle folders are counted by GENUINE reopens — a status
 * transition FROM a non-rework status INTO a rework status — NOT by folder birthtime.
 * OneDrive rewrites folder mtimes on sync, which made v10's TIME rule miss the 2nd reopen
 * of #278699 (the bug miya caught). Each new "N. Rework" also gets a 0. Brief (BA's new
 * attachments land there) + 2. Fix (his Redmine-upload workspace), mirroring the Task
 * folder's own subfolder convention so the rework root is never a loose dump.
 *
 * Cases (each on its own temp Tasks root — never touches OneDrive, never calls Redmine):
 *   (a) first reopen, no cycle folder            → "3. Rework" created, WITH 0.Brief + 2.Fix
 *   (b) re-sync, same journal                    → no new folder (idempotent)
 *   (c) second GENUINE reopen (exits rework, re-enters) → "4. Rework"; re-sync → still 2
 *   (d) consecutive rework HOPS in one reopen (31→23→38, never exits) → exactly one folder
 *   (e) cycle folders already match the reopen count → nothing created (278699 today)
 *   (f) status not Rework                        → null, nothing created
 *   (g) Rework status but no journal transition  → fallback: create when none, else nothing
 *   (h) Archive/ folder reopened                 → unarchived + "3. Rework"
 *
 * Run: node quest/redmine-sync.eval.js      Exit: 0 = all green, 1 = any red
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const { addStatusFolder, isReworkTransition, isGenuineReopen, genuineReopenCount } = require(path.join(__dirname, 'redmine-sync.js'));

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail }); }

function j(ts, from, to) {
    return { created_on: new Date(ts).toISOString(), details: [{ property: 'attr', name: 'status_id', old_value: String(from), new_value: String(to) }] };
}
function makeRoot(folderName, opts = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-eval-'));
    const rel = opts.archived ? path.join('Archive', folderName) : folderName;
    const full = path.join(root, rel);
    fs.mkdirSync(path.join(full, '0. Brief'), { recursive: true });
    fs.mkdirSync(path.join(full, '2. Fix'), { recursive: true });
    fs.writeFileSync(path.join(full, '1. 999 999.txt'), '');
    for (const c of opts.cycles || []) fs.mkdirSync(path.join(full, c), { recursive: true });
    return { root, rel, full };
}
function cycleDirs(full) {
    return fs.readdirSync(full).filter(e => /^\d+\.\s*(Rework|New)\s*$/i.test(e)).sort();
}
// Item 4 (miya 2026-09-22): a new cycle folder mirrors the Task-folder subfolder convention.
function hasSub(full, cycle) {
    return fs.existsSync(path.join(full, cycle, '0. Brief')) && fs.existsSync(path.join(full, cycle, '2. Fix'));
}

(async () => {
    const now = Date.now();
    const H = 3600 * 1000;
    const FOLDER = '189. ES #999999 - eval fixture';

    // helper sanity
    check('helper: isReworkTransition matches 23/31/38, not 3', isReworkTransition(j(now, 3, 23)) && isReworkTransition(j(now, 3, 31)) && isReworkTransition(j(now, 3, 38)) && !isReworkTransition(j(now, 23, 3)), '');
    check('helper: isGenuineReopen true only from a non-rework status', isGenuineReopen(j(now, 3, 23)) && !isGenuineReopen(j(now, 31, 23)) && !isGenuineReopen(j(now, 23, 3)), '');
    check('helper: genuineReopenCount ignores intra-rework hops', genuineReopenCount([j(now, 3, 31), j(now, 31, 23), j(now, 23, 38)]) === 1, String(genuineReopenCount([j(now, 3, 31), j(now, 31, 23), j(now, 23, 38)])));
    check('helper: genuineReopenCount counts each exit+re-enter', genuineReopenCount([j(now, 3, 23), j(now, 23, 3), j(now, 3, 23)]) === 2, String(genuineReopenCount([j(now, 3, 23), j(now, 23, 3), j(now, 3, 23)])));

    // (a) first reopen → 3. Rework, with 0.Brief + 2.Fix inside
    {
        const fx = makeRoot(FOLDER);
        const journals = [j(now - 2 * H, 1, 2), j(now - 1 * H, 3, 23)];
        const r = await addStatusFolder(fx.rel, 'Rework', journals, fx.root);
        const dirs = cycleDirs(fx.full);
        check('(a) first reopen creates "3. Rework"', r && r.statusFolderPath && dirs.join('|') === '3. Rework', dirs.join('|'));
        check('(a2) new cycle has 0. Brief + 2. Fix', hasSub(fx.full, '3. Rework'), '');

        // (b) re-sync same journal → no new folder
        const r2 = await addStatusFolder(fx.rel, 'Rework', journals, fx.root);
        const dirs2 = cycleDirs(fx.full);
        check('(b) re-sync same journal → no new folder', r2 && r2.statusFolderPath === null && dirs2.join('|') === '3. Rework', dirs2.join('|'));

        // (c) second GENUINE reopen: exits rework (23→3) then re-enters (3→23) → "4. Rework"
        const journals2 = [...journals, j(now - 30 * 1000, 23, 3), j(now, 3, 23)];
        const r3 = await addStatusFolder(fx.rel, 'Rework', journals2, fx.root);
        const dirs3 = cycleDirs(fx.full);
        check('(c) second genuine reopen → "4. Rework"', r3 && r3.statusFolderPath && dirs3.join('|') === '3. Rework|4. Rework', dirs3.join('|'));
        check('(c2) new cycle 4 has 0. Brief + 2. Fix', hasSub(fx.full, '4. Rework'), '');
        const r4 = await addStatusFolder(fx.rel, 'Rework', journals2, fx.root);
        const dirs4 = cycleDirs(fx.full);
        check('(c3) re-sync after 2nd reopen → still 2 folders', r4 && r4.statusFolderPath === null && dirs4.join('|') === '3. Rework|4. Rework', dirs4.join('|'));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }

    // (d) consecutive rework hops in ONE reopen: 3→31→23→38, never exits rework → ONE folder
    {
        const fx = makeRoot(FOLDER);
        const journals = [j(now - 3 * H, 3, 31), j(now - 2 * H, 31, 23), j(now - 1 * H, 23, 38)];
        await addStatusFolder(fx.rel, 'Rework (Requirement Update)', journals, fx.root);
        const d1 = cycleDirs(fx.full);
        check('(d) hop chain in one reopen → one folder', d1.join('|') === '3. Rework', d1.join('|'));
        await addStatusFolder(fx.rel, 'Rework (Requirement Update)', journals, fx.root);
        const d2 = cycleDirs(fx.full);
        check('(d2) re-sync after hop chain → still one folder', d2.join('|') === '3. Rework', d2.join('|'));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }

    // (e) cycle folders on disk already match the reopen count (278699 today: 2 folders, 2 reopens)
    {
        const fx = makeRoot(FOLDER, { cycles: ['3. Rework', '4. Rework'] });
        const journals = [j(now - 5 * 24 * H, 3, 23), j(now - 3 * 24 * H, 23, 3), j(now - 3 * 24 * H + 60000, 3, 23)];
        const r = await addStatusFolder(fx.rel, 'Rework', journals, fx.root);
        const d = cycleDirs(fx.full);
        check('(e) folders already match reopen count → nothing created', r && r.statusFolderPath === null && d.join('|') === '3. Rework|4. Rework', d.join('|'));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }

    // (f) status not rework → null
    {
        const fx = makeRoot(FOLDER);
        const r = await addStatusFolder(fx.rel, 'In Progress', [j(now - 1 * H, 3, 23)], fx.root);
        check('(f) non-rework status → null, no folder', r === null && cycleDirs(fx.full).length === 0, '');
        fs.rmSync(fx.root, { recursive: true, force: true });
    }

    // (g) rework status, no transition in journal
    {
        const fx = makeRoot(FOLDER);
        await addStatusFolder(fx.rel, 'Rework', [], fx.root);
        check('(g) no transition + no folder → fallback creates "3. Rework"', cycleDirs(fx.full).join('|') === '3. Rework', cycleDirs(fx.full).join('|'));
        const r2 = await addStatusFolder(fx.rel, 'Rework', [], fx.root);
        check('(g2) no transition + folder exists → nothing', r2.statusFolderPath === null && cycleDirs(fx.full).length === 1, '');
        fs.rmSync(fx.root, { recursive: true, force: true });
    }

    // (h) Archive/ folder reopened → unarchived + 3. Rework
    {
        const fx = makeRoot(FOLDER, { archived: true });
        const r = await addStatusFolder(fx.rel, 'Rework', [j(now - 1 * H, 3, 23)], fx.root);
        const moved = r && r.unarchived && !r.folderRelPath.startsWith('Archive') && fs.existsSync(path.join(fx.root, r.folderRelPath));
        const d = moved ? cycleDirs(path.join(fx.root, r.folderRelPath)) : [];
        check('(h) archived folder reopened → unarchived + "3. Rework"', moved && d.join('|') === '3. Rework', r ? `${r.folderRelPath} · ${d.join('|')}` : 'null');
        fs.rmSync(fx.root, { recursive: true, force: true });
    }

    let failed = 0;
    for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : ' → ' + x.detail)); }
    console.log('\nredmine-sync.eval: ' + (results.length - failed) + '/' + results.length + ' green');
    process.exit(failed ? 1 : 0);
})();
