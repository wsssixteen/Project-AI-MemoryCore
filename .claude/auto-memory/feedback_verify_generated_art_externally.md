---
name: feedback_verify_generated_art_externally
description: "Generated art/graphics are verified by an EXTERNAL agent check, never self-approval"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 25e61ead-8752-4349-ae9c-b1c67046b0d0
  modified: 2026-08-31T05:56:51.995Z
---

🚨 When I GENERATE a visual (a drawn character, prop, icon, plane, chart), "verified" means an **external adversarial agent** confirmed it reads as the real thing — NOT me eyeballing my own output and declaring it good.

**Why:** on the MAS ergonomics animation ([[reference_mas_ergonomics_animation]]), I redrew the plane, looked at my own render, and told miya it was verified. He rejected it twice — a windowless tube, then a fighter-jet-looking redesign. A 2-agent fact-check ("does this read as a real passenger aeroplane? has wings? looks professional?") caught the fighter-jet on the FIRST pass and passed the corrected airliner — the check I should have run before every "done".

**How to apply:** after generating any art, run a small Workflow (2–5 sonnet agents) with a strict schema — `reads_as_<thing}` / `looks_professional` / `verdict` — pointed at the rendered frame. Deliver only on `all_good`. My own visual read is a DRAFT gate, never the ship gate. Same family as [[feedback_verify_before_claim]] but for images instead of code/claims.
