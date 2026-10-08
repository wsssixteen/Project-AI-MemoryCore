---
name: project_pymtime
description: "PymTime (みや's Protime auto clock-in app) — READ projects/coding-projects/active/PymTime/PROJECT.md FIRST; repo path, the always-needed rules, where every other fact lives"
metadata:
  node_type: memory
  type: project
  originSessionId: 73387deb-cd38-48d9-99c3-6231a2e51b8d
  modified: 2026-10-08T08:51:01.175Z
---

**PymTime** = みや's Windows app that clocks a person into Protime once a day + monthly timesheet / claim / Google Drive upload / Checklist tick; shared with colleagues as a portable zip. Repo `E:\Dev\scripts\PymTime` (private GitHub `wsssixteen/PymTime`, separate from MemoryCore). Data dir `%USERPROFILE%\.pymtime\`.

**🚨 The project folder is the source of truth (since 2026-10-08): `projects/coding-projects/active/PymTime/`.** Read `PROJECT.md` FIRST in any PymTime session. It points to `VERSIONS.md` (version record) · `ARCHITECTURE.md` (files, tasks, page regions, what repairs itself) · `PROTIME-AND-GOOGLE.md` (API facts, throttle, Drive, Checklist, sign-in) · `PROOFS.md` (tests, harness rules, 16 mistakes) · `ROADMAP.md` (v18 = みや's 10 asks of 2026-10-08 in 5 phases; phase 1 design critique is NEXT). A new durable fact goes INTO THAT FOLDER, not here. Every bulk change ends with a VERSIONS row + PROJECT state + ROADMAP status in the same pass ([[feedback_side_project_folder]]).

**Always-needed (everything else is in the folder):**
- **One Protime login per script, then wait**: 3–4 logins within ~15 min → `/auth/login` returns 500 for several minutes.
- **A test never clocks in**; every harness = isolated `PYMTIME_HOME` + `PYMTIME_NO_TOAST=1` + sim Protime `127.0.0.1:9`.
- **Acceptance = a colleague's handover says READY**, never my own tests passing.
- **Remote skip**: `node E:\Dev\scripts\PymTime\skip.js today|tomorrow|YYYY-MM-DD [YYYY-MM-DD] --source remote` / `clear <date>` / `list`; procedure + mandatory ask-back with the real date = skill [[pymtime]] (`.claude/skills/pymtime/SKILL.md`, eval `domain/pymtime/eval.js`).
- **A pasted `===== PYMTIME HANDOVER v1 =====` block** → hook `domain/pymtime-handover` → skill [[pymtime]] §Handover. A friend installs by dropping the zip into Claude Code + typing "Install this" (a bare zip does NOT work).
- **"Could not read your password"** → first look at `ps_fail` + `ETIMEDOUT` rows in log.jsonl (a starved below-normal PowerShell, fixed in v17), not the password.
- **State 2026-10-08**: v17 (`7140829`; test scripts `a66843b`), 4 commits local and NOT pushed; no colleague handover received yet; v18 roadmap planned, nothing built.

**ProTime weekly plan (2026-09-30)** = MemoryCore Feature `domain/protime-plan/` (NOT part of PymTime; reuses PymTime's saved login). Windows task `\MemoryCore\ProTime Weekly Plan`: Monday 08:30 + at logon (+10 min), retries 30 min ×6, once per week. API `GET staff-plan/self?startDate&endDate` · `POST staff-plan/bulk/create-or-update [{moduleId:101, planName, status:'PENDING', categoryTask:'PLAN', planDate}]`. Rule: 4 a day, else 3 a day, leftover days empty, filled days never touched. A task created by schtasks /XML needs `<UserId>` = the user SID in Principal + LogonTrigger, or it fails "Access is denied".

**Why:** until 2026-10-08 every PymTime fact sat in this one note and the project folder (created 2026-08-26) went stale through v17; みや asked for a real per-project folder a new session can load after a compaction.
**How to apply:** any PymTime work → read `PROJECT.md` first, then only the file its table names for the question; one login per script; use the skill for skip phrases and pasted handovers.
