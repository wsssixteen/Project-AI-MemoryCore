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
// a line continuation (` or \ at line end) joins first, so a wrapped run stays one command; a single & also separates
const segments = cmd => String(cmd).replace(/[`\\]\r?\n/g, ' ').split(/\r?\n|;|&&?|\|\||\|/).map(s => s.trim()).filter(Boolean);

// ── run detection (2026-11-24, 290196 + Fable rounds 3-4): one quote-aware pass, fail closed ──
// here-string / heredoc bodies are text, never run; a line continuation joins; split on ; & | newline outside quotes
function runUnits(cmd) {
  const s = String(cmd).replace(/@'\r?\n[\s\S]*?\r?\n'@/g, "''").replace(/<<-?\s*['"]?(\w+)['"]?\r?\n[\s\S]*?\r?\n\1\b/g, '')
    .replace(/[`\\]\r?\n/g, ' ');
  const out = []; let cur = '', q = '';
  for (const ch of s) {
    if (q) { if (ch === q) q = ''; cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === ';' || ch === '&' || ch === '|' || ch === '\n' || ch === '\r') { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(u => u.trim()).filter(Boolean);
}
// quoted bodies blanked, except a double-quoted string that holds $( ) (PowerShell runs it); a trailing # comment dropped
const masked = u => u.replace(/'[^']*'/g, "''").replace(/"(?:[^"$]|\$(?!\())*"/g, '""').replace(/\s#.*$/, '');
const READ_HEAD = /^\s*(?:\$\w+\s*=\s*\$\w+\.Replace\(|\(Get-Content\b[^)]*\)\s*-replace|(?:Set|Add)-Content\b|Out-File\b|echo\b|Write-(?:Output|Host)\b|Select-String\b|sls\b|grep\b|rg\b|findstr\b|git\b|Get-Content\b|cat\b)/i;
function isRun(u, cmd) {
  const m = masked(u);
  const alterish = ALTER.test(u) || /FlowableAlter[\\/]alter(?=[\s"']|$)/i.test(u)
    || (/\bnode(?:\.exe)?["']?\s+(?:--?[\w-]+\s+)*["']?\$\w+/i.test(u) && ALTER.test(cmd))      // node $f, $f = ...alter.js
    || (/\bnode(?:\.exe)?\s+\.(?=\s|$)/i.test(u) && /FlowableAlter/i.test(cmd));               // node . in the tool folder
  if (!alterish) return false;
  const invoked = NODE.test(u) || /^\s*&?\s*\$\w+\s+/.test(u);                                // node ... or & $node ...
  if (!invoked) return false;
  // node runs another script that only takes alter.js as an argument (keeper.js --note alter.js, an eval file): not a run
  const scripts = [...u.matchAll(/\bnode(?:\.exe)?["']?\s+(?:-{1,2}[\w-]+(?:=\S+)?\s+)*["']?([^\s"']+)/gi)].map(x => x[1]);
  if (scripts.length && !/^\s*&?\s*\$\w+\s+/.test(u)
    && scripts.every(t => /\.[cm]?js$/i.test(t) && !/(?:^|[\\/])alter\.js$/i.test(t))) return false;
  if (READ_HEAD.test(u) && !/(\$\(|\(|`)[^)]*?(alter\.js|\bnode\b)/i.test(m)) return false;    // a read or text edit that only quotes it
  return true;
}
const isSafe = u => { const m = masked(u); return /(?:^|\s)--(?:dry-run|login|help|check)(?=\s|$)/i.test(m) || /alter\.js["']?\s+(?:live|help)(?=\s|$)/i.test(m); };
// a literal --env word is risky only when it is an approval env; a run with no literal env (variable, splat) is risky
function envRisky(u, envs) {
  const lit = masked(u).match(/--env[\s=]+([\w-]+)/i);
  return lit ? envs.has(lit[1].toLowerCase()) : true;
}

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
  if (!cmd || !(NODE.test(cmd) || /&\s*\$\w+/.test(cmd)) || !(ALTER.test(cmd) || /FlowableAlter/i.test(cmd))) return { fired: false };
  const envs = approvalEnvs();
  const isEnv = s => [...envs].some(e => new RegExp(`(?<![\\w-])${e}(?![\\w-])`, 'i').test(s));
  // inline code (node -e / --eval / -p) can hide shell separators inside its string: judge the whole command as one
  const evalMode = /\bnode(?:\.exe)?\s+(?:-e|--eval|-p|--print)\b/i.test(cmd);
  const risky = (evalMode ? [cmd] : runUnits(cmd)).filter(s => evalMode ? ALTER.test(s) && !SAFE.test(s) && isEnv(s) : isRun(s, cmd) && !isSafe(s) && envRisky(s, envs));
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
