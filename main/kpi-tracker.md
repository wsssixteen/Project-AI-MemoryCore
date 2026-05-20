# KPI Tracker
*Per-ticket value capture beyond just close — what we learnt, tied to grep-able identifiers*

> Lives alongside `post-mortems.md`. Post-mortem captures CAUSE; KPI tracker captures VALUE.
> KPI target (revised 2026-05-20): **3 tickets/day**. Effort varies — quick wins (~20-45 min) balance against multi-hour tickets so the daily count holds. Pairs with `feedback_ticket_cadence.md`.
> みや uses this for upward KPI reporting + self-review.
>
> *Version: 2.0 | Last updated: 2026-05-12 (2-col scannier table format per みや audit)*

---

## Format (scannier 2-col table — refined 2026-05-12 per みや)

> **What changed (2026-05-12)**: Prose-heavy "Business logic learned" + "New skills / patterns" sections REPLACED with a single 2-column table. Column 1 = grep-able identifiers (class.method, file:line, constant names, config keys) so future-me can search the codebase fast. Column 2 = plain English what we learnt, tied to UI label / Business Logic / meta — the "explanation that completes the picture" for programmers.
>
> **Don't mix technical + high-level in one cell.** Separation is the point.

```markdown
### QA-###### — [name] — [date] — [time spent]

**Closure type**: code-fix-shipped / not-reproducible / data-fix / config-fix /
                  closed-pending-FAT / closed-pending-BA-verification / delegated

**Time spent**: [hours / days]

**What we learnt** (grep-able identifier ↔ plain English explanation):

| Identifier (searchable) | What we learnt (plain English) |
|---|---|
| `<Class.method>` @ `<file:line>` | <plain-English lesson tied to UI label / business logic / meta — no jargon> |
| `<constant name>` / `<config key>` | <plain-English lesson — what it controls + when it matters> |
| `<package path>` / `<XHTML composite>` | <plain-English lesson> |

**Extras solved beyond ticket scope** (one-liners, optional):
- [item + audit-log entry or commit ref]

**Audit-log entries spawned**: [count]
```

**Format sub-rules**:
- Table rows: as many as feel meaningful, no minimum / no maximum — but every row must be genuinely useful for future search-and-recall
- Column 1 cells: ONLY identifiers. No prose. Backtick-wrap. Include file:line where applicable.
- Column 2 cells: ONLY plain English. Tie to UI label / business logic / meta concept. Never repeat technical detail from column 1.
- Drop "Self-assessment" sub-section from old format — replaced by "Faster-finding" in post-mortem
- Drop separate "Business logic learned" / "New skills / patterns" sub-sections — both merge into the 2-col table
- "Extras solved beyond ticket scope" stays as bullets but optional — only when extras are genuinely worth surfacing

---

## Entries

### QA-250665 — PLPS-APPS "Lama tinggal di Melaka" label rename — 2026-05-06 → 2026-05-07 — ~6 hours

**Closure type**: code-fix-shipped (1-line XHTML), committed `973c44dbeb` on `mlk/qa/250665`, pushed to remote, ready for FAT retest.

**Time spent**: ~6 hours (afternoon 2026-05-06 + evening wrap)

**Extras solved beyond ticket scope**:
- Created `etanah-knowledge/melaka/FRONTEND-PATTERNS.md` (new knowledge file, JSF/composite/helper patterns, decision trees, page-trace methods)
- Documented commit-message convention for this repo (subject-only, no body, no Co-Authored-By trailer) — audit-log

**Business logic learned**:
- **JSF composite chain semantics** — JSF does NOT auto-forward attributes; every link must explicitly pass them. Helper bean is the universally-forwarded reliable reference; per-include scalars are fragile.
- **JavaBean Introspector all-caps rule** — `isPLPS()` is read as `cc.attrs.helper.PLPS` in EL because first 2+ chars are uppercase.
- **Multiple pages share `<h:form id="centerForm">`** — rendered HTML id is not page-distinguishing. Trace via `<ui:param name="mb">` bean reference.
- **Pelupusan helper has `isPLPS()` candidate space at line 8504** (next to `getShowPSBS`/`setShowPSBS`) — proper-shape getter slot for future refactor.

