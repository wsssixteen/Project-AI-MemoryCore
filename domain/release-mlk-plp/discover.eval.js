#!/usr/bin/env node
// discover.eval.js — proves the baseline cannot miss a commit that names a release ticket anywhere on
// origin (the 2026-09-02 #274094 fab13ed2 miss: fix on a rework branch DELETED after its int-env merge).
//
// Part A — SYNTHETIC scratch repo (offline, deterministic): plants every known shape —
//   named branch · deleted-branch orphan on int-env · cherry-pick duplicate · pom-only env pin ·
//   number-boundary decoy (#1110 must not match 111) · alias number (ticket 222 searched via :111).
//   Then runs release-prep end-to-end: a hand-listed merge list (branch only) must FAIL verify on the
//   orphan; the discovery-derived list must PASS.
// Part B — REAL repo (read-only, skipped if absent): every commit `git log --remotes=origin --grep`
//   finds for the 1.4.1 tickets is in the discovery set, and fab13ed2 is surfaced as an orphan.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { discoverTicket, parseNumbers, numRe } = require('./discover.js');

const SCRIPT = path.join(__dirname, 'release-prep.js');
const results = [];
function check(n, c, d) { results.push({ n, pass: !!c, d }); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rmp-discover-'));
const bare = path.join(tmp, 'origin', 'etanah-pelupusan.git');
const work = path.join(tmp, 'etanah-pelupusan');
const stateDir = path.join(tmp, 'state');
const env = { ...process.env, RELEASE_MLK_PLP_STATE_DIR: stateDir };
function sh(cwd, cmd, args) { const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' }); if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed:\n${r.stderr || r.stdout}`); return r.stdout.trim(); }
const git = (args, cwd) => sh(cwd || work, 'git', args);
const prep = args => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env, timeout: 120000 });
const w = (f, s) => fs.writeFileSync(path.join(work, f), s);
const commit = (msg) => { git(['add', '-A']); git(['commit', '-q', '-m', msg]); return git(['rev-parse', 'HEAD']); };

