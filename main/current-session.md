# 🌟 Current Session Memory - RAM

**Last session**: 2026-05-17 — QA-260302 deep investigation (JPPH Unit-dropdown testing). Long session; stopped at near-max context. Resume straight from "QA-260302 — FULL STATE" below.

---

## QA-260302 — FULL STATE (continue from here)

**Ticket**: Add a "Unit" dropdown (options: **smp** / **sehektar**) to the JPPH Ulasan panel's lot-row. Scope = "semua urusan melibatkan Ulasan JPPH".

**4 edited XHTML files = 4 renderings of the same panel** (+ supporting `PelupusanConstant.java`, `JabatanTeknikalHelper.java`). Code edits **UNCOMMITTED** in `E:\Projects\Melaka\etanah-pelupusan` (7 files).

| File | Screen it renders on | Render gate | Tested? |
|---|---|---|---|
| #1 `mlkUlasanJPPHForm.xhtml` (generic composite) | `MlkJabatanTeknikalTerlibatForm` — tugasan PJTLT/SJTLT/PSLTPM | `viewUlasanJPPH` | ✅ PPJK, PSBS, PLTP |
| #2 `mlkUlasanJPPHFormPLPS.xhtml` (PLPS variant) | `MlkMuatNaikCabutanMinitForm` (via `mlkUlasanJPPH` dispatcher) | `ulasanJPPH AND perluJPPH` | ⬜ pending |
| #3 `mlkUlasanJPPHFormPPJK.xhtml` (PPJK variant) | `MlkMuatNaikCabutanMinitForm` (via dispatcher) | `ulasanJPPH AND perluJPPH` | ⬜ pending |
| #4 `MlkUlasanJPPHForm.xhtml` (standalone page) | skrin 388 `PLP_ULSN_JPPH` — tugasan PN5A/PYN5A/SN5A/PSKP/PYSKP/SSKP | **NO gate** (ungated panel) | ⬜ pending |

### Render-gate findings (verified this session — code-traced)

- **File #1** `viewUlasanJPPH`: `JabatanTeknikalHelper.initViewFlags()` :89-112 → forced TRUE for **PSBS/PPJK/PLTP/PRZ/RPPLP**. PT only at the PRMMKNPDT tugasan. **PLPS never** (not in the list).
- **File #2/#3** gate `MlkMuatNaikCabutanMinitForm.xhtml:88` `rendered="#{mb.ulasanJPPH and mb.perluJPPH}"`:
  - `perluJPPH` = `plp_a_pelupusan.flag_perlu_jpph`.
  - `ulasanJPPH` data-driven branch is **DEAD** — needs an agency with organisasi-kod = `JBT_JPPH` (`PelupusanConstant.java:247` `ORGANISASI_KOD_JPPH_DEFAULT`); **no such agency exists in UAT or FAT** (verified). Agency 13 (JPPH) has org-kod "JPPHM" — does NOT match.
  - **LIVE path** = `MlkMuatNaikCabutanMinitForm.java:2210-2211`: when tugasan ∈ MESYUARAT_MB family **AND** officer picks Keputusan = "lulus" → sets **both** `ulasanJPPH=true` + `perluJPPH=true` at runtime. **No DB seed needed.**
  - MESYUARAT_MB tugasan codes (`PelupusanTugasanConstant.java:162-165`): **KKMB, SKMB, SKMB2, PKMB**.
- **File #4**: standalone page `ulasanJPPHpanel` has **no `rendered` gate** (verified XHTML + bean `MlkUlasanJPPHForm.java`). Renders whenever the app sits at a skrin-388 tugasan.

### NEXT ACTIONS (do these first next session)

