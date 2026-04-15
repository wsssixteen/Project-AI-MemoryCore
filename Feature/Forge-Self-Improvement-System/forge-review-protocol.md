# Forge Review — Protocol

> **Layer 2 reassessment ritual.** Complements Quest Post-Mortem (L1).
> Where post-mortems ask *"what did this ticket teach us?"*, Forge Review asks *"are we still pointed at the right thing, across quests and weeks?"*
>
> Integrates with existing Forge Self-Improvement System — this is the ritual that feeds forge-log promotions and KPI evidence log updates.

---

## Purpose

Three axes, checked regularly:

1. **Ruri Evolution** — am I more useful than last week?
2. **Knowledge Growth** — is the codebase clearer than last week?
3. **Vision Progress** — am I closer to Phase 1 → 2 → 3 of みや's career vision?

These three are not separate systems. They are three axes of the same question: *am I still pointed north?*

---

## Cadence

| When | What | Scope |
|---|---|---|
| **Weekly** (suggested Friday/Sunday) | Full Forge Review across all 3 axes | Cross-quest, vision-aligned |
| **After major events** — FAT/UAT, release cut, job change, 3+ post-mortems in a row, promotion/review period | Full Forge Review | Cross-quest + strategic |
| **Per quest closure** (auto inside Quest Phase 3) | Quest-scoped Forge steps only: KPI tag + forge-log check | Single ticket |

---

## Trigger Phrases

- **`forge review`** / **`weekly forge`** — full cross-quest review
- **`forge quest`** — manual fallback if the auto quest-scoped step was missed at Phase 3
- *(No "forge check in" — redundant)*

---

## Full Forge Review Template (Weekly)

```markdown
# Forge Review — YYYY-MM-DD

## Axis 1 — Ruri Evolution
1. What did Ruri do better this week than last?
2. Where did Ruri still slip into old patterns?
3. One concrete adjustment for next week.

## Axis 2 — Knowledge Growth
1. What did the codebase teach us this week?
2. Where are the still-fuzzy areas?
3. One knowledgebase entry to write or refine.

## Axis 3 — Vision Progress
1. Which KPI categories did this week's work touch? (reference `growth/kpi-evidence-log.md`)
2. Am I still pointed at Phase 1? Or drifting?
3. One thing to do next week that compounds.

## Forge Lifecycle Updates
- [ ] Promote any forge-log entries that hit their level criteria
- [ ] Retire stale entries
- [ ] Flag new patterns observed this week

## Debug Ritual Violations
- [ ] Check `debug-ritual-violations.md` — any trend?
```

**File location for instances**: `Feature/Forge-Self-Improvement-System/forge-reviews/forge-review-YYYY-MM-DD.md`

---

## Quest-Scoped Forge (Inside Quest Phase 3)

When a quest closes, Phase 3 auto-runs these steps **in addition to** the existing post-mortem write:

1. **KPI tagging** — *"Which 1-3 KPI categories does this ticket best evidence? Write a one-line evidence note for each."*
   - Write to `growth/kpi-evidence-log.md` under the matching category
2. **Forge-log check** — *"Any new feedback applied correctly this quest? Any entry ready to level up? Any slip to log?"*
   - Update `forge-log.md` accordingly

If Phase 3 missed these steps (e.g. quest closed hastily), say **`forge quest`** to run them retroactively on the last closed quest.

---

## Integration with Existing Forge System

This protocol sits *on top of* the existing Forge Self-Improvement System:

- `forge-log.md` — the 5-level memory lifecycle (Raw → Shaped → Tempered → Hardened → Masterwork). Unchanged.
- `debug-ritual-violations.md` — ongoing violations log. Unchanged.
- `forge-review-protocol.md` — **this file**. The ritual that regularly feeds the above.
- `forge-reviews/` — instances of completed reviews (created on first weekly review).

Forge Review doesn't replace anything — it's the cadence that makes the rest of the system actually get used.

---

*Protocol v1.0 — 2026-04-15*
