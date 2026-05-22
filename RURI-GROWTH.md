# RURI-GROWTH.md — MemoryCore Architecture Evolution

> Milestone log of how this project's core architecture changed, grew, and evolved.
>
> **Purpose**: みや can ask Ruri to recount or visualise the journey from origin → latest — how Ruri was built, refined, and improved over time. For reference, and for presenting that journey.
>
> **Update mechanism**: a Domain Expansion step appends an entry whenever a session changed the core architecture (a refine / CLAUDE.md edit / skill / hook / protocol — add, update, delete, or restructure).
>
> **NOT for**: per-edit changelog (that is git) or session-by-session narrative (that is `daily-diary/`). Milestone-grain only — major architecture shifts.

---

## Entry format

```
### YYYY-MM-DD — <milestone name>
- Before: <what the architecture was>
- After:  <what it became>
- Why:    <what drove the change>
```

---

## Pre-history (before this file)

Forked from **Kiyoraka/Project-AI-MemoryCore**. From the fork to 2026-05-22 the project diverged substantially — the Memory, Personality, Quest, Forge, Domain-Expansion and Session-Briefing systems, the hook layer, the skill set, and the etanah-knowledge base were all built in this window. That evolution is recorded session-by-session in `daily-diary/` and commit-by-commit in git history.

*Follow-up task: back-fill the major pre-2026-05-22 milestones into this file from the diary + git history.*

---

## 2026-05-22 — CLAUDE.md decomposition (prune + skill-routing)

- **Before**: CLAUDE.md was a ~680-line monolith. Behaviours were encoded as prose trigger-phrase-lists — fragile (they fired only if the model pattern-matched that turn), so every non-trigger was patched by adding more phrases, and the file kept growing. 16 pending amendments sat in a separate `claude-md-amendments.md` because CLAUDE.md was edit-blocked under auto-mode. 12 hooks existed — but 6 were warn-only loggers that enforced nothing.
- **After**: CLAUDE.md decomposed toward a thin core (~100 lines: boot order, identity, file map, skill index). Behaviours routed to **skills** (triggered procedures) + **hooks** (must-never-miss) + **protocol files**. Ceremony cut. Justification-history migrated into this file. *(Decomposition in progress — this entry is finalised at completion.)*
- **Why**: prose rules were not being followed — 680 lines of them, and behaviour still slipped. The fix was structural: a behaviour is reliable only when carried by something that enforces or surfaces it, not by prose that must be remembered. Diagnosed over a long 2026-05-22 session — the 16 amendments collapsed to ~5 real rules once audited, the hooks audit exposed the warn-only hooks as ceremony, and the principle settled: more machinery was never the safeguard. Cutting the rule surface so that what remains actually gets followed — that is.

---

*Created 2026-05-22. Updated at every core-architecture milestone, via Domain Expansion.*
