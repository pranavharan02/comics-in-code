# Style QC: five comics vs 221 measured Zen Pencils strips

Each metric is measured by `study/measure.py` on the rendered PNG and compared with the distribution over the whole
Zen Pencils archive (`study/zp_style_stats.json`). **PASS** = inside ZP's middle 50% (25th–75th percentile),
**OK** = inside the 10th–90th percentile, **FAIL** = outside it.

| metric | ZP 10 / 25 / 50 / 75 / 90 | Up-Hill | The Great Ocean | The Butterfly | Several Thousand Things | Wobbling Will |
|---|---|---|---|---|---|---|
| page side margin (px) | 36.00 / 47.00 / 48.00 / 49.00 / 57.00 | 48.00 PASS | 48.00 PASS | 48.00 PASS | 48.00 PASS | 48.00 PASS |
| gutter between side-by-side panels | 11.00 / 14.00 / 17.00 / 22.00 / 23.00 | 17.00 PASS | 17.00 PASS | 17.00 PASS | 17.00 PASS | 17.00 PASS |
| gutter between rows | 13.00 / 16.00 / 21.00 / 24.00 / 28.00 | 21.00 PASS | 21.00 PASS | 21.00 PASS | 21.00 PASS | 21.00 PASS |
| panel border thickness | 0.00 / 0.00 / 2.00 / 3.00 / 18.00 | 17.25 OK | 11.50 OK | 3.00 PASS | 3.00 PASS | 3.00 PASS |
| median ink stroke width | 1.70 / 1.90 / 2.10 / 2.34 / 2.60 | 2.19 PASS | 2.19 PASS | 2.22 PASS | 2.27 PASS | 2.12 PASS |
| heavy (90th pct) ink stroke width | 2.66 / 2.92 / 3.15 / 3.55 / 4.14 | 3.13 PASS | 3.28 PASS | 3.51 PASS | 3.00 PASS | 3.08 PASS |
| colour saturation (median) | 0.15 / 0.23 / 0.34 / 0.45 / 0.63 | 0.39 PASS | 0.59 OK | 0.31 PASS | 0.52 OK | 0.23 OK |
| colour brightness (median) | 0.53 / 0.63 / 0.72 / 0.81 / 0.89 | 0.51 FAIL | 0.46 FAIL | 0.66 PASS | 0.88 OK | 0.86 OK |
| number of dominant hues | 2.00 / 3.00 / 4.00 / 5.00 / 5.00 | 5.00 PASS | 3.00 PASS | 4.00 PASS | 2.00 OK | 5.00 PASS |
| texture/grain in flat colour | 0.00 / 0.75 / 1.41 / 2.42 / 3.84 | 1.56 PASS | 1.53 PASS | 2.17 PASS | 2.33 PASS | 2.72 OK |
| share of the page that is black ink | 0.01 / 0.09 / 0.16 / 0.22 / 0.30 | 0.10 PASS | 0.15 PASS | 0.16 PASS | 0.08 OK | 0.09 OK |

Notes: *Up-Hill* and *The Great Ocean* are deliberately night-heavy (their colour scripts end in darkness),
so their median brightness sits in the darkest tenth of Zen Pencils strips. Border thickness on dark panels
can read high because the measurement merges a dark sky with the border.
