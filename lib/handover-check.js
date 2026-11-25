#!/usr/bin/env node
// handover-check — born via forge
// symptom: 286462: a hand-over note promised Lot and PT output changes nobody asked for, quoted a TSO report as the requirement, and gave bare line numbers; the other team had to ask 3 questions
// goal: every expected-result row in a hand-over note traces to words in the ticket's Expected, with that Expected's author and role named, so the other team does not have to ask what is required
// goal_signal: the hand-over reply carries a HANDOVER-CHECK line with exit 0 before miya sees the note
// retention: keep
// footprint: on-demand: 1 node process under 1 second per check, nothing at boot
//
// USAGE: node lib/handover-check.js --brief "<Task folder>\1. Brief" --draft <note.txt>
//   reads History.txt (+ Description.txt) in the Brief folder; the draft is the note text.
//   also reads the fix files in the Task folder's `N. Fix` / `N. Rework` folders and prints a NOTE-CODE line (290517).
// Exit 0 = clean · 1 = findings (fix the note or turn the row into a question) · 2 = bad input.
'use strict';
const fs = require('fs');
const path = require('path');

const STOP = new Set(['no', 'dan', 'di', 'atas', 'pada', 'papar', 'yang', 'the', 'and', 'of', 'to', 'in', 'is', 'ke', 'dari', 'untuk', 'dalam', 'tak', 'tidak']);
const EXPECTED_HEAD = /sepatutnya|expected|dijangka|selepas|after/i;

function arg(name) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : null; }
function words(s) { return (String(s).toLowerCase().match(/[a-z]{2,}/g) || []).filter(w => !STOP.has(w)); }
function stripMarks(s) { return String(s).replace(/<\/?strike>|[-*_]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase(); }

// Who wrote the Expected: a BA Expected list in the journal wins; else the Description.
function expectedSource(history, description) {
  const out = { text: null, author: null, role: null, editors: [], isBA: false, from: null };
  let role;
  try { role = require('./redmine-role.js'); } catch (_) { role = null; }
  if (role) {
    const spec = role.specFromHistory(history, null).expected;
    if (spec && spec.isSpec) {
      out.text = spec.block.items.map(i => i.text || i).join(' ');
      out.author = spec.block.author; out.role = 'BA'; out.isBA = true; out.from = 'BA journal ' + (spec.block.stamp || '');
      return out;
    }
  }
  const src = description || history;
  const m = src.match(/Expected\s*:?\s*\n?([\s\S]*?)(?:\n\s*\n\s*[A-Z][^\n]{0,30}:|\n─{10,}|$)/i);
  out.text = m ? m[1].replace(/\s+/g, ' ').trim() : null;
  const head = (description || '').match(/^Author:\s*(.+?)\s*\[([^\]]+)\]/m) || history.match(/^Description by:\s*(.+?)\s*\[([^\]]+)\]/m);
  if (head) { out.author = head[1].trim(); out.role = head[2].trim(); out.isBA = /^BA\b/.test(out.role); }
  out.from = 'Description';
  // the people who edited the Description, with their journal role
  const re = /^---\s*\S+\s+by\s+(.+?)\s*---\s*\n\s*\[role\]\s*([^\n]+)\n(?:(?!^---)[\s\S])*?\[attr\] description:/gm;
  let e; while ((e = re.exec(history))) out.editors.push(e[1].trim() + ' (' + e[2].trim() + ')');
  return out;
}

function tableRows(draft) {
  const rows = draft.split(/\r?\n/).filter(l => /^\s*\|.*\|\s*$/.test(l))
    .map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.replace(/^_\.\s*/, '').trim()));
  if (!rows.length) return { head: null, data: [] };
  const head = rows[0].some(c => EXPECTED_HEAD.test(c)) ? rows[0] : null;
  return { head, data: head ? rows.slice(1) : rows };
}

