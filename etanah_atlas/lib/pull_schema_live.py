#!/usr/bin/env python3
"""Pull a live schema (PostgreSQL OR Oracle) -> build/schema_parse.json — the SAME
contract lib/parse_schema.py emits from a .sql dump, so everything downstream
(build_dataset / assemble_html / implicit-links / families) works unchanged.

Multi-state Atlas (2026-08-27): lets any state feed the pipeline from its live DB
instead of a hand-exported SQL file. Credentials come from
config/states.<profile>.json (never hardcoded, never committed with secrets — the
file itself is gitignored; see states.example.json).

Usage:
    python lib/pull_schema_live.py --profile selangor
    python lib/pull_schema_live.py --profile terengganu

Reuses classify_prefix / classify_layer / ANCHOR_CANDIDATES from parse_schema so the
prefix/layer/anchor logic is identical to the dump path.
"""
import json, sys, argparse, pathlib
from collections import Counter

LIB = pathlib.Path(__file__).resolve().parent
ROOT = LIB.parent
sys.path.insert(0, str(LIB))
from parse_schema import classify_prefix, classify_layer, ANCHOR_CANDIDATES  # type: ignore


def _norm_type(dt, length=None, prec=None, scale=None):
    dt = (dt or "").lower()
    if dt in ("numeric", "number", "decimal"):
        if prec: return f"numeric({int(prec)}{',' + str(int(scale)) if scale else ''})"
        return "numeric"
    if dt in ("character varying", "varchar", "varchar2", "nvarchar2", "char", "nchar"):
        return f"varchar({int(length)})" if length else "varchar"
    if "timestamp" in dt: return "timestamp"
    if dt == "date": return "date"
    if dt in ("clob", "text", "nclob"): return "text"
    return dt[:40]


def pull_postgres(cfg):
    import psycopg2
    schema = cfg["schema"]
    c = psycopg2.connect(host=cfg["host"], port=cfg["port"], dbname=cfg["database"].split("?")[0],
                         user=cfg["user"], password=cfg["password"], connect_timeout=15)
    cur = c.cursor()
    cur.execute("""SELECT lower(table_name) FROM information_schema.tables
                   WHERE table_schema=%s AND table_type='BASE TABLE'""", (schema,))
    tnames = [r[0] for r in cur.fetchall()]
    cur.execute("""SELECT lower(table_name), lower(column_name), data_type,
                          character_maximum_length, numeric_precision, numeric_scale, ordinal_position
                   FROM information_schema.columns WHERE table_schema=%s
                   ORDER BY lower(table_name), ordinal_position""", (schema,))
    cols = {}
    for tn, cn, dt, ln, pr, sc, _ in cur.fetchall():
        cols.setdefault(tn, []).append({"n": cn, "t": _norm_type(dt, ln, pr, sc)})
    cur.execute("""SELECT lower(tc.table_name), lower(kcu.column_name)
                   FROM information_schema.table_constraints tc
                   JOIN information_schema.key_column_usage kcu
                     ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
                   WHERE tc.table_schema=%s AND tc.constraint_type='PRIMARY KEY'
                   ORDER BY kcu.ordinal_position""", (schema,))
    pks = {}
    for tn, cn in cur.fetchall(): pks.setdefault(tn, []).append(cn)
    cur.execute("""SELECT lower(tc.table_name), lower(kcu.column_name),
                          lower(ccu.table_name), lower(ccu.column_name)
                   FROM information_schema.table_constraints tc
                   JOIN information_schema.key_column_usage kcu
                     ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
                   JOIN information_schema.constraint_column_usage ccu
                     ON tc.constraint_name=ccu.constraint_name AND tc.table_schema=ccu.table_schema
                   WHERE tc.table_schema=%s AND tc.constraint_type='FOREIGN KEY'""", (schema,))
    fks = [(a, b, cc, d) for a, b, cc, d in cur.fetchall()]
    comments = {}
    cur.execute("""SELECT lower(c.relname), obj_description(c.oid)
                   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                   WHERE n.nspname=%s AND c.relkind='r'""", (schema,))
    for tn, cm in cur.fetchall():
        if cm: comments[tn] = cm
    c.close()
    return tnames, cols, pks, fks, comments


