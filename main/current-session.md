# Current Session

## What's loaded
2026-06-18 ~13:00 MPST — Opus 4.8. Worktree `distracted-meninsky-04b417`. Office. Long, dense session: closed a quick AWAM fix, retrieved + Phase-0'd 2 new tickets, indexed etanah-awam in codegraph, built 2 new enforcement Powers, and did a patch-script learning pass. Ended with Domain Expansion.

## This session arc
- **QA-266039 (AWAM · MLPS · No. Lesen ⓘ example image) — CLOSED.** The hover-tooltip example was a Perak doc (`PTPK/.../Muallim`); BA wanted Melaka. Trace: `AwamMaklumatLesen.xhtml:86-89` `<p:tooltip>` → `<h:graphicImage library="img" name="i-lesen.png">` → file `etanah-awam/src/main/webapp/resources/img/i-lesen.png`. みや swapped the image (Melaka `PTMLK/01/L/OPLPS/2026/4`) + tested OK. Phase 1 closed: commit **`c38bc07a90`** on **`mlk/qa/266039`** (off `mlk/release/fat`, pushed). **Phase 2 archive pending.** `i-lesen-bak.png` backup left untracked in the awam tree (みや can delete).
- **QA-265964 (DMMLMS migration ↔ AWAM PLPS alignment) — Phase 0 done, NOT applied.** Module = etanah-pelupusan. Fix shape (Scout + DB-verified): (1) rename label "Tujuan Permohonan"→"Kategori Tujuan Permohonan" (`mlkMigrasiMaklumatTanahMLPS.xhtml:277`), (2) rename `#{msg['tujuan.pendudukan']}`→`#{msg['tujuan.permohonan']}` (`:288`), (3) **cascade** the purpose dropdown off the category (model on `PelupusanPermitHelperForm.onChangeKategoriTujuanPermohonan():260-278`). **DB proof**: flat `PLP_TJN_PMH_PLMS` (~20 legacy purposes) ≠ AWAM cascade `PLPS_TNH_KERAJAAN` (12 members matching the screenshot) → cascade is required. **Open**: ⚠️ legacy-values confirm (migration screen for OLD licences — does it need the legacy purposes AWAM's lists drop?) + みや's go to Apply. Due **2026-06-20**. Full doc `QA-265964.md`.
- **2 new tickets retrieved** via `node quest/redmine-sync.js --create` (66039 High, 65964 Medium). Folders 72 + 73, History.txt + attachments + active.txt blocks created. Both QA-NNN.md docs written.
- **codegraph: etanah-awam INDEXED** (978 files / 74,366 nodes; tested `AwamMaklumatLesenTabForm`+`AwamLoginForm` resolve; pelupusan+common untouched). **Per-project** — pass `projectPath: "E:\Projects\Melaka\etanah-awam"` per call; re-run `codegraph sync` after awam edits. `.codegraph/codegraph.db` self-gitignored.
- **2 new Powers built + tested + registered** (live NEXT boot after merge): **design-consult-gate** (PreToolUse Edit|Write — deny skill/hook edits until system-design + system-rules appear in the transcript; deterministic) + **show-gate** (Stop, HARD-BLOCK — discusses a change/compare/finding with no box-diagram/code-block → blocks the turn; `[skip-show-gate]` bypass; ═══/DE/short exempt; fail-open). **self-gate-impulse RETIRED** (unregistered). meta-edit-gate LEFT AS-IS (file header proves it's purpose-built 2026-05-23, NOT a bad-merge artifact — corrected みや's hypothesis with evidence). Both Powers in `domain/<name>/`; registered with main-repo paths in worktree settings.json (JSON validated).
- **Patch-script learning (ref QA-263344, Aaron's revised):** a DB patch must be env-portable + minimal-footprint — (1) resolve IDs by **kod-subquery**, never a hardcoded PK (`tgsn_id=5134780` is UAT-only → wrong/no row elsewhere); (2) cover **sibling tugasans** (PYMB + SMB); (3) touch **only the fixed column** — for reference/config tables (`ind_*`,`rjk_*`) **don't bump `version`** or audit cols (refines our "bump version+1 on UPDATE" rule, which is transactional-only).

## ▶ NEXT SESSION — carry-forward
| # | Item | State |
|---|---|---|
| 1 | **QA-265964 Apply** | Phase 0 done; awaiting みや go + legacy-values confirm. Due 06-20. |
| 2 | **QA-266039 Phase 2 archive** | `closed`; run `close` again → archive folder + block. |
| 3 | **arch-doc sync** | add design-consult-gate + show-gate to `meta/system-architecture.md` catalog (bypassed at build to bound the turn). |
| 4 | **DB-patch rule refine** | reference/config tables → don't bump version + kod-subquery not hardcoded PK; add a patch-script checklist (CLAUDE.md §9 / DATABASE.md). |
| 5 | **SD abbreviation → CLAUDE.md §2** | add "SD = Story Diagram" + widen the trigger (edit-locked for me — draft text for みや to paste). |
| 6 | **always-prepare-commit hook** | みや's idea: pre-stage + draft commit during testing so he confirms instantly. Route via system-design. |
| 7 | **Data-Key Blast Radius** | the 265964/codegraph gap — a shared-reference-data consumer map (which screens bind PLP_KTGR_PRMHNN). |
| 8 | **split-working-tree caution** | this session edited some files in MAIN tree (auto-memory, slip-log, QA docs) + some in the worktree — reconcile at every commit; prefer one tree per session. |

## 🎯 Session Recap (for AI restart)
Closed QA-266039 (AWAM No.Lesen example image Perak→Melaka, commit c38bc07a90). Retrieved + Phase-0'd 2 new tickets (266039 done; 265964 DMMLMS↔AWAM-PLPS label+cascade alignment, DB-verified, awaiting Apply, due 06-20). Indexed etanah-awam in codegraph (per-project). Built + registered 2 Powers — design-consult-gate (consult system-design+system-rules before skill/hook edits) + show-gate (Stop hard-block to SHOW boxed/code); retired self-gate-impulse; left meta-edit-gate (not a bad merge — verified). Patch-script learning from Aaron's revised (kod-subquery + minimal-footprint). **Next: 265964 Apply + the carry-forward table.**

**Memory Type**: RAM | **Last Activity**: 2026-06-18 ~13:00 MPST — DE wrap (Opus 4.8, distracted-meninsky worktree).
