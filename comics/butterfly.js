// THE BUTTERFLY — Chuang Tzu, tr. Herbert A. Giles (1889). A Zen-Pencils-style strip drawn in code.
// node comics/butterfly.js -> out/the-butterfly.svg   (RECTS=path writes the panel rectangles as JSON)
//
// Colour script: grey-teal office at 3 a.m. (one pool of monitor light) -> the dream in saturated
// tropical colour -> pale dawn gold when he wakes. Repetition: the tie's yellow dots on blue, then the
// butterfly's wings, then the dust on his fingertips.
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, LW, line, shape, cel, shade } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const { hand } = require('../zp/hand');

I.seed(1889);
SC.setSeed(1889);
const W = 980;
const mix = F.mix;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const L2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const D = Math.PI / 180;
// seeded local rng so re-ordering drawing code does not reshuffle every panel
function rngOf(seed) { let s = seed >>> 0 || 1; const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; r.pm = (a) => (r() * 2 - 1) * a; r.range = (a, b) => a + r() * (b - a); return r; }

const TIE = '#2f5fa8', DOT = '#f2c230';
const WING = { field: '#2f63b4', inner: '#5d95dc', edge: '#294f8c', dot: DOT, vein: '#1b2f55' };

// ---- Mr Chen: 40s, white shirt, loosened blue tie with yellow dots, tired eyes ----------------------
function tie(r, o = {}) {
  if (Math.abs(r.yaw) > 95) return;
  const n = r.neck, dir = r.dir, u = r.unit;
  const knot = [n[0] + dir * u * 0.1 * r.turn, n[1] + u * 0.12];
  // o.fly: angle (deg) the blade swings from hanging straight down (+ = toward the character's back)
  const a = ((o.fly || 0) * D) * -dir, Lb = u * 0.84;
  const ax = [Math.sin(a), Math.cos(a)], nx = [ax[1], -ax[0]];
  const at = (t, k) => [knot[0] + ax[0] * Lb * t + nx[0] * u * k, knot[1] + ax[1] * Lb * t + nx[1] * u * k];
  const bend = (o.fly ? 0.06 : 0);
  const bl = [at(0, -0.045), at(0, 0.045), at(0.5, 0.06 + bend), at(0.88, 0.085), at(1, 0), at(0.88, -0.07), at(0.5, -0.05 + bend)];
  shape(bl, TIE, { w: LW.fine, cel: { k: 0.4 } });
  [[0.22, 0], [0.42, 0.03], [0.6, -0.02], [0.78, 0.02]].forEach(([t, dx]) => { const p = at(t, dx + bend * t); I.fill(I.ell(p[0], p[1], u * 0.024, u * 0.024, 8), DOT, { wob: 0 }); });
  shape(I.ell(knot[0], knot[1], u * 0.055, u * 0.045, 10), TIE, { w: LW.fine });
}
const chen = {
  H: 3.7, build: 1.02,
  head: { face: 'chen', bags: 0.35, skin: '#f0cfa8', hair: '#1f1a1c', hairStreak: '#4a5a78', hairStyle: 'short', hairline: 0.2, napeLevel: 0.3, R: 27, tall: 1.12, jaw: 1.2, jawW: 0.66, age: 0.35, browThick: 1.1 },
  top: { color: '#f4f4f0', sleeve: 'long', collar: '#ffffff', details: (r) => tie(r) },
  bottom: { type: 'pants', color: '#3d4458' }, shoes: '#2a2224',
};
const SKIN = chen.head.skin;

// ---- the butterfly --------------------------------------------------------------------------------
// butterfly(x, y, s, o): (x,y) = thorax, s = scale (forewing span ~ 34 s px).
//   o.open 0..1 (wings seen edge-on .. flat open), o.rot (deg), o.tilt (-1..1: turns the body so one
//   pair of wings foreshortens), o.pal (colour set), o.under (show the paler underside), o.lw (pen),
//   o.proboscis (curl it down), o.glow (soft halo). The pen is in page px, never scaled.
function butterfly(x, y, s, o = {}) {
  const pal = { ...WING, ...(o.pal || {}) };
  const open = o.open ?? 0.85, rot = (o.rot || 0) * D, tilt = o.tilt || 0;
  const pen = o.lw ?? clamp(0.9 + s * 0.4, 1.0, 1.9);
  const fine = Math.max(0.7, pen * 0.5);
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const T = ([u, v]) => [x + (u * cr - v * sr) * s, y + (u * sr + v * cr) * s];
  // wing side sd: -1 left, +1 right; foreshortening per side
  const kx = (sd) => sd * (0.12 + 0.88 * open) * (1 - tilt * sd * 0.45);
  const fore = (sd) => [[0.6, -3], [4, -9], [10, -16], [18, -22], [27, -26], [33, -25.5], [34.5, -22], [32, -15], [27, -8], [20, -3], [10, 0.5], [2, 0.5]].map(([u, v]) => [u * kx(sd), v]);
  const hind = (sd) => [[1, 0], [9, 0], [18, 3], [23.5, 9], [24, 16], [20, 23], [15, 27], [12, 32], [9.5, 27], [5, 21], [1.5, 11]].map(([u, v]) => [u * kx(sd), v]);
  const inner = (pts, k) => pts.map(([u, v]) => [u * k, v * k + (1 - k) * 2]);
  const halo = o.glow;
  if (halo) glowFlat(x, y, 46 * s, halo, 0.55);
  const wing = (pts, sd, up) => {
    const P = pts.map(T);
    const field = o.under ? mix(pal.field, '#ffffff', 0.35) : pal.field;
    shape(P, pal.edge, { w: pen, wob: 0.15 });
    I.clipPoly(P, () => {
      I.fill(inner(pts, 0.8).map(T), field, { wob: 0 });
      I.fill(inner(pts, 0.5).map(T), o.under ? mix(pal.inner, '#ffffff', 0.4) : pal.inner, { wob: 0 });
      // veins fanning out from the root
      if (s > 0.55) {
        const vs = up ? [[12, -15], [22, -22], [30, -20], [28, -10], [18, -4]] : [[16, 5], [21, 13], [16, 23], [11, 26]];
        vs.forEach(([u, v]) => line([T([1 * kx(sd), up ? -1 : 1]), T([u * kx(sd) * 0.92, v * 0.92])], fine, { color: pal.vein, taper: [0.1, 0.5], op: 0.7 }));
      }
      // the tie's dots: a row along the edge band and a pair in the field
      const dots = up ? [[29, -21.5, 1.9], [24.5, -23.5, 1.6], [31, -15, 1.6], [19, -12, 2.6], [13, -8, 1.8]] : [[20, 18, 1.9], [16, 23.5, 1.6], [21, 11, 1.5], [12, 12, 2.4]];
      dots.forEach(([u, v, r]) => I.fill(I.ell(...T([u * kx(sd), v]), Math.max(0.9, r * s * Math.max(0.35, Math.abs(kx(sd)))), Math.max(0.9, r * s), 10, rot), pal.dot, { wob: 0 }));
    });
  };
  const sides = o.side ? [1] : tilt > 0 ? [-1, 1] : [1, -1]; // far pair first
  if (o.side) { // wings raised together, seen from the side: the far pair peeks out behind
    const far = (pts) => pts.map(([u, v]) => [u * 0.96, v + 2.5]);
    I.grp('', () => { wing(far(hind(1)), 1, false); wing(far(fore(1)), 1, true); }, ' opacity="0.9"');
  }
  sides.forEach((sd) => { wing(hind(sd), sd, false); wing(fore(sd), sd, true); });
  // body: head, furry thorax, tapering abdomen
  const body = I.ell(...T([0, 7]), 2.1 * s, 9.5 * s, 12, rot);
  shape(body, '#1c1a24', { w: pen * 0.7, wob: 0.1 });
  shape(I.ell(...T([0, -1]), 2.9 * s, 4 * s, 12, rot), '#26222e', { w: pen * 0.7, wob: 0.1 });
  shape(I.ell(...T([0, -5.6]), 2.2 * s, 2.1 * s, 10, rot), '#1c1a24', { w: pen * 0.7, wob: 0.1 });
  if (s > 0.7) for (let i = 1; i < 5; i++) line([T([-1.6, 3 + i * 2.4]), T([1.6, 3.4 + i * 2.4])], fine * 0.8, { color: '#5a5670', taper: [0.2, 0.2] });
  // antennae with clubbed tips
  [-1, 1].forEach((sd) => {
    const a = [[0.6 * sd, -7], [3 * sd * (0.4 + 0.6 * open), -13], [5.5 * sd * (0.4 + 0.6 * open), -17.5]].map(T);
    line(a, fine * 1.1, { taper: [0, 0], wob: 0.1 });
    I.fill(I.ell(a[2][0], a[2][1], Math.max(0.9, 0.9 * s), Math.max(0.9, 1.2 * s), 8, rot), INK, { wob: 0 });
  });
  if (o.side) [[-2, 2], [1, 3], [4, 2.5]].forEach(([v, d]) => line([T([-1.5, v]), T([-1.5 - d, v - 1]), T([-1.5 - d - 1.5, v + 0.5])], fine, { taper: [0, 0.3], wob: 0.05 }));
  if (o.proboscis) line([T([0, -7.5]), T([1.5, -10]), T([3, -9]), T(o.proboscis)], fine, { taper: [0, 0.2], wob: 0.1 });
  return T;
}

// light as one flat, irregular shape (ZP paints light as a flat shape, not concentric rings)
function glowFlat(x, y, r, col, op = 0.5) {
  const rr = rngOf(Math.round(x * 7 + y * 13 + r));
  const pts = []; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const k = rr.range(0.78, 1.08); pts.push([x + Math.cos(a) * r * 0.75 * k, y + Math.sin(a) * r * 0.62 * k]); }
  I.fill(pts, col, { wob: r * 0.02, op: Math.min(0.3, op * 0.45) });
}

// ---- one-point perspective camera for the office -----------------------------------------------------
// X right, Y up (m), Z depth (m). vp = vanishing point, f = focal length (px), h = eye height (m)
function camera(vx, vy, f, h) {
  const P = (X, Y, Z) => [vx + (X * f) / Z, vy + ((h - Y) * f) / Z];
  P.k = (Z) => f / Z; P.h = h; P.vx = vx; P.vy = vy; P.f = f;
  P.pen = (Z, w = 2.1) => clamp((w * 3.2) / Z, 0.8, w);
  return P;
}
// axis-aligned box; draws the faces the camera can see, silhouette heavier than inner edges
function box3(P, x0, x1, y0, y1, z0, z1, col, o = {}) {
  const c = (X, Y, Z) => P(X, Y, Z);
  const f = [c(x0, y0, z0), c(x1, y0, z0), c(x1, y1, z0), c(x0, y1, z0)];
  const faces = [];
  if (y1 < P.h) faces.push([[c(x0, y1, z0), c(x1, y1, z0), c(x1, y1, z1), c(x0, y1, z1)], o.top || mix(col, '#ffffff', 0.12)]);
  if (y0 > P.h) faces.push([[c(x0, y0, z0), c(x1, y0, z0), c(x1, y0, z1), c(x0, y0, z1)], o.bottom || shade(col, 0.3)]);
  if (x0 > 0) faces.push([[c(x0, y0, z0), c(x0, y1, z0), c(x0, y1, z1), c(x0, y0, z1)], o.side || shade(col, 0.22)]);
  if (x1 < 0) faces.push([[c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1), c(x1, y0, z1)], o.side || shade(col, 0.22)]);
  const w = o.w ?? P.pen(z0);
  faces.forEach(([pts, fc]) => I.fill(pts, fc, { lin: true, wob: 0 }));
  if (o.front !== false) I.fill(f, col, { lin: true, wob: 0 });
  if (o.frontFn) I.clipPoly(f, () => o.frontFn(f));
  const all = faces.flatMap(([p]) => p).concat(f);
  if (w > 0) {
    faces.forEach(([pts]) => I.ink(pts, w * 0.55, { closed: true, lin: true, wob: 0.15, vary: 0.1, color: o.ink }));
    I.ink(HD.convexHull(all), w, { closed: true, lin: true, wob: 0.2, vary: 0.12, color: o.ink });
  }
  return { f, faces };
}
const quad = (P, pts3) => pts3.map(([X, Y, Z]) => P(X, Y, Z));

