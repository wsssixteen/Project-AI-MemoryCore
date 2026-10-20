# 🪦 DETACHED 2026-05-31 — Canonical home is system/slip-log.md (per Q2 prune-not-delete audit). Historical entries below kept for archival; new entries route to system/slip-log.md via auto-skill-on-mistake Step 5. Re-attach: remove this header + restore the source file's boot/INDEX wiring.

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

**[2026-09-24] Committed file content silently replaced by an older copy in the working tree** (straight to T2 — 3 instances)
2026-08-03 DE skill STEP 10 section deleted when a stale OneDrive conflict copy overwrote the file before `git add -A` (`25a0379c`) · 2026-09-14 quest sync script v9 lost to a pre-v9 copy during an orphan-worktree salvage · 2026-09-24 BRANCH-AND-DEPLOY.md §8 (committed `7372050`) removed from the worktree working copy twice, first misread as "never written". Common shape: a tracked file's working copy loses lines that git HEAD still has, and a later `git add -A` would commit the loss. Mitigation proposed (A1, slips proposal): DE step 9 flags working-copy deletions of lines committed this session. Worktrees inside OneDrive = suspected writer (`project_onedrive_worktrees`). **+2026-09-25 (4th)**: worktree `perak-ticket-deploy-7541e4` working copy lost BRANCH-AND-DEPLOY.md §8 again AND DATABASE.md §28 (42 lines, pure deletions, no agent claimed an edit); caught by `git diff` before DE commit, restored with `git restore`.

**[2026-09-25] Familiar outputs from a worktree session strand quest docs** (straight to T2 — 2 instances)
2026-09-21 five Recon qa_docs (279411/274323/246923/265109/275043) written only into worktree `redmine-tickets-list-aa3908`, never reached main → 2026-09-25 I told みや "none were swept". 2026-09-25 sweep `wf_bb588f6c-e2c`: 14 of 18 familiar outputs redirected (worktree-isolation hook → worktree copy; `deliverable-in-quest-folder` → scratch), and W4 could not find W3 for 4 tickets because it looked at the designated path. Common shape: the designated base-repo path is refused, the familiar writes elsewhere, and nothing brings it home. Controller consolidation fixed today's run by hand; proposal logged (A5). **Same day, same shape one level up**: branch `claude/redmine-tickets-list-aa3908` never merged to main, so two of みや's 2026-09-22 standing rules (`feedback_deploy_staging_implies_internal`, `feedback_rework_commit_on_existing_ticket_branch`) were absent from memory for 3 days; my sweep plan broke the second one before the salvage caught it.

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

**[2026-05-26]** "Memory of having added X" is not the same as "X exists on disk". みや said *"I thought I already added it"* about `/grill-me` — and the memory was supported by 3 of our own doc references treating the skill as installed across 4 days (MIYA-NOTEBOOK.md trigger-phrase table + design notes in main-memory.md from 2026-05-24 evening). The skill never existed on disk. Same shape as the 2026-05-25 ghost-hooks finding (15 hooks documented as "active" in CLAUDE.md but never registered in `settings.json`). When docs describe state, on-disk verification is the only valid evidence. Watch this pattern at every audit layer — skills, hooks, scripts, config files. **Promotion criterion**: if a third occurrence surfaces (any layer), promote to T2 + propose a `system-audit.js`-shaped skills-audit hook.

