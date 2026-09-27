// SEVERAL THOUSAND THINGS — Thomas Edison, as reported in Dyer & Martin, Edison: His Life and
// Inventions (1910). A Zen-Pencils-style strip drawn in code.
// node comics/thousand.js -> out/several-thousand-things.svg
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, LW, line, shape } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const { hand, tube } = require('../zp/hand');

I.seed(1910);
const W = 980;
let H = 0;
const mix = F.mix;
const K = { wall: '#f0c96a', wallTile: '#e4b24c', counter: '#4f8f86', counterTop: '#f4efe4', floor: '#c4955e', fridge: '#eef2f2', oven: '#c9d2d6' };
const maya = { H: 2.85, head: { skin: '#8a5a3e', hair: '#231a1c', hairLine: '#4a3a3a', hairStyle: 'short', hairVol: 1.28, hairTop: 'round', hairline: 0.25, napeLevel: 0.6, fringe: 5, R: 25, eyeW: 0.28, eyeH: 0.34, lashes: 2, blush: 1, glasses: '#e05a5a', nose: 'button', noseLen: 0.14 },
  top: { color: '#ffffff', sleeve: 'long', details: (r) => apron(r) }, bottom: { type: 'pants', color: '#3d6fb5' }, shoes: '#e05a5a', limbs: 1.1 };
const dad = { H: 3.7, build: 1.08, head: { skin: '#8a5a3e', hair: '#231a1c', hairStyle: 'short', hairline: 0.1, napeLevel: 0.2, R: 27, tall: 1.12, jaw: 1.25, jawW: 0.72, eyeW: 0.22, eyeH: 0.26, age: 0.4, moustache: '#231a1c', browThick: 1.3 },
  top: { color: '#dfe6ee', sleeve: 'long', collar: '#ffffff', details: (r) => dadTie(r) }, bottom: { type: 'pants', color: '#4a4f5a' }, shoes: '#2a2224' };

