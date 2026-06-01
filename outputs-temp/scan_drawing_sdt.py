import os, zipfile, glob, json
from xml.etree import ElementTree as ET

ROOT = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"

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
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        continue

    drawings = list(root.iter(W + "drawing"))
    if not drawings:
        continue

    drawings_with_sdt = []
    for d in drawings:
        sdts = list(d.iter(W + "sdt"))
        if sdts:
            tags = []
            for sdt in sdts:
                for tag in sdt.iter(W + "tag"):
                    v = tag.get(W + "val")
                    if v:
                        tags.append(v)
            drawings_with_sdt.append({"sdt_count": len(sdts), "tags": tags})

    has_blip = bool(list(root.iter(A + "blip")))
    file_kb = round(os.path.getsize(path) / 1024, 1)
    xml_kb = round(len(xml_bytes) / 1024, 1)
    page_breaks = xml_bytes.decode("utf-8", errors="replace").count('w:type="page"')

    results.append({
        "file": os.path.basename(path),
        "path": path,
        "file_kb": file_kb,
        "doc_xml_kb": xml_kb,
        "page_breaks": page_breaks,
        "est_pages": page_breaks + 1,
        "drawing_count": len(drawings),
        "drawings_with_nested_sdt": len(drawings_with_sdt),
        "drawing_sdt_detail": drawings_with_sdt,
        "has_blip_image": has_blip,
    })

# Sort: simplest first (smallest xml, fewest pages), prefer with nested-sdt-in-drawing
results.sort(key=lambda r: (
    -r["drawings_with_nested_sdt"],  # prefer ones with nested SDT in drawing
    r["doc_xml_kb"],
    r["est_pages"],
))

print(f"Total templates with <w:drawing>: {len(results)}\n")
print(f"Templates where a <w:drawing> contains an <w:sdt>: {sum(1 for r in results if r['drawings_with_nested_sdt'] > 0)}\n")
print(json.dumps(results, indent=2, ensure_ascii=False))
