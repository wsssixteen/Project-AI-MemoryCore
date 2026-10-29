---
name: explain-diagram
description: Explain with ONE small drawing, no bloat. ALWAYS invoke when miya says "draw", "diagram", "draw it", "draw it simply", "visualise", "show me", "use the diagram skill", "picture of", or when a reply is about to explain a flow, a structure, a comparison or a choice between options (a story diagram included). Picks table vs diagram-design picture (the default for any flow of 3+ boxes) vs a 2-box chat line, keeps the fewest boxes, marks his one step, checks the picture before sending.
---

# explain-diagram

One sentence of answer, then one drawing. Nothing he did not ask for.

## 1. Pick the size

| The thing to show | Use |
|---|---|
| Values side by side, no order between them | a table, not a drawing |
| **A flow or structure of 3 or more boxes: the picture is the default** (2026-10-27 per みや: "integrate using this diagram into our workflows ... starting with replacing the current story diagram") | a **picture** with the `diagram-design` plugin (section 3), rendered by `node lib/diagram-render.js` |
| A chain of 2 boxes or one line (`A → B`), or the picture route failed this turn | a **chat story diagram**: boxes `┌─┐│└─┘` and arrows, top to bottom, in a code block. A failed render is said in one line, with the FAIL text |
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

## 2b. Etanah issue (adhoc · quest): draw the urusan flow, mark the value (2026-10-28 per みや, ADHOC-MCL-2026-1)

**The rule**: draw the **business urusan flow**, not the code: one lane per module (Pendaftaran · Portal Awam · Pelupusan …). Layout, colours and checks stay as sections 2 and 3 already set them; only the details below change.

| Detail | Do | Banned |
|---|---|---|
| Steps | only the steps that make or show the value of concern; tugasan sub-steps fold into one box (Perserahan + Kemasukan + Keputusan → one "Pindahmilik" box, logins as its small line); **never drop the step that creates the value** (ADHOC-MCL-2026-1: Turun Milik and Pindahmilik made the split shares) | a box per tugasan · cutting the cause steps to save boxes |
| Which box to highlight | the box where the value starts wrong and the box where it shows wrong, nothing else | a highlighted step that does not hold the value |
| Which values to show | the value of concern only, written as the screen shows it (`MOHD TAUFIK 1/2`) | every field of the row |
| The action beside the value | the urusan that made each row, beside it, small and grey (`MOHD TAUFIK 1/2   Pindahmilik 2012`), so two rows that look the same are told apart | identical rows with no source |
| Text | labels and values only, short; a now ✗ / expected ✓ pair at the end | sentences inside boxes |

Example: the MCL simulation picture (Pendaftaran lane: Asal · Pindahmilik 2012 → Pindahmilik baru → owner rows, each with its urusan; Portal lane: Carian Rasmi → MCL Tab 2 → now ✗ / expected ✓).

## 3. Picture route (diagram-design)

1. Skill file: the `diagram-design` skill when loaded; in a session started before its install, read `%USERPROFILE%\.claude\plugins\cache\diagram-design\diagram-design\<version>\skills\diagram-design\SKILL.md` and its type reference by hand. Not installed at all → install it first (`.claude/auto-memory/project_installed_skills.md` has the command).
2. Type: the skill's §3 table (swimlane = who does what with handoffs · flowchart = decisions · sequence = messages in time). Copy its `assets/example-<type>.html`.
3. Style: default colours, unless the work is inside a `/project` with its own brand (`.claude/skills/project/SKILL.md` section 7). **Fonts: `'Segoe UI', Arial` for text, `Consolas` for code labels; delete the example's Google Fonts `<link>` and every `Instrument Serif` / `Geist` reference** (2026-10-27 per みや: a picture that goes to another team must not look made by Claude). **Padding inside `.frame`** (about 28px 32px, `box-sizing: content-box`): the renderer crops at `.frame`, so with no padding the drawing touches the PNG edge.
4. Write the file to the scratchpad, never into the repo or a Task folder unless he asks. One exception: a part's own diagram (system-design Rule 17) goes beside the part in the repo, e.g. `quest/requirement-index.diagram.html` + `.png`, then `node lib/diagram-census.js --check <part>` must exit 0.
5. Check + render in one call: `node lib/diagram-render.js <file.html>` (self-check, then a PNG from headless Edge; prints `DIAGRAM-RENDER: OK <png>` or `FAIL <why>`). Fix every FAIL and re-run. Then Read the PNG and LOOK at it: no overlaps, no text on lines, nothing cut off.
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

*2026-10-27 — the picture is the default for any flow or structure of 3+ boxes, per みや after the first Phase 0 picture ("Beautiful, that is really really helpful ... starting with replacing the current story diagram"); the chat story diagram stays for a 2-box line and for a failed render. Check + render is one Tool, `lib/diagram-render.js` (eval `node lib/diagram-render.eval.js`). Changed and named: the old "up to 8 boxes → chat story diagram" row is retired; the 9-box / 12-arrow budget and every content rule are unchanged.*
