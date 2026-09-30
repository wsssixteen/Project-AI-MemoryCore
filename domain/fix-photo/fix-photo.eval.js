#!/usr/bin/env node
// fix-photo.eval.js — replay + adversarial eval (system-design Rules 6 + 12).
// Replay case: 2026-09-28 #256334 — UI fixes (SSPDBB Agihan Kepada, PYPDBB Pembetulan) handed back in
// words only while BA had sent screenshots; miya had to ask for red-box fix photos.
// H* = Stop hook fixtures · M* = mark.py fixtures (skipped with a note when Python/Pillow is absent).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, 'fix-photo.check.hook.js');
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

const PAD = ' Ringkasan lanjut untuk ujian.'.repeat(12);
const UI_HANDBACK = '═══ ▶ YOUR MOVE — QA-256334 ═══ Penyediaan (PYPDBB) tugasan: medan Pembetulan dibuang, Agihan Kepada papar SO Kanan. PTMLK/01/L/PDBB/2026/8.' + PAD;
const PASTED = { type: 'user', message: { role: 'user', content: [{ type: 'text', text: '[Image: source: C:\\tmp\\images\\1.webp] BA says no medan' }] } };
const IMAGE_BLOCK = { type: 'user', message: { role: 'user', content: [{ type: 'image', source: { type: 'base64', data: 'AAAA' } }] } };
const READ_BRIEF = { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Read', input: { file_path: 'C:\\T\\231. CR\\0. Brief\\256334_REWORK.png' } }] } };
const READ_OTHER = { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Read', input: { file_path: 'C:\\T\\231. CR\\2. Fix\\1. X - y.png' } }] } };
const say = (text) => ({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });

let n = 0;
function transcript(rows, raw) {
  const p = path.join(TMP, 't' + (n++) + '.jsonl');
  fs.writeFileSync(p, raw !== undefined ? raw : rows.map(r => JSON.stringify(r)).join('\n') + '\n');
  return p;
}
function hook(stdin) { return spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8', timeout: 30000, env: process.env }); }
function run(rows, raw) { return hook(JSON.stringify({ transcript_path: transcript(rows, raw) })); }
const blocked = (r) => r.status === 2 && /fix-photo/.test(r.stderr || '');
const silent = (r) => r.status === 0 && !/fix-photo:/.test((r.stderr || '') + (r.stdout || ''));
const d = (r) => 'exit=' + r.status + ' err=' + (r.stderr || '').slice(0, 80).replace(/\n/g, ' ');

// ── Hook fixtures ────────────────────────────────────────────────────────────
let r = hook('{}');                                  check('H01 empty stdin → exit 0', r.status === 0, d(r));
r = hook('not json');                                check('H02 malformed stdin → exit 0', r.status === 0, d(r));
r = hook(JSON.stringify({ transcript_path: path.join(TMP, 'missing.jsonl') })); check('H03 missing transcript → exit 0', r.status === 0, d(r));
r = run([PASTED, say(UI_HANDBACK)]);                 check('H04 REPLAY: UI hand-back + pasted BA screenshot, no FIX-PHOTO → BLOCK', blocked(r), d(r));
r = run([PASTED, say(UI_HANDBACK + '\nFIX-PHOTO: ' + GOOD_PHOTO + ' ✓')]); check('H05 valid FIX-PHOTO in reply → silent', silent(r), d(r));
r = run([PASTED, say(UI_HANDBACK + '\nFIX-PHOTO: ' + path.join(FIX, 'nope.png') + ' ✓')]); check('H06 FIX-PHOTO to missing file → BLOCK naming it', blocked(r) && /file not found/.test(r.stderr), d(r));
r = run([PASTED, say(UI_HANDBACK + '\nFIX-PHOTO: ' + STRAY_PHOTO + ' ✓')]); check('H07 FIX-PHOTO outside a "2. Fix" folder → BLOCK', blocked(r) && /2\. Fix/.test(r.stderr), d(r));
r = run([PASTED, say(UI_HANDBACK + '\nFIX-PHOTO: 2. Fix\\1. A - b.png ✓')]); check('H08 relative FIX-PHOTO path → BLOCK (not a full path)', blocked(r) && /full path/.test(r.stderr), d(r));
r = run([PASTED, say(UI_HANDBACK + ' [skip-fix-photo: backend-only change, no screen differs]')]); check('H09 real bypass reason → silent', silent(r), d(r));
r = run([PASTED, say(UI_HANDBACK + ' Not a UI change? add [skip-fix-photo: <reason>] with a real reason.')]); check('H10 SELF-DISARM: quoted "<reason>" placeholder is NOT a bypass → BLOCK', blocked(r), d(r));
r = run([PASTED, say(UI_HANDBACK + ' [skip-fix-photo: ]')]); check('H11 empty bypass reason → BLOCK', blocked(r), d(r));
r = run([say(UI_HANDBACK)]);                         check('H12 no BA screenshot this session → silent', silent(r), d(r));
r = run([IMAGE_BLOCK, say(UI_HANDBACK)]);            check('H13 image block (not text marker) counts as BA screenshot → BLOCK', blocked(r), d(r));
r = run([READ_BRIEF, say(UI_HANDBACK)]);             check('H14 Read of a "0. Brief" image counts as BA screenshot → BLOCK', blocked(r), d(r));
r = run([READ_OTHER, say(UI_HANDBACK)]);             check('H15 Read of my OWN fix photo is not BA evidence → silent', silent(r), d(r));
r = run([PASTED, say('Explanation only: the Agihan Kepada panel on tugasan PYPDBB shows PPTN officers because the medan list is built from the role set.' + PAD)]); check('H16 UI talk that is not a hand-back → silent', silent(r), d(r));
r = run([PASTED, say('▶ YOUR MOVE — QA-281650 run the SQL patch on stg2 then confirm the row count with the SELECT.' + ' Ringkasan lanjut.'.repeat(20))]); check('H17 hand-back with no UI change words → silent', silent(r), d(r));
r = run([PASTED, say('▶ YOUR MOVE — the MemoryCore dashboard button now shows the panel you asked for, refresh the page.' + ' More words here.'.repeat(20))]); check('H18 non-etanah UI hand-back (MemoryCore dashboard) → silent', silent(r), d(r));
r = run([PASTED, say('Earlier photo: FIX-PHOTO: ' + GOOD_PHOTO + ' ✓' + PAD), say('DEPLOY — 256334 → internal. Tugasan PYPDBB medan Pembetulan dibuang.' + PAD)]); check('H19 FIX-PHOTO from an EARLIER reply this session counts → silent', silent(r), d(r));
r = run([PASTED, say('▶ YOUR MOVE medan dibuang PTMLK')]); check('H20 short reply (<200 chars) → silent', silent(r), d(r));
r = run(null, 'garbage line\n{not json}\n' + JSON.stringify(PASTED) + '\n' + JSON.stringify(say(UI_HANDBACK)) + '\n'); check('H21 malformed transcript lines skipped, still BLOCKS on the valid ones', blocked(r), d(r));
const big = [PASTED].concat(Array.from({ length: 4000 }, (_, i) => say('filler reply ' + i + ' ' + 'x'.repeat(400)))).concat([say(UI_HANDBACK)]);
let t0 = Date.now(); r = run(big); const ms = Date.now() - t0;
check('H22 large transcript (~1.7MB) still decides, under 5s', blocked(r) && ms < 5000, d(r) + ' ms=' + ms);
r = run([PASTED, say(UI_HANDBACK + '\nFIX-PHOTO: `' + GOOD_PHOTO + '` ✓')]); check('H23 FIX-PHOTO path wrapped in backticks → accepted', silent(r), d(r));
r = run([PASTED, say('Redmine note for #256334: medan Perlu Surat Iringan dibuang pada semua tugasan PDBB.' + PAD)]); check('H24 Redmine note describing a UI change → BLOCK', blocked(r), d(r));

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
  // End-to-end: the line mark.py prints satisfies the hook.
  const line = (m.stdout.match(/FIX-PHOTO: .*/) || [''])[0];
  r = run([PASTED, say(UI_HANDBACK + '\n' + line)]);
  check('E01 END-TO-END: mark.py output line pasted into the reply satisfies the gate', silent(r), d(r) + ' line=' + line.slice(0, 60));
}

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nfix-photo.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
