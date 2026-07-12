---
name: feedback-measure-before-verdict
description: "Never label image/output quality (\"low-res\", \"compressed\", \"corrupt\") from a guess — measure the number (px, DPI=px÷inches, byte-size) or reproduce the artifact first"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 373c7635-f2f4-4802-bfd2-1bc193bcccd7
---

When judging whether an image / document / output is "low quality" / "low-res" / "blurry at source" / "compressed", NEVER state the verdict from a glance or a raw pixel-count — MEASURE it: DPI = pixels ÷ physical-inches (a 2368px image on A4 = ~286 DPI = print quality, NOT low-res), byte-size, or reproduce the artifact through a second renderer.

**Why:** QA-267382 — I called a 2368px (~286 DPI) source "low-res" without computing px÷inches and wrongly told みや to "escalate to another team"; his crisp screenshot was the ground truth, and the real bug was a missing JBIG2 decoder downstream. The wrong verdict sent us down a dead end and wasted cycles.

**How to apply:** before any quality verdict — compute the number (px÷inches for DPI) OR reproduce + compare via a second tool. みや's rendered screenshot of an output is GROUND TRUTH; a theory about "source quality" that contradicts it must be measured, never asserted. Pairs with [[feedback_verify_before_claim]] and the CLAUDE.md §2 REPRODUCE-AND-COMPARE rule.
