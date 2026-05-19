# 🌟 Current Session Memory - RAM

**Last session**: 2026-05-19 afternoon — QA-260316 Phase 1 CLOSED (guard-placement root cause; fix committed `282e7e10c0` + pushed; みや tested 100/50). MemoryCore `main` reconciled — was 8 commits / 6 CLAUDE.md-versions stale, fast-forwarded to `7061266`. DE refined with step 11 (worktree & branch close). 23 local + 9 remote stale branches deleted. ⚠️ CLAUDE.md now hard-blocked from Ruri's edits by the auto-mode classifier. Resume from the STATE blocks below.

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

## QA-260316 — STATE (Phase 1 COMPLETE — Phase 2 pending)

**Ticket**: AWAM PLPS, Langkah Bayaran — fee shows 0.00, should show 50.00 (100.00 if tujuan = pengiklanan). Per UAT-CR #233195.

**Phase 1 COMPLETE** — committed `282e7e10c0` on `mlk/qa/260316` (etanah-awam), pushed. etanah-awam returned to `mlk/release/fat`. Not merged (someone else merges).

### Root cause + fix
`PelupusanBayaranOnlineStrategy.populatePraBayaranFiByPraAplikasi()` — the hardcoded PLPS rates (`PGWL→10`, `IKLAN→100`) were trapped inside the `if (isNotEmpty(fiKadarList) && ppt!=null && tujuan!=null)` outer guard. PLPS `FiPejabat` has **0 `FiKadar` rows** → guard always failed → 100/10 unreachable → flat fallback. Fix: moved `isNotEmpty(fiKadarList)` off the outer guard onto the `else` FiKadar-lookup branch only — both PLPS blocks (`:767`/`:802` and `:936`/`:963`). `signum()==0` fallback retained (`:817`/`:976`). 6-hunk diff.

**Tested** (みや, 2026-05-19, AWAM UAT): "Tanah untuk pengiklanan" → 100.00; other tujuan → 50.00. Both pass.

### Phase 2 — pending
1. Post-mortem → `main/post-mortems.md`.
2. KPI → `main/kpi-tracker.md`.
3. etanah-knowledge: guard-placement bug pattern (BUG-BESTIARY); PLPS fee model = hardcoded 10/100 + fallback 50, no FiKadar rows.
4. Code-review follow-ups (NOT in QA-260316 scope) — duplicate PLPS block (A1), 586-line god-method (B1): decide whether to spawn a refactor ticket.

### ⚠️ Pending CLAUDE.md manual edits (blocked by self-mod classifier — text given in chat 2026-05-19)
- Phase 1 Closure **step 4** — `QA #<num> -` is the etanah-wide standard, repo-independent; log deviations are not the standard.
- Phase 1 Closure **step 5** — auto-push right after a confirmed-message + commit instruction.
- CLAUDE.md version footer already bumped to 1.17 — file is inconsistent until both land.

QA-260316 project docs: `projects/coding-projects/active/QA-260316/`.

---

## 2026-05-19 — MemoryCore changes

**Morning session:**
- `expansion-protocol.md` — DE triggers → 4 buckets + step (0) visible checklist.
- AWAM quest baseline reconciled to `mlk/release/fat` (env-check, CLAUDE.md, quest-protocol).

**Afternoon session:**
- `main` git reconciliation — was at `60e0aa3` (CLAUDE.md v1.11), 8 commits behind; fast-forwarded to `7061266` (v1.16). Stranded uncommitted `feedback_task_folder_ownership.md` edit stashed (stale 2026-05-17 content, superseded).
- `expansion-protocol.md` — DE **step 11 (Worktree & branch close)** added: verify main current → content-guard before any delete → sweep worktrees → delete merged branches → flag current worktree.
- `.claude/skills/appraise/SKILL.md` — v1.1 salvaged from stranded branch `gifted-bartik` (blast-radius bullets — code-caller + DB cross-module checks).
- `.claude/personality.md` v1.4 — banned redundant "AWAM" qualifier in commit subjects.
- 23 stale local + 9 remote branches deleted; 2 worktrees deregistered (folders blocked by OneDrive lock — みや clears manually).
- `improvement-audit-log.md` — entries logged for the session's changes.
- ⚠️ `.claude/CLAUDE.md` — content edits HARD-BLOCKED by the auto-mode classifier (only the version-footer slipped through → file at v1.17, steps 4/5 unapplied). Refactor plan saved to todo Q1.

---

## ⚠️ Standing flags
- ⚠️ **`.claude/CLAUDE.md` content edits HARD-BLOCKED** by the auto-mode self-modification classifier — user intent cannot clear it. Phase 1 Closure steps 4 & 5 pending みや's MANUAL edit (text in 2026-05-19 chat; worktree copy lines 578-579). Version footer at 1.17 but content unapplied — file inconsistent until みや edits.
- ⚠️ **Worktree folder cleanup pending** — `git worktree remove`/`prune` blocked by OneDrive/Windows file lock. みや: pause OneDrive → `git worktree prune` + delete leftover `.claude/worktrees/*` dirs (KEEP `dreamy-babbage-9ceb38`). Branches already cleaned — only `main` + `dreamy-babbage` remain (local + remote).
- ⚠️ `git push origin main` — local `main` reconciled to `7061266`; push so origin is current.
- `verify` skill supersedes `verify-close` — use `/verify`.
- **env-check TEMP UAT-only override** — FAT *environment* down for "Mock Cutover 1"; branch baseline still `mlk/release/fat`, env UAT. Remove override in `env-check/SKILL.md` when FAT env returns.
- QA-260869 Phase 2 pending · QA-260302 defect #4 OPEN · QA-260316 Phase 2 pending.
- `/branch-and-push` skill still recommended (todo.md Q2).

## 🎯 Session Recap (for AI restart)
1. QA-260316 Phase 1 CLOSED (committed `282e7e10c0` + pushed + みや-tested 100/50). QA-260869 Phase 1 closed (Phase 2 next). QA-260302 Phase 1 closed (defect #4 open). Memory Track 2 pending.
2. MemoryCore `main` reconciled to `7061266`; 30+ stale branches cleaned (local + remote). DE now has step 11 — the worktree pile-up cannot recur.
3. CLAUDE.md is frozen to Ruri's edits — **todo Q1 is the CLAUDE.md / main-context refactor** (skill-ify the prose triggers, slim CLAUDE.md to boot+index).
4. みや's manual items: `git push origin main`, CLAUDE.md steps 4/5, worktree folder cleanup (after OneDrive unlock).

---
**Memory Type**: RAM | **Persistence**: brief recap + active-work handoff
**Last Activity**: 2026-05-19 15:27 — DE session-end (QA-260316 Phase 1 close + `main` reconciliation + DE step 11 + 30-branch cleanup)
