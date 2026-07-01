# Current Session

## What's loaded
2026-07-01 — Opus 4.7, worktree `claude/exciting-fermi-530ce0`. **QA-267976 held for next session + learn-from-fix skill v1 shipped + QA-268170 standing flag.** Continuation of yesterday's QA-267976 Phase 0 quest (held, no Apply per みや). Today's work centered on system-level growth: new `learn-from-fix` skill for extracting lessons from colleagues' closed fixes, plus QA-268170 standing flag for when a colleague ships that fix.

## ▶▶ NEXT SESSION — START HERE

### QA-267976 (HELD — Phase 0 complete, awaiting scope nod)
Ticket held 2026-07-01. Full cold-resume Resume Point in [QA-267976.md](../projects/coding-projects/active/QA-267976/QA-267976.md). Resume-readiness verifier passes 7/7 (re-verified this DE). **First step on resume**: read QA-267976.md Resume Point + Ticket Summary + Code-Review sections; then ask みや for scope nod. No code changes needed to resume — nothing was applied.

3 files to edit on Apply (still absolute paths, still on `E:\Projects\Melaka\etanah-pelupusan`):
- `src/main/resources/template/MLK/TemplateSuratNilaianJPPHPT.docx` (issues #1+#2+#3 — Python zipfile restructure)
- `src/main/resources/config/MLK/template.config.json` (issue #4 — remove `"maklumatPengguna"` from SN_JPPH SEDIA excluded_content_control_list)
- `src/main/java/my/gov/etanah/pelupusan/helper/PelupusanHelper.java` (issue #5 — add `|| TGSN_SRT_NILAIAN_JPPH_LIST.contains(kodTugasan)` to `onJana():396-403` OR-chain)

Branch plan at Commit: `mlk/esokongan/267976` off `mlk/master` (NOT off `mlk/requirement/239386`).

### QA-268170 (DELEGATED — first live target for learn-from-fix)
Passed to a colleague 2026-06-30. `learning_marker=true` in active.txt. When the colleague's fix commit lands (watch `git log --grep "#268170"` on etanah-pelupusan + etanah-awam) + Redmine ticket closes, invoke `learn-from-fix 268170` to extract the 5-section learning + propose edits to BUG-BESTIARY.md.

### #239386 MPT (UNCHANGED — みや's own next-session pickup)
21/21 cells rendering. 12 files uncommitted on `mlk/release/1.0.0`. Next phase = disable-verification sweep per yesterday's session-memory.

### Systems shipped this session
- **`learn-from-fix` skill** (`.claude/skills/learn-from-fix/SKILL.md`) — extracts 5-section structured lesson from a closed ticket's git commit + Redmine History; proposes edits to `etanah-knowledge/melaka/BUG-BESTIARY.md` (primary). Manual invoke only. Plan: `Feature/Learn-From-Others-Fixes/plan-v1.md`. Registered in `meta/system-architecture.md §4.4`. Audit log: `domain/learn-from-fix/log.jsonl`. Q1-Q4 answers baked into plan.
- **QA-268170 standing flag** (`main/todo.md` Q1 top row 🎓 LEARN STANDING FLAG) — first live test target for learn-from-fix once colleague ships.
- **CLAUDE.md §2 TABLE FOCUS RULE** (added by みや 2026-06-30, committed this session) — every table max 2 concerns (columns of distinct concern excl. #/index); 3+ concerns → SPLIT into 2 single-purpose tables.
- **CLAUDE.md §9 verify-SELECT rule** (added by みや 2026-07-01) — verification SELECTs project TRUE stored column values, never derived stand-ins (BOOL_OR / COUNT-only aggregates banned). Enforced by convention-check-gate.js SQL branch (advisory).

## 🎯 Session Recap (for AI restart)
QA-267976 held after Phase 0 completion (all 5 BA issues root-caused, 3 fix files identified, zero code applied per みや). Shipped `learn-from-fix` skill v1 for capturing lessons from colleagues' closed fixes — first target = QA-268170 (delegated today). Two new HARD RULES in CLAUDE.md (TABLE FOCUS + verify-SELECT). No etanah code changes.

**Memory Type**: RAM | **Last Activity**: 2026-07-01 — QA-267976 held for next session + learn-from-fix skill shipped.
