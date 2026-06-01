# Quest Workflow Test — Audit Summary (2026-06-01)

> **Purpose**: comparable record of Batch-1 (baseline) + Batch-2 (refined) + Deep re-Recon runs, structured so that **second-time manual runs of these same quests can be diffed against this baseline** to measure refinement effectiveness over time.
>
> **Usage**: when QA-260508 / QA-247707 / QA-263344 are re-run manually after refinement R1-R6 land in the standard `/quest start` skill path (not just in workflow scripts), produce comparable findings + diff against the per-ticket sections below.

---

## Run inventory

| Run | Scope | Mode | Tokens | Duration | Harness verdict |
|---|---|---|---|---|---|
| Batch-1 | QA-260508 alone | Workflow, 5 sequential stages, NO refinements | 565,470 | 24m 32s | **PARTIAL** |
| Batch-2 | QA-247707 + QA-263344 parallel | Workflow, 5×2 pipeline, R1-R6 applied | 1,041,322 | 23m 45s | **PASS on both** |
| Deep re-Recon | QA-260508 again, direct main-loop | Manual investigation, no workflow | (~included in session budget) | ~10 minutes | **CLOSED all 3 BA-Qs → READY-FOR-APPLY** |

**Total session 3 burn**: ~1.6M tokens across the 3 runs.

---

## Refinements applied (R1-R6) — Batch-1 → Batch-2 effect

| # | Slip Batch-1 surfaced | Refinement | Batch-2 result |
|---|---|---|---|
| R1 | Stage 3 Rubric truncated mid-table | Schema split into 6 separate REQUIRED sub-fields (blast_radius / sibling_table / read_path / write_path / candidate_fix / falsifier_logger / confidence_row) | ✓ both tickets emitted all 6 rows; QA-247707 verified at S3; QA-263344 12 tgsn_ids by ID in blast-radius; 5 candidates with CHOSEN |
| R2 | Predicate Diagram missing all stages | Required ASCII field at Recon AND Rubric, placeholder shape OK | ✓ both Recon + Rubric emitted 3-node ASCII on both tickets; non-trivial falsifier branches on QA-263344 (PLBP 2-Y-row edge case) |
| R3 | Sibling-diff verbatim line paraphrased | Schema REQUIRED literal format `<file:line> ← sibling <file:line>: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓` | ✓ on JSF/code · ⚠ on JSON-config (QA-247707) and data-only (QA-263344) — rule-shape gap honestly flagged → R12 + R15 candidates surface |
| R4 | (3-urusan ticket required manual BPMN loop in Batch-1) | BPMN classification = ARRAY, one entry per urusan | ✓ array form executed cleanly; bare-form file naming `MLK_PLP_PRZ.xml` applied |
| R5 | ind_langkah symptom-lookup useless for composite-include bugs | Recon prompt branches to xhtml-grep fallback when ind_langkah empty AND symptom names panel/dialog/composite | ✓ flag captured both runs; fallback not needed for these specific tickets but mechanism live |
| R6 | (workflow harness self-audit could not re-prompt) | Stage 4 audit may re-prompt failed stage ONCE if compliance ✗ on REQUIRED field | not invoked this batch — all required fields present first-try |

---

## Deep re-Recon delta on QA-260508

**Batch-1 verdict**: 70% blocked-needs-ba-q (3 outstanding BA-Q items)
**Deep re-Recon verdict**: ~92% READY-FOR-APPLY (all 3 BA-Qs closed via direct evidence)

