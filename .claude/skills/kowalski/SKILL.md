---
name: kowalski
description: Kowalski — explain the architecture we are working on as TWO ASCII story diagrams — (1) a generic CONCEPT diagram (the layer stack + one line of what each layer does), then (2) a CURRENT-WORK EXAMPLE diagram (real file/class names in the box top-border, methods/vars:line inside, zero prose; the why-between-steps rides the arrow). For orienting during debugging or development. Triggers — "kowalski", "/kowalski", "kowalski analysis", "explain the architecture", "show the architecture", "draw the stack", "architecture diagram", "show me the layers", "how does this flow", "concept then example", when getting oriented on a ticket / code area.
---

# /kowalski — architecture, in two story diagrams

*"Kowalski, analysis!"* — on demand, explain the architecture of whatever we are debugging or building as **two stacked ASCII diagrams**: the **concept** first (teaches the layers), then the **same flow on the real files** (the current work). The concept lives entirely in Diagram 1, so Diagram 2 stays skeletal and glance-able mid-debug.

## When to emit
On explicit invoke, OR when みや is orienting on a new ticket / code area and a "how does this flow" picture helps. **Always two diagrams, always in this order: CONCEPT → EXAMPLE.**

## Box format (the one true shape — do NOT deviate)
- **Title lives IN the top border**: `┌─ StatusPermohonanForm.java ─────┐` — never as a separate first line inside.
- **Contents live INSIDE the box**, one per line: `│   method():line              │`.
- **Boxes are CLOSED**: `┌─..─┐` top, `│ .. │` bodies, `└─..─┘` bottom. Never half-fragments.

## Connector format (the arrow between boxes)
Exit the bottom border at `┬`, run down a **2-3 line `│` connector**, then `▼` into the next box's top:
```
   └───────────┬───────────┘
               │
               │  short explanation of the transition (optional)
               │
               ▼
```
- The connector is **long enough to hold ONE line of explanation** of what happens between the two steps. Omit the text on trivial hops (`│` `│` `▼`); write it on meaningful ones.
- **Boxes stay zero-prose** (method:line only) — the *why / what-happens* goes on the CONNECTOR, never inside the box.
- **No arrow floats to the side. No arrow dangles after the last box** — the flow just ends at the final box.

## Diagram 1 — CONCEPT (generic, reusable)
Layer boxes, one committed top→bottom flow. **Left margin = layer tag** (`UI / BEAN / SERVICE / ENTITY / DB`). **Box body = ONE short line of what the layer DOES** — terse, dropped articles welcome. Optional dotted side-box for Flowable/BPMN.

```
 UI      ┌─ .xhtml  (PrimeFaces / JSF) ───────────────────┐
         │   renders page, sends clicks/ajax to beans     │
         └────────────────────────┬───────────────────────┘
                                  │
                                  │  submits form / ajax
                                  │
                                  ▼
 BEAN    ┌─ *Form.java  (@ViewScoped bean) ───────────────┐
         │   handles actions, holds view/nav state        │
         └────────────────────────┬───────────────────────┘
                                  │
                                  │  calls service
                                  │
                                  ▼
 SERVICE ┌─ *Service.java  (Spring @Service) ─────────────┐
         │   business logic, opens transaction            │
         └────────────────────────┬───────────────────────┘
                                  │
                                  │  reads / writes entity
                                  │
                                  ▼
 ENTITY  ┌─ *Entity.java  (Hibernate @Entity) ────────────┐
         │   maps object <-> row  @Table / @Column        │
         └────────────────────────┬───────────────────────┘
                                  │
                                  │  persists (SQL)
                                  │
                                  ▼
 DB      ┌─ postgres table ───────────────────────────────┐
         │   stores the row                               │
         └────────────────────────────────────────────────┘

 FLOW ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
 (opt)  Flowable BPMN — routes which tugasan is next
      └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## Diagram 2 — EXAMPLE (the current work)
SAME layer margins + flow, on the REAL files. **Title in the top border = real file/class name.** **Body = ONLY `method()` / `variable` with `:line`** (`:col` if useful) — **ZERO prose**. Put the transition explanation on the CONNECTOR. Mark the bug/focus box `⚠`. **End on the wrong outcome** — Diagram 2 tells the PROBLEM story; a kowalski example with no ⚠ and no wrong-outcome is a call-graph, not a story diagram.

```
 UI     ┌─ StatusPermohonanForm.java ─────────────────────┐
        │   onKemaskini():681                             │
        └────────────────────────┬────────────────────────┘
                                 │
                                 │  user clicks Kemaskini on a draft
                                 │
                                 ▼
 BEAN   ┌─ PelupusanEMohonForm.java  (: BaseAwamTabForm) ──┐
        │   initForm()  @PostConstruct                    │
        └────────────────────────┬────────────────────────┘
                                 │
                                 ▼
 BEAN   ┌─ BaseAwamTabForm.java ──────────────────────────┐
        │   initForm():173                                │
        │   initTabRendered():199                         │
        │   tabList.add(0):273                            │
        └────────────────────────┬────────────────────────┘
                                 │
                                 │  auto-advance skips every
                                 │  leading lengkap tab
                                 │
                                 ▼
 BEAN⚠  ┌─ BaseAwamTabForm.java   [BUG] ───────────────────┐
        │   :466-477                                      │
        │   select(activeIndex=2):535                     │
        └────────────────────────┬────────────────────────┘
                                 │
                                 ▼
 UI     ┌─ Maklumat Tanah  (idx2) ────────────────────────┐
        │   wrong landing — expected Maklumat Pemohon     │
        └─────────────────────────────────────────────────┘
