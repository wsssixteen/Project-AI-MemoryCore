# Agentic ticket workflow assessment — 2026-09-30

## Session — #281324 resume + weekly planner (redmine-tickets-triage worktree, part 2)

| Axis | Finding | Instance |
|---|---|---|
| A1 agentic | redmine-write-gate blocked a pure read three times because the command or script mentioned a field name; the allow-list only knows 5 scripts by name. Proposal logged. | planner read 2026-09-30 |
| A2 quest | The hand-back format for a ticket miya already understands should be his steps as one table; the full quest emit (J-table, reconcile, YOUR MOVE, 7 SELECTs) buried a 2-job fix. Slip reask/verbose. | #281324 2026-09-29 evening |
| A3 debugging | Blind re-check on the live engine instead of the knowledge copy caught that the knowledge BPMN is not byte-identical to staging v2 and that PB could mean Pos Berdaftar; act_hi_varinst settled the value space in one query. | #281324 J2 |
| A4 etanah | A variable read by a shared sub-flow gateway with no writer is fixed in the CHILD as a Data Object, because every caller starts the latest child by key. Banked as FLOWABLE-KNOWLEDGE §14. | #281324 |
| A5 sweep | ⏭ no sweep run this session. | — |


## Session 2 (deploy triage) — 2026-09-30 13:50

| Axis | Assessment (instance) |
|---|---|
| A1 agentic system | Chrome session reuse beat the login wall: the built-in pane hit Keycloak, miya's Chrome read the full 1.6 MB log via the console's own JSON API in one call. Cost: 3 gate blocks (design-consult, predicate-box false positive on a MemoryCore edit, attempt-before-blocked) on a non-code session. |
| A2 quest workflow | ⏭ no quest touched (env deploy of mlk/int-env). |
| A3 debugging | Good: first-red-step + log tail settled owner in 2 fetches. Slip: 'Nick probably changed the stop script' asserted without evidence (assume-not-verify); fixed by diffing console build time + both prepare outputs. Proposal logged. |
| A4 etanah issue-solving | New known failure recorded (fudge1 prepare exit 137, retry passes when JBoss already down) in deploy skill §8. Proposal: deploy-run triage script. |
| A5 sweep | ⏭ no sweep this session. |

## Session: Baseline 1.7.0 (2026-09-28 → 30, melaka-release-baseline worktree)

| Axis | Assessment (instance) | Proposal logged |
|---|---|---|
| A1 agentic system | Hand-off card lacked SQL/flowable/Sheet; flowable drop landed in Perak/, unverified though WinSCP.com + stored session existed on the laptop | flowable drop listing gate |
| A2 quest/release workflow | Direct-to-master #280993 broke compile; only caught because miya asked for an audit | compile-master preflight in `branch` |
| A3 debugging | Missing PTBUT row traced correctly (bpm_log delay + ID block) but took ~30 queries | missing-tugasan-row triage script |
| A4 etanah issue-solving | BA wanted login + ID; test table came 3 asks late | intake reminder: test table first |
| A5 sweep | ⏭ no sweep run this session | — |

## Session 3 addendum (melaka-internal-deploy, 15:30)

| Axis | Finding (instance) | Proposal |
|---|---|---|
| A1 agentic system | 3 gates misfired on non-ticket work: test-scenario-login-gate ×3 (deploy/triage, no ticket) · sql-schema-verify on READ-only files + refuses unqualified scripts · design-consult-gate ignored an in-message skip token and forced two skill loads for a 1-section doc addition | 2 proposals logged (login-gate silent without ticket · sql-schema-verify read-vs-write + unqualified) |
| A2 quest workflow | ADHOC-VIEW-2026-1 block said "miya runs CREATE Mon 09-28"; live catalog showed no view on any env — active.txt state rots without a check | covered by existing resume-readiness sweep |
| A3 debugging | Top-down log read found the first failure (antrun zip) under a misleading last line; ps check found the concurrent run in one step | deploy skill §7 entry added |
| A4 etanah | Answered a data question from the view definition before querying data (flag_permit) — slip claim-before-data | knowledge: PERMIT-LESEN status never flips on expiry |
| A5 sweep | deploy card lacks a pre-run concurrency check for shared mirage1 | proposal logged |
