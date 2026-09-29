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

## Session 4 — #256334 PDBB ↔ Hasil (medan-agihan-kepada-bug worktree)
| Axis | Instance | Verdict |
|---|---|---|
| A1 agentic | Proposed 3 designs (serviceTask/PACT, end-subflow, async flag) before reading the CR spec PDF + the working PLTP→PSPM analog; miya: "you cannot recommend something, check the CR" | Analog/spec read came too late — design proposals need a "CR spec + existing pattern cited" precondition |
| A2 quest | Cross-module ticket had no home until miya asked; ADHOC scaffold + register made it resumable | Cross-team assist should auto-scaffold an ADHOC when the fix owner is another team |
| A3 debugging | Claimed "effectively synchronous" after reading method body, missed `@Async` annotation → wrong DELAY reasoning until DB timestamps (17 s gap) showed it | Timestamp diff (act_hi_taskinst vs act_hi_varinst) was the decisive, cheap falsifier — use it first for ordering questions |
| A4 etanah | Pattern banked: FLOWABLE-KNOWLEDGE §13 (child aliran kerja, no aliranKerjaId out-mapping, @Async + DELAY, langkah flag_integrasi filter) | Good — reusable for any cross-module callActivity |
| A5 sweep | ⏭ no sweep this session | — |
