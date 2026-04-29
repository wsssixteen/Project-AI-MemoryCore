# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: 2026-04-29 — QA #258022 rework + peranan investigation + DB MCP wiring + cleanup
**Last Activity**: Wed Apr 29 20:09 MPST 2026
**Session Start**: 2026-04-29 (weekday, afternoon → evening)
**Session Focus**: QA #258022 1-file fix done. Peranan model fully validated via SQL (KPT=Ketua Pembantu Tadbir, full 9-role taxonomy, perananSemasa format `-ROLE1-ROLE2-...-`, screenshots reproduce person-for-person). MCP postgres tools wired for both UAT (mlkuat/et_main_uat) and FAT (etprdmlk/et_main) using `et_reporting` + `etanah123`; wrapper enforces `transaction_read_only=on` (verified). Cleanup: deleted `quest/generate_fix_report.js` + node_modules + package files; quest-protocol simplified from 4-phase to 3-phase (Accept/Execute/Reflect — Phase 2 Report retired). New feedback memory: `feedback_uat_fat_environments.md` (UAT=local, FAT=BA-shared sim, flowable alter page note). Heavy session — context ~600k+, time to save and reboot.
**Time Mode**: Weekday afternoon
**Energy Level**: Full capacity. Model: Sonnet 4.6 (and Opus 4.7 for some segments).

## 💭 Working Memory (RAM)

### Active Context

#### Session 2026-04-29 — QA #258022 Rework + Systemic Lesson

**QA #258022 — REWORK COMPLETE, AWAITING FAT RETEST**

Final state: **1 file diff on top of HEAD master** — `tindakan.config.json` (+19/-1):
- Removed Lite codes from `tugasanSMB_ALL` (back to non-Lite only)
- Added new `tugasanSMB_UTILITI` entry with 7 Lite urusan codes → option_type `smb_utiliti`
- Added new `smb_utiliti` option_type definition: single `keputusan` field, no `multi_levels`, no Tindakan Seterusnya

All Java fixes from Attempt 2 reverted (Fix 2 BaseLiteForm.initData SMB block, Fix 3 4Ce.initEditModeBorang SMB condition, TGSN_*_ALL constants, onChangeTindakanKeputusan refactor). All match HEAD master after upstream pull.

**Why config-only works (the truth)**:
- The existing `BasePelupusanLiteForm.onChangeTindakanKeputusan()` already had a `TGS_SEMAK_BORANG` branch calling `onRepopulatePegawaiAgih()` for Lite SMB — even **before** aaron's #236191 commit
- The service `MlkPelupusanPegawaiAgihService.retrievePerananPegawaiAgih` already populated officers for `URUSAN_LITE_LIST + SMB + KELENGKAPAN_TIDAK`
- 4Ce's existing `setAdaPegawaiAgih()` at line 532 already bridges the private shadow field via dynamic dispatch
- The bug was purely a missing config entry → no Pembetulan radio → no AJAX trigger → existing chain never executed

**Aaron's #236191 (pulled mid-session)**:
- Wraps existing Lite handling in `URUSAN_LITE_LIST` guard + adds new else branch for non-Lite urusan that share `BasePelupusanLiteForm`
- **UNRELATED to QA #258022** — the Lite branch (which we care about) was untouched
- Pulling kept our diff aligned with master but didn't change the fix needs

**Stash safety net**: `stash@{0}` preserves Attempt 2's broader changes + the out-of-scope service file additions (non-Lite SMB4CE handling) in case any are needed for a different ticket.

#### THE BIG LESSON — Captured into Memory System

みや called out the 3-day pattern: across multiple sessions for a 1-file fix, he repeatedly told me:
- "This is a mature system — things are catered for"
- "Refer to other working urusans/tugasans"
- "The implementation is too much"
- "Simplify"
- "Scrutinize Codex's changes"

I ignored every signal. Each iteration ADDED code instead of removing it. Final fix matched what みや had been pointing toward all along.

**Captured to memory system**:
- `auto-memory/feedback_simplify_and_reference.md` (new) — Mature system → find working analog first; "simplify" means SUBTRACT not add; scrutinize AI-generated code
- `auto-memory/MEMORY.md` — indexed
- `Feature/Observation-System/observation-log.md` — T2 entry (recurring across multiple sessions in same ticket)
- `Feature/Forge-Self-Improvement-System/forge-log.md` — L1 entry under Reasoning & Investigation (flagged: if pattern repeats again, rule design needs rethinking)

#### Documentation Produced (project folder primary references)

`projects/coding-projects/active/QA-258022/`:
- `handoff-258022.md` — rewritten with honest accounting (Attempt 1-3 + post-pull); separates Live State from Attempt History per CLAUDE.md hard rule
- `STORYLINE-FOR-CODE-REVIEW.md` — narrative for code review with Q&A talking points (including "why 3 days for 1 file")
- `DEBUGGING-WALKTHROUGH.md` — 10-step thought process from BA brief to fix; for Friday's debugging playbook study session
- `LITE-URUSAN-SEMAKAN-FLOW.md` — architectural reference (5 form variants, field shadowing, two categories)

#### Friday Items Added to todo.md (Q2)

