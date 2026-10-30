---
name: sweep
description: Multi-ticket multi-wave familiar sweep — one word replaces the ~300-word hand-specified orchestration. Use when miya types /sweep or asks to go through many tickets / process the open board in waves.
---

# /sweep — multi-ticket, multi-wave familiar sweep (born via core/forge.js 2026-08-16)

**Goal**: every ticket in the sweep reaches a W4-audited Rubric whose fix is checked against evidence. Accuracy first; then wall time and tokens. A change that saves time but drops a check that caught something is never made.

Design source: `projects/coding-projects/active/multi-ticket-sweep/DESIGN.md` (2026-07-27); this skill is the current truth where they differ. Decisions locked by miya: name=/sweep · default ladder = all 4 waves WITH skip rules · runs unattended to completion · does NOT own Apply · every run is audited and refined at close (2026-10-29). Picture: `.claude/skills/sweep/diagram.png`.

## Grammar

```
/sweep                                → every open ticket not yet at Rubric, default ladder
/sweep 272378 272329                  → only these
/sweep --waves understand,quest       → stop after the named wave
/sweep --model opus --effort medium   → override; NEVER fable for ticket work
/sweep --resume                       → re-enter after a stop; replay banked waves, run only missing ones
```

## Step 0 — orchestration mode ON + run start

`node domain/sweep/audit.js flag on` — writes `system/orchestration-mode.flag` in the MAIN folder (hooks run from there; a flag in a worktree mutes nothing — 0 suppressions on 2026-09-25 and 2026-10-23). TTL of a FEW HOURS (4h) by default, capped at 8h, so a crashed sweep cannot mute gates forever.

Emit: flag set + expiry clock time + the run start time in ISO (Step 7 passes it as `--since`). Suppressions self-log as `mode:'orch-suppressed'` rows in the main `system/telemetry/hook-fires.jsonl`. Honesty/claim gates NEVER stand down — only the 6 reply-format gates in ORCH_SUPPRESS (lib/dispatch-hooks.js + lib/hook-runtime.js). **DELETE the flag at sweep close**; the TTL is only the crash guard.

## Step 1 — board truth (Redmine FIRST, always)

Run `node quest/redmine-board.js`. The live API is truth; `active.txt` is working memory and ROTS — **never take dates or status from active.txt**. Reconcile any divergence rows it prints before listing. Rank per the board's order — 🚨 **TICKET PRIORITY RULE (miya 2026-10-19, replaces 2026-09-29)**: default order by tracker tier — **(0) PROD patching** (Internal Issue (PROD) · Data Patching (PROD) · Internal Issue (PROD-CR)) → **(1) eSOKONGAN tracker** (id 51, never the project name "eSOKONGAN MELAKA") + PAT/UAT/FAT → **(2) Internal Issue (Permanent Fix) + Internal Issue (MA Fix)** → **(3) Internal Issue + QA** → **(4) CR + Development/Requirement** → Team Initiative and any other tracker last (not placed yet). Inside a tier: Priority **Critical > High > Medium > Low**, then a ticket whose description/journal says **urgent / segera / kritikal / critical / ASAP / mendesak / secepat mungkin / immediate / emergency / kecemasan**, then eSOKONGAN nearest due, others 3-DAY age. **Two states (miya 2026-10-30)**: every category is Melaka's table, then Perak's table of the same category (1 PROD → 1b Perak PROD, 2 eSOKONGAN → 2b Perak eSOKONGAN, 3 the rest → 3b Perak rest); Perak rows include Ammar's tickets (the shared miya + Ammar filter, `system/states.json` perak `shared_assignee_ids`) and he asks Ammar before taking one. It is a default only: **he picks the day's tickets** by current priority and effort, so show the ordered list and never pick for him. `quest/redmine-board.js` `TRACKER_TIER` implements it; full table in `.claude/auto-memory/feedback_esokongan_means_tracker.md`. When he names the tickets, skip the board run.

## Step 2 — scope + skip computation (per ticket, from the qa_doc)

| Condition | Action |
|---|---|
| already at Rubric | **skip W1** |
| already has 2 independent passes | **skip W3 → go W4** |
| W2 overturned its own W1 | W3 targets the residuals, not a blind repeat (W3 then waits for W2) |
| W2 + W3 converge | W4 audits hardest at the SHARED assumption |
| W2 + W3 conflict | W4 adjudicates + produces a discriminating test matrix |

Skipping W3 is not skipping rigour — it is spending the round where the disagreement is.

## Step 3 — DELEGATION PLAN table BEFORE any fan-out (mandatory)

