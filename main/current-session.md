# 🌟 Current Session Memory - RAM

**Current session**: 2026-06-10 (Wed) — wrap ~11:10 MPST. Theme: **QA-262495 resolved — the "recursion fix" was a MISDIAGNOSIS; real bug = inline content-control corrupting the generated Risalat MMKN doc; shipped a one-cell template fix; force-pushed clean branch**.

## High-Level Objective (AGENT_STATE)
- Finish QA-262495 (PPJK Risalat MMKN "Kemas kini hang"): find the true root cause, ship the minimal correct fix, leave the branch as a clean `mlk/master → mlk/qa/262495v2`.

## Current Progress (AGENT_STATE)
- **QA-262495 — SHIPPED `ebcfabaf92`** on `mlk/qa/262495v2` (force-with-lease, replaced the old recursion commit `53ad424018`). status=closed, local_test_confirmed=true.
  - **Real root cause**: in `TemplateRisalatMMKN_PDT_PPJK.docx` the `syaratKelulusan` content control was **inline** (a run-level control inside a `<w:p>` in a table cell). The populator injects a **table** into it. A table inside a paragraph is **invalid WordprocessingML** → Word declares the generated doc "corrupted" (even Open-and-Repair fails) → `PocWordEditor.exe` crashes at `NetOffice.WordApi.Documents.Add` → the "Kemas kini loading forever" symptom. Only manifests at **Perakuan** because that's the stage where syarat actually populates.
  - **The fix (one cell, one file)**: make the `syaratKelulusan` control **block-level** (own line) + add a **trailing empty paragraph** in the cell (a cell must end with a paragraph, not a table). Verified end-to-end: fixed template opens; simulated generated doc with the real injected table opens; Word save round-trip preserves block-level (self-heal does NOT undo it). Only that one cell changed — 34 other docx parts byte-identical.
  - **The "recursion fix" (cycle-1, `53ad424018`) was REVERTED** — it was a misdiagnosis (see Slip below). `PelupusanWordEditorUtil.findTableByContentControlTag:639` imports only the bare `Tbl`, never the wrapper tag → a same-named table tag in a referenced .docx **cannot** cause re-trigger recursion. Doc generated in finite time (25ms) = no loop ever existed.
  - **Blast-radius checked**: of the 5 PPJK Risalat/Ringkasan templates, ONLY `TemplateRisalatMMKN_PDT_PPJK.docx` has the `syaratKelulusan` control (now block, safe). Ringkasan / Syarikat / Tolak templates have no syarat control → structurally immune.
  - **Regenerate behaviour**: `BasePelupusanDokumenForm.refreshDokumenList` → `updateDocumentListAndProcessTemplateIfNotAvailable(isFirstEntry)` serves a STORED doc if one exists (`:589-596`), else regenerates from template (`:571`). Risalat MMKN regenerates each Kemas kini (new `LAIN-*` id; `umm_a_dok_keluaran.dok_id` NULL). "Jana Semula" forces a clean regen from the fixed template.

## Blockers / Debts (AGENT_STATE)
- **QA-262495 Phase 2** (archive) not yet run — Task folder + active.txt block still in place. Run `quest/archive-quest.js QA-262495` when みや says.
- **Carry-over (from 2026-06-08, status unverified this session)**: QA-255940 etanah-common display-fix uncommitted/untested; quest-protocol.md version-bump debt; delegate-quest.js missing from architecture doc.
- Other open reworks parked at Phase 0: **QA-261986** (PSBS Syarikat Risalat MMKN), **QA-260508** (cycle-3).

## Immediate Next Steps (AGENT_STATE) — NEXT SESSION
- QA-262495 Phase 2 archive when ready.
- Decide the **structural defender** for `wrong-baseline-diagnosis` (now 5+ strikes incl. today's misdiagnosis) — surface to みや (see slip-log).
- Resume QA-261986 / QA-260508 Phase 0.

## 🎯 Session Recap (for AI restart)
2026-06-10: a long, humbling QA-262495 debugging arc. Started by trusting a ChatGPT "circular content-control recursion" diagnosis (and my own earlier acceptance of it) — shipped a "recursion fix" that did nothing real. The actual bug surfaced only after methodical evidence work: reproduced the corrupt generated doc via Word COM (`Documents.Add`/`Open(OpenAndRepair)`), read the Windows Event Log (PocWordEditor.exe Application-Error 1000 + .NET 1026 COMException), and validated the OOXML in python until the defect was pinned — a **table injected into an inline content control** (plus a cell that must end with a paragraph). One-cell template fix; verified by simulation + Word round-trip; reverted the bogus recursion commit; force-with-lease push to a clean `mlk/master → mlk/qa/262495v2`. **Lesson: a diagnosis handed to you (ChatGPT, prior session, even みや) is ONE hypothesis — verify it against the actual mechanism (a cheap code read) BEFORE shipping. The recursion was structurally impossible and one read of `findTableByContentControlTag` would have shown it.** Good habit that finally cracked it: test every hypothesis (NoSpacing→Normal, block-only, block+trailing-p) instead of assuming.

**Memory Type**: RAM | **Last Activity**: 2026-06-10 ~11:10 MPST — QA-262495 shipped (`ebcfabaf92`, template fix only, recursion commit reverted + force-pushed); DE run.
