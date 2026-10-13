#!/usr/bin/env node
// mizan case — keeps the case file of one question.
// Every agent of the loop writes ONE part file of its own (parts/<number>-<role>.json) and nothing else. This script builds the case
// from the parts, so no agent copies another agent's words, and no agent can certify its own work:
//   - a part's role is the one in its FILE NAME; what the file says inside must agree, and each role may carry only its own kind of entry
//   - whatever a part says about "verified", "read", "translated" or "checked" for its own material is thrown away
//   - a later part never erases an earlier finding: every reading, every mark and every verdict is kept, and where two readers
//     differ the stricter reading stands
//   node domain/mizan/case.js new <folder> <questions.json>      one folder per question (question.json, parts/) and the list of what was asked
//   node domain/mizan/case.js build <case folder> [--part <name>] [--full] [--final]
//        build case.json, view.md, view-blind.md and view-translate.md from the parts; read the sources for what is new; print what is wrong
//   node domain/mizan/case.js join <out.json> <case folder> [<case folder> ...]     one file for several questions
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const M = require(path.join(__dirname, '..', '..', 'lib', 'mizan.js'));
const V = require(path.join(__dirname, 'verify.js'));

const SIDES = ['claim', 'objection'];
const arr = v => (Array.isArray(v) ? v : []);
const str = v => (typeof v === 'string' ? v.trim() : '');
const sha = t => crypto.createHash('sha1').update(t).digest('hex').slice(0, 16);
const rec = a => ({ where: str(a && a.where), query: str(a && a.query), result: str(a && a.result), url: str(a && a.url) });
const recOf = part => a => Object.assign(rec(a), { part });   // a search record remembers which part listed it, so it can be looked up in that writer's record
const pick = (o, keys) => { const out = {}; for (const k of keys) if (o && o[k] !== undefined) out[k] = o[k]; return out; };
const EVIDENCE_FIELDS = ['kind', 'who', 'work', 'ref', 'edition', 'work_date', 'on_page_as', 'quote_ar', 'check_url_ar', 'context_ar', 'quote_en', 'check_url_en', 'context_en', 'translated_by_map', 'translator', 'via', 'url', 'grade', 'graded_by', 'use', 'supports', 'derives_from'];
const ROADBLOCK_FIELDS = ['sought', 'sought_phrase', 'sought_phrase_unknown', 'who', 'barrier', 'reported_by', 'reported_quote_ar', 'check_url_ar', 'reported_quote_en', 'check_url_en', 'statement'];
const VERDICT_FIELDS = ['outcome', 'crux', 'short', 'reasoning', 'claim_assumptions', 'objection_assumptions', 'claim_corrections', 'objection_corrections', 'scope_change', 'as_of', 'would_change', 'not_shown', 'evidence_hash'];
const ROLE_NAME = { claim: 'claim advocate', objection: 'objection advocate', reply: 'claim advocate', counter: 'objection advocate', extract: 'neutral extractor', check: 'neutral fact-checker', read: 'context reader', translate: 'translator', stop: 'completeness reader', second: 'second searcher', judge: 'judge', judge2: 'second judge', swap: 'swap reader' };
// The level of evidence in the scale's own words, whichever short form a marker wrote.
const LEVEL = l => { const s = String(l || '').toLowerCase(); return /many/.test(s) ? 'many independent carriers' : /several/.test(s) ? 'several independent reports' : /document/.test(s) ? 'a contemporary document' : /one report|^one$|single/.test(s) ? 'one report' : /infer/.test(s) ? 'inference' : /bare|possib/.test(s) ? 'bare possibility' : /not applicable|^n.?a$/.test(s) ? 'not applicable' : String(l || ''); };
const SIDE_OF = { claim: 'claim', reply: 'claim', objection: 'objection', counter: 'objection' };
// What each role's part may carry. Anything else in a part is ignored and reported.
const MAY = {
  evidence: ['claim', 'objection', 'reply', 'counter', 'check', 'second'], roadblocks: ['claim', 'objection', 'reply', 'counter', 'check'],
  points: ['claim', 'objection', 'reply', 'counter', 'extract', 'check'], needs: ['extract', 'check'], turns: ['reply', 'counter'],
  searched: ['claim', 'objection', 'reply', 'counter', 'check'], readings: ['read'], later: ['read'], turn_checks: ['read'], bearings: ['read'],
  translations: ['translate'], premises: ['check', 'judge'], looked_for_more: ['stop'], leads: ['stop'], second: ['second'],
  verdict: ['judge'], swap_test: ['judge'], consensus_claims: ['judge'], second_opinion: ['judge2'], swap: ['swap'],
};

function readParts(dir) {
  const pdir = path.join(dir, 'parts'), parts = [], problems = [];
  for (const file of (fs.existsSync(pdir) ? fs.readdirSync(pdir) : []).filter(f => /^\d+-[\w-]+\.json$/.test(f)).sort((x, y) => parseInt(x, 10) - parseInt(y, 10) || x.localeCompare(y))) {
    const text = fs.readFileSync(path.join(pdir, file), 'utf8'), name = file.replace(/\.json$/, ''), role = name.replace(/^\d+-/, '');
    let p; try { p = JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text); } catch (e) { problems.push({ part: name, text: 'the part is not valid JSON: ' + e.message.slice(0, 80) }); continue; }
    // The role is the one in the file name, because that is the task the harness gave its writer.
    if (!ROLE_NAME[role]) { problems.push({ part: name, text: 'the file name does not end in a known role' }); continue; }
    if (p.role !== role) { problems.push({ part: name, text: 'the part calls itself "' + p.role + '" but its file is a "' + role + '" part; it is left out' }); continue; }
    if (p.side && SIDE_OF[role] && p.side !== SIDE_OF[role]) { problems.push({ part: name, text: 'a "' + role + '" part speaks for the ' + SIDE_OF[role] + ' side, not the ' + p.side + ' side; it is left out' }); continue; }
    for (const k of Object.keys(MAY)) if (p[k] !== undefined && !MAY[k].includes(role) && !(Array.isArray(p[k]) && !p[k].length)) problems.push({ part: name, text: 'a "' + role + '" part may not carry "' + k + '"; it is ignored' });
    parts.push({ name, role, seq: /^(\d+)/.exec(name)[1], sha1: sha(text), p });
  }
  return { parts, problems };
}
const may = (role, k) => MAY[k].includes(role);

