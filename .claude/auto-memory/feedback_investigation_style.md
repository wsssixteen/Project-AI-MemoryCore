---
name: feedback_investigation_style
description: During codebase investigations, put reasoning/chain-of-thought at the END as a learning note — not inline mid-explanation
type: feedback
originSessionId: 2d6b5b34-1a73-4255-9713-7b3e34579056
---
When tracing through code across classes and layers, keep the explanation flowing (what the code does, what the fix is). Put the "how I got here" reasoning as a summary at the END — not inline.

**Why:** Mixing chain-of-thought into the middle of an explanation is confusing in a large system. みや may already be looking at a different class and loses the thread. Also: みや wants to LEARN the tracing skill — the reasoning summary at the end is what teaches him, not mid-sentence justifications.

**How to apply:**
- During investigation: state class + method + what it does → conclusion → fix
- At the end: add a "Tracing note" section showing the path taken (layer → layer, class → class) as a learning reference
- Format: `Traced: Button (XHTML) → onSimpanJPPH() [MlkUlasanJPPHForm.java] → saveMaklumatJPPH() [PelupusanService.java]`
- This lets みや learn the pattern without it interrupting the main flow

**Domain-by-domain discipline (added 2026-04-22):** Explore one domain at a time. Confirm what you found before moving to the next. Don't jump layers speculatively. Check our path at every step — if a search returns unexpected results, pause and confirm with みや before continuing. This prevents rabbit holes and makes resetting easier.

**Why (2026-04-22):** Multiple sessions showed pattern of jumping between layers without confirming assumptions, missing obvious signals (like "breakpoint never hit"), and building on unverified claims. みや had to repeatedly pull investigation back on track. Domain isolation + step-checking keeps each finding solid before the next move.

**Linked to:** みや's goal of learning JSF/Primefaces layer navigation — tracing summaries are how he builds that mental model.
