# eval for letter-check.py — synthetic letters only (no PROD data). run: python -I domain/patch-mlk-doc/letter-check.eval.py
import os, subprocess, sys, tempfile, time, zipfile, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('lc', os.path.join(HERE, 'letter-check.py'))
lc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lc)

NS = ('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"')


def sdt(tag, text='', img=False):
    body = '<w:drawing><wp:inline/></w:drawing>' if img else '<w:t xml:space="preserve">%s</w:t>' % text
    return ('<w:sdt><w:sdtPr><w:tag w:val="%s"/></w:sdtPr><w:sdtContent><w:r>%s</w:r></w:sdtContent></w:sdt>' % (tag, body))


def docx(path, parts):
    with zipfile.ZipFile(path, 'w') as z:
        z.writestr('word/document.xml', '<w:document %s><w:body>%s</w:body></w:document>' % (NS, ''.join(parts)))
    return path


TMP = tempfile.mkdtemp(prefix='letter-check-eval-')
BASE = [sdt('tarikh', '13 Julai 2026'), sdt('tarikhHijrah', '08 Jamadilawal 1448H'), sdt('tarikh', '13 Julai 2026'),
        sdt('namaPengguna', '(MOHD AZLAN)'), sdt('peranan', 'Penolong Pegawai Daerah'), sdt('qrKod', img=True),
        sdt('pejabat', ' '), sdt('namaPegawaiTandatangan', ' ')]
orig = lc.sdts(docx(os.path.join(TMP, 'orig.docx'), BASE))


def variant(name, repl=None, drop=None, add=None):
    parts = list(BASE)
    for i, p in (repl or {}).items():
        parts[i] = p
    if drop is not None:
        parts = [p for j, p in enumerate(parts) if j not in drop]
    parts += add or []
    return lc.sdts(docx(os.path.join(TMP, name + '.docx'), parts))


results = []


def case(cid, desc, got_fails, expect_fail):
    ok = bool(got_fails) == expect_fail
    results.append(ok)
    print('%s %-4s %s%s' % ('ok ' if ok else 'BAD', cid, desc, '' if ok else '  -> %r' % got_fails))


AE = {'pejabat', 'namaPegawaiTandatangan'}
# DATA
case('D1', 'peranan "-" fails', lc.check_data(variant('d1', {4: sdt('peranan', '-')}), AE), True)
case('D2', 'empty field not allowed fails', lc.check_data(variant('d2', {3: sdt('namaPengguna', ' ')}), AE), True)
case('D3', 'empty field on the allow list passes', lc.check_data(orig, AE), False)
case('D4', 'empty brackets fail', lc.check_data(variant('d4', {3: sdt('namaPengguna', 'NAMA ( )')}), AE), True)
case('D5', 'image tag with no image fails', lc.check_data(variant('d5', {5: sdt('qrKod', '')}), AE), True)
case('D6', 'image tag with an image passes', lc.check_data(orig, AE), False)
case('D7', '"null" fails', lc.check_data(variant('d7', {4: sdt('peranan', 'null')}), AE), True)
case('D8', 'signature tag empty and not allowed fails', lc.check_data(variant('d8', add=[sdt('tandatanganImej', '  ')]), AE), True)
# STANDARD
case('S1', 'undeclared change fails', lc.check_standard(orig, variant('s1', {3: sdt('namaPengguna', '(OTHER)')}), set(), set()), True)
case('S2', 'declared change passes', lc.check_standard(orig, variant('s2', {0: sdt('tarikh', '19 Oktober 2026')}), {'tarikh#1'}, set()), False)
case('S3', 'tag removed without --removed fails', lc.check_standard(orig, variant('s3', drop={7}), set(), set()), True)
case('S4', 'tag removed and declared passes', lc.check_standard(orig, variant('s4', drop={7}), set(), {'namaPegawaiTandatangan'}), False)
case('S5', 'ISO date fails the Malay format', lc.check_standard(orig, variant('s5', {0: sdt('tarikh', '2026-10-19')}), {'tarikh#1'}, set()), True)
case('S6', 'body date changed when only tarikh#1 declared fails', lc.check_standard(orig, variant('s6', {2: sdt('tarikh', '19 Oktober 2026')}), {'tarikh#1'}, set()), True)
case('S7', 'new tag not in the original fails', lc.check_standard(orig, variant('s7', add=[sdt('extra', 'x')]), set(), set()), True)
case('S8', 'Hijri date is not checked against the Malay format', lc.check_standard(orig, orig, set(), set()), False)
case('S9', 'English month fails', lc.check_standard(orig, variant('s9', {0: sdt('tarikh', '19 October 2026')}), {'tarikh#1'}, set()), True)
case('S10', 'no change at all passes', lc.check_standard(orig, orig, set(), set()), False)
# ALIGNMENT (PDF points: x0, y0, x1, y1)
NAME = (70, 250, 220, 262)
case('A1', 'signature above the QR row fails', lc.check_alignment_boxes((70, 56, 200, 122), (220, 134, 290, 209), NAME), True)
case('A2', 'signature and QR on one row, name below, left edges aligned passes', lc.check_alignment_boxes((70, 120, 200, 186), (220, 116, 290, 191), NAME), False)
case('A3', 'signature right of the QR fails', lc.check_alignment_boxes((300, 120, 430, 186), (220, 116, 290, 191), NAME), True)
case('A4', 'name above the signature fails', lc.check_alignment_boxes((70, 120, 200, 186), (220, 116, 290, 191), (70, 60, 220, 72)), True)
case('A5', 'signature indented away from the name fails', lc.check_alignment_boxes((140, 120, 270, 186), (290, 116, 360, 191), NAME), True)
case('A6', 'no signature on the page fails', lc.check_alignment_boxes(None, (220, 116, 290, 191), NAME), True)
case('A7', 'no QR on the page fails', lc.check_alignment_boxes((70, 120, 200, 186), None, NAME), True)
case('A8', 'no name line fails', lc.check_alignment_boxes((70, 120, 200, 186), (220, 116, 290, 191), None), True)
# CLI
script = os.path.join(HERE, 'letter-check.py')
r = subprocess.run([sys.executable, '-I', script, '--letter', os.path.join(TMP, 'missing.docx'), '--original', os.path.join(TMP, 'orig.docx')], capture_output=True, text=True)
case('C1', 'missing letter exits 2', [] if r.returncode == 2 else ['exit %d' % r.returncode], False)
good = os.path.join(TMP, 'orig.docx')
r = subprocess.run([sys.executable, '-I', script, '--letter', good, '--original', good, '--allow-empty', 'pejabat,namaPegawaiTandatangan'], capture_output=True, text=True)
case('C2', 'no --pdf fails ALIGNMENT (render is required)', [] if (r.returncode == 1 and 'no --pdf' in r.stdout) else ['exit %d %s' % (r.returncode, r.stdout)], False)
stale = os.path.join(TMP, 'stale.pdf')
open(stale, 'wb').write(b'%PDF-1.4')
os.utime(stale, (time.time() - 3600, time.time() - 3600))
r = subprocess.run([sys.executable, '-I', script, '--letter', good, '--original', good, '--pdf', stale, '--allow-empty', 'pejabat,namaPegawaiTandatangan'], capture_output=True, text=True)
case('C3', 'PDF older than the letter fails', [] if (r.returncode == 1 and 'older than the letter' in r.stdout) else ['exit %d %s' % (r.returncode, r.stdout)], False)

print('letter-check eval: %d/%d' % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
