#!/usr/bin/env node
// question-self-contained.check.hook.js — born via core/forge.js (2026-10-13)
// TRIGGER: a question is about to be put to him in the popup and its words point at something he cannot see while the popup is open (the chat above, a table or file sent earlier, another window or tab)
// ACTION: block the call and name the pointing words; the question must carry the thing itself, in its text or in an option preview
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// His words, 2026-10-13, typed into the popup itself: "I cannot see what simpler you're talking about. YOU ALWAYS DO THIS ... WHY DO YOU NOT BAN
// YOURSELF FROM REPEATING THIS WHEN ASKING QUESTIONS" and "I CANNOT SEE IT I DON'T KNOW WHAT YOU'RE TALKING ABOUT".
// The two questions he could not answer are fixtures F2 and F3 of the eval, word for word.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');

// Words that point at what the popup hides: the chat, anything sent earlier, any other window.
const POINTERS = [
  { re: /\b(?:above|scroll up|earlier in (?:the|this) (?:chat|conversation)|in (?:the |my )?(?:chat|previous message|last message|earlier message)|(?:sent|shown|listed|posted|attached|given) (?:above|earlier|before|in chat)|see (?:the |my )?(?:table|list|chat|message|file|pdf|sheet|photo|photograph|screenshot))\b/i,
    why: 'it points at the chat or at something sent earlier, and the popup hides the chat' },
  { re: /\b(?:(?:open|opened) (?:edge|chrome|browser) (?:tab|window)|(?:in|on) (?:the |your )?(?:edge|chrome|browser)(?: tab| window)?|the (?:open )?(?:tab|dialog|window) (?:in|on|at)|on your (?:screen|desktop)|in (?:the|your) terminal)\b/i,
    why: 'it sends him to another window or tab to understand the question' }
];
// A choice between wordings, lines or designs that are not shown: no preview on any option and no quoted candidate.
const CHOOSES = /\b(?:which|choose|pick|select)\b/i, AMONG = /\b(?:lines?|wording|wordings|texts?|versions?|designs?|layouts?|drafts?)\b/i;

function judge(toolInput) {
  const found = [];
  const qs = toolInput && Array.isArray(toolInput.questions) ? toolInput.questions : [];
  qs.forEach((q, i) => {
    if (!q || typeof q !== 'object') return;
    const opts = Array.isArray(q.options) ? q.options.filter(o => o && typeof o === 'object') : [];
    // previews are the content shown in the popup: they are never read as pointing words
    const texts = [q.question, q.header].concat(opts.flatMap(o => [o.label, o.description])).filter(t => typeof t === 'string');
    for (const t of texts) for (const p of POINTERS) { const m = p.re.exec(t); if (m) found.push('question ' + (i + 1) + ': "' + m[0] + '": ' + p.why); }
    const ask = typeof q.question === 'string' ? q.question : '';
    const shown = opts.some(o => typeof o.preview === 'string' && o.preview.trim()) || texts.some(t => /["“”][^"“”]{8,}["“”]/.test(t));
    if (CHOOSES.test(ask) && AMONG.test(ask) && !shown) found.push('question ' + (i + 1) + ': he is asked to choose between wordings, lines or designs that are not shown: no option carries a preview and none quotes its candidate');
  });
  return found;
}
const HOW = '\nA question put to him carries everything needed to answer it. Fix it one of two ways:\n' +
  '  - put the thing itself into the popup: the candidates in each option\'s "preview" (or quoted in its description), the facts in the question\'s own words;\n' +
  '  - or do not ask: if it is about another window, a file or the chat, say it in the reply instead, in plain words, and carry on with what does not need him.\n';

module.exports = { judge };
if (require.main === module) {
  const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
  runHook({ name: 'question-self-contained', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
    if (data.tool_name && data.tool_name !== 'AskUserQuestion') return { fired: false };
    const found = judge(data.tool_input);
    if (!found.length) return { fired: false };
    try { fs.appendFileSync(path.join(__dirname, 'log.jsonl'), JSON.stringify({ ts: new Date().toISOString(), outcome: 'blocked', found }) + '\n'); } catch (_) { /* the telemetry of hook-runtime still records the fire */ }
    return { fired: true, blocked: true, contextOut: 'question-self-contained: BLOCKED. He cannot answer this from the popup.\n- ' + found.join('\n- ') + HOW };
  });
}
