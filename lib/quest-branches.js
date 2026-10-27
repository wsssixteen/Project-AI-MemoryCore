#!/usr/bin/env node
// quest-branches: every branch a ticket has, in every repo of its state, with its module and where it sits.
// Born 2026-10-27 per miya (#264355): two branches under one ticket (Awam + Pelupusan, one held on purpose)
// and I answered from git alone, called the held one "missed at merge", and offered to merge it.
//
// Usage:
//   node lib/quest-branches.js <num>                      print the "## Branches" table for the quest doc
//   node lib/quest-branches.js <num> --check <qa_doc>     exit 1 when the doc's "## Branches" section misses a branch
//   options: --state <key> (default melaka) · --work <dir> (default E:\Dev\etanah-work) · --no-fetch
//
// The State column is never guessed: the script writes "?" and the quest save fills it
// (verified by BA · deployed int-env · held: <reason> · dropped: <reason>).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const LABELS = { 'etanah-awam': 'Awam', 'etanah-pelupusan': 'Pelupusan', 'etanah-common': 'Common', 'etanah-spoc-hasil': 'SPOC Hasil', 'etanah-teknikal': 'Teknikal', 'etanah-uam': 'UAM' };
const ENV_BRANCH = /(int-env|stag-env|mlit|\/master$|release)/;

function moduleLabel(repo) { return LABELS[repo] || repo; }

// Which found branches does the doc's "## Branches" section not name?
function missingBranches(docText, branches) {
  const m = /^##\s+Branches\b[^\n]*\n([\s\S]*?)(?=^##\s|\s*$(?![\s\S]))/m.exec(docText || '');
  if (!m) return { section: false, missing: branches.map(b => b.branch) };
  const body = m[1];
  // whole-name match: mlk/qa/264355 must not pass on the strength of mlk/qa/264355v2
  const named = n => new RegExp(n.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '(?![\\w.-])').test(body);
  return { section: true, missing: branches.map(b => b.branch).filter(n => !named(n)) };
}

function git(dir, args) {
  try { return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 }).trim(); }
  catch (_) { return null; }
}
function inRef(dir, sha, ref) {
  try { execFileSync('git', ['-C', dir, 'merge-base', '--is-ancestor', sha, ref], { stdio: 'ignore' }); return 'yes'; }
  catch (e) { return e.status === 1 ? 'no' : '-'; }
}

function findBranches(num, { state = 'melaka', work = 'E:\\Dev\\etanah-work', fetch = true } = {}) {
  const states = require('./states.js');
  const rec = states.get(state);
  if (!rec) throw new Error(`state not found: ${state}`);
  const repos = Object.values(rec.modules || {}).map(m => m.repo).filter(Boolean);
  if (!repos.includes('etanah-uam') && fs.existsSync(path.join(work, 'etanah-uam'))) repos.push('etanah-uam');
  const rows = [];
  for (const repo of repos) {
    const dir = path.join(work, repo);
    if (!fs.existsSync(path.join(dir, '.git'))) continue;
    if (fetch) git(dir, ['fetch', '-q', 'origin']);
    const trunk = (Object.values(rec.modules).find(m => m.repo === repo) || {}).trunk || 'mlk/master';
    const list = (git(dir, ['branch', '-r', '--list', `*${num}*`, '--format=%(refname:short)']) || '')
      .split('\n').map(s => s.trim()).filter(Boolean).filter(b => !ENV_BRANCH.test(b));
    for (const ref of list) {
      const tip = git(dir, ['rev-parse', '--short=10', ref]);
      const subject = git(dir, ['log', '-1', '--format=%an %ad %s', '--date=short', ref]) || '';
      rows.push({
        module: moduleLabel(repo), repo, branch: ref.replace(/^origin\//, ''), tip, subject,
        intEnv: inRef(dir, tip, 'origin/mlk/int-env'), stagEnv: inRef(dir, tip, 'origin/mlk/stag-env'), trunk: inRef(dir, tip, `origin/${trunk}`),
      });
    }
  }
  return rows;
}

function table(rows) {
  const out = ['| Module | Branch | Tip | int-env | stag-env | master | Commit | State |', '|---|---|---|---|---|---|---|---|'];
  for (const r of rows) out.push(`| ${r.module} | \`${r.branch}\` (${r.module}) | ${r.tip} | ${r.intEnv} | ${r.stagEnv} | ${r.trunk} | ${r.subject.replace(/\|/g, '/')} | ? |`);
  if (!rows.length) out.push('| - | no ticket branch in any repo | - | - | - | - | - | - |');
  return out.join('\n');
}

// footprint: on-demand at quest save: 1 node + 1 git fetch per repo (~5), no daemon. retention: rotate monthly (telemetry).
function logRow(row) {
  try {
    const p = path.join(__dirname, '..', 'system', 'telemetry', 'quest-branches.jsonl');
    fs.appendFileSync(p, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n');
  } catch (_) {}
}

if (require.main === module) {
  const t0 = Date.now();
  const argv = process.argv.slice(2);
  const opt = k => { const i = argv.indexOf(`--${k}`); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : null; };
  const num = (argv.find(a => /\d{5,}/.test(a)) || '').replace(/\D/g, '');
  if (!num) { console.error('usage: node lib/quest-branches.js <num> [--check <qa_doc>] [--state <key>] [--work <dir>] [--no-fetch]'); process.exit(2); }
  let rows;
  try { rows = findBranches(num, { state: opt('state') || 'melaka', work: opt('work') || 'E:\\Dev\\etanah-work', fetch: !opt('no-fetch') }); }
  catch (e) { console.error(`QUEST-BRANCHES: ${num} · ${e.message}`); process.exit(2); }
  const check = opt('check');
  if (check && check !== true) {
    let doc = '';
    try { doc = fs.readFileSync(check, 'utf8'); } catch (_) { console.error(`QUEST-BRANCHES: ${num} · cannot read ${check}`); process.exit(2); }
    const r = missingBranches(doc, rows);
    logRow({ num, branches: rows.length, outcome: (!r.section || r.missing.length) ? 'fail' : 'pass', goal_met: !(!r.section || r.missing.length), missing: r.missing, dur_ms: Date.now() - t0 });
    if (!r.section || r.missing.length) {
      console.log(`QUEST-BRANCHES: ${num} · ${rows.length} branch(es) · FAIL ${r.section ? 'missing in ## Branches: ' + r.missing.join(', ') : 'no ## Branches section'}`);
      console.log('Add this section to the quest doc and fill the State column:\n\n## Branches\n\n' + table(rows));
      process.exit(1);
    }
    console.log(`QUEST-BRANCHES: ${num} · ${rows.length} branch(es) · PASS (all named in ## Branches)`);
    process.exit(0);
  }
  console.log(`QUEST-BRANCHES: ${num} · ${rows.length} branch(es)\n\n## Branches\n\n` + table(rows));
}

module.exports = { missingBranches, moduleLabel, findBranches, table };
