"""draw.py - drawing primitives for story-video (1920x1080 logical, 2x supersampled).
Trimmed from the accepted PLPS video's lib.py. Windows fonts (Segoe UI, Consolas)."""
import math
from PIL import Image, ImageDraw, ImageFont

W, H, S = 1920, 1080, 2
MINSZ = 26          # hard floor of the text() shrink loop
WARN_BELOW = 36     # a shrink below this is reported by render.py

# etanah Avalon green palette
G1 = (31, 142, 56)      # #1F8E38 primary
GM = (40, 167, 69)      # #28A745 tick
GD = (20, 97, 42)       # #14612A header
GL = (230, 246, 237)    # #E6F6ED tint
BG = (243, 248, 244)    # #F3F8F4 page
TX = (41, 43, 44)       # #292B2C text
MUTE = (104, 116, 108)
LINE = (190, 212, 198)
ERR = (217, 83, 79)     # #D9534F error
ERRL = (252, 232, 231)
WHITE = (255, 255, 255)

FP = {'r': 'C:/Windows/Fonts/segoeui.ttf', 'b': 'C:/Windows/Fonts/segoeuib.ttf',
      'm': 'C:/Windows/Fonts/consola.ttf', 'mb': 'C:/Windows/Fonts/consolab.ttf'}
_fc = {}
WARNINGS = []


def F(fk, size):
    k = (fk, int(round(size * S)))
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FP[fk], k[1])
    return _fc[k]


def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def ease(p):
    p = clamp(p)
    return 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def E(t, t0, t1):
    """eased progress of t between t0 and t1"""
    if t1 <= t0:
        return 1.0 if t >= t0 else 0.0
    return ease((t - t0) / (t1 - t0))


def lerp(a, b, p):
    return a + (b - a) * p


def mix(c1, c2, p):
    return tuple(int(round(lerp(a, b, p))) for a, b in zip(c1, c2))


class Canvas:
    def __init__(self, base):
        self.img = base.copy()
        self.d = ImageDraw.Draw(self.img)

    def layer(self, bbox, a, fn, force=False):
        x0, y0, x1, y1 = [int(v) for v in bbox]
        x0 = max(0, x0); y0 = max(0, y0)
        x1 = min(W * S, x1); y1 = min(H * S, y1)
        if x1 <= x0 or y1 <= y0:
            return
        if a >= 0.995 and not force:
            fn(self.d, 0, 0)
            return
        if a <= 0.01:
            return
        lay = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
        ld = ImageDraw.Draw(lay)
        fn(ld, x0, y0)
        if a < 0.995:
            lay.putalpha(lay.getchannel('A').point(lambda v: int(v * a)))
        reg = self.img.crop((x0, y0, x1, y1)).convert('RGBA')
        reg.alpha_composite(lay)
        self.img.paste(reg.convert('RGB'), (x0, y0))

    def final(self):
        return self.img.resize((W, H), Image.LANCZOS)


def shadow(c, x, y, w, h, r=18, a=1.0, strength=1.0):
    for dy, grow, al in ((11, 11, 9), (7, 6, 13), (4, 2, 18)):
        box = ((x - grow) * S, (y - grow + dy) * S, (x + w + grow) * S, (y + h + grow + dy) * S)

        def fn(d, ox, oy, box=box, al=al):
            d.rounded_rectangle((box[0] - ox, box[1] - oy, box[2] - ox, box[3] - oy),
                                radius=(r + 8) * S, fill=(15, 55, 28, int(al * strength)))
        c.layer((box[0] - 4, box[1] - 4, box[2] + 4, box[3] + 4), a, fn, force=True)


def rrect(c, x, y, w, h, r=16, fill=None, outline=None, ow=2, a=1.0, sh=False):
    if sh:
        shadow(c, x, y, w, h, r, a)
    box = (x * S, y * S, (x + w) * S, (y + h) * S)

    def fn(d, ox, oy):
        b = (box[0] - ox, box[1] - oy, box[2] - ox, box[3] - oy)
        if fill is not None:
            d.rounded_rectangle(b, radius=r * S, fill=fill)
        if outline is not None:
            d.rounded_rectangle(b, radius=r * S, outline=outline, width=int(ow * S))
    pad = int(ow * S) + 3
    c.layer((box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad), a, fn)


def tw(s, fk, size):
    return F(fk, size).getlength(s) / S


