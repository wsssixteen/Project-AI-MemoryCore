# Handoff 2026-11-05 — requirement load at Phase 0, refer / implement / detect at Phase 1

Status: **plan only, nothing built**. Waits for miya's nod (a Workflow step change: `/system-change`, own nod). Planner: claude-fable-5-1 (read-only). Origin: ADHOC-PPTPB-2026-9 (PPTPB 41.0 Endosan TSP sent the permohonan's office 02 to Pendaftaran; a PN title belongs to PTG 00).

## 1. Is the urusan requirement tree enough? NO (searched to the end, 2026-11-05)

| Source | Ticket | What it held for this case |
|---|---|---|
| Urusan master (child of 215975) + its BRS | 218317 `e-Tanah-MLK-PLP-BRS-PPTPB-V-1.0.docx` + BPMN V2.0 (2025-06-30) | nothing: no "endosan", no "TSP" (BRS predates the step) |
| Master's tugasan children | 220564 / 220566 (Jadual VIII) | screenshots only |
| Orphan integration requirement (no parent) | 275608 "Integrasi PPTPB - TSP" | lane "Unit Pendaftaran PDT/PTG" in the drawing, no sentence |
| Cross-module integration master | 229847 "Integrasi Pendaftaran Pelupusan" (parent 223990 "Integrasi - Pecah SPI Mohon dan Lulus") | urusan list, no office rule, PPTPB absent |
| **Requirement of the CALLED flow's tugasan (another module)** | **248531** (Requirement, Closed, module Pembangunan, released PROD 07/10/2026 via 283590) | **the rule in words**: "Tugasan Terlibat: SPI, SPIL, KP … endorsan nota mohon perlu didaftar kan mengikut Hakmilik Pejabat yang terlibat … daftar nota mohon juga perlu mengikut pejabat Hakmilik"; journal 2026-02-10: applies to all Pendaftaran nota (Nota Mohon, Nota Lulus, MH) |
| Sibling drawings | 234935 "Integrasi MCL - SBTM & MCLM" (Pendaftaran, child of 213183), 223225 MCL master | lanes only |
| Code | PRZ gateway `MLK_PLP_PRZ.bpmn20.xml:426-447` + `PelupusanService.isHakmilikProcessByPTG` (:20182) · common `BpmCallbackService.handleMultiplePejabat` (:2901, tugasan KPTI, kategori KP_PTG → "00") · SPOC `KutipanDokumenService:949` | the rule, coded three times |

Why it was missed: 248531 says "PD / PT", "Pejabat Daftar / Pejabat Tanah", never PTG/PDT. `--find "endosan pejabat hakmilik PTG PDT"` never ranks it; `--find "SPIL"` (the tugasan kod at the issue) ranks it #1 but labels it `none 7.6`. The index snippet is 400 chars, so only 1 of 2084 rows contains "SPIL".

## 2. Fable 5.1 plan (summary; full text in the session transcript of 2026-11-05)

Load algorithm, one new mode `node quest/requirement-index.js --load --urusan <k> --tugasan <k> --called <model> --words "…" [--cap N] [--cheap] [--tree]`:

| Step | Tier |
|---|---|
| 1 urusan master under 215975 + children matching the tugasan (Proposal 9) | T1 tree |
| 2 kods of the CALLED flow (`receiveUserTask` kods in `<called>.bpmn20.xml`, e.g. SPI/SPIL/KP) → search | T2 called-flow |
| 3 `Integrasi <urusan>` + orphans naming the urusan | T3 integration |
| 4 cross-module masters `Integrasi … <our module>` + parent chain | T4 cross-module |
| 5 synonym-expanded value words (PTG≈PD≈Pejabat Daftar≈KP_PTG≈00; PDT≈PT≈Pejabat Tanah≈daerah; endosan≈endorsan; nota mohon≈SPI; nota lulus≈SPIL) | T5 value words |
| 6 union, order T2 > T5 > T3 > T4 > T1, print `REQUIREMENT-LOAD` | block |
| 7 read cap: master BRS by `--section`, then top 3 in full | ≤4 reads |
| 8 quote each deciding sentence as `REQUIREMENT-RULES: R<n> · #<req> · "<quote>" · applies to <tugasan> · our value <x>`; `R0 none` when none | ledger |

Phase 1: Rubric candidates carry a `rules` column (R-ids satisfied/broken; "same as siblings" must cite an R-id or R0); predicate names the R-id; test scenario has one expect column per R-id; close-phase marks each R-row kept / implemented / contradicted (contradicted needs his nod).

Build items ranked: (1) `--load` · (2) `kods` field from the FULL description at `--build` · (3) code-only query never labelled `none` · (4) query synonyms · (5) `--read --section` + lane-aware BPMN PDF · (6) quest SKILL 2b + QA template ledger · (7) `quest-phase-gate` v4 (R-row per REQUIREMENT-READ) · (8) ticket-gate row 1e + quest-phase0 workflow field · (9) adhoc-save ticket-check row 5 = cheap LOAD block · (10) close-phase ledger status · (11) cross-module-check step 4 = subflow-trace in-params vs R-rows · (12) development D1 from `--load --tree`. Earlier proposals: 1+6 → item 11 · 2 → item 7 · 3 → item 9 · 4 → item 5 · 5 done · 7 → item 6 · 8 dropped · 9 → items 1 + 12.

Eval case for every item: PPTPB / SPIL, called MLK_DFT_INTEGRASI, words "endosan pejabat hakmilik PTG PDT" → the load block holds 248531 (T2+T5), 218317 (T1), 275608 (T3), 229847 + 223990 (T4).

Cost: `--load` < 2 s; ledger + reads ≈ 5-6 min and 10-25k tokens per quest; the `--section` read saves the whole-BRS cost.

## 3. Next

miya's nod on the plan (all 12, or items 1-5 first as one Tool change) → `/system-change` with the `change-card` BEFORE card.
