#!/usr/bin/env node
/**
 * redmine-sync.eval.js — fixture-driven eval for addStatusFolder's v10 TIME rule.
 *
 * Replay case (2026-09-14, #278699): BA returned the ticket to Rework twice
 * (2026-09-09 03:53Z and 2026-09-11 10:55Z). v8.1's "create only when NONE exists"
 * rule gave the second reopen no folder, so both cycles' attachments piled into
 * one "3. Rework" and /quest resume could not see a 2nd cycle.
 *
 * Cases (each on its own temp Tasks root — never touches the real OneDrive tree,
 * never calls Redmine):
 *   (a) first reopen, no cycle folder            → "3. Rework" created
 *   (b) re-sync, same journal                    → no new folder (idempotent)
 *   (c) second reopen AFTER the folder was born  → "4. Rework" created; re-sync → still 2
 *   (d) status-hop chain inside ONE reopen       → exactly one folder, re-sync → still one
 *   (e) hand-made folder NEWER than the reopen   → nothing created (the 278699 state today)
 *   (f) status not Rework                        → null, nothing created
 *   (g) Rework status but no transition in journal (journal not included) → v8.1 fallback:
 *       create when none exists, nothing when one exists
 *   (h) Archive/ folder reopened                 → unarchived + "3. Rework" (unarchive kept)
 *
 * Run: node quest/redmine-sync.eval.js      Exit: 0 = all green, 1 = any red
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const { addStatusFolder, isReworkTransition, latestReworkTransition } = require(path.join(__dirname, 'redmine-sync.js'));

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail }); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

const H = 3600 * 1000;
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

(async () => {
    const now = Date.now();
    const FOLDER = '189. ES #999999 - eval fixture';

    // helper sanity
    check('helper: isReworkTransition matches 23/31/38, not 3', isReworkTransition(j(now, 3, 23)) && isReworkTransition(j(now, 3, 31)) && isReworkTransition(j(now, 3, 38)) && !isReworkTransition(j(now, 23, 3)), '');
    check('helper: latestReworkTransition picks the newest', latestReworkTransition([j(now - 3 * H, 3, 23), j(now - 1 * H, 3, 23), j(now - 2 * H, 3, 23)]).getTime() === now - 1 * H, '');
    check('helper: latestReworkTransition null when none', latestReworkTransition([j(now, 23, 3)]) === null, '');

    // (a) first reopen → 3. Rework
    {
        const fx = makeRoot(FOLDER);
        const journals = [j(now - 2 * H, 1, 2), j(now - 1 * H, 3, 23)];
        const r = await addStatusFolder(fx.rel, 'Rework', journals, fx.root);
        const dirs = cycleDirs(fx.full);
        check('(a) first reopen creates "3. Rework"', r && r.statusFolderPath && dirs.join('|') === '3. Rework', dirs.join('|'));

        // (b) re-sync same day → no new folder
        const r2 = await addStatusFolder(fx.rel, 'Rework', journals, fx.root);
        const dirs2 = cycleDirs(fx.full);
        check('(b) re-sync same journal → no new folder', r2 && r2.statusFolderPath === null && dirs2.join('|') === '3. Rework', dirs2.join('|'));

        // (c) second reopen AFTER the folder was born (2 days later in life; 1.2 s here — same comparison)
        await sleep(1200);
        const journals2 = [...journals, j(Date.now() - 200, 23, 3), j(Date.now(), 3, 23)];
        const r3 = await addStatusFolder(fx.rel, 'Rework', journals2, fx.root);
        const dirs3 = cycleDirs(fx.full);
        check('(c) second reopen newer than folder → "4. Rework"', r3 && r3.statusFolderPath && dirs3.join('|') === '3. Rework|4. Rework', dirs3.join('|'));
        const r4 = await addStatusFolder(fx.rel, 'Rework', journals2, fx.root);
        const dirs4 = cycleDirs(fx.full);
        check('(c2) re-sync after 2nd reopen → still 2 folders', r4 && r4.statusFolderPath === null && dirs4.join('|') === '3. Rework|4. Rework', dirs4.join('|'));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }

    // (d) hop chain inside one reopen: 3→31→23→3→38, all before the sync → ONE folder
    {
        const fx = makeRoot(FOLDER);
        const journals = [j(now - 3 * H, 3, 31), j(now - 2 * H, 31, 23), j(now - 1.5 * H, 23, 3), j(now - 1 * H, 3, 38)];
        await addStatusFolder(fx.rel, 'Rework (Requirement Update)', journals, fx.root);
        const d1 = cycleDirs(fx.full);
        check('(d) hop chain in one reopen → one folder', d1.join('|') === '3. Rework', d1.join('|'));
        await addStatusFolder(fx.rel, 'Rework (Requirement Update)', journals, fx.root);
        const d2 = cycleDirs(fx.full);
        check('(d2) re-sync after hop chain → still one folder', d2.join('|') === '3. Rework', d2.join('|'));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }

    // (e) hand-made folders NEWER than every reopen (278699 today: 3. Rework + 4. Rework on disk)
    {
        const fx = makeRoot(FOLDER, { cycles: ['3. Rework', '4. Rework'] });
        const journals = [j(now - 5 * 24 * H, 3, 23), j(now - 3 * 24 * H, 3, 23)];
        const r = await addStatusFolder(fx.rel, 'Rework', journals, fx.root);
        const d = cycleDirs(fx.full);
        check('(e) folders newer than latest reopen → nothing created', r && r.statusFolderPath === null && d.join('|') === '3. Rework|4. Rework', d.join('|'));
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
