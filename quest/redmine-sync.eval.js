#!/usr/bin/env node
/**
 * redmine-sync.eval.js — fixture-driven eval for the Task-folder shape (v13, 2026-09-30, miya).
 *
 * Rule under test: a Rework folder = a separate change WE deployed. The Redmine sync NEVER
 * creates one; it only unarchives a reopened ticket. The one creator is
 * lib/task-folder.js ensureCycleFolder, called by quest/active-cli.js when a quest goes
 * active: one Rework folder per earlier shipped cycle (closed=, closed_cycle2= …).
 *
 * Cases (each on its own temp Tasks root — never touches OneDrive, never calls Redmine):
 *   (a) sync, Rework status, first reopen             → NO cycle folder
 *   (b) sync, colleague reworks 5 times               → NO cycle folder (the #244600 bug)
 *   (c) sync, Resolved → In Progress (#280540)         → reopen counted, NO cycle folder
 *   (d) sync, archived folder reopened                → unarchived, NO cycle folder
 *   (e) sync, status not reopened                     → null
 *   (f) ensureCycleFolder: active, 1 shipped, 0 cycles → "3. Rework\Brief" only (no 2. Fix)
 *   (g) ensureCycleFolder again                        → nothing (idempotent)
 *   (h) ensureCycleFolder: never shipped               → nothing
 *   (i) ensureCycleFolder: status closed/hold          → nothing
 *   (j) ensureCycleFolder: hand-made "3. Rework", 1 shipped → nothing (#280540 today)
 *   (k) ensureCycleFolder: 2 shipped, 1 cycle          → "4. Rework"
 *   (l) briefDir / latestBriefDir: 1. Brief, legacy 0. Brief, newest cycle Brief
 *
 * Run: node quest/redmine-sync.eval.js      Exit: 0 = all green, 1 = any red
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const { addStatusFolder, isGenuineReopen, genuineReopenCount } = require(path.join(__dirname, 'redmine-sync.js'));
const TF = require(path.join(__dirname, '..', 'lib', 'task-folder.js'));

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail }); }

function j(ts, from, to) {
    return { created_on: new Date(ts).toISOString(), details: [{ property: 'attr', name: 'status_id', old_value: String(from), new_value: String(to) }] };
}
function makeRoot(folderName, opts = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-eval-'));
    const rel = opts.archived ? path.join('Archive', folderName) : folderName;
    const full = path.join(root, rel);
    fs.mkdirSync(path.join(full, opts.legacy ? '0. Brief' : '1. Brief'), { recursive: true });
    fs.mkdirSync(path.join(full, '2. Fix'), { recursive: true });
    for (const c of opts.cycles || []) fs.mkdirSync(path.join(full, c), { recursive: true });
    return { root, rel, full };
}
const cycles = full => TF.cycleFolders(full).map(c => c.name).join('|');
const block = (status, ...closed) => ['qa=QA-999999', `status=${status}`, ...closed];

(async () => {
    const now = Date.now();
    const H = 3600 * 1000;
    const FOLDER = '189. ES #999999 - eval fixture';

    check('helper: 3→2 (Resolved→In Progress) is a reopen', isGenuineReopen(j(now, 3, 2)), '');
    check('helper: 2→3 (resolving) is not a reopen', !isGenuineReopen(j(now, 2, 3)), '');
    check('helper: intra-rework hops count once', genuineReopenCount([j(now, 3, 31), j(now, 31, 23), j(now, 23, 38)]) === 1, '');

    { // (a)
        const fx = makeRoot(FOLDER);
        const r = await addStatusFolder(fx.rel, 'Rework', [j(now - H, 3, 23)], fx.root);
        check('(a) sync on Rework → no cycle folder', r && r.statusFolderPath === null && cycles(fx.full) === '', cycles(fx.full));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }
    { // (b)
        const fx = makeRoot(FOLDER);
        const js = [];
        for (let k = 0; k < 5; k++) js.push(j(now - (10 - 2 * k) * H, 23, 3), j(now - (9 - 2 * k) * H, 3, 23));
        await addStatusFolder(fx.rel, 'Rework', js, fx.root);
        await addStatusFolder(fx.rel, 'Rework', js, fx.root);
        check('(b) colleague reworks ×5, synced twice → still no cycle folder', cycles(fx.full) === '', cycles(fx.full));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }
    { // (c)
        const fx = makeRoot(FOLDER, { archived: true });
        const r = await addStatusFolder(fx.rel, 'In Progress', [j(now - 2 * H, 2, 3), j(now - H, 3, 2)], fx.root);
        const moved = r && r.unarchived && fs.existsSync(path.join(fx.root, r.folderRelPath));
        check('(c) Resolved→In Progress → unarchived, no cycle folder', moved && cycles(path.join(fx.root, r.folderRelPath)) === '', r ? r.folderRelPath : 'null');
        fs.rmSync(fx.root, { recursive: true, force: true });
    }
    { // (d)
        const fx = makeRoot(FOLDER, { archived: true });
        const r = await addStatusFolder(fx.rel, 'Rework', [j(now - H, 3, 23)], fx.root);
        check('(d) archived + Rework → unarchived, no cycle folder', r && r.unarchived && cycles(path.join(fx.root, r.folderRelPath)) === '', r ? r.folderRelPath : 'null');
        fs.rmSync(fx.root, { recursive: true, force: true });
    }
    { // (e)
        const fx = makeRoot(FOLDER);
        const r = await addStatusFolder(fx.rel, 'In Progress', [j(now - H, 1, 2)], fx.root);
        check('(e) never reopened → null', r === null, String(r));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }
    { // (f)(g)
        const fx = makeRoot(FOLDER);
        const b = block('active', 'closed=2026-09-24');
        const made = TF.ensureCycleFolder(fx.full, b);
        const onlyBrief = made && fs.readdirSync(made).join('|') === 'Brief';
        check('(f) 1 shipped, active → "3. Rework" holding only Brief', cycles(fx.full) === '3. Rework' && onlyBrief, made ? fs.readdirSync(made).join('|') : 'null');
        const again = TF.ensureCycleFolder(fx.full, b);
        check('(g) run again → nothing', again === null && cycles(fx.full) === '3. Rework', cycles(fx.full));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }
    { // (h)(i)
        const fx = makeRoot(FOLDER);
        check('(h) never shipped → nothing', TF.ensureCycleFolder(fx.full, block('active')) === null && cycles(fx.full) === '', '');
        check('(i) closed / hold → nothing', TF.ensureCycleFolder(fx.full, block('closed', 'closed=2026-09-24')) === null
            && TF.ensureCycleFolder(fx.full, block('hold', 'closed=2026-09-24')) === null && cycles(fx.full) === '', '');
        fs.rmSync(fx.root, { recursive: true, force: true });
    }
    { // (j)
        const fx = makeRoot(FOLDER, { cycles: ['3. Rework'] });
        check('(j) hand-made 3. Rework, 1 shipped → nothing', TF.ensureCycleFolder(fx.full, block('active', 'closed=2026-09-24')) === null && cycles(fx.full) === '3. Rework', cycles(fx.full));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }
    { // (k)
        const fx = makeRoot(FOLDER, { cycles: ['3. Rework'] });
        TF.ensureCycleFolder(fx.full, block('active', 'closed=2026-09-24', 'closed_cycle2=2026-10-02'));
        check('(k) 2 shipped, 1 cycle → "4. Rework"', cycles(fx.full) === '3. Rework|4. Rework', cycles(fx.full));
        fs.rmSync(fx.root, { recursive: true, force: true });
    }
    { // (l)
        const fx = makeRoot(FOLDER);
        const lg = makeRoot(FOLDER, { legacy: true });
        check('(l1) briefDir → 1. Brief', path.basename(TF.briefDir(fx.full)) === '1. Brief', TF.briefDir(fx.full));
        check('(l2) briefDir legacy → 0. Brief', path.basename(TF.briefDir(lg.full)) === '0. Brief', TF.briefDir(lg.full));
        fs.mkdirSync(path.join(fx.full, '3. Rework', 'Brief'), { recursive: true });
        check('(l3) latestBriefDir → 3. Rework\\Brief', TF.latestBriefDir(fx.full) === path.join(fx.full, '3. Rework', 'Brief'), TF.latestBriefDir(fx.full));
        fs.rmSync(fx.root, { recursive: true, force: true });
        fs.rmSync(lg.root, { recursive: true, force: true });
    }

    let failed = 0;
    for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.name + (x.pass ? '' : ' → ' + x.detail)); }
    console.log('\nredmine-sync.eval: ' + (results.length - failed) + '/' + results.length + ' green');
    process.exit(failed ? 1 : 0);
})();
