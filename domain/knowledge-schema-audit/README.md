goal_status: draft (derived from nuke-marker+header on 2026-09-06; promote with node lib/goal-backfill.js promote knowledge-schema-audit)
symptom: miya /goal: keep etanah-knowledge folder structure + MD naming identical across states so the Quest workflow works between states; build the memory + audit it. Same session: perak `PERAK-FACTS.md` / wp `TEST-DATA-AND-ACCESS.md` legacy names, kedah with no `index.md`, a `CON\` flowables folder that broke OneDrive sync
goal: audit every state folder against KNOWLEDGE-SCHEMA.json; surface drift (silent when canonical). Never blocks.
goal_signal: a fire on: every session boot — etanah-knowledge/<state>/ folders drift from the canonical layout (missing required
retention: rotate monthly
# knowledge-schema-audit

**Born** 2026-09-04 via `core/forge.js` (check) + hand-built CLI + write-time hook. **Events** SessionStart (boot audit) · PreToolUse `Edit|Write` (write-time advisory). **Lifecycle** created.

**state-scoped: YES** — iterates every state in `projects/coding-projects/active/etanah-knowledge/KNOWLEDGE-SCHEMA.json` (system-design Rule 11).

## What it is — the "memory" that keeps every state's knowledge folder identical

みや's /goal (2026-09-04): *"ensure the folder structure, the naming of MD files between different states of etanah knowledge is kept the same so that our Quest workflow will work between states. Make sure this is something you are always aware of."*

The quest workflow resolves knowledge by **exact file name** (`ticket-gate.js` → `TEST-PERMOHONAN-INDEX.md`, `urusan/`; `adhoc-lifecycle` → `ADHOC-REGISTER.md`; `bpmn-check` → `FLOWABLE-KNOWLEDGE.md`, `flowables-bpmn/`; `learn-from-fix` → `BUG-BESTIARY.md`; `pre-code-check` → `PERANAN-MAP.md`; …). A state that names a file differently (`PERAK-FACTS.md`, `TEST-DATA-AND-ACCESS.md`) is invisible to all of them. Prose rules cannot hold this — the memory has to be a schema + a deterministic audit.

| Piece | Role |
|---|---|
| `etanah-knowledge/KNOWLEDGE-SCHEMA.json` | THE single source of truth: required files (with the tool that reads each), required dirs, optional files, legacy→canonical renames, flowables layout (PLP at root, `<MODULE>/` subfolders, reserved Windows names), the UNVERIFIED banner text |
| `knowledge-schema-audit.js` | CLI — `audit [--state s] [--json]` (exit 1 on drift) · `scaffold --state s [--dry]` (creates missing skeletons: melaka headings under the `⚠️ UNVERIFIED-FOR-<STATE>` banner; never overwrites) |
| `knowledge-schema-audit.check.hook.js` | SessionStart — one advisory line per drifting state; silent when canonical |
| `knowledge-schema-audit.write.hook.js` | PreToolUse Edit\|Write — fires the moment a non-canonical / legacy name or a bad flowables placement is about to be written; advisory, never blocks |
| `knowledge-schema-audit.eval.js` | 26 fixtures on a temp fixture tree (`KNOWLEDGE_ROOT` env) — never touches the real tree |
| `log.jsonl` | every audit/scaffold: `ts · cmd · states · drift` / `created[]` (system-rules Rule 5) |

## What "canonical" means (v1 of the schema)

- **Required in every state**: `index.md` · `STATE-FACTS.md` · `DATABASE.md` · `TEST-PERMOHONAN-INDEX.md` · `ADHOC-REGISTER.md` · `ADHOC-TRIAGE.md` · `BUG-BESTIARY.md` · `DEV-TESTING-HACKS.md` · `ENV-ARCHITECTURE.md` · `BRANCH-AND-DEPLOY.md` · `GIT-REPO-HYGIENE.md` · `DOMAIN-GLOSSARY.md` · `PERANAN-MAP.md` · `FLOWABLE-KNOWLEDGE.md` + dirs `flowables-bpmn/` · `urusan/`.
- **Optional**: the melaka topic files (JSF-WIRING, JASPER-REPORTS, …) — present where the state has the material.
- **Extras**: any other `UPPER-KEBAB.md` is allowed **only if the state's `index.md` names it** (the audit flags un-indexed extras).
- **Flowables**: our module (PLP) at the root because every tool reads the root non-recursively; other modules in `<MODULE>/`; `CON` → `CONSENT/` (reserved Windows name — broke OneDrive sync 2026-09-04).
- **A skeleton is not knowledge**: every scaffolded file carries the UNVERIFIED banner; content is verified per section against a that-state source (STATE-MIGRATION-PLAYBOOK.md).

## Layer choice (Rule 7) — hook + CLI, no skill
The check is mechanical (file names against a list); judgment enters only when deciding whether a new topic file deserves to exist, and that judgment is captured by "list it in index.md or the audit flags it".

## Trigger moment (Rule 8)
Boot = always fires (drift is discovered every session, not only when a state ticket arrives). Write-time = the leanest point to prevent a wrong name being born. Neither blocks: a wrong name is cheap to rename, a blocked save mid-quest is not.

## Observability
`log.jsonl` rows: `{ts, cmd:"audit", states, drift}` and `{ts, cmd:"scaffold", state, dry, created:[…]}`. The boot hook's fires land in `system/telemetry/hook-fires.jsonl` via hook-runtime.
