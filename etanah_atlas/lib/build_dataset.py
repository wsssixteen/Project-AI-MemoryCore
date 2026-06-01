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

def main(profile="melaka"):
    parsed = json.load(open(BUILD / "schema_parse.json"))
    mapping_file = CONFIG / f"mapping.{profile}.json"
    if not mapping_file.exists():
        raise SystemExit(f"Mapping for profile '{profile}' not found at {mapping_file}")
    mapping = json.load(open(mapping_file))
    raw_tables = {t["name"]: t for t in parsed["tables"]}
    moduls = mapping["moduls"]

    all_main = set()
    for m in moduls:
        all_main.update(m.get("main_tables", []))
    missing = [t for t in all_main if t not in raw_tables]
    if missing:
        print(f"WARN: main_tables in mapping not in schema: {missing}", file=sys.stderr)

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
            "comment": (t.get("comment") or "")[:300],
            "in": t["incoming_fk_count"], "out": t["outgoing_fk_count"],
            "is_main": nm in all_main,
        })

    NOISY = {"rjk_senarai_ahli_kumpulan"}
    in_fk, out_fk = {}, {}
    for fk in parsed["foreign_keys"]:
        c, p = fk["child_table"], fk["parent_table"]
        if c in NOISY or p in NOISY: continue
        out_fk.setdefault(c, []).append({"to": p, "col": fk["child_column"], "pcol": fk["parent_column"]})
        in_fk.setdefault(p, []).append({"from": c, "col": fk["child_column"], "pcol": fk["parent_column"]})

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
        "tables": tables, "in_fk": in_fk, "out_fk": out_fk,
        "anchor_children": anchor_children, "anchor_parents": anchor_parents,
        "profile": mapping.get("profile", profile),
        "version": mapping.get("version", "2.0"),
        "last_updated": mapping.get("last_updated", ""),
    }

    BUILD.mkdir(exist_ok=True)
    (BUILD / "dataset.json").write_text(json.dumps(out, separators=(",", ":")))
    print(f"  dataset.json: {len(tables)} tables, {len(parsed['foreign_keys'])} FKs, profile={mapping.get('profile')}")
    return out

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "melaka")
