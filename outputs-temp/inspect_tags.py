import zipfile, re

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
doc = zipfile.ZipFile(docx).read('word/document.xml').decode('utf-8')

# every SDT: tag + inner text
for s in re.findall(r'<w:sdt>.*?</w:sdt>', doc, re.S):
    tag = re.search(r'<w:tag w:val="([^"]*)"', s)
    txt = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', s))
    tagv = tag.group(1) if tag else '(NO TAG)'
    if any(k in (tagv + txt) for k in ['Daerah','daerah','Keputusan','keputusan','Pajakan','status','Status','jenis','Jenis']):
        print("tag=%-26s text=%r" % (tagv, txt))

print("\n--- P43 raw (Perihal Permohonan #2) ---")
m = re.search(r'<w:p\b[^>]*>(?:(?!</w:p>).)*?berstatus(?:(?!</w:p>).)*?</w:p>', doc, re.S)
if m:
    # show each run/sdt text + tags in order
    for piece in re.findall(r'<w:sdt>.*?</w:sdt>|<w:r\b.*?</w:r>', m.group(0), re.S):
        t = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', piece))
        tg = re.search(r'<w:tag w:val="([^"]*)"', piece)
        kind = 'SDT' if piece.startswith('<w:sdt') else 'run'
        print("  %s %-22s %r" % (kind, ('['+tg.group(1)+']') if tg else '', t))
