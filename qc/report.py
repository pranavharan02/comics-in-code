"""report.py — write QC.md: every comic's measured style metrics next to the ZP distribution."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from score import score, CHECKS, AGG

COMICS = [('Up-Hill', 'out/up-hill.png'), ('The Great Ocean', 'out/the-great-ocean.png'), ('The Butterfly', 'out/the-butterfly.png'),
          ('Several Thousand Things', 'out/several-thousand-things.png'), ('Wobbling Will', 'out/wobbling-will.png')]
rows = {}
for name, p in COMICS:
    _, rs, fails = score(p)
    rows[name] = rs
lines = ['# Style QC: five comics vs 221 measured Zen Pencils strips', '',
         'Each metric is measured by `study/measure.py` on the rendered PNG and compared with the distribution over the whole',
         'Zen Pencils archive (`study/zp_style_stats.json`). **PASS** = inside ZP\'s middle 50% (25th–75th percentile),',
         '**OK** = inside the 10th–90th percentile, **FAIL** = outside it.', '',
         '| metric | ZP 10 / 25 / 50 / 75 / 90 | ' + ' | '.join(n for n, _ in COMICS) + ' |',
         '|---|---|' + '---|' * len(COMICS)]
for i, (key, _, label) in enumerate(CHECKS):
    a = AGG.get(key)
    band = ' / '.join(f'{a[q]:.2f}' for q in ('10', '25', '50', '75', '90')) if a else ''
    cells = []
    for n, _ in COMICS:
        lab, v, _, verdict = rows[n][i]
        cells.append('n/a' if v is None else f'{v:.2f} {verdict}')
    lines.append(f'| {label} | {band} | ' + ' | '.join(cells) + ' |')
lines += ['', 'Notes: *Up-Hill* and *The Great Ocean* are deliberately night-heavy (their colour scripts end in darkness),',
          'so their median brightness sits in the darkest tenth of Zen Pencils strips. Border thickness on dark panels',
          'can read high because the measurement merges a dark sky with the border.']
open(os.path.join(os.path.dirname(__file__), '..', 'docs', 'QC.md'), 'w').write('\n'.join(lines) + '\n')
print('\n'.join(lines))
