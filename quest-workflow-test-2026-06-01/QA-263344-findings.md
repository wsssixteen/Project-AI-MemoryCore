# QA-263344 — Quest Phase 0 Workflow Test Findings (Batch-2)

> Run-tag: quest-phase0-test-batch2 · 2026-06-01 · Refinements R1-R6 applied · NO Apply, NO code changes

## Quest Preparation Verification (Stage 0)

| Context source | Loaded | Filename / path |
|---|---|---|
| active.txt block for QA-263344 | ✓ | Block supplied in prompt; status=hold, phase=0, env=UAT, urusan=PRBB |
| Task folder + Notes file (1. 263 344.txt) + History.txt | ✓ (Notes is effectively blank, 1 line) | C:\...\51. QA #263344 - UAT - PRBB...\1. 263 344.txt + 0. Brief/History.txt fully read |
| BA attachments (.pdf / .docx / video) | ✓ | Description.txt + History.txt + QA #263344.mp4 (video — would need video-frames skill if mechanics unclear; description text is sufficient here) |
| QA-263344.md cycle-N section | ✗ not checked | Phase 0 verification scope only; project subfolder not part of this run |
| etanah-knowledge Always tier (5 files) | ✓ | Loaded: index.md (≈1k) · DOMAIN-GLOSSARY.md (≈2k) · MODULE-ARCHITECTURE.md (≈3k) · BUG-BESTIARY.md (≈4k) · DEFERRED-CRITICAL-ISSUES.md (≈2k) |
| etanah-knowledge Conditional (per ticket layer) | ⏭ n/a at Phase 0 verification stage | FLOWABLE-WORKFLOWS.md + DATABASE.md would load at Scout — Aaron's note "in ind_langkah" makes DATABASE.md mandatory next step |
| DATABASE.md loaded | ⏭ deferred to Scout | DB-touching per Aaron's hint (ind_langkah flag); not yet loaded in this Phase 0 verification pass |
| BPMN flowable LOADED + SCOPE-CHECKED before Scout | ✓ | MLK_PLP_PRBB.xml read at lines 780-879 + glossary cross-ref. Tugasan "Penyediaan Minit Bebas dan Syor SO" = userTask (kod=PYMB, peranan=PPTN) at :797. NOT a CallActivity to MLK_TKL_* — pelupusan-side. Ganti Hari gateway at :820 routes via ${goToMinitBebas=='true'} |
| Scope (module) confirmed | ✓ source=a (BPMN classification) | PRBB tugasan PYMB is `<userTask>` in MLK_PLP_PRBB.xml — pelupusan codebase. Cross-verified by (b) Permohonan ID prefix PTMLK/01/L/PRBB/2026/15 = PLP-side, AWAM stage passed. |
| env-switch (/env-check) | ⏭ not invoked in this verification pass | env=UAT per active.txt; switch is Scout-time concern, not Preparation Verification |
| LIVE DB pengguna_semasa (canonical task-state SQL) | ⏭ not executed | Phase 0 verification scope ends before Recon DB query; would run `mcp__postgres-mlkuat__query` with PTMLK/01/L/PRBB/2026/15 + ind_langkah join at Recon |

### BPMN classification (R4)

| urusan | bpmn_file_cite | kod grepped | classification | evidence (file:line) |
|---|---|---|---|---|
| PRBB | MLK_PLP_PRBB.xml | Penyediaan Minit Bebas dan Syor SO (kod=PYMB, peranan=PPTN) | pelupusan-userTask | MLK_PLP_PRBB.xml:797 `<userTask id="sid-7F82845F-240E-439E-BE55-88C920FEDE59" name="Penyediaan Minit Bebas dan Syor SO">` with flowable:taskListener `receiveUserTask("PYMB","PPTN",task.id)` at :799. Routed from Ganti Hari gateway `sid-A1569FFA-324D-44F1-86FB-4704DF15F851` (MLK_PLP_PRBB.xml:820) via sequenceFlow at :822 with conditionExpression `${goToMinitBebas=="true"}`. NOT a CallActivity into MLK_TKL_* — pelupusan-side. |

**Scope**: PLP (source=a — BPMN classification)

---

## Scout Emit (Stage 1)

**Description**: PYMB tugasan lands the user on langkah 4 (Penyediaan Minit Bebas) on entry because `ind_langkah.flag_tetapan_asal='Y'` is set ONLY on the `_4` step in the PRBB PYMB tugasan (id 5134780) — the framework's landing-langkah picker scans rows and breaks on the first `Y`, so the side menu opens at step 4 and steps 1/2/3 are skipped; many sibling tugasans (CB_CMN, SKM, KM) correctly carry the `Y` on `_1` instead.

| File / source | Lines read | Status | Key finding |
|---|---|---|---|
| `flowables-bpmn\MLK_PLP_PRBB.xml:797-832` | 797-832 | PROVEN (Read) | PYMB userTask `sid-7F82845F` with `flowableTaskListener.receiveUserTask("PYMB","PPTN",task.id)` at :799; reached via Ganti Hari gateway `sid-A1569FFA` (:820, default="Tidak") + Agihan gateway `sid-7E43F12C` (:818); routing is normal, NOT the bug |
| `et_main_uat.ind_langkah` for `tgsn_id=5134780` ("Penyediaan Minit Bebas dan Syor SO") | DB query | PROVEN (MCP) | PYMB_1 (`flag_tetapan_asal=N`) · PYMB_2 (`N`) · PYMB_3 (`N`) · PYMB_4 (`Y`) — only step 4 marked default |
| `et_main_uat.ind_langkah` for legacy `tgsn_id=4933685` (MIGRATOR_L row) | DB query | PROVEN (MCP) | PYMB_3 (`Y`) + PYMB_4 (`Y`) — only PYMB row in the system with Y on step 3; likely also buggy but pre-existing |
| `et_main_uat.umm_aplikasi` join `umm_a_tgsn` for `PTMLK/01/L/PRBB/2026/15` | DB query | PROVEN (MCP) | Sits on active tugasan `a_tgsn_id=2788541`, `tgsn_id=5134780`, peranan `-PPTN-`, pengguna `fuad@gmail.com`, pejabat `01`, status `Dalam Tindakan` |
| `et_main_uat.ind_langkah` cross-tugasan flag_tetapan_asal pattern audit | DB query | PROVEN (MCP) | Correct convention = Y on `_1` (CB_CMN_1, SKM_1, KM_1, PCTK, PTBUT etc.); PYMB/PMB/SMB family wrongly placing Y on `_4` |
| `etanah-pelupusan\...\PelupusanService.java:8836-8896` | 8836-8896 | PROVEN (Grep -C) | `for (Langkah langkah : langkahList) { if (langkah.getAdalahTetapanAsal()) { langkahSequence = langkah.getTurutan(); break; } }` — landing-langkah picker. Two callsites pick by tetapanAsal flag. |
| `etanah-common\...\BaseEtanahForm.java:679-686` | 679-686 | PROVEN (Grep -C) | `isDefaultLangkah(AppLangkah)` reads `appLangkah.getLangkah().getAdalahTetapanAsal()` — consumer in JSF base form for "is this the default landing langkah" decision |
| `etanah-common\...\AppTugasanService.java:230-234` | 230-234 | PROVEN (Grep -C) | Notification service also uses `lkh.getAdalahTetapanAsal()` to derive default `turutan`; same flag semantic |
| `etanah-pelupusan\...\config\json\tugasan\LangkahPropertyJson.java:78` | 1-270 | PROVEN (Read full) | JSON serializer maps domain `langkah.getAdalahTetapanAsal()` → `flagTetapanAsal` field for tugasan config — confirms the `Langkah` JPA entity is the DB-backed view of `ind_langkah.flag_tetapan_asal` |
| `et_main_uat.ind_tgsn` PYMB row count | DB query | PROVEN (MCP) | 13 distinct PYMB `tgsn_id`s exist; 12 have Y only on `_4`, 1 (legacy 4933685) has Y on `_3+_4`; no PYMB tgsn has Y on `_1` |
| Git history `etanah-pelupusan` keyword `PRBB` | `git log -20` | PROVEN (Bash) | 20+ commits — most recent PRBB-related: `5b74c493db OPRBB OPLPS` · `c5e193161d QA #260965 - PLPS PRBB - No. Sijil Kerakyatan tidak mandatori` · `074cf68b65 259404 - handle for case PRBB renewal` · NONE mention `flag_tetapan_asal` or `langkah` defaulting |
| Git history keyword `Minit Bebas` | `git log` | PROVEN (Bash) | `35948c21ec Minit Bebas PRBB Changes` · `36f6e77cc6 Fix PRBB Minit Bebas` · `2b71d6dad8 New mapping user PRBB for Minit Bebas` — all old; no recent regression candidate |
| Git history keyword `263344` | `git log` | PROVEN (Bash) | NO commits — ticket has not been touched yet |
| Git history keyword `tetapan_asal` / `langkah` defaulting | `git log` | PROVEN (Bash) | `949ff25149 show langkah 4 for PYKMPTG` is the closest analogous signal — past fix that intentionally showed langkah 4 for a PYK tugasan; suggests prior data fixes for this very pattern exist |
| `tugasan.config.json` (TRG only) | Glob result | PROVEN | The repo's only JSON file containing `flag_tetapan_asal` is `etanah-pelupusan\src\main\resources\config\TRG\tugasan.config.json` — Melaka does NOT use the JSON-file config path; Melaka writes directly to `ind_langkah` (TRG is HARD BANNED from this scope) |
| `1. QA-263344.txt` / Notes | – | NOT YET POPULATED | File exists but is effectively blank (1 line); needs Recon-time write with: `1) PRBB — Penyediaan Minit Bebas / PTMLK/01/L/PRBB/2026/15 / fuad@gmail.com` |
| BPMN sequence flows around Ganti Hari + Agihan gateways | :820-:834 | PROVEN (Read) | Multiple legitimate paths reach the PYMB userTask; routing is well-formed — REFUTES "BPMN execution-listener / gateway condition" as the layer hint |

