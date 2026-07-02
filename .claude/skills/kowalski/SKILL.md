---
name: kowalski
description: Kowalski — explain the architecture we are working on as TWO ASCII story diagrams — (1) a generic CONCEPT diagram (the layer stack + one line of what each layer does), then (2) a CURRENT-WORK EXAMPLE diagram (real file/class names in the box top-border, methods/vars:line inside, zero prose). For orienting during debugging or development. Triggers — "kowalski", "/kowalski", "kowalski analysis", "explain the architecture", "show the architecture", "draw the stack", "architecture diagram", "show me the layers", "how does this flow", "concept then example", when getting oriented on a ticket / code area.
---

# /kowalski — architecture, in two story diagrams

*"Kowalski, analysis!"* — on demand, explain the architecture of whatever we are debugging or building as **two stacked ASCII diagrams**: the **concept** first (teaches the layers), then the **same flow on the real files** (the current work). The concept lives entirely in Diagram 1, so Diagram 2 stays skeletal and glance-able mid-debug.

## When to emit
On explicit invoke, OR when みや is orienting on a new ticket / code area and a "how does this flow" picture helps. **Always two diagrams, always in this order: CONCEPT → EXAMPLE.**

## Box format (the one true shape — do NOT deviate)
- **Title lives IN the top border**: `┌─ StatusPermohonanForm.java ─────┐` — never as a separate first line inside.
- **Contents live INSIDE the box**, one per line: `│   method():line              │`.
- **Boxes are CLOSED**: `┌─..─┐` top, `│ .. │` bodies, `└─..─┘` bottom. Never half-fragments.
- **Arrows connect two boxes only**: exit the bottom border at a `┬`, run down a short `│` connector (verb label beside it), and `▼` into the next box's top. **No arrow floats to the side. No arrow dangles after the last box** — the flow just ends.

## Diagram 1 — CONCEPT (generic, reusable)
Layer boxes, one committed top→bottom flow. **Left margin = layer tag** (`UI / BEAN / SERVICE / ENTITY / DB`). **Box body = ONE short line of what the layer DOES** — terse, dropped articles welcome. Verb sits on the connector. Optional dotted side-box for Flowable/BPMN.

```
 UI      ┌─ .xhtml  (PrimeFaces / JSF) ───────────────────┐
         │   renders page, sends clicks/ajax to beans     │
         └────────────────────────┬───────────────────────┘
                                  │ submits
                                  ▼
 BEAN    ┌─ *Form.java  (@ViewScoped bean) ───────────────┐
         │   handles actions, holds view/nav state        │
         └────────────────────────┬───────────────────────┘
                                  │ calls
                                  ▼
 SERVICE ┌─ *Service.java  (Spring @Service) ─────────────┐
         │   business logic, opens transaction            │
         └────────────────────────┬───────────────────────┘
                                  │ reads / writes
                                  ▼
 ENTITY  ┌─ *Entity.java  (Hibernate @Entity) ────────────┐
         │   maps object <-> row  @Table / @Column        │
         └────────────────────────┬───────────────────────┘
                                  │ persists
                                  ▼
 DB      ┌─ postgres table ───────────────────────────────┐
         │   stores the row                               │
         └────────────────────────────────────────────────┘

 FLOW ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
 (opt)  Flowable BPMN — routes which tugasan is next
      └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## Diagram 2 — EXAMPLE (the current work)
SAME layer margins + flow, on the REAL files. **Title in the top border = real file/class name.** **Body = ONLY `method()` / `variable` with `:line`** (`:col` if useful) — **ZERO prose** (concepts were given in Diagram 1). Mark the bug/focus box `⚠` and put the ONE behaviour-verb on its incoming connector (e.g. `skips`). **End on the wrong outcome** — Diagram 2 tells the PROBLEM story; a kowalski example with no ⚠ and no wrong-outcome is just a call-graph, not a story diagram.

Worked reference render (QA-268273 — draft Kemaskini opens the wrong tab):

```
 UI     ┌─ StatusPermohonanForm.java ─────────────────────┐
        │   onKemaskini():681                             │
        └────────────────────────┬────────────────────────┘
                                 ▼
 BEAN   ┌─ PelupusanEMohonForm.java  (: BaseAwamTabForm) ──┐
        │   initForm()  @PostConstruct                    │
        └────────────────────────┬────────────────────────┘
                                 ▼
 BEAN   ┌─ BaseAwamTabForm.java ──────────────────────────┐
        │   initForm():173                                │
        │   initTabRendered():199                         │
        │   tabList.add(0):273                            │
        └────────────────────────┬────────────────────────┘
                                 │ skips
                                 ▼
 BEAN⚠  ┌─ BaseAwamTabForm.java   [BUG] ───────────────────┐
        │   :466-477                                      │
        │   select(activeIndex=2):535                     │
        └────────────────────────┬────────────────────────┘
                                 ▼
 UI     ┌─ Maklumat Tanah  (idx2) ────────────────────────┐
        │   wrong landing — expected Maklumat Pemohon     │
        └─────────────────────────────────────────────────┘
```

*(A chain that WRITES to the DB just keeps going past BEAN → SERVICE → ENTITY → DB; the final box is the `table` name, and the touched `@Column`s:line sit inside the ENTITY box above it.)*

## Pre-emit RENDER SELF-CHECK (mandatory — the "broken diagram" guard)
Before emitting, eyeball the ASCII and confirm ALL:
- [ ] every box is CLOSED (top `┌─┐`, bodies `│ │`, bottom `└─┘`) — no half-fragments
- [ ] every title sits IN a top border, not as an inside line
- [ ] every arrow connects two boxes (exits `┬`, `│`+verb, `▼` in) — none floating to the side
- [ ] NO arrow after the last box — the flow ends
- [ ] Diagram 2 bodies are `method:line` only (zero prose) + one ⚠ + a wrong-outcome final box
- [ ] pastes clean, ≤ ~72 cols, no wrap

If any box or arrow is malformed, FIX it before sending. A broken render is a rule break even if the content is right.

## Rules
- **Concept-first** — Diagram 1 always precedes Diagram 2; never open with file names.
- **One dominant flow** — top→bottom by default, even though MVC is multidirectional. Pick the dominant path.
- **Real line numbers only** — build the EXAMPLE from the active ticket's verified chain (Scout/Recon `file:line`, codegraph/codemap, or the qa_doc class chain). Never invent line numbers.
- **Legend (emit under each diagram):** `⚠ bug/focus · ▼ main flow · ┈ dotted = supporting/optional`

## Primitive + logging
Skill-only Power (on-demand output; no MUST-fire trigger → no hook, per system-design Rule 7). No separate `log.jsonl` — skill invocations are captured by harness skill telemetry (system-rules Rule 5 satisfied via existing skill-load counts).

## Design provenance
Format chosen 2026-07-02 via a 3-candidate + judge Workflow (`wf_5c0231fb`): winner = layered-margins + typed-verbs (B), grafted with zero-prose Diagram 2 (A) + banners/legend (C).

*Version 1.1 — 2026-07-02. Fixed the box format after みや flagged broken renders: title-in-top-border, closed boxes, verb ON the connector (not floating), no dangling arrow, wrong-outcome final box; added the pre-emit RENDER SELF-CHECK. (v1.0 same day = initial build.)*
