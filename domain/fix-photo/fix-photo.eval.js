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
const ASK = { type: 'user', message: { role: 'user', content: 'please make a fix photo with a red box' } };
function run(rows, raw) { return hook(JSON.stringify({ transcript_path: transcript(rows ? [ASK].concat(rows) : rows, raw) })); }
function runNoAsk(rows) { return hook(JSON.stringify({ transcript_path: transcript(rows) })); }
const blocked = (r) => r.status === 2 && /fix-photo/.test(r.stderr || '');
const silent = (r) => r.status === 0 && !/fix-photo:/.test((r.stderr || '') + (r.stdout || ''));
const d = (r) => 'exit=' + r.status + ' err=' + (r.stderr || '').slice(0, 80).replace(/\n/g, ' ');

// ── Hook fixtures ────────────────────────────────────────────────────────────
let r0 = runNoAsk([PASTED, say(UI_HANDBACK)]);       check('H00 v2 (#282924): UI hand-back + BA screenshot, miya did NOT ask for a fix photo → silent', silent(r0), d(r0));
r0 = runNoAsk([PASTED, { type: 'user', message: { role: 'user', content: 'Stop hook feedback: fix-photo: add FIX-PHOTO: <full path> red box' } }, say(UI_HANDBACK)]); check('H00b SELF-TRIGGER: the gate text echoed as a user turn is not an ask → silent', silent(r0), d(r0));
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
r = run(null, 'garbage line\n{not json}\n' + JSON.stringify(ASK) + '\n' + JSON.stringify(PASTED) + '\n' + JSON.stringify(say(UI_HANDBACK)) + '\n'); check('H21 malformed transcript lines skipped, still BLOCKS on the valid ones', blocked(r), d(r));
const big = [PASTED].concat(Array.from({ length: 4000 }, (_, i) => say('filler reply ' + i + ' ' + 'x'.repeat(400)))).concat([say(UI_HANDBACK)]);
let t0 = Date.now(); r = run(big); const ms = Date.now() - t0;
check('H22 large transcript (~1.7MB) still decides, under 5s', blocked(r) && ms < 5000, d(r) + ' ms=' + ms);
r = run([PASTED, say(UI_HANDBACK + '\nFIX-PHOTO: `' + GOOD_PHOTO + '` ✓')]); check('H23 FIX-PHOTO path wrapped in backticks → accepted', silent(r), d(r));
r = run([PASTED, say('Redmine note for #256334: medan Perlu Surat Iringan dibuang pada semua tugasan PDBB.' + PAD)]); check('H24 Redmine note describing a UI change → BLOCK', blocked(r), d(r));

