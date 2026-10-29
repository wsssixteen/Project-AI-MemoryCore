# letter-check: verify a patched etanah Word letter before it goes to infra.
#   STANDARD  only the declared tags changed versus the original; no tag lost; dates in Malay format
#   ALIGNMENT signature and QR on one row, signature left of QR, name below both and left-aligned with the signature
#   DATA      every content control filled; "-", "( )" or blank fails unless --allow-empty names it
# usage: python -I letter-check.py --letter <patched.main> --original <downloaded.main> --pdf <render of patched>
#        [--expect-change tarikh#1,peranan] [--removed namaPegawaiTandatangan] [--allow-empty pejabat,tandatanganImej]
#        (--expect-change takes a tag for every copy of it, or tag#n for the n-th copy only)
#        [--signature <signature.png>] [--log <log.jsonl>]
# exit 0 = PASS, 1 = FAIL, 2 = bad input
import argparse, json, os, re, sys, time, zipfile
from xml.etree import ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
MONTHS = 'Januari|Februari|Mac|April|Mei|Jun|Julai|Ogos|September|Oktober|November|Disember'
DATE_RE = re.compile(r'^\d{1,2} (%s) \d{4}$' % MONTHS)
NOT_FOUND = {'-', '( )', '()', 'null', 'NULL'}
IMAGE_TAG = re.compile(r'(tandatangan|qrkod|barkod|imej)', re.I)


def sdts(path):
    """Ordered list of (tag, text, has_image) for every content control in the main document."""
    root = ET.fromstring(zipfile.ZipFile(path).read('word/document.xml'))
    out = []
    for sdt in root.iter(W + 'sdt'):
        pr = sdt.find(W + 'sdtPr')
        tag = pr.find(W + 'tag') if pr is not None else None
        content = sdt.find(W + 'sdtContent')
        text = ''.join(t.text or '' for t in content.iter(W + 't')) if content is not None else ''
        img = content is not None and any(e.tag.endswith('}drawing') or e.tag.endswith('}pict') for e in content.iter())
        out.append((tag.get(W + 'val') if tag is not None else '?', text, img))
    return out


def check_data(rows, allow_empty):
    fails = []
    for tag, text, img in rows:
        t = text.strip()
        if IMAGE_TAG.search(tag):
            if img:
                continue
            if tag in allow_empty:
                continue
            fails.append('%s: image tag with no image' % tag)
            continue
        if t in NOT_FOUND:
            fails.append('%s: value %r means not found' % (tag, t))
        elif not t and tag not in allow_empty:
            fails.append('%s: empty' % tag)
        elif re.search(r'\(\s*\)', t):
            fails.append('%s: empty brackets in %r' % (tag, t))
    return fails


def check_standard(orig, patched, expect_change, removed):
    fails = []
    otags = [r[0] for r in orig]
    ptags = [r[0] for r in patched]
    for tag in sorted(set(otags) - set(ptags)):
        if tag not in removed:
            fails.append('%s: tag removed but not declared in --removed' % tag)
    for tag in sorted(set(ptags) - set(otags)):
        fails.append('%s: new tag not in the original' % tag)
    by_tag = {}
    for tag, text, img in orig:
        by_tag.setdefault(tag, []).append((text, img))
    seen = {}
    for tag, text, img in patched:
        i = seen.get(tag, 0)
        seen[tag] = i + 1
        before = by_tag.get(tag, [])
        if i >= len(before):
            continue
        otext, oimg = before[i]
        changed = (otext != text) or (oimg != img)
        if changed and tag not in expect_change and '%s#%d' % (tag, i + 1) not in expect_change:
            fails.append('%s #%d: changed (%r -> %r) but not declared in --expect-change' % (tag, i + 1, otext[:40], text[:40]))
        if tag.lower().startswith('tarikh') and 'hijrah' not in tag.lower() and text.strip() and not DATE_RE.match(text.strip()):
            fails.append('%s #%d: date %r is not in the Malay letter format (e.g. 19 Oktober 2026)' % (tag, i + 1, text.strip()))
    return fails


