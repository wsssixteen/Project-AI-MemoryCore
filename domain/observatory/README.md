goal: one screen shows every Lapis Lazuli component with its purpose, registration, eval, liveness and gaps, plus the stray files no component owns; every finding reads fact, context, judgement with evidence, and Ruri retrieves the same findings in one command to diagnose the system and brief miya without missing anything
retention: regenerate
symptom: 2026-09-27 miya: prove monitoring and observability visually for every feature; estate state was split across 4 markdown views and worktree telemetry was invisible
goal_signal: observatory.eval.js green (counts equal the disk per kind, every non-healthy component sits in a finding, every finding carries all layers), every tab renders with 0 console errors, the Overview fits one desktop screen

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
| `observatory.eval.js` | Per-kind counts vs an independent disk count, every kind has rows, verdict rules, server routes, build time. |
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

Purpose is a pillar: the drawer leads with each component's goal, the Catalog has a Purpose column, and components with no declared goal are their own finding.

## Views

Overview (one screen: KPIs, findings, health by kind, activity) · Findings · Catalog · Runtime · Monitoring · Mistakes · Evals · Quests · Memory · Unmanaged · Sources.
Observability (did it fire, block, how long) lives in Runtime; monitoring (why, which quest phase, re-asks, cost) lives in Monitoring.

## Verdicts

`ghost` (registered, file missing) · `failing` (eval red in the latest battery) · `unregistered` (hook file settings.json never runs) · `silent` (registered and observable, 0 runs in the window) · `gaps` (feature-census gaps: no eval, no README, goal-less, no retention, unobservable) · `retired` (tombstoned, deliberately unregistered with a system-audit opt-out marker, or disabled in code with a DISABLED comment) · `healthy`. Memory stores and docs are listed but not judged.

## Data roots

Inventory comes from the checkout the code runs in. Live ledgers come from the main repo (`quest/active.txt`, `system/telemetry/*`, `domain/*/log.jsonl`) plus every git-registered worktree. Folders under `.claude/worktrees` that git no longer knows are NOT read; they are listed as stale worktrees with the verdict from the latest `worktree-cleanup-boot.js` sweep.

*Born 2026-09-27 via `core/forge.js new script observatory` (registry row `observatory`).*
