"""render.py - story-video renderer: a scenes JSON in, a 1920x1080 30 fps H.264/AAC MP4 out.

usage:
  python render.py <scenes.json> <out.mp4> [--music wav] [--contact sheet.png] [--dry] [--no-lint]
  python render.py <scenes.json> --frame <seconds> <out.png>       one frame, for a quick look
  --dry     draw the settled frame of every scene (surfaces text-shrink warnings), no video
  --contact also writes a contact sheet: 2 frames per scene (settled, and 1 s before the end)

Scene kinds drawn here: title, card, copy, steps, checklist, screen. The numbers (when a scene goes still, when its
caption is fully visible) are read from kinds.json, the same file lint.js checks against.
Animation only in the first ~2-3 s of a scene, then still; 0.6 s crossfades; fade from/to black.
"""
import argparse
import collections
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import draw as D                      # noqa: E402
from draw import (Canvas, E, G1, GD, GL, TX, MUTE, LINE, ERR, ERRL, WHITE, BG, W, H,  # noqa: E402
                  rrect, text, tw, line, circle, badge_tick, badge_cross, mix)

K = json.load(open(os.path.join(HERE, 'kinds.json'), encoding='utf-8'))
XF = K['timing']['crossfade_half']
FADE_IN, FADE_OUT, FPS = K['timing']['fade_in'], K['timing']['fade_out'], K['timing']['fps']
SLATE = (70, 86, 78)
BOTTOM = 860          # content stays above the caption box (880)

BASE = Image.new('RGB', (W * D.S, H * D.S), BG)
BASE_G = Image.new('RGB', (W * D.S, H * D.S), G1)
CTX = {'allowed': []}


# ---------------- shared pieces ----------------
def P(t, t0, t1):
    return E(t, t0, t1)


def head(c, sc, t):
    ah = P(t, 0.4, 1.4)
    text(c, 960, 150 + (1 - ah) * 20, sc['headline'], 'b', 80, GD, 'mm', a=ah, maxw=1760)
    if sc.get('detail'):
        text(c, 960, 238, sc['detail'], 'r', 40, SLATE, 'mm', a=P(t, 0.6, 1.6), maxw=1700)


def caption(c, sc, t):
    cf = K['kinds'][sc['kind']]['caption_full']
    a = P(t, cf - 0.6, cf)
    rrect(c, 120, 880, 1680, 130, r=26, fill=GL, a=a)
    text(c, 960, 945, sc['caption'], 'b', 48, TX, 'mm', a=a, maxw=1600)


def top_of(sc):
    return 300 if sc.get('detail') else 250


def y_center(sc, h):
    top = top_of(sc)
    return top + max(0, (BOTTOM - top - h)) / 2


def kv_width(k, v, size):
    return tw(k, 'mb', size) + tw(' = ', 'm', size) + tw(v, 'mb', size)


def mono_kv(c, cx, cy, size, k, v, kcol, vcol, a, maxw):
    while kv_width(k, v, size) > maxw and size > D.MINSZ:
        size -= 1
    if size < D.WARN_BELOW:
        D.WARNINGS.append('text shrunk to %dpx: %s = %s' % (size, k, v))
    wk, we, wv = tw(k, 'mb', size), tw(' = ', 'm', size), tw(v, 'mb', size)
    x = cx - (wk + we + wv) / 2
    text(c, x, cy, k, 'mb', size, kcol, 'lm', a=a)
    text(c, x + wk, cy, ' = ', 'm', size, MUTE, 'lm', a=a)
    text(c, x + wk + we, cy, v, 'mb', size, vcol, 'lm', a=a)


def card_h(n):
    return 88 + 40 + 80 * n


