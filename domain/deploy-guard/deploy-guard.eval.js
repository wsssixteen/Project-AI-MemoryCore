/**
 * deploy-guard.eval.js — behavioural eval for deploy-guard.check.hook.js
 * Run: node domain/deploy-guard/deploy-guard.eval.js   (exit 0 = all green)
 */
'use strict';
const { decide, envAncestryFor } = require('./deploy-guard.check.hook.js');

const cases = [
  // F2 — the QA-274745 replay case (cherry-pick onto a company branch)
  { name: 'F2 replay: BLOCK cherry-pick (etanah path)', cmd: 'cd "E:/Projects/Melaka/etanah-pelupusan" && git cherry-pick 2983a2e2b9', expect: true },
  { name: 'BLOCK cherry-pick (mlk ref ctx)', cmd: 'git cherry-pick 4c3251ac34   # onto mlk/int-env', expect: true },
  { name: 'BLOCK merge -X theirs', cmd: 'git merge -X theirs origin/mlk/esokongan/274745', expect: true },
  { name: 'BLOCK checkout --theirs on conflict', cmd: 'git checkout --theirs src/x.docx   # mlk/int-env', expect: true },
  { name: 'BLOCK checkout --ours', cmd: 'git checkout --ours -- pom.xml && echo mlk/int-env', expect: true },
  { name: 'BLOCK force-push to mlk', cmd: 'git push --force origin HEAD:mlk/int-env', expect: true },
  { name: 'BLOCK -f push mlk', cmd: 'git push -f origin mlk/master', expect: true },
  { name: 'BLOCK reset --hard to origin', cmd: 'cd etanah-pelupusan && git reset --hard origin/mlk/master', expect: true },
  // the CORRECT convention — must NOT block
  { name: 'PASS proper --no-ff merge', cmd: 'git merge --no-ff origin/mlk/esokongan/274745 -m "Merge ... into mlk/int-env"', expect: false },
  { name: 'PASS normal push (no force)', cmd: 'git push origin HEAD:mlk/int-env', expect: false },
  { name: 'PASS checkout branch', cmd: 'git checkout mlk/master', expect: false },
  { name: 'PASS bare reset --hard (discard WIP)', cmd: 'cd etanah-pelupusan && git reset --hard', expect: false },
  // F1 — scope: non-etanah / no company-branch context never fires
  { name: 'F1 clean: PASS cherry-pick in MemoryCore', cmd: 'git cherry-pick abc1234   # main', expect: false },
  { name: 'PASS bypass token', cmd: 'git cherry-pick 2983a2e2b9   # etanah-pelupusan', turn: 'do it [skip-deploy-guard: hotfix recovery, miya-approved]', expect: false },
];

