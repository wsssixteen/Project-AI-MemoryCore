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
| Simplify means subtract — reference working examples first | feedback_simplify_and_reference.md | **1** | 2026-04-29 — QA #258022 burned 3 days on 1-file fix. みや said "mature system, refer working urusans, simplify, scrutinize Codex" 3-4+ times across sessions. Each iteration ADDED instead of subtracted. Same feedback delivered repeatedly = strong signal lesson hasn't stuck. Process changes proposed: (1) Quest Phase 0 — add "find working analog" step before designing fix; (2) after any "simplify" feedback, response must show what was REMOVED; (3) read option_type definition before extending its included_urusan_list; (4) Codex output goes through scrutiny pass. Watch closely on next ticket — if same pattern repeats, the rule itself needs redesign, not just re-promise. |

### Work Patterns

| Entry | Memory File | Level | Notes |
|---|---|---|---|
| Always use tables for work discussions | feedback_work_patterns.md | **4** | ↑ from L3 — never needed reminding, fully natural |
| Phase 0 before any code work | feedback_quest_checklist.md | **3** | ↑ from L2 — instinctive now, hook reinforces |
| Description-first, not screenshot-first | *(no memory file yet)* | **1** | 2026-04-27 — QA #258418: searched for label from BA screenshot, found `MlkBorang4AeForm.xhtml`, implemented there — but REMARK in description said different tugasan (Surat Keputusan Lulus ≠ Borang 4Ae). BA's screenshot was wrong. Should have matched "Langkah: Pengiraan Bayaran Lesen" + REMARK tugasan list FIRST before any XHTML search. |
| Ask for Task folder path first on QA | feedback_quest_checklist.md | **3** | ↑ from L2 — applied correctly across sessions |
| Ticket reference = urusan code + issue/doc name | feedback_work_patterns.md | 2 | New 2026-04-07 — just corrected, needs monitoring |
| Bash tool — scripts are Ruri's to run, not みや's | feedback_bash_tool.md | **1** | 2026-04-27 — overcorrected "avoid Bash" rule; pushed redmine-sync.js to みや instead of running it myself. Corrected. |

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

