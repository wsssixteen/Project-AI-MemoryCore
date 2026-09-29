#!/usr/bin/env python
# fix-photo/mark.py — draw red boxes + short labels on a BA screenshot and save it as a fix photo.
#
# Usage:
#   python domain/fix-photo/mark.py --src <BA screenshot> --dst "<...>\2. Fix\<n>. <KOD> - <what changed>.png"
#          --box "x0,y0,x1,y1" [--box ...] --label "x,y=Label text" [--label ...]
#
# Output: WARN lines (clamped box, shifted label, bad folder/name, date/email in label), then
#         FIX-PHOTO: <dst> ✓   ← paste this line into the hand-back (fix-photo Stop gate checks it).
# Exit:   0 saved · 2 bad input (nothing saved).
# Log:    domain/fix-photo/log.jsonl (retention: rotate monthly) — ts · dst · boxes · labels · warns · outcome · dur_ms.
import argparse, json, os, re, sys, time
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.environ.get('FIX_PHOTO_LOG') or os.path.join(HERE, 'log.jsonl')
RED = (220, 0, 0)
WHITE = (255, 255, 255)
NAME_RE = re.compile(r'^\d+\. [A-Z0-9]+ - .+\.png$')
LEAK_RE = re.compile(r'\d{4}-\d{2}-\d{2}|\b\d{1,2}/\d{1,2}/\d{2,4}\b|@')


def log(row):
    try:
        with open(LOG, 'a', encoding='utf-8') as f:
            f.write(json.dumps(row, ensure_ascii=False) + '\n')
    except OSError:
        pass


def fail(msg, t0, dst):
    print('ERROR: ' + msg)
    log({'ts': datetime.now(timezone.utc).isoformat(), 'dst': dst, 'outcome': 'error', 'error': msg,
         'dur_ms': int((time.time() - t0) * 1000)})
    sys.exit(2)


def parse_box(s):
    parts = [p.strip() for p in s.split(',')]
    if len(parts) != 4:
        raise ValueError('box needs 4 numbers x0,y0,x1,y1: ' + s)
    x0, y0, x1, y1 = (int(float(p)) for p in parts)
    return (min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))


def parse_label(s):
    if '=' not in s:
        raise ValueError('label needs "x,y=text": ' + s)
    xy, text = s.split('=', 1)
    parts = [p.strip() for p in xy.split(',')]
    if len(parts) != 2 or not text.strip():
        raise ValueError('label needs "x,y=text": ' + s)
    return (int(float(parts[0])), int(float(parts[1]))), text.strip()


def main():
    t0 = time.time()
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser(description='Red-box fix photo from a BA screenshot')
    ap.add_argument('--src', required=True)
    ap.add_argument('--dst', required=True)
    ap.add_argument('--box', action='append', default=[])
    ap.add_argument('--label', action='append', default=[])
    ap.add_argument('--font-size', type=int, default=15)
    a = ap.parse_args()

    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        fail('Pillow is not installed (pip install pillow)', t0, a.dst)

    if not os.path.isfile(a.src):
        fail('source screenshot not found: ' + a.src, t0, a.dst)
    if not a.box:
        fail('at least one --box is required (the area the fix changes)', t0, a.dst)
    if not a.dst.lower().endswith('.png'):
        fail('destination must be a .png file: ' + a.dst, t0, a.dst)
    dst_dir = os.path.dirname(os.path.abspath(a.dst))
    if not os.path.isdir(dst_dir):
        fail('destination folder does not exist (create the cycle "2. Fix" folder first): ' + dst_dir, t0, a.dst)

    try:
        boxes = [parse_box(b) for b in a.box]
        labels = [parse_label(l) for l in a.label]
    except ValueError as e:
        fail(str(e), t0, a.dst)

    warns = []
    if not re.search(r'[\\/]2\. Fix$', dst_dir):
        warns.append('destination is not a "2. Fix" folder — fix photos belong in the cycle 2. Fix folder')
    if not NAME_RE.match(os.path.basename(a.dst)):
        warns.append('file name should look like "<n>. <TUGASAN KOD> - <what changed>.png"')

    try:
        im = Image.open(a.src).convert('RGB')
    except Exception as e:  # unreadable / not an image
        fail('cannot open source as an image: ' + str(e), t0, a.dst)
    W, H = im.size
    d = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype(os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts', 'arialbd.ttf'), a.font_size)
    except OSError:
        font = ImageFont.load_default()

    for i, (x0, y0, x1, y1) in enumerate(boxes):
        cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(W - 1, x1), min(H - 1, y1)
        if (cx0, cy0, cx1, cy1) != (x0, y0, x1, y1):
            warns.append('box %d clamped to image %dx%d' % (i + 1, W, H))
        if cx1 - cx0 < 4 or cy1 - cy0 < 4:
            fail('box %d is outside the image or too small after clamping' % (i + 1), t0, a.dst)
        d.rectangle((cx0, cy0, cx1, cy1), outline=RED, width=4)

    for i, ((x, y), text) in enumerate(labels):
        if LEAK_RE.search(text):
            warns.append('label %d carries a date or email — labels must be clinical (no names/dates)' % (i + 1))
        tb = d.textbbox((x, y), text, font=font)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        nx = min(max(6, x), max(6, W - tw - 8))
        ny = min(max(6, y), max(6, H - th - 8))
        if (nx, ny) != (x, y):
            warns.append('label %d shifted to stay inside the image' % (i + 1))
        tb = d.textbbox((nx, ny), text, font=font)
        d.rectangle((tb[0] - 6, tb[1] - 4, tb[2] + 6, tb[3] + 4), fill=WHITE, outline=RED, width=2)
        d.text((nx, ny), text, fill=RED, font=font)

    existed = os.path.exists(a.dst)
    im.save(a.dst, 'PNG')
    for w in warns:
        print('WARN: ' + w)
    if existed:
        print('NOTE: overwrote existing ' + a.dst)
    print('FIX-PHOTO: %s \u2713' % os.path.abspath(a.dst))
    print('NEXT: open the saved file and look at it before handing back')
    log({'ts': datetime.now(timezone.utc).isoformat(), 'dst': os.path.abspath(a.dst), 'boxes': len(boxes),
         'labels': len(labels), 'warns': len(warns), 'outcome': 'saved', 'dur_ms': int((time.time() - t0) * 1000)})


if __name__ == '__main__':
    main()
