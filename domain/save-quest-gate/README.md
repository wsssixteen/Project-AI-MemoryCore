# save-quest-gate

symptom: 2026-10-06 miya: saying "close quest" started the close skill only when the assistant noticed the words; domain/save-quest had a script and no hook
goal: every close-quest or save-quest ask gets the live SAVE-QUEST verdict and the full save checklist in the same turn
goal_signal: the reply to a close/save quest prompt carries a SAVE-QUEST: line
goal_signal_regex: SAVE-QUEST: 
retention: rotate monthly
footprint: per-prompt: joins the upsm bundle, no process unless the phrase matches; on match 1 node child for the resolver, up to 8 s
state-scoped: no, state-agnostic. The phrase and the resolver look at the quest id only; `lib/save-quest.js` already finds the block whatever its `state=` says.

**What fires when**: UserPromptSubmit, inside the `upsm-mode` bundle (`domain/bundles/upsm-mode.json`). Only when the user's own prompt text asks to close, save, wrap or archive a quest.

**Contract**: on a match the gate prints, in this order:
1. `SAVE-QUEST GATE: close/save quest asked. Do these in this turn, in order.`
2. `Quest ids: ...` (ids named in the prompt; bare 5-6 digit numbers after the phrase count as `QA-<n>`), or `no quest named: resolve it from the conversation, then run node lib/save-quest.js <QA>`.
3. For each id (at most 5, one shared 8 s budget): the resolver's `SAVE-QUEST:` line plus its one advice line. A timeout, a non-zero exit or no `SAVE-QUEST:` line prints `SAVE-QUEST: <QA> · resolver did not answer → UNKNOWN`.
4. `SAVE-QUEST CHECKLIST:` the 7 items.
5. `Procedure: invoke the close-phase skill (Skill tool). This gate does not replace it.`

It never blocks and never writes anything but its own log.

| Fires | Silent |
|---|---|
| close / save / wrap / archive + (this / the / that) + quest | the phrase only inside a fenced block, an inline backtick span or `<pasted_content>` |
| close-phase, close phase | a question about the feature: `?` ending the sentence and how / why / does / did / have you / what before the phrase (not when "can you" or "please" sits right before it) |
| close / save / archive + QA-nnnnnn, #nnnnnn, ADHOC-... | a negation right before it: do not / don't / never / not / without |
| close and save (the / this) quest | "save everything", "save it", "save this finding" (another rule owns them) |

Resolver override for tests: `SAVE_QUEST_GATE_RESOLVER` (script path), `SAVE_QUEST_GATE_TIMEOUT_MS`, `SAVE_QUEST_GATE_LOG`.

**Layer choice (Rule 7)**: hook-only. The procedure already lives in the `close-phase` skill and the verdict mapping in `lib/save-quest.js`; the gap was the trigger, so the hook injects the verdict and points at the skill. No new skill file.

**Trigger moment (Rule 8)**: UserPromptSubmit, because the miss was at the start of the turn: nothing read the words. A regex runs in the existing bundle process; the resolver child starts only on a match.

**Observability**: each fire appends one row to `domain/save-quest-gate/log.jsonl` (`ts`, `event` = front, `decision` = inject, `ids`, `verdicts`, `dur_ms`). Silent runs write nothing. Central telemetry rows come from the dispatcher. A row whose `verdicts` is all `UNKNOWN` = Redmine was unreachable.

**Not built**: Stop-side check (block a reply to a close/save quest that has no `SAVE-QUEST:` line). Blocked by the eval rider (`design-consult-gate`), which reads the main repo's `domain/` for the eval file, so a second hook file in a worktree is refused until the Feature exists on main. Owner to rule.

**Goes live**: hooks may run from the MAIN repo copy, so this is live once the worktree branch is merged to main.

## Rule 12 adversarial scenarios (front gate)

| # | Scenario | Verdict |
|---|---|---|
| 1 | "how does close quest work?" | handled: silent (question + `?`) |
| 2 | "can you close quest 244600?" | handled: fires (request lead beats the question rule) |
| 3 | "please close and save quest (Can you update ...?)" | handled: fires, no id, tells the assistant to resolve it |
| 4 | "why did close quest not save? close quest 244600" | handled: second sentence fires |
| 5 | phrase only inside a fenced code block | handled: silent, fixture |
| 6 | unterminated fence or unterminated `<pasted_content>` | handled: stripped to the end of the text, silent, fixture |
| 7 | phrase inside inline backticks | handled: silent, fixture |
| 8 | "do not close quest 244600" / "never save quest ..." | handled: silent (negation guard, my addition to the brief) |
| 9 | "don't forget to close quest 244600" | handled: fires (the negation word is not directly before the phrase) |
| 10 | "save everything" / "save it" / "save this finding" | handled: silent, no phrase |
| 11 | "close the door", "closest request", "quest close" | handled: silent, fixtures |
| 12 | "save everything, then close quest 244600" | handled: fires |
| 13 | same id written three ways (244600, QA-244600, #244600) | handled: one id, one resolver call |
| 14 | two ids / more than 5 ids | handled: one line each; ids past 5 are listed and not resolved |
| 15 | resolver hangs | handled: killed at the budget, UNKNOWN line, exit 0, fixture |
| 16 | resolver exits 1, prints no `SAVE-QUEST:` line, or the file is missing | handled: UNKNOWN line, exit 0, fixtures |
| 17 | slow first id eats the budget for the second | accepted-risk: later ids get at least 300 ms and may read UNKNOWN; worst case about 8 s plus node start |
| 18 | empty stdin, malformed JSON, `null`, no `prompt`, non-string prompt | handled: exit 0, silent, fixtures |
| 19 | prompt over 1 MB, or a huge pasted block | handled: over the cap silent; pasted block stripped before matching, fast |
| 20 | the gate's own injected text fed back as the prompt | handled: a prompt starting with `SAVE-QUEST GATE:` is ignored (no self-fire loop) |
| 21 | hook copy in a sandbox with no `CLAUDE_PROJECT_DIR` | handled: root resolves from the file location, fixture |
| 22 | bundle dispatch instead of direct registration | handled: dispatcher wraps the text as `additionalContext`, fixture |
| 23 | two sessions logging at once | accepted-risk: append-only rows, order may interleave |
| 24 | `lib/save-quest.js` deleted or renamed | handled: UNKNOWN line, never a crash |
| 25 | the phrase in a language other than English, or "tutup quest" | accepted-risk: not matched; add on a seen miss |
| 26 | a bare 5-6 digit number after the phrase that is not a ticket ("close quest, 12345 rows") | accepted-risk: only numbers in the same sentence count; a wrong id gets a NO-BLOCK line from the resolver |
| 27 | the assistant ignores the injected text and pastes no `SAVE-QUEST:` line | accepted-risk: this is the Stop-side check that is not built (see Not built) |
| 28 | the simplest instruction inverted: "close quest" must never close anything by itself | handled: the gate only injects text; it runs nothing but the read-only resolver |

Eval: `node domain/save-quest-gate/eval.js` (runs a sandbox copy of the hook with a stub resolver; no Redmine call).
