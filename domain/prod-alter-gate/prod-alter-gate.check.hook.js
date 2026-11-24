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

// miya's approval (round 7, 2026-11-24): an EXACT line, nothing else in it: "approve <code>" (also: approved / lulus /
// luluskan / setuju, an optional "the" / "plan" / "alter" / "code" between, "<code> approved"), quotes or backticks
// around the code allowed. A typed message must be only that line; a popup answer counts per picked option. Free text
// ("I can't approve X yet", a pasted tool line) never records (rounds 5-7: reading free text for intent never plateaued).
const { hisMessages, isInjected } = require(path.join(ROOT, 'lib', 'his-words.js'));
const norm = c => String(c || '').replace(/-/g, '').toUpperCase();
function approvalLine(line, c) {
  const s = String(line || '').replace(/[\x60"'*_]/g, '').replace(/\(recommended\)\s*$/i, '').replace(/[.!\s]+$/, '').trim();
  const C = c.slice(0, 4) + '-?' + c.slice(4);
  return new RegExp('^(?:approved?|lulus(?:kan)?|setuju)\\s+(?:the\\s+)?(?:(?:plan|alter|code)\\s+)?' + C + '$|^' + C + '\\s+(?:approved?|lulus|diluluskan)$', 'i').test(s);
}
function approves(text, code, kind) {
  const c = norm(code);
  if (!/^[0-9A-F]{8}$/.test(c)) return false;
  const lines = String(text || '').split(kind === 'popup' ? /\n|,\s+/ : '\n').map(l => l.trim()).filter(Boolean);
  if (kind === 'popup') return lines.every(l => /^[\s\x60"'*_]*(?:approved?|lulus(?:kan)?|setuju)\s/i.test(l) || /\s(?:approved?|lulus|diluluskan)[.!\s]*$/i.test(l)) && lines.every(l => [...l.matchAll(/([0-9A-F]{4})-?([0-9A-F]{4})/gi)].some(m => approvalLine(l, (m[1] + m[2]).toUpperCase()))) && lines.some(l => approvalLine(l, c));
  return lines.length === 1 && approvalLine(lines[0], c);
}

function logRow(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) { /* never block on logging */ } }

// a real record path: 8 hex + the record suffix, a wildcard, or a code built in a script (template or + concat)
const RECORD = /(?:[0-9A-F]{8}|\}|\$\w+|\+\s*['"\x60])\.?miya(?:\.used)?\.json/i;
const fresh = (rec, created) => { const at = Date.parse(rec && rec.ts); return at >= Date.parse(created) && (Date.now() - at) / 60000 <= 60; };

// tail lines back to sinceMs, widening like lib/his-words.js does (round 10: one 400 KB read missed events)
function tailSince(tp, sinceMs) {
  let size = 0; try { size = fs.statSync(tp).size; } catch (_) { return null; }
  for (const want of [600000, 4000000, 20000000]) {
    const n = Math.min(size, want);
    let s = ''; try { const fd = fs.openSync(tp, 'r'), b = Buffer.alloc(n); fs.readSync(fd, b, 0, n, size - n); fs.closeSync(fd); s = b.toString('utf8'); } catch (_) { return null; }
    const lines = s.split('\n');
    const first = lines.slice(1).find(l => /"timestamp"/.test(l));
    let ts = NaN; try { ts = Date.parse(JSON.parse(first).timestamp); } catch (_) { /* keep widening */ }
    if (n === size || ts <= sinceMs) return lines;
  }
  return null;
}
// a popup answer with a typed note ("user notes: ...") is more than the pick (round 10: only a note is extra;
// a plan preview or a quoted word in the question is not)
function popupHasExtra(tp, ts) {
  const lines = tailSince(tp, Date.parse(ts) - 1000);
  if (!lines) return true;
  for (const l of lines) {
    if (!l.includes('questions have been answered')) continue;
    let o; try { o = JSON.parse(l); } catch (_) { continue; }
    if (o.timestamp !== ts) continue;
    const c = (o.message && o.message.content) || [];
    for (const x of Array.isArray(c) ? c : []) {
      if (!x || x.type !== 'tool_result') continue;
      const s = typeof x.content === 'string' ? x.content : Array.isArray(x.content) ? x.content.filter(y => y && y.type === 'text').map(y => y.text).join('\n') : '';
      if (/questions have been answered/.test(s)) return /\buser notes:/i.test(s);
    }
  }
  return false;
}
// his Esc interrupt or his rejection of a tool call after the approval clears it; my own tool errors and app
// notices do not (round 10: a word list over every error refused real approvals)
function newerUserEvent(tp, sinceMs) {
  const lines = tailSince(tp, sinceMs);
  if (!lines) return true;
  for (const l of lines) {
    if (!/"type"\s*:\s*"user"/.test(l)) continue;
    let o; try { o = JSON.parse(l); } catch (_) { continue; }
    if (!(Date.parse(o.timestamp) > sinceMs) || o.isMeta) continue;
    const c = o.message && o.message.content;
    const texts = typeof c === 'string' ? [c] : Array.isArray(c) ? c.filter(x => x && x.type === 'text').map(x => x.text) : [];
    if (texts.some(x => /^\s*\[Request interrupted by user/.test(x || ''))) return true;
    // any other entry of his with no words also clears it: a screenshot, a slash command, a popup note with no pick
    if (Array.isArray(c) && c.some(x => x && x.type === 'image')) return true;
    if (texts.some(x => /<command-name>/.test(x || '') || (x && x.trim() && !isInjected(x)))) return true;
    if (Array.isArray(c) && c.some(x => x && x.type === 'tool_result' && /\buser notes:/i.test(typeof x.content === 'string' ? x.content : JSON.stringify(x.content || '')))) return true;
    if (Array.isArray(c) && c.some(x => x && x.type === 'tool_result' && x.is_error && /doesn'?t want to proceed|user (?:rejected|denied|declined)|the user provided the following reason/i.test(typeof x.content === 'string' ? x.content : JSON.stringify(x.content || '')))) return true;
  }
  return false;
}

function judge(data) {
  // the terminal-panel tool can start the run too (round 9), so it meets the same check
  if (!/^(Bash|PowerShell|mcp__terminal__run_in_terminal)$/.test(String(data.tool_name || ''))) return { fired: false };
  const cmd = String((data.tool_input && data.tool_input.command) || '');
  // 1. an approval record is written by this hook from his own message only; a command that touches one is refused
  if (RECORD.test(cmd)) {
    logRow({ outcome: 'blocked', why: 'touches an approval record', cmd: cmd.slice(0, 200) });
    return { fired: true, blocked: true, blockReason: [
      '⛔ prod-alter-gate: this command touches a <code>.miya.json approval record.',
      '   Only this hook writes it, from miya\'s own message that approves the code. Show him the plan and code instead.',
    ].join('\n') };
  }
  // 2. round 9: a record lives only while his NEWEST message is the exact approval of its code, sent after the plan was
  //    sealed and under 60 minutes old. Any newer message of his (a hold, "kejap", a new topic, another code) withdraws
  //    it: no word list, no look-back window (rounds 6-9 showed every list or window leaves phrasings out). The tool
  //    refuses a run with --approve <code> without the record.
  const newest = data.transcript_path ? (hisMessages(String(data.transcript_path), { limit: 1 })[0] || null) : null;
  const now = new Set();
  if (newest) {
    for (const m of String(newest.text || '').matchAll(/(?<![0-9A-F])([0-9A-F]{4})-?([0-9A-F]{4})(?![0-9A-F])/gi)) {
      const code = (m[1] + m[2]).toUpperCase();
      const planF = path.join(PLANS, code + '.json');
      if (!fs.existsSync(planF) || !approves(newest.text, code, newest.kind)) continue;
      let plan = {}; try { plan = JSON.parse(fs.readFileSync(planF, 'utf8')); } catch (_) { continue; }
      const at = Date.parse(newest.ts);
      if (at >= Date.parse(plan.created) && (Date.now() - at) / 60000 <= 60) now.add(code);
    }
  }
  // a user event newer than his approval (an Esc interrupt, a rejected tool call carrying his reason) clears it too;
  // app notices (task notifications, system reminders) are not his and do not count
  if (now.size && newest.kind === 'popup' && popupHasExtra(String(data.transcript_path), newest.ts)) now.clear();
  if (now.size && newerUserEvent(String(data.transcript_path), Date.parse(newest.ts))) now.clear();
  const written = [], gone = [];
  let names = []; try { names = fs.readdirSync(PLANS); } catch (_) { /* no plans folder */ }
  for (const n of names) {                                                              // withdraw what he no longer says
    const mm = /^([0-9A-F]{8})\.miya\.json$/i.exec(n);
    if (!mm || now.has(mm[1].toUpperCase())) continue;
    try { fs.renameSync(path.join(PLANS, n), path.join(PLANS, n.replace(/\.miya\.json$/i, '.miya.withdrawn.json'))); gone.push(mm[1]); } catch (_) { /* leave */ }
  }
  for (const code of now) {                                                             // record what he says now
    const planF = path.join(PLANS, code + '.json'), mark = path.join(PLANS, code + '.miya.json');
    let plan = {}, rec = null;
    try { plan = JSON.parse(fs.readFileSync(planF, 'utf8')); } catch (_) { continue; }
    try { rec = JSON.parse(fs.readFileSync(mark, 'utf8')); } catch (_) { rec = null; }
    if (rec && fresh(rec, plan.created)) continue;
    try {
      fs.writeFileSync(mark, JSON.stringify({ code, ts: newest.ts, his: String(newest.text).replace(/\s+/g, ' ').slice(0, 200) }, null, 2));
      written.push(code);
    } catch (_) { /* the tool then refuses the run: fail closed */ }
  }
  if (gone.length) logRow({ outcome: 'withdrawn', codes: gone });
  if (written.length) logRow({ outcome: 'approval-recorded', codes: written });
  if (!gone.length && !written.length) return { fired: false };
  return { fired: true, blocked: false, contextOut: 'prod-alter-gate: ' + (written.length ? 'miya approved ' + written.join(', ') + ' in his newest message' : '') + (written.length && gone.length ? '; ' : '') + (gone.length ? 'approval withdrawn for ' + gone.join(', ') + ' (his newest message is not that approval)' : '') + '\n' };
}

if (require.main === module) {
  runHook({ name: 'prod-alter-gate', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }
    return judge(data);
  });
}
module.exports = { approves, judge };
