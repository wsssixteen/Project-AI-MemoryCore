# KPI Evidence Log

> Personal ledger of quest evidence mapped to the company's DEV team Employee Performance Review criteria (Developer column).
>
> **Purpose**: Build a real evidence base over time so that by review period, I can present concrete, ticket-backed examples for each KPI category. Not a confession log — this captures genuine strengths demonstrated, with honest framing.
>
> **Maintained**: At every Quest Phase 3 (post-mortem), tag the closed ticket against 1-3 KPI categories with a one-line evidence note.
>
> **Source**: `C:\Users\Ridhwan\Downloads\1. Improvement\DEV team - Employee Performance Review (Assessment and Criteria).xlsx`

---

## 1. Job Proficiency

### 1.1 Technical Skills (8%)
*Core/complementary technical knowledge: troubleshooting, design, solution development*

- **QA-256113** (2026-04-14) — PLPS Syarat-syarat missing on Selesai — Identified docx4j schema-validation hazard: row-level SDTs (`CTSdtRow`) accept schema-invalid `Tbl` children in-memory but JAXB silently drops them on round-trip. Root cause was in the writer (`insertContentControlTableInDocument` lines 628-631), 80 lines above the symptom.
- **FAT-OR #255637** (2026-04-11) — PPTPB Surat Jabatan Teknikal — Distinguished two separate document-generation systems: strategy-list registration vs `BasePelupusanDokumenForm`/`TemplateConfig` execution path. They are NOT connected; tracing the wrong one wastes sessions.
- **PRZ #255637** (2026-04-07) — PPTPB TemplateSurat — Caught two issues before testing: (1) `PelupusanWordStyleVO.java` has no alignment field, so justification is always controlled by the `.docx` directly, (2) correct target document is `TemplateSuratJabatanTeknikalPPTPB.docx`, confirmed via `template.config.json` line 2649.
- **PRZ #255106** (2026-04-07) — Surat Iringan Pewartaan — Cross-cutting fix across config + code: `FooterSuratWithoutSlogan.docx` reference + tugasan-specific pejabat suppression filter in `populateMaklumatPengguna()`.
- **PPJK #246512** (2026-04-07) — Risalat MMKN PDT — Enhancement with multiple components: 4 new template blocks with `jnsPemohon` + `keputusanSyor` filters, new `populateKeputusanJKKL()` method in `PelupusanExtraParamMethodConstant.java`, `showJanaButton` flag wiring in `MlkKertasTemplateForm.java`.

### 1.2 Functional Knowledge (2%)
*Knowledge about assigned modules/projects and related business processes*

- **QA-253419** (2026-04-03) — PSBS Kategori Kegunaan Tanah — Identified module ownership boundary: borang display is in `etanah-awam` (reports team, Jasper Reports), not `etanah-pelupusan`. Saved escalation time by handing over cleanly rather than investigating out-of-scope code.
- **PPJK #246512** (2026-04-07) — Understood PDT flow routing: `jnsPemohon` (individu/syarikat) × `keputusanSyor` (Lulus/Tolak) filtering logic in template config, plus Semakan & Perakuan workflow stage handling.

---

## 2. Quality of Work

### 2.1 Rework Rate (7%)
*Ticket reworks, defect feedback from PAT/FAT, accuracy of timesheet*

- **PRZ #255637** (2026-04-07) — PPTPB TemplateSurat — **Zero rework**: both issues (wrong paragraph justification + wrong target document) caught before any testing began. Would have cost a full FAT cycle if either had shipped.
- **QA-253492** (2026-04-07) — BPRZ Risalat namaPTG — **Zero rework**: single-line config fix in `excluded_content_control_list`, no recompile, no retest loop.
- **PPJK #246512** (2026-04-07) — Enhancement delivered with seniors' scope explicitly respected (PDT + Ringkasan only, PTG deferred), no over-scope rework.

### 2.2 Follow Coding Guideline / Sonar (3%)
*Coding standards, Sonar metrics, maintainability, naming, Git commits*

- *(No entries yet — pending reviewer walkthrough or explicit measurement)*

### 2.3 Planning & Scheduling (0% — N/A for Developer role)

---

## 3. Planning and Organising

### 3.1 Organizing & Prioritising (5%)
*Organized work approach, clear priorities, consistent deadline-meeting*

- **PPJK #246512** (2026-04-07) — Clean branch hygiene: code committed to `mlk/qa/246512`, scope split respected seniors' PTG deferral, FAT checklist explicitly tracked (even flagged the popup/alert check as unverified rather than silently dropping it).

---

## 4. Communication Skills

### 4.1 Timeliness of Communication (2%)
*Timely responses, proactive follow-ups on email/IM/channels*

- *(Track Redmine/Rocket.Chat response discipline — add entries as they occur)*

### 4.2 Convey Thoughts and Ideas (3%)
*Clear verbal and written communication, ideas/feedback/doubts*

- **QA-253419** (2026-04-03) — Clean handover to reports team with module ownership context explained, avoiding ambiguity about where the fix actually needed to land (etanah-awam/Jasper, not pelupusan).

---

## 5. Dependability and Reliability

### 5.1 Dependability (5%)
*Fulfills responsibilities, works without continual supervision, keeps commitments*

- **PRZ #255637** (2026-04-07) — Pre-test verification caught two issues without being asked — proactive depth of check beyond minimum requirement.

### 5.2 Consistency & Reliability (5%)
- *(Add entries demonstrating sustained output quality across multiple tickets in a period)*

---

## 6. Punctuality and Attendance (5% total)

