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

## 2026-08-12 — QA-274532 PLTP Surat Nilaian JPPH — SHIPPED (Phase 1 closed + int-env deployed)

**Two-issue ESOKONGAN ticket fixed end-to-end: date-blank-after-Jana-Semula (Java guard) + title over-spacing (docx). Local test PASS, committed, pushed, merged to int-env preserving int-env's newer template.**

- **Phase/status**: closed (Phase 1). Phase 2 archive pending.
- **Root causes (both VERIFIED)**: (1) Date — `PelupusanWordCCMethodConstant.populateTarikhSemasa()` guard (QA #233948 regression, commit `885a990388`) blanks the Gregorian `tarikhSemasa` whenever the app has any `STATUS_PENYEDIAAN_PEMBETULAN` doc; Jana Semula flips the SN_JPPH doc to pembetulan → date blanks. Hijri `tarikhMasihi` has no guard → the video's Tarikh-blank / Bersamaan-shown asymmetry. (2) Title — template title paragraph `w:jc=both` (justified) stretched the bold multi-line title.
- **Fix**: (1) Java — `&& !StringUtils.equals(PelupusanConstant.SRT_SN_JPPH, templateProperty.getKodDokumen())` added to the guard (exempts JPPH letter only; in-file convention = `populateFooterSurat1():11799`). (2) docx — title paragraph `both→left` (body/slogan untouched; slogan = separate Training ticket, out of scope per みや + BA).
- **What moved**: commit `63bf558ed3` on `mlk/esokongan/274532` (first push) · merged to `mlk/int-env` @ `051469ef00`. int-env's template carries a `pelanCC` control master lacks → resolved by taking int-env's docx + re-applying our title fix on it (pelanCC preserved, verified).
- **Delivery channels**: git branch (pushed) · int-env (merge pushed; みや deploys via `deployment-scripts/mlit` → `deploy-pelupusan.sh` → `mlk/int-env`) · NOT yet on Redmine planned-release list (みや's step).
- **Test**: PASS (みや local — PTMLK/02/L/PLTP/2026/4, faridmajid@melaka.gov.my — title no gaps, Tarikh shows after Jana Semula).
- **Also this session**: bumped etanah-common `1.1.12→1.1.17-MLK` on `mlk/int-env` for MLKIT (colleague request, commit `c7030ca0cb`, pelupusan).
- **Resume point**: DONE for coding. Left: Phase 2 archive (folder→Archive, active.txt block→active-archive); みや deploys int-env + adds to Redmine planned-release.
- **Slip this session**: `wrong-target-edit-caught` — python first edited the guard at 4708 (wrong method) not 7734; caught by `git diff` before commit, reverted + re-applied at the correct `populateTarikhSemasa`. No bad code shipped.
## 2026-08-12 — ADHOC A12: AWAM PRBB Pengalaman Kerja "Tiada rekod" (STG)

**Ad-hoc DB check for みや (not a ticket). SURIA BINTI MAHAT / IC 850917-04-5544 / et_main_stg2 / urusan PRBB.**
AWAM portal (`etanah-stg`) shows "Tiada rekod" for pengalaman kerja; pelupusan staff app (`etanah-appstg`,
release/1.6.0) shows 4 rows. **DB verdict: data INTACT** — every PRBB app of SURIA has rows (`3431666`=4,
`3431370`=3, `3418106`=2), all `version=0`, unchanged on deploy day. App 3431666's 4 rows written
`created_by=samsiah_jaamat@melaka.gov.my` (STAFF, 17:42), NOT the AWAM applicant → AWAM session never populated.
Fill = CR #252099 `b018a2924b`, gate `melaka && URSN_PRBB` (load `initPengalamanKerjaList():7688`; Next
`onNextPbTab():5561`→`findExistingPengalamanKerjaList():12636`). `etanah-awam release/1.6.0` CONTAINS the fill
(merge-base ancestor=0) → root cause bounded to **AWAM WAR version skew** (`etanah-stg` older/different than
`etanah-appstg`) OR `isMelaka()` false (`:470`). No fix commit + no new row post-17:42 → any "fixed" = redeploy, unconfirmed.

**Saved:** task `142. ADHOC - AWAM - PRBB...` · `ADHOC-REGISTER.md` A12 · `ENV-ARCHITECTURE.md §1` · memory
`feedback_url_host_identifies_war`. **Learning:** URL host prefix = WAR; path = form.
**NEXT:** AWAM-portal re-test producing an applicant-created (`@gmail`) pengalaman row + capture AWAM `etanah-stg` version panel.

---

## 2026-08-12 — QA-265537 etanah-common display-tolerance edits REMOVED (confirmed unused)

**みや spotted two uncommitted `etanah-common` files on `mlk/master` and asked whether they were a
missing ticket fix. Traced them to QA-265537's rejected candidate-4 direction, confirmed unused, and
removed them.**

- **Quest QA-265537 (MLPS · 4Ae/L1e · Bandar field)** — already `status=closed` (Resolved 100% by Aaron Loh). This session only cleaned up stranded local edits.
- **What the edits were**: bandar LAIN-LAIN label fallback (Helper ×2 + `InputAlamat.java` ×1) + inverted `bandarLain` reset (Helper ×2). The read/display-tolerance direction = **candidate 4, REJECTED by familiar** (qa_doc:371, 40% band-aid).
- **Why unused**: shipped fix was the **awam save-path** (`e38f1e3f81`, branch `mlk/qa/265537`); etanah-common was out of scope. The qa_doc's later "read-tolerance needed for 191k legacy rows" oscillation was never shipped and みや ruled it out.
- **Actions**: `git checkout --` both common files → clean vs HEAD; `git stash drop "stash 265537"` (commit `a616e777e3`, reflog-recoverable ~90d).
- **Residue sweep (3 repos)**: no 265537 stash anywhere; legit shipped branches intact (`mlk/qa/265537` awam+pelupusan, `mlk/qa/265537v2` pelupusan). Code side fully clean.
- **Quest files**: qa_doc `QA-265537.md` 2026-08-12 closure block appended (main copy — untracked/confidential); active.txt `current_phase` → RESOLVED (both main + worktree copies reconciled, differed by only that one line).
- **Not touched (unrelated, left for みや)**: etanah-common `UtilitiKemaskiniUlasanJPPHForm.java`, etanah-awam `PelupusanMaklumatPemohonHelperForm.java` tempat-tinggal null-guard, `.settings` churn.
- **Resume point**: DONE. QA-265537 needs nothing further. Optional: the two unrelated etanah uncommitted edits above could be traced/cleaned if みや wants.

---

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
