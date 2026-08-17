# Current Session

## 2026-08-17 (late) — Worktree save-out + QA-275500 Phase 1 (fix stash-recovered via isolated worktree)

**Session shape: boot "which sessions haven't I saved" → save-out of 20 side-tabs → QA-275500 re-apply/test/deploy (heavy env + trigger churn, miya frustrated) → fix merge-wiped → recovered from stash via isolated worktree → int-env → mlit test PASSED → Phase 1 close → DE. Worktree `claude/ruri-43c722`.**

### Worktree save-out (unsaved tabs → durable homes)
- Audited all 20 side-tabs by transcript tail: 6 already DE-saved, 14 unsaved. Captured findings cross-session into qa_docs/active.txt/knowledge (evidence-tagged, main-repo copies, nothing closed).
- Real saves: 275500 Apply-diff · **274740 CORRECTED** (block wrongly said "confirm+close"; `generateSurat=TIDAK` on 6 rows → `patch-274740.sql` still owed) · 274318 patch4 · 274532 v3 branch-ledger · 273461 staging-PASS · Dashboard → ADHOC-PRBB manual-pemohon origin.
- **Recovered #275319** (real PROD ticket a tab solved; its active.txt block was worktree-only → restored to main, reconciled Closed).
- **New ADHOC-PPTPB-2026-2** (register A15) — Alor Gajah `/2026/2` JT-delete prep; 🚨 `agensi_id` schema-specific (8 = Alor Gajah on stg2 but JKR-Negeri-Melaka on PROD — never carry the id across schemas).
- Knowledge banked: mlit stale-seed caveat (`TEST-PERMOHONAN-INDEX.md`) + etanah-common Eclipse `.project` recreation (`DEV-TESTING-HACKS.md`).

### QA-275500 Phase 1 (CLOSED)
- Fix = the **generator**, not the reader: `PelupusanService.generateDefaultRisalatPLTP():14128` — query swap `findByAplikasi` → `findAppPihakBerkepentinganByAplikasiAndFlagPermohon(aplikasi.getId())` (pemohon-only) + new private `buildSenaraiPemohonRisalat` (1 / 2→` DAN ` / >2→comma + ` dan `) + tajuk fragment. **+38/−15.**
- 🚨 **merge-wipe recovery**: the re-applied fix got auto-stashed when miya branch-switched on the SHARED etanah tree; reconstructed in an **isolated git worktree** off `origin/mlk/master`, committed **`mlk/esokongan/275500 @ 39415a5276`**, merged int-env **`a007f3d85f`** (net delta only `PelupusanService.java`). miya's live checkout never touched.
- Trigger traced: tajuk regenerates ONLY on **Simpan Maklumat Pajakan at SKM** (`MlkMaklumatTanahPemberimilikanForm.onSimpanPajakanWrapper():648`, xhtml:240); page-load reads the STORED tajuk (`initMaklumatRisalat():397`), does not refresh an existing one.
- **Test PASSED** (mlit int-env): `PTMLK/03/L/PLTP/2026/2` (3400242) @ asikin@, SKM Simpan Pajakan → Tajuk papar all 3 pemohon. miya-confirmed "test is successful".

### Slips this session (test-scenario churn — miya very frustrated/abusive)
- **assume-not-verify** (logged): handed a test scenario ("Jana" then "Simpan Pajakan") BEFORE tracing the load-vs-regenerate trigger → would have shown miya the OLD stored value; he found the mechanism himself.
- **env-awareness**: named "test on mlit / internal" without checking his local JBoss binds **stg2** (`etanahDS → et_main_stg2`), then internal deploy reads the mlit DB — three env-confusion rounds on the same test. Root: never verified the datasource before naming the test env.

### ▶▶ NEXT (275500)
- Phase 2: Redmine #275500 → Resolved + planned-release list (int-env only, NOT master); archive folder+block.
- Deferred (in qa_doc): Word doc uppercases `dan`→`DAN` (`populateTajukRisalat():3874`); dedup BA-Q; sibling urusan share the `get(0)` bug (offer the helper when a sibling ticket lands).

---

## 2026-08-17 (S3) — ADHOC-PPTPB-2026-3 PPTPB Hantar FlowableException: diagnosed → closed+archived; per-env BPMN audit

**Session shape: miya "check adhoc PTMLK/03/L/PPTPB/2026/1 klik hantar error" → diagnosed Flowable gateway → (miss: no scaffold/delegate → corrected) → confirmed 3 BPMN fix-copies → per-env audit (mlit/staging/prod) → BA-confirmed → close+archive → DE. Worktree claude/ptmlk-hantar-error-check-997bd8.**

