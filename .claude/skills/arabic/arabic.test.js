#!/usr/bin/env node
/** arabic.test.js — eval suite for the /arabic engine. Run: node .claude/skills/arabic/arabic.test.js */
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'arabic-eval-'));
process.env.ARABIC_DATA_DIR = tmp;
const REAL = path.join(__dirname, '..', '..', '..', 'projects', 'learning-projects', 'active', 'arabic', 'data', 'words.json');
const engine = require('./arabic.js');
const { main, match, chunks, mondayOf, modeFor } = engine;

let pass = 0, fail = 0; const rows = [];
function t(name, fn) { try { fn(); pass++; rows.push(`✓ ${name}`); } catch (e) { fail++; rows.push(`✗ ${name} — ${e.message}`); } }
function eq(a, b, m) { if (a !== b) throw new Error(`${m || ''} expected ${JSON.stringify(b)} got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m || 'assertion'); }
function run(...a) { return main(['node', 'arabic.js', ...a]); }
function reset(words) { fs.writeFileSync(path.join(tmp, 'words.json'), JSON.stringify(words)); try { fs.unlinkSync(path.join(tmp, 'progress.json')); } catch {} }
function prog() { return JSON.parse(fs.readFileSync(path.join(tmp, 'progress.json'), 'utf8')); }
const W = (id, lesson, arabic, malay, extra = {}) => ({ id, arabic, malay, plural: null, lesson, page: 1, grammar: 'g', status: 'new', confidence: 'ok', ...extra });
const small = [W('L1-01', 1, 'بَيْتٌ', 'rumah'), W('L1-02', 1, 'مَسْجِدٌ', 'masjid'), W('L1-03', 1, 'بَابٌ', 'pintu'), W('L1-04', 1, 'كِتَابٌ', 'buku'), W('L1-05', 1, 'قَلَمٌ', 'pen'), W('L1-06', 1, 'مِفْتَاحٌ', 'kunci'),
  W('L2-01', 2, 'إِمَامٌ', 'imam'), W('L2-02', 2, 'حَجَرٌ', 'batu'), W('L2-03', 2, 'سُكَّرٌ', 'gula'), W('L2-04', 2, 'لَبَنٌ', 'susu')];
const big = [...Array.from({ length: 24 }, (_, i) => W(`L3-${String(i + 1).padStart(2, '0')}`, 3, 'كَلِمَةٌ' + i, 'm' + i)), W('L21-01', 21, 'بَلَدٌ', 'negeri')];

// ---- matching (S1–S9) ----
t('S1 exact vowelled Arabic = hit', () => eq(match('سُكَّرٌ', 'سُكَّرٌ'), 'hit'));
t('S2 bare Arabic no shadda = hit', () => eq(match('سكر', 'سُكَّرٌ'), 'hit'));
t('S3 typed ن for tanwin (miya: سكرن) = hit', () => eq(match('سكرن', 'سُكَّرٌ'), 'hit'));
t('S4 translit sukkarun = hit', () => eq(match('sukkarun', 'سُكَّرٌ'), 'hit'));
t('S5 translit alladhi = hit', () => eq(match('alladhi', 'الَّذِي'), 'hit'));
t('S6 translit madrasatun = hit (ta marbuta)', () => eq(match('madrasatun', 'مَدْرَسَةٌ'), 'hit'));
t('S7 one letter off = near', () => eq(match('sukaron', 'سُكَّرٌ'), 'near'));
t('S8 wrong word = miss', () => eq(match('kitabun', 'سُكَّرٌ'), 'miss'));
t('S9 empty answer = miss', () => eq(match('', 'سُكَّرٌ'), 'miss'));
t('S9b uppercase + spaces tolerated', () => eq(match('  SUKKARUN ', 'سُكَّرٌ'), 'hit'));
t('S9c with al- prefix on target and answer', () => eq(match('al-baytu', 'اَلْبَيْتُ'), 'hit'));

// ---- chunking (S10–S11) ----
t('S10 lesson >15 words splits into 2 chunks in order', () => { const c = chunks(big).filter(x => x.lesson === 3); eq(c.length, 2); eq(c[0].ids.length, 15); eq(c[1].ids.length, 9); eq(c[0].ids[0], 'L3-01'); });
t('S11 lessons sorted numerically (21 after 3)', () => { const c = chunks(big); eq(c[c.length - 1].lesson, 21); });

// ---- dates / modes (S12–S13) ----
t('S12 mondayOf', () => { eq(mondayOf('2026-09-06'), '2026-08-31'); eq(mondayOf('2026-09-07'), '2026-09-07'); eq(mondayOf('2026-09-13'), '2026-09-07'); });
t('S13 mode by ordinal', () => { eq(modeFor(1), 'table'); eq(modeFor(2), 'sentences'); eq(modeFor(3), 'table'); eq(modeFor(4), 'sentences'); eq(modeFor(5), 'more'); eq(modeFor(9), 'more'); });

// ---- review flow (S14–S24) ----
t('S14 first review: header + 5 rows + recall', () => { reset(small); const o = run('review', '--date', '2026-09-07'); ok(o.startsWith('Week 1 · Lesson 1 · review 1 of 5'), o.split('\n')[0]); eq((o.match(/^\| \d /gm) || []).length, 5); ok(/Recall: '.+' → Arabic\?/.test(o)); });
t('S15 same day twice = identical, one log row', () => { reset(small); const a = run('review', '--date', '2026-09-07'); const b = run('review', '--date', '2026-09-07'); eq(a, b); eq(prog().reviews.length, 1); });
t('S16 second day = review 2 = sentence day', () => { reset(small); run('review', '--date', '2026-09-07'); const o = run('review', '--date', '2026-09-08'); ok(o.includes('review 2 of 5')); ok(o.includes('SENTENCE DAY')); });
t('S17 skipped days do not skip modes (Mon, Thu = review 1, 2)', () => { reset(small); run('review', '--date', '2026-09-07'); const o = run('review', '--date', '2026-09-10'); ok(o.includes('review 2 of 5')); });
t('S18 glance-only (no answer) still counts as a review', () => { reset(small); run('review', '--date', '2026-09-07'); eq(prog().reviews[0].result, 'skip'); eq(run('status', '--date', '2026-09-07').includes('1/5 reviews'), true); });
t('S19 answer hit logs hit and reveals ✓', () => { reset(small); run('review', '--date', '2026-09-07'); const id = prog().reviews[0].recall_id; const w = small.find(x => x.id === id); const o = run('answer', w.arabic, '--date', '2026-09-07'); ok(o.startsWith('✓')); eq(prog().reviews[0].result, 'hit'); });
t('S20 answer miss logs miss and reveals ✗', () => { reset(small); run('review', '--date', '2026-09-07'); const o = run('answer', 'zzz', '--date', '2026-09-07'); ok(o.startsWith('✗')); eq(prog().reviews[0].result, 'miss'); });
t('S21 answer before review = guidance, no crash', () => { reset(small); ok(run('answer', 'x', '--date', '2026-09-07').includes('No review today')); });
t('S22 missed word comes back first next review', () => { reset(small); run('review', '--date', '2026-09-07'); const id = prog().reviews[0].recall_id; run('answer', 'zzz', '--date', '2026-09-07'); const o = run('review', '--date', '2026-09-08'); const w = small.find(x => x.id === id); ok(o.split('\n')[3].includes(w.arabic), 'missed word should be row 1'); ok(o.includes(`Recall: '${w.malay}'`), 'missed word is the recall'); });
t('S23 5-review week → new week advances to Lesson 2', () => { reset(small); ['07', '08', '09', '10', '11'].forEach(d => run('review', '--date', '2026-09-' + d)); const o = run('review', '--date', '2026-09-14'); ok(o.startsWith('Week 2 · Lesson 2'), o.split('\n')[0]); });
t('S24 <3 reviews → carry-over, same lesson', () => { reset(small); run('review', '--date', '2026-09-07'); run('review', '--date', '2026-09-08'); const o = run('review', '--date', '2026-09-14'); ok(o.startsWith('Week 2 · Lesson 1'), o.split('\n')[0]); ok(o.includes('review 1 of 5')); });
t('S25 exactly 3 reviews → advances', () => { reset(small); ['07', '08', '09'].forEach(d => run('review', '--date', '2026-09-' + d)); ok(run('review', '--date', '2026-09-14').startsWith('Week 2 · Lesson 2')); });
t('S26 zero-review week (never opened) → carry-over', () => { reset(small); run('review', '--date', '2026-09-07'); const o = run('review', '--date', '2026-09-21'); ok(o.startsWith('Week 2 · Lesson 1'), o.split('\n')[0]); });
t('S27 week <lesson> override', () => { reset(small); run('review', '--date', '2026-09-07'); ok(run('week', '2', '--date', '2026-09-07').includes('Lesson 2')); ok(run('review', '--date', '2026-09-08').startsWith('Week 1 · Lesson 2')); });
// ---- settings / observability (S43–S48) ----
function setSetting(k, v) { const o = run('settings', k, String(v)); delete require.cache[require.resolve('./arabic.js')]; const e = require('./arabic.js'); return [o, e]; }
t('S43 settings show defaults', () => { reset(small); ok(run('settings').includes('words = 5') && run('settings').includes('pace = 1')); });
t('S44 settings words 8 → 8 rows shown', () => { reset(big); const [o, e] = setSetting('words', 8); ok(o.includes('words = 8')); const r = e.main(['node', 'a', 'review', '--date', '2026-09-07']); eq((r.match(/^\| \d+ /gm) || []).length, 8); setSetting('words', 5); });
t('S45 settings pace 2 → week set spans two lessons, header shows range', () => { reset(small); const [, e] = setSetting('pace', 2); const r = e.main(['node', 'a', 'review', '--date', '2026-09-07']); ok(r.startsWith('Week 1 · Lessons 1–2'), r.split('\n')[0]); eq(prog().week_set.length, 10); setSetting('pace', 1); });
t('S46 settings rejects bad values', () => { reset(small); ok(run('settings', 'words', '99').includes('must be')); ok(run('settings', 'nope', '1').includes('Unknown setting')); });
t('S47 stats table + mastery after a hit', () => { reset(small); run('review', '--date', '2026-09-07'); const id = prog().reviews[0].recall_id; run('answer', small.find(x => x.id === id).arabic, '--date', '2026-09-07'); const o = run('stats'); ok(o.includes('| wk | start |')); ok(o.includes('| 1 | 2026-09-07 | 1 | 1 | 5 | 1 | 0 | 0 |'), o); ok(o.includes('Words: 10 total · 5 seen')); });
t('S48 every command appends a log row with cmd + dur_ms', () => { reset(small); try { fs.unlinkSync(path.join(tmp, 'log.jsonl')); } catch {} run('review', '--date', '2026-09-07'); run('status', '--date', '2026-09-07'); const rows = fs.readFileSync(path.join(tmp, 'log.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l)); eq(rows.length, 2); eq(rows[0].cmd, 'review'); ok(typeof rows[1].dur_ms === 'number'); });
t('S28 week next at last set stays (no crash)', () => { reset(small); run('review', '--date', '2026-09-07'); run('week', 'next', '--date', '2026-09-07'); const o = run('week', 'next', '--date', '2026-09-07'); ok(o.includes('Lesson 2')); });
t('S29 week <lesson without words> = message', () => { reset(small); ok(run('week', '8', '--date', '2026-09-07').includes('No words for lesson 8')); });
t('S30 chunk header (1/2) and ahead-of-class flag', () => { reset(big); const o = run('review', '--date', '2026-09-07'); ok(o.startsWith('Week 1 · Lesson 3 (1/2)'), o.split('\n')[0]); run('week', '21', '--date', '2026-09-07'); ok(run('review', '--date', '2026-09-08').split('\n')[0].includes('ahead of class')); });
t('S31 set smaller than 5 shows all', () => { reset(small.filter(w => w.lesson === 2)); const o = run('review', '--date', '2026-09-07'); eq((o.match(/^\| \d /gm) || []).length, 4); });
t('S32 status before start', () => { reset(small); ok(run('status').includes('Not started')); });
t('S33 status line shape', () => { reset(small); run('review', '--date', '2026-09-07'); eq(run('status', '--date', '2026-09-07'), 'Week 1 · Lesson 1 (chunk 1/1) · 1/5 reviews · misses: 0 · next roll Mon'); });
t('S34 nudge: not started / not yet today / done today / new week', () => { reset(small); eq(run('nudge', '--date', '2026-09-07'), '📖 Arabic: not started · `/arabic`'); run('review', '--date', '2026-09-07'); eq(run('nudge', '--date', '2026-09-07'), '📖 Arabic: 1/5 reviews this week · done today'); eq(run('nudge', '--date', '2026-09-08'), '📖 Arabic: 1/5 reviews this week · not yet today'); eq(run('nudge', '--date', '2026-09-14'), '📖 Arabic: new week · not yet today'); });
t('S35 nudge with no data folder = empty (silent)', () => { process.env.ARABIC_DATA_DIR = path.join(tmp, 'nope'); delete require.cache[require.resolve('./arabic.js')]; const e2 = require('./arabic.js'); eq(e2.main(['node', 'a', 'nudge']), ''); process.env.ARABIC_DATA_DIR = tmp; delete require.cache[require.resolve('./arabic.js')]; });
t('S36 more prints only seen vocabulary + function words', () => { reset(small); run('review', '--date', '2026-09-07'); const o = run('more'); ok(o.includes('FUNCTION WORDS')); ok(!o.includes('إِمَامٌ'), 'lesson 2 word must not leak'); ok(o.includes('بَيْتٌ')); });
t('S37 class position stored', () => { reset(small); ok(run('class', 'Kata Hubung').includes('Kata Hubung')); eq(prog().class_position.text, 'Kata Hubung'); });
t('S38 corrupt progress.json → treated as fresh, no crash', () => { reset(small); fs.writeFileSync(path.join(tmp, 'progress.json'), '{not json'); ok(run('review', '--date', '2026-09-07').startsWith('Week 1')); });
t('S39 recall never a word outside the shown five', () => { reset(small); for (const d of ['07', '08', '09', '10', '11', '12']) { const o = run('review', '--date', '2026-09-' + d); const r = prog().reviews.find(x => x.date === '2026-09-' + d); ok(r.shown.includes(r.recall_id), 'recall in shown'); } });
t('S40 real words.json loads, 198 entries, all 7 fields, unique ids', () => { const w = JSON.parse(fs.readFileSync(REAL, 'utf8')); eq(w.length, 198); const ids = new Set(w.map(x => x.id)); eq(ids.size, 198); for (const x of w) for (const f of ['id', 'arabic', 'malay', 'lesson', 'page', 'grammar', 'status']) ok(x[f] !== undefined && x[f] !== '', `${x.id} missing ${f}`); ok(w.every(x => /[؀-ۿ]/.test(x.arabic)), 'arabic script'); });
t('S41 real data: every Malay gloss is non-Arabic and ≤ 4 words', () => { const w = JSON.parse(fs.readFileSync(REAL, 'utf8')); for (const x of w) { ok(!/[؀-ۿ]/.test(x.malay), x.id + ' malay has Arabic'); ok(x.malay.split(/\s+/).length <= 4, x.id + ' gloss too long: ' + x.malay); } });
t('S42 real data: full walk 23 sets without crash, ends at last set', () => { const w = JSON.parse(fs.readFileSync(REAL, 'utf8')); reset(w); const all = chunks(w); let d = new Date(Date.UTC(2026, 8, 7)); for (let wk = 0; wk < all.length + 2; wk++) { for (let i = 0; i < 3; i++) { const ds = new Date(d.getTime() + i * 86400000).toISOString().slice(0, 10); run('review', '--date', ds); } d = new Date(d.getTime() + 7 * 86400000); } ok(run('status', '--date', d.toISOString().slice(0, 10)).includes(`Lesson ${all[all.length - 1].lesson}`)); });

console.log(rows.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
