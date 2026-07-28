#!/usr/bin/env node
/**
 * release-prep.js — deterministic git mechanics for a Melaka Pelupusan release branch.
 *
 * Feature: domain/release-mlk-plp/  (state-specific: MLK + PLP only; duplicate the
 * folder as release-<state>-<module> for future expansion — do NOT generalize this one).
 *
 * Phases (each subcommand = one stop-point boundary; the /release-mlk-plp skill drives them):
 *   init   --release 1.0.9 --tickets "269802=mlk/internal-issue/269802,..." [--repo <path>]
 *          preflight: repo identity + clean tree + fetch + ALL ticket branches exist on
 *          origin + target branch does NOT exist. Writes state (phase=planned).
 *   branch  checkout mlk/master -> merge --ff-only origin/mlk/master -> create mlk/release/<ver>
 *   merge   merge each ticket branch (--no-ff) sequentially; STOPS DEAD on first conflict
 *           (exit 2, files listed). NEVER auto-resolves.
 *   merge-continue  after a human-nodded resolution is staged: commits + resumes the loop
 *   verify  git rev-list origin/<src> --not HEAD --count == 0 per ticket -> emits check-table,
 *           records HEAD sha (push refuses if HEAD moves after verify)
 *   push    ONLY when phase=verified AND HEAD unchanged AND branch matches
 *           ^mlk/release/\d+\.\d+(\.\d+)?$  -> git push -u origin <branch>
 *   status  print state
 *
 * HARD GUARDS (every command): origin URL must contain "etanah-pelupusan" (PLP-only rule);
 * release format \d+.\d+[.\d+]. Fail = loud exit, never warn-and-continue.
 *
 * State: state/release-<ver>.json (override dir via RELEASE_MLK_PLP_STATE_DIR — eval uses it).
 * Log:   log.jsonl (append per command).
 * BUILD/DEPLOY (ssh) are NOT here — they live in the skill (different failure domain).
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STATE_DIR = process.env.RELEASE_MLK_PLP_STATE_DIR || path.join(__dirname, 'state');
const LOG = path.join(__dirname, 'log.jsonl');
const RELEASE_RE = /^\d+\.\d+(\.\d+)?$/;
const BRANCH_RE = /^mlk\/release\/\d+\.\d+(\.\d+)?$/;
const DEFAULT_REPO = 'E:\\Projects\\Melaka\\etanah-pelupusan';

function log(cmd, release, result, detail) {
  try {
    fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), cmd, release, result, detail }) + '\n');
  } catch (e) { /* best effort */ }
}
function die(msg, code) {
  console.error('⛔ ' + msg);
  process.exit(code === undefined ? 1 : code);
}
function git(repo, args, allowFail) {
  const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  if (r.error) die(`git not runnable: ${r.error.message}`);
  if (r.status !== 0 && !allowFail) {
    die(`git ${args.join(' ')} failed:\n${(r.stderr || r.stdout || '').trim()}`);
  }
  return r;
}
function gitOut(repo, args) { return git(repo, args).stdout.trim(); }

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i++; }
    else out._.push(argv[i]);
  }
  return out;
}

