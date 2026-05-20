# Post-Mortem Log

> Reflection entries after each completed quest.
> Goal: extract the META layer — process notes, contributing factors, carry-forward todos.
> Written at Quest Phase 2 (auto-triggered after commit verify per quest-protocol).
> Linked from project file.
>
> *Version: 2.0 | Last updated: 2026-05-12 (slimmed to META-only per みや audit)*

---

## Format (slimmed 2026-05-12 — META-only)

> **What changed (2026-05-12)**: Root Cause Type / Root Cause Summary / Pattern Match / Codebase Knowledge Updated sections REMOVED — they duplicated Phase 1 scout/recon/Fix Walkthrough content. The unique value of post-mortem is the META layer that needs the full quest arc to make sense.

```markdown
### QA-###### — [Short name] — [date]

**Faster-finding** (1-2 lines — what would have made this quest faster + the action applied):
Faster: [one-line observation]. Action applied: [concrete edit to skill/protocol/memory/knowledge — file:line or commit-sha].

**Contributing Factors** (replaces single-root-cause framing when ≥2 conditions converged; use single-cause framing only when truly single):
- [Factor 1 with file:line evidence]
- [Factor 2 with file:line evidence]
- [Factor 3 with file:line evidence]
(For single-cause bugs: one line stating the root cause + file:line.)

**Process Notes** (anything about how we worked — what slowed us down, what helped, slips on existing rules):
[Free-form bullets]

**Carry Forward** (1-3 follow-up todos with home — Q1/Q2/Q3 todo, audit log, knowledge file update, etc.):
- [Todo 1 + canonical home]
- [Todo 2 + canonical home]
```

**Format sub-rules**:
- File:line citations in Contributing Factors are mandatory (matches Recon discipline)
- Faster-finding action MUST be a concrete artifact (per CLAUDE.md "Mistake → action, not words" rule); "noted for next time" is unacceptable
- Carry Forward items get their canonical home (todo.md quadrant / audit-log / specific knowledge file / etc.) — items without a home tend to drift
- Knowledge-file updates that happened DURING the quest live in those files (with their own `version` bump) — DO NOT re-list them here

---

## Entries

### QA-257569 — PT KKMMKN Tujuan Permohonan wrong dropdown (Rework) — 2026-04-24

**Root Cause Type**: data + code

**Root Cause Summary**:
FAT's `PLP_TJN_PMH_PT` group had stale billing-period data; `PelupusanExcelReaderHelper` URS_PT branch loaded it directly into `tujuanPermohonanSelectItems` (line 1082). Code fix wires the variable to KAT_TNH (filtered), which is correct on both FAT and UAT. UAT's `PLP_TJN_PMH_PT` was already correct — the issue was FAT-specific data divergence.

**What Would Have Been Faster**:
Query `PLP_TJN_PMH_PT` on BOTH environments at Phase 0 — the environment comparison would have immediately shown FAT data as the root cause and avoided multiple rounds of code/data analysis.

**Pattern Match**:
- New pattern: environment-specific reference data divergence — same group code, different data between FAT and UAT. Check group contents on both envs before assuming same state.

**Codebase Knowledge Updated**:
- `KAT_TNH` blast radius documented: loaded by etanah-awam `PelupusanUrusanTabForm`, `PelupusanTanahTabForm`, `PembangunanHelperForm`, `PembangunanService` — any patch to this group affects applicant-facing forms across Pelupusan and Pembangunan modules
- `tujuanPermohonanPTSelectItems` is NOT dead code — bound in `mlkMaklumatTanahV3.xhtml` for non-PT MLK forms

**Process Notes**:
- Ruri analyzed code blast radius (XHTML bindings) without checking DB group consumers across modules — missed awam impact until explicitly asked. → `/appraise` skill v1.1 updated with explicit DB blast radius checklist.
- Ruri failed to establish FAT vs UAT data state before doing code analysis — led to incorrect "DB patch is the complete fix" conclusion.
- みや's simulation (remove code fix on UAT, test) was the key unlock — UAT still worked, proving UAT data was already correct.
- みや called out the scope gap directly: "do you even understand the ticket before checking these?" — correct. Investigation must re-establish environment + data state before any code analysis.

**Carry Forward**:
- For reference data tickets: query the group on BOTH FAT and UAT at Phase 0 — never assume same state across environments.
- `/appraise` Axis 2 Q5 now explicitly requires DB group consumer grep + cross-module check (awam vs pelupusan) for any data-layer change.

---

### QA-250665 — PLPS-APPS label rename "Tempoh tinggal di Melaka" → "Lama tinggal di Melaka" — 2026-05-06 (committed) / 2026-05-07 (Phase 2 reflect)

**Root Cause Type**: code (1-line XHTML predicate change)

**Root Cause Summary**:
`mlkMaklumatPemilikAsalForm.xhtml:979` — keluasan/tinggal label ternary had only PSBS branch; PLPS fell into default "Tempoh tinggal di Melaka" or PSBS's "Lama tinggal di Mukim" depending on flag. Added a positive PLPS guard reading from helper bean (`cc.attrs.helper.aplikasiPelupusan.urusan.kod eq 'PLPS'`). PSBS + all other urusans untouched. Mirrors AWAM-side fix shipped 2026-03 by adhwa+chanjun (their helper-default approach, distinct from our XHTML-ternary approach).

**What Would Have Been Faster**:
**Page-render chain trace before fix proposal.** Three rounds of fix-shape (cc.attrs scalar → page-forward patch → helper deep-nav) all because the actual rendering page wasn't verified — I assumed `MlkMaklumatPemohonForm.xhtml` from filename semantics, then `MlkMaklumatPerserahanForm.xhtml` from a guess. Neither reliably handled SKM tugasan. The robust path was reading helper state, which works regardless of which page renders. Decision tree captured in new `etanah-knowledge/melaka/FRONTEND-PATTERNS.md`.

