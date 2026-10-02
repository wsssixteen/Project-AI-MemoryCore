#!/usr/bin/env node
// carry-over.js — tickets みや promised for a FUTURE Pelupusan baseline (born 2026-09-30, #274461).
// A todo row is not read by the pipeline; this list is. release-prep.js `init` prints it and `verify`
// BLOCKS until every carried ticket's branch is fully in the release, or みや deferred it again for
// THIS release (`defer-carry --release <ver> --ticket <n> --reason "<his words>"`).
// Once merged to master the entry is dropped by `merge-to-master` (prune()).
//
//   node domain/release-mlk-plp/carry-over.js list
//   node domain/release-mlk-plp/carry-over.js add --ticket 274461 --branch mlk/internal/274461 --reason "..."
//   node domain/release-mlk-plp/carry-over.js check --repo <path> --ref <release ref>
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const FILE = process.env.CARRY_OVER_FILE || path.join(__dirname, 'carry-over.json');

function load() { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (_) { return []; } }
function save(list) { fs.writeFileSync(FILE, JSON.stringify(list, null, 2) + '\n'); }

// missing = commits on origin/<branch> not in ref. 0 → carried content is in the release.
function check(repo, ref, list = load()) {
  return list.map(c => {
    const r = spawnSync('git', ['-C', repo, 'rev-list', `origin/${c.branch}`, '--not', ref, '--count'], { encoding: 'utf8' });
    const missing = r.status === 0 ? Number(r.stdout.trim()) : null;
    return { ...c, missing, inRelease: missing === 0 };
  });
}
function prune(repo, masterRef) {
  const kept = check(repo, masterRef).filter(c => !c.inRelease).map(({ missing, inRelease, ...c }) => c);
  save(kept); return kept;
}
module.exports = { load, save, check, prune, FILE };

if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2);
  const arg = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
  if (cmd === 'list') { const l = load(); console.log(l.length ? l.map(c => `#${c.ticket} ${c.branch} — ${c.reason} (added ${c.added})`).join('\n') : '(empty)'); }
  else if (cmd === 'add') {
    const t = String(arg('--ticket') || '').replace(/^#/, ''), b = arg('--branch'), why = arg('--reason');
    if (!/^\d+$/.test(t) || !b || !why) { console.error('usage: add --ticket <n> --branch <origin branch> --reason "<why>"'); process.exit(2); }
    const l = load().filter(c => c.ticket !== t); l.push({ ticket: t, branch: b, reason: why, added: new Date().toISOString().slice(0, 10) }); save(l);
    console.log(`carry-over: #${t} (${b}) added — every future release verify will block until it is in, or deferred.`);
  } else if (cmd === 'check') {
    const rows = check(arg('--repo'), arg('--ref') || 'HEAD');
    rows.forEach(r => console.log(`#${r.ticket} ${r.branch}: ${r.inRelease ? '✅ in release' : `❌ ${r.missing ?? '?'} commit(s) missing`}`));
    process.exit(rows.every(r => r.inRelease) ? 0 : 1);
  } else { console.error('usage: list | add | check'); process.exit(2); }
}
