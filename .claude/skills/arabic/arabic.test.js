#!/usr/bin/env node
/** arabic.test.js — eval suite for the /arabic engine. Run: node .claude/skills/arabic/arabic.test.js */
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'arabic-eval-'));
process.env.ARABIC_DATA_DIR = tmp;
process.env.ARABIC_JOURNAL = path.join(tmp, 'arabic.md');
const REAL =path.join(__dirname, '..', '..', '..', 'projects', 'learning-projects', 'active', 'arabic', 'data', 'words.json');
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

// ---- Phase 3: revision modes (S49–S60) ----
const REALDIR = path.join(__dirname, '..', '..', '..', 'projects', 'learning-projects', 'active', 'arabic', 'data');
function copyReal(name) { fs.copyFileSync(path.join(REALDIR, name), path.join(tmp, name)); }
function loadReal() { reset(small); ['syllabus.json', 'paradigms.json', 'roots.json'].forEach(copyReal); }
t('S49 real syllabus/paradigms/roots load with expected shapes', () => {
  const s = JSON.parse(fs.readFileSync(path.join(REALDIR, 'syllabus.json'), 'utf8')); eq(Object.keys(s).length, 24);
  const par = JSON.parse(fs.readFileSync(path.join(REALDIR, 'paradigms.json'), 'utf8')); eq(Object.keys(par).length, 8);
  const r = JSON.parse(fs.readFileSync(path.join(REALDIR, 'roots.json'), 'utf8')); ok(r.families.length >= 15);
});
t('S50 topic list = 24 topics in order', () => { loadReal(); const lines = run('topic', 'list').split('\n'); eq(lines.length, 24); ok(lines[0].startsWith('1. ')); });
t('S51 topic <id> shows rules + examples', () => { loadReal(); const o = run('topic', 'isim-mawsul'); ok(o.includes('Mawsul') || o.includes('Hubung')); ok(o.includes('•')); });
t('S52 topic (no arg) deterministic per date', () => { loadReal(); eq(run('topic', '--date', '2026-09-07'), run('topic', '--date', '2026-09-07')); });
t('S53 root list + root <root> shows harakat variants', () => { loadReal(); ok(run('root', 'list').includes('حجر')); const o = run('root', 'حجر'); ok(o.includes('حَجَرٌ')); ok(o.includes('حُجْرَةٌ')); });
t('S54 form <paradigm> poses a question + stores pending', () => { loadReal(); const o = run('form', 'tasrif-madhi', '--date', '2026-09-07'); ok(o.includes('Form drill')); ok(o.trim().endsWith('Arabic?')); ok(prog().form_pending); });
t('S55 answer resolves a pending form drill (hit)', () => { loadReal(); run('form', 'tasrif-madhi', '--date', '2026-09-07'); const exp = prog().form_pending.expected; const o = run('answer', exp, '--date', '2026-09-07'); ok(o.startsWith('✓')); eq(prog().form_pending, null); eq(prog().form_stats.hit, 1); });
t('S56 answer resolves a pending form drill (miss)', () => { loadReal(); run('form', 'tasrif-madhi', '--date', '2026-09-07'); const o = run('answer', 'kitabun', '--date', '2026-09-07'); ok(o.startsWith('✗'), o); eq(prog().form_stats.miss, 1); });
t('S57 form drill deterministic per date+paradigm', () => { loadReal(); const a = run('form', 'isim-isyarah', '--date', '2026-09-07'); run('answer', 'x', '--date', '2026-09-07'); eq(a, run('form', 'isim-isyarah', '--date', '2026-09-07')); });
t('S58 form answer works with no word review (no crash)', () => { loadReal(); run('form', 'nombor', '--date', '2026-09-07'); const exp = prog().form_pending.expected; ok(run('answer', exp, '--date', '2026-09-07').startsWith('✓')); });
t('S59 drill routes (starts with DRILL) at early lesson', () => { loadReal(); ok(run('drill', '--date', '2026-09-07').startsWith('DRILL')); });
t('S60 new commands do not disturb the daily review flow', () => { loadReal(); run('form', 'tasrif-madhi', '--date', '2026-09-07'); ok(run('review', '--date', '2026-09-07').startsWith('Week 1 · Lesson 1')); });
t('S61 sync reports the 69-class manifest state', () => { loadReal(); copyReal('classes.json'); const o = run('sync'); ok(o.includes('69 classes'), o); ok(o.includes('library/sync.md')); });

