// comic.js — "The Voice Within": a Zen-Pencils-style strip, drawn entirely in code.
// Words: Vincent van Gogh (letter to Theo, Drenthe, Oct 1883, popular wording).
// Run: node comic.js  → out/the-voice-within.svg
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { R, rng, emit, ink, fill, shape, ell, arc, rect, grp, clipRect, clipPoly, swirl, wave, drop, burst, text, caption, balloon, INK } = I;
const { C, rod, brush, miraHead, voice } = require('../lib/cast');

I.seed(20260927);
const W = 980, H = 2420, X0 = 52, IW = 876;

// ------------------------------------------------------------ helpers
let GID = 0;
function radial(cx, cy, r, stops) {
  const id = 'g' + (++GID);
  emit(`<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a ?? 1}"/>`).join('')}</radialGradient></defs>`);
  return `url(#${id})`;
}
function linear(x1, y1, x2, y2, stops) {
  const id = 'g' + (++GID);
  emit(`<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a ?? 1}"/>`).join('')}</linearGradient></defs>`);
  return `url(#${id})`;
}

function panel(x, y, w, h, bg, fn) {
  grp(`translate(${x} ${y})`, () => {
    clipRect(0, 0, w, h, () => { rect(-2, -2, w + 4, h + 4, bg); fn(w, h); });
    emit(`<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="3.4"/>`);
  });
}

function wall(w, h, color, line, step = 58, swirls = 10) {
  rect(0, 0, w, h, color);
  for (let x = step * (0.3 + rng() * 0.5); x < w; x += step + R(8)) ink([[x, -5], [x + R(2), h / 2], [x + R(2), h + 5]], 1.7, { color: line, taper: [0, 0], wob: 0.6 });
  for (let i = 0; i < swirls; i++) swirl(rng() * w, rng() * h, 5 + rng() * 6, line, rng() > 0.5 ? 1 : -1);
  for (let i = 0; i < swirls; i++) wave(rng() * w, rng() * h, 20 + rng() * 30, line);
}

function floor(y0, w, h, color, line) {
  rect(-2, y0, w + 4, h - y0 + 4, color);
  ink([[-4, y0], [w / 2, y0 + R(1)], [w + 4, y0]], 3, { taper: [0, 0], wob: 0.5 });
  let yy = y0, gap = 12;
  while (yy < h) {
    yy += gap; gap *= 1.35;
    ink([[-4, yy], [w + 4, yy + R(2)]], 1.6, { color: line, taper: [0, 0] });
    for (let x = rng() * 120; x < w; x += 110 + rng() * 120) ink([[x, yy], [x - 2, Math.min(h + 4, yy + gap)]], 1.4, { color: line, taper: [0, 0] });
  }
}

function paperBall(x, y, r) {
  const pts = [];
  for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; const k = 0.8 + rng() * 0.35; pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * 0.8 * k]); }
  shape(pts, '#ece6d8', { w: 2.4, lin: true });
  ink([[x - r * 0.5, y - r * 0.2], [x, y + r * 0.1], [x + r * 0.2, y - r * 0.4]], 1.2, { lin: true });
  ink([[x - r * 0.1, y + r * 0.5], [x + r * 0.4, y + r * 0.1]], 1.1, { lin: true });
  fill([[x - r * 0.2, y + r * 0.2], [x + r * 0.7, y + r * 0.1], [x + r * 0.6, y + r * 0.6], [x - r * 0.1, y + r * 0.62]], '#cfc6b3', { op: 0.8, lin: true });
}

function easel(cx, top, bottom, spread) {
  rod([[cx, top + 10], [cx + 4, bottom - 8]], 4, C.woodSh);
  rod([[cx - 3, top], [cx - spread, bottom]], 6, C.wood);
  rod([[cx + 3, top], [cx + spread, bottom]], 6, C.wood);
}

function hand(x, y, r, rot = 0) {
  shape(ell(x, y, r * 1.1, r * 0.95, 10, rot), C.skin, { w: 2.6 });
  ink([[x - r * 0.4, y - r * 0.2], [x + r * 0.2, y + r * 0.1]], 1.4);
}

function splat(x, y, r, color) {
  const pts = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const k = i % 2 ? 0.7 : 1 + rng() * 0.5; pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]); }
  fill(pts, color);
  for (let i = 0; i < 4; i++) { const a = rng() * 6.28, d = r * (1.6 + rng()); fill(ell(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.18 + 1, r * 0.18 + 1, 7), color); }
}

