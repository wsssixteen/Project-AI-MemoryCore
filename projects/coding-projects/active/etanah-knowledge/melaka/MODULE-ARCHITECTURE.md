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
*Filled from confirmed-knowledge tickets only — blank cells = not yet evidenced. Framework-skeleton-then-grow rule.*

| Package | Purpose | Key Classes (confirmed) |
|---|---|---|
| `config` | Spring `@Configuration` classes | <!-- TODO --> |
| `constant` | String keys / kod codes / dispatch maps | `PelupusanConstant`, `PelupusanWordCCMethodConstant`, `MlkPelupusanTugasanConstant`, `TablePrefixConstant` |
| `enumeration` | Enum types | <!-- TODO --> |
| `helper` | Composite-backing bean helpers (shared logic for `*Form` beans, often `@ManagedBean` themselves) | `JabatanTeknikalHelper`, `PelupusanExcelReaderHelper`, `PelupusanMaklumatPemohonHelper` |
| `integration` | Cross-system bridges | <!-- TODO --> |
| `locator` | Spring service locator beans | `commonServiceLocator` (used to fetch services from `etanah-common`) |
| `parameter` | Method parameter DTOs | <!-- TODO --> |
| `repository` | Hibernate Spring Data repositories | <!-- TODO --> |
| `service` | Business logic services (interface + Impl) | `ISenaraiKumpulanService` |
| `serviceTask` | Flowable BPMN service-task handlers | <!-- TODO — Flowable tickets reference but no class confirmed --> |
| `strategy` | kodDokumen → strategy resolution (Strategy pattern) | `MlkPelupusanPenyediaanSuratStrategy`, `PelupusanSuratStrategy`, `MlkPelupusanSuratStrategy`, `CommonPLPandBGNSuratStrategy` |
| `util` | Stateless utility classes | `PelupusanWordEditorUtil`, `PelupusanTemplateUtil` |
| `vo` | Page-state carrying VOs (passed between Bean / Helper / Service layers) | `AppJabatanTeknikalVO`, `PelupusanPermitVO`, `PelupusanWCCTableVO` |
| `web` | JSF Managed Beans — composite backing + page controllers | `MlkUlasanJPPHForm`, `PelupusanPermohonanTanahPlmsTabForm`, `PelupusanTanahRizabTabForm` |

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

### Word populator binding — TEXT mode inherits CC's rPr; VO-array mode embeds its own styles (added 2026-06-03, QA-247707)

**Plain explanation**: A Word content control's runtime appearance (bold / strikethrough / colour) depends on which CC-type the populator returns.

| Populator returns | CC-type set | Where styles come from |
|---|---|---|
| `String` | `WordContentControlTypeEnum.TEXT` | The CC's own `<w:rPr>` in the .docx — populator only fills the *text*, never the format |
| `List<PelupusanWordStyleVO>` | `WordContentControlTypeEnum.PELUPUSAN_WORD_STYLE_VO_ARRAY` | Each VO carries its own `.setBold()` / `.setStrikethrough()` / etc. — overrides the CC's rPr |

**Implication for rebinding** (the QA-247707 case): if you change a CC's tag to a NEW populator that returns TEXT instead of the old VO-array, **inline styles that the old VO baked in (bold, italic, strikethrough) disappear** unless you also set them in the CC's `<w:rPr>` in the .docx. Confirmed example: Item 5.2 in `TemplateRisalatMMKN_PDT_PRZ.docx` lost its bold when rebound from `keputusanKertasKerjaDO_Lower` (VO-array, bold-via-VO) → `syorKeputusanPTG` (TEXT). Fix: bold the run in Word UI so the CC's rPr carries `<w:b/>`.

**Detection**: when rebinding a CC from a `*StyleVOArray` populator to a TEXT populator, verify the CC's run formatting in Word UI matches the previous visual output. The .docx XML's `<w:rPr>` inside the SDT is the truth.

