# Current Session

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
