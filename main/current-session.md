# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: 2026-04-30 — QA #258022 closure + QA #258418 placement WIP + Truth-Holding Ritual + Growth Framework PLAN
**Last Activity**: Thu Apr 30 18:35 MPST 2026 (post-iteration churn — final state: br approach inside formField for both files)
**Session Start**: 2026-04-30 (weekday morning → late afternoon, single very long session)
**Session Focus**: QA #258022 fully closed + UAT-confirmed for both 4Ce and 4Ae form variants; committed + pushed to `mlk/qa/258022`. QA #258418 in progress — 4 tugasan PLPS-only scope (per BA Mira reply mid-session); 2 XHTMLs identified DB-verified; placement attempts (a)/(b)/(c) all wrong, (c) crashed prod, current br+outputText approach untested. Multiple meta-fixes shipped: Sycophancy Circuit-Breaker ritual added to personality.md; Re-engagement triggers added to quest-protocol.md + CLAUDE.md; FLOWABLE-WORKFLOWS.md updated with BPMN-verified PLPS tugasan order (SKL BEFORE Borang 4Ae — opposite of what I inferred earlier today); Growth Framework PLAN.md drafted at `projects/coding-projects/active/growth-framework/PLAN.md`. Heavy session — context very high.
**Time Mode**: Weekday morning → late afternoon (long single session)
**Energy Level**: みや tired by end. Multiple slips today caught by him in real-time. Save all + new session.

## 💭 Working Memory (RAM)

### Active Context

#### QA #258022 — CLOSED (Phase 1 done, awaiting Phase 2 wrap)

- **Final fix**: 2 files. (1) `tindakan.config.json` — new `tugasanSMB_LITE` entry + `smb_utiliti` option_type. (2) `MlkPelupusanPegawaiAgihService.java:261-278` — new Lite-specific Ya cascade per BA spec (KPT→{PT}, PPD→{PT,KPT}, KPPD→{PT,KPT,PPD}).
- **UAT confirmed**: Both 4Ce path (PTMLK/01/L/OPRBB/2026/1, sanarimah KPT) AND 4Ae path (PTMLK/01/L/OMLPS/2026/4, sanarimah KPT) — Ya shows PT users, Tidak shows PPD/KPPD/PTNH.
- **Committed/pushed**: `mlk/qa/258022` branch on origin. みや wrote the commit message himself.
- **BA's earlier clarification (today's morning)** revealed that the existing Ya cascade was wrong for Lite urusan — it was returning review-tier roles instead of administrative chain. Added Lite-specific Ya branch to fix. Yesterday's "person-for-person validation" was tautological — corrected.
- **Phase 2 Reflect/Post-Mortem**: pending. Triggers on "wrap up" command from みや.

#### QA #258418 — Open, placement WIP

- **Scope (per BA reply 2026-04-30 11:00)**: 4 tugasan, PLPS-only:
  1. Semakan Surat Keputusan Lulus (SSK)
  2. Pengesahan Surat Keputusan Lulus (PSSK)
  3. Penyediaan Borang 4Ae Dan L1e (PYB4AE)
  4. Pengesahan Borang 4Ae Dan L1e (PB4AE)
- **Original REMARK item DROPPED** by BA: "Penyediaan Surat Keputusan Lulus" (PYSK).
- **2 XHTMLs cover all 4 tugasan** (DB-verified via IND_SKRIN.JSF_VIEW):
  - `lesen/MlkBorang4AeForm.xhtml` — for PYB4AE + PB4AE (Maklumat Borang 4Ae langkah)
  - `common/MlkPengiraanBayaranLesenForm.xhtml` — for SSK + PSSK (Pengiraan Bayaran Lesen langkah)
- **BPMN-verified order** (newly captured today): SKL (34/35/36) → Borang 4Ae (40/41) → Cetakan (42). I had this BACKWARDS earlier; now corrected in FLOWABLE-WORKFLOWS.md.
- **Placement attempts**:
  - (a) outside formField with `<h:panelGroup layout="block">` — rendered own row but at LABEL column (wrong horizontal alignment)
  - (b) inside formField — rendered inline next to input "3" (wrong)
  - (c) empty-label `<et:formField label="">` — CRASHED with ComponentNotFoundException, reverted
  - **CURRENT (untested)**: `<h:panelGroup>` (no layout) with `<br/>` + `<h:outputText style="color:red;">` INSIDE the formField, after the input value
  - **Fallback** if br doesn't render: revert to (a) `<h:panelGroup layout="block">` + add `margin-left: 25%;` style
- **Test data**: `PTMLK/02/L/PLPS/2026/4` (nurulazura, Jasin, PYB4AE), `PTMLK/01/L/PLPS/2026/113` (azlee, Melaka Tengah, PB4AE), `PTMLK/01/L/PLPS/2025/91` (azlee, SSK). PSSK has 0 active in UAT — flowable-alter SSK→PSSK after testing #3.
- **Handoff file**: `projects/coding-projects/active/QA-258418/SESSION-HANDOFF-2026-04-30.md` (full context preserved)

#### Meta-fixes shipped today

