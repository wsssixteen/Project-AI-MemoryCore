# 🌟 Current Session Memory - RAM

**Last session**: 2026-05-19 — QA-260316 fix re-applied on its proper branch (`mlk/qa/260316` off `mlk/release/fat`); DE protocol refined (expanded triggers + visible step-0 checklist); AWAM quest baseline branch reconciled to `mlk/release/fat` across env-check / CLAUDE.md / quest-protocol. Resume from the STATE blocks below.

---

## QA-260869 — STATE (Phase 2 next)

**Ticket**: PRZ Semakan Surat Keputusan Lulus — header surat + maklumat not populating on regenerate.

**Phase 1 COMPLETE** — committed `2ed93b0526` on branch `mlk/qa/260869` (etanah-pelupusan), pushed, verified green. Not merged to master (someone else does that).

**What shipped — the #256113 root-cause refactor, 4 Java files:**
- `PelupusanWordEditorUtil.java` — `findTableByContentControlTag` rewrite (Tbl/Tr/Tc, raw + JAXBElement-wrapped) + `CTSdtRow` branch in `insertContentControlTableInDocument` (insert `<w:tr>` into row-level SDTs, not `<w:tbl>`)
- `PelupusanTemplateUtil.java` + `PelupusanPenyediaanDokumenVO.java` + `TemplatePropertyJson.java` — #256113 `reloadFromClasspath` hack removed
- `template.config.json` QA-260869 config patch was **reverted** — refactor supersedes it

**Tested**: full Penyediaan→Semakan→Pengesahan chain on `PTMLK/01/L/PLPS/2026/112` (UAT) — syarat-syarat table survived all 3 stages. みや confirmed.

### Phase 2 — pending
1. Post-mortem → `main/post-mortems.md`.
2. KPI → `main/kpi-tracker.md`.
3. Append this session's improvements to `improvement-audit-log.md` as `status=applied`.
4. etanah-knowledge capture: row-level-SDT / `CTSdtRow` defect + #256113 hack mechanism (BUG-BESTIARY).
5. Optional: PRZ smoke-test on UAT — `PTMLK/01/L/PRZ/2025/10` (sanarimah@melaka.gov.my).

QA-260869 project docs: `projects/coding-projects/active/QA-260869/`.

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
- **Track 1 — `verify` skill: ✅ DONE.** Universal checkpoint gate; integrated into `quest-protocol.md` at 3 checkpoints. `verify-close` superseded.
- **Track 2 — capture + recall + per-quest doc: Design Memo APPROVED, build pending.** Order: 2b per-quest `QA-NNNN.md` → 2a-capture (Stop-hook → `daily-diary/transcripts/{date}.md`) → 2a-recall (SQLite FTS5 `memory-index.db`). In todo Q1.
- **Track 3 — discipline + visibility: needs its own Design Memo.** In todo Q1.

### NEXT (memory)
Build Track 2 — start with 2b (per-quest doc).

---

## QA-260316 — STATE ⚠️ TEST FIRST THING NEXT SESSION (wait for みや's signal)

**Ticket**: AWAM PLPS, Langkah Bayaran — fee shows 0.00, should show 50.00 (100.00 if tujuan = pengiklanan). Per UAT-CR #233195.

**Scout + Recon + Rubric done; fix re-applied on the proper branch 2026-05-19.**

### Fix APPLIED — branch `mlk/qa/260316` (off `mlk/release/fat`), NOT committed, NOT tested
`etanah-awam`. File `PelupusanBayaranOnlineStrategy.java`, both PLPS fallbacks (`:817`, `:976`):
`getJumlah() == null` → `getJumlah() == null || getJumlah().signum() == 0`
- Root cause: `:545` pre-sets jumlah to `BigDecimal(0)` → the `== null` fallback was dead code. `signum()==0` makes it fire → applies configured `fiPejabat.getKadar()` (Option 1, config-driven; みや rejected hardcoding).
- `git diff`: 1 file, 2 insertions / 2 deletions. Uncommitted — みや writes the commit message at close.

### Env
- `standalone.xml` `etanahDS` → mkit `et_main_mlit` (AWAM UAT). `cas.url` UAT.
- etanah-awam on `mlk/qa/260316`; `mlk/release/fat` pulled (up to date).
- WAR still `etanah-pelupusan.war` — module switch pending.

### NEXT ACTIONS
1. みや: `mvn clean install` etanah-awam (on `mlk/qa/260316`) → swap to `etanah-awam.war` → start JBoss.
2. Test: AWAM UAT, fresh PLPS application, non-pengiklanan tujuan, Bayaran step → Fi shows configured rate, not 0.00.
3. Commit on `mlk/qa/260316` + close the ticket.

QA-260316 project docs: `projects/coding-projects/active/QA-260316/early-diagnostic.md`.

---

## 2026-05-19 session — MemoryCore changes
- `expansion-protocol.md` — DE triggers expanded to 4 buckets (invocation / ending session / continue-next-session / session-or-context limit) + new step (0): opening banner + 10-step ✓/⬜/⏭ checklist, no silent skips.
- AWAM quest baseline reconciled to `mlk/release/fat` — `env-check/SKILL.md` (L28/L161), `CLAUDE.md` Phase-1-Closure Git Sequence, `quest-protocol.md` (close-out + branch-cut now per-repo). CLAUDE.md → v1.16, quest-protocol → v3.2.

---

## ⚠️ Standing flags
- 3 MemoryCore commits from 2026-05-18 night (`7d03009`, `0f41247`, `5e4faa5`) + this session's DE commit are **unpushed** — origin/main behind. Push blocked by the auto-mode classifier; needs みや's manual `git push origin HEAD` + `git push origin HEAD:main`.
- `verify` skill supersedes `verify-close` — use `/verify`.
- **env-check TEMP UAT-only override** — FAT *environment* down for "Mock Cutover 1". Separate from the branch baseline (branch = `mlk/release/fat`; env still UAT). Remove the override block in `env-check/SKILL.md` when FAT env is back.
- QA-260869 Phase 2 pending.
- QA-260302 defect #4 OPEN — fix before further QA-260302 testing.
- QA-260316 — fix re-applied on `mlk/qa/260316`, ready for みや to build + test.
- `/branch-and-push` skill recommended — 3rd pull-before-branch miss (todo.md Q2).

## 🎯 Session Recap (for AI restart)
1. QA-260869 Phase 1 closed (Phase 2 next), QA-260302 Phase 1 closed (defect #4 open), QA-260316 fix re-applied on `mlk/qa/260316` (test next session), memory Track 2 pending.
2. AWAM quest baseline branch is now `mlk/release/fat` everywhere; env still UAT (FAT env down).
3. Unpushed MemoryCore commits — みや needs to push when the classifier allows.

---
**Memory Type**: RAM | **Persistence**: brief recap + active-work handoff
**Last Activity**: 2026-05-19 10:48 — DE session-end (QA-260316 re-apply + DE-protocol refine + AWAM-branch reconcile)
