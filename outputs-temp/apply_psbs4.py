import zipfile, re, shutil, sys
import xml.etree.ElementTree as ET

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
safebak = r"C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\outputs-temp\PSBS_before_fix4.docx"
shutil.copy2(docx, safebak)
print("SAFE BACKUP -> outputs-temp/PSBS_before_fix4.docx")

z = zipfile.ZipFile(docx); names = z.namelist()
parts = {n: z.read(n) for n in names}; z.close()
doc = parts['word/document.xml'].decode('utf-8')

def must(c, m):
    if not c:
        print("  ABORT:", m); sys.exit(1)

# FIX 1 — keputusanJT (table-row-only tag, not a top-level CC) -> keputusanYB
c = doc.count('w:val="keputusanJT"')
must(c >= 1, "keputusanJT not found")
doc = doc.replace('w:val="keputusanJT"', 'w:val="keputusanYB"')
print("  OK fix1 - keputusanJT -> keputusanYB (%d attr occurrences)" % c)

# FIX 2 — #10 jenisPegangan (PSBS path returns blank) -> jenisHakmilik ; target by unique id
old2 = '<w:alias w:val="jenisPegangan"/><w:tag w:val="jenisPegangan"/><w:id w:val="911000004"/>'
must(doc.count(old2) == 1, "#10 jenisPegangan SDT (id 911000004) anchor != 1")
doc = doc.replace(old2, '<w:alias w:val="jenisHakmilik"/><w:tag w:val="jenisHakmilik"/><w:id w:val="911000004"/>')
print("  OK fix2 - #10 jenisPegangan -> jenisHakmilik")

# FIX 3 — P43 duplicate literal "tahun" (populators already append " Tahun")
for old, new, label in [
    ('<w:t xml:space="preserve"> tahun. Baki tempoh pajakan yang tinggal adalah </w:t>',
     '<w:t xml:space="preserve">. Baki tempoh pajakan yang tinggal adalah </w:t>', 'after tempohPajakanAsal'),
    ('<w:t xml:space="preserve"> tahun. Pemohon telah membuat permohonan melanjutkan tempoh hakmilik ini kepada </w:t>',
     '<w:t xml:space="preserve">. Pemohon telah membuat permohonan melanjutkan tempoh hakmilik ini kepada </w:t>', 'after bakiTempohPajakan'),
    ('<w:t xml:space="preserve"> tahun.</w:t>',
     '<w:t xml:space="preserve">.</w:t>', 'after tempohPajakanDipohon'),
]:
    must(doc.count(old) == 1, "P43 dedup anchor != 1 (%s)" % label)
    doc = doc.replace(old, new)
    print("  OK fix3 - P43 dedup tahun (%s)" % label)

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
    wf = "ERROR " + str(e)
    shutil.copy2(safebak, docx); print(">>> RESTORED backup <<<")
print("\n=== VALIDATE ===")
print("zip:", "OK" if zz.testzip() is None else "CORRUPT", "| XML:", wf)
print("<w:sdt>:", d2.count('<w:sdt>'), "/", d2.count('</w:sdt>'), "| </w:p>:", d2.count('</w:p>'))
print("keputusanJT remaining:", d2.count('keputusanJT'), "| keputusanYB present:", 'keputusanYB' in d2)
print("jenisHakmilik tag present:", '<w:tag w:val="jenisHakmilik"/>' in d2)
# P43 text
m = re.search(r'<w:p\b[^>]*>(?:(?!</w:p>).)*?berstatus(?:(?!</w:p>).)*?</w:p>', d2, re.S)
if m:
    print("P43 text:", repr(' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', m.group(0)))))