// Van Gogh-ish flow field: short thick strokes that follow swirling currents.
function starry(x, y, w, h, o = {}) {
  const vort = o.vortices || [];
  const stars = o.stars || [];
  const pal = o.palette || ['#1d3777', '#2a4f9a', '#3c6cb8', '#5c8fd0', '#8fb8e3', '#244a8c'];
  const glow = ['#f4d04a', '#f7e28a', '#e8b930', '#fff2b8'];
  const field = (px, py) => {
    let vx = 1, vy = 0.22 * Math.sin(py / 38 + px / 85);
    for (const [cx, cy, r, s] of vort) {
      const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy) + 1e-3;
      const f = s * Math.exp(-((d / r) ** 2)) * 2.4;
      vx += (-dy / d) * f; vy += (dx / d) * f;
    }
    for (const [cx, cy, r] of stars) {
      const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy) + 1e-3;
      if (d < r * 2.2) { const f = 3 * Math.exp(-((d / (r * 1.6)) ** 2)); vx += (-dy / d) * f; vy += (dx / d) * f; }
    }
    const l = Math.hypot(vx, vy); return [vx / l, vy / l];
  };
  rect(x, y, w, h, o.base || '#1f3a78');
  const sp = o.spacing || 9, sw = o.sw || 3.6;
  const parts = [];
  for (let gy = y - 4; gy < y + h + 4; gy += sp) {
    for (let gx = x - 4; gx < x + w + 4; gx += sp) {
      let px = gx + R(sp * 0.6), py = gy + R(sp * 0.6);
      const pts = [[px, py]];
      const steps = 3 + Math.floor(rng() * 3), stepL = (o.len || 4.2);
      for (let k = 0; k < steps; k++) { const [vx, vy] = field(px, py); px += vx * stepL; py += vy * stepL; pts.push([px, py]); }
      let col = pal[Math.floor(rng() * pal.length)];
      for (const [cx, cy, r] of stars) {
        const d = Math.hypot(gx - cx, gy - cy);
        if (d < r * 2.4 && rng() < 1.2 - d / (r * 2.4)) col = glow[Math.floor(rng() * glow.length)];
      }
      for (const [cx, cy, r] of vort) {
        const d = Math.hypot(gx - cx, gy - cy);
        if (d < r * 0.9 && rng() < 0.22) col = rng() < 0.5 ? '#c9dcef' : '#9fc2e6';
      }
      parts.push(`<path d="M${pts.map((p) => I.n1(p[0]) + ' ' + I.n1(p[1])).join('L')}" stroke="${col}" stroke-width="${I.n1(sw * (0.8 + rng() * 0.45))}"/>`);
    }
  }
  emit(`<g fill="none" stroke-linecap="round" stroke-linejoin="round">${parts.join('')}</g>`);
  for (const [cx, cy, r] of stars) {
    fill(ell(cx, cy, r * 0.55, r * 0.55, 12), '#f7e59a', { wob: 0.8 });
    fill(ell(cx, cy, r * 0.3, r * 0.3, 10), '#fffbe6', { wob: 0.5 });
  }
}

// cypress: a dark flame
function cypress(x, base, h, wdt) {
  const pts = [[x - wdt, base], [x - wdt * 0.8, base - h * 0.35], [x - wdt * 0.55, base - h * 0.7], [x - wdt * 0.15, base - h * 0.92], [x + wdt * 0.05, base - h], [x + wdt * 0.3, base - h * 0.8], [x + wdt * 0.6, base - h * 0.5], [x + wdt * 0.9, base - h * 0.2], [x + wdt, base]];
  shape(pts, '#1c3a2c', { w: 2.4 });
  for (let i = 0; i < 9; i++) {
    const t = 0.1 + i * 0.09, yy = base - h * t;
    ink([[x - wdt * 0.5 * (1 - t), yy], [x, yy - 14], [x + wdt * 0.4 * (1 - t), yy - 4]], 2.4, { color: i % 2 ? '#2f5e41' : '#10261c' });
  }
}

function village(x, y, w, s = 1) {
  // little houses + a church spire along a dark hill line
  shape([[x - 10, y + 40 * s], [x - 10, y + 6 * s], [x + w * 0.3, y - 4 * s], [x + w * 0.7, y + 4 * s], [x + w + 10, y - 2 * s], [x + w + 10, y + 40 * s]], '#27405e', { w: 2 });
  for (let i = 0; i < 7; i++) {
    const hx = x + 10 + i * (w / 7), hy = y + 8 * s, hw = 14 * s, hh = 10 * s;
    shape([[hx, hy + hh], [hx, hy], [hx + hw / 2, hy - 7 * s], [hx + hw, hy], [hx + hw, hy + hh]], i % 3 ? '#4d5f7c' : '#5a6b86', { w: 1.6, lin: true, wob: 0.3 });
    if (i % 2) fill(ell(hx + hw / 2, hy + hh * 0.5, 2 * s, 2 * s, 6), '#f4d04a');
  }
  const cx = x + w * 0.55;
  shape([[cx, y + 10 * s], [cx, y - 12 * s], [cx + 4 * s, y - 40 * s], [cx + 8 * s, y - 12 * s], [cx + 8 * s, y + 10 * s]], '#44557a', { w: 1.8, lin: true, wob: 0.3 });
}

