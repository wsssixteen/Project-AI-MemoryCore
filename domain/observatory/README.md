goal: one screen shows every Lapis Lazuli Feature (the unit of skill + hooks + scripts + eval) with its purpose, parts, liveness and gaps, plus the stray files nothing owns; every finding reads fact, context, judgement with evidence, and Ruri retrieves the same findings in one command to diagnose the system and brief miya without missing anything
retention: regenerate
symptom: 2026-09-27 miya: prove monitoring and observability visually for every feature; estate state was split across 4 markdown views and worktree telemetry was invisible
goal_signal: observatory.eval.js green (counts equal the disk per kind, every non-healthy component sits in a finding, every finding carries all layers), every Feature is its worst live part and every component has exactly one home, every view renders with 0 console errors, the Overview fits one desktop screen

# Lapis Lazuli Observatory

A local dashboard for the whole Lapis Lazuli project: every component, its health, and everything nothing owns.

## Run it

- `node domain/observatory/server.js` then open http://127.0.0.1:7790
- or the `observatory` entry in `.claude/launch.json` (preview pane)
- CLI only: `node lib/observatory.js` (summary) · `--json` (full snapshot) · `--days 7|30|90` · `--audit --git` (slow blocks)

## Pieces

| Piece | Role |
|---|---|
| `lib/observatory.js` | Data layer (forge-born). One read-only snapshot of 12 component kinds + ledgers + strays. Reuses `lib/feature-census.js` collect() for verdict gaps and `lib/audit-briefing.js` gather() for the audit screen. |
| `server.js` | Zero-dependency HTTP server on 127.0.0.1. Caches the snapshot 30 s; git state, stale-worktree sizes and the audit block run in the background. |
| `public/` | Vanilla HTML/CSS/JS, inline SVG charts, dataviz reference palette, light + dark. |
| `observatory.eval.js` | Per-kind counts vs an independent disk count, verdict rules, Feature grouping (one home per component, worst-part verdict, finding links both ways), findings layers, retrieval CLIs, server routes, UI wiring, build time. |
| `log.jsonl` | One row per snapshot (gitignored runtime). |
| `judgements.jsonl` | Ruri's investigation notes per finding or component (committed; written by `--judge`). |
| `%TEMP%\lapis-observatory\telemetry-v3.json` | Incremental hook-telemetry aggregate: byte offset per append-only file + a hash per row already counted. Outside the repo so OneDrive never syncs it; safe to delete (the next build rebuilds it in ~10 s). |

## Telemetry is de-duplicated

The `hook-fires*.jsonl` files overlap. On 2026-09-27 the main live file repeated 146,215 rows that also sit in the monthly archive and the other laptop's file. Summing files gave 214,139 runs / 50.5 h for 30 days; counting each row once gives 129,407 runs / 33.7 h. The observatory counts a row once by its identity (`ts · hook · event · turn_id · session_id · dur_ms · exit · blocked · mode`). The Sources view shows, per file, how many rows were counted and how many repeated another file. `lib/turn-report.js` and `lib/audit-briefing.js` still sum files, so their hook totals run high until they are fixed.

## Findings: fact, context, judgement

Every issue class the data can show becomes a finding with the same layers, so the mechanical truth and the reasoning never mix:

| Layer | What it holds | Where it comes from |
|---|---|---|
| Fact | the mechanical statement plus the full evidence list (paths, counts, items) | the snapshot, computed |
| Context | what the fact means in this system | Ruri's standing rules in `findingsFor()` (lib/observatory.js) |
| Judgement | verdict, why (justification), next action, who decides (miya or Ruri), which system goal (G1 to G7) it threatens | same rules |
| Notes | case-by-case investigations Ruri recorded | `judgements.jsonl`, joined by finding id; marked STALE when the evidence set changes |

An eval proves nothing is left out: every non-healthy component must appear in at least one finding, and every non-empty stray category must have one.

## How Ruri retrieves it (diagnose first, brief with evidence)

- `node lib/observatory.js --brief` · every finding, worst first, 8 evidence items each (about 4 s)
- `node lib/observatory.js --brief --full` · every evidence item
- `node lib/observatory.js --finding <id>` · one finding in full
- `node lib/observatory.js --judge <id> --judgement "..." --justification "..." [--context "..."] [--action "..."]` · record an investigation (id = a finding id or `component:<component id>`)

