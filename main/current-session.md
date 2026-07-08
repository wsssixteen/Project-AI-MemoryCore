# Current Session

## What's loaded
2026-07-08 (Wed) — **Redmine retrieval + 2 new quests started + 1 rework shipped**.

**Retrieved 2 new tickets**: ESOKONGAN #269437 (OPRBB Borang 4Ce — Papar Tarikh Salah) + CR-AFTER-GO-LIVE #259112 (Semua urusan JKKL — Penambahbaikkan Perakuan Pentadbir Tanah Daerah). Read latest-cycle History.txt for 3 in-progress reworks: #268883 · #269169 · #268637.

**QA-269437 (OPRBB Borang 4Ce)** — Phase 0 → Recon → Rubric → Apply, then HELD to switch to 268637. Root cause: `MlkPenyediaanBorang4CeP1eForm.initData():109` unconditionally calls `calculateTarikhTamat()` which clobbers user-persisted `tarikhAkhirPermit` after Simpan (since `performCustomSave():260` re-runs `initData`). Fix = 3-line null-guard wrapping the `calculateTarikhTamat()` call. Discovery limitation: my initial "revert setFollowImageByteSize(true→false)" claim later disproved (no-op when null W/H). Stash preserved.

**QA-259112 (CR JKKL PDT)** — spawned to background chip `task_5206edd1`. Chip did full Apply-complete work while I focused on 268637; result surfaced in 5 uncommitted files (`PelupusanConstant.java` + `MlkPelupusanTugasanConstant.java` + `MlkKertasTemplateForm.java` + `TemplateRencanaJKKLPDT.docx` + `mlkMaklumatRisalat.xhtml`) + partial hunks in `PelupusanWordCCMethodConstant.java` at :637/:1247/:2149. Held in active.txt phase=1 status=hold current_phase=Apply-complete.

**QA-268637 cycle-3 (ESOKONGAN PLPS+PRBB Surat JT/YB pelan sizing)** — Phase 0 (recon: Aaron 07-07 09:53 "same as #269169", Nurhafizah 07-08 01:02 "JT tak resize besar sama macam YB") → Apply → 3 rounds of value tuning with みや → Phase 1 close → Phase 2 archive → bounty. **Shipped**: commit `b4c54c0a1b` on `mlk/esokongan/268637v3` (pushed) + 3 files. Isolation: CR-259112 mixed edits stashed clean before staging + popped back post-push. **Fix**: 3 pelan populators in `PelupusanWordCCMethodConstant.java` unified to `null W/H + followRatio(true) + followByteSize(true) + max 19×23` (was `false + 17×20` for JT and hardcoded `525×500` for CMCC + siasatan-tanah) + みや's alignment edits on `TemplateSuratJabatanTeknikal.docx` + `TemplateSuratYB.docx`.

## ▶▶ NEXT SESSION — START HERE

### QA-269437 (OPRBB Borang 4Ce) — held with stash, resume-ready
- `stash@{0}: On mlk/master: QA-269437 Apply-uncommitted — MlkPenyediaanBorang4CeP1eForm.java:109 tarikhAkhirPermit null-guard` (in etanah-pelupusan repo)
- **First step on resume**: `cd E:/Projects/Melaka/etanah-pelupusan && git checkout mlk/master && git stash pop stash@{0}` → local Maven build → deploy WAR to stg2 → run test scenario in `QA-269437.md` §Ship-Verify
- Test app: `PTMLK/02/L/OPRBB/2026/1` (stg2, Nurhafizah simulated)
- Notes.txt already populated with login TBD (use your own stg2 login)
- Full quest doc: `projects/coding-projects/active/QA-269437/QA-269437.md`

### QA-259112 (CR JKKL PDT) — background chip Apply-complete, awaiting your test
- Chip `task_5206edd1` shipped uncommitted work; 6 files in etanah-pelupusan working tree
- Full quest doc: `projects/coding-projects/active/QA-259112/QA-259112.md` (written by the chip)
- **First step on resume**: read the chip's `QA-259112.md` for its test scenario + Rubric decisions
- active.txt: `phase=1, status=hold, current_phase=Apply-complete, local_test_confirmed=false`

### QA-268637 cycle-3 — DONE
- Shipped `b4c54c0a1b` on `mlk/esokongan/268637v3` · Aaron to deploy
- Phase 2 archived (Task folder → `Archive\92.` · project subfolder → `archive/QA-268637/` · block → `active-archive.txt`)
- Bounty logged in `domain/quest-bounty/log.jsonl` + `## Bounty` section in `archive/QA-268637/QA-268637.md`

### Framework insights from cycle-3 (worth harvesting into etanah-knowledge)
- `PelupusanWordEditorUtil.java:260-302`: `setFollowImageByteSize(true|false)` is a **NO-OP** when both `setImageWidth(null)` and `setImageHeight(null)` — flag only matters when W/H are pre-set. Cost me multiple rounds of "flag flip = fix" hypothesis.
- `PelupusanWordEditorUtil.scaleToMaxLengthIfExceed():354-397`: `setMax*InCentimeter` is a **CEILING ONLY** — only scales DOWN. Never scales UP. If natural byte-size < cap, image stays small.
- To force "make image bigger when natural is small", must use `setImageWidth(N)` (explicit anchor) + `setFollowHeightWidthRatio(true)` for aspect. Pure caps + null W/H = passthrough on small images.

### Reworks NOT touched this session (from 07-08 assessment)
- **#268883** — Aaron 07-07 09:53: "same issue with #269169, please adjust" — needs unified "get-latest" query strategy
- **#269169** — Aaron 07-07 09:51: "possible error when using your new query... they uploaded 2 same pictures at the same time... find an alternative way to get the latest" — query needs deterministic tiebreaker
- These two are LINKED per Aaron; recommended to pair-fix in one session

### Environment
Staging **et_main_stg2**. MCP role has NO grant — use `%TEMP%\claude\stg2q\q.js`. Local JBoss on stg2. UAT DB was down earlier this week (was reconnecting late in this session).

### Bounty state
- `domain/quest-bounty/log.jsonl` has entry for QA-268637 (this session)
- No bounty pending on other closed quests

## 🎯 Session Recap (for AI restart)

**Duration**: ~4 hours (2026-07-08 09:50 → 14:05 +0800)
**Quests worked**: 2 (QA-269437 held mid-Apply, QA-268637 cycle-3 shipped)
**Chip spawned**: `task_5206edd1` for CR-259112 — background session did full Apply
**Commits landed on origin**: 1 (`b4c54c0a1b` on `mlk/esokongan/268637v3` in etanah-pelupusan) + 1 (`24cf87e` on `main` in MemoryCore — quest-bounty push)
**Session slips**: (1) Misdiagnosed cycle-2v2's `setFollowImageByteSize` flag flip as the JT regression — actually a no-op given null W/H; the real behavior driver was the caps. Took multi-round investigation with みや before framework-code re-read ended it. (2) Session-crossed working tree (my 268637 edits interleaved with CR-259112 chip's edits on same file `PelupusanWordCCMethodConstant.java`) — isolated cleanly via stash+reset+re-apply, but the ambient interleaving cost mental overhead through commit prep.

**Memory Type**: RAM | **Last Activity**: 2026-07-08 14:05 +0800 — Domain Expansion in progress.