```

*(A chain that WRITES to the DB keeps going past BEAN → SERVICE → ENTITY → DB; the final box is the `table` name, and the touched `@Column`s:line sit inside the ENTITY box above it.)*

## 🧱 FUNDAMENTALS (the spec — every render derives from HERE, never from a prior render)
> Added v1.5 after two fix-passes drifted from みや's ORIGINAL spec by patching the last broken render instead of re-deriving. When refining this skill, check the change against THIS block first.

- **Diagram 1 box header** = the generic concept (`.xhtml (PrimeFaces/JSF)`, `*Form.java (@ViewScoped bean)`).
- **Diagram 2 box header** = a **REAL FILE/CLASS name — ALWAYS** (`┌─ StatusPermohonanForm.java ─┐`). A module or layer is **NEVER** a box header. If a step has no verified real file, the box does not exist.
- **Left margin** = exactly **ONE categorization type per diagram** (layer `UI/BEAN/SERVICE/ENTITY/DB` for in-module flows · module `AWAM/PLP/TEKNIKAL/COMMON` for cross-module flows). A categorization lives ONLY in the margin — never as a header, never as an outer frame, never duplicated anywhere.
- **Box body** = D1: one terse does-line · D2: `method()` / `var` with `:line` ONLY, zero prose. Explanations ride the connector.
- **Connector vocabulary is CLOSED**: `┬ │ ▼` (+ `├ ┼ ┤` for a fan-out). **NOTHING else** — no `┈┈►`, no invented glyphs, no floating/side arrows, no outer frames, no nested boxes. If an element is not specified in this file, it is BANNED; when unsure — REMOVE.
- **Other-module / not-deployed step** (e.g. a teknikal callout): a **DOTTED-border box ON the spine**, connected with the same `┬ │ ▼`. The dotted border IS the marker — no side placement, no special arrow. **ALL FOUR borders dotted — `┌┄ … ┄┐` top · `┆` sides · `└┄ … ┄┘` bottom — NEVER mixed** (solid-top + dotted-sides is broken). No ⚠/focus marker on it unless that box is the actual bug node. Re-entry = a `↺ called N× at :a/:b/:c` body line inside it.

## Variants for non-linear shapes (kept minimal)
- **Hub-and-spoke** (data model, e.g. the `aplikasi_id` join): ONE hub box (multiple keys of the *same row* = separate BODY lines, never two boxes) → a single fan-out connector `┬` → `├/┼/┤` → a ROW of **fixed-width equal** spoke boxes with **short aliases**; a footnote maps aliases → full table names so nothing wraps. The fan IS the spine.
- Connector text may be a relation-word (`indexed by` / `looked up in`) when a layer is a lookup TABLE, not a call site.

## Pre-emit RENDER SELF-CHECK (mandatory — the "broken diagram" guard)
Before emitting, eyeball the ASCII and confirm ALL:
- [ ] every box is CLOSED (top `┌─┐`, bodies `│ │`, bottom `└─┘`) — no half-fragments
- [ ] every title sits IN a top border, not as an inside line
- [ ] every connector runs `┬ → │ → (optional text) → │ → ▼` and lands in the next box — none floating to the side
- [ ] NO arrow after the last box — the flow ends
- [ ] Diagram 2 boxes are `method:line` only (zero prose); explanations are on connectors; one ⚠ + a wrong-outcome final box
- [ ] **D2 headers are real file/class names** (no module/layer as header); margin carries ONE categorization type; **only `┬ │ ▼ ├ ┼ ┤` connectors** appear anywhere
- [ ] a dotted box has **ALL FOUR borders dotted** (`┌┄ ┆ └┄`), never solid-top/dotted-sides; **no stray marker floats in the margin** (⚠ only on a real bug node, inline with the tag)
- [ ] pastes clean, ≤ ~72 cols, no wrap

A broken render is a rule break even if the content is right. Fix it before sending.

## Rules
- **Concept-first** — Diagram 1 always precedes Diagram 2; never open with file names.
- **One dominant flow** — top→bottom default; forks become dotted side-boxes (see non-linear section).
- **Real line numbers only** — build the EXAMPLE from the active ticket's verified chain (Scout/Recon `file:line`, codegraph/codemap, or the qa_doc class chain). Never invent line numbers.
- **Legend (emit under each diagram):** `⚠ bug/focus · ▼ main flow · ┈ dotted = supporting/optional/fork`

## Primitive + logging
Skill-only Power (on-demand output; no MUST-fire trigger → no hook, per system-design Rule 7). No separate `log.jsonl` — skill invocations are captured by harness skill telemetry (system-rules Rule 5).

## Design provenance
Format via a 3-candidate + judge Workflow (`wf_5c0231fb`): winner = layered-margins + typed-verbs (B), grafted with zero-prose Diagram 2 (A) + banners/legend (C).

*Version 1.6 — 2026-07-02 (FINAL refinement). A dotted (other-module) box must have **ALL FOUR borders dotted** — mixed solid-top/dotted-sides is broken — and **no stray focus marker floats in the margin** (⚠ only on a real bug node, inline). Per みや's flag of residual teknikal-box breakage.*

*Version 1.5 — 2026-07-02. Added the 🧱 FUNDAMENTALS block as the sole derivation source, after two spec-drift slips in one day: (a) v1.3 invented a `┈┈►` fork glyph and self-labelled it "sanctioned" despite the template ban on unspecified elements; (b) v1.4 codified module-as-box-header, overwriting the founding spec (D2 headers = file names). Connector vocabulary now CLOSED (`┬ │ ▼ ├ ┼ ┤`); other-module steps = dotted box ON the spine. Root cause: refining from my last render instead of from みや's original spec. v1.4 = pruned variants + anti-nesting; v1.3 = 7 variants (over-added); v1.2 = longer connectors; v1.1 = box-format fix; v1.0 = initial build.*
