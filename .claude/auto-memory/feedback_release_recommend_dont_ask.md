---
name: release-recommend-dont-ask
description: Baseline/release decisions — check the code delta myself and brief the recommended option with confidence; never hand miya a fact-check question
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2167c6a4-3884-40b0-97d2-11316afbe263
  modified: 2026-09-07T13:35:31.131Z
---

At a release stop-point (V1/V2), when a decision hinges on WHAT a commit or branch changes, read the diff myself and state the recommended option with a confidence figure. Do not ask miya to fact-check (e.g. "confirm Anis verified", "ask Aaron whether the commit belongs").

**Why:** 2026-09-07 Baseline 1.5.0 — I surfaced Aaron's orphan commit 7cb2d36297 as an include/exclude question plus "confirm with Aaron/Anis". The delta (one new template + config entries, clean ancestry) already said include. miya: *"just check straight away the (code) changes and brief me the recommended with higher confidence instead of asking me to fact check you when it is your job."*

**How to apply:** for every candidate source: diff it, classify (additive / conflicting / unrelated), then emit `Recommend: include — 90%` with the one-line reason. Keep the stop-point as a nod, not a question. Related: [[release-mlk-plp]] skill, [[verify-before-claim]].
