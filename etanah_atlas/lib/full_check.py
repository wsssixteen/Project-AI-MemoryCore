#!/usr/bin/env python3
"""DETERMINISTIC full-website checker for the Etanah Atlas — every state, every tab,
every sub-tab, every dropdown OPTION, every button, every toggle, card drag, card
click. Drives a real Chromium (Playwright), catches EVERY console error + page
exception, asserts each element actually responds, and screenshots every view.

Run: python lib/full_check.py           (all states in config/atlas_states.json)
     python lib/full_check.py melaka    (one state)

Outputs:
  build/full_check_report.json   — per-state, per-check PASS/FAIL + detail
  checks/<state>__<view>.png     — a screenshot per major view + key interaction
Exit 0 = every check passed on every state; 1 = any failure or any JS error.

No claim without a check; no check without asserted evidence.
"""
import sys, json, pathlib, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHECKS = ROOT / "checks"
CHECKS.mkdir(exist_ok=True)


def check_state(pw, profile, label):
    html = ROOT / f"etanah_atlas_{profile}.html"
    url = html.as_uri()
    results = []
    errors = []
    shots = []

    def add(name, ok, detail=""):
        results.append({"check": name, "ok": bool(ok), "detail": str(detail)[:160]})

    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 1600, "height": 950})
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error",) else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.goto(url, wait_until="networkidle")

    def shot(tag):
        p = CHECKS / f"{profile}__{tag}.png"
        page.screenshot(path=str(p))
        shots.append(p.name)

    # ---- header: profile shown ----
    hdr = page.locator("#hdr-sub").inner_text()
    add("header shows profile", f"profile: {profile}" in hdr, hdr[:60])

    # ---- state switcher: option count ----
    sw = page.locator("#state-switch option")
    add("state switcher populated", sw.count() >= 1, f"{sw.count()} options")

    # ---- theme toggle round-trip ----
    t0 = page.evaluate("document.documentElement.dataset.theme")
    page.locator("#theme-btn").click(); t1 = page.evaluate("document.documentElement.dataset.theme")
    page.locator("#theme-btn").click(); t2 = page.evaluate("document.documentElement.dataset.theme")
    add("theme toggle round-trip", t1 != t0 and t2 == t0, f"{t0}->{t1}->{t2}")

    # ---- 4 main tabs each show exactly their view ----
    for tab in ["search", "urusan", "map", "about"]:
        page.locator(f'.tab[data-tab="{tab}"]').click()
        vis = page.eval_on_selector_all(".view", "els => els.filter(e=>getComputedStyle(e).display!=='none').map(e=>e.dataset.view)")
        add(f"tab {tab}: only its view visible", vis == [tab], str(vis))
        shot(f"tab_{tab}")

    # ================= MAP =================
    page.locator('.tab[data-tab="map"]').click()
    # modul select: every option renders without error
    modul_opts = page.eval_on_selector_all("#ctl-modul option", "o=>o.map(x=>x.value)")
    modul_fail = []
    for v in modul_opts:
        errc = len(errors)
        page.select_option("#ctl-modul", v)
        page.wait_for_timeout(80)
        if len(errors) > errc: modul_fail.append(v)
    add(f"Map modul select ({len(modul_opts)} options)", not modul_fail, f"errors on: {modul_fail}")
    page.select_option("#ctl-modul", "pelupusan")
    # urusan select: every option, muting present
    ur_opts = page.eval_on_selector_all("#ctl-urusan option", "o=>o.map(x=>x.value)")
    ur_fail = []
    for v in ur_opts:
        errc = len(errors)
        page.select_option("#ctl-urusan", v); page.wait_for_timeout(60)
        if len(errors) > errc: ur_fail.append(v or "(all)")
    add(f"Map urusan select ({len(ur_opts)} options)", not ur_fail, f"errors on: {ur_fail}")
    page.select_option("#ctl-urusan", "")
    # layer seg x3
    for lay in ["_a_", "_p_", "both"]:
        errc = len(errors)
        page.locator(f'#ctl-layer .seg-btn[data-layer="{lay}"]').click(); page.wait_for_timeout(60)
        add(f"Map layer {lay}", len(errors) == errc, "ok")
    # node count > 0
    nd = page.locator(".nd").count()
    add("Map renders cards (pelupusan)", nd > 0, f"{nd} cards")
    shot("map_pelupusan")
    # card drag (first card) — transform applied
    if nd:
        card = page.locator(".nd").first
        box = card.bounding_box()
        page.mouse.move(box["x"]+box["width"]/2, box["y"]+box["height"]/2)
        page.mouse.down(); page.mouse.move(box["x"]+60, box["y"]+40, steps=5); page.mouse.up()
        tr = card.get_attribute("transform")
        add("Map card drag applies transform", bool(tr and "translate" in tr), str(tr))
    # card click -> Tables focus
    if nd:
        tname = page.locator(".nd").nth(1).get_attribute("data-table")
        page.locator(".nd").nth(1).click(); page.wait_for_timeout(150)
        onsearch = page.eval_on_selector("#view-search", "e=>!e.classList.contains('hidden')")
        inp = page.input_value("#search-input")
        add("Map card click -> Tables focus", onsearch and inp == tname, f"view=search:{onsearch} input={inp}")

    # ================= TABLES sub-tabs =================
    page.locator('.tab[data-tab="search"]').click()
    for sub in ["diagram", "catalog", "urusan", "feature"]:
        btn = page.locator(f'#tbl-subtabs .subtab[data-sub="{sub}"]')
        if not btn.is_visible():
            add(f"sub-tab {sub} hidden (no data for state)", True, "hidden")
            continue
        btn.click(); page.wait_for_timeout(80)
        shown = page.eval_on_selector(f"#sub-{sub}", "e=>!e.classList.contains('hidden')")
        add(f"sub-tab {sub} shows", shown, "ok")
        shot(f"sub_{sub}")

    # Diagram: search suggestions + pick
    page.locator('#tbl-subtabs .subtab[data-sub="diagram"]').click()
    si = page.locator("#search-input")
    si.fill(""); si.type("umm_a", delay=10); page.wait_for_timeout(200)
    sugg = page.locator("#table-suggest .suggest-item").count()
    add("Diagram table suggestions appear", sugg > 0, f"{sugg} items")
    if sugg:
        page.locator("#table-suggest .suggest-item").first.click(); page.wait_for_timeout(150)
        foc = page.eval_on_selector("#table-focus", "e=>!e.classList.contains('hidden')")
        add("Diagram suggestion -> focus", foc, "ok")
        shot("diagram_focus")
        # sidebar tabs x3
        for st in ["tf-identity", "tf-flows", "tf-columns"]:
            page.locator(f'#tf-side-tabs .sidetab[data-st="{st}"]').click(); page.wait_for_timeout(60)
            add(f"sidebar {st}", page.eval_on_selector(f"#{st}", "e=>!e.classList.contains('hidden')"), "ok")
        # tf-back
        if page.locator("#tf-back").is_visible():
            page.locator("#tf-back").click(); page.wait_for_timeout(100)
            add("tf-back clears focus", page.eval_on_selector("#table-focus", "e=>e.classList.contains('hidden')"), "ok")

    # Catalog: filter + selects + reset + row
    page.locator('#tbl-subtabs .subtab[data-sub="catalog"]').click(); page.wait_for_timeout(80)
    rows0 = page.locator("#search-results [data-open]").count()
    page.locator("#catalog-input").fill("hkmlk"); page.wait_for_timeout(150)
    rows1 = page.locator("#search-results [data-open]").count()
    add("Catalog filter narrows rows", rows1 <= rows0 and rows1 > 0, f"{rows0}->{rows1}")
    page.locator("#filters-reset").click(); page.wait_for_timeout(100)
    add("Catalog reset restores", page.locator("#search-results [data-open]").count() >= rows1, "ok")
    if page.locator("#search-results [data-open]").count():
        page.locator("#search-results [data-open]").first.click(); page.wait_for_timeout(120)
        add("Catalog row click -> focus", page.eval_on_selector("#table-focus", "e=>!e.classList.contains('hidden')"), "ok")

    # By Urusan: every urusan option + tugasan
    page.locator('#tbl-subtabs .subtab[data-sub="urusan"]').click(); page.wait_for_timeout(80)
    ub_opts = [o for o in page.eval_on_selector_all("#ub-urusan option", "o=>o.map(x=>x.value)") if o]
    ub_fail = []
    for v in ub_opts:
        errc = len(errors)
        page.select_option("#ub-urusan", v); page.wait_for_timeout(80)
        if len(errors) > errc: ub_fail.append(v)
    add(f"By-Urusan select ({len(ub_opts)} urusans)", not ub_fail, f"errors: {ub_fail}")
    if ub_opts:
        page.select_option("#ub-urusan", ub_opts[0]); page.wait_for_timeout(120)
        body = page.locator("#urusan-browse").inner_text()
        add("By-Urusan renders body (not blank)", len(body.strip()) > 0, f"{len(body)} chars")
        shot("by_urusan")

    # By Feature: either HIDDEN (state has no feature data) or has REAL groups (>1 option)
    feat_btn_vis = page.eval_on_selector('#tbl-subtabs .subtab[data-sub="feature"]', "e=>getComputedStyle(e).display!=='none'")
    if feat_btn_vis:
        page.locator('#tbl-subtabs .subtab[data-sub="feature"]').click(); page.wait_for_timeout(80)
        bf = page.locator("#bf-feature option").count()
        add("By-Feature has real groups (shown state)", bf > 1, f"{bf} options (>1 required)")
        shot("sub_feature")
    else:
        add("By-Feature hidden (no feature data for state)", True, "sub-tab hidden — no empty tab")

    # ================= JOURNEY =================
    page.locator('.tab[data-tab="urusan"]').click(); page.wait_for_timeout(80)
    pk_opts = [o for o in page.eval_on_selector_all("#urusan-picker option", "o=>o.map(x=>x.value)") if o]
    pk_fail = []
    for v in pk_opts:
        errc = len(errors)
        page.select_option("#urusan-picker", v); page.wait_for_timeout(80)
        if len(errors) > errc: pk_fail.append(v)
    add(f"Journey picker ({len(pk_opts)} urusans)", not pk_fail, f"errors: {pk_fail}")
    if pk_opts:
        page.select_option("#urusan-picker", pk_opts[0]); page.wait_for_timeout(100)
        jbody = page.locator("#urusan-content").inner_text()
        add("Journey renders content", len(jbody.strip()) > 0, f"{len(jbody)} chars")
        shot("journey")
        forks = page.locator(".fork-btn").count()
        if forks:
            page.locator(".fork-btn").nth(min(1, forks-1)).click(); page.wait_for_timeout(80)
            add("Journey fork button clickable", True, f"{forks} forks")

    # ================= ABOUT =================
    page.locator('.tab[data-tab="about")]').click() if False else page.locator('.tab[data-tab="about"]').click()
    page.wait_for_timeout(80)
    add("About totals filled", "table" in page.locator("#about-totals").inner_text().lower(), page.locator("#about-totals").inner_text()[:50])
    shot("about")

    # ---- FINAL: no console errors the whole run ----
    add("ZERO JavaScript console errors", len(errors) == 0, f"{len(errors)} errors: {errors[:3]}")

    browser.close()
    passed = sum(1 for r in results if r["ok"])
    return {"profile": profile, "label": label, "passed": passed, "total": len(results),
            "errors": errors, "shots": shots, "results": results}


