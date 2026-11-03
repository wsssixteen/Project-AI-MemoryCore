# next-steps-shape

symptom: 2026-09-30 miya: 'not sure what you're talking about. Please fix this behaviour. next steps without short explanation.'
goal: every Next steps row tells miya in plain words what the item is and why it needs him
goal_signal: the reply's Next steps table has a What it means column with a 5+ word sentence per row
retention: rotate monthly
footprint: per-turn: joins the stop-reply-shape bundle, 1 node child, ~30 MB, <200 ms

diagram: domain/next-steps-shape/diagram.png (v5 step marked)
self_audit: the eval replays every fixture (`node domain/next-steps-shape/next-steps-shape.eval.js`); each fire writes passed/blocked with the reason and, from v3, the picture verdict to log.jsonl

**What fires when**: Stop — a reply ends with a Next steps table

**v3 (2026-10-29, per みや on 286655: "I didn't see any story diagram using your diagram skill to decide. Why do you fail to show this on every quest run?")**: a quest reply (it names the number of a `status=active` block in `quest/active.txt`) that ends with Next steps BLOCKS once unless this turn sent an image with `SendUserFile` or the reply carries `Diagram: none (<reason>)` outside a code fence. Turn events come from `lib/adhoc-brief-first.js` (shared parser, same as the adhoc picture check). Paired skill text: quest SKILL.md Pre-emit gate row 🧭. Eval 27/27.

**v4 (2026-10-30, per みや on 287273: "Please ensure our current quest workflow will always stop with showing the issue using diagram skill.")**: the Next steps condition is dropped from the picture check. EVERY quest reply (names an active `qa=QA-<n>` number outside a code fence) blocks once unless this turn sent an image or the reply carries `Diagram: none (<reason>)`. Spec kept: waiver line, once-only block, fail-open, image-only, ticket outside fences, bypass. Changed and named: Q7 (quest mention, no Next steps) now blocks; Q13 now pins "ticket only inside a fence → pass". Eval 29/29 (Q17, Q18 added).

**v5 (2026-11-03, per みや on 287925: "do not put in quotation marks like that, put it like the easy way to copy and pastse but I guess the approve both also works", then "Yes, make it a rule")**: after the meaning check, a "Your reply" cell that holds an approval code or an "approve" / "post it" / "submit it" phrase BLOCKS with reason `approval-in-cell`. The fix it names: the exact text in its own ```text block under the row's heading, the cell says "the block above"; a popup (AskUserQuestion) is better where the gate takes it. Code pattern `(?<![\w-])[A-Z0-9]{4}-[A-Z0-9]{4}(?![\w-])`, case-sensitive; word pattern `\b(?:approve|post it|submit it)\b`, any case. Changed and named: the brief's single `/i` pattern was split, because `/i` on the code part blocks "long-term" and the stand-alone guard keeps `ADHOC-MLPS-2026-4` out (fixtures A11, A12). Spec kept: v1 to v4 checks, their order, bypass, fail-open, once-only block. Paired text: `pre-reply-contract` injector line · `.claude/reply-shape-spec.md` §3f · memory `feedback_commands_never_fenced`. Eval 54/54 (A1 to A25 added).

| # | Adversarial scenario (Rule 12, v5) | Verdict |
|---|---|---|
| 29 | the 287925 cell, code in straight quotes | fixture A2 |
| 30 | code in its own ```text block, cell "the block above" | fixture A1 |
| 31 | code in inline backticks in the cell | fixture A3 |
| 32 | bare code in the cell | fixture A4 |
| 33 | "approve both" (no code) | fixture A5 |
| 34 | capital "Approve" as a button word | fixture A6 |
| 35 | "post it" / "submit it" | fixtures A7, A8 |
| 36 | "approve" inside the What it means cell | fixture A9 |
| 37 | "approved" (past tense) | fixture A10 |
| 38 | lower-case hyphen word "long-term" | fixture A11 |
| 39 | adhoc id ADHOC-MLPS-2026-4 | fixture A12 |
| 40 | a date 2026-11-03 | fixture A13 |
| 41 | code only in the Action cell | fixture A14 |
| 42 | table with no "Your reply" column | fixture A15: check does not run |
| 43 | two rows, only row 2 holds a code | fixture A16: names row 2 only |
| 44 | the banned shape quoted inside a code fence | fixture A17 |
| 45 | bypass token | fixture A18 |
| 46 | "approval" (the noun), a popup pointer | fixture A19 |
| 47 | lower-case code | fixture A20, accepted-risk: alter.js prints codes upper case |
| 48 | short meaning and a code in the same row | fixture A21: meaning block first, one fault at a time |
| 49 | "approve the block above" | fixture A22: blocks; the cell says only "the block above" |
| 50 | code with no hyphen | fixture A23, accepted-risk: alter codes carry the hyphen |
| 51 | code in curly quotes | fixture A24 |
| 52 | "resubmit it" | fixture A25 |
| 53 | approval text in a plain numbered list, not a table | accepted-risk: Next steps is a table by rule (pre-reply-contract); a list is that gate's fault class |
| 54 | approval asked by popup | handled: no table cell at all; `lib/his-words.js` reads the popup answer |

| # | Adversarial scenario (Rule 12, v4 additions) | Verdict |
|---|---|---|
| 23 | quest reply with no Next steps, no picture (the v4 case) | fixture Q7 |
| 24 | quest reply with no Next steps, picture sent | fixture Q17 |
| 25 | short yes/no quest answer | fixture Q18: waiver line clears it |
| 26 | a reply naming several active tickets (board, briefing) | accepted-risk: one waiver line clears it; a board reply is not a quest stop |
| 27 | the picture went out earlier in the same turn, before a long tool run | handled: turn events cover the whole turn |
| 28 | a commit-only or deploy-only stop | accepted-risk: waiver line names it; his ask was "always" |

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
