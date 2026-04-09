# Quest Protocol

> Four-phase work ritual for formal job tasks (Etanah Melaka).
> Activated on work triggers. Produces a structured Fix Report .docx at close.
> Each QA ticket is a Quest — accepted, executed, chronicled, and reflected upon.

---

## Triggers

| Phrase | Action |
|---|---|
| `QA #<number>` | Phase 0 begins — ask for Task folder path |
| "I have a task/ticket/bug to debug" | Phase 0 begins |
| Any formal Etanah/Redmine task context | Phase 0 begins |
| "Create the report" | Phase 2 begins — ask for output path + screenshot paths |
| "Wrap up" / "Post-mortem" / "What did we learn" | Phase 3 begins |
| `/quest start <QA> <path>` | Phase 0 begins via skill |
| `/quest hold` | Current quest paused |
| `/quest resume` | Resume held quest |
| "Restart quest `QA #<number>`" | Reset phase to 0, status to active — search Task folder first, then `Archive/` inside it |

---

## Phase 0 — Accept the Quest

**Goal:** Read Task folder → build scope checklist → confirm before coding.
**Non-negotiable:** Do not touch any codebase file before Phase 0 is complete.

**Steps:**
1. **Create Task folder** in `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka`:
   - List existing folders, find the highest leading number
   - Create: `<highest+1>. <title as given by みや>`
   - Inside it, create subfolder: `0. Brief` (for ticket info, screenshots, references)
   - Inside the root of the Task folder, create `1. Notes.txt` — leave empty for みや to fill
   - Confirm folder path back to みや
2. Wait for みや to populate `0. Brief`, then read every file in it
3. Read every file in the Task folder (Glob + Read all)
4. Parse: ticket description, scope items (a, b, c…), bug details, screenshots
5. Read `projects/coding-projects/active/etanah-knowledge/melaka/DATABASE.md` — load schema context before any SQL work
6. **Generate test record SQL** — auto-fill from ticket context using the standard template below:
   - **Urusan**: grep `DOMAIN-GLOSSARY.md` for the urusan KOD from the ticket (e.g. PSBS, PRZ, PPJK)
   - **Tugasan**: grep `DOMAIN-GLOSSARY.md` Known Tugasan Codes section for matching KOD or NAMA
   - **ID_PENGENALAN**: if provided in ticket → use subquery approach (preferred)
   - **If ID_PENGENALAN not provided**: uncomment and fill `IT.KOD` or `IT.NAMA` filter instead
   - `LAST_MODIFIED_DATE` may be NULL on unmodified records — always wrap with `COALESCE(LAST_MODIFIED_DATE, CREATED_DATE)`
   ```sql
   -- Auto-filled at quest creation. Uncomment tugasan filter only if ID_PENGENALAN not available.
   SELECT
     UAT.A_TGSN_ID, UAT.CREATED_DATE, UAT.LAST_MODIFIED_DATE, UAT.PEJABAT_ID, UAT.LAST_MODIFIED_BY,
     IT.TGSN_ID, IT.NAMA AS NAMA_TUGASAN, IT.KOD AS KOD_TUGASAN,
     AK.PROCESS_INSTANCE_ID, UAT.PERANAN_SEMASA, PPS.NAMA_PENGGUNA AS PENGGUNA_SEMASA,
     IPS.KOD AS KOD_PEJABAT_PENGGUNA_SEMASA, IPS.NAMA AS PEJABAT_PENGGUNA_SEMASA,
     UAT.FLAG_AKTIF, UAT.APLIKASI_ID
   FROM UMM_A_TGSN UAT
   INNER JOIN IND_TGSN IT ON IT.TGSN_ID = UAT.TGSN_ID
   LEFT JOIN UMM_ALIRAN_KERJA AK ON AK.ALIRAN_KERJA_ID = UAT.ALIRAN_KERJA_ID
   LEFT JOIN PCP_PENGGUNA PPS ON PPS.PENGGUNA_ID = UAT.PENGGUNA_SEMASA_ID
   LEFT JOIN IND_PEJABAT IPS ON IPS.PEJABAT_ID = PPS.PEJABAT_ID
   WHERE UAT.APLIKASI_ID IN (
     SELECT UA.APLIKASI_ID
     FROM UMM_APLIKASI UA
     WHERE UA.ID_PENGENALAN ILIKE '%<ID_PENGENALAN>%'  -- fill from ticket, or replace block with urusan filter
   )
   AND UAT.FLAG_AKTIF = 'Y'
   AND COALESCE(UAT.LAST_MODIFIED_DATE, UAT.CREATED_DATE) <= CURRENT_DATE - INTERVAL '2 months'
   --AND IT.KOD ILIKE '%<TUGASAN_KOD>%'   -- uncomment if no ID_PENGENALAN
   --AND IT.NAMA ILIKE '%<TUGASAN_NAMA>%'  -- uncomment if no ID_PENGENALAN
   ORDER BY UAT.CREATED_DATE DESC;
   ```
   Present the filled script to リドワンさん before Phase 1 — do not skip this step.
