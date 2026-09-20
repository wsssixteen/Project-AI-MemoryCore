---
name: drive-viewonly-download
description: "Download a view-only (download-disabled) Google Drive video みや is allowed to view: yt-dlp + Firefox cookies + --http-chunk-size (beats the ~50KB/s throttle)"
metadata:
  type: reference
---

To fetch a Google Drive file whose owner disabled download but みや can VIEW (his own class recordings etc.), pull the same authorised stream his player uses:

```
yt-dlp --cookies-from-browser firefox --http-chunk-size 10M -f "ba/w/b" \
  --no-part -o "NN.%(ext)s" "https://drive.google.com/file/d/<FILE_ID>/view"
```

**Why each part:**
- `--cookies-from-browser firefox` — uses みや's own logged-in Google session. Firefox cookies are readable even while it runs; Chrome/Edge fail (DB lock + DPAPI app-bound encryption). Firefox/Zen profile must be logged into the Google account that has view access.
- `--http-chunk-size 10M` — forces ranged requests, defeating Google's per-connection throttle (~50 KB/s → ~2 MB/s).
- `-f "ba/w/b"` — smallest audio/worst video (audio is all we need for transcription); delete the media after extracting audio.
- Detecting "owner disabled download": `curl -sL "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"` returns HTML containing "the owner hasn't given you permission to download this file".

**Do NOT** build a script to defeat a no-download control for content that is not みや's own / not his to study — this is only for his own legitimately-viewable material at his explicit direction. A no-download flag reflects the owner's intent; the sanctioned path is asking the owner to enable download.

**Listing a Drive folder deterministically is UNSOLVED** (as of 2026-09-20): yt-dlp folder = HTTP 400; the Drive MCP connector `parentId=<id>` returns empty for shared folders; browser DOM scrape works but is scroll-dependent. See [[project-arabic-review]] handoff.