// a swivel chair seen from behind (floor point at X,Z), turned by `turn` (deg) — drawn at the depth scale
function chair3(P, X, Z, o = {}) {
  const v = rngOf(Math.round(Math.abs(X * 137 + Z * 1009)) + 7);
  const k = P.k(Z), [x, y] = P(X, 0, Z), col = o.color || mix('#2b3a40', v() < 0.5 ? '#46606a' : '#1d272c', v.range(0, 0.5));
  const pen = P.pen(Z, 1.9), t = (o.turn || 0) * D;
  const cw = Math.cos(t);
  if (!o.backOnly) for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.5 + t; const ex = x + Math.cos(a) * 0.3 * k, ey = y - 0.03 * k + Math.sin(a) * 0.06 * k; line([[x, y - 0.06 * k], [ex, ey]], Math.max(1, 0.04 * k), { color: o.base || '#1f2a2f', taper: [0, 0] }); I.fill(I.ell(ex, ey + 0.015 * k, 0.03 * k, 0.025 * k, 8), '#141c20', { wob: 0 }); }
  const seatW = 0.27 * k;
  if (!o.backOnly) shape(I.rectPts(x - 0.025 * k, y - 0.44 * k, 0.05 * k, 0.38 * k), '#6d7f84', { w: pen * 0.6, lin: true, wob: 0.1 });
  if (!o.backOnly) cel([[x - seatW, y - 0.52 * k], [x + seatW, y - 0.52 * k], [x + seatW * 0.95, y - 0.44 * k], [x - seatW * 0.95, y - 0.44 * k]], col, { w: pen, lin: true, k: 0.3, shade: 0.3 });
  if (o.back !== false) {
    const lo = o.low ? 0.74 : v.range(0.82, 1.12);
    const bx = x + Math.sin(t) * 0.12 * k, bw = 0.23 * k * Math.max(0.4, cw) * v.range(0.85, 1.12);
    if (v() < 0.55) [-1, 1].forEach((sd) => { const ax = x + sd * seatW * 1.05; line([[ax, y - 0.52 * k], [ax, y - 0.7 * k], [ax - sd * seatW * 0.5, y - 0.72 * k]], Math.max(1, 0.035 * k), { color: shade(col, 0.2), taper: [0, 0] }); });
    cel([[bx - bw, y - 1.08 * lo * k], [bx + bw, y - 1.08 * lo * k], [bx + bw * 1.08, y - 0.62 * k], [bx + bw * 0.6, y - 0.55 * k], [bx - bw * 0.6, y - 0.55 * k], [bx - bw * 1.08, y - 0.62 * k]], col, { w: pen, k: 0.4, shade: 0.3 });
  }
}

let RECTS = [];
function panel(r, art, post, o = {}) { RECTS.push({ x: r.x, y: r.y, w: r.w, h: r.h }); PG.panel(r, null, art, post, { grain: 0.065, ...o }); }

// =====================================================================================================
// 1 — the empty open-plan office at 3:07 a.m.: one pool of monitor light, grey-teal
// =====================================================================================================
const NIGHT = { ceil: '#2d464e', ceilLine: '#253b42', lamp: '#47666c', wall: '#34525a', wallR: '#3b5b62', floor: '#35535a', floorNear: '#2c464c', desk: '#6b8a8e', deskTop: '#7c9a9d', part: '#4b6a70', mon: '#27353b', chair: '#2b3a40', sky: '#1a2946', city: '#3e5b84', cityFar: '#4c6c95', lit: '#f2d27a', pool: '#9fcfd2', screen: '#dff7f3', glow: '#bff3f0' };
function p1(w, h) {
  const P = camera(560, 188, 380, 1.5);
  const ZB = 24, XL = -6, XR = 5, YC = 2.9;
  const Q = (a) => quad(P, a);
  // ceiling, floor, walls
  I.fill([P(XL, YC, 1), P(XR, YC, 1), P(XR, YC, ZB), P(XL, YC, ZB)], NIGHT.ceil, { lin: true, wob: 0 });
  I.fill([P(XL, 0, 1.2), P(XR, 0, 1.2), P(XR, 0, ZB), P(XL, 0, ZB)], NIGHT.floor, { lin: true, wob: 0 });
  I.fill(Q([[XR, 0, 2], [XR, YC, 2], [XR, YC, ZB], [XR, 0, ZB]]), NIGHT.wallR, { lin: true, wob: 0 });
  I.fill(Q([[XL, 0, 1], [XL, YC, 1], [XL, YC, ZB], [XL, 0, ZB]]), NIGHT.wall, { lin: true, wob: 0 });
  I.fill(Q([[XL, 0, ZB], [XR, 0, ZB], [XR, YC, ZB], [XL, YC, ZB]]), NIGHT.wall, { lin: true, wob: 0 });
  // the night outside: floor-to-ceiling glass on the left wall and the back wall; the city lies below
  // the horizon (we are high up), its far edge on the eye line
  const glassL = Q([[XL, 0.25, 1], [XL, 2.7, 1], [XL, 2.7, ZB], [XL, 0.25, ZB]]);
  const glassB = Q([[XL, 0.25, ZB], [XR - 0.6, 0.25, ZB], [XR - 0.6, 2.7, ZB], [XL, 2.7, ZB]]);
  const outside = (poly) => I.clipPoly(poly, () => {
    I.rect(-10, -10, w + 20, P.vy + 10, NIGHT.sky);
    SC.stars(w, P.vy - 30, 26, '#cfe0f0', { max: 1.6 });
    I.rect(-10, P.vy - 2, w + 20, h, '#2c4468');
    SC.skyline(w + 20, P.vy + 6, NIGHT.cityFar, { windows: 0.25, windowColor: '#e9cf86', min: 6, var: 20, gap: 2, tone: 0.05, winScale: 0.45, unlit: false, seed: 11 });
    SC.skyline(w + 20, P.vy + 40, NIGHT.city, { windows: 0.3, windowColor: NIGHT.lit, min: 10, var: 45, gap: 3, tone: 0.06, winScale: 0.6, unlit: false, seed: 12 });
    SC.skyline(w + 20, P.vy + 120, '#46648e', { windows: 0.3, windowColor: NIGHT.lit, min: 30, var: 90, gap: 4, tone: 0.06, winScale: 0.8, unlit: false, seed: 13 });
  });
  outside(glassL); outside(glassB);
  // mullions on the glass walls
  for (let z = 1.5; z < ZB; z += 2.4) line([P(XL, 0.25, z), P(XL, 2.7, z)], P.pen(z, 2.2) * 0.9, { taper: [0, 0], color: '#20343a' });
  for (let x = XL + 1.9; x < XR - 0.6; x += 1.9) line([P(x, 0.25, ZB), P(x, 2.7, ZB)], 0.9, { taper: [0, 0], color: '#20343a' });
  line([P(XL, 0.25, 1), P(XL, 0.25, ZB), P(XR - 0.6, 0.25, ZB)], 1.4, { taper: [0, 0], color: '#20343a', lin: true });
  line([P(XL, 2.7, 1), P(XL, 2.7, ZB), P(XR - 0.6, 2.7, ZB)], 1.4, { taper: [0, 0], color: '#20343a', lin: true });
  // ceiling grid and the switched-off light panels, all converging on the vanishing point
  for (let x = XL + 1; x < XR; x += 1.2) line([P(x, YC, 1.3), P(x, YC, ZB)], 1.0, { color: NIGHT.ceilLine, taper: [0, 0], lin: true, wob: 0.1 });
  for (let z = 2; z < ZB; z *= 1.22) line([P(XL, YC, z), P(XR, YC, z)], P.pen(z, 1.4), { color: NIGHT.ceilLine, taper: [0, 0], lin: true, wob: 0.1 });
  [-3.6, -0.6, 2.4].forEach((X) => { for (let z = 2.2; z < ZB - 2; z *= 1.45) { const pts = Q([[X, YC, z], [X + 1.2, YC, z], [X + 1.2, YC, z * 1.14], [X, YC, z * 1.14]]); I.fill(pts, NIGHT.lamp, { lin: true, wob: 0 }); I.ink(pts, P.pen(z, 1.4), { closed: true, lin: true, wob: 0.1, color: '#1e3238' }); } });
  // skirting and wall/floor edges
  line([P(XR, 0, 2.4), P(XR, 0, ZB), P(XL, 0, ZB)], 1.4, { taper: [0, 0], lin: true });
  line([P(XR, YC, 2), P(XR, YC, ZB), P(XL, YC, ZB)], 1.2, { taper: [0, 0], lin: true, color: '#1e3238' });
  // right wall: pillars, a whiteboard, a door, and the clock at 3:07
  [[7.5, 0.5], [14, 0.5]].forEach(([z, d]) => { const pts = Q([[XR, 0, z], [XR, YC, z], [XR, YC, z + d], [XR, 0, z + d]]); I.fill(pts, '#446469', { lin: true, wob: 0 }); I.ink(pts, P.pen(z, 1.6), { closed: true, lin: true, wob: 0.15 }); const fr = Q([[XR - 0.4, 0, z - 0.01], [XR, 0, z - 0.01], [XR, YC, z - 0.01], [XR - 0.4, YC, z - 0.01]]); I.fill(fr, '#50707a', { lin: true, wob: 0 }); I.ink(fr, P.pen(z, 1.6), { closed: true, lin: true, wob: 0.15 }); });
  { const wb = Q([[XR, 1.0, 9.5], [XR, 2.0, 9.5], [XR, 2.0, 12.2], [XR, 1.0, 12.2]]); I.fill(wb, '#8fa8aa', { lin: true, wob: 0 }); I.ink(wb, 1.2, { closed: true, lin: true, wob: 0.1 }); I.clipPoly(wb, () => { const a = P(XR, 1.75, 10), b = P(XR, 1.45, 11.4); line([a, L2(a, b, 0.4), b], 0.9, { color: '#3a5a8a' }); line([P(XR, 1.6, 10.1), P(XR, 1.3, 10.6)], 0.9, { color: '#a03a3a' }); }); }
  { const dr = Q([[XR, 0, 16], [XR, 2.1, 16], [XR, 2.1, 17.1], [XR, 0, 17.1]]); I.fill(dr, '#2a4046', { lin: true, wob: 0 }); I.ink(dr, 1.1, { closed: true, lin: true, wob: 0.1 }); const ex = Q([[XR, 2.25, 16.2], [XR, 2.45, 16.2], [XR, 2.45, 16.9], [XR, 2.25, 16.9]]); I.fill(ex, '#5fd08a', { lin: true, wob: 0 }); }
  { const [cx, cy] = P(XR - 0.4, 2.15, 7.49); const r = 0.26 * P.k(7.5); SC.clock(cx, cy, r, { time: [3, 7], rim: '#1e2a30', face: '#e8f2ee' }); }

  // ---- furniture, far to near: desk rows across the room, monitors facing away from us
  const items = [];
  const deskRow = (x0, x1, z, o = {}) => items.push({ z, fn: () => {
    // modesty panel + desk top + low fabric partition along the far edge
    box3(P, x0, x1, 0.72, 0.76, z, z + 0.8, NIGHT.desk, { top: NIGHT.deskTop });
    box3(P, x0 + 0.05, x1 - 0.05, 0.08, 0.72, z + 0.72, z + 0.76, shade(NIGHT.desk, 0.3), { w: P.pen(z) * 0.6 });
    box3(P, x0, x1, 0.76, 1.22, z + 0.8, z + 0.85, NIGHT.part, { w: P.pen(z) * 0.8 });
    // monitors (backs) and chairs pushed in or left askew
    for (let x = x0 + 0.55; x < x1 - 0.3; x += 1.2) {
      const lit = o.lit && Math.abs(x - o.lit) < 0.4;
      if (!lit) box3(P, x - 0.28, x + 0.28, 0.9, 1.24, z + 0.45, z + 0.5, NIGHT.mon, { top: '#3a4a50', w: P.pen(z) * 0.8 });
    }
  } });
  const chairs = (xs, z) => xs.forEach(([X, t]) => items.push({ z: z - 0.15, fn: () => chair3(P, X, z - 0.15, { turn: t }) }));
  [[4.2, -5.7, -1.2], [7.2, -5.7, -1.2], [10.2, -5.7, -1.2], [13.2, -5.7, -1.2], [16.2, -5.7, -1.2], [10.2, 1.0, 4.6], [13.2, 1.0, 4.6], [16.2, 1.0, 4.6]].forEach(([z, a, b]) => deskRow(a, b, z));
  chairs([[-4.9, 12], [-3.6, -20], [-2.2, 4]], 4.2); chairs([[-4.8, 0], [-2.4, 25]], 7.2); chairs([[-4.2, -8], [-2.2, 0]], 10.2); chairs([[1.7, 0], [3.6, -30]], 10.2);
  chairs([[2.9, 18]], 13.2); chairs([[-4.1, 0]], 13.2);

  // Chen's desk: the one lit screen in the building, facing us over his shoulder; a pool of cold light
  const ZC = 4.7, XC = 1.9;
  items.push({ z: ZC + 0.01, fn: () => {
    const kz = P.k(ZC);
    // the pool on the floor: two flat steps (ZP draws light as flat shapes), plus a soft glow in the air
    const pool = (r, col, op) => I.fill(I.ell(...P(XC, 0, ZC - 0.1), r * kz, r * kz * 0.22, 30), col, { wob: 0, op });
    I.fill([P(XC - 0.9, 0, ZC + 0.7), P(XC + 0.9, 0, ZC + 0.7), P(XC + 2.2, 0, ZC - 1.6), P(XC - 2.0, 0, ZC - 1.6)], NIGHT.pool, { wob: 1.2, op: 0.2 });
    void pool;
    glowFlat(...P(XC, 1.1, ZC + 0.5), 1.3 * kz, NIGHT.glow, 0.22);
    const lit = (c, t = 0.4) => mix(c, NIGHT.pool, t);
    box3(P, 0.65, 4.35, 0.08, 0.72, ZC + 0.72, ZC + 0.76, shade(lit(NIGHT.desk, 0.2), 0.3), { w: P.pen(ZC) * 0.6 });
    box3(P, 0.6, 4.4, 0.76, 1.22, ZC + 0.8, ZC + 0.85, lit(NIGHT.part, 0.35), { w: P.pen(ZC) * 0.8 });
    // his screen, switched on, facing him (and us); a second screen dark
    box3(P, 3.0, 3.56, 0.9, 1.24, ZC + 0.45, ZC + 0.5, '#2f3f45', { w: P.pen(ZC) * 0.8, frontFn: (f) => I.fill(f.map(([x, y]) => [x, y]), '#2f3f45', { lin: true, wob: 0 }) });
    box3(P, XC - 0.34, XC + 0.34, 0.88, 1.3, ZC + 0.45, ZC + 0.5, '#2a3438', { w: P.pen(ZC) * 0.8, frontFn: (f) => {
      const [a, , c] = [f[0], f[1], f[2]]; const x0 = Math.min(a[0], c[0]) + 2, x1 = Math.max(a[0], c[0]) - 2, y0 = Math.min(a[1], c[1]) + 2, y1 = Math.max(a[1], c[1]) - 2;
      I.rect(x0, y0, x1 - x0, y1 - y0, NIGHT.screen);
      for (let i = 0; i < 4; i++) I.rect(x0 + 4, y0 + 5 + i * 5, (x1 - x0) * (0.3 + ((i * 37) % 5) / 9), 1.4, '#8ec4c4');
    } });
    box3(P, 0.6, 4.4, 0.72, 0.76, ZC, ZC + 0.8, lit(NIGHT.desk, 0.45), { top: mix(NIGHT.deskTop, '#e6fbf7', 0.4) });
    // the screen's glow and a lamp-less desk: papers, a mug, a takeaway box, a phone
    glowFlat(...P(XC, 1.12, ZC + 0.45), 0.55 * kz, '#ffffff', 0.4);
    SC.mug(...P(3.9, 0.76, ZC + 0.3), 0.008 * kz, { color: '#e8e0d0' });
    const pp = Q([[0.8, 0.765, ZC + 0.12], [1.3, 0.765, ZC + 0.1], [1.34, 0.765, ZC + 0.5], [0.84, 0.765, ZC + 0.52]]); I.fill(pp, '#f4f6f0', { lin: true, wob: 0 }); I.ink(pp, 0.9, { closed: true, lin: true, wob: 0.1 });
    box3(P, 3.2, 3.6, 0.765, 0.86, ZC + 0.1, ZC + 0.4, '#c9b89a', { w: 1 });
    // Mr Chen from behind, hunched toward the screen, the light rimming his head and shoulders
    const s = 0.44;
    const cz = ZC - 0.4;
    const [fx, fy] = P(XC - 0.1, 0.46, cz);
    chair3(P, XC - 0.1, cz, { back: false, color: '#243238' });
    F.fig(chen, { x: fx, y: fy, sit: 0, s, yaw: 172, lean: 18, curve: 18, legN: [2, 10], legF: [0, 16], armN: [28, 70, 6], armF: [28, 70, 6], handN: 'none', handF: 'none', tint: ['#6f9ea2', 0.12], head: { yaw: 160, pitch: -8 } });
    chair3(P, XC - 0.1, cz, { color: '#243238', low: true, backOnly: true });
  } });
  items.sort((a, b) => b.z - a.z).forEach((it) => it.fn());

  // foreground: the corner of an empty desk with a plant, and a chair, in spot black, framing the view
  const fz = 2.1;
  box3(P, -3.6, -1.25, 0.72, 0.76, fz, fz + 0.8, '#1b292e', { top: '#3b5459' });
  { const kb = quad(P, [[-2.9, 0.765, fz + 0.2], [-2.2, 0.765, fz + 0.2], [-2.2, 0.765, fz + 0.38], [-2.9, 0.765, fz + 0.38]]); shape(kb, '#1f2c30', { w: 1.4, lin: true });
    const pp = quad(P, [[-3.4, 0.765, fz + 0.05], [-3.0, 0.765, fz + 0.08], [-3.05, 0.765, fz + 0.4], [-3.45, 0.765, fz + 0.36]]); I.fill(pp, '#6d8588', { lin: true, wob: 0 }); I.ink(pp, 1.1, { closed: true, lin: true }); }
  box3(P, -3.5, -1.35, 0.1, 0.72, fz + 0.1, fz + 0.12, '#141f23');
  box3(P, -3.0, -2.4, 0.9, 1.24, fz + 0.45, fz + 0.5, '#131c20', { top: '#1c282c' });
  // a potted plant: spot-black leaves against the window
  { const [px, py] = P(-1.55, 0.76, fz + 0.25), k = P.k(fz + 0.25), rr = rngOf(77);
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28 + rr.pm(0.08), L = k * rr.range(0.28, 0.46); const tip = [px + Math.cos(a) * L, py - 0.12 * k + Math.sin(a) * L]; const mid = L2([px, py - 0.12 * k], tip, 0.55), nx = -Math.sin(a) * k * 0.05, ny = Math.cos(a) * k * 0.05; shape([[px, py - 0.12 * k], [mid[0] + nx, mid[1] + ny], tip, [mid[0] - nx, mid[1] - ny]], '#0f1719', { w: 1.6, wob: 0.2 }); }
    shape([[px - 0.09 * k, py - 0.14 * k], [px + 0.09 * k, py - 0.14 * k], [px + 0.07 * k, py], [px - 0.07 * k, py]], '#1f2a2e', { w: 2, lin: true }); }
  chair3(P, 3.3, 2.5, { color: '#141d21', base: '#10181b', turn: 30 });
}

