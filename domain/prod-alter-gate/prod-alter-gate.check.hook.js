#!/usr/bin/env node
// prod-alter-gate.check.hook.js — born via core/forge.js (2026-10-21)
// TRIGGER: every Bash/PowerShell call (cheap: one read of his last message)
// ACTION: (1) his own message approves a sealed plan code -> write logs\plans\<code>.miya.json; (2) BLOCK a command that
//   touches a .miya.json record. The alter tool refuses a no-terminal run with --approve <code> unless that record exists,
//   so the check sits in the tool and every way of starting it meets the check; no command is parsed for runs
//   (2026-11-24, session audit: the shell-text parser missed run shapes and blocked reads over 5 Fable rounds).
//   The plan seal, single use and the 60-minute limit stay in the tool.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = process.env.PROD_ALTER_GATE_LOG || path.join(__dirname, 'log.jsonl');

const PLANS = process.env.FLOWABLE_ALTER_PLANS || 'E:/Dev/scripts/FlowableAlter/logs/plans';

// miya's approval: the code (dash optional) + an approval word, no negation in the same sentence
const APPROVAL_WORD = /\b(?:approve[ds]?|approval|lulus(?:kan)?|go(?: ahead)?|proceed|run it|yes|ok(?:ay)?|setuju|boleh)\b/i;
const NEGATION = /\b(?:don'?t|do not|jangan|never|not|wait|hold|stop|cancel|tak|tidak|no)\b/i;
const { lastHis } = require(path.join(ROOT, 'lib', 'his-words.js'));
const lastUserText = lastHis; // his last message only (PROD safety); injected lines never replace it

const norm = c => String(c || '').replace(/-/g, '').toUpperCase();
function approves(text, code) {
  const t = String(text || '');
  const c = norm(code);
  if (!/^[0-9A-F]{8}$/.test(c)) return false;
  const hit = new RegExp(`(?<![0-9A-F])${c.slice(0, 4)}-?${c.slice(4)}(?![0-9A-F])`, 'i').exec(t);
  if (!hit) return false;
  // judge only the sentence that carries the code
  const start = Math.max(t.lastIndexOf('.', hit.index), t.lastIndexOf('\n', hit.index), t.lastIndexOf('?', hit.index)) + 1;
  const rest = t.slice(hit.index + hit[0].length);
  const end = rest.search(/[.\n?]/);
  const sentence = t.slice(start, hit.index + hit[0].length + (end < 0 ? rest.length : end));
  if (/\?\s*$/.test(t.slice(start, hit.index + hit[0].length + (end < 0 ? rest.length : end + 1)))) return false; // a question about the code
  return APPROVAL_WORD.test(sentence) && !NEGATION.test(sentence);
}

function logRow(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) { /* never block on logging */ } }

function judge(data) {
  if (!/^(Bash|PowerShell)$/.test(String(data.tool_name || ''))) return { fired: false };
  const cmd = String((data.tool_input && data.tool_input.command) || '');
  // 1. an approval record is written by this hook from his own message only; a command that touches one is refused
  if (/\.miya(?:\.used)?\.json/i.test(cmd)) {
    logRow({ outcome: 'blocked', why: 'touches an approval record', cmd: cmd.slice(0, 200) });
    return { fired: true, blocked: true, blockReason: [
      '⛔ prod-alter-gate: this command touches a <code>.miya.json approval record.',
      '   Only this hook writes it, from miya\'s own message that approves the code. Show him the plan and code instead.',
    ].join('\n') };
  }
  // 2. his last message approves a sealed plan code → write <code>.miya.json; alter.js refuses a no-terminal live-site
  //    run without it (the check lives in the tool, so no run shape escapes it and no read is ever blocked here)
  const last = data.transcript_path ? lastUserText(String(data.transcript_path)) : '';
  const written = [];
  for (const m of String(last).matchAll(/(?<![0-9A-F])([0-9A-F]{4})-?([0-9A-F]{4})(?![0-9A-F])/gi)) {
    const code = (m[1] + m[2]).toUpperCase();
    const plan = path.join(PLANS, `${code}.json`);
    const mark = path.join(PLANS, `${code}.miya.json`);
    if (!fs.existsSync(plan) || fs.existsSync(mark) || !approves(last, code)) continue;
    try {
      fs.writeFileSync(mark, JSON.stringify({ code, ts: new Date().toISOString(), his: last.replace(/\s+/g, ' ').slice(0, 200) }, null, 2));
      written.push(code);
    } catch (_) { /* the tool then refuses the run: fail closed */ }
  }
  if (!written.length) return { fired: false };
  logRow({ outcome: 'approval-recorded', codes: written, last_user: last.slice(0, 160) });
  return { fired: true, blocked: false, contextOut: `prod-alter-gate: miya approved ${written.map(c => c.slice(0, 4) + '-' + c.slice(4)).join(', ')} in his own message; the run with --approve may go\n` };
}

if (require.main === module) {
  runHook({ name: 'prod-alter-gate', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }
    return judge(data);
  });
}
module.exports = { approves, lastUserText, judge };
