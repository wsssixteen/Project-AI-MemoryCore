#!/usr/bin/env python3
"""Parse PostgreSQL schema dump -> JSON for ERD app."""
import json
import re
import sys
from collections import Counter

SQL_PATH = ""
OUT_PATH = ""

KNOWN_PREFIXES = {"umm", "plp", "ind", "rjk", "str", "hsl", "pcp", "dft"}

ANCHOR_CANDIDATES = [
    "umm_aplikasi", "plp_a_pelupusan", "plp_p_pelupusan",
    "umm_a_hkmlk", "umm_p_hkmlk", "umm_a_permohonan_tnh",
    "umm_a_pihak_bkptg", "ind_ursn", "ind_tgsn", "umm_a_tgsn",
]


def classify_prefix(name):
    prefix = name.split("_", 1)[0]
    return prefix if prefix in KNOWN_PREFIXES else "other"


def classify_layer(name):
    if re.search(r"^[a-z]+_a_", name):
        return "_a_"
    if re.search(r"^[a-z]+_p_", name):
        return "_p_"
    return "neither"



def parse_sql(sql_path, out_path):
    """Entry point used by build.py."""
    global SQL_PATH, OUT_PATH
    SQL_PATH = sql_path
    OUT_PATH = out_path
    main()


def main():
    with open(SQL_PATH, "r", encoding="utf-8", errors="replace") as fh:
        text = fh.read()
    print("File length: {:,} chars".format(len(text)), file=sys.stderr)

    # ---- tables ----
    create_re = re.compile(
        r"^CREATE TABLE\s+(?:et_main_uat\.)?([a-zA-Z_][\w]*)\s*\((.*?)\n\);",
        re.MULTILINE | re.DOTALL,
    )

    tables = {}
    for match in create_re.finditer(text):
        name = match.group(1).lower()
        body = match.group(2)
        col_count = 0
        inline_fks = []
        columns = []
        pk_cols = []
        for raw_line in body.split("\n"):
            line = raw_line.strip().rstrip(",")
            if not line:
                continue
            upper = line.upper()
            if (upper.startswith("CONSTRAINT") or upper.startswith("PRIMARY KEY")
                    or upper.startswith("UNIQUE") or upper.startswith("FOREIGN KEY")
                    or upper.startswith("CHECK")):
                fk_match = re.search(
                    r"FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+(?:et_main_uat\.)?([a-zA-Z_][\w]*)\s*\(([^)]+)\)",
                    line, re.IGNORECASE)
                if fk_match:
                    child_col = fk_match.group(1).strip().strip('"').lower()
                    parent_table = fk_match.group(2).lower()
                    parent_col = fk_match.group(3).strip().strip('"').lower()
                    inline_fks.append((child_col, parent_table, parent_col))
                pk_match = re.search(r"PRIMARY KEY\s*\(([^)]+)\)", line, re.IGNORECASE)
                if pk_match:
                    pk_cols.extend(c.strip().strip('"').lower() for c in pk_match.group(1).split(","))
                continue
            col_count += 1
            col_match = re.match(r'^"?([a-zA-Z_][\w]*)"?\s+(.+)$', line)
            if col_match:
                col_type = col_match.group(2).strip()
                # trim DEFAULT / NOT NULL noise; keep the base type readable
                col_type = re.split(r"\s+DEFAULT\s+|\s+NOT\s+NULL|\s+NULL", col_type, 1, re.IGNORECASE)[0].strip().rstrip(",")
                columns.append({"n": col_match.group(1).lower(), "t": col_type[:40]})

        tables[name] = {
            "name": name,
            "prefix": classify_prefix(name),
            "layer": classify_layer(name),
            "column_count": col_count,
            "comment": None,
            "columns": columns,
            "pk": pk_cols,
            "_inline_fks": inline_fks,
        }
    print("Parsed {} tables".format(len(tables)), file=sys.stderr)

    # ---- primary keys declared via ALTER TABLE ----
    pk_alter_re = re.compile(
        r"^ALTER TABLE\s+(?:ONLY\s+)?(?:et_main_uat\.)?([a-zA-Z_][\w]*)\s+ADD CONSTRAINT\s+[a-zA-Z_][\w]*\s+PRIMARY KEY\s*\(([^)]+)\)",
        re.MULTILINE | re.IGNORECASE)
    for match in pk_alter_re.finditer(text):
        tname = match.group(1).lower()
        if tname in tables and not tables[tname]["pk"]:
            tables[tname]["pk"] = [c.strip().strip('"').lower() for c in match.group(2).split(",")]
    n_pk = sum(1 for t in tables.values() if t["pk"])
    print("Tables with PK: {}".format(n_pk), file=sys.stderr)

    # ---- table comments ----
    comment_re = re.compile(
        r"^COMMENT ON TABLE\s+(?:et_main_uat\.)?([a-zA-Z_][\w]*)\s+IS\s+'((?:[^']|'')*)'",
        re.MULTILINE)
    n_comments = 0
    for match in comment_re.finditer(text):
        name = match.group(1).lower()
        if name in tables:
            tables[name]["comment"] = match.group(2).replace("''", "'")
            n_comments += 1
    print("Attached {} table comments".format(n_comments), file=sys.stderr)

    # ---- FKs ----
    foreign_keys = []
    for tname, t in tables.items():
        for child_col, parent_table, parent_col in t.pop("_inline_fks", []):
            foreign_keys.append({
                "child_table": tname, "child_column": child_col,
                "parent_table": parent_table, "parent_column": parent_col,
            })

    alter_re = re.compile(
        r"^ALTER TABLE\s+(?:et_main_uat\.)?([a-zA-Z_][\w]*)\s+ADD CONSTRAINT\s+[a-zA-Z_][\w]*\s+FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+(?:et_main_uat\.)?([a-zA-Z_][\w]*)\s*\(([^)]+)\)",
        re.MULTILINE | re.IGNORECASE)
    for match in alter_re.finditer(text):
        foreign_keys.append({
            "child_table": match.group(1).lower(),
            "child_column": match.group(2).strip().strip('"').lower(),
            "parent_table": match.group(3).lower(),
            "parent_column": match.group(4).strip().strip('"').lower(),
        })
    print("Parsed {} foreign keys".format(len(foreign_keys)), file=sys.stderr)

    # ---- counts ----
    group_counts = Counter(t["prefix"] for t in tables.values())
    layer_counts = Counter(t["layer"] for t in tables.values())

    incoming = Counter()
    outgoing = Counter()
    for fk in foreign_keys:
        incoming[fk["parent_table"]] += 1
        outgoing[fk["child_table"]] += 1

    top_referenced = [
        {"table": t, "incoming_fk_count": c, "exists": t in tables}
        for t, c in incoming.most_common(25)
    ]

    anchors = []
    for name in ANCHOR_CANDIDATES:
        anchors.append({
            "table": name,
            "exists": name in tables,
            "incoming_fk_count": incoming.get(name, 0),
            "outgoing_fk_count": outgoing.get(name, 0),
            "column_count": tables.get(name, {}).get("column_count"),
            "comment": tables.get(name, {}).get("comment"),
        })

    orphans = sorted(t for t in tables if incoming.get(t, 0) == 0 and outgoing.get(t, 0) == 0)
    orphan_by_prefix = Counter(classify_prefix(t) for t in orphans)

    tables_out = []
    for tname in sorted(tables):
        t = tables[tname]
        tables_out.append({
            "name": t["name"],
            "prefix": t["prefix"],
            "layer": t["layer"],
            "column_count": t["column_count"],
            "comment": t["comment"],
            "columns": t.get("columns", []),
            "pk": t.get("pk", []),
            "incoming_fk_count": incoming.get(tname, 0),
            "outgoing_fk_count": outgoing.get(tname, 0),
        })

    out = {
        "source_file": SQL_PATH,
        "totals": {
            "tables": len(tables),
            "foreign_keys": len(foreign_keys),
            "tables_with_comment": sum(1 for t in tables.values() if t["comment"]),
            "orphan_tables": len(orphans),
        },
        "group_counts": dict(group_counts.most_common()),
        "layer_counts": dict(layer_counts.most_common()),
        "tables": tables_out,
        "foreign_keys": foreign_keys,
        "top_referenced_tables": top_referenced,
        "identity_anchors": anchors,
        "orphans": {
            "count": len(orphans),
            "by_prefix": dict(orphan_by_prefix.most_common()),
            "tables": orphans,
        },
    }

    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)

    print("\nWrote {}".format(OUT_PATH), file=sys.stderr)
    print("  tables: {}".format(len(tables)), file=sys.stderr)
    print("  FKs:    {}".format(len(foreign_keys)), file=sys.stderr)
    print("  groups: {}".format(dict(group_counts.most_common())), file=sys.stderr)
    print("  layers: {}".format(dict(layer_counts.most_common())), file=sys.stderr)
    print("  orphans: {}".format(len(orphans)), file=sys.stderr)
    print("\n  Top 15 referenced:", file=sys.stderr)
    for row in top_referenced[:15]:
        print("    {:4d}  {}".format(row['incoming_fk_count'], row['table']), file=sys.stderr)
    print("\n  Identity-anchor candidates:", file=sys.stderr)
    for a in anchors:
        mark = "OK " if a["exists"] else "MISS"
        print("    [{}] {:30s} in={:4d}  out={:3d}  cols={}".format(
            mark, a['table'], a['incoming_fk_count'], a['outgoing_fk_count'], a['column_count']), file=sys.stderr)


if __name__ == "__main__":
    main()
