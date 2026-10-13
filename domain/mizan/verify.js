#!/usr/bin/env node
// mizan verify — the part of Mizan that reads the sources itself. For every evidence item of every question in a case file:
//   - a Quran item carries only a reference; its Arabic and its translation are fetched from quran.com by that reference
//   - any other item carries a quote and the address of the page it was copied from; the page is fetched and the quote is searched for
//   - the words before and after the quote, and any words the quote skips, are recorded, so a second reader can judge the meaning
//   - a negation, a limiting word or a "they say" standing near the quote is flagged for that reader
//   - the name the page (or the library's catalogue) gives the work is recorded, so a quote cannot be hung on the wrong author
//   - a hadith page's gradings are recorded; every redirect is followed by hand and recorded
// For every roadblock: the report's own words are searched on the reporting page, the words that were sought must be words the
// report itself quotes, every listed search address is fetched, and the libraries are searched by the script for those words.
// A hit means it was never a roadblock.
// A quote counts as found when its words are on the page in the same order. Vowel marks, punctuation, spacing and letter case are ignored.
// Results are written back into the file; lib/mizan.js check reads the sources again itself before it accepts them.
// Usage: node domain/mizan/verify.js <case.json> [--only <id prefix>] [--dry]
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { sign, signRb, found, RULES, banned, primary, hostsIn } = require(path.join(__dirname, '..', '..', 'lib', 'mizan.js'));

const TRANSLATION = { id: 20, name: 'Saheeh International' };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const UA_PLAIN = 'mizan-verify/1 (a script that reads the page a second time, as a reader that is not a browser)';
// The library whose catalogue says whose book a page is. (Another address is taken only under test, like --recorded and --today.)
const TURATH = (process.env.MIZAN_TEST === '1' && process.env.MIZAN_TURATH) || 'https://api.turath.io';
const SPEAKERS = ['scholar', 'advocate'];
const CONTEXT_WORDS = 45;

