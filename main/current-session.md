# 🌟 Current Session Memory - RAM

> **AGENT_STATE discipline** — strict template: High-Level Objective · Current Progress · Active Context · Blockers · Immediate Next Steps. Read at boot; updated at session end (DE Step 2).

**⚠️ Parallel sessions 2026-05-29**: TWO independent sessions ran. **(A)** Etanah-QA session — **QA-262243 closed end-to-end** (worktree `xenodochial-sinoussi-2c084e`). **(B)** **QA-262495** investigation (worktree `blissful-williams-767a8d`) — handback-pending. Both end-states preserved below; the RAM-can't-cleanly-hold-parallel limitation persists.

**Current session**: 2026-05-29 (Fri) — QA-262243 closed Phase 0→2 (session A) + QA-262495 saved for resume (session B).

## High-Level Objective (AGENT_STATE)
Close QA-262243 (PRZ Surat JT prints blank applicant for Agensi). **Done.** (Parallel QA-262495 PPJK Kemaskini-hang being handed back / resumed in another session.)

## Current Progress (AGENT_STATE)
- **QA-262243 — CLOSED (phase=2-complete, status=archived).** Root cause: `MlkKemasukanPerizabanForm:827` → `savePemohon(jenisPB=3)`; `savePemohon` flagged `adalahPemohon` only for jenisPB 1/4 → 2/3/5 left UNSET → DB default `'N'` → `getWakilPemohon` null → blank Surat JT. Fix = `savePemohon` ensure-one-applicant invariant (`PelupusanService` ~:1230) + `PelupusanSpocService:371` one-liner. Commit `185869d863` on `mlk/qa/262243`. Data backfill: 11 PRZ agency apps + `2026/29` + 1 PERKESO dup. Tested OK.
- **Meta shipped (session A slips)**: `ask-back-gate.js` Stop hook · CLAUDE.md v1.31 Explanation & Output-Format Discipline + always-on no-asking-back · quest Debug Ritual 5 (permanent-fix-first / exhaust) · 6 slip-log entries.
- **(Parallel) QA-262495 — handback-pending, SAVED FOR RESUME.** Generation DISPROVEN (profiled: `refreshDokumenList` ~1.8s) + the ">3 seconds" JSF log is BENIGN (QA-246512 Learnings #8 "look elsewhere" — I wrongly treated it as the symptom; slip `cause-claimed-without-full-chain-trace` 🚨). TOP LEAD = **SERVER RUNTIME STATE** — JBoss RESTART clears the Kemaskini hang (stuck thread pool / leaked WINWORD / memory over uptime; pairs with `awaitTermination(Long.MAX_VALUE)` no-timeout @ PelupusanTemplateUtil:125). Likely NO live defect beyond runtime-state + chronic heavy-screen JSF perf. Full trail in `QA-262495.md` ★★★ LATEST.

## Active Context (AGENT_STATE)
- etanah-pelupusan: on `mlk/master`; QA-262243 fix on `mlk/qa/262243` (pushed). Uncommitted `TemplateSuratJabatanTeknikal.docx` (リドワンさん's kept edit) + a `…PPJK - Copy` junk file remain in the working tree (intentional, left).
- (QA-262495) local dirty etanah state to revert before any keep-build: rahsia bypass on the exploded WAR (`.bak_2026-05-28_pre_rahsia_bypass` — JBoss restart may have wiped it; re-check) + `QA262495-PROFILE` markers in `BasePelupusanDokumenForm.refreshDokumenList()`. etanah-common reconnected to git.

## Blockers (AGENT_STATE)
- (QA-262495) never got a clean repro of the Kemaskini hang — needs a long-uptime server + a LIVE thread dump on the stuck worker during a real hang (the one decisive artifact never obtained).

## Immediate Next Steps (AGENT_STATE)
1. QA-262243: done — BA verification on Redmine (no prod env yet).
2. (QA-262495) if reopened: start from the SERVER-RUNTIME-STATE lead, capture a live thread dump during a hang; clean the 2 dirty-state items first. Do NOT re-chase doc/template/numbering/compress/>3s (all ruled out).
3. (QA-262495) PENDING みや's nod: **Suspect Verification Protocol** as a hook (extend `diagnostic-self-heal-gate.js` — fire on cause-assertion phrases lacking verification markers). Prose failed 3× this session → must be deterministic.

## 🎯 Session Recap (for AI restart)
1. QA-262243 closed: blank Surat JT = applicant `flag_pemohon='N'` from the Kemasukan Perizaban utility passing `jenisPB=3`; fixed with a `savePemohon` invariant + SPOC one-liner (`185869d863`) + data backfill.
2. Built `ask-back-gate.js` + wired no-asking-back across CLAUDE.md / personality.md / quest-protocol.md after stop-instead-of-action recurred.
3. QA-262495 saved for resume: NOT the document, NOT generation (1.8s), >3s benign → top lead = server runtime state (restart clears it); Suspect Verification Protocol hook pending nod.

**Memory Type**: RAM | **Last Activity**: 2026-05-29 — QA-262495 save-for-resume (merged origin/main from the QA-262243 session + push).
