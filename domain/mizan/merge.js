#!/usr/bin/env node
// mizan merge — two small jobs around a repair run on an existing case file.
//   node domain/mizan/merge.js failing <case.json>                      print the items a repair run must take, as JSON
//   node domain/mizan/merge.js apply <case.json> <repair-result.json>   put the repairs back into the case file
// "failing" = a quote the checker did not find, did not tie to its author, or found only on a page that is not the work itself with nobody named as quoting it.
// "apply": fixed -> the item is replaced (it keeps its id and side); roadblock -> the item moves to roadblocks; drop -> the item is removed and counted.
// After apply, run verify.js again. A verdict given on the old evidence no longer stands (the check "verdict-fresh" says so).
'use strict';
const fs = require('fs');
const path = require('path');
const { found, banned, primary, hostsIn } = require(path.join(__dirname, '..', '..', 'lib', 'mizan.js'));

const SPEAKERS = ['scholar', 'advocate'];
const words = t => String(t || '').trim().split(/\s+/).filter(Boolean).length;
const unwrap = d => (d.result !== undefined ? (typeof d.result === 'string' ? JSON.parse(d.result) : d.result) : d);
const list = doc => doc.questions || doc.nodes || [];

const [cmd, file, repairFile] = process.argv.slice(2);
if (!['failing', 'apply'].includes(cmd) || !file) { console.error('usage: node domain/mizan/merge.js failing <case.json> | apply <case.json> <repair-result.json>'); process.exit(2); }
const doc = JSON.parse(fs.readFileSync(file, 'utf8'));

if (cmd === 'failing') {
  const items = [];
  for (const q of list(doc)) (q.evidence || []).forEach((it, index) => {
    const u = it.check_url_ar || it.check_url_en || '', c = it.check || {};
    let problem = '';
    if (it.kind === 'quran') { if (!found(it)) problem = 'the Quran reference could not be fetched: ' + it.ref; }
    else if ([it.url, it.check_url_ar, it.check_url_en].some(x => x && banned(x))) problem = 'the page is an encyclopedia, wiki, forum or polemic site: find the specialist\'s own text';
    else if (!found(it)) problem = 'not found word for word on its page (' + ['ar', 'en'].map(l => l + ': ' + (c[l] || 'no check')).join(', ') + ')';
    else if (SPEAKERS.includes(it.kind) && c.attribution !== 'named') problem = 'found, but the page is not tied to this author (' + (c.book ? 'the library lists it as "' + c.book + '" by ' + c.author : 'his name is not on the page') + '): give on_page_as, or find the passage in his own book';
    else if (it.kind !== 'quran' && u && !primary(u) && words((it.via || {}).who) < 1) problem = 'found, but on ' + (hostsIn(u)[0] || u) + ', which is not the work itself: find the passage in the work, or say who is quoting it (via: who, standing, basis)';
    if (problem) { const clean = Object.assign({}, it); delete clean.check; delete clean.verified; items.push({ qid: q.id, question: q.question, side: it.side, id: it.id, index, item: clean, problem }); }
  });
  process.stdout.write(JSON.stringify(items, null, 1) + '\n');
  process.exit(0);
}

if (!repairFile) { console.error('apply needs the repair result file'); process.exit(2); }
const repairs = unwrap(JSON.parse(fs.readFileSync(repairFile, 'utf8'))).repairs || [];
const tally = { fixed: 0, roadblock: 0, drop: 0, unresolved: 0 };
for (const q of list(doc)) {
  const gone = new Set();
  for (const r of repairs.filter(x => x.qid === q.id)) {
    const at = r.id ? (q.evidence || []).findIndex(e => e.id === r.id) : r.index;
    const old = (q.evidence || [])[at];
    if (!old) { tally.unresolved++; continue; }
    if (r.status === 'fixed' && r.item) { q.evidence[at] = Object.assign({}, r.item, { id: old.id, side: old.side, repaired: r.note || '' }); tally.fixed++; }
    else if (r.status === 'roadblock' && r.roadblock) { (q.roadblocks = q.roadblocks || []).push(Object.assign({ side: old.side, was: { id: old.id, who: old.who, work: old.work } }, r.roadblock)); gone.add(at); tally.roadblock++; }
    else if (r.status === 'drop') { (q.dropped = q.dropped || []).push({ side: old.side, id: old.id, who: old.who, work: old.work, quote: old.quote_en || old.quote_ar, why: r.note || '' }); gone.add(at); tally.drop++; }
    else tally.unresolved++;
  }
  q.evidence = (q.evidence || []).filter((e, i) => !gone.has(i));
}
fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
console.log('MIZAN MERGE: ' + tally.fixed + ' fixed · ' + tally.roadblock + ' moved to roadblocks · ' + tally.drop + ' dropped · ' + tally.unresolved + ' unresolved → run domain/mizan/verify.js again; the verdict must be given again on the new evidence');
