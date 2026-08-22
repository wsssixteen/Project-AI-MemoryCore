"""Adversarial verifier for build/code_usage.json (independent of the scanner's regexes).
For sampled POSITIVES: demand at least one plain-substring evidence (entity simple name or
table literal) in the module source. For sampled NEGATIVES: demand the absence of all of them.
Usage: python lib/verify_code_usage.py <module> <seed> [sample_n]"""
import json, pathlib, random, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = {
    "pelupusan": pathlib.Path(r"E:\Projects\Melaka\etanah-pelupusan\src\main"),
    "common": pathlib.Path(r"E:\Projects\Melaka\etanah-common\src\main"),
    "awam": pathlib.Path(r"E:\Projects\Melaka\etanah-awam\src\main"),
    "spoc-hasil": pathlib.Path(r"E:\Projects\Melaka\etanah-spoc-hasil\src\main"),
}

def main(module, seed, sample_n=15):
    cu = json.load(open(ROOT / "build" / "code_usage.json", encoding="utf-8"))
    reg = json.load(open(ROOT / "build" / "entity_registry.json", encoding="utf-8"))["entities"]
    t2e = {}
    for fq, t in reg.items():
        t2e.setdefault(t, []).append(fq.split(".")[-1])
    schema = json.load(open(ROOT / "build" / "schema_parse.json", encoding="utf-8"))
    allt = {t["name"] for t in schema["tables"]}
    pos_set = set(cu[module]["tables"])
    rng = random.Random(seed)
    pos = rng.sample(sorted(pos_set), min(sample_n, len(pos_set)))
    neg = rng.sample(sorted(allt - pos_set), sample_n)

    corpus = []
    for f in SRC[module].rglob("*.java"):
        try:
            corpus.append((str(f), f.read_text(encoding="utf-8", errors="replace")))
        except Exception:
            pass

    def find_evidence(t):
        ents = t2e.get(t, [])
        needles = [t] + ents + ["Q" + e for e in ents]
        for path, text in corpus:
            for n in needles:
                i = text.find(n)
                while i != -1:
                    before = text[i-1] if i > 0 else " "
                    after = text[i+len(n)] if i+len(n) < len(text) else " "
                    if not (before.isalnum() or before == "_") and not (after.isalnum() or after == "_"):
                        return (path, n)
                    i = text.find(n, i+1)
        return None

    fails = []
    for t in pos:
        ev = find_evidence(t)
        if not ev:
            fails.append(("POS-no-evidence", t))
    for t in neg:
        ev = find_evidence(t)
        if ev:
            fails.append(("NEG-evidence-exists", t, ev[0].split("\\")[-1], ev[1]))
    print(f"[{module} seed={seed}] {len(pos)} positives + {len(neg)} negatives · failures: {len(fails)}")
    for f in fails:
        print("  ", f)
    return len(fails)

if __name__ == "__main__":
    sys.exit(0 if main(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]) if len(sys.argv) > 3 else 15) == 0 else 1)
