import zipfile, re, shutil, sys
import xml.etree.ElementTree as ET

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
safebak = r"C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\outputs-temp\PSBS_before_fix5.docx"
shutil.copy2(docx, safebak)
print("SAFE BACKUP -> outputs-temp/PSBS_before_fix5.docx")

z = zipfile.ZipFile(docx); names = z.namelist()
parts = {n: z.read(n) for n in names}; z.close()
doc = parts['word/document.xml'].decode('utf-8')

# locate the leaf SDT carrying tag daerahPejabat
t = '<w:tag w:val="daerahPejabat"/>'
if doc.count(t) != 1:
    print("ABORT: daerahPejabat tag count =", doc.count(t)); sys.exit(1)
i = doc.index(t)
a = doc.rindex('<w:sdt>', 0, i)
b = doc.index('</w:sdt>', i) + len('</w:sdt>')
old_sdt = doc[a:b]
print("OLD daerahPejabat SDT (%d chars):" % len(old_sdt))
print(" ", old_sdt[:400])

# clean replacement — same format as the script-created SDTs that populate (jenisHakmilik etc.)
CG = ('<w:rFonts w:ascii="Century Gothic" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Century Gothic" w:cs="Arial"/>'
      '<w:b/><w:kern w:val="0"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="ms-MY"/>')
new_sdt = ('<w:sdt><w:sdtPr><w:rPr>'+CG+'</w:rPr>'
           '<w:alias w:val="daerahPejabat"/><w:tag w:val="daerahPejabat"/>'
           '<w:id w:val="911000010"/>'
           '<w:placeholder><w:docPart w:val="DefaultPlaceholder_-1854013440"/></w:placeholder>'
           '</w:sdtPr><w:sdtContent><w:r><w:rPr>'+CG+'</w:rPr><w:t>&lt;Daerah&gt;</w:t></w:r></w:sdtContent></w:sdt>')

if 'w:val="911000010"' in doc:
    print("ABORT: id 911000010 already used"); sys.exit(1)
doc = doc[:a] + new_sdt + doc[b:]
print("REPLACED daerahPejabat SDT with clean script-format SDT")

parts['word/document.xml'] = doc.encode('utf-8')
with zipfile.ZipFile(docx, 'w', zipfile.ZIP_DEFLATED) as out:
    for n in names:
        out.writestr(n, parts[n])

# validate
zz = zipfile.ZipFile(docx)
d2 = zz.read('word/document.xml').decode('utf-8')
try:
    ET.fromstring(d2); wf = "OK"
except Exception as e:
    wf = "ERROR " + str(e); shutil.copy2(safebak, docx); print(">>> RESTORED <<<")
print("\n=== VALIDATE ===")
print("zip:", "OK" if zz.testzip() is None else "CORRUPT", "| XML:", wf)
print("<w:sdt>:", d2.count('<w:sdt>'), "/", d2.count('</w:sdt>'), "| </w:p>:", d2.count('</w:p>'))
print("daerahPejabat tag present:", '<w:tag w:val="daerahPejabat"/>' in d2)
m = re.search(r'<w:p\b[^>]*>(?:(?!</w:p>).)*?Pentadbir Tanah(?:(?!</w:p>).)*?</w:p>', d2, re.S)
if m:
    print("Perihal #1 text:", repr(' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', m.group(0)))))
