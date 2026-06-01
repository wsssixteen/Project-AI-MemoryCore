import zipfile, re, os, shutil, sys
import xml.etree.ElementTree as ET

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
bak = docx + ".bak2_ruri_20260521"
shutil.copy2(docx, bak)
print("BACKUP:", bak)

z = zipfile.ZipFile(docx)
names = z.namelist()
parts = {n: z.read(n) for n in names}
z.close()
doc = parts['word/document.xml'].decode('utf-8')

CG = ('<w:rFonts w:ascii="Century Gothic" w:eastAsiaTheme="minorEastAsia" w:hAnsi="Century Gothic" w:cs="Arial"/>'
      '<w:b/><w:kern w:val="0"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="ms-MY"/>')
ARIAL = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:lang w:val="en-US"/>'

def sdt(tag, ph, idv, rpr):
    return ('<w:sdt><w:sdtPr><w:rPr>'+rpr+'</w:rPr>'
            '<w:alias w:val="'+tag+'"/><w:tag w:val="'+tag+'"/>'
            '<w:id w:val="'+str(idv)+'"/>'
            '<w:placeholder><w:docPart w:val="DefaultPlaceholder_-1854013440"/></w:placeholder>'
            '</w:sdtPr><w:sdtContent><w:r><w:rPr>'+rpr+'</w:rPr><w:t>'+ph+'</w:t></w:r></w:sdtContent></w:sdt>')

def cgrun(text):
    return '<w:r w:rsidRPr="005822E2"><w:rPr>'+CG+'</w:rPr><w:t xml:space="preserve">'+text+'</w:t></w:r>'

def must(cond, msg):
    if not cond:
        print("  ABORT:", msg); sys.exit(1)

for idv in [911000001,911000002,911000003,911000004,911000005,911000006]:
    must(('w:val="%d"'%idv) not in doc, "id %d already exists"%idv)

# ---- #11/#12/#14 : the three standalone XX runs in P43 ----
xx = '<w:r><w:rPr>'+CG+'</w:rPr><w:t>XX</w:t></w:r>'
must(doc.count(xx) == 3, "expected 3 XX runs, found %d" % doc.count(xx))
seg = doc.split(xx)   # 4 segments
doc = (seg[0]
       + sdt('tarikhLuputPajakan',  '&lt;Tarikh Tamat Tempoh Pajakan&gt;', 911000001, CG) + seg[1]
       + sdt('tempohPajakanAsal',   '&lt;Tempoh Asal Pajakan&gt;',         911000002, CG) + seg[2]
       + sdt('tempohPajakanDipohon','&lt;Tempoh Pajakan Dipohon&gt;',      911000003, CG) + seg[3])
print("  OK [#11/#12/#14] 3 XX runs -> SDTs")

# ---- #10 : "Pajakan Mukim" in run A ----
runA = cgrun('Tanah ini adalah berstatus Pajakan Mukim yang akan tamat tempoh pada ')
must(doc.count(runA) == 1, "runA anchor count != 1")
doc = doc.replace(runA,
    cgrun('Tanah ini adalah berstatus ')
    + sdt('jenisPegangan', '&lt;Jenis Pegangan asal hakmilik&gt;', 911000004, CG)
    + cgrun(' yang akan tamat tempoh pada '))
print("  OK [#10] Pajakan Mukim -> jenisPegangan SDT")

# ---- #13 : "1" (baki) in run E ----
runE = cgrun(' tahun. Baki tempoh pajakan yang tinggal adalah 1 tahun. Pemohon telah membuat permohonan melanjutkan tempoh hakmilik ini kepada ')
must(doc.count(runE) == 1, "runE anchor count != 1")
doc = doc.replace(runE,
    cgrun(' tahun. Baki tempoh pajakan yang tinggal adalah ')
    + sdt('bakiTempohPajakan', '&lt;Baki Tempoh Pajakan&gt;', 911000005, CG)
    + cgrun(' tahun. Pemohon telah membuat permohonan melanjutkan tempoh hakmilik ini kepada '))
print("  OK [#13] baki '1' -> bakiTempohPajakan SDT")

# ---- #3 : re-add the lot SDT to P15 (after noHakmilik) ----
p15 = re.search(r'<w:p w14:paraId="62751FC7".*?</w:p>', doc, re.S).group(0)
must(p15.count('</w:sdt></w:p>') == 1, "P15 trailing </w:sdt></w:p> count != 1")
space_run = '<w:r><w:rPr>'+ARIAL+'</w:rPr><w:t xml:space="preserve"> </w:t></w:r>'
lot_sdt = sdt('noPT_or_noLot_or_noPlot', '&lt;No Lot/PT&gt;', 911000006, ARIAL)
p15_new = p15.replace('</w:sdt></w:p>', '</w:sdt>'+space_run+lot_sdt+'</w:p>')
doc = doc.replace(p15, p15_new)
print("  OK [#3] lot SDT appended to P15")

parts['word/document.xml'] = doc.encode('utf-8')
with zipfile.ZipFile(docx, 'w', zipfile.ZIP_DEFLATED) as out:
    for n in names:
        out.writestr(n, parts[n])
print("WROTE:", docx)

# ---- validate ----
print("\n=== VALIDATE ===")
zz = zipfile.ZipFile(docx)
print("zip integrity:", "OK" if zz.testzip() is None else "CORRUPT")
d2 = zz.read('word/document.xml').decode('utf-8')
try:
    ET.fromstring(d2); print("XML well-formed: OK")
except Exception as e:
    print("XML PARSE ERROR:", e); print(">>> RESTORE bak <<<")
    shutil.copy2(bak, docx); sys.exit(1)
print("<w:sdt> count:", d2.count('<w:sdt>'), "(was 29, expect 35)")
print("paragraph count:", len(re.findall(r'<w:p[ >].*?</w:p>', d2, re.S)), "(expect 61)")
for t in ['tarikhLuputPajakan','tempohPajakanAsal','tempohPajakanDipohon','jenisPegangan','bakiTempohPajakan','noPT_or_noLot_or_noPlot']:
    print("  tag present: %-26s %s" % (t, ('<w:tag w:val="%s"/>'%t) in d2))
print("'Pajakan Mukim' literal remaining:", "Pajakan Mukim" in d2)
print("standalone XX runs remaining:", d2.count(xx))
