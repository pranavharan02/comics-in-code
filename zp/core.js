// zp/core.js — drawing primitives tuned to the measured Zen Pencils line:
// brush-pen ink (tapered ends, gentle width swell, a little hand wobble), flat colour with one cel
// shadow per form, median stroke ≈ 2.1 px, heavy contours ≈ 3 px.
// Line widths are page pixels. Characters scale their pen mildly with drawing size: lw(w, s).
const I = require('../lib/ink');

const INK = '#070506';
const LW = { fine: 1.4, detail: 1.9, line: 2.3, contour: 2.8, heavy: 3.4 };
// light from upper-left-front: a shape's lit copy is shifted this way, leaving a shadow on the far side
const LIGHT = { lx: 7, ly: -6 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// scale-aware pen: s = head radius px / 30
const lw = (w, s = 1) => w * clamp(s, 0.8, 2);

// ---- colour -----------------------------------------------------------------------------------
function hex2rgb(c) { return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255); }
function rgb2hex(r) { return '#' + r.map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join(''); }
function rgb2hsl([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hsl2rgb([h, s, l]) {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}
// cel-shadow colour: darker by k (≈ 0.22 → ΔL* ≈ 10–12), a touch more saturated, hue nudged toward
// red/violet (painted shadows are warm on skin and cool-ish on cloth, never grey)
function shade(color, k = 0.22) {
  if (!color || color[0] !== '#' || color.length !== 7) return color;
  // per-channel multiply with a warm-violet shadow tint (ELA skin #f3cda8 → #dea582 at k 0.22)
  const w = [0.45, 0.9, 1.0];
  const c = hex2rgb(color);
  const [, s] = rgb2hsl(c);
  const ww = w.map((v) => 1 + (v - 1) * Math.min(1, s * 1.6)); // greys darken evenly
  return rgb2hex(c.map((v, i) => v * (1 - k * ww[i] * 1.12)));
}
function mix(c1, c2, t) {
  const a = hex2rgb(c1), b = hex2rgb(c2);
  return rgb2hex(a.map((v, i) => v + (b[i] - v) * t));
}

// ---- strokes ----------------------------------------------------------------------------------
// INK_STYLE: how every stroke from this module is inked.
//   thick: thick-thin by direction (0 = uniform). Width × (1 + thick·d), d = outward normal · shadow side,
//          so edges facing away from the light (lower-left, undersides) swell and lit edges thin
//          (thick 0.375 → ratio 2.2 : 1). Average width is unchanged.
//   wob:   positional jitter in px (smooth, confident curves: keep tiny). vary: slow width breathing.
//   brush: false → fall back to lib/ink's ink() (the old look).
const INK_STYLE = { brush: true, thick: 0.375, wob: 0.06, vary: 0.05, minW: 0.06 };
// shadow side = opposite of the light (the lit copy of a cel shape shifts by +lx,+ly)
const SHADOW_DIR = (() => { const l = Math.hypot(LIGHT.lx, LIGHT.ly); return [-LIGHT.lx / l, -LIGHT.ly / l]; })();

// brush(pts, w, o): a brush-inked stroke drawn as one filled polygon.
//   o.closed, o.lin (straight segments), o.color, o.op,
//   o.taper [start, end] (fractions of the length that thin to a point; default [0.22, 0.28]; closed: none),
//   o.tuck [start, end] (booleans or fractions: that end tucks behind another form → thins right to a point),
//   o.thick (thick-thin amount, default INK_STYLE.thick), o.out (+1 / −1: which side of an open stroke is
//   the outside of the form; default: the side away from the stroke's own bend, or o.body [x, y] a point
//   inside the form), o.minW, o.vary, o.wob
function brush(pts, w = LW.line, o = {}) {
  const S = INK_STYLE;
  if (!S.brush) return I.ink(pts, w, o);
  if (!pts || pts.length < 2 || !(w > 0)) return;
  const closed = !!o.closed;
  const p = (o.wob ?? S.wob) > 0.001 ? I.wobble(pts, Math.min(o.wob ?? S.wob, S.wob * 2)) : pts;
  const sm = o.lin ? I.sampleLin(p, closed, 3) : I.sample(p, closed, 2.5);
  const n = sm.length;
  if (n < 2) return;
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(sm[i][0] - sm[i - 1][0], sm[i][1] - sm[i - 1][1]));
  const total = cum[n - 1] || 1;
  // which side of the stroke is "outside": closed → by orientation; open → o.out, o.body, or its bend
  let side = 1;
  if (closed) { let A = 0; for (let i = 0; i < n; i++) { const a = sm[i], b = sm[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; } side = A > 0 ? -1 : 1; }
  else if (o.out) side = o.out;
  else {
    const m = o.body || sm.reduce((q, v) => [q[0] + v[0] / n, q[1] + v[1] / n], [0, 0]);
    const mid = sm[Math.floor(n / 2)], a = sm[Math.max(0, Math.floor(n / 2) - 2)], b = sm[Math.min(n - 1, Math.floor(n / 2) + 2)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const lx = -ty, ly = tx; // left normal
    side = ((mid[0] - m[0]) * lx + (mid[1] - m[1]) * ly) >= 0 ? 1 : -1;
  }
  const thick = o.thick ?? S.thick;
  const [ta, tb] = closed ? [0, 0] : (o.taper || [0.22, 0.28]);
  const tuck = o.tuck || [];
  const minW = o.minW ?? S.minW;
  const vary = o.vary ?? S.vary;
  const ph = (pts[0][0] * 0.13 + pts[0][1] * 0.07) % 6.28;
  const L = [], Rt = [];
  for (let i = 0; i < n; i++) {
    const t = cum[i] / total;
    const a = closed ? sm[(i - 1 + n) % n] : sm[Math.max(0, i - 1)];
    const b = closed ? sm[(i + 1) % n] : sm[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty * side, ny = tx * side; // outward normal
    const d = nx * SHADOW_DIR[0] + ny * SHADOW_DIR[1];
    let prof = 1;
    if (!closed) {
      const A = tuck[0] ? (typeof tuck[0] === 'number' ? tuck[0] : Math.max(ta, 0.3)) : ta;
      const Bq = tuck[1] ? (typeof tuck[1] === 'number' ? tuck[1] : Math.max(tb, 0.3)) : tb;
      const lo = (tuck[0] ? 0.02 : minW), hi = (tuck[1] ? 0.02 : minW);
      if (A > 0 && t < A) prof = lo + (1 - lo) * Math.sin((t / A) * Math.PI / 2);
      else if (Bq > 0 && t > 1 - Bq) prof = hi + (1 - hi) * Math.sin(((1 - t) / Bq) * Math.PI / 2);
    }
    const mod = (1 + thick * d) * (1 + vary * Math.sin(cum[i] / 23 + ph));
    const hw = (w / 2) * prof * mod;
    // the swell goes to the outside of the form: the inner edge stays on the drawn path
    const off = (hw - w / 2 * prof) * 0.6;
    const cx = sm[i][0] + nx * off, cy = sm[i][1] + ny * off;
    L.push([cx - ty * hw, cy + tx * hw]);
    Rt.push([cx + ty * hw, cy - tx * hw]);
  }
  const f = (q) => q.map((v) => I.n1(v[0]) + ' ' + I.n1(v[1])).join('L');
  const op = o.op != null ? ` opacity="${o.op}"` : '';
  const col = o.color || INK;
  if (closed) I.emit(`<path d="M${f(L)}Z M${f(Rt.slice().reverse())}Z" fill="${col}" fill-rule="evenodd"${op}/>`);
  else I.emit(`<path d="M${f(L.concat(Rt.reverse()))}Z" fill="${col}"${op}/>`);
}
// thickThin(pts, w, o): head.js-style entry point (o.center = the shape centre, o.k scales the thick-thin amount)
function thickThin(pts, w, o = {}) { return brush(pts, w, { ...o, body: o.center || o.body, thick: (o.k ?? 1) * INK_STYLE.thick }); }
// line(): an open brush stroke; closedLine(): a closed contour
function line(pts, w = LW.line, o = {}) {
  if (!INK_STYLE.brush) return I.ink(pts, w, { ...o, taper: o.taper || [0.2, 0.25], vary: o.vary ?? 0.18, wob: o.wob ?? 0.4, minW: o.minW ?? 0.2 });
  brush(pts, w, { ...o, taper: o.taper || [0.22, 0.28], wob: Math.min(o.wob ?? INK_STYLE.wob, INK_STYLE.wob * 2) });
}
function closedLine(pts, w = LW.contour, o = {}) {
  if (!INK_STYLE.brush) return I.ink(pts, w, { ...o, closed: true, vary: o.vary ?? 0.15, wob: o.wob ?? 0.35 });
  brush(pts, w, { ...o, closed: true });
}

// cel-shaded flat shape: shadow colour, then the base colour shifted toward the light and clipped to
// the shape, leaving one flat shadow crescent on the side away from the light. Then the contour.
//   o.shade: colour, or a darkening factor (default 0.22)   o.lx/o.ly: light shift (default 7,-6)
//   o.k: scales the light shift (use the drawing scale)      o.w: contour width (0 = none)
//   o.inner(): extra drawing clipped inside the shape         o.lin: straight edges
//   o.mode: 'flat' (default: one flat darker shape) | 'black' (spot-black shadow, ZP night/drama)
//           | 'tone' (lighter shadow + halftone dots, ZP screentone strips). CEL.mode sets the default.
const CEL = { mode: 'flat', toneScale: 1 };
let TONE_ID = 0;
function tonePattern(color, s = 1, op = 0.55) {
  const id = `zptone${++TONE_ID}`, g = 4.2 * s, r = 1.05 * s;
  I.emit(`<defs><pattern id="${id}" width="${g}" height="${g}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="${g / 2}" cy="${g / 2}" r="${r}" fill="${color}" opacity="${op}"/></pattern></defs>`);
  return `url(#${id})`;
}
function cel(pts, base, o = {}) {
  const k = o.k ?? 1;
  const lx = (o.lx ?? LIGHT.lx) * k, ly = (o.ly ?? LIGHT.ly) * k;
  const mode = o.mode || CEL.mode;
  let sh = typeof o.shade === 'string' ? o.shade : shade(base, o.shade ?? 0.22);
  if (mode === 'black') sh = o.black || '#161116';
  if (mode === 'tone' && typeof o.shade !== 'string') sh = shade(base, (o.shade ?? 0.22) * 0.45);
  const p = o.wob === 0 ? pts : I.wobble(pts, Math.min(o.wob ?? 0.3, INK_STYLE.brush ? INK_STYLE.wob * 2 : 9));
  const d = I.poly(o.lin ? I.sampleLin(p, true) : I.sample(p, true));
  const op = o.op != null ? ` opacity="${o.op}"` : '';
  I.clip(d, () => {
    I.emit(`<path d="${d}" fill="${sh}"${op}/>`);
    if (mode === 'tone') I.emit(`<path d="${d}" fill="${tonePattern(shade(base, 0.55), o.toneScale ?? CEL.toneScale)}"${op}/>`);
    const q = p.map(([x, y]) => [x + lx, y + ly]);
    I.emit(`<path d="${I.poly(o.lin ? I.sampleLin(q, true) : I.sample(q, true))}" fill="${base}"${op}/>`);
    if (o.inner) o.inner(p);
  });
  if (o.w !== 0) closedLine(p, o.w ?? LW.contour, { wob: 0, lin: o.lin, vary: o.vary, color: o.ink });
  return p;
}

// filled shape with a contour; o.cel (true | {shade,lx,ly,k}) adds a cel shadow
function shape(pts, color, o = {}) {
  if (color && o.cel) return cel(pts, color, { ...(typeof o.cel === 'object' ? o.cel : {}), w: o.w, wob: o.wob ?? 0.3, lin: o.lin, ink: o.ink, op: o.op, inner: o.inner });
  const p = I.wobble(pts, Math.min(o.wob ?? 0.3, INK_STYLE.brush ? INK_STYLE.wob * 2 : 9));
  if (color) I.fill(p, color, { wob: 0, lin: o.lin, op: o.op });
  if (o.inner) I.clipPoly(p, () => o.inner(p));
  if (o.w !== 0) closedLine(p, o.w ?? LW.contour, { wob: 0, lin: o.lin, vary: o.vary, color: o.ink });
  return p;
}

// outline of a tube along a polyline with per-point radius (round caps unless disabled)
function tubePts(pts, radii, o = {}) {
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
  const cap = (c, r, t0) => {
    const out = [];
    for (let k = 1; k < 6; k++) { const a = t0 - (k / 6) * Math.PI; out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
    return out;
  };
  const a0 = Math.atan2(L[0][1] - pts[0][1], L[0][0] - pts[0][0]);
  const aE = Math.atan2(L[n - 1][1] - pts[n - 1][1], L[n - 1][0] - pts[n - 1][0]);
  return L.concat(o.capEnd === false ? [] : cap(pts[n - 1], radii[n - 1], aE), Rr.slice().reverse(), o.capStart === false ? [] : cap(pts[0], radii[0], a0 + Math.PI));
}

// capsule / limb along a polyline with per-point radius; flat fill (+ cel with o.cel) + contour
function limb(pts, radii, color, o = {}) {
  return shape(tubePts(pts, radii, o), color, { w: o.w ?? LW.line, wob: o.wob ?? 0.2, ink: o.ink, cel: o.cel });
}

function ellPts(cx, cy, rx, ry, n = 20, rot = 0) { return I.ell(cx, cy, rx, ry, n, rot); }

module.exports = { I, INK, LW, LIGHT, CEL, INK_STYLE, SHADOW_DIR, brush, thickThin, tonePattern, line, closedLine, shape, limb, tubePts, ellPts, cel, shade, mix, lw, clamp };
