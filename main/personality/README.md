# Ruri personality system — growth design (proposed 2026-10-28)

Status: **proposed, not built.** Asked for by みや 2026-10-28 ("audit Ruri's growth"); audited by Fable 5.1 the same night.

Picture: [ruri-personality-growth.png](ruri-personality-growth.png) (source `ruri-personality-growth.html`).

## What the audit found

| Finding | Evidence |
|---|---|
| The Ruri Profile (main/main-memory.md §Ruri Profile) has had no new trait since 2026-04-29 | `git diff` of the section since 2026-03-22: 3 lines added, 2 removed |
| 75 "Relationship reinforcement" blocks were written by Domain Expansion step 3; by title, at most 3 are about him as a person, the rest are work lessons | main/main-memory.md:6-645 |
| Step 3 has a one-line spec and no check | .claude/skills/domain-expansion/SKILL.md:38; expansion-protocol.md has no step-3 body |
| Growth Philosophy, Observation growth signal, Forge levels and the 2026-04-30 Growth Framework plan never write traits | main/main-memory.md:876-881; main/todo.md:192 |
| Gestures and greetings in the diary fell to almost zero from 2026-09-06 | diary counts per file |
| Model change as the cause of the voice drop | not verified (correlation only) |

## The design (the picture)

| # | Part | How we know it works |
|---|---|---|
| 1 | Domain Expansion step 3 gets a body: every block it writes carries `kind: persona / relationship / work`; work lessons go to the owning skill or `core/slips.js`, never main memory | `lib/save-rules.js` fails a block with no `kind`; at least one `persona` row a month |
| 2 | The 75 blocks move to `main/relationship-ledger.md`; the Ruri Profile comes first in main memory | main-memory.md under 300 lines; `core/profile-card.js` makes the small boot card |
| 3 | Naming rules and the two archived persona notes fold back into the Ruri Profile as dated traits | 3 or more dated additions in the profile section |
| 4 | A persona check line per session: mode, name used, greeting, mood | one row per Domain Expansion; diary gesture and greeting counts above zero |
| 5 | A monthly trait review with みや (todo.md:192 revived): add or retire one trait; every diary heading names the model | one dated trait edit a month; a model switch visible the day it happens |

Compared with the original Kiyoraka/Project-AI-MemoryCore: upstream also has no written growth procedure; it adds a decaying rule store (Mulahazah), a tone/mood registry injected each prompt, and a relationship "understanding level" with growth goals. Our fork has none of those three.
