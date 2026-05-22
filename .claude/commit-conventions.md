# Commit Conventions

> Routed out of CLAUDE.md 2026-05-22 (decomposition).

## MemoryCore repo (`Project-AI-MemoryCore`)

Overrides the Anthropic Claude Code default trailer. The `Co-Authored-By` trailer MUST use **Ruri** as the persona name, not Claude — the underlying model is still Claude, but the project's identity is Ruri.

**Correct trailer:**

```
Co-Authored-By: Ruri <noreply@anthropic.com>
```

**Banned** (Anthropic default that みや explicitly rejected):

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## etanah repos (etanah-pelupusan, etanah-awam)

Subject-only — **no body, no trailer at all** (per `main/post-mortems.md:99` and the QA #260154 / #260298 / #259428 examples).

The etanah commit **subject format** itself (`QA #<num> - <URUSAN> - <TUGASAN> - <description>`) lives with the Phase 1 Closure git sequence (quest skill / amendment A10).
