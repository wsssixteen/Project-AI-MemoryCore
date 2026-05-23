# KPI Tracker
*Per-ticket value capture beyond just close — what we learnt, tied to grep-able identifiers*

> Lives alongside `post-mortems.md`. Post-mortem captures CAUSE; KPI tracker captures VALUE.
> KPI target (revised 2026-05-20): **3 tickets/day**. Effort varies — quick wins (~20-45 min) balance against multi-hour tickets so the daily count holds. Pairs with `feedback_ticket_cadence.md`.
> みや uses this for upward KPI reporting + self-review.
>
> *Version: 3.0 | Last updated: 2026-05-21 (Extras-only format — removed the per-ticket "what we learnt" table; KPI captures beyond-scope value only, per みや)*

---

## Format — Extras-only (refined 2026-05-21 per みや)

> **What changed (2026-05-21)**: the KPI tracker captures **EXTRA value** — what we did *beyond* the ticket's scope: improvements, going further than the minimum, out-of-scope problems solved, a deliberately longer path taken because we did more for the system. みや uses this for **upward KPI reporting** — "what extra did this dev bring".
>
> The old "What we learnt" 2-col table is **REMOVED**. That was knowledge-capture, not KPI — a "what we learnt" log on every ticket buried the actual KPI signal (the extras) and made it impossible to tell at a glance what was genuinely value-added. Knowledge belongs in `post-mortems.md` and the `etanah-knowledge/` files, never here.
>
> **Most tickets have NO extras — and that is fine.** A clean in-scope fix is a clean in-scope fix. Never invent extras; never show a table when there is nothing.

**Entry format:**

`### QA-###### — [name] — [date] — [time spent]`

**Closure type**: code-fix-shipped / not-reproducible / data-fix / config-fix / closed-pending-FAT / closed-pending-BA-verification / delegated

**Extras** — exactly ONE of:
- `None — standard in-scope close.` — when the ticket was just the fix, nothing beyond. Stop there.
- one terse bullet per genuine extra: `<what was done beyond scope> — <commit / audit-log / ticket ref>`

**Format sub-rules:**
- An **extra** = beyond-scope work / a new tool or enhancement built / an out-of-scope bug solved / a deliberately longer path taken to improve the system. A multi-pass fix to *correct a mistake* is NOT an extra. Knowledge learnt is NOT an extra.
- No extras → the single line `None — standard in-scope close.` and nothing else. No table, ever.
- Genuine extras → terse bullets only; if an extra needs explaining, the detail lives in its commit / post-mortem / audit-log — the KPI bullet just points there.
- A simple ticket gets a simple entry (3-4 lines total). Entry length scales with actual extra value, nothing else.

---

## Entries

### QA-261986 — PSBS Risalat MMKN — multi-layer template + populator fixes — 2026-05-21 → 2026-05-23 — ≈2.5 days (multi-session, includes hold)

**Closure type**: code-fix-shipped (7 files, +252/-11), committed `d2aa36240b` on `mlk/qa/261986`, pushed `-u origin`, みや tested OK on `PTMLK/02/L/PSBS/2026/1` (as `nor.aini@melaka.gov.my`, PRRMMKNPTG).

**Extras**:
- New knowledge file `etanah-knowledge/melaka/DEV-TESTING-HACKS.md` with **rahsia-gate** as first named procedure (trigger phrases, script path, restore steps, related gates) — durable cross-ticket reusable artefact
- New Java composite `populateJabatanTeknikalTablePSBS` (~90 lines) — forks PSBS-specific JT rendering off the shared `populateJabatanTeknikalTablePT` path, includes wrapper sentence `(Ruj. Surat : X bertarikh Y) Z memaklumkan bahawa K terhadap permohonan ini.` builder + JPPHM-agensi ulasan override
- New top-level SDT block `jabatanTeknikalPSBS` in `JabatanTeknikal.docx` (clone of `jabatanTeknikalPT` with underline stripped + "No.rujukan: …" paragraph replaced by `<jtAyat>` SDT)
- 4 new global populators: `populateNilaianPasaranJPPH` / `populateKadarNilaianJPPH` / `populateNilaianPasaranJPPHPerkataan` / `populatePremiumPTPerkataan` — fire wherever their CC tag appears across templates, not just this ticket's scope
- `populateMaklumatPajakanVOList` URS_PSBS branch added in `PelupusanTemplateReportMethodParameter.java` — unblocks `bakiTempohPajakan` for any future PSBS doc that consumes it
- 5 protocol/personality refines landed mid-quest, now deterministic gates: PRE-EMIT REGEX GATE (Permohonan ID), Solution Gate (diagnosis), NEVER-fingerprint (DB audit columns), Post-refactor dead-branch audit (quest-protocol.md Apply), Action-scope split for Word .docx (personality.md v1.6)
- `.bak_*` cleanup re-timing + Backup-on-mutation rule (quest-protocol.md Commit checkpoint) — codified per みや 2026-05-23 feedback
- Surgical merge tool `qa261986_block_merge.py` — pattern reusable for any future binary-file conflict between local PSBS-block edits and upstream non-PSBS work

