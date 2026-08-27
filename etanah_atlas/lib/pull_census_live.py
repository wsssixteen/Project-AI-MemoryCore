#!/usr/bin/env python3
"""Pull a state's LIVE tugasan census (ind_ursn -> ind_tgsn -> ind_langkah -> ind_skrin)
into build/tugasan_census.<profile>.json AND inject a real urusan list into
config/mapping.<profile>.json. Makes the By-Urusan sub-tab live per state.

Pure SQL — no BPMN parsing. Scoped to the Pelupusan urusan kods that exist in the state.
Skips cleanly if the state has no IND_TGSN (e.g. WP's divergent schema).

Usage: python lib/pull_census_live.py --profile selangor
"""
import json, sys, argparse, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PLP_URUSANS = ["PT","PLPS","PRZ","MLPS","BPRZ","PSBS","PPJK","PLTP","PRBB","PRU","PPTPB","MCL","RPPLP"]


def _pg(cfg, sql, params=()):
    import psycopg2
    c = psycopg2.connect(host=cfg["host"], port=cfg["port"], dbname=cfg["database"].split("?")[0],
                         user=cfg["user"], password=cfg["password"], connect_timeout=15)
    cur = c.cursor(); cur.execute(sql, params); rows = cur.fetchall(); c.close(); return rows


def _ora(cfg, sql, params=None):
    import oracledb
    c = oracledb.connect(user=cfg["user"], password=cfg["password"], dsn=f"{cfg['host']}:{cfg['port']}/{cfg['database']}")
    cur = c.cursor(); cur.execute(sql, params or {}); rows = cur.fetchall(); c.close(); return rows