def text(c, x, y, s, fk='r', size=30, fill=TX, anchor='la', a=1.0, maxw=None):
    """draw text; with maxw the size shrinks until it fits (floor MINSZ). A shrink under WARN_BELOW is recorded."""
    size = max(size, MINSZ)
    if maxw:
        while F(fk, size).getlength(s) / S > maxw and size > MINSZ:
            size -= 1
        if size < WARN_BELOW:
            WARNINGS.append('text shrunk to %dpx: %s' % (size, s))
    f = F(fk, size)
    px, py = x * S, y * S
    bb = f.getbbox(s, anchor=anchor)

    def fn(d, ox, oy):
        d.text((px - ox, py - oy), s, font=f, fill=fill, anchor=anchor)
    c.layer((px + bb[0] - 8, py + bb[1] - 8, px + bb[2] + 8, py + bb[3] + 8), a, fn)
    return f.getlength(s) / S


def circle(c, cx, cy, r, fill=None, outline=None, ow=2, a=1.0):
    box = ((cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S)

    def fn(d, ox, oy):
        d.ellipse((box[0] - ox, box[1] - oy, box[2] - ox, box[3] - oy), fill=fill,
                  outline=outline, width=int(ow * S))
    pad = ow * S + 3
    c.layer((box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad), a, fn)


def line(c, pts, color=G1, w=4, a=1.0, arrow=False, head=18, prog=1.0):
    """polyline; prog 0..1 draws partially (arrow head only when prog>=0.999)"""
    P = [(px * S, py * S) for px, py in pts]
    if prog < 0.999:
        tot = sum(math.dist(P[i], P[i + 1]) for i in range(len(P) - 1))
        goal = tot * prog
        Q = [P[0]]
        acc = 0
        for i in range(len(P) - 1):
            sl = math.dist(P[i], P[i + 1])
            if acc + sl >= goal:
                f = (goal - acc) / sl if sl else 0
                Q.append((P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f))
                break
            Q.append(P[i + 1]); acc += sl
        P = Q; arrow = False
    if len(P) < 2:
        return
    xs = [p[0] for p in P]; ys = [p[1] for p in P]
    pad = (head + w + 6) * S
    bbox = (min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad)
    hd = head * S

    def fn(d, ox, oy):
        Q = [(px - ox, py - oy) for px, py in P]
        tip = None
        if arrow:
            (x0, y0), (x1, y1) = Q[-2], Q[-1]
            L = math.hypot(x1 - x0, y1 - y0) or 1
            ux, uy = (x1 - x0) / L, (y1 - y0) / L
            tip = (x1, y1, ux, uy)
            Q[-1] = (x1 - ux * hd * 0.8, y1 - uy * hd * 0.8)
        d.line(Q, fill=color, width=int(w * S), joint='curve')
        if tip:
            x1, y1, ux, uy = tip
            px, py = -uy, ux
            d.polygon([(x1, y1), (x1 - ux * hd + px * hd * 0.5, y1 - uy * hd + py * hd * 0.5),
                       (x1 - ux * hd - px * hd * 0.5, y1 - uy * hd - py * hd * 0.5)], fill=color)
    c.layer(bbox, a, fn)


def tick(c, cx, cy, s=12, color=GM, w=4, a=1.0):
    line(c, [(cx - s * 0.55, cy + s * 0.02), (cx - s * 0.12, cy + s * 0.45), (cx + s * 0.6, cy - s * 0.42)],
         color=color, w=w, a=a, head=0)


def cross(c, cx, cy, s=12, color=ERR, w=4, a=1.0):
    line(c, [(cx - s * 0.5, cy - s * 0.5), (cx + s * 0.5, cy + s * 0.5)], color=color, w=w, a=a, head=0)
    line(c, [(cx - s * 0.5, cy + s * 0.5), (cx + s * 0.5, cy - s * 0.5)], color=color, w=w, a=a, head=0)


def badge_tick(c, cx, cy, r=15, a=1.0, col=GM):
    circle(c, cx, cy, r, fill=col, a=a)
    tick(c, cx, cy, r * 0.95, WHITE, w=3, a=a)


def badge_cross(c, cx, cy, r=15, a=1.0):
    circle(c, cx, cy, r, fill=ERR, a=a)
    cross(c, cx, cy, r * 0.95, WHITE, w=3, a=a)