---

### QA-250665 — PLPS-APPS "Lama tinggal di Melaka" label rename — 2026-05-06 → 2026-05-07 — ~6 hours

**Closure type**: code-fix-shipped (1-line XHTML), committed `973c44dbeb` on `mlk/qa/250665`, pushed to remote, ready for FAT retest.

**Extras**:
- Created `etanah-knowledge/melaka/FRONTEND-PATTERNS.md` — new knowledge file (JSF/composite/helper patterns, decision trees, page-trace methods)
- Documented this repo's commit-message convention (subject-only, no body, no trailer) — audit-log

---

### QA-259534 — PRBB-KKJKBB Keluasan JKKL field — 2026-05-06 — ~2 days

**Closure type**: closed-pending-BA-verification (no code fix; Alter Flowable video sent to BA/QA)

**Extras**:
- Created `etanah-knowledge/melaka/URUSAN-FLOW.md` — new knowledge file (URUSAN_INVOLVE_JKKL_LIST + JK vs JKKT SAK group separation + naming-trap section)
- Side-bug surfaced + flagged: BPM prep at `MlkMuatNaikCabutanMinitForm.java:4301` checks JKKT_LULUS but stored kod is JKKL_LULUS — silent flow-routing failure (separate ticket; audit-log)

---

### QA-260154 — PT PRMMKNPDT Maklumat Plot mandatori check at Seterusnya — 2026-05-08 — ~6-7 hours

**Closure type**: code-fix-shipped (4 changes across 3 files), committed `cfd76ef111` on `mlk/qa/260154`, pushed first-time to remote, ready for FAT retest.

**Extras**:
- Coverage extended beyond BA's 7-field scope to all 10 `*` fields in the Plot popup (Jenis Pembangunan/Komponen + Tempoh Pajakan + Butiran Kegunaan) — commit `cfd76ef111`
- Sister tugasan coverage (SRMMKNPDT, PRMMKNPTG, SRMMKNPTG, PRRMMKNPTG) gained the same fix — prevents 4 likely-future Rework tickets — commit `cfd76ef111`
- Created `Feature/Forge-Self-Improvement-System/layer-architecture.md` — new file (L0 Continuous Improvement + 9 operational layers + reliability snapshot)

---

### QA-259318 — PRU Template Surat Keputusan Lulus (v1 + v2) — 2026-05-04 + 2026-05-12 — ~6h (v1) + ~45min (v2)

**Closure type**: code-fix-shipped (template-binary edits, both rounds), v1 committed `3b8bbf7ff7` on `mlk/qa/259318` + 11 templates migrated to `frasa2`, v2 committed `1009782970` on `mlk/qa/259318v2` (single .docx bold-tag wrap). Both pushed.

**Extras**:
- Migrated 11 SKL templates to `frasa2` (DB-driven, regression-proof) — beyond the ticket's single-template ask; prevents future MSR/slogan regressions across the family — commit `3b8bbf7ff7`
- Removed `JcEnumeration.BOTH` default at `PelupusanWordEditorUtil.java:482-487` — fixes the renderer-override root cause beyond the reported template — commit `3b8bbf7ff7`
- Dropped `addStatusFolder` Condition 2 in `quest/redmine-sync.js` — tooling fix surfaced during the ticket — audit-log

---

### QA-260876 — PLTP Ringkasan Risalat MMKN — 2026-05-13 — ~3h

**Closure type**: code-fix-shipped (template-only, 2 .docx files in parent+child injection pattern), committed `7fe595d75f` on `mlk/qa/260876`, pushed first-time to remote, ready for FAT retest.

**Extras**:
- Parameterised the row label "YB ADUN Kawasan Durian Tunggal" → `<dun>` CC tag (dynamic per-application DUN render) — enhancement beyond the reported fix — commit `7fe595d75f`
- Surfaced + flagged a data-side issue on the standalone "Dun" field (renders HYPHEN for /9 land — missing DUN data) — held `out_of_scope_held` for future ticket

---

