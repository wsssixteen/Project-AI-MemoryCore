---
name: disk-cleanup
description: Free space on みや's laptop safely — scan the disk, clear refillable caches, act on each known item only after his yes, and review his Genshin clips one by one (4 frames → upload to YouTube in Edge with his title + Public, delete, or keep). ALWAYS invoke on — "/disk-cleanup", "clean my laptop", "clean up my laptop", "free up space", "free space", "disk cleanup", "disk full", "C: is full", "no space left", "low on space", "upload my Genshin clips", "clear my clips".
---

# /disk-cleanup — laptop space, nothing of his lost

> born via core/forge.js 2026-10-14 · Feature `domain/disk-cleanup/` · engine `domain/disk-cleanup/disk-cleanup.js` · eval `node domain/disk-cleanup/disk-cleanup.eval.js`
> symptom: 2026-10-14 miya, C: at 0.2 GB free after a manual cleanup: "we have a lot of things to delete in onedrive and Claude VM and Genshin clips to upload to YouTube I feel like we should create a workflow"
> goal: his C: drive keeps room to work, and nothing of his is lost: every byte removed is either a refillable cache, an item he said yes to, or a clip confirmed live on YouTube first
> goal_signal: the run's log.jsonl rows show freed_gb, and every clip row with decision uploaded carries a YouTube URL
> retention: keep · footprint: on-demand: one node process per command, ~50 MB; ffmpeg for 4 frames per clip review

**One source.** The engine acts only on paths in `domain/disk-cleanup/catalog.json`, and every change needs `--yes`. Without `--yes` it only prints what it would do. A new item = a new catalog row, never a path typed at run time. Run it from PowerShell (the Bash tool hangs on this laptop: [[feedback_bash_tool]]).

Governing rules (link, not copy): reply shape = one drawing, one thing at a time (`feedback_reply_separation_of_concerns.md`) · browser = Edge via Claude in Chrome, never the built-in pane (`feedback_browser_edge_default.md`) · decisions go in popup questions (`feedback_do_dont_ask_answer_literal.md`).

## Steps

```
 1. scan ──▶ 2. caches ──▶ 3. items, one popup ──▶ 4. clips, one at a time ──▶ 5. report
```

| # | Run | Then |
|---|---|---|
| 1 | `node domain/disk-cleanup/disk-cleanup.js scan` | paste its drawing as is (it is the drawing) |
| 2 | `caches` (dry), then `caches --yes` | refillable only (npm, pip, temp over 7 days); no question needed, he ruled caches safe on 2026-10-14 |
| 3 | one AskUserQuestion, multiSelect, for the `delete` / `move` / `online-only` / `recycle` rows over 0.5 GB (label + GB + the catalog `note`) | for each ticked id: `act <id> --yes`, paste the DONE line. `keep` rows are never offered. `report` rows (Genshin game) = say his action in one line. `handoff` rows (worktrees) = run `/worktree-retrieve`, never delete them here |
| 4 | `clips` for the count, then the clip loop below | stop when he says stop; the rest wait for the next run |
| 5 | `scan` again | one line: C: free before → after, clips uploaded / deleted / kept |

### Clip loop (one clip per round)

1. `clip-next` → JSON with `file`, `date`, `duration_s`, `size_mb`, `frames`, `default_title`. Read the 4 frame images (Read tool), so he sees them in the reply.
2. One AskUserQuestion: **Upload as "<default_title>"** · **Delete (cutscene / not needed)** · **Keep for now** · (Other = he types his own title, which means upload with that title). Upload = his yes to publish this one clip publicly; a yes on one clip is never a yes on the next.
3. **Upload** (Claude in Chrome, Edge):
   - Load the tools in ONE ToolSearch: `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__find,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__file_upload,mcp__claude-in-chrome__form_input,mcp__claude-in-chrome__list_connected_browsers,mcp__claude-in-chrome__select_browser`. Pick the Edge instance. Edge not connected = say so in one line and stop the loop.
   - New tab → `https://studio.youtube.com` → Create → Upload videos → `file_upload` the clip's `file` into the file input.
   - Details: replace the title with his title · Audience "No, it's not made for kids" · Next until Visibility · **Public** · Publish.
   - Copy the video link the dialog shows (`https://youtu.be/<id>`).
   - Verify: open the link in a new tab, and read the page. It shows his title and plays, with no "Video unavailable" or "Private video". Still processing = wait and re-read, up to 3 times.
   - Only after that: `clip-done "<file>" --uploaded <link> --title "<title>"`. The engine refuses a link that is not a YouTube video link, and keeps the file.
4. **Delete**: `clip-done "<file>" --deleted`. **Keep**: `clip-done "<file>" --kept` (the next runs skip it).
5. Paste the engine's OK line, then go to the next clip.

**Banned**: deleting a clip before its YouTube link is open and shows his title · any path not in the catalog or the clips folder · `act` with `--yes` before his yes on that id · uploading through the YouTube API (Google locks API uploads from personal projects as private for good, so his "Public" cannot be met: https://support.google.com/youtube/answer/7300965) · the built-in browser.
