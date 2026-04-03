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
- [File or concept updated in codebase-knowledge/]

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

### QA-253492 — PRZ Bil Mesyuarat namaPTG — Pending Phase 3

*(Post-mortem not yet written — Phase 3 pending)*

---

### QA-246512 — PPJK Risalat MMKN — Pending Phase 3

*(Post-mortem not yet written — Phase 2 report and FAT verify pending)*

---

*Post-Mortem Log v1.0 — 2026-04-02*