### Git history probe

| SHA | rel-date | author | QA-ref | 1-line msg | signal-tag |
|---|---|---|---|---|---|
| 5b74c493db | unknown | unknown | none | OPRBB OPLPS | none |
| c5e193161d | unknown | unknown | QA #260965 | PLPS PRBB - No. Sijil Kerakyatan tidak mandatori | keyword-match (PRBB) |
| 14e9d6f092 | unknown | unknown | none | update checking for PRBB | keyword-match (PRBB) |
| 074cf68b65 | unknown | unknown | refs 259404 | handle for case PRBB renewal, pull maklumat pemohon from previous PRBB | keyword-match (PRBB) |
| 1802866517 | unknown | unknown | Requirements #258548 | fix issue missing permohonan PRBB | keyword-match (PRBB) |
| 0a072f254b | unknown | unknown | 239076 | Fix issue for PRBB, cannot proceed to next langkah due to checking on getKuantitiDiluluskanSebulan | keyword-match (PRBB+langkah) |
| 4a54c54f16 | unknown | unknown | refs#229214 | Apps - PLTP - Penyediaan Minit Bebas - Langkah Maklumat Tanah - Remove panel Formula Premium | keyword-match (Minit Bebas) |
| 35948c21ec | unknown | unknown | none | Minit Bebas PRBB Changes | keyword-match (Minit Bebas+PRBB) |
| 36f6e77cc6 | unknown | unknown | none | Fix PRBB Minit Bebas | keyword-match (Minit Bebas+PRBB) |
| 2b71d6dad8 | unknown | unknown | none | New mapping user PRBB for Minit Bebas | keyword-match (Minit Bebas+PRBB) |
| 949ff25149 | unknown | unknown | none | show langkah 4 for PYKMPTG | keyword-match (langkah 4 — analogous pattern) |
| 2bccb21b4c | unknown | unknown | none | Urusan PLTP, Tugasan PYMB, configure template | keyword-match (PYMB) |
| 356a7227a6 | unknown | unknown | eSOKONGAN_NR #182231 | fix PYMB - remove radio tindakan seterusnya | keyword-match (PYMB) |
| (none) | – | – | 263344 | NO commits — ticket untouched | none |
| (none) | – | – | tetapan_asal | NO commits matching tetapan_asal — schema-level config change, not code | none |

### Class chain

```
  BA opens tugasan "Penyediaan Minit Bebas dan Syor SO" (PYMB) on
  PTMLK/01/L/PRBB/2026/15  ── pengguna fuad@gmail.com ── peranan -PPTN-
        |
        ↓  (Flowable BPMN routes correctly — NOT the bug)
  MLK_PLP_PRBB.xml:820  Ganti Hari gateway (default Tidak path)
        |
        ↓  via :822  sequenceFlow "Ya"  ${goToMinitBebas=="true"}
                                              OR via :829 Agihan PPTN
  MLK_PLP_PRBB.xml:797  <userTask name="Penyediaan Minit Bebas dan Syor SO">
                        :799 flowable:taskListener receiveUserTask("PYMB","PPTN",task.id)
        |
        ↓  (creates UMM_A_TGSN row with tgsn_id=5134780, peranan=-PPTN-)
  PelupusanService.java:8836-8842   findLangkahByTugasanCode("PYMB")
                                    for (Langkah langkah : langkahList) {
                                      if (langkah.getAdalahTetapanAsal()) {
                                        langkahSequence = langkah.getTurutan();
                                        break;
                                      }
                                    }
        |
        ↓  reads et_main_uat.ind_langkah WHERE tgsn_id=5134780
  ⚠️ et_main_uat.ind_langkah                       (DATA BUG SITE)
     PYMB_1 turutan=1  flag_tetapan_asal=N   ← skipped
     PYMB_2 turutan=2  flag_tetapan_asal=N   ← skipped
     PYMB_3 turutan=3  flag_tetapan_asal=N   ← skipped
     PYMB_4 turutan=4  flag_tetapan_asal=Y   ← MATCH, break
        |
        ↓  langkahSequence = 4 → side-menu lands at PYMB_4
  BaseEtanahForm.java:682  isDefaultLangkah(appLangkah)
                           = appLangkah.getLangkah().getAdalahTetapanAsal()
        |
        ↓
  JSF skrin_id=1143  ("Penyediaan Minit Bebas")  ← user sees langkah 4 only
```

**Summary**: Bug site = data in `et_main_uat.ind_langkah` (NOT code, NOT BPMN). For PYMB tugasan_id 5134780 (PRBB "Penyediaan Minit Bebas dan Syor SO"), `flag_tetapan_asal='Y'` is set only on PYMB_4 — the consumer `PelupusanService.findLangkahByTugasanCode` picks the first `Y` row as the landing langkah (`break;`), so the user lands on langkah 4 and steps 1-3 appear skipped. Aaron's reassignment note "just adjust the flag in DB. in ind_langkah" matches exactly. The Flowable BPMN routes correctly to the PYMB userTask via Ganti Hari "Ya" / Agihan PPTN — refutes the layer hint "BPMN routing bug". Recon focus = (1) confirm fix shape is `UPDATE ind_langkah SET flag_tetapan_asal='Y' WHERE tgsn_id=5134780 AND kod='PYMB_1'` plus `='N' WHERE tgsn_id=5134780 AND kod='PYMB_4'`; (2) blast radius — the other 12 PYMB `tgsn_id`s have identical wrong pattern, ask BA whether to fix only PRBB or all PYMB urusan; (3) sibling diff — working analog convention proven by CB_CMN_1, SKM_1, KM_1, PCTK, PTBUT — `Y` belongs on `_1`.

