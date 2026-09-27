"""Run measure.py over the whole downloaded Zen Pencils archive and aggregate."""
import json, glob, os, sys
from multiprocessing import Pool
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from measure import measure

ZP = sys.argv[1]  # folder of downloaded images: <slug>__<n>.<ext>

def job(item):
    slug, paths = item
    try:
        r = measure(paths); r['slug'] = slug; return r
    except Exception as e:
        return {'slug': slug, 'error': str(e)}

if __name__ == '__main__':
    groups = {}
    for p in sorted(glob.glob(os.path.join(ZP, '*'))):
        slug = os.path.basename(p).rsplit('__', 1)[0]
        groups.setdefault(slug, []).append(p)
    with Pool(8) as pool:
        rows = pool.map(job, sorted(groups.items()))
    agg = {}
    def col(f):
        v = [f(r) for r in rows if 'error' not in r]
        return [x for x in v if x is not None]
    keys = {
        'margin_left': lambda r: r.get('margin_left'), 'gutter_h': lambda r: r.get('gutter_h'),
        'gutter_v': lambda r: r.get('gutter_v'), 'border_px': lambda r: r.get('border_px'),
        'n_panels': lambda r: r.get('n_panels'), 'ink_w50': lambda r: (r.get('ink_w') or {}).get('50'),
        'ink_w90': lambda r: (r.get('ink_w') or {}).get('90'), 'sat_median': lambda r: r.get('sat_median'),
        'val_median': lambda r: r.get('val_median'), 'dominant_hues': lambda r: r.get('dominant_hues'),
        'low_sat_share': lambda r: r.get('low_sat_share'), 'grain': lambda r: r.get('grain'),
        'ink_share': lambda r: r.get('ink_share'), 'colour_share': lambda r: r.get('colour_share'),
    }
    for k, f in keys.items():
        v = np.array(col(f), dtype=float)
        if len(v):
            agg[k] = {q: float(np.percentile(v, q)) for q in (10, 25, 50, 75, 90)}
            agg[k]['n'] = int(len(v))
    fr = [f for r in rows for f in r.get('panel_width_fracs', [])]
    agg['panel_width_hist'] = {k: float(np.mean([(a > lo) and (a <= hi) for a in fr])) for k, (lo, hi) in
                               {'third': (0.2, 0.4), 'half': (0.4, 0.6), 'two_thirds': (0.6, 0.8), 'full': (0.8, 1.01)}.items()}
    json.dump({'aggregate': agg, 'strips': rows}, open(sys.argv[2], 'w'), indent=1)
    print(json.dumps(agg, indent=1))