try {
  // ---------- Part A fixture ----------
  fs.mkdirSync(path.dirname(bare), { recursive: true });
  sh(tmp, 'git', ['init', '-q', '--bare', bare]);
  sh(tmp, 'git', ['clone', '-q', bare, work]);
  git(['config', 'user.email', 'eval@local']); git(['config', 'user.name', 'eval']);
  git(['checkout', '-q', '-b', 'mlk/master']);
  w('a.txt', 'a1\n'); w('k.txt', 'k1\n');
  w('pom.xml', '<project>\n\t<parent><artifactId>etanah-base-pom</artifactId><version>3.0.0</version></parent>\n\t<artifactId>etanah-pelupusan</artifactId>\n\t<version>0.0.1</version>\n\t<properties>\n\t\t<etanah.common.version>1.0.71-MLK</etanah.common.version>\n\t</properties>\n</project>\n');
  commit('base'); git(['push', '-q', 'origin', 'mlk/master']);

  // named branch mlk/internal/111 — fix1 (a.txt)
  git(['checkout', '-q', '-b', 'mlk/internal/111']); w('a.txt', 'a1\nfix1\n'); const fix1 = commit('#111 fix1'); git(['push', '-q', 'origin', 'mlk/internal/111']);
  // int-env branch: merge 111, then a v3 rework branch with fix3 (k.txt) merged and DELETED
  git(['checkout', '-q', 'mlk/master']); git(['checkout', '-q', '-b', 'mlk/int-env']); git(['merge', '-q', '--no-ff', '-m', "Merge branch 'mlk/internal/111' into mlk/int-env", 'mlk/internal/111']);
  git(['checkout', '-q', 'mlk/master']); git(['checkout', '-q', '-b', 'mlk/internal/111v3']); w('k.txt', 'k1\nfix3\n'); const fix3 = commit('#111 fix3');
  git(['checkout', '-q', 'mlk/int-env']); git(['merge', '-q', '--no-ff', '-m', "Merge branch 'mlk/internal/111v3' into mlk/int-env", 'mlk/internal/111v3']);
  git(['branch', '-D', 'mlk/internal/111v3']);                       // branch gone — only int-env carries fix3
  // pom-only env pin naming the ticket
  w('pom.xml', fs.readFileSync(path.join(work, 'pom.xml'), 'utf8').replace('1.0.71-MLK', '1.0.71-MLK.beta.patch1')); const pin = commit('Ref #111: common pin for int-env');
  // cherry-pick duplicate of a named-branch commit (ticket 333) onto int-env
  git(['checkout', '-q', 'mlk/master']); git(['checkout', '-q', '-b', 'mlk/qa/333']); w('c.txt', 'c333\n'); const c333 = commit('QA #333 add c'); git(['push', '-q', 'origin', 'mlk/qa/333']);
  git(['checkout', '-q', 'mlk/int-env']); git(['cherry-pick', c333]); const dup333 = git(['rev-parse', 'HEAD']);
  // decoy: #1110 must NOT match 111
  w('d.txt', 'decoy\n'); const decoy = commit('#1110 unrelated decoy');
  git(['push', '-q', 'origin', 'mlk/int-env']);
  git(['checkout', '-q', 'mlk/master']);

  // ---------- Part A: module-level assertions ----------
  const r111 = discoverTicket(work, ['111'], { noFetch: true });
  check('A1 named branch indexed', r111.branches.length === 1 && r111.branches[0].name === 'mlk/internal/111', JSON.stringify(r111.branches));
  check('A2 deleted-branch orphan fix3 surfaced as orphan tip', r111.orphanTips.length === 1 && r111.orphanTips[0] === fix3, r111.orphanTips.join(','));
  check('A3 pom-only pin classified POM-PIN + excluded (visible)', r111.excluded.some(e => e.sha === pin && e.kind === 'POM-PIN'), JSON.stringify(r111.excluded.map(e => e.kind)));
  check('A4 decoy #1110 NOT matched (word boundary)', !r111.commits.some(c => c.sha === decoy), r111.commits.map(c => c.subject).join(' | '));
  check('A5 plan = branch + orphan sha', r111.plan.length === 2 && r111.plan[0].src === 'mlk/internal/111' && r111.plan[1].sha === fix3, JSON.stringify(r111.plan.map(p => p.src)));
  check('A6 vN-merge fingerprint reported', r111.mergesNamingV.some(m => /111v3/.test(m.subject)), JSON.stringify(r111.mergesNamingV));
  const r333 = discoverTicket(work, ['333'], { noFetch: true });
  check('A7 cherry-pick dup classified PATCH-EQUIVALENT (not an orphan)', r333.orphanTips.length === 0 && r333.excluded.some(e => e.sha === dup333 && e.kind === 'PATCH-EQUIVALENT'), JSON.stringify(r333.excluded));
  const r222 = discoverTicket(work, parseNumbers('222:111').numbers, { noFetch: true });
  check('A8 alias number search (222:111) finds 111 content', r222.orphanTips[0] === fix3 && r222.branches.length === 1, r222.numbers.join(','));
  check('A9 numRe is word-bounded', new RegExp(numRe('111')).test('Ref #111: x') && !new RegExp(numRe('111')).test('#1110 y') && !new RegExp(numRe('111')).test('x 2111'), '');

  // ---------- Part A: release-prep end-to-end — hand list FAILS verify, discovery list PASSES ----------
  let r = prep(['init', '--release', '9.9.9', '--repo', work]);
  check('B1 init', r.status === 0, r.stderr.slice(0, 150));
  r = prep(['branch', '--release', '9.9.9']);
  check('B2 branch', r.status === 0, r.stderr.slice(0, 150));
  r = prep(['set-tickets', '--release', '9.9.9', '--tickets', '111=mlk/internal/111,333=mlk/qa/333']);   // the OLD way: branch names only
  check('B3 hand-listed set-tickets accepted', r.status === 0, r.stderr.slice(0, 150));
  r = prep(['merge', '--release', '9.9.9']);
  check('B4 merge of hand list ok', r.status === 0, r.stderr.slice(0, 150));
  r = prep(['verify', '--release', '9.9.9']);
  check('B5 verify FAILS on the orphan fix3 (coverage gate)', r.status === 2 && /content coverage gap/.test(r.stderr) && new RegExp(fix3.slice(0, 10)).test(r.stdout), 'exit=' + r.status + ' ' + r.stdout.slice(-300));
  r = prep(['add-ticket', '--release', '9.9.9', '--ticket', '111v3', '--sha', fix3]);
  check('B6 add-ticket --sha accepted (reachable from origin/mlk/int-env)', r.status === 0, r.stderr.slice(0, 150));
  r = prep(['merge', '--release', '9.9.9']);
  check('B7 merge picks up only the new entry', r.status === 0 && /#111v3/.test(r.stdout), r.stdout.slice(-200));
  r = prep(['verify', '--release', '9.9.9']);
  check('B8 verify PASSES once fix3 is in (pin + dup excluded, not failing)', r.status === 0 && /0 ✓/.test(r.stdout), 'exit=' + r.status + ' ' + (r.stderr || r.stdout).slice(-300));

  // discovery-driven path on a fresh release: must pass verify first time
  git(['checkout', '-q', 'mlk/master']);
  r = prep(['init', '--release', '9.9.10', '--repo', work]); r = prep(['branch', '--release', '9.9.10']);
  r = prep(['discover', '--release', '9.9.10', '--tickets', '111,333']);
  check('C1 discover reports the orphan loudly', r.status === 0 && /orphan commit tips: 1/.test(r.stdout) && /NOTHING — branch deleted/.test(r.stdout), r.stdout.slice(-300));
  r = prep(['set-tickets', '--release', '9.9.10', '--from-discovery']);
  check('C2 set-tickets --from-discovery includes the orphan sha', r.status === 0 && /orphan commit/.test(r.stdout) && /mlk\/internal\/111/.test(r.stdout), r.stdout.slice(-300));
  r = prep(['merge', '--release', '9.9.10']);
  check('C3 merge from discovery plan', r.status === 0, r.stderr.slice(0, 150));
  r = prep(['verify', '--release', '9.9.10']);
  check('C4 verify PASSES first time on the discovery-driven release', r.status === 0, 'exit=' + r.status + ' ' + (r.stderr || r.stdout).slice(-300));
  const relHas = spawnSync('git', ['merge-base', '--is-ancestor', fix3, 'mlk/release/9.9.10'], { cwd: work }).status === 0;
  check('C5 release branch actually contains fix3', relHas, '');
  r = prep(['set-tickets', '--release', '9.9.10', '--from-discovery']);
  check('C6 set-tickets refused after merging started (phase guard intact)', r.status === 2, 'exit=' + r.status);
  // NO-EVIDENCE ticket refuses --from-discovery
  git(['checkout', '-q', 'mlk/master']);
  prep(['init', '--release', '9.9.11', '--repo', work]); prep(['branch', '--release', '9.9.11']);
  prep(['discover', '--release', '9.9.11', '--tickets', '111,999']);
  r = prep(['set-tickets', '--release', '9.9.11', '--from-discovery']);
  check('C7 NO-EVIDENCE ticket (999) blocks --from-discovery', r.status === 2 && /NO-EVIDENCE/.test(r.stderr), r.stderr.slice(0, 200));

  // drop-ticket: a ticket that CONFLICTS mid-merge is deferred visibly; verify then passes without it
  git(['checkout', '-q', 'mlk/master']); git(['checkout', '-q', '-b', 'mlk/cr/444']); w('a.txt', 'a1\nconflict444\n'); commit('444 wip'); git(['push', '-q', 'origin', 'mlk/cr/444']);
  git(['checkout', '-q', 'mlk/master']);
  prep(['init', '--release', '9.9.12', '--repo', work]); prep(['branch', '--release', '9.9.12']);
  prep(['discover', '--release', '9.9.12', '--tickets', '111,444']);   // 111 lands first, then 444 conflicts on a.txt
  prep(['set-tickets', '--release', '9.9.12', '--from-discovery']);
  r = prep(['merge', '--release', '9.9.12']);
  check('E1 planted conflict on #444 stops merge', r.status === 2 && /CONFLICT on #444/.test(r.stderr), 'exit=' + r.status);
  r = prep(['drop-ticket', '--release', '9.9.12', '--ticket', '444']);
  check('E2 drop-ticket refuses without --reason', r.status !== 0 && /reason/.test(r.stderr), r.stderr.slice(0, 120));
  r = prep(['drop-ticket', '--release', '9.9.12', '--ticket', '444', '--reason', 'CR still in progress']);
  check('E3 drop-ticket aborts the conflicted merge + defers visibly', r.status === 0 && /DEFERRED/.test(r.stdout) && git(['status', '--porcelain']) === '', r.stderr.slice(0, 150) + ' status=' + git(['status', '--porcelain']));
  r = prep(['merge', '--release', '9.9.12']);
  check('E4 merge continues with the remaining sources', r.status === 0, r.stderr.slice(0, 150));
  r = prep(['verify', '--release', '9.9.12']);
  check('E5 verify passes and shows the deferral', r.status === 0 && /DEFERRED.*#444/.test(r.stdout), 'exit=' + r.status + ' ' + (r.stderr || r.stdout).slice(-300));
  r = prep(['drop-ticket', '--release', '9.9.12', '--ticket', '111', '--reason', 'x']);
  check('E6 drop-ticket refuses an already-merged ticket', r.status === 2 && /already has a merged source/.test(r.stderr), r.stderr.slice(0, 150));

  // ---------- Part B: REAL repo (read-only) ----------
  const REAL = 'E:\\Projects\\Melaka\\etanah-pelupusan';
  if (fs.existsSync(REAL)) {
    const specs = ['274094', '276465', '277309', '256334', '277868:265537'];
    let supersetOk = true, detail = [];
    for (const s of specs) {
      const { numbers } = parseNumbers(s);
      const rr = discoverTicket(REAL, numbers, { noFetch: true });
      for (const n of numbers) {
        const truth = spawnSync('git', ['log', '--remotes=origin', '--not', 'origin/mlk/master', '--no-merges', '-E', `--grep=${numRe(n)}`, '--format=%H'], { cwd: REAL, encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean);
        const missing = truth.filter(sha => !rr.commits.some(c => c.sha === sha));
        if (missing.length) { supersetOk = false; detail.push(`${n}: ${missing.length} missing`); }
      }
      if (s === '274094') check('D2 REAL: fab13ed2 surfaced as orphan tip for #274094', rr.orphanTips.some(x => x.startsWith('fab13ed2')), rr.orphanTips.join(','));
      if (s === '277309') check('D3 REAL: e17c497870 (int-env pom pin) classified POM-PIN, 633f922cb2 PATCH-EQUIVALENT', rr.excluded.some(e => e.sha.startsWith('e17c497870') && e.kind === 'POM-PIN') && rr.excluded.some(e => e.sha.startsWith('633f922cb2') && e.kind === 'PATCH-EQUIVALENT'), JSON.stringify(rr.excluded.map(e => e.short + ':' + e.kind)));
    }
    check('D1 REAL: discovery ⊇ git-log ground truth for every 1.4.1 ticket number', supersetOk, detail.join('; ') || 'all covered');
  } else check('D0 REAL repo absent — Part B skipped', true, REAL);
} catch (e) {
  check('FIXTURE/RUN ERROR', false, e.stack || String(e));
} finally {
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best effort */ }
}

let pass = 0;
for (const r of results) { console.log(`${r.pass ? '✅' : '❌'} ${r.n}${r.pass ? '' : '  — ' + r.d}`); if (r.pass) pass++; }
console.log(`\n${pass}/${results.length} passed`);
process.exit(pass === results.length ? 0 : 1);