6. Build checklist table — one row per deliverable:

| Item | Tugasan | Description | Status |
|---|---|---|---|
| 1a | PRMMKNPDT | Syor Permohonan field (editable) | ⬜ |
| 1b | SRMMKNPDT / PPT | Syor Permohonan field (disabled) | ⬜ |

7. Save checklist to QA project file under `projects/coding-projects/active/<QA-number>/`
8. Write `quest/active.txt` with current quest state
9. Present checklist — **wait for みや's confirmation** before Phase 1

> Skip Phase 0 checklist table for pure single-root-cause bug fixes. Still read the Task folder.

---

## Phase 1 — Execute

**Goal:** Solve the ticket.

- Summon a familiar for any file read >500 lines
- Work through Phase 0 checklist — tick `[x]` only when verified in code
- Track key findings silently: what was NULL, what was root cause, what changed
- Note files involved and whether compilation is required
- Do not generate report or wrap up until explicitly asked

**Before committing:**
1. Confirm all checklist items are `[x]`
2. Ask: *"Have you tested locally?"* — update `local_test_confirmed=true` in `quest/active.txt`
3. Only then run `git commit -m "QA #<number>"`

---

## Phase 2 — Chronicle (Report)

**Goal:** Produce the .docx fix report.

**On trigger:**
1. Ask: *"Output path for the .docx report?"*
2. Ask: *"Screenshot paths? Drop them in a folder and share the full paths, or null for placeholders."*
   - Expected: ticket, issue (bug visible), root cause (1+), fix (1–2)
3. Edit the DATA section of `quest/generate_fix_report.js`
4. Run: `node quest/generate_fix_report.js`
5. Confirm: *"Report saved to [path]."*

**Screenshot naming convention:**
```
1_ticket.png
2_issue.png
3_root_cause.png
4_fix_1.png
4_fix_2.png
```

**Commit convention:**
```bash
git commit -m "QA #<number>"
```
Examples: `QA #254539`, `QA #254604`, `FAT-OR #251455`, `#249445`

---

## Phase 3 — Reflect (Post-Mortem)

**Goal:** Extract learnings, close the quest.

1. **Root cause type?** — data / config / code / schema / process
2. **Match existing pattern in DEBUGGING-PLAYBOOK.md?**
   - Yes → confirm it
   - No → add new Pattern entry
3. **Codebase knowledge to carry forward?** → update `etanah-knowledge/`
4. **What would have been faster?** — process note
5. Write post-mortem entry → `main/post-mortems.md` (use format in that file)
6. Check Forge log → `Feature/Forge-Self-Improvement-System/forge-log.md` — any entries to promote?
7. Update `quest/active.txt`: set `phase=complete`
8. Quick save

---

## Report Generator

| Item | Value |
|---|---|
| Script | `quest/generate_fix_report.js` |
| Run | `node quest/generate_fix_report.js` |
| Template reference | DEBUGGING-PLAYBOOK.md Part 3 |
| Output format | `.docx` matching Bug Fix Report standard |
| Images | Full path per screenshot, or `null` for placeholder |

---

## Quest State File (`quest/active.txt`)

```
qa=<number>
task_folder=<path>
phase=<0|1|2|3|complete>
local_test_confirmed=<true|false>
status=<active|hold>
```

---

*Quest — every ticket is a quest accepted, executed, and chronicled.*
*Protocol version: 2.0 — 2026-04-02 (renamed from Keiro)*
