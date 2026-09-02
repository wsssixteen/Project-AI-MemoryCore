#!/usr/bin/env node
/**
 * discover.js — deterministic TICKET → GIT-CONTENT discovery for a Melaka Pelupusan baseline.
 *
 * Born 2026-09-02 (Baseline 1.4.1). #274094's THIRD fix (fab13ed2, 18 Aug) lived ONLY on
 * origin/mlk/int-env: its rework branch mlk/internal/274094v3 had been DELETED after the env merge.
 * Every prior check (redmine-recon · audit-ticket · release-prep verify) discovered fixes by origin
 * BRANCH NAME, so a deleted branch was invisible and the release shipped 2 of 3 fixes until miya
 * found the commit in SourceTree's commit-message search.
 *
 * THE RULE THIS FILE ENFORCES: a ticket's content is EVERY commit reachable from ANY origin ref whose
 * message carries the ticket number (word-bounded) and which is not already in mlk/master —
 * regardless of whether a branch still points at it. Branch names are one INDEX into that set, never
 * the set itself.
 *
 * API  (require):  discoverTicket(repo, numbers, { master, releaseRef, noFetch }) → result
 *      (CLI):      node discover.js <num[:alias,...]> [<num> ...] [--release <ver>] [--repo <path>] [--json]
 *
 * result = {
 *   numbers, branches: [{ name, tip, trap }],                // trap = tip already in master (merge = no-op)
 *   commits: [{ sha, short, date, author, subject, holders, inBranch, kind, equivalentOf, inRelease }],
 *   orphanTips: [sha],                                       // CODE commits no surviving branch carries (topological tips)
 *   plan: [{ ticket, src, sha?, reason }],                   // merge sources = named branches + orphan tips
 *   excluded: [{ sha, kind, reason }],                       // surfaced, never silent: POM-PIN · PATCH-EQUIVALENT
 *   uncovered: [sha] | null                                  // vs releaseRef: CODE commits neither ancestor nor patch-equivalent
 * }
 * kind ∈ CODE | POM-PIN (touches only pom.xml — an env pin, bump-common owns it) | PATCH-EQUIVALENT (git cherry
 *        says a named branch already carries the same patch — e.g. a cherry-pick onto int-env).
 */
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');

function mkGit(repo) {
  return function g(args, allowFail) {
    const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
    if (r.status !== 0 && !allowFail) throw new Error(`git ${args.join(' ')} failed in ${repo}:\n${(r.stderr || r.stdout || '').trim()}`);
    return r.status === 0 ? r.stdout.trim() : '';
  };
}
const lines = s => (s ? s.split('\n').map(x => x.trim()).filter(Boolean) : []);
// word-bounded ticket number: "274094" but not "2740941" or "1274094". POSIX ERE — no \b in git's grep.
const numRe = n => `(^|[^0-9])${n}([^0-9]|$)`;

