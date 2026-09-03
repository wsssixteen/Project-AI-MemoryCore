# Current Session

## 2026-09-03 — ES #274509 (eSOKONGAN WP Putrajaya) colleague assist + WP etanah-knowledge built (FIRST WP-scope work)

**Arc**: みや asked to help colleague Azam on ESOKONGAN #274509 (MLMS renewal — No Lesen prints `A3/2025/2`, should be `/1`; Azam patched 4× without it sticking). WP = Wilayah Persekutuan Putrajaya, a NEW scope (not Melaka). Source at `E:\Projects\KL\` (etanah-pelupusan/common/awam-spoc-hasil, package `my.gov.nre`, Oracle).

**Diagnosis (code-VERIFIED)**: doc No Lesen = base `NO_LESEN` + "/" + `vo.getKiraanPembaharuan()` (`PelupusanReportManager.java:192-227`); value = licence CUMULATIVE `KIRAAN_PEMBAHARUAN` (not per-renewal `TURUTAN`), overwritten to record-count on save (`PelupusanCommonManager.saveRekodPembaharuanMLMS():11351`), AND baked into a STORED PDF (DMS). Two renewals of one licence → first prints wrong ordinal.

**CONFIRMED (PROD)**: Azam's working patch `UPDATE ET_DMS_WPPJ.DOKUMEN_REVISION SET LOKASI_FAIL_PDF=NULL WHERE DOKUMEN_REVISION_ID=1091615` forced Borang 4Ae regen → `A3/2025/1` (screenshot `274509_PROD.png`). = my handoff's "stored PDF must regenerate". Diagnosis vindicated. Azam owns next: /2026/2.

**WP knowledge built** (`etanah-knowledge/wp/`, 7 files via mandatory 10-loop + background audit): PROJECT-LOG · MODULE-ARCHITECTURE · DOMAIN-GLOSSARY · MLMS-LESEN-RENEWAL · BUG-BESTIARY · TEST-DATA-AND-ACCESS · (inherited DATABASE.md=WP-KL). Env: Oracle end-to-end, per-territory `config\{WPKL,WPL,WPPJ}\`, NegeriConfig WP_KL/WP_PJ/WP_LB.

**WP DB access PROVEN** (corrected an earlier wrong "no access"): `python-oracledb` → `192.168.11.100:1521/etanah` as `et_main_stag` (creds `etanah_atlas\config\states.wp.json`); sees 17 WP schemas; readable copies (`ET_MAIN_WPPJ_DENDA` holds licence 1241) but bare `ET_MAIN_WPPJ` = ORA-00942. **`oracle-wp` MCP added** to `~/.claude.json` + permissions in settings.local.json — **restart to load**.

**Security finding**: FPX RSA private keys committed in git (`etanah-common\notes\sql\data-for-fpx.sql` +2) → `wp/BUG-BESTIARY.md` S1 (verified). Awaiting みや decision to escalate.

**Deliverable**: handoff `1. Tasks\Putrajaya\1. ES #274509 ...\2. Fix\Handoff ES-274509.md` (SQL corrected to real schema: tempoh links via A_LESEN_ID, no APLIKASI_ID; dates TRKH_*). Quest doc `projects\coding-projects\active\274509\QA-274509.md`.

## 2026-09-02 — Baseline 1.4.1 (Pelupusan) — COMPLETE: BAQA PASSED → Phase F merged: origin/mlk/master = fae671944b (undo tag mlk/pre-master-merge/1.4.1 @ e1712bc0e7, local). Release worktree removed. #256334 dropped by BA (not in 1.4.1). Staging capaian script (PPTnKanan PRBB, azlee/kamarolzaman) handed 2026-09-02 for #274094 retest — data, not code.

**What happened**: first 1.4.1 branch MISSED #274094 third fix fab13ed2 (deleted branch mlk/internal/274094v3, int-env only) — miya caught it in SourceTree. Per /goal: branch DELETED + rebuilt through NEW deterministic discovery: `domain/release-mlk-plp/discover.js` (ticket number → EVERY commit on any origin ref not in master; orphan tips become merge sources; POM-PIN / PATCH-EQUIVALENT surfaced+excluded) + `release-prep.js discover` / `set-tickets --from-discovery` / `add-ticket --sha` / **verify CONTENT-COVERAGE gate** (fails if any ticket-numbered commit on origin is absent from HEAD). Evals: `discover.eval.js` 27/27 (synthetic deleted-branch replay + real-repo fab13ed2) · eval.js 26/26 · eval-recon 19/19 · push-gate 12/12. Slip logged `baseline/completeness-miss`.

