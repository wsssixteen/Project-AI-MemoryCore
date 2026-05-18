# 🌟 Current Session Memory - RAM

**Last session**: 2026-05-18 — QA-260302 code walkthrough (Java/JSF/architecture learning) → process-failure audit → 2 protocol Refines applied. Resume from "QA-260302 — STATE" below.

---

## QA-260302 — STATE (continue from here)

**Ticket**: Add smp/sehektar Unit dropdown to the JPPH Ulasan panel lot-row. 6 urusans.

**Phase 1 COMPLETE** — committed `5094c076c0` on branch `mlk/qa/260302` (etanah-pelupusan, E: drive). 7 files. Not merged to master (someone else does that).

### ⚠️ Defect #4 — OPEN (latent, source-traced 2026-05-18, NOT fixed)

The 3 variant composites bind `data="#{cc.attrs.mb.jenisUnitKadarNilaianSelectItems}"`. On the dispatcher route (`MlkMuatNaikCabutanMinitForm` / `MlkMaklumatCukaiPremiumForm` → `mlkUlasanJPPH.xhtml` → variant), `cc.attrs.mb` is the screen bean — which lacks the getter → `PropertyNotFoundException` when the panel renders. Getter exists only on `JabatanTeknikalHelper.java:602` + `MlkUlasanJPPHForm.java:549`.

**Fix planned** (needs env-check + Predicate Box + みや nod): add `getJenisUnitKadarNilaianSelectItems()` to `MlkMuatNaikCabutanMinitForm.java` + `MlkMaklumatCukaiPremiumForm.java`, mirroring `MlkUlasanJPPHForm.java:549`. Check first whether they share a base class — add once there if so.

### Test surfaces

- **File #1** generic composite — ✅ FAT-verified (PPJK/PJTLT, `PTMLK/02/L/PPJK/2026/9` — nazli@melaka.gov.my).
- **Files #2/#3** PLPS/PPJK variants + **#4** standalone — ⬜ untested. No app at any of KKMB/SKMB/SKMB2/PKMB or PN5A/PYN5A/SN5A/PSKP/PYSKP/SSKP in UAT OR FAT (queried 2026-05-18) → need flowable-alter.
- Sequencing: fix defect #4 BEFORE testing #2/#3 (they use the dispatcher route). #4 standalone is testable independently — its getter exists at `MlkUlasanJPPHForm.java:549`.

### NEXT ACTIONS

1. Fix defect #4 — the 2 screen beans. env-check + Predicate Box first.
2. Flowable-alter an app to a 388-skrin tugasan (PN5A/PSKP) → test the standalone page.
3. Then KKMB → PLPS/PPJK variants.

### Key refs

`mlkUlasanJPPH.xhtml` (router) · `JabatanTeknikalHelper.java:602` · `MlkUlasanJPPHForm.java:549` · `PelupusanConstant.java:278` · `JabatanTeknikalVO.java:47` (etanah-common — `unitKadarNilaian` field, pre-existing) · early-diagnostic: `projects/coding-projects/active/QA-260302/early-diagnostic.md`

---

## QA-260316 — STATE ⚠️ CONTINUE TESTING FIRST THING TOMORROW (wait for みや's signal — tomorrow may include other work)

**Ticket**: AWAM PLPS, Langkah Bayaran — fee shows 0.00, should show 50.00 (100.00 if tujuan = pengiklanan). Per UAT-CR #233195.

**Scout + Recon + Rubric DONE** 2026-05-18 evening. Option 1 (config-driven) chosen — みや explicitly rejected hardcoding.

### Fix APPLIED — NOT committed, NOT tested
`etanah-awam` repo, branch `mlk/release/uat`. File `PelupusanBayaranOnlineStrategy.java`, both PLPS blocks:
- Line 817 (PLPS block, bilangan>0) + line 976 (PLPS block, bilangan==0): `getJumlah() == null` → `getJumlah() == null || getJumlah().signum() == 0`
- Root cause: `:551` pre-sets jumlah to `BigDecimal(0)`, so the `== null` fallback was dead code. `signum()==0` makes it fire → applies configured `fiPejabat.getKadar()`.
- (Line numbers are post-pull; early-diagnostic.md still cites Scout's pre-pull :823/:982.)

### Env switched this session
- `standalone.xml` `etanahDS` → mkit `et_main_mlit` (AWAM UAT). mlkuat→`etanahDS2`, etprdmlk→`etanahDS3`. Verified one active `etanahDS`.
- `cas.url` already UAT. `etanah-awam` on `mlk/release/uat`, pulled (61 files ff).
- WAR still `etanah-pelupusan.war` — module switch pending: みや runs `mvn clean install` on etanah-awam + WAR swap + JBoss restart.

### NEXT ACTIONS (tomorrow)
1. みや: `mvn clean install` etanah-awam → swap WAR → start JBoss.
2. Test: AWAM UAT, fresh PLPS application, non-pengiklanan tujuan, Bayaran step → Fi shows configured rate, not 0.00.
3. Then commit the fix on `etanah-awam`; **diff this session's MemoryCore changes vs the updated main** (the deferred step — main updates after the other session saves first).

### Deferred / open
- `mlk/release/fat` access for AWAM — separate follow-up (testing on uat first).
- env-check `SKILL.md` branch note ("fat rename never propagated to remote") may be wrong — みや says fat is a real remote branch needing access. Correct at session close.
- etanah-knowledge: log "PLPS AWAM = no test-data harvest, applicant fills permohonan fresh" at DE Gap Sweep.

---

## This session's MemoryCore changes (committed via DE)

- `.claude/CLAUDE.md` → **v1.11** — Recon Sub-check 8e (composite multi-caller verification).
- `quest/quest-protocol.md` → **v3.1** — Phase 0 artifact gate + verify-close re-commit clause.
- `quest/active.txt` — QA-260302 entry reconciled (phase=1-complete, +branch, +commit, files marked COMMITTED).
- `projects/.../QA-260302/early-diagnostic.md` — created (was missing; untracked/confidential — stays local, not committed).
- `improvement-audit-log.md` +2 entries · `forge-log.md` +1 L1 · `observation-log.md` +1 T1.

## ⚠️ Standing flags

- Running in worktree `magical-banach-4264b3`.
- QA-260302 **defect #4 OPEN** — fix before further testing.
- Q1 todo "QA-260302 DB→UI walkthrough" still pending — today covered the file-navigation half, not the full DB→UI chain.

## 🎯 Session Recap (for AI restart)

1. Read this file — QA-260302 STATE + defect #4 are the live work.
2. Resume at NEXT ACTIONS — fix defect #4 first.
3. quest-protocol v3.1 now has the Phase 0 artifact gate + verify-close re-commit clause — follow them.

---
**Memory Type**: RAM | **Persistence**: brief recap + active-work handoff
**Last Activity**: 2026-05-18 11:29 — DE session-end
