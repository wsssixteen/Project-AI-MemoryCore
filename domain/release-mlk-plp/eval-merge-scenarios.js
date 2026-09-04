// eval-merge-scenarios.js — release-gate eval harness (2026-08-24, /goal hardening after #275539 v2).
// Builds THROWAWAY synthetic git environments (bare origin + working clone) that FABRICATE each
// release-assembly failure type, then runs the REAL gates (verify-gates.js — the same module
// release-prep.js verify/postcheck use) against them, many iterations with randomized tickets,
// files, and content. Usage:  node eval-merge-scenarios.js [--n 20] [--keep]
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runGates } = require('./verify-gates.js');

const N = (() => { const i = process.argv.indexOf('--n'); return i > -1 ? parseInt(process.argv[i + 1], 10) : 20; })();
const KEEP = process.argv.includes('--keep');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'relgate-eval-'));

function sh(cwd, cmd, args) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function g(repo, args) { return sh(repo, 'git', args); }
const rnd = (n = 6) => String(Math.floor(Math.random() * 9e5) + 1e5).slice(0, n);
const rndWord = () => Math.random().toString(36).slice(2, 10);

// ── fixture builder ─────────────────────────────────────────────────────────
function makeFixture(name) {
  const dir = path.join(ROOT, name);
  const origin = path.join(dir, 'origin.git');
  const work = path.join(dir, 'work');
  fs.mkdirSync(origin, { recursive: true });
  sh(dir, 'git', ['init', '--bare', 'origin.git']);
  sh(dir, 'git', ['clone', origin, 'work']);
  g(work, ['config', 'user.name', 'eval']);
  g(work, ['config', 'user.email', 'eval@local']);
  // seed mlk/master: pom + java files
  g(work, ['checkout', '-b', 'mlk/master']);
  write(work, 'pom.xml', pomXml('1.3.5', '1.1.17-MLK'));
  write(work, 'src/Service.java', 'class Service { /* base */ }\n');
  write(work, 'src/Helper.java', 'class Helper { /* base */ }\n');
  fs.mkdirSync(path.join(work, 'template'), { recursive: true });
  fs.writeFileSync(path.join(work, 'template/Surat.docx'), Buffer.from([0x50, 0x4b, 3, 4, 0, 1, 2, 3]));
  g(work, ['add', '-A']); g(work, ['commit', '-m', 'seed master']);
  g(work, ['push', 'origin', 'mlk/master']);
  return { dir, origin, work };
}
function write(repo, rel, content) {
  const p = path.join(repo, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}
function pomXml(ver, common) {
  return `<project>\n  <artifactId>etanah-pelupusan</artifactId>\n  <version>${ver}</version>\n  <properties>\n    <etanah.common.version>${common}</etanah.common.version>\n  </properties>\n</project>\n`;
}
// commit files on a NEW branch off origin/mlk/master, push it
function ticketBranch(f, branch, num, files, msg) {
  g(f.work, ['checkout', '-B', branch, 'origin/mlk/master']);
  for (const [rel, content] of files) {
    if (Buffer.isBuffer(content)) { fs.mkdirSync(path.dirname(path.join(f.work, rel)), { recursive: true }); fs.writeFileSync(path.join(f.work, rel), content); }
    else write(f.work, rel, content);
  }
  g(f.work, ['add', '-A']); g(f.work, ['commit', '-m', msg || `Ref #${num} - ${rndWord()}`]);
  g(f.work, ['push', 'origin', branch]);
}
// cut release off origin/mlk/master and merge the given branches (strategy per branch optional)
function makeRelease(f, ver, merges) {
  g(f.work, ['checkout', '-B', `mlk/release/${ver}`, 'origin/mlk/master']);
  for (const m of merges) {
    const args = ['merge', '--no-ff', `origin/${m.branch}`, '-m', `Merge ${m.branch} into mlk/release/${ver}`];
    if (m.strategy) args.splice(1, 0, '-s', m.strategy);
    g(f.work, args);
  }
}
function gates(f, tickets, extra) {
  return runGates(Object.assign({
    repo: f.work, headRef: 'HEAD', masterRef: 'origin/mlk/master', remote: 'origin', tickets,
  }, extra || {}));
}
const hasFail = (res, gate) => res.findings.some(x => x.level === 'fail' && x.gate === gate);
const hasWarn = (res, gate) => res.findings.some(x => x.level === 'warn' && x.gate === gate);

// ── the 10 scenario types ───────────────────────────────────────────────────
const SCENARIOS = [
  { id: 1, name: 'clean-release (control)', expect: 'PASS', run(f) {
    const num = rnd(); const br = `mlk/qa/${num}`;
    ticketBranch(f, br, num, [['src/Service.java', `class Service { /* fix ${rndWord()} */ }\n`]]);
    makeRelease(f, '9.9.9', [{ branch: br }]);
    const res = gates(f, [{ ticket: num, src: br }]);
    return res.ok === true && res.findings.filter(x => x.level === 'fail').length === 0;
  } },
  { id: 2, name: 'late v2 sibling on origin (#275539 class)', expect: 'BLOCK sibling-sweep', run(f) {
    const num = rnd(); const v1 = `mlk/training/${num}`, v2 = `mlk/training/${num}v2`;
    ticketBranch(f, v1, num, [['src/Service.java', `class Service { /* v1 ${rndWord()} */ }\n`]]);
    makeRelease(f, '9.9.9', [{ branch: v1 }]);
    // v2 pushed AFTER the release was assembled — the today case
    ticketBranch(f, v2, num, [['src/Helper.java', `class Helper { /* v2 ${rndWord()} */ }\n`]]);
    g(f.work, ['checkout', 'mlk/release/9.9.9']);
    const res = gates(f, [{ ticket: num, src: v1 }]);
    return res.ok === false && hasFail(res, 'sibling-sweep');
  } },
  { id: 3, name: 'rework sibling with -suffix name', expect: 'BLOCK sibling-sweep', run(f) {
    const num = rnd(); const v1 = `mlk/qa/${num}`, fix = `mlk/qa/${num}-hotfix`;
    ticketBranch(f, v1, num, [['src/Service.java', `class Service { /* ${rndWord()} */ }\n`]]);
    ticketBranch(f, fix, num, [['src/Helper.java', `class Helper { /* ${rndWord()} */ }\n`]]);
    makeRelease(f, '9.9.9', [{ branch: v1 }]);
    const res = gates(f, [{ ticket: num, src: v1 }]);
    return res.ok === false && hasFail(res, 'sibling-sweep');
  } },
  { id: 4, name: 'mapped branch never merged', expect: 'BLOCK containment', run(f) {
    const a = rnd(), b = rnd(); const brA = `mlk/qa/${a}`, brB = `mlk/qa/${b}`;
    ticketBranch(f, brA, a, [['src/Service.java', `class Service { /* ${rndWord()} */ }\n`]]);
    ticketBranch(f, brB, b, [['src/Helper.java', `class Helper { /* ${rndWord()} */ }\n`]]);
    makeRelease(f, '9.9.9', [{ branch: brA }]); // forgot brB
    const res = gates(f, [{ ticket: a, src: brA }, { ticket: b, src: brB }]);
    return res.ok === false && hasFail(res, 'containment');
  } },
  { id: 5, name: 'ticket reverted on master (#273461 class)', expect: 'BLOCK revert-scan', run(f) {
    const num = rnd(); const br = `mlk/qa/${num}`;
    ticketBranch(f, br, num, [['src/Service.java', `class Service { /* fix ${num} */ }\n`]], `Ref #${num} - the fix`);
    g(f.work, ['checkout', 'mlk/master']); g(f.work, ['pull', 'origin', 'mlk/master']);
    g(f.work, ['merge', '--no-ff', `origin/${br}`, '-m', `Merge ${br}`]);
    const mergeSha = g(f.work, ['rev-parse', 'HEAD']);
    g(f.work, ['revert', '-m', '1', '--no-edit', mergeSha]);
    // put the ticket number in the revert subject the way teams do
    g(f.work, ['commit', '--amend', '-m', `Revert "Ref #${num} - the fix" (broke UAT)`]);
    g(f.work, ['push', 'origin', 'mlk/master']);
    makeRelease(f, '9.9.9', [{ branch: br }]); // merge is a no-op: master already had + reverted it
    const res = gates(f, [{ ticket: num, src: br }]);
    return res.ok === false && hasFail(res, 'revert-scan');
  } },
  { id: 6, name: 'conflict resolution drops a code change', expect: 'BLOCK drop-scan', run(f) {
    const a = rnd(), b = rnd(); const brA = `mlk/qa/${a}`, brB = `mlk/qa/${b}`;
    ticketBranch(f, brA, a, [['src/Service.java', `class Service { /* A ${rndWord()} */ }\n`]]);
    ticketBranch(f, brB, b, [['src/Service.java', `class Service { /* B ${rndWord()} */ }\n`]]);
    makeRelease(f, '9.9.9', [{ branch: brA }, { branch: brB, strategy: 'ours' }]); // B's content discarded
    const res = gates(f, [{ ticket: a, src: brA }, { ticket: b, src: brB }]);
    return res.ok === false && hasFail(res, 'drop-scan');
  } },
  { id: 7, name: 'binary .docx change lost in merge', expect: 'BLOCK drop-scan', run(f) {
    const num = rnd(); const br = `mlk/qa/${num}`;
    const newDocx = Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), Buffer.from(rndWord())]);
    ticketBranch(f, br, num, [['template/Surat.docx', newDocx]]);
    makeRelease(f, '9.9.9', [{ branch: br, strategy: 'ours' }]); // template change discarded
    const res = gates(f, [{ ticket: num, src: br }]);
    return res.ok === false && hasFail(res, 'drop-scan');
  } },
  { id: 8, name: 'late merge overwrites the common bump', expect: 'BLOCK pom-common', run(f) {
    const num = rnd(); const br = `mlk/qa/${num}`;
    ticketBranch(f, br, num, [['src/Service.java', `class Service { /* ${rndWord()} */ }\n`]]);
    makeRelease(f, '9.9.9', [{ branch: br }]);
    write(f.work, 'pom.xml', pomXml('1.3.5', '9.9.13-MLK'));
    g(f.work, ['add', 'pom.xml']); g(f.work, ['commit', '-m', 'common version increase to: 9.9.13-MLK']);
    // a bad late resolution reverts the pom line
    write(f.work, 'pom.xml', pomXml('1.3.5', '1.1.17-MLK'));
    g(f.work, ['add', 'pom.xml']); g(f.work, ['commit', '-m', `Merge cleanup`]);
    const res = gates(f, [{ ticket: num, src: br }], { commonBumpedTo: '9.9.13-MLK' });
    return res.ok === false && hasFail(res, 'pom-common');
  } },
  { id: 9, name: 'stale mapping — branch adds 0 commits (no-op merge)', expect: 'WARN noop-branch', run(f) {
    const num = rnd(); const br = `mlk/qa/${num}`;
    ticketBranch(f, br, num, [['src/Service.java', `class Service { /* ${rndWord()} */ }\n`]]);
    // fix already landed on master long ago
    g(f.work, ['checkout', 'mlk/master']); g(f.work, ['merge', '--no-ff', `origin/${br}`, '-m', `Merge ${br}`]);
    g(f.work, ['push', 'origin', 'mlk/master']);
    makeRelease(f, '9.9.9', [{ branch: br }]);
    const res = gates(f, [{ ticket: num, src: br }]);
    return hasWarn(res, 'noop-branch');
  } },
  { id: 10, name: 'stowaway ticket ref in release delta', expect: 'WARN stowaway-refs', run(f) {
    const num = rnd(); let other = rnd(); while (other === num) other = rnd();
    const br = `mlk/qa/${num}`;
    g(f.work, ['checkout', '-B', br, 'origin/mlk/master']);
    write(f.work, 'src/Service.java', `class Service { /* ${rndWord()} */ }\n`);
    g(f.work, ['add', '-A']); g(f.work, ['commit', '-m', `Ref #${num} - the scoped fix`]);
    write(f.work, 'src/Helper.java', `class Helper { /* smuggled ${rndWord()} */ }\n`);
    g(f.work, ['add', '-A']); g(f.work, ['commit', '-m', `Ref #${other} - unrelated fix riding along`]);
    g(f.work, ['push', 'origin', br]);
    makeRelease(f, '9.9.9', [{ branch: br }]);
    const res = gates(f, [{ ticket: num, src: br }]);
    return hasWarn(res, 'stowaway-refs');
  } },
];

