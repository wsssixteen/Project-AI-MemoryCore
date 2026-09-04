---
name: feedback-visual-samples-are-the-spec
description: "User-provided sample images ARE the visual spec — reuse/scale their art and match their look; verify output frames against the sample image, not just its text"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 25e61ead-8752-4349-ae9c-b1c67046b0d0
  modified: 2026-08-27T14:58:51.250Z
---

When みや provides sample images (storyboard, mockup, reference shots) for a visual deliverable (video, slides, UI), the images are the VISUAL SPEC, not just a text source.

**Why:** 2026-08-27 MAS ergonomics animation — みや gave 2 storyboard images + the company name and said "you can simply scale it up". I extracted only the text/layout and redrew minimal flat vectors with empty backgrounds; also shipped figure defects (legs drawn over the kebaya dress, unreadable pulling pose) because the QA pass compared frames to the storyboard's TEXT, never its IMAGE. みや: "I even gave 2 samples to you and you still didn't follow it."

**How to apply:**
1. Ask for / locate the sample image FILES on disk at intake (chat-pasted images cannot be extracted to files); plan to upscale + reuse their art (crop panels, inpaint, animate over) before considering a redraw.
2. If redrawing, match the sample's richness: backgrounds, props, character detail, palette — not a minimal abstraction.
3. A named company/brand = mandatory quick research of its real colors/uniform/livery (MAS: navy #002B5C, red #ED1C23, turquoise sarong kebaya).
4. QA/verify pass MUST compare rendered frames against the SAMPLE IMAGE side by side — including character anatomy, garment layering (dress over legs), and pose readability — not only text fidelity.
5. For VIDEO: verify IN MOTION (consecutive-frame strips, not single stills — temporal artifacts like region-paste seams are invisible in one frame) AND verify the EXACT file being delivered (a re-encode for size is a different artifact; 2026-08-27: user watched the soft crf-23 mobile encode while QA ran on the master).
6. Judge the deliverable as a VIEWER before shipping: "would I present this to anybody?" — if no, loop; do not ship + caveat.

Related: [[feedback_show_diagram_for_issues]], the "read the circled photo, not my memory of it" lesson in main-memory.
