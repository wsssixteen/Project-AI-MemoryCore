import zipfile, re, os

FILES = [
    r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateSuratMaklumanPTGPSBSLulus.docx",
    r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateSuratMaklumanPTGPSBSTolak.docx",
]
ANCHOR = "perkara di atas."  # the single-line paragraph that needs the trailing soft break

for src in FILES:
    zin = zipfile.ZipFile(src)
    doc = zin.read('word/document.xml').decode('utf-8')

    # find the paragraph containing the anchor sentence
    target = None
    for m in re.finditer(r'<w:p[ >].*?</w:p>', doc, re.S):
        txt = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', m.group(0)))
        if ANCHOR in txt:
            target = m
            break
    assert target, "anchor paragraph not found in " + src

    para = target.group(0)
    if '<w:br/></w:r></w:p>' in para or para.rstrip().endswith('<w:br/></w:r></w:p>'):
        print(os.path.basename(src), ": soft break already present - skipped")
        zin.close()
        continue

    # append a run holding only a soft line-break as the LAST content of the paragraph,
    # copying the rPr of the paragraph's last text run so formatting stays uniform
    rprs = re.findall(r'<w:r>(<w:rPr>.*?</w:rPr>)', para, re.S)
    rpr = rprs[-1] if rprs else ''
    new_para = para[:-len('</w:p>')] + '<w:r>' + rpr + '<w:br/></w:r>' + '</w:p>'
    doc = doc.replace(para, new_para, 1)

    tmp = src + '.tmp_new'
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = doc.encode('utf-8') if item.filename == 'word/document.xml' else zin.read(item.filename)
            zout.writestr(item, data)
    zin.close()
    os.replace(tmp, src)

    # verify
    z = zipfile.ZipFile(src)
    d = z.read('word/document.xml').decode('utf-8')
    ok_zip = z.testzip() is None
    m2 = None
    for m in re.finditer(r'<w:p[ >].*?</w:p>', d, re.S):
        txt = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', m.group(0)))
        if ANCHOR in txt:
            m2 = m
            break
    has_br = m2 and m2.group(0).rstrip().endswith('<w:br/></w:r></w:p>')
    jc = re.search(r'<w:jc w:val="([^"]*)"', m2.group(0)) if m2 else None
    print(os.path.basename(src), ": soft-break added:", bool(has_br), "| jc:", jc.group(1) if jc else "none", "| zip:", "OK" if ok_zip else "BAD")
