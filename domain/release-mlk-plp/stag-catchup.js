// stag-catchup.js — post-baseline env catch-up: bring mlk/stag-env up to the released mlk/master.
// Called through `release-prep.js stag-catchup` (and its guards in `init` / `merge-to-master`).
//
// WHY (2026-10-23, #246964): after a baseline passes and lands on mlk/master, mlk/stag-env must receive
// the release, or the next ticket deploy to stag-env rebuilds staging WITHOUT the released tickets.
// Asked 2026-08-10 ("We need to have this built as well later"), never built; stag-env sat 21 commits
// behind release 1.8.4 (#218977 #284544 #274266 + the version bump). Pattern it encodes =
// etanah-knowledge/melaka/BRANCH-AND-DEPLOY.md §7 (Aaron merges master/release into stag-env 1-5 days
// after each baseline; int-env is never the source).
//
// Steps: identity + work-clone guard → Melaka fetch → latest-release report (slip proposal A4,
// 2026-09-29) → behind count + missing tickets → merge in a temp worktree → common pin set to the
// RELEASE's own pin in a separate `Ref #<num> - Up common to <ver>` commit, after a nexus check
// (miya 2026-10-23) → compile → [--push] push + read-back audit of origin. Never auto-resolves a conflict.
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { fetchMlk } = require('./fetch-mlk');

const MODULES = {
  plp: { repoName: 'etanah-pelupusan', build: 'build-pelupusan.sh', deploy: 'deploy-pelupusan.sh' },
  awam: { repoName: 'etanah-awam', build: 'build-awam.sh', deploy: 'deploy-awam.sh' },
};
const WORK_ROOT = process.env.STAG_CATCHUP_WORK_ROOT || 'E:\\Dev\\etanah-work';
const ENVS = ['mlk/stag-env', 'mlk/int-env'];
const PIN_RE = /(<etanah\.common\.version>)([^<]+)(<\/etanah\.common\.version>)/;
const LOG = process.env.STAG_CATCHUP_LOG || path.join(__dirname, 'log.jsonl');

class Stop extends Error { constructor(msg, code) { super(msg); this.code = code === undefined ? 2 : code; } }

function git(repo, args, allowFail) {
  const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Stop(`git not runnable: ${r.error.message}`, 1);
  if (r.status !== 0 && !allowFail) throw new Stop(`git ${args.join(' ')} failed:\n${(r.stderr || r.stdout || '').trim()}`, 1);
  return r;
}
const out = (repo, args) => git(repo, args).stdout.trim();
const ok = (repo, args) => git(repo, args, true).status === 0;
function log(result, detail) {
  const { goal_met, dur_ms, ...rest } = detail || {};   // monitoring keys top-level (system-design Rule 16)
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), cmd: 'stag-catchup', result, goal_met, dur_ms, detail: rest }) + '\n'); } catch (_) { /* best effort */ }
}

function pinAt(repo, ref) {
  const pom = git(repo, ['show', `${ref}:pom.xml`], true).stdout || '';
  const m = pom.match(PIN_RE);
  return m ? m[2].trim() : null;
}

// A version tagged in etanah-common git may not be published (1.10.17-MLK, 2026-10-22): the build then
// fails "Could not find artifact". Read nexus's published list before pinning.
const NEXUS = process.env.STAG_CATCHUP_NEXUS_METADATA ||
  'http://172.16.90.169/nexus/content/groups/public/my/gov/etanah/etanah-common/maven-metadata.xml';
const HTTP_GET = "require('http').get(process.argv[1],{timeout:15000},res=>{let d='';res.on('data',c=>d+=c);" +
  "res.on('end',()=>{process.stdout.write(d);process.exit(res.statusCode===200?0:1)})}).on('error',e=>{console.error(e.message);process.exit(1)})";
function nexusVersions() {
  let xml;
  if (!/^https?:/i.test(NEXUS)) xml = fs.readFileSync(NEXUS, 'utf8');   // eval fixture: a local file
  else {
    const r = spawnSync(process.execPath, ['-e', HTTP_GET, NEXUS], { encoding: 'utf8', timeout: 30000, windowsHide: true });
    if (r.status !== 0) throw new Stop(`cannot read nexus (${NEXUS}): ${(r.stderr || '').trim() || 'no answer'} — VPN? Re-run, or --skip-nexus "<reason>"`);
    xml = r.stdout;
  }
  return new Set((xml.match(/<version>[^<]+<\/version>/g) || []).map(v => v.replace(/<\/?version>/g, '').trim()));
}
// Subject verb follows the direction (domain/commit-subject-gate/version-direction.js, #282303).
function pinSubject(ticket, from, to) {
  const { direction, checkSubject } = require('../commit-subject-gate/version-direction.js');
  const subject = `Ref #${ticket} - ${direction(from, to) === 1 ? 'Up' : 'Change'} common to ${to}`;
  if (!checkSubject(subject, from, to).ok) throw new Stop(`internal: subject "${subject}" fails the version-direction rule`, 1);
  return subject;
}

