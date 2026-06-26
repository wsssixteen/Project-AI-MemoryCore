import zipfile, re, os, sys

src = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateSuratMaklumanPTGPSBSLulus.docx"
tmp = src + ".tmp_new"

zin = zipfile.ZipFile(src)
doc = zin.read('word/document.xml').decode('utf-8')

def find_sdt(d, tagval):
    for m in re.finditer(r'<w:sdt>.*?</w:sdt>', d, re.S):
        if 'w:tag w:val="%s"' % tagval in m.group(0):
            return m
    return None

# ---- 1. Premium row: SDT currently tagged kadarNilaianJPPH -> restore formulaPremium ----
m_prem = find_sdt(doc, 'kadarNilaianJPPH')
assert m_prem, "kadarNilaianJPPH SDT not found"
sdt_prem = m_prem.group(0)
new_prem = sdt_prem.replace('w:val="kadarNilaianJPPH"', 'w:val="formulaPremium"')
parts = new_prem.split('</w:sdtPr>', 1)
texts = re.findall(r'<w:t[^>]*>[^<]*</w:t>', parts[1])
if texts:
    fixed = parts[1].replace(texts[0], '<w:t>&lt;Premium&gt;</w:t>', 1)
    for t in texts[1:]:
        fixed = fixed.replace(t, '<w:t></w:t>', 1)
    new_prem = parts[0] + '</w:sdtPr>' + fixed
doc = doc.replace(sdt_prem, new_prem)

# remove the literal "RM " run before that SDT in the same paragraph
m2 = find_sdt(doc, 'formulaPremium')
para_start = doc.rfind('<w:p ', 0, m2.start())
if para_start == -1:
    para_start = doc.rfind('<w:p>', 0, m2.start())
before = doc[para_start:m2.start()]
rm_runs = re.findall(r'<w:r>(?:(?!</w:r>).)*?<w:t[^>]*>RM[\s·]?\s?</w:t>(?:(?!</w:r>).)*?</w:r>', before, re.S)
removed_rm = False
if rm_runs:
    doc = doc[:para_start] + before.replace(rm_runs[-1], '', 1) + doc[m2.start():]
    removed_rm = True

# ---- 2. Hasil row: SDT hasilTahunPertamaWithRM -> kadarNilaianJPPH + "RM " literal before ----
m_hasil = find_sdt(doc, 'hasilTahunPertamaWithRM')
assert m_hasil, "hasilTahunPertamaWithRM SDT not found"
sdt_hasil = m_hasil.group(0)
new_hasil = sdt_hasil.replace('w:val="hasilTahunPertamaWithRM"', 'w:val="kadarNilaianJPPH"')
cp = new_hasil.split('</w:sdtPr>', 1)
texts = re.findall(r'<w:t[^>]*>[^<]*</w:t>', cp[1])
if texts:
    fixed = cp[1].replace(texts[0], '<w:t>&lt;Kadar Nilaian smp/sehektar&gt;</w:t>', 1)
    for t in texts[1:]:
        fixed = fixed.replace(t, '<w:t></w:t>', 1)
    new_hasil = cp[0] + '</w:sdtPr>' + fixed
rpr = re.search(r'<w:rPr>.*?</w:rPr>', cp[1], re.S)
rm_run = '<w:r>' + (rpr.group(0) if rpr else '') + '<w:t xml:space="preserve">RM </w:t></w:r>'
doc = doc.replace(sdt_hasil, rm_run + new_hasil)

# ---- write back atomically, preserving all other parts ----
with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = doc.encode('utf-8') if item.filename == 'word/document.xml' else zin.read(item.filename)
        zout.writestr(item, data)
zin.close()
os.replace(tmp, src)

# ---- verify ----
z = zipfile.ZipFile(src)
d = z.read('word/document.xml').decode('utf-8')
print("formulaPremium tags:", d.count('<w:tag w:val="formulaPremium"'))
print("kadarNilaianJPPH tags:", d.count('<w:tag w:val="kadarNilaianJPPH"'))
print("hasilTahunPertamaWithRM tags:", d.count('<w:tag w:val="hasilTahunPertamaWithRM"'))
print("RM-literal removed from Premium para:", removed_rm)
print("zip integrity:", "OK" if z.testzip() is None else "BAD")

def repl(m):
    t = re.search(r'<w:tag w:val="([^"]*)"', m.group(0))
    return '<w:t>[[%s]]</w:t>' % (t.group(1) if t else '?')
b = re.sub(r'<w:sdt>.*?</w:sdt>', repl, d, flags=re.S)
print("\n-- affected rows --")
for pa in re.findall(r'<w:p[ >].*?</w:p>', b, re.S):
    txt = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', pa))
    if ('remium' in txt) or ('asil' in txt) or ('kadarNilaian' in txt) or ('Sehektar' in txt):
        print("  ", txt.replace('&lt;', '<').replace('&gt;', '>'))
