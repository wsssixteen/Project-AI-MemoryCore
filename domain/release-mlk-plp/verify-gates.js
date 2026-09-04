// verify-gates.js — the release completeness gates as a PURE module (2026-08-24, /goal hardening
// after the #275539 v2 miss). Used by release-prep.js `verify` (during) + `postcheck` (after)
// AND by eval-merge-scenarios.js against synthetic fixture repos — the same code that gates the
// real release is what the eval exercises; there is no eval-only copy to drift.
//
// runGates({ repo, headRef, masterRef, remote, tickets, commonBumpedTo, release })
//   → { ok, table: [{ticket, src, missing, ok}], findings: [{gate, level: 'fail'|'warn', msg}] }
// A 'fail' finding sets ok=false; 'warn' findings are printed but do not block (judgment rows).
'use strict';
const { execFileSync } = require('child_process');

function g(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function tryG(repo, args) { try { return g(repo, args); } catch { return null; } }

function runGates(o) {
  const repo = o.repo;
  const headRef = o.headRef || 'HEAD';
  const masterRef = o.masterRef || 'origin/mlk/master';
  const remote = o.remote || 'origin';
  const tickets = o.tickets || [];
  const findings = [];
  // o.downgrade: {gateName: 'warn'} — Phase F (merge-to-master) downgrades sibling-sweep to WARN:
  // master must equal what BAQA tested; a rework pushed after the build belongs to the NEXT
  // release, so it is surfaced as guidance there, never a block.
  const downgrade = o.downgrade || {};
  const fail = (gate, msg) => findings.push({ gate, level: downgrade[gate] === 'warn' ? 'warn' : 'fail', msg });
  const warn = (gate, msg) => findings.push({ gate, level: 'warn', msg });

  // ── gate 1: containment — every mapped branch's commits are in the release ──
  const table = tickets.map(t => {
    const missing = g(repo, ['rev-list', `${remote}/${t.src}`, '--not', headRef, '--count']);
    return { ticket: t.ticket, src: t.src, missing, ok: missing === '0' };
  });
  for (const r of table) if (!r.ok) fail('containment', `#${r.ticket} — ${r.missing} commit(s) of ${r.src} NOT in the release`);

  // ── gate 2: sibling-sweep — any *<num>* branch on the remote, unmapped and unmerged (#275539 v2) ──
  const mergedSrcs = new Set(tickets.map(t => t.src));
  const allHeads = g(repo, ['ls-remote', '--heads', remote])
    .split('\n').map(l => (l.split('\t')[1] || '').replace('refs/heads/', '')).filter(Boolean);
  const nums = [...new Set(tickets.map(t => String(t.ticket).replace(/v\d+$/, '')))];
  for (const num of nums) {
    const sibs = allHeads.filter(r => new RegExp(`/${num}(v\\d+)?$`).test(r) || new RegExp(`/${num}(-|_)`).test(r));
    for (const s of sibs) {
      if (mergedSrcs.has(s)) continue;
      const missing = g(repo, ['rev-list', `${remote}/${s}`, '--not', headRef, '--count']);
      if (missing !== '0') fail('sibling-sweep', `${remote}/${s} — ${missing} commit(s) NOT in the release (rework pushed after the audit? merge it or classify superseded)`);
    }
  }

  // ── gate 3: revert-scan — a scoped ticket reverted in the release lineage (#273461 class) ──
  for (const num of nums) {
    const reverts = g(repo, ['log', headRef, '--oneline', '-i', '--grep', 'revert', '-n', '400'])
      .split('\n').filter(l => l && l.includes(num));
    for (const r of reverts) fail('revert-scan', `REVERT of #${num} in release lineage: ${r} — the fix may be live nowhere; reconstruct the full footprint`);
  }

  // ── gate 4: per-file drop-scan, owner-aware (strengthened 2026-08-24 — the eval's scenario 6
  //            proved the naive release==master test misses a drop when ANOTHER ticket also
  //            changed the file). Per file, collect every scoped ticket that changed it:
  //            · release==master while owners changed it        → ALL changes dropped   FAIL
  //            · release equals ONE owner's blob wholesale while
  //              other owners changed it differently            → those owners DROPPED  FAIL
  //            · single owner, release differs from both        → release-side edit     WARN
  //            · multi owner, release matches no single side    → hand-resolved union   WARN (confirm)
  const fileOwners = new Map(); // file -> [{ticket, blob}]
  for (const t of tickets) {
    const files = (tryG(repo, ['diff', '--name-only', `${masterRef}...${remote}/${t.src}`]) || '')
      .split('\n').filter(f => f && f !== 'pom.xml'); // pom is release-managed
    for (const f of files) {
      if (!fileOwners.has(f)) fileOwners.set(f, []);
      fileOwners.get(f).push({ ticket: t.ticket, blob: tryG(repo, ['rev-parse', `${remote}/${t.src}:${f}`]) });
    }
  }
  for (const [f, list] of fileOwners) {
    const relBlob = tryG(repo, ['rev-parse', `${headRef}:${f}`]);
    const masterBlob = tryG(repo, ['rev-parse', `${masterRef}:${f}`]);
    const changed = list.filter(o => o.blob && o.blob !== masterBlob);
    if (!changed.length) continue;
    if (relBlob === masterBlob) {
      fail('drop-scan', `${f} — changed by #${changed.map(o => o.ticket).join(', #')} but the release still matches master: change(s) DROPPED`);
      continue;
    }
    const winner = changed.find(o => o.blob === relBlob);
    if (winner) {
      const losers = changed.filter(o => o.blob !== relBlob);
      if (losers.length) {
        fail('drop-scan', `${f} — resolution took #${winner.ticket}'s version wholesale; change(s) from #${losers.map(o => o.ticket).join(', #')} DROPPED`);
      }
      // single owner whose blob === release, or identical blobs: clean
    } else if (changed.length === 1) {
      warn('drop-scan', `${f} — release content differs from #${changed[0].ticket}'s version (release-side edit?) — confirm intentional`);
    } else {
      warn('drop-scan', `${f} — changed by #${changed.map(o => o.ticket).join(', #')}, release matches no single side (hand-resolved union) — confirm every side survived`);
    }
  }

  // ── gate 5: no-op-branch — a mapped branch contributing ZERO commits beyond master shipped
  //            nothing (ancestor-trap: wrong/stale branch mapped; the merge is a silent no-op) ──
  for (const t of tickets) {
    const contributes = g(repo, ['rev-list', `${remote}/${t.src}`, '--not', masterRef, '--count']);
    if (contributes === '0') warn('noop-branch', `#${t.ticket} — ${t.src} adds 0 commits over master: the merge is a NO-OP. Fine only if the fix is already in master or common-delivered; otherwise the mapping points at the wrong branch`);
  }

  // ── gate 6: pom-common assert — a late merge can overwrite the bump-common line ──
  if (o.commonBumpedTo) {
    const pom = tryG(repo, ['show', `${headRef}:pom.xml`]) || '';
    const commonVer = (pom.match(/<etanah\.common\.version>([^<]+)<\/etanah\.common\.version>/) || [])[1];
    if (commonVer !== o.commonBumpedTo) {
      fail('pom-common', `<etanah.common.version> is ${commonVer} but bump-common recorded ${o.commonBumpedTo} — a merge overwrote it`);
    }
  }

  // ── gate 7: stowaway-refs — non-merge commits in the release delta referencing tickets OUTSIDE
  //            the approved scope (a branch dragged someone else's unreviewed fix in). WARN level:
  //            combined commits legitimately cite related tickets (e.g. "Ref #275505, 276181"). ──
  const scoped = new Set(nums);
  const extraKnown = new Set((o.knownTickets || []).map(String));
  const subjects = (tryG(repo, ['log', '--no-merges', '--format=%s', `${masterRef}..${headRef}`]) || '').split('\n');
  const seenStrangers = new Set();
  for (const s of subjects) {
    for (const m of s.matchAll(/#?(\d{6})\b/g)) {
      const num = m[1];
      if (!scoped.has(num) && !extraKnown.has(num) && !seenStrangers.has(num)) {
        seenStrangers.add(num);
        warn('stowaway-refs', `release delta contains commit(s) referencing #${num}, which is NOT in the approved scope: "${s}"`);
      }
    }
  }

  return { ok: !findings.some(f => f.level === 'fail'), table, findings };
}

module.exports = { runGates };