def check_alignment_boxes(sig, qr, name, tol=20.0):
    """sig/qr/name = (x0, y0, x1, y1) in PDF points, same page. Returns list of fails."""
    fails = []
    if sig is None:
        return ['signature image not found on the page']
    if qr is None:
        return ['QR image not found on the page']
    if name is None:
        return ['signer name line not found on the page']
    overlap = min(sig[3], qr[3]) - max(sig[1], qr[1])
    if overlap <= 0:
        fails.append('signature and QR are not on one row (signature y %.0f-%.0f, QR y %.0f-%.0f)' % (sig[1], sig[3], qr[1], qr[3]))
    if sig[2] > qr[0] + tol:
        fails.append('signature is not left of the QR (signature right %.0f, QR left %.0f)' % (sig[2], qr[0]))
    if name[1] < max(sig[3], qr[3]) - tol:
        fails.append('signer name is not below the signature and QR')
    if abs(sig[0] - name[0]) > tol:
        fails.append('signature left edge %.0f is not aligned with the name left edge %.0f' % (sig[0], name[0]))
    return fails


def find_boxes(pdf, name_text, sig_png):
    import fitz
    doc = fitz.open(pdf)
    want_ratio = None
    if sig_png:
        p = fitz.Pixmap(sig_png)
        want_ratio = p.width / float(p.height)
    for page in doc:
        hits = page.search_for(name_text) if name_text else []
        if not hits:
            continue
        name = tuple(hits[0])
        imgs = [tuple(i['bbox']) for i in page.get_image_info() if i['bbox'][1] < name[1] + 5]
        qr = [b for b in imgs if 0.85 < (b[2] - b[0]) / max(b[3] - b[1], 1) < 1.15]
        others = [b for b in imgs if b not in qr]
        if want_ratio:
            others = [b for b in others if abs((b[2] - b[0]) / max(b[3] - b[1], 1) - want_ratio) < 0.6]
        near = lambda b: name[1] - b[3]
        qr_box = min(qr, key=near) if qr else None
        sig_box = min(others, key=near) if others else None
        return sig_box, qr_box, name
    return None, None, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--letter', required=True)
    ap.add_argument('--original', required=True)
    ap.add_argument('--pdf')
    ap.add_argument('--expect-change', default='')
    ap.add_argument('--removed', default='')
    ap.add_argument('--allow-empty', default='')
    ap.add_argument('--signature')
    ap.add_argument('--log')
    a = ap.parse_args()
    split = lambda s: {x.strip() for x in s.split(',') if x.strip()}
    t0 = time.time()
    for p in (a.letter, a.original):
        if not os.path.isfile(p):
            print('BAD INPUT: missing ' + p)
            return 2
    patched, orig = sdts(a.letter), sdts(a.original)
    result = {}
    result['STANDARD'] = check_standard(orig, patched, split(a.expect_change), split(a.removed))
    result['DATA'] = check_data(patched, split(a.allow_empty))
    if a.pdf:
        if not os.path.isfile(a.pdf):
            result['ALIGNMENT'] = ['PDF not found: ' + a.pdf]
        elif os.path.getmtime(a.pdf) < os.path.getmtime(a.letter):
            result['ALIGNMENT'] = ['PDF is older than the letter: render the patched letter again']
        else:
            name = next((t.strip() for tag, t, _ in patched if tag == 'namaPengguna' and t.strip()), None)
            result['ALIGNMENT'] = check_alignment_boxes(*find_boxes(a.pdf, name, a.signature))
    else:
        result['ALIGNMENT'] = ['no --pdf given: render the patched letter and pass it']
    ok = all(not v for v in result.values())
    name = os.path.basename(a.letter)
    for k in ('STANDARD', 'ALIGNMENT', 'DATA'):
        print('%s %s %s' % (name, k, 'PASS' if not result[k] else 'FAIL'))
        for f in result[k]:
            print('   - ' + f)
    print('%s %s' % (name, 'PASS' if ok else 'FAIL'))
    if a.log:
        with open(a.log, 'a', encoding='utf8') as fh:
            fh.write(json.dumps({'ts': time.strftime('%Y-%m-%dT%H:%M:%S'), 'tool': 'letter-check', 'letter': name,
                                 'outcome': 'PASS' if ok else 'FAIL', 'goal_met': ok,
                                 'fails': {k: len(v) for k, v in result.items()},
                                 'dur_ms': int((time.time() - t0) * 1000)}) + '\n')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