def draw_card(c, x, y, w, card, a, la=None, bad=False):
    """card = {title, lines:[str | {k,v}], bad}; title bar + 1-2 lines"""
    la = a if la is None else la
    bad = bad or card.get('bad', False)
    lines = card['lines']
    h = card_h(len(lines))
    hdr = ERR if bad else G1
    rrect(c, x, y, w, h, r=22, fill=ERRL if bad else WHITE, outline=ERR if bad else LINE, ow=3, a=a, sh=True)
    rrect(c, x + 1, y + 1, w - 2, 86, r=22, fill=hdr, a=a)
    rrect(c, x + 1, y + 50, w - 2, 38, r=0, fill=hdr, a=a)
    text(c, x + w / 2, y + 45, card['title'], 'b', 52, WHITE, 'mm', a=a, maxw=w - 60)
    body = h - 88
    for i, ln in enumerate(lines):
        cy = y + 88 + body * (i + 0.5) / len(lines)
        if isinstance(ln, dict):
            mono_kv(c, x + w / 2, cy, 52, ln['k'], ln['v'], ERR if bad else GD, ERR if bad else TX, la, w - 80)
        else:
            text(c, x + w / 2, cy, ln, 'b', 56, ERR if bad else TX, 'mm', a=la, maxw=w - 80)
    return h


def line_width(ln, size):
    return kv_width(ln['k'], ln['v'], size) if isinstance(ln, dict) else tw(ln, 'b', size)


def wrap2(s, fk, size, maxw):
    """1 line if it fits, else the best 2-line split"""
    if tw(s, fk, size) <= maxw:
        return [s]
    words = s.split()
    best = None
    for i in range(1, len(words)):
        a, b = ' '.join(words[:i]), ' '.join(words[i:])
        m = max(tw(a, fk, size), tw(b, fk, size))
        if best is None or m < best[0]:
            best = (m, [a, b])
    return best[1] if best else [s]


# ---------------- scene kinds ----------------
def scene_title(sc, t):
    c = Canvas(BASE_G)
    a1, a2 = P(t, 0.4, 1.4), P(t, 1.0, 2.0)
    text(c, 960, 460 + (1 - a1) * 24, sc['headline'], 'b', 104, WHITE, 'mm', a=a1, maxw=1700)
    line(c, [(760, 560), (1160, 560)], color=mix(G1, WHITE, 0.55), w=4, a=a2, head=0)
    if sc.get('detail'):
        text(c, 960, 640 + (1 - a2) * 24, sc['detail'], 'r', 56, GL, 'mm', a=a2, maxw=1700)
    return c.final()


def scene_card(sc, t):
    c = Canvas(BASE)
    head(c, sc, t)
    card = sc['card']
    w, h = 1200, card_h(len(card['lines']))
    y = y_center(sc, h)
    ac = P(t, 0.3, 1.3)
    draw_card(c, 360, y + (1 - ac) * 24, w, card, ac, la=P(t, 1.0, 1.8))
    caption(c, sc, t)
    return c.final()


def scene_copy(sc, t):
    c = Canvas(BASE)
    head(c, sc, t)
    fr, to = sc['from'], sc['to']
    lay = sc.get('layout', 'auto')
    if lay == 'auto':
        wide = max(line_width(l, 44) for cd in (fr, to) for l in cd['lines'])
        lay = 'horizontal' if wide <= 600 else 'vertical'
    pa = P(t, 0.4, 1.4)
    label = sc.get('label')
    if lay == 'vertical':
        w, x = 1100, 410
        h1, h2 = card_h(len(fr['lines'])), card_h(len(to['lines']))
        gap = 96
        y = y_center(sc, h1 + gap + h2) + 8
        draw_card(c, x, y, w, fr, P(t, 0.3, 1.3))
        ay0, ay1 = y + h1 + 12, y + h1 + gap - 12
        if pa > 0.01:
            line(c, [(960, ay0), (960, ay1)], color=G1, w=9, head=34, arrow=True, prog=pa)
        if label:
            text(c, 1010, (ay0 + ay1) / 2, label, 'b', 46, GD, 'lm', a=P(t, 0.4, 1.2))
        draw_card(c, x, y + h1 + gap, w, to, P(t, 0.8, 1.8))
    else:
        w, gapx = 720, 300
        x0 = (1920 - (2 * w + gapx)) / 2
        h = max(card_h(len(fr['lines'])), card_h(len(to['lines'])))
        y = y_center(sc, h)
        draw_card(c, x0, y, w, fr, P(t, 0.3, 1.3))
        ax0, ax1 = x0 + w + 20, x0 + w + gapx - 20
        if pa > 0.01:
            line(c, [(ax0, y + h / 2), (ax1, y + h / 2)], color=G1, w=9, head=34, arrow=True, prog=pa)
        if label:
            text(c, (ax0 + ax1) / 2, y + h / 2 - 46, label, 'b', 46, GD, 'mm', a=P(t, 0.4, 1.2))
        draw_card(c, x0 + w + gapx, y, w, to, P(t, 0.8, 1.8))
    caption(c, sc, t)
    return c.final()


