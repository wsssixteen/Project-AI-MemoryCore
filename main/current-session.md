# 🌟 Current Session Memory - RAM

**Current session**: 2026-06-13 (Friday early hours) Session 1 — QA-261986 cycle-2 PSBS Risalat MMKN Syarikat **Phase 1 CLOSED** (`a8bc2c4f2f` on `mlk/qa/261986v2`).

## What S1 shipped (2026-06-13 ~02:48 MPST)
- **QA-261986 cycle-2 Phase 1 CLOSED**: commit `a8bc2c4f2f`, branch `mlk/qa/261986v2`, pushed. **6 files**:
  - `PelupusanWordCCMethodConstant.java` — new `senaraiAhliLembagaPengarah` populator + tag + registration (`RomanAlphabetFactory.getLowerCaseString` lettered list a/b/c…); §6 PSBS populator `populatePTGParagraph_PSBS_Lulus` company-name now `captializeOnlyAllFirstLetter` (was raw `.getNama()` → "MEGAH HOLDING" outlier vs §1/§2/§5 "Megah Holding"); jenisNoKP cell wired into §6 row.
  - `TemplateRisalatMMKNSyarikat_PDT_PSBS_Lulus.docx` — §1 "tahun" literal, §2.1.2 director-list CC swap (single-IC → senarai), header **7 sections → 1 section** (multi-page header fix), §6 block fix.
  - `TemplateRisalatMMKNSyarikat_PDT_PSBS_Tolak.docx` — mirror pass: JT tag `jabatanTeknikalPTSyarikat` → `jabatanTeknikalPSBS`, duplicate "Lembaga Lembaga" → "Lembaga", header **7 → 1 section**, transplanted `premiumPTPerkataan` CC (replacing literal "XX XXX" placeholder) + `senaraiAhliLembagaPengarah` block sdt (replacing single-IC) — via lxml para/block-sdt swap from fixed Lulus.
  - `TemplateRisalatMMKN_PDT_PSBS_Lulus.docx` (Individu) — header 7→1 section (latent same bug).
  - `references/JabatanTeknikal.docx` — §3 "3.1" row-number un-bolded + empty spacer cell 1560→360 twips (indent fix, aligns with §4.1).
  - `references/additionalJKKLParagraph.docx` — §6 block content recovered from `d2aa36240b` + jenisNoKP CC wrapped around "No. Kad Pengenalan" literal.
- **DB test-data patches (UAT, NOT committed)**: PTMLK/01/L/PSBS/2025/4 (norhaslinda.r) — `ind_mklmt_hkmlk.tempoh_pajakan=90` (mklmt_hkmlk_id 460059) · `umm_a_permohonan_tnh.mklmt_tmbhn` JSON keys `premiumString=1687.50` + `formulaPremium="3/400 x 2500 x 90 (...)"` + `sempadanList=[Utara/Selatan/Timur/Barat lots]` (a_permohonan_tnh_id 118310) · INSERT `umm_a_jabatan_teknikal` row agensi_id 50 (ADUN Hameed) ulasan + trkh_ulasan 19-Nov-25 to fill §4.

## Big lessons / shipped patterns
- **Word multi-section-break = multi-page header CC failure**: Word templates assembled from paste-ups accumulate many `<w:sectPr type="continuous">` blocks, each spawning its own header file. The framework (`PelupusanTemplateUtil.getWordHeaderPart` via `getDocumentModel().getSections()` → `HeaderFooterPolicy` set) collapses identical section headers and ends up filling only page 1's header copy. **Cure = template-side: collapse to one section** (delete the inline `<w:sectPr>` from intra-document break paragraphs; keep only the body-level final sectPr). Alternative code-side: enumerate `wordMLPackage.getParts().getParts()` for `HeaderPart` directly — additive sweep. Chose template-side because it's Word-save-proof too.
- **Premium-from-JSON-not-table**: `populatePremiumPT` + `populatePremiumPTPerkataan` both read `KEY_PREMIUM_STRING` ("premiumString") from `umm_a_permohonan_tnh.mklmt_tmbhn` JSON, NOT from `umm_a_mklmt_premium.jumlah_premium`. Single source of truth for both. `formulaPremium` is a separate JSON key on same field. Hasil §6 reads `notis5A.getHasilThnPertama()` (different binding from §5).
- **Sempadan table reads entity rows, not JSON**: directional CCs `lotUtara`/`statusUtara`/`aktivitiUtara` (and ×3 directions) populate from `AppMaklumatLotPersekitaran` entity rows fetched `findByLaporanTanahAndArah(alt, arahId)` — NOT the `sempadanList` JSON key (which is a separate bind nothing in §2.3 reads). My early `sempadanList` patch was harmless but useless. To fill those CCs: insert `AppLaporanTanah` + 4 `AppMaklumatLotPersekitaran` rows with FK lookups.
- **DHD chain for original lease term**: `umm_a_hkmlk.id_hkmlk` (string title e.g. "040101PN00070080") → `ind_hkmlk.hkmlk_id` (numeric) → `ind_versi_dhd.hkmlk_id + flag_aktif='Y'` → `mklmt_hkmlk_id` → `ind_mklmt_hkmlk.tempoh_pajakan`. Patching `ind_mklmt_hkmlk` touches the title master, not app-scoped.
- **ADUN routing**: `rjk_agensi.mklmt_tmbhn` JSON keys `ADUN`/`DUN`/`NAMA_YB` mark an agency as ADUN; `populateNamaYB` and §4 populators filter IN by those keys, technical-department populators (§3) filter OUT. Same `umm_a_jabatan_teknikal` rows feed both routes — the JSON tag decides which section it lands in.
- **§6 PSBS company-name title-case slip**: `populatePTGParagraph_PSBS_Lulus` was the only PTG paragraph (out of 5 urusan) that returned raw `apb.getNama()` instead of `captializeOnlyAllFirstLetter` — produced "MEGAH HOLDING" while §1/§2/§5 produced "Megah Holding". Fixed for PSBS; other 4 urusan likely have same raw pattern, left untouched (out of QA-261986 scope, but worth a follow-up).

