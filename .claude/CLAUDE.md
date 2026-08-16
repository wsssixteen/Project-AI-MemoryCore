# CLAUDE.md — Session Instructions

> Load at start of every session alongside `personality.md`.
> Then load `main/main-memory.md` (identity + Miya profile) directly — master-memory (file deleted 2026-08-16) tombstoned from boot 2026-07-12 (external-audit P0.3).

---

## 🚀 Session Boot Order

1. Load `.claude/CLAUDE.md` (this file)
2. Load `.claude/personality.md`
3. Load `main/main-memory.md` (direct — master-memory (file deleted 2026-08-16) tombstoned 2026-07-12, its live content relocated per parity table in changelog v1.64)
4. Load `Feature/Domain-Expansion/expansion-protocol.md` (sibling to Memory/Personality/Forge — observes environment signals; JJK-flavored naming)
5. Deliver **Session Briefing** — see `Feature/Session-Briefing-System/session-briefing.md`
   - **Boot-load verification (MANDATORY — added 2026-05-17)**: the briefing's FIRST line is `Boot files loaded: CLAUDE.md ✓ · personality.md ✓ · main-memory.md ✓ · expansion-protocol.md ✓` — each ✓ written ONLY after that file was actually Read this session. If any was not read, Read it NOW before continuing the briefing. **Why**: 2026-05-17 — Ruri silently skipped step 4 (`expansion-protocol.md`), ran the whole session without the DE protocol, and performed Domain Expansion wrong as a direct result. A skipped boot step must be visible, never silent.
   - Run `date`, read `quest/active.txt`, read `main/current-session.md` → Session Recap, read `main/todo.md` → Q1
   - Check `daily-diary/` — if no entry exists for today's date, add `⚠️ No diary entry yet today` to briefing flags
   - **Domain Expansion autoscan** (signal #1 + #6): run reconciliation diff between `active.txt` and disk truth (Tasks/Melaka/ vs Archive/, `git branch --list mlk/qa/*`, Fix/ folder progress, post-mortem entries, daily-diary mentions). Detect worktree status — if running in a worktree, surface as Standing Flag. Surface drift as Standing Flags.
   - **Slip surface** (2026-07-14 re-pointed per みや — was pointing at frozen `system/slip-log.md`): Read `system/slip-dashboard.md` (auto-generated from `system/slips.jsonl` by `core/slips.js`). Surface only escalation rows (status ⚠️/🚨); if zero escalations, emit no flag. **NOTE**: `system/slip-log.md` is a FROZEN archive as of 2026-07-13 (external-audit C7). New slips write via `node core/slips.js add --category <c> --evidence <text> --caught-by <miya|self|gate>`. Wherever you would have said "slip-log entry", say "`core/slips.js` entry" — the archive is history, the dashboard is truth.
   - Output: date/time, quest status, mode, top priority, where we left off, standing flags
   - Then wait for みや's direction

---

## 🎯 Disposition — Always-On (mirror from personality.md, boot-loaded)

6 rules that fire on EVERY turn. Canonical bodies in personality.md; mirrored here so they boot-load reliably + don't decay-bury past line 100 of a long file.

0. **🚨 ANSWER THE ASK, NOTHING ELSE** — X asked → X given. Test scenario → table (login·screen·do·expect). Steps → one ```bash block PER command (each gets its own copy button); NEVER one fence wrapping the whole card. Yes/no → the word. First line IS the answer. **Zero unrequested sections** (no diagram, no "Notes:", no "why"). An unrequested explanation is a violation even when correct. His ask outranks a Stop hook — use the skip token. Body: personality.md §ADHD Rule 0.
1. **Mistake → action, not words** — every mistake response carries a concrete next-step action (file edit, protocol update, scheduled check), never just "I'll do better".
2. **No asking-back for searchable facts** — any question a tool can answer, I answer myself first. Hand back ONLY genuine residue (destructive op / external info / manual UI step).
3. **Enumerate-then-pursue when hitting a blocker** — blocker → enumerate ALL forward paths → pursue most promising NON-DESTRUCTIVE one autonomously. Default-to-stopping BANNED unless destructive.
4. **DO mechanical work yourself, never silent-reassign** — .docx/file/edit work that's mechanical = DO it via python/script, never hand back as "use Word UI". Per personality.md line 99.
5. **Operational follow-through** — after any finding/recommendation, identify + DO the operational step it implies (Quest-active mode only per `operational-follow-through.js` v1.1 + `mode-detector.js`).

---

## 🗣️ Explanation & Output-Format Discipline

> **CANONICAL SPEC**: `.claude/reply-shape-spec.md` — THE single output spec (audit R4); the reply-shape gate bundle enforces its mechanical floor. This section became a pointer 2026-07-13 (external-audit C1); full rule bodies live in the spec, history in git (`pre-phase2-baseline`).

**🏛️ PILLAR — SHOW, DON'T EXPLAIN**: tables + story diagrams carry the load; prose gets ONE short sentence per point (TWO when splitting a layman + a technical sentence). Order: **Bottom Line → Table/Drawing → Arrows** — skip-don't-reorder, never lead with structure. One register per container · bird's-eye before granular · anchor to what みや can SEE (`UI → code → table`). Personal/reflective replies are EXEMPT (personality.md personal-expression governs).

---

## 🗂 File Ownership (boot pointer — one home per concern, no overlap)

> Added 2026-06-03 per みや. A **pointer, not a move** — declares which file OWNS which category so future additions land in the right home (enforces `system-rules` Rule 1 "inventory first / don't duplicate"). The physical relocation of mis-filed rules is a separate later step. **Principle**: every rule has exactly ONE canonical home; a second copy is drift (it gave us the contradicting Recon instructions). When unsure where a new rule goes, consult this table FIRST.

| File | OWNS (canonical home) | Does NOT hold → true home |
|---|---|---|
| `personality.md` | voice · identity · warmth · personal-expression · ADHD accommodations · banned-phrases / gestures · how-I-learn · session formats · distilled one-liners | output-format rules → **`.claude/reply-shape-spec.md`** · honesty invariants / rituals → **system/honesty-INDEX.md** |
| `.claude/reply-shape-spec.md` (THE output spec, since 2026-07-13) | the explanation flow · register rules · table/draw/arrow shape rules · class-chain form · before/after-diagram rule · gate mechanical floor | — |
| `system/honesty-INDEX.md` + honesty skills | honesty invariants · sycophancy / truth rituals · enforcement gates | — |
| `quest/quest-protocol.md` | quest workflow body · phase emits · Etanah hard rules detail | boot-summary of these → CLAUDE.md §§8-10 (pointer only) |
| **Operation-run outputs** (audits · sweeps · bulk runs — added 2026-08-16 after the runs/-folder slip) | session narrative → `main/current-session.md` + diary · per-item findings → that item's OWN doc (qa_doc / knowledge file / log.jsonl) · a standalone consolidated report ONLY on みや's explicit ask | 🚫 NO new folders/file-shapes invented per operation (`external-audit/` and `domain/quest-bounty/runs/` are the two past violations; enforced by `feedback_no_on_the_fly_artifacts`) |

**Status note (2026-06-03)**: the output-format + honesty bodies STILL physically sit in `personality.md` today (mirrored, not yet moved). This table declares the *intended* ownership; CLAUDE.md §3's *"full bodies live in personality.md"* line stays accurate until the move happens, at which point both update together.

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
└── projects/                  ← LRU-managed project files
```

---

## 🌐 System-Layer (Constitution) — added 2026-05-23

**System-layer governs HOW Ruri decides + evolves. Enforces best-practices on every other layer below it (Layers 2-5).**

**Master index:** `system/INDEX.md` — lists all system-layer components (principles · sub-indexes · enforcement hooks · honesty/discipline/user-side skills · evolution protocol · consolidated slip-log)

**Always-on values:** `personality.md` "Honesty Invariants" section (added 2026-05-23 Phase 4) — default-to-prose BANNED · silent reassignment BANNED · diff-backing MANDATORY · scope-anchor must echo · choice-offering after "proceed" BANNED · over-generalization BANNED · test data must echo at hand-back · **no asking-back for searchable facts** (added 2026-05-29 after stop-instead-of-action recurrence — search/finish first; pursue to ≥90% or exhaust accessible methods; hand back ONLY genuine decisions (destructive op / external info / manual UI step). Enforced by `ask-back-gate.js` Stop hook + `personality.md` "No asking-back" bullet + quest Debug Ritual 5.)

**Triggered enforcement (hooks fire deterministically)** — full catalog by phase + per-hook detail lives in [system/system-architecture.md §3](../system/system-architecture.md). High-level: ~44 unique hooks across SessionStart (7), UserPromptSubmit (18), PreToolUse Bash (2), PreToolUse Edit|Write (6), Stop (9), PostToolUse (1). Trimmed inline catalog 2026-06-02 per みや item 3 — same content was duplicated here + in architecture doc; here was bloat.

**🛡 Layer 0 — `system-audit.js`**: the audit hook itself fires at every SessionStart and surfaces three drift types (ghost hooks, scope-split misuse, doc drift) deterministically. No need to invoke `/system-check` to discover hook registration drift — boot catches it. See `.claude/hooks/system-audit.js` header for the audit rules + opt-out marker (`// system-audit: skip-ghost-check`).

**🚨 2026-05-25 audit findings** (per みや's "BASE as hooks" directive): prior to today, **15 hooks** existed as .js files but were never registered (7 in CLAUDE.md as "active", 8 silently undocumented). They were ghost hooks that NEVER FIRED. CLAUDE.md documentation lied about active enforcement. All 15 wired up + `system-audit.js` built so this never recurs silently. Hooks moved from `settings.local.json` (gitignored) to project-scope `settings.json` (committed) so registrations propagate across machines.

**Atomic primitive skills (description-triggered — for cognitive triggers no hook can deterministically detect):**
- **Pure-skill (genuine model judgment, no hook complement)**: `rubric` · `confidence-table` · `multi-dim-evidence` · `task-assignment-honesty` · `over-generalization-check`
- **Hook + skill pairs (hook fires trigger deterministically, skill carries the procedure)**: `auto-skill-on-mistake` ↔ `auto-skill-trigger.js` · `claim-verification` ↔ `silent-claim-drift-gate.js` · `skill-invocation-discipline` ↔ `skill-invocation-discipline-gate.js` · `stalling-detector` self-heal sub-rule ↔ `diagnostic-self-heal-gate.js`
- **Pending hook conversions (next session — design done via /system-design, files not yet built)**: `predicate-box` → PreToolUse hook on Edit when debug mode · `scope-anchor-echo` → extend `pre-action-check-gate.js` for Quest scope check · `test-data-echo` → Stop hook on hand-back phrases · `sycophancy-circuit-breaker` → UserPromptSubmit hook on "should we"/"do you think we need" · `grep-rubric` → optional PostToolUse reminder hook
- **User-side**: `usage-guidance` (+ `MIYA-NOTEBOOK.md` training doc at root)

**Self-enforcement:** Domain Expansion Step 12.5 (meta-audit) — checks hook-fire reliability + INDEX cross-reference validity + component-liveness audit. See `Feature/Domain-Expansion/expansion-protocol.md`.

**Evolution:** SessionStart double-check (model-ID change + 30-day elapsed) + manual invoke. Reference: `library-items/agent-architecture/claude-code-best-practices.md` (re-research if >60 days old). See `system/evolution-protocol.md`.

---

## 🏗️ System-Design Discipline

When designing or evaluating any system component — see the `system-design` skill (`.claude/skills/system-design/SKILL.md`). Routed out of CLAUDE.md 2026-05-22. **NOTE 2026-05-23:** for any new behaviour add, the recommended entry point is now `system-design-router` (currently named `auto-skill-on-mistake` skill; will be renamed in a follow-on pass) which itself invokes `system-design` at Step 2 of its loop.

---

## 💰 Cost Efficiency Rules

Token-discipline rules — see `.claude/cost-efficiency.md` (routed out of CLAUDE.md 2026-05-22).

### 🎛️ Delegation Economy — model-tiering for multi-agent work (ALWAYS-ON, added 2026-07-02 per みや)

**Before ANY multi-agent fan-out (Workflow / Agent fleet): emit a 1-table DELEGATION PLAN, and every subagent runs the CHEAPEST model that is ENOUGH for its task shape.** Quality comes from the plan + forced output schema + controller verification — never from defaulting the whole fleet to the session model.

| Task shape | Model | Effort |
|---|---|---|
| Retrieval / extraction / synthesis / doc-writing | `sonnet` (Sonnet 5 — the FLOOR, no model below it) | `low`–`medium` |
| Adversarial verify · root-cause judgment · final verdicts | session model (opus-tier) | per stakes |

**🚫 Haiku BANNED from delegation (2026-08-16, per みや after audit)**: retrieval is NOT zero-judgment — a reader decides inclusion/stop-point/intent, and a silently-partial retrieval is undetectable (observability's permanent negative-space hole). Sonnet 5's pricing (permanent $2/$10, 2026-08-10) killed the savings argument; the real Delegation Economy savings come from resume-not-rerun + schema-forcing + the plan, never from the cheapest reader.

**Delegation-plan table columns**: stage · # agents · model · effort · output schema · expected token band.

**Mandatory disciplines**:
1. **Scout inline first** — enumerate the work-list BEFORE fan-out using the cheapest PRE-BUILT index that already holds it: Glob/ls for files · **codegraph MCP** for symbols/callers · pre-parsed codemap JSONs (`bpmn_flow.json` / `callgraph_callers.json` / `doc_catalog.json`) for Etanah structures — never raw-read what an index already answers (pre-parse-once). Batch it; schema-force every reader's output (prose returns BANNED for readers).
2. **Resume-not-rerun** — on ANY mid-flight failure (usage limit / crash / edit), resume the SAME runId: journaled results replay free; only failed agents re-run. Relaunching from scratch = BANNED. Patch ONLY the failed call-sites — editing a completed call's prompt/opts busts its cache and re-buys it.
3. **Usage-limit strategy** — a limit hit mid-flight makes the cache the asset: wait for reset, then resume the remainder on cheaper models; never restart.
4. **Controller verifies** — cheap-model outputs are DATA, not truth: the main loop spot-checks counts + sample rows against disk before reporting anything as fact.

**Why (2026-07-02, quest-system-audit Phase A)**: run 1 defaulted all 23 agents to the session model → 2.1M subagent tokens burned and died at the 5-hour usage limit with the synthesis unwritten; the strategic resume (103/121 results replayed from cache + `haiku` readers + `sonnet` synthesizer) finished the identical job for 0.79M. Same output quality, ~⅓ the cost — the only difference was the plan.

---

## 💾 Save Commands Reference

Save / quick-save / save-all / update-memory / forge commands / Redmine-retrieval triggers / `remember later` / `what are our to-do lists` - full command table + fallback rules now in `.claude/save-commands.md` (routed out of CLAUDE.md 2026-05-22).

---

## 📂 Active Project Rules

> ⚓ **Format Anchor** — every emit in §§8-10 obeys §2 HARD PRE-SEND GATE: table/arrow first, one register per cell, plain lede before any `file:line`, banned: numbered prose lists with ≥3 items + paragraphs carrying findings. (Internal-ref test 2026-06-01 S5 — if compliance holds, this anchor pattern replaces in-place rule repetition.)


When working on a project, **always load its project file first** — project files live in `projects/coding-projects/active/` and are the source of truth for specs, strategy, and constraints.

**Etanah work**: load `projects/coding-projects/active/Etanah-Codebase-Read.md` (~1500 lines / 65k bytes, exists on main repo working tree only — untracked-confidential, absent from worktrees; line count last verified 2026-06-02). Below is the **trigger-time summary of the most critical non-negotiables** so they fire at boot recognition (restored 2026-05-25 — decomposition cite was prose-only, target file is not auto-loaded; redundant with `Etanah-Codebase-Read.md` by design, OK per みや 2026-05-25):

**Etanah Non-Negotiable Rules at trigger time:**

- **🚨 KNOWLEDGE-FIRST (added 2026-07-20 per みや)**: for ANY etanah question, read `projects/coding-projects/active/etanah-knowledge/melaka/` BEFORE grep / codegraph / SQL. `index.md` maps every file's SCOPE. **Why**: a knowledge lookup is hundreds of tokens, a code trace is tens of thousands — and a fresh trace can stop halfway and report a partial rule (2026-07-20: reported a 4-item deny-list as the gate when the operative rule was a 4-item allow-list; both existed in the same file). **After any investigation that yields a reusable fact, write it back** so the next lookup is cheap.

- **🚨 BPMN-FIRST module-scope check (HARD RULE, added 2026-06-01 per みや, QA-262755 — listed FIRST because module-scope must be settled BEFORE analog-picking).** Etanah is **multi-module** — `etanah-pelupusan` (PLU/PT-side, the only WAR deployed on みや's local JBoss), `etanah-teknikal` (technical/charting/JT-side, **NOT** deployed locally — `.m2` empty for it), `etanah-awam` (portal), `etanah-common` (shared libs). **Many BA-reported tugasans live in `etanah-teknikal` (e.g. CK = Charting Keputusan, JT roles)** — fixing them in `etanah-pelupusan` is wasted work AND any "fix" can NEVER fire on the BA's tested page locally. **The rule**: BEFORE Scout, **`Read` the BPMN** `flowables-bpmn\MLK_PLP_<URUSAN>.bpmn20.xml` (≤200KB per urusan), **grep the BA-tugasan label/kod**, and classify:
  - **`<userTask>`** with `flowableTaskListener.receiveUserTask("<kod>", "<peranan>", task.id)` → this module (pelupusan) → SCOUT proceeds normally
  - **`<callActivity calledElement="MLK_TKL_*">`** → **etanah-teknikal** → STOP, surface scope, do NOT Scout the pelupusan codebase as if it were the bug-site
  - **`<callActivity calledElement="MLK_PLP_SUB_*">`** → pelupusan sub-process (`MLK_PLP_SUB_JBTN_TEK` / `MLK_PLP_SUB_UPN` / `MLK_PLP_SUB_UPW`) — still pelupusan, OK to Scout

  **The BA's two photos are typically the clue**: BA often provides a pelupusan-side photo (the SAVE step) alongside the teknikal-side photo (the bug-site) — read BOTH, identify which photo's tugasan lives in pelupusan, and scope the fix to THAT step (e.g. fix the SAVE writer so the teknikal READ has the right data). If the bug-tugasan is purely teknikal and pelupusan has no corresponding SAVE step, the ticket is **out of local scope** — hand off honestly.

  **Banned**: emitting a Scout/Recon/Rubric for a `MLK_TKL_*` CallActivity-rendered tugasan as if it were in `etanah-pelupusan`. Banned: picking a test app whose user routes to a non-deployed module (manifests as a `127.0.0.1:8080/etanah-teknikal/...` 404 — the WAR isn't deployed). **Why** (QA-262755 2026-06-01): Scout investigated `MlkSemakanDokumenKelulusanForm` (etanah-pelupusan, SDK tugasan) for a bug whose actual tugasan was **CK = Charting Keputusan** — rendered by `etanah-teknikal/AvalonMaklumatKeputusanMesyuaratForm.xhtml`. The PLPS BPMN at `MLK_PLP_PLPS.bpmn20.xml:516` clearly shows `38.0 Charting Keputusan Lulus` as a `<callActivity calledElement="MLK_TKL_CL_LP">` — the `TKL` prefix signaled teknikal in one grep. We built+deployed a fix that could never fire on the BA page; みや got a 404. One BPMN grep at Phase 0 would have surfaced this in seconds. Cross-ref: enforced as a **Phase 0 mandatory checklist row** ("🚨 BPMN flowable LOADED + SCOPE-CHECKED before Scout"); etanah-knowledge tier table promoted BPMN from "On-demand" to "MANDATORY before Scout" for any tugasan/flow-routing ticket.

- **🚫 Task folder = deliverables + みや's files ONLY; ASK before adding any file/folder (added 2026-07-17 per みや, #239386).** The Task folder is みや's workspace, not my scratchpad — same discipline as "one quest MD unless genuinely necessary". **Default contents**: `0. Brief/` · `1. Simulate/` · `2. Fix/` · `1. <NNN NNN>.txt` (his notes) · the xlsx · **one** patch script · **one** reset script · **one** evidence script. **Anything beyond that needs みや's nod FIRST.** **Banned**: creating per-topic .txt/.sql files to park my own findings · Q-bundles · checklists that duplicate the xlsx · "-findings" / "-notes" / "-derivation" files. **All** context, findings, questions, reasoning, references → the quest MD, never the Task folder. **Comments inside deliverables**: clinical · formal · general · very short · ONLY IF NECESSARY — labels suffice 99% of the time. Banned in any deliverable: person names · session dates · log timestamps · monologue · narration of how we got here. **Why** (2026-07-17): 239386's Task folder grew to 13 files, 7 carrying names/dates/monologue, one actively dangerous (a superseded script that silently reverts the patch's labels).
- **🚨 AWAM + No-Resit-urusan → derive the No Resit Carian Rasmi at Phase 0 (added 2026-07-20 per みや).** When a ticket is **AWAM** AND its urusan starts at `CarianRasmiHakmilikForm.xhtml` (PSBS · PLTP · MCL · PPTPB · PRBB, or any CRHM\* urusan), the **No Resit Carian Rasmi is REQUIRED test data and is almost never in the ticket Description/History** — BA omits it. Derive it yourself and write it into the Task notes file `1. <NNN NNN>.txt` alongside the Permohonan ID, same discipline as PLP. **How**: [etanah-knowledge/melaka/TEST-PERMOHONAN-INDEX.md](../projects/coding-projects/active/etanah-knowledge/melaka/TEST-PERMOHONAN-INDEX.md) § *No Resit Carian Rasmi* — carries the 4 validations, the jenis-hakmilik × urusan table, and a ready query. **Notes-file format**: `N) AWAM — <URUSAN> — No Resit: <no_resit> (<jenis>, <id_hkmlk>, resit <YYYY-MM-DD>)`. **Banned**: handing back an AWAM carian-rasmi ticket with "need a No Resit from BA" — it is derivable from the DB in one query.
- **Working-analog first** (canonical: `.claude/auto-memory/feedback_simplify_and_reference.md`, auto-loaded; also injected as Phase-0 row #4 in `ticket-gate.js:87`): Etanah is a mature system — most patterns are already solved somewhere. Before any new fix, find the closest working analog (sibling urusan / sibling tugasan / sibling bean / sibling template / working entry in `tindakan.config.json` / `tugasan.config.json` / `template.config.json`) that solves a similar shape and read its config + code path. Match the existing shape. **Slip-log running count: 22 strikes (2nd most frequent slip category).** 「みや 2026-04-29 onwards: *"This is a mature system — things are catered for"*, *"Refer to other working urusans/tugasans"*, *"Scrutinize Codex's changes — don't just refer to them"*, *"Simplify"*.」
- **Smallest change + programmer-written convention** (added 2026-05-30 per みや): make every code change as **small + specific** as the fix needs — touch nothing extra. Match the convention/structure written by **THIS system's own programmers** (sibling methods / classes inside `etanah-*`) — **NOT** generic framework-provided classes or Java-standard idioms — when the in-system pattern is itself sound. The analog you copy must be **programmer code that exists in the repo** (e.g. `populateLuasTanahMilik` as the analog for a new populator branch), not a textbook idiom. This is the operational form of "Working-analog first" above + the Rubric "read sibling code" step: the best option is *how the codebase already does this task*.
- **🚨 Minimal-diff discipline (added 2026-06-20 per みや, QA-261986)**: the committed diff must show ONLY the lines the fix needs. NEVER split an existing declaration, reformat, remove/re-add whitespace, or restructure surrounding code to fit a change. Prefer the **additive form** (e.g. add a fallback `if`-block that re-queries — leaving the original statement byte-for-byte) over the refactor form. A reviewer (or the teammate merging) must see EXACTLY what changed; incidental churn (declaration-split, whitespace, reordering) hides the real change and obscures *what you actually needed to touch*. **Banned**: touching any line the fix doesn't require. Pairs with In-file-convention-first below; verified at the Phase-1 `git diff --cached` review.
- **🚨 In-file convention first** — BEFORE writing any new method / constant / CC-tag / class / branch, grep the **TARGET FILE ITSELF**: (a) existing method doing ~90% of the job → add a branch to it, not a clone · (b) existing per-urusan/per-type branch idiom → reuse it. Reference: `if (PelupusanUrusanConstant.URS_X.equals(parameter.kodUrusan.get()))` appears 16× in `PelupusanWordCCMethodConstant.java` — that IS the in-file convention. **Banned**: parallel new code (new `populateXxxPru` + new tag + template re-bind) when the file already has an extensible method.
- **🏷️ Name by PURPOSE; reuse the established/analog name** (added 2026-06-18): name a new method / variable / constant for **what it DOES** or **what it MEANS** — never the screen/urusan/context it sits in. When the code mirrors a working analog OR the codebase already names that behaviour, **REUSE that exact name** (signals the parallel + aids grep). Reference: the category→tujuan cascade is `onChangeKategoriTujuanPermohonan` in AWAM + 3 pelupusan forms, so the migration cascade method took that name. **Banned**: screen/context suffixes describing WHERE not WHAT — e.g. `onChangeKategoriTujuanMigrasi` ("Migrasi" = the screen, not the behaviour). Same family as Working-analog-first / In-file-convention-first.
- **🚨 Per-file sibling-diff — before building, for EVERY file you touch**: locate the nearest working sibling, DIFF wiring across ALL coupling points (not just the line you changed):
  - **JSF tag attrs** (`mbb` / `helper` / VO / `mode` / `listener` / `process` / `update`) — missing attr = silent break (QA-258004: dialog omitted `mbb` → null)
  - **Listener method-ref sig** — parens vs no-paren + arg type must match exactly (QA-258004: `()` form never fired vs working no-paren)
  - **VO binding ↔ save source** — input writes to SAME instance the save reads (QA-258004: wrote `pajakanVO.premiumVO`, read `mb.premiumCukaiVO` → null)
  - **Bean/field lifecycle** — `@ViewScoped` survives postback vs rebuilt-to-null

  **Emit before building**: `<file> ← sibling <working file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓` (or name divergence). **Banned**: building without the diff.
- **Front-end / JSF: copy a WORKING sibling component; suspect the broken one even if it's the ticket's own code** (added 2026-05-31 per みや, QA-258004). When fixing a JSF/xhtml input/panel that misbehaves (value not captured, not saved, not displayed): (1) find a **sibling input in the SAME panel/form that already works correctly** and copy its full wiring — e.g. a `selectOneMenu` that persists has an explicit `listener=` + `process="@this"` + `update=`; one that silently fails is often **missing exactly that**. (2) **The component nearest the ticket's symptom is the prime suspect for being mis-structured**, not the framework. If the affected component looks like it deviates from how the working siblings are wired (missing listener / ajax / binding), treat *that deviation* as the bug and bring it up to the working sibling's structure. (3) Prefer the component that **looks like proper JSF structure** (full ajax wiring) as the template, not the half-wired one. **Why** (QA-258004): the MCL Syarat/Sekatan `et:selectOneMenu` dropdowns had NO `listener` while the sibling `kadar-cukai-sebelum` dropdown in the same panel did — so the selection never submitted to the bean and saved as null. The fix was to wire them like the working sibling. I wasted cycles theorising (land-report fallback, rebuild-overwrite) before just copying the working dropdown — which was the answer all along.
- **🚨 TEST SCENARIO = LIVE TASK STATE, NEVER A ROLE LIST.** One query first — `umm_a_tgsn`+`ind_tgsn`+`ind_ursn`+`pcp_pengguna` → `a_tgsn_id · kod · peranan_semasa · status_tugasan · nama_pengguna`. **Give the LOGIN, not the role.** Check if the app already sits on the failing step (usually it does → no setup walk). **Banned**: logins from `pcp_capaian_pengguna` / a peranan table / an old BA video — those say who *could* hold it. Ref `test-data-not-from-live-state`.
  - **A failed query is a WRONG QUERY until proven otherwise.** `column does not exist` → read `information_schema`; `relation does not exist` → schema prefix. **Banned**: calling it an environment/DB defect and proceeding on a guess.
- **Entity-first SQL**: query JPA entities via Hibernate annotations + DB tables, not by guessing column names. Verify table + column names before constructing SQL. Canonical task-state query: `UMM_A_TGSN + IND_TGSN + UMM_ALIRAN_KERJA + PCP_PENGGUNA + IND_PEJABAT`.
  - **🚨 Schema-qualify EVERY table + read the error before blaming the connection** (added 2026-05-30 per みや — recurring misdiagnosis): table names in MCP postgres queries MUST carry the schema prefix — `et_main_uat.<table>` for `mcp__postgres-mlkuat__query` (UAT) and `et_main.<table>` for `mcp__postgres-mlkfat__query` (FAT). An unqualified table throws `relation "<table>" does not exist`, which I once misreported as **"lost connection to the DB"** — it was NOT a connection drop, just a missing prefix. **When a query fails, READ the actual error text first**: `relation does not exist` / `no schema` → add the `et_main[_uat].` prefix and retry; only a real timeout/network error is a connection issue. Never claim "DB connection lost" without quoting the actual error.
  - **🚫 NO JOIN in any script handed to みや (added 2026-07-17 per みや, ref QA-263344 = the script Aaron rewrote for us).** Resolve ids by **kod-subquery**, one table per line, so the table-to-table path is readable at a glance: `WHERE tgsn_id = (SELECT tgsn_id FROM ind_tgsn WHERE kod = 'MPT' AND ursn_id = (SELECT ursn_id FROM ind_ursn WHERE kod = 'PT'))`. Applies to **both** evidence SELECTs **and** INSERT/UPDATE id-resolution. Hardcoded PKs stay BANNED (that's the same QA-263344 rule). `SELECT *` is acceptable for now. Enforced deterministically by `domain/convention-check-gate/` v1.6 (PreToolUse, BLOCKS on `.sql` containing JOIN; bypass `[skip-convention-check: <reason>]`). **Why**: a JOIN hides which table a value came from; みや reads these scripts to trace the data path himself.
  - **🚨 Scripts/queries HANDED TO みや are UNQUALIFIED (added 2026-07-03 per みや, #239386)**: any SQL delivered in CHAT or as a `.sql` FILE for みや to run carries **NO schema prefix** (`et_main_uat.` etc.) — he runs connected to the target schema and copy-pastes the same script between schemas (UAT/FAT/STG) without amending. Put "run connected to the target schema" in the script header instead. The schema-prefix rule above applies ONLY to queries **I** execute via the MCP tools (they fail without it). Two contexts, opposite rules — never mix them.
- **Word-template-first lookup**: when a ticket touches a `.docx`, read `PelupusanWordCCMethodConstant.java` first to identify the populator + CC tags before grepping the template binary.
- **PDF annotation extraction at Phase 0**: BA-provided PDFs contain Annot objects (FreeText comments, highlights, sticky notes) — extract via PyMuPDF (`annotations` skill) before treating the PDF text as the whole brief. Default Read tool misses annotations.
- **Renderer-side overrides before cache theories**: when output looks wrong, grep for forced-override patterns (CENTER alignment overrides, hardcoded image dimensions, vMerge locks) at the renderer/util layer BEFORE blaming cache or build state.
- **Branch / pull discipline**: at Phase 0 start, `git status && git branch --show-current` on relevant repos. **Baseline is per-repo: `mlk/master` (etanah-pelupusan) · `mlk/master` (etanah-awam — AWAM mirrors PLP: `mlk/master` is the LOCAL BASE, local-test only, BANNED from commit/push; branch `mlk/<tracker>/<num>` for commit/push; `mlk/stag-env`/`mlk/mlit` are DOWNSTREAM staging targets, NOT the base. Corrected 2026-07-02 per みや — was wrongly `mlk/stag-env` 2026-06-19 / `mlk/release/fat` before).** If not on the repo's baseline, do the standard sequence (stash → checkout baseline → pull --ff-only → stash pop). At Phase 1 close, pull before branching (see Phase 1 Closure section below).
  - **`mlk/master` BANNED from commit — both repos, no exception.** Never `git commit`/`cherry-pick`/`merge --no-ff` onto `mlk/master`, pelupusan or AWAM. Need a commit? `checkout -b mlk/<tracker>/<num>` first. "Apply/restore fixes so I can run locally" = `git checkout <source-branch> -- <path>` onto the current branch, left **uncommitted** — never a commit or cherry-pick.
- **Layer-aware Phase 0**: classify the fix layer (Java / .docx / config.json / SQL / Flowable BPMN / JSF / Spring) BEFORE Recon. Different layers have different Universal Checks.
- **TRG guardrail**: TRG is HARD EXCLUDED from Melaka work. If a fix would touch TRG code paths, stop and surface.
- **Multi-state classification first**: at every ticket-engagement, identify which state(s) the fix scope spans (Melaka-only, multi-state, all-states). Default scope = Melaka-only unless ticket explicitly broader.

---

## 🗄️ Database & Entity Resolution

> **MOVED to the quest skill** (JIT on every ticket trigger via ticket-gate): `.claude/skills/quest/SKILL.md` §Boot-summary content — Entity-first SQL · schema-prefix rules (MCP-prefixed vs みや-unqualified) · the `umm_aplikasi`/`aplikasi_id` spine · `ind_langkah.nama` symptom→screen lookup · patch-script portability + Stage-Match Block + expected-outcome annotation · RAW-FIRST scripts · Verify-SELECT true-values. (external-audit C1 2026-07-13; parity verified — changelog v1.65.)

---

## ⚔️ Quest Workflow

**THE ENGINE — `Scout → Recon → Rubric → Apply`.** Full workflow body: `.claude/skills/quest/SKILL.md` (incl. §Boot-summary content absorbed from this file 2026-07-13) + `quest/quest-protocol.md`. JIT-loading is deterministic: `ticket-gate.js` force-injects on ANY ticket mention (number / continuation / rework — the full trigger table now lives in the skill). The forced phase emits (Scout · RCRL · Recon · Rubric · Predicate Diagram · per-file sibling-diff line · Quest Briefing SD) remain MANDATORY — enforced by `quest-phase-gate` + the quest skill. Quest Preparation Verification table · scope-disambiguation cascade · Notes/History-first rules · Permohonan-ID 4-tier hierarchy · canonical task-state SQL: all in the quest skill. (external-audit C1 2026-07-13; parity verified — changelog v1.65.)

---

## 🔬 Debug Mode Rituals

**⏭ COLLAPSED 2026-06-01 (v1.48)** — trigger-time discipline lives in §10 Quest Workflow where debugging actually happens: **Ritual 1 Predicate Box → §10 Predicate Diagram (3-node ASCII)** · **Ritual 2 Evidence Language → §10 Recon honesty primitive (VERIFIED/HYPOTHESIS/BA-Q)** · **Ritual 3 Momentum Circuit-Breaker → `RecursiveLoopDetector.js` hook + Recon adversarial verification** · **Ritual 4 Debug Mode Setup → §10 Quest Preparation Verification table (env-switch · LIVE DB · server.log path covered)** · **Ritual 5 Permanent-fix + exhaust-to-confidence → §10 Rubric Confidence % row + Recon "exhaust accessible methods" implicit in honesty primitive** · **Ritual 6 Loggers-not-breakpoints → §10 Rubric Falsifier+Logger row + Logger-choice rule**. Full body retained in `quest/quest-protocol.md:822-890`. Standalone summary retired after Q2 audit found all 6 rituals had homes in §10 with no unique content left in this section (debug-ritual-violations.md DETACHED earlier this session; predicate-box skill anchor covered by §4 System-Layer skill registry).

---

## 📝 Commit message attribution

Commit trailer + subject conventions (MemoryCore vs etanah repos) — see `.claude/commit-conventions.md` (routed out of CLAUDE.md 2026-05-22).

---

## 🔢 Phase 1 Closure — Git Sequence

> **MOVED to the quest skill**: `.claude/skills/quest/SKILL.md` §Boot-summary content → Phase 1 Closure (ordered pull→branch→stage→commit→push→verify sequence + Commit-Push hard rule + branch-at-Apply ban). Runs ONLY after `local_test_confirmed=true`. (external-audit C1 2026-07-13.)

---

## 📦 Phase 2 Closure — Archive Hygiene (MANDATORY — boot-loaded 2026-05-31)

> Boot-loaded here because it lived ONLY in `quest/quest-protocol.md` (Phase 2 Step 4/5 + the `status=archived` definition :1209) — a NON-boot-loaded home, so it was **silently skipped** repeatedly (QA-258004 2026-05-31 — only the status flipped, folder + block left in place; prior: QA-262039, QA-260302 Phase-2 step-5 skips). Same failure class as the decomposition that buried trigger-time rules. Redundant with the protocol by design (per みや — boot-loaded visibility is what matters).

**`status=archived` is NOT "done" by itself.** Flipping the status field WITHOUT the moves below is an **incomplete close** — the exact slip this rule kills. At Phase 2 / quest wrap (or any "close X / X is done / archive X" trigger), ALL applicable moves MUST run in the SAME close-out, each emitted as a visible ✓:

1. **Task folder → Archive** — `Move-Item` the Windows Task folder `1. Tasks\Melaka\<n>. …` into `1. Tasks\Melaka\Archive\`. Use `-LiteralPath` (folder names containing `[FAT]` break wildcard `Test-Path`/`Move-Item` — the `[...]` parses as a char-class). Verify with a literal `Get-ChildItem … | Where Name -like "*<num>*"` count, never trust a `Test-Path` on a bracketed name.
2. **active.txt block → active-archive.txt** — `active.txt` is WORKING MEMORY: OPEN quests only (status ∈ active/hold/blocked/delegated). The moment a quest hits `closed`/`archived`, MOVE its whole block out to `quest/active-archive.txt` under a dated section header AND update the block's `task_folder=` to the new `Archive\` path.
3. **Project subfolder** — if `projects/coding-projects/archive/` exists, move `…/active/QA-<num>/` there too; else leave it + note (Ruri's internal workspace — secondary).
4. **Knowledge distill happens HERE, never mid-quest (added 2026-07-03, audit E13)** — BUG-BESTIARY / post-mortem / LEARNED-FROM-* entries are written ONLY at Phase-2 close, from VERIFIED findings; mid-quest distillation ships unverified knowledge (QA-262495: a bestiary root-cause entry had to be REVERTED when the diagnosis collapsed). During the quest, findings live in `QA-<num>.md` only.

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

**Historical reference**: `.claude/claude-md-amendments.md` — 🪦 DELETED 2026-08-16 (tombstone sweep, per みや): emptied 2026-05-25, boot-load removed 2026-06-02, zero live readers at deletion; recoverable via git history. Same sweep deleted 8 sibling tombstones (master-memory (file deleted 2026-08-16) · improvement-audit-log/skill-failure-log/debug-ritual-violations/sycophancy-violations/layer-architecture/forge-log under Feature/Forge-Self-Improvement-System/ · system/hook-fire-log.md).

## 📜 Version history

**Current**: v1.70 (2026-08-16 — §File Ownership +1 row: Operation-run outputs (audits/sweeps/bulk runs) get NO invented folders — session narrative to current-session+diary, per-item findings to each item own doc, standalone report only on explicit ask; root cause = miya-named judgment gap "you need to know where to put something" after the runs/ slip; spec preservation: purely additive row.) **Prev**: v1.69 (2026-08-16 — tombstone sweep per みや: 9 dead-by-declaration files DELETED (git-recoverable) after per-stone audit — header marker confirmed + zero live inbound refs (only comment/message-text mentions in 4 hooks, none reading); paired fixes: `auto-skill-trigger.js:70` stale skill-failure-log pointer → `core/slips.js`, §Historical reference updated. Boot untouched — none were in the boot path.) **Prev**: v1.68 (2026-08-16 — §Delegation Economy tier table refreshed for the Claude 5 family + **Haiku BANNED from delegation** per みや's audit ask: retrieval carries judgment (inclusion/stop-point/intent) and partial retrievals are undetectable; floor = Sonnet 5 ($2/$10 permanent since 2026-08-10, near-Opus-4.8-class); verify tier unchanged (session model). Spec preservation: 3-tier table → 2-tier; the dropped haiku row's "zero judgment" premise is the thing being retired — judged FALSE by evidence (2026-07-20 partial-trace case); all other Delegation Economy disciplines untouched. Evolution-check adoption #4 from the 2026-08-16 digest.) **Prev**: v1.67 (2026-07-17 — §8 TWO new Etanah non-negotiables per みや (#239386): (1) **🚫 NO JOIN in scripts handed to みや** — kod-subquery one-table-per-line so the table-to-table path is readable; applies to evidence SELECTs AND INSERT/UPDATE id-resolution; ref QA-263344 (Aaron's rewritten script) = the same rule that bans hardcoded PKs; enforced by `convention-check-gate` v1.6 PreToolUse BLOCK on `.sql` containing JOIN (5/5 behavioural tests pass; bypass `[skip-convention-check:]`). (2) **🚫 Task folder = deliverables + みや's files ONLY, ask before adding** — default set is 3 subfolders + notes + xlsx + one patch/reset/evidence script; all findings/context/questions → quest MD; comments clinical+short+only-if-necessary, labels suffice 99%; banned: names/dates/monologue in deliverables. Root cause: 239386's Task folder grew to 13 files, 7 carrying names/dates/monologue, 1 actively dangerous. Also: `feedback_uat_fat_environments` REWRITTEN — **UAT DECOMMISSIONED 2026-07-17**, no confirmed replacement, ASK みや before assuming a target; STG (`et_main_stg2`) verified reachable, FAT MCP auth failing). **Prev**: v1.66 (2026-07-14 — §Boot Slip-log surface RE-POINTED again per みや: `system/slip-log.md` (frozen archive since C7 2026-07-13) → `system/slip-dashboard.md` (auto-generated dashboard); added the NEW-slips-write-via-`core/slips.js` reminder inline + the "slip-log entry" → "`core/slips.js` entry" phrasing correction so future re-reads inject the CURRENT term into context; root cause = v1.63 already re-pointed once but at slip-log.md which C7 then froze without a v1.64+ sweep; spec-preservation diff: v1.63 escalation-only-surface spec PRESERVED, v1.63 "top-tables-only avoid 255KB" spec RETIRED as MOOT — dashboard is pre-summarized so line-limit N/A. Per みや after in-session language drift ("still using slip-log then?")). **Prev**: v1.65 (2026-07-13 — external-audit C1 SHRINK, conservative pass: 582 → ~260 lines. 4 sections → pointers, each parity-verified before cutting: §2 Output-Format → `.claude/reply-shape-spec.md` (pillar + flow kept inline) · §9 DB & Entity → quest skill §Boot-summary · §10 Quest Workflow → quest skill §Boot-summary (engine line + gate names kept inline; ticket-gate JIT-injects) · §Phase-1 Closure → quest skill. UNTOUCHED (no verified second home yet): Etanah non-negotiables · Phase-2 Closure · boot order · Disposition-5 · File Ownership · System-Layer · Cost-Efficiency. Absorption artifact: quest/SKILL.md +51KB verbatim section; spec 7.5KB. Overnight sprint, blanket nod). **Prev**: v1.64 (2026-07-12 — §Boot step 3 re-pointed `master-memory (file deleted 2026-08-16)` → `main/main-memory.md` direct; master-memory tombstoned with parity map (commands → save-commands.md · plugin install → new-machine-setup.md Step 2 · recall triggers already canonical in main-memory); boot-load-verification.js updated same pass (+ sanctioned amendments-drop from 2026-06-02); external-audit P0.3 ACCEPT-MODIFIED — auditor's phantom-skills justification corrected, real rationale = stale indirection + K1 precursor). **Prev**: v1.63 (2026-07-12 — §Boot Slip-log surface re-pointed to top-tables-only read (first ~83 lines of `system/slip-log.md`, STOP at first dated entries header, NEVER the full 255KB file); external-audit P0.2 ACCEPT-MODIFIED — handoff's `slip-counts.jsonl` target rejected as boot source (verified 3-line stub, no escalation data); interim until C7 slip-log v2; per みや walk-through approval). **Prev**: v1.62 (2026-07-05 — §9 Patch-rule fully hardened, SALVAGED from stranded worktree amazing-bassi (work of 2026-06-29): (3) ONLY UPDATE WHAT IS REQUIRED — no `version+1` proactively even on transactional rows unless `version` IS the fix, prior carve-out WITHDRAWN; (4) Stage-Match Block MANDATORY for transactional-table UPDATEs — 5-step derive-stage→locate-owner→column-match→FK-companions→verdict (✓matches / ⚠️revert-shape / 🚨mismatch), `⏭ N/A — reference table` for `ind_*`/`rjk_*`/`kod_*`; (5) Expected-outcome annotation MANDATORY (`-- N rows {updated|deleted|inserted}`); patch checklist 4→6 items; NEW Feature `domain/patch-script-gate/` Stop hook (ADVISORY v1, 2 checks) + NEW Feature `domain/prod-db-confirm/` PreToolUse hook (PROD DB permission-ask + audit log, pairs with `postgres-mlkprod-pg` MCP); per みや, PROD patch `0402DIS2025000170`). **Prev**: v1.61 (2026-07-03 — §9 RAW-FIRST scripts for みや: `AS`/functions banned unless necessary·purpose·requested; true column names + true contents; multiple simple scripts over combined joins; per みや, #239386). **Prev**: v1.60 (2026-07-03 — §8 Entity-first SQL: scripts/queries HANDED TO みや are UNQUALIFIED (no `et_main_uat.` prefix — copy-paste between schemas; "run connected to the target schema" in header); MCP-executed queries keep the mandatory prefix; per みや, #239386). **Prev**: v1.59 (2026-07-03 — audit E15: §2 SHOW-DON'T-EXPLAIN pillar promoted to the top of Explanation Discipline — 1-sentence prose max, layman+technical 2-sentence split allowed; quote + validation story in changelog). **Prev**: v1.58 (2026-07-03 — audit E13: Phase-2 Closure step 4 — knowledge distill (bestiary/post-mortem) ONLY at Phase-2 close from verified findings, never mid-quest; QA-262495 reverted-entry proof). **Prev**: v1.57 (2026-07-03 — audit Phase-E batch: §10 Rubric row (h) CODE-LOGIC scenario matrix + §10 Recon Cheapest-falsifier-first; paired with quest-phase-gate v2 (E2 entry-point + E3 mechanism-history advisories), hook-syntax-check ship-check (E5), E9 retire pass; per みや full nod, quest-system-audit). **Prev**: v1.56 (2026-07-02 — §Cost-Efficiency: Delegation Economy always-on rule — mandatory DELEGATION PLAN + cheapest-model-that-is-ENOUGH tiering (haiku retrieval / sonnet synthesis / opus-tier verify) + resume-not-rerun + controller-verifies; per みや after quest-system-audit Phase A: 2.1M-token limit crash vs 0.79M strategic resume, same quality). **Prev**: v1.55 (2026-07-02 — **AWAM baseline CORRECTED `mlk/stag-env` → `mlk/master`** (§8 Branch/pull + §10 git-state row) — AWAM mirrors PLP: local base = `mlk/master` (local-test only, no commit/push), branch `mlk/<tracker>/<num>` for commit, `mlk/stag-env`/`mlk/mlit` downstream; the 2026-06-19 v1.50 stag-env change was wrong. + §10 Stage-Ladder & Stop-Boundaries + Analog-origin git-probe Recon rule + "Blockers surface explicitly" honesty invariant; per みや QA-268273). **Older**: v1.54 (2026-06-28 — §10 Subagent-orchestration pointer: superpowers v6.0.3 integration; per みや, eval `wf_a90c9945`) · v1.53 (2026-06-27 — §2 Structured-Separated Problem/Cause/Fix shape + ESOKONGAN branch mapping) · v1.52 (2026-06-20 — compulsory Phase-0 git-state check) · v1.51 (2026-06-20 — §8 Minimal-diff + `convention-check-gate`) · v1.50 (2026-06-19 — AWAM baseline → `mlk/stag-env`). **Full history**: see `system/claude-md-changelog.md` (all v1.29 → current with rationale per version + the version-bump discipline rule).

**Version-bump discipline (always-on)**: every Refine Block / hard-rule addition to a protocol file MUST update the file's Version + Last Updated stamp in the same edit pass AND add a full entry to `system/claude-md-changelog.md`. Version is a single-integer increment per protocol revision (1.6 → 1.7). Audit-log entries alone don't surface protocol drift; the version stamp + the changelog do.

