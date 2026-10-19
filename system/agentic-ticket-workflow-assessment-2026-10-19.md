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
