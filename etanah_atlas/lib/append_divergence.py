#!/usr/bin/env python3
"""Append §7 (full table-set divergence vs Melaka) to each state's DATABASE.md.
Complete divergence catalog: every Melaka-only and state-only table (junk-filtered),
plus the detected systematic abbreviation pattern (WP spells out mklmt/tgsn/tnh).
Run after gen_state_knowledge.py. Live-pulled, nothing assumed.
"""
import json, sys, pathlib, re
LIB = pathlib.Path(__file__).resolve().parent
ROOT = LIB.parent
KB = pathlib.Path(r"C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\projects\coding-projects\active\etanah-knowledge")

ABBR = [("mklmt", "maklumat"), ("tgsn", "tugasan"), ("tnh", "tanah"), ("hkmlk", "hakmilik"),
        ("bkptg", "berkepentingan"), ("ursn", "urusan"), ("btrn", "butiran"), ("kmskn", "kemasukan")]
JUNK = re.compile(r"(_bak|_masked|_mask|backup|_cutover|_tmp|_old|_delete|migrator|_20\d\d|_yep|_fake|"
                  r"_denda2022|^aaa|^abc|^bbbb|^bil$|^bil_|dr\$|_bck|_ssi$|^mig_|^gt_|_delta$|_mview)")


def names(pf):
    if pf == "melaka":
        cj = json.load(open(r"C:\Users\Ridhwan\.claude.json", encoding="utf-8"))["mcpServers"]["postgres-mlit-pg"]["env"]
        import psycopg2
        c = psycopg2.connect(host=cj["PGHOST"], port=int(cj["PGPORT"]), dbname=cj["PGDATABASE"], user=cj["PGUSER"], password=cj["PGPASSWORD"], connect_timeout=12)
        cur = c.cursor(); cur.execute("SELECT lower(table_name) FROM information_schema.tables WHERE table_schema='et_main_mlit' AND table_type='BASE TABLE'")
        r = {x[0] for x in cur.fetchall()}; c.close(); return r
    cfg = json.load(open(ROOT / "config" / f"states.{pf}.json", encoding="utf-8"))["connection"]
    if cfg["engine"] == "postgres":
        import psycopg2
        c = psycopg2.connect(host=cfg["host"], port=cfg["port"], dbname=cfg["database"].split("?")[0], user=cfg["user"], password=cfg["password"], connect_timeout=12)
        cur = c.cursor(); cur.execute("SELECT lower(table_name) FROM information_schema.tables WHERE table_schema=%s AND table_type='BASE TABLE'", (cfg["schema"],))
        r = {x[0] for x in cur.fetchall()}; c.close(); return r
    import oracledb
    c = oracledb.connect(user=cfg["user"], password=cfg["password"], dsn=f"{cfg['host']}:{cfg['port']}/{cfg['database']}")
    cur = c.cursor(); cur.execute("SELECT lower(table_name) FROM all_tables WHERE owner=:o", o=cfg["schema"].upper())
    r = {x[0] for x in cur.fetchall()}; c.close(); return r


def main(states):
    mel = names("melaka")
    for pf, label in states:
        s = names(pf)
        missing = sorted(x for x in (mel - s) if not JUNK.search(x))
        extra = sorted(x for x in (s - mel) if not JUNK.search(x))
        # detect abbreviation-expansion: a Melaka-missing table whose spelled-out form is in state
        expanded = []
        for m in missing:
            e = m
            for ab, full in ABBR:
                e = re.sub(rf"(^|_){ab}(_|$)", rf"\1{full}\2", e)
            if e != m and e in s:
                expanded.append((m, e))
        exp_set = {m for m, _ in expanded}
        true_missing = [m for m in missing if m not in exp_set]

        L = ["", "## 7. Full divergence from Melaka (complete table diff, live)", ""]
        L.append(f"Melaka {len(mel)} tables vs {label} {len(s)} tables. Junk (backup/dated/scratch/text-index) excluded.")
        L.append("")
        if expanded:
            L.append(f"### 7a. Systematic abbreviation expansion ({len(expanded)}) — same table, spelled-out name")
            L.append("")
            L.append("| Melaka (abbreviated) | This state (spelled out) |")
            L.append("|---|---|")
            for m, e in expanded:
                L.append(f"| `{m}` | `{e}` |")
            L.append("")
        L.append(f"### 7b. Genuinely absent in {label} ({len(true_missing)}) — in Melaka, no equivalent here")
        L.append("")
        L.append(", ".join(f"`{m}`" for m in true_missing) or "_none_")
        L.append("")
        L.append(f"### 7c. Extra in {label} ({len(extra)}) — not in Melaka")
        L.append("")
        L.append(", ".join(f"`{e}`" for e in extra) or "_none_")
        L.append("")

        p = KB / pf / "DATABASE.md"
        if p.exists():
            txt = p.read_text(encoding="utf-8")
            txt = re.split(r"\n## 7\. Full divergence", txt)[0].rstrip()  # replace if already appended
            p.write_text(txt + "\n" + "\n".join(L), encoding="utf-8")
            print(f"[divergence] {label}: {len(expanded)} abbrev-expanded · {len(true_missing)} truly-absent · {len(extra)} extra -> §7 appended")


if __name__ == "__main__":
    main([("selangor", "Selangor"), ("perak", "Perak"), ("terengganu", "Terengganu"), ("wp", "WP Kuala Lumpur")])
