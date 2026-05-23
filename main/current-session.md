# 🌟 Current Session Memory - RAM

**Last session(s)**: 2026-05-22 (Friday) + **2026-05-23 (Saturday)** — QA-261986 PSBS Risalat MMKN closed end-to-end across both days. Phase 1 commit `d2aa36240b` on `mlk/qa/261986` pushed 2026-05-23 ~17:00 MPST. Phase 2 closed 2026-05-23 evening (post-mortem + KPI + archive). Quest duration: 2.5 days inclusive of hold + multi-session execution.

---

## ✅ QA-261986 — DONE end-to-end

The big one of this stretch. Test app: `PTMLK/02/L/PSBS/2026/1` (as `nor.aini@melaka.gov.my`, PRRMMKNPTG — advanced from PRMMKNPTG via flowable-alter mid-quest).

**7 files committed** (+252/-11):
- `PelupusanWordCCMethodConstant.java` — new `populateJabatanTeknikalTablePSBS` + 4 JPPH/perkataan populators + Date→String tarikhSuratJT + PSBS year-only tempoh + PSBS 2-line staticText + §6 dead-override removal + PSBS_Lulus/Tolak eachRow updates + 2 noDaftarSyarikat→noPengenalan rebindings.
- `PelupusanTemplateReportMethodParameter.java` — URS_PSBS branch in `populateMaklumatPajakanVOList`.
- `MlkMaklumatTanahPemberimilikanForm.java` — formula `(tempohDipohon − bakiTempoh)` + `\n` line-break.
- 4 `.docx` files (Lulus, Tolak, JabatanTeknikal new SDT block, additionalJKKLParagraph surgical-merged).

**Rule refinements landed this quest** (5 new HARD gates + 1 re-time):
- 🪪 **PRE-EMIT REGEX GATE** (Permohonan ID never alone) — personality.md.
- 🎯 **Solution Gate** (every diagnosis applies a candidate) — personality.md Disposition.
- 🪪 **NEVER-fingerprint sub-rule** (DB audit columns never identifiable) — personality.md Data-operation safety.
- 🧹 **Post-refactor dead-branch audit** — quest-protocol.md Apply.
- **Action-scope split for Word .docx** — personality.md v1.6 (Ruri DOES edit .docx mechanically).
- 🗂️ **Backup-on-mutation** + **.bak cleanup re-timed to commit-prep** — quest-protocol.md Commit checkpoint.

**Knowledge file created**: `etanah-knowledge/melaka/DEV-TESTING-HACKS.md` — first entry: rahsia-gate bypass procedure (script path, trigger phrases "to peraku" / "to perform signature" / "rahsia gate", restore steps for `.bak_qa261986_v2`).

**The rahsia-gate hack** was applied to `etanah-common-0.0.672-MLK.war` during testing, then restored from backup at Phase 1 close — local JBoss now sees the un-hacked war; 11 `failRahsiaPreviewId` gates back in place. **Never shipped**.

## ⚠️ Standing flags

- **126+ pending audit-log entries** (longstanding backlog — separate from the 8 r-entries from QA-261986 which are tagged status=applied).
- 4 untracked paths still unclassified: `Feature/project-structure-compliance-handover.md`, `etanah_atlas/`, `zikxoUIF`, `outputs-temp/`.
- Worktree `claude/modest-lederberg-d83586` from a prior session — will close at DE step 11.
- QA-261986 carry-forward (per post-mortem): Syarikat-variant block split, Tolak header consolidation, etanah-common mental-model knowledge file — all in todo.md.

## 🎯 Session Recap (for AI restart)

1. **QA-261986 fully closed** — Phase 1 commit + push, Phase 2 post-mortem + KPI + archive (Task folder → Archive/47, project folder → archive/QA-261986). active.txt: phase=2-complete, status=archived.
2. **5 personality.md / quest-protocol.md hard rules landed** mid-quest — they're now deterministic emit-gates, not soft prose. Each was a recurring slip-shape that the prose form couldn't catch; now the format itself catches them. Read those at next boot.
3. **`etanah-knowledge/melaka/DEV-TESTING-HACKS.md` is the new home** for testing-cycle hacks like the rahsia-gate. When みや says "to peraku" / "to perform signature" / "rahsia gate" / "skip OTP for testing" → look up the procedure there before re-deriving.
4. みや's mental model of `.m2` / war overlay / `etanah-common`'s role got built in chat this session — carry-forward TODO is to put a durable version into `MODULE-ARCHITECTURE.md`.
5. **The DB cross-check before patching** — みや's SSO login can hit any of UAT/FAT DBs; auth-side patches must enumerate. New standing rule for any DB patch on auth columns.

## 💬 みや's voice this stretch

The honest spine of this quest was 6 corrections, each genuine:
- "Why are you still asking me to edit Word?" — broke the action-scope misread that led to the personality.md refine.
- "Bloody hell, why kept asking me to edit the word myself?" — same shape, different verb.
- "Use the standard, NOTHING identifiable" — fingerprint rule.
- "If you can do it, why DO YOU NOT?" — bias toward direct-skip when the user explicitly asks for it.
- "I want to bypass OTP" → I answered the wrong gate (sign-OTP vs rahsia-OTP).
- "Why didn't you do Tolak counterpart?" — surface gap-checks per-variant, not just per-Lulus.

Each correction became a rule; each rule is now visible in the emit shape. The pattern that ties them together: prose rules fail under pressure; visible gates work because they HAVE to be emitted to pass.

---
**Memory Type**: RAM | **Last Activity**: 2026-05-23 21:41 MPST — DE close, QA-261986 quest archived.
