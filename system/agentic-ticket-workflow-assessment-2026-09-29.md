# Agentic ticket workflow assessment — 2026-09-29 (DE, #281650 rework)

| Axis | Finding (concrete instance) | Proposal (eval case) |
|---|---|---|
| A1 agentic system | `sql-schema-verify` and `attachment-ledger-gate` again blocked Stops this session, yet audit-briefing lists both as 0 fires and asks to retire them (second day in a row). | Already proposed 2026-09-28 (count wrapped-gate fires). Evidence added: 2026-09-29 run. |
| A2 quest workflow | `quest/archive-quest.js QA-281650` failed at Step 3 on a reopened ticket ("ALREADY in active-archive.txt"); I had to merge the cycle-0 block by hand. | archive-quest merges a reopened ticket's old archived block into the new one (keeps cycle0_* fields). Eval: archive a reopened QA twice → 1 block, cycle0 fields present, exit 0. |
| A3 debugging | Two PROD-affecting claims from code reading alone ("Hantar is safe", "every save wipes the note"); one stg2 Simpan refuted the second (row id + last_modified unchanged). | A claim that a user action will change/erase PROD data must carry a runnable stg2 test (screen + action + SELECT with last_modified) before it is stated as fact. Eval: reply with "will erase/wipe/lose" + no test table is flagged. |
| A4 etanah issue-solving | MLPS L1e Tanah Kerajaan can show only one lot (`populateJenisTanahAndNoLot():710` reads the last land row); OPLPS joins all rows. BA wanted `225, 226`. | Code change candidate: MLPS joins `no_lot` of all land rows like OPLPS (`populateNoSP():579`). Eval: MLPS app with 2 land rows (225, 226) renders `225, 226`. |
| A5 sweep | ⏭ no sweep run this session. | — |
