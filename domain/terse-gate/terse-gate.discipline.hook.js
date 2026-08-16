/**
 * terse-gate.discipline.hook.js — Stop hook
 * Power: domain/terse-gate/
 *
 * PURPOSE (みや 2026-06-24, "you're still blabbering stupidly"): block a reply that is
 *   a PROSE WALL — many long prose lines instead of tables/diagrams/short bullets.
 *   Sibling of show-gate (which fires only on change/finding signals); this fires on
 *   general verbosity regardless of content.
 *
 * SIGNAL: count "heavy prose lines" = trimmed lines > 150 chars that are NOT a table
 *   row (start with '|'), NOT a diagram line (box/arrow chars), outside code fences.
 *   heavy >= 6 → BLOCK ("convert to tables/diagrams").
 * EXEMPT: short replies (< 800 chars) · DE/closing/personal (═══ · るり結界 · Domain Expansion)
 *   · bypass token [skip-terse: <reason>].
 * FAIL-OPEN: any error → allow stop.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');
const EXEMPT = /\[skip-terse:|═══|るり結界|Domain Expansion/;
const BOX = /[┌┐└┘├┤┬┴┼─│→↓►]/;

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

let input = '';
process.stdin.resume(); process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) process.exit(0);
    const text = lastText(data.transcript_path || '');
    if (!text || text.length < 800) process.exit(0);
    if (EXEMPT.test(text)) process.exit(0);
    const noCode = text.replace(/```[\s\S]*?```/g, '');
    let heavy = 0;
    for (const ln of noCode.split(/\r?\n/)) {
      const s = ln.trim();
      if (s.length <= 150) continue;
      if (s.startsWith('|')) continue;   // table row
      if (BOX.test(s)) continue;         // diagram/arrow line
      heavy++;
    }
    if (heavy < 6) { log({ action: 'passed', heavy }); process.exit(0); }
    log({ action: 'blocked', heavy });
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: [
        '⛔ terse-gate: ' + heavy + ' long prose lines (>150 chars) — that is blabbering.',
        '   Convert the load-bearing content to TABLES / DIAGRAMS / short bullets (one concern per cell).',
        '   A long-winding message is itself a rule violation even when every fact is correct.',
        '   Genuinely must be prose (personal / closing voice)? Add [skip-terse: <reason>].',
        '   ⚡ DELTA ONLY: みや already read the reply above — output the fix/token in 1-2 lines; do NOT re-emit the reply.',
      ].join('\n'),
    }));
    process.exit(0);
  } catch (e) { process.exit(0); }
});
