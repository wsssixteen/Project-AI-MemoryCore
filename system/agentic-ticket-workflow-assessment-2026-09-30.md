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

## Session 5 — ADHOC-PERMIT-2026-1 (main checkout, 15:30)

| Axis | Assessment (concrete instance) |
|---|---|
| A1 agentic system | A structural rule changed mid-day (Task folder v13 retired notes txt) but `lib/adhoc-save-audit.js` still demanded `1. <ID>.txt`, so the audit FAILED on a correct save-set. Fixed in the tool + eval (21/21), not by writing the retired file. |
| A2 quest workflow | "Bug awareness" had no row in the DE Step 7 routing table, so a verified no-ticket bug had no obvious home. Added the row (LATENT-BUGS.md) + "index.md is the router" row. |
| A3 debugging | Counter census (every `sis_no_turutan` number matched to its app's tugasan history) proved completeness: 62/62 accounted for, no guessing. Banked in PERMIT-LESEN-RUNNING-NUMBER.md. |
| A4 etanah | One shared screen (skrin 338) causes the whole early-mint family; PPJK + PSBS are latent (L16/L17) and share a one-line guard at `MlkPengiraanBayaranLesenForm.java:647`. |
| A5 sweep | The family sweep was manual this time (code callers × ind_langkah × BPMN × counters). It is repeatable per release but nothing re-runs it. |

## Session 5 round 2 — "do it all" (15:45)

| Axis | Assessment (concrete instance) |
|---|---|
| A1 | audit-briefing flagged 4 hooks "never fired, RETIRE?"; 2 had fired the same morning into their own `log.jsonl` (unwrapped, invisible to telemetry), 2 only fire on Agent spawns. Retiring on that count would have removed the PROD-SQL schema check. Fixed the classifier + wrapped both hooks. |
| A2 | An internal-save ask grew a "raise ticket" row in my own Next-steps menu, and "do it all" nearly turned it into a Redmine post. The redmine-write-gate + popup held; the menu row should never have existed. |
| A3 | ⏭ no debugging work this round |
| A4 | ⏭ no etanah change this round (L16/L17 stay internal by miya's ruling) |
| A5 | ⏭ no sweep this round |

## Session 5 round 3 (16:00)

| Axis | Assessment (concrete instance) |
|---|---|
| A1 | Next steps rows used my own labels ("rule the watches", "guards at line 647"); miya could not act on them. Now enforced by a Stop check (next-steps-shape, eval 8/8) plus the injector column. |
| A2 | `active-cli archive` moved the qa_doc folder but left the block pointing at `active/`, so the adhoc audit failed on a correct close. Fixed in the tool (qa_doc repoint). |
| A3 | ⏭ no debugging this round |
| A4 | "Earliest tugasan" answered from data already banked (ind_langkah x BPMN) in one reply; written back to PERMIT-LESEN + L16/L17 |
| A5 | ⏭ no sweep this round |
