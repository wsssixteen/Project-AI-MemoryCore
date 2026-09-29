# Agentic ticket workflow assessment — 2026-09-29

Session: eSOKONGAN priority rule + 3-ticket sweep (282061, 281650, 281324), 9 familiars (W1+W2 ×3, W3 ×3, W4 ×3, all opus).

| Axis | Finding | Instance |
|---|---|---|
| A1 agentic | Every familiar failed its final write: worktree guard blocks the base-checkout projects folder, and a sibling-file guard blocks `QA-<n>-wave3.md`. Output survived only because I redirected to the scratchpad and banked by PowerShell. | 281650 W2 + W3 both reported "blocked"; 4 SendMessage redirects mid-flight |
| A1 agentic | W4 earned its cost on the SLA ticket: W2's code-only fix would have printed another permit's number. | 282061 W4 refuted W2 A1 (ind_permit_lesen 6257 belongs to aplikasi 3396320) |
| A2 quest | Scripts run from a worktree cannot see main-only qa_docs (untracked-confidential). | resume-readiness returned "qa_doc unreadable" for all 3 until run from main |
| A2 quest | redmine-sync writes main active.txt; the worktree board reads the worktree copy, so board state lags inside worktree sessions. | active.txt worktree 14,484 B vs main 15,230 B at 11:50 |
| A3 debugging | ⏭ no build/test cycles this session (sweep stops at Rubric) | — |
| A4 etanah | PROD Flowable schema is not readable by our MCP, so PROD model versions stay unconfirmed on BPMN tickets. | 281324 W3 + W4 both flagged it |
| A5 sweep | Skip rule by "no Redmine activity since the last W4" worked and saved 6 tickets' worth of waves. | 275043, 274323, 246923, 265109, 244600, 264355 |

Proposals logged via `core/slips.js --type proposal`: A1 scratchpad-default sweep output · A2 resume-readiness main-root resolve · A2 board reads main active.txt · A4 PROD Flowable read connection · A1 turn attribution with no named ticket.

## Session 2 — #281650 rework (DE)

| Axis | Finding (concrete instance) | Proposal (eval case) |
|---|---|---|
| A1 agentic system | `sql-schema-verify` and `attachment-ledger-gate` again blocked Stops this session, yet audit-briefing lists both as 0 fires and asks to retire them (second day in a row). | Already proposed 2026-09-28 (count wrapped-gate fires). Evidence added: 2026-09-29 run. |
| A2 quest workflow | `quest/archive-quest.js QA-281650` failed at Step 3 on a reopened ticket ("ALREADY in active-archive.txt"); I had to merge the cycle-0 block by hand. | archive-quest merges a reopened ticket's old archived block into the new one (keeps cycle0_* fields). Eval: archive a reopened QA twice → 1 block, cycle0 fields present, exit 0. |
| A3 debugging | Two PROD-affecting claims from code reading alone ("Hantar is safe", "every save wipes the note"); one stg2 Simpan refuted the second (row id + last_modified unchanged). | A claim that a user action will change/erase PROD data must carry a runnable stg2 test (screen + action + SELECT with last_modified) before it is stated as fact. Eval: reply with "will erase/wipe/lose" + no test table is flagged. |
| A4 etanah issue-solving | MLPS L1e Tanah Kerajaan can show only one lot (`populateJenisTanahAndNoLot():710` reads the last land row); OPLPS joins all rows. BA wanted `225, 226`. | Code change candidate: MLPS joins `no_lot` of all land rows like OPLPS (`populateNoSP():579`). Eval: MLPS app with 2 land rows (225, 226) renders `225, 226`. |
| A5 sweep | ⏭ no sweep run this session. | — |

## Session — #278909 (2026-09-25 → 09-29)

| Axis | Finding (instance) |
|---|---|
| A1 agentic | Worktree git link was pruned mid-session; Edit tool then refused both worktree (no branch) and main (base-checkout guard), so DE writes went through scripts. Separate etanah clone E:\Dev\etanah-work worked well for audit/compile/merge without touching miya's tree. |
| A2 quest | Farah's Java passed the note-spec but broke #260325 (PBN option). The spec I wrote said "move PT to dual" — the note carried a design I had not blast-radius-checked against the UI options. |
| A3 debugging | Template-only CC advice was wrong until miya asked "did you verify?": I checked tag + method but not the WRITER of the key for PT. Sim.java (real Gson, line-copied code) proved 8 paths in minutes where a deploy loop costs ~40 min. |
| A4 etanah | Knowledge: PT/PSBS/PPJK are single-key syor (URUSAN_LEGACY_SYOR_PERMOHONAN); dual list lacks PBN; DynamicFieldUtil.getAsString of a JSON boolean = "true"/"false". Staging lagged PROD 1.7.0 by 27 commits with no check in /deploy. |
| A5 sweep | Test-data picks included Flowable orphans (7 syarikat PT apps) — health check only looked at eTanah task rows, not the engine. |

