# Enforcement Sub-INDEX — Hooks for Trigger Reliability

> **Purpose:** The Enforcement sub-layer addresses **60% of slips** (Trigger Reliability failures — rules exist as prose, don't fire when needed). Hooks bypass the model and fire deterministically.
>
> **Architecture:** Per Stage 3a decision (6 hooks for full Trigger Reliability layer coverage) + refinement #2 (hook-ordering testing pass after each hook is built; conflict matrix vs existing hooks).
>
> **Status:** Phase 1 skeleton ✅ (this file). Phase 2 builds the actual hook scripts + registers them in `settings.local.json`.

---

## 6 Enforcement hooks (to be built in Phase 2)

| # | Hook | Event | Target path | Purpose | Build status |
|---|---|---|---|---|---|
| 1 | `boot-required-read-gate.js` | SessionStart | `.claude/hooks/` | Gate every "see X.md" pointer in CLAUDE.md — verify each is Read at boot. Extends existing `boot-load-verification.js` discipline | ⬜ Phase 2 |
| 2 | `pre-action-check-gate.js` | PreToolUse (Edit/Write/Bash) | `.claude/hooks/` | Notes.txt write + env-check + PDF annotation extraction + server log read — gate each before relevant actions | ⬜ Phase 2 |
| 3 | `inventory-first-gate.js` | UserPromptSubmit | `.claude/hooks/` | Detect new-structure-proposal signals ("let's add a folder", "new file for X", "create a new module") → inject inventory-check guidance before Ruri acts | ⬜ Phase 2 |
| 4 | `prose-default-gate.js` | UserPromptSubmit | `.claude/hooks/` | Detect lock-signal phrases ("hardcode it", "make it a hard rule", "always X", "never miss this") → inject "invoke meta-design-router" instruction | ⬜ Phase 2 |
| 5 | `silent-claim-drift-gate.js` | Stop | `.claude/hooks/` | Block "done" / "complete" / "shipped" claims unless preceded by claim-verification (diff-backing) + scope-anchor-echo + test-data-echo (if Quest context) | ⬜ Phase 2 |
| 6 | `best-practices-consult-gate.js` | UserPromptSubmit OR PreToolUse | `.claude/hooks/` | Detect design-decision signals ("how should we", "design X", "what's the right shape") → inject reference to library-items/agent-architecture/claude-code-best-practices.md | ⬜ Phase 2 |

## Existing hooks (12 — for ordering reference)

Hook conflict matrix to be built during Phase 2. Existing hooks:

| Existing hook | Event | Reference notes |
|---|---|---|
| `auto-skill-trigger.js` | UserPromptSubmit | Fires on correction signals (extended with proactive triggers per Stage 3a Refine Block) |
| `boot-load-verification.js` | SessionStart | Emits boot-load reminder; will be extended (Phase 7) with model-change + 30-day evolution check |
| `commit-gate.js` | PreToolUse (git commit) | Verifies commit message conventions |
| `file-list-after-refine.js` | (TBD) | A7 file-list table enforcement |
| `notes-on-test-data.js` | (TBD) | Existing Notes.txt enforcement (will be subsumed by pre-action-check-gate) |
| `operational-follow-through.js` | (TBD) | A9 visible next-operational-step enforcement |
| `phase0-artifact-gate.js` | (TBD) | Quest Phase 0 artifact validation |
| `prayer-gate.js` | (TBD) | Prayer time awareness |
| `reply-log.js` | (TBD) | Reply timing tracking |
| `self-gate-impulse.js` | (TBD) | A8 self-gate at impulse enforcement |
| `ticket-gate.js` | (TBD) | Quest ticket workflow gating |
| `worktree-cleanup-boot.js` | SessionStart | Worktree hygiene |

## Hook firing order — to be determined during Phase 2

Order matters when multiple hooks attach to the same event. The Phase 2 ordering testing pass (refinement #2) produces a conflict matrix documented here.

Anticipated event-by-event ordering (subject to Phase 2 validation):

```
SessionStart      ──→ boot-load-verification.js (existing)
                  ──→ boot-required-read-gate.js (NEW Phase 2)
                  ──→ worktree-cleanup-boot.js (existing)

UserPromptSubmit  ──→ auto-skill-trigger.js (existing — correction signals)
                  ──→ prose-default-gate.js (NEW — proactive design signals)
                  ──→ inventory-first-gate.js (NEW — new-structure signals)
                  ──→ best-practices-consult-gate.js (NEW — design signals; partially overlaps with prose-default)

PreToolUse        ──→ commit-gate.js (existing — git commit only)
                  ──→ ticket-gate.js (existing)
                  ──→ pre-action-check-gate.js (NEW — Edit/Write/Bash actions)
                  ──→ self-gate-impulse.js (existing)
                  ──→ meta-edit-gate.js (NEW Phase 6 — meta/* paths)

Stop              ──→ silent-claim-drift-gate.js (NEW Phase 2)
```

## Hook design discipline (best-practices reference)

Per `library-items/agent-architecture/claude-code-best-practices.md` Section B:

- **PreToolUse blocking**: prefer JSON `hookSpecificOutput.permissionDecision: "deny"` over exit-code-2 (GH issue #24327 — exit-2 can stop instead of feeding feedback)
- **PostToolUse blocking**: top-level `{"decision":"block","reason":"..."}`
- **Stop blocking**: same as PostToolUse top-level shape
- **Logging**: each hook writes to `meta/hook-fire-log.md` (Phase 6) for self-enforcement eval

## Trigger-phrase enumeration per UserPromptSubmit hook (refinement #4)

| Hook | Trigger phrases (initial) |
|---|---|
| `prose-default-gate` | "hardcode it" · "make it a hard rule" · "lock this in" · "never miss this" · "always do X" · "must always" · "make it so it won't be repeated" |
| `inventory-first-gate` | "let's add a folder" · "new file for X" · "create a new module" · "we should make a [skill/hook/etc.]" · "I want a [folder/file] for" |
| `best-practices-consult-gate` | "how should we [design/structure]" · "what's the right [shape/approach]" · "Anthropic-recommended" · "best practice for" · "design X" |

## Cross-references

- `meta/INDEX.md` — master meta-layer index
- `library-items/agent-architecture/claude-code-best-practices.md` — Sections A (Skills) + B (Hooks) for spec details
- Phase 2 of plan `1-this-means-you-toasty-forest.md` — build instructions + ordering testing pass
- `.claude/settings.local.json` — hooks registered here

---

*Sub-index for Enforcement. Populated by Phase 2.*
