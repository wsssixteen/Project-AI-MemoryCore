# -*- coding: utf-8 -*-
"""Amend the Journey's ORIGINAL path with the full BPMN truth (miya 2026-08-27 v2 —
"You should amend the original path... dropdown per tugasan or just the sub-flows").

Per urusan, emits a STRUCTURED path aligned to the curated fork:
  main      — pre/shared tugasans, BPMN graph (BFS) order
  branches  — {lulus|tolak|tangguh: [rows]} via forward closure from each curated
              outcome's ANCHOR task (name-matched); back-edges (tangguh loops) ignored
              by the order-index guard; nodes reachable from >1 anchor -> converged
  converged — shared tail (runs whichever branch), rendered after the chosen branch
Rows: userTask (census kod/peranan joined) or callActivity (module labeled,
MLK_PLP_SUB_* expanded as sub_tasks). Delay/system rows filtered; identical
(name+called) collapsed with n=count. Unmatched census -> flagged, never guessed.

Inputs : etanah-codemap/bpmn_flow.json · build/tugasan_census.json · config/mapping.<profile>.json
Output : build/journey_seq.json
"""
import json, pathlib, re, sys
from collections import deque

ROOT = pathlib.Path(__file__).resolve().parent.parent
CODEMAP = pathlib.Path(r"C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\projects\coding-projects\active\etanah-codemap")
URUSANS = ["PT","PLPS","PRZ","MLPS","BPRZ","PSBS","PPJK","PLTP","PRBB","PRU","PPTPB","MCL","RPPLP"]

def norm(s):
    s = re.sub(r"\s+", " ", (s or "")).strip().lower()
    return re.sub(r"^\d+(?:\.\d+)?\s*", "", s)

def num_of(name):
    m = re.match(r"^(\d+(?:\.\d+)?)", (name or "").strip())
    return float(m.group(1)) if m else None

def is_junk(name):
    return bool(re.match(r"^delay\b", norm(name)))

def module_of(called):
    if not called: return None
    if called.startswith("MLK_TKL_"): return "etanah-teknikal"
    if called.startswith("MLK_DFT_"): return "etanah-pendaftaran"
    if called.startswith("MLK_PLP_SUB_"): return "pelupusan sub-process"
    return called

def census_lookup(cmap, name):
    key = norm(name)
    c = cmap.get(key)
    if c: return c
    stripped = re.sub(r"\s*\([^)]*\)", "", key)
    stripped = re.sub(r"\s*-\s*[a-z0-9 /]{1,12}$", "", stripped).strip()
    c = cmap.get(stripped)
    if c: return c
    if len(stripped) >= 10:
        hits = [v for k2, v in cmap.items() if stripped in k2 or k2 in stripped]
        if len(hits) == 1: return hits[0]
    return None

def make_row(nid, n, cmap, subs):
    name = re.sub(r"\s+", " ", n.get("name") or "").strip()
    if n["type"] == "userTask":
        c = census_lookup(cmap, name)
        return {"id": nid, "name": name, "kind": "userTask", "num": num_of(name),
                "kod": c["kod"] if c else None, "peranan": (c.get("peranan") if c else None),
                "in_census": bool(c)}
    called = n.get("calledElement")
    row = {"id": nid, "name": name, "kind": "callActivity", "num": num_of(name),
           "called": called, "module": module_of(called)}
    if called in subs: row["sub_tasks"] = subs[called]
    return row

def collapse(rows):
    out = []
    for r in rows:
        key = (r["name"], r.get("called"))
        if out and (out[-1]["name"], out[-1].get("called")) == key:
            out[-1]["n"] = out[-1].get("n", 1) + 1
        else:
            prev = next((x for x in out if (x["name"], x.get("called")) == key), None)
            if prev: prev["n"] = prev.get("n", 1) + 1
            else: out.append(dict(r))
    return out

