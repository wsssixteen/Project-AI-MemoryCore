#!/usr/bin/env node
// next-steps-shape.check.hook.js — born via core/forge.js (2026-09-30); back gate of domain/pre-reply-contract
// symptom: 2026-09-30 miya: "not sure what you're talking about. Please fix this behaviour. next steps without short explanation."
//          (rows "Rule the 11 overdue watches (ok or anomaly)" · "PPJK and PSBS guards at line 647" carried jargon, no meaning)
// goal: every Next steps row tells miya in plain words what the item is and why it needs him
// SIGNAL: last assistant text has a "Next steps" heading followed by a markdown table
// BLOCK: header has no "What it means" column, OR any row's meaning cell has < 5 words
// PASS: no Next steps table · table carries the column with a >= 5-word meaning on every row
// BYPASS: [skip-next-steps-shape: <reason>] · FAIL-OPEN on any error
// Runs inside the stop-reply-shape bundle (lib/dispatch-hooks.js), not a standalone registration (system-rules Rule 7)
// Log: domain/next-steps-shape/log.jsonl
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');
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
  return { verdict: 'pass', reason: 'shape-ok' };
}

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
      if (r.verdict !== 'block') { log({ action: 'passed', reason: r.reason }); process.exit(0); }
      log({ action: 'blocked', reason: r.reason, detail: r.rows || r.header });
      process.stderr.write([
        '⛔ next-steps-shape: your Next steps table does not tell みや what each row means.',
        r.reason === 'no-meaning-column'
          ? '   Missing column. Use: | # | Action | What it means | Your reply |'
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

module.exports = { evaluate };