1. **#2 & #3** — query UAT (`et_main_uat`): PLPS and PPJK apps at `umm_tgsn_semasa.kod_tgsn IN ('KKMB','SKMB','SKMB2','PKMB')`, with hakmilik count. Then tell みや: open the app on Muat Naik Cabutan Minit → pick **Keputusan = Lulus** → the JPPH panel (PLPS variant / PPJK variant) renders → click panel's **"Add"** button to get a lot-row → screenshot the Unit dropdown.
2. **#4** — need a PT/PLTP/PSBS app at a skrin-388 tugasan (PN5A/PYN5A/SN5A/PSKP/PYSKP/SSKP). NONE parked there (UAT + FAT both empty). Either flowable-alter an app there (read BPMN for a valid reachable target first) or progress one. Standalone page is ungated → once at a 388 tugasan + a JPPH row (or use "Add") → renders.

### Verified test data
- File #1 done: PPJK `PTMLK/02/L/PPJK/2026/9`; PSBS `PTMLK/03/L/PSBS/2026/9` (UAT, SJTLT, mahaniza@melaka.gov.my); PLTP.
- 16 PLPS/PPJK apps confirmed at MuatNaikCabutanMinit tugasans WITH a JKKT keputusan — but all at KKMMKN/SKMMKN/PKMMKN/etc, NOT the KKMB/SKMB family — so they do NOT hit the line-2210 path. Need apps specifically at KKMB/SKMB/SKMB2/PKMB.
- `PTMLK/01/L/PT/2026/19` cannot flowable-alter (sub-flow / exclusive-gateway error).

### Environment
Switched to **UAT pelupusan** (env-check applied: `environment.properties` cas.url → UAT; `standalone.xml` etanahDS → mlkuat/et_main_uat). みや must `mvn clean package` etanah-pelupusan + redeploy WAR before testing.

### Key code refs
`MlkMuatNaikCabutanMinitForm.xhtml:88` · `MlkMuatNaikCabutanMinitForm.java:2210-2211` · `PelupusanTugasanConstant.java:162-165` · `PelupusanConstant.java:247` · `JabatanTeknikalHelper.initViewFlags():89-112` · DB: `umm_a_jabatan_teknikal` (agensi_id, mklmt_tmbhn JSON `ulasanJPPHChildList`), `plp_a_pelupusan.flag_perlu_jpph`, JKKT chain `umm_kertas_mesyuarat`→`umm_a_kertas`→`umm_keputusan_mesyuarat`.

---

## System changes made this session (MemoryCore — uncommitted)

- `.claude/CLAUDE.md` → **Version 1.10**: Test-permohonan discovery hard rule + UAT-check sub-rule + **Panel-Render Check** (5-step procedure) + flowable-fluency note.
- `.claude/personality.md`: added "Operational follow-through" disposition.
- `.claude/auto-memory/feedback_task_folder_ownership.md`: Notes.txt content discipline (one entry per code-variant, replace not append).
- `.claude/skills/env-check/SKILL.md`: now auto-applies config edits (no `apply` gate).
- `.claude/skills/bankai/SKILL.md`: **created** (Bankai formalized as an invocable skill).
- Task folder `35. QA #260302/1. Notes.txt`: 3 entries.

---

## ⚠️ Standing flags
- Running in worktree `epic-almeida-1a5119` (branch `claude/epic-almeida-1a5119`).
- `main` is +9 ahead of `origin/main` — unpushed.
- This session's MemoryCore edits (CLAUDE.md, personality.md, skills, feedback file) are **uncommitted**.
- etanah-pelupusan QA-260302 code (7 files) **uncommitted** on E: drive — Phase 1 close-out pending after testing.

## 🎯 Session Recap (for AI restart)
1. Read this file fully — QA-260302 FULL STATE section is the live work.
2. Resume at "NEXT ACTIONS" — query UAT for PLPS/PPJK apps at KKMB/SKMB/SKMB2/PKMB tugasans (#2/#3), and the skrin-388 path for #4.
3. みや tests + screenshots; Ruri DB-verifies via Panel-Render Check.

---
**Memory Type**: RAM | **Persistence**: brief recap + active-work handoff
