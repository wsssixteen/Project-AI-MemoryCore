# Current Session

## What's loaded
2026-07-09 (Thu) — **QA-269437 shipped + Phase 2 archived**.

Continuation from summarized transcript. Two bugs + one bundled UX fix shipped as commit `75cb5446ed` on `mlk/esokongan/269437`. Phase 2 archived same day.

**Session arc — QA-269437 close-out**:
1. Resumed Bug 2 investigation (Papar Borang shows 16/8 vs DB 30/8) after context-continuation
2. Spawned save-side probe at `PelupusanLiteService.populateAppPermitLesen():1041` — proved VO=30/8 reached the setter
3. **pg-node timestamp NULL trap** — 4 cycles of DB queries returned `trkh_akhir: null` when row actually held `20-AUG-26`; the `::text` cast broke the false trail. DB was fine all along
4. Populator probe at `PelupusanReportMethodConstant.populateTarikhAkhirPermitLesen():1350` — DID NOT fire on Papar → proved the fresh-regen path was silently bypassed by the stored-cache fork
5. Root cause: `PelupusanReportUtil.processReport():292-311` — when `appDokumenKeluaran.status=PERAKU + dok_id=NULL` (Aaron's orphan row from 07-JUL), fell into stored branch → `retrieveReportVOList` returned empty content → Jasper engine served stale in-JVM cached rendering (16/8)
6. **v1 orphan-fix regressed** — I opened regen path but left `currentAction=PERAKU` which `processInputParameter():412` treats as invalid config action → early-returns empty param map → borang fields all blank. Rule captured: trace ONE method-depth into both fork branches before claiming safety
7. **v2 fix (shipped)** — nullify `appDokumenKeluaran` when `getDocument()==null` at entry to `processReport()`, so `updateCurrentActionIfNotAvailable` reclassifies to CREATE. Config audit across all 25 report entries proved cross-urusan safety
8. **Unilateral deferral slip** — flagged auto-recompute-tempoh as "BA-Q for separate ticket" during Rubric. みや caught it → had to bundle after the fact. Rule captured: `feedback_bundling_before_defer.md` (boot-loaded via MEMORY.md)
9. Auto-recompute `MlkPenyediaanBorang4CeP1eForm.onChangeTarikhAkhirPermit():214-238` bundled + wired via listener at `MlkPenyediaanBorang4CeP1eForm.xhtml:130`
10. Phase 1 close-out: probes stripped, branch cut, staged diff reviewed by みや, commit `75cb5446ed` pushed to `origin/mlk/esokongan/269437`
11. Phase 2 archive same day: Task folder → `Archive\`, project subfolder → `archive/`, active.txt block → `active-archive.txt`, KPI entry + post-mortem written

**Files touched — 3, +34/−1**:
- `etanah-pelupusan/src/main/java/my/gov/etanah/pelupusan/util/report/PelupusanReportUtil.java` (+5): orphan-nullout at `PelupusanReportUtil.processReport():288-291`
- `etanah-pelupusan/src/main/java/my/gov/etanah/pelupusan/web/form/utiliti/mlk/MlkPenyediaanBorang4CeP1eForm.java` (+28/−1): Bug 1 null-guard at `MlkPenyediaanBorang4CeP1eForm.initData():109-111` + new method `MlkPenyediaanBorang4CeP1eForm.onChangeTarikhAkhirPermit():214-238`
- `etanah-pelupusan/src/main/webapp/protected/mlk/utiliti/MlkPenyediaanBorang4CeP1eForm.xhtml` (+1): listener attribute on tarikhTamat2 at `:130`

**Test scenarios passed** (みや on `PTMLK/02/L/OPRBB/2026/1` stg2 as `norlina@melaka.gov.my`):
- Simpan `tarikh_tamat=30/08` → F5 → screen shows 30/8 (Bug 1 fixed)
- Papar Borang 4Ce → PDF shows `berakhir pada 30/08/2026` (Bug 2 fixed, probe fired first time at 11:23:32)
- Edit Tarikh Tamat → Tempoh auto-updates (bundled bonus)

## ▶▶ NEXT SESSION — START HERE

### 🟢 QA-269437 — SHIPPED + ARCHIVED
Fix `75cb5446ed` on `mlk/esokongan/269437` (pushed). Phase 2 fully archived: folder → `Archive\90.`, project subfolder → `archive/QA-269437/`, active.txt block → `active-archive.txt`. Bounty NOT auto-logged this cycle (skip if BA hasn't tested on stg deploy yet).

### 🟡 #268883 + #269169 — awaiting BA test (from yesterday's session, still open)
Fix `42a0a7d226` on `mlk/esokongan/268883v2` (pushed). Phase 2 archive DEFERRED until BA green-lights.

### 🟢 QA-268637 cycle-3 — DONE
Shipped `b4c54c0a1b` on `mlk/esokongan/268637v3` yesterday. Already archived.

### Environment
Staging **et_main_stg2** (172.30.12.202:5444). Local JBoss on stg2 config. UAT DB was down earlier this week.

### Deferred / follow-up for other quests
- Cross-urusan orphan-dokumen audit — PRBB, PPJK, PRU, PPTPB apps with `status_id IS NOT NULL AND dok_id IS NULL` — the PelupusanReportUtil fix covers the code path but pre-existing orphans should be swept (raise as separate ticket next time we touch Papar Borang for a non-OPRBB urusan)
- Tempoh↔TarikhTamat coupling UX — shipped auto-recompute as pragmatic default; BA-Q whether option (b) warning icon or (c) freeze-tempoh-readonly is preferred

### Framework insights harvested this cycle
- `pg-node` silently returns `null` for Oracle-format timestamp strings (`20-AUG-26 00:00:00`) unless cast to `::text`. Save the pattern — cost 4 cycles of wrong-direction diagnosis
- `AppPermitLesen.tarikhAkhir` maps to `TRKH_AKHIR` (verified via `javap -p -v` on the etanah-domain JAR — bytecode constant pool #225/#230). No `updatable=false`, pure field access getter
- `PelupusanReportUtil.processReport():292-311` fork: `reportActionMap` per config entry, orphan `dok_id=NULL` = failure class blocking Papar regen. 25-entry audit table saved in QA-269437 post-mortem
- `PLP_PRBB_TEMPOH_HARI` / `_BULAN` kods shared between URS_PRBB + URS_OPRBB (reference-data reuse)
- v1 orphan-fix regressed because I stopped tracing at the fork — the LESSON captured in `feedback_bundling_before_defer.md` (well, adjacent lesson — the actual bundling rule) + post-mortem trace-depth memo

## 🎯 Session Recap (for AI restart)

**Duration**: ~4 hours (2026-07-09 08:30 → 12:54 +0800)
**Quests worked**: 1 (QA-269437 shipped + Phase 2 archived same-day)
**Commits landed on origin**: 1 (`75cb5446ed` on `mlk/esokongan/269437`)
**Session slips**: (1) v1 orphan-fix regressed due to stopping trace at the fork — see post-mortem. (2) Unilateral BA-ask deferral forced two test rounds instead of one — captured in `feedback_bundling_before_defer.md`. (3) pg-node NULL trap on Oracle timestamps sent me down wrong root-cause direction for 4 cycles — captured in framework insights.

**Memory Type**: RAM | **Last Activity**: 2026-07-09 12:54 +0800 — Domain Expansion in progress.
