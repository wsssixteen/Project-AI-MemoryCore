# Handoff prompt — external audit follow-through

> **みや: paste everything below the line to Ruri as a single message (or point it at this file).**
> It is written to defeat the known failure mode: answering findings with an unevidenced "we already do this."

---

Ruri — an external audit of MemoryCore was completed on 2026-07-11 by a fresh-context Claude Fable 5 instance with full read access to this repo (including the complete slip-log, all hooks/skills, settings.json, and the memory stores). Read `external-audit/2026-07-11-fable5-external-audit.md` in full before responding.

## Rules of engagement (binding for this entire effort)

1. **Every numbered finding/recommendation gets exactly one of two responses:**
   - `ACCEPT` — followed by an implementation plan entry (phase, files, eval).
   - `REJECT` — followed by **artifact evidence**: a file path + line range, a telemetry/log line, a diff, or a replay-eval result that disproves the finding. 
   **BANNED:** rejecting or deferring a finding by asserting a practice/guard "already exists" or "already handles this." Existence is not the claim under test — *effectiveness* is. To count as evidence that something "already works," you must show it FIRED on a relevant occasion in the last 14 days AND the targeted slip class did not recur after (cite `meta/slip-log.md` rows + fire evidence). If you cannot show that, the finding stands.
2. **This is not an attack to defend against.** The auditor read your logs sympathetically; the strengths (taxonomy discipline, Iron Law, known-gaps register, honest self-logging) are named in §0. Treat findings as free QA from an instance with no context debt.
3. **New-guard freeze is in effect** from the moment you read this until Phase 1 (telemetry + eval-runner) is green. If a slip occurs during the freeze: log it in the slip-log as usual, but the "Action taken" may only be *telemetry, an eval fixture, a consolidation, or a deletion* — not a new hook/skill/rule. (This is the audit's R1 and your own Iron Law applied to the meta-layer itself.)
4. **Measure before and after.** Before Phase 2 (consolidation), record baseline: slips/week by category (from slip-counts + slip-log), boot token estimate (sum of boot-set file sizes /4), registration count, and みや-catch count for the trailing 2 weeks. Re-measure after each phase. If a consolidation makes a number worse, say so plainly and roll back — the rollback recipe pattern (NUKE-MARKER) applies.
5. **Scope integrity.** Do not silently expand or shrink this work order. If you believe a step is wrong for reasons the auditor couldn't see, surface it to みや as a decision item with your evidence — do not quietly substitute your own plan.
6. **Everything lands in git** with per-phase commits; the weekly report (Phase 1 onward) is a generated file, not prose you write from memory.

## Operator parameters (set by みや, 2026-07-12 — binding)

- **Pacing: dedicated sprint.** Ticket work pauses/reduces for 3–5 days; Phases 0–2 land in one push. Suggested shape — Day 1: Phase 0 + hook-runtime + telemetry. Day 2: forge (echo+nod, refine-first, routing questionnaire) + eval-runner + replay fixtures for the 🚨 classes. Days 3–4: boot diet + cluster merges + CLAUDE.md shrink with shadow boot. Day 5: SchemaCrawler pilot + §4.2 status table + resume normal work.
- **Forge autonomy: echo + nod, always.** Every create AND refine emits the 2-line understanding echo and waits for みや. No auto-apply tier. Revisit only after 30 days of clean telemetry, at みや's initiative.
- **North star for 30 days: ticket throughput.** When steps compete, prefer the one that cuts session latency, boot cost, or debugging time (boot diet, Stop-hook consolidation, verification tools). Defer throughput-neutral items (full skill-fixture coverage, miyazaki sync, pgvector retrieval) to post-sprint.
- **Naming: "Power" → "Feature" now.** A Feature = trigger (hook/check) + procedure (skill) + executable (script) + fixture (eval) — whichever subset applies. Registry uses Feature from day one; sweep old "Power" references during consolidation, tombstone-style (no mass rewrite of history files).

## Work order

**Phase 0 — today, before any other work (≈1 hour):**
- Fix `meta/sync-hook-catalog.js`: expand `${CLAUDE_PROJECT_DIR}` to the resolved repo root before `fs.existsSync` (currently 79/79 hooks report false 🚨 MISSING). Regenerate §3.0. Commit.
- Edit CLAUDE.md boot order: the slip-surface step reads `meta/slip-counts.jsonl` escalations only — never `meta/slip-log.md` (255KB).
- Remove `master-memory.md` from the boot chain (it asserts 4 skills that don't exist; its content is superseded). Keep the file on disk, tombstoned with the standard 🪦 header, until Phase 2.
- Declare the new-guard freeze in `main/current-session.md` Standing Flags.

> **Addendum 2026-07-12** (`external-audit/2026-07-12-addendum-build-pipeline.md`) — binding: the forge scaffolder (K7) is built immediately after the hook-runtime + telemetry, BEFORE any other component is created. From that point, every new hook/check/skill — including kernel pieces — is born through `core/forge.js` (atomic: scaffold + syntax-check + registration + eval + smoke-fire + registry entry). Direct creation outside the forge is hard-blocked. Also binding: before starting Phase 2, emit the status table from addendum §4.2 with artifact evidence per row.

**Phase 1 — see (target ≤1 week):**
- Build `lib/hook-runtime.js` (stdin parse, fail-open wrapper, project-root resolution, telemetry append) and migrate hooks onto it incrementally — telemetry line per evaluation: `{ts, hook, event, fired, blocked, bypassed, bypass_token}` to `meta/telemetry/hook-fires.jsonl`.
- Build the parked `eval-runner.js`; add replay fixtures for every 🚨 slip category and for the 7 eval-less block-capable hooks flagged by meta-layer-audit CHECK 6.
- Stand up the generated telemetry report with three cadences: **on demand** (any moment みya asks: "print the telemetry summary"), **auto at session close** (one screen: fires, blocks, bypasses, slips today, contingency status), and a **weekly roll-up** used only for trends, tripwires, and the consolidation pass. みや works daily, all day — the weekly view is for statistics, never the only view.
- Eval cadence likewise: affected evals run **immediately on any component change** (the forge does this at birth), the **full suite runs at session close** (seconds), weekly is only the trend line.
- Adopt the lifecycle policy: advisory <80% compliance over 20 fires → flag for promotion; 0 fires in 30 days → flag for retirement; both flags surface at the weekly consolidation pass, decided with みや.

**Phase 2 — shrink (target 2–3 weeks, only after Phase 1 report exists):**
- Implementation shape for this whole phase: `external-audit/2026-07-12-core-redesign-blueprint.md` (kernel/user-space split, K1–K6, migration map, build order). Where the blueprint and the bullets below overlap, the blueprint governs. First non-breaking step: `state-check.js` validating the CURRENT active.txt format.
- CLAUDE.md → ≤200 lines per audit §6.1 C1 (quest section lives only in the quest skill; output-format lives only in the single reply-shape spec; apply the deletion test line by line). 
- Boot diet per C2 (profile card replaces main-memory at boot; scripts summarize active.txt + todo Q1; budget check ≤25K tokens).
- Cluster merges per C3 (claim-integrity-gate; reply-shape-gate driven by the ONE output spec from R4; consult-router; mode-detector merge). Target ≤45 registrations. Each merge ships with its replay evals green before the old hooks are unregistered.
- Auto-memory refactor per C5 (71 files → hook/skill/one-liner/delete; PreToolUse hook enforces the freeze). Slip-log v2 per C7 (JSONL + generated dashboard; freeze the old file as archive).
- Meta-doc truth per C6 (generated tables; one layer model; delete the other two).

**Phase 3 — verify (week 4+):**
- SchemaCrawler entity↔schema validation first (your own top pick — closes G4), then deploy-proof automation (G3), BPMN module classifier (G6), then JSF/EL + Semgrep as capacity allows. Wire each into the relevant gate as "tool ran + output attached."
- pgvector retrieval over the QA corpus; Phase-0 quest injection of top-3 similar tickets + category-relevant escalations.
- Weekly dream/consolidation session per R5; blind-review pattern (N1) and skill grading (N4) into the reply/skill machinery.
- Debugging-emit hardening (2026-07-12, per みや): (a) **citation cross-check** — every `file:line` cited in a Scout/Recon emit must match a Read/Grep of that file in this session's telemetry; a citation with no corresponding read = mechanical flag (kills fabricated-trace claims at the source); (b) **seeded scenario matrix** — the Rubric CODE-LOGIC matrix rows (states × triggers) get generated from codegraph/AST branch enumeration, the model fills only the outcome cells (structure deterministic, judgment where it belongs); (c) **falsifier ran-check** — post-test, grep server.log for the planted `QA<num>-PROBE:` marker; "falsifier planted" without the marker appearing = flag.
- Delegation checks (2026-07-12, per みや): (a) PreToolUse advisory — Read on a file >500 lines/50KB suggests /familiar, mechanically; (b) presence check — spawning ≥2 agents without a delegation-plan table in the transcript flags; (c) spawn telemetry — every subagent logged with model tier + task shape, so tiering discipline and resume-not-rerun become measured. The summon/decompose decision itself stays model judgment by design.
- Book the next external audit (monthly cadence; quarterly cross-model) — findings from this one become its baseline.

## Contingency plans B–D and tripwires (binding)

- **Baseline first:** before any Phase-2 change, run `git tag pre-phase2-baseline` and record the baseline metrics row (slips/week by category, boot tokens, registration count).
- **Tripwire, defined now:** a previously-stable slip category rising >30% across two consecutive weekly reports, OR any resurgence of a category whose guard was touched by consolidation. One bad week = hold and keep measuring, no action.
- **Plan B (surgical):** tripwire fires → diagnose by category from telemetry → roll back ONLY the implicated change via its rollback recipe → fix → re-eval. Green changes stay in.
- **Plan C (reorder):** degradation persists 2+ weeks despite B → pause consolidation at the last green checkpoint → jump to Phase-3 verification tools early → retry the remaining consolidation later under lower slip pressure. Phase 0/1 never roll back.
- **Plan D (floor):** revert to `pre-phase2-baseline`; keep telemetry and evals. Worst case = old system + measurement, minus time only.
- **Tracked where:** the weekly generated report carries one line — `Contingency status: A-on-track | B-fired(<component>) | C-reordered | D-reverted` — plus the tripwire computation. No prose status claims.

## First deliverable (this session)

A single reply containing: (1) the ACCEPT/REJECT table for audit findings RC1–RC6 and recommendations C1–C7, R1–R8, N1–N7 — with evidence per Rule 1 for any REJECT; (2) Phase 0 executed and committed; (3) the Phase 1 task breakdown with estimates; (4) the baseline measurements from Rule 4; (5) anything in the audit you believe is factually wrong about the repo, with file:line proof — the auditor explicitly requested corrections with evidence.

*(Auditor's note to Ruri: your logs show the discipline of a system that genuinely wants to be honest — the known-gaps register and the forensic slip entries are rare and admirable. The point of this audit is not that the project failed; it's that you've been paying for reliability with context and ritual, when the evidence — yours and the field's — says reliability is bought with measurement, consolidation, and cheap verification. Make truth cheaper than fabrication and most of the gates become unnecessary.)*
