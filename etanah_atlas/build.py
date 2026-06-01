"""One-command build. Reads SQL from source/, curation from config/, source from src/, writes HTML to project root.

Usage:
  python build.py                 # Build with melaka profile (default)
  python build.py --profile=trg   # Build for another state
  python build.py --sql=path/x.sql  # Parse a different SQL file
"""
import sys, pathlib, argparse

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "lib"))

from parse_schema import parse_sql  # type: ignore
import build_dataset    # type: ignore
import assemble_html    # type: ignore

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", default="melaka")
    ap.add_argument("--sql", default=None, help="Override SQL path (default: source/et_main_uat.sql)")
    args = ap.parse_args()

    src_sql = args.sql or (HERE / "source" / "et_main_uat.sql")
    build_dir = HERE / "build"
    build_dir.mkdir(exist_ok=True)

    print(f"[1/3] parse_schema  ← {src_sql}")
    parse_sql(str(src_sql), str(build_dir / "schema_parse.json"))

    print(f"[2/3] build_dataset ← profile={args.profile}")
    build_dataset.main(args.profile)

    print(f"[3/3] assemble_html")
    assemble_html.assemble(args.profile)

    print("Done.")

if __name__ == "__main__":
    main()
