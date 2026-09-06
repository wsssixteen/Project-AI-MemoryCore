goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote codemap-recon-consult)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: codemap-recon-consult.discipline.hook.js — Stop hook (back-gate) Power: domain/codemap-recon-consult/ — back-gate paired with the front-gate trigger.hook.js reminder.
goal_signal: a fire on: its trigger
retention: rotate monthly
# codemap-recon-consult — remind to consult the codemap during quest investigation

## Power purpose

During a quest's **investigation phases** (Discovery / Recon / Rubric), inject a reminder to consult the etanah-codemap data files for **module-scope** + **blast-radius** before concluding — so the consult is deterministic, not memory-dependent. Demonstrated live on QA-264293 + QA-261517 (used `bpmn_flow.json` for module-scope + `callgraph_callers.json` for blast radius by hand).

## Pieces

| Piece | File | Role |
|---|---|---|
| Trigger hook | `codemap-recon-consult.trigger.hook.js` | UserPromptSubmit · reads `quest/active.txt` · fires when a quest is `status=active` AND `current_phase` ∈ {discovery, recon, rubric} · injects the consult reminder |
| Skill | none | Hook-only Power (per /system-design Rule 7) |
| Discipline hook | deferred | Promote to a Stop-side back-gate (scan the Recon/Rubric emit; warn if it references no codemap file) only if the slip-log shows the reminder is insufficient |
| Eval | deferred | Add if trigger misses appear in slip-log |
| Log | `log.jsonl` | Per /system-rules Rule 5 — one line per fire (`ts`, `fired_for`) |

## Trigger — state-driven, not prompt-phrase

Fires off `active.txt` quest state, NOT みや's wording. **Why**: Recon/Rubric usually run *autonomously* (みや's prompt contains no "recon"/"verify"), so the prompt-triggered `scout-completeness-gate.js` misses them — verified on QA-261517 (a full Recon fired with no triggering phrase in any みや prompt). State-driven = fires whenever the quest is genuinely in an investigation phase.

## Inventory note (per /system-rules Rule 1)

Considered + rejected refining a sibling:
- `scout-completeness-gate.js` — prompt-triggered → unreliable for autonomous Recon.
- `quest-active-grounding.js` — reliable (reads `active.txt` phase) but is a pure grounding emit; folding codemap-consult in would mix concerns. Kept separate.

## Blind-spot honesty

`callgraph_callers.json` (SootUp) misses Java method-refs (`util::populateX`, invokedynamic) → ~281/589 populators absent. The reminder states a "no callers" result is **not authoritative** — confirm a negative with codegraph/Grep. Prevents the data creating false confidence.

## Live-after note

settings.json registration uses an absolute main-repo path; this Power is authored on a worktree branch and goes live after it merges to main (DE) **and** a Claude Code restart (hook-registration changes need a restart).

*Created 2026-06-16 per みや ("make sure all these new features run through hooks when running our quests"), routed through /system-rules + /system-design.*
