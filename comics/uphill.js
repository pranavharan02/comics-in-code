// UP-HILL — Christina Rossetti (1862). A Zen-Pencils-style strip drawn in code.
// node comics/uphill.js  -> out/up-hill.svg      (OUT=path overrides)
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, LW, line, shape, limb } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const { hand, tube } = require('../zp/hand');
const C = require('./cast_uphill');

I.seed(1862);
const W = 980;
let H = 0;
const mix = F.mix;
const SPK = {}; // speaker anchor points, set while drawing a panel and read by its lettering

// ---------------------------------------------------------------- the colour script
const TIMES = {
  dawn: { skyTop: '#cfe8e2', skyLow: '#fbecc9', far: '#c5e2c0', hill: '#98cc86', hedge: '#5f9a52', shade: '#7fb372', road: '#f6e6bc', inn: '#f2e4c8', roof: '#c0574a', tree: '#6fae62', treeSh: '#4f8a4a', sun: [0.12, 0.28, '#fff3cc'], tint: null, clouds: true },
  noon: { skyTop: '#9fd6ec', skyLow: '#e3f3f4', far: '#a9d59a', hill: '#8cc56f', hedge: '#5a9447', road: '#f4e2ad', wall: '#cdbf9f', tint: null },
  after: { skyTop: '#f6c77c', skyLow: '#fbe7b5', far: '#dcc890', hill: '#b9b565', hedge: '#86823e', shade: '#a09a52', road: '#f3d9a0', wall: '#c9b48c', inn: '#f2dcb4', roof: '#b44c3c', tree: '#7f9a48', treeSh: '#5e7632', sun: [0.14, 0.34, '#fff1c2'], tint: ['#ff9a4a', 0.08] },
  dusk: { skyTop: '#4f4585', skyLow: '#f0a07c', far: '#7a6490', hill: '#4c4f7c', hedge: '#37395f', shade: '#424570', road: '#8f82a8', inn: '#5a4f78', roof: '#3c3052', tree: '#3c4468', treeSh: '#2c3254', sun: null, tint: ['#5b4e8c', 0.28] },
  night: { skyTop: '#121836', skyLow: '#2c3464', far: '#262d55', hill: '#20284a', hedge: '#141a36', shade: '#1b2242', road: '#39416c', inn: '#2a2f52', roof: '#1c2040', tree: '#1a2142', treeSh: '#121833', tint: ['#1b2350', 0.42] },
};
const tint = (P) => P.tint || undefined;