def scene_steps(sc, t):
    c = Canvas(BASE)
    head(c, sc, t)
    steps = [s if isinstance(s, dict) else {'text': s} for s in sc['steps']]
    n = len(steps)
    bw, gap, bh = (500, 90, 270) if n == 3 else (640, 140, 270)
    x0 = (1920 - (n * bw + (n - 1) * gap)) / 2
    y = y_center(sc, bh)
    for i, st in enumerate(steps):
        t0 = 0.4 + 0.5 * i
        a = P(t, t0, t0 + 0.9)
        x, dy = x0 + i * (bw + gap), (1 - a) * 24
        bad = st.get('bad', False)
        rrect(c, x, y + dy, bw, bh, r=26, fill=ERRL if bad else WHITE, outline=ERR if bad else G1, ow=4, a=a, sh=True)
        size = 54
        ls = wrap2(st['text'], 'b', size, bw - 50)
        while max(tw(l, 'b', size) for l in ls) > bw - 50 and size > 40:
            size -= 2
            ls = wrap2(st['text'], 'b', size, bw - 50)
        if max(tw(l, 'b', size) for l in ls) > bw - 50:
            D.WARNINGS.append('step text too wide: %s' % st['text'])
        col = ERR if bad else GD
        if len(ls) == 1:
            text(c, x + bw / 2, y + dy + bh / 2, ls[0], 'b', size, col, 'mm', a=a)
        else:
            text(c, x + bw / 2, y + dy + bh / 2 - 36, ls[0], 'b', size, col, 'mm', a=a)
            text(c, x + bw / 2, y + dy + bh / 2 + 36, ls[1], 'b', size, col, 'mm', a=a)
        if bad:
            badge_cross(c, x + bw - 6, y + dy + 6, 30, a=a)
        if i < n - 1:
            aa = P(t, t0 + 0.4, t0 + 1.2)
            line(c, [(x + bw + 14, y + bh / 2 + dy), (x + bw + gap - 14, y + bh / 2 + dy)],
                 color=G1, w=8, head=28, arrow=True, a=aa)
    caption(c, sc, t)
    return c.final()


def segments(s):
    """split a checklist line into plain text and allowed-term chips"""
    terms = sorted([a for a in CTX['allowed'] if a], key=len, reverse=True)
    if not terms:
        return [(s, 'n')]
    parts = re.split('(' + '|'.join(re.escape(a) for a in terms) + ')', s)
    return [(p, 'k' if p in terms else 'n') for p in parts if p]


def seg_width(segs, size):
    return sum((tw(p, 'mb', size) + 28 + 14) if k == 'k' else tw(p, 'b', size + 4) for p, k in segs)


def scene_checklist(sc, t):
    c = Canvas(BASE)
    head(c, sc, t)
    items = sc['items']
    n = len(items)
    rh, gp, fs = (140, 40, 52) if n <= 3 else (112, 24, 48)
    total = n * rh + (n - 1) * gp
    y0 = y_center(sc, total)
    rx, rw = 400, 1120
    avail = rw - 170 - 40
    for i, s in enumerate(items):
        t0 = 0.4 + 0.5 * i
        a = P(t, t0, t0 + 0.9)
        y = y0 + i * (rh + gp) + (1 - a) * 24
        rrect(c, rx, y, rw, rh, r=26, fill=WHITE, outline=LINE, ow=3, a=a, sh=True)
        badge_tick(c, rx + 84, y + rh / 2, 36 if n <= 3 else 32, a=a)
        segs = segments(s)
        size = fs
        while seg_width(segs, size) > avail and size > D.MINSZ:
            size -= 1
        if size < D.WARN_BELOW:
            D.WARNINGS.append('text shrunk to %dpx: %s' % (size, s))
        x = rx + 170
        for p, k in segs:
            if k == 'k':
                wd = tw(p, 'mb', size)
                x += 14
                rrect(c, x - 14, y + 26 if n <= 3 else y + 20, wd + 28, rh - (52 if n <= 3 else 40), r=14, fill=GL, a=a)
                text(c, x, y + rh / 2, p, 'mb', size, GD, 'lm', a=a)
                x += wd + 28
            else:
                text(c, x, y + rh / 2, p, 'b', size + 4, TX, 'lm', a=a)
                x += tw(p, 'b', size + 4)
    caption(c, sc, t)
    return c.final()


