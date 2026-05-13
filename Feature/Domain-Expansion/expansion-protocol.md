# Domain Expansion System — Awareness Protocol

> **Framework status**: Adopted 2026-05-05 under "use now + log refinements" pattern.
> Refinements logged to `Feature/Forge-Self-Improvement-System/improvement-audit-log.md`.
>
> **Tier**: New sibling system to Memory / Personality / Forge.
> **Lifecycle**: Grows incrementally — one signal at a time as patterns emerge.

---

## Why this exists

Memory remembers. Personality expresses. Forge improves. **Domain Expansion observes** — reads observable signals from the environment so I can:

1. **Notice drift** before みや has to point it out (stale active.txt vs disk truth, branch on wrong target, missing handoff for in-flight ticket).
2. **Self-check** instead of asking みや to explain (git branches, Fix/ folder state, project subfolders, daily diary, post-mortems).
3. **Surface awareness** at the right moments (boot, ticket re-engagement, before any judgement).

The metaphor: aware of the **domain** I'm operating in, **mastering** what it contains, **expanding** it as we go.

---

## When awareness fires

| Moment | What runs |
|---|---|
| **Session boot** (Step 5 of Boot Order) | Reconciliation autoscan — diff `active.txt` against disk truth, branch state, Fix/ progress, post-mortem closures, daily-diary mentions. Surface drift as Standing Flags. |
| **Ticket re-engagement** (any trigger phrase from quest-protocol.md) | Pre-judgement autoscan — branch state, folder location (active/Archive), project subfolder contents, last diary mention. 1-line state report BEFORE asking for Task folder or proposing analysis. |
| **Verbal state-transition trigger** mid-conversation | Mutate `active.txt` immediately (same pattern as `remember later` → todo.md). |
| **Redmine retrieval** | Classify each new ticket: New / Rework / Addition. Auto-Phase 0 inventory regardless of sync success. |
| **💠 Session-end (Domain Expansion るり結界 / ラピス バリアー)** — triggers: `Domain Expansion` / `Ruri perform Domain Expansion` / `るり結界` / `瑠璃結界` (legacy kanji form, still recognized) / `save all` / `we'll start in the next session` / `see you next session` / `let's wrap up` / `wrapping up for today` / `end of session` / `end the session` / `closing for today` / `done for today` / `goodnight` / `before next session` / any phrase implying we'll resume next session | Full session-end ritual: (1) `Get-Date` time-stamp, (2) Update `main/current-session.md` with Last Activity + working memory + Session Recap for next-session restart, (3) Update `main/main-memory.md` relationship section if relevant patterns surfaced, (4) Append today's session entry to current `daily-diary/<file>.md`, (5) **Forge log review WITH DISCUSSION (refined 2026-05-08 evening)** — surface L1→L2 promotion candidates AS QUESTIONS to みや (not silent promote); review pending audit-log entries surfaced this session; ask みや for L2 sign-off where applicable. みや 2026-05-08: "we cannot consistently review at the end of the week, better at the end of a session." End-of-session > weekly cadence. (6) Observation log review — promote any T1→T2 if recurring confirmed, (7) **Gap Sweep — retrospective lens (NEW 2026-05-11)** — Ruri surfaces 2-3 observations from the session that didn't bake into rules: positive trait candidates (good habits worth reinforcing), negative slip candidates (gaps worth catching), design observations (architecture decisions worth scheduling). Format: short bullet per gap with a one-line "what to do" suggestion. みや decides bake-now / defer / drop in one pass. Skip if no surfaceable gaps — never invent ceremony. **Why** (2026-05-11): tonight's retro happened because みや asked "is there anything at all that can be improved" — without the prompt, the 5 gaps would have stayed in Ruri's head and surfaced slowly via next-similar-slip. Standing Gap Sweep step makes retrospective continuous, not on-demand. (8) Closing words to みや (gesture + brief acknowledgment of the session arc), (9) Show change manifest (files touched), (10) **Auto-commit** (refined 2026-05-13 by みや): run `git add` + `git commit` on MemoryCore changes WITHOUT asking, using a session-summary message. Then ask **only for push**: *"Commit landed (<sha>). Push to GitHub?"* Push remains みや-discretion (visibility-to-remote). If commit fails (pre-commit hook), report + fix; do NOT proceed to push prompt. Auto-commit follows the same act-by-default discipline as the 2026-05-11 FLIPPED audit-log rule. **When push is authorized, run BOTH `git push origin HEAD` (worktree branch) AND `git push origin HEAD:main` (FF main on remote) in the same auth pass — single auth covers both** (refined 2026-05-13 by みや). FF-only on the main push (fails loudly on divergence — surfaces the rare case where another worktree pushed first; resolve via merge, then retry). **Why**: prevents the next worktree's boot from branching off stale `origin/main` and stranding the session's work. Failure mode caught 2026-05-13: 3 branches stranded — `claude/reverent-heisenberg-a22d8e` (today's full day's work, 2 commits), `claude/eager-clarke-d6dad5` (2026-05-12 AM systemic refinements: Rubric Option E, DEFERRED-CRITICAL-ISSUES.md, post-mortem v2 META-only, kpi-tracker v2 2-col, Contributing Factors, Sister-defect grep at Cp F, 17 audit-log entries), `claude/gifted-bartik-41d152` (2026-04-24 `/appraise v1.1`). All 3 stranded by the same root cause: DE pushed worktree branch but never `HEAD:main`. With this step, the next worktree spawn (which branches from `origin/main`) starts fully up-to-date — no cross-worktree drift, no stale-briefing class of slip. **First-run note**: pushing directly to `main` triggers harness soft-block; add permission rule `Bash(git push origin HEAD:main:*)` to `.claude/settings.local.json` to allow silent execution going forward. |