// Builds the case of one question from its parts. Nothing here reads the network.
function assemble(dir) {
  const Q = JSON.parse(fs.readFileSync(path.join(dir, 'question.json'), 'utf8'));
  const { parts, problems } = readParts(dir);
  const q = {
    id: Q.id, question: Q.question, plain: Q.plain || '', sides: Q.sides || {}, claim: { as_given: Q.claim, text: Q.claim, short: '', candidates: [] }, objection: {},
    points: [], evidence: [], bearings: [], exchange: [], exchange_end: { looked_for_more: [], leads: [], declined: {} }, searched: { claim_side: [], objection_side: [] }, premises: [],
    roadblocks: [], dissolved: [], dropped: [], other_objections: [], other_objections_searched: [], consensus_claims: [], swap_test: {}, verdict: {}, latest: {}, parts: [],
    rules: Number(Q.rules) || 0, translator_tests: [],
  };
  const marks = new Map(), needs = new Map(), verdicts = [];
  let confirmedStop = null, second = null, lateTurn = false;
  const warn = (part, text) => problems.push({ part, text });
  for (const { name, role, seq, sha1, p } of parts) {
    const by = ROLE_NAME[role] + ' (part ' + name + ')', own = SIDE_OF[role] || '';
    q.parts.push({ part: name, role, side: own, sha1 });
    const ref = r => { const m = /^new:(\d+)$/.exec(String(r)); return m ? 'E' + seq + '-' + m[1] : String(r); };

    if (may(role, 'evidence')) arr(p.evidence).forEach((raw, i) => {
      const side = own || raw.side;
      if (!SIDES.includes(side)) return warn(name, 'evidence item ' + (i + 1) + ' has no side (claim or objection)');
      const it = Object.assign({ id: 'E' + seq + '-' + (i + 1), side, gathered_by: name }, pick(raw, EVIDENCE_FIELDS));
      if (typeof it.via === 'string') it.via = it.via.trim() ? { who: it.via.trim() } : undefined;
      if (it.via && !str(it.via.who)) delete it.via;
      // A quote given again (repaired) takes the place and the id of the one it replaces, so what points to it still does;
      // but whatever was read about the old wording is forgotten and must be read again.
      const k = raw.replaces ? q.evidence.findIndex(e => e.id === raw.replaces && e.side === side) : -1;
      if (k >= 0) {
        it.id = raw.replaces; it.replaces_part = q.evidence[k].gathered_by;
        q.evidence.splice(k, 1, it);
        q.bearings = q.bearings.filter(b => b.evidence !== it.id);
        for (const t of q.exchange) if (t.evidence_ref.includes(it.id)) t.checks = [];
        return;
      }
      q.evidence.push(it);
    });
    if (may(role, 'roadblocks')) arr(p.roadblocks).forEach((raw, i) => {
      const side = own || raw.side;
      if (!SIDES.includes(side)) return warn(name, 'roadblock ' + (i + 1) + ' has no side');
      const rb = Object.assign({ id: 'R' + seq + '-' + (i + 1), side, part: name, attempts: arr(raw.attempts).map(rec) }, pick(raw, ROADBLOCK_FIELDS));
      // A roadblock declared again by a later part of the same side takes the place of the earlier one (its searches are then that later writer's own).
      const k = raw.replaces ? q.roadblocks.findIndex(r => r.id === raw.replaces && r.side === side) : -1;
      if (k >= 0) { rb.replaces = raw.replaces; q.roadblocks.splice(k, 1, rb); } else q.roadblocks.push(rb);
    });
    // An advocate raises points for his own side only. A point for either side can come from a neutral reader.
    if (may(role, 'points')) for (const pt of arr(p.points)) {
      const side = own || pt.side;
      if (!str(pt.id) || !str(pt.text) || !SIDES.includes(side)) { warn(name, 'a point needs an id, a text and a side'); continue; }
      if (q.points.some(x => x.id === pt.id)) { warn(name, 'the point id ' + pt.id + ' is already used; choose another'); continue; }
      q.points.push({ id: pt.id, side, text: pt.text.trim(), from: ROLE_NAME[role], part: name });
    }
    // Which points an argument needs is said by neutral readers. Where two of them differ, the point counts as needed and the difference is kept.
    if (may(role, 'needs')) for (const n of arr(p.needs)) {
      if (typeof n.needed !== 'boolean') continue;
      const had = needs.get(n.id);
      if (role === 'check' && had) continue;                      // the fact-checker speaks only for points no neutral reader has judged
      if (!had) needs.set(n.id, { needed: n.needed, bears_on: str(n.bears_on), not_needed_because: str(n.not_needed_because), needs_by: [name] });
      else { had.needs_by.push(name); if (had.needed !== n.needed) { had.needs_differ = true; had.needed = true; } if (n.needed && !had.bears_on) had.bears_on = str(n.bears_on); }
    }
    if (may(role, 'searched')) for (const s of arr(p.searched)) { const side = own || s.side; if (SIDES.includes(side)) q.searched[side + '_side'].push(recOf(name)(s)); }
    if (may(role, 'turns')) arr(p.turns).forEach(t => {
      // A turn given again by its own side ("replaces_turn": its number) corrects the one it names: it keeps its place and number,
      // takes over whatever the correction does not give, forgets what a reader found about the old wording, and keeps the old
      // wording beside it. A turn the other side has already answered may be corrected in its name, date and quote only: its
      // words stay as they were answered.
      if (t.replaces_turn !== undefined) {
        const k = Number(t.replaces_turn) - 1, old = q.exchange[k];
        if (!old || old.side !== own) return warn(name, 'replaces_turn must be the number of a turn of your own side, as view.md shows it');
        if (old.own_reasoning) return warn(name, 'turn ' + (k + 1) + ' is own reasoning: it has no name, date or quote to correct');
        const text = str(t.text) || old.text, answered = q.exchange.slice(k + 1).some(x => x.side !== own);
        if (answered && V.norm(text) !== V.norm(old.text)) return warn(name, 'turn ' + (k + 1) + ' has already been answered by the other side: its words stay as they were answered; only its name, date or quote may be corrected');
        if (V.norm(text) !== V.norm(old.text)) lateTurn = true;   // new words: the neutral search has not seen them
        q.exchange.splice(k, 1, { side: own, who: str(t.who) || old.who, when: str(t.when) || old.when, text, evidence_ref: arr(t.evidence_ref).length ? arr(t.evidence_ref).map(ref) : old.evidence_ref, own_reasoning: false, part: name, checks: [], earlier: arr(old.earlier).concat([{ part: old.part, who: old.who, when: old.when, text: old.text, evidence_ref: old.evidence_ref }]) });
        return;
      }
      // A repair was told the exchange is closed: it corrects a turn, it does not add one.
      if (p.repair === true) return warn(name, 'a repair may carry a turn only as a correction ("replaces_turn"); the turn it adds is left out');
      const mine = t.own_reasoning === true;
      lateTurn = true;   // a turn the last neutral search has not seen, until a newer one has looked
      q.exchange.push({ side: own, who: mine ? 'The map (own reasoning, for the ' + own + ' side)' : str(t.who), when: str(t.when), text: str(t.text), evidence_ref: mine ? [] : arr(t.evidence_ref).map(ref), own_reasoning: mine, part: name, checks: [] });
    });
    // A side that was given a turn and said it has nothing to add has had its turn: the exchange does not end on words it never saw.
    // (A repair gives a turn or a quote again, or says it is a repair: its writer was told the exchange is closed, so it is not this.) Parts come in order, so the latest one stands.
    if (may(role, 'turns') && p.nothing_new === true && p.repair !== true && !arr(p.turns).length && !arr(p.points).length && !arr(p.evidence).length) q.exchange_end.declined[own] = name;
    if (role === 'claim') { if (str(p.position)) q.claim.text = str(p.position); q.claim.short = str(p.short); q.claim.overstated = arr(p.overstated); q.claim.candidates = arr(p.candidates); q.latest.claim = str(p.latest); }
    if (role === 'reply' && arr(p.candidates).length && !q.claim.candidates.length) q.claim.candidates = arr(p.candidates);
    if (role === 'objection') { q.objection = { name: str(p.name), by: str(p.by), text: str(p.text), candidates: arr(p.candidates) }; q.other_objections = arr(p.other_objections).map(str).filter(Boolean); q.other_objections_searched = arr(p.other_objections_searched).map(recOf(name)); q.latest.objection = str(p.latest); }
    if (role === 'read') {
      for (const s of arr(p.readings)) { const e = q.evidence.find(x => x.id === s.evidence_id); if (e) (e.readings = e.readings || []).push({ part: name, cut: str(s.cut), stance: str(s.stance), who_matches: s.who_matches === true, note: str(s.note) }); }
      for (const l of arr(p.later)) { const e = q.evidence.find(x => x.id === l.evidence_id); if (e) { e.later_position = { searched: arr(l.searched).map(recOf(name)), result: str(l.result), note: str(l.note) }; if (l.result === 'revised') e.superseded = true; } }
      for (const f of arr(p.turn_checks)) { const t = q.exchange[f.turn - 1]; if (t && !t.own_reasoning) t.checks.push({ part: name, faithful: f.faithful === true, note: str(f.note) }); }
      // A reader says whether a quote bears on a point, and copies the very words of the quote that do.
      for (const b of arr(p.bearings)) {
        const e = q.evidence.find(x => x.id === ref(b.evidence_id)), w = V.norm(b.words);
        if (!e || !q.points.some(x => x.id === b.point_id) || !['supports', 'contradicts', 'none'].includes(b.bears)) { warn(name, 'a bearing needs a known point, a known quote and supports | contradicts | none'); continue; }
        // Under the newer rules a bearing also says what it rests on: the quote's words, its silence, or a possibility it only raises.
        const ground = q.rules >= GROUND_RULES && b.bears !== 'none' ? str(b.ground) : '';
        if (q.rules >= GROUND_RULES && b.bears !== 'none' && !['words', 'silence', 'possibility'].includes(ground)) { warn(name, 'the bearing of ' + e.id + ' on point ' + b.point_id + ' does not say what it rests on ("ground": "words", "silence" or "possibility"); the bearing is left out'); continue; }
        if (ground === 'silence') { q.bearings.push({ point: b.point_id, evidence: e.id, bears: b.bears, words: '', note: str(b.note), part: name, ground }); continue; }   // silence has no words to copy
        if (b.bears !== 'none' && (w.split(' ').length < Math.min(M.RULES.min_bearing_words, V.norm(e.quote_ar || e.quote_en).split(' ').length) || !(' ' + V.norm(e.quote_ar) + ' ' + V.norm(e.quote_en) + ' ').includes(' ' + w + ' '))) { warn(name, 'the words given for ' + e.id + ' on point ' + b.point_id + ' are not words of that quote; the bearing is left out'); continue; }
        q.bearings.push(Object.assign({ point: b.point_id, evidence: e.id, bears: b.bears, words: str(b.words), note: str(b.note), part: name }, ground ? { ground } : {}));
      }
    }
    // The translator is tested: among the pairs he is given stands one the script planted (the Arabic of one passage beside the
    // English of another). A translator who agrees to it is not reading: none of his agreements is taken, the test is kept in the
    // record, and the pairs stay to be checked by another translator.
    const plant = role === 'translate' && q.rules >= PLANT_RULES ? planted(q) : null;
    if (role === 'translate' && q.rules >= PLANT_RULES) {
      const ans = plant && arr(p.translations).find(t => t.evidence_id === plant.id), real = arr(p.translations).some(t => q.evidence.some(e => e.id === t.evidence_id));
      if (plant && (ans || real)) {
        const caught = !!ans && ans.agree === false;
        q.translator_tests.push({ part: name, id: plant.id, arabic_of: plant.of, english_of: plant.english_of, answered: !!ans, caught });
        if (!caught) { warn(name, 'the translator ' + (ans ? 'agreed to' : 'did not answer') + ' the pair the script planted (' + plant.id + ': the Arabic of ' + plant.of + ' beside the English of ' + plant.english_of + '); none of his agreements is taken, and another translator must check these pairs'); continue; }
      }
    }
    if (role === 'translate') for (const t of arr(p.translations)) {
      if (plant && t.evidence_id === plant.id) continue;        // the answer to the test, whatever real quote carries that id
      const e = q.evidence.find(x => x.id === t.evidence_id);
      if (!e || !str(e.quote_ar) || !str(e.quote_en) || !str(t.own_translation)) continue;
      // The translator took no side and worked from the original alone. Where he differs from the gatherer's own English, his wording
      // replaces it; a PUBLISHED English text is never rewritten: it is marked as not saying what the original says.
      const agree = t.agree === true, replace = !agree && e.translated_by_map === true;
      if (replace) { e.first_translation = e.quote_en; e.quote_en = str(t.own_translation); }
      const earlier = (e.translation_check || {}).agree === false && !e.translated_by_map;
      e.translation_check = { agree: (agree || replace) && !earlier, by, own_translation: str(t.own_translation), replaced: replace, note: str(t.note), hash: crypto.createHash('sha1').update(String(e.quote_ar) + '|' + String(e.quote_en)).digest('hex').slice(0, 12) };
    }
    if (may(role, 'premises')) for (const m of arr(p.premises)) if (str(m.id)) {
      const had = marks.get(m.id) || { history: [] };
      had.history.push({ part: name, status: str(m.status) });
      marks.set(m.id, Object.assign(had, pick(m, ['status', 'why']), { level: LEVEL(m.level), rests_on: arr(m.rests_on).map(ref), looked: arr(m.looked).map(recOf(name)), marked_by: by }, role === 'check' ? { checker_status: str(m.status) } : {}));
    }
    if (role === 'stop') { q.exchange_end.looked_for_more = q.exchange_end.looked_for_more.concat(arr(p.looked_for_more).map(recOf(name))); confirmedStop = p.nothing_new_confirmed === true; lateTurn = false; q.exchange_end.leads = arr(p.leads).map(str).filter(Boolean); }
    if (role === 'second') for (const s of arr(p.second)) {
      const k = q.roadblocks.findIndex(r => r.id === s.roadblock_id);
      if (k < 0 || q.roadblocks[k].part === name) continue;
      const rb = q.roadblocks[k];
      if (s.result === 'found' && s.found) { q.evidence.push(Object.assign({ id: 'E' + seq + '-' + (q.evidence.filter(e => e.gathered_by === name).length + 1), side: rb.side, gathered_by: name, found_after_roadblock: rb.id }, pick(s.found, EVIDENCE_FIELDS))); q.dissolved.push({ id: rb.id, sought: rb.sought, found_by: name }); q.roadblocks.splice(k, 1); }
      else rb.second_search = { by, part: name, attempts: arr(s.attempts).map(rec), result: s.result === 'not found' ? 'not found' : str(s.result) };
    }
    if (role === 'judge') { q.swap_test = pick(p.swap_test || {}, ['standard', 'to_claim', 'to_objection']); q.verdict = Object.assign(pick(p.verdict || {}, VERDICT_FIELDS), { by }); q.consensus_claims = arr(p.consensus_claims).map(c => Object.assign({}, c, { dissent_search: arr(c.dissent_search).map(recOf(name)) })); verdicts.push({ part: name, outcome: str((p.verdict || {}).outcome) }); }
    if (role === 'judge2') { const s = p.second_opinion || {}; second = { by, crux: str(s.crux), premises: arr(s.premises).map(x => pick(x, ['id', 'status'])), needed_disagree: arr(s.needed_disagree).map(String), needed_wrongly: arr(s.needed_wrongly).map(String) }; if (str(s.evidence_hash)) second.evidence_hash = str(s.evidence_hash); }   // which quotes he ruled on, as the first judge says for his own ruling
    // What the fairness reader found stays with the ruling he read, so a refusal is still on the record after the judges rule again.
    if (role === 'swap' && p.swap && verdicts.length) { const last = verdicts[verdicts.length - 1]; last.fairness = arr(last.fairness).concat([{ part: name, confirmed: p.swap.confirmed === true, note: str(p.swap.note) }]); }
    if (role === 'swap' && q.swap_test.standard && p.swap) { if (p.swap.confirmed === true) { q.swap_test.confirmed_by = by; q.swap_test.confirmed_note = str(p.swap.note); } else { delete q.swap_test.confirmed_by; q.swap_test.refused_note = str(p.swap.note); } }
  }
  // Readings: every reader's finding is kept, and the stricter one stands. A gatherer's reading of his own quote does not count.
  for (const e of q.evidence) {
    const rs = arr(e.readings).filter(r => r.part !== e.gathered_by);
    if (!rs.length) continue;
    e.cut = rs.some(r => r.cut === 'changes-meaning') ? 'changes-meaning' : rs.every(r => r.cut === 'faithful') ? 'faithful' : '';
    e.cut_by = 'context reader (part ' + rs.map(r => r.part).join(', part ') + ')';
    if (e.kind !== 'quran' && e.kind !== 'hadith') { e.stance = rs.every(r => r.stance === 'own') ? 'own' : (rs.find(r => r.stance && r.stance !== 'own') || {}).stance || ''; e.stance_by = e.cut_by; e.who_matches = rs.every(r => r.who_matches === true); }
    e.reading_note = rs.map(r => r.note).filter(Boolean).join(' | ');
    e.readers_disagree = new Set(rs.map(r => r.cut + '/' + r.stance + '/' + r.who_matches)).size > 1;
  }
  for (const t of q.exchange) if (t.checks.length) { t.faithful = t.checks.every(c => c.faithful); t.faithful_by = 'context reader (part ' + t.checks.map(c => c.part).join(', part ') + ')'; t.faithful_note = t.checks.filter(c => !c.faithful).map(c => c.note).join(' | '); }
  // Every point that was raised becomes a premise once somebody has marked it; what nobody marked is listed as unchecked.
  for (const pt of q.points) {
    const m = marks.get(pt.id), n = needs.get(pt.id) || {};
    Object.assign(pt, n);
    if (m) q.premises.push(Object.assign({ id: pt.id, side: pt.side, text: pt.text }, n, m));
  }
  q.exchange_end.unchecked = q.points.filter(pt => !marks.has(pt.id)).map(pt => pt.id);
  if (q.exchange.length) q.exchange_end.last_word = q.exchange[q.exchange.length - 1].side;
  // A turn that came after the last neutral search was never looked behind: the exchange is then not confirmed as ended.
  q.exchange_end.stopped_by = confirmedStop === true && !lateTurn && !q.exchange_end.unchecked.length && !q.exchange_end.leads.length ? 'nothing-new-confirmed' : 'round-limit';
  if (q.verdict.outcome !== undefined) q.verdict.history = verdicts;
  if (second) q.verdict.second_opinion = second;
  try { applyProof(q, JSON.parse(fs.readFileSync(path.join(dir, 'provenance.json'), 'utf8'))); } catch (e) { /* not proven yet */ }
  return { q, problems, asked: Q.id };
}
// Puts the proof of writers and searches into the case. A search that is not in its writer's record is marked and no longer counts.
function applyProof(q, pv) {
  q.provenance = pv.provenance;
  for (const rb of q.roadblocks) { if (pv.searches && pv.searches[rb.id]) rb.search_proof = pv.searches[rb.id]; else delete rb.search_proof; }
  const bad = new Set(arr((pv.provenance || {}).unproven).map(u => u.part + '|' + u.where + '|' + u.query));
  const mark = list => { for (const a of arr(list)) { if (bad.has(a.part + '|' + a.where + '|' + a.query)) a.unproven = true; else delete a.unproven; } };
  eachRecordList(q, mark);
}
// Every list of searches a case holds, apart from a roadblock's own (those are proven one by one).
function eachRecordList(q, fn) {
  fn((q.searched || {}).claim_side); fn((q.searched || {}).objection_side); fn((q.exchange_end || {}).looked_for_more); fn(q.other_objections_searched);
  for (const e of arr(q.evidence)) if (e.later_position) fn(e.later_position.searched);
  for (const p of arr(q.premises)) fn(p.looked);
  for (const c of arr(q.consensus_claims)) fn(c.dissent_search);
}

