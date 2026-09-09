---
name: project_pymtime
description: "PymTime (みや's Protime auto clock-in app) — repo path, remote-skip CLI, Protime holiday API facts, login-throttle behaviour, portable-build recipe"
metadata: 
  node_type: memory
  type: project
  originSessionId: 73387deb-cd38-48d9-99c3-6231a2e51b8d
  modified: 2026-09-09T04:39:02.796Z
---

**PymTime** = みや's local Windows app that clocks him into Protime daily + generates/submits monthly timesheet/claim PDFs. Repo `E:\Dev\scripts\PymTime` (private GitHub `wsssixteen/PymTime`, separate from MemoryCore). Data dir `%USERPROFILE%\.pymtime\` (config.json · cred.bin DPAPI · log.jsonl · skip-YYYYMMDD flags · holidays-cache.json).

**Remote skip** (built 2026-09-07): `node E:\Dev\scripts\PymTime\skip.js today|tomorrow|YYYY-MM-DD [YYYY-MM-DD] --source remote` / `clear <date>` / `list` → prints a `verification` line + fires a laptop toast. Procedure + mandatory ask-back with the real date = skill [[pymtime]] (`.claude/skills/pymtime/SKILL.md`, eval `domain/pymtime/eval.js`).

**Protime facts (verified 2026-09-07)**: `GET holiday/is-holiday?date=YYYY-MM-DD` → `data:true|false` (plain date only — an ISO datetime returns false). `GET holiday?month=&year=` returns the WHOLE year as `["YYYY-MM-DD",…]` including every Sunday + replacement days. `leaves/self/today` → boolean only (no half-day / pending distinction). **Login throttle**: 3–4 logins within ~15 min → `/auth/login` returns 500 for several minutes; the daily run + reminder + reconcile are spaced so they never hit it — probe scripts must do ONE login and wait between runs.

**Protime moved 2026-09**: site `http://172.16.90.169/protime`, API `http://172.16.90.169/protime-be/api` (read from `<site>/assets/env.js` → `window.__env.API_URL`; old host 172.16.100.245 is dark). Every caller goes through `lib/api.js liveApiBase` (env.js re-read, 60 s cache, remembered in config.json).

**Google Drive upload (live since 2026-09-08)**: Apps Script web app in みや's `ahmadridhwan.ptsb@gmail.com` account, project "PymTime Drive uploader" (`https://script.google.com/home/projects/13Rl5GgTUReQE-Ej9RA5qbZysgdNaLpp3Fogt-PoSRtFgdp1i5XwKMtaR/edit`), deployed v3 (2026-09-08 16:51: tickOnly endpoint) · Execute as Me · Anyone; URL bundled in `lib/config.js` DEFAULTS.monthly.uploadUrl. Source of truth = `dev/drive-uploader.gs` (its logic runs in `_selftest.js` against a fake Drive/Sheet, S1–S23). Re-deploy after editing: paste in the editor → Deploy → Manage deployments → pencil → Version "New version" → Deploy (URL stays). Team layout: `eTanah Timesheet/<YYYY>/<MM_MON>/<YYYY>_<Mon>_Timesheet_<Name>.pdf` (folder id `16hN0zlse6dfhaIpfyWndiRGL91O0U2kX`; month folders vary: 07_JUL vs 07_JULY, 03_MAC); Checklist sheet `1cfO0RDVhUbTKteP0q_v4OqVuGMtenvsA11p7BG4JXPo` (row per full name, month box under a year block) ticked by the script. みや's file name token = `AhmadRidhwan`; his stored Protime username has a domain typo (`ptsbpuncaktegap`), login accepts it, script compares logins on the local part. Apps Script editor: `Set-Clipboard` (PowerShell, no computer-use grant needed) + Chrome MCP click-in-editor → ctrl+a, ctrl+v, ctrl+s works for a full-file replace (used for v4 2026-09-09); JS injection freezes the tab. **Script v4 (2026-09-09 12:33)**: refuses `exists-similar` (hand-uploaded look-alike by name token ≥3 letters or login) and `already-ticked` (Checklist box ticked, nothing of theirs recognisable); `force` overrides, the page never offers it. Toasts carry `appLogoOverride` = `web\logo-256.png` (shipped) because Windows cached the small ring-less ico.

**Own leaves (2026-09-09)**: `GET leaves/user?page=1&limit=50[&month&year]` (page is 1-based; 0 → 400) = the logged-in user's leave list `{startDate:"dd/mm/yyyy", endDate, leaveTypeCode, leaveTypeName, session:"Full|AM|PM", leaveStatus:"APPROVED|PENDING|…"}` — found by grepping Protime's lazy chunk 510 (`getLeaves` → `leaves/user`); guessed paths (`leaves/self`, `leaves/self/upcoming`) all 500. `lib/leave.js` caches it (`leaves-cache.json`, 6 h) and `/health.nextOff` = earlier of public holiday vs own leave. To find any Protime endpoint: fetch `runtime.<hash>.js`, map `id:"hash"` → `<id>.<hash>.js`, grep the chunks — never guess URLs.

**Portable build**: `build-portable.ps1` needs `$env:TEMP\node-portable.zip` (a zip containing node.exe); if missing, extract `node\node.exe` from the previous `PymTime-portable.zip` and re-zip it. Output ~32.6 MB, no install/admin.

**Why:** these are the facts that cost real time to rediscover (throttle lockouts, holiday endpoint shape, portable-node source).
**How to apply:** any PymTime work — read this before probing Protime; one login per script; use the skill for skip phrases.
