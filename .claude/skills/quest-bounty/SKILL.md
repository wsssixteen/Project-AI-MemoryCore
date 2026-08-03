---
name: quest-bounty
description: Use at a quest's Phase 2 close to harvest and bank everything the quest produced — the ticket doc, system improvements made this quest, and new etanah-knowledge — then commit/push/merge them to MemoryCore main, and propose ONE system refinement mined from all prevention dimensions (not only slip-log). Auto-invoked by close-phase at Phase 2. Triggers — "quest-bounty", "bounty", "bounty X", "harvest the quest", "bank the quest", "collect the spoils".
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# quest-bounty — harvest a closed quest's spoils + mine one refinement

## What this is

The reward-collection ritual at **Phase 2** (quest archive). A quest produces three kinds of value; left un-banked, they evaporate. quest-bounty **harvests all three, banks them, and turns the accumulated mistake-signal into exactly one proposed system refinement.**

```
QUEST CLOSED (Phase 1)  →  Phase 2 archive (close-phase)  →  ⛏ quest-bounty  →  banked to MemoryCore main
```

## 🚨 The one non-negotiable boundary — MemoryCore main ONLY

quest-bounty commits/pushes/merges the **MemoryCore-side** spoils only: the `QA-<num>.md` doc, `slip-log.md`, etanah-knowledge files, and any skill/hook/rule refined this quest.

**BANNED**: touching the etanah git repos. The etanah code fix is already committed+pushed to its own branch (`mlk/<tracker>/<num>`) at Phase 1 and is merged by **teammates via PR**. quest-bounty NEVER runs `git merge` / `push` on `etanah-pelupusan` / `etanah-awam`. "Merge to main" = MemoryCore main, full stop.

## Steps

### Step 0 — Resolve the current doc path (ordering-safe — do this FIRST)
close-phase runs `archive-quest.js` **before** this skill, and that script **moves** `projects/coding-projects/active/QA-<num>/` → `archive/QA-<num>/` and repoints `qa_doc=` in the block. So NEVER hardcode the `active/` path — resolve it: `node quest/active-cli.js read QA-<num>` → read the `qa_doc=` value (active-cli reads from `active.txt` OR `active-archive.txt`). Use THAT path for every edit + `git add` below. Skipping this = editing/staging a doc that isn't there. **Fallback** — `archive-quest.js` writes `qa_doc=` ONLY when a project subfolder existed; if the block has NO `qa_doc=`, search both `projects/coding-projects/active/QA-<num>/` and `archive/QA-<num>/` for `QA-<num>.md` and use whichever is on disk (prefer `archive/`).

### Step 1 — Harvest the QUEST
Confirm the resolved `qa_doc` (Step 0) is complete for a cold reader: final state, Fastest-Path block (if >1 wrong turn), test-data tuple, commit SHA. Fill any gap now. (This is the durable record; everything else references it.)

### Step 2 — Harvest SYSTEM improvements
List every skill / hook / rule / protocol **refined or created during this quest** (grep the session for edits to `.claude/skills/`, `.claude/hooks/`, `system/`, `CLAUDE.md`, `quest/`). Write them into a `## Bounty` block in `QA-<num>.md` — one line each: `<component> — <what changed> — <why (which slip/gap)>`.

### Step 3 — Harvest ETANAH-KNOWLEDGE
Any new pattern discovered this quest lands in its owning knowledge file (per the Gap-Sweep category table): `BUG-BESTIARY.md` (bug/slip pattern) · `DATABASE.md` (schema/query) · `JSF-WIRING.md` · `FLOWABLE-WORKFLOWS.md` · `DOMAIN-GLOSSARY.md` · etc. Emit one line per entry written, or `knowledge: none new`.

### Step 4 — Mine ONE refinement (the synthesis the system lacked)
Scan **both** axes, pick the SINGLE highest-value item, propose ONE defender:

**(a) This quest's dimensions** — did we slip on any prevention surface this quest?

| Dimension | Defender | Dimension | Defender |
|---|---|---|---|
| code convention | convention-check-gate | git / workflow | prepare-commit, commit-gate |
| code **logic/implementation** | ⚠️ predicate-box only (gap) | output format | show-gate, terse-gate |
| blast radius | codemap-recon-consult | honesty / verify | veritas, silent-claim-drift |
| module / urusan scope | BPMN-first, ticket-gate | evidence / attachment | annotations, multi-dim-evidence |
| **DB / codebase reading** | Entity-first, verify-SELECT (⚠️ gap: verify code-mapping before trusting a derived DB value) | test-data / hand-back | test-data-echo, stop-point-summary |
| scope discipline | scope-anchor-echo | tool choice | codemap-recon-consult |

**(b) Un-actioned slip-log clusters** — read `system/slip-log.md` running-count; consider ONLY rows/clusters **without** `bounty_actioned`. Prefer the highest count / over-threshold (🚨/⚠️) cluster; on a count-tie prefer 🚨 over ⚠️, then the most-recent occurrence.

