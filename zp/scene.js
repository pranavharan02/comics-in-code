// zp/scene.js — backgrounds and props in Zen Pencils' manner.
//
// How Gavin Aung Than draws a background, and what this module imitates:
//   * designed shapes, never clones: every element is built from a seeded local rng, so two trees,
//     clouds or stones drawn at different places never match (and the same call always redraws the
//     same way, so repeated framings stay identical). Pass o.seed to pick a different variant.
//   * a thinner pen than the figures (backgrounds sit back): contour > interior (ratio ~1.6), and far
//     things get thinner lines or none at all.
//   * depth by flat value steps: far layers are mixed toward the haze/sky colour, cooler and lighter,
//     with fewer marks (depth(), haze()); near layers carry spot blacks and texture.
//   * one flat cel shadow per form, on the side away from the light (the same light as the figures:
//     core.LIGHT), never gradients on forms.
//   * texture only where it matters: a few clustered marks (grass tufts, bark ticks, stone cracks,
//     leaf scallops), not uniform scatter.
//
// Every old export keeps its signature (hills, sea, tree, cloud, stars, moon, sun, rain, room,
// windowFrame, door, table, chair, frame, sheet, books, skyline); new options are optional.
// See work/engine/scene/NOTES.md for the catalogue with examples.
const I = require('../lib/ink');
const core = require('./core');
const { INK, line } = core;

const BG = 1.8; // background contour weight (kept for callers that use SC.BG)
const PEN = { contour: 2.0, line: 1.55, detail: 1.2, fine: 0.9 };

// ---- rng: seeded, local, position-hashed -------------------------------------------------------
let SCENE_SEED = 7;
function setSeed(s) { SCENE_SEED = s; }
function hash(...v) {
  let h = 2166136261 ^ SCENE_SEED;
  for (const x of v) {
    const s = typeof x === 'number' ? String(Math.round(x * 10)) : String(x);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= 124; h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mkRng(seed) {
  let s = seed >>> 0 || 1;
  const r = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.pm = (a = 1) => (r() * 2 - 1) * a;
  r.range = (a, b) => a + (b - a) * r();
  r.int = (a, b) => Math.floor(a + (b - a + 1) * r());
  r.pick = (arr) => arr[Math.floor(r() * arr.length) % arr.length];
  r.chance = (p) => r() < p;
  r.gauss = () => (r() + r() + r() - 1.5) / 1.5;
  return r;
}
// rng for one element: o.seed wins, else hashed from the element's tag and position
const rngFor = (o, tag, ...xs) => mkRng(o && o.seed != null ? hash(tag, 's', o.seed, ...xs) : hash(tag, ...xs));

// ---- colour and depth --------------------------------------------------------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
const mix = (a, b, t) => (isHex(a) && isHex(b) ? core.mix(a, b, clamp(t, 0, 1)) : a);
const shade = (c, k = 0.22) => (isHex(c) ? core.shade(c, k) : c);
const light = (c, k = 0.2) => mix(c, '#ffffff', k);
// relative luminance 0..1 of a hex colour (non-hex: 0.5)
const lum = (c) => { if (!isHex(c)) return 0.5; const v = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
// atmospheric perspective: t = 0 (near) .. 1 (far). Far colours move toward the haze colour
// (usually the low sky), losing contrast; this is ZP's flat value-step depth.
function depth(color, t, hz = '#dfeef2', o = {}) { return mix(color, hz, clamp(t, 0, 1) * (o.max ?? 0.75)); }
const haze = depth;
// a colour ramp for n layers from far to near
function layers(near, hz, n, o = {}) { const out = []; for (let i = 0; i < n; i++) out.push(depth(near, 1 - i / Math.max(1, n - 1), hz, o)); return out; }
// pen weight for a depth: far lines are thinner (and at t >= o.cut there is no line)
const penAt = (w, t = 0) => w * lerp(1, 0.3, clamp(t, 0, 1));
const LIGHT = () => core.LIGHT || { lx: 7, ly: -6 };
// the side the shadow falls on (unit vector away from the light), in screen space
function shadowDir() { const L = LIGHT(); const l = Math.hypot(L.lx, L.ly) || 1; return [-L.lx / l, -L.ly / l]; }

// ---- small drawing helpers ---------------------------------------------------------------------
function ln(pts, w = PEN.line, o = {}) { line(pts, w, { taper: o.taper || [0.25, 0.3], ...o }); }
function fillP(pts, color, o = {}) { if (color) I.fill(pts, color, { wob: o.wob ?? 0, lin: o.lin, op: o.op }); }
function inkP(pts, w = PEN.contour, o = {}) { if (w > 0) I.ink(pts, w, { closed: true, wob: o.wob ?? 0, lin: o.lin, vary: o.vary ?? 0.2, color: o.color, op: o.op }); }
// flat shape + cel shadow (shift k scales the shadow width) + contour
function cel(pts, color, o = {}) {
  const L = LIGHT();
  const k = o.k ?? 1;
  return core.cel(pts, color, { shade: o.shade ?? 0.2, lx: o.lx ?? L.lx * 0.55, ly: o.ly ?? L.ly * 0.55, k, w: o.w ?? PEN.contour, lin: o.lin, wob: o.wob ?? 0.25, inner: o.inner, ink: o.ink, op: o.op });
}
function flat(pts, color, o = {}) { return core.shape(pts, color, { w: o.w ?? PEN.contour, lin: o.lin, wob: o.wob ?? 0.25, inner: o.inner, ink: o.ink, op: o.op }); }
const rect = (x, y, w, h) => I.rectPts(x, y, w, h);
const quad = (a, b, c, d) => [a, b, c, d];
// rounded rectangle (corner radius r), as a polygon
function rrect(x, y, w, h, r, n = 3) {
  r = Math.min(r, w / 2, h / 2);
  const pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  return pts;
}
// the outline of a union of circles, ray-cast from (cx, cy) (the union must be star-shaped from it).
// Arcs meet in little cusps, which is exactly the scalloped edge ZP gives foliage and clouds.
function blobOutline(circles, cx, cy, n = 96, o = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (o.a0 || 0);
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = 0;
    for (const [x, y, r] of circles) {
      const fx = cx - x, fy = cy - y, b = fx * dx + fy * dy, c = fx * fx + fy * fy - r * r, d = b * b - c;
      if (d >= 0) { const t = -b + Math.sqrt(d); if (t > best) best = t; }
    }
    let px = cx + dx * best, py = cy + dy * best;
    if (o.floor != null && py > o.floor) py = o.floor;
    pts.push([px, py]);
  }
  return pts;
}
// convex hull (kept so old code paths that expect one keep working)
function convexHull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// point-in-polygon
function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// a sampled open curve (for profiles): y at x by linear interpolation
function yAt(profile, x) {
  for (let i = 1; i < profile.length; i++) {
    const [x0, y0] = profile[i - 1], [x1, y1] = profile[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
  }
  return profile[profile.length - 1][1];
}

// =================================================================================================
// NATURE
// =================================================================================================

// ---- grass --------------------------------------------------------------------------------------
// one tuft: 3-6 blades fanning from a point, the middle ones tallest, a little lean
function tuft(x, y, s = 1, o = {}) {
  const r = o.rng || rngFor(o, 'tuft', x, y);
  const n = o.blades ?? r.int(3, 5);
  const lean = o.lean ?? r.pm(0.35);
  const w = (o.w ?? PEN.detail) * clamp(Math.sqrt(s), 0.6, 1.4);
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; // -1..1
    const h = s * 9 * (1 - Math.abs(u) * 0.45) * r.range(0.7, 1.15);
    const a = -Math.PI / 2 + u * 0.55 + lean * 0.5 + r.pm(0.12);
    const bx = x + u * s * 2.2;
    const tx = bx + Math.cos(a) * h, ty = y + Math.sin(a) * h;
    const mx = bx + Math.cos(a) * h * 0.55 + lean * s * 1.2, my = y + Math.sin(a) * h * 0.55;
    ln([[bx, y + 0.5], [mx, my], [tx, ty]], w, { color: o.color || INK, taper: [0.02, 0.85], op: o.op });
  }
}
// clustered tufts over a region: clusters of 2-4 tufts, sized by depth (smaller toward yTop)
//   area: {x, y, w, h}  o.n clusters, o.color, o.clip (polygon: only inside it), o.sMin/o.sMax
function grass(area, o = {}) {
  const r = rngFor(o, 'grass', area.x, area.y, area.w, area.h);
  const n = o.n ?? Math.round((area.w * area.h) / 9000);
  for (let c = 0; c < n; c++) {
    const cx = area.x + r() * area.w, t = Math.pow(r(), o.bias ?? 0.8), cy = area.y + t * area.h;
    const s = lerp(o.sMin ?? 0.5, o.sMax ?? 1.3, t);
    const k = r.int(1, 3);
    for (let j = 0; j < k; j++) {
      const x = cx + r.pm(8 * s), y = cy + r.pm(2.5 * s);
      if (o.clip && !inside([x, y - 1], o.clip)) continue;
      tuft(x, y, s * r.range(0.7, 1.1), { rng: r, color: o.color, w: o.w, op: o.op });
    }
  }
}

// ---- hills and fields ---------------------------------------------------------------------------
// a ridge line across the width: layered sines with seeded phases (not a regular sine wave)
function ridge(w, y, amp, r, o = {}) {
  const n = o.n || 3;
  const comps = [];
  for (let i = 0; i < 3; i++) comps.push({ f: (n * 0.5 + i * r.range(0.6, 1.6)) * Math.PI / w, p: r() * 7 + (o.phase || 0) * (i + 1), a: i === 0 ? 1 : r.range(0.2, 0.45) / i });
  const tot = comps.reduce((s, c) => s + c.a, 0);
  const pts = [];
  const N = o.samples || 36;
  for (let i = 0; i <= N; i++) {
    const x = -60 + (i / N) * (w + 120);
    let v = 0;
    comps.forEach((c) => { v += c.a * Math.sin(x * c.f + c.p); });
    v = 0.5 + 0.5 * (v / tot);
    pts.push([x, y - amp * v - (o.slope || 0) * (x / w)]);
  }
  return pts;
}
// hills(w, y, amp, color, o): one band of rolling hills
//   o.n (bumpiness), o.phase, o.slope, o.bottom, o.w (contour), o.tufts (clusters), o.tuftColor,
//   o.shade (cel colour or k), o.depth (0 near .. 1 far: thinner line, fewer marks), o.seed
//   o.stripes: field boundaries (hedgerows) following the slope, o.hedge colour
// returns the ridge profile (array of points) so callers can plant things on it (yAt(profile, x)).
function hills(w, y, amp, color, o = {}) {
  const r = rngFor(o, 'hills', w, y, amp);
  const d = o.depth ?? 0;
  const prof = o.profile || ridge(w, y, amp, r, o);
  const bottom = o.bottom ?? y + 400;
  const pts = [[-60, bottom], ...prof, [w + 60, bottom]];
  const cw = o.w ?? penAt(BG, d);
  const sh = typeof o.shade === 'string' ? o.shade : shade(color, o.shade ?? 0.14);
  const poly = I.wobble(pts, 0.3);
  fillP(poly, color);
  I.clipPoly(poly, () => {
    // cel: a band under the ridge on slopes that face away from the light, thicker where steeper
    const [sx] = shadowDir();
    const band = [];
    const sm = I.sample(prof, false, 6);
    for (let i = 0; i < sm.length; i++) {
      const a = sm[Math.max(0, i - 2)], b = sm[Math.min(sm.length - 1, i + 2)];
      const slope = (b[1] - a[1]) / (b[0] - a[0] || 1);
      const k = clamp(slope * sx * (o.shadeK ?? 3.2), 0, 1);
      band.push([sm[i][0], sm[i][1] + k * (o.shadeW ?? amp * 0.9 + 10)]);
    }
    fillP(sm.concat(band.reverse()), sh, { wob: 0.4 });
    if (o.stripes) {
      const hc = o.hedge || shade(color, 0.3);
      const rows = o.stripes;
      for (let i = 0; i < rows; i++) {
        const t = (i + 1) / (rows + 1), yy = y + (bottom - y) * t * t * 0.9 + 8;
        const bnd = [];
        for (let x = -20; x <= w + 20; x += w / 8) bnd.push([x, yy + (yAt(prof, x) - y) * (1 - t) + r.pm(6)]);
        ln(bnd, lerp(1.2, 3.2, t), { color: hc, taper: [0.05, 0.05], wob: 0.8 });
      }
    }
    if (o.inner) o.inner(prof);
  });
  if (cw > 0) ln(prof, cw, { taper: [0, 0], wob: 0.3 });
  if (o.tufts) grass({ x: 0, y: y + 8, w, h: Math.min(90, bottom - y - 10) }, { n: o.tufts, color: o.tuftColor || shade(color, 0.42), clip: pts, seed: o.seed, sMin: 0.5, sMax: 1.1 * (1 - d * 0.5) });
  return prof;
}
// landscape(w, h, o): layered hills with atmospheric value steps, far to near.
//   o.horizon (y of the farthest ridge, default 0.45h), o.layers (3), o.near (near colour),
//   o.haze (colour far layers fade into, usually the low sky), o.trees (count on middle layers),
//   o.treeColor, o.tufts (on the nearest layer), o.seed
// returns the profiles, far to near.
function landscape(w, h, o = {}) {
  const r = rngFor(o, 'land', w, h);
  const n = o.layers ?? 3;
  const hz = o.haze || '#dfeef2';
  const near = o.near || '#8cc56f';
  const hor = o.horizon ?? h * 0.45;
  const profs = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : 1 - i / (n - 1); // 1 far .. 0 near
    const yy = lerp(h * 0.98, hor, t) - (i === n - 1 ? 0 : 0);
    const amp = lerp(h * 0.17, h * 0.08, t) * r.range(0.8, 1.25);
    const col = depth(near, t, hz, { max: o.hazeMax ?? 0.7 });
    const prof = hills(w, yy - (i === n - 1 ? h * 0.05 : 0), amp, col, { depth: t, n: lerp(2, 4, t), seed: (o.seed || 0) * 13 + i, w: t > 0.8 ? 0 : undefined, tufts: i === n - 1 ? o.tufts ?? 10 : 0, bottom: h + 20, shade: 0.1 + 0.06 * (1 - t) });
    profs.push(prof);
    if (o.treelines !== false && t > 0.25 && t < 0.95 && i % 2 === 1) treeline(prof, { h: lerp(h * 0.09, h * 0.035, t), leaf: depth(o.treeColor || shade(near, 0.12), t, hz, { max: 0.72 }), depth: t, seed: (o.seed || 0) + i, gaps: 0.08 });
    if (o.trees && t > 0.1 && t < 0.95) {
      const k = Math.round(o.trees / Math.max(1, n - 2));
      for (let j = 0; j < k; j++) {
        const x = r() * w, yb = yAt(prof, x) + 4 + r() * 10;
        tree(x, yb, lerp(h * 0.22, h * 0.07, t) * r.range(0.7, 1.2), { kind: r.pick(['oak', 'oak', 'round', 'poplar']), leaf: depth(o.treeColor || shade(near, 0.08), t, hz, { max: 0.72 }), trunk: depth('#6d4a33', t, hz), depth: t, seed: j * 31 + i });
      }
    }
  }
  return profs;
}
// a path/road receding in perspective toward (vx, vy): wide at the bottom, narrow at the top,
// with a lazy S. o.w0 (width at bottom), o.w1 (at the far end), o.color, o.edge (tuft colour),
// o.wind (sideways swing), o.pebbles
function road(w, h, o = {}) {
  const r = rngFor(o, 'road', w, h);
  const x0 = o.x0 ?? w * 0.5, y0 = o.y0 ?? h + 6, vx = o.vx ?? w * 0.55, vy = o.vy ?? h * 0.5;
  const w0 = o.w0 ?? w * 0.42, w1 = o.w1 ?? 6, wind = o.wind ?? w * 0.12;
  const N = 24, Lp = [], Rp = [], C = [];
  const ph = o.phase ?? r() * 2;
  for (let i = 0; i <= N; i++) {
    const t = i / N, e = 1 - Math.pow(1 - t, 1.6); // perspective easing
    const cx = lerp(x0, vx, e) + Math.sin(t * Math.PI * 1.3 + ph) * wind * (1 - t);
    const cy = lerp(y0, vy, e);
    const hw = lerp(w0, w1, e) / 2;
    Lp.push([cx - hw, cy]); Rp.push([cx + hw, cy]); C.push([cx, cy, hw, t]);
  }
  const poly = Lp.concat(Rp.slice().reverse());
  fillP(poly, o.color || '#f4e2ad', { wob: 0.3 });
  ln(Lp, o.line ?? PEN.line, { taper: [0.02, 0.6] });
  ln(Rp, o.line ?? PEN.line, { taper: [0.02, 0.6] });
  // ruts/pebbles: short horizontal dashes, bigger near
  const pc = o.mark || shade(o.color || '#f4e2ad', 0.28);
  for (let k = 0; k < (o.pebbles ?? 16); k++) {
    const c = C[Math.floor(Math.pow(r(), 1.7) * N * 0.8)];
    const s = 1 - c[3];
    const x = c[0] + r.pm(c[2] * 0.8), yy = c[1] + r.pm(4);
    if (r.chance(0.5)) ln([[x - 5 * s, yy], [x + 5 * s, yy + 0.4]], 1.3 * s + 0.3, { color: pc, taper: [0.3, 0.3] });
    else I.fill(I.ell(x, yy, 2.2 * s + 0.4, 1.3 * s + 0.3, 7), pc, { wob: 0.2 });
  }
  // tufts along the verges
  if (o.edge !== false) for (let k = 0; k < (o.verge ?? 10); k++) {
    const c = C[Math.floor(Math.pow(r(), 1.5) * N * 0.85)];
    const side = r.chance(0.5) ? -1 : 1;
    tuft(c[0] + side * (c[2] + 2), c[1] + 1, lerp(1.3, 0.4, c[3]), { rng: r, color: o.edge || INK });
  }
  return { left: Lp, right: Rp, centre: C };
}

// ---- trees and bushes ---------------------------------------------------------------------------
/// canopy of clumped masses: base fill in the shadow colour, each clump's lit part on top (so every
// clump keeps a shadow crescent on its far side), a dark pocket underneath where the limbs go in
// (ZP's spot black), a few scallop marks, then one heavier contour.
//   o.pocket: [x, y, rx, ry] of the underside pocket; o.limbs: limb polylines drawn inside it
function canopy(circles, cx, cy, leaf, o = {}) {
  const r = o.rng || mkRng(hash('canopy', cx, cy));
  const out = blobOutline(circles, cx, cy, o.n || 120, { floor: o.floor });
  const lsh = o.leafShade || shade(leaf, 0.24);
  const [sx, sy] = shadowDir();
  const d = o.depth ?? 0;
  const p = I.wobble(out, 0.3);
  I.clipPoly(p, () => {
    fillP(p, lsh);
    circles.forEach(([x, y, rr]) => I.fill(I.ell(x - sx * rr * 0.2, y - sy * rr * 0.24, rr * 0.86, rr * 0.82, 18), leaf, { wob: rr * 0.025 }));
    if (o.pocket && d < 0.85) {
      const [px, py, prx, pry] = o.pocket;
      const dark = o.hole || shade(lsh, 0.4);
      // pocket with a scalloped upper edge: a few small circles along its top
      const pc = [[px, py + pry * 0.3, prx * 0.75]];
      for (let i = 0; i < 4; i++) { const u = i / 3 - 0.5; pc.push([px + u * prx * 1.3, py + r.pm(pry * 0.2), prx * r.range(0.3, 0.45)]); }
      const po = blobOutline(pc, px, py + pry * 0.2, 60);
      fillP(I.wobble(po, 0.4), dark);
      if (o.limbs) I.clipPoly(po, () => o.limbs.forEach((l) => core.limb(l.pts, l.radii, l.color, { w: PEN.detail })));
    }
    if (o.inner) o.inner(p);
  });
  // interior marks: short cup-shaped scallops under some clumps (thinner than the contour)
  if (d < 0.7) circles.forEach(([x, y, rr], i) => {
    if (i === 0 || !r.chance(o.marks ?? 0.5)) return;
    const a0 = Math.PI * r.range(0.1, 0.3), a1 = a0 + Math.PI * r.range(0.25, 0.4);
    const arc = I.arc(x - sx * rr * 0.15, y - sy * rr * 0.12, rr * 0.8, rr * 0.72, a0, a1, 5);
    if (arc.every((q) => inside(q, out))) ln(arc, penAt(PEN.detail, d) * 0.9, { color: o.markColor || INK, taper: [0.3, 0.4] });
  });
  if (o.w !== 0) inkP(p, o.w ?? penAt(PEN.contour, d), { vary: 0.25 });
  return out;
}
// a trunk: tapered with a root flare, forking into 2-3 limbs; returns the limbs so the canopy
// can show them inside its dark underside
function trunk(x, y, h, r, o = {}) {
  const tw = o.width ?? h * 0.075;
  const top = y - h * (o.len ?? 0.46);
  const lean = o.lean ?? r.pm(0.06) * h;
  const col = o.trunk || '#7a4e31';
  const pts = [[x - tw * 1.05, y + 1], [x - tw * 0.55, y - h * 0.04], [x - tw * 0.45 + lean * 0.45, lerp(y, top, 0.55)], [x - tw * 0.4 + lean, top],
    [x + tw * 0.4 + lean, top], [x + tw * 0.42 + lean * 0.45, lerp(y, top, 0.5)], [x + tw * 0.55, y - h * 0.05], [x + tw * 1.0, y + 1]];
  const limbs = [];
  const nl = o.limbs ?? r.int(2, 3);
  for (let i = 0; i < nl; i++) {
    const u = nl === 1 ? 0 : (i / (nl - 1)) * 2 - 1;
    const bx = x + lean + u * tw * 0.15, by = top + tw * 0.4;
    const ex = bx + u * h * r.range(0.1, 0.17) + r.pm(h * 0.02), ey = top - h * r.range(0.1, 0.18);
    limbs.push({ pts: [[bx, by], [lerp(bx, ex, 0.45) + u * h * 0.02, lerp(by, ey, 0.5)], [ex, ey]], radii: [tw * 0.36, tw * 0.25, tw * 0.14], color: col });
  }
  limbs.forEach((l) => core.limb(l.pts, l.radii, col, { w: o.w ?? penAt(PEN.detail, o.depth) }));
  cel(pts, col, { k: clamp(tw / 10, 0.4, 1.5), w: o.w ?? penAt(PEN.line, o.depth), shade: 0.25 });
  // bark ticks
  if ((o.depth ?? 0) < 0.6 && h > 60) for (let i = 0; i < r.int(2, 4); i++) {
    const yy = lerp(y - 6, top + 6, r.range(0.15, 0.85)), xx = x + lean * 0.5 + r.pm(tw * 0.3);
    ln([[xx, yy], [xx + r.pm(1), yy - r.range(5, 11) * h / 150]], PEN.fine, { color: shade(col, 0.5) });
  }
  return { top: [x + lean, top], limbs, width: tw };
}
// tree(x, y, h, o): x,y = base of the trunk, h = total height
//   o.kind: 'oak' (default: broad clumped canopy), 'round' (compact ball), 'poplar' (tall flame),
//           'pine' (tiered skirts), 'birch' (white trunk, airy canopy), 'bush' (no trunk),
//           'palm', 'blossom' (oak with blossom dots, o.blossom colour)
//   o.leaf, o.leafShade, o.trunk, o.leafLine (mark colour), o.depth (0 near..1 far), o.seed,
//   o.fruit (colour), o.blobs (legacy: [[dx, dy, r]...] in units of h, overrides the clumps)
function tree(x, y, h, o = {}) {
  const r = rngFor(o, 'tree', x, y, h);
  const kind = o.kind || o.species || 'oak';
  const leaf = o.leaf || '#4f8a4a';
  const d = o.depth ?? 0;
  const W = o.w;
  if (kind === 'poplar' || kind === 'cypress') return poplar(x, y, h, leaf, r, o);
  if (kind === 'pine') return pine(x, y, h, leaf, r, o);
  if (kind === 'palm') return palm(x, y, h, leaf, r, o);
  const birch = kind === 'birch';
  const bush = kind === 'bush';
  const round = kind === 'round';
  const tcol = o.trunk || (birch ? '#f2eee4' : '#7a4e31');
  let t = null;
  if (!bush) t = trunk(x, y, h, r, { trunk: tcol, width: h * (birch ? 0.05 : round ? 0.06 : 0.07), len: round ? 0.42 : r.range(0.44, 0.52), depth: d, limbs: round ? 2 : undefined, w: W });
  if (birch && t) for (let i = 0; i < 5; i++) { const yy = lerp(y - 6, t.top[1] + 6, r()); const xx = x + (t.top[0] - x) * ((y - yy) / (y - t.top[1])) + r.pm(h * 0.01); ln([[xx - h * 0.014, yy], [xx + h * 0.006, yy + 0.8]], 1.7, { color: INK, taper: [0.1, 0.5] }); }
  // clumps: the canopy is not a circle: a random aspect, an off-centre mass, uneven clump sizes
  const aspect = round ? r.range(0.95, 1.1) : bush ? 0.8 : r.range(0.72, 1.0);
  const R = h * (bush ? 0.5 : round ? 0.27 : birch ? 0.25 : r.range(0.3, 0.37));
  const Ry = R * aspect;
  const cx = x + (t ? (t.top[0] - x) + r.pm(R * 0.12) : 0);
  const cy = bush ? y - h * 0.45 : (t ? t.top[1] : y) - Ry * (round ? 0.72 : 0.62);
  let circles;
  if (o.blobs) circles = o.blobs.map(([dx, dy, rr]) => [x + dx * h, y + dy * h, rr * h]);
  else {
    circles = [[cx, cy, Math.min(R, Ry) * 0.6]];
    const n = o.clumps ?? (round ? r.int(5, 7) : birch ? r.int(7, 10) : r.int(6, 10));
    const a0 = r() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2 + r.pm(0.3);
      const lower = Math.sin(a) > 0.35;
      const rr = R * r.range(0.26, 0.48) * (lower ? 0.8 : 1) * (birch ? 0.72 : 1);
      const dist = r.range(0.72, 1.0);
      circles.push([cx + Math.cos(a) * (R - rr) * dist, cy + Math.sin(a) * (Ry - rr) * dist, rr]);
    }
    // an odd clump or two poking out breaks the symmetric silhouette
    const odd = round ? 0 : r.int(1, 2);
    for (let i = 0; i < odd; i++) { const a = r.pick([-Math.PI / 2, Math.PI * 0.95, 0.05, -2.3, -0.8]) + r.pm(0.3); circles.push([cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * Ry * 0.8, R * r.range(0.22, 0.32)]); }
  }
  const floor = bush ? y : undefined;
  const pocket = t && !bush ? [t.top[0], cy + Ry * 0.72, R * 0.42, Ry * 0.24] : null;
  canopy(circles, cx, bush ? y - 2 : cy, leaf, { rng: r, leafShade: o.leafShade, depth: d, pocket, limbs: t ? t.limbs : null, markColor: o.leafLine, floor, w: W, marks: birch ? 0.3 : 0.5 });
  if (kind === 'blossom' || o.blossom) {
    const bc = o.blossom || '#f6a8c0';
    for (let i = 0; i < Math.round(R / 2.5); i++) {
      const c = r.pick(circles), a = r() * Math.PI * 2, rd = Math.sqrt(r()) * c[2] * 0.8;
      const bx = c[0] + Math.cos(a) * rd, by = c[1] + Math.sin(a) * rd * 0.85;
      I.fill(I.ell(bx, by, 2.4 + r() * 1.4, 2.1 + r() * 1.3, 7), bc, { wob: 0.4 });
    }
  }
  if (o.fruit) for (let i = 0; i < (o.fruitN ?? 6); i++) { const c = r.pick(circles); core.shape(I.ell(c[0] + r.pm(c[2] * 0.5), c[1] + r.pm(c[2] * 0.4), R * 0.06, R * 0.06, 8), o.fruit, { w: 1 }); }
  return { circles, top: [cx, cy - Ry] };
}
function poplar(x, y, h, leaf, r, o) {
  const d = o.depth ?? 0;
  const col = o.trunk || '#7a4e31';
  const tw = h * 0.035;
  flat([[x - tw, y], [x - tw * 0.7, y - h * 0.14], [x + tw * 0.7, y - h * 0.14], [x + tw, y]], col, { lin: true, w: penAt(PEN.detail, d) });
  const wd = h * r.range(0.14, 0.19), base = y - h * 0.08, tip = y - h;
  const L = [], Rr = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const prof = Math.sin(Math.pow(1 - t, 0.75) * Math.PI) * (t < 0.2 ? 0.75 + t : 1);
    const yy = lerp(base, tip, t);
    const zig = i % 2 ? 1 : 0.8;
    L.push([x - wd * prof * zig + r.pm(wd * 0.06), yy]);
    Rr.push([x + wd * prof * zig * 0.95 + r.pm(wd * 0.06), yy]);
  }
  const pts = L.concat(Rr.reverse());
  const [sx] = shadowDir();
  cel(pts, leaf, { shade: o.leafShade || shade(leaf, 0.24), lx: -sx * wd * 0.45, ly: 0, k: 1, w: o.w ?? penAt(PEN.contour, d), wob: 0.4 });
  // flicks: v-shaped leaf strokes
  if (d < 0.7) for (let i = 0; i < Math.round(h / 22); i++) {
    const t = r.range(0.15, 0.8), yy = lerp(base, tip, t), xx = x + r.pm(wd * 0.5 * Math.sin((1 - t) * Math.PI));
    ln([[xx - 3, yy - 4], [xx, yy], [xx + 3, yy - 4]], penAt(PEN.fine, d), { color: o.leafLine || INK, taper: [0.3, 0.3] });
  }
  return { top: [x, tip] };
}
function pine(x, y, h, leaf, r, o) {
  const d = o.depth ?? 0;
  const col = o.trunk || '#6a452e';
  const tw = h * 0.04;
  flat([[x - tw, y], [x - tw * 0.8, y - h * 0.2], [x + tw * 0.8, y - h * 0.2], [x + tw, y]], col, { lin: true, w: penAt(PEN.detail, d) });
  const tiers = o.tiers ?? r.int(4, 5);
  const lsh = o.leafShade || shade(leaf, 0.24);
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const by = lerp(y - h * 0.12, y - h * 0.8, t), ty = by - h * (0.34 - t * 0.08);
    const wd = h * 0.3 * (1 - t * 0.72) * r.range(0.9, 1.1);
    const pts = [[x + r.pm(1), i === tiers - 1 ? y - h : ty]];
    const nz = 5 + (tiers - i);
    for (let k = 0; k <= nz; k++) {
      const u = k / nz; // right to left along the skirt bottom
      const xx = x + wd - u * 2 * wd, drop = Math.sin(u * Math.PI) * h * 0.03;
      pts.push([xx, by + drop + (k % 2 ? -h * 0.025 : 0)]);
    }
    const [sx] = shadowDir();
    cel(pts, leaf, { shade: lsh, lx: -sx * wd * 0.5, ly: 0, w: o.w ?? penAt(PEN.contour, d), wob: 0.3, lin: true });
  }
  return { top: [x, y - h] };
}
function palm(x, y, h, leaf, r, o) {
  const d = o.depth ?? 0;
  const bend = r.pm(0.25) * h;
  const spine = [[x, y], [x + bend * 0.3, y - h * 0.4], [x + bend, y - h * 0.85]];
  core.limb(spine, [h * 0.035, h * 0.028, h * 0.022], o.trunk || '#9a7048', { w: penAt(PEN.line, d) });
  const top = spine[2];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i / 6 - 0.5) * Math.PI * 1.5 + r.pm(0.15);
    const L = h * r.range(0.3, 0.42);
    const tip = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * 0.6 + L * 0.35];
    const mid = [top[0] + Math.cos(a) * L * 0.55, top[1] + Math.sin(a) * L * 0.55 - L * 0.05];
    const nx = -Math.sin(a) * h * 0.035, ny = Math.cos(a) * h * 0.035;
    cel([top, [mid[0] + nx, mid[1] + ny], tip, [mid[0] - nx, mid[1] - ny]], leaf, { w: penAt(PEN.line, d), k: 0.5 });
  }
  return { top };
}
/// treeline(profile, o): a continuous line of distant trees along a ridge (ZP's lake-shore and
// horizon woods): a lumpy canopy band made of many small clumps of varied size, poplar spikes
// poking up here and there, one cel step, a thin contour, no interior marks.
//   profile: points along the ridge (e.g. the return of hills()); o.h (typical tree height),
//   o.leaf, o.leafShade, o.spikes (fraction of poplars), o.gaps (fraction left open), o.depth
function treeline(profile, o = {}) {
  const r = rngFor(o, 'treeline', profile[0][0], profile[0][1], profile.length);
  const leaf = o.leaf || '#5f9a52', lsh = o.leafShade || shade(leaf, 0.2);
  const th = o.h || 26;
  const d = o.depth ?? 0.6;
  const x0 = Math.max(-20, profile[0][0]), x1 = profile[profile.length - 1][0];
  const circles = [], spikes = [];
  let x = x0;
  while (x < x1) {
    if (r.chance(o.gaps ?? 0.04)) { x += th * r.range(0.8, 1.6); continue; }
    const base = yAt(profile, x) + 2;
    if (r.chance(o.spikes ?? 0.07)) spikes.push([x, base, th * r.range(1.2, 1.8)]);
    else { const rr = th * r.range(0.35, 0.6); circles.push([x, base - rr * r.range(0.5, 1.2), rr]); if (r.chance(0.4)) circles.push([x + r.pm(rr), base - rr * 1.6, rr * 0.55]); }
    x += th * r.range(0.35, 0.7);
  }
  // the band: upper envelope of the clumps down to just under the ridge; shadow fill, lit caps
  // runs of covered ground: each run is one mass (upper envelope of its clumps down past the ridge)
  const runs = [];
  let cur = null;
  for (let xx = x0; xx <= x1; xx += 2) {
    const ridgeY = yAt(profile, xx);
    let top = Infinity;
    circles.forEach(([gx, gy, rr]) => { const dx = xx - gx; if (Math.abs(dx) < rr) top = Math.min(top, gy - Math.sqrt(rr * rr - dx * dx)); });
    if (top < ridgeY) { if (!cur) runs.push((cur = [])); cur.push([xx, top]); } else cur = null;
  }
  const [sx, sy] = shadowDir();
  runs.forEach((env) => {
    if (env.length < 2) return;
    const band = env.concat(env.slice().reverse().map(([xx]) => [xx, yAt(profile, xx) + 1]));
    I.clip(I.poly(band), () => {
      fillP(band, lsh);
      circles.forEach(([gx, gy, rr]) => { if (gx > env[0][0] - rr && gx < env[env.length - 1][0] + rr) I.fill(I.ell(gx - sx * rr * 0.2, gy - sy * rr * 0.25, rr * 0.82, rr * 0.78, 12), leaf, { wob: 0.2 }); });
    });
    ln(env, o.w ?? penAt(PEN.contour, d), { taper: [0.03, 0.03], wob: 0.1 });
  });
  spikes.forEach(([sx, sy, hh]) => poplar(sx, sy, hh, mix(leaf, lsh, 0.3), r, { depth: Math.min(0.9, d + 0.1), leafShade: lsh }));
}
// bush(x, y, w, h, o): a low clumped shrub sitting on y (centre x, width w, height h)
function bush(x, y, w, h, o = {}) {
  const r = rngFor(o, 'bush', x, y, w);
  const leaf = o.leaf || '#5a9447';
  const n = o.clumps ?? Math.max(3, Math.round(w / (h * 0.6)));
  const circles = [];
  // a skyline of clumps: sizes wander, so the top is lumpy but not a row of equal balls
  let rr = h * r.range(0.35, 0.5);
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    const env = 1 - Math.pow(Math.abs(u - 0.5) * 2, 2) * 0.45;
    rr = clamp(rr * r.range(0.75, 1.3), h * 0.25, h * 0.6) ;
    const rad = rr * env;
    circles.push([x - w / 2 + rad * 0.8 + u * (w - rad * 1.6), y - rad * r.range(0.75, 1.15) - (h - rad * 2) * env * r.range(0.2, 0.6), rad]);
  }
  for (let i = 0; i < Math.max(1, Math.round(n / 3)); i++) circles.push([x + r.pm(w * 0.35), y - h * r.range(0.45, 0.65), h * r.range(0.3, 0.42)]);
  canopy(circles, x, y - 2, leaf, { rng: r, leafShade: o.leafShade, depth: o.depth, floor: y, w: o.w, marks: 0.6 });
  if (o.flowers) for (let i = 0; i < (o.flowersN ?? Math.round(w / 12)); i++) {
    const c = r.pick(circles);
    const a = r() * Math.PI * 2;
    I.fill(I.ell(c[0] + Math.cos(a) * c[2] * 0.6, c[1] + Math.sin(a) * c[2] * 0.5, 2.4, 2.2, 6), o.flowers, { wob: 0.3 });
  }
}
// hedge(x0, x1, y, h, o): a row of clumps along a line (a hedgerow or garden hedge)
function hedge(x0, x1, y, h, o = {}) { bush((x0 + x1) / 2, y, x1 - x0, h, { clumps: Math.max(3, Math.round((x1 - x0) / (h * 0.85))), ...o }); }

