"""moodboard.py — arrange a comic's panels into a moodboard / collage image for social media.

usage: python3 tools/moodboard.py [landscape|portrait] [out.jpg]

Layout for "Every Line Alive": each panel is a print with a white border, a soft shadow, a slight
tilt and a strip of tape, pinned to warm paper around the finale. Boxes are (panel, centre x,
centre y, width, rotation) in a 1600x900 (or 1080x1350) design space, scaled to the output size.
"""
import os, sys, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, '..')
P = os.path.join(ROOT, 'out', 'every-line-alive')
FONTS = os.path.join(ROOT, 'fonts')
random.seed(1834)

LAYOUTS = {
    # design space 1600x900; output 3200x1800 (16:9, shown uncropped on X)
    'landscape': dict(size=(1600, 900), scale=2, title=(800, 62), sub=(800, 108), boxes=[
        ('13-one-hundred-and-ten', 800, 510, 600, -1.2),
        ('01-age-six', 262, 150, 420, 1.6),
        ('02-the-cat', 118, 325, 150, -3.0),
        ('03-the-goldfish', 268, 335, 150, 2.2),
        ('04-her-own-hand', 418, 322, 150, -1.5),
        ('05-fifty-published', 180, 500, 300, 1.8),
        ('06-fifty-nothing-worth-noticing', 392, 505, 170, -2.4),
        ('11-her-eyes', 262, 735, 440, -1.2),
        ('12-the-pause', 1300, 775, 270, 2.2),
        ('07-seventy-three', 1338, 150, 420, -1.4),
        ('08-eighty', 1194, 345, 150, 2.6),
        ('09-ninety', 1340, 352, 150, -1.8),
        ('10-one-hundred', 1486, 342, 150, 2.0),
        ('00-title', 1352, 575, 400, -1.0),
    ]),
    # design space 1080x1350; output 2160x2700 (4:5 portrait)
    'portrait': dict(size=(1080, 1350), scale=2, title=(540, 70), sub=(540, 118), boxes=[
        ('01-age-six', 290, 250, 470, 1.4),
        ('07-seventy-three', 790, 250, 470, -1.6),
        ('02-the-cat', 110, 440, 160, -2.6),
        ('03-the-goldfish', 290, 450, 160, 2.0),
        ('04-her-own-hand', 470, 438, 160, -1.4),
        ('08-eighty', 630, 448, 150, 2.4),
        ('09-ninety', 790, 455, 150, -2.0),
        ('10-one-hundred', 950, 446, 150, 1.6),
        ('05-fifty-published', 185, 660, 300, 1.6),
        ('06-fifty-nothing-worth-noticing', 185, 868, 200, -2.2),
        ('11-her-eyes', 190, 1045, 320, 1.0),
        ('12-the-pause', 185, 1200, 250, -2.0),
        ('13-one-hundred-and-ten', 702, 915, 690, -1.0),
    ]),
}

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

def paper(w, h):
    base = Image.new('RGB', (w, h), (243, 234, 215))
    noise = Image.effect_noise((w // 2, h // 2), 18).resize((w, h)).convert('L')
    tint = Image.new('RGB', (w, h), (225, 210, 180))
    base = Image.composite(base, tint, noise.point(lambda v: 200 + (v - 128) // 3))
    # soft vignette
    v = Image.new('L', (w, h), 0); d = ImageDraw.Draw(v)
    d.ellipse((-w * 0.2, -h * 0.25, w * 1.2, h * 1.25), fill=255)
    v = v.filter(ImageFilter.GaussianBlur(w // 10))
    dark = Image.new('RGB', (w, h), (205, 188, 155))
    return Image.composite(base, dark, v)

def print_of(img, wpx, border):
    h = round(img.height * wpx / img.width)
    im = img.resize((wpx, h), Image.LANCZOS)
    card = Image.new('RGBA', (wpx + 2 * border, h + 2 * border), (255, 253, 248, 255))
    card.paste(im, (border, border))
    return card

def tape(w, h, s):
    t = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
    d.rectangle((0, 0, w, h), fill=(246, 228, 170, 170))
    for x in range(0, w, max(2, 6 * s)):  # torn ends
        d.polygon([(x, 0), (x + 3 * s, 3 * s), (x + 6 * s, 0)], fill=(0, 0, 0, 0))
        d.polygon([(x, h), (x + 3 * s, h - 3 * s), (x + 6 * s, h)], fill=(0, 0, 0, 0))
    return t

def build(kind, out):
    L = LAYOUTS[kind]; S = L['scale']
    W, H = L['size'][0] * S, L['size'][1] * S
    canvas = paper(W, H).convert('RGBA')
    for name, cx, cy, wd, rot in L['boxes']:
        src = Image.open(os.path.join(P, name + '.png')).convert('RGB')
        border = 10 * S if name != '00-title' else 14 * S
        card = print_of(src, wd * S, border)
        # shadow
        sh = Image.new('RGBA', (card.width + 60 * S, card.height + 60 * S), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rectangle((30 * S, 30 * S, 30 * S + card.width, 30 * S + card.height), fill=(60, 40, 20, 90))
        sh = sh.filter(ImageFilter.GaussianBlur(9 * S)).rotate(rot, expand=True, resample=Image.BICUBIC)
        c2 = card.rotate(rot, expand=True, resample=Image.BICUBIC)
        X, Y = cx * S, cy * S
        canvas.alpha_composite(sh, (int(X - sh.width / 2 + 6 * S), int(Y - sh.height / 2 + 9 * S)))
        canvas.alpha_composite(c2, (int(X - c2.width / 2), int(Y - c2.height / 2)))
        # a strip of tape on the top edge
        tw, th = int(min(90, wd * 0.3) * S), 22 * S
        t = tape(tw, th, S).rotate(rot + random.uniform(-8, 8), expand=True, resample=Image.BICUBIC)
        canvas.alpha_composite(t, (int(X - t.width / 2 + random.uniform(-wd, wd) * 0.15 * S), int(Y - card.height / 2 - t.height / 2)))
    d = ImageDraw.Draw(canvas)
    tx, ty = L['title'][0] * S, L['title'][1] * S
    f = font('Bangers-Regular.ttf', 72 * S)
    title = 'EVERY LINE ALIVE'
    tw = d.textlength(title, font=f)
    for dx, dy, col in [(4 * S, 4 * S, (20, 40, 63)), (0, 0, (217, 83, 58))]:
        d.text((tx - tw / 2 + dx, ty - 44 * S + dy), title, font=f, fill=col, stroke_width=3 * S if dy == 0 else 0, stroke_fill=(7, 5, 6))
    fs = font('BalsamiqSans-Bold.ttf', 15 * S)
    sub = 'WORDS BY KATSUSHIKA HOKUSAI (1834)   ·   A COMIC DRAWN ENTIRELY IN CODE'
    d.text((L['sub'][0] * S - d.textlength(sub, font=fs) / 2, L['sub'][1] * S - 10 * S), sub, font=fs, fill=(60, 50, 45))
    canvas.convert('RGB').save(out, quality=93, subsampling=0)
    print('wrote', out, canvas.size)

if __name__ == '__main__':
    kind = sys.argv[1] if len(sys.argv) > 1 else 'landscape'
    build(kind, sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'out', f'every-line-alive-moodboard-{kind}.jpg'))
