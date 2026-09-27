// WOBBLING WILL — Frances E. Willard, A Wheel Within a Wheel (1895). A Zen-Pencils-style strip.
// node comics/wobbling.js -> out/wobbling-will.svg
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, LW, line, shape } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const { hand } = require('../zp/hand');

I.seed(1895);
const W = 980;
let H = 0;
const mix = F.mix;
const BIKE = '#2f7a8a';
const peg = { H: 3.5, build: 1.12, head: { skin: '#f0c9a8', hair: '#b9b4ac', hairLine: '#8a857e', hairStyle: 'bun', R: 27, tall: 1.1, jaw: 1.1, jawW: 0.7, eyeW: 0.23, eyeH: 0.28, lashes: 1, age: 0.55, glasses: '#b8342e', blush: 1, nose: 'button', noseLen: 0.18 },
  top: { color: '#e0a53a', sleeve: 'long' }, bottom: { type: 'skirt', color: '#5a6f8a', socks: '#e8d8c0' }, shoes: '#6a3a2a' };
const kid = (hair, top, st) => ({ H: 2.7, head: { skin: '#f4cfae', hair, hairStyle: st, R: 22, blush: 1 }, top: { color: top, sleeve: 'short' }, bottom: { type: 'shorts', color: '#3d4458' }, shoes: '#2a2224' });
const COLD = { sky: '#bcd0de', skyLow: '#e4ecf0', grass: '#8fae94', grassSh: '#76957c', path: '#d8d4c6', water: '#9fbccc', tree: '#6f9486', tint: ['#8aa2c0', 0.18] };
const WARM = { sky: '#f7b46a', skyLow: '#ffe6b0', grass: '#a8c46a', grassSh: '#8aa84e', path: '#f3dca8', water: '#f2c27a', tree: '#6f9a48', tint: ['#ff9a4a', 0.1] };

