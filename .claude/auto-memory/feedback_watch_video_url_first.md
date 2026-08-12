---
name: feedback_watch_video_url_first
description: "MANDATORY Phase 0 — extract frames from every video/screen-recording attachment and READ THE URL BAR; the URL's .xhtml path is the authoritative screen identity. A UI-render fix is BANNED until the exact form is confirmed from that URL, never guessed."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bb314863-3a57-4f05-a939-94f49cf121c3
  modified: 2026-08-12T03:11:37.151Z
---

**At Phase 0, reading `0. Brief/` attachments: for EVERY video / screen-recording / browser-screenshot, extract frames (`video-frames` skill) and READ THE URL BAR + the visible screen. The URL path (`.../protected/<area>/<Form>.xhtml`) is the AUTHORITATIVE identity of the screen the BA is on — it outranks any code-grep guess.**

**Iron rule**: a diagnosis or fix for a UI-rendered symptom is BANNED until the exact form/xhtml is confirmed from the attachment's URL. Naming a form from grep/theory while an unwatched video holds the URL = the failure this kills. Watching the video is NOT optional "if the filename matches" — it is mandatory for every media file.

**Why** (2026-08-12, QA-274318 — みや furious, twice): the BA video's URL bar clearly read `etanah-pelupusan/protected/jpph/UtilitiKemaskiniUlasanJPPHForm`. I never watched it, guessed across THREE wrong pelupusan forms (`MlkUlasanJPPHForm`, `MlkJabatanTeknikalTerlibatForm`, `PelupusanSearchService`), **applied a fix + built a full test scenario on a form that never renders the BA's page**, and only found the truth when みや sent the URL screenshot himself. The real screen was etanah-common. One frame at Phase 0 would have named it in seconds.

**How to apply**:
1. Every media file in `0. Brief/` → `video-frames` extract → emit `<file> — URL: <full url> · screen: <what's visible>`.
2. Derive the exact `.xhtml` + owning module from the URL path (`/etanah-pelupusan/protected/jpph/...` = etanah-common overlay, not necessarily pelupusan src).
3. Only THEN name the form / trace bindings / propose a fix.

Pairs with [[feedback_show_diagram_for_issues]] + the multi-dim-evidence rule + [[reference_utiliti_ulasan_jt_jpph_screen]]. Over-confidence corollary: "strongest static candidate" ≠ "confirmed screen" — confirm from the render surface (URL) before applying or handing off.
