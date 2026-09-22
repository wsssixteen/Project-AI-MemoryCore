# Current Session

**Last Activity**: 2026-09-22 — new-ticket intake + Phase 0 (278909, 279711, 280176) + DE.

## 🎯 HANDOVER — Focus tickets (load this after compaction)

| # | Type | Focus / next action | Effort | Why |
|---|---|---|---|---|
| **280614** | Data patch (PROD) | ✅ **APPLIED** (verified: permohonan /9+/10 tempat='-', lesen rows patched) → **close it** | done | patch ran |
| **280540** | eSOKONGAN code | build `PLP_BANGUNAN_*` flat-rate guard at `PelupusanMaklumatBayaranHelper.java:276` | build+test | recon done, net-new build |
| **246923** | template config | remove 3 dup keys (PRMMKNPTG/SRMMKNPTG/PRRMMKNPTG) from Block A in `template.config.json` | ~9 lines | rework, BA waiting |
| **274323** | Word CC | force `"RM 0.00"` in `PelupusanWordCCMethodConstant.java:4772` when royalti exempted | tiny | rework, BA waiting |
| **279711** | code (populator) | repoint `PelupusanWordCCMethodConstant.java:842-843` to gated `populateJawatanPegawaiSemak` + PPD branch in isValidUser :2043 | small | rework; ⚠️ MaklumatPemohon.docx shared-tag blast radius |
| **280176** | code (read-guard) | add `removeIf(getTarikhTamat==null)` at `PelupusanSearchService.java:2064` + `:2110` | 2 lines | rework; save-side fix shipped, read-side gap |
| **278909** | template add | add 3 docx twins + 3 config blocks (adaPemilikanTanah) mirroring Lulus family | medium | new; task folder unread — get Brief at Apply |

**280265** — patched (generateSurat 7547→YA); pending BA retest. Per DATABASE.md §24 the flip un-hides JPPH (show-goal); if BA needs re-add → Alex's DELETE pattern (BUG-BESTIARY §JT). Knowledge-first: read §24 on any JT ticket.

## Working Memory
- Melaka DB reconnected (postgres-mlkprod live, etprdmlk).
- Canonical formats only (never invent): infra-handoff + SCRIPT-CHECK + close-phase (`feedback_use_canonical_formats_never_invent`).
- close-phase now always emits Redmine Root cause + Solution.
- **Parallel session 2026-09-22 (this laptop)**: System-check run 3 (5 familiars + controller verify) for みや's "system-context-before-change" routine; MEMORY.md compaction parked.
- **みや's routine ask (2026-09-22)**: a mandatory mechanical rule = know the whole system context (why · goal · rules · structure · guardrails · monitoring · version · confidence) before any system change, plus a top-view registry of workflow groups. Appraised: real gaps = no group-level registry + no change-time context card for arbitrary targets; 70% of mechanics exist (`lib/change-checklist.js`, `system/registry.jsonl`, Rule 13 README keys, NUKE-MARKER, turn-ledger goal_met). His decisions via popup: audit first then build · group level named **System** · compaction resumes after the audit.
- **System-check run 3 result**: 6 CRITICAL · 9 HIGH · 12 MEDIUM, all in `main/todo.md` Q1 row "System-check run 3"; stamps updated in `system/evolution-protocol.md` (system-check + evolution-check both 2026-09-22). Headline: 9 ghost hooks the boot audit cannot see, `change-checklist.js` referencer step dead on this laptop (bash ENOENT), 26 OneDrive conflict copies incl. `.git` internals.
- **MEMORY.md compaction (parked)**: plan drafted = 48 merges → 118 files / ~129 lines; 2 dead files should MOVE to `.claude/auto-memory/archive/` (24 retired memories already live there), not delete; 25 live citers of memory filenames found by hand grep (quest SKILL, close-phase, bankai, patch-script-gate hook) → keep those filenames as survivors.

