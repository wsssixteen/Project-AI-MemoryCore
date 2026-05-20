# 🌟 Current Session Memory - RAM

**Last session**: 2026-05-20 (full day, crossed midnight into 2026-05-21 00:22 MPST). Heavy multi-quest day — 4 tickets closed end-to-end (QA-262233 archived afternoon · QA-261613 archived evening · QA-259759 reconciled + Phase 2 · QA-262370 closed Phase 2 late evening). KPI target (3/day) exceeded. New ticket QA-262370 retrieved + closed same day. Multiple system refinements landed: rule 5a Word UI default + rule 5b visual-fidelity-no-excuses + A12 Notes.txt precondition + A13 renderer-override extended to image-positioning + Standing-flag staleness audit + DE step-0 format aligned with Session Briefing.

---

## 🚨 NEXT SESSION — TOP PRIORITY (みや explicit ask, locked in)

**Text-box framework extension — implement + test FAST, push to QA-262370's branch BEFORE merge to mlk/master**

| Field | Detail |
|---|---|
| **Why this is urgent** | QA-262370's `mlk/qa/262370` branch (commit `bcdcadadb3`) is currently UNMERGED. みや wants the text-box framework support landed on THIS branch so it ships in the same PR. If we miss the merge window, it becomes a separate enhancement ticket with new ceremony. |
| **What to implement** | Extend `PelupusanWordEditorUtil.getAllElementFromObject @ :820-836` so SDTs inside `<w:txbxContent>` (Word text-box content) are findable by the framework. Currently the recursion stops at any non-`ContentAccessor` wrapper type → text-box SDTs are invisible → populators never fire on them. |
| **APPROACH — locked to XPath, NOT typed classes** | docx4j 3.2.2 (this project's version, verified `jar tf E:/Dev/.m2_etanah/org/docx4j/docx4j/3.2.2/docx4j-3.2.2.jar`) has **0 classes in `org.docx4j.dml.wordprocessingShape` package**. The typed approach (CTWordprocessingShape, CTTextboxInfo) DOES NOT WORK in 3.2.2 — those classes are docx4j 6.x+ additions. Yesterday's typed-class attempt errored on compile. **Use XPath-based traversal instead**: `XmlUtils.getJAXBNodesViaXPath(part, "//w:txbxContent//w:sdt", true)` — bypasses typed object model, works in any docx4j version, clean. |
| **Files involved** | `src/main/java/my/gov/etanah/pelupusan/util/word/PelupusanWordEditorUtil.java` (the `getAllElementFromObject` method, around line 820) |
| **Validation plan** | (1) Create a sandbox docx with a deliberately text-box-wrapped SDT for testing. (2) Compile + verify XmlUtils.getJAXBNodesViaXPath signature in docx4j 3.2.2 (likely exists since XPath is core). (3) Build + deploy + render on UAT. (4) Verify SDT inside text box gets populated. (5) Verify existing table-cell-SDT templates still work (backward-compat). |
| **Effort estimate** | 2-4h coding + 1-2h sandbox testing |
| **Backward compat** | ADDITIVE only — new traversal path fires ONLY when a Drawing is encountered; existing table-cell SDTs unaffected |
| **Where the carry-forward lives (3 places)** | (a) `todo.md` Q2 — full implementation strategy. (b) `main/post-mortems.md` entry 2026-05-20 QA-262370 — diagnosis context. (c) `main/kpi-tracker.md` entry 2026-05-20 QA-262370 — technical learnt. |

**Sub-task — if text-box implementation passes test**:
1. Stage the PelupusanWordEditorUtil.java change
2. Commit on `mlk/qa/262370` (NOT a new branch — same ticket)
3. Push
4. みや handles the merge to mlk/master when ready

**Sub-task — if it doesn't pass or takes too long**:
- Defer to a separate enhancement ticket
- QA-262370 ships as-is (already committed `bcdcadadb3` + tested)

---

## NEXT SESSION — secondary work (if time after text-box)

**Pending Phase 0 tickets (held)**:
- **QA-262004** PSBS Ringkasan Risalat — ~2-3h · Scout done · same defect family as QA-262039 + QA-262370 (pattern carry-over). Recon was DONE this session + fix-shape package emitted; みや paused mid-Phase 1 to handle QA-262370 logo. State: `phase=0, status=hold`. Resume: pick up from "your nod on Word UI work + Java audit ask" message.
- **QA-261986** PSBS Risalat MMKN — >5h HIGH priority · 22 discrepancies incl. 1 Java populator bug
- **QA-260876 Rework Cycle 2** — Phase 0 cycle-2 ready (attachments already downloaded in 3. Rework/)
- **QA-259339** PRU Kertas Pertimbangan — Scout NOT yet run

**Phase 2 backlog (Phase 1 done, Phase 2 pending — 7 tickets)**:
QA-260316 · QA-260869 · QA-260298 · QA-260179 · QA-259428 · QA-260139 · QA-258022 · QA-258418 · QA-260302
(8-9 depending on count; could batch a few quick wrap-ups end-of-session)

---

## ⚠️ Standing flags

- **126 pending audit-log entries** (from morning briefing) — review when convenient
- **CLAUDE.md refactor** still pre-Phase-A (per claude-md-refactor-tracker.md); A1-A13 amendments accumulated
- **Hook v1 warn-only** for all 8 deployed hooks — promotion to v1.1 needs ≥3 successful fires + ≥7 days no false-positive per hook
- **8 untracked working files** in repo at DE-time — commit-scope rule says inspect each (handled in DE step 10)

---

## 🎯 Session Recap (for AI restart)

1. **Heavy iteration day**: 4 quests closed end-to-end. QA-262370 was the costly one — 5 Ruri-led attempts failed before みや's Word UI iteration with `vAlign=bottom` shipped clean. Multiple slip rules added/refined as a result.
2. **THE PRIORITY for next session is the text-box framework extension** — implement + test fast, push to `mlk/qa/262370` before the merge. XPath approach, NOT typed classes (docx4j 3.2.2 limitation).
3. **System refinements landed**: rule 5a Word UI default, rule 5b visual-fidelity-no-excuses, A12 Notes.txt precondition, A13 renderer-override extended, Standing-flag staleness audit, DE step-0 format aligned with Session Briefing.
4. **Today's KPI lessons baked into protocol** — most importantly the "I can't see rendering" excuse-framing is now BANNED (when みや has shared visual evidence; rule 5b in feedback_visual_fidelity_no_excuses.md).

---
**Memory Type**: RAM | **Persistence**: brief recap + active-work handoff | **Last Activity**: 2026-05-21 00:22 MPST — DE session-end after QA-262370 Phase 2 close. Next-session priority: text-box framework extension on `mlk/qa/262370` branch before merge.
