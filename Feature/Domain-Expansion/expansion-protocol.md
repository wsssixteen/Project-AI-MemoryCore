# Domain Expansion System — Awareness Protocol

> **Entry point (2026-06-28)**: DE is now invoked via the **`/domain-expansion` skill** (`.claude/skills/domain-expansion/SKILL.md`) — the structured, Skill-tool-invoked orchestrator. This file stays the **source of truth** for each step's detail; the skill drives the sequence. The `domain-expansion-trigger.js` hook routes session-end phrases to the skill.

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

**Update the line in-place as each step completes (⬜ → ✓). At the end, emit the final line — all ✓ if every step ran, with any ⏭ shown inline + one-line reason after the step number (`5 ⏭ (Forge log empty)`). Mirrors the 2026-05-17 boot-load verification format — a skipped ritual step must never be silent, and the format matches the briefing's `Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · ...` for visual consistency.** Then: **(0a) Compaction check (added 2026-05-21 by みや; procedure refined 2026-05-21 after first live use)** — before steps 1-12 run, check whether THIS session was auto-compacted. Signal: the conversation opens with a `<summary>` / handoff block, OR a system-reminder cites a session transcript `.jsonl` path. If NOT compacted → proceed normally. If compacted → recover the dropped detail from the transcript BEFORE the **content-synthesis save steps** (2 `current-session.md` / 4 diary / 7 Gap Sweep) — those steps build the save FROM session memory, so a lossy summary corrupts them. (Steps 5/6 just review existing log files and need no transcript check — this is NOT a blanket grep-per-step.) Procedure: **(a) Small transcript** (consumable in one or two `Read`s) → `Read` it. **(b) Large transcript** (multi-MB, too big to full-read) → do NOT just fall back to the summary; run the two-part verification — **(i) target-read the transcript TAIL** (the post-summary turns, full content — that is where genuinely uncaptured detail sits) + **(ii) spot-grep the load-bearing facts** the save will record (every ticket ID, `file:line`, test-data tuple, decision, commit SHA) against the transcript, confirming the summary's version is consistent. If a grep contradicts the summary, the transcript wins — re-derive from it. **(c)** State in the save AND in the DE step line which path was taken (`full-read` / `tail+spot-grep`) so the fidelity basis is visible, never silent. **(0b) Worktree/branch sync check (added 2026-05-22 by みや)** — also at the start, before steps 1-12: run `git branch --show-current` (+ `git worktree list`) to detect whether the session is on a **worktree branch** or on **main**. If on a worktree branch AND behind `origin/main` (`git rev-list --count HEAD..origin/main` > 0), merge/pull `origin/main` in FIRST — so every DE step (the content steps AND the step-10 commit) is built on current main. If already on `main`, or the worktree is not behind, note it and proceed. **Why** (みや 2026-05-22): syncing from main at the *start* of DE beats discovering divergence at commit time — step 11's reconciliation runs only after all the content work, so a stale worktree would have done its whole save on an out-of-date base; pulling early means nothing is built on stale state. (1) `Get-Date` time-stamp, (2) Update `main/current-session.md` **then run `node core/session-trim.js --apply`** (MANDATORY, added 2026-08-04 per みや: `main/session-format.md:57` caps session memory at 500 lines, nothing enforced it, the file hit 1665 lines / 135 KB, and boot's Read TRUNCATES past ~25k tokens so the Session Briefing was silently built on a partial file — that is the `briefing breaks every time` symptom. Older blocks move to `main/session-archive.md`, never deleted.) with Last Activity + working memory + Session Recap for next-session restart, (3) Update `main/main-memory.md` relationship section if relevant patterns surfaced. **(Step 3.5 RETIRED 2026-06-01 per みや)** — post-mortems.md was migrated wholesale into per-quest `projects/coding-projects/archive/<KEY>/<KEY>.md` docs (via `quest/migrate-post-mortems.js`); KPI tracker logic moved into quest-protocol.md Phase 2 Step 2 with "only-if-significant-out-of-scope-critical" gate; slip-log.md continues to accept entries via `auto-skill-on-mistake` Step 5 (not via DE). **Active.txt / active-archive.txt scripted via `quest/active-cli.js`** (built 2026-05-31): use `node quest/active-cli.js {start|read|update|archive} <QA> ...` — token-zero CRUD. **Phase-2 archive hygiene scripted via `quest/archive-quest.js`** (built 2026-06-01): use `node quest/archive-quest.js <QA>` for atomic folder + project + block moves. (4) **[cite-slug rule, added 2026-07-19 weekly-audit refinement #7]**: any "slip logged" / "recorded" / "saved" claim written into the diary MUST carry the exact ledger category slug (e.g. `` `reask/verbose` ``) so the claim is greppable against `system/slips.jsonl` at write-time — a bare "slips logged" assertion is BANNED (capture-at-the-moment compatible: cite what was already written this session, never re-verify downstream; 10 unverifiable "logged" claims found in one week's diary, one proven false — the 07-16 unlogged angriest slip). Update today's diary entry at `daily-diary/current/<YYYY-MM-DD>.md` per `daily-diary/diary-format.md` template — append `### Session N — <arc-title>` sub-section under `## Sessions`, recompile `## Index` (manual compile — auto-tracking deferred 2026-05-28; see `daily-diary/diary-format.md` Phase history), rewrite `## Closing` reflecting full day's arc. Forced 3-section structure (Sessions / Index / Closing); empty Index sub-categories omitted at render; voice zones (Sessions + Closing) preserve Ruri-voice per `personality.md`. `de-output-integrity-checker.js` validates the 3 H2s + voice signals at Stop (warn-only, never blocks), (5) **Forge log review WITH DISCUSSION (refined 2026-05-08 evening)** — surface L1→L2 promotion candidates AS QUESTIONS to みや (not silent promote); review pending audit-log entries surfaced this session; ask みや for L2 sign-off where applicable. みや 2026-05-08: "we cannot consistently review at the end of the week, better at the end of a session." End-of-session > weekly cadence. (6) Observation log review — promote any T1→T2 if recurring confirmed, (7) **Gap Sweep — retrospective lens (NEW 2026-05-11, EXTENDED 2026-05-14 with etanah-knowledge sweep)** — Ruri surfaces 2-3 observations from the session that didn't bake into rules: positive trait candidates (good habits worth reinforcing), negative slip candidates (gaps worth catching), design observations (architecture decisions worth scheduling). **PLUS — etanah-knowledge sweep (2026-05-14 by みや after QA-260302 ind_skrin discovery)**: scan the session for architectural / DB-schema / workflow-routing / JSF-pattern / domain-business-logic discoveries that should land in an etanah-knowledge file. Categories to check:

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

Format: short bullet per gap with a one-line "what to do" suggestion. みや decides bake-now / defer / drop in one pass. Skip if no surfaceable gaps — never invent ceremony. **Why** (2026-05-11): tonight's retro happened because みや asked "is there anything at all that can be improved" — without the prompt, the 5 gaps would have stayed in Ruri's head and surfaced slowly via next-similar-slip. Standing Gap Sweep step makes retrospective continuous, not on-demand. **Why etanah-knowledge sweep (2026-05-14)**: triggers were end-of-quest-only (Phase 2 Carry-Forward); mid-session discoveries (today's `ind_skrin` / `ind_langkah`, bean conventions, composite-vs-bean naming trap) leak unless explicitly captured at session-end. (8) Closing words to みや — **MUST be wrapped in a fenced code block** (HARD 2026-06-02 per みや: *"Code block confirm for it to standout & easier to read"*). Format: opening fence → italic gesture + 1-2 sentence acknowledgment of the session arc → closing fence. Free-form prose inside; banner-style verbatim text NOT required (banner sits separately at Step 11/closing-banner), (9) Show change manifest (files touched), (10) **Auto-commit + auto-push** (refined 2026-05-13 evening by みや — promoted push from gated to silent): run `git add` + `git commit` on MemoryCore changes WITHOUT asking, using a session-summary message. **Commit-scope rule (added 2026-05-19 — CLAUDE.md-left-behind slip)**: "MemoryCore changes" = EVERY modified/untracked path in `git status`, NOT only files Ruri authored this session. Run `git status` FIRST; for each path either stage it or state why it is excluded; `git diff` anything Ruri cannot classify before deciding. Authorship is NOT a filter — a change Ruri did not type (e.g. みや's manual CLAUDE.md edits, which exist *because* CLAUDE.md is edit-blocked for Ruri) is still a wanted change that must reach main. Then immediately run BOTH `git push origin HEAD` (worktree branch) AND `git push origin HEAD:main` (FF main on remote) — silent, no permission ask. The permission rule `Bash(git push origin HEAD:main:*)` in `.claude/settings.local.json` (added 2026-05-13) enables harness-silent execution. Emit a 1-line confirmation after success (e.g. `Pushed to origin/main — <SHA>`). FF-only on main push; if divergence (rare — another worktree pushed first), surface the error and merge before retry. **Why auto-push** (2026-05-13 みや): *"since I've already added the permission, can we now make it automatic that you straight away pushed to github?"* Auto-commit was already established 2026-05-13 morning; permission rule + cross-worktree drift fix made the push gate redundant ceremony. Carves an explicit DE exception to `feedback_daily_commit.md`'s "never auto-push" rule (which was scoped to ticket commits, not MemoryCore sync). **Failure mode previously caught 2026-05-13**: 3 branches stranded by DE pushing worktree branch but never `HEAD:main` — `claude/reverent-heisenberg-a22d8e`, `claude/eager-clarke-d6dad5`, `claude/gifted-bartik-41d152`. Now propagation is atomic with the commit. (11) **Worktree & branch close** (added 2026-05-19 by みや): after step 10's push — reconcile + clean up so worktrees/branches never strand. (a) **Verify main is current** — confirm local `main` + `origin/main` sit at the worktree branch HEAD; if behind, `git checkout main && git merge --ff-only <worktree-branch>` then push. (b) **Content guard BEFORE any delete** — `git branch --no-merged main` + `git branch -r --no-merged main`; for each unmerged branch, audit its content (diff from merge-base) and salvage anything unique FIRST — NEVER delete on a commit-message guess (2026-05-19 slip: a "Salvage" commit message was trusted without content-verify; `/appraise` v1.1 was nearly lost). (c) **Stale-worktree + merged-branch cleanup now runs AUTOMATICALLY + SILENTLY at SessionStart** via `.claude/hooks/worktree-cleanup-boot.js` (prune → `git worktree remove` each merged `claude/*` worktree except the current one → `git branch -d` each merged `claude/*`; NEVER `main`, never the current worktree). **DE no longer sweeps worktrees/branches manually.** The current worktree can't self-remove (the session runs inside it) — it is auto-removed at the NEXT session's boot; optionally emit a one-line note `Worktree <name> merged — auto-removed next boot`. **Why moved here** (2026-05-30 みや): a deterministic SessionStart hook fires 100% of the time and keeps session-end lean — more reliable than a model-driven DE step. The hook only ever touches MERGED `claude/*`; salvaging UNMERGED content remains step (b)'s job above (the hook never deletes unmerged work). (12) **Run `/verify` skill — Checklist D** (added 2026-05-20 by みや — DE was running without cross-verification): emit ✓/🔴 table re-checking every step 1-11 fired with evidence. Same checkpoint-cross-check pattern as Phase 1 close-out (Checklist C). If any 🔴 — especially step 10's commit+push+**merge** or step 11's worktree close — fix and re-verify before truly declaring DE closed. The skill's Step-0 visible checklist is *Ruri's* gate; `/verify` Checklist D is *the external cross-check* that catches steps the gate noted as ⏭ but shouldn't have been (e.g. the 2026-05-20 slip where merge-to-main was deferred at step 11 without actually being unmergeable). |

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

## Quest State Transitions + active.txt schema (signals #2 + #3)

The full Quest State Transitions trigger table and the extended `active.txt` schema (6-status set, plus `branch` / `delegated_to` / `delegated_date` / `blocker` / `learning_marker` / append-only `notes:` fields) are the **canonical content of `quest/quest-protocol.md` → "Quest State File (`quest/active.txt`) + State Transitions"** (consolidated there 2026-05-22 — quest-cluster decomposition). Domain Expansion's boot autoscan and verbal-trigger mutations read from that single source; no duplicate copy is maintained here.

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

---

## Step 7.5 — IMPROVEMENT SWEEP (added 2026-08-05 per みや — MANDATORY, never optional)

> **みや's instruction, verbatim**: *"add this rule into our domain expansion. So that I don't have to
> always tell you to SPECIFICALLY try to search for points to improve our agentic system, our workflows,
> our debugging efficiency & accuracy, our etanah issues solving, our sweep. Add into it you will
> brainstorm to give suggestions in the save as well for ideas on how to improve that will be assessed
> as well during weekly audit."*

**Why this is its own step and not part of Gap Sweep (7)**: Gap Sweep is *retrospective* — it asks
"what surfaced this session that didn't bake into a rule". Step 7.5 is *forward-looking and
axis-driven* — it asks, against five fixed axes every time, "what would make the NEXT session better",
including ideas nothing this session forced. Folding it into 7 is how it would decay into "nothing
surfaced today".

### The five axes — sweep EVERY one, every DE. Never silently skip an axis.

| # | Axis | The question to actually answer |
|---|---|---|
| A1 | **Agentic system** | delegation shape, model tiering, fan-out contracts, controller verification, agent lifecycle/spend. What did the fleet do badly or wastefully? |
| A2 | **Quest workflow** | Phase 0 → Scout → Recon → Rubric → Apply. Which phase let something through, or cost time it shouldn't have? |
| A3 | **Debugging efficiency + accuracy** | how many build/test cycles did a diagnosis cost みや, and what would have collapsed that? Which claim turned out wrong and what evidence class would have caught it sooner? |
| A4 | **Etanah issue-solving** | knowledge gaps, analog-finding, module/scope traps, test-data derivation, BA-comprehension. |
| A5 | **Sweep / file sweep** | `0. Brief/` reading discipline (text vs image vs video), multi-ticket sweep shape, retrieval, evidence manifests. |

### Required output — two parts, both written, not just spoken

**(a) ASSESSMENT** — what this session actually showed, measured, with the instance that proves each
point. Append to (or create) `system/agentic-ticket-workflow-assessment-<YYYY-MM-DD>.md`. Name failure
classes; each class carries the concrete instance. **Banned**: aspirational prose with no instance.

**(b) BRAINSTORM** — forward ideas, including ones this session did not force. Each idea gets a row in
the weekly-audit feed so it is actually ruled on rather than admired:

```
node core/slips.js add --type proposal --category <A1|A2|A3|A4|A5> --evidence "<idea + its eval case>" --caught-by self
```

These surface in `system/slip-dashboard.md` under **💡 Open proposals**. The weekly audit rules each
one **BUILD / DROP / DEFER-with-date**. A proposal sitting unruled for >14 days is itself a finding —
that is the "parked enforcement row" failure (2026-07-22, the No-Resit gate that cost two days).

### Quality bar

- An idea must name its **eval case** — the concrete situation that would prove it works. No eval case
  means it is a wish, not a proposal.
- Prefer **mechanical** over prose: a hook that counts something beats a rule that asks me to remember.
  Tonight's proof — the multi-dimensional-evidence rule existed as prose since 2026-05-14 and was
  ignored on the one ticket where the image was decisive.
- Say plainly when an axis genuinely yielded nothing: `A3 ⏭ no debugging this session`. Silence on an
  axis is banned; an honest empty is fine.

**Banned**: closing DE with Step 7.5 unrun · assessment written but no proposal rows logged · proposals
logged with no eval case · skipping an axis without an explicit one-line reason.

---

## Step 2b — SAVE EVERY QUEST TOUCHED THIS SESSION (added 2026-08-06 per みや — MANDATORY)

> **みや's instruction**: *"1. save everything about this ticket. 2. perform domain expansion… 4. improve
> domain expansion so that I don't have to write all of this."*

**Why this is its own step**: DE persists the SESSION (step 2 `current-session.md`) and the DAY (step 4
diary) — and never the **ticket**. The quest doc is the file the next session of that quest actually
opens, and nothing in the 18-step ritual wrote it. So みや had to name it by hand every close. Proposed
2026-07-20 in `todo.md` Q1 after he asked *"did you save 239386's progress into its quest md?"* — answer
was no — and broadened 2026-07-21 to every quest touched, not just the one marked `active`. Built here.

**The failure it kills is specific and was demonstrated the same day**: on 2026-08-06 the resume contract
found commit `8bd34da47c` — a fix for #273461, pushed two days earlier — while that ticket's own qa_doc
still read *"Phase 0 only. No code changed."* A quest doc that is never written at close does not merely
go stale; it comes to assert the opposite of what happened.

### What runs

For **every** quest whose `qa_doc` was touched this session, or whose `active.txt` block has
`status ∈ {active, hold, blocked, delegated}` and which moved at all, append a dated block covering:

| Row | Content |
|---|---|
| Phase / status | where it now sits, in the canonical enum |
| What moved | commit SHA + branch + env merge if it shipped; findings if it did not |
| Delivery channels | 🚨 name **every** channel, including the ones git cannot see — a SQL/doc **attachment on Redmine** is invisible to branch-based release recon (#269802 2026-07-17, #273461 2026-08-06) |
| Resume point | the exact next action, cold-reader complete |
| Deferrals | the `## Deferred to follow-up` table, every row with a Home |
| 🚨 Uncommitted work (added 2026-08-16, per みや "critical details for quest to continue another session pose a risk") | any code/script sitting UNCOMMITTED anywhere: repo + branch + file path + what it does + what it awaits. The 275500 lesson: a fix uncommitted on `mlk/master` survived only because a hook banner happened to carry it — the qa_doc, not a banner, must own it |
| Pending nods | every open decision みや hasn't answered yet, verbatim options |

**Then reconcile the copies.** A qa_doc under `projects/` exists in BOTH the main repo and the worktree,
and hooks read the **worktree** copy while the durable content lives in **main**. Writing one and not the
other is why the deferrals gate reported a section as missing on 2026-08-06 that had in fact been
written. Sync them in this step, not at commit time.

**🚨 Branch-ledger sweep (added 2026-08-13 per みや, after the #273461 baseline miss)** — run
`node quest/branch-ledger-check.js --all`. It reads `active.txt` for every OPEN quest, and for any whose
fix is **STACKED across rework branches** (`…/<num>vN`), FAILS unless each branch is classified in the
quest MD's Branch ledger (`branch — TAG — note`; TAG ∈ `+ADD ~CHANGE *CANONICAL -NEGATIVE`). Any 🚨 →
classify before closing DE. This is the session-close half of the guarantee; the baseline half is
`audit-ticket.js` at release Phase A. **Why**: the branch-note can't rely on memory — git always knows the
vN branches exist, so a tool that reads git and blocks is the only real guarantee. `-NEGATIVE` branches
still on origin are surfaced for deletion (a wrong branch left alive is the next v2/v3 trap).

**Verified by**: step 12.6 `resume-readiness.js` — 2b is the WRITE, 12.6 is the READ-BACK. A `✗` there
means 2b did not actually run for that quest.

**Banned**: closing DE with a quest that moved this session and whose qa_doc carries no entry for it ·
writing only one of the two copies · `⏭` without naming the quest and why it genuinely did not move.

---

## Step 12.5 — meta-audit (added 2026-05-23, Phase 6 of system-layer build)

After Step 12's `/verify` Checklist D goes green, run a **meta-audit** pass before declaring DE closed. Covers the system-layer's recursive-safety concerns (Stage 5 self-enforcement).

| Sub-check | What it verifies | How (sources re-pointed 2026-08-16 — hook-fire-log.md + skill-failure-log.md DELETED in tombstone sweep) |
|---|---|---|
| **Hook-fire reliability + component-liveness** | Registered components actually fire; silent ones surfaced | `node lib/liveness-report.js --summary` — one line; if 🚨 count > 0, read `system/liveness-dashboard.md` flags. ⚠️ bare-registered hooks (e.g. `system-edit-gate`) are invisible to telemetry — a flag on one of those means "unobservable", not "dead" (wrap-all fix pending) |
| **Cross-reference validity** | Every link in `system/INDEX.md` + sub-indexes resolves to an existing file | Glob each cited path; flag broken links |
| **Bounty debt** (added 2026-08-16 per みや "truly reflecting the bounty part") | No quest closed/archived this session without its bounty harvest | Compare this session's `status→closed/archived` flips against `domain/quest-bounty/log.jsonl`; any missing → run `/quest-bounty` or surface as Standing Flag |
| **Skill-load counter** | ⏸ NO SOURCE since 2026-08-16 — skill invocations are unlogged (named observability hole) | Suspended until the Skill-tool PostToolUse logger ships; do not fake this check |

**Output:** silent if all sub-checks pass; one inline table surfaced ABOVE the DE closing banner only when ≥1 sub-check fails — `| Sub-check | Status | Detail |`.

**Banned:** declaring DE closed without running this audit. Same shape as Standing-flag staleness audit (Session Briefing 2026-05-20) — verify-before-close, not after.

---

## Step 12.6 — Resume-readiness sweep (added 2026-06-28 per みや)

Before the closing banner, run `node domain/checklist-reactivate/resume-readiness.js` (no arg = all open quests). It deterministically checks every open quest's `qa_doc` is **cold-resume-complete** — active.txt fields + Resume Point + test permohonan ID + login + Next-Steps Checklist + full file path + build/deploy step. Any `✗` or `🔴 unreadable` → fill the qa_doc gap BEFORE close, OR surface it in the Handoff Block (Step 13) if it can't be filled this session.

**Why** (みや 2026-06-28): a familiar cold-resume test found 3 gaps in a saved qa_doc (no test-app ID, abbreviated `L8:33` paths, no build step) — the curse-of-knowledge: the doc was written for a context-sharing reader, not a cold one. DE previously had NO qa_doc resume-check, so those gaps would survive session-end untouched. This sweep is the standing fix — the familiar cold-resume test as a deterministic gate. Third leg of the resumability trio: `/checklist` persists → `checklist-show.js` reactivates → `resume-readiness.js` verifies.

**Banned:** declaring DE closed with an open quest's qa_doc carrying unfilled `✗` resume-gaps + no Handoff note.

---

## Step 13 — Handoff Block — tiered (added 2026-05-24 evening; tiered 2026-05-26 after session-end overload slip)

**Default is SILENCE.** A PARTIAL ⚠ step does NOT automatically warrant a Handoff Block. The criterion is *blocked work or stranded state* — not *anything that could be cleaner*.

### Tier classification (mandatory before emitting anything)

| Tier | Trigger | Format |
|---|---|---|
| **Tier 0** (default — expected for routine PARTIALs) | All PARTIAL items either (a) resolve naturally on みや's next routine `git` interaction in the affected worktree, OR (b) are pure cosmetic cleanup with no work blocked | **Emit nothing.** Note the lag silently in DE step status if needed. |
| **Tier 1** (single must-do action, non-destructive) | Exactly ONE action where みや MUST do something that won't self-resolve, AND it's a single command or trivial sequence | **One sentence** inline after DE banner. No block. No PowerShell wall. No per-step justification. Example: `Parent main lags 1 commit — pull when convenient.` |
| **Tier 2** (multiple non-destructive actions OR a sequence) | ≥2 must-do actions OR a multi-step sequence, all non-destructive | **Brief numbered list** (≤5 lines). Working dir cited once at top if all commands run from the same path. No per-step "why this is yours" table. |
| **Tier 3** (destructive OR cross-repo OR explicit request) | ANY destructive action (rm / reset --hard / force-push / branch -D / file delete) · commands spanning multiple repos in a sequence · みや explicitly asks "show me the commands" | **Full delimited block** as originally spec'd: numbered steps · working dir per command · why each step is yours · post-state guarantee. The safety wall earns its weight here. |

### Trigger criterion (tightened)

A PARTIAL ⚠ qualifies for Handoff ONLY IF *all* of the following hold:
- The next routine `git` interaction in the affected worktree will NOT resolve it
- Leaving it unhandled blocks future work OR strands committed content
- It is NOT pure cosmetic cleanup (ghost metadata, optional worktree removal, doc tidying)

If ANY of those fail → it's a Tier 0 silent note, not a Handoff item.

### Banned

- Emitting Tier 3 when Tier 1 fits — overload that doesn't serve みや
- Bundling optional cosmetics into the same block as a real must-do (presentational inflation)
- Burying handoff items in prose / closing-words / change manifest / verification table (original ban preserved)
- "I included it just in case" — Tier 0 exists for "just in case" items

### Why both bans matter

**2026-05-24 evening**: DE Round 3 buried real actions in prose; みや asked *"Do I still have to push or what?"* — the original Step 13 spec was the fix.

**2026-05-26**: DE close emitted Tier-3 wall for a Tier-0 situation (parent main lag resolves on next pull; ghost-worktree cleanup is purely cosmetic; sibling worktree removal is optional). みや: *"Just a simple decision question would've been."* The tier system is the fix — same safety principle (no buried actions) but with default-silence instead of default-exhaustive.

### Session-items surfacing (preserved from original spec)

### Session-items surfacing (added 2026-05-25)

Before emitting the closing banner — read `.claude/state/session-items.md` "Active items" section. If any items with status `proposed` or `in-progress`:

- Fold them into the Handoff Block under a `📌 Session items pending` row (or add as its own table row group if multiple).
- Include item ID + short description + "needs your nod" / "in progress" framing.
- If migration to todo / standing-flag happened during this session — note in `📦 Session-item moves` row (audit trail).

**Banned**: surfacing session-items mid-conversation as alarms/bells (per みや 2026-05-25). Only at DE close / Quest Postscript / save commands.

**Pre-add gate** (referenced from `.claude/state/session-items.md`): before ANY addition to session-items, check (1) could Ruri fix this in-turn → FIX NOW don't add, (2) is it todo.md material → add there instead, (3) is it standing-flag material → add there instead. Only genuine cross-turn-within-session pending items go to session-items.

---

*Updated 2026-08-05 — **Step 7.5 IMPROVEMENT SWEEP added (MANDATORY)** per みや: five fixed axes (A1 agentic system · A2 quest workflow · A3 debugging efficiency+accuracy · A4 etanah issue-solving · A5 sweep/file-sweep), swept every DE, producing (a) a dated assessment under `system/` with a concrete instance per claim and (b) brainstormed proposals logged via `core/slips.js --type proposal` into the new 💡 Open proposals lane of `slip-dashboard.md` for weekly-audit ruling. Paired `core/slips.js` change: `type=proposal` split out of the slip counts and given its own dashboard section, because filing an idea as `upgrade` reads as shipped and makes an open decision invisible (the 2026-07-22 parked-enforcement-row failure). Rationale: みや had to ask for this assessment explicitly two goals running — a thing he must repeatedly request is a missing step, not a missing effort.*

*Created: 2026-05-05 | Protocol owner: Ruri | Review at every Forge Review until L4 stabilization*
*Updated 2026-08-16 — Step 2b +2 rows (Uncommitted-work · Pending-nods, the 275500 lesson) · Step 12.5 re-pointed onto live sources (liveness-report + slips.jsonl; deleted hook-fire-log/skill-failure-log refs fixed) + Bounty-debt sub-check + skill-load check honestly SUSPENDED. Prev: 2026-05-23 Step 12.5 added.*
*Updated 2026-05-24 evening — added Step 13 Handoff Block (post-Round-3 slip)*
*Updated 2026-05-22 — added step (0b) worktree/branch sync check (みや): detect worktree-vs-main + pull origin/main early if a worktree branch is behind. Earlier 2026-05-22 — signals #2/#3 (Quest State Transitions + active.txt schema) de-duplicated to a cross-ref; canonical home is now `quest/quest-protocol.md` (quest-cluster decomposition).*
*Last updated: 2026-05-30 — Step 11 (Worktree & branch close): retired sub-parts (c) Sweep stale worktrees / (d) Delete merged stale branches / (e) current-worktree flag — that cleanup now runs AUTOMATICALLY + SILENTLY at SessionStart via `worktree-cleanup-boot.js` (v1.2, which now also removes merged `claude/*` worktree directories, not just branches). DE retains only (a) verify-main-current + (b) salvage-unmerged-content. Per みや: a deterministic SessionStart hook fires 100% of the time and keeps session-end lean.*
*Updated 2026-05-26 — Step 4 wording updated to use the new 3-section diary template (Sessions / Index / Closing) per `daily-diary/diary-format.md`. Empty Index sub-categories omitted at render. `diary-format-gate.js` Stop hook validates the 3 H2s (warn-only). Phase 1 of diary redesign per `~/.claude/plans/yes-very-much-catches-squishy-cake.md`.*
