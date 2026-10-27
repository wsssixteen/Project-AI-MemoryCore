#!/usr/bin/env node
// handover-check-gate.check.hook.js — born via core/forge.js (2026-10-27); back gate of lib/handover-check.js
// symptom: 286462 (2026-10-27): the hand-over check existed only as a skill line, so nothing forced it to run;
//          the note also went to the Reports PIC (Fatin), not TL Nurhayati Abdul Razak (kak Yati)
// goal: no Redmine hand-over draft reaches miya unless lib/handover-check.js passed on it,
//       and every Reports hand-over is addressed to kak Yati
// SIGNAL: last assistant text has a "Salam <name>" line AND a table whose header has a Sepatutnya/Expected column
// BLOCK: no "HANDOVER-CHECK: 0 finding(s)" line in the same reply · OR the draft names a .jrxml and is not greeted to kak Yati
// PASS: no hand-over draft · draft + clean check line (+ kak Yati when .jrxml)
// BYPASS: [skip-handover-check: <reason>] · FAIL-OPEN on any error
// Runs inside the stop-reply-shape bundle (lib/dispatch-hooks.js), not a standalone registration (system-rules Rule 7)
// Log: domain/handover-check-gate/log.jsonl
'use strict';
const fs = require('fs');
const path = require('path');
const LOG = path.resolve(__dirname, 'log.jsonl');
const BYPASS = /\[skip-handover-check:\s*[^\]\s][^\]]*\]/i;
const GREET = /^\s*Salam\s+(.+?)[,.]?\s*$/im;
const EXPECTED_HEAD = /^\s*\|.*\b(sepatutnya|expected|dijangka)\b.*\|\s*$/im;
const CLEAN = /HANDOVER-CHECK:\s*0 finding/i;

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

function evaluate(text) {
  if (!text) return { verdict: 'pass', reason: 'no-text' };
  if (BYPASS.test(text)) return { verdict: 'pass', reason: 'bypass' };
  const g = text.match(GREET);
  if (!g || !EXPECTED_HEAD.test(text)) return { verdict: 'pass', reason: 'no-handover-draft' };
  const problems = [];
  if (!CLEAN.test(text)) problems.push('no clean check line: run `node lib/handover-check.js --brief "<Task folder>\\1. Brief" --draft <note.txt>`, fix every finding, and paste its EXPECTED SOURCE line and "HANDOVER-CHECK: 0 finding(s)" under the draft');
  if (/\.jrxml\b/i.test(text) && !/kak\s+yati/i.test(g[1])) problems.push(`a Reports (.jrxml) hand-over goes to the Reports TL first: Assignee Nurhayati Abdul Razak, note opens "Salam kak Yati," (greeted now: "${g[1].trim()}")`);
  return problems.length ? { verdict: 'block', reason: problems.join(' | '), greet: g[1].trim() } : { verdict: 'pass', reason: 'clean' };
}

function main() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch (_) {}
  if (input.stop_hook_active) return;
  const r = evaluate(input.transcript_path ? lastText(input.transcript_path) : null);
  log({ verdict: r.verdict, reason: r.reason.slice(0, 200) });
  if (r.verdict === 'block') {
    process.stdout.write(JSON.stringify({ decision: 'block', reason: '⛔ handover-check-gate: the hand-over draft in this reply is not checked.\n   ' + r.reason.split(' | ').join('\n   ') + '\n   ⚡ DELTA ONLY: re-send the corrected draft with the check lines, not the whole reply.\n   Not a hand-over draft? [skip-handover-check: <reason>]' }));
  }
}

if (require.main === module) { try { main(); } catch (_) { /* fail-open */ } }
module.exports = { evaluate };
