#!/usr/bin/env node
// verify.eval.js — live tests of domain/mizan/verify.js against real pages and a small local page server (needs the network; about 60 seconds).
// It proves both directions: true quotes are found, and altered, reordered, negated, misattributed, echoed, redirected or unsourced quotes are refused;
// a true roadblock stands, and a "roadblock" whose words are in the library is thrown out by the script's own search.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { sign, signRb } = require(path.join(__dirname, '..', '..', 'lib', 'mizan.js'));

const VERIFY = path.join(__dirname, 'verify.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mizan-verify-'));
const AR = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari/7118.json';
const EN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/7118.json';
const TIRMIDHI = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-tirmidhi/2180.json';
const BIDAYA = 'https://shamela.ws/book/4445/11082';
const TRUE_EN = 'The Hour will not be established till a fire will come out of the land of Hijaz, and it will throw light on the necks of the camels at Busra';
const KATHIR = 'والحديث الوارد في أمر هذه النار مخرج في الصحيحين من طريق الزهري';
const NONSENSE_AR = 'زرافة بنفسجية تقرأ الجريدة في المريخ';
const NONSENSE_EN = 'purple giraffe reads newspapers on Mars quietly';

// A few pages of our own, to test what no real site can be asked to do.
const PAGES = {
  '/report': '<html><head><title>A report by Author Reporter</title></head><body><p>The scholar answered this in his book. He wrote: ' + NONSENSE_AR + '. In English the passage reads: ' + NONSENSE_EN + '. That is all this report says about the original text.</p></body></html>',
  '/essay': '<html><head><title>An essay on the fire</title></head><body><p>' + 'Filler sentence about other matters entirely. '.repeat(30) + '</p><p>The writer Zayd al-Example is mentioned here once, far above.</p><p>' + 'More filler text that separates the two parts. '.repeat(30) + '</p><p>Critics say that the report was written after the event took place in the city. The careful historian does not accept that the light was seen in Busra, but he grants the eruption. Ibn Sample said: the fire was seen by the people of the town for many nights.</p></body></html>',
};
PAGES['/hidden'] = '<html><head><title>A page with hidden text</title></head><body><p>Visible text of the page stands here for the test of the reader.</p><div style="display:none">these hidden words are not shown to any reader of the page</div><span hidden>nor are these other hidden words shown to any reader at all</span></body></html>';
PAGES['/magazine'] = '<html><head><title>Example Company World : Volcanic Country</title></head><body><p>Written and photographed by Peter Sample. At its height those further away also saw strange sights, and the light of the eruption was seen in a town six days away from the city.</p></body></html>';
PAGES['/about'] ='<html><head><title>About this site</title></head><body><p>This site is run by the faculty of a named university and supervised by its dean.</p></body></html>';
PAGES['/report2'] = '<html><head><title>A second report</title></head><body><p>The scholar answered this in his book. He wrote: “the fire was a sign that had been promised to the people long before”. That is what the report says.</p></body></html>';
// A hostile page: words a reader is never shown, each hidden another way, around words he is shown.
const UNSEEN = n => 'words number ' + n + ' that the page keeps from the eyes of every reader who opens it';
PAGES['/unseen'] = '<!doctype html><html><head><title>A page that hides words</title><style>.gone { display: none } p.tiny, .faint { font-size: 0 } @media print { .noprint { display: none } } .loud { font-size: 20px }</style></head><body>'
  + '<p>The first sentence of this page is shown to everybody who opens the page.</p><!-- <p>' + UNSEEN('zero') + '</p> -->'
  + '<p class="gone">' + UNSEEN('one') + '</p><ul><li hidden>' + UNSEEN('two') + '</li><li>an item of the list that is shown</li></ul><p><del>' + UNSEEN('three') + '</del> <s>' + UNSEEN('four') + '</s></p>'
  + '<p class="lead tiny">' + UNSEEN('five') + '</p><table><tr><td hidden="hidden">' + UNSEEN('six') + '</td><td>a cell that is shown</td></tr></table><div style="color:red; opacity: 0"><div>' + UNSEEN('seven') + '</div> and more</div><span style=\'visibility:hidden\'>' + UNSEEN('eight') + '</span>'
  + '<p class="noprint loud" data-note="a hidden word in a note">These words are hidden on paper only and are shown on every screen.</p><p style="font-size:0.9em; opacity:0.8">The last sentence of this page stands after all the hidden words and is shown too.</p></body></html>';