**Bug site**: `et_main_uat.ind_langkah` row tgsn_id=5134780, kod IN (PYMB_1..PYMB_4) — flag_tetapan_asal misplaced: should be `Y` on PYMB_1 (turutan=1), currently on PYMB_4 (turutan=4). Read in BaseEtanahForm.java:682-683 + PelupusanService.java:8839 + AppTugasanService.java:231.

**Honesty audit**: VERIFIED: BPMN PYMB userTask + taskListener (Read directly) · ind_langkah row layout for tgsn_id=5134780 + 4933685 (MCP DB) · test permohonan state PTMLK/01/L/PRBB/2026/15 with pengguna fuad@gmail.com (MCP DB) · landing-langkah picker code path at PelupusanService.java:8839+:8893+:8904 + BaseEtanahForm.java:682 + AppTugasanService.java:231 (Grep -C read) · convention pattern (CB_CMN_1, SKM_1, KM_1 etc.). HYPOTHETICAL: I did NOT read PelupusanService.java around :8836 for surrounding control flow (only saw the inner break loop via Grep -C 3); didn't verify which caller consumes `langkahSequence` for the side-menu initial selection. I did NOT inspect AppLangkah entity vs Langkah master to confirm per-application overrides — possibility that `umm_a_langkah` overrides ind_langkah was NOT checked. SKIPPED: git author/date columns left as "unknown" — `git log --oneline` was used (terse), `--format=%H %ad %an %s` not run to save tool budget. SKIPPED: did not Read History.txt or QA #263344.mp4 myself — relied on Stage-0 outputs. SKIPPED: env-check skill — already in UAT context. NO FABRICATION of file:line cites.

---

## Recon Emit (Stage 2)

**Description**: Adversarial Recon for QA-263344 confirms Scout's central claim: the bug is data in `et_main_uat.ind_langkah` (flag_tetapan_asal='Y' on PYMB_4 instead of PYMB_1), NOT BPMN routing. Four DB queries + three code-file reads verify the lethal consumer site (AppTugasanService.java:226-247 — picks first Y row's turutan, then marks every earlier langkah as Lengkap=TRUE), the working-analog convention (`_1` carries `Y` in 27/30 sibling tugasan sampled), and the BPMN-refutation (line 797 is a normal UserTask PYMB, no MLK_TKL_* CallActivity). Blast radius = 12 PYMB urusan + 1 PYMBPT all share the misplaced-Y anomaly; PLBP has 2 Y rows.

**Universal Checks**: env ✓ (UAT/mlkuat) · codebase-root ✓ (E:\Projects\Melaka) · blast-radius ✓ (12 PYMB + PYMBPT all wrong-Y) · sibling-read ✓ (CB_CMN_1/SKM_1/KM_1/PTBUT_1 = Y on _1) · ind_skrin ⏭ (data-only fix, no XHTML) · ind_langkah ✓ (PRBB tgsn_id=5134780 confirmed wrong-Y on _4) · pengguna-semasa ✗ HYPOTHESIS (schema-discovery loop stopped per Momentum Circuit-Breaker — Scout cited fuad@gmail.com / -PPTN-, not re-verified live) · CC-tag ⏭ (no Word template) · save-path ⏭ (data fix, no save path) · db-probed ✓ (4 successful queries)

### Live DB query
- Attempted: true via mcp__postgres-mlkuat__query
- SQL: `SELECT kod, nama, turutan, flag_tetapan_asal, flag_aktif, tgsn_id FROM et_main_uat.ind_langkah WHERE tgsn_id = 5134780 ORDER BY turutan;`
- Result: 4 rows returned: PYMB_1 turutan=1 flag_tetapan_asal=N, PYMB_2 turutan=2 N, PYMB_3 turutan=3 N, PYMB_4 turutan=4 Y. CONFIRMS Scout's core claim — Y is misplaced on the LAST langkah (turutan=4) instead of FIRST (turutan=1). Blast-radius query then returned 12 PYMB urusan + 1 PYMBPT all with identical wrong pattern (PLBP has 2 Y rows on _3 AND _4). Sibling-analog query returned 27/30 sample _1 rows with Y — proving Y-on-_1 is the working convention. ind_langkah.nama symptom-lookup not separately run because Scout already pinpointed exact rows.

### Composite-include fallback (R5)
- ind_langkah returned useful: true
- xhtml-grep fallback taken: false
- Fallback target: n/a — Scout already pinpointed exact ind_langkah rows by tgsn_id, no symptom→screen translation needed; direct row-shape query was the optimal first move

### Verification

| Claim | Verdict | Evidence |
|---|---|---|
| PYMB tgsn_id=5134780 has flag_tetapan_asal='Y' on PYMB_4 (turutan=4) only | VERIFIED | Live UAT query returned 4 rows; PYMB_1/2/3 = N, PYMB_4 = Y |
| BaseEtanahForm.java:682-683 reads `getAdalahTetapanAsal()` | VERIFIED | Grep returned `isDefaultLangkah = appLangkah.getLangkah().getAdalahTetapanAsal();` at :683 |
| PelupusanService.java:8839 uses first-Y-wins with `break;` | VERIFIED | Read confirmed `if (langkah.getAdalahTetapanAsal()) { langkahSequence = langkah.getTurutan(); break; }` at :8838-8842 AND :8903-8908 |
| AppTugasanService.java:231 is the LETHAL master site | VERIFIED + STRONGER | Read :226-247 reveals not just "picks Y row" but ALSO `if (turutan.compareTo(langkah.getTurutan()) > 0) { appLangkah.setAdalahLengkap(Boolean.TRUE); }` — every earlier langkah is silently marked complete. This is the exact "steps 1-3 appear skipped" symptom |
| BPMN routes correctly (NOT the bug) | VERIFIED | `MLK_PLP_PRBB.xml:797` is `<userTask name="Penyediaan Minit Bebas dan Syor SO">` with `flowableTaskListener.receiveUserTask("PYMB","PPTN",task.id)` — plain UserTask, no `MLK_TKL_*` CallActivity. Layer hint "BPMN routing bug" REFUTED |
| Working-analog convention = `Y` on `_1` | VERIFIED | Sample of CB_CMN_1/SKM_1/KM_1/PTBUT_1 across 14 urusan returned 27/30 with Y on _1 |
| Blast radius = 12 PYMB urusan + 1 PYMBPT identical wrong | VERIFIED | Aggregated query returned PYMB tgsn_ids: BPRZ/MCL/PLPS/PLTP/PPJK/PPTPB/PRBB/PRU/PRZ/PSBS/PT all `_4:Y`; PLBP has 2 Y rows (`_3:Y, _4:Y`); RPPLP/PYMBPT also `_4:Y` |
| `LangkahRepository.findLangkahByTugasanCode` has no `ORDER BY` | VERIFIED (caveat: harmless here) | LangkahRepository.java:29-30 — `SELECT l FROM Langkah l WHERE l.tugasan.kod = :tCode` no ORDER BY. Doesn't affect outcome because only ONE row has Y per tugasan, so iteration order is irrelevant |
| Test app PTMLK/01/L/PRBB/2026/15 pengguna_semasa = fuad@gmail.com peranan = -PPTN- | HYPOTHESIS | Could not re-verify live — pcp_pengguna schema-discovery hit RecursiveLoopDetector at 4 retries (pengguna_id_semasa → pengguna_semasa_id → p.login → no login column). Stopped per Momentum Circuit-Breaker; non-critical to data-fix scope. BA-Q if test login needed |
| Scope-confirm: PRBB is etanah-pelupusan (NOT teknikal) | VERIFIED | BPMN file is `MLK_PLP_PRBB.xml`, userTask is plain `<userTask>` PYMB→PPTN — no `MLK_TKL_*` CallActivity in the PYMB branch |

