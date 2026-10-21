---
name: explain-diagram
description: Explain with ONE small drawing, no bloat. ALWAYS invoke when miya says "draw", "diagram", "draw it", "draw it simply", "visualise", "show me", "use the diagram skill", "picture of", or when a reply is about to explain a flow, a structure, a comparison or a choice between options. Picks table vs chat story diagram vs diagram-design picture, keeps the fewest boxes, marks his one step, checks the picture before sending.
---

# explain-diagram

One sentence of answer, then one drawing. Nothing he did not ask for.

## 1. Pick the size

| The thing to show | Use |
|---|---|
| Values side by side, no order between them | a table, not a drawing |
| A flow or structure of up to 8 boxes, in a chat reply | a **chat story diagram**: boxes `┌─┐│└─┘` and arrows, top to bottom, in a code block |
| He says picture / diagram skill / draw it, or there are several actors handing work to each other, or more than 8 boxes | a **picture** with the `diagram-design` plugin (section 3) |
| Options he must choose between | one drawing of the options side by side (CLAUDE.md 0a) |

## 2. Content rules (both sizes)

| Rule | Banned |
|---|---|
| One idea per box; two boxes that always go together are one box | a box per function call |
| Box text = plain words he already knows; a technical name only as the small second line | `file:line`, SQL, class names as box titles |
| Mark ONE thing: his action, or the one changed step (the picture's accent colour, the chat diagram's `◄`) | three highlights |
| At most 9 boxes and 12 arrows; more = split into an overview + one detail | "complete" diagrams that need a legend to read |
| Title says what it shows ("Running a PROD alter: your one step") | "Diagram", "Overview" |
| Remove test before sending: can a box, an arrow or a label go? Then it goes | — |

For explaining a change to an existing part, the four rows + flow with the one changed step marked: `.claude/reply-shape-spec.md` §3d.

## 3. Picture route (diagram-design)

1. Skill file: the `diagram-design` skill when loaded; in a session started before its install, read `%USERPROFILE%\.claude\plugins\cache\diagram-design\diagram-design\<version>\skills\diagram-design\SKILL.md` and its type reference by hand. Not installed at all → install it first (`.claude/auto-memory/project_installed_skills.md` has the command).
2. Type: the skill's §3 table (swimlane = who does what with handoffs · flowchart = decisions · sequence = messages in time). Copy its `assets/example-<type>.html`.
3. Style: default colours, unless the work is inside a `/project` with its own brand (`.claude/skills/project/SKILL.md` section 7).
4. Write the file to the scratchpad, never into the repo or a Task folder unless he asks.
5. Check: `python <skill-dir>\scripts\self_check.py <file>` must print OK; then render a PNG with headless Edge (Playwright from `E:\Dev\scripts\attendance\node_modules`) and LOOK at it: no overlaps, no text on lines, nothing cut off.
6. Send the PNG with `SendUserFile` (display `render`); the HTML only if he asks.

## 4. The reply

| Order | What |
|---|---|
| 1 | One sentence: the answer |
| 2 | The drawing (or the sent picture) |
| 3 | At most 3 short bullets for what the drawing cannot show |

**Banned**: a paragraph explaining what the drawing already shows · a second drawing of the same thing · a legend of things not in the drawing · sending a picture nobody looked at.

symptom: 2026-10-21 miya: 'create a skill to properly use diagrams to explain, no bloats, direct'
goal: every explanation that a drawing can carry arrives as one small drawing with the answer in one sentence above it
goal_signal: the reply's first line is one sentence and the next block is a diagram (story diagram or a sent picture) with at most 9 boxes
retention: keep
footprint: on-demand: no process; a picture run starts one python self-check and one headless Edge, both exit
