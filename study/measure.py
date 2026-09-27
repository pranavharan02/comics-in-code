"""measure.py — measure the visual style of a comic strip image with code.

Used two ways:
  1. over the Zen Pencils archive, to learn target distributions (study/zp_style_stats.json)
  2. over my own renders, by qc/score.py, to check them against those targets

Metrics (all in pixels at 980 px page width):
  geometry : page margin, horizontal/vertical gutters, panel border thickness, panel count,
             panel width fractions (full / half / third), panel aspect ratios
  ink      : stroke width distribution of dark lines (skeleton x distance transform), ink colour
  colour   : saturation / value of the coloured (non-ink, non-paper) pixels, number of dominant
             hues, share of the page that is flat colour vs white
  texture  : grain = median local std-dev of luminance inside flat colour regions
"""
import json, sys, os, glob
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.morphology import skeletonize
from skimage.color import rgb2hsv

W = 980


def load_strip(paths):
    ims = []
    for p in paths:
        im = Image.open(p)
        im.seek(0)
        im = im.convert('RGB')
        if im.width != W:
            im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
        ims.append(np.asarray(im))
    return np.concatenate(ims, axis=0)


def panels_of(rgb):
    """Panels = big connected non-paper regions. Paper = near-white connected to the page edge."""
    g = rgb.mean(axis=2)
    sat = rgb.max(axis=2).astype(int) - rgb.min(axis=2).astype(int)
    paper = (g > 238) & (sat < 18)
    # paper reachable from the page border = gutters/margins
    lab, _ = ndi.label(paper)
    border_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    gutter = np.isin(lab, list(border_labels))
    inside = ~gutter
    inside = ndi.binary_opening(inside, iterations=2)
    lab2, n = ndi.label(inside)
    boxes = []
    for i, sl in enumerate(ndi.find_objects(lab2)):
        if sl is None:
            continue
        h = sl[0].stop - sl[0].start
        w = sl[1].stop - sl[1].start
        area = (lab2[sl] == i + 1).sum()
        # a real panel is big and fills most of its bounding box (rectangular)
        if w > 120 and h > 80 and area > 0.80 * w * h:
            boxes.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
    return boxes, gutter


def _run(v):
    # dark run starting within the first 3 px (edges are anti-aliased)
    st = next((i for i in range(min(3, len(v))) if v[i] < 110), None)
    if st is None:
        return 0
    k = st
    while k < len(v) and v[k] < 110:
        k += 1
    return k - st


def border_thickness(rgb, box):
    x0, y0, x1, y1 = box
    g = rgb.mean(axis=2)
    runs = []
    for yy in np.linspace(y0 + (y1 - y0) * 0.25, y0 + (y1 - y0) * 0.75, 7).astype(int):
        runs.append(_run(g[yy, x0:min(x0 + 20, x1)]))
        runs.append(_run(g[yy, max(x1 - 20, x0):x1][::-1]))
    for xx in np.linspace(x0 + (x1 - x0) * 0.25, x0 + (x1 - x0) * 0.75, 7).astype(int):
        runs.append(_run(g[y0:min(y0 + 20, y1), xx]))
        runs.append(_run(g[max(y1 - 20, y0):y1, xx][::-1]))
    return float(np.median(runs))


def gutters(boxes):
    hs, vs = [], []
    for a in boxes:
        for b in boxes:
            if a is b:
                continue
            # side by side: y-overlap, b right of a
            if min(a[3], b[3]) - max(a[1], b[1]) > 40 and b[0] >= a[2]:
                gap = b[0] - a[2]
                if 2 <= gap <= 80:
                    hs.append(gap)
            # stacked: x-overlap, b below a
            if min(a[2], b[2]) - max(a[0], b[0]) > 40 and b[1] >= a[3]:
                gap = b[1] - a[3]
                if 2 <= gap <= 120:
                    vs.append(gap)
    return hs, vs