## Slips logged this session (in slip-log.md if not already)
- `toAbjad` reinvention — wrote a custom base-26 lettering helper despite `RomanAlphabetFactory.getLowerCaseString(int)` existing in the same OpenPDF jar as `RomanNumberFactory` (which I had already used). みや caught with "this looks out of place". Cure: replaced with the existing factory, removed the helper.
- "Work declared lost" without `git log --all` — declared the §6 block needed re-doing without checking remote/other branches; commit `d2aa36240b` on `mlk/qa/261986` (cycle-1) had it. みや caught with "did you check git history? Maybe mlk/qa/xxxxx?".
- `sempadanList` JSON patch hit a key nothing reads — should have read the populator before patching (the directional CCs read the `AppMaklumatLotPersekitaran` entity, not the JSON key).
- **Notes-file clutter** (recurring) — accumulated 9 candidate permohonan IDs in `1. Notes.txt` instead of pruning to the 2 chosen sets. みや: "It's a cluster fuck in there, you keep doing that." Logged in slip-log.md as new `notes-hygiene-clutter` category. Pruned to Set A `PTMLK/01/L/PSBS/2026/8` (nor.aini) + Set B `PTMLK/03/L/PSBS/2026/2` (zilawati). Rule: Notes holds ONLY chosen test app(s); exploratory IDs live in QA-NNN.md.

## Open follow-ups (not blockers)
- §6 PSBS Hasil mismatch: §5 shows RM20 (title hasil), §6 shows RM 0.00 (reads `notis5A.getHasilThnPertama()=0`). Different bindings by design or defect — not yet investigated; out of scope for cycle-2.
- §6.1 garbled "syarat � syarat" — actually a valid en-dash (U+2013); only the PDF text-extractor mis-rendered it. May or may not render as box on screen; user to confirm.
- Other 4 urusan PTG populators (PT/PLTP/PPJK/PSP/etc.) likely also raw-uppercase the company name; not changed (out of scope).
- Tolak template "Tolak - Copy.docx" untracked file in repo dir — harmless, can delete.
- **Phase 2 archive for QA-261986** still pending.

## Test data quick-ref
- **QA-261986 cycle-2 (UAT)** Set A: PTMLK/01/L/PSBS/2026/8 @ nor.aini@melaka.gov.my · Set B: PTMLK/03/L/PSBS/2026/2 @ zilawati@melaka.gov.my · ADHOC patched: PTMLK/01/L/PSBS/2025/4 @ norhaslinda.r@melaka.gov.my.

## 🎯 Session Recap (for AI restart)
2026-06-13 S1: QA-261986 cycle-2 closed in one push. The Word multi-section-break header bug is now real knowledge (template-side collapse beats code-side sweep because it's Word-save-proof). The premium/formula/director CCs work cleanly when patched at the right JSON key — but the sempadan / ADUN-decision blanks turned out to be **un-entered workflow data**, not bugs, and we stopped fabricating once we proved the templates render correctly when records exist. Tolak template mirrored from fixed Lulus via lxml para/block-sdt transplant — premium-words + director-list lifted across cleanly. Java §6 company-name title-case fix landed for PSBS only (4 other urusan flagged for later).

**Memory Type**: RAM | **Last Activity**: 2026-06-13 02:51 MPST — DE running, about to commit + push.
