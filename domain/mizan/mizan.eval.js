#!/usr/bin/env node
// mizan.eval.js — tests of lib/mizan.js, domain/mizan/case.js and domain/mizan/prove.js (no network; a few seconds).
// GREEN:  an honest, complete case, built from the parts of separate agents, passes every check; so do honest variants.
// RED:    for every check, a case with exactly that fault is refused by exactly that check.
// MIRROR: the outcome table gives the mirror answer when the two sides are swapped, for every combination of marks.
// REPLAY: the faults of the first two DawahMap versions (2026-10-10) are refused.
// The word-for-word reading of sources is tested live in verify.eval.js; here a found quote is simulated by sealing it.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
process.env.MIZAN_TEST = '1';
process.env.MIZAN_TODAY = '2026-10-10';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mizan-eval-'));
process.env.MIZAN_DIR = TMP;
const LIB = path.join(__dirname, '..', '..', 'lib', 'mizan.js');
const M = require(LIB);
const C = require(path.join(__dirname, 'case.js'));
const P = require(path.join(__dirname, 'prove.js'));

// ---------- an honest case, as the parts of separate agents ----------
const rec = (where, query, result, url) => Object.assign({ where, query, result }, url ? { url } : {});
const Q1 = 'these are the very words that Ibn Example wrote on page 1 of it', Q3 = 'the collection itself was certainly compiled centuries before that year';
const speaker = (kind, who, n, extra) => Object.assign({ kind, who, work: 'The book of ' + who, ref: 'vol. 1 p. ' + n, on_page_as: who, quote_en: 'these are the very words that ' + who + ' wrote on page ' + n + ' of it', check_url_en: 'https://shamela.ws/book/1/' + n }, extra);
const REASON = 'The objection needs its dating to hold [O1], and the two records quoted against it show that the dating is wrong, so that point is false. The claim needs the report to exist before the event [C1], and the collection that carries it was written four centuries earlier, which the quoted pages confirm. With the dating gone nothing remains of the objection, while the report and the eyewitness account both stand on found words. The detail about the distance [C2] is a separate matter and is set aside.';
const RB = {
  sought: 'the original passage of the answer by al-Example', sought_phrase: 'four exact sought words here', who: 'al-Example', barrier: 'printed-not-online',
  reported_by: { title: 'An article on the answer', author: 'Author Reporter', url: 'https://islamqa.info/en/answers/1', standing: 'a supervised fatwa site', standing_quote: 'this site is supervised by a named scholar of the subject', standing_url: 'https://islamqa.info/en/about' },
  reported_quote_en: 'al-Example answered this in his book in these words', check_url_en: 'https://islamqa.info/en/answers/1',
  attempts: [rec('turath.io', 'four exact sought words here', '0 hits'), rec('Arabic Wikisource', 'four exact sought words here', '0 hits'), rec('Google', 'al-Example answer original text', 'only the article'), rec('archive.org', 'al-Example book scan', 'no scan of this book', 'https://archive.org/advancedsearch.php?q=al-Example')],
  statement: 'al-Example may have answered this in his book, but I did not find the original text in the places searched on this date; I found only the article by Author Reporter, whose standing is a supervised fatwa site.',
};
const SECOND = { roadblock_id: 'R010-1', result: 'not found', attempts: [rec('ketabonline.com', 'sought words of al-Example', 'nothing'), rec('Google Scholar', 'al-Example answer', 'nothing')] };
const MARKS = [
  { id: 'C1', status: 'confirmed', rests_on: ['E010-1', 'E010-2'], level: 'a contemporary document', why: 'the record dates the collection' },
  { id: 'C2', status: 'unsupported', rests_on: [], level: 'one report', why: 'only one man is quoted for it and no second witness was found' },
  { id: 'O1', status: 'false', rests_on: ['E020-2'], level: 'a contemporary document', why: 'the critic himself dates the collection earlier' },
  { id: 'O2', status: 'unsupported', rests_on: [], level: 'bare possibility', why: 'no manuscript or author is cited for a later addition' }];
function parts(o) {
  const x = o || {};
  return {
    '010-claim': { role: 'claim', side: 'claim', position: 'The report was written down before the event', short: 'The report is earlier', overstated: [], latest: 'nothing newer',
      candidates: [{ who: 'Ibn Example', why: 'he records the event and ties it to the report', url: 'https://shamela.ws/book/1/1' }, { who: 'al-Other', not_quoted: 'weaker', why: 'he repeats it later and adds nothing of his own', url: 'https://shamela.ws/book/2/1' }],
      points: [{ id: 'C1', text: 'The collection that carries the report was written before the event' }],
      evidence: [speaker('scholar', 'Ibn Example', 1), { kind: 'hadith', who: 'Sahih al-Bukhari 7118', ref: '7118', quote_en: 'The Hour will not be established till a fire will come out', check_url_en: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/7118.json' }, { kind: 'quran', ref: '15:9' }].concat(x.claimEvidence || []),
      roadblocks: x.roadblock ? [RB] : [],
      searched: [rec('turath.io', 'نار الحجاز بصرى', '6 hits'), rec('islamweb library', 'نار الحجاز', 'found')] },
    '020-objection': { role: 'objection', side: 'objection', name: 'The report was written after the event', by: 'Dr Critic', text: 'The report was composed after the event it describes.',
      candidates: [{ who: 'Dr Critic', why: 'he states the objection in its fullest academic form', url: 'https://plato.stanford.edu/entries/example/' }, { who: 'Prof Other', not_quoted: 'weaker', why: 'he repeats it more briefly and adds nothing new', url: 'https://archive.org/details/other' }],
      other_objections: ['That the wording of the report is too general to count as a prediction'], latest: 'nothing newer',
      points: [{ id: 'O1', text: 'The event happened before the collection was written' }],
      evidence: [speaker('advocate', 'Dr Critic', 2, { check_url_en: 'https://plato.stanford.edu/entries/example/' }), speaker('advocate', 'Dr Critic', 3, { quote_en: Q3, check_url_en: 'https://plato.stanford.edu/entries/example2/' })],
      searched: [rec('OpenAlex full text', 'Hijaz fire hadith dating', '3 papers'), rec('Google Scholar', 'ex eventu hadith fire', '2 papers')] },
    '030-extract': { role: 'extract', points: [{ id: 'C2', side: 'claim', text: 'The light was seen from the far town' }, { id: 'O2', side: 'objection', text: 'A later hand added the report to the collection' }],
      needs: [{ id: 'C1', needed: true, bears_on: 'if the collection is later, the report proves nothing' }, { id: 'C2', needed: false, not_needed_because: 'the order of the dates does not depend on who saw the light' }, { id: 'O1', needed: true, bears_on: 'the whole objection is this order of dates' }, { id: 'O2', needed: false, not_needed_because: 'the objection as stated is about the date, not about a later hand' }] },
    '110-read': { role: 'read', readings: ['E010-1', 'E010-2', 'E020-1', 'E020-2'].concat(x.claimEvidence ? ['E010-4'] : []).map(id => ({ evidence_id: id, cut: 'faithful', stance: 'own', who_matches: true, note: 'the sentence is complete and he speaks in his own name here' })),
      later: ['E010-1', 'E020-1', 'E020-2'].map(id => ({ evidence_id: id, searched: [rec('his later works', 'later statements on the report', 'nothing different found')], result: 'none found' })) },
    '120-check': { role: 'check', premises: MARKS },
    '130-reply': { role: 'reply', side: 'claim', nothing_new: true, turns: [{ who: 'Ibn Example', when: '1350', text: 'He records the event and ties it to the earlier report in the collection.', evidence_ref: ['E010-1'] }] },
    '140-counter': { role: 'counter', side: 'objection', nothing_new: true, turns: [{ who: 'Dr Critic', when: '2010', text: 'He grants the date of the collection and questions the far sighting only.', evidence_ref: ['E020-2'] }] },
    // The objection spoke last, so the claim side is given a turn after it, and says it has nothing to add.
    '145-reply': { role: 'reply', side: 'claim', nothing_new: true, turns: [] },
    '150-read': { role: 'read', turn_checks: [{ turn: 1, faithful: true, note: 'the turn says what the quote says' }, { turn: 2, faithful: true, note: 'the turn says what the quote says' }],
      bearings: [{ point_id: 'C1', evidence_id: 'E010-1', bears: 'supports', words: 'the very words that Ibn Example wrote on page 1' }, { point_id: 'C1', evidence_id: 'E010-2', bears: 'supports', words: 'The Hour will not be established till a fire' }, { point_id: 'O1', evidence_id: 'E020-2', bears: 'contradicts', words: 'certainly compiled centuries before that year' }] },
    '160-stop': { role: 'stop', nothing_new_confirmed: true, leads: [], looked_for_more: [rec('turath.io', 'رد على القول بتأخر الحديث', 'nothing later'), rec('Google Scholar', 'Dr Critic later reply', 'nothing later')] },
    '800-second': x.roadblock ? { role: 'second', second: [SECOND] } : null,
    '900-judge': { role: 'judge', premises: MARKS, swap_test: { standard: 'A date counts when a written record made at the time gives it.', to_claim: 'The collection is dated by its own copies and by the critic himself.', to_objection: 'The objection gives no record for its order of dates.' },
      verdict: { outcome: 'refuted', short: 'The order of dates the objection needs is wrong.', crux: 'The event happened before the collection was written', reasoning: REASON, claim_assumptions: ['that the surviving copies of the collection reproduce its original text'], claim_corrections: [], objection_corrections: [], scope_change: 'none', as_of: '2026-10-10', would_change: 'A dated copy of the collection that lacks the report would reopen it.', not_shown: 'This does not show how the report came to be known beforehand.', evidence_hash: x.hash || '' } },
    '910-judge2': { role: 'judge2', second_opinion: { crux: 'the order of the dates', premises: [{ id: 'C1', status: 'confirmed' }, { id: 'O1', status: 'false' }], needed_disagree: [], needed_wrongly: [], evidence_hash: x.hash || '' } },
    '920-swap': { role: 'swap', swap: { confirmed: true, note: 'the same standard of a dated written record is applied to both' } },
  };
}
// Stands in for verify.js: marks an item as found, with what a real run would record about its page.
function seal(it) {
  if (it.kind === 'quran') Object.assign(it, { who: 'Quran ' + it.ref, quote_ar: 'x', quote_en: 'y' });
  const extra = it.check_extra || {}; delete it.check_extra;
  it.verified = true;
  it.check = Object.assign({ ar: it.quote_ar ? 'found' : '', en: it.quote_en && !it.translated_by_map ? 'found' : '', before: 'six words that stand before it', after: 'six words that stand after it', skipped: [], flags: [], page_title: 'the title of the page' }, it.kind !== 'quran' && it.kind !== 'hadith' ? { attribution: 'named', named_in: 'the library catalogue, as the author' } : {}, extra);
  it.check.hash = M.sign(it);
  return it;
}
function sealRb(rb) { rb.verified = true; rb.check = { en: 'found', standing: 'found', hash: M.signRb(rb) }; rb.machine_search = { phrase: rb.sought_phrase, script: 'latin', engines: [{ name: 'OpenAlex', control_hits: 9, hits: 0 }, { name: 'Internet Archive', control_hits: 4, hits: 0 }], leads: [], found_at: '', total_hits: 0, first: '', hash: M.signRb(rb) }; return rb; }
let dirNo = 0;
// Writes the parts, the provenance and the case file of one question into a new folder, as a real run leaves them.
function makeDir(o, change) {
  const dir = path.join(TMP, 'run' + (++dirNo), 'G1'), write = ps => { for (const [name, p] of Object.entries(ps)) if (p) fs.writeFileSync(path.join(dir, 'parts', name + '.json'), JSON.stringify(p, null, 1)); };
  fs.mkdirSync(path.join(dir, 'parts'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'question.json'), JSON.stringify(Object.assign({ id: 'G1', question: 'Did the report come before the event it describes?', plain: 'A test question for the scale.', claim: 'The report was written down long before the event took place', sides: { claim: { who: 'Muslim scholars', script: 'arabic' }, objection: { who: 'academic critics', script: 'latin' } } }, o && o.rules ? { rules: o.rules } : {})));
  fs.writeFileSync(path.join(dir, '..', 'asked.json'), JSON.stringify({ asked: ['G1'] }));
  const build = ps => { if (change) change(ps); write(ps); };
  build(parts(o));
  let q = C.assemble(dir).q; q.evidence.forEach(seal); q.roadblocks.forEach(sealRb);
  build(parts(Object.assign({}, o, { hash: M.evidenceHash(q) })));
  const prov = { provenance: { transcripts: 99, newest_search: '2026-10-10T08:00:00.000Z', searches_listed: 0, unproven: [], parts: C.readParts(dir).parts.map((p, i) => Object.assign({ part: p.name, sha1: p.sha1, agent: 'agent' + i, label: p.name + ':G1', writers: 1, content_matches: true, label_matches: true }, { model: /-judge$/.test(p.name) ? 'model-b' : 'model-a' }, /-(judge2?|translate|second)$/.test(p.name) ? { sealed: true, saw: [] } : {})) }, searches: {} };
  q = C.assemble(dir).q; q.roadblocks.forEach(sealRb);
  for (const rb of q.roadblocks) prov.searches[rb.id] = { first_proved: rb.attempts.length, first_total: rb.attempts.length, first_answered: rb.attempts.length, second_proved: 2, second_total: 2, second_answered: 2, independent: true, hash: M.signRb(rb) };
  fs.writeFileSync(path.join(dir, 'provenance.json'), JSON.stringify(prov));
  q = C.assemble(dir).q; q.evidence.forEach(seal); q.roadblocks.forEach(sealRb);
  fs.writeFileSync(path.join(dir, 'case.json'), JSON.stringify({ asked: ['G1'], questions: [q] }, null, 1));
  return { dir, q };
}
const BASE = makeDir().q, BASE_RB = makeDir({ roadblock: true }).q;
const good = () => JSON.parse(JSON.stringify(BASE));
const ev = (q, id) => q.evidence.find(e => e.id === id), pr = (q, id) => q.premises.find(p => p.id === id);
const S = q => ev(q, 'E010-1'), H = q => ev(q, 'E010-2'), A1 = q => ev(q, 'E020-1'), A2 = q => ev(q, 'E020-2');
const failing = q => [...new Set(M.CHECKS.flatMap(([id, , fn]) => fn(q).filter(f => f.level === 'FAIL').map(() => id)))];
const why = (q, id) => M.CHECKS.find(c => c[0] === id)[2](q).filter(f => f.level === 'FAIL').map(f => f.text).join(' / ');
const rejudge = q => { q.verdict.evidence_hash = M.evidenceHash(q); if (q.verdict.second_opinion) q.verdict.second_opinion.evidence_hash = M.evidenceHash(q); return q; };   // both judges rule again
const second = (q, marks) => { q.verdict.second_opinion.premises = Object.entries(marks).map(([id, status]) => ({ id, status })); };
const link = (q, point, evidence, bears) => { q.bearings = q.bearings.filter(b => !(b.point === point && b.evidence === evidence)); q.bearings.push({ point, evidence, bears, words: 'words of the quote', part: '150-read' }); };
const goodRb = (extra, after) => { const rb = JSON.parse(JSON.stringify(BASE_RB.roadblocks[0])); Object.assign(rb, extra); if (extra) { sealRb(rb); const n1 = (rb.attempts || []).length, n2 = ((rb.second_search || {}).attempts || []).length; rb.search_proof = { first_proved: n1, first_total: n1, first_answered: n1, second_proved: n2, second_total: n2, second_answered: n2, independent: true, hash: M.signRb(rb) }; } if (after) after(rb); return rb; };

let n = 0, bad = 0;
const t = (name, ok, note) => { n++; if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !note ? '' : '   -> ' + note)); };
const green = (name, q, want) => { const f = failing(q), o = M.outcome(q); t('GREEN ' + name, f.length === 0 && (!want || o.final === want), f.map(id => id + ': ' + why(q, id)).join(' || ') + ' | outcome ' + JSON.stringify(o)); };
// RED: the fault is refused by the named check (other checks may also object when the fault touches them).
const red = (check, name, mutate) => { const q = good(); mutate(q); const f = failing(q); t('RED   ' + check + ' — ' + name, f.includes(check), 'failed checks: ' + (f.join(', ') || 'none')); };
// CAP: the fault does not fail a check; it turns the outcome into "not determined", and the report says why.
const cap = (name, mutate, re) => { const q = good(); mutate(q); const o = M.outcome(q); t('CAP   ' + name, o.final === 'not-determined' && o.caps.some(c => re.test(c)), JSON.stringify(o)); };

