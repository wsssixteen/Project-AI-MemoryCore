#!/usr/bin/env node
// disk-cleanup.eval.js — fixtures on a throwaway catalog + clips folder; never touches real paths.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ENGINE = path.join(__dirname, 'disk-cleanup.js');
const { safePath, defaultTitle, YOUTUBE_URL } = require(ENGINE);
const results = [];
const check = (n, c, d) => results.push({ n, pass: !!c, d });

const box = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-eval-'));
const mk = (p, bytes = 1024) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.alloc(bytes)); return p; };
const junk = path.join(box, 'a', 'junk');
const kept = path.join(box, 'a', 'keepme');
const temp = path.join(box, 'a', 'temp');
const clipsDir = path.join(box, 'a', 'clips');
mk(path.join(junk, 'x.bin'), 4096);
mk(path.join(kept, 'y.bin'));
const oldF = mk(path.join(temp, 'old.tmp')), newF = mk(path.join(temp, 'new.tmp')), claudeDir = mk(path.join(temp, 'claude', 'z.tmp'));
const past = (Date.now() - 30 * 86400000) / 1000;
fs.utimesSync(oldF, past, past); fs.utimesSync(path.join(temp, 'claude'), past, past);
const clipA = mk(path.join(clipsDir, 'Genshin Impact 2022-09-01 22-42-26.mp4'));
const clipB = mk(path.join(clipsDir, 'Genshin Impact 2023-01-02 10-00-00.mp4'));
const clipC = mk(path.join(clipsDir, 'Genshin Impact 2024-03-04 10-00-00.mp4'));
const outside = mk(path.join(box, 'a', 'outside.mp4'));
const catalog = path.join(box, 'catalog.json');
fs.writeFileSync(catalog, JSON.stringify({
  clips: { dir: clipsDir, ext: ['.mp4'], frames: 4 },
  items: [
    { id: 'junk', label: 'junk', path: junk, action: 'delete', note: 't' },
    { id: 'keepme', label: 'k', path: kept, action: 'keep', note: 't' },
    { id: 'hand', label: 'h', path: kept, action: 'handoff', handoff: '/x', note: 't' },
    { id: 'unsafe', label: 'u', path: 'C:\\Users', action: 'delete', note: 't' },
    { id: 'traversal', label: 't', path: path.join(os.homedir(), 'x', '..'), action: 'delete', note: 't' },
    { id: 'gone', label: 'g', path: path.join(box, 'a', 'nothing-here'), action: 'delete', note: 't' },
    { id: 'temp', label: 'temp', path: temp, action: 'auto', olderThanDays: 7, skipNames: ['claude'], note: 't' }
  ]
}));
const logFile = path.join(box, 'log.jsonl');
const run = (...a) => spawnSync(process.execPath, [ENGINE, ...a], { encoding: 'utf8', env: { ...process.env, DISK_CLEANUP_CATALOG: catalog, DISK_CLEANUP_LOG: logFile } });
const rows = () => (fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean).map(JSON.parse) : []);

// S1-S2 safe paths
check('S1 refuses C:\\, C:\\Users, C:\\Windows, C:\\Program Files, the profile root, a 2-segment path',
  ['C:\\', 'C:\\Users', 'C:\\Windows', 'C:\\Program Files', os.homedir(), 'C:\\Temp'].every((p) => !safePath(p)));