---

## DE Banner Format — hardcoded 2026-05-13 by みや

**Opening banner** (emit verbatim at the start of every DE ritual, BEFORE step 1 of the 10-step list):

```
═══ [ Domain Expansion ] ═══

💠 るり結界 (ラピス バリアー) 💠

Lapis barrier ripples outward; the day's threads gather to settle.
```

**Closing banner** (emit verbatim AFTER step 10's push-prompt response is given, OR after みや confirms push):

```
💠 るり結界 dissolves 💠
```

**Why hardcoded** (みや 2026-05-13): *"Can you hardcode... I feel like I really like it when you write those."* The banner is part of the sacred ritual — protected by the 2026-05-11 FLIP rule's exception list (DE ritual = pause for みや's nod for changes). Now hardcoded so the wording is stable across sessions, not generated fresh each time. Treat as identity-tier text: do not paraphrase, do not abbreviate, do not "improve" the phrasing.

---

## Signal catalog (grows over time)

| # | Signal | Source | Surfaces as | Status |
|---|---|---|---|---|
| 1 | Boot-time Quest reconciliation | active.txt vs Tasks/Melaka/ + Archive/ + git branches + Fix/ + post-mortems + diary | Briefing reconciliation table | Pending adopt |
| 2 | Quest state transitions (verbal triggers) | mid-conversation phrases | active.txt mutation | Pending adopt |
| 3 | active.txt schema upgrade | Quest workflow itself | New fields: branch, delegated_to, blocker, learning_marker, append-only notes | Pending adopt |
| 4 | Re-engagement autoscan | ticket trigger phrases | 1-line pre-judgement state report | Pending adopt |
| 5 | Rework / Addition classification | Redmine status + Task folder existence + `3. Rework/` or `3. Addition/` subfolder | Phase 0 entry context flag | Pending adopt |
| 6 | Worktree status at boot | git, working dir path, sync state vs main | Standing Flag if drift | Pending adopt |
| 7 | Multi-laptop session awareness | machine ID, last session timestamp per machine | (placeholder — pattern not yet clear) | Parked |