// ---------- GREEN ----------
green('an honest case built from the parts of ' + BASE.parts.length + ' separate agents passes all ' + M.CHECKS.length + ' checks, and the marks give "refuted"', good(), 'refuted');
green('a proven roadblock on the side that is ahead is accepted beside the evidence', JSON.parse(JSON.stringify(BASE_RB)), 'refuted');
{ // The objection wins: the same table the other way round.
  const q = good();
  Object.assign(pr(q, 'C1'), { status: 'false', rests_on: ['E020-2'] }); Object.assign(pr(q, 'O1'), { status: 'confirmed', rests_on: ['E020-1'] });
  link(q, 'C1', 'E020-2', 'contradicts'); link(q, 'O1', 'E020-1', 'supports'); q.bearings = q.bearings.filter(b => !(b.point === 'C1' && b.bears === 'supports') && !(b.point === 'O1' && b.bears === 'contradicts'));
  Object.assign(q.verdict, { outcome: 'objection-stands', crux: pr(q, 'C1').text, objection_assumptions: ['that the date given by the critic is itself reliable'] }); second(q, { C1: 'false', O1: 'confirmed' });
  green('"objection-stands" passes when a point the claim needs is false and the objection is sound', q, 'objection-stands');
}
{ const q = good();
  Object.assign(pr(q, 'C1'), { status: 'unsupported', rests_on: [], why: 'no dated record of the collection was found on either side', looked: [rec('turath.io', 'تاريخ تأليف الكتاب', 'nothing'), rec('OpenAlex', 'date of the collection', 'nothing')] });
  Object.assign(pr(q, 'O1'), { status: 'confirmed', rests_on: ['E020-1'] }); link(q, 'O1', 'E020-1', 'supports'); q.bearings = q.bearings.filter(b => b.point !== 'C1' && !(b.point === 'O1' && b.bears === 'contradicts'));
  Object.assign(q.verdict, { outcome: 'claim-unsupported', crux: pr(q, 'C1').text, objection_assumptions: ['that the date given by the critic is itself reliable'] }); second(q, { C1: 'unsupported', O1: 'confirmed' });
  green('"claim-unsupported", the mirror of "answered", passes when the claim could not support a point it needs', q, 'claim-unsupported');
}
{ const q = good();
  Object.assign(pr(q, 'O1'), { status: 'unsupported', rests_on: [], why: 'no dated record was found for the order the objection needs', looked: [rec('OpenAlex full text', 'date of the event before the collection', 'nothing'), rec('Internet Archive', 'event before the collection', 'nothing')] });
  q.bearings = q.bearings.filter(b => b.point !== 'O1'); Object.assign(q.verdict, { outcome: 'answered' }); second(q, { C1: 'confirmed', O1: 'unsupported' });
  green('"answered" passes when the objection could not support a point it needs, with two searches for it on record', q, 'answered');
}
{ const q = good();
  Object.assign(pr(q, 'O1'), { status: 'disputed', rests_on: ['E010-1', 'E020-2'], why: 'each side quotes a dated record and the two records disagree' }); link(q, 'O1', 'E010-1', 'contradicts'); link(q, 'O1', 'E020-2', 'supports');
  Object.assign(q.verdict, { outcome: 'open', crux: pr(q, 'O1').text }); second(q, { C1: 'confirmed', O1: 'disputed' });
  green('"open" passes when a needed point has a found quote from each side, one for and one against', q, 'open');
}
{ const q = good();
  for (const id of ['C1', 'O1']) { Object.assign(pr(q, id), { status: 'unsupported', rests_on: [], why: 'nothing dated was found for it in either library', looked: [rec('turath.io', 'تاريخ الكتاب والحادثة', 'nothing'), rec('OpenAlex', 'order of the dates', 'nothing')] }); }
  q.bearings = []; Object.assign(q.verdict, { outcome: 'neither-holds', crux: pr(q, 'C1').text }); second(q, { C1: 'unsupported', O1: 'unsupported' });
  green('"neither-holds" passes: an honest "neither side showed it" has a place', q, 'neither-holds');
}
{ const q = good(); q.exchange.push({ side: 'claim', who: 'The map (own reasoning, for the claim side)', own_reasoning: true, evidence_ref: [], checks: [], text: 'Dr Critic himself writes that "the collection itself was certainly compiled centuries before that year".' }); q.exchange_end.last_word = 'claim'; q.exchange_end.declined.objection = '175-counter';
  green('words inside quotation marks that are a found quote are not the case\'s own voice', q, 'refuted');
}
{ const q = good(); q.evidence.push(seal({ id: 'E9', side: 'claim', kind: 'hadith', who: 'Sahih Muslim 55', ref: '55', quote_ar: 'الدين النصيحة', check_url_ar: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-muslim/55.json', cut: 'faithful', cut_by: 'context reader (part 110-read)', check_extra: { whole: true } })); rejudge(q);
  green('a short hadith quoted whole is accepted', q);
}
{ const q = good(); q.evidence.push(seal({ id: 'E9', side: 'claim', kind: 'hadith', who: 'Jami al-Tirmidhi 2180', ref: '2180', quote_en: 'he passed a tree that the idolaters called Dhat Anwat', check_url_en: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-tirmidhi/2180.json', cut: 'faithful', cut_by: 'context reader (part 110-read)', check_extra: { grades: [{ name: 'Al-Albani', grade: 'Sahih' }] } })); rejudge(q);
  green('a hadith outside the two Sahihs passes on the gradings its page carries', q);
}
{ const q = good(); S(q).quote_en = 'the report came down to us whole ... and so it is'; seal(S(q)); rejudge(q);
  green('dots that are the author\'s own (the pieces stand side by side on the page) do not make a quote "stitched"', q);
}
{ const q = good(); A1(q).check_url_en = 'https://www.cambridge.org/core/journals/x/article/the-book-of-dr-critic'; A1(q).check_extra = { work_in_title: true, authored: true, named_in: 'the page\'s own author tag' }; seal(A1(q)); rejudge(q);
  green('a journal page whose author tag names the author and whose title is the work\'s is the work itself: no "quoted by" is asked', q);
}

// ---------- MIRROR: swap the sides, and the answer swaps with them ----------
{ const ST = ['confirmed', 'false', 'unsupported', 'disputed'], MIRROR = { refuted: 'objection-stands', 'objection-stands': 'refuted', answered: 'claim-unsupported', 'claim-unsupported': 'answered', open: 'open', 'neither-holds': 'neither-holds', 'not-determined': 'not-determined' };
  let ok = true, seen = new Set();
  for (const c of ST) for (const o of ST) {
    const a = good(), b = good();
    pr(a, 'C1').status = c; pr(a, 'O1').status = o; second(a, { C1: c, O1: o });
    pr(b, 'C1').status = o; pr(b, 'O1').status = c; second(b, { C1: o, O1: c });
    const x = M.outcome(a).first, y = M.outcome(b).first; seen.add(x);
    if (MIRROR[x] !== y) { ok = false; console.log('   claim ' + c + ', objection ' + o + ' gives ' + x + '; swapped gives ' + y); }
  }
  t('MIRROR for all 16 combinations of marks on the needed points, swapping the sides gives the mirror outcome', ok);
  t('MIRROR the table reaches every outcome a judge can write (' + [...seen].sort().join(', ') + ')', ['refuted', 'answered', 'objection-stands', 'claim-unsupported', 'open', 'neither-holds'].every(o => seen.has(o)));
  const q = good(); q.premises.push(Object.assign({}, pr(q, 'C1'), { id: 'C9', status: 'unsupported', rests_on: [], why: 'a second needed point of the claim with nothing found for it', looked: [rec('a', 'b c', 'd'), rec('e', 'f g', 'h')] })); q.points.push({ id: 'C9', side: 'claim', text: 'x', from: 'neutral extractor', needed: true }); second(q, { C1: 'confirmed', C9: 'unsupported', O1: 'false' });
  t('MIRROR a claim with one needed point confirmed and another unsupported is not "sound": the tie no longer goes to the claim', M.outcome(q).first === 'neither-holds', M.outcome(q).first);
}

// ---------- CAP: what stands in the way of a firm outcome ----------
cap('the two judges mark a needed point differently', q => second(q, { C1: 'confirmed', O1: 'unsupported' }), /O1 \(false \/ unsupported\)/);
{ const q = good(); Object.assign(pr(q, 'O1'), { status: 'disputed', rests_on: ['E010-1', 'E020-2'], why: 'each side quotes a dated record and the two records disagree' }); link(q, 'O1', 'E010-1', 'contradicts'); link(q, 'O1', 'E020-2', 'supports'); Object.assign(pr(q, 'O2'), { needed: true, bears_on: 'a second step the objection needs for its case' }); second(q, { C1: 'confirmed', O1: 'disputed', O2: 'disputed' }); q.verdict.second_opinion.needed_wrongly = ['O2'];
  const o = M.outcome(q); t('where both judges reach "open", their differences on single points are shown beside it and do not withhold it', o.final === 'open' && o.caps.length === 0 && o.notes.length === 2, JSON.stringify(o)); }
{ const q = good(); second(q, { C1: 'confirmed', O1: 'unsupported' }); const o = M.outcome(q); t('where the two judges reach different outcomes, the report says which', o.final === 'not-determined' && /different outcomes \("refuted" and "answered"\)/.test(o.caps.join(' ')), JSON.stringify(o)); }
cap('the second judge holds a point was wrongly set aside', q => { q.verdict.second_opinion.needed_disagree = ['O2']; }, /wrongly set aside/);
cap('the second judge holds a "needed" point is not needed (a strawman cannot carry "refuted")', q => { q.verdict.second_opinion.needed_wrongly = ['O1']; }, /does not need O1/);
cap('the exchange stopped at the round limit', q => { q.exchange_end.stopped_by = 'round-limit'; }, /stopped before a neutral search/);
cap('the last search found a published answer that is not on the table', q => { q.exchange_end.leads = ['al-Later answered this in his book, at shamela.ws/book/9/9']; }, /not yet on the table/);
cap('a point was never examined', q => { q.exchange_end.unchecked = ['O2']; }, /never examined/);
cap('the side that would lose has a source that could not be reached', q => { q.roadblocks.push(goodRb({ side: 'objection' })); }, /could not be reached/);
// An objection no published critic has made: said in the open, with the searches on record; the objection side then has only reasoning to offer.
const builtObjection = q => {
  q.objection.by = 'No critic whose own words on this report could be read; the objection is argued from the specialists of the claim side';
  for (const e of [A1(q), A2(q)]) { Object.assign(e, { kind: 'scholar', who: 'Ibn Example' }); seal(e); }
  q.exchange[1] = { side: 'objection', who: 'The map (own reasoning, for the objection side)', own_reasoning: true, evidence_ref: [], checks: [], text: 'The date of the collection is granted; what stays in question is the far sighting only.' };
  q.searched.objection_side = [rec('OpenAlex', 'Hijaz fire hadith dating', '3 papers'), rec('Internet Archive', 'fire of the Hijaz prophecy', 'nothing'), rec('web search', 'critic hadith fire Hijaz Busra', 'nothing'), rec('English Wikisource', 'fire of the Hijaz', 'nothing')];
  rejudge(q);
};
// The checks accept it; the outcome is withheld, because a side must speak through a specialist of its own (the claim side's scholars, read against their conclusion, are not the objection's voice).
{ const q = good(); builtObjection(q); const o = M.outcome(q); t('an objection no published critic has made passes the checks when the case says so and shows four searches for one, and its outcome is "not-determined": the objection was built by the method itself', failing(q).length === 0 && o.final === 'not-determined' && o.first === 'refuted' && o.caps.length === 1 && /no specialist of the objection side could be quoted in his own voice: no published critic could be read, so the objection on the table was built by the method itself/.test(o.caps[0]), failing(q).join(', ') + ' ' + JSON.stringify(o)); }
cap('the objection side is quoted only through the claim side\'s own scholars (kind "scholar"), under a named advocate', q => { for (const e of [A1(q), A2(q)]) { e.kind = 'scholar'; seal(e); } }, /no specialist of the objection side could be quoted in his own voice$/);
cap('the mirror: the claim side is quoted only through the objection side\'s specialists (kind "advocate")', q => { S(q).kind = 'advocate'; seal(S(q)); }, /no specialist of the claim side could be quoted in his own voice$/);
red('both-voices', 'the objection side holds only quotes of kind "scholar", and the case neither says that no critic could be read nor shows a roadblock', q => { for (const e of [A1(q), A2(q)]) { e.kind = 'scholar'; seal(e); } });
// Nobody is left with an unanswered last turn.
cap('the objection spoke last and the claim side was never given a turn after it', q => { q.exchange_end.declined = {}; }, /the objection side spoke last, and the claim side was not given a turn to answer it or to say it has nothing to add/);
cap('the mirror: the claim spoke last and the objection side was never given a turn after it', q => { q.exchange.push({ side: 'claim', who: 'The map (own reasoning, for the claim side)', own_reasoning: true, evidence_ref: [], checks: [], part: '170-reply', text: 'The date of the collection is granted by both sides and settles the order.' }); q.exchange_end.last_word = 'claim'; }, /the claim side spoke last, and the objection side was not given a turn/);
cap('a side that said "nothing to add" BEFORE the other side\'s last turn has not answered that turn', q => { q.exchange_end.declined = { claim: '135-reply' }; }, /claim side was not given a turn/);
{ const q = good(); q.exchange.forEach(x => { delete x.part; }); t('a turn that names no part (an older record) counts as written first: a later decline by the other side answers it', M.outcome(q).final === 'refuted', JSON.stringify(M.outcome(q))); }
red('both-voices', 'the case says no critic could be read, on two searches', q => { builtObjection(q); q.searched.objection_side = q.searched.objection_side.slice(0, 2); });
{ const q = good(); q.points.find(p => p.id === 'O2').needs_differ = true; t('where the two neutral readers differ on a point it counts as needed and the difference is shown; it is not by itself a ground to withhold the outcome', M.outcome(q).final === 'refuted'); }
{ const q = good(); Object.assign(H(q), { check_url_en: 'https://shamela.ws/book/1376/10577', check_extra: { book: 'صحيح البخاري', collection: 'صحيح البخاري' } }); seal(H(q)); rejudge(q); green('Sahih al-Bukhari read on a library page that the catalogue lists as the Sahih itself needs no further grading', q); }
cap('the only specialist of one side reports a view he rejects', q => { A1(q).stance = 'reports-rejects'; A2(q).stance = 'reports-rejects'; }, /objection side could be quoted in his own voice/);

// ---------- RED: one fault per check ----------
red('both-voices', 'the claim rests on scripture alone, no scholar of its side', q => { q.evidence = q.evidence.filter(e => e.id !== 'E010-1'); });
red('both-voices', 'the objection is paraphrased, its advocate never quoted', q => { q.evidence = q.evidence.filter(e => e.side !== 'objection'); });
red('both-voices', 'the only quote of the scholar is cut against his meaning', q => { S(q).cut = 'changes-meaning'; });
red('both-voices', 'the advocate named for the objection is not the one quoted', q => { q.objection.by = 'Prof Somebody Else'; });
red('best-advocate', 'no other advocate of the objection was considered', q => { q.objection.candidates = [q.objection.candidates[0]]; });
red('best-advocate', 'no other specialist of the CLAIM was considered (the same demand on both sides)', q => { q.claim.candidates = []; });
red('best-advocate', 'placeholder rows with no address of the work', q => { q.objection.candidates.forEach(c => { delete c.url; }); });
red('no-encyclopedia', 'Wikipedia as a source', q => { A1(q).url = 'https://en.wikipedia.org/wiki/Example'; });
red('no-encyclopedia', 'Wikipedia behind a web archive', q => { A1(q).url = 'https://web.archive.org/web/2024/https://en.wikipedia.org/wiki/Example'; });
red('no-encyclopedia', 'a polemic site, with a trailing dot on the host', q => { A1(q).url = 'https://www.answering-islam.org./x'; });
red('no-encyclopedia', 'a polemic site on the claim\'s own side', q => { S(q).url = 'https://www.answering-christianity.com/x'; });
red('no-encyclopedia', 'a short link whose end nobody can see', q => { S(q).url = 'https://bit.ly/abc'; });
red('no-encyclopedia', 'an address that the script saw land on an encyclopedia', q => { S(q).check.final_url = 'https://en.wikipedia.org/wiki/X'; });
red('verbatim', 'a quote that was never checked', q => { delete S(q).check; S(q).verified = false; });
red('verbatim', 'the words changed after the check', q => { S(q).quote_en += ' and more'; });
red('verbatim', 'the speaker changed after the check', q => { S(q).who = 'Another Scholar'; });
red('verbatim', 'the side changed after the check', q => { A2(q).side = 'claim'; });
red('verbatim', '"verified": true typed by hand', q => { q.evidence.push({ id: 'E9', side: 'claim', kind: 'scholar', who: 'x', quote_en: 'a b c d e f g h i', check_url_en: 'https://shamela.ws/book/1/2', verified: true, check: { en: 'found', hash: 'abc' } }); });
red('quote-size', 'a three-word quote', q => { S(q).quote_en = 'he said so'; seal(S(q)); });
red('quote-size', 'a quote stitched from pieces of two words with text skipped between them', q => { S(q).quote_en = 'the report came down to us whole ... it is ... not a later thing at all here'; S(q).check_extra = { skipped: ['many words left out here', 'and more words left out'] }; seal(S(q)); });
red('first-hand', 'a scholar quoted from somebody else\'s page with nobody named', q => { S(q).check_url_en = 'https://islamqa.info/en/answers/5'; seal(S(q)); });
red('first-hand', 'a file on a code host passed off as the work', q => { S(q).check_url_en = 'https://cdn.jsdelivr.net/gh/someone/own-repo@1/page.json'; seal(S(q)); });
red('first-hand', 'the work wrapped in a translation proxy', q => { S(q).check_url_en = 'https://translate.goog/?u=https://shamela.ws/book/1/1'; seal(S(q)); });
red('first-hand', 'a library\'s search page passed off as a page of the book', q => { S(q).check_url_en = 'https://ar.wikisource.org/wiki/Special:Search/these are the very words'; seal(S(q)); });
red('first-hand', 'a blog page titled with the work\'s title, with no author tag naming the author', q => { S(q).check_url_en = 'https://someblog.org/the-book-of-ibn-example'; S(q).check_extra = { work_in_title: true, named_in: 'the page title' }; seal(S(q)); });
red('attributed', 'nothing ties the page to the author', q => { S(q).check_extra = { attribution: 'not named' }; seal(S(q)); });
red('attributed', 'no reader confirmed that the person named is the one whose words these are', q => { S(q).who_matches = false; });
red('attributed', 'a quote relabelled "witness" to slip past the tie to its author', q => { Object.assign(S(q), { kind: 'witness' }); S(q).check_extra = { attribution: 'not named' }; seal(S(q)); });
red('attributed', 'a hadith cited to one collection whose page is another collection', q => { H(q).check.collection = 'Sunan Abi Dawud'; H(q).check.collection_matches = false; });
red('reading', 'nobody read the context', q => { delete S(q).cut; delete S(q).cut_by; });
red('reading', 'the gatherer judged his own quote', q => { S(q).cut_by = 'claim advocate (part 010-claim)'; });
red('reading', 'the script recorded no words around the quote', q => { S(q).check.before = ''; S(q).check.after = ''; });
red('reading', 'a reader found the cut changes the meaning', q => { H(q).cut = 'changes-meaning'; });
red('reading', 'the script flagged "critics say" before the quote and the reader said nothing about it', q => { S(q).check.flags = ['"critics say" stands before the quote']; S(q).reading_note = 'fine'; });
red('reading', 'the reader did not say whose voice it is, for a "witness" as for a scholar', q => { Object.assign(A1(q), { kind: 'witness' }); delete A1(q).stance; seal(A1(q)); });
const pair = (q, extra) => { Object.assign(S(q), { quote_ar: 'قال هذا الكلام بعينه في تلك الصفحة من كتابه', check_url_ar: S(q).check_url_en, translated_by_map: true, quote_en: 'he said these very words on that page of his book' }, extra); delete S(q).check_url_en; seal(S(q)); };
red('translation-checked', 'the map\'s own translation, confirmed by nobody', q => pair(q));
red('translation-checked', 'the gatherer confirmed his own translation', q => pair(q, { translation_check: { agree: true, by: 'claim advocate (part 010-claim)', own_translation: 'he said these words' } }));
red('translation-checked', 'an "English" five times as long as the Arabic', q => pair(q, { quote_ar: 'قال هذا الكلام بعينه', quote_en: 'he said this and with it he proved beyond any question that everything the other side ever wrote on the matter is wrong and that the whole of the report is sound in every single detail', translation_check: { agree: true, by: 'translator (part 115-translate)', own_translation: 'he said this' } }));
red('translation-checked', 'the translation edited after it was confirmed', q => pair(q, { translation_check: { agree: true, by: 'translator (part 115-translate)', own_translation: 'he said these very words', hash: 'stale' } }));
red('translation-checked', 'a PUBLISHED English text printed beside an Arabic it does not render, checked by nobody', q => { Object.assign(S(q), { quote_ar: 'قال هذا الكلام بعينه في تلك الصفحة من كتابه', check_url_ar: 'https://shamela.ws/book/1/1' }); seal(S(q)); });
red('translation-checked', 'the neutral translator found the published English does not say what the Arabic says', q => { Object.assign(S(q), { quote_ar: 'قال هذا الكلام بعينه في تلك الصفحة من كتابه', check_url_ar: 'https://shamela.ws/book/1/1', translation_check: { agree: false, by: 'translator (part 115-translate)', own_translation: 'he said these very words on that page of his book', note: 'the English adds a claim the Arabic does not make', hash: 'x' } }); seal(S(q)); });
const trOk = (ar, en, note) => { const h = require('crypto').createHash('sha1').update(ar + '|' + en).digest('hex').slice(0, 12); return { quote_ar: ar, quote_en: en, translation_check: { agree: true, by: 'translator (part 115-translate)', own_translation: en, note: note || '', hash: h } }; };
red('translation-checked', 'the Arabic denies it and the English, "confirmed" by the translator, affirms it', q => pair(q, trOk('لَمْ يقل هذا الكلام في تلك الصفحة من كتابه قط', 'he said these very words on that page of his book')));
red('translation-checked', 'the English denies what the Arabic affirms', q => pair(q, trOk('قال هذا الكلام بعينه في تلك الصفحة من كتابه', 'he never said these words on that page of his book')));
{ const q = good(); pair(q, trOk('لم يقل هذا الكلام في تلك الصفحة من كتابه قط', 'he did not say these words on that page of his book at all')); rejudge(q); t('GREEN a translation that keeps the negation of the original passes the tripwire', !failing(q).includes('translation-checked'), why(q, 'translation-checked')); }
red('hadith-graded', 'a hadith with no number', q => { H(q).who = 'Sahih al-Bukhari'; H(q).ref = ''; seal(H(q)); });
red('hadith-graded', 'outside the two Sahihs with no grading', q => { H(q).who = 'Jami al-Tirmidhi 2180'; H(q).check_url_en = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-tirmidhi/2180.json'; seal(H(q)); });
red('hadith-graded', 'a weak report not marked as weak', q => { H(q).who = 'Jami al-Tirmidhi 9'; H(q).grade = 'da\'if'; H(q).graded_by = 'al-Albani'; seal(H(q)); });
red('hadith-graded', 'a report the page grades "mursal", not marked as weak', q => { H(q).check.grades = [{ name: 'Al-Albani', grade: 'Mursal' }]; });
red('hadith-graded', 'a Companion\'s own words (mawquf) passed as a report of the Prophet', q => { H(q).check.grades = [{ name: 'Zubair Ali Zai', grade: 'Mauquf Sahih' }]; });
red('hadith-graded', '"Bukhari" in the label but the page is not the collection\'s own', q => { H(q).check_url_en = 'https://islamqa.info/en/answers/9'; H(q).via = { who: 'IslamQA', standing: 'a supervised fatwa site', basis: 'supervised by a named scholar and widely cited' }; seal(H(q)); });
red('hadith-graded', 'the two-Sahihs exemption claimed through a look-alike address on another host', q => { H(q).check_url_en = 'https://evil.example.org/hadith-api@1/editions/eng-bukhari/7118.json'; seal(H(q)); });
red('later-position', 'nobody looked for the author\'s later view', q => { delete A1(q).later_position; });
red('later-position', 'the author later withdrew it and the item still stands for him', q => { A1(q).later_position.result = 'revised'; });
red('later-position', 'the search for a later view is not in its writer\'s record', q => { A1(q).later_position.searched[0].unproven = true; });
red('roadblock-honest', 'a roadblock with no list of searches', q => { q.roadblocks.push(goodRb({ attempts: [] })); });
red('roadblock-honest', 'four searches, all in one place', q => { q.roadblocks.push(goodRb({ attempts: [1, 2, 3, 4].map(i => rec('Google', 'query number ' + i, 'nothing')) })); });
red('roadblock-honest', 'no second, independent search', q => { q.roadblocks.push(goodRb({ second_search: {} })); });
red('roadblock-honest', 'the script never searched the libraries for the words', q => { q.roadblocks.push(goodRb(null, rb => { delete rb.machine_search; })); });
red('roadblock-honest', 'the script found the words in the library', q => { q.roadblocks.push(goodRb(null, rb => { rb.machine_search.total_hits = 3; rb.machine_search.first = 'a book'; })); });
red('roadblock-honest', 'the script opened a place a shorter search pointed to, and the words are there', q => { q.roadblocks.push(goodRb(null, rb => { rb.machine_search.found_at = 'https://shamela.ws/book/7/7'; })); });
red('roadblock-honest', 'only one search service answered its control for Latin words (two are needed)', q => { q.roadblocks.push(goodRb(null, rb => { rb.machine_search.engines[1].control_hits = -1; })); });
red('roadblock-honest', 'the searches are not in the agents\' own records', q => { q.roadblocks.push(goodRb(null, rb => { delete rb.search_proof; })); });
red('roadblock-honest', 'one listed search is not in the record', q => { q.roadblocks.push(goodRb(null, rb => { rb.search_proof.first_proved = 3; })); });
red('roadblock-honest', 'every listed search was made, but too few of them came back with an answer (one was refused)', q => { q.roadblocks.push(goodRb(null, rb => { rb.search_proof.first_answered = 3; })); });
red('roadblock-honest', 'the second search lists two searches, and only one of them came back with an answer', q => { q.roadblocks.push(goodRb(null, rb => { rb.search_proof.second_answered = 1; })); });
red('roadblock-honest', 'the same search written four times is one search', q => { q.roadblocks.push(goodRb({ attempts: [0, 1, 2, 3].map(() => rec('Google', 'al-Example answer original text', 'only the article')) })); });
red('roadblock-honest', 'the second search was by the same agent', q => { q.roadblocks.push(goodRb(null, rb => { rb.search_proof.independent = false; })); });
red('roadblock-honest', 'a search added to the list after the proof', q => { q.roadblocks.push(goodRb(null, rb => { rb.attempts.push(rec('shamela', 'one more made up', 'nothing')); })); });
red('roadblock-honest', 'the statement claims "it cannot be found"', q => { q.roadblocks.push(goodRb({ statement: 'al-Example may have answered this, but the original cannot be found anywhere and was not found by me; only the article by Author Reporter exists, a supervised fatwa site.' })); });
red('roadblock-honest', 'the statement hides that it was not found', q => { q.roadblocks.push(goodRb({ statement: 'al-Example answered this in his book, as the article by Author Reporter says, and that article is on a supervised fatwa site of good standing.' })); });
red('roadblock-honest', 'the standing of the reporting page is the searcher\'s word, with no found words behind it', q => { q.roadblocks.push(goodRb({ reported_by: { title: 'An article on the answer', author: 'Author Reporter', url: 'https://islamqa.info/en/answers/1', standing: 'the leading authority of the age' } })); });
red('roadblock-honest', 'the words given for the standing are not on the page named for them', q => { q.roadblocks.push(goodRb(null, rb => { rb.check.standing = 'missing'; })); });
red('roadblock-honest', 'the report is itself on a wiki', q => { q.roadblocks.push(goodRb({ check_url_en: 'https://en.wikipedia.org/wiki/X', reported_by: Object.assign({}, RB.reported_by, { url: 'https://en.wikipedia.org/wiki/X' }) })); });
red('roadblock-honest', 'the report\'s words were checked on another page than the one named as the report', q => { q.roadblocks.push(goodRb({ check_url_en: 'https://islamqa.info/en/answers/2' })); });
red('roadblock-honest', 'no words of the original are named, and no reason why', q => { q.roadblocks.push(goodRb({ sought_phrase: '' })); });
red('roadblock-honest', '"the report gives no words" while the script sees that the reporting page quotes words', q => { q.roadblocks.push(goodRb({ sought_phrase: '', sought_phrase_unknown: 'the report gives no words of it' }, rb => { rb.check.report_quotes_words = true; rb.check.hash = M.signRb(rb); })); });
red('roadblock-honest', 'the kind of barrier is not named', q => { q.roadblocks.push(goodRb({ barrier: '' })); });
red('both-libraries', 'the claim side\'s own library was not searched', q => { q.searched.claim_side = []; });
red('both-libraries', 'a side whose library is Arabic was searched only in English', q => { q.searched.claim_side = [rec('Google', 'hijaz fire', 'x'), rec('Google', 'hijaz fire scholars', 'y')]; });
red('both-libraries', 'three stray Arabic letters passed off as an Arabic search', q => { q.searched.claim_side = [rec('Google', 'hijaz نار fire', 'x'), rec('Google', 'hijaz fire scholars', 'y')]; });
red('both-libraries', 'the case does not say which language each side\'s library is in', q => { delete q.sides; });
red('both-libraries', 'one side searched twenty times, the other twice', q => { q.searched.objection_side = Array.from({ length: 20 }, (x, i) => rec('OpenAlex', 'query ' + i, 'r')); });
red('both-libraries', 'the searches listed are not in their writer\'s record', q => { q.searched.claim_side.forEach(a => { a.unproven = true; }); });
red('both-libraries', 'the same search written twice is one search', q => { q.searched.claim_side = [q.searched.claim_side[0], JSON.parse(JSON.stringify(q.searched.claim_side[0]))]; });
red('turn-sourced', 'a turn puts words in a named person\'s mouth', q => { q.exchange[0].evidence_ref = []; });
red('turn-sourced', 'a turn rests on a quote of the other side', q => { q.exchange[0].evidence_ref = ['E020-1']; });
red('turn-sourced', 'a turn names someone other than the one quoted', q => { q.exchange[0].who = 'al-Different'; });
red('turn-sourced', 'the map\'s own reasoning under a scholar\'s name', q => { q.exchange[0].own_reasoning = true; });
red('turn-sourced', 'nobody checked that the turn says what the quote says', q => { delete q.exchange[0].faithful; });
red('turn-sourced', 'a reader found the turn says more than the quote', q => { q.exchange[1].faithful = false; });
red('exchange-followed', 'the objection is left standing, no reply traced', q => { q.exchange = []; });
red('exchange-followed', 'a turn with no date', q => { q.exchange[0].when = ''; });
red('exchange-followed', 'last_word contradicts the last turn', q => { q.exchange_end.last_word = 'claim'; });
red('exchange-followed', 'the case does not say how the exchange ended', q => { delete q.exchange_end.stopped_by; });
red('exchange-followed', 'the exchange is mostly the map talking to itself', q => { for (const side of ['claim', 'objection', 'claim']) q.exchange.push({ side, who: 'The map (own reasoning)', own_reasoning: true, evidence_ref: [], text: 'One reading is that the far sighting is the weaker part of the account.' }); q.exchange_end.last_word = 'claim'; });
red('last-word', 'nobody looked for an answer to the last word', q => { q.exchange_end.looked_for_more = []; });
red('last-word', 'the search for an answer is prose, not a record', q => { q.exchange_end.looked_for_more = ['I searched widely and found nothing at all', 'I searched again']; });
red('last-word', 'the objection spoke last and the claim side\'s Arabic library was searched only in English', q => { q.exchange_end.looked_for_more = [rec('Google', 'reply to Dr Critic', 'nothing'), rec('Google Scholar', 'Dr Critic later reply', 'nothing')]; });
red('premise-coverage', 'a point that was raised is never examined', q => { q.points.push({ id: 'O3', side: 'objection', text: 'A further point', from: 'objection advocate' }); });
red('premise-coverage', 'no neutral reader listed the steps', q => { q.points.forEach(p => { p.from = p.side + ' advocate'; }); });
red('premises-proven', 'a point confirmed on nothing', q => { pr(q, 'C1').rests_on = []; });
red('premises-proven', 'a point confirmed on a quote that was not found', q => { pr(q, 'C1').rests_on = ['E99']; });
red('premises-proven', 'a point confirmed on a quote a reader found cut against its meaning', q => { S(q).cut = 'changes-meaning'; pr(q, 'C1').rests_on = ['E010-1']; });
red('premises-proven', 'a point confirmed on a quote that nobody but the marker said bears on it', q => { q.bearings = q.bearings.filter(b => b.point !== 'C1'); });
red('premises-proven', 'a point confirmed on a quote a reader found does NOT bear on it', q => { link(q, 'C1', 'E010-1', 'none'); });
red('premises-proven', 'a point confirmed while a found quote says the opposite: the quote was left out, not answered', q => { link(q, 'C1', 'E020-1', 'contradicts'); });
red('premises-proven', 'a point confirmed on a verse alone, read by the marker', q => { pr(q, 'C1').rests_on = ['E010-3']; link(q, 'C1', 'E010-3', 'supports'); });
red('premises-proven', 'a point confirmed on a hadith marked as weak', q => { H(q).use = 'shown-as-weak'; pr(q, 'C1').rests_on = ['E010-2']; });
red('premises-proven', 'a point called false on nothing', q => { pr(q, 'O1').rests_on = []; });
red('premises-proven', 'a bare possibility marked confirmed', q => { pr(q, 'C1').level = 'bare possibility'; });
red('premises-proven', 'no word on whether the argument needs it', q => { delete pr(q, 'O1').needed; });
red('premises-proven', 'a point set aside as not needed with no reason', q => { delete pr(q, 'O2').not_needed_because; });
red('premises-proven', '"disputed" with a quote from one side only', q => { Object.assign(pr(q, 'O1'), { status: 'disputed', rests_on: ['E020-2'], why: 'the two sides are said to differ on this point' }); });
red('premises-proven', 'a needed point called unsupported after one search written down twice', q => { Object.assign(pr(q, 'O1'), { status: 'unsupported', rests_on: [], why: 'nothing was offered for it by anyone at all', looked: [rec('OpenAlex', 'order of dates', 'nothing'), rec('OpenAlex', 'order of dates', 'nothing')] }); });
red('premises-proven', 'a needed point called unsupported after one search (a missing source gets six)', q => { Object.assign(pr(q, 'O1'), { status: 'unsupported', rests_on: [], why: 'nothing was offered for it by anyone at all', looked: [rec('OpenAlex', 'order of dates', 'nothing')] }); });
red('premises-proven', 'a point confirmed on words the author only reports', q => { S(q).stance = 'reports-neutral'; pr(q, 'C1').rests_on = ['E010-1']; });
red('premises-proven', '"several independent reports" resting on one book of one man', q => { pr(q, 'C1').level = 'several independent reports'; pr(q, 'C1').rests_on = ['E010-1']; });
red('premises-proven', '"several independent reports": one man under two spellings, in the library\'s own naming', q => { pr(q, 'C1').level = 'several independent reports'; q.evidence.push(seal(Object.assign(speaker('scholar', 'Ismail Ibn Example al-Dimashqi', 1), { id: 'E8', side: 'claim', cut: 'faithful', cut_by: 'context reader (part 110-read)', stance: 'own', who_matches: true, check_extra: { author: 'Ibn Example', book: 'The book of Ibn Example' } }))); S(q).check.author = 'Ibn Example'; S(q).check.book = 'The book of Ibn Example'; pr(q, 'C1').rests_on = ['E010-1', 'E8']; link(q, 'C1', 'E8', 'supports'); });
red('premises-proven', '"many independent carriers": three verses of one Book counted as three sources', q => { pr(q, 'C1').level = 'many independent carriers'; for (const k of [5, 6]) q.evidence.push(seal({ id: 'E' + k, side: 'claim', kind: 'quran', ref: '15:' + k })); pr(q, 'C1').rests_on = ['E010-1', 'E010-3', 'E5', 'E6']; for (const id of ['E010-3', 'E5', 'E6']) link(q, 'C1', id, 'supports'); });
red('equal-burden', 'the judge writes an outcome his own marks do not give', q => { q.verdict.outcome = 'answered'; });
red('equal-burden', '"refuted" written while a point the claim needs is false', q => { pr(q, 'C1').status = 'false'; });
red('equal-burden', 'an outcome that is not one of the seven', q => { q.verdict.outcome = 'contested'; });
red('equal-burden', '"not-determined" chosen by the judge to avoid a result his marks give', q => { q.verdict.outcome = 'not-determined'; });
red('equal-burden', '"unchecked" names something that is not a point', q => { q.exchange_end.unchecked = ['whatever']; });
red('equal-burden', 'no point of the claim is marked as needed', q => { pr(q, 'C1').needed = false; });
red('equal-burden', 'a false detail of the claim not listed as a correction', q => { Object.assign(pr(q, 'C2'), { status: 'false', rests_on: ['E020-2'] }); link(q, 'C2', 'E020-2', 'contradicts'); });
red('equal-burden', 'a false detail of the objection not listed as a correction', q => { Object.assign(pr(q, 'O2'), { status: 'false', rests_on: ['E010-1'] }); link(q, 'O2', 'E010-1', 'contradicts'); });
red('crux-named', 'the crux is a vague phrase', q => { q.verdict.crux = 'the dating'; });
red('crux-named', 'the claim\'s own assumption is not named', q => { q.verdict.claim_assumptions = []; });
red('crux-named', 'the objection comes out ahead without naming what it assumes', q => { pr(q, 'C1').status = 'false'; pr(q, 'O1').status = 'confirmed'; Object.assign(q.verdict, { outcome: 'objection-stands', crux: pr(q, 'C1').text }); });
red('reasoning-shown', 'a one-line verdict', q => { q.verdict.reasoning = 'The objection fails [O1] and the claim holds [C1].'; });
red('reasoning-shown', 'padding in place of reasoning', q => { q.verdict.reasoning = Array(40).fill('the claim holds [C1] [O1]').join(' '); });
red('reasoning-shown', 'the reasoning never names the objection\'s point', q => { q.verdict.reasoning = REASON.replace('[O1]', ''); });
red('second-opinion', 'no second judge', q => { delete q.verdict.second_opinion; });
red('second-opinion', 'the second judge never marked the needed points', q => { q.verdict.second_opinion.premises = []; });
red('second-opinion', 'the second judge marked only one of the needed points', q => { second(q, { C1: 'confirmed' }); });
red('verdict-fresh', 'a quote was removed after the verdict', q => { q.evidence = q.evidence.filter(e => e.id !== 'E010-3'); });
red('verdict-fresh', 'a quote was added after the verdict', q => { q.evidence.push(seal(Object.assign(speaker('advocate', 'Dr Critic', 7), { id: 'E7', side: 'objection' }))); });
red('verdict-fresh', 'a quote was read differently after the verdict (a later reader found it cut against its meaning)', q => { H(q).cut = 'changes-meaning'; });
red('current', 'a conclusion dated years ago', q => { q.verdict.as_of = '2019-01-01'; });
red('current', 'a conclusion dated in the future', q => { q.verdict.as_of = '2026-10-12'; });
red('current', 'a date that is not a date', q => { q.verdict.as_of = 'the 5th century'; });
red('current', 'a fresh verdict on searches made weeks ago (the date is the agents\' own record)', q => { q.provenance.newest_search = '2026-09-01T10:00:00.000Z'; });
red('current', 'nothing on what would change it', q => { q.verdict.would_change = ''; });
red('current', 'nothing on what it does not show', q => { q.verdict.not_shown = 'n/a'; });
red('scope', 'the claim as it was asked is not kept', q => { delete q.claim.as_given; });
red('scope', 'the claim was narrowed without saying so', q => { q.verdict.scope_change = 'the claim weighed is only that the collection is earlier'; });
red('scope', 'other objections neither listed nor searched for', q => { q.other_objections = []; });
red('swap-test', 'no standard stated', q => { q.swap_test.standard = ''; });
red('swap-test', 'one sentence repeated three times', q => { q.swap_test.to_claim = q.swap_test.to_objection = q.swap_test.standard; });
red('swap-test', 'the judge confirmed his own fairness', q => { q.swap_test.confirmed_by = 'judge (part 900-judge)'; });
red('frame-words', '"Muslims believe ... but historians ..."', q => { q.verdict.short = 'Muslims believe the report is early, but historians date it later.'; });
red('frame-words', '"cannot be ruled out"', q => { pr(q, 'O2').why = 'a later addition cannot be ruled out on the evidence we have'; });
red('frame-words', '"could have been added"', q => { q.verdict.reasoning = REASON + ' The report could have been added by a later hand.'; });
red('frame-words', 'triumphal wording for the claim', q => { q.verdict.short = 'The objection is baseless and the proof is irrefutable.'; });
red('frame-words', 'a camp label in place of a name', q => { q.verdict.short = 'The orientalists hold that the report is late.'; });
red('frame-words', '"remains contested" with no point named', q => { q.verdict.short = 'The matter remains contested.'; });
red('frame-words', 'a sneer wrapped in quotation marks that nobody said', q => { q.verdict.short = 'This "pious legend" does not hold.'; });
red('frame-words', 'a sneer hidden between two apostrophes', q => { q.verdict.short = 'It isn\'t more than a so-called prophecy in the author\'s eyes.'; });
red('frame-words', 'tilted wording in the reason a point matters', q => { q.points.find(p => p.id === 'O1').bears_on = 'this is what a historian can show about the order of dates'; });
red('frame-words', 'a sneer in the objection as the case states it (read like the claim as stated)', q => { q.objection.text = 'The so-called report was composed after the event.'; });
red('frame-words', 'a sneer in the claim as the case states it', q => { q.claim.text = 'The report was obviously written down before the event'; });
red('frame-words', 'a sneer in the text of a point', q => { q.points[0].text = 'The baseless dating aside, the collection was written before the event'; });
red('frame-words', 'a sneer planted in the objection\'s statement and then quoted back', q => { q.objection.text += ' It is a pious legend.'; q.verdict.short = 'The critic\'s "pious legend" has no date behind it.'; });
red('consensus-cited', '"scholars unanimously" with no source', q => { q.verdict.short = 'The scholars are unanimous that the report is sound.'; });
red('consensus-cited', '"most Western scholars" with no source', q => { q.verdict.short = 'Most Western scholars date the report late.'; });
red('consensus-cited', 'the same claim in the tradition\'s other words ("the jumhur")', q => { q.verdict.short = 'The jumhur read the report as a sign of the Hour.'; });
red('consensus-cited', 'a consensus cited to a quote that says nothing of consensus', q => { q.verdict.short = 'Ibn Example reports a consensus on the date of the collection.'; q.consensus_claims = [{ evidence_ref: ['E010-1'], dissent_search: [rec('turath.io', 'خلاف في تاريخ الكتاب', 'none')], dissent: 'none found' }]; });
red('dropped-shown', 'one side lost half its sources as dropped, silently', q => { q.dropped = [{ side: 'objection', who: 'a' }, { side: 'objection', who: 'b' }, { side: 'objection', who: 'c' }]; });
red('provenance', 'a case that was not built from parts', q => { q.parts = []; });
red('provenance', 'nobody proved who wrote the parts', q => { delete q.provenance; });
red('provenance', 'a part changed after its writer was proven', q => { q.parts[3].sha1 = 'changed'; });
red('provenance', 'a part no agent wrote (typed by hand)', q => { q.provenance.parts[5].agent = ''; });
red('provenance', 'a part that is not, byte for byte, what its agent wrote (edited afterwards)', q => { q.provenance.parts[5].content_matches = false; });
red('provenance', 'a part written by an agent that was given another task', q => { q.provenance.parts.find(p => p.part === '110-read').label_matches = false; });
red('provenance', 'the gatherer also wrote the reading of his own quotes', q => { q.provenance.parts.find(p => p.part === '110-read').agent = q.provenance.parts.find(p => p.part === '010-claim').agent; });
// The one said to quote or publish a text is a statement too: the page itself must name him.
const viaOn = named => q => { const e = q.evidence.find(x => x.kind === 'advocate'); e.check_url_en = 'https://www.example-magazine.org/volcanic.htm'; e.via = { who: 'Example Company World', on_page_as: 'Example Company World', standing: 'a company magazine', basis: 'published by the company for its own readers' }; seal(e); if (named !== undefined) e.check.via_named = named; };
red('first-hand', 'a quote from a page that is not the work itself, with nobody named as quoting or publishing it', q => { viaOn()(q); delete q.evidence.find(x => x.kind === 'advocate').via; });
red('first-hand', 'a publisher is named, and the page itself does not name him', viaOn(false));
red('first-hand', 'a publisher is named, and nothing ties him to the page', viaOn());
{ const q = good(); viaOn(true)(q); t('GREEN a publisher the page itself names satisfies first-hand', !M.CHECKS.find(c => c[0] === 'first-hand')[2](q).length, why(q, 'first-hand')); }
red('second-opinion', 'the judge\'s own record shows he opened the second judge\'s part before his marks were final', q => { Object.assign(q.provenance.parts.find(p => p.part === '900-judge'), { sealed: false, saw: ['part:910-judge2'] }); });
red('second-opinion', 'the second judge\'s record shows he read the view with everybody\'s marks', q => { Object.assign(q.provenance.parts.find(p => p.part === '910-judge2'), { sealed: false, saw: ['view.md'] }); });
red('second-opinion', 'a proof that does not say whether the judge judged blind', q => { delete q.provenance.parts.find(p => p.part === '900-judge').sealed; });
red('translation-checked', 'the translator\'s record shows he opened the given English before writing his own', q => { q.parts.push({ part: '115-translate', role: 'translate', side: '', sha1: 'x' }); q.provenance.parts.push({ part: '115-translate', sha1: 'x', agent: 'agentT', label: '115-translate:G1', writers: 1, content_matches: true, label_matches: true, sealed: false, saw: ['view.md'] }); });
{ const q = good(); q.parts.push({ part: '115-translate', role: 'translate', side: '', sha1: 'x' }); q.provenance.parts.push({ part: '115-translate', sha1: 'x', agent: 'agentT', label: '115-translate:G1', writers: 1, content_matches: true, label_matches: true, sealed: true, saw: [] });
  t('GREEN a translator whose record shows he wrote his own translation first passes', !failing(q).length, failing(q).join(', ')); }
red('provenance', 'the objection was argued by a weaker model than the claim', q => { q.provenance.parts.find(p => p.part === '020-objection').model = 'model-small'; });
red('provenance', 'the claim side\'s reply ran on a stronger model than the counter', q => { q.provenance.parts.find(p => p.part === '130-reply').model = 'model-large'; });
{ const q = JSON.parse(JSON.stringify(BASE_RB)); t('GREEN a roadblock whose second searcher is shown to have searched on his own passes', !failing(q).length && q.provenance.parts.find(p => p.part === '800-second').sealed === true, failing(q).join(', ') + ' ' + why(q, 'roadblock-honest')); }
{ const q = JSON.parse(JSON.stringify(BASE_RB)); Object.assign(q.provenance.parts.find(p => p.part === '800-second'), { sealed: false, saw: ['part:010-claim'] }); t('RED   roadblock-honest — the second searcher\'s record shows he opened the first searcher\'s part before his own was final', failing(q).includes('roadblock-honest') && /searched on his own/.test(why(q, 'roadblock-honest')), why(q, 'roadblock-honest')); }
red('provenance', 'the judge is also the second judge', q => { q.provenance.parts.find(p => p.part === '910-judge2').agent = q.provenance.parts.find(p => p.part === '900-judge').agent; });

// ---------- REPLAY: the faults of DawahMap 0.1 and 0.2 ----------
red('premises-proven', 'REPLAY 0.2: "an eruption in 641 already fits the report" accepted from the objection with no source', q => { q.premises.push({ id: 'O9', side: 'objection', text: 'An eruption near Medina in 641 already fits the report', needed: true, bears_on: 'then the report describes a past event', status: 'confirmed', rests_on: [], level: 'one report' }); q.points.push({ id: 'O9', side: 'objection', text: 'x', from: 'objection advocate' }); });
red('exchange-followed', 'REPLAY 0.1: the exchange stops at the objection', q => { q.exchange = []; });
// A date is a statement too: where the library's catalogue dates the author of the page a turn rests on, the turn gives that date.
const dated = (when, author, edition) => q => { const t = q.exchange.find(x => !x.own_reasoning), e = q.evidence.find(x => x.id === t.evidence_ref[0]); t.when = when; e.check.author = author; if (edition) e.check.edition = edition; };
const AR = n => String(n).replace(/\d/g, d => String.fromCharCode(0x660 + Number(d)));
red('exchange-followed', 'a named turn dated "modern", with no year', dated('modern', 'Ibn Example'));
red('exchange-followed', 'a named turn dated from memory, where the library\'s catalogue gives another year for the author', dated('9th century AH (d. 852 AH)', 'Ibn Example (Ismail ibn Example (' + AR(774) + '))'));
red('exchange-followed', 'a named turn dated from memory, where the catalogue dates only the edition', dated('20th century (d. 2012)', 'Ibn Example', 'printed ' + AR(1411) + ' - ' + AR(1991)));
{ const q = good(); dated('8th century AH (d. 774 AH)', 'Ibn Example (Ismail ibn Example (' + AR(774) + '))')(q);
  t('GREEN a named turn dated as the library\'s catalogue dates its author (the catalogue writes the year in Arabic digits)', !failing(q).length && M.coverage({}, [q]).dated >= 1, failing(q).join(', ') + ' ' + why(q, 'exchange-followed'));
  const q2 = good(); dated('the edition read was printed in 1411 AH / 1991 CE', 'Ibn Example', 'printed ' + AR(1411) + ' - ' + AR(1991))(q2);
  t('GREEN where the catalogue dates no author, the year of the edition it gives is a sourced date', !failing(q2).length, failing(q2).join(', ') + ' ' + why(q2, 'exchange-followed'));
  const q3 = good(); dated('8th century AH (701-774 AH)', 'Ibn Example')(q3);
  t('GREEN where the catalogue gives no year at all the date is its writer\'s: it does not fail, and the count says it is not sourced', !failing(q3).length && M.coverage({}, [q3]).dated < M.coverage({}, [q3]).named, failing(q3).join(', '));
}
red('both-voices', 'REPLAY 0.2: the Quran quoted, the scholars of Islam left out', q => { q.evidence = q.evidence.filter(e => !(e.side === 'claim' && e.kind === 'scholar')); });
red('frame-words', 'REPLAY 0.2: "what a historian can show"', q => { q.verdict.short = 'This is what a historian can show about the report.'; });

// ---------- what a bearing rests on: the quote's words, its silence, or a possibility it only raises (cases opened under rules 6) ----------
const grounded = (q, point, evidence, bears, ground) => { link(q, point, evidence, bears); q.bearings[q.bearings.length - 1].ground = ground; };
const disputedOn = ground => q => { Object.assign(pr(q, 'O1'), { status: 'disputed', rests_on: ['E010-1', 'E020-2'], why: 'each side quotes a dated record and the two records disagree' }); grounded(q, 'O1', 'E010-1', 'contradicts', ground); grounded(q, 'O1', 'E020-2', 'supports', 'words'); };
const ppWhy = (rules, mutate) => { const q = good(); q.rules = rules; mutate(q); return why(q, 'premises-proven'); };
t('RED   premises-proven — GROUND a point marked disputed whose only "contradicts" bearing rests on the quote\'s silence', /rests on a quote a reader found is silent on it: E010-1/.test(ppWhy(6, disputedOn('silence'))), ppWhy(6, disputedOn('silence')));
t('RED   premises-proven — GROUND a point marked disputed whose only "contradicts" bearing is a possibility the quote raises ("perhaps")', /is marked disputed on a quote that only raises a possibility: a possibility is not an assertion, whichever side says it/.test(ppWhy(6, disputedOn('possibility'))), ppWhy(6, disputedOn('possibility')));
t('GROUND the same two cases opened under the earlier rules are read as before: the bearing counts', ppWhy(0, disputedOn('silence')) === '' && ppWhy(0, disputedOn('possibility')) === '', ppWhy(0, disputedOn('silence')));
t('GROUND a point marked confirmed is not forced to "disputed" by a quote that is only silent on it, nor by one that only raises a possibility against it', ppWhy(6, q => grounded(q, 'C1', 'E020-1', 'contradicts', 'silence')) === '' && ppWhy(6, q => grounded(q, 'C1', 'E020-1', 'contradicts', 'possibility')) === '' && /says the opposite/.test(ppWhy(6, q => grounded(q, 'C1', 'E020-1', 'contradicts', 'words'))) && /says the opposite/.test(ppWhy(0, q => grounded(q, 'C1', 'E020-1', 'contradicts', 'silence'))), ppWhy(6, q => grounded(q, 'C1', 'E020-1', 'contradicts', 'possibility')));
t('RED   premises-proven — GROUND a point marked confirmed whose only support is a possibility (one rule for both sides)', /is marked confirmed on a quote that only raises a possibility/.test(ppWhy(6, q => { grounded(q, 'C1', 'E010-1', 'supports', 'possibility'); grounded(q, 'C1', 'E010-2', 'supports', 'possibility'); })));
t('GROUND a point marked confirmed on one quote that says it and one that only raises it as a possibility passes: the assertion carries it', ppWhy(6, q => grounded(q, 'C1', 'E010-2', 'supports', 'possibility')) === '');
t('RED   premises-proven — GROUND a point marked false on a quote that is only silent on it', /silent on it: E020-2/.test(ppWhy(6, q => grounded(q, 'O1', 'E020-2', 'contradicts', 'silence'))));

// ---------- a specialist the case names is quoted, set aside as weaker, or declared a gap ----------
const baWarn = q => M.CHECKS.find(c => c[0] === 'best-advocate')[2](q).filter(f => f.level === 'WARN').map(f => f.text).join(' / ');
const unquoted = q => { delete q.objection.candidates[1].not_quoted; };
red('best-advocate', 'GAP (rules 6) a specialist is named for the objection, is not quoted, and no roadblock is declared for him', q => { q.rules = 6; unquoted(q); });
red('best-advocate', 'GAP (rules 6) the same on the claim side', q => { q.rules = 6; delete q.claim.candidates[1].not_quoted; });
red('best-advocate', 'GAP (rules 6) "unreadable" is written beside his name and no roadblock is declared', q => { q.rules = 6; q.objection.candidates[1].not_quoted = 'unreadable'; });
red('best-advocate', 'GAP (rules 6) a roadblock for him that is not proven does not account for him', q => { q.rules = 6; q.objection.candidates[1].not_quoted = 'unreadable'; q.roadblocks.push(goodRb({ side: 'objection', who: 'Prof Other' }, rb => { delete rb.search_proof; })); });
{ const q = good(); unquoted(q);
  t('GAP in a case opened under the earlier rules the same gap is a warning, and the SOURCES line counts it', !failing(q).includes('best-advocate') && /Prof Other\) is neither quoted, nor set aside as the weaker choice/.test(baWarn(q)) && /specialists named and neither quoted nor declared a gap 1$/.test(M.coverageLines(M.coverage({}, [q]))[0]), baWarn(q) + ' | ' + M.coverageLines(M.coverage({}, [q]))[0].slice(-90)); }
{ const q = good(); q.rules = 6;
  t('GAP a specialist who is quoted, and one set aside as the weaker choice with a reason, are accounted for (rules 6)', !failing(q).includes('best-advocate') && baWarn(q) === '' && /declared a gap 0$/.test(M.coverageLines(M.coverage({}, [q]))[0]), why(q, 'best-advocate'));
  q.objection.candidates[1].not_quoted = 'unreadable'; q.roadblocks.push(goodRb({ side: 'objection', who: 'Prof Other, in his book on the report' }));
  t('GAP a specialist who could not be read is accounted for by a proven roadblock that names him (rules 6)', !failing(q).includes('best-advocate') && !failing(q).includes('roadblock-honest'), why(q, 'best-advocate') + ' ' + why(q, 'roadblock-honest'));
}

// ---------- the assembler: nobody certifies himself, and nothing is erased ----------
const partsOf = (change, o) => C.assemble(makeDir(o, change).dir);
const lastWordCap = q => M.outcome(q).caps.some(c => /was not given a turn to answer it/.test(c));
{ const a = partsOf();
  t('ASSEMBLER a side that is given a turn after the other side\'s last turn and says it has nothing to add is recorded as having declined, and the last word then withholds nothing', a.q.exchange_end.declined.claim === '145-reply' && !a.q.exchange_end.declined.objection && a.q.exchange[a.q.exchange.length - 1].part === '140-counter' && !lastWordCap(a.q), JSON.stringify(a.q.exchange_end.declined));
  const b = partsOf(ps => { delete ps['145-reply']; });
  t('ASSEMBLER a reply that says "nothing new" and still carries a turn is a turn, not a decline: the objection\'s last turn is then unanswered', Object.keys(b.q.exchange_end.declined).length === 0 && lastWordCap(b.q), JSON.stringify(b.q.exchange_end.declined));
  const c = partsOf(ps => { delete ps['145-reply']; ps['165-reply'] = { role: 'reply', side: 'claim', nothing_new: true, turns: [{ replaces_turn: 1, when: '8th century AH (d. 774 AH)' }] }; ps['166-reply'] = { role: 'reply', side: 'claim', nothing_new: true, turns: [], evidence: [Object.assign(speaker('scholar', 'Ibn Example', 1), { replaces: 'E010-1' })] }; });
  t('ASSEMBLER a repair (a turn or a quote given again, with "nothing_new": true) is not a decline', Object.keys(c.q.exchange_end.declined).length === 0 && lastWordCap(c.q), JSON.stringify(c.q.exchange_end.declined));
  const c2 = partsOf(ps => { delete ps['145-reply']; ps['165-reply'] = { role: 'reply', side: 'claim', repair: true, nothing_new: true, turns: [], evidence: [] }; });
  t('ASSEMBLER nor is a repair that found nothing to repair: its writer was told the exchange is closed, not given a turn', Object.keys(c2.q.exchange_end.declined).length === 0 && lastWordCap(c2.q), JSON.stringify(c2.q.exchange_end.declined));
  const old = makeDir(), doc = JSON.parse(fs.readFileSync(path.join(old.dir, 'case.json'), 'utf8')); fs.unlinkSync(path.join(old.dir, 'parts', '145-reply.json')); delete doc.questions[0].exchange_end.declined; doc.questions[0].parts = doc.questions[0].parts.filter(x => x.part !== '145-reply'); doc.questions[0].provenance.parts = doc.questions[0].provenance.parts.filter(x => x.part !== '145-reply');
  const pvf = path.join(old.dir, 'provenance.json'), pvd = JSON.parse(fs.readFileSync(pvf, 'utf8')); pvd.provenance.parts = pvd.provenance.parts.filter(x => x.part !== '145-reply'); fs.writeFileSync(pvf, JSON.stringify(pvd));
  t('ASSEMBLER a case file built before declines were recorded, whose parts hold none, is still what its parts give; one whose parts hold a decline the file lacks is not', C.intact(doc.questions[0], old.dir).length === 0 && C.intact(Object.assign(good(), { exchange_end: Object.assign({}, good().exchange_end, { declined: undefined }) }), makeDir().dir).join() === 'exchange_end', C.intact(doc.questions[0], old.dir).join(', '));
  const d = partsOf(ps => { ps['135-reply'] = ps['145-reply']; delete ps['145-reply']; });
  t('ASSEMBLER a decline written before the other side\'s last turn does not answer that turn', d.q.exchange_end.declined.claim === '135-reply' && lastWordCap(d.q));
  const e = partsOf(ps => { ps['175-counter'] = { role: 'counter', side: 'objection', nothing_new: true }; ps['180-reply'] = { role: 'reply', side: 'claim', nothing_new: true, turns: [], points: [], evidence: [] }; });
  t('ASSEMBLER each side\'s latest decline is the one kept', e.q.exchange_end.declined.claim === '180-reply' && e.q.exchange_end.declined.objection === '175-counter' && !lastWordCap(e.q), JSON.stringify(e.q.exchange_end.declined));
}
{ const a = partsOf(null, { rules: 6 });
  t('ASSEMBLER (rules 6) a bearing that does not say what it rests on is left out and reported', a.q.rules === 6 && a.q.bearings.length === 0 && a.problems.filter(p => p.part === '150-read' && /does not say what it rests on/.test(p.text)).length === 3, JSON.stringify(a.problems));
  const b = partsOf(ps => { ps['150-read'].bearings.forEach(x => { x.ground = 'words'; }); ps['150-read'].bearings.push({ point_id: 'C1', evidence_id: 'E020-1', bears: 'contradicts', ground: 'silence', note: 'he names no date at all' }, { point_id: 'O2', evidence_id: 'E010-1', bears: 'contradicts', ground: 'possibility', words: 'the very words that Ibn Example wrote on page 1' }, { point_id: 'O2', evidence_id: 'E020-1', bears: 'supports', ground: 'guess', words: 'these are the very words that Dr Critic wrote' }); }, { rules: 6 });
  const v = C.view(b.q, [], false), sil = b.q.bearings.find(x => x.ground === 'silence');
  t('ASSEMBLER (rules 6) a bearing keeps its ground: "words" and "possibility" copy words of the quote, "silence" has none to copy, and any other ground is left out', b.q.bearings.length === 5 && b.q.bearings.filter(x => x.ground === 'words').length === 3 && !!sil && sil.words === '' && b.q.bearings.some(x => x.ground === 'possibility') && b.problems.filter(p => /does not say what it rests on/.test(p.text)).length === 1, JSON.stringify(b.q.bearings.map(x => x.ground)) + JSON.stringify(b.problems));
  t('ASSEMBLER (rules 6) the view says of a silence and of a possibility that each counts for nothing', v.includes('a reader (150-read) found that E020-1 is silent on it (contradicts only by what it does not say; silence is not a statement and counts for nothing)') && v.includes('a reader (150-read) found that E010-1 only raises a possibility on it (contradicts; a possibility is not an assertion and counts for nothing)'), v.slice(v.indexOf('## POINTS'), v.indexOf('## POINTS') + 900));
  const c = partsOf(ps => { ps['150-read'].bearings[0].ground = 'silence'; });
  t('ASSEMBLER a case opened under the earlier rules is built as before: no ground is asked for and none is kept', c.q.rules === 0 && c.q.bearings.length === 3 && c.q.bearings.every(x => x.ground === undefined) && !c.problems.some(p => /rests on/.test(p.text)));
}
{ const root = path.join(TMP, 'opened'), list = path.join(TMP, 'opened.json'); fs.writeFileSync(list, JSON.stringify({ questions: [{ id: 'N1', question: 'A new question?', claim: 'A claim that is asked today', sides: { claim: { who: 'a', script: 'arabic' }, objection: { who: 'b', script: 'latin' } } }] }));
  spawnSync(process.execPath, [path.join(__dirname, 'case.js'), 'new', root, list], { encoding: 'utf8' });
  t('ASSEMBLER a case opened now is opened under rules ' + C.GROUND_RULES + ' (the planted pair still applies to it)', JSON.parse(fs.readFileSync(path.join(root, 'N1', 'question.json'), 'utf8')).rules === 6 && C.GROUND_RULES === 6 && C.GROUND_RULES >= C.PLANT_RULES);
}
{ const { q } = partsOf(null, { claimEvidence: [Object.assign(speaker('scholar', 'al-Selfmade', 9), { verified: true, check: { en: 'found', attribution: 'named', hash: 'x' }, stance: 'own', stance_by: 'someone else entirely', cut: 'faithful', cut_by: 'someone else entirely', who_matches: true, readings: [{ part: 'x', cut: 'faithful', stance: 'own', who_matches: true }], later_position: { result: 'none found', searched: [rec('a', 'b', 'c')] } })] });
  const raw = q.evidence.find(e => e.id === 'E010-4');
  t('ASSEMBLER a part that types "verified", a reading or a later-position search for its own quote has all of it thrown away', raw && raw.verified === undefined && raw.check === undefined && raw.later_position === undefined && raw.readings.length === 1 && raw.readings[0].part === '110-read');
}
{ const a = partsOf(ps => { ps['130-reply'].role = 'read'; ps['130-reply'].turn_checks = [{ turn: 1, faithful: true, note: 'x' }]; });
  t('ASSEMBLER an advocate\'s part that calls itself a reader\'s part is left out and reported: the role is the one in the file name', a.problems.some(p => p.part === '130-reply' && /calls itself "read"/.test(p.text)) && !a.q.exchange.some(x => x.part === '130-reply'));
}
{ const a = partsOf(ps => { ps['130-reply'].readings = [{ evidence_id: 'E010-1', cut: 'faithful', stance: 'own', who_matches: true, note: 'x' }]; ps['130-reply'].turn_checks = [{ turn: 1, faithful: true }]; ps['130-reply'].premises = [{ id: 'O1', status: 'false' }]; });
  t('ASSEMBLER an advocate\'s part cannot carry readings, turn checks or marks: each role carries only its own kind of entry', a.problems.filter(p => p.part === '130-reply' && /may not carry/.test(p.text)).length === 3 && a.q.evidence.find(e => e.id === 'E010-1').readings.every(r => r.part !== '130-reply') && a.q.exchange[0].checks.every(c => c.part !== '130-reply'));
}
{ const a = partsOf(ps => { ps['130-reply'].points = [{ id: 'O7', side: 'objection', text: 'A weak point planted on the other side' }]; });
  t('ASSEMBLER a point an advocate raises is a point of his own side, whatever side he writes on it', a.q.points.find(p => p.id === 'O7').side === 'claim');
}
{ const a = partsOf(ps => { ps['110-read'].readings[0].cut = 'changes-meaning'; ps['155-read'] = { role: 'read', readings: [{ evidence_id: 'E010-1', cut: 'faithful', stance: 'own', who_matches: true, note: 'a second reader, run to turn the first one green' }] }; });
  const e = a.q.evidence.find(x => x.id === 'E010-1');
  t('ASSEMBLER a second reader cannot erase the first: both readings are kept and the stricter one stands', e.cut === 'changes-meaning' && e.readers_disagree === true && e.readings.length === 2);
}
{ const a = partsOf(ps => { ps['150-read'].turn_checks[0].faithful = false; ps['155-read'] = { role: 'read', turn_checks: [{ turn: 1, faithful: true, note: 'run again' }] }; });
  t('ASSEMBLER the same for a turn: one reader who found it unfaithful is not outvoted by running another', a.q.exchange[0].faithful === false && a.q.exchange[0].checks.length === 2);
}
{ const a = partsOf(ps => { ps['150-read'].bearings[0].words = 'words that are not in the quote at all'; });
  t('ASSEMBLER a bearing must copy words of the quote itself; made-up words are left out and reported', !a.q.bearings.some(b => b.point === 'C1' && b.evidence === 'E010-1') && a.problems.some(p => /are not words of that quote/.test(p.text)));
}
{ const a = partsOf(ps => { ps['170-extract'] = { role: 'extract', needs: [{ id: 'C1', needed: true, bears_on: 'the claim rests on it' }, { id: 'C2', needed: false, not_needed_because: 'x x x x x x' }, { id: 'O1', needed: true, bears_on: 'the objection rests on it' }, { id: 'O2', needed: true, bears_on: 'the reply attacks exactly this point' }] }; });
  const p = a.q.points.find(x => x.id === 'O2');
  t('ASSEMBLER where a second neutral reader, after the exchange, holds a point needed, it counts as needed and the difference is kept', p.needed === true && p.needs_differ === true);
}
{ const a = partsOf(ps => { ps['900-judge'].premises = MARKS.map(m => Object.assign({}, m, { needed: false, not_needed_because: 'the judge would like to set this aside quietly' })); });
  t('ASSEMBLER the judge cannot change which points the argument needs', a.q.premises.find(x => x.id === 'O1').needed === true);
}
{ const a = partsOf(ps => { ps['905-judge'] = JSON.parse(JSON.stringify(ps['900-judge'])); ps['905-judge'].verdict.short = 'A second ruling.'; });
  t('ASSEMBLER a judge who rules again does not erase the first ruling: both are kept, and the fairness reader must confirm again', a.q.verdict.history.length === 2 && a.q.verdict.short === 'A second ruling.' && /920-swap/.test(a.q.swap_test.confirmed_by || ''));
}
{ const a = partsOf(ps => { ps['920-swap'].swap = { confirmed: false, note: 'the standard was applied more strictly to the objection' }; });
  t('ASSEMBLER a fairness reader who refuses is recorded, and the swap test then fails', !a.q.swap_test.confirmed_by && /more strictly/.test(a.q.swap_test.refused_note) && failing(Object.assign(good(), { swap_test: a.q.swap_test })).includes('swap-test'));
}
{ const a = partsOf(ps => { ps['920-swap'].swap = { confirmed: false, note: 'the standard was applied more strictly to the objection' }; ps['970-judge'] = JSON.parse(JSON.stringify(ps['900-judge'])); ps['970-judge'].verdict.short = 'A second ruling.'; ps['990-swap'] = { role: 'swap', swap: { confirmed: true, note: 'the same standard of a dated written record is applied to both' } }; });
  const h = a.q.verdict.history, line = M.coverageLines(M.coverage({}, [a.q]))[3];
  t('ASSEMBLER a refusal by the fairness reader is still on the record after the judges rule again: it stays with the ruling he read, the new ruling carries its own, and the RECORD line counts it', h.length === 2 && h[0].fairness.length === 1 && h[0].fairness[0].confirmed === false && /more strictly/.test(h[0].fairness[0].note) && h[1].fairness[0].confirmed === true && /990-swap/.test(a.q.swap_test.confirmed_by || '') && !a.q.swap_test.refused_note && /judging run again 1 time\(s\) \(a fairness reader refused 1 ruling\(s\)\)/.test(line), line);
  const b = partsOf();
  t('ASSEMBLER a ruling the fairness reader confirmed adds nothing to the RECORD line', !/fairness reader refused/.test(M.coverageLines(M.coverage({}, [b.q]))[3]) && b.q.verdict.history[0].fairness[0].confirmed === true);
}
{ const q = makeDir().q; t('ASSEMBLER the exchange ends "nothing-new-confirmed" only when the last neutral search said so, no point is unchecked and nothing found is left off the table', q.exchange_end.stopped_by === 'nothing-new-confirmed' && q.exchange_end.unchecked.length === 0 && q.exchange_end.last_word === 'objection'); }
{ const a = partsOf(ps => { delete ps['120-check']; delete ps['900-judge'].premises; });
  t('ASSEMBLER points nobody marked are listed as unchecked, and the exchange is then not "confirmed finished"', a.q.exchange_end.unchecked.length === 4 && a.q.exchange_end.stopped_by === 'round-limit' && a.q.premises.length === 0);
}
{ const a = partsOf(ps => { ps['165-reply'] = { role: 'reply', side: 'claim', nothing_new: true, turns: [], evidence: [Object.assign(speaker('scholar', 'Ibn Example', 1), { replaces: 'E010-1', on_page_as: 'Ibn Example al-Dimashqi' })] }; });
  const e = a.q.evidence.find(x => x.id === 'E010-1');
  t('ASSEMBLER a quote given again keeps its id (what points to it still does), and what was read about the old wording is forgotten', e.gathered_by === '165-reply' && e.on_page_as === 'Ibn Example al-Dimashqi' && !e.cut && !a.q.bearings.some(b => b.evidence === 'E010-1') && a.q.exchange[0].faithful === undefined);
}
{ const base = makeDir().q, was = base.exchange[0], theirs = base.exchange.findIndex(x => x.side === 'objection') + 1;
  const a = partsOf(ps => { ps['165-reply'] = { role: 'reply', side: 'claim', nothing_new: true, turns: [{ replaces_turn: 1, when: '8th century AH (d. 774 AH)' }] }; });
  const now = a.q.exchange[0];
  t('ASSEMBLER a turn corrected by its own side keeps its place, its words and its quote, takes the corrected date, keeps the old wording beside it, and must be read again', a.q.exchange.length === base.exchange.length && now.when === '8th century AH (d. 774 AH)' && now.text === was.text && now.who === was.who && now.evidence_ref.join() === was.evidence_ref.join() && now.part === '165-reply' && now.faithful === undefined && now.earlier.length === 1 && now.earlier[0].when === was.when && now.earlier[0].part === was.part, JSON.stringify(now));
  const b = partsOf(ps => { ps['165-reply'] = { role: 'reply', side: 'claim', nothing_new: true, turns: [{ replaces_turn: 1, text: 'He says something far stronger than he said when the other side answered him.' }] }; });
  t('ASSEMBLER a turn the other side has already answered cannot be reworded afterwards: the correction is refused and the turn stays as it was answered', b.q.exchange[0].text === was.text && b.q.exchange[0].part === was.part && b.problems.some(p => p.part === '165-reply' && /already been answered/.test(p.text)), JSON.stringify(b.problems));
  const c = partsOf(ps => { ps['165-reply'] = { role: 'reply', side: 'claim', nothing_new: true, turns: [{ replaces_turn: theirs, when: '1999' }] }; });
  t('ASSEMBLER nobody corrects a turn of the other side', theirs > 0 && c.q.exchange[theirs - 1].part === base.exchange[theirs - 1].part && c.q.exchange[theirs - 1].when === base.exchange[theirs - 1].when && c.problems.some(p => p.part === '165-reply' && /turn of your own side/.test(p.text)), JSON.stringify(c.problems));
}

// ---------- the translator is tested: a wrong pair is planted among those he is given ----------
{ const AR1 = 'خرجت نار عظيمة من ارض الحجاز في تلك السنة', AR2 = 'وكتب اهل المدينة بذلك الى دمشق بعد ايام';
  const pairs = [Object.assign(speaker('scholar', 'Ibn Pair', 41), { quote_ar: AR1, check_url_ar: 'https://shamela.ws/book/1/41', quote_en: 'a great fire came out of the land of the Hijaz in that year', translated_by_map: true }), Object.assign(speaker('scholar', 'Ibn Pair', 42), { quote_ar: AR2, check_url_ar: 'https://shamela.ws/book/1/42', quote_en: 'and the people of Medina wrote of it to Damascus some days later', translated_by_map: true })];
  const d = makeDir({ claimEvidence: pairs }), qf = path.join(d.dir, 'question.json'), Q = JSON.parse(fs.readFileSync(qf, 'utf8'));
  const put = (name, obj) => fs.writeFileSync(path.join(d.dir, 'parts', name + '.json'), JSON.stringify(obj));
  const before = C.assemble(d.dir).q, ids = before.evidence.filter(e => e.quote_ar && e.quote_en && e.kind !== 'quran').map(e => e.id);
  const own = id => ({ evidence_id: id, own_translation: 'my own rendering of the passage', agree: true, note: '' });
  put('115-translate', { role: 'translate', translations: ids.map(own) });
  const old = C.assemble(d.dir).q;
  t('PLANT a case opened before this test existed plants nothing, takes the translator\'s work as before, and its counts say that he was not tested', ids.length === 2 && old.rules === 0 && old.translator_tests.length === 0 && ids.every(id => (old.evidence.find(e => e.id === id).translation_check || {}).agree === true) && /no wrong pair was planted/.test(M.coverageLines(M.coverage({}, [old]))[0]), JSON.stringify(ids));
  fs.unlinkSync(path.join(d.dir, 'parts', '115-translate.json'));
  fs.writeFileSync(qf, JSON.stringify(Object.assign({ rules: C.PLANT_RULES }, Q)));
  const q0 = C.assemble(d.dir).q, plant = C.planted(q0), again = C.planted(C.assemble(d.dir).q);
  const src = plant && q0.evidence.find(e => e.id === plant.of), donor = plant && q0.evidence.find(e => e.id === plant.english_of);
  t('PLANT the planted pair is the Arabic of one passage still to be checked beside the English of another passage, under an id no real quote has; made twice from the same parts it is the same pair', !!plant && ids.includes(plant.of) && plant.quote_ar === src.quote_ar && plant.quote_en === donor.quote_en && donor.quote_en !== src.quote_en && !q0.evidence.some(e => e.id === plant.id) && /^E\d{3}-\d+$/.test(plant.id) && JSON.stringify(plant) === JSON.stringify(again), JSON.stringify(plant));
  q0.evidence.forEach(seal);
  const list = C.translateView(q0, plant), given = C.givenView(q0, plant);
  t('PLANT the translator\'s list shows the planted pair among the real ones with nothing to tell it apart, and the English given for it is the other passage\'s', ids.concat([plant.id]).every(id => list.includes('## ' + id + '\n')) && !/plant/i.test(list) && given.includes('## ' + plant.id + '\n' + donor.quote_en) && !list.includes(donor.quote_en), list.slice(0, 300));
  const answer = agree => ({ role: 'translate', translations: ids.map(own).concat(agree === undefined ? [] : [{ evidence_id: plant.id, own_translation: 'my own rendering of the passage', agree, note: agree ? '' : 'the English given is of another passage altogether' }]) });
  put('115-translate', answer(false));
  let a = C.assemble(d.dir);
  t('PLANT a translator who refuses the planted pair passes: the test is kept in the record and his agreements on the real pairs are taken', a.q.translator_tests.length === 1 && a.q.translator_tests[0].caught === true && a.q.translator_tests[0].part === '115-translate' && ids.every(id => (a.q.evidence.find(e => e.id === id).translation_check || {}).agree === true) && !a.q.evidence.some(e => e.id === plant.id) && /planted among them 1 time\(s\); the translator caught it 1 time/.test(M.coverageLines(M.coverage({}, [a.q]))[0]), JSON.stringify(a.q.translator_tests));
  put('115-translate', answer(true));
  a = C.assemble(d.dir); a.q.evidence.forEach(seal);
  t('PLANT a translator who agrees to the planted pair fails: none of his agreements is taken, the pairs stay unchecked, the check says so and the record says why', a.q.translator_tests[0].caught === false && a.q.translator_tests[0].answered === true && ids.every(id => !a.q.evidence.find(e => e.id === id).translation_check) && a.problems.some(p => p.part === '115-translate' && /planted/.test(p.text)) && /has not been checked by a translator/.test(why(a.q, 'translation-checked')), JSON.stringify(a.q.translator_tests) + ' ' + why(a.q, 'translation-checked'));
  put('115-translate', answer());
  a = C.assemble(d.dir);
  t('PLANT a translator who leaves the planted pair out fails the same way', a.q.translator_tests[0].answered === false && a.q.translator_tests[0].caught === false && ids.every(id => !a.q.evidence.find(e => e.id === id).translation_check), JSON.stringify(a.q.translator_tests));
  const next = C.planted(a.q);
  put('116-translate', { role: 'translate', translations: ids.map(own).concat([{ evidence_id: next.id, own_translation: 'my own rendering of the passage', agree: false, note: 'not the same passage' }]) });
  a = C.assemble(d.dir);
  t('PLANT after a translator who failed, the next one is tested again, and passing, his work is taken; both tests stay in the record', a.q.translator_tests.length === 2 && a.q.translator_tests[0].caught === false && a.q.translator_tests[1].caught === true && a.q.translator_tests[1].part === '116-translate' && ids.every(id => (a.q.evidence.find(e => e.id === id).translation_check || {}).agree === true), JSON.stringify(a.q.translator_tests));
}

// ---------- prove.js: who wrote what, from the agents' own records ----------
{ const d = makeDir({ roadblock: true }), tdir = path.join(TMP, 'transcripts' + dirNo); fs.mkdirSync(tdir);
  const names = C.readParts(d.dir).parts.map(p => p.name), file = name => path.join(d.dir, 'parts', name + '.json');
  let uid = 0;
  const call = (name, input, result) => { const id = 'u' + (++uid); return [JSON.stringify({ timestamp: '2026-10-10T08:00:0' + (uid % 10) + '.000Z', message: { content: [{ type: 'tool_use', id, name, input }] } }), JSON.stringify({ message: { content: [{ type: 'tool_result', tool_use_id: id, content: result === undefined ? 'ok' : result }] } })]; };
  const agentFile = (id, label, lines) => { fs.writeFileSync(path.join(tdir, 'agent-' + id + '.jsonl'), lines.flat().join('\n')); fs.writeFileSync(path.join(tdir, 'agent-' + id + '.meta.json'), JSON.stringify({ description: label })); };
  const wrote = name => call('Write', { file_path: file(name), content: fs.readFileSync(file(name), 'utf8') });
  const claimSearches = () => [call('PowerShell', { command: 'node x\\domain\\mizan\\find.js "four exact sought words here"' }, 'turath.io: 0 hit(s)'), call('WebSearch', { query: 'al-Example answer original text' }, 'only the article'), call('WebFetch', { url: 'https://archive.org/advancedsearch.php?q=al-Example' }, 'numFound 0')];
  const libSearches = () => [call('PowerShell', { command: '$f="x\\find.js"; foreach($q in @("نار الحجاز بصرى","نار الحجاز")){ node $f $q }' }, '6 hit(s)')];
  const all = extra => names.forEach((name, i) => agentFile('a' + i, name + ':G1', [wrote(name)].concat((extra || {})[name] !== undefined ? (extra || {})[name] : name === '010-claim' ? claimSearches().concat(libSearches()) : name === '800-second' ? [call('WebSearch', { query: 'sought words of al-Example ketabonline' }), call('WebSearch', { query: 'al-Example answer' })] : [])));
  const q = JSON.parse(fs.readFileSync(path.join(d.dir, 'case.json'), 'utf8')).questions[0];
  all();
  let r = P.prove(d.dir, [tdir], q), s = r.searches['R010-1'];
  t('PROVE every part is, byte for byte, what the one agent given that task wrote', r.provenance.parts.length === names.length && r.provenance.parts.every(p => p.agent && p.writers === 1 && p.content_matches && p.label_matches), JSON.stringify(r.provenance.parts.filter(p => !p.content_matches || !p.label_matches)));
  t('PROVE a roadblock\'s searches are found in the record of the agent that declared it, and the second search in another agent\'s', s.ok === true && s.first_proved === 4 && s.first_answered === 4 && s.second_proved === 2 && s.second_answered === 2 && s.independent === true, JSON.stringify(s));
  t('PROVE what each search returned is kept beside it', /0 hit/.test(q.roadblocks[0].attempts[1].result_seen || '') && /numFound 0/.test(q.roadblocks[0].attempts[3].result_seen || ''));
  t('PROVE one run of the library search tool covers the Shamela library and Wikisource, so it proves one listing for each', q.roadblocks[0].attempts[0].proved_by && q.roadblocks[0].attempts[1].proved_by);
  const q5 = JSON.parse(JSON.stringify(q)); C.applyProof(q5, r);
  t('PROVE the library searches a part lists count once the writer\'s record shows them', q5.searched.claim_side.every(a => a.unproven !== true) && r.provenance.newest_search.startsWith('2026-10-10'));
  all({ '010-claim': claimSearches() });
  r = P.prove(d.dir, [tdir], q); const q4 = JSON.parse(JSON.stringify(q)); C.applyProof(q4, r);
  t('PROVE a library search a part lists, which its writer never ran, is marked and no longer counts', r.provenance.unproven.some(u => u.part === '010-claim') && q4.searched.claim_side.every(a => a.unproven === true) && failing(q4).includes('both-libraries'));
  all({ '010-claim': [call('WebSearch', { query: 'al-Example answer original text' }, 'x')].concat(libSearches()) });
  t('PROVE a search the agent lists but never ran is not proven, even if another agent ran it', P.prove(d.dir, [tdir], q).searches['R010-1'].ok === false);
  all({ '010-claim': [call('PowerShell', { command: '# node find.js "four exact sought words here"\nWrite-Output "node find.js \'four exact sought words here\' https://api.turath.io/search?q=x"' }, 'printed'), call('WebSearch', { query: 'al-Example answer original text book scan archive' }, 'x')] });
  s = P.prove(d.dir, [tdir], q).searches['R010-1'];
  t('PROVE a command that only prints or comments a search does not prove it, and one real search does not stand for two listings', s.first_proved <= 1, JSON.stringify(s));
  all({ '010-claim': [(() => { const id = 'e' + (++uid); return [JSON.stringify({ message: { content: [{ type: 'tool_use', id, name: 'WebSearch', input: { query: 'al-Example answer original text' } }] } }), JSON.stringify({ message: { content: [{ type: 'tool_result', tool_use_id: id, is_error: true, content: 'failed' }] } })]; })()].concat(libSearches()) });
  s = P.prove(d.dir, [tdir], q).searches['R010-1'];
  t('PROVE a search that came back with an error was made (listing it is true), is kept marked as failed, and is not counted as a search that looked', s.first_proved === 1 && s.first_answered === 0 && s.ok === false && /^FAILED: /.test(q.roadblocks[0].attempts[2].result_seen || ''), JSON.stringify(s) + ' ' + q.roadblocks[0].attempts[2].result_seen);
  all({ '010-claim': [[JSON.stringify({ message: { content: [{ type: 'tool_use', id: 'n' + (++uid), name: 'WebSearch', input: { query: 'al-Example answer original text' } }] } })]].concat(libSearches()) });
  t('PROVE a search that never returned is not a search that was made', !P.prove(d.dir, [tdir], q).searches['R010-1'].first_proved && !q.roadblocks[0].attempts[2].proved_by);
  { const cs = claimSearches(), id = 'x' + (++uid);
    cs[2] = [JSON.stringify({ timestamp: '2026-10-10T08:00:09.000Z', message: { content: [{ type: 'tool_use', id, name: 'WebFetch', input: { url: 'https://archive.org/advancedsearch.php?q=al-Example' } }] } }), JSON.stringify({ message: { content: [{ type: 'tool_result', tool_use_id: id, is_error: true, content: 'Request failed with status code 403' }] } })];
    all({ '010-claim': cs.concat(libSearches()) });
    const r2 = P.prove(d.dir, [tdir], q), s2 = r2.searches['R010-1'], q7 = JSON.parse(JSON.stringify(q)); C.applyProof(q7, r2); q7.roadblocks.forEach(sealRb);
    t('PROVE a roadblock whose every search is in the record, one of them refused by the site, is not proven: too few searches looked', s2.first_proved === 4 && s2.first_answered === 3 && s2.ok === false && /only 3 first/.test(M.roadblockFaults(q7.roadblocks[0]).join(' ')), JSON.stringify(s2) + ' ' + M.roadblockFaults(q7.roadblocks[0]).join(' | '));
  }
  { const N = require(path.join(__dirname, 'verify.js')).norm, ag = { id: 'z', searches: [{ kind: 'web', query: N('ibn kathir later position on the fire'), seen: 'x', used: new Map() }] };
    const one = { where: 'web search', query: 'ibn kathir later position on the fire' }, other = { where: 'web search', query: 'ibn kathir later position on the fire hijaz' };
    t('PROVE one search stands again for the very same listing written again (under each quote of one author), never for a different listing', !!P.match(ag, one) && !!P.match(ag, JSON.parse(JSON.stringify(one))) && !P.match(ag, other));
    const fresh = query => ({ id: 'y', searches: [{ kind: 'web', query: N(query), seen: 'Found 12 results: 1. a page on the fire', used: new Map() }] });
    t('PROVE a listing with a word that was never typed is not that search, even on a search not yet used; a search with more words than the listing still is', !P.match(fresh('ibn kathir later position on the fire'), other) && !!P.match(fresh('ibn kathir later position on the fire hijaz busra'), other));
    const lied = P.match(fresh('ibn kathir later position on the fire'), Object.assign({ result: 'nothing found: no page carries it' }, one)), true1 = P.match(fresh('ibn kathir later position on the fire'), Object.assign({ result: '12 results, none of them his own later work' }, one));
    t('PROVE a listing that says "nothing found" beside an answer that shows hits is marked: the result written does not match what came back; one that reports the hits is not', !!lied && lied.differs === true && !!true1 && true1.differs === false, JSON.stringify([lied, true1]));
    const page = url => ({ id: 'p', searches: [{ kind: 'page', url, seen: 'x', used: new Map() }] }), listedUrl = 'https://api.openalex.org/works?per-page=8&filter=fulltext.search:%22fire%20of%20the%20hijaz%22';
    t('PROVE by address: the very address or a longer one that begins with it proves a listing; a fetch of a shorter address does not', !P.match(page('api.openalex.org/works?per-page=8'), { where: 'OpenAlex', query: 'x', url: listedUrl }) && !!P.match(page('api.openalex.org/works?per-page=8&filter=fulltext.search:"fire of the hijaz"'), { where: 'OpenAlex', query: 'x', url: listedUrl }) && !!P.match(page('shamela.ws/book/4445/11082#p3'.replace(/#.*/, '') + '/x'), { where: 'Shamela', query: 'x', url: 'https://shamela.ws/book/4445/11082' }));
  }
  { const cs = claimSearches(), id = 'f' + (++uid);
    const refused = [JSON.stringify({ timestamp: '2026-10-10T08:00:09.000Z', message: { content: [{ type: 'tool_use', id, name: 'PowerShell', input: { command: '$f="x\\find.js"; foreach($q in @("نار الحجاز بصرى","نار الحجاز")){ node $f $q }' } }] } }), JSON.stringify({ message: { content: [{ type: 'tool_result', tool_use_id: id, is_error: true, content: 'Exit code 1 getaddrinfo ENOTFOUND' }] } })];
    all({ '010-claim': cs.concat([refused]) });
    const r3 = P.prove(d.dir, [tdir], q), q8 = JSON.parse(JSON.stringify(q)); C.applyProof(q8, r3);
    t('PROVE a library search that was made and came back with an error is said to be that (not "not in the record"), and is not counted', r3.provenance.unproven.some(u => u.part === '010-claim' && u.why === 'made, got no answer' && /^FAILED: /.test(u.seen)) && q8.searched.claim_side.every(a => a.unproven === true), JSON.stringify(r3.provenance.unproven));
  }
  { // A shell command that asks several things and ends with an error: the find tool's own lines decide, thing by thing.
    const callErr = (name, input, result) => { const id = 'r' + (++uid); return [JSON.stringify({ timestamp: '2026-10-10T08:00:09.000Z', message: { content: [{ type: 'tool_use', id, name, input }] } }), JSON.stringify({ message: { content: [{ type: 'tool_result', tool_use_id: id, is_error: true, content: result }] } })]; };
    const cmd = 'node x\\domain\\mizan\\find.js "four exact sought words here"\nnode x\\domain\\mizan\\find.js --read https://refused.example.org/page';
    const lines = (a, b, alive) => ['Exit code 1', 'turath.io (the Shamela library): ' + a, '  some book | some author | vol 1 p 2 | https://shamela.ws/book/1/2', 'Arabic Wikisource: ' + b, 'MIZAN FIND: "four exact sought words here" · 0 hit(s) · ' + alive + ' search service(s) answering', 'MIZAN FIND: the page is not readable by the checker (HTTP 403)'].join('\n');
    const withFind = out => { const cs = claimSearches(); cs[0] = callErr('PowerShell', { command: cmd }, out); all({ '010-claim': cs.concat(libSearches()) }); return P.prove(d.dir, [tdir], q).searches['R010-1']; };
    let s3 = withFind(lines('0 hit(s)', '0 hit(s)', 2));
    t('PROVE a search the find tool answered counts though the same command ended with an error over another address; what the tool said of each library is kept', s3.first_proved === 4 && s3.first_answered === 4 && s3.ok === true && /turath\.io: 0 hit\(s\) · Arabic Wikisource: 0 hit\(s\) · MIZAN FIND: "four exact sought words here" · 0 hit\(s\) · 2 search service\(s\) answering/.test(q.roadblocks[0].attempts[0].result_seen || ''), JSON.stringify(s3) + ' ' + q.roadblocks[0].attempts[0].result_seen);
    s3 = withFind(lines('no answer', 'no answer', 0));
    t('PROVE a search of the libraries that no search service answered was made, and is not counted: it looked at nothing', s3.first_proved === 4 && s3.first_answered === 2 && s3.ok === false && /^FAILED: /.test(q.roadblocks[0].attempts[0].result_seen || ''), JSON.stringify(s3));
    s3 = withFind(lines('0 hit(s)   [its control search did not answer: this result proves nothing]', '0 hit(s)', 1));
    t('PROVE a library whose control search did not answer in that run is not counted for the listing that names it; the one that answered is', s3.first_proved === 4 && s3.first_answered === 3 && /^FAILED: /.test(q.roadblocks[0].attempts[0].result_seen || '') && !/^FAILED: /.test(q.roadblocks[0].attempts[1].result_seen || ''), JSON.stringify(s3) + ' ' + q.roadblocks[0].attempts.map(a => a.where + '=' + String(a.result_seen).slice(0, 12)).join(' | '));
    s3 = withFind(['Arabic Wikisource: 0 hit(s)', 'MIZAN FIND: "four exact sought words here" · 0 hit(s) · 1 search service(s) answering'].join('\n'));
    t('PROVE a listing that names a library the tool did not ask in that run is not in the record', s3.first_proved === 3 && !q.roadblocks[0].attempts[0].proved_by && !!q.roadblocks[0].attempts[1].proved_by, JSON.stringify(s3) + ' ' + q.roadblocks[0].attempts.map(a => a.where + '=' + (a.proved_by ? 'y' : 'n')).join(' | '));
    all({ '010-claim': [callErr('PowerShell', { command: 'node x\\domain\\mizan\\find.js --read https://shamela.ws/book/1/2 --at "نار الحجاز بصرى الشام"' }, 'Exit code 1\nMIZAN FIND: https://shamela.ws/book/1/2 · 900 words · the page calls itself: x\nthe words are not on the page as given: بصرى')] });
    const mine = () => P.readAgents([tdir]).find(a => a.label === '010-claim:G1'), look = { where: 'Shamela library (find tool, read)', query: 'نار الحجاز بصرى الشام' };
    const h1 = P.match(mine(), look);
    t('PROVE words looked for on one page that was read are a look into that page\'s library: the page was read, so it counts, though the tool ended with "not on the page"', !!h1 && h1.failed === false && h1.kind === 'look' && /900 words/.test(h1.seen), JSON.stringify(h1));
    t('PROVE such a look does not prove a search of the libraries, nor a look into another library', !P.match(mine(), { where: 'turath.io full-text search', query: look.query }) && !P.match(mine(), { where: 'OpenAlex (read)', query: look.query }) && !P.match(mine(), { where: 'Arabic Wikisource page read', query: look.query }));
    all({ '010-claim': [call('PowerShell', { command: 'node x\\find.js "نار الحجاز بصرى"\nWrite-Output \'MIZAN FIND: "تطرد الناس الى محشرهم" · 0 hit(s) · 2 search service(s) answering\'' }, 'turath.io (the Shamela library): 3 hit(s)\nArabic Wikisource: 0 hit(s)\nMIZAN FIND: "نار الحجاز بصرى" · 3 hit(s) · 2 search service(s) answering\nMIZAN FIND: "تطرد الناس الى محشرهم" · 0 hit(s) · 2 search service(s) answering')] });
    t('PROVE a result line an agent only printed proves nothing: what was asked is read from the command, and the printed text is not part of it', !P.match(mine(), { where: 'turath.io', query: 'تطرد الناس الى محشرهم' }) && !!P.match(mine(), { where: 'turath.io', query: 'نار الحجاز بصرى' }));
    // A fetch tool says "HTTP 403" in plain words with no error flag, and a pipe hides the find tool's exit code: neither read anything.
    { const cs = claimSearches(); cs[2] = call('WebFetch', { url: 'https://archive.org/advancedsearch.php?q=al-Example' }, 'The server returned HTTP 403 Forbidden. The response body was not retrieved.');
      all({ '010-claim': cs.concat(libSearches()) });
      let x = P.prove(d.dir, [tdir], q).searches['R010-1'];
      t('PROVE a fetch that came back as "HTTP 403, the response body was not retrieved", with no error flag set, is made and not counted', x.first_proved === 4 && x.first_answered === 3 && x.ok === false && /^FAILED: The server returned HTTP 403/.test(q.roadblocks[0].attempts[3].result_seen || ''), JSON.stringify(x) + ' ' + q.roadblocks[0].attempts[3].result_seen);
      cs[2] = call('WebFetch', { url: 'https://archive.org/advancedsearch.php?q=al-Example' }, 'REDIRECT DETECTED: The URL redirects to a location that was not fetched automatically.');
      all({ '010-claim': cs.concat(libSearches()) });
      t('PROVE the same for a redirect the fetch tool did not follow', P.prove(d.dir, [tdir], q).searches['R010-1'].first_answered === 3);
      cs[2] = call('PowerShell', { command: 'node x\\find.js --read "https://archive.org/advancedsearch.php?q=al-Example" --at "al-Example" 2>&1 | Select-Object -First 4' }, 'MIZAN FIND: the page is not readable by the checker (HTTP 403): a quote from it cannot be verified; find the text on a page it can read');
      all({ '010-claim': cs.concat(libSearches()) });
      x = P.prove(d.dir, [tdir], q).searches['R010-1'];
      t('PROVE an address the find tool could not read is made and not counted, though the pipe after it hid the tool\'s exit code and the command ended without an error', x.first_proved === 4 && x.first_answered === 3 && /not readable by the checker \(HTTP 403\)/.test(q.roadblocks[0].attempts[3].result_seen || ''), JSON.stringify(x) + ' ' + q.roadblocks[0].attempts[3].result_seen);
      cs[2] = call('PowerShell', { command: 'node x\\find.js --read "https://archive.org/advancedsearch.php?q=al-Example" 2>&1 | Select-Object -First 4' }, 'MIZAN FIND: https://archive.org/advancedsearch.php?q=al-Example · NOT READABLE by the checker (HTTP 403): a quote from it cannot be verified');
      all({ '010-claim': cs.concat(libSearches()) });
      x = P.prove(d.dir, [tdir], q).searches['R010-1'];
      t('PROVE the find tool\'s newer line, which names the address it could not read, is read the same way', x.first_answered === 3 && /NOT READABLE/.test(q.roadblocks[0].attempts[3].result_seen || ''), JSON.stringify(x) + ' ' + q.roadblocks[0].attempts[3].result_seen);
      cs[2] = call('PowerShell', { command: 'node x\\find.js --read "https://archive.org/advancedsearch.php?q=al-Example" 2>&1 | Select-Object -First 4' }, 'MIZAN FIND: https://archive.org/advancedsearch.php?q=al-Example · 412 words · the page calls itself: Search');
      all({ '010-claim': cs.concat(libSearches()) });
      t('PROVE an address the find tool says it read counts', P.prove(d.dir, [tdir], q).searches['R010-1'].first_answered === 4);
      all();
    }
    // The second searcher is proven to have searched on his own; and the model each agent ran on is read from his record.
    { const sf = file('800-second'), mk = (id, model, lines) => { fs.writeFileSync(path.join(tdir, 'agent-' + id + '.jsonl'), lines.flat().concat([JSON.stringify({ type: 'assistant', message: { model, content: [] } })]).join('\n')); };
      const sec = lines => { all(); agentFile('a' + names.indexOf('800-second'), '800-second:G1', lines.concat([wrote('800-second')])); return P.prove(d.dir, [tdir], q).provenance.parts.find(p => p.part === '800-second'); };
      const two = [call('WebSearch', { query: 'sought words of al-Example ketabonline' }), call('WebSearch', { query: 'al-Example answer' })];
      let x = sec([call('Read', { file_path: path.join(d.dir, 'view.md') })].concat(two));
      t('PROVE a second searcher who read the view (it shows what is sought, not how it was searched for) and searched is shown to have searched on his own', x.sealed === true, JSON.stringify(x));
      x = sec([call('Read', { file_path: file('010-claim') })].concat(two));
      t('PROVE a second searcher whose record shows the first searcher\'s part before his own was final is not', x.sealed === false && x.saw.includes('part:010-claim'), JSON.stringify(x));
      x = sec([call('PowerShell', { command: 'Get-Content "' + path.join(d.dir, 'case.json') + '" | Select-String attempts' })].concat(two));
      t('PROVE nor is one who opened the case file, where every search of the first is written', x.sealed === false && x.saw.includes('case.json'), JSON.stringify(x));
      all(); const ix = names.indexOf('010-claim'), iy = names.indexOf('020-objection');
      mk('a' + ix, 'model-a', [wrote('010-claim')].concat(claimSearches(), libSearches())); mk('a' + iy, 'model-small', [wrote('020-objection')]);
      const pm = P.prove(d.dir, [tdir], q).provenance.parts;
      t('PROVE the model each agent ran on is read from his own record', pm.find(p => p.part === '010-claim').model === 'model-a' && pm.find(p => p.part === '020-objection').model === 'model-small', JSON.stringify(pm.slice(0, 2).map(p => p.model)));
      all();
    }
    // A case folder kept elsewhere afterwards (an archive): still proven, by question id, part name and content, and the proof says it was moved.
    { all(); const away = path.join(TMP, 'archive' + dirNo, path.basename(d.dir)), other = path.join(TMP, 'archive' + dirNo, 'renamed');
      for (const to of [away, other]) { fs.mkdirSync(path.join(to, 'parts'), { recursive: true }); for (const n of names) fs.copyFileSync(file(n), path.join(to, 'parts', n + '.json')); fs.copyFileSync(path.join(d.dir, 'question.json'), path.join(to, 'question.json')); }
      const m1 = P.prove(away, [tdir], q).provenance, m2 = P.prove(other, [tdir], q).provenance, m0 = P.prove(d.dir, [tdir], q).provenance;
      t('PROVE a case folder copied elsewhere under its own name is still proven, part by part and byte for byte, and the proof says the folder is not where the agents wrote', m0.moved === false && m1.moved === true && m1.parts.length === names.length && m1.parts.every(p => p.agent && p.writers === 1 && p.content_matches && p.label_matches), JSON.stringify(m1.parts.filter(p => !p.content_matches).map(p => p.part)));
      fs.writeFileSync(path.join(away, 'parts', '120-check.json'), fs.readFileSync(path.join(away, 'parts', '120-check.json'), 'utf8').replace('"status": "false"', '"status": "unsupported"'));
      t('PROVE in a copied folder a part changed after the copy is caught like anywhere else', P.prove(away, [tdir], q).provenance.parts.find(p => p.part === '120-check').content_matches === false);
      t('PROVE a folder under another name is not taken for the case the agents wrote', m2.parts.every(p => !p.agent));
    }
    // Blind judges and a translator who works first: proven from the order of what each opened and wrote.
    const jf = file('900-judge'), j2 = file('910-judge2'), tn = '115-translate', tf = file(tn), vb = path.join(d.dir, 'view-blind.md'), vm = path.join(d.dir, 'view.md');
    const body = n => fs.readFileSync(file(n), 'utf8'), sealedOf = (n, lines) => { all({ [n]: lines }); return P.prove(d.dir, [tdir], q).provenance.parts.find(p => p.part === n); };
    let s9 = sealedOf('900-judge', [call('Read', { file_path: vb }), call('PowerShell', { command: 'node x\\lib\\mizan.js outcome "' + d.dir + '" --blind' }), call('Write', { file_path: jf, content: body('900-judge') }), call('PowerShell', { command: 'node x\\lib\\mizan.js check "' + d.dir + '" --only G1 --blind' })]);
    t('PROVE a judge who read the blind view, ran the commands in their blind form and wrote his part is shown to have judged blind', s9.sealed === true && s9.saw.length === 0, JSON.stringify(s9));
    s9 = sealedOf('900-judge', [call('Read', { file_path: vb }), call('Read', { file_path: j2 }), call('Write', { file_path: jf, content: body('900-judge') })]);
    t('PROVE a judge whose record shows the second judge\'s part before his own marks were final is not shown blind, and the check says what he opened', s9.sealed === false && s9.saw.includes('part:910-judge2'), JSON.stringify(s9));
    s9 = sealedOf('900-judge', [call('Read', { file_path: vb }), call('Write', { file_path: jf, content: 'x' }), call('PowerShell', { command: 'node x\\lib\\mizan.js outcome "' + d.dir + '"' }), call('Write', { file_path: jf, content: body('900-judge') })]);
    t('PROVE the outcome command in its open form, which prints the second judge\'s marks, run before the judge\'s last write, breaks the blindness', s9.sealed === false && s9.saw.includes('outcome (not blind)'), JSON.stringify(s9));
    s9 = sealedOf('900-judge', [call('PowerShell', { command: 'Get-Content "' + vm + '" | Select-Object -First 50' }), call('Write', { file_path: jf, content: body('900-judge') })]);
    t('PROVE the full view opened through a shell command counts like any other opening; the blind view does not', s9.sealed === false && s9.saw.includes('view.md'), JSON.stringify(s9));
    s9 = sealedOf('900-judge', [call('Read', { file_path: vb }), call('Write', { file_path: jf, content: body('900-judge') }), call('Read', { file_path: j2 }), call('Read', { file_path: vm })]);
    t('PROVE what a judge opens after his marks are final does not count against him', s9.sealed === true, JSON.stringify(s9));
    s9 = sealedOf('910-judge2', [call('Read', { file_path: vb }), call('PowerShell', { command: 'node x\\lib\\mizan.js outcome "' + d.dir + '" --blind' }), call('Write', { file_path: j2, content: body('910-judge2') })]);
    t('PROVE the second judge may not run the outcome command at all before his part is final: even its blind form prints the first judge\'s result', s9.sealed === false && s9.saw.includes('outcome (blind)'), JSON.stringify(s9));
    // (the test case has no translator's part of its own: one is put there for these two tests and taken away again)
    fs.writeFileSync(tf, JSON.stringify({ role: 'translate', translations: [] }));
    const translator = lines => { all(); agentFile('tx', tn + ':G1', lines); return P.prove(d.dir, [tdir], q).provenance.parts.find(p => p.part === tn); };
    s9 = translator([call('Read', { file_path: path.join(d.dir, 'view-translate.md') }), call('Write', { file_path: tf, content: 'x' }), call('Read', { file_path: vm }), call('Write', { file_path: tf, content: body(tn) })]);
    t('PROVE a translator who wrote his own translation before opening the given English is shown to have worked from the original alone', s9.sealed === true && s9.content_matches === true, JSON.stringify(s9));
    s9 = translator([call('Read', { file_path: path.join(d.dir, 'view-translate.md') }), call('Read', { file_path: vm }), call('Write', { file_path: tf, content: body(tn) })]);
    t('PROVE a translator who opened the given English first is not', s9.sealed === false && s9.saw.includes('view.md'), JSON.stringify(s9));
    // Where a pair is planted, the translator may not look up which ids are real: until his part is final he opens only his list and then the given English.
    const strict = lines => { all(); agentFile('tx', tn + ':G1', lines); return P.prove(d.dir, [tdir], Object.assign({}, q, { rules: C.PLANT_RULES })).provenance.parts.find(p => p.part === tn); }, gv = path.join(d.dir, 'view-translate-given.md');
    s9 = strict([call('Read', { file_path: path.join(d.dir, 'view-translate.md') }), call('Write', { file_path: tf, content: 'x' }), call('Read', { file_path: gv }), call('Write', { file_path: tf, content: body(tn) })]);
    t('PROVE under the planted-pair rule, a translator who opened his list, wrote, then opened the given English and finished is shown to have worked from the original alone', s9.sealed === true, JSON.stringify(s9));
    s9 = strict([call('Read', { file_path: path.join(d.dir, 'view-translate.md') }), call('Read', { file_path: gv }), call('Write', { file_path: tf, content: body(tn) })]);
    t('PROVE under that rule, the given English opened before his own translation was written breaks it', s9.sealed === false && s9.saw.includes('the given English'), JSON.stringify(s9));
    s9 = strict([call('Read', { file_path: path.join(d.dir, 'view-translate.md') }), call('Write', { file_path: tf, content: 'x' }), call('Read', { file_path: vm }), call('Write', { file_path: tf, content: body(tn) })]);
    t('PROVE under that rule, the full view (which shows which ids are real) opened before his part was final breaks it too', s9.sealed === false && s9.saw.includes('view.md'), JSON.stringify(s9));
    fs.unlinkSync(tf); for (const x of ['agent-tx.jsonl', 'agent-tx.meta.json']) fs.unlinkSync(path.join(tdir, x));
    // The agent tried, the try failed, and it tried again: the listing stands on the try that answered.
    const two = 'node x\\find.js "نار الحجاز بصرى الشام"';
    all({ '010-claim': [callErr('PowerShell', { command: two }, 'Exit code 9'), call('PowerShell', { command: two }, 'turath.io (the Shamela library): 5 hit(s)\nArabic Wikisource: 0 hit(s)\nMIZAN FIND: "نار الحجاز بصرى الشام" · 5 hit(s) · 2 search service(s) answering')] });
    const h2 = P.match(mine(), { where: 'turath.io (Shamela)', query: 'نار الحجاز بصرى الشام' });
    t('PROVE a search that failed and was run again stands on the run that answered', !!h2 && h2.failed === false && /5 hit\(s\)/.test(h2.seen), JSON.stringify(h2));
    // A listing that names three libraries, of which one answered in that run: it looked (in that one), and what each said is kept.
    const three = (a, b, c, alive) => ['OpenAlex full text (academic papers and books): ' + a, 'Internet Archive full text (scanned books): ' + b, '  (no answer: ENOTFOUND)', 'English Wikisource (public-domain books): ' + c, 'MIZAN FIND: "fire from the land of the hijaz" · 0 hit(s) · ' + alive + ' search service(s) answering'].join('\n');
    const na = 'no answer   [its control search did not answer: this result proves nothing]', wide = { where: 'OpenAlex, Internet Archive and English Wikisource (find tool)', query: 'fire from the land of the Hijaz' };
    all({ '010-claim': [call('PowerShell', { command: 'node x\\find.js "fire from the land of the Hijaz"' }, three('0 hit(s)', na, na, 1))] });
    const h3 = P.match(mine(), wide);
    t('PROVE a listing that names three libraries, one of which answered, is a search that looked; the two that did not answer are named beside it', !!h3 && h3.failed === false && /Internet Archive[^·]*no answer \(its control search did not answer\)/.test(h3.seen), JSON.stringify(h3));
    t('PROVE the same run does not stand for a listing that names only a library that did not answer in it', (P.match(mine(), { where: 'Internet Archive full text', query: wide.query }) || {}).failed === true);
    all({ '010-claim': [call('PowerShell', { command: 'node x\\find.js "fire from the land of the Hijaz"' }, three(na, na, na, 0))] });
    t('PROVE a search of the libraries during which none of them answered (the network was down) is not a search that looked, whatever the exit code', (P.match(mine(), wide) || {}).failed === true);
    // A command that ran too long is moved to the background: only what the agent read of its result afterwards is its result.
    const loop = 'foreach($q in @("necks of the camels at Busra","fire of Medina in 654")){ "=== $q"; node x\\find.js $q }', moved = 'Command did not complete within its 120s timeout and was moved to the background (ID: bq1w2e3r4). Output is being written to: C:\\tmp\\tasks\\bq1w2e3r4.output.';
    const readBack = '     1\t=== necks of the camels at Busra\n     2\tOpenAlex full text (academic papers and books): 1 hit(s)\n     3\t  Apocalyptic Incidents | 2008 | x | https://doi.org/10.1/x\n     4\tInternet Archive full text (scanned books): 214 hit(s)\n     5\tEnglish Wikisource (public-domain books): 0 hit(s)\n     6\tMIZAN FIND: "necks of the camels at Busra" · 215 hit(s) · 3 search service(s) answering\n     7\t=== fire of Medina in 654';
    all({ '010-claim': [call('PowerShell', { command: loop }, moved), call('Read', { file_path: 'C:\\tmp\\tasks\\bq1w2e3r4.output' }, readBack)] });
    const h4 = P.match(mine(), { where: 'OpenAlex', query: 'necks of the camels at Busra' }), h5 = P.match(mine(), { where: 'OpenAlex', query: 'fire of Medina in 654' });
    t('PROVE a command moved to the background counts by what the agent read of its result afterwards: the search whose result it read looked, the one whose result it never read did not', !!h4 && h4.failed === false && /215 hit/.test(h4.seen) && !!h5 && h5.failed === true && /moved to the background/.test(h5.seen), JSON.stringify([h4, h5]));
    all({ '010-claim': [call('PowerShell', { command: loop }, moved)] });
    t('PROVE a command moved to the background whose result was never read proves no search that looked', (P.match(mine(), { where: 'OpenAlex', query: 'necks of the camels at Busra' }) || {}).failed === true);
    // The find tool now puts its result line first and names the words on every library's line: a cut output still says, search by search, what answered.
    const cut = 'foreach($q in @("necks of the camels at Busra","fire of Medina in 654")){ node x\\find.js $q | Select-Object -First 2 }';
    all({ '010-claim': [call('PowerShell', { command: cut }, moved), call('Read', { file_path: 'C:\\tmp\\tasks\\bq1w2e3r4.output' }, '     1\tMIZAN FIND: "necks of the camels at Busra" · 215 hit(s) · 3 search service(s) answering\n     2\tOpenAlex full text (academic papers and books): 1 hit(s) for "necks of the camels at Busra"\n     3\tMIZAN FIND: "fire of Medina in 654" · 0 hit(s) · 3 search service(s) answering · no hit means only\n     4\tOpenAlex full text (academic papers and books): no answer for "fire of Medina in 654"')] });
    const h8 = P.match(mine(), { where: 'OpenAlex full text', query: 'necks of the camels at Busra' }), h9 = P.match(mine(), { where: 'OpenAlex full text', query: 'fire of Medina in 654' }), h10 = P.match(mine(), { where: 'Internet Archive', query: 'necks of the camels at Busra' });
    t('PROVE with the find tool\'s result line first and the words named on each library\'s own line, an output cut to two lines still proves each search by itself: the library that answered, the one that did not, and no library whose line was cut away', !!h8 && h8.failed === false && /OpenAlex full text: 1 hit\(s\)/.test(h8.seen) && !!h9 && h9.failed === true && !h10, JSON.stringify([h8, h9, h10]));
    const mixed = ['MIZAN FIND: "necks of the camels at Busra" · 0 hit(s) · 1 search service(s) answering', 'OpenAlex full text (academic papers and books): 0 hit(s) for "necks of the camels at Busra"', 'Internet Archive full text (scanned books): no answer for "fire of Medina in 654"   [its control search did not answer: this result proves nothing]'].join('\n');
    all({ '010-claim': [call('PowerShell', { command: 'node x\\find.js "necks of the camels at Busra"; node x\\find.js "fire of Medina in 654"' }, mixed)] });
    t('PROVE a library\'s line belongs to the words it names, not to the search printed beside it', (P.match(mine(), { where: 'Internet Archive', query: 'necks of the camels at Busra' }) || null) === null && (P.match(mine(), { where: 'Internet Archive', query: 'fire of Medina in 654' }) || {}).failed === true);
    // The agent cut each result to its first lines, so the tool's summary lines are gone; the command ended without an error.
    all({ '010-claim': [call('PowerShell', { command: 'foreach($q in @("ابن كثير نار الحجاز بصرى","ابن حجر نار الحجاز المدينة")){ "=== $q"; node x\\find.js $q | Select-Object -First 2 }' }, '=== ابن كثير نار الحجاز بصرى\nturath.io (the Shamela library): 12 hit(s)\n  كتاب | مؤلف | vol 2 p 269 | https://shamela.ws/book/8573/673\n=== ابن حجر نار الحجاز المدينة\nturath.io (the Shamela library): 0 hit(s)\nArabic Wikisource: 0 hit(s)\nMIZAN FIND: "ابن حجر نار الحجاز المدينة" · 0 hit(s) · 2 search service(s) answering')] });
    const h6 = P.match(mine(), { where: 'turath.io (Shamela)', query: 'ابن كثير نار الحجاز بصرى' }), h7 = P.match(mine(), { where: 'Arabic Wikisource', query: 'ابن حجر نار الحجاز المدينة' });
    t('PROVE where the agent cut the output and the tool\'s own line for a search is gone, the command as a whole decides (and what is shown is said to be the whole command\'s); and the lines of one search are never read as another\'s', !!h6 && h6.failed === false && /^the whole command came back with: /.test(h6.seen) && !!h7 && h7.failed === false && !/12 hit/.test(h7.seen) && /^turath\.io: 0 hit\(s\) · Arabic Wikisource: 0 hit\(s\) · MIZAN FIND/.test(h7.seen), JSON.stringify([h6, h7]));
  }
  all();
  const pf = file('120-check'), before = fs.readFileSync(pf, 'utf8');
  fs.writeFileSync(pf, before.replace('"status": "false"', '"status": "unsupported"'));
  const q6 = C.assemble(d.dir).q; q6.evidence.forEach(seal); q6.roadblocks.forEach(sealRb); q6.provenance = P.prove(d.dir, [tdir], q6).provenance;
  t('PROVE a part edited by anyone after its agent wrote it (the orchestrator included) is caught: it is no longer what the record shows was written', /120-check is not what its agent wrote/.test(why(q6, 'provenance')), why(q6, 'provenance'));
  fs.writeFileSync(pf, before);
  agentFile('a' + names.indexOf('120-check'), '120-check:G1', [call('Write', { file_path: pf, content: before.replace('"confirmed"', '"CONFIRMED"') }), call('Edit', { file_path: pf, old_string: '"CONFIRMED"', new_string: '"confirmed"', replace_all: false })]);
  t('PROVE an agent\'s own later edits are replayed: a part written and then corrected by its writer still matches', P.prove(d.dir, [tdir], q).provenance.parts.find(p => p.part === '120-check').content_matches === true);
  agentFile('a' + names.indexOf('110-read'), '130-reply:G1', [wrote('110-read')]);
  const q7 = JSON.parse(JSON.stringify(q)); q7.provenance = P.prove(d.dir, [tdir], q).provenance;
  t('PROVE a reader\'s part written by an agent that was given the advocate\'s task is caught', /110-read was written by an agent that was given another task/.test(why(q7, 'provenance')), why(q7, 'provenance'));
  all(); agentFile('a1', '020-objection:G1', [wrote('020-objection'), wrote('110-read')]);
  q7.provenance = P.prove(d.dir, [tdir], q).provenance;
  t('PROVE a part two agents wrote is caught', /110-read was written by more than one agent/.test(why(q7, 'provenance')), why(q7, 'provenance'));
  all(); fs.unlinkSync(path.join(tdir, 'agent-a' + names.indexOf('900-judge') + '.jsonl'));
  q7.provenance = P.prove(d.dir, [tdir], q).provenance;
  t('PROVE a part that no agent\'s record shows being written is caught', /900-judge was not written by any agent/.test(why(q7, 'provenance')));
  // What the record shows beside the parts that are here: an agent given a part that wrote none, and a part an agent wrote that is gone.
  all(); let pv = P.prove(d.dir, [tdir], q).provenance;
  const checkNow = () => spawnSync(process.execPath, [LIB, 'check', d.dir, '--recorded', '--transcripts', tdir], { encoding: 'utf8' });
  t('PROVE where every agent wrote the part it was given and every part an agent wrote is in the folder, nothing is listed', pv.written_missing.length === 0 && pv.started_no_part.length === 0 && !/a part an agent wrote is no longer in the case/.test(checkNow().stdout), JSON.stringify([pv.written_missing, pv.started_no_part]));
  agentFile('zz', '950-judge:G1', [call('Read', { file_path: path.join(d.dir, 'view-blind.md') })]); agentFile('zo', '950-judge:G7', [call('Read', { file_path: 'x' })]);
  pv = P.prove(d.dir, [tdir], q).provenance; const q9 = JSON.parse(JSON.stringify(q)); q9.provenance = pv;
  t('PROVE an agent that was given a part of this question and wrote none is named (an agent of another question is not), and the RECORD line counts it: it is said, not hidden', pv.started_no_part.join() === '950-judge:G1' && pv.written_missing.length === 0 && / · agents given a part that wrote none 1/.test(M.coverageLines(M.coverage({}, [q9]))[3]) && !/agents given a part/.test(M.coverageLines(M.coverage({}, [good()]))[3]), JSON.stringify(pv.started_no_part) + ' ' + M.coverageLines(M.coverage({}, [q9]))[3].slice(-120));
  agentFile('zy', '955-swap:G1', [call('Write', { file_path: file('955-swap'), content: '{"role":"swap"}' })]);
  pv = P.prove(d.dir, [tdir], q).provenance; const rw = checkNow();
  t('PROVE a part an agent wrote that is no longer in the folder is named, and the check fails on it', pv.written_missing.join() === '955-swap' && pv.started_no_part.join() === '950-judge:G1' && rw.status === 1 && /FAIL G1 \| writers-proven \| a part an agent wrote is no longer in the case: 955-swap/.test(rw.stdout) && /outcome withheld while \d+ check\(s\) fail/.test(rw.stdout), JSON.stringify(pv.written_missing) + ' ' + (rw.stdout + rw.stderr).slice(0, 500));
  for (const x of ['zz', 'zo', 'zy']) for (const ext of ['.jsonl', '.meta.json']) fs.unlinkSync(path.join(tdir, 'agent-' + x + ext));
  t('PROVE the RECORD line names the models of the two judges whose rulings stand, as the agents\' records give them', / · judges: model-b and model-a$/.test(M.coverageLines(M.coverage({}, [good()]))[3]) && !/judges:/.test(M.coverageLines(M.coverage({}, [Object.assign(good(), { provenance: {} })]))[3]), M.coverageLines(M.coverage({}, [good()]))[3].slice(-80));
}

const run = (args, env) => spawnSync(process.execPath, [LIB].concat(args), { encoding: 'utf8', env: Object.assign({}, process.env, env || {}) });
// ---------- the holes a red team found: each attack as it was made, and that it is now caught ----------
{ const d = makeDir(), tdir = path.join(TMP, 'redteam' + dirNo); fs.mkdirSync(tdir);
  const names = C.readParts(d.dir).parts.map(p => p.name), file = name => path.join(d.dir, 'parts', name + '.json'), body = name => fs.readFileSync(file(name), 'utf8');
  const QJ = JSON.parse(fs.readFileSync(path.join(d.dir, 'question.json'), 'utf8')), q = JSON.parse(fs.readFileSync(path.join(d.dir, 'case.json'), 'utf8')).questions[0];
  let uid = 0;
  const call = (name, input, result, err) => { const id = 'h' + (++uid); return [JSON.stringify({ timestamp: '2026-10-10T08:00:0' + (uid % 10) + '.000Z', message: { content: [{ type: 'tool_use', id, name, input }] } }), JSON.stringify({ message: { content: [{ type: 'tool_result', tool_use_id: id, is_error: !!err, content: result === undefined ? 'ok' : result }] } })]; };
  // The harness's own first message to an agent: every line of the task is indented, and it carries the question and the claim.
  const given = (question, claim) => [JSON.stringify({ type: 'user', message: { role: 'user', content: '[Workflow harness]\n  You are one agent of a loop.\n  \n  THE QUESTION (G1): ' + question + '\n  THE CLAIM AS IT WAS ASKED: ' + claim + '\n  The claim side: Muslim scholars.' } })];
  const agentFile = (id, label, lines) => { fs.writeFileSync(path.join(tdir, 'agent-' + id + '.jsonl'), [given(QJ.question, QJ.claim)].concat(lines).flat().join('\n')); fs.writeFileSync(path.join(tdir, 'agent-' + id + '.meta.json'), JSON.stringify({ description: label })); };
  const wrote = name => call('Write', { file_path: file(name), content: body(name) });
  const all = extra => names.forEach((name, i) => agentFile('a' + i, name + ':G1', (extra || {})[name] !== undefined ? (extra || {})[name] : [wrote(name)]));
  const partOf = (n, lines) => { all({ [n]: lines }); return P.prove(d.dir, [tdir], q).provenance.parts.find(p => p.part === n); };
  const vb = path.join(d.dir, 'view-blind.md'), vm = path.join(d.dir, 'view.md'), blind = () => call('Read', { file_path: vb }, '# CASE G1 (the judges\' view: no marks are shown)'), j2 = '910-judge2', j1 = '900-judge';
  const MARKED = '  MARKED confirmed · level: one report · rests on: E010-1 · the record dates it · by the neutral fact-checker (part 120-check)', OUTCOME = 'MIZAN OUTCOME G1: by the first judge\'s marks "refuted" · by the second judge\'s "refuted" · published outcome: refuted';
  // H2: a judge is blind by what came back to him, however he asked for it.
  let s = partOf(j2, [blind(), wrote(j2)]);
  t('HOLE 2 a second judge who read the blind view and wrote his part is blind (the control)', s.sealed === true && s.saw.length === 0 && s.read_rules === undefined, JSON.stringify(s));
  s = partOf(j2, [blind(), call('PowerShell', { command: 'Get-Content "' + d.dir + '\\vie*.md" | Select-String "MARKED"' }, MARKED), wrote(j2)]);
  t('HOLE 2 the marked view read through a wildcard name is seen: by the name, and by the mark lines that came back', s.sealed === false && s.saw.includes('a file named with a wildcard') && s.saw.some(x => /^the marked view/.test(x)), JSON.stringify(s));
  s = partOf(j2, [blind(), call('Grep', { pattern: 'MARKED (confirmed|disputed|unsupported)', path: d.dir, output_mode: 'content' }, 'view.md:' + MARKED), wrote(j2)]);
  t('HOLE 2 the search tool pointed at the case folder is not blind', s.sealed === false && s.saw.includes('a search of the case folder') && s.saw.some(x => /^the marked view/.test(x)), JSON.stringify(s));
  s = partOf(j2, [blind(), call('Glob', { pattern: '*', path: path.join(d.dir, 'parts') }, '900-judge.json\n910-judge2.json'), wrote(j2)]);
  t('HOLE 2 nor is the file-name tool pointed at the parts folder; pointed there for his own part alone, or at the blind view, it is', s.sealed === false && s.saw.includes('a search of the case folder') && partOf(j2, [blind(), call('Glob', { pattern: j2 + '.json', path: path.join(d.dir, 'parts') }, j2 + '.json'), call('Grep', { pattern: '^### ', path: vb }, '### E010-1'), wrote(j2)]).sealed === true, JSON.stringify(s));
  s = partOf(j2, [blind(), call('PowerShell', { command: '$m = "x\\lib\\mizan.js"; node $m outcome "' + d.dir + '"' }, OUTCOME), wrote(j2)]);
  t('HOLE 2 the outcome command run through a variable that holds the script is seen by the line it printed', s.sealed === false && s.saw.some(x => /^the outcome with both judges' marks/.test(x)), JSON.stringify(s));
  s = partOf(j1, [blind(), call('PowerShell', { command: 'Get-Content "' + d.dir + '\\parts\\12?-check.json"' }, '{ "role": "check", "premises": [ { "id": "C1", "status": "confirmed" } ] }'), wrote(j1)]);
  t('HOLE 2 the fact-checker\'s part read through a "?" in its name is seen by what came back', s.sealed === false && s.saw.some(x => /^another agent's part/.test(x)), JSON.stringify(s));
  s = partOf(j2, [blind(), call('PowerShell', { command: '$f = Join-Path "' + d.dir.replace(/G1$/, '') + '" ("G" + "1\\vi" + "ew.md"); Get-Content $f' }, '# CASE G1\n- [C1] claim | raised by the claim advocate | NEEDED: x\n  the text of the point\n' + MARKED), wrote(j2)]);
  t('HOLE 2 a name put together inside the command, which no reading of the command can follow, is still seen by what came back', s.sealed === false && s.saw.length === 1 && /^the marked view \(by what came back/.test(s.saw[0]), JSON.stringify(s));
  s = partOf(j1, [blind(), call('Write', { file_path: file(j1), content: 'x' }), call('PowerShell', { command: 'node x\\lib\\mizan.js outcome "' + d.dir + '" | Select-Object -Last 3; node x\\lib\\mizan.js check "' + d.dir + '"' }, OUTCOME + '\nFAIL G1 | current | x', true), wrote(j1)]);
  t('HOLE 2 a command that printed the open outcome and then ended in an error is not passed over: it ran, and what it printed came back', s.sealed === false && s.saw.includes('outcome (not blind)') && s.saw.some(x => /by what came back/.test(x)), JSON.stringify(s));
  s = partOf(j2, [blind(), call('Read', { file_path: vm }, '# CASE G1'), wrote(j2)]);
  const s2 = partOf(j2, [blind(), call('Read', { file_path: d.dir.replace(/\\/g, '/') + '/PARTS/900-JUDGE.json' }, '{ "role": "judge" }'), wrote(j2)]);
  t('HOLE 2 the two plain openings are refused as before: the marked view by its name, another\'s part by a path in other slashes and letters', s.sealed === false && s.saw.includes('view.md') && s2.sealed === false && s2.saw.includes('part:900-judge'), JSON.stringify([s, s2]));
  s = partOf(j1, [blind(), call('Write', { file_path: file(j1), content: 'x' }), call('Read', { file_path: file(j1) }, '{ "role": "judge", "premises": [ { "id": "C1" } ], "verdict": { "outcome": "refuted" } }'), call('PowerShell', { command: 'node x\\lib\\mizan.js outcome "' + d.dir + '" --blind' }, 'MIZAN OUTCOME G1 (the judge\'s own marks only): "refuted"'), wrote(j1)]);
  t('HOLE 2 a judge\'s own part read back, and the blind commands, are his own: he stays blind', s.sealed === true && s.saw.length === 0, JSON.stringify(s));
  // H14: a judge who read the checker's own rules is named (a note beside his proof, not a refusal).
  s = partOf(j1, [blind(), call('Grep', { pattern: 'own_voice_patterns|LEVELS', path: 'C:\\repo\\lib\\mizan.js', output_mode: 'content' }, "37:const LEVELS = ['many independent carriers'];\n753:' · published outcome: ' + o.final"), call('Read', { file_path: 'C:\\repo\\domain\\mizan\\checks.json' }, '{ "own_voice_patterns": [] }'), wrote(j1)]);
  const out14 = spawnSync(process.execPath, [path.join(__dirname, 'prove.js'), d.dir, tdir], { encoding: 'utf8' }).stdout;
  t('HOLE 14 a judge who read the checker\'s own script and rules file before writing is still blind (their source is not a mark) and is named for it; one who only ran them is not', s.sealed === true && s.read_rules === true && /900-judge \|.*opened nothing that shows another's marks.*\| read the checker's own rules before writing/.test(out14) && partOf(j1, [blind(), call('PowerShell', { command: 'node "C:\\repo\\lib\\mizan.js" outcome "' + d.dir + '" --blind' }, 'MIZAN OUTCOME G1 (the judge\'s own marks only): "refuted"'), wrote(j1)]).read_rules === undefined, JSON.stringify(s) + out14.slice(0, 300));
  // H3: the translator.
  const tn = '115-translate', tf = file(tn), vt = path.join(d.dir, 'view-translate.md'), gv = path.join(d.dir, 'view-translate-given.md');
  const tr = list => JSON.stringify({ role: 'translate', translations: list });
  const translator = (final, lines) => { fs.writeFileSync(tf, final); all(); agentFile('tx', tn + ':G1', lines); return P.prove(d.dir, [tdir], q).provenance.parts.find(p => p.part === tn); };
  const own = { evidence_id: 'E010-4', own_translation: 'a great fire came out of the land' }, done = tr([Object.assign({ agree: true, note: '' }, own)]);
  s = translator(tr([]), [blind(), call('Read', { file_path: vt }, '# TO TRANSLATE'), call('Write', { file_path: tf, content: tr([]) }), call('Read', { file_path: gv }, '# THE ENGLISH THAT WAS GIVEN for the passages you have just translated.'), call('Write', { file_path: tf, content: tr([]) })]);
  t('HOLE 3 a translator who opened the judges\' view before his first write is not shown to have translated first', s.sealed === false && s.saw.includes('view-blind.md'), JSON.stringify(s));
  s = translator(done, [call('Read', { file_path: vt }, '# TO TRANSLATE'), call('Write', { file_path: tf, content: tr([]) }), call('Read', { file_path: gv }, '# THE ENGLISH THAT WAS GIVEN for the passages'), call('Write', { file_path: tf, content: done })]);
  t('HOLE 3 a first write that holds no translation proves no order: every passage he goes on to judge must be translated in it', s.sealed === false && /no translation of his own in his first write for E010-4/.test(s.saw.join()) && s.translated.judged === 1 && s.translated.first === 0, JSON.stringify(s));
  s = translator(done, [call('Read', { file_path: vt }, '# TO TRANSLATE'), call('Write', { file_path: tf, content: tr([own]) }), call('Read', { file_path: gv }, '# THE ENGLISH THAT WAS GIVEN for the passages'), call('Write', { file_path: tf, content: done })]);
  t('HOLE 3 a translator whose first write holds his own English for every passage he judges, and who then opened the given English, is shown to have translated first', s.sealed === true && s.translated.judged === 1 && s.translated.first === 1, JSON.stringify(s));
  s = translator(done, [call('Read', { file_path: vt }, '# TO TRANSLATE'), call('PowerShell', { command: 'Get-Content (Get-ChildItem "' + d.dir + '" -Filter "*given*").FullName' }, '# THE ENGLISH THAT WAS GIVEN for the passages you have just translated.\n## E010-4\na great fire'), call('Write', { file_path: tf, content: tr([own]) }), call('Write', { file_path: tf, content: done })]);
  t('HOLE 3 the given English reached without writing its name is seen by what came back', s.sealed === false && s.saw.some(x => /^the given English \(by what came back/.test(x)), JSON.stringify(s));
  s = translator(tr([]), [call('Read', { file_path: vt }, '# TO TRANSLATE'), call('Write', { file_path: tf, content: tr([]) })]);
  const out3 = spawnSync(process.execPath, [path.join(__dirname, 'prove.js'), d.dir, tdir], { encoding: 'utf8' }).stdout;
  t('HOLE 3 a translator who was given nothing to translate is said to have had nothing to translate, not to have translated first', s.sealed === true && s.translated.judged === 0 && /115-translate \|.*had nothing to translate/.test(out3), JSON.stringify(s));
  fs.unlinkSync(tf); for (const x of ['agent-tx.jsonl', 'agent-tx.meta.json']) fs.unlinkSync(path.join(tdir, x));
  // H5: the output of a command moved to the background counts only as the harness hands it over.
  const AR = 'نار الحجاز بصرى', LINES = 'turath.io (the Shamela library): 6 hit(s) for "' + AR + '"\nMIZAN FIND: "' + AR + '" · 6 hit(s) · 1 search service(s) answering';
  const bgRun = () => call('PowerShell', { command: 'node "x\\domain\\mizan\\find.js" "' + AR + '"' }, 'Command did not complete within its 120s timeout and was moved to the background (ID: bg7777). Output is being written to: C:\\run\\tasks\\bg7777.output');
  const listing = pv => pv.unproven.find(u => u.part === '010-claim' && u.query === AR);
  all({ '010-claim': [wrote('010-claim'), bgRun(), call('PowerShell', { command: '# bg7777 finished\nWrite-Output \'' + LINES.split('\n').join('\'\nWrite-Output \'') + '\'' }, LINES)] });
  let pv = P.prove(d.dir, [tdir], q).provenance;
  t('HOLE 5 lines an agent printed himself, in the shape of the find tool\'s own and naming the background id, do not stand for the result of the command', !!listing(pv) && listing(pv).why === 'made, got no answer' && /moved to the background/.test(listing(pv).seen), JSON.stringify(listing(pv) || pv.unproven.slice(0, 2)));
  all({ '010-claim': [wrote('010-claim'), bgRun(), call('PowerShell', { command: 'Get-Content "C:\\run\\tasks\\bg7777.output"; Write-Output \'' + LINES.split('\n')[0] + '\'' }, LINES)] });
  t('HOLE 5 nor does any other command of his own that names the output file: what a shell command prints is the agent\'s text', !!listing(P.prove(d.dir, [tdir], q).provenance));
  all({ '010-claim': [wrote('010-claim'), bgRun(), call('Read', { file_path: 'C:\\run\\tasks\\bg7777.output' }, '     1\t' + LINES.split('\n').join('\n     2\t'))] });
  t('HOLE 5 the task\'s own output file, read with the Read tool, does', !listing(P.prove(d.dir, [tdir], q).provenance), JSON.stringify(listing(P.prove(d.dir, [tdir], q).provenance)));
  // H1 and H8: what the records show beside the folder.
  all(); pv = P.prove(d.dir, [tdir], q).provenance;
  const checkNow = () => spawnSync(process.execPath, [LIB, 'check', d.dir, '--recorded', '--transcripts', tdir], { encoding: 'utf8' });
  let r = checkNow();
  t('HOLE 8 the question and the claim in question.json are compared with what every agent was given; unchanged, nothing is said, and the headline names the question file beside the case file', pv.question_given === names.length && pv.question_differs.length === 0 && !/is not what the agents were given/.test(r.stdout) && /^MIZAN: G1\/case\.json · file [0-9a-f]{10} · question [0-9a-f]{10} · checked /.test(r.stdout), JSON.stringify([pv.question_given, pv.question_differs]) + r.stdout.slice(0, 200));
  t('HOLE 1 where the records and the folder hold the same parts, the RECORD line says nothing more', pv.parts_written === names.length && !/parts written in the records/.test(r.stdout));
  fs.writeFileSync(path.join(d.dir, 'question.json'), JSON.stringify(Object.assign({}, QJ, { claim: QJ.claim + ', as every scholar agrees' })));
  pv = P.prove(d.dir, [tdir], q).provenance; r = checkNow();
  t('HOLE 8 a claim rewritten in question.json after the run is caught: it is not the claim the agents were given', pv.question_differs.length === names.length && r.status === 1 && /FAIL G1 \| writers-proven \| the question or the claim in question\.json is not what the agents were given/.test(r.stdout), JSON.stringify(pv.question_differs.slice(0, 2)) + r.stdout.slice(0, 300));
  fs.writeFileSync(path.join(d.dir, 'question.json'), JSON.stringify(QJ));
  const swapText = body('920-swap'); fs.unlinkSync(file('920-swap'));
  pv = P.prove(d.dir, [tdir], q).provenance; r = checkNow();
  t('HOLE 1 a part its agent wrote, taken out of the folder afterwards, is missed: the check fails and names it, and the RECORD line counts the parts written against the parts that are there', pv.written_missing.join() === '920-swap' && pv.parts_written === names.length && r.status === 1 && /FAIL G1 \| writers-proven \| a part an agent wrote is no longer in the case: 920-swap/.test(r.stdout) && new RegExp('parts written in the records ' + names.length + ', in the case ' + (names.length - 1)).test(r.stdout), JSON.stringify(pv.written_missing) + r.stdout.slice(0, 900));
  fs.writeFileSync(file('920-swap'), swapText);
}
// H6: a turn after the last neutral search, and a repair that adds one.
{ const late = { role: 'reply', side: 'claim', nothing_new: true, turns: [{ own_reasoning: true, text: 'Conceding nothing further, the claim side notes that the clause stands on the record as it was given.' }] };
  const a = C.assemble(makeDir(null, ps => { ps['170-reply'] = late; }).dir), o = M.outcome(a.q);
  t('HOLE 6 a turn added after the last neutral search ends the exchange at "round-limit": nobody looked behind it, and the outcome is withheld on that ground', a.q.exchange.length === 3 && a.q.exchange_end.stopped_by === 'round-limit' && a.q.exchange_end.last_word === 'claim' && o.final === 'not-determined' && o.caps.some(c => /stopped before a neutral search confirmed/.test(c)), JSON.stringify([a.q.exchange_end.stopped_by, o.caps]));
  const b = C.assemble(makeDir(null, ps => { ps['170-reply'] = late; ps['180-stop'] = { role: 'stop', nothing_new_confirmed: true, leads: [], looked_for_more: [rec('turath.io', 'رد على ما قيل اخيرا', 'nothing later'), rec('Google Scholar', 'reply to the last turn', 'nothing later')] }; }).dir);
  t('HOLE 6 once a newer neutral search has looked and found nothing, the exchange is confirmed as ended again', b.q.exchange.length === 3 && b.q.exchange_end.stopped_by === 'nothing-new-confirmed');
  const c = C.assemble(makeDir(null, ps => { ps['170-reply'] = Object.assign({ repair: true }, late); }).dir);
  t('HOLE 6 a repair may not add a turn: the turn is left out and reported, and the exchange stands as the neutral search left it', c.q.exchange.length === 2 && c.q.exchange_end.stopped_by === 'nothing-new-confirmed' && c.q.exchange_end.last_word === 'objection' && c.problems.some(p => p.part === '170-reply' && /a repair may carry a turn only as a correction/.test(p.text)), JSON.stringify(c.problems));
  const e = C.assemble(makeDir(null, ps => { ps['170-counter'] = { role: 'counter', side: 'objection', repair: true, nothing_new: true, turns: [{ replaces_turn: 2, when: '2011' }] }; }).dir), f = C.assemble(makeDir(null, ps => { ps['170-counter'] = { role: 'counter', side: 'objection', repair: true, nothing_new: true, turns: [{ replaces_turn: 2, text: 'He now says something else entirely about the far sighting and the date both.' }] }; }).dir);
  t('HOLE 6 a repair that corrects the date of a turn leaves the exchange confirmed; one that gives an unanswered turn new words does not', e.q.exchange[1].when === '2011' && e.q.exchange_end.stopped_by === 'nothing-new-confirmed' && /something else entirely/.test(f.q.exchange[1].text) && f.q.exchange_end.stopped_by === 'round-limit', JSON.stringify([e.q.exchange_end, f.q.exchange_end]));
}
// H7: the fairness reader asked again until one agrees.
{ const refuse = { role: 'swap', swap: { confirmed: false, note: 'the standard was applied more strictly to the objection' } }, confirm = { role: 'swap', swap: { confirmed: true, note: 'the same standard of a dated written record is applied to both' } };
  const a = makeDir(null, ps => { ps['920-swap'] = refuse; ps['925-swap'] = confirm; }).q;
  t('HOLE 7 a ruling one fairness reader refused is not cleared by a second reader who confirms it: the swap test fails and names both', /925-swap/.test(a.swap_test.confirmed_by || '') && failing(a).includes('swap-test') && /refused the ruling that stands \(part 920-swap: the standard was applied more strictly.*another then confirmed it \(part 925-swap\)/.test(why(a, 'swap-test')), why(a, 'swap-test'));
  const b = makeDir(null, ps => { ps['920-swap'] = refuse; ps['970-judge'] = JSON.parse(JSON.stringify(ps['900-judge'])); ps['990-swap'] = confirm; }).q;
  t('HOLE 7 only a new ruling clears a refusal: after one, the new ruling\'s own reader decides', !failing(b).includes('swap-test') && b.verdict.history.length === 2 && b.verdict.history[0].fairness[0].confirmed === false, why(b, 'swap-test'));
  const c = makeDir(null, ps => { ps['920-swap'] = confirm; ps['925-swap'] = refuse; }).q;
  t('HOLE 7 a refusal after a confirmation fails it too', failing(c).includes('swap-test'));
}
// H9: the list of dropped quotes, and the list of what was asked, in the case file.
{ const d = makeDir(), f = path.join(d.dir, 'case.json'), doc = () => JSON.parse(fs.readFileSync(f, 'utf8')), put = x => fs.writeFileSync(f, JSON.stringify(x, null, 1)), orig = doc();
  let x = doc(); x.questions[0].dropped = [{ side: 'objection', id: 'E020-9', who: 'Nobody', work: 'An invented book', part: '020-objection', why: 'never found' }]; put(x);
  let r = run(['check', d.dir, '--recorded']);
  t('HOLE 9 an entry written by hand into the list of dropped quotes is caught: it is not a quote the parts give', r.status === 1 && /record-intact \|.*dropped \(E020-9: listed as dropped, and not a quote the parts give/.test(r.stdout), r.stdout.slice(-400));
  x = doc(); x.questions[0].dropped = [{ side: 'objection', id: 'E020-1', who: 'Dr Critic', work: 'x', part: '020-objection', why: 'never found' }]; put(x);
  t('HOLE 9 a quote that is still in the file cannot also be listed as dropped', /record-intact \|.*dropped \(E020-1/.test(run(['check', d.dir, '--recorded']).stdout));
  x = JSON.parse(JSON.stringify(orig)); x.questions[0].dropped_turns = [{ side: 'objection', who: 'Dr Critic', part: '140-counter' }]; put(x);
  t('HOLE 9 nor can a turn be listed as dropped that the parts do not lose', /record-intact \|.*dropped_turns/.test(run(['check', d.dir, '--recorded']).stdout));
  x = JSON.parse(JSON.stringify(orig)); x.asked = ['G1', 'G9']; put(x); r = run(['check', d.dir, '--recorded']);
  t('HOLE 9 a name written by hand into the file\'s list of what was asked is caught as a change to the record, not only as a question that is missing', /record-intact \| the case file's list of what was asked is not what the case folders give; it differs in: G9/.test(r.stdout), r.stdout.slice(-300));
  x = JSON.parse(JSON.stringify(orig)); x.asked = []; put(x);
  t('HOLE 9 and so is the folder\'s own question taken out of that list', /record-intact \| the case file's list of what was asked.*differs in: G1/.test(run(['check', d.dir, '--recorded']).stdout));
  put(orig); t('HOLE 9 the untouched file passes', run(['check', d.dir, '--recorded']).status === 0);
}
// H11: the second judge's marks are tied to the quotes he was shown.
{ const q = good();
  t('HOLE 11 the second judge\'s part carries the hash of the evidence he ruled on, and the case keeps it', q.verdict.second_opinion.evidence_hash === M.evidenceHash(q) && !failing(q).includes('verdict-fresh'));
  red('verdict-fresh', 'the second judge ruled on other evidence than the case holds now', x => { x.verdict.second_opinion.evidence_hash = '0000000000000000'; });
  red('verdict-fresh', 'under the present rules a second judge\'s part with no evidence hash is refused', x => { x.rules = M.GROUND_RULES; delete x.verdict.second_opinion.evidence_hash; });
  const old = good(); delete old.verdict.second_opinion.evidence_hash;
  const fs2 = M.CHECKS.find(c => c[0] === 'verdict-fresh')[2](old);
  t('HOLE 11 a case opened before the second judge was asked for it is not refused for lacking it: it is said, as a warning', old.rules === 0 && !failing(old).includes('verdict-fresh') && fs2.length === 1 && fs2[0].level === 'WARN' && /carries no evidence_hash/.test(fs2[0].text), JSON.stringify(fs2));
}
// H12: the planted pair does not give itself away.
{ const AR1 = 'خرجت نار عظيمة من ارض الحجاز في تلك السنة', AR2 = 'وكتب اهل المدينة بذلك الى دمشق بعد ايام';
  const pairs = [Object.assign(speaker('scholar', 'Ibn Pair', 41), { quote_ar: AR1, check_url_ar: 'https://shamela.ws/book/1/41', quote_en: 'a great fire came out of the land of the Hijaz in that year', translated_by_map: true }), Object.assign(speaker('scholar', 'Ibn Pair', 42), { quote_ar: AR2, check_url_ar: 'https://shamela.ws/book/1/42', quote_en: 'and the people of Medina wrote of it to Damascus some days later', translated_by_map: true })];
  const d = makeDir({ claimEvidence: pairs, rules: C.GROUND_RULES }), q0 = C.assemble(d.dir).q, listed = ['E010-4', 'E010-5'];
  let inList = 0, highest = 0, unreal = 0, made = 0; const ids = new Set();
  for (let k = 0; k < 200; k++) { const qq = JSON.parse(JSON.stringify(q0)); qq.parts = qq.parts.map(p => Object.assign({}, p, { sha1: p.sha1 + k })); const pl = C.planted(qq); if (!pl) continue; made++; ids.add(pl.id); if (listed.includes(pl.english_of)) inList++; if (!qq.evidence.some(e => e.id === pl.id) || listed.includes(pl.id) || pl.id === pl.english_of) unreal++; if (Number(pl.id.split('-')[1]) > 5) highest++; }
  t('HOLE 12 over 200 salts the planted pair\'s English is never that of a passage in the translator\'s own list while other quotes exist, and its id is that of a quote outside his list, never one past the last of its part', made === 200 && inList === 0 && unreal === 0 && highest === 0 && ids.size >= 2, JSON.stringify({ made, inList, unreal, highest, ids: [...ids] }));
  const plant = C.planted(q0), own = id => ({ evidence_id: id, own_translation: 'my own rendering of the passage', agree: true, note: '' });
  // (the translator's part is numbered after every part that was there when his list was made, as the loop numbers it)
  fs.writeFileSync(path.join(d.dir, 'parts', '930-translate.json'), JSON.stringify({ role: 'translate', translations: listed.map(own).concat([{ evidence_id: plant.id, own_translation: 'my own rendering of the passage', agree: false, note: 'the English given is of another passage' }]) }));
  const a = C.assemble(d.dir).q, real = a.evidence.find(e => e.id === plant.id);
  t('HOLE 12 an answer under the planted id is the answer to the test and nothing else: the test is passed, the real pairs are taken, and the real quote that carries that id is not touched', a.translator_tests.length === 1 && a.translator_tests[0].caught === true && listed.every(id => (a.evidence.find(e => e.id === id).translation_check || {}).agree === true) && !!real && real.translation_check === undefined, JSON.stringify([plant, a.translator_tests]));
  const list = C.translateView(q0, plant), old = C.planted(Object.assign(JSON.parse(JSON.stringify(q0)), { rules: C.PLANT_RULES }));
  t('HOLE 12 a case opened under the earlier form of the test keeps the pair it was given then (an id one past the last of its part), so that a translator already tested is not judged by another pair', /^E010-6$/.test(old.id) && C.PLANT_RULES < C.GROUND_RULES && !/plant/i.test(list));
  // H3 (the view): the judges' view does not print the English of a pair still to be translated.
  q0.evidence.forEach(seal); a.evidence.forEach(seal);
  const en = 'a great fire came out of the land of the Hijaz in that year', vb0 = C.view(q0, [], true), vm0 = C.view(q0, [], false), vb1 = C.view(a, [], true);
  t('HOLE 3 the judges\' view, which a translator could open, does not print the English of a pair that is still to be translated; the full view does, and so does the judges\' view once a translator has checked the pair', !vb0.includes(en) && /ENGLISH: \(not shown in this view until a translator has checked it/.test(vb0) && vb0.includes(AR1) && vm0.includes(en) && vb1.includes(en), vb0.slice(vb0.indexOf('### E010-4'), vb0.indexOf('### E010-4') + 400));
}
// H13: a library that did not answer is not a fault of the record, and not a pass.
{ const q = good(); S(q).check.catalogue_unanswered = true;
  const fa = M.CHECKS.find(c => c[0] === 'attributed')[2](q), fe = M.CHECKS.find(c => c[0] === 'exchange-followed')[2](q);
  t('HOLE 13 where the library\'s catalogue did not answer, the checks that rest on it say they were not run, as a finding of its own kind and not as a failure', !failing(q).length && fa.length === 1 && fa[0].level === 'UNRUN' && /^the library did not answer; this was not checked in this run: whether the catalogue names/.test(fa[0].text) && fe.length === 1 && fe[0].level === 'UNRUN' && /the date of turn 1/.test(fe[0].text), JSON.stringify([fa, fe]));
  const h = good(); Object.assign(H(h), { who: 'Sahih al-Bukhari 7118', check_url_en: 'https://shamela.ws/book/1681/9999' }); seal(H(h)); H(h).check.catalogue_unanswered = true;
  const fh = M.CHECKS.find(c => c[0] === 'hadith-graded')[2](h); delete H(h).check.catalogue_unanswered; const fh2 = M.CHECKS.find(c => c[0] === 'hadith-graded')[2](h);
  t('HOLE 13 a hadith of the two Sahihs read on a library page whose catalogue did not answer is "not checked in this run"; when the catalogue answers and does not list the Sahih, it is a failure as before', fh.length === 1 && fh[0].level === 'UNRUN' && /is the Sahih itself/.test(fh[0].text) && fh2.length === 1 && fh2[0].level === 'FAIL' && /outside the two Sahihs/.test(fh2[0].text), JSON.stringify([fh, fh2]));
  const d = makeDir(), f = path.join(d.dir, 'case.json'), doc = JSON.parse(fs.readFileSync(f, 'utf8'));
  doc.questions[0].evidence.find(e => e.id === 'E010-1').check.catalogue_unanswered = true; fs.writeFileSync(f, JSON.stringify(doc, null, 1));
  const r = run(['check', d.dir, '--recorded']), r2 = run(['render', d.dir, '--recorded']);
  t('HOLE 13 the command then does not pass and does not call it a failure: the headline and the question\'s line say that 2 checks could not be run and to run again, the outcome is withheld, and the checks are not counted among the failed', r.status === 1 && /\nNOT YET A RESULT · 2 check\(s\) could not be run because a library did not answer: run again · 0 warning/.test(r.stdout) && new RegExp('G1 · ' + (M.TOTAL - 2) + ' of ' + M.TOTAL + ' checks pass · 2 check\\(s\\) could not be run because a library did not answer: run again · outcome withheld until they are run').test(r.stdout) && /\nNOT RUN G1 \| attributed \| the library did not answer; this was not checked in this run:/.test(r.stdout) && !/QUESTION\(S\) FAIL/.test(r.stdout) && !/\nFAIL /.test(r.stdout) && !/ALL CHECKS PASS/.test(r.stdout), r.stdout.slice(0, 500));
  t('HOLE 13 the report says the same and prints no conclusion as where the question stands', r2.status === 1 && /\*\*Not yet a result \(2026-10-10\): 2 check\(s\) could not be run because a library did not answer: run again\.\*\*/.test(r2.stdout) && /NOT YET A RESULT · 2 check\(s\) could not be run/.test(r2.stdout) && !/ALL CHECKS PASS/.test(r2.stdout), r2.stdout.slice(0, 300));
}

// ---------- the command line ----------
t('a consensus claim passes once it is cited to a quote that says so, and dissent was searched for', (() => { const q = good(); S(q).quote_en = 'the scholars are agreed, by consensus, on the date of the collection'; seal(S(q)); rejudge(q); q.verdict.short = 'Ibn Example reports a consensus on the date of the collection.'; q.consensus_claims = [{ evidence_ref: ['E010-1'], dissent_search: [rec('turath.io', 'خلاف في تاريخ الكتاب', 'none')], dissent: 'none found' }]; return !failing(q).includes('consensus-cited'); })());
t('a wrapped address is never the work itself; the wrapped host is seen', M.primary('https://shamela.ws/book/1/2') && !M.primary('https://web.archive.org/web/2020/https://shamela.ws/book/1/2') && !M.primary('https://cdn.jsdelivr.net/gh/x/y@1/z.json') && !M.primary('https://shamela.ws/search?q=x') && M.hostsIn('https://web.archive.org/web/2020/https://en.wikipedia.org/wiki/X').includes('en.wikipedia.org'));
{ const d = makeDir(); const r = run(['check', d.dir, '--recorded']);
  t('CLI an honest case folder exits 0 and prints the four lines of counts', r.status === 0 && /ALL CHECKS PASS/.test(r.stdout) && /G1 · \d+ of \d+ checks pass · outcome by the marks: refuted/.test(r.stdout) && /quotes found word for word 5 of 5 \(claim side 3, objection side 2\)/.test(r.stdout) && /claim: confirmed 1, false 0, disputed 0, unsupported 1 \(needed 1, set aside 1\)/.test(r.stdout) && /links from a mark to a quote read by another reader 3 of 3/.test(r.stdout) && /ended: nothing-new-confirmed · last word: objection/.test(r.stdout) && /byte for byte what one agent wrote 13 of 13/.test(r.stdout), (r.stdout + r.stderr).slice(0, 1500));
  t('CLI the lines say what they do not measure, and that this test run read neither the sources nor the agents\' records', /They do not say the conclusion is true/.test(r.stdout) && /RECORDED ONLY/.test(r.stdout) && /THE AGENTS' RECORDS WERE NOT READ/.test(r.stdout));
  const r1 = run(['check', d.dir, '--recorded'], { MIZAN_TEST: '' });
  t('CLI outside a test, a check that reads neither the sources nor the agents\' records is never a pass, and says which', r1.status === 1 && /writers-proven \| the agents' own records were not read/.test(r1.stdout));
  const r2 = run(['render', d.dir, '--recorded']);
  t('CLI render prints the report from the case: the outcome the marks give, both judges\' marks, the exchange with each quote, every address', r2.status === 0 && /Where it stands \(2026-10-10\): The objection fails: a point it needs is false\./.test(r2.stdout) && /\| First judge \| Second judge \| Fact-checker \|/.test(r2.stdout) && /> E010-1: "these are the very words/.test(r2.stdout) && /shamela\.ws\/book\/1\/1/.test(r2.stdout) && /ALL CHECKS PASS/.test(r2.stdout), r2.stdout.slice(0, 900));
  const r3 = run(['check', d.dir, '--recorded', '--only', 'G']);
  t('CLI a check of part of a file is marked SUBSET and never exits 0', r3.status === 1 && /SUBSET/.test(r3.stdout));
  const r4 = run(['check', d.dir, '--recorded', '--today', '2027-01-01']);
  t('CLI the same case is refused later as no longer current', r4.status === 1 && /FAIL G1 \| current/.test(r4.stdout));
  t('CLI while a check fails the question\'s line gives no outcome: it says the outcome is withheld, and what the marks give so far', /G1 · \d+ of \d+ checks pass · outcome withheld while 1 check\(s\) fail \(by the marks so far: refuted\)/.test(r4.stdout) && !/outcome by the marks/.test(r4.stdout), r4.stdout.slice(0, 500));
  const r8 = run(['render', d.dir, '--recorded', '--today', '2027-01-01']);
  t('CLI while a check fails the report is headed "Not yet a result", and the judge\'s short conclusion is not printed as where the question stands', r8.status === 1 && /\*\*Not yet a result \(2026-10-10\): 1 check\(s\) fail\.\*\* By the marks so far: The objection fails: a point it needs is false\./.test(r8.stdout) && !/Where it stands/.test(r8.stdout) && !r8.stdout.includes('The order of dates the objection needs is wrong.') && /\| First judge \| Second judge \|/.test(r8.stdout) && /this report is not ready/.test(r8.stdout), r8.stdout.slice(0, 500));
  const r5 = run(['check', d.dir, '--recorded', '--today', '2027-01-01'], { MIZAN_TEST: '', MIZAN_TODAY: '' });
  t('CLI outside a test the date cannot be set by hand', !/2027-01-01/.test(r5.stdout));
  const r7 = run(['outcome', d.dir]);
  t('CLI "outcome" prints what the marks give and what it turns on, without reading any source', r7.status === 0 && /published outcome: refuted/.test(r7.stdout) && /turns on: \[O1\]/.test(r7.stdout), r7.stdout);
  const file = path.join(d.dir, 'case.json'), doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  doc.questions[0].verdict.short = 'A sentence typed into the case file by hand.'; fs.writeFileSync(file, JSON.stringify(doc));
  const r6 = run(['check', d.dir, '--recorded']);
  t('CLI a case file edited by hand is refused: it is not what its parts give', r6.status === 1 && /record-intact \| the case file is not what its parts give; it differs in: verdict/.test(r6.stdout), r6.stdout.slice(0, 600));
}
{ const d = makeDir(); const file = path.join(d.dir, 'case.json'), doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  doc.questions[0].evidence = doc.questions[0].evidence.filter(e => e.id !== 'E020-1'); fs.writeFileSync(file, JSON.stringify(doc));
  t('CLI a quote taken out of the case file without being listed as dropped is caught', /record-intact \|.*dropped/.test(run(['check', d.dir, '--recorded']).stdout));
}
{ const d = makeDir({ roadblock: true }), o = M.outcome(d.q); const r = run(['render', d.dir, '--recorded']);
  t('CLI a roadblock is printed in full: the statement, the found words for the reporter\'s standing, every search with its result, the second search, the script\'s own search', r.status === 0 && o.final === 'refuted' && /ROADBLOCK \(claim side\): al-Example may have answered this/.test(r.stdout) && /Its standing, in the words of https:\/\/islamqa\.info\/en\/about: "this site is supervised/.test(r.stdout) && /turath\.io \("four exact sought words here": 0 hits\)/.test(r.stdout) && /Searched again by a second searcher: ketabonline\.com/.test(r.stdout) && /OpenAlex 0 hit\(s\)/.test(r.stdout), r.stdout.slice(0, 400));
}
{ const d = makeDir(null, ps => { ps['910-judge2'].second_opinion.premises[1].status = 'unsupported'; }); const r = run(['render', d.dir, '--recorded']);
  t('CLI where the two judges differ, the report says "Not determined", says on what, and shows what each judge\'s marks would give', /Where it stands \(2026-10-10\): Not determined\./.test(r.stdout) && /mark differently: O1 \(false \/ unsupported\)/.test(r.stdout) && /On the first judge's own marks the outcome would be: The objection fails/.test(r.stdout) && /On the second judge's: The objection is answered/.test(r.stdout), r.stdout.slice(0, 700));
}
{ const d = makeDir(); const f = path.join(d.dir, 'parts', '120-check.json'), p = JSON.parse(fs.readFileSync(f, 'utf8')); p.premises[2].status = 'confirmed'; fs.writeFileSync(f, JSON.stringify(p));
  t('CLI a part edited after the case was built is refused', /record-intact/.test(run(['check', d.dir, '--recorded']).stdout));
}
{ const d = makeDir(); const out = path.join(TMP, 'joined.json'); spawnSync(process.execPath, [path.join(__dirname, 'case.js'), 'join', out, d.dir], { encoding: 'utf8' });
  const r = run(['check', out, '--recorded']);
  t('CLI several questions joined into one file are checked against the folders they were built from', r.status === 0 && /ALL CHECKS PASS/.test(r.stdout), r.stdout.slice(0, 500));
  fs.writeFileSync(path.join(d.dir, '..', 'asked.json'), JSON.stringify({ asked: ['G1', 'G2', 'G3'] }));
  const r2 = run(['check', out, '--recorded']);
  t('CLI a question that was asked and never reached the file is counted: what was asked is read from the list made when the folders were made', r2.status === 1 && /asked-covered \| asked and not in the file: G2, G3/.test(r2.stdout) && /asked 3, covered 1/.test(r2.stdout), r2.stdout.slice(0, 400));
  const doc = JSON.parse(fs.readFileSync(out, 'utf8')); delete doc.built_from; fs.writeFileSync(out, JSON.stringify(doc));
  t('CLI a case file with no parts behind it is refused', /record-intact \| the parts this case was built from are not at hand/.test(run(['check', out, '--recorded']).stdout));
}
t('CLI checks lists every check', (() => { const r = run(['checks']); return r.status === 0 && M.CHECKS.every(c => r.stdout.includes(c[0] + ' — ')) && /record-intact/.test(r.stdout) && /writers-proven/.test(r.stdout); })());
t('every check has at least one RED test above', (() => { const src = fs.readFileSync(__filename, 'utf8'); const missing = M.CHECKS.map(c => c[0]).filter(id => !src.includes("red('" + id + "'")); if (missing.length) console.log('   no RED test for: ' + missing.join(', ')); return missing.length === 0; })());

fs.rmSync(TMP, { recursive: true, force: true });
console.log(bad ? 'mizan eval: ' + bad + ' of ' + n + ' FAILED' : 'mizan eval: ' + n + '/' + n + ' passed');
process.exit(bad ? 1 : 0);
