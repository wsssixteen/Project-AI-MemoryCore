import zipfile, re, os, glob

folder = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK"
docx = os.path.join(folder, "TemplateRingkasanRisalatPSBS.docx")

locks = glob.glob(os.path.join(folder, "~$*RingkasanRisalatPSBS*"))
print("LOCK FILE (open in Word right now?):", locks if locks else "NONE")
import time
print("docx last-modified:", time.ctime(os.path.getmtime(docx)))

doc = zipfile.ZipFile(docx).read('word/document.xml').decode('utf-8')
paras = re.findall(r'<w:p\b.*?</w:p>', doc, re.S)
print("total paragraphs:", len(paras))
print("\n--- paragraphs mentioning YB / Ulasan / tarikhTerima / memberi ulasan ---")
for i, p in enumerate(paras):
    txt = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))
    if any(k in txt for k in ['YB', 'Ulasan', 'memberi ulasan']) or 'tarikhTerimaUlasanYB' in p:
        tags = re.findall(r'<w:tag w:val="([^"]*)"', p)
        print("P%-3d tags=%s" % (i, tags))
        print("     text=%r" % txt)