Purpose is a pillar: the Feature drawer leads with its purpose, the Features table shows it under each name, a purpose the goal-backfill derived and nobody promoted is tagged draft, and a Feature with no purpose is its own finding.

## Features: the unit on screen

A Feature is the top unit from `.claude/skills/system-design/SKILL.md`: one capability whose parts (skill, hooks, scripts, eval, README, log) work together. `groupFeatures()` assigns every component one home by rule:

| Component | Home |
|---|---|
| `domain/<name>/` folder | Feature `<name>` (layout Feature folder) |
| skill `.claude/skills/<name>` | Feature `<name>` |
| legacy hook `.claude/hooks/<name>.js` | Feature `<name>` |
| protocol `Feature/<Name>/` | Feature `<name>` (layout Protocol) |
| workflow | Feature of the same name |
| script | Feature of its own name, else the one Feature that references it, else Shared (2+) or Unowned (0) |
| bundle | Shared runtime |
| knowledge, memory, doc, project | Stores (listed, not judged) |

A Feature takes the verdict of its worst live part; retired and disabled parts are shown but not judged.

## Map: the system as a company

`orgChart()` draws the system as an org chart. Chart 1: Board (みや, system goals, north star, constitution) → chief executive (Ruri) → 4 divisions → 12 departments. Chart 2 (`#map/<department>`): the department's head doc, then its Features as executives in three tiers.

| Tier | Rule | Means |
|---|---|---|
| Senior | a hook on SessionStart, UserPromptSubmit or Stop, or a Protocol | always on, every session or turn |
| Mid | hooks on PreToolUse or PostToolUse only | on action, when a tool is used |
| Junior | no hook | on call, only when invoked |

A tier says how present a Feature is, not how important. Department membership is Ruri's classification in `ORG` (lib/observatory.js); a Feature in no department (or two) raises `org-unplaced`, a listed name with no Feature raises `org-stale`.

## Views: top down, open only when needed

| Level | What | Where |
|---|---|---|
| L0 glance | Feature health bar, 3 numbers, the 10 worst findings, hook runs | Overview (fits one screen) |
| L1 area | Map · Findings · Features · Activity (Hooks, Turns and quests, Mistakes, Evals) · Estate (Strays, Stores and docs, Data sources) | tabs, sections |
| L2 item | one finding expanded (fact, context, judgement) · one Feature drawer (purpose, parts, hooks, activity, findings, notes) | click |
| L3 evidence | evidence lists, notes, raw paths | folds, built only when opened |

Observability (did it fire, block, how long) lives in Activity > Hooks; monitoring (why, which quest, re-asks, cost) lives in Activity > Turns and quests. Quests are the work the turns serve, not a component, so they sit there as a fold instead of a tab.

Every term with a dotted underline has a definition on hover; **Glossary** lists them all. **Guide** walks 9 steps through the app; it opens once on first visit (remembered in localStorage) and `?guide=off` suppresses it.

## Verdicts

`ghost` (registered, file missing) · `failing` (eval red in the latest battery) · `unregistered` (hook file settings.json never runs) · `silent` (registered and observable, 0 runs in the window) · `gaps` (feature-census gaps: no eval, no README, goal-less, no retention, unobservable) · `retired` (tombstoned, deliberately unregistered with a system-audit opt-out marker, or disabled in code with a DISABLED comment) · `healthy`. On screen they read Broken wiring · Failing tests · Not wired · Not running · Needs work · Retired · Healthy. Memory stores and docs are listed but not judged.

## Data roots

Inventory comes from the checkout the code runs in. Live ledgers come from the main repo (`quest/active.txt`, `system/telemetry/*`, `domain/*/log.jsonl`) plus every git-registered worktree. Folders under `.claude/worktrees` that git no longer knows are NOT read; they are listed as stale worktrees with the verdict from the latest `worktree-cleanup-boot.js` sweep.

*Born 2026-09-27 via `core/forge.js new script observatory` (registry row `observatory`).*
