---
name: kowalski
description: Kowalski — explain the architecture we are working on as TWO ASCII story diagrams — (1) a generic CONCEPT diagram (the layer stack + one line of what each layer does), then (2) a CURRENT-WORK EXAMPLE diagram (real file/class names as box headers, methods/vars:line only, zero prose). For orienting during debugging or development. Triggers — "kowalski", "/kowalski", "kowalski analysis", "explain the architecture", "show the architecture", "draw the stack", "architecture diagram", "show me the layers", "how does this flow", "concept then example", when getting oriented on a ticket / code area.
---

# /kowalski — architecture, in two story diagrams

*"Kowalski, analysis!"* — on demand, explain the architecture of whatever we are debugging or building as **two stacked ASCII diagrams**: the **concept** first (teaches the layers), then the **same flow on the real files** (the current work). The concept lives entirely in Diagram 1, so Diagram 2 stays skeletal and glance-able mid-debug.

## When to emit
On explicit invoke, OR when みや is orienting on a new ticket / code area and a "how does this flow" picture helps. **Always two diagrams, always in this order: CONCEPT → EXAMPLE.**

## Diagram 1 — CONCEPT (generic, reusable)
Layer boxes in one committed top→bottom flow. **Left margin = layer tag** (`UI / BEAN / SERVICE / ENTITY / DB`). **Box body = ONE short line of what the layer DOES** — terse, dropped articles welcome. **Typed arrow verbs** between boxes. Optional dotted side-box for Flowable/BPMN.

```
╔══════════════════════════════════════════════════════════════╗
║  KOWALSKI · DIAGRAM 1 — CONCEPT   etanah stack  (top → bottom)║
╚══════════════════════════════════════════════════════════════╝

 UI      ┌────────────────────────────────────────────────┐
         │ .xhtml  (PrimeFaces / JSF)                      │
         │ renders page, sends clicks/ajax to beans        │
         └───────────────────────┬────────────────────────┘
                                 │ --submits-->
                                 ▼
 BEAN    ┌────────────────────────────────────────────────┐
         │ *Form.java  (@ViewScoped backing bean)          │
         │ handles actions, holds view/nav state           │
         └───────────────────────┬────────────────────────┘
                                 │ --calls-->
                                 ▼
 SERVICE ┌────────────────────────────────────────────────┐
         │ *Service.java  (Spring @Service)                │
         │ business logic, opens transaction               │
         └───────────────────────┬────────────────────────┘
                                 │ --reads/writes-->
                                 ▼
 ENTITY  ┌────────────────────────────────────────────────┐
         │ *Entity.java  (Hibernate @Entity)               │
         │ maps object <-> row via @Table/@Column          │
         └───────────────────────┬────────────────────────┘
                                 │ --persists-->
                                 ▼
 DB      ┌────────────────────────────────────────────────┐
         │ postgres table                                  │
         │ stores the row                                  │
         └────────────────────────────────────────────────┘

 FLOW ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
 (opt)  Flowable BPMN  --routes-->  which tugasan is next
      └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

 legend:  ▼ main flow   ┈ dotted = optional/supporting layer
```

## Diagram 2 — EXAMPLE (the current work)
SAME layer margins + flow, instantiated on the REAL files. **Box HEADER = real file/class name.** **Box BODY = ONLY `method()` / `variable` with `:line`** (`:col` if useful) — **ZERO prose** (concepts were already given in Diagram 1; if tempted to explain, it belongs in Diagram 1). Mark the bug/focus node `⚠`. Keep exactly **one behavior-verb on the bug hop's arrow** (e.g. `--skips-->`). Dotted `refs` box at the bottom parks supporting nodes so the main spine stays one clean line.

Worked reference render (QA-268273 — draft Kemaskini opens the wrong tab):

```
╔══════════════════════════════════════════════════════════════╗
║  KOWALSKI · DIAGRAM 2 — EXAMPLE   QA-268273  (top → bottom)   ║
╚══════════════════════════════════════════════════════════════╝

 UI     ┌─────────────────────────────────────────────────┐
        │ StatusPermohonanForm.java                        │
        │ onKemaskini():681                                │
        └───────────────────────┬─────────────────────────┘
                                ▼
 BEAN   ┌─────────────────────────────────────────────────┐
        │ PelupusanEMohonForm.java  (: BaseAwamTabForm)    │
        │ initForm() @PostConstruct                        │
        └───────────────────────┬─────────────────────────┘
                                ▼
 BEAN   ┌─────────────────────────────────────────────────┐
        │ BaseAwamTabForm.java                             │
        │ initForm():173                                   │
        │ initTabRendered():199                            │
        │ tabList.add(0):273                               │
        └───────────────────────┬─────────────────────────┘
                                │ --skips-->
                                ▼
 BEAN ⚠ ┌─────────────────────────────────────────────────┐
        │ BaseAwamTabForm.java   [BUG]                     │
        │ :466-477                                         │
        │ select(activeIndex=2):535                        │
        └───────────────────────┬─────────────────────────┘
                                ▼
 UI     ┌─────────────────────────────────────────────────┐
        │ Maklumat Tanah  (idx2)                           │
        └─────────────────────────────────────────────────┘

 refs ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
 (supp) AwamMaklumatHakmilikTabForm.initTabData():56
        PelupusanPemohonTabForm.verifyTab():116
        PelupusanMaklumatPemohonHelperForm.onVerifyTab():804
      └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

 legend:  ⚠ bug/focus   ┈ supporting node   ▼ main flow
```

*(A chain that DOES write to the DB just continues past BEAN → SERVICE → ENTITY → DB; the last box is the `table` name with the touched `@Column`s:line in the ENTITY box above it.)*

## Rules (the discipline that makes it work)
- **Concept-first** — never open with file names; Diagram 1 always precedes Diagram 2.
- **Zero-prose Diagram 2** — names + `:line` only. An explanation in a Diagram-2 box is a rule break; move it to Diagram 1.
- **One dominant flow** — top→bottom by default, even though MVC is multidirectional. Pick the dominant path and commit to it.
- **Terse** — anything cuttable is cut; grammar optional in Diagram 1.
- **Paste-clean** — monospace ASCII, ≤ ~72 cols; check it does not wrap in a narrow terminal.
- **Real line numbers only** — build the EXAMPLE from the active ticket's verified chain (Scout/Recon `file:line`, codegraph/codemap, or the qa_doc class chain). Never invent line numbers.

## Primitive + logging
Skill-only Power (on-demand output; no MUST-fire trigger → no hook, per system-design Rule 7). No separate `log.jsonl` — skill invocations are captured by the harness skill telemetry (system-rules Rule 5 satisfied via existing skill-load counts).

## Design provenance
Format chosen 2026-07-02 via a 3-candidate + judge Workflow (`wf_5c0231fb`): winner = **layered-margins + typed-arrows (B)**, grafted with **zero-prose Diagram 2 (A)** + **banner headers & legend (C)**; the judge's dropback (strip Diagram-2 prose, keep one verb on the bug hop) is applied above. Smoke-tested on QA-268273 (the render above).

*Version 1.0 — 2026-07-02. Built per みや /goal — the "kowalski" architecture explainer.*
