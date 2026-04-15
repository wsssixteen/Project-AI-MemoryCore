# Quest Handoff — QA #255773 (mid-Phase 0)

**Written**: 2026-04-15 ~12:45 MPST, **updated 2026-04-15 ~17:10 MPST** (afternoon session: confirmed pemohon table + H1 via SQL, traced wrong-class-pivot, need throw-site probe).
**Status**: Phase 0 still — read-path architecture resolved, write-path root cause narrowed to "SPOC threw early before `populateAppPihakBerkepentinganList`". No code touched.

---

## Ticket

- **Env**: FAT
- **Urusan**: Semua Urusan (all affected)
- **ID Permohonan**: `PTMLK/02/L/PLPS/2026/11`
- **Tugasan**: SKM (Semakan Kebenaran Masuk)
- **Symptom**:
  1. Portal AWAM submission complete through payment.
  2. SKM Step 1 (Senarai Semakan) — documents show.
  3. SKM Step 2 (**Maklumat Pemohon**) — "Tiada rekod dijumpai". ← the bug
  4. SKM Step 3 (Maklumat Tanah) — records show.
- **Expected**: "maklumat pemohon perlu papar pada tugasan SKM **tanpa perlu initiate**".
- **Prior history**: Previous fix added 35s delay at start of all flowables. Still missing data → rework.

## Unknowns (must resolve before coding)

1. **What does "initiate" mean?** Button? Manual workflow trigger? Re-open? Need to ask or find in screenshots.
2. **Who starts the Flowable process instance `MLK_PLP_PLPS`?** AWAM backing bean calling `startProcessInstanceByKey`, scheduled poller, or DB-level trigger? Grep both AWAM and Pelupusan repos for `startProcessInstanceByKey`.
3. **What table does `MlkMaklumatPemohonForm.xhtml` (Step 2) actually read from?** Pemohon likely lives in `umm_a_pihak_bkptg` or `umm_a_penyerah` — NOT `umm_a_pemohon` (that table does not exist in FAT schema — verified against `MLKFAT/et_main.sql`). Authoritative answer requires grepping the pelupusan code for the backing bean of `MlkMaklumatPemohonForm`.

## Hypotheses (held open — no evidence yet)

| # | Hypothesis | Evidence needed to confirm |
|---|---|---|
| **H1** | `SpocIntegrationService` silently swallows an exception (line 120-124 `catch (Exception ex) { LOGGER.debug(ex); }`) after partial `_p_ → _a_` copy. Pemohon rows never land. | DB row check: `_p_` populated, `_a_` empty for `PTMLK/02/L/PLPS/2026/11`. Log-level raised to DEBUG to catch the swallow. |
| **H2** | `SpocIntegrationService` ran cleanly but `MlkMaklumatPemohonForm` backing bean queries the wrong table / wrong join / wrong filter. Data is in DB, view just can't see it. | Direct SQL against the actual table the bean queries. If row exists → view/query bug, not integration bug. |
| **H3** | Flowable process instance never started OR started with wrong variables, so `SpocIntegrationService` service task never fired on this permohonan. | `ACT_HI_PROCINST` / `ACT_HI_TASKINST` lookup by business key `PTMLK/02/L/PLPS/2026/11`. |

**H1 is now leading** — SQL confirmed `_p_ umm_p_pihak_bkptg` has SITI MAISARAH row (flag_pemohon=Y) for `aplikasi_id=3028105` but `_a_ umm_a_pihak_bkptg` is empty. SPOC copy failed.

## Afternoon session findings (2026-04-15 PM)

### Read-path architecture (resolved)
- **PLU officer view (SKM Step 2)** → `MlkMaklumatPemohonForm.java:129` → delegates to `maklumatPemohonHelperForm.initPemohon()` → `PelupusanMaklumatPemohonHelper.initPemohon()` at `etanah-pelupusan/.../helper/PelupusanMaklumatPemohonHelper.java:1790`
- **Smoking gun lines 1821-1822**: `getPelupusanSearchService().findAppPihakBerkepentinganByAplikasi(aplikasiPelupusan)` → reads `umm_a_pihak_bkptg` keyed on internal `aplikasi_id`.
- **Wrong-class-pivot I made mid-session**: read `PelupusanMaklumatPemohonHelperForm.java` in **etanah-awam** first (MODULE-ARCHITECTURE.md warning about awam rendering triggered confirmation bias). That class is the AWAM portal view, NOT the SKM Step 2 view. Applied Ritual 3 RESET, re-read, corrected. Documented as a verify-before-claim failure — knowing the warning existed was not the same as verifying the class in hand.
- **Two near-identical class names exist** — added to DATABASE.md §2b so future-me doesn't repeat the confusion.

