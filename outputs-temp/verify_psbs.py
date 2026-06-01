import zipfile, re

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
doc = zipfile.ZipFile(docx).read('word/document.xml').decode('utf-8')

# P50 — YB sentence
m = re.search(r'<w:p w14:paraId="19084993".*?</w:p>', doc, re.S)
if m:
    flat = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', m.group(0)))
    tags = re.findall(r'<w:tag w:val="([^"]*)"', m.group(0))
    print("P50 (YB sentence):")
    print("  text:", repr(flat))
    print("  tags:", tags)
else:
    print("P50 paraId 19084993 NOT FOUND — checking by text...")
    m2 = re.search(r'<w:p\b[^>]*>(?:(?!</w:p>).)*?YB ADUN Kawasan.*?</w:p>', doc, re.S)
    if m2:
        flat = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', m2.group(0)))
        print("  found YB para by text:", repr(flat))

# font of the 7 SDTs
print("\nFont per value-SDT:")
for tag in ['kategoriTanah','syaratNyata','statusTanah','jalanKampungTempat','jarakBPM','tanahTek','syorKeputusan']:
    t = '<w:tag w:val="%s"/>' % tag
    if t not in doc:
        print("  %-22s (tag not found)" % tag); continue
    i = doc.index(t)
    a = doc.rindex('<w:sdt>', 0, i)
    b = doc.index('</w:sdt>', i) + len('</w:sdt>')
    block = doc[a:b]
    fonts = set(re.findall(r'w:ascii="([^"]*)"', block))
    has21 = '<w:sz w:val="21"/>' in block
    print("  %-22s fonts=%s  sz21=%s" % (tag, fonts, has21))

# whole-doc paragraph count via </w:p>
print("\nparagraphs (</w:p>):", doc.count('</w:p>'))
print("SDTs (<w:sdt>):", doc.count('<w:sdt>'), "/ closes:", doc.count('</w:sdt>'))
