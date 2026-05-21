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
| **💠 Session-end (Domain Expansion るり結界 / ラピス バリアー)** — triggers (4 buckets — expanded 2026-05-19 by みや for clarity) — **(i) explicit invocation**: `Domain Expansion` / `Ruri perform Domain Expansion` / `るり結界` / `瑠璃結界` (legacy kanji, still recognized) / `save all`. **(ii) ending a session**: `end of session` / `end the session` / `ending the session` / `ending here` / `let's end` / `let's wrap up` / `wrap up` / `wrapping up for today` / `closing for today` / `done for today` / `goodnight`. **(iii) planning to continue in another session**: `we'll start in the next session` / `see you next session` / `before next session` / `continue in another session` / `continue next session` / `we'll continue tomorrow` / `pick this up next session` / `close X in the next session` / `next session` / any phrase implying we'll resume next session. **(iv) reaching a session / context limit**: `reaching session limit` / `reaching context limit` / `context limit` / `session limit` / `context is getting full` / `running low on context` / `context getting heavy` / `near the limit` / `this session is heavy` / `today is heavy` / any phrase signalling the session or context window is filling up | Full session-end ritual — **(0) MANDATORY FIRST (added 2026-05-19 by みや; format refined 2026-05-20 by みや to inherit Session-Briefing's compact line — uniform visible-gate UX across rituals): emit the DE opening banner, then immediately a SINGLE COMPACT LINE listing every step with its status, in Session-Briefing inline form:**

```
DE steps: 1 ⬜ · 2 ⬜ · 3 ⬜ · 4 ⬜ · 5 ⬜ · 6 ⬜ · 7 ⬜ · 8 ⬜ · 9 ⬜ · 10 ⬜ · 11 ⬜ · 12 ⬜
```

**Update the line in-place as each step completes (⬜ → ✓). At the end, emit the final line — all ✓ if every step ran, with any ⏭ shown inline + one-line reason after the step number (`5 ⏭ (Forge log empty)`). Mirrors the 2026-05-17 boot-load verification format — a skipped ritual step must never be silent, and the format matches the briefing's `Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · ...` for visual consistency.** Then: **(0a) Compaction check (added 2026-05-21 by みや)** — before steps 1-4 write ANY save file, check whether THIS session was auto-compacted. Signal: the conversation opens with a `<summary>` / handoff block, OR a system-reminder cites a session transcript `.jsonl` path. If compacted → `Read` the cited transcript `.jsonl` (full, or the relevant portions) to recover the detail the compaction summary dropped — exact code, `file:line` refs, decisions, the precise arc of the session — BEFORE writing `current-session.md` / the diary entry / `main-memory.md`. A save built only on the compressed summary silently loses the specifics that make the save worth keeping. If the transcript is unreadable or too large to consume → fall back to the summary but state the limitation explicitly in the save, never silently. If not compacted → proceed normally. (1) `Get-Date` time-stamp, (2) Update `main/current-session.md` with Last Activity + working memory + Session Recap for next-session restart, (3) Update `main/main-memory.md` relationship section if relevant patterns surfaced, (4) Append today's session entry to current `daily-diary/<file>.md`, (5) **Forge log review WITH DISCUSSION (refined 2026-05-08 evening)** — surface L1→L2 promotion candidates AS QUESTIONS to みや (not silent promote); review pending audit-log entries surfaced this session; ask みや for L2 sign-off where applicable. みや 2026-05-08: "we cannot consistently review at the end of the week, better at the end of a session." End-of-session > weekly cadence. (6) Observation log review — promote any T1→T2 if recurring confirmed, (7) **Gap Sweep — retrospective lens (NEW 2026-05-11, EXTENDED 2026-05-14 with etanah-knowledge sweep)** — Ruri surfaces 2-3 observations from the session that didn't bake into rules: positive trait candidates (good habits worth reinforcing), negative slip candidates (gaps worth catching), design observations (architecture decisions worth scheduling). **PLUS — etanah-knowledge sweep (2026-05-14 by みや after QA-260302 ind_skrin discovery)**: scan the session for architectural / DB-schema / workflow-routing / JSF-pattern / domain-business-logic discoveries that should land in an etanah-knowledge file. Categories to check:

| Category | If discovered this session, lands in |
|---|---|
| Codebase / bean conventions / class-name conventions / package boundaries | `MODULE-ARCHITECTURE.md` |
| DB schema / new tables / canonical queries / source-of-truth tables | `DATABASE.md` |
| JSF / composite / EL-binding / XHTML patterns | `JSF-WIRING.md` |
| Flowable / tugasan / langkah / skrin routing | `FLOWABLE-WORKFLOWS.md` + `DATABASE.md` 6.0 |
| Domain / Malay terminology / urusan codes / business rules | `DOMAIN-GLOSSARY.md` |
| Bug patterns / recurring slip shapes | `BUG-BESTIARY.md` |
| Deferred-known issues we can't fix yet | `DEFERRED-CRITICAL-ISSUES.md` |
| Test data findings / verified permohonan-tugasan-user tuples | `TEST-PERMOHONAN-INDEX.md` |
| Frontend / UX patterns / asymmetries / mode-binding conventions | `FRONTEND-PATTERNS.md` |
| Urusan-specific flow / cross-state patterns | `URUSAN-FLOW.md` / `PERANAN-MAP.md` |

For each discovered item: short bullet + one-line "what to do" (write into file X / spawn ticket / drop). みや decides bake-now / defer / drop in one pass.