// ------------------------------------------------------------ page
emit(`<rect width="${W}" height="${H}" fill="#fffefa"/>`);

// ---- title block
(function title() {
  text(150, 92, 'THE', { font: 'Title', size: 54, color: '#b8373b', stroke: INK, sw: 2.2, ls: 3, anchor: 'start', rot: -2 });
  text(129, 205, 'VOICE', { font: 'Title', size: 124, color: '#163049', ls: 4, anchor: 'start' });
  text(123, 199, 'VOICE', { font: 'Title', size: 124, color: '#3da0d6', stroke: INK, sw: 3, ls: 4, anchor: 'start' });
  text(396, 204, 'within', { font: 'Title', size: 60, color: '#b8373b', stroke: INK, sw: 2, ls: 2, anchor: 'start', rot: -4 });
  text(130, 256, 'WORDS BY', { size: 13, ls: 2.5, anchor: 'start' });
  text(224, 256, 'VINCENT VAN GOGH', { size: 13, ls: 2.5, anchor: 'start', italic: true });
  text(436, 256, 'ART BY', { size: 13, ls: 2.5, anchor: 'start' });
  text(506, 256, 'CLAUDE', { size: 13, ls: 2.5, anchor: 'start', italic: true });

  // title spot illustration: brushes in a jar on a little shelf
  grp('translate(790 40)', () => {
    brush(-8, 150, -46, 8, 5, C.blue);
    brush(8, 150, 44, 2, 5, '#d8433a');
    brush(0, 150, 2, -18, 5.5, C.yellow);
    shape([[-52, 62], [52, 62], [56, 76], [58, 170], [46, 186], [-46, 186], [-58, 170], [-56, 76]], '#cfe7f0', { w: 3, op: 0.9 });
    fill([[-54, 120], [54, 116], [55, 170], [45, 183], [-45, 183], [-55, 170]], '#8fc2d8', { op: 0.7 });
    ink([[-54, 120], [0, 114], [54, 116]], 1.5, { color: '#4d8aa6' });
    shape([[-58, 50], [58, 50], [58, 64], [-58, 64]], '#b9d8e4', { w: 2.8, lin: true });
    fill([[-40, 80], [-30, 78], [-32, 160], [-42, 158]], '#fff', { op: 0.7 });
    fill(ell(30, 150, 3, 3, 6), '#fff'); fill(ell(18, 164, 2, 2, 6), '#fff');
    shape(I.rectPts(-80, 188, 160, 14), C.wood, { w: 3, lin: true });
    rod([[-56, 202], [-56, 222]], 5, C.woodSh); rod([[56, 202], [56, 222]], 5, C.woodSh);
  });
})();

