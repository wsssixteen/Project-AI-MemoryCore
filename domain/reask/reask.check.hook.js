#!/usr/bin/env node
// reask.check.hook.js — born via core/forge.js (2026-07-14), refined same day
// TRIGGER: user prompt matches reask regex — 6 categories: verbose/rambling/hallucination/buried-answer/redundant/rephrase-check
// ACTION: advisory-only additionalContext reminding to log via core/slips.js add --category reask/<axis> and fix reply structure
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');

const PATTERNS = [
  ['reask/verbose',        /\b(in one sentence|one[\s-]line|just answer|simple yes or no|briefly|answer briefly|answer in single|single short)\b/i],
  ['reask/rambling',       /\b(why are you rambling|blabbering|long[\s-]?wind(?:ed|ing)|wall of text|essays?|too verbose|too long)\b/i],
  ['reask/hallucination',  /\b(hallucinat|making that up|bullshit|that's not true|you're wrong)\b/i],
  ['reask/buried-answer',  /\b(answer my question|you didn'?t answer|still no answer|still haven'?t answered|not the answer)\b/i],
  ['reask/redundant',      /\b(i already (?:asked|told you|mentioned|said)|i'?ve (?:said|told|mentioned) this|i thought i (?:asked|told|mentioned))\b/i],
  ['reask/rephrase-check', /\b(wait,? so\b|so is it\b|so what you mean\b|so basically\b|so you'?re saying)\b/i],
];

runHook({ name: 'reask', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const prompt = String(data.prompt || data.user_message || '');
  if (!prompt) return { fired: false };

  const matches = [];
  for (const [cat, rx] of PATTERNS) {
    const m = prompt.match(rx);
    if (m) matches.push({ cat, snippet: m[0] });
  }
  if (matches.length === 0) return { fired: false };

  try {
    fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), matched: matches, prompt_len: prompt.length, prompt: prompt }) + '\n');
  } catch (_) {}

  const cats = matches.map((m) => m.cat).join(' + ');
  const contextOut = 'reask-detect: reply-clarity signal (category=' + cats + ').\n'
    + '   Fix reply STRUCTURE this turn (table/diagram > prose, lede-first, no essays).\n'
    + '   Log via: node core/slips.js add --category ' + matches[0].cat + ' --evidence "<one-line>" --caught-by miya\n'
    + '   Matched: "' + matches[0].snippet + '"';
  return { fired: true, blocked: false, contextOut };
});
