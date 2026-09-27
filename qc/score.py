"""score.py — automated style check: measure a rendered comic and compare every metric with the
distribution measured over the 221 Zen Pencils strips (study/zp_style_stats.json).

  PASS  inside the ZP 25th–75th percentile band (the typical range)
  OK    inside the 10th–90th band
  FAIL  outside it

usage: python3 qc/score.py page.png [more.png ...]    (exit code 1 if any FAIL)
"""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'study'))
from measure import measure

HERE = os.path.dirname(__file__)
AGG = json.load(open(os.path.join(HERE, '..', 'study', 'zp_style_stats.json')))['aggregate']

CHECKS = [
    # metric, how to read it from a measurement, what it means
    ('margin_left', lambda r: r.get('margin_left'), 'page side margin (px)'),
    ('gutter_h', lambda r: r.get('gutter_h'), 'gutter between side-by-side panels'),
    ('gutter_v', lambda r: r.get('gutter_v'), 'gutter between rows'),
    ('border_px', lambda r: r.get('border_px'), 'panel border thickness'),
    ('ink_w50', lambda r: (r.get('ink_w') or {}).get('50'), 'median ink stroke width'),
    ('ink_w90', lambda r: (r.get('ink_w') or {}).get('90'), 'heavy (90th pct) ink stroke width'),
    ('sat_median', lambda r: r.get('sat_median'), 'colour saturation (median)'),
    ('val_median', lambda r: r.get('val_median'), 'colour brightness (median)'),
    ('dominant_hues', lambda r: r.get('dominant_hues'), 'number of dominant hues'),
    ('grain', lambda r: r.get('grain'), 'texture/grain in flat colour'),
    ('ink_share', lambda r: r.get('ink_share'), 'share of the page that is black ink'),
]


def score(path):
    r = measure([path])
    rows, fails = [], 0
    for key, get, label in CHECKS:
        v = get(r)
        a = AGG.get(key)
        if v is None or a is None:
            rows.append((label, v, None, 'n/a'))
            continue
        if a['25'] <= v <= a['75']:
            verdict = 'PASS'
        elif a['10'] <= v <= a['90']:
            verdict = 'OK'
        else:
            verdict = 'FAIL'
            fails += 1
        rows.append((label, v, a, verdict))
    return r, rows, fails


if __name__ == '__main__':
    total = 0
    for p in sys.argv[1:]:
        r, rows, fails = score(p)
        total += fails
        print(f'\n== {p}  ({r.get("n_panels")} panels, {r.get("height")} px tall)')
        print(f'{"metric":38s} {"value":>8s}   {"ZP 10/25/50/75/90":34s} verdict')
        for label, v, a, verdict in rows:
            band = '' if a is None else '/'.join(f'{a[q]:.2f}' for q in ('10', '25', '50', '75', '90'))
            vs = 'n/a' if v is None else f'{v:.2f}'
            print(f'{label:38s} {vs:>8s}   {band:34s} {verdict}')
    sys.exit(1 if total else 0)