---

## Layer Map

**The chain** (confirmed end-to-end from QA-260302 + QA-260965 + QA-259759 work):

```
JSF XHTML (composite / page)
  ↓ EL binding (#{cc.attrs.mb.<getter>}, #{cc.attrs.mb.<field>})
ManagedBean (web.form.* — typically *Form class)
  ↓ delegation
Helper (helper.* — *Helper class, often @ManagedBean too)
  ↓ commonServiceLocator OR SpringUtil.lookupBean(IService.class)
Service (service.* — IService interface)
  ↓ @Autowired Impl
Repository (repository.* — Spring Data JPA)
  ↓ JPQL / HQL
Hibernate Entity (etanah-common: my.gov.etanah.domain.*)
  ↓ @Table / @Column annotations
Postgres DB (et_main_uat / et_main / mlit / mlkfat)
```

**Side-branches off the chain**:

| Branch | Source layer | Purpose |
|---|---|---|
| Constants | `constant.*` | Loaded by Bean/Helper/Util for kod codes, dispatch keys, content-control tag names |
| VOs | `vo.*` | Carried between Bean ↔ Helper ↔ Service; survives Ajax lifecycle as JSF view-state |
| Utils | `util.*` | Stateless helpers (Word rendering, template loading) — called from Helper or Service |
| Strategies | `strategy.*` | Dispatched by Bean/Helper via kodDokumen lookup — returns concrete strategy bean |
| Locators | `locator.*` | Gateway from `etanah-pelupusan` to `etanah-common` services |
| ServiceTasks | `serviceTask.*` | Flowable BPMN engine callbacks — outside the JSF chain, fires on workflow transitions |
| Configs | `*.config.json` files | Parsed at startup (e.g. `template.config.json`, `tindakan.config.json`); consumed by Strategy + Helper layers |

**Cross-module dependency**:
- `etanah-pelupusan` (this module) → depends on → `etanah-common` (entities, base services, validators) + `etanah-awam` (some shared composites and report displays)
- Entity classes live in `etanah-common` (Maven dependency), source-extractable to `C:/temp/etanah-src/my/gov/etanah/domain/`

---

## Bean-Type Conventions

**Naming conventions** observed across pelupusan codebase (confirmed via QA-260302 + QA-260965 + QA-259759 + QA-260876):

| Suffix / Pattern | Layer | Role | Example |
|---|---|---|---|
| `*Form` | `web.form.*` | JSF Managed Bean — page or composite controller; holds VOs + selection state; called from XHTML via `#{cc.attrs.mb.*}` | `MlkUlasanJPPHForm`, `PelupusanPermohonanTanahPlmsTabForm` |
| `*Helper` | `helper.*` | Shared composite-backing bean — multiple `*Form` beans delegate to one Helper for cross-cut logic | `JabatanTeknikalHelper`, `PelupusanMaklumatPemohonHelper`, `PelupusanExcelReaderHelper` |
| `*Builder` | `web.form.*.builder` or `helper.*.builder` | VO assembly — wraps multi-step VO construction | <!-- TODO — pattern observed but no class cited yet --> |
| `I*Service` / `*ServiceImpl` | `service.*` | Business logic — interface + Impl pair, `@Autowired` into Helper/Form via `SpringUtil.lookupBean` or `commonServiceLocator` | `ISenaraiKumpulanService`, `IPermohonanService` |
| `*Constant` | `constant.*` | Static keys / dispatch maps — never instantiated | `PelupusanConstant`, `PelupusanWordCCMethodConstant`, `MlkPelupusanTugasanConstant` |
| `*VO` | `vo.*` | Page-state carrier — passed between layers, survives Ajax lifecycle | `AppJabatanTeknikalVO`, `PelupusanPermitVO`, `PelupusanWCCTableVO` |
| `*Util` | `util.*` | Stateless helper — Word rendering, template loading, no managed-state | `PelupusanWordEditorUtil`, `PelupusanTemplateUtil` |
| `*Strategy` / `*StrategyImpl` | `strategy.*` | Strategy pattern impl — dispatched by kodDokumen lookup | `PelupusanSuratStrategy`, `MlkPelupusanSuratStrategy` |