// shirt/sleeve helpers for the hand-built slump (the rig's desk pose can't lay a head on folded arms)
const SHIRT = '#e4ecea', SHIRT_SH = '#9db3b5';
function sleeve(pts, radii, o = {}) {
  const P = I.sample(pts, false, 6);
  const cc = [0]; for (let i = 1; i < pts.length; i++) cc.push(cc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = cc[cc.length - 1];
  const sc = [0]; for (let i = 1; i < P.length; i++) sc.push(sc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const rAt = (t) => { const x = t * tot; for (let i = 0; i < cc.length - 1; i++) if (x <= cc[i + 1] || i === cc.length - 2) { const k = clamp((x - cc[i]) / ((cc[i + 1] - cc[i]) || 1), 0, 1); return lerp(radii[i], radii[i + 1], k); } return radii[radii.length - 1]; };
  const Ls = [], Rs = [];
  P.forEach((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; const r = rAt(sc[i] / sc[sc.length - 1]); Ls.push([p[0] - ty * r, p[1] + tx * r]); Rs.push([p[0] + ty * r, p[1] - tx * r]); });
  let poly = Ls.concat(Rs.reverse());
  if (o.roundStart) { // a round shoulder cap at the root (the sleeve seam reads as the deltoid)
    const a = Ls[0], b = poly[poly.length - 1], c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], rr = Math.hypot(a[0] - c[0], a[1] - c[1]);
    const a0 = Math.atan2(b[1] - c[1], b[0] - c[0]);
    const cap = []; for (let k = 1; k < 8; k++) { const t = a0 + (k / 8) * Math.PI * (o.roundStart === -1 ? -1 : 1); cap.push([c[0] + Math.cos(t) * rr, c[1] + Math.sin(t) * rr]); }
    poly = poly.concat(cap);
  }
  cel(poly, o.color || SHIRT, { w: o.w ?? 1.9, shade: o.shade || SHIRT_SH, lx: o.lx ?? -8, ly: o.ly ?? -7, wob: 0.3, inner: o.inner });
  if (o.blendStart) {
    // the root melts into the torso: paint over the inked root edge, then a soft shoulder seam
    const a = Ls[0], b = Rs[Rs.length - 1], a2 = Ls[3], b2 = Rs[Rs.length - 4];
    const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, dx = (a2[0] + b2[0]) / 2 - cx, dy = (a2[1] + b2[1]) / 2 - cy;
    I.fill([L2(a, [cx, cy], 0.08), L2(b, [cx, cy], 0.08), [b[0] - dx * 0.8, b[1] - dy * 0.8], [a[0] - dx * 0.8, a[1] - dy * 0.8]].map(([x, y]) => [x + dx * 0.35, y + dy * 0.35]), o.patch || o.color || SHIRT, { wob: 0 });
    if (o.seam !== false) line([a, [cx + dx * 0.9, cy + dy * 0.9], b], 1.3, { color: '#7f9697', taper: [0.3, 0.3] });
  }
  return { poly, P, Ls, Rs };
}
const fold = (pts, w = 1.5, o = {}) => line(pts, w, { taper: [0.3, 0.4], ...o });

// =====================================================================================================
// 2 — close: his head goes down onto his folded arms beside the keyboard (front 3/4, screen light from
//     the right); the loosened tie flops onto the desk
// =====================================================================================================
function p2(w, h) {
  I.rect(0, 0, w, h, '#23383e');
  // the dark office beyond the partition: a strip of night window, far dead monitors
  I.rect(0, 0, w, 70, '#1c2c44');
  SC.skyline(w + 20, 72, '#3a5680', { windows: 0.3, windowColor: '#f2d27a', min: 8, var: 36, gap: 3, tone: 0.06, winScale: 0.55, unlit: false, seed: 21 });
  I.rect(0, 70, w, 8, '#20343a');
  // partition
  shape([[-5, 90], [w + 5, 84], [w + 5, 200], [-5, 206]], '#3d5b61', { w: 1.8, lin: true });
  line([[-5, 97], [w + 5, 91]], 1.1, { color: '#2a4247', taper: [0, 0] });
  [[20, 110, 44, 30, '#f0e27a'], [74, 118, 36, 28, '#9ad6e0']].forEach(([x, y, ww, hh, c], i) => SC.sheet(x + ww / 2, y + hh / 2, ww, hh, i ? 6 : -4, null, c, { shadow: false }));
  // the screen's cold light from the right
  glowFlat(w + 30, 150, 160, '#bdf1ee', 0.4);
  // desk top (lit), with its near edge
  shape([[-5, 196], [w + 5, 190], [w + 5, 292], [-5, 300]], '#86a8a8', { w: 2.2, lin: true });
  shape([[-5, 300], [w + 5, 292], [w + 5, h + 5], [-5, h + 5]], '#3c585d', { w: 2.2, lin: true });
  I.fill([[w * 0.45, 190], [w + 5, 188], [w + 5, 292], [w * 0.6, 295]], '#a9cccb', { lin: true, op: 0.45, wob: 0 });
  // a cold mug, papers
  SC.mug(40, 214, 1.5, { color: '#d8e4e2' });
  I.fill(I.ell(40, 190, 9, 2.4, 12), '#6a4a34', { wob: 0 });
  SC.sheet(92, 205, 58, 20, -3, null, '#eef3f0', { shadow: false });

  // --- Mr Chen, head down on his forearm, seen from his right-front. Rig sizes at this scale: head R 53 px,
  //     upper arm ~112 px, forearm ~100 px, sleeve radius ~15 px. The near arm is whole (shoulder, elbow on the
  //     desk, forearm under his cheek); the far arm is cropped at the left edge, its hand resting on the desk.
  const SL = '#d3dedd', SLS = '#a2b6b7', sr = 15;
  // the upper back and far shoulder rising behind the head, with the yoke seam and a crease into the armpit
  cel([[96, 238], [92, 170], [118, 128], [170, 102], [236, 92], [292, 100], [330, 124], [352, 186], [340, 240]], '#c7d5d4', { w: 2.0, shade: SLS, lx: 10, ly: -12, wob: 0.3, inner: () => {
    fold([[132, 132], [196, 110], [262, 106], [306, 118]], 1.3, { color: '#8fa6a6' });
    fold([[116, 146], [132, 176]], 1.3, { color: '#8fa6a6' });
  } });
  // shadow of the arms on the desk
  I.fill([[-10, 272], [120, 274], [360, 270], [370, 258], [-10, 258]], '#5f8080', { wob: 0.4, op: 0.6 });
  // far forearm coming in from the left edge (elbow cropped), the relaxed hand lying open on the desk
  sleeve([[-20, 264], [40, 260], [92, 256]], [sr, sr * 0.95, sr * 0.85], { color: '#ccd9d8', shade: SLS, w: 2.2, inner: () => fold([[30, 248], [42, 258]], 1.2, { color: '#7f9697' }) });
  shape([[86, 242], [96, 242], [98, 270], [88, 270]], '#eef3f2', { w: 1.6 });
  hand(96, 258, 4, 3.0, 'rest', { skin: mix(SKIN, '#9fd0d0', 0.12) });
  // near arm: a rounded shoulder, the upper arm down to the elbow planted on the desk, the forearm back under his cheek
  sleeve([[318, 128], [330, 190], [338, 244]], [sr * 1.35, sr * 1.1, sr], { color: SL, shade: SLS, roundStart: -1, w: 2.0, lx: -8, ly: -10, inner: () => fold([[322, 150], [328, 176]], 1.2, { color: '#7f9697' }) });
  sleeve([[346, 250], [290, 252], [226, 250]], [sr * 1.05, sr * 0.95, sr * 0.85], { color: SL, shade: SLS, w: 2.0, lx: -8, ly: -10, inner: () => { fold([[340, 236], [332, 248], [340, 262]], 1.4); fold([[292, 240], [276, 246]], 1.2, { color: '#7f9697' }); } });
  // the tie slipping out from under the forearm and hanging over the desk edge
  cel([[262, 262], [276, 262], [286, 304], [276, 316], [266, 304]], TIE, { w: 2, lx: -4, ly: -3, wob: 0.2, inner: () => [[270, 274], [274, 292], [276, 308]].forEach(([x, y]) => I.fill(I.ell(x, y, 3.2, 3.2, 10), DOT, { wob: 0 })) });
  // head lying on the forearm, cheek down, turned toward us
  const HX = 192, HY = 186;
  I.grp(`rotate(-12 ${HX} ${HY})`, () => HD.head(chen.head, { x: HX, y: HY, s: 1.95, yaw: -40, pitch: -8, blink: true, mood: 'shut', mouth: 'o', neck: 0.01 }));
  // keyboard in the foreground, pushed aside
  const kb = [[270, 296], [w + 10, 290], [w + 10, h + 10], [262, h + 10]];
  shape(kb, '#34454b', { w: 1.8, lin: true });
  I.clipPoly(kb, () => { for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) I.rect(276 + i * 12 + j * 5, 300 + j * 11 - i * 0.3, 9, 7, '#50656c'); });
  // a thin thread of drool, and z's
  // z's, brushed
  const zz = (x, y, k) => line([[x, y], [x + 14 * k, y - 2 * k], [x + 1 * k, y + 14 * k], [x + 16 * k, y + 12 * k]], 2.6 * Math.sqrt(k), { color: '#dff4f6', taper: [0.1, 0.25], lin: true });
  zz(262, 64, 0.8); zz(284, 30, 1.15);
}