// ── v3 test-share fixtures (2026-10-23, #246964: "test result: save the before and after jana semula photos") ──
{
  const shareMsg = (text, img = true) => ({ type: 'user', message: { role: 'user', content: img ? [{ type: 'text', text }, { type: 'image', source: { type: 'base64', data: 'AAAA' } }] : text } });
  const plainReply = say('Saved and prepared the Redmine form for your approval. Nothing else changed in the repository this turn.' + PAD);
  let t = runNoAsk([shareMsg('test result: save the before and after jana semula photos'), plainReply]);
  check('T01 REPLAY: "test result" + image, reply has no FIX-PHOTO → BLOCK', blocked(t), d(t));
  check('T02 EFFECT: block text names the test-share case and the Task folder', /shared test screenshots/.test(t.stderr || '') && /2\. Fix/.test(t.stderr || ''), d(t));
  t = runNoAsk([shareMsg('test result: save the before and after jana semula photos'), say(plainReply.message.content[0].text + '\nFIX-PHOTO: ' + GOOD_PHOTO + ' ✓')]);
  check('T03 valid FIX-PHOTO line → silent', silent(t), d(t));
  t = runNoAsk([shareMsg('test result: passed, no screenshot', false), plainReply]);
  check('T04 keyword with NO image → silent', silent(t), d(t));
  t = runNoAsk([shareMsg('here is the BA screenshot from the ticket'), plainReply]);
  check('T05 image with no test-share keyword → silent', silent(t), d(t));
  t = runNoAsk([say('I will save the test result later.' + PAD), plainReply]);
  check('T06 keyword only in MY own text → silent', silent(t), d(t));
  t = runNoAsk([shareMsg('Test results: + photos attached'), plainReply]);
  check('T07 "Test results:" (plural, capital) + image → BLOCK', blocked(t), d(t));
  t = runNoAsk([shareMsg('please save this'), plainReply]);
  check('T08 "please save this" + image → BLOCK', blocked(t), d(t));
  t = runNoAsk([shareMsg('here test scenario'), plainReply]);
  check('T09 "here test scenario" + image → BLOCK', blocked(t), d(t));
  t = runNoAsk([shareMsg('here screenshot of test'), plainReply]);
  check('T10 "here screenshot of test" + image → BLOCK', blocked(t), d(t));
  t = runNoAsk([shareMsg('Stop hook feedback: fix-photo: test result FIX-PHOTO: <full path>'), plainReply]);
  check('T11 SELF-TRIGGER: gate text echoed back as a user turn → silent', silent(t), d(t));
  t = runNoAsk([shareMsg('test result'), say(plainReply.message.content[0].text + '\nFIX-PHOTO: ' + STRAY_PHOTO + ' ✓')]);
  check('T12 FIX-PHOTO outside "2. Fix" / "N. Rework" → BLOCK naming it', blocked(t) && /2\. Fix/.test(t.stderr || ''), d(t));
  t = runNoAsk([shareMsg('test result'), say(plainReply.message.content[0].text + ' [skip-fix-photo: screenshots were of the login page only]')]);
  check('T13 real bypass reason → silent', silent(t), d(t));
  t = runNoAsk([shareMsg('test result'), say('Saved.')]);
  check('T14 short reply (<200 chars) → silent', silent(t), d(t));
  t = runNoAsk([shareMsg('test result'), say('Earlier: FIX-PHOTO: ' + GOOD_PHOTO + ' ✓' + PAD), plainReply]);
  check('T15 FIX-PHOTO saved in an EARLIER reply after the share → silent', silent(t), d(t));
  t = runNoAsk([{ type: 'user', message: { role: 'user', content: '[Image: source: C:\\tmp\\images\\1.webp] test result: before and after' } }, plainReply]);
  check('T16 string-content message with "[Image: source:" marker + keyword → BLOCK', blocked(t), d(t));
  t = runNoAsk([shareMsg('the latest test results look odd, check the code'), plainReply]);
  check('T17 accepted-risk: "test results" in a question with an image still asks for the save → BLOCK', blocked(t), d(t));
  // v4 (2026-10-30, #287048: "if I share with you screenshots that is related to the test scenario, you will save it ... and WILL attach to the ticket")
  const midTurn = (prompt) => ({ type: 'attachment', attachment: { type: 'queued_command', prompt } });
  t = runNoAsk([shareMsg('test scenarios done, attach to the ticket'), plainReply]);
  check('T18 "test scenarios" without "here" + image → BLOCK', blocked(t), d(t));
  t = runNoAsk([shareMsg('please attach these to redmine'), plainReply]);
  check('T19 "attach ... redmine" + image → BLOCK', blocked(t), d(t));
  t = runNoAsk([midTurn([{ type: 'text', text: 'here test scenario' }, { type: 'image', source: { type: 'base64', data: 'AAAA' } }]), plainReply]);
  check('T20 mid-turn message (queued_command) with image + keyword → BLOCK', blocked(t), d(t));
  t = runNoAsk([midTurn('test scenarios: all passed, no screenshot'), plainReply]);
  check('T21 mid-turn keyword with NO image → silent', silent(t), d(t));
  t = runNoAsk([midTurn([{ type: 'text', text: 'test scenario' }, { type: 'image', source: { type: 'base64', data: 'AAAA' } }]), say(plainReply.message.content[0].text + '\nFIX-PHOTO: ' + GOOD_PHOTO + ' ✓')]);
  check('T22 mid-turn share then valid FIX-PHOTO → silent', silent(t), d(t));
  t = runNoAsk([shareMsg('attach the BA photo later, this is the design'), plainReply]);
  check('T23 "attach" with no ticket/redmine word + image → silent', silent(t), d(t));
}

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

// Registry prefixes (2026-10-03): a hand-back whose only etanah marker is a non-reference permohonan id still counts.
{
  const otherState = '═══ ▶ YOUR MOVE ═══ Skrin Kertas Kerja: medan Pembetulan kini dipaparkan. PTTRG/07/01/L/PLPS/2026/135.' + PAD;
  let rr = run([PASTED, say(otherState)]);
  check('R01 hand-back with only a non-reference permohonan id + BA image, no FIX-PHOTO → BLOCK', blocked(rr), d(rr));
  const noMarker = '═══ ▶ YOUR MOVE ═══ Skrin umum: medan Pembetulan kini dipaparkan. Tiada id permohonan.' + PAD;
  rr = run([PASTED, say(noMarker)]);
  check('R02 the same hand-back with no etanah marker at all → silent (unchanged)', silent(rr), d(rr));
}

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
let failed = 0;
for (const x of results) { if (!x.pass) failed++; console.log((x.pass ? 'PASS' : 'FAIL') + '  ' + x.n + (x.pass ? '' : ' → ' + x.d)); }
console.log('\nfix-photo.eval: ' + (results.length - failed) + '/' + results.length + ' green');
process.exit(failed ? 1 : 0);
