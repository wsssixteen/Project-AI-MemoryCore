---
name: Inventory-first — take stock before acting
description: Before creating/analyzing/proposing on any system component, inventory what already exists. Merge > proliferate. Read > assume.
type: feedback
originSessionId: 5ce2ed82-c59b-45ab-9387-9a2599e90792
---
**Rule**: Before any action on the system — creating a file, proposing a rule, analyzing a problem, designing a framework, writing SQL against a real schema — inventory what already exists in the relevant location. Merge-on-create is one application; check-before-analyze is the other. Both reduce to: *take stock before acting*.

**Why:** リドワンさん flagged this after three failures in one session on 2026-04-15:
1. I proposed `FLOWABLE-BESTIARY.md` parallel to `BUG-BESTIARY.md` when a `Layer:` field would merge them cleanly.
2. I was about to create `DATABASE.md` + `FLOWABLES.md` in `etanah-knowledge/melaka/` when files of that name already existed.
3. I fabricated `umm_a_pemohon` SQL without ever reading the existing `DATABASE.md` that was literally designed with a *"Critical Schema Facts — Never assume otherwise"* section to prevent that class of mistake.

All three failures share one root: **acting before inventorying**.

**How to apply:**
- **Before creating a file**: Glob the target folder. If an existing file's scope overlaps, extend it instead of creating a sibling.
- **Before analyzing a cross-layer bug**: Phase 0 MUST `Glob` + `Read` relevant files in `etanah-knowledge/<state>/`. Not optional. Not "if it seems relevant." Default on.
- **Before writing SQL against a real schema**: grep the target `.sql` dump for the table name. Never rely on pattern-symmetry from another bestiary entry ("saw `umm_a_rizab`, assumed `umm_a_pemohon`").
- **Before proposing a rule or framework**: check `CLAUDE.md`, `feedback_*.md`, `forge-log.md`, existing protocols for overlap. Merge > proliferate.
- **Before introducing a new categorical structure** (bestiary, index, registry, etc.): ask whether an existing structure can absorb the new content with a field or tag (e.g. `Layer:` field instead of a parallel bestiary).
- **Applies to this rule itself**: when tempted to create a new feedback memory, first check if an existing one can absorb it. I expanded `feedback_merge_first_thinking` into this file rather than creating a separate `feedback_check_system_first.md` — because merge-first and check-first reduce to the same principle.
