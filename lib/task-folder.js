// task-folder.js — one home for the Task-folder shape (2026-09-30, per みや, #280540).
//
// Shape going forward:
//   <n>. <tracker> #<num> - <subject>\
//     1. Brief\        BA files · History.txt · Description.txt   (legacy name: 0. Brief)
//     2. Fix\          our cycle-1 files
//     3. Rework\       our cycle-2 deploy
//       Brief\         BA's new files for that cycle only          (legacy: 0. Brief)
//       1. …  2. …     our fixes / scripts / photos, loose
//
// A Rework folder = a separate change WE deployed. It is never created from a Redmine
// status change (that made empty folders: #244600 had 3–7. Rework, all empty).
// Old folders are never renamed; every reader goes through these helpers so both
// names keep working.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT_BRIEF = '1. Brief';
const LEGACY_BRIEF = '0. Brief';
const CYCLE_BRIEF = 'Brief';
const CYCLE_RE = /^(\d+)\.\s*(Rework|New|Addition)\s*$/i;

// Main repo root, also when the caller runs inside .claude\worktrees\<name>\ — project
// folders and active.txt are untracked/confidential and live only in the main checkout.
function mainRoot(from = __dirname) {
    const abs = path.resolve(from);
    const m = abs.match(/^(.*?)[\\/]\.claude[\\/]worktrees[\\/][^\\/]+/);
    if (m) return m[1];
    return path.resolve(__dirname, '..');
}

// Root Brief folder of a Task folder: 1. Brief, else legacy 0. Brief, else the new name.
function briefDir(taskFolder) {
    const a = path.join(taskFolder, ROOT_BRIEF);
    if (fs.existsSync(a)) return a;
    const b = path.join(taskFolder, LEGACY_BRIEF);
    if (fs.existsSync(b)) return b;
    return a;
}

// Cycle folders, sorted by number: [{ name, num, full }]
function cycleFolders(taskFolder) {
    if (!fs.existsSync(taskFolder)) return [];
    return fs.readdirSync(taskFolder, { withFileTypes: true })
        .filter(e => e.isDirectory() && CYCLE_RE.test(e.name))
        .map(e => ({ name: e.name, num: parseInt(e.name.match(CYCLE_RE)[1], 10), full: path.join(taskFolder, e.name) }))
        .sort((x, y) => x.num - y.num);
}

// Brief folder inside a cycle folder: Brief, else legacy 0. Brief, else the new name.
function cycleBriefDir(cycleFull) {
    for (const n of [CYCLE_BRIEF, LEGACY_BRIEF]) {
        const p = path.join(cycleFull, n);
        if (fs.existsSync(p)) return p;
    }
    return path.join(cycleFull, CYCLE_BRIEF);
}

// Where BA's newest attachments belong: newest cycle's Brief, else the root Brief.
function latestBriefDir(taskFolder) {
    const c = cycleFolders(taskFolder);
    return c.length ? cycleBriefDir(c[c.length - 1].full) : briefDir(taskFolder);
}

// Every Brief folder (root + each cycle), for readers that must see all BA evidence.
function allBriefDirs(taskFolder) {
    const out = [briefDir(taskFolder)];
    for (const c of cycleFolders(taskFolder)) out.push(cycleBriefDir(c.full));
    return out.filter(p => fs.existsSync(p));
}

function hasFiles(dir) {
    if (!fs.existsSync(dir)) return false;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isFile()) return true;
        if (e.isDirectory() && hasFiles(path.join(dir, e.name))) return true;
    }
    return false;
}

// Shipped cycles = our close stamps in the quest block: closed=, closed_cycle2=, closed_cycle3= …
function shippedCycles(blockLines) {
    return (blockLines || []).filter(l => /^closed(_cycle\d+)?=\S/.test(l)).length;
}

// The ONE place a Rework folder is created. Rule: while the quest is being worked on
// (status active), we need one Rework folder per earlier shipped cycle
// (cycle 1 = root 2. Fix). Count-based, no timestamps (OneDrive rewrites mtimes),
// idempotent. Returns the created path, or null.
function ensureCycleFolder(taskFolder, blockLines) {
    if (!taskFolder || !fs.existsSync(taskFolder)) return null;
    const status = ((blockLines || []).find(l => l.startsWith('status=')) || '').slice(7);
    if (status !== 'active') return null;
    const shipped = shippedCycles(blockLines);
    const cycles = cycleFolders(taskFolder);
    if (shipped <= cycles.length) return null;
    const nums = fs.readdirSync(taskFolder).map(e => (e.match(/^(\d+)\./) || [])[1]).filter(Boolean).map(Number);
    const next = Math.max(2, ...nums) + 1;
    const cyclePath = path.join(taskFolder, `${next}. Rework`);
    fs.mkdirSync(path.join(cyclePath, CYCLE_BRIEF), { recursive: true });
    return cyclePath;
}

// Move a quest's project folder active\<qa> → archive\<qa> in the MAIN repo.
// If both exist: identical files are dropped, differing ones land as <name>.active-copy.<ext>
// beside the archive copy (nothing is lost), then the active copy is removed.
function archiveProjectFolder(qa, { dryRun = false } = {}) {
    const base = path.join(mainRoot(), 'projects', 'coding-projects');
    const src = path.join(base, 'active', qa);
    const dst = path.join(base, 'archive', qa);
    if (!fs.existsSync(src)) return fs.existsSync(dst) ? 'already-archived' : 'none';
    if (dryRun) return 'dry';
    if (!fs.existsSync(dst)) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.renameSync(src, dst);
        return 'moved';
    }
    const walk = (d, rel = '') => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
        e.isDirectory() ? walk(path.join(d, e.name), path.join(rel, e.name)) : [path.join(rel, e.name)]);
    for (const rel of walk(src)) {
        const a = path.join(src, rel), b = path.join(dst, rel);
        if (!fs.existsSync(b)) { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); continue; }
        if (!fs.readFileSync(a).equals(fs.readFileSync(b))) {
            const ext = path.extname(b);
            fs.copyFileSync(a, b.slice(0, b.length - ext.length) + '.active-copy' + ext);
        }
    }
    fs.rmSync(src, { recursive: true, force: true });
    return 'merged';
}

module.exports = {
    ROOT_BRIEF, LEGACY_BRIEF, CYCLE_BRIEF, CYCLE_RE,
    mainRoot, briefDir, cycleFolders, cycleBriefDir, latestBriefDir, allBriefDirs,
    hasFiles, shippedCycles, ensureCycleFolder, archiveProjectFolder,
};
