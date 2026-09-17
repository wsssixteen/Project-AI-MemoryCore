# Agentic / Ticket-Workflow Assessment — 2026-09-17

Session: /goal — retrieve 4 eSOKONGAN tickets → full sweep (W1–W4) → save → audit → DE. Solo autonomous.

## A1 — Agentic system

- **Worked**: 16-familiar 4-wave sweep, tiered (sonnet W1–W3, opus W4). The blind→audit split paid off twice (see A3). Resume-not-rerun not needed (no crash). orchestration-mode flag suppressed 6 reply-format gates (61 rows logged — observability clean).
- **Wasteful (instance)**: controller-wait turns carried very heavy hook overhead — `audit-briefing` shows turn `11de7ca5-1` = 124 s hooks / 24 tools / 615 fires; turn `-5` = 94 s / 4 tools / 562 fires. The Phase-0 register-injection hooks (adhoc-register, latent-bugs, objective-lock, codemap-recon-consult) fired in full on every controller turn even though the controller was only monitoring background agents, not investigating a ticket itself. orchestration-mode suppresses reply-format gates but NOT these register injections. → proposal P1.

## A2 — Quest workflow

- **Worked**: the `codegraph-back-gate` (git-history) correctly forced the existing-fix / regression probe before I concluded — caught nothing (clean), but the discipline is right. Phase-0 sweep produced 4 verdicts each with file:line + DB proof + working analog + confidence%.
- Nothing let through this session.

## A3 — Debugging efficiency + accuracy

- **Blind + audit validated, measurably**: W4 (opus, adversarial) caught a real W2 error on #280132 — W2 said the ELSE-branch getters (`:153-154`) were already correct; W4 proved they must flip once `:150` becomes the forward finder. And W4 upgraded #280166 from inference to DB-proof by running the `ACT_RU_VARIABLE` query both prior waves flagged-but-skipped. Fresh-eyes-beats-self-checking holds again.
- **BA hypothesis correctly falsified** (#280191): BA blamed "Butir-butir lanjut"; the fleet proved that field is `keteranganLain` (no numeric parse) and the real culprit is `getNomborLot()`. Multi-dim evidence (image + code) did its job.

## A4 — Etanah issue-solving

- **Cross-module scope caught** (#280166): fix lives in etanah-common / etanah-uam, not etanah-pelupusan; flagged NOT-locally-testable + a #267621 Redmine gate. No wasted pelupusan "fix" that could never fire (the QA-262755 trap avoided).
- **Data-vs-code adjudicated honestly** (#280176): refuted the code+data proposal — the null-date row is a hollow migration orphan with zero app links; a blind date-patch would invent business data #279882 declined to invent. Code-only is the correct minimal fix.

## A5 — Sweep / file-sweep

- **Worked**: `/sweep` ran the full ladder end-to-end unattended; all 12 artifacts landed; each qa_doc got a cold-resume `## 0. RESUME POINT`.
- **Mechanical gap (instance)**: the sweep writes qa_docs into the WORKTREE's `projects/` tree, which is gitignored (untracked-confidential). A worktree even with origin/main is auto-reaped at next boot, taking the untracked qa_docs with it. Nothing in `/sweep` or DE Step 2c mechanically copies untracked worktree qa_docs into the main checkout — I caught it only because the git-status change-manifest was suspiciously empty. → proposal P2. This is the same family as the 2026-08-06 "qa_doc never written at close" hole, one layer down: written but stranded.

## Proposals logged (weekly-audit feed)

- **P1 (A1)**: extend orchestration-mode suppression to the Phase-0 register-injection hooks (adhoc-register / latent-bugs / objective-lock / codemap-recon-consult) during a sweep CONTROLLER turn (background-agent monitoring, no ticket investigation in the main loop). Eval: measure controller-turn hook time on a sweep before/after — target <20 s from the current 90–124 s.
- **P2 (A5)**: a deterministic DE/sweep step (or `de-close-gate` check) that detects qa_docs written under a worktree's gitignored `projects/coding-projects/active/` and copies them into the main checkout before the worktree can be reaped — or blocks close until synced. Eval: run a sweep in a fresh worktree, assert the 4 qa_docs exist in the MAIN checkout at DE close, not only in the worktree.