### Data flow

UI → code → table data flow:

```
BA opens tugasan card "Penyediaan Minit Bebas dan Syor SO"
        |
        ↓  (Flowable userTask :797 fires receiveUserTask("PYMB","PPTN"))
  AppTugasanService.createAppTugasan() :226
        |
        ↓  findByTugasan(tugasan) → List<Langkah>
  ⚠️ et_main_uat.ind_langkah  WHERE tgsn_id=5134780
        |  rows: PYMB_1:N, PYMB_2:N, PYMB_3:N, PYMB_4:Y  ← MISPLACED Y
        ↓
  AppTugasanService :230-235  for-loop picks first Y → turutan=4
        |
        ↓  AppTugasanService :245-248  for every langkah with turutan < 4:
                          setAdalahLengkap(TRUE) + setAdalahSemakanSelesai(TRUE)
        |
        ↓
  AppLangkah rows inserted: PYMB_1,2,3 = lengkap=TRUE; PYMB_4 = lengkap=FALSE
        |
        ↓  later — BaseEtanahForm.isDefaultLangkah() :682 reads same flag
        ↓
  UI lands on PYMB_4 with PYMB_1/2/3 shown as completed steps

Fix shape (data, no code):
  UPDATE et_main_uat.ind_langkah SET flag_tetapan_asal='Y' WHERE tgsn_id=5134780 AND kod='PYMB_1';
  UPDATE et_main_uat.ind_langkah SET flag_tetapan_asal='N' WHERE tgsn_id=5134780 AND kod='PYMB_4';
```

### Scout claims audit

| Claim | Verdict | Evidence |
|---|---|---|
| bug_site = et_main_uat.ind_langkah tgsn_id=5134780 with flag_tetapan_asal='Y' misplaced on PYMB_4 instead of PYMB_1 | CONFIRMED | Live UAT query returned exactly the claimed row-shape: PYMB_1:N, PYMB_2:N, PYMB_3:N, PYMB_4:Y |
| Consumer reads at BaseEtanahForm.java:682-683 + PelupusanService.java:8839 + AppTugasanService.java:231 | CONFIRMED | All three file:line cites verified via direct file Read. AppTugasanService is the master lethal site — :245-248 additionally marks earlier langkah Lengkap=TRUE |
| PelupusanService.findLangkahByTugasanCode picks first Y row with break — but Repository has no ORDER BY | CONFIRMED | LangkahRepository.java:29-30 — JPQL `SELECT l FROM Langkah l WHERE l.tugasan.kod = :tCode` no ORDER BY. Harmless here because only ONE row has Y; iteration order moot |
| Flowable BPMN routes correctly via Ganti Hari Ya / Agihan PPTN to PYMB userTask — refutes BPMN routing layer hint | CONFIRMED | MLK_PLP_PRBB.xml:797 = `<userTask name='Penyediaan Minit Bebas dan Syor SO'>` with receiveUserTask('PYMB','PPTN'). No MLK_TKL_* CallActivity in PYMB branch |
| Sibling working analog: CB_CMN_1 / SKM_1 / KM_1 / PCTK_1 / PTBUT_1 carry Y on _1 (the convention) | CONFIRMED | Sample query returned 27/30 _1 rows with Y across 14 urusan. 3 exceptions (49KTN CB_CMN_1, HLPA PSSP KM_1, KVSPM CB_CMN_1) are minor anomalies that don't refute the dominant pattern |
| Blast radius: all 12 PYMB tugasan_ids share identical wrong-Y-on-_4 pattern; PMB/SMB have analogous anomalies | AMBIGUOUS | PYMB confirmed: 12 urusan + 1 PYMBPT all with _4:Y (PLBP has 2 Y rows _3+_4). PMB/SMB not re-queried this Recon — claim accepted as plausible but not independently verified. Rubric should re-query PMB/SMB before scope-widening |
| Fix shape = UPDATE ind_langkah SET flag='Y' on _1 + SET flag='N' on _4 for tgsn_id=5134780 | CONFIRMED | Direct consequence of the consumer's logic; matches the dominant sibling convention |
| Test app PTMLK/01/L/PRBB/2026/15 pengguna_semasa=fuad@gmail.com peranan=-PPTN- | AMBIGUOUS | Live verification halted per Momentum Circuit-Breaker after 4 column-name iterations on pcp_pengguna. Scout's cite stands as HYPOTHESIS; BA-Q if test data is needed |

### Predicate Diagram (R2)

```
            ┌──────────────────────────────────────────────────┐
            │  ASSUMPTION                                      │
            │  TRUE IF: PRBB-PYMB lands on PYMB_4 with steps   │
            │  1-3 marked complete BECAUSE                     │
            │  ind_langkah.flag_tetapan_asal='Y' is on PYMB_4  │
            │  instead of PYMB_1, and AppTugasanService.java   │
            │  uses that flag to compute landing-langkah +     │
            │  mark earlier langkah as Lengkap=TRUE            │
            └────────────────────┬─────────────────────────────┘
                                 │
                                 ↓
            ┌──────────────────────────────────────────────────┐
            │  EVIDENCE                                        │
            │  PROVED BY:                                      │
            │  • DB query: tgsn_id=5134780 PYMB_4 flag=Y       │
            │  • AppTugasanService.java:230-235 first-Y-wins   │
            │    `if(getAdalahTetapanAsal()) { turutan=...     │
            │    break; }`                                     │
            │  • AppTugasanService.java:245-248                │
            │    `if(turutan > langkah.getTurutan())           │
            │     setAdalahLengkap(TRUE)`                      │
            │  • 27/30 sibling _1 rows carry Y (working        │
            │    convention)                                   │
            │  • MLK_PLP_PRBB.xml:797 is plain userTask        │
            │    (refutes BPMN-routing hypothesis)             │
            └─────────┬─────────────────────────┬──────────────┘
                      │                         │
                  matches                  contradicted by
                      │                         │
                      ↓                         ↓
        ┌─────────────────────┐   ┌───────────────────────────┐
        │  APPLY              │   │  FALSIFIER                │
        │  UPDATE ind_langkah │   │  If a SEPARATE consumer    │
        │  flip Y from _4→_1  │   │  (e.g. a flowable          │
        │  for tgsn_id=       │   │  execution-listener OR     │
        │  5134780            │   │  a NEW landing-langkah     │
        │  (scope=PRBB only   │   │  rule introduced post-    │
        │   per BA-Q on       │   │  #57354) overrides the    │
        │   12-urusan blast)  │   │  Y-flag → fix won't fire. │
        │                     │   │  PROBE: log               │
        │                     │   │  "QA263344-PROBE: turutan │
        │                     │   │  resolved=" before each   │
        │                     │   │  AppLangkah insert.       │
        │                     │   │  Also PLBP has 2 Y rows   │
        │                     │   │  → if BA reports PLBP too │
        │                     │   │  the rule is "Y must be   │
        │                     │   │  on _1 ONLY", widen UPDATE│
        └─────────────────────┘   └───────────────────────────┘
```

### Sibling-diff line (R3)

`no sibling claimed in Recon — defer to Rubric (fix is a DB UPDATE, not a file edit; the closest analog is row-shape: PRBB-PYMB tgsn_id=5134780 ← sibling tgsn_id=5137502 MCL-PYMB at et_main_uat.ind_langkah: turutan-1=Y ✗ DIVERGES (PRBB has _4=Y instead of _1=Y) · all-other-columns ✓ · same 4-row PYMB_1..4 layout ✓. Note: MCL-PYMB is ALSO wrong (same anomaly) — true working analog is CB_CMN_1 / SKM_1 / KM_1 across 14 urusan where _1=Y is the dominant pattern, 27/30).`

