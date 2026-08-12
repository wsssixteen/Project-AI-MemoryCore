# etanah-knowledge / melaka — Navigation Index

> Entry point for all Melaka etanah knowledge files.
> Load this at Quest Phase 0 to select which files overlap the ticket's symptom.
> Each file has a **SCOPE** and **NOT FOR** blockquote at the top — read those first.

---

## Knowledge Files

| File | Scope (one-line) | Use when… |
|---|---|---|
| [DATABASE.md](DATABASE.md) | PostgreSQL schema — table names, column names, `_p_`/`_a_` layer semantics, SQL patterns · **§9.1 document → physical file path (et_main ↔ et_dms)** · **§15 capaian pengguna — "capaian penuh" vs per-urusan rows** | Any DB query, SQL investigation, table/column lookup, **"where is this document's file on the server"**, **an officer missing from an Agihan Kepada / next-user dropdown** |
| [FLOW-TRACES.md](FLOW-TRACES.md) | Verified breakpoint traces — UI→Bean→Service→Repo→DB happy paths | Need to know actual execution flow through the stack |
| [PERMIT-LESEN-RUNNING-NUMBER.md](PERMIT-LESEN-RUNNING-NUMBER.md) | Permit/Lesen data model (app-side `umm_a_permit_lesen` vs registry `ind_permit_lesen`+children) · the **No LPS running number = `sis_no_turutan` counter** (`<pej>BRG_4AE<year>`, `+1`, NOT max — delete never rolls it back) · No-LPS creation at PYB4AE · cleanup-script safety + Aaron's "ind_permit_lesen = permanent" rule | Anything about No Lesen / No LPS / permit numbering, "does deleting reset the running number", cleanup of accidental permit numbers, `sis_no_turutan` |
| [JASPER-REPORTS.md](JASPER-REPORTS.md) | Jasper pipeline — `BaseReportService` fill methods (SQL-in-jrxml vs Java datasource), template resolution + state folders, `$F{}`/`$P{}`/`$V{}`, subreport wiring, uuid→DocumentController serving | A report shows a wrong/unformatted value and you must decide **ours vs Reports team**, or you need to change a report from Java |
| [BRANCH-AND-DEPLOY.md](BRANCH-AND-DEPLOY.md) | Branch topology (nothing ever merges into `mlk/master`; ticket branch forks to `int-env`/`stag-env`/`release/<ver>`) + the deploy pipelines, incl. §5a the TRAINING lane and its merge order (training→int-env FIRST, release→training SECOND) | You need to get a fix onto MLIT, MLKSTAG or TRAINING, or you need to know whether a branch has actually shipped. Use `/deploy` rather than re-deriving |
| [ENV-ARCHITECTURE.md](ENV-ARCHITECTURE.md) | The Melaka server map for OUR modules only — per-env app tier, build box, deploy VM, DB endpoint, public URL, for MLKIT / TRAINING / STAGING / PROD. Source: the `ETANAH ARCHITECTURE - MLK` sheet, read 2026-08-06 | You need an IP, a hostname, a schema or a deploy target and are about to guess one. Answers "which box does our WAR land on" and "which DB is `et_main_trn`" — the latter shares a host with staging |
| [GIT-REPO-HYGIENE.md](GIT-REPO-HYGIENE.md) | Local-clone faults that are not code faults — §1 case-insensitive ref collision on fetch (the mechanism, why `packed-refs` needs its own cleanup step, the applied exclusion lists, the rollback) | A git error looks like a broken repo or a lost branch; a fetch reports the same branches `[deleted]` then `[new branch]` every time; git suggests `refs migrate --ref-format=reftable` (**never run it — it breaks Eclipse**) |
| [JSF-WIRING.md](JSF-WIRING.md) | XHTML EL expressions → managed bean map, PrimeFaces component → listener wiring · **§`et:formField` ↔ child component-type contract** (viewOnly vs `for=` bindings; how to make a field display-only; readonly/disabled/outputText submission table) | XHTML or UI layer bug; tracing `#{bean.method}` from page to Java; **"make this field view only"**; **a postback dying in RestoreView with zero `my.gov.etanah` frames** |
| [WORD-TEMPLATE-RENDERING.md](WORD-TEMPLATE-RENDERING.md) | `.docx` template SELECTION (`flageDoket` × `jnsPemohon` → 4 twins per document) + where the selector values live in the DB + spacing-is-template-static rule + deploying a template with no rebuild + **§4 KNOWN ISSUE: inline CC + TABLE population → invalid docx → "Sedang Dikemaskini" spinner hangs / Word won't open** | Any `.docx` ticket: **before editing a template** (which twin actually renders?), signature/spacing complaints, "the fix didn't show after I edited the template", **any Kemas kini/Jana loading-spinner-hangs / Word-won't-open report → §4 first** |
| [MODULE-ARCHITECTURE.md](MODULE-ARCHITECTURE.md) | Package structure, 298 files, ~10K methods, module boundaries | Cold-start orientation; locating which package/class owns a feature |
| [FLOWABLE-WORKFLOWS.md](FLOWABLE-WORKFLOWS.md) | BPMN process names, service task class bindings, Flowable naming conventions | Any flowable/workflow/process bug; BPMN process lookup |
| [FLOWABLE-KNOWLEDGE.md](FLOWABLE-KNOWLEDGE.md) | 🚨 **eTanah×Flowable ARCHITECTURE** (engine-verified): the et_main↔et_flowable17 bridge (3 links), `proc_inst_id_` vs `process_instance_id_` column trap, the start→task→submit→migrate→alter lifecycle, routing variables (`pembetulanMB`/`aliranKerjaId`/`nextUser*`), InitiateBPMFlowableForm 5-action map, orphan failure mode + recovery, **page-vs-SQL-patch rule** | **MANDATORY before CHANGING/UPDATING any Flowable/BPMN state** — a stuck workflow, re-init, alterFlow, a patch touching `umm_aliran_kerja`/`umm_a_tgsn`/`umm_tgsn_semasa`/`act_*`, or a `.bpmn` edit. Auto-required by `knowledge-first-gate` v2 flowable-change branch |
| [BUG-BESTIARY.md](BUG-BESTIARY.md) | Confirmed bug patterns with root cause evidence — grows ticket-by-ticket | Check before proposing any fix — may already be a known pattern |
| [DOMAIN-GLOSSARY.md](DOMAIN-GLOSSARY.md) | Malay↔English term mapping, module codes, urusan KODs, tugasan names | Unknown Malay term; looking up urusan/tugasan code |
| [TEST-PERMOHONAN-INDEX.md](TEST-PERMOHONAN-INDEX.md) | Past-ticket test data — id_permohonan + aplikasi_id by urusan + tugasan · **No Resit Carian Rasmi for AWAM** (4 validations + jenis-hakmilik×urusan table + ready query) | Before creating fresh test data; "do we already have an app at this tugasan?"; **any AWAM ticket needing a No Resit** |
| [DEFERRED-CRITICAL-ISSUES.md](DEFERRED-CRITICAL-ISSUES.md) | Critical issues discovered + deferred during past tickets — scope creep, time pressure, blocked on upstream | **MANDATORY at Phase 0** — cross-check against current ticket's scope_anchor; surface as Standing Flag if any deferred item touches current ticket's surface |
| [ADHOC-REGISTER.md](ADHOC-REGISTER.md) | Non-ticket asks already investigated — BA/colleague questions, screen issues みや hit, side findings. One row each: symptom · verdict · confidence · findings doc · `Ticket` (`none` = still un-ticketed) | **MANDATORY at Phase 0** — compare the new ticket against every `Ticket = none` row; on a match, promote the row and start from its findings instead of re-Scouting. `domain/adhoc-register/` injects the open rows automatically. Also the first read when みや asks *"did we look at something like this before?"* |
| [DEV-TESTING-HACKS.md](DEV-TESTING-HACKS.md) | Local dev/test environment procedures — rahsia-bypass, AWAM test-data shortcuts · **🚨 local BUILD/DEPLOY failures**: `NoClassDefFoundError org/hibernate/HibernateException` (missing `jboss-deployment-structure.xml` from the etanah-common overlay), the Maven-3.9.9-vs-3.8.2 + `.m2_etanah` trap, toolchains.xml wrong-JDK | **Any local server that won't start / won't deploy**, before diagnosing from scratch — みや has ALWAYS already tried Maven Update + Clean + Republish |

