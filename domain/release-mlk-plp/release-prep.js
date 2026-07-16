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

function cmdInit(a) {
  const release = a.release;
  if (!release || !RELEASE_RE.test(release)) die(`--release must be like 1.0.9 (got "${release}")`);
  const branch = `mlk/release/${release}`;
  if (!BRANCH_RE.test(branch)) die(`derived branch "${branch}" fails the release-branch pattern`);
  const repo = a.repo || DEFAULT_REPO;
  ensureRepo(repo);
  ensureClean(repo);
  if (!a.tickets) die('--tickets required, e.g. "269802=mlk/internal-issue/269802,269939=mlk/internal-issue/269939"');
  const tickets = a.tickets.split(',').map(t => {
    const [ticket, src] = t.split('=').map(s => s.trim());
    if (!ticket || !src) die(`bad ticket entry "${t}" — use <ticket>=<branch>`);
    return { ticket, src, merged: false };
  });

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
  console.log('| Ticket | Source branch | On origin |');
  console.log('|---|---|---|');
  tickets.forEach(t => console.log(`| #${t.ticket} | ${t.src} | ✓ |`));
  console.log('\nphase=planned · next: [V1 nod] then `branch`');
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

function cmdPush(a) {
  const st = loadState(a.release);
  if (st.phase !== 'verified') die(`PUSH REFUSED — phase is ${st.phase}, expected verified (run verify first)`, 2);
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

function cmdStatus(a) {
  const st = loadState(a.release);
  console.log(JSON.stringify(st, null, 2));
}

const a = parseArgs(process.argv.slice(2));
const cmd = a._[0];
const commands = {
  init: cmdInit, branch: cmdBranch, merge: cmdMerge,
  'merge-continue': cmdMergeContinue, verify: cmdVerify, push: cmdPush, status: cmdStatus,
};
if (!cmd || !commands[cmd]) die(`usage: release-prep.js <init|branch|merge|merge-continue|verify|push|status> --release <ver> [...]`);
if (cmd !== 'init' && !a.release) die('--release required');
commands[cmd](a);
