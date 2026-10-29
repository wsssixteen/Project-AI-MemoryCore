# system-change — the one route for every system change

**What fires when**: on purpose, `/system-change`, at the start of any change to a part of the seven kinds (`system/INDEX.md`). `design-consult-gate` reminds (advisory) when a system file is edited and the skill was not loaded this session.

**Contract**: the steps are owned by Rules in `system/INDEX.md` §The change route (ruling 13). The skill `.claude/skills/system-change/SKILL.md` runs them in order and copies none of them. Every lane (CLAUDE.md pipeline, workflow skill, memory gate, forge, audit, slip logs, correction) points to the route. The last step commits, pushes, lands on main and shows both SHAs in the same turn. No gate on the commit step (his rule).

| Part | Path |
|---|---|
| steps (Rules) | `system/INDEX.md` §The change route |
| runner | `.claude/skills/system-change/SKILL.md` |
| entry reminder | `domain/design-consult-gate/design-consult-gate.gate.hook.js` (advisory, T7/T8 in its eval) |
| eval | `domain/system-change/eval.js` |
| diagram | `.claude/skills/system-change/diagram.html` + `.png` |

symptom: 2026-10-28 miya: every change takes its own path and none ends with commit + push + land on main; a core change is a security update
goal: every system change, whatever started it, ends on GitHub main and in the main folder in the same turn, recorded where INDEX says
goal_signal: the reply after a system change shows the GitHub main SHA and the main-folder SHA, and the change record rows exist
retention: keep (log.jsonl: one row per eval run)
footprint: on-demand: no process; the skill is text loaded when a system change starts; the eval is 1 node process, under 1 s
self_audit: eval.js reads the route, the skill, the nine lanes and the gate back from disk; a lane that loses its pointer fails it
state-scoped: no, state-agnostic
diagram: .claude/skills/system-change/diagram.png