// ---- flowers ------------------------------------------------------------------------------------
// flower(x, y, s, o): o.kind 'daisy' | 'tulip' | 'poppy' | 'bell' | 'dot'; o.color, o.stem
// (s = 1 is a flower head ~12 px across)
function flower(x, y, s, o = {}) {
  const r = o.rng || rngFor(o, 'flower', x, y);
  const kind = o.kind || 'daisy';
  const col = o.color || '#f4f0e6';
  const stemH = (o.stemH ?? 18) * s;
  const cw = clamp(0.9 * Math.sqrt(s), 0.6, 1.6);
  if (o.stem !== false) {
    ln([[x, y], [x + r.pm(2) * s, y - stemH * 0.5], [x + r.pm(1.5) * s, y - stemH]], 1.2 * Math.sqrt(s), { color: o.stemColor || '#3f7a3a', taper: [0.05, 0.3] });
    if (r.chance(0.6)) { const side = r.chance(0.5) ? 1 : -1; flat([[x, y - stemH * 0.25], [x + side * 7 * s, y - stemH * 0.55], [x + side * 1.5 * s, y - stemH * 0.4]], o.stemColor || '#3f7a3a', { w: cw * 0.7 }); }
  }
  const fx = x, fy = y - stemH;
  if (kind === 'daisy') {
    const n = r.int(6, 8), R = 6.5 * s;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r.pm(0.08);
      pts.push([fx + Math.cos(a - 0.3) * R * 0.4, fy + Math.sin(a - 0.3) * R * 0.32]);
      pts.push([fx + Math.cos(a) * R, fy + Math.sin(a) * R * 0.8]);
    }
    flat(pts, col, { w: cw, wob: 0.15 });
    flat(I.ell(fx, fy, R * 0.3, R * 0.26, 8), o.centre || '#f2c230', { w: cw * 0.8 });
  } else if (kind === 'tulip') {
    const R = 5 * s;
    cel([[fx - R, fy - R * 1.4], [fx - R * 0.3, fy - R * 0.8], [fx, fy - R * 1.5], [fx + R * 0.3, fy - R * 0.8], [fx + R, fy - R * 1.4], [fx + R * 0.95, fy - R * 0.1], [fx, fy + R * 0.5], [fx - R * 0.95, fy - R * 0.1]], col, { w: cw, k: 0.35 * s });
  } else if (kind === 'poppy') {
    const R = 6 * s;
    const pts = [];
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + r.pm(0.2); pts.push([fx + Math.cos(a) * R, fy + Math.sin(a) * R * 0.78], [fx + Math.cos(a + 0.63) * R * 0.78, fy + Math.sin(a + 0.63) * R * 0.62]); }
    cel(pts, col, { w: cw, k: 0.4 * s });
    I.fill(I.ell(fx, fy, R * 0.25, R * 0.22, 7), INK, { wob: 0.2 });
  } else if (kind === 'bell') {
    for (let i = 0; i < 3; i++) { const yy = fy + i * 6 * s, xx = fx + (i % 2 ? 3 : -1) * s; flat([[xx - 2.6 * s, yy], [xx + 2.6 * s, yy], [xx + 3.4 * s, yy + 4.5 * s], [xx - 3.4 * s, yy + 4.5 * s]], col, { w: cw * 0.8 }); }
  } else if (kind === 'spike') {
    // lavender/lupin: a tapering column of small buds on the stem top
    const n = r.int(5, 8);
    for (let i = 0; i < n; i++) { const t = i / (n - 1), by = fy + 6 * s - t * 16 * s, bw = lerp(3.2, 1.6, t) * s; I.fill(I.ell(fx + (i % 2 ? 1.2 : -1.2) * s, by, bw, bw * 0.8, 7), i % 3 === 0 ? shade(col, 0.2) : col, { wob: 0.2 }); }
    ln([[fx - 1.5 * s, fy + 7 * s], [fx - 3 * s, fy - 4 * s]], cw * 0.7, { color: shade(col, 0.45), taper: [0.2, 0.5] });
  } else flat(I.ell(fx, fy, 3 * s, 3 * s, 7), col, { w: cw * 0.7 });
}
// flowerBed(area, o): clustered patches of flowers (same kind + colour per patch, sizes by depth)
//   o.colors, o.kinds, o.patches, o.s (size multiplier)
function flowerBed(area, o = {}) {
  const r = rngFor(o, 'fbed', area.x, area.y, area.w);
  const colors = o.colors || ['#f4f0e6', '#e8584a', '#f2c230', '#b86ad0', '#f09ab8'];
  const kinds = o.kinds || ['daisy', 'tulip', 'poppy', 'daisy', 'spike'];
  const P = o.patches ?? Math.round(area.w / 40);
  const items = [];
  for (let p = 0; p < P; p++) {
    const px = area.x + r() * area.w, t = r(), py = area.y + t * area.h;
    const ci = r.int(0, colors.length - 1), kind = kinds[ci % kinds.length];
    const k = r.int(3, 8);
    for (let j = 0; j < k; j++) items.push([px + r.pm(26 * (0.5 + t)), py + r.pm(7), lerp(0.55, 1.25, t) * (o.s ?? 1), colors[ci], kind]);
  }
  items.sort((a, b) => a[1] - b[1]).forEach(([x, y, s, col, kind]) => flower(x, y, s * r.range(0.8, 1.15), { rng: r, color: col, kind }));
}

