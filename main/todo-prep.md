# Q2 Todo Prep — Auto-resumable Backlog
*Generated 2026-04-30 by familiar after QA #258022 close*

---

## ⚡ Quick Reference Table (Top 10 — saved for みや 2026-04-30)

| # | Title | Effort | Entry point | First step | Status |
|---|---|---|---|---|---|
| 1 | POST-#258022 simplify: smb_utiliti → pembetulan | S | `tindakan.config.json:498-504,1274-1284` | Swap option_type ref + delete smb_utiliti def | Ready |
| 2 | POST-#258022 validation methodology rule | S | `quest/quest-protocol.md` Phase 1 | Add code-vs-spec rule to Phase 1 | Ready |
| 3 | POST-#258022 KELENGKAPAN naming legacy doc | S | `etanah-knowledge/melaka/DOMAIN-GLOSSARY.md` | Trace `KELENGKAPAN_MAKLUMAT_*` constant origin | Ready |
| 4 | Plan readability rule properly | M | `.claude/skills/simplify/` (doesn't exist as project file) | Locate `/simplify` skill via harness | Needs research |
| 5 | Q1 trigger broadening for ticket loading | S | `.claude/CLAUDE.md` Quest Workflow | Add trigger phrases list | **Top priority** |
| 6 | Peranan × Urusan × Tugasan mind map | L | BPMN + IND_TGSN + tindakan.config.json | Sweep candidate groups per task | Cluster work |
| 7 | DB ERD for etanah-pelupusan | M | Existing `pg_dump -s` (Q2 context-folder item) | Run tbls/SchemaSpy on dump | Pairs with #6 |
| 8 | Flowable Lite check (#258022 followup) | M | `ACT_RE_PROCDEF` table + BPMN files | Find Lite SMB process_definition | For Phase 2 wrap |
| 9 | Class chain doc for Lite SMB Pembetulan | S | XHTML→handler→service→SQL trail | Document the 4-layer call chain | みや asked earlier |
| 10 | User-side learning home decision | S | `projects/coding-projects/active/QA-258022/PERANAN-LEARNING.md` | Decide (a) MemoryCore learning/ folder, (b) external+pointer, (c) keep+rename | **Trigger now met** (3 closed tickets reached) |

**Recommended order**: #5 (15-min, prevents recurrence) → cluster #1+#2+#3 (post-FAT-close, share #258022 context) → #10 (already unblocked).

**Big theme**: items #2, #4, plus 5 others all touch the same root cause as parent **Feedback Architecture Refactor (#22)**. Don't execute individually — wait for refactor sprint or place rules directly in canonical homes.

---

## How to Use This Doc

Each item below is keyed by **canonical title** matching `main/todo.md` Q2. When みや says "let's work on X", grep this file for the title, load the `Entry Point`, do the `What to Do First` step, ship `Success Looks Like`. Items are grouped by readiness — start with **Items Ready to Execute Now** unless みや asks otherwise.

Cross-reference: this doc summarizes; the canonical source is still `main/todo.md`. If todo.md and this doc disagree, todo.md wins until next regeneration.

---

## Items Ready to Execute Now
*(no further input needed — fully scoped, entry points verified)*

### 1. POST-#258022: Simplify config — switch tugasanSMB_LITE to existing `pembetulan` option_type | S
- **Entry Point**: `projects/coding-projects/active/QA-258022/handoff-258022.md` + `tindakan.config.json` (search `tugasanSMB_LITE` and `pembetulan` blocks)
- **What to Do First**: Read handoff to refresh the deep-scan context, then diff the current `smb_utiliti` option_type against `pembetulan` to confirm structural equivalence still holds.
- **Success Looks Like**: PR ~7 lines (down from ~25). `tugasanSMB_LITE` references `pembetulan` directly; `smb_utiliti` block deleted. Local FAT retest on PTMLK/01/L/OPRBB/2026/1 still passes Ya↔Tidak cascade.
- **Dependencies**: BLOCKED until #258022 main ticket closes (FAT confirmation pending). Do not bundle with the live cascade fix.
- **Notes**: PEMBETULAN constant traced to BPM variable name, not option_type lookup — confirmed safe per todo.

### 2. POST-#258022: Validation methodology — code-vs-spec, never code-vs-itself | S
- **Entry Point**: `quest/quest-protocol.md` Phase 1 section
- **What to Do First**: Read Phase 1 in quest-protocol.md, locate validation-related rules. Add a sub-rule: "Validation cites EXTERNAL spec source (BA confirmation / written requirement / prior approved ticket). SQL that reproduces code output is not validation."
- **Success Looks Like**: One paragraph added to Phase 1, plus a forge-log L1 entry separating this failure from the morning's "didn't load ticket" failure.
- **Dependencies**: None.
- **Notes**: Pairs structurally with #4 (Trigger broadening) — both are quest-protocol Phase 0/1 hardening. Could be done in same sitting.

### 3. POST-#258022: Investigate "kelengkapan_maklumat" naming legacy | S
- **Entry Point**: `projects/coding-projects/active/etanah-knowledge/melaka/DOMAIN-GLOSSARY.md`
- **What to Do First**: Grep codebase for `KELENGKAPAN_MAKLUMAT_YA` and `KELENGKAPAN_MAKLUMAT_TIDAK` constants — note declaring class + every usage. Then check git blame for original commit context.
- **Success Looks Like**: New entry in DOMAIN-GLOSSARY.md explaining: kelengkapan = completeness, pembetulan = correction, why the codes mismatch the UI label, what the original use case was (likely "Adakah maklumat lengkap?"), and a flag that future devs shouldn't get confused.
- **Dependencies**: None.

### 4. Trigger broadening for ticket loading (Q1 — already at top, listed here for cross-reference) | S
- **Entry Point**: `quest/quest-protocol.md` Phase 0 + `.claude/CLAUDE.md` Quest Workflow section
- **What to Do First**: Add to Phase 0 hard rules: "When みや scopes conversation to a ticket via 'focus on <ticket>', 'continue ticket <number>', '<ticket> rework', 'let's do <ticket>', or any variant, MUST load Task folder + ticket handoff BEFORE any judgement/appraisal/proposal."
- **Success Looks Like**: Hard rule added in BOTH files. Pairs with `feedback_inventory_first.md`.
- **Dependencies**: None. **This is Q1, not Q2 — execute first.**

### 5. Plan "readability is part of simplify" rule properly | S
- **Entry Point**: `.claude/skills/simplify/` — **does not exist yet** (verified 2026-04-30). Skill lives in harness-provided skills list as `simplify`.
- **What to Do First**: (1) Run `/simplify` skill once or read its harness description to see if readability already covered. (2) If not, decide canonical home: project-level skill SKILL.md (would need creating), `quest/quest-protocol.md` Phase 1 (pre-implementation scrutiny), or `.claude/CLAUDE.md` general rules section.
- **Success Looks Like**: Rule placed in ONE canonical home (universally phrased: mental load, mirror in-file patterns, BA-domain terminology in comments). The premature addendum in `feedback_simplify_and_reference.md` removed.
- **Dependencies**: None — but **architecturally pairs with #16 (Feedback architecture refactor)**. Both share the "rules need canonical homes" root cause.
- **Notes**: There's no project `.claude/skills/simplify/` directory; the `simplify` skill is harness-built. Decide if a project-side wrapper SKILL.md is the right home.

### 6. Class chain / call flow for Lite SMB Pembetulan | S
- **Entry Point**: `projects/coding-projects/active/QA-258022/DEBUGGING-WALKTHROUGH.md` + `LITE-URUSAN-SEMAKAN-FLOW.md`
- **What to Do First**: Read both #258022 docs. Build the chain doc per CLAUDE.md class-chain rule: `mlkSemakanMaklumatPanel.xhtml jenisKeputusanRadio listener → BasePelupusanLiteForm.onChangeTindakanKeputusan() → onRepopulatePegawaiAgih() → MlkPelupusanPegawaiAgihService.retrievePerananPegawaiAgih() → 5-table peranan SQL`.
- **Success Looks Like**: New file `projects/coding-projects/active/QA-258022/CLASS-CHAIN-LITE-SMB.md` with chain + the Ya/Tidak branch-divergence point annotated.
- **Dependencies**: None — all source files exist and validated.

### 7. Friday recap: QA #258022 debugging walkthrough | M
- **Entry Point**: `projects/coding-projects/active/QA-258022/DEBUGGING-WALKTHROUGH.md` + `STORYLINE-FOR-CODE-REVIEW.md`
- **What to Do First**: Read both files start-to-end together. Surface the 4 lessons listed: composite component picking heuristic, XHTML→config bridge, option_type comparison, field shadowing trap.
- **Success Looks Like**: Walkthrough delivered conversationally — みや internalizes how to trace JSF himself. No new docs needed unless gaps surface.
- **Dependencies**: None.
- **Notes**: Best done WITH みや present — this is teaching, not solo work.

### 8. Continuous-improvement section in MD knowledge files | M
- **Entry Point**: `projects/coding-projects/active/QA-258022/PERANAN-LEARNING.md` + `etanah-knowledge/melaka/PERANAN-MAP.md` (template — already has the section)
- **What to Do First**: Open PERANAN-MAP.md, copy the "Continuous Improvement" section structure (revisit triggers + update conditions). Then plan rollout: one file per Friday — DATABASE.md → FLOWABLE-WORKFLOWS.md → BUG-BESTIARY.md → DOMAIN-GLOSSARY.md → MODULE-ARCHITECTURE.md.
- **Success Looks Like**: All 5 knowledge files have a Continuous Improvement section by 5 Fridays from now.
- **Dependencies**: None — pattern is established.
- **Notes**: Recurring item — schedule via `/loop` weekly Friday if みや wants automation.

### 9. Quest invoke cleanup | M
- **Entry Point**: `quest/quest-protocol.md` + `.claude/skills/quest/SKILL.md`
- **What to Do First**: Read both. Add to `/quest start`: (a) auto-move completed quests to Archive, (b) keep active/suspended in main, (c) if ticket matches archived quest, move it back before starting.
- **Success Looks Like**: Updated quest-protocol.md + SKILL.md. Tested by holding+resuming a fake ticket.
- **Dependencies**: None.

### 10. Quest: Pre-implementation scrutiny gate | M
- **Entry Point**: `quest/quest-protocol.md` Phase 1
- **What to Do First**: Add 5-question pre-flight checklist before any code change. Likely questions: (1) What's the predicate? (2) Where's the writer evidence? (3) Have we found the working analog (mature system)? (4) Does this SUBTRACT or ADD? (5) Did /appraise pass?
- **Success Looks Like**: Checklist embedded in Phase 1; failures surface in chat before Edit calls.
- **Dependencies**: None — but pairs with #2 (validation methodology) and #5 (readability rule placement).

### 11. SCRIPTS.md (new etanah-knowledge file) | M
- **Entry Point**: `projects/coding-projects/active/etanah-knowledge/melaka/` — does not exist yet
- **What to Do First**: Create new file. Source content: senior's base SQL script + annotations, shortform table name mapping (tgsn=tugasan etc.), ID_PENGENALAN format, working SQL patterns from #258022 (5-table peranan join, perananSemasa parsing).
- **Success Looks Like**: `etanah-knowledge/melaka/SCRIPTS.md` exists with SCOPE+NOT FOR header per framework-skeleton rule.
- **Dependencies**: None.

### 12. Move `Database/Melaka/` + `Flowables/Melaka/` into project | S
- **Entry Point**: `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Database\Melaka` and `Flowables\Melaka` → relocate to `projects/coding-projects/active/etanah-knowledge/melaka/`
- **What to Do First**: `ls` both source folders, verify contents. Plan subfolder names (`database-dumps/` and `flowables/` likely). Move via OS, update any references in knowledge files.
- **Success Looks Like**: Folders inside project. Stale OneDrive paths gone. Knowledge file links updated.
- **Dependencies**: None — pure file move.
- **Notes**: みや keeps forgetting these exist — added 2026-04-15 after second forget. Time to commit.

### 13. `etanah-knowledge/melaka/index.md` | S
- **Entry Point**: `projects/coding-projects/active/etanah-knowledge/melaka/index.md` — exists already (verified 2026-04-30)
- **What to Do First**: Read existing index.md. Audit cross-links across all 7+ knowledge files (BUG-BESTIARY, DATABASE, DOMAIN-GLOSSARY, FLOW-TRACES, FLOWABLE-WORKFLOWS, JSF-WIRING, MODULE-ARCHITECTURE, PERANAN-MAP, plus handoff-* and SCRIPTS once added).
- **Success Looks Like**: Navigation entry file with bidirectional cross-links — every knowledge file linked from index, every index entry links back to file.
- **Dependencies**: None — but should be revisited after #11 (SCRIPTS.md) lands so index includes it.

---

## Items Needing みや Input Before Execution

### 14. Re-assess skill/protocol conditions
- **Decision needed**: Which specific skills/protocols have slow Q&A patterns vs dense useful output? `/appraise` was named — are there others to audit (e.g. `/familiar`, `/quest`)? みや wanted this Friday.

### 15. POST-#258022: Peranan × Urusan × Tugasan mind map
- **Decision needed**: Output target — extend existing `etanah-knowledge/melaka/PERANAN-MAP.md` (already exists) or create new `PERANAN-MATRIX.md`? Source files are clear (BPMN + IND_TGSN + tindakan.config.json + service code) but the form factor (extension vs new file) needs みや's call.

### 16. POST-#258022: DB ERD for etanah-pelupusan
- **Decision needed**: Tool choice — tbls / SchemaSpy / dbdiagram.io? Each has tradeoffs (CLI vs web, image quality, FK rendering). みや didn't specify. Pairs with #15 — both serve "see structure at a glance".

### 17. POST-#258022: Flowable check for Lite urusan (#258022 followup)
- **Decision needed**: Whether to do this BEFORE #258022 Phase 2 wrap (per the todo note "should land in #258022 post-mortem before Phase 2 wrap") or AFTER FAT closes. Currently QA-258022 is on hold awaiting FAT retest — み or や's call on timing.

### 18. Build JSF debugging playbook
- **Decision needed**: Format — single MD file at `etanah-knowledge/melaka/JSF-DEBUGGING-PLAYBOOK.md`, or extend existing `JSF-WIRING.md`? Generalize from #258022's: DevTools inspect → grep label → composite first → form XHTML → managed bean → config layer.

### 19. Etanah-knowledge: ENVIRONMENTS.md or DATABASE.md update
- **Decision needed**: Placement — extend `DATABASE.md` or new `ENVIRONMENTS.md`? Current feedback memory `feedback_uat_fat_environments.md` covers it via auto-load. みや asked to defer the knowledgebase home decision.

### 20. CLAUDE.md trigger broadening for Etanah work
- **Decision needed**: Worth it? Currently inventory-first knowledgebase load is Quest Phase 0 only. Broadening to ANY Etanah/Melaka context risks over-triggering. みや wanted to validate before adding.

### 21. User-side learning home — decide location
- **Decision needed**: One of (a) new `learning/` folder in MemoryCore, (b) external folder + index pointer, (c) keep in coding-projects but rename. **Trigger: after 3 closed tickets OR Friday 2026-05-09**, whichever comes first. Tickets closed since flag: 257569, 257911, 256113, 255637 — count is already ≥3, but 258022 still on hold so the "current ticket queue clears" condition may apply.

### 22. Feedback architecture refactor — hook model (multi-week)
- **Decision needed**: Schedule trigger only. みや explicit scheduling required, after current Etanah ticket queue clears. Plan + risks already fully scoped in todo. **This is the parent issue for items #5 and parts of #14.**

### 23. Dev environment automation — IDE/JBoss/browser verification
- **Decision needed**: Run `/appraise` first per todo note. Suggested order from todo: (a) Quest header field for awam-vs-pelupusan + db_target, (c) browser verify via `mcp__Claude_in_Chrome__*`, defer (b) JBoss start/stop and (d) Eclipse. みや approval to start with (a).

### 24. `inscribe` skill — end-of-day ticket handover
- **Decision needed**: Skill design final-pass before implementation. First instance template exists at `Handover.txt` for #255773. Decide: separate `/inscribe` skill or fold into `/quest hold`? Pairs with future "resume ticket <QA#>" read-back.

### 25. codebase-memory-mcp on etanah-pelupusan
- **Decision needed**: Trigger — context folder must be done first (#28 below). Then evaluate. みや's call when ready.

### 26. Research GitHub repo "hermes"
- **Decision needed**: みや needs to share the specific repo link. Multiple "Hermes" repos exist (memory system, LLM, etc.) — cannot evaluate without the link.

---

## Items Pending External Trigger

### 27. Token usage optimization (Q1, listed for tracking)
- **Trigger**: Pre-emptive — do anytime, but `settings.local.json` already lean per CLAUDE.md cost rules. Audit boot cost when next save reports HEAVY session.

### 28. Context folder (`etanah-knowledge/melaka/context/`)
- **Trigger**: deps.txt was blocked on Nexus reachability. Current state: 3 of 4 done (`db-schema.md`, `et_main.sql`, `repo-map.md` exist; `deps.txt` still missing). To unblock: run `mvn -s "E:\Dev\apache-maven-3.9.9\conf\settings.xml" dependency:tree -f pom.xml > deps.txt` from etanah-pelupusan root WHEN on a network with Nexus access (172.16.90.152:8081 — likely office only).
- **Notes**: ERD also still missing (see #16).

### 29. Phase 1 vision progress review
- **Trigger**: みや requests honest assessment. Best done at week-end with quiet headspace.

### 30. Week post-mortem
- **Trigger**: End of week (Friday). Pair with #29.

### 31. MemoryCore improvements + Claude skills research
- **Trigger**: After work tickets done (token-conscious park). Threads links need laptop.

### 32. Phase 3 / Phase 4 / Phase 5 (Gemini scan / EL extractor / Ticket-driven learning)
- **Trigger**: Phased — only when current layer hits a wall per CLAUDE.md `Phased tooling` rule. Currently MCP + sub-agents layer working; Gemini layer not yet needed.

### 33. Protocol housekeeping session (from 2026-04-21)
- **Trigger**: Dedicated session to apply 4 changes — ls before Task folder create, Phase 3 Archive move (NOTE: project quest-protocol is now 3-phase, was 4-phase — see anomaly below), post-mortem forge-log annotation, per-ticket subfolder retention. Possibly stale relative to v3.0 protocol; review before applying.

### 34. Quest: auto test-record SQL
- **Trigger**: Phase 0 step already added. Smarter version (hook/template) — incremental, do when current pattern feels rough.

---

## Cross-Cutting Themes

### Theme A: "Rules need canonical homes" (the big one)
**Items #2, #5, #10, #16 (refactor parent), #19, #20, #33** — all touch the same root cause: behavioral rules and protocol rules are scattered across `feedback_*.md`, `quest-protocol.md`, `CLAUDE.md`, skill `SKILL.md`, knowledge files. The Q2 parent (#22 Feedback architecture refactor) is THE work to schedule. Smaller items (#2, #5) should NOT be done in isolation — they should be done as part of the refactor sprint or with explicit awareness of where the rule lands.

**Recommendation**: Don't dribble these one-by-one. Wait for the dedicated multi-week refactor sprint (#22), OR if a small one is urgent, drop it directly into its canonical home (quest-protocol.md / personality.md / CLAUDE.md / SKILL.md) — never into `auto-memory/feedback_*.md`. Per #22 hard rule: "don't create new files in `auto-memory/feedback_*.md`" — this is already in effect.

### Theme B: "POST-#258022 cluster" (5 items)
**Items #1 (simplify config), #2 (validation rule), #3 (kelengkapan naming), #6 (class chain), #15 (peranan matrix), #16 (DB ERD), #17 (Flowable check), #18 (JSF playbook)** — all came from one ticket. Several can be done in one focused session after #258022 FAT closes. Cluster execution avoids re-loading #258022 context multiple times.

**Recommendation**: After #258022 FAT confirmation (likely next 1-2 days), run a "POST-258022 cluster session" — bang out #1, #3, #6 in one sitting (all are S-effort, all use same context).

### Theme C: "Knowledge file maintenance" (recurring)
**Items #8 (continuous-improvement sections), #11 (SCRIPTS.md), #13 (index.md), #18 (JSF playbook), #19 (ENVIRONMENTS.md)** — knowledge file expansion. Pace via "one Friday per file" rhythm.

**Recommendation**: Establish recurring `/loop` weekly schedule: every Friday, pick one knowledge file, do the next item. Predictable cadence, no decision fatigue.

### Theme D: "Quest protocol hardening"
**Items #4 (trigger broadening — Q1), #2, #10, #33** — quest-protocol.md additions. Best executed in one session — reread protocol once, add multiple rules at once.

---

## Recommended Execution Order

Ranked by **leverage / blocking risk**:

1. **#4 Trigger broadening for ticket loading (Q1)** — already at top of Q1, prevents recurrence of today's appraisal-without-loading slip. Ship first. Cost: 15 min.
2. **#1 Simplify config — pembetulan switch** — clears one POST-258022 item, unblocks code review. Cost: 30 min, after #258022 FAT closes. **Will arrive when blocking unblocks.**
3. **#7 Friday recap: #258022 debugging walkthrough** — Friday slot already reserved by みや. High learning leverage for Phase 1 vision.
4. **#11 SCRIPTS.md + #13 index.md + #12 folder relocation** — knowledge infrastructure batch. Three S-effort items, one session, makes future ticket work faster forever. Cost: 1 hour.
5. **#22 Feedback architecture refactor planning kickoff** — biggest leverage long-term. Even just the audit pass (step 1 of 6) clarifies what canonical homes exist. Multi-week, but the FIRST session is just inventory + categorization, ~1 hour.

**Avoid starting first**: #15 / #16 (peranan matrix + DB ERD) — high token cost, decisions still needed from みや. #25 (codebase-memory-mcp) — gated by #28 context folder which is gated by network access.

---

## Anomalies Spotted

1. **Phase numbering mismatch**: Project root `.claude/CLAUDE.md` references "Phase 2: Reflect" but the Phase 3 mention from item #33 (Protocol housekeeping) and worktree `.claude/CLAUDE.md` references 4-phase (Accept/Execute/Report/Post-Mortem). Two CLAUDE.md files exist with different protocol versions. Worktree version may be older. Verify which is canonical before applying #33.
2. **Item #53 in source ("MemoryCore improvements")** appears twice in Q2 — one listed at line 52 ("MemoryCore improvements + Claude skills research") and another at line 53 ("MemoryCore improvements"). Likely duplicate that grew separately. Consider merging on next save.
3. **Items #54/#65 ("Claude skills/features research")** — the Learning row at line 54 and Learning row at line 65 (Hermes repo) overlap conceptually. Hermes is the specific instance of the general skills-research item.
4. **`.claude/skills/simplify/` does not exist as a project file** — but `simplify` is listed as available in the harness skill list. Item #5's plan to "read existing skill" needs to know this is a harness skill, not a project file.
5. **3+ closed tickets count met for #21** — 257569, 257911, 256113, 255637 all closed. Decision trigger condition (a) is met; condition (b) Friday 2026-05-09 not yet. みや can decide #21 NOW if he wants.
6. **#258022 cluster doc paths** — `SESSION-HANDOFF-2026-04-30-AM.md` exists alongside `handoff-258022.md`. Two handoff files. The active.txt references both — they're complementary, not duplicates, but verify naming pattern is intentional before next ticket.

---

*Total Q2 items prepped: 26 active + 8 already noted as done/closed/Q1/Q3 cross-listed.*
