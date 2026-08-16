#!/usr/bin/env node
// pre-reply-contract.check.hook.js — born via core/forge.js (2026-08-16)
// TRIGGER: every substantive user prompt (silent <4 chars); constrained-format asks get suppression variant
// ACTION: inject the condensed permanent ADHD reply contract BEFORE composing (full-address + micro-summary + delta-only-correction); constrained-format ask wins over all shape rules
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'pre-reply-contract', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const prompt = data.prompt || '';
  if (prompt.length < 4) return { fired: false }; // tiny acks ("y","ok") need no contract
  const p = prompt.toLowerCase();

  // Constrained-format ask → the user's format instruction OUTRANKS every shape rule
  // (CLAUDE.md priority order; todo Q1 row 42 design candidate (c)).
  const constrained = [
    /\bonly (a |the )?(table|list|diagram|code|sql|command|number|word|line)\b/,
    /\b(reply|answer|respond) (with )?(only|just)\b/,
    /\bone (sentence|line|word) (only|answer|reply)?\b/,
    /\bjust (say|tell me|give me)\b/,
    /\bno (explanation|summary|table|diagram)s?\b/,
  ].some(re => re.test(p));

  if (constrained) {
    return { fired: true, blocked: false, contextOut: [
      '📐 pre-reply-contract: CONSTRAINED-FORMAT ask detected.',
      '   Honor the requested format EXACTLY — it outranks every shape rule.',
      '   Suppressed this turn: summary block · diagram · notes. If a Stop gate',
      '   still fires, bypass-token it: the answer stays in the asked format.',
    ].join('\n') + '\n' };
  }

  // Default: the condensed permanent contract (fixed short text — no per-turn growth).
  // v2 "blend" 2026-08-16 per みや pick: C-spec DO-THIS block + bullets-first + caveman
  // never-drop guardrail + fake-savings ban. Canonical: .claude/reply-shape-spec.md §3b.
  return { fired: true, blocked: false, contextOut: [
    '📐 pre-reply-contract v2-blend (permanent — compose RIGHT the first time):',
    '   · First line = the answer in plain words. No preamble, recap, closers.',
    '   · Break everything into SHORT bullets/numbered steps — one fact per line, ≤5 per list. Tables for data; story diagram for flows.',
    '   · Load-bearing words only: understanding > concision > grammar. NEVER drop not/never/no/only, numbers, units, exact errors.',
    '   · No fake savings: no invented abbreviations (cfg/impl), no decorative symbols — full word is cheaper AND clearer.',
    '   · Code/file cites = FULL address <repo>\\<path>\\File.ext:line.',
    '   · End with *DO THIS*: numbered next actions for みや, priority-first + spell out reply options on decisions. Omit only when no user action.',
    '   · Stop-hook correction = DELTA ONLY (token + missing line) — NEVER re-emit the reply.',
  ].join('\n') + '\n' };
});
