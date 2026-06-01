import zipfile, re, shutil, sys
import xml.etree.ElementTree as ET

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
bak3 = docx + ".bak3_ruri_20260521"   # pre-script-3 = みや's correct P50 + scripts 1+2 fixes

# --- check bak3's P50 is clean (no duplicate) ---
d = zipfile.ZipFile(bak3).read('word/document.xml').decode('utf-8')
paras = re.findall(r'<w:p\b.*?</w:p>', d, re.S)
yb = [p for p in paras if 'YB ADUN Kawasan' in ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p)) and 'melalui surat' in ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))]
if not yb:
    print("ABORT: bak3 has no YB value paragraph"); sys.exit(1)
ybtxt = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', yb[0]))
print("bak3 P50 YB text:")
print(" ", repr(ybtxt))
if ybtxt.count('memberi ulasan') > 1 or ybtxt.count('pentadbiran ini pada') > 1:
    print("ABORT: bak3 P50 ALSO has the duplication — bak3 is not a clean baseline"); sys.exit(1)
print("  -> bak3 P50 is CLEAN (no duplication)")

# --- restore bak3 ---
shutil.copy2(bak3, docx)
print("RESTORED bak3 -> docx")

# --- re-apply ONLY #18/19 (font normalisation) ---
z = zipfile.ZipFile(docx); names = z.namelist()
parts = {n: z.read(n) for n in names}; z.close()
doc = parts['word/document.xml'].decode('utf-8')

def leaf_sdt(s, tag):
    t = '<w:tag w:val="%s"/>' % tag
    i = s.index(t)
    a = s.rindex('<w:sdt>', 0, i)
    b = s.index('</w:sdt>', i) + len('</w:sdt>')
    return s[a:b]

changed = []
for tag in ['kategoriTanah','syaratNyata','statusTanah','jalanKampungTempat','jarakBPM','tanahTek','syorKeputusan']:
    if ('<w:tag w:val="%s"/>' % tag) not in doc:
        continue
    block = leaf_sdt(doc, tag)
    nb = (block.replace('Century Gothic','Arial')
               .replace('<w:sz w:val="21"/>','').replace('<w:szCs w:val="21"/>',''))
    if nb != block:
        doc = doc.replace(block, nb, 1); changed.append(tag)
print("#18/19 font normalised in:", changed)

parts['word/document.xml'] = doc.encode('utf-8')
with zipfile.ZipFile(docx, 'w', zipfile.ZIP_DEFLATED) as out:
    for n in names:
        out.writestr(n, parts[n])

# --- validate ---
zz = zipfile.ZipFile(docx)
d2 = zz.read('word/document.xml').decode('utf-8')
try:
    ET.fromstring(d2); wf = "OK"
except Exception as e:
    wf = "PARSE ERROR: " + str(e)
print("\n=== VALIDATE ===")
print("zip:", "OK" if zz.testzip() is None else "CORRUPT", "| XML:", wf)
print("<w:sdt>:", d2.count('<w:sdt>'), "/", d2.count('</w:sdt>'), "| </w:p>:", d2.count('</w:p>'))
yb2 = [p for p in re.findall(r'<w:p\b.*?</w:p>', d2, re.S)
       if 'YB ADUN Kawasan' in ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p)) and 'melalui surat' in ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))]
ybt = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', yb2[0]))
print("final P50 YB text:", repr(ybt))
print("duplication check — 'memberi ulasan' count:", ybt.count('memberi ulasan'))
print("Century Gothic remaining:", d2.count('Century Gothic'))
