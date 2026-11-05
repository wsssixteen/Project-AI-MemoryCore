#!/usr/bin/env node
// change-card.js — checks a What/Why/How/When/Where change card (system/INDEX.md change route steps 3 and 8)
// symptom: 2026-11-05 miya: "Answer in single sentence each: What, Why, How, When, Where. How using diagram flow.
//          Where using the boxed diagram (please remind me at the end what's the name) ... easy thing to review, before and after."
// goal: every system change is shown to him as the same five one-sentence lines, before the nod and after it lands
// goal_signal: the step 3 and step 8 replies of a system change each carry a card that prints CHANGE-CARD: PASS
// boundary: covers one card text (a file or stdin), prints PASS or FAIL with reasons · never edits a file, never draws a picture ·
//           stops at the verdict line (report only)
// footprint: on-demand: 1 node process per call, reads one text, under 0.1 s
// retention: keep (log.jsonl in this folder, rotate monthly)
// Usage: node domain/change-card/change-card.js <card.md> [--stage before|after]   (or pipe the card on stdin)
'use strict';
const fs = require('fs');
const path = require('path');

const FIELDS = ['What', 'Why', 'How', 'When', 'Where'];
const NAME_LINE = /where picture\s*=\s*the change map/i;
const IMAGE = /\.(png|svg)\b|!\[[^\]]*\]\(/i;

// One sentence: exactly one sentence end, no semicolon, not empty. Dots inside file names or numbers do not count.
function sentenceProblem(text) {
  const t = String(text || '').trim();
  if (!t) return 'empty';
  if (t.includes(';')) return 'has a semicolon';
  const stripped = t.replace(/`[^`]*`/g, 'X').replace(/\b[\w./\\-]+\.(js|md|png|json|html|xml|java|svg)\b/gi, 'X').replace(/\d+\.\d+/g, 'N');
  const ends = (stripped.match(/[.!?](\s|$)/g) || []).length;
  if (ends === 0) return 'no full stop';
  if (ends > 1) return `${ends} sentences`;
  return null;
}

function parse(text) {
  const lines = String(text || '').split(/\r?\n/);
  const out = {};
  FIELDS.forEach(f => {
    const re = new RegExp('^\\s*(?:[-*|]\\s*)?\\**' + f + '\\**\\s*[:|]\\s*\\**\\s*(.+?)\\s*\\|?\\s*$', 'i');
    const idx = lines.findIndex(l => re.test(l));
    if (idx === -1) return;
    const sentence = lines[idx].match(re)[1].replace(/\|\s*$/, '').trim();
    // the picture for How / Where may sit on the same line or the next 3 lines, up to the next field
    const label = new RegExp('^\\s*(?:[-*|]\\s*)?\\**(' + FIELDS.join('|') + ')\\**\\s*[:|]', 'i');
    let end = idx + 1;
    while (end < lines.length && end < idx + 4 && !label.test(lines[end])) end++;
    const near = lines.slice(idx, end).join('\n');
    out[f] = { sentence, line: idx + 1, hasImage: IMAGE.test(near) };
  });
  return out;
}

// main/current-session.md holds many blocks: take the LAST "CHANGE-CARD (<stage>): <name>" block, up to a blank line + non-card text.
function pickBlock(text, stage) {
  const re = /^CHANGE-CARD \((before|after)\):.*$/gim;
  let m, last = null;
  while ((m = re.exec(text))) { if (!stage || m[1].toLowerCase() === stage.toLowerCase()) last = m.index; }
  if (last === null) return text;
  const rest = text.slice(last);
  const end = rest.search(/\n\s*\n(?!\s*!\[)(?!\s*Where picture)/);
  return end === -1 ? rest : rest.slice(0, end + 1) + (rest.slice(end).match(/^\s*Where picture[^\n]*/m) || [''])[0];
}

// The five sentences of a card block, for the AFTER-copies-BEFORE check (scenario 18, 2026-11-05).
function sentencesOf(block) {
  const c = parse(block);
  return FIELDS.map(f => (c[f] ? c[f].sentence.replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim().toLowerCase() : ''));
}
function cardName(block) { const m = String(block).match(/^CHANGE-CARD \((?:before|after)\):\s*(.+)$/im); return m ? m[1].trim().toLowerCase() : null; }

function check(text, stage) {
  const full = text;
  text = pickBlock(text, stage);
  const reasons = [];
  if (stage && stage.toLowerCase() === 'after') {
    const name = cardName(text);
    const beforeRe = /^CHANGE-CARD \(before\):.*$/gim;
    let m, before = null;
    while ((m = beforeRe.exec(full))) { const b = pickBlock(full.slice(m.index), 'before'); if (!name || cardName(b) === name) before = b; }
    if (before) {
      const a = sentencesOf(text), b = sentencesOf(before);
      if (a.every(Boolean) && a.join('|') === b.join('|')) reasons.push('AFTER card is a word-for-word copy of the BEFORE card: rewrite it from what landed');
    }
  }
  const card = parse(text);
  FIELDS.forEach(f => {
    const c = card[f];
    if (!c) { reasons.push(`${f}: missing`); return; }
    const sentenceOnly = c.sentence.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\S+\.(png|svg)\b/gi, '').trim();
    const p = sentenceProblem(sentenceOnly);
    if (p) reasons.push(`${f}: not one sentence (${p})`);
  });
  if (card.How && !card.How.hasImage) reasons.push('How: no flow picture (.png/.svg) on or under the line');
  if (card.Where && !card.Where.hasImage) reasons.push('Where: no change map picture (.png/.svg) on or under the line');
  if (!NAME_LINE.test(text)) reasons.push('closing line missing: "Where picture = the change map (lib/change-map.js)"');
  if (stage && !new RegExp('\\b' + stage + '\\b', 'i').test(text)) reasons.push(`stage word "${stage}" not in the card`);
  return { pass: reasons.length === 0, reasons };
}

function log(row) {
  try { fs.appendFileSync(process.env.CHANGE_CARD_LOG || path.join(__dirname, 'log.jsonl'), JSON.stringify(row) + '\n'); } catch (_) { /* log is best effort */ }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const si = args.indexOf('--stage');
  const stage = si >= 0 ? args[si + 1] : null;
  const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--stage');
  const text = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
  const r = check(text, stage);
  log({ ts: new Date().toISOString(), file: file || 'stdin', stage, pass: r.pass, reasons: r.reasons });
  console.log(r.pass ? 'CHANGE-CARD: PASS' : 'CHANGE-CARD: FAIL ' + r.reasons.join(' · '));
  process.exit(r.pass ? 0 : 1);
}

module.exports = { check, parse, sentenceProblem };
