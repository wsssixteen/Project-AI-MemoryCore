#!/usr/bin/env node
// build-index.js — parse BUG-BESTIARY.md (+ LEARNED-FROM-*.md) into the structured bug index.
// miya 2026-08-17: "build like a database of bugs as it grows... so that you start debugging
// with the right understanding." Index = one jsonl row per pattern; markdown stays the human view.
// Index file sits NEXT TO the bestiary (untracked knowledge folder) — confidentiality preserved.
// Run: node domain/bug-db/build-index.js   (re-run after any bestiary append — Phase-2 close does)
'use strict';
const fs = require('fs');
const path = require('path');
const MAIN = 'C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\0. AI\\Project-AI-MemoryCore';
const KNOW = path.join(MAIN, 'projects', 'coding-projects', 'active', 'etanah-knowledge', 'melaka');
const OUT = path.join(KNOW, 'bug-db-index.jsonl');

const STOP = new Set(['pattern', 'yang', 'tidak', 'pada', 'dalam', 'untuk', 'dengan', 'adalah', 'because', 'after', 'before', 'where', 'which', 'while', 'their', 'there', 'these', 'those', 'field', 'fields', 'value', 'values', 'table', 'screen', 'error', 'ralat', 'issue', 'fixed', 'never', 'always', 'when', 'then', 'that', 'this', 'from', 'into', 'only', 'null', 'blank', 'kosong', 'papar', 'salah']);

function keywordsOf(text) {
  const kw = new Set();
  for (const m of text.matchAll(/#(\d{6})/g)) kw.add(m[1]);
  for (const m of text.matchAll(/\b(QA|ADHOC)-?(\d{6})\b/gi)) kw.add(m[2]);
  for (const m of text.matchAll(/\b[A-Z][a-z]+(?:[A-Z][a-z0-9]+)+\b/g)) kw.add(m[0].toLowerCase()); // CamelCase identifiers
  for (const m of text.matchAll(/\b[a-z]+(?:_[a-z0-9]+)+\b/g)) kw.add(m[0]); // snake_case tables/columns
  for (const m of text.matchAll(/\b[A-Za-z]{5,}\b/g)) { const w = m[0].toLowerCase(); if (!STOP.has(w)) kw.add(w); }
  return [...kw];
}

function parseFile(file, project) {
  let src; try { src = fs.readFileSync(file, 'utf8'); } catch (_) { return []; }
  const lines = src.split(/\r?\n/);
  const entries = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{2,3})\s+(.*)/);
    const startsPattern = h && /pattern/i.test(h[2]) && !/PATTERN CATALOG/.test(h[2]);
    const startsOtherPart = h && !startsPattern && /^## /.test(lines[i]); // a new top section ends the entry; ### sub-headings (Symptom/Root cause) stay IN the body
    if (startsPattern) {
      if (cur) entries.push(cur);
      cur = { title: h[2].replace(/^[🔴🟡🟢\s]*/u, '').trim(), file: path.basename(file), line: i + 1, body: [] };
    } else if (startsOtherPart) {
      if (cur) { entries.push(cur); cur = null; }
    } else if (cur && cur.body.length < 80) cur.body.push(lines[i]);
  }
  if (cur) entries.push(cur);
  return entries.map((e, idx) => {
    const bodyText = e.body.join('\n');
    const summary = e.body.map(l => l.trim()).filter(l => l && !l.startsWith('|') && !l.startsWith('#')).slice(0, 2).join(' ').slice(0, 260);
    return {
      id: path.basename(file, '.md').toLowerCase() + '-' + e.line,
      project, title: e.title, source: path.basename(file) + ':' + e.line,
      tickets: [...new Set([...(e.title + bodyText).matchAll(/#?(\d{6})/g)].map(m => m[1]))].slice(0, 8),
      keywords: keywordsOf(e.title + '\n' + bodyText).slice(0, 60),
      summary,
    };
  });
}

const sources = [path.join(KNOW, 'BUG-BESTIARY.md')];
try { for (const f of fs.readdirSync(KNOW)) if (/^LEARNED-FROM-.*\.md$/i.test(f)) sources.push(path.join(KNOW, f)); } catch (_) {}

let rows = [];
for (const s of sources) rows = rows.concat(parseFile(s, 'melaka'));
fs.writeFileSync(OUT, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log('bug-db index: ' + rows.length + ' entries from ' + sources.length + ' source file(s) -> ' + OUT);
process.exit(rows.length >= 15 ? 0 : 1); // fewer than 15 = parser broke, not a shrunken corpus (17 patterns at build time)