// ---- row 1: the attic at night
panel(X0, 288, IW, 330, '#6d6482', (w, h) => {
  wall(w, h, '#6d6482', '#5b5370', 62, 12);
  // slanted ceiling
  shape([[-6, -6], [260, -6], [-6, 160]], '#554d69', { w: 3, lin: true });
  for (let i = 1; i < 4; i++) ink([[i * 60, -4], [-4, 140 - (3 - i) * 40 + i * 0]], 1.5, { color: '#463f59', lin: true, taper: [0, 0] });
  // window + moon
  const wx = 660, wy = 40;
  const glowF = radial(wx + 60, wy + 70, 190, [[0, '#cfd7ff', 0.28], [1, '#cfd7ff', 0]]);
  fill(ell(wx + 60, wy + 70, 190, 190, 16), glowF, { wob: 0 });
  shape(I.rectPts(wx - 10, wy - 10, 140, 150), '#3f3753', { w: 3, lin: true });
  shape(I.rectPts(wx, wy, 120, 130), '#23305c', { w: 2.6, lin: true });
  fill(ell(wx + 82, wy + 38, 20, 20, 14), '#f3e8c2');
  fill(ell(wx + 90, wy + 32, 18, 18, 14), '#23305c');
  [[20, 20], [40, 90], [100, 100], [60, 50], [15, 110]].forEach(([a, b]) => fill(ell(wx + a, wy + b, 1.6, 1.6, 6), '#f3e8c2'));
  rod([[wx + 60, wy], [wx + 60, wy + 130]], 5, '#3f3753');
  rod([[wx, wy + 65], [wx + 120, wy + 65]], 5, '#3f3753');
  shape(I.rectPts(wx - 18, wy + 138, 156, 12), '#4c4462', { w: 2.6, lin: true });
  fill([[wx, wy + 150], [wx + 120, wy + 150], [wx - 30, h], [wx - 260, h]], '#dfe3ff', { op: 0.07, lin: true });

  floor(262, w, h, '#4d4560', '#3d3650');

  // crate with a candle and jars
  shape(I.rectPts(560, 232, 110, 70), '#8a5a39', { w: 3, lin: true });
  ink([[560, 256], [670, 256]], 1.6, { color: '#5e3a22', lin: true }); ink([[560, 279], [670, 279]], 1.6, { color: '#5e3a22', lin: true });
  const cg = radial(640, 200, 120, [[0, '#ffd27a', 0.45], [1, '#ffd27a', 0]]);
  fill(ell(640, 200, 120, 120, 16), cg, { wob: 0 });
  shape(I.rectPts(632, 196, 16, 36), '#f2ead6', { w: 2.2, lin: true });
  fill([[640, 170], [646, 186], [640, 194], [634, 186]], '#ffcf4a'); fill([[640, 178], [643, 187], [640, 191], [637, 187]], '#fff7d0');
  shape([[578, 200], [606, 200], [608, 232], [576, 232]], '#b8d5e2', { w: 2.4, lin: true, op: 0.95 });
  brush(588, 226, 578, 170, 3, '#8a85a3'); brush(596, 226, 606, 176, 3, '#6d6482');

  easel(468, 70, 300, 52);
  // the blank canvas
  shape(I.rectPts(392, 92, 170, 128), '#f8f5ec', { w: 3.2, lin: true });
  fill([[392, 92], [562, 92], [562, 100], [392, 100]], '#e7e2d4', { lin: true });
  rod([[380, 224], [574, 224]], 6, C.wood);

  // paper balls — earlier attempts
  [[120, 300, 16], [168, 314, 13], [612, 318, 14], [700, 306, 17], [760, 322, 12], [82, 322, 12]].forEach(([a, b, r]) => paperBall(a, b, r));

  // Mira from behind on a stool
  rod([[296, 246], [268, 308]], 4.5, C.woodSh); rod([[304, 246], [332, 308]], 4.5, C.woodSh); rod([[300, 248], [300, 302]], 3.5, C.woodSh);
  shape(ell(300, 242, 38, 9, 12), C.wood, { w: 2.8 });
  rod([[326, 236], [358, 246], [364, 300]], 10, '#3b3f5c');
  shape(ell(372, 302, 14, 7, 10), '#2b2536', { w: 2.4 });
  rod([[275, 180], [262, 214], [280, 236]], 12, C.smock);
  shape([[270, 168], [300, 160], [330, 168], [342, 204], [344, 244], [300, 250], [256, 244], [258, 204]], C.smock, { w: 3.2 });
  fill([[322, 170], [336, 196], [340, 240], [322, 246], [326, 210]], C.smockSh);
  ink([[300, 176], [298, 236]], 1.4, { color: C.smockSh });
  rod([[328, 180], [366, 198], [392, 176]], 11, C.smock);
  hand(396, 172, 8);
  brush(388, 184, 424, 146, 3.2, '#e7e2d4');
  // back of head
  brush(276, 106, 332, 78, 3.2);
  shape(ell(300, 98, 16, 13, 12), C.hair, { w: 2.8 });
  shape(ell(300, 136, 33, 34, 14), C.hair, { w: 3.2 });
  ink(arc(300, 132, 24, 26, 2.2, 3.6, 5), 1.4, { color: C.hairSh });
  ink(arc(300, 132, 20, 24, -0.6, 0.6, 5), 1.4, { color: C.hairSh });
  shape(ell(334, 140, 5, 8, 8), C.skin, { w: 2 });

  caption(16, 16, ['IF YOU HEAR A VOICE', 'WITHIN YOU SAY...']);
});

// ---- row 2a: close on Mira, something behind her
panel(X0, 636, 430, 330, '#665d7a', (w, h) => {
  wall(w, h, '#665d7a', '#564e69', 70, 7);
  fill(ell(w, 60, 220, 200, 16), radial(w, 60, 220, [[0, '#2c2638', 0.8], [1, '#2c2638', 0]]), { wob: 0 });
  // shoulders + neck
  shape([[70, 240], [112, 240], [116, 300], [66, 300]].map(([a, b]) => [a + 104, b + 8]), C.skin, { w: 3 });
  fill(ell(198, 266, 24, 12, 12), C.skinSh);
  shape([[20, 350], [44, 300], [120, 280], [180, 290], [212, 296], [240, 284], [310, 296], [350, 336], [360, 350]], C.smock, { w: 3.2 });
  ink([[176, 292], [196, 318], [214, 296]], 2.2);
  grp('translate(196 162) scale(1.55)', () => miraHead({ mood: 'worried', fx: 0.4, look: [1, -0.2], sweat: true }));
  // the Voice seeps in from the right
  grp('translate(412 150) scale(-1 1) rotate(-14)', () => voice({ mood: 'menace', look: 1, arms: false }));
  ink([[320, 330], [330, 300], [352, 296], [360, 316], [346, 324]], 2, { color: C.voiceSh });
});

