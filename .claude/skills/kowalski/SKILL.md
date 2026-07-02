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

## Variants for non-linear shapes (v1.4 — pruned; kept minimal)
The linear spine holds for genuine top→bottom flows. Where the FORK **is** the architecture, only these exist:

- **Hub-and-spoke** (data model, e.g. the `aplikasi_id` join): ONE hub box (multiple keys of the *same row* = separate BODY lines, never two boxes) → a single fan-out connector `┬` → `├/┼/┤` → a ROW of **fixed-width equal** spoke boxes with **short aliases**; a footnote maps aliases → full table names so nothing wraps. The fan IS the spine.
- **Peer fork** (a co-equal branch into another module, e.g. teknikal callouts): ONE labelled **dotted side-box** off the spine via `┈┈►` (sanctioned — exempt from the no-floating-arrow rule). List N callActivities as an N-key list; tag `PEER · not deployed local`. A same-sub-process-called-N× goes as a `↺ called N× at :a/:b/:c` line INSIDE that side-box — never a floating back-arrow.
- Connector text may be a relation-word (`indexed by` / `looked up in`) when a layer is a lookup TABLE, not a call site.

## 🚫 ONE CATEGORIZATION PER PLACE (the anti-nesting law — HARD)
A categorization (module / layer / file-class) lives in **EXACTLY ONE slot** — the box HEADER **or** the left margin — **never both, and never re-encoded as an outer / containment frame.**
- If a MODULE is the box header (`etanah-awam`), "module" is BANNED from the left margin and from any outer frame. The same module reused as a header at several spine nodes is fine — that is still one slot.
- The left margin is only for a categorization NOT already in the header (header = file `StatusPermohonanForm.java`, margin = layer `UI`). If the header already IS the categorization, drop the margin.
- **BANNED:** nested / containment boxes (a box inside a box) · the same categorization in 2+ places · adding ANY element not in this template. When unsure — REMOVE. The whole vocabulary is: a flat spine of headed boxes + connectors + at most one dotted fork side-box.

## Pre-emit RENDER SELF-CHECK (mandatory — the "broken diagram" guard)
Before emitting, eyeball the ASCII and confirm ALL:
- [ ] every box is CLOSED (top `┌─┐`, bodies `│ │`, bottom `└─┘`) — no half-fragments
- [ ] every title sits IN a top border, not as an inside line
- [ ] every connector runs `┬ → │ → (optional text) → │ → ▼` and lands in the next box — none floating to the side
- [ ] NO arrow after the last box — the flow ends
- [ ] Diagram 2 boxes are `method:line` only (zero prose); explanations are on connectors; one ⚠ + a wrong-outcome final box
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

*Version 1.4 — 2026-07-02. PRUNED the over-added variants (cut containment-frame + two-column margin) and added the **ONE-CATEGORIZATION-PER-PLACE** anti-nesting law, after みや flagged the multi-module render as still-broken — "module" was re-encoded 3× (outer frame + margin tag + box header). Lesson: simplify means SUBTRACT, not add. Kept: hub-and-spoke + one dotted peer-fork side-box. v1.3 = 7 variants (over-added) from the etanah eval; v1.2 = longer connectors; v1.1 = box-format fix; v1.0 = initial build.*
