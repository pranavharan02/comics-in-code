// UP-HILL — Christina Rossetti (1862). A Zen-Pencils-style strip drawn in code.
// node comics/uphill.js  -> out/up-hill.svg      (OUT=path overrides)
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, LW, line, shape, limb, cel, shade } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const { hand } = require('../zp/hand');
const C = require('./cast_uphill');

I.seed(1862);
const W = 980;
let H = 0;
const mix = F.mix;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SPK = {}; // speaker anchor points, set while drawing a panel and read by its lettering
// a local seeded rng, so the repeated hill redraws identically in every panel
function rngOf(seed) {
  let s = seed >>> 0;
  const r = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.pm = (a = 1) => (r() * 2 - 1) * a;
  return r;
}

// ---------------------------------------------------------------- the colour script
// dawn mint and cream -> noon gold -> afternoon amber -> dusk violet -> night indigo; one warm window
const TIMES = {
  dawn: { skyTop: '#bfe4e0', skyLow: '#fdf1d2', far2: '#d7ead0', far: '#b9dcab', hill: '#9fd083', hillB: '#b3da8c', hillSh: '#7fb66c', hedge: '#4a8a44', road: '#fbf0cf', roadEdge: '#d9c99a', inn: '#f4e8d0', roof: '#c0574a', tree: '#5e9e50', trunk: '#6d4a33', fg: '#6fae5c', fgTree: '#3f7a3c', sun: [0.12, 0.3, '#fff6d6'], clouds: '#ffffff', tint: null, sheep: true, window: 0 },
  noon: { skyTop: '#8fd0ea', skyLow: '#e6f5f2', far: '#b6dc9e', hill: '#93c974', hedge: '#4f8c40', road: '#f4e2ad', wall: '#d2c4a2', tint: null },
  after: { wall: '#cdb994', skyTop: '#f6c77c', skyLow: '#fdecbf', far2: '#f0dca6', far: '#e0c98a', hill: '#c6bd63', hillB: '#d4c873', hillSh: '#a59c4a', hedge: '#7a7632', road: '#fbe6b2', roadEdge: '#d9b878', inn: '#f2dcb4', roof: '#b44c3c', tree: '#8a9a44', trunk: '#6d4a33', fg: '#a8a24c', fgTree: '#6c7a32', sun: [0.1, 0.44, '#fff2c4'], clouds: '#fff4dc', tint: ['#ff9a4a', 0.08], window: 0 },
  dusk: { skyTop: '#5d5298', skyLow: '#f6a879', far2: '#b88aa0', far: '#8a6f9e', hill: '#6a6aa0', hillB: '#7472a8', hillSh: '#54558a', hedge: '#3e3f6e', road: '#b6a8cc', roadEdge: '#8a7aa8', inn: '#6a5f8a', roof: '#44385e', tree: '#434a7c', trunk: '#3a3050', fg: '#4a4a7e', fgTree: '#2e2f58', sun: null, clouds: '#f0b0a0', tint: ['#5b4e8c', 0.26], window: 1 },
  night: { skyTop: '#1c2656', skyLow: '#3a4580', far: '#2c3666', hill: '#2a3462', hedge: '#1a2146', shade: '#222b55', road: '#5a6498', tint: ['#1b2350', 0.38] },
};
const tint = (P) => P.tint || undefined;
// what changes between the three identical hill framings: the sun and the shadows move, the walkers climb,
// the sheep graze elsewhere, the inn's window lights up
const HILLDAY = {
  dawn: { faceUs: true, t: 0.035, sun: [0.055, 0.42], shadeSide: 1, shadowDX: 1, sheep: [[0.5, 0.5], [0.54, 0.52], [0.58, 0.49], [0.86, 0.74], [0.9, 0.73], [0.34, 0.66]], birds: [[0.3, 0.26], [0.33, 0.23], [0.36, 0.27]], smoke: '#ffffff', lit: 0 },
  after: { t: 0.45, sun: [0.8, 0.13], shadeSide: -1, shadowDX: -1, sheep: [[0.2, 0.74], [0.24, 0.76], [0.14, 0.72], [0.76, 0.3], [0.8, 0.33]], birds: [[0.78, 0.32], [0.82, 0.3]], smoke: '#fff4dc', lit: 0 },
  dusk: { t: 0.86, sun: null, shadeSide: 0, shadowDX: 0, sheep: [[0.44, 0.83], [0.47, 0.84], [0.5, 0.83], [0.46, 0.81]], birds: [[0.84, 0.12], [0.87, 0.1]], smoke: '#8a80a8', lit: 2 },
};

