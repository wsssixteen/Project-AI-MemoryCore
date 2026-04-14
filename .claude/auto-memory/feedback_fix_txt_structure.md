---
name: Fix.txt structure — keep it simple
description: Fix.txt in Task folders should contain only chain + root cause + applied fix + verification/glossary. Exclude speculative or tangential sections.
type: feedback
originSessionId: 903879e2-8b51-485b-9c2a-3ee89145a5d6
---
Fix.txt in the Task folder (`1. Tasks\Melaka\<QA folder>\2. Fix.txt`) must stay compact. It is a quick-reference for re-reading the fix, not a full investigation log.

**INCLUDE:**
- CHAIN — class → class → class flow showing how execution reaches the bug
- ROOT CAUSE (short) — 2–4 sentences, plain language
- APPLIED FIX — per-file diff + 1-line why per change
- VERIFICATION — breakpoints to hit + what to check while testing
- GLOSSARY (optional) — only for new/unfamiliar terms introduced by this ticket

**EXCLUDE from Fix.txt** (these live elsewhere):
- "What is not known yet" / "unfamiliar concepts" → post-mortem teaching section, or handoff file
- "Known related bugs / followup" → forge-log or post-mortem observations
- "Investigated but not needed" / ruled-out hypotheses → handoff file only (quest/handoff-<QA>.md), never Fix.txt

**Why:** Fix.txt's job is "remind me what was done and why" on re-read months later — not "walk through every path considered". The extra sections bloat the file and make the actual fix harder to find. Full investigation trail belongs in the handoff file during the quest and the post-mortem after close.

**How to apply:** When producing Fix.txt, stop after the Verification section (plus Glossary if introducing new terms). Do not pad with related-bug speculation, learning notes, or ruled-out theories — those have dedicated homes. Decided 2026-04-14.
