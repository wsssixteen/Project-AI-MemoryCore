# Current Session

## 2026-08-31 — Personal project: Monthly budget app (wsssixteen/monthly) — restart + ✓ button cadence-wipe fixes

**Arc**: NON-etanah side session. みや asked to load his personal "Monthly" budget web-app from GitHub and fix two bugs where recurring (weekly/daily) rows lost their cadence. Cloned `wsssixteen/monthly` (single-file `index.html`, no build step, GitHub Pages). Fixed → committed → pushed → Pages deploy verified live → PROJECT.md docs synced.

**Repo facts**: `github.com/wsssixteen/monthly` (renamed from `Monthly`, redirects on push). Live: https://wsssixteen.github.io/monthly/ . Data model on each commitment row: `dataset.state` = active|paid|ongoing · `dataset.cadence` = daily|weekly|N · `dataset.times` = counter (times paid this cycle). `rowInstallments()` = N (daily=days-in-month, weekly=floor(days/7), X=custom).

**Bug 1 (restart-btn / `untickAll`)**: `↺` forced EVERY non-active row back to `active` → ongoing rows lost their `ongoing` state → cadence badge hidden (only shows when ongoing) → weekly/daily "forever missing". Fix: ongoing rows now KEEP cadence, only reset `dataset.times`="0"; paid rows still restore to active.

**Bug 2 (state-btn / `onPaidBtn`)**: `✓` on an ongoing row set state="paid" → same cadence-strip; untick → "active", still not ongoing → cadence gone. Fix: `✓` on an ongoing row now fills the counter to X/X ("done this cycle") or unticks to 0; cadence/state never touched.

