#!/usr/bin/env node
// fix-photo.eval.js — mark.py fixtures only. The Stop hook (fix-photo.check.hook.js) was retired 2026-11-10: 41% of its decisions were bypasses.
// Replay case: 2026-09-28 #256334 — UI fixes (SSPDBB Agihan Kepada, PYPDBB Pembetulan) handed back in
// words only while BA had sent screenshots; miya had to ask for red-box fix photos.
// M* = mark.py fixtures (skipped with a note when Python/Pillow is absent).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const MARK = path.join(__dirname, 'mark.py');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'fixphoto-eval-'));
const FIX = path.join(TMP, 'Task', '8. Rework', '2. Fix');
fs.mkdirSync(FIX, { recursive: true });
const OTHER = path.join(TMP, 'scratch');
fs.mkdirSync(OTHER, { recursive: true });
const GOOD_PHOTO = path.join(FIX, '1. PYPDBB - Buang medan Pembetulan.png');
fs.writeFileSync(GOOD_PHOTO, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
const STRAY_PHOTO = path.join(OTHER, 'photo.png');
fs.writeFileSync(STRAY_PHOTO, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

// ── mark.py fixtures ─────────────────────────────────────────────────────────
const py = spawnSync('python', ['-c', 'import PIL; print("ok")'], { encoding: 'utf8' });
if (py.status !== 0) {
  check('M00 python + Pillow available (mark.py fixtures skipped otherwise)', false, (py.stderr || '').slice(0, 80));
} else {
  const SRC = path.join(TMP, 'src.png');
  spawnSync('python', ['-c', 'from PIL import Image; Image.new("RGB",(400,300),(250,250,250)).save(r"' + SRC + '")']);
  const LOGF = path.join(TMP, 'log.jsonl');
  const mk = (args) => spawnSync('python', [MARK].concat(args), { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { FIX_PHOTO_LOG: LOGF }) });
  const dst = path.join(FIX, '2. SSPDBB - Agihan Kepada bila Pembetulan Ya.png');
  let m = mk(['--src', SRC, '--dst', dst, '--box', '20,20,200,80', '--label', '30,100=Pembetulan = Ya: papar Agihan Kepada']);
  check('M01 happy path saves PNG + prints FIX-PHOTO line', m.status === 0 && fs.existsSync(dst) && /FIX-PHOTO: .*2\. Fix/.test(m.stdout), (m.stdout + m.stderr).slice(0, 120));
  const px = spawnSync('python', ['-c', 'from PIL import Image; im=Image.open(r"' + dst + '"); print(im.getpixel((20,50)))'], { encoding: 'utf8' });
  check('M02 red box actually drawn on the box edge', /\(2[0-9]{2}, 0, 0\)/.test(px.stdout), px.stdout.trim());
  m = mk(['--src', path.join(TMP, 'nope.png'), '--dst', dst, '--box', '1,1,50,50']);
  check('M03 missing source → exit 2, nothing claimed', m.status === 2 && /not found/.test(m.stdout), m.stdout.slice(0, 80));
  m = mk(['--src', SRC, '--dst', path.join(TMP, 'no-such-dir', 'x.png'), '--box', '1,1,50,50']);
  check('M04 destination folder missing → exit 2 (no stray folders created)', m.status === 2 && !fs.existsSync(path.join(TMP, 'no-such-dir')), m.stdout.slice(0, 80));
  m = mk(['--src', SRC, '--dst', path.join(FIX, '3. X - y.jpg'), '--box', '1,1,50,50']);
  check('M05 non-.png destination → exit 2', m.status === 2, m.stdout.slice(0, 80));
  m = mk(['--src', SRC, '--dst', path.join(FIX, '4. SSPDBB - Box clamp.png'), '--box', '-50,-50,900,900']);
  check('M06 box beyond image → clamped + WARN, still saved', m.status === 0 && /clamped/.test(m.stdout), m.stdout.slice(0, 120));
  m = mk(['--src', SRC, '--dst', path.join(FIX, '5. SSPDBB - Box outside.png'), '--box', '500,500,600,600']);
  check('M07 box fully outside image → exit 2', m.status === 2, m.stdout.slice(0, 80));
  m = mk(['--src', SRC, '--dst', path.join(FIX, '6. SSPDBB - Label shift.png'), '--box', '10,10,60,60', '--label', '380,290=A very long label that cannot fit at this position']);
  check('M08 label overflowing the edge → shifted inside + WARN', m.status === 0 && /shifted/.test(m.stdout), m.stdout.slice(0, 120));
  m = mk(['--src', SRC, '--dst', path.join(OTHER, '7. SSPDBB - Wrong folder.png'), '--box', '10,10,60,60']);
  check('M09 destination not a "2. Fix" folder → WARN', m.status === 0 && /2\. Fix/.test(m.stdout) && /WARN/.test(m.stdout), m.stdout.slice(0, 120));
  m = mk(['--src', SRC, '--dst', path.join(FIX, 'badname.png'), '--box', '10,10,60,60']);
  check('M10 file name off-pattern → WARN', m.status === 0 && /file name should look like/.test(m.stdout), m.stdout.slice(0, 120));
  m = mk(['--src', SRC, '--dst', path.join(FIX, '8. SSPDBB - Leak.png'), '--box', '10,10,60,60', '--label', '10,100=Tested 2026-09-28 by miya@melaka.gov.my']);
  check('M11 date/email in label → WARN (clinical labels only)', m.status === 0 && /clinical/.test(m.stdout), m.stdout.slice(0, 120));
  m = mk(['--src', SRC, '--dst', dst, '--box', '20,20,200,80']);
  check('M12 re-run overwrites with a NOTE (idempotent regenerate)', m.status === 0 && /overwrote/.test(m.stdout), m.stdout.slice(0, 120));
  m = mk(['--src', SRC, '--dst', path.join(FIX, '9. SSPDBB - No box.png')]);
  check('M13 no --box → exit 2 (a photo must mark the change)', m.status === 2, m.stdout.slice(0, 80));
  m = mk(['--src', SRC, '--dst', path.join(FIX, '10. SSPDBB - Bad label.png'), '--box', '1,1,50,50', '--label', 'no-equals-sign']);
  check('M14 malformed --label → exit 2', m.status === 2, m.stdout.slice(0, 80));
  const TXT = path.join(TMP, 'not-image.png'); fs.writeFileSync(TXT, 'hello');
  m = mk(['--src', TXT, '--dst', path.join(FIX, '11. SSPDBB - Not image.png'), '--box', '1,1,50,50']);
  check('M15 source that is not an image → exit 2', m.status === 2 && /cannot open/.test(m.stdout), m.stdout.slice(0, 80));
  const WEBP = path.join(TMP, 'src.webp');
  spawnSync('python', ['-c', 'from PIL import Image; Image.new("RGB",(200,150),(255,255,255)).save(r"' + WEBP + '","WEBP")']);
  m = mk(['--src', WEBP, '--dst', path.join(FIX, '12. SSPDBB - From webp.png'), '--box', '5,5,100,100']);
  check('M16 .webp source (BA chat paste format) → saved as PNG', m.status === 0 && /FIX-PHOTO/.test(m.stdout), m.stdout.slice(0, 80));
  const rows = fs.existsSync(LOGF) ? fs.readFileSync(LOGF, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  check('M17 every run logs a row with ts + outcome + dur_ms (saved and error both)', rows.length === 15 && rows.every(x => x.ts && x.outcome && typeof x.dur_ms === 'number') && rows.some(x => x.outcome === 'error') && rows.some(x => x.outcome === 'saved'), 'rows=' + rows.length);
}
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nfix-photo.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