// ── run loops ───────────────────────────────────────────────────────────────
const t0 = Date.now();
const score = [];
let totalRuns = 0, totalPass = 0;
for (const sc of SCENARIOS) {
  let pass = 0; const fails = [];
  for (let i = 0; i < N; i++) {
    totalRuns++;
    let ok = false, err = null, f = null;
    // fixture creation can transiently fail on Windows temp dirs (AV/indexer lock) — retry up to 2×
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      err = null;
      try {
        f = makeFixture(`s${sc.id}-i${i}-a${attempt}`);
        ok = sc.run(f);
      } catch (e) { err = (e.message || String(e)).split('\n')[0]; }
      if (!ok && f && attempt < 2) fs.rmSync(f.dir, { recursive: true, force: true });
    }
    if (ok) { pass++; totalPass++; if (!KEEP) fs.rmSync(f.dir, { recursive: true, force: true }); }
    else fails.push(`iter ${i}${err ? ` (error: ${err})` : ''} — fixture kept at ${f ? f.dir : '(creation failed)'}`);
  }
  score.push({ id: sc.id, name: sc.name, expect: sc.expect, pass, n: N, fails });
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`\n## Release-gate eval — ${totalPass}/${totalRuns} runs correct · ${secs}s · N=${N} per scenario\n`);
console.log('| # | Scenario | Expected gate verdict | Result |');
console.log('|---|---|---|---|');
for (const s of score) {
  console.log(`| ${s.id} | ${s.name} | ${s.expect} | ${s.pass}/${s.n} ${s.pass === s.n ? '✅' : '❌'} |`);
  for (const fl of s.fails) console.log(`|   |   |   | ⛔ ${fl} |`);
}
if (!KEEP && totalPass === totalRuns) fs.rmSync(ROOT, { recursive: true, force: true });
else console.log(`\nfixtures root: ${ROOT}`);
process.exit(totalPass === totalRuns ? 0 : 1);
