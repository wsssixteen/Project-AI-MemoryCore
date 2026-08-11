# Current Session

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

---

## 2026-08-07 15:26 → 2026-08-10 — 274510 PT FLOWABLE ORPHAN REPAIRED IN PROD

**A BA inquiry became a PROD workflow repair. The Flowable engine had lost a task; eTanah marked it
Selesai anyway, so no successor was created and the application had zero active tugasan. Fixed through
the system's own admin screen, not SQL. Dashboard restored to sitihanum, matching BA's Expected verbatim.**

### ▶▶ NEXT SESSION — START HERE

| Priority | Item | State | First step on resume |
|---|---|---|---|
| **1** | **274510 follow-through** | PROD fixed, quest closed | Ask if sitihanum opened AND clicked **Hantar** on `PTMLK/02/L/PT/2026/3`. That is the only runtime proof (PROD `act_ru_task` unreadable). Then BA Nurhafizah retest → Redmine close |
| **2** | Engine-orphan root cause | Unfixed, no ticket | 88/90 Aug PROD apps share the shape (~13/day). Raise as its own ticket |
| **3** | `et_flowable17` GRANT | Asked, not delivered | `GRANT USAGE ON SCHEMA et_flowable17 TO et_read;` + SELECT. Unblocks all future stall diagnosis |
| 4 | QA-274182 resume gap | `resume-readiness` ✗ | Its qa_doc lacks a Next-Steps Checklist (other session's ticket) |

### 🚨 Two gate bugs found the hard way

| Bug | Detail |
|---|---|
| Approval flag consumed too early | `commit-gate.js:140` unlinks the one-shot flag on the check-3b allow path, **before** the local-test check runs. One approval bought zero commits. |
| MemoryCore skip misses from a worktree | `commit-gate.js:112` compares the target repo against `projectRoot`, which resolves to the *worktree*, so a DE save targeting main falls through to the approval check. |

⚠️ **Main repo was hard-reset to origin/main mid-session** (`reflog HEAD@{0}: reset: moving to origin/main`),
discarding 26 staged files + untracked components. No committed work was lost — `2c910b5`, `5a97080`,
`88b925f` are all ancestors of origin/main. Everything of mine was rebuilt from the transcript.

### 274510 — what shipped

| | |
|---|---|
| Application | `PTMLK/02/L/PT/2026/3` · aplikasi 3398208 · PDT Jasin |
| Root cause | Engine lost task `18762781`; `BpmCallbackService.handleCompletion()` marked Selesai anyway; 5×/25s "no next tugasan" (wanda2 server.log 15:16:11) |
| Fix | `InitiateBPMFlowableForm` → **Initiate & Alter in one click** → target PYMB · Reset Vars=**No** · 2026-08-07 23:46:59 |
| Verified | `umm_tgsn_semasa` 115172 PYMB `-PT-` **sitihanum**; `umm_a_tgsn` 2780452 flag_aktif=Y id_bpm_task 18870548; `umm_aliran_kerja` 22764 |
| Rehearsed | stg2 `PTMLK/01/L/PT/2026/3` (itself an orphan) → engine task 7022569 alive |
| Docs | `QA-274510.md` + `DUE-DILIGENCE.md` in Task folder 136 |

### Flowable facts worth not re-deriving

| Fact | Detail |
|---|---|
| Column trap | 4 job tables use `process_instance_id_`; all others `proc_inst_id_` |
| Reset flag is NEGATED | `InitiateBPMFlowableForm.initFlowable():1017-1019` passes `!flag` — **No** = copy previous vars |
| Staging schema | The staging app is served by **`et_main_stg2`**; same `aplikasi_id` exists in stg1 with older state |
| `nextUser<TASKCODE>` | Does NOT persist through Initiate & Alter; assignment comes from `agihanKepada` + peranan |
| Full architecture | `etanah-knowledge/melaka/FLOWABLE-KNOWLEDGE.md` (gitignored, OneDrive-carried) |

---
