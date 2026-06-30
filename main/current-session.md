# Current Session

## What's loaded
2026-06-30 — Opus 4.7, worktree `claude/exciting-fermi-530ce0`. **QA-267976 Phase 0 + hook v1.1 refinement.** Brought ESOKONGAN #267976 (PT Surat JPPH header/footer multi-page issue) live from retrieval to fully-verified Phase 0 with all 5 BA issues' root causes pinpointed; mid-quest みや caught a scope-contraction slip + mandated a new rule → refined `quest-objective-anchor.js` v1.1 (BA-verbatim Issue+Expected extraction from History.txt + Rule 4 "no scope-contraction without verbatim-counter-quote"). **NO CODE APPLIED** for QA-267976 — みや holding implementation for a later session.

## ▶▶ NEXT SESSION — START HERE

### QA-267976 (FRESHLY LIVE — read this first if resuming THIS ticket)
**Phase 0 complete, awaiting みや's scope nod for Apply.** Full doc + cold-resume Resume Point: [QA-267976.md](../projects/coding-projects/active/QA-267976/QA-267976.md).

**5 BA issues, all root-caused, no deferrals:**
1. Header+footer pg2+ (template — no `<w:titlePg/>`)
2. ID Permohonan missing pg2+ (template — no CC for it; `idPermohonan` populator exists `:892`)
3. Page-num missing pg2+ (template — no PAGE field SDT)
4. `<Maklumat Pengguna>` literal showing (CONFIG — `SN_JPPH.STATUS_PENYEDIAAN_SEDIA` excludes the tag in `template.config.json`)
5. Jana Semula → duplicate (CODE — `PelupusanHelper.onJana():396-403` OR-chain missing JPPH tugasan whitelist entry)

**3 files to edit on Apply** (all paths absolute, all named in QA-267976.md):
- `E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateSuratNilaianJPPHPT.docx` (Python zipfile rewrite — restructure sectPr + add header2/footer2 parts)
- `E:\Projects\Melaka\etanah-pelupusan\src\main\resources\config\MLK\template.config.json` (remove `"maklumatPengguna"` from SN_JPPH SEDIA excluded list)
- `E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\helper\PelupusanHelper.java` (add `|| PelupusanTugasanConstant.TGSN_SRT_NILAIAN_JPPH_LIST.contains(kodTugasan)` to onJana OR-chain)

**Pre-Apply checks MANDATED** (from QA-267976.md Code-Review section): codegraph_callers on `PelupusanHelper.onJana()` + grep JPPH JenisDokumen handlers + read `onJanaUpdate():532+` for scope comparison — BEFORE the Java edit.

**Test data**: PROD = `PTMLK/02/L/PT/2026/1`, Staging = `PTMLK/03/L/PT/2026/9`, tugasan `PYSNJPPH`, login TBD. Branch plan at Commit: `mlk/esokongan/267976` off `mlk/master` (CURRENT repo branch is `mlk/requirement/239386` for みや's MPT work — DO NOT branch from there).

### #239386 MPT (UNCHANGED FROM YESTERDAY — still みや's primary focus)
21/21 cells rendering locally. 12 files uncommitted on `mlk/release/1.0.0`. Next phase = **disable-verification sweep** (walk each MPT cell, add `rendered="#{!mb.mpt}"` / `disabled="#{mb.mpt}"` to any Tambah/Hapus/Simpan/Hantar/Muatnaik that should be locked). Test apps in `1. Tasks\Melaka\79. …\1. 239 386.txt`. No code change this session — みや's local env still set up for this ticket.

### Systems built/refined this session
- **`quest-objective-anchor.js` v1.1** (`.claude/hooks/`) — pulls BA's verbatim Issue+Expected from `<task_folder>/0. Brief/History.txt`'s latest cycle and surfaces them every quest-active turn under the active.txt paraphrase. Adds Rule 4: any scope-contraction of a BA-listed numbered issue MUST verbatim-quote it + ask みや for explicit nod (even if みや himself proposes the contraction). Audit log → `domain/quest-objective-anchor/log.jsonl`. Routed through system-design + system-rules per discipline. Eval = dry-fire showed both active quests' verbatim 5 issues+5 expected surfaced correctly.
- **2 slips logged** (for next slip-log save): (a) scope-contraction without verbatim-counter-quote on QA-267976 → defender = hook v1.1 + Rule 4 shipped same turn; (b) premature ▶ YOUR MOVE while own confidence column showed pending — cure was to complete the verifications first, then re-emit.

## 🎯 Session Recap (for AI restart)
**QA-267976 Phase 0 fully verified** (5 issues, 3 layers — template + config + code — all fix points pinpointed, no asterisks). Mid-quest caught a scope-contraction slip → hook v1.1 + Rule 4 shipped as the structural defender. **Zero code applied** — みや holding implementation for later. #239386 untouched this session. Today's pattern: each time みや caught a slip, the fix was deterministic — quote-back rule, then pre-emit-self-check.

**Memory Type**: RAM | **Last Activity**: 2026-06-30 — QA-267976 Phase 0 (no Apply) + hook v1.1 (BA-verbatim extraction + Rule 4).
