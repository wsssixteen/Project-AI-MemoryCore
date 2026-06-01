"""Assemble the final HTML from src/* + build artifacts + curation mapping."""
import json, pathlib, sys

LIB = pathlib.Path(__file__).resolve().parent
ROOT = LIB.parent
SRC = ROOT / "src"
CONFIG = ROOT / "config"
BUILD = ROOT / "build"
# Output the shipped HTML inside the project folder so the parent project root
# stays clean (only the etanah_atlas/ folder is visible to the user).
# Output filename carries the profile suffix so multi-state builds don't collide:
# etanah_atlas_melaka.html, etanah_atlas_selangor.html, etc.
OUT_DIR = ROOT
NULL = "\x00"

def assemble(profile="melaka", output_name=None):
    if output_name is None:
        output_name = f"etanah_atlas_{profile}.html"
    dataset = (BUILD / "dataset.json").read_text(encoding="utf-8")
    mapping_path = CONFIG / f"mapping.{profile}.json"
    mapping = mapping_path.read_text(encoding="utf-8")
    json.loads(dataset)
    json.loads(mapping)

    css   = (SRC / "style.css").read_text(encoding="utf-8")
    shell = (SRC / "shell.html").read_text(encoding="utf-8")
    js    = (SRC / "app.js").read_text(encoding="utf-8")

    dataset_safe = dataset.replace("</script", "<\\/script")
    mapping_safe = mapping.replace("</script", "<\\/script")

    for n, c in [("css", css), ("shell", shell), ("js", js),
                 ("dataset", dataset_safe), ("mapping", mapping_safe)]:
        if NULL in c: raise SystemExit("FATAL: NULL byte in " + n)

    html = (shell
            .replace("/* CSS_HERE */", css)
            .replace("/* DATA_HERE */", dataset_safe)
            .replace("/* MAPPING_HERE */", mapping_safe)
            .replace("/* JS_HERE */", js))
    if NULL in html: raise SystemExit("FATAL: NULL byte in assembled HTML")

    out = OUT_DIR / output_name
    out.write_text(html, encoding="utf-8")
    if b"\x00" in out.read_bytes(): raise SystemExit("FATAL: written file has NULL bytes")
    print(f"  {out.name}: {out.stat().st_size:,} bytes, NULL-byte free")
    return out

if __name__ == "__main__":
    assemble(sys.argv[1] if len(sys.argv) > 1 else "melaka")
