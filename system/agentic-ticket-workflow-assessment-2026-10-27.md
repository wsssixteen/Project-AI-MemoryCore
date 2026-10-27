# Agentic ticket workflow assessment — 2026-10-27 (session esokongan-ticket-selection-cad51f)

| Axis | Finding | Instance | Proposal logged |
|---|---|---|---|
| A1 agentic system | The audit briefing is blind when run from a worktree: it reads the worktree's telemetry copy, frozen at checkout | `lib/audit-briefing.js --days 7` in this worktree: "1 hooks seen", ~70 hooks "never fired", among them TurnChecklistGate and domain-expansion-trigger, which fired this session | A1 (read main's telemetry from a worktree) |
| A1 agentic system | The Redmine write gate read only the last full prompt, so approvals sent mid-turn were lost | 246964: "Go", "Submit", "send", "pass" all blocked | Fixed: gate reads queued_command, eval F91-F99 |
| A2 quest workflow | The branch state was not shown before a branch choice or an end-of-day item | 246964: offered merges without saying where 1.8.5 stood; later listed "1.8.5 into master" as a 246964 item | Deploy rule 11 (fixed); A2 (save-quest prints where the fix commit sits) |
| A3 debugging | A header part with no section reference is invisible to a text read of the template | 261986 Lulus template: header XML present, never printed | A3 (lint unreferenced headers) |
| A4 etanah issue-solving | Static label repeats what the tag already returns | 261986: "Mukim Mukim" | A4 (lint the repeat); knowledge §8 in WORD-TEMPLATE-RENDERING.md |
| A5 sweep | ⏭ no sweep or file sweep ran this session | — | — |

# Agentic ticket workflow assessment — 2026-10-27 (session esokongan-quest-sweep, 286315 + 286462)

| Axis | Assessment, with the instance | Proposal logged |
|---|---|---|
| A1 agentic system | Replies about system changes listed parts with no kind; miya could not tell a Tool from a Feature. Now blocked by `system-change-title` v2. ASCII story trees were still used to explain the hierarchy until he asked for the diagram skill. | system-change-title: want a sent picture for a 3+ box flow |
| A2 quest workflow | The 286462 hand-over note went out with a TSO report read as a BA spec and two invented Sepatutnya rows. `handover-check.js` + gate now catch both, but the clean line can be pasted without a run, and the Redmine tab is not compared with the checked draft. | stamp check · tab-vs-draft compare |
| A3 debugging | 286315: the A73 adhoc had already proven the fix; the ADHOC-REGISTER compare was skipped at Phase 0 and miya caught it. Existing rule, not a new gap. | A3 ⏭ covered by the existing ADHOC-REGISTER Phase 0 row |
| A4 etanah issue-solving | Fatin answered 286462 with Requirement #222056 in minutes; the requirement-index Tool (2083 Melaka Requirement tickets) existed and was never run before the hand-over. | run requirement-index before any Sepatutnya row |
| A5 sweep | Nothing swept this session. | A5 ⏭ no sweep run |

# Agentic ticket workflow assessment — 2026-10-27 (session surat-tawaran-missing-e1e49c)

| Axis | Assessment (concrete instance) | Proposal logged |
|---|---|---|
| A1 agentic system | `lib/audit-briefing.js` run from this worktree printed "0 hook fires · 0 turns" while hooks fired all session; the telemetry is read from the worktree, not the main checkout. | yes (A1, main-checkout telemetry) |
| A2 quest workflow | Step 6f (code fix → ask BA/TSO for a ticket) shipped as prose with a `Code-fix route:` line; nothing checks the line is emitted. | yes (A2, Stop check for the route line) |
| A3 debugging | The NPE trace went from the error-store row to `PelupusanWordEditorHelperForm.java:3494`, then `git log -L` on that line gave commit 4422003a204 (reader switched to the approved unit), then the writer. That took 3 hops and no wasted reads. ⏭ no new idea. | — |
| A4 etanah issue-solving | Root cause = a reader switched to `getUnitKuantitiDilulus()` while the only PRBB writer has `setUnitKuantitiDilulus` commented out (`PelupusanService.java:11294`); 98 permits carry the null. | yes (A4, reader-changed-field writer sweep) |
| A5 sweep / file sweep | ⏭ no sweep ran this session. | — |

## Session melaka-prod-adhoc-permohonan-f52ca5 (Melaka adhoc day, 21:30)

| Axis | Assessment | Concrete instance |
|---|---|---|
| A1 agentic system | Working memory drifts with no schedule; the audit briefing lies from a worktree | active.txt 77 blocks (25 closed, 25 stale adhocs); audit-briefing from the worktree printed "0 hook fires" |
| A2 quest workflow | Branch state was answered from git, not from the quest record | 264355: held Pelupusan branch called "missed at merge"; fixed by quest-branches.js + save item 5 (2fc2c809) |
| A3 debugging | Same root: no read of the saved record before a verdict | 264355 merge question; slip `answered-without-reading-quest-record` |
| A4 etanah issue-solving | ⏭ nothing new: the one adhoc (PT-2026-15) was a flow alter advice, saved and waiting on BA | ADHOC-PT-2026-15 |
| A5 sweep / file sweep | Session close-out relayed every peer message; plans outside todo.md are lost on archive | slip `bloated-reply`; 2026-05-28 plan file gone (todo M13) |

Proposals logged: A1 ×2, A2, A3, A5 (core/slips.js --type proposal, 2026-10-27).