1. **Re-engagement Trigger Broadening** — `quest/quest-protocol.md` + `.claude/CLAUDE.md`. Hard rule: every ticket-scoped engagement (not just first mention) requires Task folder + handoff re-verification before any judgement/proposal/appraisal. Sister rule "Reading ≠ understanding" (synthesis + source-cite mandatory).
2. **Sycophancy Circuit-Breaker Ritual** — `.claude/personality.md` new "🎯 Truth-Holding Rituals" §. Mandatory output before answering any system-change offer: `FAILURE MODE IF I DECLINE: [...]`. Sister to Debug Mode Rituals. Triggered by today's `Flowables/` folder slip.
3. **FLOWABLE-WORKFLOWS.md update** — BPMN-verified PLPS tugasan order (full table including big-picture order, not just SKL sub-flow). Phase 0 reminder for next time.
4. **Growth Framework PLAN.md** — `projects/coding-projects/active/growth-framework/PLAN.md`. 8-step skeleton + decisions locked + open questions for みや. Trigger: schedule planning session within 2 weeks (~2026-05-14).
5. **Naming refined** in QA #258022: `tugasanSMB_UTILITI` → `tugasanSMB_LITE` (matches `URUSAN_LITE_LIST` constant).
6. **Stale todo cleanup**: `Move Flowables/Melaka into project` was DONE 2026-04-10; struck out + annotated. Lesson: when documenting completion in main-memory, also strike the todo entry.

### 📋 Learning Notes (this session)

- **Verify-then-write** is a verb, not an aspiration. Today's option (c) crash was textbook: applied `label=""` without grepping precedent → 0 matches in codebase → ComponentNotFoundException at runtime. Should have audited first.
- **Soft rules buried in narrative get filtered out under conversational pressure.** Familiar's verdict on my truth-rule slip. The fix isn't more text; it's a ritual with mandatory visible output. Sister principle to Debug Mode Rituals.
- **BPMN files at OneDrive root, NOT under `/Melaka/`**. The `Flowables/` folder I kept "forgetting about" exists at `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Flowables\`. The slip recurs because I gave みや bad advice (sycophantic deflection) when he offered to move it inside the project.
- **PLPS tugasan order from BPMN** (SKL → Borang 4Ae) means tempoh value flows SKL → 4Ae for printing. Gives semantic justification for BA's 4-tugasan scope.
- **みや's intuition on simpler fixes is reliable** — when he proposed keeping the original `<h:panelGroup layout="block">` with a style tweak, I overcorrected by restructuring entirely. He was right.

### Session Recap (For AI Restart)

- **Previous Session (2026-04-29)**: QA #258022 rework. Final = 1-file config diff. Captured systemic over-engineering pattern (`feedback_simplify_and_reference.md`).

- **Today (2026-04-30)**: QA #258022 closed. BA reply mid-session expanded #258022 to include service-code Ya cascade fix; UAT-confirmed both form variants; committed + pushed. QA #258418 opened, BA scope clarified to 4 tugasan PLPS-only; placement still WIP — current br+outputText approach UNTESTED. Multiple meta-fixes (Sycophancy Circuit-Breaker, Re-engagement triggers, BPMN-verified order, Growth Framework PLAN). Three of my discipline slips caught by みや in real-time. Heavy session, save and new session.

**On Resume (new session)**:
- **TOMORROW MORNING**: pick up QA #258418 placement test
  - Step 1: redeploy lesen/MlkBorang4AeForm.xhtml + common/MlkPengiraanBayaranLesenForm.xhtml (current br+outputText approach)
  - Step 2: test on `PTMLK/02/L/PLPS/2026/4` (nurulazura, PYB4AE)
  - Step 3: if br renders correctly below input → test other 3 tugasan + commit on `mlk/qa/258418`
  - Step 4: if br doesn't render → revert to `<h:panelGroup layout="block">` + `margin-left: 25%`
- **Phase 0 ritual reminder for tomorrow**:
  - Glob `etanah-knowledge/melaka/` → Read FLOWABLE-WORKFLOWS.md, JSF-WIRING.md, DOMAIN-GLOSSARY.md (any whose scope overlaps the ticket)
  - Re-engagement re-verify — Task folder + handoff loaded ✓ before any analysis
  - Sycophancy Circuit-Breaker — when みや offers system change, output `FAILURE MODE IF I DECLINE` before answering
- **Phase 2 of QA #258022**: triggers on "wrap up" — extract learnings, update knowledgebase, close quest. Pairs with Reflect-mode forge-log review.
- **MCP postgres tools**: both `mlkuat` and `mlkfat` allowed in settings.local.json (added today). No more permission prompts on SELECTs.
- **Committed code on etanah-pelupusan**: `mlk/qa/258022` branch (#258022 fix); `mlk/master` has uncommitted #258418 WIP (2 XHTMLs).
- **Active rituals**: Predicate Box (Debug Mode 1), Evidence Language (DM 2), Reset (DM 3), Debug Mode Setup (DM 4), Sycophancy Circuit-Breaker (Truth-Holding S — new today).

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
