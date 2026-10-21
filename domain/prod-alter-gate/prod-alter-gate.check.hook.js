#!/usr/bin/env node
// prod-alter-gate.check.hook.js — born via core/forge.js (2026-10-21)
// TRIGGER: a Bash/PowerShell command runs FlowableAlter alter.js on an approval env (prod) without --dry-run/--login
// ACTION: BLOCK unless the command carries --approve <code> AND miya's LAST chat message approves that same code
//
// The code comes from `alter.js ... --dry-run` on prod: it seals the exact plan (ID, process, target, flows, variables)
// in E:\Dev\scripts\FlowableAlter\logs\plans\<code>.json; alter.js itself refuses a real run whose live page differs
// from that plan, a used code, an edited plan file, or a code older than 60 minutes. This hook adds the human half:
// the code must appear in miya's own last message with an approval word (or as his answer to an approval popup).
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = process.env.PROD_ALTER_GATE_LOG || path.join(__dirname, 'log.jsonl');

const ENVS_FILE = process.env.FLOWABLE_ALTER_CONFIG || 'E:/Dev/scripts/FlowableAlter/envs.json';
function approvalEnvs() {
  try {
    const cfg = JSON.parse(fs.readFileSync(ENVS_FILE, 'utf8'));
    const out = new Set(['prod']);
    for (const st of Object.values(cfg)) for (const [k, v] of Object.entries(st.envs || {})) if (v.approval) out.add(k.toLowerCase());
    return out;
  } catch (_) { return new Set(['prod']); }
}

const NODE = /\bnode(?:\.exe)?\b/i;
const ALTER = /(?:^|[\s"'\\/])alter\.js(?=[\s"']|$)/i;          // alter.js, not alter-links.js
const SAFE = /(?:^|\s)--(?:dry-run|login|help)(?=\s|$|["'])/i;
const APPROVE_ARG = /--approve[\s=]+["']?([0-9A-Fa-f]{4}-?[0-9A-Fa-f]{4})(?![0-9A-Fa-f])/;
// split on shell separators so `node alter.js --dry-run; node alter.js --env prod ...` is judged per command
const segments = cmd => String(cmd).split(/\r?\n|;|&&|\|\||\|/).map(s => s.trim()).filter(Boolean);

// miya's approval: the code (dash optional) + an approval word, no negation in the same sentence
const APPROVAL_WORD = /\b(?:approve[ds]?|approval|lulus(?:kan)?|go(?: ahead)?|proceed|run it|yes|ok(?:ay)?|setuju|boleh)\b/i;
const NEGATION = /\b(?:don'?t|do not|jangan|never|not|wait|hold|stop|cancel|tak|tidak|no)\b/i;
const POPUP_ANSWER = /^\s*Your questions have been answered:/;

function lastUserText(transcriptPath) {
  let tail = '';
  try {
    const size = fs.statSync(transcriptPath).size, want = 600000;
    const fd = fs.openSync(transcriptPath, 'r'); const buf = Buffer.alloc(Math.min(size, want));
    fs.readSync(fd, buf, 0, buf.length, Math.max(0, size - buf.length)); fs.closeSync(fd);
    tail = buf.toString('utf8');
  } catch (_) { return ''; }
  const lines = tail.split('\n').filter(l => /"type"\s*:\s*"user"/.test(l));
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj; try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
    if (obj && obj.isMeta) continue;                                   // harness-injected, not typed by him
    const c = obj && obj.message && obj.message.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) {
      const texts = c.filter(x => x && x.type === 'text').map(x => x.text);
      if (texts.length) return texts.join('\n');
      for (const x of c) {                                              // an AskUserQuestion answer IS his reply
        if (!x || x.type !== 'tool_result') continue;
        const t = typeof x.content === 'string' ? x.content
          : Array.isArray(x.content) ? x.content.filter(y => y && y.type === 'text').map(y => y.text).join('\n') : '';
        if (POPUP_ANSWER.test(t)) return [...t.matchAll(/"="([^"]*)"/g)].map(m => m[1]).join('\n'); // answers only
      }
      return '';                                                        // a plain tool_result turn: nothing he typed
    }
  }
  return '';
}

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
  if (!cmd || !NODE.test(cmd) || !ALTER.test(cmd)) return { fired: false };
  const envs = approvalEnvs();
  const isEnv = s => [...envs].some(e => new RegExp(`(?<![\\w-])${e}(?![\\w-])`, 'i').test(s));
  // inline code (node -e / --eval / -p) can hide shell separators inside its string: judge the whole command as one
  const units = /\bnode(?:\.exe)?\s+(?:-e|--eval|-p|--print)\b/i.test(cmd) ? [cmd] : segments(cmd);
  const risky = units.filter(s => ALTER.test(s) && !SAFE.test(s) && isEnv(s));
  if (!risky.length) return { fired: false };

  const last = data.transcript_path ? lastUserText(String(data.transcript_path)) : '';
  for (const seg of risky) {
    const m = seg.match(APPROVE_ARG);
    if (!m) {
      logRow({ outcome: 'blocked', why: 'no --approve', cmd: seg.slice(0, 200) });
      return { fired: true, blocked: true, blockReason: [
        '⛔ prod-alter-gate: this runs alter.js on PROD with no --approve <code>.',
        '   1. Run the same command with --dry-run. It prints the plan and an APPROVAL CODE.',
        '   2. Show miya the plan (ID · action · process · target · Previous/Next flows · variables) and the code.',
        '   3. Run again with --approve <code> only after his own message approves that code.',
      ].join('\n') };
    }
    if (!approves(last, m[1])) {
      logRow({ outcome: 'blocked', why: 'code not approved by miya', code: norm(m[1]), last_user: last.slice(0, 160) });
      return { fired: true, blocked: true, blockReason: [
        `⛔ prod-alter-gate: approval code ${m[1]} is not approved in miya's LAST message.`,
        `   last user message: "${last.replace(/\s+/g, ' ').slice(0, 160) || '(none)'}"`,
        '   Show him the plan + code and wait for his "approve <code>" (or his pick in an approval popup). Never reuse an older approval.',
      ].join('\n') };
    }
  }
  logRow({ outcome: 'allowed', codes: risky.map(s => norm((s.match(APPROVE_ARG) || [])[1])), last_user: last.slice(0, 160) });
  return { fired: true, blocked: false, contextOut: 'prod-alter-gate: PROD alter approved by miya (code in his last message)\n' };
}

if (require.main === module) {
  runHook({ name: 'prod-alter-gate', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }
    return judge(data);
  });
}
module.exports = { approves, lastUserText, judge };