// What the record holds apart from what the script itself reads from the sources: used to see that a case file is exactly what its parts give.
function core(q) {
  const c = JSON.parse(JSON.stringify(q));
  for (const e of arr(c.evidence)) { delete e.verified; delete e.check; delete e.page_title; if (e.kind === 'quran') { delete e.quote_ar; delete e.quote_en; delete e.who; delete e.url; delete e.translation; } }
  for (const r of arr(c.roadblocks)) { delete r.verified; delete r.check; delete r.machine_search; delete r.dissolved_at; for (const a of arr(r.attempts).concat(arr((r.second_search || {}).attempts))) { delete a.fetched; delete a.proved_by; delete a.result_seen; } }
  delete c.dropped; delete c.dropped_turns;
  if (c.exchange_end && !Object.keys(c.exchange_end.declined || {}).length) delete c.exchange_end.declined;   // a file built before declines were recorded holds none: "none" and "not recorded" are the same record
  return c;
}
// Takes out what the record says about writers and searches, for when the caller has just read the agents' records again itself.
function stripProof(c) {
  delete c.provenance;
  for (const r of arr(c.roadblocks)) delete r.search_proof;
  eachRecordList(c, list => { for (const a of arr(list)) delete a.unproven; });
}
// Builds the case again from its parts and names every field in which the file says something else.
// liveProof: the caller has just read the agents' records again itself, so what the file says about them is not compared.
function intact(fileQ, dir, liveProof) {
  const { q } = assemble(dir), A = core(fileQ), B = core(q), diffs = [];
  // Every quote the parts give is either still in the file or listed there as dropped; none may vanish.
  const gone = new Set(arr(fileQ.dropped).map(d => d.id)), kept = new Set(A.evidence.map(e => e.id));
  if (B.evidence.some(e => !gone.has(e.id) && !kept.has(e.id))) diffs.push('dropped (a quote the parts give is neither in the file nor listed as dropped)');
  // And the other way round: whatever the file lists as dropped is a quote the parts give (its id, its side, its part), listed once
  // and not also kept; and the turns it says went with them are as many as the parts give. (Why a quote was not found is what the
  // script read at its source, which the parts cannot say: that much of the list is not compared.)
  const given = new Map(B.evidence.map(e => [e.id, e])), wrong = arr(fileQ.dropped).filter(d => { const e = given.get(d.id); return !e || kept.has(d.id) || e.side !== d.side || e.gathered_by !== d.part; });
  if (wrong.length || gone.size !== arr(fileQ.dropped).length) diffs.push('dropped (' + (wrong.length ? wrong.map(d => d.id).slice(0, 4).join(', ') + ': listed as dropped, and not a quote the parts give and the file leaves out' : 'a quote is listed twice') + ')');
  if (arr(fileQ.dropped_turns).length !== B.exchange.filter(t => t.evidence_ref.some(id => gone.has(id))).length) diffs.push('dropped_turns');
  B.evidence = B.evidence.filter(e => !gone.has(e.id));
  B.exchange = B.exchange.filter(t => !t.evidence_ref.some(id => gone.has(id)));
  if (B.exchange.length) B.exchange_end.last_word = B.exchange[B.exchange.length - 1].side;
  if (liveProof) for (const c of [A, B]) stripProof(c);
  // A proof of searches that no longer fits the roadblock is dropped at build time; compare what would be kept.
  for (const c of [A, B]) for (const r of arr(c.roadblocks)) if (r.search_proof && r.search_proof.hash !== M.signRb(r)) delete r.search_proof;
  for (const k of new Set(Object.keys(A).concat(Object.keys(B)))) {
    if (JSON.stringify(A[k]) === JSON.stringify(B[k])) continue;
    if (Array.isArray(A[k]) && Array.isArray(B[k]) && A[k].length === B[k].length) { const at = A[k].findIndex((x, i) => JSON.stringify(x) !== JSON.stringify(B[k][i])); diffs.push(k + '[' + ((A[k][at] || {}).id || at) + ']'); }
    else diffs.push(k);
  }
  return diffs;
}

