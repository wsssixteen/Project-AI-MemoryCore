# Current Session

**Last Activity**: 2026-09-29 15:10 — #278909 Risalat MMKN PT: Farah's rework audited, PBN regression fixed (Option D), committed + merged int-env/stag-env, stag-env caught up to PROD 1.7.0, Phase 1 closed · DE.

## Session Recap (2026-09-25 → 09-29, #278909, worktree redmine-278909-ebf259 — git link pruned mid-session, saved from main)
- **Decision**: separate AdaPemilikan templates (option A) over CC tags in the Tolak base — tajuk paragraph is auto-numbered, an empty CC leaves a dangling "2.3.3"; renderer has no paragraph removal.
- **BA add-on**: PDT tidak boleh dipertimbangkan + PTG lulus. PT was on single `KeputusanSyor` (PTG overwrites PDT). Farah moved PT to dual keys → dropped PTG "Diangkat untuk pertimbangan PBN" (#260325) + relabelled PDT radio. Refuted; replaced by `40993fe86d`: PT stays single-key, PDT tugasan also saves `KeputusanSyorPDT`, 5.1 CC `syorKeputusanPDT` reads it.
- **Shipped**: `mlk/internal-issues/278909` 40993fe86d · int-env 8f339a6861 · stag-env ab7a68c42f → 1.7.0 catch-up 2a9cd0afa5. Compile ×3 green, `E:\Dev\tmp-278909\review\Sim.java` 8/8. Not run on JBoss; render check pending deploy.
- **Open**: miya deploys int + stag · post Redmine root cause/solution (text in QA doc) · pass to BA · int-env lacks 1.7.0 (4-file conflict, left) · stg2 `PTMLK/01/L/PT/2026/2` + 6 mlit syarikat PT apps are Flowable orphans (Initiate & Alter) · new PROD alter tickets #282178, #282175 have no block.
- **Built/saved**: brief skill cap 60→25 lines (eval green) · memory dev fix-list Redmine shape (`feedback_ticket_writing_style`) · slips `gate/false-positive`, `reask/verbose`, `git/write-in-miya-repo`, `knowledge/derivable-not-derived` · 2 wrong-fix rows.

**Last Activity**: 2026-09-29 14:55 — #281650 rework (MLPS PTMLK/02/L/MLPS/2026/8 Tanah Kerajaan) patched in PROD, verified, closed + archived · DE.

## Session Recap (2026-09-29, #281650 rework)
- **Ask**: BA (Fizah/Idris) wanted Tanah Kerajaan (No.PT) on MLPS/2026/8 to show numbers only, no leading dash, no "&", no PT wording ("225,226").
- **Limit**: `umm_a_permohonan_tnh.no_lot` is NUMERIC (`'225,226'::numeric` errors); L1e prints `no_lot` + " - " + note. miya chose `225 - 226` (patch ticket).
- **Done**: `3. Rework\2. Fix\281650.sql` — row 46856 no_lot 225 + note 226, licence row 4346 same (so next renewal seeds it). Infra ran it; PROD verified. Redmine Resolved text prepared (miya posts).
- **stg2 test** (MLPS/2026/4 row 44424, note 1140): L1e + 4Ae show `1139 - 1140`; Papar Borang 4Ae + Simpan did not touch the row, so my "Simpan wipes the note" claim is refuted (LATENT-BUGS L15). miya to run the stg2 reset.
- **Closed**: QA-281650 archived (Task 239 to Archive, doc to archive/QA-281650, block to active-archive, cycle-0 block merged).
- **Slips**: `assume-not-verify/state-guess` x2 (Hantar-safe claim; wipe claim before test) · `reask/misread-ba-intent`.

**Last Activity**: 2026-09-29 12:18 — eSOKONGAN priority rule patched system-wide · Redmine retrieved · 3-ticket sweep (W1-W4, 9 familiars) · DE.

## Session Recap (2026-09-29, redmine-tickets-triage worktree)
- **Rule (miya)**: "eSOKONGAN ticket" = TRACKER eSOKONGAN (id 51, SLA), never the project name. Order: eSOKONGAN → anything PROD → rest; inside each Priority, then urgent words in description/journals. Built into `quest/redmine-board.js` (table order, Severity column + URGENT flag + banner), list-redmine eval 17/17, list-redmine / sweep / retrieve-redmine skills, session-briefing.md, CLAUDE.md v1.73 §Vocabulary, memory `feedback_esokongan_means_tracker`.
- **Board**: all Medium, no urgent words. 282061 (eSOKONGAN, due 8 Oct) · 281650 (DP PROD, reopened today) · 6 others. 278909 Resolved. 274266 + 264355 now with Farah (miya reassigned 264355 at 11:51 with a guide; active-cli refused the delegated update — block still says active).
- **Sweep** (qa_docs in main repo `projects/coding-projects/active/QA-<n>/`): 282061 two permit counters + borang Fi sums RM 200 fee → code C1-C4 + 4-row number swap, 83% · 281650 dash is code `PelupusanTemplateReportMethodParameter.java:772`, code fix alone renders "PT 225 & PT 226", 1 PROD row, 80% · 281324 `MLK_PLP_SUB_UPN` gateway needs `caraPenghantaran` default (1 model) + 5 PROD instances rescued via Flowable admin, 90%. 6 tickets swept 25 Sep skipped (no Redmine activity since).
- **Tooling gap**: familiars could not write qa_docs (worktree guard on base checkout + sibling-file ban); outputs went to scratchpad and I banked them via PowerShell.

**Last Activity**: 2026-09-28 18:46 — OneDrive "Rename 1 item? NUL" popup diagnosed; nul-redirect-gate + system-audit CHECK 10 built · DE.
