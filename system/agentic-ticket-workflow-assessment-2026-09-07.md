# Agentic ticket-workflow assessment — 2026-09-07 (Baseline 1.5.0)

| Axis | Finding | Instance |
|---|---|---|
| A1 agentic system | Zero delegation needed; deterministic scripts (recon · audit-ticket · discover) did the work inline. Two Stop gates false-fired on a release turn (render-verify, predicate-box) because a .docx was compared for merge resolution. | V2 turn: `git checkout --theirs MaklumatPemohon.docx` → RENDER-VERIFY demanded |
| A2 quest workflow | Release skill promised "exclude with a reason via discover review" with no implementation; `git cherry` misses a one-blank-line drift. Built `mark-equivalent`. Detection side was right: audit-ticket found Aaron's unpushed `7cb2d36297` that a branch-name merge would have missed. | `c27700141e` UNCOVERED; `7cb2d36297` parent = branch tip, only on int-env |
| A3 debugging | Content-equivalence proof by added/removed line-set + docx blob ids took 2 commands and settled the merge with no build cycle. | line-set diff = 1 blank line; blobs 9f933b5726/7ef03c6b15/f65e24df14 |
| A4 etanah issue-solving | Judgment slip: handed miya "confirm with Aaron / Anis" when the diff already answered include. | slip `ask-back/fact-check`; memory `feedback_release_recommend_dont_ask` |
| A5 sweep | ⏭ no ticket sweep this session |

Infra: worktree `.git/worktrees/<name>` admin dir vanished mid-session (OneDrive de-registration class, 2026-09-04 D1); recovered by re-creating gitdir/HEAD/commondir + `git reset`. `*.local.json` missing in worktree for the 4th time → `seedLocalConfigs()` at init.
