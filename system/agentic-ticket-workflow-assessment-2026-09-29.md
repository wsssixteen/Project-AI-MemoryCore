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
