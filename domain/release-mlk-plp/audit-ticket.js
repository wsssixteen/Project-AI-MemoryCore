#!/usr/bin/env node
// audit-ticket.js <num> [release] — the missing per-ticket completeness check for baseline.
// Born 2026-08-12 after the #273461 miss: I shipped 1 of 3 files because I reconstructed a
// reverted fix from its LATEST branch only. This surfaces the whole situation per ticket:
//   (1) every rework branch (v1/v2/v3…)         → a fix can be STACKED, latest ≠ complete
//   (2) any REVERT of the ticket on master      → the fix may be live NOWHERE
//   (3) ancestor-trap per branch                → a plain merge would be a silent no-op
//   (4) release CONTENT coverage per branch     → is each branch's delta actually IN the release
// It does NOT auto-reconstruct (that needs judgment); it makes the trap impossible to miss.
//
// Usage:  node domain/release-mlk-plp/audit-ticket.js 273461 1.3.3
// Repo:   PLP_REPO env, else the release state json, else the etanah-pelupusan default.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const num = (process.argv[2] || '').replace(/^#/, '');
const ver = process.argv[3] || null;
if (!num) { console.error('usage: audit-ticket.js <num> [release]'); process.exit(2); }

let REPO = process.env.PLP_REPO;
if (!REPO && ver) {
  try {
    const st = JSON.parse(fs.readFileSync(path.join(__dirname, 'state', `release-${ver}.json`), 'utf8'));
    REPO = st.repo;
  } catch { /* fall through */ }
}
REPO = REPO || 'E:\\Projects\\Melaka\\etanah-pelupusan';