let failed = 0;
for (const c of cases) {
  const d = decide(c.cmd, c.turn || '');
  const ok = !!d.block === c.expect;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${c.name} (block=${!!d.block}${d.kind ? '/' + d.kind : ''}, expected=${c.expect})`);
}

// C10 — branch-from-env / commit-branch-name / commit-off-env-ancestry (ctx-driven; the hook
// resolves ctx from live git, ctx is supplied directly here so decide() stays unit-testable).
const ctxCases = [
  { name: 'branch-from-env: checkout -b x mlk/int-env → BLOCK', cmd: 'git checkout -b x mlk/int-env', ctx: {}, expectBlock: true, expectKind: 'branch-from-env' },
  { name: 'branch-from-env: switch -c x origin/mlk/stag-env → BLOCK', cmd: 'git switch -c x origin/mlk/stag-env', ctx: {}, expectBlock: true, expectKind: 'branch-from-env' },
  { name: 'branch-from-env: checkout -b x (no start, ctx.currentBranch=mlk/int-env) → BLOCK', cmd: 'git checkout -b x', ctx: { currentBranch: 'mlk/int-env' }, expectBlock: true, expectKind: 'branch-from-env' },
  { name: 'branch-from-env: checkout -b mlk/esokongan/280540 origin/mlk/master → PASS', cmd: 'git checkout -b mlk/esokongan/280540 origin/mlk/master', ctx: {}, expectBlock: false },
  { name: 'commit-branch-name: commit on mlk/esokongan/280540 → PASS', cmd: 'cd "E:/Projects/Melaka/etanah-pelupusan" && git commit -m "fix"', ctx: { currentBranch: 'mlk/esokongan/280540' }, expectBlock: false },
  { name: 'commit-branch-name: commit on mlk/esokongan/280540v2 → BLOCK', cmd: 'cd "E:/Projects/Melaka/etanah-pelupusan" && git commit -m "fix"', ctx: { currentBranch: 'mlk/esokongan/280540v2' }, expectBlock: true, expectKind: 'commit-branch-name' },
  { name: 'commit-branch-name: commit on intenvfix-280540 → BLOCK', cmd: 'cd "E:/Projects/Melaka/etanah-pelupusan" && git commit -m "fix"', ctx: { currentBranch: 'intenvfix-280540' }, expectBlock: true, expectKind: 'commit-branch-name' },
  { name: 'commit-branch-name: commit on mlk/release/1.6.3 → PASS', cmd: 'cd "E:/Projects/Melaka/etanah-pelupusan" && git commit -m "fix"', ctx: { currentBranch: 'mlk/release/1.6.3' }, expectBlock: false },
  { name: 'commit-off-env-ancestry: envAncestry mlk/int-env=false → BLOCK', cmd: 'cd "E:/Projects/Melaka/etanah-pelupusan" && git commit -m "fix"', ctx: { currentBranch: 'mlk/esokongan/280540', envAncestry: { 'mlk/int-env': false } }, expectBlock: true, expectKind: 'commit-off-env-ancestry' },
  { name: 'generic [skip-deploy-guard:] does NOT cover new kinds → still BLOCK', cmd: 'git checkout -b x mlk/int-env', ctx: {}, turn: '[skip-deploy-guard: whatever]', expectBlock: true, expectKind: 'branch-from-env' },
  { name: '[miya-approved-branch:] bypasses the new kinds → PASS', cmd: 'git checkout -b x mlk/int-env', ctx: {}, turn: '[miya-approved-branch: hotfix on int-env per miya 2026-09-22]', expectBlock: false },
  // v1.2.1 (2026-09-23) — reviewer real-shape cases (finding B: flags/listing forms; finding A: merged ticket)
  { name: 'v1.2.1 (3): `git branch --show-current` while on int-env → PASS', cmd: 'git branch --show-current', ctx: { currentBranch: 'mlk/int-env' }, expectBlock: false },
  { name: 'v1.2.1 (3b): `git branch -D x` while on int-env → PASS', cmd: 'git branch -D x', ctx: { currentBranch: 'mlk/int-env' }, expectBlock: false },
  { name: 'v1.2.1 (3c): plain `git checkout mlk/esokongan/280540` while on int-env → PASS', cmd: 'git checkout -q mlk/esokongan/280540', ctx: { currentBranch: 'mlk/int-env' }, expectBlock: false },
  { name: 'v1.2.1 (4): `checkout -q -B mlk/esokongan/280540 origin/mlk/master` while on int-env → PASS', cmd: 'git checkout -q -B mlk/esokongan/280540 origin/mlk/master', ctx: { currentBranch: 'mlk/int-env' }, expectBlock: false },
  { name: 'v1.2.1 (5): `checkout -b intenvfix-280540` while on int-env → BLOCK', cmd: 'git checkout -b intenvfix-280540', ctx: { currentBranch: 'mlk/int-env' }, expectBlock: true, expectKind: 'branch-from-env' },
  { name: 'v1.2.1 (5b): `checkout -b -q x` (flag after -b) while on int-env → BLOCK', cmd: 'git checkout -b -q x', ctx: { currentBranch: 'mlk/int-env' }, expectBlock: true, expectKind: 'branch-from-env' },
  { name: 'v1.2.1 (5c): `switch -c y origin/mlk/stag-env` → BLOCK', cmd: 'git switch -c y origin/mlk/stag-env', ctx: {}, expectBlock: true, expectKind: 'branch-from-env' },
  { name: 'v1.2.1 (1): ticket merged into int-env, then commit on ticket (envAncestry true) → PASS', cmd: 'cd "E:/Projects/Melaka/etanah-pelupusan" && git commit -m "rework"', ctx: { currentBranch: 'mlk/esokongan/280540', envAncestry: { 'mlk/int-env': true } }, expectBlock: false },
];
for (const c of ctxCases) {
  const d = decide(c.cmd, c.turn || '', c.ctx);
  const blockOk = !!d.block === c.expectBlock;
  const kindOk = !c.expectKind || d.kind === c.expectKind;
  const ok = blockOk && kindOk;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${c.name} (block=${!!d.block}${d.kind ? '/' + d.kind : ''}, bypass=${!!d.bypass})`);
}

