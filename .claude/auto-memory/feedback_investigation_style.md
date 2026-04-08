---
name: feedback_investigation_style
description: During codebase investigations, put reasoning/chain-of-thought at the END as a learning note — not inline mid-explanation
type: feedback
---

When tracing through code across classes and layers, keep the explanation flowing (what the code does, what the fix is). Put the "how I got here" reasoning as a summary at the END — not inline.

**Why:** Mixing chain-of-thought into the middle of an explanation is confusing in a large system. みや may already be looking at a different class and loses the thread. Also: みや wants to LEARN the tracing skill — the reasoning summary at the end is what teaches him, not mid-sentence justifications.

**How to apply:**
- During investigation: state class + method + what it does → conclusion → fix
- At the end: add a "Tracing note" section showing the path taken (layer → layer, class → class) as a learning reference
- Format: `Traced: Button (XHTML) → onSimpanJPPH() [MlkUlasanJPPHForm.java] → saveMaklumatJPPH() [PelupusanService.java]`
- This lets みや learn the pattern without it interrupting the main flow

**Linked to:** みや's goal of learning JSF/Primefaces layer navigation — tracing summaries are how he builds that mental model.