function wheel(x, y, r, o = {}) {
  shape(I.ell(x, y, r, r, 32), 'none', { w: 4.2 });
  I.ink(I.ell(x, y, r - 3.5, r - 3.5, 32), 1.2, { closed: true });
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + (o.spin || 0); line([[x, y], [x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3)]], 0.9, { taper: [0, 0] }); }
  shape(I.ell(x, y, 4, 4, 8), '#666', { w: 1.2 });
}
// a step-through bicycle; returns the rider's contact points
function bike(x, y, s, o = {}) {
  const c = o.color || BIKE, R = 34 * s, tilt = o.tilt || 0;
  I.emit(`<g transform="rotate(${tilt} ${x} ${y})">`);
  const rw = [x - 58 * s, y - R], fw = [x + 58 * s, y - R], bb = [x, y - R - 4 * s], seat = [x - 18 * s, y - R - 60 * s], hd = [x + 44 * s, y - R - 58 * s];
  wheel(...rw, R, o); wheel(...fw, R, o);
  const tube = (a, b, w = 5) => { line([a, b], w + 3, { taper: [0, 0], minW: 1 }); line([a, b], w, { color: c, taper: [0, 0], minW: 1 }); };
  tube(rw, bb); tube(bb, seat); tube(rw, seat); tube([bb[0] + 4 * s, bb[1] - 4 * s], [hd[0] - 6 * s, hd[1] + 22 * s]); tube([hd[0] - 6 * s, hd[1] + 22 * s], hd); tube(hd, fw, 4);
  shape([[seat[0] - 18, seat[1] - 14], [seat[0] + 12, seat[1] - 16], [seat[0] + 10, seat[1] - 10], [seat[0] - 16, seat[1] - 8]], '#3a2a22', { w: 1.6 });
  tube([seat[0], seat[1] - 8], seat, 3);
  tube(hd, [hd[0] - 4, hd[1] - 14], 3); line([[hd[0] - 18, hd[1] - 18], [hd[0] + 10, hd[1] - 14]], 5, { taper: [0, 0] });
  shape([[hd[0] + 6, hd[1] - 4], [hd[0] + 40, hd[1] - 4], [hd[0] + 36, hd[1] + 22], [hd[0] + 10, hd[1] + 22]], '#c9a06a', { w: 1.6, lin: true });
  if (o.tag) { line([[hd[0] + 20, hd[1] - 4], [hd[0] + 30, hd[1] - 30]], 1); shape(I.rectPts(hd[0] + 22, hd[1] - 46, 30, 18), '#ffffff', { w: 1.4, lin: true }); I.text(hd[0] + 37, hd[1] - 33, '£15', { font: 'Letter', size: 10 }); }
  I.emit('</g>');
  const rot = (p) => { const a = (tilt * Math.PI) / 180, dx = p[0] - x, dy = p[1] - y; return [x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a)]; };
  return { seat: rot([seat[0], seat[1] - 12]), bars: rot([hd[0] - 14, hd[1] - 18]), pedalN: rot([bb[0] + 12 * s, bb[1] + 10 * s]), pedalF: rot([bb[0] - 12 * s, bb[1] - 10 * s]), front: rot(fw) };
}
function rider(b, o = {}) {
  return F.fig(peg, { x: b.seat[0], y: b.seat[1], sit: 0, s: o.s || 1, yaw: 65, lean: o.lean ?? 14, footN: b.pedalN, footF: b.pedalF, reachN: b.bars, reachF: [b.bars[0] - 4, b.bars[1] + 2], handN: 'grip', handF: 'grip', tint: o.tint, head: { yaw: 62, pitch: o.pitch || 0, look: o.look || [0.8, 0], mood: o.mood || 'focus', mouth: o.mouth } });
}
function wobble(x, y, n = 3) { for (let k = 0; k < n; k++) line([[x - 10 - k * 8, y - 16 + k * 6], [x - 4 - k * 8, y - 8 + k * 6], [x - 10 - k * 8, y + k * 6]], 1.8, { taper: [0.2, 0.2] }); }
// the park: the same framing every morning
function park(w, h, P, o = {}) {
  I.rect(0, 0, w, h, PG.linear(0, 0, 0, h, [[0, P.sky], [0.6, P.skyLow]]));
  if (o.sun) { PG.rays(w * 0.82, h * 0.56, 50, 900, 30, '#fff1c2', 2, { spread: 0.03 }); SC.sun(w * 0.82, h * 0.56, 40, '#fff1c2', { glow: '#fff1c2' }); }
  // the bridge in the distance
  const by = h * 0.58;
  I.fill(I.ell(w * 0.78, by + 4, w * 0.06, 16, 16), P.water, { wob: 0 });
  shape([[-10, h * 0.6], [w + 10, h * 0.56], [w + 10, h + 10], [-10, h + 10]], P.grass, { w: SC.BG });
  shape([[-10, h * 0.66], [w * 0.4, h * 0.62], [w + 10, h * 0.6], [w + 10, h * 0.64], [w * 0.4, h * 0.68], [-10, h * 0.74]], P.water, { w: LW.fine });
  // the path (with the bench and the hedge)
  shape([[-10, h * 0.82], [w + 10, h * 0.76], [w + 10, h * 0.9], [-10, h * 0.98]], P.path, { w: LW.fine });
  for (let x = -20; x < w + 40; x += 36) if (x < w * 0.6 || x > w * 0.97) shape(I.ell(x, h * 0.58, 26, 18, 14), P.tree, { w: LW.fine });
  const bc = mix(P.path, '#6a5a4a', 0.35), bx0 = w * 0.64, bx1 = w * 0.94, bh = h * 0.07;
  const deck = []; for (let k = 0; k <= 12; k++) { const t = k / 12; deck.push([bx0 + (bx1 - bx0) * t, by - Math.sin(t * Math.PI) * bh]); }
  shape(deck.concat(deck.slice().reverse().map(([x, yy]) => [x, yy + 6])), bc, { w: LW.fine });
  line(deck.map(([x, yy]) => [x, yy - 12]), 1.6, { color: bc });
  deck.forEach(([x, yy], k) => { if (k % 2 === 0) line([[x, yy], [x, yy - 12]], 1.4, { color: bc, taper: [0, 0] }); });
  I.ink(I.arc((bx0 + bx1) / 2, by + 6, (bx1 - bx0) * 0.3, bh * 0.9, Math.PI, Math.PI * 2, 10), 1.4, { color: bc });

  shape(I.rectPts(w * 0.08, h * 0.7, 70, 8), '#8a5a3a', { w: LW.fine, lin: true });
  shape(I.rectPts(w * 0.08, h * 0.64, 70, 6), '#8a5a3a', { w: LW.fine, lin: true });
  shape(I.rectPts(w * 0.09, h * 0.7 + 8, 5, 16), '#8a5a3a', { w: LW.fine, lin: true }); shape(I.rectPts(w * 0.08 + 62, h * 0.7 + 8, 5, 16), '#8a5a3a', { w: LW.fine, lin: true });
  // the duck
  if (o.duck !== false) { const dx = o.duckX ?? w * 0.3, dy = h * 0.66; shape(I.ell(dx, dy, 12, 7, 12), '#ffffff', { w: 1.6 }); shape(I.ell(dx + 10, dy - 8, 5, 5, 10), '#3f7a4a', { w: 1.4 }); shape([[dx + 14, dy - 8], [dx + 21, dy - 7], [dx + 14, dy - 5]], '#f2a23a', { w: 1 }); }
}
function credits(x, y, runs) {
  I.emit(`<text x="${x}" y="${y}" font-family="Letter" font-size="13" letter-spacing="2">${runs.map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, ' ')}</tspan>`).join('')}</text>`);
}

function page() {
  // title: a wobbly line under wobbly letters
  { let tx = 116; 'WOBBLING'.split('').forEach((ch, i) => { PG.sfx(tx, 118 + Math.sin(i * 1.3) * 8, ch, { size: 92, color: BIKE, anchor: 'start', rot: Math.sin(i * 1.7) * 8, sw: 3.2, ls: 0 }); tx += PG.textW(ch, 92, 'Title', 0) + 2; }); }
  PG.sfx(478, 128, 'WILL', { size: 110, color: '#e0a53a', anchor: 'start', rot: -3, sw: 3.4, ls: 2 });
  I.ink([[112, 150], [200, 158], [290, 146], [380, 160], [470, 148]], 3, { color: BIKE, taper: [0.2, 0.5] });
  credits(118, 196, [['WORDS BY ', INK], ['FRANCES E. WILLARD', BIKE], ['      ART BY ', INK], ['CLAUDE', '#c98a1a']]);
  I.grp('translate(700 30) scale(0.72)', () => { const b = bike(210, 230, 1.3, { color: BIKE }); void b; });
  let y = 230;
  const G = PG.GUT_V;
  let r;

  // 1 — the shed: she wheels out a second-hand bicycle, price tag still on
  r = PG.row(y, 330, [1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, PG.linear(0, 0, 0, h, [[0, '#cfdbe4'], [1, '#eef2f2']]));
    // back garden: fence, shed with the door open
    for (let x = -10; x < w + 20; x += 34) shape([[x, h * 0.78], [x, h * 0.36], [x + 15, h * 0.32], [x + 30, h * 0.36], [x + 30, h * 0.78]], '#c9b89a', { w: LW.fine, lin: true });
    line([[-10, h * 0.46], [w + 10, h * 0.46]], 4, { color: '#a8977a', taper: [0, 0] });
    shape([[w * 0.06, h * 0.86], [w * 0.06, h * 0.26], [w * 0.2, h * 0.12], [w * 0.34, h * 0.26], [w * 0.34, h * 0.86]], '#6f8a6a', { w: LW.contour, lin: true });
    shape(I.rectPts(w * 0.12, h * 0.4, w * 0.16, h * 0.46), '#2a2a30', { w: LW.detail, lin: true });
    shape([[w * 0.28, h * 0.4], [w * 0.36, h * 0.36], [w * 0.36, h * 0.9], [w * 0.28, h * 0.86]], '#7f9a7a', { w: LW.detail, lin: true });
    // tools in the dark shed
    line([[w * 0.15, h * 0.5], [w * 0.17, h * 0.84]], 3, { color: '#8a6a4a' }); line([[w * 0.24, h * 0.46], [w * 0.22, h * 0.84]], 3, { color: '#8a6a4a' });
    I.rect(0, h * 0.86, w, h * 0.14, '#8fae94');
    line([[-4, h * 0.86], [w + 4, h * 0.86]], LW.detail, { taper: [0, 0] });
    const b = bike(w * 0.62, h * 0.95, 1.25, { tag: true });
    F.fig(peg, { x: w * 0.54, y: h * 0.95, s: 1.1, yaw: 60, lean: 8, legN: [20, -4], legF: [-16, 18], reachN: b.bars, reachF: [b.seat[0] + 6, b.seat[1] + 6], handN: 'grip', handF: 'grip', head: { yaw: 50, pitch: 4, look: [0.6, -0.2], mood: 'smile' } });
    // a mug steaming on the gatepost
    shape(I.rectPts(w * 0.9 - 6, h * 0.3, 28, h * 0.56), '#a8977a', { w: LW.detail, lin: true });
    shape(I.rectPts(w * 0.9, h * 0.3 - 18, 16, 18), '#ffffff', { w: 1.6, lin: true });
    for (let k = 0; k < 2; k++) line([[w * 0.9 + 5 + k * 6, h * 0.3 - 22], [w * 0.9 + 2 + k * 6, h * 0.3 - 30], [w * 0.9 + 6 + k * 6, h * 0.3 - 38]], 1.4, { color: '#8aa2b0', taper: [0.3, 0.3] });
  });
  y += 330 + G;

  // 2 — push off (wobble); 3 — CRASH into the hedge
  r = PG.row(y, 300, [1, 1]);
  PG.panel(r[0], null, (w, h) => {
    park(w, h, COLD, { duckX: w * 0.2 });
    const b = bike(w * 0.56, h * 0.96, 1.1, { tilt: -6 });
    rider(b, { mood: 'worried', look: [0.3, 1], pitch: -10, tint: COLD.tint });
    wobble(b.front[0] + 60, b.front[1]); wobble(b.seat[0] - 60, b.seat[1] + 40);
    PG.sfx(w * 0.76, h * 0.26, 'WOBBLE', { size: 34, color: '#ffffff', rot: -10 });
    PG.sfx(w * 0.82, h * 0.4, 'WOBBLE', { size: 28, color: '#ffffff', rot: 8 });
  });
  PG.panel(r[1], null, (w, h) => {
    park(w, h, COLD, { duck: false });
    // the hedge, and her legs and a wheel sticking out of it
    shape([[-10, h * 0.9], [w * 0.1, h * 0.36], [w * 0.4, h * 0.26], [w * 0.8, h * 0.3], [w + 10, h * 0.4], [w + 10, h * 0.9]], '#4f7a55', { w: LW.contour });
    for (let k = 0; k < 40; k++) { const x = I.rng() * w, yy = h * 0.4 + I.rng() * h * 0.45; line([[x - 5, yy], [x, yy - 4], [x + 5, yy]], 1.3, { color: '#2f5a3a', taper: [0.3, 0.3] }); }
    // the bike's back end sticking out, rear wheel still spinning
    wheel(w * 0.74, h * 0.66, 34, { spin: 0.4 });
    line([[w * 0.74, h * 0.66], [w * 0.64, h * 0.54]], 8, { taper: [0, 0], minW: 1 }); line([[w * 0.74, h * 0.66], [w * 0.64, h * 0.54]], 5, { color: BIKE, taper: [0, 0], minW: 1 });
    line([[w * 0.74, h * 0.66], [w * 0.62, h * 0.66]], 8, { taper: [0, 0], minW: 1 }); line([[w * 0.74, h * 0.66], [w * 0.62, h * 0.66]], 5, { color: BIKE, taper: [0, 0], minW: 1 });
    [[0.8, 0.52], [0.84, 0.6], [0.8, 0.78]].forEach(([x, yy]) => line([[w * x, h * yy], [w * x + 12, h * yy - 4]], 1.8, { taper: [0.2, 0.5] }));
    // a hole in the hedge with leaves bursting out; skirt hem, then legs and shoes in the air
    const hx = w * 0.42, hy = h * 0.46;
    shape(I.ell(hx, hy + 8, 60, 28, 18), '#2f5a3a', { w: LW.detail });
    shape([[hx - 44, hy + 6], [hx - 10, hy - 16], [hx + 34, hy - 10], [hx + 48, hy + 12], [hx + 10, hy + 24], [hx - 30, hy + 22]], peg.bottom.color, { w: LW.detail });
    [[-18, -40], [16, -58]].forEach(([dx, a]) => { const lx = hx + dx, ly = hy - 6, ex = lx + Math.cos((a * Math.PI) / 180) * 56, ey = ly - 62; line([[lx, ly], [ex, ey]], 13.6, { taper: [0, 0], minW: 1 }); line([[lx, ly], [ex, ey]], 10, { color: '#e8d8c0', taper: [0, 0], minW: 1 }); shape(I.ell(ex, ey - 4, 12, 7, 10, -0.7), peg.shoes, { w: LW.detail }); });
    for (let k = 0; k < 10; k++) { const a = -Math.PI * (0.1 + k * 0.09), d = 70 + (k % 3) * 18; shape(I.ell(hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.7, 7, 4, 8, a), '#6f9a48', { w: 1.2 }); }
    PG.sfx(w * 0.5, h * 0.2, 'CRASH!', { size: 64, color: '#f2c230', rot: -6 });
    [[0.2, 0.2], [0.8, 0.16], [0.32, 0.1], [0.9, 0.3]].forEach(([x, yy]) => shape(I.ell(w * x, h * yy, 7, 4, 8, 0.6), '#6f9a48', { w: 1.2 }));
    SC.cloud(w * 0.86, h * 0.8, 10, '#d8d4c6');
  });
  y += 300 + G;

  // 4–6 — the same framing, three different mornings
  r = PG.row(y, 250, [1, 1, 1]);
  PG.panel(r[0], null, (w, h) => {
    park(w, h, COLD, { duckX: w * 0.7 });
    I.fill(I.ell(w * 0.5, h * 0.9, 90, 18, 20), '#8fb0c4', { wob: 0.8 });
    const b = bike(w * 0.5, h * 0.96, 0.8, { tilt: 70 });
    void b;
    F.fig(peg, { x: w * 0.36, y: h * 0.94, sit: 0, s: 0.8, yaw: 20, legN: [70, -10], legF: [60, -5], armN: [100, 30], armF: [80, 30], handN: 'open', handF: 'open', tint: COLD.tint, head: { yaw: 20, mood: 'shock', mouth: 'o' } });
    PG.sfx(w * 0.7, h * 0.36, 'SPLOSH!', { size: 34, color: '#ffffff', rot: 6 });
    for (let k = 0; k < 8; k++) I.fill(I.ell(w * 0.5 + (I.rng() - 0.5) * 160, h * 0.6 + (I.rng() - 0.5) * 60, 4, 4, 8), '#8fb0c4', { wob: 0 });
  }, (w, h) => PG.caption(10, 10, ['DAY 4'], { size: 13 }));
  PG.panel(r[1], null, (w, h) => {
    park(w, h, COLD, { duckX: w * 0.14 });
    const b = bike(w * 0.46, h * 0.96, 0.8, { tilt: -8 });
    rider(b, { s: 0.8, mood: 'worried', look: [0.2, 1], pitch: -10, tint: COLD.tint });
    // two kids on scooters, laughing
    F.fig(kid('#2a1f24', '#e05a5a', 'short'), { x: w * 0.82, y: h * 0.92, s: 0.7, yaw: -30, armN: [40, 70], head: { yaw: -30, mood: 'joy' } });
    F.fig(kid('#d9793a', '#4a6fb5', 'pigtails'), { x: w * 0.94, y: h * 0.94, s: 0.7, yaw: -40, armN: [120, 40], handN: 'point', head: { yaw: -40, mood: 'joy' } });
    PG.sfx(w * 0.84, h * 0.34, 'HA HA!', { size: 30, color: '#ffffff', rot: 8 });
  }, (w, h) => PG.caption(10, 10, ['DAY 11'], { size: 13 }));
  PG.panel(r[2], null, (w, h) => {
    park(w, h, COLD, { duckX: w * 0.8 });
    const b = bike(w * 0.5, h * 0.96, 0.8, { tilt: -4 });
    rider(b, { s: 0.8, mood: 'angry', look: [0.6, 0.6], tint: COLD.tint });
    // plasters and a bandaged knee
    const k = b.pedalN;
    shape(I.rectPts(k[0] - 6, k[1] - 40, 14, 10), '#ffffff', { w: 1.2, lin: true });
    PG.ticks(b.seat[0] + 10, b.seat[1] - 90, 30, 3, -150, -30, 8);
  }, (w, h) => PG.caption(10, 10, ['DAY 19'], { size: 13 }));
  y += 250 + G;

  // 7 — close: the notebook, 23 falls
  r = PG.row(y, 270, [1, 1.5]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, '#d8cfb8');
    I.grp(`translate(${w * 0.5} ${h * 0.54}) rotate(-6)`, () => {
      shape(I.rectPts(-110, -100, 220, 190), '#fbf6e2', { w: LW.contour, lin: true });
      for (let k = 0; k < 7; k++) line([[-104, -64 + k * 24], [104, -64 + k * 24]], 1.1, { color: '#7fc4e6', taper: [0, 0] });
      line([[-80, -100], [-80, 90]], 1.4, { color: '#e07a7a', taper: [0, 0] });
      I.text(-70, -74, 'FALLS', { font: 'Journal', size: 26, anchor: 'start', color: '#2a3a6a' });
      // tally marks: 4 groups of 5 and 3
      for (let g = 0; g < 5; g++) for (let k = 0; k < (g < 4 ? 5 : 3); k++) {
        const x = -64 + g * 34 + k * 5, yy = -40 + (g % 2) * 4;
        if (k < 4 || g === 4) line([[x, yy], [x + 1, yy + 26]], 2, { color: '#2a3a6a', taper: [0.1, 0.1] });
        else line([[x - 22, yy + 20], [x + 2, yy + 4]], 2, { color: '#2a3a6a', taper: [0.1, 0.1] });
      }
      I.text(-70, 20, 'knees: 2  pride: 0', { font: 'Journal', size: 20, anchor: 'start', color: '#2a3a6a' });
      I.text(-70, 44, 'duck: unimpressed', { font: 'Journal', size: 20, anchor: 'start', color: '#2a3a6a' });
    });
    I.grp(`translate(${w * 0.86} ${h * 0.8})`, () => hand(0, 0, -120, 3.2, 'pinch', { skin: peg.head.skin }));
  });
  // 8 — dusk on the bench, bicycle on its side
  PG.panel(r[1], null, (w, h) => {
    I.rect(0, 0, w, h, PG.linear(0, 0, 0, h, [[0, '#6a6a9a'], [1, '#e8a07a']]));
    shape([[-10, h * 0.66], [w + 10, h * 0.62], [w + 10, h + 10], [-10, h + 10]], '#6a7a7a', { w: SC.BG });
    const bx = w * 0.36, by = h * 0.8;
    shape(I.rectPts(bx - 80, by - 44, 170, 9), '#6a4a3a', { w: LW.fine, lin: true });
    shape(I.rectPts(bx - 80, by - 74, 170, 8), '#6a4a3a', { w: LW.fine, lin: true });
    shape(I.rectPts(bx - 74, by - 35, 7, 36), '#6a4a3a', { w: LW.fine, lin: true }); shape(I.rectPts(bx + 78, by - 35, 7, 36), '#6a4a3a', { w: LW.fine, lin: true });
    const pr = F.rig(peg, { x: bx, y: by - 44, sit: 0, s: 1, yaw: 25, lean: 18, legN: [4, 4], legF: [0, 10] });
    F.fig(peg, { x: bx, y: by - 44, sit: 0, s: 1, yaw: 25, lean: 18, legN: [4, 4], legF: [0, 10], reachN: [pr.legN[1][0] - 4, pr.legN[1][1] - 8], reachF: [pr.legF[1][0] - 4, pr.legF[1][1] - 8], handN: 'relaxed', handF: 'relaxed', tint: ['#6a6a9a', 0.25], head: { yaw: 30, pitch: -12, look: [0.4, 0.8], mood: 'sad' } });
    // the bicycle lying on its side in the grass: wheels become flat ellipses
    I.emit(`<g transform="translate(${w * 0.76} ${h * 0.9}) scale(1 0.36)">`); bike(0, 0, 0.9); I.emit('</g>');
  }, (w, h) => PG.caption(w - 250, 16, ['I FINALLY CONCLUDED'], { size: 16 }));
  y += 270 + G;

  // 9 — the wobbling front wheel, huge, her eyes glued to it
  r = PG.row(y, 300, [1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, '#d9dfe6');
    for (let k = 0; k < 5; k++) { I.emit(`<g opacity="${0.25 - k * 0.04}">`); wheel(w * 0.66 + (k - 2) * 14, h * 0.62, 150, { spin: k * 0.2 }); I.emit('</g>'); }
    wheel(w * 0.66, h * 0.62, 150);
    [[0.44, 0.3], [0.9, 0.34], [0.46, 0.9], [0.88, 0.92]].forEach(([x, yy]) => line([[w * x, h * yy], [w * x + 18, h * yy - 10], [w * x + 36, h * yy]], 2.2, { taper: [0.2, 0.2] }));
    HD.head({ ...peg.head }, { x: w * 0.2, y: h * 0.56, s: 3, yaw: 55, pitch: -12, look: [0.9, 0.9], mood: 'worried' });
    for (let k = 0; k < 3; k++) line([[w * 0.1 - k * 4, h * 0.12 + k * 20], [w * 0.1 - k * 4 - 14, h * 0.1 + k * 20]], 2);
  }, (w, h) => PG.caption(w * 0.34, 16, ['THAT ALL FAILURE WAS FROM A WOBBLING WILL'], { size: 17 }));
  y += 300 + G;

  // 10 — she lifts her eyes to the bridge and the sunrise
  r = PG.row(y, 280, [1]);
  PG.panel(r[0], null, (w, h) => {
    park(w, h, WARM, { sun: true, duckX: w * 0.12 });
    const b = bike(w * 0.34, h * 0.97, 1.05);
    const rr10 = rider(b, { mood: 'neutral', look: [1, -0.4], pitch: 8, lean: 10, tint: WARM.tint });
    // dotted eye-line to the bridge
    { const e = [rr10.headC[0] + rr10.R * 0.8, rr10.headC[1]], t = [w * 0.79, h * 0.5]; for (let k = 1; k < 16; k++) { const f = k / 16; I.fill(I.ell(e[0] + (t[0] - e[0]) * f, e[1] + (t[1] - e[1]) * f, 2.2, 2.2, 6), '#ffffff', { wob: 0 }); } }
  }, (w, h) => PG.caption(16, 16, ['RATHER THAN A WOBBLING WHEEL.'], { size: 18 }));
  y += 280 + G;

  // 11 — she flies
  const SH = 560;
  r = PG.row(y, SH, [1]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, PG.linear(0, 0, 0, h, [[0, '#f79a5a'], [0.5, '#ffd28a'], [1, '#fff0c8']]));
    SC.sun(w * 0.86, h * 0.36, 60, '#fff6d8', { glow: '#fff1c2' });
    PG.rays(w * 0.86, h * 0.36, 70, 1200, 34, '#fff1c2', 2, { spread: 0.03 });
    shape([[-10, h * 0.62], [w * 0.4, h * 0.56], [w + 10, h * 0.58], [w + 10, h + 10], [-10, h + 10]], WARM.grass, { w: SC.BG });
    shape([[-10, h * 0.72], [w + 10, h * 0.66], [w + 10, h * 0.84], [-10, h * 0.92]], WARM.path, { w: LW.fine });
    shape([[w * 0.66, h * 0.58], [w * 0.74, h * 0.5], [w * 0.92, h * 0.5], [w * 1.0, h * 0.58]], '#c9a07a', { w: LW.detail });
    const b = bike(w * 0.5, h * 0.84, 1.6, { spin: 0.6 });
    for (let k = 0; k < 11; k++) { const yy = h * 0.46 + k * 18; line([[w * 0.3, yy], [w * (0.36 + (k % 3) * 0.02), yy - 2]], 2.4, { color: '#ffffff', taper: [0.9, 0.1] }); }
    rider(b, { s: 1.4, mood: 'joy', look: [1, -0.2], pitch: 6, lean: 20, tint: WARM.tint });
    // cardigan and bun ribbon streaming back
    // kids cheering on the grass, the duck taking off
    F.fig(kid('#2a1f24', '#e05a5a', 'short'), { x: w * 0.14, y: h * 0.66, s: 0.9, yaw: 20, armN: [160, 10], armF: [160, 10], handN: 'open', handF: 'open', head: { yaw: 30, mood: 'joy' } });
    F.fig(kid('#d9793a', '#4a6fb5', 'pigtails'), { x: w * 0.24, y: h * 0.64, s: 0.9, yaw: 30, armN: [150, 20], handN: 'fist', head: { yaw: 40, mood: 'joy' } });
    I.grp(`translate(${w * 0.66} ${h * 0.3}) scale(2.4)`, () => {
      shape([[-4, 0], [-32, -24], [-10, -6]], '#e8e8e8', { w: 1.4 });
      shape(I.ell(0, 0, 14, 8, 12), '#ffffff', { w: 1.6 });
      shape([[4, 0], [26, -28], [12, -2]], '#ffffff', { w: 1.6 });
      shape(I.ell(14, -8, 5, 5, 10), '#3f7a4a', { w: 1.4 });
      shape([[18, -8], [26, -7], [18, -5]], '#f2a23a', { w: 1 });
      I.fill(I.ell(15, -9, 1, 1, 6), INK, { wob: 0 });
    });
    PG.ticks(w * 0.66 + 30, h * 0.3 - 30, 50, 3, -150, -30, 12);
    PG.sfx(w * 0.36, h * 0.16, 'WHEEE!', { size: 58, color: '#ffffff', rot: -6 });
  }, (w, h) => PG.caption(w - 380, h - 60, ['– FRANCES E. WILLARD, WHO LEARNED', 'TO RIDE A BICYCLE AT 53'], { size: 14 }));
  y += SH;
  H = y + 70;
  PG.text(PG.MARGIN, H - 34, 'Frances E. Willard, A Wheel Within a Wheel: How I Learned to Ride the Bicycle (1895). A homage to Zen Pencils by Gavin Aung Than.', { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 34, 'No. 5', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
}

page();
const out = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'wobbling-will.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
console.log('wrote', H);