def ink_widths(rgb, mask):
    """Stroke width per 48x48 tile = dark area / skeleton length (continuous, not quantised)."""
    g = rgb.mean(axis=2)
    dark = (g < 80) & mask
    if dark.sum() < 500:
        return []
    # drop big solid black masses (hair, night skies) so they don't count as lines
    solid = ndi.binary_erosion(dark, iterations=5)
    solid = ndi.binary_dilation(solid, iterations=6)
    lines = dark & ~solid
    sk = skeletonize(lines)
    T = 48
    H, Wd = g.shape
    out = []
    for y in range(0, H - T, T):
        for x in range(0, Wd - T, T):
            a = lines[y:y + T, x:x + T].sum()
            l = sk[y:y + T, x:x + T].sum()
            if l >= 25:
                out.append(a / l)
    return np.array(out)


def colour_stats(rgb, mask):
    px = rgb[mask]
    if len(px) > 400000:
        px = px[np.random.default_rng(0).choice(len(px), 400000, replace=False)]
    hsv = rgb2hsv(px[None, :, :].astype(np.float64) / 255)[0]
    v, s, h = hsv[:, 2], hsv[:, 1], hsv[:, 0]
    ink = v < 0.22
    paper = (v > 0.93) & (s < 0.08)
    col = ~ink & ~paper
    out = {
        'ink_share': float(ink.mean()),
        'paper_share': float(paper.mean()),
        'colour_share': float(col.mean()),
    }
    if col.sum() > 1000:
        out['sat_median'] = float(np.median(s[col]))
        out['sat_p90'] = float(np.percentile(s[col], 90))
        out['val_median'] = float(np.median(v[col]))
        # dominant hues: 12 hue bins weighted by saturation, count bins with >6% of weight
        hb = (h[col] * 12).astype(int) % 12
        wts = np.bincount(hb, weights=s[col] + 0.05, minlength=12)
        wts = wts / wts.sum()
        out['dominant_hues'] = int((wts > 0.06).sum())
        out['low_sat_share'] = float((s[col] < 0.25).mean())
    return out


def grain(rgb, mask):
    g = rgb.mean(axis=2).astype(np.float64)
    gx = ndi.sobel(g, 0)
    gy = ndi.sobel(g, 1)
    edge = np.hypot(gx, gy)
    mean = ndi.uniform_filter(g, 7)
    sq = ndi.uniform_filter(g * g, 7)
    sd = np.sqrt(np.maximum(sq - mean * mean, 0))
    sat = rgb.max(axis=2).astype(int) - rgb.min(axis=2).astype(int)
    flat = mask & (ndi.maximum_filter(edge, 9) < 60) & (g < 235) & (g > 40) & (sat > 12)
    if flat.sum() < 2000:
        return None
    return float(np.median(sd[flat]))


def measure(paths):
    rgb = load_strip(paths)
    H = rgb.shape[0]
    boxes, gutter = panels_of(rgb)
    mask = ~gutter
    res = {'height': int(H), 'n_panels': len(boxes)}
    if boxes:
        xs0 = [b[0] for b in boxes]
        xs1 = [b[2] for b in boxes]
        res['margin_left'] = int(min(xs0))
        res['margin_right'] = int(W - max(xs1))
        content = max(xs1) - min(xs0)
        fr = [(b[2] - b[0]) / content for b in boxes]
        res['panel_width_fracs'] = [round(f, 3) for f in fr]
        res['panel_aspects'] = [round((b[2] - b[0]) / (b[3] - b[1]), 3) for b in boxes]
        res['border_px'] = float(np.median([border_thickness(rgb, b) for b in boxes]))
        hs, vs = gutters(boxes)
        res['gutter_h'] = float(np.median(hs)) if hs else None
        res['gutter_v'] = float(np.median(vs)) if vs else None
    w = ink_widths(rgb, mask)
    if len(w):
        res['ink_w'] = {str(p): float(np.percentile(w, p)) for p in (25, 50, 75, 90)}
        dark = rgb[(rgb.mean(axis=2) < 50) & mask]
        if len(dark):
            res['ink_rgb'] = [int(c) for c in np.median(dark, axis=0)]
    res.update(colour_stats(rgb, mask))
    res['grain'] = grain(rgb, mask)
    return res


if __name__ == '__main__':
    # usage: measure.py out.json img1 [img2 ...]   (images are stacked as one strip)
    out = sys.argv[1]
    r = measure(sys.argv[2:])
    json.dump(r, open(out, 'w'), indent=1)
    print(json.dumps({k: v for k, v in r.items() if not isinstance(v, list)}, indent=1))
