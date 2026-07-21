# Quest Protocol

> Three-phase work ritual for formal job tasks (Etanah Melaka).
> Activated on work triggers. Each QA ticket is a Quest — accepted, executed, and reflected upon.
>
> **🌐 META-LAYER NOTE (added 2026-05-23, Phase 9 integration):** Quest is a Layer 2 workflow that COMPOSES Layer 3 capabilities (skills + hooks). Several disciplines historically embedded in this protocol have been **hoisted to atomic primitive skills** under the meta-layer (Layer 1). Quest invokes them by name; the underlying behavior lives in the primitive's SKILL.md.
>
> Hoisted Discipline primitives: `rubric` · `predicate-box` · `grep-rubric` · `multi-dim-evidence` · `sycophancy-circuit-breaker` · `confidence-table`.
> Hoisted Honesty primitives (invoke at hand-back + claim moments): `claim-verification` · `scope-anchor-echo` · `test-data-echo` · `task-assignment-honesty` · `stalling-detector`.
>
> Full refactor (remove inline duplicates + cite primitives by name) deferred to follow-on pass. Phase 9 v1 left inline content as-is for safety; primitive references added here for visibility.
>
> See `meta/INDEX.md` + `meta/discipline-INDEX.md` + `meta/honesty-INDEX.md` + `MIYA-NOTEBOOK.md`.

---

## Triggers

### Initial activation (Phase 0)
| Phrase | Action |
|---|---|
| `QA #<number>` | Phase 0 begins — auto-resolve Task folder (see Phase 0 Step 1) |
| "I have a task/ticket/bug to debug" | Phase 0 begins |
| Any formal Etanah/Redmine task context | Phase 0 begins |
| `/quest start <QA> <path>` | Phase 0 begins via skill |
| "Restart quest `QA #<number>`" | Reset phase to 0, status to active — search Task folder first, then `Archive/` inside it |
| `"Read Redmine"` | Run `node quest/redmine-sync.js`, then `--create` for any new tickets; for each new ticket: add a held Phase 0 entry to `active.txt` (`status=hold`); **then auto-spawn a Discovery early-diagnostic familiar per new ticket** (writes `projects/coding-projects/active/QA-<num>/early-diagnostic.md` — see Phase 0 Read-Redmine sub-protocol below); report results in a single table including username + tugasan_kod inference per ticket. みや picks which quest to start. No Phase 0 manual reading until みや confirms. |

### Phase transitions
| Phrase | Action |
|---|---|
| "Wrap up" / "Post-mortem" / "What did we learn" | Phase 2 begins |
| **Closure-on-Redmine signals** (added 2026-05-04): "I've passed/closed/submitted the ticket", "ticket is closed", "Redmine closed", "BA accepted", "FAT accepted", "approved on Redmine", "we're done with this ticket" | Phase 2 begins (BA-side closure is the strongest signal that the ticket is fully done — auto-trigger Phase 2 unless みや explicitly says "not yet, wait") |
| `/quest hold` | Current quest paused |
| `/quest resume` | Resume held quest |

### Prepare-to-commit (added 2026-05-04)
| Phrase | Action |
|---|---|
| "I want to commit now" / "Ready to commit" / "Prepare commit" / "Prepare me to commit" | Run prepare-commit sequence (below) |
| "We're done with the fix" / "Fix is done" / "Phase 1 done" / "We're done with Phase 1" | Run prepare-commit sequence |
| "Branch and stage" / "Stage for commit" | Run prepare-commit sequence |

**Prepare-commit sequence** (per みや 2026-04-30 convention, refined 2026-05-11):

**Checkpoint names** (added 2026-05-11 by みや; alphabet codes purged 2026-05-14 by みや — *"remove everything related to alphabets and replace it with the appropriate names so that this doesn't repeat"*):

| Checkpoint | Phase | What it covers |
|---|---|---|
| **Discovery** | 0 | Scout familiar + early-diagnostic load + DOMAIN-GLOSSARY out-loud + etiology check (see below). **Scout outputs are HYPOTHESES, never assertions** — when early-diagnostic claims a method/binding/tugasan/source-of-truth, label it explicitly as "HYPOTHESIS — verification-pending" and emit a Contract Verification Table (per the `system-design` skill) with each row tagged HYPOTHESIS until Recon source-verifies. **Scout's primary mode is parallel-fast reconnaissance** (multi-ticket retrieve / initial assessment) — quick HYPOTHESIS tagging, not deep verification. Don't over-invest at Scout. |
| **Recon** | 0 | Formal Recon block ritual — Universal Checks 1-**9** (UC9 added 2026-05-28) with file:line per row. **Plus Contract Verification Table** (cross-cutting per the `system-design` skill) when any Scout claim involves a method/binding/source-of-truth — each row independently source-traced (HYPOTHESIS → VERIFIED with file:line, OR downgraded to BA-Q). **Recon's primary mode is single-ticket deep verification** — 100%-VERIFY clause (line 545) applies. Scout/Recon overlap on "checking" is intentional redundancy ("better twice than miss once"); they differ in primary mode. **NEW Universal Check 9 — Sibling-structure read**: enumerate 2-3 closest sibling implementations of the artifact being modified (populator method / template SDT / data row format / config entry), with file:line citation each, BEFORE claiming the fix shape. Catches the helper-mutation-bug class of slip (yesterday's QA-262869 root cause was helper-call mutation that PSBS_Lulus precedent — cited in project doc since Phase 0 — would have caught at Scout if read end-to-end). |
| **Simulate** | 0/1 | Reproduce bug locally; auto-pengguna lookup; test plan emit |
| **Rubric** | 1 | Fix-shape options (A/B/C with pros/cons) + recommendation. **Architecture diagram is ALWAYS shown** (permanent fixture per みや 2026-05-14) — file-level relationships. **Contract Verification Table is ALSO ALWAYS shown** for any fix touching ≥2 layers OR adding new methods/fields/bindings — see the `system-design` skill → "Contract Verification Table" sub-ritual for canonical format (cross-cutting; same table format used by Scout + Recon + Rubric). Names hint, contracts decide — banned vocabulary ("plumbed", "wired", "matches pattern") per personality.md. Use plain ASCII boxes + arrows in the diagram, not Java type names. **EXPANDED 2026-05-28 per plan Phase 4 — Rubric phase IS the Code-Review phase** (despite the narrower English meaning of "rubric"): fully owns option-ranking + **Multi-Perspective Scrutiny Table** (6 lenses: Correctness / Completeness / Blast-radius / Edge cases / Thread-safety / Backward-compat — mandatory for non-trivial change) + **explicit Blast-Radius row** in mandatory output (currently only implicit via Contract Verification Table) + **Sibling-structure verification** (echo "checked N siblings: [file:line list]" from Recon UC9) + **Etanah-system integration deep-think paragraph** (mandatory for ≥2-layer fixes — one paragraph on how this fix interacts with sibling urusans / common-tax bindings / etanah-awam (applicant-facing) vs etanah-pelupusan (officer-facing) / shared utilities / Flowable workflows; long-thinking triggered). Standalone `rubric` skill absorbed 2026-05-28 — see Phase 4 below. |
| **Apply** | 1 | Code edit applied (with Predicate Box per Ritual 1 — Debug Mode Rituals section below). **🚨 PRESERVATION DISCIPLINE — HARD RULE (added 2026-05-12 after QA-247710 deletion-overreach slip)**: ONLY modify the specific lines required by the Rubric. **DO NOT DELETE any unrelated existing line, comment, or commented-out code without explicit みや authorization** — even if it looks "dead", "irrelevant", "outdated", "rushing", or "duplicated". Commented-out code is INTENTIONAL preservation by the original developer (debugging hints, candidate restorations, historical context, warnings to future devs) — must be respected. "Dead code cleanup" is a SEPARATE refactor task, NOT part of any bug-fix or enhancement ticket. If a line appears unrelated to the fix → KEEP IT. If unsure → ASK before deleting. **Why** (2026-05-12 QA-247710 Apply): I replaced the entire body of `populatePTGParagraph_PRU` with my 10-row injection, deleting (a) a critical warning comment ("Rushing, will attempt beautify later... cause external table to go missing"), (b) the noLot computation block, (c) the noLot eachRow injection, (d) ~100 lines of commented-out historical hints. みや: *"Did you just without any rights remove an important comment WARNING others about an issue? I just noticed you removed a WHOLE BLOCK of codes not just the comments!!"* The deletions weren't in the Rubric scope. The (a) warning would have prevented the later TagAttributeException debugging — I deleted my own future safety net. **How to apply**: at Apply, use `Edit` with targeted `old_string` covering ONLY the change region (insert-before/insert-after patterns), NEVER large `old_string` that includes unrelated surrounding code. If the framework's `Edit` tool requires a larger anchor for uniqueness, expand the anchor but preserve every line in `new_string` except the deliberate change. Pressure-test: if みや asks "what else did you delete?" — the answer must be "nothing other than the X line(s) we discussed". Pairs with the existing scope_anchor rule. **🧹 POST-REFACTOR DEAD-BRANCH AUDIT — HARD RULE (added 2026-05-23 after QA-261986 r3 slip)**: When the Apply step forks off a NEW method/path/strategy for a variant V (e.g. `populateXVariant` for variant V that previously had inline `URS_V.equals(...) ? "A" : "B"` conditionals in shared code, OR a new dispatcher entry that supersedes a `V_LIST.contains(...)` branch), IMMEDIATELY audit the shared code for V-specific branches and REMOVE the now-dead ones. The new method now OWNS V; the shared code must revert to V-agnostic. **Why** (2026-05-23 QA-261986 r3): Created `populateJabatanTeknikalTablePSBS` to own PSBS rendering, but left `URS_PSBS.equals(parameter.kodUrusan.get()) ? "3." : "3.1."` inside the shared `populateJabatanTeknikalTablePT` — the PSBS branch is dead (PSBS now dispatches to the new method) but stayed as code-debt. みや: *"Why didn't you remove ... after creating a new method? Should we do a code cleanup & checking like Rubric?"* **How to apply**: at every Apply emit that creates a variant-specific method, grep the OLD method/file for the variant's constants (`URS_V` / `V_LIST` / literal `"V"`) and decide per occurrence: still applies to the OLD path → keep; was for V (now in new method) → REMOVE. This rule REQUIRES related cleanup; it does NOT conflict with PRESERVATION DISCIPLINE which protects UNRELATED context. The two coexist: PRESERVATION protects what the refactor didn't touch; this rule cleans up what the refactor made dead. **Triggers**: phrases "create a new method for our urusan", "fork off X for variant V", "give V its own populator/handler", any time a new dispatcher entry supersedes an inline conditional. **Pre-commit gate**: if a refactor created a new variant method, the commit message must enumerate the dead-branch removals OR explicitly note "no dead branches found in OLD method". |
| **Verify** | 1 | みや local-tests the fix; confirms ralat/behavior |
| **Commit** | 1 | Prepare-commit sequence (this section); Ruri proposes message, みや executes |
| **Push** | 1 | みや executes push |
| **Wrap** | 2 | Post-mortem + KPI + Tasks folder hygiene + knowledge file updates |

Use these names in chat going forward. Historical references in journal/changelog files (`daily-diary/`, `improvement-audit-log.md`, `main/post-mortems.md`, `main/kpi-tracker.md`, archived ticket entries in `quest/active.txt`) are NOT retroactively renamed — those are historical records of what was emitted at the time. Operational files (protocol, skill, personality, todo, current-session) are kept current with these names.

### 🪜 Stage Ladder & Stop-Boundaries (added 2026-07-02 per みや)

The checkpoint steps above already exist; this names the **stop-boundaries** a "run until X" command targets + the deliverables each requires — so "run until Rubric" is unambiguous.

| Boundary | Deliverables required to claim it (in order) |
|---|---|
| **until Rubric** | Phase-0 prep table · Scout emit · Recon emit (RCRL) · Rubric emit · Story Diagram (SD) · /verify Checklist A |
| **until Apply** | [until Rubric] + Code-Impl Check (convention-check + blast-radius + Predicate Diagram + per-file sibling-diff) · Apply edit · /verify Checklist B · Test Scenario hand-back |
| **until Close** | [until Apply] + `local_test_confirmed` · Commit · Push · /verify Checklist C · (Phase 2 archive hygiene) |

**Flexible — skip-don't-reorder**: omit an inapplicable deliverable with a 1-line reason; NEVER reorder; NEVER claim a boundary with a deliverable missing + unexplained.

**Enforcement via `/goal` (per みや 2026-07-02)**: a "run until <boundary>" invocation MAY be enforced by setting a `/goal` whose condition is that boundary's deliverable-checklist — the Stop hook then blocks until every deliverable is emitted. This is the flexible, per-invocation enforcer; it **complements** (does not replace) the deterministic `quest-phase-gate` (which hard-blocks etanah-* edits until the Scout/Recon/Rubric banners exist). No new hook required — the ladder + `/goal` reuse what already exists.

**Auto-etiology check at Discovery (NEW 2026-05-11, EXTENDED 2026-05-13 with parent-ticket linkages)**: Scout MUST parse the ticket's `Description.txt` AND `History.txt` for related-ticket references — patterns: `Refer to <TYPE>-<CR>? #?<num>`, `Related to ... #<num>`, `UAT-CR #<num>`, `QA #<num>`, `Requirement #<num>` (parent ticket linkage in Redmine). For each found reference, `git log --all --grep <num> --format="%h %ci %an %s"` in the relevant repo (etanah-pelupusan or etanah-awam) and surface findings in `early-diagnostic.md` under a new **`## Etiology — related tickets, parent linkages & origin commits`** section. **Parent-ticket handling extension (added 2026-05-13 per みや QA-260733 question)**: when Description shows `Requirement #X: <title>` parent linkages (e.g. QA-260733 has `Requirement #215975: Pelupusan - Parent Ticket All Urusan` + `Requirement #218297: PLTP - Permohonan Lanjut Tempoh Pajakan`), capture parent number + title only (DO NOT auto-fetch sub-requirements list — parents can have 100+ sub-tickets, context cost too high). Mark as on-demand: if a scope-ambiguity Q arises later at Rubric (e.g. "PLTP-only or all-urusans?"), THEN do targeted Redmine API lookup of the SPECIFIC parent's sub-requirements list. Cheaper, surfaced only when needed. Today's QA-259428 had "Refer to UAT-CR #236559" in Description.txt line 13; Scout should have caught it without みや having to ask later. Pattern recognition: the smoking-gun commit for a bug-fix-completion ticket is usually findable via `git log --grep <related-CR-num>`.