function parseNumbers(spec) {
  // "277868:265537" → ticket 277868 searched by both numbers (recon VIA-RELATED alias)
  const parts = String(spec).split(':').map(s => s.trim().replace(/^#/, '')).filter(Boolean);
  if (!parts.length || parts.some(p => !/^\d+$/.test(p))) throw new Error(`bad ticket spec "${spec}" — digits, optional :alias`);
  return { ticket: parts[0], numbers: [...new Set(parts)] };
}

function discoverTicket(repo, numbersIn, opts = {}) {
  const g = mkGit(repo);
  const master = opts.master || 'origin/mlk/master';
  const numbers = Array.isArray(numbersIn) ? numbersIn.map(String) : [String(numbersIn)];
  if (!opts.noFetch) g(['fetch', 'origin', '--prune'], true);

  // (1) branch-name index — one index into the set, never the set
  const allRemote = lines(g(['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin']))
    .filter(r => r !== 'origin/HEAD').map(r => r.replace(/^origin\//, ''));
  const branches = allRemote
    .filter(b => numbers.some(n => new RegExp(`/${n}(v\\d+)?$`).test(b) || new RegExp(`/${n}(-|_)`).test(b)))
    .map(name => {
      const tip = g(['rev-parse', `origin/${name}`]);
      const trap = spawnSync('git', ['merge-base', '--is-ancestor', `origin/${name}`, master], { cwd: repo }).status === 0;
      return { name, tip, trap };
    });

  // (2) the SET — every non-merge commit on any origin ref naming the number, not in master
  const seen = new Map();
  for (const n of numbers) {
    const out = g(['log', '--remotes=origin', '--not', master, '--no-merges', '-E', `--grep=${numRe(n)}`,
      '--format=%H%x1f%h%x1f%ad%x1f%an%x1f%s', '--date=short'], true);
    for (const l of lines(out)) {
      const [sha, short, date, author, subject] = l.split('\x1f');
      if (sha && !seen.has(sha)) seen.set(sha, { sha, short, date, author, subject });
    }
  }
  // merge commits naming a vN branch — the deleted-branch fingerprint (informational)
  const mergesNamingV = [];
  for (const n of numbers) {
    for (const l of lines(g(['log', '--remotes=origin', '--not', master, '--merges', '-E', `--grep=${numRe(n)}`, '--format=%h%x1f%s'], true))) {
      const [short, subject] = l.split('\x1f');
      if (/v\d+/.test(subject) && !mergesNamingV.some(m => m.short === short)) mergesNamingV.push({ short, subject });
    }
  }

  const isAncestor = (sha, ref) => spawnSync('git', ['merge-base', '--is-ancestor', sha, ref], { cwd: repo }).status === 0;
  const cherryHas = (upstream, sha) => lines(g(['cherry', upstream, sha, `${sha}~1`], true)).some(l => l.startsWith('- '));

  const commits = [...seen.values()].map(c => {
    c.holders = lines(g(['branch', '-r', '--contains', c.sha], true)).map(h => h.replace(/^origin\//, ''));
    c.inBranch = branches.some(b => isAncestor(c.sha, `origin/${b.name}`));
    const files = lines(g(['show', '--format=', '--name-only', c.sha], true));
    c.files = files;
    c.kind = 'CODE';
    c.equivalentOf = null;
    if (files.length && files.every(f => f === 'pom.xml')) c.kind = 'POM-PIN';
    else if (!c.inBranch) {
      const carrier = branches.find(b => cherryHas(`origin/${b.name}`, c.sha));
      if (carrier) { c.kind = 'PATCH-EQUIVALENT'; c.equivalentOf = carrier.name; }
    }
    return c;
  });

  // (3) orphans: CODE commits no surviving branch carries → topological tips become merge sources
  const orphans = commits.filter(c => c.kind === 'CODE' && !c.inBranch);
  const orphanTips = orphans.filter(c => !orphans.some(o => o.sha !== c.sha && isAncestor(c.sha, o.sha))).map(c => c.sha);

  const ticket = numbers[0];
  const plan = [
    ...branches.map(b => ({ ticket, src: b.name, reason: b.trap ? 'named branch (ancestor-trap: already in master, merge = no-op)' : 'named branch on origin' })),
    ...orphanTips.map(sha => { const c = commits.find(x => x.sha === sha); return { ticket: `${ticket}@${c.short}`, src: `sha:${c.short} (orphan on ${c.holders[0] || '?'})`, sha, reason: `commit "${c.subject.slice(0, 50)}" ${c.date} ${c.author} — no surviving branch carries it` }; }),
  ];
  const excluded = commits.filter(c => !c.inBranch && c.kind !== 'CODE').map(c => ({
    sha: c.sha, short: c.short, kind: c.kind, subject: c.subject,
    reason: c.kind === 'POM-PIN' ? 'touches only pom.xml — env pin; bump-common owns the release value' : `same patch already carried by named branch ${c.equivalentOf}`,
  }));

  // (4) coverage vs a release ref (HEAD of the release branch): every CODE commit must be in
  let uncovered = null;
  if (opts.releaseRef) {
    uncovered = commits.filter(c => c.kind === 'CODE')
      .map(c => { c.inRelease = isAncestor(c.sha, opts.releaseRef) || cherryHas(opts.releaseRef, c.sha); return c; })
      .filter(c => !c.inRelease).map(c => c.sha);
    for (const c of commits) if (c.inRelease === undefined) c.inRelease = isAncestor(c.sha, opts.releaseRef) || cherryHas(opts.releaseRef, c.sha);
  }

  return { ticket, numbers, branches, commits, mergesNamingV, orphanTips, plan, excluded, uncovered };
}

function renderTicket(r) {
  const o = [];
  o.push(`### #${r.ticket}${r.numbers.length > 1 ? ` (searched: ${r.numbers.join(', ')})` : ''}`);
  o.push(`| index | value |`); o.push(`|---|---|`);
  o.push(`| named branches | ${r.branches.length ? r.branches.map(b => b.name + (b.trap ? ' ⚠️trap' : '')).join(' · ') : 'none'} |`);
  o.push(`| commits naming the ticket, not in master | ${r.commits.length} |`);
  o.push(`| 🚨 orphan commits (no surviving branch) | ${r.orphanTips.length ? r.orphanTips.map(s => s.slice(0, 10)).join(', ') : '0'} |`);
  if (r.mergesNamingV.length) o.push(`| env merges naming a vN branch | ${r.mergesNamingV.map(m => m.subject).join(' · ')} |`);
  if (r.commits.length) {
    o.push(''); o.push(`| commit | date | author | subject | kind | carried by | ${r.uncovered !== null ? 'in release' : ''} |`); o.push(`|---|---|---|---|---|---|---|`);
    for (const c of r.commits) o.push(`| ${c.short} | ${c.date} | ${c.author} | ${c.subject.slice(0, 55)} | ${c.kind} | ${c.inBranch ? 'branch' : (c.kind === 'CODE' ? '🚨 NOTHING — branch deleted' : c.kind === 'PATCH-EQUIVALENT' ? 'dup of ' + c.equivalentOf : 'env pin')} | ${r.uncovered !== null ? (c.inRelease ? '✅' : (c.kind === 'CODE' ? '❌ MISSING' : '— excluded')) : ''} |`);
  }
  o.push(''); o.push(`merge plan: ${r.plan.map(p => p.sha ? p.src : p.src).join(' + ') || '(nothing)'}`);
  if (r.excluded.length) o.push(`excluded (visible, not silent): ${r.excluded.map(e => `${e.short} ${e.kind}`).join(' · ')}`);
  if (r.uncovered && r.uncovered.length) o.push(`🚨 UNCOVERED in release: ${r.uncovered.map(s => s.slice(0, 10)).join(', ')}`);
  return o.join('\n');
}

module.exports = { discoverTicket, parseNumbers, renderTicket, numRe };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) { a[argv[i].slice(2)] = argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? true : argv[++i]; } else a._.push(argv[i]); }
  const repo = a.repo || 'E:\\Projects\\Melaka\\etanah-pelupusan';
  if (!a._.length) { console.error('usage: discover.js <num[:alias]> [...] [--release <ver>] [--repo <path>] [--json] [--no-fetch]'); process.exit(2); }
  const releaseRef = a.release ? `mlk/release/${a.release}` : null;
  const out = [];
  let anyOrphan = false, anyUncovered = false, first = true;
  for (const spec of a._) {
    const { numbers } = parseNumbers(spec);
    const r = discoverTicket(repo, numbers, { releaseRef, noFetch: !first || a['no-fetch'] === true });
    first = false;
    out.push(r);
    if (r.orphanTips.length) anyOrphan = true;
    if (r.uncovered && r.uncovered.length) anyUncovered = true;
    if (!a.json) console.log(renderTicket(r) + '\n');
  }
  if (a.json) console.log(JSON.stringify(out, null, 2));
  process.exit(anyUncovered ? 1 : 0);
}