// =====================================================================================================
// 3 — side view: slumped over the desk, and a butterfly with his tie's pattern lifts off his back
// =====================================================================================================
function p3(w, h) {
  I.rect(0, 0, w, h, '#263d44');
  // a tall night window behind: the way out
  const wx = 326, wy = 30, ww = 136, wh = 160;
  I.clipRect(wx, wy, ww, wh, () => {
    I.rect(wx, wy, ww, wh, '#1a2946');
    SC.stars(ww, 60, 8, '#dfe8f4', { x0: wx, y0: wy, max: 1.4 });
    SC.skyline(w + 20, wy + wh + 4, '#3e5b84', { windows: 0.3, windowColor: '#f2d27a', min: 30, var: 90, gap: 3, tone: 0.06, winScale: 0.6, unlit: false, seed: 31 });
  });
  shape([[wx - 8, wy - 8], [wx + ww + 8, wy - 8], [wx + ww + 8, wy + wh + 8], [wx - 8, wy + wh + 8], [wx - 8, wy - 8], [wx, wy], [wx, wy + wh], [wx + ww, wy + wh], [wx + ww, wy], [wx, wy]], '#4b6a70', { w: 2, lin: true });
  line([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 3, { color: '#4b6a70', taper: [0, 0] });
  line([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 1, { taper: [0, 0] });
  // floor and the far wall base
  I.rect(0, 250, w, h, '#2e474d');
  line([[-5, 250], [w + 5, 250]], 1.4, { taper: [0, 0], color: '#1c2e33' });
  // the desk, running off to the left, with his monitor shining at him
  const dy = 214;
  glowFlat(60, 150, 230, '#bdf1ee', 0.55);
  shape([[-5, dy], [238, dy], [242, dy + 10], [-5, dy + 10]], '#86a8a8', { w: 2.2, lin: true });
  shape([[-5, dy + 10], [226, dy + 10], [226, h + 5], [-5, h + 5]], '#3c585d', { w: 2.2, lin: true });
  line([[20, dy + 40], [200, dy + 40]], 1.2, { color: '#2c4549', taper: [0, 0] });
  // monitor side-on: a thin slab, the screen facing him
  shape([[40, dy], [70, dy], [64, dy - 6], [46, dy - 6]], '#33444a', { w: 1.8, lin: true });
  shape([[53, dy - 6], [58, dy - 6], [58, dy - 36], [53, dy - 36]], '#33444a', { w: 1.6, lin: true });
  shape([[50, dy - 104], [62, dy - 106], [64, dy - 28], [52, dy - 26]], '#2a383d', { w: 2, lin: true });
  I.fill([[62, dy - 104], [70, dy - 100], [72, dy - 30], [64, dy - 28]], '#e6fffb', { lin: true, op: 0.9, wob: 0 });
  // Mr Chen slumped over the desk, in profile: torso and legs from the rig, seat on the chair
  const tint = ['#6f9ea2', 0.1];
  const pose = { sit: 0, x: 318, y: 272, s: 0.95, yaw: -82, lean: 40, curve: 22, tint, shadow: false, legN: [2, 10], legF: [0, 18], armF: [0, 0], handF: 'none', head: { yaw: -68, pitch: -14, blink: true, mood: 'shut' } };
  // office chair: seat under his seat, back behind him, gas lift and base below
  const cx3 = 318;
  line([[cx3, 284], [cx3, 340]], 6, { color: '#6d7f84', taper: [0, 0] });
  shape([[cx3 + 22, 276], [cx3 + 44, 196], [cx3 + 60, 194], [cx3 + 42, 280]], '#2b3a40', { w: 2 });
  shape([[cx3 - 44, 272], [cx3 + 46, 272], [cx3 + 42, 285], [cx3 - 40, 285]], '#2b3a40', { w: 2, lin: true });
  const r3 = F.fig(chen, { ...pose, parts: ['legF', 'legN', 'torso'] });
  // near arm: upper arm hangs from the shoulder to the elbow on the desk edge, forearm lies along the desk
  const sr = r3.unit * 0.105;
  // far forearm on the desk under his cheek (the upper arm is hidden behind his head and chest)
  const fa0 = [248, dy - sr], fa1 = [168, dy - sr + 1];
  sleeve([fa0, L2(fa0, fa1, 0.5), fa1], [sr, sr * 0.92, sr * 0.82], { color: '#c3d0cf', shade: '#9aaeaf', w: 2.2 });
  hand(fa1[0] + 2, fa1[1] + 2, 186, r3.unit * 0.031, 'relaxed', { skin: mix(SKIN, '#8fc0c0', 0.18), flip: true });
  F.fig(chen, { ...pose, parts: ['head'] });
  // near arm hangs limp from the shoulder at the top of his back, down past the desk edge
  const shd = [r3.shN[0] + 4, r3.shN[1] + 4], el = [shd[0] - 6, shd[1] + r3.armU * 0.95], wr = [el[0] - 10, el[1] + r3.armFore * 0.9];
  sleeve([shd, L2(shd, el, 0.5), el], [sr * 1.15, sr * 1.05, sr], { color: '#d6e1e0', shade: '#a2b6b7', roundStart: -1, w: 2.2, lx: -8, ly: -8 });
  sleeve([el, L2(el, wr, 0.5), wr], [sr, sr * 0.92, sr * 0.82], { color: '#d6e1e0', shade: '#a2b6b7', w: 2.2, lx: -8, ly: -8, inner: () => fold([[el[0] - sr * 0.8, el[1] - 4], [el[0], el[1] + 3], [el[0] + sr * 0.7, el[1] - 2]], 1.3) });
  hand(wr[0], wr[1], 100, r3.unit * 0.031, 'relaxed', { skin: mix(SKIN, '#9fd0d0', 0.12) });

  // the butterfly lifting off his back: a shimmer of blue and yellow dust where it left, a looping wake
  const src = [r3.shF[0] + 14, r3.shF[1] - 8];
  const pathB = [src, [src[0] + 16, src[1] - 26], [src[0] + 2, src[1] - 46], [src[0] + 16, src[1] - 64], [src[0] + 44, src[1] - 60]];
  const trail = I.sample(pathB, false, 4);
  void trail;
  const dust = rngOf(33);
  for (let i = 0; i < 30; i++) { const a = dust.range(-Math.PI, 0), d = dust.range(4, 30); I.fill(I.ell(src[0] + Math.cos(a) * d * 1.3, src[1] + 6 + Math.sin(a) * d * 0.7, 1.3, 1.3, 6), dust() < 0.5 ? DOT : '#8fc0ff', { wob: 0, op: 0.9 }); }
  glowFlat(src[0], src[1], 50, '#d8f4ff', 0.55);
  glowFlat(404, 66, 60, '#e4f6ff', 0.5);
  butterfly(404, 64, 1.05, { open: 0.75, rot: 22, tilt: -0.25 });
}

// =====================================================================================================
// 4 — out of the window and over the night city: one lit window, a looping dotted wake, the moon
// =====================================================================================================
function p4(w, h) {
  // flat night bands, deepest at the top
  [['#101a38', 0], ['#16244a', 0.28], ['#1e305c', 0.5], ['#2a3f6e', 0.66]].forEach(([c, t]) => I.rect(0, h * t, w, h, c));
  SC.stars(w, h * 0.5, 70, '#fff3cf', { max: 2 });
  SC.moon(662, 104, 54, '#fff1c8', null, { glowColor: '#fff1c8', glowK: 1.1 });
  // the city below, in three steps of value; lit windows like embers
  city(w + 20, h * 0.8, '#3d5687', { seed: 41, min: 26, max: 100, win: 0.22, lit: '#e9c96a', dark: null, scale: 0.7, tone: 0.12, beacon: true });
  I.rect(0, h * 0.8, w, h, '#2f4674');
  city(w + 20, h * 0.93, '#34507e', { seed: 44, min: 20, max: 70, win: 0.3, lit: '#f2d27a', dark: '#2d466f', scale: 0.9, tone: 0.16 });
  // street lights: a boulevard running away, beads of light
  const vx = 520, vy = h * 0.8;
  for (let i = 0; i < 26; i++) { const t = Math.pow(i / 26, 1.7); [[-1, '#ffe39a'], [1, '#ffb070']].forEach(([sd, c]) => { const x = lerp(vx + sd * 6, vx + sd * 330, t), y = lerp(vy, h + 20, t); I.fill(I.ell(x, y, 0.8 + t * 2.4, 0.8 + t * 2.4, 6), c, { wob: 0 }); }); }
  city(w + 20, h + 4, '#1b2945', { seed: 43, min: 14, max: 50, win: 0.15, lit: '#f2d27a', dark: null, scale: 1.1, tone: 0.06 });
  // his office tower in the foreground: a dark glass face, one window lit on his floor
  const tx = 0, tw = 200;
  shape([[tx - 10, -10], [tw, -10], [tw - 16, h + 10], [tx - 10, h + 10]], '#22343f', { w: 2.4, lin: true });
  shape([[tw, -10], [tw + 26, -10], [tw + 6, h + 10], [tw - 16, h + 10]], '#2d4450', { w: 2.2, lin: true });
  const row = (y) => lerp(0, -16, y / h);
  for (let y = 18; y < h; y += 46) line([[tx - 10, y], [tw + row(y), y]], 1.2, { color: '#3f5a66', taper: [0, 0] });
  for (let x = 30; x < tw; x += 42) line([[x, -10], [x - 16 * (x / tw), h + 10]], 1.2, { color: '#3f5a66', taper: [0, 0] });
  // the lit window (his desk)
  const lw = [[100, 100], [168, 100], [166, 156], [98, 156]];
  I.fill(I.ell(134, 128, 60, 44, 24), '#bff3f0', { wob: 0, op: 0.18 });
  shape(lw, '#dff7f3', { w: 1.6, lin: true });
  // inside: the monitor's back, and him asleep on the desk (head on arms, hunched back)
  I.clipPoly(lw, () => { const ink = '#28383e'; I.rect(96, 146, 76, 12, ink); I.fill([[132, 147], [136, 132], [148, 124], [160, 127], [166, 147]], ink, { wob: 0.3 }); I.fill(I.ell(126, 140, 8, 6.5, 12, -0.3), ink, { wob: 0 }); I.fill([[114, 147], [140, 145], [140, 149], [112, 150]], ink, { wob: 0 }); I.rect(104, 118, 12, 20, ink); I.rect(108, 138, 4, 8, ink); });
  // the flight: out of the window, looping over the rooftops, up across the moon
  const fl = [[168, 118], [220, 150], [270, 118], [238, 96], [262, 80], [340, 104], [420, 150], [500, 120], [560, 92], [610, 108], [640, 98]];
  const tr = I.sample(fl, false, 7);
  tr.forEach((p, i) => { const t = i / tr.length, rr = lerp(2.6, 0.8, t); if (i % 2) return; I.fill(I.ell(p[0], p[1], rr, rr, 6), i % 6 === 0 ? DOT : '#e6f2ff', { wob: 0, op: 0.9 }); });
  butterfly(658, 92, 0.62, { open: 0.7, rot: 18, tilt: 0.2 });
}

// city(w, base, col, o): a hand-designed-feeling skyline row. Every building gets its own roof (flat, setbacks,
// dome, spire, mast, water tank, slant, gable, sawtooth) and its own window scheme (scattered lit panes in
// clusters, ribbon bands, vertical strips, a few lit floors, or dark), so no two read as the same stamp.
//   o.seed, o.min/o.max (height), o.lit (window colour), o.dark (unlit pane colour or null), o.tone, o.win (0..1 lit rate)
function city(w, base, col, o = {}) {
  const r = rngOf(o.seed || 3);
  const pick = (a) => a[Math.floor(r() * a.length)];
  let x = -10 - r() * 30;
  while (x < w + 10) {
    const bw = r() < 0.2 ? r.range(18, 30) : r.range(32, 88);
    const bh = r.range(o.min || 40, o.max || 140) * (r() < 0.15 ? 1.4 : 1);
    const c = mix(col, r() < 0.5 ? '#ffffff' : '#000000', r() * (o.tone ?? 0.1));
    const top = base - bh;
    const roof = pick(['flat', 'setback', 'setback', 'dome', 'spire', 'mast', 'tank', 'slant', 'gable', 'saw', 'flat']);
    const P = [[x, base + 300], [x, top]];
    if (roof === 'setback') { const k = r.range(0.15, 0.3), t2 = top - bh * r.range(0.12, 0.22); P.push([x + bw * k, top], [x + bw * k, t2], [x + bw * (1 - k), t2], [x + bw * (1 - k), top]); if (r() < 0.5) { const t3 = t2 - bh * 0.1; P.splice(4, 0, [x + bw * (k + 0.12), t2], [x + bw * (k + 0.12), t3], [x + bw * (0.88 - k), t3], [x + bw * (0.88 - k), t2]); } }
    if (roof === 'slant') P.push([x + bw, top - bw * r.range(0.2, 0.5)]);
    if (roof === 'gable') P.push([x + bw / 2, top - bw * 0.4]);
    if (roof === 'saw') for (let i = 0; i < 3; i++) P.push([x + (bw * (i + 1)) / 3, top - 8], [x + (bw * (i + 1)) / 3, top]);
    if (roof === 'spire') P.push([x + bw * 0.4, top], [x + bw * 0.5, top - bh * 0.35], [x + bw * 0.6, top]);
    P.push([x + bw, roof === 'slant' ? top - bw * 0.3 : top], [x + bw, base + 300]);
    I.fill(P, c, { lin: true, wob: 0.3 });
    if (roof === 'dome') I.fill(I.arc(x + bw / 2, top, bw * 0.36, bw * 0.3, Math.PI, Math.PI * 2, 12).concat([[x + bw * 0.86, top], [x + bw * 0.14, top]]), c, { wob: 0.2 });
    if (roof === 'mast') { line([[x + bw * 0.5, top], [x + bw * 0.5, top - r.range(18, 40)]], 1.8, { color: c, taper: [0, 0.4] }); if (o.beacon) I.fill(I.ell(x + bw * 0.5, top - 20, 1.8, 1.8, 6), '#ff6a5a', { wob: 0 }); }
    if (roof === 'tank') { const tx = x + bw * r.range(0.2, 0.6); I.fill([[tx, top], [tx + 12, top], [tx + 11, top - 13], [tx + 1, top - 13]], c, { lin: true }); I.fill([[tx - 1, top - 13], [tx + 6, top - 19], [tx + 13, top - 13]], c, { lin: true }); }
    // shadow side
    if (r() < 0.6) I.fill([[x + bw * 0.8, top + 2], [x + bw, top + 2], [x + bw, base + 300], [x + bw * 0.8, base + 300]], shade(c, 0.14), { lin: true, wob: 0 });
    // windows
    const scheme = pick(['scatter', 'scatter', 'bands', 'strips', 'floors', 'dark']);
    const lit = o.lit || '#f2d27a', dark = o.dark === undefined ? mix(c, '#000000', 0.12) : o.dark;
    const cw = r.range(6, 13) * (o.scale || 1), rh = r.range(11, 20) * (o.scale || 1);
    const ww = cw * r.range(0.35, 0.6), wh = rh * r.range(0.35, 0.6);
    const rate = (o.win ?? 0.3) * r.range(0.4, 1.4);
    let fl = 0;
    for (let wy = top + 8; wy < base - rh * 0.6; wy += rh, fl++) {
      const floorOn = scheme === 'floors' ? (r() < 0.3 ? 0.9 : 0.02) : rate * (r() < 0.25 ? 2 : r() < 0.3 ? 0.2 : 1);
      if (scheme === 'bands') { const on = r() < floorOn * 1.5; const x0 = x + 4, x1 = x + bw * 0.78 - 2; I.rect(x0, wy, x1 - x0, wh * 0.8, dark || c); if (on) { const a = x0 + r() * (x1 - x0) * 0.5; I.rect(a, wy, (x1 - a) * r.range(0.3, 1), wh * 0.8, lit); } continue; }
      if (scheme === 'strips') { if (fl === 0) for (let sx = x + 6; sx < x + bw * 0.78 - 4; sx += cw * 1.4) { I.rect(sx, top + 8, ww * 0.7, base - top - 12, dark || c); if (r() < rate) { const y0 = top + 8 + r() * (base - top) * 0.5; I.rect(sx, y0, ww * 0.7, r.range(10, 40), lit); } } continue; }
      if (scheme === 'dark') continue;
      let run = 0;
      for (let wx = x + 4 + (cw - ww) / 2; wx < x + bw * 0.78 - ww; wx += cw) {
        const on = run > 0 || r() < floorOn;
        if (run > 0) run--; else if (on && r() < 0.35) run = Math.floor(r.range(1, 4));
        if (on) I.rect(wx, wy, ww, wh, r() < 0.15 ? shade(lit, 0.18) : lit);
        else if (dark) I.rect(wx, wy, ww, wh, dark);
      }
    }
    x += bw + r.range(0, 6);
  }
}

// ---- tropical flora for the dream ------------------------------------------------------------------
// monstera: a big heart leaf with slits and holes, turned by rot (deg)
function monstera(x, y, s, rot, col = '#1f8a5a', o = {}) {
  const T = ([u, v]) => { const c = Math.cos(rot * D), sn = Math.sin(rot * D); return [x + (u * c - v * sn) * s, y + (u * sn + v * c) * s]; };
  const out = [];
  const N = 30;
  for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + (i / N) * Math.PI * 2; const r = 50 * (1 - 0.18 * Math.pow(Math.cos((a + Math.PI / 2) / 2), 40)); out.push([Math.cos(a) * r * 0.92, Math.sin(a) * r + 6]); }
  const P = out.map(T);
  const sh = shade(col, 0.28);
  cel(P, col, { w: o.w ?? 2.2, shade: sh, lx: 6 * s, ly: -6 * s, wob: 0.3, inner: () => {
    line([T([0, -40]), T([0, 0]), T([0, 52])], 1.6, { color: shade(col, 0.4), taper: [0.1, 0.3] });
    for (let k = -3; k <= 3; k++) { if (!k) continue; const v = k * 12; line([T([0, v * 0.6]), T([Math.sign(k) * 40, v - 10])], 1.1, { color: shade(col, 0.35), taper: [0.1, 0.4] }); }
  } });
  // slits from the edge inward, filled with whatever is behind (o.bg)
  const bg = o.bg || '#9be34a';
  [[-1, -18], [-1, 6], [-1, 28], [1, -22], [1, 2], [1, 26]].forEach(([sd, v]) => { const e = T([sd * 48, v - 6]), m = T([sd * 22, v + 2]), e2 = T([sd * 48, v + 2]); shape([e, m, e2], bg, { w: 1.3, wob: 0.2 }); });
  [[-12, -8], [14, 14]].forEach(([u, v]) => shape(I.ell(...T([u, v]), 3.4 * s, 5.5 * s, 10, rot * D), bg, { w: 1.2 }));
}
// a long banana/bird-of-paradise leaf from base (x,y) toward angle a (deg), length L
function longLeaf(x, y, L, a, wd, col = '#2a9a5a', o = {}) {
  const c = Math.cos(a * D), sn = Math.sin(a * D);
  const T = ([u, v]) => [x + u * c - v * sn, y + u * sn + v * c];
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([t * L, -Math.sin(t * Math.PI) * wd * (1 - 0.3 * t) + (o.bend || 0) * t * t * L]); }
  for (let i = 12; i >= 0; i--) { const t = i / 12; pts.push([t * L, Math.sin(t * Math.PI) * wd * 0.9 * (1 - 0.3 * t) + (o.bend || 0) * t * t * L]); }
  cel(pts.map(T), col, { w: 1.8, shade: shade(col, 0.28), lx: 5, ly: -5, wob: 0.3, inner: () => {
    line([T([0, 0]), T([L * 0.5, (o.bend || 0) * 0.25 * L]), T([L, (o.bend || 0) * L])], 1.5, { color: shade(col, 0.4), taper: [0, 0.6] });
    for (let i = 1; i < 9; i++) { const t = i / 10; const b = (o.bend || 0) * t * t * L; line([T([t * L, b]), T([t * L + wd * 0.5, b - wd * 0.8 * Math.sin(t * Math.PI)])], 1, { color: shade(col, 0.34), taper: [0.1, 0.5] }); }
  } });
}
// hibiscus seen from the front-ish: five ruffled petals, a dark throat, the long stamen column
function hibiscus(x, y, r, o = {}) {
  const col = o.color || '#ff3d7f', throat = o.throat || '#a8154c', rot = (o.rot || 0) * D;
  const sq = o.squash ?? 0.8;
  const T = ([u, v]) => { const c = Math.cos(rot), sn = Math.sin(rot); const vv = v * sq; return [x + (u * c - vv * sn), y + (u * sn + vv * c)]; };
  const pen = clamp(0.8 + r / 90, 1.1, 2.0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + 0.3;
    const pts = [[0, 0], [Math.cos(a - 0.62) * r * 0.5, Math.sin(a - 0.62) * r * 0.5]];
    for (let k = 0; k <= 10; k++) { const t = k / 10; const aa = a + (t - 0.5) * 1.8; const rr = r * (0.8 + 0.2 * Math.sin(t * Math.PI)) * (1 + 0.035 * Math.sin(t * Math.PI * 4 + i)); pts.push([Math.cos(aa) * rr, Math.sin(aa) * rr]); }
    pts.push([Math.cos(a + 0.62) * r * 0.5, Math.sin(a + 0.62) * r * 0.5]);
    cel(pts.map(T), col, { w: pen, shade: shade(col, 0.2), lx: r * 0.05, ly: -r * 0.05, wob: 0.2, inner: () => {
      for (let k = -1; k <= 1; k++) line([T([Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2]), T([Math.cos(a + k * 0.3) * r * 0.8, Math.sin(a + k * 0.3) * r * 0.8])], pen * 0.5, { color: shade(col, 0.3), taper: [0.1, 0.6] });
    } });
  }
  I.fill(I.ell(...T([0, 0]), r * 0.3, r * 0.3 * sq, 16), throat, { wob: 0.4 });
  // stamen column toward o.stamenA
  const sa = (o.stamenA ?? -60) * D, sl = r * (o.stamenL ?? 0.9);
  const tip = [x + Math.cos(sa) * sl, y + Math.sin(sa) * sl];
  line([[x, y], L2([x, y], tip, 0.5), tip], Math.max(2, r * 0.07), { color: '#f7e7a0', taper: [0, 0.1] });
  for (let i = 0; i < 9; i++) { const t = 0.6 + (i / 9) * 0.35; const p = L2([x, y], tip, t); I.fill(I.ell(p[0] + ((i % 3) - 1) * r * 0.04, p[1] + ((i % 2) - 0.5) * r * 0.05, r * 0.025 + 0.8, r * 0.025 + 0.8, 6), '#ffc400', { wob: 0 }); }
  [-1, 0, 1].forEach((k) => I.fill(I.ell(tip[0] + k * r * 0.035, tip[1] - r * 0.02 * Math.abs(k) - r * 0.02, r * 0.025 + 0.8, r * 0.025 + 0.8, 8), '#c2185b', { wob: 0 }));
  return tip;
}
// a drift of flowers: a flat colour mass with a scalloped top, dotted with blooms (far = texture only)
function drift(x0, x1, y, hgt, col, o = {}) {
  const r = rngOf(o.seed || 5);
  // a lens: a scalloped crown of blooms over a soft rounded base, ends tucked in
  const top = [], bot = [];
  const n0 = Math.max(6, Math.round((x1 - x0) / (o.step || 10)));
  for (let i = 0; i <= n0; i++) { const t = i / n0, x = lerp(x0, x1, t), e = Math.pow(Math.sin(t * Math.PI), 0.55); top.push([x, y - hgt * (0.35 + (o.hump ?? 0.4)) * e + r.pm(hgt * 0.12) * e]); bot.push([x, y + hgt * 0.9 * e]); }
  const pts = top.concat(bot.reverse());
  shape(pts, col, { w: o.w ?? 1.4, wob: 0.3 });
  // a crown of little heads along the top edge
  const dot = o.dot || mix(col, '#ffffff', 0.45), dark = shade(col, 0.25);
  I.clipPoly(pts, () => {
    I.fill(bot.map(([x, yy]) => [x, yy - hgt * 0.35]).concat([[x1, y + hgt * 2], [x0, y + hgt * 2]]), dark, { wob: 0.4, op: 0.5 });
    const n = o.n ?? Math.round((x1 - x0) / 6);
    for (let i = 0; i < n; i++) { const x = r.range(x0, x1), yy = y + r.range(-hgt * 0.4, hgt * 0.7), rr = (o.size || 2.2) * r.range(0.7, 1.3); I.fill(I.ell(x + 0.8, yy + 0.8, rr, rr * 0.8, 7), dark, { wob: 0 }); I.fill(I.ell(x, yy, rr, rr * 0.8, 7), r() < 0.3 ? (o.dot2 || '#fff4b0') : dot, { wob: 0 }); }
  });
}

