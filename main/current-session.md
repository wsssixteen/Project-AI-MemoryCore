**Last Activity (adhoc child session: JT reminder stg1 patch + 291283 merged to staging)**: 2026-11-25 16:50 — worktree `bold-poitras-bfe005`, session "24/11/2026 - adhoc". 291283 (PLBP eDoket payment split, yihkitc fix on mlk/requirement/282117 8b69d2827e) merged into pelupusan mlk/stag-env 7177db9453 at 2026-11-24 21:46; 4 conflicts + 1 template.config line kept at staging side on miya's rule "not needed by the ticket → keep staging" (staging lines from 256334 / 263307 / 280110); compile green; miya deploys, BA Anis verifies on staging. ADHOC-UJT-2026-1 stg1 round: PGSJT dates + flag reset for PTMLK/02/L/PLPS/2026/36 and PTMLK/03/L/PT/2026/61, committed, BA checks the 8am email.

## Session Recap (2026-11-24 to 25, adhoc child session)
- Asked: load Melaka knowledge for adhocs; OPLBP on internal + 4Be or 4Ce; does Kedah use the Report API for Notis 5A; prepare + run the JT reminder patch on staging; merge 291283 to staging; save adhocs + DE.
- Done: knowledge loaded (3 DBs answer); OPLBP = Borang 4Be (MLIT + PROD ind_tgsn); Kedah pelupusan has no Notis 5A API branch on 4 kdh branches (Melaka 285171 is MELAKA-only), reply drafted for Dayana; stg1 patch committed and read back; 291283 merged + pushed after tracing every conflicting line to its ticket.
- Open: miya's staging deploy of pelupusan; BA verify of 291283 on staging; 8am JT email result on staging (2026-11-25).
- Mistakes he corrected: session renamed "adhoc" dropping the "24/11/2026 - " format (slip `reask/format-dropped`).
- Assessment: A1 one background agent per save worked (31/31). A2 deploy guard stopped a conflict merge; his rule "keep staging if not needed by the ticket" + blame per line made it a 2-step decision. A3 ⏭ no debugging. A4 OPLBP 4Be and Kedah Notis 5A facts written to knowledge. A5 ⏭ no sweep.

**Last Activity (290196 colleague question + wrong assignee fixed + module check built)**: 2026-11-25 16:44 — worktree `adoring-wing-468fbc`. 290196 passed to BA Fatin Nur Amalina (811), Root Cause / Resolved By cleared, quest Handed-to-BA. System 98c865e4 (landed main 7bbdf047): Phase 0 step 2c MODULE line; other module = Notes + Assignee only. ba-names Fatin alias fixed (df64a297).

## Session Recap (2026-11-25, 290196)
- Asked: colleague (Reports) asked what 290196 is and if it is etanah-common; then trace the PROD error; then pass the ticket to the right PIC.
- Done: PROD cause = bare `mb` EL in Pendaftaran composites (raja 2cb982f72, not in sgr/master), staging DMS file was a second issue; module = etanah-pendaftaran. WhatsApp drafts given. Ticket submitted to Fatin Nur Amalina with Notes + Assignee only.
- Open: WhatsApp reply is miya's to send. ticket-load-verify eval case 17 fails (pre-existing). GitHub main vs main-folder SHA split (open since 20/11).
- Mistakes he corrected: --ba "Fatin" assigned Nurfatin Auni (Reports); we filled Root Cause + Resolved By on another module's ticket. Slips wrong-assignee, scope/other-module-fields.
- Assessment: A1 module check built at Phase 0 (98c865e4). A2 hand-back field set now follows the module. A3 PROD error traced in one pass from screenshots + git. A4 Selangor people table gained both Fatins. A5 ⏭ no sweep.
**Last Activity (291261 PROD alter SPM to PLPP + patch tickets hand back Resolved)**: 2026-11-25 16:45 — worktree `brave-panini-04ff31` (child of the master session). PTMLK/03/L/PT/2026/79 Initiate & Alter on PROD (code 128A-D0DE, miya approved) to PLPP, eddie@melaka.gov.my; Redmine 291261 submitted Resolved to Mira and read back; quest archived. System 479b89e2 (main 739470e7): redmine-write-gate v1.15, Internal Issue (PROD) and Data Patching (PROD) hand back as Resolved.

## Session Recap (2026-11-25, 291261)
- Asked: /quest resume 291261, the alter ticket end to end; then why patch tickets are not set Resolved; "Set that and submit".
- Done: live PROD state re-checked, dry run, PROD alter (AFTER rows verified), Redmine note + Root Cause submitted Resolved, quest archived with bounty; status rule reads the tracker (eval 185/185); 3 slips logged.
- Open: none for this ticket (Mira verifies). Main folder still 115 behind origin with another session's staged files; this session's files match origin.
- Mistakes he corrected: patch ticket handed back without Resolved (rule gap). Slips `redmine-status`, two `blocker` rows (gate could not read "Set that"; step-3 rider cannot see same-message text).
- Assessment: A1 two gates refused ordered work (word reader, step-3 rider), logged. A2 alter route ran clean in one pass (dry run to approval to AFTER). A3 ⏭ no debugging. A4 SPM to PLPP recipe written to FLOWABLE-KNOWLEDGE. A5 ⏭ no sweep.
**Last Activity (291091 PROD letter patch + hand-back steps fixed)**: 2026-11-25 16:40 — worktree `admiring-chaplygin-140cd7`. 291091 BA Verified; PROD letter PTMLK/03/L/MCL/2026/4 (LAIN-37496656, rev 41811120) Jenis Hakmilik -> Geran Mukim (MCL), infra replaced + PDF reset (read back NULL); Redmine note submitted by miya. Phase 1 closed, Phase 2 waits for release + Redmine Closed.

