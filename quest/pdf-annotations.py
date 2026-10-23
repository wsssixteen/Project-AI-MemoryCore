"""Print every annotation of every PDF given, as JSON (one object per file).

Called by quest/ticket-load-verify.js so the resume manifest carries BA's
highlights and comments itself; no separate step can be skipped (#262027,
2026-10-23). Needs PyMuPDF (import fitz).
"""
import json
import sys


def colour_word(rgb):
    if not rgb:
        return "none"
    r, g, b = rgb[:3]
    if r > 0.8 and g < 0.5:
        return "red"
    if g > 0.8 and r < 0.6:
        return "green"
    if r > 0.8 and g > 0.8 and b < 0.6:
        return "yellow"
    if b > 0.8 and r < 0.5:
        return "blue"
    return "rgb(%.2f,%.2f,%.2f)" % (r, g, b)


def read(path):
    import fitz
    doc = fitz.open(path)
    rows = []
    for page in doc:
        for a in page.annots() or []:
            colours = a.colors or {}
            rgb = colours.get("stroke") or colours.get("fill") or ()
            text = " ".join(page.get_textbox(a.rect).split())
            comment = " | ".join(s.strip() for s in (a.info.get("content") or "").splitlines() if s.strip())
            rows.append({"page": page.number + 1, "type": a.type[1], "colour": colour_word(rgb),
                         "text": text[:160], "comment": comment})
    return {"file": path, "pages": len(doc), "annotations": rows}


out = []
for p in sys.argv[1:]:
    try:
        out.append(read(p))
    except Exception as e:  # reported by the caller as an integrity problem
        out.append({"file": p, "error": "%s: %s" % (type(e).__name__, e)})
print(json.dumps(out, ensure_ascii=False))
