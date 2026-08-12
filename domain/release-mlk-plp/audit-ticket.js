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

// (3)+(4) per-branch: ancestor-trap + release content coverage
const relRef = ver ? `origin/mlk/release/${ver}` : null;
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

// verdict
const stacked = branches.length > 1;
const reverted = reverts.length > 0;
const anyUncovered = rows.some(r => r.covered === false);

console.log(`\n## audit-ticket #${num}${ver ? ` vs release/${ver}` : ''}  (repo ${REPO})\n`);
console.log(`| signal | value |`);
console.log(`|---|---|`);
console.log(`| rework branches | ${branches.length ? branches.join(' · ') : 'none found'} |`);
console.log(`| STACKED (latest ≠ complete) | ${stacked ? '🚨 YES — reconstruct the FULL footprint, not one branch' : 'no'} |`);
console.log(`| REVERTED on master | ${reverted ? '🚨 YES → ' + reverts.map(r=>r.split(' ')[0]).join(',') + ' (fix may be live nowhere)' : 'no'} |`);
console.log(`\n| branch | ancestor-trap (merge=no-op) | files changed | in release/${ver||'?'} |`);
console.log(`|---|---|---|---|`);
for (const r of rows) {
  console.log(`| ${r.b} | ${r.trap ? '🚨 YES' : 'no'} | ${r.files.length}: ${r.files.map(f=>f.split('/').pop()).join(', ') || '—'} | ${r.covered==null?'—':(r.covered?'✅ all blobs match':'❌ MISSING')} |`);
}

const verdict = (reverted || stacked || anyUncovered)
  ? '🚨 DO NOT trust a single branch merge — reconstruct the complete footprint + content-verify the release'
  : '✅ single clean branch — normal merge path';
console.log(`\n**verdict:** ${verdict}\n`);
process.exit(anyUncovered ? 1 : 0);
