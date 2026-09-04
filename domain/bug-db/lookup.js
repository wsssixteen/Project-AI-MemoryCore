#!/usr/bin/env node
// lookup.js — score free text against the bug index; return top matches.
// CLI: node domain/bug-db/lookup.js "<symptom text>"   · require: const {lookup} = require('./lookup')
'use strict';
const fs = require('fs');
const path = require('path');
// State via lib/states.js (2026-09-04): --state <key> · ETANAH_STATE · else the reference state (echoed by callers).
const states = require(path.join(__dirname, '..', '..', 'lib', 'states.js'));
const _si = process.argv.indexOf('--state');
const STATE_KEY = (_si > 0 ? process.argv[_si + 1] : null) || process.env.ETANAH_STATE || states.reference();
const INDEX = path.join(states.knowledgeDir(STATE_KEY) || '', 'bug-db-index.jsonl');

function tokensOf(text) {
  const t = new Set();
  for (const m of text.matchAll(/#?(\d{6})\b/g)) t.add(m[1]);
  for (const m of text.matchAll(/\b[A-Z][a-z]+(?:[A-Z][a-z0-9]+)+\b/g)) t.add(m[0].toLowerCase());
  for (const m of text.matchAll(/\b[a-z]+(?:_[a-z0-9]+)+\b/g)) t.add(m[0]);
  for (const m of text.matchAll(/\b[A-Za-z]{5,}\b/g)) t.add(m[0].toLowerCase());
  return t;
}

function lookup(text, topN) {
  let rows;
  try { rows = fs.readFileSync(INDEX, 'utf8').trim().split('\n').map(l => JSON.parse(l)); }
  catch (_) { return []; } // no index = silent no-hits (fail-open; build-index.js creates it)
  const q = tokensOf(text);
  const scored = [];
  for (const r of rows) {
    let s = 0;
    const why = [];
    for (const tk of r.tickets || []) if (q.has(tk)) { s += 10; why.push('#' + tk); }
    for (const k of r.keywords || []) if (q.has(k)) { s += /_|[0-9]/.test(k) || k.length > 12 ? 3 : 1; if (why.length < 4) why.push(k); }
    if (s >= 4) scored.push({ score: s, why, title: r.title, source: r.source, summary: r.summary });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, topN || 3);
}

module.exports = { lookup, INDEX };

if (require.main === module) {
  const hits = lookup(process.argv.slice(2).join(' '));
  if (!hits.length) { console.log('bug-db: 0 hits'); process.exit(0); }
  for (const h of hits) console.log('[' + h.score + '] ' + h.title + '\n     ' + h.source + ' · matched: ' + h.why.join(', ') + '\n     ' + h.summary);
}