def scene_screen(sc, t):
    c = Canvas(BASE)
    head(c, sc, t)
    s = sc['screen']
    vals = s['values']
    n = len(vals)
    wx, ww, hh, rowh = 300, 1320, 96, 120
    wh = hh + 40 + rowh * n + 20
    wy = y_center(sc, wh)
    ac = P(t, 0.3, 1.3)
    dy = (1 - ac) * 24
    rrect(c, wx, wy + dy, ww, wh, r=22, fill=WHITE, outline=LINE, ow=3, a=ac, sh=True)
    rrect(c, wx + 1, wy + 1 + dy, ww - 2, hh, r=22, fill=G1, a=ac)
    rrect(c, wx + 1, wy + 1 + dy + hh - 46, ww - 2, 46, r=0, fill=G1, a=ac)
    for k in range(3):
        circle(c, wx + 54 + k * 40, wy + dy + hh / 2, 10, fill=mix(G1, WHITE, 0.55), a=ac)
    text(c, wx + 200, wy + dy + hh / 2, s['title'], 'b', 48, WHITE, 'lm', a=ac, maxw=ww - 260)
    for i, v in enumerate(vals):
        a = P(t, 0.9 + 0.5 * i, 1.7 + 0.5 * i)
        ry = wy + hh + 30 + i * rowh
        cy = ry + rowh / 2 + (1 - a) * 12
        if i > 0:
            line(c, [(wx + 50, ry), (wx + ww - 50, ry)], color=LINE, w=2, a=a, head=0)
        text(c, wx + 70, cy, v['label'], 'r', 46, MUTE, 'lm', a=a, maxw=470)
        vx, bad = wx + 560, v.get('bad', False)
        if bad:
            wv = min(tw(v['value'], 'b', 56), ww - 560 - 120)
            rrect(c, vx - 20, cy - 40, wv + 40, 80, r=16, fill=ERRL, a=a)
        text(c, vx, cy, v['value'], 'b', 56, ERR if bad else TX, 'lm', a=a, maxw=ww - 560 - 100)
    caption(c, sc, t)
    return c.final()


DRAW = {'title': scene_title, 'card': scene_card, 'copy': scene_copy,
        'steps': scene_steps, 'checklist': scene_checklist, 'screen': scene_screen}


# ---------------- timeline ----------------
class Timeline:
    def __init__(self, doc):
        CTX['allowed'] = doc.get('allowed_terms', [])
        self.sc = doc['scenes']
        self.dur = [float(s['seconds']) for s in self.sc]
        self.start = [sum(self.dur[:i]) for i in range(len(self.sc))]
        self.total = sum(self.dur)
        self.anim_end = [K['kinds'][s['kind']]['anim_end'] for s in self.sc]
        self.static = {}
        self.anim = collections.OrderedDict()

    def scene_frame(self, k, t):
        ae = self.anim_end[k]
        if t >= ae:
            if k not in self.static:
                self.static[k] = np.asarray(DRAW[self.sc[k]['kind']](self.sc[k], ae))
            return self.static[k]
        if t < 0.25:
            key = (k, 0)
            if key not in self.anim:
                self.anim[key] = np.asarray(DRAW[self.sc[k]['kind']](self.sc[k], 0.0))
            return self.anim[key]
        key = (k, round(t, 3))
        if key not in self.anim:
            self.anim[key] = np.asarray(DRAW[self.sc[k]['kind']](self.sc[k], t))
            while len(self.anim) > 8:
                self.anim.popitem(last=False)
        return self.anim[key]

    def frame_at(self, g):
        n = len(self.sc)
        k = max(i for i in range(n) if self.start[i] <= g + 1e-9)
        f = self.scene_frame(k, g - self.start[k]).astype(np.float32)
        if k < n - 1 and g > self.start[k] + self.dur[k] - XF:
            p = E(g, self.start[k] + self.dur[k] - XF, self.start[k] + self.dur[k] + XF)
            f = f * (1 - p) + self.scene_frame(k + 1, g - self.start[k + 1]).astype(np.float32) * p
        elif k > 0 and g < self.start[k] + XF:
            p = E(g, self.start[k] - XF, self.start[k] + XF)
            f = self.scene_frame(k - 1, g - self.start[k - 1]).astype(np.float32) * (1 - p) + f * p
        if g < FADE_IN:
            f = f * E(g, 0, FADE_IN)
        if g > self.total - FADE_OUT:
            f = f * (1 - E(g, self.total - FADE_OUT, self.total))
        return f

    def still(self, k, t):
        """scene k at local second t, no crossfade (for contact sheets and checks)"""
        return Image.fromarray(np.asarray(DRAW[self.sc[k]['kind']](self.sc[k], min(t, self.anim_end[k]))))


