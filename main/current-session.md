# Current Session

**Last Activity**: 2026-10-02 18:15 — #246964 takeover of Ammar's fix: review, revert his Java on his branch, merged int-env 803e4907bd + stag-env 5110004a80, miya posted handover, Phase 2 archived, DE.

## Session Recap (2026-10-02, worktree permit-c02-2026-3-portal-362d6d, session 7)
- **Ask**: retrieve #246964 and review Ammar's fix ("within Melaka standard?"); then take over, commit, deploy, Redmine handover.
- **Done**: Ammar `ef49baf78f` = template (tahun after tempoh pajakan, slogan left) correct + Java (PSBS blank signature block before Peraku) NOT asked and against our #278699 placeholder rule. We committed `6feb2525c6` on `mlk/qa/246964` reverting the Java (file now equals master). Merged int-env `803e4907bd` + stag-env `5110004a80` from a temp worktree (work clone had another session's uncommitted edits). miya posted the pass note, assigned Mira, fixed Resolved By. Quest archived (Task folder to Archive, block to active-archive).
- **Built**: takeover rule in quest SKILL (Colleague asks us to review their fix = TAKEOVER, junior template work stays guide-only) + deploy 6 row 10 + review-etanah pointer. LATENT-BUGS L20 (PLTP + PPTPB Tolak slogan still justified).
- **Slips**: `workflow/handback-instead-of-takeover` (drafted a "please fix" note for Ammar).
- **Open**: render not verified (no PSBS app at PYSTP/PSTP on stg2 or mlit; BA to regen) · #246964 on the planned-release list.


**Last Activity**: 2026-10-02 17:45 — ADHOC-PRBB-2026-11 assist BA Fizah: PROD permit C02/2026/3 data + MLIT 4-row explanation + tugasan all-daerah query · adhoc saved 28/28 · Phase 2 archived + bounty · DE.

## Session Recap (2026-10-02, worktree permit-c02-2026-3-query-dba198, session 6)
- **Ask**: BA Fizah (Nurhafizah Hasan) via WhatsApp: tujuan, kuantiti diluluskan, tempoh diluluskan + maklumat tanah for No Permit C02/2026/3; why internal shows 4 rows; query id permohonan at a tugasan for all daerah.
- **Done**: PROD 1 row (apl 3408435): MERATAKAN TAPAK, 5000 meter padu, 30 hari 21/08-29/09/2026, GM 230 Lot 2211 Mukim Ayer Panas. MLIT 4 rows = follow-on permohonan (OPRBB asal, PRBB Ganti Hari, 2x PDBB) copy permit asal, test data, no alter no patch. Tugasan query already all-daerah; added daerah column via `ind_pejabat`. Task `263. AH - PROD - PRBB - Query data permit C02-2026-3 dan tugasan semua daerah` (now Archive\) with `2. Fix\ADHOC-PRBB-2026-11-check.sql`. ProTime title `Assist BA - Adhoc Query Data PRBB Permit C02/2026/3 & Tugasan Semua Daerah`.
- **Knowledge**: PERMIT-LESEN-RUNNING-NUMBER.md § One permit number on many aplikasi · index.md 2 quick-links (lookup code table `rjk_senarai_ahli_kumpulan`, permit approval data).
- **Slips**: answered on PROD before checking which env the BA's screenshot came from (she was on internal) · first reply lacked the proving SELECT (db-claim-proof stop) · guessed a lookup table name instead of reading DATABASE.md.
- **Open**: none.

**Last Activity**: 2026-10-02 17:35 — #282587 review of Farah's fix → Phase 1 CLOSED · D1 run stg2+mlit · merged int-env e16fd046ec + stag-env 387011c8fc · PROD 282587.sql on Redmine (checked safe) · pass-note tool fixed · DE.

## Session Recap (2026-10-02, worktree review-282587-quest-4e465d)
- **Ask**: start quest, review Farah's #282587 fix, brief; then patch, PROD script, deploy, Redmine handover.
- **Done**: Farah `0229aee7d9` (R1 Minit Bebas in PSBS SKM list + R2 Tangguh Formula Premium) correct, no correction. D1 (6 PSBS langkah 1878→1140) was missing: we ran it on stg2 + mlit (rollback-guarded, 6 each). PROD `2. Fix\282587.sql` (et_main) attached by miya, safety-checked. Merged + miya deployed internal + staging. miya posted pass note. active.txt status=closed. Red-box photo `2. Fix\1. PYMB - skrin Maklumat Tanah seperti SKM.png`.
- **Built**: `ticket-close-block.js` colleague-fix shape (no list, no commit block, branch only if history lacks it, AWAM keeps it) + `ba-names.json` (Amirah→Mira, Nurhafizah→Fizah) + `--prod-script` + full `Attach:` path · quest SKILL § Hand-over + deploy 6b + memory ticket-writing-style 2b.
- **Slips (miya)**: `brief/ambiguous-owner` (didn't say D1 script was ours) · `reask/format` (Amirah + Farah's commit block) · `full-path` (short attach path).
- **Open**: KP SBTM (11282) left for BA to test later · Phase 2 archive after BA verifies · #282587 must be on planned release list with 282587.sql · sql-schema-verify emit cross-products columns (12 false rows), stamped by hand.

**Last Activity**: 2026-10-02 17:22 — ADHOC-PRBB-2026-10 AWAM Slip Permohonan 500 on Hantar = common #282299 (report API for MLK), all modules hit · casual suggestive message + evidence scripts for miya · adhoc saved 29/29 · DE.
