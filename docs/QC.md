# Style QC: five comics vs 221 measured Zen Pencils strips

Each metric is measured by `study/measure.py` on the rendered PNG and compared with the distribution over the whole
Zen Pencils archive (`study/zp_style_stats.json`). **PASS** = inside ZP's middle 50% (25th–75th percentile),
**OK** = inside the 10th–90th percentile, **FAIL** = outside it.

| metric | ZP 10 / 25 / 50 / 75 / 90 | Up-Hill | The Great Ocean | The Butterfly | Several Thousand Things | Wobbling Will |
|---|---|---|---|---|---|---|
| page side margin (px) | 36.00 / 47.00 / 48.00 / 49.00 / 57.00 | 47.00 PASS | 47.00 PASS | 47.00 PASS | 47.00 PASS | 47.00 PASS |
| gutter between side-by-side panels | 11.00 / 14.00 / 17.00 / 22.00 / 23.00 | 15.00 PASS | 15.50 PASS | 15.00 PASS | 15.00 PASS | 15.00 PASS |
| gutter between rows | 13.00 / 16.00 / 21.00 / 24.00 / 28.00 | 19.50 PASS | 20.00 PASS | 19.00 PASS | 19.00 PASS | 19.00 PASS |
| panel border thickness | 0.00 / 0.00 / 2.00 / 3.00 / 18.00 | 3.00 PASS | 12.00 OK | 3.00 PASS | 3.00 PASS | 2.00 PASS |
| median ink stroke width | 1.70 / 1.90 / 2.10 / 2.34 / 2.60 | 2.08 PASS | 2.28 PASS | 2.34 PASS | 2.18 PASS | 2.03 PASS |
| heavy (90th pct) ink stroke width | 2.66 / 2.92 / 3.15 / 3.55 / 4.14 | 3.20 PASS | 3.37 PASS | 3.20 PASS | 3.21 PASS | 3.01 PASS |
| colour saturation (median) | 0.15 / 0.23 / 0.34 / 0.45 / 0.63 | 0.37 PASS | 0.59 OK | 0.40 PASS | 0.39 PASS | 0.20 OK |
| colour brightness (median) | 0.53 / 0.63 / 0.72 / 0.81 / 0.89 | 0.60 OK | 0.64 PASS | 0.73 PASS | 0.81 PASS | 0.80 PASS |
| number of dominant hues | 2.00 / 3.00 / 4.00 / 5.00 / 5.00 | 5.00 PASS | 4.00 PASS | 4.00 PASS | 4.00 PASS | 4.00 PASS |
| texture/grain in flat colour | 0.00 / 0.75 / 1.41 / 2.42 / 3.84 | 1.72 PASS | 1.90 PASS | 1.37 PASS | 1.63 PASS | 2.47 OK |
| share of the page that is black ink | 0.01 / 0.09 / 0.16 / 0.22 / 0.30 | 0.10 PASS | 0.08 OK | 0.10 PASS | 0.13 PASS | 0.11 PASS |

Notes: *Up-Hill* and *The Great Ocean* are night-heavy by design (their colour scripts end in darkness);
after the rework their median brightness sits inside the Zen Pencils range. Border thickness on dark panels
can read high because the measurement merges a dark sky with the border.
