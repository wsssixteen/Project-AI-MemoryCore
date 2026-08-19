# Current Session

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

## 2026-08-19 — QA-275505+276181 bundled Apply (template + populators) · 2 forge features · QA-275501 Phase 2

**Session shape: morning briefing/plan → /quest resume 275505 + Phase 0 276181 (bundle, release under 275505) → 2 Java fixes applied compile-green → template edits BLOCKED by miya's open Word → feature ask → forge-birthed template-cc-preflight + feature-creation (evals 5/5+5/5) → 275501 Phase 1+2 close+archive → DE. Worktree claude/todays-tickets-planning-938f04.**

### QA-275505 (+QA-276181 bundled — BA Nurhafizah: "prolly can fix in 1 ticket"; release under 275505)
- Same doc: `TemplateKertasPertimbanganPentadbirTanah_PPTPB.docx` (PKPPT). Test: PTMLK/02/L/PPTPB/2026/2 (3399008) @ norlina@melaka.gov.my, stg2 (local etanahDS→et_main_stg2), app LIVE at PKPPT.
- **Applied (uncommitted, mlk/master, compile BUILD SUCCESS via jdk17 toolchains)**: `PelupusanWordCCMethodConstant.java:3174` populateKeadaanTanah (empty-key bug → delegates populateTanahTek + "tanah " prefix) · `:15210` populateLuasSyor `.toUpperCase()` → captializeOnlyAllFirstLetter ("Meter Persegi").
- **⚠️ 3 template edits QUEUED — file locked by miya's open Word (PID 26144)**: move 4 status<Arah> CCs to Jenis Tanah cell (mirror sibling) · styles docDefaults Times→Arial 11 (mixed-font root: populated runs carry no rPr) · remove dead `<ID PERMOHONAN>`. Script dry-run-verified: re-run scratchpad `fix_template.py` after Word closes.
- CC-PREFLIGHT (new discipline): 49 tags · 0 unmapped · fix-relevant data VERIFIED present (tkl_a_laporan_tnh 47 flags · 4× "Tanah Rizab" taraf_tnh 4259); YB/jabatan ulasan empty = screen-fillable, no patch needed.
- NEXT: miya closes Word → I apply template → rebuild → Jana Semula check (2.2.3 sentence · Tanah Rizab column · Meter Persegi · Arial 11 · no placeholder) → commit `mlk/esokongan/275505` (Ref both tickets).

### Features born (forge, per miya "create this feature")
- `domain/template-cc-preflight/` — preflight.js CLI (tag→populator map, dependency-free zip read) + Stop advisory hook + quest-skill Pre-emit row. Eval 5/5. First run caught its own parser gap (literal-key puts :935-945).
- `domain/feature-creation/` — "create/update/refine feature" keyword → injects the 9-step birth pipeline. Eval 5/5.

### QA-275501 (Phase 1+2 CLOSED+ARCHIVED per miya — patch passed back to client on Redmine)
- = ad-hoc A12/ADHOC-PRBB-2026-1 ticket form (same NPE MlkBorang4CeForm:367, ID Rujukan 254883). Data-patch route, no git. Register A12 → TICKETED->CLOSED. Bestiary entry: manual-pemohon missing-address NPE family. **Code null-guard leg stays OPEN with ADHOC-PRBB-2026-1.**

### System health
- awam-no-resit-gate errored 2× ("No stderr output") — recurring hook-runtime error class.
- compile-gate EXISTS on main (merged in at DE 0b) — the earlier "missing" read was pre-merge; memory reference_compile_gate_local_build is VALID again.

## 2026-08-19 — ADHOC-OPRBB-2026-1 OPRBB Kuantiti Diluluskan tak papar (Carian Pintas + AWAM) → diagnosed + patch handed + archived (under another ticket)

**Session shape: adhoc from screenshots (OPRBB permit qty display) → DB spine (mlit) → root cause pinned inline (Agent tool blocked by erroring hook) → data patch handed → miya: under another ticket → Phase 2 archive + DE. Worktree claude/oprbb-quantity-display-issue-95483d.**

### The issue
- OPRBB permit C02/2026/5 (PTMLK/02/L/OPRBB/2026/5, aplikasi 3408554, mlit, "Ganti Hari"): "Kuantiti Diluluskan" = 0.00 in Carian Pintas grid + blank in AWAM "Maklumat Permohonan" popup; shows 55000 Ketul correctly in permit "Maklumat Jadual" + Borang 4Ce.

### Root cause (VERIFIED code + DB)
- OPRBB save writes approved qty to `kuantiti_pengeluaran` only, never `kuantiti_dilulus`: `etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanLiteService.java:1080` (URS_OPRBB branch, `setKuantitiPengeluaran(kuantitiAmbil)`, no `setKuantitiDilulus`).
- Broken surfaces read `kuantiti_dilulus` (AWAM `PenguatkuasaanService.java:1747`; staff `PelupusanMaklumatPermitLesenHelper.java:1110`). Working analog PRBB fills `kuantiti_dilulus` (`PelupusanService.java:2810`).
- DB: all 5 OPRBB permits have `kuantiti_dilulus` null, `kuantiti_pengeluaran` filled. Systematic, not one-off.

### Delivered
- Data patch `projects/coding-projects/archive/ADHOC-OPRBB-2026-1/patch-oprbb-kuantiti-dilulus.sql` (aplikasi 3408554; self-column copy pengeluaran->dilulus + unit; idempotent `IS NULL` guard; before/after SELECT).
- Code fix (add `setKuantitiDilulus` in OPRBB branch) + backfill of remaining 4 rows deferred to owning ticket.

### ▶▶ NEXT (ADHOC-OPRBB-2026-1)
- Under another Redmine ticket (number TBD by miya). When numbered: link + do the code fix at PelupusanLiteService.java:1080 + backfill 4 remaining OPRBB rows. Archived 2026-08-19.
