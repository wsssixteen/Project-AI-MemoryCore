# Current Session

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
