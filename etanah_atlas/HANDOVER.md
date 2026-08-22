# Etanah Atlas — Handover

*Melaka profile · mapping v3.0 (2026-08-22) · 781 tables · 2,146 FKs · 350 implicit links · 12 moduls · 13 urusans (all with BPMN-verified decision forks) · 8 pilot tugasan traces*
*Prepared for handover to Claude Design (visual layer) and Ruri / Claude Code (logic + content).*

> **⚠️ HISTORY NOTE (2026-08-22)**: the v2.1–v2.3 iteration this document previously described (A\* edge routing, side-panel group-by, 13-urusan mapping with PT/PLPS forks) was **never committed and is lost** — only the docs and `lib/smoke_test.js` survived. v3.0 rebuilt the 13 urusans + forks from BPMN evidence (fresh extraction, all stage tables schema-validated), and added the Tables tab, columns, implicit links, and tugasan pilot. The v2.3 geometry features (A\* routing, panel group-by) are still lost — the smoke test marks them SKIP as backlog.

This document is the quick orientation for whoever picks the project up next. The exhaustive reference — design rationale, contracts, iteration history — lives in `HANDBOOK.md`; this is the shorter "where things stand and how to continue" note.

---

## 1. What it is

Etanah Atlas is a **single self-contained HTML file** (`etanah_atlas_melaka.html`) that lets someone explore the Melaka land-office PostgreSQL schema without a database, a server, or an internet connection. Open the file in any browser and it runs — no build step, no CDN, nothing to install. You can email it, drop it on a shared drive, or open it from a USB stick; everything (data + code + styles) is inlined.

It is built for two audiences at once: backend developers who want the real table/FK structure, and non-technical Business Analysts who need to see how a land-office *urusan* (workflow) moves through the system. It is also **profile-portable** — a future state (Selangor, Negeri Sembilan, …) can supply its own `mapping.<state>.json` and rebuild, with no code change.

The three views:

- **Map** — an ERD-style canvas of the main tables for the chosen Modul, colour-coded by category, with click-to-inspect side panel and double-click to drill into a table's children. Two layout modes: Bands (clustered) and Swimlanes (process flow).
- **Urusan Journey** — a vertical timeline of a workflow's stages. At the committee decision the line offers a **Lulus / Tolak / Tangguh** selector and continues down the chosen outcome (see §5).
- **Search** + **About** — table lookup and dataset metadata.

---

## 2. Current state

Working and verified:

- 12 moduls render in both Map modes; **Pelupusan** is the fully-curated reference modul, others are lighter previews.
- Map edge routing uses A\* obstacle-avoidance + a per-side port allocator + nudging — no lines pass behind cards; Bands is overlap-free (one known Swimlanes residual, see §7).
- Side panel groups a table's children/parents by **Category** (default), Modul, or Layer — important for hub tables like `umm_aplikasi` (~87 FK children).
- Double-click focus dims the context anchors so the expanded table + its children stand out.
- All 13 urusans render in the Journey; the **decision-selector** model is wired for **PT** and **PLPS** (pilot).
- `lib/smoke_test.js` boots the real app headlessly and runs 18 checks (0 failing).

---

## 3. Architecture — four layers

```
DB schema  →  curation config        →  build         →  app source        →  output
(et_main)     config/mapping.melaka.json  build.py        src/app.js            etanah_atlas_melaka.html
              + parsed schema             + lib/*.py      src/style.css         (single inlined file)
                                                          src/shell.html
```

1. **Schema** — the source DDL/FK data, parsed by `lib/parse_schema.py` into `build/schema_parse.json`.
2. **Curation config** — `config/mapping.melaka.json` is the human-edited layer: which tables matter, how they group into moduls/categories, and the urusan journeys. **This is where almost all content changes happen.**
3. **Build** — `build.py` runs parse → `lib/build_dataset.py` (merges schema + mapping into `build/dataset.json`) → `lib/assemble_html.py` (inlines dataset + `app.js` + `style.css` into `shell.html`).
4. **App** — vanilla JS (`src/app.js`), no framework, no dependencies; `src/style.css` is the visual layer; `src/shell.html` is the page shell.