// ---------------------------------------------------------------- the hill (repeated, identical framing)
const ROAD = [[0.07, 0.99], [0.16, 0.9], [0.74, 0.8], [0.8, 0.74], [0.3, 0.62], [0.26, 0.56], [0.72, 0.45], [0.76, 0.4], [0.44, 0.31], [0.46, 0.27], [0.62, 0.2]];
function roadAt(t, w, h) {
  const pts = ROAD.map(([x, y]) => [x * w, y * h]);
  const seg = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
  let d = t * tot;
  for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const k = d / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k, Math.sign(pts[i + 1][0] - pts[i][0])]; } d -= seg[i]; }
  return [...pts[pts.length - 1], 1];
}
function sky(w, h, P) { I.rect(-2, -2, w + 4, h + 4, PG.linear(0, 0, 0, h, [[0, P.skyTop], [1, P.skyLow]])); }
function scallopCloud(x, y, s, c = '#ffffff') {
  // ZP clouds: a flat bottom and a few scalloped bumps, inked
  const pts = [[x - 60 * s, y]];
  [[-44, -14, 18], [-18, -26, 22], [12, -22, 20], [38, -12, 16]].forEach(([dx, dy, r]) => { for (let k = 0; k <= 6; k++) { const a = Math.PI + (k / 6) * Math.PI; pts.push([x + dx * s + Math.cos(a) * r * s, y + dy * s + 10 * s + Math.sin(a) * r * s]); } });
  pts.push([x + 58 * s, y]);
  shape(pts, c, { w: SC.BG, wob: 0.3 });
}
function lollipop(x, y, r, P) {
  line([[x, y], [x, y - r * 0.5]], 2.2);
  shape(I.ell(x, y - r * 1.2, r, r * 1.05, 14), P.tree, { w: LW.fine });
  I.clipPoly(I.ell(x, y - r * 1.2, r, r * 1.05, 14), () => I.fill(I.ell(x + r * 0.45, y - r * 1.0, r, r, 12), P.treeSh, { wob: 0 }));
}
function inn(x, y, s, P, o = {}) {
  if (o.lit) PG.glow(x - 10 * s, y - 20 * s, 60 * s, '#ffcf6a', 0.7);
  shape([[x - 30 * s, y], [x - 30 * s, y - 34 * s], [x + 34 * s, y - 34 * s], [x + 34 * s, y]], P.inn, { w: LW.detail, lin: true });
  shape([[x - 38 * s, y - 32 * s], [x - 6 * s, y - 62 * s], [x + 42 * s, y - 32 * s]], P.roof, { w: LW.detail, lin: true });
  shape(I.rectPts(x + 16 * s, y - 70 * s, 9 * s, 22 * s), P.inn, { w: LW.fine, lin: true });
  shape(I.rectPts(x - 18 * s, y - 26 * s, 14 * s, 12 * s), o.lit ? '#ffd26a' : mix(P.inn, '#6a8aa8', 0.4), { w: LW.fine, lin: true });
  shape(I.rectPts(x + 8 * s, y - 20 * s, 12 * s, 20 * s), o.lit ? '#ffb84a' : '#8a6a4e', { w: LW.fine, lin: true });
  if (o.smoke) for (let k = 0; k < 3; k++) I.fill(I.ell(x + (22 + k * 6) * s, y - (80 + k * 12) * s, (5 + k * 2) * s, (4 + k * 1.5) * s, 10), o.smoke, { wob: 0.2, op: 0.8 - k * 0.2 });
}
// small figures for the wide shots: simple readable silhouettes (cap + stick; red coat + yellow boots)
function tiny(x, y, who, s = 1, P = {}) {
  const t = (c) => (P.tint ? mix(c, P.tint[0], P.tint[1] * 1.3) : c);
  if (who === 'isla') {
    shape([[x - 3 * s, y - 3 * s], [x - 3.6 * s, y - 10 * s], [x, y - 12 * s], [x + 3.6 * s, y - 10 * s], [x + 3 * s, y - 3 * s]], t('#d8453b'), { w: 1.1 });
    shape(I.rectPts(x - 2.6 * s, y - 3 * s, 2.2 * s, 3 * s), t('#f2c230'), { w: 0.9, lin: true }); shape(I.rectPts(x + 0.4 * s, y - 3 * s, 2.2 * s, 3 * s), t('#f2c230'), { w: 0.9, lin: true });
    shape(I.ell(x, y - 14.5 * s, 3.2 * s, 3.2 * s, 10), t('#6b3f26'), { w: 1.1 });
  } else {
    shape([[x - 3 * s, y], [x - 3.6 * s, y - 15 * s], [x, y - 18 * s], [x + 3.6 * s, y - 15 * s], [x + 3 * s, y]], t('#4f7a55'), { w: 1.1 });
    shape(I.ell(x + 0.4 * s, y - 21 * s, 3 * s, 3.4 * s, 10), t('#f0c49d'), { w: 1.1 });
    shape([[x - 3.4 * s, y - 22.5 * s], [x + 4.6 * s, y - 23.5 * s], [x + 5.4 * s, y - 21.5 * s], [x - 3.2 * s, y - 21 * s]], t('#6f6152'), { w: 1 });
    line([[x + 4.5 * s, y - 9 * s], [x + 6.5 * s, y]], 1.3, { color: t('#8a5a33') });
  }
}
function gate(x, y, s, P) {
  const c = P === TIMES.night ? '#4a4f78' : '#e9e2d0';
  [0, 30].forEach((dx) => shape(I.rectPts(x + dx * s, y - 22 * s, 4 * s, 24 * s), c, { w: 1.2, lin: true }));
  for (let k = 0; k < 4; k++) line([[x + 4 * s, y - (19 - k * 5) * s], [x + 30 * s, y - (19 - k * 5) * s]], 1.6, { color: c });
  line([[x + 4 * s, y - 4 * s], [x + 30 * s, y - 19 * s]], 1.6, { color: c });
}
function hill(w, h, P, o = {}) {
  sky(w, h, P);
  if (P.sun) SC.sun(P.sun[0] * w, P.sun[1] * h, h * 0.075, P.sun[2], { glow: P.sun[2] });
  if (o.stars) SC.stars(w, h * 0.5, 60, '#fff3cf');
  if (P.clouds) { scallopCloud(w * 0.3, h * 0.2, 0.8); scallopCloud(w * 0.86, h * 0.12, 0.6); }
  // far hills fade into the sky
  shape([[-10, h], [-10, h * 0.56], [w * 0.2, h * 0.5], [w * 0.45, h * 0.58], [w * 0.9, h * 0.44], [w + 10, h * 0.48], [w + 10, h]], P.far, { w: SC.BG });
  const hp = [[-10, h + 10], [-10, h * 0.9], [w * 0.14, h * 0.62], [w * 0.36, h * 0.3], [w * 0.52, h * 0.19], [w * 0.64, h * 0.16], [w * 0.76, h * 0.22], [w * 0.92, h * 0.42], [w + 10, h * 0.56], [w + 10, h + 10]];
  shape(hp, P.hill, { w: SC.BG });
  I.clipPoly(hp, () => {
    // shadow side of the hill (away from the light)
    if (P.shade) I.fill([[w * 0.64, h * 0.1], [w + 20, h * 0.4], [w + 20, h + 20], [w * 0.7, h + 20], [w * 0.8, h * 0.6]], P.shade, { wob: 0.5 });
    // field boundaries: hedgerows following the slope, a few per row
    for (let rI = 0; rI < 6; rI++) {
      const y0 = h * (0.3 + rI * 0.12);
      line([[-10, y0 + 12], [w * 0.3, y0 - 4], [w * 0.62, y0 + 6], [w + 10, y0 - 8]], 3 + rI * 0.4, { color: P.hedge, taper: [0.05, 0.05], wob: 0.8 });
      for (let c = 1; c < 3 + rI; c++) { const x = (c / (3 + rI)) * w + (rI % 2) * 30; line([[x, y0 + 2], [x - 10, y0 + h * 0.12]], 2 + rI * 0.3, { color: P.hedge, taper: [0.05, 0.05], wob: 0.8 }); }
    }
    for (let k = 0; k < 50; k++) I.fill(I.ell(I.rng() * w, h * 0.3 + I.rng() * h * 0.7, 1.2, 0.9, 5), P.hedge, { wob: 0, op: 0.7 });
    if (!P.tint || P === TIMES.after) [[0.5, 0.86], [0.56, 0.88], [0.9, 0.7], [0.12, 0.84], [0.4, 0.52]].forEach(([x, y]) => { I.fill(I.ell(x * w, y * h, 5, 3.4, 8), '#ffffff', { wob: 0.2 }); I.fill(I.ell(x * w + 5, y * h - 1, 1.8, 1.8, 6), INK, { wob: 0 }); });
  });
  const rp = ROAD.map(([x, y]) => [x * w, y * h]);
  I.ink(rp, h * 0.032, { color: INK, taper: [0.05, 0.02], wob: 0.2, vary: 0.02, minW: 0.6 });
  I.ink(rp, h * 0.032 - 3, { color: P.road, taper: [0.05, 0.02], wob: 0, vary: 0.02, minW: 0.6 });
  [[0.26, 0.74], [0.6, 0.66], [0.2, 0.47], [0.86, 0.6], [0.34, 0.4], [0.88, 0.35]].forEach(([x, y]) => lollipop(x * w, y * h, h * (0.032 - y * 0.012), P));
  inn(w * 0.64, h * 0.2, h / 420, P, { lit: o.lit, smoke: o.smoke });
  gate(w * 0.03, h * 0.97, h / 330, P);
  if (o.figs != null) {
    const [x, y, sd] = roadAt(o.figs, w, h);
    const s = (h / 330) * (1.7 - o.figs * 0.9);
    tiny(x - sd * 8 * s, y + 2, 'grandad', s, P);
    tiny(x + sd * 4 * s, y + 2, 'isla', s, P);
    if (o.lit) PG.glow(x, y - 8 * s, 18 * s, '#ffcf6a', 0.25);
  }
}

