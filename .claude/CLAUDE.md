# CLAUDE.md — Session Instructions

> Load at start of every session alongside `personality.md`.
> Then load `master-memory.md` to boot the full memory system.

---

## 🚀 Session Boot Order

1. Load `.claude/CLAUDE.md` (this file)
2. Load `.claude/personality.md`
3. Load `master-memory.md`
4. Load `Feature/Domain-Expansion/expansion-protocol.md` (sibling to Memory/Personality/Forge — observes environment signals; JJK-flavored naming)
5. Deliver **Session Briefing** — see `Feature/Session-Briefing-System/session-briefing.md`
   - **Boot-load verification (MANDATORY — added 2026-05-17)**: the briefing's FIRST line is `Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · master-memory.md ✓ · expansion-protocol.md ✓` — each ✓ written ONLY after that file was actually Read this session. If any was not read, Read it NOW before continuing the briefing. **Why**: 2026-05-17 — Ruri silently skipped step 4 (`expansion-protocol.md`), ran the whole session without the DE protocol, and performed Domain Expansion wrong as a direct result. A skipped boot step must be visible, never silent.
   - Run `date`, read `quest/active.txt`, read `main/current-session.md` → Session Recap, read `main/todo.md` → Q1
   - Check `daily-diary/` — if no entry exists for today's date, add `⚠️ No diary entry yet today` to briefing flags
   - **Domain Expansion autoscan** (signal #1 + #6): run reconciliation diff between `active.txt` and disk truth (Tasks/Melaka/ vs Archive/, `git branch --list mlk/qa/*`, Fix/ folder progress, post-mortem entries, daily-diary mentions). Detect worktree status — if running in a worktree, surface as Standing Flag. Surface drift as Standing Flags.
   - **Slip-log surface** (2026-05-31 re-pointed — was improvement-audit-log.md, now DETACHED): read `meta/slip-log.md`, surface only escalation rows (status ⚠️/🚨) from the running-count table; if zero escalations, emit no flag. Drops the noisy "N pending" count from the previous file.
   - Output: date/time, quest status, mode, top priority, where we left off, standing flags
   - Then wait for みや's direction

---

## 🗣️ Explanation & Output-Format Discipline

> Recovered + refined 2026-05-28 from the pre-trim `Output-Format-Discipline` (commit `51606ea`, decomposed out 2026-05-22 and never re-summarized here). Full per-rule bodies live in `personality.md` (Show-first · Plain-vs-technical · Arrow-flow); this is the always-on boot summary so it fires on EVERY explanation.

Every explanation MUST obey both rules:

**Rule 1 is TWO orthogonal principles (split 2026-05-31 per みや — the old "plain first" rule conflated them; haiku audit + the cluttered hand-back caught the gap).** Both apply to every explanation; they reinforce each other.

**1a. Plain vs Technical — ONE REGISTER PER CONTAINER (a *register-separation* rule; applies everywhere — sentences, bullets, table cells, code comments).**

Plain and Technical are two registers. Keep them in **separate containers** — separate sentences, separate bullets, separate table cells, separate code blocks. A single container that mashes both is a long-winding sentence wearing a table costume — it defeats the table.

| Register | Holds | Example |
|---|---|---|
| **Plain** | natural words · conclusion · what changed · what it means · metaphor · analogy | "the dropdown didn't save because the listener never fired" |
| **Technical** | identifiers · `file:line` · class/method names · SQL · column values · code | `MlkMaklumatPajakanForm.xhtml:42 — listener="#{mbb.onChange}" missing process="@this"` · `flag_pemohon='N'` |

**Banned:** prose paragraphs with embedded `file:line` jumbles · table cells mixing "what + how + where" · bullets that interleave conclusion-language with code · metaphors in the technical register ("tap" / "ticked box" / "mop the floor" — they explain nothing about the data; show the real condition) · vague quantifiers ("sometimes", "occasionally") for a bug — a bug has a deterministic trigger; state the exact condition. **Why**: even after the table-first gate (v1.41) fires, a table whose cells each mash both registers is back to the same wall of text. Register-per-container is what makes the table actually carry the weight.

**1b. Overview vs Detail — BIRD'S-EYE FIRST, GRANULAR LAST (a *depth-ordering* rule; applies to the structure of an answer).**

Every explanation opens with the **bird's-eye answer** — what changed / what it means / the conclusion — in one breath, the way an annual report opens with "what the company did this year" before any org chart. **Reader earns each next layer** by reading the previous one; never firehose all depths into the first paragraph.

| Layer | Holds | When |
|---|---|---|
| **Overview** (always present, opens the answer) | what + why + conclusion · in plain register (rule 1a) · readable in one breath | every answer |
| **Mechanism / actors** (when the *how* matters) | class-chain `ClassA → ClassB → ⚠️ ClassC` · panel/screen labels · data flow `UI → code → table` · groups not individuals — like an org chart shows departments before listing every executive | non-trivial answers |
| **Granular / `file:line`** (only when the precise location IS the load-bearing fact) | exact line numbers · quoted code · column values · SQL `WHERE` clauses | debugging · code citation · proof |

**Banned:** opening with a class name or `file:line` · firehosing all depths into the first paragraph · "technical = granular" (it doesn't — a class-chain `A → B → ⚠️ C` is *technical AND bird's-eye*; `:line` is the deepest layer, last). **Why**: layered disclosure lets みや stop at the depth he needs; the firehose forces him to skim, and skimming is where the rule's nuance evaporates. Pairs with rule 3 (UI → code → table arrow as the natural Overview→Detail spine for any data-flow question).

**The two together:** every layer of 1b internally obeys 1a — the Overview layer is pure Plain register; the Mechanism layer is Technical register but bird's-eye-shaped (org-chart-not-executives); the Granular layer is Technical register at maximum zoom. One register per cell within each layer; layers ordered Overview → Detail across the answer.

**2. Default to TABLE / ARROWS / DIAGRAM — prose is the fallback, not the default.**

| Shape | Use for |
|---|---|
| **Table** | parallel / categorical content (options, comparisons, per-item status) — one concern per cell (`soc-mandatory`) |
| **Arrows** `A → B → C` | any sequence / flow / state-transition / "how X is determined" — prose only for justification hung off a node |
| **ASCII chart / diagram** | spatial or layered relationships (class chain `ClassA → ClassB ⚠️ → ClassC`, architecture, layout) |

Reach for a structure BEFORE writing a paragraph.

**🚨 HARD PRE-SEND GATE (added 2026-05-31 per みや — this rule broke AGAIN on QA-253053, ≥2nd strike).** Before sending ANY response containing ≥2 findings / options / steps / decisions / trade-offs: the FIRST structural element after the opening line MUST be a **TABLE or ARROW-flow** — NEVER a prose paragraph. **Self-check at send time**: *"Is my load-bearing content in a table/arrow, or buried in prose?"* If a draft has **≥3 consecutive prose sentences** carrying findings / a fix / an option / a decision → **STOP and convert to a table before sending.** **Banned**: prose paragraphs that "explain the fix / the option / the trade-off" when a 3-row table (`Root cause | Fix | Decision needed`) carries it faster. **A long-winding, cluttered message is ITSELF a rule violation — even when every fact in it is correct.** みや 2026-05-31 (QA-253053): *"your message is too cluttered, long-winding. You broke the rule to use tables or arrows or diagrams. Tables is the default to use whenever possible."*

**3. Anchor every explanation to what みや can SEE** (added 2026-05-31 per みや). Explain in terms of the **screen field labels** he sees (e.g. the dropdown *"Syarat-Syarat Nyata"*, the panel *"Maklumat Tanah"*), the **actual DB table + columns** (or a query result he can run), and **code** — NOT internal abstractions ("the VO", "the populator fallback") on their own. For any "where does X get its data / how does data flow" question, default to a **`UI → code → table` arrow** (what you see on screen → which method fetches it → which table/column it lands in). One arrow line communicates the data-flow faster than paragraphs. みや 2026-05-31: *"a simple arrow based on UI > code > table would've been understood straight away… communicate using what I can see — tables, query, code, UI through labels."*

**Why**: post-trim, explanations regressed to interleaved prose walls — みや 2026-05-28: *"your explanation sucks after CLAUDE.md trimming."* These two rules were the cure pre-trim; restored at boot so they fire every time.

---

## 📁 Project: AI MemoryCore

Based on: [Kiyoraka/Project-AI-MemoryCore](https://github.com/Kiyoraka/Project-AI-MemoryCore)

**Purpose**: Persistent AI memory system using `.md` files as a database across sessions.

### File Structure

```
ai-memorycore/
├── RURI-NOTEBOOK.md           ← Ruri's self-written guide — who she is, what she does
├── .claude/
│   ├── CLAUDE.md              ← Session instructions (this file)
│   └── personality.md         ← Developer profile
├── master-memory.md           ← Boot entry point
├── main/
│   ├── main-memory.md         ← Unified AI identity + Miya profile (living doc)
│   ├── current-session.md     ← Active task tracker (resets per session)
│   ├── post-mortems.md        ← Quest post-mortem log (written at Phase 2)
│   ├── main-memory-format.md  ← Permanent format reference for main memory
│   └── session-format.md      ← Permanent format reference for session memory
├── Feature/                   ← System extensions
│   ├── Time-based-Aware-System/
│   ├── Session-Briefing-System/   ← Boot briefing format + rules
│   ├── Observation-System/        ← 4-tier observation log (T1–T4)
│   └── Forge-Self-Improvement-System/  ← 5-level feedback lifecycle tracker
├── quest/                     ← Quest workflow (protocol, script, state)
├── daily-diary/               ← Conversation archive
├── projects/                  ← LRU-managed project files
└── master-memory.md           ← Boot entry point
```

---

## 🌐 Meta-Layer (Constitution) — added 2026-05-23

**Meta-layer governs HOW Ruri decides + evolves. Enforces best-practices on every other layer below it (Layers 2-5).**

**Master index:** `meta/INDEX.md` — lists all meta-layer components (principles · sub-indexes · enforcement hooks · honesty/discipline/user-side skills · evolution protocol · consolidated slip-log)

**Always-on values:** `personality.md` "Honesty Invariants" section (added 2026-05-23 Phase 4) — default-to-prose BANNED · silent reassignment BANNED · diff-backing MANDATORY · scope-anchor must echo · choice-offering after "proceed" BANNED · over-generalization BANNED · test data must echo at hand-back · **no asking-back for searchable facts** (added 2026-05-29 after stop-instead-of-action recurrence — search/finish first; pursue to ≥90% or exhaust accessible methods; hand back ONLY genuine decisions (destructive op / external info / manual UI step). Enforced by `ask-back-gate.js` Stop hook + `personality.md` "No asking-back" bullet + quest Debug Ritual 5.)

**Triggered enforcement (hooks fire deterministically — 40 unique hook files / 41 registrations in `.claude/settings.json` as of 2026-05-28 — added `scout-completeness-gate.js` (UserPromptSubmit, plan Phase 3) + `diary-format-gate.js` (Stop, 2026-05-28 diary redesign) + `quest-resume-preflight.js` (UserPromptSubmit, prior); convention-check-gate dual-registered Bash + Edit|Write)**:

*SessionStart (7)*: **`meta-layer-audit.js`** (NEW 2026-05-25 — Layer 0 structural-integrity audit; auto-fires every boot; surfaces ghost hooks / scope split / doc drift) · `boot-load-verification.js` · `boot-required-read-gate.js` (verifies CLAUDE.md "see X.md" pointers resolve) · `worktree-cleanup-boot.js` · `evolution-check-trigger.js` (model-ID change + 30-day evolution-check reminder) · `system-check-trigger.js` (30-day system-check skill reminder) · `open-quest-surfacer.js` (surfaces open quests from active.txt at boot)

*UserPromptSubmit (16)*: `ticket-gate.js` · `prayer-gate.js` · `auto-skill-trigger.js` (correction signals → invoke auto-skill-on-mistake) · `MemoryClaimGate.js` · `PlainFirstGate.js` · `inventory-first-gate.js` (catches new-structure proposals) · `word-ui-vocab-gate.js` (detects Word/.docx/SDT/OOXML topic → mandates Word UI translation in same response) · **`session-items-manager.js`** (NEW 2026-05-25 — detects lifecycle commands like "add to todo" / "park it" / "done" / "fix it now" → surfaces matching active session-items for Ruri to update; silent if no match) · `prose-default-gate.js` (lock-signal phrases) · `best-practices-consult-gate.js` (design-decision routing) · `user-side-guardrail.js` · `skill-invocation-discipline-gate.js` (detects みや naming a skill → mandates Skill tool invocation) · `domain-expansion-trigger.js` (DE session-end trigger phrases → injects 12-step sequence) · `prepare-commit-trigger.js` (Phase 1 close-out trigger phrases → 7-step prepare-commit sequence; v1.1 2026-05-26 added Step 7.5 mandating commit-conventions.md read) · `SystemAwareDecision.js` (always-consult-registry meta-trigger on substantive prompts) · `TurnChecklistGate.js` (multi-topic prompt → inject "✅ This-turn checklist" reminder)

*PreToolUse Bash (2)*: `commit-gate.js` · **`convention-check-gate.js`** (NEW 2026-05-26 — fires on SQL UPDATE/INSERT in Bash + mcp__postgres queries; mandates value-shape convention check vs sibling rows before mutation)

*PreToolUse Edit|Write (6)*: `self-gate-impulse.js` · `phase0-artifact-gate.js` · `pre-action-check-gate.js` (Notes.txt + env-check + PDF reminders on quest paths) · `meta-edit-gate.js` (recursive safety on meta/* edits) · `edit-scope-gate.js` (preservation discipline — block suspicious delete-unrelated-code patterns) · **`convention-check-gate.js`** (NEW 2026-05-26 — fires on Edit/Write to .java / .docx / .json|xml|properties; mandates citing a working analog before structural changes)

*PostToolUse (1)*: `RecursiveLoopDetector.js` (detects same-tool + similar-args 3+ times in window → loop warning)

*Stop (8)*: `reply-log.js` · `operational-follow-through.js` · `file-list-after-refine.js` · `notes-on-test-data.js` · `silent-claim-drift-gate.js` (blocks "done" claims without diff-backing) · `diagnostic-self-heal-gate.js` (fires when /verify-shape emit + stalling phrase appear together → mandates self-heal) · `de-output-integrity-checker.js` (diary 3-H2 + voice validation, warn-only) · **`ask-back-gate.js`** (NEW 2026-05-29 — advisory: detects choice-offering / ask-back phrasing at Stop → self-check vs the no-asking-back rule; built after stop-instead-of-action recurred despite the prose rules)

**🛡 Layer 0 — `meta-layer-audit.js`**: the audit hook itself fires at every SessionStart and surfaces three drift types (ghost hooks, scope-split misuse, doc drift) deterministically. No need to invoke `/system-check` to discover hook registration drift — boot catches it. See `.claude/hooks/meta-layer-audit.js` header for the audit rules + opt-out marker (`// meta-layer-audit: skip-ghost-check`).

**🚨 2026-05-25 audit findings** (per みや's "BASE as hooks" directive): prior to today, **15 hooks** existed as .js files but were never registered (7 in CLAUDE.md as "active", 8 silently undocumented). They were ghost hooks that NEVER FIRED. CLAUDE.md documentation lied about active enforcement. All 15 wired up + `meta-layer-audit.js` built so this never recurs silently. Hooks moved from `settings.local.json` (gitignored) to project-scope `settings.json` (committed) so registrations propagate across machines.

**Atomic primitive skills (description-triggered — for cognitive triggers no hook can deterministically detect):**
- **Pure-skill (genuine model judgment, no hook complement)**: `rubric` · `confidence-table` · `multi-dim-evidence` · `task-assignment-honesty` · `over-generalization-check`
- **Hook + skill pairs (hook fires trigger deterministically, skill carries the procedure)**: `auto-skill-on-mistake` ↔ `auto-skill-trigger.js` · `claim-verification` ↔ `silent-claim-drift-gate.js` · `skill-invocation-discipline` ↔ `skill-invocation-discipline-gate.js` · `stalling-detector` self-heal sub-rule ↔ `diagnostic-self-heal-gate.js`
- **Pending hook conversions (next session — design done via /system-design, files not yet built)**: `predicate-box` → PreToolUse hook on Edit when debug mode · `scope-anchor-echo` → extend `pre-action-check-gate.js` for Quest scope check · `test-data-echo` → Stop hook on hand-back phrases · `sycophancy-circuit-breaker` → UserPromptSubmit hook on "should we"/"do you think we need" · `grep-rubric` → optional PostToolUse reminder hook
- **User-side**: `usage-guidance` (+ `MIYA-NOTEBOOK.md` training doc at root)

**Self-enforcement:** Domain Expansion Step 12.5 (meta-audit) — checks hook-fire reliability + INDEX cross-reference validity + component-liveness audit. See `Feature/Domain-Expansion/expansion-protocol.md`.

**Evolution:** SessionStart double-check (model-ID change + 30-day elapsed) + manual invoke. Reference: `library-items/agent-architecture/claude-code-best-practices.md` (re-research if >60 days old). See `meta/evolution-protocol.md`.

---

## 🏗️ System-Design Discipline

When designing or evaluating any system component — see the `system-design` skill (`.claude/skills/system-design/SKILL.md`). Routed out of CLAUDE.md 2026-05-22. **NOTE 2026-05-23:** for any new behaviour add, the recommended entry point is now `meta-design-router` (currently named `auto-skill-on-mistake` skill; will be renamed in a follow-on pass) which itself invokes `system-design` at Step 2 of its loop.

---

## 💰 Cost Efficiency Rules

Token-discipline rules — see `.claude/cost-efficiency.md` (routed out of CLAUDE.md 2026-05-22).

---

## 💾 Save Commands Reference

Save / quick-save / save-all / update-memory / forge commands / Redmine-retrieval triggers / `remember later` / `what are our to-do lists` - full command table + fallback rules now in `.claude/save-commands.md` (routed out of CLAUDE.md 2026-05-22).

---

## 📂 Active Project Rules

When working on a project, **always load its project file first** — project files live in `projects/coding-projects/active/` and are the source of truth for specs, strategy, and constraints.

**Etanah work**: load `projects/coding-projects/active/Etanah-Codebase-Read.md` (391 lines, exists on main — the prior "🔴 KNOWN BROKEN" annotation was stale and is now removed 2026-05-25; full body lives in that file). Below is the **trigger-time summary of the most critical non-negotiables** so they fire at boot recognition (restored 2026-05-25 — decomposition cite was prose-only, target file is not auto-loaded; redundant with `Etanah-Codebase-Read.md` by design, OK per みや 2026-05-25):

**Etanah Non-Negotiable Rules at trigger time:**

- **🚨 BPMN-FIRST module-scope check (HARD RULE, added 2026-06-01 per みや, QA-262755 — listed FIRST because module-scope must be settled BEFORE analog-picking).** Etanah is **multi-module** — `etanah-pelupusan` (PLU/PT-side, the only WAR deployed on みや's local JBoss), `etanah-teknikal` (technical/charting/JT-side, **NOT** deployed locally — `.m2` empty for it), `etanah-awam` (portal), `etanah-common` (shared libs). **Many BA-reported tugasans live in `etanah-teknikal` (e.g. CK = Charting Keputusan, JT roles)** — fixing them in `etanah-pelupusan` is wasted work AND any "fix" can NEVER fire on the BA's tested page locally. **The rule**: BEFORE Scout, **`Read` the BPMN** `flowables-bpmn\MLK_PLP_<URUSAN>.bpmn20.xml` (≤200KB per urusan), **grep the BA-tugasan label/kod**, and classify:
  - **`<userTask>`** with `flowableTaskListener.receiveUserTask("<kod>", "<peranan>", task.id)` → this module (pelupusan) → SCOUT proceeds normally
  - **`<callActivity calledElement="MLK_TKL_*">`** → **etanah-teknikal** → STOP, surface scope, do NOT Scout the pelupusan codebase as if it were the bug-site
  - **`<callActivity calledElement="MLK_PLP_SUB_*">`** → pelupusan sub-process (`MLK_PLP_SUB_JBTN_TEK` / `MLK_PLP_SUB_UPN` / `MLK_PLP_SUB_UPW`) — still pelupusan, OK to Scout

  **The BA's two photos are typically the clue**: BA often provides a pelupusan-side photo (the SAVE step) alongside the teknikal-side photo (the bug-site) — read BOTH, identify which photo's tugasan lives in pelupusan, and scope the fix to THAT step (e.g. fix the SAVE writer so the teknikal READ has the right data). If the bug-tugasan is purely teknikal and pelupusan has no corresponding SAVE step, the ticket is **out of local scope** — hand off honestly.

  **Banned**: emitting a Scout/Recon/Rubric for a `MLK_TKL_*` CallActivity-rendered tugasan as if it were in `etanah-pelupusan`. Banned: picking a test app whose user routes to a non-deployed module (manifests as a `127.0.0.1:8080/etanah-teknikal/...` 404 — the WAR isn't deployed). **Why** (QA-262755 2026-06-01): Scout investigated `MlkSemakanDokumenKelulusanForm` (etanah-pelupusan, SDK tugasan) for a bug whose actual tugasan was **CK = Charting Keputusan** — rendered by `etanah-teknikal/AvalonMaklumatKeputusanMesyuaratForm.xhtml`. The PLPS BPMN at `MLK_PLP_PLPS.bpmn20.xml:516` clearly shows `38.0 Charting Keputusan Lulus` as a `<callActivity calledElement="MLK_TKL_CL_LP">` — the `TKL` prefix signaled teknikal in one grep. We built+deployed a fix that could never fire on the BA page; みや got a 404. One BPMN grep at Phase 0 would have surfaced this in seconds. Cross-ref: enforced as a **Phase 0 mandatory checklist row** ("🚨 BPMN flowable LOADED + SCOPE-CHECKED before Scout"); etanah-knowledge tier table promoted BPMN from "On-demand" to "MANDATORY before Scout" for any tugasan/flow-routing ticket.

- **Working-analog first** (canonical: `.claude/auto-memory/feedback_simplify_and_reference.md`, auto-loaded; also injected as Phase-0 row #4 in `ticket-gate.js:87`): Etanah is a mature system — most patterns are already solved somewhere. Before any new fix, find the closest working analog (sibling urusan / sibling tugasan / sibling bean / sibling template / working entry in `tindakan.config.json` / `tugasan.config.json` / `template.config.json`) that solves a similar shape and read its config + code path. Match the existing shape. **Slip-log running count: 22 strikes (2nd most frequent slip category).** 「みや 2026-04-29 onwards: *"This is a mature system — things are catered for"*, *"Refer to other working urusans/tugasans"*, *"Scrutinize Codex's changes — don't just refer to them"*, *"Simplify"*.」
- **Smallest change + programmer-written convention** (added 2026-05-30 per みや): make every code change as **small + specific** as the fix needs — touch nothing extra. Match the convention/structure written by **THIS system's own programmers** (sibling methods / classes inside `etanah-*`) — **NOT** generic framework-provided classes or Java-standard idioms — when the in-system pattern is itself sound. The analog you copy must be **programmer code that exists in the repo** (e.g. `populateLuasTanahMilik` as the analog for a new populator branch), not a textbook idiom. This is the operational form of "Working-analog first" above + the Rubric "read sibling code" step: the best option is *how the codebase already does this task*.
- **🚨 CHECK THE CONVENTION INSIDE THE FILE YOU'RE EDITING — extend existing code, never add parallel new code** (HARD RULE, added 2026-05-31 per みや, QA-259702). BEFORE writing ANY new method / constant / CC-tag / class / branch, **grep the TARGET FILE ITSELF** for how it already solves this shape: (a) an existing method that does ~90% of the job → **add a branch to it**, not a clone; (b) an existing per-urusan / per-type branch idiom → reuse it. Example: `if (PelupusanUrusanConstant.URS_X.equals(parameter.kodUrusan.get()))` appears **16×** in `PelupusanWordCCMethodConstant.java` — that IS the in-file convention for per-urusan output. **Banned**: spawning a new `populateXxxPru` method + new tag + a template re-tag when the file already has `populateXxx` with the urusan-branch idiom. **Why** (QA-259702): asked to change PRU's Perakuan-PTD wording, I built a whole new `populateSyorKeputusanPDTPru` + new CC tag + template re-bind — when the correct fix was a **3-line urusan branch inside the existing `populateSyorKeputusanPDT`** (mirroring the `URS_PLPS` branch already at `:14719`). みや: *"You could've simply updated the existing method and filter it BY THE URUSAN."* This is the in-FILE form of working-analog-first: the smallest change is almost always a branch in code that ALREADY EXISTS in the same file, not new parallel code. Convention-check is enforced by `convention-check-gate.js` (PreToolUse Edit on .java) — but that gate only fires; THIS rule says what to actually check (the file's own existing method + branch idiom), and to PREFER extending it.
- **🚨 PER-FILE SIBLING DIFF — MANDATORY before building, for EVERY file you touch** (HARD RULE, added 2026-05-31 per みや, QA-258004 — the single most expensive miss of the ticket: ~1.5 days lost). This is the PROACTIVE, always-on form of "Working-analog first" + the JSF rule below — it fires on every edited file, not only when something already misbehaves. **The rule**: for **EACH and EVERY file** you create or modify in a fix, BEFORE you build/deploy, locate the nearest **working sibling** (the same composite re-used in another form · the same method family · a sibling urusan/tugasan doing the same job · the working input in the same panel) and **DIFF your wiring against it across ALL coupling points**, not just the line you changed:
  - **JSF include / tag attributes**: every attribute the working sibling passes (`mbb` / `helper` / bound VO / `mode` / `listener` / `process` / `update`). A MISSING attribute is the classic silent break — QA-258004: the dialog include omitted `mbb` → `'. mbb' resolved to null` → selection lost.
  - **Listener / method-ref signature**: parens-vs-no-paren and arg type MUST match the working sibling exactly — QA-258004: `onChangeKadarCukai` worked no-paren; my `()` form silently never fired.
  - **VO binding ↔ save source**: the VO the input writes to MUST be the SAME instance the save reads — QA-258004: dropdown wrote `pajakanVO.premiumVO`, save read `mb.premiumCukaiVO` → null.
  - **Bean/field lifecycle**: does the working sibling survive the postback (e.g. `@ViewScoped` field capture) where yours is rebuilt/re-decoded to null?

  **Emit a one-line per-file sibling-diff before building**: `<file> ← sibling <working file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓` (or name the divergence). **Banned**: building/deploying an edited file whose wiring was NOT diffed against a named working sibling this turn. **Why a separate hard rule** (not just "working-analog first"): working-analog-first fires at fix-DESIGN time (which approach to take); THIS fires per-FILE at edit time (did THIS file's every coupling point match the analog). QA-258004 had the right approach, but each individual file (xhtml include, listener, save path) silently diverged from its sibling and was never cross-checked → a full day of breakpoint/logger debugging that one proactive diff would have prevented. Pairs with the pending **sibling-consistency-check hook** (todo.md Q1) which will enforce this deterministically; until that ships, this boot-loaded rule is the guard.
- **Front-end / JSF: copy a WORKING sibling component; suspect the broken one even if it's the ticket's own code** (added 2026-05-31 per みや, QA-258004). When fixing a JSF/xhtml input/panel that misbehaves (value not captured, not saved, not displayed): (1) find a **sibling input in the SAME panel/form that already works correctly** and copy its full wiring — e.g. a `selectOneMenu` that persists has an explicit `listener=` + `process="@this"` + `update=`; one that silently fails is often **missing exactly that**. (2) **The component nearest the ticket's symptom is the prime suspect for being mis-structured**, not the framework. If the affected component looks like it deviates from how the working siblings are wired (missing listener / ajax / binding), treat *that deviation* as the bug and bring it up to the working sibling's structure. (3) Prefer the component that **looks like proper JSF structure** (full ajax wiring) as the template, not the half-wired one. **Why** (QA-258004): the MCL Syarat/Sekatan `et:selectOneMenu` dropdowns had NO `listener` while the sibling `kadar-cukai-sebelum` dropdown in the same panel did — so the selection never submitted to the bean and saved as null. The fix was to wire them like the working sibling. I wasted cycles theorising (land-report fallback, rebuild-overwrite) before just copying the working dropdown — which was the answer all along.
- **Entity-first SQL**: query JPA entities via Hibernate annotations + DB tables, not by guessing column names. Verify table + column names before constructing SQL. Canonical task-state query: `UMM_A_TGSN + IND_TGSN + UMM_ALIRAN_KERJA + PCP_PENGGUNA + IND_PEJABAT`.
  - **🚨 Schema-qualify EVERY table + read the error before blaming the connection** (added 2026-05-30 per みや — recurring misdiagnosis): table names in MCP postgres queries MUST carry the schema prefix — `et_main_uat.<table>` for `mcp__postgres-mlkuat__query` (UAT) and `et_main.<table>` for `mcp__postgres-mlkfat__query` (FAT). An unqualified table throws `relation "<table>" does not exist`, which I once misreported as **"lost connection to the DB"** — it was NOT a connection drop, just a missing prefix. **When a query fails, READ the actual error text first**: `relation does not exist` / `no schema` → add the `et_main[_uat].` prefix and retry; only a real timeout/network error is a connection issue. Never claim "DB connection lost" without quoting the actual error.
- **Word-template-first lookup**: when a ticket touches a `.docx`, read `PelupusanWordCCMethodConstant.java` first to identify the populator + CC tags before grepping the template binary.
- **PDF annotation extraction at Phase 0**: BA-provided PDFs contain Annot objects (FreeText comments, highlights, sticky notes) — extract via PyMuPDF (`annotations` skill) before treating the PDF text as the whole brief. Default Read tool misses annotations.
- **Renderer-side overrides before cache theories**: when output looks wrong, grep for forced-override patterns (CENTER alignment overrides, hardcoded image dimensions, vMerge locks) at the renderer/util layer BEFORE blaming cache or build state.
- **Branch / pull discipline**: at Phase 0 start, `git status && git branch --show-current` on relevant repos; if not on `mlk/master`, do the standard sequence (stash → checkout master → pull --ff-only → stash pop). At Phase 1 close, pull before branching (see Phase 1 Closure section below).
- **Layer-aware Phase 0**: classify the fix layer (Java / .docx / config.json / SQL / Flowable BPMN / JSF / Spring) BEFORE Recon. Different layers have different Universal Checks.
- **TRG guardrail**: TRG is HARD EXCLUDED from Melaka work. If a fix would touch TRG code paths, stop and surface.
- **Multi-state classification first**: at every ticket-engagement, identify which state(s) the fix scope spans (Melaka-only, multi-state, all-states). Default scope = Melaka-only unless ticket explicitly broader.

---

## 🗄️ Database & Entity Resolution

> Added 2026-05-30 (merges the DB discipline trimmed out 2026-05-22 with みや's instructions), after a session where I guessed table/column names, queries errored, and I **fabricated** results. The resolving info was already in hand — the code entities I'd scanned, `DATABASE.md`, and the live DB keyed on `aplikasi_id`. (The `et_main[_uat].` **schema-prefix** rule lives in the **Entity-first SQL** bullet above; this section is the rest.)

- **Load the schema knowledge file first** — `projects/coding-projects/active/etanah-knowledge/melaka/DATABASE.md` (from the TDD SQL exports; lives in the main-repo working tree, absent from worktrees) is the source of truth for table + column names. Trust it over assumptions; Glob + Read it at Phase 0 of any DB-touching work.
- **The spine — `umm_aplikasi` + `aplikasi_id`**: a permohonan ID (`PTMLK/...`) = `umm_aplikasi.id_pengenalan`; from it get `aplikasi_id`, then reach every related table by joining on `aplikasi_id` (`umm_a_permohonan_tnh`, `umm_a_dok_keluaran`, `umm_a_tgsn`, …). Layer convention: `_p_` = AWAM/portal, `_a_` = PLU/internal (`_a_` ≠ approved).
- **Entity-first, but don't skip the DB** — read the JPA `@Table`/`@Column` (or `DATABASE.md`) before naming a table/column; never infer from Java names. "Never infer" ≠ "skip the lookup": when the DB completes the answer or was asked for, query it — I have live access.
- **100% complete chain check → save into `QA-NNNN.md`**: when scanning code for a fix, trace the FULL chain — XHTML/CC tag → bean/populator → entity getter → `@Table`/`@Column` → DB table+column → `aplikasi_id` join — and WRITE it into the quest's `QA-NNNN.md` (Debugging section). Reusable next cycle + auditable; don't keep it only in working memory.
- **An errored/empty query is a STOP, never a fill-in** — read the actual error (wrong column / unqualified schema / wrong table), correct it, re-run. NEVER narrate a result the database did not return. This is verify-before-claim applied to SQL — the slip this section exists to kill.

---

## ⚔️ Quest Workflow

**🎯 THE CORE METHODOLOGY (the engine — keep it THIS simple).** This start-to-finish loop is what made debugging + implementation work so well; every gate / rule / hook below is a guardrail *on* this loop — **if any ever gets in its way, the loop wins.** (Restored to boot-load prominence 2026-05-30 per みや — it was intact in `quest-protocol.md` but buried under accretion + not boot-loaded.)

`Scout → Recon → Rubric → Apply`

1. **Scout** (Discovery) — spawn an agent that traces the **whole class chain, start → end** of the scan (full investigation, every `file:line`, 100%-verify). Produces a draft.
2. **Recon** — **distrust the Scout's draft; try to prove it WRONG.** Accept only the claims that survive skeptical re-verification against the live code.
3. **Rubric** — check the **blast radius** + read **sibling code** (similar urusan / permohonan / template) to match the existing format/structure/style, then emit **2-5 candidate fixes** and pick the best.
4. **Apply** — implement the chosen fix.

**📐 CANONICAL PHASE EMIT TEMPLATE — defined ONCE, referenced per phase (added 2026-05-31 per みや, after the haiku compliance audit found "load" / "execute" / "sibling-diff" all ambiguous):** every quest-phase emit (Scout / Recon / Rubric) MUST follow this 4-part shape — same template each time so the structure IS the discipline:

```
1. Description    — one plain sentence: what this emit answers in everyday language (no jargon / no file:line)
2. Table          — the load-bearing content (Universal Checks / fix options / sibling matrix) as a MARKDOWN TABLE
3. Arrows         — class chain / data flow / state transition as `A → B → ⚠️ C → D` (when applicable; OK to omit if no flow)
4. Summary        — 1-3 lines: the conclusion + the next-step action this emit unlocks
```

**Per-phase reference**: Scout emit, Recon emit, and Rubric emit each follow this template. If the shape is missing, the phase did not run. The auditor (you or any reviewer) scores compliance against the 4 parts.

**🚨 FORCED PHASE-EMIT GATES — the loop only works when each phase produces a VISIBLE emit before the next (HARD RULE, added 2026-05-31 per みや, QA-259702).** The decomposition/trim kept this *arrow text* but lost the *forced emits* — so a session can "run the quest skill" yet freelance straight from a glance to an Edit, skipping Recon + Rubric. That is exactly what failed QA-259702 (built a new method instead of grepping the file for its own idiom). **The rule — during ANY quest, these emits are MANDATORY, in order, and an Edit to code/template/config is BANNED until they exist in THIS session:**
   - **Scout emit** — follow the **📐 Canonical Phase Emit Template** above (description / table of file:line cites with kind=file-read|grep / arrows of the class chain / summary naming the bug-site `⚠️`).
   - **Recon emit** — follow the **📐 Canonical Phase Emit Template**. The table = Universal Checks (1-9) with `Class.method:line` + status (VERIFIED / HYPOTHESIS / BA-Q) per row. No Edit before it.
   - **Rubric emit** — follow the **📐 Canonical Phase Emit Template**. The table = (a) blast-radius row, (b) 2-3 **sibling file:line** rows for the convention (incl. existing in-file method/branch per the in-file-convention rule), (c) 2-5 candidate fixes (one marked CHOSEN). Arrows for option flow if helpful. No Edit before it.
   - **Logger choice (when the Rubric picks "add a probe logger")** — grep the parent class first. `*Config` subclasses inherit `GenericLogger` from `Config.java:14`; use **String-concat** (`TemplateConfig.java:202`). `*Form` classes use slf4j (`MlkKertasTemplateForm.java:160`). Declaring a child slf4j Logger when parent has `GenericLogger` silently breaks compile (QA-262755).
   - **Predicate Box** — before each code Edit while debugging (Debug Ritual 1).
   - **Per-file sibling-diff EMIT LINE** (HARD, breaks out of v1.38 long-paragraph wording — was slipped by all 3 haiku audit runs) — for EVERY edited file, emit verbatim ONE line before any build: **`<file:line> ← sibling <working file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓`** (or name the specific divergence in place of ✓). Building/deploying a file with no sibling-diff line is BANNED. The substance check (read a sibling, match the convention) without this emit-line does NOT satisfy the rule — the line IS the rule.
   **Banned**: jumping Scout→Apply; emitting a fix with no Recon/Rubric block this session; "I'll just edit it" without the sibling-citation. **Why this is the cure**: the flow worked pre-trim because each phase forced an inspectable, structured emit (headers, tables, `file:line`) — the structure WAS the discipline. Restore the forced emit and the convention-check can't be skipped. Pairs with the in-file-convention rule (Etanah Non-Negotiables) + the pending quest-phase-gate hook (todo.md) that will enforce this deterministically; until that ships, this boot-loaded rule is the guard.

One straightforward pass covers debugging → implementation. Be as straightforward as possible; don't let the machinery smother it — but the three emits above are the floor, never skipped. Full detail in `quest-protocol.md` (Scout sub-protocol · adversarial Recon :574 · Rubric 2-5 options :675 · Blast radius :808 · sibling-check :1087).

**Protocol file**: `quest/quest-protocol.md` — full workflow body (Phase 0/1/2 phases, Discovery → Recon → Simulate → Rubric → Apply → Verify → Commit → Push → Wrap checkpoints, Quest State Transitions, extended `active.txt` schema, Debug Mode Rituals). Load it when any trigger below fires.

**Triggers** (activate Quest / re-engage with a ticket automatically — not just first mention; restored to TABLE form at boot 2026-05-25 after the decomposition lost the bare-ticket-number coverage):

| Trigger phrase pattern | Examples |
|---|---|
| Ticket number mentioned (ANY form — with or without prefix) | `QA #258022`, `FAT-OR #255637`, `UAT-CR #239225`, `262233`, `let's start with 262233`, `the 262233 ticket`, `PTMLK/.../PRZ/2026/X` |
| Continuation / scoping | "continue ticket X", "focus on X", "let's work on X", "let's do X", "let's start with X", "X rework", "back to X", "resume X", "start X" |
| Methodology applied to a ticket | "/appraise on X", "scrutinize X", "review X again" |
| Generic intent | "I have a task / ticket / bug to debug", "Read Redmine", any formal Etanah/Redmine work context |

**Non-negotiable trigger-time rules (restored 2026-05-25 — lost during decomposition; failed this session's QA-262233 cycle-2 quest activation):**

- **🪪 Notes file naming convention (renamed 2026-05-31 per みや)**: the per-ticket test-data log is named `1. <NNN NNN>.txt` (e.g. `1. QA-262762.txt`) — NOT the old `1. Notes.txt`. **Why**: when multiple Task folders are open in tabs / multiple files appear in a grep / `Get-ChildItem` listing, a bare `1. Notes.txt` is non-identifying — every ticket has one with the same name. `1. QA-NNNN.txt` is self-identifying. **Scope of rename**: applies going forward — new Task folders created by `quest/redmine-sync.js` use the new name; existing folders keep their legacy `1. Notes.txt` (renaming them in-place would silently break active.txt cross-refs + diary backlinks). `quest/notes.js` reads either filename (legacy-first) and writes the new one. Wherever this protocol says "Notes file" / "the Notes" / `1. <NNN NNN>.txt`, BOTH the new-named and legacy files are meant.

- **Handoff / Notes / History first** (hard rule, 2026-04-29; broadened 2026-05-25): when a ticket # is mentioned, ALWAYS check `quest/active.txt` for a matching `qa=QA-<num>` block. If found:
  - Read `<task_folder>/1. <NNN NNN>.txt` (or legacy `1. Notes.txt`) if it exists — prior test data + logins (cycle-1 entries are gold for rework cycles)
  - Read `<task_folder>/0. Brief/History.txt` fully — full BA journal (not just tail)
  - If `handoff_file=` field exists in the active.txt entry → read that file too
  - **Failure mode this rule prevents** (2026-05-25 QA-262233 cycle-2): I "discovered" via SQL that `PTMLK/01/L/PRZ/2026/20` + `nor.aini@melaka.gov.my` were valid test data — they were literally Notes file entry #5 from cycle-1, sitting unread the entire session.

- **Re-engagement load before any judgement** (hard rule, 2026-04-30 — re-surfaced to CLAUDE.md 2026-05-25): every time a ticket is referenced via ANY trigger above (initial OR continuation OR rework), Ruri MUST verify Task folder + Notes + History + handoff are loaded in CURRENT session context BEFORE producing any analysis, appraisal, code proposal, or recommendation. Loading once at session start is NOT enough — re-engagement after time-gap or context-shift requires explicit re-verification (a quick read or an emitted "Task folder + Notes + History loaded: ✓" line). Quest re-engagement on an `archived` ticket reopened by BA (Redmine status change) counts as a fresh engagement requiring full re-load + folder reactivation (Archive\ → Tasks\Melaka\<n>\ + create `3. Rework/` subfolder per DE signal #5 + cycle 2/3 convention).

- **Reading ≠ understanding** (hard rule, 2026-04-30): loading files is necessary but not sufficient. Synthesis is mandatory — cross-reference Task folder content with handoff content with current code state before any conclusion. When stating any user/role/data fact about a ticket, cite the source line (`Notes.txt:5 says nor.aini@melaka.gov.my is at PRMMKNPTG on /2026/20`).

- **Phase 0 classification** (added 2026-05-05 per DE signal #5): at ticket re-engagement, classify the entry context — **New / Rework / Addition** — via active.txt status + Redmine sync delta + `3. Rework/` subfolder presence. Folder reactivation Archive\ → Tasks\Melaka\<n>\ is required for Rework/Addition cycles.

- Never commit without `local_test_confirmed=true` in quest state.
- Summon `/familiar` (sub-agent) when reading files >500 lines.

**Phase 0 mandatory reads at re-engagement** (visible checklist — emit at quest start, mark ✓ as each completes):

```
⬜ active.txt block for QA-<num> located + status read
⬜ Task folder location confirmed (active vs Archive — move if Rework/Addition)
⬜ 1. <NNN NNN>.txt (or legacy 1. Notes.txt) read (or created if quest-new)
⬜ 0. Brief/History.txt read fully
⬜ early-diagnostic.md / QA-<num>.md cycle-N section opened (Scout familiar spawn if missing)
⬜ **🚨 BPMN flowable LOADED + SCOPE-CHECKED before Scout** — `Read` `MLK_PLP_<URUSAN>.bpmn20.xml` + grep the BA-tugasan name; verify the bug-tugasan is a **UserTask in pelupusan**, NOT a CallActivity calling a `MLK_TKL_*` sub-process (= etanah-teknikal, NOT testable locally; WAR not deployed). If teknikal-side → STOP + surface scope before Scout. (HARD RULE 2026-06-01, see Etanah Non-Negotiable below.)
⬜ env-switch run (`/env-check` skill — UAT/FAT target SWITCHED per ticket Env: etanahv3 config + standalone.xml + repo branch aligned; not just confirmed)
⬜ Recon Universal Checks block emitted (per quest-protocol.md Recon section)
⬜ 1. <NNN NNN>.txt pengguna_semasa from LIVE DB — at END of Recon, **EXECUTE** the canonical task-state SQL via `mcp__postgres-mlkuat__query` (UAT) / `mcp__postgres-mlkfat__query` (FAT); doubles as **DB-MCP reachability fail-check**. **Execution is required for active quests** — stating the SQL form without running it does NOT satisfy this step (haiku audit 2026-05-31 caught all 3 runs citing "compliance test" to skip — that exception is BANNED for live quests). If query errors (`relation does not exist` / connection / auth) → STOP + surface BEFORE Recon needs live data (downstream Recon will fabricate without it). **Exception** — for explicit compliance/simulation context (auditor mode, archived-ticket walk-through), state SQL form + MCP server name only; otherwise EXECUTE.
```

**Quest trigger-time essentials** (restored to boot-load 2026-05-30 — these live fully in `quest/quest-protocol.md` but are summarized here so they're in context during quest *design/discussion*, not only at `/quest start`. The 2026-05-22 decomposition pushed them into the non-boot-loaded protocol → paraphrase errors when discussing quests without a live `/quest start`; redundancy is intentional per みや 2026-05-25):

- **etanah-knowledge tiered load — FULL PATHS** (these files live in the **main repo working tree ONLY** — untracked-confidential, absent from worktrees; ALWAYS point reads at the main-repo path):

  **Base:** `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\projects\coding-projects\active\etanah-knowledge\melaka\`

  | Tier | Files | When | Notes |
  |---|---|---|---|
  | **Always** (5) | `index.md` · `DOMAIN-GLOSSARY.md` · `MODULE-ARCHITECTURE.md` · `BUG-BESTIARY.md` · `DEFERRED-CRITICAL-ISSUES.md` | every `/quest start` | ~5-7k tokens; foundation refs. **"Load" = `Read` first 50 lines minimum** (not Glob, not header-only) + **emit `Loaded: <file> (≈Nk tokens)` per file as proof**. Globbing without reading does NOT satisfy this tier (haiku audit 2026-05-31 caught this). |
  | **Conditional** | `DATABASE.md`(DB) · `FLOWABLE-WORKFLOWS.md`(workflow) · `JSF-WIRING.md`(UI) · `FLOW-TRACES.md`(deep-debug) · `FRONTEND-PATTERNS.md`(UI-enhance) · `URUSAN-FLOW.md`(cross-urusan) · `PERANAN-MAP.md`(role) | load per `ticket_type` + Description keywords; routing logged in QA-NNN.md Context Loading | `index.md` routes |
  | **On-demand** | `TEST-PERMOHONAN-INDEX.md` · `DEV-TESTING-HACKS.md` | Simulate (test data) / Debug (Flowable trace) | – |
  | **🚨 Conditional → MANDATORY for any tugasan/flow-routing ticket** (promoted 2026-06-01, QA-262755) | BPMN XML for the ticket's urusan: `flowables-bpmn\MLK_PLP_<URUSAN>.bpmn20.xml` | **BEFORE Scout** at Phase 0 — for bug-tugasan scope-determination | Load ONLY the file matching the ticket's URUSAN; grep the bug-tugasan label/kod + check whether it's a **UserTask** (this module — pelupusan) or a **CallActivity calling `MLK_TKL_*`** (etanah-teknikal, separate module, NOT deployed locally). **Banned**: Scout on a tugasan whose module hasn't been verified via the BPMN. |
  | **Archive — REFERENCE ONLY, DO NOT pre-load** | TDD SQL exports at `database-archive\Melaka\MLKUAT\` (`et_main_uat.sql` ~3.9MB / ~900k tokens) | NEVER at Phase 0 — query LIVE DB via MCP | Kept for offline / schema-diff only |

- **`1. <NNN NNN>.txt` (legacy `1. Notes.txt`) canonical format** (protocol:373-403) — 3 lines per entry, NO bloat / env / extra-tugasan / annotations:
  - single: `N) <URUSAN> — <TUGASAN>` / `<PERMOHONAN_ID>` / `<login>`
  - multi-urusan: one 3-line entry per urusan
  - two-entry (BA app past target tugasan): `0) BA — past <target>, currently <state>` / id / pengguna  +  `1) <PLP|AWAM> — <ENV> — <TUGASAN>` / sim-id / pengguna
  - Written right after Redmine retrieval (`node quest/notes.js`), at Scout completion, and on mid-conversation ID mention; login `TBD` if DB-blocked — never defer the whole file.

- **Canonical task-state SQL** (auto-pengguna, protocol:518-541): join `UMM_A_TGSN → IND_TGSN` (tugasan kod/nama) + `UMM_ALIRAN_KERJA` + `PCP_PENGGUNA` (pengguna_semasa login) + `IND_PEJABAT`; filter `FLAG_AKTIF='Y'`. Run at END of Recon via LIVE MCP (`mcp__postgres-mlkuat__query` UAT / `mcp__postgres-mlkfat__query` FAT) → feeds Notes.txt. **Live MCP > TDD SQL dumps** for Phase 0 (real state, row counts, FK validation); TDD reserved for offline/schema-diff only.

- **Codebase root + blast-radius**: pick `etanah-pelupusan` (PLP/APPS) vs `etanah-awam` (AWAM) by ticket subject. **TRG is BANNED from pelupusan blast-radius** (ignore it entirely — codebase-only scope); AWAM = multi-state-aware. Full Recon Universal Checks: `quest-protocol.md` Recon section.

**Quest Phase-0 workflow** (NEW 2026-05-30): `/quest start` auto-invokes the `quest-phase0` Workflow (`.claude/workflows/quest-phase0.js`) — Discovery → etanah-knowledge load → Recon → adversarial Verify (bugs) → Synthesize; writes Notes.txt + QA-NNN.md; `depth=full` for bugs / `quick` otherwise. Validated 2026-05-30 (QA-260508). Caveat: pass `args` such that the script's `JSON.parse(args)` guard fires (the Workflow tool delivers args as a JSON string).

**Skills**: `/quest start|hold|resume` · `/familiar` (sub-agent for >500-line reads) · `/env-check` · `/verify` · `/appraise` · `/checklist`

---

## 🔬 Debug Mode Rituals

**Full body**: `quest/quest-protocol.md:822-890` (migrated there 2026-05-22). Below is the **trigger-time summary** so the rituals fire at boot recognition (restored 2026-05-25 — decomposition cite was prose-only, target file is not auto-loaded; redundant with quest-protocol.md by design, OK per みや 2026-05-25).

**Activation**: みや says "debug mode on", a debugger value is shared, the quest protocol flags an active debug session, OR a fix-proposing Edit is imminent during investigation.

**Mandatory rituals while in debug mode**:

| # | Ritual | When to emit | Format / Discipline |
|---|---|---|---|
| 1 | **Predicate Box** | Before every code/config Edit | Emit a box: `TRUE IF: <what fix assumes>` / `PROVED BY: <file:line evidence>` / `FAILED WHEN: <what data shape disproves>`. Sub-rule (per `meta/slip-log.md` 2026-05-25): when ≥2 hypotheses exist, emit ONE box PER hypothesis + RANK by cost-to-verify (queries / files / UI steps), attempt cheapest first. Banned: issuing user-action steps on hypothesis N while hypotheses 1..N-1 are still unverified. |
| 2 | **Evidence Language Discipline** | Whenever stating a hypothesis or finding | Use `verified` / `hypothesis` / `assumed` explicitly. **Banned**: "should", "ought to", "would", "could be", "most likely", "strong likely" without file:line backing. Soft hedges are defensive framing per `feedback_defensive_tone.md`. |
| 3 | **Momentum Circuit-Breaker** | After theory fails 2× in a row | RESET — try a different CATEGORY of cause (data vs code vs config vs environment vs template), NOT a refined version of the same theory. Pairs with `RecursiveLoopDetector.js` PostToolUse hook (3× similar args → reminder). |
| 4 | **Debug Mode Setup** | At debug session start | Confirm: env target (`/env-check`), debugger access path, logging level + server.log path (`E:/Dev/jboss-7.4-plp-melaka/standalone/log/server.log`), probe-logger placement (breakpoints BANNED — Ritual 6), reproduction recipe. |
| 5 | **Permanent-fix-first + exhaust-to-confidence** | Before any diagnosis hand-back | Pursue the ROOT cause to ≥90% confidence OR until all accessible methods (DB across the whole population · code-trace · familiars · local repro) are exhausted. A residue a tool can answer is NOT a stop-point; asking みや for it is BANNED. Label patch-vs-permanent-fix. |
| 6 | **Loggers, not breakpoints (breakpoints BANNED)** | When a runtime fact is still unconfirmed after static analysis is exhausted | Add **extensive loggers covering ≥3 what-if scenarios in ONE pass**, BUNDLED INTO the first-pass fix build — the rebuild is happening anyway, so one cycle carries fix + runtime confirmation (3-4× faster; per みや 2026-05-31). Breakpoints BANNED as a request to みや (halt the slow server + slow round-trips). Tag probe loggers `QA<num>-PROBE:`. VERY VERY last resort = a breakpoint ONLY when there's no code change to bundle loggers into. Loggers stripped at Phase 1 close (prepare-commit Step 2.6). Full body: quest-protocol Ritual 6. |

**Violation log**: `Feature/Forge-Self-Improvement-System/debug-ritual-violations.md`. Slips on Rituals 1-6 get a one-line entry per occurrence. Recurring slip-shape → ritual redesign, not re-promise.

**Skill anchors**: `predicate-box` (Ritual 1, auto-loaded skill description fires on Edit-during-debug recognition). Rituals 2-6 currently have NO skill anchor — they depend on this boot-loaded summary + the protocol file body.

---

## 📝 Commit message attribution

Commit trailer + subject conventions (MemoryCore vs etanah repos) — see `.claude/commit-conventions.md` (routed out of CLAUDE.md 2026-05-22).

---

## 🔢 Phase 1 Closure — Git Sequence

The ordered `pull → checkout -b → stage → commit → push → /verify` close-out sequence — see `quest/quest-protocol.md` → Phase 1 close-out + the **Commit + Push hard rule** (migrated there 2026-05-22). Runs ONLY after `local_test_confirmed=true`; the `mlk/qa/*` branch is created at Commit prep, never at Apply. Durable fix in flight = the `/branch-and-push` script (todo.md Q2).

---

## 📦 Phase 2 Closure — Archive Hygiene (MANDATORY — boot-loaded 2026-05-31)

> Boot-loaded here because it lived ONLY in `quest/quest-protocol.md` (Phase 2 Step 4/5 + the `status=archived` definition :1209) — a NON-boot-loaded home, so it was **silently skipped** repeatedly (QA-258004 2026-05-31 — only the status flipped, folder + block left in place; prior: QA-262039, QA-260302 Phase-2 step-5 skips). Same failure class as the decomposition that buried trigger-time rules. Redundant with the protocol by design (per みや — boot-loaded visibility is what matters).

**`status=archived` is NOT "done" by itself.** Flipping the status field WITHOUT the moves below is an **incomplete close** — the exact slip this rule kills. At Phase 2 / quest wrap (or any "close X / X is done / archive X" trigger), ALL applicable moves MUST run in the SAME close-out, each emitted as a visible ✓:

1. **Task folder → Archive** — `Move-Item` the Windows Task folder `1. Tasks\Melaka\<n>. …` into `1. Tasks\Melaka\Archive\`. Use `-LiteralPath` (folder names containing `[FAT]` break wildcard `Test-Path`/`Move-Item` — the `[...]` parses as a char-class). Verify with a literal `Get-ChildItem … | Where Name -like "*<num>*"` count, never trust a `Test-Path` on a bracketed name.
2. **active.txt block → active-archive.txt** — `active.txt` is WORKING MEMORY: OPEN quests only (status ∈ active/hold/blocked/delegated). The moment a quest hits `closed`/`archived`, MOVE its whole block out to `quest/active-archive.txt` under a dated section header AND update the block's `task_folder=` to the new `Archive\` path.
3. **Project subfolder** — if `projects/coding-projects/archive/` exists, move `…/active/QA-<num>/` there too; else leave it + note (Ruri's internal workspace — secondary).

**Emit at Phase 2 close (visible gate)**: `Archive hygiene — QA-<num>: folder→Archive\ ✓ · active.txt block→active-archive.txt ✓ · project subfolder <✓|⬜ no-archive-dir>`. **Banned**: declaring a quest `archived`/`closed` with any applicable move un-done and un-emitted. Deterministic harness — `quest/archive-quest.js <QA>` doing all moves atomically — parked in todo.md Q1 (pairs with the sibling-consistency-check hook; both make Phase-close mechanical steps deterministic).

---

## 💻 New Machine Setup

One-time per machine — see `.claude/new-machine-setup.md` (routed out of CLAUDE.md 2026-05-22).

---

**Available Skills:**

- `/quest start|hold|resume` — quest workflow
- `/familiar` — sub-agent for large files
- `/appraise [subject]` — Socratic plan stress-test (9-question interrogation across Assumption / Scope / Evidence axes)
- `/checklist` — universal task checklist; mandatory at quest accept + every phase boundary
- `/env-check` — verify/switch local env state (etanahv3 config + standalone.xml + repo branch)
- `/verify` — universal workflow-checkpoint verification (Phase 0 / Apply-done / Phase 1 close-out / DE Checklist D)

**Historical reference**: `.claude/claude-md-amendments.md` — ✅ EMPTIED 2026-05-25; all 16 amendments absorbed into canonical homes (table inside the file documents final disposition). File kept for historical disposition log; no active amendments load from it. Boot-load remains as informational-only / low-priority; can be dropped from boot list in a future cleanup.

*Version: 1.45 | Last updated: 2026-06-01 — **🚨 BPMN-first module-scope check** (HARD RULE per みや, QA-262755). Added as the FIRST rule in Etanah Non-Negotiable list (must settle before working-analog-first) + added a Phase 0 mandatory checklist row + promoted BPMN load in the etanah-knowledge tier table from "On-demand" to "MANDATORY before Scout" for any tugasan/flow-routing ticket. **The rule**: BEFORE Scout, `Read` `MLK_PLP_<URUSAN>.bpmn20.xml`, grep the BA-tugasan label/kod, classify: UserTask = this module (pelupusan, can Scout) · CallActivity → `MLK_TKL_*` = etanah-teknikal (NOT deployed locally — `.m2` empty; STOP + surface scope) · CallActivity → `MLK_PLP_SUB_*` = pelupusan sub-process (Scout). **Why**: QA-262755 Scout treated CK (Charting Keputusan) as if it lived in etanah-pelupusan; the PLPS BPMN at `:516` clearly shows `38.0 Charting Keputusan Lulus` as `<callActivity calledElement="MLK_TKL_CL_LP">` — TKL prefix = teknikal. We built+deployed a fix to `MlkSemakanDokumenKelulusanForm` (pelupusan SDK tugasan) that could never fire on BA's CK page (etanah-teknikal, not on local JBoss); みや got a 404. One BPMN grep at Phase 0 would have surfaced the module-mismatch in seconds. Companion: BA-photo-set scope rule — BA often provides BOTH a pelupusan-side photo (SAVE step) and a teknikal-side photo (bug-site); read BOTH, scope the fix to the pelupusan step (SAVE writer) if the bug-site is teknikal-only.*

*Version: 1.44 | Last updated: 2026-05-31 — **Split rule 1 into 1a + 1b** (Explanation & Output-Format Discipline). Old "plain FIRST, technical SECOND" was actually TWO orthogonal principles conflated: (1a) **Plain vs Technical = register-separation** that applies everywhere — sentences, bullets, table cells, code blocks — one register per container; even with table-first (v1.41) firing, a cell that mashes prose + `file:line` + SQL defeats the table; (1b) **Overview vs Detail = depth-ordering** that governs the structure of an answer — bird's-eye first (annual-report style), then mechanism (class-chain `A→B→⚠️C`, like an org chart of departments-not-individual-executives), then `file:line` only if location IS load-bearing; "technical ≠ granular" — a class-chain is technical AND bird's-eye. Both written verbose+shapes (per みや: detail-density anchors when paired with visual structure). All v1 nuance preserved: anti-jargon, BA-anchored, real values quoted, no vague quantifiers, metaphor-only-in-Plain. Per みや's annual-report metaphor + the haiku audit + the cluttered Recon hand-back slip earlier this session.*

*Version: 1.43 | Last updated: 2026-05-31 — **3 audit-driven clarifications** after the haiku compliance audit caught all 3 simulation runs slipping on the same judgment-call rules. (a) **📐 Canonical Phase Emit Template** defined ONCE (description + table + arrows + summary) — each phase (Scout/Recon/Rubric) now has a one-line reference to it instead of restating; structure IS the discipline. (b) **Always-tier "load" defined** = `Read` first 50 lines minimum + emit `Loaded: <file> (≈Nk tokens)` per file; globbing-without-reading does NOT satisfy. (c) **LIVE DB MCP "execute" defined** — execution is required for active quests; stating SQL form without running is BANNED unless explicit compliance/simulation context. (d) **Per-file sibling-diff EMIT LINE** broken out of long-paragraph wording into its own standalone bolded bullet in FORCED PHASE-EMIT GATES (the line IS the rule; substance-without-line does not satisfy). Audit verdict: rules with clear output shape fired ~75% reliably even on haiku; judgment-call rules fired ~35% — these 3 fixes close that gap.*

*Version: 1.42 | Last updated: 2026-05-31 — **Quest-start anchored to FULL PATHS + LIVE DB fail-check** (per みや, end-of-session). (a) Phase 0 checklist: env-check → "env-switch" wording (config swaps already happen); NEW row "Notes.txt pengguna_semasa from LIVE DB via mcp__postgres-mlkuat/mlkfat__query at end of Recon — doubles as DB-MCP reachability fail-check; STOP if query errors." (b) etanah-knowledge tiered load → full-path table: base path pinned, BPMN load gated by ticket URUSAN (`MLK_PLP_<URUSAN>.bpmn20.xml` only, never all 20 = 3.9MB), TDD `database-archive/Melaka/MLKUAT/` marked REFERENCE-ONLY (NEVER pre-load: et_main_uat.sql ~900k tokens; live MCP strictly better). (c) Canonical task-state SQL bullet extended with MCP server names + "live MCP > TDD" verdict. Path-explicit rather than name-only so the rule binds Ruri at quest-start. Companion: detach pass (this session) marks 7 dead Forge/Observation logs DETACHED-not-DELETED with tombstone headers; CLAUDE.md improvement-audit-log boot-flag re-pointed to meta/slip-log.md.*

*Version: 1.41 | Last updated: 2026-05-31 — Strengthened **Explanation & Output-Format Discipline** rule 2 with a **🚨 HARD PRE-SEND GATE**: first structural element MUST be a table/arrow, never a prose paragraph, when a response carries ≥2 findings/options/steps/decisions; ≥3 consecutive prose sentences carrying load-bearing content = STOP+convert; a cluttered long-winding message is itself a violation even when factually correct. Per みや QA-253053 — the table-default rule (already present, soft prose) was ignored on a Recon/Rubric hand-back; the clutter made verified work look like hand-waving. Soft-prose → hard self-enforced gate.*

*Version: 1.40 | Last updated: 2026-05-31 — Added **📦 Phase 2 Closure — Archive Hygiene (MANDATORY)** section (between Phase 1 Closure and New Machine Setup). Boot-loads the previously-protocol-only archive rule: `status=archived` is NOT done by itself — at Phase 2 close ALL applicable moves MUST run + emit a visible ✓ line: (1) Task folder → `1. Tasks\Melaka\Archive\` (`-LiteralPath`; `[FAT]` breaks wildcard Test-Path), (2) active.txt block → `quest/active-archive.txt` + fix its `task_folder=`, (3) project subfolder if an archive dir exists. Per みや QA-258004: the 2026-05-31 close flipped status=archived but left the Task folder in active + the block in active.txt; the move-rule lived only in non-boot-loaded `quest-protocol.md` (same failure class as QA-262039/QA-260302 Phase-2 step-5 skips). Deterministic `quest/archive-quest.js <QA>` harness parked in todo.md Q1.*

*Version: 1.39 | Last updated: 2026-05-31 — Two QA-259702 additions. (1) **🚨 CHECK THE CONVENTION INSIDE THE FILE YOU'RE EDITING — extend existing code, never add parallel new code** (Etanah Non-Negotiables, ~:149): grep the TARGET FILE for an existing method/branch idiom that does ~90% of the job and ADD A BRANCH, never clone — per QA-259702 where I built a new `populateSyorKeputusanPDTPru` + new CC tag instead of a 3-line `URS_PRU` branch in the existing `populateSyorKeputusanPDT` (the file already had the `URS_PRU.equals` idiom 16×). (2) **🚨 FORCED PHASE-EMIT GATES** in the Quest Workflow core-methodology block: the trim kept the Scout→Recon→Rubric arrow-text but lost the FORCED per-phase emits — so a quest can be "run" while freelancing straight to an Edit. Restored as a hard rule: during ANY quest, a structured Recon emit + a Rubric emit (blast-radius + 2-3 sibling file:line + 2-5 candidates) + Predicate Box are MANDATORY before any code/template/config Edit; jumping Scout→Apply is BANNED. This is the root-cause cure みや diagnosed ("the scout, recon, rubric all ran perfectly... headers/titles... you always used tables" pre-trim). Pairs with the pending quest-phase-gate hook (todo.md).*

*Version: 1.38 | Last updated: 2026-05-31 — Added **🚨 PER-FILE SIBLING DIFF — MANDATORY before building, for EVERY file you touch** to Etanah Non-Negotiable Rules (placed above the JSF-sibling rule). The PROACTIVE per-file form of working-analog-first: for every edited file, diff ALL coupling points (JSF include attrs · listener/method-ref signature · VO-binding↔save-source instance · bean/field lifecycle) against a named working sibling BEFORE building; emit a one-line per-file sibling-diff; building an un-diffed file is BANNED. Per みや QA-258004 — the single most expensive miss of the ticket (~1.5 days): each file (xhtml include missing `mbb`, listener with stray `()`, save reading the wrong VO instance) silently diverged from its working sibling and was never cross-checked. Pairs with the pending sibling-consistency-check hook (todo.md Q1). みや directive: put the rule in CLAUDE.md directly (bypass system-design) since rules in other MD files were being skipped.*

*Version: 1.37 | Last updated: 2026-05-31 — Added **Debug Mode Ritual 6: loggers, not breakpoints (breakpoints BANNED)** + boot-summary table rows 5+6 + row-4 fix (breakpoint placement → probe-logger placement). Runtime confirmation now uses **extensive loggers (≥3 what-ifs) BUNDLED INTO the first-pass fix build** — the rebuild is happening anyway, so one cycle carries fix + confirmation (3-4× faster per みや). Breakpoint = VERY VERY last resort, only when there is no code change to bundle loggers into. Paired: `prepare-commit-trigger.js` v1.3 Step 2.6 (strip `QA<num>-PROBE:` loggers + debug comments before BA-bound commit) + quest-protocol Ritual 6 + triage-ladder breakpoint→logger + personality.md no-asking-back runtime corollary + system-architecture.md v1.6. Per みや 2026-05-31.*

*Version: 1.36 | Last updated: 2026-05-31 — Added **Front-end / JSF: copy a WORKING sibling component; suspect the broken one even if it's the ticket's own code** to Etanah Non-Negotiable Rules: when a JSF input/panel misbehaves, copy the full wiring of a working sibling in the same form (e.g. selectOneMenu listener+process+update); treat a component that deviates from the working siblings' structure as the prime suspect. Per みや QA-258004 — the MCL Syarat/Sekatan dropdowns lacked the `listener` the working `kadar-cukai-sebelum` dropdown had, so selections saved as null; cycles were wasted theorising before copying the working sibling.*

*Version: 1.35 | Last updated: 2026-05-31 — Added rule **3. Anchor every explanation to what みや can SEE** to Explanation & Output-Format Discipline: use screen field labels (UI) + real DB table/columns (or query result) + code, not bare internal abstractions; default to a `UI → code → table` arrow for any data-flow / "where does X get its data" question. Per みや 2026-05-31 (QA-258004): a UI→code→table arrow would've landed immediately vs the prose/VO-jargon explanation.*

*Version: 1.34 | Last updated: 2026-05-30 — Added **Smallest change + programmer-written convention** rule to Etanah Non-Negotiable Rules (per みや): keep code edits as small/specific as the fix needs; match the convention written by THIS system's own programmers (sibling etanah-* code), NOT framework-provided classes or Java-standard idioms, when the in-system pattern is sound; the copied analog must be real in-repo programmer code. Operationalizes "Working-analog first" + the Rubric sibling-read step. Added after a QA-258004 cycle where みや asked for smaller, convention-following changes.*

*Version: 1.33 | Last updated: 2026-05-30 — Added **🗄️ Database & Entity Resolution** section: load `DATABASE.md` (schema source of truth) before SQL · `umm_aplikasi`+`aplikasi_id` spine (permohonan ID = `umm_aplikasi.id_pengenalan` → `aplikasi_id` → join everything) · `_p_`/`_a_` layer · entity-first-but-don't-skip-the-DB · 100%-chain-check saved into `QA-NNNN.md` · errored/empty query = STOP, never fabricate. Complements the schema-prefix sub-bullet under Entity-first SQL (added same day by the parallel quest-phase0 session). Built after a session where I guessed table/column names, the queries errored, and I fabricated results — when the resolving info (scanned code entities + `DATABASE.md` + live DB by `aplikasi_id`) was already in hand. Merged on top of the parallel session's v1.32 (core methodology + quest essentials), not clobbering it.*

*Version: 1.32 | Last updated: 2026-05-30 — **Quest trigger-time essentials restored to boot-load** in the Quest Workflow section (Notes.txt canonical format · etanah-knowledge tier table · canonical task-state SQL · codebase-root + TRG-ban) + `quest-phase0` Workflow noted. Root cause named by みや 2026-05-30: the 2026-05-22 decomposition pushed operational quest detail into the non-boot-loaded `quest-protocol.md`, so quest *design/discussion* (not just live `/quest start`) ran on paraphrase → today's Notes-format + etanah-knowledge-load errors. Redundancy with protocol is intentional. Also shipped this session: built + wired + validated `quest-phase0` (Workflow-tool engine; fixed args-as-JSON-string delivery). ⚑ Flagged for a fresh-head session: **meta-layer effectiveness audit** — hook noise / false-positives (51 fake broken-pointers at boot, word-ui-gate misfires) / accumulation; みや 2026-05-30 asked "has the self-improving system backfired?" — assess net value + prune, don't defend. ALSO this session: **schema-qualify-tables DB rule** (Entity-first SQL — `et_main[_uat].` prefix; stop misreading missing-prefix errors as "connection lost") + the **core quest methodology** (Scout→Recon→Rubric) surfaced to boot-load prominence in the Quest Workflow section + quest SKILL.md — it was intact in `quest-protocol.md` but buried under accretion + not boot-loaded (みや 2026-05-30: "this is why it worked before; we REALLY need it back").*

*Version: 1.31 | Last updated: 2026-05-28 — Added **Explanation & Output-Format Discipline** section (plain-first/technical-second + table/arrow/diagram-default). Recovered from the pre-trim `Output-Format-Discipline` (commit 51606ea, decomposed out 2026-05-22) + merged with personality.md Show-first/Plain-vs-technical/Arrow-flow rules, after みや flagged post-trim explanations regressed to prose walls (QA-262243). Full bodies stay in personality.md; CLAUDE.md carries the always-on boot summary.*

*Version: 1.30 | Last updated: 2026-05-26 — Hook count drift fixed post-QA-262869 close. SessionStart 6→7 (added `open-quest-surfacer.js` brought in at salvage e6d4e16); PreToolUse Bash 1→2 (added `convention-check-gate.js`); PreToolUse Edit|Write 5→6 (same gate dual-registered). Total: 35 registered → 37 unique / 38 entries. Also flagged the `prepare-commit-trigger.js` v1.1 update (Step 7.5 mandates commit-conventions.md read before drafting). Drift root cause was the same pattern `meta-layer-audit.js` is built to detect at boot — verify it surfaces if this drift recurs.*

*Version: 1.29 | Last updated: 2026-05-25 — Three sections restored at boot-loaded surface after QA-262233 cycle-2 audit identified same decomposition-broke-trigger-time-discipline failure mode: (1) Quest Workflow (v1.28 — trigger TABLE + 3 hard rules + Phase 0 visible checklist), (2) Active Project Rules / Etanah Non-Negotiable Rules summary (9 rules incl. working-analog-first surfaced from `feedback_simplify_and_reference.md`; stale "🔴 KNOWN BROKEN" annotation removed — Etanah-Codebase-Read.md exists on main at 391 lines), (3) Debug Mode Rituals summary (4 rituals with trigger-time formats; full body remains in `quest/quest-protocol.md:822-890`). Redundancy with target files is intentional per みや 2026-05-25: "It is okay to be redundant" — what matters is boot-loaded visibility. Lines added: ~80 total (CLAUDE.md ~170 → ~250, still 63% lighter than pre-decomp 677).*

**Version-bump discipline (added 2026-05-13 per みや)**: every Refine Block / hard-rule addition to a protocol file MUST update the file's Version + Last Updated stamp in the same edit pass. Version is a single-integer increment per protocol revision (1.6 → 1.7). Audit-log entries alone don't surface protocol drift; the footer stamp does.
