import zipfile, re, subprocess, os

repo = r"E:\Projects\Melaka\etanah-pelupusan"
docx = os.path.join(repo, r"src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx")

print("=== GIT STATUS (etanah-pelupusan) ===")
print(subprocess.run(["git","-C",repo,"status","--short"],capture_output=True,text=True).stdout)

z = zipfile.ZipFile(docx)
doc = z.read("word/document.xml").decode("utf-8")

tags = re.findall(r'<w:tag w:val="([^"]*)"', doc)
print("=== BODY CC TAGS (%d) ===" % len(tags))
print(tags)

for h in ["word/header1.xml","word/header2.xml","word/header3.xml"]:
    if h in z.namelist():
        hx = z.read(h).decode("utf-8")
        htags = re.findall(r'<w:tag w:val="([^"]*)"', hx)
        hflat = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', hx))
        print("=== %s === tags=%s" % (h, htags))
        print("   text=%r" % hflat)

paras = re.findall(r'<w:p[ >].*?</w:p>', doc, re.S)
print("=== %d body paragraphs (text + jc + sdt tags) ===" % len(paras))
for i,p in enumerate(paras):
    txt = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))
    jc = re.search(r'<w:jc w:val="([^"]*)"', p)
    ptags = re.findall(r'<w:tag w:val="([^"]*)"', p)
    if txt.strip() or ptags:
        print("P%-3d jc=%-7s tags=%s" % (i, jc.group(1) if jc else '-', ptags))
        if txt.strip():
            print("      %r" % txt)