// ---------------------------------------------------------------- title
function credits(x, y, runs) {
  I.emit(`<text x="${x}" y="${y}" font-family="Letter" font-size="13" letter-spacing="2">${runs.map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, ' ')}</tspan>`).join('')}</text>`);
}
function title(y0) {
  // one rising line, like the road
  PG.sfx(112, y0 + 150, 'UP-HILL', { size: 118, color: '#d8453b', anchor: 'start', rot: -9, sw: 3.4, ls: 4 });
  credits(118, y0 + 196, [['WORDS BY ', INK], ['CHRISTINA ROSSETTI', '#d8453b'], ['      ART BY ', INK], ['CLAUDE', '#4f7a55']]);
  // spot: a lantern hanging by an inn door
  I.grp(`translate(760 ${y0 + 12})`, () => {
    PG.glow(80, 104, 110, '#ffcf6a', 0.55);
    shape(I.rectPts(20, 20, 120, 170), '#8a5a3a', { w: LW.contour, lin: true });
    shape(I.rectPts(34, 34, 92, 156), '#b0784a', { w: LW.detail, lin: true });
    [[40, 44], [84, 44], [40, 110], [84, 110]].forEach(([x, y]) => shape(I.rectPts(x, y, 36, 58), '#c28a58', { w: LW.fine, lin: true }));
    shape(I.ell(114, 118, 5, 5, 8), '#e0b64a', { w: 1.2 });
    line([[150, 30], [150, 60], [168, 60]], 2.4);
    line([[168, 60], [168, 76]], 1.6);
    shape([[160, 76], [176, 76], [180, 110], [156, 110]], '#3a3a4a', { w: LW.detail, lin: true });
    shape([[162, 80], [174, 80], [176, 106], [160, 106]], '#ffd26a', { w: 1.2, lin: true });
  });
}

// ---------------------------------------------------------------- page
function page() {
  title(20);
  let y = 250;
  const G = PG.GUT_V;
  const HILL_H = 300;
  let r;

  // 1 — dawn, the whole hill
  r = PG.row(y, HILL_H, [1]);
  PG.panel(r[0], null, (w, h) => hill(w, h, TIMES.dawn, { figs: 0.03, smoke: '#ffffff' }), (w, h) => {
    const [fx, fy] = roadAt(0.03, w, h);
    const s1 = (h / 330) * (1.7 - 0.03 * 0.9);
    PG.balloon(fx + 130, fy - 150, ['DOES THE ROAD WIND', 'UP-HILL ALL THE WAY?'], fx + 4 * s1, fy - 18 * s1);
    PG.balloon(fx + 190, fy - 62, ['YES, TO THE', 'VERY END.'], fx - 8 * s1, fy - 27 * s1);
  });
  y += HILL_H + G;

  // 2 — noon: walking hand in hand; 2b — insert: the hands
  r = PG.row(y, 300, [1.7, 1]);
  PG.panel(r[0], null, (w, h) => {
    const P = TIMES.noon;
    sky(w, h, P);
    scallopCloud(w * 0.18, h * 0.3, 0.7); scallopCloud(w * 0.86, h * 0.2, 0.55);
    shape([[-10, h * 0.66], [w * 0.5, h * 0.58], [w + 10, h * 0.5], [w + 10, h + 10], [-10, h + 10]], P.hill, { w: SC.BG });
    for (let x = -20; x < w + 30; x += 24) { const yy = h * 0.64 - (x / w) * h * 0.16 - 18; shape([[x - 12, yy + 14], [x - 13, yy + 3], [x - 4, yy - 2], [x + 8, yy], [x + 12, yy + 12]], P.wall, { w: LW.fine, lin: true }); }
    shape([[-10, h * 0.8], [w + 10, h * 0.64], [w + 10, h * 0.76], [-10, h * 0.92]], P.road, { w: LW.fine });
    const g = F.rig(C.grandad, { x: w * 0.54, y: h * 0.8, s: 1, yaw: 62, lean: 6, legN: [22, -4], legF: [-16, 18] });
    const i0 = F.rig(C.isla, { x: w * 0.44, y: h * 0.84, s: 1, yaw: 55, legN: [26, -6], legF: [-20, 24] });
    // the clasp point: between her raised hand and his lowered one
    const clasp = [i0.shN[0] + 34, i0.shN[1] - 25];
    const ri = F.fig(C.isla, { x: w * 0.44, y: h * 0.84, s: 1, yaw: 55, legN: [26, -6], legF: [-20, 24], armF: [-20, 12], reachN: clasp, bendN: 1, handN: 'grip', head: { yaw: 60, pitch: 10, look: [0.5, -0.8], mood: 'neutral' } });
    const rg = F.fig(C.grandad, { x: w * 0.54, y: h * 0.8, s: 1, yaw: 62, lean: 6, legN: [22, -4], legF: [-16, 18], reachF: [g.shF[0] + 30, g.shF[1] + 58], bendF: 1, reachN: [clasp[0] + 3, clasp[1] - 3], bendN: 1, handN: 'grip', handF: 'grip', stick: { far: true, lean: 10 }, head: { yaw: 30, look: [-0.6, 0.6], mood: 'smile' } });
    SPK.p2 = { isla: F.mouth(ri), gd: F.mouth(rg) };
    PG.groundShadow(w * 0.44, h * 0.85, 60); PG.groundShadow(w * 0.54, h * 0.81, 80);
  }, (w, h) => {
    PG.balloon(150, 52, ['WILL THE DAY\'S JOURNEY', 'TAKE THE WHOLE LONG DAY?'], ...SPK.p2.isla);
    PG.balloon(w - 110, 70, ['FROM MORN TO', 'NIGHT, MY FRIEND.'], ...SPK.p2.gd);
  });
  PG.panel(r[1], null, (w, h) => {
    I.rect(0, 0, w, h, TIMES.noon.hill);
    I.rect(0, 0, w, h, PG.radial(w * 0.5, h * 0.5, w * 0.8, [[0, '#c9e8b0'], [1, '#8cc56f']]));
    // her small hand held in his big old one: his palm wraps round from the right, thumb over her knuckles
    const gs = C.grandad.head.skin, is = C.isla.head.skin;
    tube([[-40, h + 20], [w * 0.34, h * 0.6]], 46, C.isla.top.color, 2.3);
    line([[w * 0.24, h * 0.74], [w * 0.3, h * 0.64]], LW.fine);
    // her hand (fingers pointing up-right, mostly hidden)
    shape([[w * 0.3, h * 0.66], [w * 0.36, h * 0.52], [w * 0.46, h * 0.46], [w * 0.52, h * 0.5], [w * 0.48, h * 0.62], [w * 0.38, h * 0.7]], is, { w: LW.detail });
    // his sleeve and wrist from the top right
    tube([[w + 40, -40], [w * 0.74, h * 0.3]], 62, C.grandad.top.color, 2.3);
    line([[w * 0.8, h * 0.22], [w * 0.7, h * 0.36]], LW.fine);
    // his palm and curled fingers closing round her hand
    shape([[w * 0.66, h * 0.26], [w * 0.8, h * 0.36], [w * 0.74, h * 0.62], [w * 0.56, h * 0.74], [w * 0.42, h * 0.72], [w * 0.44, h * 0.6], [w * 0.56, h * 0.5]], gs, { w: LW.contour });
    [[0.44, 0.62, 0.6], [0.47, 0.67, 0.64], [0.5, 0.71, 0.68]].forEach(([x, yy, x2]) => line([[w * x, h * yy], [w * x2, h * (yy - 0.02)]], LW.detail));
    // his thumb over her knuckles
    shape([[w * 0.62, h * 0.36], [w * 0.52, h * 0.4], [w * 0.44, h * 0.42], [w * 0.42, h * 0.47], [w * 0.5, h * 0.49], [w * 0.62, h * 0.46]], gs, { w: LW.contour });
    // age: a few creases and spots
    [[0.7, 0.44], [0.66, 0.52], [0.72, 0.36]].forEach(([x, yy]) => I.fill(I.ell(w * x, h * yy, 3, 2, 6), '#c9936c', { wob: 0 }));
    line([[w * 0.58, h * 0.56], [w * 0.64, h * 0.54]], LW.fine, { op: 0.7 });
  });
  y += 300 + G;

  // 3 — afternoon, same hill: halfway
  r = PG.row(y, HILL_H, [1]);
  PG.panel(r[0], null, (w, h) => hill(w, h, TIMES.after, { figs: 0.46 }));
  y += HILL_H + G;

  // 4 — on the wall, sharing a sandwich; long shadows
  r = PG.row(y, 300, [1]);
  PG.panel(r[0], null, (w, h) => {
    const P = TIMES.after;
    sky(w, h, P);
    SC.sun(w * 0.1, h * 0.4, 30, '#fff1c2', { glow: '#fff1c2' });
    shape([[-10, h * 0.55], [w * 0.3, h * 0.48], [w * 0.7, h * 0.52], [w + 10, h * 0.44], [w + 10, h + 10], [-10, h + 10]], P.far, { w: SC.BG });
    shape([[-10, h * 0.76], [w + 10, h * 0.72], [w + 10, h + 10], [-10, h + 10]], P.hill, { w: SC.BG });
    // the wall: irregular stones, cope stones on top, and its shadow falling right
    const wy = h * 0.86, top = h * 0.66;
    I.fill([[w * 0.1, wy], [w * 0.92, wy], [w + 40, h + 10], [w * 0.3, h + 10]], '#000000', { op: 0.14, lin: true });
    shape([[w * 0.08, wy], [w * 0.08, top + 10], [w * 0.92, top + 10], [w * 0.92, wy]], P.wall, { w: LW.detail, lin: true });
    I.clipRect(w * 0.08, top + 10, w * 0.84, wy - top - 10, () => {
      for (let rr = 0; rr < 4; rr++) for (let x = w * 0.08 - 20 + (rr % 2) * 18; x < w * 0.95; x += 30 + (rr * 7) % 11) {
        const yy = top + 14 + rr * 18, ww = 26 + ((x * 7) % 9);
        shape([[x, yy + 16], [x + 2, yy + 3], [x + ww * 0.4, yy], [x + ww, yy + 4], [x + ww - 2, yy + 16]], mix(P.wall, rr % 2 ? '#ffffff' : '#7a6a4a', 0.12), { w: LW.fine, lin: true });
      }
    });
    for (let x = w * 0.08; x < w * 0.92; x += 16) shape([[x, top + 12], [x + 2, top - 2], [x + 12, top - 4], [x + 14, top + 12]], mix(P.wall, '#7a6a4a', 0.18), { w: LW.fine, lin: true });
    // their long shadows across the grass to the right
    I.fill([[w * 0.36, wy], [w * 0.44, wy], [w * 0.74, h + 10], [w * 0.6, h + 10]], '#5a4a2a', { op: 0.18, lin: true });
    I.fill([[w * 0.56, wy], [w * 0.64, wy], [w * 0.98, h + 10], [w * 0.84, h + 10]], '#5a4a2a', { op: 0.18, lin: true });
    const seatY = top - 2;
    const iRig = F.rig(C.isla, { x: w * 0.4, y: seatY, sit: 0, s: 1, yaw: 60, legN: [0, 4], legF: [0, 10] });
    const sandwich = [iRig.shN[0] + 44, iRig.shN[1] + 30];
    const ri4 = F.fig(C.isla, { x: w * 0.4, y: seatY, sit: 0, s: 1, yaw: 60, legN: [0, 4], legF: [0, 10], armF: [20, 40], reachN: [sandwich[0] - 8, sandwich[1] + 4], handN: 'grip', tint: tint(P), head: { yaw: 55, pitch: 6, look: [0.8, -0.3], mood: 'worried' } });
    // the sandwich: bread and a green edge of lettuce, between their hands
    shape([[sandwich[0] - 12, sandwich[1] - 10], [sandwich[0] + 16, sandwich[1] - 14], [sandwich[0] + 18, sandwich[1] + 4], [sandwich[0] - 10, sandwich[1] + 8]], '#f6e1b0', { w: LW.detail, lin: true });
    line([[sandwich[0] - 11, sandwich[1] - 1], [sandwich[0] + 17, sandwich[1] - 5]], 3.4, { color: '#7fb34a', taper: [0, 0] });
    const half = [sandwich[0] + 44, sandwich[1] - 6];
    shape([[half[0] - 12, half[1] - 10], [half[0] + 12, half[1] - 12], [half[0] + 14, half[1] + 4], [half[0] - 10, half[1] + 6]], '#f6e1b0', { w: LW.detail, lin: true });
    line([[half[0] - 11, half[1] - 2], [half[0] + 13, half[1] - 5]], 3.4, { color: '#7fb34a', taper: [0, 0] });
    const rg4 = F.fig(C.grandad, { x: w * 0.6, y: seatY, sit: 0, s: 1, yaw: -60, legN: [0, 4], legF: [0, 10], armF: [10, 30], reachN: [half[0] + 8, half[1] + 2], armOver: true, handN: 'grip', handF: 'relaxed', stick: null, tint: tint(P), head: { yaw: -55, look: [-0.8, 0.2], mood: 'smile' } });
    SPK.p4 = { isla: F.mouth(ri4), gd: F.mouth(rg4) };
  }, (w, h) => {
    PG.balloon(220, 56, ['BUT IS THERE FOR THE NIGHT', 'A RESTING-PLACE?'], ...SPK.p4.isla);
    PG.balloon(w - 230, 78, ['A ROOF FOR WHEN THE', 'SLOW DARK HOURS BEGIN.'], ...SPK.p4.gd);
  });
  y += 300 + G;

  // 5 — dusk, same hill: near the top, the window lit
  r = PG.row(y, HILL_H, [1]);
  PG.panel(r[0], null, (w, h) => hill(w, h, TIMES.dusk, { figs: 0.86, lit: true }));
  y += HILL_H + G;

  // 6 — Isla, tight; 7 — Grandad kneels and points
  r = PG.row(y, 310, [1, 1.35]);
  PG.panel(r[0], null, (w, h) => {
    const P = TIMES.dusk;
    sky(w, h, P);
    for (let k = 0; k < 6; k++) { const x = (k / 5) * w, r0 = 50 + (k % 2) * 20; shape(I.ell(x, h * 0.32 - (k % 3) * 20, r0, r0 * 1.2, 16), '#2c3158', { w: LW.fine }); }
    // tight close-up: top of the hair and the chin run off the panel
    shape([[-10, h + 10], [w * 0.12, h * 0.9], [w * 0.88, h * 0.9], [w + 10, h + 10]], mix(C.isla.top.color, P.tint[0], 0.3), { w: LW.contour });
    HD.head(F.tinted(C.isla, P.tint[0], 0.2).head, { x: w * 0.5, y: h * 0.56, s: 4.6, yaw: 16, look: [0.3, -0.75], mood: 'worried' });
  }, (w, h) => PG.balloon(w * 0.5, 40, ['MAY NOT THE DARKNESS', 'HIDE IT FROM MY FACE?'], w * 0.5, 120, { size: 14 }));
  PG.panel(r[1], null, (w, h) => {
    const P = TIMES.dusk;
    sky(w, h, P);
    // the hill crest with the inn up in the corner
    shape([[w * 0.42, h + 10], [w * 0.5, h * 0.5], [w * 0.8, h * 0.28], [w + 10, h * 0.3], [w + 10, h + 10]], '#2c3158', { w: SC.BG });
    inn(w * 0.84, h * 0.24, 0.9, P, { lit: true });
    shape([[-10, h * 0.78], [w + 10, h * 0.68], [w + 10, h + 10], [-10, h + 10]], P.hill, { w: SC.BG });
    const iR = F.rig(C.isla, { x: w * 0.58, y: h * 0.96, s: 1, yaw: 30 });
    const rg7 = F.fig(C.grandad, { x: w * 0.3, y: h * 0.97, s: 1, yaw: 55, lean: 14, sit: 0, plant: true, kneel: true, legN: [28, -2], legF: [-50, -85], armF: [16, 30], reachN: [w * 0.78, h * 0.5], bendN: -1, handN: 'point', tint: tint(P), head: { yaw: 40, pitch: 10, look: [0.7, -0.9], mood: 'smile' } });
    F.fig(C.isla, { x: w * 0.58, y: h * 0.96, s: 1, yaw: 30, armN: [8, 10], armF: [-8, 10], tint: tint(P), head: { yaw: 45, pitch: 12, look: [0.6, -1], mood: 'shock', mouth: 'o' } });
    SPK.p7 = F.mouth(rg7); void iR;
  }, (w, h) => PG.balloon(110, 46, ['YOU CANNOT', 'MISS THAT INN.'], ...SPK.p7, { size: 14 }));
  y += 310 + G;

  // 8 — night: the others on the road ahead
  r = PG.row(y, 360, [1]);
  PG.panel(r[0], null, (w, h) => {
    const P = TIMES.night;
    sky(w, h, P);
    SC.stars(w, h * 0.5, 90, '#fff3cf');
    SC.moon(w * 0.1, h * 0.16, 20, '#fff3c4', P.skyTop);
    // ridge behind, then the road rising away to the right
    shape([[-10, h * 0.62], [w * 0.5, h * 0.48], [w + 10, h * 0.3], [w + 10, h + 10], [-10, h + 10]], P.hill, { w: SC.BG });
    const rp = [[w * 0.05, h + 20], [w * 0.4, h * 0.76], [w * 0.7, h * 0.52], [w + 10, h * 0.34]];
    I.ink(rp, 70, { color: INK, taper: [0, 0.9], wob: 0.2, minW: 0.08 });
    I.ink(rp, 66, { color: P.road, taper: [0, 0.9], wob: 0, minW: 0.08 });
    const people = [
      { H: 3.6, head: { skin: '#0e1230', hair: '#0e1230', hairStyle: 'bun', R: 26 }, top: { color: '#0e1230', sleeve: 'long' }, bottom: { type: 'dress', color: '#0e1230' }, shoes: '#0e1230' },
      { ...C.grandad, head: { ...C.grandad.head } },
      { H: 2.7, head: { skin: '#0e1230', hair: '#0e1230', hairStyle: 'pigtails', R: 24 }, top: { color: '#0e1230', sleeve: 'long' }, bottom: { type: 'skirt', color: '#0e1230' }, shoes: '#0e1230' },
      { H: 3.9, build: 1.2, head: { skin: '#0e1230', hair: '#0e1230', hairStyle: 'short', R: 26, hat: { type: 'cap', color: '#0e1230' } }, top: { color: '#0e1230', sleeve: 'long', type: 'coat' }, bottom: { type: 'pants', color: '#0e1230' }, shoes: '#0e1230' },
      { H: 3.4, head: { skin: '#0e1230', hair: '#0e1230', hairStyle: 'long', R: 26 }, top: { color: '#0e1230', sleeve: 'long' }, bottom: { type: 'dress', color: '#0e1230' }, shoes: '#0e1230' },
      { H: 3.6, head: { skin: '#0e1230', hair: '#0e1230', hairStyle: 'short', hairline: -1.1, R: 26 }, top: { color: '#0e1230', sleeve: 'long' }, bottom: { type: 'pants', color: '#0e1230' }, shoes: '#0e1230' },
    ];
    [[0.5, 0.66, 0.5], [0.6, 0.58, 0.44], [0.68, 0.53, 0.4], [0.77, 0.47, 0.34], [0.86, 0.41, 0.29], [0.93, 0.37, 0.25]].forEach(([x, yy, s], i) => {
      const lx = x * w, ly = yy * h;
      const fade = mix('#0a0e26', P.skyLow, i * 0.08);
      const rr = F.fig(people[i], { x: lx, y: ly, s: s * 0.95, yaw: 62, lean: 3, armN: [14, 6], armF: [-12, 10], legN: [14 - (i % 2) * 8, 0], legF: [-12 + (i % 2) * 8, 10], sil: fade, head: { yaw: 70 }, stick: i === 5 ? { color: fade } : null });
      const [hx, hy] = i === 5 ? rr.armF[2] : rr.armN[2];
      PG.glow(hx + 2, hy + 16 * s, 70 * s, '#ffcf6a', 0.55);
      I.fill(I.ell(hx + 10 * s, ly + 2, 40 * s, 8 * s, 12), '#ffcf6a', { op: 0.25, wob: 0 });
      line([[hx, hy], [hx + 2, hy + 10 * s]], 1.2, { color: fade });
      shape(I.ell(hx + 2, hy + 18 * s, 5 * s, 7 * s, 10), '#ffd26a', { w: LW.fine });
    });
    // Isla and Grandad from behind, bottom left, hand in hand
    const gR = F.rig(C.grandad, { x: w * 0.16, y: h + 60, s: 1.25, yaw: 160 });
    F.fig(C.grandad, { x: w * 0.16, y: h + 60, s: 1.25, yaw: 160, armN: [4, 4], armF: [-4, 6], tint: tint(P), head: { yaw: 162, pitch: 6 } });
    const ri8 = F.fig(C.isla, { x: w * 0.3, y: h + 40, s: 1.25, yaw: 165, armN: [4, 4], armF: [-4, 4], tint: tint(P), head: { yaw: 150, pitch: 12 } });
    SPK.p8 = { isla: [ri8.headC[0], ri8.headC[1] - ri8.R * 1.2], gd: [gR.headC[0], gR.headC[1] - gR.R * 1.3] };
  }, (w, h) => {
    PG.balloon(w * 0.36, 56, ['SHALL I MEET OTHER', 'WAYFARERS AT NIGHT?'], ...SPK.p8.isla);
    PG.balloon(w * 0.16, 120, ['THOSE WHO HAVE', 'GONE BEFORE.'], ...SPK.p8.gd, { size: 14 });
  });
  y += 360 + G;

  // 9 — carried up the last steps; 10 — the door opens
  r = PG.row(y, 420, [1, 1.25]);
  PG.panel(r[0], null, (w, h) => {
    const P = TIMES.night;
    sky(w, h, P);
    SC.stars(w, h * 0.45, 40, '#fff3cf');
    PG.glow(w * 0.95, h * 0.1, 90, '#ffcf6a', 0.5);
    for (let k = 0; k < 7; k++) shape(I.rectPts(w * 0.05 + k * 46, h * 0.92 - k * 30, w, 44), k % 2 ? '#2e355c' : '#353d66', { w: LW.fine, lin: true });
    const gx = w * 0.4, gy = h * 0.92 - 2 * 30;
    const g = F.rig(C.grandad, { x: gx, y: gy, s: 1.15, yaw: 58, lean: 24, legN: [34, -12], legF: [-12, 22] });
    const T = tint(P);
    const isla = F.tinted(C.isla, T[0], T[1]);
    const back = [g.neck[0] - 30, g.neck[1] + 22];
    // her far leg and coat behind his back
    limb([[back[0] - 6, back[1] + 70], [back[0] + 26, back[1] + 88], [back[0] + 34, back[1] + 118]], [7, 6, 5], isla.bottom.color, { w: LW.line });
    shape([[back[0] - 26, back[1] - 18], [back[0] + 10, back[1] - 26], [back[0] + 14, back[1] + 70], [back[0] - 30, back[1] + 78]], isla.top.color, { w: LW.contour });
    F.fig(C.grandad, { x: gx, y: gy, s: 1.15, yaw: 58, lean: 24, legN: [34, -12], legF: [-12, 22], reachN: [back[0] + 34, back[1] + 90], reachF: [back[0] + 20, back[1] + 86], handN: 'grip', handF: 'grip', tint: T, head: { yaw: 55, pitch: 6, look: [0.7, -0.6], mood: 'smile' } });
    // her near leg round his hip, boot swinging
    limb([[back[0] + 14, back[1] + 74], [g.hip[0] + 18, g.hip[1] - 20], [g.hip[0] + 22, g.hip[1] + 12]], [7, 6, 5.5], isla.bottom.color, { w: LW.line });
    shape([[g.hip[0] + 14, g.hip[1] + 8], [g.hip[0] + 30, g.hip[1] + 8], [g.hip[0] + 36, g.hip[1] + 20], [g.hip[0] + 14, g.hip[1] + 22]], isla.shoes, { w: LW.detail });
    // her head on his far shoulder, arm draped over the near one
    SPK.p9 = { isla: [g.neck[0] - 40, g.neck[1] - 30], gd: F.mouth(g) };
    HD.head(isla.head, { x: g.neck[0] - 44, y: g.neck[1] - 8, s: 1.05, yaw: 70, blink: true, mood: 'shut', mouth: 'smile' });
    limb([[g.neck[0] - 12, g.neck[1] - 2], [g.neck[0] + 14, g.neck[1] + 12], [g.neck[0] + 22, g.neck[1] + 26]], [5.5, 5, 4.5], isla.top.color, { w: LW.line });
    hand(g.neck[0] + 22, g.neck[1] + 26, 80, 1.0, 'relaxed', { skin: isla.head.skin });
    I.text(g.neck[0] - 60, g.neck[1] - 46, 'z', { font: 'Title', size: 22, color: '#ffffff' });
    I.text(g.neck[0] - 44, g.neck[1] - 66, 'z', { font: 'Title', size: 28, color: '#ffffff' });
  }, (w, h) => {
    PG.balloon(w * 0.36, 52, ['THEN MUST I KNOCK, OR', 'CALL WHEN JUST IN SIGHT?'], ...SPK.p9.isla, { size: 14, quiet: true });
    PG.balloon(w * 0.66, h * 0.6, ['THEY WILL NOT KEEP YOU', 'STANDING AT THAT DOOR.'], ...SPK.p9.gd, { size: 14 });
  });
  PG.panel(r[1], null, (w, h) => {
    const P = TIMES.night;
    I.rect(0, 0, w, h, '#232948');
    for (let k = 0; k < 12; k++) shape(I.rectPts((k % 4) * (w / 4) - 10 + (Math.floor(k / 4) % 2) * 30, Math.floor(k / 4) * (h / 3), w / 4, h / 3), '#2a3052', { w: LW.fine, lin: true });
    const dx = w * 0.2, dy = h * 0.06, dw = w * 0.62, dh = h * 0.8;
    shape(I.rectPts(dx - 14, dy - 14, dw + 28, dh + 14), '#5a3a2a', { w: LW.detail, lin: true });
    I.clipRect(dx, dy, dw, dh, () => {
      I.rect(dx, dy, dw, dh, PG.radial(dx + dw * 0.7, dy + dh * 0.6, dw, [[0, '#fff0c2'], [1, '#f2a24a']]));
      // hearth with flames
      shape(I.rectPts(dx + dw * 0.64, dy + dh * 0.4, dw * 0.34, dh * 0.4), '#b0663e', { w: LW.fine, lin: true });
      shape(I.rectPts(dx + dw * 0.7, dy + dh * 0.52, dw * 0.22, dh * 0.28), '#3a2018', { w: LW.fine, lin: true });
      PG.glow(dx + dw * 0.81, dy + dh * 0.72, 80, '#ff9a3a', 0.8);
      [[0, 0, 1], [-10, 4, 0.7], [10, 4, 0.8]].forEach(([ox, oy, k]) => shape([[dx + dw * 0.81 + ox - 12 * k, dy + dh * 0.8], [dx + dw * 0.81 + ox - 8 * k, dy + dh * 0.7 + oy], [dx + dw * 0.81 + ox, dy + dh * 0.6 + oy], [dx + dw * 0.81 + ox + 6 * k, dy + dh * 0.72 + oy], [dx + dw * 0.81 + ox + 12 * k, dy + dh * 0.8]], k === 1 ? '#ffb13a' : '#ffdb6a', { w: LW.fine }));
      // the people who went before: the lantern-carriers, now in colour and smiling
      const folk = [
        { H: 3.6, head: { skin: '#e3b08a', hair: '#dcd8d0', hairStyle: 'bun', R: 22, age: 0.8, tall: 1.1, glasses: '#6b4a2e' }, top: { color: '#a0463e', sleeve: 'long' }, bottom: { type: 'dress', color: '#a0463e' }, shoes: '#3a2a22' },
        { H: 3.9, build: 1.2, head: { skin: '#c89070', hair: '#5a4a3a', hairStyle: 'short', R: 22, age: 0.5, beard: '#5a4a3a', hat: { type: 'cap', color: '#3f4a5a' } }, top: { color: '#5a6a8a', sleeve: 'long', type: 'coat' }, bottom: { type: 'pants', color: '#3a3f58' }, shoes: '#3a2a22' },
        { H: 2.7, head: { skin: '#b9825e', hair: '#2a1f24', hairStyle: 'pigtails', R: 21, blush: 1 }, top: { color: '#e0b24a', sleeve: 'long' }, bottom: { type: 'skirt', color: '#6f9a6a' }, shoes: '#3a2a22' },
        { H: 3.4, head: { skin: '#f0c9a8', hair: '#8a6a50', hairStyle: 'long', R: 22, age: 0.3, lashes: 2 }, top: { color: '#6f9a6a', sleeve: 'long' }, bottom: { type: 'dress', color: '#6f9a6a' }, shoes: '#3a2a22' },
        { H: 3.6, head: { skin: '#8a5a3e', hair: '#e6e2da', hairStyle: 'short', hairline: -1.1, R: 22, age: 0.9, moustache: '#e6e2da', browCol: '#e6e2da' }, top: { color: '#8a5a8a', sleeve: 'long' }, bottom: { type: 'pants', color: '#3a3f58' }, shoes: '#3a2a22' },
      ];
      const fy = dy + dh + 4;
      F.fig(folk[4], { x: dx + dw * 0.14, y: fy, s: 0.9, yaw: 20, armN: [110, 30], handN: 'open', head: { yaw: 15, mood: 'smile' } });
      F.fig(folk[1], { x: dx + dw * 0.34, y: fy, s: 0.92, yaw: -10, armN: [120, 20], armF: [110, 20], handN: 'open', handF: 'open', head: { yaw: -5, mood: 'joy' } });
      F.fig(folk[2], { x: dx + dw * 0.5, y: fy, s: 0.95, yaw: 10, armN: [150, 10], armF: [150, 10], handN: 'open', handF: 'open', head: { yaw: 5, mood: 'joy' } });
      F.fig(folk[3], { x: dx + dw * 0.64, y: fy, s: 0.9, yaw: -20, armN: [90, 40], handN: 'open', head: { yaw: -15, mood: 'smile' } });
      F.fig(folk[0], { x: dx + dw * 0.86, y: fy, s: 0.92, yaw: -35, armN: [140, 20], armF: [20, 10], handN: 'open', head: { yaw: -30, mood: 'smile' } });
    });
    // light spilling out across the step and over our two
    I.fill([[dx, dy + dh], [dx + dw, dy + dh], [w + 30, h + 10], [-30, h + 10]], '#ffcf6a', { op: 0.3, lin: true });
    const warm = ['#ff9a3a', 0.22];
    const g = F.rig(C.grandad, { x: w * 0.3, y: h + 90, s: 1.35, yaw: 125 });
    F.fig(C.grandad, { x: w * 0.3, y: h + 90, s: 1.35, yaw: 125, armN: [-10, 60], armF: [-20, 60], tint: warm, head: { yaw: 112, look: [0.6, 0], mood: 'smile' } });
    HD.head(F.tinted(C.isla, warm[0], warm[1]).head, { x: g.neck[0] - 78, y: g.neck[1] - 16, s: 1.2, yaw: 100, look: [0.8, -0.2], mood: 'sly' });
    SPK.p10 = { isla: [g.neck[0] - 70, g.neck[1] - 56], gd: [g.headC[0] + 12, g.headC[1] - g.R * 1.3] };
  }, (w, h) => {
    PG.balloon(w * 0.25, 40, ['SHALL I FIND COMFORT,', 'TRAVEL-SORE AND WEAK?'], ...SPK.p10.isla, { size: 13.5, quiet: true });
    PG.balloon(w * 0.75, 112, ['OF LABOUR YOU SHALL', 'FIND THE SUM.'], ...SPK.p10.gd, { size: 13.5 });
  });
  y += 420 + G;

  // 11 — the bed
  const SH = 620;
  r = PG.row(y, SH, [1]);
  PG.panel(r[0], null, (w, h) => {
    const T = ['#2b2f58', 0.3];
    I.rect(0, 0, w, h, '#2b2f58');
    I.rect(0, 0, w, h * 0.78, PG.radial(w * 0.62, h * 0.62, w * 0.7, [[0, '#7a6488'], [1, '#2b2f58']]));
    I.rect(0, h * 0.78, w, h * 0.22, '#3b2f45');
    line([[-4, h * 0.78], [w + 4, h * 0.78]], LW.detail, { taper: [0, 0] });
    for (let x = 20; x < w; x += 70) line([[x, h * 0.78], [x - 30, h + 4]], 1.2, { color: '#2a2034', taper: [0, 0] });
    SC.windowFrame(w * 0.54, h * 0.08, w * 0.3, h * 0.36, { sky: '#141a38', frame: '#8a6a50', view: (x, yy, ww, hh) => { SC.stars(ww + x, hh + yy, 80, '#fff3cf'); SC.moon(x + ww * 0.72, yy + hh * 0.3, 22, '#fff3c4', '#141a38'); }, sill: true });
    const bx = w * 0.06, by = h * 0.52, bw = w * 0.5, bh = h * 0.28;
    shape(I.rectPts(bx, by - 80, 26, bh + 80), '#8a5a3a', { w: LW.contour, lin: true });
    shape(I.rectPts(bx + bw, by + 16, 22, bh - 16), '#8a5a3a', { w: LW.contour, lin: true });
    shape(I.rectPts(bx + 20, by + bh * 0.55, bw, bh * 0.45), '#6e4a33', { w: LW.contour, lin: true });
    shape([[bx + 28, by + 4], [bx + 150, by - 6], [bx + 158, by + 44], [bx + 34, by + 54]], '#f6f1e6', { w: LW.contour });
    line([[bx + 60, by + 10], [bx + 90, by + 24]], LW.fine);
    I.grp(`translate(${bx + 104} ${by + 14}) rotate(-72)`, () => HD.head(F.tinted(C.isla, T[0], 0.15).head, { x: 0, y: 0, s: 1.35, yaw: 20, blink: true, mood: 'shut', mouth: 'smile' }));
    // quilt: draped over her, a fold line along her body and a shadow where it falls
    const q = [[bx + 56, by + 34], [bx + 130, by + 22], [bx + 250, by + 30], [bx + bw + 14, by + 34], [bx + bw + 22, by + bh * 0.66], [bx + 40, by + bh * 0.7]];
    shape(q, '#d8453b', { w: LW.contour });
    I.clipPoly(q, () => {
      for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) I.fill(I.rectPts(bx + 40 + i * 34, by + 22 + j * 30, 34, 30), ['#f2c230', '#4f7a55', '#f6e8c2'][(i * 3 + j) % 3], { lin: true, wob: 0 });
      I.fill([[bx + 40, by + bh * 0.46], [bx + bw + 30, by + bh * 0.42], [bx + bw + 30, by + bh], [bx + 40, by + bh]], '#1a1438', { op: 0.3, lin: true, wob: 0 });
    });
    line([[bx + 130, by + 30], [bx + 250, by + 40], [bx + bw, by + 46]], LW.fine);
    // her wellies, standing neatly by the chair
    const cx = w * 0.8, cy = h * 0.9;
    [[cx - 150, 0], [cx - 126, 4]].forEach(([x, o]) => shape([[x, cy + o], [x, cy - 40 + o], [x + 16, cy - 40 + o], [x + 16, cy - 12 + o], [x + 30, cy - 8 + o], [x + 30, cy + o]], '#f2c230', { w: LW.detail, lin: true }));
    // Grandad asleep in the armchair, cap on his knee, stick against the arm
    shape([[cx - 90, cy], [cx - 96, cy - 150], [cx - 70, cy - 190], [cx + 70, cy - 190], [cx + 96, cy - 150], [cx + 90, cy]], '#7a4a5a', { w: LW.contour });
    shape([[cx - 112, cy - 60], [cx - 112, cy - 116], [cx - 80, cy - 122], [cx - 76, cy - 56]], '#8a5a6a', { w: LW.contour });
    shape([[cx + 112, cy - 60], [cx + 112, cy - 116], [cx + 80, cy - 122], [cx + 76, cy - 56]], '#8a5a6a', { w: LW.contour });
    const noCap = { ...C.grandad, head: { ...C.grandad.head, hat: null } };
    const gr = F.rig(noCap, { x: cx, y: cy - 20, sit: 70, s: 1.2, yaw: -12, lean: -10, legN: [4, 6], legF: [2, 12] });
    const knee = gr.legN[1];
    F.fig(noCap, { x: cx, y: cy - 20, sit: 70, s: 1.2, yaw: -12, lean: -10, legN: [4, 6], legF: [2, 12], reachN: [knee[0] - 6, knee[1] - 14], reachF: [gr.legF[1][0] + 10, gr.legF[1][1] - 12], handN: 'relaxed', handF: 'relaxed', tint: T, head: { yaw: -30, pitch: -14, blink: true, mood: 'shut', mouth: 'o' }
    });
    line([[cx + 96, cy - 150], [cx + 124, cy]], 5.6, { taper: [0, 0], minW: 1 });
    line([[cx + 96, cy - 150], [cx + 124, cy]], 3, { color: '#8a5a33', taper: [0, 0], minW: 1 });
    shape([[knee[0] - 28, knee[1] - 8], [knee[0] - 20, knee[1] - 22], [knee[0] + 14, knee[1] - 24], [knee[0] + 24, knee[1] - 10], [knee[0] + 34, knee[1] - 6], [knee[0] - 30, knee[1] - 2]], F.mix('#6f6152', '#2b2f58', 0.3), { w: LW.detail });
    // candle light
    PG.glow(w * 0.62, h * 0.6, 130, '#ffcf6a', 0.55);
    shape(I.rectPts(w * 0.6 - 7, h * 0.6, 14, 30), '#f6f1e6', { w: LW.detail, lin: true });
    shape([[w * 0.6, h * 0.6 - 20], [w * 0.6 + 6, h * 0.6 - 6], [w * 0.6, h * 0.6 - 1], [w * 0.6 - 6, h * 0.6 - 6]], '#ffcf5a', { w: LW.fine });
    shape(I.rectPts(w * 0.565, h * 0.6 + 30, w * 0.07, 10), '#8a5a3a', { w: LW.detail, lin: true });
    I.text(cx + 34, cy - 210, 'z', { font: 'Title', size: 22, color: '#f3e9ff' });
    I.text(cx + 54, cy - 232, 'z', { font: 'Title', size: 28, color: '#f3e9ff' });
  }, (w, h) => {
    PG.caption(40, 40, ['WILL THERE BE BEDS', 'FOR ME AND ALL WHO SEEK?'], { style: 'plain', size: 17, color: '#f3e9ff', italic: true });
    PG.caption(w - 360, h * 0.47, ['YEA, BEDS FOR ALL WHO COME.'], { style: 'plain', size: 19, color: '#fff3cf' });
    PG.caption(w - 290, h - 40, ['– CHRISTINA ROSSETTI'], { style: 'plain', size: 14, color: '#f3e9ff' });
  });
  y += SH;
  H = y + 70;
  PG.text(PG.MARGIN, H - 34, "“Up-Hill” by Christina Rossetti, from Goblin Market and Other Poems (1862). A homage to Zen Pencils by Gavin Aung Than.", { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 34, 'No. 1', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
}

page();
const out = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'up-hill.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
console.log('wrote', H);