t('S62 golden paradigm values (regression guard on the form tables)', () => {
  const par = JSON.parse(fs.readFileSync(path.join(REALDIR, 'paradigms.json'), 'utf8'));
  const find = (pid, q) => par[pid].forms.find(f => Object.entries(q).every(([k, v]) => f[k] === v));
  eq(find('tasrif-madhi', { person: 3, gender: 'f', number: 'sing' }).ar, 'نَصَرَتْ');
  eq(find('tasrif-madhi', { person: 3, gender: 'm', number: 'plur' }).ar, 'نَصَرُوا');
  eq(find('isim-isyarah', { distance: 'far', gender: 'f', number: 'plur' }).ar, 'أُولئِكَ');
  eq(find('isim-mawsul', { gender: 'm', number: 'sing' }).ar, 'الَّذِي');
  eq(find('nombor', { n: 7 }).cardinal_f, 'سَبْعَةٌ');
});
t('S63 form-drill degenerate near is rejected as miss', () => { loadReal(); run('form', 'dhamir-munfasil', '--date', '2026-09-07'); const o = run('answer', 'zzz', '--date', '2026-09-07'); ok(o.startsWith('✗'), o); });

// ---- class focus + ayat walk (S64–S77) ----
const SENT = { version: 1, sebab: { mubtada: { t: 'mubtada: baris depan', cite: '55.ms', topic: 'binaan-ayat-asas' }, khabar: { t: 'khabar: baris depan', cite: '34.ms', topic: 'binaan-ayat-asas' } },
  sentences: [
    { id: 'T1', lesson: 1, part: 'ب', page: 7, src: 'dialog', ar: 'هٰذَا بَيْتٌ.', ms: 'Ini rumah.', binaan: 'mubtada + khabar', words: [{ ar: 'هٰذَا', apa: 'kata tunjuk', peranan: 'mubtada', baris: 'tetap', sebab: ['mubtada'] }, { ar: 'بَيْتٌ', apa: 'isim', peranan: 'khabar', baris: 'depan, tanwin', sebab: ['khabar'] }] },
    { id: 'T2', lesson: 1, part: 'ب', page: 7, src: 'dialog', ar: 'هٰذَا مَسْجِدٌ.', ms: 'Ini masjid.', binaan: 'mubtada + khabar', words: [{ ar: 'هٰذَا', apa: 'kata tunjuk', peranan: 'mubtada', baris: 'tetap', sebab: ['mubtada'] }, { ar: 'مَسْجِدٌ', apa: 'isim', peranan: 'khabar', baris: 'depan, tanwin', sebab: ['khabar'] }] },
    { id: 'T3', lesson: 1, part: 'ج', page: 8, src: 'dialog', ar: 'ذٰلِكَ بَابٌ.', ms: 'Itu pintu.', binaan: 'mubtada + khabar', words: [{ ar: 'ذٰلِكَ', apa: 'kata tunjuk', peranan: 'mubtada', baris: 'tetap', sebab: ['mubtada'] }, { ar: 'بَابٌ', apa: 'isim', peranan: 'khabar', baris: 'depan, tanwin', sebab: ['khabar'] }] }
  ] };