PAGES['/lib/shamela.ws/book/77/5'] = '<html><head><title>A library page</title></head><body><p>The words of the author on this page of his book are these very words here.</p></body></html>';
PAGES['/lib/shamela.ws/book/78/5'] = PAGES['/lib/shamela.ws/book/77/5'];
const AUTHOR = String.fromCharCode(0x627, 0x628, 0x646) + ' ' + String.fromCharCode(0x645, 0x62B, 0x627, 0x644);   // "Ibn Mithal", as a catalogue would write an author
const asked = { 77: 0, 78: 0 };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  // One body for the checker's browser-like reader and another for anybody else.
  if (u.pathname === '/cloak') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(/Chrome\/\d+/.test(req.headers['user-agent'] || '') ? '<html><head><title>A chronicle</title></head><body><p>These words are served to one kind of reader only and to nobody else at all.</p></body></html>' : '<html><head><title>A harmless page</title></head><body><p>This is what any other reader is given. There is no quotation here.</p></body></html>'); }
  // A stand-in for the library's catalogue: book 77 is always refused for now; book 78 is refused twice and then answers.
  if (u.pathname === '/turath/book') { const id = u.searchParams.get('id'); asked[id]++; if (id === '77' || asked[id] <= 2) { res.writeHead(429); return res.end('Too Many Requests'); } res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ meta: { name: 'a book', info: String.fromCharCode(0x627, 0x644, 0x645, 0x624, 0x644, 0x641) + ': ' + AUTHOR + '\n' } })); }
  if (u.pathname === '/turath/page') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ meta: { author_name: AUTHOR } })); }
  if (u.pathname === '/to-wiki') { res.writeHead(302, { location: 'https://en.wikipedia.org/wiki/Quran' }); return res.end(); }
  if (u.pathname === '/echo') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end('<html><body>You asked for: ' + (u.searchParams.get('verse_key') || '') + '</body></html>'); }
  if (u.pathname === '/cp1256') { res.writeHead(200, { 'content-type': 'text/html; charset=windows-1256' }); return res.end(Buffer.from([0xE4, 0xC7, 0xD1, 0x20, 0xE3, 0xE4, 0x20, 0xC3, 0xD1, 0xD6, 0x20, 0xC7, 0xE1, 0xCD, 0xCC, 0xC7, 0xD2])); }   // "نار من أرض الحجاز" in windows-1256
  if (u.pathname === '/lang') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(/^en/.test(req.headers['accept-language'] || '') ? '<p>This English answer is served only to readers who ask for English first.</p>' : '<p>هذا الجواب بالعربية</p>'); }
  if (PAGES[u.pathname]) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(PAGES[u.pathname]); }
  res.writeHead(404); res.end('no');
});

