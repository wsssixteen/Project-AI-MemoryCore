# Agentic ticket workflow assessment — 2026-10-27 (session esokongan-ticket-selection-cad51f)

| Axis | Finding | Instance | Proposal logged |
|---|---|---|---|
| A1 agentic system | The audit briefing is blind when run from a worktree: it reads the worktree's telemetry copy, frozen at checkout | `lib/audit-briefing.js --days 7` in this worktree: "1 hooks seen", ~70 hooks "never fired", among them TurnChecklistGate and domain-expansion-trigger, which fired this session | A1 (read main's telemetry from a worktree) |
| A1 agentic system | The Redmine write gate read only the last full prompt, so approvals sent mid-turn were lost | 246964: "Go", "Submit", "send", "pass" all blocked | Fixed: gate reads queued_command, eval F91-F99 |
| A2 quest workflow | The branch state was not shown before a branch choice or an end-of-day item | 246964: offered merges without saying where 1.8.5 stood; later listed "1.8.5 into master" as a 246964 item | Deploy rule 11 (fixed); A2 (save-quest prints where the fix commit sits) |
| A3 debugging | A header part with no section reference is invisible to a text read of the template | 261986 Lulus template: header XML present, never printed | A3 (lint unreferenced headers) |
| A4 etanah issue-solving | Static label repeats what the tag already returns | 261986: "Mukim Mukim" | A4 (lint the repeat); knowledge §8 in WORD-TEMPLATE-RENDERING.md |
| A5 sweep | ⏭ no sweep or file sweep ran this session | — | — |
