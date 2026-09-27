"""share.py — lay Every Line Alive's panels out as images for sharing, in reading order.

usage:
  python3 tools/share.py thread   # four 16:9 images, one X post:   out/every-line-alive-thread/1..4.jpg
  python3 tools/share.py banner   # the README cover:               docs/readme/cover.jpg

Each panel is a print (white border, soft shadow, a strip of tape, a slight tilt) on warm paper, but
placed in rows like the page, so the story reads left to right, top to bottom. Row heights are solved
so every row fills the same width, and the width is solved so the rows fill the slide's height.
"""
import os, sys, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..')
P = os.path.join(ROOT, 'out', 'every-line-alive')
FONTS = os.path.join(ROOT, 'fonts')
S = 2                        # design units -> pixels
BORDER, GAP, ROWGAP = 9, 18, 22
INK, RED, NAVY = (7, 5, 6), (217, 83, 58), (20, 40, 63)

# the four images of the thread: rows of panels, or two columns (left rows, then a big right panel)
THREAD = [
    dict(rows=[['00-title'], ['01-age-six']]),
    dict(rows=[['02-the-cat', '03-the-goldfish', '04-her-own-hand'],
               ['05-fifty-published', '06-fifty-nothing-worth-noticing']]),
    dict(rows=[['07-seventy-three'], ['08-eighty', '09-ninety', '10-one-hundred']]),
    dict(left=[['11-her-eyes'], ['12-the-pause']], right='13-one-hundred-and-ten'),
]

_cache = {}
def panel(name):
    if name not in _cache:
        _cache[name] = Image.open(os.path.join(P, name + '.png')).convert('RGB')
    return _cache[name]

def aspect(name):
    im = panel(name); return im.width / im.height

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

