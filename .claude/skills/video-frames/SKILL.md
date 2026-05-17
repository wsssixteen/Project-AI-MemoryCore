---
name: video-frames
description: Extract frames from a video file via ffmpeg and read each frame as an image — for analyzing screen recordings, BA bug demos, or any mp4/mov/avi/mkv/webm in 0. Brief/
allowed-tools: Bash, Read
---

# video-frames — Inline Video Frame Extraction (Own-Wrapper, No 3rd-Party Skill)

## Why this exists (instead of a 3rd-party skill)

Created 2026-05-09 after researching `fabriqaai/ffmpeg-analyse-video-skill` (8 stars, 6 commits, low trust signals). Decided to wrap ffmpeg directly — no 3rd-party install, fully transparent, every command visible to みや. Pairs with the Discovery "Media files in 0. Brief/" rule that previously required ASKing みや to summarize videos.

## Prerequisites (one-time)

ffmpeg must be available. Install on Windows:
```powershell
winget install Gyan.FFmpeg --scope user
```
After install, **PATH is only updated for new processes** — a Claude Desktop Code session running before the install won't see `ffmpeg` until the session is restarted.

**Current-session fallback** (use absolute path if `ffmpeg` not on PATH):
```
C:\Users\Ridhwan\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe
```
The skill detects this automatically — tries `ffmpeg` first, falls back to the absolute path. Same for `ffprobe.exe` in the same `bin\` directory. Verify with `ffmpeg -version` after a clean restart.

## How to invoke

Trigger phrases:
- `extract frames from <path>.mp4`
- `read video <path>`
- `watch video <path>`
- Auto-fired at Recon wrap-up if any media file in `0. Brief/` AND ffmpeg available

## Procedure

1. **Probe video** for duration + dimensions:
   ```bash
   ffprobe -v error -show_entries stream=width,height,duration,r_frame_rate \
     -of default=noprint_wrappers=1 "<input.mp4>"
   ```

2. **Decide frame rate** based on probe:
   - <30s video: 1 fps (every second)
   - 30s–2 min: 0.5 fps (every 2 seconds)
   - 2–5 min: 0.2 fps (every 5 seconds)
   - >5 min: 0.1 fps (every 10 seconds) + ASK みや if specific moment matters more

3. **Extract frames** to a temp dir:
   ```bash
   mkdir -p "C:/temp/video-frames-<ticket>"
   ffmpeg -i "<input.mp4>" -vf "fps=<rate>" \
     "C:/temp/video-frames-<ticket>/frame_%03d.png" -loglevel error
   ```

4. **List frames** + report count + total disk size to みや BEFORE reading them all (token budget visibility):
   ```bash
   ls "C:/temp/video-frames-<ticket>/" | wc -l
   du -sh "C:/temp/video-frames-<ticket>/"
   ```

5. **Read each frame** via the Read tool (PNG natively supported). Build a timeline summary:
   - Frame 001 (t=0s): <visual description>
   - Frame 002 (t=1s): <visual description>
   - ...

6. **Cleanup** after analysis (or ask みや if frames should be kept):
   ```bash
   rm -rf "C:/temp/video-frames-<ticket>/"
   ```

## Output format (Recon wrap-up integration)

When this skill fires for a Bug demo video, the Discovery reply should include:

```
## Video Analysis — <filename>
Duration: <X seconds> · Frames extracted: <N> at <rate> fps
Key moments:
  t=Xs: <observation>
  t=Ys: <observation>
Conclusion / what BA is showing: <one-line takeaway>
```

## Cost notes

- Each PNG is ~100-500 KB → reading 10 frames = ~5 MB total
- For long videos, ASK みや first if specific moment matters more — don't auto-extract 100 frames
- Token cost for vision analysis is real but bounded; estimate before extracting

## Lifecycle

- L1 (now): manual invoke, used in Discovery when BA's brief contains video
- L2 (after 3 quest cycles): refine frame-rate heuristics per video duration
- L3: integrate with Discovery scout familiar — auto-suggest frame extraction when video file detected

---

*Created: 2026-05-09 | Replaces the "ASK みや to summarize video" fallback when ffmpeg available*