---

## 🚨 Knowledge-first rule (2026-07-20, per miya)

**Read this folder BEFORE reading code or querying the DB.** Any etanah question — a term, a table, a validation rule, a test-data shape — check the file whose SCOPE covers it first. Only fall through to grep/codegraph/SQL when the answer genuinely is not here.

Token cost is the reason: a knowledge lookup is a few hundred tokens; a code trace is tens of thousands. It is also the accuracy reason — what is written here was verified once and survives; a fresh trace can stop halfway and report a partial rule (see the 2026-07-20 allow-list/deny-list slip in TEST-PERMOHONAN-INDEX).

**After any code/DB investigation that produced a reusable fact, write it back here** so the next lookup is cheap.

---

## Context Files (cold-start artifacts — load at session start)

> Location: `context/` subfolder. Generated once, regenerated when codebase changes significantly.

| File | What it is | Status |
|---|---|---|
| `context/deps.txt` | `mvn dependency:tree` output — all JAR versions | ⬜ Blocked — Maven CLI can't reach Nexus from office machine |
| `context/repo-map.md` | Repomix output — full file tree + all Java class contents | ✅ Generated 2026-04-20 |
| `context/schema.sql` | Full DDL for et_main — copy from `Database\Melaka\MLKFAT\et_main.sql` | ⬜ みや to copy manually |
| `context/db-schema.md` | FK relationship map — PLU tables + IND reference chain | ✅ Generated 2026-04-20 (1,287 total FKs, PLU-focused subset) |

---

## Cross-Reference Quick-Links

| "I need to know…" | Go to |
|---|---|
| Which table stores X | [DATABASE.md §3 Prefix Legend](DATABASE.md#3-table-prefix-legend-et_main) |
| **Where the actual FILE for a document lives** (server path) | [DATABASE.md §9.1](DATABASE.md#91-finding-a-documents-physical-file-path-on-the-server) — `aplikasi` → `umm_a_dok_keluaran` → `skg_dok.id_dok` → `et_dms.dokumen` → `dokumen_revision.lokasi_fail` |
| How `_p_` vs `_a_` works | [DATABASE.md §2](DATABASE.md#2-application-flow----_p_-vs-_a_-layers) |
| All PLP tables | [DATABASE.md §5.8](DATABASE.md#58-full-plp-module-table-list-confirmed-via-db-query-2026-04-20) |
| Who owns a Java class | [MODULE-ARCHITECTURE.md](MODULE-ARCHITECTURE.md) |
| Why a bug pattern keeps repeating | [BUG-BESTIARY.md](BUG-BESTIARY.md) |
| What `PRBB`, `PLTP`, `PSBS` mean | [DOMAIN-GLOSSARY.md](DOMAIN-GLOSSARY.md) |

---

*Last updated: 2026-07-24 — DATABASE.md §9.1 added (document → physical file path, et_main ↔ et_dms)*
*Generated from planning session — architecture mapping + context pipeline upgrade*