// ---------- text ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
function decode(s) {
  return s.replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in ENT ? ENT[n.toLowerCase()] : m));
}
// What a page does not show its reader is not the page's words: an element that is hidden, struck through, or made invisible
// by its own style or by a class to which the page's own style block gives such a style. (A style sheet in another file is not
// read, and neither is text coloured like its background.)
const UNSEEN = /display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0(?![\d.])|opacity\s*:\s*0(?![\d.])/i;
const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
function unseenClasses(h) {
  const out = new Set();
  for (const s of h.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    // (what a page hides only on paper is shown on the screen)
    const css = s[1].replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/@media[^{]*\bprint\b[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/gi, ' ');
    for (const r of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (UNSEEN.test(r[2])) for (const sel of r[1].split(',')) { const m = /^\s*[a-z0-9]*\.([\w-]+)\s*$/i.exec(sel); if (m) out.add(m[1].toLowerCase()); }
  }
  return out;
}
// The page without the elements a reader is not shown. An element that is never closed takes the rest of the page with it:
// better a quote not found than a hidden one found.
function shown(h, classes) {
  const re = /<(\/?)([a-zA-Z][\w:-]*)\b([^>]*)>/g, out = [];
  let m, at = 0, hide = null;
  while ((m = re.exec(h))) {
    const close = m[1] === '/', tag = m[2].toLowerCase(), attrs = m[3], single = /\/\s*$/.test(attrs);
    if (hide) { if (tag === hide.tag) { if (!close) { if (!single) hide.depth++; } else if (--hide.depth === 0) { at = re.lastIndex; hide = null; } } continue; }
    if (close || single || VOID.test(tag)) continue;
    const bare = attrs.replace(/"[^"]*"|'[^']*'/g, '""'), cls = (/\sclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs) || []).slice(1).join(' '), style = (/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs) || []).slice(1).join(' ');
    if (/^(del|s|strike)$/.test(tag) || /\shidden(?=\s|=|$)/i.test(bare) || /\saria-hidden\s*=\s*["']?true/i.test(attrs) || UNSEEN.test(style) || cls.toLowerCase().split(/\s+/).some(c => classes.has(c))) { out.push(h.slice(at, m.index)); hide = { tag, depth: 1 }; }
  }
  if (!hide) out.push(h.slice(at));
  return out.join(' ');
}
function stripHtml(h) {
  return decode(shown(h.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' '), unseenClasses(h)).replace(/<[^>]+>/g, ' '));
}
function strings(v, out) {
  if (typeof v === 'string') { const t = v.trim(); if (t[0] === '{' && t[t.length - 1] === '}') { try { strings(JSON.parse(t), out); return out; } catch (e) { /* plain text */ } } out.push(v); }
  else if (Array.isArray(v)) v.forEach(x => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out));
  return out;
}
function asJson(body) { const t = body.trim(); if (t[0] !== '{' && t[0] !== '[') return null; try { return JSON.parse(t); } catch (e) { return null; } }
function pageText(body) {
  const j = asJson(body);
  return stripHtml(j ? strings(j, []).join(' \n ') : body);
}
// The character sets are built from code points, so this file holds no invisible character that an editor could lose.
const cc = pairs => pairs.map(([x, y]) => String.fromCharCode(x) + (y ? '-' + String.fromCharCode(y) : '')).join('');
const MARKS = new RegExp('[' + cc([[0x610, 0x61A], [0x64B, 0x652], [0x656, 0x65F], [0x670], [0x640], [0x6D6, 0x6ED], [0x200B, 0x200F], [0x202A, 0x202E], [0x2066, 0x2069], [0xFEFF]]) + ']', 'g');
const ALEF_WASLA = new RegExp(String.fromCharCode(0x671), 'g'), ALEF = String.fromCharCode(0x627);
const ALEF_MAQSURA = new RegExp(String.fromCharCode(0x649), 'g'), YA = String.fromCharCode(0x64A);
const ACCENTED = new RegExp('[' + cc([[0xC0, 0x24F], [0x1E00, 0x1EFF]]) + ']', 'g');
const ARABIC = new RegExp('[' + cc([[0x600, 0x6FF]]) + ']');
const STOP = new RegExp('[.!?:;' + String.fromCharCode(0x61F, 0x61B, 0x6D4) + ']["”»)]*$');   // a word that ends a sentence, in either script
// One spelling for every way a page may write the same words: vowel marks, punctuation, spacing, case and Latin accents are ignored.
// Arabic letters are never merged: a closed ta is not a ha and a hamza keeps its seat, because those can change the meaning.
function norm(s) {
  return String(s || '').normalize('NFKC').replace(MARKS, '').replace(ALEF_WASLA, ALEF).replace(ALEF_MAQSURA, YA)
    .replace(ACCENTED, ch => ch.normalize('NFKD').replace(/\p{M}/gu, ''))
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
const count = t => String(t || '').trim().split(/\s+/).filter(Boolean).length;
// A page as two lists that run side by side: the words as written (for a reader) and the same words in one spelling (for the search).
function model(body) {
  const tok = pageText(body).split(/\s+/).filter(Boolean), words = [], back = [], starts = [];
  let at = 0;
  tok.forEach((t, i) => { for (const w of norm(t).split(' ')) if (w) { words.push(w); back.push(i); starts.push(at); at += w.length + 1; } });
  return { tok, words, back, starts, text: words.join(' ') };
}
function wordAt(page, ch) { let lo = 0, hi = page.starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (page.starts[mid] <= ch) lo = mid; else hi = mid - 1; } return lo; }
// True when word i is the last word of a sentence as the page punctuates it.
const endsSentence = (page, i) => i >= 0 && i < page.words.length && page.back[i] !== page.back[i + 1] && STOP.test(page.tok[page.back[i]]);
const written = (page, a, b) => (a > b || b < 0 || a >= page.words.length ? '' : page.tok.slice(page.back[Math.max(0, a)], page.back[Math.min(page.words.length - 1, b)] + 1).join(' '));

const pieces = q => String(q || '').split(/\s*(?:\[\s*(?:\.\.\.|…)\s*\]|\.\.\.+|…)\s*/).map(norm).filter(Boolean);
const set = list => new Set(list.map(norm));
const NEGATION = set(['not', 'no', 'never', 'neither', 'nor', 'cannot', 'without', 'hardly', 'unless', 'except',
  'لا', 'ما', 'لم', 'لن', 'ليس', 'ليست', 'ليسوا', 'لست', 'غير', 'بلا', 'دون', 'ولا', 'فلا', 'وما', 'فما', 'ولم', 'فلم', 'ولن', 'فلن', 'وليس', 'فليس', 'إلا', 'سوى', 'لولا']);
const EXCEPTION = set(['except', 'unless', 'إلا', 'سوى']);
const DENIAL = set(['false', 'untrue', 'myth', 'wrongly', 'erroneously', 'mistaken', 'baseless', 'باطل', 'خطأ', 'غلط', 'مردود', 'وهم']);
const SAID = ['said', 'says', 'writes', 'wrote', 'according to', 'narrated', 'asked', 'قال', 'فقال', 'وقال', 'قالت', 'يقول', 'سئل', 'وسئل', 'حكى', 'روى', 'ذكر', 'نقل'].map(norm);
const LIMITER = set(['rather', 'بل', 'but', 'however', 'although', 'though', 'yet', 'except', 'unless', 'nevertheless', 'لكن', 'ولكن', 'لكنه', 'ولكنه', 'لكنها', 'إلا', 'سوى', 'بيد', 'غير']);
const REPORTED = ['it is said', 'it was said', 'if it is said', 'it has been claimed', 'it is claimed', 'critics say', 'critics claim', 'critics argue', 'some say', 'some claim', 'some argue', 'they say', 'they claim', 'opponents say', 'objectors say', 'allegedly', 'the claim that', 'the objection that',
  'فإن قيل', 'فان قيل', 'وإن قيل', 'قيل', 'زعم', 'زعموا', 'يزعم', 'يزعمون', 'قالوا', 'يقولون', 'فإن قال', 'فإن قالوا', 'شبهة', 'الشبهة', 'ادعى', 'يدعي', 'يدعون', 'احتجوا', 'واحتج'].map(norm);
const MAX_GAP = 1200;
// Returns { miss } when the quote is not on the page as given, otherwise { spans } : where each piece sits, in order.
function locate(quote, page) {
  let from = 0;
  const padded = ' ' + page.text + ' ', spans = [];
  for (const p of pieces(quote)) {
    let at = padded.indexOf(' ' + p + ' ', from);
    // Arabic writes "and" (و) and "so" (ف) joined to the next word; a quote that starts at the word itself is still that sentence.
    if (at < 0) for (const lead of ['و', 'ف']) { const k = padded.indexOf(' ' + lead + p + ' ', from); if (k >= 0) { at = k; break; } }
    if (at < 0) {
      if (from > 0 && padded.indexOf(' ' + p + ' ') >= 0) return { miss: 'the piece "' + p.split(' ').slice(0, 5).join(' ') + '…" is on the page, but before the piece quoted ahead of it: the pieces are out of order' };
      if (page.text.includes(p)) return { miss: 'the words are on the page only inside longer words: the quote begins or ends in the middle of a word ("' + p.split(' ').slice(0, 3).join(' ') + ' … ' + p.split(' ').slice(-3).join(' ') + '")' };
      const w = p.split(' ');
      let lo = 0, hi = w.length;
      while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (page.text.includes(w.slice(0, mid).join(' '))) lo = mid; else hi = mid - 1; }
      return { miss: 'first ' + lo + ' of ' + w.length + ' words match; it stops at "' + w.slice(Math.max(0, lo - 2), lo + 3).join(' ') + '"' };
    }
    const end = padded.indexOf(' ', at + 1 + p.length);
    const first = wordAt(page, at), last = wordAt(page, Math.max(at, end - 2));
    // A quote may not be cut so that the cut changes what it says.
    const prev = page.words[first - 1] || '', prev2 = page.words[first - 2] || '', next = page.words[last + 1] || '';
    if (!endsSentence(page, first - 1) && (NEGATION.has(prev) || (prev === 't' && /n$/.test(prev2)))) return { miss: 'on the page the quote is preceded by "' + prev + '", which denies or limits it: the quote must include it' };
    if (!endsSentence(page, last) && EXCEPTION.has(next)) return { miss: 'on the page the quote is followed by "' + next + '", which limits it: the quote must include what follows' };
    if (spans.length && at - from > MAX_GAP) return { miss: 'two pieces of the quote are ' + (at - from) + ' characters apart on the page: too far to be one quotation; give them as separate items' };
    spans.push([first, last]);
    from = Math.max(at + 1, end);
  }
  return spans.length ? { spans } : { miss: 'the quote is empty' };
}
// What stands around the quote on the page, in the page's own writing, and what in it a reader must look at.
function around(page, spans) {
  const first = spans[0][0], last = spans[spans.length - 1][1], skipped = [], flags = [];
  for (let i = 1; i < spans.length; i++) { const t = written(page, spans[i - 1][1] + 1, spans[i][0] - 1); if (t) skipped.push(t.length > 700 ? t.slice(0, 340) + ' [...' + count(t) + ' words in all...] ' + t.slice(-340) : t); }
  // Back through the same sentence: a negation a few words earlier can turn the quote around.
  for (let i = first - 1, n = 0; i >= 0 && n < 9; i--, n++) { if (endsSentence(page, i)) break; if (i < first - 1 && NEGATION.has(page.words[i])) { flags.push('"' + page.words[i] + '" stands ' + (first - i) + ' words before the quote, in the same sentence'); break; } }
  // Forward through the same sentence: a "but" or an "except" can take back what the quote says.
  if (!endsSentence(page, last)) for (let i = last + 1, n = 0; i < page.words.length && n < 12; i++, n++) { if (LIMITER.has(page.words[i])) { flags.push('the sentence goes on after the quote with "' + page.words[i] + '"'); break; } if (endsSentence(page, i)) break; }
  const lead = ' ' + page.words.slice(Math.max(0, first - 30), first).join(' ') + ' ';
  const said = REPORTED.find(m => lead.includes(' ' + m + ' '));
  if (said) flags.push('"' + said + '" stands before the quote: the author may be reporting what others say');
  const just = ' ' + page.words.slice(Math.max(0, first - 10), first).join(' ') + ' ', told = SAID.find(m => just.includes(' ' + m + ' '));
  if (told && !said) flags.push('"' + told + '" stands just before the quote: these may be the words of someone the author quotes');
  for (let i = last + 1, n = 0; i < page.words.length && n < 14; i++, n++) if (DENIAL.has(page.words[i])) { flags.push('"' + page.words[i] + '" stands ' + (i - last) + ' words after the quote: the author may be rejecting it'); break; }
  return { before: written(page, first - CONTEXT_WORDS, first - 1), after: written(page, last + 1, last + CONTEXT_WORDS), skipped, flags, near: norm(written(page, first - 80, first - 1) + ' ' + written(page, last + 1, last + 40)) };
}
// A page of search results proves that words exist somewhere, not that a work says them.
const isSearchPage = url => { let u = String(url || ''); for (let i = 0; i < 3; i++) { try { const d = decodeURIComponent(u); if (d === u) break; u = d; } catch (e) { break; } } return /[?&](q|query|s|search|keyword|kw|searchtxt|srsearch|skey|user_query)=/i.test(u) || /\/search(\/|\?|$)/i.test(u) || /fulltext\.search/i.test(u) || new RegExp('(special|' + String.fromCharCode(0x62E, 0x627, 0x635) + ')\\s*:\\s*(search|' + String.fromCharCode(0x628, 0x62D, 0x62B) + ')', 'i').test(u) || /[?&]title=special/i.test(u); };
// An address that carries the quote in itself can make a page repeat it back.
// In a library's own address the path is the title of the chapter, so only what follows the "?" or "#" is tested there.
function echoes(url, quote) {
  let u = String(url || ''); try { u = decodeURIComponent(u); } catch (e) { /* as written */ }
  if (primary(url)) u = u.replace(/^[^?#]*/, '');
  const inUrl = ' ' + norm(u) + ' ';
  return pieces(quote).some(p => { const w = p.split(' '); for (let i = 0; i + 4 <= w.length; i++) if (inUrl.includes(' ' + w.slice(i, i + 4).join(' ') + ' ')) return true; return false; });
}
// What the page calls itself: the title of an HTML page, or the name a data file gives its source.
function pageTitle(raw) {
  const j = asJson(raw);
  if (j) { const names = []; (function walk(v, d) { if (!v || d > 4 || names.length > 2) return; if (typeof v === 'object') for (const k of Object.keys(v)) { if (/^(name|resource_name|title|book|book_name)$/i.test(k) && typeof v[k] === 'string') names.push(v[k]); else walk(v[k], d + 1); } })(j, 0); return names.join(' · ').slice(0, 160); }
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(raw);
  return m ? decode(m[1]).replace(/\s+/g, ' ').trim().slice(0, 160) : '';
}

// ---------- fetching ----------
const cache = new Map();
function readBody(buf, contentType) {
  let charset = (/charset=["']?([\w-]+)/i.exec(contentType || '') || [])[1];
  if (!charset) charset = (/<meta[^>]+charset=["']?([\w-]+)/i.exec(buf.slice(0, 2048).toString('latin1')) || [])[1];
  try { return new TextDecoder(charset || 'utf-8').decode(buf); } catch (e) { return buf.toString('utf8'); }
}
// A PDF is read through PyMuPDF. Its title is what the file says about itself plus its first page, where a paper names its author.
// A word broken over two lines with a hyphen is joined again.
function pdfText(buf) {
  if (buf.length > 60 * 1024 * 1024) return null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mizan-pdf-')), f = path.join(dir, 'page.pdf');
  try {
    fs.writeFileSync(f, buf);
    const code = 'import fitz, sys, json\nsys.stdout.reconfigure(encoding=\'utf-8\')\nd = fitz.open(sys.argv[1])\nprint(json.dumps(d.metadata or {}))\nprint(chr(12).join(p.get_text() for p in d))';
    const r = spawnSync('python', ['-I', '-c', code, f], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 120000 });
    if (r.status !== 0 || !r.stdout) return null;
    const cut = r.stdout.indexOf('\n'), body = r.stdout.slice(cut + 1).replace(/(\p{L})-\r?\n(\p{L})/gu, '$1$2');
    if (count(body) < 20) return null;
    let meta = {}; try { meta = JSON.parse(r.stdout.slice(0, cut)); } catch (e) { /* no metadata */ }
    const head = body.split(String.fromCharCode(12))[0].split(/\s+/).slice(0, 90).join(' ');
    return { text: body, title: [meta.title, head].filter(Boolean).join(' · ').slice(0, 1200), authors: meta.author ? String(meta.author).split(/\s*[;,&]\s*|\s+and\s+/).map(s => s.trim().replace(/^and\s+/i, '')).filter(Boolean) : [], head };
  } catch (e) { return null; } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
// Redirects are followed by hand so that every address on the way is seen. lang: which language the page is asked for.
// agent: the reader the script says it is, when it asks a page a second time as something other than a browser.
async function get(url, lang, agent) {
  const key = (lang || 'ar') + (agent ? ' as another reader ' : ' ') + url;
  if (cache.has(key)) return cache.get(key);
  const job = (async () => {
    for (let tryNo = 0; tryNo < 2; tryNo++) {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 30000);
      try {
        let at = url; const hops = [];
        for (let hop = 0; hop < 6; hop++) {
          const r = await fetch(at, { signal: ctl.signal, redirect: 'manual', headers: { 'user-agent': agent || UA, 'accept-language': lang === 'en' ? 'en,ar;q=0.5' : 'ar,en;q=0.8', accept: '*/*' } });
          if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
            at = new URL(r.headers.get('location'), at).href; hops.push(at);
            const b = banned(at); if (b) { clearTimeout(to); return { ok: false, why: 'it redirects to ' + b.at + ', which may not stand for either side' }; }
            continue;
          }
          const buf = Buffer.from(await r.arrayBuffer()); clearTimeout(to);
          if (r.status === 200 && (/application\/pdf/i.test(r.headers.get('content-type') || '') || buf.slice(0, 5).toString('latin1') === '%PDF-')) {
            const pdf = pdfText(buf);
            if (!pdf) return { ok: false, why: 'a PDF with no text in it that a script can read' };
            return Object.assign({ ok: true, raw: pdf.text, title: pdf.title, pdf: true, author_meta: pdf.authors, head: pdf.head, final_url: at, hops }, model(pdf.text));
          }
          const body = readBody(buf, r.headers.get('content-type'));
          if (r.status === 200) return Object.assign({ ok: true, raw: body, title: pageTitle(body), final_url: at, hops }, model(body));
          if (tryNo === 1) return { ok: false, why: 'HTTP ' + r.status };
          break;
        }
      } catch (e) { clearTimeout(to); if (tryNo === 1) return { ok: false, why: String((e.cause && e.cause.code) || e.name || e).slice(0, 40) }; }
    }
    return { ok: false, why: 'too many redirects' };
  })();
  cache.set(key, job);
  return job;
}
async function pool(items, size, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
}

// ---------- the Quran, by reference ----------
function parseRef(ref) {
  const m = /^\s*(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*$/.exec(String(ref || ''));
  if (!m) return null;
  const s = +m[1], a = +m[2], b = m[3] ? +m[3] : a;
  if (s < 1 || s > 114 || a < 1 || b < a || b - a > 30) return null;
  return { s, a, b };
}
async function fillQuran(item) {
  const r = parseRef(item.ref);
  if (!r) return 'bad reference "' + item.ref + '"';
  const ar = [], en = [];
  for (let v = r.a; v <= r.b; v++) {
    const key = r.s + ':' + v;
    const A = await get('https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=' + key);
    const E = await get('https://api.quran.com/api/v4/quran/translations/' + TRANSLATION.id + '?verse_key=' + key);
    if (!A.ok || !E.ok) return 'quran.com did not answer for ' + key + ' (' + (A.why || E.why) + ')';
    const a = JSON.parse(A.raw).verses || [], e = JSON.parse(E.raw).translations || [];
    if (!a.length || !e.length) return 'no such verse ' + key;
    ar.push(a[0].text_uthmani + (r.b > r.a ? ' ' + String.fromCharCode(0x6DD) + v : ''));
    en.push((r.b > r.a ? '(' + v + ') ' : '') + decode(e[0].text.replace(/<sup[\s\S]*?<\/sup>/gi, '').replace(/<[^>]+>/g, '')).trim());
  }
  item.who = 'Quran ' + r.s + ':' + r.a + (r.b > r.a ? '-' + r.b : '');
  item.quote_ar = ar.join(' ');
  item.quote_en = en.join(' ');
  item.translation = TRANSLATION.name;
  item.url = 'https://quran.com/' + r.s + '/' + r.a + (r.b > r.a ? '-' + r.b : '');
  return null;
}

// ---------- whose words are these ----------
// The script ties a page to a person in one of four ways, and says which:
//   the library catalogue's AUTHOR entry (Shamela) · the page's own author tag (journals, PDFs) · the page's title · the 80 words before the quote.
// A book's title is not a person, and a particle ("ibn", "abu") is not a name. Whether the person named is the one whose words
// these are, and not somebody the page reports, is then confirmed by a second reader.
// The catalogue is asked up to three times, a little apart: a busy library says so for a moment, not for good. An answer that
// says the book is not there (a plain "not found") is an answer; a refusal for now, an error or no answer at all is none.
const busy = r => !r.ok && !/^HTTP 4(?!29)\d\d$/.test(String(r.why));
async function ask(url) {
  let r = await get(url);
  for (let k = 1; k <= 2 && busy(r); k++) { await new Promise(done => setTimeout(done, 1200 * k)); cache.delete('ar ' + url); r = await get(url); }
  return r;
}
async function catalogue(url) {
  // book: the work · author: how the library names its author, for a reader · match: the text a given name is looked for in
  const out = { book: '', author: '', match: '', edition: '' };
  // Arabic Wikisource heads each page of a book with the word for "the author" and his name.
  const w = /ar\.wikisource\.org\/wiki\/([^?#]+)/.exec(url);
  if (w) {
    const p = await get(url); if (!p.ok) return null;
    const at = p.words.slice(0, 400).indexOf(norm('المؤلف')); if (at < 0) return null;
    let title = w[1]; try { title = decodeURIComponent(title); } catch (e) { /* as written */ }
    out.book = title.split('/')[0].replace(/_/g, ' '); out.author = p.words.slice(at + 1, at + 3).join(' '); out.match = p.words.slice(at + 1, at + 5).join(' ');
    return out;
  }
  const m = /shamela\.ws\/book\/(\d+)(?:\/(\d+))?/.exec(url) || /api\.turath\.io\/page\?(?:.*&)?book_id=(\d+)(?:.*?[&?]pg=(\d+))?/.exec(url);
  if (!m) return null;
  let full = '', short = '';
  const b = await ask(TURATH + '/book?id=' + m[1]);
  // A library that is busy or unreachable has said nothing about the book: that is reported as it is, never as "the page is not his".
  if (busy(b)) return { unanswered: true, why: b.why };
  if (b.ok) {
    const meta = (asJson(b.raw) || {}).meta || {}, info = String(meta.info || '');
    out.book = String(meta.name || '');
    full = ((/المؤلف:\s*([^\n]+)/.exec(info) || [])[1] || '').trim();
    // Which printing this is: the editor, the publisher and the edition, as the library gives them.
    out.edition = info.split('\n').filter(l => /^(تحقيق|المحقق|الناشر|الطبعة|حققه|دراسة وتحقيق)/.test(l.trim())).map(l => l.trim()).join(' · ').slice(0, 300);
  }
  if (m[2]) { const p = await ask(TURATH + '/page?book_id=' + m[1] + '&pg=' + m[2]); if (busy(p)) return { unanswered: true, why: p.why }; if (p.ok) { let meta = (asJson(p.raw) || {}).meta; if (typeof meta === 'string') meta = asJson(meta) || {}; if (meta && meta.author_name) short = String(meta.author_name); } }
  out.author = short ? short + (full ? ' (' + full + ')' : '') : full; out.match = full + ' ' + short;
  return out.book || out.match.trim() ? out : null;
}
const PARTICLES = set(['ابن', 'بن', 'أبو', 'ابو', 'أبي', 'كتاب', 'الشيخ', 'الإمام', 'ibn', 'abu', 'al', 'the', 'book', 'shaykh', 'imam', 'dr', 'prof', 'professor']);
function metaAuthors(raw) {
  const out = [], re = /<meta\b[^>]*>/gi; let m;
  while ((m = re.exec(raw))) { const tag = m[0], name = (/(?:name|property)\s*=\s*["']([^"']+)["']/i.exec(tag) || [])[1] || '', content = (/content\s*=\s*["']([^"']*)["']/i.exec(tag) || [])[1] || ''; if (/^(citation_author|dc\.creator|dcterms\.creator|author|article:author|parsely-author)$/i.test(name) && content.trim()) out.push(decode(content).trim()); }
  return [...new Set(out)].slice(0, 12);
}
async function attribute(it, check, page, url, near) {
  const clean = v => [].concat(v || []).map(norm).filter(Boolean);
  const names = clean(it.on_page_as), via = it.via && it.via.who ? it.via : null;
  const cat = await catalogue(url);
  // The library did not answer: whose page this is was not checked in this run, and that is what is said (not "it is not his").
  if (cat && cat.unanswered) { check.catalogue_unanswered = true; check.attribution = 'not checked'; return 'the library\'s catalogue did not answer (' + cat.why + '), so whose page this is was not checked in this run: run again'; }
  if (cat) { check.book = cat.book; check.author = cat.author; if (cat.edition) check.edition = cat.edition; }
  const tags = page.pdf ? (page.author_meta || []) : metaAuthors(page.raw);
  if (tags.length) check.author_meta = tags;
  const hint = cat ? 'the library lists it (' + check.author + ')' : tags.length ? 'the page\'s author tag writes it (' + tags.slice(0, 3).join('; ') + ')' : 'the page writes it in its title or in the lines before the quote';
  if (!names.length) { check.attribution = 'no name given'; return 'give on_page_as: the name of the person whose words these are, as ' + hint; }
  const weak = names.find(n => n.split(' ').every(w => PARTICLES.has(w)) || n.replace(/ /g, '').length < 5);
  if (weak) { check.attribution = 'not named'; return '"' + weak + '" is not a name that can tie words to a person; give the name as ' + hint; }
  const within = (list, text) => { const t = ' ' + norm(text) + ' '; return list.length > 0 && list.every(n => t.includes(' ' + n + ' ')); };
  check.attribution = 'named';
  if (cat) {
    if (within(names, cat.match)) { check.named_in = 'the library catalogue, as the author'; return null; }
    // Words of one man quoted inside another man's book: the one quoted must be named just before his words, and the
    // author of the book ("via") must be the catalogue's author.
    if (via && within(names, near) && within(clean(via.on_page_as), cat.match)) { check.named_in = 'the 80 words before the quote, inside a book the library lists under ' + cat.author; return null; }
    check.attribution = 'not named';
    return 'the library lists this page as "' + check.book + '" by ' + check.author + '; "' + names[0] + '" is not its author' + (within(names, cat.book) ? ' (it is the title of the book; give the author)' : '. If these are his words as ' + cat.author + ' quotes them, say so: via { who, on_page_as: the name of the book\'s author as the library writes it, standing, basis }, and his own name must stand in the 80 words before the quote');
  }
  // Whoever is said to quote or publish the words ("via") must himself be named by the page: in its author tag, its title or its first lines.
  if (via) check.via_named = within(clean(via.on_page_as || via.who), [page.title, tags.join(' '), String(page.head || ''), (page.tok || []).slice(0, 400).join(' ')].join(' '));
  if (tags.length && within(names, tags.join(' '))) { check.named_in = 'the page\'s own author tag'; check.authored = true; return null; }
  if (page.pdf && within(names, String(page.head || ''))) { check.named_in = 'the first lines of the document'; check.authored = true; return null; }
  if (within(names, page.title)) { check.named_in = 'the page title'; return null; }
  if (within(names, near)) { check.named_in = 'the 80 words before the quote'; return null; }
  check.attribution = 'not named';
  return 'the name "' + names[0] + '" is not in the page\'s author tag, not in its title, and not within 80 words before the quote';
}
// A page of the hadith collections also carries the collection's name and the gradings scholars gave the report.
function hadithInfo(raw) {
  const j = asJson(raw), h = j && Array.isArray(j.hadiths) ? j.hadiths[0] : null;
  return h ? { grades: (h.grades || []).map(g => ({ name: g.name, grade: g.grade })), text: h.text || '', collection: String((j.metadata || {}).name || '') } : null;
}

// ---------- the libraries, searched by the script ----------
const dig = (o, p) => p.split('.').reduce((v, k) => (v == null ? v : v[k]), o);
// The places a search answer points to, as addresses a reader can open (the first is also used to describe the hit).
function hitList(j) {
  const out = [];
  try {
    for (const d of (Array.isArray(j.data) ? j.data : []).slice(0, 6)) { const m = typeof d.meta === 'string' ? JSON.parse(d.meta) : (d.meta || {}); out.push({ label: (m.book_name || '') + ' (' + (m.author_name || '') + ')', url: 'https://shamela.ws/book/' + d.book_id + '/' + m.page_id }); }
    for (const s of ((j.query || {}).search || []).slice(0, 6)) out.push({ label: s.title, url: 'https://' + (ARABIC.test(s.title) ? 'ar' : 'en') + '.wikisource.org/wiki/' + encodeURIComponent(s.title.replace(/ /g, '_')) });
    for (const w of (Array.isArray(j.results) ? j.results : []).slice(0, 6)) out.push({ label: w.display_name || '', url: ((w.open_access || {}).oa_url) || w.doi || w.id || '' });
    for (const h of ((((j.response || {}).body || {}).hits || {}).hits || []).slice(0, 6)) { const id = (h.fields || {}).identifier; if (id) out.push({ label: (h.fields || {}).title || id, url: 'https://archive.org/details/' + id }); }
  } catch (e) { /* no description of the hits */ }
  return out;
}
const searchText = phrase => (ARABIC.test(phrase) ? String(phrase).normalize('NFKC').replace(MARKS, '').replace(/[^\p{L}\p{N}\s]+/gu, ' ') : String(phrase).replace(/[^\p{L}\p{N}\s'-]+/gu, ' ')).replace(/\s+/g, ' ').trim();
async function searchEngines(phrase) {
  const q = searchText(phrase), w = q.split(' '), engines = [], leads = [], script = ARABIC.test(phrase) ? 'arabic' : 'latin';
  const ask = async (e, text) => { const r = await get(e.url.replace('{q}', encodeURIComponent(text))); const j = r.ok ? asJson(r.raw) : null; const n = j ? dig(j, e.count) : null; return { n: typeof n === 'number' ? n : -1, hits: j ? hitList(j) : [] }; };
  let found_at = '';
  for (const e of RULES.search_engines[script]) {
    const control = await ask(e, e.control), hit = await ask(e, q);
    engines.push({ name: e.name, control_hits: control.n, hits: hit.n, first: hit.n > 0 && hit.hits[0] ? hit.hits[0].label + ' ' + hit.hits[0].url : '' });
    // A library's search matches the words of a page, so a long phrase can miss a page that holds it. The beginning, the middle and the end
    // are searched on their own, and the script OPENS the places they point to and looks there for the whole phrase itself.
    if (w.length >= 6 && hit.n <= 0) {
      const mid = Math.max(0, Math.floor(w.length / 2) - 2);
      for (const part of [...new Set([w.slice(0, 4).join(' '), w.slice(mid, mid + 4).join(' '), w.slice(-4).join(' ')])]) {
        const h = await ask(e, part);
        if (h.n <= 0) continue;
        leads.push({ words: part, where: e.name, hits: h.n, first: h.hits[0] ? h.hits[0].label + ' ' + h.hits[0].url : '' });
        for (const x of h.hits.slice(0, 4)) { if (found_at || !/^https?:/.test(x.url) || isSearchPage(x.url)) continue; const p = await get(x.url); if (p.ok && !locate(phrase, p).miss) found_at = x.url; }
      }
    }
  }
  return { phrase: q, script, engines, leads, found_at, total_hits: engines.reduce((s, e) => s + Math.max(0, e.hits), 0), first: (engines.find(e => e.hits > 0) || {}).first || '' };
}

// ---------- one evidence item ----------
const someonesWords = it => it.kind !== 'quran' && it.kind !== 'hadith';
async function verifyItem(it) {
  const check = { ar: '', en: '' };
  let problem = null, naming = null;
  const add = t => { problem = (problem ? problem + '; ' : '') + t; };
  if (it.kind === 'quran') {
    problem = await fillQuran(it);
    check.ar = check.en = problem ? 'missing' : 'from quran.com by reference';
  } else {
    for (const lang of ['ar', 'en']) {
      const quote = it['quote_' + lang], url = it['check_url_' + lang];
      if (!quote) continue;
      // A translation made by the map is not on any page; the item stands or falls on its original.
      if (lang === 'en' && it.translated_by_map) { check.en = 'translation by the map'; continue; }
      if (!url) { check[lang] = 'no page given'; continue; }
      const b = banned(url);
      if (b) { check[lang] = 'missing'; add(lang + ': ' + b.at + ' may not stand for either side (' + b.why + ')'); continue; }
      if (isSearchPage(url)) { check[lang] = 'missing'; add(lang + ': a page of search results is not a source; cite the page of the work itself'); continue; }
      if (echoes(url, quote)) { check[lang] = 'missing'; add(lang + ': the address itself carries the words of the quote; a page that repeats its own address proves nothing'); continue; }
      let page = await get(url), hit = page.ok ? locate(quote, page) : null, asked;
      // Some sites answer in the language the reader asks for; an English quote is looked for on the English answer too.
      if (page.ok && hit.miss && lang === 'en') { const p2 = await get(url, 'en'); if (p2.ok) { const h2 = locate(quote, p2); if (!h2.miss) { page = p2; hit = h2; asked = 'en'; } } }
      if (!page.ok) { check[lang] = 'unfetchable'; add(lang + ': page not readable (' + page.why + ')'); continue; }
      if (page.hops.length) { check.final_url = page.final_url; if (primary(url) && (hostsIn(page.final_url)[0] !== hostsIn(url)[0])) { check[lang] = 'missing'; add(lang + ': the address redirects to another site (' + hostsIn(page.final_url)[0] + '); cite the page it lands on'); continue; } }
      check[lang] = hit.miss ? 'missing' : 'found';
      if (hit.miss) { add(lang + ': ' + hit.miss); continue; }
      // A site can give one text to a browser and another to anybody else. Outside the libraries that hold the works themselves the
      // page is asked for once more, as a reader that is not a browser; words that only one of the two answers carries are not
      // the page's words. (A PDF is not asked for twice. A site that will not answer the second reader at all is noted, not refused.)
      if (!primary(url) && !page.pdf) {
        const again = await get(url, asked, UA_PLAIN);
        if (again.ok && locate(quote, again).miss) { check[lang] = 'missing'; check.one_reader_only = true; add(lang + ': the page shows these words to one kind of reader only (asked again as a reader that is not a browser, it does not give them)'); continue; }
        if (!again.ok) check.second_reader = 'did not answer (' + again.why + ')';
      }
      const ctx = around(page, hit.spans);
      if (!check.context_lang) Object.assign(check, { before: ctx.before, after: ctx.after, skipped: ctx.skipped, flags: ctx.flags, context_lang: lang, page_title: String(page.title || '').slice(0, 160) });
      else Object.assign(check, { before_en: ctx.before, after_en: ctx.after, flags: check.flags.concat(ctx.flags.map(f => 'on the English page: ' + f)) });   // the reader sees what stands around the quote in both languages
      // A page whose own title carries the title of the work presents itself as that work.
      if (count(norm(it.work)) >= 3 && (' ' + norm(page.title) + ' ').includes(' ' + norm(it.work) + ' ')) check.work_in_title = true;
      it.page_title = check.page_title;
      // The wider passage, when given, must be on the same page and must hold the quote: it is what a reader checks the meaning against.
      const given = it['context_' + lang];
      if (given) {
        if (locate(given, page).miss || !norm(given).includes(pieces(quote)[0])) { check[lang] = 'missing'; add(lang + ': the context given is not on the page, or does not hold the quote'); }
        else if (count(given) >= RULES.min_quote_words) check.whole = true;
      }
      const h = hadithInfo(page.raw);
      if (h) {
        if (h.grades.length) check.grades = h.grades;
        if (norm(h.text) === pieces(quote).join(' ')) check.whole = true;
        // The collection the page belongs to, against the collection the item is cited to.
        if (it.kind === 'hadith' && h.collection) { check.collection = h.collection; const want = norm(it.who).split(' ').filter(w => w.length > 3 && !/^\d+$/.test(w) && !['sahih', 'sunan', 'jami', 'musnad'].includes(w)), have = norm(h.collection + ' ' + url); check.collection_matches = !want.length || want.some(w => have.includes(w) || have.replace(/[^a-z]/g, '').includes(w.replace(/[^a-z]/g, '').slice(0, 5))); }
      }
      // A hadith read on a library page: the catalogue says which collection the page belongs to.
      if (it.kind === 'hadith' && !check.collection) { const cat = await catalogue(url); if (cat && cat.unanswered) check.catalogue_unanswered = true; else if (cat && cat.book) { check.book = cat.book; check.collection = cat.book; if (cat.edition) check.edition = cat.edition; } }
      if (someonesWords(it) && check.attribution !== 'named') naming = await attribute(it, check, page, url, ctx.near);
    }
    const ok = check.ar === 'found' || check.en === 'found';
    if (!problem && !ok) problem = 'no quote could be checked against a page';
    if (!problem && (check.ar === 'no page given' || check.en === 'no page given')) problem = 'a quote has no page address';
  }
  it.verified = !problem;
  it.check = Object.assign(check, { hash: sign(it) });
  if (naming && check.attribution !== 'named') check.naming = naming;
  return { problem, naming: !problem && naming && check.attribution !== 'named' ? naming : null };
}

// ---------- the web archive ----------
// An address that does not open is not yet a dead end: the web archive may hold a copy of it. The archive's own lookup answers with
// the newest copy it holds, or with none. "asked" is false when the archive itself did not answer: then nothing is known.
const ARCHIVE_COPY = /^https?:\/\/web\.archive\.org\/web\//i;
const bare = u => String(u || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/[#?].*$/, '').replace(/\/+$/, '').toLowerCase();
async function archived(url) {
  // The address is given whole, scheme and all: the lookup finds nothing for an address whose slashes are encoded and whose scheme is cut off.
  const r = await get('https://archive.org/wayback/available?url=' + encodeURIComponent(/^https?:\/\//i.test(String(url)) ? String(url) : 'https://' + url));
  if (!r.ok) return { asked: false, why: r.why, copy: '' };
  let j; try { j = JSON.parse(r.raw); } catch (e) { return { asked: false, why: 'the archive did not answer in its usual form', copy: '' }; }
  const c = (j.archived_snapshots || {}).closest || {};
  return { asked: true, copy: c.available === true && c.url ? String(c.url).replace(/^http:/i, 'https:') : '' };
}

// ---------- one roadblock ----------
// A roadblock says "the original was not found; I found only this page, whose standing is such". The script tests every part of
// that sentence as hard as it tests a quote.
async function verifyRoadblock(rb) {
  const check = { ar: '', en: '' }, reportPages = [], by = rb.reported_by || {};
  let problem = null;
  const add = t => { problem = (problem ? problem + '; ' : '') + t; };
  for (const lang of ['ar', 'en']) {
    const quote = rb['reported_quote_' + lang], url = rb['check_url_' + lang];
    if (!quote || !url) continue;
    if (isSearchPage(url) || echoes(url, quote)) { check[lang] = 'missing'; add(lang + ': a page of search results, or an address that carries the words, is not a report'); continue; }
    const page = await get(url);
    if (!page.ok) { check[lang] = 'unfetchable'; add(lang + ': the reporting page is not readable (' + page.why + ')'); continue; }
    const hit = locate(quote, page);
    check[lang] = hit.miss ? 'missing' : 'found';
    if (hit.miss) { add(lang + ': the report\'s words are not on its page: ' + hit.miss); continue; }
    check.page_title = String(page.title || '').slice(0, 160); reportPages.push(page);
    // Does the report itself quote words, beside what it says of the original? Then those words can be searched for.
    const first = hit.spans[0][0], last = hit.spans[hit.spans.length - 1][1], nearby = written(page, first - 80, last + 80);
    if ([...nearby.matchAll(/[«“"]([^«»“”"]{15,400})[»”"]/g)].some(m => count(m[1]) >= 4)) check.report_quotes_words = true;
  }
  if (!problem && check.ar !== 'found' && check.en !== 'found') add('the report carries no quote that could be checked');
  // What standing the reporting page has is said in the words of a page, and those words are looked for like any quote.
  if (count(by.standing_quote) >= 6 && /^https?:\/\//.test(by.standing_url || '') && !banned(by.standing_url) && !isSearchPage(by.standing_url)) { const sp = await get(by.standing_url), sh = sp.ok ? locate(by.standing_quote, sp) : null; check.standing = sp.ok && !sh.miss ? 'found' : 'missing'; if (check.standing !== 'found') add('the words given for the reporter\'s standing are not on ' + by.standing_url + (sp.ok ? ': ' + sh.miss : ' (' + sp.why + ')')); }
  const sought = norm(rb.sought_phrase || ''), enough = sought.split(' ').filter(Boolean).length >= RULES.roadblock.min_phrase_words;
  // The words that were sought must be words the report itself quotes; otherwise the searcher chose them, and a wrong choice finds nothing.
  if (enough && reportPages.length && !reportPages.some(p => (' ' + p.text + ' ').includes(' ' + sought + ' '))) add('the words sought are not on the reporting page: give words the report itself quotes from the original, or leave sought_phrase empty and say why in sought_phrase_unknown');
  if (!enough && check.report_quotes_words) add('the reporting page quotes words beside what it says of the original: give them as sought_phrase, so that the libraries can be searched for them');
  delete rb.dissolved_at;
  const tried = [rb.attempts || [], (rb.second_search || {}).attempts || []], copyRead = u => tried.some(list => list.some(b => ARCHIVE_COPY.test(b.url || '') && bare(String(b.url).replace(ARCHIVE_COPY, '').replace(/^\d+[a-z_]*\//i, '')) === bare(u)));
  for (const list of tried) for (const a of list) {
    if (!/^https?:\/\//.test(a.url || '')) continue;
    const page = await get(a.url);
    a.fetched = page.ok ? 'read' : 'not readable (' + page.why + ')';
    // Nothing is called not found while a copy of an address that did not open sits in the web archive unread.
    delete a.archive_copy;
    if (!page.ok && !ARCHIVE_COPY.test(a.url) && !isSearchPage(a.url)) {
      const ar = await archived(a.url);
      if (!ar.asked) add('the web archive could not be asked whether it holds a copy of ' + a.url + ' (' + ar.why + '); run again');
      else if (ar.copy) { a.archive_copy = ar.copy; if (!copyRead(a.url)) add('NOT YET A ROADBLOCK: ' + a.url + ' did not open, and the web archive holds a copy of it: ' + ar.copy + ' . Read that copy and list it among the searches'); }
    }
    if (page.ok && !isSearchPage(a.url) && enough && !reportPages.some(p => p.final_url === page.final_url) && (' ' + page.text + ' ').includes(' ' + sought + ' ')) { rb.dissolved_at = a.url; add('NOT A ROADBLOCK: the words that were sought are on ' + a.url); }
  }
  delete rb.machine_search;
  if (enough) {
    const m = await searchEngines(rb.sought_phrase), need = (RULES.search_engines.min_answering || {})[m.script] || 1;
    const now = new Date();                                           // the local day, like the dates agents write
    rb.machine_search = Object.assign(m, { date: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') });
    if (m.engines.filter(e => e.control_hits > 0).length < need) add('fewer than ' + need + ' library search(es) answered their control search; run again');
    else if (m.total_hits > 0) add('NOT A ROADBLOCK: the libraries hold the sought words in ' + m.total_hits + ' place(s); the first: ' + m.first);
    else if (m.found_at) add('NOT A ROADBLOCK: the script opened a place a shorter search pointed to, and the sought words are there: ' + m.found_at);
  }
  rb.verified = !problem;
  rb.check = Object.assign(check, { hash: signRb(rb) });
  if (rb.machine_search) rb.machine_search.hash = signRb(rb);
  return { problem };
}

// keep: an item the script already confirmed, and that was not touched since, is not fetched again (used while a case is being built).
async function verifyDoc(doc, opts) {
  const o = opts || {};
  const questions = (doc.questions || doc.nodes || []).filter(n => !o.only || String(n.id).startsWith(o.only));
  const todo = [], blocks = [], fails = [], unnamed = [];
  for (const n of questions) {
    let k = 0; const used = new Set((n.evidence || []).map(e => e.id).filter(Boolean));
    for (const it of n.evidence || []) { if (!it.id) { do { k++; } while (used.has('E' + k)); it.id = 'E' + k; used.add(it.id); } todo.push({ n, it }); }
    for (const rb of n.roadblocks || []) blocks.push({ n, rb });
  }
  const settled = it => found(it) && (!someonesWords(it) || it.check.attribution === 'named') && it.check.catalogue_unanswered !== true;   // what a library did not answer is asked again
  await pool(todo.filter(x => !(o.keep && settled(x.it))), 4, async ({ n, it }) => {
    const r = await verifyItem(it);
    const row = { id: n.id, item: it.id, side: it.side || '', who: it.who, kind: it.kind, url: it.check_url_ar || it.check_url_en || it.ref };
    if (r.problem) fails.push(Object.assign({ problem: r.problem }, row));
    else if (r.naming) unnamed.push(Object.assign({ problem: r.naming }, row));
  });
  const stood = rb => rb.verified === true && rb.check && rb.check.hash === signRb(rb) && (!rb.machine_search || rb.machine_search.hash === signRb(rb));
  await pool(blocks.filter(x => !(o.keep && stood(x.rb))), 2, async ({ n, rb }) => {
    const r = await verifyRoadblock(rb);
    if (r.problem) fails.push({ id: n.id, item: 'roadblock', rb: rb.id || '', side: rb.side || '', who: String(rb.sought || '').slice(0, 50), kind: 'report', problem: r.problem, url: rb.check_url_ar || rb.check_url_en || '' });
  });
  return { todo, blocks, fails, unnamed, proven: blocks.filter(x => x.rb.verified === true).length };
}
function report(r) {
  const { todo, blocks, fails, unnamed, proven } = r, lines = [];
  const kinds = [...new Set(todo.map(x => x.it.kind))];
  lines.push('MIZAN VERIFY: ' + todo.length + ' quote(s) and reference(s) · ' + todo.filter(x => x.it.verified).length + ' found word for word · ' + todo.filter(x => !x.it.verified).length + ' not found · ' + unnamed.length + ' found but not tied to their author · ' + blocks.length + ' roadblock(s), ' + proven + ' stood the script\'s own search');
  if (kinds.length) lines.push('  ' + kinds.map(k => k + ' ' + todo.filter(x => x.it.kind === k && x.it.verified).length + ' of ' + todo.filter(x => x.it.kind === k).length).join(' · '));
  for (const f of fails) lines.push((f.item === 'roadblock' ? 'ROADBLOCK REFUSED ' : 'NOT FOUND ') + f.id + (f.item === 'roadblock' ? (f.rb ? '/' + f.rb : '') : '/' + f.item) + ' | ' + (f.side ? f.side + ' | ' : '') + f.kind + ' | ' + f.who + ' | ' + f.problem + ' | ' + f.url);
  for (const f of unnamed) lines.push('NOT ATTRIBUTED ' + f.id + '/' + f.item + ' | ' + (f.side ? f.side + ' | ' : '') + f.kind + ' | ' + f.who + ' | ' + f.problem + ' | ' + f.url);
  return lines;
}

async function main() {
  const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
  const file = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
  if (!file) { console.error('usage: node domain/mizan/verify.js <case.json> [--only <id prefix>] [--dry]'); process.exitCode = 2; return; }
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const r = await verifyDoc(doc, { only: arg('--only') });
  console.log(report(r).join('\n'));
  if (!process.argv.includes('--dry')) { fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n'); console.log('results written to ' + file); }
  process.exitCode = r.fails.length || r.unnamed.length ? 1 : 0;
}

if (require.main === module) main();
module.exports = { norm, model, locate, around, pieces, get, archived, searchEngines, catalogue, metaAuthors, pageTitle, isSearchPage, count, verifyDoc, report, echoes };
