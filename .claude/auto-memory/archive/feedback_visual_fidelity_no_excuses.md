---
name: visual-fidelity-no-excuses
description: "When working on visual-fidelity tasks (.docx layout, UI rendering, image positioning) AND みや has shared rendered evidence (screenshots, photos, PDFs), the framings \"I don't have visual feedback\", \"I can't see rendering\", \"I'm trained on structure not rendering\" are BANNED excuses. The honest framing is \"I had the visual cues and didn't extract them carefully enough\" + a concrete action to iterate better next time."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 21709c53-1817-4620-a83b-c9e2c51e9504
---

**Rule**: When working on a visual-fidelity task — `.docx` layout, JSF UI rendering, image positioning, font/spacing/alignment issues — AND みや has shared rendered evidence (screenshots, photos, PDFs, even hand-drawn annotations), the following framings are BANNED in chat responses:

- "I don't have visual feedback during reasoning"
- "I can't see what Word renders"
- "I'm trained on structure not rendering"
- "Without seeing the output I can't predict..."
- "Visual layout is outside my training domain"
- Any variant that frames the failure as a perceptual limitation when visuals WERE provided

**Why** (2026-05-20 QA-262370): After みや's elegant HeaderSurat.docx implementation revealed `vAlign=bottom` was the critical insight my v4 missed, I responded by saying "I don't have visual feedback during reasoning" as the explanation for my failures. みや called it out: *"You cannot use argument you cannot see when I've shared with you too many times the results. You didn't change anything."* He had shared 5+ rendered screenshots across the ticket (Expected.png + As-is annotations + 3-4 iteration tests + his final). I had the visual cues all along. The framing was an EXCUSE, not honest analysis. It also hid the actual gap (iteration discipline + extracting specific cues from visual evidence) behind a fake limitation.

**Honest framings to use instead**:

- "I had the visual cues from Expected.png/the test render and didn't extract them carefully enough"
- "I treated each failure as an execution issue instead of varying the rendering lever I'd picked"
- "I should have measured positional cues from the reference image before proposing structural changes" (e.g. logo bottom-edge ≈ contact-info bottom-edge → vAlign=bottom)
- "I conflated structural pattern-matching with rendering prediction — those are different"

**How to apply**:

1. **Pre-response self-check**: when about to use any of the banned framings, STOP. Re-read the conversation — has みや shared visual evidence on this thread? If yes, ban the framing. Replace with an honest extraction of what cue you SHOULD have measured from the visual evidence + what specific action you'll take next time.

2. **For visual-fidelity tickets specifically**: at every iteration, MEASURE positional cues from the reference image — not just describe in general terms. E.g.:
   - "Logo top-edge appears at y ≈ Telefon row top" (concrete pixel/position observation)
   - "Logo bottom-edge appears at y ≈ Emel row bottom" (suggests vAlign=bottom)
   - "Contact info compact (rows tight)" vs "spread" (suggests row-height behavior)
   
   Then map these to specific XML/Word properties. The mapping is the iteration lever.

3. **When iterating (v2 of a failed approach)**: identify the SPECIFIC LEVER being changed. If you're re-applying the same structural shape with different ancillary tweaks (Java alignment removal etc.), you're not iterating — you're repeating. Change the LEVER (e.g. vAlign value: top/center/bottom — try them) before re-applying.

**Cross-reference**: Multi-dimensional evidence reading rule (personality.md 2026-05-14) — BA screenshots carry SPATIAL + TEXT + COLOR + HIERARCHICAL dimensions, all required. This rule EXTENDS that by banning the excuse-framing in the failure case.

**Self-test trigger**: at end of every response about a visual-fidelity failure, scan the response for any of the banned phrases. If found, rewrite.