**🚨 Naming trap — filename match ≠ backing bean** (QA-260302, 2026-05-14):
A composite XHTML file `mlkUlasanJPPHForm.xhtml` does NOT necessarily bind to a class `MlkUlasanJPPHForm.java` even if the names match. Composites use `<composite:interface><composite:attribute name="mb"/>` — the actual backing bean is whatever the parent page passes as `mb="#{...}"`. Check the parent's EL binding, NOT the filename. See [JSF-WIRING.md](JSF-WIRING.md) for the worked example.

## Bean-Type Conventions (added 2026-05-14 after QA-260302 filename-match slip)

Class-name suffixes carry meaning. Understanding these prevents the "filename matches → bean must be the backing pair" trap.

| Suffix | Role | Bound to | Lifecycle | Examples |
|---|---|---|---|---|
| `*Form` (`@ManagedBean @ViewScoped`) | Direct-screen managed bean | A specific XHTML under `protected/.../*.xhtml` — that XHTML's `<ui:param name="mb" value="#{<beanName>}"/>` directly references it | One per screen; per-view session | `MlkUlasanJPPHForm` (standalone form @ `protected/mlk/common/MlkUlasanJPPHForm.xhtml`); `MlkJabatanTeknikalTerlibatForm` (parent screen for "Jabatan Teknikal Terlibat" langkah) |
| `*Helper` (POJO, NOT a managed bean) | State + getter/setter container passed AS the `mb` attribute INTO composites | A composite's `composite:attribute name="mb"` — parent screen instantiates the helper and passes via `mb="#{...helper}"` | Created/owned by the parent ManagedBean; lives in `helper/` package | `JabatanTeknikalHelper` (passed as `mb` to `mlkUlasanJPPHForm` composite + 4 other JT-related composites); `PelupusanMaklumatPemohonHelper`; `PelupusanMaklumatBayaranHelper` |
| `*Builder` | Factory / construction-state object | Used by Helpers during init | Transient | `PelupusanMaklumatPemohonHelperBuilder` |
| `*Service` (`@Service`, Spring) | Business logic + transaction boundaries | Injected via Spring; called from beans/helpers | Singleton | `PelupusanService`, `PelupusanSearchService` |
| `*Constant` | Static codes / constants | Imported across the codebase | Static class | `PelupusanConstant`, `PelupusanUrusanConstant`, `MlkPelupusanTugasanConstant` |
| `*VO` | Value Object — pure data holder | Used inside Java services; serialized into JSON for `maklumat_tambahan` | Transient | `JabatanTeknikalVO`, `PelupusanMaklumatPemohonVO` |

### 🚨 Filename match ≠ Backing bean (the trap)

A composite XHTML (e.g. `mlkUlasanJPPHForm.xhtml`) and a managed bean (e.g. `MlkUlasanJPPHForm.java`) can share a name but serve DIFFERENT roles. The composite has a generic `mb` attribute; the bean is the backing for a specific standalone XHTML (different file in `protected/` tree).

**To find the actual backing class for a composite usage**: grep the composite tag name in `/src/main/webapp/protected/.../*.xhtml` — each occurrence shows `mb="#{...}"`. The EL path resolves to the actual class. The class with matching FILENAME is usually only the backing for the STANDALONE form, not the composite.

**Full QA-260302 example** captured in `JSF-WIRING.md` (search "naming trap").

## DB Source-of-Truth Routing Tables (added 2026-05-14)

When a question is "which tugasan mounts which XHTML / langkah" — the source-of-truth is DB tables, not Java code or BPMN:

| Table | Purpose | Key columns |
|---|---|---|
| `ind_skrin` | Screen registry (XHTML view paths) | `skrin_id`, `kod_skrin`, `jsf_view`, `nama_aplikasi` |
| `ind_langkah` | Langkah↔Tugasan↔Screen binding | `langkah_id`, `kod`, `nama`, `skrin_id` (→ ind_skrin), `tgsn_id` (→ ind_tgsn), `turutan` |
| `ind_tgsn` | Tugasan definition | `tgsn_id`, `kod`, `nama`, `ursn_id`, `peranan` |

Canonical queries documented in `DATABASE.md` section 6.0.

## Entry Points
<!-- Main JSF pages and their backing managed beans -->

## Entry Points
<!-- Main JSF pages and their backing managed beans — TODO: requires broad sweep -->

## Key Services
<!-- Core business logic classes and what they do — TODO: requires broad sweep -->

> *Entry Points / Key Services sections deliberately left as skeleton — populating these requires a systematic codebase sweep that hasn't been done yet. Grows from ticket evidence per framework-skeleton-then-grow rule.*

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
| `etanah-pelupusan` | Primary dev module — Melaka pemberi-milikan, pajakan, etc. (PT, PSBS, PLPS, MCL, PLTP, PRZ, etc. urusan) | リドワンさん's main codebase |
| `etanah-awam` | Shared/common module — owns certain borang/report displays + applicant-portal flows (Siasatan Tanah Pembangunan) | Not yet synced locally |
| `etanah-common` | Shared utilities, validation, exception handling, **cross-module entity classes** (e.g., `AppLaporanTanah`, `AppLaporanTanahRepository`) + shared DB schema definitions | Popup validation lives here |
| `etanah-teknikal` | Technical-side module — owns Siasatan Tanah, Maklumat Plot, Laporan Tanah panels filled by JT (Jabatan Teknikal) / technical officers. Writes to `tkl_*` tables (e.g., `tkl_a_laporan_tnh`). **Separate web-app deployment from pelupusan** | Not yet synced locally; pelupusan cannot directly render teknikal UI components |

> ⚠️ Some report displays that appear to be in pelupusan flows are actually rendered by `etanah-awam`. Always check module ownership before investigating report/display bugs.

### Reading "skrin teknikal" in BA briefs — DON'T confuse with pelupusan UI (QA-260508 slip, 2026-06-02)

When a BA brief says **"tarik dari skrin teknikal medan X"** (pull from the teknikal screen the X field), they're naming the **data source location**, NOT asking for a teknikal screen to be embedded in pelupusan. The teknikal screen lives in the `etanah-teknikal` module (separate deployment); pelupusan can only READ the underlying data via:
- Shared DB tables prefixed `tkl_*` (e.g., `tkl_a_laporan_tnh.kedudukan_tanah`)
- Cross-module entity classes in `etanah-common` (e.g., `AppLaporanTanah`)
- Repositories in `etanah-common/.../repository/teknikal/` (e.g., `AppLaporanTanahRepository.findByAplikasi`)

**What BA is saying** when they list a `tkl_*` column like `kedudukan_tanah::json->>'zone'`: that column IS the field officers fill on a teknikal-side screen, and pelupusan should pull a DEFAULT/initial value from there into a pelupusan-side field. **What BA is NOT saying**: "add a Zone display row to pelupusan UI" — unless their screenshot explicitly shows one.

