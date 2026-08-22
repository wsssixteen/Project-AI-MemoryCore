"""Build dataset.json by combining schema_parse.json (auto) + a mapping profile (curated)."""
import json, os, re, sys, pathlib

LIB = pathlib.Path(__file__).resolve().parent
ROOT = LIB.parent
BUILD = ROOT / "build"
CONFIG = ROOT / "config"

def detect_category(name, categories):
    """First-match wins from categories patterns list."""
    import re
    for c in categories:
        for pat in c.get("patterns", []):
            if re.search(pat, name): return c["key"]
    return "subsystem"

def detect_swimlane(name, layer, category):
    """Where in the AWAM -> Internal -> Decision -> Registry process flow does this sit."""
    if category == "container_pendaftaran" or name.startswith("dft_"): return "registry"
    if category == "workflow": return "decision"
    if layer == "_p_": return "awam"
    if layer == "_a_": return "internal"
    # Shared / neither — default by content
    if category == "reference": return "reference"
    return "internal"

def detect_modul(name, moduls):
    for m in moduls:
        if m["key"] in ("shared", "operations"): continue
        for p in m["prefix"]:
            if name.startswith(p): return m["key"]
    for m in moduls:
        if m["key"] == "shared":
            for p in m["prefix"]:
                if name.startswith(p): return "shared"
    for m in moduls:
        if m["key"] == "operations":
            for p in m["prefix"]:
                if name.startswith(p): return "operations"
    return "operations"

def detect_layer(n):
    if "_a_" in n: return "_a_"
    if "_p_" in n: return "_p_"
    return "neither"

def compute_implicit_links(parsed, implicit_cfg):
    """Name-matched links with no declared FK: child column == another table's single-column PK."""
    tables = {t["name"]: t for t in parsed["tables"]}
    hk_pats = [re.compile(p) for p in implicit_cfg.get("housekeeping_name_patterns", [])]
    def housekeeping(name):
        return any(p.search(name) for p in hk_pats)
    declared = {(fk["child_table"], fk["child_column"]) for fk in parsed["foreign_keys"]}
    suppress = {(s["from"], s["col"], s["to"]) for s in implicit_cfg.get("suppress", [])}
    verified = {(v["from"], v["col"], v["to"]): v for v in implicit_cfg.get("verified", [])}
    pkmap = {}
    for name, t in tables.items():
        pk = t.get("pk") or []
        if len(pk) == 1:
            pkmap.setdefault(pk[0], []).append(name)
    GENERIC = {"id", "version"}
    links = []
    for name, t in tables.items():
        for c in t.get("columns", []):
            cn = c["n"]
            if cn in GENERIC or not cn.endswith("_id"):
                continue
            if (name, cn) in declared:
                continue
            for parent in pkmap.get(cn, []):
                if parent == name or housekeeping(parent):
                    continue
                if (name, cn, parent) in suppress:
                    continue
                v = verified.get((name, cn, parent))
                links.append({
                    "from": name, "col": cn, "to": parent,
                    "status": "verified" if v else "heuristic",
                    "housekeeping": housekeeping(name),
                })
    return links


def compute_families(table_names):
    """Name-stem families: tokens shared by >=5 tables become a browsable group.
    A table can belong to several families (umm_a_hkmlk -> hkmlk; hsl_bayaran_fi -> bayaran, fi is too short)."""
    from collections import Counter
    STRUCTURAL = {"a", "p", "id", "mlk", "trg", "tmp", "main", "list", "data", "no", "new", "old",
                  "umm", "ind", "rjk", "pcp", "skg", "plp", "dft", "hsl", "str", "pks", "amb", "tkl",
                  "con", "bgn", "llg", "mig", "dm", "msk", "sptb", "tkr", "sws", "ckp", "spc", "gt",
                  "backup", "bak", "masked", "test", "cutover", "delete", "delta", "stage", "ubah", "proses"}
    freq = Counter()
    toks_by_table = {}
    for n in table_names:
        toks = [t for t in n.split("_") if len(t) >= 3 and t not in STRUCTURAL and not t.isdigit()]
        toks_by_table[n] = toks
        freq.update(set(toks))
    fams = {}
    for tok, c in freq.items():
        if c >= 5:
            fams[tok] = sorted(n for n, toks in toks_by_table.items() if tok in toks)
    return [{"key": k, "count": len(v), "tables": v} for k, v in sorted(fams.items(), key=lambda x: -len(x[1]))]


