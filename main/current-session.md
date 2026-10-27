# Current Session

**Last Activity**: 2026-10-28 01:45 — worktree `rustdesk-software-visibility-e047d5`, second Domain Expansion (memory cleanup + Ruri personality audit); miya archives the session after it.

## Session Recap (2026-10-28 01:45, worktree "rustdesk-software-visibility-e047d5", memory cleanup + personality audit)
- Memory cleanup per miya: every swear word in memory, diary, notes, skills, system and domain docs rewritten as his anger or frustration (3 Sonnet agents, about 200 places, 0 left; code comments and 3 test fixtures too; evals green except 6 pre-existing redmine-write-gate failures, same before and after).
- New gate `domain/memory-clean-words/` (bundle pretool-editwrite-gates, eval 12/12) + save rule `mem-no-swearing` (lib/save-rules.js `no-swearing`, word list `lib/clean-words.js`): swearing cannot be written into memory, and Domain Expansion fails if it was.
- Fable 5.1 audit of Ruri's growth: the Ruri Profile gained no trait since 2026-04-29; 75 relationship blocks are almost all work lessons. Design (proposed, not built) + picture saved in `main/personality/`; memory note `project_personality_growth_design.md`. Upstream Kiyoraka MemoryCore compared: it adds a decaying rule store, a tone/mood registry and a relationship understanding level that our fork lacks.
- Answered: Memory is already its own kind in system/INDEX.md (not under Features); miya proposed raising it above the others like a kernel: not ruled yet.
- Open: build order of the personality design (ask miya); Memory-above-Features ruling; Notepad++ and Sourcetree still not reopened.
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

## Session Recap (2026-10-27, worktree "melaka-prod-adhoc-permohonan-f52ca5", Melaka adhoc day + end-of-day close-out)
- ADHOC-PT-2026-15 (PROD PT `PTMLK/02/L/PT/2026/9` at PRMMKNPDT, advised alter to KKMMKN): saved, status hold + archive_hold, waits BA confirmation or a Redmine ticket (promote with `adhoc-lifecycle.js promote --row A75 --ticket QA-<n>`).
- 264355: deployed AWAM fix `mlk/qa/264355v2` (Awam) is the whole ticket, BA Mira Verified 2026-10-27; Pelupusan `mlk/qa/264355` (Pelupusan) notifikasi stays HELD by miya since 2026-10-01, do NOT merge. Built `lib/quest-branches.js` (+eval 8/8) and quest save list item 5 / close-phase 1d "Branches table" (2fc2c809); ticket-close-block labels each branch (Awam)/(Pelupusan).
- End-of-day close-out for miya: Sweep, Extra tickets, Tickets ran DE and are ARCHIVED. Requirement Documentation (30-ticket blind test decision; `.git/worktrees/base2fc` prune Permission denied) and Surat Tawaran (Perak ADHOC-PRBB-2026-17 fix order) still NEED MIYA and stay open. Excluded by miya: RustDesk, PymTime, 286650 (+ its audit child), System Upgrade 23/9.
- Working-memory cleanup: quest/active.txt 77 → 27 blocks (25 closed tickets via `active-trim.js --apply`, 25 adhocs started before 2026-10-13 archived block-only; Task folders and videos untouched; backups `quest/active.txt.bak_2026-10-27_pre_trim` + `_pre_adhoc_sweep`).
- Memory-system plan: every memory item consolidated into `main/todo.md` section "🧠 MEMORY SYSTEM UPGRADE" M1-M14 (b7779ffe). The 2026-05-28 "Memory System Audit" session was unarchived but needs miya's workspace trust approval to take messages; its plan file and transcript are gone (M13).
- Lesson (slip `bloated-reply`, memory `reply-shape` 2026-10-27 block): a multi-session close-out = wait silently, then ONE table Session | Result.