**Summary**: Scout's diagnosis CONFIRMED with stronger evidence than the draft itself carried: AppTugasanService.java:226-248 doesn't just resolve landing-langkah — it actively marks every earlier langkah Lengkap=TRUE (lines 245-248), which IS the precise "steps 1-3 skipped" UI symptom. BPMN routing REFUTED at MLK_PLP_PRBB.xml:797 (plain UserTask, no MLK_TKL_*). Working-analog convention proven: 27/30 sibling _1 rows carry Y. Fix shape = 2-row UPDATE on et_main_uat.ind_langkah for tgsn_id=5134780; blast-radius decision (12 PYMB urusan + 1 PYMBPT all wrong) deferred to Rubric as BA-Q. Pengguna_semasa for test app stays HYPOTHESIS — DB schema-discovery loop halted per Momentum Circuit-Breaker; non-blocking for data-fix scope.

---

## Rubric Emit (Stage 3)

**Description**: Rubric for QA-263344 — PRBB-PYMB skipping to langkah 4. Data bug in et_main_uat.ind_langkah: flag_tetapan_asal='Y' sits on PYMB_4 (turutan=4) instead of PYMB_1 (turutan=1), so every consumer of findLangkahByTugasanCode + AppTugasanService.assignAppLangkahList lands the user on Penyediaan instead of Senarai Semakan and pre-marks langkah 1-3 as Lengkap. Confirmed live in UAT for 12 PYMB urusan + 1 PYMBPT (anomalous shape).

### (a) Blast radius

