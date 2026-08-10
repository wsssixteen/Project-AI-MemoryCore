# Current Session

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

## 2026-08-10 09:16 — ADHOC: THE FETCH ERROR THAT WAS NEVER AN ERROR (both Melaka repos fixed)

**No ticket, no quest touched. みや asked why a fetch error keeps appearing and why retrying is
always fine. It is a Windows case-insensitivity collision across 17 mixed-case remote folders —
harmless, and now permanently excluded in both repos. Verified: two consecutive fetches, second
one silent, exit 0.**

### ▶▶ NEXT SESSION — START HERE

| Priority | Ticket | State | First step on resume |
|---|---|---|---|
| **1** | **273460** | Phase 0 · oldest open, due 12 Aug | needs the TRG blast-radius check (unchanged — this session did not touch it) |
| 2 | 273707 · 273921 · 274136 · 274182 · 274318 | see the 08-07 block below | board ranks by working-days elapsed |
| — | 274136 | **not in active.txt** | boot surfacer flagged it as assigned-open on Redmine with no local block |

### What was fixed

| repo | change | verification |
|---|---|---|
| `etanah-awam` | 22 negative refspecs + 48 stale remote-tracking refs deleted (3,416 → 3,371) | fetch ×2, second silent, exit 0 |
| `etanah-pelupusan` | `^refs/heads/mlk/cr/259112` + that 1 stale ref deleted | 0 collisions remain, exit 0 |

Config backups: `%TEMP%\awam-fetch-refspec-backup.txt` · `%TEMP%\plp-fetch-refspec-backup.txt`.
Rollback = `git config --unset-all remote.origin.fetch` then re-add `+refs/heads/*:refs/remotes/origin/*`.

**The mechanism**, so it is not re-derived: remote is case-sensitive, his disk is not, so
`trg/esokongan-CR/` and `trg/esokongan-cr/` are one folder locally. Git keeps one casing, reports
the other's branches deleted, re-creates them under the survivor. Nothing lost — the error fires
*after* the useful work, which is why his branch switch always worked and a retry looked like a fix.
Banked in full at `etanah-knowledge/melaka/GIT-REPO-HYGIENE.md` §1.

**The step that nearly got missed**: a negative refspec alone is not enough. `packed-refs` is a
single text file and stays case-sensitive, so stale entries survive the config change and the next
fetch fails with `incorrect old value provided`. `git update-ref -d` on each is mandatory. The
`git-health` skill's v1.0 recipe stopped at the refspec — corrected to v1.1.

### Working memory

- **Stash held, not applied** — `stash@{0}` "stale worktree reversions pre-DE 2026-08-10 (OneDrive lag vs dfbc544)". Four files in this worktree were OLDER than `origin/main` and would have reverted QA-273201/QA-273455 state plus the ENV-ARCHITECTURE + TRAINING-lane knowledge rows. Stashed rather than committed or discarded. **Do not pop it** — its `index.md` predates the GIT-REPO-HYGIENE row added today. Drop it once confirmed.
- The pelupusan `259112` casing pair is resolved: both branches were fully merged into `mlk/master`, 0 ahead. Aaron's `mlk/CR/259112` (07-31) superseded みや's `mlk/cr/259112` (07-16). Excluded by exact ref, not folder glob, so future lowercase `mlk/cr/` branches still fetch.
