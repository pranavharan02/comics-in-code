// ink.js — a tiny "hand-drawn" SVG toolkit.
// Everything is drawn as filled polygons so lines swell and taper like a brush pen,
// and every point gets a little seeded wobble so nothing is ruler-perfect.

let SEED = 1;
function seed(s) { SEED = s; }
function rng() { SEED = (SEED * 16807) % 2147483647; return (SEED - 1) / 2147483646; }
const R = (a = 1) => (rng() * 2 - 1) * a;

let out = [];
const emit = (s) => out.push(s);
const take = () => { const s = out.join('\n'); out = []; return s; };
const n1 = (v) => Math.round(v * 10) / 10;

const INK = '#070506';

// Catmull-Rom through pts, sampled so segments are ~step px long.
function sample(pts, closed = false, step = 3.5) {
  const n = pts.length;
  if (n < 2) return pts.slice();
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  const res = [];
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const per = Math.max(2, Math.ceil(len / step));
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const c = (a, b, cc, d) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      res.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) res.push(pts[n - 1]);
  return res;
}

// straight segments, subdivided (for rulers, planks, frames)
function sampleLin(pts, closed = false, step = 6) {
  const res = [];
  const n = pts.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const per = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < per; k++) res.push([a[0] + (b[0] - a[0]) * k / per, a[1] + (b[1] - a[1]) * k / per]);
  }
  if (!closed) res.push(pts[n - 1]);
  return res;
}

const wobble = (pts, a) => pts.map((p) => [p[0] + R(a), p[1] + R(a)]);
const poly = (s, close = true) => 'M' + s.map((p) => n1(p[0]) + ' ' + n1(p[1])).join('L') + (close ? 'Z' : '');

// A brush stroke. o.taper = [start, end] fraction of length that tapers.
function ink(pts, w = 3, o = {}) {
  const color = o.color || INK;
  const taper = o.taper || [0.18, 0.22];
  const closed = !!o.closed;
  const p = o.wob === 0 ? pts : wobble(pts, o.wob ?? 0.7);
  const s = o.lin ? sampleLin(p, closed, 4) : sample(p, closed);
  const n = s.length;
  if (n < 2) return;
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  const total = cum[n - 1] || 1;
  const ph = rng() * 20;
  const L = [], Rt = [];
  for (let i = 0; i < n; i++) {
    const t = cum[i] / total;
    let prof = 1;
    if (!closed) {
      const [a, b] = taper;
      if (a > 0 && t < a) prof = Math.sin((t / a) * Math.PI / 2);
      else if (b > 0 && t > 1 - b) prof = Math.sin(((1 - t) / b) * Math.PI / 2);
      prof = (o.minW ?? 0.14) + (1 - (o.minW ?? 0.14)) * prof;
    }
    const mod = 1 + (o.vary ?? 0.2) * Math.sin(cum[i] / 21 + ph) + 0.07 * Math.sin(cum[i] / 6.5 + ph * 1.7);
    const hw = (w / 2) * prof * mod;
    const a = closed ? s[(i - 1 + n) % n] : s[Math.max(0, i - 1)];
    const b = closed ? s[(i + 1) % n] : s[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    L.push([s[i][0] - ty * hw, s[i][1] + tx * hw]);
    Rt.push([s[i][0] + ty * hw, s[i][1] - tx * hw]);
  }
  const op = o.op != null ? ` opacity="${o.op}"` : '';
  if (closed) emit(`<path d="${poly(L)} ${poly(Rt.reverse())}" fill="${color}" fill-rule="evenodd"${op}/>`);
  else emit(`<path d="${poly(L.concat(Rt.reverse()))}" fill="${color}"${op}/>`);
}

// flat filled blob (no outline)
function fill(pts, color, o = {}) {
  const p = o.wob === 0 ? pts : wobble(pts, o.wob ?? 0.6);
  const s = o.lin ? sampleLin(p, true) : sample(p, true);
  const op = o.op != null ? ` opacity="${o.op}"` : '';
  emit(`<path d="${poly(s)}" fill="${color}"${op}${o.extra || ''}/>`);
}

// filled + inked shape sharing the same wobble
function shape(pts, color, o = {}) {
  const p = wobble(pts, o.wob ?? 0.8);
  if (color) fill(p, color, { wob: 0, lin: o.lin, op: o.op });
  if (o.w !== 0) ink(p, o.w ?? 3.2, { closed: true, wob: 0, lin: o.lin, color: o.ink, vary: o.vary });
  return p;
}

function ell(cx, cy, rx, ry, n = 14, rot = 0, a0 = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return pts;
}
function arc(cx, cy, rx, ry, a0, a1, n = 8) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return pts;
}
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