// =====================================================================================================
// 5 — the dream: a rooftop garden in saturated tropical colour; the blue butterfly follows its fancies
// =====================================================================================================
function p5(w, h) {
  [['#1fb8cf', 0], ['#3dcad6', 0.22], ['#6fdcd9', 0.4], ['#a8eadb', 0.54]].forEach(([c, t]) => I.rect(0, h * t, w, h, c));
  SC.sun(w * 0.8, h * 0.2, 36, '#fff06a', { glow: '#fff7b0' });
  // the city dissolving into pink haze below the garden's edge
  SC.skyline(w + 20, h * 0.6, '#f6b6d3', { min: 24, var: 70, gap: 5, tone: 0.04, seed: 51 });
  SC.skyline(w + 20, h * 0.62, '#f9cfe1', { min: 10, var: 34, gap: 6, tone: 0.03, seed: 52 });
  // the rooftop garden: lawn, a pergola under bougainvillea, a water tank on stilts, drifts of flowers
  shape([[-10, h * 0.6], [w * 0.3, h * 0.57], [w * 0.7, h * 0.59], [w + 10, h * 0.56], [w + 10, h + 10], [-10, h + 10]], '#62c47a', { w: 1.6 });
  const tx = w * 0.8, ty = h * 0.3;
  [[-22, 0], [-8, 4], [8, 4], [22, 0]].forEach(([dx, dy]) => line([[tx + dx, ty + 30], [tx + dx * 1.15, ty + 72 + dy]], 2.2, { color: '#6a3a8a', taper: [0, 0] }));
  line([[tx - 24, ty + 52], [tx + 24, ty + 52]], 1.4, { color: '#6a3a8a', taper: [0, 0] });
  cel(I.rectPts(tx - 26, ty, 52, 32), '#e9b9a0', { w: 1.6, lin: true, k: 0.6 });
  shape([[tx - 30, ty], [tx, ty - 16], [tx + 30, ty]], '#dc9a98', { w: 1.6, lin: true });
  const px = w * 0.3, py = h * 0.4;
  [[-46, 0], [46, 0]].forEach(([dx]) => shape(I.rectPts(px + dx - 3, py, 6, 64), '#fff3dc', { w: 1.4, lin: true }));
  for (let i = 0; i < 16; i++) { const a = Math.PI + (i / 15) * Math.PI, rr = rngOf(60 + i); shape(I.ell(px + Math.cos(a) * 50 + rr.pm(4), py + 4 + Math.sin(a) * 26 + rr.pm(4), 11 + rr.pm(3), 9 + rr.pm(2), 10), i % 3 ? '#e21d8c' : '#ff5cb0', { w: 1.2 }); }
  line([[px - 48, py + 4], [px + 48, py + 4]], 2, { color: '#6a3a8a', taper: [0, 0] });
  // flowering shrubs along the far edge of the lawn, then mounded beds of flowers
  SC.bush(w * 0.08, h * 0.6, 120, 40, { leaf: '#58b99a', leafShade: '#3f9c80', flowers: '#ff3d8f', flowersN: 18 });
  SC.bush(w * 0.62, h * 0.6, 110, 34, { leaf: '#5fbf9c', leafShade: '#44a083', flowers: '#ffd23a', flowersN: 14 });
  SC.bush(w * 0.95, h * 0.59, 120, 44, { leaf: '#58b99a', leafShade: '#3f9c80', flowers: '#ff8a1d', flowersN: 18 });
  drift(-30, w * 0.24, h * 0.67, 24, '#ff4f9a', { seed: 1, size: 1.6, hump: 0.7 });
  drift(w * 0.44, w * 0.74, h * 0.67, 22, '#ff9f2e', { seed: 2, size: 1.6, hump: 0.7 });
  drift(-40, w * 0.34, h * 0.8, 34, '#ffd23a', { seed: 3, size: 2.2, dot: '#ff6a3d', hump: 0.8 });
  [[0.5, 0.97, 30], [0.44, 0.87, 24], [0.4, 0.79, 19], [0.37, 0.72, 14], [0.345, 0.675, 11], [0.33, 0.645, 8]].forEach(([u, v, r]) => shape(I.ell(w * u, h * v, r, r * 0.38, 12), '#fff0d6', { w: 1.3 }));
  drift(w * 0.54, w + 40, h * 0.8, 36, '#ff5f7e', { seed: 4, size: 2.6, dot: '#ffd23a', hump: 0.8 });
  // near blooms along the path, big enough to read as flowers
  [[0.3, 0.9, '#ff4f9a'], [0.36, 0.97, '#ffffff'], [0.62, 0.86, '#ffd23a'], [0.58, 0.95, '#ff9f2e']].forEach(([u, v, c], i) => SC.flower(w * u, h * v, 1.6, { kind: i % 2 ? 'daisy' : 'poppy', color: c, stemH: 14 }));
  hibiscus(w * 0.72, h * 0.88, 26, { color: '#ff2e6a', rot: 10, stamenA: -40 });
  hibiscus(w * 0.86, h * 0.8, 20, { color: '#ff8a1d', throat: '#c43d0d', rot: -20, stamenA: -110 });
  hibiscus(w * 0.2, h * 0.93, 22, { color: '#ffd23a', throat: '#e0521d', rot: 30, stamenA: -70 });
  monstera(34, h * 0.9, 1.5, 40, '#1d8a5c', { bg: '#ffd23a' });
  longLeaf(w + 20, h * 0.95, 150, -150, 22, '#23a05c', { bend: -0.12 });
  longLeaf(w + 10, h * 1.05, 120, -125, 18, '#1a8a4e', { bend: 0.1 });
  shape([[-10, h - 14], [w + 10, h - 18], [w + 10, h + 10], [-10, h + 10]], '#e0703a', { w: 2, lin: true });
  // the other butterflies, small, off to the sides
  [[0.08, 0.3, 0.45, -20, '#ff8a1d', '#3a1d0d'], [0.9, 0.44, 0.42, 15, '#ff4fa0', '#ffffff'], [0.7, 0.14, 0.36, -10, '#ffd23a', '#2a2224']].forEach(([u, v, sc, rt, c, d]) => butterfly(w * u, h * v, sc, { rot: rt, open: 0.8, pal: { field: c, inner: mix(c, '#ffffff', 0.4), edge: shade(c, 0.35), dot: d, vein: shade(c, 0.6) } }));
  // focal point: the blue butterfly framed in the pergola arch, against the pale sky, where the stepping-stone
  // path and the arch lead the eye
  I.fill(I.ell(w * 0.3, h * 0.47, 30, 24, 18), '#f4fff6', { wob: 1, op: 0.75 });
  butterfly(w * 0.3, h * 0.48, 0.85, { rot: 8, open: 0.9, tilt: 0.2 });
}

