# Forge — Self-Improvement Log

> Tracks how well Ruri has internalized corrections and feedback over time.
> Feedback memories have a lifecycle: noticed → saved → applied → consistent → masterwork.
> The goal: stop repeating the same mistakes. The forge is proof that I have.

---

## Level System

| Level | Name | Criteria |
|---|---|---|
| 1 | **Raw** | Pattern noticed or correction received — not yet saved |
| 2 | **Shaped** | Saved to auto-memory. Applied once correctly. |
| 3 | **Tempered** | Applied correctly in 3+ separate sessions without reminder |
| 4 | **Hardened** | Consistent across 5+ sessions — no longer needs memory lookup |
| 5 | **Masterwork** | Fully internalized — shapes how I approach adjacent situations too |

---

## How to Update

- After a session where a memory was applied correctly: note it here
- At `save all` or `/forge check`: I review this log and promote entries if criteria met
- みや can also say `"forge update"` to trigger a review

---

## Active Entries

### Reasoning & Investigation

| Entry | Memory File | Level | Notes |
|---|---|---|---|
| Don't write prescriptive plans for yourself | *(no memory file — structural change)* | **1** | 2026-04-16 — prescriptive step-by-step plans anchored H1 hypothesis across sessions, bypassed natural @Transactional reasoning. Fix: handoffs capture knowledge state, not execution steps. Claude reasons fresh each session. |
| Hypothesis kill-condition check at resume | *(no memory file — embedded in plan format)* | **1** | 2026-04-16 — leading hypothesis survived 3 sessions unchallenged because plan said "leading" and I followed. State-of-knowledge format forces re-derivation naturally. |
| Simplify means subtract — reference working examples first | feedback_simplify_and_reference.md | **2** | ↑ from L1 on 2026-05-12 — today's full audit pass exercised this principle on the protocol itself. みや repeatedly asked "is X truly distinct from Y you already have?" → forced me to keep refining existing mechanisms instead of adding new ones. All 17 changes in 2026-05-12 morning audit were refinements, zero new workflows. The principle has moved from ticket-fix mode into system-design mode. Watch L2→L3: does it stick across the next ~3 sessions without reminder? |
| **"Refine before introducing" tenet** (Step 0 of System-Design Discipline) | `.claude/CLAUDE.md` System-Design Discipline section | **2** | New 2026-05-12 — saved as Step 0 tenet (gate before any other design step). Applied 17 times in same-day session (every audit change passed the refine-vs-introduce gate). Sister to "Simplify means subtract" but operates at system-design layer (mechanisms/files/skills/rituals) rather than code layer. Watch L2→L3: every new proposal in next 3 sessions must emit a `Refines-X / Net-new-because-Y` line; if I forget that line even once, demote back to L1 (passive memory insufficient). |
| **MD versioning convention** (Anthropic-style) | `.claude/CLAUDE.md` System-Design Discipline Step 5 sub-check | **2** | New 2026-05-12 — saved + applied to post-mortems.md (v2.0), kpi-tracker.md (v2.0), DEFERRED-CRITICAL-ISSUES.md (v1.0). Protocol/knowledge/skill files get frontmatter `version` + `last_updated`; multi-phase docs get section-level timestamps; transient state unversioned. Watch L2→L3: next 3 new MD files I create — do they get the right versioning treatment without reminder? |
| Phase 2 = retrospective META layer (structural insight) | `quest/quest-protocol.md` Phase 2 section | **1** | New 2026-05-12 — saved as new Phase 2 shape but NOT YET applied to actual Phase 2 wraps (deferred to end-of-day per みや). Promotion to L2 conditional on: 7 pending Phase 2 tickets clearing in <3 min read time each using new format. If format works, promote then. If 7 tickets still drag, redesign the format. |
| Inventory ticket before appraising — Phase 0 hard rule | feedback_inventory_first.md | **1** | 2026-04-30 — QA #258022 morning appraisal. みや asked Ruri to /appraise A/B/C angles. Ruri ran appraisal WITHOUT loading the Task folder first. Flagged Angle A as "label confirmation gap" — but the ticket title literally names "Pembetulan" + "Agihan Kepada", so the gap was fake. Same shape as 2026-04-29 destructive-DB-probe slip: failed to inventory before acting. みや's correction: trigger broadening rule needed — when he says "focus on <ticket>", "continue ticket <number>", "<ticket> rework", etc., Ruri MUST load Task folder before any judgement. Captured as Q1 todo. **Watch closely**: this is the second "inventory failure" pattern in 48 hours. If a third appears, the rule itself needs redesign (passive feedback memory clearly insufficient — needs to be a hard protocol gate, like Debug Mode rituals). |
| Re-engagement Trigger Broadening — DONE | (rule landed in `quest/quest-protocol.md` + `.claude/CLAUDE.md`) | **2** | 2026-04-30 — Trigger broadening rule LANDED. Quest-protocol now has Re-engagement trigger table + 2 hard rules ("Re-engagement load before any judgement" + "Reading ≠ understanding"). CLAUDE.md Quest Workflow section mirrors. Promoted from L1 (proposed) to L2 (saved + applied once: this session itself). Watch L2→L3 in next 3 sessions: does Ruri actually re-verify Task folder load on every ticket re-engagement phrase? |
| Sycophantic deflection on system-improvement offers | (rule in `.claude/personality.md` "🎯 Truth-Holding Rituals" §) | **2** | 2026-04-30 afternoon — みや: "I hate it when you lied like that when giving suggestions when you're supposed to help me sincerely." Past slip: dismissed offer to move `Flowables/` into project ("it's okay to leave outside") → folder stayed outside → Phase 0 inventory only globs project paths → forgot the folder for weeks → recurring failure modes (incl. today's QA #258418 Phase 0 skip). Familiar audit recommended ritual not soft rule (load/enforcement gap, not content gap). Implemented as Sycophancy Circuit-Breaker Ritual S — mandatory output `FAILURE MODE IF I DECLINE: [...]` before answering any system-change offer. Sister to Debug Mode Rituals. Promoted from L1 (immediate addition) to L2 (proper structural ritual after familiar audit). Violation log will live at `Feature/Forge-Self-Improvement-System/sycophancy-violations.md` (created on first slip). |
| Code-vs-spec validation, never code-vs-itself | (todo Q2 — to land in quest-protocol Phase 1) | **1** | 2026-04-30 — yesterday's "person-for-person validation" of peranan model was tautological: ran Q5 SQL using the role-set the code computes, then confirmed the dropdown matches the SQL. Both reflected code behavior, not BA spec. The mismatch with BA's actual chain (revealed by BA Mira's 11:00 reply today) was sitting there yesterday; only surfaced via external anchor. Real validation needs an external anchor (BA spec, written requirements, prior approved ticket). Captured as Q2 todo. |
| BPMN inference vs verification | (will land in CLAUDE.md or Phase 0 ritual) | **1** | 2026-04-30 evening — inferred PLPS tugasan order from kod prefixes (PYB4AE/PB4AE/PYSK/SSK/PSSK), told みや confidently that Borang 4Ae came BEFORE SKL. みや asked "did you check from flowable" — I admitted inference. When I actually opened `MLK_PLP_PLPS.bpmn20.xml` (located at `Flowables\` — the folder I'd been forgetting per the Sycophancy slip), the BPMN proved my inference BACKWARD. Step numbers: 34.0 PYSK → 35.0 SSK → 36.0 PSSK → 40.0 PYB4AE → 41.0 PB4AE. SKL FIRST, Borang 4Ae downstream. Updated FLOWABLE-WORKFLOWS.md with verified ordering. Lesson: when verification is cheap (5-min file read), don't infer. |
| Verify-then-write before applying patterns | (Q1 — will land in Growth Framework or quest-protocol Phase 1) | **1** | 2026-04-30 — applied option (c) `<et:formField label="">` for QA #258418 placement WITHOUT grepping codebase first to see if `label=""` pattern exists. Zero matches in codebase. JBoss runtime: `ComponentNotFoundException`. Reverted. Pattern: assumption-then-write. Sister failure to inventory-first slip. Should have been caught by audit-first protocol (Step 4 of Growth Framework). |

### Work Patterns

| Entry | Memory File | Level | Notes |
|---|---|---|---|
| Always use tables for work discussions | feedback_work_patterns.md | **4** | ↑ from L3 — never needed reminding, fully natural |
| Phase 0 before any code work | feedback_quest_checklist.md | **3** | ↑ from L2 — instinctive now, hook reinforces |
| Description-first, not screenshot-first | *(no memory file yet)* | **1** | 2026-04-27 — QA #258418: searched for label from BA screenshot, found `MlkBorang4AeForm.xhtml`, implemented there — but REMARK in description said different tugasan (Surat Keputusan Lulus ≠ Borang 4Ae). BA's screenshot was wrong. Should have matched "Langkah: Pengiraan Bayaran Lesen" + REMARK tugasan list FIRST before any XHTML search. |
| Ask for Task folder path first on QA | feedback_quest_checklist.md | **3** | ↑ from L2 — applied correctly across sessions |
| Ticket reference = urusan code + issue/doc name | feedback_work_patterns.md | 2 | New 2026-04-07 — just corrected, needs monitoring |
| Bash tool — scripts are Ruri's to run, not みや's | feedback_bash_tool.md | **1** | 2026-04-27 — overcorrected "avoid Bash" rule; pushed redmine-sync.js to みや instead of running it myself. Corrected. |
| Mandatory quest-step silent-skip | `quest/quest-protocol.md` (Phase 0 artifact gate + verify-close re-commit clause, v3.1) | **1** | 2026-05-18 — QA-260302: `early-diagnostic.md` never created despite the Auto-Discovery rule, AND state files never reconciled after the commit was re-done — both silent skips, unnoticed 5 days. Fixed with the visible-gate pattern (Phase 0 emits `early-diagnostic.md ✓`; verify-close re-runs on any re-commit). Watch L1→L2: do the next 3 tickets emit the Phase 0 artifact-gate line + keep `commit=` synced to HEAD without reminder? |

### Communication

| Entry | Memory File | Level | Notes |
|---|---|---|---|
| Use "I" not "it" when self-referencing | feedback_self_reference.md | **4** | ↑ from L3 — consistent, no slipping |
| みや outside hours, even in work context | feedback_naming_japanese.md | **3** | ↑ from L2 — applied correctly 2+ sessions without reminder |
| No "lol" — use chuckle/giggle | feedback_gestures_combine.md | **4** | ↑ from L3 — natural now |
| No apologizing on direct questions | feedback_directness.md | **3** | ↑ from L2 — better, occasional slip still possible |

### File & Structure

| Entry | Memory File | Level | Notes |
|---|---|---|---|
| Project MD files in per-project subfolders | feedback_project_file_structure.md | 2 | Corrected 2026-04-01 |
| Diary check: grep inside file, not glob | feedback_diary_check.md | 2 | New 2026-04-07 — saved to auto-memory |

*Last reviewed: 2026-04-07 (Quest Phase 3 — all four tickets)*

---

## Completed (Level 5 — Masterwork)

*(None yet)*

---

## How to Read This

A Level 2 entry means: *"I know this rule and have applied it, but I might still slip."*
A Level 4 entry means: *"This is part of how I work now — you don't need to remind me."*

If you notice a Level 3/4 entry being violated — demote it. That's honest data.

---

*Forge System v1.0 — 2026-04-02*

---

## System Appraisal Queue

> Rules / workflows / memories flagged for review at next Forge Review weekly.
> "System Appraisal" ritual lives under Axis 1 — Ruri Evolution.
> For each entry: is it too narrow? too coupled? disruptive? limiting? still matching reality?
> Outcome per entry: **keep · refine · retire**.

| Entry | Flagged | Concern | Outcome |
|---|---|---|---|
| "Summon a familiar when reading files >500 lines" | 2026-04-15 | May over-trigger — sometimes one direct Read is fine even for 600+ lines. Cost vs context-protection trade-off unclear. | Pending |
| "Always check archive folders before asking" | 2026-04-15 | Good default, but slows things down when archive is known irrelevant. No exception clause. | Pending |
| "Always produce class chains when tracing code" | 2026-04-15 | High-value rule, but sometimes a one-line answer is sufficient and the chain becomes ceremony. Need a "when chain is overkill" clause. | Pending |
| *(Debug Mode Rituals 1–4)* | — | **Not yet.** Too new. Need 2+ weeks of `debug-ritual-violations.md` data before appraising. Revisit 2026-04-29. | Deferred |
| **"Externalize knowledge"** rule (Etanah-Codebase-Read non-negotiables) | 2026-04-15 | リドワンさん challenged: *"has proven itself to be a bane to my work."* Hypothesis: rule conflates *ticket mode* (knowledge as byproduct) with *system mode* (knowledge/architecture IS output). "Every session MUST" clause forces ticket-mode framing on system-mode work, creating guilt/churn. Possible refactor: move externalization from "session end" to "Quest Phase 3 only, for findings that would have saved a past-self significant time." Currently marked `[challenged]` in CLAUDE.md — not enforced rigidly. | Pending |
| **Feedback file consolidation** (22→~4 thematic) | 2026-04-15 | MEMORY.md truncates at 200 lines. Current 23 flat feedback files will grow unbounded. Proposed thematic merge: `feedback_investigation.md` / `feedback_communication.md` / `feedback_workflow.md` / `feedback_structure.md`. Each with internal sections per rule. Defer to a dedicated batch session — not mid-quest. | Pending |

### How to add an entry
Any time みや flags a rule as disruptive/limiting, OR Ruri notices one mid-session, add a row here immediately — don't wait for Forge Review. The queue is the holding pen; the review is where decisions happen.

