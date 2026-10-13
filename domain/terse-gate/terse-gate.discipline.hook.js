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
 * SIGNAL 2 (miya 2026-10-06, #268173, "too long, I just wanted the answer"): a SHORT QUESTION gets a SHORT ANSWER.
 *   His last message is <= 300 chars and is a question (ends with ? or opens with why/how/what/where/is/are/does/do/can/will)
 *   and does not itself ask for a list/table/steps/detail/code, and the reply has more than 15 non-empty lines
 *   outside code fences -> BLOCK. Tables do not exempt it:
 *   a whole investigation moved into tables passed signal 1 all day. Bypass [skip-terse: he asked for the detail].
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

// Last thing miya typed: a user entry with real text (tool results and reminder-only entries are skipped).
function lastUserText(tp) {
  let raw; try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return ''; }
  const L = raw.split(/\r?\n/).filter(Boolean);
  for (let i = L.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    const m = o.message || o;
    if ((m.role || o.type) !== 'user') continue;
    const c = m.content; let t = '';
    if (typeof c === 'string') t = c;
    else if (Array.isArray(c)) t = c.filter(b => b && b.type === 'text').map(b => b.text).join('\n');
    t = t.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
    if (t) return t;
  }
  return '';
}
const QUESTION = /\?\s*$|^(why|how|what|where|which|is|are|does|do|did|can|will|so)\b/i;
// He asked for something that is long by nature: no cap.
const WANTS_DETAIL = /\b(list|board|tickets?|table|steps?|scenario|brief|status|summary|detail(s|ed)?|full|everything|all|explain|audit|compare|plan|code|script|show|walk|trace|draft|write)\b/i;

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
    const ask = lastUserText(data.transcript_path || '');
    const lines = noCode.split(/\r?\n/).filter(l => l.trim() && !/^\s*\[(skip|verified|genuine)-/.test(l)).length;
    if (heavy < 6 && ask && ask.length <= 300 && QUESTION.test(ask) && !WANTS_DETAIL.test(ask) && lines > 15) {
      log({ action: 'blocked-short-question', lines, ask_len: ask.length });
      process.stdout.write(JSON.stringify({ decision: 'block', reason: [
        '⛔ terse-gate: he asked a short question and the reply is ' + lines + ' lines (cap 15).',
        '   Answer it in a few lines. Investigation, evidence and extras stay in the quest doc until he asks.',
        '   He did ask for the detail? Add [skip-terse: <what he asked for>].',
        '   ⚡ DELTA ONLY: output the short answer in 1-5 lines; do NOT re-emit the reply.',
      ].join('\n') }));
      process.exit(0);
    }
    if (heavy < 6) { log({ action: 'passed', heavy, lines }); process.exit(0); }
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
