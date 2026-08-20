# Current Session

## 2026-08-20 — "Finish all in-progress tickets": PPTPB bundle (275505+276181+276182) + PT NPE (276422) CLOSED + deployed to int-env

**Session Recap for next start**: 4 tickets closed + deployed to `mlk/int-env` (BA testing). Branches pushed: `mlk/esokongan/275505` (eae4c59d0a — 275505+276181+276182 doc: Jenis Tanah CC move + Keadaan tanah populate + Meter Persegi + Arial 11 + remove `<ID PERMOHONAN>`), `mlk/esokongan/276182` (d15563430e Tajuk-luas stage-aware code + **6db3725b0c backward-compat overload**), `mlk/internal/276422` (cdb242bf09 PT SKM NPE null-guard). int-env tip `e5d2994b73`. **NOT on mlk/master** — Redmine planned-release list still owed for all 4.

### What shipped (per ticket)
- **275505** PPTPB Kertas Pertimbangan: (Java) `PelupusanWordCCMethodConstant.populateKeadaanTanah:3175` delegate to `populateTanahTek` + prefix "tanah "; (docx) 4 `status<Arah>` CCs moved from No.Lot/PT cell → Jenis Tanah 2700-dxa cell.
- **276181** PPTPB: (Java) `populateLuasSyor:15224` unit `.toUpperCase()` → `PelupusanUtil.captializeOnlyAllFirstLetter` (→ "Meter Persegi"); (docx) styles.xml docDefaults Times→Arial + Normal sz 24→22 (Arial 11).
- **276182** PPTPB Tajuk Risalat: (docx) removed literal `<ID PERMOHONAN>` para; (Java) `MlkMaklumatTanahLesenPendudukanForm.initMaklumatRisalat` placeholder-only refresh + extracted `generateDefaultRisalatByUrusan()`; `generateDefaultRisalatPPTPB` made stage-aware (`useDipohonLuas` = tugasan==SKM → dipohon; PKPPT/PRMMKNPDT onward → siasatan/disyor).
- **276422** PT SKM Seterusnya NPE: `PelupusanMaklumatPemohonHelper.initPemohon:2192` null-guard on `KEY_TEMPAT_TINGGAL_ALAMAT` (= ADHOC-PT-2026-4).

### Load-bearing lessons this session
- **compile-gate caught a would-be mlit outage**: int-env had a 2nd caller `MlkKertasTemplateForm.java:1729` (4-arg `generateDefaultRisalatPPTPB`) that master lacks; my breaking 5-arg signature change failed the int-env build. Fix = additive **4-arg overload** (default `false`=disyor, correct for the doc-gen caller) — added to the 276182 branch too so master stays consistent. A blind push would have taken mlit down (QA-275456 class).
- **cherry-pick, not merge, for a diverged int-env** (878 ahead / 18 behind master): merge dragged in unrelated `MlkSuratTemplateForm`/`pom.xml` conflicts from the master-catch-up delta; cherry-picking our 4 commits applied only our changes clean.
- **board = Redmine first, not active.txt**: opened by listing ~14 "open" from active.txt incl. Redmine-closed 274740; miya caught it. Banked `feedback_board_from_redmine_first.md`.
- **stray hunk in a recovered stash**: `stash@{0}` (275505 Java) carried an undocumented `SRT_SN_JPPH` filter removal at `:7811` — miya caught it in the diff; reverted to HEAD.
- commit-approval flag failed to auto-write (approval fired before `local_test_confirmed` set) → recorded manually per branch.
## 2026-08-19/20 — Baseline 1.3.5 + PROD-regression incident + recovery + release-gate hardening

**Session shape: BAQA baseline ask (7 tickets, Pelupusan 1.3.5 + Common "1.2.1-MLK") → prepared+pushed → release team BLOCKED deploy (Domain 1.0.5 > DB 1.0.4) → common reverted (wrong target 1.1.24 → correct 1.1.17 per release/1.3.4) → DISCOVERED 1.3.4 never merged to master → 1.3.5 shipped to PROD missing 1.3.4's 5 fixes (live regression) → recovery merge (miya's sequence: 1.3.4 in FIRST) → pushed cde4ed3ab9 → audit loop closed every gate hole. Worktree pelupusan-baseline-deploy-1acf39.**

