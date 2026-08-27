# Etanah Atlas — SPEC (miya's stated requirements, binding)

> Every rule here was stated by miya between 2026-08-22 and 2026-08-27. This file is the
> conformity reference for ANY Atlas change: read it BEFORE editing, re-check the touched
> rows AFTER. A change that violates a row without miya's explicit nod is a defect.
> Companion docs: HANDOVER.md (orientation) · HANDBOOK.md (contracts) · atlas-ship-gate (enforcement).

## 1. Truth rules (the DON'T-LIE set)

| # | Rule | Origin |
|---|---|---|
| T1 | Every "verified" claim names its MODE: synthetic-DOM / real-render / hit-test / DB-read. UI claims REQUIRE real render (headless Edge screenshot or real browser events) — synthetic `.click()` green is NOT proof | 2026-08-22 unusable-overlay rage |
| T2 | Never sample when a census is possible: enumerate the FULL set (DB query / jar scan) first; agents trace, never enumerate | 2026-08-23 "no pilot data" = lying |
| T3 | Name-prefix / keyword match is NEVER module-relatedness evidence — code-truth scan (`build/code_usage.json`) decides | 2026-08-22 prefix-as-relatedness |
| T4 | Implicit (no-FK) links are REAL relations: detect by name-match, verify by orphan-count query, show dashed, save to DATABASE.md §10b | 2026-08-22 initial goal ("PLEASE PLEASE PLEASE TAKE NOTE") |
| T5 | Muting/dimming must be TRUE: an urusan filter includes the workflow spine (umm_aplikasi · ind_ursn · umm_a_tgsn · ind_tgsn · umm_a_pihak_bkptg) — "MCL has no ind_ursn" class of lie is banned | 2026-08-27 |
| T6 | A checker that silently SKIPs counts as NO check — geometry/behavior gates must always run (smoke T6a/T6b) | 2026-08-27 overlap claim |
| T7 | Screenshots shared as proof after every UI change; ship_check (smoke + real render + per-tab barcode) must PASS before any session stops (atlas-ship-gate) | 2026-08-22 |

## 2. Design rules (NO BLOAT)

| # | Rule | Origin |
|---|---|---|
| D1 | Zero redundant explanation text on pages — no help bars, no interaction tutorials, no per-category legend rows | 2026-08-27 Map audit |
| D2 | ONE inspection surface: table details live in the Tables focus (Overview / Appears in / Columns). Every table name anywhere (Map card, Journey stage chip, catalog row, feature chip, column hit) CLICKS THROUGH to it | 2026-08-24 separation of concerns + 2026-08-27 |
| D3 | Controls: ONE row per view — no orphan-wrapped buttons ("Print" alone on its own row is a defect) | 2026-08-27 |
| D4 | Dropdowns/inputs standardized — shared CSS for all selects and search inputs; no unstyled stragglers | 2026-08-24 "I thought I've already asked to standardize" |
| D5 | Focused table's name lives IN the search input, not a separate title row; Back sits far right of the sub-tab row, only in focus | 2026-08-24 |
| D6 | Focus mode fills the viewport below the sticky header; scrolling down hides sub-tabs + search; EQUAL gaps above and below at max scroll (measured --hdr-h, 10px + 10px) | 2026-08-24 |
| D7 | Map = 10-second modul overview: whole ERD fits ONE screen (SVG scales to fit, never blows up), deterministic swimlane layout, overlap impossible by construction. **Tables is the FIRST tab and the landing view; Map is third** | 2026-08-27 |
| D8 | No persistent layout state (localStorage pins BANNED — root cause of broken Bands); drag is session-only | 2026-08-27 |
| D9 | Filters never clash: a filter that hides all results says "N hidden by filters", and category exceptions (e.g. shared modul) are explicit | 2026-08-24 "your filter is fucking broken" (rjk_organisasi) |
| D10 | Default code scope = pelupusan (miya decision pending on pelupusan+common); scope filter visible on the Diagram landing, not only in focus | 2026-08-23 |

## 3. Content rules (what the Atlas must answer)

| # | Rule | Origin |
|---|---|---|
| C1 | Tables tab: search-to-diagram, column search across ALL tables, FK + implicit links with toggles, housekeeping off by default | 2026-08-22 initial goal |
| C2 | By Urusan: census-backed (1,433 tugasans from ind_tgsn→ind_langkah→ind_skrin, NOT hand-picked pilots); per-tugasan LOADED/SAVED badges where traced; untraced states say so explicitly | 2026-08-23 |
| C3 | By Feature: the 12 DB-verified feature groups (etanah-codemap feature_tables.json) | 2026-08-24 handover |
| C4 | Urusan Journey: all 13 urusans, BPMN-verified decision forks (Lulus/Tolak/Tangguh per real gateway evidence), unhappy paths noted | 2026-08-22 goal B |
| C5 | Every table shows: entity class, used-by-code badges, PK, comment; sidebar tabs Overview / Appears in / Columns with the columns list VISIBLE | 2026-08-24 |
| C6 | Stage/fork tables must exist in schema (build-time WARN + smoke check) | 2026-08-22 goal C |
| C7 | The Journey's curated stages are an ABSTRACTION — every urusan ALSO carries the full BPMN tugasan sequence (every userTask + callActivity, sub-processes expanded, census kod/peranan joined, no-match flagged honestly) as a collapsible layer; derived by `lib/build_journey_seq.py`, gated by smoke T6c | 2026-08-27 "you're missing many Tugasan" |

## 4. Verification ledger (2026-08-27 100% interaction sweep — all real-browser events)

41 element groups tested, all PASS: 4 main tabs · theme toggle · Map modul select (11 opts) ·
Map urusan select (13 + clear, spine never dimmed) · layer seg ×3 · print map · card drag
(transform + edges follow) · card click→Tables · 4 sub-tabs · table suggest (+ keyboard
ArrowDown/Enter) · suggestion pick→focus · tf-back · column suggest (12 hits)→hits list ·
hits row click→focus · scope select (7→11 neighbors on ind_versi_dhd) · family select ·
implicit toggle (drops ind_mklmt_hkmlk ⇢link exactly) · housekeeping toggle · sidetabs ×3 ·
4 "View" modals open+close (button, X, Esc) · focus neighbor click re-focuses ·
diagram-empty goto links ×2 · catalog filter/modul/layer/scope/spoc-chip/hk-chip/reset/row
click · By Urusan urusan+tugasan selects (detail card, 20 dimmed + 18 LOADED/SAVED badges) ·
urusan chip click · By Feature select (14) + chip click · Journey picker ×13 · fork buttons ·
compare chips ×13 · print journey · journey stage chips→Tables (added this pass) · About
dropzone (synthetic .sql drop re-parsed: "1 tables · 0 FKs") · preview-modul empty message.

*Created 2026-08-27 per miya: "save every spec that is discussed and said out clearly by me
into the project md file so that you do not keep on fucking up and follow that spec."*