function sent(o) { fs.writeFileSync(path.join(tmp, 'sentences.json'), JSON.stringify(o || SENT)); }
function noSent() { try { fs.unlinkSync(path.join(tmp, 'sentences.json')); } catch {} }
const D = '2026-09-07';
t('S64 focus <lesson> moves the Week Set there and status shows the focus', () => { reset(small); sent(); const o = run('focus', '2', '--date', D); ok(o.startsWith('Focus → Lesson 2'), o); eq(prog().focus.lesson, 2); eq(prog().week_set[0], 'L2-01'); ok(run('status', '--date', D).includes('focus: Lesson 2'), run('status', '--date', D)); });
t('S65 a focused lesson is held across a week roll (5 reviews do not advance it)', () => { reset(small); noSent(); run('focus', '1', '--date', D); ['07', '08', '09', '10', '11'].forEach(d => run('review', '--date', '2026-09-' + d)); const o = run('review', '--date', '2026-09-14'); ok(o.startsWith('Week 2 · Lesson 1'), o.split('\n')[0]); });
t('S66 focus on a 2-chunk lesson: advances to chunk 2, then wraps to chunk 1, never leaves the lesson', () => { reset(big); noSent(); run('focus', '3', '--date', D); ['07', '08', '09'].forEach(d => run('review', '--date', '2026-09-' + d)); const a = run('review', '--date', '2026-09-14'); ok(a.startsWith('Week 2 · Lesson 3 (2/2)'), a.split('\n')[0]); ['15', '16'].forEach(d => run('review', '--date', '2026-09-' + d)); const b = run('review', '--date', '2026-09-21'); ok(b.startsWith('Week 3 · Lesson 3 (1/2)'), b.split('\n')[0]); });
t('S67 week <same lesson> keeps the focus; week <other lesson> replaces it', () => { reset(small); noSent(); run('focus', '1', '--date', D); ok(!run('week', '1', '--date', D).includes('cleared')); ok(prog().focus); const o = run('week', '2', '--date', D); ok(o.includes('Class focus cleared'), o); eq(prog().focus, null); });
t('S68 focus off returns the normal weekly roll', () => { reset(small); noSent(); run('focus', '1', '--date', D); ok(run('focus', 'off', '--date', D).includes('cleared')); ['07', '08', '09'].forEach(d => run('review', '--date', '2026-09-' + d)); ok(run('review', '--date', '2026-09-14').startsWith('Week 2 · Lesson 2')); });
t('S69 focus on a lesson with nothing = message; bare focus reports', () => { reset(small); noSent(); ok(run('focus', '8', '--date', D).includes('Nothing for lesson 8')); ok(run('focus', '--date', D).includes('No class focus')); });
t('S70 sentence without a focus, or without ayat for it = guidance', () => { reset(small); sent(); ok(run('sentence', '--date', D).includes('No class focus')); run('focus', '2', '--date', D); ok(run('sentence', '--date', D).includes('No ayat entered')); });
t('S71 sentence walks ayat by ayat inside the focus part; one table row per word; wraps with a round count', () => { reset(small); sent(); run('focus', '1', 'ب', '--date', D); const a = run('sentence', '--date', D); ok(a.startsWith('Ayat 1/2 · Lesson 1 ب · hlm. 7 · dialog'), a.split('\n')[0]); ok(a.includes('هٰذَا بَيْتٌ.')); ok(a.includes('Ini rumah.')); eq((a.match(/^\| (?!Kalimah)/gm) || []).length, 2); ok(a.includes('mubtada: baris depan')); ok(a.includes('Sumber kelas: rakaman 34 · 55'), a); const b = run('sentence', '--date', D); ok(b.startsWith('Ayat 2/2'), b.split('\n')[0]); const c = run('sentence', '--date', '2026-09-08'); ok(c.startsWith('Ayat 1/2') && c.split('\n')[0].endsWith('pusingan 2'), c.split('\n')[0]); });
t('S72 sentence again re-shows without advancing; <n> jumps; list marks the next', () => { reset(small); sent(); run('focus', '1', 'ب', '--date', D); const a = run('sentence', '--date', D); eq(run('sentence', 'again', '--date', D), a); eq(prog().focus.ayat, 1); ok(run('sentence', 'list', '--date', D).split('\n')[1].startsWith('▶ 2.')); ok(run('sentence', '9', '--date', D).includes('does not exist')); ok(run('sentence', '1', '--date', D).startsWith('Ayat 1/2')); ok(run('sentence', 'zzz', '--date', D).startsWith('Unknown: sentence')); });
t('S73 focus without a part takes every part of the lesson', () => { reset(small); sent(); run('focus', '1', '--date', D); ok(run('sentence', '--date', D).startsWith('Ayat 1/3')); });
t('S74 daily with a stored class mode = the ayat walk when the focus has ayat, else the word review with a line saying so', () => { reset(small); sent(); run('mode', 'vocab', '--date', D); ok(run('daily', '--date', D).startsWith('Week 1 · Lesson 1 · review 1 of 5')); run('mode', 'class-topic', '1', 'ب', '--date', D); ok(run('daily', '--date', D).startsWith('Ayat 2/2')); run('focus', '2', '--date', D); const o = run('daily', '--date', '2026-09-08'); ok(o.startsWith('No ayat entered') && o.includes('Week 1 · Lesson 2'), o.split('\n')[0]); });
t('S75 a word row with an unknown reason key = a clean error, not a crash', () => { reset(small); const bad = JSON.parse(JSON.stringify(SENT)); bad.sentences[0].words[0].sebab = ['made-up']; sent(bad); run('focus', '1', 'ب', '--date', D); const o = run('sentence', '--date', D); ok(o.startsWith('✗ sentences.json error'), o); eq(prog().focus.ayat, 0); });
t('S76 real sentences.json: every reason is class-cited or marked belum, rows use only those reasons, words rebuild the ayat', () => {
  const S2 = JSON.parse(fs.readFileSync(path.join(REALDIR, 'sentences.json'), 'utf8'));
  const syl = JSON.parse(fs.readFileSync(path.join(REALDIR, 'syllabus.json'), 'utf8'));
  const AR = /[؀-ۿ]/; const LATIN = /[A-Za-z]/;
  for (const [k, r] of Object.entries(S2.sebab)) {
    ok(r.t && r.t.length <= 110, `sebab ${k} text`); ok(!AR.test(r.t), `sebab ${k} mixes Arabic into a Malay line`);
    if (r.belum) { ok(/belum/.test(r.t) && !r.cite, `sebab ${k} belum shape`); continue; }
    ok(/^(doc:\d+|\d\d\.ms)$/.test(r.cite || ''), `sebab ${k} has no class cite`);
    const m = /^doc:(\d+)$/.exec(r.cite); if (m) ok(Number(m[1]) <= 4821, `sebab ${k} doc line`);
    const n = /^(\d\d)\.ms$/.exec(r.cite); if (n) ok(Number(n[1]) >= 1 && Number(n[1]) <= 69, `sebab ${k} recording`);
    ok(r.topic === null || !!syl[r.topic], `sebab ${k} topic ${r.topic}`);
  }
  const ids = new Set(); const BARIS = /^(depan|atas|bawah|mati|tetap|tiada|wau|hujung)/;
  const strip = x => x.replace(/[ً-ْٰـ\s؟،.]/g, '');
  for (const s of S2.sentences) {
    ok(!ids.has(s.id), 'duplicate id ' + s.id); ids.add(s.id);
    for (const f of ['id', 'lesson', 'part', 'page', 'src', 'ar', 'ms', 'binaan']) ok(s[f] !== undefined && s[f] !== '', `${s.id} missing ${f}`);
    ok(AR.test(s.ar) && !LATIN.test(s.ar), `${s.id} ar must be Arabic script only`);
    ok(!AR.test(s.ms) && !AR.test(s.binaan), `${s.id} Arabic inside a Malay line`);
    ok(s.words.length >= 1, `${s.id} no words`);
    for (const w of s.words) {
      ok(AR.test(w.ar) && !LATIN.test(w.ar), `${s.id} word ar`);
      ok(w.apa && w.peranan && BARIS.test(w.baris), `${s.id} ${w.ar} apa/peranan/baris`);
      ok(!AR.test(w.apa + w.peranan + w.baris), `${s.id} ${w.ar} Arabic inside a Malay cell`);
      ok(Array.isArray(w.sebab) && w.sebab.length >= 1 && w.sebab.every(k => S2.sebab[k]), `${s.id} ${w.ar} sebab keys`);
    }
    eq(strip(s.words.map(w => w.ar).join('')), strip(s.ar), `${s.id} words do not rebuild the ayat`);
  }
});
t('S77 real sentences.json: every ayat of Lesson 13 ب renders through the engine', () => {
  reset(small); copyReal('sentences.json');
  const n = JSON.parse(fs.readFileSync(path.join(REALDIR, 'sentences.json'), 'utf8')).sentences.filter(s => s.lesson === 13 && s.part === 'ب').length; ok(n >= 9, 'ayat count ' + n);
  ok(run('focus', '13', 'ب', '--date', D).startsWith('Focus → Lesson 13 ب'));
  for (let i = 0; i < n; i++) { const o = run('sentence', '--date', D); ok(o.startsWith(`Ayat ${i + 1}/${n} · Lesson 13 ب`), o.split('\n')[0]); ok(!o.includes('✗') && o.includes('Sumber kelas:'), o.split('\n')[0]); }
  noSent();
});

