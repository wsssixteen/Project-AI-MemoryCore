# Current Session

**Last Activity**: 2026-09-24 18:55 — Selangor PLMS adhoc answered (pelan GPTOL patch location = permohonan, not versi lesen); ADHOC-SGR-PLMS-2026-1 closed + archived; DE.

## Session Recap (2026-09-24 evening, gptol-patching-location worktree)
- **Ask**: PLMS Penyediaan Borang (PYB4AE, langkah PYB4AE_2 Maklumat Pelan L1e): when patching the pelan GPTOL, patch permohonan or versi lesen? Is it by No Lesen? **State = Selangor** (みや said so only at close).
- **Answer**: permohonan. `PelupusanReportService.getLaporanBorangL1e()` reads `UMM_A_DOK_KELUARAN` by the PLMS aplikasi + `GPTOL`, then latest active `DOKUMEN` (medan UMM_A_DOK_KELUARAN, medan_pk = adk id). No Lesen only drives the MLMS branch, which still ends on an aplikasi. `IND_VERSI_PERMIT_LESEN.PELAN_DOK_ID` = decoy, never read.
- **Evidence**: Selangor `sgr/master :1951` + `origin/master :2126/:2304`; Perak `master` same shape + oracle-prk-stag langkah/skrin rows. oracle-slt REFUSED (WinError 10061) so Selangor DB not read.
- **Slip**: `state-assumed` — answered on Perak code because Melaka had no PLMS; never asked/derived the state (Selangor also has PLMS). Caught by みや's close message.
- **Closed**: ADHOC-SGR-PLMS-2026-1 archived (quest/active-archive.txt block + qa_doc projects/coding-projects/archive/ADHOC-SGR-PLMS-2026-1/). Knowledge: selangor/STATE-FACTS.md PLMS pelan section + perak/STATE-FACTS.md §10.
- **Open**: none. If a real patch comes, give the PLMS permohonan id + env and pull its GPTOL rows first.

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