// v1.2.1 (C): a plain `git commit` outside etanah context reports NO noCtx (no log noise).
let extra = 0;
{
  extra++;
  const d = decide('git commit -m "docs"', '', {});
  const ok = !d.block && !d.noCtx;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} — v1.2.1 (C) MemoryCore commit reports no noCtx (noCtx=${d.noCtx})`);
}

// v1.2.1 (A) REAL GIT: envAncestryFor() in a temp repo — refs named literally `origin/mlk/master` and
// `origin/mlk/int-env` (refs/heads/origin/... resolves the same as a remote-tracking ref for rev-list).
//   C0 ─ master ─ int-env
//   ticket = C0 + C1 ; int-env = merge --no-ff ticket (M1) ; ticket += C2   → HEAD=ticket → true (PASS)
//   cut    = int-env + C3                                                   → HEAD=cut    → false (BLOCK)
{
  const { execSync } = require('child_process');
  const os = require('os'), fs = require('fs'), path = require('path');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dg-eval-'));
  const g = (c) => execSync('git -c user.name=t -c user.email=t@t ' + c, { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let resMerged = null, resCut = null, err = '';
  try {
    g('init -q -b mlk/master');
    fs.writeFileSync(path.join(tmp, 'a.txt'), 'c0\n'); g('add -A'); g('commit -q -m C0');
    g('branch origin/mlk/master'); g('branch origin/mlk/int-env');
    g('checkout -q -b mlk/esokongan/280540');
    fs.writeFileSync(path.join(tmp, 'b.txt'), 'c1\n'); g('add -A'); g('commit -q -m C1');
    g('checkout -q origin/mlk/int-env'); g('merge --no-ff -q mlk/esokongan/280540 -m M1');
    g('checkout -q mlk/esokongan/280540');
    fs.writeFileSync(path.join(tmp, 'c.txt'), 'c2\n'); g('add -A'); g('commit -q -m C2');
    resMerged = envAncestryFor(tmp, 'mlk/int-env', 'mlk/master');
    g('checkout -q -b cut-from-env origin/mlk/int-env');
    fs.writeFileSync(path.join(tmp, 'd.txt'), 'c3\n'); g('add -A'); g('commit -q -m C3');
    resCut = envAncestryFor(tmp, 'mlk/int-env', 'mlk/master');
  } catch (e) { err = String(e && e.message || e).slice(0, 200); }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
  extra++;
  const ok1 = resMerged === true;
  if (!ok1) failed++;
  console.log(`${ok1 ? 'PASS' : 'FAIL'} — v1.2.1 (A) real git: ticket merged into int-env then commit → envAncestryFor=true (got ${resMerged}${err ? ' err=' + err : ''})`);
  extra++;
  const ok2 = resCut === false;
  if (!ok2) failed++;
  console.log(`${ok2 ? 'PASS' : 'FAIL'} — v1.2.1 (A) real git: branch cut from int-env → envAncestryFor=false (got ${resCut})`);
}

const total = cases.length + ctxCases.length + extra;
console.log(`\ndeploy-guard.eval: ${total - failed}/${total} green`);
process.exit(failed ? 1 : 0);