def pull_oracle(cfg):
    import oracledb
    owner = cfg["schema"].upper()
    c = oracledb.connect(user=cfg["user"], password=cfg["password"],
                         dsn=f"{cfg['host']}:{cfg['port']}/{cfg['database']}")
    cur = c.cursor()
    cur.execute("SELECT lower(table_name) FROM all_tables WHERE owner=:o", o=owner)
    tnames = [r[0] for r in cur.fetchall()]
    cur.execute("""SELECT lower(table_name), lower(column_name), data_type,
                          char_length, data_precision, data_scale, column_id
                   FROM all_tab_columns WHERE owner=:o ORDER BY table_name, column_id""", o=owner)
    cols = {}
    for tn, cn, dt, ln, pr, sc, _ in cur.fetchall():
        cols.setdefault(tn, []).append({"n": cn, "t": _norm_type(dt, ln, pr, sc)})
    cur.execute("""SELECT lower(c.table_name), lower(cc.column_name)
                   FROM all_constraints c JOIN all_cons_columns cc
                     ON c.constraint_name=cc.constraint_name AND c.owner=cc.owner
                   WHERE c.owner=:o AND c.constraint_type='P' ORDER BY cc.position""", o=owner)
    pks = {}
    for tn, cn in cur.fetchall(): pks.setdefault(tn, []).append(cn)
    # FK: child constraint (R) -> its referenced PK constraint columns
    cur.execute("""SELECT lower(c.table_name), lower(cc.column_name),
                          lower(pc.table_name), lower(pcc.column_name)
                   FROM all_constraints c
                   JOIN all_cons_columns cc ON c.constraint_name=cc.constraint_name AND c.owner=cc.owner
                   JOIN all_constraints pc ON c.r_constraint_name=pc.constraint_name AND c.r_owner=pc.owner
                   JOIN all_cons_columns pcc ON pc.constraint_name=pcc.constraint_name AND pc.owner=pcc.owner
                        AND cc.position=pcc.position
                   WHERE c.owner=:o AND c.constraint_type='R'""", o=owner)
    fks = [(a, b, cc, d) for a, b, cc, d in cur.fetchall()]
    comments = {}
    cur.execute("SELECT lower(table_name), comments FROM all_tab_comments WHERE owner=:o AND comments IS NOT NULL", o=owner)
    for tn, cm in cur.fetchall():
        if cm: comments[tn] = cm
    c.close()
    return tnames, cols, pks, fks, comments


def build(profile):
    cfg = json.load(open(ROOT / "config" / f"states.{profile}.json", encoding="utf-8"))
    conn = cfg["connection"]
    engine = conn["engine"]
    puller = pull_postgres if engine == "postgres" else pull_oracle
    print(f"[pull] {profile} ({engine}) {conn['host']}:{conn['port']} schema={conn['schema']}", file=sys.stderr)
    tnames, cols, pks, fks_raw, comments = puller(conn)

    tables = {}
    for tn in tnames:
        cl = cols.get(tn, [])
        tables[tn] = {
            "name": tn, "prefix": classify_prefix(tn), "layer": classify_layer(tn),
            "column_count": len(cl), "comment": comments.get(tn, ""),
            "columns": cl, "pk": pks.get(tn, []),
        }
    fks = [{"child_table": a, "child_column": b, "parent_table": c, "parent_column": d}
           for (a, b, c, d) in fks_raw if a in tables]

    incoming, outgoing = Counter(), Counter()
    for fk in fks:
        incoming[fk["parent_table"]] += 1
        outgoing[fk["child_table"]] += 1

    tables_out = []
    for tn in sorted(tables):
        t = tables[tn]
        tables_out.append({
            "name": t["name"], "prefix": t["prefix"], "layer": t["layer"],
            "column_count": t["column_count"], "comment": t["comment"],
            "columns": t["columns"], "pk": t["pk"],
            "incoming_fk_count": incoming.get(tn, 0), "outgoing_fk_count": outgoing.get(tn, 0),
        })
    anchors = [{
        "table": n, "exists": n in tables, "incoming_fk_count": incoming.get(n, 0),
        "outgoing_fk_count": outgoing.get(n, 0),
        "column_count": tables.get(n, {}).get("column_count"),
        "comment": tables.get(n, {}).get("comment"),
    } for n in ANCHOR_CANDIDATES]
    orphans = sorted(t for t in tables if incoming.get(t, 0) == 0 and outgoing.get(t, 0) == 0)

    out = {
        "source_file": f"live:{engine}:{conn['host']}/{conn['schema']}",
        "totals": {"tables": len(tables), "foreign_keys": len(fks),
                   "tables_with_comment": sum(1 for t in tables.values() if t["comment"]),
                   "orphan_tables": len(orphans)},
        "group_counts": dict(Counter(t["prefix"] for t in tables.values()).most_common()),
        "layer_counts": dict(Counter(t["layer"] for t in tables.values()).most_common()),
        "tables": tables_out, "foreign_keys": fks,
        "top_referenced_tables": [{"table": t, "incoming_fk_count": c, "exists": t in tables}
                                  for t, c in incoming.most_common(25)],
        "identity_anchors": anchors,
        "orphans": {"count": len(orphans), "by_prefix": dict(Counter(classify_prefix(t) for t in orphans).most_common())},
    }
    (ROOT / "build").mkdir(exist_ok=True)
    json.dump(out, open(ROOT / "build" / "schema_parse.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"[pull] {len(tables)} tables · {len(fks)} FKs · {out['totals']['tables_with_comment']} comments -> build/schema_parse.json", file=sys.stderr)
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", required=True)
    build(ap.parse_args().profile)