### The issue (ADHOC-PPTPB-2026-3 — closed same session)
- **Symptom**: PTMLK/03/L/PPTPB/2026/1 (aplikasi 3399570) MLIT, klik Hantar at Keputusan Pentadbir Tanah → `FlowableException: No outgoing sequence flow of exclusive gateway sid-70631659 could be selected`.
- **Root (DB-proven, mlit et_flowable_mlit.act_ru_variable proc 2422582)**: gateway "Kelulusan" sid-70631659 in deployed v5 has NO default + branches `kelulusan=="true"/"false"`, but live var kelulusan="JNS_KELULUSAN_DO" → no condition true + no default → throw.
- **Fix (BPMN redeploy, team-authored not me — already staging-live v7)**: 3 edits to sid-70631659: +default→Tolak · Lulus kelulusan→keputusan=="true" · Tolak becomes the default. Sibling gateway sid-F4EDB4E8 (uses kelulusan==JNS_KELULUSAN_DO) untouched+correct.
- **Per-env (live-verified)**: MLIT engine v5 BUGGY (needs deploy) · STAGING engine v7 FIXED (deployed 2026-06-20) · PROD flowable SQL-blocked (et_read no USAGE et_flowable17) → unverifiable via DB; provided "prod" file is buggy-shaped → needs Flowable admin-UI check. PROD PYSK rows = 0 (no PPTPB app has passed the gateway yet → no indirect DB proof possible).
- **3 fix-copies confirmed identical (default + keputusan)**: Downloads\ · knowledge flowables-bpmn\ · Task 139 QA-274914\2. Fix\. All safe to send (training #271442).
- **Untraced gap (honest)**: did NOT trace the Java that sets `keputusan` on KPPT submit; inferred correct from sibling gateway sid-DBEEF8A1 (same var, works).
- **Status**: BA-confirmed solved → CLOSED + ARCHIVED (folder→Archive\, block→active-archive.txt). Knowledge banked FLOWABLE-KNOWLEDGE.md §10.1. Commits b3a34db + eaa34ad on main.

### Slip this session
- **workflow-discipline** (caught by miya): adhoc intake went straight to inline diagnosis; no Task-folder scaffold, no subagent delegation. Root: quest ticket-gate force-injects on Redmine QA numbers only, not PTMLK permohonan-IDs. Logged core/slips.js. Defender: memory feedback_adhoc_scaffold_delegate + demonstrated scaffold this session (agent-spend-gate blocked the delegate → did it inline).

### Memories written
- feedback_adhoc_scaffold_delegate · reference_petaling_flowable_deployments (`/home/ftpuser/files/flowable-diagrams` on Petaling server).

### System health (see Improvement Sweep)
- **agent-spend-gate errored again** ("No stderr output", PreToolUse Agent) — blocked the delegate-scaffold path a 3rd session running (also 2026-08-17 S-PLTP). Recurring, real cost. **commit-gate MemoryCore-skip missed a Bash MSYS path** (`/c/...` never startsWith the Windows-format memoryRoot) → false "COMMIT BLOCKED — QA-274740" on a MemoryCore bookkeeping commit; PowerShell native path worked.

### ▶▶ NEXT
- miya: deploy Downloads BPMN → MLIT v6 + Migrate stuck proc 2422582 → re-Hantar.
- miya: verify PROD gateway via Flowable admin UI (Definitions → MLK_PLP_PPTPB → latest → gateway `default=`?).
- Optional: trace where `keputusan` is set on KPPT submit (the one inferred gap).

---

## 2026-08-17 (S2) — QA-274318 deploy: common patch4 → patch6 → patch7 int-env bumps + verify-gap slip

**Session shape: miya "deploy latest fixes from 274318" → verify int-env pin → (missed: check Redmine) → miya supplied patch6 then patch7 → bump+push each → DE. Worktree `claude/deploy-fixes-274318-d51a82`.**

### What moved (QA-274318 — delegated to etanah-common team; we own only the pom pin)
- Common team shipped `1.1.24-MLK.beta.patch6` then `patch7` on `origin/mlk/beta` (both linear supersets carrying more #274318 work; patch7 merge = `refs #274318 -fix & enhance performance`).
- Pelupusan `${etanah.common.version}` bumped twice, ticket-first commits, pushed to `mlk/int-env`: patch4→**patch6** `ba2705beac`, patch6→**patch7** `4703a8862d`. Current int-env pin = **patch7** (confirmed live).
- Deploy card (mlit `mlk/int-env`) handed each time; **mlit deploy+verify still owed** → QA-274318 NOT closed (`local_test_confirmed=false`). qa_doc §11 written this session.

### Slip this session
- **verify-gap** (caught by miya, angry): on "deploy latest / check redmine" I ran only `git ls-remote`/`git log` on pelupusan, reported "no changes today", and never checked Redmine — where the common team's newer patches were announced. Git-alone missed the real change. Logged via core/slips.js. Rule: "deploy latest" = check the common release channel (Redmine + `origin/mlk/beta` pom), not just the module branch tip.

### ▶▶ NEXT
- miya runs mlit deploy card (`mlk/int-env`, patch7) + verifies utiliti Kemaskini Ulasan JT/JPPH → Jabatan Teknikal shows no JPPH agency / no blank row → then flip QA-274318 `closed`.