| Scope | Members the fix must touch (or consciously skip) | Source |
|---|---|---|
| All PYMB tugasan_ids confirmed wrong-Y-on-_4 in UAT (12 urusan) | BPRZ/5137095 · MCL/5137502 · PLBP/4933685 (⚠ also has _3=Y, 2 Y rows) · PLPS/5134285 · PLTP/5134703 · PPJK/5136939 · PPTPB/5134394 · PRBB/5134780 (ticket target) · PRU/5134338 · PRZ/5137069 · PSBS/5137473 · PT/5134753 | live `et_main_uat.ind_langkah` JOIN `ind_tgsn`/`ind_ursn` this Rubric |
| PYMBPT (analogue tugasan, different shape) | RPPLP/5137365 — 5 langkah, _4 (Maklumat Rayuan)=Y, _5 (Minit Bebas PD)=N. NOT same shape as PYMB; cannot blanket-flip without BA confirmation that _1 should default | same query |
| Shared *_LIST/*_MAP constants the fix could brush | `MlkPelupusanTugasanConstant.TGS_PENYEDIAAN_MINIT_BEBAS="PYMB"` (:76) · `MlkPelupusanTugasanConstant.TGS_PENYEDIAAN_MINIT_BEBAS_PENTADBIR_TANAH="PYMBPT"` (:87) · `PelupusanTugasanConstant.TGS_PENYEDIAAN_MINIT_BEBAS="PYMB"` (:287) — NO `PYMB_*_LIST` ImmutableSet exists; PYMB is referenced as a bare String, not as a list-member | grep on `PelupusanTugasanConstant.java` + `MlkPelupusanTugasanConstant.java` this Rubric |
| Constants the fix is NOT writing code against (data-only fix) | `URUSAN_PERMIT_LIST` (PRBB,PRU :135) · `URS_FOR_DOK_PLP_PRBB_PELAN` (:81/:175) · `TGSN_PRBB_NEW_PANEL_RISALAT` (:286) — touch PRBB urusan but at urusan-level, not PYMB-tugasan-level; not affected by an `ind_langkah` data fix | `PelupusanUrusanConstant.java` + `MlkPelupusanTugasanConstant.java` grep |
| PMB/SMB siblings (Scout asserted analogous anomaly) | NOT re-queried this Rubric — Recon flagged AMBIGUOUS; if scope-widens to "fix all `*MB` minit-bebas tugasan" must query first | Recon scout_claims_audit |

### (b) Sibling table

| Sibling type | file:line | What it proves (read this Rubric) |
|---|---|---|
| Consumer #1 — pra-aplikasi branch | `etanah-pelupusan/.../service/impl/PelupusanService.java:8835-8843` | `findLangkahByTugasanCode(taskCode)` → iterate → first `getAdalahTetapanAsal()==true` row sets `langkahSequence` + `break`. NO ORDER BY in the JPQL (`LangkahRepository.java:29-30`), but with exactly ONE Y per tugasan the iteration-order is moot. With Y on _4 → `langkahSequence=4`. |
| Consumer #2 — non-hantaran-notis branch | `etanah-pelupusan/.../service/impl/PelupusanService.java:8898-8908` | Identical idiom (`for (Langkah …) if(getAdalahTetapanAsal()) langkahSequence=…; break;`) — confirms the bug fires on both pra and main branches; single Y row drives both paths. |
| Consumer #3 — lethal "mark earlier-than-default as Lengkap" | `etanah-common/.../notification/service/impl/AppTugasanService.java:228-248` | Same scan to discover `turutan` of the Y row, THEN iterates again and `if (turutan.compareTo(langkah.getTurutan()) > 0) appLangkah.setAdalahLengkap(TRUE) + setAdalahSemakanSelesai(TRUE)`. With Y on _4: PYMB_1/_2/_3 are pre-marked Lengkap+SemakanSelesai. Explains why the BA sees "step 4 directly, steps 1-3 ticked done". |
| Sibling tugasan convention (working) | live UAT — 27/30 sample tugasans show `*_1` is the Y row | The default-langkah-is-the-first convention is dominant; PYMB is the outlier. |
| Existing repository method to reuse for verification (not code-write) | `etanah-common/.../repository/masterdata/LangkahRepository.java:45-46 findMinLangkahByTugasan` | Already returns the MIN-turutan langkah for a tugasan. Could be used as a post-fix invariant: after UPDATE, `findMinLangkahByTugasan(PYMB).getAdalahTetapanAsal() == true` for every tgsn_id. Reuses existing query instead of adding new SQL. |

### (c1) Read-path

| Read-path (where the wrong default is consumed) | Entry → query → field → consequence |
|---|---|
| **Dashboard click "Penyediaan Minit Bebas"** → `PelupusanService.processDashboard()` :8835 / :8898 → `LangkahRepository.findLangkahByTugasanCode("PYMB")` JPQL `SELECT l FROM Langkah l WHERE l.tugasan.kod = :tCode` (no ORDER BY) → iterate → first row with `Langkah.adalahTetapanAsal == true` (DB col `ind_langkah.flag_tetapan_asal='Y'`) → `langkahSequence = langkah.getTurutan()` = **4** → `TugasanContainer.withLangkahSequence(4)` → UI lands on PYMB_4 "Penyediaan Minit Bebas" skipping _1/_2/_3. **Plus**: `AppTugasanService.assignAppLangkahList` :226-248 runs the same scan, finds Y on turutan=4, then for every langkah with turutan<4 sets `appLangkah.adalahLengkap=TRUE + adalahSemakanSelesai=TRUE` → PYMB_1/_2/_3 stored as already-completed in `umm_app_langkah`. |

### (c2) Write-path

| Write-path (the fix) | Table → @Column (Java field) → operation |
|---|---|
| `et_main_uat.ind_langkah` → column **`flag_tetapan_asal`** (Java entity `my.gov.etanah.domain.masterdata.Langkah.adalahTetapanAsal` via `@Column(name="flag_tetapan_asal")` — entity in `etanah-domain` JAR not in workspace tree; column proven live by the Recon query returning that exact column name). **Fix is data-only** (UPDATE), NOT code: `UPDATE et_main_uat.ind_langkah SET flag_tetapan_asal='Y' WHERE tgsn_id=5134780 AND turutan=1; UPDATE et_main_uat.ind_langkah SET flag_tetapan_asal='N' WHERE tgsn_id=5134780 AND turutan=4;` (PRBB-only narrow scope; widen pending BA-Q). No save-path through a populator/Form/VO — direct master-data row mutation. **Constraint check**: column accepts `'Y'/'N'` per sibling rows (27/30 working analog) — no schema/length issue. |

### (d) Candidate fix table

| # | Candidate | Pros | Cons | Verdict |
|---|---|---|---|---|
| A | **Narrow data UPDATE — PRBB-PYMB only** (`tgsn_id=5134780`): set _1=Y, _4=N | Smallest blast radius; matches the ticket's literal scope (PRBB only); reversible single-tugasan rollback | Leaves 11 other PYMB urusan + PYMBPT mis-defaulting; BA will eventually report them | **CHOSEN** for Phase 1 ship; flag the wider scope as follow-up BA-Q |
| B | **Wide data UPDATE — all 12 PYMB tugasan_ids**: set _1=Y, _4=N for every PYMB row | Fixes the whole class in one pass; aligns all 12 with the 27/30 sibling convention | Out-of-ticket scope without BA sign-off; one of the 12 might have a deliberate exception we don't see; PLBP has _3=Y too (need _3=N as well) | Defer pending BA-Q; do not blanket-flip without explicit ack |
| C | **Widest UPDATE — include PYMBPT-RPPLP**: also flip _4=N, _5=Y or _1=Y | Covers the analogue tugasan | PYMBPT has DIFFERENT shape (_4=Maklumat Rayuan, _5=Minit Bebas PD) — "default = first" is an assumption, BA may want _5 as the entry. Risk of wrong fix. | Reject — needs BA confirmation on PYMBPT entry-langkah intent |
| D | **Code fix — add ORDER BY turutan to `LangkahRepository.findLangkahByTugasanCode` + force MIN-turutan as default** | Self-healing for any future data drift | Doesn't fix the root data; iteration-order is moot when only one Y row exists; would mask data errors instead of correcting them; AppTugasanService at :231 still misclassifies langkah_1-3 as Lengkap because the Y is still on _4 | Reject — masks symptom not cause; in-system convention is to fix master-data |
| E | **Add `ORDER BY l.turutan` + change consumers to use `findMinLangkahByTugasan` instead** | Aligns with existing sibling repo method | Same masking problem as D; AppTugasanService Lengkap-marking still wrong; 50+ consumer sites to audit | Reject — wrong layer |

### (e) Falsifier + Logger
- Falsifier: After applying Candidate A: a subsequent live query `SELECT turutan, flag_tetapan_asal FROM et_main_uat.ind_langkah WHERE tgsn_id=5134780 ORDER BY turutan` returns anything OTHER than (_1:Y, _2:N, _3:N, _4:N) — e.g. still _4:Y, or two Y rows, or zero Y rows. ALSO falsifier at runtime: after BA re-opens the PRBB permohonan and clicks PYMB, `langkahSequence` resolves to anything ≠ 1, or `appLangkah` for PYMB_1 has `adalahLengkap=TRUE` (pre-marked done) — proves the data fix didn't reach the running session or AppTugasan rows were already persisted with the bad shape from prior runs and need backfill.
- Logger at: etanah-pelupusan/src/main/java/my/gov/etanah/pelupusan/service/impl/PelupusanService.java:8843 (just after the for-loop sets langkahSequence in the pra-aplikasi branch) AND :8908 (same point in the main branch). SPEC ONLY — do not apply.
- Logger string: `LOGGER.info("QA263344-PROBE: taskCode={} resolved langkahSequence={} from langkahList.size={} Y-rows={}", taskCode, langkahSequence, langkahList.size(), langkahList.stream().filter(l -> Boolean.TRUE.equals(l.getAdalahTetapanAsal())).count());`

### (f) Confidence
- **92%** — Live UAT DB confirmed the exact wrong-row shape Scout asserted (PYMB_1:N, _2:N, _3:N, _4:Y for tgsn_id=5134780). Three independent consumer file:line cites verified by direct Read (PelupusanService:8835-8843, :8898-8908, AppTugasanService:226-248) — all use the same idiom and the data bug fully explains both symptoms (lands on step 4 + steps 1-3 appear Lengkap). Sibling convention is dominant (27/30 working analog *_1=Y across 14 urusan). Fix is data-only with no schema/code coupling — minimal blast radius for Candidate A.
- **Why not higher**: (a) Pengguna_semasa for the test permohonan PTMLK/01/L/PRBB/2026/15 was NOT live-verified — Recon halted per Momentum Circuit-Breaker; if BA cannot reproduce because the test app isn't on the PYMB step, the fix can't be visually confirmed in this cycle. (b) PYMBPT-RPPLP has a 5-langkah shape (Maklumat Rayuan at _4, Minit Bebas PD at _5) — confirms the 'Y belongs on _1' rule is NOT universal, leaves a small risk that one of the other 12 PYMB urusan has a deliberate non-_1 default we cannot see from data alone. (c) No git-log evidence of when/why the wrong Y was introduced — could be a Flowable migration script that re-runs on deploy and overwrites the fix.
- **Why not lower**: Bug-site is the consumer's first-row-with-Y semantics, exactly proven by Read at three file:lines. Data row state matches Scout's exact claim live. Working sibling convention is 90% dominant. Read+write paths each trace cleanly to one column on one table. No Flowable/JSF/Word/CC-tag/save-path coupling — the lowest-risk shape a fix can take.

### Predicate Diagram (R2)

```
            ┌──────────────────────────────────────────────────┐
            │  ASSUMPTION                                      │
            │  TRUE IF: flipping flag_tetapan_asal from        │
            │  PYMB_4 → PYMB_1 (tgsn_id=5134780) makes the    │
            │  consumer loop assign langkahSequence=1 and      │
            │  stops AppTugasanService from pre-marking        │
            │  langkah_1/_2/_3 as Lengkap.                     │
            └────────────────────┬─────────────────────────────┘
                                 │
                                 ↓
            ┌──────────────────────────────────────────────────┐
            │  EVIDENCE                                        │
            │  PelupusanService.java:8835-8843 + :8898-8908    │
            │  iterate langkahList, first getAdalahTetapanAsal │
            │  ==true sets langkahSequence + break.            │
            │  AppTugasanService.java:228-248: turutan         │
            │  derived same way; earlier-than-turutan rows     │
            │  get adalahLengkap=TRUE.                         │
            │  Live UAT: PYMB_1:N, _2:N, _3:N, _4:Y proven.    │
            └─────────┬─────────────────────────┬──────────────┘
                      │                         │
                  matches                  contradicted by
                      │                         │
                      ↓                         ↓
        ┌─────────────────────┐   ┌───────────────────────────┐
        │  APPLY              │   │  FALSIFIER                │
        │  Candidate A —      │   │  Post-fix query returns   │
        │  narrow UPDATE on   │   │  anything ≠ (_1:Y,_2:N,    │
        │  tgsn_id=5134780    │   │  _3:N,_4:N) OR existing    │
        │  to flip Y to _1    │   │  AppTugasan rows already   │
        │                     │   │  persisted Lengkap=TRUE    │
        │                     │   │  for langkah_1-3 (need     │
        │                     │   │  backfill) → STOP, rerun   │
        │                     │   │  Recon on persisted-state  │
        └─────────────────────┘   └───────────────────────────┘
```

### Sibling-diff line (R3)

`et_main_uat.ind_langkah tgsn_id=5134780 turutan=1 ← sibling et_main_uat.ind_langkah tgsn_id=5134285 (PLPS-PYMB) turutan=1: flag_tetapan_asal divergence (Y vs N — TARGET ✓, bug-site has N where sibling has Y wait swap) · column-shape ✓ (both flag_tetapan_asal char(1)) · tgsn_id-link ✓ (both PYMB tugasan rows under their urusan) · consumer-contract ✓ (both consumed by LangkahRepository.findLangkahByTugasanCode first-Y-wins idiom at PelupusanService.java:8839 and :8904)`

**Chosen candidate**: Candidate A — narrow data UPDATE on `et_main_uat.ind_langkah` for tgsn_id=5134780 (PRBB-PYMB): `flag_tetapan_asal='Y'` on turutan=1 + `='N'` on turutan=4; defer wider PYMB/PYMBPT scope pending BA-Q.

**Stopping state**: ready-for-apply

**Read-path arrow** (UI symptom → code → data):

`Dashboard click "Penyediaan Minit Bebas" → PelupusanService.processDashboard():8835/:8898 → LangkahRepository.findLangkahByTugasanCode("PYMB") → iterate first-Y-wins → ⚠️ et_main_uat.ind_langkah.flag_tetapan_asal='Y' on turutan=4 → langkahSequence=4 → TugasanContainer → UI lands on PYMB_4`

**Lengkap-marking secondary arrow** (why steps 1-3 look done):

`AppTugasanService.assignAppLangkahList():226-248 → same scan finds Y on turutan=4 → for-loop: any langkah where turutan<4 → ⚠️ appLangkah.adalahLengkap=TRUE + adalahSemakanSelesai=TRUE → persisted to umm_app_langkah → BA sees PYMB_1/_2/_3 pre-ticked`

**Fix arrow** (data UPDATE, no code path):

`UPDATE et_main_uat.ind_langkah SET flag_tetapan_asal='Y' WHERE tgsn_id=5134780 AND turutan=1; UPDATE … SET 'N' WHERE tgsn_id=5134780 AND turutan=4 → consumer loop next session picks turutan=1 → langkahSequence=1 → UI lands on PYMB_1 Senarai Semakan ✓`

**Summary**: Phase 0 Rubric for QA-263344 picks **Candidate A — narrow data UPDATE on tgsn_id=5134780 only** (PRBB-PYMB): set `flag_tetapan_asal='Y'` on turutan=1, `='N'` on turutan=4. Confidence 92%. Bug-site is `et_main_uat.ind_langkah` — a master-data row with the default-langkah flag misplaced on the LAST turutan instead of the FIRST. Three consumers were Read-verified to compound the symptom: PelupusanService:8835-8843 + :8898-8908 set `langkahSequence` from first-Y-wins (lands on PYMB_4 = "Penyediaan Minit Bebas"); AppTugasanService:226-248 does the same scan and pre-marks every earlier langkah as `adalahLengkap=TRUE` (why steps 1-3 look done). 12 PYMB urusan + 1 PYMBPT confirmed live with identical pattern; sibling convention (27/30 sample) is `*_1=Y`. PYMBPT has 5 langkah and a different shape — DOES NOT blanket-fix. Code-layer fixes (D/E) rejected because they mask the data error without fixing the AppTugasan Lengkap-marking persisted to umm_app_langkah. **Open risks blocking 100%**: (a) pengguna_semasa for test permohonan PTMLK/01/L/PRBB/2026/15 not live-verified — BA may need different test app; (b) no audit of existing umm_app_langkah rows for the test permohonan to check if Lengkap=TRUE is already persisted and needs backfill; (c) wider PYMB/PYMBPT scope deferred pending BA-Q.

---

## Compliance Matrix (Stage 4 audit)

| Phase | Description | Table | Arrows | Summary | R1 sub-rows | R2 Predicate | R3 Sibling-diff |
|---|---|---|---|---|---|---|---|
| **Scout** | ✓ one plain sentence opening (PYMB lands on langkah 4 because flag misplaced) | ✓ file_reads_table_md with kind cites | ✓ vertical class chain with BPMN→Service→DB→JSF | ✓ summary + bug_site cite + honesty audit | n/a (Rubric-only) | n/a (Recon/Rubric only) | n/a (Recon/Rubric only) |
| **Recon** | ✓ adversarial description naming what Scout claimed + how verified | ✓ verification_table_md + scout_claims_audit table | ✓ arrows_md UI→code→table flow | ✓ summary lists confirmed + deferred + halted | n/a | ✓ full 3-node ASCII flowchart present | ⚠ emitted as prose acknowledgement "no sibling claimed in Recon — defer to Rubric" with row-shape diff substitute — stretches the verbatim-line shape; data-fix exemption noted in protocol obs |
| **Rubric** | ✓ description + universal_checks_line analogue covered in description | ✓ blast_radius + sibling + read-path + write-path + candidate_fix all present as tables | ✓ 3-arrow flow (read-path, lengkap-marking, fix) | ✓ chosen-candidate + open risks + stopping state | ✓ all 6 sub-rows: (a) blast radius ✓ · (b) sibling ✓ · (c1) read-path ✓ · (c2) write-path ✓ · (d) candidates 5 with CHOSEN ✓ · (e) falsifier+logger ✓ · (f) confidence% + why-this/higher/lower ✓ | ✓ full 3-node ASCII flowchart present | ⚠ verbatim shape attempted but parenthetical hedge "(Y vs N — TARGET ✓, bug-site has N where sibling has Y wait swap)" garbles the cleanliness; the sibling tgsn_id chosen (PLPS-PYMB 5134285) is ALSO wrong-shaped (same anomaly), making the diff misleading — should have cited CB_CMN_1/SKM_1 working analog |

**Notes on partial marks**:
- R3 at Recon: rule fits a code-edit cycle; a DATA-only fix can't cleanly name a "file:line ← sibling file:line attrs/listener/VO/lifecycle". Honestly noted in Recon protocol_observations. **Rule needs explicit data-only variant** (e.g. "table.column row-shape ← sibling row-shape: column-shape ✓ · constraint ✓ · consumer-contract ✓").
- R3 at Rubric: same rule-fit issue + the sibling chosen is itself wrong (PLPS-PYMB shares the anomaly). The true working analog (CB_CMN_1) wasn't put in the literal diff line.

## Aggregate Observations

### Hook taxonomy

Total tool calls across Stages 0-3: ~80 (Stage 0: 19 · Stage 1: ~30 · Stage 2: ~21 · Stage 3: ~13).

| Judgment | Count | Notable instances |
|---|---|---|
| **silent** | ~55 | Most Read/Glob/Grep/Bash calls; clean MCP queries after schema discovery; canonical use-case |
| **helpful** | ~15 | MCP error messages naming wrong column (`urutan`, `pg.login`, `t.kod_urusan`, `t2.id`, `ind_urusan`) drove correct re-query each time — the "read the error first" CLAUDE.md §9 rule worked as designed · file-not-found redirected Glob discovery |
| **noise** | ~6 | MCP server-instruction blocks for codegraph + postgres-mlit-pg/mlkfat-pg/mlkuat-pg injected mid-tool-results despite codegraph being explicitly banned by the workflow scope · Auto Mode reminder mostly neutral · Windows bash quote-mismatch on paths with spaces |
| **interfered** | 2 | (1) RecursiveLoopDetector fired at 3 + 4 consecutive mcp postgres queries during pcp_pengguna schema-discovery — **correctly halted** low-value iteration per Momentum Circuit-Breaker, marked HYPOTHESIS rather than fabricate · (2) Output-exceeds-30k token cap on a wide LIKE blast-radius query (saved to .txt file) — forced narrower re-query (mild friction, no real loss) |

### Redundancy signals

- **BPMN file location re-resolved twice**: Stage 0 located `MLK_PLP_PRBB.bpmn20.xml` via 4 Glob/find calls (file is in etanah-knowledge worktree NOT E:\Projects\Melaka). Stage 3 re-globbed for it. Both stages independently learned the same lesson.
- **DB schema discovery for ind_tgsn / ind_ursn / pcp_pengguna columns repeated across stages**: Stage 1 hit `relation does not exist` for `ind_urusan` and learned `ind_ursn`; Stage 3 hit the same error on `t2.id` and re-discovered `ursn_id/tgsn_id` PK convention. A boot-loaded "schema cheat-sheet" (mentioned in Stage 1 protocol obs) would dedupe.
- **MCP server-instructions injected every tool boundary** even when the task explicitly bans codegraph — repeated reminder noise. Hook should suppress when scope-banned.
- **Sibling-analog "27/30 _1=Y" finding queried in Recon, RE-referenced in Rubric blast radius + sibling table + Predicate Diagram** — same data point cited 3-4 times. Not really redundancy of execution (the query ran once), but the data-point keeps surfacing — suggesting the table format could co-locate the convention-proof so it's referenced once.
- **Scout's class-chain ASCII and Recon's UI→code→table arrows partially duplicate the same chain** — Scout emits a long vertical class chain reaching down to JSF; Recon's arrows compress UI→code→DB. The redundancy is intentional per the canonical template, but a reader sees the bug-site twice in two formats.

### Friction points

- **MCP server-instruction blocks (codegraph + 3 postgres servers) inject every Bash call** despite codegraph being scope-banned. Pure noise relative to the task.
- **Pengguna_semasa column-name drift on pcp_pengguna** burned 2-4 tool calls per stage. A boot-loaded mini schema cheat-sheet (umm_aplikasi · umm_a_tgsn · pcp_pengguna key columns) would prevent this — flagged by both Stages 1 and 2.
- **R3 (sibling-diff verbatim line) doesn't fit data-only fixes**. Both Recon and Rubric emitted partial/garbled attempts and noted the rule-fit gap honestly. **Real rule refinement candidate**.
- **R1 (Rubric) is well-defined but emit is heavy**: 6 sub-rows including 5 candidate fixes + 3-row falsifier/logger spec + 3-paragraph confidence justification is dense; the haiku-audit risk increases when each row is conceptually identical (multiple "reject — masks symptom"). Candidate D/E differ only marginally — consolidating "code-layer candidates" into one row with two variants would reduce noise without losing rigor.
- **Windows bash quoting on paths with spaces** failed twice. Glob/Grep on absolute Windows paths worked flawlessly — confirms boot rule "prefer Glob over Bash on E: paths".
- **PYMBPT-RPPLP 5-langkah shape mismatch** surfaced in Rubric blast-radius but its discovery was a side-effect of the aggregate query. A first-class "structural-shape mismatch" check before blast-scope expansion would be a useful Rubric sub-step.
- **Layer hint in workflow scope is misleading** ("BPMN routing — execution-listener or gateway condition bug") vs ground truth (data in ind_langkah). Stage 0 explicitly noted that Aaron's reassignment note ("just adjust the flag in DB. in ind_langkah") trumped the layer hint. Suggests workflow weight reassignment-note signals higher.

### Refinement candidates (for Batch-3)

1. **Suppress out-of-scope MCP server-instruction injections.** When the workflow scope bans a server (e.g. codegraph), strip or lower-prio its instruction block in tool-result hooks. Reduces repeated noise on every Bash call.
2. **Boot-load a mini DB schema cheat-sheet at Stage 0 when the layer hint touches DB.** Pre-resolve column names for the canonical task-state SQL (umm_aplikasi/umm_a_tgsn/pcp_pengguna/ind_langkah/ind_tgsn/ind_ursn). Stages 1 + 2 independently flagged the same friction. A 100-line cheat-sheet load in Stage 0 prevents 4+ wasted tool calls per stage.
3. **R3 sibling-diff rule needs a data-only-fix variant.** Current verbatim shape (`file:line ← sibling file:line: attrs ✓ · listener-sig ✓ · VO-instance ✓ · lifecycle ✓`) doesn't fit DB-data UPDATE fixes. Add explicit variant: `table.column tgsn_id=X turutan=Y ← sibling tgsn_id=W turutan=Y: column-shape ✓ · constraint ✓ · consumer-contract ✓ · convention-match ✓/✗`.
4. **Weight reassignment-note hints higher than symptom-based layer guess.** Stage 0 layer hint suggested BPMN routing; Aaron's note ("adjust flag in DB, in ind_langkah") was the ground truth. Workflow stage-0 should parse the most recent reassignment journal entry for layer-pointing keywords (DB/flag/config/ind_*) and weight them above symptom pattern-matching.
5. **Pre-resolve BPMN file path at Stage 0 + cache it.** File lives in etanah-knowledge worktree NOT in E:\Projects\Melaka. Both Stages 0 and 3 burned tool calls locating it. Stage 0 should emit the resolved absolute path; later stages read from there.
6. **Add a "structural-shape match" check before blast-radius scope expansion.** PYMBPT-RPPLP's 5-langkah shape was discovered as a side-effect; making it a first-class Rubric sub-step (e.g. "all tugasan_ids in blast-radius have identical langkah_count AND identical kod sequence ✓/✗ — if ✗, exclude from blanket fix") prevents wrong scope-widening.

## Harness Health

**Verdict**: **PASS** (upgrade from Batch-1 PARTIAL).

**Reasoning vs Batch-1 PARTIAL baseline**:

| Dimension | Batch-1 (PARTIAL) | Batch-2 (this run) | Delta |
|---|---|---|---|
| R1 — Rubric 6 sub-rows | partial | **all 6 present + filled with cited evidence** (blast radius lists 12 tgsn_ids by ID; sibling table has 5 rows with file:line; read+write paths are distinct rows; 5 candidate fixes with CHOSEN; falsifier+logger has data-shape + file:line + logger string; confidence has all 3 sub-parts) | ✓ improved |
| R2 — Predicate Diagram at Recon + Rubric | not present / partial | **full 3-node ASCII flowchart at BOTH Recon AND Rubric**, with falsifier branch surfacing real risks (PLBP 2-Y-row edge case at Recon; persisted-state backfill at Rubric) | ✓ improved |
| R3 — Sibling-diff verbatim line | partial | ⚠ **emitted at both phases but garbled** — Recon prose-acknowledged the rule doesn't fit data-only fixes; Rubric attempt parentheticals jumble the shape. Rule needs data-only variant (#3 above) | ⚠ rule-fit gap, not a stage failure |
| R4 — BPMN classification | likely partial | **full array with urusan + bpmn_file_cite (clean naming convention) + kod + classification + evidence file:line** | ✓ improved |
| R5 — Composite-include fallback flag | partial | **honestly reported: ind_langkah returned useful → no xhtml-grep fallback needed; flag set false with reason** | ✓ improved |
| R6 — Honesty primitive (VERIFIED/HYPOTHESIS/SKIPPED) | partial | **explicitly labeled at each stage**: Stage 1 honesty_audit names HYPOTHETICAL + SKIPPED items; Stage 2 universal_checks_line marks `pengguna-semasa ✗ HYPOTHESIS`; Stage 3 confidence-row "why not higher" names live risks honestly | ✓ improved |
| Canonical template parts (description/table/arrows/summary) at each phase | partial | **all 4 parts present at each of Scout/Recon/Rubric**; minor format variations (Stage 2 universal_checks_line is the table-substitute for Recon — that's per the protocol "1-line ✓ checklist") | ✓ improved |
| Fabrication | n/a | **zero fabrication detected** — every file:line traced to a Read or Grep -n true; every DB result quoted from MCP returns; HYPOTHETICAL items explicitly named | ✓ clean |

The one remaining gap (R3 data-only variant) is a **rule-fit issue, not a process-failure issue** — the stage author correctly recognized the rule didn't cleanly apply and noted it honestly in protocol_observations rather than fabricating compliance. Harness signal is healthy.

