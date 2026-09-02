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

// ── Universal version-compat gate (added 2026-08-19 after the 1.3.5 common-version incident) ──
// A common bump is NEVER trusted on a human's word (BA chat / recon verdict). Two invariants,
// checked from git (+ optional DB), enforced BEFORE the pom is touched:
//   (1) DOMAIN ≤ DB  — target common's transitive etanah-domain must be ≤ the deploy DB's V_DOMAIN
//                      (rjk_parameter_sistem.kod='V_DOMAIN'); supply via --db-domain <x-MLK>.
//   (2) CONTINUITY   — target common's etanah-domain must match the PREVIOUS release branch's,
//                      because the previous release was DEPLOYED + validated against that DB.
// Root cause it prevents: 1.3.5 shipped common 1.2.1 (domain 1.0.5) vs DB 1.0.4 → release blocked;
// the correct common was 1.1.17-MLK (domain 1.0.4), what release 1.3.4 shipped.
function verParts(v) { const m = String(v).match(/^(\d+(?:\.\d+)*)/); return m ? m[1].split('.').map(Number) : [0]; }
function cmpVer(a, b) { const pa = verParts(a), pb = verParts(b), n = Math.max(pa.length, pb.length); for (let i = 0; i < n; i++) { const x = pa[i] || 0, y = pb[i] || 0; if (x !== y) return x - y; } return 0; }
function commonRepoOf(pelupusanRepo) { return path.join(path.dirname(pelupusanRepo), 'etanah-common'); }
function domainOfCommonVersion(commonRepo, commonVer) {
  if (!commonVer || !fs.existsSync(commonRepo)) return null;
  const sha = (git(commonRepo, ['log', '--all', '-1', '--format=%H', '-S', `<version>${commonVer}</version>`, '--', 'pom.xml'], true).stdout || '').trim();
  if (!sha) return null;
  const pom = git(commonRepo, ['show', `${sha}:pom.xml`], true).stdout || '';
  const m = pom.match(/etanah-domain<\/artifactId>\s*<version>\s*([^<\s]+)/);
  return m ? m[1].trim() : null;
}
function prevReleaseCommon(repo, curVer) {
  const rel = /^origin\/mlk\/release\/(\d+\.\d+\.\d+)$/;
  const cand = (git(repo, ['branch', '-r', '--format=%(refname:short)'], true).stdout || '')
    .split('\n').map(s => s.trim()).map(b => { const m = b.match(rel); return m ? { b, v: m[1] } : null; }).filter(Boolean)
    .filter(x => cmpVer(x.v, curVer) < 0).sort((a, b) => cmpVer(b.v, a.v));
  if (!cand.length) return null;
  const prev = cand[0];
  const pom = git(repo, ['show', `${prev.b}:pom.xml`], true).stdout || '';
  const m = pom.match(/<etanah\.common\.version>([^<]+)<\/etanah\.common\.version>/);
  return { release: prev.v, common: m ? m[1].trim() : null };
}
function runCompatGate(st, want, a) {
  const commonRepo = commonRepoOf(st.repo);
  const wantDomain = domainOfCommonVersion(commonRepo, want);
  const prev = prevReleaseCommon(st.repo, st.release);
  const prevDomain = prev ? domainOfCommonVersion(commonRepo, prev.common) : null;
  const dbDomain = a['db-domain'] || null;
  const ack = a['domain-ack'];
  console.log(`· compat: target common ${want} → etanah-domain ${wantDomain || '?? (unresolved — cannot verify)'}`);
  if (prev) console.log(`· compat: previous release ${prev.release} → common ${prev.common} → etanah-domain ${prevDomain || '??'}`);
  if (dbDomain) console.log(`· compat: DB V_DOMAIN = ${dbDomain}`);
  const problems = [];
  if (dbDomain && wantDomain && cmpVer(wantDomain, dbDomain) > 0)
    problems.push(`domain(${want})=${wantDomain} is NEWER than DB V_DOMAIN=${dbDomain} → the release WILL be blocked (domain must be ≤ DB)`);
  if (prevDomain && wantDomain && wantDomain !== prevDomain)
    problems.push(`domain CHANGES vs previous release ${prev.release}: was ${prevDomain} (common ${prev.common}), now ${wantDomain} (common ${want})`);
  if (problems.length && !ack)
    die(`BUMP-COMMON REFUSED — version-compat gate:\n  - ${problems.join('\n  - ')}\n` +
        `Fix: pick a common whose etanah-domain ≤ DB and matches the previous release, OR pass --domain-ack "<reason>" to override intentionally.`, 2);
  if (problems.length && ack) console.log(`⚠️  compat problems OVERRIDDEN by --domain-ack "${ack}"`);
}

