---
name: multi-dim-evidence
description: Read BA-provided screenshots / PDFs / annotated drawings across ALL dimensions (text annotations + spatial position + color/highlight + hierarchical structure), never just one. Use whenever BA shares visual evidence. Triggers — "read the screenshot fully", "multi-dim", "every dimension of evidence", "spatial layout", "check annotations spatially", "what's in the BA screenshot", "BA evidence has multiple dimensions". Hoisted from personality.md Communication: DO (added 2026-05-14 after QA-260302 column-placement slip) 2026-05-23 (Phase 3) as an atomic primitive.
metadata:
  type: discipline-primitive
  sub-layer: discipline
  meta-layer-INDEX: meta/discipline-INDEX.md
---

# multi-dim-evidence — Multi-dimensional BA visual reading

## When this fires

- Any time BA shares a screenshot / PDF / annotated image / drawing
- Phase 0 PDF extraction in Quest workflow
- When BA's text annotation seems to conflict with the spatial position of the red-box/arrow

## Steps

1. **Enumerate dimensions present**:
   - Text annotations (what BA wrote)
   - Spatial position (where the red-box / arrow / circle is drawn)
   - Color / highlight (what's marked vs unmarked; legend colors if any)
   - Hierarchical structure (left-nav, breadcrumb, page title, parent panel)
2. **State each dimension separately** — one line per dimension in early-diagnostic
3. **Flag disagreements** — if text annotation says "between X and Y" but spatial position is INSIDE X, surface as BA-Q rather than projecting one interpretation

## Output format (in early-diagnostic / Recon)

```
═══ MULTI-DIM EVIDENCE READ ═══
Text annotation:   <what BA wrote, verbatim>
Spatial position:  <where the markup is drawn, in concrete terms>
Color / highlight: <colors used, what they mark>
Hierarchical:      <page title / left-nav / breadcrumb context>
Disagreements?:    <none | text-vs-spatial: X | etc.>
══════════════════════════════════
```

## Failure modes this catches

- "Single-dimension projection" — read text annotation only, infer spatial; or read spatial only, ignore text. Both lead to wrong-scope fixes
- "Confident interpretation without disagreement check" — when text + spatial disagree, projecting one without flagging
- "Missing hierarchical context" — fixing the right component on the wrong page (QA-260302 row, table cell vs column slip)

## Source slip (QA-260302, 2026-05-14)

BA drew the dropdown INSIDE the "Kadar Nilaian smp/sehektar(RM)" column space (no column divider before it). Ruri read the text annotation "Tambahan medan dropdown list antara Kadar Nilaian dan Nilaian Pasaran" as LOGICAL position ("between two columns") → built a new column. BA's drawing meant SPATIAL position ("inside Kadar Nilaian's column, after the input"). One dimension read, others projected → wrong-scope fix.

## Cross-references

- `meta/discipline-INDEX.md`
- `personality.md` Communication: DO (2026-05-14 entry — original prose rule)
- `meta/principles.md` — Multi-dimensional-evidence principle
- `annotations` skill — pairs with this; annotations skill extracts PDF Annot data, multi-dim-evidence interprets it across dimensions

---

*Atomic primitive skill. Built Phase 3 (2026-05-23). Originally personality.md prose rule; promoted to standalone primitive.*
