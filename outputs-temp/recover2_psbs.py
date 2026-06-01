import zipfile, re, shutil, sys, os
import xml.etree.ElementTree as ET

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
safebak = r"C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\outputs-temp\PSBS_before_recover2.docx"
shutil.copy2(docx, safebak)
print("SAFE BACKUP (in MemoryCore workspace):", os.path.basename(safebak))

z = zipfile.ZipFile(docx); names = z.namelist()
parts = {n: z.read(n) for n in names}; z.close()
doc = parts['word/document.xml'].decode('utf-8')

# reconstruct exactly what apply_psbs3.py inserted for #17
YB_RPR = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:lang w:val="ms-MY"/>'
def ybrun(t):
    return ('<w:r w:rsidRPr="007548D8"><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'
            '<w:b/><w:bCs/><w:kern w:val="0"/><w:lang w:val="ms-MY"/></w:rPr>'
            '<w:t xml:space="preserve">'+t+'</w:t></w:r>')
yb_sdt = ('<w:sdt><w:sdtPr><w:rPr>'+YB_RPR+'</w:rPr>'
          '<w:alias w:val="tarikhTerimaUlasanYB"/><w:tag w:val="tarikhTerimaUlasanYB"/>'
          '<w:id w:val="911000007"/>'
          '<w:placeholder><w:docPart w:val="DefaultPlaceholder_-1854013440"/></w:placeholder>'
          '</w:sdtPr><w:sdtContent><w:r><w:rPr>'+YB_RPR+'</w:rPr><w:t>&lt;Tarikh Surat&gt;</w:t></w:r></w:sdtContent></w:sdt>')
new17 = ybrun('melalui surat yang diterima pentadbiran ini pada ') + yb_sdt + ybrun(' memberi ulasan ')
old17 = ('<w:r w:rsidR="00C430D4" w:rsidRPr="007548D8"><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'
         '<w:b/><w:bCs/><w:kern w:val="0"/><w:lang w:val="ms-MY"/></w:rPr><w:t>melalui surat yang diterima</w:t></w:r>')

n = doc.count(new17)
print("my #17 inserted segment found:", n, "time(s)")
if n != 1:
    print("ABORT: expected exactly 1 — manual inspection needed"); sys.exit(1)
doc = doc.replace(new17, old17)
print("REVERTED #17 - restored Miya's original 'melalui surat yang diterima' run")

parts['word/document.xml'] = doc.encode('utf-8')
with zipfile.ZipFile(docx, 'w', zipfile.ZIP_DEFLATED) as out:
    for nm in names:
        out.writestr(nm, parts[nm])

# validate
zz = zipfile.ZipFile(docx)
d2 = zz.read('word/document.xml').decode('utf-8')
try:
    ET.fromstring(d2); wf = "OK"
except Exception as e:
    wf = "ERROR " + str(e)
print("\n=== VALIDATE ===")
print("zip:", "OK" if zz.testzip() is None else "CORRUPT", "| XML:", wf)
print("<w:sdt>:", d2.count('<w:sdt>'), "/", d2.count('</w:sdt>'), "| </w:p>:", d2.count('</w:p>'))
yb = [p for p in re.findall(r'<w:p\b.*?</w:p>', d2, re.S)
      if 'melalui surat' in ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))]
ybt = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', yb[0]))
ybtags = re.findall(r'<w:tag w:val="([^"]*)"', yb[0])
print("P50 YB text :", repr(ybt))
print("P50 YB tags :", ybtags)
print("dup check — 'memberi ulasan' x", ybt.count('memberi ulasan'),
      "| 'pentadbiran ini pada' x", ybt.count('pentadbiran ini pada'))
print("tarikhTerimaUlasanYB still present:", 'tarikhTerimaUlasanYB' in d2)