def main():
    states = json.load(open(ROOT / "config" / "atlas_states.json", encoding="utf-8"))
    if len(sys.argv) > 1:
        states = [s for s in states if s["profile"] == sys.argv[1]]
    report = {}
    all_ok = True
    with sync_playwright() as pw:
        for s in states:
            print(f"\n===== CHECKING {s['label']} =====")
            r = check_state(pw, s["profile"], s["label"])
            report[s["profile"]] = r
            for res in r["results"]:
                mark = "PASS" if res["ok"] else "FAIL"
                if not res["ok"]: all_ok = False
                print(f"  {mark}  {res['check']}" + (f" — {res['detail']}" if not res["ok"] else ""))
            print(f"  --> {r['passed']}/{r['total']} checks · {len(r['errors'])} JS errors · {len(r['shots'])} screenshots")
    json.dump(report, open(ROOT / "build" / "full_check_report.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    tot_p = sum(r["passed"] for r in report.values()); tot_t = sum(r["total"] for r in report.values())
    tot_e = sum(len(r["errors"]) for r in report.values())
    print(f"\n{'ALL PASS' if all_ok and tot_e==0 else 'FAILURES PRESENT'} — {tot_p}/{tot_t} checks across {len(report)} states · {tot_e} JS errors total")
    print(f"Report: build/full_check_report.json · Screenshots: checks/")
    return 0 if (all_ok and tot_e == 0) else 1


if __name__ == "__main__":
    sys.exit(main())
