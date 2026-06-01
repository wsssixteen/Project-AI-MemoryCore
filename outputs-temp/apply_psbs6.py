import zipfile, re, shutil, sys, os, glob
import xml.etree.ElementTree as ET

folder = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK"
docx = os.path.join(folder, "TemplateRingkasanRisalatPSBS.docx")

# discipline step 1 — lock check
locks = glob.glob(os.path.join(folder, "~$*RingkasanRisalatPSBS*"))
if locks:
    print("ABORT: .docx is open in Word (lock file present):", locks); sys.exit(1)

# discipline step 2 — backup
safebak = r"C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\outputs-temp\PSBS_before_fix6.docx"
shutil.copy2(docx, safebak)
print("SAFE BACKUP -> outputs-temp/PSBS_before_fix6.docx")

z = zipfile.ZipFile(docx); names = z.namelist()
parts = {n: z.read(n) for n in names}; z.close()
doc = parts['word/document.xml'].decode('utf-8')

CG = ('<w:rFonts w:ascii="Century Gothic" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Century Gothic" w:cs="Arial"/>'
      '<w:b/><w:kern w:val="0"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="ms-MY"/>')
ARIAL = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:lang w:val="ms-MY"/>'

def sdt(tag, ph, idv, rpr):
    return ('<w:sdt><w:sdtPr><w:rPr>'+rpr+'</w:rPr>'
            '<w:alias w:val="'+tag+'"/><w:tag w:val="'+tag+'"/>'
            '<w:id w:val="'+str(idv)+'"/>'
            '<w:placeholder><w:docPart w:val="DefaultPlaceholder_-1854013440"/></w:placeholder>'
            '</w:sdtPr><w:sdtContent><w:r><w:rPr>'+rpr+'</w:rPr><w:t>'+ph+'</w:t></w:r></w:sdtContent></w:sdt>')

def swap_sdt(doc, oldtag, newtag, ph, idv, rpr, label):
    t = '<w:tag w:val="%s"/>' % oldtag
    if doc.count(t) != 1:
        print("  ABORT [%s]: tag %s count=%d" % (label, oldtag, doc.count(t))); sys.exit(1)
    i = doc.index(t)
    a = doc.rindex('<w:sdt>', 0, i)
    b = doc.index('</w:sdt>', i) + len('</w:sdt>')
    doc = doc[:a] + sdt(newtag, ph, idv, rpr) + doc[b:]
    print("  OK [%s]: %s -> %s" % (label, oldtag, newtag))
    return doc

# fix 1 — daerahPejabat -> namaDaerah (proven, heavily-used registered tag; same daerah output)
doc = swap_sdt(doc, 'daerahPejabat', 'namaDaerah', '&lt;Daerah&gt;', 911000011, CG, '#daerah')
# fix 2 — tarikhSuratJT -> tarikhTerimaUlasanYB (registered :924; reads the YB JT trkh_ulasan)
doc = swap_sdt(doc, 'tarikhSuratJT', 'tarikhTerimaUlasanYB', '&lt;Tarikh Surat&gt;', 911000012, ARIAL, '#tarikhYB')

parts['word/document.xml'] = doc.encode('utf-8')
with zipfile.ZipFile(docx, 'w', zipfile.ZIP_DEFLATED) as out:
    for n in names:
        out.writestr(n, parts[n])

# discipline step 3 — validate
zz = zipfile.ZipFile(docx)
d2 = zz.read('word/document.xml').decode('utf-8')
try:
    ET.fromstring(d2); wf = "OK"
except Exception as e:
    wf = "ERROR " + str(e); shutil.copy2(safebak, docx); print(">>> RESTORED <<<")
print("\n=== VALIDATE ===")
print("zip:", "OK" if zz.testzip() is None else "CORRUPT", "| XML:", wf)
print("<w:sdt>:", d2.count('<w:sdt>'), "/", d2.count('</w:sdt>'), "| </w:p>:", d2.count('</w:p>'))
print("namaDaerah tag present:", '<w:tag w:val="namaDaerah"/>' in d2)
print("tarikhTerimaUlasanYB tag present:", '<w:tag w:val="tarikhTerimaUlasanYB"/>' in d2)
print("daerahPejabat gone:", 'daerahPejabat' not in d2, "| tarikhSuratJT gone:", 'tarikhSuratJT' not in d2)
