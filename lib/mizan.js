#!/usr/bin/env node
// mizan — born via forge
// symptom: 2026-10-10 DawahMap miya: "By being FAIR I did not mean to be APOLOGETIC ... Create and build and save a process for you to be OBJECTIVE and FAIR" after versions 0.1 and 0.2 let objections through unchecked, cut the exchange after the objection and left the scholars of Islam out
// goal: on a disputed question both sides are weighed with the same weights: each in its own specialists exact words, the exchange followed to its last published answer, every premise checked alike, and a reasoned verdict that says who answered whom
// goal_signal: the reply or page that settles a disputed question carries a MIZAN line with the check result
// retention: keep
// footprint: on-demand: 1 node process per check, about a minute because it reads every source again; nothing at boot, per prompt or per session
//
// Mizan = the scale. A disputed question is written as a CASE. This script checks the RECORD of a case: that both sides
// were weighed by one rule, and that every statement is accounted for (found word for word at its source, or declared
// as a roadblock whose search is proven). It trusts nothing the case file says about itself:
//   - it reads every source again, now, and compares
//   - it builds the case again from the parts the agents wrote, and compares
//   - it reads the agents' own records again (--transcripts) to see who wrote each part and which searches were run
//   - it works the outcome out itself from the marks on the points; no agent chooses it
// It cannot check that a conclusion is true; the last line it prints says so.
//
// Commands:
//   checks                                          every check and what it means
//   check <case folder | case.json> --transcripts <dir> ... [--only <id>] [--json]      exit 1 when any check fails
//   render <case folder | case.json> --transcripts <dir> ...     the report for the reader, printed from the case and nothing else
//   outcome <case folder>                           the outcome the marks give, and what stands in its way (no source is read)
//   lesson --text "<what went wrong>" --evidence "<the case>"    store a lesson (domain/mizan/lessons.jsonl)
//   lessons                                         print the stored lessons
// Data lives in domain/mizan/ (MIZAN_DIR overrides it for the eval). --recorded and --today are honoured only when MIZAN_TEST=1.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOME = path.join(__dirname, '..', 'domain', 'mizan');
const DIR = process.env.MIZAN_DIR || HOME;
const RULES = JSON.parse(fs.readFileSync(path.join(HOME, 'checks.json'), 'utf8'));
const SIDES = ['claim', 'objection'];
const OUTCOMES = ['refuted', 'answered', 'objection-stands', 'claim-unsupported', 'neither-holds', 'open', 'not-determined'];
const STATUSES = ['confirmed', 'false', 'unsupported', 'disputed'];
const LEVELS = ['many independent carriers', 'several independent reports', 'a contemporary document', 'one report', 'inference', 'bare possibility', 'not applicable'];
const SPEAKERS = ['scholar', 'advocate'];
const letters = String.fromCharCode(0x621) + '-' + String.fromCharCode(0x64A);
const ARABIC_WORDS = new RegExp('[' + letters + ']{2,}\\s+[' + letters + ']{2,}');
const TEST = process.env.MIZAN_TEST === '1';
// Negations, for the one mechanical test a translation gets: the unmistakable Arabic ones, any Arabic one, and the English ones.
const AR = cps => String.fromCharCode(...cps);
const NEG_AR_STRONG = new RegExp('\\s(' + [AR([0x644, 0x645]), AR([0x644, 0x646]), AR([0x644, 0x64A, 0x633]), AR([0x644, 0x64A, 0x633, 0x62A]), AR([0x648, 0x644, 0x645]), AR([0x641, 0x644, 0x645]), AR([0x648, 0x644, 0x646]), AR([0x648, 0x644, 0x64A, 0x633])].join('|') + ')\\s');
const NEG_AR_ANY = new RegExp('\\s(' + [AR([0x644, 0x627]), AR([0x648, 0x644, 0x627]), AR([0x641, 0x644, 0x627]), AR([0x645, 0x627]), AR([0x648, 0x645, 0x627]), AR([0x644, 0x645]), AR([0x644, 0x646]), AR([0x644, 0x64A, 0x633]), AR([0x63A, 0x64A, 0x631]), AR([0x628, 0x644, 0x627]), AR([0x62F, 0x648, 0x646])].join('|') + ')\\s');
const BARE_MARKS = new RegExp('[' + [[0x610, 0x61A], [0x64B, 0x652], [0x670, 0x670], [0x640, 0x640]].map(([a, b]) => String.fromCharCode(a) + '-' + String.fromCharCode(b)).join('') + ']', 'g');
const bare = s => ' ' + String(s || '').normalize('NFKC').replace(BARE_MARKS, '').replace(/[^\p{L}\s]+/gu, ' ') + ' ';
const SAHIH_BOOK = new RegExp('^\\s*(' + AR([0x635, 0x62D, 0x64A, 0x62D]) + ')\\s+(' + AR([0x627, 0x644, 0x628, 0x62E, 0x627, 0x631, 0x64A]) + '|' + AR([0x645, 0x633, 0x644, 0x645]) + ')');   // "Sahih al-Bukhari" or "Sahih Muslim", as a library catalogue names the book
const NEG_EN = /\b(not|no|never|none|nobody|nothing|neither|nor|without|cannot|n't|n’t)\b|n't\b/i;

function fail(msg) { process.stderr.write('mizan: ' + msg + '\n'); process.exit(2); }
const words = t => String(t || '').trim().split(/\s+/).filter(Boolean).length;
const distinct = t => { const w = String(t || '').toLowerCase().split(/\s+/).filter(Boolean); return w.length ? new Set(w).size / w.length : 0; };
const arr = v => (Array.isArray(v) ? v : []);
const say = (s, n) => '"' + String(s || '').slice(0, n || 50) + '"';
const opt = name => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : ''; };
// The local day, like the dates people and agents write; never the day in Greenwich.
const localDay = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const TODAY = () => (TEST && (opt('today') || process.env.MIZAN_TODAY)) || localDay(new Date());
const plain = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// ---------- addresses ----------
// Every host an address reaches: its own, and any address wrapped inside it (a web archive, a translator, a proxy).
function hostsIn(u) {
  const out = [];
  let s = String(u || '');
  try { s = decodeURIComponent(s); } catch (e) { /* keep as written */ }
  for (const m of s.matchAll(/https?:\/\/([^\/\s?#:@]+@)?([^\/\s?#:]+)/gi)) out.push(m[2].toLowerCase().replace(/\.+$/, '').replace(/^www\./, ''));
  return out;
}
const onHost = (h, name) => h === name || h.endsWith('.' + name);
const banned = u => { for (const h of hostsIn(u)) { const b = RULES.banned_hosts.find(x => onHost(h, x.host)); if (b) return Object.assign({ at: h }, b); } return null; };
// The page of a work itself, in a library that holds works: decided by the host AND the shape of the page's address, never by a wrapped address.
function primary(u) {
  let url; try { url = new URL(String(u)); } catch (e) { return false; }
  const h = url.hostname.toLowerCase().replace(/\.+$/, '').replace(/^www\./, '');
  if (hostsIn(u).length !== 1) return false;
  let pathname = url.pathname; try { pathname = decodeURIComponent(pathname); } catch (e) { /* as written */ }
  return RULES.primary_text.some(p => h === p.host && new RegExp(p.page, 'i').test(pathname));
}
const isHttp = u => /^https?:\/\/\S+\.\S+/.test(String(u || ''));

// ---------- signatures ----------
// A signature only ties a result to the exact words it was given for; it is not a secret. What makes a result true is that
// the check reads the source again itself. Changing the words, the address, the speaker, the side or the label breaks the tie.
const sign = it => crypto.createHash('sha1').update(JSON.stringify([it.side, it.kind, it.who, it.work, it.ref, it.via || null, it.grade || '', !!it.translated_by_map, it.on_page_as || '', it.quote_ar || '', it.check_url_ar || '', it.quote_en || '', it.check_url_en || ''])).digest('hex').slice(0, 16);
const found = it => !!it && it.verified === true && !!it.check && it.check.hash === sign(it);
const slim = list => arr(list).map(a => [a.where || '', a.query || '', a.url || '', a.result || '']);
const rbCore = rb => [rb.side, rb.sought, rb.sought_phrase || '', rb.who, rb.barrier || '', rb.reported_by || null, rb.reported_quote_ar || '', rb.check_url_ar || '', rb.reported_quote_en || '', rb.check_url_en || '', rb.statement || '', slim(rb.attempts), slim((rb.second_search || {}).attempts)];
const signRb = rb => crypto.createHash('sha1').update(JSON.stringify(rbCore(rb))).digest('hex').slice(0, 16);
// The verdict is tied to the found quotes AND to how each was read.
const evidenceHash = q => crypto.createHash('sha1').update(arr(q.evidence).filter(found).map(e => [e.id, e.check.hash, e.cut || '', e.stance || '', e.who_matches === true ? 1 : 0].join(':')).join('|')).digest('hex').slice(0, 16);
// A search counts when it says where, what and with what result, and was not found missing from its writer's own record.
const record = a => !!a && words(a.where) >= 1 && words(a.query) >= 1 && words(a.result) >= 1 && a.unproven !== true;
// The searches of one list that count: each a record, and the same search (same place, same words, same address) counted once however often it is written.
const counted = list => { const seen = new Set(); return arr(list).filter(record).filter(a => { const k = [a.where, a.query, a.url || ''].map(x => String(x).trim().toLowerCase().replace(/\s+/g, ' ')).join('|'); if (seen.has(k)) return false; seen.add(k); return true; }); };
const byId = (q, id) => arr(q.evidence).find(e => e.id === id);
// The years in a text, whichever digits it is written in (a library catalogue writes "ت ٦٧٦هـ").
const AR_DIGITS = new RegExp('[' + String.fromCharCode(0x660) + '-' + String.fromCharCode(0x669) + ']', 'g');
const years = s => (String(s || '').replace(AR_DIGITS, d => String(d.charCodeAt(0) - 0x660)).match(/\d{3,4}/g) || []);
// The date a named turn gives, against its source: "sourced" when a year in it is one the library's catalogue gives for the author
// of a page the turn rests on (or, where it dates no author, for the edition), or stands in the quote itself; "differs" when the
// catalogue gives years and the turn gives none of them; "unsourced" when the catalogue gives no year (the date is then its writer's).
const turnDate = (q, t) => {
  const refs = arr(t.evidence_ref).map(id => byId(q, id)).filter(Boolean), own = years(t.when);
  const author = refs.flatMap(e => years((e.check || {}).author)), edition = refs.flatMap(e => years((e.check || {}).edition)), inQuote = refs.flatMap(e => years(e.quote_ar).concat(years(e.quote_en)));
  const given = author.length ? author : edition;
  if (!given.length) return { state: own.some(y => inQuote.includes(y)) ? 'sourced' : 'unsourced', given };
  return { state: own.some(y => given.includes(y) || inQuote.includes(y)) ? 'sourced' : 'differs', given };
};
const gradeText = e => [e.grade, arr((e.check || {}).grades).map(g => g.grade + ' (' + g.name + ')').join(', ')].filter(Boolean).join(' | ');
const weakHadith = e => e.kind === 'hadith' && (e.use === 'shown-as-weak' || new RegExp(RULES.weak_grade_re, 'i').test(gradeText(e)));
const someonesWords = e => e.kind !== 'quran' && e.kind !== 'hadith';
// A quote can carry weight only when the script found it, a second reader found the cut faithful and the person named to be the
// person whose words they are, the author has not withdrawn it, and (for a hadith) it is not graded weak.
const usable = e => found(e) && e.superseded !== true && !weakHadith(e) && (e.kind === 'quran' || (e.cut === 'faithful' && (!someonesWords(e) || e.who_matches === true)));
const speaks = e => usable(e) && SPEAKERS.includes(e.kind) && e.stance === 'own';
// A side speaks through a specialist OF THAT SIDE. The other side's specialist, read against his own conclusion, is not its voice.
const OWN_KIND = { claim: 'scholar', objection: 'advocate' };
const ownSpecialist = (q, side) => arr(q.evidence).some(e => e.side === side && e.kind === OWN_KIND[side] && speaks(e));
// Cases opened under these rules say what each bearing rests on, and must account for every specialist they name. Older cases are read as before.
const GROUND_RULES = 6;
// A bearing that rests on what a quote does not say, or on a possibility the quote only raises, is kept and shown and counts for nothing, whichever side it favours.
const weightless = (q, b) => Number(q.rules) >= GROUND_RULES && (b.ground === 'silence' || b.ground === 'possibility');
// An objection that no advocate has published in words that could be read: the case built it itself, and says so.
const constructed = q => /^no\b/i.test(String((q.objection || {}).by || '').trim()) && !arr(q.evidence).some(e => e.side === 'objection' && e.kind === 'advocate' && speaks(e));
const sameName = (a, b) => { const k = plain(String(b).split(/[,(]/)[0]).slice(0, 12); return k.length >= 3 && plain(a).includes(k); };
const eitherName = (a, b) => sameName(a, b) || sameName(b, a);
// One source = one author's one work (the library's own naming where there is one; verse and hadith numbers are not separate sources).
const sourceKey = e => (e.kind === 'quran' ? 'quran' : plain((e.check || {}).author || e.who).replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 28) + '|' + (e.kind === 'hadith' ? '' : plain((e.check || {}).book || e.work).slice(0, 28)));

function roadblockFaults(rb) {
  const R = RULES.roadblock, out = [], by = rb.reported_by || {}, c = rb.check || {};
  if (!SIDES.includes(rb.side)) out.push('no side');
  if (words(rb.sought) < 4) out.push('"sought" must say what original was looked for');
  if (words(rb.sought_phrase) < R.min_phrase_words) {
    if (words(rb.sought_phrase_unknown) < 5) out.push('give a few exact words of the original as the report quotes them (sought_phrase), or say why the report gives none (sought_phrase_unknown)');
    else if (c.report_quotes_words === true) out.push('the reporting page does quote words beside what it says of the original; they must be given as sought_phrase so the libraries can be searched for them');
  }
  if (words(rb.who) < 1) out.push('"who" must name who is reported to have answered');
  if (!R.barriers.includes(rb.barrier)) out.push('name the kind of barrier: ' + R.barriers.join(', '));
  if (!isHttp(by.url) || words(by.title) < 1) out.push('reported_by needs the title and address of the page that reports it');
  else if (banned(by.url)) out.push('the report itself is on ' + banned(by.url).at);
  else if (![rb.check_url_ar, rb.check_url_en].filter(Boolean).some(u => String(u).split('#')[0] === String(by.url).split('#')[0])) out.push('the report\'s words must be checked on the reporting page itself (check_url must be reported_by.url)');
  if (words(by.author) < 1) out.push('reported_by.author is empty (write "unsigned" if the page names no author)');
  // The standing of the page relied on is itself a statement: it is given in the words of a page, and the script finds them there.
  if (words(by.standing) < 3) out.push('reported_by.standing must say what standing the reporting page has');
  if (words(by.standing_quote) < 6 || !isHttp(by.standing_url)) out.push('the standing must rest on found words: reported_by.standing_quote (the words of a page that say who stands behind the reporter) and reported_by.standing_url');
  else if (c.standing !== 'found') out.push('the words given for the reporter\'s standing were not found on ' + by.standing_url);
  if (!(rb.verified === true && c.hash === signRb(rb))) out.push('the report\'s own words were not found on its page, or the record was edited after the check');
  const at = counted(rb.attempts);
  if (at.length < R.min_attempts) out.push(at.length + ' search(es) recorded with place, query and result (at least ' + R.min_attempts + ')');
  if (new Set(at.map(a => (hostsIn(a.url)[0] || String(a.where).toLowerCase().split(/[\s:,(]/)[0]))).size < R.min_places) out.push('the searches cover fewer than ' + R.min_places + ' different places');
  const s = rb.second_search || {}, sat = counted(s.attempts);
  if (!words(s.by) || sat.length < R.min_second_attempts || s.result !== 'not found') out.push('no second, independent search that also failed (at least ' + R.min_second_attempts + ' searches by another agent, result "not found")');
  const m = rb.machine_search || {};
  if (words(rb.sought_phrase) >= R.min_phrase_words) {
    const need = RULES.search_engines.min_answering[m.script] || 1;
    if (m.hash !== signRb(rb) || !arr(m.engines).length) out.push('the script has not searched the libraries for the sought words');
    else if (arr(m.engines).filter(e => e.control_hits > 0).length < need) out.push('fewer than ' + need + ' search service(s) answered their control search, so "no hits" proves nothing');
    else if (m.total_hits > 0) out.push('NOT A ROADBLOCK: the script found the sought words in ' + m.total_hits + ' place(s); the first: ' + (m.first || ''));
    else if (m.found_at) out.push('NOT A ROADBLOCK: the script opened a place a shorter search pointed to and the sought words are there: ' + m.found_at);
  }
  const p = rb.search_proof || {};
  if (p.hash !== signRb(rb)) out.push('the listed searches are not proven against the agents\' own records');
  else {
    // Nothing may be listed that was not done; and enough different searches must have come back with an answer (a refused fetch looked at nothing).
    const n1 = arr(rb.attempts).length, n2 = arr(s.attempts).length;
    if (!(p.first_proved === n1 && p.second_proved === n2 && p.independent === true)) out.push((p.first_proved || 0) + ' of ' + n1 + ' first search(es) and ' + (p.second_proved || 0) + ' of ' + n2 + ' second search(es) are in the records of the agents that listed them' + (p.independent ? '' : ', and the second search is not shown to be by another agent') + ': a search that is not in the record may not be listed');
    else if (!(p.first_answered >= R.min_attempts && p.second_answered >= R.min_second_attempts)) out.push('only ' + (p.first_answered || 0) + ' first and ' + (p.second_answered || 0) + ' second search(es) are different searches that came back with an answer (at least ' + R.min_attempts + ' and ' + R.min_second_attempts + '): a search that was refused or failed looked at nothing');
  }
  const st = String(rb.statement || '');
  if (words(st) < 15 || !new RegExp(R.admit_re, 'i').test(st)) out.push('the statement must say plainly that the original was not found in the places searched');
  else if (/\b(cannot be found|does not exist|is lost)\b/i.test(st) && rb.barrier !== 'lost') out.push('the statement claims more than the search shows: say "I did not find it in these places", not that it cannot be found');
  else if (![by.author, by.title].some(x => x && x !== 'unsigned' && st.toLowerCase().includes(String(x).toLowerCase().slice(0, 14)))) out.push('the statement must name the page it relies on');
  return out;
}

// The specialists a case names for a side and then neither quotes, nor sets aside as the weaker choice, nor declares as a roadblock
// with a proven search. A best advocate who could not be read is a gap, and a gap is said in the open.
const unsaidGaps = (q, side) => arr((q[side] || {}).candidates).filter(c => words(c.who) && !(arr(q.evidence).some(e => e.side === side && found(e) && eitherName(e.who, c.who)) || (c.not_quoted === 'weaker' && words(c.why) >= 4) || arr(q.roadblocks).some(rb => rb.side === side && eitherName(rb.who, c.who) && !roadblockFaults(rb).length)));

// What the case says in its own name, for BOTH sides alike: the claim and the objection as stated, every point, every reason,
// the verdict. A span inside quotation marks is left out only when those very words are in a found quote of this case.
function ownVoice(q) {
  const v = q.verdict || {}, s = q.swap_test || {}, c = q.claim || {}, o = q.objection || {};
  const parts = [q.plain, c.text, c.short, o.name, o.text, v.short, v.reasoning, v.crux, v.would_change, v.not_shown, v.scope_change, s.standard, s.to_claim, s.to_objection]
    .concat(arr(v.claim_corrections), arr(v.claim_assumptions), arr(v.objection_corrections), arr(v.objection_assumptions), arr(q.points).map(p => p.text), arr(q.points).map(p => p.bears_on), arr(q.points).map(p => p.not_needed_because), arr(q.premises).map(p => p.why), arr(q.exchange).map(t => t.text));
  const quoted = ' ' + arr(q.evidence).filter(found).map(e => plain(e.quote_en) + ' ' + plain(e.quote_ar)).join(' ') + ' ';
  return parts.filter(Boolean).join(' \n ').normalize('NFKC').replace(/\s+/g, ' ').replace(/"([^"\n]{1,400})"|“([^”\n]{1,400})”/g, (m, a, b) => (plain(a || b) && quoted.includes(' ' + plain(a || b) + ' ') ? ' ' : m));
}

// ---------- the outcome ----------
// Nobody chooses the outcome. It is worked out from the marks on the points each argument NEEDS, by one table in which
// "claim" and "objection" can be swapped and the answer swaps with them.
//   state of a side:  broken = a needed point is false · disputed = one is disputed · short = one is unsupported · sound = all confirmed
function sideState(q, side, statusOf) {
  const ps = arr(q.premises).filter(p => p.needed === true && p.side === side);
  if (!ps.length) return 'none';
  const st = ps.map(statusOf);
  return st.includes('false') ? 'broken' : st.includes('disputed') ? 'disputed' : st.every(s => s === 'confirmed') ? 'sound' : 'short';
}
function rule(c, o) {
  if (c === 'none' || o === 'none') return 'not-determined';
  if (c === 'sound' && o === 'broken') return 'refuted';
  if (c === 'sound' && o === 'short') return 'answered';
  if (o === 'sound' && c === 'broken') return 'objection-stands';
  if (o === 'sound' && c === 'short') return 'claim-unsupported';
  if (c === 'disputed' || o === 'disputed' || (c === 'sound' && o === 'sound')) return 'open';
  return 'neither-holds';
}
const BEHIND = { refuted: 'objection', answered: 'objection', 'objection-stands': 'claim', 'claim-unsupported': 'claim' };
function outcome(q) {
  const so = (q.verdict || {}).second_opinion || {}, mine = new Map(arr(so.premises).map(p => [p.id, p.status]));
  const first = rule(sideState(q, 'claim', p => p.status), sideState(q, 'objection', p => p.status));
  const second = mine.size ? rule(sideState(q, 'claim', p => mine.get(p.id)), sideState(q, 'objection', p => mine.get(p.id))) : null;
  const needed = arr(q.premises).filter(p => p.needed === true), end = q.exchange_end || {}, caps = [];
  // What stands in the way of a firm outcome. Each of these turns the outcome into "not determined", whichever side it would have favoured.
  // Where the two judges differ. If they reach different outcomes, or the outcome names a side as ahead, a difference withholds it.
  // If both reach the same outcome and that outcome is "open", their differences on single points are shown and change nothing.
  const firm = first !== 'open', notes = [], put = t => (firm ? caps : notes).push(t);
  if (!mine.size) caps.push('no second judge has marked the needed points');
  else {
    const d = needed.filter(p => mine.get(p.id) !== p.status), dt = 'the two judges, who did not see each other, mark differently: ' + d.map(p => p.id + ' (' + p.status + ' / ' + (mine.get(p.id) || 'not marked') + ')').join(', ');
    if (second !== first) caps.push('the two judges reach different outcomes ("' + first + '" and "' + second + '")' + (d.length ? '; ' + dt : ''));
    else if (d.length) put(dt);
  }
  if (arr(so.needed_disagree).length) put('the second judge holds that ' + so.needed_disagree.join(', ') + ' was wrongly set aside as not needed');
  if (arr(so.needed_wrongly).length) put('the second judge holds that the argument does not need ' + so.needed_wrongly.join(', '));
  if (arr(end.unchecked).length) caps.push('points were never examined: ' + end.unchecked.join(', '));
  if (end.stopped_by !== 'nothing-new-confirmed') caps.push('the exchange was stopped before a neutral search confirmed that nothing more has been published on it');
  if (arr(end.leads).length) caps.push(end.leads.length + ' published answer(s) were found by the last search and are not yet on the table');
  for (const side of SIDES) if (!ownSpecialist(q, side)) caps.push('no specialist of the ' + side + ' side could be quoted in his own voice' + (side === 'objection' && constructed(q) ? ': no published critic could be read, so the objection on the table was built by the method itself from the other side\'s sources and its own reasoning' : ''));
  // Nobody is left with an unanswered last turn: the other side was given a turn after it, and either answered (then it spoke last) or said it has nothing to add.
  const lastTurn = arr(q.exchange)[arr(q.exchange).length - 1], partNo = name => parseInt(name, 10) || 0;
  if (lastTurn) { const other = SIDES.find(s => s !== lastTurn.side); if (!(partNo((end.declined || {})[other]) > partNo(lastTurn.part))) caps.push('the ' + lastTurn.side + ' side spoke last, and the ' + other + ' side was not given a turn to answer it or to say it has nothing to add'); }
  // Nobody is counted as having failed on a source that could not be reached.
  if (BEHIND[first] && arr(q.roadblocks).some(rb => rb.side === BEHIND[first])) caps.push('a source of the ' + BEHIND[first] + ' side could not be reached (a roadblock), so that side is not counted as having failed');
  return { first, second, caps, notes, final: caps.length ? 'not-determined' : first };
}
// The needed points the outcome turns on.
function decisive(q, o) {
  const ps = arr(q.premises).filter(p => p.needed === true), of = (side, st) => ps.filter(p => p.side === side && st.includes(p.status));
  return ({ refuted: of('objection', ['false']), answered: of('objection', ['unsupported']), 'objection-stands': of('claim', ['false']), 'claim-unsupported': of('claim', ['unsupported']), open: ps.filter(p => p.status === 'disputed'), 'neither-holds': ps.filter(p => p.status === 'false' || p.status === 'unsupported') })[o] || [];
}

function F(text) { return { level: 'FAIL', text }; }
function W(text) { return { level: 'WARN', text }; }
// Not a fault of the record: a library's catalogue did not answer, so the check could not be run. It is not a pass either.
function U(text) { return { level: 'UNRUN', text: 'the library did not answer; this was not checked in this run: ' + text }; }
const unanswered = e => ((e || {}).check || {}).catalogue_unanswered === true;

// Each check returns a list of findings.
const CHECKS = [
  ['both-voices', 'Each side speaks through a specialist of its own, in words that were found, that he says in his own voice, and that are not cut against his meaning. One rule for both sides.', q => {
    const out = [], ev = arr(q.evidence);
    for (const side of SIDES) {
      if (ownSpecialist(q, side) || (side === 'objection' && constructed(q))) continue;
      if (!arr(q.roadblocks).some(rb => rb.side === side && !roadblockFaults(rb).length)) out.push(F('the ' + side + ' has no found quote of a specialist of its own side speaking for himself' + (side === 'claim' ? ' (scripture alone is not the scholars\' answer)' : '') + ', and no proven roadblock says why'));
    }
    const obj = ev.filter(e => e.side === 'objection' && e.kind === OWN_KIND.objection && speaks(e)), by = String((q.objection || {}).by || '');
    // Where no published advocate of the objection could be read, the case says so in the open and shows the search; it does not lend the objection a name.
    if (constructed(q)) { if (counted((q.searched || {}).objection_side).length < 4) out.push(F('the case says no advocate of the objection could be read, on fewer than four searches that count in the own libraries of that side')); }
    else if (obj.length && words(by) && !obj.some(e => sameName(e.who, by))) out.push(F('the advocate named for the objection (' + by.slice(0, 80) + ') is not the person quoted for it; if no advocate has written on it in words that can be read, objection.by must begin "No " and say so'));
    return out;
  }],
  ['best-advocate', 'Each side is put through its strongest specialists, and the case says who else was considered and where their work is. The same for both sides.', q => {
    const out = [];
    for (const side of SIDES) {
      const ok = arr((q[side] || {}).candidates).filter(c => words(c.who) && words(c.why) >= 4 && isHttp(c.url) && !banned(c.url));
      if (ok.length < 2) out.push(F(side + '.candidates must name at least two specialists who were considered for the ' + side + ' side, each with why and the address of his work'));
      for (const c of unsaidGaps(q, side)) out.push((Number(q.rules) >= GROUND_RULES ? F : W)('a specialist named for the ' + side + ' side (' + String(c.who).slice(0, 60) + ') is neither quoted, nor set aside as the weaker choice (not_quoted: "weaker"), nor declared as a roadblock with a proven search: a best advocate who could not be read is a gap, and a gap is said in the open'));
    }
    return out;
  }],
  ['no-encyclopedia', 'No encyclopedia, wiki, forum, social post, short link or polemic site stands in for either side, even behind an archive or a proxy.', q => {
    const out = [], urls = [];
    for (const e of arr(q.evidence)) urls.push(e.url, e.check_url_ar, e.check_url_en, (e.check || {}).final_url);
    for (const rb of arr(q.roadblocks)) urls.push((rb.reported_by || {}).url, (rb.reported_by || {}).standing_url, rb.check_url_ar, rb.check_url_en);
    for (const u of urls.filter(Boolean)) { const b = banned(u); if (b) out.push(F(b.at + ' is used as a source (' + b.why + ')')); }
    return out;
  }],
  ['verbatim', 'Every quote was found, word for word, on the page it cites, and nothing about it was changed afterwards.', q => {
    const n = arr(q.evidence).filter(e => !found(e)).length;
    return n ? [F(n + ' evidence item(s) not found on their page, or changed after the check')] : [];
  }],
  ['quote-size', 'A quote is long enough to prove the wording, and each kept piece of it is too.', q => {
    const out = [];
    for (const e of arr(q.evidence)) {
      if (e.kind === 'quran' || (e.check || {}).whole === true) continue;
      for (const quote of [e.check_url_ar && e.quote_ar, !e.translated_by_map && e.check_url_en && e.quote_en].filter(Boolean)) {
        const ps = String(quote).split(/\s*(?:\[\s*(?:\.\.\.|…)\s*\]|\.\.\.+|…)\s*/).filter(s => s.trim());
        if (words(ps.join(' ')) < RULES.min_quote_words) out.push(F('a quote of ' + (e.who || '?') + ' has fewer than ' + RULES.min_quote_words + ' words'));
        // Pieces that stand side by side on the page are one passage: the dots are the author's own.
        else if (arr((e.check || {}).skipped).length && ps.some(p => words(p) < RULES.min_piece_words)) out.push(F('a quote of ' + (e.who || '?') + ' keeps a piece shorter than ' + RULES.min_piece_words + ' words'));
      }
    }
    return out;
  }],
  ['first-hand', 'Words are quoted from the work itself: a page of a library that holds the work, or a page whose own author tag names the author and whose title is the work\'s. Otherwise the case names who is quoting, his standing and what it rests on.', q => {
    const out = [];
    for (const e of arr(q.evidence)) {
      if (e.kind === 'quran') continue;
      const u = e.check_url_ar || e.check_url_en || '', c = e.check || {};
      if (!u || primary(u) || (c.authored === true && c.work_in_title === true)) continue;
      const v = e.via || {};
      if (words(v.who) < 1 || words(v.standing) < 3 || words(v.basis) < 5) out.push(F((e.who || '?') + ' is quoted from ' + (hostsIn(u)[0] || u) + ', which is not shown to be the work itself; evidence.via must say who is quoting or publishing it (for an article by its own author on a page with no author tag: the publisher), his standing, and what that standing rests on'));
      // The one said to quote or publish it is a statement too: the page itself must name him.
      else if (found(e) && c.via_named !== true) out.push(F((e.who || '?') + ' is said to be quoted or published by "' + String(v.on_page_as || v.who).slice(0, 50) + '", and the page (' + (hostsIn(u)[0] || u) + ') does not name him in its author tag, its title or its first lines: give via.on_page_as as the page itself writes his name'));
    }
    return out;
  }],
  ['attributed', 'The words are tied to the person named: the script found his name where the library\'s catalogue, the page\'s author tag, its title or the lines before the quote give it, and a second reader confirmed that the person named is the one whose words they are.', q => {
    const out = [];
    for (const e of arr(q.evidence)) {
      if (!found(e) || e.kind === 'quran') continue;
      const c = e.check || {}, n = say(e.who, 40);
      if (e.kind === 'hadith') { if (c.collection_matches === false) out.push(F('the hadith ' + n + ' is cited to one collection and its page is another (' + (c.collection || '?') + ')')); continue; }
      if (unanswered(e)) out.push(U('whether the catalogue names ' + n + ' as the author of the page of ' + e.id));
      else if (c.attribution !== 'named') out.push(F('nothing ties the page to ' + n + ' (on_page_as must give the name as the catalogue or the page writes it, and the script must find it there)'));
      else if (e.who_matches !== true) out.push(F('no second reader has confirmed that ' + n + ' is the person whose words these are (not someone the page merely mentions or reports)'));
    }
    return out;
  }],
  ['reading', 'Readers other than its gatherer, shown the words the script recorded around each quote, have said that the cut keeps the meaning, and whose voice it is. Where two readers differ, the stricter reading stands. Whatever the script flagged, the reader answered.', q => {
    const out = [];
    for (const e of arr(q.evidence)) {
      if (e.kind === 'quran' || !found(e)) continue;
      const c = e.check || {}, n = say(e.who, 40);
      if (words(c.before) + words(c.after) < 6 && c.whole !== true) { out.push(F('the script has not recorded the words around the quote of ' + n)); continue; }
      if (!['faithful', 'changes-meaning'].includes(e.cut) || words(e.cut_by) < 2 || /advocate|gatherer/i.test(e.cut_by)) { out.push(F('nobody other than its gatherer has read the quote of ' + n + ' in its context')); continue; }
      if (e.cut !== 'faithful') out.push(F('a reader found that the quote of ' + n + ' is cut against its meaning: quote the whole sentence, or drop it'));
      if (arr(c.flags).length && words(e.reading_note) < 8) out.push(F('the script flagged the quote of ' + n + ' (' + c.flags[0] + ') and the reader did not say why it still holds'));
      if (someonesWords(e) && !['own', 'reports-rejects', 'reports-neutral'].includes(e.stance)) out.push(F('the reader did not say whether ' + n + ' speaks for himself there'));
    }
    return out;
  }],
  ['translation-checked', 'Wherever an original and an English text stand together, a translator who took no side and worked from the original alone confirmed that the English says what the original says (or, for the map\'s own English, replaced it).', q => {
    const out = [], [lo, hi] = RULES.translation_ratio;
    for (const e of arr(q.evidence)) {
      if (e.kind === 'quran' || !words(e.quote_ar) || !words(e.quote_en)) continue;
      const t = e.translation_check || {}, r = words(e.quote_en) / Math.max(1, words(e.quote_ar)), n = say(e.who, 40);
      if (r < lo || r > hi) out.push(F('the English given for ' + n + ' is ' + r.toFixed(1) + ' times the length of the original: it cannot be a rendering of just those words'));
      else if (words(t.by) < 2 || /advocate|gatherer/i.test(t.by) || words(t.own_translation) < 2) out.push(F('the English beside the original of ' + n + ' has not been checked by a translator who took no side'));
      else if (t.agree !== true) out.push(F('the translator found that the English given for ' + n + ' does not say what the original says: ' + String(t.note || '').slice(0, 120)));
      else if (t.hash !== crypto.createHash('sha1').update(String(e.quote_ar) + '|' + String(e.quote_en)).digest('hex').slice(0, 12)) out.push(F('the English of ' + n + ' was changed after it was confirmed'));
      // A tripwire the translator cannot wave through: a plain negation on one side and none on the other.
      else if (NEG_AR_STRONG.test(bare(e.quote_ar)) !== NEG_EN.test(e.quote_en) && !(NEG_AR_ANY.test(bare(e.quote_ar)) && NEG_EN.test(e.quote_en)) && !/negat|نفي/i.test(String(t.note || ''))) out.push(F('the original of ' + n + (NEG_EN.test(e.quote_en) ? ' has no negation and the English has one' : ' has a negation and the English has none') + ': the translator must look again and say in his note how the negation is rendered'));
    }
    // "Worked from the original alone" is a statement, so it is proven: the translator's record shows his own translation was written before he opened the English the gatherers gave.
    const pv = arr((q.provenance || {}).parts);
    for (const part of arr(q.parts).filter(p => p.role === 'translate')) { const r = pv.find(x => x.part === part.part); if (r && r.sealed !== true) out.push(F('the translator (part ' + part.part + ') is not shown to have worked from the original alone: before his own translation was written his record shows ' + (arr(r.saw).join(', ') || 'no write of his own part'))); }
    return out;
  }],
  ['hadith-graded', 'A hadith is cited with its collection and number, and outside the two Sahihs with its grading and who gave it. A weak or fabricated report carries no weight, and a Companion\'s own words are not passed off as the Prophet\'s.', q => {
    const out = [];
    for (const e of arr(q.evidence)) {
      if (e.kind !== 'hadith') continue;
      const u = String(e.check_url_ar || e.check_url_en), grade = gradeText(e), n = say(e.who, 40);
      if (!/\d/.test(String(e.who) + ' ' + String(e.ref))) out.push(F('a hadith is cited without its number: ' + n));
      // The collection's own page: its file in the hadith collections, or a library page the catalogue lists as the Sahih itself.
      const sahih = primary(u) && new RegExp(RULES.sahihayn_re, 'i').test(String(e.who)) && (/hadith-api@[^/]+\/editions\/[a-z]+-(bukhari|muslim)\//.test(u) || SAHIH_BOOK.test(String((e.check || {}).book || '')));
      if (unanswered(e) && primary(u) && new RegExp(RULES.sahihayn_re, 'i').test(String(e.who)) && (words(grade) < 1 || (words(e.graded_by) < 1 && !arr((e.check || {}).grades).length))) out.push(U('whether the page of the hadith ' + n + ' is the Sahih itself'));
      else if (!sahih && (words(grade) < 1 || (words(e.graded_by) < 1 && !arr((e.check || {}).grades).length))) out.push(F('the hadith ' + n + ' is outside the two Sahihs (or not read on their own page) and has no grading with the name of who graded it'));
      if (new RegExp(RULES.weak_grade_re, 'i').test(grade) && e.use !== 'shown-as-weak') out.push(F('the hadith ' + n + ' is graded ' + say(grade, 60) + ': mark it use "shown-as-weak"; it can carry no point'));
      if (new RegExp(RULES.companion_grade_re, 'i').test(grade) && e.use !== 'companion-report') out.push(F('the page grades ' + n + ' as the words of a Companion or a Successor, not of the Prophet: mark it use "companion-report" and say so where it is used'));
    }
    return out;
  }],
  ['later-position', 'For each author quoted, his later statements were looked for, so an early view he withdrew is not presented as his view.', q => {
    const out = [];
    for (const e of arr(q.evidence)) {
      if (!SPEAKERS.includes(e.kind)) continue;
      const l = e.later_position || {};
      if (!['none found', 'revised', 'same'].includes(l.result) || !counted(l.searched).length) out.push(F('no search (found in its writer\'s record) for a later position of ' + say(e.who, 40)));
      else if (l.result === 'revised' && e.superseded !== true) out.push(F(say(e.who, 40) + ' later revised this view; the item must be marked superseded and cannot stand for him'));
    }
    return out;
  }],
  ['roadblock-honest', 'Where an original was not found, the case says so in the open, and every part of that sentence is proven: the report\'s words and the words for its standing were found on their pages, the words sought are words the report quotes, the script searched the libraries for them, the agents\' records show every listed search, and a second agent also failed.', q => {
    const out = arr(q.roadblocks).flatMap((rb, i) => roadblockFaults(rb).map(t => F('roadblock ' + (rb.id || i + 1) + ' (' + String(rb.sought || '').slice(0, 40) + '): ' + t)));
    // "A second agent, who was not shown how the first one searched" is a statement, so it is proven from his record.
    const pv = arr((q.provenance || {}).parts);
    if (pv.length) for (const rb of arr(q.roadblocks)) { const r = pv.find(x => x.part === (rb.second_search || {}).part); if (r && r.sealed !== true) out.push(F('roadblock ' + rb.id + ': the second searcher (part ' + r.part + ') is not shown to have searched on his own: before his part was final his record shows ' + (arr(r.saw).join(', ') || 'no write of his own part'))); }
    return out;
  }],
  ['both-libraries', 'The libraries of both sides were searched, each in its own language, and the searches are written down and found in their writers\' records.', q => {
    const s = q.searched || {}, out = [], lang = (q.sides || {});
    for (const side of SIDES) {
      const recs = counted(s[side + '_side']), script = (lang[side] || {}).script;
      if (!words(script)) out.push(F('the case does not say in which language the ' + side + ' side\'s own library is written (sides.' + side + '.script)'));
      if (recs.length < 2) out.push(F('fewer than two searches that count (place, query, result, and in the writer\'s record) in the ' + side + ' side\'s own libraries'));
      else if (script === 'arabic' && !recs.some(r => ARABIC_WORDS.test(r.query))) out.push(F('no search of the ' + side + ' side was made in Arabic, its own language'));
    }
    const c = counted(s.claim_side).length, o = counted(s.objection_side).length;
    if (c && o && Math.max(c, o) / Math.min(c, o) > RULES.effort_fail_ratio) out.push(F('one side was searched ' + Math.max(c, o) + ' times and the other ' + Math.min(c, o) + ': the effort is not level'));
    else if (c && o && Math.max(c, o) / Math.min(c, o) > RULES.effort_warn_ratio) out.push(W('searches: claim side ' + c + ', objection side ' + o));
    return out;
  }],
  ['turn-sourced', 'Every turn of the exchange by a named person rests on a found quote of that person, and every reader who checked it confirmed the turn says what the quote says. Anything else is marked as the map\'s own reasoning.', q => {
    const out = [];
    arr(q.exchange).forEach((t, i) => {
      const n = 'turn ' + (i + 1) + ' (' + say(t.who, 30) + ')';
      if (t.own_reasoning === true) { if (!/^(the map|own reasoning)/i.test(String(t.who))) out.push(F(n + ' is the map\'s own reasoning but carries a person\'s name')); return; }
      const refs = arr(t.evidence_ref).map(id => byId(q, id));
      if (!refs.length || refs.some(e => !usable(e))) out.push(F(n + ' is not tied to a found quote that keeps its meaning; words may not be put in a named person\'s mouth'));
      else if (refs.some(e => e.side !== t.side)) out.push(F(n + ' rests on a quote of the other side'));
      else if (!refs.some(e => sameName(t.who, e.who))) out.push(F(n + ' names a person who is not the one quoted'));
      else if (t.faithful !== true || words(t.faithful_by) < 2 || /advocate/i.test(t.faithful_by)) out.push(F(n + ' has not been confirmed by a second reader to say only what the quote says' + (t.faithful === false ? ': ' + String(t.faithful_note || '').slice(0, 100) : '')));
    });
    return out;
  }],
  ['exchange-followed', 'The exchange is followed past the objection, each turn is dated, and the case says how the exchange ended.', q => {
    const ex = arr(q.exchange), end = q.exchange_end || {}, out = [];
    if (!ex.length) return [F('the exchange is empty: the objection is left standing with no reply traced')];
    if (ex[0].side !== 'claim') out.push(F('the first turn after the objection must be the claim side\'s reply'));
    if (ex.some(t => !SIDES.includes(t.side) || !t.who || words(t.text) < 8)) out.push(F('a turn needs a side, a named speaker and at least a sentence'));
    ex.forEach((t, i) => {
      if (t.own_reasoning) return;
      if (!/\d{3,4}/.test(String(t.when))) return out.push(F('turn ' + (i + 1) + ' (' + String(t.who).slice(0, 40) + ') needs its date as a year: "' + String(t.when).slice(0, 40) + '" is not one'));
      // A date is a statement too. Where the library's own catalogue dates the author (or, failing that, the edition) of the page
      // the turn rests on, the turn gives that date; it does not give another from memory.
      const d = turnDate(q, t);
      if (d.state === 'differs') out.push(F('turn ' + (i + 1) + ' dates ' + String(t.who).slice(0, 40) + ' "' + String(t.when).slice(0, 60) + '", but the library\'s catalogue of the page it rests on gives ' + [...new Set(d.given)].join(', ') + ': a date is given as its source gives it'));
      else if (arr(t.evidence_ref).some(id => unanswered(byId(q, id)))) out.push(U('the date of turn ' + (i + 1) + ' against the catalogue of the page it rests on'));
    });
    if (!SIDES.includes(end.last_word)) out.push(F('exchange_end.last_word must say which side spoke last'));
    else if (end.last_word !== ex[ex.length - 1].side) out.push(F('exchange_end.last_word says "' + end.last_word + '" but the last turn is by the ' + ex[ex.length - 1].side + ' side'));
    if (!['nothing-new-confirmed', 'round-limit'].includes(end.stopped_by)) out.push(F('exchange_end.stopped_by must say how the exchange ended: nothing-new-confirmed or round-limit'));
    // Where a side has published answers, the exchange is theirs, not the map's. (A side with no published advocate has only reasoning to offer; that is said elsewhere.)
    const turns = ex.filter(t => !(t.side === 'objection' && constructed(q)));
    if (turns.length >= 2 && turns.filter(t => t.own_reasoning).length > turns.length / 2) out.push(F('more than half of the exchange is the map\'s own reasoning; the published exchange was not traced'));
    return out;
  }],
  ['last-word', 'Whichever side speaks last, the other side\'s libraries were searched at least twice, in that side\'s own language, for an answer.', q => {
    const ex = arr(q.exchange), end = q.exchange_end || {};
    if (!ex.length) return [];
    const last = ex[ex.length - 1].side, other = SIDES.find(s => s !== last), recs = counted(end.looked_for_more);
    if (recs.length < 2) return [F('the ' + last + ' side has the last word, and fewer than two searches that count for an answer from the other side are recorded')];
    if (((q.sides || {})[other] || {}).script === 'arabic' && !recs.some(r => ARABIC_WORDS.test(r.query))) return [F('the ' + last + ' side has the last word, and no search for an answer was made in Arabic, the other side\'s own language')];
    return [];
  }],
  ['premise-coverage', 'Every point either side raised, and every point a neutral reader drew out of their words, was examined.', q => {
    const ps = new Set(arr(q.premises).map(p => p.id)), out = [];
    if (!arr(q.points).length) return [F('the case does not list the points that were raised (points)')];
    for (const side of SIDES) if (!arr(q.points).some(p => p.side === side)) out.push(F('no point of the ' + side + ' side is listed'));
    if (!arr(q.points).some(p => /extract|neutral/i.test(String(p.from)))) out.push(F('no neutral reader listed the steps of each argument'));
    const miss = arr(q.points).filter(p => !ps.has(p.id));
    if (miss.length) out.push(F(miss.length + ' point(s) raised were never examined: ' + miss.slice(0, 4).map(p => p.id).join(', ')));
    return out;
  }],
  ['premises-proven', 'A point is marked confirmed, false or disputed only on found quotes that a reader other than the marker confirmed bear on it, in the very words that do; a quote that says the opposite is faced, not left out; unsupported needs recorded searches; "several" and "many" are counted.', q => {
    const out = [], bear = arr(q.bearings);
    for (const p of arr(q.premises)) {
      const n = 'point ' + (p.id || '?') + ' ' + say(p.text, 40);
      if (!SIDES.includes(p.side)) out.push(F(n + ' has no side'));
      if (!STATUSES.includes(p.status)) { out.push(F(n + ' has no status (' + STATUSES.join(', ') + ')')); continue; }
      if (typeof p.needed !== 'boolean') out.push(F(n + ' does not say whether the argument needs it'));
      else if (p.needed && words(p.bears_on) < 5) out.push(F(n + ' is marked needed without saying what fails if it fails (bears_on)'));
      else if (!p.needed && words(p.not_needed_because) < 6) out.push(F(n + ' is set aside as not needed without a reason (not_needed_because)'));
      if (!LEVELS.includes(p.level)) out.push(F(n + ' has no level on the one scale of evidence'));
      // What a reader found a quote is silent on, or found it only raises as a possibility, is on the record (the quote was read) and carries no mark.
      const refs = arr(p.rests_on).map(id => byId(q, id)), read = bear.filter(b => b.point === p.id), links = read.filter(b => !weightless(q, b));
      const only = ground => refs.filter(e => e && !links.some(b => b.evidence === e.id) && read.some(b => b.evidence === e.id && b.ground === ground));
      const says = (id, what) => links.some(b => b.evidence === id && b.bears === what);
      if (p.status === 'unsupported') {
        if (words(p.why) < 6) out.push(F(n + ' is marked unsupported with no reason'));
        // Nobody's needed point is called unsupported on less search than a missing source is given.
        if (p.needed === true && counted(p.looked).length < RULES.min_unsupported_searches) out.push(F(n + ' is needed and marked unsupported on fewer than ' + RULES.min_unsupported_searches + ' recorded searches for its support (looked: place, query, result, each in its writer\'s record)'));
      } else {
        if (!refs.length || refs.some(e => !usable(e))) { out.push(F(n + ' is marked ' + p.status + ' without resting on found quotes that keep their meaning (rests_on)')); continue; }
        if (refs.every(e => e.kind === 'quran')) out.push(F(n + ' rests on verses alone, read by the marker: a point needs the reading of a named scholar (a tafsir or commentary quote) beside the verse'));
        if (refs.every(e => someonesWords(e) && e.stance !== 'own')) out.push(F(n + ' rests only on words the author reports from others'));
        const unread = refs.filter(e => !read.some(b => b.evidence === e.id));
        // What the mark lacks, counting only the bearings that carry weight.
        const lacks = p.status === 'confirmed' ? (refs.some(e => says(e.id, 'supports')) ? '' : ' is marked confirmed and no quote it rests on was read as supporting it')
          : p.status === 'false' ? (refs.some(e => says(e.id, 'contradicts')) ? '' : ' is marked false and no quote it rests on was read as contradicting it')
          : refs.some(e => says(e.id, 'supports')) && refs.some(e => says(e.id, 'contradicts')) && SIDES.every(s => refs.some(e => e.side === s)) ? '' : ' is marked disputed without a found quote from each side on this very point, one read as supporting it and one as contradicting it';
        if (unread.length) out.push(F(n + ': no reader other than the marker has said whether ' + unread.map(e => e.id).join(', ') + ' bears on it'));
        else if (refs.some(e => says(e.id, 'none'))) out.push(F(n + ' rests on a quote a reader found does not bear on it: ' + refs.filter(e => says(e.id, 'none')).map(e => e.id).join(', ')));
        else if (only('silence').length) out.push(F(n + ' rests on a quote a reader found is silent on it: ' + only('silence').map(e => e.id).join(', ') + ' (silence is not a statement, for or against)'));
        else if (lacks) out.push(F(n + (only('possibility').length ? ' is marked ' + p.status + ' on a quote that only raises a possibility: a possibility is not an assertion, whichever side says it' : lacks)));
        // A found quote that says the opposite must be faced: the point is then disputed, not settled by leaving the quote out.
        const against = links.filter(b => usable(byId(q, b.evidence)) && b.bears === (p.status === 'confirmed' ? 'contradicts' : p.status === 'false' ? 'supports' : ''));
        if (against.length) out.push(F(n + ' is marked ' + p.status + ' while a reader found that ' + against.map(b => b.evidence).join(', ') + ' says the opposite: the point is disputed until that quote is answered'));
        if (p.status === 'confirmed' && ['bare possibility', 'inference'].includes(p.level) && !refs.some(e => someonesWords(e))) out.push(F(n + ' is marked confirmed at the level "' + p.level + '" with no specialist\'s reasoning quoted for it'));
        if (p.status === 'confirmed' && p.level === 'bare possibility') out.push(F(n + ' is marked confirmed at the level "bare possibility"'));
        const separate = new Set(refs.filter(usable).filter(e => !e.derives_from || !refs.some(x => x && x.id === e.derives_from)).map(sourceKey)).size;
        const floor = { 'several independent reports': 2, 'many independent carriers': 3 }[p.level];
        if (p.status === 'confirmed' && floor && separate < floor) out.push(F(n + ' is put at "' + p.level + '" but rests on ' + separate + ' separate source(s) (one author\'s one work counts once); that level needs at least ' + floor));
      }
    }
    return out;
  }],
  ['equal-burden', 'The outcome is worked out by the script from the marks on the needed points, by one table that gives the mirror answer when the sides are swapped. The judge\'s word for it must be the table\'s.', q => {
    const ps = arr(q.premises).filter(p => p.needed === true), v = q.verdict || {}, out = [], end = q.exchange_end || {};
    if (!OUTCOMES.includes(v.outcome)) return [F('verdict.outcome must be one of: ' + OUTCOMES.join(', '))];
    for (const side of SIDES) if (!ps.some(p => p.side === side)) out.push(F('no point of the ' + side + ' side is marked as needed by its argument'));
    const known = new Set(arr(q.points).map(p => p.id));
    if (arr(end.unchecked).some(id => !known.has(id))) out.push(F('exchange_end.unchecked names something that is not one of the points'));
    const o = outcome(q);
    if (v.outcome !== o.first) out.push(F('the judge writes "' + v.outcome + '" but his own marks on the needed points give "' + o.first + '"'));
    const peripheral = arr(q.premises).filter(p => p.needed === false && p.status === 'false');
    if (peripheral.some(p => p.side === 'claim') && !arr(v.claim_corrections).filter(Boolean).length) out.push(F('a detail of the claim is false and is not listed under claim_corrections'));
    if (peripheral.some(p => p.side === 'objection') && !arr(v.objection_corrections).filter(Boolean).length) out.push(F('a detail of the objection is false and is not listed under objection_corrections'));
    return out;
  }],
  ['crux-named', 'The verdict names the exact point the outcome turns on, and what the side that comes out ahead has to assume.', q => {
    const v = q.verdict || {}, out = [], d = decisive(q, v.outcome);
    const holds = p => words(v.crux) >= 4 && p.text && (String(v.crux).includes(p.text) || String(p.text).includes(String(v.crux)));
    if (d.length && !d.some(holds)) out.push(F('verdict.crux must be the text of a needed point the outcome turns on (' + d.map(p => p.id).join(', ') + ')'));
    // The side that comes out ahead also says what it has to assume. The same demand whichever side that is.
    if (['answered', 'refuted'].includes(v.outcome) && !arr(v.claim_assumptions).some(a => words(a) >= 5)) out.push(F('the verdict must also name what the claim itself has to assume (claim_assumptions)'));
    if (['objection-stands', 'claim-unsupported'].includes(v.outcome) && !arr(v.objection_assumptions).some(a => words(a) >= 5)) out.push(F('the verdict must also name what the objection itself has to assume (objection_assumptions)'));
    return out;
  }],
  ['reasoning-shown', 'The verdict reasons through the points of both sides by name.', q => {
    const r = String((q.verdict || {}).reasoning || ''), out = [];
    if (words(r) < RULES.min_reasoning_words) return [F('verdict.reasoning has ' + words(r) + ' words (at least ' + RULES.min_reasoning_words + ')')];
    if (distinct(r) < RULES.distinct_ratio) out.push(F('verdict.reasoning repeats itself instead of reasoning'));
    for (const side of SIDES) if (!arr(q.premises).some(p => p.side === side && p.needed && r.includes('[' + p.id + ']'))) out.push(F('verdict.reasoning does not cite a needed point of the ' + side + ' side by its id in brackets'));
    return out;
  }],
  ['second-opinion', 'A second judge, who saw neither the first judge\'s marks nor the fact-checker\'s, marked every needed point himself. Where the two differ, the outcome is "not determined" and the report says on what.', q => {
    const s = (q.verdict || {}).second_opinion || {}, needed = arr(q.premises).filter(p => p.needed === true);
    if (words(s.by) < 2 || !arr(s.premises).length) return [F('no second, independent judge has marked the needed points')];
    const mine = new Set(arr(s.premises).filter(p => STATUSES.includes(p.status)).map(p => p.id)), miss = needed.filter(p => !mine.has(p.id));
    const out = miss.length ? [F('the second judge did not mark needed point(s) ' + miss.map(p => p.id).join(', '))] : [];
    // "Saw neither" is a statement, so it is proven: the record of each judge whose ruling stands shows what he opened before his marks were final.
    const pv = arr((q.provenance || {}).parts);
    if (pv.length) for (const role of ['judge', 'judge2']) {
      const last = arr(q.parts).filter(p => p.role === role).pop(), r = last && pv.find(x => x.part === last.part);
      if (r && r.sealed !== true) out.push(F('the ' + (role === 'judge' ? 'judge' : 'second judge') + ' (part ' + last.part + ') is not shown to have judged blind: before his marks were final his record shows ' + (arr(r.saw).join(', ') || 'no write of his own part') + '. A judge sees the blind view and his own part, and nothing that shows another\'s marks'));
    }
    return out;
  }],
  ['verdict-fresh', 'The verdict was given on exactly the quotes that are in the case now, as they are read now.', q => {
    const out = (q.verdict || {}).evidence_hash === evidenceHash(q) ? [] : [F('the evidence, or how it was read, changed after the verdict was given (or the verdict carries no evidence_hash): the judges must rule again')];
    // The second judge too: his marks count only for the quotes he was shown. (A case opened before he was asked for the hash has none: it is said, not refused.)
    const so = (q.verdict || {}).second_opinion;
    if (so && arr(so.premises).length && so.evidence_hash !== evidenceHash(q)) out.push((so.evidence_hash || Number(q.rules) >= GROUND_RULES ? F : W)(so.evidence_hash ? 'the evidence, or how it was read, changed after the second judge marked the points: the judges must rule again' : 'the second judge\'s part carries no evidence_hash, so nothing ties his marks to the quotes that are in the case now'));
    return out;
  }],
  ['current', 'The conclusion carries a date that is not ahead of the check and not older than three days, says what would change it, and says what it does not show.', q => {
    const v = q.verdict || {}, out = [], d = Date.parse(String(v.as_of || '')), t = Date.parse(TODAY());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v.as_of || '')) || isNaN(d)) out.push(F('verdict.as_of must be the date of the conclusion (YYYY-MM-DD)'));
    else if (d > t) out.push(F('verdict.as_of is ' + v.as_of + ', a date after the day of this check (' + TODAY() + ')'));
    else if (t - d > RULES.as_of_days * 864e5) out.push(F('verdict.as_of is ' + v.as_of + ', more than ' + RULES.as_of_days + ' days before ' + TODAY() + ': the conclusion is not current; search again and weigh it again'));
    // A conclusion cannot be more current than the last look at the sources. That date is read from the agents' own records.
    // The record stamps a search in Greenwich time; the dates people and agents write are local days, so the stamp is read as a local day.
    const stamp = String((q.provenance || {}).newest_search || ''), newestDay = stamp.length > 10 && !isNaN(Date.parse(stamp)) ? localDay(new Date(stamp)) : stamp.slice(0, 10), newest = Date.parse(newestDay);
    if (!isNaN(newest) && !isNaN(d)) {
      if (d < newest) out.push(F('verdict.as_of (' + v.as_of + ') is before the newest search behind the case (' + newestDay + ')'));
      if (t - newest > RULES.as_of_days * 864e5) out.push(F('the newest search behind this case was made on ' + newestDay + ', more than ' + RULES.as_of_days + ' days ago: a new verdict on old searches is not a current conclusion; search again'));
    }
    for (const k of ['would_change', 'not_shown']) if (words(v[k]) < 6 || distinct(v[k]) < RULES.distinct_ratio) out.push(F('verdict.' + k + ' is missing'));
    return out;
  }],
  ['scope', 'The claim is kept as it was asked, the case says if the claim that was weighed is narrower, and it lists the other objections it did not weigh.', q => {
    const out = [], v = q.verdict || {};
    if (words((q.claim || {}).as_given) < 4) out.push(F('claim.as_given must keep the claim in the words it was asked'));
    if (!words(v.scope_change)) out.push(F('verdict.scope_change must say "none", or how the claim that was weighed differs from the claim as asked'));
    else if (!/^none\.?$/i.test(String(v.scope_change).trim()) && !arr(v.claim_corrections).filter(Boolean).length) out.push(F('the claim that was weighed is narrower than the claim as asked, and no correction is listed'));
    if (!arr(q.other_objections).filter(Boolean).length && counted(q.other_objections_searched).length < 2) out.push(F('the case must list the other known objections it did not weigh, or the searches that found none'));
    return out;
  }],
  ['swap-test', 'One standard of evidence is stated and applied to both sides, and someone other than the judge confirmed it was applied alike.', q => {
    const s = q.swap_test || {}, out = [], f = ['standard', 'to_claim', 'to_objection'];
    for (const k of f) if (words(s[k]) < RULES.min_swap_words || distinct(s[k]) < RULES.distinct_ratio) out.push(F('swap_test.' + k + ' is missing or empty words'));
    if (!out.length && new Set(f.map(k => String(s[k]).trim().toLowerCase())).size < 3) out.push(F('the swap test repeats one sentence three times'));
    if (words(s.confirmed_by) < 2 || /\bjudge\b/i.test(String(s.confirmed_by))) out.push(F('nobody other than the judge has confirmed that the standard was applied alike' + (s.refused_note ? ' (a reader refused: ' + String(s.refused_note).slice(0, 120) + ')' : '')));
    // A refusal is cleared by a new ruling, never by asking another reader until one agrees: while any reader of the ruling that
    // stands refused it, the test fails, whoever confirmed it afterwards.
    const fair = arr((arr((q.verdict || {}).history).slice(-1)[0] || {}).fairness), no = fair.filter(f => !f.confirmed), yes = fair.filter(f => f.confirmed);
    if (no.length && yes.length) out.push(F('a fairness reader refused the ruling that stands (part ' + no.map(f => f.part).join(', ') + ': ' + String(no[0].note).slice(0, 120) + ') and another then confirmed it (part ' + yes.map(f => f.part).join(', ') + '): a refusal is answered by a new ruling, not by another reader'));
    return out;
  }],
  ['frame-words', 'What the case says in its own name, about either side, uses no wording that tilts the scale. The same fields of both sides are read. (A tripwire for known phrases, not a proof of even-handed prose.)', q => {
    const text = ownVoice(q);
    return RULES.own_voice_patterns.filter(f => new RegExp(f.re, 'i').test(text)).map(f => F('"' + (text.match(new RegExp(f.re, 'i')) || [''])[0].slice(0, 70) + '": ' + f.why));
  }],
  ['consensus-cited', 'A claim of consensus, of mass transmission or of what "most scholars" hold is itself a report: it is cited to a found quote that says so in its own words, and dissent was looked for.', q => {
    const text = ownVoice(q), re = new RegExp(RULES.consensus_patterns, 'i'), m = text.match(re);
    if (!m) return [];
    const ok = arr(q.consensus_claims).some(c => arr(c.evidence_ref).some(id => { const e = byId(q, id); return usable(e) && re.test(String(e.quote_en || '') + ' ' + String(e.quote_ar || '')); }) && counted(c.dissent_search).length >= 1 && words(c.dissent) >= 2);
    return ok ? [] : [F('"' + m[0] + '" is said in the case\'s own words without a consensus_claims entry: a found quote of someone who reports it in those terms, where dissent was searched for, and what was found')];
  }],
  ['dropped-shown', 'Sources that were dropped as unreadable or wrong are counted, and one side is not thinned more than the other.', q => {
    const d = arr(q.dropped), ev = arr(q.evidence), frac = side => { const k = d.filter(x => x.side === side).length, n = k + ev.filter(x => x.side === side).length; return n ? k / n : 0; };
    const gap = Math.abs(frac('claim') - frac('objection'));
    if (gap > RULES.dropped_gap && !arr(q.roadblocks).some(rb => rb.side === (frac('claim') > frac('objection') ? 'claim' : 'objection'))) return [F('one side lost ' + Math.round(100 * Math.max(frac('claim'), frac('objection'))) + '% of its sources as dropped and the other ' + Math.round(100 * Math.min(frac('claim'), frac('objection'))) + '%, with no roadblock recorded for them')];
    return [];
  }],
  ['provenance', 'Every part of the case is, byte for byte, what one agent of its own wrote, as the harness recorded it: the part\'s role is the role that agent was given, nobody wrote two parts, and nobody changed a part afterwards.', q => {
    const parts = arr(q.parts), p = q.provenance || {}, out = [];
    if (!parts.length) return [F('this case was not built from the parts of separate agents')];
    if (!arr(p.parts).length) return [F('who wrote the parts of this case has not been proven from the agents\' own records')];
    const writer = new Map();
    for (const part of parts) {
      const r = arr(p.parts).find(x => x.part === part.part);
      if (!r || r.sha1 !== part.sha1) out.push(F('part ' + part.part + ' was changed after its writer was proven, or was never proven'));
      else if (!r.agent) out.push(F('part ' + part.part + ' was not written by any agent in the record'));
      else if (r.writers > 1) out.push(F('part ' + part.part + ' was written by more than one agent'));
      else if (r.content_matches !== true) out.push(F('part ' + part.part + ' is not what its agent wrote: it was changed after the agent wrote it'));
      else if (r.label_matches !== true) out.push(F('part ' + part.part + ' was written by an agent that was given another task (' + String(r.label).slice(0, 40) + ')'));
      else if (writer.has(r.agent)) out.push(F('one agent wrote both ' + writer.get(r.agent) + ' and ' + part.part + ': each role must be an agent of its own'));
      else writer.set(r.agent, part.part);
    }
    // "The two advocates are equal" is a statement, so it is proven: the harness's record names the model each one ran on.
    const model = side => [...new Set(parts.filter(x => x.side === side && ['claim', 'objection', 'reply', 'counter'].includes(x.role)).map(x => (arr(p.parts).find(y => y.part === x.part) || {}).model).filter(Boolean))].sort().join(' + ');
    const mc = model('claim'), mo = model('objection');
    if (mc && mo && mc !== mo) out.push(F('the advocates of the two sides did not run on the same model (claim side: ' + mc + '; objection side: ' + mo + '): the two sides must be argued with equal strength'));
    return out;
  }],
];
const MORE = [['record-intact', 'The case file is exactly what the agents\' parts give when the case is built again.'], ['writers-proven', 'The agents\' own records were read again in this run, and no part an agent wrote is missing from the case.'], ['asked-covered', 'Every question that was asked is in the file.']];
const TOTAL = CHECKS.length + MORE.length;

// What is counted, for the lines the reader sees. Counts, never a score of truth.
function coverage(doc, qs) {
  const z = () => ({ confirmed: 0, false: 0, disputed: 0, unsupported: 0, needed: 0, aside: 0 });
  const c = { asked: arr(doc.asked).length || qs.length, covered: qs.length, quotes: 0, found: 0, by_side: { claim: 0, objection: 0 }, read: 0, readable: 0, readers_differ: 0, pairs: 0, pairs_ok: 0, points: 0, examined: 0, marks: { claim: z(), objection: z() }, links: 0, links_read: 0, named: 0, sourced: 0, dated: 0, own: 0, planted: 0, planted_caught: 0, roadblocks: 0, roadblocks_ok: 0, dropped: 0, dropped_claim: 0, dropped_objection: 0, others: 0, parts: 0, parts_proven: 0, reruns: 0, refused: 0, searches: 0, searches_proven: 0, leads: 0, stopped: [], last: [], gaps: 0, no_part: 0, judges: [] };
  for (const q of qs) {
    for (const e of arr(q.evidence)) {
      c.quotes++; if (found(e)) { c.found++; if (c.by_side[e.side] !== undefined) c.by_side[e.side]++; }
      if (e.kind !== 'quran') { c.readable++; if (e.cut === 'faithful' && words(e.cut_by) >= 2) c.read++; if (e.readers_disagree) c.readers_differ++; }
      if (e.kind !== 'quran' && words(e.quote_ar) && words(e.quote_en)) { c.pairs++; if ((e.translation_check || {}).agree === true) c.pairs_ok++; }
    }
    for (const x of arr(q.translator_tests)) { c.planted++; if (x.caught === true) c.planted_caught++; }
    const ids = new Set(arr(q.premises).map(p => p.id));
    for (const p of arr(q.points)) { c.points++; if (ids.has(p.id)) c.examined++; }
    for (const p of arr(q.premises)) { const m = c.marks[p.side]; if (!m) continue; if (m[p.status] !== undefined) m[p.status]++; if (p.needed) m.needed++; else m.aside++; if (p.status !== 'unsupported') for (const id of arr(p.rests_on)) { c.links++; if (arr(q.bearings).some(b => b.point === p.id && b.evidence === id)) c.links_read++; } }
    for (const t of arr(q.exchange)) { if (t.own_reasoning) c.own++; else { c.named++; if (t.faithful === true && arr(t.evidence_ref).length && arr(t.evidence_ref).every(id => usable(byId(q, id)))) c.sourced++; if (turnDate(q, t).state === 'sourced') c.dated++; } }
    for (const rb of arr(q.roadblocks)) { c.roadblocks++; if (!roadblockFaults(rb).length) c.roadblocks_ok++; }
    for (const d of arr(q.dropped)) { c.dropped++; if (d.side === 'objection') c.dropped_objection++; else c.dropped_claim++; }
    c.others += arr(q.other_objections).filter(Boolean).length;
    const pv = q.provenance || {};
    for (const part of arr(q.parts)) { c.parts++; if (arr(pv.parts).some(x => x.part === part.part && x.sha1 === part.sha1 && x.agent && x.content_matches === true)) c.parts_proven++; }
    c.reruns += Math.max(0, arr((q.verdict || {}).history).length - 1);
    c.refused += arr((q.verdict || {}).history).filter(h => arr(h.fairness).some(f => !f.confirmed)).length;
    for (const side of SIDES) c.gaps += unsaidGaps(q, side).length;
    c.no_part += arr(pv.started_no_part).length;
    // Parts the records show being written (in the folder or not), against the parts that are in the folder now.
    const known = typeof pv.parts_written === 'number';
    c.written = (c.written || 0) + (known ? pv.parts_written : arr(q.parts).length); c.in_folder = (c.in_folder || 0) + (known ? arr(pv.parts).length : arr(q.parts).length);
    // The models of the two judges whose rulings stand, as the agents' records name them.
    const jm = ['judge', 'judge2'].map(role => { const last = arr(q.parts).filter(p => p.role === role).pop(); return (last && (arr(pv.parts).find(x => x.part === last.part) || {}).model) || ''; });
    if (jm.some(Boolean)) c.judges.push(jm.map(m => m || 'not in the record').join(' and '));
    c.searches += pv.searches_listed || 0; c.searches_proven += (pv.searches_listed || 0) - arr(pv.unproven).length;
    const end = q.exchange_end || {}; c.leads += arr(end.leads).length; c.stopped.push(end.stopped_by || '?'); c.last.push(end.last_word || '?');
  }
  c.unaccounted = (c.quotes - c.found) + (c.roadblocks - c.roadblocks_ok);
  return c;
}
function coverageLines(c) {
  const m = s => 'confirmed ' + s.confirmed + ', false ' + s.false + ', disputed ' + s.disputed + ', unsupported ' + s.unsupported + ' (needed ' + s.needed + ', set aside ' + s.aside + ')';
  return [
    'SOURCES · quotes found word for word ' + c.found + ' of ' + c.quotes + ' (claim side ' + c.by_side.claim + ', objection side ' + c.by_side.objection + ') · read in context by another reader ' + c.read + ' of ' + c.readable + (c.readers_differ ? ' (readers differed on ' + c.readers_differ + ')' : '') + ' · original-and-English pairs confirmed by a neutral translator ' + c.pairs_ok + ' of ' + c.pairs + ' (' + (c.planted ? 'a wrong pair was planted among them ' + c.planted + ' time(s); the translator caught it ' + c.planted_caught + ' time(s)' : 'no wrong pair was planted to test the translator: the case was opened before that test') + ') · dropped as not found ' + c.dropped + ' (claim ' + c.dropped_claim + ', objection ' + c.dropped_objection + ') · roadblocks proven ' + c.roadblocks_ok + ' of ' + c.roadblocks + ' · specialists named and neither quoted nor declared a gap ' + c.gaps,
    'POINTS · raised ' + c.points + ', examined ' + c.examined + ' · claim: ' + m(c.marks.claim) + ' · objection: ' + m(c.marks.objection) + ' · links from a mark to a quote read by another reader ' + c.links_read + ' of ' + c.links,
    'EXCHANGE · named turns tied to a quote ' + c.sourced + ' of ' + c.named + ' (own reasoning: ' + c.own + ') · their dates as a library catalogue or the quote itself gives them ' + c.dated + ' of ' + c.named + ' (the rest are as their writer gave them) · ended: ' + [...new Set(c.stopped)].join(', ') + ' · last word: ' + [...new Set(c.last)].join(', ') + ' · published answers found and not yet on the table ' + c.leads + ' · other objections not weighed ' + c.others,
    'RECORD · asked ' + c.asked + ', covered ' + c.covered + ' · parts that are byte for byte what one agent wrote ' + c.parts_proven + ' of ' + c.parts + (c.written !== c.in_folder ? ' · parts written in the records ' + c.written + ', in the case ' + c.in_folder : '') + ' · searches listed that are in their writer\'s record ' + c.searches_proven + ' of ' + c.searches + ' (the rest are not counted) · judging run again ' + c.reruns + ' time(s)' + (c.refused ? ' (a fairness reader refused ' + c.refused + ' ruling(s))' : '') + ' · quotes or roadblocks unaccounted for ' + c.unaccounted + (c.no_part ? ' · agents given a part that wrote none ' + c.no_part : '') + (c.judges.length ? ' · judges: ' + [...new Set(c.judges)].join('; ') : ''),
  ];
}
const NOTE = 'These lines say the record is complete and was checked. They do not say the conclusion is true: that is for the reader of the reasoning to judge.';
const LABEL = { refuted: 'The objection fails: a point it needs is false', answered: 'The objection is answered: a point it needs could not be supported', 'objection-stands': 'The objection stands: a point the claim needs is false', 'claim-unsupported': 'The claim is not supported: a point it needs could not be supported', 'neither-holds': 'Neither side holds: each rests on a point that is false or unsupported', open: 'Open: the sides still differ on a point both have evidence for', 'not-determined': 'Not determined' };

function log(row) { try { fs.mkdirSync(DIR, { recursive: true }); fs.appendFileSync(path.join(DIR, 'log.jsonl'), JSON.stringify(Object.assign({ ts: new Date().toISOString() }, row)) + '\n'); } catch (e) { /* the result does not depend on the log */ } }
function run(doc, qs) {
  const results = qs.map(q => ({ id: q.id, findings: CHECKS.flatMap(([id, , fn]) => fn(q).map(f => Object.assign({ check: id }, f))) }));
  const missing = arr(doc.asked).filter(id => !qs.some(q => q.id === id));
  if (missing.length) results.push({ id: '(file)', findings: [Object.assign({ check: 'asked-covered' }, F('asked and not in the file: ' + missing.join(', ')))] });
  return results;
}
function openCase(target) {
  if (!target || target.startsWith('--')) fail('give the case folder or the case file');
  const isDir = fs.existsSync(target) && fs.statSync(target).isDirectory();
  const file = isDir ? path.join(target, 'case.json') : target;
  let doc, text; try { text = fs.readFileSync(file, 'utf8'); doc = JSON.parse(text); } catch (e) { fail('cannot read ' + file + ': ' + e.message); }
  const all = arr(doc.questions).length ? doc.questions : arr(doc.nodes);
  if (!all.length) fail('no "questions" or "nodes" list in ' + file);
  return { isDir, file, doc, text, all, dirs: isDir ? [target] : arr(doc.built_from) };
}

// The steps only the command line can take: read the sources again, build the case again from its parts, read the agents' records again.
async function examine() {
  const { file, doc, text, all, dirs } = openCase(process.argv[3]);
  const only = opt('only'), recorded = process.argv.includes('--recorded');
  let qs = only ? all.filter(q => String(q.id).startsWith(only)) : all;
  const i = process.argv.indexOf('--transcripts'), transcripts = i > 0 ? process.argv.slice(i + 1).filter(a => !a.startsWith('--')) : [];
  const extra = [], notes = [];
  const add = (id, check, t) => extra.push({ id, finding: Object.assign({ check }, F(t)) });
  const C = require(path.join(HOME, 'case.js'));
  const dirOf = q => dirs.find(d => { try { return JSON.parse(fs.readFileSync(path.join(d, 'question.json'), 'utf8')).id === q.id; } catch (e) { return false; } });
  if (transcripts.length) {
    const P = require(path.join(HOME, 'prove.js'));
    for (const q of qs) { const d = dirOf(q); if (d) C.applyProof(q, P.prove(d, transcripts, q)); }
    notes.push('the agents\' records were read again now');
    if (qs.some(q => (q.provenance || {}).moved === true)) notes.push('a case folder is not where its agents wrote it (it was moved or copied): its parts were matched by question id, part name and content');
  } else {
    notes.push('THE AGENTS\' RECORDS WERE NOT READ: who wrote what is not proven in this run');
    if (!TEST) for (const q of qs) add(q.id, 'writers-proven', 'the agents\' own records were not read in this run (--transcripts <folder>), so nothing here proves who wrote the parts or that the listed searches were made');
  }
  // A part an agent's record shows being written, and which is not in the folder now, was taken out of the case by somebody.
  for (const q of qs) { const gone = arr((q.provenance || {}).written_missing); if (gone.length) add(q.id, 'writers-proven', 'a part an agent wrote is no longer in the case: ' + gone.join(', ')); }
  // The question and the claim are what the agents were given when they worked, not what question.json says now.
  for (const q of qs) { const d = arr((q.provenance || {}).question_differs); if (d.length) add(q.id, 'writers-proven', 'the question or the claim in question.json is not what the agents were given (as the record of ' + d.slice(0, 3).join(', ') + (d.length > 3 ? ' and ' + (d.length - 3) + ' more' : '') + ' shows)'); }
  for (const q of qs) {
    const d = dirOf(q);
    if (!d) { add(q.id, 'record-intact', 'the parts this case was built from are not at hand, so it cannot be shown that the file is what the agents wrote'); continue; }
    const diff = C.intact(q, d, !!transcripts.length);
    if (diff.length) add(q.id, 'record-intact', 'the case file is not what its parts give; it differs in: ' + diff.join(', ') + ' (a case file is built by domain/mizan/case.js and never edited by hand)');
  }
  // What was asked is read from the list written when the case folders were made, not from the file being checked.
  const asked = new Set(arr(doc.asked)), listed = new Set(), own = new Set(), qtexts = [];
  for (const d of dirs) { try { for (const id of JSON.parse(fs.readFileSync(path.join(path.dirname(path.resolve(d)), 'asked.json'), 'utf8')).asked) { asked.add(id); listed.add(id); } } catch (e) { /* no list beside the folders */ } }
  for (const d of dirs) { try { const t = fs.readFileSync(path.join(d, 'question.json'), 'utf8'); qtexts.push(t); own.add(JSON.parse(t).id); } catch (e) { /* no question file */ } }
  // The file's own list of what was asked is written by the script from the folders and the list beside them: a name in it that
  // neither gives, or a folder's question it leaves out, was put there or taken out by hand.
  if (dirs.length && !only) { const odd = arr(doc.asked).filter(id => !listed.has(id) && !own.has(id)).concat([...own].filter(id => !arr(doc.asked).includes(id))); if (odd.length) add(qs[0].id, 'record-intact', 'the case file\'s list of what was asked is not what the case folders give; it differs in: ' + odd.join(', ')); }
  if (!recorded) {
    const V = require(path.join(HOME, 'verify.js'));
    const copy = JSON.parse(JSON.stringify({ questions: qs }));
    await V.verifyDoc(copy, {});
    qs.forEach((q, k) => {
      const now = copy.questions[k];
      for (const e of arr(q.evidence)) {
        const f = arr(now.evidence).find(x => x.id === e.id) || {}, a = e.check || {}, b = f.check || {};
        // Where the library's catalogue did not answer just now, what it says of the page (whose it is, which book, which printing)
        // was not read again: the record's own entries stand in for this run, and the checks that rest on them say they were not run.
        if (b.catalogue_unanswered === true) for (const k of ['attribution', 'named_in', 'naming', 'book', 'author', 'edition', 'collection']) { if (a[k] !== undefined) b[k] = a[k]; else delete b[k]; }
        if (found(e) && !found(f)) add(q.id, 'verbatim', 'read again just now, the source does not give the words of ' + e.id + ' (' + ['ar', 'en'].map(l => l + ': ' + (b[l] || '-')).join(', ') + ')');
        else if (found(e) && e.kind !== 'quran' && (a.before !== b.before || a.after !== b.after || a.attribution !== b.attribution || JSON.stringify(a.flags || []) !== JSON.stringify(b.flags || []) || JSON.stringify(a.skipped || []) !== JSON.stringify(b.skipped || []))) add(q.id, 'reading', 'what the record says stands around ' + e.id + ' is not what the page shows now: it must be read again');
      }
    });
    qs = copy.questions;   // every check below runs on what was read just now, not on what the file says was read
    notes.push('every source was read again now');
  } else notes.push('RECORDED ONLY: the sources were NOT read again; this is not a result');
  const results = run(only ? Object.assign({}, doc, { asked: [] }) : Object.assign({}, doc, { asked: [...asked] }), qs);
  for (const x of extra) { let r = results.find(y => y.id === x.id); if (!r) { r = { id: x.id, findings: [] }; results.push(r); } r.findings.push(x.finding); }
  const failed = results.filter(r => r.findings.some(f => f.level === 'FAIL')).length;
  const warns = results.reduce((c, r) => c + r.findings.filter(f => f.level === 'WARN').length, 0);
  const sha = crypto.createHash('sha1').update(text).digest('hex').slice(0, 10);
  // The question files are named beside the case file: the claim that was asked is in them, and they are not part of the case file's own hash.
  const qsha = qtexts.length ? crypto.createHash('sha1').update(qtexts.join('\n')).digest('hex').slice(0, 10) : '';
  // Checks that could not be run because a library did not answer: not failures of the record, and not passes.
  const unrun = results.reduce((c, r) => c + new Set(r.findings.filter(f => f.level === 'UNRUN' && !r.findings.some(g => g.level === 'FAIL' && g.check === f.check)).map(f => f.check)).size, 0);
  return { file, doc: Object.assign({}, doc, { asked: [...asked] }), qs, results, failed, warns, notes, sha, qsha, unrun, only, bad: failed > 0 || unrun > 0 || !!only || (recorded && !TEST), cov: coverage(Object.assign({}, doc, { asked: [...asked] }), qs) };
}
const headline = x => 'MIZAN' + (x.only ? ' (SUBSET, not a result for the whole file)' : '') + ': ' + path.basename(path.dirname(x.file)) + '/' + path.basename(x.file) + ' · file ' + x.sha + (x.qsha ? ' · question ' + x.qsha : '') + ' · checked ' + TODAY() + ' · ' + x.notes.join(' · ');
const NOT_RUN = n => n + ' check(s) could not be run because a library did not answer: run again';
// The second line: all pass, or how many questions fail, or (nothing failing) that some checks could not be run at all.
const verdictLine = (x, failing) => (x.failed ? x.failed + failing : x.unrun ? 'NOT YET A RESULT' : 'ALL CHECKS PASS') + (x.unrun ? ' · ' + NOT_RUN(x.unrun) : '');
// How many of the checks one question fails, and how many could not be run for it (a check that fails is counted as failing only).
const checksOf = (x, q, level) => new Set((x.results.find(y => y.id === q.id) || { findings: [] }).findings.filter(f => f.level === level).map(f => f.check));
const failsOf = (x, q) => checksOf(x, q, 'FAIL').size;
const unrunOf = (x, q) => { const failing = checksOf(x, q, 'FAIL'); return [...checksOf(x, q, 'UNRUN')].filter(c => !failing.has(c)).length; };
// One line per question: how many of the checks it passes, and the outcome the marks give. While a check fails, no outcome is given.
const perQuestion = x => x.qs.map(q => { const bad = failsOf(x, q), un = unrunOf(x, q), o = outcome(q); return q.id + ' · ' + (TOTAL - bad - un) + ' of ' + TOTAL + ' checks pass · ' + (un ? NOT_RUN(un) + ' · ' : '') + (bad ? 'outcome withheld while ' + bad + ' check(s) fail (by the marks so far: ' + o.final + ')' : un ? 'outcome withheld until they are run (by the marks so far: ' + o.final + ')' : 'outcome by the marks: ' + o.final + (o.caps.length ? ' (the first judge\'s marks give "' + o.first + '"' + (o.second ? ', the second judge\'s "' + o.second + '"' : '') + ')' : '')); });

const JUDGE_CHECKS = ['equal-burden', 'crux-named', 'reasoning-shown', 'current', 'scope', 'frame-words', 'consensus-cited', 'premise-coverage', 'premises-proven', 'verdict-fresh'];
async function cmdCheck() {
  const x = await examine(), perCheck = {};
  for (const r of x.results) for (const f of r.findings) if (f.level === 'FAIL') perCheck[f.check] = (perCheck[f.check] || 0) + 1;
  log({ cmd: 'check', file: x.file, sha: x.sha, questions: x.qs.length, failed: x.failed, warns: x.warns, coverage: x.cov, per_check: perCheck, subset: !!x.only, notes: x.notes });
  // For the judge while he writes (--blind): only what the checks say about his own verdict and marks. Nothing here shows the
  // second judge's marks, whether the two agree, or the outcome that would be published.
  if (process.argv.includes('--blind')) {
    const lines = []; for (const r of x.results) for (const f of r.findings) if (f.level === 'FAIL' && JUDGE_CHECKS.includes(f.check)) lines.push('FAIL ' + r.id + ' | ' + f.check + ' | ' + f.text);
    process.stdout.write(['MIZAN CHECK FOR THE JUDGE (his own verdict and marks only): ' + lines.length + ' line(s)'].concat(lines).join('\n') + '\n');
    process.exitCode = lines.length ? 1 : 0; return;
  }
  if (process.argv.includes('--json')) process.stdout.write(JSON.stringify({ questions: x.qs.length, failed: x.failed, warns: x.warns, subset: !!x.only, notes: x.notes, coverage: x.cov, outcomes: x.qs.map(q => Object.assign({ id: q.id }, outcome(q))), results: x.results }, null, 1) + '\n');
  else {
    const out = [headline(x), verdictLine(x, ' QUESTION(S) FAIL') + ' · ' + x.warns + ' warning(s)'].concat(perQuestion(x), coverageLines(x.cov), [NOTE]);
    for (const r of x.results) for (const f of r.findings) out.push((f.level === 'UNRUN' ? 'NOT RUN' : f.level) + ' ' + r.id + ' | ' + f.check + ' | ' + f.text);
    process.stdout.write(out.join('\n') + '\n');
  }
  process.exitCode = x.bad ? 1 : 0;
}
function cmdChecks() {
  process.stdout.write(['MIZAN: ' + TOTAL + ' checks'].concat(CHECKS.concat(MORE).map(([id, means]) => id + ' — ' + means)).join('\n') + '\n');
}
// What the marks give, without reading any source: for the judge while he writes, and for a quick look.
function cmdOutcome() {
  const { all } = openCase(process.argv[3]), blind = process.argv.includes('--blind');
  // For the judge while he writes (--blind): what HIS marks give, and nothing of the second judge's marks or of whether the two agree.
  if (blind) { for (const q of all) { const o = outcome(q); process.stdout.write('MIZAN OUTCOME ' + q.id + ' (the judge\'s own marks only): "' + o.first + '"\n  turns on: ' + (decisive(q, o.first).map(p => '[' + p.id + '] ' + p.text).join(' | ') || '-') + '\n'); } return; }
  for (const q of all) { const o = outcome(q); process.stdout.write('MIZAN OUTCOME ' + q.id + ': by the first judge\'s marks "' + o.first + '"' + (o.second ? ' · by the second judge\'s "' + o.second + '"' : '') + ' · published outcome: ' + o.final + '\n' + o.caps.map(c => '  in the way: ' + c).join('\n') + (o.caps.length ? '\n' : '') + '  turns on: ' + (decisive(q, o.first).map(p => '[' + p.id + '] ' + p.text).join(' | ') || '-') + '\n'); }
}
// One search of a roadblock, as the reader sees it: where, for what, what the searcher wrote of it, and whether the record shows it got an answer.
const tried = a => a.where + ' ("' + a.query + '": ' + a.result + ')' + (/^FAILED: /.test(a.result_seen || '') ? ' [made; it got no answer]' : /^DIFFERS: /.test(a.result_seen || '') ? ' [made; the result written here is not what came back]' : a.proved_by === '' ? ' [NOT in the searcher\'s record]' : '');
// The report is printed from the case, after the same examination, so nothing reaches the reader that the checks did not see.
async function cmdRender() {
  const x = await examine(), out = [];
  for (const q of x.qs) {
    const v = q.verdict || {}, o = outcome(q), end = q.exchange_end || {}, quote = id => { const e = byId(q, id) || {}; return e.quote_en || e.quote_ar || ''; };
    // While a check fails there is no result: the heading says so, and the judge's short conclusion is not printed as where the question stands.
    const fails = failsOf(x, q), un = unrunOf(x, q), bad = fails + un, short = bad ? '' : (v.short || '');
    out.push('## ' + q.id + '. ' + q.question, '', bad ? '**Not yet a result (' + (v.as_of || '?') + '): ' + (fails ? fails + ' check(s) fail' : NOT_RUN(un)) + '.** By the marks so far: ' + LABEL[o.final] + '.' : '**Where it stands (' + (v.as_of || '?') + '): ' + LABEL[o.final] + '.**' + (o.caps.length ? '' : ' ' + short), '');
    if (o.caps.length) { out.push('A firm outcome is not given, because:'); for (const c of o.caps) out.push('- ' + c); out.push('', 'On the first judge\'s own marks the outcome would be: ' + LABEL[o.first] + (o.second && o.second !== o.first ? '. On the second judge\'s: ' + LABEL[o.second] : '') + '. ' + short, ''); }
    for (const c of arr(o.notes)) out.push('- Both judges reach this outcome. Beside it: ' + c);
    { const hist = arr(v.history); hist.forEach((h, i) => { for (const f of arr(h.fairness).filter(f => !f.confirmed)) out.push('- A fairness reader did not confirm ' + (i === hist.length - 1 ? 'this ruling' : 'an earlier ruling (part ' + h.part + '), and the judges then ruled again') + ': ' + f.note); }); }
    if (v.crux) out.push('- The point it turns on: ' + v.crux);
    if (words(v.scope_change) && !/^none\.?$/i.test(String(v.scope_change).trim())) out.push('- The claim that was weighed is not the claim as asked: ' + v.scope_change);
    for (const c of arr(v.claim_corrections).filter(Boolean)) out.push('- Correction to the claim as commonly told: ' + c);
    for (const c of arr(v.objection_corrections).filter(Boolean)) out.push('- Correction to the objection as commonly told: ' + c);
    for (const a of arr(v.claim_assumptions).filter(Boolean)) out.push('- The claim assumes: ' + a);
    for (const a of arr(v.objection_assumptions).filter(Boolean)) out.push('- The objection assumes: ' + a);
    if (v.would_change) out.push('- What would change this: ' + v.would_change);
    if (v.not_shown) out.push('- What this does not show: ' + v.not_shown);
    out.push('', '**The claim as asked:** ' + ((q.claim || {}).as_given || ''), '**The objection (' + ((q.objection || {}).by || '?') + '):** ' + ((q.objection || {}).text || ''), '', v.reasoning || '', '', '| Side | Needed | Point | First judge | Second judge | Fact-checker | Level of evidence | On which quotes |', '|---|---|---|---|---|---|---|---|');
    const mine = new Map(arr((v.second_opinion || {}).premises).map(p => [p.id, p.status]));
    for (const p of arr(q.premises)) out.push('| ' + p.side + ' | ' + (p.needed ? 'yes' : 'no') + ' | [' + p.id + '] ' + String(p.text).replace(/\|/g, '/') + ' | ' + p.status + ' | ' + (mine.get(p.id) || '-') + ' | ' + (p.checker_status || '-') + ' | ' + (p.level || '') + ' | ' + (arr(p.rests_on).join(', ') || String(p.why || '').replace(/\|/g, '/')) + ' |');
    out.push('', '**The exchange** (ended: ' + (end.stopped_by || '?') + '; last word: the ' + (end.last_word || '?') + ' side' + (arr(end.leads).length ? '; found and not yet on the table: ' + end.leads.join(' / ') : '') + ')', '');
    arr(q.exchange).forEach((t, k) => out.push((k + 1) + '. ' + (t.side === 'claim' ? 'For the claim' : 'For the objection') + ' — ' + t.who + (t.when ? ' (' + t.when + ')' : '') + ': ' + t.text + (t.own_reasoning ? '' : arr(t.evidence_ref).map(id => '\n   > ' + id + ': "' + quote(id) + '"').join(''))));
    out.push('', '| Quote | Side | Who, where, which edition | His words | Read at |', '|---|---|---|---|---|');
    for (const e of arr(q.evidence).filter(found)) out.push('| ' + e.id + ' | ' + e.side + ' | ' + [e.who + (e.on_page_as ? ' (' + [].concat(e.on_page_as).join(', ') + ')' : ''), e.work, e.ref, (e.check || {}).edition || e.edition].filter(Boolean).join(', ') + (e.via && e.via.who ? ' (as quoted by ' + e.via.who + ')' : '') + (usable(e) ? '' : ' [carries no weight: ' + (weakHadith(e) ? 'graded weak' : e.cut !== 'faithful' ? 'cut against its meaning' : 'not tied to its author') + ']') + ' | ' + [e.quote_ar, e.quote_en ? (e.translated_by_map ? '[our translation] ' : '') + e.quote_en : ''].filter(Boolean).join(' — ').replace(/\|/g, '/') + ' | ' + (e.url || e.check_url_ar || e.check_url_en) + ' |');
    for (const rb of arr(q.roadblocks)) out.push('', '> ROADBLOCK (' + rb.side + ' side): ' + rb.statement + ' Its standing, in the words of ' + ((rb.reported_by || {}).standing_url || '?') + ': "' + ((rb.reported_by || {}).standing_quote || '') + '". Searched: ' + arr(rb.attempts).map(tried).join('; ') + '. Searched again by a second searcher: ' + arr((rb.second_search || {}).attempts).map(tried).join('; ') + '. ' + (rb.search_proof ? 'From the agents\' own records: all ' + rb.search_proof.first_proved + ' and ' + rb.search_proof.second_proved + ' of these searches were made; ' + rb.search_proof.first_answered + ' and ' + rb.search_proof.second_answered + ' of them were different searches that came back with an answer (the others were refused by the site or returned an error, and are marked). ' : '') + 'The script\'s own search of the libraries for the words sought: ' + ((rb.machine_search || {}).engines ? rb.machine_search.engines.map(e => e.name + ' ' + e.hits + ' hit(s)').join(', ') : 'no words to search for') + '.');
    for (const ot of arr(q.other_objections).filter(Boolean)) out.push('', '- Not weighed here: ' + ot);
    out.push('');
  }
  out.push(headline(x), verdictLine(x, ' QUESTION(S) FAIL THE CHECKS: this report is not ready'));
  process.stdout.write(out.concat(perQuestion(x), coverageLines(x.cov), [NOTE]).join('\n') + '\n');
  process.exitCode = x.bad ? 1 : 0;
}
function cmdLesson() {
  const text = opt('text'), evidence = opt('evidence');
  if (words(text) < 4 || words(evidence) < 4) fail('usage: node lib/mizan.js lesson --text "<what went wrong>" --evidence "<the case>"');
  fs.mkdirSync(DIR, { recursive: true });
  fs.appendFileSync(path.join(DIR, 'lessons.jsonl'), JSON.stringify({ date: localDay(new Date()), text, evidence }) + '\n');
  process.stdout.write('MIZAN: lesson stored\n');
}
function cmdLessons() {
  const f = path.join(DIR, 'lessons.jsonl');
  const rows = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  process.stdout.write(['MIZAN: ' + rows.length + ' lesson(s)'].concat(rows.map(r => r.date + ' | ' + r.text + ' | ' + r.evidence)).join('\n') + '\n');
}

module.exports = { sign, signRb, found, usable, speaks, evidenceHash, banned, primary, hostsIn, RULES, CHECKS, TOTAL, coverage, coverageLines, roadblockFaults, outcome, rule, decisive, OUTCOMES, GROUND_RULES };
if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'check') cmdCheck();
  else if (cmd === 'checks') cmdChecks();
  else if (cmd === 'render') cmdRender();
  else if (cmd === 'outcome') cmdOutcome();
  else if (cmd === 'lesson') cmdLesson();
  else if (cmd === 'lessons') cmdLessons();
  else fail('usage: node lib/mizan.js <checks|check|render|outcome|lesson|lessons> ...');
}