def main(profile):
    cfg = json.load(open(ROOT / "config" / f"states.{profile}.json", encoding="utf-8"))["connection"]
    pg = cfg["engine"] == "postgres"
    sch = cfg["schema"] if pg else cfg["schema"].upper()
    q = (lambda s, p=(): _pg(cfg, s, p)) if pg else (lambda s, p=None: _ora(cfg, s, p))
    Q = (lambda t: f"{sch}.{t}")  # schema-qualified table ref

    # RESOLVE the tugasan-definition table name PER STATE — never assume. Melaka/SEL/PRK/
    # TRG abbreviate 'ind_tgsn'; WP spells it 'ind_tugasan' (older schema generation).
    # The langkah FK column follows: tgsn_id vs tugasan_id.
    def tbl_exists(name):
        if pg:
            return bool(q(f"SELECT 1 FROM information_schema.tables WHERE table_schema=%s AND table_name=%s", (sch, name.lower())))
        return bool(q("SELECT 1 FROM all_tables WHERE owner=:o AND table_name=:t", {"o": sch, "t": name.upper()}))
    def col_exists(tbl, col):
        if pg:
            return bool(q(f"SELECT 1 FROM information_schema.columns WHERE table_schema=%s AND table_name=%s AND column_name=%s", (sch, tbl.lower(), col.lower())))
        return bool(q("SELECT 1 FROM all_tab_columns WHERE owner=:o AND table_name=:t AND column_name=:c", {"o": sch, "t": tbl.upper(), "c": col.upper()}))

    tgsn_tbl = "ind_tgsn" if tbl_exists("ind_tgsn") else ("ind_tugasan" if tbl_exists("ind_tugasan") else None)
    if not tgsn_tbl:
        print(f"[census] {profile}: no ind_tgsn / ind_tugasan — genuinely absent", file=sys.stderr)
        return
    tgsn_col = "tgsn_id" if col_exists("ind_langkah", "tgsn_id") else ("tugasan_id" if col_exists("ind_langkah", "tugasan_id") else "tgsn_id")
    tgsn_pk = "tgsn_id" if col_exists(tgsn_tbl, "tgsn_id") else "tugasan_id"
    ursn_fk = "ursn_id" if col_exists(tgsn_tbl, "ursn_id") else ("urusan_id" if col_exists(tgsn_tbl, "urusan_id") else "ursn_id")
    print(f"[census] {profile}: tugasan table='{tgsn_tbl}' pk='{tgsn_pk}' langkah_fk='{tgsn_col}' ursn_fk='{ursn_fk}'", file=sys.stderr)

    inlist = ",".join(f"'{u}'" for u in PLP_URUSANS)
    T = (lambda t: f"{sch}.{t}")
    if pg:
        trows = q(f"""SELECT lower(u.kod), t.kod, t.nama, t.peranan, t.turutan, t.{tgsn_pk}
                      FROM {T(tgsn_tbl)} t JOIN {T("ind_ursn")} u ON u.ursn_id=t.{ursn_fk}
                      WHERE u.kod IN ({inlist}) AND (t.flag_aktif='Y' OR t.flag_aktif IS NULL)""")
        lrows = q(f"""SELECT l.{tgsn_col}, l.turutan, l.kod, l.nama, s.jsf_view, s.nama_aplikasi
                      FROM {T('ind_langkah')} l JOIN {T('ind_skrin')} s ON s.skrin_id=l.skrin_id
                      WHERE (l.flag_aktif='Y' OR l.flag_aktif IS NULL)""")
    else:
        trows = q(f"""SELECT lower(u.kod), t.kod, t.nama, t.peranan, t.turutan, t.{tgsn_pk}
                      FROM {T(tgsn_tbl.upper())} t JOIN {T("IND_URSN")} u ON u.ursn_id=t.{ursn_fk}
                      WHERE u.kod IN ({inlist}) AND (t.flag_aktif='Y' OR t.flag_aktif IS NULL)""")
        lrows = q(f"""SELECT l.{tgsn_col}, l.turutan, l.kod, l.nama, s.jsf_view, s.nama_aplikasi
                      FROM {T('IND_LANGKAH')} l JOIN {T('IND_SKRIN')} s ON s.skrin_id=l.skrin_id
                      WHERE (l.flag_aktif='Y' OR l.flag_aktif IS NULL)""")

    langkah_by_tgsn = {}
    for tgsn_id, turut, lkod, lnama, jsf, app in lrows:
        langkah_by_tgsn.setdefault(tgsn_id, []).append(
            {"jsf": jsf or "", "app": app or "", "turutan": float(turut) if turut is not None else 0, "kod": lkod, "nama": lnama})

    tugasans = []
    for ukod, tkod, tnama, per, turut, tgsn_id in trows:
        scr = sorted(langkah_by_tgsn.get(tgsn_id, []), key=lambda x: x["turutan"])
        tugasans.append({
            "urusan": (ukod or "").upper(), "kod": tkod, "name": tnama, "peranan": per,
            "turutan": float(turut) if turut is not None else 0,
            "screens": [{"jsf": s["jsf"], "app": s["app"]} for s in scr],
        })
    tugasans.sort(key=lambda t: (t["urusan"], t["turutan"], t["kod"] or ""))

    census = {"generated": f"live:{profile}", "source": cfg["host"] + "/" + cfg["schema"], "tugasans": tugasans}
    (ROOT / "build").mkdir(exist_ok=True)
    json.dump(census, open(ROOT / "build" / f"tugasan_census.{profile}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # inject a real urusan list into the mapping (kod + name; stages empty — By-Urusan
    # census drives the sub-tab; Journey shows the urusan set honestly)
    per_ursn = {}
    for t in tugasans:
        per_ursn.setdefault(t["urusan"], 0)
        per_ursn[t["urusan"]] += 1
    ur_names = {}
    for ukod, tkod, tnama, per, turut, tgsn_id in trows:
        ur_names[(ukod or "").upper()] = ur_names.get((ukod or "").upper())
    # names from ind_ursn
    if pg:
        nm = q(f"SELECT kod, nama FROM {Q('ind_ursn')} WHERE kod IN ({inlist})")
    else:
        nm = q(f"SELECT kod, nama FROM {Q('IND_URSN')} WHERE kod IN ({inlist})")
    name_of = {k: v for k, v in nm}
    mp = ROOT / "config" / f"mapping.{profile}.json"
    mapping = json.load(open(mp, encoding="utf-8"))
    mapping["urusans"] = [
        {"kod": u, "name": name_of.get(u, u), "english": "", "section": "", "modul": "pelupusan",
         "description": f"{name_of.get(u, u)} — {per_ursn.get(u,0)} tugasan (live census; workflow stages pending BPMN curation).",
         "stages": [], "census_only": True}
        for u in PLP_URUSANS if u in per_ursn
    ]
    json.dump(mapping, open(mp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"[census] {profile}: {len(tugasans)} tugasans · {len(mapping['urusans'])} urusans -> "
          f"tugasan_census.{profile}.json + mapping urusans", file=sys.stderr)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--profile", required=True)
    main(ap.parse_args().profile)
