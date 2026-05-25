---
name: etanah-knowledge-graph-build
description: Build the unified etanah-pelupusan knowledge graph by extending vanilla Understand-Anything's output with deterministic passes for SQL per-table nodes (734 tables from et_main_uat) + BPMN structural nodes (Flowable workflows the upstream plugin can't parse) + future cross-edges (Java↔DB, BPMN→Spring beans). Wraps `understand-anything:understand` as prerequisite + augments via merge-subdomain-graphs.py. Run after vanilla /understand has completed on etanah-pelupusan. Use when みや says — "build etanah graph", "build pelupusan knowledge graph", "stage 2 wrapper", "extend understand with BPMN", "etanah-knowledge-graph build", "run etanah-knowledge-graph", "build the unified etanah graph", "/etanah-knowledge-graph-build", "wrapper for understand", "augment understand for etanah", "add BPMN to the graph", "add tables to the knowledge graph", "fill the etanah graph gaps", "make the etanah graph see flowables". Built 2026-05-25 as Stage 2 of the etanah-knowledge-graph side-project after Stage 1 surfaced three concrete gaps (SQL per-table collapse / BPMN unparseable / cross-edges invisible) in stage-1-baseline-observations.md.
allowed-tools: Bash, Read, Write, Glob, Grep
---

# etanah-knowledge-graph-build — Stage 2 wrapper for Understand-Anything

## What this does

Augments the vanilla `understand-anything:understand` output with deterministic, no-LLM-cost passes that fill three known coverage gaps surfaced in Stage 1 of the etanah-knowledge-graph side-project. Produces a single merged `knowledge-graph.json` that the Understand-Anything dashboard renders, showing Java code + Postgres schema + Flowable workflows in one view.

The vanilla plugin handles Java intra-file extraction well; this skill fills what tree-sitter cannot: SQL per-table granularity (collapses to a schema-level definition in vanilla) and BPMN structure (no grammar exists). Cross-edges between layers are deferred to v1.1.

## When this fires

Trigger phrases listed in the skill's `description` frontmatter. Typical invocations:

- "build the etanah knowledge graph" (after vanilla /understand has completed)
- "add BPMN to the graph"
- "run etanah-knowledge-graph build"
- "fill the etanah graph gaps with the SQL and BPMN passes"
- `/etanah-knowledge-graph-build` (slash command form)

## Prerequisites (verify before any pass)

1. The `understand-anything:understand` skill MUST have been run on the etanah-pelupusan project root, producing `<project-root>/.understand-anything/knowledge-graph.json`. If absent, halt with: `"Vanilla /understand has not been run yet. Run /understand on <project-root> first, then re-invoke this skill."` Do NOT attempt to run vanilla as part of this skill — the Skill tool cannot dispatch other skills; vanilla is a manual prerequisite the user runs.
2. `db-schema.sql` path (or skip Pass A with explicit warning if not supplied — the skill emits a clear "no SQL input — Pass A skipped" line).
3. BPMN folder path containing `*.bpmn20.xml` files (or skip Pass B with the analogous warning).

The skill accepts three optional `$ARGUMENTS` flags — defaults align to the etanah-knowledge-graph side-project's standard paths (which the project's README documents):

- `--project-root <path>` — etanah-pelupusan checkout root (default: `E:/Projects/Melaka/etanah-pelupusan`)
- `--db-schema <path>` — pg_dump SQL file (default: `<MemoryCore>/projects/coding-projects/active/etanah-knowledge-graph/inputs/db-schema.sql`)
- `--bpmn-dir <path>` — folder of `*.bpmn20.xml` files (default: `C:/Users/Ridhwan/Downloads/0. Softwares/pelupusan/`)

## The 3 phases

### Phase A — SQL per-table extractor

**Why**: vanilla SQL tree-sitter grammar collapses all 734 et_main_uat tables into one schema-level definition. Without per-table nodes, no Java→table edges can ever resolve.

**How**: read `db-schema.sql` line-by-line, regex-match `CREATE TABLE <schema>.<table_name> (...)`, extract column names from the parenthesised list, emit one `table` node per matched statement + one `function`-shaped column node per column (only when the SQL file isn't massive — 734-table case = ~7,000 column nodes which may bloat the graph; the helper script's `--columns` flag controls this; default OFF for the big schema).

Run the bundled helper script:

```bash
python <SKILL_DIR>/scripts/sql_per_table_extractor.py \
  --input <db-schema-path> \
  --output <project-root>/.understand-anything/intermediate/stage2-sql-knowledge-graph.json \
  --source-file-path <relative-path-of-db-schema.sql-within-project>
```

