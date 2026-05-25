#!/usr/bin/env python3
"""Phase A of etanah-knowledge-graph-build skill — per-table node emission from a pg_dump SQL file.

Reads a `db-schema.sql` file (CREATE TABLE statements, pg_dump style),
extracts one record per table + its columns, emits a subdomain graph JSON
that the plugin's `merge-subdomain-graphs.py` will absorb.

Why this exists:
- Vanilla Understand-Anything's tree-sitter SQL grammar collapses N CREATE TABLE
  statements into a single schema-level "definition" (verified Stage 1 finding
  for et_main_uat: 734 tables → 1 node).
- Without per-table nodes, no Java method can have a `reads_from`/`writes_to`
  edge to a specific table.
- This script emits one `table` node per CREATE TABLE — bypassing the grammar
  limitation deterministically.

Usage:
  python sql_per_table_extractor.py \\
    --input <path-to-db-schema.sql> \\
    --output <path-to-subdomain-graph.json> \\
    --source-file-path <relative-path-of-sql-within-project> \\
    [--columns]   # emit one function-shaped column node per column (default: off — bloats graph for 734-table schemas)

Output schema: Zod-valid GraphNode + GraphEdge envelope, ready for merge.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path


# Match: CREATE TABLE [IF NOT EXISTS] [schema.]name (col-list);
# Captures schema (optional), table name, and parenthesised column body.
TABLE_RE = re.compile(
    r"CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+"
    r"(?:(?P<schema>[\w_]+)\.)?"
    r"(?P<table>[\w_]+)\s*"
    r"\((?P<body>.*?)\)\s*;",
    re.IGNORECASE | re.DOTALL,
)

# Match a column definition's leading identifier (the column name).
# Skips lines that start with constraint keywords.
CONSTRAINT_PREFIXES = (
    "PRIMARY", "FOREIGN", "UNIQUE", "CHECK", "CONSTRAINT", "INDEX", "KEY",
)


def parse_columns(body: str) -> list[str]:
    """Extract column names from a CREATE TABLE body. Best-effort, not a full SQL parser."""
    cols = []
    # Split at top-level commas (commas not inside parens)
    depth = 0
    buf = []
    parts = []
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
    if buf:
        parts.append("".join(buf).strip())

    for part in parts:
        if not part:
            continue
        # Trim leading whitespace and grab the first identifier
        m = re.match(r"\s*([\w_\"]+)", part)
        if not m:
            continue
        first = m.group(1).strip('"')
        if first.upper() in CONSTRAINT_PREFIXES:
            continue
        cols.append(first)
    return cols


def build_graph(
    sql_text: str,
    source_file_rel_path: str,
    emit_columns: bool,
) -> dict:
    nodes = []
    edges = []
    table_count = 0
    col_count = 0

    for m in TABLE_RE.finditer(sql_text):
        schema = m.group("schema") or ""
        table = m.group("table")
        body = m.group("body")
        cols = parse_columns(body)

        full_name = f"{schema}.{table}" if schema else table
        table_id = f"table:{source_file_rel_path}:{full_name}"
        nodes.append({
            "id": table_id,
            "type": "table",
            "name": table,
            "filePath": source_file_rel_path,
            "summary": f"Postgres table {full_name} ({len(cols)} columns). Extracted by Stage 2 SQL per-table extractor (bypasses tree-sitter SQL grammar's schema-level collapse). Schema source: {source_file_rel_path}.",
            "tags": ["postgres", "stage2-sql", schema or "no-schema"],
            "complexity": "complex" if len(cols) > 20 else ("moderate" if len(cols) > 5 else "simple"),
        })
        table_count += 1

        # defines_schema edge from a per-file "table" root → each table (so the
        # SQL file remains discoverable as the source-of-truth for these tables)
        edges.append({
            "source": f"table:{source_file_rel_path}",
            "target": table_id,
            "type": "defines_schema",
            "direction": "forward",
            "weight": 0.8,
            "description": f"{source_file_rel_path} defines {full_name}",
        })

        if emit_columns:
            for col in cols:
                col_id = f"function:{source_file_rel_path}:{full_name}.{col}"
                nodes.append({
                    "id": col_id,
                    "type": "function",  # closest Zod-compatible type for "column"; better representation needs a 'column' enum addition
                    "name": col,
                    "filePath": source_file_rel_path,
                    "summary": f"Column {col} of {full_name}",
                    "tags": ["postgres-column", "stage2-sql"],
                    "complexity": "simple",
                })
                edges.append({
                    "source": table_id,
                    "target": col_id,
                    "type": "contains",
                    "direction": "forward",
                    "weight": 1.0,
                })
                col_count += 1

    return {
        "nodes": nodes,
        "edges": edges,
        "_stage2_meta": {
            "phase": "A_sql_per_table",
            "source_sql_file": source_file_rel_path,
            "tables_extracted": table_count,
            "columns_extracted": col_count,
            "emit_columns": emit_columns,
        },
    }


def main():
    p = argparse.ArgumentParser(description="Stage 2 Phase A — SQL per-table node extractor")
    p.add_argument("--input", required=True, help="Path to db-schema.sql")
    p.add_argument("--output", required=True, help="Where to write the subdomain graph JSON")
    p.add_argument("--source-file-path", required=True, help="Relative path of the SQL file within the project (used in node IDs)")
    p.add_argument("--columns", action="store_true", help="Emit one node per column (default: off — bloats graph for large schemas)")
    args = p.parse_args()

    sql_path = Path(args.input)
    if not sql_path.exists():
        print(f"ERROR: input SQL file not found: {sql_path}", file=sys.stderr)
        sys.exit(1)

    sql_text = sql_path.read_text(encoding="utf-8")
    graph = build_graph(sql_text, args.source_file_path, args.columns)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(graph, indent=2, ensure_ascii=False), encoding="utf-8")

    meta = graph["_stage2_meta"]
    print(f"Stage 2 Phase A: wrote {out_path}")
    print(f"  Tables extracted: {meta['tables_extracted']}")
    print(f"  Columns extracted: {meta['columns_extracted']}")
    print(f"  Output size: {out_path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