// ---- stone ------------------------------------------------------------------------------------
// an irregular rock from four corners (tl, tr, br, bl): each corner rounded by its own amount,
// each edge bulged a little. This is what keeps a wall from reading as rounded bricks.
function rockPoly(tl, tr, br, bl, r, o = {}) {
  const C = [tl, tr, br, bl];
  const size = Math.min(Math.hypot(tr[0] - tl[0], tr[1] - tl[1]), Math.hypot(bl[0] - tl[0], bl[1] - tl[1]));
  const out = [];
  for (let i = 0; i < 4; i++) {
    const p = C[i], prev = C[(i + 3) % 4], next = C[(i + 1) % 4];
    const c = r.range(0.12, o.round ?? 0.42);
    const toP = (q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
    const lp = Math.hypot(prev[0] - p[0], prev[1] - p[1]) || 1, lnx = Math.hypot(next[0] - p[0], next[1] - p[1]) || 1;
    out.push(toP(prev, Math.min(0.45, (c * size) / lp)));
    out.push([p[0] + r.pm(size * 0.04) + ((prev[0] + next[0]) / 2 - p[0]) * 0.08, p[1] + r.pm(size * 0.04) + ((prev[1] + next[1]) / 2 - p[1]) * 0.08]);
    out.push(toP(next, Math.min(0.45, (c * size) / lnx)));
    // bulge along the edge to the next corner
    const m = [(p[0] + next[0]) / 2, (p[1] + next[1]) / 2];
    const ex = next[0] - p[0], ey = next[1] - p[1], el = Math.hypot(ex, ey) || 1;
    const b = r.range(-0.3, 1) * size * 0.07;
    out.push([m[0] + (ey / el) * b + r.pm(size * 0.05), m[1] - (ex / el) * b]);
  }
  return out;
}
function stonePts(x, y, w, h, r) { return rockPoly([x, y], [x + w, y], [x + w, y + h], [x, y + h], r); }
// stone(x, y, w, h, color, o): one boulder/pebble sitting at x,y (bottom-left): flat-ish bottom,
// lumpy top, cel shadow, a crack or a chip
function stone(x, y, w, h, color = '#b9b0a0', o = {}) {
  const r = rngFor(o, 'stone', x, y, w);
  const n = r.int(6, 8);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI; // top half, left to right
    const rr = r.range(0.8, 1.08);
    pts.push([x + w / 2 + Math.cos(a) * w * 0.5 * rr, y - h * 0.15 + Math.sin(a) * h * 0.85 * rr]);
  }
  pts.push([x + w * 0.96, y - h * 0.05], [x + w * 0.7, y + 1], [x + w * 0.3, y + 1], [x + w * 0.04, y - h * 0.05]);
  cel(pts, color, { k: clamp(w / 25, 0.3, 2), shade: o.shade ?? 0.24, w: o.w ?? PEN.line });
  if (w > 18 && r.chance(0.7)) { const cx = x + w * r.range(0.3, 0.7), cy = y - h * r.range(0.45, 0.7); ln([[cx - w * 0.14, cy], [cx, cy + h * 0.12], [cx + w * 0.1, cy + h * 0.06]], PEN.fine, { color: o.crack || INK }); }
}
// stoneWall(x, y, w, h, o): a dry-stone wall standing on ground line y, from x to x+w, h tall.
//   Stones are packed like a real wall: each rests on the highest point under it, so courses
//   wander, tilt and leave dark voids; stones vary in length, height and tone, each with a cel
//   shadow; a row of upright coping stones along the top; weeds at the foot.
//   o.color (stone), o.gap (void colour), o.course (typical stone height), o.cope (true),
//   o.tone (tone variation 0..1), o.h1 (height at the right end: a wall receding in perspective),
//   o.moss (colour for a few moss patches), o.weeds (tuft count), o.depth, o.seed
function stoneWall(x, y, w, h, o = {}) {
  const r = rngFor(o, 'wall', x, y, w, h);
  const col = o.color || '#c9bb9a';
  const gap = o.gap || mix(shade(col, 0.62), '#2a2630', 0.35);
  const h1 = o.h1 ?? h;
  const d = o.depth ?? 0;
  const topAt = (xx) => y - lerp(h, h1, clamp((xx - x) / w, 0, 1));
  const sc = (xx) => lerp(1, h1 / h, clamp((xx - x) / w, 0, 1)); // perspective scale along the wall
  const sil = [[x, y]];
  const N = Math.max(6, Math.round(w / 14));
  for (let i = 0; i <= N; i++) { const xx = x + (i / N) * w; sil.push([xx, topAt(xx) + r.pm(1.2)]); }
  for (let i = N; i >= 0; i--) sil.push([x + (i / N) * w, y]);
  const course = o.course ?? clamp(h / 3.4, 8, 34);
  const coping = o.cope !== false;
  const copeH = coping ? course * 0.95 : 0;
  const stoneW = penAt(PEN.detail * 0.85, d);
  I.clipPoly(sil, () => {
    fillP([[x - 5, y + 5], [x - 5, Math.min(topAt(x), topAt(x + w)) - 10], [x + w + 5, Math.min(topAt(x), topAt(x + w)) - 10], [x + w + 5, y + 5]], gap);
    // height map of the packed wall
    var B = 2, nb = Math.ceil(w / B) + 4;
    var hm = new Array(nb).fill(0).map(() => y + 1);
    const limit = (i) => topAt(x + i * B) + copeH * sc(x + i * B);
    let pass = 0;
    while (pass++ < 80) {
      let i = Math.floor(r() * course / B) * (pass === 1 ? 1 : 0);
      let placed = 0;
      while (i < nb) {
        const xx = x + i * B;
        const s = sc(xx);
        let len = course * s * (r.chance(0.2) ? r.range(0.5, 0.85) : r.range(1.0, 2.4));
        const nbins = Math.max(2, Math.round(len / B));
        const j = Math.min(nb, i + nbins);
        let base = Infinity, lim = -Infinity;
        for (let k = i; k < j; k++) { base = Math.min(base, hm[k]); lim = Math.max(lim, limit(k)); }
        if (base - lim < 4 * s) { i = j; continue; }
        const ch = Math.min(course * s * (r.chance(0.15) ? r.range(1.3, 1.7) : r.range(0.55, 1.15)), base - lim);
        if (base - lim - ch < course * s * 0.35) { /* fill to the coping line */ }
        const top = base - ((base - lim - ch) < course * s * 0.35 ? base - lim : ch);
        const g = r.range(1.0, 2.0) * s;
        const tilt = r.pm(ch * 0.22);
        const tL = top + tilt + r.pm(ch * 0.06), tR = top - tilt + r.pm(ch * 0.06);
        const x0 = xx + g / 2, x1 = x + j * B - g / 2;
        const lean = r.pm(ch * 0.12);
        const tone = mix(col, r.chance(0.5) ? '#ffffff' : '#5a4a3a', r() * (o.tone ?? 0.24));
        // the underside settles into whatever is below it, so voids stay small
        const bL = hm[i] - g / 2, bR = hm[j - 1] - g / 2;
        const pts = rockPoly([x0 + lean, tL + g / 2], [x1 + lean * 0.5, tR + g / 2], [x1, bR], [x0, bL], r, { round: 0.34 });
        cel(pts, tone, { k: 0.5 * s, shade: 0.26, w: stoneW, wob: 0.2 });
        const sw = x1 - x0, sh = base - Math.max(tL, tR);
        if (sw > course * 1.1 && r.chance(0.3) && d < 0.6) { const cx = x0 + sw * r.range(0.25, 0.6), cy = base - sh * r.range(0.3, 0.6); ln([[cx, cy], [cx + sw * 0.12, cy + r.pm(2)], [cx + sw * 0.22, cy + r.pm(3)]], PEN.fine, { color: shade(tone, 0.55) }); }
        if (o.moss && r.chance(0.1)) I.fill(I.ell(x0 + sw * 0.4, Math.min(tL, tR) + g + 2, sw * 0.25, 2.5, 8), o.moss, { wob: 0.6 });
        for (let k = i; k < j; k++) hm[k] = lerp(tL, tR, (k - i) / Math.max(1, j - i - 1));
        placed++;
        i = j;
      }
      if (!placed) break;
    }
    // coping: upright slabs of varied width, leaning a little
    if (coping) {
      let xx = x - 2;
      while (xx < x + w) {
        const s = sc(xx);
        const cw = course * s * (r.chance(0.25) ? r.range(0.6, 0.9) : r.range(0.3, 0.55));
        const top = topAt(xx), ch = copeH * s * r.range(0.9, 1.35);
        const lean = r.pm(cw * 0.5) + (o.copeLean ?? 0.15) * cw;
        const tone = mix(col, '#5a4a3a', r() * 0.2);
        const i0 = clamp(Math.floor((xx - x) / B), 0, nb - 1), i1 = clamp(Math.floor((xx + cw - x) / B), 0, nb - 1);
        const bl = clamp(hm[i0] - 1, top + ch, top + ch * 1.5), br = clamp(hm[i1] - 1, top + ch, top + ch * 1.5);
        const pts = rockPoly([xx + lean + 0.8, top + r.pm(1.5)], [xx + cw + lean - 0.8, top + r.pm(1.5)], [xx + cw - 0.8, br], [xx + 0.8, bl], r, { round: 0.3 });
        cel(pts, tone, { k: 0.3 * s, shade: 0.24, w: penAt(PEN.fine, d), wob: 0.15 });
        xx += cw + r.range(0.4, 1.4);
      }
    }
  });
  // outer contour heavier than the stone lines
  ln(sil.slice(1, N + 2), o.w ?? penAt(PEN.contour, d), { taper: [0, 0], wob: 0.2 });
  if (o.ends !== false) {
    ln([[x, y], [x, topAt(x)]], penAt(PEN.line, d), { taper: [0, 0] });
    ln([[x + w, y], [x + w, topAt(x + w)]], penAt(PEN.line, d), { taper: [0, 0] });
  }
  ln([[x, y], [x + w, y]], penAt(PEN.line, d), { taper: [0, 0] });
  for (let i = 0; i < (o.weeds ?? Math.round(w / 70)); i++) tuft(x + r() * w, y + 1, (0.9 + r() * 0.7) * sc(x), { rng: r, color: o.weedColor || '#3f6a34' });
  return { topAt };
}
// flagstones / paving in perspective: o.vp vanishing point
function paving(x, y, w, h, o = {}) {
  const r = rngFor(o, 'paving', x, y, w);
  const col = o.color || '#d8d2c4';
  I.rect(x, y, w, h, col);
  const lc = o.line || shade(col, 0.35);
  const vp = o.vp || [x + w / 2, y - h * 2];
  const rows = o.rows ?? 5;
  for (let i = 1; i <= rows; i++) { const t = Math.pow(i / (rows + 1), 1.6); const yy = y + h * t; ln([[x - 4, yy], [x + w + 4, yy + r.pm(1)]], lerp(0.8, 1.6, t), { color: lc, taper: [0, 0] }); }
  for (let k = -6; k <= 6; k++) { const bx = x + w / 2 + k * (o.slab ?? 70); ln([[lerp(vp[0], bx, (y - vp[1]) / (y + h - vp[1])), y], [bx, y + h]], 1.2, { color: lc, taper: [0, 0] }); }
}

// ---- water --------------------------------------------------------------------------------------
// sea(w, y, h, color, o): open water from horizon y down h px.
//   wave marks sit in perspective rows (small and close together near the horizon, larger and
//   farther apart near the viewer), a paler band along the horizon, a few darker troughs.
//   o.waves (density, default 14 ~ old count), o.lineColor (crest marks), o.dark (trough colour),
//   o.horizon (false: no horizon line), o.glitter (x of the sun/moon for a path of light), o.glitterColor
function sea(w, y, h, color, o = {}) {
  const r = rngFor(o, 'sea', w, y, h);
  I.rect(-2, y, w + 4, h + 2, color);
  const band = o.band ?? mix(color, o.sky || '#ffffff', 0.18);
  I.rect(-2, y, w + 4, Math.max(3, h * 0.07), band);
  if (o.horizon !== false) ln([[-4, y], [w + 4, y]], o.hw ?? BG, { taper: [0, 0], wob: 0.15 });
  const lc = o.lineColor || mix(color, '#ffffff', 0.55);
  const dk = o.dark || shade(color, 0.22);
  const dens = (o.waves ?? 14) / 14;
  const rows = Math.round(10 * Math.sqrt(dens) + 4);
  for (let i = 0; i < rows; i++) {
    const t = Math.pow((i + 0.6) / rows, 1.7);
    const yy = y + h * 0.08 + t * h * 0.92;
    const L = lerp(8, 46, t);
    const per = Math.round((w / (L * 2.4)) * dens * r.range(0.6, 1));
    for (let k = 0; k < per; k++) {
      const x = r() * (w + 40) - 20, yj = yy + r.pm(h * 0.02);
      const a = lerp(1.2, 5, t);
      if (r.chance(0.7)) {
        // crest: a flattened "~" with the light colour, tapered; near crests may glow and foam
        const pts = [[x, yj], [x + L * 0.3, yj - a], [x + L * 0.6, yj - a * 0.2], [x + L, yj + a * 0.3]];
        if (o.glow && t > 0.35) ln(pts, 3 + t * 9, { color: o.glow, taper: [0.4, 0.4], op: 0.2 + t * 0.3 });
        ln(pts, lerp(0.9, 2.2, t), { color: lc, taper: [0.35, 0.45], wob: 0.2 });
        if (o.foam && t > 0.5 && r.chance(0.4)) for (let f = 0; f < 3; f++) I.fill(I.ell(x + L * (0.25 + f * 0.14), yj - a - 2 - f * 0.8, 1.2 + t * 1.4, 1 + t, 6), o.foam, { wob: 0 });
      } else {
        ln([[x, yj + a], [x + L * 0.5, yj], [x + L, yj + a]], lerp(0.8, 2, t), { color: dk, taper: [0.4, 0.4], wob: 0.2 });
      }
    }
  }
  if (o.glitter != null) {
    const gc = o.glitterColor || '#fff6d8';
    for (let i = 0; i < 26; i++) {
      const t = Math.pow(r(), 1.3), yy = y + 3 + t * h;
      const spread = lerp(6, 70, t), L = lerp(4, 26, t);
      const x = o.glitter + r.pm(spread);
      ln([[x - L / 2, yy], [x + L / 2, yy + r.pm(0.5)]], lerp(1, 2.6, t), { color: gc, taper: [0.3, 0.3] });
    }
  }
}
// shore(w, y, h, o): beach seen from above/behind: sea at the top down to a lacy foam line, a band
// of wet sand that mirrors the sky, then dry sand. y = waterline, h = height of the sand below it.
//   o.sea, o.sand, o.wet, o.foam, o.seaTop (y where sea starts, default y - 60), o.shells
function shore(w, y, h, o = {}) {
  const r = rngFor(o, 'shore', w, y, h);
  const sand = o.sand || '#f1dcaa', wet = o.wet || mix(sand, '#8a7a6a', 0.3), seaC = o.sea || '#4fa3c7';
  const foam = o.foam || '#ffffff';
  const top = o.seaTop ?? y - 60;
  // dry sand
  I.rect(-2, y - 4, w + 4, h + 8, sand);
  // wet band: a wavy edge below the waterline
  const wetEdge = [];
  for (let x = -10; x <= w + 10; x += w / 14) wetEdge.push([x, y + 12 + Math.sin(x / 70 + r() * 0.5) * 5 + r.pm(2)]);
  fillP([[-10, y - 2], ...wetEdge, [w + 10, y - 2]], wet, { wob: 0.3 });
  // reflections in the wet sand: pale horizontal streaks
  for (let i = 0; i < 9; i++) { const x = r() * w, yy = y + 3 + r() * 9, L = r.range(14, 50); ln([[x, yy], [x + L, yy]], 1.4, { color: mix(wet, '#ffffff', 0.4), taper: [0.3, 0.3] }); }
  // sea above
  const edge = [];
  for (let x = -10; x <= w + 10; x += 10) edge.push([x, y + Math.sin(x / 55 + 1.3) * 4 + Math.sin(x / 17) * 1.5]);
  fillP([[-10, top], [w + 10, top], ...edge.slice().reverse()], seaC, { wob: 0.2 });
  // foam: a lacy scalloped band just above the edge, plus a thinner receding line further out
  // foam: the sea-side edge is a chain of scallops of varied size (ZP's lace), the sand side
  // follows the waterline; holes of sea show through; a thinner broken lace line further out
  const scallops = (off, fl = 1) => {
    const pts = [];
    let x = -14;
    while (x < w + 14) {
      const sw = r.chance(0.3) ? r.range(16, 30) : r.range(5, 13), bh = sw * r.range(0.18, 0.4) * fl;
      const base = yAt(edge, x + sw / 2) - off;
      for (let k = 0; k <= 4; k++) { const a = Math.PI + (k / 4) * Math.PI; pts.push([x + sw / 2 + Math.cos(a) * sw / 2, base + Math.sin(a) * bh]); }
      x += sw;
    }
    return pts;
  };
  const top1 = scallops(6, 0);
  fillP(top1.concat(edge.slice().reverse().map(([x, yy]) => [x, yy + 1])), foam, { wob: 0.2 });
  ln(top1, 1.3, { color: shade(seaC, 0.4), taper: [0, 0], wob: 0.2 });
  for (let i = 0; i < 26; i++) { const x = r() * w; I.fill(I.ell(x, yAt(edge, x) - 3.5 - r() * 2, r.range(1.5, 3.5), r.range(0.7, 1.3), 7), mix(seaC, foam, 0.35), { wob: 0.2 }); }
  // second, receding line: broken scallop strokes
  const top2 = scallops(r.range(20, 28), 0.35);
  for (let i = 0; i < top2.length - 6; i += r.int(14, 30)) ln(top2.slice(i, i + r.int(10, 22)), r.range(1.3, 2.2), { color: foam, taper: [0.2, 0.2], wob: 0.2 });
  ln(edge, 1.3, { color: shade(sand, 0.4), taper: [0, 0], wob: 0.3 });
  if (o.shells) for (let i = 0; i < o.shells; i++) { const x = r() * w, yy = y + 20 + r() * (h - 25); I.fill(I.ell(x, yy, 2.5, 1.6, 6), r.pick(['#ffffff', '#f4c6b0', '#e8e0d0']), { wob: 0.2 }); }
  // sea texture: a few highlight dashes
  for (let i = 0; i < 44; i++) {
    const t = r(), yy = lerp(top + 4, y - 16, t), x = r() * w, L = lerp(10, 40, t);
    const lite = r.chance(0.6);
    ln([[x, yy], [x + L * 0.3, yy - 1.8], [x + L * 0.65, yy + 0.8], [x + L, yy - 0.6]], lerp(0.9, 1.9, t), { color: lite ? mix(seaC, '#ffffff', 0.45) : shade(seaC, 0.2), taper: [0.35, 0.35] });
  }
}

