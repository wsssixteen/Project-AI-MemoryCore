import zipfile, re, os, glob

folder = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK"
docx = os.path.join(folder, "TemplateRingkasanRisalatPSBS.docx")

# lock file = open in Word
locks = glob.glob(os.path.join(folder, "~$*RingkasanRisalatPSBS*"))
print("LOCK FILE (open in Word?):", locks if locks else "none")
print("docx mtime:", os.path.getmtime(docx))

z = zipfile.ZipFile(docx)
print("ALL PARTS:", z.namelist())
doc = z.read('word/document.xml').decode('utf-8')

# every <w:sdt> ... </w:sdt> — dump tag, alias, placeholder text, inner run text
sdts = re.findall(r'<w:sdt>.*?</w:sdt>', doc, re.S)
print("\n=== %d SDTs (tag / alias / inner-text) ===" % len(sdts))
for i, s in enumerate(sdts):
    tag = re.search(r'<w:tag w:val="([^"]*)"', s)
    alias = re.search(r'<w:alias w:val="([^"]*)"', s)
    txt = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', s))
    print("SDT%-3d tag=%-28s alias=%-30s text=%r" % (
        i, tag.group(1) if tag else '(none)',
        alias.group(1) if alias else '(none)', txt[:80]))

# any w:commentReference / commentRangeStart anywhere
crefs = re.findall(r'<w:comment(?:Reference|RangeStart)[^>]*>', doc)
print("\ncommentReference/RangeStart in document.xml:", len(crefs))

# scan for stray angle-bracket placeholders NOT inside an SDT
flat = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', doc))
brackets = re.findall(r'<[^<>]{2,60}>', flat)
print("\nangle-bracket <...> placeholder texts in body:")
for b in brackets:
    print("  ", b)
