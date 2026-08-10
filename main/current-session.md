# Current Session

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

## 2026-08-10 09:1x — 273455 AFTERMATH: HIS FOUR QUESTIONS FOUND WHAT MY RUBRIC HAS NO ROW FOR

**Append to the 08-07 block below. No code shipped. The fix was already on `mlk/int-env`; today was
the aftermath analysis I should have run before calling it done.**

### ▶▶ NEXT SESSION — START HERE

| Priority | Ticket | State | First step |
|---|---|---|---|
| **1** | **273460** | Phase 0 · oldest open, due 12 Aug | TRG blast-radius check |
| — | **273455** | shipped `mlk/int-env` @ `52a130c08a` | ⬜ **UNDECIDED: 29 apps / 170 letters already generated hold the blank values.** Regeneration path untraced |
| — | board | 273707 · 273921 · 273956 · 274136 · 274318 · 274532 | 274136 + 274532 have no local block yet |

### What his four questions found

| He asked | Answer | I had not looked |
|---|---|---|
| *"is there permohonan with defects"* | **58** on PROD (61 app-hakmilik rows) of 95 Awam PT/PSBS | ✗ |
| *"does our fix cater permohonan past SKM"* | **35 already past SKM**; 12 of 13 tugasan mount the panel; the fix has **no tugasan condition** | ✗ |
| *"what happens to already generated"* | **29 apps · 170 `umm_a_dok_keluaran` rows** keep the blanks — a file, not a view | ✗ |
| *"that regression is only for clearing right"* | correct — verified in `PelupusanService.saveMaklumatTanahVOIntoAppHakmilik():4412`, all 10 fields written | partially |

Every one was DB-answerable before I shipped. All four were queries. He ran them by asking.

### Built

- `pre-code-check` **v1.4** — new required `fallback-precedence` row: primary-read-first · guard-on-absence · **what happens when the user deliberately empties the field**. `"It only fills blanks"` explicitly rejected as an answer. Evals 10/10 + 10/10, RED first.
- 🚨 **The forge had been refusing every refine on `pre-code-check` since 2026-08-04** — `GOOD_PREFIX` never gained the five checks added that day, so the eval sat red and `core/forge.js` blocked all refinement. Three days dark. Fixed, with a comment in both evals.

### Open

- **29 applications with letters already on file** — nobody has ruled on whether BA must re-jana. Downstream of a close I already called done.
- Staging fixtures pulled for BA (`PTMLK/01/L/PT/2026/13` best) but **the fix is not on `mlk/stag-env`** — merge + deploy there, or give her an mlit app instead.
- Proposed **AFTERMATH block** for the Rubric (5 rows: population · progression · artifacts · self-heal-vs-patch · reverse regression) — `todo.md` Q1, routed through `system-design` before building.
