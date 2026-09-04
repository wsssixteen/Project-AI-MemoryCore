// deploy-check.js — pre-merge completeness probe for env deploys (2026-08-24, /goal hardening).
// The deploy-side twin of the release sibling-sweep: BEFORE merging a ticket branch into an env
// base (mlk/stag-env / mlk/int-env / training), enumerate EVERY origin branch matching the ticket
// and verify none is a stranded rework — deploying v1 while v2 sits on origin is the #275539 class.
//
// usage: node domain/deploy/deploy-check.js <ticket> <env-base> [--repo <path>]
//   <env-base>: mlk/stag-env | mlk/int-env | training (training = branch IS the artifact; sibling check only)
// exit 0 = clean · exit 2 = blocked (v2-class stranded rework, revert, or unusable input)
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const repoIdx = process.argv.indexOf('--repo');
const REPO = repoIdx > -1 ? process.argv[repoIdx + 1] : 'E:/Projects/Melaka/etanah-pelupusan';
const ticket = String(args[0] || '').replace(/\D/g, '');
const envBase = args[1] || '';
const ENV_BASES = ['mlk/stag-env', 'mlk/int-env', 'training'];

function die(msg) { console.error(`⛔ deploy-check: ${msg}`); process.exit(2); }
function g(a) { return execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim(); }

if (!ticket) die('usage: deploy-check.js <ticket> <env-base> — ticket must contain digits');
if (!ENV_BASES.includes(envBase)) die(`env-base "${envBase}" not in ${ENV_BASES.join(' | ')} — mlk/master and mlk/release/* belong to release-mlk-plp, never deploy-check`);

let heads;
try {
  heads = g(['ls-remote', '--heads', 'origin']).split('\n')
    .map(l => (l.split('\t')[1] || '').replace('refs/heads/', '')).filter(Boolean);
} catch (e) { die(`ls-remote failed (${(e.message || '').split('\n')[0]}) — NEVER assume no siblings on a network failure`); }

const matches = heads.filter(r => new RegExp(`/${ticket}(v\\d+)?$`).test(r) || new RegExp(`/${ticket}(-|_)`).test(r));
if (!matches.length) die(`no origin branch matches ticket ${ticket} — do not guess a branch shape`);

console.log(`## deploy-check — #${ticket} → ${envBase}  (repo ${REPO})\n`);
console.log('| Branch | Commits not in env base | Status |');
console.log('|---|---|---|');

const rows = matches.map(b => {
  const missing = envBase === 'training' ? null : g(['rev-list', `origin/${b}`, '--not', `origin/${envBase}`, '--count']);
  return { b, missing };
});
for (const r of rows) console.log(`| ${r.b} | ${r.missing === null ? 'n/a (training: branch IS the artifact)' : r.missing} | ${r.missing === '0' ? '✓ in env' : '⬜ not in env'} |`);

let blocked = false;
if (envBase !== 'training') {
  const merged = rows.filter(r => r.missing === '0');
  const unmerged = rows.filter(r => r.missing !== '0');
  if (merged.length && unmerged.length) {
    blocked = true;
    console.log(`\n🚨 V2-CLASS: ${merged.map(r => r.b).join(', ')} already in ${envBase} but ${unmerged.map(r => r.b).join(', ')} is NOT — deploying now ships a PARTIAL fix (#275539 class). Merge the rework too, or classify it superseded with みや's nod.`);
  } else if (unmerged.length && matches.length > 1) {
    console.log(`\n⚠️  ${matches.length} sibling branches exist, none in ${envBase} yet — merge the LATEST complete one; confirm which is canonical before merging (quest-MD branch ledger).`);
  }
  // revert check: ticket reverted on the env base = fix live nowhere there
  const reverts = g(['log', `origin/${envBase}`, '--oneline', '-i', '--grep', 'revert', '-n', '400'])
    .split('\n').filter(l => l && l.includes(ticket));
  if (reverts.length) {
    blocked = true;
    console.log(`\n🚨 REVERT of #${ticket} on ${envBase}: ${reverts[0]} — the fix may be live nowhere on this env.`);
  }
} else if (matches.length > 1) {
  console.log(`\n⚠️  TRAINING: ${matches.length} sibling branches — the deployed branch must be the COMPLETE one (it IS the artifact). Latest tips:`);
  for (const r of rows) console.log(`   ${r.b} @ ${g(['log', '-1', '--format=%h %ad %s', '--date=short', `origin/${r.b}`])}`);
}

if (blocked) process.exit(2);
console.log(`\n✅ deploy-check clean — proceed with the ${envBase} card`);
