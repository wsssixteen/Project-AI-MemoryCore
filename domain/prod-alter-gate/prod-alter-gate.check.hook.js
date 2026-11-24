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

// miya's approval (round 6, 2026-11-24): an approval word right next to the code, never a loose "go/ok/yes" elsewhere
// in the sentence; a negation counts only right before that word; a question about the code is never an approval
const { hisMessages } = require(path.join(ROOT, 'lib', 'his-words.js'));
const HOLD = /\b(?:wait|hold|stop|cancel|don'?t run|do not run|jangan|belum)\b/i;
const norm = c => String(c || '').replace(/-/g, '').toUpperCase();
function approves(text, code) {
  const t = String(text || '');
  const c = norm(code);
  if (!/^[0-9A-F]{8}$/.test(c)) return false;
  const hit = new RegExp('(?<![0-9A-F])' + c.slice(0, 4) + '-?' + c.slice(4) + '(?![0-9A-F])', 'i').exec(t);
  if (!hit) return false;
  const tail = t.slice(hit.index + hit[0].length);
  const end = tail.search(/[.\n?]/);
  if (end >= 0 && tail[end] === '?') return false;                                    // "what does <code> do?"
  const before = t.slice(Math.max(0, hit.index - 60), hit.index);
  const after = tail.slice(0, 30);
  const wordBefore = /\b(approve[ds]?|approval|lulus(?:kan)?|setuju)\b[\s:,-]*(?:the\s+)?(?:code\s*)?$/i.exec(before);
  if (wordBefore && /\b(?:don'?t|do not|not|never|jangan|tak|tidak|no|belum)\s+(?:yet\s+)?$/i.test(before.slice(0, wordBefore.index))) return false;
  const wordAfter = /^[\s:,-]*(?:is\s+)?(?:approved|lulus|diluluskan)\b/i.test(after);
  const lineBefore = /(?:^|[\n.!])\s*(?:yes|approved|ok|lulus)[.!,]?\s*$/i.test(before) && /^[\s.!]*(?:$|\n)/.test(after);
  return !!wordBefore || wordAfter || lineBefore;
}

function logRow(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) { /* never block on logging */ } }

// a real record path: 8 hex + the record suffix, a wildcard, or a code built in a script (template or + concat)
const RECORD = /(?:[0-9A-F]{8}|\*|\}|\$\w+|\+\s*['"\x60])\.?miya(?:\.used)?\.json/i;
const fresh = (rec, created) => { const at = Date.parse(rec && rec.ts); return at >= Date.parse(created) && (Date.now() - at) / 60000 <= 60; };

function judge(data) {
  if (!/^(Bash|PowerShell)$/.test(String(data.tool_name || ''))) return { fired: false };
  const cmd = String((data.tool_input && data.tool_input.command) || '');
  // 1. an approval record is written by this hook from his own message only; a command that touches one is refused
  if (RECORD.test(cmd)) {
    logRow({ outcome: 'blocked', why: 'touches an approval record', cmd: cmd.slice(0, 200) });
    return { fired: true, blocked: true, blockReason: [
      '⛔ prod-alter-gate: this command touches a <code>.miya.json approval record.',
      '   Only this hook writes it, from miya\'s own message that approves the code. Show him the plan and code instead.',
    ].join('\n') };
  }
  // 2. his last 3 messages, newest first: a hold stops the scan; the first message that approves a sealed plan code,
  //    sent AFTER that plan was sealed, writes <code>.miya.json stamped with the message's own time. The tool refuses a
  //    run with --approve without a fresh record (the check sits in the tool; no command is parsed for runs here).
  const msgs = data.transcript_path ? hisMessages(String(data.transcript_path), { limit: 3 }) : [];
  const written = [], seen = new Set();
  for (const msg of msgs) {
    const text = String(msg.text || '');
    for (const m of text.matchAll(/(?<![0-9A-F])([0-9A-F]{4})-?([0-9A-F]{4})(?![0-9A-F])/gi)) {
      const code = (m[1] + m[2]).toUpperCase();
      if (seen.has(code)) continue;
      seen.add(code);                                                                  // the newest message naming it decides
      const planF = path.join(PLANS, code + '.json'), mark = path.join(PLANS, code + '.miya.json');
      if (!fs.existsSync(planF) || !approves(text, code)) continue;
      let plan = {}, rec = null;
      try { plan = JSON.parse(fs.readFileSync(planF, 'utf8')); } catch (_) { continue; }
      try { rec = JSON.parse(fs.readFileSync(mark, 'utf8')); } catch (_) { rec = null; }
      if (rec && fresh(rec, plan.created)) continue;                                    // a valid record stays
      if (!msg.ts || !(Date.parse(msg.ts) >= Date.parse(plan.created))) continue;        // his words came before this plan
      if ((Date.now() - Date.parse(msg.ts)) / 60000 > 60) continue;
      try {
        fs.writeFileSync(mark, JSON.stringify({ code, ts: msg.ts, his: text.replace(/\s+/g, ' ').slice(0, 200) }, null, 2));
        written.push(code);
      } catch (_) { /* the tool then refuses the run: fail closed */ }
    }
    if (HOLD.test(text) && !written.length) break;                                       // "wait" after an approval: stop
  }
  if (!written.length) return { fired: false };
  logRow({ outcome: 'approval-recorded', codes: written });
  return { fired: true, blocked: false, contextOut: 'prod-alter-gate: miya approved ' + written.map(c => c.slice(0, 4) + '-' + c.slice(4)).join(', ') + ' in his own message; the run with --approve may go\n' };
}

if (require.main === module) {
  runHook({ name: 'prod-alter-gate', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }
    return judge(data);
  });
}
module.exports = { approves, judge };