// NOTE-CODE (290517, 2026-11-24): the note showed half of a line whose full form sat in the attached fix file; the other
// team applied the note. A code block that overlaps a fix file must hold whole lines of it. A block with no overlap
// (an evidence SELECT) is not fix code and is left alone. Tracks itself: the NOTE-CODE line is printed on every run.
const CODE_EXT = /\.(jrxml|java|xhtml|xml|sql|js|json|properties|txt)$/i;
const norm = s => String(s).replace(/\s+/g, ' ').trim();
function codeBlocks(draft) {
  const out = []; let m;
  const pre = /<pre>([\s\S]*?)<\/pre>/gi; while ((m = pre.exec(draft))) out.push(m[1]);
  const fence = /```[^\n]*\n([\s\S]*?)```/g; while ((m = fence.exec(draft))) out.push(m[1]);
  return out.map(b => b.split(/\r?\n/).map(norm).filter(Boolean)).filter(b => b.length);
}
function fixFilesOf(briefDir) {
  const task = path.dirname(briefDir); const files = [];
  let dirs = []; try { dirs = fs.readdirSync(task).filter(d => /^\d+\.\s*(Fix|Rework)/i.test(d)); } catch (_) {}
  for (const d of dirs) {
    let names = []; try { names = fs.readdirSync(path.join(task, d)); } catch (_) {}
    for (const n of names.filter(n => CODE_EXT.test(n))) { try { files.push({ name: d + '\\' + n, text: fs.readFileSync(path.join(task, d, n), 'utf8') }); } catch (_) {} }
  }
  return files;
}
function noteCode(draft, fixFiles) {
  const blocks = codeBlocks(draft); const findings = [];
  const fileLines = new Set(); for (const f of fixFiles) for (const l of f.text.split(/\r?\n/).map(norm).filter(Boolean)) fileLines.add(l);
  if (!blocks.length) return { line: 'NOTE-CODE: no code block in the note', findings };
  if (!fileLines.size) return { line: `NOTE-CODE: ${blocks.length} code block(s), no fix file to compare`, findings };
  const all = [...fileLines]; let fixBlocks = 0, total = 0, same = 0;
  for (const b of blocks) {
    const overlaps = b.some(l => l.length >= 12 && all.some(f => f.includes(l) || l.includes(f) && f.length >= 12));
    if (!overlaps) continue;
    fixBlocks++;
    for (const l of b) {
      total++;
      if (fileLines.has(l)) same++;
      else findings.push(`code in the note is not a whole line of the fix file: "${l}". Copy the code from ${fixFiles.map(f => f.name).join(', ')}, never retype it (290517: the note showed half of the line, the other team applied the note).`);
    }
  }
  return { line: `NOTE-CODE: ${same}/${total} line(s) of ${fixBlocks} fix code block(s) equal the fix file (${blocks.length - fixBlocks} other block(s) not compared)`, findings };
}

function check(history, description, draft, fixFiles) {
  const findings = [];
  const src = expectedSource(history, description);
  const lines = [];
  lines.push(`EXPECTED SOURCE: ${src.author || 'author unknown'} (${src.role || 'role unknown'}), ${src.from}: "${src.text || '(no Expected found)'}"`);
  if (src.editors.length) lines.push(`  Description edited by: ${src.editors.join(' · ')}`);
  if (!src.isBA) lines.push('  NOT A BA SPEC: anything beyond this text is a question for the BA, never a fix in the note.');
  if (!src.text) findings.push('no Expected text found in the ticket: ask the BA what the result must be before writing the note');

  const expWords = new Set(words(src.text || ''));
  const { head, data } = tableRows(draft);
  const col = head ? head.findIndex(c => EXPECTED_HEAD.test(c)) : -1;
  const nowCol = head ? head.findIndex(c => /sekarang|current|actual|semasa|before/i.test(c)) : -1;
  for (const r of data) {
    const val = col >= 0 ? r[col] : r[r.length - 1];
    if (!val) continue;
    if (nowCol >= 0 && stripMarks(r[nowCol]) === stripMarks(val)) continue; // unchanged row
    const missing = words(val).filter(w => !expWords.has(w));
    if (missing.length) findings.push(`row "${r.join(' | ')}": "${missing.join(', ')}" is not in the ticket's Expected. Keep today's output for this row, or ask the ${src.isBA ? 'BA' : 'BA (the Expected is a ' + (src.role || 'non-BA') + ' report)'}.`);
  }

  for (const l of draft.split(/\r?\n/)) {
    if (/\b(baris|line|lines)\b/i.test(l) && /\b\d{2,5}\b/.test(l)) {
      const hasFile = /\b[\w-]+\.(jrxml|java|xhtml|xml|docx|sql|js|json)\b/i.test(l);
      const hasBranch = /\bmlk\/[\w./-]+|\bmaster\b/i.test(l);
      if (!hasFile || !hasBranch) findings.push(`line numbers without ${!hasFile ? 'the file name' : ''}${!hasFile && !hasBranch ? ' and ' : ''}${!hasBranch ? 'the branch' : ''}: "${l.trim()}". Say they are line numbers in <file> on <branch>.`);
    }
  }
  if (fixFiles) { const nc = noteCode(draft, fixFiles); lines.push(nc.line); findings.push(...nc.findings); }
  return { lines, findings, src };
}

if (require.main === module) {
  const brief = arg('brief'), draftPath = arg('draft');
  if (!brief || !draftPath) { console.error('usage: node lib/handover-check.js --brief "<Task folder>\\1. Brief" --draft <note.txt>'); process.exit(2); }
  const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; } };
  const history = read(path.join(brief, 'History.txt'));
  if (!history) { console.error('handover-check: no History.txt in ' + brief + ' (run node quest/redmine-sync.js <ticket> first)'); process.exit(2); }
  const r = check(history, read(path.join(brief, 'Description.txt')), read(draftPath), fixFilesOf(brief));
  for (const l of r.lines) console.log(l);
  r.findings.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log(`HANDOVER-CHECK: ${r.findings.length} finding(s)`);
  process.exit(r.findings.length ? 1 : 0);
}
module.exports = { check, expectedSource, tableRows, noteCode, fixFilesOf };
