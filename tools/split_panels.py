"""split_panels.py — cut a rendered comic page into one image per panel.

usage: python3 tools/split_panels.py page.png out_dir [--scale 2] [--title-height 312]

Panels are found with the same detector used by the style study (study/measure.py): big,
rectangular non-white regions. Pass a page rendered at a higher pixel scale (lib/render.js ... 2)
together with --scale 2 for sharper crops; detection runs on a 980 px-wide copy.
"""
import argparse, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'study'))
from measure import panels_of

ap = argparse.ArgumentParser()
ap.add_argument('page'); ap.add_argument('out_dir')
ap.add_argument('--scale', type=float, default=1); ap.add_argument('--title-height', type=int, default=0)
ap.add_argument('--pad', type=int, default=3)
a = ap.parse_args()
im = Image.open(a.page).convert('RGB')
small = im.resize((980, round(im.height * 980 / im.width))) if im.width != 980 else im
boxes, _ = panels_of(np.asarray(small))
boxes = [b for b in boxes if b[1] >= a.title_height]
boxes.sort(key=lambda b: (round(b[1] / 40), b[0]))
os.makedirs(a.out_dir, exist_ok=True)
k = im.width / 980
if a.title_height:
    im.crop((0, 0, im.width, round(a.title_height * k))).save(os.path.join(a.out_dir, '00-title.png'))
for i, (x0, y0, x1, y1) in enumerate(boxes, 1):
    p = a.pad
    im.crop((round((x0 - p) * k), round((y0 - p) * k), round((x1 + p) * k), round((y1 + p) * k))).save(os.path.join(a.out_dir, f'{i:02d}.png'))
print(f'{len(boxes)} panels -> {a.out_dir}')