### Write-path — SPOC copy failure confirmed, throw site narrowed
- `SpocIntegrationServiceTask` **did fire** — `umm_a_tgsn` has 1 row for `aplikasi_id=3028105`.
- **Empty SPOC copy targets**: `umm_a_hkmlk` (0), `umm_a_pihak_bkptg` (0), `umm_a_dok_keluaran` (0), `umm_a_permohonan_tnh` (0)
- **Populated via other paths**: `umm_a_penyerah` (1), `umm_a_dok_kmskn` (3)
- Four copy targets all empty → `populateAndCreateAppEntry` in `PelupusanSpocService.java:130` threw early, swallowed at `SpocIntegrationServiceTask.java:120-124` (`catch (Exception ex) { LOGGER.debug(ex); }`). DEBUG-level = invisible in normal logs.
- **Throw site is upstream of** `populateAppPihakBerkepentinganList` at line 150, not inside `populateAppPihakBerkepentingan` inner mapper (lines 1314-1440) which I initially focused on.
- `URS_PLPS` is NOT in `URUSAN_WITHOUT_PRA_LIST` (`PelupusanUrusanConstant.java:131-133`) — normal Branch A path applies.
- Class is `@Transactional` (line 36) — if anything threw, the whole unit rolls back. Partial successes mean `penyerah`/`dok_kmskn` are written by a different path (not this service).

### Candidate root causes (hypothesis language — none proven)
- **RC-1 (leading)**: Early populate call in `populateAndCreateAppEntry` threw; swallowed. Need ordered call list (re-read lines 130-260).
- **RC-2**: Lazy-init / detached session on FK resolution inside one of the populate mappers (e.g., `new Alamat(...)` at line 1377 pulls `SenaraiAhliKumpulan` FK entities).
- **RC-3**: `praAplikasi` resolution at line 80 returned null (no retry loop on that lookup, unlike AliranKerja at 54-63) → Branch A `praAplikasi != null` guard fell through. Less likely because `penyerah` exists.

### Miya's diagnostic data (recorded for next session)
- SITI MAISARAH row in `umm_p_pihak_bkptg`: `p_pihak_bkptg_id=4591`, `jns_pihak_bkptg_id=625`, `flag_pemohon=Y`, `umur=41`, has alamat + alamat_srt + emel, `jns_pengenalan_id` is BLANK, `jns_no_id=452`, `mklmt_tmbhn={"tarafKerakyatan":"TRF_KRYT_WNG","lamaTinggalDiMukimTahun":"31","flagSurat":"true"}`
- Earlier Miya SQL confusion: `p_aplikasi_id=4617` is from `umm_p_aplikasi`, different namespace from internal `aplikasi_id=3028105`. Always use internal id for `_a_` probes.

## What's been done (updated)

- ✅ Read brief (`Brief.txt` only — scope discipline).
- ✅ Full inventory-first read of all 7 etanah-knowledge/melaka files (test of new hard rule).
- ✅ Read `SpocIntegrationServiceTask.java` lines 1-140 — retry loop (54-63), praAplikasi resolve (80), copy call (89), silent swallow (120-124).
- ✅ Read `PelupusanSpocService.populateAndCreateAppEntry` lines 130-403 — 3 branches mapped; Branch A is the PLPS path.
- ✅ Read `PelupusanMaklumatPemohonHelper.java:1790-1910` — confirmed `_a_` read path keyed on `aplikasiPelupusan`.
- ✅ SQL probe confirmed `_p_` has row, `_a_ pihak_bkptg` empty → H1 leading.
- ✅ SQL sibling-table probe narrowed throw site to early in `populateAndCreateAppEntry`.
- ✅ DATABASE.md §2b updated with authoritative pemohon answer + helper-vs-helperform warning.
- ✅ Inventory-first rule enshrined (CLAUDE.md + quest-protocol.md + `feedback_inventory_first.md`).

## Next session — first three actions (in order)

1. **Re-read `PelupusanSpocService.java` lines 130-260** → extract ordered list of populate calls inside `populateAndCreateAppEntry`. First populate in sequence is the most likely throw site.
2. **SQL probe of `umm_p_hkmlk` / `umm_p_permohonan_tnh` for `p_aplikasi_id=4617`** → confirm the `_p_` source rows exist. If `_p_` is also empty for these, throw might be NPE on missing source, not copy logic.
3. **Either** (a) Eclipse remote-debug breakpoint on `SpocIntegrationServiceTask.java:121` in FAT, resubmit PLPS, read `ex` live; **or** (b) temporary log-bump: patch line 121 to `LOGGER.error("SPOC swallow", ex)` on FAT deploy. (a) is cheaper if FAT debug access is available.

**Do NOT** propose a fix until the exception is captured. Code reading has hit its limit — the swallow makes code-only analysis insufficient.

## Ruled out / don't re-chase

- ❌ `umm_a_pemohon` — table does not exist. Pemohon lives in `umm_a_pihak_bkptg` with `flag_pemohon='Y'`.
- ❌ H3 (flowable never started) — `umm_a_tgsn` has row, process instance fired.
- ❌ `populateAppPihakBerkepentingan` inner mapper (lines 1314-1440) as the throw site — upstream populate threw first, never reached line 150.
- ❌ AWAM-side `PelupusanMaklumatPemohonHelperForm` as the read path — that's the portal view, not SKM Step 2.
- ❌ "35 seconds delay" path — prior fix already tried this and failed.
- ❌ H2 (wrong query/table in read path) — PLU helper confirmed reading correct table.