def main(profile="melaka"):
    bpmn = json.load(open(CODEMAP / "bpmn_flow.json", encoding="utf-8"))["flows"]
    census_rows = json.load(open(ROOT / "build" / "tugasan_census.json", encoding="utf-8"))["tugasans"]
    mapping = json.load(open(ROOT / "config" / f"mapping.{profile}.json", encoding="utf-8"))
    census = {}
    for r in census_rows:
        census.setdefault(r["urusan"], {})[norm(r["name"])] = r

    subs = {}
    for key, proc in bpmn.items():
        if "_SUB_" in key:
            subs[key] = [re.sub(r"\s+", " ", n["name"]).strip()
                         for n in proc["nodes"].values()
                         if n.get("type") == "userTask" and n.get("name") and not is_junk(n["name"])]

    out = {"urusans": {}, "summary": {}}
    for kod in URUSANS:
        proc = bpmn.get(f"MLK_PLP_{kod}")
        if not proc:
            out["urusans"][kod] = {"main": [], "branches": {}, "converged": [], "stats": {"error": "no BPMN"}}
            continue
        nodes, edges = proc["nodes"], proc["edges"]
        adj = {}
        for e in edges: adj.setdefault(e["from"], []).append(e["to"])

        starts = [nid for nid, n in nodes.items() if n.get("type") == "startEvent"] or [next(iter(nodes))]
        order, seen, q = {}, set(), deque(starts)
        i = 0
        while q:
            nid = q.popleft()
            if nid in seen: continue
            seen.add(nid); order[nid] = i; i += 1
            for nxt in adj.get(nid, []):
                if nxt not in seen: q.append(nxt)
        # edges can reference ids the parser did not emit as nodes (boundary events etc.)
        # — they were walked for connectivity; drop them from anything node-typed below.
        order = {nid: v for nid, v in order.items() if nid in nodes}
        # nodes never reached by BFS (disconnected fragments) still get an order tail
        for nid in nodes:
            if nid not in order:
                order[nid] = i; i += 1

        cmap = census.get(kod, {})
        visible = [nid for nid in sorted(order, key=order.get)
                   if nodes[nid].get("type") in ("userTask", "callActivity")
                   and nodes[nid].get("name") and not is_junk(nodes[nid]["name"])]

        # curated fork anchors
        u_map = next((u for u in mapping["urusans"] if u["kod"] == kod), None)
        fork = next((s["fork"] for s in (u_map or {}).get("stages", []) if s.get("fork")), None)
        anchors, unanchored = {}, []
        if fork:
            for o in fork.get("outcomes", []):
                segs = []
                for st in (o.get("steps") or []):
                    segs.extend(re.split(r"\s*/\s*", st.get("name") or ""))
                hit = None
                for seg in segs:
                    seg = seg.strip()
                    if not seg: continue
                    # 1) NUMBER match — robust to wording drift between curation and BPMN
                    sn = num_of(seg)
                    if sn is not None:
                        cands = [nid for nid in visible if num_of(nodes[nid]["name"]) == sn]
                        if len(cands) == 1: hit = cands[0]; break
                    # 2) exact / unique-containment name match
                    tgt = norm(seg)
                    hit = next((nid for nid in visible if norm(nodes[nid]["name"]) == tgt), None)
                    if hit: break
                    if len(tgt) >= 10:
                        cands = [nid for nid in visible if tgt in norm(nodes[nid]["name"]) or norm(nodes[nid]["name"]) in tgt]
                        if len(cands) == 1: hit = cands[0]; break
                if hit: anchors[o["kind"]] = hit
                else: unanchored.append(o["kind"])

        # PRE set: forward BFS from start, BLOCKED at the anchors — everything the flow
        # can reach without entering any branch entry is pre/shared. Loop-back edges
        # (tangguh -> re-table) re-enter exactly this region, so subtracting PRE from a
        # branch closure removes the loop pollution without dominator analysis.
        anchor_set = set(anchors.values())
        pre = set()
        pq = deque(starts)
        while pq:
            nid = pq.popleft()
            if nid in pre or nid in anchor_set: continue
            pre.add(nid)
            for nxt in adj.get(nid, []):
                if nxt not in pre: pq.append(nxt)

        closures = {}
        for kind, a in anchors.items():
            cl, qq = set(), deque([a])
            while qq:
                nid = qq.popleft()
                if nid in cl: continue
                cl.add(nid)
                for nxt in adj.get(nid, []):
                    if nxt not in cl: qq.append(nxt)
            closures[kind] = cl - pre

        # per-outcome number sets from the CURATED step names (lulus 30-32/38..., tolak
        # 33-35... — per-branch distinct): tie-breaker for nodes whose closures overlap
        # because rework loops interconnect the tails (the two-gateway MMKN family)
        outcome_nums = {}
        if fork:
            for o in fork.get("outcomes", []):
                nums = set()
                for st in (o.get("steps") or []):
                    nums.update(float(x) for x in re.findall(r"\d+(?:\.\d+)?", st.get("name") or ""))
                outcome_nums[o["kind"]] = nums

        def by_number(nid):
            n = num_of(nodes[nid].get("name"))
            if n is None: return None
            exact = [k for k, s in outcome_nums.items() if n in s]
            if len(exact) == 1: return exact[0]
            best, bestd = None, 99
            for k, s in outcome_nums.items():
                for v in s:
                    d = abs(n - v)
                    if d < bestd: best, bestd = k, d
                    elif d == bestd and best != k: best = None
            return best if bestd <= 3 and best else None

        def by_keyword(nid):
            nm = norm(nodes[nid].get("name"))
            marks = [k for k, words in (("tolak", ("tolak",)), ("tangguh", ("tangguh",)), ("lulus", ("lulus",)))
                     if k in closures and any(w in nm for w in words)]
            return marks[0] if len(marks) == 1 else None

        membership = {}
        for nid in visible:
            hits = [k for k, cl in closures.items() if nid in cl]
            if len(hits) != 1 and closures:
                nb = by_number(nid) or by_keyword(nid)
                if nb and (len(hits) == 0 and nid not in pre or len(hits) > 1):
                    hits = [nb]
            membership[nid] = hits

        cmain, cconv, cbr = [], [], {k: [] for k in closures}
        for nid in visible:
            row = make_row(nid, nodes[nid], cmap, subs)
            hits = membership[nid]
            if len(hits) == 0: cmain.append(row)
            elif len(hits) == 1: cbr[hits[0]].append(row)
            else: cconv.append(row)

        def narrative(rows):
            # BFS interleaves parallel branches; sort by numeric prefix for reading order.
            # Un-numbered rows inherit their BFS predecessor's number (+epsilon) so they
            # stay glued to their neighborhood instead of sinking to the end.
            keyed, last = [], 0.0
            for idx, r in enumerate(rows):
                if r.get("num") is not None: last = r["num"]
                keyed.append((last + idx * 1e-6, r))
            keyed.sort(key=lambda t: t[0])
            return [r for _, r in keyed]

        cmain, cconv = collapse(narrative(cmain)), collapse(narrative(cconv))
        cbr = {k: collapse(narrative(v)) for k, v in cbr.items()}
        ut = lambda rows: sum(1 for r in rows if r["kind"] == "userTask")
        allrows = cmain + cconv + [r for v in cbr.values() for r in v]
        stats = {"user_tasks": ut(allrows), "call_activities": len(allrows) - ut(allrows),
                 "census_matched": sum(1 for r in allrows if r.get("in_census")),
                 "main": len(cmain), "converged": len(cconv),
                 "branches": {k: len(v) for k, v in cbr.items()},
                 "unanchored": unanchored}
        out["urusans"][kod] = {"main": cmain, "branches": cbr, "converged": cconv, "stats": stats}
    out["summary"] = {k: v["stats"] for k, v in out["urusans"].items()}
    json.dump(out, open(ROOT / "build" / "journey_seq.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for k, s in out["summary"].items():
        print(f"{k:6} main={s.get('main',0):3} branches={s.get('branches',{})} converged={s.get('converged',0):3} "
              f"census={s.get('census_matched',0):3}/{s.get('user_tasks',0):3} unanchored={s.get('unanchored',[])}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