// ---- sky ------------------------------------------------------------------------------------------
// cloud(x, y, s, color, o): flat-bottomed cumulus; x,y = centre, s = size (half-width ~1.7 s).
//   o.kind 'cumulus' (default) | 'stratus' (long, thin) | 'puff' (small, round)
//   o.shade (belly colour), o.w (contour), o.marks (little cup lines inside), o.seed
function cloud(x, y, s, color = '#ffffff', o = {}) {
  const r = rngFor(o, 'cloud', x, y, s);
  const kind = o.kind || 'cumulus';
  const base = y + s * 0.5;
  const circles = [];
  if (kind === 'stratus') {
    const n = r.int(4, 6), W = s * 3.4;
    for (let i = 0; i < n; i++) { const u = i / (n - 1); circles.push([x - W / 2 + u * W, base - s * 0.1, s * r.range(0.25, 0.42) * (1 - Math.abs(u - 0.5) * 0.6)]); }
    circles.push([x + r.pm(s * 0.5), base - s * 0.3, s * 0.4]);
  } else if (kind === 'puff') {
    circles.push([x, base - s * 0.45, s * 0.6], [x - s * 0.55, base - s * 0.15, s * 0.38], [x + s * 0.55, base - s * 0.2, s * 0.42]);
  } else {
    const n = r.int(5, 8), W = s * r.range(2.6, 3.6);
    const peak = r.range(0.3, 0.7); // the tallest part is off-centre
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const mid = 1 - Math.min(1, Math.abs(u - peak) * 1.5);
      const rr = s * lerp(0.28, 0.85, mid) * r.range(0.75, 1.2);
      circles.push([x - W / 2 + u * W + r.pm(s * 0.12), base - rr * r.range(0.3, 0.7), rr]);
    }
    // upper tiers of smaller bumps
    const k = r.int(2, 4);
    for (let i = 0; i < k; i++) circles.push([x - W / 2 + W * clamp(peak + r.pm(0.3), 0.15, 0.85), base - s * r.range(0.8, 1.35), s * r.range(0.3, 0.5)]);
  }
  const out = blobOutline(circles, x, base - 0.5, 110, { floor: base });
  const belly = typeof o.shade === 'string' ? o.shade : mix(color, o.shadeTo || '#a8bcd8', o.shade ?? 0.3);
  const p = I.wobble(out, 0.25);
  I.clipPoly(p, () => {
    fillP(p, belly);
    // lit tops of every bump, stopping short of the flat bottom
    circles.forEach(([cx, cy, rr]) => I.fill(I.ell(cx - rr * 0.08, cy - rr * 0.12, rr * 0.92, rr * 0.88, 16), color, { wob: 0.2 }));
    I.rect(x - s * 3, base - s * 0.12, s * 6, s * 0.3, belly);
  });
  // little cup marks under a few bumps (ZP's cloud texture)
  if (o.marks !== false) circles.forEach(([cx, cy, rr], i) => {
    if (!r.chance(0.5) || rr < s * 0.3) return;
    const arc = I.arc(cx, cy + rr * 0.1, rr * 0.55, rr * 0.45, Math.PI * 0.2, Math.PI * 0.75, 5);
    if (arc.every((q) => inside(q, out) && q[1] < base - 3)) ln(arc, o.markW ?? PEN.fine, { color: o.markColor || INK, taper: [0.3, 0.3] });
  });
  if ((o.w ?? BG) > 0) inkP(p, o.w ?? BG, { vary: 0.22 });
  return out;
}
// stars(w, h, n, color, o): varied stars: many pin-pricks, some dots, a few four-point sparkles,
// one or two with a halo; loosely clustered, thinning toward the bottom of the band.
//   o.band (fraction of h used, default 1), o.max (max dot radius), o.x0/o.y0 (offset), o.seed
function stars(w, h, n, color = '#fff6d6', o = {}) {
  const r = rngFor(o, 'stars', w, h, n);
  const x0 = o.x0 || 0, y0 = o.y0 || 0;
  const H = h * (o.band || 1);
  const clusters = [];
  for (let i = 0; i < 4; i++) clusters.push([r() * w, r() * H * 0.7]);
  const max = o.max || 1.8;
  for (let i = 0; i < n; i++) {
    let x, y;
    if (r.chance(0.25)) { const c = r.pick(clusters); x = c[0] + r.gauss() * w * 0.14; y = c[1] + r.gauss() * H * 0.16; }
    else { x = r() * w; y = Math.pow(r(), 1.35) * H; }
    if (y < 0 || y > H || x < 0 || x > w) continue;
    x += x0; y += y0;
    const kind = r();
    if (kind < 0.07) {
      // four-point sparkle
      const L = r.range(3.5, 6.5) * (max / 1.8), t = L * 0.16;
      I.fill([[x, y - L], [x + t, y - t], [x + L * 0.8, y], [x + t, y + t], [x, y + L], [x - t, y + t], [x - L * 0.8, y], [x - t, y - t]], color, { wob: 0, lin: true });
      if (r.chance(0.35)) I.fill(I.ell(x, y, L * 0.9, L * 0.9, 14), color, { wob: 0, op: 0.12 });
    } else if (kind < 0.3) {
      I.fill(I.ell(x, y, r.range(1, max), r.range(1, max), 7), color, { wob: 0.15 });
    } else {
      I.fill(I.ell(x, y, r.range(0.45, 0.95), r.range(0.45, 0.95), 5), color, { wob: 0, op: r.range(0.55, 1) });
    }
  }
}
// moon(x, y, r, color, sky, o): with sky given, a crescent (the sky colour bites the disc);
// without, a full moon with flat crater patches. Always a stepped flat glow around it.
//   o.glow (false to skip), o.glowColor, o.craters, o.w (contour, default none)
function moon(x, y, rad, color = '#fff3c4', sky, o = {}) {
  const r = rngFor(o, 'moon', x, y, rad);
  if (o.glow !== false) [[2.6, 0.06], [1.9, 0.08], [1.4, 0.12]].forEach(([k, op]) => I.fill(I.ell(x, y, rad * k, rad * k, 36), o.glowColor || color, { wob: 0, op: op * (o.glowK ?? 1) }));
  core.shape(I.ell(x, y, rad, rad, 32), color, { w: o.w ?? 0, wob: 0 });
  // crescent: the bite is clipped to the disc, so it never covers the glow
  if (sky) I.clipPoly(I.ell(x, y, rad + 0.5, rad + 0.5, 32), () => I.fill(I.ell(x + rad * 0.45, y - rad * 0.2, rad * 0.9, rad * 0.9, 32), sky, { wob: 0 }));
  else if (o.craters !== false) {
    I.clipPoly(I.ell(x, y, rad, rad, 32), () => {
      const cc = o.crater || shade(color, 0.12);
      for (let i = 0; i < (o.craters ?? 5); i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad * 0.7, cr = rad * r.range(0.1, 0.24);
        I.fill(I.ell(x + Math.cos(a) * d, y + Math.sin(a) * d, cr, cr * r.range(0.7, 1), 10, r() * 3), cc, { wob: cr * 0.15 });
      }
      const [sx, sy] = shadowDir();
      I.fill(I.ell(x + sx * rad * 1.2, y + sy * rad * 1.2, rad * 1.05, rad * 1.05, 28), shade(color, 0.08), { wob: 0, op: 0.7 });
    });
  }
}
// sun(x, y, r, color, o): flat disc with stepped glow rings; o.glow (colour), o.rays (count),
// o.rayColor, o.w (contour)
function sun(x, y, rad, color = '#ffe7a3', o = {}) {
  if (o.glow) [[2.4, 0.12], [1.8, 0.16], [1.35, 0.22]].forEach(([k, op]) => I.fill(I.ell(x, y, rad * k, rad * k, 36), o.glow, { wob: 0, op }));
  if (o.rays) {
    const r = rngFor(o, 'sunrays', x, y);
    for (let i = 0; i < o.rays; i++) {
      const a = (i / o.rays) * Math.PI * 2 + r.pm(0.05);
      const L = rad * r.range(0.35, 0.6);
      ln([[x + Math.cos(a) * rad * 1.25, y + Math.sin(a) * rad * 1.25], [x + Math.cos(a) * (rad * 1.25 + L), y + Math.sin(a) * (rad * 1.25 + L)]], 2, { color: o.rayColor || color, taper: [0.2, 0.5] });
    }
  }
  core.shape(I.ell(x, y, rad, rad, 32), color, { w: o.w ?? 0, wob: 0 });
}
// rain(w, h, n, color, ang): slanted dashes of varied length, some doubled
function rain(w, h, n, color = '#ffffff', ang = 78, o = {}) {
  const r = rngFor(o, 'rain', w, h, n);
  const a = (ang * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const x = r() * (w + 60) - 30, y = r() * h, l = r.range(8, 26);
    line([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], r.range(0.9, 1.6), { color, taper: [0.3, 0.3], op: r.range(0.6, 1) });
  }
}

// sky(w, h, top, low, o): the sky behind everything. ZP skies are flat or a soft two-colour fade;
// o.bands: n flat value steps instead of a gradient (a painted look), o.y0/o.h to limit it
function sky(w, h, top, low, o = {}) {
  const y0 = o.y0 || 0, hh = o.h || h;
  if (o.bands) {
    for (let i = 0; i < o.bands; i++) { const t = i / (o.bands - 1 || 1); I.rect(-2, y0 + (hh * i) / o.bands - 1, w + 4, hh / o.bands + 2, mix(top, low, t)); }
  } else if (low && low !== top) {
    const PG = require('./page');
    I.rect(-2, y0 - 2, w + 4, hh + 4, PG.linear(0, y0, 0, y0 + hh, [[0, top], [o.mid ?? 1, low]]));
  } else I.rect(-2, y0 - 2, w + 4, hh + 4, top);
}
// river(w, y, h, color, o): a band of water across the scene narrowing into the distance, bank
// lines inked, a few ripple dashes and a reflection strip. y = far bank at the left edge.
function river(w, y, h, color = '#6aa8c8', o = {}) {
  const r = rngFor(o, 'river', w, y, h);
  const top = [], bot = [];
  for (let i = 0; i <= 10; i++) { const x = -10 + (i / 10) * (w + 20); const t = i / 10; top.push([x, y - t * (o.rise ?? h * 0.4) + Math.sin(t * 5 + 1) * 2]); bot.push([x, y + h * lerp(1, 0.55, t) - t * (o.rise ?? h * 0.4) + Math.sin(t * 4) * 3]); }
  const poly = top.concat(bot.slice().reverse());
  fillP(poly, color, { wob: 0.3 });
  I.clipPoly(poly, () => {
    fillP(top.concat(top.slice().reverse().map(([x, yy]) => [x, yy + h * 0.18])), light(color, 0.2), { wob: 0.3 });
    for (let i = 0; i < Math.round(w / 40); i++) { const x = r() * w, t = r(), yy = lerp(yAt(top, x) + 4, yAt(bot, x) - 3, t), L = lerp(6, 22, t); ln([[x, yy], [x + L, yy]], lerp(0.9, 1.7, t), { color: r.chance(0.6) ? light(color, 0.45) : shade(color, 0.2), taper: [0.3, 0.3] }); }
  });
  ln(top, PEN.line, { taper: [0, 0] });
  ln(bot, PEN.line, { taper: [0, 0] });
  return { top, bot };
}
// bridge(x0, x1, y, h, o): an arched footbridge from x0 to x1 with its deck at y, arch rise h,
// railings with posts; o.color, o.stone (true: a stone arch with voussoir marks)
function bridge(x0, x1, y, h, o = {}) {
  const c = o.color || '#b89a70';
  const N = 16, deck = [];
  for (let k = 0; k <= N; k++) { const t = k / N; deck.push([lerp(x0, x1, t), y - Math.sin(t * Math.PI) * h * 0.35]); }
  const th = Math.max(5, h * 0.12);
  const under = []; for (let k = 0; k <= N; k++) { const t = k / N; under.push([lerp(x0 + (x1 - x0) * 0.1, x1 - (x1 - x0) * 0.1, t), y + th * 2 - Math.sin(t * Math.PI) * (h * 0.35 + th)]); }
  // the arch body: the deck on top, the arch opening underneath
  const body = deck.concat([[x1 + th, y + th * 2]], under.slice().reverse(), [[x0 - th, y + th * 2]]);
  cel(body, c, { w: PEN.line, k: 0.8 });
  if (o.stone) for (let k = 1; k < N; k += 2) { const p = under[k]; ln([p, [p[0], p[1] - th * 0.9]], PEN.fine, { color: shade(c, 0.4) }); }
  // railing
  const rail = deck.map(([x, yy]) => [x, yy - h * 0.3]);
  ln(rail, PEN.line * 1.1, { color: shade(c, 0.1), taper: [0, 0] });
  ln(rail, PEN.detail * 0.6, { color: light(c, 0.3), taper: [0, 0] });
  deck.forEach(([x, yy], k) => { if (k % 2 === 0) ln([[x, yy], [x, yy - h * 0.3]], PEN.detail, { color: INK, taper: [0, 0] }); });
}
// duck(x, y, s, o): a white duck on the water (o.color, o.head)
function duck(x, y, s = 1, o = {}) {
  cel([[x - 14 * s, y - 2 * s], [x - 8 * s, y - 9 * s], [x + 6 * s, y - 8 * s], [x + 12 * s, y - 3 * s], [x + 8 * s, y + 3 * s], [x - 10 * s, y + 3 * s], [x - 17 * s, y - 6 * s]], o.color || '#ffffff', { w: PEN.line, k: 0.4 * s });
  cel(I.ell(x + 9 * s, y - 13 * s, 5 * s, 5 * s, 10), o.head || '#3f7a4a', { w: PEN.detail, k: 0.3 * s });
  core.shape([[x + 13 * s, y - 13 * s], [x + 20 * s, y - 11.5 * s], [x + 13 * s, y - 10 * s]], '#f2a23a', { w: PEN.fine });
  I.fill(I.ell(x + 10 * s, y - 14 * s, 1 * s, 1 * s, 6), INK, { wob: 0 });
  ln([[x - 18 * s, y + 4 * s], [x + 16 * s, y + 4 * s]], PEN.fine, { color: '#ffffff', op: 0.7 });
}