server.listen(0, '127.0.0.1', async () => {
  const L = 'http://127.0.0.1:' + server.address().port;
  const item = (who, extra) => Object.assign({ side: 'claim', kind: 'hadith', who }, extra);
  const evidence = [
    item('1 quran by reference', { kind: 'quran', ref: '15:9' }),
    item('2 quran reference that does not exist', { kind: 'quran', ref: '115:1' }),
    item('3 quran range', { kind: 'quran', ref: '112:1-4' }),
    item('4 true Arabic, typed without vowel marks', { quote_ar: 'لا تقوم الساعة حتى تخرج نار من أرض الحجاز تضيء أعناق الإبل ببصرى', check_url_ar: AR }),
    item('5 true English', { quote_en: TRUE_EN, check_url_en: EN }),
    item('6 one word added', { quote_en: TRUE_EN.replace('a fire', 'a great fire'), check_url_en: EN }),
    item('7 the negation removed', { quote_en: TRUE_EN.replace('will not be', 'will be'), check_url_en: EN }),
    item('8 one word swapped', { quote_en: TRUE_EN.replace('Hijaz', 'Yemen'), check_url_en: EN }),
    item('9 two true pieces in the wrong order', { quote_en: 'it will throw light on the necks of the camels ... a fire will come out of the land of Hijaz', check_url_en: EN }),
    item('10 two true pieces in the right order', { quote_en: 'a fire will come out of the land of Hijaz ... throw light on the necks of the camels at Busra', check_url_en: EN }),
    item('11 a page the script cannot read', { quote_en: TRUE_EN, check_url_en: 'https://sunnah.com/bukhari:7118' }),
    item('12 a quote with no page', { quote_en: TRUE_EN }),
    item('13 a translation with its Arabic found', { quote_ar: 'حتى تخرج نار من أرض الحجاز', check_url_ar: AR, quote_en: 'until a fire comes out of the land of the Hijaz', translated_by_map: true }),
    item('14 the Arabic negation changed', { quote_ar: 'تقوم الساعة حتى تخرج نار من أرض الحجاز', check_url_ar: AR }),
    item('15 English that starts right after "not"', { quote_en: 'be established till a fire will come out of the land of Hijaz', check_url_en: EN }),
    item('16 a page of search results', { quote_en: TRUE_EN, check_url_en: 'https://shamela.ws/search?q=' + encodeURIComponent('الحجاز') }),
    item('17 a wider context that holds the quote', { quote_en: 'a fire will come out', check_url_en: EN, context_en: TRUE_EN }),
    item('18 a context that is not on the page', { quote_en: 'a fire will come out of the land of Hijaz', check_url_en: EN, context_en: 'Scholars agree that a fire will come out of the land of Hijaz in the last days' }),
    item('19 a scholar on the page of his own book', { kind: 'scholar', quote_ar: KATHIR, check_url_ar: BIDAYA, on_page_as: 'ابن كثير' }),
    item('20 the same words hung on another author', { kind: 'scholar', quote_ar: KATHIR, check_url_ar: BIDAYA, on_page_as: 'ابن حجر' }),
    item('21 a scholar quoted with no name given', { kind: 'scholar', quote_ar: KATHIR, check_url_ar: BIDAYA }),
    item('22 a hadith outside the two Sahihs', { quote_en: 'he passed a tree that the idolaters called Dhat Anwat upon which they hung their weapons', check_url_en: TIRMIDHI }),
    item('23 an encyclopedia page', { quote_en: 'The Quran is the central religious text of Islam', check_url_en: 'https://en.wikipedia.org/wiki/Quran' }),
    item('24 an encyclopedia behind a web archive', { quote_en: 'The Quran is the central religious text of Islam', check_url_en: 'https://web.archive.org/web/2024/https://en.wikipedia.org/wiki/Quran' }),
    item('25 a library search service given as the page', { quote_ar: KATHIR, check_url_ar: 'https://api.turath.io/search?ver=3&q=' + encodeURIComponent(KATHIR) }),
    item('26 an address that redirects to an encyclopedia', { quote_en: 'The Quran is the central religious text of Islam', check_url_en: L + '/to-wiki' }),
    item('27 a sentence nobody wrote, echoed back by the page from its own address', { quote_en: 'the scholars all admit that this verse was added later', check_url_en: L + '/echo?verse_key=' + encodeURIComponent('the scholars all admit that this verse was added later') }),
    item('28 a name that is on the page but nowhere near the quote', { kind: 'scholar', quote_en: 'the fire was seen by the people of the town for many nights', check_url_en: L + '/essay', on_page_as: 'Zayd al-Example' }),
    item('29 a name that stands right before the quote', { kind: 'scholar', quote_en: 'the fire was seen by the people of the town for many nights', check_url_en: L + '/essay', on_page_as: 'Ibn Sample' }),
    item('30 words the author reports from his critics', { kind: 'scholar', quote_en: 'the report was written after the event took place in the city', check_url_en: L + '/essay', on_page_as: 'An essay on the fire' }),
    item('31 a quote cut before a "but", with a negation earlier in the sentence', { kind: 'scholar', quote_en: 'that the light was seen in Busra', check_url_en: L + '/essay', on_page_as: 'An essay on the fire', context_en: 'The careful historian does not accept that the light was seen in Busra, but he grants the eruption.' }),
    item('32 a page in an old Arabic encoding', { quote_ar: 'نار من أرض الحجاز', check_url_ar: L + '/cp1256', context_ar: 'نار من أرض الحجاز' }),
    item('33 an English text served only to readers who ask for English', { quote_en: 'This English answer is served only to readers who ask for English first', check_url_en: L + '/lang' }),
    item('34 a quote that begins after a sentence ending in "not."', { quote_en: 'More filler text that separates the two parts', check_url_en: L + '/essay' }),
    item('36 an academic paper that is a PDF on its publisher\'s site', { side: 'objection', kind: 'advocate', work: '“The Grace of God” as evidence for a written Uthmanic archetype', on_page_as: 'Marijn van Putten', quote_en: 'By examining 14 early Quranic manuscripts, it is shown that this phrase is consistently spelled using only one of the two spellings', check_url_en: 'https://www.cambridge.org/core/services/aop-cambridge-core/content/view/23C45AC7BC649A5228E0DA6F6BA15C06/S0041977X19000338a.pdf/div-class-title-the-grace-of-god-as-evidence-for-a-written-uthmanic-archetype-the-importance-of-shared-orthographic-idiosyncrasies-div.pdf' }),
    item('35 a library page whose address is the chapter title, quoted with words of that title', { quote_ar: 'ثم دخلت سنة أربع وخمسين وستمائة', check_url_ar: 'https://ar.wikisource.org/wiki/' + encodeURIComponent('البداية_والنهاية/الجزء_الثالث_عشر/ثم_دخلت_سنة_أربع_وخمسين_وستمائة') }),
  ];
  const WS = 'https://ar.wikisource.org/wiki/' + encodeURIComponent('البداية_والنهاية/الجزء_الثالث_عشر/ثم_دخلت_سنة_أربع_وخمسين_وستمائة');
  const SHAMA = 'وجاء إلى دمشق كتب من المدينة النبوية على ساكنها أفضل الصلاة والسلام بخروج نار عندهم';
  evidence.push(
    item('37 a book on Arabic Wikisource, tied to its author by the page\'s own author line', { kind: 'scholar', quote_ar: 'وملخص ما أورده أبو شامة أنه قال', check_url_ar: WS, on_page_as: 'ابن كثير' }),
    item('38 the title of the book given in place of its author', { kind: 'scholar', quote_ar: 'وملخص ما أورده أبو شامة أنه قال', check_url_ar: WS, on_page_as: 'البداية والنهاية' }),
    item('39 one man quoted inside another man\'s book, said so', { kind: 'scholar', quote_ar: SHAMA, check_url_ar: WS, on_page_as: 'أبو شامة', via: { who: 'Ibn Kathir', on_page_as: 'ابن كثير', standing: 'a historian of Damascus', basis: 'his chronicle is the standard record of these years' } }),
    item('40 the same words hung on the quoted man with no word of whose book it is', { kind: 'scholar', quote_ar: SHAMA, check_url_ar: WS, on_page_as: 'أبو شامة' }),
    item('41 a "witness" tied to the person named beside the quote', { kind: 'witness', quote_en: 'the fire was seen by the people of the town for many nights', check_url_en: L + '/essay', on_page_as: 'Ibn Sample' }),
    item('42 a "witness" with nobody named', { kind: 'witness', quote_en: 'the fire was seen by the people of the town for many nights', check_url_en: L + '/essay' }),
    item('43 an invented sentence on a library\'s search page', { quote_ar: 'هذه جملة لم يكتبها أحد في أي كتاب قط', check_url_ar: 'https://ar.wikisource.org/wiki/Special:Search/' + encodeURIComponent('هذه جملة لم يكتبها أحد في أي كتاب قط') }),
    item('44 words a page hides from its readers', { quote_en: 'these hidden words are not shown to any reader of the page', check_url_en: L + '/hidden' }),
    item('45 Sahih al-Bukhari 7118', { quote_en: TRUE_EN, check_url_en: EN }),
    item('46 Sunan Abi Dawud 7118', { quote_en: TRUE_EN, check_url_en: EN }),
    item('47 a particle given as a name', { kind: 'scholar', quote_ar: KATHIR, check_url_ar: BIDAYA, on_page_as: 'ابن' }),
    item('48 a magazine article given with its publisher, whom the page names in its title', { kind: 'witness', quote_en: 'the light of the eruption was seen in a town six days away from the city', check_url_en: L + '/magazine', on_page_as: 'Peter Sample', via: { who: 'Example Company World', on_page_as: 'Example Company World', standing: 'a company magazine', basis: 'published by the company for its own readers' } }),
    item('49 the same article given with a publisher the page does not name', { kind: 'witness', quote_en: 'the light of the eruption was seen in a town six days away from the city', check_url_en: L + '/magazine', on_page_as: 'Peter Sample', via: { who: 'A Learned Journal', on_page_as: 'A Learned Journal', standing: 'a journal of record', basis: 'reviewed by scholars of the field before print' } }),
  );
  // 50-57: one quote for each way the hostile page hides words; 58-60: words it shows; 61: a page that answers one kind of reader only.
  for (const n of ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven']) evidence.push(item('5x words hidden: ' + n, { quote_en: UNSEEN(n), check_url_en: L + '/unseen' }));
  evidence.push(
    item('58 words shown before the hidden ones', { quote_en: 'The first sentence of this page is shown to everybody who opens the page', check_url_en: L + '/unseen' }),
    item('59 words hidden on paper only', { quote_en: 'These words are hidden on paper only and are shown on every screen', check_url_en: L + '/unseen' }),
    item('60 words shown after the hidden ones', { quote_en: 'The last sentence of this page stands after all the hidden words and is shown too', check_url_en: L + '/unseen' }),
    item('61 words served to one kind of reader only', { quote_en: 'These words are served to one kind of reader only and to nobody else at all', check_url_en: L + '/cloak' }),
    item('62 words hidden by a style on the element itself', { quote_en: UNSEEN('eight'), check_url_en: L + '/unseen' }),
  );
  const rb = extra => Object.assign({ side: 'claim', sought: 'a stand-in original for the test', who: 'test', reported_quote_en: 'The scholar answered this in his book', check_url_en: L + '/report', attempts: [{ where: 'the hadith files', query: 'x', url: AR, result: 'read' }] }, extra);
  const roadblocks = [
    rb({ sought_phrase: '' }),
    rb({ sought: 'an original that is in fact on a page the search lists', reported_quote_ar: 'حتى تخرج نار من أرض الحجاز', check_url_ar: AR, reported_quote_en: '', check_url_en: '', attempts: [{ where: 'the Shamela library', query: 'x', url: BIDAYA, result: 'claimed not found' }], sought_phrase: 'تخرج نار من أرض الحجاز' }),
    rb({ sought: 'words the report never quotes', sought_phrase: 'سمعت رجلا من الأعراب يخبر والدي ببصرى' }),
    rb({ sought: 'words the report quotes and no library holds', sought_phrase: NONSENSE_AR }),
    rb({ sought: 'English words the report quotes and no paper holds', sought_phrase: NONSENSE_EN }),
    rb({ sought: 'a report whose standing rests on found words', sought_phrase: '', reported_by: { standing_quote: 'This site is run by the faculty of a named university', standing_url: L + '/about' } }),
    rb({ sought: 'a report whose standing is words nobody wrote', sought_phrase: '', reported_by: { standing_quote: 'This site is the leading authority of the age on all such questions', standing_url: L + '/about' } }),
    rb({ sought: 'a report that quotes words, declared as giving none', sought_phrase: '', sought_phrase_unknown: 'the report gives no words of the original', reported_quote_en: 'The scholar answered this in his book', check_url_en: L + '/report2' }),
  ];
  const file = path.join(TMP, 'case.json');
  fs.writeFileSync(file, JSON.stringify({ questions: [{ id: 'V', evidence, roadblocks }] }));
  const verify = (f, env) => new Promise(resolve => { const c = spawn(process.execPath, [VERIFY, f], { env: Object.assign({}, process.env, env || {}) }); let stdout = '', stderr = ''; c.stdout.on('data', d => { stdout += d; }); c.stderr.on('data', d => { stderr += d; }); c.on('close', status => resolve({ status, stdout, stderr })); });
  const r = await verify(file);
  // A library whose catalogue is busy: asked of a stand-in on this machine (the script takes another catalogue address only under test).
  const file2 = path.join(TMP, 'busy.json'), words = 'The words of the author on this page of his book are these very words here';
  fs.writeFileSync(file2, JSON.stringify({ questions: [{ id: 'B', evidence: [
    { side: 'claim', kind: 'scholar', who: 'a book whose catalogue never answers', on_page_as: AUTHOR, quote_en: words, check_url_en: L + '/lib/shamela.ws/book/77/5' },
    { side: 'claim', kind: 'scholar', who: 'a book whose catalogue answers at the third asking', on_page_as: AUTHOR, quote_en: words, check_url_en: L + '/lib/shamela.ws/book/78/5' },
    { side: 'claim', kind: 'hadith', who: 'Sahih al-Bukhari 7118', quote_en: words, check_url_en: L + '/lib/shamela.ws/book/77/5' }] }] }));
  const rB = await verify(file2, { MIZAN_TEST: '1', MIZAN_TURATH: L + '/turath' }), B = JSON.parse(fs.readFileSync(file2, 'utf8')).questions[0].evidence;
  server.close();
  const out = JSON.parse(fs.readFileSync(file, 'utf8')).questions[0];
  const e = n => out.evidence[n - 1], R = n => out.roadblocks[n - 1];
  const ARABIC = new RegExp('[' + String.fromCharCode(0x621) + '-' + String.fromCharCode(0x64A) + ']');

  let n = 0, bad = 0;
  const t = (name, ok) => { n++; if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + name); };
  t('the network answered (the hadith file and quran.com were read)', e(5).check && e(5).check.en !== 'unfetchable' && e(1).check && e(1).check.en !== 'missing');
  t('1 a Quran reference is filled from quran.com: Arabic, translation and link', e(1).verified === true && /guardian/i.test(e(1).quote_en) && ARABIC.test(e(1).quote_ar) && e(1).url === 'https://quran.com/15/9');
  t('2 a Quran reference that does not exist is refused', e(2).verified === false);
  t('3 a Quran range is filled verse by verse', e(3).verified === true && /\(4\)/.test(e(3).quote_en));
  t('4 true Arabic typed without vowel marks is found', e(4).verified === true && e(4).check.ar === 'found');
  t('5 true English is found', e(5).verified === true && e(5).check.en === 'found');
  t('6 one added word is refused', e(6).verified === false && e(6).check.en === 'missing');
  t('7 a removed "not" is refused', e(7).verified === false);
  t('8 one swapped word is refused', e(8).verified === false);
  t('9 true pieces in the wrong order are refused', e(9).verified === false);
  t('10 true pieces in the right order are found, and the words skipped between them are recorded', e(10).verified === true && e(10).check.skipped.length === 1 && /and it will$/i.test(e(10).check.skipped[0].trim()));
  t('11 a page the script cannot read is refused, not waved through', e(11).verified === false && e(11).check.en === 'unfetchable');
  t('12 a quote with no page is refused', e(12).verified === false);
  t('13 a translation counts only because its Arabic was found', e(13).verified === true && e(13).check.ar === 'found' && e(13).check.en === 'translation by the map');
  t('14 Arabic that starts right after the negation is refused', e(14).verified === false);
  t('15 English that starts right after "not" is refused', e(15).verified === false);
  t('16 a page of search results is refused as a source', e(16).verified === false);
  t('17 a short quote inside a longer passage that is on the page is accepted as whole, and the page\'s title is recorded', e(17).verified === true && e(17).check.whole === true && /bukhari/i.test(e(17).page_title || ''));
  t('18 a context that is not on the page is refused', e(18).verified === false);
  t('the words before and after a found quote are recorded in the page\'s own writing', /The Hour will not be established till$/.test(e(17).check.before.trim()) && /^of the land of Hijaz,/.test(e(17).check.after.trim()));
  t('19 a scholar on the page of his own book: the library catalogue names the book and the author', e(19).verified === true && e(19).check.attribution === 'named' && /البداية والنهاية/.test(e(19).check.book) && /كثير/.test(e(19).check.author));
  t('20 the same words hung on another author are caught', e(20).verified === true && e(20).check.attribution === 'not named' && /NOT ATTRIBUTED V\/E20 .*ابن حجر/.test(r.stdout));
  t('21 a scholar quoted with no name to check is caught', e(21).check.attribution === 'no name given' && /NOT ATTRIBUTED V\/E21/.test(r.stdout));
  t('22 the gradings a hadith page carries are recorded', e(22).verified === true && Array.isArray(e(22).check.grades) && e(22).check.grades.length >= 1 && !!e(22).check.grades[0].grade);
  t('23 an encyclopedia page is refused before it is read', e(23).verified === false && /wikipedia\.org may not stand/.test(r.stdout));
  t('24 an encyclopedia behind a web archive is refused', e(24).verified === false);
  t('25 a library search service is refused as the page of a work', e(25).verified === false);
  t('26 an address that redirects to an encyclopedia is refused: every hop is looked at', e(26).verified === false && /redirects to en\.wikipedia\.org/.test(r.stdout));
  t('27 a sentence echoed back from the page\'s own address is refused', e(27).verified === false && /address itself carries the words/.test(r.stdout));
  t('28 a name far from the quote does not tie the quote to that person', e(28).verified === true && e(28).check.attribution === 'not named');
  t('29 a name right before the quote does', e(29).verified === true && e(29).check.attribution === 'named');
  t('30 "critics say" before a quote is flagged for the reader', e(30).verified === true && e(30).check.flags.some(f => /critics say/.test(f)));
  t('31 a negation earlier in the sentence and a "but" after the quote are both flagged', e(31).verified === true && e(31).check.flags.some(f => /"not" stands/.test(f)) && e(31).check.flags.some(f => /goes on after the quote with "but"/.test(f)));
  t('32 a page in an old Arabic encoding is read correctly', e(32).verified === true);
  t('33 an English quote is found on the answer the site serves to English readers', e(33).verified === true);
  t('34 a "not" that ends the sentence before is not held against the quote', e(34).verified === true);
  t('35 a chapter title in a library\'s own address is not mistaken for an echo', e(36).verified === true);
  t('36 an academic paper in PDF is read; its first page names the author, and its own title shows it is the work itself', e(35).verified === true && e(35).check.attribution === 'named' && e(35).check.work_in_title === true);
  t('48 the publisher given as "via" is tied to the page: the page names it in its title', e(48).verified === true && e(48).check.attribution === 'named' && e(48).check.via_named === true, JSON.stringify(e(48).check));
  t('49 a publisher the page does not name is not tied to it', e(49).verified === true && e(49).check.via_named === false, JSON.stringify(e(49).check));
  t('37 a book on Arabic Wikisource is tied to its author by the page\'s own author line', e(37).verified === true && e(37).check.attribution === 'named' && /catalogue, as the author/.test(e(37).check.named_in));
  t('38 the title of a book is not a person: given in place of the author, it is refused', e(38).check.attribution === 'not named' && /title of the book/.test(r.stdout));
  t('39 one man quoted inside another man\'s book is accepted when it is said so and he is named just before his words', e(39).verified === true && e(39).check.attribution === 'named' && /80 words before the quote, inside a book/.test(e(39).check.named_in));
  t('40 the same words hung on the quoted man, with no word of whose book it is, are refused', e(40).check.attribution === 'not named');
  t('41 a "witness" is tied to a person like anybody else', e(41).verified === true && e(41).check.attribution === 'named');
  t('42 calling a quote "witness" does not excuse it from naming whose words it is', e(42).check.attribution === 'no name given' && /NOT ATTRIBUTED V\/E42/.test(r.stdout));
  t('43 an invented sentence on a library\'s own search page is refused', e(43).verified === false && /search results/.test(e(43).check.ar === 'missing' ? r.stdout : ''));
  t('44 words a page hides from its readers are not words of the page', e(44).verified === false);
  const by = who => out.evidence.find(x => x.who === who) || {};
  for (const [n, how] of [['zero', 'inside a comment'], ['one', 'by a class the page\'s own style block hides'], ['two', 'in a list item with the hidden attribute'], ['three', 'struck through as deleted'], ['four', 'struck through'], ['five', 'by a class the page\'s own style block shrinks to nothing'], ['six', 'in a table cell with the hidden attribute'], ['seven', 'inside an element made fully transparent, at any depth']]) t('5x words a page hides ' + how + ' are not words of the page', by('5x words hidden: ' + n).verified === false && by('5x words hidden: ' + n).check.en === 'missing');
  t('62 words hidden by a style on the element itself, written in single quotes, are not words of the page', by('62 words hidden by a style on the element itself').verified === false);
  t('58-60 the words the same page shows are found: before the hidden ones, after them, and words a style hides on paper only', by('58 words shown before the hidden ones').verified === true && by('59 words hidden on paper only').verified === true && by('60 words shown after the hidden ones').verified === true);
  t('61 words a page serves to one kind of reader only are refused: asked again as a reader that is not a browser, the page does not give them', by('61 words served to one kind of reader only').verified === false && by('61 words served to one kind of reader only').check.one_reader_only === true && /shows these words to one kind of reader only/.test(r.stdout));
  t('a page that gives both readers the same words is found as before (the second asking changes nothing for it)', e(29).verified === true && e(29).check.one_reader_only === undefined && e(33).verified === true);
  t('a busy catalogue is asked three times and then reported as not answering: the item is "not checked", not "not his"', B[0].verified === true && B[0].check.catalogue_unanswered === true && B[0].check.attribution === 'not checked' && asked[77] >= 3 && /NOT ATTRIBUTED B\/E1 .*the library's catalogue did not answer \(HTTP 429\), so whose page this is was not checked in this run: run again/.test(rB.stdout));
  t('a catalogue that answers at a later asking is read: the author is named and nothing is left unchecked', B[1].check.attribution === 'named' && B[1].check.catalogue_unanswered === undefined && /catalogue, as the author/.test(B[1].check.named_in || ''));
  t('a hadith on a library page whose catalogue did not answer is marked so, for the check to say it was not run', B[2].verified === true && B[2].check.catalogue_unanswered === true && !B[2].check.book);
  t('45 a hadith page\'s own collection is recorded and matches the collection cited', e(45).check.collection_matches === true && /bukhari/i.test(e(45).check.collection));
  t('46 a hadith cited to one collection on the page of another is marked', e(46).check.collection_matches === false);
  t('47 a particle ("ibn") is not a name', e(47).check.attribution === 'not named' && /not a name that can tie/.test(r.stdout));
  t('every item has an id, and its signature is the one lib/mizan.js computes', out.evidence.every(x => /^E\d+$/.test(x.id)) && e(5).check.hash === sign(e(5)));
  t('a roadblock whose report is on its page is accepted', R(1).verified === true && R(1).attempts[0].fetched === 'read');
  t('a roadblock is thrown out when the words it sought are on a page it listed', R(2).verified === false && R(2).dissolved_at === BIDAYA);
  t('a roadblock is thrown out when the sought words are not words the report quotes', R(3).verified === false && /ROADBLOCK REFUSED V .*the words sought are not on the reporting page/.test(r.stdout));
  t('a roadblock is thrown out when the script finds the sought words in the library itself', R(3).machine_search.total_hits > 0 && /shamela\.ws\/book\/\d+\/\d+/.test(R(3).machine_search.first) && /NOT A ROADBLOCK: the libraries hold the sought words/.test(r.stdout));
  t('a roadblock for words no library holds stands, and each search service answered its control search', R(4).verified === true && R(4).machine_search.total_hits === 0 && R(4).machine_search.engines.length >= 2 && R(4).machine_search.engines.every(x => x.control_hits > 0 && x.hits === 0));
  t('the same in Latin script: three libraries are asked, and at least two answer their control search', R(5).verified === true && R(5).machine_search.total_hits === 0 && R(5).machine_search.engines.length === 3 && R(5).machine_search.engines.filter(x => x.control_hits > 0).length >= 2);
  t('the standing of a reporting page is found, word for word, on the page given for it', R(6).check.standing === 'found' && R(6).verified === true);
  t('a standing nobody wrote is refused', R(7).check.standing === 'missing' && R(7).verified === false);
  t('"the report gives no words" is refused when the script sees the report quoting words', R(8).check.report_quotes_words === true && R(8).verified === false);
  t('the script\'s search is signed, so editing the roadblock afterwards breaks it', R(4).machine_search.hash === signRb(R(4)) && R(4).machine_search.hash !== signRb(Object.assign({}, R(4), { sought_phrase: 'other words entirely here' })));
  t('the script exits 1 when anything was refused', r.status === 1);
  t('every refusal names the item and where the wording stops matching', /NOT FOUND V\/E6 \| claim \| hadith \| 6 one word added \| en: first \d+ of \d+ words match; it stops at/.test(r.stdout));

  fs.rmSync(TMP, { recursive: true, force: true });
  if (bad) console.log(r.stdout.split('\n').filter(l => /^(NOT|ROADBLOCK|MIZAN)/.test(l)).map(l => l.slice(0, 330)).join('\n') + '\n' + String(r.stderr || '').slice(0, 1200));
  console.log(bad ? 'verify eval: ' + bad + ' of ' + n + ' FAILED' : 'verify eval: ' + n + '/' + n + ' passed');
  process.exitCode = bad ? 1 : 0;
});