// ---- class session: log, revision asks, save check, class vocabulary (S78–S95) ----
const J = path.join(tmp, 'arabic.md');
const journal = t0 => fs.writeFileSync(J, t0 === undefined ? '# arabic\n\n## Progress\n- old line\n\n## Notes\n- n\n' : t0);
const cls = () => JSON.parse(fs.readFileSync(path.join(tmp, 'class.json'), 'utf8'));
function fresh() { reset(small); noSent(); for (const f of ['class.json', 'class-vocab.json']) { try { fs.unlinkSync(path.join(tmp, f)); } catch {} } journal(); }
const jl = () => fs.readFileSync(J, 'utf8').split('\n');
t('S78 class + note + revise + close: journal line holds where it stopped, what was worked, the note and the ask; save-check passes', () => {
  fresh(); run('class', 'L13 Ex 1', '--date', D); run('class', 'L13 Ex 2', '--date', D); run('note', 'teacher prefers X', '--date', D); run('revise', 'add', 'mubtada badal', '--date', D);
  ok(run('class', 'close', '--date', D).startsWith('Class ' + D + ' closed.'));
  const l = jl().find(x => x.startsWith(`- ${D} class: `)); ok(l, 'no journal line');
  ok(l.includes('stopped at L13 Ex 2') && l.includes('L13 Ex 1 → L13 Ex 2') && l.includes('teacher prefers X') && l.includes('mubtada badal'), l);
  ok(jl().indexOf(l) < jl().indexOf('## Notes'), 'line must sit inside Progress');
  const o = run('save-check', '--date', D); ok(o.startsWith('✓ class ' + D + ' saved') && o.includes('notes 1') && o.includes('open 1 (not built 1)'), o);
});
t('S79 class recorded but not closed = save-check fails and names the step', () => { fresh(); run('class', 'L13 Ex 1', '--date', D); const o = run('save-check', '--date', D); ok(o.startsWith('✗') && o.includes('class close') && o.includes('no journal line'), o); });
t('S80 no class today = save-check passes (a daily review alone is not a class)', () => { fresh(); run('review', '--date', D); eq(run('save-check', '--date', D), '✓ no class today'); });
t('S81 a note, a position or an ask after the close reopens the class', () => {
  for (const again of [['note', 'late note'], ['class', 'L13 Ex 3'], ['revise', 'add', 'late ask']]) { fresh(); run('class', 'L13 Ex 1', '--date', D); run('class', 'close', '--date', D); run(...again, '--date', D); ok(run('save-check', '--date', D).startsWith('✗'), again[0]); }
});
t('S82 closing twice keeps ONE journal line, updated', () => { fresh(); run('class', 'A', '--date', D); run('class', 'close', '--date', D); run('class', 'B', '--date', D); run('class', 'close', '--date', D); const ls = jl().filter(x => x.startsWith(`- ${D} class: `)); eq(ls.length, 1); ok(ls[0].includes('stopped at B')); });
t('S83 journal with no Progress section gets one; a missing journal file = a clean error, class stays open', () => {
  fresh(); journal('# arabic\n'); run('class', 'A', '--date', D); run('class', 'close', '--date', D); ok(jl().includes('## Progress'));
  fresh(); fs.unlinkSync(J); run('class', 'A', '--date', D); ok(run('class', 'close', '--date', D).startsWith('✗ Journal file not found')); eq(cls().sessions[0].closed, null);
});
t('S84 close with no position today = a clean refusal', () => { fresh(); run('note', 'only a note', '--date', D); ok(run('class', 'close', '--date', D).startsWith('✗ No class position')); });
t('S85 a class on an earlier day does not make today a class day; closing today leaves the old session alone', () => {
  fresh(); run('class', 'old', '--date', '2026-09-01'); eq(run('save-check', '--date', D), '✓ no class today');
  run('class', 'new', '--date', D); run('class', 'close', '--date', D); eq(cls().sessions.find(s => s.date === '2026-09-01').closed, null);
});
t('S86 position set by an older engine (progress.json only, no class log) = save-check fails, not a silent pass', () => { fresh(); run('review', '--date', D); const p = prog(); p.class_position = { text: 'x', set: D }; fs.writeFileSync(path.join(tmp, 'progress.json'), JSON.stringify(p)); ok(run('save-check', '--date', D).startsWith('✗')); });
t('S87 corrupt class.json = treated as empty, no crash', () => { fresh(); fs.writeFileSync(path.join(tmp, 'class.json'), '{not json'); eq(run('save-check', '--date', D), '✓ no class today'); ok(run('revise').startsWith('No open revision ask')); });
t('S88 a revision ask not linked to a class part is listed as not built and never counts', () => { fresh(); sent(); run('revise', 'add', 'ask one', '--date', D); ok(run('revise').includes('not built yet')); run('focus', '1', 'ب', '--date', D); ok(!run('sentence', '--date', D).includes('Ulang kaji')); eq(cls().revise[0].done, 0); });
t('S89 link refuses a class part with no ayat entered; an unknown id = a clean message', () => { fresh(); sent(); run('revise', 'add', 'ask', '--date', D); ok(run('revise', 'link', '1', '9', 'ب').startsWith('No ayat entered')); ok(run('revise', 'link', '7', '1', 'ب').startsWith('No revision ask #7')); });
t('S90 each ayat walked counts one; `again` and `list` do not; the ask clears at its goal, by amount', () => {
  fresh(); sent(); run('revise', 'add', 'ask', '--date', D); ok(run('revise', 'link', '1', '1', 'ب').includes('0/7'));
  run('focus', '1', 'ب', '--date', D); ok(run('sentence', '--date', D).includes('Ulang kaji #1: 1/7')); run('sentence', 'again', '--date', D); run('sentence', 'list', '--date', D); eq(cls().revise[0].done, 1);
  for (let i = 0; i < 5; i++) run('sentence', '--date', D); eq(cls().revise[0].cleared, null);
  ok(run('sentence', '--date', '2026-12-01').includes('7/7 · selesai')); eq(cls().revise[0].cleared, '2026-12-01'); ok(!run('sentence', '--date', D).includes('Ulang kaji'));
});
t('S91 time alone never clears an ask', () => { fresh(); sent(); run('revise', 'add', 'ask', '--date', D); run('revise', 'link', '1', '1', 'ب'); run('review', '--date', '2027-01-01'); eq(cls().revise[0].cleared, null); ok(run('revise').includes('0/7')); });
t('S92 goal: bounds refused; lowering it under the done count clears the ask', () => { fresh(); sent(); run('revise', 'add', 'ask', '--date', D); run('revise', 'link', '1', '1', 'ب'); ok(run('revise', 'goal', '1', '2').includes('3–60')); run('focus', '1', 'ب', '--date', D); for (let i = 0; i < 3; i++) run('sentence', '--date', D); run('revise', 'goal', '1', '3', '--date', D); eq(cls().revise[0].cleared, D); });
t('S93 an ayat of another class part does not count for the ask', () => { fresh(); sent(); run('revise', 'add', 'ask', '--date', D); run('revise', 'link', '1', '1', 'ب'); const c = cls(); c.revise[0].part = 'ج'; fs.writeFileSync(path.join(tmp, 'class.json'), JSON.stringify(c)); run('focus', '1', 'ب', '--date', D); run('sentence', '--date', D); eq(cls().revise[0].done, 0); });
t('S94 gloss: finds a class word through harakat, alif lam and a prefix; Arabic alone in its cell; no file = a clean line', () => {
  fresh(); ok(run('gloss').startsWith('No class-vocab.json'));
  fs.writeFileSync(path.join(tmp, 'class-vocab.json'), JSON.stringify({ habits: [{ t: 'alif lam dibaca "itu"', cite: 'doc:3757' }], words: [{ ar: 'نَاسٌ', kelas: 'manusia', lain: 'orang ramai', cite: 'doc:4386' }, { ar: 'صَغِيرٌ', kelas: 'kecil', cite: 'kelas:2026-10-13', forms: ['صَغِيرَاتٌ'] }] }));
  const o = run('gloss', 'مَنْ هٰؤُلَاءِ النَّاسُ؟ وَالصَّغِيرَاتُ'); ok(o.includes('| نَاسٌ | manusia | orang ramai | doc:4386 |') && o.includes('| صَغِيرٌ | kecil |') && o.includes('alif lam'), o);
  ok(run('gloss', 'كِتَابٌ').startsWith('No class word in this text.')); ok(run('gloss').startsWith('Class vocabulary: 2 words · 1 habits'));
});
t('S95 real class-vocab.json: every row is the teacher\'s (cited), Arabic and Malay kept apart, the cite resolves', () => {
  const v = JSON.parse(fs.readFileSync(path.join(REALDIR, 'class-vocab.json'), 'utf8')); const AR = /[؀-ۿ]/;
  const docLines = fs.readFileSync(path.join(REALDIR, '..', 'source', 'syllabus.txt'), 'utf8').split(/\r?\n/).length;
  const cite = (c, who) => { const d = /^doc:(\d+)$/.exec(c); const r = /^(\d\d)\.ms@\d{1,3}:\d\d$/.exec(c); ok(d || r || /^kelas:\d{4}-\d{2}-\d{2}$/.test(c), who + ' cite ' + c); if (d) ok(Number(d[1]) <= docLines, who + ' doc line'); if (r) ok(fs.existsSync(path.join(REALDIR, '..', 'source', 'transcripts', r[1] + '.ms.md')), who + ' recording'); };
  ok(v.words.length >= 1, 'no words'); const seen = new Set();
  for (const w of v.words) { ok(AR.test(w.ar) && !/[A-Za-z]/.test(w.ar), 'ar ' + w.ar); ok(w.kelas && !AR.test(w.kelas + (w.lain || '')), w.ar + ' Malay cell'); cite(w.cite, w.ar); ok(!seen.has(w.ar), 'duplicate ' + w.ar); seen.add(w.ar); for (const f of w.forms || []) ok(AR.test(f), w.ar + ' form'); }
  for (const h of v.habits || []) { ok(h.t && !AR.test(h.t), 'habit text'); cite(h.cite, 'habit'); }
});

