# Current Session

**Last Activity**: 2026-09-30 13:45 — MLIT pelupusan deploy failure triaged (infra, not our code) · retry succeeded 13:13 · deploy skill v1.3 §8 console triage · DE.

## Session Recap (2026-09-30, server-deployment-slowness worktree)
- **Symptom**: miya's pelupusan deploy to MLK IT (`mlk/int-env`, run `e711b154`) "taking too long"; MLIT `/etanah-pelupusan` returned 503 (hasil, pendaftaran 200).
- **Cause (from the run log)**: Build SUCCESS; prepare on `172.16.100.49` (fudge1) died — `Killed sudo -n systemctl stop jboss` · `stop_jboss.sh: line 4: kill: (1481372) - Operation not permitted` · `Killed '/home/app/bin/stop_jboss.sh'` · exit 137. Infra (Nick). Hypothesis, unconfirmed: stop script kills by a "jboss" name match that hits itself.
- **Retry** `304b7721` 13:12 SUCCESS only because JBoss was already down (no "Stopping fudge1 JBoss..." line); console build `11:19:55` unchanged → no fix seen. Expect repeat on next deploy to a running `.49`. MLIT pelupusan back (Laman Utama 200). miya messaged Nick; WP (James) had the same the day before; 25 FAILED MLK runs 25-30 Sep in History.
- **How Ruri reads the console**: Claude in Chrome (miya's Keycloak session); full log JSON at `/etanah-deployment/api/deployment-history/<id>` · live at `/api/deployment-queue/<id>/live`.
- **Built**: deploy skill v1.3 §8 (step→owner table, keywords, known 137 case), eval 52/52, `2f509f2d`.
- **Slip (self)**: suggested Nick "probably changed the stop script" without evidence; miya asked "how do we know"; corrected with the console build-time diff.

**Last Activity**: 2026-09-30 13:50 — #281324 re-verified + plan set (sub-flow only) · weekly planner Wed-Fri from Redmine · #281423 synced (Teknikal data-mapping consult) · DE.

## Session Recap (2026-09-29 afternoon → 2026-09-30, redmine-tickets-triage worktree, part 2)
- **#281324**: re-synced, blind re-check on live staging (et_flowable17) holds. Fix = Data Object `caraPenghantaran` default `TP` in `MLK_PLP_SUB_UPN` ONLY (not the 12 main flows; miya asked, W3's main-flow shape was rejected by W4) + admin variable-add on stuck cases. Staging repro: PTMLK/03/L/PRBB/2026/8, task 11675067, samsiah_jaamat@melaka.gov.my. 7-step table in QA-281324.md §0b. Waiting on miya to publish on staging; Redmine In Progress waits on "post it".
- **Planner (miya's "My Weekly Planning", Wed-Fri)**: Wed 280540 (eSOKONGAN, due 30 Sep) · 281423 · 281324 — Thu 275043 + 244600 · 274323 — Fri 265109 · 246923. Resolved on Redmine: 279411 · 281638 · 281712 · 278909 · 274266 · 281650 (Ready in PROD) · 282061 · 282275. 282198 is with Idris (pending user update).
- **#281423 (new)**: Teknikal (Aiman Syakir) asks Pelupusan for the data mapping to tell Pemohon / Pemilik / Individu / Syarikat apart in `umm_a_pihak_bkptg` (ref #275018). Consultation, not our code. miya starts it in a NEW session; QA-281423.md has the resume point.
- **#280540**: now eSOKONGAN assigned to miya, due 30 Sep, Not drafted.
- **Knowledge**: FLOWABLE-KNOWLEDGE §14 (child Data Object default vs caller In-param, by-key calls take latest version, bpmn-check blind to Data Objects).
- **Slips**: `reask/verbose` (281324 hand-back buried a 2-job fix under J-tables) · proposal A1 redmine-write-gate blocks read-only GETs.

**Last Activity**: 2026-09-29 18:35 — #282061 PPTPB Permit Khas Jadual VIII: 4-part fix committed, int-env + stag-env, Redmine Resolved to Fizah, PROD-only swap + dup-bill script attached · DE.

## Session Recap (2026-09-29, #282061, worktree quest-282061-rubric-7a809b)
- **Bug**: PROD `PTMLK/02/L/PPTPB/2026/5` (PYJ, norlina@melaka.gov.my) borang showed No Permit Khas `02/2026/3` + Fi RM 2200; BA expects `02/2026/1` + RM 2000 (screen must tally with borang).
- **Cause**: skrin 338 Simpan minted the register number at every PPTPB tugasan (only PLPS exempt since #273461) · screen and borang read two different counters · borang Fi summed PPTPB 200 + PPTPBL 2000 · bill saver reuses only UNPAID rows, so a save after payment re-billed PPTPBL.
- **Shipped**: `mlk/esokongan/282061` `2729190807` (R1 mint at Jadual only · R2 screen reads register · R3 Fi = PPTPBL · C4 no re-bill after payment) · int-env cherry-pick `1cc113f7ee` · stag-env `6c891898ad`. miya deployed; mlit rehearsal patch verified.
- **PROD data**: `2. Fix\282061.sql` (PROD-only, attachment 1023225): swap /5 ↔ /1 in `umm_a_permit_lesen` + `ind_permit_lesen`, delete unpaid dup PPTPBL bill. Swap proven 100% safe (register rows keep own lot + holder, links by id only). Runs with the release.
- **Built**: redmine-write-gate v1.2 (popup + plain status approval, eval 38/38) · `ticket-close-block --ba --envs` prints miya's BA pass note · quest SKILL: Hand-over to BA · Plain first · Everything on this ticket · brief v1.2 · deploy 6b · PERMIT-LESEN knowledge two-counters section.
- **Slips**: reask/rambling · reask/incomplete (D1 dropped) · popup-conflated-options · reask/redundant (BA note in my shape, not his template) · 2 proposals (gate popup gap, sql-schema-verify cross-product).
- **Open**: BA verify on internal/staging · PROD release runs `282061.sql` · other-urusan early-mint audit landed as ADHOC-PERMIT-2026-1 (other session).
**Last Activity**: 2026-09-29 18:30 — #256334 PDBB CR closed + archived (Hasil hand-off solved with Li Wen); ADHOC-HSL-2026-1 opened for Hasil #282275 langkah · DE.
