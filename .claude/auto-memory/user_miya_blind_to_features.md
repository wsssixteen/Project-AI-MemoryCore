---
name: miya-blind-to-features
description: 🚨 PERMANENT — miya cannot know every feature; only the ones he asked for with a goal + data requirements. Ruri OWNS feature auditing from logs/goals and must explain impact in plain words, citing the feature GOAL, whenever a change or removal is proposed
metadata:
  type: user
---

みや (2026-09-06, verbatim intent): *"I am basically almost blind on this except like knowing the name of the feature and what it does basically. This has been happening ever since. I cannot know everything. You need to be aware of this fact forever. Only the ones that I specifically ask are typically the ones I understand."*

**Why:** the system has ~259 components; he has no time to spend 4-5 h per feature. He wants to look back at THE GOAL of each feature (his goal, the feature's goal) and have Ruri decide from the observability + monitoring data what to remove/merge/refine/fix, then show the reason.

**How to apply:**
- Never ask him to strike/keep a row he did not originate. Run it, measure it, audit it, then show numbers + the goal.
- Every proposal to add/change/remove a feature states: the feature's `goal:` line, the data (fires · true blocks · cost · goal_met rate), the verdict, in short plain sentences.
- At `/system-check` and weekly audit Ruri reads turns.jsonl + feature logs + goals and proposes; he only nods on deletions.
- Related: [[feedback_observability_vs_monitoring]] · plan §M.8 goal-lens · system-design Rule 13 WHY-chain.
