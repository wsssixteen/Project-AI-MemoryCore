#!/usr/bin/env node
// mizan ab — the same question through a plain research-and-fact-check pass and through the Mizan loop, measured by the same script.
// Nothing here is assumed about either output: every passage each one puts in quotation marks is searched, word for word, on the pages
// that output itself cites, by the same reader (verify.js). Steps a plain pass does not have are shown as "no such step", not as zero.
// It measures what each output can prove. It does not judge which conclusion is true.
// Usage: node domain/mizan/ab.js --mizan <case folder | case.json> --plain <json: { "baseline": [ { id, answer, other_side, reply, open_issue, strength, sources: [ { url } ] } ] } | a workflow result holding it> [--json]
'use strict';
const fs = require('fs');
const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'lib', 'mizan.js'));
const V = require(path.join(__dirname, 'verify.js'));

const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const CLAIM_LIBS = ['shamela.ws', 'islamweb.net', 'islamqa.info', 'ar.wikisource.org', 'tafsir.app', 'api.quran.com', 'quran.com', 'cdn.jsdelivr.net', 'sunnah.com', 'dorar.net', 'binbaz.org.sa', 'dar-alifta.org', 'ketabonline.com', 'api.turath.io'];
const hostOf = u => M.hostsIn(u)[0] || '';
const inLib = u => CLAIM_LIBS.some(h => hostOf(u) === h || hostOf(u).endsWith('.' + h));
const ARABIC = new RegExp('[' + String.fromCharCode(0x621) + '-' + String.fromCharCode(0x64A) + ']{3}');
const unwrap = d => (d && d.result !== undefined ? (typeof d.result === 'string' ? JSON.parse(d.result) : d.result) : d);
const words = t => String(t || '').trim().split(/\s+/).filter(Boolean).length;
// Errors the earlier versions carried. The same test is applied to the text of both outputs.
const KNOWN = [
  { id: 'T2', name: 'treats an eruption near Madinah in 641 CE as an established event', test: t => /\b641\b/.test(t) && !/641[^.]{0,200}(13[,.]?\s?000|re-?dated|not (an? )?(historical|real)|no (such )?eruption|is false|was false|mistaken|does not belong|misdated)/i.test(t) && !/(13[,.]?\s?000|re-?dated|misdated)[^.]{0,200}641/i.test(t) },
  { id: 'T2', name: 'says nobody of that time reported the light seen at Busra', test: t => /(no|not any|without) (opened |known |surviving )?(contemporary|eyewitness)[^.]{0,80}busra|busra[^.]{0,80}(is|was) (not|never) (reported|attested)/i.test(t) },
];

