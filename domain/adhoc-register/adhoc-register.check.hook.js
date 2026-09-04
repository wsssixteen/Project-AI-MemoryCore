#!/usr/bin/env node
// adhoc-register.check.hook.js — born via core/forge.js (2026-07-28)
// TRIGGER: a ticket signal in miya's prompt (prefixed or bare ticket number, quest-start phrase, or a Redmine-retrieval phrase)
// ACTION: read ADHOC-REGISTER.md and inject every OPEN row (Ticket=none) BEFORE Phase 0, with the mandatory compare-and-promote instruction; warn loudly if the register file is missing
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// NOD: miya 2026-07-29 — "when you retrieve a ticket and start a quest, during phase 0, you will
//      MANDATORY check for pending issues. If yes, during that moment you will update it."
//
// REPLAY CASE: the ADHOC-REGISTER rule was written 2026-07-28 into
//   Feature/Domain-Expansion/expansion-protocol.md:50 + .claude/skills/domain-expansion/SKILL.md:39
//   and the FILE WAS NEVER CREATED. Tonight's PLTP diagnosis (93%, fix drafted) went into todo.md
//   instead. A ticket arriving next week would have triggered a full re-investigation.
//
// WHY UserPromptSubmit AND NOT Stop: a Stop hook would only tell me after I had already
//   re-investigated. Per miya 2026-07-28, checks knowable BEFORE the reply belong before it.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

// The register sits with the other etanah-knowledge files (gitignored, main working tree only —
// lib/states.js knowledgeDir() is main-repo aware). state-scoped: yes — keyed by state via lib/states.js
// (v2 2026-09-04, multi-state audit): a permohonan prefix in the prompt picks ONE state's register; a bare
// ticket number cannot say which state, so EVERY registered state's register that exists on disk is read and
// each row is labelled with its state. Before v2 the path was the melaka literal Rule 11 named as the example.
const states = require(fs.existsSync(path.join(ROOT, 'lib', 'states.js')) ? path.join(ROOT, 'lib', 'states.js') : path.join(__dirname, '..', '..', 'lib', 'states.js'));
const REL = 'etanah-knowledge/<state>/ADHOC-REGISTER.md';

function registerPaths(prompt) {
  const r = states.resolve({ text: prompt });
  const keys = r.state ? [r.state] : Object.values(states.all()).filter(s => s.work_scope !== 'excluded').map(s => s.key);
  const out = [];
  for (const k of keys) {
    const dir = states.knowledgeDir(k);
    const p = dir && path.join(dir, 'ADHOC-REGISTER.md');
    if (p && fs.existsSync(p)) out.push({ state: k, path: p });
  }
  return { paths: out, resolved: r.state || null };
}

const PREFIXED_RE = /\b(?:QA|FAT-OR|UAT-CR|FAT|UAT|eSOKONGAN|ESOKONGAN|REQUIREMENT|INTERNAL(?:\s+ISSUE)?)\s*#?\s*(\d{4,})\b/i;
const BARE_NUM_RE = /\b\d{5,7}\b/;
const QUEST_START_RE = /\/quest\s+(?:start|resume)|\b(?:start(?:ing)?\s+(?:a\s+)?quest|let'?s\s+start\s+(?:with|on)|pick\s+up|resume)\b/i;
const RETRIEVAL_RE = /\b(?:read\s+redmine|retrieve\s+(?:the\s+)?ticket|redmine[-\s]?sync|sync\s+redmine|new\s+ticket)\b/i;
const BYPASS_RE = /\[skip-adhoc-register:\s*[^\]]+\]/i;

// Register schema (canonical, authored by the 2026-07-28 session):
//   | # | Date | Asked by | The ask | Conclusion | Evidence lives at | Status |
// Row id is A1/A2/... (or a bare number). Statuses: ANSWERED · OPEN · OWNED-ELSEWHERE · LATENT.
// Surface only OPEN and LATENT — those are the two the register's own Review-cadence section says to
// cross-check at Phase 0. ANSWERED / OWNED-ELSEWHERE owe us nothing.
const STILL_OWED_RE = /\b(OPEN|LATENT)\b/;