### Release 1.3.5 — FINAL STATE
- `origin/mlk/master` = `origin/mlk/release/1.3.5` = **`cde4ed3ab9`** — ALL 10 tickets (1.3.5's: #274318-via-common · #275009 · #275500 · #276004 · #275475 · #275456 [#274914 flowable-only, excluded] + 1.3.4's restored: #273979 · #271442 · #274745 · #274532 · #272130) + common **1.1.17-MLK** (= domain 1.0.4 = DB V_DOMAIN) + module 1.3.5.
- Local `mvn compile` BUILD SUCCESS on `cde4ed3ab9` (569 sources, JDK-17 toolchain). miya ALSO built it on the LOCAL server successfully (check-build only).
- 🚨 **PROD REDEPLOY PENDING**: prod still runs old `3aec2cab01` (missing 1.3.4's 5 fixes — live regression until redeployed). Undo tag `mlk/prod-1.3.5` @ `3aec2cab01` pushed. Next: server build `mlk/release/1.3.5` → checkout SHA must = `cde4ed3ab9` → release team redeploys → BA smoke-test one 1.3.4 fix (#274532 tarikh) + one 1.3.5 fix.
- Sheet: Common `1.1.17-MLK` · Module `1.3.5` · Branch `mlk/release/1.3.5` · SQL cell empty.

### Incident root causes (both mine)
1. **1.3.4's Phase-F merge-to-master skipped** (2026-08-17) → master stale at 1.3.3-era → 1.3.5 branched without 1.3.4.
2. **Common set from BA's chat word** (1.2.1) with zero validation → domain 1.0.5 > DB 1.0.4 → deploy blocked. Correct = 1.1.17 (what release/1.3.4 shipped; common 1.1.17 + 1.1.24 BOTH ship domain 1.0.4; #274318 = the ticket needing the bump; common 1.1.17 was released for #272295).

### Gates built + PROVEN this session (all eval-pinned, commits 67c7a03 · 7e21e91 · 016b7df)
- `runCompatGate` (bump-common): BLOCKS common whose etanah-domain > DB `V_DOMAIN` (rjk_parameter_sistem kod V_DOMAIN) or ≠ prev release's domain; `--db-domain`/`--domain-ack`.
- `assertMasterReflectsPrevRelease` (branch): BLOCKS baseline off stale master; `--stale-master-ack`.
- `unmerged-release-boot.js` (SessionStart, registered): screams until every release branch ∈ master. **First run found stranded `release/1.0.0` (15 files) + `release/1.0.7` (6 files) — TRIAGE PENDING on miya's word.**
- push-gate v2: PowerShell tool inspected + manual `mlk/master` push BANNED + fixed birth-defect regex (`git -C … push` never matched). Eval 12/12.
- `status --verify`: state-vs-origin drift (state was hand-edited 2× during incident).
- bump-common commit verb direction-aware: `increase to` (Aaron's exact) / `revert to` (miya's). Skill: 20-failure-mode audit → 7-row FAILURE-MODE CHECKLIST (terminology-verbatim · undo-tag-before-force-push · pom-diff nod · footer check · explicit build target · worktree preflight · visible BUILD SUCCESS).

### Also this session
- Agihan-Kepada BA question (PT PYMB Jasin): traced to capaian — `MlkPelupusanPegawaiAgihService.java:268-273` targets PPD; 9-join capaian query → 0 users with urusan PT at Jasin (m.azlan had PRBB/PPTPB only); miya patched capaian to test then a change landed (created_by admin 18:34) — NOT a baseline bug, NOT 275475 (pjbtPermohonan has 0 readers). ⚠️ my first two answers (config table / "no active PPD") were WRONG and retracted — flag_aktif is 'Y'/'N' not boolean.
- ADHOC-PT-2026-4 (PT SKM Seterusnya NPE, twin of #275152): folder 156, patch preserved in `2. Fix\`, active.txt block written, branch mlk/esokongan/275152 deleted per miya (separate ticket pending from BA).
- Slips logged: release/stale-master-version-drift · instruction/substituted-own-plan (3× repeats forced) · evidence/thin-proof · release/invented-terminology · reask/redundant ×2 · evidence/thin-proof; principle #7 (state-continuity verified at boundary) added to system/principles.md.

## 2026-08-19 — QA-274914 Phase 1 close (eSOKONGAN PPTPB Pembetulan → all 12 BPMN) + bpmn-check verify

**Resume QA-274914 → triple-check all 12 fix-folder BPMN via bpmn-check → PSBS out-map gap found+fixed+reverified → PRBB PROD-safety confirmed → Phase 1 close → DE. Worktree `ticket-274914-ba-alignment-b14884`.**

- **All 12 BPMN clean**: fix-vs-deployed-base delta (271020 corpus) → 0 new errors + 0 new C5/C7 from the Pembetulan edit. `domain/bpmn-check/bpmn-check.js`.
- **PSBS was the one real gap**: gate-feeding `MLK_TKL_ST` didn't out-map `pembetulanPP` (the original ticket bug class). miya added the `<flowable:out>` row in modeler; re-check → C7 cleared, 0 new. Structure was already built (gateway + dedicated `(Pembetulan)` task + KM arm) — no new gateway needed.
- **out-map is per-gate-feeding-ST, not per-ST**: PPTPB (BA-passed) carries it on 1 of 2 STs; PSBS was the sole miss.
- **PRBB PROD-safe**: CR #263302 absent (`sid-B4276481` absent; `sid-F4F9ED6F`=JKBB task CR *removes* still present = pre-CR base). miya confirmed PROD = "Fix MCOT Stopper".
- Closed QA-274914 Phase 1 (branch=none, BPMN via modeler). New memory `feedback_status_ask_ultra_concise.md`. Merged origin/main into worktree (registry union + slip-dashboard delete) before this DE commit.

## 2026-08-19 — Selangor Oracle MCP built + Selangor upload-not-reflect investigation (side-task, no Melaka quest)

**Session shape: miya "create a db connection for oracle — Selangor project" → built oracle-slt MCP (proven live) → "retrieve a working CAS login" → pulled users, no shared default password → "where do I check Selangor pelupusan code" → mapped Selangor+Terengganu checkouts → colleague upload issue (Selangor SenaraiSemakPTGForm "tak reflect, no error") → traced code, ranked suspects → DE. Worktree claude/oracle-db-etanah-selangor-5f9c75.**

### Oracle MCP `oracle-slt` — BUILT + PROVEN LIVE
- Target: Selangor Etanah Oracle **19.3.0**, host `172.16.93.32:1521`, service **SLIT**, schema **ET_MAIN_DEV**, user `et_main_dev` / `etanah123` (same convention as Melaka).
- Stack: `python-oracledb` THIN mode (no Oracle client) + `mcp<2` (FastMCP). mcp 2.0 removed `mcp.server.fastmcp` → pinned `<2`.
- Files: `C:\Users\Ridhwan\AppData\Local\oracle-mcp\server.py` (+ venv beside). Tools: `query_database`, `get_schema_info`, `list_tables`.
- Registered in `C:\Users\Ridhwan\.claude.json` mcpServers as `oracle-slt` (backup `.claude.json.bak_pre_oracle_slt_add_2026-08-18`).
- ✅ CONFIRMED live: connectivity test returned schema/db, count query `pcp_pengguna flag_aktif='Y'` = 231565; MCP tools loaded this session (mcp__oracle-slt__* appeared after resume).

### Selangor CAS login retrieval (pcp_pengguna)
- Login col = `NAMA_PENGGUNA`; active-internal filter `flag_aktif='Y' AND flag_capaian_dalaman='Y'`. `admin` account active (2026-08-18).
- ⚠️ NO shared default password — each `kata_laluan2` hash unique (top hash shared by only 2). Cannot hand a password; needs miya's known admin pw OR a reset (hash algo unconfirmed).

### Selangor + Terengganu checkouts (NEW knowledge)
- `E:\Projects\Selangor\etanah-pelupusan` — branch `master`, remote `ssh://git@172.16.93.167/etanah-pelupusan`, only pelupusan checked out (no common/awam). Trunk base = plain `master` (NOT mlk/master — branch-guard hook false-positives here).
- `E:\Projects\Terengganu\etanah-pelupusan` also present. TRG stays hard-excluded.

### Colleague upload issue — Selangor `SenaraiSemakPTGForm` "boleh upload tapi tak reflect, no error"
- Screenshot was Terengganu (`tgit.terengganu.gov.my/etanah-pelupusan/.../SenaraiSemakPTGForm.xhtml`); miya redirected → check Selangor's same form.
- VERIFIED (code): upload handler `E:\Projects\Selangor\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\web\form\common\SenaraiSemakPTGForm.java:185-213` adds downloadVo to `senaraiSuratVO.getDocumentList()` at :212 UNCONDITIONALLY (DMS `create()` :207 return only sets tempId → DMS failure would NOT cause "tak reflect").
- SUSPECTS (HYPOTHESIS, not repro'd): (1) `SenaraiSemakPTGForm.xhtml:24` `rowKey="#{item}"` + `PelupusanSuratVO` (`vo\PelupusanSuratVO.java:14`)→`BaseFileUploadVO` (Melaka common `BaseFileUploadVO.java:68`) has NO equals/hashCode = identity → row match breaks if `initSenaraiDokumen():217` re-fires on postback. (2) `immediate="true"` on auto fileUpload skips phases before `update=":suratTable"`.
- NEXT: needs LIVE repro (Selangor app + login) to pick suspect; or fast diff vs working Melaka `MlkSenaraiSemakPTGForm.xhtml`. No fix applied.