check('S2 accepts a deep path', safePath(path.join(os.homedir(), '.m2')) && safePath('C:\\AMD\\AMDSoftwareInstaller'));
check('S3 ".." that climbs to the profile root is refused', !safePath(path.join(os.homedir(), 'x', '..')));
// U: YouTube link check
check('U1 youtu.be and watch?v= links pass', YOUTUBE_URL.test('https://youtu.be/dQw4w9WgXcQ') && YOUTUBE_URL.test('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
check('U2 studio, short id, other host, empty fail', !['https://studio.youtube.com/video/abc/edit', 'https://youtu.be/abc', 'https://evil.com/watch?v=dQw4w9WgXcQ', ''].some((u) => YOUTUBE_URL.test(u)));
check('T1 default title from the capture file name', defaultTitle('C:\\x\\Genshin Impact 2026-01-09 22-07-31.mp4') === 'Genshin Impact | 9 Jan 2026');
check('T2 unknown file name falls back to the name', defaultTitle('C:\\x\\boss fight.mp4') === 'boss fight');

// A: act
let r = run('act', 'junk');
check('A1 act without --yes changes nothing', fs.existsSync(junk) && /would delete/.test(r.stdout), r.stdout);
r = run('act', 'junk', '--yes');
check('A2 act --yes deletes and logs ok', !fs.existsSync(junk) && rows().some((x) => x.item === 'junk' && x.outcome === 'ok'), r.stdout + r.stderr);
r = run('act', 'nope', '--yes');
check('A3 unknown id exits 2', r.status === 2);
r = run('act', 'keepme', '--yes');
check('A4 keep item is never touched, even with --yes', fs.existsSync(kept) && r.status === 0);
r = run('act', 'hand', '--yes');
check('A5 handoff item only names the handoff', fs.existsSync(kept) && /\/x/.test(r.stdout));
r = run('act', 'unsafe', '--yes');
check('A6 catalog row pointing at C:\\Users is refused', r.status === 2 && /REFUSED/.test(r.stderr) && fs.existsSync('C:\\Users'));
r = run('act', 'traversal', '--yes');
check('A7 catalog row climbing to the profile root is refused', r.status === 2 && fs.existsSync(os.homedir()));
r = run('act', 'gone', '--yes');
check('A8 missing path = already gone, exit 0', r.status === 0 && /already gone/.test(r.stdout));

// C: caches
r = run('caches');
check('C1 caches without --yes deletes nothing', fs.existsSync(oldF) && /would clear temp/.test(r.stdout));
r = run('caches', '--yes');
check('C2 temp: old file removed, new file and claude folder kept', !fs.existsSync(oldF) && fs.existsSync(newF) && fs.existsSync(claudeDir), r.stdout);

// K: clips
r = run('clips');
check('K1 clips counts the waiting clips', /^3 clip/.test(r.stdout), r.stdout);
r = run('clip-done', clipA, '--uploaded', 'https://studio.youtube.com/video/x', '--title', 't');
check('K2 a non-video link is refused and the clip stays', r.status === 2 && fs.existsSync(clipA));
r = run('clip-done', clipA, '--uploaded', 'https://youtu.be/dQw4w9WgXcQ', '--title', 'Boss "fight"');
check('K3 a real link deletes the clip and logs the url + title', !fs.existsSync(clipA) && rows().some((x) => x.decision === 'uploaded' && x.url && x.title === 'Boss "fight"'));
r = run('clip-done', outside, '--deleted');
check('K4 a file outside the clips folder is refused', r.status === 2 && fs.existsSync(outside));
r = run('clip-done', path.join(clipsDir, '..', 'outside.mp4'), '--deleted');
check('K5 ".." out of the clips folder is refused', r.status === 2 && fs.existsSync(outside));
r = run('clip-done', clipB);
check('K6 no decision exits 2 and keeps the clip', r.status === 2 && fs.existsSync(clipB));
r = run('clip-done', clipB, '--kept');
check('K7 kept clip stays on disk', fs.existsSync(clipB) && r.status === 0);
r = run('clips');
check('K8 a kept clip is skipped by later runs', /^1 clip/.test(r.stdout), r.stdout);
r = run('clip-done', clipC, '--deleted');
check('K9 delete removes the clip', !fs.existsSync(clipC) && r.status === 0);
r = run('clip-next');
check('K10 nothing left = {"done":true}', /"done":\s*true/.test(r.stdout), r.stdout);
check('L1 every log row has ts and outcome', rows().length > 0 && rows().every((x) => x.ts && x.outcome));

fs.rmSync(box, { recursive: true, force: true });
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + (x.d || '').slice(0, 200))); }
console.log('\ndisk-cleanup.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