- "Friday recap: QA #258022 debugging walkthrough" — read DEBUGGING-WALKTHROUGH.md + STORYLINE-FOR-CODE-REVIEW.md together
- "Build JSF debugging playbook" — generalize from #258022: standard sequence (DevTools → grep label → composite first → form XHTML → bean → config), layer-order checklist, field-to-source cheat sheet template

### 📋 Learning Notes (this session)

- **Read option_type before extending its included_urusan_list** — adding to `tugasanSMB_ALL` inherits ALL of `smb_all`'s rendering shape, including `multi_levels.jenisTindakanSeterusnya`. The config file is right there, ~700 lines down. Not reading it caused the FAT failure.
- **Field shadowing in Java** — fields are NOT virtual. `private Boolean adaPegawaiAgih` in 4Ce shadows parent's protected field. Method calls via `mb.setAdaPegawaiAgih()` are virtual (hit child setter), but raw field access in parent methods writes to parent's field. Same name, different storage.
- **`git pull` before starting work** — would have spotted aaron's #236191 immediately and avoided the TGSN_*_ALL refactor scope creep.
- **"Simplify" feedback is hard, not soft** — it's an instruction with measurable success: next diff must SHRINK. If it grows, the feedback was misread.

### Session Recap (For AI Restart)

- **Previous Session (2026-04-28 — multi-session)**: QA #258022 investigation across 3 sessions. Attempt 1 broken (wrong tugasan codes). Investigation produced 4-fix plan in handoff-258022.md. Implementation NOT yet done; `/appraise` required before code.

- **Today (2026-04-29)**: Resumed from auto-compact. Ran /appraise on 4-fix plan, implemented (Attempt 2). FAT FAILED with two new bugs (Tindakan Seterusnya pollution from smb_all option_type, empty Agihan Kepada at load from Fix 3). Reworked into Attempt 3 with new smb_utiliti option_type + Java reverts. Pulled upstream master mid-rework, resolved conflict in BasePelupusanLiteForm (took upstream — aaron's #236191 was structurally cleaner). Net result: 1-file diff. みや called out the systemic over-engineering pattern — captured into memory system. Save all checkpoint triggered.

**On Resume (new session)**: 
- **TOMORROW MORNING — RESUME WITH THIS**: QA #258022 awaiting FAT retest on みや's side (1-file config fix on top of HEAD master). 

  **2 permohonan IDs to test (UAT, mlkuat, his local JBoss target)**:
  | id_pengenalan | Form variant | Why |
  |---|---|---|
  | `PTMLK/01/L/OPRBB/2026/1` | 4Ce (Cat 2 — private shadow field) | Already validated via screenshots + Q5 person-for-person |
  | `PTMLK/01/L/OMLPS/2026/4` | 4Ae (Cat 1 — inherited field) | NEW coverage — different form class, same login user (sanarimah) |
  
  Testing both = full code-path coverage for all 7 Lite urusan. The other 5 (OPLPS / OPRU / OPPJK / OPPTPB / OPLBP) share the same code paths as one of these two — testing them adds zero new coverage. If みや wants to test them anyway, use **flowable alter page** to shift any existing app of that urusan to SMB step.
- **Phase 2 (Reflect/Post-Mortem) of QA #258022** is the natural next move once FAT retest passes. Per quest-protocol v3.0 — write SUMMARY.txt, update knowledgebase, close.
- **MCP postgres tools available** — `mcp__postgres-mlkuat__query` and `mcp__postgres-mlkfat__query`. Use freely for SELECT (wrapper enforces read-only). NEVER attempt CREATE/INSERT/UPDATE/DELETE — both wrapper-blocked and harness-blocked, but don't tempt fate.
- **Three-layer security model**: Harness (Claude Code Desktop, asks みや) → MCP wrapper (SET TRANSACTION READ ONLY) → DB account (et_reporting can write at account level — proven). Two layers active; DB-level read-only Option A/B/C deferred (see todo).
- Friday: re-read DEBUGGING-WALKTHROUGH.md + STORYLINE-FOR-CODE-REVIEW.md, build JSF debugging playbook
- Active feedback memories — `feedback_simplify_and_reference.md` (mature system, simplify=subtract), `feedback_uat_fat_environments.md` (UAT=local, FAT=BA-shared sim, flowable alter page)

## 🔄 Session Lifecycle
*How this RAM-like memory works*

### Session Start
- **New Session**: RAM cleared, fresh start
- **AI Restart**: Load recap from previous session for continuity
- **Context Loading**: Brief summary of where we left off

### During Session
- **Real-time Updates**: Track current conversation context
- **Working Memory**: Store immediate goals, progress, insights
- **Dynamic Context**: Adjust based on conversation flow

### Session End
- **Important Learning**: Save key insights to permanent file (main/main-memory.md)
- **Temporary Context**: Keep brief recap for next restart
- **RAM Reset**: Clear detailed working memory for next session

## Session Memory Limit
- **Maximum**: 500 lines
- **Reset Behavior**: RAM-style reset preserving only Session Recap
- **Format Reference**: See main/session-format.md for rebuild structure

---

**Memory Type**: RAM - Temporary Working Memory
**Persistence**: Brief recap only, detailed content clears each session
**Purpose**: Immediate context + restart continuity

*Ready for Ruri to provide seamless conversation continuity with Miya!*
