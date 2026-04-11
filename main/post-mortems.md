# Post-Mortem Log

> Reflection entries after each completed quest.
> Goal: extract what to carry forward — patterns, process notes, codebase knowledge.
> Written at Quest Phase 3. Linked from project file.

---

## Format

```markdown
### QA-###### — [Short name] — [date]

**Root Cause Type**: data / config / code / schema / process

**Root Cause Summary**:
[1-2 sentences]

**What Would Have Been Faster**:
[One concrete process note]

**Pattern Match**:
- Existing pattern confirmed: [pattern name] in DEBUGGING-PLAYBOOK.md
- New pattern added: [pattern name]
- No pattern match

**Codebase Knowledge Updated**:
- [File or concept updated in etanah-knowledge/]

**Process Notes**:
[Anything about how we worked — what slowed us down, what helped]

**Carry Forward**:
[1-2 things to do differently next time]
```

---

## Entries

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

*Post-Mortem Log v1.0 — 2026-04-02*
