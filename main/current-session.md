# Current Session

## 2026-08-20 (night-2) — #276504 root-cause + OUR fill-only fix on top of Alex → int-env (deploy re-run pending)

**Recap**: miya asked me to root-cause #276504 (HASIL "Error during generate receipt", Critical PERMANENT FIX). Full context loaded (Description stack trace + 9 journal entries + rework video `276504_REWORK - MLIT.mp4` + DB).

**Root cause (VERIFIED)**: PPTPB stores maklumat tanah in `umm_p_permohonan_tnh`; `umm_p_hkmlk` is a title-link row whose `bandar_dipohon_id` was never populated → HASIL `PerserahanService.populateAplikasi():6605` reads `PraHakmilik.getBandarPekanMukim().getKod()` → NPE. DB timeline: pre-08-20 PPTPB apps `bandar_dipohon_id`=NULL (v1); 08-20 apps set (v2). Regression Anis saw (maklumat hilang on re-save) = eMohon PPTPB reload reads bandar/daerah from title, seksyen/luasDipohon not from ppt — display/round-trip, data intact in `umm_p_permohonan_tnh`.

**OUR fix (better than Alex's, built ON TOP — his kept)**: new `fillPraHakmilikBandarFromHakmilik` in `etanah-awam PelupusanService.java` — fill-only (never overwrites/creates orphan; all title rows; sourced from title `getHakmilik().getBandar()`), called from `saveMaklumatLesenPLPS` (eMohon path Alex's call misses). Alex's `syncBandarPekanMukimIntoPraHakmilik` untouched. Fill-only ⇒ structurally cannot cause the disappearing-data regression. Compiled green (branch + int-env).

**Git**: base `mlk/internal/276504` off Alex commit `5351a7c31f` → our commit `7c01808ae2` → pushed. Cherry-picked our commit onto `mlk/int-env` → `e4eeafedd6` (full merge dragged master↔int-env divergence into conflict; cherry-pick clean). Deploy script → `1. Tasks\Melaka\164…\2. Fix\deploy-276504-internal.txt`. **Deploy attempt hit the transient `index-pack` clone failure (deploy skill §7) — re-run pending; NOT our change (build never compiled, 0.040s no-POM).**

**Rough session — 3 corrections banked**: (1) branch naming — INTERNAL ISSUE → `mlk/internal/<num>`, NEVER invent a suffix (`-permfix`) or abbreviation; (2) do NOT replace a colleague's fix — build on his commit; (3) commit-gate/compile-gate read the WORKTREE's stale `active.txt`/`.claude/state`, not the main-repo live one → resolved to wrong ticket (QA-274740). Improvement proposal logged.

**Resume point**: after miya re-runs the deploy on MLIT, do a fresh eMohon PPTPB save → I verify `umm_p_hkmlk.bandar_dipohon_id` non-null (I hold mlit MCP). Then Redmine planned-release list (int-env never reaches master).

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