**Final**: 4 tickets (#274094 incl. fab13ed2 · #276465 · #277309 · #277868 via 265537v2) · common 1.3.13-MLK → 1.5.4-MLK (8a54240f13, domain 1.0.6→1.0.8 acked, stg2 V_DOMAIN 1.0.8 ✓) · pelupusan 1.4.0 → 1.4.1 (fae671944b) · local `mvn -t toolchains compile` BUILD SUCCESS online (1.5.4-MLK pulled from Nexus) · pushed via release-prep (phase=pushed, headSha fae671944b). V6b: build log checkout SHA must equal fae671944b. Sheet: Common 1.5.4-MLK · Module 1.4.1 · Branch mlk/release/1.4.1 · SQL `#277309, 277309.sql`. Phase F (merge-to-master --ba-approved) ONLY after BAQA passes. Worktree E:/Projects/Melaka/etanah-pelupusan-rel can be removed after Phase F. **Earlier state**: isolated worktree `E:/Projects/Melaka/etanah-pelupusan-rel` (his live checkout = mlk/internal/277697, 138 dirty paths, UNTOUCHED). `mlk/release/1.4.1` LOCAL, off origin/mlk/master e1712bc0e7. Discovery plan (7 sources): mlk/CR/256334 · mlk/internal/274094 · sha fab13ed2 · mlk/internal/276465 · mlk/esokongan/277309 · mlk/qa/265537 · mlk/qa/265537v2. Excluded visible: e17c497870 POM-PIN, 633f922cb2 PATCH-EQUIVALENT. phase=verified @ 69f5ec10b9 — 6 sources merged (274094 · fab13ed2 · 276465 [pom→HEAD 1.3.13-MLK per V2 nod] · 277309 · 265537 · 265537v2); #256334 DEFERRED via `drop-ticket --reason` because its branch (Aaron 6 commits 2026-09-02) conflicts with master #263302 on `mlkMaklumatUrusanForm.xhtml` (2 hunks: rendered=!isGantiHari vs mode … or isPDBB) — Aaron should reconcile with master, then `add-ticket --ticket 256334 --branch mlk/CR/256334` → merge → verify. New cmds this session: discover · set-tickets --from-discovery · add-ticket · drop-ticket; verify has CONTENT-COVERAGE gate. Evals 33/33 (discover) · 26/26 · 19/19 · 12/12.

**Open**: PROD V_DOMAIN must be 1.0.8-MLK before PROD (MCP read denied; ask Haikal/Arkan). Sheet SQL: `#277309, 277309.sql`. AWAM PLP list = khaihantan/shahrul.

## 2026-09-02 — ADHOC MCL PTMLK/03/L/MCL/2026/4 missing-permohonan = A9 silent-BPM-strand (PROD)

**Arc**: BA (PDTAG, via masirah@melaka.gov.my) — MCL permohonan not on dashboard. Traced on PROD (`etprdmlk`). Concluded = **A9 recurrence** (silent BPM-submit strand), not a new mechanism → appended as A9's first PROD instance in ADHOC-REGISTER. Diagnosis-only; awaiting Redmine ticket. No scaffold created (matched A9).

**Verified (live PROD primary, `pg_is_in_recovery=false`)**: apl **3401787**; 2 tugasan SKM + SPI both `Selesai`/`flag_aktif=N`; **NO active tugasan**; aplikasi frozen `Awalan` since 2026-07-03. Pengagihan semula SAMSIAH→MASIRAH 2026-08-04 (`umm_sejarah_pengagihan` 10351). masirah did SKM (16:19) then Semakan Permohonan → keputusan **Pembetulan** ("BORANG 12A TIDAK LENGKAP", ~16:33) → next step **SKM (Pembetulan)** (`flowables-bpmn\MLK_PLP_MCL.bpmn20.xml:705`) NEVER created → stranded → missing from every dashboard.

**Mechanism (VERIFIED source, etanah-common)**: on Hantar the engine submit fails silently ("Cannot find task" WARN, no throw) inside the puncaktanah remoting layer; `CommonBPMServiceClient.submitBpmOutcome():611/697` then calls `BpmCallbackService.handleCompletion():2726` → marks row SELESAI (`:2758`) + deletes dashboard (`:2805`), no next task. Env/module-independent (NOT AWAM→APPS-specific).

**Boundary / unknowns**: puncaktanah `FlowableService` (getBpmTask/submit) = dependency jar, not in `E:\Projects\Melaka` → exact swallow point + getBpmTask runtime-vs-history unread. Flowable `act_ru_*` NOT on etanah MCP → orphan ORIGIN unconfirmed (needs infra PROD `et_flowable17`, process `15492644`, task `20870474`).

**Confidence**: mechanism 90% · this-instance 75% · orphan-origin 35% · not-AWAM-specific 90%.

**Handed to BA** (Malay UI repro): MCL app at Semakan Permohonan → PT → Borang 12A tidak lengkap → Pembetulan → Hantar → app hilang, tiada tugasan Pembetulan. stg NOT conclusive (shared stale `et_flowable17`). Recovery = Initiate & Alter (infra/page side).

**Resume point**: awaiting Redmine ticket for the common-side swallow fix (A9's first PROD instance). No fix by us (etanah-common = handoff). Recovery = alter (infra). ⚠️ This worktree's git linkage is broken (`.git/worktrees/...` not a repo) — commits done from main repo instead; worktree needs repair/prune.
