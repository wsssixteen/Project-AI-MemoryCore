# Discipline Sub-INDEX — Atomic Primitive Skills

> **Purpose:** The Discipline sub-layer addresses **25% of slips** (Evidence Discipline failures — claims without backing, baseline drift, single-pass visual confidence, best-practices-not-consulted, early-diagnostic not re-verified).
>
> **Architecture:** Per Stage 3b decision (B-refined) — each primitive is its own small atomic skill (~50-150 lines), unified by this INDEX. Workflows reference primitives by name; primitives are independently callable.
>
> **Status:** Phase 1 skeleton ✅ (this file). Phase 3 populates the actual SKILL.md files.

---

## Atomic primitive skills (to be built in Phase 3)

| Primitive | Target path | Purpose | Source / Hoist origin | Build status |
|---|---|---|---|---|
| ~~`rubric`~~ | ~~`.claude/skills/rubric/SKILL.md`~~ | ~~Structured fix-candidate evaluation~~ | ~~Hoist from Rubric checkpoint~~ | **ABSORBED 2026-05-28 → Quest Rubric phase + system-design Step 6. Stub decays 2026-06-07. See `.claude/skills/rubric/SKILL.md` for routing.** |
| `predicate-box` | `.claude/skills/predicate-box/SKILL.md` | Before Edit while debugging, emit TRUE IF / PROVED BY / FAILED WHEN structure | Hoist from `quest/quest-protocol.md` Debug Mode Ritual 1 | ⬜ Phase 3 |
| `grep-rubric` | `.claude/skills/grep-rubric/SKILL.md` | After every investigative grep, emit 3-line box: Proves / Negative / Next | NEW (currently prose-only in `improvement-audit-log.md` 2026-05-06) | ⬜ Phase 3 |
| `multi-dim-evidence` | `.claude/skills/multi-dim-evidence/SKILL.md` | Read BA screenshots/PDFs across spatial + text + color + hierarchy dimensions, not text-only | Hoist from `personality.md` Communication: DO (added 2026-05-14, QA-260302) | ⬜ Phase 3 |
| `sycophancy-circuit-breaker` | `.claude/skills/sycophancy-circuit-breaker/SKILL.md` | Before declining a system-change offer: emit FAILURE MODE box + evaluate | Hoist from `personality.md` Truth-Holding Rituals (Ritual S) | ⬜ Phase 3 |
| `confidence-table` | `.claude/skills/confidence-table/SKILL.md` | When proposing ≥2 substantive items requiring nod, emit Item / Confidence / What done / Needs nod? table | Hoist from `personality.md` Communication: DO (added 2026-05-13) | ⬜ Phase 3 |

## Trigger-phrase enumeration per primitive (refinement #4)

Each SKILL.md description MUST enumerate ≥5 natural-language variations みや uses for invoking the primitive — to maximize description-trigger reliability.

Initial trigger phrase candidates per primitive (to be refined in Phase 3):

| Primitive | Trigger phrases (initial) |
|---|---|
| `rubric` | "rubric this", "evaluate options", "pros and cons", "weigh fix candidates", "which option" |
| `predicate-box` | "predicate box", "what's the predicate", "what must be true", "state your assumption", "before any edit prove" |
| `grep-rubric` | "after grep show what it proves", "what does this grep mean", "grep rubric", "what's missing from this grep", "negative space" |
| `multi-dim-evidence` | "read the screenshot fully", "what's the spatial layout", "check the annotation", "multi-dim", "every dimension of evidence" |
| `sycophancy-circuit-breaker` | "should we do X", "do you think we need", "is it worth", "before you say no", "failure mode if we don't" |
| `confidence-table` | "what's your confidence", "rate these proposals", "which needs my nod", "confidence assessment", "before I approve" |

## How workflows reference these primitives

The Discipline primitives are callable from any workflow. Quest workflow at specific checkpoints invokes them by name (NOT duplicates the logic). Example Quest references after Phase 3:

```
quest workflow:
  PHASE 0 (Discovery) ──→ invoke /multi-dim-evidence (for BA screenshots/PDFs)
  PHASE 1 (Recon)     ──→ invoke /rubric (for fix-candidate evaluation)
                      ──→ invoke /grep-rubric (after every investigative grep)
  PHASE 1 (Apply)     ──→ invoke /predicate-box (pre-Edit gate while debugging)
  Pre-emit hand-back  ──→ invoke /confidence-table (when multiple items need nod)
```

This is the **primitives-are-callable** pattern (Stage 3b insight). Refining a primitive in `.claude/skills/<primitive>/SKILL.md` changes behavior for EVERY workflow that calls it — single source of truth.

## Cross-references

- `system/INDEX.md` — master system-layer index
- `system/principles.md` — the underlying Evidence Discipline + supporting principles (full classified list)
- Phase 3 of plan `1-this-means-you-toasty-forest.md` — build instructions
- `quest/quest-protocol.md` (to be updated Phase 3) — workflows will reference these primitives by name

---

*Sub-index for Discipline. Populated by Phase 3.*