**Design adds (みや's asks)**: (a) `applyRowState()` grays an ongoing row once times≥N (X/X), badge stays visible, ✓→↺. (b) times-paid popover input auto-saves on blur/Enter (`onchange="popSetTimesPaid()"`), `set` button kept as fallback.

**Delivered**: `8573835` (code, 30+/7-) → pushed main → GitHub Pages rebuilt, curl-verified new markers live (`Mark this cycle fully done`, `onchange="popSetTimesPaid()"`). `75d0634` (PROJECT.md doc sync lines 62/64/70). Verified via Node simulation of the exact patched `onPaidBtn`+`applyRowState`+`untickAll` (all scenarios PASS).

**Resume point**: DONE + live. Only open thread: みや may want graying to trigger on partial counts (e.g. 2/4) instead of only full X/X — a UX preference he'll decide. No etanah quest touched this session.

## 2026-08-28 — QA-277309 JT-ulasan 7000 system-wide (reopen) + AWAM coverage + gate/skill refinements

**Arc**: BA concern "is the popup fix covered system-wide?" → reopened QA-277309 → swept every editable JT-ulasan surface across pelupusan/common/awam → 4 editable surfaces (all write `umm_a_jabatan_teknikal.ulasan`=7000) → deployed AWAM + common-pin to int-env → miya deployed + tested + passed to BA (standby for rework, NOT closed). Plus 3 system refinements.

**1. System-wide coverage (Issue 1, 7000 chars)** — 4 editable surfaces, all now `maxlength=7000`:
 · pelupusan popup `mlkUlasanJabatanTeknikalDataTable.xhtml:211` (shared composite → 4 screens auto-covered) — `6912d0023f` → int-env `633f922cb2`
 · common utiliti `UtilitiKemaskiniUlasanJPPHForm.xhtml:291` (JT grid) + `:203` (JPPH box) — released by Arkan as etanah-common `1.5.2-MLK.beta.patch4` (`21e57a0b93`)
 · AWAM portal `UlasanJabatanTeknikalForm.xhtml:229` (online JT officer) — `6abad84670` → int-env `4ec0f90526`
 · REVERTED: pembangunan `bgnMaklumatTambahanUlasanJT.xhtml` (wrong module, multi-state KDH/MLK/TRG, not PT-reachable)
 · DB: `umm_a_jabatan_teknikal.ulasan`=varchar(7000) on stg2 + mlit; `umm_p_`(255/4000) NOT used by any give-ulasan form; PROD widen owed at release.

**2. Issue 2 (save flip) — common, 2022-origin NOT recent**: `UtilitiKemaskiniUlasanJPPHForm.java:530` set the ulasan COLUMN from the OLD persisted JSON (read before `:551` writes new JSON) → column lags one save; pelupusan popup reads the column (`PelupusanHelper.java:666`) → shows stale. Fix = set column from the typed value. Blame: arifin `f971b73c6e` 2022 — long-latent, exposed only when edited on utiliti AND viewed on the pelupusan popup. Released in 1.5.2-MLK.beta.patch4.

**3. Deploy**: pelupusan pin bump `e17c497870` (etanah-common `1.3.9-MLK.beta.patch1`→`1.5.2-MLK.beta.patch4`, verified linear superset, +198 commits) → mlk/int-env. miya deployed pelupusan + awam, tested, passed to BA. One deploy interrupted (unzip overwrite prompt closed mid-extraction on 172.16.100.49) → clean idempotent re-run succeeded.

**4. System refinements**: (a) `commit-gate.js` Check 1 → passes on (green build OR local_test_confirmed), message-approval still required; arch-doc synced. (b) `deploy/SKILL.md` prompt-value blocks upgraded plain→`bash` (Run/send button). (c) `feedback_show_diagram_for_issues.md` strengthened to MANDATORY for ANY issue explanation.

**Friction (slip)**: gate-loop churn — repeated commit-gate/compile-gate/local-test blocks on trivial 1-line xhtml frustrated miya ("tiring you kept blocking yourself"); goal-hook ↔ commit-approval deadlock cycled many turns. A misrouted approval flag (wrong QA 276549 + worktree dir) needed manual repair. Root: gates tuned for .java fire identically on 1-line xhtml.

**Resume point**: QA-277309 OPEN, awaiting BA final test on int-env. Pass → Phase-1/2 close + Redmine planned-release + PROD DB widen (`ALTER umm_a_jabatan_teknikal.ulasan TYPE varchar(7000)`). Common fix already released; only PROD pin bump + DB widen remain for release.

## 2026-08-26 — #273461 sis_no_turutan deep-audit + recon-structure workflow shootout + CHECK 6 ship + Perak MCP

**Arc**: miya asked WHY Recon/Rubric missed the `sis_no_turutan` running-number table on #273461 (only the versi/registry tables were in the delete footprint) → audit → 7-agent /workflows scenario shootout → shipped the hole-patch (hook CHECK 6 + script-check rule 8 + quest Recon row + knowledge top-up) → DE → Perak MCP connections.

**1. Root cause (ledgered `recon-blast-radius`, caught-by miya)**: the 08-06 patch audit declared "reference graph complete 4/4" from a **shared-column-name sweep** (`permit_lesen_id`/`versi_permit_lesen_id`) — structurally blind to (a) convention-built key links (`sis_no_turutan` kod `01BRG_4AE2026` concat'd in Java, no shared column), (b) renamed FK columns (`ind_pemegang_permit_lesen.versi_akhir_id`). Recon's own trace cited `PelupusanService.runningNumberPessimisticLock():3169-3194` — the counter was ONE entity-resolution away; no step forced it, and no rule asked "what generates the value / what remembers the sequence?" The 08-10 `knowledge-not-banked` slip was the symptom; the method hole is the true cause (miya's hypothesis confirmed).

**2. Workflow shootout (`wf_46c7a439-626`, 7 sonnet agents, 975k tokens, 0 errors)**: replayed the reset-footprint task under 5 structures (S1 baseline · S2 entity-checklist · S3 skeptic · S4 3-lens · S5 index-first) vs the 6-table ground truth. **7/7 caught everything incl. baseline** → the binding variable is the QUESTION (my prompt carried "reclaimable" = the lifecycle question August never asked), not agent count. Sweet spot = deterministic question (hook) + lensC lifecycle familiar ONLY for PROD-destructive patches (~113k, cheapest deep catch); skeptic panels (149k to confirm a right answer) reserved for PROD deletes. NEW PROD facts from the fleet: counter=6, `A01/2026/6` issued 08-21 (live above targets → **reclaim permanently impossible**), 3 premature registry rows are `SLP_KUATKUASA` with named holders, registry writer = `PelupusanService.saveMaklumatPermitToInduk():2277-2402`, ZERO DB-level FKs among all permit tables, manual counter UPDATE races the pessimistic lock.

**3. Shipped (design-consulted, eval-proven)**: `domain/patch-script-gate` **CHECK 6** generator-state disclosure (fires on `SET no_*=NULL` / `DELETE ... no_*` in fence without `-- generator:` line; bypass `[skip-generator-check:]`; **eval 22→27 fixtures, 27/27 green**) · `script-check` SKILL **rule 8** + emit slot (v3) · quest SKILL Recon **state-footprint row** (resolve every entity on traced path via entity_table_map.json; name the completeness method + its blind spots) · `PERMIT-LESEN-RUNNING-NUMBER.md` 2026-08-26 block (synced to main copy). 20-scenario adversarial table displayed (Rule 12).

**4. Perak MCP (miya /goal item 2)**: add `et_main_perak_dev` (172.16.93.150) + `et_main_perak_denda` (192.168.19.100), Oracle :1521, password same as Melaka's — see goal completion in this session's close.

**Resume point**: CHECK 6 is advisory (matches CHECK 1-5 v1); miya may flip to block. Deferred #2 of #273461 now answerable to Anis: gap is permanent (counter=6, /4 + /6 live). Perak MCP servers usable next session (MCP loads at session start).

## 2026-08-24→25 — QA-276584 PPTPB rework + Task-folder abbreviation + 22 quests Phase-2 archived + video-prune feature

**Arc**: retrieve 276584 → PPTPB rework → deploy internal → folder-naming cleanup + JS → Phase-2 sweep (14 Closed/Verified + 8 QA FAT) → video-prune wired into Phase 2 → DE.

**1. QA-276584 (ESOKONGAN PPTPB rework, BA Nurhafizah 08-23)**: BA asked to add urusan PPTPB to the surat-keputusan visibility filter. One-word change `etanah-awam AwamDashboardVO.java:543` — `ImmutableList.of("PRBB","PLPS","PRU","PT","MCL","PLTP","PPTPB")` (hide surat until a `PL` Bayaran Pelbagai tugasan exists; verified PPTPB has PL = et_main_stg2 ind_tgsn 5135265). Commit `ba65fb8bbb` on `mlk/esokongan/276584` → cherry-picked `mlk/int-env` `c59dde3d9e`, compile-gate green. **Awaiting BA internal test** (NOT closed). qa_doc REWORK block written.

**2. Task-folder abbreviation (miya /goal)**: `quest/redmine-sync.js` — new `abbreviateType()` (ESOKONGAN→ES · INTERNAL ISSUE→II · ADHOC→AH · DATA PATCHING→DP · REQUIREMENT→RQ; brackets `(PROD)`/`(PERMANENT FIX)` moved to END of folder name) + removed `1. Simulate` from folder creation (new = `0. Brief` + `2. Fix`). Renamed ALL folders (active + Archive), removed 136 empty Simulate (5 non-empty kept). active.txt task_folder paths repointed.

**3. Phase-2 batch 1 (14 Closed+Verified)**: 137/140/141/147/148/163/165 (Closed) + 154/158/159/160/62/166/164 (Verified) → Archive. Criterion miya-chosen = Closed OR Verified (Resolved excluded — QA hasn't signed off). active.txt duplicates 276181/276504 removed, ADHOC-PPJK-2026-1 archived. active.txt → 6 genuinely-open blocks.

**4. Phase-2 batch 2 (8 QA FAT — miya /goal)**: FAT env decommissioned → BA can never close. Found each fix in `mlk/qa/<num>`, confirmed ALL in `mlk/master`: 265537·264006·264347·261986·262004·262027·262039·261517. Archived + qa_docs got `## Deferred to follow-up` + Phase-2 closure note; QA-264347 qa_doc created (had none).

**5. Video-prune feature (miya /goal)**: `quest/archive-quest.js` +`pruneVideos()`/`sweepVideos()` + **Step 1.5** (auto-prune videos from archived folder, ALL subfolders — miya nod) + `--sweep-videos` mode + hygiene line shows `videos pruned N`. One-time sweep deleted **151 videos / 1.35 GB** from Archive (0 left; 4 active preserved). Fixed pre-existing stale eval (copy all quest/*.js deps — active-cli now needs redmine-status-check) + test 9. Eval 9/9. `close-phase` SKILL step-2 doc updated.

**Blocker (verified external)**: folder `139. ESOKONGAN #274914` could NOT be renamed — OneDrive reparse/placeholder lock (attr 0x80000), 3 attempts / 2 methods all `Access denied`. Pending-User quest, not archived, no active.txt ref → nothing broken. Needs miya to release the handle.

**Spawned**: background task `task_de076cad` — fix `lib/hook-runtime.js` blockReason-vs-contextOut silent "No stderr output" + deploy-merge-surface stale-worktree compile-marker path bug.

**Rough patches**: deploy-merge-surface hook crashed silently (its own bug I chipped); heredoc backslash-mangling on JS (switched to Write tool); 139 lock unresolvable.

**Resume point**: BA tests 276584 PPTPB on internal → if pass, Phase-1/2 close + planned-release list. Folder 139 rename when unlocked. task_de076cad delivers the hook fixes separately.
