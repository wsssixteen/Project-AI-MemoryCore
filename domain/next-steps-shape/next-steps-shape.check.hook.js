#!/usr/bin/env node
// next-steps-shape.check.hook.js — born via core/forge.js (2026-09-30); back gate of domain/pre-reply-contract
// symptom: 2026-09-30 miya: "not sure what you're talking about. Please fix this behaviour. next steps without short explanation."
//          (rows "Rule the 11 overdue watches (ok or anomaly)" · "PPJK and PSBS guards at line 647" carried jargon, no meaning)
// goal: every Next steps row tells miya in plain words what the item is and why it needs him
// SIGNAL: last assistant text has a "Next steps" heading followed by a markdown table
// BLOCK: header has no "What it means" column, OR any row's meaning cell has < 5 words
// PASS: no Next steps table · table carries the column with a >= 5-word meaning on every row
// v3 BLOCK: a quest reply (names an active quest's ticket number) with a Next steps table and no image sent this turn
//           and no "Diagram: none (<reason>)" line — 2026-10-29 miya on 286655: "I didn't see any story diagram using
//           your diagram skill to decide. Why do you fail to show this on every quest run?"
// v4 BLOCK: EVERY quest reply (names an active quest's ticket number), with or without a Next steps table, needs an image sent
//           this turn or a "Diagram: none (<reason>)" line — 2026-10-30 miya on 287273: "Please ensure our current quest
//           workflow will always stop with showing the issue using diagram skill."
// BYPASS: [skip-next-steps-shape: <reason>] · FAIL-OPEN on any error
// Runs inside the stop-reply-shape bundle (lib/dispatch-hooks.js), not a standalone registration (system-rules Rule 7)
// Log: domain/next-steps-shape/log.jsonl
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const BYPASS = /\[skip-next-steps-shape:/i;
const HEADING = /^\s*(#{1,6}\s*|\*\*)\s*Next steps\b/i;
const MEANING_COL = /what it means|what this is|why/i;

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

function lastText(tp) {
  let raw; try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return null; }
  const L = raw.split(/\r?\n/).filter(Boolean);
  for (let i = L.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    const m = o.message || o;
    if ((m.role || o.type) !== 'assistant') continue;
    const c = m.content; let t = '';
    if (typeof c === 'string') t = c;
    else if (Array.isArray(c)) t = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    if (t.trim()) return t;
  }
  return null;
}

const cells = row => row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());

