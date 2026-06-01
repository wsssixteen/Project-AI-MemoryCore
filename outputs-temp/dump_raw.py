import zipfile, re, os

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
z = zipfile.ZipFile(docx)
doc = z.read('word/document.xml').decode('utf-8')
print("document.xml length:", len(doc))

paras = re.findall(r'<w:p[ >].*?</w:p>', doc, re.S)
print("para count:", len(paras))

for idx in [15, 17, 18, 42, 43, 45, 50]:
    print("\n############### P%d (raw) ###############" % idx)
    print(paras[idx])

# header2
h2 = z.read('word/header2.xml').decode('utf-8')
print("\n############### header2.xml (raw) ###############")
print(h2)
