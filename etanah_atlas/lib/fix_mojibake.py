"""One-shot data fix: undo utf-8-read-as-cp1252 mojibake stored as CODEPOINTS in config JSONs.
Pattern: U+00C0-U+00FF followed by 1-2 chars from the cp1252-C1 set -> re-encode cp1252, decode utf-8.
Run: python lib/fix_mojibake.py   (from etanah_atlas root or anywhere)"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
C1 = "".join(chr(c) for c in [0x20AC,0x201A,0x0192,0x201E,0x2026,0x2020,0x2021,0x02C6,0x2030,
                              0x0160,0x2039,0x0152,0x017D,0x2018,0x2019,0x201C,0x201D,0x2022,
                              0x2013,0x2014,0x02DC,0x2122,0x0161,0x203A,0x0153,0x017E,0x0178])
C1 = C1 + "".join(chr(c) for c in range(0xA0, 0xC0))
LEAD = "".join(chr(c) for c in range(0xC0, 0x100)) + chr(0xE2)
pat = re.compile("[" + re.escape(LEAD) + "][" + re.escape(C1) + "]{1,2}")

def demoji(m):
    s = m.group(0)
    for take in (3, 2):
        if len(s) >= take:
            try:
                return s[:take].encode("cp1252").decode("utf-8") + s[take:]
            except Exception:
                pass
    return s

def count_hits(text):
    return len(pat.findall(text))

if __name__ == "__main__":
    for name in ["mapping.melaka.json", "tugasan_tables.melaka.json", "implicit_links.melaka.json"]:
        p = ROOT / "config" / name
        if not p.exists():
            continue
        raw = p.read_text(encoding="utf-8")
        before = count_hits(raw)
        fixed = pat.sub(demoji, raw)
        fixed = pat.sub(demoji, fixed)
        json.loads(fixed)
        p.write_text(fixed, encoding="utf-8")
        print(f"{name}: {before} mojibake runs -> {count_hits(fixed)}")
