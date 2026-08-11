# Current Session

## 2026-08-11 — QA-273921 PPTPB "Sedang Kemaskini" — CLEAN RE-INVESTIGATION → SHIPPED → ARCHIVED

**Quest QA-273921 (ESOKONGAN · PPTPB · Penyediaan Kertas Pertimbangan Pentadbir Tanah) — CLOSED + ARCHIVED.**

- **Phase/status**: archived. Phase 1 closed + Phase 2 archived same session.
- **Root cause (VERIFIED — clean-room workflow `wf_b1d13023-19f` 11 agents + Fable adversarial audit, both convergent; matched the prior `-audit` doc at 97%)**: generated `KertasPertimbanganPentadbirTanah_PPTPB.docx` was schema-invalid — CCs `syaratKelulusan` + `tanahDimilikiTable` were RUN-level (inline) and their populators inject `<w:tbl>` → `<w:tbl>` in `<w:p>` → Word/PocWordEditor refuses to open → `closable=false` "Sedang Dikemaskini" modal never dismissed → hangs. NOT slow doc-gen. `#271211` = false analog (Surat JT/YB templates only); true twin = QA-262495.
- **Fix**: template-only, 1 file — both CCs inline→block (miya did tanahDimilikiTable manually in Word; I scripted syaratKelulusan). Populators untouched.
- **What moved**: commit `af78b2a970` on `mlk/esokongan/273921` (pushed) · deployed `mlk/int-env` @ `e857065a21` (ticket-only cherry-pick — full merge conflicted on unrelated `TemplateSuratNilaianJPPH_PLTP_PSBS.docx`) · miya deployed to internal + confirmed.
- **Delivery channels**: git branch (pushed) · int-env (deployed) · **NOT yet on Redmine planned-release list** (miya's step). Redmine ticket still "In Progress" — miya updates.
- **Test**: PASS on MLKSTG (norlina@melaka.gov.my, PTMLK/02/L/PPTPB/2026/1, Jana Semula → Kemas kini → Word opens).
- **Knowledge banked**: `etanah-knowledge/melaka/WORD-TEMPLATE-RENDERING.md §4` (inline-CC+TABLE→invalid-docx→spinner-hang: mechanism + detection recipe + fix + dormant-until-data & Jana-Semula traps) + index route. Propagated to MAIN repo (worktree projects/ is gitignored).
- **Resume point**: DONE. Only follow-up = the `/deploy` cherry-pick auto-fallback refine (below).

### `## Deferred to follow-up`
| item | why | where |
|---|---|---|
| `/deploy` auto-fallback to ticket-only cherry-pick | full-merge drags master delta into stale int-env → conflict on unrelated files; skill only *detects* drift, no auto-fallback | refine `.claude/skills/deploy` §4: when already-merged guard shows other-ticket files / pom bump / non-ticket conflict → cherry-pick the fix commit(s) |

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
