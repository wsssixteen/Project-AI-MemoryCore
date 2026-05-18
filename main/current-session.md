# 🌟 Current Session Memory - RAM

**Last session**: 2026-05-18 — three reconciled sessions merged into main. (a) QA-260869 Phase 1 closed + the #256113 root-cause refactor shipped. (b) QA-260302 Phase 1 closed + `verify` skill built (memory Track 1) + Track 2 designed. (c) QA-260316 Scout/Recon/Rubric + fix applied to etanah-awam (AWAM PLPS Bayaran 0.00) — testing pending. Resume from the STATE blocks below.

---

## QA-260869 — STATE (Phase 2 next)

**Ticket**: PRZ Semakan Surat Keputusan Lulus — header surat + maklumat not populating on regenerate.

**Phase 1 COMPLETE** — committed `2ed93b0526` on branch `mlk/qa/260869` (etanah-pelupusan), pushed, verified green. Not merged to master (someone else does that).

**What shipped — the #256113 root-cause refactor, 4 Java files:**
- `PelupusanWordEditorUtil.java` — `findTableByContentControlTag` rewrite (Tbl/Tr/Tc, raw + JAXBElement-wrapped) + `CTSdtRow` branch in `insertContentControlTableInDocument` (insert `<w:tr>` into row-level SDTs, not `<w:tbl>`)
- `PelupusanTemplateUtil.java` + `PelupusanPenyediaanDokumenVO.java` + `TemplatePropertyJson.java` — #256113 `reloadFromClasspath` hack removed
- `template.config.json` QA-260869 config patch was **reverted** — refactor supersedes it

**Tested**: full Penyediaan→Semakan→Pengesahan chain on `PTMLK/01/L/PLPS/2026/112` (UAT) — syarat-syarat table survived all 3 stages. みや confirmed.

### Phase 2 — to do early morning 2026-05-19
1. Post-mortem → `main/post-mortems.md`.
2. KPI → `main/kpi-tracker.md`.
3. Append this session's improvements to `improvement-audit-log.md` as `status=applied` (quest/notes.js, env-check UAT override, feedback_task_folder_ownership.md rewrite, CLAUDE.md Phase-1-Closure git rule).
4. etanah-knowledge capture: row-level-SDT / `CTSdtRow` defect + #256113 hack mechanism (BUG-BESTIARY).
5. Optional: PRZ smoke-test on UAT — `PTMLK/01/L/PRZ/2025/10` (sanarimah@melaka.gov.my).

QA-260869 project docs: `projects/coding-projects/active/QA-260869/` — early-diagnostic.md, changes-applied.md, refactor-breakpoint-plan.md.

---

## QA-260302 — STATE

**Phase 1 COMPLETE** — committed `5094c076c0` on `mlk/qa/260302` (etanah-pelupusan), pushed. Not merged to master.

### ⚠️ Defect #4 — OPEN (not fixed)
Variant composites bind `#{cc.attrs.mb.jenisUnitKadarNilaianSelectItems}`. On the dispatcher route (`MlkMuatNaikCabutanMinitForm` / `MlkMaklumatCukaiPremiumForm` → `mlkUlasanJPPH.xhtml` → variant), `cc.attrs.mb` is the screen bean — lacks the getter → `PropertyNotFoundException`. Getter exists on `JabatanTeknikalHelper` + `MlkUlasanJPPHForm` only. `5094c076c0` does NOT fix this.
**Fix**: add `getJenisUnitKadarNilaianSelectItems()` to `MlkMuatNaikCabutanMinitForm.java` + `MlkMaklumatCukaiPremiumForm.java` (check for a shared base class first). env-check + Predicate Box first.

### Test surfaces
- File #1 generic composite — ✅ FAT-verified (PPJK/PJTLT, `PTMLK/02/L/PPJK/2026/9` — nazli@melaka.gov.my).
- Files #2/#3 variants + #4 standalone — ⬜ untested; flowable-alter needed.

