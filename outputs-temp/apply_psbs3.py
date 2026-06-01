import zipfile, re, shutil, sys
import xml.etree.ElementTree as ET

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
bak = docx + ".bak3_ruri_20260521"
shutil.copy2(docx, bak)
print("BACKUP:", bak)

z = zipfile.ZipFile(docx)
names = z.namelist()
parts = {n: z.read(n) for n in names}
z.close()
doc = parts['word/document.xml'].decode('utf-8')

def must(c, m):
    if not c:
        print("  ABORT:", m); sys.exit(1)

# ===== #17 — P50 YB sentence: add tarikhTerimaUlasanYB CC + "memberi ulasan" =====
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

old17 = ('<w:r w:rsidR="00C430D4" w:rsidRPr="007548D8"><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'
         '<w:b/><w:bCs/><w:kern w:val="0"/><w:lang w:val="ms-MY"/></w:rPr><w:t>melalui surat yang diterima</w:t></w:r>')
must(doc.count(old17) == 1, "#17 anchor count != 1 (got %d)" % doc.count(old17))
must('w:val="911000007"' not in doc, "id 911000007 already exists")
new17 = ybrun('melalui surat yang diterima pentadbiran ini pada ') + yb_sdt + ybrun(' memberi ulasan ')
doc = doc.replace(old17, new17)
print("  OK [#17] YB sentence reworded + tarikhTerimaUlasanYB SDT")

# ===== #18/19 — normalise the 7 Century-Gothic SDTs to Arial (drop explicit sz21) =====
def leaf_sdt(s, tag):
    t = '<w:tag w:val="%s"/>' % tag
    i = s.index(t)
    a = s.rindex('<w:sdt>', 0, i)
    b = s.index('</w:sdt>', i) + len('</w:sdt>')
    return s[a:b]

changed = []
for tag in ['kategoriTanah','syaratNyata','statusTanah','jalanKampungTempat','jarakBPM','tanahTek','syorKeputusan']:
    block = leaf_sdt(doc, tag)
    nb = (block.replace('Century Gothic', 'Arial')
               .replace('<w:sz w:val="21"/>', '')
               .replace('<w:szCs w:val="21"/>', ''))
    if nb != block:
        doc = doc.replace(block, nb, 1)
        changed.append(tag)
print("  OK [#18/19] font normalised in:", changed if changed else "(none had Century Gothic)")

parts['word/document.xml'] = doc.encode('utf-8')
with zipfile.ZipFile(docx, 'w', zipfile.ZIP_DEFLATED) as out:
    for n in names:
        out.writestr(n, parts[n])
print("WROTE:", docx)

# ===== validate =====
print("\n=== VALIDATE ===")
zz = zipfile.ZipFile(docx)
print("zip integrity:", "OK" if zz.testzip() is None else "CORRUPT")
d2 = zz.read('word/document.xml').decode('utf-8')
try:
    ET.fromstring(d2); print("XML well-formed: OK")
except Exception as e:
    print("XML PARSE ERROR:", e, "\n>>> RESTORING bak <<<")
    shutil.copy2(bak, docx); sys.exit(1)
print("<w:sdt> count:", d2.count('<w:sdt>'), "(was 35, expect 36)")
print("paragraph count:", len(re.findall(r'<w:p[ >].*?</w:p>', d2, re.S)), "(expect 61)")
print("tarikhTerimaUlasanYB tag present:", '<w:tag w:val="tarikhTerimaUlasanYB"/>' in d2)
print("'memberi ulasan' present:", 'memberi ulasan' in d2)
print("'Century Gothic' total remaining in doc:", d2.count('Century Gothic'))