| BA-Q (Batch-1 said) | Deep re-Recon finding | Closure mechanism |
|---|---|---|
| Pengkelasan dropdown source REFUTED | `rjk_senarai_kumpulan.senarai_kumpulan_id=30997`, kod=`JNS_TNH_BPM`, ahli BANDAR_1/BANDAR_2/PEKAN/DESA_1/DESA_2/DESA_3 exactly matches BA brief | DB query with corrected shape — Batch-1 looked for table named JNS_TNH_BPM instead of kod IN rjk_senarai_kumpulan |
| Field scope ambiguous | BA description explicit — Section 1: ~18 tugasan × Plot dialog + Kadar Cukai panel; Section 2: Senarai Semak × Maklumat Cukai panel. All 3 panels, all 3 urusan | Read BA brief in FULL (Batch-1 read only part) |
| Null handling for missing zone source | BA brief differentiates: Pengkelasan = editable+mandatory (user fills) · Zone = read-only "tarik dari teknikal". Existing cascade at `PelupusanWordCCMethodConstant.java:19720-19741` (apl.maklumat_tambahan->'zoning' → alt.butiran_tanah->'zone' → blank) reusable | Read existing populator code — Batch-1 only grepped, didn't read the cascade body |

**Root cause of Batch-1 miss**: Recon stopped at first empty-result instead of enumerating alternative search shapes — violates the existing `no-asking-back-for-searchable-facts` rule. **Refinement R19** queued to add a Recon-emit gate forcing ≥2 alternative shapes before HYPOTHESIS → BA-Q transition.

---

## Pending refinements (R7-R19) — for Batch-3 or protocol updates

### Protocol-level (CLAUDE.md / quest-protocol.md edits)
- R7 — quest/notes.js auto-promote History.txt BA permohonan IDs on Rework resume
- R8 — fix canonical task-state SQL column drift in CLAUDE.md §10
- R9 — preflight env auto-resolve when env=unknown + permohonan ID present
- R12 — JSON-config sibling-diff schema variant (urusanList/tugasanList/actions[]/template-binding)
- R15 — data-only-fix sibling-diff variant (table.column tgsn_id=X turutan=Y ← sibling: column-shape ✓ · constraint ✓ · consumer-contract ✓ · convention-match ✓)
- **R19 (NEW from deep re-Recon)** — Recon Universal Checks must enumerate ≥2 alternative search shapes before any HYPOTHESIS → BA-Q transition

### Workflow-script-level (for Batch-3 script)
- R10 — RecursiveLoopDetector arg-similarity tuning (false-positives keep firing on distinct queries)
- R11 — defer MCP server instructions to session start
- R13 — suppress out-of-scope MCP server instructions when workflow scope bans them
- R14 — Stage 0 mini DB schema cheat-sheet when layer-hint touches DB
- R16 — Recon weight reassignment-note hints higher than symptom-based layer guess
- R17 — pre-resolve BPMN file path at Stage 0 + cache it
- R18 — structural-shape match check before blast-radius scope expansion

---

## Per-ticket findings index

| QA | Staging file | Status | Confidence | Next |
|---|---|---|---|---|
| QA-260508 | `QA-260508-findings.md` + deep re-Recon in this audit | **READY-FOR-APPLY** | 92% | Phase 1 — multi-panel field add, branch by urusan.kod, ~1-2d effort |
| QA-247707 | `QA-247707-findings.md` | needs-logger-runtime-evidence | 88% | Logger probe at config-resolution + DB-confirm FAT .docx SHA |
| QA-263344 | `QA-263344-findings.md` | **READY-FOR-APPLY** | 92% | Single DB UPDATE — move flag_tetapan_asal Y from PYMB_4 to PYMB_1 |

---

## How to use this for second-time comparison

When `/quest start QA-260508` (etc.) is run manually after R1-R6 land in the standard skill path:

1. Compare manual output against this baseline's "Deep re-Recon" verdict (92% READY-FOR-APPLY, all 3 BA-Qs closed)
2. Score the manual run against the same compliance dimensions: emit shape · BA-Q exhaustion · sibling-diff verbatim · Predicate Diagram · honesty primitives
3. Note which refinements (R1-R19) the manual run honored vs missed — those are the ones that need to be promoted from workflow-script-only into the standard `/quest` skill
4. Track token cost — a manual run reaching ≥90% confidence should converge faster than the 565k workflow baseline if R1-R19 refinements are working

Track date of second-run comparison + diff observations in a new section at bottom of this file.

---

*Generated 2026-06-01 by direct main-loop work after Batch-1 + Batch-2 workflow completion + deep re-Recon on QA-260508. Run-tag: quest-workflow-test-batch1+2+deep-recon.*