## Session Recap (2026-11-25, 291091)
- Asked: patch the PROD letter (permohonan already at Cetakan Dokumen); scan the whole letter; stage Redmine; fix the broken hand-back steps.
- Done: letter scanned vs PROD (all values correct, only Jenis Hakmilik changed); wrong attachment caught before infra; system f8e60ff3 (no verify line on a Verified ticket) + b0488e0d (Pena "Fits the ticket?" + prefill re-check of a staged form).
- Open: main folder holds b0488e0d as working files only (115 behind origin, another session's staged files).
- Mistakes he corrected: verify line on a Verified ticket; files lost after reload reported as staged; first fix skipped parts of /system-build. Slip `redmine-note`.
- Assessment: A1 resume opened a fresh tab, staged state lost (proposal logged). A2 judge step he asked for never existed (built as Pena question, proposal for inputs on screen). A3 ⏭ no debugging. A4 letter-value lookups written to DATABASE.md after 4 query misses. A5 ⏭ no sweep.
**Last Activity (Baseline Pelupusan 1.10.2: released to master and staging)**: 2026-11-24 09:13 — worktree `melaka-baseline-prep-8df5bd`. Release 1.10.2 = 290646 + 290707, no SQL, no flowable, common 1.15.2-MLK.domain.1.0.17-MLK. Pushed 7308f6dab3, staging deployed 16:05 (footer matched), BAQA passed, MR 28 merged by Aaron (091e0d978d), stag-env 3dfead687f (keep-both conflict with 263307 in MlkKertasTemplateForm.java, compiled). State file phase = merged-to-master, stag-catchup --check clean.

## Session Recap (2026-11-23 to 24, Baseline 1.10.2)
- Asked: prepare Melaka baseline; merge; push; is staging ready to tell BA; BA 6.2 dash on PRBB/2026/19; BAQA passed; merge to staging; is GitLab AI review a false alarm; DE.
- Done: release cut, merged, verified, bumped, pushed, card; 6.2 traced (ulasan saved 16:37:38, e-Doket tag present, two causes + one-click test); MR 28 created (Aaron) and merged; staging catch-up with keep-both conflict fix; GitLab AI findings checked against full code (no bug).
- Open: QA-290707 Phase 1 close-out and QA-290646 Phase 2 belong to their own quest sessions; cause of the first 6.2 dash unproven (BA verified after).
- Mistakes: none he corrected; redmine-write-gate false positive on `card --target-version` (blocker slip logged).
- Assessment: A1 release script carried every step, two gates misfired on my own commands (redmine URL, variable path). A2 ⏭ no quest work beyond release. A3 6.2 trace reached DB + template in 10 queries, stopped at the unproven edge. A4 GitLab AI review answered from code, not trust. A5 ⏭ no sweep.

**Last Activity (ADHOC-PRBB-2026-26 Rencana JKBB PTG lost daerah edits: cause + plan agreed)**: 2026-11-20 16:13 — worktree `adhoc-prep-5a52cc` (branch claude/adhoc-prep-5a52cc). PROD PTMLK/02/L/PRBB/2026/9: PTG Jana (`MlkKertasTemplateForm.onJanaUpdate :1814` → `deleteExistingRisalatDocuments`) deletes the daerah Rencana record and makes a fresh template, so versi 24 Word edits are lost. Proof: code + DB + PROD server log (WinSCP, wanda1/2) + decrypted v24 vs v4 (253 vs 219 paragraphs). Plan agreed with BA Fizah: (1) code fix = PTG Jana refills only PTG tags on the same record, the Minit Bebas way (`PelupusanTemplateUtil.restrictPrbbMinitBebasContentControls :671-693`, BA tested MLIT /19); (2) patch: replace RAHSIA-37598722_1.main (record 8783881, revision 41916109) with daerah v24 encrypted by `dms-enc.js` (round trip byte-identical to PROD), reset PDF. Waiting TSO code-fix + patch tickets; adhoc on hold, audit 32/32. Also: ProTime 2026-11-19 = EL only; PROD log + Pena change built outside /system-build (todo row, finish at end of session).

STEP-3:
session: c5607828-e775-4a34-a60a-96566f994204
his words: "DE" (order: Domain Expansion; save-rules asks the prefill skill version stamp for the 291261 Status-row change)
cause step: .claude/skills/redmine-phase1-prefill/SKILL.md History · change: 1 line
new parts: 0