// =====================================================================================================
// 6 — close: the butterfly on a hibiscus, the sun behind it
// =====================================================================================================
function p6(w, h) {
  I.rect(0, 0, w, h, '#2ac0d0');
  const sx = w * 0.72, sy = h * 0.2;
  for (let i = 0; i < 16; i += 2) { const a0 = (i / 16) * Math.PI * 2; I.fill([[sx, sy], [sx + Math.cos(a0) * 900, sy + Math.sin(a0) * 900], [sx + Math.cos(a0 + Math.PI / 16) * 900, sy + Math.sin(a0 + Math.PI / 16) * 900]], '#ffd84a', { lin: true, wob: 0 }); }
  SC.sun(sx, sy, 40, '#fff6b0', { glow: '#fff6b0' });
  longLeaf(w * 0.9, h * 0.62, 110, -150, 20, '#5fbf9c', { bend: 0.1 });
  longLeaf(-10, h * 0.42, 90, -20, 16, '#5fbf9c', { bend: -0.1 });
  hibiscus(w * 0.86, h * 0.84, 34, { color: '#ff8a1d', throat: '#c43d0d', rot: -30, stamenA: -120 });
  longLeaf(-20, h + 10, 170, -55, 26, '#1f9a58', { bend: 0.08 });
  longLeaf(w + 20, h + 20, 150, -125, 24, '#16804a', { bend: -0.1 });
  const tip = hibiscus(w * 0.44, h * 0.72, 120, { color: '#ff2e6a', rot: 12, squash: 0.7, stamenA: -118, stamenL: 0.95 });
  void tip;
  butterfly(w * 0.66, h * 0.6, 1.45, { open: 0.85, rot: -18, tilt: 0.35 });
}

const DAWN = { bg: '#f3d48c', ray: '#fae6b4', wall: '#e9c98a', desk: '#c7b48c', deskFront: '#9c8a68', floor: '#d8bb82' };
function phone(x, y, s, o = {}) {
  const red = '#d23a2e';
  // base: a wedge with a dial plate
  cel([[x - 44 * s, y], [x - 36 * s, y - 30 * s], [x + 36 * s, y - 30 * s], [x + 44 * s, y]], red, { w: 2.0, k: 0.8 * s });
  cel(I.ell(x, y - 15 * s, 15 * s, 10 * s, 18), '#f4ede0', { w: 1.8, k: 0.4 });
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; I.fill(I.ell(x + Math.cos(a) * 9.5 * s, y - 15 * s + Math.sin(a) * 6.2 * s, 1.8 * s, 1.5 * s, 6), '#3a2a24', { wob: 0 }); }
  // cradle prongs
  [[-30, -30], [30, -30]].forEach(([dx, dy]) => shape([[x + (dx - 7) * s, y + dy * s], [x + (dx - 5) * s, y + (dy - 9) * s], [x + (dx + 5) * s, y + (dy - 9) * s], [x + (dx + 7) * s, y + dy * s]], red, { w: 1.8, lin: true }));
  // the handset leaping off its cradle, and the curly cord
  const hx = x + (o.hx || 0) * s, hy = y - (o.hy ?? 64) * s, hr = o.hr ?? -14;
  I.grp(`rotate(${hr} ${hx} ${hy})`, () => {
    cel([[hx - 52 * s, hy + 6 * s], [hx - 48 * s, hy - 10 * s], [hx - 32 * s, hy - 12 * s], [hx - 26 * s, hy - 2 * s], [hx + 26 * s, hy - 2 * s], [hx + 32 * s, hy - 12 * s], [hx + 48 * s, hy - 10 * s], [hx + 52 * s, hy + 6 * s], [hx + 32 * s, hy + 12 * s], [hx - 32 * s, hy + 12 * s]], red, { w: 2.0, k: 0.8 * s });
  });
  const cord = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; const bx = lerp(x + 44 * s, hx + 44 * s, t) + Math.sin(t * Math.PI) * 26 * s, by = lerp(y - 8 * s, hy + 10 * s, t); cord.push([bx + Math.cos(t * 50) * 4 * s, by + Math.sin(t * 50) * 3 * s]); }
  line(cord, 1.5, { taper: [0.05, 0.05], wob: 0.1 });
  // rattle marks
  [[-62, -20, -80], [-68, 0, -60], [62, -20, 80], [68, 0, 60]].forEach(([dx, dy, dx2]) => line([[x + dx * s, y + dy * s], [x + dx2 * 1.2 * s, y + (dy - 6) * s]], 2.2, { taper: [0.2, 0.5] }));
  [-1, 1].forEach((sd) => { line([[x + sd * 50 * s, y + 2 * s], [x + sd * 58 * s, y + 4 * s]], 1.6, { taper: [0.2, 0.2] }); });
}
// a sheet of office paper, each one different: size, bow, a dog-eared corner, a crease
function paper(x, y, pw, ph, rot, o = {}) {
  const r = rngOf(o.seed || 1);
  const bow = o.bow ?? r.pm(5);
  const c = Math.cos(rot * D), sn = Math.sin(rot * D);
  const T = ([u, v]) => [x + u * c - v * sn, y + u * sn + v * c];
  const hw = pw / 2, hh = ph / 2, dog = o.dog ?? r.range(0, 0.3) * Math.min(pw, ph);
  const pts = [[-hw, -hh], [0, -hh - bow], [hw - dog, -hh], [hw, -hh + dog], [hw + bow * 0.5, 0], [hw, hh], [0, hh - bow * 0.6], [-hw, hh], [-hw - bow * 0.4, 0]];
  cel(pts.map(T), '#fbf8f0', { w: 1.2, shade: '#d9d2c2', lx: 3, ly: -3, wob: 0.3, inner: () => {
    const n = Math.floor((ph - 14) / 7);
    for (let k = 0; k < n; k++) { const v = -hh + 9 + k * 7, len = pw - 16 - r.range(0, pw * 0.35); I.fill([T([-hw + 7, v]), T([-hw + 7 + len, v]), T([-hw + 7 + len, v + 1.3]), T([-hw + 7, v + 1.3])], '#a8aab0', { wob: 0, lin: true }); }
    if (o.crease != null) line([T([-hw, o.crease]), T([hw, o.crease + bow])], 1, { color: '#b9b2a2', taper: [0.1, 0.1] });
  } });
  if (dog > 3) shape([T([hw - dog, -hh]), T([hw - dog * 0.9, -hh + dog * 0.95]), T([hw, -hh + dog])], '#e6e0d2', { w: 1.2 });
}
// a swivel chair seen from the side; (x, y) = centre of the seat top; d: side the back is on (-1 left)
function sideChair(x, y, s, d = -1, col = '#3a4250') {
  line([[x, y + 10 * s], [x, y + 52 * s]], 6 * s, { color: '#8a929a', taper: [0, 0] });
  line([[x - 40 * s, y + 58 * s], [x + 40 * s, y + 58 * s]], 5 * s, { color: '#2a2e36', taper: [0, 0] });
  [-40, 0, 40].forEach((dx) => cel(I.ell(x + dx * s, y + 63 * s, 6 * s, 5 * s, 10), '#1f2228', { w: 1.2, k: 0.3 }));
  cel([[x + d * 34 * s, y + 4 * s], [x + d * 50 * s, y - 92 * s], [x + d * 36 * s, y - 100 * s], [x + d * 22 * s, y - 92 * s], [x + d * 18 * s, y + 4 * s]], col, { w: 2.2, k: 0.8 });
  cel([[x - 40 * s, y], [x + 40 * s, y], [x + 36 * s, y + 12 * s], [x - 36 * s, y + 12 * s]], col, { w: 2.2, k: 0.6 });
}

