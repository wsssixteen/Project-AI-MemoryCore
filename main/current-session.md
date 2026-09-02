# Current Session

## 2026-09-02 — Baseline 1.4.1 (Pelupusan) — COMPLETE: BAQA PASSED → Phase F merged: origin/mlk/master = fae671944b (undo tag mlk/pre-master-merge/1.4.1 @ e1712bc0e7, local). Release worktree removed. #256334 dropped by BA (not in 1.4.1). Staging capaian script (PPTnKanan PRBB, azlee/kamarolzaman) handed 2026-09-02 for #274094 retest — data, not code.

**What happened**: first 1.4.1 branch MISSED #274094 third fix fab13ed2 (deleted branch mlk/internal/274094v3, int-env only) — miya caught it in SourceTree. Per /goal: branch DELETED + rebuilt through NEW deterministic discovery: `domain/release-mlk-plp/discover.js` (ticket number → EVERY commit on any origin ref not in master; orphan tips become merge sources; POM-PIN / PATCH-EQUIVALENT surfaced+excluded) + `release-prep.js discover` / `set-tickets --from-discovery` / `add-ticket --sha` / **verify CONTENT-COVERAGE gate** (fails if any ticket-numbered commit on origin is absent from HEAD). Evals: `discover.eval.js` 27/27 (synthetic deleted-branch replay + real-repo fab13ed2) · eval.js 26/26 · eval-recon 19/19 · push-gate 12/12. Slip logged `baseline/completeness-miss`.

**Final**: 4 tickets (#274094 incl. fab13ed2 · #276465 · #277309 · #277868 via 265537v2) · common 1.3.13-MLK → 1.5.4-MLK (8a54240f13, domain 1.0.6→1.0.8 acked, stg2 V_DOMAIN 1.0.8 ✓) · pelupusan 1.4.0 → 1.4.1 (fae671944b) · local `mvn -t toolchains compile` BUILD SUCCESS online (1.5.4-MLK pulled from Nexus) · pushed via release-prep (phase=pushed, headSha fae671944b). V6b: build log checkout SHA must equal fae671944b. Sheet: Common 1.5.4-MLK · Module 1.4.1 · Branch mlk/release/1.4.1 · SQL `#277309, 277309.sql`. Phase F (merge-to-master --ba-approved) ONLY after BAQA passes. Worktree E:/Projects/Melaka/etanah-pelupusan-rel can be removed after Phase F. **Earlier state**: isolated worktree `E:/Projects/Melaka/etanah-pelupusan-rel` (his live checkout = mlk/internal/277697, 138 dirty paths, UNTOUCHED). `mlk/release/1.4.1` LOCAL, off origin/mlk/master e1712bc0e7. Discovery plan (7 sources): mlk/CR/256334 · mlk/internal/274094 · sha fab13ed2 · mlk/internal/276465 · mlk/esokongan/277309 · mlk/qa/265537 · mlk/qa/265537v2. Excluded visible: e17c497870 POM-PIN, 633f922cb2 PATCH-EQUIVALENT. phase=verified @ 69f5ec10b9 — 6 sources merged (274094 · fab13ed2 · 276465 [pom→HEAD 1.3.13-MLK per V2 nod] · 277309 · 265537 · 265537v2); #256334 DEFERRED via `drop-ticket --reason` because its branch (Aaron 6 commits 2026-09-02) conflicts with master #263302 on `mlkMaklumatUrusanForm.xhtml` (2 hunks: rendered=!isGantiHari vs mode … or isPDBB) — Aaron should reconcile with master, then `add-ticket --ticket 256334 --branch mlk/CR/256334` → merge → verify. New cmds this session: discover · set-tickets --from-discovery · add-ticket · drop-ticket; verify has CONTENT-COVERAGE gate. Evals 33/33 (discover) · 26/26 · 19/19 · 12/12.

**Open**: PROD V_DOMAIN must be 1.0.8-MLK before PROD (MCP read denied; ask Haikal/Arkan). Sheet SQL: `#277309, 277309.sql`. AWAM PLP list = khaihantan/shahrul.

## 2026-09-02 — ADHOC MCL PTMLK/03/L/MCL/2026/4 missing-permohonan = A9 silent-BPM-strand (PROD)

**Arc**: BA (PDTAG, via masirah@melaka.gov.my) — MCL permohonan not on dashboard. Traced on PROD (`etprdmlk`). Concluded = **A9 recurrence** (silent BPM-submit strand), not a new mechanism → appended as A9's first PROD instance in ADHOC-REGISTER. Diagnosis-only; awaiting Redmine ticket. No scaffold created (matched A9).

**Verified (live PROD primary, `pg_is_in_recovery=false`)**: apl **3401787**; 2 tugasan SKM + SPI both `Selesai`/`flag_aktif=N`; **NO active tugasan**; aplikasi frozen `Awalan` since 2026-07-03. Pengagihan semula SAMSIAH→MASIRAH 2026-08-04 (`umm_sejarah_pengagihan` 10351). masirah did SKM (16:19) then Semakan Permohonan → keputusan **Pembetulan** ("BORANG 12A TIDAK LENGKAP", ~16:33) → next step **SKM (Pembetulan)** (`flowables-bpmn\MLK_PLP_MCL.bpmn20.xml:705`) NEVER created → stranded → missing from every dashboard.

**Mechanism (VERIFIED source, etanah-common)**: on Hantar the engine submit fails silently ("Cannot find task" WARN, no throw) inside the puncaktanah remoting layer; `CommonBPMServiceClient.submitBpmOutcome():611/697` then calls `BpmCallbackService.handleCompletion():2726` → marks row SELESAI (`:2758`) + deletes dashboard (`:2805`), no next task. Env/module-independent (NOT AWAM→APPS-specific).

**Boundary / unknowns**: puncaktanah `FlowableService` (getBpmTask/submit) = dependency jar, not in `E:\Projects\Melaka` → exact swallow point + getBpmTask runtime-vs-history unread. Flowable `act_ru_*` NOT on etanah MCP → orphan ORIGIN unconfirmed (needs infra PROD `et_flowable17`, process `15492644`, task `20870474`).

**Confidence**: mechanism 90% · this-instance 75% · orphan-origin 35% · not-AWAM-specific 90%.

**Handed to BA** (Malay UI repro): MCL app at Semakan Permohonan → PT → Borang 12A tidak lengkap → Pembetulan → Hantar → app hilang, tiada tugasan Pembetulan. stg NOT conclusive (shared stale `et_flowable17`). Recovery = Initiate & Alter (infra/page side).

**Resume point**: awaiting Redmine ticket for the common-side swallow fix (A9's first PROD instance). No fix by us (etanah-common = handoff). Recovery = alter (infra). ⚠️ This worktree's git linkage is broken (`.git/worktrees/...` not a repo) — commits done from main repo instead; worktree needs repair/prune.

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
