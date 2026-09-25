#!/usr/bin/env node
// env-tested.js — was a ticket branch's code ever on a test env (int-env / stag-env), and is it STILL there?
// Born 2026-09-23 (Baseline 1.6.3): mlk/esokongan/280166 carried 88 lines of Java that never reached
// int-env or stag-env — the real fix was the PLPS flowable model — yet it was merged into the release.
// BA only ever tests what is on an env, so branch code absent from every env = code nobody tested.
//
// Signal (per branch, vs the master it forks from):
//   reached  = branch commits present on an env (ancestor, or patch-equivalent via `git cherry`)
//   lineCov  = share of the branch's net ADDED lines (+ binary blobs) found in the env's current file
// Verdict:
//   TESTED    lineCov >= 0.9 on some env
//   UNTESTED  no branch commit ever reached an env          → code BA never saw
//   REMOVED   commits reached an env but the code is gone   → reverted / overwritten there
//   EMPTY     branch adds nothing over master
//
// CLI:  node domain/release-mlk-plp/env-tested.js <branch|ref> [...]   (repo: PLP_REPO or etanah-pelupusan)

const { spawnSync } = require('child_process');

const ENV_REFS = ['origin/mlk/int-env', 'origin/mlk/stag-env'];
const THRESHOLD = 0.9;
const BINARY_RE = /\.(docx|doc|xlsx|pdf|png|jpe?g|gif|jasper|zip|jar)$/i;
const TRIVIAL_RE = /^[\s{}();,\[\]]*$/;

function run(repo, args, allowFail = true) {
  const r = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0 && !allowFail) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
  return r.status === 0 ? r.stdout : null;
}
const lines = (s) => (s || '').split('\n').map(l => l.trim()).filter(Boolean);
const refExists = (repo, ref) => run(repo, ['rev-parse', '--verify', '-q', ref]) !== null;
const isAncestor = (repo, a, b) => spawnSync('git', ['-C', repo, 'merge-base', '--is-ancestor', a, b]).status === 0;

function checkEnvTested(repo, branchRef, base = 'origin/mlk/master', envRefs = ENV_REFS) {
  const envs = envRefs.filter(r => refExists(repo, r));
  const commits = lines(run(repo, ['rev-list', '--no-merges', branchRef, '--not', base]));
  if (!commits.length) return { branchRef, verdict: 'EMPTY', commits: 0, reached: 0, lineCov: 1, bestEnv: null, missing: [] };

  const reachedShas = commits.filter(c => envs.some(e =>
    isAncestor(repo, c, e) || lines(run(repo, ['cherry', e, c, `${c}~1`])).some(l => l.startsWith('- '))));

  const mb = (run(repo, ['merge-base', base, branchRef]) || '').trim();
  const files = lines(run(repo, ['diff', '--name-only', '--diff-filter=AM', mb, branchRef]));
  const units = [];   // { file, text } for text lines; { file, blob } for binaries
  for (const f of files) {
    if (BINARY_RE.test(f)) { units.push({ file: f, blob: (run(repo, ['rev-parse', `${branchRef}:${f}`]) || '').trim() }); continue; }
    const diff = run(repo, ['diff', '-U0', mb, branchRef, '--', f]) || '';
    for (const l of diff.split('\n')) {
      if (!l.startsWith('+') || l.startsWith('+++')) continue;
      const t = l.slice(1).trim();
      if (t && !TRIVIAL_RE.test(t)) units.push({ file: f, text: t });
    }
  }
  if (!units.length) return { branchRef, verdict: 'EMPTY', commits: commits.length, reached: reachedShas.length, lineCov: 1, bestEnv: null, missing: [] };

  let best = { env: null, cov: -1, missing: [] };
  for (const e of envs) {
    const cache = {};
    const missing = units.filter(u => {
      if (u.blob !== undefined) return (run(repo, ['rev-parse', `${e}:${u.file}`]) || '').trim() !== u.blob;
      if (!(u.file in cache)) cache[u.file] = new Set(lines(run(repo, ['show', `${e}:${u.file}`])));
      return !cache[u.file].has(u.text);
    });
    const cov = 1 - missing.length / units.length;
    if (cov > best.cov) best = { env: e.replace('origin/', ''), cov, missing };
  }
  const verdict = best.cov >= THRESHOLD ? 'TESTED' : (reachedShas.length ? 'REMOVED' : 'UNTESTED');
  return {
    branchRef, verdict, commits: commits.length, reached: reachedShas.length,
    lineCov: Math.round(best.cov * 100) / 100, bestEnv: best.env,
    units: units.length, missing: best.missing.slice(0, 5).map(u => `${u.file.split('/').pop()}: ${u.text || '(binary differs)'}`),
  };
}

const ICON = { TESTED: '✅ TESTED', UNTESTED: '🚨 UNTESTED — never on int-env/stag-env', REMOVED: '🚨 REMOVED — was on an env, code no longer there (reverted?)', EMPTY: '· EMPTY — adds nothing over master' };
function describe(r) {
  return `${ICON[r.verdict]} · commits on env ${r.reached}/${r.commits} · code on ${r.bestEnv || '—'} ${Math.round(r.lineCov * 100)}%`;
}

module.exports = { checkEnvTested, describe, ENV_REFS, THRESHOLD };

if (require.main === module) {
  const repo = process.env.PLP_REPO || 'E:\\Projects\\Melaka\\etanah-pelupusan';
  const refs = process.argv.slice(2);
  if (!refs.length) { console.error('usage: env-tested.js <branch|ref> [...]'); process.exit(2); }
  let bad = 0;
  for (const raw of refs) {
    const ref = refExists(repo, raw) ? raw : `origin/${raw}`;
    const r = checkEnvTested(repo, ref);
    console.log(`${raw}: ${describe(r)}`);
    for (const m of r.missing || []) if (r.verdict !== 'TESTED') console.log(`   missing: ${m}`);
    if (r.verdict === 'UNTESTED' || r.verdict === 'REMOVED') bad++;
  }
  process.exit(bad ? 1 : 0);
}