function parseOpenRows(md) {
  const out = [];
  for (const line of md.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('|')) continue;
    const cells = t.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 7) continue;
    if (!/^[A-Z]?\d+$/.test(cells[0])) continue;        // skips header + separator rows
    const status = cells[6].replace(/[`*]/g, '');
    if (!STILL_OWED_RE.test(status)) continue;
    out.push({
      n: cells[0], date: cells[1], askedBy: cells[2],
      ask: cells[3], conclusion: cells[4],
      doc: cells[5].replace(/[`]/g, ''), status,
    });
  }
  return out;
}

function clip(s, max) {
  const one = String(s).replace(/\s+/g, ' ').trim();
  return one.length > max ? one.slice(0, max - 1) + '…' : one;
}

runHook({ name: 'adhoc-register', event: 'UserPromptSubmit' }, (input) => {
  let data = input;
  if (typeof input === 'string') {
    try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  }
  const prompt = (data && data.prompt) || '';
  if (!prompt) return { fired: false };
  if (BYPASS_RE.test(prompt)) return { fired: false };

  if (!(PREFIXED_RE.test(prompt) || QUEST_START_RE.test(prompt) ||
        RETRIEVAL_RE.test(prompt) || BARE_NUM_RE.test(prompt))) {
    return { fired: false };
  }

  const { paths, resolved } = registerPaths(prompt);
  if (!paths.length) {
    return {
      fired: true,
      contextOut:
        '⚠️  adhoc-register: ADHOC-REGISTER.md NOT FOUND' + (resolved ? ' for state ' + resolved : ' for any registered state') + ' — cannot check for a matching pending issue.\n' +
        '   Expected at: <main-repo>/projects/coding-projects/active/' + REL + '\n' +
        '   Create it before Phase 0, or this ticket may repeat an investigation we already did.\n',
    };
  }

  let rows = [];
  const unreadable = [];
  for (const reg of paths) {
    try { rows = rows.concat(parseOpenRows(fs.readFileSync(reg.path, 'utf8')).map(r => ({ ...r, state: reg.state }))); }
    catch (_) { unreadable.push(reg.state); }
  }
  if (unreadable.length) {
    return {
      fired: true,
      contextOut: '⚠️  adhoc-register: could not read ' + REL.replace('<state>', unreadable.join('|')) + ' — check the pending register by hand before Phase 0.\n',
    };
  }

  if (!rows.length) return { fired: false };

  const lines = [
    '🔎 adhoc-register: ' + rows.length + ' ad-hoc row(s) still owed (OPEN / LATENT) — already investigated, no ticket of ours.' + (resolved ? ' [state=' + resolved + ']' : ' [state unknown from the prompt — all registers read]'),
    '   🚨 MANDATORY at Phase 0 — compare THIS ticket against every row below:',
    '',
  ];
  for (const r of rows) {
    lines.push('   [' + r.state + ' ' + r.n + '] ' + r.date + ' · asked by ' + clip(r.askedBy, 40) + ' · ' + clip(r.status, 60));
    lines.push('       ask       : ' + clip(r.ask, 150));
    lines.push('       conclusion: ' + clip(r.conclusion, 200));
    lines.push('       evidence  : ' + r.doc);
    lines.push('');
  }
  lines.push('   ON MATCH — do this instead of re-investigating:');
  lines.push('     1. Say so explicitly: "this is ad-hoc row [N], already concluded — starting from <phase>".');
  lines.push('     2. Update that row IN THE SAME TURN: append the ticket number and move Status on.');
  lines.push('     3. Fold the evidence doc into the quest doc; START at the phase the row reached,');
  lines.push('        not at Scout. Re-running Recon on a solved mechanism wastes miya\'s time.');
  lines.push('   ON NO MATCH — state "no ad-hoc register match" once, then proceed normally.');
  lines.push('   Bypass: [skip-adhoc-register: <reason>]');

  return { fired: true, contextOut: lines.join('\n') + '\n' };
});