### QA-247710 — PRU Risalat MMKN PDT/PTG enhancement (Rework cycle 2) — 2026-05-12 — ~6h

**Closure type**: code-fix-shipped (rework)

**Extras**: None — standard in-scope close.

---

### QA-260965 — PLPS/PRBB No. Sijil Kerakyatan mandatori — 2026-05-14 — ~5h

**Closure type**: code-fix-shipped (state-wide Melaka gate)

**Extras**: None — standard in-scope close.

---

### QA-262233 — PRZ Ringkasan Risalat MMKN PTG — 2026-05-20

**Closure type**: 2-file edit (parent template + external resource), committed `30d37f3b44` on `mlk/qa/262233`, pushed; verified locally on BA's permohonan + 2 sister urusans

**Extras**:
- Delivered 8 hooks (rule-to-hook migration, all v1 warn-only) — audit-log
- Created the `auto-skill-on-mistake` skill — audit-log
- Shipped A7/A8/A9/A10 CLAUDE.md amendments (file-list, self-gate, next-operational-step, urusan-hyphen) — audit-log

---

### QA-262027 — PSBS Surat Keputusan PTG kepada PDT — 2026-05-19 (reconciled 2026-05-19 evening)

**Closure type**: code-fix-shipped (5 `.docx` fixes, 0 Java — final commit `54f4b645b4`; prior `003862e9ff` superseded)

**Extras**: None — standard in-scope close.

---

### QA-262039 — PSBS Surat Keputusan Lulus kepada Pemohon — 2026-05-19 — ~1 session

**Closure type**: code-fix-shipped (template + Java), committed `9b1b9dbe1c` on `mlk/qa/262039`, pushed, tested OK on UAT — pending FAT retest.

**Extras**:
- Hasil Tahun Pertama wiring (`kadarCukai`→`hasilTahunPertamaWithRM` + rate suffix) — beyond the BA's original 12-item PDF — commit `9b1b9dbe1c`
- New `populateTotalNotis5APerkataanHurufPertamaBesar` populator (Title-Case amount-in-words) — commit `9b1b9dbe1c`

---

### QA-261613 — PSBS KKMMKN Tarikh Disahkan field not rendering — 2026-05-20 — ~45 min

**Closure type**: code-fix-shipped (1-line Java), committed `c7df4c24dc` on `mlk/qa/261613`, pushed, tested OK on UAT `PTMLK/03/L/PSBS/2026/6` (masirah@melaka.gov.my).

**Extras**: None — standard in-scope close.

---

### QA-259759 — PLPS Surat Keputusan Lulus Item 3 + Item 4 ayat — 2026-05-07 (v1) / 2026-05-14 (v2) / 2026-05-20 (Phase 2) — ~6h v1 + ~30 min v2

**Closure type**: code-fix-shipped across 2 cycles (v1: template + Java populator · v2: .docx XML-only).

**Extras**: None — standard in-scope close.

---

### QA-262370 — Semua surat - Reorganize header surat (logo Pejabat selari dengan maklumat hubungan) — 2026-05-20 → 2026-05-21 — heavy multi-iteration

**Closure type**: code-fix-shipped — v5 text-box SDT framework + text-box HeaderSurat.docx, committed `6b1459a0eb` on `mlk/qa/262370` (supersedes the earlier `bcdcadadb3` vAlign-only approach).

**Extras**:
- Text-box SDT framework support — extended `PelupusanWordEditorUtil.getAllElementFromObject` so Content Controls nested inside Word text boxes become findable/populatable (a `TraversalUtil` sub-walk into Drawing/Pict structures). A reusable framework enhancement well beyond the header-layout ticket — commit `6b1459a0eb`

---

### QA-262004 — PSBS Ringkasan Risalat MMKN, maklumat tidak ditarik — 2026-05-21 — ~3h

**Closure type**: code-fix-shipped (template `.docx` + 3 Java populators), committed `1c1e900094` on `mlk/qa/262004`, pushed, local test confirmed.

**Extras**:
- BPRZ duplicate-separator-line surfaced + flagged on `TemplateSuratMaklumanKepadaPemohonBPRZ.docx` — out-of-scope bug; separate ticket needed

---

### QA-259339 — PRU Kertas Pertimbangan signature alignment — 2026-05-21 — ~1h

**Closure type**: code-fix-shipped (`.docx` template only), committed `a01ed525ac` on `mlk/qa/259339`, pushed, local test confirmed.

**Extras**: None — standard in-scope close.

---

*Created 2026-05-06 in response to みや's KPI-tracking ask. Will capture every closed ticket going forward.*