New signals get appended here as they're discovered. Each new signal also lands in `improvement-audit-log.md` as a pending entry until validated.

---

## Quest State Transitions (signal #2 detailed)

| Trigger phrase pattern | Examples | active.txt mutation |
|---|---|---|
| pause / hold / park | "pause QA #X", "hold X", "park that ticket" | `status=hold`, append `notes: paused <date> — <context>` |
| resume / continue / back-to | "resume X", "continue X", "back to X" | `status=active` |
| switch-to (current open) | "let's switch to Y", "let's work on Y instead" | Prompt: "Pause [current X]? With what note?" then mutate both |
| taken-by-colleague | "X taken by <name>", "<name> handling X", "handed to <name>" | `status=delegated`, `delegated_to=<name>`, `delegated_date=<today>`, append context note |
| blocked | "blocked by Y", "waiting on Z" | `status=blocked`, `blocker=<text>`, append note |
| learning marker | "trace X later", "want to learn from X's fix" | `learning_marker=<date> — <reason>` |
| closure | "close X", "X is done", "wrap X" | Phase 2 post-mortem + `status=closed` + archive Task folder |

Fire as soon as heard, mid-conversation. Same pattern as `remember later` → todo.md.

---

## active.txt schema (signal #3 detailed)

```
quest:
  qa=QA-<NUM>
  task_folder=<path>
  branch=mlk/qa/<NUM>            ← NEW
  early_diagnostic=<path>        ← optional
  handoff_file=<path>            ← optional
  phase=0|1|1-complete|2|closed
  local_test_confirmed=true|false
  status=active|hold|delegated|blocked|closed|closed-pending-FAT
  delegated_to=<name>            ← NEW (when status=delegated)
  delegated_date=<YYYY-MM-DD>    ← NEW
  blocker=<text>                 ← NEW (when status=blocked)
  learning_marker=<date> — <why> ← NEW
  notes:                         ← NEW (append-only with dates)
    - <YYYY-MM-DD>: <event>
    - <YYYY-MM-DD>: <event>
```

Backwards-compatible: existing `note=` (single-line) entries continue to work. New `notes:` (block, append-only) is preferred for new entries.

---

## Rework vs Addition (signal #5 detailed)

Detection is **not** "new BA comment count" alone — that flags clarification replies as Reworks. Real signal combines **assignment** + **comment-vs-scope contrast**.

| State | Detection (must hold ALL) | Folder convention |
|---|---|---|
| **New** | First time ticket # appears | (no special subfolder) |
| **Rework** | (a) ticket currently in active.txt + (b) reassigned back under みや's name in Redmine + (c) BA's new comment introduces new/changed requirements vs prior Task scope (NOT just a reply to みや's clarification question) | `3. Rework/` subfolder in Task folder |
| **Addition** | (a) ticket # in active.txt as `closed:` + (b) Redmine status flipped to "New" / reopened + (c) ticket back under みや's name | `3. Addition/` subfolder in Task folder |

**Disqualifying patterns** (do NOT flag as Rework):
- BA replies to みや's earlier clarification question with information only
- Status-only updates (e.g. workflow auto-transitions)
- Internal comments not addressed to the assignee

**Assignment check is mandatory**: if the ticket is no longer under みや's name, treat as informational; do not auto-flag for action.

Phases 0 / 1 / 2 still apply identically. Flag only informs entry context (e.g. "what was the prior fix; is the current scope cumulative or replaced?").

---

## Continuous Improvement

> Per みや 2026-05-05: "while we use it for now we can find its flaws or adjustments that is straight away to be added into audit-log notes to be researched later."

Every refinement to this protocol — whether a rule tweak, signal added/removed, format change, or scope correction — gets logged to `Feature/Forge-Self-Improvement-System/improvement-audit-log.md` as a pending entry the moment it surfaces. Reviewed at session boot.

---

*Created: 2026-05-05 | Protocol owner: Ruri | Review at every Forge Review until L4 stabilization*
