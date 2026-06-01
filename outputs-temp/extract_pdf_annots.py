import fitz  # PyMuPDF

pdf = r"C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka\40. QA #262004 - FAT - PSBS - Isu pada Ringkasan Risalat\0. Brief\QA #262004.pdf"
doc = fitz.open(pdf)
print("PDF pages:", doc.page_count)
total = 0
for pno in range(doc.page_count):
    page = doc[pno]
    annots = list(page.annots() or [])
    if not annots:
        continue
    print("\n===== PAGE %d — %d annotation(s) =====" % (pno + 1, len(annots)))
    for a in annots:
        total += 1
        info = a.info
        atype = a.type[1]  # human-readable type name
        content = info.get("content", "")
        # text under the annotation rectangle
        try:
            under = page.get_textbox(a.rect).strip()
        except Exception:
            under = ""
        print("  [%s] content=%r" % (atype, content))
        if under:
            print("        under-rect text=%r" % under[:300])
print("\nTOTAL ANNOTATIONS:", total)