function evaluate(text) {
  if (!text || BYPASS.test(text)) return { verdict: 'pass', reason: 'no-text-or-bypass' };
  const lines = text.replace(/```[\s\S]*?```/g, '').split(/\r?\n/);
  const h = lines.findIndex(l => HEADING.test(l));
  if (h < 0) return { verdict: 'pass', reason: 'no-next-steps' };
  const table = [];
  for (let i = h + 1; i < lines.length; i++) {
    const s = lines[i].trim();
    if (!s && !table.length) continue;
    if (!s.startsWith('|')) break;
    table.push(s);
  }
  if (table.length < 3) return { verdict: 'pass', reason: 'no-table-rows' };
  const header = cells(table[0]);
  const col = header.findIndex(c => MEANING_COL.test(c));
  if (col < 0) return { verdict: 'block', reason: 'no-meaning-column', header: header.join(' | ') };
  const short = [];
  for (const row of table.slice(2)) {
    const c = cells(row);
    const words = (c[col] || '').split(/\s+/).filter(Boolean).length;
    if (words < 5) short.push(c[0] || '?');
  }
  if (short.length) return { verdict: 'block', reason: 'meaning-too-short', rows: short };
  // v2 (2026-10-14 miya: "when I see the next steps, I read 'end the old download goal' then I scroll back up you didn't
  // mention anything"): every row's subject must have its own place in the reply above, a heading or a table row, in the same
  // words, so scrolling back from a row lands on what explains it. A mention inside the opening paragraph does not count: that
  // is where his row was "mentioned" and he could not find it. Without any heading or table, the words must be in the text above.
  const act = header.findIndex(c => /action/i.test(c));
  const above = lines.slice(0, h), heads = above.filter(l => /^\s*#{1,6}\s/.test(l) || /^\s*\|/.test(l));
  const pool = heads.length ? heads.join(' ') : above.join(' ');
  const have = new Set(stems(pool)), orphans = [];
  for (const row of table.slice(2)) {
    const c = cells(row), words = [...new Set(stems(c[act >= 0 ? act : 1] || ''))];
    const hits = words.filter(w => have.has(w)).length;
    if (words.length && hits < Math.min(2, words.length)) orphans.push((c[0] || '?') + ' "' + (c[act >= 0 ? act : 1] || '') + '"');
  }
  if (orphans.length) return { verdict: 'block', reason: 'row-not-explained-above', rows: orphans, headings: heads.length };
  return { verdict: 'pass', reason: 'shape-ok' };
}

// v3: a quest reply that asks him to decide carries a picture (explain-diagram skill, rendered by lib/diagram-render.js)
// sent this turn. Quest = the reply names the number of a status=active block in quest/active.txt.
const DIAGRAM_NONE_RE = /^[ \t>*`-]*Diagram:\s*none\s*\([^)\n]{3,}\)/im;
const IMAGE_SEND_RE = /\.(?:png|jpe?g|svg)\b/i;
function activeTickets(file) {
  let raw; try { raw = fs.readFileSync(file, 'utf8'); } catch (_) { return []; }
  const out = [];
  for (const block of raw.split(/\r?\n\s*\r?\n/)) {
    const qa = block.match(/^qa=QA-(\d{5,7})\s*$/m);
    if (qa && /^status=active\s*$/m.test(block)) out.push(qa[1]);
  }
  return out;
}
function evaluatePicture(text, turnEvents, tickets) {
  if (!text || BYPASS.test(text)) return { verdict: 'pass', reason: 'no-text-or-bypass' };
  const plain = text.replace(/```[\s\S]*?```/g, '');
  const ticket = (tickets || []).find(n => new RegExp('(^|[^0-9])' + n + '([^0-9]|$)').test(plain));
  if (!ticket) return { verdict: 'pass', reason: 'not-a-quest-reply' };
  if (DIAGRAM_NONE_RE.test(plain)) return { verdict: 'pass', reason: 'diagram-none-stated' };
  const sent = (turnEvents || []).some(e => e.kind === 'tool' && e.name === 'SendUserFile' && IMAGE_SEND_RE.test(e.input || ''));
  if (sent) return { verdict: 'pass', reason: 'picture-sent' };
  return { verdict: 'block', reason: 'quest-no-picture', ticket };
}
function lastTurnEvents(tp) {
  try {
    const { parse, turns } = require(path.join(ROOT, 'lib', 'adhoc-brief-first.js'));
    const t = turns(parse(tp));
    return t.length ? t[t.length - 1].events : [];
  } catch (_) { return null; }
}
// content words reduced to a short stem, so "ending" meets "end" no better than any other word: the first 5 letters of words of 4+ letters
const STOP = new Set(['with', 'from', 'that', 'this', 'your', 'what', 'when', 'will', 'have', 'them', 'they', 'then', 'only', 'into', 'about', 'after', 'before', 'there', 'their', 'which', 'would', 'could', 'should', 'each', 'every', 'more', 'than', 'also', 'here', 'just', 'like', 'make', 'look']);
function stems(s) { return (String(s).toLowerCase().match(/[a-zÀ-ɏ]{4,}/g) || []).filter(w => !STOP.has(w)).map(w => w.slice(0, 5)); }

if (require.main === module) {
  let input = '';
  process.stdin.resume(); process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => input += d);
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input || '{}');
      if (data.stop_hook_active) process.exit(0);
      const text = typeof data._testText === 'string' ? data._testText : lastText(data.transcript_path || '');
      const r = evaluate(text);
      if (r.verdict !== 'block') {
        const ev = Array.isArray(data._testTurn) ? data._testTurn : lastTurnEvents(data.transcript_path || '');
        const tk = Array.isArray(data._testTickets) ? data._testTickets : activeTickets(path.join(ROOT, 'quest', 'active.txt'));
        const p = ev === null ? { verdict: 'pass', reason: 'no-transcript' } : evaluatePicture(text, ev, tk);
        if (p.verdict !== 'block') { log({ action: 'passed', reason: r.reason, picture: p.reason }); process.exit(0); }
        log({ action: 'blocked', reason: p.reason, detail: p.ticket });
        process.stderr.write([
          `⛔ next-steps-shape: this ${p.ticket} quest reply stops with no picture of the issue sent this turn.`,
          '   Draw the issue (urusan flow, the value of concern and the changed step marked; options side by side when he decides)',
          '   with the explain-diagram skill (render: node lib/diagram-render.js), Read the PNG, then send it with SendUserFile',
          '   (miya 2026-10-29 / 2026-10-30: every quest stop shows the issue as a picture).',
          '   Nothing to draw this round? One line instead: Diagram: none (<reason>).',
          '   ⚡ DELTA ONLY: send just the picture, not the whole reply.',
        ].join('\n') + '\n');
        process.exit(2);
      }
      log({ action: 'blocked', reason: r.reason, detail: r.rows || r.header });
      process.stderr.write([
        r.reason === 'row-not-explained-above'
          ? '⛔ next-steps-shape: a Next steps row has no section above that explains it. He scrolls back from the row and finds nothing.'
          : '⛔ next-steps-shape: your Next steps table does not tell みや what each row means.',
        r.reason === 'no-meaning-column'
          ? '   Missing column. Use: | # | Action | What it means | Your reply |'
          : r.reason === 'row-not-explained-above'
            ? `   Give each of these its own heading above, in the row's own words (or reword the row to the heading that explains it): ${r.rows.join(' · ')}`
            : `   Rows with a meaning shorter than 5 words: ${r.rows.join(', ')}`,
        '   "What it means" = ONE plain sentence: what the item is and why it needs him.',
        '   No hook names, watch ids, row codes (L16) or line numbers in that cell.',
        '   ⚡ DELTA ONLY: re-send just the corrected Next steps table, not the whole reply.',
        '   Bypass: [skip-next-steps-shape: <reason>]',
      ].join('\n') + '\n');
      process.exit(2);
    } catch (_) { process.exit(0); }
  });
}

module.exports = { evaluate, evaluatePicture, activeTickets };