Emit: stage · #agents · model · effort · output schema · expected token band. W1+W2 and W3 familiars = `sonnet` (Sonnet 5.5), effort `high` (multi-file trace). W4 = one `opus` familiar per ticket, plan row reason `opus-reason: adversarial check of the root cause that decides the fix` (CLAUDE.md §Delegation Economy). Every familiar names its model (CLAUDE.md v1.81). Haiku is not used in a sweep: every wave decides inclusion and stop-point, and no script re-checks its answer (the haiku trial requires one). **Never Fable.**

Before the launch, the controller runs `git fetch origin` once in each etanah repo the tickets touch, so `origin/mlk/master` is current.

## Step 4 — the wave ladder

| Wave | Purpose | Reads | Writes (scratch, then banked) |
|---|---|---|---|
| **W1 UNDERSTAND** | every BA artifact — videos via video-frames + READ THE URL BAR, images as images, stack traces in full, .docx via zipfile. State the issue exactly; claim NO root cause | Task folder `1. Brief\` + etanah-knowledge | `QA-<n>.md` §1 |
| **W2 QUEST** | Scout → Recon → Rubric | §1 + repo + DB | `QA-<n>.md` §2 |
| **W3 BLIND** | independent Recon+Rubric, BARRED from the qa_doc — controller passes facts in-prompt | in-prompt facts + repo + DB | `QA-<n>-wave3.md` (sibling file) |
| **W4 AUDIT** | adversarial — refute, don't agree; adjudicate W2 vs W3 differences; **establish the EXPECTED behaviour WITH EVIDENCE** and **verify the fix PRODUCES it** (not just stops the error); **read the commit that introduced each line the fix changes** (`git log -L` / blame on `origin/mlk/master`) and check the fix does not re-break that commit's ticket | all above | `QA-<n>-audit.md` |

**Launch layout (2026-10-29)**: W1+W2 and W3 of EVERY ticket go out together, in one message — W3 needs only the in-prompt facts (ticket text + the Brief file list), never W2's answer. W4 of a ticket launches the moment that ticket's two passes are banked; it does not wait for the other tickets. A W3 that targets residuals (Step 2) waits for its W2.

**Code baseline**: every familiar reads etanah code as `git show origin/mlk/master:<path>` (or `git grep ... origin/mlk/master`), never the working tree — local checkouts sit on `mlk/int-env` / `mlk/stag-env`, and local `mlk/master` lags (2026-10-29: a W3 read stale local `mlk/master` and called a merged gate unmerged).

**Output to scratch**: each familiar writes ONLY its one file under the session scratchpad, `<scratchpad>\sweep\QA-<n>-<wave>.md` — write guards refuse familiar writes into the main quest folder (refused in 3 of 4 runs before 2026-10-29). The controller banks it (Step 6).

Blindness is enforced STRUCTURALLY: W3 writes to a sibling file so it never needs to open the qa_doc, and the prompt contains the blind clause ("do NOT read QA-<n>.md or any -audit/-wave file").

**W4 must pin the EXPECTED behaviour, not only the bug** (added 2026-09-18 after a verify pass on #280132/#280176/#280191/#280166). The audit is INCOMPLETE if it confirms the root cause without: (a) an evidenced statement of what the screen/save SHOULD do, and (b) a trace proving the proposed fix yields it. Evidence sources, in order: a WORKING sibling that behaves correctly (file:line) · a healthy-vs-broken DB row comparison · the field/BPMN spec. Why: this discipline caught #280166's flat `caraPenghantaran="TP"` (an unconditional literal that kills the gateway's own Warta branch → must be `perluWT ? "warta" : "TP"`), and raised confidence on #280176 (85→93) and #280191 (90→95) by closing "does the fix reach the correct save path" residuals. The introducing-commit read was added 2026-10-29: W4 found that both W2 and W3 fixes for 286655 re-broke QA 262778, the ticket that wrote the line. Re-running W4-with-expected-behaviour on already-diagnosed tickets is the **`--verify` pass** (opus, one familiar per ticket, reads the qa_doc + wave3 + audit, writes `QA-<n>-verify2.md`).

## Step 5 — Delegation Safety Template (VERBATIM in every familiar prompt)

```
SAFETY CONTRACT (all 7 binding):
1. You are ONE familiar answering ONE ticket's wave — do not widen scope.
2. BANNED: spawning sub-agents, Agent tool, Workflow tool.
3. Read-only on both repos + MemoryCore, EXCEPT your single designated output file: <path>.
4. Output = the forced schema below; raw data, no prose report.
5. MCP tools you hold: <postgres-mlit-pg / postgres-mlkstg-pg / codegraph — name them>.
   If a tool is deferred, load it FIRST: ToolSearch "select:<tool names>".