def contact(tl, path, tile_w=800):
    th = int(tile_w * 9 / 16)
    rows = len(tl.sc)
    sheet = Image.new('RGB', (2 * tile_w + 10, rows * th + (rows - 1) * 10), (120, 120, 120))
    for k in range(rows):
        for col, t in enumerate((tl.anim_end[k] + 0.4, tl.dur[k] - 1.0)):
            im = tl.still(k, t).resize((tile_w, th), Image.LANCZOS)
            sheet.paste(im, (col * (tile_w + 10), k * (th + 10)))
    sheet.save(path)


def run_lint(path):
    r = subprocess.run(['node', os.path.join(HERE, 'lint.js'), path], capture_output=True, text=True)
    sys.stdout.write(r.stdout)
    sys.stderr.write(r.stderr)
    return r.returncode


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('scenes')
    ap.add_argument('out', nargs='?')
    ap.add_argument('--music')
    ap.add_argument('--contact')
    ap.add_argument('--frame', type=float)
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--no-lint', action='store_true')
    a = ap.parse_args()
    if not a.no_lint and run_lint(a.scenes) != 0:
        sys.exit('render: lint failed, nothing drawn')
    doc = json.load(open(a.scenes, encoding='utf-8'))
    tl = Timeline(doc)

    if a.frame is not None:
        if not a.out:
            sys.exit('render: --frame needs an output .png')
        im = Image.fromarray(np.clip(tl.frame_at(a.frame) + 0.5, 0, 255).astype(np.uint8))
        im.save(a.out)
        print('frame saved', a.out)
    elif a.dry or not a.out:
        for k in range(len(tl.sc)):
            tl.still(k, tl.anim_end[k])
        if a.contact:
            contact(tl, a.contact)
            print('contact saved', a.contact)
    else:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        wav, tmp = a.music, None
        if not wav:
            tmp = tempfile.mkdtemp(prefix='sv-music-')
            wav = os.path.join(tmp, 'music.wav')
            sys.path.insert(0, HERE)
            from music import make_music
            make_music(tl.total, wav)
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '1920x1080',
               '-r', str(FPS), '-i', '-', '-i', wav, '-t', str(tl.total),
               '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p',
               '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', a.out]
        pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        n = int(round(tl.total * FPS))
        for i in range(n):
            pr.stdin.write(np.clip(tl.frame_at(i / FPS) + 0.5, 0, 255).astype(np.uint8).tobytes())
            if i % 150 == 0:
                print('frame', i, '/', n, flush=True)
        pr.stdin.close()
        rc = pr.wait()
        if tmp:
            try:
                os.remove(wav); os.rmdir(tmp)
            except OSError:
                pass
        if rc != 0:
            sys.exit('render: ffmpeg failed (%d)' % rc)
        print('done', a.out, '%.1f s' % tl.total)
        try:  # log.jsonl: one row per render (system-rules Rule 5); never blocks a render
            import time
            with open(os.path.join(HERE, 'log.jsonl'), 'a', encoding='utf-8') as lg:
                lg.write(json.dumps({'ts': time.strftime('%Y-%m-%dT%H:%M:%S'), 'scenes': len(tl.sc), 'seconds': tl.total,
                                     'ticket': doc.get('ticket'), 'out': os.path.basename(a.out),
                                     'warnings': len(set(D.WARNINGS))}) + '\n')
        except OSError:
            pass
        if a.contact:
            contact(tl, a.contact)
            print('contact saved', a.contact)
    for w in dict.fromkeys(D.WARNINGS):
        print('WARN', w)
    if D.WARNINGS:
        sys.exit(3)


if __name__ == '__main__':
    main()
