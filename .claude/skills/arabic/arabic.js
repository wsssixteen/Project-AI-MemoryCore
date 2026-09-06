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
 *   node arabic.js class <text>                   record class position (informational)
 *   node arabic.js status                         one status line
 *   node arabic.js settings [key value]           show/set: words · pace · min_reviews · set_max
 *   node arabic.js stats                          weekly table + mastery (observability)
 *   node arabic.js nudge                          one boot line or nothing
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
function cmdReview(date) {
  const words = loadWords(); const p = loadProgress();
  const set = rollIfNeeded(p, words, date);
  const existing = reviewsThisWeek(p).find(r => r.date === date);
  let n, five, recall, mode;
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
  const words = loadWords(); const p = loadProgress();
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
  writeJson(PROGRESS, p);
  const name = set.lessonTo !== set.lesson ? `Lessons ${set.lesson}–${set.lessonTo}` : `Lesson ${set.lesson}${set.of > 1 ? ' (' + set.chunk + '/' + set.of + ')' : ''}`;
  return `Week set → ${name} (${set.ids.length} words).`;
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
function cmdClass(text) { const p = loadProgress(); p.class_position = { text, set: today() }; writeJson(PROGRESS, p); return `Class position noted: ${text}`; }
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
  return `Week ${weekNo} · ${lesson} · ${done}/5 reviews · misses: ${misses} · next roll Mon`;
}
function cmdNudge(date) {
  const words = readJson(WORDS, null); const p = readJson(PROGRESS, null);
  if (!words) return '';
  if (!p || p.week_start === null) return '📖 Arabic: not started · `/arabic`';
  if (mondayOf(date) !== p.week_start) return '📖 Arabic: new week · not yet today';
  const { done, todayDone } = statusLine(p, words, date);
  return `📖 Arabic: ${done}/5 reviews this week · ${todayDone ? 'done today' : 'not yet today'}`;
}

// ---------- main ----------
function main(argv) {
  const args = argv.slice(2); const di = args.indexOf('--date'); let date = null;
  if (di >= 0) { date = args[di + 1]; args.splice(di, 2); }
  date = today(date);
  const cmd = args[0] || 'review';
  const t0 = Date.now(); let out;
  switch (cmd) {
    case 'review': out = cmdReview(date); break;
    case 'answer': out = cmdAnswer(args.slice(1).join(' '), date); break;
    case 'more': out = cmdMore(); break;
    case 'week': out = cmdWeek(args[1], date); break;
    case 'class': out = cmdClass(args.slice(1).join(' ')); break;
    case 'status': out = cmdStatus(date); break;
    case 'settings': out = cmdSettings(args[1], args[2]); break;
    case 'stats': out = cmdStats(); break;
    case 'nudge': out = cmdNudge(date); break;
    default: out = `Unknown command ${cmd}`;
  }
  if (cmd !== 'nudge') logRow({ cmd, date, arg: args.slice(1).join(' ') || undefined, outcome: (out || '').split('\n')[0].slice(0, 80), dur_ms: Date.now() - t0 });
  return out;
}
if (require.main === module) { const out = main(process.argv); if (out) process.stdout.write(out + '\n'); }
module.exports = { main, match, chunks, mondayOf, translitToSkeleton, arabicSkeleton, modeFor, DATA_DIR };
