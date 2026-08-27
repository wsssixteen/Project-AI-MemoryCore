#!/usr/bin/env python3
"""Release build: rebuild EVERY state + the shareable bundle in one command.

Reads config/atlas_states.json. Melaka builds from its SQL dump (build.py); every other
state builds LIVE from its DB (build_state.py, needs config/states.<profile>.json).
Ends by rebuilding melaka LAST (so build/dataset.json = melaka for smoke/ship-check) and
zipping index.html + all state HTMLs into etanah_atlas_states.zip.

Usage: python build_all.py
A state whose live config is missing/unreachable is SKIPPED with a warning (its old HTML
stays); the bundle still builds from whatever HTMLs exist.
"""
import sys, json, subprocess, zipfile, pathlib

HERE = pathlib.Path(__file__).resolve().parent
STATES = json.load(open(HERE / "config" / "atlas_states.json", encoding="utf-8"))
PY = sys.executable


def run(args):
    return subprocess.run([PY] + args, cwd=str(HERE)).returncode


def main():
    built = ["index.html"]
    for s in STATES:
        pf, label = s["profile"], s["label"]
        if pf == "melaka":
            continue
        if not (HERE / "config" / f"states.{pf}.json").exists():
            print(f"SKIP {pf}: no config/states.{pf}.json");
            if (HERE / f"etanah_atlas_{pf}.html").exists(): built.append(f"etanah_atlas_{pf}.html")
            continue
        print(f"=== build_state {pf} ===")
        rc = run(["build_state.py", "--profile", pf, "--label", label])
        if rc == 0 and (HERE / f"etanah_atlas_{pf}.html").exists():
            built.append(f"etanah_atlas_{pf}.html")
        else:
            print(f"WARN {pf} build failed (rc={rc}); keeping any existing HTML")
            if (HERE / f"etanah_atlas_{pf}.html").exists(): built.append(f"etanah_atlas_{pf}.html")

    print("=== build melaka (canonical, last) ===")
    run(["build.py"])
    built.insert(1, "etanah_atlas_melaka.html")

    zp = HERE / "etanah_atlas_states.zip"
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
        for f in built:
            p = HERE / f
            if p.exists(): z.write(p, p.name)
    print(f"\nBundle: {zp.name} ({zp.stat().st_size:,} bytes) — {len(built)} files")
    print("Verify: python lib/audit_states.py  &&  node lib/smoke_test.js  &&  python lib/ship_check.py")


if __name__ == "__main__":
    main()