// ---- start mode + review next (S96–S104) ----
const SYL = { 'topic-a': { id: 'topic-a', order: 1, name_ms: 'Topik A', concept: 'c', rules: [{ text: 'rule A' }], examples: [], classes: [], revised_in: [] }, 'topic-b': { id: 'topic-b', order: 2, name_ms: 'Topik B', concept: 'c', rules: [{ text: 'rule B' }], examples: [], classes: [], revised_in: [] } };
function modeData() { fresh(); sent(); fs.writeFileSync(path.join(tmp, 'syllabus.json'), JSON.stringify(SYL)); }
const shownIds = o => (o.match(/^\| \d \| [^|]+/gm) || []).map(x => x.split('| ')[2].trim());
t('S96 no stored mode: daily and mode print the menu with three options and the exact commands; nothing is reviewed', () => { modeData(); const o = run('daily', '--date', D); ok(o.startsWith('Arabic: pick a mode (current: none)'), o.split('\n')[0]); for (const m of ['mode vocab', 'mode class-latest', 'mode class-topic <lesson> [part]', 'mode class-topic <topic id>']) ok(o.includes('node .claude/skills/arabic/arabic.js ' + m), m); eq(run('mode', '--date', D), o); ok(!fs.existsSync(path.join(tmp, 'progress.json')) || !prog().reviews.length, 'menu must not log a review'); });
t('S97 mode vocab: stored, menu marks it current, daily = the word review', () => { modeData(); const o = run('mode', 'vocab', '--date', D); ok(o.startsWith('Mode → vocab.') && o.includes('review 1 of 5'), o); eq(prog().mode, 'vocab'); ok(run('mode', '--date', D).includes('| ▶ | vocab |')); ok(run('daily', '--date', D).startsWith('Week 1')); });
t('S98 mode class-latest follows the last class position: lesson + part read from it, ayat walk from ayat 1', () => { modeData(); run('class', 'Lesson 1 ج dialogue (page 8)', '--date', D); const o = run('mode', 'class-latest', '--date', D); ok(o.includes('Ayat 1/1 · Lesson 1 ج'), o); eq(prog().focus.part, 'ج'); eq(prog().mode, 'class-latest'); });
t('S99 class-latest keeps the pointer for the same class part; a new class part replaces the focus', () => { modeData(); run('class', 'Lesson 1 ب Exercise 1', '--date', D); run('mode', 'class-latest', '--date', D); ok(run('daily', '--date', D).startsWith('Ayat 2/2')); run('class', 'Lesson 1 ج dialogue', '--date', D); ok(run('daily', '--date', D).startsWith('Ayat 1/1 · Lesson 1 ج')); });
t('S100 mode class-topic <lesson> [part] sets the focus; `mode class 1 ج` is the same; a lesson with nothing = message, mode unchanged', () => { modeData(); ok(run('mode', 'class-topic', '1', 'ب', '--date', D).includes('Ayat 1/2 · Lesson 1 ب')); eq(prog().mode, 'class-topic'); eq(prog().focus.part, 'ب'); run('mode', 'vocab', '--date', D); ok(run('mode', 'class', '1', 'ج', '--date', D).includes('Lesson 1 ج')); eq(prog().mode, 'class-topic'); run('mode', 'vocab', '--date', D); ok(run('mode', 'class-topic', '8', '--date', D).includes('Nothing for lesson 8')); eq(prog().mode, 'vocab'); });
t('S101 mode class-topic <topic id> (or bare `mode <topic id>`): daily = that topic; next = the next topic in class order, wrapping; unknown id = message', () => { modeData(); ok(run('mode', 'class-topic', 'topic-a', '--date', D).includes('Topic 1: Topik A')); ok(run('daily', '--date', D).startsWith('Topic 1')); ok(run('next', '--date', D).startsWith('Topic 2: Topik B')); ok(run('next', '--date', D).startsWith('Topic 1')); ok(run('mode', 'topic-b', '--date', D).includes('Topic 2')); ok(run('mode', 'zzz', '--date', D).startsWith('No topic "zzz"')); });
t('S102 review next = 5 NEW words of the week set (no overlap), same review number, recall moves to them; a plain re-run shows the latest five', () => { reset(big); run('mode', 'vocab', '--date', D); const a = run('review', '--date', D); const b = run('review', 'next', '--date', D); const A = shownIds(a), B = shownIds(b); eq(B.length, 5); ok(!B.some(x => A.includes(x)), 'overlap'); ok(b.startsWith('Week 1 · Lesson 3 (1/2) · review 1 of 5 · words 2/3'), b.split('\n')[0]); eq(prog().reviews.length, 1); ok(B.includes(big.find(w => w.id === prog().reviews[0].recall_id).arabic), 'recall in new five'); eq(run('review', '--date', D), b); });
t('S103 next in vocab mode walks 2/3 → 3/3 → wraps; `words next` is the same command; first next of a day = the normal review', () => { reset(big); run('mode', 'vocab', '--date', D); ok(run('next', '--date', '2026-09-08').includes('review 2 of 5'), 'first = normal'); ok(run('next', '--date', '2026-09-08').includes('words 2/3')); const c = run('words', 'next', '--date', '2026-09-08'); ok(c.includes('words 3/3'), c.split('\n')[0]); const r = prog().reviews[1]; eq(new Set(r.shown.concat(r.more.flat())).size, 15); ok(run('next', '--date', '2026-09-08').includes('starting again')); });
t('S104 next per class mode = the next ayat; next with no mode = the menu', () => { modeData(); ok(run('next', '--date', D).startsWith('Arabic: pick a mode')); run('mode', 'class-topic', '1', 'ب', '--date', D); ok(run('next', '--date', D).startsWith('Ayat 2/2')); });

console.log(rows.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