Output: a subdomain-graph JSON named per the plugin's convention (`<name>-knowledge-graph.json`) under `<project-root>/.understand-anything/` so `merge-subdomain-graphs.py` finds it. Per the plugin's docs, the merge script automatically discovers `*knowledge-graph*.json` files (excluding `knowledge-graph.json` itself).

Each table node: `id="table:<relative-path>:<table_name>"`, `type="table"`, `name="<table_name>"`, `summary="Postgres table from <schema> (Stage 2 SQL extractor)"`, `tags=["postgres","stage2-sql","<schema>"]`, `complexity="simple"`, `filePath="<relative-path>"`. Plus a `defines_schema` edge from `table:<relative-path>:<schema_name>` (the schema-level node, if present from vanilla) OR from the `table:<relative-path>` SQL-file root → each new table node, `weight=0.8`.

### Phase B — BPMN structural extractor

**Why**: tree-sitter has no BPMN grammar. Vanilla extracts zero structure from `.bpmn20.xml` files — they render as generic config nodes with no children. Per `inputs/bpmn-inventory.md`, deterministic Python parse of 20 deployed pelupusan BPMN files surfaces 26 process definitions, 613 userTasks, 55 serviceTasks, 3,238 sequenceFlows — all addressable via `xml.etree.ElementTree`.

**How**: reuse the verified parse pattern from `inputs/bpmn-inventory.py` (the validated EL-dispatcher detection lives there: `flowable:expression="#{flowableTaskListener.receiveServiceTask('beanName', ...)}"`). Run the bundled helper:

```bash
python <SKILL_DIR>/scripts/bpmn_structural_extractor.py \
  --bpmn-dir <bpmn-folder> \
  --project-root <project-root> \
  --output <project-root>/.understand-anything/bpmn-knowledge-graph.json \
  [--resolve-services]   # OPT IN — grep source for @Service("beanName")/@Component("beanName")
```

Node emission per file:

| BPMN element | Node | ID convention |
|---|---|---|
| `<process>` | `flow` | `flow:<relative-bpmn-path>:<process-id>` |
| `<userTask>` | `step` | `step:<relative-bpmn-path>:<task-id>`, tag `userTask` |
| `<serviceTask>` | `step` | `step:<relative-bpmn-path>:<task-id>`, tag `serviceTask`, attribute `beanName=<extracted>` |
| `<callActivity>` | `step` | `step:<relative-bpmn-path>:<task-id>`, tag `callActivity` |
| `<exclusiveGateway>` | `step` | tag `exclusiveGateway` |
| `<parallelGateway>` | `step` | tag `parallelGateway` |

Edge emission:

| Source | Edge | Target | Weight |
|---|---|---|---|
| `<process>` | `contains_flow` | each `<process>` child step | 1.0 |
| `<sequenceFlow sourceRef="A" targetRef="B">` | `flow_step` | A→B | 0.7 |
| `<callActivity calledElement="X">` | `contains_flow` | flow with matching ID | 0.8 |
| serviceTask with bean name (when `--resolve-services` is on AND grep finds `@Service("beanName")`) | `calls` | `class:<file>:<className>` | 0.8 |

### Phase M — Merge subdomain graphs

After Phase A + B complete, run the plugin's own merge script:

```bash
python <UA_PLUGIN_ROOT>/skills/understand/merge-subdomain-graphs.py <project-root>
```

This discovers `<project-root>/.understand-anything/*knowledge-graph*.json` (excluding the canonical `knowledge-graph.json` base) and merges into the base by dedup + dangling-edge drop. The plugin's documentation confirms this is the supported subdomain-merge path.

Verify post-merge graph against `KnowledgeGraphSchema`:

```bash
cd <UA_PLUGIN_ROOT> && node -e "
import('./packages/core/dist/index.js').then(c => {
  const fs = require('fs');
  const g = JSON.parse(fs.readFileSync(process.argv[1], 'utf-8'));
  const r = c.KnowledgeGraphSchema.safeParse(g);
  if (r.success) console.log('Stage 2 merged graph: SCHEMA OK', g.nodes.length, 'nodes,', g.edges.length, 'edges');
  else { console.log('SCHEMA FAIL'); for (const i of r.error.issues.slice(0,10)) console.log(' ', i.path.join('.'), i.message); }
});
" <project-root>/.understand-anything/knowledge-graph.json
```

If schema validation passes → report success. If it fails → restore the pre-merge backup (which Phase M takes automatically) and surface the issues to みや.

## Outputs

