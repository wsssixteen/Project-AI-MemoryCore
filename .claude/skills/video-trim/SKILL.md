---
name: video-trim
description: Trim a ShareX screen-recording for Redmine upload — auto-detect idle/loading stretches and cut them out, hard-trim the cursor-to-stop-button tail, produce 2 calibration-mode outputs (aggressive + conservative), save into the highest-numbered Task subfolder, delete the ShareX source on success. Triggers — "trim the video", "trim this video", "trim my video", "help me trim", "video for Redmine", "trim for upload", post-testing hand-back when a recent ShareX .mp4 exists.
---

# video-trim — ShareX screen-recording trim for Redmine

## What this does

After local testing, みや's ShareX screen recording lives at `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Documents\ShareX\Screenshots\<YYYY-MM>\` as a `.mp4`. Loading stretches (server-side delays) dominate the duration. This skill detects motion-vs-still segments, drops the still stretches, hard-trims the trailing cursor-move-to-stop-button region, and writes 2 calibration outputs into the active quest's highest-numbered Task subfolder so みや picks one and deletes the other.

## Why 2 outputs (calibration mode)

`v1` produces 2 outputs because the motion-detection threshold needs calibrating on みや's actual recording profile (cursor speed, scroll pattern, app render style). After 3-5 successful runs where みや consistently picks the same one, drop to single-output `v2`.

| Output | Threshold | Naming |
|---|---|---|
| Aggressive (tight cuts) | high motion threshold — drops anything below clear movement | `<orig-stem>-aggressive.mp4` |
| Conservative (loose cuts) | low motion threshold — keeps borderline motion stretches | `<orig-stem>-conservative.mp4` |

## Procedure

### Step 1 — Resolve source

```powershell
$month = Get-Date -Format "yyyy-MM"
$shareXdir = "C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Documents\ShareX\Screenshots\$month"
$latest = Get-ChildItem -Path $shareXdir -Filter *.mp4 | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

If `$latest` is empty → check previous month folder (`Get-Date -Format "yyyy-MM"` minus one month). If still empty → STOP and ask みや where the recording is.

### Step 2 — Resolve destination

Read `quest/active.txt` → find the relevant `qa=` block → `task_folder=` field. Inside that, enumerate immediate subfolders that start with a number:

```powershell
$taskFolder = "<task_folder from active.txt>"
$dest = Get-ChildItem -Path $taskFolder -Directory |
  Where-Object { $_.Name -match '^\d+\.' } |
  Sort-Object { [int]($_.Name -split '\.')[0] } -Descending |
  Select-Object -First 1
```

Pattern: `2. Fix\` for new quest, `3. Rework\` / `3. New\` for cycle 2, `4. <name>\` for cycle 3, etc. Highest number = current cycle's working folder.

### Step 3 — Detect motion segments + tail-trim

Use ffmpeg `select` filter with scene-change threshold to keep only motion-bearing frames, then re-stitch:

```powershell
# Get duration first for tail-trim math
$duration = ffprobe -v error -show_entries format=duration -of csv=p=0 "$($latest.FullName)"
$trimTo = [math]::Max(0, [double]$duration - 2.5)  # drop last 2.5s (cursor → stop button)

# Aggressive (threshold 0.005)
ffmpeg -i "$($latest.FullName)" -t $trimTo `
  -vf "select='gt(scene,0.005)',setpts=N/FRAME_RATE/TB" `
  -af "aselect='gt(scene,0.005)',asetpts=N/SR/TB" `
  -c:v libx264 -preset fast -crf 28 `
  "$($dest.FullName)\$($latest.BaseName)-aggressive.mp4"

# Conservative (threshold 0.002)
ffmpeg -i "$($latest.FullName)" -t $trimTo `
  -vf "select='gt(scene,0.002)',setpts=N/FRAME_RATE/TB" `
  -af "aselect='gt(scene,0.002)',asetpts=N/SR/TB" `
  -c:v libx264 -preset fast -crf 28 `
  "$($dest.FullName)\$($latest.BaseName)-conservative.mp4"
```

**Short-recording safety**: if `$duration < 10` seconds, surface for confirmation before chopping 2.5s off (would risk leaving a 5-sec clip at 2.5s). Override with みや's input.

### Step 4 — Verify outputs

Each output must (a) exist, (b) be non-zero size, (c) play via `ffprobe -v error <file>` (no decode errors). If any fails: keep source, surface error, do NOT delete.

### Step 5 — Delete ShareX source

Only if Step 4 passes for BOTH outputs:

```powershell
Remove-Item -LiteralPath $latest.FullName -Force
```

Source stays in OneDrive's version history as backup.

### Step 6 — Emit confirmation

```
Trim done — QA-<num>:
  Source (deleted): <ShareX path>
  Outputs (in <dest folder>):
    - <name>-aggressive.mp4 (Xs, YkB)
    - <name>-conservative.mp4 (Zs, WkB)
  Pick one, delete the other. Feedback: which threshold worked?
```

## Calibration → v2

After 3-5 runs where みや consistently picks (e.g.) `-aggressive`, retire the conservative output and ship single `<name>.mp4` using the converged threshold. Update this skill's v1 → v2 then.

## Per-case overrides (when みや mentions)

| みや says | Behavior |
|---|---|
| "trim 0:15 to 0:42" | Skip motion-detect entirely; hard-cut to that range |
| "no tail-trim" / "keep the ending" | Skip Step 3's `-t $trimTo`; keep full duration |
| "don't delete source" | Skip Step 5 |
| "just one output" | Run aggressive only; matches eventual v2 shape |

## Red flags — STOP if you catch yourself:

- ShareX source path doesn't match current month → don't grab last month's file silently; surface what month was found
- Destination folder is the Task folder root (not a numbered subfolder) → that means `2. Fix\` etc. doesn't exist yet; surface for みや to create
- ffmpeg errors mid-process → preserve source, never partial-cleanup

## History

Created 2026-06-01 by みや design conversation (S4). Trigger photo: みや trims testing recordings for Redmine evidence uploads; loading stretches in local Etanah testing dominate runtime; manual trim was a recurring time-sink. Calibration mode locked after the "always 2" decision reversed and re-confirmed in same session (2-during-calibration → 1-once-converged).