// Non-merge commits only: a release merge commit names a ticket whose code may already be on the env.
function ticketsIn(repo, range) {
  const subj = out(repo, ['log', '--no-merges', '--format=%s', range]);
  return [...new Set((subj.match(/(?:#|\/)(\d{6})\b/g) || []).map(s => s.slice(1)))].sort();
}

// Latest release that has passed (= is in origin/mlk/master). Slip proposal A4 (2026-09-29).
function latestPassedRelease(repo) {
  const rels = out(repo, ['branch', '-r', '--format=%(refname:short)', '--list', 'origin/mlk/release/*']).split('\n')
    .map(s => s.trim()).map(b => { const m = b.match(/^origin\/mlk\/release\/(\d+(?:\.\d+)+)$/); return m ? { b, v: m[1] } : null; }).filter(Boolean)
    .sort((x, y) => { const a = x.v.split('.').map(Number), b = y.v.split('.').map(Number); for (let i = 0; i < Math.max(a.length, b.length); i++) { if ((a[i] || 0) !== (b[i] || 0)) return (b[i] || 0) - (a[i] || 0); } return 0; });
  return rels.find(r => ok(repo, ['merge-base', '--is-ancestor', r.b, 'origin/mlk/master'])) || null;
}

// The read-only measurement every caller shares (stag-catchup --check, init guard, merge-to-master hint).
function measure(repo, env, source) {
  const behind = Number(out(repo, ['rev-list', '--count', `origin/${env}..${source}`]));
  return { env, source, behind, envTip: out(repo, ['rev-parse', `origin/${env}`]), tickets: behind ? ticketsIn(repo, `origin/${env}..${source}`) : [] };
}

function resolveRepo(a) {
  const mod = MODULES[a.module || 'plp'];
  if (!mod) throw new Stop(`--module must be plp or awam (got "${a.module}")`);
  const repo = a.repo || path.join(WORK_ROOT, mod.repoName);
  // Separate-clone rule (auto-memory feedback_etanah_git_separate_clone): write-side git never runs in
  // みや's working repos — his SourceTree reads their refs.
  if (/^[a-z]:[\\/]+projects[\\/]+melaka[\\/]/i.test(path.resolve(repo))) {
    throw new Stop(`REFUSED — ${repo} is みや's working repo. Run the catch-up in the work clone ${path.join(WORK_ROOT, mod.repoName)}`);
  }
  if (!fs.existsSync(repo)) throw new Stop(`repo path not found: ${repo}`);
  const url = out(repo, ['remote', 'get-url', 'origin']);
  if (!new RegExp(`${mod.repoName}(\\.git)?$`, 'i').test(url.replace(/[\\/]+$/, ''))) {
    throw new Stop(`MODULE GUARD: origin "${url}" is not ${mod.repoName} — refusing`);
  }
  return { mod, repo };
}

function pickSource(repo, release) {
  if (!release) return { source: 'origin/mlk/master', note: null };
  const rel = `origin/mlk/release/${release}`;
  if (!ok(repo, ['rev-parse', '--verify', '--quiet', rel])) throw new Stop(`${rel} does not exist`);
  if (ok(repo, ['merge-base', '--is-ancestor', rel, 'origin/mlk/master'])) return { source: 'origin/mlk/master', note: `release ${release} is in origin/mlk/master` };
  return { source: rel, note: `⚠️ release ${release} is NOT in origin/mlk/master yet (Phase F not run) — using the release branch` };
}

function card(mod, env) {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'servers.local.json'), 'utf8')); } catch (_) { /* placeholders */ }
  const b = (cfg.build && cfg.build.host) || '<build.host>';
  const d = (cfg.deploy && cfg.deploy.host) || '<deploy.host>';
  if (env !== 'mlk/stag-env') return [`ssh app@${b}`, 'cd deployment-scripts/mlit', `sh ${mod.deploy}`, `(at the branch prompt) ${env}`];
  return [`ssh app@${b}`, 'cd build-scripts17', `sh ${mod.build} mlk/stag-env`, '(at the env prompt) stag', 'exit', `ssh app@${d}`, 'cd deployment-scripts/stag', `sh ${mod.deploy}`];
}

function run(a) {
  const t0 = Date.now();
  if ('common' in a) throw new Stop("--common is retired: the pin is always the release's own common (miya 2026-10-23)");
  const { mod, repo } = resolveRepo(a);
  const env = a.env || 'mlk/stag-env';
  if (!ENVS.includes(env)) throw new Stop(`--env must be one of ${ENVS.join(' / ')}`);
  const f = fetchMlk(repo);
  if (f.status !== 0) throw new Stop(`fetch failed:\n${f.stderr}`, 1);
  const { source, note } = pickSource(repo, a.release);
  const latest = latestPassedRelease(repo);
  console.log(`· ${mod.repoName}: latest passed release = ${latest ? latest.v : '(none found)'}${note ? ' · ' + note : ''}`);
  const m = measure(repo, env, source);
  if (!m.behind) {
    console.log(`✅ ${env} holds ${source} — nothing to catch up`);
    log('current', { module: a.module || 'plp', env, source });
    return 0;
  }
  console.log(`🚨 ${env} is ${m.behind} commit(s) behind ${source}${m.tickets.length ? ` · tickets missing: ${m.tickets.map(t => '#' + t).join(' ')}` : ''}`);
  if ('check' in a) {
    console.log(`   → catch up: node domain/release-mlk-plp/release-prep.js stag-catchup --module ${a.module || 'plp'}${a.release ? ' --release ' + a.release : ''}${env !== 'mlk/stag-env' ? ' --env ' + env : ''} --push`);
    log('behind', { module: a.module || 'plp', env, source, behind: m.behind, tickets: m.tickets });
    return 3;
  }

  // ── common pin (miya 2026-10-23, #246964): the RELEASE's own pin — never the env's old pin, never the
  // newest number in nexus. BRANCH-AND-DEPLOY.md §7 "Common pin at the catch-up".
  const envPin = pinAt(repo, `origin/${env}`), pin = pinAt(repo, source);
  if (!pin) throw new Stop(`${source} pom.xml has no <etanah.common.version>`, 1);
  console.log(`· common pin: ${env} ${envPin} → release ${pin}${envPin === pin ? ' (same)' : ''}`);
  if (envPin !== pin) {
    if (a['skip-nexus']) console.log(`⚠️  nexus check skipped: ${a['skip-nexus']}`);
    else if (!nexusVersions().has(pin)) {
      log('stop-nexus', { module: a.module || 'plp', env, pin });
      throw new Stop(`🛑 etanah-common ${pin} is NOT published in nexus (${NEXUS}) — the build would fail "Could not find artifact". Nothing merged.`);
    } else console.log(`· nexus: ${pin} is published ✓`);
  }
  const needTicket = () => {
    const t = String(a.ticket || '').replace(/^#/, '');
    if (!/^\d{4,}$/.test(t)) throw new Stop(`🛑 the pin moves ${envPin} → ${pin}: its separate commit "Ref #<num> - Up common to ${pin}" needs --ticket <num>. Nothing pushed.`);
    return t;
  };
  const commitPin = (dir, from) => {
    const pomPath = path.join(dir, 'pom.xml');
    fs.writeFileSync(pomPath, fs.readFileSync(pomPath, 'utf8').replace(PIN_RE, `$1${pin}$3`));
    git(dir, ['add', 'pom.xml']);
    const subject = pinSubject(needTicket(), from, pin);
    git(dir, ['commit', '-m', subject]);
    console.log(`· pin commit: ${subject}`);
  };

  // ── merge in a temp worktree off origin/<env> (the local env branch goes stale — never used) ──
  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'stag-catchup-'));
  fs.rmSync(wt, { recursive: true, force: true });
  git(repo, ['worktree', 'add', '--detach', wt, `origin/${env}`]);
  try {
    const srcName = source.replace(/^origin\//, '');
    const msg = `Merge remote-tracking branch 'remotes/origin/${srcName}' into ${env}`;
    const unmergedIn = () => out(wt, ['diff', '--name-only', '--diff-filter=U']).split('\n').filter(Boolean);
    let r = git(wt, ['merge', '--no-ff', source, '-m', msg], true);
    let unmerged = r.status ? unmergedIn() : [];
    if (r.status && unmerged.length === 1 && unmerged[0] === 'pom.xml' && envPin !== pin) {
      // pom-only conflict: put the pin commit on the env side FIRST (the runbook order for env merges) so
      // both sides carry the same pin line, then merge again. Git merges it; nothing is hand-resolved.
      git(wt, ['merge', '--abort'], true);
      console.log('· pom.xml conflicted — pin commit first, then the merge again');
      commitPin(wt, envPin);
      r = git(wt, ['merge', '--no-ff', source, '-m', msg], true);
      unmerged = r.status ? unmergedIn() : [];
    }
    if (r.status !== 0) {
      git(wt, ['merge', '--abort'], true);
      log('conflict', { module: a.module || 'plp', env, source, files: unmerged });
      throw new Stop(`🛑 CONFLICT merging ${source} into ${env} — nothing kept, nothing pushed. Files:\n   ${unmerged.join('\n   ')}\n` +
        'Resolve by hand in the work clone (deploy skill step 1b order), then merge + push.');
    }
    const merged = pinAt(wt, 'HEAD');
    if (merged !== pin) commitPin(wt, merged);   // separate commit after the merge (miya 2026-10-23)
    const head = out(wt, ['rev-parse', 'HEAD']);
    const files = out(wt, ['diff', '--name-only', `origin/${env}`, 'HEAD']).split('\n').filter(Boolean);
    if (Number(out(wt, ['rev-list', '--count', `HEAD..${source}`])) !== 0) throw new Stop('merge result does not contain the source — investigate', 1);
    console.log(`· merged ${source} → ${env} @ ${head.slice(0, 10)} · ${files.length} file(s) change on ${env}`);
    if (!('push' in a)) {
      console.log(`DRY RUN — merge is clean, nothing pushed. Push it: add --push`);
      out(wt, ['log', '--first-parent', '--format=   %h %s', `origin/${env}..HEAD`]).split('\n').forEach(l => console.log(l));
      log('dry-run', { module: a.module || 'plp', env, source, head, pin, files: files.length });
      return 0;
    }
    // compile the merged tree before it reaches the env branch (deploy skill step 1b); skip only with a reason
    if (a['skip-compile']) console.log(`⚠️  compile skipped: ${a['skip-compile']}`);
    else {
      const cc = process.env.STAG_CATCHUP_COMPILE ? JSON.parse(process.env.STAG_CATCHUP_COMPILE)   // eval stub: JSON argv
        : [process.execPath, path.join(__dirname, '..', 'compile-gate', 'compile-check.js'), 'run'];
      const c = spawnSync(cc[0], [...cc.slice(1), wt], { stdio: 'inherit', windowsHide: true });
      if (c.status !== 0) {
        log('compile-fail', { module: a.module || 'plp', env, source, head });
        throw new Stop(`🛑 COMPILE FAILED on the merged tree — nothing pushed. Fix on a ticket branch, or --skip-compile "<reason>"`);
      }
    }
    git(wt, ['push', 'origin', `HEAD:${env}`]);
    // ── self-audit: read origin back, never trust the push exit code ──
    fetchMlk(repo);
    const remote = out(repo, ['rev-parse', `origin/${env}`]);
    const problems = [];
    if (remote !== head) problems.push(`origin/${env} reads ${remote.slice(0, 10)}, expected ${head.slice(0, 10)}`);
    if (Number(out(repo, ['rev-list', '--count', `origin/${env}..${source}`])) !== 0) problems.push(`origin/${env} still lacks ${source}`);
    if (pin && pinAt(repo, `origin/${env}`) !== pin) problems.push(`origin/${env} pins ${pinAt(repo, `origin/${env}`)}, expected ${pin}`);
    log(problems.length ? 'audit-fail' : 'pushed', { module: a.module || 'plp', env, source, head, pin, behind: m.behind, tickets: m.tickets, dur_ms: Date.now() - t0, goal_met: !problems.length });
    if (problems.length) throw new Stop(`🚨 SELF-AUDIT FAILED after push:\n  - ${problems.join('\n  - ')}`, 1);
    console.log(`✅ pushed + read back: origin/${env} = ${head.slice(0, 10)} holds ${source} · common ${pin}`);
    console.log(`   new on ${env} (newest first; revert each, merge with -m 1):`);
    out(repo, ['log', '--first-parent', '--format=   %h %s', `${m.envTip}..${remote}`]).split('\n').forEach(l => console.log(l));
    console.log(`\nBUILD + DEPLOY card (one command per block when shown to みや):`);
    card(mod, env).forEach((l, i) => console.log(`  ${i + 1}. ${l}`));
    return 0;
  } finally {
    git(repo, ['worktree', 'remove', '--force', wt], true);
    git(repo, ['worktree', 'prune'], true);
  }
}

module.exports = { run, measure, nexusVersions, pinSubject, latestPassedRelease, ticketsIn, Stop };
