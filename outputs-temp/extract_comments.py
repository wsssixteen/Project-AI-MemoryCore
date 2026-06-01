import zipfile, re, os

docx = r"E:\Projects\Melaka\etanah-pelupusan\src\main\resources\template\MLK\TemplateRingkasanRisalatPSBS.docx"
z = zipfile.ZipFile(docx)
print("PARTS:", [n for n in z.namelist() if 'comment' in n.lower()])

if 'word/comments.xml' not in z.namelist():
    print("NO word/comments.xml — document has no Word comments.")
else:
    cx = z.read('word/comments.xml').decode('utf-8')
    # each <w:comment> has w:id, w:author, w:date; text in <w:t>
    comments = {}
    for m in re.finditer(r'<w:comment\b[^>]*>(.*?)</w:comment>', cx, re.S):
        block = m.group(0)
        cid = re.search(r'w:id="(\d+)"', block)
        author = re.search(r'w:author="([^"]*)"', block)
        txt = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', block))
        cid = cid.group(1) if cid else '?'
        comments[cid] = {'author': author.group(1) if author else '?', 'text': txt}
    print("=== %d COMMENTS ===" % len(comments))

    # anchor each comment in document.xml
    doc = z.read('word/document.xml').decode('utf-8')
    paras = re.findall(r'<w:p[ >].*?</w:p>', doc, re.S)
    anchor = {}
    for i, p in enumerate(paras):
        ptxt = ' '.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', p))
        for cm in re.finditer(r'<w:commentR(?:angeStart|eference) w:id="(\d+)"', p):
            anchor.setdefault(cm.group(1), []).append((i, ptxt))

    for cid in sorted(comments, key=lambda x: int(x) if x.isdigit() else 0):
        c = comments[cid]
        loc = anchor.get(cid, [])
        print("\n--- comment id=%s by %s ---" % (cid, c['author']))
        print("  TEXT: %r" % c['text'])
        for (pi, ptxt) in loc:
            print("  @P%d: %r" % (pi, ptxt[:160]))
        if not loc:
            print("  @ (anchor not found in a <w:p> — may be table-cell or doc-level)")
