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
  { name: '2026-11-05 replay: BLOCK cherry-pick in the work-clone worktree', cmd: 'git -C E:\\Dev\\etanah-work\\wt-int-env cherry-pick -x 282b57c927', expect: true },
  { name: 'BLOCK git -C reset --hard to origin', cmd: 'git -C "E:\\Projects\\Melaka\\etanah-pelupusan" reset --hard origin/mlk/int-env', expect: true },
  { name: 'PASS git -C plain push', cmd: 'git -C E:\\Dev\\etanah-work\\wt-288059 push -u origin mlk/internal/288059', expect: false },
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
  // v2 (2026-11-05, #287811): revert on his order only; a token in the assistant turn is not an order
  { name: 'v2 BLOCK revert with no order', cmd: 'cd E:\\Dev\\etanah-work\\wt-287811; git revert --no-edit 090156bcd2', turn: '', his: 'did you revert the unrelated ones?', expect: true },
  { name: 'v2 PASS revert with HIS order token', cmd: 'cd E:\\Dev\\etanah-work\\wt-287811; git revert --no-edit 090156bcd2', turn: '', his: '[miya-ordered-revert: undo it]', expect: false },
  { name: 'v2 BLOCK revert when only the ASSISTANT wrote the token', cmd: 'cd E:\\Dev\\etanah-work\\wt-287811; git revert --no-edit 090156bcd2', turn: '[miya-ordered-revert: undo it]', his: 'ok', expect: true },
  { name: 'v2 PASS origin-rewrite Tool (the one allowed force path)', cmd: 'node lib/origin-rewrite.js --repo E:\\Dev\\etanah-work\\wt-287811 --branch mlk/internal/287811 --lease 090156bcd2', turn: '', his: 'clean it up', expect: false },
  { name: 'v2 BLOCK raw force-with-lease still', cmd: 'git push --force-with-lease origin mlk/internal/287811', turn: '', his: 'clean it up', expect: true },
];

let failed = 0;
for (const c of cases) {
  const d = decide(c.cmd, c.turn || '', c.his);
  const ok = !!d.block === c.expect;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${c.name} (block=${!!d.block}${d.kind ? '/' + d.kind : ''}, expected=${c.expect})`);
}

// v2 live checks with an injected git: re-merge of the same ticket branch into int-env twice in one day; multi-commit push.
const { liveDecide } = require('./deploy-guard.check.hook.js');
const gitStub = (log, count) => (args) => /^log --first-parent/.test(args) ? log : (/^rev-list/.test(args) ? String(count) : '');
const live = [
  { name: 'v2 live BLOCK second merge of the same ticket branch into int-env today', cmd: 'cd E:\\Dev\\etanah-work\\wt-int-env; git merge --no-ff origin/mlk/internal/287811', git: gitStub("Merge remote-tracking branch 'origin/mlk/internal/287811' into mlk/int-env\nMerge branch 'mlk/requirement/280111' into mlk/int-env", '1'), his: 'merge it', expect: true, kind: 're-merge' },
  { name: 'v2 live PASS first merge of the ticket branch today', cmd: 'cd E:\\Dev\\etanah-work\\wt-int-env; git merge --no-ff origin/mlk/internal/287811', git: gitStub("Merge branch 'mlk/requirement/280111' into mlk/int-env", '1'), his: 'merge it', expect: false },
  { name: 'v2 live PASS second merge with HIS order token', cmd: 'cd E:\\Dev\\etanah-work\\wt-int-env; git merge --no-ff origin/mlk/internal/287811', git: gitStub("Merge remote-tracking branch 'origin/mlk/internal/287811' into mlk/int-env", '1'), his: '[miya-ordered-remerge: writers table done, merge again]', expect: false },
  { name: 'v2 live BLOCK push of a ticket branch with 3 non-merge commits made today', cmd: 'cd E:\\Dev\\etanah-work\\wt-287811; git push origin mlk/internal/287811', git: gitStub('', '3'), his: 'push it', expect: true, kind: 'multi-commit' },
  { name: 'v2 live PASS push with 1 commit today', cmd: 'cd E:\\Dev\\etanah-work\\wt-287811; git push origin mlk/internal/287811', git: gitStub('', '1'), his: 'push it', expect: false },
  { name: 'v2 live PASS multi-commit push with HIS order token', cmd: 'cd E:\\Dev\\etanah-work\\wt-287811; git push origin mlk/internal/287811', git: gitStub('', '3'), his: '[miya-ordered-multi-commit: keep the two commits]', expect: false },
];
for (const c of live) {
  const d = liveDecide(c.cmd, 'E:\\Dev\\etanah-work', c.his, c.git);
  const ok = !!d.block === c.expect && (!c.kind || d.kind === c.kind);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${c.name} (block=${!!d.block}${d.kind ? '/' + d.kind : ''}, expected=${c.expect})`);
}
console.log(`\ndeploy-guard.eval: ${cases.length + live.length - failed}/${cases.length + live.length} green`);
process.exit(failed ? 1 : 0);
