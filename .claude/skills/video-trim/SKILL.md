---
name: video-trim
description: Trim a ShareX screen-recording for Redmine upload — drop idle/loading stretches with mpdecimate, hard-trim the cursor-to-stop-button tail, write ONE output named "<urusan> - <fix desc>.mp4" into the active quest's highest-numbered Task subfolder, preserve the ShareX source until みや confirms. Triggers — "trim the video", "trim this video", "trim my video", "help me trim", "video for Redmine", "trim for upload", post-testing hand-back when a recent ShareX .mp4 exists.
---

# video-trim — ShareX screen-recording trim for Redmine

## What this does

After local testing, みや's ShareX screen recording lives at `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Documents\ShareX\Screenshots\<YYYY-MM>\` as a `.mp4`. Loading/idle stretches (server delays, the hang under test) dominate the duration. This skill drops the still stretches with `mpdecimate`, hard-trims the trailing cursor-move-to-stop-button region, and writes ONE trimmed output into the active quest's highest-numbered Task subfolder.

## Method — mpdecimate (v2, 2026-06-03)

`mpdecimate` drops near-duplicate (frozen/idle) frames; `setpts` re-times the kept frames so the clip plays continuously. This is the correct filter for screen recordings.

**Do NOT use `select='gt(scene,…)'`** — scene-detect keeps only hard cuts and shreds screen recordings (v1 bug: a 3-min recording came out 1.5s, QA-262495 2026-06-03).

## Naming (v2 — no ticket number)

Output = `<URUSAN> - <brief fix description>.mp4` (≤5-word description). Derive URUSAN from the active quest. Example: `PPJK - Kemas kini loading time fix.mp4`.

## Procedure

### Step 1 — Resolve source
```powershell
$month = Get-Date -Format "yyyy-MM"
$shareXdir = "C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Documents\ShareX\Screenshots\$month"
$latest = Get-ChildItem -Path $shareXdir -Filter *.mp4 | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```
If `$latest` empty → check previous month folder. If still empty → STOP and ask みや where the recording is.

### Step 2 — Resolve destination
Read `quest/active.txt` → relevant `qa=` block → `task_folder=`. Pick the highest-numbered immediate subfolder:
```powershell
$dest = Get-ChildItem -Path $taskFolder -Directory |
  Where-Object { $_.Name -match '^\d+\.' } |
  Sort-Object { [int]($_.Name -split '\.')[0] } -Descending | Select-Object -First 1
```

### Step 3 — Trim (mpdecimate + tail-trim)
```powershell
$duration = [double](ffprobe -v error -show_entries format=duration -of csv=p=0 "$($latest.FullName)")
$trimTo = [math]::Max(0, $duration - 2.5)   # drop last 2.5s (cursor → stop button)
$outName = "<URUSAN> - <brief fix desc>.mp4"
ffmpeg -y -i "$($latest.FullName)" -t $trimTo `
  -vf "mpdecimate,setpts=N/FRAME_RATE/TB" -an `
  -c:v libx264 -preset fast -crf 28 `
  "$($dest.FullName)\$outName"
```
**Short-recording safety**: if `$duration < 10`s, confirm before chopping 2.5s.

### Step 4 — Verify
Output must (a) exist, (b) be non-zero, (c) decode clean (`ffprobe -v error`), AND (d) have a SANE duration — not ≪ source (e.g. > max(10s, 10% of source)). Absurdly short → mpdecimate over-collapsed → surface, do NOT delete source.

### Step 5 — Preserve source until confirmed (v2 change)
Do NOT auto-delete. Surface the output + duration; let みや eyeball it, THEN delete the ShareX source on his go (OneDrive keeps version history as backup).

### Step 6 — Emit confirmation
```
Trim done — <urusan>: <outName> (Xs, Y MB), from <source>s.
Source preserved — say "delete source" once you've eyeballed it.
```

## Per-case overrides
| みや says | Behavior |
|---|---|
| "trim 0:15 to 0:42" | hard-cut to that range, skip mpdecimate |
| "no tail-trim" / "keep the ending" | skip `-t $trimTo` |
| "too jumpy" / "keep short pauses" | fall back to `freezedetect=n=-60dB:d=2` (cut only idle ≥2s; keeps natural pauses — slower to wire but smoother) |
| "delete the source" | `Remove-Item -LiteralPath $latest.FullName -Force` |

## Red flags — STOP if you catch yourself
- ShareX source month doesn't match → don't grab last month's silently; surface what was found
- Destination is the Task folder root (no numbered subfolder) → surface for みや to create `2. Fix\` etc.
- ffmpeg errors mid-process → preserve source, never partial-cleanup
- Output duration ≪ source → over-collapsed; surface + preserve source (the v1 failure mode)

## History
Created 2026-06-01 (S4). **v2 2026-06-03 (QA-262495)**: scene-detect `select` REPLACED with `mpdecimate` (scene-detect shredded a 3-min recording to 1.5s); dropped 2-output calibration → single output; naming → `<urusan> - <fix desc>.mp4` (no ticket number); source preserved-until-confirmed (was auto-delete); `freezedetect`-≥2s added as the "too jumpy" fallback (per みや's min-idle idea); Step 4 now checks duration sanity.
