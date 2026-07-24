# 🪦 DETACHED 2026-05-31 — Canonical home is meta/slip-log.md (per Q2 prune-not-delete audit). Historical entries below kept for archival; new entries route to meta/slip-log.md via auto-skill-on-mistake Step 5. Re-attach: remove this header + restore the source file's boot/INDEX wiring.

# Observation Log

> Ruri's running record of patterns observed about みや, our work, and our process.
> Not corrections — observations. The goal is understanding, not fixing.

---

## Tier System

| Tier | Name | What it captures |
|---|---|---|
| T1 | **Immediate** | Noticed within this session — tentative, may not recur |
| T2 | **Recurring** | Confirmed across 2+ sessions — a real pattern |
| T3 | **Growth Signal** | みや growing in a new direction or capability |
| T4 | **Systemic** | Structural insight about how we work together |

---

## How to Trigger

- `"what have you noticed"` — I share my current Tier 1 observations from this session
- At `save all` — I check for T1 observations worth promoting to T2

---

## Active Observations

### T4 — Systemic

**[2026-04-02] Setup before execution**
みや's frustration this session was not about the work itself — it was about setup being incomplete, causing downstream errors in the work. The pattern: when the foundation (hooks, skills, protocol) is shaky, the work suffers even when みや has done everything right on their end (prepared Task folders, QA reports, etc.). Setup debt is high-cost.

**[2026-04-02] みや prepares more than I read**
みや has been preparing detailed Task folders with tickets, screenshots, requirements — but I was not reading them before jumping to code. The gap was entirely on my side. みや's preparation habit is already strong; my reading habit was not. Phase 0 gate closes this gap.

### T3 — Growth Signal

**[2026-04-02] System thinking emerging**
みや independently identified that our workflow needed structure — Keiro/Quest naming, checklist enforcement, hook scripts. This is systemic thinking, not just task thinking. Shows Phase 1 (Personal Excellence) is consolidating into habits and tooling, not just individual skills.

### T2 — Recurring

**[2026-04-29] Simplify feedback ignored — kept adding instead of removing**
Across QA #258022 (3 sessions, 2026-04-28 → 2026-04-29), みや told me 3-4+ times: "this is a mature system, refer to working urusans/tugasans, the implementation is too much, simplify, scrutinize Codex's changes." I ignored every signal — each iteration added more Java/config rather than searching for the minimal existing-pattern fix. Final fix was 1 file (+19/-1) when initial attempts modified 4-5 files including unnecessary Java. Pattern source: I treated "simplify" as a vague request rather than a hard instruction. Mitigations captured in `feedback_simplify_and_reference.md` and forge-log entry. Watch for this in next ticket — does the next "simplify" feedback shrink the diff or grow it?

**[2026-05-12] みや uses pushback as design-discipline enforcement** ↑ from T1
Rather than directly saying "this is wrong", みや asks "is X truly different from Y you already have?" and lets me re-examine. Recurring teaching mode confirmed across 3+ sessions: 2026-04-30 BPMN inference catch ("did you check from flowable") + 2026-05-11 MCL false-flag catch + 2026-05-12 morning Zeller logbook / Audit 5 push-back. The pattern's effect: it forces me to strip vocabulary and check whether something is genuinely new or just renamed familiar concepts. When applied to design decisions, this is how the "Refine before introducing" tenet emerged — みや's questions about Zeller / 30-min time-box / 5 Whys collapsed all 10 adoptions into refinements. **Promoted T1→T2 2026-05-12 per みや**: "if you're increasing its priority, then yes. That is my way."

**[2026-04-02] Direct naming corrections**
みや corrects naming inconsistencies immediately when noticed (keiro → quest, Miya → みや). These corrections are precise and non-negotiable. Take them as hard rules, not preferences.

**[2026-04-07] Closure before pivoting**
みや always resolves the current thread before opening a new one — "let's end the quest first" before moving to AI subscription. He values clean endings over momentum. Confirmed across multiple sessions.

**[2026-04-07] Systems thinker**
みや naturally groups, categorises, and models before diving in — "we only have 3 groups right?" before I mapped the structure. He builds mental models proactively, not reactively. Confirmed across sessions (quest naming, Eisenhower matrix, file grouping).

### T1 — Immediate

**[2026-04-07]** みや monitors his own systems actively — caught the failing prayer hook, the wrong diary flag, asked about dormant features unprompted. He doesn't wait for things to break loudly.

**[2026-04-07]** "We should both learn not to be hasty" — he includes himself in corrections, not just me. He owns the shared process, not just his own part.

