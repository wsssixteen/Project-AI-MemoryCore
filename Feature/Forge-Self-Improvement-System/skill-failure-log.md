# Skill Failure Log

> Appended only; never edited retroactively. Each row = one observed failure of a rule that should have fired.
> Reviewed at Forge Review. If a single rule fails ≥3 times in 14 days, the rule's design needs rework — not another tighter trigger phrase.

| Date | Missed behaviour | Existed as | Action taken | Path / commit |
|---|---|---|---|---|
| 2026-05-20 | Notes.txt not updated at Quest creation OR at test-data requests | prose (CLAUDE.md Read-Redmine sub-protocol) | refined-rule proposal pending みや nod | quest/quest-protocol.md (proposed) |
| 2026-05-20 | Status revamp implemented without System-Design pass / Design Memo / みや nod | prose (System-Design Discipline) | A8 self-gate-at-impulse rule added | .claude/claude-md-amendments.md A8 |
| 2026-05-20 | Server log path not loaded at Quest start — asked みや mid-investigation | prose (Operational follow-through, personality.md 2026-05-17) | Known-local-paths block added to env-check skill | .claude/skills/env-check/SKILL.md |
| 2026-05-20 | Delivered server-log path without grepping it (operational follow-through skip) | prose (personality.md) | A9 visible "Next operational step" rule added | .claude/claude-md-amendments.md A9 |
| 2026-05-20 | Phase 2 step 5 silent-skip (folder archive + active.txt flip dropped on QA-262039, QA-260302) | prose (quest-protocol.md Phase 2 Step 5) | Phase 2 visible step-checklist + /verify Checklist E added | quest/quest-protocol.md + .claude/skills/verify/SKILL.md |
| 2026-05-20 | Diagnosis used wrong baseline (compared against my own modified state, not git HEAD) | not previously a rule | NEW skill `auto-skill-on-mistake` created — this entry is its first log | .claude/skills/auto-skill-on-mistake/SKILL.md |
| 2026-05-20 | Commit subject missed the `<URUSAN>` hyphen — proposed `QA #262233 - PRZ Ringkasan Risalat MMKN - ...` instead of `QA #262233 - PRZ - Ringkasan Risalat MMKN - ...` | prose (CLAUDE.md Phase 1 Closure git sequence) — rule doesn't lock the hyphen placement | A10 amendment locked the urusan-hyphen | .claude/claude-md-amendments.md A10 |
| 2026-05-20 | Phase 2 emit was silent — emitted only step-checklist + /verify Checklist E, never the actual Faster-finding line / KPI table / post-mortem META summary / Refine decisions in chat. Phase 2 "lost its purpose" per みや | prose (quest-protocol.md Phase 2 emit format rules — exists, didn't fire) | Refine quest-protocol.md Phase 2 section to emphasize MANDATORY in-chat emission of step content; apply retroactively for QA-262233 below | quest/quest-protocol.md (proposed) |
| 2026-05-20 | Time-awareness slip again — reported "Phase 1 closed at X, Phase 2 closed at Y" delta, but the meaningful metric is quest-initiation → Phase 1 closure | not previously a rule | New rule: at every Phase 1 close, emit quest-initiation-to-closure delta. Quest-initiation = first qa= block timestamp in active.txt | quest/quest-protocol.md (new sub-rule) |
| 2026-05-20 | CLAUDE.md refactor (Q1 todo since 2026-05-19) untracked + no notify mechanism | prose (todo.md Q1 entry) | New tracker file `claude-md-refactor-tracker.md` + notify rule at every CLAUDE.md-touch | new file proposed |
| 2026-05-20 | A10 sub-rule extension — `tugasan` also should be hyphen-segment when used as categorization | prose (A10 just added today, covered urusan only) | Refine A10 | .claude/claude-md-amendments.md |

## Running counts (last 14 days)

| Rule / skill | Failures | Status |
|---|---|---|
| Operational follow-through (personality.md 2026-05-17) | 2 | ⚠️ at threshold — A9 visible-gate added; if 1 more failure, redesign needed |
| System-Design Discipline / v1-confirms | 1 | Watching |
| Phase 2 step 5 silent-skip | 1 | Watching |
| Notes.txt update at trigger | 1 | Watching |
| Wrong-baseline diagnosis | 1 | New — first occurrence today |

---

*Created 2026-05-20.*