// ---------------------------------------------------------------- the hill (one design, repeated)
// Camera at the foot of the hill. The road enters wide at the bottom left and switches back up the slope,
// narrowing with distance, to the inn on the crest. Foreground: a dry-stone wall, a stile and an oak that
// frames the right edge. Light from the upper left, so the right flank is in shadow.
const HILLP = [[-0.06, 0.64], [0.06, 0.6], [0.18, 0.47], [0.3, 0.33], [0.42, 0.22], [0.52, 0.165], [0.6, 0.145], [0.68, 0.15], [0.77, 0.21], [0.87, 0.33], [0.97, 0.45], [1.08, 0.52]];
const ROADC = [[0.16, 1.1], [0.2, 0.96], [0.34, 0.87], [0.6, 0.8], [0.74, 0.745], [0.75, 0.69], [0.64, 0.64], [0.42, 0.58], [0.3, 0.535], [0.3, 0.495], [0.42, 0.455], [0.6, 0.395], [0.66, 0.35], [0.62, 0.31], [0.52, 0.275], [0.5, 0.245], [0.55, 0.215], [0.6, 0.19]];
function roadPath(w, h) {
  const c = I.sample(ROADC.map(([x, y]) => [x * w, y * h]), false, 3);
  // width falls with height on the slope (perspective): ~64 px at the foot, ~4 px at the crest
  const hw = (y) => (4 + 60 * Math.pow(clamp((y / h - 0.19) / 0.85, 0, 1), 1.55)) / 2;
  const L = [], R = [], acc = [0];
  for (let i = 0; i < c.length; i++) {
    const a = c[Math.max(0, i - 2)], b = c[Math.min(c.length - 1, i + 2)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const r = hw(c[i][1]);
    // flatten the ribbon vertically (the road lies on the slope: seen from low, it is squashed)
    L.push([c[i][0] - ty * r, c[i][1] + tx * r * 0.55]); R.push([c[i][0] + ty * r, c[i][1] - tx * r * 0.55]);
    if (i) acc.push(acc[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
  }
  const at = (t) => { const d = t * acc[acc.length - 1]; let i = acc.findIndex((v) => v >= d); if (i < 1) i = 1; const k = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1); return [lerp(c[i - 1][0], c[i][0], k), lerp(c[i - 1][1], c[i][1], k), Math.sign(c[i][0] - c[i - 1][0]) || 1]; };
  return { c, L, R, hw, at };
}
function roadAt(t, w, h) { return roadPath(w, h).at(t); }
const hillY = (x, w, h) => SC.yAt(HILLP.map(([a, b]) => [a * w, b * h]), x);

function cottage(x, y, s, P, o = {}) {
  // x, y: middle of the front wall's base. A two-up two-down inn with a chimney and a hanging sign.
  const wall = P.inn, roof = P.roof;
  const lit = o.lit || 0;
  if (lit) PG.glow(x + 6 * s, y - 14 * s, 70 * s * (0.7 + lit * 0.4), '#ffc864', 0.55 + lit * 0.12);
  // gable end (side, in shadow, toward the right)
  cel([[x + 26 * s, y], [x + 26 * s, y - 22 * s], [x + 40 * s, y - 25 * s], [x + 40 * s, y - 3 * s]], wall, { w: 1.3, lin: true, shade: 0.3, lx: 30, ly: 0, k: 1 });
  shape([[x - 26 * s, y], [x - 26 * s, y - 22 * s], [x + 26 * s, y - 22 * s], [x + 26 * s, y]], wall, { w: 1.4, lin: true });
  // roof: front slope + ridge to the gable
  shape([[x - 30 * s, y - 21 * s], [x - 20 * s, y - 38 * s], [x + 30 * s, y - 40 * s], [x + 44 * s, y - 24 * s], [x + 28 * s, y - 21 * s]], roof, { w: 1.4, lin: true });
  line([[x + 30 * s, y - 40 * s], [x + 28 * s, y - 21 * s]], 1.0, { color: shade(roof, 0.4) });
  shape(I.rectPts(x + 12 * s, y - 48 * s, 6 * s, 10 * s), mix(wall, roof, 0.3), { w: 1.1, lin: true });
  const win = lit ? '#ffd46a' : mix(wall, '#5a6a88', 0.55);
  [[-19, -17], [-4, -17], [12, -17], [-19, -8]].forEach(([dx, dy], i) => {
    const on = lit && (i === 1 || (lit > 1 && i !== 3));
    shape(I.rectPts(x + dx * s, y + dy * s, 6 * s, 6 * s), on ? '#ffd46a' : win === '#ffd46a' ? mix(wall, '#5a4a6a', 0.5) : win, { w: 0.9, lin: true });
  });
  shape(I.rectPts(x + 5 * s, y - 10 * s, 7 * s, 10 * s), lit > 1 ? '#ffb84a' : '#7a5238', { w: 0.9, lin: true });
  if (o.smoke) for (let k = 0; k < 4; k++) I.fill(I.ell(x + (16 + k * 5) * s, y - (54 + k * 8) * s, (3 + k * 1.6) * s, (2.4 + k * 1.2) * s, 10), o.smoke, { wob: 0.2, op: 0.85 - k * 0.18 });
}

// small figures on the hill road, drawn with the rig down to ~s 0.14; below that, a two-shape silhouette
function hillFigs(t, w, h, P, o = {}) {
  const rp = roadPath(w, h);
  const [x, y, sd] = rp.at(t);
  const s = o.s ?? Math.max(0.19, 0.4 * Math.pow(rp.hw(y) / rp.hw(h * 0.97), 0.6));
  const T = tint(P);
  if (s >= 0.12) {
    const yaw = o.yaw ?? (sd > 0 ? 138 : -138);
    const hy = o.yaw != null ? yaw - 25 : yaw + (sd > 0 ? 14 : -14);
    if (o.halo) PG.glow(x, y - 30 * s, 110 * s, '#ffcf6a', 0.35);
    const rr = F.duo.handInHand(GDX, C.isla, { x: x + (sd > 0 ? 1 : -1) * 22 * s, y: y + 3 * s, s, yaw, stickA: true, a: { tint: T, head: { yaw: hy, pitch: o.yaw != null ? -8 : 0, look: o.yaw != null ? [-0.8, 0.5] : undefined, mood: o.yaw != null ? 'joy' : undefined, mouth: o.yaw != null ? 'smile' : undefined } }, c: { tint: T, head: { yaw: o.yaw != null ? yaw - 10 : yaw + (sd > 0 ? -25 : 25), pitch: 6, look: [0.3, -0.6], mood: o.yaw != null ? 'neutral' : undefined, mouth: o.yaw != null ? 'o' : undefined } } });
    if (GDX === GDB) gdFringe(rr.a, Math.abs(hy), T);
    return [x, y, s, rr];
  }
  // tiny: cap + green body + stick; red coat + yellow boots
  const k = s / 0.1;
  const tc = (c) => (T ? mix(c, T[0], T[1]) : c);
  const gx = x + 3 * k, ix = x - 4 * k;
  shape([[gx - 3 * k, y], [gx - 3.2 * k, y - 13 * k], [gx + 0.4 * k, y - 16 * k], [gx + 3.4 * k, y - 13 * k], [gx + 3 * k, y]], tc('#3f6e4a'), { w: 0.9 });
  shape(I.ell(gx + 0.4 * k, y - 18.5 * k, 2.6 * k, 2.8 * k, 10), tc('#f0c49d'), { w: 0.9 });
  shape([[gx - 2.8 * k, y - 20 * k], [gx + 3.8 * k, y - 21 * k], [gx + 4.4 * k, y - 19.4 * k], [gx - 2.8 * k, y - 19 * k]], tc('#6f6152'), { w: 0.8 });
  line([[gx + 4 * k, y - 8 * k], [gx + 5.6 * k, y]], 1.0, { color: tc('#8a5a33') });
  shape([[ix - 2.6 * k, y - 2.6 * k], [ix - 3 * k, y - 8.6 * k], [ix, y - 10 * k], [ix + 3 * k, y - 8.6 * k], [ix + 2.6 * k, y - 2.6 * k]], tc('#d8453b'), { w: 0.9 });
  I.fill(I.rectPts(ix - 2.2 * k, y - 2.8 * k, 4.4 * k, 2.8 * k), tc('#f2c230'), { wob: 0 });
  shape(I.ell(ix, y - 12 * k, 2.7 * k, 2.7 * k, 10), tc('#6b3f26'), { w: 0.9 });
  line([[ix + 2.4 * k, y - 7 * k], [gx - 2.8 * k, y - 8 * k]], 0.9, { color: tc('#d8453b') });
  return [x, y, s];
}

function hillPanel(w, h, P, o = {}) {
  const D = o.day;
  const rr = rngOf(7);
  const dusk = P === TIMES.dusk;
  SC.sky(w, h, P.skyTop, P.skyLow);
  if (D.sun) SC.sun(D.sun[0] * w, D.sun[1] * h, h * 0.07, P.sun[2], { glow: P.sun[2] });
  if (dusk) { PG.glow(w * 0.95, h * 0.5, w * 0.35, '#ffb37a', 0.55); SC.stars(w, h * 0.3, 18, '#fff3cf', { seed: 21 }); }
  if (P.clouds && !dusk) { SC.cloud(w * (D.sun[0] > 0.5 ? 0.34 : 0.4), h * 0.1, 22, P.clouds, { seed: 3 }); SC.cloud(w * (D.sun[0] > 0.5 ? 0.62 : 0.8), h * 0.07, 16, P.clouds, { seed: 5 }); }
  // far country: two hazy ridges with a treeline, seen either side of the hill
  const hz = P.skyLow;
  SC.hills(w, h * 0.5, h * 0.08, P.far2, { seed: 11, n: 3, w: 0, bottom: h + 20, shade: 0.06 });
  const farP = SC.hills(w, h * 0.6, h * 0.08, P.far, { seed: 12, n: 2.4, depth: 0.7, bottom: h + 20, shade: 0.08 });
  SC.treeline(farP, { h: h * 0.035, leaf: mix(P.tree, hz, 0.45), depth: 0.8, seed: 4, gaps: 0.15 });
  // the hill
  const hp = [[-20, h + 20], ...HILLP.map(([x, y]) => [x * w, y * h]), [w + 20, h + 20]];
  shape(hp, P.hill, { w: SC.BG, wob: 0.4 });
  const prof = HILLP.map(([x, y]) => [x * w, y * h]);
  const cy = (x, t) => lerp(SC.yAt(prof, x), h * 1.02, t) + Math.pow(t, 1.4) * 6; // contour curve t of the way down
  I.clipPoly(hp, () => {
    const levels = [0.12, 0.3, 0.55, 0.84];
    const tones = [P.hillB, P.hill, mix(P.hill, P.hillB, 0.5), P.hillB, P.hill, P.hillB];
    for (let i = 0; i < levels.length; i++) {
      const t0 = i ? levels[i - 1] : 0, t1 = levels[i];
      const xs = []; for (let x = -20; x <= w + 20; x += 12) xs.push(x);
      I.fill(xs.map((x) => [x, cy(x, t0)]).concat(xs.slice().reverse().map((x) => [x, cy(x, t1)])), tones[i], { wob: 0.3 });
      const fx0 = w * (0.12 + rr() * 0.6), fw = w * (0.12 + rr() * 0.1);
      I.fill([[fx0, cy(fx0, t0)], [fx0 + fw, cy(fx0 + fw, t0)], [fx0 + fw + 10, cy(fx0 + fw + 10, t1)], [fx0 - 6, cy(fx0 - 6, t1)]], i % 2 ? mix(P.hillB, '#f6e6a0', dusk ? 0.1 : 0.3) : mix(P.hill, P.hedge, 0.18), { wob: 0.3, lin: true });
    }
    // the shadow flank moves with the sun: right flank at dawn, left flank in the afternoon, all of it at dusk
    if (D.shadeSide > 0) I.fill([[w * 0.64, h * 0.1], [w * 0.8, h * 0.2], [w + 30, h * 0.45], [w + 30, h + 20], [w * 0.78, h + 20], [w * 0.82, h * 0.72], [w * 0.74, h * 0.4], [w * 0.68, h * 0.22]], P.hillSh, { wob: 0.6, op: 0.75 });
    else if (D.shadeSide < 0) I.fill([[w * 0.56, h * 0.1], [w * 0.4, h * 0.2], [-30, h * 0.58], [-30, h + 20], [w * 0.1, h + 20], [w * 0.2, h * 0.7], [w * 0.36, h * 0.42], [w * 0.5, h * 0.24]], P.hillSh, { wob: 0.6, op: 0.75 });
    else { I.fill([[-30, -10], [w + 30, -10], [w + 30, h + 20], [-30, h + 20]], P.hillSh, { op: 0.5, lin: true }); I.fill([[w * 0.68, h * 0.14], [w * 0.8, h * 0.21], [w + 30, h * 0.45], [w + 30, h * 0.52], [w * 0.86, h * 0.36], [w * 0.74, h * 0.2]], '#e89a8a', { op: 0.45, wob: 0.4 }); }
    const hx0 = D.shadeSide < 0 ? 0 : 0.74;
    for (let k = 0; k < 26; k++) {
      const x = w * (hx0 + rr() * 0.26), t = 0.06 + rr() * 0.8, y = cy(x, t);
      if (D.shadeSide !== 0) line([[x, y], [x + 10 + rr() * 8, y + 3 + t * 6]], 1.1, { color: P.hedge, op: 0.55, taper: [0.3, 0.4] });
    }
    levels.forEach((t, i) => {
      const pts = []; for (let x = -20; x <= w + 20; x += 8) pts.push([x, cy(x, t) + rr.pm(0.8)]);
      const th = 1.5 + t * 2.4;
      line(pts, th, { color: P.hedge, taper: [0.02, 0.02], wob: 0.9 });
      for (let x = -10; x < w; x += 9 + rr() * 16) I.fill(I.ell(x, cy(x, t) - th * 0.35, th * 0.55 + rr() * th * 0.3, th * 0.45, 8), P.hedge, { wob: 0.3 });
      if (i < levels.length - 1) for (let c = 0; c < 2 + i; c++) {
        const x = w * (0.08 + rr() * 0.84), t2 = levels[i + 1];
        line([[x, cy(x, t)], [x + (x - w * 0.6) * 0.12, cy(x + (x - w * 0.6) * 0.12, t2)]], 1 + t * 1.6, { color: P.hedge, taper: [0.05, 0.05], wob: 0.9 });
      }
    });
    // hedgerow trees, sized by distance; each casts a flat shadow away from the sun
    [[0.22, 0.23], [0.47, 0.1], [0.83, 0.39], [0.9, 0.58], [0.38, 0.39], [0.7, 0.1], [0.05, 0.39]].forEach(([x, t], i) => {
      const yb = cy(x * w, t), th = h * lerp(0.05, 0.2, t);
      if (D.shadowDX) I.fill([[x * w - th * 0.05, yb], [x * w + D.shadowDX * th * 0.9, yb + th * 0.06], [x * w + D.shadowDX * th * 1.1, yb + th * 0.12], [x * w + th * 0.1, yb + th * 0.1]], P.hedge, { op: 0.4, wob: 0.3 });
      SC.tree(x * w, yb + 1, th, { kind: i % 3 === 1 ? 'round' : 'oak', leaf: P.tree, trunk: P.trunk, depth: 1 - t, seed: 20 + i });
    });
    // sheep with legs; they graze somewhere else each time (at dusk they huddle by the hedge)
    D.sheep.forEach(([x, t], i) => {
      const sx = x * w, sy = cy(sx, t) - 2 - (i % 3) * 2, k = 0.6 + t * 0.9, d = i % 2 ? 1 : -1;
      const wool = dusk ? '#c8c2dc' : '#ffffff';
      [-3, -1, 1.6, 3.4].forEach((lx) => line([[sx + lx * k, sy + 2 * k], [sx + lx * k, sy + 5 * k]], Math.max(0.8, 1.1 * k), { color: INK, taper: [0, 0] }));
      shape(I.ell(sx, sy, 5 * k, 3.4 * k, 10), wool, { w: 1 });
      I.fill(I.ell(sx + d * 4.6 * k, sy - 1 + (dusk ? 1 : (i % 2) * 1.5), 1.9 * k, 1.6 * k, 6), INK, { wob: 0 });
    });
  });
  // the road
  const rp = roadPath(w, h);
  const poly = rp.L.concat(rp.R.slice().reverse());
  I.fill(poly, P.road, { wob: 0.2 });
  I.clipPoly(poly, () => { line(rp.c.filter(([, y]) => y > h * 0.62), 2, { color: P.roadEdge, op: 0.7, taper: [0.1, 0.9] }); });
  const edge = (pts) => { const run = pts.filter((p) => p[1] < h * 1.05); line(run, 1.6, { color: INK, taper: [0.02, 0.5], wob: 0.3 }); };
  edge(rp.L); edge(rp.R);
  for (let i = 0; i < rp.c.length; i += 9) { const [, y] = rp.c[i]; if (y > h * 0.55) { const k = rp.hw(y) / 30; SC.tuft(rp.L[i][0], rp.L[i][1] + 1, k * 1.1, { color: P.hedge, seed: i }); SC.tuft(rp.R[i][0], rp.R[i][1] + 1, k, { color: P.hedge, seed: i + 1 }); } }
  // the inn on the crest: smoke at dawn, dark windows by day, lit at dusk
  cottage(w * 0.6, h * 0.162, h / 300, P, { lit: D.lit, smoke: D.smoke });
  // birds
  D.birds.forEach(([x, y], i) => { const k = 1 + (i % 2) * 0.3; line([[x * w - 5 * k, y * h - 2 * k], [x * w - 1, y * h + 1], [x * w + 5 * k, y * h - 2.5 * k]], 1.3, { taper: [0.3, 0.3] }); });
  // the walkers (higher each time)
  SPK.hill = hillFigs(D.t, w, h, P, { halo: dusk, yaw: D.faceUs ? 55 : undefined });
  // foreground: wall, gatepost and an open five-bar gate, a post-and-rail fence, the fingerpost, the oak
  const wood = dusk ? '#6a5a7a' : '#a07a52', stoneC = dusk ? '#7a7494' : '#d2c6a6';
  SC.stoneWall(-10, h + 6, w * 0.14, h * 0.15, { color: stoneC, h1: h * 0.12, seed: 2, cope: true, course: 9 });
  const gp = w * 0.13;
  const gx0 = gp - 4, gx1 = w * 0.045, gt = h * 0.8, gb = h * 0.955;
  for (let k = 0; k < 5; k++) { const t = k / 4; line([[gx0, lerp(gt, gb, t)], [gx1, lerp(gt + 6, gb - 2, t)]], 2.6, { color: INK, taper: [0, 0] }); line([[gx0, lerp(gt, gb, t)], [gx1, lerp(gt + 6, gb - 2, t)]], 1.4, { color: wood, taper: [0, 0] }); }
  [[gx0, gt, gx0, gb], [gx1, gt + 6, gx1, gb - 2], [gx0, gb, gx1, gt + 6]].forEach(([a, b, c, d]) => { line([[a, b], [c, d]], 3.4, { color: INK, taper: [0, 0] }); line([[a, b], [c, d]], 1.8, { color: wood, taper: [0, 0] }); });
  cel(I.rectPts(gp, h * 0.74, 7, h * 0.3), wood, { w: 1.5, lin: true, k: 0.5 });
  const fp = [w * 0.33, h * 0.985];
  cel(I.rectPts(fp[0] - 3, fp[1] - h * 0.3, 6, h * 0.3), wood, { w: 1.4, lin: true, k: 0.4 });
  const arm = [[fp[0] - 2, fp[1] - h * 0.29], [fp[0] + 44, fp[1] - h * 0.31], [fp[0] + 52, fp[1] - h * 0.285], [fp[0] + 44, fp[1] - h * 0.255], [fp[0] - 2, fp[1] - h * 0.24]];
  shape(arm, dusk ? '#c9c0d8' : '#f4ecd8', { w: 1.4, lin: true });
  I.text(fp[0] + 11, fp[1] - h * 0.256, 'INN', { font: 'Letter', size: 9.5, color: INK, rot: -2 });
  I.fill([[-20, h + 20], [-20, h * 0.97], [w * 0.2, h * 0.99], [w * 0.5, h * 0.965], [w + 20, h * 0.95], [w + 20, h + 20]], P.fg, { wob: 0.5 });
  line([[-20, h * 0.97], [w * 0.2, h * 0.99], [w * 0.5, h * 0.965], [w + 20, h * 0.95]], 1.4, { color: INK, op: 0.6 });
  SC.grass({ x: 0, y: h * 0.95, w, h: h * 0.06 }, { n: 14, color: shade(P.fg, 0.4), seed: 5 });
  SC.tree(w * 0.985, h * 1.04, h * 1.25, { kind: 'oak', leaf: P.fgTree, trunk: mix(P.trunk, '#000000', 0.25), seed: 9 });
}

// ---------------------------------------------------------------- local figure helpers
// (the engine now draws skirts at negative yaw: the old mirrored-figure workaround is gone)
const figM = F.fig;
// Grandad seen from behind: the engine draws the hair under the cap as a flat white band. Use a bald
// back of the head (hair = skin) and add the white fringe that shows under the cap.
const GDB = { ...C.grandad, head: { ...C.grandad.head, hair: C.grandad.head.skin } };
// the face lead has fixed the back of the head in zp/head.js: use the real design (GDB restores the workaround)
const GDX = C.grandad;
function gdFringe(r, yaw, tintC) {
  const R = r.R, [hx, hy] = r.headC;
  const k = Math.abs(Math.cos((yaw - 180) * Math.PI / 180));
  const off = Math.sin((180 - yaw) * Math.PI / 180) * R * 0.35;
  const x0 = hx - R * 0.7 * k + off, x1 = hx + R * 0.7 * k + off, y0 = hy - R * 0.22;
  const pts = [[x0, y0 - R * 0.04]];
  for (let i = 0; i <= 7; i++) { const t = i / 7; pts.push([lerp(x0, x1, t), y0 + R * (0.07 + 0.04 * Math.sin(t * Math.PI)) + (i % 2 ? R * 0.045 : 0)]); }
  pts.push([x1, y0 - R * 0.04]);
  shape(pts, tintC ? mix('#eeeae4', tintC[0], tintC[1]) : '#eeeae4', { w: Math.max(0.8, R / 40) });
  // two creases at the nape
  [0.42, 0.52].forEach((dy) => line([[hx + off - R * 0.2, hy + R * dy], [hx + off + R * 0.2, hy + R * dy + R * 0.02]], Math.max(0.7, R / 45), { op: 0.6 }));
}

// a balloon placed close to its speaker so the tail stays short (about 30-40 px): dx shifts the balloon
// sideways in units of its half-width (-1 = to the left of the mouth), up = gap above the mouth
function near(w, h, lines, tgt, dx = 0, o = {}) {
  const size = o.size || 15, lh = size * 1.2;
  const tw = Math.max(...lines.map((l) => PG.textW(l, size))), th = lines.length * lh;
  const a = tw / 2 * 1.16 + 14, b = th / 2 * 1.3 + 10;
  let cx = tgt[0] + dx * a, cy = tgt[1] - (o.up ?? 34) - b + (o.dy || 0);
  cx = clamp(cx, a + 8, w - a - 8); cy = clamp(cy, b + 8, h - b - 8);
  return PG.balloon(cx, cy, lines, tgt[0], tgt[1], { bend: 0.35, ...o });
}

// ---------------------------------------------------------------- title
function credits(x, y, runs) {
  I.emit(`<text x="${x}" y="${y}" font-family="Letter" font-size="13" letter-spacing="2">${runs.map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, ' ')}</tspan>`).join('')}</text>`);
}
function title(y0) {
  // one rising line, like the road
  PG.sfx(112, y0 + 150, 'UP-HILL', { size: 118, color: '#d8453b', anchor: 'start', rot: -9, sw: 3.4, ls: 4 });
  credits(118, y0 + 196, [['WORDS BY ', INK], ['CHRISTINA ROSSETTI', '#d8453b'], ['      ART BY ', INK], ['CLAUDE', '#3f6e4a']]);
  // spot: the whole journey in a roundel: the hill at dusk, the road winding up, the inn's window lit
  const cx = 830, cy = y0 + 112, R = 92;
  I.clipPoly(I.ell(cx, cy, R, R, 48), () => {
    const P = TIMES.dusk, w = 2 * R, h = 2 * R, ox = cx - R, oy = cy - R;
    I.grp(`translate(${ox} ${oy})`, () => {
      SC.sky(w, h, P.skyTop, P.skyLow);
      SC.stars(w, h * 0.35, 10, '#fff3cf', { seed: 2 });
      const hp = [[-10, h + 10], ...HILLP.map(([x, y]) => [x * w, (0.2 + y * 0.9) * h]), [w + 10, h + 10]];
      shape(hp, P.hill, { w: 1.6 });
      I.clipPoly(hp, () => I.fill([[w * 0.64, 0], [w + 20, h * 0.5], [w + 20, h + 20], [w * 0.8, h + 20]], P.hillSh, { op: 0.7 }));
      const rc = I.sample(ROADC.map(([x, y]) => [x * w, (0.2 + y * 0.9) * h]), false, 3);
      I.ink(rc, 5.5, { color: INK, wob: 0, taper: [0, 0.8] }); I.ink(rc, 3.4, { color: P.road, wob: 0, taper: [0, 0.8] });
      cottage(w * 0.6, (0.2 + 0.162 * 0.9) * h, 0.62, P, { lit: 2 });
    });
  });
  I.ink(I.ell(cx, cy, R, R, 48), 3.2, { closed: true, wob: 0.3 });
}

// ---------------------------------------------------------------- panels
// tail anchor at a speaker's mouth (front and 3/4 views) or the side of the head (back views)
function mouthOf(r) {
  const hyw = r.headYaw ?? r.yaw ?? 45; const R = r.R, ay = Math.abs(hyw);
  if (ay > 100) return [r.headC[0], r.headC[1] - R * 0.2];
  return [r.headC[0] + r.dir * R * 0.55 * Math.abs(Math.sin((hyw * Math.PI) / 180)), r.headC[1] + R * 0.42];
}
function p1(w, h) { hillPanel(w, h, TIMES.dawn, { day: HILLDAY.dawn }); }
function p1post(w, h) {
  const rr = SPK.hill[3];
  near(w, h, ['DOES THE ROAD WIND', 'UP-HILL ALL THE WAY?'], mouthOf(rr.b), -0.45, { up: 64 });
  near(w, h, ['YES, TO THE', 'VERY END.'], mouthOf(rr.a), 1.6, { up: -10 });
}

// ---------------------------------------------------------------- 2: noon, hand in hand up the lane
function p2(w, h) {
  const P = TIMES.noon;
  SC.sky(w, h, P.skyTop, P.skyLow);
  SC.cloud(w * 0.42, h * 0.3, 20, '#ffffff', { seed: 8 });
  const far = SC.hills(w, h * 0.66, h * 0.06, P.far, { seed: 31, n: 2, bottom: h + 20, depth: 0.5, shade: 0.05 });
  SC.treeline(far, { h: h * 0.05, leaf: mix(P.hedge, P.skyLow, 0.35), depth: 0.6, seed: 32, gaps: 0.2, spikes: 0.1 });
  // far: the hill with the inn, where they are going (same silhouette as panels 1/3/5, small)
  const hx = w * 0.64, hw = w * 0.42, hy = h * 0.62, hh = h * 0.3;
  const hp = [[hx - 20, hy + 40], ...HILLP.map(([x, y]) => [hx + x * hw, hy - hh + y * hh * 1.1])];
  hp.push([hx + hw + 40, hy + 40]);
  shape(hp, mix(TIMES.dawn.hill, P.skyLow, 0.45), { w: 1.2 });
  const ib = [hx + 0.6 * hw, hy - hh + 0.162 * hh * 1.1];
  cottage(ib[0], ib[1], 0.38, { inn: mix('#f4e8d0', P.skyLow, 0.3), roof: mix('#c0574a', P.skyLow, 0.3) });
  // near field behind the wall
  I.fill([[-20, h * 0.66], [w + 20, h * 0.6], [w + 20, h + 20], [-20, h + 20]], P.hill, { wob: 0.4 });
  SC.tree(w * 0.14, h * 0.64, h * 0.42, { kind: 'oak', leaf: '#4f8c40', seed: 41 });
  // the dry-stone wall along the far side of the lane (the lane climbs gently to the right)
  SC.stoneWall(-10, h * 0.76, w + 20, h * 0.11, { color: P.wall, seed: 42, cope: false, course: 11 });
  // the lane
  const lane = [[-20, h * 0.76], [w + 20, h * 0.76], [w + 20, h + 20], [-20, h + 20]];
  I.fill(lane, P.road, { wob: 0.3 });
  line([[-20, h * 0.765], [w + 20, h * 0.745]], 1.4, { color: INK, op: 0.7 });
  [[0.06, 0.86], [0.3, 0.84], [0.72, 0.87], [0.9, 0.82]].forEach(([x, y]) => line([[w * x, h * y], [w * x + 14, h * y + 0.5]], 1.2, { color: shade(P.road, 0.3) }));
  // near verge with a few flowers
  I.fill([[-20, h * 0.95], [w * 0.4, h * 0.965], [w + 20, h * 0.94], [w + 20, h + 20], [-20, h + 20]], '#7fb862', { wob: 0.4 });
  line([[-20, h * 0.95], [w * 0.4, h * 0.965], [w + 20, h * 0.94]], 1.3, { color: INK, op: 0.6 });
  line([[-20, h * 0.86], [w * 0.3, h * 0.855], [w * 0.7, h * 0.87], [w + 20, h * 0.86]], 2, { color: shade(P.road, 0.18), op: 0.8 });
  SC.grass({ x: 0, y: h * 0.955, w, h: h * 0.05 }, { n: 10, color: '#3f7a34', seed: 43 });
  const r = F.duo.handInHand(C.grandad, C.isla, { x: w * 0.52, y: h * 0.94, s: 0.62, yaw: 60, stickA: true, phaseA: 0.14, phaseC: 0.6,
    a: { head: { yaw: 30, pitch: -6, look: [-0.8, 0.5], mood: 'joy', mouth: 'flat' } }, c: { x: w * 0.52 - 50, head: { yaw: 40, pitch: 10, look: [0.5, -0.9], mood: 'neutral', mouth: 'o' } } });
  // tall verge grass in the extreme foreground, crossing their shins
  SC.grass({ x: w * 0.28, y: h * 1.0, w: w * 0.5, h: h * 0.02 }, { n: 9, color: '#3f7a34', seed: 44, sMin: 2.2, sMax: 3.4 });
  SC.flower(w * 0.9, h * 0.98, 1.2, { kind: 'daisy' }); SC.flower(w * 0.94, h * 0.99, 1, { kind: 'daisy' }); SC.flower(w * 0.04, h * 0.99, 1.1, { kind: 'poppy', color: '#e0503a' });
  SPK.p2 = { isla: mouthOf(r.b), gd: mouthOf(r.a) };
}
function p2post(w, h) {
  near(w, h, ["WILL THE DAY'S JOURNEY", 'TAKE THE WHOLE LONG DAY?'], SPK.p2.isla, -0.7, { up: 60 });
  near(w, h, ['FROM MORN TO', 'NIGHT, MY FRIEND.'], SPK.p2.gd, 1.25, { up: -24 });
}

// ---------------------------------------------------------------- 2b: insert, her fist round his finger
function p2b(w, h) {
  // a flat ground with a soft sunburst: ZP inserts drop the background
  I.rect(-2, -2, w + 4, h + 4, '#cfe8b2');
  PG.rays(w * 0.5, h * 0.62, 20, w * 1.2, 16, '#dff0c8', 3, { spread: 0.09 });
  const gs = C.grandad.head.skin, is = C.isla.head.skin;
  // his hand hangs relaxed, back of the hand to us, fingers down; she holds two of his fingers in her fist
  const sG = P2B.sG, angG = P2B.ang;
  const wx = w * P2B.wx, wy = h * 0.2;
  const knit = C.grandad.top.color;
  const Hn = hand(wx, wy, angG, sG, P2B.pose, { skin: gs, age: 0.9, flip: P2B.flip });
  // his knitted cuff over the wrist: ribbing, a turned edge, a fold
  const cuffPts = [[wx - 62, -30], [wx + 64, -30], [wx + 58, wy + 18], [wx + 30, wy + 26], [wx - 20, wy + 26], [wx - 52, wy + 20]];
  cel(cuffPts, knit, { w: LW.contour, k: 2 });
  for (let k = 0; k < 9; k++) { const x = wx - 48 + k * 12.5; line([[x, wy + 22 - Math.abs(k - 4) * 1.2], [x + 1, wy - 14]], 1.3, { color: shade(knit, 0.45) }); }
  line([[wx - 56, wy - 16], [wx + 60, wy - 20]], 2, { color: shade(knit, 0.5) });
  // the two fingers she holds: index and middle, from the knuckles along the finger direction
  const fg = P2B.fingers.map(([u, v]) => Hn.T([u, v]));
  const gc = [(fg[0][0] + fg[1][0]) / 2, (fg[0][1] + fg[1][1]) / 2];
  const ua = [Math.cos(angG * Math.PI / 180), Math.sin(angG * Math.PI / 180)];
  const a = angG - 90 + P2B.rot;
  const sI = P2B.sI;
  const wr = [gc[0] - 10.9 * sI * Math.cos(a * Math.PI / 180), gc[1] - 10.9 * sI * Math.sin(a * Math.PI / 180)];
  // her red coat sleeve from the left: cuff band and a fold
  const cf = wr;
  cel([[-30, cf[1] - 40], [cf[0] - 6, cf[1] - 30], [cf[0] + 2, cf[1] + 28], [-30, cf[1] + 50]], C.isla.top.color, { w: LW.contour, k: 2 });
  shape([[cf[0] - 22, cf[1] - 32], [cf[0] - 4, cf[1] - 31], [cf[0] + 4, cf[1] + 29], [cf[0] - 14, cf[1] + 32]], C.isla.top.collar, { w: LW.detail });
  line([[-10, cf[1] + 12], [cf[0] - 46, cf[1] + 4], [cf[0] - 34, cf[1] - 10]], 1.6, { color: shade(C.isla.top.color, 0.45) });
  const fingers = () => {
    I.clipPoly(I.ell(gc[0] + ua[1] * sI, gc[1], sI * 4.2, sI * 4.6, 24), () => fg.forEach((p) => limb([[p[0] - ua[0] * 80, p[1] - ua[1] * 80], [p[0] + ua[0] * 80, p[1] + ua[1] * 80]], [2.25 * sG * 0.5, 2.25 * sG * 0.5], gs, { w: 2.6 })));
  };
  hand(wr[0], wr[1], a, sI, 'grip', { skin: is, child: true, object: fingers, flip: P2B.flipI });
}
const P2B = { sG: 11.5, ang: 96, wx: 0.6, pose: 'relaxed', flip: false, fingers: [[11.7, -1.75], [12.1, -0.55]], rot: 0, sI: 8.4, flipI: true };

// ---------------------------------------------------------------- 4: on the wall, sharing a sandwich
function p4(w, h) {
  const P = TIMES.after;
  SC.sky(w, h, P.skyTop, P.skyLow);
  SC.sun(w * 0.07, h * 0.36, 26, '#fff2c4', { glow: '#fff2c4' });
  SC.cloud(w * 0.52, h * 0.16, 22, P.clouds, { seed: 51 });
  const far = SC.hills(w, h * 0.62, h * 0.07, P.far, { seed: 52, n: 2, bottom: h + 20, depth: 0.5, shade: 0.06 });
  SC.treeline(far, { h: h * 0.05, leaf: mix(P.tree, P.skyLow, 0.35), depth: 0.6, seed: 53, gaps: 0.18 });
  I.fill([[-20, h * 0.68], [w * 0.5, h * 0.66], [w + 20, h * 0.69], [w + 20, h + 20], [-20, h + 20]], P.hill, { wob: 0.4 });
  SC.tree(w * 0.9, h * 0.72, h * 0.7, { kind: 'oak', leaf: P.tree, trunk: P.trunk, seed: 54 });
  // the wall, its shadow and their long shadows falling right, away from the low sun
  const wy = h * 0.93, wh = h * 0.27, wx0 = -20, ww = w * 0.86;
  I.fill([[wx0, wy], [wx0 + ww, wy], [wx0 + ww + 60, h + 20], [wx0 + 30, h + 20]], '#6a5a2a', { op: 0.22, lin: true });
  const top = wy - wh;
  SC.stoneWall(wx0, wy, ww, wh, { color: P.wall, seed: 55, cope: false, moss: 0.3 });
  // the wall's flat top (seen from a little above): the seat
  cel([[wx0, top + 2], [wx0 + ww, top + 2], [wx0 + ww - 4, top - 11], [wx0, top - 11]], mix(P.wall, '#fff6d8', 0.25), { w: LW.detail, lin: true, k: 0.6 });
  for (let x = wx0 + 30; x < wx0 + ww; x += 38 + (x % 17)) line([[x, top - 10], [x - 3, top + 1]], 1.1, { color: shade(P.wall, 0.4) });
  I.fill([[-20, wy], [w + 20, wy - 4], [w + 20, h + 20], [-20, h + 20]], mix(P.hill, '#c9a54a', 0.2), { wob: 0.3 });
  line([[-20, wy + 1], [w + 20, wy - 3]], 1.2, { color: INK, op: 0.5 });
  SC.grass({ x: 0, y: wy, w, h: h - wy }, { n: 12, color: P.hedge, seed: 56 });
  const seat = top - 5;
  // his stick leans against the wall: foot on the grass, crook hooked over the top edge
  const sb = [w * 0.745, wy + 10], st = [w * 0.715, top - 6];
  line([sb, st], 5.6, { taper: [0, 0], minW: 1 }); line([sb, st], 3.2, { color: '#8a5a33', taper: [0, 0], minW: 1 });
  const crook = [st, [st[0] - 3, st[1] - 9], [st[0] - 12, st[1] - 10], [st[0] - 16, st[1] - 3]];
  line(crook, 5.6, { taper: [0, 0.1] }); line(crook, 3.2, { color: '#8a5a33', taper: [0, 0.1] });
  const T = tint(P);
  const ri = F.fig(C.isla, F.POSES.sitWall(C.isla, { x: w * 0.44, y: seat, s: 1.0, yaw: 50, tint: T, legN: [-10, 18, 14], legF: [6, 34, 2], reachN: 'thighN', bendN: 1, handN: 'hold', holdN: 'sandwich', handAngN: -20, head: { yaw: 40, pitch: 10, look: [0.8, -0.7], mood: 'worried', mouth: 'flat' } }));
  const rg = F.fig(C.grandad, F.POSES.sitWall(C.grandad, { x: w * 0.6, y: seat, s: 1.0, yaw: -52, offer: true, tint: T, head: { yaw: -42, pitch: -4, look: [-0.8, 0.3], mood: 'joy', mouth: 'flat' } }));
  SPK.p4 = { isla: mouthOf(ri), gd: [rg.headC[0] - rg.R * 0.7, rg.headC[1] + rg.R * 0.2] };
}
function p4post(w, h) {
  near(w, h, ['BUT IS THERE FOR THE NIGHT', 'A RESTING-PLACE?'], SPK.p4.isla, -0.8, { up: 34 });
  near(w, h, ['A ROOF FOR WHEN THE', 'SLOW DARK HOURS BEGIN.'], SPK.p4.gd, 1.35, { up: -30 });
}

// ---------------------------------------------------------------- 6: Isla, close: the dark wood behind
function p6(w, h) {
  const P = TIMES.dusk;
  SC.sky(w, h, '#4a3f84', '#e8907a', { mid: 1 });
  const back = '#3a3468', front = '#1a1834';
  [[0.02, 0.5, 0.9], [0.22, 0.56, 0.8], [0.4, 0.6, 0.7], [0.8, 0.62, 0.8]].forEach(([x, y, k], i) => SC.tree(w * x, h * (y + 0.5), h * k * 1.1, { kind: i % 2 ? 'pine' : 'oak', leaf: back, leafShade: shade(back, 0.2), trunk: back, seed: 60 + i }));
  [[-0.06, 1.1, 1.4], [0.18, 1.12, 1.2]].forEach(([x, y, k], i) => SC.tree(w * x, h * y, h * k, { kind: 'oak', leaf: front, leafShade: '#100f22', trunk: front, seed: 70 + i }));
  const T = P.tint;
  const coat = mix(C.isla.top.color, T[0], 0.3), collar = mix(C.isla.top.collar, T[0], 0.3);
  const cx = w * 0.64;
  cel([[cx - 170, h + 20], [cx - 150, h * 0.88], [cx - 60, h * 0.8], [cx + 70, h * 0.8], [cx + 170, h * 0.9], [cx + 190, h + 20]], coat, { w: LW.contour, k: 2.5 });
  HD.head(F.tinted(C.isla, T[0], 0.16).head, { x: cx, y: h * 0.5, s: 3.4, yaw: -52, pitch: 6, look: [-1, -0.1], mood: 'worried', mouth: 'wobble' });
  // the collar over the neck, then her hand clutching it
  shape([[cx - 52, h * 0.83], [cx - 16, h * 0.93], [cx + 4, h * 0.855], [cx - 22, h * 0.81]], collar, { w: LW.contour });
  shape([[cx + 56, h * 0.83], [cx + 22, h * 0.93], [cx + 4, h * 0.855], [cx + 30, h * 0.81]], collar, { w: LW.contour });
  line([[cx + 4, h * 0.86], [cx + 6, h + 10]], 1.6, { color: shade(coat, 0.45) });
  shape(I.ell(cx + 12, h * 0.97, 6, 6, 10), '#f2c230', { w: LW.detail });
  // her hand pulling the collar tight at her chin
  hand(cx - 96, h + 30, -62, 6.6, 'clutch', { skin: mix(C.isla.head.skin, T[0], 0.16), child: true, flip: true });
  PG.ticks(cx - 8, h * 0.18, 56, 3, -160, -110, 12);
  SPK.p6 = [cx - 50, h * 0.62];
}
function p6post(w, h) { PG.balloon(w * 0.28, h * 0.16, ['MAY NOT THE DARKNESS', 'HIDE IT FROM MY FACE?'], w * 0.45, h * 0.64, { size: 13.5, bend: 0.3 }); }

// ---------------------------------------------------------------- 7: he crouches and points at the window
function p7(w, h) {
  const P = TIMES.dusk;
  SC.sky(w, h, P.skyTop, '#e89a82', { mid: 1 });
  SC.stars(w, h * 0.35, 14, '#fff3cf', { seed: 3 });
  const crest = [[w * 0.36, h + 20], [w * 0.46, h * 0.62], [w * 0.62, h * 0.42], [w * 0.8, h * 0.33], [w + 20, h * 0.32], [w + 20, h + 20]];
  shape(crest, '#50508a', { w: SC.BG });
  cottage(w * 0.82, h * 0.34, 1.05, P, { lit: 2 });
  I.fill([[-20, h * 0.8], [w * 0.5, h * 0.76], [w + 20, h * 0.72], [w + 20, h + 20], [-20, h + 20]], P.fg, { wob: 0.4 });
  line([[-20, h * 0.8], [w * 0.5, h * 0.76], [w + 20, h * 0.72]], 1.5, { color: INK, op: 0.7 });
  SC.grass({ x: 0, y: h * 0.8, w, h: h * 0.2 }, { n: 9, color: '#2e2f58', seed: 82 });
  const T = tint(P);
  const rg = F.fig(C.grandad, F.POSES.crouchPoint(C.grandad, { x: w * 0.3, y: h * 0.95, s: 0.98, yaw: 50, stick: { far: true, lean: 4 }, tint: T, head: { yaw: 40, pitch: 12, look: [0.6, -0.8], mood: 'joy', mouth: 'flat' } }));
  // Isla, hands clasped at her chest, looks where he points
  const ir = F.rig(C.isla, { x: w * 0.13, y: h * 0.97, s: 0.98, yaw: 40 });
  F.fig(C.isla, { ...F.POSES.stand(C.isla, { x: w * 0.13, y: h * 0.97, s: 0.98, yaw: 40 }), curve: -6, lean: -4, reachN: [ir.shN[0] + 50, ir.shN[1] + 10], bendN: 1, handN: 'clutch', reachF: [ir.shF[0] + 14, ir.shF[1] + 30], bendF: 1, handF: 'clutch', tint: T, head: { yaw: 45, pitch: 14, look: [0.7, -1], mood: 'surprise', mouth: 'o' } });
  SPK.p7 = mouthOf(rg);
}
function p7post(w, h) { near(w, h, ['YOU CANNOT', 'MISS THAT INN.'], SPK.p7, 0.3, { size: 14.5, up: 50 }); }

// ---------------------------------------------------------------- 8: night, the others on the road ahead
function lantern(x, y, s, o = {}) {
  // a hand lantern hanging from (x, y): bail, cap, glass, base; with a glow and a pool of light below
  if (o.glow !== false) PG.glow(x, y + 12 * s, (o.gr || 60) * s, o.gc || '#ffcf6a', o.go ?? 0.6);
  line([[x, y], [x, y + 4 * s]], 1.1 * Math.max(0.7, s), { color: o.ink || INK, taper: [0, 0] });
  shape([[x - 4 * s, y + 4 * s], [x + 4 * s, y + 4 * s], [x + 5 * s, y + 7 * s], [x - 5 * s, y + 7 * s]], o.metal || '#2a2440', { w: 0.9 * Math.max(0.7, s), lin: true });
  shape([[x - 4 * s, y + 7 * s], [x + 4 * s, y + 7 * s], [x + 4.6 * s, y + 17 * s], [x - 4.6 * s, y + 17 * s]], '#ffd873', { w: 0.9 * Math.max(0.7, s), lin: true });
  I.fill(I.ell(x, y + 12.5 * s, 1.8 * s, 3 * s, 8), '#fff6d0', { wob: 0 });
  shape([[x - 5.4 * s, y + 17 * s], [x + 5.4 * s, y + 17 * s], [x + 4.4 * s, y + 20 * s], [x - 4.4 * s, y + 20 * s]], o.metal || '#2a2440', { w: 0.9 * Math.max(0.7, s), lin: true });
}
function p8(w, h) {
  const P = TIMES.night;
  SC.sky(w, h, P.skyTop, '#46528e');
  SC.stars(w, h * 0.55, 110, '#fff3cf', { seed: 8 });
  SC.moon(w * 0.78, h * 0.13, 22, '#fff3c4', P.skyTop, { glow: '#fff3c4' });
  // far ridge, then the long hill the road climbs, cresting against the sky on the right
  SC.hills(w, h * 0.6, h * 0.1, '#323d72', { seed: 81, n: 2, bottom: h + 20, w: 0, shade: 0.06 });
  const ridge = [[-20, h + 20], [-20, h * 0.66], [w * 0.3, h * 0.58], [w * 0.6, h * 0.46], [w * 0.8, h * 0.38], [w + 20, h * 0.34], [w + 20, h + 20]];
  shape(ridge, P.hill, { w: SC.BG });
  // hedges and a few trees along the ridge in silhouette
  SC.tree(w * 0.52, h * 0.5, h * 0.2, { kind: 'oak', leaf: P.hedge, trunk: P.hedge, seed: 82 });
  SC.tree(w * 0.97, h * 0.36, h * 0.3, { kind: 'poplar', leaf: P.hedge, trunk: P.hedge, seed: 83 });
  // the road: wide at our feet, climbing away to the crest (perspective)
  const cL = [[w * 0.02, h + 20], [w * 0.26, h * 0.8], [w * 0.5, h * 0.62], [w * 0.72, h * 0.49], [w * 0.9, h * 0.4], [w + 20, h * 0.355]];
  const hw = (y) => lerp(4, 150, clamp((y - h * 0.35) / (h * 0.7), 0, 1) ** 1.25);
  const smp = I.sample(cL, false, 4);
  const L = smp.map(([x, y]) => [x - hw(y) * 0.35, y - hw(y) * 0.55]), R = smp.map(([x, y]) => [x + hw(y) * 0.35, y + hw(y) * 0.55]);
  I.fill(L.concat(R.slice().reverse()), P.road, { wob: 0.2 });
  line(L, 1.5, { taper: [0.02, 0.6] }); line(R, 1.5, { taper: [0.02, 0.6] });
  // the wayfarers: all different, spaced unevenly along the road, smaller as they climb; each lantern
  // throws a warm pool on the road. The nearest one turns back to look at the two of them.
  // real colours pushed deep into the night (not flat silhouettes), so each one keeps its form and clothes
  const night = (t) => ['#121838', 0.5 + t * 0.3];
  const GL = [[70, '#ffd27a', 0.65], [48, '#ffb45a', 0.55], [62, '#ffe39a', 0.5], [40, '#ff9f4a', 0.6], [56, '#ffcf6a', 0.45], [44, '#ffd88a', 0.55], [52, '#ffc060', 0.5]];
  const lamp = (k, g = GL[0]) => (T, s, A) => { const c = T(A.c); lantern(c[0], c[1] - 2 * k, k, { gr: g[0], gc: g[1], go: g[2] }); };
  const folk = [
    { t: 0.4, s: 0.6, who: { H: 3.5, head: { face: 'granny', skin: '#e8b890', hair: '#e2ded6', hairStyle: 'bun', R: 26, age: 0.8 }, top: { color: '#7a8aa0', sleeve: 'long', type: 'coat' }, bottom: { type: 'pants', color: '#4a3a5a' }, shoes: '#2a2230' }, yaw: -35, arm: 'N', raise: true, head: -40 },
    { t: 0.5, s: 0.5, who: { H: 3.9, build: 1.2, head: { face: 'bearded', skin: '#c89070', hair: '#5a4a3a', hairStyle: 'short', R: 26, beard: '#5a4a3a', hat: { type: 'cap', color: '#4a4050' } }, top: { color: '#8a5a3a', sleeve: 'long', type: 'coat' }, bottom: { type: 'pants', color: '#3a3f58' }, shoes: '#2a2230' }, yaw: 62, arm: 'F', staff: true, head: 128, lean: 8 },
    { t: 0.6, s: 0.41, who: { H: 3.4, head: { face: 'woman', skin: '#f0c9a8', hair: '#8a6a50', hairStyle: 'long', R: 26 }, top: { color: '#6f9a6a', sleeve: 'long' }, bottom: { type: 'dress', color: '#6f9a6a' }, shoes: '#2a2230' }, yaw: 58, arm: 'F', head: 20, lean: 2, child: { H: 2.6, head: { face: 'girl', skin: '#b9825e', hair: '#2a1f24', hairStyle: 'pigtails', R: 24, blush: 1 }, top: { color: '#e0b24a', sleeve: 'long' }, bottom: { type: 'skirt', color: '#8a4a6a' }, shoes: '#2a2230' } },
    { t: 0.72, s: 0.31, who: { H: 3.8, head: { face: 'oldman', skin: '#8a5a3e', hair: '#e6e2da', hairStyle: 'short', hairline: -1.1, R: 26, age: 0.9, moustache: '#e6e2da' }, top: { color: '#8a5a8a', sleeve: 'long' }, bottom: { type: 'pants', color: '#3a3f58' }, shoes: '#2a2230' }, yaw: 66, arm: 'N', lean: 12 },
    { t: 0.8, s: 0.21, who: { H: 3.6, head: { skin: '#e0b090', hair: '#3a2a22', hairStyle: 'short', R: 26, hat: { type: 'cap', color: '#3a3a4a' } }, top: { color: '#4a6a9a', sleeve: 'long', type: 'coat' }, bottom: { type: 'pants', color: '#2a2e44' }, shoes: '#2a2230' }, yaw: 60, arm: 'N', lean: -2 },
    { t: 0.88, s: 0.16, who: { H: 3.5, head: { skin: '#c8906a', hair: '#1a1418', hairStyle: 'bun', R: 26 }, top: { color: '#a0463e', sleeve: 'long' }, bottom: { type: 'dress', color: '#a0463e' }, shoes: '#2a2230' }, yaw: 60, arm: 'F' },
    { t: 0.94, s: 0.12, who: { H: 3.7, head: { skin: '#e8b890', hair: '#6a5040', hairStyle: 'short', R: 26 }, top: { color: '#5a7a5a', sleeve: 'long' }, bottom: { type: 'pants', color: '#2a2e44' }, shoes: '#2a2230' }, yaw: 60, arm: 'N' },
  ];
  const at = (t) => smp[Math.min(smp.length - 1, Math.round(t * (smp.length - 1)))];
  folk.slice().reverse().forEach((f, j) => {
    const [x, y] = at(f.t);
    const tn = night(clamp((f.t - 0.4) * 1.4, 0, 1));
    const walk = f.raise ? F.POSE.stand() : F.POSE.walk([0.05, 0.3, 0.55, 0.8, 0.15, 0.65, 0.4][j]);
    const g = GL[j];
    const base = { ...walk, x, y, s: f.s, yaw: f.yaw, lean: f.lean ?? 4, tint: tn, shadow: false, head: { yaw: f.head ?? f.yaw, mood: 'joy', mouth: 'smile' } };
    const rr = F.rig(f.who, base);
    const hand = f.arm === 'N' ? 'N' : 'F';
    const sh = hand === 'N' ? rr.shN : rr.shF;
    const u = 2.25 * 26 * f.s;
    const grip = f.raise ? [sh[0] - u * 0.35, sh[1] - u * 0.35] : [sh[0] + (f.yaw > 90 ? -1 : 1) * u * 0.3, sh[1] + u * 0.6];
    // the lantern's pool of light on the road, under the lantern, sized by distance
    I.fill(I.ell(grip[0], y + 1, g[0] * 1.5 * f.s, g[0] * 0.25 * f.s, 16), g[1], { op: 0.18 + g[2] * 0.2, wob: 0 });
    const pose = { ...base, ['reach' + hand]: grip, ['bend' + hand]: 1, ['hand' + hand]: 'grip', ['hold' + hand]: lamp(f.s * 2.1, g), ['handAng' + hand]: 90 };
    if (f.staff) Object.assign(pose, { stick: { far: false, lean: 4 } });
    if (f.child) {
      const cx = x - u * 0.8, cy2 = y + 3 * f.s;
      const cr = F.rig(f.child, { ...F.POSE.walk(0.6), x: cx, y: cy2, s: f.s, yaw: 60 });
      I.fill(I.ell(cx + u * 0.3, cy2 + 1, 70 * f.s, 12 * f.s, 16), '#ffcf6a', { op: 0.3, wob: 0 });
      F.fig(f.child, { ...F.POSE.walk(0.6), x: cx, y: cy2, s: f.s, yaw: 60, tint: tn, shadow: false, reachN: [cr.shN[0] + u * 0.3, cr.shN[1] + u * 0.4], bendN: 1, handN: 'grip', holdN: lamp(f.s * 1.6, GL[6]), handAngN: 90, head: { yaw: 40, pitch: 8, look: [0.5, -0.8], mood: 'joy' } });
    }
    F.fig(f.who, pose);
  });
  // foreground: dark bracken banks either side frame the bottom
  [[-0.04, 1.02, 0.5], [1.02, 1.04, 0.4]].forEach(([x, y, k], i) => SC.bush(w * x, h * y, w * 0.26, h * k, { leaf: '#101634', seed: 90 + i }));
  // Isla and Grandad from behind, hand in hand, bottom left, catching the lantern light
  const T = ['#1b2350', 0.3];
  const r = F.duo.handInHand(GDX, C.isla, { x: w * 0.22, y: h * 1.08, s: 0.9, yaw: 148, stickA: true, phaseA: 0.1, phaseC: 0.55, a: { tint: T, head: { yaw: 156, pitch: 8 } }, c: { tint: T, head: { yaw: 135, pitch: 10 } } });
  if (GDX === GDB) gdFringe(r.a, 156, T);
  SPK.p8 = { isla: [r.b.headC[0], r.b.headC[1] - r.b.R * 1.1], gd: [r.a.headC[0], r.a.headC[1] - r.a.R * 1.2] };
}
function p8post(w, h) {
  near(w, h, ['SHALL I MEET OTHER', 'WAYFARERS AT NIGHT?'], SPK.p8.isla, -0.2, { up: 160 });
  near(w, h, ['THOSE WHO HAVE', 'GONE BEFORE.'], SPK.p8.gd, 1.3, { up: -30 });
}

// ---------------------------------------------------------------- 9: carried up the last steps
function p9(w, h) {
  const P = TIMES.night;
  SC.sky(w, h, P.skyTop, P.skyLow);
  SC.stars(w, h * 0.45, 40, '#fff3cf', { seed: 9 });
  // closer: the last steps and the inn's door at the top right; the frame crops him at the thighs
  PG.glow(w * 0.9, h * 0.45, 200, '#ffc864', 0.55);
  shape([[w * 0.62, h + 20], [w * 0.62, h * 0.06], [w * 0.8, -10], [w + 20, -10], [w + 20, h + 20]], '#3c4270', { w: LW.detail, lin: true });
  for (let r = 0; r < 14; r++) for (let c = 0; c < 4; c++) { const y0 = h * 0.08 + r * 22, x0 = w * 0.63 + c * 34 + (r % 2) * 16; shape(I.rectPts(x0, y0, 30, 18), mix('#3c4270', '#ffc864', 0.05 + c * 0.05), { w: 0.9, lin: true }); }
  const ddx = w * 0.72, ddw = w * 0.24, ddh = h * 0.46, dtop = h * 0.7;
  shape(I.rectPts(ddx - 8, dtop - ddh - 8, ddw + 16, ddh + 8), '#6a6488', { w: LW.detail, lin: true });
  I.rect(ddx - 2, dtop - ddh - 2, ddw + 4, ddh + 2, '#ffd27a');
  SC.door(ddx, dtop - ddh, ddw, ddh, '#6a4a3a', { frame: '#6a6488', knob: '#e0b64a', glass: '#ffd27a' });
  lantern(ddx - 18, dtop - ddh - 2, 1.9);
  line([[w * 0.62, dtop - ddh - 4], [ddx - 18, dtop - ddh - 4]], 2.2);
  // the top steps, lit toward the door
  for (let k = 3; k >= 0; k--) {
    const y0 = dtop + (3 - k) * h * 0.1, x0 = w * 0.5 - (3 - k) * w * 0.14;
    shape([[x0, y0], [w + 30, y0], [w + 30, y0 + h * 0.1], [x0, y0 + h * 0.1]], mix('#3a4070', '#8a7a78', 0.4 - k * 0.08), { w: LW.fine, lin: true });
    shape([[x0 - 4, y0 - 8], [w + 30, y0 - 8], [w + 30, y0], [x0, y0]], mix('#4a5288', '#c8a680', 0.6 - (3 - k) * 0.12), { w: LW.fine, lin: true });
  }
  const T = ['#1b2350', 0.2];
  const r = F.duo.piggyBack(GDX, C.isla, { x: w * 0.36, y: h * 1.3, s: 1.3, yaw: 30, a: { lean: 24, tint: T, head: { yaw: 26, pitch: 4, look: [0.6, -0.3], mood: 'joy', mouth: 'smile' } }, c: { tint: T, head: { yaw: 20, pitch: -2, look: [0.8, -0.1], mood: 'sleepy', mouth: 'o' } } });
  SPK.p9 = { isla: mouthOf(r.b), gd: mouthOf(r.a) };
}
function p9post(w, h) {
  near(w, h, ['THEN MUST I KNOCK, OR', 'CALL WHEN JUST IN SIGHT?'], SPK.p9.isla, 0.2, { size: 13.5, up: 50 });
  near(w, h, ['THEY WILL NOT KEEP YOU', 'STANDING AT THAT DOOR.'], SPK.p9.gd, 0.6, { size: 13.5, up: -150 });
}

// ---------------------------------------------------------------- 10: the door opens
function p10(w, h) {
  const wall = '#3a4070';
  I.rect(-2, -2, w + 4, h + 4, wall);
  // stone front: big irregular blocks
  SC.stoneWall(-20, h + 20, w + 40, h + 60, { color: '#4a5288', seed: 101, cope: false, course: 30 });
  // the doorway: a deep stone reveal, lintel and step
  const dx = w * 0.36, dy = h * 0.1, dw = w * 0.5, dh = h * 0.7;
  shape([[dx - 26, dy + dh + 6], [dx - 26, dy - 26], [dx + dw + 26, dy - 26], [dx + dw + 26, dy + dh + 6]], '#6a6488', { w: LW.detail, lin: true });
  shape(I.rectPts(dx - 34, dy - 40, dw + 68, 24), '#7a7496', { w: LW.detail, lin: true });
  I.clipRect(dx, dy, dw, dh, () => {
    // the room inside: warm wall, a hearth with a fire at the back, hosts in the doorway
    I.rect(dx, dy, dw, dh, '#f6c98a');
    I.rect(dx, dy + dh * 0.78, dw, dh * 0.22, '#c98a58');
    PG.glow(dx + dw * 0.72, dy + dh * 0.62, dw * 0.8, '#fff0c2', 0.8);
    shape(I.rectPts(dx + dw * 0.56, dy + dh * 0.36, dw * 0.36, dh * 0.44), '#b86a44', { w: LW.fine, lin: true });
    shape(I.rectPts(dx + dw * 0.62, dy + dh * 0.5, dw * 0.24, dh * 0.3), '#3a2018', { w: LW.fine, lin: true });
    [[0, 1], [-10, 0.7], [11, 0.8]].forEach(([ox, k]) => shape([[dx + dw * 0.74 + ox - 11 * k, dy + dh * 0.8], [dx + dw * 0.74 + ox - 7 * k, dy + dh * 0.7], [dx + dw * 0.74 + ox, dy + dh * 0.6 + (1 - k) * 20], [dx + dw * 0.74 + ox + 6 * k, dy + dh * 0.71], [dx + dw * 0.74 + ox + 11 * k, dy + dh * 0.8]], k === 1 ? '#ffb13a' : '#ffdb6a', { w: LW.fine }));
    // the open door leaf, swung in against the left of the reveal
    cel([[dx, dy], [dx + dw * 0.16, dy + dh * 0.05], [dx + dw * 0.16, dy + dh * 0.96], [dx, dy + dh]], '#8a5a3a', { w: LW.detail, lin: true, k: 1 });
    // the lanterns of those who went before, hung on pegs along the back wall
    [0.08, 0.2, 0.32, 0.44].forEach((x, i) => { line([[dx + dw * x - 6, dy + dh * 0.2], [dx + dw * x + 6, dy + dh * 0.2]], 2.4); lantern(dx + dw * x, dy + dh * 0.2, 1.5, { glow: i % 2 === 0 }); });
    // the hosts are the wayfarers from the road (same people, same clothes), now in the light
    const lampH = (k) => (T, s, A) => { const c = T(A.c); lantern(c[0], c[1] - 2 * k, k, { glow: false }); };
    const folk = [
      { who: { H: 3.5, head: { face: 'granny', skin: '#e8b890', hair: '#e2ded6', hairStyle: 'bun', R: 23, age: 0.8 }, top: { color: '#7a8aa0', sleeve: 'long', type: 'coat' }, bottom: { type: 'pants', color: '#4a3a5a' }, shoes: '#2a2230' }, x: 0.52, s: 0.92, yaw: -28, pose: { armN: [52, 36, 26], armF: [44, 44, 30], handN: 'open', handF: 'open' }, head: { yaw: -32, pitch: 4, mood: 'joy', mouth: 'smile' } },
      { who: { H: 3.9, build: 1.2, head: { face: 'bearded', skin: '#c89070', hair: '#5a4a3a', hairStyle: 'short', R: 23, beard: '#5a4a3a', hat: { type: 'cap', color: '#4a4050' } }, top: { color: '#8a5a3a', sleeve: 'long', type: 'coat' }, bottom: { type: 'pants', color: '#3a3f58' }, shoes: '#2a2230' }, x: 0.74, s: 0.9, yaw: -14, lampUp: true, head: { yaw: -20, pitch: 4, mood: 'joy', mouth: 'smile' } },
      { who: { H: 2.6, head: { face: 'girl', skin: '#b9825e', hair: '#2a1f24', hairStyle: 'pigtails', R: 21, blush: 1 }, top: { color: '#e0b24a', sleeve: 'long' }, bottom: { type: 'skirt', color: '#8a4a6a' }, shoes: '#2a2230' }, x: 0.3, s: 0.9, yaw: 30, pose: { armN: [118, 20, 30], handN: 'wave' }, head: { yaw: 26, pitch: 6, mood: 'joy', mouth: 'laugh' } },
      { who: { H: 3.8, head: { face: 'oldman', skin: '#8a5a3e', hair: '#e6e2da', hairStyle: 'short', hairline: -1.1, R: 23, age: 0.9, moustache: '#e6e2da', browCol: '#e6e2da' }, top: { color: '#8a5a8a', sleeve: 'long' }, bottom: { type: 'pants', color: '#3a3f58' }, shoes: '#2a2230' }, x: 0.93, s: 0.86, yaw: -40, pose: { armN: [8, 22, 8], armF: [6, 22, 8] }, head: { yaw: -40, mood: 'joy', mouth: 'smile' } },
    ];
    const fy = dy + dh + 2;
    [folk[1], folk[3], folk[2], folk[0]].forEach((f) => {
      const base = { ...F.POSE.stand(), x: dx + dw * f.x, y: fy, s: f.s, yaw: f.yaw, head: f.head, shadow: false };
      if (f.lampUp) { const rr = F.rig(f.who, base); Object.assign(base, { reachN: [rr.shN[0] - 26, rr.shN[1] - 16], bendN: 1, handN: 'grip', holdN: lampH(1.9), handAngN: 90, armF: [8, 24, 8] }); }
      figM(f.who, { ...base, ...(f.pose || {}) });
    });
  });
  line([[dx, dy], [dx, dy + dh], [dx + dw, dy + dh], [dx + dw, dy]], LW.detail, { taper: [0, 0] });
  // step and the light falling out of the door across the ground and onto the two of them
  shape([[dx - 40, dy + dh + 6], [dx + dw + 40, dy + dh + 6], [dx + dw + 54, dy + dh + 22], [dx - 54, dy + dh + 22]], '#8a84a4', { w: LW.detail, lin: true });
  I.fill([[dx - 54, dy + dh + 22], [dx + dw + 54, dy + dh + 22], [w + 40, h + 20], [-60, h + 20]], '#4a4a70', { lin: true });
  I.fill([[dx, dy + dh + 22], [dx + dw, dy + dh + 22], [w * 0.95, h + 20], [w * 0.05, h + 20]], '#ffcf6a', { op: 0.35, lin: true });
  const warm = ['#ff9a3a', 0.2];
  const r = F.duo.handInHand(GDX, C.isla, { x: w * 0.33, y: h * 1.16, s: 1.12, yaw: 150, stickA: true, phaseA: 0.02, phaseC: 0.5, a: { tint: warm, head: { yaw: 150, pitch: 4, mood: 'smile' } }, c: { x: w * 0.33 - 86, tint: warm, head: { yaw: 128, pitch: 6, look: [0.6, -0.3], mood: 'sleepy' } } });
  if (GDX === GDB) gdFringe(r.a, 150, warm);
  // the inn's sign over the step, on an iron bracket
  const bx0 = -6, by0 = h * 0.3;
  line([[bx0, by0], [bx0 + 70, by0]], 3); line([[bx0, by0 + 24], [bx0 + 34, by0]], 2);
  line([[bx0 + 20, by0], [bx0 + 20, by0 + 10]], 1.4); line([[bx0 + 62, by0], [bx0 + 62, by0 + 10]], 1.4);
  cel(I.rectPts(bx0 + 12, by0 + 10, 58, 32), '#c0574a', { w: LW.detail, lin: true, k: 0.6 });
  I.text(bx0 + 41, by0 + 33, 'INN', { font: 'Title', size: 18, color: '#fff3cf', anchor: 'middle' });
  SPK.p10 = { isla: mouthOf(r.b), gd: mouthOf(r.a) };
}
function p10post(w, h) {
  PG.balloon(w * 0.24, 38, ['SHALL I FIND COMFORT,', 'TRAVEL-SORE AND WEAK?'], SPK.p10.isla[0] - 20, SPK.p10.isla[1] - 10, { size: 13.5, bend: 0.3 });
  PG.balloon(w * 0.76, 38, ['OF LABOUR YOU SHALL', 'FIND THE SUM.'], ...SPK.p10.gd, { size: 13.5, bend: -0.3 });
}

// ---------------------------------------------------------------- 11: splash, beds for all who come
function p11(w, h) {
  // the room by candlelight: warm near the candle, cool at the edges; moonlight through the window
  const wall = '#8a6a8a', floor = '#6e5460';
  I.rect(-2, -2, w + 4, h + 4, wall);
  for (let x = 14; x < w; x += 44) I.fill(I.rectPts(x, 0, 14, h), '#9a78a0', { op: 0.35, lin: true, wob: 0 });
  PG.glow(w * 0.5, h * 0.6, w * 0.55, '#ffc98a', 0.6);
  const fy = h * 0.8;
  I.rect(-2, fy, w + 4, h - fy + 4, floor);
  for (let k = -6; k < 16; k++) line([[w * 0.5 + k * 70, fy], [w * 0.5 + k * 120, h + 4]], 1.2, { color: shade(floor, 0.3), taper: [0, 0] });
  line([[-4, fy], [w + 4, fy]], LW.detail, { taper: [0, 0] });
  // window with curtains
  SC.windowFrame(w * 0.42, h * 0.1, w * 0.24, h * 0.34, { sky: '#1c2656', frame: '#e8dcc4', curtains: '#6a5a9a', sill: true, view: (x, y, ww, hh) => { SC.stars(ww + x, hh + y, 60, '#fff3cf', { x0: x, y0: y }); SC.moon(x + ww * 0.7, y + hh * 0.3, 20, '#fff3c4', '#1c2656'); } });
  // a picture on the wall: the hill
  SC.frame(w * 0.2, h * 0.14, 90, 64, '#a07a52', (x, y, ww, hh) => { I.rect(x, y, ww, hh, '#fdf1d2'); shape([[x, y + hh], [x, y + hh * 0.7], [x + ww * 0.5, y + hh * 0.2], [x + ww, y + hh * 0.6], [x + ww, y + hh]], '#9fd083', { w: 1 }); });
  // the bed, head to the left: headboard, rail, mattress, pillow; Isla's head on the pillow, the quilt over her
  const T = ['#2b2f58', 0.12];
  const bx = w * 0.07, bw = w * 0.44, mt = fy - h * 0.19;
  const wood = '#8a5a3a';
  cel([[bx - 16, fy], [bx - 16, mt - 100], [bx - 8, mt - 118], [bx + 10, mt - 118], [bx + 16, mt - 100], [bx + 16, fy]], wood, { w: LW.line, k: 1 });
  line([[bx - 6, mt - 96], [bx - 6, mt - 10]], 1.4, { color: shade(wood, 0.4) });
  cel(I.rectPts(bx + bw, mt - 44, 18, fy - mt + 44), wood, { w: LW.line, lin: true, k: 1 });
  cel(I.rectPts(bx + 10, mt + 28, bw - 10, 34), wood, { w: LW.line, lin: true, k: 1 });
  shape(I.rectPts(bx + 22, mt + 62, 12, fy - mt - 62), shade(wood, 0.2), { w: LW.detail, lin: true });
  shape(I.rectPts(bx + bw - 22, mt + 62, 12, fy - mt - 62), shade(wood, 0.2), { w: LW.detail, lin: true });
  cel(I.rectPts(bx + 12, mt, bw - 14, 30), '#f4efe4', { w: LW.detail, lin: true, k: 0.8 });
  cel([[bx + 16, mt + 4], [bx + 20, mt - 30], [bx + 60, mt - 40], [bx + 116, mt - 34], [bx + 124, mt - 4], [bx + 80, mt + 6]], '#ffffff', { w: LW.detail, k: 1 });
  line([[bx + 40, mt - 18], [bx + 70, mt - 12]], 1.2, { color: '#c8c0d8' });
  const hx = bx + 74, hy = mt - 36;
  I.grp(`rotate(-62 ${I.n1(hx)} ${I.n1(hy)})`, () => HD.head(F.tinted(C.isla, T[0], T[1]).head, { x: hx, y: hy, s: 1.3, yaw: 18, pitch: -4, blink: true, mood: 'shut', mouth: 'smile' }));
  // the quilt: a patchwork grid bent over the mound of her body, then hanging straight over the mattress edge
  const topC = I.sample([[bx + 100, mt - 4], [bx + 122, mt - 38], [bx + 168, mt - 56], [bx + 222, mt - 50], [bx + 268, mt - 36], [bx + 320, mt - 42], [bx + bw - 20, mt - 30], [bx + bw + 6, mt - 14]], false, 4);
  const topY = (x) => SC.yAt(topC, x);
  const qx0 = bx + 100, qx1 = bx + bw + 6, edgeY = mt + 18, hemY = mt + 60;
  // (u, v): u across the bed, v from the top line (0) to the mattress edge (0.62) and down to the hem (1)
  const Q = (u, v) => { const x = lerp(qx0, qx1, u); if (v <= 0.62) return [x - (1 - v / 0.62) * 4, lerp(topY(x), edgeY, v / 0.62)]; return [x + (v - 0.62) * 8, lerp(edgeY, hemY, (v - 0.62) / 0.38)]; };
  const qc = ['#d8453b', '#f2c230', '#3f6e4a', '#f6e8c2', '#5a86c4', '#e07a3a'];
  const NU = 12, NV = 5, vs = [0, 0.2, 0.42, 0.62, 0.81, 1];
  const outline = [];
  for (let i = 0; i <= 24; i++) outline.push(Q(i / 24, 0));
  outline.push(Q(1, 0.62)); for (let i = 24; i >= 0; i--) outline.push(Q(i / 24, 1)); outline.push(Q(0, 0.62));
  const qp = I.wobble(outline, 0.3);
  I.clipPoly(qp, () => {
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const u0 = i / NU, u1 = (i + 1) / NU, v0 = vs[j], v1 = vs[j + 1];
      const cell = [Q(u0, v0), Q((u0 + u1) / 2, v0), Q(u1, v0), Q(u1, v1), Q((u0 + u1) / 2, v1), Q(u0, v1)];
      I.fill(cell, qc[(i * 2 + j * 5) % qc.length], { lin: true, wob: 0 });
      line([Q(u0, v0), Q(u0, (v0 + v1) / 2), Q(u0, v1)], 0.9, { color: '#fff8e8', op: 0.55, taper: [0, 0] });
    }
    for (let j = 1; j < NV; j++) { const row = []; for (let i = 0; i <= 24; i++) row.push(Q(i / 24, vs[j])); line(row, 0.9, { color: '#fff8e8', op: 0.55, taper: [0, 0] }); }
    // shadow: the hanging part and the far side of the mound (away from the candle)
    const hang = []; for (let i = 0; i <= 24; i++) hang.push(Q(i / 24, 0.64)); for (let i = 24; i >= 0; i--) hang.push(Q(i / 24, 1.02));
    I.fill(hang, '#2a1e3a', { op: 0.3, lin: true });
    I.fill([[bx + 110, mt - 8], [bx + 150, mt - 46], [bx + 168, mt - 50], [bx + 140, mt + 8]], '#2a1e3a', { op: 0.18 });
  });
  I.ink(qp, LW.detail, { closed: true, wob: 0, vary: 0.15 });
  const fold = []; for (let i = 0; i <= 24; i++) fold.push(Q(i / 24, 0.62)); line(fold, LW.fine);
  // the rag rug and her wellies by the bed
  shape(I.ell(w * 0.56, h * 0.92, w * 0.16, h * 0.045, 20), '#b0664a', { w: LW.detail });
  I.ink(I.ell(w * 0.56, h * 0.92, w * 0.12, h * 0.03, 20), 1.2, { closed: true, color: '#e0a060', wob: 0 });
  // bedside table with the candle
  const tx = w * 0.56;
  SC.table(tx - 34, fy - 74, 68, 74, '#7a4e32', { vp: [w * 0.5, fy - 700] });
  PG.glow(tx, fy - 110, 150, '#ffcf6a', 0.7);
  I.fill(I.ell(tx, fy + 40, 220, 50, 30), '#ffcf6a', { op: 0.18, wob: 0 });
  shape(I.rectPts(tx - 6, fy - 110, 12, 30), '#f6f1e6', { w: LW.detail, lin: true });
  shape([[tx, fy - 128], [tx + 6, fy - 116], [tx, fy - 110], [tx - 6, fy - 116]], '#ffcf5a', { w: LW.fine });
  // Grandad asleep in the armchair, cap on his knee, stick against the chair
  const ax = w * 0.8, ay = fy - 70;
  cel([[ax - 90, fy], [ax - 96, ay - 150], [ax - 60, ay - 170], [ax + 60, ay - 170], [ax + 96, ay - 150], [ax + 90, fy]], '#9a4a4a', { w: LW.line, k: 1.4 });
  cel([[ax - 80, ay + 4], [ax + 80, ay + 4], [ax + 84, fy - 4], [ax - 84, fy - 4]], '#843e3e', { w: LW.detail });
  cel([[ax - 104, ay - 40], [ax - 70, ay - 44], [ax - 70, fy], [ax - 104, fy]], '#aa5656', { w: LW.detail });
  cel([[ax + 104, ay - 40], [ax + 70, ay - 44], [ax + 70, fy], [ax + 104, fy]], '#aa5656', { w: LW.detail });
  const noCap = { ...C.grandad, head: { ...C.grandad.head, hat: null } };
  const rg0 = F.rig(noCap, { ...F.POSES.armchairAsleep(noCap, { x: ax, y: ay, s: 1.1 }), reachN: undefined, reachF: undefined });
  const belly = rg0.spineAt(0.3);
  const rg = F.fig(noCap, F.POSES.armchairAsleep(noCap, { x: ax, y: ay, s: 1.1, tint: T, reachN: [belly[0] - 6, belly[1] + 4], reachF: [belly[0] + 10, belly[1] + 8], bendN: 1, bendF: 1, handN: 'rest', handF: 'rest', armOver: true }));
  // his cap on his knee
  const kn = rg.legN[1];
  const capC = mix(C.grandad.head.hat.color, T[0], T[1]);
  const cx0 = kn[0] - 6, cy0 = kn[1] - 8;
  cel([[cx0 - 24, cy0 + 2], [cx0 - 22, cy0 - 12], [cx0 - 6, cy0 - 20], [cx0 + 14, cy0 - 17], [cx0 + 22, cy0 - 6], [cx0 + 20, cy0 + 3]], capC, { w: LW.detail, k: 0.8 });
  cel([[cx0 + 16, cy0 - 4], [cx0 + 38, cy0 + 2], [cx0 + 36, cy0 + 7], [cx0 + 14, cy0 + 5]], shade(capC, 0.15), { w: LW.detail, k: 0.4 });
  line([[cx0 - 22, cy0 - 2], [cx0 + 18, cy0 - 1]], 1.3, { color: shade(capC, 0.45) });
  line([[cx0 - 6, cy0 - 19], [cx0 + 2, cy0 - 3]], 1.1, { color: shade(capC, 0.45) });
  line([[ax + 100, ay - 150], [ax + 130, fy]], 5.6, { taper: [0, 0], minW: 1 });
  line([[ax + 100, ay - 150], [ax + 130, fy]], 3, { color: '#8a5a33', taper: [0, 0], minW: 1 });
  const hc = rg.headC;
  I.text(hc[0] + 30, hc[1] - 40, 'z', { font: 'Title', size: 22, color: '#fff3e0' });
  I.text(hc[0] + 48, hc[1] - 62, 'z', { font: 'Title', size: 28, color: '#fff3e0' });
  [[ax - 150, 0], [ax - 128, 4]].forEach(([x, o]) => shape([[x, fy + 30 + o], [x, fy - 10 + o], [x + 14, fy - 10 + o], [x + 14, fy + 18 + o], [x + 28, fy + 22 + o], [x + 28, fy + 30 + o]], '#f2c230', { w: LW.detail, lin: true }));
}
function p11post(w, h) {
  PG.caption(40, 40, ['WILL THERE BE BEDS', 'FOR ME AND ALL WHO SEEK?'], { style: 'plain', size: 18, color: '#fff3e0', italic: true });
  const cw = PG.textW('YEA, BEDS FOR ALL WHO COME.', 24) + 28;
  PG.caption((w - cw) / 2, h - 88, ['YEA, BEDS FOR ALL WHO COME.'], { style: 'box', size: 24, fill: '#fff6e4', attrib: '– CHRISTINA ROSSETTI' });
}

// ---------------------------------------------------------------- page
const BORDER = { border: 2.2 };
function page() {
  title(20);
  let y = 250;
  const G = PG.GUT_V;
  const HILL_H = 300;
  let r;
  r = PG.row(y, HILL_H, [1]); PG.panel(r[0], null, p1, p1post, BORDER); y += HILL_H + G;
  r = PG.row(y, 300, [1.7, 1]); PG.panel(r[0], null, p2, p2post, BORDER); PG.panel(r[1], null, p2b, null, BORDER); y += 300 + G;
  r = PG.row(y, HILL_H, [1]); PG.panel(r[0], null, (w, h) => hillPanel(w, h, TIMES.after, { day: HILLDAY.after }), null, BORDER); y += HILL_H + G;
  r = PG.row(y, 300, [1]); PG.panel(r[0], null, p4, p4post, BORDER); y += 300 + G;
  r = PG.row(y, HILL_H, [1]); PG.panel(r[0], null, (w, h) => hillPanel(w, h, TIMES.dusk, { day: HILLDAY.dusk }), null, BORDER); y += HILL_H + G;
  r = PG.row(y, 310, [1, 1.35]); PG.panel(r[0], null, p6, p6post, BORDER); PG.panel(r[1], null, p7, p7post, BORDER); y += 310 + G;
  r = PG.row(y, 360, [1]); PG.panel(r[0], null, p8, p8post, BORDER); y += 360 + G;
  r = PG.row(y, 420, [1, 1.25]); PG.panel(r[0], null, p9, p9post, BORDER); PG.panel(r[1], null, p10, p10post, BORDER); y += 420 + G;
  const SH = 620;
  r = PG.row(y, SH, [1]); PG.panel(r[0], null, p11, p11post, BORDER); y += SH;
  H = y + 70;
  PG.text(PG.MARGIN, H - 34, '“Up-Hill” by Christina Rossetti, from Goblin Market and Other Poems (1862). A homage to Zen Pencils by Gavin Aung Than.', { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 34, 'No. 1', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
}
page();
const out = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'up-hill.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
console.log('wrote', H);
