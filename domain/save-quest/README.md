# save-quest

symptom: 2026-10-04 miya: "when I say save this quest, you will automatically decide based on redmine status to simply close (phase 1) or if the status is Closed in Redmine, it is time for us to Archive so we will run Phase 2"
goal: a quest is closed or archived in step with its live Redmine status, with no stage question to miya
goal_signal: the reply to "save this quest" carries the `SAVE-QUEST:` verdict line and the matching stage ran
goal_signal_regex: SAVE-QUEST: 
retention: keep
footprint: on-demand: 1 node process per call, one HTTP GET to Redmine with a 6 s timeout, about 0.2 to 1 second; nothing running otherwise
state-scoped: no, state-agnostic. One Redmine instance serves every state and a ticket number is unique on it; the local block is found by that number whatever its `state=`. Host, key and owner id have one home: `quest/redmine-status-check.js`.

Script + skill section. Asked for by phrase ("save this quest", "save quest", "save the quest"). The front gate that injects the verdict on "close quest" / "save quest" lives in `domain/save-quest-gate/`; a Stop-side back gate there is not built.

| Part | File |
|---|---|
| Procedure | `.claude/skills/close-phase/SKILL.md` → "Save-quest mode" + the Redmine check that opens Phase 2 |
| Script | `lib/save-quest.js` (reads Redmine once and the quest files of the main checkout; writes nothing but its log) |
| Redmine probe | `quest/redmine-status-check.js` (`fetchIssue`, `OWNER_ID`, reused) |
| Script eval | `lib/save-quest.eval.js` (54 fixtures, no network) |
| Feature eval | `domain/save-quest/eval.js` (runs the script eval, then checks every pointer below) |
| Log | `domain/save-quest/log.jsonl` in the MAIN checkout |

## The decision

| Redmine | Local quest | Verdict | What runs |
|---|---|---|---|
| did not answer | any | `UNKNOWN` | save the doc only, no stage change |
| Closed · Cancelled · Acknowledged | active · hold · blocked | `PHASE-2 (Phase 1 first)` | Phase 1 close-out, then archive |
| Closed · Cancelled · Acknowledged | closed | `PHASE-2` | archive |
| Closed · Cancelled · Acknowledged | archived | `DONE` | nothing to move |
| Closed · Cancelled · Acknowledged | delegated | `LEARN-THEN-PHASE-2` | `/learn-from-fix`, then archive |
| not closed | active · hold · blocked | `PHASE-1` | Phase 1 close-out only |
| not closed | closed | `WAIT` | nothing; archive waits |
| not closed | archived | `AHEAD` | nothing to undo |
| not closed | delegated, or a colleague holds an in-work ticket | `KEEP-DELEGATED` | keep the block |
| no ticket number | any | `ADHOC` | adhoc-save skill |
| any | no block | `NO-BLOCK` | nothing to save |

The three closed names are the Redmine statuses with `is_closed = true`, read from `/redmine/issue_statuses.json` on 2026-10-04.

**Layer choice (Rule 7)**: skill section + script. The mapping is deterministic, so it is a script. The procedure already lived in close-phase, so it is a section there and not a new skill. This feature has no hook of its own. The miss was observed on 2026-10-06 (saying "close quest" started nothing unless the words were noticed), so the trigger hook was born separately as `domain/save-quest-gate/` (front gate, in the `upsm-mode` bundle). Every run is logged so a miss can be counted.

**Trigger moment (Rule 8)**: only when miya says the phrase, or when close-phase reaches Step 0. Nothing at boot, nothing per prompt.

**Observability**: one row per run in `log.jsonl`: `ts`, `qa`, `redmine` (status or null), `local`, `verdict`, `dur_ms`. Count of `UNKNOWN` = how often Redmine was unreachable. A `PHASE-2` or `DONE` row whose `redmine` is not a closed name would be a bug.

## Pointers (link, not copy)

- `.claude/skills/quest/SKILL.md` "Vocabulary — save everything" names the phrases and points here.
- `.claude/save-commands.md` has the command row.
- `.claude/auto-memory/feedback_quest_closure_both_folders.md` + its `MEMORY.md` line point here.

## Spec changes made with this feature (named, per system-design Rule 6 v1.2)

- "save the quest" used to mean persist only (quest skill, 2026-06-18). It now means persist, then the stage Redmine allows. "save everything", "save it", "save this finding" still mean persist only.
- close-phase Phase 2 used to run on the local status alone. It now also needs the ticket closed on Redmine. Override: miya's own "archive anyway".

## Known limits

- The closed-status list is baked. A new closed status added on Redmine would read as "not closed" (verdict `PHASE-1` or `WAIT`). The verdict line always prints the raw Redmine status, so the mismatch is visible.
- `quest/archive-quest.js` itself does not refuse an archive while Redmine is open. The check is in the skill. A refusal inside the mover is logged as a proposal for miya's ruling.
