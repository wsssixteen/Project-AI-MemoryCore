# Agentic ticket workflow — assessment 2026-10-19

Session: worktree `esokongon-285532-quest-2c4d87` · one ticket, eSOKONGAN #285532 (PRBB Ganti Hari), run to Rubric and held.

| Axis | What held | What did not | Instance | Proposal |
|---|---|---|---|---|
| A1 agentic system | Audit briefing from the main checkout gave real data (6.5M fires, 622 turns) | The same command run in the worktree reported 0 fires and every hook "never fired" | `node lib/audit-briefing.js --days 7` in the worktree vs main, 2026-10-19 06:45 / 06:48 | A1: read main's logs from a worktree |
| A2 quest workflow | `redmine_claim=off` stopped the one automatic Redmine write; `quest-start-claim --result` printed "nothing sent" | No per-ticket switch blocks ALL Redmine writes (prefill, close block, write gate) when miya says the ticket is not ours | #285532, miya: "DO NOT UPDATE REDMINE. IT IS NOT UNDER OUR NAME." | A2: `redmine_writes=off` honoured by every write path |
| A3 debugging | Cause found in under 15 tool calls: grep the field name, read the method, grep the -1 idiom for the sibling | predicate-box Stop hook blocked a reply as if an etanah file had been edited, when only reads happened | Stop block after the first hand-back, 2026-10-19 | A3: count only Edit/Write calls |
| A4 etanah solving | Working analog (inclusive end date, 4 siblings) settled the fix shape with no BA question | The common date tag's view-mode `rendered` gap was not in the knowledge base; banked today in JSF-WIRING | etanah-common `inputDateTime.xhtml:112-124` | A4: sweep for other paired date tags on view-only pages |
| A5 sweep | ⏭ no multi-ticket or file sweep ran this session | — | — | — |

The 4 proposals are rows in `system/slips.jsonl` (type proposal, 2026-10-19T06:49Z), each with its eval case.

## Session melaka-permit-patch-b856f7 (2026-10-19 afternoon)

| Axis | Instance this session | What it shows |
|---|---|---|
| A1 agentic system | The audit briefing reported "0 turns, 2 hooks seen" and listed pre-reply-contract as never fired, while it fired on every prompt of this session | Hook-fire telemetry in a worktree does not reach the file the briefing reads; the NOT WORKING list is mostly false here |
| A1 agentic system | Redmine submit needed 3 extra messages after "update the redmine ticket" (proceed, close-tab-once-submitted, submit it) | An approval gate keyed on a few exact phrases costs him turns; fixed by a wider go-word set (eval 90/90) |
| A2 quest workflow | Ticket branch made before /quest start on #285252; miya asked "do you need to run quest first" | A promoted adhoc skips Phase 0 unless a gate says so; Phase 0 then found A1 met only half of the BA ask |
| A3 debugging | "sama macam PPTP, PLTP" resolved by one Sonnet trace + my line-by-line check (6 cites, all held) | A BA analog phrase is a direct pointer to the working sibling; tracing it first would have saved A1 |
| A4 etanah | Permit end date in 3 tables, each screen reads a different one (pelupusan versi.trkh_tamat first, AWAM umm.trkh_akhir) | Explains why a single-table patch "x jadi" |
| A5 sweep | Board vs open adhocs: 2 of 5 tickets were already worked as adhocs; found only because miya asked | The board script does not cross-match adhoc register rows |
## Session mlit-updates-failing-b8e56d (adhoc ADHOC-PLBP-2026-1)

| Axis | What held | What did not | Instance | Proposal |
|---|---|---|---|---|
| A1 agentic system | Brief first, then a sonnet background agent wrote the save-set; its 30/30 audit matched my own re-run | Audit briefing in the worktree again read 0 fires (second instance of session 1's A1 row) | `node lib/audit-briefing.js --days 7`, 2026-10-19 16:3x | A1 (duplicate instance logged; rule with session 1's row) |
| A2 quest workflow | Transcript search found the morning session that already ran the 18/10 patch | That session patched live MLIT and never wrote it into the open adhoc, so the block and register still said 08/10 | ADHOC-PLBP-2026-1, session "Adhoc 19/10/2026" | A2: a DB write on an id an open adhoc names asks for that adhoc's save |
| A3 debugging | The live DB answered first (18/10 already in place), which reframed the question before any theory | Reading the old MLIT DB to test the "wrong database" cause was refused at the credential lookup | permission classifier, 2026-10-19 | ⏭ needs miya's ruling on old-DB access, not a build |
| A4 etanah solving | Reading the handy script line by line answered "missing permohonan ID?" exactly: 2 of 3 updates use it | The script pins its 3 updates on different anchors, so a wrong ID gives a confusing 0/0/1 | `PERMIT-LESEN-RUNNING-NUMBER.md:171-184` | A4: pin all 3 on one anchor |
| A5 sweep | ⏭ no sweep ran this session | — | — | — |

The 3 proposals of session 2 are rows in `system/slips.jsonl` (type proposal, 2026-10-19), each with its eval case.

## Session borang-4ae-pdt-jasin-stamp (#284544)
| Axis | Instance | Verdict |
|---|---|---|
| A1 agentic system | stg1 used after the ban, then offered again; now a hook guards the OFF staging schema (17 blocks in 7 d) | fixed mechanically |
| A2 quest workflow | PROD alter question answered from staging rows; caught by miya | proposal logged (PROD-claim needs a PROD read) |
| A3 debugging | the cop clash was reproduced only by 20,000 local signings; counts replaced "only sometimes" (11 of 36) | Pena proven module holds |
| A4 etanah | sub-process task needs Init & Alter, not Alter | proposal logged (knowledge row) |
| A5 sweep | DB gateway down killed all MCP DB links; psycopg2 fallback hand-written | proposal logged (helper) |
