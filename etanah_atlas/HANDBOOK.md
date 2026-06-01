# Etanah Atlas — Handbook

> **This is the single source of truth for the project.** It is the file you paste to Claude Design, the file a new team member reads to onboard, and the file Ruri reads before any code change.
>
> Pair with `README.md` for build instructions only. Everything else lives here.

---

## Quick orientation

**Etanah Atlas** is a single-file HTML schema explorer for the Etanah Malaysian state land-office system. Audience is mixed — backend developers AND non-technical Business Analysts. Current profile is `melaka`. The artifact ships as one file, opens offline, prints to A4 landscape, and is profile-portable so future state projects (Selangor, Negeri Sembilan, etc.) deploy by adding `mapping.<state>.json` — no code change.

The product is in active development. Visual refresh is going to **Claude Design** (Part 10 contract). Business logic refinements after that go to **Ruri / Claude Code** (Part 11 contract).

The architectural core is **sustainability** — routine business changes must never require structural code edits. Read Part 2 before any structural decision.

---

## Table of contents

- [Part 1 — What this product is](#part-1--what-this-product-is)
- [Part 2 — The sustainability tenet + four-layer architecture](#part-2--the-sustainability-tenet--four-layer-architecture)
- [Part 3 — Information architecture, components, interactions](#part-3--information-architecture-components-interactions)
- [Part 4 — Design decisions, planning Q&A, iteration history](#part-4--design-decisions-planning-qa-iteration-history)
- [Part 5 — User preferences (treat as constraints)](#part-5--user-preferences-treat-as-constraints)
- [Part 6 — Sustainability features A–J](#part-6--sustainability-features-aj)
- [Part 7 — Scale, reliability, trade-offs](#part-7--scale-reliability-trade-offs)
- [Part 8 — Research findings (competitive + gaps)](#part-8--research-findings-competitive--gaps)
- [Part 9 — Open design questions](#part-9--open-design-questions)
- [Part 10 — Claude Design contract: LOCKED vs UNLOCKED](#part-10--claude-design-contract-locked-vs-unlocked)
- [Part 11 — Post-design Ruri scope + structural-change definition](#part-11--post-design-ruri-scope--structural-change-definition)
- [Part 12 — Build pipeline + coupling map](#part-12--build-pipeline--coupling-map)
- [Part 13 — How to use this handbook with Claude Design](#part-13--how-to-use-this-handbook-with-claude-design)

---

## Part 1 — What this product is

### The goal
Make a 781-table, 2,146-FK PostgreSQL schema legible to a *team*, not just a database engineer. The schema belongs to the Etanah land-office system used by Pejabat Tanah Melaka (state land office, Malaysia); the team building on it includes both backend developers and non-technical Business Analysts who need to talk about the system using the same map. The artifact must be a single self-contained HTML file that ships by email, opens offline, and prints to A4 landscape.

### Who it is for
| Audience | What they want from this page |
|---|---|
| **New developer onboarding** | "Show me the 10 tables that matter, then let me click around to learn the rest." |
| **Senior developer fact-checking** | "Where does field X live, what FKs touch it, what other tables share it." Uses Search + Map drill-down. |
| **Business Analyst** | "Walk me through how a Pemberimilikan Tanah application flows through the system." Uses Urusan Journey. |
| **Team lead in a meeting** | Prints the Map view in A4 landscape, points at it on the wall. |
| **Future state team (Selangor, etc.)** | Drops in their own `mapping.<state>.json`, gets the same explorer with their data. |

### What to show — and what NOT to show
- **Show first**: a small curated set of "main tables" per Modul — the ~10 anchor tables the team uses every day (`umm_aplikasi`, `plp_a_pelupusan`, `umm_a_hkmlk`, `ind_ursn`, etc.). Hide the long tail by default.
- **Show on demand**: drill into any main table to see its children.
- **Show as journey**: stage-by-stage workflow timelines per urusan (PT, PLPS, PRZ — the canonical three with structurally different flows).
- **Show as filter**: same canvas, but highlight the tables touched by a particular urusan.
- **NOT in scope**: column-level detail, indexes, query examples, internal Pymsoft jargon, internal ticket numbers, TRG-state code paths (TRG is reference-only — Melaka is the focus).

### The two-axis theme
This was settled in the planning round and is the structural backbone of the whole UI:
1. **Business Domain axis** — Modul (department) is the primary entry. The user picks Pelupusan / Pendaftaran / Hasil / Strata / etc. first; everything else is filtered by this. This is what the **Map** view embodies.
2. **Urusan Workflow Journey axis** — for each business workflow (Pemberimilikan Tanah, Lesen Pendudukan Sementara, Perizaban), there's a per-stage view showing what tables come into play at each step. This is what the **Urusan Journey** view embodies.

The two axes are deliberately separate views, not a merged single canvas — they answer different questions and have different shapes.

---

## Part 2 — The sustainability tenet + four-layer architecture

### The core tenet — engraved

Routine business changes MUST NOT require structural code edits. Visual refresh by Claude Design MUST NOT break business logic. Business logic refresh by Claude Code (Ruri) MUST NOT break visuals. Schema evolution MUST NOT break either.

The system is designed for change. Every architectural decision below is evaluated against this principle. If a decision makes future-change cheaper, it stays. If it makes future-change harder, it is reworked or rejected — even if it makes the current state slightly nicer.

This tenet is not a wish. It is enforced by the four-layer architecture, the four seam contracts, and the ten sustainability features in Part 6. Anyone proposing a structural change must show how the change respects these.

### The sustainability charter (non-functional requirements)

| Axis | What it guarantees |
|---|---|
| **Routine-change config-only** | Adding moduls, urusans, categories, anchor blurbs, main tables = config edit; never a code edit |
| **Visual-layer swap** | Claude Design refreshing UI does NOT touch business data or interaction logic |
| **Logic-layer swap** | Ruri refining business logic does NOT touch visuals |
| **Schema-drift survival** | Schema changes auto-detect at build time AND at runtime drop-zone |
| **Cross-state survival** | Adding a Selangor profile = one new `mapping.selangor.json` file, zero code changes |
| **Bus-factor ≥ 2** | Team members other than the original builder can update curation safely |
| **Doc-currency** | Handover docs are linked from code; staleness is visible (version stamps, About-tab metadata) |
| **No-framework lock-in** | Vanilla JS, no SPA dependency; survives JS-framework churn |
| **Distribution-stable** | Single-file shippable HTML; offline-capable; no CDN |
| **Build-stable** | Python 3 standard library only; no pip dependencies that can rot |

### The four-layer architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4 — VISUAL                                                │
│  shell.html · style.css · render-only fns in app.js              │
│  Owns: layout chrome, color, typography, animations, components  │
│  Surface for: CLAUDE DESIGN (Plugin)                             │
│                                                                  │
│  ░░░░░░░░░░ SEAM 3 — RENDER API ░░░░░░░░░░                       │
│  Visual accepts: nodeIds[], positions{}, edges[], state{}        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3 — INTERACTION / BUSINESS LOGIC                          │
│  app.js business fns: filter, focus, search, drill, urusan-hit,  │
│  print, state machine, drag-drop SQL handler                     │
│  Owns: behaviour, decisions, what gets shown when                │
│  Surface for: RURI / CLAUDE CODE                                 │
│                                                                  │
│  ░░░░░░░░░░ SEAM 2 — DATA CONTRACT ░░░░░░░░░░                    │
│  Stable fields on dataset.json (see seam 2 below)                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2 — DATA / CURATION                                       │
│  mapping.<profile>.json · build/dataset.json                     │
│  Owns: moduls, main tables, urusans, anchor blurbs, categories,  │
│        swimlane assignments, profile metadata, version stamps    │
│  Surface for: BAs + DEVS via PR workflow                          │
│                                                                  │
│  ░░░░░░░░░░ SEAM 1 — BUILD CONTRACT ░░░░░░░░░░                   │
│  schema_parse.json with stable shape (see seam 1 below)          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1 — SOURCE                                                 │
│  source/et_main_uat.sql                                           │
│  Owns: raw schema facts (tables, FKs, columns, comments)          │
│  Surface for: DB ADMINS / pg_dump pipeline                        │
└─────────────────────────────────────────────────────────────────┘
```

Plus a fourth seam — **Visual ↔ Print** — covered below.

### The four seams (contracts)

#### Seam 1 — Source ↔ Data (build-time)
**Flows across**: `schema_parse.json` produced by `lib/parse_schema.py`.

**Stable fields** (this is the API; renaming requires a major version bump):
```json
{
  "tables": [{"name", "column_count", "comment", "incoming_fk_count", "outgoing_fk_count"}],
  "foreign_keys": [{"child_table", "child_column", "parent_table", "parent_column"}]
}
```

**Drift signals**: build fails if any `main_table` listed in `mapping.<profile>.json` is not found in the parse; build warns to stderr if FK count drops by >20% vs the previous build (likely sign of a broken parse, not a real schema event).

**Pluggability**: future support for Oracle / MS SQL is a sibling parser file with the same output shape. Downstream untouched.

#### Seam 2 — Data ↔ Logic (runtime)
**Flows across**: `build/dataset.json` embedded into the HTML at build time.

**Stable fields** (this IS the API surface for the logic layer; treat it like a public API):
```json
{
  "categories": [{"key", "label", "color", "color_bg_light", "color_bg_dark", "color_p_light", "patterns"}],
  "moduls": [{"key", "label", "prefix", "color", "main_tables"}],
  "tables": [{"name", "modul", "layer", "category", "swimlane", "cols", "comment", "in", "out", "is_main"}],
  "in_fk": {"<table>": [{"from", "col"}]},
  "out_fk": {"<table>": [{"to", "col"}]},
  "anchor_children": {"<table>": [{"from", "col"}]},
  "urusans": [{"kod", "name", "english", "section", "modul", "description", "stages": [{"kod", "name", "tables"}]}],
  "anchor_blurbs": {"<table>": "string"},
  "profile": "string", "version": "string", "last_updated": "YYYY-MM-DD"
}
```

**Planned extensions** (Part 6, features F + H): `tables[].fan_in_centrality` (0-100) for auto-detecting curation drift; `tables[].pii` (boolean) for sensitivity flagging.

**Field stability rule**: changes to these field names require a version bump in mapping.<profile>.json, a migration shim in `build_dataset.py` for backward compat, and an entry in CHANGELOG.

#### Seam 3 — Logic ↔ Visual (DOM contract)
**Flows across**: pure function call from logic to visual.

**Render input**:
```ts
{
  nodeIds: string[],                              // tables to display
  positions: { [id: string]: {x: number, y: number} },
  edges: { from: string, to: string, col: string }[],
  state: {
    selected: string | null, urusan: string | null,
    layer: "_a_" | "_p_" | "both", modul: string,
    expanded: Set<string>, layoutMode: "bands" | "swimlanes"
  }
}
```

**Visual layer IS FREE to**: change card design (rect, rounded-rect, hexagon, badge-only); swap color palettes; replace SVG with Canvas or WebGL if it can still accept the contract; add hover states, animations, sound effects, transitions; restructure DOM, change class names internally, anything cosmetic.

**Visual layer MUST NOT**: compute which nodes are visible (logic layer's job); decide what counts as "main" (data layer's curation); hard-code modul-specific or urusan-specific behaviour (curation lives in mapping); add decorative glyphs inside cards (captured user preference, Part 5).

#### Seam 4 — Visual ↔ Print
**Flows across**: CSS only. No JS, no data restructuring.

- `@media print` block lives at the bottom of style.css
- `@page` declarations own paper size and orientation
- Print sees the same DOM as screen; styling is the only difference
- Adding US Letter or A3 is a single CSS edit — no code change

---

## Part 3 — Information architecture, components, interactions

### Three top-level views

| View | Purpose | Primary user |
|---|---|---|
| **Map** | ERD-style canvas of main tables for the chosen Modul, with click-to-inspect side panel and dblclick to drill into children. Two layout modes (Bands / Swimlanes). | Both devs and BAs |
| **Urusan Journey** | Vertical timeline showing each business workflow (PT, PLPS, PRZ) stage-by-stage with the tables involved at each stage. Comparable side-by-side via chip selector. | BAs primarily |
| **Search** | Free-text + Modul/Layer-filtered grid of all 781 tables. | Devs primarily |
| **About** | Glossary of prefixes, schema drop-in re-parser, profile/version stamp. | Both |

### Visual design system

**Three orthogonal color axes**:
- **Modul** (business department) — colors set in `mapping.melaka.json → moduls[].color`; used in Modul dropdown and side panel.
- **Category** (function) — 11 categories: Application Hub, Land & Hakmilik, Parties / Pemohon, Workflow & Decisions, Reference Data, Pelupusan Container, Pendaftaran Registry, Hasil Revenue, Other Modules, Documents & Letters, Subsystem. This is the color you see on each card on the canvas.
- **Layer** (`_a_` internal / `_p_` AWAM portal) — encoded by tinting: `color_p_light` is a desaturated tint of the category color, so portal-side cards look softer than officer-side cards.

**Type**: body `-apple-system, "Segoe UI", Roboto, sans-serif`; code/table names `"SF Mono", "Cascadia Code", Consolas, monospace`. Sizes 10–22 px.

**Theme tokens**: defined in `:root` and `[data-theme="dark"]` of `src/style.css`. Surface, surface-2, border, border-strong, text, text-soft, text-dim, accent, accent-soft, shadow, shadow-lg.

**Spacing / radii**: `--radius: 10px` (cards, panels), `--radius-sm: 6px` (buttons, chips). Layout grid: `map-grid` = 1fr 360px (canvas + side panel). Collapses to single column under 1100 px.

### Components

| Component | File location | Visual states |
|---|---|---|
| **Tab bar** | shell.html `.tabs` | default / active / hover |
| **Map controls bar** | shell.html `.map-controls` | Modul select, Urusan select, Layer segmented, Bands/Swimlanes segmented, Pin / Reset / Print |
| **Help bar** | `.map-help` | always visible above canvas |
| **Legend strip** | `.map-legend` | always visible — color swatch + label, no glyph |
| **Focus bar** | `.focus-bar` | shown only when ≥1 card is expanded; lists drilled-in cards as removable chips + Clear focus |
| **Canvas card** | `.nd` group | default / hover / selected / urusan-hit / dimmed / expanded (dashed halo) |
| **Side panel** | `.side-panel` | empty-hint / table-details — no actions |
| **FK arrow** | `.fk-line` | default / highlight / dim |
| **Urusan stage** | `.uj-stage` | timeline dot + name + tables |
| **Search card** | `.tc` | default / hover |
| **Drop zone** | `.dropzone` | default / drag-over (About tab — drop SQL to re-parse client-side) |

### Interactions

| Trigger | Result |
|---|---|
| Tab click | Switch view; Map re-renders |
| Modul dropdown | Clears expanded set + selection; re-renders Map with that Modul's main tables |
| Urusan dropdown (on Map) | Adds highlight band on tables involved; others dim |
| Layer segmented control | Filter `_a_` vs `_p_` vs both |
| Bands / Swimlanes toggle | Re-layout: Bands = force-directed + cohesion + category bounding boxes; Swimlanes = column-constrained AWAM→Internal→Decision→Registry |
| Canvas card click | Select; populate side panel; dim non-connected FK arrows |
| Canvas card double-click | Expand: focus mode hides other main tables, shows this card + its top-8 child tables |
| Canvas card drag | Move card; FK arrows update in real time |
| Side panel child/parent list click | Select that table (navigates focus) |
| Pin button | Snapshot current positions to localStorage, locks layout |
| Reset button | Clears pinned positions; re-runs force layout |
| Theme toggle | Swap light/dark; persisted to localStorage |
| Drop a `.sql` file onto About dropzone | Re-parse tables + FKs client-side; refresh the page using the new schema while keeping curation `mapping.json` |

### Layout modes — design rationale

**Bands** = force-directed layout with three forces working together:
- *Link force*: pulls FK-connected tables together (target distance ≈ 200 px)
- *Category cohesion*: pulls same-category tables toward their centroid (weight 0.04)
- *Hard rectangular collision*: rect-rect separation with 18 px x-padding, 14 px y-padding

After convergence, a soft bounding box is drawn around each category's cluster. Designed for the "show me the whole modul at once" use case. Non-deterministic but settles within 450 iterations.

**Swimlanes** = column-constrained layout with four process-flow columns:
- AWAM / Pra (portal `_p_` tables)
- Internal (PLP) (officer-side `_a_` tables)
- Decision (workflow tables)
- Registry (`dft_` tables)
- (Floating "Reference" row at bottom, currently unused for Pelupusan view)

Empty columns auto-collapse and remaining columns redistribute width. Designed for the "show me how an application flows through the system" use case.

The Bands / Swimlanes toggle is persisted to localStorage per session.

---

## Part 4 — Design decisions, planning Q&A, iteration history

### Settled design decisions

1. **Single-file artifact, no CDN** — must work offline, must be email-shareable. No external fonts, no external JS.
2. **Modul-first organisation** — the user picks a Modul (Pelupusan, Pendaftaran, etc.) before anything else. Cross-modul comparison is intentionally NOT a first-class view; you switch via the dropdown.
3. **Function-axis coloring** — colors encode *category* (function), not *modul*. This was a deliberate change after an earlier version where all-shared tables looked identical gray. Categories carry meaning even within a single Modul view.
4. **Two layout modes, toggled, not picked-once** — the team disagreed on which was better, both stayed. Toggle is in the controls bar.
5. **Side panel is info-only** — actions live on the canvas (drag, dblclick). The user explicitly rejected an in-panel "Expand children" button.
6. **No on-card glyphs** — earlier attempts to add letter badges + a "+" chevron to cards were both rejected as visual noise. Cards stay clean: name, in/out counts, columns count, MAIN badge if applicable.
7. **Focus mode on drill-down** — when any card is expanded, other main tables are hidden by default. Clear-focus bar provides escape. The "always-on hub anchors" (`umm_aplikasi`, `umm_p_aplikasi`) stay visible so the user never loses orientation.

### Planning-round Q&A — what was asked, what was answered

| Question | Answer |
|---|---|
| Single HTML app or multi-page site? | **Single self-contained HTML.** Must work offline, no CDN, no build server. |
| PDF export? | **Per-view print-to-PDF buttons.** A4 landscape orientation. No standalone PDF artifact. |
| How many tables to show by default? | **Identity anchors only** — the curated main-table set per Modul, not all 781. |
| Two themes — Business Domain (Modul-organised ERD) + Urusan Workflow Journey (per-flow timeline)? | **Yes, both.** This shaped the Map + Urusan Journey tab split. |
| Which urusans to feature? | **At least 2 with structurally differing flows.** Settled on three: PT (KTN s.76 full pemberimilikan path), PLPS (KTN s.65 TOL, no Pendaftaran handoff), PRZ (KTN s.62, skips JKKL entirely). |
| Side panel for clutter relief? | **Yes** — info goes to the side panel, canvas stays clean. |
| Parse the SQL ourselves or rely on external tools? | **Parse it ourselves** — regex-based, runs at build time AND in the browser via the drag-drop dropzone. |
| Schema dump drop-in? | **Yes** — drop a new `.sql` onto the About-tab dropzone, the page re-parses client-side without losing the curated `mapping.json`. |
| Cross-state support from day one? | **Profile system from the start.** Curation lives in `mapping.<profile>.json` (currently melaka), so a future Selangor or Negeri Sembilan team just drops in their own mapping. |

### Iteration history — what we tried, kept, rejected

**v1 (initial build)** — Static SVG map with all main tables visible at once, color-coded by Modul. Shipped with a TDZ ReferenceError on first load (`ANCHOR_POS` accessed before declaration). Diagrams didn't render. User: *"nothing at all is working."* Fixed by moving `setTheme(...)` call to bottom of file.

**v1 post-fix feedback round** — Once v1 ran, the user gave a 14-point list. The ones that drove the redesign:
- "Modules should be separated by department" → Modul-first dropdown
- "Focus PLP first" → Pelupusan became the only fully-curated Modul; others preview stubs
- "Land/Hakmilik too big" → category grouping introduced
- "Want ERD as fundamental concept" → moved to force-directed ERD with drag
- "Star with no legend" → arbitrary star markers removed
- "Urusan Journey won't scale" → switched to vertical timeline + picker, comparable in columns
- "Layer → Modul rename" → "Module" became "Modul" everywhere
- "Remove internal terms" → grepped + stripped internal jargon, ticket numbers, project-internal labels
- "Single-look filtered ERD" → Urusan dropdown on Map filters by workflow

**v2 — "no colours to differentiate by which group"** — After the Modul-first refactor, most visible tables were categorised as `shared` → all cards gray. User pushed back. Resolution: added a **function-axis category system** (11 categories with their own color tokens).

**v2.1 — two layout modes** — User wanted to see the system as flow AND as clusters, unwilling to pick one. Resolution: **Bands / Swimlanes toggle**, persisted to localStorage.

**Today (2026-05-21) — minimalism pass** — Decorations added in a single critique-response cycle, then rejected. Important to capture so the same direction doesn't get re-proposed:

| Added | Rejected because |
|---|---|
| **Letter badges on each card** | *"those Letters in those boxes... is very messy."* Card name is the primary ID; an extra letter glyph competes with it. |
| **Highlighted-alphabet legend strip** | *"those list of highlighted alphabets in a row is very messy."* Wall-of-letters effect at glance. |
| **`+` chevron on every card** | *"I guess remove the '+' sign as well."* Visual noise; drill behaviour is now reached via **double-click** with subtle dashed halo when expanded. |
| **In-panel "Expand children on canvas" button** | Buried; users missed it; conflicts with "panel is info-focused" principle. |

**The cumulative lesson**: the cards must be visually minimal. Name, in/out counts, MAIN badge, that's it. Color carries category. Border carries category. Anything else added inside the card body has a high bar to clear.

---

## Part 5 — User preferences (treat as constraints)

Each item has the user's direct quote so a reviewer can hear the original intent, not my paraphrase.

- **Sustainability over polish.** *"It is better to create a system that doesn't need any structural updates in the first place as much as possible unless a very fundamental change like the change of how the business works."* Prefer config-driven changes; the curation `mapping.<state>.json` is profile-portable so a future state project can drop in their own mapping without code change.

- **Melaka as the new base for future states.** *"I do target to create Melaka as the most stable state project."* Design state-conditional behaviour as set-extensible (`STATES_WITH_X.contains(state)`), not hard-coded ternaries — so adding Selangor or Negeri Sembilan later is a one-line config change, not a refactor.

- **Info-focused side panel.** *"I actually missed that 'Expand children on canvas', I think it should show somewhere else more obvious for user to notice. Design wise, it shows under a popup that should be info-focused."* The panel never holds primary actions — only information. Actions live on the canvas (drag, dblclick) or in the controls bar.

- **No clutter on cards.** *"Those Letters in those boxes and those list of highlighted alphabets in a row is very messy."* Followed by *"I guess remove the '+' sign as well."* Secondary encodings — letter glyphs, icon badges, in-card chevrons — are explicitly off-limits. Card body holds: name, in/out arrows, columns count, MAIN badge if applicable. Nothing more.

- **No internal jargon in UI.** Banned: internal ticket numbers (`QA-XXXXXX`), internal code names (`BUG-BESTIARY`, etc.), Pymsoft-internal role labels. The audience includes BAs who don't share that vocabulary.

- **TRG state is reference-only.** Project targets Negeri Melaka. Terengganu (TRG) code exists in the source codebase as reference material but is never an in-scope target for this artifact.

- **Show concrete options before committing.** *"Can you at least show the difference for this one? Perhaps like you create a diagram. I like how Claude can kinda draw & create artifacts."* When proposing visual or layout changes, render a quick visual first; don't ask the user to commit to a verbal description.

- **Prioritised feedback over exhaustive feedback.** Lead with a 3-5 item ranked priority list, not a 20-point audit. *"I agree with all the priority recommendations"* came back quickly when the structure was clear.

---

## Part 6 — Sustainability features A–J

Each feature exists to prevent a specific class of regression. The first four are live or half-live today. E–J are the planned roadmap that Ruri picks up post-Claude-Design.

### A. Schema drift detection (BUILD)
- `parse_schema.py` fails the build if any curated `main_table` is missing in the parsed source.
- Warning emitted if FK count moves >20% between runs (saved hash in `build/.last_fk_count`).
- **Status**: planned (half-implemented — missing-table check exists; FK delta is next).

### B. Curation governance (PROCESS)
- `mapping.<profile>.json` is the single source of truth for business knowledge.
- Linter script `lib/lint_mapping.py` (to be added) checks:
  - Every `main_tables[]` entry exists in schema
  - Every urusan stage references real tables
  - Every category has a `letter` field (kept in JSON for future re-introduction config-only)
  - `version` and `last_updated` are set
- Edit workflow: create a PR with the mapping change + linter pass before merge.
- **Status**: planned.

### C. Profile system (CURRENT)
- Profiles named `mapping.<state>.json`, currently `mapping.melaka.json`.
- Build command: `python build.py --profile=<state>`.
- Output: `etanah_atlas_<state>.html` (e.g. `etanah_atlas_melaka.html`).
- Cross-profile consistency tooling is future work.
- **Status**: live for melaka.

### D. Versioning + provenance (CURRENT)
- mapping.<profile>.json carries `version` + `last_updated`.
- dataset.json forwards these into the HTML.
- About tab surfaces them so the team can spot stale files at a glance.
- **Status**: live.

### E. Lineage view (PLANNED)
- A fourth tab: a horizontal swimlane chart showing how one record (one application's data) flows over its lifecycle AWAM → PLP → Pendaftaran → Hasil → Pengambilan.
- Driven from existing `swimlane` field on tables + `urusan.stages[]` already in mapping.
- Solves the research-flagged "where does a record go" gap.
- **Status**: planned. Owner: Ruri after Claude Design pass.

### F. Fan-in centrality as second importance signal (PLANNED)
- `build_dataset.py` computes a fan-in centrality score per table at build time.
- New field: `tables[].fan_in_centrality: 0-100`.
- Logic layer surfaces "high centrality, not in `main_tables`" as a discreet "Curator should consider adding" list in the About tab.
- This is the auto-detect for curation drift: schema grows, system flags new important tables, you decide whether to promote.
- **Status**: planned.

### G. Schema field provenance (PLANNED)
- Optional `provenance` field on tables in mapping.json: a path to the Java entity class.
- Card renders a small "open in IDE" link (file:// URL) when present.
- Bridges the artifact to the running codebase.
- **Status**: planned. Owner: Ruri.

### H. Sensitivity (PII) flagging (PLANNED)
- New mapping section: `pii_tables: ["umm_a_pihak_bkptg", ...]`.
- Tables flagged get a small data-driven badge — color-coded, not glyph-decorative (respects no-card-clutter rule).
- BAs and auditors spot PII at a glance.
- Foundation for future data-governance features.
- **Status**: planned.

### I. Change log (PLANNED)
- `CHANGELOG.md` inside this folder.
- One line per substantive mapping or feature change.
- Auto-bump `last_updated` in mapping.<profile>.json on each commit (git hook).
- **Status**: planned. Trivial.

### J. Schema snapshot CI hook (PLANNED)
- A scheduled task / GitHub Action re-runs `python build.py` weekly against the live DB dump.
- Diffs the output dataset.json against the previous build.
- Posts a summary: new tables, removed tables, FK count delta. Files an issue if the diff is unexpected.
- **Status**: planned.

---

## Part 7 — Scale, reliability, trade-offs

### Capacity estimates

| Axis | Today | 12-month projection | Action threshold |
|---|---|---|---|
| Tables | 781 | 1000–1500 | At 1500: profile force layout; consider lazy data load |
| FKs | 2,146 | 3000+ | None — FK count is just data |
| State profiles | 1 (Melaka) | 3–5 | At profile #3: cross-profile consistency lint |
| Concurrent BAs editing mapping | 1 | 2–3 | At #2: PR workflow becomes mandatory |
| Single-file size | 427 KB | 800 KB – 1.5 MB | At 2 MB: split dataset into a sibling JSON file |

### Reliability
- Single-file static → no network failure mode possible.
- localStorage pinned positions → user's mental map survives reloads.
- Schema drift caught at build (feature A) OR at the runtime drag-drop dropzone.
- Failure mode if schema dump is invalid: drag-drop dropzone displays a parse error; previous good state persists in localStorage so the team isn't left without the tool.

### Trade-off analysis

| Decision | Pros | Cons | Mitigation |
|---|---|---|---|
| Single-file HTML over SPA | Email-shareable, offline, no infra | Large file as schema grows (~1.5 MB at 1500 tables) | At threshold, split dataset.json out, leave shell tiny |
| Vanilla JS over framework | Zero lock-in, framework-churn-proof | More bespoke code; no component lib | Layer seams compensate; surface is small |
| Curation in JSON, not DB | Versioned, diff-able, no infra | Manual edits | Linter + PR workflow (feature B) |
| Profile system from day 1 | Cross-state ready | More upfront thinking | Pays for itself at state #2 |
| Drag-drop re-parse client-side | No re-build for routine schema swaps | Two parsers (build-time Python + runtime JS) must stay aligned | Share regex constants via a generated JS-from-Python step (future) |
| Hand-curated `main_tables` | Domain expert decides what matters | Curation drift as schema grows | Fan-in centrality second signal (feature F) auto-flags candidates |
| Force-directed layout (custom) | Tuned for our specific node counts | O(n²); replace-or-rewrite at scale | Swappable via Seam 3; D3-force is a drop-in if needed |
| Output HTML inside folder | Project root stays clean | Build output filename carries profile suffix | Doc the convention; default profile = melaka |

### What I'd revisit as the system grows

| Threshold | Revisit |
|---|---|
| 1500+ tables | Force layout perf, dataset.json size, lazy-load architecture |
| 3rd state profile added | Cross-profile consistency tooling; shared-vs-per-state mapping split |
| 2+ BAs editing mapping simultaneously | PR workflow becomes hard requirement; linter mandatory in CI |
| First incident-investigation use case | Add a "deep-link to runtime tracer / log search" affordance per table |
| 12-month anniversary | Audit all docs for staleness |
| Original builder leaves project | Bus-factor test: can a teammate add a new urusan in <1 hour without help? |
| Schema dialect change (Oracle, MSSQL) | Sibling parser; this is Seam 1's purpose |
| Print needs change (A3, US Letter, B/W only) | Seam 4 absorbs it — pure CSS edit |

---

## Part 8 — Research findings (competitive + gaps)

### Is custom-built the right approach? Yes — for narrower reasons than table count.

Off-the-shelf tools (SchemaSpy, DbSchema, Luna Modeler, dbdocs.io, dbdiagram.io, Mermaid ERD) handle 781 tables fine. What they CAN'T do is your Modul + Urusan domain curation, the single-file email-shareable shape, and the Urusan Journey teaching view for BAs.

**Recommendation**: keep the custom shell, narrow the custom code. Vendor a tested SQL parser instead of hand-rolling regex. Treat the force-directed layout as a candidate for swap-out (e.g. D3-force, WebCoLa). Run SchemaSpy in CI as a complementary firehose view for devs who want the full graph.

### Content gaps the research surfaced

1. **Lineage view** — neither Map nor Urusan Journey answers *"where does a record go over its lifetime."* This is the biggest content gap. Added as planned feature E (Part 6).
2. **Auto-detect importance** — hand-curated `main_tables` will drift as schema grows. Add fan-in centrality at build time as a second signal (planned feature F).
3. **PII flagging** — Malaysian government data with no sensitivity layer is a future audit risk (planned feature H).
4. **Schema drift detection** — silent breakage when DB changes is unacceptable for a tool the team relies on (planned feature A).

### Top survival risks — all sub-day fixes

1. **Bus factor of 1 on `mapping.melaka.json`** — only Ridhwan can confidently edit it. Mitigation: add linter (feature B) + a CONTRIBUTING-style guide (one paragraph in README).
2. **No governance / change history on the curation file** — no audit trail. Mitigation: CHANGELOG.md (feature I).
3. **No PII flagging** — Mitigation: feature H.
4. **No schema drift detection** — Mitigation: feature A.

### Notable competitor patterns worth borrowing

- **DataHub / Amundsen** — data catalogs separate by *ownership* and *freshness*, not just by structure. Could be a future axis.
- **dbdocs.io** — generates Markdown docs alongside the visual. Worth considering as a complementary output (the same dataset.json could feed a static Markdown export).
- **Atlas (Liquibase)** — schema migrations as code. Tangential but useful precedent for state-portable schema tooling.

---

## Part 9 — Open design questions

These are areas where design input would genuinely help — pass them to Claude Design alongside the Part 10 contract.

1. **Dark-mode legend strip** — the color chips can be hard to distinguish against the dark surface. Worth testing a different border + tint balance.
2. **Discoverability of double-click** — without an on-card affordance, first-time users may not know they can drill in. The help bar mentions it but is easy to skim past. Could a card hover state hint at it?
3. **Swimlanes empty-column treatment** — currently empty lanes auto-collapse, but for Pelupusan view this leaves only 3 active columns (AWAM, Internal, Decision) with Registry absent. Is "the Registry column disappears entirely" the right signal, or should the user see a placeholder explaining that Pelupusan main tables never end up in Registry?
4. **Bands mode density** — even with category cohesion, the canvas can feel crowded for the Pelupusan view (10 main tables + 9 anchor children = 19 cards). Worth thinking about a "zoom out for overview / zoom in for detail" affordance, or a card-density tuning.
5. **Print layout** — currently A4 landscape, side panel hidden, controls hidden, single-column. The map renders at viewbox aspect, may not fully use the page. Could benefit from a dedicated print-friendly layout.
6. **Mobile / narrow viewport** — under 1100 px, the side panel stacks below the canvas. Under 720 px the controls go vertical. No actual mobile testing done; the team treats this as desktop-first.
7. **Urusan Journey side-by-side comparison** — when comparing 3 urusans, the columns get cramped at narrow widths. Could be a horizontal-scroll layout, or a different "common-stages vs unique-stages" structure.
8. **Accessibility audit** — color contrast pairs, focus visible state on cards, keyboard navigation, screen reader labels. None systematically reviewed yet.

---

## Part 10 — Claude Design contract: LOCKED vs UNLOCKED

This is the contract you paste at the top of a Claude Design session so it knows what it can and cannot change.

### LOCKED (do not redesign, do not even propose changes)
- The 4-layer architecture (Part 2)
- The 4 seam contracts (Part 2)
- The profile system (mapping.<state>.json structure)
- The 3-tab IA (Map / Urusan Journey / Search) — additions are allowed; removals require a sustainability review
- The Bands + Swimlanes dual-mode toggle — both stay; toggle persistence stays
- Sustainability features A–J (Part 6)
- The captured user preferences (Part 5)
- Single-file shippable property
- Vanilla JS / no-framework constraint

### UNLOCKED (Claude Design owns these)
- All visual styling (style.css)
- Card design — shape, fill, type — but constraint: data-driven decoration ONLY, no decorative glyphs
- Color tokens — new tokens fine, but must keep the three axes (modul / category / layer)
- Typography
- Layout details — Bands clustering tuning, swimlane visual treatment, FK arrow style
- Hover / focus / active / drag / dim states
- Animation and transition design
- Print layout (Seam 4)
- Empty state and loading state design
- Tab bar, controls bar, side panel chrome
- Help bar copy

### What Claude Design CANNOT add
- Decorative glyphs inside card body (no letters, no chevrons, no icons that aren't data-driven)
- Behavior that violates the seam contracts (e.g. visual layer computing visible nodes)
- Hard-coded modul or urusan styling (use category color tokens)
- New top-level views without sustainability review
- CDN dependencies, external fonts, framework imports

---

## Part 11 — Post-design Ruri scope + structural-change definition

### What Ruri picks up after Claude Design's visual refresh

- Refine `detect_category` patterns in `build_dataset.py`
- Add new categories, moduls, urusans to mapping.<profile>.json
- Implement the **Lineage view** (feature E)
- Implement **schema drift detection** (feature A) FK delta hash
- Implement **fan-in centrality** (feature F)
- Implement **PII flagging** (feature H)
- Implement **CHANGELOG** auto-update (feature I)
- Wire **provenance** to Java entity files (feature G)
- Tighten the runtime SQL re-parser to stay aligned with the Python parser
- Add a `lib/lint_mapping.py` validator (feature B)
- Add the **schema snapshot CI hook** (feature J)

### What Ruri MUST NOT do

- Touch shell.html or style.css (visual layer)
- Add code that breaks Seam 2 or Seam 3 contracts
- Hard-code state-specific behaviour outside the profile system
- Add decorative glyphs to cards
- Rename stable dataset.json fields without a version bump + migration shim

### Definition — "structural change"

A change is **structural** (requires architectural review) if it does any of:
- Breaks a seam contract (Part 2)
- Adds a new top-level tab
- Adds a new file under `config/` that isn't a state profile
- Changes the build pipeline (`parse → dataset → assemble`)
- Adds a third-party runtime dependency
- Adds a third-party build dependency outside Python stdlib
- Changes the single-file-shippable property
- Adds state-specific logic outside the profile system
- Renames a stable dataset.json field
- Adds a CDN/external fetch

Everything else is **routine** — edit `mapping.<profile>.json` (data layer) or one of the three `src/` files within its layer (logic OR visual, never both).

### The single-question check for any future change

> *"If we make this change, what other change will it force somewhere else in 6 months?"*

If the answer is *"nothing — it's contained to its layer,"* ship it.
If the answer is *"we'll need to also update X, Y, Z,"* redesign until the answer is *"nothing."*

That is the sustainability tenet, operationalised. Engraved.

---

## Part 12 — Build pipeline + coupling map

### File roles

```
   source/et_main_uat.sql      (source of truth — auto-derived data)
          │
          ▼   lib/parse_schema.py
   build/schema_parse.json     (regenerated per build)
          │
          ▼   lib/build_dataset.py     (combines auto-derived + curated)
                    ←   config/mapping.<profile>.json  (curated; survives schema changes)
                        │  - modul list with prefixes
                        │  - main_tables per modul
                        │  - urusan workflow stages
                        │  - anchor blurbs
                        │  - categories with color tokens
                        ▼
                   build/dataset.json
                        │
          ▼   lib/assemble_html.py
                    ←   src/shell.html
                    ←   src/style.css
                    ←   src/app.js
                        │
                        ▼
        etanah_atlas_<profile>.html       (the shipped artifact)
```

All paths are resolved from `build.py`'s location at runtime — `pathlib.Path(__file__).resolve().parent`. Move the whole `etanah_atlas/` folder anywhere and `python build.py` still works.

### File ownership

| File | Owns | Edit when |
|---|---|---|
| `source/et_main_uat.sql` | All tables, columns, FKs, schema comments | Schema export refreshed |
| `config/mapping.<profile>.json` | Modul→prefix mapping, main tables per modul, urusan stages, anchor blurbs, categories | Business knowledge changes |
| `lib/parse_schema.py` | Extracting facts from PostgreSQL SQL dump | New SQL dialect — write a sibling parser |
| `lib/build_dataset.py` | Merging schema + mapping into the runtime dataset | New derived field |
| `lib/assemble_html.py` | Combining src + dataset + mapping into single HTML | Build pipeline change |
| `src/shell.html` | Page skeleton: tabs, dropdowns, dropzone | New view added |
| `src/style.css` | All visual styling, dark mode, print CSS | Visual redesign (Claude Design surface) |
| `src/app.js` | All interaction: layout, rendering, filters, drill-down, drag-drop SQL | New interaction, bug fix (Ruri surface) |
| `build/*.json` | Generated intermediates | Never edit by hand; safe to delete |

### Routine changes — what to edit

| What changed | Edit only this | Then run | No code edit? |
|---|---|---|---|
| New table appeared in production schema | New SQL → `source/` | `python build.py` | Yes |
| New foreign key | New SQL → `source/` | `python build.py` | Yes |
| New Modul launching | `config/mapping.melaka.json` — add `moduls[]` entry | `python build.py` | Yes |
| New urusan to support | `config/mapping.melaka.json` — add `urusans[]` entry | `python build.py` | Yes |
| Curate main tables for a Modul | `config/mapping.melaka.json` — edit `main_tables` array | `python build.py` | Yes |
| Schema comment correction | New SQL export | `python build.py` | Yes |
| Rename a Modul label | `config/mapping.melaka.json` — edit `label` | `python build.py` | Yes |
| Change Modul color | `config/mapping.melaka.json` — edit `color` / `color_bg_*` | `python build.py` | Yes |
| Profile for another state | New `config/mapping.<state>.json` | `python build.py --profile=<state>` | Yes |

The page also supports **drag-drop SQL refresh** in the browser without any rebuild: open the About tab, drop a new `.sql` file. The mapping/curation stays put.

### Less common changes — code edits required

| What changed | Edit here |
|---|---|
| Switch SQL dialect (PostgreSQL → Oracle) | Write `lib/parse_schema_oracle.py` mirroring `parse_schema.py`. Hook into `build.py`. |
| Add a new top-level tab/view | `src/shell.html` (add tab button + section), `src/app.js` (add render function, hook tab switcher). |
| Modify drill-down behavior | `src/app.js` → `toggleExpand`, `visibleNodes`. |
| Modify force-directed layout | `src/app.js` → `forceLayout`. |
| Add a new column on table cards | `config/mapping.*.json` for data, `src/app.js` to render, `src/style.css` for visual. |
| Export-to-PNG / Mermaid | `src/app.js` new function + button in `src/shell.html`. |
| Internationalisation of UI labels | New `config/i18n.json`, `src/app.js` to consume. Schema comments stay native. |

### Coupling points to remember

1. **First-match-wins prefix ordering** — `detect_modul` in `build_dataset.py` iterates moduls in order; specific moduls win over `shared`/`operations` catch-alls.
2. **Lookup-bus exclusion** — `rjk_senarai_ahli_kumpulan` is excluded from FK graph (huge fan-in, drowns out the signal).
3. **Regex-only SQL parser** — `parse_schema.py` doesn't tokenise; complex SQL constructs may break it. Pluggable via Seam 1.
4. **LocalStorage pin keys per modul** — pinned positions persist per modul, not globally. Switching modul resets layout to auto.
5. **Print CSS active-view** — only the currently-active view prints. Switch tab before printing.
6. **_a_ / _p_ substring detection robustness** — relies on `_a_` or `_p_` appearing inside the table name, not as a separate field. Be careful if naming conventions change.

---

## Part 13 — How to use this handbook with Claude Design

A clean Claude Design session — `/design:design-critique`, `/design:design-system`, `/design:accessibility-review`, or `/design:design-handoff` — won't have any of the conversation history that built this thing. Boot it like this:

**Step 1 — open a new Claude conversation** (Claude Code, Cowork, web — anywhere with the design skills).

**Step 2 — paste this entire file** as the first message, plus a sentence saying what you want.

**Step 3 — attach 2–4 screenshots** of the current state: Map in Bands mode, Map in Swimlanes mode, Urusan Journey view, the dark-mode equivalent of whichever is most relevant. Attach the live `etanah_atlas_melaka.html` if the agent has file access.

**Step 4 — name the scope clearly.** Examples:

> *"Run `/design:design-critique` on the screenshots focused on usability and visual hierarchy. The Bands/Swimlanes toggle decision is open — I want a second opinion on whether keeping both is the right call or whether one should win."*

> *"Run `/design:accessibility-review` against this. We've never tested for WCAG. Priority 1 = color contrast, Priority 2 = keyboard navigation. Output a punch list with severities."*

> *"Use `/design:design-system` to audit consistency. The colors live in `mapping.melaka.json` and `style.css`. I'm worried about hex value drift between the two."*

> *"Use `/design:design-handoff` to produce a developer-ready spec sheet of the Map view components. The team uses vanilla JS + CSS variables, no framework."*

**Step 5 — share the response back.** If Claude Design proposes changes, the actual implementation happens in `etanah_atlas/src/*` and `etanah_atlas/config/mapping.melaka.json` — see Part 12 above for the coupling map (what edits are config-only vs code).

---

## File map for the reviewer

| File | What it owns |
|---|---|
| `etanah_atlas_melaka.html` (in folder) | The shipped artifact — load in browser to see live state |
| `etanah_atlas/HANDBOOK.md` | **This file** — single source of truth |
| `etanah_atlas/README.md` | Build instructions only |
| `etanah_atlas/src/shell.html` | Page skeleton — every visible structural element |
| `etanah_atlas/src/style.css` | All visual styling, theme tokens, print CSS |
| `etanah_atlas/src/app.js` | All interaction logic — layout, render, drag, drill, search |
| `etanah_atlas/config/mapping.melaka.json` | Modul list, main tables, urusans, categories with their color tokens |
| `etanah_atlas/lib/{parse_schema,build_dataset,assemble_html}.py` | Build pipeline |
| `etanah_atlas/source/et_main_uat.sql` | Schema source |
| `etanah_atlas/etanah_atlas_bundle.zip` | Shareable bundle (all source files) |

---

*Profile: melaka · Handbook version: 1.0 · Last updated: 2026-05-21*
