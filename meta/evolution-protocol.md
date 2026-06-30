# Evolution Protocol — How the Meta-Layer Self-Updates

> **Purpose:** When Anthropic ships new features (new hook events, new skill primitives, new tools, new models) OR LLM research community advances OR new agent-design patterns surface — the meta-layer detects + ingests + proposes updates to keep our setup aligned. Rare-but-high-stakes per Stage 6 reasoning.
>
> **Status:** Phase 1 placeholder ✅ (this file describes the design). Phase 7 implements the SessionStart hook extension + manual-invoke skill.

---

## Detection mechanism (Stage 6 design — D-revised)

**No cron** (per みや's reliability concern). Uses only mechanisms Ruri is reliable with:

| Trigger | Mechanism | Reliability |
|---|---|---|
| **Model ID change** | SessionStart hook (Phase 7 extension to `boot-load-verification.js`) compares current model to last-session model; if changed → surface flag | Hooks fire 100% on session start; very reliable |
| **>30 days elapsed since last evolution-check** | Same SessionStart hook reads `last-evolution-check` timestamp from this file (or `state/evolution-state.json`); if >30 days → surface flag | Same hook; same reliability |
| **Manual invoke** | みや says "check Anthropic updates" / "evolution check" / "what's new from Anthropic" → loads `evolution-check` skill (to be built Phase 7) | Most reliable per-fire; depends on memory |

Either auto-trigger surfaces a flag in the boot briefing. みや decides when to actually invoke the full evolution-check skill.

## Scope (all external evolution sources)

| Source | Detection signal |
|---|---|
| Anthropic product updates (new hook events, new skill features, new tools) | Manual invoke + 30-day elapsed |
| Anthropic best-practices guidance updates | Manual invoke + 30-day elapsed |
| Claude model version changes | SessionStart model-ID detection (automatic) |
| LLM research community advances (new prompt patterns, agent paradigms) | Manual invoke + 30-day elapsed |
| Agent-design research (e.g. new architectural patterns) | Manual invoke + 30-day elapsed |

**Internal learnings** (slips → refinements) continue via Stages 3a-3c + Forge ritual; NOT covered by this protocol.

## Process — what evolution-check does when invoked

Recursive through meta-design-router:

1. **Re-run deep-research** on Anthropic best-practices (similar to 2026-05-23 research pass via general-purpose subagent)
2. **Diff against saved reference**: compare new findings to `library-items/agent-architecture/claude-code-best-practices.md`
3. **For each new finding**: route through `meta-design-router` (the meta-layer's own decision loop applies to its own evolution — recursive correctness)
4. **Each proposed refactor**: goes through Stage 5's `meta-edit-gate.js` PreToolUse hook (Phase 6)
5. **みや approves**: updates ship via standard Edit/Write
6. **Update the saved best-practices file**: replace `Last researched:` timestamp + add new findings sections
7. **Update `last-evolution-check` timestamp** below

## State

```yaml
last-evolution-check: 2026-06-30  # reset by みや 2026-06-30 — no new Anthropic model news, only a Claude Code release rumored; skipped full deep-research run
next-elapsed-check-due: 2026-07-30  # +30 days
last-model-id-seen: claude-opus-4-7[1m]  # current session model
research-file-last-updated: 2026-05-23  # research file itself NOT re-run; only the cadence stamp reset
research-file-path: library-items/agent-architecture/claude-code-best-practices.md

# Added 2026-05-24 — system-check cadence (paired skill: .claude/skills/system-check/SKILL.md)
last-system-check: 2026-05-24  # first run = this session's 5-parallel-audit
next-system-check-due: 2026-06-23  # +30 days
system-check-cadence-days: 30  # calibrate over first 3 runs
last-system-check-findings-count: 35  # surfaced critical+high+medium gaps
```

(Phase 7 implementation may move this state to `state/evolution-state.json` if hook-readable YAML state is cleaner; decide at implementation.)

## Skill (to be built in Phase 7)

`.claude/skills/evolution-check/SKILL.md` — triggers:
- Manual: "check Anthropic updates" · "evolution check" · "what's new from Anthropic" · "model changed" · "research refresh"
- Auto-flag from boot briefing (Ruri sees flag and offers to run)

## Cross-references

- `meta/INDEX.md` — master meta-layer index
- `library-items/agent-architecture/claude-code-best-practices.md` — the reference file this protocol maintains
- `.claude/hooks/boot-load-verification.js` (Phase 7 extension target) — the trigger mechanism
- Phase 7 of plan `1-this-means-you-toasty-forest.md` — build instructions

---

*Evolution-protocol design. Phase 7 implements the actual SessionStart extension + evolution-check skill. Update `last-evolution-check` timestamp on every actual run.*