function rect(x, y, w, h, color, o = {}) {
  const op = o.op != null ? ` opacity="${o.op}"` : '';
  emit(`<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="${color}"${op}/>`);
}

function grp(tf, fn, extra = '') { emit(`<g transform="${tf}"${extra}>`); fn(); emit('</g>'); }
let CLIP = 0;
function clip(d, fn) {
  const id = 'c' + (++CLIP);
  emit(`<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">`);
  fn();
  emit('</g>');
}
const clipPoly = (pts, fn) => clip(poly(sample(pts, true)), fn);
const clipRect = (x, y, w, h, fn) => clip(`M${x} ${y}H${x + w}V${y + h}H${x}Z`, fn);

// Zen-Pencils-style wood grain swirl: a loose little spiral with a tail
function swirl(x, y, s, color, dir = 1) {
  const pts = [];
  const turns = 1.4 + rng() * 0.6;
  for (let i = 0; i <= 18; i++) {
    const t = i / 18, a = dir * t * turns * Math.PI * 2;
    const r = s * (0.15 + t);
    pts.push([x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.55]);
  }
  pts.push([pts[pts.length - 1][0] + dir * s * 1.4, pts[pts.length - 1][1] + s * 0.2]);
  ink(pts, 1.6, { color, taper: [0.3, 0.4], wob: 0.4 });
}
function wave(x, y, len, color, amp = 3) {
  const pts = [];
  for (let i = 0; i <= 6; i++) pts.push([x + (len * i) / 6, y + Math.sin(i * 1.3 + rng()) * amp]);
  ink(pts, 1.5, { color, taper: [0.35, 0.35], wob: 0.3 });
}

// sweat drop, tip at (x,y)
function drop(x, y, s = 1, rot = 0, color = '#bfe6f5') {
  grp(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, () => {
    shape([[0, 0], [5, 9], [7, 15], [4, 20], [-1, 21], [-5, 17], [-5, 11]], color, { w: 1.8, wob: 0.2 });
    fill(ell(-1.5, 15, 1.3, 2.4, 8), '#fff', { wob: 0 });
  });
}

// radiating speed lines around (cx,cy) outside radius r0
function burst(cx, cy, r0, r1, count, color = INK, w = 2) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + R(0.05);
    const a0 = r0 * (0.9 + rng() * 0.3), a1 = r1 * (0.7 + rng() * 0.4);
    ink([[cx + Math.cos(a) * a0, cy + Math.sin(a) * a0], [cx + Math.cos(a) * a1, cy + Math.sin(a) * a1]], w, { color, taper: [0.6, 0.05], wob: 0.3 });
  }
}


// Cel-shaded shape: shadow colour everywhere, base colour shifted toward the light (lx,ly),
// clipped to the shape, so a crescent of shadow is left on the far side. Then the ink line.
function cel(pts, base, shade, o = {}) {
  const lx = o.lx ?? 7, ly = o.ly ?? -6;
  const p = wobble(pts, o.wob ?? 0.8);
  const d = o.lin ? poly(sampleLin(p, true)) : poly(sample(p, true));
  clip(d, () => {
    emit(`<path d="${d}" fill="${shade}"/>`);
    const q = p.map(([x, y]) => [x + lx, y + ly]);
    emit(`<path d="${o.lin ? poly(sampleLin(q, true)) : poly(sample(q, true))}" fill="${base}"/>`);
    if (o.inner) o.inner();
  });
  if (o.w !== 0) ink(p, o.w ?? 3.2, { closed: true, wob: 0, lin: o.lin, color: o.ink, vary: o.vary });
  return p;
}
// parallel hatching inside a polygon
function hatch(pts, o = {}) {
  const ang = ((o.angle ?? 45) * Math.PI) / 180, gap = o.gap ?? 7;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const r = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 4;
  clipPoly(pts, () => {
    for (let t = -r; t <= r; t += gap) {
      const ox = cx + Math.cos(ang + Math.PI / 2) * t, oy = cy + Math.sin(ang + Math.PI / 2) * t;
      const L = r * (o.len ?? 1);
      ink([[ox - Math.cos(ang) * L, oy - Math.sin(ang) * L], [ox + Math.cos(ang) * L, oy + Math.sin(ang) * L]], o.w ?? 1.1, { color: o.color || INK, taper: [0.3, 0.3], wob: 0.6, op: o.op });
    }
  });
}