// ---- row 2b: THE VOICE
panel(X0 + 448, 636, 428, 330, '#3d364d', (w, h) => {
  burst(250, 190, 90, 420, 48, '#4f4764', 3);
  fill(ell(250, 180, 180, 170, 16), radial(250, 180, 190, [[0, '#8b7fb0', 0.35], [1, '#8b7fb0', 0]]), { wob: 0 });
  grp('translate(262 168) scale(-1.5 1.5)', () => voice({ mood: 'menace', look: 0.6, reach: 1.1 }));
  // little Mira, hunched, lower left
  shape([[0, 340], [16, 300], [60, 290], [104, 300], [120, 340]], C.smock, { w: 3 });
  shape(ell(62, 272, 34, 32, 14), C.hair, { w: 3 });
  shape(ell(64, 236, 14, 11, 10), C.hair, { w: 2.6 });
  ink(arc(62, 270, 24, 22, 2.4, 3.5, 4), 1.3, { color: C.hairSh });
  drop(18, 240, 0.8, -25); drop(108, 232, 0.9, 20); drop(116, 266, 0.6, 30);
  ink([[10, 222], [2, 214]], 2); ink([[118, 212], [126, 202]], 2); ink([[22, 208], [18, 196]], 2);
  balloon(136, 70, 110, 46, 178, 170, ['YOU CANNOT', 'PAINT.'], { jag: true, size: 29, font: 'Title', ls: 2.5 });
});

// ---- row 3: the turn
const r3y = 984, r3h = 272, r3w = 280;
panel(X0, r3y, r3w, r3h, '#5b536f', (w, h) => {
  wall(w, h, '#5b536f', '#4d4661', 50, 5);
  grp('translate(150 172) rotate(24)', () => {
    brush(0, 130, 0, -150, 7, '#e7e2d4');
    shape([[-24, 36], [24, 36], [32, 150], [-34, 150]], C.smock, { w: 3.2 });
    ink([[-26, 60], [26, 58]], 1.6, { color: C.smockSh });
    // fist wrapped around the handle
    shape([[-28, -30], [18, -36], [34, -22], [36, 18], [22, 38], [-24, 38], [-36, 14], [-34, -16]], C.skin, { w: 3.2 });
    fill([[10, -30], [32, -20], [34, 16], [20, 34], [22, -4]], C.skinSh, { op: 0.8 });
    [-14, 2, 18].forEach((yy) => ink([[-2, yy], [16, yy + 1], [34, yy - 2]], 2));
    shape([[-38, -20], [-10, -32], [12, -26], [8, -14], [-18, -10], [-36, -6]], C.skin, { w: 2.8 });
    ink([[-4, -24], [6, -22]], 1.3);
  });
  // tremble marks
  [[64, 120], [58, 136], [234, 170], [240, 186], [200, 90], [210, 80]].forEach(([a, b], i) => ink([[a, b], [a + (i % 2 ? 8 : -8), b - 8]], 2.2, { taper: [0.3, 0.3] }));
  drop(98, 88, 0.9, -15);
  caption(14, 14, ['...THEN BY', 'ALL MEANS...']);
});

panel(X0 + r3w + 18, r3y, r3w, r3h, C.yellow, (w, h) => {
  burst(w / 2, 230, 60, 360, 44, '#e3a51f', 3);
  grp(`translate(${w / 2} 222) scale(2.25)`, () => miraHead({ mood: 'determined', fx: 0, look: [0, 0], bun: false }));
  ink([[36, 70], [26, 44]], 3, { taper: [0.1, 0.5] }); ink([[244, 70], [254, 44]], 3, { taper: [0.1, 0.5] });
  caption(14, 14, ['PAINT,'], { size: 26 });
});

panel(X0 + (r3w + 18) * 2, r3y, r3w, r3h, '#2d2838', (w, h) => {
  // canvas fills the frame
  shape([[20, 30], [300, 20], [300, 300], [14, 300]], '#f8f5ec', { w: 3.2, lin: true });
  // the first stroke
  const stroke = [[-10, 230], [40, 206], [100, 160], [160, 150], [214, 118], [252, 76]];
  ink(stroke, 46, { color: C.yellow, taper: [0.05, 0.35], vary: 0.15, wob: 1 });
  ink(stroke.map(([a, b]) => [a, b + 6]), 16, { color: '#fbe07a', taper: [0.1, 0.5], wob: 1 });
  ink(stroke.map(([a, b]) => [a - 4, b + 20]), 5, { color: '#e3a51f', taper: [0.2, 0.5] });
  [[90, 110, 7], [140, 206, 5], [60, 170, 4], [190, 190, 6], [230, 150, 4], [180, 96, 3]].forEach(([a, b, r]) => splat(a, b, r, C.yellow));
  brush(330, -30, 258, 70, 8, C.yellow);
  [[40, 150], [70, 128], [150, 62]].forEach(([a, b]) => ink([[a - 30, b + 4], [a, b - 10]], 2, { taper: [0.8, 0.05] }));
  text(118, 262, 'SHWOOP!', { font: 'Title', size: 54, color: '#fffefb', stroke: INK, sw: 6, rot: -12, ls: 2 });
  // Voice, startled, peeking in
  grp('translate(262 250) scale(-0.55 0.55) rotate(10)', () => voice({ mood: 'shock', arms: false }));
});

