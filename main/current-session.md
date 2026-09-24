# Current Session

**Last Activity**: 2026-09-24 18:50 — #280540 BA data ask answered (Kadar Pengiraan Per per env, before/after MLKIT test); QA-280540 Phase 1 closed; DE.

## Session Recap (2026-09-24, pptpbl-fees-export worktree)
- **Ask**: BA (Mira) on #280540: what is Kadar Pengiraan Per for all Kategori on MLKIT + MLKSTG, is the maintenance page saving it.
- **Finding (DB-proven)**: Per is ONE field on Kod Fi `hsl_fi_pejabat.unit_pengiraan_id`; row `hsl_fi_kadar.kadar_pengiraan_id` empty on every PPTPBL row. Form field sits beside Kategori/Jenis but saves to the Kod Fi, so one change hits all rows. Row edit = delete+insert (MLKIT 307→2040, 318→2041). Re-added 2041 Unit Ukuran Luas stayed empty in DB.
- **Test**: みや set MLKIT Per = Meter Persegi (16:07) → PTMLK/03/L/PPTPB/2026/5 Pertanian Lain-lain = RM20 x 80 m² = 1,600 (fix follows the page). MLKIT still Meter Persegi; MLKSTG Lot.
- **Delivered**: Task folder `280540.xlsx` (MLKSTG · MLKIT Sebelum · MLKIT Selepas; joined per-row view + table.column source row) + `280540.sql` (subquery joined view, no JOIN). Redmine reply (short) posted by みや.
- **Closed**: QA-280540 Phase 1 (status=closed, commit 66777ba6d5, on int-env + stag-env). Phase 2 archive after BA confirms.
- **Slips**: ticket-context-skipped · scope-overreach (verdict columns for BA) · output-shape (row-only data, no joined per-row parent view) · reask/verbose ×2 · reask/redundant.
- **Open**: MLKIT Per back to Lot (みや decides) · PROD PPTPBL Per = Lot before release · maintenance page Unit Ukuran Luas not persisting on re-added row (unconfirmed, needs one retest).

## Session Recap (2026-09-24 evening, redmine-278909 worktree)
- **Ask**: /quest #278909 start→finish + test scenarios, staging. BA: Tidak Boleh Dipertimbangkan (PDT) / Tolak (PTG) + ada pemilikan → Risalat MMKN missing 2.3.3 (berkahwin) / 2.3.2 (bujang, syarikat).
- **Root**: CR #262049 (Aaron) built AdaPemilikan variants for Boleh Dipertimbangkan only; the 3 Tolak AdaPemilikan docx NEVER existed on any ref. Ammar `1e05aa9169` (09-23, msg "refs @#280029") added the 3 Tolak AdaPemilikan config entries + `adaPemilikanTanah=false` filters WITHOUT docx → merged whole 280029 branch into release/1.6.3 (by us) → master/int-env/stag-env. Staging 1.6.3 now throws `SystemException: Couldn't load file` (みや photo, asmida, 24/09 18:05). PROD on 1.6.3 same; NO hotfix (みや) → next release.
- **Decision**: option A — 3 separate docx, config names as-is, no Java/config change. B (CC tags in base) rejected: numbered tajuk leaves dangling "2.3.3".
- **Delegated**: みや prefers to guide junior (Siti Farhanih, Redmine assignee). My built templates removed from his tree; reference copies + PDF renders at `E:\Dev\tmp-278909\`. Test data in Task `1. 278 909.txt` (PT/2026/32, /24, /2 @ asmida PRMMKNPDT).
- **Slips**: `release/unaudited-branch-content` · `reask/jammed-sentence` (Redmine note).
- **Open**: post Redmine note (needs "post it") · compare Farhanih's docx vs `E:\Dev\tmp-278909\` · merge stag-env+int-env · config→template existence check for release V3 (`cfg_missing.py`) · `TemplateSuratAkuJanjiRoboh.docx` missing in config since ≤1.6.2 · memory edit (one-idea-per-line split check) blocked from worktree → add in `feedback_ticket_writing_style.md`.

## Session Recap (2026-09-24, perak-ticket-deploy worktree)
- **Ask**: deploy Perak eSOKONGAN-CR #110506 (Fatin, branch `esokonganCR/110506`: No Permit · Bayaran Permit · Jadual 20) to `prk/int-env` if sound.
- **Review**: branch tip `9f9e5dcc8d` compiles green. Findings for Fatin (owed, not sent): (1) HIGH `PelupusanService.saveRunningNumber():2319` `if PRU` became `else if`, so PRBB no longer falls to the generic No-Permit fill (Perak staging: 6 PRBB rows with MKLMT_TMBHN + NO_PERMIT_LESEN null) — one-line restore; (2) tujuan saved by name, read by code (`PelupusanService.java:3365` vs `PelupusanMaklumatBayaranHelperForm.java:318`); (3) `LaporanP1eForm.java:366` fi NPE + ICU BigDecimal import.
- **Merge**: whole branch (みや chose it after I wrongly recommended cherry-pick; cherry-pick only defers the conflicts). 12 conflicts, 9 master-sourced → int-env side; IPelupusanService union; MaklumatTanahPlpForm kept int-env (auto-merge double call). Merged-tree compile green vs common 1.52.7-PRK.beta.patch4. Pushed `prk/int-env` 4e0a02a968 → **a71c31d97c**. Work clone only, his tree untouched.
- **Closed**: QA-110506 archived (Task folder `1. Tasks\Perak\Archive\10. ESOKONGAN-CR #110506 ...`, qa_doc `projects/coding-projects/archive/QA-110506/`). Knowledge: `perak/BRANCH-AND-DEPLOY.md` §6 prk/int-env.
- **Open**: みや deploys int-env + footer check · Redmine note to Fatin (findings 1-3) needs his nod · refinement proposal: compile-check `--path` so Perak/work-clone compiles write a marker.
