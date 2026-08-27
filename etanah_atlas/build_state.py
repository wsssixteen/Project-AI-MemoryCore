#!/usr/bin/env python3
"""One-command multi-state build: live schema pull -> mapping (auto v1 if absent)
-> dataset -> HTML. Writes etanah_atlas_<state>.html.

Usage:
  python build_state.py --profile selangor --label Selangor
  python build_state.py --profile terengganu --label Terengganu

Melaka keeps its own build.py (SQL-dump path + full curation). This is the
live-DB path for the other states.
"""
import sys, argparse, pathlib
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "lib"))
import pull_schema_live, make_state_mapping, pull_census_live, build_dataset, assemble_html  # type: ignore


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", required=True)
    ap.add_argument("--label", required=True)
    a = ap.parse_args()
    print(f"[1/4] pull_schema_live  {a.profile}")
    pull_schema_live.build(a.profile)
    mp = HERE / "config" / f"mapping.{a.profile}.json"
    if not mp.exists():
        print(f"[2/4] make_state_mapping {a.profile} (v1 auto)")
        make_state_mapping.main(a.profile, a.label)
    else:
        print(f"[2/4] mapping.{a.profile}.json exists — kept")
    print(f"[2b] pull_census_live    {a.profile}")
    try:
        pull_census_live.main(a.profile)
    except Exception as e:
        print(f"WARN: census skipped ({e}) — By-Urusan empty for this state")
    print(f"[3/4] build_dataset      {a.profile}")
    build_dataset.main(a.profile)
    print(f"[4/4] assemble_html      {a.profile}")
    assemble_html.assemble(a.profile)
    print(f"Done -> etanah_atlas_{a.profile}.html")


if __name__ == "__main__":
    main()
