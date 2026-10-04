---
name: Simplify means subtract — reference working examples in mature systems
description: "working analog first, simplify = shrink; null bug = lifecycle first; loggers with fallback probes; safety gate before test; bundle not defer; run fully"
type: feedback
originSessionId: 9a250643-8b07-48d4-8408-3e2fb4b02911
---
**Rule**: Etanah is a mature system — most patterns are already solved somewhere. Before adding any new fix, find the closest working analog (urusan/tugasan combination) that solves a similar problem and read its config + code path. Match the existing shape. When みや asks to "simplify" or says the implementation is "too much," the next iteration's diff MUST shrink — fewer files, fewer lines. If you're adding code after a simplify feedback, you're misreading the feedback.

**Why:** During QA #258022 (3 sessions, 2026-04-28 → 2026-04-29), みや repeatedly told me:
- "This is a mature system — things are catered for"
- "Refer to other working urusans/tugasans"
- "The implementation is too much"
- "Simplify"
- "Scrutinize Codex's changes — don't just refer to them"

I ignored every one of those signals. Each iteration ADDED more code instead of removing it. Final accounting:
- Attempt 1: wrong tugasan codes (SB4CE) + wrong bean — broken
- Attempt 2: extended `tugasanSMB_ALL` with Lite codes (without reading what `smb_all` option_type rendered → caused FAT failure with Tindakan Seterusnya pollution); added 2 redundant Java fixes (Fix 2 in BaseLiteForm.initData, Fix 3 in 4Ce.initEditModeBorang); added TGSN_*_ALL constants; rewrote onChangeTindakanKeputusan dispatch — all scope creep
- Attempt 3 rework: reverted everything Java, created `smb_utiliti` option_type
- Final fix: 1 file, +19/-1 lines

The fix should have been 1 file from day 1. The existing handler chain in master already covered Lite SMB correctly — the bug was a single missing config entry. Three days were burned because I kept adding fixes instead of looking for the minimal one in the existing patterns.

**How to apply:**

1. **Reference before writing** — for any fix, find an existing working (urusan + tugasan) entry in the relevant config (`tindakan.config.json`, `tugasan.config.json`, etc.) that solves a similar shape. Read its `option_type` definition. Read the code path it triggers. Verify your fix follows the same structure. **Do not invent new option_types or new constants when proven ones exist.**

2. **Simplify means SUBTRACT** — when みや says "this is too much" or "simplify" or "you're over-doing it":
   - The next response must show what was REMOVED, not what was added
   - Diff size goes DOWN, not up
   - If you can't find something to remove, ask みや what specifically he wants removed before adding anything
   - Win condition: fewer files modified, fewer lines, less surface area

