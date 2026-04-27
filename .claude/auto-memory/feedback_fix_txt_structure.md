---
name: Fix.txt structure — 4-section compact format
description: Fix.txt uses 4 blank-line-separated sections (FIX / EXPLANATION / CHAIN / RELATED). Very short, no named headers. Confirmed format 2026-04-27.
type: feedback
originSessionId: 903879e2-8b51-485b-9c2a-3ee89145a5d6
---
Fix.txt in the Task folder (`1. Tasks\Melaka\<QA folder>\Fix.txt`) must be very short and quick to scan. 4 sections, separated by blank lines, no section headers.

**Format:**
```
TICKET: QA #XXXXXX

[Class].[method]:
[code before → after, or just the after if it was a removal]

[What was wrong and what was done. 1–3 lines max.]

[ClassA → ClassB → ClassC → output]

[Other classes / configs / tugasan / scopes touched by this change]
```

**Sections (in order):**
1. **FIX** — `Class.method:` on first line, then the code change (before → after, or just the new line if removal). Very concise — the actual diff, not prose.
2. **EXPLANATION** — 1–3 lines: what was wrong, what was done. Plain language.
3. **CHAIN** — execution flow from entry point to the affected output. `ClassA → ClassB → ClassC → output`.
4. **RELATED** — other classes / configs / tugasan / scopes touched or in blast radius.

**Rules:**
- No section headers — the blank lines do the separating
- No VERIFICATION section — that lives in the Fix Walkthrough (Phase 1), not the file
- No GLOSSARY section — that belongs in `etanah-knowledge/DOMAIN-GLOSSARY.md`
- No investigation notes, ruled-out paths, or hypotheses — those go in the handoff file
- Never mention みや, リドワンさん, or any nickname — Task folder files are potential colleague handover artifacts

**Why:** The old format had 5+ named sections and was hard to scan quickly. The new layout forces extreme brevity — if it's longer than ~15 lines total, it's too long. Confirmed by みや 2026-04-27.

**How to apply:** When producing Fix.txt at Phase 3, copy this 4-section skeleton. Fill each section, keep every section to 1–4 lines. Full investigation trail belongs in `quest/handoff-<QA>.md` (during quest) and `main/post-mortems.md` (after close).