**Rule**: when BA references a teknikal table column as a "source" for a pelupusan-side enhancement, the pelupusan UI gets the enhancement (per Expected #1), and the column is the read-path; do NOT also add a separate display field for the source column unless BA's screenshot shows it.

> **Slip class** (QA-260508 2026-06-02): I added a Zone display field to pelupusan panels after reading "tarik dari skrin teknikal medan Zone" as "display Zone too". BA's screenshot showed only Pengkelasan, no Zone. Correct read was: Zone is the teknikal-side column where Pengkelasan's data lives — pull it into Pengkelasan's default, don't render Zone separately.

## Reports Team Workflow (Melaka)

| Item | Detail |
|---|---|
| Who handles reports | Dedicated **reports team** — separate from pelupusan dev |
| Technology | **Jasper Reports** (template-based, not Word/Docx) |
| When to escalate | Any ticket involving borang display, report layout, or print output that isn't a Word template — check if it's Jasper first |
| Trigger phrase | "borang tidak papar" / display issues on printed output → ask: is this awam? is this Jasper? |

> リドワンさん has not done Jasper Reports yet (as of 2026-04-03). Treat as unknown territory.

---

## Architecture decision — handling vestigial-AJAX outlier buttons (QA-262495, 2026-06-02)

### Pattern
Most `<et:commandButton>` in this codebase follow the standard JSF chain: **button → AJAX postback → bean/VO method → Hibernate/Spring lifecycle → response → DOM update**. Server-side work is the load-bearing part.

A minority of buttons are **outliers**: they do their real work in `onclick=` (pure JavaScript — e.g. `launchWordEditor`, `window.print`, OS-level URI schemes), yet still carry a JSF AJAX postback with **no `actionListener` / no `action`** — only a token `update=` to a small status dialog. The postback is **vestigial**.

On forms with heavy view-state, the vestigial AJAX still runs the full JSF lifecycle (RestoreView → … → RenderResponse), which can take many seconds. The user perceives "stuck" even though the actual work has already happened client-side.

### The decision
**For pelupusan forms exhibiting this pattern, the appropriate fix is a form-scoped client-side click-interceptor in `<o:onloadScript>`:**

```xml
<o:onloadScript><![CDATA[
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[id$="<outlier-button-id>"]');
        if (!btn) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        var origOnclick = btn.getAttribute('onclick');
        if (origOnclick) {
            try { new Function(origOnclick).call(btn); }
            catch (err) { console.error('<context>: onclick failed', err); }
        }
        // re-implement any oncomplete side-effects (e.g. PF('xxx-widget').show())
    }, true);  /* capture phase — runs BEFORE PrimeFaces native handler */
]]></o:onloadScript>
```

### Why not other approaches

| Approach | Rejected because |
|---|---|
| `ajax="false"` on the button | Button lives in `etanah-common` shared composite — modifying affects every state (SGR/TRG/Melaka); violates TRG-hard-exclusion |
| Pelupusan-side composite override (drop a tweaked copy into `etanah-pelupusan/.../resources/`) | Maven WAR overlay wins but affects every pelupusan form mounting that composite — broader blast |
| Skip AJAX server-side (no-op action method) | JSF lifecycle still runs all 6 phases regardless of action presence |
| **Capture-phase click-interceptor on the affected form (chosen)** | Scope = exactly one form · reversible by removing one tag · doesn't touch shared composites · consistent with the button's existing client-side design intent |

### When to apply
1. Button has no `actionListener` / no `action` (verify via sibling-matrix per JSF-WIRING.md)
2. Button's real work is in `onclick=` (pure JS / OS URI scheme / browser-native)
3. AJAX `update=` target is small status panel, not load-bearing UI
4. User perceives "stuck" because JSF cycle blocks UI feedback, not because the action itself failed

If any of 1–4 doesn't hold, the AJAX is doing real work and must NOT be bypassed.

### Reversibility
Removing the `<o:onloadScript>` tag from the affected form restores original behaviour. No data, schema, or shared-component changes.

### Precedent
First applied: QA-262495 (PPJK Semakan Risalat MMKN-PDT, `MlkKertasTemplateForm.xhtml`, kemaskini-button). Sibling-matrix in JSF-WIRING.md → kemaskini was the only button in penyediaanDokumen action group without an actionListener.

---
*Last updated: 2026-06-02 — added vestigial-AJAX outlier-button decision (QA-262495)*