### NEXT (QA-260302)
1. Fix defect #4 (the 2 screen beans).
2. Flowable-alter → test standalone, then PLPS/PPJK variants.
3. Phase 2: FAT note (`local_test=partial`, File #1 only); BA scope Q.

---

## Memory-system improvement — STATE

3-track plan (from Hermes / memsearch research + appraisal):
- **Track 1 — `verify` skill: ✅ DONE.** Universal checkpoint gate; integrated into `quest-protocol.md` at 3 checkpoints (Checklist A Phase 0 / B Apply-done / C Phase 1 close). `verify-close` superseded.
- **Track 2 — capture + recall + per-quest doc: Design Memo APPROVED, build pending.** Order: 2b per-quest `QA-NNNN.md` → 2a-capture (Stop-hook → `daily-diary/transcripts/{date}.md`) → 2a-recall (SQLite FTS5 `memory-index.db`). In todo Q1. 2a-capture pre-req: verify the Claude Code `Stop` hook payload shape first.
- **Track 3 — discipline + visibility: needs its own Design Memo.** Bounded boot snapshot + caps on the durable layer + skill-run feedback log. In todo Q1.

### NEXT (memory)
Build Track 2 — start with 2b (per-quest doc).

---

## QA-260316 — STATE ⚠️ CONTINUE TESTING FIRST THING NEXT SESSION (wait for みや's signal — session may open with other work)

**Ticket**: AWAM PLPS, Langkah Bayaran — fee shows 0.00, should show 50.00 (100.00 if tujuan = pengiklanan). Per UAT-CR #233195.

**Scout + Recon + Rubric DONE** 2026-05-18. Option 1 (config-driven) chosen — みや explicitly rejected hardcoding.

### Fix APPLIED — NOT committed, NOT tested
`etanah-awam` repo, branch `mlk/release/uat`. File `PelupusanBayaranOnlineStrategy.java`, both PLPS blocks:
- Line 817 (PLPS block, bilangan>0) + line 976 (PLPS block, bilangan==0): `getJumlah() == null` → `getJumlah() == null || getJumlah().signum() == 0`
- Root cause: `:551` pre-sets jumlah to `BigDecimal(0)`, so the `== null` fallback was dead code. `signum()==0` makes it fire → applies configured `fiPejabat.getKadar()`.
- (Line numbers post-pull; early-diagnostic.md cites Scout's pre-pull :823/:982.)

### Env switched
- `standalone.xml` `etanahDS` → mkit `et_main_mlit` (AWAM UAT). mlkuat→`etanahDS2`, etprdmlk→`etanahDS3`. Verified one active `etanahDS`.
- `cas.url` already UAT. `etanah-awam` on `mlk/release/uat`, pulled (61 files ff).
- WAR still `etanah-pelupusan.war` — module switch pending: みや runs `mvn clean install` on etanah-awam + WAR swap + JBoss restart.

### NEXT ACTIONS
1. みや: `mvn clean install` etanah-awam → swap WAR → start JBoss.
2. Test: AWAM UAT, fresh PLPS application, non-pengiklanan tujuan, Bayaran step → Fi shows configured rate, not 0.00.
3. Then commit the fix on `etanah-awam`.

### Deferred / open
- `mlk/release/fat` access for AWAM — separate follow-up (testing on uat first).
- env-check `SKILL.md` branch note ("fat rename never propagated to remote") may be wrong — みや says fat is a real remote branch needing access. Correct when reviewed.
- etanah-knowledge: log "PLPS AWAM = no test-data harvest, applicant fills permohonan fresh".

QA-260316 project docs: `projects/coding-projects/active/QA-260316/early-diagnostic.md`.

---

## ⚠️ Standing flags
- `verify` skill supersedes `verify-close` — use `/verify` going forward (notes referencing "verify-close" mean the same checkpoint check).
- **env-check TEMPORARY UAT-only override** — FAT down for "Mock Cutover 1". Remove the override block in `env-check/SKILL.md` when FAT is back (みや says "FAT is back").
- QA-260869 Phase 2 pending — early morning 2026-05-19.
- QA-260302 defect #4 OPEN — fix before further QA-260302 testing.
- QA-260316 — Scout/Recon/Rubric done, fix applied to etanah-awam (uncommitted), env on AWAM UAT; test first thing next session.
- `/branch-and-push` skill recommended — 3rd pull-before-branch miss (todo.md Q2).

## 🎯 Session Recap (for AI restart)
1. Read this file — QA-260869 Phase 1 closed (Phase 2 next), QA-260302 Phase 1 closed (defect #4 open), QA-260316 fix applied (test next session), memory Track 2 pending.
2. env is UAT (FAT down) — env-check temp override active. QA-260316 has the env on AWAM UAT (mkit).
3. Three 2026-05-18 sessions reconciled into main.

---
**Memory Type**: RAM | **Persistence**: brief recap + active-work handoff
**Last Activity**: 2026-05-18 22:47 — DE session-end (3-session reconcile + QA-260316 Scout/Recon/Rubric/fix)