def paper(w, h):
    base = Image.new('RGB', (w, h), (243, 234, 215))
    noise = Image.effect_noise((w // 2, h // 2), 18).resize((w, h)).convert('L')
    tint = Image.new('RGB', (w, h), (225, 210, 180))
    base = Image.composite(base, tint, noise.point(lambda v: 200 + (v - 128) // 3))
    v = Image.new('L', (w, h), 0)
    ImageDraw.Draw(v).ellipse((-w * 0.2, -h * 0.25, w * 1.2, h * 1.25), fill=255)
    v = v.filter(ImageFilter.GaussianBlur(w // 10))
    return Image.composite(base, Image.new('RGB', (w, h), (205, 188, 155)), v)

def tape(w, h):
    t = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
    d.rectangle((0, 0, w, h), fill=(246, 228, 170, 170))
    for x in range(0, w, 6 * S):  # torn ends
        d.polygon([(x, 0), (x + 3 * S, 3 * S), (x + 6 * S, 0)], fill=(0, 0, 0, 0))
        d.polygon([(x, h), (x + 3 * S, h - 3 * S), (x + 6 * S, h)], fill=(0, 0, 0, 0))
    return t

def pin(canvas, name, x, y, h, rot):
    """a print of `name` whose picture is h design units tall, top-left of its border at (x, y)"""
    src = panel(name)
    ih = round(h * S); iw = round(ih * src.width / src.height); b = BORDER * S
    card = Image.new('RGBA', (iw + 2 * b, ih + 2 * b), (255, 253, 248, 255))
    card.paste(src.resize((iw, ih), Image.LANCZOS), (b, b))
    cx, cy = x * S + card.width / 2, y * S + card.height / 2
    sh = Image.new('RGBA', (card.width + 60 * S, card.height + 60 * S), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rectangle((30 * S, 30 * S, 30 * S + card.width, 30 * S + card.height), fill=(60, 40, 20, 80))
    sh = sh.filter(ImageFilter.GaussianBlur(7 * S)).rotate(rot, expand=True, resample=Image.BICUBIC)
    c2 = card.rotate(rot, expand=True, resample=Image.BICUBIC)
    canvas.alpha_composite(sh, (int(cx - sh.width / 2 + 4 * S), int(cy - sh.height / 2 + 7 * S)))
    canvas.alpha_composite(c2, (int(cx - c2.width / 2), int(cy - c2.height / 2)))
    tw = int(min(80, card.width / S * 0.28) * S)
    t = tape(tw, 20 * S).rotate(rot + random.uniform(-6, 6), expand=True, resample=Image.BICUBIC)
    canvas.alpha_composite(t, (int(cx - t.width / 2 + random.uniform(-0.2, 0.2) * card.width), int(cy - card.height / 2 - t.height / 2)))

def row_height(row, width):
    """picture height that makes a row of prints exactly `width` wide"""
    return (width - GAP * (len(row) - 1) - 2 * BORDER * len(row)) / sum(aspect(n) for n in row)

def stack_height(rows, width):
    return sum(row_height(r, width) + 2 * BORDER for r in rows) + ROWGAP * (len(rows) - 1)

def fit_width(rows, height, max_width):
    """widest block of rows that fits `height` (stack height grows linearly with width)"""
    lo, hi = 50.0, max_width
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if stack_height(rows, mid) <= height else (lo, mid)
    return lo

def place_rows(canvas, rows, x0, y0, width):
    y = y0
    for r in rows:
        h = row_height(r, width); x = x0
        for n in r:
            pin(canvas, n, x, y, h, random.uniform(-0.9, 0.9))
            x += aspect(n) * h + 2 * BORDER + GAP
        y += h + 2 * BORDER + ROWGAP

def counter(canvas, W, H, i, n):
    d = ImageDraw.Draw(canvas)
    f = font('Bangers-Regular.ttf', 30 * S)
    s = f'{i}/{n}'
    d.text(((W - 30) * S - d.textlength(s, font=f), (H - 48) * S), s, font=f, fill=NAVY)

def slide(spec, i, n, out, W=1600, H=900, M=34):
    random.seed(1834 + i)
    canvas = paper(W * S, H * S).convert('RGBA')
    if 'rows' in spec:
        wd = fit_width(spec['rows'], H - 2 * M, W - 2 * 120)
        place_rows(canvas, spec['rows'], (W - wd) / 2, (H - stack_height(spec['rows'], wd)) / 2, wd)
    else:
        big = spec['right']; bh = H - 2 * M - 2 * BORDER - 70; bw = aspect(big) * bh + 2 * BORDER
        lw = W - 2 * 70 - bw - 40          # left column fills what's left
        lh = stack_height(spec['left'], lw)
        place_rows(canvas, spec['left'], 70, (H - lh) / 2, lw)
        pin(canvas, big, 70 + lw + 40, (H - bh) / 2 - BORDER, bh, -0.6)
    counter(canvas, W, H, i, n)
    canvas.convert('RGB').save(out, quality=93, subsampling=0)
    print('wrote', out, canvas.size)

def banner(out, W=1600, H=470):
    """the cover: her whole life as a staircase of prints, age six to one hundred and ten"""
    random.seed(6)
    canvas = paper(W * S, H * S).convert('RGBA')
    # prints grow with her: each one a little taller than the last, the finale tallest
    life = ['02-the-cat', '06-fifty-nothing-worth-noticing', '08-eighty', '09-ninety', '10-one-hundred']
    grow = [0.5 + 0.065 * i for i in range(len(life))] + [1.0]
    names = life + ['13-one-hundred-and-ten']
    top, bottom, side = 30, H - 30, 40
    width_at = lambda bh: sum(aspect(n) * g * bh + 2 * BORDER for n, g in zip(names, grow)) + GAP * len(life)
    bh = min(bottom - top - 2 * BORDER, (W - 2 * side - 2 * BORDER * len(names) - GAP * len(life)) /
             sum(aspect(n) * g for n, g in zip(names, grow)))
    x = (W - width_at(bh)) / 2
    for i, (n, g) in enumerate(zip(names, grow)):
        h = g * bh
        pin(canvas, n, x, bottom - h - 2 * BORDER, h, -0.8 if i == len(life) else random.uniform(-1.4, 1.4))
        x += aspect(n) * h + 2 * BORDER + GAP
    # the title sits in the space the staircase leaves, top left
    d = ImageDraw.Draw(canvas)
    f = font('Bangers-Regular.ttf', 84 * S)
    for dx, col, sw in [(5 * S, NAVY, 0), (0, RED, 3 * S)]:
        d.text((side * S + dx, 20 * S + dx), 'EVERY LINE ALIVE', font=f, fill=col, stroke_width=sw, stroke_fill=INK)
    fs = font('BalsamiqSans-Bold.ttf', 16 * S)
    for k, line in enumerate(['ONE ARTIST, ONE WINDOW, ONE MOUNTAIN, FROM AGE 6 TO 110.',
                              'WORDS BY KATSUSHIKA HOKUSAI (1834). DRAWN ENTIRELY IN CODE.']):
        d.text(((side + 3) * S, (122 + 24 * k) * S), line, font=fs, fill=(60, 50, 45))
    canvas.convert('RGB').save(out, quality=92, subsampling=0)
    print('wrote', out, canvas.size)

if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'thread'
    if what == 'thread':
        d = os.path.join(ROOT, 'out', 'every-line-alive-thread'); os.makedirs(d, exist_ok=True)
        for i, spec in enumerate(THREAD, 1):
            slide(spec, i, len(THREAD), os.path.join(d, f'{i}.jpg'))
    elif what == 'banner':
        banner(os.path.join(ROOT, 'docs', 'readme', 'cover.jpg'))
    else:
        sys.exit(__doc__)
