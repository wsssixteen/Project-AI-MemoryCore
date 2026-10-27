# Current Session

**Last Activity**: 2026-10-28 01:05 — session "System Upgrade 23/9/2026" (born 2026-09-23 in worktree `session-naming-format-b88025`, revived 2026-10-27 by a PymTime handover), Domain Expansion, then archived.

## Session Recap (2026-09-23 → 2026-10-28, "System Upgrade 23/9/2026", session naming)
- Built Feature **session-name** (`domain/session-name/`): his first typed message of a new session → one line telling me to rename the session `<D/M/YYYY> - <ticket or 2-4 keywords>` via `set_session_title` self. Format ruled 2026-10-28 ("<date> - <title keyword/ticket number>"), popup "First message only". Child of the `upsm-mode` bundle (no new process), eval 26/26, live fire from main. GitHub `88839abb`, main folder `f038dc1c` via land-on-main.
- Remote Control on for this session (switched from the PymTime session 10:27, 2026-10-27).
- Relayed and NOT acted on: ProTime weekly-plan screen inside PymTime (his PymTime build rule needs his go; belongs to the PymTime project).
- Found: `lib/land-on-main.js` derives main only from an in-tree worktree path, so a build worktree outside OneDrive (the memory rule) points at itself unless `--main` is passed; forge registers a new prompt check standalone although system-rules Rule 7 wants a bundle. Both logged as proposals.

**Last Activity**: 2026-10-28 00:40 — worktree `arabic-command-b8399a` (/arabic: class-along, baris drill + class mode), Domain Expansion.

## Session Recap (2026-10-27 → 28, worktree "arabic-command-b8399a", /arabic)
- Live class 2026-10-27 walked with miya (Lesson 13 ج Exercises 2-4, page 81 ذهب table, Lesson 14 dialogue). Class closed; **next class starts at Lesson 14 · Exercise 1 (answering questions), pages 83-84**. `save-check` PASS.
- Class-word fix: فلاح = petani (not peladang); a child session checked every class-vocab row against all recordings and fixed 4 more (فتاة, زميل, درس, نافذة). Data files only (untracked), VERIFY-LOG rows written.
- Built (miya asked for it here, child session stopped and archived unused): **baris drill mode** (5 class-ayat words; he answers baris + reason number; engine judges both; only class-cited reasons, a `belum` reason never asked) + **class mode** (continue the live class from the class-log stop point, pages mapped to files) + menu of 5 modes, switch by saying a mode name. The 2026-10-27 start-menu merge had never become a commit on main (code sat uncommitted); landed together on main `49cf06b1`, eval 115/115 run in main on real data.
- DE found: main folder held 127 telemetry conflict-copy shards (6 GB) that `git add -A` staged; `.gitignore` rule only matched a one-digit suffix. Widened to `-miyazaki-NN` / `-PJNBRidhwan-NN`; nothing large committed.
- Open: teacher's 2 extra plurals of ضعيف (miya to say them) · Lesson 14 ayat not built (baris and latest-class modes have Lesson 13 only) · `lib/diagram-render.js` looks for Playwright on E: (not connected); worked with `DIAGRAM_PLAYWRIGHT` = npm-cache playwright-core.

**Last Activity**: 2026-10-28 00:15 — worktree `rustdesk-software-visibility-e047d5` (RustDesk blank apps), Domain Expansion.

## Session Recap (2026-10-27 → 28, worktree "rustdesk-software-visibility-e047d5", RustDesk blank apps)
- Symptom: Sourcetree and Notepad++ blank or unclickable over RustDesk on PJNBRidhwan. Proven: blank on the PC itself (local GDI capture + PrintWindow), so not RustDesk; GPU drawing path (Direct2D/Direct3D) fails, GDI works (Notepad++ DirectWrite A/B in a fresh copy).
- Applied (permanent, per app): Notepad++ `writeTechnologyEngine="0"` (backup `config.xml.bak-directwrite`); WPF `HKCU\Software\Microsoft\Avalon.Graphics\DisableHWAcceleration` = 1. NOT tested on screen yet: miya reopens both apps and reports.
- Open: why the GPU path fails (leads: Parsec Virtual Display Adapter 0.45, AMD driver 31.0.21921.1000). Note `library-items/remote-desktop/rustdesk-elevated-app-control.md`. Slip assume-not-verify logged.
**Last Activity**: 2026-10-27 20:14 — session `esokongan-ticket-selection-cad51f` (246964 Verified by BA; 261986 briefed, fix not started), closed by its own Domain Expansion.

**Last Activity**: 2026-10-21 16:40 — session `vibrant-solomon-cd24c1` (#285871 Minit Bebas Tolak Ringkas, from ADHOC-PT-2026-13), Phase 1 closed, closed by its own Domain Expansion (bullet below).

- **SESSION vibrant-solomon-cd24c1 (#285871), 2026-10-21 10:27 → 16:40.** BA Mira opened Internal Issue #285871 for yesterday's adhoc ADHOC-PT-2026-13 (A69 promoted → TICKETED). Full quest re-run: one sonnet adversarial review found 2 gaps in the adhoc fix: B1 PPD → PTNH path (no KPPD Semakan; 3 PROD Pengesahan rows) left an empty KPPD section; B2 Minit Bebas made before deploy lost both sign blocks (fill list from the classpath template, `TemplateConfig.readAllContentControl():747`). Fixed in `PelupusanTemplateUtil`: `isPerakuanMinitBebasTanpaSemakanKppd` (wrapper `blokSemakanMinitBebasKPPD` removed at PMB unless previous tugasan = SMB by KPPD) + `addMinitBebasKppdTagLama` (old docs keep old tags). Offline doc-sim 4 flows PASS. Scope check: only TemplateMinitBebasKPPD.docx locked the sentence. Commit 2026-10-21 14:52 `66422b3ddf` on `mlk/internal-issues/285871` (+56/0, compile green), merged `mlk/int-env` 14:53 `e30e4206cb`. miya deployed + tested internal PLPS/2026/48; screenshot `2. Fix\1. Ayat boleh kemaskini.png`; Redmine Resolved to Mira. Quest Phase 1 closed (archive waits Redmine Closed). Wrong-fix row 1. Open: planned-release list; staging not merged; optional hide outer box label; ADHOC-PT-2026-13 archive save (brief-first, background). Slip `reask/verbose` (commit subject described the effect).
**Last Activity**: 2026-10-22 19:00 — PymTime roadmap phase 1 (design) DONE: A with a left rail, every pick in DESIGN.md · new Phase P (the ProTime weekly plan moves into PymTime, handover from the ProTime plan session 2026-10-20) · its architecture explained to miya, his decisions next
**Last Activity**: 2026-10-27 20:15 — worktree `esokongan-quest-sweep-2bce09` (286315 + 286462), Domain Expansion.

**Last Activity**: 2026-10-27 21:30 — worktree `melaka-prod-adhoc-permohonan-f52ca5` (Melaka adhoc day session), Domain Expansion.