async function quotesOnPages(spans, urls) {
  const pages = [];
  for (const u of urls.filter(x => /^https?:/.test(x) && !M.banned(x)).slice(0, 40)) { const p = await V.get(u); if (p.ok) pages.push(p); }
  let found = 0;
  for (const s of spans) if (pages.some(p => !V.locate(s, p).miss)) found++;
  return { found, readable: pages.length };
}
async function plainRow(b) {
  const text = [b.answer, b.other_side, b.reply, b.open_issue].filter(Boolean).join('\n');
  const urls = [...new Set((b.sources || []).map(s => s.url).filter(Boolean).concat(text.match(/https?:\/\/[^\s)"'<>\]]+/g) || []))];
  const spans = [...new Set([...text.matchAll(/"([^"\n]{20,600})"|“([^”\n]{20,600})”/g)].map(m => (m[1] || m[2]).trim()).filter(s => words(s) >= 8))];
  const q = await quotesOnPages(spans, urls);
  return { text, row: {
    'passages given in quotation marks (8 words or more)': spans.length,
    'of them found word for word, by the script, on a page that output cites': q.found,
    'of them in Arabic, the claim side\'s own language': spans.filter(s => ARABIC.test(s)).length,
    'pages cited': urls.length,
    'pages cited that the script could read': q.readable,
    'pages cited from the claim side\'s own libraries': urls.filter(inLib).length,
    'encyclopedia, wiki, forum or polemic pages cited': urls.filter(u => M.banned(u)).length,
    'quotes read in context by a second reader': 'no such step',
    'points of both sides marked one by one': 'no such step',
    'marks that rest on a found quote': 'no such step',
    'turns of the exchange tied to a found quote': 'no such step',
    'gaps declared as roadblocks with a proven search': 'no such step',
    'judges who had to agree': 1,
    'conclusion': 'label: ' + (b.strength || '?'),
  } };
}
async function mizanRow(q) {
  const copy = JSON.parse(JSON.stringify({ questions: [q] }));
  await V.verifyDoc(copy, {});
  const ev = copy.questions[0].evidence || [], quoted = ev.filter(e => e.kind !== 'quran'), ps = q.premises || [], v = q.verdict || {};
  const urls = [...new Set(ev.flatMap(e => [e.check_url_ar, e.check_url_en]).filter(Boolean))];
  const text = [v.short, v.reasoning, v.crux].concat((q.exchange || []).map(t => t.text), ps.map(p => p.text + ' — ' + p.status + '. ' + (p.why || ''))).filter(Boolean).join('\n');
  return { text, row: {
    'passages given in quotation marks (8 words or more)': quoted.length,
    'of them found word for word, by the script, on a page that output cites': quoted.filter(M.found).length,
    'of them in Arabic, the claim side\'s own language': quoted.filter(e => ARABIC.test(e.quote_ar || '')).length,
    'pages cited': urls.length,
    'pages cited that the script could read': urls.length - new Set(quoted.filter(e => !M.found(e)).flatMap(e => [e.check_url_ar, e.check_url_en]).filter(Boolean)).size,
    'pages cited from the claim side\'s own libraries': urls.filter(inLib).length,
    'encyclopedia, wiki, forum or polemic pages cited': urls.filter(u => M.banned(u)).length,
    'quotes read in context by a second reader': quoted.filter(e => e.cut && e.cut_by).length + ' of ' + quoted.length,
    'points of both sides marked one by one': ps.filter(p => p.side === 'claim').length + ' of the claim, ' + ps.filter(p => p.side === 'objection').length + ' of the objection',
    'marks that rest on a found quote': ps.filter(p => (p.status === 'confirmed' || p.status === 'false' || p.status === 'disputed') && (p.rests_on || []).length && p.rests_on.every(id => M.found(ev.find(e => e.id === id)))).length + ' of ' + ps.filter(p => p.status === 'confirmed' || p.status === 'false' || p.status === 'disputed').length,
    'turns of the exchange tied to a found quote': (q.exchange || []).filter(t => !t.own_reasoning && t.faithful === true).length + ' of ' + (q.exchange || []).filter(t => !t.own_reasoning).length + ' named turn(s)',
    'gaps declared as roadblocks with a proven search': (q.roadblocks || []).filter(rb => !M.roadblockFaults(rb).length).length + ' of ' + (q.roadblocks || []).length,
    'judges who had to agree': 2,
    'conclusion': v.outcome + ', as of ' + (v.as_of || '?'),
  } };
}

(async () => {
  let target = arg('--mizan'); if (!target || !arg('--plain')) { console.error('usage: node domain/mizan/ab.js --mizan <case folder | case.json> --plain <baseline.json> [--json]'); process.exitCode = 2; return; }
  if (fs.statSync(target).isDirectory()) target = path.join(target, 'case.json');
  const cases = JSON.parse(fs.readFileSync(target, 'utf8')).questions || [];
  const base = unwrap(JSON.parse(fs.readFileSync(arg('--plain'), 'utf8'))), plain = {};
  for (const b of (base.baseline || (Array.isArray(base) ? base : [base]))) if (b && b.id) plain[b.id] = b;
  const out = [];
  for (const c of cases) {
    const m = await mizanRow(c), p = plain[c.id] ? await plainRow(plain[c.id]) : null;
    out.push({ id: c.id, question: c.question, rows: Object.keys(m.row).map(k => ({ measure: k, plain: p ? p.row[k] : 'not run', mizan: m.row[k] })),
      known: KNOWN.filter(k => k.id === c.id).map(k => ({ error: k.name, plain: p ? (k.test(p.text) ? 'repeats it' : 'does not') : 'not run', mizan: k.test(m.text) ? 'repeats it' : 'does not' })) });
  }
  if (process.argv.includes('--json')) { process.stdout.write(JSON.stringify(out, null, 1) + '\n'); return; }
  for (const q of out) {
    console.log('\n== ' + q.id + ': ' + q.question);
    console.log('| Measured by the same script | Plain pass | Mizan loop |\n|---|---|---|');
    for (const r of q.rows) console.log('| ' + r.measure + ' | ' + r.plain + ' | ' + r.mizan + ' |');
    for (const k of q.known) console.log('| Known error of the earlier version: ' + k.error + ' | ' + k.plain + ' | ' + k.mizan + ' |');
  }
  console.log('\nMIZAN AB: ' + out.length + ' question(s). Counts of what each output can prove; not a judgment of which conclusion is true.');
})();