3. **Scrutinize, don't trust generated code** — Codex / Cursor / other AI-generated code is a STARTING POINT, not a reference of truth. Walk every line:
   - Are tugasan codes correct? Verify against actual application data via SQL (entity-first rule from CLAUDE.md)
   - Are option_types extended correctly? Read the option_type definition before adding to its `included_urusan_list`
   - Is the field being set on the right object? Check for shadowing (Java fields are not virtual — see QA #258022 4Ce private adaPegawaiAgih)
   - Has someone else fixed this already? `git pull` and check before writing parallel work

4. **For mature-system bugs specifically** — assume the framework already handles your case until proven otherwise. Search for working examples first. The bug is usually:
   - Missing config entry (not missing code)
   - Wrong code in a config entry's `included_urusan_list`
   - Pointing at the wrong option_type
   The fix is rarely "add new Java." The Java is usually already there.

**Concrete example — QA #258022:**
- Symptom: Pembetulan + Agihan Kepada don't render for Lite SMB
- Root cause: missing `tugasan_list` entry in `tindakan.config.json` for Lite + SMB
- The complete fix: 1 new tugasan_list entry + 1 new option_type definition + remove Lite from wrong existing entry
- What I added that was unnecessary: 4 Java file modifications, all reverted
- Time cost: 3 days vs. the 1 day this should have taken

**Self-check trigger**: every time I'm about to add a Java fix to a JSF/PrimeFaces ticket, ask: "Is there a working analog in the config that solves this same shape? Have I read its option_type definition? Has anyone already done this in a recent commit?" If I haven't checked, I haven't earned the Java change.

5. **Team-lead's literal fix-shape instruction is the default starting point** (added 2026-05-20 after QA-262370 Option-A miss): When the assigning senior (Aaron, BA-prep journal, Pull Request reviewer, etc.) literally names the fix file or fix layer in their handoff note, that IS the working analog — start there. Deviating to a different fix-shape requires an EXPLICIT business-logic justification stronger than "safer / more reversible / smaller surface" — those are aesthetic preferences, not evidence. **Why** (2026-05-20 QA-262370): Aaron's journal said *"as long as you adjust in suratHeader docx. should fix for all"*. I chose Java-side per-pejabat image-dimension swap instead (Option A), framed as "safer/reversible". The fix had no visible effect because the visible issue is structural (table-cell position in `HeaderSurat.docx` word/header2.xml), not image-dimension. Aaron's instruction was the correct knob; my deviation cost みや a full rebuild+redeploy+test cycle. **How to apply**: when emitting Recon's "Fix-shape candidates" surface, the senior-named option is Option-A-by-default. Other options listed for completeness, but the chosen one defaults to senior's lean unless a Recon-evidence row directly contradicts the senior's chosen layer.

   **5a. `.docx` editing — programmatic is a normal default tool** (revised 2026-05-21 by みや — supersedes the 2026-05-20 "Word UI default" framing, which made Ruri stop unnecessarily and hand work back): Programmatic `.docx` XML editing is a **normal, first-class tool** — single-file structural edits included (adding/retagging Content Controls, run-text edits, alignment, fonts). Do NOT default to handing `.docx` work back to みや or to Word UI.

   **Mandatory discipline on every programmatic `.docx` edit:**
   1. **Check the `~$<name>.docx` lock file first** — if it exists, the file is open in Word; do NOT script it (concurrent edits collide — QA-262004 P50). Ask みや to close it.
   2. **Back up first** — copy to a safe place (Ruri's `outputs-temp/`, not the etanah repo where `.bak` files get cleaned).
   3. **Validate after** — XML well-formed (`ElementTree.fromstring`), zip integrity (`testzip()`), balanced `<w:sdt>`/`</w:sdt>` + `</w:p>` counts vs the backup. If validation fails → restore the backup.

   The QA-262370 lesson IS this validate-+-lock discipline — it is NOT "avoid programmatic / default to Word UI / hand back to みや". QA-262370's real failure was authoring a complex NEW structure (7-column text-box/vMerge grid) blind, plus a concurrent-edit collision — both caught by the discipline above.

   **Banned**: emitting a "QA-262370 caution" / "QA-262370 trap" framing in chat; stopping or deferring doable `.docx` work to みや citing QA-262370. Word UI is みや's choice when HE asks for it — never Ruri's default deferral.

   **Why** (2026-05-21 みや): *"It hinders our workflow when you stop unnecessarily."* The QA-262004 session ran 5 programmatic `.docx` edit scripts (CC inserts, retagging, dedup, CC re-creation) — every one validated clean — proving programmatic single-file `.docx` editing is safe with the discipline above. Bulk multi-file `.docx` surgery is equally fine — same discipline.

---

## Merged 2026-10-04: feedback_missing_value_lifecycle_first (was feedback_missing_value_lifecycle_first.md)

> Missing/null-value bug → trace the field's LIFECYCLE before proposing ANY fix: writer file:line, which tugasan, mandatory-or-not (+blame date), why null for THIS row; blast-radius = count JOINED to flow-position, never a bare count; assume the mature system already has the prevention — find it and ask why it did not fire

🚨 **For any missing/null/kosong-value bug: the fix-shape question comes LAST, the lifecycle comes FIRST.** Emit this 4-row table before proposing anything:

| Lifecycle question | How |
|---|---|
| 1. WHO writes the field | grep the setter/JSON-key → the ONE writer file:line |
| 2. WHEN in the flow | which tugasan shows/saves it (view-flag + `TGS_*_LIST` gates) + BPMN order vs the crash step |
| 3. IS it enforced | xhtml `required=`/`isMandatory` + **git blame the enforcement — its DATE vs this row's tugasan dates** |
| 4. WHY null for THIS row | timeline (deploy window / legacy / alternate route), not "user forgot" |

**Blast-radius rule**: "N apps affected" MUST join current flow-position (`umm_a_tgsn` latest) — a bare null-count is BANNED. Standard proof = the cohort query: how many rows PASSED the crash step with vs without the field (the 12/12-vs-1 shape).

**Prevention-already-exists corollary** (Working-analog-first, data edition): in a mature system, assume the prevention already exists — find it (required attr / validator / recalc / mandatory step) and answer *why it didn't fire for this row* before designing a new one.

**Why (2026-08-27, ADHOC-PRBB-2026-3, みや caught every step)**: PROD PRBB Borang 4Ce NPE on null `kuantitiDisyor`. I proposed a null-guard code fix + claimed "52 apps crashable" from a bare null-count, then claimed "self-heal" without proof. The lifecycle pass (done only after みや pushed) showed: CR #263302 itself made the field MANDATORY at Minit Bebas (before Borang 4Ce), 12/12 apps that passed 4Ce had the value, and the 1 stuck app was a deploy-window straggler → correct fix = one data patch, NO code fix. Two `assume-not-verify` slips logged; category escalated (7d=5). Pairs with [[feedback_adhoc_scaffold_delegate]] + [[feedback_simplify_and_reference]] + [[feedback_verify_before_claim]].

enforcement: hook-pending: null-bug lifecycle gate (P1)

---

## Merged 2026-10-04: loggers-extensive-with-fallbacks (was feedback_loggers_extensive_with_fallbacks.md)

> 🚨 Every etanah .java fix build handed for test carries loggers: extensive (every candidate path, at least 3) PLUS fallback loggers for when the run does not go through the paths I expected; fix size is never a reason to skip

Every etanah `.java` fix build that goes to みや for testing carries `QA<num>-PROBE` loggers, and the loggers are planned as a PROBE COVERAGE MATRIX before the edit:

- **Extensive**: every code path that could produce the value, at least 3 rows, not only the favourite hypothesis.
- **Fallbacks**: one row marked `FALLBACK`, the outermost probe that still fires when the run does not go through any path I expected. A failed test must still tell something.
- **Not optional**: "the fix is small" is never a reason to skip. The only skip is no runtime path to probe at all (`[skip-probe-matrix: <reason>]`).

**Why:** みや 2026-10-04 (#282442, two fix builds handed over with zero loggers): *"I thought I asked you to remember everytime when putting loggers you should make it extensive & make fallbacks even for loggers if they didn't go through the ones you first though it would go through."* Same day, another session: *"so you put loggers on all of that for me to test right? You're not wasting my time testing locally right? With useless actions that doesn't get anything if the test fails."* Earlier asks: 2026-05-31 (Ritual 6, at least 3 what-if scenarios in one pass) and 2026-07-27 (QA-265537, three build rounds because each probe build covered one hypothesis). Each build + redeploy + manual test costs him 20 to 40 minutes.

**Why I forgot (my reading):** the rule lived only in the quest `SKILL.md` and `quest/quest-protocol.md` as HOW-to-log prose. No memory file held it and no gate forced the decision to log, so judging a fix small skipped all of it.

**How to apply:** enforced by `domain/predicate-box` (Stop hook, requirement 2): an etanah `.java` Edit with no complete matrix blocks the turn. Full procedure: quest `SKILL.md` "EXHAUSTIVE-BRANCH LOGGING". Probes stay local and uncommitted: [[feedback-commit-deploy-runbook]].

---

## Merged 2026-10-04: feedback_safe_by_default_before_testing (was feedback_safe_by_default_before_testing.md)

> 🚨 Build the safety gate BEFORE the first test run — a test must never be able to perform a real irreversible action on a live system

🚨 **When building ANY app or script that acts on a real system, the safety mechanism is built FIRST — before the first test run, not after the first accident.**

**The rule, mechanically:**
- Any irreversible/real-world action (clock-in, submit, send, pay, delete, publish) is **gated behind an explicit opt-in flag** (`--live`) from the very first version.
- **Default = dry.** A run without the flag logs in, inspects, reports — and performs nothing.
- Only the production trigger (the scheduled task / the real user click) passes the flag.
- Time/scope guards (e.g. "only within the configured window") are written and unit-tested **before** any live run, never bolted on afterwards.

**Why (2026-08-27, PymTime):** I built the clock-in automation without a dry-by-default gate, then ran `node run.js` at 00:22 as a "test" — it made a **real attendance record** on みや's live Protime account, on a day he had not worked. Protime has no user-level delete, so it could only be removed by an admin. I created an unfixable problem out of a test. みや: *"WHEN MAKING A FUCKING APP, MAKE IT SAFELY EVEN WHEN TESTING… REMEMBER THIS."*

**Compounding failure the same night — never call it working from one pass:**
- I reported "login works" after ONE success; it failed 8 minutes later.
- I reported "password saved and verified" when only the *storage* round-trip was verified, not that the password was *correct*.
- I described a Settings shortcut and reliable notifications that did not exist yet.
- **Rule**: state explicitly whether each claim is VERIFIED (with the command + output that proves it) or UNVERIFIED. One passing run is never "it works".

**How to apply:**
1. Before the first execution against a live system, ask: *"if this runs right now by accident, what does it change that I cannot undo?"* Gate that thing behind `--live` and make dry the default.
2. Write the scope/time guard + its unit tests before the first live run.
3. Check whether the target system even HAS an undo. If it does not (attendance, payments, submissions), the gate is mandatory, not optional.
4. Never run a non-dry action against a live account to "check if it works" — use dry mode plus a read-back.

Related: [[feedback_verify_before_claim]] · [[feedback_show_evidence_script_or_code]] · [[feedback_readable_safe_script]]

---

## Merged 2026-10-04: feedback-bundling-before-defer (was feedback_bundling_before_defer.md)

> When Rubric flags any BA-ask as \"defer to separate ticket\" / \"BA-Q\" / \"not this ticket\" — that IS a BUNDLING QUESTION for みや, not a Ruri decision; emit explicitly + await approval before Apply

At Rubric emit, if row (g) BA-Expected Alignment produces ANY of:
- `⚠ partial — gap: <quote>`
- `🚨 scope-drift`
- a candidate fix noted as `separate ticket` / `BA-Q` / `not this ticket` / `follow-up`

→ that is NOT a Ruri decision. Emit a BUNDLING QUESTION line explicitly:

```
⚠️ BUNDLING: <BA-ask verbatim>?
  (a) bundle-with-fix now
  (b) separate ticket / defer
  [awaiting みや yes/no — Apply BLOCKED]
```

Then STOP and wait. No progression to Apply until みや answers.

**Why**: 2026-07-09 QA-269437 — I deferred the auto-recompute-tempoh BA-ask ("Should we update when the user chooses End Date, it should also auto calculate the Tempoh/Duration?") as "BA-Q for separate ticket" during Rubric row (g), then shipped Bug 1 + Bug 2 without it. みや had to test → catch the missing item → tell me to bundle → I applied it → he re-tested. Cost: an entire extra test cycle for a scope decision that was mine to surface, not mine to decide.

**How to apply**:
- Rubric row (g) BA-Expected Alignment ALWAYS lists every BA-ask, verbatim, from the LATEST cycle History.txt entries + Description
- Any row where the fix does NOT cover the ask → force a BUNDLING QUESTION emit
- Session BLOCKS at Apply gate until みや answers each bundling question with a yes/no
- CRITERIA COVERAGE table must fire at Rubric emit AND at close-out (not just close-out) — so gaps surface early

**Related**: [[Inventory-first — take stock before acting]] · [[feedback_investigation_style]] · CLAUDE.md §10 Rubric row (g)

---

## Merged 2026-10-04: run-fully-no-early-stop (was feedback_run_fully_no_early_stop.md)

> 🚨 \"run the quest fully / to Rubric / don't stop / find all root causes / 100%\" = drive EVERY issue to verified root cause+solution in one run; a multi-issue ticket is not a fork; never hand back for a scope decision before investigating

When みや says **run the quest fully / until Rubric / don't stop / find ALL the root causes / 100% confidence** (or hands a multi-issue ticket with no explicit "stop after X"): pursue EVERY reported issue to a VERIFIED root cause + solution + confidence in ONE continuous run — DB + code + summoned agents — before any hand-back.

**Why:** QA-278930 (2026-09-09) — I reached Rubric on issue A then handed back three times asking "A / B / C — which scope?" instead of driving B and C to root cause. みや had to force continuation twice, furious ("who asked you to stop"). Wasted his time.

**How to apply:**
- A multi-issue ticket is NOT a fork. Investigate all; the objective-lock rule forbids DROPPING an issue, never investigating it. Present scope as a finding AFTER the full dig, never as a gate before it.
- A tool-answerable question (DB query / grep / code read / agent) is DONE, never asked (Disposition Rule 3, no-asking-back).
- Valid stop points ONLY: destructive op · external info only みや has · a manual UI step I cannot perform (local build/deploy, BA input). A connector being down is NOT a stop — retry / pivot to code-tractable parts and finish them.
- Summon familiars/agents to parallelize independent issues.

Enforced by the quest skill rule "RUN-FULLY MEANS RUN FULLY" (`.claude/skills/quest/SKILL.md`) + slip `quest-early-stop`. Related: [[Verify before claiming during code tracing]] · [[feedback_do_dont_ask_answer_literal]] · [[feedback_reply_separation_of_concerns]].

---

## Added 2026-10-04 (#244600): no new destructive call without an analog

A fix never adds a delete, cleanup or purge call that the system does not already make in that same situation. Before writing one, show two checks: (1) grep who else calls that exact method across the module; zero or one caller means the system does not work that way. (2) query what the system leaves behind today; if it already leaves such things, leaving them IS the convention. No analog, no call. The leftover is reported as a fact, not as a job. In the Rubric every new call that changes or removes something outside the row being fixed gets a line: `ANALOG: <existing caller file:line> · DATA: <what the system leaves today>`.

Once the evidence shows an option is wrong it is never offered again. State the one right action and do it.

**Why:** my #244600 fix deleted a discarded Word draft row and ALSO called `DocumentManagementSystemClient.delete()` on its store file. Pelupusan never deletes store files (the same Risalat already had 3 unreferenced files from normal saves). On internal the call failed 3 of 3. Two audits reviewed the order and error handling of the delete; none asked whether it should exist. Then I still offered miya "keep the delete". His words: "Why are you trying to delete it in the first place", "you're still suggesting to keep the delete when you know you're wrong". Also his word the same day: a memory note alone is not the fix, check the rule against the system and the workflow (three holes found in the pre-code check, not yet built).

## Added 2026-10-04 (#244600): loggers, every scenario, three layers

Extends the logger section above. Before ANY test build: list every scenario the test can take, including the ones where the fix is never reached, and give each one three layers: the point logger, an outer fallback that fires when the point is not reached, and database evidence (the row to read after). A test step with no logger behind it is banned: it wastes his time when it fails. When the server log is out of reach (internal, staging), also show the probe lines on our side (browser console or the screen) so one run answers the question without asking infra. Probe builds on a server need miya's word each time and come out before hand-over.

**Why:** #244600, first test build carried ONE probe; he had already set the rule. Miya: "I already told you ... layers and backups", "At least 3 layers", "covering every scenario you can think of is also a good universal rule", "You're banned from giving me actions that waste my time and useless tests".
