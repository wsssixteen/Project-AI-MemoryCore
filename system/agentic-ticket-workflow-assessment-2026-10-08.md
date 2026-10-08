# Agentic ticket workflow assessment — 2026-10-08 (session #279554 + Pena)

| Axis | What this session showed | The instance |
|---|---|---|
| A1 agentic system | No fan-out was used and none was needed. The whole ticket and the Feature build ran in the main loop. Gates that resolve paths from the main checkout misjudged work done in a worktree. | `design-consult-gate` looked for `domain/pena/eval.js` under the main checkout while the eval sat (and passed) in the worktree; `memory-write-gate` did not see a placement line written in the same turn, twice. |
| A2 quest workflow | A consultation ticket has no fitting path. The quest skill pushed bug-shaped checks at it. The stored shape for "table and column" answers was not loaded before the first draft. | Stop hooks asked for a Predicate Diagram, a local test prep and a test login on a ticket with no code. Entry 10 of the speech collection (#277706) held the note shape; I drafted a different one. |
| A3 debugging accuracy | Two statements went to miya before they were counted or read in code. Both were caught by him, not by me. | "Row where versi_permit_lesen_id is not empty" (one permit checked; 9 of 41 have none). "Can reuse the same number" (MLIT data only; the code gives a new number at issue). |
| A4 etanah issue-solving | Knowledge-first worked: PERMIT-LESEN-RUNNING-NUMBER.md already held the permit columns and the several-rows fact. The related earlier ticket was found late. | The first reply named #281423 as the earlier mapping ticket; #277706 (same asker, five days old) surfaced only when I opened the memory file for another reason. |
| A5 sweep / file sweep | Both attachments were opened and read at intake, but the per-file line was not emitted until a Stop hook asked. | `attachment-ledger` blocked the second reply for `279554_1.png` and `SKRIN SPOC.png`. |

## Session "batal-permohonan-patching-7b724f" (afternoon, #283980)

| Axis | What the session showed | Instance |
|---|---|---|
| A1 agentic system | No agent was spawned; the right call for a 2-id patch. One gate refused read-only commands on the words in their text. | Two PowerShell calls refused; split and re-run. |
| A2 quest workflow | A repeat patch ticket went start to close with no correction on the work, because the earlier ticket's script, infra line and posted note were reused word for word. Close and save still needed him to say them. | 283532.sql to 283980.sql; step 2d added to Domain Expansion. |
| A3 debugging accuracy | A checker reported 7 missing columns on a correct script. The script was not stamped and the reason was stated. | sql-schema-verify on 283980.sql: SYSDATE and subquery columns. |
| A4 etanah issue-solving | Knowledge-first worked: DATABASE.md section 27 and BUG-BESTIARY gave the shape before any query. The no-cancel-screen fact was reused from knowledge and said so. | Recon took 6 PROD reads. |
| A5 sweep / file sweep | Ticket had no attachments; one journal line and the description were quoted with author and role. Boot Read of main-memory was partial again. | 236 of 1027 lines. |

Proposals logged: A1 write-gate predicate · A2 save-quest check at Domain Expansion close · A3 schema checker parser · A4 batal generator · A5 main-memory trim.