function apron(r) {
  if (Math.abs(r.yaw) > 100) return;
  const n = r.neck, u = r.unit, dir = r.dir;
  const t = 1 - r.turn * 0.4;
  shape([[n[0] - u * 0.16 * t, n[1] + u * 0.2], [n[0] + u * 0.16 * t, n[1] + u * 0.2], [n[0] + u * 0.3 * t + dir * u * 0.05, n[1] + u * 1.3], [n[0] - u * 0.3 * t + dir * u * 0.05, n[1] + u * 1.3]], '#f2a23a', { w: LW.detail });
  I.fill(I.ell(n[0] + dir * u * 0.02, n[1] + u * 0.9, u * 0.12, u * 0.08, 10), '#ffffff', { op: 0.85 });
  line([[n[0] - u * 0.16 * t, n[1] + u * 0.2], [n[0], n[1] - u * 0.02], [n[0] + u * 0.16 * t, n[1] + u * 0.2]], LW.fine);
}
function dadTie(r) {
  if (Math.abs(r.yaw) > 100) return;
  const n = r.neck, u = r.unit;
  shape([[n[0] - u * 0.05, n[1] + u * 0.12], [n[0] + u * 0.05, n[1] + u * 0.12], [n[0] + u * 0.08, n[1] + u * 0.8], [n[0], n[1] + u * 0.9], [n[0] - u * 0.06, n[1] + u * 0.8]], '#b8342e', { w: LW.detail });
}
// a loaf of bread in one of many failed (or finally perfect) states
function loaf(x, y, s, kind = 'good') {
  const c = { brick: '#d9b48a', burnt: '#3a2a22', flat: '#e8cf9a', raw: '#f4e8cc', exploded: '#c98a4a', good: '#c9803a' }[kind];
  I.grp(`translate(${x} ${y}) scale(${s})`, () => {
    if (kind === 'flat') { shape([[-50, 0], [-46, -10], [46, -12], [52, 0]], c, { w: LW.contour }); return; }
    if (kind === 'exploded') {
      shape([[-42, 0], [-44, -30], [-30, -44], [-10, -60], [0, -40], [14, -66], [26, -42], [44, -34], [42, 0]], c, { w: LW.contour });
      [[-20, -70], [30, -76], [4, -84]].forEach(([dx, dy]) => shape(I.ell(dx, dy, 6, 4, 8), c, { w: 1.4 }));
      return;
    }
    const top = kind === 'brick' ? -26 : kind === 'raw' ? -30 : -42;
    shape([[-46, 0], [-48, top * 0.5], [-34, top], [0, top - 6], [34, top], [48, top * 0.5], [46, 0]], c, { w: LW.contour });
    if (kind === 'good') { [[-22, -30, -8, -44], [-4, -34, 10, -48], [14, -30, 28, -42]].forEach(([a, b, cc, d]) => line([[a, b], [cc, d]], 2.4, { color: '#f4d69a' })); I.clipPoly([[-46, 0], [-48, -21], [-34, -42], [0, -48], [34, -42], [48, -21], [46, 0]], () => I.fill([[-60, -30], [60, -44], [60, -60], [-60, -60]], '#e0a45a', { lin: true, wob: 0 })); }
    if (kind === 'burnt') for (let k = 0; k < 3; k++) line([[-20 + k * 18, top - 10], [-24 + k * 18, top - 30], [-18 + k * 18, top - 46]], 3, { color: '#8a8a8a', taper: [0.3, 0.3], op: 0.7 });
    if (kind === 'raw') { line([[-30, -14], [30, -18]], 1.4, { color: '#c9b89a' }); }
  });
}
// a polaroid on the fridge with a handwritten note under it
function polaroid(x, y, rot, kind, n, note, sc = 1) {
  I.grp(`translate(${x} ${y}) rotate(${rot}) scale(${sc})`, () => {
    shape(I.rectPts(-30, -34, 60, 70), '#ffffff', { w: 1.6, lin: true });
    I.rect(-24, -28, 48, 44, '#f7e3a0');
    I.clipRect(-24, -28, 48, 44, () => loaf(0, 12, 0.42, kind));
    I.text(0, 30, `#${n}`, { font: 'Journal', size: 11, color: '#2a3a6a' });
    void note;
    I.fill(I.ell(0, -32, 5, 5, 8), ['#e05a5a', '#3d6fb5', '#6fa84a', '#f2c230'][n % 4], { wob: 0 });
  });
}
const KINDS = ['brick', 'burnt', 'flat', 'raw', 'exploded'];
const NOTES = ['too much salt', 'oven too hot', 'yeast dead', 'no 2nd rise', 'too wet', 'too dry', 'cold kitchen', 'forgot salt', 'knead more', 'lid on?', 'less flour', 'steam!'];
function fridge(x, y, w, h, count, sc = 1) {
  shape(I.rectPts(x, y, w, h), K.fridge, { w: LW.contour, lin: true });
  line([[x, y + h * 0.3], [x + w, y + h * 0.3]], LW.detail, { lin: true });
  shape(I.rectPts(x + w - 16, y + h * 0.34, 7, 50), '#b9c4c8', { w: 1.4, lin: true });
  shape(I.rectPts(x + w - 16, y + h * 0.08, 7, 30), '#b9c4c8', { w: 1.4, lin: true });
  I.clipRect(x + 4, y + 4, w - 8, h - 8, () => {
    for (let i = 0; i < count; i++) {
      const cols = Math.max(2, Math.floor(w / (58 * sc)));
      const px = x + 34 * sc + (i % cols) * ((w - 60 * sc) / Math.max(1, cols - 1)) + ((i * 7) % 9) * sc - 4 * sc;
      const py = y + 40 * sc + Math.floor(i / cols) * 62 * sc + ((i * 5) % 7) * sc;
      polaroid(px, py, ((i * 37) % 21) - 10, KINDS[i % 5], i + 1, '', sc);
    }
  });
}
function kitchen(w, h, o = {}) {
  I.rect(0, 0, w, h, K.wall);
  for (let yy = 0; yy < h * 0.62; yy += 26) for (let x = (yy / 26) % 2 ? -13 : 0; x < w; x += 26) I.emit(`<rect x="${x + 1}" y="${yy + 1}" width="24" height="24" fill="${K.wallTile}" opacity="0.5"/>`);
  I.rect(0, h * 0.62, w, h * 0.38, K.floor);
  line([[-4, h * 0.62], [w + 4, h * 0.62]], LW.detail, { taper: [0, 0] });
  for (let x = -40; x < w + 40; x += 60) line([[x, h * 0.62], [x - 40, h + 4]], 1.2, { color: '#b99470', taper: [0, 0] });
  if (o.window !== false) SC.windowFrame(o.wx ?? w * 0.62, h * 0.08, 150, 120, { sky: o.sky || '#9fd3e8', frame: '#ffffff', view: (x, y, ww, hh) => { SC.cloud(x + 50, y + 40, 16); SC.tree(x + ww - 30, y + hh + 10, 110, {}); }, sill: true });
}
function counter(x, y, w, h) {
  shape(I.rectPts(x, y, w, h), K.counter, { w: LW.contour, lin: true });
  shape(I.rectPts(x - 8, y - 12, w + 16, 14), K.counterTop, { w: LW.detail, lin: true });
  for (let k = 1; k < Math.floor(w / 90); k++) line([[x + k * 90, y + 4], [x + k * 90, y + h]], LW.fine, { lin: true });
  for (let k = 0; k < Math.floor(w / 90); k++) shape(I.rectPts(x + k * 90 + 38, y + 20, 14, 5), '#f4efe4', { w: 1.2, lin: true });
}
function flourCloud(x, y, s) {
  for (let k = 0; k < 9; k++) I.fill(I.ell(x + (I.rng() - 0.5) * 60 * s, y + (I.rng() - 0.5) * 30 * s, (10 + I.rng() * 16) * s, (8 + I.rng() * 12) * s, 12), '#ffffff', { op: 0.75, wob: 0.4 });
}
function credits(x, y, runs) {
  I.emit(`<text x="${x}" y="${y}" font-family="Letter" font-size="13" letter-spacing="2">${runs.map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, ' ')}</tspan>`).join('')}</text>`);
}

function page() {
  PG.sfx(116, 104, 'SEVERAL', { size: 62, color: '#e05a5a', anchor: 'start', rot: -3, sw: 3 });
  PG.sfx(116, 200, 'THOUSAND THINGS', { size: 96, color: '#f2a23a', anchor: 'start', rot: -2, sw: 3.4, ls: 2 });
  credits(118, 240, [['WORDS BY ', INK], ['THOMAS EDISON', '#e05a5a'], ['      ART BY ', INK], ['CLAUDE', '#c98a1a']]);
  // the title spot: a stack of polaroids
  I.grp('translate(830 110)', () => { polaroid(-20, 10, -12, 'burnt', 7, ''); polaroid(10, 0, 8, 'exploded', 13, ''); polaroid(0, 20, -2, 'brick', 1, ''); });
  let y = 270;
  const G = PG.GUT_V;
  let r;

  // 1 — Nana's card, a cloud of flour
  r = PG.row(y, 340, [1]);
  PG.panel(r[0], null, (w, h) => {
    kitchen(w, h, { wx: w * 0.1 });
    counter(w * 0.3, h * 0.56, w * 0.64, h * 0.44);
    // bowls, bag of flour, the handwritten card propped against a jar
    shape([[w * 0.62, h * 0.44], [w * 0.74, h * 0.44], [w * 0.72, h * 0.52], [w * 0.64, h * 0.52]], '#6fa8d0', { w: LW.detail });
    shape([[w * 0.78, h * 0.3], [w * 0.86, h * 0.3], [w * 0.88, h * 0.52], [w * 0.76, h * 0.52]], '#f4efe4', { w: LW.detail, lin: true });
    I.text(w * 0.82, h * 0.44, 'FLOUR', { font: 'Letter', size: 12, color: '#b8342e' });
    I.grp(`translate(${w * 0.56} ${h * 0.4}) rotate(-6)`, () => {
      shape(I.rectPts(-70, -52, 140, 100), '#fbf6e2', { w: LW.detail, lin: true });
      I.text(0, -26, "Nana's Loaf", { font: 'Journal', size: 20, color: '#2a3a6a' });
      ['4 cups flour', '1 spoon yeast', 'salt, warm water', 'LOVE (lots)'].forEach((t, i) => I.text(-58, -4 + i * 15, t, { font: 'Journal', size: 13, anchor: 'start', color: '#2a3a6a' }));
    });
    const bag = [w * 0.33, h * 0.44];
    void 0;
    flourCloud(bag[0] + 4, bag[1] - 34, 1.6);
    F.fig(maya, { x: w * 0.24, y: h * 0.96, s: 1.2, yaw: 50, reachN: [bag[0] - 8, bag[1] + 8], reachF: [bag[0] + 14, bag[1] + 20], handN: 'grip', handF: 'grip', head: { yaw: 50, look: [0.9, -0.2], mood: 'joy' },
      front: () => { I.grp(`translate(${bag[0]} ${bag[1]}) rotate(-35)`, () => { shape([[-14, -24], [14, -24], [18, 22], [-18, 22]], '#f4efe4', { w: LW.detail, lin: true }); I.text(0, 4, 'FLOUR', { font: 'Letter', size: 8, color: '#b8342e' }); }); } });
    I.fill(I.ell(w * 0.24 + 30, h * 0.36, 4, 3, 8), '#ffffff', { wob: 0 });
  });
  y += 340 + G;

  // 2 — loaf #1: a brick
  r = PG.row(y, 290, [1.25, 1]);
  PG.panel(r[0], null, (w, h) => {
    kitchen(w, h, { window: false });
    counter(-20, h * 0.66, w + 40, h * 0.34);
    loaf(w * 0.62, h * 0.54 + 20, 1.1, 'brick');
    PG.ticks(w * 0.62, h * 0.4, 50, 3, -150, -30, 10);
    I.text(w * 0.62, h * 0.24, 'CLONK.', { font: 'Title', size: 30 });
    F.fig(maya, { x: w * 0.24, y: h + 60, s: 1.4, yaw: 70, armN: [110, 70], armF: [100, 80], handN: 'grip', handF: 'grip', head: { yaw: 70, pitch: -6, look: [1, 0.3], mood: 'shut' },
      front: (rr) => { const [ex, ey] = [rr.headC[0] + rr.R * 0.7, rr.headC[1] - rr.R * 0.05]; shape(I.rectPts(ex, ey - 16, 38, 30), '#3a3a4a', { w: LW.detail, lin: true }); shape(I.rectPts(ex + 38, ey - 8, 14, 16), '#2a2a34', { w: LW.detail, lin: true }); shape(I.ell(ex + 53, ey, 4, 7, 10), '#8ab0d0', { w: 1.2 }); shape(I.rectPts(ex + 6, ey - 22, 12, 6), '#2a2a34', { w: 1.2, lin: true }); } });
  }, (w, h) => PG.caption(12, 12, ['LOAF #1'], { size: 13 }));
  PG.panel(r[1], null, (w, h) => {
    kitchen(w, h, { window: false });
    fridge(w * 0.2, h * 0.08, w * 0.6, h * 0.9, 1);
    F.fig(maya, { x: w * 0.9, y: h + 40, s: 1.1, yaw: -60, armN: [120, 40], handN: 'pinch', head: { yaw: -55, mood: 'smile' } });
  });
  y += 290 + G;

  // 3–5 — #6 burnt, #13 exploded, #22 raw: the fridge filling
  r = PG.row(y, 250, [1, 1, 1]);
  [['burnt', 6, 5, '#3a2a22'], ['exploded', 13, 12, '#c98a4a'], ['raw', 22, 21, '#f4e8cc']].forEach(([kind, n, onFridge], i) => {
    PG.panel(r[i], null, (w, h) => {
      kitchen(w, h, { window: false });
      fridge(w * 0.52, h * 0.06, w * 0.44, h * 0.94, onFridge, 0.5);
      counter(-20, h * 0.7, w * 0.54, h * 0.3);
      loaf(w * 0.26, h * 0.62 + 10, 0.9, kind);
      if (kind === 'burnt') { I.fill(I.ell(w * 0.26, h * 0.3, 60, 30, 14), '#8a8a8a', { op: 0.5, wob: 1 }); PG.sfx(w * 0.26, h * 0.26, 'COUGH', { size: 26, color: '#ffffff', rot: -6 }); }
      if (kind === 'exploded') PG.sfx(w * 0.28, h * 0.36, 'FWUMP!', { size: 30, color: '#f2c230', rot: 6 });
      if (kind === 'raw') { PG.sfx(w * 0.26, h * 0.26, 'SPLAT', { size: 26, color: '#ffffff', rot: -4 }); }
    }, (w, h) => PG.caption(10, 10, [`LOAF #${n}`], { size: 13 }));
  });
  y += 250 + G;

  // 6 — Dad in the doorway, the fridge buried
  r = PG.row(y, 380, [1]);
  PG.panel(r[0], null, (w, h) => {
    kitchen(w, h, { wx: w * 0.4 });
    // the doorway on the left, hallway beyond
    shape(I.rectPts(20, 20, 160, h), '#e8d6b8', { w: LW.contour, lin: true });
    I.rect(34, 34, 132, h, '#cdb894');
    fridge(w * 0.62, h * 0.06, w * 0.32, h * 0.92, 47, 0.62);
    // photos spilling onto the wall around it
    for (let k = 0; k < 10; k++) polaroid(w * 0.56 - (k % 2) * 22, h * 0.14 + k * 30, (k * 17) % 20 - 10, KINDS[k % 5], 38 + k, '', 0.62);
    F.fig(dad, { x: 110, y: h * 1.02, s: 1.25, yaw: 30, armN: [20, 30], armF: [0, 20], handN: 'relaxed', head: { yaw: 50, look: [0.9, 0], mood: 'shock', mouth: 'o' } });
  }, (w, h) => PG.balloon(260, 60, ['MAYA... THAT\'S', '47 FAILURES.'], 170, 130));
  y += 380 + G;

  // 7 — Maya, flour on her nose, grinning
  r = PG.row(y, 330, [1, 1.25]);
  PG.panel(r[0], null, (w, h) => {
    I.rect(0, 0, w, h, '#f2a23a');
    PG.rays(w * 0.5, h * 0.6, 40, 700, 30, '#f7c16a', 3);
    shape([[-10, h + 10], [w * 0.14, h * 0.86], [w * 0.86, h * 0.86], [w + 10, h + 10]], '#ffffff', { w: LW.contour });
    shape([[w * 0.28, h * 0.86], [w * 0.72, h * 0.86], [w * 0.8, h + 10], [w * 0.2, h + 10]], '#f2a23a', { w: LW.contour });
    HD.head(maya.head, { x: w * 0.5, y: h * 0.5, s: 3.2, yaw: 12, look: [0.2, 0], mood: 'joy' });
    // flour on her nose and cheek
    I.fill(I.ell(w * 0.53, h * 0.52, 12, 8, 10), '#ffffff', { op: 0.9, wob: 0.6 });
    I.fill(I.ell(w * 0.4, h * 0.56, 10, 6, 10), '#ffffff', { op: 0.8, wob: 0.6 });
  }, (w, h) => PG.balloon(w * 0.5, 44, ['RESULTS! WHY, MAN, I HAVE', 'GOTTEN A LOT OF RESULTS!'], w * 0.56, 110, { size: 13.5 }));
  PG.panel(r[1], null, (w, h) => {
    I.rect(0, 0, w, h, '#fbf6e2');
    // a close look at the notes under the photos: a lab notebook
    for (let k = 0; k < 6; k++) {
      const x = 40 + (k % 3) * 150, yy = 46 + Math.floor(k / 3) * 118;
      polaroid(x + 30, yy, ((k * 13) % 10) - 5, KINDS[k % 5], [3, 9, 17, 24, 31, 44][k], '');
      I.text(x + 30, yy + 58, NOTES[k * 2 % NOTES.length], { font: 'Journal', size: 17, color: '#2a3a6a' });
      line([[x - 2, yy + 64], [x + 62, yy + 62]], 1.4, { color: '#b8342e', taper: [0.1, 0.1] });
    }
  }, (w, h) => PG.caption(12, h - 64, ['I KNOW SEVERAL THOUSAND THINGS', 'THAT WON\'T WORK.'], { size: 15 }));
  y += 330 + G;

  // 8 — she explains, pointing at the fridge
  r = PG.row(y, 300, [1]);
  PG.panel(r[0], null, (w, h) => {
    kitchen(w, h, { window: false });
    fridge(w * 0.56, h * 0.04, w * 0.28, h * 0.96, 47, 0.62);
    F.fig(maya, { x: w * 0.3, y: h * 1.0, s: 1.15, yaw: 40, armN: [10, 10], armF: [-6, 10], head: { yaw: 40, pitch: 6, look: [0.8, -0.3], mood: 'smile' } });
    const dr = F.rig(dad, { x: w * 0.5, y: h * 1.04, s: 1.1, yaw: 50, lean: 12 });
    F.fig(dad, { x: w * 0.5, y: h * 1.04, s: 1.1, yaw: 50, lean: 12, reachN: [w * 0.6, dr.shN[1] + 10], bendN: 1, armF: [4, 10], handN: 'point', head: { yaw: 55, pitch: 4, look: [0.9, 0.2], mood: 'smile' } });
    PG.ticks(dr.headC[0], dr.headC[1] - 20, 50, 3, -140, -40, 10);
  });
  y += 300 + G;

  // 9 — loaf #48
  const SH = 560;
  r = PG.row(y, SH, [1]);
  PG.panel(r[0], null, (w, h) => {
    kitchen(w, h, { wx: w * 0.08, sky: '#ffd8a0' });
    fridge(w * 0.66, h * 0.04, w * 0.28, h * 0.9, 47, 0.62);
    PG.glow(w * 0.5, h * 0.6, 420, '#ffcf6a', 0.55);
    // both of them behind the counter, leaning over loaf #48
    const top = h * 0.74;
    F.fig(maya, { x: w * 0.34, y: h * 0.98, s: 1.9, yaw: 40, lean: 12, reachN: [w * 0.44, top - 8], reachF: [w * 0.42, top - 4], handN: 'grip', handF: 'grip', head: { yaw: 40, pitch: -4, look: [0.6, 0.4], mood: 'joy' } });
    F.fig(dad, { x: w * 0.68, y: h * 1.06, s: 1.6, yaw: -40, lean: 10, reachN: [w * 0.57, top - 8], reachF: [w * 0.58, top - 4], handN: 'grip', handF: 'grip', head: { yaw: -40, pitch: -4, look: [-0.6, 0.4], mood: 'joy' } });
    counter(w * 0.04, top + 12, w * 0.92, h - top);
    for (let k = 0; k < 3; k++) line([[w * 0.48 + k * 14, top - 90], [w * 0.46 + k * 14, top - 130], [w * 0.49 + k * 14, top - 170]], 2.6, { color: '#ffffff', taper: [0.3, 0.3], op: 0.9 });
    // the loaf, torn open between their hands: two halves with a soft white crumb
    I.grp(`translate(${w * 0.5} ${top})`, () => {
      I.grp('translate(-16 0) rotate(-8)', () => { shape([[-50, 0], [-54, -26], [-38, -50], [-2, -54], [-2, 0]], '#c9803a', { w: LW.contour }); shape([[-6, -2], [-6, -50], [-1, -52], [0, 0]], '#fbf2dc', { w: LW.detail }); [[-3, -10], [-4, -24], [-3, -38]].forEach(([a, b]) => I.fill(I.ell(a, b, 1.2, 2, 6), '#e0c89a', { wob: 0 })); });
      I.grp('translate(16 0) rotate(8)', () => { shape([[50, 0], [54, -26], [38, -50], [2, -54], [2, 0]], '#c9803a', { w: LW.contour }); shape([[6, -2], [6, -50], [1, -52], [0, 0]], '#fbf2dc', { w: LW.detail }); });
    });
    PG.ticks(w * 0.5, h * 0.62, 90, 7, -170, -10, 16);
    PG.sfx(w * 0.5, h * 0.16, 'LOAF #48', { size: 52, color: '#f2a23a', rot: -3 });
  }, (w, h) => PG.caption(w - 260, h - 42, ['– THOMAS EDISON'], { size: 15 }));
  y += SH;
  H = y + 70;
  PG.text(PG.MARGIN, H - 34, 'Edison, as reported in Dyer & Martin, Edison: His Life and Inventions (1910). A homage to Zen Pencils by Gavin Aung Than.', { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 34, 'No. 4', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
}

page();
const out = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'several-thousand-things.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
console.log('wrote', H);
