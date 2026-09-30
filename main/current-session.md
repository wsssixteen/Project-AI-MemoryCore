# Current Session

**Last Activity**: 2026-09-30 15:25 — MLIT internal deploy card · pelupusan build died at antrun zip (concurrent deploy-pendaftaran-it.sh) · ADHOC-VIEW-2026-1 scripts handed for all envs · DE.

## Session Recap (2026-09-28 → 2026-09-30, melaka-internal-deploy worktree)
- **Deploy card**: internal = one host `172.16.100.162`, `deployment-scripts/mlit`, `sh deploy-<module>.sh`, branch `mlk/int-env`.
- **Pelupusan build failure (2026-09-28 10:49)**: first failure `maven-antrun-plugin (replace-properties): Problem creating zip: .../target/etanah-pelupusan.war (No such file or directory)` after 59.8 s; everything below it was cascade. `ps` showed `deploy-pendaftaran-it.sh` (pid 1817149, pts/2, started 10:36, 21+ min). HYPOTHESIS, unconfirmed: concurrent run on mirage1. miya never pasted the re-run result.
- **ADHOC-VIEW-2026-1**: Alex asked whether the views include expired lesen/permit. Yes — no status filter (same as KL). PROD evidence: all 3148 permit rows `flag_permit = KuatKuasa` incl. 731 past `trkh_tamat`, so status never flips on expiry; filter by `tarikh_tamat` / `bakitempoh`. Neither view exists yet on STG2 · STG1 · MLIT · PROD (information_schema, 2026-09-30). Scripts handed in chat; PROD via infra needs `et_main.` prefix + miya's nod.
- **Slip (self)**: first answer told miya to filter `flag_permit = 'Kuatkuasa'` before checking the data; corrected after the PROD query.

**Last Activity**: 2026-09-30 13:45 — MLIT pelupusan deploy failure triaged (infra, not our code) · retry succeeded 13:13 · deploy skill v1.3 §8 console triage · DE.

## Session Recap (2026-09-30, server-deployment-slowness worktree)
- **Symptom**: miya's pelupusan deploy to MLK IT (`mlk/int-env`, run `e711b154`) "taking too long"; MLIT `/etanah-pelupusan` returned 503 (hasil, pendaftaran 200).
- **Cause (from the run log)**: Build SUCCESS; prepare on `172.16.100.49` (fudge1) died — `Killed sudo -n systemctl stop jboss` · `stop_jboss.sh: line 4: kill: (1481372) - Operation not permitted` · `Killed '/home/app/bin/stop_jboss.sh'` · exit 137. Infra (Nick). Hypothesis, unconfirmed: stop script kills by a "jboss" name match that hits itself.
- **Retry** `304b7721` 13:12 SUCCESS only because JBoss was already down (no "Stopping fudge1 JBoss..." line); console build `11:19:55` unchanged → no fix seen. Expect repeat on next deploy to a running `.49`. MLIT pelupusan back (Laman Utama 200). miya messaged Nick; WP (James) had the same the day before; 25 FAILED MLK runs 25-30 Sep in History.
- **How Ruri reads the console**: Claude in Chrome (miya's Keycloak session); full log JSON at `/etanah-deployment/api/deployment-history/<id>` · live at `/api/deployment-queue/<id>/live`.
- **Built**: deploy skill v1.3 §8 (step→owner table, keywords, known 137 case), eval 52/52, `2f509f2d`.
- **Open (miya's rulings)**: bake fudge1 line into ENV-ARCHITECTURE.md? · retire 5 zero-fire hooks? · reconcile: 274266 / 282061 / 280540 Resolved on Redmine, 264355 / 282198 with others, #281423 has no block · worktree cleanup (59 folders = 16.34 GB of 16.82 GB) + move creation to `E:\Dev\worktrees`.
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
