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

## 2026-08-19 — PPJK warta display adhoc (A18) + adhoc-lifecycle feature build + system-design Rule 11

**Session shape: miya screen-report (PPJK e-Mohon warta papar 1 rekod) → code+DB trace → adhoc A18/ADHOC-PPJK-2026-1 → long planning arc on adhoc reconciliation → built domain/adhoc-lifecycle (the archiver) → system-design Rule 11 (state-awareness) → DE. Worktree claude/warta-85-display-issue-14b1ef.**

### ADHOC-PPJK-2026-1 (A18) — PPJK e-Mohon Senarai Warta papar 1 rekod
- Symptom: No.Warta NO.85/29-03-2007 → e-Mohon papar 1 (Lot 7324), Carian Pintas papar 2 (Lot 7263+7324).
- Root (code+DB, 100%): `et_main.ind_rizab` 2 rows (1553/7263 PA25659, 1554/7324 PA25661, both SR_KTKUASA Y). Repository `AwamRizabRepository.java:18` returns List; **BUG** `PelupusanService.findMaklumatPerizabanVOByNoWartaAndTarikhWarta():10232-10285` for-loop reassigns `vo` each iteration, `return vo` = last only. Form `AwamSemakanKewujudanRizabForm.onSearchWarta():60-76` adds single VO.
- Downstream: `onGoNext():89-96` saves only `maklumatWartaVOList.get(0)` → **BA-Q owed**: 1 vs multi lot per permohonan (decides fix scope). Baseline mlk/master d9441886b8. qa_doc: ADHOC-ppjk-warta-single-record/.
- Owed: BA raises ticket → append # to A18; answer BA-Q; then code fix (return List) + build/repro.

### Built: domain/adhoc-lifecycle/ (the adhoc-register ACT side / the parked archiver)
- CLI match/promote/archive/unarchive/sweep + Door B weekly SessionStart surfacer (boot not DE — Rule 8). 14/14 eval green; live-smoke matched A18 by warta on real register.
- Match keys: permohonan/aplikasi (exact) → warta+tarikh pair → lesen/resit/hakmilik/kp. Never deletes; all moves reversible via unarchive. Ships log.jsonl (Rule 5) + NUKE-MARKER (Rule 9) + STATE-SCOPE:yes (Rule 11).
- Standard header `## Issue Summary` + `## Match Keys` added to register doc + retrofit into PPJK doc (the join column Door A reads).

### system-design Rule 11 (state/tenant-awareness)
- Any Feature touching a per-state artifact must parameterize the state + emit a README STATE-SCOPE line. Trigger: `adhoc-register.check.hook.js:26` hardcodes the melaka register path. SKILL.md v2.5.

### Housekeeping audit (banked to slips.jsonl)
- active/ has 104 dirs (≥6 closed, never archived) · 158 worktrees unpruned · main/ dupes (current-session ×3, todo ×3). Root: no atomic archiver → adhoc-lifecycle now supplies it.
- 3 slips: housekeeping/memorycore-drift · communication/unglossed-internal-reference (miya banned bare "A18") · feature proposal.
