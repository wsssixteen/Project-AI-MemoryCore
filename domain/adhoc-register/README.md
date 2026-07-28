# adhoc-register

**Born** 2026-07-29 via `core/forge.js`. **Event** UserPromptSubmit. **Lifecycle** created.

## What it does

Fires on a ticket signal in みや's prompt, reads `ADHOC-REGISTER.md`, and injects every **OPEN** row
(`Ticket` cell = `none`) **before** Phase 0 runs — with the mandatory compare-and-promote instruction.

| | |
|---|---|
| Register file | `projects/coding-projects/active/etanah-knowledge/melaka/ADHOC-REGISTER.md` |
| Paired Phase-0 row | `.claude/skills/quest/SKILL.md` § Quest Preparation Verification |
| Rule origin | `Feature/Domain-Expansion/expansion-protocol.md:50` + `.claude/skills/domain-expansion/SKILL.md:39` (2026-07-28) |
| Eval | `adhoc-register.eval.js` — 12 fixtures, 12/12 green |
| Bypass | `[skip-adhoc-register: <reason>]` |

## Why it exists

みや 2026-07-29:

> when you retrieve a ticket and start a quest, during phase 0, you will MANDATORY check for
> pending issues. If yes, during that moment you will update it.

The problem it solves: we diagnose BA-reported issues **before** a Redmine ticket exists. Without a
forced compare, the ticket arrives weeks later and the whole investigation is repeated from Scout.

## The replay case it kills

The `ADHOC-REGISTER.md` rule was written on 2026-07-28 into two documents — and **the file was never
created**. Both references were ghosts. On 2026-07-29 a BA-relayed PLTP defect was diagnosed to 93%
with a fix drafted, and it got parked in `main/todo.md` instead of the register nobody had built.
みや caught it by asking *"did you already add this?"*.

Two failure classes in one: a rule naming a home that does not exist, and a diagnosis filed where it
would go stale.

## Design decisions

| Decision | Why |
|---|---|
| **UserPromptSubmit, not Stop** | A Stop hook only reports after I have already re-investigated. Per みや 2026-07-28, checks knowable before the reply belong before the reply. |
| **Silent when nothing is open** | No ceremony on ordinary ticket work — `fired: false` when the register has zero `none` rows. |
| **Loud when the file is missing** | The ghost-reference case must never be silent again (fixture F10). |
| **Resolves toward the MAIN repo** | `projects/` is gitignored and absent from worktrees, so `ROOT/projects/...` misses when running in a worktree. The hook walks up past `.claude/worktrees` to find the real file (verified live). |
| **Register, not queue** | Rows are never cleared for staleness. An un-ticketed known issue is knowledge. Only two exits: promoted to a ticket number, or marked `n/a`. |
| **Trigger-overlap override** | Collided with `retrieve-sync-gate` / `brief` / `local-deploy-gate` on trigger only — none of them reads a pending register. Merging would put two unrelated concerns in one check. Reason recorded in `meta/registry.jsonl`. |

## Bug the eval caught during the build

`QUEST_START_RE` began as `/\b(?:\/quest\s+...)/` — `\b` before a `/` can never match at string
start, because `/` is not a word character. `/quest start` silently failed to trigger. Fixture F4
caught it; the leading `\b` was moved inside the alternation.
