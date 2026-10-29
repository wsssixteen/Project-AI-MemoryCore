# Handoff 2026-10-28: one workflow for every system change (/system-change)

> **2026-10-29 — DONE.** Fable 5.1 Foundations audit run (18 foundations, 12 conflicts, 7 paths none ending on main). His popup: Rules own + skill runs · refine design-consult-gate (advisory) · highest-model rule row · group name Capabilities. Built: `system/INDEX.md` rulings 13-14 + §The change route · `.claude/skills/system-change/` · `domain/system-change/` (eval 21/21) · gate advisory (eval 37/37) · 8 lane pointers · CLAUDE.md v1.97. Not done (follow-ups): `feedback_daily_commit.md` pointer (memory-write-gate did not see the placement line) · stale text in `auto-skill-on-mistake` (:46 :69 :91 :141), `design-consult-gate/README.md` :8 :15, `INDEX.md` recursive-safety line on system-edit-gate · one shared path list for the 3 gates · version-stamp uniqueness check in claude-md-edit-guard · the 9 unclaimed root folders' verdicts.

Session: "28/10/2026 - one system-change workflow" (worktree `dreamy-pike-08af0b`), a child of the Baseline 1.9.0 session.
State: design proposed, NOT approved, nothing built. Tomorrow's baseline starts from this file.

## 1. Goal (miya, 2026-10-28)

- Every change to MemoryCore goes through ONE workflow, whatever the trigger. Today each kind of change takes its own path and none ends with commit + push + land on main; he sees that as the root of the system's non-determinism.
- The six triggers: 1 "update anything in CLAUDE.md" · 2 "change something in a workflow" · 3 "refine something about our memory system" · 4 "create a new function" · 5 I audited and he gives the go · 6 "check the audit logs and slip logs and act on it straight away".
- A core change is a security update: commit, push and land on main in the same turn (`.claude/auto-memory/feedback_daily_commit.md`, last bullet).
- No new gate for the commit step: it is a workflow step.

## 2. His answers to the design (2026-10-28, verbatim)

| Question | His answer |
|---|---|
| Build /system-change as drawn? | "No, use Fable 5.1 to audit first. but this should be done in the child session." |
| How should a system edit enter the route? | "Please go through the audit first before deciding and recommending this." |
| Put "system changes run on the highest model" into step 1? | "After audit because I want to understand the structure and flow first in the child session. Please save context for this session for baseline for tomorrow." |

## 3. Next step: the Fable 5.1 audit (tomorrow, in this child session)

**His order, 2026-10-28 evening (supersedes the path-only audit below as the FIRST step):**

1. Fable 5.1 audits the system's RULES and DESIGN first (`system-rules`, `system-design`, `system/INDEX.md` map + rulings, CLAUDE.md). The result is the new "Foundations".
2. Against those Foundations, decide whether the change flow (the six paths below) actually works.
3. Then consolidate WITHOUT removing anything as the first step; keep every mechanical or deterministic part (hook, gate, script) where it is needed.

His principle: "EVERYTHING needs to be NAMED first. Then STRUCTURED." Naming is step 0 of the Foundations audit:
- the group Workflows + Features + Tools has no name in the map (his "blue box");
- 9 tracked root entries have no kind: `growth` · `library` · `plugins` · `salvage` · `tools` · `outputs-temp` · `Project Resources` · `RURI-GROWTH.md` · root `etanah-knowledge` (verdicts pending in `system/FOLDER-STRUCTURE.md` lines 34-42);
- `node lib/folder-structure.js map` reports "0 unmapped" while these 9 are on disk; why is not verified.
- Architecture picture of today's map: shared notes folder `system-architecture.png`.

His hierarchy concern: a Workflow (route) carrying out changes to Rules and Kernel looks like a lower layer running a higher one. Accepted on the condition that the change procedure's text is OWNED by Rules (CLAUDE.md / system-design) and the Workflow only carries it out. Weigh this in decision 1.