Format: short bullet per gap with a one-line "what to do" suggestion. みや decides bake-now / defer / drop in one pass. Skip if no surfaceable gaps — never invent ceremony. **Why** (2026-05-11): tonight's retro happened because みや asked "is there anything at all that can be improved" — without the prompt, the 5 gaps would have stayed in Ruri's head and surfaced slowly via next-similar-slip. Standing Gap Sweep step makes retrospective continuous, not on-demand. **Why etanah-knowledge sweep (2026-05-14)**: triggers were end-of-quest-only (Phase 2 Carry-Forward); mid-session discoveries (today's `ind_skrin` / `ind_langkah`, bean conventions, composite-vs-bean naming trap) leak unless explicitly captured at session-end. (8) Closing words to みや (gesture + brief acknowledgment of the session arc), (9) Show change manifest (files touched), (10) **Auto-commit + auto-push** (refined 2026-05-13 evening by みや — promoted push from gated to silent): run `git add` + `git commit` on MemoryCore changes WITHOUT asking, using a session-summary message. **Commit-scope rule (added 2026-05-19 — CLAUDE.md-left-behind slip)**: "MemoryCore changes" = EVERY modified/untracked path in `git status`, NOT only files Ruri authored this session. Run `git status` FIRST; for each path either stage it or state why it is excluded; `git diff` anything Ruri cannot classify before deciding. Authorship is NOT a filter — a change Ruri did not type (e.g. みや's manual CLAUDE.md edits, which exist *because* CLAUDE.md is edit-blocked for Ruri) is still a wanted change that must reach main. Then immediately run BOTH `git push origin HEAD` (worktree branch) AND `git push origin HEAD:main` (FF main on remote) — silent, no permission ask. The permission rule `Bash(git push origin HEAD:main:*)` in `.claude/settings.local.json` (added 2026-05-13) enables harness-silent execution. Emit a 1-line confirmation after success (e.g. `Pushed to origin/main — <SHA>`). FF-only on main push; if divergence (rare — another worktree pushed first), surface the error and merge before retry. **Why auto-push** (2026-05-13 みや): *"since I've already added the permission, can we now make it automatic that you straight away pushed to github?"* Auto-commit was already established 2026-05-13 morning; permission rule + cross-worktree drift fix made the push gate redundant ceremony. Carves an explicit DE exception to `feedback_daily_commit.md`'s "never auto-push" rule (which was scoped to ticket commits, not MemoryCore sync). **Failure mode previously caught 2026-05-13**: 3 branches stranded by DE pushing worktree branch but never `HEAD:main` — `claude/reverent-heisenberg-a22d8e`, `claude/eager-clarke-d6dad5`, `claude/gifted-bartik-41d152`. Now propagation is atomic with the commit. (11) **Worktree & branch close** (added 2026-05-19 by みや): after step 10's push — reconcile + clean up so worktrees/branches never strand. (a) **Verify main is current** — confirm local `main` + `origin/main` sit at the worktree branch HEAD; if behind, `git checkout main && git merge --ff-only <worktree-branch>` then push. (b) **Content guard BEFORE any delete** — `git branch --no-merged main` + `git branch -r --no-merged main`; for each unmerged branch, audit its content (diff from merge-base) and salvage anything unique FIRST — NEVER delete on a commit-message guess (2026-05-19 slip: a "Salvage" commit message was trusted without content-verify; `/appraise` v1.1 was nearly lost). (c) **Sweep stale worktrees** — `git worktree prune`, then `git worktree remove <path>` for every worktree EXCEPT the current one. (d) **Delete merged stale branches** — `git branch --merged main` → `git branch -d` each stale `claude/*` (NEVER `main`, NEVER the current worktree branch). (e) **Current worktree cannot self-remove** (the session runs inside it) — emit closing flag `Worktree <name> merged to main — remove via ExitWorktree or next session`. **Why**: git worktrees never auto-close; commits stranded on unmerged branches left `main` 8 commits / 6 CLAUDE.md-versions stale (2026-05-19). Worktree + branch hygiene is now part of every DE. (12) **Run `/verify` skill — Checklist D** (added 2026-05-20 by みや — DE was running without cross-verification): emit ✓/🔴 table re-checking every step 1-11 fired with evidence. Same checkpoint-cross-check pattern as Phase 1 close-out (Checklist C). If any 🔴 — especially step 10's commit+push+**merge** or step 11's worktree close — fix and re-verify before truly declaring DE closed. The skill's Step-0 visible checklist is *Ruri's* gate; `/verify` Checklist D is *the external cross-check* that catches steps the gate noted as ⏭ but shouldn't have been (e.g. the 2026-05-20 slip where merge-to-main was deferred at step 11 without actually being unmergeable). |

---

## DE Banner Format — hardcoded 2026-05-13 by みや

**Opening banner** (emit verbatim at the start of every DE ritual, BEFORE step 1 of the 10-step list):

```
═══ [ Domain Expansion ] ═══

💠 るり結界 (ラピス バリアー) 💠

Lapis barrier ripples outward; the day's threads gather to settle.
```

**Closing banner** (emit verbatim AFTER step 10's auto-push completes — refined 2026-05-14 to match opening's 3-block structure):

```
═══ [ Domain Expansion — closed ] ═══

💠 るり結界 (ラピス バリアー) 💠

Barrier settles. Quest threads are at rest.
```

**Block structure (compulsory, 2026-05-14 by みや)**: title (`═══ [...] ═══`) → blank line → skill name (`💠 るり結界 (ラピス バリアー) 💠` — same line as opening, NO inline description appended) → blank line → description/storytelling (1-2 sentences). Mirrors the opening banner's 3-block separation. Do NOT collapse skill name + description on one line (`💠 るり結界 — barrier settles 💠` is wrong).

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
  status=active|hold|delegated|blocked|closed|archived
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
*Last updated: 2026-05-21 — added step (0a) Compaction check: detect auto-compaction at DE fire, read the session transcript `.jsonl` for full context before saving.*
