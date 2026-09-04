#!/usr/bin/env node
// latent-bugs-gate.check.hook.js — born via core/forge.js (2026-08-23)
// TRIGGER: ticket signal in prompt (prefixed/bare ticket number, quest-start phrase, redmine-retrieval phrase) - same set as adhoc-register
// ACTION: read etanah-knowledge/melaka/LATENT-BUGS.md, inject every SUSPECT/VERIFIED row before Phase 0 with compare-and-graduate instruction; warn loudly if register missing
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
//
// NOD: miya 2026-08-23 — "if we do find a bug, we put it into bug list, then it will load
//      during Phase 0 to check if it is a known bug. But we will need to make it deterministic
//      so that it won't go missed."
//
// PATTERN SOURCE: domain/adhoc-register/adhoc-register.check.hook.js (proven injector shape) —
// same worktree->main-repo path resolution, same UserPromptSubmit placement (a Stop hook would
// only catch the miss AFTER a wasted re-investigation). Sibling boundary: adhoc-register = Q&A
// asks · bug-db = confirmed-bug top-3 similarity from the bestiary · THIS = pre-ticket sweep
// findings, ALL open rows injected (a scored top-N could miss one — miya asked deterministic).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');
function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

// The register sits with the other etanah-knowledge files (gitignored, main working tree only —
// lib/states.js knowledgeDir() is main-repo aware). state-scoped: yes — keyed by state via lib/states.js
// (v2 2026-09-04, multi-state audit): a permohonan prefix in the prompt picks ONE state's register; a bare
// ticket number cannot say which state, so every registered state's LATENT-BUGS.md on disk is read, rows labelled.
const states = require(fs.existsSync(path.join(ROOT, 'lib', 'states.js')) ? path.join(ROOT, 'lib', 'states.js') : path.join(__dirname, '..', '..', 'lib', 'states.js'));
const REL = 'etanah-knowledge/<state>/LATENT-BUGS.md';

function registerPaths(prompt) {
  const r = states.resolve({ text: prompt });
  const keys = r.state ? [r.state] : Object.values(states.all()).filter(s => s.work_scope !== 'excluded').map(s => s.key);
  const out = [];
  for (const k of keys) {
    const dir = states.knowledgeDir(k);
    const p = dir && path.join(dir, 'LATENT-BUGS.md');
    if (p && fs.existsSync(p)) out.push({ state: k, path: p });
  }
  return { paths: out, resolved: r.state || null };
}

const PREFIXED_RE = /\b(?:QA|FAT-OR|UAT-CR|FAT|UAT|eSOKONGAN|ESOKONGAN|REQUIREMENT|INTERNAL(?:\s+ISSUE)?)\s*#?\s*(\d{4,})\b/i;
const BARE_NUM_RE = /\b\d{5,7}\b/;
const QUEST_START_RE = /\/quest\s+(?:start|resume)|\b(?:start(?:ing)?\s+(?:a\s+)?quest|let'?s\s+start\s+(?:with|on)|pick\s+up|resume)\b/i;
const RETRIEVAL_RE = /\b(?:read\s+redmine|retrieve\s+(?:the\s+)?ticket|redmine[-\s]?sync|sync\s+redmine|new\s+ticket)\b/i;
const BYPASS_RE = /\[skip-latent-bugs:\s*[^\]]+\]/i;

// Register schema (LATENT-BUGS.md):
//   | # | Date | Family | Where | Urusan/Screen | Symptom if triggered | Status | Evidence |
// Row id is L1/L2/... Surface SUSPECT and VERIFIED only — TICKETED/FIXED/REFUTED owe nothing at Phase 0.
const STILL_OWED_RE = /\b(SUSPECT|VERIFIED)\b/;

function parseOpenRows(md) {
  const out = [];
  for (const line of md.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith('|')) continue;
    const cells = t.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 8) continue;
    if (!/^L?\d+$/.test(cells[0])) continue;              // skips header + separator rows
    const status = cells[6].replace(/[`*]/g, '');
    if (!STILL_OWED_RE.test(status)) continue;
    out.push({
      n: cells[0], date: cells[1], family: cells[2], where: cells[3],
      screen: cells[4], symptom: cells[5], status, evidence: cells[7],
    });
  }
  return out;
}

function clip(s, max) {
  const one = String(s).replace(/\s+/g, ' ').trim();
  return one.length > max ? one.slice(0, max - 1) + '…' : one;
}

runHook({ name: 'latent-bugs-gate', event: 'UserPromptSubmit' }, (input) => {
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
    log({ action: 'register-missing', state: resolved });
    return {
      fired: true,
      contextOut:
        '⚠️  latent-bugs-gate: LATENT-BUGS.md NOT FOUND' + (resolved ? ' for state ' + resolved : ' for any registered state') + ' — cannot check the pre-diagnosed bug list.\n' +
        '   Expected at: <main-repo>/projects/coding-projects/active/' + REL + '\n' +
        '   Create it (schema in domain/latent-bugs-gate/README.md) or this ticket may re-diagnose a known latent bug.\n',
    };
  }

  let rows = [];
  const unreadable = [];
  for (const reg of paths) {
    try { rows = rows.concat(parseOpenRows(fs.readFileSync(reg.path, 'utf8')).map(r => ({ ...r, state: reg.state }))); }
    catch (_) { unreadable.push(reg.state); }
  }
  if (unreadable.length) {
    log({ action: 'register-unreadable', states: unreadable });
    return {
      fired: true,
      contextOut: '⚠️  latent-bugs-gate: could not read ' + REL.replace('<state>', unreadable.join('|')) + ' — check the latent-bug register by hand before Phase 0.\n',
    };
  }

  if (!rows.length) return { fired: false };
  log({ action: 'injected', rows: rows.map(r => r.state + ':' + r.n), prompt: prompt.slice(0, 120) });

  const lines = [
    '🕳️ latent-bugs-gate: ' + rows.length + ' pre-diagnosed latent bug(s) on the register (SUSPECT/VERIFIED).' + (resolved ? ' [state=' + resolved + ']' : ' [state unknown from the prompt — all registers read]'),
    '   🚨 MANDATORY at Phase 0 — compare THIS ticket\'s symptom/screen against every row below:',
    '',
  ];
  for (const r of rows) {
    lines.push('   [' + r.state + ' ' + r.n + '] ' + r.date + ' · ' + clip(r.family, 50) + ' · ' + clip(r.status, 20));
    lines.push('       where  : ' + clip(r.where, 150));
    lines.push('       screen : ' + clip(r.screen, 100));
    lines.push('       symptom: ' + clip(r.symptom, 180));
    lines.push('       evidence: ' + clip(r.evidence, 120));
    lines.push('');
  }
  lines.push('   ON MATCH — the diagnosis already exists:');
  lines.push('     1. Say so explicitly: "this matches latent-bug row [N] — starting from its diagnosis".');
  lines.push('     2. Update that row IN THE SAME TURN: Status -> TICKETED, append the ticket number to Evidence.');
  lines.push('     3. Start the quest from the row\'s evidence, NOT from Scout — a pre-diagnosed ticket is a quick-win;');
  lines.push('        idle diagnosed tickets are steal-risks (grab-risk beats age).');
  lines.push('   ON NO MATCH — state "no latent-bug register match" once, then proceed normally.');
  lines.push('   Bypass: [skip-latent-bugs: <reason>]');

  return { fired: true, contextOut: lines.join('\n') + '\n' };
});
