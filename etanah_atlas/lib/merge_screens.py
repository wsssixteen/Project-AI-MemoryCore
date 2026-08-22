"""Merge screens_N.json agent outputs into config/screen_tables.melaka.json.
Validates every table name against build/schema_parse.json; drops unknown tables with a report.
Usage: python lib/merge_screens.py <dir-with-screens_N.json>"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

def main(src_dir):
    src = pathlib.Path(src_dir)
    schema = json.load(open(ROOT / "build" / "schema_parse.json", encoding="utf-8"))
    valid = {t["name"] for t in schema["tables"]}
    cfg_path = ROOT / "config" / "screen_tables.melaka.json"
    cfg = json.load(open(cfg_path, encoding="utf-8")) if cfg_path.exists() else {"screens": {}}
    screens = cfg.setdefault("screens", {})
    dropped, added = [], 0
    for f in sorted(src.glob("screens_*.json")):
        d = json.load(open(f, encoding="utf-8"))
        for s in d.get("screens", []):
            jsf = s.get("jsf")
            if not jsf or s.get("status") == "not-found":
                if jsf: screens.setdefault(jsf, {"repo": s.get("repo", ""), "form": "", "loads": [], "saves": [], "status": "not-found", "notes": s.get("notes", "")})
                continue
            entry = {"repo": s.get("repo", ""), "form": s.get("form", ""), "loads": [], "saves": [],
                     "status": s.get("status", "traced"), "notes": s.get("notes", "")}
            for k in ("loads", "saves"):
                for x in s.get(k, []):
                    if x.get("table") in valid:
                        if not any(y["table"] == x["table"] for y in entry[k]):
                            entry[k].append({"table": x["table"], "evidence": x.get("evidence", "")})
                    else:
                        dropped.append(f"{jsf} {k}: {x.get('table')}")
            screens[jsf] = entry
            added += 1
    json.dump(cfg, open(cfg_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"merged {added} screens; total in config: {len(screens)}; dropped unknown tables: {len(dropped)}")
    for d in dropped: print("  dropped:", d)

if __name__ == "__main__":
    main(sys.argv[1])
