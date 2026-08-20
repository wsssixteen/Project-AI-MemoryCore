# Current Session

## 2026-08-20 (night) — Upload-flow research (Pelupusan+Awam→DMS) + built `de-knowledge-gate` + banked FLOW-TRACES

**Session shape**: miya asked for extensive verified research on the file-upload flow across pelupusan + awam (UI→DMS, path creation, common hops) → delivered story diagram + separate file:line tables (audited) → 2 more asks: a friend-facing `.md` handover + an HTML **Artifact** logic diagram (published `https://claude.ai/code/artifact/3ebdbe52-a09b-417b-9dd7-59da0b351c6f`). No etanah repo code changed (read-only trace). Worktree `oprbb-quantity-display-issue-95483d`, on `main`.

**The research (banked → FLOW-TRACES.md)**: upload = two-click two-phase. CLICK1 pick file → `uploadTempDocument(byte[])` → temp doc in separate `etanah-dms` app (HTTP-invoker remoting), only `tempDocumentId` in RAM. CLICK2 Save → slot row (`AppDokumenKemasukan` PLP / `PraSemakan` AWAM portal) + permanent DMS doc + `Document` pointer row (`medan/medanPk`). Module diff: PLP finalizes `create(fileBytes)`; AWAM finalizes `saveTempDocument(tempDocumentId)`. Listener: PLP shared `BaseFileUploadVO:110` (common); AWAM per-form. Physical path lives in `etanah-dms` (out of workspace). Full file:line map in FLOW-TRACES.md §File upload → DMS.

**System work (the main deliverable)**: miya flagged a real design hole — DE Step 7 (etanah-knowledge sweep) was model-judgment, silently skippable → session knowledge lost → next session re-derives = wasted usage. Built **`domain/de-knowledge-gate/`** (hook-only Feature, via forge): Stop hook fires on DE-close banner, BLOCKS when knowledge-worthy signals present (≥3 file:line · research .md/.html deliverable · DB MCP query · trace intent) but no `## Knowledge candidates` list/sentinel emitted. Non-auto-write (miya approves each bake). Eval 11/11 (10 verdict + 1 real-process effect exit-2). Registered in settings.json Stop; NUKE-MARKER + README present; expansion-protocol Step 7 pointer added.

**Resume point**: de-knowledge-gate is live — retire 2026-09-19 if fired ≥1× + no rollback. If it misfires, NUKE-MARKER has the rollback recipe. Bounty pending: QA-275501 (parked, unrelated).

## 2026-08-20 (eve) — #276504 int-deploy + #276074/#276349 AWAM fixes → int-env (BA test) + code-check audit/de-bloat

**Recap**: 3 AWAM things to `mlk/int-env` for BA testing (all uncommitted-to-master; Redmine planned-release owed):
- **#276504** (Alex's PraHakmilik-bandar fix, HASIL receipt NPE) — cherry-picked to int-env (was release/1.7.0-based; merge would drag 15 tickets).
- **#276074** — `AwamCommonService.saveDokumenDisertakan` PRADLL numbering count→max-based (elak duplicate kod → SPOC kaunter "Duplicate key PRADLL3"). Branch `mlk/esokongan/276074` @`2060baad8a`.
- **#276349** (= ADHOC-PPJK-2026-1, A18) — PPJK Senarai Warta 3-part: `PelupusanService.findMaklumatPerizabanVOByNoWartaAndTarikhWarta:10232` return **List** (was last-only) · form `addAll` + `onGoNext` honors `selectedMaklumatWartaVOList` + empty-guard ralat "Sila pilih Senarai Warta yang terlibat untuk meneruskan permohonan" · xhtml `nextProcessBtn:178` `update="@this"` → +growl (else message never renders). Branch `mlk/esokongan/276349` @`9c5afea5c5`.
- BA test data (mlit): #276349 warta `NO. 86`/`27/02/2025` (3 lots 15193-95, verified) · #276074 No Resit Carian Rasmi `260820BSAT00019` (MCL entry) · login SAMSIAH BINTI JAAMAT.

**System work this session**:
- Banked `feedback_awam_test_scenario_entry_key.md` — AWAM test-scenario ENTRY KEY is per-urusan (carian-rasmi MCL/PSBS/PLTP/PPTPB/PRBB → No Resit; PPJK → No Warta+Tarikh; Pelupusan → Permohonan ID+login).
- **code-check audit + de-bloat**: added `msg-render` row → miya flagged bloat → REVERTED, FOLDED into `sibling-diff` guidance (growl-in-`update`). `audit.js` 5/5 · fixture 14/14 · mutation 5/5 · variation battery 10/10. LOG-PROVEN: `msg-render` caused **9/31** pre-code-check blocks in one session (self-inflicted).
- Slip logged (convention): commit messages ignored team format (`AWAM` caps + over-segmented; convention = `Ref #<n> - <Urusan|Awam> - <action>`).

**Improvable gate frictions (7.5 proposals logged)**: compile-gate marker main-repo-vs-worktree path · compile-gate `"commit"` substring false-positive on echo · branch-at-Apply gate mis-scoped to unrelated QA-274740.

## 2026-08-20 (late) — Flowable knowledge lookup: which Java class sends permohonan id to next tugasan

**Session shape: single knowledge Q ("what Java class makes Flowable send the permohonan id to the next tugasan?") → answered from banked FLOWABLE-KNOWLEDGE.md §4/§5 → miya asked for a handover → wrote one to scratchpad. No quest moved, no repo code changed. Worktree `flowable-permohonan-id-tugasan-0b7480`.**

- **Answer (banked, not re-derived)**: permohonan id rides the Flowable process var `aliranKerjaId` (→ `umm_aliran_kerja.aplikasi_id`), NOT a raw value. Chain: `CommonBPMServiceClient.startProcess():105` sets var at `:208` → BPMN `<userTask>` `create`-listener fires `FlowableTaskListener.receiveUserTask():62` (`etanah-common\src\main\java\my\com\marcus\etanah\common\flowable\FlowableTaskListener.java`) → `BpmCallbackService.handleAssignationSynchronized():201` (`etanah-common\...\service\BpmCallbackService.java`) → `AppTugasanService.createAppTugasan():806` writes the next `umm_a_tgsn` row linked back via `aliranKerjaId`. Class miya asked for = **`FlowableTaskListener`**; class that materializes the next tugasan = **`BpmCallbackService`**.
- **Source**: `projects\coding-projects\active\etanah-knowledge\melaka\FLOWABLE-KNOWLEDGE.md` §4 (lifecycle L85-116) + §5 (variables L121-134), verified stg1 process 6912622 (PT). Line numbers are the knowledge doc's; etanah Java source lives at `E:\Projects\Melaka` (absent from this worktree).
- Handover written to scratchpad (temp, not repo): `HANDOVER-flowable-permohonan-id-to-next-tugasan.md`.
- Bounty pending (unrelated, from boot): QA-275501 — park until next natural stop.
