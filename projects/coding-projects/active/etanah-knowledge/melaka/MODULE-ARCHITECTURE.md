# Melaka — Module Architecture
*Primary knowledge file for etanah-pelupusan (Melaka state)*

> **SCOPE**: Package structure of etanah-pelupusan, module boundaries (pelupusan vs awam vs common), inter-module ownership rules (e.g. reports team, Jasper), class/method counts.
> **NOT FOR**: Specific bug patterns, individual Java method anatomy, SQL schemas.

## Codebase Stats
- **Files**: 298 (indexed 2026-03-24)
- **Classes**: 295
- **Methods**: 10,160
- **Interfaces**: 89
- **Enums**: 9
- **Knowledge graph**: 23,890 nodes / 57,863 edges

## Package Overview
<!-- Populate from codebase-memory-mcp graph queries + manual reading -->

| Package | Purpose | Key Classes |
|---|---|---|
| `config` | | |
| `constant` | | |
| `enumeration` | | |
| `integration` | | |
| `locator` | | |
| `parameter` | | |
| `repository` | | |
| `service` | | |
| `serviceTask` | | |
| `strategy` | | |
| `util` | | |

---

## Architectural Patterns

### Template injection — parent template + external `references/` child doc (added 2026-05-13)

**Plain explanation**: Some Word templates display content that doesn't live in the main `.docx` file — it's injected at render time from a SEPARATE child `.docx` sitting in the `references/` folder. The child doc carries its own font/size/bold properties; those override whatever the parent template would have applied at the injection slot.

**How the injection works**:

| Component | Role |
|---|---|
| Parent template (e.g. `TemplateRingkasanRisalatPLTP.docx`) | Has a slot CC tag (e.g. `jabatanTeknikalPLTP`, `paragraphPTGPRU`) — empty placeholder for injected content |
| Populator method (in `PelupusanWordCCMethodConstant.java`) | Returns `PelupusanWCCTableVO { externalPath = child.docx, externalTableTag = "section name", rows = [...] }` |
| Child template (in `src/main/resources/template/MLK/references/`) | Holds the actual content + styling. Its CCs nest under section markers (e.g. `paragraphPTGPRU`, `jabatanTeknikalPLTP`) |
| Render time | Framework loads child doc → finds matching section CC → copies content into parent's slot → applies populator's `rows` to fill inner CCs |

**Confirmed instances** (2 so far):
- `additionalJKKLParagraph.docx` — JKKL paragraph injection (QA-247710, 2026-05-12)
- `JabatanTeknikal.docx` — JT table + Ulasan YB row injection (QA-260876, 2026-05-13)

**Implications for fixes**:
- Font/style issues at injection slots → fix in the CHILD doc, NOT the parent
- Inner CCs of injected content are filled ONLY via populator's `rows` list — global `wordContentControlMethod` dispatch does NOT reach inside injected sections
- When tracing what fills a CC inside an injected slot, look at: (1) which populator returns the slot's TableVO, (2) what rows that populator adds

**File:line references**:
- Populator dispatch map: `PelupusanWordCCMethodConstant.java` (search for `wordContentControlMethod.put(...)`)
- Pattern populators: `populatePTGParagraph_*` (~line 15917+, QA-247710), various JT-table populators
- Child docs: `src/main/resources/template/MLK/references/*.docx`

**Why this matters**: failing to recognize this pattern at Phase 0 costs Cp E/F debugging time when "parent template font change didn't take" or "CC tag in main template renders as literal placeholder". The first read on any template ticket should check whether the affected cell sits inside an injected slot.
| `vo` | | |
| `web` | | |

## Layer Map
<!-- How the layers connect: UI → Bean → Service → Repository → DB -->

## Entry Points
<!-- Main JSF pages and their backing managed beans -->

## Key Services
<!-- Core business logic classes and what they do -->

## Patterns Found

### Penyediaan Surat (Letter Preparation) — Strategy Pattern

Two strategy tiers control Word document generation:

| Tier | Class | What it does |
|---|---|---|
| **Router** | `MlkPelupusanPenyediaanSuratStrategy` (Mlk-specific, `@NegeriBasedBean(MELAKA)`) | Returns list of `BaseJenisPenyediaanSuratStrategy` — one per document type |
| **Strategy** | `CommonPLPandBGNSuratStrategy` (etanah-common) OR `PelupusanSuratStrategy`/`MlkPelupusanSuratStrategy` (etanah-pelupusan) | Each handles one kodDokumen — template lookup, CC tag population |

**Two strategy classes — NOT interchangeable:**

| | `CommonPLPandBGNSuratStrategy` | `PelupusanSuratStrategy` |
|---|---|---|
| Module | etanah-common | etanah-pelupusan |
| Template source | Hardcoded `kodDokemenNamaTemplateMap` | `TemplateConfig` JSON (`template.config.json`) |
| CC tag system | Manual `insertValueForContentControlForAlamat2()` | CC method map (`PelupusanWordCCMethodConstant`) |
| Alamat JT tag | `"alamatJT"` | `"alamatJabatanTeknikal"` |
| Supported docs | SN_JPPH, SRTJK_ULGN, SMPG only | All docs in template.config.json |

> **Trap**: Adding a kodDokumen to the wrong strategy = silent failure (null template or wrong CC tag populated). Always verify which tag the Word template actually uses.

## Related Modules

| Module | Role | Notes |
|---|---|---|
| `etanah-pelupusan` | Primary dev module — Melaka | リドワンさん's main codebase |
| `etanah-awam` | Shared/common module — owns certain borang/report displays | Not yet synced locally |
| `etanah-common` | Shared utilities, validation, exception handling | Popup validation lives here |

> ⚠️ Some report displays that appear to be in pelupusan flows are actually rendered by `etanah-awam`. Always check module ownership before investigating report/display bugs.

## Reports Team Workflow (Melaka)

| Item | Detail |
|---|---|
| Who handles reports | Dedicated **reports team** — separate from pelupusan dev |
| Technology | **Jasper Reports** (template-based, not Word/Docx) |
| When to escalate | Any ticket involving borang display, report layout, or print output that isn't a Word template — check if it's Jasper first |
| Trigger phrase | "borang tidak papar" / display issues on printed output → ask: is this awam? is this Jasper? |

> リドワンさん has not done Jasper Reports yet (as of 2026-04-03). Treat as unknown territory.

---
*Last updated: 2026-04-03*