def main(profile="melaka"):
    parsed = json.load(open(BUILD / "schema_parse.json", encoding="utf-8"))
    mapping_file = CONFIG / f"mapping.{profile}.json"
    if not mapping_file.exists():
        raise SystemExit(f"Mapping for profile '{profile}' not found at {mapping_file}")
    mapping = json.load(open(mapping_file, encoding="utf-8"))
    implicit_file = CONFIG / f"implicit_links.{profile}.json"
    implicit_cfg = json.load(open(implicit_file, encoding="utf-8")) if implicit_file.exists() else {}
    tugasan_file = CONFIG / f"tugasan_tables.{profile}.json"
    tugasan_cfg = json.load(open(tugasan_file, encoding="utf-8")) if tugasan_file.exists() else {"tugasans": []}
    census_file = BUILD / "tugasan_census.json"
    census = json.load(open(census_file, encoding="utf-8")) if census_file.exists() else {"tugasans": []}
    screens_file = CONFIG / f"screen_tables.{profile}.json"
    screen_tables = json.load(open(screens_file, encoding="utf-8")) if screens_file.exists() else {"screens": {}}
    usage_file = BUILD / "code_usage.json"
    code_usage = json.load(open(usage_file, encoding="utf-8")) if usage_file.exists() else {}
    registry_file = BUILD / "entity_registry.json"
    entity_reg = json.load(open(registry_file, encoding="utf-8"))["entities"] if registry_file.exists() else {}
    used_by = {}
    for mod, d in code_usage.items():
        for t in d.get("tables", []):
            used_by.setdefault(t, []).append(mod)
    table_entities = {}
    for fq, t in entity_reg.items():
        table_entities.setdefault(t, []).append(fq)
    raw_tables = {t["name"]: t for t in parsed["tables"]}
    moduls = mapping["moduls"]

    all_main = set()
    for m in moduls:
        all_main.update(m.get("main_tables", []))
    missing = [t for t in all_main if t not in raw_tables]
    if missing:
        print(f"WARN: main_tables in mapping not in schema: {missing}", file=sys.stderr)

    bad_stage_tables = []
    for u in mapping["urusans"]:
        for s in u.get("stages", []):
            refs = list(s.get("tables", []))
            for o in (s.get("fork", {}) or {}).get("outcomes", []):
                for st in o.get("steps", []):
                    refs.extend(st.get("tables", []))
            for t in refs:
                if "*" in t: continue
                if t not in raw_tables:
                    bad_stage_tables.append(f"{u['kod']}/{s['kod']}: {t}")
    if bad_stage_tables:
        print(f"WARN: urusan stage tables not in schema ({len(bad_stage_tables)}): {bad_stage_tables}", file=sys.stderr)

    categories = mapping.get("categories", [])
    tables = []
    for t in parsed["tables"]:
        nm = t["name"]
        lyr = detect_layer(nm)
        cat = detect_category(nm, categories)
        swim = detect_swimlane(nm, lyr, cat)
        tables.append({
            "name": nm,
            "modul": detect_modul(nm, moduls),
            "layer": lyr,
            "category": cat,
            "swimlane": swim,
            "cols": t["column_count"],
            "columns": t.get("columns", []),
            "pk": t.get("pk", []),
            "comment": (t.get("comment") or "")[:300],
            "in": t["incoming_fk_count"], "out": t["outgoing_fk_count"],
            "is_main": nm in all_main,
            "used_by": used_by.get(nm, []),
            "entity": table_entities.get(nm, []),
        })

    NOISY = {"rjk_senarai_ahli_kumpulan"}
    in_fk, out_fk = {}, {}
    for fk in parsed["foreign_keys"]:
        c, p = fk["child_table"], fk["parent_table"]
        if c in NOISY or p in NOISY: continue
        out_fk.setdefault(c, []).append({"to": p, "col": fk["child_column"], "pcol": fk["parent_column"]})
        in_fk.setdefault(p, []).append({"from": c, "col": fk["child_column"], "pcol": fk["parent_column"]})

    implicit_links = compute_implicit_links(parsed, implicit_cfg)
    implicit_in, implicit_out = {}, {}
    for lk in implicit_links:
        implicit_out.setdefault(lk["from"], []).append({"to": lk["to"], "col": lk["col"], "status": lk["status"], "hk": lk["housekeeping"]})
        implicit_in.setdefault(lk["to"], []).append({"from": lk["from"], "col": lk["col"], "status": lk["status"], "hk": lk["housekeeping"]})

    def topN(items, n):
        seen, out = set(), []
        for x in items:
            key = x.get("from") or x.get("to")
            if key in seen: continue
            seen.add(key); out.append(x)
        out.sort(key=lambda r: -(raw_tables.get(r.get("from") or r.get("to"), {}).get("incoming_fk_count") or 0))
        return out[:n]

    anchor_children = {n: topN(in_fk.get(n, []), 14) for n in all_main}
    anchor_parents  = {n: topN(out_fk.get(n, []), 14) for n in all_main}

    modul_stats = {}
    for m in moduls:
        members = [t for t in tables if t["modul"] == m["key"]]
        modul_stats[m["key"]] = {
            "table_count": len(members),
            "main_count":  sum(1 for t in members if t["is_main"]),
            "layer_counts": {
                "_a_": sum(1 for t in members if t["layer"] == "_a_"),
                "_p_": sum(1 for t in members if t["layer"] == "_p_"),
                "neither": sum(1 for t in members if t["layer"] == "neither"),
            },
        }

    out = {
        "categories": categories,
        "totals": {
            "tables": len(tables),
            "foreign_keys": len(parsed["foreign_keys"]),
            "moduls": len(moduls),
            "urusans": len(mapping["urusans"]),
            "main_tables": len(all_main),
        },
        "moduls": moduls, "modul_stats": modul_stats,
        "anchor_blurbs": mapping["anchor_blurbs"],
        "urusans": mapping["urusans"],
        "tugasans": tugasan_cfg.get("tugasans", []),
        "tugasan_census": census.get("tugasans", []),
        "screen_tables": screen_tables.get("screens", {}),
        "families": compute_families([t["name"] for t in tables]),
        "tables": tables, "in_fk": in_fk, "out_fk": out_fk,
        "implicit_in": implicit_in, "implicit_out": implicit_out,
        "anchor_children": anchor_children, "anchor_parents": anchor_parents,
        "profile": mapping.get("profile", profile),
        "version": mapping.get("version", "2.0"),
        "last_updated": mapping.get("last_updated", ""),
    }

    BUILD.mkdir(exist_ok=True)
    (BUILD / "dataset.json").write_text(json.dumps(out, separators=(",", ":")))
    print(f"  dataset.json: {len(tables)} tables, {len(parsed['foreign_keys'])} FKs, {len(implicit_links)} implicit links, {len(tugasan_cfg.get('tugasans', []))} tugasans, profile={mapping.get('profile')}")
    return out

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "melaka")
