import os, re, zipfile, glob

ROOT = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK"

has_txbx = []
has_sdt = []
has_vtextbox = []
has_drawing = []
both_txbx_and_sdt_in_doc = []

for path in glob.glob(os.path.join(ROOT, "**", "*.docx"), recursive=True):
    if os.sep + "TRG" + os.sep in path:
        continue
    try:
        with zipfile.ZipFile(path) as z:
            try:
                xml = z.read("word/document.xml").decode("utf-8", errors="replace")
            except KeyError:
                continue
    except zipfile.BadZipFile:
        continue

    fn = os.path.basename(path)
    if "<w:txbxContent" in xml:
        has_txbx.append(fn)
    if "<w:sdt" in xml or "<w:sdt>" in xml:
        has_sdt.append(fn)
    if "<v:textbox" in xml:
        has_vtextbox.append(fn)
    if "<w:drawing" in xml:
        has_drawing.append(fn)
    if "<w:txbxContent" in xml and "<w:sdt" in xml:
        both_txbx_and_sdt_in_doc.append(fn)

print(f"Templates scanned (non-TRG MLK): roughly all *.docx under MLK\\")
print(f"  - contain <w:txbxContent>     : {len(has_txbx)}")
print(f"  - contain <v:textbox> (legacy): {len(has_vtextbox)}")
print(f"  - contain <w:sdt>            : {len(has_sdt)}")
print(f"  - contain <w:drawing>        : {len(has_drawing)}")
print(f"  - contain BOTH txbxContent AND sdt anywhere in same doc.xml: {len(both_txbx_and_sdt_in_doc)}\n")

print("=== Templates with <w:txbxContent> ===")
for f in has_txbx:
    print(" ", f)
print("\n=== Templates with <v:textbox> ===")
for f in has_vtextbox:
    print(" ", f)
print("\n=== Templates with BOTH txbx AND sdt (need nesting verification) ===")
for f in both_txbx_and_sdt_in_doc:
    print(" ", f)
