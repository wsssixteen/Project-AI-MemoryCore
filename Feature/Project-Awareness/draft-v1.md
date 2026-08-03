# Project-Awareness Feature — Draft v1

> Status: DRAFT (2026-06-01 S4) — design notes only, no implementation yet.
> Pairs with: `quest-active-grounding.js` (sibling pattern — same hooks-as-harness shape, different state file).
> Trigger origin: みや 2026-06-01 S4 item 2 — "Speaking of quest awareness, I just found a use case for Project awareness. It makes it easy when you're switching between projects."

## Why this exists

Quest-active-grounding solves "always know which ticket I'm in." Project-awareness solves "always know which project I'm in" — a layer ABOVE quest. Important when:
- Switching between Etanah work (multiple urusan / modules) and MemoryCore system work
- Switching between Etanah modules (pelupusan / awam / teknikal / common) where blast-radius differs
- Working on side projects (etanah-organize, etanah-knowledge-graph-build, etc.) where conventions differ

## Mental model

| Layer | Hook | Watches | Emits |
|---|---|---|---|
| Session | `open-quest-surfacer.js` | SessionStart — quest/active.txt | "📌 OPEN QUESTS" list at boot |
| Project (NEW — this draft) | `project-active-grounding.js` | UserPromptSubmit — projects/active-projects.txt | "🏗 Active project: X · Type: Y · ..." |
| Quest | `quest-active-grounding.js` | UserPromptSubmit — quest/active.txt | "🎯 Active quest: QA-X · Scope: Y · Phase: Z" |

Hierarchy: Project frames > Quest grounds > Individual prompt. Project line shows ONLY when project is genuinely "active" (mid-discussion, mid-build, mid-investigation). Silent otherwise.

## Proposed state file — `projects/active-projects.txt`

Mirrors `quest/active.txt` shape:

```
active:

project=etanah-pelupusan
type=etanah-codebase
status=active
current_focus=PLPS RisalatMMKN template
notes=quest QA-247707 in flight; etanah-knowledge cross-references being updated

project=memorycore-system
type=system-layer
status=hold
current_focus=Quest Briefing primitive + video-trim skill
notes=Session 4 design sprint; resumes next session for Track 2/3
```

Fields: `project=` (slug), `type=` (etanah-codebase / system-layer / side-project / portfolio), `status=` (active / hold / blocked / closed), `current_focus=` (one-line), `notes=` (multi-line).

## Hook behaviour

| Event | Action |
|---|---|
| UserPromptSubmit | Read `projects/active-projects.txt` → find blocks with `status=active` → emit `🏗 Active project: <project> · Type: <type> · Focus: <current_focus>` per block |
| If no active project | Silent (zero output) |
| If ≥1 active project AND quest hook also fires | Project emit appears ABOVE quest emit — top-down hierarchy |

## Switching detection (v1.1 — deferred)

Future: detect when user mentions a DIFFERENT project than the currently-active one — surface as warning ("you mentioned X but active project is Y — switch?"). Requires NLP shape detection. Defer to v1.1.

## Pairs with project-switching workflow (parked future system)

Project-awareness is the *observation* layer. Project switching/setup is the *action* layer:
- "switch to project X" → update active-projects.txt, source the project's env-defaults, possibly change git working dir
- "set up new project X" → scaffold the project state file + create a `projects/coding-projects/active/X/` folder + initial PROJECT.md

Both deferred until project-awareness hook ships and is exercised.

## Open design questions (defer until first build)

| # | Question | Default if not answered |
|---|---|---|
| Q1 | Where does `projects/active-projects.txt` live exactly? Root `projects/` or new `projects/state/`? | Root `projects/` (matches quest/ sibling) |
| Q2 | What triggers `status=active` → `status=hold`? Manual command, or auto on Nday inactivity? | Manual via `/project hold X` for v1; auto-decay for v1.1 |
| Q3 | Should the hook also emit when on Etanah pelupusan work but the file says active project is system-layer? (mismatch warning) | Yes — emit advisory mismatch line per session-items-manager pattern |
| Q4 | Naming — `project-active-grounding.js` (parallels `quest-active-grounding`) or `active-project-surfacer.js` (parallels `open-quest-surfacer`)? | Use the ACTIVE-grounding suffix to signal UserPromptSubmit (vs SessionStart surfacer) |

## Next steps to ship

1. みや confirms shape (this draft) — pick names + answer Q1-Q4 if defaults wrong
2. Create `projects/active-projects.txt` with the 2 known active projects (Etanah work + MemoryCore meta)
3. Build `.claude/hooks/project-active-grounding.js` (mirror `quest-active-grounding.js` shape)
4. Register in `.claude/settings.json` (UserPromptSubmit hooks array) — みや approves permission
5. Add to `system/system-architecture.md` §3.2

## History

Created 2026-06-01 S4 by みや design ask (item 2 of multi-item prompt during Quest Briefing + video-trim build session). Draft saved silently per みや's instruction "just create a draft at least and save the plan somewhere. Silently, just tell me where you keep it and tie it to the todo."
