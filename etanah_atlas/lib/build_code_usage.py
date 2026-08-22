"""Which DB tables does each module's CODE actually use? 5 independent detection methods,
unioned with per-method provenance. Output: build/code_usage.json
  M1 entity imports        (import my.gov.etanah.domain.*.X)
  M2 repository generics   (JpaRepository<X / QuerydslPredicateExecutor<X / ...Repository<X,)
  M3 QueryDSL Q-classes    (QX references)
  M4 HQL entity names      (FROM/JOIN X inside string literals)
  M5 native SQL literals   (known table names inside string literals)
Usage: python lib/build_code_usage.py"""
import json, pathlib, re, sys
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODULES = {
    "pelupusan": r"E:\Projects\Melaka\etanah-pelupusan\src\main",
    "common":    r"E:\Projects\Melaka\etanah-common\src\main",
    "awam":      r"E:\Projects\Melaka\etanah-awam\src\main",
    "spoc-hasil": r"E:\Projects\Melaka\etanah-spoc-hasil\src\main",
}

def main():
    reg = json.load(open(ROOT / "build" / "entity_registry.json", encoding="utf-8"))["entities"]
    simple_to_tables = defaultdict(set)
    fq_to_table = {}
    for fq, table in reg.items():
        simple_to_tables[fq.split(".")[-1]].add(table)
        fq_to_table[fq] = table
    schema = json.load(open(ROOT / "build" / "schema_parse.json", encoding="utf-8"))
    valid_tables = {t["name"] for t in schema["tables"]}
    table_word = re.compile(r"\b(" + "|".join(sorted(valid_tables, key=len, reverse=True)) + r")\b", re.IGNORECASE)
    string_lit = re.compile(r'"((?:[^"\\]|\\.)*)"')
    imp_re = re.compile(r"^import\s+(my\.gov\.etanah\.domain\.[\w.]+);", re.MULTILINE)
    repo_re = re.compile(r"(?:Repository|QuerydslPredicateExecutor|RevisionRepository)\s*<\s*([A-Z]\w+)\s*[,>]")
    q_re = re.compile(r"\bQ([A-Z]\w+)\b")
    hql_re = re.compile(r"(?i)\b(?:from|join)\s+([A-Z]\w+)\b")

    out = {}
    for mod, src in MODULES.items():
        srcp = pathlib.Path(src)
        if not srcp.exists():
            out[mod] = {"error": "src not found"}
            continue
        methods = {f"M{i}": defaultdict(set) for i in range(1, 8)}  # table -> set(files)
        for jr in srcp.rglob("*.jrxml"):
            try:
                jtext = jr.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
            for m in table_word.finditer(jtext):
                methods["M6"][m.group(1).lower()].add(str(jr.relative_to(srcp)))
        ov_file = ROOT / "config" / "usage_overrides.melaka.json"
        if ov_file.exists():
            ov = json.load(open(ov_file, encoding="utf-8"))
            for row in ov.get("add", {}).get(mod, []):
                methods["M7"][row["table"]].add("OVERRIDE: " + row["evidence"])
        files = list(srcp.rglob("*.java"))
        for f in files:
            try:
                text = f.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
            rel = str(f.relative_to(srcp))
            for m in imp_re.finditer(text):
                fq = m.group(1)
                if fq.endswith(".*"):
                    continue
                t = fq_to_table.get(fq)
                if t: methods["M1"][t].add(rel)
            for m in repo_re.finditer(text):
                for t in simple_to_tables.get(m.group(1), ()):
                    methods["M2"][t].add(rel)
            for m in q_re.finditer(text):
                for t in simple_to_tables.get(m.group(1), ()):
                    methods["M3"][t].add(rel)
            lits = string_lit.findall(text)
            big = "\n".join(l for l in lits if len(l) > 8)
            for m in hql_re.finditer(big):
                for t in simple_to_tables.get(m.group(1), ()):
                    methods["M4"][t].add(rel)
            for m in table_word.finditer(big):
                methods["M5"][m.group(1).lower()].add(rel)
        union = set()
        for mk in methods:
            union |= set(methods[mk].keys())
        out[mod] = {
            "files_scanned": len(files),
            "per_method_counts": {mk: len(methods[mk]) for mk in methods},
            "union_count": len(union),
            "tables": sorted(union),
            "provenance": {t: {mk: sorted(methods[mk][t])[:3] for mk in methods if t in methods[mk]} for t in sorted(union)},
        }
    json.dump(out, open(ROOT / "build" / "code_usage.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for mod, d in out.items():
        if "error" in d:
            print(mod, d["error"]); continue
        print(f"{mod}: files={d['files_scanned']} methods={d['per_method_counts']} union={d['union_count']}")

if __name__ == "__main__":
    main()
