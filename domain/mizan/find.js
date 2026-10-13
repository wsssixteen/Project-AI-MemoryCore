#!/usr/bin/env node
// mizan find — the tool a researcher uses to reach the original text instead of somebody's summary of it.
//   node domain/mizan/find.js "<a few exact words>"            search the libraries for the words; each hit names the book, the author and the page
//   node domain/mizan/find.js --read <url> [--at "<words>"]    print the page as the checker reads it (around the words, or the first part), to copy a quote from
// Arabic words are searched in turath.io (the Shamela library) and Arabic Wikisource; Latin words in the full text of academic works (OpenAlex).
// A search with no hit proves only that these words are not in these libraries today. The services and their control searches are in checks.json.
'use strict';
const path = require('path');
const { RULES } = require(path.join(__dirname, '..', '..', 'lib', 'mizan.js'));
const V = require(path.join(__dirname, 'verify.js'));

process.stdout.on('error', () => process.exit(0));   // whoever reads the output may stop reading early
const opt = name => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : ''; };
const ARABIC = new RegExp('[' + String.fromCharCode(0x600) + '-' + String.fromCharCode(0x6FF) + ']');

async function hits(engine, phrase) {
  const r = await V.get(engine.url.replace('{q}', encodeURIComponent(phrase)));
  if (!r.ok) return { n: -1, rows: ['  (no answer: ' + r.why + ')'] };
  let j; try { j = JSON.parse(r.raw); } catch (e) { return { n: -1, rows: ['  (unreadable answer)'] }; }
  const n = engine.count.split('.').reduce((v, k) => (v == null ? v : v[k]), j), rows = [];
  for (const d of (j.data || []).slice(0, 10)) { let m = d.meta; if (typeof m === 'string') { try { m = JSON.parse(m); } catch (e) { m = {}; } } rows.push('  ' + (m.book_name || '?') + ' | ' + (m.author_name || '?') + ' | vol ' + (m.vol || '-') + ' p ' + (m.page || '-') + ' | https://shamela.ws/book/' + d.book_id + '/' + m.page_id); }
  for (const s of ((j.query || {}).search || []).slice(0, 10)) rows.push('  ' + s.title + ' | https://ar.wikisource.org/wiki/' + encodeURIComponent(s.title.replace(/ /g, '_')));
  for (const h of ((((j.response || {}).body || {}).hits || {}).hits || []).slice(0, 10)) rows.push('  ' + ((h.fields || {}).title || '?') + ' | ' + ((h.fields || {}).creator || []).toString().slice(0, 60) + ' | https://archive.org/details/' + (h.fields || {}).identifier + ' | full text: https://archive.org/stream/' + (h.fields || {}).identifier);
  for (const w of (j.results || []).slice(0, 10)) rows.push('  ' + (w.display_name || '?') + ' | ' + (w.publication_year || '') + ' | ' + (((w.primary_location || {}).source || {}).display_name || '') + ' | ' + (w.doi || w.id || '') + (((w.open_access || {}).oa_url) ? ' | open text: ' + w.open_access.oa_url : ''));
  return { n: typeof n === 'number' ? n : -1, rows };
}

(async () => {
  const url = opt('read');
  if (url) {
    const page = await V.get(url);
    // The line names the address, so that the record shows which address was not read (prove.js reads this line).
    if (!page.ok) {
      console.log('MIZAN FIND: ' + url + ' · NOT READABLE by the checker (' + page.why + '): a quote from it cannot be verified; find the text on a page it can read');
      // An address that does not open may have a copy in the web archive; the lookup is made here, so that nobody has to think of it.
      if (!/^https?:\/\/web\.archive\.org\/web\//i.test(url)) { const ar = await V.archived(url); console.log(ar.copy ? 'the web archive holds a copy of this address: ' + ar.copy + '   (read it with --read and list it among your searches; a roadblock on an address whose copy was not read is refused)' : ar.asked ? 'the web archive holds no copy of this address' : 'the web archive did not answer (' + ar.why + '); ask again before calling this address a dead end'); }
      process.exit(1);
    }
    const at = opt('at');
    console.log('MIZAN FIND: ' + url + ' · ' + page.words.length + ' words · the page calls itself: ' + (String(page.title || '').slice(0, 200) || '(no title)'));
    const cat = await V.catalogue(url);
    if (cat) console.log('the library lists it as: "' + cat.book + '" by ' + cat.author + (cat.edition ? ' · ' + cat.edition : '') + '   (give the name of the author, as written here, in on_page_as)');
    else { const tags = page.pdf ? (page.author_meta || []) : V.metaAuthors(page.raw); if (tags.length) console.log('the author tag of the page: ' + tags.join('; ') + '   (give the name of the author, as written here, in on_page_as)'); }
    if (at) {
      const hit = V.locate(at, page);
      if (hit.miss) { console.log('the words are not on the page as given: ' + hit.miss); process.exit(1); }
      const first = hit.spans[0][0], last = hit.spans[hit.spans.length - 1][1], lo = Math.max(0, first - 120), hi = Math.min(page.words.length - 1, last + 120);
      console.log(page.tok.slice(page.back[lo], page.back[hi] + 1).join(' '));
    } else console.log(page.tok.slice(0, 900).join(' ') + (page.tok.length > 900 ? '\n[... ' + (page.tok.length - 900) + ' more words; use --at "<words>" to read around a passage]' : ''));
    return;
  }
  const phrase = process.argv.slice(2).filter(a => !a.startsWith('--')).join(' ').trim();
  if (phrase.split(/\s+/).length < 2) { console.error('usage: node domain/mizan/find.js "<a few exact words>"   |   --read <url> [--at "<words>"]'); process.exit(2); }
  const arabic = ARABIC.test(phrase);
  const q = arabic ? V.norm(phrase) : phrase.replace(/["]+/g, ' ').replace(/\s+/g, ' ').trim();
  // The result line comes first and every library's own line names the words it was asked for, so that a reader who keeps only
  // the first lines of the output still has, for each library, what it was asked and whether it answered (prove.js reads these lines).
  let total = 0, alive = 0; const out = [];
  for (const e of RULES.search_engines[arabic ? 'arabic' : 'latin']) {
    const control = await hits(e, e.control), h = await hits(e, q);
    if (control.n > 0) alive++;
    total += Math.max(0, h.n);
    out.push(e.name + ': ' + (h.n < 0 ? 'no answer' : h.n + ' hit(s)') + ' for ' + JSON.stringify(q) + (control.n > 0 ? '' : '   [its control search did not answer: this result proves nothing]'));
    h.rows.forEach(r => out.push(r));
  }
  console.log('MIZAN FIND: ' + JSON.stringify(q) + ' · ' + total + ' hit(s) · ' + alive + ' search service(s) answering' + (total ? '' : ' · no hit means only: these exact words are not in these libraries today. Try fewer words, or the wording of another edition.'));
  out.forEach(l => console.log(l));
})();
