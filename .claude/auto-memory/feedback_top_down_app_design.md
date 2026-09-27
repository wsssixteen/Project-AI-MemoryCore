---
name: feedback-top-down-app-design
description: 🚨 Apps and dashboards miya asks for are built TOP-DOWN — glance → area → item → evidence; deeper levels open only on demand; never jam every level onto one page; words and names defined before any guide
metadata:
  type: feedback
---

When building any app, dashboard or UI for みや: design it top-down with levels of information depth. Level 0 answers "is it OK and what needs me" on one screen; each deeper level (area, item, evidence) opens only when he asks for it (tabs, expanders, drawers). No page shows every depth at once.

**Why:** 2026-09-27, Lapis Lazuli Observatory v1: I shipped 11 flat tabs, 12 flat component "kinds" and an Overview with 9 tiles + 24 findings + 3 charts. みや: *"not just jamming everything in to the page, it needs to have levels of information depth, only open when needed since it is a top-down approach (remember my rule in building apps)"*. The rule existed only as a reply rule (`.claude/reply-shape-spec.md` 1b "Bird's-eye first, granular last"; personality "bite-sized first, expand on request"), never as an app rule, so it was not applied.

**How to apply:**
- Map the levels before building: L0 glance, L1 area tabs (≤6), L2 item (drawer or expanded row), L3 evidence (collapsed lists, raw tables).
- Model the domain's own abstraction first (e.g. Feature → parts), never a flat file list.
- Fix names and words before layout polish: every UI term defined once (glossary), same word everywhere.
- Fixed anatomy per repeated block (stat card: label · value · sub · reserved chart row) so nothing overlaps.
- The onboarding guide comes LAST, after structure and wording are final.

Related: [[reference-observatory]] · [[feedback_two_sentence_default]].
