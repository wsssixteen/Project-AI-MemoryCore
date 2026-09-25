# Agentic ticket workflow — assessment 2026-09-25

Session: bulk-ticket /goal → quest sweep `wf_bb588f6c-e2c` (6 tickets, 18 agents, 3.79M subagent tokens) → DE. Worktree `perak-ticket-deploy-7541e4`.

## 7.4 rulings (mine)

| Audit row | Ruling | Evidence |
|---|---|---|
| RETIRE? `attachment-ledger-gate` (0 fires in 7 d) | **Do not retire — it is unobservable, not dead.** | It BLOCKED this session's first reply (3 un-ledgered 274266 screenshots). The 0 comes from telemetry, not from the gate. Proposal P4. |
| `RecursiveLoopDetector` 435 s / 0 blocks | Supports redesign | Fired 2 false alarms today: the same PowerShell shape across different tickets read as a loop. |
| 77 goal-lens prompts pending | Carried to the next DE | This DE's budget went to the sweep save. |

## Failure classes seen (each with its instance)

| # | Axis | Class | Instance |
|---|---|---|---|
| F1 | A5 sweep | Familiar outputs refused at the designated path and written elsewhere, with nothing bringing them home | 14/18 outputs of `wf_bb588f6c-e2c` landed in the worktree copy or scratch. The 2026-09-21 Recon docs for 5 tickets stranded the same way in `redmine-tickets-list-aa3908`. |
| F2 | A2 quest | Wave N+1 reads the designated path, not the path wave N actually wrote | W4 reported "Wave 3 missing" for 274266, 265109, 246923, 275043 although each W3 had finished. |
| F3 | A1 agentic | A "have we done X" answer from one folder | Told miya "none swept". The docs existed in a worktree, and `main/current-session.md` HANDOVER listed them. Slip `boot-read-skipped`. |
| F4 | A3 debugging | Triage verdict without the knowledge lookup | Morning triage said the 274266 role comes only from the BPMN. `FLOWABLE-KNOWLEDGE.md:395` already recorded that `ind_tgsn.peranan` overrides it (QA-270900). |
| F5 | A4 etanah | Fix lives only on int-env while BA tests elsewhere | 265109 `67dda807e2` is on int-env only (no ticket branch). 244600 and 275043 fixes are int-env only. 274266's letter fix is int-env only. |
| F6 | A1 agentic | Telemetry blind spot drives a wrong RETIRE suggestion | `attachment-ledger-gate` shown as 0 fires while it blocked this session. |

## What worked

- The blind W3 + adversarial W4 overturned three inherited claims: the 274266 cause, the 265109 cause, and the 275043 "85% verify only".
- Controller spot checks against mlit confirmed each headline row: `ind_tgsn` roles, `hsl_fi_kadar` bands, `skg_dok` version rows.

## Proposals (logged via core/slips.js --type proposal)

| # | Axis | Idea | Eval case |
|---|---|---|---|
| P1 | A5 | The sweep script passes each wave's returned `file_written` to the next wave, and a controller consolidation step brings redirected files into the main quest doc before W4 | Re-run a one-ticket sweep from a worktree. The main quest doc has sections 1-4, and W4's relation is never "W3 missing". |
| P2 | A1 | Boot strand detector: list `QA-*.md` present under any `.claude/worktrees/*/projects/coding-projects/active` and absent in main | Before today's salvage it would have listed the 5 stranded 2026-09-21 docs. |
| P3 | A3 | Triage reads the qa_doc (main + worktrees) and greps etanah-knowledge for the tables named in a verdict before stating a confidence | The 274266 morning claim meets `FLOWABLE-KNOWLEDGE.md:395` before it is sent. |
| P4 | A1 | Wrap bare-registered hooks for telemetry before any RETIRE ruling | `attachment-ledger-gate` shows at least 1 fire for 2026-09-25. |
| P5 | A4 | Triage adds a branch-presence column (master / int-env / stag-env) for every ticket commit | 265109 shows `67dda807e2` as int-env only. |

## Session 2 addendum — #281656 (PRBB resit kaunter, PROD data patch + alter)

| Axis | Assessment (instance) | Proposal logged |
|---|---|---|
| A1 agentic system | audit-briefing says `sql-schema-verify` 0 fires, yet it blocked this session's Stop on `281656.sql` → Stop-bundle fires missing from the fire log | A1 telemetry proposal |
| A2 quest workflow | worktree-isolation hook blocked Write to the main-repo QA doc (gitignored, main-only) → worktree copy + Copy-Item at close | A2 allow gitignored projects/ |
| A3 debugging | redmine-write-gate blocked read-only `ticket-load-verify.js`; fell back to reading synced files by hand | A3 READ_ONLY_SCRIPT add |
| A4 etanah solving | receipt → btrn → fi → aplikasi trace settled the ticket in 3 SELECTs; caught 2 BA data errors; sibling + writer code confirmed patch shape | A4 daily manual-PRBB-payment detector |
| A5 sweep | ⏭ no file/ticket sweep this session | — |
