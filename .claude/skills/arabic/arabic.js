#!/usr/bin/env node
/**
 * arabic.js — deterministic engine for the /arabic daily vocabulary review.
 * Spec: projects/learning-projects/active/arabic/SPEC.md (v1.0).
 * Data: projects/learning-projects/active/arabic/data/{words.json,progress.json}
 *
 * Usage:
 *   node arabic.js review [--date YYYY-MM-DD]     today's review (logs the visit)
 *   node arabic.js answer "<text>" [--date ...]   check the recall answer, reveal, log hit/miss
 *   node arabic.js more                            print the closed vocabulary for /arabic more (no log)
 *   node arabic.js week <lesson>|next             override this week's set / force-advance
 *   node arabic.js class <text>|close             record where the class is (kept in the class log) · close = write the journal line
 *   node arabic.js note <text>                    something discussed in class, kept in today's class log
 *   node arabic.js revise [add <text>|link <id> <lesson> [part]|goal <id> <n>]   revision asks, cleared by ayat walked
 *   node arabic.js save-check                     is today's class saved? exit 1 when not (run by lib/save-rules.js)
 *   node arabic.js gloss [all|<arabic text>]      the teacher's own Malay for the class words in a text
 *   node arabic.js status                         one status line
 *   node arabic.js settings [key value]           show/set: words · pace · min_reviews · set_max
 *   node arabic.js stats                          weekly table + mastery (observability)
 *   node arabic.js nudge                          one boot line or nothing
 *   node arabic.js focus [<lesson> [part]|off]    class focus: the Week Set and the ayat walk stay on that class until replaced
 *   node arabic.js sentence [again|<n>|list]      next ayat of the class focus, word by word (data/sentences.json)
 *   node arabic.js review next | words next       5 more words of this week's set (not the same 5 again)
 *   node arabic.js mode [vocab|baris|class|class-latest|class-topic <lesson> [part]|<topic id>]   pick what `daily` gives; no arg = the menu
 *   node arabic.js baris [next]                   baris drill: 5 class-ayat words, which baris and why (class-cited reasons only)
 *   node arabic.js daily                          follows the stored mode (no mode = the menu)
 *   node arabic.js next                           per mode: 5 more words · next ayat · next grammar topic
 * Env: ARABIC_DATA_DIR overrides the data folder (used by tests).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..', '..');
const DATA_DIR = process.env.ARABIC_DATA_DIR || path.join(REPO, 'projects', 'learning-projects', 'active', 'arabic', 'data');
const WORDS = path.join(DATA_DIR, 'words.json');
const PROGRESS = path.join(DATA_DIR, 'progress.json');
const SETTINGS = path.join(DATA_DIR, 'settings.json');
const LOG = path.join(DATA_DIR, 'log.jsonl');
// Phase 2/3 data (syllabus knowledge base + form tables + root families)
const SYLLABUS = path.join(DATA_DIR, 'syllabus.json');
const PARADIGMS = path.join(DATA_DIR, 'paradigms.json');
const ROOTS = path.join(DATA_DIR, 'roots.json');
// Class-focus data: the ayat of a class, each word explained only with class-cited reasons
const SENTENCES = path.join(DATA_DIR, 'sentences.json');
// Class session data: the class log + revision asks, the teacher's vocabulary, and the journal the class close writes to
const CLASSLOG = path.join(DATA_DIR, 'class.json');
const VOCAB = path.join(DATA_DIR, 'class-vocab.json');
const JOURNAL = process.env.ARABIC_JOURNAL || path.join(DATA_DIR, '..', 'arabic.md');
// Settings (みや-adjustable via `settings <key> <value>`): words = rows per review · pace = lessons (chunks) per week ·
// min_reviews = reviews needed before the week advances · set_max = words per chunk
const DEFAULTS = { words: 5, pace: 1, min_reviews: 3, set_max: 15 };
const LIMITS = { words: [3, 15], pace: [1, 4], min_reviews: [1, 7], set_max: [5, 30] };
const AHEAD_FROM_LESSON = 21;
const FUNCTION_WORDS = ['فِي', 'عَلَى', 'مِنْ', 'إِلَى', 'هَذَا', 'ذَلِكَ', 'هَذِهِ', 'تِلْكَ', 'وَ', 'لَا', 'نَعَمْ', 'أَ', 'مَا', 'مَنْ', 'هَلْ', 'يَا'];

// ---------- io ----------
function readJson(p, fallback) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } }
function writeJson(p, o) { fs.writeFileSync(p, JSON.stringify(o, null, 1), 'utf8'); }
function loadWords() { const w = readJson(WORDS, null); if (!w) throw new Error('words.json missing at ' + WORDS); return w; }
function loadSyllabus() { return readJson(SYLLABUS, null); }
function loadParadigms() { return readJson(PARADIGMS, null); }
function loadRoots() { return readJson(ROOTS, null); }
function loadSentences() { return readJson(SENTENCES, null); }
function loadProgress() {
  return readJson(PROGRESS, { week_start: null, set_index: 0, week_set: [], reviews: [], words: {}, class_position: null, override: null });
}
function loadSettings() { const s = readJson(SETTINGS, {}); const out = { ...DEFAULTS }; for (const k of Object.keys(DEFAULTS)) if (Number.isInteger(s[k])) out[k] = s[k]; return out; }
let S = loadSettings();
function logRow(row) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch {} }

// ---------- dates ----------
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); }
function fmt(d) { return d.toISOString().slice(0, 10); }
function today(argDate) { if (argDate) return argDate; const n = new Date(); return fmt(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))); }
function mondayOf(dateStr) { const d = parseDate(dateStr); const dow = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dow); return fmt(d); }

// ---------- week sets (deterministic chunking) ----------
function chunks(words) {
  const byLesson = new Map();
  for (const w of words) { if (!byLesson.has(w.lesson)) byLesson.set(w.lesson, []); byLesson.get(w.lesson).push(w); }
  const out = [];
  for (const lesson of [...byLesson.keys()].sort((a, b) => a - b)) {
    const list = byLesson.get(lesson);
    const n = Math.ceil(list.length / S.set_max);
    for (let i = 0; i < n; i++) out.push({ lesson, chunk: i + 1, of: n, ids: list.slice(i * S.set_max, (i + 1) * S.set_max).map(w => w.id) });
  }
  return out;
}
// The active Week Set = `pace` consecutive chunks starting at set_index (pace 1 = one chunk, the default).
function activeSet(all, idx) {
  const parts = all.slice(idx, idx + S.pace);
  const first = parts[0], last = parts[parts.length - 1];
  return { lesson: first.lesson, lessonTo: last.lesson, chunk: first.chunk, of: first.of, parts: parts.length, ids: parts.flatMap(c => c.ids) };
}
function chunkIndexForLesson(all, lesson) { const i = all.findIndex(c => c.lesson === Number(lesson)); return i < 0 ? null : i; }
// A class focus pins the Week Set inside its lesson: an advance past the lesson's last chunk wraps to its first.
function clampToFocus(p, all) {
  if (!p.focus) return;
  const first = chunkIndexForLesson(all, p.focus.lesson); if (first === null) return;
  const last = first + all.filter(c => c.lesson === Number(p.focus.lesson)).length - 1;
  if (p.set_index < first || p.set_index > last) p.set_index = first;
}

// ---------- state transitions ----------
function reviewsThisWeek(p) { return p.reviews.filter(r => r.week_start === p.week_start); }
function distinctDates(rs) { return [...new Set(rs.map(r => r.date))]; }

function rollIfNeeded(p, words, date) {
  const all = chunks(words);
  const monday = mondayOf(date);
  if (p.week_start === null) { p.week_start = monday; p.set_index = 0; }
  else if (monday !== p.week_start) {
    const prev = distinctDates(reviewsThisWeek(p)).length;
    if (p.override && p.override.week_start === monday) { p.set_index = p.override.set_index; p.override = null; }
    else if (prev >= S.min_reviews && p.set_index < all.length - 1) p.set_index = Math.min(p.set_index + S.pace, all.length - 1);   // else carry-over
    p.week_start = monday;
  } else if (p.override && p.override.week_start === monday) { p.set_index = p.override.set_index; p.override = null; }
  clampToFocus(p, all);
  p.set_index = Math.min(p.set_index, all.length - 1);
  const set = activeSet(all, p.set_index);
  p.week_set = set.ids;
  return set;
}

function stats(p, id) { return p.words[id] || (p.words[id] = { shown: 0, hit: 0, miss: 0 }); }
function shownThisWeek(p, id) { return reviewsThisWeek(p).reduce((n, r) => n + ((r.shown || []).includes(id) ? 1 : 0), 0); }

function pickFive(p, words, set) {
  const byId = Object.fromEntries(words.map(w => [w.id, w]));
  const order = set.ids.map((id, i) => ({ id, i }));
  const missFirst = order.filter(o => stats(p, o.id).miss > stats(p, o.id).hit);
  const rest = order.filter(o => !missFirst.includes(o)).sort((a, b) => shownThisWeek(p, a.id) - shownThisWeek(p, b.id) || a.i - b.i);
  return [...missFirst, ...rest].slice(0, S.words).map(o => byId[o.id]);
}
function hashDate(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function pickRecall(p, five, date) {
  const misses = five.filter(w => stats(p, w.id).miss > 0).sort((a, b) => stats(p, b.id).miss - stats(p, a.id).miss);
  if (misses.length) return misses[0];
  const least = Math.min(...five.map(w => stats(p, w.id).shown));
  const cand = five.filter(w => stats(p, w.id).shown === least);
  return cand[hashDate(date) % cand.length];
}
function modeFor(n) { return n === 2 || n === 4 ? 'sentences' : n >= 5 ? 'more' : 'table'; }

// ---------- matching ----------
const HARAKAT = /[ً-ْٰـ]/g;   // tanwin, fatha..sukun, dagger alif, tatweel
function stripArabic(s) { return s.replace(HARAKAT, '').replace(/[أإآ]/g, 'ا').replace(/ة$/, 'ه').replace(/ى$/, 'ي'); }
const DIGRAPHS = [['th', 'ث'], ['dh', 'ذ'], ['kh', 'خ'], ['sh', 'ش'], ['gh', 'غ'], ['ch', 'ش']];
const SINGLE = { a: '', i: '', u: '', e: '', o: '', b: 'ب', t: 'ت', j: 'ج', h: 'ه', d: 'د', r: 'ر', z: 'ز', s: 'س', f: 'ف', q: 'ق', k: 'ك', l: 'ل', m: 'م', n: 'ن', w: 'و', y: 'ي', "'": 'ع', '`': 'ع', '3': 'ع', '7': 'ح', '5': 'خ', '9': 'ق', '2': 'ا', c: 'ك', p: 'ب', v: 'ف', x: 'كس', g: 'غ' };
function translitToSkeleton(latin) {
  let s = latin.toLowerCase().trim().replace(/[-\s]/g, '');
  s = s.replace(/(.)\1+/g, '$1');                          // doubled letters (shadda, long vowels) — before the article strip so "alladhi" → "aladhi"
  s = s.replace(/^al(?=[a-z])/, '');                       // definite article optional
  s = s.replace(/at(un|in|an)$/, 'ah');                    // ta marbuta before tanwin
  s = s.replace(/(un|in|an)$/, '');                        // tanwin
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2); const dg = DIGRAPHS.find(d => d[0] === two);
    if (dg) { out += dg[1]; i++; continue; }
    out += SINGLE[s[i]] !== undefined ? SINGLE[s[i]] : '';
  }
  return out;
}
function arabicSkeleton(s) {
  let t = stripArabic(s).replace(/\s/g, '');
  t = t.replace(/^ال/, '');
  return t;
}
function lenient(sk) { return sk.replace(/[اويه]/g, ''); }   // drop weak letters + ه (h ambiguity) for near-match
function levenshtein(a, b) {
  const m = a.length, n = b.length; const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}
function match(answer, target) {
  const isArabic = /[؀-ۿ]/.test(answer);
  let ans = isArabic ? arabicSkeleton(answer) : translitToSkeleton(answer);
  if (isArabic && /[ً-ٍ]$/.test(target.trim()) && /ن$/.test(ans)) ans = ans.slice(0, -1); // typed ن for tanwin
  const tgt = arabicSkeleton(target);
  if (ans === tgt) return 'hit';
  const la = lenient(ans), lt = lenient(tgt);
  if (!isArabic && la === lt && la.length > 0) return 'hit';   // transliteration cannot encode weak letters reliably
  const d = levenshtein(ans, tgt);
  if (d <= 1) return 'near';
  if (la === lt || levenshtein(la, lt) <= 1) return 'near';
  return 'miss';
}

// ---------- rendering ----------
function header(p, set, n) {
  const ahead = set.lessonTo >= AHEAD_FROM_LESSON ? ' · ahead of class' : '';
  const chunk = set.parts === 1 && set.of > 1 ? ` (${set.chunk}/${set.of})` : '';
  const lesson = set.lessonTo !== set.lesson ? `Lessons ${set.lesson}–${set.lessonTo}` : `Lesson ${set.lesson}`;
  const weekNo = p.reviews.length ? new Set(p.reviews.map(r => r.week_start)).size : 1;
  return `Week ${weekNo} · ${lesson}${chunk} · review ${n} of 5${ahead}`;
}
function table(five) {
  const rows = five.map((w, i) => `| ${i + 1} | ${w.arabic}${w.plural ? ' (ج ' + w.plural + ')' : ''} | ${w.malay} |`);
  return ['| # | Arabic | Malay |', '|---|---|---|', ...rows].join('\n');
}

// ---------- commands ----------
// next = 5 more words of the Week Set not yet shown today (wraps when all are seen); the day stays one review, its recall moves to the
// new five, and a same-day re-run shows the latest five.
function moreBlock(p, words, set, r, wrap) {
  const five = r.more[r.more.length - 1].map(id => words.find(w => w.id === id)); const recall = words.find(w => w.id === r.recall_id);
  return [`${header(p, set, r.n)} · words ${r.more.length + 1}/${Math.ceil(set.ids.length / S.words)}${wrap || ''}`, table(five), `Recall: '${recall.malay}' → Arabic?`].join('\n');
}
function cmdReview(date, next) {
  const words = loadWords(); const p = loadProgress();
  const set = rollIfNeeded(p, words, date);
  const existing = reviewsThisWeek(p).find(r => r.date === date);
  let n, five, recall, mode;
  if (existing && next) {
    if (!existing.more) existing.more = [];
    const today = new Set([...existing.shown, ...existing.more.flat()]);
    let pool = { ids: set.ids.filter(id => !today.has(id)) }; let wrap = '';
    if (!pool.ids.length) { pool = set; existing.more = []; wrap = ` · all ${set.ids.length} words seen today, starting again`; }
    five = pickFive(p, words, pool); recall = pickRecall(p, five, date + ':' + existing.more.length);
    for (const w of five) stats(p, w.id).shown++;
    existing.more.push(five.map(w => w.id)); existing.recall_id = recall.id; existing.result = 'skip'; delete existing.answer;
    writeJson(PROGRESS, p);
    return moreBlock(p, words, set, existing, wrap);
  }
  if (existing && existing.more && existing.more.length) return moreBlock(p, words, set, existing);
  if (existing) {
    n = existing.n; mode = existing.mode; five = existing.shown.map(id => words.find(w => w.id === id)); recall = words.find(w => w.id === existing.recall_id);
  } else {
    n = distinctDates(reviewsThisWeek(p)).length + 1; mode = modeFor(n);
    five = pickFive(p, words, set); recall = pickRecall(p, five, date);
    for (const w of five) stats(p, w.id).shown++;
    p.reviews.push({ date, week_start: p.week_start, n, mode, shown: five.map(w => w.id), recall_id: recall.id, result: 'skip' });
    writeJson(PROGRESS, p);
  }
  const out = [header(p, set, n), table(five)];
  if (mode === 'sentences') out.push(`SENTENCE DAY — write 2–3 short sentences using ONLY: ${five.map(w => w.arabic).join(' · ')} + closed vocabulary (see \`more\`). Malay under each.`);
  if (mode === 'more') out.push('`/arabic more` for 3 new sentences.');
  out.push(`Recall: '${recall.malay}' → Arabic?`);
  return out.join('\n');
}
function cmdAnswer(text, date) {
  const p = loadProgress();
  if (p.form_pending) return resolveForm(p, text);   // a form drill is awaiting its answer
  if (p.baris && p.baris.pending && barisGroups(text).length) return resolveBaris(p, text);   // a baris round is awaiting its answer
  const words = loadWords();
  const r = reviewsThisWeek(p).find(x => x.date === date);
  if (!r) return 'No review today yet — run `/arabic` first.';
  const w = words.find(x => x.id === r.recall_id);
  const verdict = match(text, w.arabic);
  const s = stats(p, w.id);
  if (verdict === 'miss') s.miss++; else s.hit++;
  r.result = verdict === 'miss' ? 'miss' : 'hit'; r.answer = text;
  writeJson(PROGRESS, p);
  return verdict === 'hit' ? `✓ ${w.arabic}` : verdict === 'near' ? `~ ${w.arabic} (you: ${text})` : `✗ ${w.arabic} (you: ${text})`;
}
function cmdMore() {
  const words = loadWords(); const p = loadProgress();
  const seen = new Set(p.reviews.flatMap(r => r.shown || [])); for (const id of p.week_set) seen.add(id);
  const vocab = words.filter(w => seen.has(w.id)).map(w => `${w.arabic} = ${w.malay}`);
  return ['CLOSED VOCABULARY (only these + function words may appear in sentences):', ...vocab, 'FUNCTION WORDS: ' + FUNCTION_WORDS.join(' '), 'Write 3 new short sentences, Malay under each.'].join('\n');
}
function cmdWeek(arg, date) {
  const words = loadWords(); const p = loadProgress(); const all = chunks(words);
  rollIfNeeded(p, words, date);
  let idx;
  if (arg === 'next') idx = Math.min(p.set_index + S.pace, all.length - 1);
  else { idx = chunkIndexForLesson(all, arg); if (idx === null) return `No words for lesson ${arg} (lessons with words: ${[...new Set(all.map(c => c.lesson))].join(', ')}).`; }
  p.set_index = idx; const set = activeSet(all, idx); p.week_set = set.ids; p.override = null;
  let note = '';
  if (p.focus && set.lesson !== Number(p.focus.lesson)) { p.focus = null; note = ' Class focus cleared.'; }   // naming another lesson replaces the focus
  writeJson(PROGRESS, p);
  const name = set.lessonTo !== set.lesson ? `Lessons ${set.lesson}–${set.lessonTo}` : `Lesson ${set.lesson}${set.of > 1 ? ' (' + set.chunk + '/' + set.of + ')' : ''}`;
  return `Week set → ${name} (${set.ids.length} words).${note}`;
}
function cmdSettings(key, value) {
  const s = readJson(SETTINGS, {});
  if (!key) return Object.entries({ ...DEFAULTS, ...s }).map(([k, v]) => `${k} = ${v}${DEFAULTS[k] === v ? '' : ' (custom)'}`).join(' · ');
  if (!(key in DEFAULTS)) return `Unknown setting "${key}". Settings: ${Object.keys(DEFAULTS).join(', ')}.`;
  const n = Number(value); const [lo, hi] = LIMITS[key];
  if (!Number.isInteger(n) || n < lo || n > hi) return `${key} must be a whole number ${lo}–${hi}.`;
  s[key] = n; writeJson(SETTINGS, s); S = loadSettings();
  return `${key} = ${n}. Takes effect on the next review${key === 'pace' || key === 'set_max' ? ' (week set re-computed)' : ''}.`;
}
function cmdStats() {
  const words = loadWords(); const p = loadProgress();
  if (!p.reviews.length) return 'No reviews yet.';
  const weeks = [...new Set(p.reviews.map(r => r.week_start))];
  const byId = Object.fromEntries(words.map(w => [w.id, w]));
  const rows = weeks.map((wk, i) => {
    const rs = p.reviews.filter(r => r.week_start === wk);
    const ids = [...new Set(rs.flatMap(r => r.shown))]; const lessons = [...new Set(ids.map(id => byId[id] && byId[id].lesson))].filter(Boolean);
    const hit = rs.filter(r => r.result === 'hit').length, miss = rs.filter(r => r.result === 'miss').length, skip = rs.filter(r => r.result === 'skip').length;
    return `| ${i + 1} | ${wk} | ${lessons.join(',')} | ${new Set(rs.map(r => r.date)).size} | ${ids.length} | ${hit} | ${miss} | ${skip} |`;
  });
  const seen = Object.values(p.words).filter(s => s.shown > 0).length;
  const mastered = Object.entries(p.words).filter(([, s]) => s.hit >= 2 && s.hit > s.miss).length;
  const shaky = Object.entries(p.words).filter(([, s]) => s.miss > 0 && s.miss >= s.hit).map(([id]) => byId[id] ? byId[id].arabic : id);
  return ['| wk | start | lessons | reviews | words seen | hit | miss | skip |', '|---|---|---|---|---|---|---|---|', ...rows,
    `Words: ${words.length} total · ${seen} seen · ${mastered} mastered (2+ hits, more hits than misses) · shaky: ${shaky.length ? shaky.join(' ') : 'none'}`,
    `Settings: ${cmdSettings()}`].join('\n');
}
function statusLine(p, words, date) {
  const all = chunks(words); const set = activeSet(all, Math.min(p.set_index, all.length - 1));
  const rs = reviewsThisWeek(p); const done = distinctDates(rs).length;
  const misses = rs.filter(r => r.result === 'miss').length;
  const todayDone = rs.some(r => r.date === date);
  return { set, done, misses, todayDone };
}
function cmdStatus(date) {
  const words = loadWords(); const p = loadProgress();
  if (p.week_start === null) return 'Not started — run `/arabic`.';
  const { set, done, misses } = statusLine(p, words, date);
  const weekNo = new Set(p.reviews.map(r => r.week_start)).size || 1;
  const lesson = set.lessonTo !== set.lesson ? `Lessons ${set.lesson}–${set.lessonTo}` : `Lesson ${set.lesson} (chunk ${set.chunk}/${set.of})`;
  return `Week ${weekNo} · ${lesson} · ${done}/5 reviews · misses: ${misses} · next roll Mon${p.focus ? ' · focus: ' + focusLine(p, loadSentences()) : ''}`;
}

// ---------- class focus + ayat walk (v1.2, 2026-10-07) ----------
// focus = State: ONE value, replaced by the next `focus`, by `week <other lesson>`, or by `focus off`. Never a list.
function focusSentences(p, S2) {
  if (!S2 || !p.focus || !Array.isArray(S2.sentences)) return [];
  return S2.sentences.filter(s => s.lesson === Number(p.focus.lesson) && (!p.focus.part || s.part === p.focus.part));
}
function focusLine(p, S2) {
  const f = p.focus; const n = focusSentences(p, S2).length;
  return `Lesson ${f.lesson}${f.part ? ' ' + f.part : ''} · ${n ? `ayat ${((f.ayat || 0) % n) + 1}/${n} next` : 'no ayat entered'}${(f.round || 1) > 1 ? ' · round ' + f.round : ''}`;
}
function cmdFocus(lessonArg, partArg, date) {
  const words = loadWords(); const p = loadProgress(); const all = chunks(words);
  rollIfNeeded(p, words, date);
  const S2 = loadSentences();
  if (!lessonArg) return p.focus ? `Focus: ${focusLine(p, S2)}` : 'No class focus. Set one with `focus <lesson> [part]`.';
  if (lessonArg === 'off') { p.focus = null; writeJson(PROGRESS, p); return 'Class focus cleared. The weekly roll is back to normal.'; }
  const lesson = Number(lessonArg); const idx = Number.isInteger(lesson) ? chunkIndexForLesson(all, lesson) : null;
  const hasAyat = !!(S2 && Array.isArray(S2.sentences) && S2.sentences.some(s => s.lesson === lesson && (!partArg || s.part === partArg)));
  if (!Number.isInteger(lesson) || (idx === null && !hasAyat)) return `Nothing for lesson ${lessonArg} (no words, no ayat).`;
  p.focus = { lesson, part: partArg || null, set: date, ayat: 0, last: null, round: 1 };
  if (idx !== null) { p.set_index = idx; p.week_set = activeSet(all, idx).ids; }
  p.override = null;
  writeJson(PROGRESS, p);
  return `Focus → ${focusLine(p, S2)}. Stays until the next \`focus\`, a \`week <other lesson>\`, or \`focus off\`.`;
}
// One ayat, word by word. Every reason text comes from the closed `sebab` table of sentences.json (class-cited or marked belum).
function renderSentence(S2, s, i, n, round) {
  const rows = []; const cites = new Set();
  for (const w of s.words) {
    const texts = w.sebab.map(k => { const r = S2.sebab[k]; if (!r) throw new Error(`unknown sebab "${k}" in ${s.id}`); if (r.cite) cites.add(r.cite); return r.t; });
    rows.push(`| ${w.ar} | ${w.apa} | ${w.peranan} | ${w.baris} | ${texts.join(' · ')} |`);
  }
  const rec = [...cites].filter(c => /\.ms$/.test(c)).map(c => c.slice(0, 2)).sort();
  const doc = [...cites].filter(c => /^doc:/.test(c)).map(c => c.slice(4)).sort((a, b) => a - b);
  const sumber = [rec.length ? 'rakaman ' + rec.join(' · ') : '', doc.length ? 'nota guru baris ' + doc.join(' · ') : ''].filter(Boolean).join(' | ');
  return [`Ayat ${i + 1}/${n} · Lesson ${s.lesson}${s.part ? ' ' + s.part : ''} · hlm. ${s.page} · ${s.src}${round > 1 ? ' · pusingan ' + round : ''}`, '',
    s.ar, '', s.ms, '',
    '| Kalimah | Jenis | Peranan | Baris akhir | Sebab (dari kelas) |', '|---|---|---|---|---|', ...rows, '',
    `Binaan: ${s.binaan}`, '',
    `Sumber kelas: ${sumber || 'tiada (semua belum dipelajari)'}`].join('\n');
}
function cmdSentence(arg, date) {
  const S2 = loadSentences(); if (!S2) return 'No sentences.json yet.';
  const p = loadProgress();
  if (!p.focus) return 'No class focus set. Run `focus <lesson> [part]` first.';
  const f = p.focus; const list = focusSentences(p, S2); const n = list.length;
  if (!n) return `No ayat entered yet for Lesson ${f.lesson}${f.part ? ' ' + f.part : ''}.`;
  const next = (f.ayat || 0) % n;
  if (arg === 'list') return list.map((s, i) => `${i === next ? '▶' : '·'} ${i + 1}. ${s.ar}`).join('\n');
  let i;
  if (arg === 'again') i = Number.isInteger(f.last) ? f.last : next;
  else if (arg && /^\d+$/.test(arg)) { i = Number(arg) - 1; if (i < 0 || i >= n) return `Ayat ${arg} does not exist (1–${n}).`; }
  else if (arg) return `Unknown: sentence ${arg}. Use: sentence · sentence again · sentence <n> · sentence list.`;
  else i = next;
  let out;
  try { out = renderSentence(S2, list[i], i, n, f.round || 1); } catch (e) { return `✗ sentences.json error: ${e.message}`; }
  if (arg !== 'again') {
    f.last = i; f.ayat = i + 1; if (f.ayat >= n) { f.ayat = 0; f.round = (f.round || 1) + 1; } writeJson(PROGRESS, p);
    const rev = countRevise(list[i], date); if (rev.length) out += '\n\n' + rev.join('\n');
  }
  return out;
}
// ---------- start mode (v1.4, 2026-10-27): みや picks what `/arabic` gives — words, the latest class, or a part / topic he names ----------
// mode = State: ONE value in progress.json (vocab | class-latest | class-topic), replaced by the next `mode`. class-topic keeps
// its lesson + part in `focus`, or a grammar topic id in `mode_topic`.
const MODES = ['vocab', 'baris', 'class', 'class-latest', 'class-topic'];
const CMD = 'node .claude/skills/arabic/arabic.js';
// The latest class = the lesson + part of the last class position ("Lesson 13 ج Exercise 1 ..."). null when it names none.
function latestClass(p) {
  const m = p.class_position && /lesson\s+(\d+)(?:\s+([ء-ي])(?![ء-ي]))?/i.exec(p.class_position.text || '');
  return m ? { lesson: Number(m[1]), part: m[2] || null } : null;
}
function cmdMode(args, date) {
  const p = loadProgress(); let [a, b, c] = args;
  if (a === 'class' && b) a = 'class-topic';   // bare `mode class` = continue the live class
  else if (a && !MODES.includes(a)) { c = b; b = a; a = 'class-topic'; }   // `mode <topic id>` / `mode <lesson> [part]`
  if (!a) return modeMenu(p);
  let head;
  if (a === 'class-topic') {
    if (!b) return `class-topic needs a lesson or a topic id: \`${CMD} mode class-topic <lesson> [part]\` · \`${CMD} mode class-topic <topic id>\` (\`topic list\`).`;
    if (/^\d+$/.test(b)) {
      const f = cmdFocus(b, c, date); if (!f.startsWith('Focus →')) return f;
      const q = loadProgress(); q.mode = a; q.mode_topic = null; writeJson(PROGRESS, q); head = `Mode → class-topic · ${f}`;
    } else {
      const syll = loadSyllabus(); if (!syll || !syll[b]) return `No topic "${b}". \`${CMD} topic list\` shows the ids.`;
      p.mode = a; p.mode_topic = b; writeJson(PROGRESS, p); head = `Mode → class-topic · topic ${b}.`;
    }
  } else {
    p.mode = a; p.mode_topic = null; writeJson(PROGRESS, p); head = `Mode → ${a}.`;
  }
  return head + '\n\n' + cmdDaily(date);
}
function modeMenu(p) {
  const S2 = loadSentences(); const lc = latestClass(p);
  const cur = m => (p.mode === m ? '▶' : '');
  const topicCell = p.mode === 'class-topic' ? (p.mode_topic ? 'topic ' + p.mode_topic : p.focus ? 'Lesson ' + p.focus.lesson : '') : '';
  const live = lastClassStop();
  const rows = [
    `| ${cur('vocab') || 1} | vocab | 5 words of this week's set · "next" = 5 more | ${p.focus ? 'Lesson ' + p.focus.lesson : ''} | | \`${CMD} mode vocab\` |`,
    `| ${cur('baris') || 2} | baris | 5 words from the class ayat: which baris, and why · "next" = 5 more | ${barisPool(S2).lessons.map(l => 'Lesson ' + l).join(', ') || 'no ayat'} | | \`${CMD} mode baris\` |`,
    `| ${cur('class') || 3} | class | continue the live class from where it stopped | ${live ? live.stop.replace(/\s*[,(]?\s*(hlm|pages?|halaman)\b.*$/i, '').replace(/\|/g, '/') : 'no class yet'} | | \`${CMD} mode class\` |`,
    `| ${cur('class-latest') || 4} | class-latest | the latest class, ayat by ayat · "next" = next ayat | ${lc ? 'Lesson ' + lc.lesson : 'no class yet'} | ${lc && lc.part ? lc.part : ''} | \`${CMD} mode class-latest\` |`,
    `| ${cur('class-topic') || 5} | class-topic | a lesson part (ayat walk) or a grammar topic you pick · "next" = next ayat or topic | ${topicCell} | ${p.mode === 'class-topic' && !p.mode_topic && p.focus && p.focus.part ? p.focus.part : ''} | \`${CMD} mode class-topic <lesson> [part]\` · \`${CMD} mode class-topic <topic id>\` |`
  ];
  return [`Arabic: pick a mode (current: ${p.mode || 'none'})`, '',
    '| # | Mode | What you get | On | Part | Command |', '|---|---|---|---|---|---|', ...rows, '',
    `Lessons with ayat: ${S2 && Array.isArray(S2.sentences) ? [...new Set(S2.sentences.map(s => s.lesson))].join(', ') : 'none'} · topic ids: \`${CMD} topic list\``].join('\n');
}
// class-latest follows the last class position: a new class part replaces the focus (pointer from ayat 1), the same part keeps it.
function syncLatest(p, date) {
  const lc = latestClass(p); if (!lc) return;
  if (p.focus && p.focus.lesson === lc.lesson && (p.focus.part || null) === lc.part) return;
  const S2 = loadSentences();
  if (S2 && Array.isArray(S2.sentences) && S2.sentences.some(s => s.lesson === lc.lesson && (!lc.part || s.part === lc.part))) cmdFocus(String(lc.lesson), lc.part, date);
}
function cmdDaily(date) {
  const p = loadProgress();
  if (!p.mode) return modeMenu(p);
  if (p.mode === 'vocab') return cmdReview(date);
  if (p.mode === 'baris') return cmdBaris(date);
  if (p.mode === 'class') return cmdLive(date);
  if (p.mode === 'class-topic' && p.mode_topic) return cmdTopic(p.mode_topic, date);
  if (p.mode === 'class-latest') syncLatest(p, date);
  const q = loadProgress();
  if (q.focus && focusSentences(q, loadSentences()).length) return cmdSentence(null, date);
  return `No ayat entered for ${q.focus ? 'Lesson ' + q.focus.lesson : 'this class'} yet: the word review instead.\n\n` + cmdReview(date);
}
// "next" follows the mode: 5 more words · the next ayat · the next grammar topic in class order.
function cmdNext(date) {
  const p = loadProgress();
  if (!p.mode) return modeMenu(p);
  if (p.mode === 'vocab') return cmdReview(date, true);
  if (p.mode === 'baris') return cmdBaris(date, 'next');
  if (p.mode === 'class-topic' && p.mode_topic) {
    const syll = loadSyllabus(); const list = Object.values(syll || {}).sort((a, b) => a.order - b.order);
    const i = list.findIndex(t => t.id === p.mode_topic); if (i < 0) return cmdTopic(p.mode_topic, date);
    p.mode_topic = list[(i + 1) % list.length].id; writeJson(PROGRESS, p); return cmdTopic(p.mode_topic, date);
  }
  return cmdDaily(date);
}
// ---------- baris drill (v1.5, 2026-10-28): which baris, and why — only reasons the class taught ----------
// A question = one word of a class ayat whose ending changes (depan / atas / bawah, never "tetap") and whose reasons are all
// class-cited. The asked reason = its first sebab key in BARIS_ROLES. Round = 5 questions; state in progress.json `baris`.
const BARIS_ROLES = [['mubtada', 'mubtada'], ['khabar', 'khabar'], ['khabar-depan', 'khabar muqaddam (khabar dibawa ke hadapan)'], ['mudaf-ilaih', 'mudaf ilaih'], ['majrur', 'selepas huruf jarr'], ['sifat', 'sifat (ikut mawsuf)'], ['badal', 'badal'], ['munada-depan', 'munada (yang dipanggil)']];
const ROLE_ALIAS = { mubtada: /^mubtada/, khabar: /^khabar$/, 'khabar-depan': /^khabar(di)?(depan|muqaddam)/, 'mudaf-ilaih': /^mu[dz]h?af(un)?ilaih/, majrur: /^(majrur|jarr?|hurufjarr?|selepashurufjarr?)/, sifat: /^sifat/, badal: /^badal/, 'munada-depan': /^munada/ };
const BARIS_WORDS = { depan: /^(depan|dhammah?|dammah?|dommah?)$/, atas: /^(atas|fathah?|fatha)$/, bawah: /^(bawah|kasrah?|kasra)$/ };
function barisOf(s) { const b = (s || '').toLowerCase(); if (/tetap|hujung|tiada|mati|wau/.test(b)) return null; for (const k of ['depan', 'atas', 'bawah']) if (b.startsWith(k)) return k; return null; }
function barisPool(S2) {
  if (!S2 || !Array.isArray(S2.sentences) || !S2.sebab) return { items: [], roles: [], lessons: [] };
  const roleKeys = BARIS_ROLES.map(r => r[0]); const per = [];
  for (const s of S2.sentences) {
    const mine = [];
    s.words.forEach((w, wi) => {
      const b = barisOf(w.baris); if (!b) return;
      if (!w.sebab.every(k => S2.sebab[k] && S2.sebab[k].cite)) return;   // learned-only: one uncited reason drops the word
      const role = w.sebab.find(k => roleKeys.includes(k)); if (!role) return;
      mine.push({ key: `${s.id}#${wi}`, s, w, baris: b, role });
    });
    per.push(mine);
  }
  const items = []; for (let r = 0; per.some(m => m.length > r); r++) for (const m of per) if (m[r]) items.push(m[r]);   // round-robin: spread the ayat
  return { items, roles: BARIS_ROLES.filter(r => items.some(i => i.role === r[0])), lessons: [...new Set(items.map(i => i.s.lesson))] };
}
function cmdBaris(date, arg) {
  const S2 = loadSentences(); const pool = barisPool(S2);
  if (!pool.items.length) return 'No baris questions: no class ayat with a class-cited reason yet.';
  const p = loadProgress(); const b = p.baris || (p.baris = { ptr: 0, round: 1, stats: {}, pending: null });
  if (arg && arg !== 'next') return 'Use: baris · baris next.';
  if (!(b.pending && b.pending.date === date && arg !== 'next')) {
    const st = k => b.stats[k] || { hit: 0, miss: 0 };
    const missed = pool.items.filter(i => st(i.key).miss > st(i.key).hit).slice(0, 2);
    const pick = [...missed];
    while (pick.length < Math.min(5, pool.items.length)) {
      const it = pool.items[b.ptr % pool.items.length]; b.ptr++;
      if (b.ptr >= pool.items.length) { b.ptr = 0; b.round++; }
      if (!pick.includes(it)) pick.push(it);
    }
    b.pending = { date, keys: pick.map(i => i.key), round: b.round };
    writeJson(PROGRESS, p);
  }
  const byKey = Object.fromEntries(pool.items.map(i => [i.key, i]));
  const qs = b.pending.keys.map(k => byKey[k]).filter(Boolean);
  return [`Baris drill · Lesson ${pool.lessons.join(', ')} · ${pool.items.length} words in the pool${b.pending.round > 1 ? ' · pusingan ' + b.pending.round : ''}`, '',
    '| # | Ayat | Kalimah | Makna ayat |', '|---|---|---|---|', ...qs.map((q, i) => `| ${i + 1} | ${q.s.ar} | ${q.w.ar} | ${q.s.ms} |`), '',
    '| No | Sebab |', '|---|---|', ...pool.roles.map((r, i) => `| ${i + 1} | ${r[1]} |`), '',
    'Jawab: baris (depan · atas · bawah) + no sebab, ikut nombor soalan. Contoh: 1 depan 1 · 2 bawah 4'].join('\n');
}
// Reply → groups {q, b, r}: each baris word anchors one answer; a number just before it = the question, a number (or a reason name) after it = the reason.
function barisGroups(text) {
  const toks = (text || '').toLowerCase().match(/[a-z]+|\d+/g) || []; const out = []; let free = null;
  const bw = t => Object.keys(BARIS_WORDS).find(k => BARIS_WORDS[k].test(t));
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (/^\d+$/.test(t)) { free = Number(t); continue; }
    const b = bw(t); if (!b) continue;
    let r = null; const name = [];
    if (i + 1 < toks.length && /^\d+$/.test(toks[i + 1])) { r = Number(toks[i + 1]); i++; }
    else {
      let j = i + 1;
      while (j < toks.length && !/^\d+$/.test(toks[j]) && (!bw(toks[j]) || (toks[j - 1] === 'di' && name.length))) name.push(toks[j++]);   // "khabar di depan" is one name
      if (name.length) { r = name.join(' '); i = j - 1; }
    }
    out.push({ q: free, b, r }); free = null;
  }
  return out;
}
function resolveBaris(p, text) {
  const S2 = loadSentences(); const pool = barisPool(S2); const byKey = Object.fromEntries(pool.items.map(i => [i.key, i]));
  const b = p.baris; const qs = b.pending.keys.map(k => byKey[k]).filter(Boolean);
  const groups = barisGroups(text); const ans = new Array(qs.length).fill(null);
  for (const g of groups) if (g.q && g.q >= 1 && g.q <= qs.length && !ans[g.q - 1]) ans[g.q - 1] = g;
  for (const g of groups) if (!(g.q && g.q >= 1 && g.q <= qs.length && ans[g.q - 1] === g)) { const k = ans.indexOf(null); if (k >= 0) ans[k] = g; }
  const roleOf = r => typeof r === 'number' ? (pool.roles[r - 1] || [])[0] : r ? Object.keys(ROLE_ALIAS).find(k => ROLE_ALIAS[k].test(r.replace(/\s/g, ''))) : null;
  let nb = 0, nr = 0; const rows = [];
  qs.forEach((q, i) => {
    const a = ans[i]; const label = BARIS_ROLES.find(r => r[0] === q.role)[1];
    if (!a) { rows.push(`| ${i + 1} | ${q.w.ar} | ${q.baris} · ${label} | ${S2.sebab[q.role].t} | tiada jawapan |`); return; }
    const st = b.stats[q.key] || (b.stats[q.key] = { hit: 0, miss: 0 });
    const okB = a.b === q.baris, okR = roleOf(a.r) === q.role; if (okB) nb++; if (okR) nr++;
    if (okB && okR) st.hit++; else st.miss++;
    const you = `${a.b}${okB ? ' ✓' : ' ✗'} · ${a.r == null ? 'tiada sebab' : typeof a.r === 'number' ? 'no ' + a.r : a.r}${okR ? ' ✓' : ' ✗'}`;
    rows.push(`| ${i + 1} | ${q.w.ar} | ${q.baris} · ${label} | ${S2.sebab[q.role].t} | ${you} |`);
  });
  b.pending = null; writeJson(PROGRESS, p);
  return [`Baris ${nb}/${qs.length} · sebab ${nr}/${qs.length}`, '', '| # | Kalimah | Jawapan | Sebab (dari kelas) | Kamu |', '|---|---|---|---|---|', ...rows, '', '"next" = 5 lagi.'].join('\n');
}
// ---------- live class (v1.5): continue where the class stopped ----------
// Stop point = the last position of the latest class day in the class log. Page files come from the lesson tables of
// source/ANALYSIS-book-*.md (a printed page maps to a file only inside a range whose file and printed spans match).
function lastClassStop() {
  const c = loadClass(); const ses = c.sessions.filter(s => s.positions && s.positions.length).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  const s = ses[ses.length - 1]; return s ? { date: s.date, stop: s.positions[s.positions.length - 1], closed: !!s.closed, notes: s.notes || [] } : null;
}
const SOURCE = process.env.ARABIC_SOURCE_DIR || path.join(DATA_DIR, '..', 'source');
function pageFiles(printed) {
  const ranges = [];
  try {
    for (const f of fs.readdirSync(SOURCE).filter(n => /^ANALYSIS-book.*\.md$/.test(n))) {
      const t = fs.readFileSync(path.join(SOURCE, f), 'utf8');
      for (const m of t.matchAll(/\|\s*p(\d{3})(?:\s*[-–]\s*p(\d{3}))?\s*\|\s*(\d+)(?:\s*[-–]\s*(\d+))?\s*\|/g)) {
        const fa = Number(m[1]), fb = Number(m[2] || m[1]), pa = Number(m[3]), pb = Number(m[4] || m[3]);
        if (fb - fa === pb - pa) ranges.push({ fa, pa, pb });
      }
    }
  } catch { return []; }
  return printed.map(n => { const r = ranges.find(x => n >= x.pa && n <= x.pb); return r ? `p${String(r.fa + n - r.pa).padStart(3, '0')}.png` : null; });
}
function cmdLive(date) {
  const last = lastClassStop();
  if (!last) return 'No class recorded yet. When the class starts, say where it is and it is kept with `class "<lesson + part + section, pages>"`.';
  const m = /(?:hlm\.?|pages?|halaman)\s*(\d+)(?:\s*[-–]\s*(\d+))?/i.exec(last.stop);
  const printed = m ? Array.from({ length: Number(m[2] || m[1]) - Number(m[1]) + 1 }, (_, i) => Number(m[1]) + i) : [];
  const files = pageFiles(printed);
  const pagesCell = printed.length ? `${printed.join(', ')} · ${files.map((f, i) => f ? 'source/pages/' + f : `page ${printed[i]}: no file mapped`).join(' · ')}` : 'not named in the stop point';
  const note = last.notes.filter(n => !/[؀-ۿ]/.test(n)).pop();
  return ['Class: continue where the class stopped', '', '| | |', '|---|---|',
    `| Class | ${last.date}${last.date === date ? ' (today)' : ''} · ${last.closed ? 'closed' : 'open'} |`,
    `| Stopped at | ${last.stop.replace(/\|/g, '/')} |`,
    `| Pages | ${pagesCell} |`,
    ...(note ? [`| Last note | ${note.replace(/\|/g, '/')} |`] : []), '',
    'Class-along: start from that section, one section per "next"; keep each section with `class "<lesson + part + section, pages>"`.'].join('\n');
}
function cmdNudge(date) {
  const words = readJson(WORDS, null); const p = readJson(PROGRESS, null);
  if (!words) return '';
  if (!p || p.week_start === null) return '📖 Arabic: not started · `/arabic`';
  if (mondayOf(date) !== p.week_start) return '📖 Arabic: new week · not yet today';
  const { done, todayDone } = statusLine(p, words, date);
  return `📖 Arabic: ${done}/5 reviews this week · ${todayDone ? 'done today' : 'not yet today'}`;
}

// ---------- Phase 3: revision modes (form drill · grammar-topic review · root family) ----------
// Difficulty gate: topics/paradigms unlock up to the class's reached position. class_position (set via
// `class`) names the current topic; if unset, everything is unlocked (the real class is at the end).
function topicCeiling(p, syll) {
  if (!syll) return Infinity;
  const cp = p.class_position && p.class_position.text ? p.class_position.text.toLowerCase() : '';
  if (!cp) return Infinity;
  let best = 0;
  for (const t of Object.values(syll)) {
    if (cp.includes(t.id) || cp.includes((t.name_ms || '').toLowerCase()) || (t.name_ar && cp.includes(t.name_ar))) best = Math.max(best, t.order);
  }
  return best || Infinity;
}
const PERSON = { 1: '1st-person (aku/kami)', 2: '2nd-person (kamu)', 3: '3rd-person (dia/mereka)' };
const GENDER = { m: 'male', f: 'female', c: '' };
const NUMBER = { sing: 'singular', dual: 'dual (2)', plur: 'plural' };
const DIST = { near: 'near (this)', far: 'far (that)' };
function slotDesc(pid, f) {
  if (pid === 'nombor') return `number ${f.n} (masculine form)`;
  const parts = [];
  if (f.person) parts.push(PERSON[f.person]);
  if (f.distance) parts.push(DIST[f.distance]);
  if (f.gender && f.gender !== 'c') parts.push(GENDER[f.gender]);
  if (f.number) parts.push(NUMBER[f.number]);
  return parts.join(' ');
}
function formExpected(pid, f) { return pid === 'nombor' ? f.cardinal_m : (f.ar || f.example); }

function cmdTopic(arg, date) {
  const syll = loadSyllabus();
  if (!syll) return 'No syllabus.json — run Phase 1 build first.';
  const list = Object.values(syll).sort((a, b) => a.order - b.order);
  if (arg === 'list') return list.map(t => `${t.order}. ${t.id} — ${t.name_ms}`).join('\n');
  let t = null;
  if (arg) t = syll[arg] || list.find(x => (x.name_ms || '').toLowerCase().includes(arg.toLowerCase()));
  if (!t) { const ceil = topicCeiling(loadProgress(), syll); const elig = list.filter(x => x.order <= ceil && x.rules.length); t = elig[hashDate(date) % elig.length]; }
  if (!t) return `No topic "${arg}". Try \`topic list\`.`;
  const out = [`Topic ${t.order}: ${t.name_ms}${t.name_ar ? ' (' + t.name_ar + ')' : ''} — ${t.concept}`];
  if (t.summary) out.push(t.summary);
  for (const r of t.rules) out.push(`• ${r.text}`);
  for (const e of t.examples) out.push(`  ${e.ar} — ${e.ms}`);
  out.push(`Classes: ${t.classes.join(', ') || '—'}${t.revised_in.length ? ' · revised ' + t.revised_in.join(', ') : ''}`);
  return out.join('\n');
}
function cmdRoot(arg, date) {
  const r = loadRoots();
  if (!r) return 'No roots.json — run Phase 2 build first.';
  const fams = r.families;
  if (arg === 'list') return fams.map(f => `${f.root} — ${f.gloss}`).join('\n');
  let fam = null;
  if (arg) { const a = arg.replace(HARAKAT, ''); fam = fams.find(f => f.root === a) || fams.find(f => f.variants.some(v => arabicSkeleton(v.ar) === arabicSkeleton(arg))); }
  if (!fam) fam = fams[hashDate(date) % fams.length];
  const out = [`Root ${fam.root} — ${fam.gloss}:`];
  for (const v of fam.variants) out.push(`• ${v.ar} = ${v.ms} (${v.pos})`);
  out.push('Same 3 letters, different harakat → different meaning.');
  return out.join('\n');
}
function cmdForm(arg, date) {
  const par = loadParadigms();
  if (!par) return 'No paradigms.json — run Phase 2 build first.';
  const ids = Object.keys(par);
  if (arg === 'list') return ids.map(id => `${id} — ${par[id].name_ms}`).join('\n');
  const p = loadProgress();
  let pid = arg && par[arg] ? arg : null;
  if (!pid) {
    const syll = loadSyllabus(); const ceil = topicCeiling(p, syll);
    const elig = ids.filter(id => { const top = syll && syll[par[id].topic]; return !top || top.order <= ceil; });
    const pool = elig.length ? elig : ids; pid = pool[hashDate(date) % pool.length];
  }
  const pdef = par[pid]; const forms = pdef.forms;
  const f = forms[hashDate(date + pid) % forms.length];
  const expected = formExpected(pid, f); const desc = slotDesc(pid, f);
  const base = pdef.exemplar ? ` of ${pdef.exemplar}` : (pid === 'dhamir-muttasil' ? ' on طَالِب' : '');
  p.form_pending = { paradigm: pid, expected, desc };
  writeJson(PROGRESS, p);
  return `Form drill — ${pdef.name_ms}\nGive the ${desc}${base} → Arabic?`;
}
function resolveForm(p, text) {
  const fp = p.form_pending; let verdict = match(text, fp.expected);
  if (verdict === 'near') {   // guard: a form target can be a short all-weak word; reject a degenerate near
    const ansSk = /[؀-ۿ]/.test(text) ? arabicSkeleton(text) : translitToSkeleton(text);
    const tgtSk = arabicSkeleton(fp.expected);
    if (ansSk.length < 2 || ansSk.length < tgtSk.length - 1) verdict = 'miss';
  }
  p.form_pending = null;
  if (!p.form_stats) p.form_stats = { hit: 0, miss: 0 };
  if (verdict === 'miss') p.form_stats.miss++; else p.form_stats.hit++;
  writeJson(PROGRESS, p);
  return verdict === 'hit' ? `✓ ${fp.expected}` : verdict === 'near' ? `~ ${fp.expected} (you: ${text})` : `✗ ${fp.expected} (you: ${text})`;
}
// drill = difficulty-aware picker: word recall early, then root/topic, then form drills once the
// vocabulary review reaches the attached-pronoun/verb lessons (book lesson >= 10).
function cmdDrill(date) {
  const p = loadProgress(); const syll = loadSyllabus(); const par = loadParadigms(); const roots = loadRoots();
  let lesson = 1;
  try { const words = loadWords(); const all = chunks(words); const set = activeSet(all, Math.min(p.set_index || 0, all.length - 1)); lesson = set.lessonTo; } catch {}
  const modes = ['word'];
  if (roots) modes.push('root');
  if (syll) modes.push('topic');
  if (par && lesson >= 10) modes.push('form');
  const mode = modes[hashDate(date) % modes.length];
  if (mode === 'root') return 'DRILL (root) — ' + cmdRoot(null, date);
  if (mode === 'topic') return 'DRILL (topic) — ' + cmdTopic(null, date);
  if (mode === 'form') return 'DRILL (form) — ' + cmdForm(null, date);
  return 'DRILL (word) — run `/arabic` for today\'s word recall.';
}

// ---------- Phase 4: freshness / sync (manifest state; enumeration is a documented human/browser step) ----------
function cmdSync() {
  const classes = readJson(path.join(DATA_DIR, 'classes.json'), null);
  if (!classes) return 'No classes.json — run Phase 1 build first.';
  const ids = Object.keys(classes).sort();
  const last = classes[ids[ids.length - 1]];
  const withBook = ids.filter(k => classes[k].book_lesson).length;
  return [`Syllabus manifest: ${ids.length} classes · latest = ${last.nn} (${last.date}) "${last.title}" · ${withBook} book-tagged.`,
    `New class? Drive folder enumeration is not automatable (owner-shared folder is not searchable via the Drive API, verified twice). To ingest one, follow library/sync.md: get its file id, then run the download+transcribe pipeline and re-run the Phase-1 finalize.`].join('\n');
}

// ---------- class session: log, revision asks, class vocabulary, save check (v1.3, 2026-10-13) ----------
// class.json = { sessions: [{ date, positions[], notes[], closed }], revise: [{ id, added, text, lesson, part, done, goal, cleared }] }
// A revision ask is cleared by AMOUNT (ayat walked), never by date. The save check is what lib/save-rules.js runs at Domain Expansion.
function loadClass() { const c = readJson(CLASSLOG, null) || {}; return { sessions: Array.isArray(c.sessions) ? c.sessions : [], revise: Array.isArray(c.revise) ? c.revise : [] }; }
function sessionFor(c, date, create) {
  let s = c.sessions.find(x => x.date === date);
  if (!s && create) { s = { date, positions: [], notes: [], closed: null }; c.sessions.push(s); }
  return s;
}
function journalLine(c, s) {
  const asks = c.revise.filter(r => r.added === s.date).map(r => r.text);
  return `- ${s.date} class: stopped at ${s.positions[s.positions.length - 1]}. Worked: ${[...new Set(s.positions)].join(' → ')}. Notes: ${s.notes.join(' | ') || 'none'}. Revision asks: ${asks.join(' | ') || 'none'}.`;
}
function writeJournal(line, date) {
  let t; try { t = fs.readFileSync(JOURNAL, 'utf8'); } catch { return false; }
  const lines = t.split(/\r?\n/); const mark = `- ${date} class: `;
  const at = lines.findIndex(l => l.startsWith(mark));
  if (at >= 0) lines[at] = line;
  else {
    const h = lines.findIndex(l => /^##\s+Progress\b/.test(l));
    if (h < 0) lines.push('', '## Progress', line);
    else { let end = lines.findIndex((l, i) => i > h && /^##\s/.test(l)); if (end < 0) end = lines.length; while (end > h + 1 && !lines[end - 1].trim()) end--; lines.splice(end, 0, line); }
  }
  fs.writeFileSync(JOURNAL, lines.join('\n'), 'utf8'); return true;
}
function cmdClass(text, date) {
  const c = loadClass();
  if (!text) { const s = sessionFor(c, date); const p = loadProgress(); return `Class position: ${p.class_position ? p.class_position.text + ' (' + p.class_position.set + ')' : 'none'}${s ? ` · today: ${s.positions.length} position(s), ${s.notes.length} note(s), ${s.closed ? 'closed' : 'open'}` : ''}`; }
  if (text === 'close') {
    const s = sessionFor(c, date);
    if (!s || !s.positions.length) return '✗ No class position recorded today. Run `class "<where we stopped>"` first.';
    const line = journalLine(c, s);
    if (!writeJournal(line, date)) return `✗ Journal file not found: ${JOURNAL}`;
    s.closed = new Date().toISOString(); writeJson(CLASSLOG, c);
    return `Class ${date} closed. Journal line written:\n${line}`;
  }
  const p = loadProgress(); p.class_position = { text, set: date }; writeJson(PROGRESS, p);
  const s = sessionFor(c, date, true); s.positions.push(text); s.closed = null; writeJson(CLASSLOG, c);
  return `Class position noted: ${text}`;
}
function cmdNote(text, date) {
  if (!text) return 'Usage: note "<what was discussed>"';
  const c = loadClass(); const s = sessionFor(c, date, true); s.notes.push(text); s.closed = null; writeJson(CLASSLOG, c);
  return `Class note saved (${s.notes.length} today): ${text}`;
}
const REVISE_GOAL = 7;   // a week's worth of exercises; raised to the ayat count when an ask is linked to a longer class part
function cmdRevise(args, date) {
  const c = loadClass(); const sub = args[0];
  const open = () => c.revise.filter(r => !r.cleared);
  const row = r => `#${r.id} · ${r.text} · ${r.lesson == null ? 'not built yet' : `Lesson ${r.lesson}${r.part ? ' ' + r.part : ''} · ${r.done}/${r.goal}`}`;
  if (!sub || sub === 'list') return open().length ? open().map(row).join('\n') : `No open revision ask. Cleared: ${c.revise.filter(r => r.cleared).length}.`;
  if (sub === 'add') {
    const text = args.slice(1).join(' '); if (!text) return 'Usage: revise add "<what to revise>"';
    const r = { id: c.revise.reduce((m, x) => Math.max(m, x.id), 0) + 1, added: date, text, lesson: null, part: null, done: 0, goal: REVISE_GOAL, cleared: null };
    c.revise.push(r); const s = sessionFor(c, date); if (s) s.closed = null; writeJson(CLASSLOG, c);
    return `Revision ask saved: ${row(r)}`;
  }
  const r = c.revise.find(x => String(x.id) === String(args[1]));
  if ((sub === 'link' || sub === 'goal') && !r) return `No revision ask #${args[1]}.`;
  if (sub === 'link') {
    const lesson = Number(args[2]); const part = args[3] || null; const S2 = loadSentences();
    const n = S2 && Array.isArray(S2.sentences) ? S2.sentences.filter(s => s.lesson === lesson && (!part || s.part === part)).length : 0;
    if (!Number.isInteger(lesson) || !n) return `No ayat entered for lesson ${args[2]}${part ? ' ' + part : ''}: build them first.`;
    r.lesson = lesson; r.part = part; r.goal = Math.max(REVISE_GOAL, n); writeJson(CLASSLOG, c);
    return `Linked: ${row(r)} (${n} ayat)`;
  }
  if (sub === 'goal') {
    const n = Number(args[2]); if (!Number.isInteger(n) || n < 3 || n > 60) return 'goal must be a whole number 3–60.';
    r.goal = n; if (r.done >= r.goal) r.cleared = date; writeJson(CLASSLOG, c); return row(r);
  }
  return 'Use: revise · revise add "<text>" · revise link <id> <lesson> [part] · revise goal <id> <n>.';
}
// One ayat walked = one exercise for every open ask linked to that class part.
function countRevise(s, date) {
  const c = loadClass(); const out = [];
  for (const r of c.revise) {
    if (r.cleared || r.lesson !== s.lesson || (r.part && r.part !== s.part)) continue;
    r.done++; if (r.done >= r.goal) r.cleared = date;
    out.push(`Ulang kaji #${r.id}: ${r.done}/${r.goal}${r.cleared ? ' · selesai' : ''}`);
  }
  if (out.length) writeJson(CLASSLOG, c);
  return out;
}
function cmdSaveCheck(date) {
  const c = loadClass(); const p = loadProgress(); const s = sessionFor(c, date);
  if (!s && !(p.class_position && p.class_position.set === date)) return '✓ no class today';
  const bad = [];
  if (!s || !s.positions.length) bad.push('class position not in the class log (run `class "<where we stopped>"`)');
  else if (!s.closed) bad.push('class not closed (run `class close`)');
  let j = ''; try { j = fs.readFileSync(JOURNAL, 'utf8'); } catch {}
  if (!j.split(/\r?\n/).some(l => l.startsWith(`- ${date} class: `))) bad.push('no journal line dated today in arabic.md');
  if (bad.length) return `✗ class ${date} not saved: ${bad.join('; ')}`;
  const open = c.revise.filter(r => !r.cleared);
  return `✓ class ${date} saved · stopped at: ${s.positions[s.positions.length - 1]} · notes ${s.notes.length} · revision asks open ${open.length} (not built ${open.filter(r => r.lesson == null).length})`;
}
// Class vocabulary: the teacher's own Malay for a word, where it differs from the engine's. class-vocab.json = { habits: [{ t, cite }], words: [{ ar, kelas, lain, cite, forms[] }] }
function cmdGloss(text) {
  const v = readJson(VOCAB, null);
  if (!v || !Array.isArray(v.words)) return 'No class-vocab.json yet.';
  const habits = (v.habits || []).map(h => `• ${h.t} (${h.cite})`);
  const tbl = ws => ['| Arab | Makna kelas | Makna lain | Sumber |', '|---|---|---|---|', ...ws.map(w => `| ${w.ar} | ${w.kelas} | ${w.lain || ''} | ${w.cite} |`)];
  if (!text) return [`Class vocabulary: ${v.words.length} words · ${habits.length} habits. \`gloss all\` lists them; \`gloss <arabic text>\` finds the class words in a text.`, ...habits].join('\n');
  if (text === 'all') return [...tbl(v.words), ...habits].join('\n');
  const toks = new Set(text.split(/[^ء-ْٰـ]+/).filter(Boolean).flatMap(t => { const k = arabicSkeleton(t); return [k, k.replace(/^[وفبلك]/, '').replace(/^ال/, '')]; }));
  const hit = v.words.filter(w => [w.ar, ...(w.forms || [])].some(f => toks.has(arabicSkeleton(f))));
  return hit.length ? [...tbl(hit), ...habits].join('\n') : ['No class word in this text.', ...habits].join('\n');
}

// ---------- main ----------
function main(argv) {
  const args = argv.slice(2); const di = args.indexOf('--date'); let date = null;
  if (di >= 0) { date = args[di + 1]; args.splice(di, 2); }
  date = today(date);
  const cmd = args[0] || 'review';
  const t0 = Date.now(); let out;
  switch (cmd) {
    case 'review': case 'words': out = cmdReview(date, args[1] === 'next'); break;
    case 'mode': out = cmdMode(args.slice(1), date); break;
    case 'next': out = cmdNext(date); break;
    case 'answer': out = cmdAnswer(args.slice(1).join(' '), date); break;
    case 'more': out = cmdMore(); break;
    case 'week': out = cmdWeek(args[1], date); break;
    case 'class': out = cmdClass(args.slice(1).join(' '), date); break;
    case 'note': out = cmdNote(args.slice(1).join(' '), date); break;
    case 'revise': out = cmdRevise(args.slice(1), date); break;
    case 'save-check': out = cmdSaveCheck(date); break;
    case 'gloss': out = cmdGloss(args.slice(1).join(' ')); break;
    case 'status': out = cmdStatus(date); break;
    case 'settings': out = cmdSettings(args[1], args[2]); break;
    case 'stats': out = cmdStats(); break;
    case 'topic': out = cmdTopic(args[1], date); break;
    case 'root': out = cmdRoot(args[1], date); break;
    case 'form': out = cmdForm(args[1], date); break;
    case 'drill': out = cmdDrill(date); break;
    case 'sync': out = cmdSync(); break;
    case 'nudge': out = cmdNudge(date); break;
    case 'focus': out = cmdFocus(args[1], args[2], date); break;
    case 'sentence': out = cmdSentence(args[1], date); break;
    case 'daily': out = cmdDaily(date); break;
    case 'baris': out = cmdBaris(date, args[1]); break;
    default: out = `Unknown command ${cmd}`;
  }
  if (cmd !== 'nudge') logRow({ cmd, date, arg: args.slice(1).join(' ') || undefined, outcome: (out || '').split('\n')[0].slice(0, 80), dur_ms: Date.now() - t0 });
  return out;
}
if (require.main === module) { const out = main(process.argv); if (out) process.stdout.write(out + '\n'); if (process.argv[2] === 'save-check' && /^✗/.test(out || '')) process.exitCode = 1; }
module.exports = { main, match, chunks, mondayOf, translitToSkeleton, arabicSkeleton, modeFor, DATA_DIR, slotDesc, formExpected, topicCeiling };
