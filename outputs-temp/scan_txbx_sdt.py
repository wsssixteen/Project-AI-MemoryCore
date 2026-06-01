import os, re, zipfile, glob, json
from xml.etree import ElementTree as ET

ROOT = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK"

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "v": "urn:schemas-microsoft-com:vml",
    "mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}

W = "{%s}" % NS["w"]
V = "{%s}" % NS["v"]
MC = "{%s}" % NS["mc"]
A = "{%s}" % NS["a"]

def find_txbx_with_sdt(root_elem):
    """Return list of (txbx_elem, list_of_sdt_elems, has_image)."""
    matches = []
    # txbxContent under w:drawing (modern textbox) AND v:textbox (legacy VML)
    for txbx in root_elem.iter(W + "txbxContent"):
        sdts = list(txbx.iter(W + "sdt"))
        if sdts:
            has_img = bool(list(txbx.iter(W + "drawing"))) or bool(list(txbx.iter(A + "blip"))) or bool(list(txbx.iter(W + "pict")))
            matches.append((txbx, sdts, has_img))
    # Legacy v:textbox can contain w:txbxContent OR raw w:p inside
    for vtb in root_elem.iter(V + "textbox"):
        sdts = list(vtb.iter(W + "sdt"))
        if sdts:
            has_img = bool(list(vtb.iter(W + "drawing"))) or bool(list(vtb.iter(A + "blip"))) or bool(list(vtb.iter(W + "pict")))
            matches.append((vtb, sdts, has_img))
    return matches

results = []

for path in glob.glob(os.path.join(ROOT, "**", "*.docx"), recursive=True):
    if os.sep + "TRG" + os.sep in path:
        continue
    try:
        with zipfile.ZipFile(path) as z:
            try:
                xml_bytes = z.read("word/document.xml")
            except KeyError:
                continue
    except zipfile.BadZipFile:
        continue

    try:
        root_elem = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        # Skip parse-broken
        continue

    matches = find_txbx_with_sdt(root_elem)
    if not matches:
        continue

    tags = []
    has_image = False
    sdt_count = 0
    for _, sdts, has_img in matches:
        if has_img:
            has_image = True
        for sdt in sdts:
            sdt_count += 1
            for tag in sdt.iter(W + "tag"):
                v = tag.get(W + "val")
                if v:
                    tags.append(v)

    xml_kb = round(len(xml_bytes) / 1024, 1)
    file_kb = round(os.path.getsize(path) / 1024, 1)
    page_breaks = xml_bytes.decode("utf-8", errors="replace").count('w:type="page"')
    est_pages = page_breaks + 1

    results.append({
        "file": os.path.basename(path),
        "path": path,
        "doc_xml_kb": xml_kb,
        "file_kb": file_kb,
        "page_breaks": page_breaks,
        "est_pages": est_pages,
        "txbx_with_sdt_count": len(matches),
        "sdt_count_inside_txbx": sdt_count,
        "tags": tags,
        "has_image": has_image,
    })

results.sort(key=lambda r: (not r["has_image"], r["doc_xml_kb"], r["est_pages"]))

print(f"Total matching templates: {len(results)}\n")
print(json.dumps(results, indent=2, ensure_ascii=False))
