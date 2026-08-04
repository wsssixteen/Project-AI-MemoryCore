#!/usr/bin/env node
// sync-hook-catalog.js — regenerate the canonical registered-hooks registry in
// system/system-architecture.md from .claude/settings.json (the source of truth).
//
// WHY (2026-06-19, QA-266215 session): the §3 hook catalog was hand-maintained → it
// drifted out of sync with settings.json → system-audit's DOC-DRIFT check
// false-alarmed on ~50 hooks for over a month. This script makes the REGISTRY section
// AUTO-GENERATED so it can never drift; the rich §3.1+ prose tables stay hand-written
// for the semantic detail (Owner / Action / why-fragile) that a registry can't carry.
//
// PRIMITIVE (per /system-design Rule 7): a maintenance SCRIPT, not a Power — no skill
// (nothing to invoke), no hook (run ON-DEMAND, not at boot — mutating a doc at boot is
// risky), no eval.workflow (correctness = "output matches settings.json", verified by
// running it). Lives in system/ beside the doc it maintains, mirroring the quest/*.js
// co-location precedent (util scripts live with the state they maintain).
//
// INSTRUMENT (per /system-rules Rule 5): prints a one-line summary to stdout each run
// (matches the quest/*.js precedent — active-cli/archive-quest print, they don't keep a
// log.jsonl; a persistent log for a manual on-demand generator is overkill / Rule 4).
//
// USAGE:
//   node system/sync-hook-catalog.js          — regenerate the §3.0 registry block in place
//   node system/sync-hook-catalog.js --check  — exit 1 if the block is stale (CI-style), no write
//
// IDEMPOTENT: no timestamp embedded, so re-running with an unchanged settings.json
// produces byte-identical output → no spurious git diff.

'use strict';
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SETTINGS = path.join(REPO_ROOT, '.claude', 'settings.json');
const ARCH_DOC = path.join(REPO_ROOT, 'system', 'system-architecture.md');
const START = '<!-- HOOK-REGISTRY:AUTO-START -->';
const END = '<!-- HOOK-REGISTRY:AUTO-END -->';
const EVENT_ORDER = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop'];

function fail(msg) { console.error('sync-hook-catalog: ' + msg); process.exit(2); }

let settings;
try { settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); }
catch (e) { fail('cannot read/parse ' + SETTINGS + ' — ' + e.message); }
const hooks = settings.hooks || {};

// Collect one row per registered hook: { event, matcher, name, exists }
const rows = [];
for (const event of Object.keys(hooks)) {
  for (const block of hooks[event] || []) {
    const matcher = block.matcher || '';
    for (const h of block.hooks || []) {
      const cmd = h.command || '';
      const nm = cmd.match(/([\w.-]+)\.js/);
      if (!nm) continue;
      const pm = cmd.match(/"([^"]+\.js)"/) || cmd.match(/(\S+\.js)/);
      let realPath = pm ? pm[1] : null;
      if (realPath) realPath = realPath.replace(/\$\{CLAUDE_PROJECT_DIR\}/g, REPO_ROOT);
      rows.push({ event, matcher, name: nm[1], exists: realPath ? fs.existsSync(realPath) : false });
    }
  }
}

rows.sort((a, b) => {
  const ea = EVENT_ORDER.indexOf(a.event), eb = EVENT_ORDER.indexOf(b.event);
  const na = ea < 0 ? 99 : ea, nb = eb < 0 ? 99 : eb;
  return na !== nb ? na - nb : a.name.localeCompare(b.name);
});

const events = [...new Set(rows.map(r => r.event))];
const body = [
  `_AUTO-GENERATED from \`.claude/settings.json\` by \`system/sync-hook-catalog.js\` — do NOT hand-edit. ${rows.length} hook registrations across ${events.length} events. Re-run after any settings.json hook change (\`node system/sync-hook-catalog.js\`)._`,
  '',
  '| Event | Matcher | Hook | On disk? |',
  '|---|---|---|---|',
  ...rows.map(r => `| ${r.event} | ${r.matcher || '—'} | \`${r.name}.js\` | ${r.exists ? '✓' : '🚨 MISSING'} |`),
].join('\n');
const block = START + '\n' + body + '\n' + END;

let doc;
try { doc = fs.readFileSync(ARCH_DOC, 'utf8'); }
catch (e) { fail('cannot read ' + ARCH_DOC + ' — ' + e.message); }
if (!doc.includes(START) || !doc.includes(END)) {
  fail(`markers not found in system-architecture.md — add the §3.0 block (${START} … ${END}) once, then re-run.`);
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = new RegExp(esc(START) + '[\\s\\S]*?' + esc(END));
const updated = doc.replace(re, block);

if (process.argv.includes('--check')) {
  if (updated !== doc) { console.error('sync-hook-catalog: registry is STALE — run `node system/sync-hook-catalog.js` to regenerate.'); process.exit(1); }
  console.log('sync-hook-catalog: registry up to date (' + rows.length + ' hooks).');
  process.exit(0);
}

if (updated !== doc) fs.writeFileSync(ARCH_DOC, updated);
console.log(`sync-hook-catalog: ${rows.length} hook registrations across ${events.length} events synced into system-architecture.md §3.0` + (updated === doc ? ' (no change).' : '.'));
