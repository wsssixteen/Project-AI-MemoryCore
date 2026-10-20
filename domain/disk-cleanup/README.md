# disk-cleanup — laptop space back, nothing of his lost

symptom: 2026-10-14 miya, C: at 0.2 GB free after a manual cleanup: "we have a lot of things to delete in onedrive and Claude VM and Genshin clips to upload to YouTube I feel like we should create a workflow"
goal: his C: drive keeps room to work, and nothing of his is lost: every byte removed is either a refillable cache, an item he said yes to, or a clip confirmed live on YouTube first
goal_signal: the run's log.jsonl rows show freed_gb, and every clip row with decision uploaded carries a YouTube URL
retention: keep
footprint: on-demand: one node process per command, ~50 MB; ffmpeg for 4 frames per clip review; nothing runs between his asks
registration: none (skill `/disk-cleanup`, description-matched)
state-scoped: no, state-agnostic (catalog paths are this laptop's; a second laptop gets its own catalog rows)

## What fires when

| When | What runs |
|---|---|
| He asks ("clean my laptop", "free up space", "upload my Genshin clips") | `.claude/skills/disk-cleanup/SKILL.md` → `disk-cleanup.js` commands |
| Never on its own | his ruling 2026-10-14: on demand only |

## Files

| File | Job |
|---|---|
| `catalog.json` | THE list of known items (path · action · note). Actions: `auto` (refillable cache) · `delete` · `move` · `online-only` · `recycle` · `handoff` · `report` · `keep` |
| `disk-cleanup.js` | engine: `scan` · `caches [--yes]` · `act <id> [--yes]` · `clips` · `clip-next` · `clip-done <file> --uploaded <url> --title "<t>" / --deleted / --kept` |
| `disk-cleanup.eval.js` | 28 fixtures on a throwaway catalog; never touches real paths |
| `log.jsonl` | one row per command: `ts · dur_ms · cmd · item/clip · outcome · freed_gb` (+ `url`, `title` for uploads) |

## His rulings (2026-10-14)

| Question | Ruling |
|---|---|
| Clip route | Edge upload in YouTube Studio, clip by clip; the YouTube API was dropped because Google locks API uploads from personal projects as private for good (https://support.google.com/youtube/answer/7300965) |
| Per clip | he sees 4 frames + date + length, then picks upload (title) / delete (cutscenes: Genshin lets him replay story scenes) / keep |
| Visibility | Public |
| Claude Cowork VM | keep |
| Trigger | on demand only |
| Worktrees in OneDrive (25 GB) | owned by `domain/worktree-cleanup-boot` + `/worktree-retrieve`; this Feature only reports them |

## Adversarial scenarios (system-design Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | A catalog row points at `C:\Users`, `C:\`, the profile root or a 2-segment path | fixture-added (S1, A6) |
| 2 | A catalog path uses `..` to climb out | fixture-added (S3, A7) |
| 3 | `act` run without his yes | fixture-added (A1): no `--yes` = dry |
| 4 | An unknown id is typed | fixture-added (A3) |
| 5 | A `keep` item (Claude VM, Whisper) is asked to be removed | fixture-added (A4): never touched |
| 6 | Worktrees with unmerged work | fixture-added (A5): handoff only, `/worktree-retrieve` decides |
| 7 | The item was already removed (or moved to D:) | fixture-added (A8): "already gone", exit 0 |
| 8 | A temp file is in use, or Claude's own temp folder | fixture-added (C2): skipped |
| 9 | A clip is marked uploaded with a Studio or wrong link | fixture-added (K2): refused, clip stays |
| 10 | A clip path outside the clips folder, or `..` out of it | fixture-added (K4, K5) |
| 11 | `clip-done` with no decision | fixture-added (K6) |
| 12 | A kept clip shows up again next run | fixture-added (K8) |
| 13 | Upload finished but YouTube is still processing | handled: the skill re-reads the link up to 3 times before `clip-done` |
| 14 | Edge is not connected to Claude in Chrome | handled: the skill stops the clip loop with one line |
| 15 | YouTube's daily upload limit is hit | handled: the upload fails in Studio, `clip-done` is never called, the clip stays for the next run |
| 16 | A title with quotes or emoji | fixture-added (K3) for quotes; emoji accepted-risk: Studio takes them, the log stores UTF-8 |
| 17 | He declines the admin prompt (Program Files items) | handled: `act` prints FAILED and exits 1, nothing half-deleted beyond what Windows allowed |
| 18 | D: is missing when moving screenshots | handled: `move` refuses when the target drive does not exist |
| 19 | Two sessions run the clip loop at once and upload the same clip twice | accepted-risk: on demand by him, one loop at a time; a duplicate costs one extra video he can delete, never a lost clip |
| 20 | The simplest instruction it could lose: "delete only after it is on YouTube" | fixture-added (K2, K3): the engine deletes an uploaded clip only with a valid video link, and the skill opens that link first |
| 21 | Scan walks a huge tree (worktrees: hundreds of thousands of files) | handled: worktrees size is read from the worktree-cleanup report, not walked |
| 22 | OneDrive is paused or offline when making files online-only | accepted-risk: `attrib +U` only marks them; OneDrive frees them when it syncs again |

**Eval**: `node domain/disk-cleanup/disk-cleanup.eval.js` → 28/28 green on 2026-10-14 (first run hung on A6 because a refused path was sized before the safety check; fixed: the check now runs first).