const one = (t, n) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, n || 2000);
// blind: for the judges. It shows the quotes, how they were read and which points are needed, and hides every mark anyone has given.
function view(q, problems, blind) {
  const L = [], ok = arr(q.evidence).filter(M.found), lost = arr(q.evidence).filter(e => !M.found(e));
  L.push('# CASE ' + q.id + ' — ' + q.question + (blind ? '   (the judges\' view: no marks are shown)' : ''), '', 'THE CLAIM AS IT WAS ASKED: ' + q.claim.as_given, 'THE CLAIM AS ITS ADVOCATE STATES IT: ' + q.claim.text);
  if (arr(q.claim.overstated).length) L.push('Its advocate says these popular tellings go too far: ' + q.claim.overstated.join(' | '));
  if (arr(q.claim.candidates).length) L.push('Specialists considered for the claim: ' + q.claim.candidates.map(c => c.who + ' (' + c.why + ')').join('; '));
  if (q.objection.name) L.push('THE OBJECTION: ' + q.objection.name + ' — put best by: ' + q.objection.by, q.objection.text, 'Other advocates considered: ' + arr(q.objection.candidates).map(c => c.who + ' (' + c.why + ')').join('; '), 'Other objections not weighed here: ' + (q.other_objections.join(' | ') || '-'));
  L.push('', '## POINTS (every factual step either argument rests on)', '');
  for (const pt of q.points) {
    const m = q.premises.find(p => p.id === pt.id), bs = q.bearings.filter(b => b.point === pt.id);
    L.push('- [' + pt.id + '] ' + pt.side + ' | raised by the ' + pt.from + ' | ' + (typeof pt.needed === 'boolean' ? (pt.needed ? 'NEEDED: ' + pt.bears_on + (pt.needs_differ ? ' (the neutral readers differ on this)' : '') : 'not needed: ' + (pt.not_needed_because || '')) : 'need not yet judged') + '\n  ' + pt.text);
    if (!blind) L.push('  ' + (m ? 'MARKED ' + m.status + ' · level: ' + m.level + ' · rests on: ' + (arr(m.rests_on).join(', ') || '-') + ' · ' + one(m.why, 400) + ' · by the ' + m.marked_by + (arr(m.history).length > 1 ? ' · earlier marks: ' + m.history.slice(0, -1).map(h => h.status + ' (' + h.part + ')').join(', ') : '') : 'NOT YET CHECKED'));
    for (const b of bs) L.push('  a reader (' + b.part + ') found that ' + b.evidence + ' ' + (b.ground === 'silence' ? 'is silent on it (' + b.bears + ' only by what it does not say; silence is not a statement and counts for nothing)' : b.ground === 'possibility' ? 'only raises a possibility on it (' + b.bears + '; a possibility is not an assertion and counts for nothing)' : b.bears === 'none' ? 'does not bear on it' : b.bears + ' it, in the words: "' + one(b.words, 300) + '"'));
    if (!blind && m && m.status !== 'unsupported') { const unread = arr(m.rests_on).filter(id => !bs.some(b => b.evidence === id)); if (unread.length) L.push('  NO READER HAS YET SAID WHETHER THESE BEAR ON IT: ' + unread.join(', ')); }
  }
  L.push('', '## EVIDENCE THE SCRIPT FOUND WORD FOR WORD AT ITS SOURCE (' + ok.length + ')', '');
  for (const e of ok) {
    const c = e.check || {};
    L.push('### ' + e.id + ' | ' + e.side + ' | ' + e.kind + ' | ' + [e.who, e.work, e.ref].filter(Boolean).join(' | '));
    if (e.on_page_as) L.push('name as the page or catalogue writes it: ' + [].concat(e.on_page_as).join(', ') + ' · the script found it in: ' + (c.named_in || 'NOWHERE'));
    if (c.book) L.push('the library lists the page as: "' + c.book + '" by ' + c.author + (c.edition ? ' · ' + c.edition : ''));
    if (arr(c.author_meta).length) L.push('the page\'s own author tag: ' + c.author_meta.join(', '));
    if (e.via && e.via.who) L.push('QUOTED BY (not the work itself): ' + e.via.who + ' — standing: ' + (e.via.standing || '?') + ' — resting on: ' + (e.via.basis || '?'));
    if (e.quote_ar) L.push('ARABIC: ' + one(e.quote_ar));
    // The blind view is a file a translator could open: the English of a pair he has still to translate is not printed in it.
    if (blind && e.kind !== 'quran' && str(e.quote_ar) && str(e.quote_en) && !e.translation_check) L.push('ENGLISH: (not shown in this view until a translator has checked it against the Arabic)');
    else if (e.quote_en) L.push('ENGLISH (' + (e.kind === 'quran' ? e.translation : (e.translated_by_map ? 'by the map' : 'as published' + (e.translator ? ' by ' + e.translator : '')) + (e.quote_ar ? (e.translation_check ? (e.translation_check.replaced ? '; REPLACED by the neutral translator' : e.translation_check.agree ? '; confirmed against the Arabic by the neutral translator' : '; THE NEUTRAL TRANSLATOR FOUND IT DOES NOT SAY WHAT THE ARABIC SAYS: ' + one(e.translation_check.note, 200)) : '; NOT YET CHECKED AGAINST THE ARABIC') : '')) + '): ' + one(e.quote_en));
    if (e.kind !== 'quran') { L.push('ON THE PAGE, BEFORE THE QUOTE: ' + one(c.before, 700), 'ON THE PAGE, AFTER THE QUOTE: ' + one(c.after, 700)); if (c.before_en || c.after_en) L.push('ON THE ENGLISH PAGE, BEFORE: ' + one(c.before_en, 500), 'ON THE ENGLISH PAGE, AFTER: ' + one(c.after_en, 500)); if (arr(c.skipped).length) L.push('WORDS THE QUOTE SKIPS: ' + c.skipped.map(s => one(s, 700)).join(' || ')); if (arr(c.flags).length) L.push('THE SCRIPT FLAGS: ' + c.flags.join(' ; ')); }
    if (arr(c.grades).length) L.push('GRADINGS ON THE PAGE: ' + c.grades.map(g => g.grade + ' (' + g.name + ')').join(', '));
    if (e.grade) L.push('grading given by the gatherer: ' + e.grade + (e.graded_by ? ' — ' + e.graded_by : ''));
    if (e.use) L.push('marked by its gatherer as: ' + e.use);
    L.push('READING: ' + (e.kind === 'quran' ? 'n/a' : (arr(e.readings).length ? 'cut ' + (e.cut || '?') + (e.stance ? ', stance ' + e.stance : '') + (e.kind !== 'quran' && e.kind !== 'hadith' ? ', the person named is the one whose words these are: ' + (e.who_matches ? 'yes' : 'NO') : '') + (e.readers_disagree ? ' (THE READERS DIFFER; the stricter reading stands)' : '') + ' — ' + one(e.reading_note, 400) + ' — ' + e.cut_by : 'NOT YET READ')) + (e.later_position ? ' | later position: ' + e.later_position.result : (e.kind === 'scholar' || e.kind === 'advocate' ? ' | later position: NOT YET LOOKED FOR' : '')));
    if (e.supports) L.push('the gatherer says it supports: ' + one(e.supports, 400));
    L.push('address: ' + (e.check_url_ar || e.check_url_en || e.url || ''), '');
  }
  const loose = ok.filter(e => e.kind !== 'quran' && e.kind !== 'hadith' && (e.check || {}).attribution !== 'named');
  if (loose.length) { L.push('## FOUND, BUT NOT TIED TO THE PERSON NAMED (they carry no weight until the side that gathered them gives them again, with "replaces": the id and the right "on_page_as")', ''); for (const e of loose) L.push('- ' + e.id + ' | ' + e.side + ' | part ' + e.gathered_by + ' | ' + one(e.who, 60) + ' | ' + one((e.check || {}).naming, 400)); L.push(''); }
  L.push('## QUOTES THE SCRIPT DID NOT FIND (they prove nothing until repaired)', '');
  for (const e of lost) L.push('- ' + e.id + ' | ' + e.side + ' | part ' + e.gathered_by + ' | ' + one(e.who, 60) + ' | ' + ['ar', 'en'].map(l => l + ': ' + ((e.check || {})[l] || '-')).join(', '));
  for (const pr of problems) L.push('- PROBLEM in part ' + pr.part + ': ' + pr.text);
  L.push('', '## ROADBLOCKS (an original that was looked for and not found; it supports nothing)', '');
  for (const r of q.roadblocks) { const m = r.machine_search; L.push('- ' + r.id + ' | ' + r.side + ' side | sought: ' + one(r.sought, 300) + ' | said by: ' + r.who + ' | barrier: ' + (r.barrier || '?') + ' | the page that reports it: ' + ((r.reported_by || {}).url || '?') + '\n  ' + one(r.statement, 500) + '\n  the script\'s own search: ' + (m ? m.total_hits + ' hit(s) for the sought words' + (arr(m.leads).length ? '; places a shorter search points to: ' + m.leads.map(l => l.first).join(' ; ') : '') : 'no words to search for') + ' | second search: ' + (r.second_search ? 'done, ' + r.second_search.result : 'NOT YET')); }
  for (const d of q.dissolved) L.push('- ' + d.id + ' is no longer a roadblock: the second searcher found it (' + d.found_by + ')');
  L.push('', '## THE EXCHANGE SO FAR', '');
  q.exchange.forEach((t, i) => L.push((i + 1) + '. ' + t.side + ' | ' + t.who + ' | ' + (t.when || '-') + ' | rests on: ' + (t.evidence_ref.join(', ') || 'own reasoning') + (t.own_reasoning ? '' : ' | ' + (t.faithful === true ? 'checked against the quote' : t.faithful === false ? 'NOT FAITHFUL TO THE QUOTE: ' + t.faithful_note : 'not yet checked against the quote')) + (arr(t.earlier).length ? ' | corrected by part ' + t.part + ' (before: ' + one(t.earlier[t.earlier.length - 1].who, 40) + ' | ' + (t.earlier[t.earlier.length - 1].when || '-') + ')' : '') + '\n   ' + one(t.text, 1200)));
  if (q.exchange_end.leads.length) L.push('', 'PUBLISHED ANSWERS THE LAST SEARCH FOUND, NOT YET ON THE TABLE: ' + q.exchange_end.leads.join(' | '));
  L.push('', 'Unchecked points: ' + (q.exchange_end.unchecked.join(', ') || 'none') + ' · searches recorded: claim side ' + q.searched.claim_side.length + ', objection side ' + q.searched.objection_side.length, '', 'EVIDENCE HASH: ' + M.evidenceHash(q) + '   (the judge copies this into verdict.evidence_hash: it names exactly the found quotes above and how they were read)', '');
  return L.join('\n');
}
// The pair the script plants among those a translator is given: the Arabic of one passage beside the English of another. It is
// made from the parts alone and from nothing that changes between two readings of them, so that the assembler, coming to the
// translator's part, makes the very same pair again and knows which answer was the test. Its id looks like any other.
const PLANT_RULES = 5;   // cases opened under an earlier form of the rules were not tested this way, and say so
const GROUND_RULES = M.GROUND_RULES;   // 6: from here on a bearing says what it rests on, and every specialist a case names is accounted for
function planted(q) {
  const pair = e => e.kind !== 'quran' && str(e.quote_ar) && str(e.quote_en), pending = arr(q.evidence).filter(e => pair(e) && !e.translation_check);
  if (!pending.length) return null;
  const salt = arr(q.parts).filter(p => p.role !== 'translate').map(p => p.sha1).join('') + arr(q.translator_tests).length, key = e => crypto.createHash('sha1').update(salt + '|' + e.id).digest('hex');
  const first = list => list.slice().sort((x, y) => (key(x) < key(y) ? -1 : 1))[0], a = first(pending);
  const donors = arr(q.evidence).filter(e => e.id !== a.id && e.kind !== 'quran' && V.norm(e.quote_en).split(' ').length >= 6 && V.norm(e.quote_en) !== V.norm(a.quote_en) && V.norm(e.quote_ar || '') !== V.norm(a.quote_ar));
  if (!donors.length) return null;
  // Under the newer rules the pair may not give itself away. Its English is taken from a quote that is NOT in the translator's
  // list where there is one (else the same English would stand there twice), and its id is the id of a quote that is not in his
  // list either and is not the highest of its part there (an id one past the last of a part would mark it). An answer under that
  // id is the answer to the test and is never taken as a finding about the real quote (see the translator's part in assemble).
  const fresh = q.rules >= GROUND_RULES, outside = donors.filter(e => !pending.includes(e));
  const b = first(fresh && outside.length ? outside : donors), seq = (/^E(\d+)-/.exec(a.id) || [0, '000'])[1], n = Math.max(0, ...arr(q.evidence).map(e => Number((new RegExp('^E' + seq + '-(\\d+)$').exec(e.id) || [0, 0])[1]))) + 1;
  const at = e => /^E(\d+)-(\d+)$/.exec(e.id) || [0, '', 0], inside = fresh ? arr(q.evidence).filter(e => !pending.includes(e) && e.id !== b.id && pending.some(p => at(p)[1] === at(e)[1] && Number(at(p)[2]) > Number(at(e)[2]))) : [];
  return { id: inside.length ? first(inside).id : 'E' + seq + '-' + n, quote_ar: a.quote_ar, quote_en: b.quote_en, of: a.id, english_of: b.id };
}
// The translator sees the original and nothing else; then, once his own translation is written, the English that was given.
// plant: the planted pair, made by the caller from the case as its parts give it (before anything is dropped or read from a source).
function translateList(q, plant) {
  const todo = arr(q.evidence).filter(e => M.found(e) && e.kind !== 'quran' && str(e.quote_ar) && str(e.quote_en) && !e.translation_check).map(e => ({ id: e.id, quote_ar: e.quote_ar, quote_en: e.quote_en }));
  return plant && todo.length ? todo.concat([plant]).sort((x, y) => (x.id < y.id ? -1 : 1)) : todo;
}
function translateView(q, plant) {
  return ['# TO TRANSLATE — the Arabic only. Translate each into plain, exact English. Add nothing, soften nothing, leave nothing out.', ''].concat(translateList(q, plant).map(e => '## ' + e.id + '\n' + e.quote_ar + '\n')).join('\n');
}
function givenView(q, plant) {
  return ['# THE ENGLISH THAT WAS GIVEN for the passages you have just translated. Open this only after your own translations are written.', '# For each: does it say the same as yours in every point of meaning? Some of the pairs a translator is given are planted by the script and are wrong on purpose.', ''].concat(translateList(q, plant).map(e => '## ' + e.id + '\n' + one(e.quote_en) + '\n')).join('\n');
}