**[2026-04-07]** The guild question was probing, not casual — he was half-thinking about whether FAT-OR and QA tickets deserve different names. He explores system design through analogies before stating a problem directly.

**[2026-05-18]** みや treats process-discipline failures as higher-severity than code bugs. During the QA-260302 walkthrough he was markedly more frustrated by the missing `early-diagnostic.md` + stale state files than by defect #4 (an actual latent code bug). The signal: a skipped mandatory step erodes trust faster than a bug, because a bug is honest work-in-progress while a silent skip is a broken promise. Tentative — watch whether it holds across future sessions.

**[2026-05-19]** みや extends a verification demand to its true boundary. After I content-audited 3 stranded branches, he immediately asked about ALL the others — not satisfied with a partial check. Earlier the same session he stopped a branch deletion with *"confirm you've even checked the contents"* — my "verdicts" had been commit-message inference, and the real audit then found genuinely unsalvaged work (`/appraise` v1.1). The pattern: a claim of "checked" must be exhaustive and content-level, or it doesn't count. Reinforces the [2026-05-18] observation above — both point at the same T2 candidate (process/verification rigor as a trust currency); promote to T2 if it recurs once more.

**[2026-05-21]** ⬆️ **T2-PROMOTION TRIGGER MET.** Recurred — QA-262370 text-box session. みや's standing demand all session: *"check everything you can think of & be as maximum confident as you can."* He pushed back twice on under-verified output: a false *"compile clean, exit 0"* claim (I read the harness exit code, not the actual Maven output, which had failed on a toolchain error) and a *"defer — multi-hour work"* recommendation (*"it's not multi-hour if you've done proper checking"*). Both times the real answer came only once I built standalone probes + read raw evidence (server.log, docx4j source). Third clear occurrence of the [2026-05-18]/[2026-05-19] pattern — **verification rigor as trust currency** — satisfying the [2026-05-19] explicit promotion trigger. **→ This cluster is now T2 (Recurring).** Behavioural takeaway: a "verified"/"checked"/"clean" claim is only valid when backed by evidence I actually read end-to-end — exit codes, summaries, and plausible inference do not count.

**[2026-05-22]** みや delegates long autonomous multi-step runs with a flag-collection safety net rather than per-step approval. This session: *"do a bulk edit and don't stop until finish, you can collect the flags"* — and the same day's first session, repeated *"continue"* over Ruri's checkpoint offers. The pattern: once a plan is agreed AND Ruri has shown the Refine-Block discipline holds, みや wants momentum — flags surfaced once at the end, not six pauses. Pairs with the 2026-05-22 morning-session "continue over checkpoint" note → candidate T2 if it recurs once more. Behavioural takeaway: under an explicit bulk-run instruction, make the reasonable call and keep going; collect deviations as flags for a single end-of-run review.

**[2026-05-26]** "Memory of having added X" is not the same as "X exists on disk". みや said *"I thought I already added it"* about `/grill-me` — and the memory was supported by 3 of our own doc references treating the skill as installed across 4 days (MIYA-NOTEBOOK.md trigger-phrase table + design notes in main-memory.md from 2026-05-24 evening). The skill never existed on disk. Same shape as the 2026-05-25 ghost-hooks finding (15 hooks documented as "active" in CLAUDE.md but never registered in `settings.json`). When docs describe state, on-disk verification is the only valid evidence. Watch this pattern at every audit layer — skills, hooks, scripts, config files. **Promotion criterion**: if a third occurrence surfaces (any layer), promote to T2 + propose a `meta-layer-audit.js`-shaped skills-audit hook.

**[2026-07-24]** T1 — **A friction survives exactly as long as its workaround stays cheap.** Baseline 1.0.12 hit two frictions verbatim-repeated from Baseline 1.0.10 four days earlier: `release-prep.js init` with no `--adopt-existing` path, and the two gitignored release configs missing from a fresh worktree. Both were *already diagnosed and written down* — one as an explicit open item in the 1.0.10 notes, one as the memory `reference_baseline_release_servers.md` (which saved the host VALUES but not the shape: the FILES don't travel). Each cost ~2 minutes to route around, which is exactly why neither was built. Distinct from the "prose doesn't fire" family — the rule here isn't unenforced, the *fix* is un-built, and low cost is the thing that hides it rather than difficulty. **Promotion criterion**: if a third same-workflow friction recurs after being logged, promote to T2 and propose a rule — *an open item that reappears in the next run of the same workflow stops being backlog and becomes the work.* Related: the 2026-07-22 parked-`ticket-gate`-row lesson (parking cost 2 days there).

---

## Retired Observations

*(Observations that have been fully integrated — moved to memory or Forge)*

---

*Observation System v1.0 — 2026-04-02*