function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function text(x, y, str, o = {}) {
  const size = o.size || 18, font = o.font || 'Letter', anchor = o.anchor || 'middle';
  const stroke = o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 4}" paint-order="stroke" stroke-linejoin="round"` : '';
  const tf = o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : '';
  const ls = o.ls != null ? o.ls : 1.2;
  const st = o.italic ? ' font-style="italic"' : '';
  emit(`<text x="${n1(x)}" y="${n1(y)}" font-family="${font}" font-size="${size}" text-anchor="${anchor}" letter-spacing="${ls}" fill="${o.color || INK}"${st}${stroke}${tf}${o.op != null ? ` opacity="${o.op}"` : ''}>${esc(str)}</text>`);
}

// White caption box with hand-lettered text. x,y = top-left. Width is estimated from text.
function caption(x, y, lines, o = {}) {
  const size = o.size || 17, lh = size * 1.22, pad = o.pad || 13;
  const cw = size * (o.cw || 0.62);
  const w = o.w || Math.max(...lines.map((l) => l.length)) * cw + pad * 2;
  const h = lines.length * lh + pad * 2 - (lh - size) + 2 + (o.attrib ? size * 1.1 : 0);
  emit(`<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="#fffefb" stroke="${INK}" stroke-width="1.6"/>`);
  lines.forEach((l, i) => text(x + w / 2, y + pad + size * 0.86 + i * lh, l, { size }));
  if (o.attrib) text(x + w / 2, y + pad + size * 0.86 + lines.length * lh + 1, o.attrib, { size: size * 0.66, ls: 1.5 });
  return { w, h };
}

// Speech balloon. (cx,cy) centre; tail tip (tx,ty). jag = spiky "shout/voice" balloon.
function balloon(cx, cy, rx, ry, tx, ty, lines, o = {}) {
  const size = o.size || 18, lh = size * 1.15;
  const fillc = o.fill || '#fffefb';
  const n = o.jag ? 26 : 16;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = o.jag ? (i % 2 ? 1.0 : 1.17 + R(0.06)) : 1;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const ang = Math.atan2(ty - cy, tx - cx);
  const bx = cx + Math.cos(ang) * rx * 0.7, by = cy + Math.sin(ang) * ry * 0.7;
  const px = -Math.sin(ang) * 11, py = Math.cos(ang) * 11;
  const tail = [[bx + px, by + py], [(bx + tx) / 2 + px * 0.5 + R(3), (by + ty) / 2 + py * 0.5], [tx, ty], [bx - px, by - py]];
  shape(tail, fillc, { w: 2.2, lin: true, wob: 0.4 });
  if (o.jag) shape(pts, fillc, { w: 2.4, lin: true, wob: 0.5 });
  else shape(pts, fillc, { w: 2.4, wob: 0.6 });
  fill([[bx + px * 0.7, by + py * 0.7], [bx - px * 0.7, by - py * 0.7], [cx, cy]], fillc, { wob: 0, lin: true });
  const top = cy - ((lines.length - 1) * lh) / 2 + size * 0.36;
  lines.forEach((l, i) => text(cx, top + i * lh, l, { size, font: o.font || 'Letter', color: o.color, ls: o.ls }));
}

module.exports = {
  seed, rng, R, emit, take, INK, sample, sampleLin, wobble, poly, ink, fill, shape, ell, arc, rectPts, rect,
  grp, clip, clipPoly, clipRect, cel, hatch, swirl, wave, drop, burst, text, caption, balloon, n1,
};