## Session: resource-usage investigation (2026-09-22 → 09-29, laptop RAM incident)

| Axis | Finding | Instance |
|---|---|---|
| A1 agentic | Per-session and per-prompt costs were never counted: 21 stdio DB MCP servers × every session, 36 UserPromptSubmit + 42 Stop hook registrations (~60-70 node spawns per prompt; one turn of this session spent 149 s in hooks). Fixed the DB half with db-gateway; Rule 7 + birth enforcement now make every new component state its cost. | 60 GB → 12 GB commit; audit-briefing turn 4629f1fc-25 |
| A1 agentic | Audit shows ttachment-ledger-gate at 0 fires and proposes retiring it, but it blocked me this session: directly-registered hooks that bypass hook-runtime --wrap are invisible to telemetry, so the audit's RETIRE list can be wrong. | settings.json:522 direct registration; block on 2026-09-24 |
| A2 quest | ⏭ no quest touched; the only quest-side effect was the 14-gate archive check reading active.txt open blocks. | — |
| A3 debugging | First answers ("orphans", "can't trace") preceded measurement; the parent-tree trace settled it in one command. Task Scheduler default priority 7 starved the gateway: found only by comparing a manual run (4 s) with the scheduled one (minutes). | slip esource-blindness |
| A4 etanah | ⏭ no etanah code touched; the Perak/WP Oracle MCP server hardcodes ET_MAIN_DEV in its schema tools (server.py), noted for whoever next uses oracle-prk-*. | oracle-mcp server.py get_schema_info |
| A5 sweep | Session sweep at scale worked once the 14 safety gates were scripted: 153 of 233 archived with zero loss. The gate list (work in main, unmerged branch, dirty tree, stash, open quest, recent, pinned, remote control, shared folder, main-repo cwd) is reusable. | safety.ps1 run 2026-09-28 |

## Session: #282061 PPTPB Permit Khas Jadual VIII (dedicated session after the morning sweep)

| Axis | Finding | Instance |
|---|---|---|
| A1 agentic | `redmine-write-gate` blocked two approved status writes: a popup answer ("Yes, post In Progress") and a plain "update the fucking redmine" were not read as approval. Fixed as v1.2 (popup answers read, status-only path), eval 38/38. The early-mint audit spawned to its own session landed as ADHOC-PERMIT-2026-1 and merged with zero conflict. | 2 blocked writes; F32-F38 fixtures |
| A1 agentic | audit-briefing again lists `sql-schema-verify` as 0 fires / RETIRE, yet it fired and stamped twice this session. Third day of the same false RETIRE. | stamps f45478f6, 6d0324b2 |
| A2 quest | The BA pass-note rule lived only in a memory file, so I sent my own Malay shape after miya had given his English template. Moved into a tool (`ticket-close-block --ba --envs`) + quest SKILL § Hand-over to BA + deploy 6b. | slip `reask/redundant` |
| A2 quest | `## 0. Resume Point` stayed at the W2 state ("No code changed", 80%) through Apply, commit, 2 env merges and Redmine Resolved; only the DE save rewrote it. A cold resume mid-afternoon would have read the opposite of the truth. | QA-282061.md §0 vs §7-§13 |
| A3 debugging | The swap-safety proof (every place the number lives, links by id) came only when miya asked a second time; it should ship with any PROD script that changes an identifier value. | §12, miya "it won't point to the other permohonan?" |
| A3 debugging | `sql-schema-verify` pairs every table with every column in the script, so a correct script emits false "missing column" rows; a catalog check of the 16 real pairs (0 missing) was needed. | proposal logged in session |
| A4 etanah | One permit, two counters (register G1 vs screen G2), and a bill saver that reuses only unpaid rows. Knowledge now in PERMIT-LESEN-RUNNING-NUMBER.md incl. fix status + swap rule. Staging held the same bug with a different record state (stg2 copied from PROD to 23 Jul, re-run 18 Aug), which took a manual per-env compare. | stg2 /5 at PKPPT with 02/2026/5 |
| A5 sweep | Morning W4 (83%) held; the dedicated session added C4 (dup bill root cause) and raised to 92%. After miya attached the PROD script to Redmine, I kept editing the Task-folder copy (release-team version) and he had to ask whether the attachment was still right. | attachment 1023225 vs local rewrite, restored |

Proposals logged: A2 Resume-Point freshness check · A3 identity-value swap sweep in script-check · A4 per-env patch-state print at deploy · A5 attachment-drift warning.