The output HTML embeds `build/dataset.json` in a `<script>` tag, so the running page never fetches anything.

---

## 4. Data model — the part you will edit most

Everything content-related is in `config/mapping.melaka.json`:

- `moduls[]` — business departments, each with a colour and an optional `main_tables[]` (the tables shown on the Map for that modul).
- `categories[]` — the function-axis colour system (11 categories) used to colour cards.
- `urusans[]` — the 13 workflows. Each has `kod`, `name`, `english`, `section`, `description`, and `stages[]`.

A **stage** is `{ kod, name, tables[] }`. The tables listed are what light up on the Map when that urusan is filtered, and what's shown under the stage in the Journey.

A **decision stage** additionally carries a `fork`:

```json
"fork": {
  "default": "lulus",
  "outcomes": [
    { "kind": "lulus",   "label": "Lulus",   "steps": [ {"name":"…","tables":[…]}, … ], "end": "…selesai" },
    { "kind": "tolak",   "label": "Tolak",   "steps": [ {"name":"…","tables":[…]} ],    "end": "…selesai" },
    { "kind": "tangguh", "label": "Tangguh", "steps": [ {"name":"…","tables":[…]} ],    "loop": "…kembali ke keputusan" }
  ]
}
```

The Journey renders the linear stages down to the decision, shows the **Lulus / Tolak / Tangguh** selector on the decision node (defaulting to `default`), and continues the single timeline with only the chosen outcome's `steps`. `end` marks a terminal outcome; `loop` marks a round-trip (Tangguh re-tables and returns to the decision, so it has no real tail). `kind` drives the colour (lulus = green, tolak = red, tangguh = amber).

---

## 5. The Urusan Journey is a deliberate abstraction — read this

The Journey is a **curated, high-level summary** of a workflow. It is **not** a faithful reproduction of the Flowable BPMN, and it is not meant to be.

Concretely: the real `MLK_PLP_PT` process (v6) has on the order of **thirty-plus numbered tugasan** after the MMKN decision alone — Semakan/Pengesahan Keputusan MMKN, Surat Keputusan Lulus + Borang Notis 5A, Charting Keputusan, Cetakan Dokumen, Bayaran Pelbagai, Semakan Dokumen Kelulusan, Tamat Aplikasi, plus the parallel Tangguh and Tolak sub-flows. The Atlas collapses that entire Lulus tail into two abstract nodes: *Surat Keputusan Lulus → Pendaftaran Hakmilik*.

This is intentional. The audience includes Business Analysts; the full BPMN is overwhelming and changes per ticket. The Journey answers "what are the major stages and which tables back them," not "what is every tugasan in order."

**Source of truth for exact steps** is the BPMN itself (`MLK_PLP_*.bpmn20.xml`) and `etanah-knowledge/melaka/FLOWABLE-WORKFLOWS.md`. If a future maintainer ever needs step-fidelity for a particular urusan, the data model already supports it — just add more entries to that outcome's `steps[]`. The deliberate choice today is to keep it abstract.

---

## 6. Build & verify

```
python build.py            # parse → dataset → assemble single HTML
node lib/smoke_test.js      # 18 checks, exit 0 = all pass
```

Run both after **every** change. The smoke test boots the real `app.js` under a headless DOM shim (not a mock), then checks: the app boots; all dropdowns populate; every modul renders in both Map modes; the urusan filter runs; every stage/fork/main table resolves to a real table; urusan-filter highlight correctness; no overlapping cards or coinciding edge endpoints; **no edge segment passes behind a box**; edges are nudged apart (Swimlanes hub residual reported as INFO); the side-panel group-by buckets a hub's children; and PT + PLPS carry a valid decision selector. Full list: `HANDBOOK.md` Part 12.