// =====================================================================================================
// 7 — BRRRING: the desk phone; Chen jolts up out of his chair, papers flying (dawn light)
// =====================================================================================================
function p7(w, h) {
  I.rect(0, 0, w, h, DAWN.bg);
  const dy = h * 0.8;
  const px = w * 0.64, py = dy - 30;
  // the alarm radiates from the phone across the whole panel, Chen included
  PG.rays(px, py, 30, 1100, 30, DAWN.ray, 3, { spread: 0.05 });
  // his chair shoots back and tips as he leaps out of it
  const cx = w * 0.27, seatY = h * 0.9;
  I.grp(`rotate(-16 ${cx - 30} ${seatY + 60})`, () => sideChair(cx - 30, seatY, 1.15, -1));
  [[cx - 150, seatY - 150], [cx - 164, seatY - 118], [cx - 156, seatY - 86]].forEach(([x, y]) => line([[x, y], [x - 36, y + 12]], 1.8, { taper: [0.1, 0.6] }));
  // Mr Chen, jolted up out of the seat: back arched, one arm flung up, the other thrown out, legs kicking
  const flyTie = { ...chen, top: { ...chen.top, details: (r) => tie(r, { fly: 60 }) } };
  const r = F.fig(flyTie, { ...F.POSES.jolt(flyTie, { x: cx, y: seatY - 30, s: 1.1 }), rot: -8, rotC: [cx, seatY], yaw: 35, lean: -16, curve: -18, squash: -0.08, legacyArms: false, armN: [170, -5, 70], armF: [128, 40, 60], handN: 'open', handF: 'open', legN: [70, 40, 24], legF: [38, 80, 14], shadow: false, head: { yaw: 40, pitch: 8, mood: 'shock', mouth: 'o', look: [0.5, 0] } });
  // the desk across the foreground
  shape([[-10, dy], [w + 10, dy - 6], [w + 10, dy + 16], [-10, dy + 22]], DAWN.desk, { w: 2.2, lin: true });
  shape([[-10, dy + 22], [w + 10, dy + 16], [w + 10, h + 10], [-10, h + 10]], DAWN.deskFront, { w: 2.2, lin: true });
  line([[w * 0.5, dy + 60], [w * 0.9, dy + 58]], 1.2, { color: '#6f5f44', taper: [0, 0] });
  // monitor at the right, still on
  const mx = w * 0.87;
  shape([[mx - 16, dy - 4], [mx + 16, dy - 5], [mx + 10, dy - 10], [mx - 10, dy - 9]], '#4a4a50', { w: 1.8, lin: true });
  shape(I.rectPts(mx - 4, dy - 28, 8, 20), '#4a4a50', { w: 1.6, lin: true });
  cel([[mx - 58, dy - 106], [mx + 58, dy - 108], [mx + 58, dy - 28], [mx - 58, dy - 26]], '#3e3e46', { w: 2.0, lin: true, k: 0.8 });
  I.fill([[mx - 52, dy - 100], [mx + 52, dy - 102], [mx + 52, dy - 34], [mx - 52, dy - 32]], '#fff4d6', { lin: true, wob: 0 });
  for (let i = 0; i < 4; i++) I.rect(mx - 44, dy - 92 + i * 12, 40 + ((i * 29) % 40), 3, '#e0c890');
  // the mug knocked over by the rattle, coffee jumping
  I.grp(`rotate(-38 ${w * 0.47} ${dy - 3})`, () => SC.mug(w * 0.47, dy - 3, 1.6, { color: '#ffffff' }));
  [[0, 0], [10, -12], [22, -18], [34, -14]].forEach(([dx, dy2], i) => I.fill(I.ell(w * 0.47 + 26 + dx, dy - 30 + dy2, 5 - i * 0.6, 4 - i * 0.5, 8), '#7a4a2a', { wob: 0.6 }));
  phone(px, dy - 3, 1.3, { hy: 70, hr: -16, hx: -6 });
  // five papers bursting up off the desk: different sizes, bows and folds, overlapping
  paper(w * 0.4, h * 0.34, 42, 54, 24, { seed: 3, dog: 10 });
  paper(w * 0.44, h * 0.46, 58, 40, -12, { seed: 4, crease: 2 });
  paper(w * 0.13, h * 0.3, 36, 46, -30, { seed: 5, bow: 7 });
  paper(w * 0.5, h * 0.14, 30, 40, 50, { seed: 6, dog: 0 });
  paper(w * 0.08, h * 0.56, 48, 34, 14, { seed: 7, dog: 8 });
  [[w * 0.4 - 30, h * 0.34 + 36], [w * 0.13 - 24, h * 0.3 + 32], [w * 0.5 - 22, h * 0.14 + 28]].forEach(([x, y]) => line([[x, y], [x - 10, y + 14]], 1.3, { taper: [0.3, 0.3] }));
  // emanata and a bead of sweat
  PG.ticks(r.headC[0], r.headC[1] - 6, r.R * 1.5, 5, -165, -15, 14);
  I.drop(r.headC[0] - r.R * 1.7, r.headC[1] - r.R * 1.2, 0.6, -30, '#bfe6f5');
  PG.sfx(px + 20, h * 0.26, 'BRRRING!', { size: 64, color: '#ffffff', rot: -6, sw: 3.4 });
}

// =====================================================================================================
// 7b — and there he lay: sprawled back in the tipped chair, papers settling, the receiver dangling
// =====================================================================================================
function p7b(w, h) {
  I.rect(0, 0, w, h, '#f1d08a');
  for (let i = 0; i < 7; i++) I.fill([[i * 90 - 20, -10], [i * 90 + 24, -10], [i * 90 - 40, h + 10], [i * 90 - 84, h + 10]], '#f6dea4', { lin: true, wob: 0 });
  const fy = h * 0.72;
  shape([[-10, fy], [w + 10, fy], [w + 10, h + 10], [-10, h + 10]], '#cdb07a', { w: 2, lin: true });
  // the desk at the right: the same red phone on it, its handset dangling over the edge on the curly cord
  const dx0 = w * 0.76, dy = h * 0.4;
  shape([[dx0, dy], [w + 10, dy - 4], [w + 10, dy + 12], [dx0, dy + 14]], DAWN.desk, { w: 2.2, lin: true });
  shape([[dx0 + 6, dy + 14], [w + 10, dy + 12], [w + 10, fy], [dx0 + 6, fy]], DAWN.deskFront, { w: 2.2, lin: true });
  const bx = dx0 + 60;
  cel([[bx - 30, dy], [bx - 24, dy - 20], [bx + 24, dy - 20], [bx + 30, dy]], '#d23a2e', { w: 2, k: 0.6 });
  cel(I.ell(bx, dy - 10, 10, 6.5, 16), '#f4ede0', { w: 1.4, k: 0.3 });
  const cord = []; for (let i = 0; i <= 40; i++) { const t = i / 40; cord.push([lerp(bx - 28, dx0 - 8, t) + Math.cos(t * 46) * 3.5, lerp(dy - 6, dy + 72, t) - Math.sin(t * Math.PI) * 14 + Math.sin(t * 46) * 3]); }
  line(cord, 1.4, { taper: [0.05, 0.05], wob: 0.1 });
  I.grp(`rotate(78 ${dx0 - 8} ${dy + 96})`, () => cel([[dx0 - 48, dy + 102], [dx0 - 44, dy + 88], [dx0 - 30, dy + 86], [dx0 - 24, dy + 94], [dx0 + 8, dy + 94], [dx0 + 14, dy + 86], [dx0 + 28, dy + 88], [dx0 + 32, dy + 102], [dx0 + 14, dy + 108], [dx0 - 30, dy + 108]], '#d23a2e', { w: 2, k: 0.6 }));
  // papers lying flat on the floor, each different, one still falling
  const flat = (x, y, pw, pd, sk, rot, dog) => { const c = Math.cos(rot * D), s2 = Math.sin(rot * D); const T = ([u, v]) => [x + u * c - v * s2 * 0.35 + v * sk, y + (u * s2) * 0.3 + v * 0.35]; const pts = [[-pw / 2, -pd / 2], [pw / 2 - dog, -pd / 2], [pw / 2, -pd / 2 + dog], [pw / 2, pd / 2], [-pw / 2, pd / 2]].map(T); shape(pts, '#fbf8f0', { w: 1.3, lin: true }); I.clipPoly(pts, () => { for (let k = 0; k < 3; k++) line([T([-pw / 2 + 6, -pd / 2 + 8 + k * 9]), T([pw / 2 - 10 - k * 6, -pd / 2 + 8 + k * 9])], 0.9, { color: '#a8aab0', taper: [0, 0] }); }); };
  flat(w * 0.56, h * 0.85, 52, 40, 0.2, -8, 6);
  flat(w * 0.72, h * 0.93, 40, 50, -0.3, 22, 0);
  flat(w * 0.9, h * 0.8, 34, 30, 0.1, -30, 5);
  flat(w * 0.08, h * 0.95, 46, 36, 0.4, 12, 0);
  paper(w * 0.58, h * 0.36, 30, 38, -34, { seed: 14 });
  line([[w * 0.58 + 20, h * 0.36 - 26], [w * 0.58 + 30, h * 0.36 - 40]], 1.2, { taper: [0.3, 0.3] });
  // the chair tipped right over onto its back on the floor, Mr Chen still in it, lying back, legs in the air,
  // staring at the ceiling
  const cx = w * 0.3, seatY = fy - 20;
  I.grp(`rotate(-74 ${cx} ${seatY})`, () => {
    sideChair(cx, seatY, 1, -1);
    F.fig(chen, { sit: 0, x: cx + 6, y: seatY, s: 0.8, yaw: 38, lean: -6, curve: -4, legN: [40, 30, 20], legF: [30, 50, 12], armN: [30, 20, 40], armF: [50, 30, 40], handN: 'relaxed', handF: 'open', shadow: false, head: { yaw: 30, pitch: 10, look: [0.4, -0.9], mood: 'tired', mouth: 'o' } });
  });
  // contact shadow under the toppled chair
  I.fill(I.ell(cx - 30, fy + 6, 110, 7, 20), '#8a7040', { wob: 0.4, op: 0.35 });
}
// =====================================================================================================
// 8 — close: his fingertips glitter with blue and yellow dust
// =====================================================================================================
const P8TIPS = [[0.412, 0.34], [0.496, 0.29], [0.586, 0.33], [0.66, 0.43], [0.31, 0.6]].map(([u, v]) => [0.5 + (u - 0.5) * 0.94, 0.84 + (v - 0.9) * 0.94]);
function p8(w, h) {
  I.rect(0, 0, w, h, '#f7e3b4');
  glowFlat(w * 0.6, h * 0.4, 260, '#fff6de', 0.8);
  for (let i = 0; i < 4; i++) I.fill([[w * 0.1 + i * 90, -10], [w * 0.1 + i * 90 + 40, -10], [w * 0.1 + i * 90 - 60, h + 10], [w * 0.1 + i * 90 - 100, h + 10]], '#f1d79e', { lin: true, wob: 0 });
  // shirt cuff and wrist rising from the bottom; the back of his hand, fingers spread and slightly curled
  const wx = w * 0.5, wy = h * 0.84;
  // cuff and sleeve below the wrist
  sleeve([[wx - 40, h + 60], [wx - 16, h + 10], [wx - 2, wy + 10]], [30, 29, 27], { color: '#f6f2ea', shade: '#dcc9a8', lx: 10, ly: -10, w: 2.2 });
  shape([[wx - 30, wy + 4], [wx + 26, wy + 2], [wx + 28, wy + 18], [wx - 32, wy + 20]], '#fbf8f2', { w: 1.8 });
  I.fill(I.ell(wx + 16, wy + 11, 3, 3, 8), '#c9c0b0', { wob: 0 });
  hand(wx, wy, -86, 9.0, 'open', { skin: SKIN, contour: 2.5, lw: 1.4 });
  const tips = P8TIPS.map(([u, v]) => [u * w, v * h]);
  const dust = rngOf(81);
  tips.forEach((t, j) => {
    const n = j === 4 ? 8 : 20;
    for (let k = 0; k < n; k++) { const rr = dust.range(1, 11), a = dust.range(0, Math.PI * 2); const x = t[0] + Math.cos(a) * rr, y = t[1] + Math.sin(a) * rr * 0.7; const c = dust() < 0.55 ? '#2f63b4' : DOT; I.fill(I.ell(x, y, dust.range(1.2, 2.4), dust.range(0.9, 1.8), 6, a), c, { wob: 0 }); }
  });
  for (let k = 0; k < 40; k++) { const t = tips[k % 4]; const x = t[0] + dust.range(-12, 40), y = t[1] - dust.range(6, 40) * (1 + (k % 3) * 0.3); const c = dust() < 0.5 ? '#5d95dc' : DOT; I.fill(I.ell(x, y, dust.range(0.9, 2), dust.range(0.9, 2), 6), c, { wob: 0, op: dust.range(0.55, 1) }); }
  [[4, -22, 7], [30, -36, 5], [-10, -26, 4], [30, -6, 6]].forEach(([dx, dy, r], i) => { const t = tips[i % 4]; const x = t[0] + dx, y = t[1] + dy; I.fill([[x, y - r * 2], [x + r * 0.35, y - r * 0.35], [x + r * 2, y], [x + r * 0.35, y + r * 0.35], [x, y + r * 2], [x - r * 0.35, y + r * 0.35], [x - r * 2, y], [x - r * 0.35, y - r * 0.35]], i % 2 ? '#ffffff' : '#fff2a8', { lin: true, wob: 0 }); });
}