**[2026-07-24]** T1 — **A friction survives exactly as long as its workaround stays cheap.** Baseline 1.0.12 hit two frictions verbatim-repeated from Baseline 1.0.10 four days earlier: `release-prep.js init` with no `--adopt-existing` path, and the two gitignored release configs missing from a fresh worktree. Both were *already diagnosed and written down* — one as an explicit open item in the 1.0.10 notes, one as the memory `reference_baseline_release_servers.md` (which saved the host VALUES but not the shape: the FILES don't travel). Each cost ~2 minutes to route around, which is exactly why neither was built. Distinct from the "prose doesn't fire" family — the rule here isn't unenforced, the *fix* is un-built, and low cost is the thing that hides it rather than difficulty. **Promotion criterion**: if a third same-workflow friction recurs after being logged, promote to T2 and propose a rule — *an open item that reappears in the next run of the same workflow stops being backlog and becomes the work.* Related: the 2026-07-22 parked-`ticket-gate`-row lesson (parking cost 2 days there).

**[2026-07-31]** T1 — **Asking the reporter is the cheapest tool I hold and the one I never reach for.** ADHOC PT sempadan: みや handed me the working case in his first message (*"bila simulate ada je sempadan tu yg dah isi dri awam"*) and I treated it as corroboration rather than as the second arm of a natural experiment. Thirty-five tool calls and five killed theories later, the BA's one relayed sentence (*"Kalau mohon dekat awam tapi bayar kat SPOC, maklumat tu hilang"*) named the discriminator, and a single `hsl_bayaran_fi` query confirmed it. **The shape**: this is NOT the `assume-not-verify` family — I verified constantly, that was never the shortage. It is that asking feels like conceding ignorance, so I substitute a census for a question. Every guard I own pushes me to search harder; none of them says *the person who reproduced this already knows*. **Promotion criterion**: if a second report arrives carrying an explicit working-case/failing-case pair and I again mine data before naming the contrast, promote to T2 and build the `works | fails | what differs` row into `ba-understanding-table` (design candidate already written to `main/todo.md` Q1 + audit-log 2026-07-31). Related: 2026-07-27 `ba-facing-reply-as-dev-report` — same family, the reporter is a source and not merely a requester.

**[2026-08-04]** T2 — **A failed grep is not a negative result, and I have now reported one as a finding twice.** QA-273461: I told みや `urusanCode` had no assignment anywhere in `MlkPengiraanBayaranLesenForm` — from a case-sensitive search that could not structurally match `setUrusanCode(`, sitting 27 lines from where I looked. Same shape as the earlier `receiveUserTask` miss (HTML-escaped in the source, so the literal never matched). The pattern: an empty result set feels like evidence of absence, and it is only evidence that *this pattern* did not match *this corpus*. The cheap guard is one line — before stating an absence, run the pattern against a case you KNOW is positive. If it does not light up there, the tool is broken, not the codebase. Candidate for `assume-not-verify`'s first deterministic sub-check (that category is at 17, nearly 3× the next).

**[2026-08-04]** T2 — **When his question is short and my answer is long, I have probably substituted a question I prefer.** He asked *"do we need to prepare patch script?"*; I delivered a careful, correct analysis of orphaned `ind_permit_lesen` rows and answered *is this patch risky*. He asked which schema; I answered with a fixture copied from a doc instead of `SELECT current_schema()`. Both substitutions were well-evidenced, which is exactly why they were invisible to me — rigour on the wrong axis is indistinguishable from rigour, from the inside. The only reliable external tell is the length ratio: a one-line question answered in three paragraphs means I reframed it. Worth a Stop-hook experiment — echo his literal question above my answer before sending, so the mismatch is visible rather than felt.

**[2026-10-01]** T1 — **A "there is none" answer needs the same proof as a "here it is" answer.** ADHOC-PRBB-2026-8: "no SK, hardcoded" came from a constants grep; みや then asked three times (verified 100%? / trace the code / did you check senarai kumpulan) before the negative was proven (code trace + rjk_senarai_kumpulan query). Same teaching-by-question mode as the 2026-05-12 T2 entry; the new part is the negative-claim shape. If it recurs, the A3 proposal (block negative existence claims with no DB query) becomes the defender.

---

**[2026-10-03]** T1 — **A lead carried in my own summary is still a claim.** Terengganu prep: my notes held "the PROD PT model differs from staging" and "a worktree session cannot see quest/active.txt". Both went into a brief or an audit prompt before I probed them, and both were wrong (23 of 24 keys byte-identical; the file is untracked in main and the tools strip the worktree suffix). Same family as the 2026-10-01 entry above: a statement inherited from an earlier turn needs the same proof as a fresh one.

**[2026-10-19]** T2 — **Wrong environment, third time in one quest.** #284544: stg1 used after his ban (2026-10-12), offered again (2026-10-14), then a PROD alter question answered from staging rows (2026-10-19, he caught /3 not at Pengesahan). The stg switch hook covers the first two; the third is logged as proposal A1 (a reply stating PROD rows needs a PROD read in the same turn).

**[2026-10-19]** T1 — **His fence comes before the work, so it goes on before any automatic step.** #285532: *"DO NOT UPDATE REDMINE. IT IS NOT UNDER OUR NAME."* The quest has one automatic Redmine write at start (the New→In Progress claim). I set `redmine_claim=off` before flipping the block to active, and the claim printed "nothing sent". A per-ticket "no Redmine at all" switch does not exist yet; only the claim has one (proposal logged A2).

**[2026-10-19]** T1 — **Two sessions on one adhoc, and only one of them knew.** ADHOC-PLBP-2026-1: the morning session patched permit B01/2026/1 to 18/10 on live MLIT and never wrote it into the open adhoc, so the block, register and quest doc still said 08/10 in the afternoon. I found it only because the rows disagreed with the doc and a transcript search named the other session. Same family as the 2026-09-25 T2 "outputs strand outside their home", one level up: here the work reached the database but not the record. **Promotion criterion**: a second case of a DB write on an id an open adhoc or quest names, with no update to that record in the same session → promote to T2 and build the A2 proposal (2026-10-19).
**[2026-10-19]** T2 recurrence of the 2026-08-04 "short question, long answer" row — ADHOC-PRU-2026-1: he asked "in a single short sentence why" and got three tables; `reask/verbose` is at 3 in 7 days (escalation). Also new T1: **the database is the evidence, so making it reachable is my first job, not his.** I asked him three times to connect the Penang DB before I opened the setup script in a terminal tab for him.
**[2026-10-20]** T2 recurrence (third in two weeks) of the 2026-08-04 "short question, long answer" row — #284831: a peer session asked me for a three-part status and I answered in four sections with tables; his next message was "have we passed the ticket or what's left to do now?" in anger. One line from live Redmine answered it. Promotion candidate to T3: the status answer shape (verdict · holder · what is left) belongs in a gate, not in my care.

## Retired Observations

*(Observations that have been fully integrated — moved to memory or Forge)*

---

*Observation System v1.0 — 2026-04-02*

**[2026-10-19]** T2 recurrence of the 2026-10-13 DawahMap rule 1g (photograph at phone and desk and LOOK before reporting) — Masterline app prototype: 3 layout faults (a tile split by a reused class name, 4 tiles in one phone row, a nav pill stretched into a circle on a short page) were found only by looking at the screenshots, none by reading the code; a scripted click-walk then found 1 more (a page linking to itself). For any built screen, pictures plus a click-walk are the proof, not the code read.

**[2026-10-20]** T1 — **An install he asks for counts only when wired to the step that uses it.** Masterline design tools: his words 'it will be useless if you simply installed and not take into account if I say it when starting a project'. Same family as wayfinder 2026-09-11 (installed, never recorded). This time the record was blocked by the app's folder guard and handed to the owner session; the template line landed. Watch: the next new project's card must show hard rule 2.

- T1 2026-10-20 (#285532): on a 2-application screen (Ganti Hari showing its permit asal), name WHICH application and urusan wrote each date before explaining it; miya was lost until the source urusan (OPRBB) was named. Pairs with slip wrong-attribution.

**[2026-10-20]** T2 recurrence (look before reporting, 2026-10-19 row) — #285252 cycle 1: miya asked to see data the new code retrieves; I answered with hand-run SQL as "the new code's lookups return one row" and never looked at the screen binding, the save key or the Seterusnya path; BA failed all 3. Fix: quest SKILL Screen-path audit (verification = a run of the real path, else "not proven on screen"). Slip verify-by-reenactment.