// =================================================================================================
// INTERIORS — one-point perspective, ZP style: furniture is built as boxes (front face + the top or
// side you can see toward the vanishing point), the face toward the light flat, the far face one cel
// step darker, outer silhouette heavier than the inner edges. Every piece takes o.vp (vanishing
// point, default high above the piece: you see tops, not sides) and o.d (depth as a fraction of the
// distance to the vp, default 0.1).
// =================================================================================================
const recede = (p, vp, k) => [p[0] + (vp[0] - p[0]) * k, p[1] + (vp[1] - p[1]) * k];
// block(x, y, w, h, color, o): a box whose front face is the rect x,y,w,h
//   o.vp, o.d, o.top (colour of the top face), o.side (colour of the side face), o.w (contour),
//   o.inner (edge weight), o.front (fn(pts) drawn clipped inside the front face), o.noFront
// returns { front, top, side, back } point lists
function block(x, y, w, h, color, o = {}) {
  const vp = o.vp || [x + w / 2, y - 900];
  const k = o.d ?? 0.1;
  const F = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const B = F.map((p) => recede(p, vp, k));
  const cw = o.w ?? PEN.line, iw = o.inner ?? PEN.detail;
  const faces = {};
  const topC = o.top || light(color, 0.14), sideC = o.side || shade(color, 0.2), botC = shade(color, 0.35);
  if (vp[1] < y) faces.top = [F[0], F[1], B[1], B[0]];
  if (vp[1] > y + h) faces.bottom = [F[3], F[2], B[2], B[3]];
  if (vp[0] > x + w) faces.side = [F[1], F[2], B[2], B[1]];
  if (vp[0] < x) faces.side = [F[0], F[3], B[3], B[0]];
  if (faces.top) fillP(faces.top, topC, { lin: true, wob: 0.15 });
  if (faces.bottom) fillP(faces.bottom, botC, { lin: true, wob: 0.15 });
  if (faces.side) fillP(faces.side, sideC, { lin: true, wob: 0.15 });
  if (!o.noFront) {
    fillP(F, color, { lin: true, wob: 0.15 });
    if (o.front) I.clip(I.poly(F), () => o.front(F));
  }
  // inner edges thin, silhouette heavy
  if (faces.top) ln([F[0], F[1]], iw, { taper: [0, 0], lin: true, wob: 0.2 });
  if (faces.side) ln(vp[0] > x + w ? [F[1], F[2]] : [F[0], F[3]], iw, { taper: [0, 0], lin: true, wob: 0.2 });
  if (faces.bottom) ln([F[3], F[2]], iw, { taper: [0, 0], lin: true, wob: 0.2 });
  if (faces.side) {
    const right = vp[0] > x + w;
    if (faces.top) { const i = right ? 1 : 0; ln([F[i], B[i]], iw, { taper: [0, 0], lin: true, wob: 0.2 }); }
    if (faces.bottom) { const i = right ? 2 : 3; ln([F[i], B[i]], iw, { taper: [0, 0], lin: true, wob: 0.2 }); }
  }
  const sil = convexHull(F.concat(faces.top ? [B[0], B[1]] : [], faces.side ? (vp[0] > x + w ? [B[1], B[2]] : [B[0], B[3]]) : [], faces.bottom ? [B[2], B[3]] : []));
  if (cw > 0) inkP(sil, cw, { lin: true, vary: 0.12 });
  faces.front = F; faces.back = B;
  return faces;
}
// wood grain: a couple of long wavy lines and a knot swirl, clipped inside a face
function grain(pts, color, r, o = {}) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  I.clipPoly(pts, () => {
    const n = o.n ?? Math.max(1, Math.round((y1 - y0) / 14));
    for (let i = 0; i < n; i++) {
      const yy = lerp(y0, y1, (i + 0.5) / n) + r.pm(3), sx = x0 + r() * (x1 - x0) * 0.4;
      ln([[sx, yy], [sx + (x1 - x0) * 0.25, yy + r.pm(2)], [sx + (x1 - x0) * 0.55, yy + r.pm(2)]], PEN.fine, { color: o.color || shade(color, 0.3), taper: [0.3, 0.3] });
    }
    if (o.knot !== false && x1 - x0 > 60) I.swirl(lerp(x0, x1, r.range(0.3, 0.8)), lerp(y0, y1, r.range(0.3, 0.7)), 4, o.color || shade(color, 0.35));
  });
}
// room(w, h, o): back wall + floor. o.wall, o.floor, o.floorY, o.skirting (colour), o.boards
// (spacing: planks converging on o.vp, staggered joints, alternating tones), o.wallLines
// ({start, step, color}: wallpaper stripes), o.tiles (floor tile size, instead of boards),
// o.contact (false: no contact shadow under the skirting)
function room(w, h, o) {
  const r = rngFor(o, 'room', w, h);
  I.rect(-2, -2, w + 4, o.floorY + 2, o.wall);
  if (o.wallLines) for (let x = o.wallLines.start; x < w; x += o.wallLines.step) ln([[x, -4], [x, o.floorY]], o.wallLines.w || 1.2, { color: o.wallLines.color, taper: [0, 0] });
  I.rect(-2, o.floorY, w + 4, h - o.floorY + 4, o.floor);
  const vp = o.vp || [w / 2, o.floorY - 260];
  const fy = o.floorY;
  if (o.boards) {
    const bc = o.boardColor || shade(o.floor, 0.35);
    const xAt = (x0, yy) => vp[0] + (x0 - vp[0]) * ((yy - vp[1]) / (fy - vp[1]));
    let k = 0;
    for (let x0 = -w * 1.5; x0 < w * 2.5; x0 += o.boards, k++) {
      // plank tone
      if (k % 3 === 1 || r.chance(0.2)) fillP([[x0, fy], [x0 + o.boards, fy], [xAt(x0 + o.boards, h + 4), h + 4], [xAt(x0, h + 4), h + 4]], mix(o.floor, r.chance(0.5) ? '#000000' : '#ffffff', 0.05), { lin: true });
      ln([[x0, fy], [xAt(x0, h + 4), h + 4]], 1.1, { color: bc, taper: [0, 0], op: 0.8 });
      // staggered butt joints
      for (let j = 0; j < 2; j++) {
        const t = r.range(0.1, 0.95), yy = lerp(fy, h, t);
        const a = xAt(x0, yy), b = xAt(x0 + o.boards, yy);
        if (r.chance(0.6)) ln([[a, yy], [b, yy]], 1, { color: bc, taper: [0, 0], op: 0.7 });
      }
    }
  }
  if (o.tiles) {
    const tc = o.tileColor || shade(o.floor, 0.25);
    for (let x0 = -w * 2; x0 < w * 3; x0 += o.tiles) ln([[x0, fy], [vp[0] + (x0 - vp[0]) * ((h - vp[1]) / (fy - vp[1])), h + 4]], 1.1, { color: tc, taper: [0, 0] });
    for (let i = 1; i < 12; i++) { const yy = fy + (h - fy) * Math.pow(i / 12, 1.6); ln([[-4, yy], [w + 4, yy]], 1.1, { color: tc, taper: [0, 0] }); }
  }
  if (o.contact !== false) I.rect(-2, fy, w + 4, Math.max(3, (h - fy) * 0.035), shade(o.floor, 0.18));
  ln([[-4, fy], [w + 4, fy]], BG, { taper: [0, 0] });
  if (o.skirting) {
    const sk = o.skirtH || 9;
    I.rect(-2, fy - sk, w + 4, sk, o.skirting);
    I.rect(-2, fy - sk, w + 4, 2, light(o.skirting, 0.25));
    ln([[-4, fy - sk], [w + 4, fy - sk]], PEN.detail, { taper: [0, 0] });
  }
}
// interior(w, h, o): a one-point-perspective room box. o.back = {x, y, w, h} (the back wall rect),
// o.wall, o.side (side walls, default one step darker), o.floor, o.ceiling, o.boards, o.skirting.
// returns { vp, back, floorAt(u, z), wallAt(side, z, v) } for placing furniture:
//   floorAt(u, z): u 0..1 across, z 0 (at the back wall) .. 1 (at the picture plane)
function interior(w, h, o = {}) {
  const b = o.back || { x: w * 0.22, y: h * 0.14, w: w * 0.56, h: h * 0.56 };
  const vp = o.vp || [b.x + b.w / 2, b.y + b.h * 0.45];
  const wall = o.wall || '#e9e0cc', side = o.side || shade(wall, 0.1), floor = o.floor || '#b98a5a', ceil = o.ceiling || light(wall, 0.1);
  const BL = [b.x, b.y + b.h], BR = [b.x + b.w, b.y + b.h], TL = [b.x, b.y], TR = [b.x + b.w, b.y];
  // extend the corner lines from the vp through the back corners to the panel edges
  const out = (p, s = 6) => [vp[0] + (p[0] - vp[0]) * s, vp[1] + (p[1] - vp[1]) * s];
  fillP([TL, TR, out(TR), out(TL)], ceil, { lin: true });
  fillP([TL, BL, out(BL), out(TL)], side, { lin: true });
  fillP([TR, BR, out(BR), out(TR)], side, { lin: true });
  fillP([BL, BR, out(BR), out(BL)], floor, { lin: true });
  fillP([TL, TR, BR, BL], wall, { lin: true });
  const fl = [BL, BR, out(BR), out(BL)];
  if (o.boards) I.clipPoly(fl, () => {
    const n = o.boards;
    for (let i = 0; i <= n; i++) { const u = i / n; const p0 = [lerp(BL[0], BR[0], u), BL[1]]; ln([p0, out(p0)], 1.1, { color: o.boardColor || shade(floor, 0.35), taper: [0, 0], lin: true }); }
  });
  if (o.skirting) {
    const sk = o.skirtH || b.h * 0.035;
    fillP([[BL[0], BL[1] - sk], [BR[0], BR[1] - sk], BR, BL], o.skirting, { lin: true });
    [[BL, -1], [BR, 1]].forEach(([p]) => fillP([[p[0], p[1] - sk], p, out(p), recede(out([p[0], p[1] - sk]), [p[0], p[1] - sk], 0)], o.skirting, { lin: true }));
  }
  [[TL, TR], [TR, BR], [BR, BL], [BL, TL]].forEach(([a, c]) => ln([a, c], PEN.line, { taper: [0, 0], lin: true }));
  [TL, TR, BR, BL].forEach((p) => ln([p, out(p)], PEN.line, { taper: [0, 0], lin: true }));
  const floorAt = (u, z) => { const a = [lerp(BL[0], BR[0], u), BL[1]]; return recede(a, vp, -z * (o.zScale ?? 2.2)); };
  return { vp, back: b, floorAt };
}
// windowFrame(x, y, w, h, o): a window with a real frame: outer casing, an inner reveal (the wall
// thickness, shaded on one side), glazing bars, a sill that sticks out with a shadow under it, and
// two faint reflection streaks. o.sky, o.view(x, y, w, h), o.frame, o.t (frame width), o.cross,
// o.sill, o.curtains (colour), o.panes ([cols, rows], default [2, 2]), o.reflect (false to skip)
function windowFrame(x, y, w, h, o = {}) {
  const r = rngFor(o, 'win', x, y, w);
  const f = o.frame || '#ffffff';
  const t = o.t || 8;
  I.rect(x, y, w, h, o.sky || '#9fd3e8');
  if (o.view) I.clipRect(x, y, w, h, () => o.view(x, y, w, h));
  // reveal: the inside of the wall opening, darker on the shadow side and top
  const rv = Math.max(3, t * 0.6);
  I.clipRect(x, y, w, h, () => {
    const [sx] = shadowDir();
    fillP(sx < 0 ? [[x, y], [x + rv, y + rv], [x + rv, y + h], [x, y + h]] : [[x + w, y], [x + w - rv, y + rv], [x + w - rv, y + h], [x + w, y + h]], shade(f, 0.22), { lin: true });
    fillP([[x, y], [x + w, y], [x + w - rv, y + rv], [x + rv, y + rv]], shade(f, 0.3), { lin: true });
    if (o.reflect !== false) {
      const rc = o.reflectColor || '#ffffff';
      for (let i = 0; i < 2; i++) { const ox = x + w * (0.2 + i * 0.12) + r.pm(4); ln([[ox, y + h * 0.35], [ox + h * 0.25, y + h * 0.1]], i ? 2 : 4, { color: rc, op: o.reflectOp ?? (lum(o.sky || '#9fd3e8') < 0.3 ? 0.12 : 0.35), taper: [0.2, 0.2] }); }
    }
  });
  // casing: frame ring
  core.shape([[x - t, y - t], [x + w + t, y - t], [x + w + t, y + h + t], [x - t, y + h + t], [x - t, y - t], [x, y], [x, y + h], [x + w, y + h], [x + w, y], [x, y]], f, { w: BG, lin: true, wob: 0.2 });
  ln([[x + 1, y + 1], [x + w - 1, y + 1]], PEN.detail, { lin: true, taper: [0, 0], color: shade(f, 0.5) });
  // glazing bars
  const [cols, rows] = o.panes || (o.cross === false ? [1, 1] : [2, 2]);
  const bw = Math.max(2.5, (t * 2) / 3);
  for (let i = 1; i < cols; i++) { const bx = x + (w * i) / cols - bw / 2; core.shape(rect(bx, y, bw, h), f, { w: PEN.detail, lin: true, wob: 0.15 }); }
  for (let j = 1; j < rows; j++) { const by = y + (h * j) / rows - bw / 2; core.shape(rect(x, by, w, bw), f, { w: PEN.detail, lin: true, wob: 0.15 }); }
  if (o.sill) {
    const sy = y + h + t, sw = w + 2 * t + 16;
    fillP(rect(x - t - 8, sy + 8, sw, 5), '#000000', { op: 0.18, lin: true });
    block(x - t - 8, sy, sw, 7, f, { vp: [x + w / 2, sy - 600], d: 0.02, w: BG, inner: PEN.fine });
  }
  if (o.curtains) {
    const cc = o.curtains;
    [[x - t - 14, 1], [x + w + t + 14, -1]].forEach(([cx, dir]) => {
      const cw = w * 0.22;
      const pts = [[cx - dir * 4, y - t - 10], [cx + dir * cw, y - t - 10], [cx + dir * cw * 0.55, y + h * 0.45], [cx + dir * cw * 0.85, y + h + t + 20], [cx - dir * 4, y + h + t + 24]];
      cel(pts, cc, { k: 1, w: PEN.line });
      for (let k = 1; k < 3; k++) ln([[cx + dir * cw * (k / 3), y - t - 6], [cx + dir * cw * (k / 3) * 0.6, y + h * 0.5], [cx + dir * cw * (k / 3) * 0.9, y + h + t + 18]], PEN.fine, { color: shade(cc, 0.45) });
    });
    ln([[x - t - 24, y - t - 12], [x + w + t + 24, y - t - 12]], 3, { color: '#6a4a30', taper: [0, 0] });
  }
}
// door(x, y, w, h, color, o): panelled door with an architrave, raised panels (lit top/left edges,
// shaded bottom/right), knob on a backplate. o.panel, o.knob, o.frame (architrave colour),
// o.open (0..1: swings in, showing o.dark behind), o.glass (top panels glazed, colour)
function door(x, y, w, h, color, o = {}) {
  const fr = o.frame || light(color, 0.35);
  const at = Math.max(5, w * 0.08);
  core.shape([[x - at, y + h], [x - at, y - at], [x + w + at, y - at], [x + w + at, y + h], [x + w, y + h], [x + w, y], [x, y], [x, y + h]], fr, { w: BG, lin: true, wob: 0.2 });
  if (o.open) {
    fillP(rect(x, y, w, h), o.dark || '#2a2238', { lin: true });
    if (o.inside) I.clipRect(x, y, w, h, () => o.inside(x, y, w, h));
    const ow = w * (1 - o.open);
    const pts = [[x, y], [x + ow, y + h * 0.04 * o.open], [x + ow, y + h * (1 - 0.02 * o.open)], [x, y + h]];
    cel(pts, color, { lin: true, w: BG, k: 0.8 });
    return;
  }
  cel(rect(x, y, w, h), color, { lin: true, w: BG, k: 0.6, shade: 0.12 });
  const pc = o.panel || color;
  const panelBox = (px, py, pw, ph, glass) => {
    if (glass) { fillP(rect(px, py, pw, ph), glass, { lin: true }); ln([[px + pw * 0.2, py + ph * 0.6], [px + pw * 0.5, py + ph * 0.15]], 2, { color: '#ffffff', op: 0.5 }); }
    else {
      fillP(rect(px, py, pw, ph), shade(pc, 0.1), { lin: true });
      const b = Math.min(pw, ph) * 0.12;
      fillP([[px, py], [px + pw, py], [px + pw - b, py + b], [px + b, py + b], [px + b, py + ph - b], [px, py + ph]], light(pc, 0.15), { lin: true });
      fillP([[px + pw, py], [px + pw, py + ph], [px, py + ph], [px + b, py + ph - b], [px + pw - b, py + ph - b], [px + pw - b, py + b]], shade(pc, 0.22), { lin: true });
    }
    inkP(rect(px, py, pw, ph), PEN.detail, { lin: true });
  };
  const m = w * 0.13, g = w * 0.08;
  const pw = (w - 2 * m - g) / 2;
  panelBox(x + m, y + h * 0.07, pw, h * 0.38, o.glass);
  panelBox(x + m + pw + g, y + h * 0.07, pw, h * 0.38, o.glass);
  panelBox(x + m, y + h * 0.52, pw, h * 0.4);
  panelBox(x + m + pw + g, y + h * 0.52, pw, h * 0.4);
  const kx = x + w * 0.86, ky = y + h * 0.5;
  core.shape(rrect(kx - 3, ky - 9, 6, 18, 2), shade(o.knob || '#e0b64a', 0.1), { w: PEN.fine });
  cel(I.ell(kx, ky, 4, 4, 10), o.knob || '#e0b64a', { w: PEN.detail, k: 0.3 });
}
// table(x, y, w, legH, color, o): x,y = front-left corner of the table top; the top shows its
// surface toward o.vp, a front edge o.thick deep, an apron, four legs (the back two shorter,
// behind), grain on the top. o.cloth (tablecloth colour), o.vp, o.d
function table(x, y, w, legH, color = '#b07a48', o = {}) {
  const r = rngFor(o, 'table', x, y, w);
  const th = o.thick || 10;
  const vp = o.vp || [x + w / 2, y - 700];
  const d = o.d ?? 0.12;
  const lw = Math.max(6, w * 0.05);
  // back legs
  [x + lw * 0.6, x + w - lw * 1.6].forEach((lx) => { const b = recede([lx, y + th], vp, d * 0.85); block(b[0], b[1], lw * 0.9, legH - (b[1] - y - th), shade(color, 0.12), { vp, d: 0.02, w: PEN.detail }); });
  // top
  const f = block(x, y, w, th, color, { vp, d, w: BG, top: o.cloth || light(color, 0.1) });
  if (!o.cloth && f.top) grain(f.top, light(color, 0.1), r);
  // apron + front legs
  fillP(rect(x + lw, y + th, w - 2 * lw, th * 0.9), shade(color, 0.25), { lin: true });
  [x + lw * 0.2, x + w - lw * 1.2].forEach((lx) => block(lx, y + th, lw, legH, color, { vp, d: 0.02, w: PEN.line }));
  if (o.cloth) {
    const cc = o.cloth;
    const hang = th * 3;
    const pts = [[x - 4, y - 1], [x + w + 4, y - 1], [x + w + 6, y + hang], [x + w * 0.75, y + hang + 3], [x + w * 0.5, y + hang - 1], [x + w * 0.25, y + hang + 3], [x - 6, y + hang]];
    cel(pts, cc, { w: PEN.line, k: 0.6 });
  }
  return f;
}
// chair(x, y, h, color, dir): a wooden chair in 3/4: seat as a slab, a back with two rails,
// four legs (back ones behind). x = centre, y = floor, h = height to the top of the back,
// dir = which way the back is (1: back on the left, facing right)
function chair(x, y, h, color = '#b07a48', dir = 1, o = {}) {
  const seat = y - h * 0.46, sw = h * 0.42, th = Math.max(4, h * 0.05), lw = Math.max(3, h * 0.035);
  const vp = o.vp || [x + dir * h * 2, y - h * 3];
  const d = o.d ?? 0.1;
  const x0 = x - sw / 2;
  const back = (px) => recede([px, seat], vp, d);
  // back legs
  [x0 + lw * 0.3, x0 + sw - lw * 1.3].forEach((lx) => { const b = back(lx); block(b[0], b[1] + th, lw, y - b[1] - th - 2, shade(color, 0.15), { vp, d: 0.01, w: PEN.detail }); });
  // back rest (on the far side)
  const bx = dir > 0 ? x0 : x0 + sw - lw;
  const bb = back(bx);
  const bh = h * 0.54;
  block(bb[0], bb[1] - bh, lw, bh + th, color, { vp, d: 0.01, w: PEN.line });
  const bb2 = back(dir > 0 ? x0 + sw - lw : x0);
  block(bb2[0], bb2[1] - bh, lw, bh + th, color, { vp, d: 0.01, w: PEN.line });
  [0.1, 0.4].forEach((t) => block(Math.min(bb[0], bb2[0]), bb[1] - bh * (1 - t), Math.abs(bb2[0] - bb[0]) + lw, bh * 0.16, color, { vp, d: 0.01, w: PEN.detail }));
  block(x0, seat, sw, th, color, { vp, d, w: PEN.line });
  [x0, x0 + sw - lw].forEach((lx) => block(lx, seat + th, lw, y - seat - th, color, { vp, d: 0.01, w: PEN.line }));
}
// frame(x, y, w, h, color, fn, o): a picture frame with a moulding (lit top-left, shaded
// bottom-right), a mat, the picture drawn by fn, and a soft drop shadow on the wall
function frame(x, y, w, h, color, fn, o = {}) {
  const fc = o.frame || '#8a5a33', m = o.m ?? 6;
  fillP(rect(x - m + 3, y - m + 4, w + 2 * m, h + 2 * m), '#000000', { op: 0.15, lin: true });
  fillP(rect(x - m, y - m, w + 2 * m, h + 2 * m), fc, { lin: true });
  fillP([[x - m, y - m], [x + w + m, y - m], [x + w, y], [x, y], [x, y + h], [x - m, y + h + m]], light(fc, 0.18), { lin: true });
  fillP([[x + w + m, y - m], [x + w + m, y + h + m], [x - m, y + h + m], [x, y + h], [x + w, y + h], [x + w, y]], shade(fc, 0.22), { lin: true });
  inkP(rect(x - m, y - m, w + 2 * m, h + 2 * m), BG, { lin: true });
  I.rect(x, y, w, h, color);
  if (fn) I.clipRect(x, y, w, h, () => fn(x, y, w, h));
  inkP(rect(x, y, w, h), PEN.detail, { lin: true });
}
// a sheet of paper, optionally rotated, with contents; a small curled corner and a soft shadow
function sheet(x, y, w, h, rot, fn, color = '#ffffff', o = {}) {
  I.grp(`translate(${x} ${y}) rotate(${rot})`, () => {
    if (o.shadow !== false) fillP(rect(-w / 2 + 2, -h / 2 + 3, w, h), '#000000', { op: 0.12, lin: true });
    const c = Math.min(w, h) * 0.14;
    core.shape([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2 - c], [w / 2 - c, h / 2], [-w / 2, h / 2]], color, { w: 1.6, lin: true });
    if (fn) I.clipRect(-w / 2, -h / 2, w, h, () => fn(w, h));
    core.shape([[w / 2, h / 2 - c], [w / 2 - c * 0.85, h / 2 - c * 0.85], [w / 2 - c, h / 2]], shade(color, 0.12), { w: 1.2, lin: true });
  });
}
// books(x, y, n, colors, o): a shelf run of books standing on y from x: varied heights and
// widths, spine bands, the odd leaner at the end, and now and then a short horizontal stack.
// o.w (typical width), o.h (typical height), o.max (stop before x + max). Returns the end x.
function books(x, y, n, colors, o = {}) {
  const r = rngFor(o, 'books', x, y, n);
  let cx = x;
  const bwT = o.w || 12, bhT = o.h || 60;
  for (let i = 0; i < n; i++) {
    if (o.max && cx > x + o.max - bwT) break;
    const col = colors[(i * 7 + r.int(0, 3)) % colors.length];
    if (r.chance(0.08) && i > 0 && i < n - 1) {
      // a lying stack
      const sw = bhT * r.range(0.55, 0.8);
      let yy = y;
      for (let k = 0; k < r.int(2, 4); k++) { const th = bwT * r.range(0.5, 0.8); core.shape(rect(cx + r.pm(2), yy - th, sw, th), colors[(i + k) % colors.length], { w: PEN.detail, lin: true, wob: 0.15 }); yy -= th; }
      cx += sw + 2;
      continue;
    }
    const bw = bwT * r.range(0.7, 1.4), bh = bhT * r.range(0.72, 1.02);
    if (i === n - 1 && r.chance(0.6)) {
      // leaning book
      const a = 0.35;
      const pts = [[cx, y], [cx + bw, y], [cx + bw + Math.sin(a) * bh, y - Math.cos(a) * bh], [cx + Math.sin(a) * bh, y - Math.cos(a) * bh - 0.01]];
      cel(pts, col, { w: PEN.detail, lin: true, k: 0.3 });
      cx += bw + Math.sin(a) * bh;
      break;
    }
    cel(rect(cx, y - bh, bw, bh), col, { w: PEN.detail, lin: true, k: 0.25 });
    const band = r.chance(0.6) ? light(col, 0.4) : shade(col, 0.4);
    if (r.chance(0.7)) { fillP(rect(cx + 1, y - bh * 0.84, bw - 2, bh * 0.07), band, { lin: true }); }
    if (r.chance(0.4)) fillP(rect(cx + 1, y - bh * 0.2, bw - 2, bh * 0.05), band, { lin: true });
    cx += bw + (r.chance(0.2) ? 1 : 0);
  }
  return cx;
}
// shelf(x, y, w, h, o): a bookcase: carcass with visible depth, a darker inside back, shelves,
// filled with books and the odd object (o.objects: false to skip). o.color, o.shelves, o.books
// (colours), o.vp, o.fill (0..1 how full)
function shelf(x, y, w, h, o = {}) {
  const r = rngFor(o, 'shelf', x, y, w);
  const col = o.color || '#9a6a42';
  const vp = o.vp || [x + w / 2, y + h * 0.4];
  const t = Math.max(5, w * 0.05);
  block(x, y, w, h, col, { vp, d: o.d ?? 0.05, w: BG, noFront: true });
  const inner = [x + t, y + t, w - 2 * t, h - 2 * t];
  fillP(rect(...inner), shade(col, 0.45), { lin: true });
  fillP([[x, y], [x + w, y], [x + w, y + h], [x + w - t, y + h - t], [x + w - t, y + t], [x + t, y + t], [x + t, y + h - t], [x, y + h]], col, { lin: true });
  fillP([[x, y + h], [x + w, y + h], [x + w - t, y + h - t], [x + t, y + h - t]], col, { lin: true });
  inkP(rect(x, y, w, h), BG, { lin: true });
  inkP(rect(...inner), PEN.detail, { lin: true });
  const n = o.shelves ?? Math.max(2, Math.round(h / 70));
  const rowH = (h - 2 * t) / n;
  const colors = o.books || ['#c0574a', '#3f6fa8', '#e2b24a', '#4f8a5a', '#7a4e8a', '#e8e0cc', '#2d3a4a', '#d98a4a'];
  for (let i = 0; i < n; i++) {
    const sy = y + t + rowH * (i + 1);
    if (i < n - 1) { block(x + t, sy - 4, w - 2 * t, 5, light(col, 0.05), { vp, d: 0.02, w: PEN.detail }); }
    const start = x + t + 2 + (r.chance(0.3) ? r.range(4, 20) : 0);
    const endX = books(start, sy - 4, 60, colors, { w: Math.max(6, rowH * 0.14), h: rowH * 0.8, max: (w - 2 * t) * (o.fill ?? r.range(0.55, 0.95)), seed: i * 17 + (o.seed || 0) });
    if (o.objects !== false && x + w - t - endX > rowH * 0.45 && r.chance(0.7)) {
      const ox = lerp(endX, x + w - t, 0.5);
      const k = r.int(0, 2);
      if (k === 0) plant(ox, sy - 4, rowH * 0.012, {});
      else if (k === 1) core.shape(rect(ox - rowH * 0.2, sy - 4 - rowH * 0.3, rowH * 0.4, rowH * 0.3), '#e8d8b8', { w: PEN.detail, lin: true });
      else cel(I.ell(ox, sy - 4 - rowH * 0.18, rowH * 0.16, rowH * 0.18, 12), '#6aa8c8', { w: PEN.detail, k: 0.4 });
    }
  }
}
// plant(x, y, s, o): a potted plant: terracotta pot with a rim, a clump of pointed leaves
function plant(x, y, s = 1, o = {}) {
  const r = rngFor(o, 'plant', x, y);
  const pot = o.pot || '#c2704a', leaf = o.leaf || '#4f8a4a';
  const pw = 22 * s, ph = 20 * s;
  for (let i = 0; i < (o.leaves ?? 7); i++) {
    const a = -Math.PI / 2 + r.pm(1.1), L = r.range(22, 38) * s;
    const b = [x + r.pm(3 * s), y - ph];
    const tip = [b[0] + Math.cos(a) * L, b[1] + Math.sin(a) * L];
    const n = [-Math.sin(a) * 5 * s, Math.cos(a) * 5 * s];
    const m = [lerp(b[0], tip[0], 0.5), lerp(b[1], tip[1], 0.5) - 3 * s];
    cel([b, [m[0] + n[0], m[1] + n[1]], tip, [m[0] - n[0], m[1] - n[1]]], leaf, { w: PEN.detail, k: 0.3 * s });
  }
  cel([[x - pw / 2, y - ph], [x + pw / 2, y - ph], [x + pw * 0.36, y], [x - pw * 0.36, y]], pot, { w: PEN.line, lin: true, k: 0.5 * s });
  core.shape(rect(x - pw * 0.56, y - ph - 5 * s, pw * 1.12, 6 * s), light(pot, 0.08), { w: PEN.line, lin: true });
}
// lamp(x, y, s, o): a table lamp standing at x,y: base, stem, drum shade; o.on adds a warm glow
function lamp(x, y, s = 1, o = {}) {
  const sc = o.shade || '#f2e2b0';
  if (o.on) { const g = require('./page'); g.glow(x, y - 44 * s, 90 * s, o.glow || '#ffcf6a', 0.6); }
  core.shape(I.ell(x, y - 3 * s, 12 * s, 4 * s, 12), o.base || '#6a5a4a', { w: PEN.line });
  core.shape(rect(x - 2 * s, y - 34 * s, 4 * s, 31 * s), o.base || '#6a5a4a', { w: PEN.detail, lin: true });
  cel([[x - 12 * s, y - 60 * s], [x + 12 * s, y - 60 * s], [x + 19 * s, y - 32 * s], [x - 19 * s, y - 32 * s]], sc, { w: PEN.line, lin: true, k: 0.6 * s });
  if (o.on) fillP([[x - 19 * s, y - 32 * s], [x + 19 * s, y - 32 * s], [x + 15 * s, y - 29 * s], [x - 15 * s, y - 29 * s]], '#fff4c8', { lin: true });
}
// clock(x, y, rad, o): wall clock: rim with a cel shadow, face, hour ticks, two hands (o.time [h, m])
function clock(x, y, rad, o = {}) {
  cel(I.ell(x, y, rad, rad, 24), o.rim || '#3a3a44', { w: PEN.line, k: 0.4 });
  core.shape(I.ell(x, y, rad * 0.82, rad * 0.82, 24), o.face || '#fbf8ee', { w: PEN.detail });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ln([[x + Math.cos(a) * rad * 0.62, y + Math.sin(a) * rad * 0.62], [x + Math.cos(a) * rad * 0.74, y + Math.sin(a) * rad * 0.74]], i % 3 ? PEN.fine : PEN.detail, { taper: [0, 0] }); }
  const [hh, mm] = o.time || [10, 10];
  const ha = ((hh % 12) / 12 + mm / 720) * Math.PI * 2 - Math.PI / 2, ma = (mm / 60) * Math.PI * 2 - Math.PI / 2;
  ln([[x, y], [x + Math.cos(ha) * rad * 0.42, y + Math.sin(ha) * rad * 0.42]], PEN.line, { taper: [0, 0.3] });
  ln([[x, y], [x + Math.cos(ma) * rad * 0.62, y + Math.sin(ma) * rad * 0.62]], PEN.detail, { taper: [0, 0.3] });
}
// fridge(x, y, w, h, o): x,y = top-left of the front. Rounded box with its side toward o.vp,
// freezer door on top (o.split), long handles with a shadow, a kick grille, and o.notes: a number
// of papers stuck on with magnets (or fn(x, y, w, h) via o.front to draw your own)
function fridge(x, y, w, h, o = {}) {
  const r = rngFor(o, 'fridge', x, y, w);
  const col = o.color || '#f2f0ea';
  const vp = o.vp || [x - w * 2, y + h * 0.3];
  const d = o.d ?? 0.12;
  const F = rrect(x, y, w, h, w * 0.06, 3);
  const B = F.map((p) => recede(p, vp, d));
  fillP(convexHull(F.concat(B)), shade(col, 0.16), { lin: true });
  cel(F, col, { k: 0.8, shade: 0.08, w: 0, lin: true });
  const hull = convexHull(F.concat(B));
  inkP(hull, BG, { lin: true });
  inkP(F, PEN.line, { lin: true });
  const sy = y + h * (o.split ?? 0.34);
  ln([[x + 2, sy], [x + w - 2, sy]], PEN.line, { taper: [0, 0], lin: true });
  fillP(rect(x + 3, sy + 1, w - 6, 3), shade(col, 0.12), { lin: true });
  const hx = vp[0] < x ? x + w - w * 0.12 : x + w * 0.08;
  [[y + h * 0.12, sy - h * 0.06], [sy + h * 0.06, sy + h * 0.3]].forEach(([a, b]) => {
    fillP(rect(hx + 3, a + 2, w * 0.035, b - a), shade(col, 0.3), { lin: true });
    core.shape(rrect(hx, a, w * 0.04, b - a, 2), o.handle || '#b8bcc4', { w: PEN.detail, lin: true });
  });
  fillP(rect(x + w * 0.08, y + h - h * 0.06, w * 0.84, h * 0.035), shade(col, 0.35), { lin: true });
  for (let i = 0; i < 6; i++) ln([[x + w * (0.12 + i * 0.13), y + h * 0.945], [x + w * (0.12 + i * 0.13), y + h * 0.97]], PEN.fine, { taper: [0, 0] });
  if (o.front) I.clipPoly(F, () => o.front(x, y, w, h));
  for (let i = 0; i < (o.notes || 0); i++) {
    const nx = x + w * r.range(0.2, 0.75), ny = r.chance(0.4) ? y + h * r.range(0.08, 0.22) : sy + h * r.range(0.06, 0.4);
    sheet(nx, ny, w * r.range(0.18, 0.26), w * r.range(0.22, 0.3), r.pm(12), (ww, hh) => { for (let k = 0; k < 3; k++) ln([[-ww / 2 + 4, -hh / 2 + 7 + k * 5], [ww / 2 - 5 - r() * 6, -hh / 2 + 7 + k * 5]], 0.9, { color: '#8a8a9a', taper: [0, 0] }); }, r.pick(['#ffffff', '#fff3b0', '#dff0ff']));
    cel(I.ell(nx, ny - w * 0.1, 3.2, 3.2, 10), r.pick(['#d8453b', '#3f6fa8', '#f2c230', '#4f8a5a']), { w: 1, k: 0.2 });
  }
}
// counter(x, y, w, h, o): kitchen run: x,y = front-left of the worktop, h = height down to the
// floor. Worktop slab (top face toward o.vp), base cabinets with pairs of doors, a drawer row,
// handles, a dark plinth. o.color (cabinets), o.top (worktop), o.doors (count), o.sink (x),
// o.hob (x), o.vp
function counter(x, y, w, h, o = {}) {
  const r = rngFor(o, 'counter', x, y, w);
  const col = o.color || '#3f8a82', topC = o.top || '#e8e2d4';
  const vp = o.vp || [x + w / 2, y - 500];
  const th = o.thick || 9;
  const pl = h * 0.08; // plinth
  const cab = [x + 4, y + th, w - 8, h - th - pl];
  fillP(rect(x + 8, y + h - pl, w - 16, pl), '#2a2a30', { lin: true });
  block(...cab, col, { vp, d: 0.001, w: BG });
  const n = o.doors ?? Math.max(2, Math.round(w / 70));
  const dw = cab[2] / n;
  const drawer = cab[3] * 0.2;
  for (let i = 0; i < n; i++) {
    const dx = cab[0] + i * dw;
    cel(rect(dx + 3, cab[1] + 3, dw - 6, drawer - 5), col, { lin: true, w: PEN.detail, k: 0.3, shade: 0.14 });
    cel(rect(dx + 3, cab[1] + drawer + 1, dw - 6, cab[3] - drawer - 5), col, { lin: true, w: PEN.detail, k: 0.4, shade: 0.14 });
    core.shape(rrect(dx + dw / 2 - 8, cab[1] + drawer * 0.4, 16, 3.5, 1.5), o.handle || '#c9ccd2', { w: PEN.fine, lin: true });
    const hx = i % 2 ? dx + 10 : dx + dw - 13;
    core.shape(rrect(hx, cab[1] + drawer + 10, 3.5, 18, 1.5), o.handle || '#c9ccd2', { w: PEN.fine, lin: true });
  }
  const f = block(x, y, w, th, topC, { vp, d: o.d ?? 0.05, w: BG });
  if (o.sink != null && f.top) {
    const sx = o.sink, tb = f.top;
    const yb = lerp(tb[0][1], tb[3][1], 0.2), yt = lerp(tb[0][1], tb[3][1], 0.8);
    fillP([[sx - 38, yb], [sx + 38, yb], [sx + 32, yt], [sx - 32, yt]], '#b8c0c8', { lin: true });
    inkP([[sx - 38, yb], [sx + 38, yb], [sx + 32, yt], [sx - 32, yt]], PEN.detail, { lin: true });
    fillP([[sx - 32, yb - 1], [sx + 32, yb - 1], [sx + 28, yt + 1], [sx - 28, yt + 1]], '#8a949e', { lin: true });
    core.limb([[sx + 20, yt], [sx + 20, yt - 22], [sx + 6, yt - 26], [sx + 2, yt - 18]], [2.4, 2.4, 2.2, 2], '#c9ccd2', { w: PEN.detail });
  }
  if (o.hob != null && f.top) {
    const hx = o.hob, tb = f.top, yy = lerp(tb[0][1], tb[3][1], 0.5);
    fillP([[hx - 40, yy + 5], [hx + 40, yy + 5], [hx + 36, yy - 5], [hx - 36, yy - 5]], '#2a2a30', { lin: true });
    [-20, 20].forEach((dx) => { I.fill(I.ell(hx + dx, yy, 10, 3.2, 12), '#4a4a55', { wob: 0 }); ln(I.ell(hx + dx, yy, 10, 3.2, 12).concat([[hx + dx + 10, yy]]), PEN.fine, { color: '#8a8a95', taper: [0, 0] }); });
  }
  return f;
}
// wallCabinets(x, y, w, h, o): upper cabinets (seen slightly from below: the underside shows)
function wallCabinets(x, y, w, h, o = {}) {
  const col = o.color || '#3f8a82';
  const vp = o.vp || [x + w / 2, y + h + 400];
  block(x, y, w, h, col, { vp, d: o.d ?? 0.03, w: BG });
  const n = o.doors ?? Math.max(2, Math.round(w / 60));
  const dw = w / n;
  for (let i = 0; i < n; i++) {
    cel(rect(x + i * dw + 3, y + 3, dw - 6, h - 6), col, { lin: true, w: PEN.detail, k: 0.4, shade: 0.14 });
    const hx = i % 2 ? x + i * dw + 8 : x + (i + 1) * dw - 11;
    core.shape(rrect(hx, y + h - 22, 3.5, 14, 1.5), o.handle || '#c9ccd2', { w: PEN.fine, lin: true });
  }
}
// tiles(x, y, w, h, o): splashback tiles: slightly uneven grid, a few tiles a shade off
function tiles(x, y, w, h, o = {}) {
  const r = rngFor(o, 'tiles', x, y, w);
  const col = o.color || '#e8f0f0', s = o.size || 16;
  I.rect(x, y, w, h, col);
  for (let j = 0; j * s < h; j++) for (let i = 0; i * s < w; i++) if (r.chance(0.12)) I.rect(x + i * s + 1, y + j * s + 1, s - 2, s - 2, mix(col, r.chance(0.5) ? '#ffffff' : '#7a9a9a', 0.15));
  const lc = o.line || shade(col, 0.25);
  for (let i = 1; i * s < w; i++) ln([[x + i * s, y], [x + i * s + r.pm(0.5), y + h]], 0.8, { color: lc, taper: [0, 0] });
  for (let j = 1; j * s < h; j++) ln([[x, y + j * s], [x + w, y + j * s + r.pm(0.5)]], 0.8, { color: lc, taper: [0, 0] });
}
// kettle(x, y, s, o), mug(x, y, s, o), jar(x, y, s, o): counter props standing on y
function kettle(x, y, s = 1, o = {}) {
  const c = o.color || '#d8453b';
  cel([[x - 16 * s, y], [x - 13 * s, y - 22 * s], [x - 6 * s, y - 28 * s], [x + 6 * s, y - 28 * s], [x + 13 * s, y - 22 * s], [x + 16 * s, y]], c, { w: PEN.line, k: 0.5 * s });
  core.limb([[x + 14 * s, y - 16 * s], [x + 24 * s, y - 24 * s], [x + 28 * s, y - 28 * s]], [3 * s, 2.5 * s, 2 * s], c, { w: PEN.detail });
  ln([[x - 8 * s, y - 29 * s], [x - 10 * s, y - 38 * s], [x + 10 * s, y - 38 * s], [x + 8 * s, y - 29 * s]], 2.6 * s, { color: '#2a2a30', taper: [0, 0] });
  I.fill(I.ell(x - 6 * s, y - 18 * s, 2.5 * s, 5 * s, 8), '#ffffff', { op: 0.5 });
}
function mug(x, y, s = 1, o = {}) {
  const c = o.color || '#f2f0ea';
  ln(I.arc(x + 7 * s, y - 8 * s, 5 * s, 4 * s, -Math.PI / 2, Math.PI / 2, 6), 2.2 * s, { taper: [0, 0], color: INK });
  cel(rect(x - 7 * s, y - 15 * s, 14 * s, 15 * s), c, { w: PEN.line, lin: true, k: 0.3 * s });
  if (o.steam) for (let i = 0; i < 2; i++) ln([[x - 3 * s + i * 6 * s, y - 18 * s], [x - 5 * s + i * 6 * s, y - 24 * s], [x - 2 * s + i * 6 * s, y - 30 * s]], 1.2, { color: '#ffffff', op: 0.8 });
}
function jar(x, y, s = 1, o = {}) {
  cel(rrect(x - 10 * s, y - 26 * s, 20 * s, 26 * s, 4 * s), o.color || '#e8d8b8', { w: PEN.line, lin: true, k: 0.4 * s });
  core.shape(rect(x - 9 * s, y - 31 * s, 18 * s, 6 * s), o.lid || '#b07a48', { w: PEN.detail, lin: true });
  if (o.label) { fillP(rect(x - 7 * s, y - 18 * s, 14 * s, 8 * s), '#ffffff', { lin: true }); I.text(x, y - 12 * s, o.label, { size: 5 * s, anchor: 'middle', color: INK }); }
}
// desk(x, y, w, h, o): office desk: x,y = front-left of the top, h to the floor. Top slab, a drawer
// pedestal on one side (o.pedestal 'left'|'right'), a modesty panel, and props: o.monitor (true),
// o.keyboard, o.mug, o.papers, o.lamp; o.screen (screen colour), o.vp
function desk(x, y, w, h, o = {}) {
  const r = rngFor(o, 'desk', x, y, w);
  const col = o.color || '#c9d2d8', vp = o.vp || [x + w / 2, y - 600];
  const th = o.thick || 8;
  const bk = recede([x, y], vp, 0.1);
  fillP(rect(bk[0] + w * 0.08, bk[1] + th, w * 0.84, h * 0.55), shade(col, 0.3), { lin: true });
  const pw = w * 0.3, px = o.pedestal === 'left' ? x + 4 : x + w - pw - 4;
  block(px, y + th, pw, h - th, col, { vp, d: 0.001, w: PEN.line });
  for (let i = 0; i < 3; i++) { const dy = y + th + 4 + i * ((h - th - 8) / 3); cel(rect(px + 4, dy, pw - 8, (h - th - 8) / 3 - 4), col, { lin: true, w: PEN.detail, k: 0.3, shade: 0.12 }); core.shape(rrect(px + pw / 2 - 9, dy + 6, 18, 3.5, 1.5), '#8a929a', { w: PEN.fine, lin: true }); }
  const lx = o.pedestal === 'left' ? x + w - 12 : x + 6;
  block(lx, y + th, 7, h - th, shade(col, 0.1), { vp, d: 0.001, w: PEN.line });
  const f = block(x, y, w, th, col, { vp, d: 0.1, w: BG });
  const topY = (t) => lerp(y, f.top ? f.top[3][1] : y - 10, t);
  if (o.papers !== false) for (let i = 0; i < r.int(1, 3); i++) sheet(x + w * r.range(0.1, 0.35), topY(0.4), 30, 18, r.pm(10), null, '#ffffff', { shadow: false });
  if (o.monitor !== false) monitor(x + w * (o.monitorX ?? 0.55), topY(0.65), w * 0.34, { screen: o.screen, glow: o.glow });
  if (o.keyboard !== false) { const kx = x + w * 0.42, ky = topY(0.25); fillP([[kx, ky], [kx + w * 0.28, ky], [kx + w * 0.27, ky - 6], [kx + 2, ky - 6]], '#3a3f48', { lin: true }); inkP([[kx, ky], [kx + w * 0.28, ky], [kx + w * 0.27, ky - 6], [kx + 2, ky - 6]], PEN.detail, { lin: true }); for (let i = 1; i < 8; i++) ln([[kx + i * w * 0.035, ky - 5], [kx + i * w * 0.035, ky - 1]], 0.7, { color: '#8a929a', taper: [0, 0] }); }
  if (o.mug) mug(x + w * 0.86, topY(0.35), 0.8, { color: o.mug === true ? undefined : o.mug });
  if (o.lamp) lamp(x + w * 0.1, topY(0.6), 0.7, { on: o.lamp === 'on' });
  return f;
}
// monitor(x, y, w, o): flat screen standing at x (centre), y (desk surface); bezel, glowing screen
// with a few lines of UI, stand
function monitor(x, y, w, o = {}) {
  const h = w * 0.62;
  core.shape([[x - w * 0.16, y], [x + w * 0.16, y], [x + w * 0.1, y - 4], [x - w * 0.1, y - 4]], '#3a3f48', { w: PEN.detail, lin: true });
  core.shape(rect(x - w * 0.04, y - h * 0.28, w * 0.08, h * 0.28), '#3a3f48', { w: PEN.detail, lin: true });
  const sy = y - h * 0.28 - h;
  cel(rrect(x - w / 2, sy, w, h, 3), '#2a2e36', { w: PEN.line, lin: true, k: 0.5 });
  const sc = o.screen || '#bfe0f0';
  fillP(rect(x - w / 2 + 4, sy + 4, w - 8, h - 10), sc, { lin: true });
  if (o.glow) { const g = require('./page'); g.glow(x, sy + h / 2, w * 0.9, sc, 0.35); }
  const r = rngFor(o, 'monitor', x, y);
  for (let i = 0; i < 4; i++) ln([[x - w / 2 + 10, sy + 12 + i * 7], [x - w / 2 + 10 + (w - 26) * r.range(0.4, 0.9), sy + 12 + i * 7]], 1.1, { color: shade(sc, 0.35), taper: [0, 0] });
}
// officeChair(x, y, s, o): swivel chair seen from behind/side: backrest, seat, gas lift, 5-star base
function officeChair(x, y, s = 1, o = {}) {
  const c = o.color || '#2d3440';
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3; const ex = x + Math.cos(a) * 26 * s, ey = y - 5 * s + Math.sin(a) * 6 * s; ln([[x, y - 8 * s], [ex, ey]], 3 * s, { color: '#3a3f48', taper: [0, 0] }); I.fill(I.ell(ex, ey + 2 * s, 3.5 * s, 3 * s, 8), INK, { wob: 0 }); }
  core.shape(rect(x - 2.5 * s, y - 36 * s, 5 * s, 28 * s), '#8a929a', { w: PEN.detail, lin: true });
  cel(rrect(x - 24 * s, y - 44 * s, 48 * s, 10 * s, 4 * s), c, { w: PEN.line, lin: true, k: 0.5 * s });
  cel(rrect(x - 20 * s, y - 92 * s, 40 * s, 44 * s, 10 * s), c, { w: PEN.line, lin: true, k: 0.6 * s });
}
// bed(x, y, w, h, o): x,y = front-bottom-left, w long, h = height of the mattress top above y.
// Headboard at the far end (o.head 'left'|'right'), a mattress slab with its top toward o.vp,
// a duvet with folds (o.quilt: array of colours for a patchwork), a pillow.
function bed(x, y, w, h, o = {}) {
  const r = rngFor(o, 'bed', x, y, w);
  const wood = o.wood || '#8a5a3a', sheetC = o.sheet || '#f4f0e6', duvet = o.duvet || '#c0574a';
  const vp = o.vp || [x + w / 2, y - h - 500];
  const d = o.d ?? 0.14;
  const left = (o.head || 'left') === 'left';
  const hx = left ? x - 10 : x + w;
  // headboard
  block(hx, y - h - w * 0.28, 10, h + w * 0.28, wood, { vp, d: d * 1.1, w: BG });
  // frame + mattress
  block(x, y - h * 0.45, w, h * 0.45, wood, { vp, d, w: BG });
  const m = block(x + 2, y - h, w - 4, h * 0.55, sheetC, { vp, d: d * 0.95, w: PEN.line });
  // pillow
  const top = m.top;
  if (top) {
    const pxa = left ? lerp(top[0][0], top[1][0], 0.03) : lerp(top[0][0], top[1][0], 0.78);
    const pb = [pxa, top[0][1] - 2], pt = recede(pb, vp, d * 0.8);
    cel([[pb[0], pb[1]], [pb[0] + w * 0.2, pb[1] - 2], [pt[0] + w * 0.2, pt[1] - 4], [pt[0], pt[1] - 2]], o.pillow || '#ffffff', { w: PEN.line, k: 0.6 });
  }
  // duvet: covers most of the mattress top and hangs over the front
  const dx0 = left ? x + w * 0.28 : x - 6, dx1 = left ? x + w + 6 : x + w * 0.72;
  const t0 = recede([dx0, y - h], vp, d * 0.9), t1 = recede([dx1, y - h], vp, d * 0.9);
  const hang = h * 0.75;
  const dp = [[t0[0], t0[1] - 3], [t1[0], t1[1] - 3], [dx1, y - h - 2], [dx1 + 2, y - h + hang], [lerp(dx0, dx1, 0.5), y - h + hang + 4], [dx0 - 2, y - h + hang]];
  if (o.quilt) {
    const q = o.quilt;
    I.clipPoly(dp, () => {
      const cols = 9, rows = 5;
      for (let j = -2; j < rows; j++) for (let i = -1; i < cols + 1; i++) {
        const u0 = i / cols, u1 = (i + 1) / cols, v = (y - h + hang + 6) - ((j + 1) / rows) * (hang + (y - h - t0[1]) + 10);
        const hh = (hang + (y - h - t0[1]) + 10) / rows;
        I.rect(lerp(dx0, dx1, u0) - 2, v, (dx1 - dx0) / cols + 1, hh + 1, q[(i + j * 3 + 20) % q.length]);
      }
    });
    inkP(dp, PEN.line, {});
    // fold shadow along the edge of the mattress
    ln([[dx0, y - h + 1], [dx1, y - h + 1]], PEN.detail, { color: shade(q[0], 0.5), taper: [0.1, 0.1] });
  } else {
    cel(dp, duvet, { w: PEN.line, k: 1 });
    for (let i = 0; i < 3; i++) { const fx = lerp(dx0, dx1, r.range(0.2, 0.85)); ln([[fx, y - h + hang * 0.2], [fx + r.pm(6), y - h + hang * 0.9]], PEN.detail, { color: shade(duvet, 0.45) }); }
    ln([[dx0 + 4, y - h + 2], [dx1 - 4, y - h + 2]], PEN.detail, { color: shade(duvet, 0.4) });
  }
}
// curtain(x, y, w, h, o): a hanging drape with 3-5 folds (cel stripes), gathered by o.tie (0..1:
// height of a tie-back), a rod on top. o.color, o.dir (1: gathers toward the right)
function curtain(x, y, w, h, o = {}) {
  const r = rngFor(o, 'curtain', x, y, w);
  const c = o.color || '#b8413a';
  const n = o.folds ?? r.int(3, 5);
  const tie = o.tie;
  const dir = o.dir ?? 1;
  const edgeX = (t) => (tie ? (t < tie ? lerp(x + w, x + w * 0.45, Math.sin((t / tie) * Math.PI / 2)) : lerp(x + w * 0.45, x + w * 0.9, (t - tie) / (1 - tie))) : x + w);
  const pts = [[x, y]];
  pts.push([x + w, y]);
  for (let i = 1; i <= 8; i++) { const t = i / 8; pts.push([dir > 0 ? edgeX(t) : x + w - (edgeX(t) - x), y + h * t]); }
  for (let i = 0; i <= n * 2; i++) pts.push([x + w - (i / (n * 2)) * w * (dir > 0 ? 1 : 1), y + h + (i % 2 ? 4 : -2)]);
  const poly = dir > 0 ? pts : pts.map(([px, py]) => [px, py]);
  I.clipPoly(poly, () => {
    fillP(poly, c);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.55) / n;
      const fx = x + u * w;
      fillP([[fx, y], [fx + w / n * 0.35, y], [lerp(fx, x + w * 0.5, tie ? 0.5 : 0) + w / n * 0.3, y + h * (tie || 1)], [fx + w / n * 0.4, y + h + 6], [fx - w / n * 0.05, y + h + 6], [lerp(fx, x + w * 0.5, tie ? 0.5 : 0), y + h * (tie || 1)]], shade(c, 0.22), { wob: 0.4 });
    }
  });
  inkP(poly, BG, {});
  for (let i = 0; i < n; i++) { const fx = x + ((i + 0.5) / n) * w; ln([[fx, y + 4], [fx + r.pm(3), y + h * 0.5], [fx, y + h - 4]], PEN.fine, { color: shade(c, 0.5) }); }
  if (tie) ln([[x + w * 0.4, y + h * tie], [x + w * 0.62, y + h * tie + 3]], 4, { color: o.tieColor || '#e2b24a', taper: [0, 0] });
}
// column(x, y, w, h, o): a classical column: base, fluted shaft with a cel side, capital.
// x = centre, y = floor
function column(x, y, w, h, o = {}) {
  const c = o.color || '#efe2c4';
  core.shape(rect(x - w * 0.7, y - h * 0.05, w * 1.4, h * 0.05), c, { w: PEN.line, lin: true, cel: true });
  core.shape(rect(x - w * 0.6, y - h * 0.08, w * 1.2, h * 0.03), c, { w: PEN.detail, lin: true });
  cel([[x - w / 2, y - h * 0.08], [x - w * 0.46, y - h * 0.9], [x + w * 0.46, y - h * 0.9], [x + w / 2, y - h * 0.08]], c, { w: PEN.line, lin: true, k: w / 12, shade: 0.16 });
  for (let i = 1; i < 5; i++) { const u = i / 5 - 0.5; ln([[x + u * w * 0.95, y - h * 0.1], [x + u * w * 0.9, y - h * 0.88]], PEN.fine, { color: shade(c, 0.35), taper: [0.05, 0.05] }); }
  core.shape(rect(x - w * 0.62, y - h * 0.93, w * 1.24, h * 0.035), c, { w: PEN.line, lin: true });
  core.shape(rect(x - w * 0.72, y - h, w * 1.44, h * 0.07), c, { w: PEN.line, lin: true, cel: true });
}
// chandelier(x, y, s, o): hanging from y (ceiling): chain, arms with candle bulbs, crystal drops,
// o.lit adds glow
function chandelier(x, y, s = 1, o = {}) {
  const gc = o.color || '#d8b04a';
  if (o.lit !== false) { const g = require('./page'); g.glow(x, y + 60 * s, 90 * s, '#ffe9a8', 0.55); }
  ln([[x, y - 400], [x, y + 30 * s]], 1.6, { color: INK, taper: [0, 0] });
  core.shape(I.ell(x, y + 44 * s, 10 * s, 14 * s, 12), gc, { w: PEN.line, cel: true });
  ln(I.arc(x, y + 44 * s, 38 * s, 14 * s, 0.1, Math.PI - 0.1, 12), 3.2 * s, { color: INK, taper: [0.1, 0.1] });
  ln(I.arc(x, y + 44 * s, 38 * s, 14 * s, 0.1, Math.PI - 0.1, 12), 1.6 * s, { color: gc, taper: [0.1, 0.1] });
  [-36, -18, 0, 18, 36].forEach((dx, i) => {
    const cx = x + dx * s, cy = y + 44 * s + Math.sqrt(Math.max(0, 1 - (dx / 38) ** 2)) * 14 * s;
    core.shape(rect(cx - 2 * s, cy - 12 * s, 4 * s, 12 * s), '#fbf6ea', { w: PEN.fine, lin: true });
    I.fill(I.ell(cx, cy - 15 * s, 2.4 * s, 3.6 * s, 8), '#ffd26a', { wob: 0 });
    if (i % 2 === 0) I.fill(I.ell(cx, cy + 7 * s, 2 * s, 3 * s, 6), '#e8f4ff', { wob: 0 });
  });
}
// drape(x, y, w, h, o): a stage/ballroom swag: a valance of scallops across the top with tassels,
// and side curtains (curtain()) if o.sides
function drape(x, y, w, h, o = {}) {
  const c = o.color || '#9a2a2a';
  const n = o.swags ?? Math.max(2, Math.round(w / 140));
  const sw = w / n;
  const pts = [[x, y]];
  pts.push([x + w, y]);
  for (let i = n; i > 0; i--) {
    const a = x + i * sw, b = x + (i - 1) * sw;
    for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([lerp(a, b, t), y + h * (0.35 + Math.sin(t * Math.PI) * 0.65)]); }
  }
  cel(pts, c, { w: BG, k: 1.4 });
  for (let i = 0; i < n; i++) {
    const a = x + i * sw;
    for (let k = 1; k < 3; k++) ln(I.arc(a + sw / 2, y + h * 0.2, sw * 0.46, h * (0.3 + k * 0.18), 0.25, Math.PI - 0.25, 10), PEN.detail, { color: shade(c, 0.45) });
    ln([[a, y + h * 0.3], [a, y + h * 0.62]], 2, { color: o.tassel || '#e2b24a', taper: [0, 0.4] });
    core.shape(I.ell(a, y + h * 0.66, 3.2, 5, 8), o.tassel || '#e2b24a', { w: PEN.fine });
  }
  if (o.sides) { curtain(x - 10, y, w * 0.14, o.sides, { color: c, tie: 0.62 }); curtain(x + w - w * 0.14 + 10, y, w * 0.14, o.sides, { color: c, tie: 0.62, dir: -1 }); }
}
// banner(x, y, w, h, color, text, o): a hanging banner with swallow-tail ends and cast shadow
function banner(x, y, w, h, color, text, o = {}) {
  fillP([[x + 4, y + 5], [x + w + 4, y + 5], [x + w + 4, y + h + 5], [x + 4, y + h + 5]], '#000000', { op: 0.15, lin: true });
  cel([[x - 18, y + 6], [x, y], [x + w, y], [x + w + 18, y + 6], [x + w + 8, y + h * 0.5], [x + w + 18, y + h + 4], [x + w, y + h], [x, y + h], [x - 18, y + h + 4], [x - 8, y + h * 0.5]], color, { w: BG, lin: true, k: 0.8 });
  if (text) I.text(x + w / 2, y + h * 0.62, text, { size: o.size || h * 0.4, anchor: 'middle', color: o.color || '#fff6d8', font: o.font || 'Letter' });
}
// stage(x, y, w, h, o): a raised stage front: boards on top, a skirting apron, steps optional
function stage(x, y, w, h, o = {}) {
  const c = o.color || '#8a5a3a';
  const vp = o.vp || [x + w / 2, y - 400];
  const f = block(x, y, w, h, shade(c, 0.1), { vp, d: o.d ?? 0.06, top: c, w: BG });
  if (f.top) I.clipPoly(f.top, () => { for (let i = 1; i < 30; i++) { const u = i / 30; ln([[lerp(f.top[0][0], f.top[1][0], u), f.top[0][1]], [lerp(f.top[3][0], f.top[2][0], u), f.top[3][1]]], PEN.fine, { color: shade(c, 0.35), taper: [0, 0] }); } });
  for (let i = 1; i < 12; i++) ln([[x + (i / 12) * w, y + 3], [x + (i / 12) * w, y + h - 3]], PEN.fine, { color: shade(c, 0.45), taper: [0, 0] });
  return f;
}

