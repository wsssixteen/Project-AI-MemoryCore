# -*- coding: utf-8 -*-
"""Derive the FULL per-urusan tugasan sequence from the parsed Flowable BPMNs and join it
against the DB census (ind_tgsn/ind_langkah/ind_skrin) — the completeness layer under the
curated Journey abstraction (miya 2026-08-27: "you're missing many Tugasan").

Inputs : etanah-codemap/bpmn_flow.json (parsed BPMN truth, 23 processes)
         build/tugasan_census.json     (1,433 DB-defined tugasans, mlit)
Output : build/journey_seq.json  {urusans: {KOD: {tasks:[...], stats:{...}}}, summary}
Order  : numeric name prefix ("43.0 ...") when present; document order otherwise.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CODEMAP = pathlib.Path(r"C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\projects\coding-projects\active\etanah-codemap")

URUSANS = ["PT","PLPS","PRZ","MLPS","BPRZ","PSBS","PPJK","PLTP","PRBB","PRU","PPTPB","MCL","RPPLP"]
SKIP_NAMES = re.compile(r"^(DELAY|delay)\b")

def norm(s):
    s = re.sub(r"\s+", " ", (s or "")).strip().lower()
    # BPMN task names carry a numeric prefix ("43.0 penyediaan ..."); census names do not.
    return re.sub(r"^\d+(?:\.\d+)?\s*", "", s)

def num_key(name):
    m = re.match(r"^(\d+(?:\.\d+)?)", (name or "").strip())
    return float(m.group(1)) if m else None

def module_of(called):
    if not called: return None
    if called.startswith("MLK_TKL_"): return "etanah-teknikal"
    if called.startswith("MLK_DFT_"): return "etanah-pendaftaran"
    if called.startswith("MLK_PLP_SUB_"): return "pelupusan sub-process"
    return called

def main():
    bpmn = json.load(open(CODEMAP / "bpmn_flow.json", encoding="utf-8"))["flows"]
    census_rows = json.load(open(ROOT / "build" / "tugasan_census.json", encoding="utf-8"))["tugasans"]
    census = {}
    for r in census_rows:
        census.setdefault(r["urusan"], {})[norm(r["name"])] = r

    # sub-process task lists (expanded inline under their callActivity)
    subs = {}
    for key, proc in bpmn.items():
        if "_SUB_" in key:
            uts = []
            for nid, n in proc["nodes"].items():
                if n.get("type") == "userTask" and n.get("name") and not SKIP_NAMES.match(n["name"]):
                    uts.append(re.sub(r"\s+", " ", n["name"]).strip())
            subs[key] = uts

    out = {"urusans": {}, "summary": {}}
    for kod in URUSANS:
        proc = bpmn.get(f"MLK_PLP_{kod}")
        if not proc:
            out["urusans"][kod] = {"tasks": [], "stats": {"error": "no BPMN process"}}
            continue
        rows = []
        for nid, n in proc["nodes"].items():
            t = n.get("type")
            name = re.sub(r"\s+", " ", n.get("name") or "").strip()
            if not name or SKIP_NAMES.match(name): continue
            if t == "userTask":
                cmap = census.get(kod, {})
                key = norm(name)
                c = cmap.get(key)
                if not c:
                    # bounded fuzzy fallback: drop parentheticals + " - X" tails, then a
                    # UNIQUE containment match either direction (ambiguous -> no match)
                    stripped = re.sub(r"\s*\([^)]*\)", "", key)
                    stripped = re.sub(r"\s*-\s*[a-z0-9 /]{1,12}$", "", stripped).strip()
                    c = cmap.get(stripped)
                    if not c and len(stripped) >= 10:
                        hits = [v for k2, v in cmap.items() if stripped in k2 or k2 in stripped]
                        if len(hits) == 1: c = hits[0]
                rows.append({"name": name, "kind": "userTask",
                             "kod": c["kod"] if c else None,
                             "peranan": c.get("peranan") if c else None,
                             "screens": len(c.get("screens") or []) if c else None,
                             "in_census": bool(c)})
            elif t == "callActivity":
                called = n.get("calledElement")
                row = {"name": name, "kind": "callActivity", "called": called, "module": module_of(called)}
                if called in subs:
                    row["sub_tasks"] = subs[called]
                rows.append(row)
        rows.sort(key=lambda r: (num_key(r["name"]) is None, num_key(r["name"]) or 0))
        ut = [r for r in rows if r["kind"] == "userTask"]
        matched = sum(1 for r in ut if r["in_census"])
        out["urusans"][kod] = {"tasks": rows, "stats": {
            "user_tasks": len(ut), "call_activities": len(rows) - len(ut),
            "census_matched": matched, "census_defined": len(census.get(kod, {})),
        }}
    out["summary"] = {k: v["stats"] for k, v in out["urusans"].items()}
    json.dump(out, open(ROOT / "build" / "journey_seq.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for k, s in out["summary"].items():
        print(f"{k:6} BPMN userTasks={s.get('user_tasks',0):3} callActivities={s.get('call_activities',0):3} "
              f"census-matched={s.get('census_matched',0):3} census-defined={s.get('census_defined',0):3}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
