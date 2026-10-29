# next-steps-shape

symptom: 2026-09-30 miya: 'not sure what you're talking about. Please fix this behaviour. next steps without short explanation.'
goal: every Next steps row tells miya in plain words what the item is and why it needs him
goal_signal: the reply's Next steps table has a What it means column with a 5+ word sentence per row
retention: rotate monthly
footprint: per-turn: joins the stop-reply-shape bundle, 1 node child, ~30 MB, <200 ms

diagram: domain/next-steps-shape/diagram.png (v3 step marked)
self_audit: the eval replays every fixture (`node domain/next-steps-shape/next-steps-shape.eval.js`); each fire writes passed/blocked with the reason and, from v3, the picture verdict to log.jsonl

**What fires when**: Stop — a reply ends with a Next steps table

**v3 (2026-10-29, per みや on 286655: "I didn't see any story diagram using your diagram skill to decide. Why do you fail to show this on every quest run?")**: a quest reply (it names the number of a `status=active` block in `quest/active.txt`) that ends with Next steps BLOCKS once unless this turn sent an image with `SendUserFile` or the reply carries `Diagram: none (<reason>)` outside a code fence. Turn events come from `lib/adhoc-brief-first.js` (shared parser, same as the adhoc picture check). Paired skill text: quest SKILL.md Pre-emit gate row 🧭. Eval 27/27.

| # | Adversarial scenario (Rule 12) | Verdict |
|---|---|---|
| 1 | the 286655 reply itself: choices in words + SQL fences, no image | fixture Q1 |
| 2 | image sent this turn | fixture Q2 |
| 3 | waiver line with a reason | fixture Q3 |
| 4 | waiver with an empty reason | fixture Q4 |
| 5 | ticket number of a closed or unknown quest | fixture Q5 |
| 6 | active.txt missing or empty | fixture Q6 (empty list) |
| 7 | quest number named, no Next steps | fixture Q7 |
| 8 | number inside a longer number | fixture Q8 |
| 9 | a .sql or other non-image file sent | fixture Q9 |
| 10 | PNG Read but never sent | fixture Q10 |
| 11 | second stop after the block (stop_hook_active) | fixture Q11, blocks once only |
| 12 | bypass token | fixture Q12 |
| 13 | Next steps only inside a code fence | fixture Q13 |
| 14 | waiver only inside a code fence | fixture Q14 |
| 15 | upper-case .JPG | fixture Q15 |
| 16 | no transcript path | fixture Q16, fail-open |
| 17 | broken stdin | fixture P6, fail-open |
| 18 | ADHOC replies | handled: adhoc ids are not `qa=QA-<digits>` blocks; `adhoc-brief-first` owns their picture |
| 19 | image sent in an EARLIER turn of the same quest | accepted-risk: blocks again; one waiver line clears it, and a new decision usually needs a new picture |
| 20 | hooks run from the main folder, so a worktree edit is not live until main holds it | handled: landed with `lib/land-on-main.js` in the same turn |
| 21 | a held/blocked quest named in a reply | accepted-risk: only `status=active` counts, so a held ticket's hand-back is not checked; his ask was "every quest run" |
| 22 | a picture sent that is unrelated to the decision | accepted-risk: content is judgment; the skill row says what to draw |

**Contract**: BLOCK when the table has no 'What it means' column or a meaning cell under 5 words. **v2 (2026-10-14)**: also BLOCK when a row's subject has no heading or table row of its own above (at least 2 shared word stems; a mention in the opening paragraph does not count; a reply with no heading and no table is matched against its whole text). His words: "when I see the next steps, I read 'end the old download goal' then I scroll back up you didn't mention anything". Eval 11/11 (N3 = his exact reply).

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/next-steps-shape/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.

## Registration + scope
- Runs as a child of `domain/bundles/stop-reply-shape.json` (moved out of the forge's standalone settings.json entry, system-rules Rule 7).
- Paired injector: `domain/pre-reply-contract/pre-reply-contract.check.hook.js` now asks for `# | Action | What it means | Your reply`.
- state-scoped: no, state-agnostic.
- Eval: `next-steps-shape.eval.js` 8/8 (N1 = the exact 2026-09-30 flagged table). Bundle smoke: flagged table exit 2, fixed table exit 0.
