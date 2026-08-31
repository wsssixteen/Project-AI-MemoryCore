---
name: reference_mas_ergonomics_animation
description: "MAS crew ergonomics animation project — deliverables, Claude Design handoff URL, brand palette, source files"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 25e61ead-8752-4349-ae9c-b1c67046b0d0
  modified: 2026-08-31T05:56:37.880Z
---

Malaysia Airlines crew OSH **ergonomics animation** (2:00, silent, 1280×720). Project folder: `projects/coding-projects/active/mas-ergonomics-animation/`.

**Two delivered formats (same 10-scene animation):**
- Video — `MAS-Ergonomics-STUDIO.mp4` (crf16 master) + `MAS-Ergonomics-STUDIO-mobile.mp4` (crf23).
- Interactive artifact (autoplay+loop) — https://claude.ai/code/artifact/c5c7aa50-b301-4a41-a294-3fafde21382e

**🎨 Claude Design handoff (miya refines the design here; the final polished version SAVES to this URL):**
https://claude.ai/design/p/18133e80-da9a-4b09-a956-904a63bb1f7d?file=Ergonomic+Awareness.dc.html&via=share

**Build:** canvas engine `ergonomics_studio.html` (draw funcs) + `scenes.js` (10-scene timeline), headless-rendered by `render_node.js` → 3600 PNG → ffmpeg. Self-contained artifact = `ergonomics_artifact.html` (scenes inlined). Task A alternative track = `MAS-Ergonomics-LIVE.mp4` (real storyboard cutouts + LaMa-inpainted plates).

**Brand palette (exact):** NAVY `#002B5C` · RED `#ED1C23` · crew-TEAL `#0E8C8C` · INK `#1B2436` · PAPER `#F7F9FC` · SKY `#DCEBFA`. Logo = MAS wau kite + wordmark.

**Source spec:** two storyboard images `WhatsApp Image 2026-08-19 at 12.23.33 AM.jpeg` + `... 12.37.38 AM.jpeg` — these ARE the visual spec ([[feedback_visual_samples_are_the_spec]]).

**Verification lesson ([[feedback_verify_generated_art_externally]]):** generated ART is verified by an EXTERNAL agent ("does this read as a real X?"), never by self-approval — self-rubberstamp shipped a windowless-tube plane + a fighter-jet redesign before the external check caught both.
