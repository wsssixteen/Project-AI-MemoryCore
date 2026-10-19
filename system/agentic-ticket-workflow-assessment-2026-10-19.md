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