// ---- row 4: painting, and the painting spills into the room
panel(X0, 1274, IW, 384, '#6d6482', (w, h) => {
  wall(w, h, '#6d6482', '#5b5370', 60, 8);
  floor(320, w, h, '#4d4560', '#3d3650');
  // swirls escaping the canvas and flooding the attic
  const blob = [[330, -10], [520, -20], [900, -20], [900, 404], [700, 404], [640, 360], [560, 336], [470, 350], [420, 300], [440, 250], [380, 214], [360, 150], [388, 90], [340, 40]];
  clipPoly(blob, () => starry(300, -20, 600, 430, {
    vortices: [[520, 150, 90, 1.1], [700, 110, 70, -0.9], [640, 270, 80, 0.8]],
    stars: [[590, 60, 18], [790, 60, 24], [470, 70, 14], [820, 230, 16]], spacing: 8.5, sw: 3.8,
  }));
  // canvas frame on its easel (the painting continues past the frame)
  easel(520, 40, 360, 70);
  clipRect(420, 56, 200, 190, () => starry(420, 56, 200, 190, {
    vortices: [[500, 140, 60, 1.2], [590, 110, 40, -1]], stars: [[450, 90, 12], [590, 80, 14], [560, 200, 10]],
    spacing: 7, sw: 3.4, palette: ['#1d3777', '#2a4f9a', '#3c6cb8', '#5c8fd0', '#8fb8e3', '#c9dcef'],
  }));
  emit('<rect x="420" y="56" width="200" height="190" fill="none" stroke="#1b1519" stroke-width="3.4"/>');
  rod([[406, 250], [634, 250]], 7, C.wood);

  // Mira, mid-stroke
  rod([[220, 318], [214, 370]], 9, '#3b3f5c'); rod([[256, 318], [272, 368]], 9, '#3b3f5c');
  shape(ell(208, 372, 15, 7, 10), '#2b2536', { w: 2.4 }); shape(ell(280, 370, 15, 7, 10), '#2b2536', { w: 2.4 });
  rod([[214, 186], [188, 230], [176, 254]], 11, C.smock);
  // palette
  shape([[112, 238], [170, 226], [200, 244], [196, 270], [150, 282], [104, 270], [98, 252]], '#d8b07a', { w: 2.8 });
  fill(ell(126, 256, 6, 6, 8), '#f8f5ec');
  [[140, 244, C.yellow], [164, 242, '#d8433a'], [182, 256, C.blue], [150, 266, '#3c6cb8'], [120, 248, '#fbe07a']].forEach(([a, b, c]) => fill(ell(a, b, 8, 5.5, 9), c));
  hand(176, 256, 9);
  shape([[206, 170], [238, 160], [268, 170], [284, 224], [300, 318], [240, 330], [180, 318], [196, 226]], C.smock, { w: 3.2 });
  fill([[262, 176], [280, 226], [296, 314], [270, 320], [262, 240]], C.smockSh);
  [[226, 262, C.yellow, 6], [258, 292, '#d8433a', 5], [214, 300, C.blue, 5]].forEach(([a, b, c, r]) => splat(a, b, r, c));
  shape([[228, 150], [252, 150], [254, 172], [226, 172]], C.skin, { w: 2.6 });
  grp('translate(240 104) scale(0.9)', () => miraHead({ mood: 'determined', fx: 0.8, look: [1, 0], bun: true }));
  rod([[262, 184], [322, 202], [372, 168]], 11, C.smock);
  hand(376, 164, 9);
  brush(368, 176, 428, 118, 4, '#f7e28a');
  // flung paint
  [[340, 110, 5, C.yellow], [300, 70, 4, '#8fb8e3'], [380, 60, 6, C.yellow], [320, 36, 3, '#d8433a'], [410, 20, 4, '#5c8fd0']].forEach(([a, b, r, c]) => splat(a, b, r, c));
  [[320, 150], [300, 130], [290, 108]].forEach(([a, b]) => ink([[a, b], [a - 26, b + 8]], 2, { taper: [0.8, 0.1] }));

  // the Voice, washed backwards by the colour
  grp('translate(790 236) scale(-0.7 0.7) rotate(-8)', () => voice({ mood: 'shock', arms: false }));
  [[740, 150], [736, 176], [744, 312]].forEach(([a, b]) => ink([[a, b], [a + 30, b + 4]], 2.2, { taper: [0.8, 0.1], color: '#fffefb' }));
  balloon(816, 116, 50, 24, 800, 170, ['you can...', 'not...?'], { size: 13, fill: '#e9e6ef', color: '#6f6a82' });
});