function statePath(release) { return path.join(STATE_DIR, `release-${release}.json`); }
function loadState(release) {
  const p = statePath(release);
  if (!fs.existsSync(p)) die(`no state for release ${release} — run init first (${p})`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function saveState(st) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(statePath(st.release), JSON.stringify(st, null, 2));
}

function ensureRepo(repo) {
  if (!repo || !fs.existsSync(repo)) die(`repo path not found: ${repo}`);
  git(repo, ['rev-parse', '--git-dir']);
  const url = gitOut(repo, ['remote', 'get-url', 'origin']);
  if (!/etanah-pelupusan/i.test(url)) {
    die(`PLP-ONLY GUARD: origin "${url}" is not etanah-pelupusan — refusing to touch this repo`);
  }
}
function ensureClean(repo) {
  const s = gitOut(repo, ['status', '--porcelain']);
  if (s) die(`working tree NOT clean — stash/commit first:\n${s}`);
}
function ensureOnBranch(repo, branch) {
  const cur = gitOut(repo, ['branch', '--show-current']);
  if (cur !== branch) die(`expected to be on ${branch}, currently on ${cur || '(detached)'}`);
}
function remoteBranchExists(repo, branch) {
  return gitOut(repo, ['ls-remote', '--heads', 'origin', branch]) !== '';
}
function mergeInProgress(repo) {
  return git(repo, ['rev-parse', '--verify', '--quiet', 'MERGE_HEAD'], true).status === 0;
}
function unmergedFiles(repo) {
  return gitOut(repo, ['diff', '--name-only', '--diff-filter=U']).split('\n').filter(Boolean);
}

function parseTickets(spec) {
  return spec.split(',').map(t => {
    const [ticket, src] = t.split('=').map(s => s.trim());
    if (!ticket || !src) die(`bad ticket entry "${t}" — use <ticket>=<branch>`);
    return { ticket, src, merged: false };
  });
}

function cmdInit(a) {
  const release = a.release;
  if (!release || !RELEASE_RE.test(release)) die(`--release must be like 1.0.9 (got "${release}")`);
  const branch = `mlk/release/${release}`;
  if (!BRANCH_RE.test(branch)) die(`derived branch "${branch}" fails the release-branch pattern`);
  const repo = a.repo || DEFAULT_REPO;
  ensureRepo(repo);
  ensureClean(repo);
  // --tickets is OPTIONAL here (2026-07-16 per miya): the branch needs only fresh mlk/master,
  // so it can be cut while recon still decides the merge list — tickets land via `set-tickets`.
  const tickets = a.tickets ? parseTickets(a.tickets) : [];

  console.log('· fetching origin…');
  git(repo, ['fetch', 'origin', '--prune']);
  if (!remoteBranchExists(repo, 'mlk/master')) die('origin has no mlk/master — wrong repo?');
  if (remoteBranchExists(repo, branch)) die(`${branch} ALREADY EXISTS on origin — pick another number or handle manually`);
  if (git(repo, ['rev-parse', '--verify', '--quiet', branch], true).status === 0) {
    die(`${branch} already exists LOCALLY — delete/rename it first (git branch -d ${branch})`);
  }
  const missing = tickets.filter(t => !remoteBranchExists(repo, t.src));
  if (missing.length) {
    die('PREFLIGHT FAIL — these ticket branches do NOT exist on origin (all-or-nothing rule):\n'
      + missing.map(t => `   ${t.ticket} -> ${t.src}`).join('\n'), 2);
  }

  const st = { release, branch, repo, tickets, phase: 'planned', conflict: null, headSha: null, created: new Date().toISOString() };
  saveState(st);
  log('init', release, 'ok');
  console.log(`\n✅ PREFLIGHT PASSED — plan for ${branch} (repo: ${repo})`);
  if (tickets.length) {
    console.log('| Ticket | Source branch | On origin |');
    console.log('|---|---|---|');
    tickets.forEach(t => console.log(`| #${t.ticket} | ${t.src} | ✓ |`));
    console.log('\nphase=planned · next: [V1 nod] then `branch`');
  } else {
    console.log('no tickets yet — `branch` may run now (branch needs only mlk/master); set the merge list later via `set-tickets` [V1 nod].');
  }
}

// Set/replace the merge list AFTER init/branch — lets the branch be cut while recon still
// runs (2026-07-16 per miya). Same all-or-nothing preflight as init, just deferred; only
// editable before any merge has landed.
function cmdSetTickets(a) {
  const st = loadState(a.release);
  if (st.phase !== 'planned' && st.phase !== 'branched') {
    die(`SET-TICKETS REFUSED — phase is ${st.phase}; the merge list is only editable before merging starts`, 2);
  }
  if (!a.tickets) die('--tickets required, e.g. "269939=mlk/internal-issue/269939,..."');
  ensureRepo(st.repo);
  const tickets = parseTickets(a.tickets);
  git(st.repo, ['fetch', 'origin', '--prune']);
  const missing = tickets.filter(t => !remoteBranchExists(st.repo, t.src));
  if (missing.length) {
    die('PREFLIGHT FAIL — these ticket branches do NOT exist on origin (all-or-nothing rule):\n'
      + missing.map(t => `   ${t.ticket} -> ${t.src}`).join('\n'), 2);
  }
  st.tickets = tickets;
  saveState(st);
  log('set-tickets', st.release, 'ok', tickets.map(t => t.src));
  console.log(`✅ merge list set — ${tickets.length} ticket(s)`);
  console.log('| Ticket | Source branch | On origin |');
  console.log('|---|---|---|');
  tickets.forEach(t => console.log(`| #${t.ticket} | ${t.src} | ✓ |`));
  console.log('\nnext: `merge`');
}

function cmdBranch(a) {
  const st = loadState(a.release);
  if (st.phase !== 'planned') die(`phase is ${st.phase}, expected planned`);
  ensureRepo(st.repo);
  ensureClean(st.repo);
  git(st.repo, ['checkout', 'mlk/master']);
  git(st.repo, ['fetch', 'origin']);
  git(st.repo, ['merge', '--ff-only', 'origin/mlk/master']);
  git(st.repo, ['checkout', '-b', st.branch]);
  st.phase = 'branched';
  saveState(st);
  log('branch', st.release, 'ok');
  console.log(`✅ ${st.branch} created off fresh mlk/master (${gitOut(st.repo, ['rev-parse', '--short', 'HEAD'])})`);
  console.log('phase=branched · next: `merge`');
}

function doMergeLoop(st) {
  for (const t of st.tickets) {
    if (t.merged) continue;
    console.log(`· merging #${t.ticket} (origin/${t.src})…`);
    const r = git(st.repo, ['merge', '--no-ff', `origin/${t.src}`], true);
    if (r.status !== 0) {
      const files = unmergedFiles(st.repo);
      st.phase = 'merging';
      st.conflict = { ticket: t.ticket, src: t.src, files };
      saveState(st);
      log('merge', st.release, 'conflict', st.conflict);
      console.error(`\n🛑 CONFLICT on #${t.ticket} (${t.src}) — STOPPED, nothing auto-resolved.`);
      console.error('Conflicted files:');
      files.forEach(f => console.error('   ' + f));
      console.error('\nResolve (with みや\'s nod per file), `git add` them, then run `merge-continue`.');
      process.exit(2);
    }
    t.merged = true;
    st.conflict = null;
    saveState(st);
    console.log(`   ✓ #${t.ticket} merged`);
  }
  st.phase = 'merged';
  saveState(st);
  log('merge', st.release, 'ok');
  console.log('\n✅ all ticket branches merged · phase=merged · next: `verify`');
}

function cmdMerge(a) {
  const st = loadState(a.release);
  if (st.phase !== 'branched' && st.phase !== 'merging') die(`phase is ${st.phase}, expected branched/merging`);
  if (!st.tickets.length) die('no tickets set — run `set-tickets --release ' + st.release + ' --tickets "..."` first (V1)', 2);
  ensureRepo(st.repo);
  ensureOnBranch(st.repo, st.branch);
  if (mergeInProgress(st.repo)) die('a merge is already in progress — resolve it and run `merge-continue`', 2);
  doMergeLoop(st);
}

function cmdMergeContinue(a) {
  const st = loadState(a.release);
  if (st.phase !== 'merging' || !st.conflict) die(`no recorded conflict for ${a.release} (phase=${st.phase})`);
  ensureRepo(st.repo);
  ensureOnBranch(st.repo, st.branch);
  const un = unmergedFiles(st.repo);
  if (un.length) die('still-unresolved files:\n' + un.map(f => '   ' + f).join('\n'), 2);
  if (mergeInProgress(st.repo)) git(st.repo, ['commit', '--no-edit']);
  const t = st.tickets.find(x => x.ticket === st.conflict.ticket);
  if (t) t.merged = true;
  st.conflict = null;
  saveState(st);
  console.log(`   ✓ #${t ? t.ticket : '?'} conflict resolved + committed`);
  doMergeLoop(st);
}

function cmdVerify(a) {
  const st = loadState(a.release);
  if (st.phase !== 'merged') die(`phase is ${st.phase}, expected merged`);
  ensureRepo(st.repo);
  ensureOnBranch(st.repo, st.branch);
  let allOk = true;
  console.log(`\nMERGE VERIFICATION — ${st.branch}`);
  console.log('| Ticket | Source branch | Commits missing from release | OK |');
  console.log('|---|---|---|---|');
  for (const t of st.tickets) {
    const missing = gitOut(st.repo, ['rev-list', `origin/${t.src}`, '--not', 'HEAD', '--count']);
    const ok = missing === '0';
    if (!ok) allOk = false;
    console.log(`| #${t.ticket} | ${t.src} | ${missing} | ${ok ? '✓' : '✗'} |`);
  }
  if (!allOk) { log('verify', st.release, 'fail'); die('verification FAILED — see ✗ rows', 2); }
  st.headSha = gitOut(st.repo, ['rev-parse', 'HEAD']);
  st.phase = 'verified';
  saveState(st);
  log('verify', st.release, 'ok', st.headSha);
  console.log(`\n✅ verified at ${st.headSha.slice(0, 10)} · phase=verified · next: [V3 nod] then \`push\``);
}

// Bump etanah-pelupusan's OWN <version> in pom.xml (never parent, never plugin).
// Pattern anchor: the <version> line directly following <artifactId>etanah-pelupusan</artifactId>.
// Matches Ridhwan's manual bump commit a99194b02e on origin/mlk/release/1.0.9 verbatim.
function cmdBumpVersion(a) {
  const st = loadState(a.release);
  if (st.phase !== 'verified' && st.phase !== 'bumped') die(`BUMP REFUSED — phase is ${st.phase}, expected verified/bumped (run verify first)`, 2);
  ensureRepo(st.repo);
  ensureOnBranch(st.repo, st.branch);
  const pomPath = path.join(st.repo, 'pom.xml');
  const pom = fs.readFileSync(pomPath, 'utf8');
  const re = /(<artifactId>etanah-pelupusan<\/artifactId>\s*\r?\n\s*<version>)([^<]+)(<\/version>)/;
  const m = pom.match(re);
  if (!m) die('could not find etanah-pelupusan <version> tag in pom.xml');
  if (m[2] === st.release) {
    console.log(`· pom.xml already at ${st.release} — skipping bump commit`);
    st.phase = 'bumped';
    saveState(st);
    log('bump-version', st.release, 'noop', st.headSha);
    return;
  }
  const before = m[2];
  // Counter-rail (DON'Ts #1/#2/#3): the ONLY established edit is this one number.
  // Anything else in the tree = someone did something not on the pipeline page -> REFUSE.
  const dirtyBefore = gitOut(st.repo, ['status', '--porcelain']);
  if (dirtyBefore) die(`BUMP REFUSED — working tree must be clean before the bump; found:\n${dirtyBefore}`, 2);
  fs.writeFileSync(pomPath, pom.replace(re, `$1${st.release}$3`));
  // Assert the produced diff is EXACTLY: 1 file (pom.xml) · 1 removed line · 1 added line ·
  // both being the etanah-pelupusan <version> line · old->new is the expected number pair.
  const files = gitOut(st.repo, ['diff', '--name-only']).split('\n').filter(Boolean);
  if (files.length !== 1 || files[0] !== 'pom.xml') {
    git(st.repo, ['checkout', '--', '.'], true);
    die(`BUMP REFUSED — edit touched files other than pom.xml (reverted): ${files.join(', ')}`, 2);
  }
  const body = gitOut(st.repo, ['diff', '-U0', '--', 'pom.xml']).split('\n');
  const strip = l => l.slice(1).trim(); // drop the +/- marker, then the indentation
  const removed = body.filter(l => /^-[^-]/.test(l));
  const added = body.filter(l => /^\+[^+]/.test(l));
  const okShape = removed.length === 1 && added.length === 1
    && strip(removed[0]) === `<version>${before}</version>`
    && strip(added[0]) === `<version>${st.release}</version>`;
  if (!okShape) {
    git(st.repo, ['checkout', '--', 'pom.xml'], true);
    die(`BUMP REFUSED — diff is not a clean single version-line change (reverted).\nremoved: ${JSON.stringify(removed)}\nadded:   ${JSON.stringify(added)}`, 2);
  }
  git(st.repo, ['add', 'pom.xml']);
  git(st.repo, ['commit', '-m', `pelupusan version: ${st.release}`]);
  st.headSha = gitOut(st.repo, ['rev-parse', 'HEAD']);
  st.phase = 'bumped';
  saveState(st);
  log('bump-version', st.release, 'ok', { from: before, to: st.release, headSha: st.headSha });
  console.log(`✅ pom.xml bumped ${before} → ${st.release} + committed (${st.headSha.slice(0, 10)}) · phase=bumped · next: \`push\``);
}

// Bump <etanah.common.version> ON THE RELEASE BRANCH — a real Baseline step, not Aaron-only.
// VERIFIED 2026-07-16 (みや's Q): the common bump does NOT flow from mlk/master. Proof —
//   git branch -r --contains d19b0b2b0a  -> ONLY origin/mlk/release/1.0.9
//   origin/mlk/master pom still reads 1.0.71-MLK; release/1.0.9 reads 1.0.129-MLK
// So a release branched fresh off mlk/master starts WITHOUT the common fix; whoever runs the
// Baseline must add this commit or the release silently ships without it (#270952's whole fix).
// SCOPE: this touches ONE line in etanah-pelupusan's pom. It NEVER touches the etanah-common
// repo or cuts a common release — that remains Aaron/common-team's (DON'T #3, narrowed).
// The --common value should come from redmine-recon's COMMON-VER verdict, never invented.
function cmdBumpCommon(a) {
  const st = loadState(a.release);
  if (!['merged', 'verified', 'bumped'].includes(st.phase)) die(`BUMP-COMMON REFUSED — phase is ${st.phase}, expected merged/verified/bumped`, 2);
  const want = a.common;
  if (!want || !/^\d+\.\d+\.\d+[\w.-]*-MLK$/.test(want)) die(`--common must look like 1.0.129-MLK (got "${want}")`, 2);
  ensureRepo(st.repo);
  ensureOnBranch(st.repo, st.branch);
  const pomPath = path.join(st.repo, 'pom.xml');
  const pom = fs.readFileSync(pomPath, 'utf8');
  const re = /(<etanah\.common\.version>)([^<]+)(<\/etanah\.common\.version>)/;
  const m = pom.match(re);
  if (!m) die('could not find <etanah.common.version> in pom.xml');
  if (m[2] === want) {
    console.log(`· common already at ${want} — skipping`);
    log('bump-common', st.release, 'noop', want);
    return;
  }
  const before = m[2];
  const dirty = gitOut(st.repo, ['status', '--porcelain']);
  if (dirty) die(`BUMP-COMMON REFUSED — working tree must be clean; found:\n${dirty}`, 2);
  fs.writeFileSync(pomPath, pom.replace(re, `$1${want}$3`));
  // Same counter-rail as bump-version: exactly 1 file, exactly the common-version line.
  const files = gitOut(st.repo, ['diff', '--name-only']).split('\n').filter(Boolean);
  if (files.length !== 1 || files[0] !== 'pom.xml') {
    git(st.repo, ['checkout', '--', '.'], true);
    die(`BUMP-COMMON REFUSED — touched files other than pom.xml (reverted): ${files.join(', ')}`, 2);
  }
  const body = gitOut(st.repo, ['diff', '-U0', '--', 'pom.xml']).split('\n');
  const strip = l => l.slice(1).trim();
  const removed = body.filter(l => /^-[^-]/.test(l));
  const added = body.filter(l => /^\+[^+]/.test(l));
  const ok = removed.length === 1 && added.length === 1
    && strip(removed[0]) === `<etanah.common.version>${before}</etanah.common.version>`
    && strip(added[0]) === `<etanah.common.version>${want}</etanah.common.version>`;
  if (!ok) {
    git(st.repo, ['checkout', '--', 'pom.xml'], true);
    die(`BUMP-COMMON REFUSED — not a clean single common-version change (reverted).\nremoved: ${JSON.stringify(removed)}\nadded:   ${JSON.stringify(added)}`, 2);
  }
  git(st.repo, ['add', 'pom.xml']);
  git(st.repo, ['commit', '-m', `common version increase to: ${want}`]); // mirrors aaron's d19b0b2b0a
  if (st.phase === 'verified' || st.phase === 'bumped') { st.phase = 'merged'; st.headSha = null; } // re-verify required
  saveState(st);
  log('bump-common', st.release, 'ok', { from: before, to: want });
  console.log(`✅ common ${before} → ${want} + committed · phase=${st.phase} · re-run \`verify\` next`);
}

function cmdPush(a) {
  const st = loadState(a.release);
  if (st.phase !== 'verified' && st.phase !== 'bumped') die(`PUSH REFUSED — phase is ${st.phase}, expected verified/bumped (run verify [+ bump-version] first)`, 2);
  if (!BRANCH_RE.test(st.branch)) die(`PUSH REFUSED — branch "${st.branch}" fails the release pattern`, 2);
  ensureRepo(st.repo);
  ensureOnBranch(st.repo, st.branch);
  const head = gitOut(st.repo, ['rev-parse', 'HEAD']);
  if (head !== st.headSha) die(`PUSH REFUSED — HEAD moved since verify (${st.headSha.slice(0, 10)} -> ${head.slice(0, 10)}). Re-run verify.`, 2);
  git(st.repo, ['push', '-u', 'origin', st.branch]);
  if (!remoteBranchExists(st.repo, st.branch)) die('push reported success but branch not visible on origin — investigate');
  st.phase = 'pushed';
  saveState(st);
  log('push', st.release, 'ok', head);
  console.log(`✅ ${st.branch} pushed to origin (${head.slice(0, 10)}) · phase=pushed · next: BUILD (V4)`);
}

// Phase F — land the release on mlk/master AFTER BAQA baseline testing passes (V8).
// PLP-ONLY. etanah-awam never merges to mlk/master (0 direct merges in its history); pelupusan
// does, and it is OURS to run — not the release owner's. Established 2026-07-28 per みや after
// 1.0.12 sat unmerged until Aaron fast-forwarded it himself (7a31a9a431, authored by aaron).
// Shape is FAST-FORWARD, matching every prior release: origin/mlk/master === the release tip.
function cmdMergeToMaster(a) {
  const st = loadState(a.release);
  if (st.phase !== 'pushed' && st.phase !== 'merged-to-master') die(`MERGE-TO-MASTER REFUSED — phase is ${st.phase}, expected pushed (the release branch must be on origin first)`, 2);
  if (!BRANCH_RE.test(st.branch)) die(`MERGE-TO-MASTER REFUSED — branch "${st.branch}" fails the release pattern`, 2);
  // presence-check, not truthiness: parseArgs eats the next token as a value, so a bare
  // `--ba-approved` stores undefined — `in` makes the flag work with or without a value.
  if (!('ba-approved' in a)) die('MERGE-TO-MASTER REFUSED — 🛑 V8: pass --ba-approved only after みや confirms BAQA baseline testing PASSED. Deploy success is NOT testing success.', 2);
  ensureRepo(st.repo);
  git(st.repo, ['fetch', 'origin', '--prune']);
  if (!remoteBranchExists(st.repo, st.branch)) die(`${st.branch} is not on origin — run \`push\` first`, 2);

  // Dirty tree is TOLERATED (みや routinely has ticket work in flight) but ONLY when no dirty
  // path intersects the release delta — otherwise the checkout would clobber or refuse.
  const dirty = gitOut(st.repo, ['status', '--porcelain']).split('\n').filter(Boolean)
    .map(l => l.slice(3).trim()).filter(Boolean);
  const delta = gitOut(st.repo, ['diff', '--name-only', `origin/mlk/master...origin/${st.branch}`]).split('\n').filter(Boolean);
  const clash = dirty.filter(f => delta.includes(f));
  if (clash.length) die(`MERGE-TO-MASTER REFUSED — uncommitted changes collide with the release delta:\n  ${clash.join('\n  ')}\ncommit, stash, or revert those first`, 2);

  const releaseTip = gitOut(st.repo, ['rev-parse', `origin/${st.branch}`]);
  if (st.headSha && releaseTip !== st.headSha) die(`MERGE-TO-MASTER REFUSED — origin/${st.branch} (${releaseTip.slice(0, 10)}) != the pushed head (${st.headSha.slice(0, 10)}); someone moved the release branch`, 2);

  git(st.repo, ['checkout', 'mlk/master']);
  git(st.repo, ['merge', '--ff-only', 'origin/mlk/master']);
  const masterBefore = gitOut(st.repo, ['rev-parse', 'HEAD']);
  const tag = `ruri/pre-master-merge-${st.release}`;
  git(st.repo, ['tag', '-f', tag, masterBefore]);            // local undo point
  git(st.repo, ['merge', '--ff-only', `origin/${st.branch}`]); // FF only — a non-FF means master drifted; stop and think
  git(st.repo, ['push', 'origin', 'mlk/master']);

  const remoteMaster = gitOut(st.repo, ['ls-remote', 'origin', 'refs/heads/mlk/master']).split(/\s+/)[0];
  if (remoteMaster !== releaseTip) die(`push reported success but origin/mlk/master reads ${remoteMaster.slice(0, 10)}, expected ${releaseTip.slice(0, 10)} — investigate`);

  st.phase = 'merged-to-master';
  st.masterSha = remoteMaster;
  st.masterMergedFrom = masterBefore;
  saveState(st);
  log('merge-to-master', st.release, 'ok', { from: masterBefore, to: remoteMaster });
  console.log(`✅ mlk/master ${masterBefore.slice(0, 10)} → ${remoteMaster.slice(0, 10)} (ff from ${st.branch}) + pushed`);
  console.log(`   undo point: tag ${tag} @ ${masterBefore.slice(0, 10)} (local) · phase=merged-to-master · release COMPLETE`);
}

function cmdStatus(a) {
  const st = loadState(a.release);
  console.log(JSON.stringify(st, null, 2));
}

const a = parseArgs(process.argv.slice(2));
const cmd = a._[0];
const commands = {
  init: cmdInit, branch: cmdBranch, 'set-tickets': cmdSetTickets, merge: cmdMerge,
  'merge-continue': cmdMergeContinue, verify: cmdVerify,
  'bump-common': cmdBumpCommon, 'bump-version': cmdBumpVersion,
  push: cmdPush, 'merge-to-master': cmdMergeToMaster, status: cmdStatus,
};
if (!cmd || !commands[cmd]) die(`usage: release-prep.js <init|branch|set-tickets|merge|merge-continue|verify|bump-common|bump-version|push|merge-to-master|status> --release <ver> [...]`);
if (cmd !== 'init' && !a.release) die('--release required');
commands[cmd](a);
