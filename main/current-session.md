# Current Session

## What's loaded
2026-07-03 — **#239386 MPT audit + park day.** Phase-1 audit ran end-to-end (spec vs scripts vs DB vs code): found + fixed the STALE Patch.sql (re-inserted the deleted PLTP L8 → guard-DELETE added; Section A → all-20 self-contained; BOOL_OR verify → raw values). 4 new SQL artifacts (Reset / Langkah-Evidence / MLIT-Precheck / INSERT-derivation-v2) + `screen-feature-guide.md` (skrin/langkah teaching doc) + §0 MASTER CHECKLIST in 239386.md (R1-R9 · Q1-Q3 · H1-H3). WIP **committed `d6af8adda0` + pushed** to `mlk/requirement/239386`. Quest → **HOLD** per みや: focus shifts to eSokongan + internal-issue tickets. Three new delivery rules engraved: CLAUDE.md v1.60 (unqualified SQL for みや) + v1.61 (raw-first, no AS/functions) + quest-bounty hook v1.1 (defer-first, no boot harvests).

## ▶▶ NEXT SESSION — START HERE

### Focus per みや (2026-07-03): eSokongan + internal-issue tickets
- **QA-268637** (ESOKONGAN, PRBB Surat Ulasan YB pelan shrink) — Rubric done, fix chosen (mirror 267382 sizing block into `populatePelanAsalImageCMCCMLK:19188`), **HELD pre-Apply awaiting みや's go** (parallel-session quest; check its qa_doc first)
- **QA-266503** (internal-issue, MLPS Borang4Ae) — issue1 closed; issue2 root FOUND code-level (`saveVersiPermitLesenMLKS year-match delete`, Fix C ready) — runtime confirm next; reconcile with faizudin #261626 (MIGRATOR-DUP-V0 sibling)

### #239386 (ON HOLD — resume recipe)
Full state: [239386.md](../projects/coding-projects/active/239386/239386.md) Resume Point 2026-07-03 + §0 MASTER CHECKLIST. Short: env-check→UAT · rebuild+test PRZ L3 (xlsx row 10a) · DB back → Evidence→Reset→Patch → open all urusan · Q1 PSBS + Q2 nama → Aaron.

### Environment blockers (checked 07-03)
UAT DB `172.30.59.185:5444` DOWN (app server .150 fine) · mlit MCP read-blocked (`et_reporting` zero grants on `et_main_mlit`) · FAT MCP wrong password (pgEdge todo #48) · local standalone.xml still on MLIT.

## 🎯 Session Recap (for AI restart)
Boot → corrected the boot-plague (quest-bounty hook v1.1 defer-first + once-per-session). #239386 phase-by-phase review per みや: branch verified (new master-based `mlk/requirement/239386`, fork `3901c0432f` + our `035d4419fb`), stash popped clean (16 files + L1 override). Haiku readers extracted spec (BA langkah journal) + all 3 SQL scripts; controller spot-check caught **Patch.sql line 99 re-inserting the deleted PLTP L8** — the day's key finding. Fixed both patch scripts; built Reset/Evidence/Precheck/derivation scripts through みや's teaching loop (reverse-engineering method: DB narrows candidates → jsf_view bridge → CODE decides via URS_-branch/who-mounts tests → render confirms; `BaseBpmForm.navigateToLangkah():2652` = the verified nav hop). Excel checklist amended (PSBS TBC-Aaron, stale code rows, row 10a). Ended: WIP committed `d6af8adda0` + pushed, quest held, focus → eSokongan/internal-issue.

**Memory Type**: RAM | **Last Activity**: 2026-07-03 — #239386 parked (committed+pushed); next = QA-268637 apply-decision + QA-266503 issue2 runtime confirm.
