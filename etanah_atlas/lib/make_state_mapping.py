#!/usr/bin/env python3
"""Derive a v1 mapping.<state>.json from mapping.melaka.json + the state's live schema.

The eTanah states share ONE schema family (identical table names), so Melaka's
moduls / categories / anchor_blurbs port directly — filtered to the tables that
actually exist in the target state. What does NOT port: the urusan JOURNEYS
(BPMN-verified PER STATE) — presenting Melaka's flows as another state's would be a
lie, so urusans start EMPTY and the Journey tab honestly says "not yet curated".
Run lib/build_journey_seq.py per state later to fill them from that state's own BPMNs.

Usage: python lib/make_state_mapping.py --profile selangor --label Selangor
"""
import json, argparse, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config"
BUILD = ROOT / "build"


def main(profile, label):
    mel = json.load(open(CONFIG / "mapping.melaka.json", encoding="utf-8"))
    parsed = json.load(open(BUILD / "schema_parse.json", encoding="utf-8"))
    exist = {t["name"] for t in parsed["tables"]}

    moduls = []
    for m in mel["moduls"]:
        m2 = dict(m)
        m2["main_tables"] = [t for t in m.get("main_tables", []) if t in exist]
        moduls.append(m2)
    anchor_blurbs = {k: v for k, v in mel.get("anchor_blurbs", {}).items() if k in exist}

    out = {
        "_comment": f"v1 mapping for {label}, derived from mapping.melaka.json by "
                    f"lib/make_state_mapping.py. moduls/categories/anchors reused (shared "
                    f"schema family, filtered to existing tables). urusans EMPTY until "
                    f"curated from {label}'s own BPMNs — Melaka's journeys do NOT port.",
        "profile": profile,
        "label": label,
        "version": "1.0",
        "moduls": moduls,
        "categories": mel.get("categories", []),
        "anchor_blurbs": anchor_blurbs,
        "urusans": [],
        "notes": f"{label} · schema-derived Tables/Map live from the state DB; "
                 f"Urusan Journey pending per-state BPMN curation.",
    }
    dropped = sum(len(m.get("main_tables", [])) for m in mel["moduls"]) - sum(len(m["main_tables"]) for m in moduls)
    p = CONFIG / f"mapping.{profile}.json"
    json.dump(out, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"wrote {p.name}: {len(moduls)} moduls · {len(anchor_blurbs)} anchors kept · "
          f"{dropped} main_tables dropped (absent in {label}) · urusans=0")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", required=True)
    ap.add_argument("--label", required=True)
    a = ap.parse_args()
    main(a.profile, a.label)
