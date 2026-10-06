#!/usr/bin/env node
// Front gate (UserPromptSubmit): a close/save quest ask injects the live SAVE-QUEST verdict and the save checklist.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = process.env.SAVE_QUEST_GATE_LOG || path.join(__dirname, 'log.jsonl');

const PHRASES = [
  /\b(?:close|save|wrap|archive)\s+(?:this\s+|the\s+|that\s+)?quest\b/gi,
  /\bclose[- ]phase\b/gi,
  /\b(?:close|save|archive)\s+(?:QA[- ]?#?\d{5,6}|#\d{5,6}|ADHOC-[A-Z0-9-]+)(?![\w-])/gi,
  /\bclose\s+and\s+save\s+(?:the\s+|this\s+)?quest\b/gi,
];
const QUESTION_WORD = /\b(?:how|why|does|did|have you|what)\s/i;
const REQUEST_LEAD = /\b(?:can you|could you|would you|will you|please|pls)\s+(?:also\s+|just\s+|now\s+)?$/i;
const NEGATION_LEAD = /\b(?:don'?t|do not|never|not|without)\s+(?:yet\s+)?$/i;
const MAX_PROMPT = 1000000;
const MAX_IDS = 5;
const CHECKLIST = 'SAVE-QUEST CHECKLIST: 1 quest doc updated (resume block, test data, falsifier ledger) · 2 active.txt block updated · 3 wrong-fix rows added · 4 Task folder checked · 5 SAVE-QUEST line pasted · 6 the verdict\'s stage run (PHASE-1 / PHASE-2 / WAIT / ...) · 7 Root cause + Solution rows shown';

function stripQuoted(text) {
  return String(text)
    .replace(/<pasted_content\b[^>]*>[\s\S]*?(?:<\/pasted_content>|$)/gi, ' ')
    .replace(/```[\s\S]*?(?:```|$)/g, ' ')
    .replace(/~~~[\s\S]*?(?:~~~|$)/g, ' ')
    .replace(/`[^`\n]*`/g, ' ');
}

function normId(raw) {
  const s = String(raw).toUpperCase();
  const n = s.match(/(\d{5,6})/);
  return /^ADHOC-/.test(s) ? s.replace(/-+$/, '') : (n ? 'QA-' + n[1] : null);
}

// Returns { asked, ids } for one prompt. ids keep order of first mention.
function evaluatePrompt(prompt) {
  const text = stripQuoted(prompt);
  const ids = [];
  const addId = raw => { const id = normId(raw); if (id && !ids.includes(id)) ids.push(id); };
  let asked = false;
  for (const rx of PHRASES) {
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(text)) !== null) {
      const start = Math.max(text.lastIndexOf('.', m.index), text.lastIndexOf('!', m.index), text.lastIndexOf('?', m.index), text.lastIndexOf('\n', m.index)) + 1;
      const after = text.slice(m.index + m[0].length);
      const endRel = after.search(/[.!?\n]/);
      const sentEnd = endRel < 0 ? text.length : m.index + m[0].length + endRel;
      const prefix = text.slice(start, m.index);
      const isQuestion = text[sentEnd] === '?';
      const request = REQUEST_LEAD.test(prefix);
      if (NEGATION_LEAD.test(prefix)) continue;
      if (isQuestion && QUESTION_WORD.test(prefix) && !request) continue;
      asked = true;
      addId(m[0].match(/QA[- ]?#?\d{5,6}|#\d{5,6}|ADHOC-[A-Z0-9-]+/i) || '');
      const tail = text.slice(m.index + m[0].length, sentEnd);
      for (const n of tail.matchAll(/(?<![\w#-])#?(\d{5,6})(?!\d)/g)) addId(n[1]);
    }
  }
  if (!asked) return { asked: false, ids: [] };
  for (const n of text.matchAll(/\bQA[- ]?#?(\d{5,6})\b/gi)) addId(n[1]);
  for (const n of text.matchAll(/(?:^|[^\w&])#(\d{5,6})\b/g)) addId(n[1]);
  for (const n of text.matchAll(/\bADHOC-[A-Z0-9]+(?:-[A-Z0-9]+)*/gi)) addId(n[0]);
  return { asked: true, ids };
}

function resolveOne(id, ms) {
  const script = process.env.SAVE_QUEST_GATE_RESOLVER || path.join(ROOT, 'lib', 'save-quest.js');
  const none = { text: 'SAVE-QUEST: ' + id + ' · resolver did not answer → UNKNOWN', verdict: 'UNKNOWN' };
  try {
    const r = spawnSync(process.execPath, [script, id], { encoding: 'utf8', timeout: ms, windowsHide: true, env: process.env });
    if (r.error || r.status !== 0) return none;
    const lines = String(r.stdout || '').split(/\r?\n/);
    const i = lines.findIndex(l => l.startsWith('SAVE-QUEST: '));
    if (i < 0) return none;
    const advice = lines[i + 1] && /^\s+\S/.test(lines[i + 1]) ? '\n' + lines[i + 1] : '';
    const verdict = (lines[i].split('→').pop() || '').trim() || 'UNKNOWN';
    return { text: lines[i] + advice, verdict };
  } catch (_) { return none; }
}

function logRow(row) {
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch (_) {}
}

if (require.main === module) {
  runHook({ name: 'save-quest-gate', event: 'UserPromptSubmit' }, (input) => {
    const t0 = Date.now();
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const prompt = String((data && (data.prompt || data.user_message)) || '');
    if (!prompt || prompt.length > MAX_PROMPT || /^\s*SAVE-QUEST GATE:/.test(prompt)) return { fired: false };
    const r = evaluatePrompt(prompt);
    if (!r.asked) return { fired: false };

    const budget = parseInt(process.env.SAVE_QUEST_GATE_TIMEOUT_MS, 10) || 8000;
    const deadline = Date.now() + budget;
    const lines = ['SAVE-QUEST GATE: close/save quest asked. Do these in this turn, in order.'];
    const verdicts = [];
    if (!r.ids.length) {
      lines.push('Quest ids: no quest named: resolve it from the conversation, then run node lib/save-quest.js <QA>');
    } else {
      lines.push('Quest ids: ' + r.ids.join(', '));
      for (const id of r.ids.slice(0, MAX_IDS)) {
        const res = resolveOne(id, Math.max(300, deadline - Date.now()));
        verdicts.push(res.verdict);
        lines.push(res.text);
      }
      if (r.ids.length > MAX_IDS) lines.push('Not resolved here (more than ' + MAX_IDS + ' ids): ' + r.ids.slice(MAX_IDS).join(', ') + ' — run node lib/save-quest.js <QA> for each.');
    }
    lines.push(CHECKLIST);
    lines.push('Procedure: invoke the close-phase skill (Skill tool). This gate does not replace it.');
    logRow({ event: 'front', decision: 'inject', ids: r.ids, verdicts, dur_ms: Date.now() - t0 });
    return { fired: true, blocked: false, contextOut: lines.join('\n') + '\n' };
  });
}

module.exports = { evaluatePrompt, normId };