## Working Memory (carried from 2026-09-21)
- **Focus tickets for tomorrow (みや's plan list)**: 280614 (send to infra), 280099 (run Alter on page), 280540 (build code fix).
- **Melaka DB**: reconnected mid-session (was CONNECT_TIMEOUT at boot); postgres-mlkprod live (`etprdmlk`).
- **Canonical-formats rule**: never invent handoff/reply shapes — use infra-handoff + SCRIPT-CHECK + close-phase verbatim (`feedback_use_canonical_formats_never_invent`).

## Session Recap (2026-09-22)
- Reconciled active.txt vs Redmine (31 closed 09-21 + 280099/280191/278580 closed 09-22).
- 280099 solved overnight by Alex (DELETE JT rows) — not stolen.
- New/rework Phase-0 done: 278909 (template variant gap), 279711 (ungated populator), 280176 (read-side removeIf gap).
- Banked BUG-BESTIARY §JT dual-fix pattern (flip=show / delete=re-add) + cross-ref DATABASE.md §24.
## Session Recap (2026-09-21)
- **Board + reconcile**: みや 0 open; reconciled active.txt vs Redmine → **31 quests closed** (Redmine-done); 3 missing synced (265109/274323/246923).
- **280265** PT Patch Status JT — JPPH row 7547 `generateSurat` TIDAK→YA, PROD-applied + live-verified, closed in Redmine. `.sql` in `218…/2. Fix/`.
- **280614** MLPS Tempat ×2 — 4 rows live-verified, `280614.sql` built+stamped+sent; awaiting infra send + prevention-half decision.
- **280099** PT Alter Ke Kemasukan — live proc CT_BSC_PLP, Alter Flow → SKM (`MLK_PLP_PT.bpmn20.xml:7`); awaiting page execution.
- **280540** PPTPB formula — `PelupusanMaklumatBayaranHelper.java:276` unconditional multiply; fix = `PLP_BANGUNAN_*` flat-rate guard (not built).
- **280166** PLPS Hantar error — `caraPenghantaran` unset → gateway NPE; fix = set real delivery value (NOT flat literal); Ammar/cross-module owns.
- **New-ticket Recon (qa_docs written)**: 265109 (config-data gap), 246923 (config dedup ~9 lines), 274323 (force RM0.00), 279411 (add guard to MlkSenaraiSemakPTGForm), 275043 (Aaron's v2 verify).

Also on the plate: **#280099** (folder `216`, PROD PT "Alter Permohonan Ke Kemasukan") — retrieved, NOT swept; separate.

## 2026-09-21 (Mon evening, main repo session) — PymTime v14 "works when a friend installs it" (/goal + ultracode)

- **Repo** `E:\Dev\scripts\PymTime` main, commits `3b6f232` (v14) · `5498a74` · `95580ad` (docs), pushed to private `wsssixteen/PymTime`
- **Hand-out file** `E:\Dev\scripts\PymTime\PymTime-portable-v14.zip` (33.1 MB, SHA-256 `AAEB62F2…3BCB98`, BUILD.json git `95580ad`)
- **Proofs on that zip** selftest 546/546 · scenarios 36/36 · build gate · `dev/install-sim.ps1` 15/15 · `dev/upgrade-sim.ps1` PASS
- **His laptop** self-repair run from source (never `--live`): Reconcile registered, keep-alive shortcut created, doctor 26 ok · 0 broken
- **Still open** colleague's `Check PymTime.bat` output never received (the real cause on that laptop is unknown until it arrives) · per-office clock-in coordinates (old decision) · `holidays-2027.json` absent (the live Protime holiday check covers it)
- **Spawned** task chip: compact `.claude/auto-memory/MEMORY.md` under 140 lines
- **Memory** `project_pymtime.md` carries the v14 architecture, proofs and 9 lessons
- **v15 (2026-09-22 early morning, same session, /goal + ultracode)**: he asked "what guarantee"; honest root cause = every release was proven only on the build laptop and no data ever came back from a colleague. Built "Verify this laptop" (`lib/verify.js`, 21 checks incl. a task Windows really runs, one login, report file), evening day-truth from Protime + 10-day strip (`lib/history.js`, `reconcile.js`), false-READY guards, canonical-username fix. Commit `7eabfa0` pushed. Zip `E:DevscriptsPymTimePymTime-portable-v15.zip` SHA-256 `CE55C4BB…901070`. Proofs on that zip: selftest 558/558, gate ok, install sim 20/20, upgrade sim PASS; his laptop verify = READY 21/21. Workflows: assumption hunt (9 agents, 18 real / 17 dropped) + v15 review (3 agents, 19 findings, all fixed or consciously skipped). **Acceptance rule from now: a build is "working" only when the friend's `PymTime report.txt` says READY.**

## 2026-09-21 (Mon, worktree `plan-handover-sweep`) — APPLIED the 4 eSOKONGAN + git-tracking incident + OneDrive worktree death

**Arc**: START PLAN executed. Applied 3 non-gated eSOKONGAN fixes, resolved the gated one, gave Redmine RC/Solution + BA explanations, then a long SourceTree/git-tracking incident and a broken worktree.

**Fixes shipped (etanah-pelupusan, isolated worktrees/clone → BOTH int-env + stag-env, compiled JDK17 via `-gt` toolchains override pointing java17 at `C:\Program Files\Java\jdk-17`)**:
- **#280191** PLPS No Lot NumberFormatException — `PelupusanMaklumatPermitLesenHelper.onSimpanTanah():3603` guard `isNotBlank(getNomborLot())`. Scope GREW per みや: + popup validation (blank No Lot **AND** blank No Lot Bersebelahan `noRujukanLokasi` → `MESEJ_NO_LOT_DAN_BERSEBELAHAN`) + Butir-butir lanjut re-populate (`PelupusanService.populateMaklumatTanahVOListByAplikasiByUrusan()` PLPS branch was missing the `KEY_BUTIR_BUTIR_LANJUT` read the PT branch had). **Now Ammar's** (reassigned; he revised guard to `NumberUtils.isParsable`, commits `522951d068`/`b10432cafe`) — merged his LATEST into both envs (stag-env tip `1c82407e2c`).
- **#280176** OMLPS Simpan NPE — `PelupusanLiteService.populateVersiPermitLesen():2537` `removeIf(getTarikhTamat()==null)`. Test staging M081 only (no LPS permit with null-tarikh versi on mlit).
- **#280132** PT bertindih dup — `MlkLaporanTanahDanPelanMesyuaratForm.initPermohonanBertindih():135` reverse→forward finder. PROD-proven (/16,/18 declare /7). Test internal PTMLK/01/L/PLPS/2026/19 (mradzi, PLT) OR PROD. Staging shows /7→/6 one row = fix works.
- **#280166** PLPS Hantar PropertyNotFoundException — GATED, NOT a pelupusan code fix. #267621 (twin) was fixed by **Aaron deploying a new flowable** (verbatim from Redmine) → 280166 = flowable/BPMN or etanah-uam Java setter, cross-module, Staging-only. `caraPenghantaran` unset → gateway `sid-AAB04183` NPE. Now Ammar's.

**Redmine**: RC + Solution + BA explanations delivered for 280132/280176/280191 (plain Malay, no code ids). Handover file `212. ES #280191\2. Fix\280191 - Handover.txt`.

**🚨 INCIDENT — miya's local `mlk/stag-env` showed false "19 to push"**: upstream was `origin/mlk/master` (set when branch rebuilt-from-master, reflog `@{8}`), so every stag-env commit counted vs master. Root cause NOT my commands, but my in-repo fetches/worktrees/reset-advice churned it + I burned turns theorizing instead of reading `git status -sb`/reflog turn-1. Fixed: `git branch --set-upstream-to=origin/mlk/stag-env`. Banked [[feedback_etanah_git_separate_clone]] (write-side etanah git in a SEPARATE clone `E:/Dev/etanah-work`, never miya's repo; reading his repo to diagnose is fine) + [[feedback_worktree_cleanup_after_merge]].

**🚨 INFRA — this worktree's git backing emptied by OneDrive** (`.git/worktrees/plan-handover-sweep-1e8aab` gone, not in `git worktree list`, repair failed). DE ran in the MAIN repo. Same class as the 213-folder OneDrive-worktree problem.

**Resume**: eSOKONGAN 280191/280176/280132 on both envs awaiting miya/BA test + Redmine close; 280166 handoff (flowable/uam, Ammar). #280099 retrieved not swept. Separate-clone at `E:/Dev/etanah-work/etanah-pelupusan` reusable.

## 2026-09-18 (worktree `279615-goal-quest-rework`) — ES #279615 rework close + deploy

**Arc**: /goal on ES #279615 (UPP Pembatalan langkah 2 rework). BA Nurhafizah reopened 2026-09-18 with 2 issues from MLIT: (R1) langkah-2 error still — now `isTambahKuantiti` not `isGantiHari`; (R2) Jana id UPP → GIS-null NPE.

**Done**:
- R1 root-caused (= latent-bug L8 exactly): shared `mlkMaklumatUrusanForm.xhtml:680` reads `mbb.isTambahKuantiti` (added by CR #263304), Pembatalan bean lacked the getter. MLIT has #263304 so it trips there; staging cycle-1 build did not.
- Fix `getIsTambahKuantiti()=FALSE` at `MlkMaklumatPermohonanPembatalanForm.java:937` (mirror `getIsGantiHari():933`, comment kept per みや). Commit `4903ad8b6f` on `mlk/esokongan/279615v2` → merged `mlk/stag-env` `8fd1a59e61` → cherry-picked `mlk/int-env` `8ab05689c2`. Compile-green. Phase 1 CLOSED.
- Branch ledger: `mlk/esokongan/279615` (v1) ABANDONED -NEGATIVE (render-guard, never shipped); v2 *CANONICAL.
- int-env: full merge REJECTED (drags release 1.6.0/1.6.1 + `.docx` conflict with #280029 = data-loss); cherry-pick chosen per みや.
- R2 root-caused (etanah-common `PostgresUpdateService.gisRequestService` null, POJO never wired; `e2ee7f9adc` in master+beta) → handover drafted, NOT shipped, IGNORED per みや.

**Awaiting**: deploy int-env + stag-env, then BA re-test MLIT `PTMLK/03/L/UPP/2026/1` (asikin@melaka.gov.my).

## 2026-09-18 (continues worktree `esokongan-tracker-tickets-save-3ddcc8`) — /goal S2: VERIFY sweep on the 4 eSOKONGAN tickets (expected-behaviour-with-evidence)

**Arc**: /goal — re-sweep the 4 (280132/166/176/191) to VERIFY the fixes, pin the EXPECTED behaviour WITH EVIDENCE, re-score confidence; then /quest save + audit + improve sweep + DE. 4 opus verify2 familiars (one/ticket) each read the sweep-1 qa_doc + wave3 + audit and re-derived independently.

**Verify2 verdicts (all CONFIRM root cause; one fix revised)**:
- **#280132** CONFIRM 95% (unchanged). Analog corrected: real proof = `onCariPermohonanBertindih():209-212` (NOT TamatAplikasiServiceTask). Expected display DB-proven: PROD /7 → {/16,/18} each once; stg2 /7 → {/6}. New flag: IF/ELSE is either-or, not union.
- **#280176** CONFIRM 85→93% (+8). Closed residual: reconciler `!found` → `createNewVersiPermitLesenDataEntry` writes fresh 2026 versi; 6506 preserved (pulled before delete `:2593`); no secondary NPE. Code-only; W3's data-patch REFUTED.
- **#280191** CONFIRM 90→95% (+5). Save path traced: kemaskini `:19189` re-fetches + preserves `no_lot=223`; Tambah-Tanah INSERT `:19373` null-safe. Silent guard right, validator wrong.
- **#280166** CONFIRM root 98%, 🚨 FIX REVISED. Missing-branch REFUTED (gateway warta+default-End complete). Flat "TP" UNSAFE (kills Warta branch) → DERIVE `perluWT ? "warta" : "TP"`. Module etanah-common → likely **etanah-uam**. Still gated on #267621 diff.

**Improved the sweep**: W4 wave now requires EXPECTED-behaviour-WITH-EVIDENCE + verify-fix-produces-it (`.claude/skills/sweep/SKILL.md`, eval 13/13 green). The `--verify` pass = re-run W4-with-expected-behaviour on diagnosed tickets. Proposal logged (A5).

**Save**: 4 `QA-<n>-verify2.md` + a `## 0b. VERIFY2` addendum per qa_doc; synced worktree→main; active.txt phases bumped. Audit: 16 artifacts present in main.

**Resume**: unchanged from S1 — Apply each in its own session. #280166 now carries the REVISED fix (derived value + etanah-uam) + the #267621 gate.
## Deferred to follow-up
| Ticket | Next action | Owner |
|---|---|---|
| 280614 | send hand-off to infra + decide prevention UPDATEs | みや |
| 280099 | run Alter Flow on the page, tell Ruri result | みや |
| 280540 | build `PLP_BANGUNAN_*` guard, branch+test | Ruri/みや |
| 279411 | patch MlkSenaraiSemakPTGForm.java:839 (Ammar's fix gap) | Ammar |