- Switch this session to Fable 5.1 (`claude-fable-5-1`) before the audit; say the model in the first line.
- Goal of the audit: miya understands the STRUCTURE and FLOW of how a system change happens today, before any design is decided.
- For each of the six paths (plus a correction via `auto-skill-on-mistake`): trigger → steps in order → files and tools touched → who enforces each step (hook, skill, prose) → where it ends (committed? pushed? on main?).
- Output: one overview picture of all six paths side by side (explain-diagram skill, `lib/diagram-render.js`) + one table: path | steps | enforced by | ends on main?
- Then re-ask the three open decisions in section 6, with the audit's evidence beside each.

## 4. Inventory facts found today (verified 2026-10-28 in this worktree)

| Path | Where its steps live today | Ends on main? |
|---|---|---|
| 1 CLAUDE.md | `domain/claude-md-watch/README.md` pipeline (checklist · trim-guard · adversary · move-don't-rewrite · version + `system/claude-md-changelog.md` · gates · `lib/watch.js add`) | no commit stage |
| 2 Workflow step | the owning skill (`system/INDEX.md` ruling 6: the skill owns its step list) + its eval | no |
| 3 Memory | `domain/memory-write-gate/` (RULE-PLACEMENT line) + `MEMORY.md` index line | no |
| 4 New function | `system-rules` Rule 1 · `system-design` Rules 6-17 · `core/forge.js new` · `system/INDEX.md` / `system/tools.json` | Rule 15 says land via `lib/land-on-main.js`, not "same turn" |
| 5 Audit go | `/system-audit` (briefing) · `/system-check` ("does NOT auto-implement fixes") | no |
| 6 Slip logs | CLAUDE.md boot step reads `system/slip-dashboard.md` (file NOT present in this worktree; only `system/slips.jsonl` + frozen `system/slip-log.md`) · `auto-skill-on-mistake` Steps 1-6 · `core/slips.js` | no |
| Record rows | `system/INDEX.md` §Change record (what to write where, same turn) | n/a |
| Entry guard | `domain/design-consult-gate/` blocks system edits until `/system-rules` + `/system-design` ran this session | guards the start only |

How a session commit reaches main today (seen in git log 2026-10-28): commit in the worktree → merge `origin/main` into the worktree branch → `git push origin HEAD:main` → `node lib/land-on-main.js <commit>` from the worktree (commits "(landed from <sha>)" in the main folder; it does NOT push) → main folder merges `origin/main`. The main folder sat 9 commits ahead of origin at 16:30.

## 5. Draft design shown to him (not approved)

One Workflow skill `/system-change` + Feature folder `domain/system-change/`; the six paths keep their lane detail and point to it for the order.

| Step | What |
|---|---|
| 1 Inventory | name the kind (`system/INDEX.md`) and the target paths · `system-rules` · `node lib/change-checklist.js <paths>` |
| 2 Design picture | `system-design` · flow first (existing flow, one changed step marked) |
| 3 His nod | already given on triggers 5 and 6 |
| 4 Build in the lane | the lane's own doc holds the detail (claude-md-watch · owning skill · memory-write-gate · forge · audit list · slip dashboard) |
| 5 Verify | eval (Rule 6 v1.2) · self-audit (Rule 16) · `lib/diagram-census.js --check` (Rule 17) |
| 6 Record | `system/INDEX.md` §Change record rows · `lib/watch.js add` before the commit |
| 7 Land on main, this turn | commit (`Co-Authored-By: Ruri`) · push · `node lib/land-on-main.js <commit>` · show the remote main SHA |
| 8 Report | `## System › Kind › name (changed|new)` tables (`.claude/reply-shape-spec.md` §3i) |

## 6. Open decisions (his, after the audit)

1. A new `/system-change` skill, or fold the route into `system-design`.
2. Entry: refine `design-consult-gate` to require `/system-change`, or skill description only.
3. "System changes run on the highest model" in step 1 (also open in `main/current-session.md`; the child session quest-audit-fixes waits on it).
