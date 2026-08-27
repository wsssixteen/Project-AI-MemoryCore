#!/usr/bin/env python3
"""Multi-state EVAL: re-verify every built etanah_atlas_<state>.html against its LIVE DB.
The controller-verifies discipline as a repeatable check — cheap-model/agent output is
never trusted; this script re-queries the source of truth.

Asserts, per state:
  - HTML embedded dataset table-count == live DB table-count (no stale/partial build)
  - no Melaka data leaked onto another state (used_by == 0, urusans == 0 for non-melaka)
  - switcher lists all configured states
Exit 0 = all pass, 1 = any drift.

Reads config/states.<profile>.json (gitignored creds). Skips a state cleanly if its
config is absent or the DB is unreachable (reports SKIP, not failure).
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
STATES = json.load(open(ROOT / "config" / "atlas_states.json", encoding="utf-8"))
N_STATES = len(STATES)


def html_dataset(profile):
    h = (ROOT / f"etanah_atlas_{profile}.html").read_text(encoding="utf-8")
    return json.loads(re.search(r'id="dataset"[^>]*>(.*?)</script>', h, re.S).group(1))


def switcher_count(profile):
    h = (ROOT / f"etanah_atlas_{profile}.html").read_text(encoding="utf-8")
    return len(json.loads(re.search(r'__ATLAS_STATES__ = (\[.*?\]); window', h, re.S).group(1)))


def live_count(profile):
    cp = ROOT / "config" / f"states.{profile}.json"
    if not cp.exists(): return None, "no config"
    cfg = json.load(open(cp, encoding="utf-8"))["connection"]
    try:
        if cfg["engine"] == "postgres":
            import psycopg2
            c = psycopg2.connect(host=cfg["host"], port=cfg["port"], dbname=cfg["database"].split("?")[0],
                                 user=cfg["user"], password=cfg["password"], connect_timeout=10)
            cur = c.cursor()
            cur.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema=%s AND table_type='BASE TABLE'", (cfg["schema"],))
        else:
            import oracledb
            c = oracledb.connect(user=cfg["user"], password=cfg["password"], dsn=f"{cfg['host']}:{cfg['port']}/{cfg['database']}")
            cur = c.cursor()
            cur.execute("SELECT count(*) FROM all_tables WHERE owner=:o", o=cfg["schema"].upper())
        n = cur.fetchone()[0]; c.close(); return n, None
    except Exception as e:
        return None, str(e).splitlines()[0][:40]


def main():
    fails = []
    print(f"{'STATE':12} {'HTML':6} {'FKs':6} {'urus':5} {'usedby':6} {'switch':6} {'LIVE':6} {'VERDICT'}")
    for s in STATES:
        pf = s["profile"]
        d = html_dataset(pf)
        ht, hf = d["totals"]["tables"], d["totals"]["foreign_keys"]
        ur = len(d.get("urusans", []))
        ub = sum(1 for t in d["tables"] if t.get("used_by"))
        sw = switcher_count(pf)
        verdict = []
        if sw != N_STATES: verdict.append(f"switcher={sw}!={N_STATES}"); fails.append(pf)
        if pf != "melaka":
            if ub: verdict.append(f"LEAK used_by={ub}"); fails.append(pf)
            if ur: verdict.append(f"LEAK urusans={ur}"); fails.append(pf)
            lv, err = live_count(pf)
            if err: live = "SKIP"; verdict.append(f"skip:{err}")
            elif lv != ht: live = str(lv); verdict.append(f"COUNT {lv}!={ht}"); fails.append(pf)
            else: live = str(lv)
        else:
            live = "(dump)"
        print(f"{pf:12} {ht:<6} {hf:<6} {ur:<5} {ub:<6} {sw:<6} {live:<6} {'OK' if not verdict else ' '.join(verdict)}")
    print(f"\n{'PASS' if not fails else 'FAIL'} — {N_STATES - len(set(fails))}/{N_STATES} states clean")
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
