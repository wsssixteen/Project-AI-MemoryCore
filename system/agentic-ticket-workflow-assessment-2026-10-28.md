# Agentic ticket-workflow assessment — 2026-10-28 (session "PymTime attendance scheduler planning", revival day)

> DE step 7.5. One concrete instance per claim. Proposals logged with `core/slips.js --type proposal`; they surface in `system/slip-dashboard.md` under Open proposals for the weekly audit.

| Axis | Assessment (instance) | Proposal (eval case) |
|---|---|---|
| A1 agentic system | `list_sessions` with `include_archived` at 200 rows returned 109 KB, over the tool's token limit; the answer had to be parsed from the saved file with PowerShell, and the session he meant ("PymTime attendance scheduler planning") turned out to be this one, found only by grepping its id out of my own transcript. A session finder is a repeated need (2026-10-27 the session-naming session, 2026-10-28 five PymTime sessions). | `lib/sessions.js find <words>` reads the app's session index and prints id · title · archived · branch · commits off main. Eval: `find "weekly plan"` returns the 2 titled sessions and no others. |
| A1 agentic system | Reviving a session = a handover (memory `feedback_session_revive_handover`, written 2026-10-27 after his correction). Today the rule held by judgment: 5 sends, each with both misrouted messages verbatim. Nothing mechanical checks it. | PreToolUse on `send_message` / `SendMessage`: when the target was archived or idle over 3 days and the body has no `HANDOVER` block with the day's cross-session messages, warn with the list of messages received today. Eval: a bare "/remote-control" body to a 7-day-idle session → warn; the full handover → pass. |
| A2 quest workflow | DE step 12.6 (resume-readiness) lists gaps in 9 quests (ADHOC-PRU-2026-3, ADHOC-PLP-2026-4, ADHOC-PT-2026-14, ADHOC-PSBS-2026-1, QA-262027, ADHOC-PRU-2026-4, ADHOC-PRU-2026-5, QA-286650, QA-279554) and one unreadable qa_doc (QA-284169) although this session touched no quest; the step says "fill before close", but the owner sessions ran their own DE earlier today and closed. | `resume-readiness.js --touched` scopes the fill-before-close rule to quests in this session's touched list and prints the rest as one standing line. Eval: a session with 0 touched quests prints "0 touched · N standing gaps (owners: …)" and exits 0. |
| A3 debugging | `memory-write-gate` blocked the memory Write 3 times on 2026-10-27: streamed assistant text is not in the transcript when the hook runs, `Write-Output "RULE-PLACEMENT…"` fails the line-start regex, and a same-message shell + Write races the transcript. 3 turns to land one file. | The gate also accepts the placement inside the file being written (frontmatter `placement: file=… · workflow=… · step=… · enforced-by=… · memory-because=…`). Eval: a Write whose content carries the frontmatter line passes with no transcript line; a Write with neither still blocks. |
| A4 etanah issue-solving | ⏭ no etanah work this session (PymTime and session management only). | — |
| A5 sweep / file sweep | The shared main-checkout index held 377 staged OneDrive conflict copies (127 telemetry shards = 6,039 MB, `domain/quest-objective-anchor` 123 MB) staged by an earlier session's `git add -A`; the ignore rule was widened after, but the index kept them. A DE commit here would have pushed 6 GB. | DE step 10 pre-commit check in `lib/commit-guard.js`: sum of staged file sizes over 50 MB or any `-miyazaki-NN` / `-PJNBRidhwan-NN` path staged → block with the list and the `git reset` line. Eval: stage a 100 MB temp file → block; normal staging → pass. |

**Not working this session**: nothing broke that was mine; the audit briefing (step 7.4) is the 2026-10-27 17:32 run, cached (3 registered hooks with 0 fires, 7 failing evals, 91 overdue watches, boot 22 s).

# Improvement sweep — 2026-10-28 (worktree ticket-286650-quest-188daf, 286650)

| Axis | Finding (instance) | Proposal logged |
|---|---|---|
| A1 agentic system | `lib/audit-briefing.js` run from this worktree printed "0 hook fires · 0 turns" and listed every hook as never fired: it read the worktree's empty telemetry | yes: resolve the main root |
| A2 quest workflow | 286650 was handed to Pendaftaran on Redmine but its block stayed `status=active` until DE's save-quest said KEEP-DELEGATED | yes: set delegated at hand-over |
| A3 debugging | the deciding fact for 286650 was a date (pendaftaran build 14/10), found late, after a data trace; two earlier empty cases had not crashed | yes: deploy-date check first |
| A4 etanah | OTHER-MODULES.md has no build dates for etanah-pendaftaran | yes: dated build list per other module |
| A5 sweep | ⏭ no multi-ticket sweep ran in this session | — |

# Improvement sweep — 2026-10-28 (worktree protime-weekly-plan-changes-d89526, ProTime weekly plan)

| Axis | Instance this session | Verdict | Proposal |
|---|---|---|---|
| A1 agentic system | `node lib/audit-briefing.js --days 7` run from the worktree printed "0 hook fires · 0 turns" and listed every registered hook as never fired: telemetry lives only in the MAIN checkout | false NOT WORKING list; re-run from main; 2nd instance today (the 286650 session found it too) | audit-briefing resolves telemetry from the main checkout, or refuses with one line when it reads 0 turns (logged, eval case named) |
| A1 agentic system | night run sees only adhocs saved as blocks; asks he never saved as adhoc appear only via `--sessions` | gap, open since 2026-10-14 | night run lists the day's untitled asks in its toast + log notes (logged, eval case named) |
| A2 quest workflow | ⏭ no ticket worked in the revive; ProTime plan work is not a quest | — | — |
| A3 debugging | ⏭ no debugging this session (revive only) | — | — |
| A4 etanah | ⏭ no etanah work | — | — |
| A5 sweep | ⏭ no sweep run | — | — |
