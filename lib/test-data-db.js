#!/usr/bin/env node
// test-data-db.js — born via core/forge.js (2026-08-17, miya goal item 1)
// Structured index over etanah-knowledge/melaka/TEST-PERMOHONAN-INDEX.md — the thing Ruri
// always derives when preparing test scenarios. Index lives NEXT TO the source (untracked).
//   build:  node lib/test-data-db.js build
//   lookup: node lib/test-data-db.js <urusan-code or free text>   e.g. PPTPB · "no resit PSBS"
// Requirements encoded (system-design Rule 10 table, 2026-08-17):
//   R1 live-task-state FIRST (CLAUDE.md §8) — output line 1 is always the live-query rule
//   R2 AWAM No-Resit derivation flagged per urusan
//   R3 Permohonan ID never without pengguna_semasa — standing warning
//   R4 recency: verified-dates surfaced, >2 months flagged STALE
//   R5 mlit stale-snapshot caveat in every output
'use strict';
const fs = require('fs');
const path = require('path');
const MAIN = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\0. AI\\Project-AI-MemoryCore';
const SRC = path.join(MAIN, 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka', 'TEST-PERMOHONAN-INDEX.md');
const OUT = path.join(path.dirname(SRC), 'test-data-index.jsonl');

function build() {
  const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);
  const rows = [];
  let cur = null, topSection = '';
  for (let i = 0; i < lines.length; i++) {
    const h2 = lines[i].match(/^## (.*)/);
    const h3 = lines[i].match(/^### (.*)/);
    if (h2) { if (cur) { rows.push(cur); cur = null; } topSection = h2[1].trim(); continue; }
    if (h3) {
      if (cur) rows.push(cur);
      const title = h3[1].trim();
      const urusanM = title.match(/^([A-Z]{2,6})\b/);
      cur = { urusan: urusanM ? urusanM[1] : null, title, section: topSection, source: 'TEST-PERMOHONAN-INDEX.md:' + (i + 1), body: [] };
      continue;
    }
    if (cur && cur.body.length < 40) cur.body.push(lines[i]);
  }
  if (cur) rows.push(cur);
  const entries = rows.map(r => {
    const bodyText = r.body.join('\n');
    return {
      urusan: r.urusan, title: r.title, section: r.section, source: r.source,
      awam: /awam/i.test(r.section + r.title + bodyText),
      no_resit: /no[_ ]?resit/i.test(r.section + r.title),
      verified_dates: [...new Set([...bodyText.matchAll(/20\d\d-\d\d-\d\d/g)].map(m => m[0]))].slice(0, 4),
      summary: r.body.map(l => l.trim()).filter(l => l && !l.startsWith('|') && !l.startsWith('#')).slice(0, 2).join(' ').slice(0, 220),
      keywords: [...new Set((r.title + ' ' + bodyText).toLowerCase().match(/[a-z_]{4,}/g) || [])].slice(0, 40),
    };
  });
  fs.writeFileSync(OUT, entries.map(e => JSON.stringify(e)).join('\n') + '\n');
  console.log('test-data index: ' + entries.length + ' entries -> ' + OUT);
  return entries.length;
}

function lookup(query) {
  let rowsRaw;
  try { rowsRaw = fs.readFileSync(OUT, 'utf8').trim().split('\n').map(l => JSON.parse(l)); }
  catch (_) { console.log('no index yet — run: node lib/test-data-db.js build'); return []; }
  const q = query.toLowerCase();
  const qWords = new Set(q.match(/[a-z_]{4,}/g) || []);
  const scored = rowsRaw.map(r => {
    let s = 0;
    if (r.urusan && q.toUpperCase().includes(r.urusan)) s += 10;
    for (const k of r.keywords || []) if (qWords.has(k)) s += 1;
    return { s, r };
  }).filter(x => x.s >= 2).sort((a, b) => b.s - a.s).slice(0, 4);

  const STALE_MS = 62 * 86400000;
  console.log('🎯 RULE 1 (CLAUDE.md §8): test scenario = LIVE TASK STATE. Run the canonical task-state');
  console.log('   query (umm_a_tgsn + ind_tgsn + ind_ursn + pcp_pengguna) NOW — stored IDs below are');
  console.log('   leads, and every Permohonan ID needs its CURRENT pengguna_semasa re-derived.');
  console.log('⚠️  mlit = stale test-DB snapshot (INDEX line 21) — verify seed rows before trusting routing.');
  if (!scored.length) { console.log('test-data-db: 0 hits for "' + query + '"'); return []; }
  for (const { s, r } of scored) {
    const newest = (r.verified_dates || []).sort().pop();
    const stale = !newest || (Date.now() - new Date(newest).getTime() > STALE_MS);
    console.log('\n[' + s + '] ' + r.title + (r.awam ? '  ⚠️ AWAM — derive No Resit Carian Rasmi (INDEX §No Resit)' : ''));
    console.log('     ' + r.source + ' · verified ' + (newest || 'undated') + (stale ? '  🔶 STALE >2mo — re-verify per feedback_test_data_recency' : ' ✓fresh'));
    if (r.summary) console.log('     ' + r.summary);
  }
  return scored;
}

const arg = process.argv.slice(2).join(' ').trim();
if (!arg) { console.log('usage: node lib/test-data-db.js build | <urusan or free text>'); process.exit(2); }
if (arg === 'build') process.exit(build() >= 10 ? 0 : 1);
lookup(arg);