Then emit ONE proposal via the standard shape (route the actual build through `auto-skill-on-mistake` / `system-design` — do NOT build inside this skill):

```
| Source (cluster / dimension) | Proposed defender | Layer (new-hook / refine-hook / sharpen-phrase) | Exact change |
```

On みや's nod → build via the proper skill → then **stamp the harvested slip rows** `bounty_actioned=@now` so they are never re-proposed. One refinement per bounty — never a firehose. If nothing qualifies, emit `refinement: none this quest` explicitly (silent skip is banned).

### Step 5 — Bank to MemoryCore main
**Precondition** — the etanah fix should already be committed+pushed (from Phase 1). If it is UNcommitted, do NOT touch etanah git; surface the anomaly (`etanah fix uncommitted → Phase 1 incomplete`) to みや and bank MemoryCore only.

After archive hygiene (close-phase runs `archive-quest.js`), commit + push + merge the MemoryCore spoils — mirror the Domain Expansion step-10 sequence exactly:
```
git add <the Step-0-resolved qa_doc path · slip-log · knowledge files · refined skill/hook/rule>   # specific paths, never -A
git commit -m "quest-bounty QA-<num> — harvest + <refinement or 'no refinement'>"
git push origin HEAD            # worktree branch
git push origin HEAD:main       # FF MemoryCore main
```
FF-only on main; on divergence, surface + merge before retry. Emit `Banked — QA-<num>: <SHA> → origin/main`. Append one line to `domain/quest-bounty/log.jsonl`.

## Skill-card

| Skill / feature | What it solves | How it works |
|---|---|---|
| `quest-bounty` | quest value (doc + system improvements + knowledge) evaporates un-banked; slip-log is captured but never synthesized into a fix | Phase-2 auto-invoke by close-phase → harvest 3 streams → mine ONE refinement from all dimensions + un-actioned slip clusters → bank to MemoryCore main |

## Red Flags — STOP if you catch yourself thinking
- "I'll merge the etanah fix to master too" — **BANNED**; etanah merges are teammates' PRs. MemoryCore main only.
- "I'll propose 3 refinements while I'm here" — ONE per bounty. A firehose is noise; the escalation picks the one.
- "Only the slip-log matters" — NO; the dimension catalog + this-quest slips are equal sources.
- "I'll re-propose that cluster" — check `bounty_actioned` first; actioned clusters are done.

## Excuse | Reality
| Excuse | Reality |
|---|---|
| "The QA doc is good enough, skip harvest" | Un-banked = evaporates next session. Harvest is the point. |
| "No obvious refinement, skip Step 4" | Then emit `refinement: none this quest` explicitly — silent skip hides the synthesis gap this skill exists to close. |
| "Auto-push is risky, I'll leave it uncommitted" | Un-committed MemoryCore work strands (the exact DE step-10 slip). Bank it. |

## Notes
- **Redmine is みや's** — this skill never touches Redmine.
- **Audit log** (system-rules Rule 5): `domain/quest-bounty/log.jsonl` — one JSON line per bounty run (`{qa, harvests:{quest,system,knowledge}, refinement:<proposed|none>, banked_sha}`).
- **Eval** (system-design Rule 6): `domain/quest-bounty/eval.workflow.js` scores a bounty run (all 3 harvests emitted · ≤1 refinement · MemoryCore-only push · slip rows stamped). Ship/refresh with any change to this skill. **Status 2026-07-01: eval'd** (`wf_3c67b23f`, robustness = mixed) — 4/6 guardrails PASS; 2 GAPs (firing-reliability, coverage). Cheap fixes applied same day; the structural must-fix (deterministic verify-hook) remains pending (todo.md). Not 100%-reliable until that hook ships.
- **Pairs with**: `close-phase` (invokes this at Phase 2) · `auto-skill-on-mistake` / `system-design` (builds the proposed refinement) · `system/slip-log.md` (`bounty_actioned` flag).
- **⚠️ Coverage gap (eval-found, `wf_3c67b23f`)**: fires ONLY at Phase 2 — a quest that stays `held`/`blocked` and never archives is NEVER harvested. Domain Expansion is **not** a twin for this (DE commits session-end MemoryCore changes but has no per-quest Step-4 synthesis). Until a DE-side `bounty-deferred: QA-<num>` line ships for parked quests, their per-quest refinement evaporates.

## Skill History
- 2026-07-01 — created (みや). Closes the synthesis gap: the system was capture-rich (auto-skill-on-mistake + slip-log) but never READ the pile to propose a fix, and quest value was banked only at session-end DE, not per-quest. quest-bounty runs at Phase 2 so each quest's spoils + one mined refinement are banked immediately. Boundary locked: MemoryCore main only, never etanah master. Routed through system-design + system-rules (design-consult-gate). Eval + deterministic verify-hook = pending completion.