// =================================================================================================
// CITY
// =================================================================================================
// the window grid of one building: irregular lighting (whole floors on, clusters, a few blinds
// half drawn), unlit panes a step darker than the facade
function windowsOn(x, top, bw, bot, r, o) {
  const cw = r.pick([6, 8, 10, 12]) * (o.winScale ?? 1), rh = r.pick([13, 15, 18, 22]) * (o.winScale ?? 1);
  const ww = cw * r.range(0.4, 0.65), wh = rh * r.range(0.38, 0.6);
  const cols = Math.max(1, Math.floor((bw - 8) / cw));
  const x0 = x + (bw - cols * cw) / 2 + (cw - ww) / 2;
  const unlit = o.unlit;
  let floor = 0;
  for (let wy = top + 8; wy < bot - rh * 0.8; wy += rh, floor++) {
    const floorOn = r.chance(0.2) ? 0.85 : r.chance(0.3) ? 0 : o.windows;
    let run = 0;
    for (let i = 0; i < cols; i++) {
      const wx = x0 + i * cw;
      if (run > 0) run--;
      const on = run > 0 || r.chance(floorOn);
      if (on && run === 0 && r.chance(0.3)) run = r.int(1, 3);
      if (on) {
        I.rect(wx, wy, ww, wh, o.windowColor || '#ffe7a3');
        if (r.chance(0.15)) I.rect(wx, wy, ww, wh * r.range(0.3, 0.6), shade(o.windowColor || '#ffe7a3', 0.25));
      } else if (unlit) I.rect(wx, wy, ww, wh, unlit);
    }
  }
}
// skyline(w, y, color, o): a row of varied buildings from x=-10 to w standing on y:
//   widths and heights vary, each building a slightly different value of the colour, roofs vary
//   (flat with parapet, stepped, antenna, water tank, slanted, spire), a narrow shadow side on
//   some, and irregular lit windows. o.min, o.var (height range), o.gap, o.windows (probability),
//   o.windowColor, o.unlit (colour for dark panes, default a step off the facade; false for none),
//   o.w (contour, default 0: silhouettes), o.tone (value variation, default 0.08), o.seed
function skyline(w, y, color, o = {}) {
  const r = rngFor(o, 'sky', w, y, o.min || 60);
  let x = -10 - r() * 20;
  const tone = o.tone ?? 0.08;
  while (x < w + 10) {
    const tall = r.chance(0.18);
    const bw = r.chance(0.25) ? r.range(22, 34) : r.range(34, 90);
    const bh = (o.min || 60) + Math.pow(r(), tall ? 0.4 : 1.2) * (o.var || 140);
    const col = mix(color, r.chance(0.5) ? '#ffffff' : '#000000', r() * tone);
    const top = y - bh;
    const pts = [[x, y + 400], [x, top]];
    const roof = r.pick(['flat', 'flat', 'parapet', 'step', 'antenna', 'tank', 'slant', 'spire']);
    if (roof === 'step' && bw > 40) { const sw = bw * r.range(0.35, 0.6), sx = x + (bw - sw) * r(); pts.push([sx, top], [sx, top - bh * 0.12], [sx + sw, top - bh * 0.12], [sx + sw, top]); }
    if (roof === 'slant') { pts.push([x + bw, top - bw * r.range(0.2, 0.45)]); } else pts.push([x + bw, top]);
    if (roof === 'spire') { pts.splice(2, 0, [x + bw * 0.42, top], [x + bw * 0.5, top - bh * 0.3], [x + bw * 0.58, top]); }
    pts.push([x + bw, y + 400]);
    core.shape(pts, col, { w: o.w ?? 0, lin: true, wob: 0.2 });
    if (roof === 'parapet' && o.windows) fillP(rect(x - 1, top - 3, bw + 2, 4), shade(col, 0.2), { lin: true });
    if (roof === 'antenna') ln([[x + bw * 0.6, top], [x + bw * 0.6, top - r.range(14, 30)]], 1.6, { color: col, taper: [0, 0.4] });
    if (roof === 'tank') { const tx = x + bw * r.range(0.2, 0.6); fillP([[tx, top], [tx + 12, top], [tx + 11, top - 12], [tx + 1, top - 12]], col, { lin: true }); fillP([[tx - 1, top - 12], [tx + 6, top - 18], [tx + 13, top - 12]], col, { lin: true }); }
    // shadow side
    if (r.chance(0.55)) { const [sx] = shadowDir(); const sw = bw * r.range(0.12, 0.25); fillP(sx < 0 ? rect(x, top + 1, sw, bh + 400) : rect(x + bw - sw, top + 1, sw, bh + 400), shade(col, o.windows ? 0.18 : 0.07), { lin: true }); }
    if (o.windows) windowsOn(x, top, bw, y, r, { ...o, unlit: o.unlit === false ? null : o.unlit || mix(col, '#000000', 0.12) });
    x += bw + (o.gap ?? 2) * r.range(0.3, 1.7);
  }
}
// building(x, y, w, h, o): one near facade (street level): cornice, window rows with frames and
// sills, a door, cel side face toward o.vp. x,y = bottom-left
function building(x, y, w, h, o = {}) {
  const r = rngFor(o, 'bldg', x, y, w);
  const col = o.color || '#c98a6a';
  const vp = o.vp || [x + w / 2, y - h * 0.5];
  block(x, y - h, w, h, col, { vp, d: o.d ?? 0.05, w: BG });
  core.shape(rect(x - 4, y - h - 2, w + 8, 9), light(col, 0.15), { w: PEN.line, lin: true });
  const cols = o.cols ?? Math.max(2, Math.round(w / 46));
  const rows = o.rows ?? Math.max(2, Math.round((h - 40) / 52));
  const cw = w / cols, rh = (h - 60) / rows;
  const winC = o.window || '#9fc8dc';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const wx = x + i * cw + cw * 0.25, wy = y - h + 18 + j * rh, ww = cw * 0.5, wh = rh * 0.58;
    const lit = o.lit && r.chance(o.lit);
    core.shape(rect(wx, wy, ww, wh), lit ? '#ffe7a3' : winC, { w: PEN.detail, lin: true });
    if (!lit) ln([[wx + ww * 0.2, wy + wh * 0.7], [wx + ww * 0.6, wy + wh * 0.2]], 1.4, { color: '#ffffff', op: 0.5 });
    ln([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], PEN.fine, { taper: [0, 0] });
    core.shape(rect(wx - 3, wy + wh, ww + 6, 4), light(col, 0.2), { w: PEN.fine, lin: true });
  }
  if (o.door !== false) door(x + w * 0.4, y - 46, w * 0.2, 46, o.doorColor || '#4a5a6a', { frame: light(col, 0.2) });
}
// house(x, y, w, h, o): a detached house (ZP's suburban house): walls, pitched roof with
// overhang + fascia, chimney, framed windows, a door with a little porch roof, a few brick marks.
// x,y = bottom-left of the front wall; h = wall height (roof adds ~0.7 w * o.pitch)
function house(x, y, w, h, o = {}) {
  const r = rngFor(o, 'house', x, y, w);
  const wall = o.wall || '#5f8fb8', roof = o.roof || '#e8ecee', trim = o.trim || '#ffffff';
  const pitch = o.pitch ?? 0.55;
  const rt = y - h, ov = w * 0.08, ph = w * 0.5 * pitch;
  // chimney behind the roof
  const cx = x + w * r.range(0.6, 0.75);
  core.shape(rect(cx, rt - ph * 0.95, w * 0.08, ph * 0.9), o.chimney || wall, { w: PEN.line, lin: true, cel: true });
  core.shape(rect(cx - 3, rt - ph * 0.98, w * 0.08 + 6, 6), trim, { w: PEN.detail, lin: true });
  cel(rect(x, rt, w, h), wall, { lin: true, w: BG, k: 0.5, shade: 0.12 });
  // brick marks in a couple of patches
  for (let p = 0; p < 3; p++) {
    const bx = x + r() * w * 0.8, by = rt + r() * h * 0.8;
    for (let k = 0; k < 6; k++) { const xx = bx + (k % 3) * 12 + (Math.floor(k / 3) % 2) * 6, yy = by + Math.floor(k / 3) * 6; ln([[xx, yy], [xx + 9, yy]], PEN.fine, { color: shade(wall, 0.35), taper: [0.1, 0.1] }); }
  }
  // roof: front triangle (gable) or a side-on slab (o.gable false)
  if (o.gable !== false) {
    cel([[x - ov, rt + 2], [x + w / 2, rt - ph], [x + w + ov, rt + 2]], roof, { lin: true, w: BG, k: 1, shade: 0.12 });
    ln([[x - ov, rt + 2], [x + w / 2, rt - ph], [x + w + ov, rt + 2]], 5, { color: trim, taper: [0, 0], lin: true });
    ln([[x - ov, rt + 2], [x + w / 2, rt - ph], [x + w + ov, rt + 2]], BG, { taper: [0, 0], lin: true });
  } else {
    cel([[x - ov, rt + 2], [x + w * 0.12, rt - ph], [x + w * 0.88, rt - ph], [x + w + ov, rt + 2]], roof, { lin: true, w: BG, k: 1, shade: 0.12 });
  }
  // windows
  const win = (wx, wy, ww, wh) => windowFrame(wx, wy, ww, wh, { t: 4, sky: o.glass || '#dbe8ee', frame: trim, sill: true, panes: [2, 1] });
  win(x + w * 0.55, rt + h * 0.2, w * 0.3, h * 0.36);
  if (o.upstairs) win(x + w * 0.4, rt - ph * 0.55, w * 0.2, ph * 0.35);
  door(x + w * 0.15, y - h * 0.62, w * 0.18, h * 0.62, o.door || '#ffffff', { frame: trim });
  // porch roof over the door
  fillP([[x + w * 0.1, y - h * 0.66], [x + w * 0.24, y - h * 0.8], [x + w * 0.38, y - h * 0.66]], trim, { lin: true });
  inkP([[x + w * 0.1, y - h * 0.66], [x + w * 0.24, y - h * 0.8], [x + w * 0.38, y - h * 0.66]], PEN.line, { lin: true });
}
// fence(x0, x1, y, h, o): a picket fence: pickets of slightly varied height and lean, pointed tops,
// two rails behind, o.color, o.style 'picket' | 'board' (vertical boards, flat tops, as a yard)
function fence(x0, x1, y, h, o = {}) {
  const r = rngFor(o, 'fence', x0, y, h);
  const c = o.color || '#f2eee4';
  const board = o.style === 'board';
  const pw = o.pw ?? (board ? h * 0.22 : h * 0.13), gap = board ? 1 : pw * 0.7;
  [0.25, 0.7].forEach((t) => core.shape(rect(x0 - 4, y - h * t - 3, x1 - x0 + 8, 6), shade(c, 0.15), { w: PEN.detail, lin: true }));
  for (let x = x0; x < x1; x += pw + gap) {
    const hh = h * r.range(0.95, 1.04), lean = r.pm(1.2);
    const pts = board ? [[x, y], [x + lean, y - hh], [x + pw + lean, y - hh], [x + pw, y]] : [[x, y], [x + lean, y - hh * 0.9], [x + pw / 2 + lean, y - hh], [x + pw + lean, y - hh * 0.9], [x + pw, y]];
    cel(pts, mix(c, '#8a7a6a', r() * 0.1), { lin: true, w: PEN.detail, k: 0.3, shade: 0.14 });
    if (board && r.chance(0.3)) ln([[x + pw * 0.5, y - hh * 0.7], [x + pw * 0.5, y - hh * 0.4]], PEN.fine, { color: shade(c, 0.4) });
  }
}
// bench(x, y, w, o): a park bench seen from the front-3/4: slatted seat and back, iron ends
function bench(x, y, w, o = {}) {
  const c = o.color || '#b07a48', iron = o.iron || '#2a2a30';
  const sh = w * 0.2; // seat height
  const ends = [x + w * 0.1, x + w * 0.88];
  // back slats first (behind), then the iron ends, then the seat slats in front
  for (let i = 0; i < 3; i++) core.shape(rect(x - 4, y - sh * 1.45 - i * sh * 0.3, w + 8, sh * 0.2), c, { w: PEN.detail, lin: true, cel: true });
  ends.forEach((lx) => {
    ln([[lx - 3, y], [lx, y - sh], [lx - 5, y - sh * 2.2]], 3.4, { color: iron, taper: [0, 0] });
    ln([[lx + w * 0.05, y], [lx + 1, y - sh * 0.9]], 3.2, { color: iron, taper: [0, 0] });
    ln([[lx - 2, y - sh], [lx + w * 0.07, y - sh * 1.05]], 2.6, { color: iron, taper: [0, 0] });
  });
  for (let i = 0; i < 3; i++) core.shape([[x + i * 3, y - sh - i * sh * 0.14], [x + w + i * 3, y - sh - i * sh * 0.14], [x + w + i * 3 + 2, y - sh - i * sh * 0.14 - sh * 0.11], [x + i * 3 + 2, y - sh - i * sh * 0.14 - sh * 0.11]], i === 0 ? c : light(c, 0.1), { w: PEN.detail, lin: true });
}
// lamppost(x, y, h, o): a street lamp: tapered post, lantern head; o.on adds a glow and a light pool
function lamppost(x, y, h, o = {}) {
  const c = o.color || '#2a2f3a';
  if (o.on) { const g = require('./page'); g.glow(x, y - h + 10, h * 0.5, '#ffe7a3', 0.6); fillP(I.ell(x, y, h * 0.3, h * 0.05, 18), '#ffe7a3', { op: 0.25 }); }
  core.shape([[x - 5, y], [x - 3, y - h * 0.9], [x + 3, y - h * 0.9], [x + 5, y]], c, { w: PEN.line, lin: true });
  core.shape(rect(x - 8, y - 10, 16, 10), c, { w: PEN.line, lin: true });
  core.shape([[x - 10, y - h * 0.9], [x + 10, y - h * 0.9], [x + 7, y - h * 1.02], [x - 7, y - h * 1.02]], o.on ? '#ffe7a3' : '#c9d2d8', { w: PEN.line, lin: true });
  core.shape([[x - 12, y - h * 1.02], [x, y - h * 1.08], [x + 12, y - h * 1.02]], c, { w: PEN.line, lin: true });
}

