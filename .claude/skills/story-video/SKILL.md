---
name: story-video
description: Turn an issue that happened through a long chain of events into a short plain-English explainer video (5-7 scenes, about a minute) for a non-technical viewer. ALWAYS invoke on — "SV", "/sv", "story video", "story video for <ticket/adhoc>", "make a video of how the issue happened", "explain this issue as a video". Writes the scene table, lints a scenes JSON, renders the MP4, has one external reader check it, and drops it in the Task folder.
---

# /sv — story video

> born via core/forge.js 2026-10-20 · Feature `domain/story-video/` · eval `node domain/story-video/eval.js`
> symptom: 2026-10-20 miya: the one-off explainer video for the PLPS SDS no-next-task issue was accepted; he wants to say SV for any issue that happened through a long chain of events
> goal: any issue with a long chain of events becomes a short plain-English explainer video a non-technical viewer follows, through one checked path instead of a rebuilt script each time
> goal_signal: lint passes, the render exists, one external reader returned all_good, and the MP4 sits in the Task folder
> retention: keep · footprint: on-demand: one python render (about 400 MB RAM, about 9 min for 69 s) plus one ffmpeg process per video

Scene kinds: `title`, `card`, `copy`, `steps`, `checklist`, `screen`.

The renderer, the lint and the numbers live in `domain/story-video/` (`render.py`, `lint.js`, `kinds.json`; schema in its README). The first real input is `domain/story-video/examples/plps-2026-2.json` (the accepted PLPS video, #300). Run every command from the MemoryCore root.

## Default story shape (6 to 7 scenes)

| # | Role | Scene kind | Says |
|---|---|---|---|
| 1 | `title` | `title` | the ticket reference + one line: why it happened |
| 2 | `saw` | `screen` | what the user saw: the screen and its 1-2 wrong values (e.g. Pergerakan Fail: tiada rekod, Carian Pintas: Baru) |
| 3-5 | `event` | `card` / `copy` / `steps` | one dated event each (headline starts with the date), ONE short `detail` line: who and what (e.g. "On Semakan Dan Syor (Siasatan Tanah)") |
| 6 | `fix` | `checklist` | the fix, 2-4 ticked lines: THE fix, never "proposed" or "expected" |
| 7 | `after` | `card` / `steps` | after the fix: who gets the file next (e.g. Semakan JTLTPM is back on the officer's list) |

## Steps

| # | Do | Proof |
|---|---|---|
| 1 | Write the scene script as a TABLE (scene · on screen · caption) in plain English and SHOW miya before rendering. Every date and name comes from the ticket, the DB or the quest MD, never guessed. | the table in chat |
| 2 | Save the scenes as JSON in the scratchpad. `node domain/story-video/lint.js <scenes.json>` until `LINT OK`. | `LINT OK` line |
| 3 | `python domain/story-video/render.py <scenes.json> <scratchpad>/<name>.mp4 --contact <scratchpad>/contact.png`. Read the contact sheet: fix anything clipped, small or crowded. A `WARN text shrunk` line means shorten that text. | the contact sheet, read |
| 4 | One external checker (a sonnet agent, a non-technical viewer) gets the contact sheet and one frame per scene (`ffmpeg -ss <t> -i x.mp4 -frames:v 1`) and answers a schema: `jargon` · `overloaded_scenes` · `readability` · `story_clear` · `glitches` · `audio` · `verdict`. Audio: `ffmpeg -i x.mp4 -af volumedetect -vn -f null NUL` reads mean about -28 dB, max about -18 dB. Deliver only on `all_good`, or after fixing and re-checking. My own look is a draft gate, never the ship gate. | the checker's verdict |
| 5 | Copy the final MP4 into the quest or adhoc Task folder `2. Fix\` (or the current `N. Rework\`) as `<n>. How the issue happens.mp4` (n = next free number, never overwrite) and give miya the path. | the file in the folder |

## Rules (plain English)

- The viewer is not technical: say what happened to the file, not how the system works.
- Only the root-cause thing being changed may use its technical word: declare it in `allowed_terms` (at most 3), and it must appear in the fix scene.
- No task codes, no system words (process, flow, variable, engine, database, script ...). A name the viewer sees on their own screen goes in `known_names`.
- One idea per scene, at most 4 labelled things on it.
- A caption is at most 55 characters and fully visible for at least 7 s (so a scene is 9 s or more).
- Big type: headline 80 px, detail 40 px, caption 48 px, nothing under 36 px.
- A known fix is THE fix: "proposed", "expected", "should", "might" are banned in the fix and after scenes.
- Every event scene carries its date.
- Animation only in the first 2-3 s of a scene, then still; quiet music; no voice.
- Related rules (link, not copy): `.claude/auto-memory/feedback_verify_generated_art_externally.md` (external check is the ship gate; v1 and v2 of the first video were rejected for overload, speed and jargon) · `domain/pena/modules.json` module `plain` (BA wording).

## Checks

`node domain/story-video/eval.js` runs the lint on the example (must pass), on 30 bad inputs (must fail, each with its finding), and checks that the scene kinds named here, in the README, in `kinds.json` and in `render.py` are the same list. A kind added on one side and not the others turns the check red.
