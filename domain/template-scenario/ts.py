"""template-scenario helper: read Word documents and draw the green highlight.

Subcommands (all print JSON on stdout):
  paras <docx>                       paragraphs in body order: text, tags, tokens with origin (static | cc)
  comments <docx>                    review comments with the text they anchor
  cc <docx>                          every content control: tag, text, image bytes
  highlight <pdf> <out> <phrases.json>  draw green rectangles behind each phrase, no annotations
"""
import json
import re
import sys
import zipfile

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'


def _xml(z, name):
    from lxml import etree
    return etree.fromstring(z.read(name))


def _tag(sdt):
    t = sdt.find(W + 'sdtPr/' + W + 'tag')
    return t.get(W + 'val') if t is not None else None


def paras(path):
    z = zipfile.ZipFile(path)
    d = _xml(z, 'word/document.xml')
    out = []
    for p in d.iter(W + 'p'):
        chars = []
        tags = []
        for t in p.iter(W + 't'):
            origin = 'static'
            anc = t.getparent()
            while anc is not None:
                if anc.tag == W + 'sdt':
                    origin = 'cc'
                    tg = _tag(anc)
                    if tg and tg not in tags:
                        tags.append(tg)
                    break
                anc = anc.getparent()
            for ch in (t.text or ''):
                chars.append((ch, origin))
        full = ''.join(c for c, _ in chars)
        toks = []
        for m in re.finditer(r'\S+', full):
            origin = 'cc' if any(chars[i][1] == 'cc' for i in range(m.start(), m.end())) else 'static'
            toks.append([m.group(0), origin])
        text = full.strip()
        if text or tags:
            out.append({'text': text, 'tags': tags, 'tokens': toks})
    return out


def comments(path):
    z = zipfile.ZipFile(path)
    if 'word/comments.xml' not in z.namelist():
        return []
    c = _xml(z, 'word/comments.xml')
    body = {x.get(W + 'id'): ''.join(t.text or '' for t in x.iter(W + 't')).strip() for x in c.iter(W + 'comment')}
    d = _xml(z, 'word/document.xml')
    anchor, active = {}, set()
    for el in d.iter():
        if el.tag == W + 'commentRangeStart':
            active.add(el.get(W + 'id'))
            anchor.setdefault(el.get(W + 'id'), '')
        elif el.tag == W + 'commentRangeEnd':
            active.discard(el.get(W + 'id'))
        elif el.tag == W + 't':
            for a in active:
                anchor[a] += el.text or ''
    return [{'id': k, 'anchor': anchor.get(k, '').strip(), 'comment': v} for k, v in body.items()]


def cc(path):
    z = zipfile.ZipFile(path)
    d = _xml(z, 'word/document.xml')
    rels = {}
    if 'word/_rels/document.xml.rels' in z.namelist():
        for r in _xml(z, 'word/_rels/document.xml.rels'):
            rels[r.get('Id')] = r.get('Target')
    sizes = {}
    for i in z.infolist():
        if i.filename.startswith('word/media/'):
            sizes[i.filename[len('word/'):]] = i.file_size
    out = []
    for sdt in d.iter(W + 'sdt'):
        tg = _tag(sdt)
        if not tg:
            continue
        text = ''.join(t.text or '' for t in sdt.iter(W + 't')).strip()
        imgs = []
        for el in sdt.iter():
            rid = el.get(R + 'embed')
            if rid and rid in rels:
                imgs.append(sizes.get(rels[rid], 0))
        out.append({'tag': tg, 'text': text, 'images': imgs})
    return out


def highlight(pdf, out, phrases_file):
    import fitz
    phrases = json.load(open(phrases_file, encoding='utf-8'))
    d = fitz.open(pdf)
    found = {}
    for page in d:
        for ph in phrases:
            for r in page.search_for(ph):
                page.draw_rect(r, color=None, fill=(0.6, 1.0, 0.6), overlay=False)
                found[ph] = found.get(ph, 0) + 1
    d.save(out, garbage=3)
    annots = sum(1 for p in fitz.open(out) for a in p.annots())
    return {'found': found, 'missing': [p for p in phrases if p not in found], 'annots': annots, 'pages': d.page_count}


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'paras':
        res = paras(sys.argv[2])
    elif cmd == 'comments':
        res = comments(sys.argv[2])
    elif cmd == 'cc':
        res = cc(sys.argv[2])
    elif cmd == 'highlight':
        res = highlight(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        raise SystemExit('unknown command ' + cmd)
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(res, ensure_ascii=False))