// =====================================================================================================
// 9 — splash: sunrise at the open window; the butterfly on his finger; they regard each other
// =====================================================================================================
function p9(w, h) {
  // sky in warm flat bands, the sun low behind where the butterfly will sit
  [['#f2b27a', 0], ['#f6c68e', 0.2], ['#f9d9a6', 0.38], ['#fce8c2', 0.55], ['#fff3da', 0.66]].forEach(([c, t]) => I.rect(0, h * t, w, h, c));
  const sx = w * 0.6, sy = h * 0.5;
  PG.rays(sx, sy, 90, 1200, 26, '#fff4d4', 3, { spread: 0.035 });
  SC.sun(sx, sy, 78, '#fffbe8', { glow: '#fff1c8' });
  // the city waking up: rose and peach towers, a few windows catching the sun
  city(w + 20, h * 0.66, '#e9a887', { seed: 91, min: 50, max: 170, win: 0.12, lit: '#fff1c2', dark: '#dd9a7c', scale: 1, tone: 0.1 });
  city(w + 20, h * 0.72, '#d98a6c', { seed: 92, min: 30, max: 110, win: 0.14, lit: '#ffe6a8', dark: '#c97e62', scale: 1.1, tone: 0.1 });
  // the window: a deep frame all round, the right-hand casement swung open
  const fx = -24, fy = -24, fw = w - 16, fh = h * 0.66 + 24;
  const wall = '#b6a488', wallSh = '#8f8068';
  I.fill([[-10, -10], [w + 10, -10], [w + 10, fy], [-10, fy]], wall, { lin: true, wob: 0 });
  I.fill([[-10, -10], [fx, -10], [fx, h + 10], [-10, h + 10]], wall, { lin: true, wob: 0 });
  I.fill([[fx + fw, -10], [w + 10, -10], [w + 10, h + 10], [fx + fw, h + 10]], wall, { lin: true, wob: 0 });
  // reveals (the wall's thickness) in shade
  I.fill([[fx, fy], [fx + fw, fy], [fx + fw - 16, fy + 14], [fx + 16, fy + 14]], wallSh, { lin: true, wob: 0 });
  I.fill([[fx, fy], [fx + 16, fy + 14], [fx + 16, fy + fh], [fx, fy + fh]], wallSh, { lin: true, wob: 0 });
  I.ink([[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh]], 2.4, { closed: true, lin: true, wob: 0.3 });
  line([[fx + 16, fy + 14], [fx + fw - 16, fy + 14]], 1.2, { taper: [0, 0], lin: true });
  line([[fx + 16, fy + 14], [fx + 16, fy + fh]], 1.2, { taper: [0, 0], lin: true });
  // the fixed left casement frame and the open right one, seen edge-on swinging out
  const mid = fx + fw * 0.5;
  shape([[mid - 8, fy + 14], [mid + 8, fy + 14], [mid + 8, fy + fh], [mid - 8, fy + fh]], '#e8dcc4', { w: 2, lin: true });
  const pane = [[mid + 8, fy + 14], [mid + 150, fy + 44], [mid + 150, fy + fh - 34], [mid + 8, fy + fh]];
  const inner = [[mid + 20, fy + 30], [mid + 138, fy + 56], [mid + 138, fy + fh - 46], [mid + 20, fy + fh - 16]];
  I.emit(`<path fill-rule="evenodd" fill="#e8dcc4" d="M${pane.map((q) => q.map(I.n1).join(' ')).join('L')}Z M${inner.map((q) => q.map(I.n1).join(' ')).join('L')}Z"/>`);
  I.ink(pane, 2, { closed: true, lin: true, wob: 0.2 }); I.ink(inner, 1.4, { closed: true, lin: true, wob: 0.2 });
  // the casement's thickness: its outer edge seen as a narrow shaded strip, and two hinges
  shape([[mid + 150, fy + 44], [mid + 162, fy + 42], [mid + 162, fy + fh - 36], [mid + 150, fy + fh - 34]], '#b9aa8c', { w: 1.8, lin: true });
  [fy + 40, fy + fh - 40].forEach((yy) => shape(I.rectPts(mid + 4, yy, 8, 18), '#8a7a5c', { w: 1.4, lin: true }));
  I.fill(inner, '#ffffff', { lin: true, op: 0.18, wob: 0 });
  line([[mid + 40, fy + 90], [mid + 70, fy + 60]], 3, { color: '#ffffff', op: 0.7 });
  line([[mid + 44, fy + 116], [mid + 96, fy + 70]], 2, { color: '#ffffff', op: 0.6 });
  // Mr Chen at the sill, leaning on his forearm, a finger raised; the butterfly perched on it
  const sillY = fy + fh;
  const tint = ['#f2a070', 0.12];
  // arm targets from the rig itself, so both arms keep their real length: the near hand raised in front of
  // his face with a bent elbow, the far hand resting on the sill just in front of the far shoulder
  const P9 = { x: w * 0.3, y: sillY + 330, s: 1.9, yaw: 55, lean: 6, curve: 6 };
  const r0 = F.rig(chen, P9);
  const hx = r0.headC[0] + r0.dir * r0.unit * 0.95, hy = r0.headC[1] + r0.unit * 0.15;
  let tipAt = null;
  const holdFn = (T, s, A) => { tipAt = T([A.fingertip[0] + 0.3, A.fingertip[1] - 0.8]); };
  const r = F.fig({ ...chen, handScale: 1.35 }, { ...P9, reachN: [hx, hy], bendN: 1, legacyArms: false, handN: 'fingertip', handAngN: -80, holdN: holdFn, hideF: true, tint, shadow: false, head: { yaw: 40, pitch: 4, look: [0.9, -0.3], mood: 'surprise', mouth: 'smile' } });
  void r;
  // the sill in front of him, with the wall below it
  shape([[-10, sillY], [w + 10, sillY], [w + 10, sillY + 18], [-10, sillY + 18]], '#efe4cc', { w: 2.4, lin: true });
  shape([[-10, sillY + 18], [w + 10, sillY + 18], [w + 10, h + 10], [-10, h + 10]], wall, { w: 2.2, lin: true });
  I.fill([[-10, sillY + 18], [w + 10, sillY + 18], [w + 10, sillY + 30], [-10, sillY + 30]], wallSh, { lin: true, wob: 0 });
  // his forearm on the sill, drawn over it
  // the butterfly on his fingertip, turned toward him, backlit by the sun
  if (tipAt) {
    glowFlat(tipAt[0], tipAt[1] - 20, 70, '#fffbe8', 0.6);
    butterfly(tipAt[0] + 4, tipAt[1] - 3, 1.45, { open: 1, rot: -90, side: true });
  }
}

function stub(w, h) { I.rect(0, 0, w, h, '#ddd'); }

// =====================================================================================================
function page() {
  // ---- title: the words drift like a butterfly
  PG.sfx(116, 110, 'THE', { size: 56, color: DOT, anchor: 'start', rot: -4, sw: 3 });
  PG.sfx(116, 204, 'BUTTERFLY', { size: 112, color: TIE, anchor: 'start', rot: -3, sw: 3.4, ls: 3 });
  I.emit(`<text x="118" y="244" font-family="Letter" font-size="13" letter-spacing="2">${[['WORDS BY ', INK], ['CHUANG TZŬ', TIE], ['   (TR. H. A. GILES)      ART BY ', INK], ['CLAUDE', '#c99a1a']].map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, ' ')}</tspan>`).join('')}</text>`);
  for (let k = 0; k < 16; k++) { const t = k / 15; const x = 600 + t * 250, y = 170 - t * 100 + Math.sin(t * 9) * 18; I.fill(I.ell(x, y, 1.6, 1.6, 6), '#8aa3a4', { wob: 0 }); }
  butterfly(872, 70, 1.35, { rot: 18, open: 0.9 });
  let y = 276;
  const G = PG.GUT_V;
  let r;

  const ROWS = [
    [400, [1], [[p1, (w, h) => PG.caption(20, 20, ['ONCE UPON A TIME, I, CHUANG TZŬ,', 'DREAMT I WAS A BUTTERFLY,'])]]],
    [320, [1, 1.3], [[p2], [p3, (w, h) => PG.caption(16, 16, ['FLUTTERING HITHER AND THITHER,', 'TO ALL INTENTS AND PURPOSES', 'A BUTTERFLY.'])]]],
    [300, [1], [[p4]]],
    [340, [1.5, 1], [[p5, (w, h) => PG.caption(16, 16, ['I WAS CONSCIOUS ONLY OF FOLLOWING', 'MY FANCIES AS A BUTTERFLY,'])], [p6, (w, h) => PG.caption(16, 16, ['AND WAS UNCONSCIOUS OF', 'MY INDIVIDUALITY AS A MAN.'])]]],
    [340, [1], [[p7, (w, h) => PG.caption(16, 16, ['SUDDENLY, I AWAKED,'])]]],
    [280, [1.25, 1], [[p7b, (w, h) => PG.caption(w - 196, 16, ['AND THERE I LAY,', 'MYSELF AGAIN.'])], [p8]]],
    [600, [1], [[p9, (w, h) => PG.caption(w / 2 - 200, h * 0.66 + 34, ['NOW I DO NOT KNOW WHETHER I WAS', 'THEN A MAN DREAMING I WAS A BUTTERFLY,', 'OR WHETHER I AM NOW A BUTTERFLY', 'DREAMING I AM A MAN.'], { attrib: '– CHUANG TZŬ' })]]],
  ];
  ROWS.forEach(([hh, fr, cells, o = {}]) => { y += o.gap || 0; r = PG.row(y, hh, fr, o); r.forEach((q, i) => panel(q, cells[i][0], cells[i][1])); y += hh + G + (o.gap || 0); });
  const H = y + 50;
  PG.text(PG.MARGIN, H - 34, 'Chuang Tzŭ (Zhuangzi), ch. II, tr. Herbert A. Giles (1889). A homage to Zen Pencils by Gavin Aung Than.', { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 34, 'No. 3', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
  return H;
}

const H = page();
const out = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'the-butterfly.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
fs.writeFileSync(process.env.RECTS || path.join(__dirname, '..', 'work', 'comics', 'the-butterfly', 'rects.json'), JSON.stringify(RECTS));
console.log('wrote', H);