- *(Attendance/punctuality tracked by HR — add entries only for specific recognition or perfect-attendance periods)*

---

## 7. Initiative

### 7.1 Work Independently (3%)
- **FAT-OR #255637** (2026-04-11) — Independently traced multi-session chain across `CommonPLPandBGNSuratStrategy`, `PelupusanSuratStrategy`, `MlkPelupusanPenyediaanSuratStrategy`, `@ExcludeNegeriBasedBean(MELAKA)` annotation handling — without escalation.
- **QA-256113** (2026-04-14) — Independently discovered the writer-side root cause after reader-side theories failed, by re-reading evidence from scratch rather than asking for help.

### 7.2 Seek for Improvement (1%)
*Actively improving processes, code quality, technical knowledge*

- **QA-256113** (2026-04-14) — Distilled two new debugging patterns for future tickets: *"When a parser sees wrong state, audit the writer first"* and *"docx4j object graphs are not schema-validated on marshal — row-level SDTs must only receive schema-legal children"*.
- **FAT-OR #255637** (2026-04-11) — Distilled **Zero-Change Baseline Test** pattern: before any code investigation, generate the document with zero changes to establish whether the bug is code or template/config. Added to debugging playbook.
- **PRZ #255637** (2026-04-07) — Distilled **Template Document Verification** pattern: always confirm exact `.docx` filename via `template.config.json` before editing; multiple module-specific variants can exist.
- **QA-253419** (2026-04-03) — Distilled **Module Ownership Check** pattern: for any report/display ticket, confirm module owner (awam/pelupusan/common/jasper) before diving into code.

### 7.3 Willingness to Accept Responsibility (1%)
- *(Add entries where additional scope was accepted proactively)*

---

## 8. Effectiveness and Productivity

### 8.1 Quantity of Work (6%)
*Amount of work completed within a given period; productivity level*

- **PPJK #246512** (2026-04-07) — Single ticket, multiple deliverables: 4 template config blocks + 1 Java method + 1 form logic change + template document edits. Above single-screen-per-day baseline from the sheet's guideline.

### 8.2 On Time Delivery (5%)
*Delivery within agreed timeframe*

- **QA-253492** (2026-04-07) — Closed same-day once root cause identified, no deadline slippage.
- **PRZ #255637** (2026-04-07) — Pre-test verification meant delivery timeline was not at risk from surprises.

### 8.3 Support (4%)
*Promptness and helpfulness for internal/external requests*

- *(Add entries for peer/user support beyond assigned tickets)*

### 8.4 Cooperation (3%)
*Collaboration with team members across groups*

- **PPJK #246512** (2026-04-07) — Respected seniors' scope decision (PTG deferral) without pushback or rework, kept scope boundaries explicit.

---

## 9. Teamwork — Participation (2%)

- *(Add entries for meeting/discussion contributions that led to team decisions)*

---

## Behavioural Competencies

### B.1 Continuous Learn (4%)
- *(Tracks relevant training, certs, applied learning — add as completed)*

### B.2 Coach Others (1%)
- *(Add entries where knowledge was shared with juniors or peers)*

### B.3 Adaptability (5%)
- **QA-256113** (2026-04-14) — Pivoted approach after two failed theories (clear+repopulate, missing-branches refactor) in the same session, eventually reaching correct writer-side root cause by re-reading raw evidence from scratch.

### B.4 Problem Solving (4%)
- **QA-256113** (2026-04-14) — Structured RCA eventually produced: symptom (null SDT content on Selesai) → observed state (debugger showed no child) → mechanism (JAXB drops schema-invalid children silently) → fix (enforce schema-legal child shapes in `insertContentControlTableInDocument`). Distilled into Predicate-Before-Fix + Writer-Before-Reader rules.
- **FAT-OR #255637** (2026-04-11) — Zero-Change Baseline Test pattern applied retroactively as RCA tool: the bug was in template, not code, provable by a single test with zero code changes.

### B.5 Creativity (1%)
- *(Add entries for new tools/automation/scripts/AI adoption that improved team efficiency)*

### B.6 Achievement (5%)
- **PPJK #246512** (2026-04-07) — Multi-component enhancement delivered at quality, accurate scope, respected deferrals. Represents the "complete, accurate, meets expectations" standard.

### B.7 Leadership / Decision Making / Supervising (4% combined)
- *(Add entries only if acting in SA/TL capacity)*

### B.8 Adherence to Policy (3%)
- **PPJK #246512** (2026-04-07) — Clean Git branch hygiene (`mlk/qa/246512`), scope documentation in quest state, FAT checklist transparency.

### B.9 Respects Workplace Code of Conduct (2%)
- *(Conduct/professionalism — add only for specific recognition)*

---

## Gap Analysis (as of 2026-04-15)

**Well-evidenced categories** (can present strongly):
- Technical Skills (5 entries)
- Seek for Improvement (4 distilled patterns)
- Rework Rate (3 zero-rework tickets)
- Problem Solving (2 structured RCAs)

**Under-evidenced categories** (need to build portfolio here):
- Coding Guideline / Sonar
- Timeliness of Communication
- Cooperation (needs more cross-team examples)
- Support (peer help)
- Continuous Learn (explicit training/application)
- Coach Others
- Creativity (tool/automation adoption)
- Teamwork / Participation

**Next review-period goal**: close the gaps — especially Creativity (AI tooling adoption is a natural fit), Continuous Learn, and Coach Others.

---

*KPI Evidence Log v1.0 — 2026-04-15 — back-filled from `main/post-mortems.md` entries dated 2026-04-03 through 2026-04-14*
