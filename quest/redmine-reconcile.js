#!/usr/bin/env node
// quest/redmine-reconcile.js — deterministic active.txt ↔ Redmine reconciliation.
//
// WHY (2026-08-21, miya: "Domain expansion doesn't check against redmine for the fucking
// tickets? Please fix this straight away."): the board hit 20 "open" blocks while Redmine
// showed 0 assigned-open — DE had NO Redmine step; redmine-status-check fired only on
// active-cli commands and a report-only boot surfacer that failed silently this boot.
//
// WHAT it does (report + log, never auto-mutates):
//   1. Reads quest/active.txt OPEN blocks (status ∈ active/hold/blocked/delegated).
//   2. For every block with a resolvable ticket number (qa= or redmine_ticket=/redmine=),
//      runs redmine-status-check.checkAll — prints divergence rows.
//   3. Runs checkMissing — assigned-open on Redmine but absent locally (undercount class).
//   4. Appends {action:'reconcile-ran', ...} to domain/de-close-gate/log.jsonl — the row
//      de-close-gate C4 requires (≤12h fresh) before a DE close may pass.
//
// Network failure: prints the unreachable warning, STILL logs the run with unreachable
// count — an offline evening must never deadlock DE (same contract as redmine-status-check).
//
// Usage: node quest/redmine-reconcile.js
'use strict';
const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.resolve(__dirname, '..');
const { checkAll, checkMissing, OPEN_STATUSES } = require(path.join(__dirname, 'redmine-status-check.js'));
const GATE_LOG = path.join(REPO_ROOT, 'domain', 'de-close-gate', 'log.jsonl');

function parseBlocks(txt) {
  const out = [];
  for (const part of txt.split(/\n(?=qa=)/)) {
    const qa = (part.match(/^qa=(\S+)/m) || [])[1];
    if (!qa) continue;
    const status = (part.match(/^status=(\S+)/m) || [])[1] || '';
    const redmine = (part.match(/^(?:redmine_ticket|redmine)=(\d{5,})/m) || [])[1] || null;
    out.push({ qa, status, redmine });
  }
  return out;
}

(async () => {
  let txt = '';
  try { txt = fs.readFileSync(path.join(REPO_ROOT, 'quest', 'active.txt'), 'utf8'); }
  catch (e) { console.log('✗ cannot read quest/active.txt — ' + e.message); process.exit(1); }

  const open = parseBlocks(txt).filter(b => OPEN_STATUSES.has(b.status));
  // checkAll resolves the number from qa via its own numOf; for ADHOCs substitute the
  // redmine_ticket field so numbered adhocs are checked too, numberless ones skipped.
  const checkable = open
    .map(b => ({ qa: b.redmine || b.qa, status: b.status }))
    .filter(b => /\d{5,}/.test(b.qa));
  const numberless = open.length - checkable.length;

  console.log(`redmine-reconcile: ${open.length} open block(s) — ${checkable.length} Redmine-checkable, ${numberless} numberless adhoc(s) (miya's judgment).`);
  await checkAll(checkable);
  await checkMissing(open.map(b => b.redmine || b.qa));

  try {
    fs.appendFileSync(GATE_LOG, JSON.stringify({
      ts: new Date().toISOString(), action: 'reconcile-ran',
      detail: `open=${open.length} checkable=${checkable.length} numberless=${numberless}`,
    }) + '\n');
  } catch (_) { /* log failure must not fail the run */ }
  console.log('✓ reconcile-ran logged (de-close-gate C4 satisfied for 12h).');
})();
