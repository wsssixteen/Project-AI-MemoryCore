import zipfile, re, os, shutil, sys

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
bak = docx + ".bak_ruri_20260521"

# --- backup (preserves みや's partial edit) ---
shutil.copy2(docx, bak)
print("BACKUP:", bak)

z = zipfile.ZipFile(docx)
names = z.namelist()
parts = {n: z.read(n) for n in names}
z.close()
doc = parts['word/document.xml'].decode('utf-8')

def repl(s, old, new, label):
    n = s.count(old)
    if n != 1:
        print("  ABORT [%s]: anchor count=%d (expected 1)" % (label, n))
        sys.exit(1)
    print("  OK [%s]" % label)
    return s.replace(old, new)

# Edit #9 — give the tag-less SDT in P42 its tag+alias = tarikhPermohonan
doc = repl(doc,
    '<w:id w:val="1450518538"/>',
    '<w:alias w:val="tarikhPermohonan"/><w:tag w:val="tarikhPermohonan"/><w:id w:val="1450518538"/>',
    '#9 tarikhPermohonan tag')

# Edit #4a — P17: drop the duplicate literal "tahun" (populator already appends " Tahun")
doc = repl(doc, '<w:t>tahun)</w:t>', '<w:t>)</w:t>', '#4 P17 dup-tahun')

# Edit #4b — P18: drop the duplicate literal "tahun"
doc = repl(doc, '<w:t>tahun</w:t>', '<w:t></w:t>', '#4 P18 dup-tahun')

# Edit #15 — P45 "Ulasan Teknikal" heading: center -> left
doc = repl(doc,
    'w14:paraId="72151AD6" w14:textId="71187AA9" w:rsidR="00A51D8D" w:rsidRPr="00D04CB5" w:rsidRDefault="00A51D8D" w:rsidP="00A51D8D"><w:pPr><w:spacing w:line="480" w:lineRule="auto"/><w:jc w:val="center"/>',
    'w14:paraId="72151AD6" w14:textId="71187AA9" w:rsidR="00A51D8D" w:rsidRPr="00D04CB5" w:rsidRDefault="00A51D8D" w:rsidP="00A51D8D"><w:pPr><w:spacing w:line="480" w:lineRule="auto"/><w:jc w:val="left"/>',
    '#15 P45 jc center->left')

parts['word/document.xml'] = doc.encode('utf-8')

# --- rewrite the .docx ---
with zipfile.ZipFile(docx, 'w', zipfile.ZIP_DEFLATED) as out:
    for n in names:
        out.writestr(n, parts[n])
print("WROTE:", docx)

# --- validate ---
print("\n=== VALIDATE ===")
zz = zipfile.ZipFile(docx)
bad = zz.testzip()
print("zip integrity:", "OK" if bad is None else ("CORRUPT: " + str(bad)))
d2 = zz.read('word/document.xml').decode('utf-8')
sdts = re.findall(r'<w:sdt>', d2)
print("SDT count:", len(sdts), "(expected 28)")
print("tarikhPermohonan tag present:", '<w:tag w:val="tarikhPermohonan"/>' in d2)
print("P45 jc=left present:", 'w14:paraId="72151AD6"' in d2 and '<w:jc w:val="left"/>' in d2)
print("standalone <w:t>tahun)</w:t> remaining:", d2.count('<w:t>tahun)</w:t>'))
print("standalone <w:t>tahun</w:t> remaining:", d2.count('<w:t>tahun</w:t>'))
paras = re.findall(r'<w:p[ >].*?</w:p>', d2, re.S)
print("paragraph count:", len(paras), "(expected 61)")