6. The Windows Task folder (1. Tasks\Melaka\...) is miya's — NEVER write there.
7. Your return is DATA, not truth — the controller verifies it against disk/DB.
```

Then, also verbatim, the RUN CONTEXT block:

```
RUN CONTEXT:
- Output file (your only write): <scratchpad>\sweep\QA-<n>-<wave>.md
- Code: read etanah code ONLY via git show origin/mlk/master:<path> — never the working tree.
- No run_in_background commands. End with the forced schema as pipe-separated lines.
```

Clause 5 exists because on 2026-07-24 three DB verifies stranded — familiars had no postgres MCP loaded. Always name the server AND the ToolSearch step.

## Step 6 — controller duties between waves

- **Bank** each familiar's scratch file into `projects/coding-projects/active/QA-<n>/` in the MAIN folder the moment it returns (copy, then confirm it exists there).
- Emit one verification line per ticket per wave: `WAVE <n> VERIFIED — QA-<x>: <spot-check done against disk/DB>` — familiar output is DATA, not truth. A code claim is spot-checked against `origin/mlk/master`, never the local branch.
- **Resume, never rerun**: on usage-limit/crash, `/sweep --resume` replays banked wave files (they exist on disk) and re-runs ONLY missing (ticket, wave) cells. Relaunching a banked wave is BANNED.
- Findings → the qa_doc ONLY. **No file is ever written into any Task folder.** Knowledge distill (bestiary/post-mortem) happens ONLY at Phase-2 close, never mid-sweep.
- Cleanup of a familiar's stray file = delete that one file by its full path. A recursive delete of any folder is banned (2026-10-29: `rm -r` on a worktree folder deleted 29 tracked files).

## Step 7 — close-out

1. `node domain/sweep/audit.js flag off`.
2. Update every swept quest's `phase=` in active.txt (`node quest/active-cli.js update QA-<n> phase="..."`) so the next session's boot board reflects the sweep — the qa_doc alone is not the board.
3. Write the run ledger row with the audit Tool: `node domain/sweep/audit.js run --tickets <t,t> --since <Step 0 ISO> --scratch <scratchpad>\sweep --verified <n> --w4-changed <tickets whose fix W4 changed> --controller-caught <tickets where the controller caught a familiar error> --run-id <id> --write`. It reads every familiar transcript and the main hook log, writes ONE row to `domain/sweep/log.jsonl` (tokens · minutes · models · accuracy · suppressions · defects · refinements) and reads the row back (self-audit). Exit 1 = a run defect is open.

## Step 8 — audit and refine (every run, 2026-10-29 per miya)

The run is not closed until this step is done. Judge every finding against the Goal above: accuracy first, then speed.

1. **Fix now, then re-audit (fix loop)**: every `DEFECT` row of severity `run` has a `fix now` line — do it in this turn (re-run the one missing cell, bank the missing file, flag off, discard a W3 that read the qa_doc and re-run it blind). Re-run Step 7.3 until it exits 0.
2. **Find the refinement**: every defect class carries a `refine` line and its `accuracy` effect. A refinement that removes or weakens a check that caught something in the last 3 runs (W4 changed a fix, the controller caught an error) is never proposed. Speed refinements must state why accuracy stays the same.
3. **REFINE NOW** (the same class in 3 runs, system-design Rule 16): propose the change to this skill or the audit Tool, with its evidence, as one row of the close table. It is built through `/system-change` on his go.
4. A class the Tool does not know yet (it prints `name it in CLASSES`) = add it to `domain/sweep/audit.js` with a fixture in `audit.eval.js` through `/system-change`.

## Step 9 — the close table, then STOP

Report table to miya: ticket · waves run · skip rule applied · verdict/next-action, plus one row per refinement from Step 8 — **the table IS the close; then STOP** (miya 2026-08-17). Very short sentences (2026-10-27). No fix continuation, no "commit X now" prompts, no audit walk-throughs in the same breath — **every ticket's fix happens in its OWN dedicated session**, resumed from its qa_doc. **Apply is NOT part of the sweep** — it stays a deliberate per-ticket act.

> Fixture: `node domain/sweep/eval.js` asserts this file's contract (and runs `audit.eval.js`); the audit Tool's own fixtures are `node domain/sweep/audit.eval.js`.
