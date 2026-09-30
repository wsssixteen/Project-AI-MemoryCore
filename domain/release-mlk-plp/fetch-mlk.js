// Melaka-only fetch for the PLP release tooling (2026-09-28, Baseline 1.7.0).
// A plain `git fetch origin --prune` pulls every state's refs (sgr/trg/kdh/prk… ~2,400) although a
// Melaka release only ever reads refs/heads/mlk/*. On 1.7.0 it collided with another process's fetch
// on origin/prk/stag-env ("incorrect old value provided") and aborted `init`.
// Scope = mlk/* only, keep the repo's own negative refspecs for mlk (Windows case-collision guards,
// e.g. ^refs/heads/mlk/cr/259112), and retry once when another fetch updated the same ref first.
const { spawnSync } = require('child_process');

const RACE_RE = /incorrect old value|cannot lock ref|unable to update local ref/i;

function run(repo, args) {
  return spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
}

function mlkFetchArgs(repo) {
  const cfg = run(repo, ['config', '--get-all', 'remote.origin.fetch']).stdout || '';
  const negatives = cfg.split(/\r?\n/).map(s => s.trim()).filter(s => s.startsWith('^refs/heads/mlk/'));
  return ['fetch', 'origin', '--prune', '+refs/heads/mlk/*:refs/remotes/origin/mlk/*', ...negatives];
}

function fetchMlk(repo) {
  const args = mlkFetchArgs(repo);
  let r = run(repo, args);
  if (r.status !== 0 && RACE_RE.test(r.stderr || '')) r = run(repo, args);
  return { status: r.status, stderr: (r.stderr || '').trim(), args, error: r.error };
}

module.exports = { fetchMlk, mlkFetchArgs, RACE_RE };
