# story-video - an issue that happened through a long chain of events, as a short plain-English video

symptom: 2026-10-20 miya: the one-off explainer video for the PLPS SDS no-next-task issue (#300) was accepted; he wants to say "SV" / "story video" for any issue that happened through a long chain of events
goal: any issue with a long chain of events becomes a short plain-English explainer video a non-technical viewer follows, through one checked path instead of a rebuilt script each time
goal_signal: lint passes, the render exists, one external reader returned all_good, and the MP4 sits in the Task folder
retention: keep (examples/ and the code); the rendered MP4s live in the Task folders, never here
footprint: on-demand: one python render (about 400 MB RAM, about 9 min for a 69 s video on this laptop) plus one ffmpeg process per video; the eval takes under 30 s
state-scoped: no, state-agnostic (the engine knows no state; the example is a Melaka ticket, a Perak or Terengganu story is just another scenes JSON)
root_cause_of_symptom: the accepted video was built from a one-off script (`scenes.py` + `make_video.py`) in a session scratchpad; the next issue would have meant rebuilding it and re-learning every rule from the review rounds.

## What fires when

| When | What runs | Why that moment |
|---|---|---|
| miya says SV / story video | `.claude/skills/story-video/SKILL.md` (the procedure) | only when he asks; nothing runs at boot or per prompt |
| before drawing | `lint.js` (called by `render.py` too) | a bad story is refused before 9 minutes of rendering |
| render | `render.py` (+ `music.py`, `draw.py`) | the one slow step |
| change of this Feature | `eval.js` | pins lint, kinds and the skill in step |

## Files

| File | Role |
|---|---|
| `render.py` | scenes JSON -> MP4 (1920x1080, 30 fps, H.264 yuv420p crf 20, AAC 160k); `--dry`, `--contact`, `--frame` |
| `draw.py` | drawing primitives and the Avalon green palette (Segoe UI, Consolas; Windows fonts) |
| `music.py` | the quiet chill pad, length from the scenes (RMS -28 dBFS, peak -18 dBFS) |
| `lint.js` | checks a scenes JSON, exit 1 with one line per finding |
| `kinds.json` | ONE source of the numbers: limits, scene timing; read by `render.py` and `lint.js` |
| `examples/plps-2026-2.json` | the accepted PLPS video in this format, plus the "what the user saw" and "after the fix" scenes |
| `eval.js` | lint on the example + 30 bad inputs + skill/README/renderer sync + renderer smoke |
| `NUKE-MARKER.md` | rollback recipe |

## Commands

```
node domain/story-video/lint.js <scenes.json>
python domain/story-video/render.py <scenes.json> <out.mp4> --contact <sheet.png>
python domain/story-video/render.py <scenes.json> --dry --contact <sheet.png>     (no video, about 10 s)
python domain/story-video/render.py <scenes.json> --frame 12.5 <frame.png>
python domain/story-video/music.py <scenes.json> <out.wav>
node domain/story-video/eval.js
```

## Scene JSON

Scene kinds: `title`, `card`, `copy`, `steps`, `checklist`, `screen`.

```
{ "ticket": "...", "story": "...",                       (free notes, not drawn)
  "allowed_terms": ["penghantaranId", "urusan"],         (the root-cause thing being changed: max 3, each must be in a "fix" scene)
  "known_names": ["PLPS", "Semakan JTLTPM"],             (names the viewer sees on their own screen: max 6, may look like a code)
  "scenes": [ { "kind": ..., "role": ..., "headline": ..., "detail": ..., "caption": ..., "seconds": ... , <kind fields> } ] }
```

| Common field | Rule |
|---|---|
| `role` | `title` / `saw` / `event` / `fix` / `after` (default: title for the title kind, else event; an `event` headline starts with its date, "29 Sep: ...") |
| `headline` | at most 36 chars (title: 30) |
| `detail` | optional, at most 60 chars, one line under the headline |
| `caption` | at most 55 chars, required on every kind but `title`; fully visible at least 7 s, so `seconds` is 9 or more |

| Kind | Fields | Draws |
|---|---|---|
| `title` | headline, detail | green page, ticket reference, one line |
| `card` | `card: {title, lines:[1-2], bad?}` | one card; a line is a text or `{k, v}` (key = value in monospace) |
| `copy` | `from`, `to` (cards), `label`, `layout` auto / vertical / horizontal | card, arrow with label, card (stacked when the text is long) |
| `steps` | `steps: [2-3 of text or {text, bad}]` | boxes left to right with arrows, a `bad` one is red |
| `checklist` | `items: [2-4 texts]` | ticked lines; allowed terms get a highlight chip |
| `screen` | `screen: {title, values:[1-2 of {label, value, bad?}]}` | a mock of what the user saw |

Limits live in `kinds.json`: 7 scenes, 4 labelled things per scene, 3 allowed terms. Banned in any text: process, flow, variable, bag, engine, callback, Flowable, eTanah, database, SQL, query, script, API, server (word list in `lint.js`); task codes of 3-8 capitals; camelCase / snake_case names, unless declared; hedging (proposed, expected, should ...) in a `fix` / `after` scene.

## STATE-SCOPE

State-agnostic. The only per-ticket text is in the scenes JSON, written from the ticket.

## Known weaknesses

- Windows only (Segoe UI and Consolas under `C:/Windows/Fonts`).
- The lint cannot judge whether a story is clear: that is the external reader of step 4 of the skill.
- `known_names` and `allowed_terms` are declarations: a task code declared there passes. The skill's step 1 table, shown to miya, is the check on that.
- Rendering is slow (about 8 s per second of video) because every animated frame is drawn at 2x then downscaled.