> **OneDrive note:** edits to `src/*` must go through a rebuild to reach the output HTML. If a tool reports a stale file on the synced drive, re-run `build.py` and re-check with `node`.

---

## 7. Known limitations / residuals

- **Swimlanes hub overlap.** A few FK lines converging on `umm_aplikasi` in Swimlanes mode still overlap; single-pass nudging can't fully settle it (shifting one segment pushes a connected one). The eval reports this as **INFO**, not a failure. A proper fix needs an iterative constraint solver — logged, not done.
- **Journey fork is piloted only** on PT and PLPS (see §8).
- **Journey abstraction** as described in §5 — by design, not a bug.

---

## 8. Rollout status — DONE 2026-08-22 (v3.0)

All 13 urusans now carry BPMN-extracted flows. Outcome coverage as found in the BPMN (never assumed):

| Urusan | Outcomes | Notes |
|---|---|---|
| PT, PLPS, PRZ, BPRZ, PSBS, PPJK, PLTP, PRBB, PRU, RPPLP | Lulus · Tolak · Tangguh | Tangguh loops back to re-table (PLTP's ends at a dedicated `Tangguh MMKN` endEvent) |
| PPTPB | Lulus · Tolak only | No Tangguh anywhere in the BPMN (consistent with the ADHOC-PPTPB-2026-3 gateway findings) |
| MCL | Lulus · Tolak only | Single Pentadbir Tanah boolean decision (`${keputusan}`), no committee, no Tangguh |
| MLPS | no fork | No committee decision at all — linear flow with a pembetulan correction loop; rendered linear |

Each urusan's `fork_evidence` field in `config/mapping.melaka.json` quotes the gateway ids + condition expressions verbatim. Stage/step tables are validated against the schema at build time (`build_dataset.py` warns) and by the smoke test.

**Not yet modeled**: the Pembetulan (correction) rework sub-flows several BPMNs carry, and pre-committee `keputusanAwal` early-reject shortcuts (PLTP, MCL) — noted in each urusan's `notes` field; candidates for a later "unhappy path v2" pass.

---

## 9. Who changes what (handover contracts)

- **Claude Design (visual).** `src/style.css` — colours, spacing, typography, the card/panel/timeline look. The LOCKED vs UNLOCKED list is in `HANDBOOK.md` Part 10. Structure of the DOM and the data contract are locked; visual tokens are open.
- **Ruri / Claude Code (logic + content).** `config/mapping.melaka.json` curation, the urusan/fork data, the rollout in §8, and the planned features below. Definition of a "structural change" is in `HANDBOOK.md` Part 11.

---

## 10. Planned features (not built)

From `HANDBOOK.md` Part 6: (E) lineage view, (F) fan-in centrality as a second importance signal, (G) schema-field provenance, (H) PII/sensitivity flagging, (I) change log, (J) schema-snapshot CI hook. None are started; all are config- or build-layer additions consistent with the sustainability charter.

---

## 11. File inventory

| Path | What it is |
|---|---|
| `etanah_atlas_melaka.html` | **The deliverable** — single self-contained file to share/open. |
| `config/mapping.melaka.json` | Curation layer (moduls, categories, urusans, forks). Edit here. |
| `build.py` | Orchestrates parse → dataset → assemble. |
| `lib/parse_schema.py`, `lib/build_dataset.py`, `lib/assemble_html.py` | Build stages. |
| `lib/smoke_test.js` | Headless boot + 18-check eval. Run after every build. |
| `src/app.js`, `src/style.css`, `src/shell.html` | App logic, visual layer, page shell. |
| `build/dataset.json` | Generated; embedded into the output HTML. |
| `HANDBOOK.md` | Full reference (rationale, contracts, iteration history, verification). |
| `README.md` | Short build/verify note. |

---

*End of handover. For anything not covered here, `HANDBOOK.md` is the long-form source of truth.*