**Pattern Match**:
- New pattern: **helper bean access > deep navigation > per-include scalar** for state checks. Captured in FRONTEND-PATTERNS.md decision tree.
- New pattern: **JavaBean Introspector all-caps rule** — `isPLPS()` is read as `cc.attrs.helper.PLPS` in EL (kept all-caps because first 2+ chars are uppercase). Captured.
- New pattern: **`<h:form id="centerForm">` is shared across many pages** — rendered HTML id alone doesn't pin which XHTML produced output. Use `<ui:param name="mb">` reference at page top. Captured.
- New pattern: **debug markers in literal strings** (みや's "ya/no/asdasd" technique) — fast confirmation that a branch fired AND deploy is live. Captured.

**Codebase Knowledge Updated**:
- Created `etanah-knowledge/melaka/FRONTEND-PATTERNS.md` (new file, framework-skeleton with SCOPE/NOT FOR). 7 sections: Pattern A/B/C, decision tree, chain forwarding, EL property naming, page-trace methods, debug technique, lessons from this ticket.
- `URUSAN-FLOW.md` cross-referenced (URUSAN_INVOLVE_JKKL_LIST relevant to PLPS context).

**Process Notes**:
- ~6 hours spent on a 1-line fix. Drivers: (a) initial scope confusion (BA brief said AWAM/APPS, didn't read latest Redmine comment which flipped scope to APPS-only = pelupusan-side), (b) page-render chain assumption from filename, (c) two failed deploy/test cycles before landing on helper deep-nav.
- Multiple slips on existing rules (inventory-first Phase 0, scope discipline, page-render chain trace). All logged to improvement-audit-log.md as pending-review entries.
- Helper-getter (`isPLPS()`) attempted post-fix but **untested at runtime**, reverted to keep ship-state clean. Logged as code-quality follow-up.

**Carry Forward**:
1. **Phase 0 page-render chain trace mandatory before fix proposal** — captured in FRONTEND-PATTERNS.md.
2. **Add helper-getter `isPLPS()` properly + verify EL access** — pick up next time we touch this helper or have a fresh deploy cycle (e.g. QA #259759 tomorrow).
3. **Read full Redmine ticket history**, not just initial Description.txt — captured as redmine-sync.js follow-up.
4. **Commit message convention** — subject-only, no body, no Co-Authored-By trailer in this repo.
5. **Multiple slips on existing rules signal "I'm not running existing infrastructure"** — meta-pattern, captured as audit-existing-before-proposing rule.

---

### QA-259534 — PRBB-KKJKBB Keluasan JKKL field — 2026-05-06

**Root Cause Type**: not-reproduced (closed pending BA verification — no code fix shipped)

**Root Cause Summary**:
QA captured the bug on FAT 2026-04-28 09:10. yihkit's commit b458041 ("fix 2 CR JKKL", same day 08:21) did NOT reach `mlk/fat-env` until 2026-05-05 12:24 (7-day gap, verified via `git log --ancestry-path b458041..origin/mlk/fat-env --merges`). So QA's screenshot was from PRE-yihkit code. Empirical re-test on 2026-05-06 — /20 altered PYSK→KKJKBB + Lulus + save — did not reproduce the field showing despite stored kod=`JNS_KPTSN_MSYRT_JK_LLS`. Static analysis cannot pinpoint the firing path. Video evidence of non-reproduction sent to BA/QA via Redmine.

**What Would Have Been Faster**:
**Simulate first.** ~2 days of code/git analysis and theory churn before testing. The Alter Flowable repro on /20 (PYSK→KKJKBB + Lulus + save) took minutes once attempted and would have set the boundary on the entire investigation immediately. → New audit-log entry "Simulate before code-deep-dive".

**Pattern Match**:
- New pattern: **commit ≠ merged-to-FAT**. Always check `git log --ancestry-path <commit>..origin/mlk/fat-env --merges` before assuming a commit's behavior is what FAT is running. Captured in audit-log.
- New pattern: **graceful degradation on data/code mismatch**. /20's stored JK-family SAK + current JKKT-only populator → JSF can't restore selection cleanly → bug shape no longer presents. Worth carrying as: stored data + current populator mismatch can hide bugs that real users still hit.
- New pattern: **Java alias ≠ string value**. `PelupusanConstant.JNS_KEPUTUSAN_JKKL_LULUS = "JNS_KPTSN_MSYRT_JK_LLS"`. Java says JKKL; string is generic JK. Always check resolved string before reasoning.

**Codebase Knowledge Updated**:
- Created `etanah-knowledge/melaka/URUSAN-FLOW.md` — URUSAN_INVOLVE_JKKL_LIST (PRU, PT, PLPS, BPRZ, PPJK), JK vs JKKT SAK group separation (UAT 30959 / FAT 31023 vs 1057), naming-trap section
- PelupusanService.populateKeputusanSelectItem urusan→radio-items mapping understood (PRBB falls to else → JKKT items only)

**Process Notes**:
- Three back-and-forth swings on conclusions in same session: "no fix needed" → "Option E needed" → "no fix needed". Cause: prematurely committing to static-analysis conclusions before empirical test. → Becomes hard rule: simulate before code-deep-dive.
- ASCII diagrams + file:line citations worked well for keeping みや oriented during code walkthroughs.
- yihkit's intel (4 references in one paste) saved hours of git hunting — collegial collaboration is a force-multiplier.
- DB MCP usage authorized + worked smoothly; verified group structures across UAT and FAT.

**Carry Forward**:
1. **Simulate before code-deep-dive** — Phase 0 first action for any UI-symptom ticket is Alter Flowable + repro attempt.
2. **Verify deployment timeline** — at Phase 0, check whether the suspected commit is actually on the env's branch.
3. **Side-issue 2-strike rule** — drop side-investigations after 2 failed test attempts during main-issue testing.
4. **Time budget on active.txt** — KPI 2 tickets/day × 4-6h. Track elapsed at phase transitions.

---

### FAT-OR-255106 — Surat Iringan missing ID Permohonan on page 2 — 2026-04-17

**Root Cause Type**: config (Word template)

**Root Cause Summary**:
`TemplateSuratIringanKepadaPewartaan.docx` second page header did not include the ID Permohonan field. Field was present in the body but missing from the page 2 header section, so it disappeared after the first page break.

**What Would Have Been Faster**:
N/A — fix was straightforward template edit. みや identified and applied directly.

**Pattern Match**:
- No pattern match — template-only fix

**Codebase Knowledge Updated**:
- None

**Process Notes**:
Quick rework ticket. みや updated the docx, tested on UAT, confirmed pass in one round.

**Carry Forward**:
- For Word template fixes: always check both body AND header/footer sections for the missing field — headers are separate from body content in docx.

---

### UAT-CR-239225 — PPJK Kawasan Pajakan disabled fields — 2026-04-17

**Root Cause Type**: code

**Root Cause Summary**:
`luasTanah2` and `unitLuasTanah2` disabled condition used `.nama eq 'keseluruhan'` (case-unknown DB label) instead of `.kod`. Secondary: `onChangeKeluasanTanah()` had a redundant `getLuasRizab() != null` in the outer condition, blocking the null-clear path for new records. `ui-state-error` persisted on the disabled field due to JSF view state preserving the invalid component state.

**What Would Have Been Faster**:
The Java listener `onChangeKeluasanTanah()` already used `.getKod()` for the same check — checking it first would have resolved the `.kod vs .nama` question immediately without needing DB confirmation.

**Pattern Match**:
- Confirmed: **SenaraiAhliKumpulan comparisons always use `.kod`** — `.nama` is display label only, unreliable for logic. All Java-side checks use `.getKod()`.
- Note: JSF EL cannot reference Java constants — always grep the constant → copy literal string into EL.

**Codebase Knowledge Updated**:
- `JSF-WIRING.md` — Java constant → EL literal pattern confirmed

**Process Notes**:
Multiple secondary bugs discovered during testing (stale value on new record, red field on disabled input). Server-side `PrimeFaces.current().executeScript()` proved more reliable than XHTML `oncomplete` for clearing UI state after panel re-render.

**Carry Forward**:
1. For any `SenaraiAhliKumpulan` disabled condition: check the Java listener for the same field first — it will show the correct `.kod` value.
2. When a compound `if` condition is refactored into nested `if/else`, verify the outer condition doesn't repeat inner guards.

---

### QA-256875 — PRBB Bayaran Pelbagai not showing / Flowable stuck at 47.0 — 2026-04-21

**Root Cause Type**: process (external module — etanah-spoc-hasil)

**Root Cause Summary**:
Payment display not showing is **by design** — hidden when `flag_bayar = 'Y'`. The actual issue was Flowable stuck at task 47.0 (Bayaran Pelbagai) because `etanah-spoc-hasil` (Spoc module) did not call `taskService.complete()` to advance to 48.0. No code change required on our side. Ticket passed to Spoc team.

**What Would Have Been Faster**:
Querying `umm_a_tgsn.flag_aktif` for the specific permohonan early would have confirmed the stuck Flowable task immediately, without needing to trace the full callback chain first.

**Pattern Match**:

- New: **Payment display hidden by design** — when `flag_bayar = 'Y'`, payment section is intentionally hidden. Don't treat missing UI as bug without checking the flag first.
- New: **Flowable completion belongs to Spoc (`etanah-spoc-hasil`)** — `taskService.complete()` is not called anywhere in etanah-pelupusan or etanah-common. If a task is stuck in `ACT_RU_TASK`, the issue is always external (Spoc side).
- New: **Flowable callback chain** — Spoc → `taskService.complete(taskId)` → Flowable → `GET /flowable/user?taskCode&taskId` → `FlowableController.java:22` → `FlowableTaskListener.receiveUserTask()` → next task assigned.

**Codebase Knowledge Updated**:

- `et_flowable17` is a **schema name** (not DB name) — query as `et_flowable17.act_hi_taskinst` (history) or `et_flowable17.act_ru_task` (active tasks). `act_ru_task` requires schema prefix; bare name fails with relation does not exist.
- `umm_a_tgsn` = AppTugasan table. Key columns: `id_bpm_task` (Flowable task FK), `flag_aktif` (Y=pending/N=done), `status_tugasan` (SELESAI=done). Source: `et_main.sql:39595`.

**Process Notes**:

Made unverified claims about table names and Spoc code without citing sources — required みや's correction. `et_main.sql` was in the context pipeline the whole time and had the table definitions; should have queried it first.
→ forge-log: evidence-discipline failure — claimed table behavior before running a single query against the available schema file.

**Carry Forward**:

1. For any "data not showing" ticket: query `umm_a_tgsn.flag_aktif` first — a stuck Flowable task is invisible in UI but obvious in the table.
2. Flowable schema = `et_flowable17`. Always prefix: `et_flowable17.act_hi_taskinst` / `et_flowable17.act_ru_task`.

---

### QA-256391 — PRBB Tanggungan row showing — 2026-04-17

**Root Cause Type**: code

**Root Cause Summary**:
`PelupusanMaklumatPemohonHelper.java` case 2 (Individu) sets `viewTanggungan = TRUE` at line 808 for general PRBB. The Melaka-specific `if (melaka)` override block was missing `viewTanggungan = FALSE`. `viewMaklumatTanggungan` was already FALSE (pre-existing). The absent `viewTanggungan = FALSE` left the general TRUE value (line 808) effective for Melaka PRBB.

**What Would Have Been Faster**:
みや found the fix directly in the Java helper. I initially pointed at the XHTML composite layer (`c:if test="#{!isPLTP}"`), which was the wrong layer — the control flag lives in the bean, not the view.

**Pattern Match**:
- Confirmed: **view flag controlled in bean helper, not XHTML** — when a field shows/hides unexpectedly, check the `view*` / `mandatory*` flags in the Helper class before touching the XHTML condition.

**Codebase Knowledge Updated**:
- None (ticket too narrow to warrant a new knowledge file entry)

**Process Notes**:
Rework ticket with one minor item remaining. Quest Phase 0 was skipped — I jumped to code investigation without asking for Task folder path first. Also required みや's correction to identify the right file (Java helper vs XHTML composite).

**Carry Forward**:
1. Even for "minor fix left" rework tickets, Phase 0 still applies — ask for Task folder first.
2. For show/hide field bugs: check `view*` flags in the Helper bean before the XHTML condition.

---

### QA-256113 — PLPS Syarat-syarat missing on Selesai — 2026-04-14

**Root Cause Type**: code (schema-invalid marshaling)

**Root Cause Summary**:
`PelupusanWordEditorUtil.insertContentControlTableInDocument` (lines 628-631) unconditionally inserts a rebuilt `Tbl` into any SDT's `sdtContent`. For row-level SDTs (`CTSdtRow`), the OOXML schema `CTSdtContentRow` only allows `Tr` children, not `Tbl`. docx4j's in-memory list accepts the shape, marshals schema-invalid XML on pass 1 save, and JAXB silently drops the mismatched child on pass 2 unmarshal — leaving the SDT's content null and the Selesai-pass populate unable to find a table template.

**What Would Have Been Faster**:
Check the writer, not just the reader. When pass 2's reader (`findTableByContentControlTag`) sees wrong/missing state, the first question is "what did pass 1's writer put in the file?" — not "why can't the reader parse it?". The fix was 80 lines above the symptom in the same file, same function.

**Pattern Match**:
- New pattern to add: **"When a parser sees wrong state, audit the writer first."**
- New pattern to add: **"docx4j object graphs are not schema-validated on marshal — row-level/cell-level SDTs must only receive schema-legal children."**

**Codebase Knowledge Updated**:
- Pending (after test confirms): `etanah-knowledge/` entry on SDT hierarchy (SdtBlock/SdtRun/CTSdtRow/CTSdtCell) and the marshal-vs-validate hazard.

**Process Notes**:
Two wrong fixes in one day on the same ticket. Both built on the same failure mode: **symptom → plausible story → fix**, skipping **symptom → observed state → mechanism**. Failure 1 (clear+repopulate theory) assumed execution reached line 583 without checking — the function actually bailed at line 544. Failure 2 (missing-branches refactor) assumed pass 2 had a differently-shaped child — debugger actually showed no child at all. In both cases, evidence that would have killed the theory was available in under a minute of re-reading, but I asked for a test-rebuild cycle instead. User paid for my laziness with a full day.

**Carry Forward**:
1. **Predicate-before-fix rule**: before proposing code, state "This fix works iff *X* holds, and *X* holds because file:line shows *Y*." If that sentence can't be written, the fix isn't ready.
2. **Writer-before-reader rule**: when a parser fails, read the code that produced the input bytes before touching the parser.
3. **One failed theory → full reset**: after a wrong fix, re-read raw evidence from scratch. Do not build on the discovery that led to the wrong fix — momentum is a failure mode.
4. **No test request without a line-cited predicate**: user's rebuild/redeploy/restart cycle is expensive. My code re-read is free. I owe the re-read first.

---

### QA-253419 — PSBS Kategori Kegunaan Tanah — 2026-04-03

**Root Cause Type**: process

**Root Cause Summary**:
The borang display is in `etanah-awam`, not `etanah-pelupusan`. For Melaka, report/template changes go to the reports team (Jasper Reports), not the pelupusan dev team. Ticket was investigated and then handed over.

**What Would Have Been Faster**:
Ask upfront which module owns the display — etanah-awam vs etanah-pelupusan — before diving into code. Report-related tickets especially need this check.

**Pattern Match**:
- New pattern added: **Module Ownership Check** — before any report/display ticket, confirm which module (awam/pelupusan/common) owns the output

**Codebase Knowledge Updated**:
- `MODULE-ARCHITECTURE.md` — added Related Modules section (etanah-awam) + Reports Team Workflow section

**Process Notes**:
- PSBS does not use kegunaan tanah by design — DB schema gap is intentional
- Fix was applied in pelupusan (`populateKegunaan()`) but the actual visible fix is in awam/Jasper
- Reports team uses Jasper Reports — リドワンさん has not done Jasper yet

**Carry Forward**:
1. For any ticket with "borang" or "report" display issue → check module ownership first (awam? common? jasper?)
2. Melaka reports = reports team's domain. Ping them early, don't investigate deep first.

---

### QA-253492 — BPRZ Risalat namaPTG — 2026-04-07

**Root Cause Type**: config

**Root Cause Summary**:
`excluded_content_control_list` for `STATUS_PENYEDIAAN_PERAKU` in the BPRZ block of `template.config.json` was empty. Template engine renders any tag not in the exclusion list, so `namaPTG` kept appearing after Peraku stage.

**What Would Have Been Faster**:
Check `excluded_content_control_list` in `template.config.json` first whenever a field appears/disappears unexpectedly based on workflow status. The pattern is always there.

**Pattern Match**:
- Existing pattern confirmed: **Pattern 002** in DEBUGGING-PLAYBOOK.md (config exclusion list)

**Codebase Knowledge Updated**:
- None new — pattern already documented

**Process Notes**:
- No recompile needed — JSON config change only
- Fix report already generated: `QA253492_Fix_Report.docx`

**Carry Forward**:
1. For "field showing when it shouldn't" bugs → check `excluded_content_control_list` before anything else
2. Redmine + GSheet update is a manual step — do it immediately when closing, not deferred

---

### PPJK #246512 — Risalat MMKN PDT (Syor Permohonan + templates) — 2026-04-07

**Root Cause Type**: code + config (enhancement)

**Root Cause Summary**:
Enhancement to add Syor Permohonan (Lulus/Tolak) to PPJK Risalat MMKN templates for PDT flow. Required 4 new template blocks in `template.config.json` (Lulus/Tolak individu + syarikat, Ringkasan with/without JKKL), new `populateKeputusanJKKL()` method in `PelupusanExtraParamMethodConstant.java`, and Semakan & Perakuan disabled via `showJanaButton` flag in `MlkKertasTemplateForm.java`.

**What Would Have Been Faster**:
Branch mismatch during verification cost time — fix was on one branch, review was on another. Confirm active branch before reading any code during a review pass.

**Pattern Match**:
- Existing pattern confirmed: **Template Document Verification** — template.config.json as ground truth for which `.docx` maps to which tugasan/jnsPemohon/keputusanSyor combination

**Codebase Knowledge Updated**:
- `template.config.json`: PPJK now has 4 document blocks with jnsPemohon + keputusanSyor filters
- `PelupusanExtraParamMethodConstant.java`: `populateKeputusanJKKL()` pattern for extra param population

**Process Notes**:
- Code committed to branch `mlk/qa/246512`
- FAT checklist not verified — popup/alert check (etanah-common, shared component) remains unconfirmed at quest close
- PTG scope deferred by seniors — only PDT + Ringkasan implemented

**Carry Forward**:
1. Popup/alert for Syor Permohonan likely lives in etanah-common — watch for this in future PPJK FAT
2. When Lulus blocks have no keputusanSyor filter — this follows existing pattern (confirmed with team), not a bug

---

### PRZ #255637 — PPTPB TemplateSuratJabatanTeknikalPPTPB (Text + frasa2 justification) — 2026-04-07

**Root Cause Type**: config

**Root Cause Summary**:
Two issues combined. First: `frasa2` paragraph justification was set incorrectly inside the Word template paragraph itself — `PelupusanWordStyleVO.java` has no alignment field, so justification is always controlled by the `.docx` directly. Second: wrong document targeted — `TemplateSuratJabatanTeknikal.docx` was assumed, but the correct document for PPTPB tugasan is `TemplateSuratJabatanTeknikalPPTPB.docx`, confirmed via `template.config.json` line 2649.

**What Would Have Been Faster**:
Check `template.config.json` first to confirm the exact `.docx` filename for the tugasan before opening any document. Never assume document name from the base name alone.

**Pattern Match**:
- New pattern added: **Template Document Verification** — always confirm exact `.docx` via `template.config.json` before editing; multiple module-specific variants of a template can exist (e.g. base vs PPTPB vs PPJK)

**Codebase Knowledge Updated**:
- `PelupusanWordStyleVO.java` has no alignment field — justification always comes from Word paragraph settings in the `.docx` directly, never from code

**Process Notes**:
- Both issues caught before testing began — saved significant FAT time
- Hasty assumption on document name would have caused testing on the wrong file entirely

**Carry Forward**:
1. `template.config.json` is the ground truth for which `.docx` maps to which tugasan — always check it first
2. Word paragraph formatting issues → check the `.docx` itself, not the Java VO class

---

### PRZ #255106 — Surat Iringan Pewartaan ke pej. LA (Pejabat suppression + FooterSuratWithoutSlogan) — 2026-04-07

**Root Cause Type**: config + code

**Root Cause Summary**:
Surat Iringan ke pej. LA had multiple corrections: (1) footer contained slogan `CEPAT.TEPAT.OUTPUT.OUTCOME` which should be removed — fixed by referencing `FooterSuratWithoutSlogan.docx` in `template.config.json`; (2) pejabat field was displaying for PRZ Surat Iringan tugasans where it should be suppressed — fixed by adding a filter for 3 specific tugasans in `populateMaklumatPengguna()`; (3) Word document corrections — comma in address, add `MELAKA SAYANG RAKYAT` slogan, change `b.p: Pentadbir Tanah` → `b.p: PTG`, consolidate to 1 page.

**What Would Have Been Faster**:
Quest was on hold due to server issues and session was not closed properly before `save all` — implementation details lost from working memory. Always close quest state cleanly before saving.

**Pattern Match**:
- Existing pattern confirmed: **Template Document Verification** — confirm document variant via `template.config.json` (added above from #255637)

**Codebase Knowledge Updated**:
- `populateMaklumatPengguna()` — contains pejabat suppression logic; filter is tugasan-specific
- `FooterSuratWithoutSlogan.docx` — variant footer template without the `CEPAT.TEPAT.OUTPUT.OUTCOME` slogan, used for specific Surat Iringan tugasans

**Process Notes**:
- Quest was held mid-execution due to server instability — this is a known risk for PRZ FAT tickets
- Implementation details not recoverable from session memory; post-mortem reconstructed from brief + current-session notes

**Future Watch**:
- `else` branch in `populateMaklumatPengguna()` (line 7246–7254) — non-DUN tugasans must still show `pejabat`. Verify no regression when testing those documents in the future.

**Carry Forward**:
1. Close quest properly (`phase=complete` in `active.txt`) before `save all` — never leave a quest half-open at session end
2. If quest is on hold, write a brief implementation note in the project file before saving

---

### FAT-OR #255637 — PPTPB Surat Jabatan Teknikal (alamat + template fixes) — 2026-04-11

**Root Cause Type**: config (template)

**Root Cause Summary**:
Three items. Items 1 & 2: Word template text + paragraph justification fixes in `TemplateSuratJabatanTeknikalPPTPB.docx`. Item 3 (alamatJabatanTeknikal not displaying): was never a code bug — address populates correctly with zero code changes through `MlkSuratTemplateForm` → `BasePelupusanDokumenForm` → `TemplateConfig` path. Multi-session Java investigation was a rabbit hole.

**What Would Have Been Faster**:
Test with zero code changes FIRST before investigating code paths. If the template generates correctly without changes, the bug is in the template, not the code. Would have saved ~3 sessions of strategy/chain tracing.

**Pattern Match**:
- New pattern: **Zero-Change Baseline Test** — before any code investigation, generate the document with zero changes to establish whether the bug is code or template/config

**Codebase Knowledge Updated**:
- Two separate document systems: strategy list (registers available types) vs `BasePelupusanDokumenForm` (actual generation via TemplateConfig). They are NOT connected.
- `PelupusanPenyediaanSuratStrategy` is `@ExcludeNegeriBasedBean(MELAKA)` — base strategy excluded for Melaka
- `MlkPelupusanPenyediaanSuratStrategy` TemplateConfig path is commented out — `PelupusanSuratStrategy` is unreachable for Melaka

**Process Notes**:
- Spent 3+ sessions tracing `CommonPLPandBGNSuratStrategy` → `PelupusanSuratStrategy` chains before discovering neither is in the execution path
- Stale Hibernate error (`AppJabatanTeknikal#1419`) was a red herring — concurrency issue, not data issue
- PDF viewer broken separately (etanah-common 524-beta) added confusion to testing

**Carry Forward**:
1. Always do a zero-change baseline test before code investigation
2. When two systems exist for the same concern (registration vs generation), trace which one is actually executing before fixing either

---

### QA-257569 — PT KKMMKN Tujuan Permohonan wrong dropdown on FAT — 2026-04-22

**Root Cause Type**: data

**Root Cause Summary**:
FAT DB `rjk_senarai_ahli_kumpulan` for group `PLP_TJN_PMH_PT` had billing-period items (turutan 21–29) with `flag_aktif='Y'`, causing them to appear in the Tujuan Permohonan dropdown. Correct items (Penternakan, Lain-lain) were missing entirely from FAT. Code was correct and matched UAT — pure data discrepancy between environments.

**What Would Have Been Faster**:
Running the SELECT on both UAT and FAT immediately at Phase 0 would have confirmed the data discrepancy in one step. Instead, code tracing was done first to find the group kod, then the DB comparison followed. For "wrong dropdown items" tickets — check the data first, code second.

**Pattern Match**:
- New: **Dropdown wrong items → check reference data table first** — when a dropdown shows wrong items, run SELECT on `rjk_senarai_ahli_kumpulan` for the group kod before any code investigation. The fix is almost always data, not code.

**Codebase Knowledge Updated**:
- `rjk_senarai_ahli_kumpulan` ID column uses sequence `SEQ_SENARAI_AHLI_KUMPULAN` — never hardcode IDs in INSERT; use `nextval('SEQ_SENARAI_AHLI_KUMPULAN')`. Entity: `SenaraiAhliKumpulan.java` (etanah-domain 1.1.129).
- Class chain for PT Tujuan Permohonan dropdown: `MlkMaklumatTanahPemberimilikanForm.xhtml` → `mlkKadarCukaiTanahForm.xhtml:61` → `PelupusanExcelReaderHelper.java:1066-1079` (else if URS_PT) → `PelupusanConstant.SK_TUJUAN_PERMOHONAN_PT = "PLP_TJN_PMH_PT"` → `rjk_senarai_kumpulan` / `rjk_senarai_ahli_kumpulan`

**Process Notes**:
Data-only fix. No code change, no commit. SQL fix scripts + before/after Excel table created and submitted with ticket. Passed to BA/data team to execute on FAT DB.
→ forge-log: new feedback memory `feedback_sql_insert_id_check` — missed sequence check during SQL double-check; caught by みや's question, not by my own review.

**Carry Forward**:
1. "Wrong dropdown items" = check reference data table SELECT before code. Group kod is in `PelupusanConstant` — one grep to find it.
2. SQL INSERT with hardcoded PK → always verify `@GeneratedValue` on entity first. Use `nextval('SEQ_...')` if sequence-managed.

---

### QA-260154 — PT PRMMKNPDT Maklumat Plot mandatori check at Seterusnya — 2026-05-08

**Root Cause Type**: code

**Root Cause Summary**:
TWO gates blocked the Plot completeness validator for Melaka URS_PT × risalat tugasan. (1) `MlkPelupusanTugasanConstant.updateTgsnBolehKemaskiniCukaiPanelMap` empty for Melaka (override stub) → outer flag `perluKemaskiniMaklumatPlot` stayed FALSE → outer gate skipped validator. (2) `isValidPremiumVO` gate at `PelupusanExcelReaderHelper.java:2169-2179` bypassed when tugasan ∉ `TGSN_SHOW_CUKAI_PANEL` — risalat tugasan are downstream consumers (live in `TGSN_CHECK_MAKLUMAT_PREMIUM`, not SHOW_CUKAI_PANEL) → inner gate skipped checks. Activating only the outer gate would still bypass at the inner.

**What Would Have Been Faster**:
Read the cited method body verbatim at Cp C step 2 (existing utility sweep) instead of trusting the early-diagnostic's paraphrased field list. Iterated 4 Cp D Rubric drafts on a wrong field-list before realising PremiumVO checks 7 fields differently than the diagnostic claimed AND that the inner gate at :2169-2179 bypasses for risalat tugasan. One careful method-body read at Cp A wrap-up would have saved hours.

**Pattern Match**:
- New pattern: **state-specific override seam silent disable** — base class declares an abstract `update*Map` method; per-state subclasses override; an empty Melaka override silently disables a base validator path. Look for `protected void update*Map(Map ...) {}` empty stubs as candidates.
- New pattern: **double-gate trap** — same validator can have multiple OR-chained bypass conditions at different layers (outer flag + inner method gate). Activating one without the other is silent fail. When fixing a validator, trace ALL OR-conditions in the bypass.

**Codebase Knowledge Updated**:
- Candidates for BUG-BESTIARY (dormant validator + double-gate trap) and MODULE-ARCHITECTURE (state-specific override seam list) — pending みや approval per Cp J/K rule.
- This post-mortem captures the patterns until knowledge files are formally updated.

**Process Notes**:
- Trusted early-diagnostic's field-list claim without source-verifying — caught by みや mid-Rubric. Rule baked: "Trust-but-verify early-diagnostic claims at every quest start" (audit-log 2026-05-08, REINFORCED).
- Framed 3 known coverage gaps as future-BA-problem ("if BA reports later") — みや: "set me up for failure?" Rule baked: "ASK before extending scope when finding related issues" (audit-log 2026-05-08).
- Dismissed user's empirical observation about 2 success toasts on Seterusnya — substituted theory for code reading. Real cause: `BasePelupusanForm.onGoNext():603` calls `super.onSave(false)` BEFORE `verifyCurrentLangkah` → save+ralat appear together. Rule baked: "Don't dismiss user's empirical reports by substituting your own theory" (audit-log 2026-05-08).
- Described prepare-commit sequence WITHOUT the mandatory `git pull --ff-only` step between stash and branch (twice in same session). Strengthened `quest/quest-protocol.md` Phase 1 prepare-commit step 4 with a 🚨 callout.

**Carry Forward**:
- For any "validator silently passes" bug: trace ALL OR-bypass conditions in the gate, not just the first one
- Source-verify familiar/diagnostic claims at Cp A wrap-up (read method body, not paraphrase)
- Surface related-issue findings as ASK questions, not ship-or-drop unilateral decisions

---

### QA-259318 — PRU Template Surat Keputusan Lulus (v1 closure 2026-05-04 + v2 rework 2026-05-12)

**Root Cause Type**: template (.docx binary)

**Root Cause Summary**:
**v1** (2026-05-04): 11 SuratKeputusanLulus*.docx templates had un-migrated/regressed slogan line, mixed Isipadu/Luas labels, "Meterpadu" typo, year-calc bug, and other point-by-point corrections from BA's PDF. Fix migrated all 11 templates to `frasa2` (DB-driven, regression-proof) + removed `JcEnumeration.BOTH` default in `PelupusanWordEditorUtil.java:482-487` (renderer override that defeated left-default in .docx). **v2** (2026-05-12): BA's 2026-05-07 UAT retest flagged the `(Ringgit Malaysia: Dua Ribu Empat Ratus)` terbilang phrase at point 3 was un-bold; fix wrapped the run in `<w:rPr><w:b/></w:rPr>` in `TemplateSuratKeputusanLulusPRU.docx` only. PRU-strict scope (other 11 SKL templates untouched — BA only flagged PRU).

**What Would Have Been Faster**:
**v1**: Reading `PelupusanWordCCMethodConstant.java` first (the dispatch map between every CC tag and its populator) instead of 4 familiars hunting for slogan / year calc / unit string sources independently. Single read would have surfaced all populators at once. Captured as "Word-template-first lookup" hard rule in CLAUDE.md (2026-05-04). **v2**: nothing to do faster — single .docx tweak with clear BA verbatim instruction, ~30min from ID retrieval to push.

**Pattern Match**:
- **v1**: New pattern — **renderer-side overrides before cache theories** — when display/layout bug persists despite a verified-correct template, grep populator code for `setVal\(JcEnumeration`, `setBold`, `setSpacing` patterns before assuming JBoss cache. Captured in CLAUDE.md as hard rule.
- **v1**: New pattern — **Word XML run-join before grep** — Word splits text across `<w:t>` runs; flat literal grep silently misses matches. Always `re.findall(r'<w:t[^>]*>([^<]*)</w:t>', xml)` then space-join. Captured in CLAUDE.md.
- **v1**: New pattern — **PDF annotation extraction at Phase 0** — Read tool exposes visual page content but NOT `Annot` objects (sticky notes, popup comments). Mandatory `python fitz` extraction step before declaring Phase 0 complete. Captured in CLAUDE.md.
- **v2**: Reused **BA verbatim quoting** in commit message + **drop-redundant-with-diff** suffix rules (refined this session into quest-protocol.md). First field-test of the simplified Notes.txt auto-log format.

**Codebase Knowledge Updated**:
- **v1**: Spawned 7 hard rules in `.claude/CLAUDE.md` (Word-template-first, Word XML run-join, branch check + pull at Phase 0, PDF annotation extraction, renderer-side overrides, no extra code comments, batch same-layer edits) + 12 audit-log entries.
- **v2**: 4 audit-log entries this session (compound trigger phrase, commit convention refinement, hands-off scope clarification, `addStatusFolder` Condition 2 drop).

**Process Notes**:
- **v1**: Started edits on wrong branch (`mlk/qa/258418`) before branch-check — caught by みや. Drove the "Branch check + pull at Quest Phase 0" hard rule.
- **v1**: Built Phase 0 plan on guesses about what BA wanted because didn't extract PDF annotations — only discovered when みや asked *"do you not read the comments?"*. Drove PDF annotation extraction hard rule.
- **v2**: Smooth Phase 1 — BA's 2026-05-07 rework note was unambiguous (verbatim phrase to bold), test app was already at PYSK without flowable-alter, single .docx tweak. Tested as the QA-259318 ID's existing FAT presence (`PTMLK/01/L/PRU/2026/10` PYSK under `azmezan@melaka.gov.my`).
- **v2 slip**: hands-off scope misinterpretation — presented stash→branch→pop→add as copy-paste for みや instead of running automatically (he asked why). Corrected + protocol clarified mid-session.
- **v2 slip**: used "bake/baked/baking" verb 2nd time in violation of 2026-05-11 personality.md rule. Replaced occurrences in canonical living docs (rules people apply); historical entries preserved.

**Underlying issue (still open)**: Redmine #252314 (MELAKA SAYANG RAKYAT slogan migration) — 11 SKL templates fully migrated to `frasa2` (v1); other ~12 non-SKL templates from #252314 scope still un-migrated and at regression risk. Tracked in todo Q3.

**Carry Forward**:
1. **PDF annotation extraction is non-negotiable** — every `.pdf` referenced in a brief gets `fitz.annots()` walk before declaring Phase 0 complete.
2. **Word-template-first read** — when a ticket touches `.docx`, `PelupusanWordCCMethodConstant.java` is the FIRST read, before any template inspection.
3. **Run-join Word XML** before any grep on `document.xml` — defeats Word's run-splitting that silently breaks literal text matches.
4. **Hands-off scope is `git commit` + `git push` ONLY** — all prep (stash/branch/pop/add) is Ruri-owned automatic.
5. **Notes.txt auto-log format works** — 3-line compact (ENV — TUGASAN / ID / login) reads at a glance; field-tested this session.
6. **BA verbatim quoting in commit** — when BA's ticket Description names a specific phrase, quote it in the commit subject. Drop suffix info that the git diff already reveals.
7. **Audit + migrate the other ~12 non-SKL templates from #252314 scope** — Q3 todo entry; same `frasa2` migration shape, mechanical.

---

### QA-260876 — PLTP Ringkasan Risalat MMKN (Font + Ulasan YB wiring) — 2026-05-13

**Root Cause Type**: template (.docx binary, 2 files — main + external `references/` ref doc)

**Root Cause Summary**: `TemplateRingkasanRisalatPLTP.docx` had (1) wrong font on Ulasan Daripada cell — BA wanted Century Gothic 10.5pt; (2) Ulasan YB row was 100% static placeholder text with hardcoded "Durian Tunggal" DUN literal, no CC tags wired, so populators (`dunYB` / `tarikhTerimaUlasanYB` / `keputusanYB`) couldn't fill. **Architectural insight**: the JT-table section is INJECTED from external `template/MLK/references/JabatanTeknikal.docx` — its run properties drive rendering at the injection slot, NOT the parent template's. Font fix had to land in the external doc, not the parent. Same external-injection pattern as `additionalJKKLParagraph.docx` (QA-247710, 24h earlier).

**What Would Have Been Faster**: Recognizing the parent/child template injection pattern (same as QA-247710's `additionalJKKLParagraph.docx`) at Phase 0 — the architectural lesson should have transferred since the two tickets are 24h apart. Pre-loading etanah-knowledge at orchestrator level (before spawning Scouts) would have surfaced the pattern.

**Pattern Match**:
- **Recurring (now 2 confirmed instances)**: External `references/` docs as injection-pattern children — parent template has slot CC, populator returns externalPath, **child doc's styling drives the injected slot**. Treat as the framework's standard pattern for table-block injection.
- **New**: Ringkasan Risalat MMKN tugasan-binding rule — generates at *MMKNPTG / *MMKNPTGT side ONLY (NOT *MMKNPDT). The *MMKNPDT side generates a DIFFERENT document (Risalat MMKN PDT). Verify via `template.config.json` literal-key check, NOT by enumeration of lifecycle action arrays.
- **Reused**: Word-template-first hard rule (CLAUDE.md 2026-05-04) + Recon Universal Check 1 transitive-references clause.

**Codebase Knowledge Updated**:
- 2 candidate entries for `etanah-knowledge/melaka/` (pending みや approval per Cp J/K rule):
  - `MODULE-ARCHITECTURE.md` extension: external-injection child doc pattern (`references/` folder, populator-returned `PelupusanWCCTableVO` with externalPath, child styling overrides at injection slot)
  - `FLOW-TRACES.md` extension: Ringkasan Risalat MMKN tugasan-binding map (*MMKNPTG / *MMKNPTGT only across all urusan variants), distinct from Risalat MMKN PDT (*MMKNPDT)

**Process Notes**:
- Scout misread `template.config.json` — claimed Ringkasan PLTP binds at PRMMKNPDT/SRMMKNPDT/PRMMKNPTG/SRMMKNPTG/PRRMMKNPTG + Tangguh (lifecycle status enumeration), when the actual binding is only `PRMMKNPTG + PRMMKNPTGT` (lines 4151-4163). I trusted Scout's source-cite without re-verifying. みや caught.
- Spawned Sub-check 8c (config-file tugasan-binding verification) at Recon ritual.
- Spawned broader framing shift: agent output = raw evidence, not findings. Verb discipline: never say "Scout claims X — verified" without showing the verification step.
- Recon title format went through 3 iterations same day (4-axis → 4-axis-no-Langkah → 5-axis-with-Langkah). Final stable: `QA-### • App • Env • Urusan • Tugasan • Langkah`.
- Notes.txt format reformed to 2-entry pattern (Entry 0 BA-prep state + Entry 1 sim app) with abbreviated `PLP`/`AWAM`. みや hand-edited 260876 Notes.txt as canonical example.
- Refine Block format standardised (Slip / Diagnosis / Fix / Pressure-test) + version-bump discipline introduced.
→ forge-log: 7+ audit-log entries spawned this ticket cycle.

**Carry Forward**:
1. **External-injection pattern recognition** — when scanning a parent template, identify any CC tag whose populator returns `externalPath`. Trace into the external doc + verify its CC tags + styling at Phase 0.
2. **Ringkasan ≠ Risalat MMKN** — different docs, different tugasans. Add to etanah-knowledge for future scope-anchor clarity.
3. **Source-verify Scout enumerations**, especially config-file tugasan-binding claims (Sub-check 8c mandatory).
4. **Agent output = raw evidence**. Verification step is non-skippable; orchestrator does it.
5. **Orchestrator pre-loads etanah-knowledge** before spawning Scouts — so ground truth exists to verify against.

---

### QA-247710 — PRU Risalat MMKN PDT/PTG enhancement (Rework cycle 2) — 2026-05-12

**Faster-finding**: Faster if external-injection pattern (`additionalJKKLParagraph.docx` child doc) recognized at Phase 0. Action applied: external-injection section in `MODULE-ARCHITECTURE.md` + cycle-relevance rule in `quest-protocol.md` (2026-05-13).

**Contributing Factors**:
| # | Factor | Evidence |
|---|---|---|
| 1 | Cycle-relevance failure — treated 2026-05-06 early-diagnostic's 11 anticipated issues as current scope | `quest/active.txt:332` ba_rework note captures BA's actual 2-item scope |
| 2 | Defensive-line removal slip — stripped `ccVO.setType(TABLE)` thinking redundant | TagAttributeException at next render; load-bearing for Word XML parser |
| 3 | Compound-trigger follow-through gap — stopped at push-verify | Forgot return-to-master + active.txt update + /verify-close until みや caught |
| 4 | Question-as-Instruction misread | BPRZ urusan in another section header treated as in-scope, momentarily broke "6." rendering |

**Process Notes**:
| Item | Detail |
|---|---|
| Multi-cycle ticket | Original commit `34acdd6222` (Vincent Lee, 2026-04-11); rework 2026-05-06 by syafiq |
| Architectural insight came late | External-injection pattern only named after QA-260876 surfaced same shape 24h later |

**Carry Forward**:
| Item | Home |
|---|---|
| Bean autodefault `updateKeputusanSyorOnFirstLoad` writes TRUE → defeats validator | `main/todo.md` Q3 |
| KEMASKINI alert extension (currently SELESAI-only per BA spec) | `main/todo.md` Q3 |
| 10 urusan font inconsistencies in `additionalJKKLParagraph.docx` | `etanah-knowledge/melaka/DEFERRED-CRITICAL-ISSUES.md` |

---

### QA-260820 — PRZ Surat Keputusan JKKL panel hide — 2026-05-13

**Lessons**:

| Plain language | Technical | Explanation |
|---|---|---|
| Use the named constant when one already captures the semantic, not an inline list of the same items | `PelupusanConstant.URUSAN_INVOLVE_JKKL_LIST` (5 urusans) over the 5-OR inline chain | DRY — if a new urusan joins JKKL flow, one place to update vs every inline list. The constant IS the canonical "urusans in JKKL workflow" |
| The same one-line fix can quietly cover multiple tickets when its filter aligns with the underlying semantic | `MlkSuratTemplateForm.java:785-788` | Adding the urusan-list filter also hid Panel #1 of QA-260733 (PLTP TOLAK) — side-effect alignment validated the constant choice |
| PRZ doesn't go through JKKL or JKBB councils — it uses MMKN directly | `MLK_PLP_PRZ.bpmn20.xml` contains only MMKN tugasan references | Earlier knowledge entry (`JSF-WIRING.md:94`) was misread as "PRZ uses JKBB"; the row actually documents an OR-condition. Correction pending in carry forward |

**Carry forward**:

| Item | Home |
|---|---|
| Refactor `populateSuratKeputusanJKKLDokumenList:425-432` 5-OR-chain to use `URUSAN_INVOLVE_JKKL_LIST` (same set, inline enum predates the constant) | `main/todo.md` Q3 |
| Knowledge file wording fix — `JSF-WIRING.md:94` PRZ/JKBB row is an OR-condition, not "PRZ uses JKBB" | Knowledge file edit (next session) |

---

### QA-260733 — PLTP Surat Tolak 3-panel hide — 2026-05-13

**Lessons**:

| Plain language | Technical | Explanation |
|---|---|---|
| One ticket's fix can cover part of another's scope when filters align | QA-260820's `URUSAN_INVOLVE_JKKL_LIST` filter on `MlkSuratTemplateForm.java:785-788` | Panel #1 of this ticket (Surat Keputusan JKKL Dari PTG) was already hidden for PLTP by the time we got here — PLTP isn't in the JKKL list, so 260820's gate caught it for free |
| Sometimes a constant's NAME and its CONTENTS tell different stories | `TGS_KEPUTUSAN_LULUS_NOTIS_5A_LIST` at `MlkPelupusanTugasanConstant.java:232-236` contains TOLAK tugasans (PYSTP, PSTP) | An old refactor that renamed but didn't reshape — fixing at the writer-site (per-tugasan filter) is safer than touching the constant with 5 callers across 3 files |
| TOLAK flow inherits panel writes from LULUS unless explicitly excluded | `MlkSuratTemplateForm.java:862` + `:911-916` writers fire for TOLAK tugasans via the misnamed LULUS-list | The Surat Tolak Permohonan langkah shared the same writer block as LULUS surat tugasans; per-tugasan exclusion was the cleanest separation |

**Carry forward**:

| Item | Home |
|---|---|
| Refactor candidate: rename or reshape `TGS_KEPUTUSAN_LULUS_NOTIS_5A_LIST` (5 callers across 3 files; risky without coordinated audit) | `main/todo.md` Q3 |

### QA-260965 — PLPS/PRBB No. Sijil Kerakyatan mandatori state-wide Melaka gate — 2026-05-14

**Lessons**:

| Plain language | Technical | Explanation |
|---|---|---|
| Init methods can be just as guilty as event handlers — both fire and both can flip flags | `PelupusanMaklumatPemohonHelper.initWarna()` @ 4274-4288 runs at page-load population (line 4256 call), NOT just on user action | I framed `mandatoryNoSijil = true` writers as "event handlers" early on — missed that `initWarna()` is called from the dialog-populate path. That's why the bug shows up before any user click |
| Bug-manifestation depends on data, not just code — applicant's IC color drove whether the asterisk appeared | `pemohon.getWarnaPengenalan() != WARNA_BIRU` triggers the else-branch | みや's PRU test used Malaysian-citizen-blue-IC → init's IF branch fired → no asterisk. BA's PLPS test used non-blue IC → ELSE branch fired → asterisk. Same code path, different applicants. "No issue per BA test" ≠ "code is fine" |
| Requirements (parent ticket #212906 + children #212990/#215476) are last-check-before-following-AWAM | Requirement #212990 journal (2025-07-17 by Anis Nabilah BA) specs `Warganegara=Malaysia → Taraf=Warganegara` | Pulling the parent Requirement at QA-260965 confirmed AWAM-side spec, surfaced #220373 (2025-07-15) as the commit that introduced Taraf-based citizenship logic ALONGSIDE warna without removing it — the duplication that powers the bug |
| Code comments are for OTHER developers reading the code — never reference internal MD files; never frame as "out of scope" | Final comment shape: `// QA #260965 — BA clarification covers all urusan & this fix matches AWAM.` | Earlier draft pointed at `DEFERRED-CRITICAL-ISSUES.md` and framed as "going beyond ticket scope" — みや corrected both. Comments must be self-contained + framed as legitimate scope, not apology |
| Melaka-gate is the right v1 shape when business logic is unknown — lets state evolve independently of others | `mandatoryNoSijil = melaka ? Boolean.FALSE : Boolean.TRUE` at 3 sites (initWarna 4286, onChangeWarganegara 4824, onChangeWarganegaraIbubapa 4851) | Architectural seam: Melaka becomes the "stable state project" where future complexity (Taraf-based logic, naturalized-citizen handling) lands inside the Melaka branch without touching TRG |

**Contributing Factors**:

| # | Factor | Evidence |
|---|---|---|
| 1 | Cherry-picked AWAM line 5542 as "canonical Melaka pattern" without inventorying full writer set | みや caught: AWAM has 11+ other `mandatoryNoSijil = true` writers (4100, 4812, 4831); line 5542 is one specific bangsa-warna branch. The real Melaka mechanism on AWAM is `viewNoSijilRakyatPanel = FALSE` panel-hide @ 976/2013/2132 |
| 2 | BA-Q gate fired during Recon instead of after Rubric, skipping the deeper analysis | First-cycle Recon stopped before Rubric due to "BA scope ambiguity" — Rubric's architecture diagram + 100%-verify would have surfaced `initWarna()` 24h earlier. Hard rule landed today: BA-Q gate fires AFTER Rubric completion |
| 3 | First Apply attempt over-scoped to state-wide before BA clarification + Requirement check | みや reverted my state-wide ternary the same day, exposed the missing Sub-check 8d (Dispatch vs BA-scope shape comparison). Sub-check 8d codified today |
| 4 | Notes.txt auto-write only covered PLPS, missed PRBB despite ticket title listing both | Single-urusan auto-write path was the rule; multi-urusan extension landed today (one entry per urusan in title) |

**Process Notes**:

| Item | Detail |
|---|---|
| Multi-cycle convergence | BA WhatsApp clarification + Requirement #212906/#212990 fetch + `initWarna()` code finding all needed to lock in the right shape; no single source had it |
| Hard rules spawned this ticket | Sub-check 8d (scope-shape verification), Code-first investigation before BA-ask, Apply hard-stop after working-tree edits, BA-Q gate timing (fire AFTER Rubric), Notes.txt multi-urusan rule, skill naming-tier convention, plain-vs-technical table format, arrow-flow notation format, v1-always-confirms-before-acting, Refine + Design Memo format → table (drop code-block wrap), Refine + Design Memo consolidated as sub-rituals of System-Design, code-comments-for-other-devs rule (no internal MD refs, no out-of-scope framing) |
| BA chat reference | 2026-05-14 09:15-11:20 WhatsApp: "rasanya semua urusan ada isu yg sama"; "Urusan pru dgn ppjk x de isu tu" |

**Carry Forward**:

| Item | Home |
|---|---|
| warna-vs-Taraf mandatori duplication — unified-refactor pending BA business spec | `etanah-knowledge/melaka/DEFERRED-CRITICAL-ISSUES.md` entry added 2026-05-14 |
| Polis-* warna codes don't trigger Malaysian-citizen Taraf path (Requirement #212990 violation) | `main/todo.md` Q2 — separate bug ticket |
| Taraf-based mandatori refactor (cross-state architectural; pre-req: confirm TRG Taraf code parity) | `main/todo.md` Q2 — refactor ticket; supersedes Melaka-gate when shipped |

---

### QA-262027 — PSBS Surat Keputusan PTG kepada PDT — 2026-05-19

**Lessons**:

| Plain language | Technical | Explanation |
|---|---|---|
| A deferred item in a footnote is a hidden item | BA issues #5 (PN) + #6 (Mukim prefix) were parked in a "Deferred (#4-#8)" prose line under a Rubric that read "test-ready" | みや had to challenge to surface them. Deferring is fine; deferring quietly is the sweep. A deferred item must be a visible decision, not a sub-line |
| "Verified" must mean intent-verified, not mechanism-verified | Fix #1 marked "VERIFIED 100%" — but only the casing mismatch (`hasilTahunPertamawithRM` vs Java `…WithRM`) was traced; whether the corrected tag's populator (`getHasilThnPertama()` = first-year revenue) matches the BA's "Kadar Nilaian smp/sehektar" was never checked | Noticed-then-dropped: the BA's comment was recorded in the early-diagnostic, then rationalised away. A fix is "done" only when mechanism AND BA-intent both hold |
| Branch is cut at Phase 1 close, after test — never at Apply | Created `mlk/qa/262027` at Apply time; `quest-protocol.md:687-701` explicitly bans it (Apply = working-tree edits on mlk/master only) | Branching early forks the fix off a master that may be stale by submission. Corrected: branch deleted, fix moved to mlk/master, re-cut at close after the test passed |

**Contributing Factors**:

| # | Factor | Evidence |
|---|---|---|
| 1 | No structured per-issue tracking — "deferred" lived in prose | Early-diagnostic had a discrepancy table but no status-per-phase; deferral was buryable. Fixed: `checklist` skill + QA-NNNN.md Issue Checklist |
| 2 | "Verified" status conflated mechanism-real with fix-correct | Recon row #1 said VERIFIED on the casing trace alone; the populator output was never matched to the BA's stated intent |
| 3 | Followed CLAUDE.md "Phase 1 Closure — Git Sequence" at Apply time | That section lists pull→branch→commit but lacked an explicit "run only after test passes" precondition; `quest-protocol.md` was unambiguous and not cross-checked |
| 4 | Challenged items re-examined in isolation, not as a whole-quest RESET | When みや challenged #5/#6 + branching, fix #1 stayed "settled" — Momentum Circuit-Breaker T2 should have fired and re-audited every fix |

**Process Notes**:

| Item | Detail |
|---|---|
| Fix shipped | 5 fixes on `003862e9ff`: #1 CC-tag casing, #2 ejaan, #3 slogan jc both→left, #5 new `singkatanJenisNoHakmilik` tag+populator (PN abbrev), #6 static "Mukim " label |
| New skill spawned | `checklist` — universal task checklist (Tier 3); core rule (mechanism-done ≠ done; intent must match) is the direct cure for the #1 slip |
| New doc spawned | `QA-NNNN.md` per-quest lifecycle doc — Design Memo approved; Issue Checklist section is the visible-decision cure for the deferral slip |
| Protocol gap surfaced | CLAUDE.md "Phase 1 Closure — Git Sequence" needs a precondition line (run only after `local_test_confirmed`) — text given to みや (file edit-blocked) |

**Carry Forward**:

| Item | Home |
|---|---|
| #1 value-source — does `hasilTahunPertama` satisfy BA's "Kadar Nilaian smp/sehektar"? | BA-Q on Redmine submission |
| #7 (Tujuan+Perincian) + #8 (template structure) | Deferred — need Requirement #237882 attachment |
| Heading "55 Tahun" vs body "1 Tahun" inconsistency | Out-of-scope observation — flagged to BA |

---

### QA-262039 — PSBS Surat Keputusan Lulus kepada Pemohon — 2026-05-19

**Lessons**:

| Plain language | Technical | Explanation |
|---|---|---|
| Scout's item-list is a starting point, never the scope boundary | Phase 1 was built from Scout's 12-item discrepancy table; the generated surat had 2 unlisted "maklumat tidak ditarik" defects — `kadarCukai` rendered `-`, `syaratKepentingan` rendered its literal placeholder | Every prior Scout rule guards false positives (Scout said something wrong); none guarded false negatives (Scout never listed something). The ticket said "maklumat tidak ditarik" — a general complaint — which demanded an exhaustive every-CC audit, not a 12-row checklist |
| Do, don't ask — don't offload work Ruri can do | Repeatedly told みや to edit the `.docx` in Word and raised BA-Qs instead of checking; the `.docx` is a zip Ruri can edit directly, and did once told | The "Word UI only" rule was about not surfacing XML jargon — not a ban on Ruri editing. Turning every uncertainty into a question for みや adds workload; the goal is to reduce it |
| Verify the data source per urusan — don't pattern-match the rendered string | Recommended `kadarCukaiPT` because it produces the right-looking output; it is the PT-urusan tag (reads `apt.getKadarCukaiTanah()`). PSBS uses `hasilTahunPertamaWithRM` (reads `notis5A.getHasilThnPertama()`) | A matching output STRING is not evidence the DATA SOURCE is right. The sibling-template comparison — which must run before any recommendation — showed the PSBS family uses a different tag |
| The existing-utility sweep must fire even on "create our own X" instructions | Wrote a custom `capitalizeFirstLetterEachWord` when `PelupusanUtil.captializeOnlyAllFirstLetter` already existed — in `populateDaerahDipohon`, a method read the same session | A "create our own" instruction is not a licence to skip the sweep — grep for the existing util first, surface it, build only if absent |

**Contributing Factors**:

| # | Factor | Evidence |
|---|---|---|
| 1 | `early-diagnostic.md` is the most structured artifact at Phase 1 → anchored on it as the scope document | Numbered expected-vs-actual table; reasoning ran FROM it. Recon 100%-verifies Scout's claims item-by-item, implicitly accepting Scout's enumeration as the universe |
| 2 | Accumulated "verify Scout / ask BA / 100%-verify" protocols made Ruri ask-heavy | Uncertainty became questions for みや (where's the .docx, which user, is this the outcome) instead of checks Ruri runs (DB query, file read, sibling compare) |
| 3 | Pattern-matched the output string, not the data source | `kadarCukaiPT` recommended on "produces the right string"; the per-urusan data path was not traced until みや challenged |
| 4 | Working-analog-first not applied at recommendation time | `feedback_simplify_and_reference.md` "find working analog first" exists; sibling templates were only compared after みや pushed |

**Process Notes**:

| Item | Detail |
|---|---|
| Fix shipped | `9b1b9dbe1c` on `mlk/qa/262039`: template (12 discrepancies — dup-word removal, MUKIM label, Sukacita, `sekatanKepentingan` tag, Tuan/Puan, `daerahDipohon` + jumlah CCs, `hasilTahunPertamaWithRM` + "bagi setiap 100 m.p." suffix) + Java (new `populateTotalNotis5APerkataanHurufPertamaBesar` populator) |
| Skill refined | `checklist` — new "Item source — independent enumeration": items enumerated from primary sources, Scout diffed against them, never copied from Scout |
| Memory refined | `feedback_test_data_recency.md` → Filter 2: prefer active gov-email users over `@gmail` (often inactive for pelupusan) |
| Slips caught in real time | みや challenged 4 times mid-session (Scout-trust, offloading, `kadarCukaiPT`, utility-sweep); each corrected with a concrete fix, not just acknowledged |

**Carry Forward**:

| Item | Home |
|---|---|
| Existing-utility-sweep must fire on "create our own X" instructions | todo.md Q1 — refine `feedback_simplify_and_reference.md` + Phase 0 utility-sweep rule |
| Recon needs "Universal Check 0 — independent enumeration" | CLAUDE.md Recon ritual — edit-blocked for Ruri, みや's hand |
| `populateKadarCukaiPT` calls `getKadarCukaiTanah().setScale()` with no null guard → NPE if null | Latent bug — separate ticket if it surfaces |

---

*Post-Mortem Log v1.0 — 2026-04-02*