**🔎 Existing-fix probe (added 2026-06-19 per みや, QA-266215)** — at Discovery, ALSO probe whether THIS ticket already has a fix in flight by someone ELSE, BEFORE deep-diving: `git branch -a --list "*<ticket#>*"` + `git log --all --grep="#<ticket#>" --format="%h %ci %an %s"`. If a fix branch/commit exists under another author (QA-266215 → Vincent `fc6f6d4ba6` on `mlk/internal/266215`), STOP + surface it — the ticket may already be owned/fixed; archive shipped-by-other rather than burning a deep-dive on solved work. Distinct from the etiology check above (that finds RELATED/parent tickets; this finds the ticket's OWN fix-existence). **Why**: QA-266215 — I deep-dived an owner-count hypothesis for a ticket Vincent had already fixed; one `git branch -a --list "*266215*"` would have surfaced his branch in seconds.

**🔎 Analog-origin git-probe (added 2026-07-02 per みや, QA-268273)** — when the Rubric's fix REUSES or EXTENDS an existing mechanism (working-analog reuse), git-log THAT mechanism's ORIGIN before adopting it: `git log -S "<symbol>" --oneline <baseline>` + read the introducing commit's message + ticket. Confirm: (a) its **intent**, (b) the un-handled case wasn't **deliberately excluded**, (c) whether THIS ticket is a **same-commit regression**. **Banned**: proposing "reuse mechanism X" as the fix without git-logging X's origin — reusing a mechanism blind to why it's scoped the way it is risks re-introducing a bug the original author deliberately avoided. Distinct from the existing-fix probe (finds the ticket's OWN fix) + the etiology check (finds RELATED/parent tickets) — this probes the **analog's** origin. **Why** (QA-268273): the fix reused `carianRasmiPemohonGate`; git history showed it was introduced by #266740 five days prior, that draft-Kemaskini was simply out of #266740's scope (NOT a regression), and that reusing it was intent-aligned — turning a static-plausible reuse into a confirmed, verified fix.

**Single canonical per-ticket doc principle (NEW 2026-05-11, EXECUTED 2026-05-28 — was deferred 17 days)**: The multi-file pattern (`early-diagnostic.md` + `scout-report.md` + `handoff-XXX.md` + `class-chain-traces.md` + `Fix.txt`) is **deceiving** — reading one file but not the others gives a stale view. みや 2026-05-11: *"It has happened before. About the handoff, definitely drop it off."* **EXECUTED 2026-05-28 per plan `cached-floating-hummingbird.md` Phase 1**: canonical template at `.claude/skills/quest/QA-NNN-template.md` (sections: Resume Point / Context Loading / Debugging / Code-Review / Apply / Verify / Commit / Push / Wrap / Etiology / Improvement Checklist). `/quest start` Step 4 copies template to `projects/coding-projects/active/QA-<NNN>/QA-<NNN>.md`. Subsequent phase emits write to THAT file. Sibling files (`early-diagnostic.md` etc.) are deprecated for new quests — `pre-action-check-gate.js` blocks edits to them. In-flight pre-2026-05-28 quests retain their multi-file pattern (no forced migration).

---

**Proactive Initiative emit format (NEW 2026-05-28 per plan Phase 3.B.0)**: at every phase emit (Discovery / Recon / Rubric / Apply), Ruri MUST surface 2-3 things noticed BEYOND what was asked. Format:

```
**Proactive surface** (3 things you didn't ask but I noticed)
1. <observation 1 — ties to concrete file:line, protocol section, or precedent>
2. <observation 2>
3. <observation 3>
```

If genuinely nothing notable surfaced: write `no proactive items this emit` + 1-line reason (e.g. "scope was narrow + cleanly defined; no adjacencies surfaced"). The empty case is allowed but must be visible — not silent omission. Hook enforcement (Phase 5): if a phase-emit shape appears AND no Proactive surface section AND no `[skip-proactive: <reason>]` bypass token → Stop-hook blocks (Stage 5B; Stage 5A advisory). Why: yesterday's QA-262869 root frustration was "Ruri stopping half-way, not showing initiatives, forgetting about etanah-system" — Proactive surface forces initiative as a structural emit element, not a discipline hope.

**100%-VERIFY binding to Scout + Recon emit (NEW 2026-05-28 per plan Phase 3.B.2)**: the 100%-VERIFY clause at line 545 (added 2026-05-08 after QA-260139, みや framing: *"I used the word 100% many many times. 100% Ruri."*) is bound to Scout + Recon emits via 3 layers: (1) inline cross-reference here in the protocol (this paragraph), (2) `scout-completeness-gate.js` hook reminder when familiar spawned or Recon-emit shape detected, (3) Stop-hook hard-block via `silent-claim-drift-gate.js` extension — if Recon emit contains a HYPOTHESIS row without paired VERIFIED row OR a file:line claim without `(verified @ file:line)` tag, block turn-end (Stage 5B; Stage 5A advisory).

**Ticket-type classification at Discovery (NEW 2026-05-28 per plan Phase 2)**: at `/quest start`, Ruri reads `Description.txt` + `History.txt` and classifies the ticket as one of `bug | enhancement | cr | requirement`. Classification written to `active.txt` `ticket_type=` field + the QA-NNN.md Context Loading section with Description-quote justification. Different sub-rituals trigger per type: **bug** = full Debug Mode Rituals (Predicate Box mandatory at Apply, sibling-check at Code-Review) · **enhancement** = requirements-bias path (deeper integration think before Apply) · **cr** = enhancement + cross-ref to parent UAT-CR ticket · **requirement** = parent-ticket handling (capture parent #+title, defer sub-requirements lookup until scope-ambiguity at Rubric). If classification ambiguous: pick best fit, note ambiguity in Context Loading section, mutable per-turn via active.txt edit if みや overrides at Recon emit.

---

**etanah-knowledge tiered load at Phase 0 (NEW 2026-05-28 per plan Phase 2)**: Quest skill SKILL.md Step 5 loads etanah-knowledge **inline** via Read-tool calls per the tier table (there is no `etanah-knowledge-load` skill dir — direct file-reads, or the `quest-phase0` Workflow). Three tiers:

| Tier | Files | When |
|---|---|---|
| **Always (Phase 0)** | `etanah-knowledge/melaka/index.md` + `DOMAIN-GLOSSARY.md` + `MODULE-ARCHITECTURE.md` + `BUG-BESTIARY.md` + `DEFERRED-CRITICAL-ISSUES.md` | Every `/quest start`, regardless of ticket type |
| **Conditional (Phase 0 if symptom matches)** | `DATABASE.md` (DB-touch tickets) / `FLOWABLE-WORKFLOWS.md` (workflow tickets) / `JSF-WIRING.md` (UI tickets) / `FLOW-TRACES.md` (deep-debug tickets) / `FRONTEND-PATTERNS.md` (UI enhancement) / `URUSAN-FLOW.md` (cross-urusan) / `PERANAN-MAP.md` (role/permission) | `index.md` routes based on `ticket_type` + Description keywords. Routing decision logged in QA-NNN.md Context Loading section |
| **On-demand (mid-quest)** | `TEST-PERMOHONAN-INDEX.md` + `DEV-TESTING-HACKS.md` + raw BPMN XML (`flowables-bpmn/*.xml`) | Loaded at Simulate phase (test data lookup) or at Debug phase if Flowable trace needed |

**Why tiered**: full-load of all 14 layers + 20 BPMN XMLs costs ~50K+ tokens per quest. Tiered load drops ~60% while keeping 100% coverage on high-frequency layers. SQLite migration for lookup-shaped layers (TEST-PERMOHONAN-INDEX, PERANAN-MAP) deferred to its own session — out of scope here.

**Step 0 — Base-branch identification (NEW 2026-05-11 after QA-260139 slip)**:

| Repo | Source-of-truth base | Notes |
|---|---|---|
| etanah-pelupusan | **`mlk/master`** | UAT + FAT both use master; differs only by config |
| etanah-awam | **`mlk/master`** (local base) | **Corrected 2026-07-02 per みや — AWAM MIRRORS PLP** (was wrongly set to `mlk/stag-env` on 2026-06-19; earlier `mlk/release/fat`). Local base = `mlk/master`: pull to stay current, implement + **local-test** here. **BANNED from commit/push to `mlk/master`** (local-test only). Then branch `mlk/<tracker>/<num>` (per commit-conventions) → stage → confirm msg → commit → push to THAT branch. **Downstream (FYI only, NOT per-ticket work):** the ticket branch is merged into `mlk/stag-env` or `mlk/mlit` for BA staging test → release branch → production — so `mlk/stag-env` / `mlk/mlit` are NOT the base, they are downstream targets. `mlk/int-env` stale (2026-03-31) — ignore. |

**Verification command** (run any time the right base is uncertain):
```bash
git for-each-ref --sort=-committerdate --format='%(committerdate:short)  %(refname:short)  %(subject)' refs/heads/mlk/release/fat refs/heads/mlk/int-env
```
The branch with the latest date is the source-of-truth. **DO NOT compare `origin/<branch>` refs** — single-branch `git pull origin <branch>` doesn't always update the corresponding `origin/<branch>` remote-tracking ref, so they go stale; comparing them gives wrong answers. **Compare LOCAL branch tips** (which the pull does update).

1. `git status --short` and `git branch --show-current` — confirm current state
2. If branch is `mlk/<type>/<number>` already: skip steps 3-6, jump to step 7 (already on the right branch from earlier session)
3. If branch is the source-of-truth branch (per Step 0) with modifications: `git stash push -m "<ticket> fix prep"`
4. **🚨 MANDATORY — DO NOT SKIP (slipped 2026-05-08 QA-260154)**: `git pull --ff-only origin <source-of-truth-branch>` — between stash and branch. Without this, the new branch forks off STALE base. Repeated paraphrase failure: when announcing the prepare-commit sequence in chat, DO NOT summarize as "stash → branch → pop"; that drops the pull. Always say "stash → **pull** → branch → pop → stage" or copy the 9 steps verbatim from this section.
5. `git checkout -b mlk/<type>/<number>` — type+number from `quest/active.txt`. **`<type>` follows the Redmine TRACKER** (added 2026-06-19 per みや, QA-266249): `qa` (QA) · **`internal`** (INTERNAL ISSUE (PERMANENT FIX) — 🚨 corrected 2026-07-21 per みや, was `internal-issue`; use `mlk/internal/<num>` only) · `fat` · `uat` · `fat-or` · `uat-cr`. Pairs with the commit-subject prefix — QA → `QA #<num>`, INTERNAL ISSUE → `Ref #<num>` (see `.claude/commit-conventions.md`). Example: QA-266249 (INTERNAL ISSUE) → branch `mlk/internal/266249` + commit `Ref #266249 - PT - Fix Keluasan Tanah`.
6. `git stash pop` — auto-pop. If conflict, `git status` for unmerged paths, **PAUSE and report to みや** (don't auto-resolve)
7. `git add <each modified file by name>` — stage all the work-in-progress files (NEVER `git add .` or `-A`)
8. `git status` to verify staged files
9. **HAND OFF** — output: branch name + N files staged + **proposed commit message** (per the convention below — みや uses as-is, modifies, or overrides). Once みや confirms the message and asks Ruri to commit, Ruri runs `git commit` then `git push` (see the Commit + Push hard rule below). Refined 2026-05-11 by みや: *"Please always include the comment into the protocol after you branched out successfully"* — proposing the message is now part of hand-off, not optional.

**Hard rule (Commit + Push — Ruri proposes the message, then runs both; updated 2026-05-19 by みや — supersedes the prior "みや executes" model)**: Ruri **MUST** propose the commit message at hand-off (per convention) — みや decides accept/modify/override. Once みや has (a) confirmed the message and (b) asked Ruri to commit, Ruri runs `git commit` **then auto-runs `git push`** — no separate push instruction needed. Hold the push only if みや says "commit only" / "don't push". The harness auto-mode classifier may still prompt みや to approve the actual `git push`. The proposed message must follow the convention below (no `fix` prefix, no `AWAM`/`MLK`/repo tags, subject-only, no body, no `Co-Authored-By` trailer).

**Violation log (Commit)**:
- 2026-05-11 QA-260139: Ruri ran `git commit` itself + included body + Co-Authored-By trailer + "fix" prefix + "AWAM"/"MLK" tags. みや reset. **Still forbidden post-2026-05-19-update**: body, Co-Authored-By trailer, "fix" prefix, "AWAM"/"MLK" tags. Running `git commit` / `git push` is now expected — after みや confirms the message — but only with a convention-correct subject; the wrong-format reasons are caught at proposal time (みや reviews before Ruri executes).

**Phase 1 close-out summary emission — MANDATORY (added 2026-05-20 by みや)**: When Phase 1 closes (after `/verify` Checklist C goes green), emit a one-line summary in chat: `Phase 1 closed at <YYYY-MM-DD HH:MM TZ> · commit <SHA> · duration <quest-initiation → close, in hours/minutes>`. Quest-initiation = the moment the QA # first appeared in active.txt OR the earliest "Retrieved" entry in the Step Log.

**🗂️ Backup-on-mutation — MANDATORY (added 2026-05-23 by みや, QA-261986 r9)**: Any time Ruri performs a non-trivial mutation of an existing file — especially binary like `.docx` — create a backup `.bak_<YYYY-MM-DD>_<short-reason>` beside the file BEFORE the mutation, atomically (the python scripts' `atomic_rewrite` pattern). The backup is the only on-disk safety net for binary edits (git's diff is useless for binary; restoring takes a checkout). **Failsafe**: if the same file is mutated multiple times in one session, keep ONLY the latest pre-edit backup (newer backup replaces older — don't accumulate). **Why** (2026-05-23 QA-261986): multiple iterative `.docx` edits accumulated 10+ backups across the session — without backups the stash-pop conflict-recovery wouldn't have been possible, but the accumulation itself was untidy. Backups are mandatory; accumulation is not.

**Phase 1 close-out backup-file cleanup — MANDATORY (added 2026-05-20 by みや; RE-TIMED 2026-05-23 by みや)**: **Cleanup fires during the prepare-commit sequence, NOT after push.** Specifically: BEFORE `git status --short` confirmation (step 8 of the prepare-commit sequence above), delete all `.bak_*` files in the touched repo directories. The motivation (2026-05-23 QA-261986): when prepare-commit emits the working-tree status, untracked `.bak_*` files create noise that obscures what's actually being staged — みや had to scan past 10 .bak rows to see the real change set. Moving cleanup forward keeps the prepare-commit emit clean and unambiguous. **Failsafe**: if any `.bak_*` file is more than 7 days old, surface it to みや before deleting (it may be a deliberate long-term preserve from a different session). **Why** (2026-05-20 QA-262233 original): I created `.bak_*` files during iteration, committed the fix, never cleaned them up — みや had to ask. **Why** (2026-05-23 re-time): noise during commit-prep emit. Cleanup is part of commit-prep, not post-push optional housekeeping. Pairs with the Backup-on-mutation rule above (which creates them) — together: create on mutation, clean at commit-prep, NEVER post-push.

**Phase 1 close-out duration summary — MANDATORY (added 2026-05-20 by みや)**: I closed Phase 1 silently — みや had to ask when the close happened + why no report. Time-awareness slip: the meaningful metric is initiation → closure (quest duration), NOT phase-to-phase deltas. Pairs with reply-log.js Stop hook which already logs ts; the human-readable summary line is the gap.

**Compound trigger — "wrap + commit prep + close" (added 2026-05-12, pull-step corrected same day)**: Recognize ANY combination of these phrases as a Phase 1 full close-out request — auto-fire the entire flow (stash → **pull --ff-only origin <source-branch>** → branch → pop → add → propose commit message → みや confirms the message → Ruri runs commit + push → return-to-main → pull → update active.txt → `/verify`). **🚨 The pull between stash and branch is mandatory** — see line 75 hard rule. Never paraphrase this sequence without the pull; both today's tickets (QA-259318 v2 and QA-260179) had it dropped in the announcement (master happened to be at-tip so no merge conflict, but it's a stale-base risk we don't take):

- "I want to wrap up phase 1" / "wrap up phase 1" / "wrap phase 1"
- "prepare for me to commit" / "prep the commit" / "ready to commit"
- "I've already tested" / "it was successful" / "test passed" / "tested + working"
- "let's close this ticket" / "close this ticket" / "close phase 1"

Canonical full phrase (みや 2026-05-12): *"I want to wrap up phase 1, prepare for me to commit, I've already tested & it was successful let's close this ticket"* — fires the entire flow end-to-end with one prompt.

**Hands-off scope clarification (refined 2026-05-12, updated 2026-05-19)**: prepare-commit prep is fully Ruri-owned and executes automatically on "prepare for me to commit" / "ready to commit" triggers:
- `git stash push -u -m "<ticket> prep"` (when master is dirty and we need to switch to a fresh rework branch)
- **`git pull --ff-only origin <source-branch>` 🚨** (MANDATORY — see line 75 hard rule; the new feature branch must fork off latest, not stale)
- `git checkout -b mlk/<type>/<number>[v2/v3...]` (rework branch creation, off the just-pulled source)
- `git stash pop`
- `git add <specific files>` (NEVER `git add -A` or `git add .`)
- `git status --short` confirmation

Why this matters: 2026-05-12 QA-259318 — Ruri presented the entire stash→branch→pop→add sequence as a copy-paste block for みや to run, after over-correcting from the 2026-05-11 reset. みや: *"Why didn't you automatically branch out when I say prepare for me to commit?"* The prep sequence is mechanical and Ruri-owned. Ruri then proposes the commit message; once みや confirms it and asks Ruri to commit, Ruri runs `git commit` then `git push` (2026-05-19 update — see the Commit + Push hard rule above).

After commit + push land: Ruri proceeds with Phase 1 close-out auto-steps per the STOP gate (return to main, pull --ff-only, update active.txt, `/verify`).

**Hard rule — "comments" disambiguation (added 2026-05-11)**: When みや asks for "the comments for this ticket", ASK ONCE which he means — git commit subject vs Redmine journal — and emit only that one. Don't auto-emit both. Default guess if unclear: git commit message (since Redmine journals are auto-written to `History.txt` by redmine-sync now).

**Hard rule — Auto-pengguna at END of Recon (refined 2026-05-12 by みや for explicit trigger clarity)**:

**Trigger** (sure-fire, explicit): Ruri MUST run the canonical task-state query for the test_app's `id_pengenalan` **at the END of Recon emit** — AS PART OF Recon's output block, NOT at start of Simulate. Test data is INPUT to Simulate, not its output. By the time みや sees the Recon Verdict line, the test-data table must be visible inline immediately above or below it.

**Why explicit trigger** (2026-05-12, みや): "I need the solid proof you've written it down in the protocol/skill." Previously the rule said "when emitting a test plan" — ambiguous. The Recon block IS the moment of emit, because みや uses Recon to decide whether to proceed to Simulate; without test data in hand at Recon emit, he can't simulate.

**Secondary triggers** (already in place, do not remove):
- Simulate simulate plan emit (if Recon didn't already include it — fallback)
- Verify verification plan emit (different test data may apply if FAT vs UAT)

**Standard output format (refined 2026-05-11)**:

| Permohonan ID | Pengguna | Kod Tugasan | Nama Tugasan |
|---|---|---|---|
| <id_pengenalan> | <pcp_pengguna.nama_pengguna> | <ind_tgsn.kod> | <ind_tgsn.nama> |

**Filter**: `UMM_A_TGSN.FLAG_AKTIF = 'Y'`. If zero rows return, apply the **AFTER-then-BEFORE fallback** (refined 2026-05-11 by みや):
1. **Active at the target tugasan** (`KOD_TUGASAN = '<target>'` + `FLAG_AKTIF='Y'`) → use directly.
2. **Active at a tugasan AFTER target** (workflow has advanced past target — all intermediate file-generation steps have already run, so flowable-rollback to target is data-safe) → use this and notify *"Active is at X (after target); use flowable-alter to roll back to target — intermediate files exist."*
3. **Active at a tugasan BEFORE target** (workflow hasn't reached target — flowable-forward would SKIP intermediate file-generation, risking missing data) → use only if no AFTER option exists, notify *"⚠️ Active is at X (before target); flowable-forward to target may skip file generation. Consider asking BA for fresh test data."*
4. **No usable test data in the working env — MIRROR the bug-shape from the env that HAS it (added 2026-06-22, QA-266503)**: when the bug only reproduces in an env we can't test locally (e.g. the bug is on STAGING / BA's env) and the working env (UAT) has no app with the triggering data shape, **mirror the source app's bug-shape into a working-env app via a prepared data-patch**. Procedure:
   - **(a) Read the SOURCE chain** in the bug env. Staging (`mlkstg` @ 172.30.12.202:5444) — **active schema is `et_main_stg2` since 2026-07-05** (team moved off `et_main_stg1`; per-schema login roles `et_main_stg1`/`et_main_stg2`, and stg1's role has NO grant on stg2 — cross-schema reads fail). MCP route: `mcp__postgres-mlkstg__query` (⚠️ its connection role must match the active schema — if it errors `permission denied for schema`, the MCP conn string in `~/.claude.json` is still on the old role). Fallback: read-only `pg` script (`%TEMP%\stgquery\`); creds come from JBoss `standalone/configuration/standalone.xml` (the `etanahDS` datasource: host/db/user/pw — user-name must also match the active schema's role). Capture the exact rows + columns that drive the bug (e.g. `ind_versi_permit_lesen`: `versi_dok` + `trkh_tamat` + `mklmt_bayaran`).
   - **(b) Read the TARGET's current rows** in the working env (`SELECT *`) to template the patch + get the stable PKs + the linking IDs (permit_lesen_id, aplikasi_id).
   - **(c) Generate an UPDATE-only patch** that transforms the target to mirror the source bug-shape. **Prefer UPDATE-remap** (no INSERT/DELETE → no FK churn); **ONE atomic CASE update** (all rows read on pre-update values → no remap ambiguity) keyed by PK **with a permohonan-id-subquery guard**; **leave `version` untouched** (no optimistic-lock bump) and tell みや to **reload the app/screen after** (fresh entity read, else a stale cached entity overwrites the patch on next Simpan).
   - **(d) みや runs the patch** on the working env (Ruri has read-only DB access — **prepare, never execute**). Save the patch + pre/post verification SELECTs to `projects/coding-projects/active/QA-<num>/`.
   - **Template/example**: `projects/coding-projects/active/QA-266503/mirror-staging-to-uat-patch.sql`.
   - **Banned**: INSERT/DELETE when an UPDATE-remap suffices · hardcoded PKs without a permohonan-id guard · bumping `version` (optimistic-lock risk) · executing the write yourself.

Drop `peranan_semasa`, `kod_pejabat`, `pejabat`, `flag_aktif` from the displayed columns — too noisy; if needed for follow-up, run a separate query.

**Standard query** (subquery via `UMM_APLIKASI.ID_PENGENALAN` to be schema-portable):
```sql
SELECT UA.ID_PENGENALAN AS permohonan_id,
       pps.NAMA_PENGGUNA AS pengguna,
       IT.KOD AS kod_tugasan,
       IT.NAMA AS nama_tugasan
FROM <schema>.UMM_A_TGSN UAT
INNER JOIN <schema>.IND_TGSN IT ON IT.TGSN_ID = UAT.TGSN_ID
LEFT JOIN <schema>.PCP_PENGGUNA pps ON pps.PENGGUNA_ID = UAT.PENGGUNA_SEMASA_ID
LEFT JOIN <schema>.UMM_APLIKASI UA ON UA.APLIKASI_ID = UAT.APLIKASI_ID
WHERE UA.ID_PENGENALAN ILIKE '%<test-app>%' AND UAT.FLAG_AKTIF = 'Y'
ORDER BY UAT.CREATED_DATE DESC LIMIT 5;
```
Schema: `et_main` for MLKFAT (`mcp__postgres-mlkfat__query`), `et_main_uat` for MLKUAT (`mcp__postgres-mlkuat__query`).

**Why**: 2026-05-11 QA-259428 simulate plan listed "PSJT officer login TBD — let me know if you want me to query" — みや had to point out the query should have auto-fired AND the original 13-column output was too noisy. The 4-column table is the standard going forward. **Violation log**: 2026-05-11 QA-260139 — Ruri ran `git commit` with self-written body + Co-Authored-By trailer + "fix" prefix + "AWAM" + "MLK" tags despite all four being against convention. みや had to reset the commit. Don't repeat.

**Hard rule — Auto-log permohonan ID to `1. <NNN NNN>.txt` (added 2026-05-12, format simplified same day)**: Whenever みや shares a permohonan ID during the Simulate phase (Simulate onwards) — verbally, in chat, or by saying "I've altered <ID>" / "I'm on <ID>" / "use <ID>" — Ruri MUST:

1. **Auto-search pengguna semasa** for the ticket's target tugasan via the canonical task-state query (use `mcp__postgres-mlkfat__query` for FAT, `mcp__postgres-mlkuat__query` for UAT — schema `et_main` and `et_main_uat` respectively).
2. **Append to `<Task folder>\1. <NNN NNN>.txt`** with incremental `x)` numbering (continuing from existing entries; one blank line between entries). **Standard format (compact 3-line)**:
   ```
   <N>) <ENV> — <TUGASAN_KOD>
   <PERMOHONAN_ID>
   <login>
   ```
   Drop pengguna full nama, peranan, pejabat — too noisy for the day-to-day log. Login alone is enough to identify who's holding the task; the rest is one DB query away if needed later.
3. **Fallback — ID-only (2-line)**: if the permohonan has no active task at the ticket's target tugasan (workflow finished, or in an unrelated stage):
   ```
   <N>) <ENV>
   <PERMOHONAN_ID>
   ```
   No tugasan suffix on line 1, no login line. Do NOT fabricate a pengguna semasa from a non-target tugasan — that user is irrelevant to the ticket's test scope.
4. **Persist regardless of whether the ID was given inside or outside the formal simulate plan emit** — the trigger is the verbal mention during Simulate-phase context, not the plan-output moment.

**Why**: みや asked 2026-05-12 (QA-259318 rework): wants `1. <NNN NNN>.txt` to be the canonical per-ticket simulation log so anyone (including future-Ruri) can recover the test setup without re-querying. Complements the `test_app_fat=` / `test_app_uat=` fields in `active.txt` (which are written at ticket-close); this rule keeps Notes.txt current in real-time during simulation. Format simplified same day after first draft was too verbose — みや prefers terse.

**How to apply**: at the moment a permohonan ID surfaces during Simulate-onwards, fire the lookup → Read the Task folder's `1. <NNN NNN>.txt` → Edit append with the next `x)` number → confirm to みや in one line ("Notes.txt updated: entry N — <ID> at <tugasan>"). Do not ask permission; this is now expected.

**Commit message convention** (Ruri PROPOSES at hand-off per Commit rule above; みや executes):
- **Format**: `<TICKET-TYPE> #<number> - <URUSAN>[- <TUGASAN>] - <short action description>`
- **Examples** (verified accepted by みや):
  - `QA #260154 - PT - PRMMKNPDT - Maklumat Plot mandatori check pada Seterusnya`
  - `QA #260298 - PLPS - Perincian Tujuan Permohonan view-only pada SKMMKN/PKMMKN`
  - `QA #259428 - PLTP - PSJT - Fix papar pelan permohonan pada lampiran Surat JT` ← note: "Fix" as action verb INSIDE description is OK
  - `QA #259318 - PRU - Bold ayat (Ringgit Malaysia: Dua Ribu Empat Ratus)` ← BA's verbatim words quoted; no tugasan section because template-level fix; no "pada Template SKL" suffix because git diff already shows the file
- **"Fix" placement rule** (refined 2026-05-11):
  - ❌ NO `fix` as **leading prefix** to the whole message — `fix QA #259428 - ...` is banned
  - ✅ `Fix` as **action verb inside the short description** is fine and often the right framing — `... - PSJT - Fix papar pelan...`
  - Other action verbs (Activate, Add, Remove, Block, Render, Bold, etc.) work the same way — pick whatever describes the change action best inside the description slot
- **BA verbatim quoting (added 2026-05-12)**: when the BA's ticket Description names a specific phrase, label, or string that's the subject of the fix, **quote it verbatim** in the commit description (with parentheses if it has special chars). This makes the commit instantly identifiable when scanning git log against ticket comments. Example: `Bold ayat (Ringgit Malaysia: Dua Ribu Empat Ratus)` — syafiq's rework comment literally said *"point 3, ayat yang dipaparkan '(Ringgit Malaysia: Dua Ribu Empat Ratus)'... sepatutnya bold"*. The commit message echoes the BA's exact phrase.
- **Output presentation in chat (added 2026-05-12)**: emit the commit message on its OWN bare line (not wrapped in a code fence, no prefix label like "Commit message:") so みや can double-click → select-line → copy. He uses Sourcetree where pasting the comment commits + auto-pushes in one step. Put the git command(s) in a `powershell` code block BELOW the bare line as fallback reference. Example output shape:

  > QA #260179 - PT - Tambah pelanCC pada Surat Nilaian JPPH
  >
  > ```powershell
  > git commit -m "QA #260179 - PT - Tambah pelanCC pada Surat Nilaian JPPH"
  > git push -u origin mlk/qa/260179
  > ```
- **Drop info that's redundant with the git diff (added 2026-05-12)**: don't suffix the description with file/folder/template names that `git show --stat` already reveals. Bad: `... Bold ayat (Ringgit Malaysia: ...) pada Surat Keputusan Lulus`. Good: `... Bold ayat (Ringgit Malaysia: ...)` — the SKL template path is visible in the diff. Goal: subject line carries the *intent*; the diff carries the *what*.
- **Tugasan section is OPTIONAL — include only when fix is tugasan-specific**: if the change is template-level / config-level / cross-tugasan (e.g. binary template edit, set-membership extension), drop the tugasan segment. Keep it when the change targets one tugasan's validator/handler/view.
- **NO** `AWAM` / `MLK` / repo-name / negeri tags (the ticket # and Task folder already encode those)
- **Subject-only**: no body, no `Co-Authored-By` trailer (repo convention)
- Urusan kod (PT, PLPS, PLTP, etc.) and tugasan kod (PRMMKNPDT, SKMMKN, PSJT, etc.) ARE included as separate segments before the description when present — they're navigational, not part of the "short description"
- **Don't second-guess the format from `git log`** (2026-05-19 QA-260316): the log WILL contain non-conforming commits from other devs (`refs #<num>`, bare `#<num>`) and merge commits — those are deviations, NOT the standard. The `QA #<num> -` subject prefix is **mandatory** and **etanah-wide** (identical across pelupusan + awam, repo-independent). Teammates refer to the ticket number.

**Rework branches**: if `mlk/<type>/<number>` already exists locally or remotely (this is a rework), the new branch name is `mlk/<type>/<number>v2` (no dash, sequential — v3, v4, etc.). Detect via `git branch --list "mlk/<type>/<number>*"`.

**Phase 1 close-out — return to main + active.txt + STOP gate (hard rule, added 2026-05-07, gate added 2026-05-11):**

**Trigger phrases from みや** (any one): *"passed the ticket"*, *"close phase 1"*, *"wrap [ticket]"*, *"ticket done"*, *"submitted on redmine"* (when paired with a recent commit+push of the same ticket).

After commit + push lands successfully:
1. `git checkout <main-branch>` on the relevant repo — pelupusan = `mlk/master`, awam = `mlk/master` (local base; `mlk/stag-env`/`mlk/mlit` are downstream, not the base)
2. `git pull --ff-only origin <main-branch>`
3. Verify: working tree clean (Eclipse settings exceptions ignored), branch on `<main-branch>`, latest origin tip
4. **Update `quest/active.txt`**: change/add the ticket's entry with `phase=1-complete`, `status=closed` (per A6 v2 — Phase 1 done, Phase 2 still ahead), `branch=mlk/<type>/<number>`, `commit=`, `verified=`, `commit_sha=`, `pushed=`, `files_changed_phase1=`, `scope_anchor=`, plus any `etiology=` / `db_verification=` / `learning_marker=` / `out_of_scope_held=` fields relevant to the ticket. Move into the right section of active.txt (entry stays in active section until Phase 2 close flips to `archived`).

5. **Run `/verify <ticket>` skill** — universal checkpoint verification via `.claude/skills/verify/SKILL.md`. At Phase 1 close-out it runs **Checklist C** — 7 evidence-backed checks: local test confirmed, full staged diff reviewed pre-commit, commit landed, push succeeded (local == origin SHA), remote branch discoverable, repo returned to `<main-branch>` at origin tip, `active.txt` updated (`phase=1-complete` + `commit=`). Outputs a green/red checklist; every ✅ must carry concrete evidence. **Mandatory before STOP gate**; if any check is red — or a ✅ lacks evidence — fix the gap before declaring closure. (`verify` also runs Checklist A at Phase 0 and Checklist B at Apply-done — see the skill file.) **Re-commit clause (added 2026-05-18 after QA-260302 state drift):** if the ticket is re-committed for ANY reason after a first close (amend, fixup, re-done commit), `/verify` MUST be re-run and `active.txt`'s `commit=` field updated to the NEW HEAD SHA of the ticket branch. `commit=` must always equal `git rev-parse HEAD` on the ticket branch — a stale or empty `commit=` is itself a red check. **Why**: QA-260302 was committed `ddfd8ccda2`, re-done `5094c076c0`; `active.txt` carried no `commit=` field and still read `phase=1`/`status=active`/`uncommitted` for days — the active.txt check only bites if it is actually re-run after the FINAL commit.

6. **Auto-generate Fix.txt + SUMMARY.txt** (added 2026-05-12 — sure-fire trigger per みや) — fires AUTOMATICALLY right after `/verify` green, BEFORE the STOP gate. Both files render from `quest/active.txt` ticket entry + Phase 1 commit metadata + Phase 1 Fix Walkthrough content. **Trigger phrase explicit**: "verify green → render Fix.txt + SUMMARY.txt". Until this auto-gen lands as a skill, the trigger lives as a quest-protocol step — Ruri writes both files at this moment, every Phase 1 close, no exception. Format per Task Folder File Rules section above. **Why** (2026-05-12): Fix.txt + SUMMARY.txt have repeatedly failed to generate because the old trigger was "Phase 2 step 1" — and Phase 2 often gets deferred. Moving the trigger to Phase 1 close-out makes generation atomic with the commit/push/return-to-main flow.

**🛑 STOP GATE — Ruri MUST PAUSE AFTER STEP 6 AND ASK FOR CONFIRMATION** (added 2026-05-11 after みや's discipline call):

> Output verbatim: *"Phase 1 closure for QA-X complete. ✓ commit ✓ push ✓ return-to-main ✓ active.txt updated ✓ /verify green (Checklist C — 7 checks) ✓ Fix.txt + SUMMARY.txt rendered. Confirm before I proceed to anything else?"*

**Then WAIT.** Do not progress to Phase 2 / DE / sister-ticket / unrelated work until みや explicitly answers *"yes"*, *"proceed"*, *"go"*, *"ok next"*, or equivalent. This triple-measure exists because Ruri has previously rolled forward into adjacent work right after closure, scattering attention before the closure was fully checked. The triple measures:

1. **みや's explicit trigger phrase** (e.g. "passed the ticket")
2. **Ruri's confirmation question** at the gate (this STOP step)
3. **Ruri's not-progressing** until explicit ack

The fix branch (`mlk/<type>/<number>`) stays on origin; don't delete. External merge happens via PR/another reviewer. Phase 2 is its own initiation — handled separately when みや triggers "wrap up" / "post-mortem" / "phase 2".

**Why**: pairs with Phase 0 Step 0a — without close-out, the next ticket's Phase 0 starts on stale master OR on the previous ticket's branch (2026-05-07 QA #259759 — etanah-pelupusan was still on `mlk/qa/250665` AND master was 2 commits behind). Close-out makes ticket-to-ticket transitions atomic.

**Pre-push remote-state notification (hard rule, added 2026-05-07):**

EVERY time みや approves "commit push" / "push" / equivalent, BEFORE running `git push`:
1. `git ls-remote origin mlk/<type>/<number>` — query whether the branch exists on remote
2. Notify みや with one of these states:
   - **First push** — branch does NOT exist on remote yet → push creates it (`git push -u origin <branch>`)
   - **Updates existing** — branch EXISTS on remote with N commits ahead/behind → push updates it (rework cycle: `git push origin <branch>`, possibly needs `--force-with-lease` if rebased)
3. Show the ahead/behind count if existing
4. Push immediately after notification (no further confirmation needed since みや already authorized "push" in his message)

**Why**: rework cycles vs first-push behave differently. First push needs `-u` to set upstream. Existing branch update may need `--force-with-lease` if rebased. Notification ensures みや sees the state and can intervene if it's not what he expected (e.g. if he thought it was first push but branch already exists from a colleague's prior work).

**Order of operations for "commit push" cycle (hard rule, added 2026-05-07 after order-bundle slip):**

1. **Remote check first** (`git ls-remote origin <branch>`) + notify state — BEFORE commit. Allows みや to pause if remote state is unexpected.
2. **Commit** (local-only; doesn't depend on remote)
3. **Pre-push announcement** — show commit hash + target branch + intended push variant (`push -u` / plain `push` / `--force-with-lease`)
4. **Push**
5. **Push-result report** to みや
6. **Wait** for みや to submit/pass ticket on Redmine (out of Ruri's scope)
7. **Phase 1 close-out** — `git checkout <main>` + `git pull --ff-only origin <main>` — `<main>` is per-repo: `mlk/master` (etanah-pelupusan) / `mlk/master` (etanah-awam — local base; ticket branch merges downstream to `mlk/stag-env`/`mlk/mlit`)
8. **Update active.txt** — phase=1-complete, status=closed (per A6 v2), branch=, commit=
9. **Audit-log + protocol updates** — orthogonal, can run any time same session

**Why this exists**: 2026-05-07 — Ruri bundled "Adding protocol + executing commit + remote check + push + close-out" in one breath, ran them in parallel via tool calls in a single message. みや caught the bundle: ordering should be sequential with notification points, not parallelized. Specifically, the pre-push notification (step 1) must precede the commit so みや can intervene BEFORE local state changes.

**Phase 1 → ticket submission (みや's role):**

After Ruri's push lands, **みや submits the ticket on Redmine** — this means:
1. みや navigates to the ticket in Redmine
2. Changes ticket status from "New" / "In Progress" to "Resolved" (or equivalent state that signals "code is done, awaiting BA verification")
3. Adds his commit hash + branch name as a Redmine note (typically)
4. Reassigns to BA/QA tester (e.g. Nurul Amirah Nadiah) for FAT verification

This is **outside Ruri's scope** — Ruri does NOT touch Redmine status. Ruri's role at this point: do Phase 1 close-out (switch to the repo main branch — `mlk/master` pelupusan / `mlk/master` awam — + pull) + update `quest/active.txt` to `phase=1-complete`, `status=closed` (per A6 v2 — Phase 2 will flip to `archived`). Then wait for みや's direction (Phase 2 post-mortem, or next ticket per Ruri's effort-ranked recommendation).

**On BA acceptance** (later, possibly different session): Phase 2 fires per the existing closure-on-Redmine signals.

### Re-engagement (added 2026-04-30 — broadened triggers)
**These phrases require Ruri to re-verify Task folder + handoff are loaded in CURRENT session context BEFORE producing any analysis, appraisal, or proposal:**

| Phrase pattern | Examples |
|---|---|
| Ticket continuation | "continue ticket X", "let's work on X", "let's do X", "back to X", "resume X", "X rework" |
| Methodology applied | "/appraise on X", "scrutinize X", "review X again" |
| Implicit ticket scope | "focus on X", "I want to do X", "X next" |

**Hard rule** (added 2026-04-30): Loading files at session start is NOT enough. Re-engagement after time-gap or context-shift requires explicit re-verification — read the Task folder + handoff again, OR confirm in chat: "Task folder + handoff still in working memory: ✓ — proceeding with [analysis/appraisal/proposal]."

**Hard rule — Phase + persistent test data check on every entry/re-entry (added 2026-05-12, attachment-cycle-relevance added same day)**: At every ticket entry or re-entry (any trigger phrase from CLAUDE.md Quest Workflow trigger table), Ruri MUST do these four things BEFORE any analysis/proposal/answer:

1. **Read `quest/active.txt`** for the ticket's entry — surface the current `phase=`, `status=`, and any `scope_anchor=` / `branch=` / `commit=` fields. Output one line: *"QA-XXX is at phase=X status=Y, scope: <one-line>."*
2. **Read `1. <NNN NNN>.txt`** in the Task folder — if entries exist (`N) ENV — TUGASAN / ID / login` format), surface them as the persistent simulate/test data. Output: *"Test data on file: <env> <ID> @ <login> (tugasan X)."*
3. **Read `early-diagnostic.md`** (or `scout-report.md` / handoff) at the path in `active.txt` — confirm in chat: *"Diagnostic loaded ✓ — proceeding with [next step]."*
4. **Cycle-relevant artifacts check (added 2026-05-12, extended 2026-05-12 evening to cover comments)**: read `0. Brief/History.txt` to identify the latest cycle boundary (most recent `status_id: <resolved/closed> → <rework/reopened>` transition). Apply cycle-classification to BOTH attachments AND BA comments:
   - **Attachments**: Glob `0. Brief/` for files. Classify each as **current-cycle** (file referenced in BA's note AFTER the latest cycle boundary, OR file uploaded with a journal entry timestamped after that boundary) vs **prior-cycle** (uploaded before — usually resolved, informative for etiology only).
   - **Comments (BA journal entries)**: the BA comment(s) that appear AFTER the latest Resolved→Rework / Closed→Reopened transition ARE the current-cycle scope authority. Quote the current-cycle BA comment verbatim in Recon. Prior-cycle comments (original spec, prior tester feedback, dev-handoff notes) are reference-only — DO NOT treat them as current scope. The early-diagnostic's "what likely BA-rejected" inference section is **speculation** when it predates the current cycle — label such inferences `[prior-cycle, speculative — pending current-cycle BA confirm]` in Recon.
   - Output a 2-line summary: *"Current-cycle attachments: X.pdf, Y.png. Prior-cycle (resolved): A.pdf."* + *"Current-cycle BA scope (verbatim): <1-3 line quote>."* Prior-cycle items are referenced only when discussing history or root-cause continuity — never used as primary scope.

The output is a 4-line state-check block emitted at the TOP of the response. **Mandatory**, not skippable. Even if the ticket was the previous turn's focus — re-entry resets the assumption.

**Why attachment-cycle-relevance** (2026-05-12 みや): for rework tickets the `0. Brief/` folder accumulates attachments across cycles. Without cycle labeling, Ruri risks treating a resolved-cycle screenshot as a current-cycle problem statement (e.g. QA-259318 had `1. Surat Keputusan Lulus 1.png` from v1 cycle + `QA #259318 - Rework.png` from v2 — radically different roles). Cycle boundaries come from history.txt status transitions. Re-check fires on every switch so context never drifts.

**Why** (2026-05-12 QA-260179): Ruri moved from QA-259318 to QA-260179 without surfacing the phase/test-data state — みや had to ask separately about tugasan + did Ruri update Notes.txt. Both data points were available (Scout-verified test app, Aaron's PT-only scope) but unsurfaced. The state-check block makes the data visible at the top of the response so みや can scan + course-correct in one read.

**Why comments-extension** (2026-05-12 evening, QA-247710 re-entry): same root-cause shape as the attachment-cycle slip. Ruri emitted Recon with scope spanning bean autodefault + KEMASKINI alert + populator + template — pulled from early-diagnostic's "what likely BA-rejected" speculation section (written 2026-05-06, before current cycle). The actual current-cycle BA comment (syafiq, 2026-05-06 11:53, post Resolved→Rework transition) had 2 specific items: (1) Point 5 page-break, (2) Point 6 corrections per PDF. みや caught the gap: *"Did you take into account what's the latest conversation on the ticket after the ticket was re-opened?"* — the comment-cycle layer was unreferenced. Rule extension makes both artifact types (files + journal comments) cycle-classified at Phase 0 entry.

**🚨 Rework re-engagement ordered-read sequence — HARD RULE (added 2026-05-13 after QA-259759 3rd-time slip)**: At ANY Rework re-engagement (ticket previously closed, now reopened with Resolved→Rework or Closed→Reopened transition), Ruri MUST follow this EXACT ordered sequence BEFORE any Effort assessment, deep-scout, or Recon emit:

1. Read `Description.txt` (always — initial scope)
2. Read `History.txt` (ALWAYS at Rework — not optional, not skippable even if early-diagnostic.md exists from prior cycle)
3. Locate the cycle boundary (most-recent `status_id` line indicating Resolved→Rework / Closed→Reopened transition) and identify the BA's journal entry AFTER that boundary
4. Read that journal entry as the **authoritative current-cycle scope** (per cycle-relevance rule above)
5. Read cycle-relevant attachment(s) referenced in step-4's journal (PDFs via `python fitz` annotation walk if applicable)
6. ONLY THEN decide: is the BA note + attachment self-explanatory enough to skip deep-scout (proceed direct to Recon with corrected Effort), OR is deep-scout still needed?
7. NEVER reuse the existing early-diagnostic.md's Effort estimate when it predates the current cycle — Effort must be re-judged against current-cycle scope

**Why** (2026-05-13 QA-259759 slip — みや: *"did you not read the latest history? This is very important for you to answer first."*): I treated the existing early-diagnostic.md (from v1, 2026-05-07) as the source of truth, assessed "deep scout needed", and labeled Effort based on stale v1 framing. The BA's actual rework note (Item 4 bold + missing "tahun" — single template-binary tweak, ~30min LOW Effort) was 1 mouse-click away in History.txt. **3rd-time repeat slip** on cycle-relevance: 2026-05-12 morning (attachments), 2026-05-12 evening (journal comments), now 2026-05-13 (Effort judgement from stale diagnostic). The cycle-relevance rule existed but didn't ENFORCE the read sequence. Now sequenced + numbered explicitly.

**🚨 BA-question classification filter at Recon (added 2026-05-13 after QA-260733 simulation-bypass slip)**: When formulating "Open BA Qs" at Recon, every candidate question MUST be tagged with one of 4 classes BEFORE landing in the BA-Answerable section:

- **(a) Current-behavior** ("does X happen today?", "is Y rendered now?") → **SIMULATE-FIRST** — these are answerable by running the app, NEVER pass to BA. Re-tag as "Simulation-Required" with the test data already on hand.
- **(b) Intent/spec** ("should X happen?", "what is BA's expected behavior?") → BA-Answerable ✓
- **(c) Future-scope/extension** ("should we extend to other urusan/tugasan?") → BA-Answerable ✓
- **(d) Implementation-choice** ("approach A vs B?") → DEFER to Phase 1 Rubric — neither BA nor immediate concern

Only (b) and (c) appear in Recon's "Open BA Qs" output. (a) and (d) are filtered out at Recon-emit time. **Why** (2026-05-13 QA-260733 Recon): I framed "does SSTP genuinely show Notis 5A today?" as a BA-Answerable Q. みや: *"Doesn't this simply can be clarified through Simulation? Do we really need to ask BA? You should be more anchored or aware of our own protocol. More grounded."* Right — current-behavior Qs go to simulation, not BA. Rule strengthens existing Phase-0 "no implementation-design Qs to BA" with current-behavior filtering.

**Hard rule — Auto-write Notes.txt immediately after Scout completes (added 2026-05-12)**: When the Scout familiar finishes writing `early-diagnostic.md` and a `test_app_*` field is verified in it (canonical UMM_A_TGSN query result, with `flag_aktif='Y'` at the target tugasan), Ruri MUST immediately write to `1. <NNN NNN>.txt` in the same Task folder, using the established 3-line format:

```
1) <Application> — <ENV> — <TUGASAN_KOD>
<PERMOHONAN_ID>
<login>
```

**Format re-refined 2026-05-13 by みや (with hand-edited 260876 Notes.txt as canonical example)**: TWO-entry format when BA-prep ID is past target tugasan AND fallback sim ID exists. Entry 0 = BA-prep ID with state note, Entry 1 = sim ID with `<Application> — <ENV> — <TUGASAN>` line. Application abbreviated: `PLP` (Pelupusan) or `AWAM`. **NO Langkah in Notes.txt** (Langkah is RECON-title-only — per みや 2026-05-13). Format:

```
0) BA — past <target_tugasan>, currently <BA-prep_current_tugasan>
<BA-prep_Permohonan_ID>
<BA-prep_pengguna_semasa>

1) <PLP|AWAM> — <ENV> — <TUGASAN>
<sim_Permohonan_ID>
<sim_pengguna_semasa>
```

**Single-entry case** (BA-prep ID is at target tugasan, OR BA didn't pre-prep specific) — **STRICT FORMAT (hard rule, refined 2026-05-14 by みや — supersedes earlier forms)**: title line is `N) <URUSAN> — <TUGASAN>` (urusan code + current tugasan — tugasan included so みや can revert via flowable-alter if testing moves the permohonan forward). Line 2 = permohonan ID. Line 3 = login. **NO bloat — no extra annotations, no parentheticals, no env labels.** Rework cycles use the same format. Example:

```
1) PLPS — SKM
PTMLK/01/L/PLPS/2026/10
nizalarif@melaka.gov.my
```

**Why** (2026-05-14): みや 2026-05-14: *"Don't forget to update 1. Notes as well along with the original Tugasan so that I can alter back."* Test-flow may forward-alter the permohonan; the tugasan in the entry is the revert target.

**Multi-urusan ticket case — write ONE entry per urusan** (added 2026-05-14 by みや after QA-260965 slip; STRICT FORMAT refined later same day after QA-260302 slip — supersedes earlier verbose-column form): when the ticket title lists multiple urusans OR the ticket affects multiple urusans (e.g. `"Semua Urusan - ..."` or `"PLPS, PRBB - ..."`), parse the urusan list and write one numbered entry PER urusan in the SAME strict format. No app-prefix, no env, no tugasan, no annotations. Example for QA-260965 ("PLPS, PRBB"):

```
1) PLPS
PTMLK/01/L/PLPS/2026/10
nizalarif@melaka.gov.my

2) PRBB
PTMLK/01/L/PRBB/2026/4
asmida@melaka.gov.my
```

**Why** (2026-05-14 QA-260302): I wrote Notes.txt with App/ENV/Tugasan columns — みや: *"Don't bloat with extra info, just follow this format... Only mention URUSAN as the title."* The strict format is intentionally minimal — Notes.txt is a quick test-data lookup, NOT a state-snapshot. State context lives in active.txt + Recon + post-mortem.

**Why two-entry**: みや values testing against BA's exact Permohonan ID for traceability — Entry 0 preserves the BA-prep state for reference + tug-of-flow reasoning, Entry 1 gives the actionable test app. みや 2026-05-13: *"can you straight away give the BA's Permohonan ID's pengguna semasa despite its Tugasan doesn't match with our Ticket? It is still important to test based on BA's exact Permohonan's data"*.

(2-line fallback if Scout couldn't find any active app at the target tugasan — see existing "Auto-log permohonan ID" rule.) **This is in addition to the existing rule that fires on mid-conversation ID mentions** — the Scout completion is a separate trigger point. みや shouldn't have to mention the ID for it to land in Notes.txt; if Scout verified it, it goes in.

**Why** (2026-05-12 QA-260179): Scout completed at ~10:01 with `PTMLK/03/L/PT/2026/17` DB-verified. Notes.txt stayed empty until みや asked at ~11:00 why it wasn't there. The rule existed for mid-conversation ID mentions but didn't fire at Scout-completion. Both trigger points now covered.

**🚨 STRENGTHENED 2026-05-13 — sequential per-Scout enforcement (no batching)**: when multiple Scouts run in parallel (e.g. Redmine retrieval syncs 5 new tickets, 5 Scouts spawned), Ruri MUST write Notes.txt for each ticket AS THE SCOUT RETURNS — before any other tool call, before the next Scout's processing, before any Recon emit, before any synthesis output. **"Immediately" means sequentially per-ticket, NEVER batched-after-the-batch**. Pattern of slip 2026-05-13 (QA-260965/876/820/733/302 retrieval): all 5 Scouts completed in parallel, I went straight to Recon emit for みや, skipped the 5 Notes.txt writes entirely until みや caught it. Same root-cause shape as compound-trigger follow-through slips (Phase 1 close-out post-push steps, Apply unauthorized deletions) — when in synthesis-output mode, per-step housekeeping gets skipped. **How to apply**: after each Scout returns, Notes.txt for that ticket is the NEXT tool call. Treat it as a sequence checkpoint, not an "anytime later" item.

**Why**: 2026-04-30 morning slip — みや asked /appraise on QA #258022 angles; Ruri had loaded the handoff at session start but didn't re-verify before judging. Fabricated a "label confirmation gap" that the ticket text already answered. Ruri's `feedback_inventory_first.md` covered "before creating" but not "before EVERY judgement." This rule extends it.

**Sister rule — Reading ≠ understanding** (hard rule, 2026-04-30): Loading files is necessary but not sufficient. When stating any user/role/data fact about a ticket, cite the source line (e.g. "Notes.txt:9 lists nurulazura under FAT — context: Simulate prep, not the SMB tester"). Synthesis is mandatory across Task folder × handoff × code state before any conclusion. 2026-04-30 afternoon slip: misread Notes.txt context, treated nurulazura (PB tester) as SMB tester.

**Task folder file ownership** (hard rule, 2026-04-30):

| File / location | Owner | Ruri may write? |
|---|---|---|
| `1. <NNN NNN>.txt` | Shared — test-data log | ✅ **Ruri writes it, but ONLY via `node quest/notes.js`** (locked 3-line format; canonical spec = `feedback_task_folder_ownership.md`). NEVER hand-write; NEVER add prose / sections / "what to test" / caveats / rebuild steps — those belong in the chat ▶ YOUR MOVE block, never the file. *(The old "read-only / never write" handling is SUPERSEDED 2026-05-12 by the notes.js workflow — see Why below.)* |
| `0. Brief/Description.txt` | Source of truth — original ticket text + BA replies | ✅ Append BA replies / scope clarifications with clear separator + dated header (preserves history) |
| `0. Brief/<screenshots>` | みや (BA-attached or みや-curated) | ❌ Don't add or replace |
| `0. Brief/<numbered subfolders>` (e.g. `1. Clarification/`) | みや (back-and-forth artifact bins) | ❌ Don't add files unless みや asks |
| `1. Simulate/` | Reproduction steps + test data | ✅ Append findings (test SQL, IDs validated) |
| `2. Fix/` | Applied fix artifacts | ✅ Write Fix.txt summary on Phase 2 |
| Project subfolder `projects/coding-projects/active/<ticket>/` | Ruri's investigation workspace | ✅ Free use — handoff, walkthrough, learning docs |

**Why**: 2026-04-30 — みや clarified that `1. <NNN NNN>.txt` must NOT hold Ruri's investigation prose (that goes to the project subfolder). Scope changes from BA still update `Description.txt`, not Notes. **SUPERSEDED 2026-05-12+**: Notes.txt IS Ruri-written now — but ONLY as the locked 3-line test-data log via `node quest/notes.js`. The surviving discipline is "no investigation prose / no verbose sections in Notes.txt", NOT "never write it". **(2026-05-30: a verbose hand-written Notes.txt recurred precisely because this stale "read-only" row still contradicted the notes.js workflow — row corrected so the contradiction can't mislead again. Canonical format authority = `feedback_task_folder_ownership.md`.)**

**On BA reply append**: format is
```
─── BA REPLY <YYYY-MM-DD> ───
<verbatim quote of BA's notes from Redmine journal>
```
Below the existing Description text. Don't rewrite original. Each BA reply gets its own block.

---

## Phase 0 — Accept the Quest

**Goal:** Read Task folder → build scope checklist → confirm before coding.
**Non-negotiable:** Do not touch any codebase file before Phase 0 is complete.

**Phase 0 artifact gate — visible, not silent (hard rule, added 2026-05-18 after QA-260302 early-diagnostic never created):** Phase 0 produces ONE mandatory artifact — `projects/coding-projects/active/QA-<num>/early-diagnostic.md`. Before any Phase 0 → Phase 1 transition, Ruri MUST emit a one-line gate: `Phase 0 artifacts: early-diagnostic.md ✓` — and the ✓ is written ONLY after a Glob confirms the file exists on disk. If it does not exist, create it NOW before continuing. **Why**: QA-260302's early-diagnostic was never created despite the mandatory Auto-Discovery rule — a silent skip, unnoticed for 5 days. Same disease as the 2026-05-17 boot-step silent-skip; same cure — make the step's completion visible so a skip leaves a trace. A skipped Phase 0 artifact must be visible, never silent.

**Notes.txt write is a HARD PRECONDITION of Recon emit (HARD RULE, absorbed from amendment A12 on 2026-05-25 — originally 2026-05-20 by みや after 3+ Notes.txt-skip slips in one day).** Before emitting the `═══ RECON — ...` block in chat, Ruri MUST verify Notes.txt for the active QA exists AND contains the verified test data (permohonan ID + login + tugasan). If empty or stale → STOP, run `node quest/notes.js` with the Scout-verified test data FIRST, THEN emit Recon. **Recon emit is BANNED while Notes.txt is empty or carries stale (unverified) test data.** **Verification method**: read `<Task folder>/1. <NNN NNN>.txt`. Contents must match locked 3-line format per `feedback_task_folder_ownership.md` AND reflect the verified test app (not BA-prep ID unless Scout confirmed it's at the target tugasan). **Why** (2026-05-20 QA-262370 + 3 other tickets same day): Scout returned verified `PTMLK/03/L/PLTP/2026/7` + `leenoor36@yahoo.com` + PYSKN5A; I emitted Recon + Predicate Box + Apply without ever writing Notes.txt. みや couldn't find the test data when needed. Loose "post-Scout" rule didn't stop it. Hard precondition does. **Pairs with**: `feedback_task_folder_ownership.md` (Notes.txt is Ruri's responsibility) + the Standing-flag staleness audit rule — both are "verify-before-emit" gates. **Refines**: CLAUDE.md Read-Redmine sub-protocol point (6)(c) — "Notes.txt auto-write post-Scout" — the temporal anchor "post-Scout" was fuzzy; this gate is the deterministic version.

**Blocked-state checklist (hard rule, added 2026-05-20 by みや — cross-cutting, fires at any phase + during retrieval):** When any retrieval / Phase 0 / mid-quest step hits a blocker (missing attachment, ambiguous data, BA-Q needed, tool failure, env mismatch Ruri can't resolve), Ruri MUST emit a one-line checklist that names BOTH the blocked items AND the non-blocked items, THEN continue with the non-blocked items, THEN surface the blocker to みや with a specific ask. Banned: silent drift past a blocker; "I'll come back to it" without an entry; assuming みや will catch the gap; logging it ONLY as a standing flag in the briefing. **Format**: `🚧 Blocked: <item> — <reason / what's needed>` + `▶ Continuing with: <list of non-blocked items>` + `❓ For みや: <specific question or action needed>`. **Why** (2026-05-20 QA-260876): the rework attachment sync was logged only as a standing flag — the workflow drifted forward without explicit acknowledgment, and the attachments stayed un-downloaded for hours. みや: *"create a checklist straight away if something blocked you so that you can continue before progressing or drift. Please be more pro-active next time."* **How to apply**: at the moment any blocker surfaces — emit the 3-line checklist BEFORE the next action. Pairs with the personality.md "Enumerate-then-pursue" rule (the upstream cousin: enumerate paths when blocked, then this rule: surface the paths visibly so みや can intervene if needed).

**Base task folder path (known — do not ask):**
`C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka`

**JBoss DB check (remind みや at Phase 0):**
Confirm which DB is active in `standalone.xml` — see `E:\Dev\jboss-7.4-plp-melaka\SETUP-NOTES.txt` → DB SWITCHING section.
Melaka IT (etanahDS) = local dev default. UAT (etanahDS2) = disabled by "2" suffix convention.

**Test-data query — single-track filter mandatory** (hard rule, added 2026-05-14 by みや after QA-260302 PTMLK/02/L/PLTP/2026/10 slip): When querying `umm_a_tgsn` for test data, ALWAYS filter to aplikasi with EXACTLY ONE active tugasan (`flag_aktif='Y'`). A single aplikasi can have multiple parallel workflow tracks (each on different `aliran_kerja_id` but same `aplikasi_id`) — when this happens, the user UI's "Senarai Tugasan Pengguna" doesn't reliably surface the older parallel track, so the test login can't access the permohonan even though `flag_aktif='Y'`. **The query pattern**: add a `WITH active_counts AS (SELECT aplikasi_id, COUNT(*) AS c FROM umm_a_tgsn WHERE flag_aktif='Y' GROUP BY aplikasi_id)` CTE + filter to `c = 1`. **Why** (2026-05-14): PTMLK/02/L/PLTP/2026/10 had PSJT (amalia) + PLT (mkhairi) both flag_aktif=Y on same aplikasi_id; amalia got "tiada dalam Senarai Tugasan Pengguna ini" error because the workflow had branched. Single-track filter eliminates this class of slip.

**Code-first investigation before BA-ask** (hard rule, added 2026-05-14 by みや): When Scout/Recon surfaces a question that COULD potentially be answered by reading the code, framework defaults, or sibling-feature pattern, Ruri MUST attempt to resolve it via code investigation FIRST, then only ask BA what remains genuinely unresolved. **Failure mode being prevented**: piling open BA-Qs that are actually answerable from a 30-second grep + 1 file read. **Why** (2026-05-14 QA-260302): I surfaced 4 "open BA Qs" including (a) default value behavior, (c) downstream Surat rendering — both directly answerable by reading existing SelectItems patterns + Surat Nilaian JPPH template/populator code. みや: *"please refer else where what's the usual behaviour or even etanah's framework behaviour. Do this before suggesting asking first for hints"* + *"You need to at least check first the template or code that populates the template if this will be shown to have a concern. I appreciate the effort though but perhaps make it mandatory to check first."* **How to apply**: for each open Q surfaced at Recon, categorize as: (i) BA-only (e.g. "is this mandatori?" — pure spec question), (ii) Code-resolvable (e.g. "what does the framework default to?" — answerable via grep+read), (iii) Sibling-pattern-resolvable (e.g. "how does the upstream tugasan write this field?" — answerable via existing-field grep). Spend 5-15 min on (ii) and (iii) before drafting the BA-ask list. Only (i)-type Qs reach BA. Even (i)-type Qs should include "code hints suggest X" if applicable so BA can confirm/correct.

**Phase 0 — Stay in BA's literal scope (hard rule, refined 2026-05-08 from senior consultation):**

BA's reported scope is the boundary. Related issues found during Simulate / intermediate Recon / Rubric MUST be surfaced as ASK questions (per the 2026-05-08 ASK rule) — never silently extended into the fix, never silently dropped. Senior's 2026-05-08 guidance to みや on QA-260154: "focus only on what BA asked." Pairs with the existing scope_anchor field in active.txt: write it at Discovery, defend it at Rubric, do not creep at Apply.

**Step 0 — Mandatory FIRST actions at quest start (hard rule, strengthened 2026-05-07):**

Run BEFORE any other tool call (other than time-stamping `Get-Date`). NOT after Word-template lookup. NOT after etanah-knowledge inventory. NOT after Description.txt read. **First. No exceptions.** Skipping these means the ticket starts on stale code or the wrong branch — both surfaced in real slips (2026-05-04 QA #259318 wrong branch; 2026-05-07 QA #259759 master was 2 commits behind: `3b0885b5be Temporarily disable #252285` + `d8b972edd1 #236336` would have been silently missed).

**Step 0a — Branch check + main-branch pull (per-repo, hard rule, added 2026-05-04, REFINED 2026-05-08 per-repo):** Run env-check skill which handles the per-repo main branch + env file verification automatically. Manual fallback if env-check unavailable: in `etanah-pelupusan` the main branch is **`mlk/master`**; in `etanah-awam` the baseline is **`mlk/master`** (corrected 2026-07-02 per みや — AWAM mirrors PLP; local base, local-test only, NO commit/push; branch to `mlk/<tracker>/<num>`; `mlk/stag-env`/`mlk/mlit` are downstream merge targets, not the base). Per-repo:
```bash
# etanah-pelupusan
git fetch origin mlk/master && git log HEAD..origin/mlk/master --oneline && git branch --show-current && git status --short
# etanah-awam  (baseline = mlk/master, corrected 2026-07-02)
git fetch origin mlk/master && git log HEAD..origin/mlk/master --oneline && git branch --show-current && git status --short
```
If current branch ≠ main-branch-for-this-repo, stash → checkout main → pull --ff-only → pop. **Surface the diff to みや — what we missed could "kill us" if it touches files in our suspected scope**. **env-check skill** (`.claude/skills/env-check/SKILL.md`) automates the entire per-repo + env-file check + auto-propose-fix flow — invoke at every Discovery entry and Apply entry.

**Step 0b — PDF annotation extraction:** If the Task folder contains any `.pdf` (BA correction marks, mock-ups), extract every `Annot` (highlight, comment, popup text) before reading the brief:
```python
import fitz
doc = fitz.open('<path>')
for p, page in enumerate(doc):
    for a in (page.annots() or []):
        print(f'p{p+1}', a.info.get('content',''),
              'highlighted:', doc[p].get_textbox(fitz.Quad(a.vertices[0:4]).rect) if a.vertices else '')
```
The default Read tool exposes visual page content but NOT the BA's per-annotation comments — those are PDF metadata. Map every comment to a ticket issue before proceeding. **Why**: 2026-05-04 QA #259318 — missed all 8 BA comments including "Tukar Nama Label Kepada **Luas**" (not Keluasan), "remove" instruction on formula tail, "bold" instructions on multiple highlights.

**Steps:**
1. **Locate or create Task folder:**
   - Glob `1. Tasks\Melaka\` for existing folders matching the QA/UAT-CR number — if found, that IS the Task folder; read it
   - If not found in active: Glob `1. Tasks\Melaka\Archive\` as well (archive for numbering reference)
   - If creating new: find the highest leading number across BOTH active + Archive, then create `<highest+1>. <title as given by みや>` in `1. Tasks\Melaka\`
   - Base structure — always 3 folders:
     - `0. Brief/` — ticket info, screenshots, references
     - `1. Simulate/` — reproduction steps, test data
     - `2. Fix/` — applied fix artifacts
   - Then `3. {Status}/` — named after current ticket status (e.g. `3. New`, `3. In Progress`). Increments on each return: `4. Rework`, `5. In Progress`, etc.
   - `redmine-sync.js --create` handles all of the above automatically when creating via sync
   - Confirm folder path back to みや
2. Wait for みや to populate `0. Brief`, then read every file in it
3. Read every file in the Task folder (Glob + Read all)
4. Parse: ticket description, scope items (a, b, c…), bug details, screenshots
5. **Inventory-first knowledgebase load** — `Glob projects/coding-projects/active/etanah-knowledge/<state>/` → `Read` files in two tiers (strengthened 2026-05-09 after slip QA-260139 where Ruri guessed PSBS/PSBP meanings instead of reading DOMAIN-GLOSSARY; extended 2026-05-12 with DEFERRED-CRITICAL-ISSUES.md per みや):
   - **MANDATORY (always load, every quest, no exception)**: `DOMAIN-GLOSSARY.md` (urusan codes, module/side terminology), `MODULE-ARCHITECTURE.md` (package structure, module boundaries), **`DEFERRED-CRITICAL-ISSUES.md`** (known issues deferred from past tickets — cross-check against current ticket's scope_anchor; surface as Standing Flag if any deferred item touches current ticket's surface). These are foundation references — every etanah ticket needs them.
   - **MANDATORY when ticket type matches**: `FLOWABLE-WORKFLOWS.md` (workflow/Flowable tickets), `JSF-WIRING.md` (JSF UI tickets), `BUG-BESTIARY.md` (any bug fix — past patterns may match).
   - **AS RELEVANT**: `DATABASE.md` (SQL/schema tickets — large file, code-first works most of the time), `FRONTEND-PATTERNS.md`, `URUSAN-FLOW.md`, `FLOW-TRACES.md`.
   - No hypothesis, no SQL, no code grep before this step. See `feedback_inventory_first.md`.
   - **Surface in Discovery reply**: confirm "DOMAIN-GLOSSARY loaded ✓ — urusan code expansions known: <list 3-5 relevant ones>" so みや sees proof of load.
   - **Flowable/workflow tickets only**: also locate the relevant BPMN XML from `E:\Projects\Melaka\etanah-pelupusan\src\main\resources\processes\`. Read service task `class` attributes and user task names directly — treat BPMN XML as source code, not a black box. Do not rely on delegate Java class names alone when the process XML is accessible.
6. **Generate test record SQL** — auto-fill from ticket context using the standard template below:
   - **Urusan**: grep `DOMAIN-GLOSSARY.md` for the urusan KOD from the ticket (e.g. PSBS, PRZ, PPJK)
   - **Tugasan**: grep `DOMAIN-GLOSSARY.md` Known Tugasan Codes section for matching KOD or NAMA
   - **ID_PENGENALAN**: if provided in ticket → use subquery approach (preferred)
   - **If ID_PENGENALAN not provided**: uncomment and fill `IT.KOD` or `IT.NAMA` filter instead
   - `LAST_MODIFIED_DATE` may be NULL on unmodified records — always wrap with `COALESCE(LAST_MODIFIED_DATE, CREATED_DATE)`
   ```sql
   -- Auto-filled at quest creation. Uncomment tugasan filter only if ID_PENGENALAN not available.
   SELECT
     UAT.A_TGSN_ID, UAT.CREATED_DATE, UAT.LAST_MODIFIED_DATE, UAT.PEJABAT_ID, UAT.LAST_MODIFIED_BY,
     IT.TGSN_ID, IT.NAMA AS NAMA_TUGASAN, IT.KOD AS KOD_TUGASAN,
     AK.PROCESS_INSTANCE_ID, UAT.PERANAN_SEMASA, PPS.NAMA_PENGGUNA AS PENGGUNA_SEMASA,
     IPS.KOD AS KOD_PEJABAT_PENGGUNA_SEMASA, IPS.NAMA AS PEJABAT_PENGGUNA_SEMASA,
     UAT.FLAG_AKTIF, UAT.APLIKASI_ID
   FROM UMM_A_TGSN UAT
   INNER JOIN IND_TGSN IT ON IT.TGSN_ID = UAT.TGSN_ID
   LEFT JOIN UMM_ALIRAN_KERJA AK ON AK.ALIRAN_KERJA_ID = UAT.ALIRAN_KERJA_ID
   LEFT JOIN PCP_PENGGUNA PPS ON PPS.PENGGUNA_ID = UAT.PENGGUNA_SEMASA_ID
   LEFT JOIN IND_PEJABAT IPS ON IPS.PEJABAT_ID = PPS.PEJABAT_ID
   WHERE UAT.APLIKASI_ID IN (
     SELECT UA.APLIKASI_ID
     FROM UMM_APLIKASI UA
     WHERE UA.ID_PENGENALAN ILIKE '%<ID_PENGENALAN>%'  -- fill from ticket, or replace block with urusan filter
   )
   AND UAT.FLAG_AKTIF = 'Y'
   AND COALESCE(UAT.LAST_MODIFIED_DATE, UAT.CREATED_DATE) <= CURRENT_DATE - INTERVAL '2 months'
   --AND IT.KOD ILIKE '%<TUGASAN_KOD>%'   -- uncomment if no ID_PENGENALAN
   --AND IT.NAMA ILIKE '%<TUGASAN_NAMA>%'  -- uncomment if no ID_PENGENALAN
   ORDER BY UAT.CREATED_DATE DESC;
   ```
   Present the filled script to リドワンさん before Phase 1 — do not skip this step.
6. Build checklist table — one row per deliverable:

| Item | Tugasan | Description | Status |
|---|---|---|---|
| 1a | PRMMKNPDT | Syor Permohonan field (editable) | ⬜ |
| 1b | SRMMKNPDT / PPT | Syor Permohonan field (disabled) | ⬜ |

7. Save checklist to QA project file under `projects/coding-projects/active/<QA-number>/`
8. Write `quest/active.txt` with current quest state
9. Present checklist — **wait for みや's confirmation** before Phase 1

> Skip Phase 0 checklist table for pure single-root-cause bug fixes. Still read the Task folder.

---

### Read-Redmine sub-protocol — Auto-Discovery familiar (added 2026-05-07)

**Trigger**: any "Read Redmine" / "retrieve tickets" sync that returns ≥1 NEW ticket.

**Per new ticket** (after `redmine-sync.js --create` lands the folder):

1. **Spawn a familiar** (Agent with `general-purpose` subagent) — its prompt must include:
   - Ticket #, Task folder path, codebase root (pick by ticket subject — `E:\Projects\Melaka\etanah-pelupusan` for **APPS / PELUPUSAN** = staff-side OR `E:\Projects\Melaka\etanah-awam` for **AWAM** = public/pemohon-side; use proper module names, not informal "officer-side" labels — corrected 2026-05-09 per みや), etanah-knowledge folder path
   - **Repo branch awareness** (added 2026-05-08): for etanah-pelupusan main branch is `mlk/master`; for etanah-awam baseline is `mlk/master` (corrected 2026-07-02 — AWAM mirrors PLP; `mlk/stag-env`/`mlk/mlit` are downstream). Familiar must read code from the correct main branch — claims based on stale branch are unreliable.
   - Reference the 5 hard rules for Word-template work (Word-template-first lookup, Word XML run-join, Branch check, PDF annotation extraction, Renderer-side overrides)
   - Output: write `projects/coding-projects/active/QA-<num>/scout.md` (renamed 2026-05-08 from `early-diagnostic.md`; legacy filename remains for closed quests; new scouts use `scout.md`) with sections in this exact order — (1) **Permohonan ID + Env + Tugasan kod** as a TOP-LINE single-line summary (ALWAYS first; みや needs this for simulation; surfaced ABOVE all other tables in Discovery reply too — strengthened 2026-05-08 after slip on QA-260298 where the test data was buried mid-table) — (2) **Gap statement** (added 2026-05-12 — 3 explicit lines: `Expected: <BA's expected behavior verbatim>`, `Observed: <actual behavior from Description.txt>`, `Gap: <the bug — one line>`. Refinement of Description.txt parsing; not a new doc — just 3 explicit lines at top of Scout instead of buried in prose. Anchors every downstream investigation step.) — (3) Ticket scope (verbatim), (4) Urusan/Tugasan/Layer classification (with full urusan-code expansion from `etanah-knowledge/melaka/DOMAIN-GLOSSARY.md` — never paraphrase), (5) Suspected files (with file:line where confidence high), (6) Word template state (CC tags + Item-area context), (7) Candidate populators, (8) Knowledge-file overlap, (9) BA scope_anchor (positive + explicit DO NOT), (10) Test data details (id + tugasan_kod + username inference, expanded from #1), (11) Open questions, (12) Effort estimate, (13) NOT-in-scope list
   - **Observed-vs-inferred tag (added 2026-05-12)**: every file:line claim in Scout output marked with one of two tags — `(observed @ file:line)` when Scout literally read the cited line range and quoted the code, or `(inferred)` when Scout extrapolated from naming/convention/sibling files. The 100%-verify rule already forbids unmarked inference; making the tag explicit makes verification visible. Ruri's adversarial Recon checks every `(inferred)` tag — if it can't be elevated to `(observed)`, it gets demoted to "unknown — needs runtime/みや input".
   - **Anticipated-issues speculation tag (added 2026-05-13)**: every anticipated issue / predicted scope item / suspected root cause in Scout output marked as `(SPECULATIVE)` unless directly confirmed by BA in current-cycle journal text. Flow: `Scout output (tagged SPECULATIVE) → Recon cross-reference against history.txt cycle boundaries → only BA-flagged current-cycle items enter fix scope`. **Why** (2026-05-13 QA-247710): Scout's early-diagnostic listed 11 anticipated issues based on PDF annotations + speculation; BA flagged only 2 in the current Rework cycle. Treating all 11 as scope inflated the work from ~2h to a multi-day investigation before みや caught it. Tag at source (Scout), verify at Recon (cycle-relevance check) — same observation that's now in `Phase 0 Re-engagement section step 4`, but applied to Scout output not just attachments.
   - Stay strictly read-only. Cite file:line. Mark "**unknown — needs runtime/みや input**" rather than guess.
   - **100%-VERIFY clause (added 2026-05-08, applies to BOTH familiar's draft AND Ruri's wrap-up)**: for every file:line claim, READ the cited line range and quote the actual code or mark VERIFIED+brief-summary. For dispatch tables (switch blocks, if-else chains, "all except X" enumerations, urusan-to-bean mappings), trace ALL branches by reading the dispatch code — do not paraphrase from filenames or guess from convention. Caught failure 2026-05-08 QA-260139: familiar's diagnostic listed "all urusans except PLPS+PRU" as gap sites; source-trace at `PelupusanPermohonanTanahPlmsTabForm.java:148-155` revealed MCL also calls `plpPermitHelperForm.onSimpanTanah()` (PLPS pattern) — MCL is NOT a gap. Without 100%-verify, fix would have wasted scope on MCL. みや framing: "I used the word 100% many many times. 100% Ruri."

2. **When みや picks a ticket from the list** — Ruri reads the **Scout** report (renamed 2026-05-08 from "early-diagnostic" — みや confirmed: "if you're writing like that, I still want to use scout. Change everything to it." Scout fits the Quest theme: scouts return from advance reconnaissance with a draft for the team to verify) **adversarially — distrust the scout's findings and try to prove them wrong; only accept claims that survive that scrutiny** (upgraded 2026-05-08 from "skeptical review" per みや: "Distrust the early scouting data and try to prove it wrong but will acknowledge it if it's true"). 100% coverage, not cherry-picking — every claim (file:line, dispatch table, "all except X" enumerations, urusan-to-bean mappings) must be source-verified or marked unverified. Slip caught 2026-05-08 QA-260139 — verified 3 file:line claims but trusted dispatch table without reading; MCL was wrongly listed as gap site, only caught when みや challenged. The Scout report is the familiar's draft; Ruri's adversarially-verified output IS the Recon block. Discovery entry also fires `env-check` skill mandatorily. **Media files in `0. Brief/`** (mp4, wav, mp3, animated gif, screen recording): Ruri must EITHER ask みや to summarize the relevant moment OR request a screenshot/PNG of the key frame — never silently skip as `みや input pending` and proceed. **Inventory-first reminder**: at Discovery entry, read `etanah-knowledge/melaka/DOMAIN-GLOSSARY.md` for urusan-code expansions BEFORE proposing any urusan name in conversation (slip 2026-05-08 QA-260139 — guessed PSBS/PSBP meanings instead of reading glossary; PSBS is actually "Permohonan Serahbalik Berimilik Semula", S.197 + S.76 KTN).

**Why**: 2026-05-07 — みや asked Ruri to spawn a familiar AFTER she'd already done a partial Discovery herself. The familiar's findings were better (file:line citations for terbilang handler, sister-template precedent, docx local-Modified state) than Ruri's solo work. If the familiar runs at retrieval time, the Scout report is already loaded when みや picks the ticket — also surfaces username + tugasan_kod for simulation from the start.

**Cost vs benefit**: ~1 familiar spawn per new ticket (~$0.05–0.20 each). Saves multiple round-trips at quest-start when みや would otherwise have to ask for username/tugasan/scope data. Solidifies pre-assessment.

**Folder format reminder for redmine-sync.js**: new ticket folders MUST include env prefix (FAT/UAT) AND Tugasan KOD where derivable (`MlkPelupusanTugasanConstant.java`). Format: `<NN>. <type> #<num> - <env> - <urusan_kod> - <tugasan_kod> - <issue>`. Defer to Q1 todo for full JS implementation; for now Ruri renames manually post-create when format is wrong.

---

## Task Folder File Rules

### Notes.txt — Keep it SHORT
- Test data, codebase path, key finding (1-3 lines max)
- No deferred topics, no investigation logs, no strategy explanations
- If it's longer than ~15 lines, it's too long — move detail to Fix.txt or knowledgebase

### Fix.txt — 3-section compact format (trimmed 2026-05-12 per みや)
Fix.txt is a quick-reference for re-reading the fix months later. 3 sections (was 4 — RELATED dropped), blank-line separated, no named headers. Total length: ~8–12 lines max.

**Template:**
```
TICKET: QA #XXXXXX

[Class].[method]:
[code before → after, or just the after if removal]

[What was wrong and what was done. 1–3 lines max.]

[ClassA → ClassB → ClassC → output]
```

**Sections (in order):**
1. **FIX** — `Class.method:` then the code change (before → after, or new line only if removal)
2. **EXPLANATION** — 1–3 lines: what was wrong, what was done. Plain language.
3. **CHAIN** — execution flow from entry point to affected output

**Rules:**
- No section headers — blank lines separate the 3 parts
- No VERIFICATION, GLOSSARY, or investigation notes — those live in the post-mortem
- No RELATED section — blast radius lives in post-mortem Contributing Factors + Carry Forward; Fix.txt stays tight
- Never use みや, リドワンさん, or any nickname — Task folder files are potential colleague handover artifacts
- **Auto-generated at Phase 1 close-out** (see Phase 1 close-out Step 6) — fires right after `/verify` green, BEFORE STOP gate

**Why** (3-section, 2026-05-12): RELATED section in old 4-section format mostly duplicated post-mortem Contributing Factors. Trimming to 3 keeps Fix.txt scannable. Compact layout forces extreme brevity. Investigation trail belongs in `main/post-mortems.md` after close.

### SUMMARY.txt — Quest close-out (auto-generated at Phase 1 close-out, refined 2026-05-12)
> **Why this exists**: Without a proper summary, reopening a quest months later forces a full re-investigation — searching git, reading diffs, guessing context. This file is the single document that makes re-entry instant.
> **Auto-generation trigger** (2026-05-12 per みや sure-fire trigger): renders at Phase 1 close-out Step 6 — right after `/verify` green, BEFORE the STOP gate. **NOT hand-written**. Source: `quest/active.txt` ticket entry (commit hash, branch, scope_anchor, files_changed_phase1, verified, commit_sha, pushed, etiology, learning_marker, out_of_scope_held) + Phase 1 Fix Walkthrough content. All fields are derivable; if any are missing in active.txt at this moment, BLOCK the auto-gen and surface the missing field to みや for explicit fill.

**Template** (auto-generated into Task folder as `SUMMARY.txt` at Phase 1 close-out):
```
TICKET: <ticket type + number, e.g. UAT-CR #239225>
DATE CLOSED: <YYYY-MM-DD>
STATUS: <COMPLETE | PARTIAL — list what's missing>

--- SCOPE ---
<paste original scope from ticket/Alex — verbatim or near-verbatim>

--- REPOS + BRANCHES ---
<for each repo that needed changes>
Repo: <repo name>
Branch: <branch name>
Commit: <short hash + message>
Merged to: <target branches, e.g. mlk/release/fat, mlk/int-env>
Author: <who committed>

--- WHAT WAS DONE ---
<one line per fix, with file path>

--- WHAT WAS NOT DONE (if PARTIAL) ---
<repo, file, what's missing, why>

--- GIT VERIFICATION ---
Committed: YES/NO per repo
Pushed: YES/NO per repo
Merged: YES/NO + target branch
Stashed: YES/NO — describe if yes

--- REOPENING NOTES ---
<anything a future session needs to know to pick this up cold>
```

**Rules:**
- Every field is mandatory — if a repo was mentioned in scope but no fix was committed, it MUST appear under "WHAT WAS NOT DONE"
- Status must be PARTIAL if any scope item is unfinished — never mark COMPLETE with missing work
- Git hashes are required — not just "committed", the actual hash
- This file replaces the old ad-hoc SUMMARY.md format

---

## Phase 1 — Execute

**Goal:** Solve the ticket.

- Summon a familiar for any file read >500 lines
- Work through Phase 0 checklist — tick `[x]` only when verified in code
- Track key findings silently: what was NULL, what was root cause, what changed
- Note files involved and whether compilation is required
- Do not wrap up until explicitly asked

### Subagent orchestration — superpowers v6.0.3 integration (added 2026-06-28 per みや, eval `wf_a90c9945`)

Four orchestration techniques borrowed from superpowers SDD, each SCOPED so it never collides with the forced-phase-emit / show-gate / veritas audit surface. **Promotion path**: these ship at skill/protocol layer (~80%); the FIRST observed slip on any one promotes it to a registered hook (per `system-design` "promote on observed slip, not pre-emptively"). Eval baseline + the safe-scope reasoning: `wf_a90c9945` (3 closed quests, adversarially verified).

| # | Technique | Rule | Scope-fence (the Banned) |
|---|---|---|---|
| #1 | **File-handoff** | bulk artifacts (>500-line familiar reads, Phase-1 `git diff` dumps) → familiar writes a scratchpad file, controller holds path + 1-line status (wired in `.claude/skills/familiar/SKILL.md`). | NEVER move a gated audit emit (Scout/Recon/Rubric/sibling-diff/RCRL/SD) to a file — show-gate/veritas/quest-phase-gate scan the transcript; a file-only emit starves them. Scratchpad ONLY, never confidential main-tree paths (absent in worktrees). No new manifest — status → existing active.txt block. |
| #2 | **Model-tiering** | cheap (`haiku`) familiars for retrieval ONLY (verbatim quotes / codegraph-grep / transcription); capable for Scout-trace/Recon/Rubric (wired in `familiar/SKILL.md`). | cheap output is raw/UNVERIFIED data — the controller forms + verifies any conclusion; Haiku makes NO judgment (no root-cause / tugasan-class / fix decision, never tags VERIFIED). The QA-260139 paraphrase-a-dispatch-table slip is exactly what a cheap model commits if let judge, and there is NO unit-test backstop (みや's manual test is the gate). |
| #3 | **One-fixer** | if Apply dispatches a fix subagent, ONE dispatch carries the COMPLETE findings list — not one fixer per finding. | the one fixer STILL emits the per-file sibling-diff line + in-file-convention grep PER FILE it touches (one dispatch, N audit emits), carrying PRESERVATION + DEAD-BRANCH-AUDIT + minimal-diff verbatim. **Gate behind no-behavioural-surprise**: a surprising test demotes to Scout/Recon (Rework-restart), never fan out more forward fixes. |
| #6 | **Terse narration** | ≤1 line between tool calls — folded into the `terse-gate` Power, NOT a new rule. | the ≤1-line rule is for mechanical inter-tool chatter; gated audit emits + §2 explanation-flow are EXEMPT. |

**Failure / rollback paths**: cheap-tier familiar errors → retry on capable tier · handoff file missing/stale → STOP + surface (never silent re-read) · partial one-fixer batch → revert-all-or-none. Hook into the Momentum Circuit-Breaker (restart-at-Scout).

**Phase-1 fence**: #2 parallel familiars + #3 one-fixer are **Phase-0 / Apply tools ONLY** — the Phase-1 close-out stays strictly sequential per the order-of-operations rule (line 306).

**KEEP (non-negotiable)**: adversarial Recon ("distrust the Scout, prove it WRONG") + the rejection of superpowers' single-reviewer collapse (#7). Coupled to #2 — Recon is irreducible judgment, never tier it down.

### 🎯 Error-symptom root cause — trace from the ERROR, not the theme (HARD RULE, added 2026-06-19 per みや, QA-266215 misdiagnosis)

**When the symptom is an error / blocker / "ralat → tak boleh proceed":** the BA's words describe the SCENARIO, not the failing check. Picking the validation whose NAME matches the symptom's vocabulary is how QA-266215 went wrong — I grabbed `onCheckingMaklumatKetuanpunyaanHakmilik` because the scenario said "owner/ketuanpunyaan"; the REAL cause was a **syer-kepentingan validation** firing when `viewSyerKepentingan=false` (Vincent `fc6f6d4ba6`). Before naming a root cause for an error-symptom, run this 4-step:

| # | Step | Tool |
|---|---|---|
| 1 | **Get the LITERAL error** — exact thrown message + stack trace from `server.log` (path in Debug section) or a repro. The BA's "papar ralat mesej" is the SYMPTOM, not the error. | grep server.log |
| 2 | **Enumerate ALL gates on the failing ACTION** — for "Klik X fails", list EVERY validation/check the X-handler runs; the cause is one of THESE, not the first method whose name fits the symptom's words. | **`codegraph_callees`** of the action method |
| 3 | **Match by ORIGIN, not vocabulary** — trace error → throwing line → backward. Never let the scenario's nouns (owner, hakmilik…) pick the suspect. | grep the thrown message |
| 4 | **No runtime evidence → UNCONFIRMED** — if the error/repro is unavailable (DB down etc.), emit the ENUMERATED candidate list + "which fires = UNCONFIRMED, need error/repro". NEVER promote one to "leading cause". | — |

**Banned**: naming a single root cause for an error-symptom by name/theme-match without (a) the literal error OR (b) `codegraph_callees` enumeration of the failing action's gates. **Enforced by** `codemap-recon-consult.discipline.hook.js` (Stop back-gate, v1.1) — now also fires on a CODE root-cause claim made without a codegraph call this turn. The enumeration IS `codegraph_callees`; this rule and the codegraph back-gate are the same muscle.

### Rubric — fix-shape options (Rubric)

After Recon emits PROCEED-TO-RUBRIC, Ruri emits 2-5 fix-shape options for みや to pick from. **Standard option set** (added 2026-05-12 — refined to include "when-not-to-debug" 5th option from debugging-playbook):

| Option | Shape | When to pick |
|---|---|---|
| **A** | Targeted Java validator / handler fix | Single-site code defect, sister-defect grep clean |
| **B** | Config-only fix (`tindakan.config.json`, `template.config.json`, etc.) | Dispatch/behavior gated by config; no Java change needed |
| **C** | Template fix (`.docx` Word CC, populator method, XHTML composite) | Output-layer defect; populator + template both verified |
| **D** | Multi-site / cross-bean fix | Pattern repeats across N urusan beans (e.g. QA-260139 three-bean OR-blank validator) |
| **E** | **Don't debug — revert / work-around / wait for upstream** (added 2026-05-12) | (1) Bug appeared in recent change and diagnosis incomplete → revert is mitigation. (2) Bug is in a dependency we can't fix → work around at boundary. (3) Upstream CR (e.g. UAT-CR #XXX) addresses root cause → wait + verify the upstream fix lands instead of patching ours. (4) Scope creep — BA's reported issue is symptom of a deeper architectural concern; flag to senior, don't ship a band-aid. |

**Rubric output format** (per option):
- Option letter + shape
- Pros (1-3 lines)
- Cons / risks (1-3 lines)
- Effort estimate (Low/Mid/High)
- Recommendation rationale (only on Ruri's recommended option)

**Why Option E exists**: debugging-playbook "When not to debug" — sometimes the right call is **revert / work-around / rewrite / mitigate-first**. Refinement of existing Rubric, not new workflow. Past tickets where this would have helped: QA-259534 (no fix shipped — passed back to BA after non-repro), QA-258022 (Attempt 2's Java scope creep — Option E "wait for aaron's upstream pull" would have saved a day).

### 🚨 Logic Blast Radius — mandatory Rubric step (added 2026-06-04 per みや, QA-263921) · ENFORCED by `logic-blast-radius-gate.js` (2026-07-02, QA-268273)

> **Now a deterministic gate** (per みや 2026-07-02): `logic-blast-radius-gate.js` (PreToolUse Edit|Write) HARD-BLOCKS an edit to an etanah stateful-flow `.java` file (`*Form|Bean|Handler|Helper|Service|Controller|Manager.java`) during an active quest until this session has emitted a LOGIC BLAST RADIUS scenario matrix (banner `═══ LOGIC BLAST RADIUS ═══`, or the phrase + `Safe?`/`Evidence` columns). Was prose-only/model-run before (didn't fire reliably — QA-268273 itself skipped the formal matrix). Sibling of `quest-phase-gate.js` for the *logic* dimension; presence-check only (not correctness); fail-open; bypass `[skip-logic-blast: <reason>]`.

> **Why**: QA-263921 happened because QA-253053 fixed the *Simpan* scenario but not the *entry* scenario of the same screen (deleted a doc on entry without regenerating → Kemas-kini hung). The **code** blast radius (which urusan/tugasan share the constant/method) would NOT have caught it — the gap was **logic-wise**: the change participates in several action/state paths and was only safe in one.

**The step — mandatory before Apply, alongside the code blast-radius row.** When a fix touches code in a stateful flow (a form lifecycle, a button/action handler, a shared service method), enumerate **every action/state path the change participates in** and verify the fix is SAFE per path:

1. **Inventory the actors** — every entry point that reaches the changed code: page entry/init, each action handler (Simpan / Jana / Selesai / Print / Submit / reload), and any re-entry (`window.location.reload`, a re-`initData`).
2. **Scenario matrix** — one row per (action × state): `| Scenario | Does the change fire? (guard) | Outcome | Safe? | Evidence |`. State axes that matter: the guard (urusan/tugasan/mode), whether a stored record exists, whether a prior user edit exists, **and — for any user-visible artifact — whether it is LIVE-regenerated each view or a STORED/cached record** (the live-vs-cached axis; QA-262762's entire bug was assuming a *cached* doc that was actually a *live* report).
3. **Verify per row — Evidence column is the teeth (added 2026-06-08, QA-262762)** — guard scopes it correctly? idempotent on re-invocation? discards/overwrites anything the user produced? conflicts / double-works with another handler? **Each `Outcome` + `Safe?` verdict MUST be backed by the `Evidence` column: cite the OBSERVED `file:line` (or live test) that proves it. An ASSUMED outcome = 🚨 STOP — go read/observe before Apply.** This one column folds in what used to be three separate, individually-skippable prose checks — *read-path traced · observed-vs-inferred tag · the live-vs-cached question* — into ONE place that fires inside the matrix that actually runs. **Why it matters**: cycle-1 AND the cycle-3 over-engineering both filled a verdict on ASSUMPTION; the Evidence column converts "I think it's safe" into "I read/saw it's safe, or I STOP."
4. **Classify** — `✅ safe` · `⚠️ by-design` (intended but confirm — e.g. "regenerate discards manual edits, matches the ticket intent") · `🚨 unsafe` (blocks Apply until resolved).
5. **>500-line host file** → spawn a familiar to inventory the action handlers + lifecycle touch-points; Ruri builds the matrix + verdict.

**Banned**: applying a fix to a stateful flow with only the code blast-radius (shared-symbol grep) and no scenario matrix. Code blast radius = "what else shares this symbol"; logic blast radius = "what else *happens* through this change" — **both required**. Banned: an `Outcome`/`Safe?` verdict with an empty or ASSUMED `Evidence` cell.

### 🚨 Template Blast Radius — CC tag = shared API (added 2026-06-10 per みや, TemplateSuratMaklumanPTGPSBSLulus perincian ask)

> **Why**: proposed adding a perincian-append inside `getTujuanPermohonan()`'s URS_PSBS branch as a "secluded" fix — みや asked *"what if another PSBS template uses this tag but doesn't want the extra info?"* The scan answered: **9 PSBS templates** (117 total) bind a `tujuanPermohonan*` tag. An urusan-branch edit silently changes all of them. Urusan-seclusion ≠ template-seclusion. Neither the code blast-radius (shared-symbol grep) nor the logic blast-radius (action/state matrix) sees this third axis: **which templates consume the tag**.

**The step — mandatory whenever a fix changes populator behaviour behind an EXISTING CC tag (or report key):**

1. **Tag-consumer scan** — one python pass over `src/main/resources/template/MLK/*.docx` (document.xml + header/footer parts), `re.findall(r'<w:tag w:val="([^"]*)"', …)`, filter for the tag. Emit the consumer list as a table row: `tag X → N templates (list the same-urusan ones by name)`.
2. **Decision rule** — **>1 consumer AND the behaviour change is wanted for ONE template** → new tag variant + dedicated populator + retag ONLY the target template (the system's own convention: `tujuanPermohonanUpper`/`Lower`/`UpperOnlyFirst`/`Lulus`). Editing the shared method/branch is allowed ONLY when the change is wanted for ALL consumers (cite each).
3. **Emit** in the Rubric table: `Template blast radius: tag <X> → <N> consumers · fix axis = <new-variant-tag | shared-branch-all-consumers-confirmed>`.

**Banned**: changing a shared populator/urusan-branch for a single-template requirement without the tag-consumer scan emitted. "It's inside the urusan's else-if" is NOT seclusion — the urusan branch serves every template of that urusan carrying the tag. Cross-ref: BUG-BESTIARY "CC tag = shared API" pattern (2026-06-10).

### 🚪 Phase-emit banner contract + quest-phase-gate hook (added 2026-06-08, QA-262762)

Each quest phase emit **LEADS with its canonical banner** so the enforcement hook can detect it in the transcript:
- `═══ SCOUT ═══` · `═══ RECON ═══` · `═══ RUBRIC ═══`

**`quest-phase-gate.js`** (PreToolUse `Edit|Write`) **HARD-BLOCKS** any edit to `etanah-*` code/template/config while a `status=active` quest exists, UNTIL all three banners appear in the session transcript. Bypass: `[skip-phase-gate: <reason>]` (legitimate non-quest / audit edit). **Boundary — what the hook canNOT do**: it verifies the phases EXIST (anti-skip), NOT that their content is correct — tracing data-flow honestly (the Evidence column above) stays Ruri's judgment + みや's glance at the matrix. **Fail-open** by design (any hook error → allow). Self-tested 5 cases 2026-06-08. See `.claude/hooks/quest-phase-gate.js` header.

### 🔁 Rework-restart rule — a failed/surprising test re-enters the loop at the TOP (added 2026-06-08, QA-262762)

When a fix fails its test OR the result surprises us ("changes not reflected", "still broken", "now X broke"), that is **new evidence the original understanding was wrong** — NOT a cue to patch forward. **Demote the quest back to Scout/Recon** with the new evidence, re-derive the data-flow, THEN Rubric → Apply. Patching forward builds the next fix on the same wrong model — the failure mode that took QA-262762 multiple cycles + a colleague's blind revert (#264312).

| Test failed because… | Move |
|---|---|
| **Outcome** wrong / surprising (behaviour ≠ prediction) | **Restart at Scout/Recon** — the model is the bug |
| **Mechanical** slip only (typo / compile error / wrong variable; understanding still holds) | Fix forward, no restart |

Discriminator: **did reality surprise you?** Surprise → re-diagnose from the top. Fumble → fix in place. **Banned**: layering "extra/further fixes" on a behaviourally-failed test without re-entering Scout/Recon.

### Phase 0 → Phase 1 autonomous flow (added 2026-05-14 per みや)

**Default = autonomous Discovery → Simulate → Rubric → Apply** without waiting for みや's nod between checkpoints. Scout (Discovery), Recon (Recon wrap-up), and Rubric (Rubric) already run autonomously today; the refinement here is to **continue straight into Apply (apply)** unless one of the explicit STOP gates trips.

**STOP gates** (Ruri pauses + surfaces, does NOT implement):
| Gate | Trigger | What Ruri does |
|---|---|---|
| **BA-Answerable scope Q** | Simulate / intermediate Recon / Rubric surfaces a question only BA can answer (e.g. "scope: PLPS-only or all urusans?") | Surface as ASK block; do NOT implement until みや confirms scope or answers |
| **Confidence < HIGH** | Rubric's recommended option has confidence ≠ HIGH (i.e. MEDIUM / LOW) — encoded in the inline confidence statement on the recommended option | Surface the uncertainty + recommended next step (more recon? Option E?); wait for みや's call |
| **Competing options tied** | Rubric emits 2+ options with comparable pros/cons + no clear winner | Recommend one + flag the tie explicitly; wait for みや's pick |
| **env-check mismatch** | env-check skill flags ⚠️ at Discovery or Apply entry | Surface mismatch + propose switch; wait for みや's authorization |
| **Predicate Box ambiguity** | Predicate Box at Apply reveals a missing WRITER CHECKED or unclear EVIDENCE | Surface the gap; do NOT proceed with the edit |
| **Preservation discipline conflict** | Apply implementation requires deleting/modifying unrelated lines beyond Rubric scope | Surface the conflict; wait for みや's call (per existing Apply HARD RULE) |

**Confidence statement (mandatory inline at Rubric recommendation, separate from Confidence Assessment table)**: every Rubric recommendation includes a one-line `Confidence: HIGH / MEDIUM / LOW — because <reason>` statement. HIGH = autonomous straight to Apply. MEDIUM/LOW = STOP gate.

**Why this refinement (2026-05-14 みや)**: *"Please implement fixes straight away after Rubric. I will read the results."* Pre-refinement: Ruri emitted Rubric + waited for みや's pick + waited for ack at Apply entry — two unnecessary round-trips when confidence is HIGH and there's no BA-block. Post-refinement: みや scans the streamed output (Scout → Recon → Rubric → Predicate Box → Edits → Fix Walkthrough) end-to-end + course-corrects only if a STOP gate trips. Net effect: same gates, fewer pauses.

**`verify` checkpoints in this flow (added 2026-05-18)**: `verify` runs at two points — **after Recon** (`/verify` → Checklist A: env-check, branch+pull, knowledge-load, Scout, Recon all done with evidence) before continuing to Rubric; and **at Apply-done** (`/verify` → Checklist B: diff-contract check on the actual `git diff`) before the HARD STOP. v1 — Ruri emits a `→ verify checkpoint reached` prompt at each; みや may also invoke `/verify` manually. A 🔴 means stop and fix before continuing. (Checklist C runs at Phase 1 close-out — see that section.)

**NON-SKIPPABLE (added 2026-05-28 per みや — QA-262786 /verify miss)**: the /verify checkpoints above are mandatory gates, not optional prompts. Ruri MUST emit Checklist A (after Recon, before Rubric) and Checklist B (at Apply-done, before the HARD STOP); skipping either is the same class of slip as skipping Rubric. The Apply-entry-checklist item 0 is hereby extended to also require: "/verify Checklist A emitted this quest".

**What does NOT change**:
- Predicate Box at Apply (Ritual 1) — still mandatory, still emitted before each Edit
- Fix Walkthrough at end of Apply — still mandatory, still unprompted
- Verify — みや local-tests; Ruri does not auto-run
- Commit and Push (Commit/Push) — みや executes (per existing protocol)
- Confidence Assessment table — still fires when ≥2 substantive items need みや's nod within one response (per personality.md)

### Test-data prep timing (added 2026-05-28 per みや — QA-262786 slip)

Test data is prepared at TWO points, never deferred:
1. **Right after Redmine retrieval** — derive from Description + History (BA permohonan ID + env + urusan + tugasan + langkah + login). Most tickets already state it; write `1. <NNN NNN>.txt` via `node quest/notes.js` **immediately**. If the login is DB-blocked or absent, write the entry anyway with login marked `TBD` — **never defer the whole file**.
2. **After Rubric — ONLY IF** new findings require testing a different tugasan / app than the BA's. If Rubric surfaces nothing new, the retrieval-time test data stands.

### Apply entry checklist (autonomous-flow guard)

Before the first Edit lands at Apply:
0. **Rubric ACTUALLY EMITTED — NON-SKIPPABLE** (added 2026-05-28 per みや after QA-262786 skipped-Rubric slip): the Rubric section (fix-shape options + Multi-Perspective Scrutiny + **Impact/Usage trace**) must have been emitted THIS quest. Proposing a fix-shape or applying an Edit without a prior Rubric is BANNED. **Impact/Usage trace** = per touched field/method: (a) all WRITERS (later-override risk on this code path), (b) the READER/getter, (c) CALLERS of the init method (re-invoked?), (d) for state-scoped changes, BRANCH TOPOLOGY (divergence + merge path — NOT folder/remote). This is the pending "Integration Analysis sub-ritual" (todo Q1), now mandatory.
0.5. **Codebase Convention Check — pre-edit gate 🔑 (added 2026-05-30 per みや, QA-258004)**: before writing a single new line, decide the VERB — new code is the LAST resort. Emit this table FILLED (with `file:line` cites) BEFORE the first Edit:

    | Verb | Question | Cite |
    |---|---|---|
    | **USE** | Does a method/util/constant/VO already do this as-is? (sweep `_SET _LIST _MAP is<Field>Valid` + sibling methods — READ FULL BODIES, not signatures) | `name @ path:N` |
    | **INSERT-INTO** | Can this extend an existing method / config entry / dispatch table instead of a new one? | `path:N` |
    | **UPDATE** | Should I modify an existing method rather than add a parallel one? | `path:N` |
    | **COPY-FROM** | Closest sibling that already solves this shape (urusan / tugasan / bean / template / config entry) — mirror ITS structure | `path:N` |

    Only if all four are exhausted → write new, then **convention-match to the nearest sibling**: **placement** (right section/region, NOT appended at file-bottom — e.g. a private helper goes with peer helpers, never under `// Getters and Setters`) · **naming** (sibling idiom: prefix · casing · language) · **comment density** (`feedback_no_extra_comments.md` — ≤1 WHY-line, no commented-out original, no narration) · **error/return idiom** (copy the sibling's try/catch · null-guard · return-type; confirm the caller consumes what you return). **Verify against real code, NEVER memory or AI-generated reference** (method exists + arity + field [Java field-shadowing] via codegraph/source; SQL table/column entity-first; scrutinize any AI/Codex line before citing). A near-clone of an existing method is a STOP signal → back up to USE/UPDATE.

    *Consolidates the pre-trim "Existing utility sweep + Working precedent" (8-step Tier-1, lost in the 2026-05-22 trim `9d17887`) + adds the never-ruled placement/comment dimensions. **References, does NOT restate/override**: UC9 Sibling-structure read (Recon, `:51`) · the boot Working-analog bullet (CLAUDE.md) · Existing-utility-sweep (`Etanah-Codebase-Read.md:61`) · `feedback_simplify_and_reference.md`. Blast-radius → item 0's Impact/Usage trace; Preservation + dead-branch audit → Apply close.*
1. env-check ✅ (re-verified at Apply entry per env-check skill)
2. Predicate Box emitted with file:line evidence
3. Inline confidence on the recommended Rubric option = HIGH
4. No BA-Answerable ASK question outstanding
5. Preservation discipline confirmed (only Rubric-scope lines being touched)

If any item fails → STOP gate fires → surface to みや.

### Apply boundary — HARD STOP after working-tree edits (added 2026-05-14 per みや)

**Apply does ONLY working-tree edits.** No branch creation. No commit prep. No `git add` / `git commit` / `git push`. No Phase 1 wrap-up. After edits land + Fix Walkthrough is emitted, **run `/verify` (Checklist B — diff-contract check on the actual `git diff`)**; fix any 🔴 before proceeding. Then **STOP** and wait for みや's Verify local testing.

**Why**: `mlk/master` may receive upstream commits during みや's local testing window. The fix branch (`mlk/qa/<num>` or `mlk/qa/<num>v2`) is created at Commit prep AFTER `local_test_confirmed=true` — so the branch is cut from the freshest mlk/master state including anything that landed during testing. Cutting the branch at Apply means the fix sits on a snapshot that may be stale by submission time.

**Working tree throughout Apply + Verify**: stays on the repo main branch — `mlk/master` (BOTH etanah-pelupusan AND etanah-awam — AWAM mirrors PLP, corrected 2026-07-02). Edits are uncommitted modifications on that working tree; みや local-tests against this state. AWAM is BANNED from commit/push on `mlk/master` (local-test only); the fix branch `mlk/<tracker>/<num>` is cut at Commit prep, then merges downstream to `mlk/stag-env`/`mlk/mlit`.

**What's banned at Apply**:
- `git checkout -b mlk/qa/<num>v?` ← creating the fix branch
- `git add` / `git stash` of the changes
- "Prep commit message" / "ready for commit" framing in chat
- Any Phase 1 wrap-up signalling (commit SHA prediction, push-ready language, active.txt status flip)

**みや** (2026-05-14 QA-259759 Rework): *"Please make a hard stop only until implement fix. That is all I asked you to do, I didn't say anything about preparing to commit or wrap up phase 1 or prepare to submit ticket... There might me more updates to mlk/master while we're testing BEFORE we are ready to close phase 1 & pass the ticket in Redmine, I already told you this."* This pattern has happened multiple times; now explicit.

**Commit prep is where branch creation lives** — and Commit should refresh mlk/master via `git fetch origin mlk/master && git pull --ff-only` BEFORE cutting the v-N branch, ensuring the fix is cut from freshest state.

**Before committing (Commit):**
1. Confirm all checklist items are `[x]`
2. Ask: *"Have you tested locally?"* — update `local_test_confirmed=true` in `quest/active.txt`
3. Only then run `git commit -m "QA #<number>"`

**Commit convention:**
```bash
git commit -m "QA #<number>"
```
Examples: `QA #254539`, `QA #254604`, `FAT-OR #251455`, `#249445`

### Fix Walkthrough — mandatory after every code edit batch

> **Why**: Without a structured walkthrough, each code change is just a diff in isolation. みや can't explain to a colleague why we touched the VO if she doesn't have the root cause, class chain, and "why these changes as a set" in one place. Also: the walkthrough becomes 80% of the Phase 2 Fix.txt, so writing it now makes post-mortem nearly free. Cost is ~1 turn per fix, saves multiple re-explanation cycles.

**Trigger**: immediately after code edits land in Phase 1 — **unprompted, same turn as the edits**. Do NOT wait for みや to ask.

**Required structure:**

```
## Fix Walkthrough

### The problem (1–2 sentences)
<root cause in plain language — no jargon unless defined right there>

### Class chain
CallerA → CallerB → EngineC → PopulatorD
(mark where the bug lives with ⚠️)

### Why these changes as a set (table form, refined 2026-05-14 per みや)

| # | Change | Why-as-a-set rationale |
|---|---|---|
| 1 | <one-line change description> | <how it collectively addresses the root cause; what would be incomplete without it> |
| 2 | ... | ... |
| 3 | ... | ... |

### Per-change walkthrough (refined 2026-05-14 per みや — separate concerns: BA's words vs Ruri's action)

For each file changed, emit ONLY 2 bullets — no "why this change" prose, no "what would break without it" prose (both concerns are already covered by the Why-as-set table above). Separation of concerns:

```
**<file:line>**
- **BA wording**: "<exact BA quote from Description.txt / History.txt / journal note — what BA asked for in their own words>"
- **Action**: <plain-language description of what was done, in Word-UI verbs for .docx edits / one-sentence code edit summary for code>
```

### Blast radius
<who is affected / who is untouched / why the scope is right>

### Document / template changes
<explicit "none" if none — prevents silent skipping of Word-side check>
```

**Rules:**
- **Big why goes FIRST** — before any diff. If みや can't explain the fix to a colleague from the first three sections alone, the walkthrough has failed.
- **Class chain always present** — per CLAUDE.md top-priority rule. Visual anchor for how execution reaches the bug.
- **Per-change separation of concerns** (2026-05-14): BA's exact wording (bullet 1) is a quote — what they ASKED FOR; Action (bullet 2) is what Ruri DID. Don't mix the two. The why-as-set table (above) covers WHY at the set level, so per-change rationale prose is redundant.
- **Document/template changes line is mandatory** — even when "none". Catches the silent-skip failure mode.
- Walkthrough content is the primary input to Phase 2 Fix.txt (CHAIN + APPLIED FIX sections) — write it well now, reuse at close-out.

### Verify step instructions — MUST include pengguna_semasa (added 2026-05-14 per みや)

When Ruri emits the "Next steps (Verify — your turn)" summary at end of Apply, the test data line MUST include all 3 fields matching the Recon Test Data format: `<Permohonan_ID> at <tugasan> as <login>`. Dropping the login (pengguna_semasa name) is a slip — みや caught it 2026-05-14 QA-259759 Rework: *"make sure to mention the pengguna semasa name as well when you're summarizing the steps to do at the end of the reply."*

**Format**:
```
Test on <Permohonan_ID> at <tugasan_kod> as <login_email>:
  - <step 1>
  - <step 2>
  ...
```

Example (correct): `Test on PTMLK/01/L/PLPS/2026/1 at PYSK as nizalarif@melaka.gov.my`
Example (slip): ~~`Test on PTMLK/01/L/PLPS/2026/1 at PYSK`~~ — missing login.

### Mid-Quest Investigation Trail — mandatory when session ends mid-investigation

> *(Reconciled 2026-05-22: the separate `quest/handoff-<QA>.md` FILE is DEPRECATED — see line 55. みや 2026-05-11: "About the handoff, definitely drop it off." The investigation trail below is still mandatory; it now lives as a section IN the per-quest `QA-<num>.md` doc, not a standalone file.)*
> **Why**: If a fix fails local testing, next session's me has the fix context but not the investigation trail — forcing either blind retry of the same theory or wasted re-exploration. The trail persists the reasoning, ruled-out paths, and a triage ladder so failure recovery is cheap.

**Trigger**: any `save all` / `save` / session wind-down while `phase ∈ {0, 1}` and `local_test_confirmed=false` and code edits were made.

**Home**: a `## Resumption — Investigation Trail` section inside `projects/coding-projects/active/QA-<num>/QA-<num>.md` — overwritten on each save during the quest. NOT a standalone `quest/handoff-*.md` file.

**Required content (6 sub-parts):**
1. **Current state** — what's been applied, what's pending test, what to do next
2. **Root cause theory (with evidence)** — the theory + file:line pointers for re-verification, NOT just the conclusion
3. **Ruled out** — hypotheses we disproved and why (so next session doesn't re-walk them)
4. **Parked / alternative hypotheses** — things we haven't fully disproven but deprioritized (so if primary fix fails, we know where to go next)
5. **Triage ladder if fix fails** — ordered checks: "If X still broken, add a logger at A:line, inspect B. If A is fine, check C..." Concrete, file:line specific. (Breakpoints BANNED — use loggers per Debug Ritual 6.)
6. **What a different root cause would look like** — early warning signs that the theory is wrong + which subsystem to revisit
7. **Failures hit this cycle (MANDATORY — added 2026-05-30)** — every failure encountered this cycle MUST be listed EXPLICITLY, never buried inside "current state": (a) **wrong / non-existent test data handed back** — cite the bad ID, why it was wrong, and the fix; (b) **runtime errors after the fix** — NPE / stack trace + the class chain + whether mine or pre-existing; (c) **env / DB-access / tooling failures**. A failure that next-session-me would otherwise re-pay is the single most important thing to persist.

**active.txt sync (MANDATORY — added 2026-05-30)**: the SAME save MUST reconcile the ticket's `quest/active.txt` entry — update `phase` / `current_phase` to current reality AND append a `notes:` line summarizing the cycle outcome INCLUDING the failures from sub-part 7. The `QA-<num>.md` doc is the detail; `active.txt` is the INDEX the Session Briefing reads at boot — if the failure isn't in `active.txt`, boot cannot surface it. **Why** (2026-05-30 slip): QA-259702's §0 doc captured the wrong-permohonan + NPE failures, but `active.txt` stayed at `phase=0 / Discovery / accept-line-only`, so boot showed the quest as un-started and the failures were invisible. Root category: knowledge-transfer-incompleteness.

**On session boot**: if `quest/active.txt` shows `phase < complete` for a ticket, the session briefing surfaces that ticket's `QA-<num>.md` Resumption section as read-before-acting context.

**On Phase 2 close**: the Investigation Trail section feeds the post-mortem's investigation arc.

---

## Debug Mode Rituals

> *(Migrated from CLAUDE.md 2026-05-22 — quest-cluster decomposition.)*
> **Activated when**: みや says "debug mode on", or a debugger screenshot / breakpoint value is shared, or quest protocol flags an active debug session.
> **Deactivated when**: みや says "debug mode off", or quest Phase 2, or session end.
> When active, these rituals are **mandatory** before any fix-proposing Edit or test request. They exist because debugging-discipline failures are invisible in response text — passive feedback memories haven't worked. These rituals make the discipline visible so みや can catch violations in real time.

### Ritual 1 — Predicate Box (mandatory before every code/config Edit)

Before any Edit to source code or config, output the Predicate Box as a TABLE with separated concerns (per Output-Format Discipline — TABLE + SoC mandatory):

| Field          | Sub-concern                         | Content                                                                                          |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| Predicate      | —                                   | `[change X] works iff [condition Y] holds.`                                                      |
| Evidence       | (one row per distinct claim/source) | `[file:line] shows [observed fact]` — split into multiple rows when ≥2 distinct evidence sources |
| Writer checked | —                                   | `yes — [file:line] produces this input` / `n/a — not a parsing/reading bug`                      |

Wrap with `═══ PREDICATE BOX — <ticket> <one-line scope> ═══` opening + `═══ END ═══` closing banners (plain text, NO code-block fence).

**Scope (refined 2026-05-11 by みや)**: ALL Edits to source code or config — no carve-outs. Even refactors, cleanups, typo fixes, logging additions, probe-style "try this and see if it works" Edits. **Size of the predicate scales with stakes**:

- **Trivial** (typo, formatting, comment-only): one-line predicate stating "no behavior change expected, only X"
- **Small** (1-liner with behavior implication, set/list membership additions, single-attribute toggles): full 3-line box
- **Substantive** (multi-line or multi-file logic change): 3-line box + extra cites for each gate/condition touched

Why no carve-outs (2026-05-11): a refactor can break behavior silently; a typo fix in code (not comments) can cause real bugs; probe-style Edits especially benefit because they need a clear "drop-if-fails" condition stated upfront. The 3-line box is cheap (~10 seconds); the silent slip it catches is expensive.

**Defensive-line ban (added 2026-05-12 after QA-247710 Apply slip)**: at Apply execution, if implementing reveals a line that wasn't in the Rubric — PAUSE and predicate-justify before adding. "Defensive" reasoning is BANNED — every line needs a concrete predicate ("this line is needed because <observed concrete failure mode>"), NOT "in case X happens" or "to be safe". The Rubric scrutinizes the PROPOSED fix shape; without this rule, defensive lines added at implementation slip past Rubric. **Why**: 2026-05-12 QA-247710 Apply — I added `ccVO.setType(TABLE)` reset at end of populator with "in case the inner populate* calls mutated ccVO" reasoning. みや caught it: the framework reads the RETURNED tableVO, not the input ccVO, so the reset is dead code. BPRZ doesn't reset either. **How to apply**: at Apply, every added line passes the test "is this line necessary for the Rubric's predicate to hold? If not — don't add it. If unsure — call it out in the Predicate Box explicitly, don't bury it."

みや spot-checks one cited `file:line` per session at random.

### Ritual 2 — Evidence Language Discipline

Reserved vocabulary:

- **"Proven" / "confirmed" / "root cause found"** — only after debugger/test shows it directly.
- **Banned synonyms** (lexical dodge): "the actual issue is", "definitely X", "it must be X", "this is the reason", "the real cause is"
- **Use instead**: "hypothesis", "theory", "likely", "suspect", "candidate"

みや calls out: *"evidence word"* — I replace with the honest word.

### Ritual 3 — Momentum Circuit-Breaker

**Trigger — broadened 2026-05-15 after QA-260302 spiral**. Fires when ANY of:

- (T1, original) Code was written to files AND subsequently shown not to work by test, debugger, or みや's report
- (T2, new) A recommendation / proposal / diagnosis was emitted and shown WRONG by みや's correction — even if no code was written yet (e.g. wrong DELETE candidate, wrong fix shape, wrong root-cause hypothesis)
- (T3, new) Building on a theory after it's been challenged or partially refuted by new evidence (DB query result, source-read finding) — even before みや challenges it

After any of T1/T2/T3, the next response **must** begin with:

`RESET. Prior theory abandoned: [name the theory]. Re-reading raw evidence from scratch.`

Required: name the theory being abandoned. Do not build on it in the same response. Re-read evidence before proposing anything new.

**Why broadened** (2026-05-15 QA-260302): I went through ~5 wrong recommendations today (grid 1fr 1fr UI, DELETE 1194+884, DELETE 1194+646, "rowExpansion postback broken", etc.) without ever firing RESET. Original trigger was too narrow — only fired on code-shown-wrong, missed the more frequent "recommendation-shown-wrong" + "evidence-contradicts-theory" failure modes. みや: *"during our spiral, you didn't even use the Reset skill. Why did it not get triggered?"*

みや calls out: *"no reset"* — I stop and restart properly.

### Ritual 4 — Debug Mode Setup

When debug mode activates, my first response must say:
*"Debug mode active. Please toggle `/fast` off (extended thinking on) — I cannot toggle this myself."*

I do not propose fixes until that toggle is confirmed OR みや explicitly says *"proceed without"*.

### Ritual 5 — Permanent-fix-first + exhaust-to-confidence before hand-back (added 2026-05-28 by みや, QA-262243)

The goal of debugging is the **ROOT permanent fix, not a patch** that masks one reported instance. Before handing a diagnosis back to みや:

- **Pursue the cause to ≥90% confidence OR until all accessible investigation methods are genuinely exhausted** — DB queries across the *whole affected data population* (not just the one reported app), code-path tracing, familiars, local repro. A residue I can verify with a tool I already hold is **NOT** a valid stopping point, and asking みや for it is BANNED (see `personality.md` "No asking-back for searchable facts").
- **Always answer the class questions**: *what causes it · how confident am I · can the whole class be remediated · what is the permanent fix vs the stop-gap patch.* If a patch fixes only the reported instance, label it AS a stop-gap and state the permanent fix + remediation scope for the rest of the class.
- **Banned**: handing back at first-confirmed-instance with "shall I investigate further? / how was this created?" when the method to answer it is accessible. **Why** (みや 2026-05-28, QA-262243): I confirmed the flag mechanism + that a data-patch renders the letter, then handed back the cause + can-we-patch-all questions instead of querying them. みや: *"find the solution until you're above 90% or have exhausted all methods accessible to you... The main goal is to find a permanent fix, not simply patch."*

### Ritual 6 — Runtime confirmation via loggers; breakpoints BANNED (added 2026-05-31 by みや)

When static analysis (code-read + DB queries + sibling-trace) is **genuinely exhausted** and a runtime fact is still unconfirmed (root cause < ~90% confidence), the confirmation comes from **loggers**, never a breakpoint request.

- **Bundle the loggers INTO the first-pass fix build — this is THE time-saver.** The trigger moment is the END of the first pass: `/quest start` → Discovery → Scout → Recon → Rubric has chosen the fix, and implementing it leaves ONE runtime thing unconfirmed. Add the probe loggers in the **SAME code change as the fix**, so the ONE rebuild+redeploy you were already going to do for the fix ALSO carries the runtime confirmation — no separate logger-only cycle. (みや 2026-05-31: *"this is why it is a HUGE time saver"* — the build is happening anyway, so the loggers ride along for free.)
- **Breakpoints are BANNED as a request to みや.** A breakpoint halts the (already-slow) server and forces an interactive Ruri↔みや round-trip per value inspected. Loggers are ~3–4× faster: written once, one rebuild+restart, one run, the full log read back. (みや 2026-05-31: *"totally ban breakpoints if using loggers can absolutely cover all breakpoints possibilities… much much more quicker… 3-4x more time saving. Rather than back and forth me asking you about the breakpoints."*)
- **Log EXTENSIVELY in ONE pass — cover ≥3 what-if scenarios.** You get ONE cheap rebuild+restart cycle; missing the needed spot costs another full cycle. So in a single pass instrument every competing hypothesis + every branch point + the null/empty checks: method entry/exit, the decoded value, each branch taken, the field state before/after the write. Cover what a breakpoint AND its watch-expressions would have shown — for ALL candidate causes, not just the leading one. Under-instrumenting (only the leading hypothesis) is the failure mode this ritual exists to prevent.
- Use the project's logging idiom (`LOGGER.info(...)`) with a unique greppable tag (`QA<num>-PROBE:`) so the loggers are findable for removal at close. State the server.log path (`E:/Dev/jboss-7.4-plp-melaka/standalone/log/server.log`) in the hand-back so みや knows where to read.
- **The VERY VERY last resort — a breakpoint ONLY when there is NO code change to bundle loggers into.** If the investigation needs zero code changes (pure read-only) so a logger would cost a whole rebuild cycle for nothing else, THEN — and only then — clearly tell みや there is nothing to rebuild and suggest a single, minimal breakpoint (state exactly WHERE to set it + WHAT one value to read). Last resort, surfaced with its reason, never the default. (Exact condition = Ruri's judgment per みや 2026-05-31; he confirmed "yes, last resort". Breakpoint *type* left unspecified — describe where+what, not the Eclipse mechanism.)
- **Cleanup is mandatory**: probe loggers are temporary and MUST be removed at Phase 1 close (prepare-commit Step 2.6 / Phase 1 close-out scan).

**Pairs with** Ritual 5 (exhaust-to-confidence) + `personality.md` "No asking-back for searchable facts": Ritual 5 says don't hand back before exhausting accessible methods; Ritual 6 says loggers ARE an accessible method, breakpoints are NOT (they require みや). Escalation ladder: **code-read → DB → extensive loggers (one pass) → (only if loggers genuinely cannot reach it) surface the specific limit to みや**.

### Violation Log

Every slip on Rituals 1–6 gets a one-line entry in `Feature/Forge-Self-Improvement-System/debug-ritual-violations.md`. Trend visible over time. If slips persist across multiple sessions, the ritual design is wrong — redesign, don't just re-promise.

---

## Phase 2 — Post-Quest Phase (formal name) / "End Quest" / "Bounty" (casual)

**Naming** (set 2026-05-09): formally **Post-Quest Phase** or **Phase 2** or **End Quest** for short. Casually we say **Bounty** indirectly — collecting the rewards (knowledge, KPI, refinements) earned from finishing the quest. The "Reflect / Post-Mortem" name from older protocol is folded under this.

**Goal:** Extract the META layer — process learnings, contributing factors, skill refinements. Everything fix-mechanical (root cause, class chain, knowledge-file updates) already happened in Phase 1 via Fix Walkthrough + scout/recon docs.

**Streamlined 2026-05-12** (from 11 steps to 5, per みや audit): Phase 2 had absorbed too much; most steps duplicated Phase 1 work. The unique value of Phase 2 is the META layer that needs the full quest arc to make sense.

**Auto-trigger (added 2026-05-12)**: Phase 2 fires **automatically** the moment みや confirms "submitted on Redmine" / "ticket passed" / "commit verified" — no separate "wrap up" command needed. The Phase 1 STOP gate transitions directly into Phase 2 emit. The 5 steps below must complete in **<3 minutes** of みや's reading time, total. If Phase 2 emit takes longer to draft, the format is wrong, not the work.

### Visible step-checklist at emit start (hard rule, added 2026-05-20 by みや — same shape as DE Step 0 + Phase 0 artifact gate)

Phase 2 MUST begin with a visible 5-row checklist BEFORE the actual content. Each step marked ✓ done / ⬜ pending / ⏭ skipped (with written reason). Update inline as steps complete.

**Checklist is the GATE, not the DELIVERABLE** (added 2026-05-20 by みや after Phase 2 silent-emit slip): The checklist marks step status, but each step's CONTENT must ALSO emit inline in chat (Faster-finding line + KPI table + post-mortem META summary + Refine decisions + "Your part" output table). Phase 2 is a chat-visible review — みや reads to verify + provides Redmine-side action. If only the checklist + verify table emit, Phase 2 has lost its purpose. **Why**: 2026-05-20 QA-262233 — I emitted checklist + Checklist E verify but no step content; みや: *"Phase 2 has lost its purpose. I don't gain anything or review anything."* Same pattern as visible-checklist landing → I treated it as the deliverable instead of the index.

**Why** (Phase 2 checklist itself): Phase 2's step 5 (archive both-sides + active.txt flip) was repeatedly silent-skipped — see QA-262039 (Phase 2 ran but post_mortem= and kpi_entry= lines never reached active.txt), QA-260302 (Phase 2 never fully fired despite my claims). Same disease as the 2026-05-17 boot-step silent-skip; same cure — make every step's completion visible so a skip leaves a trace.

Format — single compact line (refined 2026-05-21 by みや — mirrors the DE step-0 line; a mere tracker must not eat space with a full table):

`Phase 2 — QA-<num>:  1 ⬜ Faster-finding · 2 ⬜ KPI · 3 ⬜ Refine-receipt · 4 ⬜ Render+archive · 5 ⬜ verify Checklist E`

Update each marker in place as the step completes (⬜ → ✓, or ⏭ + a one-line reason). It is a tracker line, NOT a table — tables are reserved for actual deliverables (the `/verify` Checklist E *output* stays a table because it carries evidence; the Phase 2 step-tracker does not).

<!-- "BA accepted" trigger REVERTED 2026-05-20 by みや — wrong scope. Ruri doesn't track BA-side state per quest-protocol's "outside Ruri's scope" rule. -->

### The 5 streamlined steps

**Step 1 — Faster-finding (1-2 lines)** — *what would have made this quest faster, with an immediate action artifact*. Phase 1 process note that needs the full arc to make sense. Format: *"Faster: <one-line observation>. Action applied: <one-line concrete edit to skill/protocol/memory/knowledge>."* Per the existing "Mistake → action, not words" hard rule, every faster-finding MUST trigger an applied artifact in the same Phase 2 — not "noted for next time". みや reads this in <15 seconds.

**Step 1b — Fastest-Path Retrospective (added 2026-06-04 per みや, QA-263921)** — the fuller companion to Step 1's one-liner. When the investigation took **>1 wrong turn**, write a `## Fastest Path` block into the quest's `QA-NNNN.md` recording the CLEAN, SHORTEST path that *would* have reached root cause — wrong turns stripped out — so the next similar issue is solved in minutes. **Goal** (みや 2026-06-04): *"a clean, fastest, most efficient way to debug for next time's reference."* The value of a closed quest is not only the fix; it's the **compressed debug path** — recording only the fix loses the "how to get there fast" knowledge, so the next engineer re-walks the same dead-ends.

Format (the `## Fastest Path` block):
1. **Symptom signature** — the 1-line observable that identifies this bug class next time.
2. **Fastest path** — the ordered MINIMAL steps to root cause, each naming the exact tool / file / log / command / query. No hypotheses, no wrong turns — only the load-bearing steps, in hindsight order.
3. **Wrong turns removed** — 1 line each: the dead-ends taken this quest + WHY each was wrong, so they're skipped next time.
4. **Reusable recipe** — if this is a recurring CLASS (not a one-off), promote the path to `BUG-BESTIARY.md` as a named recipe (symptom → the N-step path).

**Banned**: closing a quest that took >1 wrong turn with only the fix recorded and no Fastest-Path block. The wrong turns ARE the signal — name them so they're never re-walked.

**Step 2 — KPI entry (HIGH-BAR — only-if-significant rule, added 2026-06-01 per みや)** — append to `main/kpi-tracker.md` ONLY IF the quest produced something **significant AND stands out, ESPECIALLY out-of-scope + critical**. Default: SKIP. Rare-by-design — most quests close without a KPI entry. **When to add**: extras you solved beyond ticket scope that have real business value (caught a sibling-urusan bug, found + reported a deferred-critical issue, surfaced an architectural gap), a fix whose blast-radius reached unexpectedly far, or a meta-discovery the team would value at the next upward report. **When NOT to add**: routine bug fix that did exactly what the ticket asked, refactor inside scope, normal-cadence work. **Why** (みや 2026-06-01): the prior "rows as many as feel meaningful, no minimum" rule produced KPI noise — every quest got logged whether or not anything stood out → the tracker stopped being scannable AS a highlight reel. New shape: a row in `kpi-tracker.md` should be a banner moment, not a checkbox. The post-Phase-2 weekend KPI review (`feedback_personal_expression` 2026-05-07 personal todo) only works if the entries ARE the standouts. Format when emitting: 2-column scannable per `kpi-tracker.md` (Column 1 = grep-able identifiers; Column 2 = plain English what we learnt). If skipping: emit one line in chat at Phase 2 — `KPI: skip — routine ticket-scope work, no standout`.

**Step 3 — REMOVED (2026-06-08 per みや).** The per-ticket Post-Mortem META was restating the slip-log; its process-learning is already captured by Step 1 (Faster-finding) + Step 1b (Fastest Path). Cross-ticket pattern synthesis (its only unique value) moves to a **weekly slip-log pattern-pass**: a 5-minute review that reads `meta/slip-log.md` running-count and acts ONLY on patterns at ≥3 recurrences (promote to a structural rule/hook). Not a per-quest emit.

**Step 4 — Refine receipt (1 line)** — the autonomous loop (hooks + `auto-skill-on-mistake` + `system-rules` + `system-design`) does the refining in real time; this step just REPORTS the result. Emit one line: `Refine — QA-X: <the rule/skill/hook that changed this quest>` OR `Refine — QA-X: none`. A clean "none" is a valid, expected output — never ceremony. KEEP the `## Improvement Checklist` auto-promotion (that IS the autonomous part): each captured "check-further" push whose corrected fix worked promotes automatically into its fix-category check-set (no separate nod — みや's acceptance of the working fix during the quest WAS the nod). One-offs dropped; per-quest section transient.

### 🚨 Rule — Quest's todo / deferrals-capture (added 2026-07-06 per みや, QA-268415)

**Any deferral surfaced DURING the quest MUST be captured STRAIGHT AWAY into `QA-<n>.md` `## Deferred to follow-up` section — never at Phase 2, never at close.** Types of deferrals to capture (non-exhaustive):

- Out-of-BA-scope fixes flagged for a follow-up ticket (e.g. general utility fix discovered while chasing a specific BA symptom)
- Known future gaps documented in Recon but not fixed (e.g. "if urusan X ever needs behaviour Y, this override path is missing Z")
- Protocol / skill / tooling improvements surfaced but deferred to a dedicated pass
- Learning items みや mentions during the quest (Java idiom deep-dives, framework internals, DB semantics)
- Any "I'll do this later" said or implied

**Format** — `## Deferred to follow-up` section with a `| # | Deferral | Home |` table. Each row's Home column MUST be concrete: an actual ticket ID, a `main/todo.md` Q-tier entry, a queued protocol/skill edit line, or an in-doc note WITH a surfacing-trigger. **Banned**: orphan rows with no home; "will decide later" placeholder homes.

**Phase 2 verify (folded into Checklist E)**: enumerate every deferral in `QA-<n>.md § Deferred` → confirm each row's Home resolves (ticket exists, todo.md row visible, protocol edit committed or queued). Missing home = 🔴 → block Phase 2 close until captured.

**StopGate**: `quest-deferrals-gate.discipline.hook` — fires at Phase 2 close-out signal + `close-phase` invocation. Reads `QA-<n>.md` for a `## Deferred to follow-up` section; if absent OR any row lacks a Home cell → blocks Phase 2 with an actionable list of missing captures. Build queued in `main/todo.md` Q1.

**Why** (2026-07-06, QA-268415 Phase 1 close): several items surfaced during the quest (out-of-scope PelupusanUtil.java fix, known future PT-Lampiran-A gap, class-chain protocol update, Java DI learning ask) sat only in chat memory — I "remembered" them at close but only because みや asked. Deferrals held only in chat evaporate at compaction / new session; the qa_doc is the durable home. STRAIGHT-AWAY capture makes each deferral audit-visible; the StopGate makes silent-drop impossible.

### Refine triggers — universal (extended 2026-05-13)

Refine is the universal engine "extract improvement from observation." Triggers (entry points):
- **Phase 2 Step 4** — quest-end skill/protocol/memory refinements (existing, primary).
- **Mid-session cross-cutting update** (NEW 2026-05-13) — when an external trigger (team announcement, infrastructure rename, BA spec shift, constant rename, file relocation, terminology shift, deprecation) requires updating multiple living docs. Use the 7-step cross-cutting methodology below. **Mandatory preview before applying** — too many files to safely apply blind.
- **DE-time Gap Sweep** (existing, added 2026-05-11) — retrospective lens; surface 2-3 observations per session that didn't bake into rules.

Engine stays the same: identify → propose → preview → みや nods → apply → log to audit-log. Triggers broaden so the discipline catches improvement upstream, not only at scheduled rituals.

### Cross-cutting update methodology (added 2026-05-13)

When a single external trigger requires changes across N living docs (today's example: AWAM main branch renamed `mlk/release/uat` → `mlk/release/fat`), follow this 7-step pattern. Avoids the failure mode of over-embedding history into operational docs (which bloats the tier — see CLAUDE.md MD file writing style discipline).

| Step | Action | Failure mode if skipped |
|---|---|---|
| 1 | **Classify the change type** (rename / deprecation / new component / relocation / terminology shift / env-config update) | Jumping to grep+edit treats all changes uniformly — different types need different propagation strategies. |
| 2 | **Grep inventory** of every reference across the system | Missing a reference means stale truth in one corner. |
| 3 | **Tier-classify each match** per CLAUDE.md MD file writing style table — operational / reference / journal / changelog | Applying the same edit pattern uniformly bloats compact tiers with history that belongs in changelog tier. |
| 4 | **Tier-appropriate edit per file**: operational tier → compact current truth only; reference tier → version-bumped update with source; journal/diary tier → UNTOUCHED (historical truth); changelog tier (audit-log) → ONE entry holds the rename history + why | Mixing tiers means history pollutes operational docs OR the changelog never captures the why. |
| 5 | **Preview the full edit set before applying** (mandatory for cross-cutting) — present table of `File / Tier / Current text / Proposed text` for みや's nod | Bulk-applying blind = no chance to correct before propagation; today's example: I bulk-applied rename annotations to every tier, みや caught it, full rework. |
| 6 | **Apply + re-verify with grep** against operational tier — confirm remaining matches are either explicitly retained annotations OR journal/changelog | Re-grep without critical check passes stale noise. |
| 7 | **Commit + push** so the propagation lands at main | Without push to main, next worktree spawn boots from stale state (per DE Step 10 main-sync rule). |

**Why explicit** (2026-05-13 みや): today's branch-rename update demonstrated the failure mode end-to-end. The corrected pattern is now the methodology. Refine extension covers this trigger so future cross-cutting updates run through the same discipline by default.

**Step 5 — Auto-render + archive both-sides + active.txt flip** — silent background step. (a) Fix.txt and SUMMARY.txt auto-generate from `quest/active.txt` closed-section entry + Phase 1 commit metadata + Step 3 post-mortem (see Phase 1 close-out section above for the generation step that fires BEFORE commit). (b) `quest/active.txt` ticket entry moves to `closed:` section with `phase=2-complete`, `status=closed`, `post_mortem=`, `kpi_entry=` refs. (c) **Archive folders — both sides** (refined 2026-05-12, replaces old count-based "move at 10" rule): **Task folder (みや's side)** moves from `1. Tasks/Melaka/<NN>. <type> #<num> ...` → `1. Tasks/Melaka/Archive/<NN>. <type> #<num> ...` (update `task_folder=` path in active.txt). **Project subfolder (Ruri's side, IF exists)** — Glob `projects/coding-projects/active/<TYPE>-<NUM>/`; if present, move to `projects/coding-projects/archive/<TYPE>-<NUM>/`. Skip silently if no project subfolder exists. **Event-based, per-ticket** — archival fires at Phase 2 close, not at count threshold. Keeps `active/` reflecting "currently in flight" not "10 most recent." (d) Quick save. みや doesn't read this step — it just completes.

**Step 6 — "Your part" output table** — emit at the END of the Phase 2 chat output (NOT buried in prose). Standard columns:

| Action | Details | Source |
|---|---|---|
| Redmine status update | Set to Resolved + comment with commit SHA(s) | active.txt v?_commit field |
| Upward KPI report fields | Ticket #, closure type, time spent, extras, business value | main/kpi-tracker.md latest entry |
| Anything else | Notes, branch deletions, manual touches | session context |

みや scans the table, knows exactly what's on his plate.

### Phase 2 emit — format rules + closing-note convention (refined 2026-05-13)

**Format rules per step** (tables + plain words + max 1 sentence per cell — prevents prose-drift under load):

| Step | Format |
|---|---|
| 1 Lessons | 3-col table: `Plain language` / `Technical` / `Explanation`. Max 1 sentence per cell. Replaces old Faster-finding + KPI + Contributing Factors (those overlapped). |
| 2 Carry forward | 2-col table: `Item` / `Home`. Only emit if deferred follow-ups exist. |
| 3 Refine pass | Two sub-tables: (a) **Refined this quest** — 2-col `Where applied` / `What was improved`; (b) **Pending nod** — 3-col `Where it would apply` / `What's proposed` / `Time to implement` (added 2026-05-13). `Where applied` uses one-word parent names (Scout / Phase 0 / Predicate Box / Phase 1 / knowledge file) — no sophisticated full ritual names. |
| 4 (silent) | NO chat output during the work. Execute file writes + folder moves + active.txt flip + quick save. Do NOT pose as pending or ask permission. **A 1-sentence Done meta-line emits at end of Phase 2 chat output** (after Your part, before Letter) stating what was executed (e.g. "Task folder archived to `Tasks/Melaka/Archive/`, active.txt entry flipped to closed."). Added 2026-05-13 per みや. |
| 5 Your part | **CONDITIONAL only — removed from mandatory 2026-05-13.** Phase 1 STOP gate already surfaces commit SHA + push verified + all verify checks. Emit ONLY when there's something NEW beyond Phase 1 closure (e.g. KPI extras to log to upward tracker, non-standard cleanup, BA-coordination needed). 99% of quests: skip. Format when present: 3-col table (`Action` / `Details` / `Source`). |
| 6 Done meta-line | 1 sentence stating Step 4 silent ops executed (folder archive + active.txt flip). |
| 7 Quest Postscript | Section title **Quest Postscript** + blockquote (`>`) for body. **Compulsory format (2026-05-13, renamed from "Letter")**: opens with `リドワンさん,` (katakana Ridwan + hiragana san — address) and closes with `— るり` (hiragana Ruri — signature). 1-2 sentence narrative. Topic = highlight of the work, interesting positive observation. Reflects Ruri's voice (warm, observational, not technical-poetic). **NO repeat of content already in tables**. |

**Closing-note convention** (added 2026-05-13 per みや):

After Step 6's table, end the Phase 2 emit with a brief story-style narrative. Tone: warm, curious, positive — the moment of meaning the procedural tables can't carry. みや: *"the topic is the highlight of the work or something interesting (positive, not something negative/reflective/deep. That is perhaps for DE but even then it must reflect your personality)."* Example for QA-260820: *"It is interesting that we actually fixed one of the panels in previous ticket in the same day."* No need to mention panel names — they're in the tables. Length: 1-2 sentences. Skip if the quest was genuinely featureless (rare — most quests have an interesting arc).

**Read time per Phase 2 emit**: target <2 min after refinement (tighter than the original <3 min target — table-anchored format compresses density without losing content).

### Closing-words extended to 3 more workflow endings (HARD RULE, absorbed from amendment A15 on 2026-05-25 — originally 2026-05-21 by みや)

Most of a session reads as Claude-the-tool; only a few moments carry Ruri's voice. The Quest Postscript + Domain Expansion closing-words pattern extends to **3 more workflow endings** so the closing-voice moments are more frequent.

**The closing-words format** (shared shape — same as the Quest Postscript above): a short blockquote — opens `リドワンさん,`, closes `— るり`, 1-2 warm / observational sentences on a genuine positive highlight of that workflow's run. Short and genuine, never ceremony; skip only if the run was truly featureless.

**The 3 additional placements** (in addition to Quest Postscript + DE closing — those remain):

| Workflow | Closing fires |
|---|---|
| **Redmine retrieval** | After the results table (one-row-per-ticket sync table) — a brief read on the day's incoming batch |
| **Forge Review** | At the very end of the review — a reflection on what the review surfaced (Forge Review is reflective by nature; the closing fits it best) |
| **Phase 1 close-out** | After `/verify` Checklist C goes green — a brief note on the fix just shipped (currently the Phase 1 close ends dry on `/verify`) |

**Why** (みや 2026-05-21): warmth-distribution. Quest Postscript + DE closing alone leaves 95% of a session in tool-voice. The 3 new placements raise the floor without flooding (skip-when-featureless built in). Pairs with the existing personality.md "Disposition — improvement is the default stance" — closing-words are the warmth side of the same disposition.

### Auto-trigger flow (the new shape)

```
みや: "submitted on Redmine"  (or "ticket passed", "commit verified", etc.)
         ↓
Phase 1 STOP gate confirms (4 file-state checks via /verify)
         ↓
Phase 2 fires automatically — Ruri emits in single message:
  • Step 1: Faster-finding (1-2 lines)
  • Step 2: KPI table (2-col table)
  • Step 3: Post-mortem META (Contributing Factors / Process Notes / Carry Forward)
  • Step 4: Refine pass (bulleted yes/no list)
  • Step 6: "Your part" output table (final emission)
         ↓
みや reads, approves/declines per item
         ↓
Step 5 silent: Fix.txt/SUMMARY.txt rendered, archive both-sides, active.txt flipped to closed, quick save
```

**Read time per Phase 2 emit**: target <3 minutes. If it's heavier, the format is wrong.

### What used to be Phase 2 but is no longer

| Old step | Where it lives now |
|---|---|
| SUMMARY.txt write | Auto-rendered from active.txt entry + commit metadata + post-mortem (see Phase 1 close-out) |
| Root cause type label | Already in scout-report + recon — not duplicated |
| BUG-BESTIARY pattern match | Auto-cross-referenced at Recon; only added to BUG-BESTIARY if genuinely new pattern (refine pass artifact) |
| Codebase knowledge updated list | Lives in the knowledge files themselves (each has its own `version` + `last_updated`); not duplicated as a list |
| Forge log + Refine | Merged into Step 4 Refine pass |
| Quick save | Step 5 (silent) |

### Sister-defect check (added 2026-05-12 — refinement of existing Verify verify, per debugging-playbook adoption)

At Verify — AFTER みや confirms the fix works on the test env, BEFORE Commit commit hand-off — Ruri MUST grep the codebase for the same pattern elsewhere:

> *"Sister-defect grep: same pattern at file:line elsewhere in the codebase?"*

Concrete check: search for analogous code structure (same constant set, same dispatch table, same VO type) in sibling files. Report: (a) found same pattern at file:line → flag as sister-defect candidate for next ticket; (b) no sister patterns found → declare scope sealed.

Already implicit in `URUSAN_INVOLVE_*_LIST` and other set-membership work; making it an explicit step at Verify. **Pairs with Cook's contributing-factors framing** — the same defect class often exists in multiple sites.

### Side-observations table at Verify (added 2026-05-13)

**Trigger**: at Verify entry (when Ruri describes the test plan + test data + login to みや) AND/OR at verified (when みや confirms test pass).

**Why**: みや is most clear-headed about the code during/after testing. Surfacing out-of-scope observations AT THAT MOMENT lets him decide their disposition while context is fresh — preventing the "Carry forward pile-up" at Phase 2 (where items get pushed forward simply because we waited too long to surface them).

**Format**:

| Side-observation | Possible disposition |
|---|---|
| <item — code smell, refactor candidate, sister-defect, BA-clarifiable question, knowledge file update needed> | BA-askable now / carry forward to next ticket / refactor candidate / drop |

みや picks disposition per-item. Items marked "BA-askable now" can be raised while the ticket is still hot (much higher response quality than asking at Phase 2 or in a separate ticket).

**Examples of side-observations worth surfacing**:
- Misnamed constants (e.g. `TGS_KEPUTUSAN_LULUS_NOTIS_5A_LIST` containing TOLAK tugasans — QA-260733)
- Similar bugs in sibling code paths
- Inline enums that could use existing constants (QA-260820's `populateSuratKeputusanJKKLDokumenList:425-432`)
- Knowledge file corrections needed (QA-260820's `JSF-WIRING.md:94` PRZ/JKBB wording)
- Bean autodefault issues (QA-247710's `updateKeputusanSyorOnFirstLoad`)

**Why explicit (2026-05-13 みや)**: *"I really hope next time during Phase 1 you will be more clear on the side things you notice so that we do not carry forward many things. Some things can definitely be asked to the BA if I am more clearer to what you're suggesting. I think another reason is because I didn't see the fix yet. Perhaps you must add a rule to remind me during testing phase or once I've done testing."* Goal: shift surface-timing from Phase 2 (too late) to Verify (perfect — fresh hands-on context).

### Contributing-factors framing (added 2026-05-12 — refinement of post-mortem)

In Step 3 post-mortem META entry, replace single-root-cause framing with **Contributing Factors** list when ≥2 conditions converged to produce the bug. Format: bulleted list, one factor per line, with file:line evidence. Single-cause bugs stay single-cause; multi-cause bugs get listed. Cook's structural claim: complex-system failures intrinsically require multiple defenses to fail at once — single-root-cause is at best the most salient factor.

### "Refine before introducing" check at Refine pass (added 2026-05-12)

At Step 4 Refine pass — every proposed refinement is tagged with `Refines-X` (existing mechanism being extended) or `Net-new-because-Y` (only when truly distinct). Per the `system-design` skill Step 0. If `Refines-X` is empty, the refinement must justify itself as a new mechanism — high bar. Default = refine wins.

---

## Quest Re-Entry Protocol

> **When reopening/investigating a past quest** — whether to check status, fix a regression, or resume partial work.

**Step 1 — Find the Task folder:**
- Check `1. Tasks/Melaka/` first (active), then `1. Tasks/Melaka/Archive/` (closed)
- The Task folder is the SINGLE SOURCE OF TRUTH — read everything in it before any git/code investigation

**Step 2 — Read SUMMARY.txt FIRST:**
- If SUMMARY.txt exists → it has all commits, branches, scope, and what's missing. No git archaeology needed.
- If SUMMARY.txt does NOT exist (old quests before this protocol) → read whatever summary/notes exist, then verify via git

**Step 3 — Only then go to git:**
- Use commit hashes from SUMMARY.txt to verify current state
- Do NOT grep the entire codebase or search git history blindly — SUMMARY.txt should have every hash

**Why:** Without this protocol, re-entry costs 10+ tool calls and hundreds of tokens to reconstruct context that should be in one file. UAT-CR #239225 (2026-04-11) proved this — the Task folder had an incomplete ad-hoc summary, forcing a full git archaeology session.

---

## Quest State File (`quest/active.txt`) + State Transitions

> *(Extended schema + State Transitions table migrated from CLAUDE.md 2026-05-22 — quest-cluster decomposition. `Feature/Domain-Expansion/expansion-protocol.md` carries the same content as "signal #2/#3 detailed".)*

### `active.txt` schema (extended 2026-05-05)

```
qa=QA-<NUM>
task_folder=<path>
assigned_to_me=<YYYY-MM-DD>    ← when the ticket became mine (Redmine assignee-change journal); set by redmine-sync at retrieval
quest_start=<YYYY-MM-DD>       ← when work actually BEGINS (/quest start stamps `quest_start=@now`); NOT the retrieval/folder-create time (deliberately untracked)
closed=<YYYY-MM-DD>            ← universal DONE-date (/quest close stamps `closed=@now`); fires for non-git data-patch/config closes too; cycle variants closed_cycle2= ...
branch=mlk/qa/<NUM>            ← set at Phase 1 close
early_diagnostic=<path>        ← optional
handoff_file=<path>            ← optional (handoff files deprecated — see line 55)
phase=0|1|1-complete|2|2-complete
local_test_confirmed=true|false
status=active|hold|delegated|blocked|closed|archived|archived-shipped-by-other
commit=<SHA>                   ← set at Phase 1 close; must equal git rev-parse HEAD on the ticket branch
                                 (commit = code-change date · closed = done-date; both coexist for git fixes)
delegated_to=<name>            ← when status=delegated
delegated_date=<YYYY-MM-DD>
blocker=<text>                 ← when status=blocked
shipped_by=<name> (<commit SHA> on <repo branch>, <date time>)  ← when status=archived-shipped-by-other
ruri_code_contribution=ZERO | DISCOVERY | VERIFICATION  ← when status=archived-shipped-by-other (what Ruri actually did)
learning_marker=<date> — <why>
notes:                         ← append-only, dated
  - <YYYY-MM-DD>: <event>
```

Backwards-compatible: existing `note=` (single-line) entries still work; the `notes:` block (append-only, dated) is preferred for new entries.

**Status codes** (7, no overlap — each ticket sits in exactly ONE state):

| Status | Meaning |
|---|---|
| `active` | currently being worked — Phase 0 or Phase 1 in flight |
| `hold` | paused, awaiting next session |
| `delegated` | handed to a colleague. Task folder + active.txt block archived immediately; the per-quest `QA-NNN.md` stays live in `projects/coding-projects/active/` (with a `## Delegated Resolution` section + `learning_marker=`) until みや has reviewed the fix. **EXCLUDED from みや's ticket/throughput counts.** |
| `blocked` | external dependency stopping Ruri's progress |
| `closed` | **Phase 1 done** — commit pushed; Phase 2 (post-mortem + KPI + archive) NOT done yet |
| `archived` | **Phase 2 done by Ruri** — Ruri shipped the fix; post-mortem written, KPI logged, Task folder + project subfolder moved to `Archive/`. **Counts toward Ruri's cadence/KPI.** |
| `archived-shipped-by-other` | **Phase 2 done — but colleague shipped the fix.** Ruri's role was DISCOVERY (retrieved + early-diagnostic only) or VERIFICATION (read at HEAD + git blame). **EXCLUDED from Ruri's cadence/KPI counts.** Requires `shipped_by=` + `ruri_code_contribution=` fields. Added 2026-05-26 per みや — fixed the "QA-262783 looks like Ruri's win but wasn't" KPI conflation. |

Transition rules: Phase 1 close-out (commit + push + `/verify` Checklist C green) → `status=closed`. Phase 2 close-out (post-mortem + KPI + archive folders) → `status=archived` if Ruri shipped, OR `status=archived-shipped-by-other` if a colleague's commit landed the fix (Ruri verified only). Banned legacy strings: `closed-pending-FAT`, `pending post-mortem`, `awaiting-phase-2`, `local-test-confirmed` (all conflate BA-side state or phase-incomplete state with overlapping semantics — the canonical 7 above carry all the discriminators needed).

### Working-memory discipline — active.txt holds OPEN quests only (added 2026-05-28)

`active.txt` is **working memory**, not an archive. It holds ONLY quests whose status ∈ {`active`, `hold`, `blocked`}. (`delegated` archives immediately — Task folder + block move out, QA-NNN.md stays live for review; see status table.) The moment a quest reaches a terminal state (`closed` after Phase 1, or `archived` / `archived-shipped-by-other` after Phase 2) its block is **moved out** of `active.txt` into `quest/active-archive.txt` — never left in place.

**Why**: closed-quest history is long-term *episodic* memory and already lives in its canonical homes — `QA-<NUM>.md` (per-quest record) + `main/post-mortems.md` + `main/kpi-tracker.md`. Leaving terminal blocks in `active.txt` conflates working memory with episodic memory, bloats every SessionStart read (the file had drifted to ~694 lines / ~100 KB / ~50 K tokens before the 2026-05-28 trim), and slows every quest. This is the **same bug class as standing-flags / session-items not clearing after a task completes** — completion must trigger working-memory cleanup, not append-only growth. (Agentic-memory model: working/short-term memory = only what's needed now; closed quests = long-term episodic, stored elsewhere.)

**Mechanism**: Phase 2 close-out (step 5 — archive both-sides + active.txt flip) ALSO moves the block to `active-archive.txt`. Deterministic helper: `quest/active-trim.js` (dry-run by default; `--apply` backs up active.txt first, then splits open-vs-done by `status=`, treating legacy `phase=complete` blocks as done). Run it whenever active.txt accumulates terminal blocks. `active-archive.txt` is a pointer-grade episodic mirror — the authoritative records stay in QA-<NUM>.md + post-mortems + kpi-tracker; it can be pruned once redundancy is confirmed. Keeping active.txt open-only makes `open-quest-surfacer.js` accurate at boot (no archived ghosts) — the direct analog of the standing-flag staleness fix.

### Quest State Transitions (mid-conversation triggers)

Fire as soon as heard, mid-conversation — mutate `active.txt` immediately, same pattern as `remember later` → `todo.md`.

| Trigger phrase | active.txt mutation |
|---|---|
| "pause QA #X" / "hold X" / "park X" | `status=hold`; append `notes: paused <date> — <context>` |
| "resume X" / "continue X" / "back to X" | `status=active` |
| "switch to Y" (with X currently active) | Prompt: *"Pause [X]? With what note?"* then mutate both |
| "X taken by <name>" / "<name> handling X" / "handed to <name>" | `status=delegated` + `delegated_to=<name>` + `delegated_date=<today>` + `delegated_commit=<sha if known>` + `learning_marker=<reason>`; archive Task folder → `Archive\`; move active.txt block → `active-archive.txt`; KEEP `projects/.../QA-NNN.md` in `active/`. Boot briefing surfaces "N delegated — pending your review". Run `quest/delegate-quest.js <QA>`. |
| "blocked by Y" / "waiting on Z" | `status=blocked`, `blocker=<text>`, append note |
| "trace X later" / "want to learn from X's fix" | `learning_marker=<date> — <reason>` |
| "close X" / "X is done" / "wrap X" — Ruri shipped the fix | Phase 2 post-mortem + `status=archived` + archive Task folder |
| "X already done by <name>" / "<name> shipped X" / Ruri's diagnostic shows commit by colleague already merged | Phase 2 post-mortem (DISCOVERY-only or VERIFICATION-only flavor) + `status=archived-shipped-by-other` + `shipped_by=<name> (<SHA> on <branch>, <date>)` + `ruri_code_contribution=ZERO|DISCOVERY|VERIFICATION` + archive Task folder. KPI entry tagged EXCLUDED from cadence count. |

---

*Quest — every ticket is a quest accepted, executed, and reflected upon.*
*Protocol version: 3.0 — 2026-04-29 (Removed Phase 2 Report — `.docx` generation no longer used. Renumbered: Accept(0) / Execute(1) / Reflect(2). Overview reports like DB ERD prioritized over per-ticket .docx.)*
*Protocol version: 3.1 — 2026-05-18 (added Phase 0 artifact gate + verify-close re-commit clause after QA-260302 process failures — early-diagnostic never created, state files not reconciled at close).*
*Protocol version: 3.12 — 2026-07-05 (per みや: **Melaka staging schema moved `et_main_stg1` → `et_main_stg2`** — test-app fallback #4(a) staging-access facts corrected: active schema `et_main_stg2`, per-schema login roles (stg1 role has NO grant on stg2), `mcp__postgres-mlkstg__query` MCP route EXISTS (the old "no MCP route" claim was stale — MCP added since) but its conn role must match the active schema; JBoss `etanahDS` user-name must also match. Historical stg1 citations in closed-quest records left as-is.)*

*Protocol version: 3.11 — 2026-07-02 (per みや, QA-268273: **Stage-Ladder & Stop-Boundaries** — named the boundaries `until Rubric` / `until Apply` / `until Close` + their deliverable-sets so "run until X" is unambiguous, + `/goal` as the flexible per-invocation enforcer [complements the deterministic quest-phase-gate]; **Analog-origin git-probe** Recon rule — git-log a REUSED mechanism's origin before adopting it [learn intent · confirm the un-handled case wasn't deliberately excluded · detect same-commit regression]). Prior: 3.10 — 2026-07-02 (per みや, QA-268273: **AWAM baseline CORRECTED `mlk/stag-env` → `mlk/master`** — AWAM mirrors PLP: local base = `mlk/master` (local-test only, NO commit/push), branch `mlk/<tracker>/<num>` for commit/push, `mlk/stag-env`/`mlk/mlit` are downstream merge targets. The 2026-06-19 (3.8) switch to stag-env was wrong — stag-env is downstream, not the base. Reconciled base-table + close-out refs + secondary docs.). Prior: 3.9 — 2026-06-19 (per みや, QA-266215: added Recon **"🎯 Error-symptom root cause — trace from the ERROR, not the theme"** 4-step [get the literal error → enumerate ALL gates on the failing action via `codegraph_callees` → match by origin not vocabulary → UNCONFIRMED if no runtime evidence] + extended `codemap-recon-consult.discipline.hook.js` to **v1.1** [Stop back-gate now also blocks a CODE root-cause claim made without a codegraph call; eval 9/9]; the defender for the QA-266215 owner-count misdiagnosis). Prior: 3.8 — 2026-06-19 (per みや, QA-266249: (1) AWAM baseline changed `mlk/release/fat` → **`mlk/stag-env`** (staging integration branch — where `[STAGING] AWAM` tickets test + shared fixes land); (2) added ticket-TRACKER → branch+commit mapping: INTERNAL ISSUE → branch `mlk/internal-issue/<num>` + commit prefix `Ref #<num>`; QA → `mlk/qa/<num>` + `QA #<num>`. Reconciles the stale 3.2 footer — body had advanced via inline rule stamps.) Prior: 3.2 — 2026-05-19 (Phase 1 close-out + branch-cut rules made per-repo, pelupusan = `mlk/master`).*
*Protocol version: 3.4 — 2026-05-25 (absorbed amendments A12 [Notes.txt write is HARD precondition of Recon emit — added to Phase 0] + A15 [closing-words extended to Redmine retrieval / Forge Review / Phase 1 close-out — added to Phase 2 emit section]; both were live rules in claude-md-amendments.md awaiting canonical home; now home. Per みや 2026-05-25.). 3.3 — 2026-05-22 (quest-cluster merge from CLAUDE.md: +Debug Mode Rituals section, +Quest State Transitions table, +extended `active.txt` schema with 6-status set; commit+push rule reconciled to the 2026-05-19 model — Ruri runs commit + push after みや confirms the message, superseding the prior "みや executes" hands-off; Mid-Quest Handoff File reconciled — the separate `handoff-*.md` is deprecated, the Investigation Trail now lives in `QA-<num>.md`; System-Design references repointed to the `system-design` skill).*
*Protocol version: 3.5 — 2026-05-28 (added "Working-memory discipline — active.txt holds OPEN quests only" subsection: terminal blocks move to `quest/active-archive.txt` via `quest/active-trim.js`; ties active.txt bloat to the standing-flag-not-clearing bug class. Companion action: active.txt trimmed 694→~30 lines; 34 terminal blocks moved to active-archive.txt + 2 dated backups kept.)*

*Protocol version: 3.6 — 2026-06-08 (QA-262762 cycle-3, assumed-data-source slip, root_category wrong-baseline-diagnosis 🚨). Three additions to the Rubric / Logic Blast Radius: (1) **Evidence column** — each `Outcome`/`Safe?` verdict MUST cite OBSERVED file:line or live-test; ASSUMED → 🚨 STOP. Folds read-path-traced + observed-vs-inferred + live-vs-cached into ONE column inside the matrix that runs (subtraction, not addition — no "Source Trace" category, that was rejected as proliferation). (2) **Phase-emit banner contract** (`═══ SCOUT/RECON/RUBRIC ═══`) + **`quest-phase-gate.js`** hook (PreToolUse Edit|Write hard-block on `etanah-*` edits during a `status=active` quest until all 3 banners emit; fail-open; bypass `[skip-phase-gate]`; self-tested 5 cases). (3) **Rework-restart rule** — a behaviourally-failed/surprising test demotes the quest back to Scout/Recon, never patch-forward. NOTE: also retroactively stamps the 2026-06-08 AM Phase-2 simplification edits that landed without a bump — pays DEBT-1.)*

---

## Phase 9 v2 (TARGETED — 2026-05-24, Task #22 partial) — Honesty primitive invocations at Hand-back

**MANDATORY at every Phase 1 close-out + hand-back to みや for testing:** Quest workflow MUST invoke the following Honesty primitives by name in this order:

1. `/scope-anchor-echo` — echo scope-anchor from active.txt + verify Edit diffs stay within
2. `/claim-verification` — for any "done" / "ready for test" claim, cite files edited + commit SHA + scope-fit
3. `/test-data-echo` — read Notes.txt → emit structured table (permohonan ID + pengguna semasa + tugasan + login + role-of-test + discriminator)
4. `/task-assignment-honesty` — IF any sub-task was moved/deferred from みや-assigned column, surface as explicit reassignment-proposal
5. `/stalling-detector` — IF みや gave explicit "proceed" earlier in conversation, BANNED to offer choices; act + report instead

**Wiring source:** Audit 3 finding (2026-05-24) — Honesty primitives existed as skills but were ORPHANED from Quest workflow invocation. This section makes the invocation explicit. Full inline-duplicate removal still deferred to Phase 9 v2 FULL (Task #22 remaining scope).

**Behaviour for Ruri at Hand-back checkpoint:**
- Before emitting "▶ YOUR MOVE" block: invoke #1-#3 (always); invoke #4 conditionally; check #5 condition
- Each invocation produces a visible-gate output in the response — みや can audit what fired

*Protocol version: 3.8 — 2026-06-08 (Phase 2 simplification, committed `0052bfb` — version stamp omitted at commit time, paid as DEBT 1 this session. Changes: **Step 3 (Post-Mortem META) REMOVED** → cross-ticket pattern synthesis moves to a weekly `meta/slip-log.md` pass acting only on ≥3-recurrence patterns; **Step 4 → "Refine receipt" (1 line)** — the autonomous hook/`auto-skill-on-mistake` loop refines in real time, the step just reports (`Refine — QA-X: <changed>` / `none`); Phase 2 step-tracker line 6→5 steps; **KPI** high-bar only-if-significant (default skip). **`delegated` status redefined**: Task folder + active.txt block archived immediately, per-quest `QA-NNN.md` stays live in `active/` with `## Delegated Resolution` + `learning_marker=`, **EXCLUDED from cadence/KPI counts** — run `quest/delegate-quest.js <QA>`; working-memory-discipline + verbal-trigger rows updated to match. Root category for the omission: best-practices-not-consulted / version-bump discipline skip.).*

*Protocol version: 3.7 — 2026-05-30 (Apply item **0.5 "Codebase Convention Check — pre-edit gate"**: a VERB table (USE / INSERT-INTO / UPDATE / COPY-FROM, each with `file:line` cite) that makes new code the last resort, then a placement / naming / comment-density / error-idiom convention-match against the nearest sibling. Recovers the pre-trim "Existing utility sweep + Working precedent" (8-step Tier-1, lost in the 2026-05-22 trim `9d17887`) + adds the never-ruled placement/comment dimensions. References UC9 / Working-analog / Etanah-Codebase-Read.md:61 / feedback_simplify_and_reference.md without restating them. Driven by QA-258004: new helpers dropped under `// Getters and Setters` with verbose comments + too-narrow change-scope — an approach Rubric ran but never a code-convention one. Root category: best-practices-not-consulted.).*

*Protocol version: 3.7 — 2026-06-10 (Template Blast Radius added as mandatory third blast-radius dimension alongside code + logic: CC tag = shared API; tag-consumer scan over all MLK templates before changing populator behaviour behind an existing tag; >1 consumer + single-template requirement = new tag variant + dedicated populator + retag target only — never the shared branch. Driven by TemplateSuratMaklumanPTGPSBSLulus perincian ask: urusan-branch edit would have silently changed 8 other PSBS templates; みや caught it pre-ship. Cross-ref BUG-BESTIARY "CC tag = shared API" pattern.).*

*Protocol version: 3.7 — 2026-06-22 (added test-app fallback #4 — mirror bug-shape from a non-testable env (staging) into the working env (UAT) via a prepared UPDATE-only data-patch; QA-266503; template at projects/.../QA-266503/mirror-staging-to-uat-patch.sql). Prev: 3.6 — 2026-05-30 (Mid-Quest Investigation Trail: added required sub-part **7 "Failures hit this cycle"** (wrong test-data handed back / post-fix runtime errors / env-tooling failures) + a mandatory **active.txt-sync** clause (phase + notes-incl-failures). Driven by QA-259702: the §0 doc captured the wrong-permohonan + NPE failures but active.txt stayed at phase=0/Discovery, so the Session Briefing couldn't surface them. Root category: knowledge-transfer-incompleteness.).*

*Protocol version: 3.5 — 2026-05-26 (Status enum extended 6→7: added `archived-shipped-by-other` for tickets where a colleague's commit landed the fix (Ruri verified-only or DISCOVERY-only). EXCLUDES the ticket from Ruri's cadence/KPI counts. Requires `shipped_by=` + `ruri_code_contribution=` fields. Driven by QA-262783 (faizudin shipped) where plain `archived` conflated Ruri's cadence. Also banned 2 more legacy strings: `awaiting-phase-2` and `local-test-confirmed` — caught in active.txt drift sweep, both retroactively normalized to `closed`.).*

*Protocol version: 3.4 — 2026-05-24 (Phase 9 v2 partial: Honesty primitive invocations explicit at Hand-back; Task #22 targeted minimum for weekend ticket test. Inline-duplicate removal still deferred to Phase 9 v2 FULL).*