// ── Stale-master detector (added 2026-08-19 — the ROOT cause of the 1.3.5 common drift) ──
// Every baseline branches off mlk/master. If the PREVIOUS release's merge-to-master (Phase F)
// was skipped, master is STALE and branching silently drops that release's common version AND
// its ticket fixes. Root incident: 1.3.4 (common 1.1.17 + 5 tickets) was never merged to master,
// so 1.3.5 branched off 1.3.3-era master (common 1.1.12) and re-derived the common from scratch.
function assertMasterReflectsPrevRelease(st, a) {
  const prev = prevReleaseCommon(st.repo, st.release);
  if (!prev) { console.log('· prev-release check: no earlier release branch — nothing to reconcile'); return; }
  const inMaster = git(st.repo, ['merge-base', '--is-ancestor', `origin/mlk/release/${prev.release}`, 'origin/mlk/master'], true).status === 0;
  if (inMaster) { console.log(`· prev-release check: ${prev.release} IS in master ✓ (common ${prev.common})`); return; }
  const msg = `BRANCH REFUSED — previous release ${prev.release} is NOT merged into origin/mlk/master.\n` +
    `  Master is STALE: branching here silently DROPS ${prev.release}'s content (common ${prev.common} + its ticket fixes).\n` +
    `  Fix: run \`merge-to-master --release ${prev.release} --ba-approved\` first (Phase F), then re-run branch.\n` +
    `  Override only if you KNOW master is intentionally ahead: --stale-master-ack "<reason>".`;
  if (a && a['stale-master-ack']) { console.log(`⚠️  STALE MASTER overridden by --stale-master-ack "${a['stale-master-ack']}"`); return; }
  die(msg, 2);
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
// discover — the deterministic ticket→content index (discover.js). Runs for the release's ticket
// numbers, records every commit naming each number that is not in master, and derives the merge
// plan = named branches + ORPHAN commit tips (fixes whose branch was deleted after an env merge).
// Added 2026-09-02 after #274094's third fix (fab13ed2, deleted branch 274094v3) was missed.
//   --tickets "274094,276465,277868:265537"   (":alias" = recon VIA-RELATED number to search too)
function cmdDiscover(a) {
  const st = loadState(a.release);
  if (!a.tickets) die('--tickets required, e.g. "274094,276465,277868:265537" (digits; :alias optional)');
  ensureRepo(st.repo);
  const { discoverTicket, parseNumbers, renderTicket } = require('./discover.js');
  git(st.repo, ['fetch', 'origin', '--prune']);
  const releaseRef = git(st.repo, ['rev-parse', '--verify', '--quiet', st.branch], true).status === 0 ? st.branch : null;
  const specs = a.tickets.split(',').map(s => s.trim()).filter(Boolean).map(parseNumbers);
  st.discovery = {};
  let orphanCount = 0;
  for (const s of specs) {
    const r = discoverTicket(st.repo, s.numbers, { noFetch: true, releaseRef });
    r.ticket = s.ticket;
    for (const p of r.plan) p.ticket = p.sha ? `${s.ticket}@${p.sha.slice(0, 10)}` : s.ticket;
    orphanCount += r.orphanTips.length;
    st.discovery[s.ticket] = { numbers: s.numbers, branches: r.branches.map(b => b.name), plan: r.plan, excluded: r.excluded, orphanTips: r.orphanTips, commits: r.commits.map(c => ({ sha: c.sha, kind: c.kind, inBranch: c.inBranch, subject: c.subject })) };
    console.log(renderTicket(r) + '\n');
  }
  st.ticketNumbers = Object.fromEntries(specs.map(s => [s.ticket, s.numbers]));
  saveState(st);
  log('discover', st.release, 'ok', { tickets: specs.map(s => s.ticket), orphanCount });
  console.log(`✅ discovery saved for ${specs.length} ticket(s) · orphan commit tips: ${orphanCount}${orphanCount ? ' 🚨 (would have been MISSED by a branch-name merge list)' : ''}`);
  console.log('next: `set-tickets --from-discovery` (uses the plan above verbatim) — or hand-list with `--tickets` and let `verify` catch any gap');
}

function cmdSetTickets(a) {
  const st = loadState(a.release);
  if (st.phase !== 'planned' && st.phase !== 'branched') {
    die(`SET-TICKETS REFUSED — phase is ${st.phase}; the merge list is only editable before merging starts`, 2);
  }
  if ('from-discovery' in a) {   // flag convention: `in` — the arg parser stores undefined for a bare flag
    if (!st.discovery) die('no discovery recorded — run `discover --tickets ...` first', 2);
    const tickets = [];
    for (const [t, d] of Object.entries(st.discovery)) {
      if (!d.plan.length) die(`discovery for #${t} found NOTHING in git (no branch, no commit) — NO-EVIDENCE: ask BA, do not release on a guess`, 2);
      for (const p of d.plan) tickets.push(p.sha ? { ticket: p.ticket, src: p.src, sha: p.sha, merged: false } : { ticket: p.ticket, src: p.src, merged: false });
    }
    st.tickets = tickets;
    saveState(st);
    log('set-tickets', st.release, 'ok', tickets.map(t => t.src));
    console.log(`✅ merge list set FROM DISCOVERY — ${tickets.length} source(s)`);
    console.log('| Ticket | Source | Kind |'); console.log('|---|---|---|');
    tickets.forEach(t => console.log(`| #${t.ticket} | ${t.src} | ${t.sha ? 'orphan commit' : 'branch'} |`));
    const ex = Object.values(st.discovery).flatMap(d => d.excluded);
    if (ex.length) { console.log('\nexcluded (visible): ' + ex.map(e => `${e.short} ${e.kind}`).join(' · ')); }
    console.log('\nnext: `merge`');
    return;
  }
  if (!a.tickets) die('--tickets required, e.g. "269939=mlk/internal-issue/269939,..." — or --from-discovery');
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

// add-ticket — APPEND one merge source AFTER merging has started (any phase before push), without
// hand-editing the state json. Built 2026-09-02 (Baseline 1.4.1) when a completeness miss surfaced at
// phase=verified: #274094's third fix existed only as commit fab13ed2 on mlk/int-env (its branch
// mlk/internal/274094v3 had been deleted). Two sources: --branch <origin branch> OR --sha <commit>
// (sha must be reachable from some origin ref — never an unpublished local commit). Phase drops back
// to `merging` so `merge` runs only the new entry; verify (and any bump) must then re-run.
function cmdAddTicket(a) {
  const st = loadState(a.release);
  const ok = ['branched', 'merging', 'merged', 'verified', 'bumped'];
  if (!ok.includes(st.phase)) die(`ADD-TICKET REFUSED — phase is ${st.phase}; allowed before push only (${ok.join('/')})`, 2);
  if (st.conflict) die(`ADD-TICKET REFUSED — a conflict on #${st.conflict.ticket} is still open; run merge-continue first`, 2);
  if (!a.ticket) die('--ticket <label> required (e.g. 274094v3)');
  if (!a.branch && !a.sha) die('one of --branch <origin branch> or --sha <commit> required');
  if (st.tickets.some(t => t.ticket === String(a.ticket))) die(`ticket label ${a.ticket} already in the merge list`, 2);
  ensureRepo(st.repo);
  git(st.repo, ['fetch', 'origin', '--prune']);
  let entry;
  if (a.branch) {
    if (!remoteBranchExists(st.repo, a.branch)) die(`PREFLIGHT FAIL — origin/${a.branch} does not exist`, 2);
    entry = { ticket: String(a.ticket), src: a.branch, merged: false };
  } else {
    const sha = gitOut(st.repo, ['rev-parse', '--verify', `${a.sha}^{commit}`]);
    const holders = gitOut(st.repo, ['branch', '-r', '--contains', sha]).split('\n').map(s => s.trim()).filter(Boolean);
    if (!holders.length) die(`PREFLIGHT FAIL — ${sha.slice(0, 10)} is not reachable from ANY origin ref (unpublished commit)`, 2);
    entry = { ticket: String(a.ticket), src: `sha:${sha.slice(0, 10)} (on ${holders[0]})`, sha, merged: false };
  }
  st.tickets.push(entry);
  if (st.phase !== 'branched') { st.phase = 'merging'; st.headSha = null; }
  saveState(st);
  log('add-ticket', st.release, 'ok', entry);
  console.log(`✅ added #${entry.ticket} → ${entry.src}`);
  console.log(`phase=${st.phase} · next: \`merge\` (merges only the new entry) → \`verify\`${st.tickets.length ? '' : ''}`);
}

// drop-ticket — DEFER one ticket out of the merge list before push, visibly (recorded under st.deferred
// with a reason; the coverage gate stops demanding its commits). Built 2026-09-02: #256334 (CR still In
// Progress) conflicted against master mid-merge while miya had already said "finalize only after 334";
// the right move was to defer it, not to hand-resolve Aaron's in-flight code. If the ticket is the one
// currently in conflict, the in-progress merge is aborted (nothing of it is kept). Re-add later with
// `add-ticket`. Refused once anything of that ticket is already merged into the release.
function cmdDropTicket(a) {
  const st = loadState(a.release);
  const ok = ['branched', 'merging', 'merged', 'verified', 'bumped'];
  if (!ok.includes(st.phase)) die(`DROP-TICKET REFUSED — phase is ${st.phase}; allowed before push only`, 2);
  if (!a.ticket) die('--ticket <label> required');
  if (!a.reason) die('--reason "<why>" required — a deferral is a visible decision, never silent');
  const t = String(a.ticket);
  const entries = st.tickets.filter(x => x.ticket === t || x.ticket.startsWith(`${t}@`));
  if (!entries.length) die(`#${t} is not in the merge list`, 2);
  if (entries.some(x => x.merged)) die(`DROP-TICKET REFUSED — #${t} already has a merged source in ${st.branch}; deferring now would need a revert (not a baseline step)`, 2);
  ensureRepo(st.repo);
  if (st.conflict && (st.conflict.ticket === t || String(st.conflict.ticket).startsWith(`${t}@`))) {
    if (mergeInProgress(st.repo)) git(st.repo, ['merge', '--abort']);
    st.conflict = null;
    console.log(`· aborted the in-progress conflicted merge of #${t} (nothing kept)`);
  } else if (st.conflict) die(`a conflict on #${st.conflict.ticket} is open — resolve or drop THAT ticket first`, 2);
  st.tickets = st.tickets.filter(x => !entries.includes(x));
  st.deferred = st.deferred || [];
  st.deferred.push({ ticket: t, sources: entries.map(e => e.src), reason: a.reason, at: new Date().toISOString() });
  if (st.ticketNumbers && st.ticketNumbers[t]) { st.deferredNumbers = Object.assign(st.deferredNumbers || {}, { [t]: st.ticketNumbers[t] }); delete st.ticketNumbers[t]; }
  if (st.phase === 'merging' && !st.tickets.some(x => !x.merged)) st.phase = st.tickets.length ? 'merged' : 'branched';
  if (st.phase === 'verified' || st.phase === 'bumped') { st.phase = 'merged'; st.headSha = null; }
  saveState(st);
  log('drop-ticket', st.release, 'ok', { ticket: t, reason: a.reason });
  console.log(`✅ #${t} DEFERRED out of ${st.branch} — ${entries.length} source(s): ${entries.map(e => e.src).join(', ')}`);
  console.log(`   reason: ${a.reason}`);
  console.log(`   ⚠️ the release now ships WITHOUT #${t}; re-add with \`add-ticket\` when ready. phase=${st.phase}`);
}

function cmdBranch(a) {
  const st = loadState(a.release);
  if (st.phase !== 'planned') die(`phase is ${st.phase}, expected planned`);
  ensureRepo(st.repo);
  ensureClean(st.repo);
  git(st.repo, ['checkout', 'mlk/master']);
  git(st.repo, ['fetch', 'origin']);
  git(st.repo, ['merge', '--ff-only', 'origin/mlk/master']);
  assertMasterReflectsPrevRelease(st, a);   // ── stale-master detector: prev release MUST be in master ──
  git(st.repo, ['checkout', '-b', st.branch]);
  st.phase = 'branched';
  saveState(st);
  log('branch', st.release, 'ok');
  console.log(`✅ ${st.branch} created off fresh mlk/master (${gitOut(st.repo, ['rev-parse', '--short', 'HEAD'])})`);
  console.log('phase=branched · next: `merge`');
}

// A ticket's merge source is normally an origin BRANCH (`origin/<src>`). Since 2026-09-02 it may also be
// a bare COMMIT SHA (`t.sha`) — for a fix whose rework branch was DELETED after being merged into an env
// branch (Baseline 1.4.1: #274094's third fix fab13ed2 lived only on mlk/int-env via the deleted
// mlk/internal/274094v3). `add-ticket --sha` requires the sha to be reachable from an origin ref.
function refOf(t) { return t.sha ? t.sha : `origin/${t.src}`; }

function doMergeLoop(st) {
  for (const t of st.tickets) {
    if (t.merged) continue;
    console.log(`· merging #${t.ticket} (${refOf(t)})…`);
    const r = git(st.repo, ['merge', '--no-ff', refOf(t)], true);
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
  if (st.phase === 'merged' && st.tickets.length && !st.tickets.some(t => !t.merged)) {   // idempotent: nothing left (e.g. after drop-ticket)
    console.log('· nothing left to merge — every listed source is already in the release · phase=merged · next: `verify`'); return;
  }
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
    const missing = gitOut(st.repo, ['rev-list', refOf(t), '--not', 'HEAD', '--count']);
    const ok = missing === '0';
    if (!ok) allOk = false;
    console.log(`| #${t.ticket} | ${t.src} | ${missing} | ${ok ? '✓' : '✗'} |`);
  }
  if (!allOk) { log('verify', st.release, 'fail'); die('verification FAILED — see ✗ rows', 2); }

  // ── CONTENT-COVERAGE GATE (2026-09-02, the #274094 fab13ed2 lesson) ──
  // The table above only proves the SOURCES WE WERE TOLD ABOUT landed. This proves nothing carrying a
  // release ticket's NUMBER anywhere on origin was left behind: every non-merge commit reachable from
  // any origin ref, naming the number, not in master, must be in HEAD (ancestor or patch-equivalent).
  // POM-PIN / PATCH-EQUIVALENT commits are reported but never fail (env pins + cherry-pick dups).
  const { discoverTicket } = require('./discover.js');
  const numbersByTicket = st.ticketNumbers || Object.fromEntries(st.tickets.map(t => [t.ticket, [t.ticket.replace(/@.*$/, '').replace(/\D.*$/, '')]]).filter(([, n]) => n[0]));
  console.log('\nCONTENT COVERAGE — every commit naming a release ticket on ANY origin ref, not in master');
  console.log('| Ticket | numbers searched | commits | orphan (branch deleted) | uncovered in release |');
  console.log('|---|---|---|---|---|');
  let uncoveredAll = [];
  for (const [t, numbers] of Object.entries(numbersByTicket)) {
    const r = discoverTicket(st.repo, numbers, { noFetch: true, releaseRef: 'HEAD' });
    const unc = r.uncovered || [];
    uncoveredAll.push(...unc.map(s => ({ t, s, c: r.commits.find(c => c.sha === s) })));
    console.log(`| #${t} | ${numbers.join(',')} | ${r.commits.length} | ${r.orphanTips.length} | ${unc.length ? '🚨 ' + unc.map(s => s.slice(0, 10)).join(',') : '0 ✓'} |`);
  }
  if (st.deferred && st.deferred.length) console.log(`\n⚠️ DEFERRED (visible, not in this release): ${st.deferred.map(d => `#${d.ticket} — ${d.reason}`).join(' · ')}`);
  if (uncoveredAll.length) {
    console.log('\n🚨 UNCOVERED commits (would ship WITHOUT these — exactly the fab13ed2 miss):');
    for (const u of uncoveredAll) console.log(`   #${u.t} ${u.s.slice(0, 10)} ${u.c ? `${u.c.date} ${u.c.author} "${u.c.subject.slice(0, 60)}" on ${u.c.holders.join('/')}` : ''}`);
    console.log('   → `add-ticket --ticket <t>@<sha> --sha <sha>` then `merge` + `verify` again (or exclude with a reason via `discover` review)');
    log('verify', st.release, 'fail-coverage', uncoveredAll.map(u => u.s));
    die('verification FAILED — content coverage gap', 2);
  }
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
  runCompatGate(st, want, a);   // ── universal version-compat gate (domain ≤ DB + continuity) ──
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
  // Terminology-verbatim rule (2026-08-19): mirror the repo's ESTABLISHED wording, never invent.
  // Upgrade → Aaron's exact phrase (d19b0b2b0a); downgrade → miya-approved "revert to" (2026-08-19).
  const verb = cmpVer(want, before) >= 0 ? `common version increase to: ${want}`
                                         : `common version revert to: ${want} (from ${before})`;
  git(st.repo, ['commit', '-m', verb]);
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
  const tag = `mlk/pre-master-merge/${st.release}`;
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
  // --verify (2026-08-19, post-1.3.5 incident): state is a CACHE of git truth and was hand-edited
  // twice during the incident. Compare against live origin refs; drift = loud flag, exit 2.
  if (!('verify' in a)) return;
  ensureRepo(st.repo);
  git(st.repo, ['fetch', 'origin', '--quiet'], true);
  const problems = [];
  const remoteTip = (git(st.repo, ['rev-parse', `origin/${st.branch}`], true).stdout || '').trim();
  if (!remoteTip) problems.push(`origin/${st.branch} does not exist`);
  else if (st.headSha && remoteTip !== st.headSha) problems.push(`state headSha ${String(st.headSha).slice(0, 10)} != origin/${st.branch} ${remoteTip.slice(0, 10)}`);
  if (st.phase === 'merged-to-master') {
    const inMaster = git(st.repo, ['merge-base', '--is-ancestor', `origin/${st.branch}`, 'origin/mlk/master'], true).status === 0;
    if (!inMaster) problems.push(`phase=merged-to-master but origin/${st.branch} is NOT an ancestor of origin/mlk/master`);
  }
  if (problems.length) {
    console.error(`\n🚨 STATE-VS-GIT DRIFT:\n  - ${problems.join('\n  - ')}\nThe state file is stale or hand-edited — reconcile it against git truth before running any command.`);
    process.exit(2);
  }
  console.log('\n✅ state matches origin (headSha + phase ancestry verified)');
}

const a = parseArgs(process.argv.slice(2));
const cmd = a._[0];
const commands = {
  init: cmdInit, branch: cmdBranch, discover: cmdDiscover, 'set-tickets': cmdSetTickets, 'add-ticket': cmdAddTicket, 'drop-ticket': cmdDropTicket, merge: cmdMerge,
  'merge-continue': cmdMergeContinue, verify: cmdVerify,
  'bump-common': cmdBumpCommon, 'bump-version': cmdBumpVersion,
  push: cmdPush, 'merge-to-master': cmdMergeToMaster, status: cmdStatus,
};
if (!cmd || !commands[cmd]) die(`usage: release-prep.js <init|branch|discover|set-tickets|add-ticket|merge|merge-continue|verify|bump-common|bump-version|push|merge-to-master|status> --release <ver> [...]`);
if (cmd !== 'init' && !a.release) die('--release required');
commands[cmd](a);