Modified files in `<project-root>/.understand-anything/`:
- `knowledge-graph.json` — vanilla nodes/edges PLUS Stage 2 augmentation
- `stage2-sql-knowledge-graph.json` — subdomain (kept after merge for incremental re-runs)
- `bpmn-knowledge-graph.json` — subdomain (kept after merge)
- `knowledge-graph.json.bak-stage2-pre-merge` — backup taken before merge (restore on failure)

The dashboard at `/understand-dashboard` picks up the merged graph automatically on refresh — no further action needed.

## Failure modes + what the skill does

| Failure | Skill behaviour |
|---|---|
| Vanilla `/understand` not run yet | Halt with explicit "Run /understand first" message; do NOT attempt vanilla |
| `db-schema.sql` path doesn't exist | Skip Phase A; warn "no SQL input — table extraction skipped"; continue |
| BPMN folder empty / doesn't exist | Skip Phase B; warn "no BPMN input — workflow extraction skipped"; continue |
| Pass A regex finds 0 CREATE TABLE statements | Warn "no tables matched in <path> — verify it's a pg_dump output"; skip merge for that subdomain |
| Pass B finds 0 BPMN files | Warn; skip |
| `--resolve-services` finds 0 `@Service("X")` matches for some bean | Drop the `calls` edge for that step + warn; emit the step node anyway |
| Merge produces a dangling edge (BPMN serviceTask → bean not in source) | `merge-subdomain-graphs.py` drops it per its own dangling-edge rule + logs to stderr |
| Final schema validation fails | Restore pre-merge backup; emit issues list; do NOT leave a broken graph on disk |

## Roadmap (v1.1 → v2)

| Version | Adds |
|---|---|
| v1 (this) | Phase A (SQL per-table) + Phase B (BPMN structure) + merge + schema validation |
| v1.1 | Phase C — Java↔DB cross-edge resolver via `@Query` annotation parsing + `session.createQuery` HQL extraction + `@Table` JPA annotation matching + mapper.xml walks. Emits `reads_from` / `writes_to` edges. |
| v1.2 | Phase D — XHTML → bean cross-edges via composite component analysis. Resolves `#{beanName.property}` EL bindings to Java classes. |
| v2 | Optional incremental mode — only re-process files changed since last run, using vanilla's fingerprints baseline |

## Why this is a skill (not a hook)

On-demand build invocation. Stage 2 is a deliberate "run this when you want the unified graph" operation, not a per-edit reaction. The plugin's own `/understand --auto-update` covers incremental builds via fingerprints; this skill plugs into that mechanism by extending the merged graph the auto-update path also lands at.

A hook would fire on every commit/edit which is the wrong shape — Phase B requires walking ALL BPMN files (not just the changed one) to maintain `flow_step` consistency.

## Reference artifacts (project context)

| File | What it carries |
|---|---|
| `projects/coding-projects/active/etanah-knowledge-graph/README.md` | Project spine, staged hybrid plan |
| `projects/coding-projects/active/etanah-knowledge-graph/stage-1-baseline-observations.md` | The Stage 1 empirical evidence motivating this skill (§4 gaps + §5 design + §6 verdict) |
| `projects/coding-projects/active/etanah-knowledge-graph/inputs/bpmn-inventory.md` | Verified EL-dispatcher pattern + aggregated user/serviceTask counts across 20 BPMN files |
| `projects/coding-projects/active/etanah-knowledge-graph/inputs/db-schema.sql` | The 734-table dump (Pass A input) |
| `projects/coding-projects/active/etanah-knowledge-graph/stage-1-sample-input/.understand-anything/knowledge-graph.json` | Vanilla sample output (226 nodes / 360 edges) showing what Stage 2 builds on |

## Test plan (deferred per みや 2026-05-25)

**Not run tonight.** Test cases drafted in `evals/evals.json` for the next session:

1. **Sample-folder run**: invoke skill against the existing `stage-1-sample-input/` folder (which already has vanilla output). Expect Phase A to add 1 `table` node per table found in the embedded `db-schema.sql` (small subset); Phase B to add `flow`/`step` nodes per the 2 BPMN files. Verify schema-valid + dashboard loads.
2. **Real run on etanah-pelupusan**: invoke against `E:/Projects/Melaka/etanah-pelupusan` after vanilla /understand has run there. Expect ~734 table nodes + ~26 flow + ~668 step nodes added to the vanilla output.
3. **Failure-mode coverage**: invoke against a project where vanilla hasn't run — expect halt message.

---

*Built 2026-05-25 by Ruri via `/skill-creator` per みや's Stage 2 green-light. Design Memo authored before file creation per A8 self-gate. Tests deferred to next session per みや's "we'll test next time".*