// =================================================================================================
// PEOPLE IN THE BACKGROUND — varied silhouettes, never clones
// =================================================================================================
const SKINS = ['#f4cfae', '#f0c49d', '#e0a67e', '#c68a62', '#9a6444', '#7a4a32', '#5a3624', '#f6d8c0'];
const HAIRS = ['#2a1d18', '#4a3020', '#6b3f26', '#a0602e', '#d8b060', '#8a8a8a', '#e8e4dc', '#1a1a22', '#b04a2a'];
const CLOTHES = ['#3f6fa8', '#c0574a', '#4f8a5a', '#e2b24a', '#7a4e8a', '#2d3a4a', '#d98a4a', '#6aa8c8', '#8a6a4a', '#e8e0cc', '#b8413a', '#3a5a4a'];
// head(): a background head: skull oval + hair mass in one of several styles, seen from the back
// (o.view 'back'), the front ('front': two dot eyes, a nose tick) or in 3/4 ('side')
function bgHead(x, y, s, r, o = {}) {
  const skin = o.skin, hair = o.hair;
  const w = s * r.range(0.85, 1.1), hh = s * r.range(1.0, 1.2);
  const style = o.style || r.pick(['short', 'short', 'long', 'bun', 'curly', 'bald', 'cap', 'pony', 'bob']);
  const view = o.view || 'back';
  const lw = o.lw ?? PEN.detail;
  const ear = view !== 'back' || r.chance(0.5);
  if (style === 'pony' && view !== 'back') core.limb([[x + w * 0.7, y - hh * 0.5], [x + w * 1.25, y + hh * 0.2], [x + w * 1.2, y + hh * 1.0]], [w * 0.2, w * 0.26, w * 0.1], hair, { w: lw });
  if (style === 'long') cel([[x - w * 1.02, y - hh * 0.2], [x - w * 1.1, y + hh * 1.1], [x + w * 1.1, y + hh * 1.1], [x + w * 1.02, y - hh * 0.2]], hair, { w: lw, k: s * 0.05 });
  if (ear) [-1, 1].forEach((sd) => core.shape(I.ell(x + sd * w * 0.98, y + hh * 0.1, w * 0.18, hh * 0.24, 8), skin, { w: lw * 0.8 }));
  cel(I.ell(x, y, w, hh, 18), skin, { w: lw, k: s * 0.05 });
  if (view === 'front') {
    [-1, 1].forEach((sd) => I.fill(I.ell(x + sd * w * 0.32, y + hh * 0.08, w * 0.09, hh * 0.13, 6), INK, { wob: 0 }));
    ln([[x + w * 0.05, y + hh * 0.3], [x + w * 0.14, y + hh * 0.38]], lw * 0.8, { taper: [0.2, 0.4] });
    if (r.chance(0.5)) ln(I.arc(x, y + hh * 0.5, w * 0.25, hh * 0.1, 0.3, Math.PI - 0.3, 5), lw * 0.8);
  }
  const top = (k) => I.arc(x, y, w * 1.04, hh * 1.04, Math.PI * (1 + k), Math.PI * (2 - k), 10);
  const hairMass = (pts) => { cel(pts, hair, { w: lw, k: s * 0.05, shade: 0.28 }); };
  if (style === 'bald') { if (r.chance(0.5)) hairMass([...I.arc(x, y + hh * 0.1, w * 1.03, hh, Math.PI * 0.95, Math.PI * 1.25, 4), [x - w * 0.8, y + hh * 0.35]]); return; }
  if (style === 'cap') {
    hairMass([...top(0), [x + w * 1.05, y - hh * 0.1], [x - w * 1.05, y - hh * 0.1]].map(([px, py]) => [px, py]));
    cel([...I.arc(x, y - hh * 0.1, w * 1.06, hh * 0.95, Math.PI, Math.PI * 2, 10), [x + w * 1.4, y - hh * 0.1]], o.capColor || r.pick(CLOTHES), { w: lw, k: s * 0.05 });
    return;
  }
  if (view === 'back') {
    // back of the head: hair covers it, the nape line shows
    const nape = style === 'short' || style === 'bun' || style === 'pony' ? 0.55 : 1.0;
    const pts = [...I.arc(x, y, w * 1.05, hh * 1.05, Math.PI * 0.92, Math.PI * 2.08, 16), [x + w * 0.7, y + hh * nape], [x, y + hh * (nape + 0.08)], [x - w * 0.7, y + hh * nape]];
    if (style === 'curly') { const cs = []; for (let i = 0; i < 9; i++) { const a = Math.PI * 0.85 + (i / 8) * Math.PI * 1.3; cs.push([x + Math.cos(a) * w * 0.9, y + Math.sin(a) * hh * 0.9, w * r.range(0.3, 0.42)]); } hairMass(blobOutline(cs, x, y, 60)); }
    else hairMass(pts);
    // a few hair lines
    for (let i = 0; i < 2; i++) { const u = r.pm(0.5); ln([[x + u * w, y - hh * 0.8], [x + u * w * 1.2, y + hh * 0.2]], lw * 0.6, { color: light(hair, 0.35) }); }
  } else {
    const k = style === 'curly' ? 0 : 0.08;
    if (style === 'curly') { const cs = []; for (let i = 0; i < 8; i++) { const a = Math.PI * 0.9 + (i / 7) * Math.PI * 1.2; cs.push([x + Math.cos(a) * w * 0.9, y + Math.sin(a) * hh * 0.85, w * r.range(0.28, 0.38)]); } hairMass(blobOutline(cs, x, y - hh * 0.3, 60)); }
    else hairMass([...top(k), [x + w * 0.9, y - hh * 0.2], [x + w * 0.3, y - hh * 0.5], [x - w * 0.5, y - hh * 0.35], [x - w * 0.95, y - hh * 0.05]]);
  }
  if (style === 'bun') cel(I.ell(x + r.pm(w * 0.2), y - hh * 1.1, w * 0.4, hh * 0.32, 12), hair, { w: lw, k: s * 0.04 });
  if (style === 'pony' && view === 'back') core.limb([[x + w * 0.2, y - hh * 0.2], [x + w * 0.5, y + hh * 0.6], [x + w * 0.3, y + hh * 1.3]], [w * 0.2, w * 0.26, w * 0.1], hair, { w: lw });
}
// crowd(x0, x1, y, o): an audience/crowd in rows, back row first. Each person is built from
// varied parts: head size/shape, hair style and colour, skin, shoulder width, clothes; rows get
// smaller and fade toward o.haze going back; the back row(s) can be flat silhouettes.
//   o.rows (3), o.s (head radius in the front row, 14), o.view 'back'|'front', o.haze, o.gap
//   o.silhouette (colour: back rows drawn as one flat mass in this colour), o.seed, o.density
function crowd(x0, x1, y, o = {}) {
  const r = rngFor(o, 'crowd', x0, x1, y);
  const rows = o.rows ?? 3;
  const s0 = o.s ?? 14;
  const hz = o.haze;
  for (let k = rows - 1; k >= 0; k--) {
    const t = rows === 1 ? 0 : k / (rows - 1); // 0 front .. 1 back
    const s = s0 * lerp(1, 0.62, t);
    const yy = y - k * s0 * (o.rowGap ?? 1.9);
    const sil = o.silhouette && k > 0 && k === rows - 1;
    const step = s * 2.6 * (o.density ?? 1);
    let x = x0 + r.pm(step * 0.5) + (k % 2) * step * 0.5;
    const people = [];
    while (x < x1 + step) { people.push(x); x += step * r.range(0.75, 1.2); }
    const fade = (c) => (hz ? mix(c, hz, t * (o.hazeMax ?? 0.55)) : c);
    people.forEach((px) => {
      const hs = s * r.range(0.85, 1.12);
      const hy = yy - hs * r.range(2.3, 2.9) - (r.chance(0.2) ? hs * 0.5 : 0);
      const sw = hs * r.range(1.6, 2.3);
      const cloth = fade(r.pick(CLOTHES)), skin = fade(r.pick(SKINS)), hair = fade(r.pick(HAIRS));
      const lw = penAt(PEN.detail, t * 0.6);
      if (sil) {
        core.shape([[px - sw, yy + 40], [px - sw * 0.95, hy + hs * 1.6], [px - sw * 0.5, hy + hs * 1.1], [px + sw * 0.5, hy + hs * 1.1], [px + sw * 0.95, hy + hs * 1.6], [px + sw, yy + 40]], o.silhouette, { w: 0 });
        core.shape(I.ell(px, hy, hs, hs * 1.1, 14), o.silhouette, { w: 0 });
        return;
      }
      // shoulders/torso: a rounded trapezoid, collar notch
      const body = [[px - sw, yy + 40], [px - sw * 0.98, hy + hs * 1.75], [px - sw * 0.7, hy + hs * 1.15], [px - hs * 0.4, hy + hs * 0.95], [px + hs * 0.4, hy + hs * 0.95], [px + sw * 0.7, hy + hs * 1.15], [px + sw * 0.98, hy + hs * 1.75], [px + sw, yy + 40]];
      cel(body, cloth, { w: lw, k: hs * 0.06 });
      if (r.chance(0.35)) ln([[px, hy + hs * 1.0], [px + r.pm(1), hy + hs * 2.2]], lw * 0.7, { color: shade(cloth, 0.45) });
      core.shape(rect(px - hs * 0.32, hy + hs * 0.6, hs * 0.64, hs * 0.5), skin, { w: lw * 0.8 });
      bgHead(px, hy, hs, r, { skin, hair, view: o.view, lw });
    });
  }
}
// person(x, y, s, o): a standing background figure (street/park extra), ~7 s tall, varied build,
// coat or dress, a bag or an umbrella now and then. s = head radius. o.view 'back'|'front'|'side'
function person(x, y, s, o = {}) {
  const r = rngFor(o, 'person', x, y, s);
  const skin = o.skin || r.pick(SKINS), hair = o.hair || r.pick(HAIRS), cloth = o.clothes || r.pick(CLOTHES), legs = o.legs || r.pick(['#2d3a4a', '#3a3a44', '#6a5a4a', '#2a2a30', '#5a6a8a']);
  const H = s * r.range(6.4, 7.4), sw = s * r.range(1.3, 1.9);
  const dress = o.dress ?? r.chance(0.3);
  const lw = o.lw ?? PEN.detail;
  const hip = y - H * 0.47, sh = y - H * 0.8;
  const stride = r.pm(s * 0.6);
  [-1, 1].forEach((sd) => core.limb([[x + sd * s * 0.45, hip], [x + sd * s * 0.45 + stride * sd, y - s * 0.3]], [s * 0.42, s * 0.34], legs, { w: lw }));
  [-1, 1].forEach((sd) => core.shape(I.ell(x + sd * s * 0.45 + stride * sd + s * 0.2, y - s * 0.12, s * 0.5, s * 0.24, 8), '#2a2a30', { w: lw * 0.8 }));
  const hem = dress ? y - H * 0.25 : hip + s * 0.4;
  cel([[x - sw * (dress ? 1.2 : 1), hem], [x - sw, sh + s * 0.4], [x - sw * 0.6, sh], [x + sw * 0.6, sh], [x + sw, sh + s * 0.4], [x + sw * (dress ? 1.2 : 1), hem]], cloth, { w: lw, k: s * 0.08 });
  [-1, 1].forEach((sd) => core.limb([[x + sd * sw * 0.85, sh + s * 0.3], [x + sd * sw * 1.05, hip - s * 0.2], [x + sd * sw * 0.95, hip + s * 0.5]], [s * 0.34, s * 0.3, s * 0.26], cloth, { w: lw }));
  if (r.chance(0.3)) core.shape(rrect(x + sw * 0.9, hip - s * 0.2, s * 1.1, s * 1.1, s * 0.2), r.pick(['#8a5a33', '#2a2a30', '#c0574a']), { w: lw, lin: true });
  core.shape(rect(x - s * 0.3, sh - s * 0.5, s * 0.6, s * 0.6), skin, { w: lw * 0.8 });
  bgHead(x, sh - s * 1.1, s, r, { skin, hair, view: o.view || 'side', lw });
}

module.exports = { BG, PEN };
Object.assign(module.exports, {
  setSeed, mkRng, rngFor, hash, depth, haze, layers, penAt, shadowDir, blobOutline, convexHull, inside, yAt, rrect, recede, mix, shade, light,
  tuft, grass, ridge, hills, landscape, road, canopy, trunk, tree, treeline, bush, hedge, flower, flowerBed,
  stone, stoneWall, paving, sea, shore, cloud, stars, moon, sun, rain, sky, river, bridge, duck,
  block, grain, room, interior, windowFrame, door, table, chair, frame, sheet, books, shelf, plant, lamp, clock,
  fridge, counter, wallCabinets, tiles, kettle, mug, jar, desk, monitor, officeChair, bed, curtain, column, chandelier, drape, banner, stage,
  skyline, building, house, fence, bench, lamppost,
  SKINS, HAIRS, CLOTHES, bgHead, crowd, person,
});
