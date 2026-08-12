# Current Session

## 2026-08-12 — QA-273921 PPTPB Kertas nested-table fix SHIPPED + template-quest awareness built

**Root cause (byte-verified): `tanahDimilikiTable` CC sits inside a table cell, bound to a TABLE populator → populating with owner data makes a nested table (tbl-in-tc) whose docx4j Table Properties are invalid → Word auto-repairs but e-Tanah's server renderer hangs on "Sedang Kemaskini". Passed internal because that test app had 0 owners (populator falls back to TEXT when empty).**

**Fix shipped**: new `pemilikBerdaftar` tag → TEXT numbered-list populator (`populatePemilikBerdaftar`) reading the SUBJECT hakmilik's registered owners (`findLatestPihakBerkepentinganByHakmilik` + `flagKuatkuasa`), matching BA's real design (`1) Nama / NoPengenalan / Syer Bahagian`). Template CC tag `tanahDimilikiTable`→`pemilikBerdaftar` (miya, Word UI). Commit `09a9ebc279` → merge `036eb54009` → `mlk/release/1.3.3`, pushed, deploying to staging (build .162 → deploy .203). Test: PTMLK/02/L/PPTPB/2026/6 · norlina@melaka.gov.my · stg2.

**Awareness built this session** (miya's 2 asks): (1) WORD-TEMPLATE-RENDERING.md §4 refined (nested-table-in-cell, supersedes the earlier "inline" framing) + §5 NEW "Template-ticket checking rationale — verify/patch the DATA behind the CC". (2) `word-ui-vocab-gate.js` extended to FIRE the template-ticket rationale (eval passed: fires on .docx prompt, silent otherwise). (3) memory `feedback_template_ticket_data_patch`. **The real miss miya flagged**: we fixed the CC tag but never handed him a VERIFY/PATCH SQL for the owner data → he could only test 1 owner, not the multi-owner `2)` case.

**Rough arc**: many wrong turns before the fix (branch-stale theory, "doc opens fine" from a shallow check) — the .main artifact + Word's "Table Properties" repair dialog were the decisive evidence. Long, frustrated session under time pressure.

## 2026-08-11 — QA-273621 TEST-SETUP settled + reset method CORRECTED + 3 memories banked

**みや drove the flowable-alter + document-reset setup to re-test the L1e fix. Two corrections landed:
the test-reset is deleting docs via a maintenance tool (NOT the flow auto-delete I inferred, NOT
#273956's SQL), and I cold-re-read banked flowable mechanics instead of trusting them. Both banked as
memories. No code fix this session — the L1e fix is already shipped (int-env, commit `9d045f55ec`).**

### QA-273621 test-setup (env = stg2, aplikasi 3416909, PDT Jasin)

| Piece | Answer | Evidence |
|---|---|---|
| Flowable alter | Initiate & Alter → **PYB4AE** (Penyediaan 4Ae dan L1e), Reset Vars = No | FLOWABLE-KNOWLEDGE §6 |
| `pejabatKod` | insert **02** | MLPS procs 6/6 carry it (stg2 engine); also set on submit `prepareBpmValues:198` |
| `permohonanDari` | **leave blank** | 0 MLPS procs carry it (stg2 engine); only TRG/surat flows use it |
| `pembetulan` / `adaSpoc` | keep true | pembetulan routes correction loop; adaSpoc re-derived on submit |
| **Test-reset** | **delete related docs via `PelupusanMaintenanceForm.xhtml`** (per みや) | ⚠️ delete-scope not yet code-verified |

### Corrections banked (memories)
- `reference_pelupusan_doc_reset_tool` — reset = delete docs via maintenance tool; NOT status_id=NULL (that's #273956 template-letters), NOT `overridePostSubmitMethod:207-211` auto-delete (my over-assertion).
- `feedback_ticket_type_vocab_tracking` — tag each ticket a TYPE + track per-individual wording; stay provisional (みや: "you're new").
- `feedback_banked_knowledge_change_check` — trust banked etanah-knowledge at 100%; re-read source only after a cheap `git log` change-check.
- 2 slips logged (assume-not-verify, banked-knowledge-not-trusted; both caught-by みや).

### ▶▶ NEXT SESSION — QA-273621
Fix is shipped to int-env (`9d045f55ec`). Test path: alter to PYB4AE (vars above) → delete docs via `PelupusanMaintenanceForm.xhtml` → re-open L1e screen, pelan should embed. Confirm the maintenance-tool delete scope (read its bean) to firm the provisional memory → verified. qa_doc §0-NEW carries the detail.

---

## 2026-08-10 (eve) — BASELINE PELUPUSAN 1.3.2 PREPARED + #273461 SURGICALLY REMOVED + MERGED TO mlk/master

**Assembled the 1.3.2 release (10 tickets → then #273461 pulled at BA's call → 9), pushed, and
fast-forwarded `mlk/master`. The #273461 removal was surgical (revert its two merges) not a rebuild,
to preserve the already-tested branch. Also purged a `ruri/` git-tag name from the release tooling.**

### Baseline 1.3.2 — final state

| | |
|---|---|
| Release branch | `mlk/release/1.3.2` tip `76934aefd3` |
| `mlk/master` | fast-forwarded `9ddeb07406 → 76934aefd3` + pushed (verified: `origin/mlk/master` == tip) |
| Final contents (9) | 272613, 273938, 273455v2, 273460, 273294, 273291, 273621, 272696, 274455 |
| #273461 (OPLPS running-number) | **REMOVED** — reverted merges `3b745e987f` (v3) + `51115b644a` (v2); its 3 files back to non-273461 state, #273455/#273294 intact (verified in throwaway worktree) |
| SQL | `patch-273461.sql` pulled from the Sheet with #273461; do NOT run in prod (ran on stg2 only) |
| Undo point | tag `mlk/pre-master-merge/1.3.2` @ `9ddeb07406` (local) |

### Mechanics worth not re-deriving

- **Adding a ticket to an already-pushed release**: the script has no re-open command → append the ticket to `state/release-<ver>.json` + set `phase=branched`, re-run `merge`/`verify`/`push`. The new merge descends from the pushed tip so the push stays a fast-forward (did this for #274455).
- **Removing one ticket from a tested/deployed release**: revert its merge commit(s) in a throwaway `git worktree` (never touch みや's active checkout), verify only that ticket's files reverted + siblings survive, then FF-push. Preferred over rebuild because it keeps every other ticket's merge byte-identical (testing continuity).
- **`release-prep.js` merge is `--no-ff` per ticket** — that "messy" per-ticket-lane graph on master is the intended shape (matches 1.3.0/1.3.1) AND is what made the #273461 revert clean.
- **`ruri/` in a git ref is banned** (みや: "feels not safe") — release tooling tag renamed `ruri/pre-master-merge-<ver>` → `mlk/pre-master-merge/<ver>` (`release-prep.js:426`, `SKILL.md:267`).

### ▶▶ NEXT SESSION — nothing pending on the baseline

Release 1.3.2 is complete on `mlk/master`. Optional: close/archive the release. The active quests
(QA-273460 PLPS phase-0, QA-273621 MLPS Recon-reopen) were NOT touched this session — resume via the
274510 block's table below for the other open work.

### Session recap 2026-08-13 (post-274318 defenders)
Hardened auto-skill Step 4.5 -> a defender is NOT done until an eval RUNS on the exact miss + output pasted (banned: verbal "exercised ok"). Built cross-module-intake scanner (domain/cross-module-intake/scan.js + eval.js), real-ticket-tested on 64 Melaka Pelupusan tickets: false positives 25->0 (stripped Common-Version session footer, dropped generic "need help" + bare directionals), 8 true-positive flags incl #274318. Committed 3cdc7eb + 68ec3b9. NEXT: wire scan.js into ticket-gate.js for auto-fire at intake.