function writeAtomic(file, text) { const tmp = file + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, text); for (let i = 0; i < 6; i++) { try { fs.renameSync(tmp, file); return; } catch (e) { if (i === 5) throw e; const until = Date.now() + 150; while (Date.now() < until) { /* another build holds the file for a moment */ } } } }

async function build(dir, opts) {
  const o = opts || {}, { q, problems } = assemble(dir);
  const plant = q.rules >= PLANT_RULES ? planted(q) : null;      // from the parts alone, before anything is read or dropped
  // What the script already confirmed stays confirmed as long as the item was not touched.
  let old = null; try { old = JSON.parse(fs.readFileSync(path.join(dir, 'case.json'), 'utf8')).questions[0]; } catch (e) { /* first build */ }
  if (old && !o.full) {
    for (const e of q.evidence) { const p = arr(old.evidence).concat(arr(old.unfound)).find(x => x.id === e.id); if (p && p.check && p.check.hash === M.sign(Object.assign({}, e, e.kind === 'quran' ? pick(p, ['who', 'quote_ar', 'quote_en']) : {}))) { e.verified = p.verified; e.check = p.check; e.page_title = p.page_title; if (e.kind === 'quran') Object.assign(e, pick(p, ['who', 'quote_ar', 'quote_en', 'translation', 'url'])); } }
    for (const r of q.roadblocks) { const p = arr(old.roadblocks).find(x => x.id === r.id); if (p && p.check && p.check.hash === M.signRb(r)) { r.verified = p.verified; r.check = p.check; if (p.machine_search) r.machine_search = p.machine_search; } }
  }
  const doc = { asked: [q.id], questions: [q] };
  const r = await V.verifyDoc(doc, { keep: !o.full });
  for (const rb of q.roadblocks) if (rb.search_proof && rb.search_proof.hash !== M.signRb(rb)) delete rb.search_proof;
  if (o.final) {
    // Only what was found may stay. What is taken out is counted, by side, and a turn that rested on it goes with it.
    const lost = q.evidence.filter(e => !M.found(e));
    q.dropped = lost.map(e => ({ side: e.side, id: e.id, who: e.who, work: e.work, part: e.gathered_by, why: ['ar', 'en'].map(l => (e.check || {})[l]).filter(Boolean).join(', ') || 'never found' }));
    q.evidence = q.evidence.filter(M.found);
    const gone = new Set(lost.map(e => e.id));
    q.dropped_turns = q.exchange.filter(t => t.evidence_ref.some(id => gone.has(id))).map(t => ({ side: t.side, who: t.who, part: t.part }));
    q.exchange = q.exchange.filter(t => !t.evidence_ref.some(id => gone.has(id)));
    if (q.exchange.length) q.exchange_end.last_word = q.exchange[q.exchange.length - 1].side;
  }
  writeAtomic(path.join(dir, 'case.json'), JSON.stringify(doc, null, 2) + '\n');
  writeAtomic(path.join(dir, 'view.md'), view(q, problems, false));
  writeAtomic(path.join(dir, 'view-blind.md'), view(q, problems, true));
  writeAtomic(path.join(dir, 'view-translate.md'), translateView(q, plant));
  writeAtomic(path.join(dir, 'view-translate-given.md'), givenView(q, plant));
  return { q, problems, r };
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2), opt = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : ''; };
  if (cmd === 'new' && a && b) {
    const list = JSON.parse(fs.readFileSync(b, 'utf8')), qs = arr(list.questions || list);
    for (const Q of qs) {
      if (!str(Q.id) || !str(Q.question) || !str(Q.claim) || !Q.sides || !Q.sides.claim || !Q.sides.objection) { console.error('each question needs id, question, claim, and sides: { claim: { who, script }, objection: { who, script } }'); process.exitCode = 2; return; }
      const dir = path.join(a, Q.id); fs.mkdirSync(path.join(dir, 'parts'), { recursive: true }); fs.writeFileSync(path.join(dir, 'question.json'), JSON.stringify(Object.assign({ rules: GROUND_RULES }, Q), null, 2) + '\n'); console.log('MIZAN CASE: ' + dir);
    }
    // The list of what was asked is written once, here, so that a question which later fails or is left out is still counted as asked.
    const listFile = path.join(a, 'asked.json'); let asked = []; try { asked = JSON.parse(fs.readFileSync(listFile, 'utf8')).asked; } catch (e) { /* first time */ }
    fs.writeFileSync(listFile, JSON.stringify({ asked: [...new Set(asked.concat(qs.map(Q => Q.id)))] }, null, 2) + '\n');
    return;
  }
  if (cmd === 'build' && a) {
    const only = opt('part'), { q, problems, r } = await build(a, { full: process.argv.includes('--full'), final: process.argv.includes('--final') });
    const mine = x => !only || x === only, lines = [];
    const partOf = id => (q.evidence.find(e => e.id === id) || {}).gathered_by || (q.roadblocks.find(x => x.id === id) || {}).part || '';
    for (const f of r.fails) if (mine(partOf(f.item === 'roadblock' ? f.rb : f.item))) lines.push((f.item === 'roadblock' ? 'ROADBLOCK REFUSED ' + f.rb : 'NOT FOUND ' + f.item) + ' | ' + f.who + ' | ' + f.problem + ' | ' + f.url);
    for (const f of r.unnamed) if (mine(partOf(f.item))) lines.push('NOT ATTRIBUTED ' + f.item + ' | ' + f.who + ' | ' + f.problem + ' | ' + f.url);
    for (const e of q.evidence) if (!M.found(e) && mine(e.gathered_by) && !r.fails.some(f => f.item === e.id)) lines.push('NOT FOUND ' + e.id + ' | ' + e.who + ' | ' + ['ar', 'en'].map(l => l + ': ' + ((e.check || {})[l] || '-')).join(', '));
    for (const p of problems) if (mine(p.part)) lines.push('PROBLEM ' + p.part + ' | ' + p.text);
    const found = q.evidence.filter(M.found).length;
    console.log('MIZAN CASE ' + q.id + (only ? ' (part ' + only + ')' : '') + ': ' + q.parts.length + ' part(s) · quotes found word for word ' + found + ' of ' + q.evidence.length + (process.argv.includes('--final') ? ' · dropped ' + q.dropped.length : '') + ' · roadblocks ' + q.roadblocks.length + ' · points ' + q.points.length + ', unchecked ' + q.exchange_end.unchecked.length + ' · ' + lines.length + ' problem(s)' + (only ? ' in this part' : ''));
    console.log(lines.join('\n') + (lines.length ? '\n' : '') + 'read: ' + path.join(a, 'view.md'));
    process.exitCode = lines.length ? 1 : 0;
    return;
  }
  if (cmd === 'join' && a && b) {
    const dirs = process.argv.slice(4).filter(x => !x.startsWith('--')), out = { asked: [], built_from: [], questions: [] };
    for (const d of dirs) { const Q = JSON.parse(fs.readFileSync(path.join(d, 'question.json'), 'utf8')); out.asked.push(Q.id); out.built_from.push(path.resolve(d)); try { out.questions.push(JSON.parse(fs.readFileSync(path.join(d, 'case.json'), 'utf8')).questions[0]); } catch (e) { console.log('no case yet for ' + Q.id); } }
    try { out.asked = [...new Set(JSON.parse(fs.readFileSync(path.join(path.dirname(path.resolve(dirs[0])), 'asked.json'), 'utf8')).asked.concat(out.asked))]; } catch (e) { /* no list beside the folders */ }
    fs.writeFileSync(a, JSON.stringify(out, null, 2) + '\n');
    console.log('MIZAN CASE: ' + out.questions.length + ' of ' + out.asked.length + ' question(s) asked are joined into ' + a);
    return;
  }
  console.error('usage: node domain/mizan/case.js new <folder> <questions.json> | build <case folder> [--part <name>] [--full] [--final] | join <out.json> <case folder> [...]');
  process.exitCode = 2;
}
if (require.main === module) main();
module.exports = { assemble, core, intact, build, view, readParts, applyProof, eachRecordList, ROLE_NAME, planted, translateView, givenView, PLANT_RULES, GROUND_RULES };
