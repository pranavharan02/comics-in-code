// zp/core.js — drawing primitives tuned to the measured Zen Pencils line:
// crisp ink, median stroke ≈ 2.1 px, heavy contours ≈ 3 px, flat colour, almost no wobble.
// Line widths are ABSOLUTE page pixels: callers scale geometry, never the line (as in ZP, where
// a small figure and a close-up face share the same pen).
const I = require('../lib/ink');

const INK = '#070506';
const LW = { fine: 1.4, detail: 1.9, line: 2.3, contour: 2.8, heavy: 3.4 };

// stroke with ZP defaults: tiny taper at the ends, very little width variation, no hand-wobble
function line(pts, w = LW.line, o = {}) {
  I.ink(pts, w, { taper: o.taper || [0.08, 0.1], vary: o.vary ?? 0.06, wob: o.wob ?? 0.15, minW: o.minW ?? 0.35, ...o });
}
function closedLine(pts, w = LW.contour, o = {}) {
  I.ink(pts, w, { closed: true, vary: o.vary ?? 0.05, wob: o.wob ?? 0.15, ...o });
}
// filled shape with a uniform contour
function shape(pts, color, o = {}) {
  const p = I.wobble(pts, o.wob ?? 0.15);
  if (color) I.fill(p, color, { wob: 0, lin: o.lin, op: o.op });
  if (o.w !== 0) I.ink(p, o.w ?? LW.contour, { closed: true, wob: 0, lin: o.lin, vary: 0.05, color: o.ink });
  return p;
}

// capsule / limb along a polyline with per-point radius; flat fill + contour
function limb(pts, radii, color, o = {}) {
  const n = pts.length;
  const L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const r = radii[i];
    L.push([pts[i][0] - ty * r, pts[i][1] + tx * r]);
    Rr.push([pts[i][0] + ty * r, pts[i][1] - tx * r]);
  }
  // round caps
  const cap = (c, r, t0, dir) => {
    const out = [];
    for (let k = 1; k < 6; k++) {
      const a = t0 + dir * (k / 6) * Math.PI;
      out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
    }
    return out;
  };
  const a0 = Math.atan2(L[0][1] - pts[0][1], L[0][0] - pts[0][0]);
  const a1 = Math.atan2(Rr[n - 1][1] - pts[n - 1][1], Rr[n - 1][0] - pts[n - 1][0]);
  const outline = L.concat(o.capEnd === false ? [] : cap(pts[n - 1], radii[n - 1], Math.atan2(L[n - 1][1] - pts[n - 1][1], L[n - 1][0] - pts[n - 1][0]), -1), Rr.slice().reverse(), o.capStart === false ? [] : cap(pts[0], radii[0], a0 + Math.PI, -1));
  void a1;
  return shape(outline, color, { w: o.w ?? LW.line, wob: o.wob ?? 0.1, ink: o.ink });
}

function ellPts(cx, cy, rx, ry, n = 20, rot = 0) { return I.ell(cx, cy, rx, ry, n, rot); }

module.exports = { I, INK, LW, line, closedLine, shape, limb, ellPts };
