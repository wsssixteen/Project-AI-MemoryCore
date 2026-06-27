/**
 * verify-basis-gate.discipline.hook.js — Stop hook
 * Power: domain/verify-basis-gate/
 *
 * PURPOSE (みや 2026-06-24, "you're lying, you didn't check flowables"): catch a claim
 *   of having VERIFIED something ("from workflow evidence", "I checked the flowables",
 *   "I confirmed by reading X") made with ZERO tool calls THIS turn — i.e. the basis
 *   was never actually performed. The exact lie: claimed L7-9 "from workflow evidence"
 *   while never reading the BPMN.
 *
 * MECHANISM: scan last assistant text for a verification-basis phrase; count tool_use
 *   blocks in the transcript since the last user message. Phrase present AND zero
 *   tools this turn → BLOCK (run the check, or downgrade to an explicit hypothesis).
 * BYPASS: [skip-verify-basis: <where it was actually verified>]
 * FALSE-POSITIVE: a claim referencing a PRIOR turn's verification with no tools this
 *   turn → blocked; resolve with the bypass token. Narrow phrases keep this rare.
 * FAIL-OPEN: any error → allow stop.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');

const BASIS = /\bfrom (the )?(workflow|flowable|bpmn|code|db|database)s? evidence\b|\bI (checked|read|verified|confirmed|reviewed|traced) (the )?(flowable|bpmn|workflow|code|db|database|repo|history|file|entitie|entity)s?\b|\bbased on (the )?(workflow|flowable|bpmn|code|db)s? evidence\b|\bper (the )?(flowable|bpmn|workflow)s?\b/i;
const BYPASS = /\[skip-verify-basis:/;

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

function parse(tp) {
  let raw; try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return null; }
  const lines = raw.split(/\r?\n/).filter(Boolean).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean);
  let lastUser = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].message || lines[i];
    if ((m.role || lines[i].type) === 'user') { lastUser = i; break; }
  }
  let tools = 0, text = '';
  for (let i = Math.max(0, lastUser); i < lines.length; i++) {
    const m = lines[i].message || lines[i];
    if ((m.role || lines[i].type) !== 'assistant') continue;
    const c = m.content;
    if (Array.isArray(c)) { for (const b of c) { if (b && b.type === 'tool_use') tools++; if (b && b.type === 'text' && b.text) text = b.text; } }
    else if (typeof c === 'string') text = c;
  }
  return { tools, text };
}

let input = '';
process.stdin.resume(); process.stdin.setEncoding('utf8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    if (data.stop_hook_active) process.exit(0);
    const r = parse(data.transcript_path || '');
    if (!r || !r.text) process.exit(0);
    if (BYPASS.test(r.text)) process.exit(0);
    if (!BASIS.test(r.text)) process.exit(0);
    if (r.tools > 0) { log({ action: 'passed', tools: r.tools }); process.exit(0); }
    log({ action: 'blocked' });
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: [
        '⛔ verify-basis-gate: you claimed a verification ("from … evidence" / "I checked the flowable/code/DB")',
        '   but ran ZERO tools this turn — so that basis was NOT performed this turn.',
        '   → RUN the check now (read the BPMN / grep / query), OR downgrade the claim to an explicit',
        '     hypothesis ("I have NOT verified this — to confirm I would read X"). Then end the turn.',
        '   Genuinely verified in an earlier turn? Add [skip-verify-basis: <where>].',
      ].join('\n'),
    }));
    process.exit(0);
  } catch (e) { process.exit(0); }
});
