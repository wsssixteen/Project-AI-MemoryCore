# Agentic / workflow assessment — 2026-09-10

Session: QA-278699 deploy + Phase-1 close + DE. Instance-backed per axis.

## A1 — Agentic system
- **Failure class: housekeeping hook deleted the live session's own worktree.** Instance: `worktree-cleanup-boot` errored 37×/7d (7.4 audit); this session it de-registered `quest-278699-resume-d5f4d5` mid-run (empty `.git/worktrees/<name>/`, dropped from `git worktree list`), forcing every DE save + commit into the main checkout. Proposal A1 logged. A cleanup step must never remove a worktree an active session is running inside, and a hook erroring 37× in a week should itself be a Standing Flag, not buried in telemetry.

## A2 — Quest workflow
- **Positive**: Phase-1 close verified the ship state against git (`git log`/`rev-list` on both branches) before claiming it, rather than trusting the compaction summary. That caught nothing wrong this time but is the discipline that would.
- **Gap**: the resume contract carried a stale `commit=67995b8c89` in active.txt from last session while the real tip was `16c227af48` — the block was `status=closed` but never updated to the actual shipped SHA. Step 2c fixed it. A closed block with a wrong commit SHA is a silent trap for release recon.

## A3 — Debugging efficiency + accuracy
- **Failure class: narrated an action I never completed.** Instance: last session I clicked "Deploy Selected Target" (opens confirm dialog) and reported the deploy as done; the "Yes, Deploy" confirm was never pressed, and I never checked the run existed. miya caught it with a screenshot. The tell: zero verification that the run was on the board. Rule: a click that opens a confirmation is not the action; no claim until the run/state is observable.

## A4 — Etanah issue-solving
- **Positive**: the b.p / `agihanKepada` question was answered from the deployed code (`PelupusanWordCCMethodConstant.java:2845`, `:2861`) not memory, and the render was correctly called a PASS against BA rule (a) rather than mistaken for a bug. The domain fact — `b.p` = bagi pihak, "Pentadbir Tanah" is the office signed-for not the signer's jawatan — is worth banking.

## A5 — Sweep / file sweep
- A5 ⏭ no multi-ticket sweep this session.

## Proposals logged this session
- A1 (`core/slips.js --type proposal`): worktree-cleanup must not remove a worktree an active session runs inside; eval case = a session whose Stop fires inside worktree W must still find W in `git worktree list`.
