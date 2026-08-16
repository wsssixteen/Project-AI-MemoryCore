# Current Session

## 2026-08-14 — Worktree-sweep retrieval + quest 2 new tickets (275456 fold, 275500 Phase 0)

**Session shape: retrieve → check Redmine updates → /quest 2 new tickets → save → DE. Autonomous /goal.**

### Retrieval (worktree-retrieve)
- The 08-13 sweep docs are NOT stranded — OneDrive replicated the gitignored `projects/` dir, so main holds all qa_docs (274532/274914/275009/275152/274740 + ADHOCs). `git cherry` branches all share main HEAD.
- Surfaced post-sweep Redmine updates: **275009** gained relations `#274461` + `#233646` (08-14) and its real scope is **3 issues** not 2 (sweep missed the Jana-button-removal + framed template-sign-count as "jawatan salah"); **274532** re-opened 08-14 (extra blank page mid-Surat JPPH). Board grew to 7 mine (275500/275505/275501 new).

### Quested 2 new tickets
- **275456** = ad-hoc **A13 / ADHOC-PPTPB-2026-1** (identical permohonan `PTMLK/03/L/PPTPB/2026/4` @ eddie, same symptom). **Folded, not re-Scouted** — Recon-done, DB-proven. Root: daerah/bandar never captured at AWAM land entry → `umm_p_permohonan_tnh` blank → pra→app copy → Teknikal defaults Selangor. Register row A13 updated `TICKETED → #275456`. qa_doc written.
- **275500** = PLTP Risalat **tajuk papar satu pemohon sahaja** (app `PTMLK/02/L/PLTP/2026/6` @ faridmajid). Phase 0 → Rubric **90%**. Root (direct read): every `generateDefaultRisalat<URUSAN>` in `PelupusanService.java` builds pemohon from **`apbList.get(0)`** — first pihak berkepentingan only; PLTP at `:14151`, tajuk string `:14225`. **No multi-pemohon analog exists** among the 6 builders → fix is new join-logic (1→as-is, 2→` DAN `, >2→comma + ` dan ` before last). Blast radius: all 6 urusan share the bug (BA confirms general). qa_doc written, active.txt active, notes written.

### Saved
qa_docs `QA-275456.md` + `QA-275500.md` (durable main path) · active.txt both active · notes both · ADHOC-REGISTER A13 row.

### ▶▶ NEXT
- 275500 Apply (on `mlk/master`): add `buildSenaraiPemohonRisalat` helper + rewrite `:14225`; confirm >2 casing ("dan" lc) w/ BA; regen to verify; offer sibling-urusan blast-radius fix.
- 275456: portal repro to pin AWAM save method · data-patch 3413241 (+3431713) on nod · confirm QA-274740 relation.
- Still open on board: 274914 (BPMN, nearest deadline 20 Aug), 275009 (3-issue rewrite), 275152 (commit existing guard), 275505 + 275501 (not drafted).

---

## 2026-08-13 (274532 rework) — PLTP Surat Nilaian JPPH tajuk justify: int-env merge had dropped the fix

**Rework cycle 2, heated. Root cause: the 08-12 justify fix survived on master/ticket but a binary `.docx` merge into `mlk/int-env` kept int-env's copy (`jc=left`) — and BA tests on int-env.**

- **Diagnosis**: extracted `<w:jc>` per git ref → master/ticket=`both`, int-env=`left`. int-env template diverges 206 lines (Aaron **#274455/#274838** footer/SLOGAN content) — surfaced those as the clash source for miya↔BA.
- **My verify miss (slip logged, category=verification)**: miya's footer-blanking via `<w:titlePg/>` moved the kop to page 2; I verified by XML-diff and called it "clean" — **XML-diff cannot see pagination**. miya caught it on render, re-fixed. Final `44ad939ef5` on `mlk/esokongan/274532v2` → int-env `c78bdd729c`.
- **Base-branch deviation (miya flagged)**: I branched v2 off `int-env` (not master) to keep Aaron's content → it's an int-env-only patch; release path = original `mlk/esokongan/274532` (already `jc=both`).
- **Prevention built**: `quest/verify-docx-across-refs.ps1` — destination-branch binary-template verify (proves bytes, NOT pagination — pair with a render check).
- **Phase 1 CLOSED**, local test PASS (miya, MLIT `PTMLK/02/L/PLTP/2026/3`). ⚠️ Redmine still `Rework` — needs status update + planned-release listing.

## 2026-08-13 (ADHOC session) — PPTPB Teknikal-Selangor DB-proven + ADHOC scaffold + adhoc-paste-detector built

**BA (eddie@melaka.gov.my) pasted a screen issue in the PDTAG/Urusan/Tugasan/Id/User format (no Redmine#). Diagnosed to ground truth, then scaffolded it as an ADHOC + built a hook so the paste auto-scaffolds next time.**

### The issue — ADHOC-PPTPB-2026-1 (register A13)
PPTPB Teknikal `Penyediaan Laporan Pelukis Pelan` "Maklumat Permohonan" grid shows **Negeri=SELANGOR** + blank daerah/bandar/seksyen for `PTMLK/03/L/PPTPB/2026/4` (aplikasi 3413241, PROD).
**Root cause DB-PROVEN**: daerah+bandar never captured at AWAM applicant land entry → `umm_p_permohonan_tnh` (p_aplikasi 18677) blank → generic pra→app copy carries blank into `umm_a_permohonan_tnh` → Teknikal grid defaults Selangor. Proven both ways across 5 rows (blank portal→blank app; populated→populated). Correct = bandar 87 Padang Sebang/Alor Gajah/Melaka (`ind_hkmlk`). 2/20 recent PPTPB blank; seksyen blank=normal (mukim). AWAM save `etanah-awam\...\PelupusanService.java:2160-2164` copies VO with no hakmilik fallback.
**Overclaims caught by miya + retracted**: `:2337/2517` as fix line (=Ruang Udara path); QA-273707 as dup (that's urusan PT). **Refuted**: patch-not-organic (5 version-0/SYSTEM), master-empty-at-app-time.
**Open**: exact PPTPB save method + why-VO-empty NOT pinned (needs portal repro). Data-patch + code fix NOT applied. Maybe related **QA-274740** (PPTPB alamat salah Surat JT).
qa_doc: `projects/coding-projects/active/ADHOC-pptpb-teknikal-location-blank/…md` · task folder `146. ADHOC - PROD - PPTPB - …` · active.txt `ADHOC-PPTPB-2026-1`.

### Built — adhoc-paste-detector (Feature, forge-born)
miya: pasting the field-format should AUTO-create an ADHOC scaffold like a Redmine retrieval, and it wasn't. Slip `workflow-scaffold-miss` logged. Built `domain/adhoc-paste-detector/` (UserPromptSubmit, hook-only) — detects ≥3 field-labels + permohonan-id + no ticket# → injects the 4-step scaffold procedure. Eval **7/7**, NUKE-MARKER + README, registered `settings.json`, catalog synced (92 hooks). Retire 2026-09-12.

### ▶▶ NEXT (this ADHOC)
Portal repro to pin the code fix site · data-patch 3413241 (+3431713) on miya nod · Redmine# if ticketed · confirm/deny QA-274740 relation.

---
