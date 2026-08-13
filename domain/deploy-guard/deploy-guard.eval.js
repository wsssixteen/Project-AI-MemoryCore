/**
 * deploy-guard.eval.js — behavioural eval for deploy-guard.check.hook.js
 * Run: node domain/deploy-guard/deploy-guard.eval.js   (exit 0 = all green)
 */
'use strict';
const { decide } = require('./deploy-guard.check.hook.js');

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
console.log(`\ndeploy-guard.eval: ${cases.length - failed}/${cases.length} green`);
process.exit(failed ? 1 : 0);