const g = (a) => execSync(`git -C "${REPO}" ${a}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
const gLines = (a) => { const o = g(a); return o ? o.split('\n') : []; };
const blob = (ref, file) => { try { return execSync(`git -C "${REPO}" show ${ref}:"${file}"`, { stdio: ['pipe','pipe','ignore'] }); } catch { return null; } };
const hash = (buf) => buf == null ? null : require('crypto').createHash('sha1').update(buf).digest('hex');

try { g('fetch origin --prune'); } catch { /* offline ok */ }
// Reference is the master the release BRANCHED FROM — not live master (which moves once V8 merges
// the release in, collapsing every diff to empty). During prep they are the same; post-merge, pass
// PLP_BASE=<pre-release master sha> (the `mlk/pre-master-merge/<ver>` tag captures it).
const MASTER = process.env.PLP_BASE || 'origin/mlk/master';

// (1) every rework branch for this ticket
const branches = gLines(`ls-remote --heads origin`)
  .map(l => l.split('\t')[1] || '')
  .map(r => r.replace('refs/heads/', ''))
  .filter(r => new RegExp(`/${num}(v\\d+)?$`).test(r) || new RegExp(`/${num}(-|_|$)`).test(r))
  .filter(Boolean);

// (2) reverts of this ticket anywhere in master history
const reverts = gLines(`log ${MASTER} --oneline -n 400`)
  .filter(l => /revert/i.test(l) && l.includes(num));

// (1b) ENV-HISTORY sweep — a rework branch can be DELETED after its merge into an env branch, so the
// branch-NAME scan above is blind to it (2026-09-02, Baseline 1.4.1: #274094's third fix fab13ed2 lived
// only on mlk/int-env via the deleted mlk/internal/274094v3; miya found it in SourceTree). Truth = the
// COMMITS: any non-merge commit on an env branch that names this ticket and is NOT in master.
const ENV_REFS = ['origin/mlk/int-env', 'origin/mlk/stag-env'].filter(r => { try { g(`rev-parse --verify -q ${r}`); return true; } catch { return false; } });
const envCommits = [];
for (const r of ENV_REFS) {
  for (const l of gLines(`log ${r} --not ${MASTER} --no-merges "--format=%H|%ad|%an|%s" --date=short --grep=${num}`)) {
    const [sha, date, author, subject] = l.split('|');
    if (sha && !envCommits.some(c => c.sha === sha)) envCommits.push({ sha, date, author, subject, env: r.replace('origin/', '') });
  }
}
// also the merge commits that NAME a vN branch — the deleted-branch fingerprint
const envMergesNaming = ENV_REFS.flatMap(r => gLines(`log ${r} --merges "--format=%h|%ad|%s" --date=short --grep=${num}`)).filter(l => /v\d+/.test(l));

// (3)+(4) per-branch: ancestor-trap + release content coverage
// release ref: origin first (post-push); BEFORE push the release exists only locally → fall back to the
// local branch so the audit is not blind during prep (it reported ❌ MISSING for every ticket pre-push).
let relRef = null;
if (ver) {
  for (const cand of [`origin/mlk/release/${ver}`, `mlk/release/${ver}`]) { try { g(`rev-parse --verify -q ${cand}`); relRef = cand; break; } catch { /* next */ } }
}
const rows = branches.map(b => {
  const ref = `origin/${b}`;
  let trap = false, files = [], covered = null;
  try { execSync(`git -C "${REPO}" merge-base --is-ancestor ${ref} ${MASTER}`, { stdio: 'ignore' }); trap = true; } catch { trap = false; }
  try { files = gLines(`diff --name-only ${MASTER}...${ref}`).filter(Boolean); } catch { files = []; }
  if (relRef && files.length) {
    // covered = does the release hold the SAME blob this branch produced, for every file it changed?
    covered = files.every(f => hash(blob(ref, f)) === hash(blob(relRef, f)));
  }
  return { b, trap, files, covered };
});

// (1b) coverage of env-only commits: each must be an ancestor of the release (or patch-equivalent via cherry)
for (const c of envCommits) {
  c.inBranch = branches.some(b => { try { execSync(`git -C "${REPO}" merge-base --is-ancestor ${c.sha} origin/${b}`, { stdio: 'ignore' }); return true; } catch { return false; } });
  if (relRef) {
    try { execSync(`git -C "${REPO}" merge-base --is-ancestor ${c.sha} ${relRef}`, { stdio: 'ignore' }); c.inRelease = true; }
    catch { c.inRelease = gLines(`cherry ${relRef} ${c.sha} ${c.sha}~1`).some(l => l.startsWith('- ')); } // '-' = patch-equivalent present
  } else c.inRelease = null;
}
const orphanEnvCommits = envCommits.filter(c => !c.inBranch);           // commits no surviving branch carries
const envUncovered = envCommits.filter(c => c.inRelease === false);      // env-only commits absent from the release

// verdict
const stacked = branches.length > 1 || orphanEnvCommits.length > 0;
const reverted = reverts.length > 0;
const anyUncovered = rows.some(r => r.covered === false) || envUncovered.length > 0;

console.log(`\n## audit-ticket #${num}${ver ? ` vs release/${ver}` : ''}  (repo ${REPO})\n`);
console.log(`| signal | value |`);
console.log(`|---|---|`);
console.log(`| rework branches | ${branches.length ? branches.join(' · ') : 'none found'} |`);
console.log(`| STACKED (latest ≠ complete) | ${stacked ? '🚨 YES — reconstruct the FULL footprint, not one branch' : 'no'} |`);
console.log(`| REVERTED on master | ${reverted ? '🚨 YES → ' + reverts.map(r=>r.split(' ')[0]).join(',') + ' (fix may be live nowhere)' : 'no'} |`);
console.log(`| env-history commits (${ENV_REFS.map(r=>r.replace('origin/mlk/','')).join('+') || 'no env refs'}) not in master | ${envCommits.length} · orphan (no surviving branch): ${orphanEnvCommits.length ? '🚨 ' + orphanEnvCommits.map(c=>c.sha.slice(0,10)).join(',') : '0'} |`);
if (envMergesNaming.length) console.log(`| env merges naming a vN branch | ${envMergesNaming.map(l=>l.split('|')[2]).join(' · ')} |`);
if (envCommits.length) {
  console.log(`\n| env commit | date | author | subject | carried by a branch | in release/${ver||'?'} |`);
  console.log(`|---|---|---|---|---|---|`);
  for (const c of envCommits) console.log(`| ${c.sha.slice(0,10)} (${c.env}) | ${c.date} | ${c.author} | ${c.subject.slice(0,60)} | ${c.inBranch ? 'yes' : '🚨 NO — branch deleted'} | ${c.inRelease==null?'—':(c.inRelease?'✅':'❌ MISSING')} |`);
}
console.log(`\n| branch | ancestor-trap (merge=no-op) | files changed | in release/${ver||'?'} |`);
console.log(`|---|---|---|---|`);
for (const r of rows) {
  console.log(`| ${r.b} | ${r.trap ? '🚨 YES' : 'no'} | ${r.files.length}: ${r.files.map(f=>f.split('/').pop()).join(', ') || '—'} | ${r.covered==null?'—':(r.covered?'✅ all blobs match':'❌ MISSING')} |`);
}

// ---- ledger enforcement (deterministic guarantee the stack is classified in the quest MD) ----
let ledgerOk = true;
try {
  const { checkTicket } = require('../../quest/branch-ledger-check.js');
  const lc = checkTicket(num, { repo: REPO });
  ledgerOk = lc.ok;
  if (lc.stacked) {
    console.log(`\n### branch-ledger (quest MD: ${lc.mdPath ? require('path').basename(lc.mdPath) : '🚨 NOT FOUND'})`);
    for (const b of lc.branches) console.log(`  ${lc.rows[b] || '🚨 UNCLASSIFIED'.padEnd(9)}  ${b}`);
    if (lc.missing.length) console.log(`  🚨 classify these before V1: ${lc.missing.join(', ')}`);
    if (lc.negativesAlive.length) console.log(`  🗑️  delete (tagged -NEGATIVE, still on origin): ${lc.negativesAlive.join(', ')}`);
  }
} catch (e) { console.log(`\n(ledger check skipped: ${e.message})`); }

const verdict = (reverted || stacked || anyUncovered || !ledgerOk)
  ? '🚨 DO NOT trust a single branch merge — reconstruct the complete footprint, content-verify the release, and classify every branch in the quest-MD ledger'
  : '✅ single clean branch — normal merge path';
console.log(`\n**verdict:** ${verdict}\n`);
process.exit((anyUncovered || !ledgerOk) ? 1 : 0);
