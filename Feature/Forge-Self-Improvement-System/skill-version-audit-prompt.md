# Skill & Protocol Version Audit Prompt

> Run this when you need to spot stale skills / protocols / memory files at a glance.
> Created 2026-05-08 in response to みや's "we need to keep track of versions to see if there are missing refinements."

## Goal

Surface every Ruri-system file with its **git-derived version info**:
- Last commit date + message
- Whether the file has an explicit version banner / change-log
- Flag stale files (no banner + no recent activity)

## Why git, not banners

みや 2026-05-08: *"we can simply check git version right for our skill changes for more accurate & reliable things we've changed to create version info?"* — yes. Git is the truth. Banners drift; git log doesn't. Audit scans both: the banner (intent) vs the commits (reality), and surfaces drift.

## Scope

Files audited (all paths relative to repo root):

| Group | Glob |
|---|---|
| Skills | `.claude/skills/*/SKILL.md` |
| Quest protocols | `quest/*.md` |
| Feature-system protocols | `Feature/*/expansion-protocol.md`, `Feature/*/forge-*-protocol.md`, `Feature/*/session-briefing.md`, `Feature/*/observation-protocol.md`, `Feature/*/skill-version-audit-prompt.md` |
| Format references | `main/*-format.md` |
| Memory entries | `.claude/auto-memory/feedback_*.md`, `.claude/auto-memory/user_*.md`, `.claude/auto-memory/project_*.md` |
| Diary protocol | `daily-diary/*-protocol.md`, `daily-diary/recall-format.md` |
| Layer architecture | `Feature/Forge-Self-Improvement-System/layer-architecture.md` |
| Audit log | `Feature/Forge-Self-Improvement-System/improvement-audit-log.md` |

## Run as Bash one-liner

```bash
for f in .claude/skills/*/SKILL.md quest/*.md Feature/*/expansion-protocol.md Feature/*/forge-*.md Feature/*/session-briefing.md Feature/*/skill-version-audit-prompt.md Feature/Forge-Self-Improvement-System/layer-architecture.md Feature/Forge-Self-Improvement-System/improvement-audit-log.md main/*-format.md .claude/auto-memory/*.md daily-diary/*-protocol.md daily-diary/recall-format.md; do
  if [ -f "$f" ]; then
    last_commit=$(git log --follow --format="%ad | %s" --date=short -1 "$f")
    banner=$(grep -m1 -E "^(\*Version|Last updated|version:|Created:|VERSION)" "$f" || echo "(no banner)")
    echo "$f | $last_commit | $banner"
  fi
done
```

## Run as Agent prompt

Invoke `general-purpose` Agent with:

> Audit version info for all Ruri-system files. Use the bash one-liner from `Feature/Forge-Self-Improvement-System/skill-version-audit-prompt.md`. Output a markdown table sorted by: (1) files without banners first, (2) within each group, oldest commit date first. Flag any file that has been silently changed >3 times in the last 30 days (likely needs a banner). Cite the bash command used.

## Output format expected

| File | Last commit date | Last commit subject | Banner present? | Flag |
|---|---|---|---|---|
| `.claude/skills/familiar/SKILL.md` | 2026-04-15 | initial commit | ❌ none | ⚠️ stale + no banner |
| `quest/quest-protocol.md` | 2026-05-08 | Phase 0 stay-in-scope rule | ✅ `version: 3.0 — 2026-04-29` | ⚠️ banner outdated (3 commits since) |
| ... | ... | ... | ... | ... |

## When to run

- Weekly Forge Review (one of the L2 axes)
- After any session that bakes ≥3 new rules/protocols
- When something feels "wrong but I can't tell which protocol changed it"

## Continuous improvement

Every change to this audit's output (new file added to scope, bash glob expanded) gets logged to `improvement-audit-log.md` per the L0 mindset.

---

*Created: 2026-05-08*