**New skills / patterns**:
- Helper-bean access decision tree (Pattern A/B/C)
- Debug markers in literal XHTML strings (みや's technique, captured as named pattern)
- Bottom-up + top-down page-render chain trace methods
- Git history familiar: `git log --grep="<ticket-num>"` in both repos to surface prior fix patterns

**Audit-log entries spawned**: 9
- Redmine sync MUST include ticket history (latest comments)
- Git-history familiar at Phase 0 (search ticket # in commit messages)
- Urusan-scope discipline at fix-proposal time
- scope_anchor field on active.txt — minimalist per-quest north star
- Git-history STORY format (2-part) for ticket history reports
- Test-app delivery checklist — complete info upfront
- Audit-existing-rules-before-proposing-new-ones (meta-rule)
- Quest trigger expanded — picking a number after I asked counts as a trigger
- Grep Rubric — 3-line judgment box after every investigative grep
- SHOW DON'T TELL for chain explanations (code-excerpt picture, not prose)
- Auto-trigger ask-to-commit on self-explanatory ticket
- Helper getter pattern — when to add a Java getter vs deep navigation
- Domain Expansion needs a JJK-style name + integrate as save-all alias
- Commit message convention — match repo style, no body, no trailer

**Self-assessment**: 6 hours for a 1-line fix. Most time lost to scope confusion + page-render chain assumption. The proper-shape helper-getter follow-up is logged for next session. Knowledge file (FRONTEND-PATTERNS.md) is the ticket's biggest carry-forward — directly addresses "why I missed it" pattern by making the decision tree explicit. KPI: 1 ticket closed today (250665) + 1 closed-pending-BA (259534). 2/2 hit.

---

### QA-259534 — PRBB-KKJKBB Keluasan JKKL field — 2026-05-06 — ~2 days

**Closure type**: closed-pending-BA-verification (no code fix; Alter Flowable video sent to BA/QA)

**Time spent**: ~2 days (2026-05-05 + 2026-05-06)

**Extras solved beyond ticket scope**:
- Created `etanah-knowledge/melaka/URUSAN-FLOW.md` (URUSAN_INVOLVE_JKKL_LIST + JK vs JKKT SAK group separation + naming-trap section)
- Side-bug logged: BPM prep at `MlkMuatNaikCabutanMinitForm.java:4301` checks JKKT_LULUS but stored kod is JKKL_LULUS — silent flow-routing failure (separate ticket needed; in audit-log)

**Business logic learned**:
- **JKKL flow membership** is explicit constant: only PRU, PT, PLPS, BPRZ, PPJK involve JKKL. PRBB and PRZ use JKKT family but are NOT in JKKL flow.
- **SAK group separation**: 1057 (`JNS_KEPUTUSAN_JKKT` family — PRBB radio source) vs 30959/31023 (`JNS_KPTSN_MSYRT_JK` generic JK family — JKKL workflow tugasans).
- **Java alias ≠ string value**: `PelupusanConstant.JNS_KEPUTUSAN_JKKL_LULUS` resolves to generic JK string `"JNS_KPTSN_MSYRT_JK_LLS"`. Java naming reflects original consumer, not the kod's actual scope.
- **Commit ≠ deployed-to-env**: 7-day gap between yihkit's commit (2026-04-28 08:21) and arrival on `mlk/fat-env` (2026-05-05 12:24). Always verify `git log --ancestry-path` before assuming env runs the commit.

**New skills / patterns**:
- DB query pattern for SAK group structure (et_main / et_main_uat schemas, `rjk_senarai_kumpulan` + `rjk_senarai_ahli_kumpulan`)
- `git log --ancestry-path <commit>..origin/mlk/fat-env --merges` — verify commit reach to env branches
- Alter Flowable as Phase 0 entry point for UI-symptom bugs (now hard rule: simulate first)
- Reading composite-component XHTML chains (parent → composite → form → field) for JSF binding traces

**Audit-log entries spawned**: 5
- "Simulate before code-deep-dive" (HARD RULE candidate)
- "Side-issue 2-strike rule + scope/effort assessment"
- "KPI awareness + time budget on active.txt"
- "Time-stamp every reply when みや asks"
- "Commit ≠ merged-to-FAT verification at Phase 0"
- (Plus this file itself as 6th entry)

**Self-assessment**: Long ticket due to theory churn before simulation. Strongest output was the URUSAN-FLOW.md knowledge file + the merge-timeline finding. The non-reproduction conclusion + video repro is a defensible close even though no code shipped.

---

### QA-260154 — PT PRMMKNPDT Maklumat Plot mandatori check at Seterusnya — 2026-05-08 — ~6-7 hours

**Closure type**: code-fix-shipped (4 changes across 3 files), committed `cfd76ef111` on `mlk/qa/260154`, pushed first-time to remote, ready for FAT retest.

**Time spent**: ~6-7 hours across the day (Phase 0 deep-research from prior session + Phase 1 today + Cp D iterations + extension dialogue + commit/push)

**Extras solved beyond ticket scope**:
- Coverage extended from BA's 7-field reported scope to all 10 `*` fields in the Plot popup (Jenis Pembangunan/Komponen + Tempoh Pajakan + Butiran Kegunaan added beyond the base PremiumVO check)
- Sister tugasan coverage (SRMMKNPDT, PRMMKNPTG, SRMMKNPTG, PRRMMKNPTG) gained same fix — same plot-data dependency; prevents 4 likely-future Rework tickets
- Created `Feature/Forge-Self-Improvement-System/layer-architecture.md` — L0 Continuous Improvement + 9 operational layers + reliability snapshot (per みや's mid-session ask)
- 12+ audit-log entries spawned + 2 protocol files strengthened (CLAUDE.md System-Design Discipline pre-refined, quest-protocol.md Phase 1 prepare-commit step 4 callout)

**Business logic learned**:
- **Two-gate validator pattern** in `PelupusanExcelReaderHelper.isValidPremiumVO` — outer flag (`perluKemaskiniMaklumatPlot`) + inner method gate (`TGSN_SHOW_CUKAI_PANEL` membership). Both must be addressed for validator to fire.
- **State-specific override seam** — `*PelupusanTugasanConstant` per-state subclasses override `update*Map` methods; empty stub silently disables a base-class validator path.
- **Risalat tugasan vs panel-edit tugasan** distinction — `TGSN_CHECK_MAKLUMAT_PREMIUM` (downstream consumers, e.g. PRMMKNPDT) vs `TGSN_SHOW_CUKAI_PANEL` (in-place editors). Same data, different gates.
- **Save-then-validate flow** in `BasePelupusanForm.onGoNext` — `super.onSave(false)` fires BEFORE `verifyCurrentLangkah` → confusing UX when validation fails post-save (success toast + ralat appear together).

**New skills / patterns**:
- **Recon block** as Cp C output ritual (formal verification structure refined + first real use this session)
- **Layer > Business > Code** top-down explanation discipline (UI Label names, Logic-first columns)
- **ASK-before-extending-scope** (vs ship-partial OR drop-scope-creep)
- **Direct-implement-on-simple vs audit-log-on-complex** (refined audit log usage rule)
- **Don't-dismiss-user-reports** (substitute-theory ban)

**Audit-log entries spawned**: 12+
- Trust-but-verify early-diagnostic claims (REINFORCED)
- Recon block source-verify (REINFORCED)
- ASK before extending scope when finding related issues
- Set-up-for-failure pattern banned
- POSITIVE forge — scope-awareness at fix-shape time
- UI-to-code relating discipline + UI Label names + Logic-first columns + Impact/Result rename
- Don't dismiss user's empirical reports
- Prepare-commit sequence pull-step paraphrase slip (REINFORCED — protocol callout strengthened)
- Refined audit-log rule (simple → direct-implement, complex → park)

**Self-assessment**: 6-7 hours for what should have been ~2-hour ticket. Lost time to (a) building Cp D Rubric on wrong evidence (early-diagnostic field-list accepted without source-verify), (b) discovering the second gate at :2169 only on careful method-body read, (c) over-correcting on scope-extension framing instead of using ASK rule, (d) protocol-paraphrase slips on prepare-commit. Net positive: reusable patterns named, protocol files strengthened, layer-architecture system captured. KPI: 1 fully-shipped ticket today (260154) + 1 closed-pending-verify (260154 awaiting BA FAT retest). New session-start verification ritual should claw back time on next quest.

---

### QA-259318 — PRU Template Surat Keputusan Lulus (v1 + v2) — 2026-05-04 + 2026-05-12 — ~6h (v1) + ~45min (v2)

**Closure type**: code-fix-shipped (template-binary edits, both rounds), v1 committed `3b8bbf7ff7` on `mlk/qa/259318` + 11 templates migrated to `frasa2`, v2 committed `1009782970` on `mlk/qa/259318v2` (single .docx bold-tag wrap). Both pushed.

**Time spent**: v1 ~6 hours over 2026-05-04 (initial Phase 0 + deep PDF annotation + branch confusion + JBoss cache theory before renderer-side discovery + 11 template migrations + verification). v2 ~45min on 2026-05-12 (single .docx tweak, immediate FAT test on PTMLK/01/L/PRU/2026/10 PYSK, clean commit/push/close-out).

**Extras solved beyond ticket scope**:
- v1: Spawned 7 new hard rules in `.claude/CLAUDE.md` (Word-template-first, Word XML run-join, Branch check + pull at Phase 0, PDF annotation extraction, Renderer-side overrides before cache theories, No extra code comments, Batch same-layer edits)
- v1: Migrated 11 SKL templates to `frasa2` (DB-driven, regression-proof) — prevents future MSR/slogan regressions across the family
- v1: Removed `JcEnumeration.BOTH` default at `PelupusanWordEditorUtil.java:482-487` (4 templates that explicitly want BOTH set jc=both themselves are unaffected)
- v2: Field-tested the new Notes.txt auto-log format (3-line compact: ENV — TUGASAN / ID / login)
- v2: Refined commit message convention with BA verbatim quoting + drop-redundant-with-diff rules
- v2: Dropped `addStatusFolder` Condition 2 in `quest/redmine-sync.js` (project-subfolder gate) — surfaced when this ticket's Rework status didn't get `3. Rework/` auto-created

**Business logic learned**:
- **Word .docx populator dispatch** — `PelupusanWordCCMethodConstant.java` is the truth; `.docx` is just the placeholder host. CC tag → populator handler is the canonical map. Captured in CLAUDE.md hard rule.
- **frasa2 vs frasa pattern** — `frasa2` reads slogan/text from DB-keyed table, regression-proof to file-level template diffs. `frasa` was static-string-baked, regressed easily during multi-template touches.
- **Renderer overrides** — `PelupusanWordEditorUtil.java` applies framework defaults when `.docx` properties are null (e.g., `setVal(JcEnumeration.BOTH)` when `ppr.getJc()` is null). Cache theory is plausible-but-secondary; renderer override is the real cause for "display X wrong despite verified-correct .docx".

**New skills / patterns**:
- **PDF annotation walk via `fitz`** — extract every `(highlight, comment, highlighted text)` tuple before declaring Phase 0 complete
- **Run-join Word XML grep** — `re.findall(r'<w:t[^>]*>([^<]*)</w:t>', xml)` then space-join to defeat Word's run-splitting
- **Word CC bold via `<w:rPr><w:b/></w:rPr>`** — simple terbilang phrase wrap, no Java change needed
- **Notes.txt auto-log triggered on permohonan-ID mention** — auto-search pengguna semasa via canonical task-state query, append with `N) ENV — TUGASAN / ID / login` format

**Audit-log entries spawned**: 12+ across v1 (2026-05-04) + 4 today (2026-05-12: compound trigger phrase, hands-off scope clarification, commit convention refinement, `addStatusFolder` Condition 2 drop)

**Underlying issue still open (Q3 todo)**: Redmine #252314 (MELAKA SAYANG RAKYAT slogan migration) — 11 SKL templates fully migrated to `frasa2` (v1); other ~12 non-SKL templates from #252314 scope still un-migrated and at regression risk. Mechanical migration, bundleable.

**Self-assessment**: v1 was textbook-slow (~6h for what should have been ~3h) — drivers were guess-driven Phase 0 (no PDF annot walk), JBoss cache theory before renderer grep, branch confusion. v1 spawned the corrective rules that made v2 frictionless. v2 was textbook-clean (~45min: ID lookup, .docx bold, FAT test, commit, push, verify-close all green). The rule investment in v1 paid off in v2's pace + cleanliness. KPI: 1 closed ticket today (v2), bringing the v1 family to closed status.

---

### QA-260876 — PLTP Ringkasan Risalat MMKN — 2026-05-13 — ~3h

**Closure type**: code-fix-shipped (template-only, 2 .docx files in parent+child injection pattern), committed `7fe595d75f` on `mlk/qa/260876`, pushed first-time to remote, ready for FAT retest.

**Time spent**: ~3 hours (Phase 0 Scout + Recon + Cp D Rubric + みや's iterative .docx edits in Word UI + font discovery trace into JabatanTeknikal.docx + commit/push close-out + Phase 2).

**Extras solved beyond ticket scope**:
- Parameterised the row label "YB ADUN Kawasan Durian Tunggal" → `<dun>` CC tag (now dynamically renders the actual DUN per application's data, e.g. "Asahan" for /9 land). BA had raised the question; we shipped the parameterisation.
- Identified data-side issue on standalone "Dun" field (renders HYPHEN for /9 because alppList + aptList.maklumatTambahan both lack DUN data) — flagged as `out_of_scope_held` for future ticket if BA reports.
- Verified + named the architectural pattern: external `references/` doc styling drives the injected slot (applies to future template tickets touching the Ringkasan/JKKL family).

**Business logic learned**:
- **Ringkasan Risalat MMKN** generates at *MMKNPTG / *MMKNPTGT side ONLY (NOT *MMKNPDT, despite confusingly-similar tugasan names). The *MMKNPDT side generates "Risalat MMKN PDT" — different document.
- **External-injection child doc** styling overrides parent template's font/size at the injection slot. Populator only fills VALUES via rows; styling lives with the doc that owns the CC.
- **`dun` vs `dunYB`** are independent data paths: `dun` reads `alppList` → `aptList.maklumatTambahan` (land's DUN, tied to Tanah entity); `dunYB` reads `jtList` for ADUN/DUN-flagged JT row → `agensi.alamat.bandar.nama` (YB's seat constituency, tied to Person entity).

**New skills / patterns**:
- Recon title 5-axis format (final): `QA-### • App • Env • Urusan • Tugasan • Langkah`
- Notes.txt 2-entry pattern (Entry 0 = BA-prep state, Entry 1 = sim app), abbreviated `PLP`/`AWAM`
- Refine Block standardised (Slip / Diagnosis / Fix / Pressure-test)
- Sub-check 8c (config-file tugasan-binding verification at Recon)
- Version-bump discipline at protocol refinement

**Audit-log entries spawned**: 7+
- Sub-check 8c (config tugasan-binding verify)
- Refine Block — placeholder values banned in active.txt
- Recon title format final (5-axis)
- Notes.txt format final (2-entry)
- TRG hard guardrail strengthening
- Rework re-engagement ordered-read sequence
- Notes.txt sequential per-Scout enforcement
- BA-question classification filter at Recon
- Scout/agent framing shift (raw evidence)
- Recon Universal Check 1 transitive references

**Self-assessment**: 3h for what should have been ~1.5-2h base scope. Time loss drivers: (a) Scout misread of tugasan-binding required re-verification, (b) parent-template font fix didn't take initially — discovery into JabatanTeknikal.docx was the key insight that came from みや's tracing, (c) protocol-format iterations (Recon title 3 versions, Notes.txt 2 versions) during the same cycle ate context. NET: shipped clean code-fix + 1 BA-flagged extra (dun parameterisation) + spawned 7+ rule refinements + got 2 architectural patterns named (external-injection, Ringkasan tugasan-binding) for future ticket use.

---

### QA-247710 — PRU Risalat MMKN PDT/PTG enhancement (Rework cycle 2) — 2026-05-12 — ~6h

**Closure type**: code-fix-shipped (rework)
**Time spent**: ~6h Phase 1 (across 2 days)

**What we learnt**:

| Identifier (searchable) | What we learnt (plain English) |
|---|---|
| `PelupusanWordCCMethodConstant.populatePTGParagraph_PRU` @ :15917-16175 | External-injection populator pattern — parent template hosts a slot, populator fills it with a constructed multi-CC row (10 inner CCs for PRU's Item 6) |
| `references/additionalJKKLParagraph.docx` | External child doc — font/style lives in CHILD not parent. Parent's font is overridden by child's run properties |
| `ccVO.setType(TABLE)` reset | Looks defensive, is load-bearing — never strip "defensive-looking" code without verifying call-graph |
| Page-break in `.docx` | Template-binary edit only (`<w:br w:type="page"/>`) — cannot be wired from populator |

**Extras solved beyond ticket scope**: none (strict current-cycle scope held)
**Audit-log entries spawned**: ~8

---

### QA-260965 — PLPS/PRBB No. Sijil Kerakyatan mandatori — 2026-05-14 — ~5h

**Closure type**: code-fix-shipped (state-wide Melaka gate)
**Time spent**: ~5h across two engagements (first Apply reverted, second Apply shipped after BA WhatsApp clarification + Requirement #212906/#212990 check)

**What we learnt**:

| Identifier (searchable) | What we learnt (plain English) |
|---|---|
| `PelupusanMaklumatPemohonHelper.initWarna()` @ 4274-4288 | Init method called from dialog-populate path (line 4256), NOT just event handler — fires on page load with `warna ≠ BIRU` → forces mandatori TRUE. This is the actual root-cause site, not the onChange handlers I framed it as initially |
| Requirement #220373 (commit 0d091a244c, 2025-07-15) | Introduced Taraf-based citizenship logic ALONGSIDE the existing warna-based logic. Never removed the warna path → duplication that powers the bug |
| Requirement #212990 journal 2025-07-17 (BA Anis Nabilah) | BA spec: `Warganegara=Malaysia → Taraf=Warganegara`. Polis-* warna codes don't trigger this path → wrong Taraf auto-set — separate bug captured in todo Q2 |
| `melaka ? Boolean.FALSE : Boolean.TRUE` ternary at 3 sites | Melaka state-wide gate. Mirrors AWAM's panel-hide approach for Melaka (`viewNoSijilRakyatPanel=FALSE` @ 976/2013/2132 on AWAM bean). Different mechanism, same end-state |

**Extras solved beyond ticket scope**: none (strict BA scope per Sub-check 8d; deferred refactors captured in DEFERRED-CRITICAL-ISSUES + todo Q2)
**Audit-log entries spawned**: ~12

---

### QA-262233 — PRZ Ringkasan Risalat MMKN PTG — 2026-05-20

**Closure type**: 2-file edit (parent template + external resource), committed `30d37f3b44` on `mlk/qa/262233`, pushed; verified locally on BA's permohonan + 2 sister urusans

**Time spent**: ~1 long session (batched alongside H1-H8 hook implementation + research)

**What we learnt**:

| Identifier (searchable) | What we learnt (plain English) |
|---|---|
| `TemplateRingkasanRisalatPRZ.docx` (parent) | The "Ulasan JT" block sits in document flow (between top-section and Ulasan-ADUN section). When the surrounding tables have negative `tblInd` (extending into the left margin) AND the injected JT table has different metrics, visible misalignment results |
| `JabatanTeknikal.docx` Table tagged `jtRingkasanRisalatPRZ` | External shared resource — Table #16 of 20. Sister tables for PLPS / PT use absolute `dxa` widths + fixed layout; PRZ now matches the parent's 10490 dxa + -743 indent for pixel-flush alignment |
| MS Word slow-open on baked-in malformed tables | An injected external table with mismatched width-settings (e.g. `pct` width against host page geometry, autofit layout against host's fixed parent) causes Word's table layout engine to enter expensive recalc loops on open — visible as "slow Kemaskini" until the document is regenerated under fixed-width settings |
| Binary-file conflict resolution at Phase 1 close | `git pull --ff-only` aborts on dirty binary working tree. Pattern: save my-fix to temp → reset to HEAD → pull → re-create branch from new HEAD → re-apply surgical edit |
| `populateJTRingkasanRisalatPRZ` @ PelupusanWordCCMethodConstant.java:10076 | Routes via `setExternalTableTag(ccVO.getTag())` — the populator name is per-urusan but the actual table source is the external `JabatanTeknikal.docx` looked up by CC tag |

**Extras solved beyond ticket scope**: 8 hooks delivered (rule-to-hook migration, all v1 warn-only) + auto-skill-on-mistake skill + multiple amendments (A7 file-list, A8 self-gate, A9 next-operational-step, A10 urusan-hyphen)

**Audit-log entries spawned**: auto-skill-on-mistake skill creation, skill-failure-log + per-hook .jsonl log files, A7/A8/A9/A10 amendments, Phase 2 visible step-checklist, /verify Checklist E

---

### QA-262027 — PSBS Surat Keputusan PTG kepada PDT — 2026-05-19 (reconciled 2026-05-19 evening)

**Closure type**: code-fix-shipped (5 `.docx` fixes, 0 Java — final commit `54f4b645b4`; prior `003862e9ff` superseded — see "What we learnt" row on `populateNoHakmilik`)
**Time spent**: ~1 long session (batch-retrieved with 3 sibling PSBS tickets)

**What we learnt**:

| Identifier (searchable) | What we learnt (plain English) |
|---|---|
| `TemplateSuratMaklumanPTGPSBSLulus.docx` | The real PSBS PTG-decision surat (the `Keputusan`-named sibling is dead/legacy). Config-bound template.config.json:611-666, tugasans KKMMKN/SKMMKN/PKMMKN |
| CC-tag casing | A template CC tag whose casing doesn't exactly match the Java `TAG_*` constant dispatches to NOTHING — the field stays a dead placeholder. `hasilTahunPertamawithRM` ≠ `hasilTahunPertamaWithRM` |
| `populateBandarPekanMukim` @ 4649 | Deliberately strips the word "mukim" via `replaceAll` — the template is meant to supply the "Mukim" label itself (parallel to the static "Daerah" label) |
| `populateNoHakmilik` @ PelupusanWordCCMethodConstant.java:11712 | Existing populator that already outputs `"PN <number>"` — uses `JenisHakmilik.getKod()` then number. `populateNamaJenisAndNoHakmilik` @ 11758 uses `.getNama()` (full "Pajakan Negeri"). PSBS surat originally carried the `nama`-variant tag; the fix is a CC tag swap on the template — **no new Java**. The first-pass shipped a duplicate populator (`populateSingkatanJenisAndNoHakmilik` on `003862e9ff`) before みや caught it; final = swap to `noHakmilik` |
| `PelupusanWordEditorUtil` createP / createStyledParagraph | Old auto-justify-when-jc-null bug is fixed in mlk/master — both default to `JcEnumeration.LEFT`; `JcEnumeration.BOTH` appears nowhere in pelupusan source |

**Extras solved beyond ticket scope**: none (strict BA-highlighted scope per the new ticket-cadence rule)
**Audit-log entries spawned**: `checklist` skill, `QA-NNNN.md` doc, ticket-cadence memory, Phase-1-branch-timing refine

---

### QA-262039 — PSBS Surat Keputusan Lulus kepada Pemohon — 2026-05-19 — ~1 session

**Closure type**: code-fix-shipped (template + Java), committed `9b1b9dbe1c` on `mlk/qa/262039`, pushed, tested OK on UAT — pending FAT retest.

**Time spent**: ~1 session (ticket 1 of the 4-PSBS batch closed)

**What we learnt**:

| Identifier (searchable) | What we learnt (plain English) |
|---|---|
| `kadarCukai` / `kadarCukaiPT` / `hasilTahunPertamaWithRM` (`populateKadarCukai` / `populateKadarCukaiPT` / `populateNotis5ACukaiTahunPertama` @ :6754) | Three "Hasil Tahun Pertama" tags. PSBS surat uses `hasilTahunPertamaWithRM` (reads the Notis 5A record `getHasilThnPertama()`); `kadarCukaiPT` is PT-urusan (reads the apt `getKadarCukaiTanah()` column); `kadarCukai` reads an empty dynamic field. Pick the tag by urusan + data source, not by the rendered string |
| `PelupusanUtil.captializeOnlyAllFirstLetter` @ `PelupusanUtil.java:341` | Existing title-case util — lowercases then capitalizes the first letter of every word (and after `(`). Use it; don't write a custom capitalize helper |
| `sekatanKepentingan` vs `syaratKepentingan` (`populateSekatanKepentingan` / `populateTblSyaratKepentingan2`) | PSBS surat templates use `sekatanKepentingan` (plain-TEXT populator). `syaratKepentingan` is a table-injection populator — wrong tag → CC renders its literal placeholder |
| `populateNoHakmilik` @ :11712 | Returns `jenisHakmilik.getKod() + " " + number` — the "PM"/"PN" prefix IS the title-type code, part of the hakmilik. Not a duplicate to strip |
| static "bagi setiap 100 m.p. atau sebahagian daripadanya" | The Hasil-Tahun-Pertama rate phrase = a CC tag (the RM value) + static template text. The RisalatMMKN templates are the precedent for the value-populator + static-suffix combo |

**Extras solved beyond ticket scope**:
- Hasil Tahun Pertama wiring (`kadarCukai`→`hasilTahunPertamaWithRM` + rate suffix) — not in the BA's original 12-item PDF; surfaced from みや's test + the requirement #237883 photo
- New `populateTotalNotis5APerkataanHurufPertamaBesar` populator — Title-Case amount-in-words

**Audit-log entries spawned**: `checklist` skill refinement (independent enumeration), `feedback_test_data_recency` Filter 2, todo.md utility-sweep-on-instruction entry

---

### QA-261613 — PSBS KKMMKN Tarikh Disahkan field not rendering — 2026-05-20 — ~45 min

**Closure type**: code-fix-shipped (1-line Java), committed `c7df4c24dc` on `mlk/qa/261613`, pushed, tested OK on UAT `PTMLK/03/L/PSBS/2026/6` (masirah@melaka.gov.my).

**Time spent**: ~45 min single session (Scout's diagnostic from prior retrieval session carried ~90% of the value).

**What we learnt**:

| Identifier (searchable) | What we learnt (plain English) |
|---|---|
| `MlkMuatNaikCabutanMinitForm.initView()` PSBS branch @ `:806-815` | The PSBS urusan branch in `initView()` was the only one among 11 MMKN-decision branches missing `showTarikhDisahkan = Boolean.TRUE;`. Fix is a single-line add mirroring PPJK precedent at `:865` and PRBB at `:790`. |
| `showTarikhDisahkan` field @ `:224` (`private Boolean = Boolean.FALSE`) | Bean field default FALSE — any urusan branch wanting the field visible must explicitly opt-in via `= TRUE`. ~20 `show<X>` flags in this form follow the same opt-in shape. |
| Render gate `mlkKeputusanJKKTForm.xhtml:306-307` `rendered="#{cc.attrs.showTarikhDisahkan and not cc.attrs.showTarikhDisahkanJKKL}"` | Mutual-exclusion between regular + JKKL date fields. The XOR prevents both rendering at once. PSBS does not enter the JKKL flow (line `:1123`), so flipping the main flag is safe. |
| PPTPB pattern @ `:997` (always-TRUE, no inner tugasan filter) | Use PPTPB as precedent for "whole-urusan opt-in" show flags (PSBS now follows this shape), PPJK at `:853-870` as precedent for "per-inner-tugasan" show flags. PSBS branch has no inner filter, so all PSBS tugasans reaching this form get the field. All such tugasans are MMKN-flow — appropriate scope. |

**Extras solved beyond ticket scope**: none — strict BA scope.

**Audit-log entries spawned**:
- 2 Refine Blocks at session-start (DE step-0 format · Standing-flag staleness audit)
- 2 skill-failure-log entries
- active.txt path correction (QA-260876 stale Archive path → active /45)

---

### QA-259759 — PLPS Surat Keputusan Lulus Item 3 + Item 4 ayat — 2026-05-07 (v1) / 2026-05-14 (v2) / 2026-05-20 (Phase 2) — ~6h v1 + ~30 min v2

**Closure type**: code-fix-shipped across 2 cycles (v1: template + Java populator · v2: .docx XML-only).

**Time spent**: ~6.5 hours total across v1 + v2 (v1 ~6h, v2 ~30 min).

**What we learnt**:

| Identifier (searchable) | What we learnt (plain English) |
|---|---|
| `populateThnTamatKelulusan` + `TAG_THN_TAMAT_KELULUSAN` constant @ `PelupusanWordCCMethodConstant.java` (added v1, kept untouched in v2) | New Word CC populator for the SKL termination-year placeholder. PLPS-only data path — reads tahun from `maklumatTambahan` JSON, not the typed `apl.tarikhAkhir` column (which is null for PLPS). Confirms the PLPS data-source split documented since QA-259318. |
| `TemplateSuratKeputusanLulusPLPS.docx` Item 4 ayat — `<w:b/>` inner runs + `<w:b/>` sdtEndPr | The placeholder bold-style lived in TWO XML locations: the inline runs inside the SDT (visible bold while populator value renders) AND the sdtEndPr block (style-propagation source for next-typed text). Removing only the inner runs was insufficient — sdtEndPr removal was a load-bearing precautionary edit. Save this for any "un-bold a CC placeholder" Word-XML edit. |
| Literal text around CC placeholders — e.g. `"(tahun <placeholder>"` vs `"(<placeholder>"` | The space-glyph immediately before a CC placeholder is part of the template's STATIC text — separate from the populator output. If BA wants "(tahun X)" the template must carry "(tahun " as static and the populator fills X. Don't try to inject "tahun" via the populator. |
| `frasa2` (DB-driven slogan migration from QA-259318) | The 11-SKL-template family from QA-259318 paid back here: PLPS SKL Item 3 ("SAHAJA" caps + bracket-fix) inherited the same template + verification tooling, so v1 ran ~2h faster than a cold start would have. Family-knowledge ROI is real and visible. |

**Extras solved beyond ticket scope**: none — strict PLPS-only scope across both cycles.

**Audit-log entries spawned**:
- PLPS data-source split (typed apl.tarikhAkhir null, dates in maklumatTambahan JSON) — surfaced in v1 audit-log
- Reconciliation finding: active.txt schema doesn't handle v2-layered-on-v1 cycles cleanly (duplicate `status=` lines slipped past for 6 days)

---

### QA-262370 — Semua surat - Reorganize header surat (logo Pejabat selari dengan maklumat hubungan) — 2026-05-20 — ~heavy multi-iteration session

**Closure type**: code-fix-shipped — pure `.docx` edit, 0 Java. Committed `bcdcadadb3` on `mlk/qa/262370` (etanah-pelupusan). Tested OK on UAT `PTMLK/03/L/PLTP/2026/7` (Alor Gajah pejabat 03).

**Time spent**: Heavy multi-iteration session. 5 Ruri-led attempts (Java per-pejabat dims → 4 programmatic XML variations → Java CENTER-removal → text-box framework extension) all failed; みや's single Word UI iteration with vAlign=bottom shipped clean.

**What we learnt**:

| Identifier (searchable) | What we learnt (plain English) |
|---|---|
| `HeaderSurat.docx` (shared reference doc at `src/main/resources/template/MLK/references/`) | Single source consumed by 69 surat templates via the `headerSurat1` CC tag injection. Aaron's "fix for all" is structurally true — 1 file edit propagates to every surat template. |
| **vAlign=bottom on the merged logo cell** — canonical letterhead pattern | When you want a logo to sit at the baseline of adjacent content (contact info, addresses): vMerge the logo cell across all content rows + set vAlign=bottom in tcPr. Logo image renders at the bottom of the merged cell = aligned with content baseline. **My v4 used vAlign=center which centered geometrically and didn't match visual intent.** みや's letterhead intuition caught this. |
| `populateLogoPejabatTanahImage @ PelupusanWordCCMethodConstant.java:12010-12012` | The `if (ccVO.getImageAlignment() == null) { setImageAlignment(CENTER); }` block is a forced-override pattern matching the 2026-05-04 "Renderer-side overrides before cache theories" hard rule (same shape as QA #259318's `JcEnumeration.BOTH`). Removing it would let SDT's own paragraph alignment propagate at runtime. **NOT needed for THIS fix** — みや's cell-layout achieves the visual goal regardless of the alignment override. Useful insight for future docx alignment work. |
| `PelupusanWordEditorUtil.getAllElementFromObject @ :820-836` | Framework's SDT-traversal recursion stops at any object that does NOT implement `ContentAccessor`. Text-box-wrapped SDTs (inside `<w:txbxContent>` reachable via Drawing → Anchor → Graphic → GraphicData → CTWordprocessingShape → CTTextboxInfo) are INVISIBLE. Extension would need either XPath-based traversal OR docx4j upgrade. |
| `docx4j 3.2.2` (project's Maven dep at `E:/Dev/.m2_etanah/org/docx4j/docx4j/3.2.2/`) | OLD version (~2015). Has `Drawing`, `Graphic`, `GraphicData`, `Anchor`, `Inline`, `CTTxbxContent`. MISSING: entire `org.docx4j.dml.wordprocessingShape` package — `CTWordprocessingShape` + `CTTextboxInfo` only exist in docx4j 6.x+. Any future Java that uses uncommon docx4j classes MUST be jar-tf-verified first. |

**Extras solved beyond ticket scope**: none — strict BA scope (HeaderSurat.docx only).

**Audit-log entries spawned**:
- `feedback_visual_fidelity_no_excuses.md` (NEW) — bans "I can't see"/"no visual feedback" framings
- A12 amendment — Notes.txt as Recon precondition
- A13 amendment — Renderer-override rule extended to image-positioning symptoms
- `feedback_simplify_and_reference.md` rule 5a — Word UI default for single-file structural `.docx` work
- 5 new skill-failure-log rows (Renderer-override miss + Momentum Circuit-Breaker miss + Notes.txt skip + Visual-fidelity excuse + Unverified docx4j FQN)
- todo.md Q2 — text-box SDT framework support enhancement queued with full implementation strategy (XPath via XmlUtils)

---

*Created 2026-05-06 in response to みや's KPI-tracking ask. Will capture every closed ticket going forward.*
