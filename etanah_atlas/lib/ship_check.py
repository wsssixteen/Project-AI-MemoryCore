"""Ship-check for the Atlas deliverable — the ONLY thing that satisfies atlas-ship-gate.
1. Runs the headless smoke test (node lib/smoke_test.js) — must exit 0.
2. Renders the CURRENT etanah_atlas_melaka.html via headless Edge over file://
   (the exact way miya opens it) and asserts a real screenshot came back.
3. Writes build/ship_check.json keyed to the HTML's sha256.
Usage: python lib/ship_check.py   (from etanah_atlas/ or anywhere)"""
import hashlib, json, pathlib, shutil, subprocess, sys, tempfile, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
EDGE = pathlib.Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
HTML = ROOT / "etanah_atlas_melaka.html"

def main():
    if not HTML.exists():
        print("FAIL: deliverable HTML missing"); return 1
    sha = hashlib.sha256(HTML.read_bytes()).hexdigest()

    smoke = subprocess.run(["node", str(ROOT / "lib" / "smoke_test.js")],
                           capture_output=True, text=True, cwd=str(ROOT))
    smoke_pass = smoke.returncode == 0
    print(smoke.stdout.strip().splitlines()[-1] if smoke.stdout.strip() else "(no smoke output)")

    tmp = pathlib.Path(tempfile.mkdtemp(prefix="atlas_ship_"))
    test_html = tmp / "atlas_ship.html"
    shutil.copyfile(HTML, test_html)
    png = tmp / "ship_render.png"
    subprocess.run(["powershell", "-Command",
                    "Get-Process msedge -ErrorAction SilentlyContinue | Where-Object {($_.MainWindowTitle -eq '')} | Stop-Process -Force -ErrorAction SilentlyContinue"],
                   capture_output=True)
    subprocess.run([str(EDGE), "--headless=new", "--disable-gpu", "--no-first-run",
                    f"--user-data-dir={tmp / 'prof'}", "--virtual-time-budget=7000",
                    "--window-size=1600,900", f"--screenshot={png}",
                    "file:///" + str(test_html).replace("\\", "/")],
                   capture_output=True, timeout=90)
    for _ in range(10):
        if png.exists() and png.stat().st_size > 0:
            break
        time.sleep(1)
    render_size = png.stat().st_size if png.exists() else 0
    render_ok = render_size > 30000
    print(f"render: {png} ({render_size} bytes) {'OK' if render_ok else 'TOO SMALL / MISSING'}")

    # View-exclusivity: per main tab, the RENDERED cascade must show exactly that one
    # view. Guards the ID-selector-beats-.hidden class of bug (2026-08-24: #view-search
    # display:flex leaked the Tables view onto every tab). Channel: ?shipcheck=1 makes
    # app.js paint a fixed 4-block pixel barcode (green=visible, red=hidden, order
    # map/urusan/search/about) sampled here with PIL — dump-dom emits nothing in this
    # Edge build, so screenshots are the only trustworthy render channel.
    from PIL import Image
    ORDER = ["map", "urusan", "search", "about"]
    views_ok = True
    view_results = {}
    for i, tab in enumerate(ORDER):
        subprocess.run(["powershell", "-Command",
                        "Get-Process msedge -ErrorAction SilentlyContinue | Where-Object {($_.MainWindowTitle -eq '')} | Stop-Process -Force -ErrorAction SilentlyContinue"],
                       capture_output=True)
        tab_png = tmp / f"ship_{tab}.png"
        subprocess.run([str(EDGE), "--headless=new", "--disable-gpu", "--no-first-run",
                        f"--user-data-dir={tmp / ('prof_' + tab)}", "--virtual-time-budget=7000",
                        "--window-size=1600,900", f"--screenshot={tab_png}",
                        "file:///" + str(test_html).replace("\\", "/") + f"?shipcheck=1&tab={tab}"],
                       capture_output=True, timeout=90)
        for _ in range(10):
            if tab_png.exists() and tab_png.stat().st_size > 0:
                break
            time.sleep(1)
        pattern = None
        if tab_png.exists() and tab_png.stat().st_size > 0:
            img = Image.open(tab_png).convert("RGB")
            blocks = []
            for j in range(len(ORDER)):
                r, g, b = img.getpixel((j * 40 + 20, 20))
                blocks.append("G" if g > r else ("R" if r > g else "?"))
            pattern = "".join(blocks)
        expected = "".join("G" if j == i else "R" for j in range(len(ORDER)))
        view_results[tab] = pattern
        if pattern != expected:
            views_ok = False
        print(f"views[{tab}]: barcode={pattern!r} expected={expected!r} {'OK' if pattern == expected else 'FAIL'}")

    out = {
        "html_sha256": sha,
        "smoke": "pass" if smoke_pass else "fail",
        "render_png": str(png) if render_ok else "",
        "render_size": render_size,
        "view_exclusivity": view_results,
        "views": "pass" if views_ok else "fail",
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    (ROOT / "build").mkdir(exist_ok=True)
    json.dump(out, open(ROOT / "build" / "ship_check.json", "w", encoding="utf-8"), indent=1)
    ok = smoke_pass and render_ok and views_ok
    print("SHIP-CHECK:", "PASS" if ok else "FAIL", "->", ROOT / "build" / "ship_check.json")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
