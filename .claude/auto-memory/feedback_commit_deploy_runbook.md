---
name: feedback-commit-deploy-runbook
description: "The exact one-pass etanah commit+deploy ceremony — do these steps IN ORDER, each in its OWN tool call, so no gate blocks twice"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3d5bb754-364e-4482-ba29-220b2ea74311
  modified: 2026-08-21T03:13:08.856Z
---

🚨 One-pass etanah COMMIT + DEPLOY ceremony (order is the whole rule):

1. Ensure `quest/active.txt` has the ticket's block with `status=active` + `local_test_confirmed=true` (miya saying "local test passed" = set it NOW).
2. Show miya staged diff + verbatim commit message → he approves.
3. Write `.claude/state/commit-approved-<QA>.flag` in its OWN call (Write tool) — a flag written in the same Bash call as the commit is invisible (PreToolUse fires before the command runs).
4. `git add <files>` alone → then `git commit -m ...` alone (combined add&&commit = blocked).
5. Env branch: surface merge-vs-cherry-pick (`git log --oneline <env>..<branch>` count + what a merge drags) → put `[deploy-merge-decision: cherrypick - <count shown>]` INSIDE the cherry-pick command as a trailing `#` comment (hook v2 accepts it in-command).
6. Cherry-pick onto env branch (master-based branch merge into int-env drags the release train — cherry-pick is the norm, ref #276504 twice). Needs a fresh (<3h) green compile marker — `node domain/compile-gate/compile-check.js run <module>` — enforced by deploy-merge-surface v3.
7. The deploy card ALWAYS carries the Test Scenario table (| Login | Screen | Do | Expect |, real login) directly under the steps — enforced by test-scenario-login-gate v2 (miya 2026-08-21: "prepare a test scenario right after the deploy steps").

**Why:** QA-276504 2026-08-21 — 6 blocked calls, miya furious ("every single time without fail"). Two hook bugs fixed same day: commit-gate v3 consumes the approval flag only after ALL checks pass; deploy-merge-surface v2 accepts the token in-command + scans last 5 messages.

**How to apply:** On any "deploy"/"commit" nod from miya, run steps 1-6 verbatim, no exploration. Related: [[feedback-ba-test-deploy-int-env]].