// ---- row 5: morning
panel(X0, 1676, IW, 660, '#f3cf94', (w, h) => {
  rect(0, 0, w, h, linear(0, 0, 0, h, [[0, '#f7dcaa'], [1, '#eeb57c']]));
  for (let x = 40; x < w; x += 64 + R(6)) ink([[x, -5], [x + R(2), 520]], 1.6, { color: '#e2b27a', taper: [0, 0] });
  for (let i = 0; i < 12; i++) swirl(rng() * w, rng() * 500, 5 + rng() * 6, '#e2b27a', rng() > 0.5 ? 1 : -1);

  // window, open to a sunrise
  const wx = 648, wy = 50;
  shape(I.rectPts(wx - 12, wy - 12, 184, 214), '#b77846', { w: 3, lin: true });
  clipRect(wx, wy, 160, 190, () => {
    rect(wx, wy, 160, 190, linear(0, wy, 0, wy + 190, [[0, '#ffb570'], [0.6, '#ffd89a'], [1, '#fff1c9']]));
    fill(ell(wx + 80, wy + 150, 46, 46, 16), '#fff6d8');
    burst(wx + 80, wy + 150, 52, 140, 22, '#fff3cf', 3);
    shape([[wx - 10, wy + 170], [wx + 50, wy + 150], [wx + 110, wy + 164], [wx + 170, wy + 146], [wx + 170, wy + 200], [wx - 10, wy + 200]], '#7aa86a', { w: 2.4 });
  });
  shape([[wx + 160, wy], [wx + 200, wy - 26], [wx + 200, wy + 214], [wx + 160, wy + 190]], '#d8a06c', { w: 3, lin: true });
  shape(I.rectPts(wx - 22, wy + 192, 204, 14), '#b77846', { w: 2.8, lin: true });
  fill([[wx, wy + 206], [wx + 160, wy + 206], [wx + 40, h], [wx - 340, h]], '#fff6d8', { op: 0.22, lin: true });

  // her gallery
  const frame = (x, y, fw, fh, fn) => {
    shape(I.rectPts(x - 8, y - 8, fw + 16, fh + 16), '#9a6134', { w: 2.8, lin: true });
    clipRect(x, y, fw, fh, fn);
    emit(`<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="none" stroke="${INK}" stroke-width="2"/>`);
  };
  frame(40, 150, 110, 84, () => { // sunflowers
    rect(40, 150, 110, 84, '#e9b949');
    shape([[70, 234], [80, 196], [124, 196], [132, 234]], '#3a6aa8', { w: 2 });
    [[82, 184, 12], [108, 176, 14], [124, 196, 10], [96, 200, 10]].forEach(([a, b, r]) => {
      for (let k = 0; k < 10; k++) { const t = (k / 10) * 6.28; ink([[a, b], [a + Math.cos(t) * r * 1.6, b + Math.sin(t) * r * 1.6]], 4.5, { color: '#f7d13f', taper: [0, 0.6] }); }
      shape(ell(a, b, r * 0.6, r * 0.6, 10), '#7a4a1e', { w: 1.8 });
    });
  });
  frame(40, 270, 90, 110, () => { // a portrait of the Voice, silenced
    rect(40, 270, 90, 110, '#9fc2a8');
    grp('translate(86 326) scale(0.34)', () => voice({ mood: 'sulk', arms: false }));
  });
  frame(176, 60, 120, 76, () => { // wheat field
    rect(176, 60, 120, 76, '#86b3e0');
    fill(ell(270, 78, 10, 10, 10), '#fff2b8');
    rect(176, 100, 120, 40, '#e8b930');
    for (let i = 0; i < 16; i++) ink([[180 + i * 8, 136], [184 + i * 8, 104 + R(4)]], 2.4, { color: i % 2 ? '#c98b1d' : '#f7e28a', taper: [0, 0.5] });
    [[200, 84], [230, 90], [250, 80]].forEach(([a, b]) => ink([[a - 5, b], [a, b - 3], [a + 5, b]], 1.4));
  });
  frame(330, 40, 90, 110, () => starry(330, 40, 90, 110, { vortices: [[375, 80, 30, 1]], stars: [[400, 60, 8]], spacing: 6, sw: 2.6, len: 3 }));
  frame(456, 70, 76, 60, () => { rect(456, 70, 76, 60, '#d8433a'); fill(ell(494, 100, 20, 16, 12), '#f5c83b'); fill(ell(494, 100, 8, 7, 10), '#7a4a1e'); });

  floor(528, w, h, '#c98d5a', '#a8703f');
  [[120, 590, 9, C.yellow], [470, 610, 7, '#3c6cb8'], [610, 560, 6, '#d8433a'], [300, 640, 8, '#3c6cb8'], [760, 632, 8, C.yellow], [540, 640, 5, C.yellow]].forEach(([a, b, r, c]) => splat(a, b, r, c));

  // the finished painting
  easel(648, 270, 610, 82);
  shape(I.rectPts(516, 262, 264, 222), '#f8f5ec', { w: 3.4, lin: true });
  clipRect(522, 268, 252, 210, () => {
    starry(522, 268, 252, 160, {
      vortices: [[610, 330, 44, 1.1], [690, 300, 34, -0.9]],
      stars: [[730, 300, 16], [556, 296, 9], [650, 280, 8]], spacing: 7, sw: 3.2, len: 3.6,
    });
    rect(522, 420, 252, 60, '#27405e');
    village(560, 418, 190, 0.9);
    cypress(560, 480, 190, 26);
  });
  rod([[500, 488], [796, 488]], 8, C.wood);

  // Mira, stretching after the all-nighter
  rod([[314, 538], [290, 610]], 5, C.woodSh); rod([[394, 538], [418, 610]], 5, C.woodSh); rod([[354, 544], [354, 604]], 4, C.woodSh);
  shape(ell(354, 530, 66, 14, 14), C.wood, { w: 3 });
  rod([[318, 520], [300, 560], [296, 616]], 14, '#3b3f5c'); rod([[388, 520], [408, 560], [412, 616]], 14, '#3b3f5c');
  shape(ell(288, 620, 20, 9, 10), '#2b2536', { w: 2.6 }); shape(ell(420, 620, 20, 9, 10), '#2b2536', { w: 2.6 });
  rod([[304, 420], [262, 360], [244, 280]], 14, C.smock);
  rod([[404, 420], [446, 360], [462, 280]], 14, C.smock);
  hand(242, 268, 12, 0.3); hand(464, 268, 12, -0.3);
  shape([[300, 404], [354, 392], [408, 404], [424, 456], [432, 530], [354, 540], [276, 530], [284, 456]], C.smock, { w: 3.4 });
  fill([[392, 406], [418, 456], [428, 526], [398, 532], [396, 460]], C.smockSh);
  [[318, 460, C.yellow, 7], [380, 490, '#d8433a', 6], [340, 510, C.blue, 5], [396, 440, C.yellow, 4], [300, 500, '#5c8fd0', 5]].forEach(([a, b, c, r]) => splat(a, b, r, c));
  ink([[330, 404], [354, 432], [378, 404]], 2.2);
  shape([[340, 370], [368, 370], [370, 402], [338, 402]], C.skin, { w: 2.8 });
  grp('translate(354 318) scale(1.22)', () => miraHead({ mood: 'joy', fx: 0.1, smudge: C.yellow }));
  [[236, 230], [268, 222], [470, 222], [440, 228]].forEach(([a, b], i) => ink([[a, b], [a + (i % 2 ? 4 : -4), b - 16]], 2.4, { taper: [0.2, 0.5] }));

  // paint crate + the tiny, quiet Voice
  shape(I.rectPts(640, 560, 180, 90), '#9a6134', { w: 3.2, lin: true });
  ink([[640, 590], [820, 590]], 1.6, { color: '#6b3f1f', lin: true }); ink([[640, 620], [820, 620]], 1.6, { color: '#6b3f1f', lin: true });
  shape([[660, 520], [700, 520], [702, 560], [658, 560]], '#cfe7f0', { w: 2.6, lin: true });
  brush(676, 556, 664, 482, 3.4, '#d8433a'); brush(686, 556, 702, 486, 3.4, C.blue);
  // tubes
  shape([[716, 546], [758, 548], [770, 552], [770, 558], [758, 562], [716, 564]], '#f1efe8', { w: 2.2, lin: true });
  ink([[716, 546], [716, 564]], 3.4, { lin: true, taper: [0, 0] });
  fill([[722, 550], [754, 551], [754, 560], [722, 560]], C.blue, { lin: true });
  shape(I.rectPts(770, 550, 9, 10), INK, { w: 1.2, lin: true });
  fill(ell(733, 568, 14, 4, 10), C.blue);
  grp('translate(790 520) scale(0.36)', () => voice({ mood: 'sulk', arms: false }));
  text(806, 470, '. . .', { size: 16, color: '#6f6a82', ls: 1 });

  const g = radial(740, 150, 520, [[0, '#fff8e0', 0.35], [1, '#fff8e0', 0]]);
  rect(0, 0, w, h, g);
  caption(18, 18, ['...AND THAT VOICE', 'WILL BE SILENCED.'], { attrib: '– VINCENT VAN GOGH', size: 18 });
});

// ---- footer
text(W / 2, H - 42, 'A homage to Zen Pencils by Gavin Aung Than. Every line on this page was drawn with code.', { size: 12, color: '#8b8497', ls: 0.8 });
text(W / 2, H - 22, 'Quote adapted from a letter by Vincent van Gogh to his brother Theo, October 1883.', { size: 12, color: '#8b8497', ls: 0.8 });

const body = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out', 'archive'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'out', 'archive', 'the-voice-within.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${require('../lib/fonts')()}${body}</svg>`);
console.log('wrote out/the-voice-within.svg');
