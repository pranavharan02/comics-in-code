// SEVERAL THOUSAND THINGS — Thomas Edison, as reported in Dyer & Martin, Edison: His Life and
// Inventions (1910). A Zen-Pencils-style strip drawn in code.
// node comics/thousand.js -> out/several-thousand-things.svg
//
// One kitchen, built once in "world" units (kitchenSet) and filmed with a camera per panel, so the
// doorway, window, cabinets, oven and the fridge stay in the same places from panel to panel. The fridge
// is the repeated prop: every photo has a fixed slot (photoSlot), so photo #6 is in the same place in
// every panel it appears in, and the door fills 1 → 5 → 12 → 21 → 47.
const fs = require('fs');
const path = require('path');
const I = require('../lib/ink');
const { INK, LW, line, shape, cel, shade, mix } = require('../zp/core');
const F = require('../zp/figure');
const HD = require('../zp/head');
const PG = require('../zp/page');
const SC = require('../zp/scene');
const { hand } = require('../zp/hand');

I.seed(1910);
const W = 980;
let H = 0;

// ---- palette: cheerful kitchen yellow -> more flour-white each panel -> the golden loaf
const K = {
  wall: '#d4a650', wallEve: '#c08e4c', tile: '#d4bd82', tileLine: '#b39858',
  cab: '#3f8f86', cabTop: '#e2d6ba', floorA: '#b8563c', floorB: '#dfc89c',
  fridge: '#9cc3da', oven: '#2c2f38', ovenFace: '#d8d2c4', wood: '#a8683a',
  flour: '#fbf8f0', ink: '#2a3a6a', red: '#d9493a', gold: '#d8923a', hall: '#3a4668',
};

// ---- the cast
function apron(r) {
  if (r.back) {
    const u = r.unit, wst = r.spineAt(0.22);
    line([[r.neck[0] - u * 0.13, r.neck[1] + u * 0.02], [r.neck[0], r.neck[1] - u * 0.03], [r.neck[0] + u * 0.13, r.neck[1] + u * 0.02]], 2.4, { color: '#d9493a' });
    line([[wst[0] - u * 0.3, wst[1]], [wst[0] + u * 0.3, wst[1] - u * 0.01]], u * 0.06, { color: '#b8342e', taper: [0, 0] });
    shape([[wst[0], wst[1]], [wst[0] - u * 0.16, wst[1] - u * 0.09], [wst[0] - u * 0.17, wst[1] + u * 0.07]], '#d9493a', { w: 1.6 });
    shape([[wst[0], wst[1]], [wst[0] + u * 0.16, wst[1] - u * 0.08], [wst[0] + u * 0.16, wst[1] + u * 0.08]], '#d9493a', { w: 1.6 });
    line([[wst[0] - u * 0.02, wst[1] + u * 0.02], [wst[0] - u * 0.08, wst[1] + u * 0.3]], u * 0.05, { color: '#d9493a', taper: [0, 0.2] });
    line([[wst[0] + u * 0.02, wst[1] + u * 0.02], [wst[0] + u * 0.1, wst[1] + u * 0.26]], u * 0.05, { color: '#d9493a', taper: [0, 0.2] });
    cel(I.ell(wst[0], wst[1], u * 0.05, u * 0.05, 8), '#b8342e', { w: 1.4, k: 0.2 });
    return;
  }
  const u = r.unit, dir = r.dir, t = Math.abs(Math.sin(r.yaw * Math.PI / 180));
  const cw = 1 - t * 0.38;                       // narrower when turned
  const off = dir * u * 0.07 * t;               // the front of the body sits toward the facing side
  const chest = r.spineAt(0.86), waist = r.spineAt(0.2);
  const kn = [(r.legN[1][0] + r.legF[1][0]) / 2, Math.max(r.legN[1][1], r.legF[1][1])];
  const col = '#d9493a', sh = '#a8302a';
  const bib = [[chest[0] + off - u * 0.17 * cw, chest[1] - u * 0.02], [chest[0] + off + u * 0.17 * cw, chest[1] - u * 0.02], [waist[0] + off + u * 0.26 * cw, waist[1]], [waist[0] + off - u * 0.26 * cw, waist[1]]];
  // oversized: the skirt hangs below the knees and flares
  const hem = kn[1] + u * 0.2;
  const skirt = [[waist[0] + off - u * 0.3 * cw, waist[1] - u * 0.01], [waist[0] + off + u * 0.3 * cw, waist[1] - u * 0.01], [kn[0] + off + u * 0.4 * cw, hem - u * 0.02], [kn[0] + off + u * 0.2 * cw, hem + u * 0.03], [kn[0] + off, hem - u * 0.01], [kn[0] + off - u * 0.2 * cw, hem + u * 0.03], [kn[0] + off - u * 0.38 * cw, hem]];
  cel(skirt, col, { shade: sh, w: 2.2, k: u / 60 });
  // folds from the waist tie
  [[-0.12, 0.2], [0.05, -0.02], [0.18, 0.3]].forEach(([a, b]) => line([[waist[0] + off + u * a * cw, waist[1] + u * 0.08], [kn[0] + off + u * (a + b * 0.3) * cw * 1.3, hem - u * 0.12]], 1.2, { color: sh }));
  cel(bib, col, { shade: sh, w: 2.2, k: u / 60 });
  // neck strap and waist band
  line([[bib[0][0], bib[0][1]], [r.neck[0] - u * 0.06, r.neck[1] - u * 0.02], [r.neck[0] + u * 0.06, r.neck[1] - u * 0.02], [bib[1][0], bib[1][1]]], 2.2, { color: col });
  shape([[waist[0] + off - u * 0.33 * cw, waist[1] - u * 0.05], [waist[0] + off + u * 0.33 * cw, waist[1] - u * 0.05], [waist[0] + off + u * 0.33 * cw, waist[1] + u * 0.03], [waist[0] + off - u * 0.33 * cw, waist[1] + u * 0.03]], sh, { w: 1.5, lin: true });
  // the big pocket, a wooden spoon in it, a white flour handprint
  const pk = [kn[0] * 0.5 + waist[0] * 0.5 + off, waist[1] * 0.45 + kn[1] * 0.55];
  shape([[pk[0] - u * 0.18 * cw, pk[1] - u * 0.1], [pk[0] + u * 0.18 * cw, pk[1] - u * 0.1], [pk[0] + u * 0.17 * cw, pk[1] + u * 0.12], [pk[0] - u * 0.17 * cw, pk[1] + u * 0.12]], col, { w: 1.4, lin: true });
  // (no spoon: at panel size it read as a stick)
  if ((r.flour ?? 1) > 0) {
    smudge(waist[0] + off - u * 0.1 * cw, waist[1] + u * 0.2, u * 0.07, u * 0.05, Math.round(u) + 1);
    smudge(chest[0] + off + u * 0.05, chest[1] + u * 0.14, u * 0.05, u * 0.035, Math.round(u) + 2);
  }
}
const apronBack = (rr) => {
  const u = rr.unit, wst = rr.spineAt(0.2);
  line([[wst[0] - u * 0.3, wst[1]], [wst[0] + u * 0.3, wst[1] - u * 0.01]], u * 0.07, { color: '#b8342e', taper: [0, 0] });
  shape([[wst[0], wst[1]], [wst[0] - u * 0.17, wst[1] - u * 0.1], [wst[0] - u * 0.18, wst[1] + u * 0.08]], '#d9493a', { w: 1.6 });
  shape([[wst[0], wst[1]], [wst[0] + u * 0.17, wst[1] - u * 0.09], [wst[0] + u * 0.17, wst[1] + u * 0.09]], '#d9493a', { w: 1.6 });
  line([[wst[0] - u * 0.02, wst[1] + u * 0.02], [wst[0] - u * 0.08, wst[1] + u * 0.32]], u * 0.05, { color: '#d9493a', taper: [0, 0.2] });
  line([[wst[0] + u * 0.02, wst[1] + u * 0.02], [wst[0] + u * 0.1, wst[1] + u * 0.28]], u * 0.05, { color: '#d9493a', taper: [0, 0.2] });
  cel(I.ell(wst[0], wst[1], u * 0.055, u * 0.055, 8), '#b8342e', { w: 1.4, k: 0.2 });
};
// the loosened tie: knot pulled down, collar open
function dadTie(r) {
  if (r.back) return;
  const n = r.neck, u = r.unit, t = Math.abs(Math.sin(r.yaw * Math.PI / 180)), off = r.dir * u * 0.05 * t;
  shape([[n[0] + off - u * 0.04, n[1] + u * 0.03], [n[0] + off + u * 0.04, n[1] + u * 0.03], [n[0] + off, n[1] + u * 0.1]], mix('#7a4a32', '#000000', 0.2), { w: 0 });
  const k = [n[0] + off + u * 0.01, n[1] + u * 0.2];
  shape([[k[0] - u * 0.05, k[1] - u * 0.04], [k[0] + u * 0.05, k[1] - u * 0.04], [k[0] + u * 0.035, k[1] + u * 0.04], [k[0] - u * 0.035, k[1] + u * 0.04]], '#b8342e', { w: 1.5 });
  cel([[k[0] - u * 0.035, k[1] + u * 0.04], [k[0] + u * 0.035, k[1] + u * 0.04], [k[0] + u * 0.1, k[1] + u * 0.62], [k[0] + u * 0.04, k[1] + u * 0.74], [k[0] - u * 0.02, k[1] + u * 0.62]], '#c23a32', { w: 1.6, shade: '#8e2622', k: 0.4 });
  line([[n[0] + off - u * 0.11, n[1] - u * 0.02], [n[0] + off - u * 0.02, n[1] + u * 0.15]], 1.3);
  line([[n[0] + off + u * 0.11, n[1] - u * 0.02], [n[0] + off + u * 0.03, n[1] + u * 0.15]], 1.3);
}
const maya = { H: 3.2, head: { face: 'maya', skin: '#8a5a3e', hair: '#1c1416', hairStyle: 'short', hairVol: 1.3, hairTop: 'round', hairline: 0.25, napeLevel: 0.6, R: 25, lashes: 2, blush: 1, glasses: '#e0463a', curly: true },
  top: { color: '#3f5c9e', sleeve: 'long', type: 'jumper', details: (r) => apron(r) }, bottom: { type: 'pants', color: '#3d6fb5' }, shoes: '#f0c23a', limbs: 1.1 };
const dad = { H: 3.7, build: 1.08, head: { face: 'dad', skin: '#7a4a32', hair: '#1c1416', hairStyle: 'short', hairline: 0.1, napeLevel: 0.2, R: 27, tall: 1.12, jawW: 0.72, age: 0.45, moustache: '#1c1416', browThick: 1.3 },
  top: { color: '#dbe5f0', sleeve: 'long', type: 'shirt', collar: '#eef3f8', details: (r) => dadTie(r) }, bottom: { type: 'pants', color: '#3e434e' }, shoes: '#221a1c' };
const MS = 1.1, DS = 1.0; // figure scale per world unit (Maya ~ 145 cm to Dad's 180 cm)

// ---- loaves: each failure reads differently at a glance
const LOAF = { good: '#d8923a', brick: '#e3c48e', burnt: '#2b211e', exploded: '#b8702e', raw: '#ecd9a8', flat: '#e2b876', sunk: '#cf9a58', almost: '#d69a4c' };
function loaf(x, y, s, kind = 'good', o = {}) {
  I.grp(`translate(${I.n1(x)} ${I.n1(y)}) scale(${s})`, () => {
    const k = 1 / s, lw = (w) => w * Math.max(0.55, Math.min(1.4, 1 / Math.sqrt(s)));
    const c = LOAF[kind];
    if (kind === 'brick') {
      const p = [[-48, 0], [-50, -30], [-46, -36], [44, -38], [50, -32], [48, 0]];
      cel(p, c, { shade: '#c49a62', w: lw(3), k: 0.6, lin: true });
      shape([[-46, -36], [44, -38], [36, -30], [-40, -29]], '#f0dcb0', { w: 0, lin: true });
      line([[-10, -37], [-6, -30], [-12, -22]], lw(1.4), { color: '#a07a48' });
      for (let i = 0; i < 9; i++) I.fill(I.ell(-38 + i * 9.5, -14 + (i % 3) * 5, 1.6, 1.2, 6), '#b08a58', { wob: 0 });
      return;
    }
    if (kind === 'raw') {
      const p = [[-64, 0], [-62, -12], [-46, -28], [-10, -34], [24, -30], [50, -18], [64, -4], [70, 6], [40, 4]];
      cel(p, c, { shade: '#cdb98a', w: lw(3), k: 0.6 });
      I.fill([[-30, -16], [-8, -20], [14, -18], [0, -14]], '#ffffff', { op: 0.8, wob: 0 });
      shape(I.ell(18, -12, 8, 3.5, 12), '#dccaa0', { w: lw(1.3) }); // the finger dent
      // a drip over the board edge
      shape([[52, 2], [60, 3], [58, 16], [55, 20], [52, 14]], c, { w: lw(2) });
      return;
    }
    if (kind === 'flat') {
      cel([[-56, 0], [-54, -9], [-30, -14], [30, -15], [54, -10], [56, 0]], c, { shade: '#c08e50', w: lw(3), k: 0.5 });
      return;
    }
    if (kind === 'exploded') {
      const dome = [[-50, 0], [-54, -18], [-46, -34], [46, -34], [54, -18], [50, 0]];
      cel(dome, c, { shade: '#8a4e1e', w: lw(3), k: 0.6 });
      // the burst: pale dough mushrooming out of the split crust and flopping over the sides
      const top = [[-40, -30], [-60, -30], [-66, -46], [-52, -60], [-36, -58], [-30, -80], [-10, -74], [0, -96], [16, -78], [36, -86], [42, -64], [60, -60], [66, -44], [58, -30], [40, -30]];
      cel(top, '#f4dca6', { shade: '#d6ae70', w: lw(3), k: 0.6 });
      [[[-58, -34], [-56, -18]], [[60, -34], [58, -20]]].forEach((q) => { shape([[q[0][0] - 6, q[0][1]], [q[0][0] + 6, q[0][1]], [q[1][0] + 3, q[1][1]], [q[1][0] - 3, q[1][1] + 4]], '#f4dca6', { w: lw(2) }); });
      [[[-44, -46], [-30, -54]], [[-6, -60], [2, -82]], [[20, -66], [32, -74]]].forEach((q) => line(q, lw(1.6), { color: '#b8905a' }));
      // torn crust flaps standing up at the edges of the split
      shape([[-44, -34], [-36, -48], [-28, -34]], c, { w: lw(2) });
      shape([[26, -34], [36, -50], [44, -34]], c, { w: lw(2) });
      if (o.splat !== false) [[-86, -60, 7, 5], [74, -90, 6, 4], [-60, -110, 5, 4], [92, -40, 5, 3], [10, -124, 6, 4]].forEach(([a, b, rx, ry]) => shape(I.ell(a, b, rx, ry, 9), '#f2d9a4', { w: lw(1.6) }));
      return;
    }
    // domed loaves: good, burnt, sunk, almost
    const h = kind === 'sunk' ? 36 : kind === 'almost' ? 44 : 52;
    const p = kind === 'sunk'
      ? [[-50, 0], [-52, -18], [-42, -34], [-20, -36], [0, -26], [20, -36], [42, -34], [52, -18], [50, 0]]
      : [[-50, 0], [-54, -h * 0.4], [-44, -h * 0.8], [-20, -h], [20, -h], [44, -h * 0.8], [54, -h * 0.4], [50, 0]];
    const sh = kind === 'burnt' ? '#140e0d' : shade(c, 0.28);
    cel(p, c, { shade: sh, w: lw(3), k: 0.7 });
    if (kind === 'burnt') {
      // grey char highlights, orange ember cracks
      shape([[-36, -h * 0.84], [-10, -h * 0.98], [-16, -h * 0.9], [-34, -h * 0.72]], '#5a4e4a', { w: 0 });
      [[[-20, -h], [-14, -h * 0.7], [-22, -h * 0.5]], [[14, -h * 0.95], [18, -h * 0.65]], [[36, -h * 0.75], [30, -h * 0.5]]].forEach((q) => line(q, lw(2), { color: '#e8763a' }));
      return;
    }
    // top highlight band
    I.clipPoly(p, () => I.fill([[-60, -h * 0.72], [0, -h * 0.9], [60, -h * 0.72], [60, -h - 12], [-60, -h - 12]], mix(c, '#fff2c8', 0.35), { wob: 0 }));
    ink(p, lw(3));
    if (kind === 'sunk') { line([[-18, -33], [0, -24], [18, -33]], lw(1.6), { color: shade(c, 0.4) }); return; }
    // three diagonal scores, each with a pale open "ear"
    const n = kind === 'almost' ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const cx = (i - (n - 1) / 2) * 26, cy = -h * 0.66;
      const q = [[cx - 12, cy + 8], [cx - 2, cy - 2], [cx + 12, cy - 10], [cx + 2, cy + 2]];
      shape(q, '#f5d89a', { w: lw(1.6) });
      line([[cx - 12, cy + 8], [cx + 12, cy - 10]], lw(1.5), { color: shade(c, 0.45) });
    }
    // flour dusting
    if (kind === 'good') for (let i = 0; i < 7; i++) I.fill(I.ell(-30 + i * 10, -h * 0.92 + (i % 2) * 4, 2.2, 1.4, 6), '#fff6e0', { op: 0.8, wob: 0 });
    void k;
  });
}
function ink(pts, w) { I.ink(pts, w, { closed: true, wob: 0, vary: 0.15 }); }

// ---- polaroids: every photo of every loaf, numbered, with a note underneath
const KIND_OF = (n) => ({ 1: 'brick', 6: 'burnt', 13: 'exploded', 22: 'raw', 47: 'almost' }[n] || ['flat', 'burnt', 'brick', 'sunk', 'raw', 'exploded', 'flat', 'sunk', 'brick', 'almost'][(n * 7) % 10]);
const NOTE_OF = {
  1: 'yeast was dead', 3: 'no 2nd rise', 6: 'oven too hot!', 9: 'forgot salt (yuck)', 13: 'too much yeast', 17: 'too wet',
  22: 'not baked long', 24: 'cold kitchen', 31: 'knead 10 min', 38: 'less flour', 44: 'steam in oven?', 47: 'ALMOST!!',
};
const MAG = ['#d9493a', '#3d6fb5', '#5a9a4a', '#f0c23a', '#8a5aa8'];
function polaroid(x, y, rot, n, sc = 1, o = {}) {
  I.grp(`translate(${I.n1(x)} ${I.n1(y)}) rotate(${rot}) scale(${sc})`, () => {
    const lw = (w) => w / Math.max(0.5, Math.sqrt(sc));
    I.fill(I.rectPts(-28, -30, 60, 72), '#000000', { op: 0.16, lin: true, wob: 0 });
    shape(I.rectPts(-30, -34, 60, 72), '#fffdf6', { w: lw(1.6), lin: true, wob: 0.2 });
    // the photo: each one framed differently (she's eleven and holding a phone)
    const r = mk(n * 53 + 7);
    const bgs = ['#dcb468', '#cfa85e', '#c9d6c8', '#b98a5a', '#d8c088', '#c7b3a0'];
    I.clipRect(-25, -29, 50, 46, () => {
      I.rect(-25, -29, 50, 46, bgs[Math.floor(r() * bgs.length)]);
      const tilt = (r() - 0.5) * 16, hz = 2 + r() * 8;
      I.fill([[-30, hz - tilt * 0.3], [30, hz + tilt * 0.3], [30, 20], [-30, 20]], r() < 0.5 ? '#ebe0c8' : '#a8683a', { lin: true, wob: 0 });
      const ls = 0.3 + r() * 0.22, lx = (r() - 0.5) * 12;
      if (r() < 0.35) I.fill(I.ell(lx, hz + 8, 60 * ls, 8 * ls, 14), '#f4f0e6', { wob: 0 }); // on a plate
      I.grp(`rotate(${tilt * 0.5})`, () => loaf(lx, hz + 7, ls, KIND_OF(n), { splat: false }));
      if (KIND_OF(n) === 'burnt') for (let k = 0; k < 2; k++) line([[lx - 6 + k * 10, -12], [lx - 9 + k * 10, -20], [lx - 5 + k * 10, -27]], lw(2), { color: '#8a8a8a', op: 0.9 });
      if (r() < 0.3) I.fill(I.ell(-8 + r() * 20, -14 + r() * 8, 7, 5, 10), '#ffffff', { op: 0.55, wob: 0 }); // flash glare
      if (r() < 0.2) I.fill(I.ell(24, 14, 9, 12, 10), '#8a5a3e', { op: 0.9, wob: 0 }); // her thumb
    });
    line([[-25, -29], [25, -29], [25, 17], [-25, 17], [-25, -29]], lw(1), { color: '#9a9080', taper: [0, 0], lin: true });
    if (sc >= 0.55 && !o.bare) I.text(-22, 31, `#${n}`, { font: 'Journal', size: 11, color: K.ink, anchor: 'start' });
    if (o.note && sc >= 0.55) I.text(-6, 31, o.note, { font: 'Journal', size: 10, color: K.ink, anchor: 'start' });
    else if (sc >= 0.3 && !o.bare) { const r = mk(n * 13); line([[-2, 27], [4 + r() * 6, 26 + r() * 2], [12 + r() * 12, 27]], lw(0.9), { color: K.ink, taper: [0, 0.3] }); if (sc < 0.55) line([[-22, 27], [-12, 27]], lw(0.9), { color: K.red, taper: [0, 0.3] }); }
    if (o.tape) { const t = mk(n + 3)() * 20 - 10; I.grp(`rotate(${t})`, () => { I.fill(I.rectPts(-12, -39, 24, 10), '#efe3bf', { op: 0.92, lin: true, wob: 0 }); line([[-12, -39], [-12, -29]], lw(0.8), { color: '#c8b88a', taper: [0, 0] }); line([[12, -39], [12, -29]], lw(0.8), { color: '#c8b88a', taper: [0, 0] }); }); }
    else cel(I.ell(mk(n)() * 8 - 4, -33, 5.5, 5.5, 10), MAG[n % 5], { w: lw(1.3), k: 0.25 });
  });
}
// where photo #n lives. Fridge photos in fridge-front fractions, overflow in world coords
const FR = { x: 800, y: -330, w: 150, h: 330, z: 75 }; // fridge front (world), on the z 75 plane
function photoSlot(n) {
  const r = I.R ? null : null; void r;
  const j = (a) => Math.sin(n * 12.9898 + a * 78.233) * 43758.5453 % 1;
  if (n <= 36) {
    // main door first (4 cols x 6 rows from the handle side), then the freezer (4 x 3)
    let col, rowY;
    if (n <= 24) { const i = n - 1; col = i % 4; rowY = 0.44 + Math.floor(i / 4) * 0.092; }
    else { const i = n - 25; col = i % 4; rowY = 0.07 + Math.floor(i / 4) * 0.092; }
    return { fx: 0.14 + col * 0.235 + j(1) * 0.03, fy: rowY + j(2) * 0.015, rot: j(3) * 14 };
  }
  // overflow onto the wall: left of the fridge, then above it
  const i = n - 37;
  if (i < 7) return { wx: FR.x - 26 - (i % 2) * 34 + j(4) * 6, wy: FR.y + 40 + Math.floor(i / 2) * 44 + (i % 2) * 18, rot: j(5) * 22 };
  return { wx: FR.x + 20 + (i - 7) * 40, wy: FR.y - 26 + j(6) * 6, rot: j(7) * 18 };
}

// ---- the kitchen set, filmed by a camera
//   cam = { x: world x at the panel centre, s: px per world unit, fy: panel y of the floor/wall line,
//           eye: world y of the eye line (vanishing point height), vx: vp x offset }
const ZD = 520; // world depth scale shared by the floor and every plane
const TOP = -150; // worktop height (world)
function camera(w, h, o) {
  const c = { w, h, ...o };
  c.X = (wx) => w / 2 + (wx - o.x) * o.s;
  c.Y = (wy) => o.fy + wy * o.s;
  c.L = (v) => v * o.s;
  c.vp = [w / 2 + (o.vx || 0), o.fy + (o.eye ?? -200) * o.s];
  c.P = ([wx, wy]) => [c.X(wx), c.Y(wy)];
  // Z(z): the plane z world units in front of the back wall, scaled about the vanishing point
  // exactly as the floor tiles are (f = 1 + z / ZD), so floor, counters, fridge and figures agree
  c.Z = (z) => {
    const f = 1 + z / ZD, [vx, vy] = c.vp;
    const q = { f, s: o.s * f, d: 1 - 1 / f, vp: c.vp, w, h };
    q.X = (wx) => vx + (c.X(wx) - vx) * f; q.Y = (wy) => vy + (c.Y(wy) - vy) * f; q.L = (v) => v * o.s * f;
    return q;
  };
  // where a figure standing at (wx, depth z) goes: feet point and scale
  c.at = (wx, z, k = 1) => { const q = c.Z(z); return { x: q.X(wx), y: q.Y(0), s: q.s * k }; };
  return c;
}
// floor: terracotta and cream checker in one-point perspective; t = flour on the floor (0..1)
function floorTiles(c, o = {}) {
  const y0 = c.Y(0), [vx, vy] = c.vp;
  const size = 70;
  const zd = ZD;
  I.rect(-4, y0, c.w + 8, c.h - y0 + 8, K.floorB);
  const at = (wx, z) => { const f = 1 + z / zd * 1.0; const x = c.X(wx); return [vx + (x - vx) * f, vy + (y0 - vy) * f]; };
  for (let j = 0; j < 16; j++) for (let i = -30; i < 40; i++) {
    if ((i + j) % 2) continue;
    const a = at(i * size, j * size * 0.8), b = at((i + 1) * size, j * size * 0.8), cc = at((i + 1) * size, (j + 1) * size * 0.8), d = at(i * size, (j + 1) * size * 0.8);
    if (a[1] > c.h + 10) continue;
    I.fill([a, b, cc, d], o.eve ? mix(K.floorA, '#3a2a4a', 0.2) : K.floorA, { lin: true, wob: 0 });
  }
  I.rect(-4, y0, c.w + 8, 4, '#000000', { op: 0.15 });
  line([[-4, y0], [c.w + 4, y0]], 1.8, { taper: [0, 0] });
  // flour dust on the floor: more every panel
  if (o.flour) {
    const r = mk(77);
    for (let i = 0; i < 40 * o.flour; i++) {
      const p = at(r() * 1300 - 100, r() * 500);
      if (p[1] < y0 + 4) continue;
      smudge(p[0], p[1], (6 + r() * 16) * c.s, (2 + r() * 4) * c.s, i * 7 + 3, 0.75);
    }
  }
}
const mouthOf = (rr) => [rr.headC[0] + rr.dir * rr.R * 0.55, rr.headC[1] + rr.R * 0.45];
function mk(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// the whole room. o: eve (evening light), count (photos), flour (0..1), ovenOn, hallLight, doorOpen
function kitchenSet(c, o = {}) {
  const X = c.X, Y = c.Y, L = c.L;
  const wall = o.eve ? K.wallEve : K.wall;
  I.rect(-4, -4, c.w + 8, Y(0) + 4, wall);
  // a cornice line and a picture rail
  I.rect(-4, Y(-430) - 4, c.w + 8, L(10), shade(wall, 0.12));
  // splashback tiles between worktop and wall cabinets
  SC.tiles(X(140), Y(-300), L(660), L(160), { color: K.tile, size: L(26), line: K.tileLine, seed: 5 });
  // ---- doorway to the hall (x 0..120)
  const dx0 = X(-10), dx1 = X(120), dy = Y(-300);
  I.rect(dx0, dy, dx1 - dx0, Y(0) - dy + 2, o.hallLight ? '#ffcf7a' : o.eve ? K.hall : '#7d8cb4');
  I.clipRect(dx0, dy, dx1 - dx0, Y(0) - dy, () => {
    // the hall beyond: a side wall in shadow, a coat hook, a floor runner
    I.fill([[dx0, dy], [dx0 + L(40), dy + L(30)], [dx0 + L(40), Y(0) - L(20)], [dx0, Y(0)]], o.hallLight ? '#e8a95a' : o.eve ? '#2c3552' : '#62709a', { lin: true, wob: 0 });
    I.fill([[dx0 + L(40), Y(0) - L(20)], [dx1, Y(0) - L(20)], [dx1, Y(0) + 4], [dx0, Y(0) + 4]], o.hallLight ? '#b9794a' : o.eve ? '#252b40' : '#8a5a3a', { lin: true, wob: 0 });
    if (o.hallLight) { line([[dx0 + L(70), dy + L(40)], [dx0 + L(70), dy + L(70)]], 1.2); I.fill(I.ell(dx0 + L(70), dy + L(76), L(12), L(8), 10), '#fff2c0', { wob: 0 }); }
  });
  const at = L(12);
  shape([[dx0 - at, Y(0)], [dx0 - at, dy - at], [dx1 + at, dy - at], [dx1 + at, Y(0)], [dx1, Y(0)], [dx1, dy], [dx0, dy], [dx0, Y(0)]], '#f4ecdc', { w: 2, lin: true, wob: 0.2 });
  line([[dx0 - at + 3, dy - at + 3], [dx1 + at - 3, dy - at + 3]], 1.2, { color: '#c9bca0', taper: [0, 0] });
  // ---- window over the sink (x 260..420)
  const eveSky = (x, y, w, h) => { I.rect(x, y, w, h, '#3b3f78'); I.fill([[x, y + h * 0.6], [x + w, y + h * 0.5], [x + w, y + h], [x, y + h]], '#e88a5a', { lin: true, wob: 0 }); SC.stars(w, h * 0.5, 5, '#fff6d6', { x0: x, y0: y }); };
  SC.windowFrame(X(262), Y(-392), L(156), L(128), {
    sky: o.eve ? '#3b3f78' : '#a8d8ea', frame: '#fbf8f0', t: L(9), sill: false,
    view: o.eve ? eveSky : (x, y, w, h) => { SC.cloud(x + w * 0.3, y + h * 0.3, L(12)); SC.tree(x + w * 0.8, y + h + L(16), L(110), { kind: 'round', leaf: '#6aa84f' }); SC.hedge(x - 10, x + w + 10, y + h + 4, L(26), { leaf: '#4f8a4a' }); },
  });
  // wall cabinets either side of the window, and the range hood
  const cvp = [c.vp[0], c.vp[1]];
  const WC = c.Z(34);
  SC.wallCabinets(WC.X(140), WC.Y(-440), WC.L(100), WC.L(130), { color: K.cab, vp: cvp, d: WC.d });
  SC.wallCabinets(WC.X(440), WC.Y(-440), WC.L(118), WC.L(130), { color: K.cab, vp: cvp, d: WC.d });
  // hood over the oven
  shape([[X(575), Y(-440)], [X(655), Y(-440)], [X(655), Y(-370)], [X(685), Y(-330)], [X(545), Y(-330)], [X(575), Y(-370)]], '#c9ccd2', { w: 2, lin: true });
  I.rect(X(545), Y(-334), L(140), L(5), '#8a8e96');
  // ---- right of the fridge: Nana's photo, a clock, a calendar
  SC.frame(X(985), Y(-330), L(78), L(96), '#a8683a', (x, y, w, h) => nanaPortrait(x, y, w, h));
  if (c.X(1000) < c.w + 60) SC.clock(X(1110), Y(-360), L(26), { time: o.eve ? [7, 40] : [9, 5] });
  shape(I.rectPts(X(1080), Y(-300), L(64), L(84)), '#fffdf6', { w: 1.4, lin: true });
  I.rect(X(1080), Y(-300), L(64), L(20), K.red);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) I.rect(X(1086 + j * 11.5), Y(-274 + i * 13), L(8), L(8), (i * 5 + j) < (o.days ?? 3) ? '#d9493a' : '#e4ddd0');
  // ---- floor
  floorTiles(c, { eve: o.eve, flour: o.flour });
  // ---- the fridge (front plane z 75, its side runs back to the wall)
  const FZ = c.Z(FR.z);
  const frx = FZ.X(FR.x), fry = FZ.Y(FR.y), frw = FZ.L(FR.w), frh = FZ.L(FR.h);
  // ---- the counter runs and the range (front plane z 60, worktop runs back to the wall)
  const CZ = c.Z(60);
  const topY = CZ.Y(TOP), floorY = CZ.Y(0);
  const drawFridge = () => {
    fridgePhotos(c, o.count || 0, { ...o, only: 'wall' });
    SC.fridge(frx, fry, frw, frh, { color: K.fridge, vp: cvp, d: FZ.d, split: 0.34, handle: '#b8bcc4' });
    fridgePhotos(c, o.count || 0, { ...o, only: 'door' });
    if (o.magnets) [[0.3, 0.52], [0.55, 0.6], [0.4, 0.18]].forEach(([a, b], i) => cel(I.ell(frx + frw * a, fry + frh * b, c.L(6), c.L(6), 10), MAG[i], { w: 1.3, k: 0.3 }));
  };
  const counters = () => {
    endSide(c, CZ, 130, -1);
    SC.counter(CZ.X(130), topY, CZ.L(430), floorY - topY, { color: K.cab, top: K.cabTop, vp: cvp, sink: CZ.X(340), doors: 5, d: CZ.d });
    oven(CZ, CZ.X(560), topY, CZ.L(110), floorY - topY, o);
    SC.counter(CZ.X(670), topY, CZ.L(118), floorY - topY, { color: K.cab, top: K.cabTop, vp: cvp, doors: 1, d: CZ.d });
  };
  // nearer things last: whichever of fridge and counters is on the far side of the vanishing point goes first
  if (cvp[0] > frx) { counters(); drawFridge(); } else { drawFridge(); counters(); }
  // wear: a tea towel over the oven door handle, the door by the sink ajar, a dent, scuffs, a fridge magnet
  {
    const tx = CZ.X(600), ty = topY + CZ.L(28);
    cel([[tx - CZ.L(14), ty], [tx + CZ.L(16), ty], [tx + CZ.L(18), ty + CZ.L(48)], [tx + CZ.L(4), ty + CZ.L(52)], [tx - CZ.L(12), ty + CZ.L(46)]], '#f4efe4', { shade: '#d8d0c0', w: 1.6, k: 0.3, inner: () => { for (let k = 0; k < 3; k++) I.rect(tx - CZ.L(14), ty + CZ.L(10 + k * 13), CZ.L(34), CZ.L(4), K.red, { op: 0.8 }); } });
    const ax = CZ.X(215), ay = topY + CZ.L(34);
    I.fill([[ax, ay], [ax + CZ.L(5), ay + CZ.L(2)], [ax + CZ.L(5), floorY - CZ.L(16)], [ax, floorY - CZ.L(14)]], '#1c2a2a', { lin: true, wob: 0 });
    line([[CZ.X(505), topY + CZ.L(80)], [CZ.X(512), topY + CZ.L(84)], [CZ.X(509), topY + CZ.L(90)]], 1.1, { color: shade(K.cab, 0.4) });
    [[160, 118], [420, 124], [700, 116]].forEach(([sx, sy]) => line([[CZ.X(sx), topY + CZ.L(sy)], [CZ.X(sx + 14), topY + CZ.L(sy - 1)]], 1, { color: shade(K.cab, 0.35) }));
    line([[CZ.X(360), floorY - CZ.L(8)], [CZ.X(390), floorY - CZ.L(7)]], 1.2, { color: '#6a6a70' });
  }
  // flour handprints and dust on the cabinets
  if (o.flour > 0.3) {
    const r = mk(31);
    for (let i = 0; i < 6 * o.flour; i++) handprint(CZ.X(160 + r() * 580), CZ.Y(-110 + r() * 80), CZ.s * (0.8 + r() * 0.35), r() * 50 - 25, i);
  }
  // a point on the worktop at world x, depth z (0 = at the wall, 60 = front edge), and its scale
  const top = (wx, z = 32) => { const q = c.Z(z); return { x: q.X(wx), y: q.Y(TOP), s: q.s }; };
  return { topY, floorY, deskY: topY, top, FZ, CZ, fr: { x: frx, y: fry, w: frw, h: frh } };
}
function endSide(c, CZ, wx, dir) {
  const fx = CZ.X(wx), bx = c.X(wx);
  if ((c.vp[0] - fx) * dir > 0) return;
  I.fill([[fx, CZ.Y(TOP)], [bx, c.Y(TOP)], [bx, c.Y(0)], [fx, CZ.Y(0)]], shade(K.cab, 0.3), { lin: true, wob: 0 });
  I.ink([[fx, CZ.Y(TOP)], [bx, c.Y(TOP)], [bx, c.Y(0)], [fx, CZ.Y(0)]], 1.8, { closed: true, lin: true, wob: 0 });
}
// an irregular flour smudge (never the same shape twice)
function smudge(x, y, rx, ry, seed, op = 0.85) {
  const r = mk(seed * 97 + 11), n = 11, pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 0.62 + r() * 0.5; pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]); }
  I.fill(pts, K.flour, { op, wob: 0.3 });
  for (let i = 0; i < 3; i++) I.fill(I.ell(x + (r() - 0.5) * rx * 2.6, y + (r() - 0.5) * ry * 2.4, rx * 0.12 + r() * rx * 0.1, ry * 0.2, 6), K.flour, { op: op * 0.9, wob: 0 });
}
function handprint(x, y, s, rot, seed = 0) {
  const r = mk(seed * 31 + 5);
  const spread = 0.7 + r() * 0.8, partial = r() < 0.3, sc = s * (0.85 + r() * 0.3), op = 0.45 + r() * 0.3;
  I.grp(`translate(${I.n1(x)} ${I.n1(y)}) rotate(${rot})`, () => {
    I.fill([[-6 * sc, -4 * sc], [6 * sc, -5 * sc], [7 * sc, 6 * sc], [0, 9 * sc], [-6 * sc, 6 * sc]].map(([a, b]) => [a + (r() - 0.5) * sc, b + (r() - 0.5) * sc]), K.flour, { op, wob: 0.3 });
    [[-5, -5, -8], [-1.6, -5.5, -3], [1.8, -5.5, 2], [5, -5, 8]].forEach(([a, b, t], i) => { if (partial && i === 3) return; const Lf = [7, 9, 8.5, 6.5][i] * (0.8 + r() * 0.35); line([[a * sc, b * sc], [(a + t * 0.3 * spread) * sc, (b - Lf) * sc]], 2.5 * sc, { color: K.flour, op, taper: [0, 0.4] }); });
    if (!partial) line([[6 * sc, 2 * sc], [(10 + spread * 2) * sc, -3 * sc]], 2.5 * sc, { color: K.flour, op, taper: [0, 0.4] });
    if (r() < 0.5) line([[0, 9 * sc], [(r() - 0.5) * 6 * sc, (18 + r() * 10) * sc]], 3 * sc, { color: K.flour, op: op * 0.7, taper: [0, 0.8] }); // a smear
  });
}
function handprintOld(x, y, s, rot) {
  I.grp(`translate(${I.n1(x)} ${I.n1(y)}) rotate(${rot})`, () => {
    I.fill([[-6 * s, -4 * s], [6 * s, -5 * s], [7 * s, 6 * s], [0, 9 * s], [-6 * s, 6 * s]], K.flour, { op: 0.62, wob: 0.3 });
    [[-5, -5, -8], [-1.6, -5.5, -3], [1.8, -5.5, 2], [5, -5, 8]].forEach(([a, b, t], i) => { const L = [7, 9, 8.5, 6.5][i]; line([[a * s, b * s], [(a + t * 0.3) * s, (b - L) * s]], 2.6 * s, { color: K.flour, op: 0.62, taper: [0, 0.4] }); });
    line([[6 * s, 2 * s], [11 * s, -3 * s]], 2.6 * s, { color: K.flour, op: 0.62, taper: [0, 0.4] });
  });
}
// the range: hob on top, oven door with a window (glowing when it's on), knobs
function oven(c, x, y, w, h, o = {}) {
  const f = SC.block(x, y + 6, w, h - 6, K.ovenFace, { vp: c.vp, d: 0.001, w: 2 });
  void f;
  SC.block(x - 2, y, w + 4, 8, '#3a3d46', { vp: c.vp, d: c.d ?? 0.07, w: 2 });
  const L = c.L;
  // knobs
  for (let i = 0; i < 4; i++) cel(I.ell(x + w * (0.2 + i * 0.2), y + L(20), L(5), L(5), 10), '#2c2f38', { w: 1.2, k: 0.2 });
  // door, window, handle
  const dy = y + L(36), dh = h - L(56);
  shape(I.rectPts(x + L(6), dy, w - L(12), dh), '#e6e0d2', { w: 1.6, lin: true });
  I.rect(x + L(6), dy + L(4), w - L(12), L(5), '#b8b2a4');
  const win = [x + L(16), dy + L(20), w - L(32), dh * 0.52];
  I.rect(...win, o.ovenOn ? '#f29a3a' : '#1c1a20');
  if (o.ovenOn) { I.fill(I.ell(win[0] + win[2] / 2, win[1] + win[3] * 0.7, win[2] * 0.4, win[3] * 0.3, 12), '#ffd27a', { wob: 0 }); }
  if (o.ovenSplat) [[0.3, 0.3], [0.6, 0.5], [0.5, 0.2], [0.75, 0.7]].forEach(([a, b]) => shape(I.ell(win[0] + win[2] * a, win[1] + win[3] * b, L(7), L(5), 9), '#f2d9a4', { w: 1 }));
  line([[win[0], win[1]], [win[0] + win[2], win[1]], [win[0] + win[2], win[1] + win[3]], [win[0], win[1] + win[3]], [win[0], win[1]]], 1.4, { taper: [0, 0], lin: true });
  line([[win[0] + win[2] * 0.15, win[1] + win[3] * 0.7], [win[0] + win[2] * 0.4, win[1] + win[3] * 0.15]], 2.4, { color: '#ffffff', op: 0.3 });
  shape(I.rectPts(x + L(14), dy + L(10) - L(8), w - L(28), L(5)), '#b8bcc4', { w: 1.2, lin: true });
  I.rect(x + L(4), y + h - L(12), w - L(8), L(8), '#2a2a30');
}
// Nana's portrait on the wall: Nana holding up a golden loaf
function nanaPortrait(x, y, w, h) {
  I.rect(x, y, w, h, '#f4e3c0');
  I.fill([[x, y + h * 0.75], [x + w, y + h * 0.75], [x + w, y + h], [x, y + h]], '#c9a07a', { lin: true, wob: 0 });
  const s = w / 60;
  // body, head, white bun
  I.fill([[x + w * 0.22, y + h], [x + w * 0.3, y + h * 0.62], [x + w * 0.7, y + h * 0.62], [x + w * 0.78, y + h]], '#6a5a9a', { wob: 0 });
  I.fill(I.ell(x + w * 0.5, y + h * 0.44, 10 * s, 12 * s, 14), '#7a4a32', { wob: 0 });
  I.fill(I.ell(x + w * 0.5, y + h * 0.32, 11 * s, 7 * s, 14), '#e8e4dc', { wob: 0 });
  I.fill(I.ell(x + w * 0.5, y + h * 0.22, 5 * s, 4 * s, 10), '#e8e4dc', { wob: 0 });
  line([[x + w * 0.43, y + h * 0.5], [x + w * 0.5, y + h * 0.53], [x + w * 0.57, y + h * 0.5]], 0.9, { color: '#2a1a14' });
  I.fill(I.ell(x + w * 0.44, y + h * 0.44, 1, 1, 6), '#1a1210', { wob: 0 }); I.fill(I.ell(x + w * 0.56, y + h * 0.44, 1, 1, 6), '#1a1210', { wob: 0 });
  I.clipRect(x, y, w, h, () => loaf(x + w * 0.5, y + h * 0.82, 0.3 * s, 'good'));
}
function fridgePhotos(c, count, o = {}) {
  const FZ = c.Z(FR.z);
  const frx = FZ.X(FR.x), fry = FZ.Y(FR.y), frw = FZ.L(FR.w), frh = FZ.L(FR.h);
  for (let n = 1; n <= count; n++) {
    if (o.skip && o.skip.includes(n)) continue;
    const p = photoSlot(n);
    if (o.only && (o.only === 'door') !== (p.fx != null)) continue;
    if (p.fx != null) polaroid(frx + p.fx * frw, fry + p.fy * frh, p.rot, n, FZ.s * (o.photoScale ?? 0.46));
    else polaroid(c.X(p.wx), c.Y(p.wy), p.rot, n, c.s * (o.photoScale ?? 0.46), { tape: true });
  }
}

// ---- small props
function stepStool(x, y, w, h) {
  const t = h * 0.2, d = w * 0.16;
  shape([[x - w * 0.46, y - h + t], [x - w * 0.34, y - h + t], [x - w * 0.42, y], [x - w * 0.52, y]], '#c8872e', { w: 1.8, lin: true });
  shape([[x + w * 0.34, y - h + t], [x + w * 0.46, y - h + t], [x + w * 0.52, y], [x + w * 0.42, y]], '#c8872e', { w: 1.8, lin: true });
  line([[x - w * 0.46, y - h * 0.35], [x + w * 0.46, y - h * 0.35]], 2.2, { taper: [0, 0] });
  cel([[x - w / 2 + d * 0.4, y - h - d * 0.5], [x + w / 2 - d * 0.4, y - h - d * 0.5], [x + w / 2, y - h], [x - w / 2, y - h]], '#f0b44e', { w: 1.8, lin: true, k: 0.2 });
  shape([[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y - h + t], [x - w / 2, y - h + t]], '#d8923a', { w: 1.8, lin: true });
}
function bowl(x, y, r, col = '#6fa8d0') {
  cel([[x - r, y - r * 0.55], [x + r, y - r * 0.55], [x + r * 0.8, y - r * 0.15], [x + r * 0.45, y], [x - r * 0.45, y], [x - r * 0.8, y - r * 0.15]], col, { w: 2.2, k: r / 30 });
  shape(I.ell(x, y - r * 0.55, r, r * 0.16, 20), '#f4ecd8', { w: 1.6 });
}
function board(x, y, w) {
  const t = w * 0.06, d = w * 0.12;
  cel([[x - w / 2 + d * 0.5, y - t - d], [x + w / 2 - d * 0.3, y - t - d], [x + w / 2, y - t], [x - w / 2, y - t]], '#c98a4e', { shade: '#a8683a', w: 1.8, k: 0.3, lin: true });
  shape([[x - w / 2, y - t], [x + w / 2, y - t], [x + w / 2, y], [x - w / 2, y]], '#8e5630', { w: 1.8, lin: true });
  I.fill(I.ell(x + w / 2 - w * 0.08, y - t - d * 0.5, w * 0.025, w * 0.02, 8), '#6a3a20', { wob: 0 });
}
// spilled flour on a worktop: a heap and a dusting
function flourSpill(x, y, s, n = 5, seed = 3) {
  const r = mk(seed);
  for (let i = 0; i < n; i++) I.fill(I.ell(x + (r() - 0.5) * 120 * s, y - r() * 6 * s, (8 + r() * 18) * s, (2 + r() * 3) * s, 12), K.flour, { op: 0.9, wob: 0.6 });
}
function phone(x, y, s, rot = 0) {
  I.grp(`translate(${I.n1(x)} ${I.n1(y)}) rotate(${rot})`, () => {
    shape(I.rectPts(-9 * s, -15 * s, 18 * s, 30 * s), '#22222a', { w: 1.6, lin: true });
    I.rect(-7 * s, -12 * s, 14 * s, 24 * s, '#8ec8e8');
  });
}
function steam(x, y, h, n = 3, gap = 14, w = 3) {
  for (let k = 0; k < n; k++) {
    const x0 = x + (k - (n - 1) / 2) * gap;
    line([[x0, y], [x0 - 5, y - h * 0.3], [x0 + 4, y - h * 0.6], [x0 - 3, y - h]], w, { color: '#ffffff', taper: [0.4, 0.5], op: 0.95 });
  }
}
const phoneBack = (T, s, A) => { const c = A.c; const q = [[-3, -5], [9, -5], [9, 5], [-3, 5]].map(([u, v]) => T([c[0] + u, c[1] + v])); shape(q, '#2a2c36', { w: 1.6, lin: true }); const l = T([c[0] + 6.5, c[1] - 2.8]); cel(I.ell(l[0], l[1], s * 1.2, s * 1.2, 8), '#8a9ab0', { w: 1, k: 0.2 }); };
const mitt = (T, s, A) => { const c = A.c; const q = [[-4, -4], [8, -7], [16, -5], [18, 3], [12, 8], [-3, 6]].map(([u, v]) => T([c[0] + u - 6, c[1] + v])); cel(q, '#e0a03a', { w: 1.8, k: 0.3, shade: '#b87a24' }); };
// flour on Maya: specks in her hair and on her sleeves, more every attempt
const dust = (k) => (rr) => {
  const r = mk(Math.round(k * 100) + 7), R = rr.R;
  for (let i = 0; i < Math.round(4 + 14 * k); i++) { const a = Math.PI * (1.05 + r() * 0.9), d = R * (0.6 + r() * 0.55); I.fill(I.ell(rr.headC[0] + Math.cos(a) * d, rr.headC[1] - R * 0.15 + Math.sin(a) * d, R * 0.05 + r() * R * 0.05, R * 0.04, 6), K.flour, { op: 0.9, wob: 0 }); }
  [rr.armN, rr.armF].forEach((arm) => { for (let i = 0; i < Math.round(1 + 4 * k); i++) { const t = r(), p = [arm[1][0] + (arm[2][0] - arm[1][0]) * t, arm[1][1] + (arm[2][1] - arm[1][1]) * t]; I.fill(I.ell(p[0] + (r() - 0.5) * R * 0.2, p[1] + (r() - 0.5) * R * 0.2, R * 0.08, R * 0.05, 8), K.flour, { op: 0.75, wob: 0.4 }); } });
};
function smoke(x, y, s) {
  // a billowing column: overlapping puffs merged into one outline (ink all, then fill all on top)
  const r = mk(21), P = [];
  for (let k = 0; k < 11; k++) { const t = k / 10; P.push([x + Math.sin(t * 5) * 14 * s + (r() - 0.5) * 16 * s, y - t * 170 * s, (12 + t * 22 + r() * 6) * s]); }
  P.forEach(([a, b, rad]) => I.ink(I.ell(a, b, rad, rad * 0.9, 16), 2.2, { closed: true, wob: 0.6 }));
  P.forEach(([a, b, rad], k) => I.fill(I.ell(a, b, rad - 1, rad * 0.9 - 1, 16), mix('#6e6a74', '#b8b4bd', k / 10), { wob: 0.6 }));
  P.forEach(([a, b, rad]) => I.fill(I.ell(a - rad * 0.25, b - rad * 0.3, rad * 0.45, rad * 0.3, 10), '#ffffff', { op: 0.18, wob: 0.4 }));
}
function credits(x, y, runs) {
  I.emit(`<text x="${x}" y="${y}" font-family="Letter" font-size="13" letter-spacing="2">${runs.map(([t, c]) => `<tspan fill="${c}">${t.replace(/ /g, ' ')}</tspan>`).join('')}</text>`);
}

//__PAGE__

// ============================================================================================ page
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
let PN = 0;
let SPK = [0, 0]; // speaker mouth, set by a panel's art for its balloon tail
let flourCount = 0;
function P(r, art, post, o) { PN++; if (ONLY && !ONLY.includes(PN)) { PG.panel(r, '#ffffff', () => {}, null, o); return; } PG.panel(r, null, art, post, { grain: 0.07, ...(o || {}) }); }

// ---- hand lettering: every letter placed, turned and sized by hand (no stock drop shadow)
function letters(x, y, str, o = {}) {
  const size = o.size || 40, r = mk(o.seed ?? str.length * 17 + 3), font = o.font || 'Title';
  const ws = [...str].map((ch) => PG.textW(ch, size, font, 0) + (o.ls ?? size * 0.03));
  const tot = ws.reduce((a, b) => a + b, 0);
  let cx = o.anchor === 'start' ? x : o.anchor === 'end' ? x - tot : x - tot / 2;
  const rot = (o.rot || 0) * Math.PI / 180;
  const ext = o.extrude ?? shade(o.color || '#ffffff', 0.35);
  const items = [...str].map((ch, i) => {
    const k = 1 + (r() - 0.5) * (o.jit ?? 0.14), dy = (r() - 0.5) * size * 0.07 + (o.arc ? Math.sin((i / Math.max(1, str.length - 1)) * Math.PI) * -o.arc : 0);
    const lx = cx + ws[i] / 2, px = x + (lx - x) * Math.cos(rot) - (dy) * Math.sin(rot), py = y + (lx - x) * Math.sin(rot) + dy * Math.cos(rot);
    cx += ws[i];
    return { ch, px, py, sz: size * k, a: (o.rot || 0) + (r() - 0.5) * (o.tilt ?? 9) };
  });
  const sw = o.sw ?? Math.max(2.4, size / 13);
  // 1 extrude (a darker copy of the fill colour, offset down-right), 2 black keyline, 3 fill
  items.forEach((t) => I.text(t.px + size * 0.05, t.py + size * 0.06, t.ch, { font, size: t.sz, color: ext, stroke: INK, sw, rot: t.a, ls: 0 }));
  items.forEach((t) => I.text(t.px, t.py, t.ch, { font, size: t.sz, color: o.color || '#ffffff', stroke: INK, sw, rot: t.a, ls: 0 }));
  items.forEach((t) => I.text(t.px, t.py, t.ch, { font, size: t.sz, color: o.color || '#ffffff', rot: t.a, ls: 0 }));
  if (o.lines) { // motion/impact lines out of the word
    const [lx0, ly0] = [items[0].px, items[0].py], [lx1, ly1] = [items[items.length - 1].px, items[items.length - 1].py];
    for (let k = 0; k < 3; k++) { line([[lx1 + size * 0.5, ly1 - size * (0.6 - k * 0.3)], [lx1 + size * 0.9, ly1 - size * (0.75 - k * 0.38)]], 2.2, { taper: [0.1, 0.6] }); line([[lx0 - size * 0.5, ly0 - size * (0.6 - k * 0.3)], [lx0 - size * 0.9, ly0 - size * (0.75 - k * 0.38)]], 2.2, { taper: [0.1, 0.6] }); }
  }
}
// ---- a hand-drawn balloon: a slightly lumpy oval, a brush outline, a curved tapering tail
function balloon(cx, cy, lines, tx, ty, o = {}) {
  const size = o.size || 15, lh = size * 1.2;
  const tw = Math.max(...lines.map((l) => PG.textW(l, size))), th = lines.length * lh;
  const a = tw / 2 * 1.14 + 16, b = th / 2 * 1.26 + 12;
  const r = mk(o.seed ?? Math.round(cx * 7 + cy));
  const ph = r() * 6, ph2 = r() * 6;
  const body = [];
  for (let i = 0; i < 56; i++) { const t = (i / 56) * Math.PI * 2, k = 1 + 0.028 * Math.sin(3 * t + ph) + 0.018 * Math.sin(5 * t + ph2); body.push([cx + Math.cos(t) * a * k, cy + Math.sin(t) * b * k * (1 - 0.04 * Math.sin(t))]); }
  const ang = Math.atan2((ty - cy) / b, (tx - cx) / a);
  const base = [cx + Math.cos(ang) * a * 0.9, cy + Math.sin(ang) * b * 0.9];
  const d = Math.hypot(tx - base[0], ty - base[1]), ux = (tx - base[0]) / d, uy = (ty - base[1]) / d;
  const L = Math.max(16, d - (o.gap ?? 14));
  const tip = [base[0] + ux * L, base[1] + uy * L];
  const bend = (o.bend ?? 0.22) * L, nx = -uy, ny = ux;
  const hw = Math.min(a, b) * 0.28;
  const q = (p0, p1, c, n = 8) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push([(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p1[1]]); } return out; };
  const mid = [(base[0] + tip[0]) / 2 + nx * bend, (base[1] + tip[1]) / 2 + ny * bend];
  const sideA = q([base[0] + nx * hw, base[1] + ny * hw], tip, [mid[0] + nx * hw * 0.35, mid[1] + ny * hw * 0.35]);
  const sideB = q(tip, [base[0] - nx * hw, base[1] - ny * hw], [mid[0] - nx * hw * 0.1, mid[1] - ny * hw * 0.1]);
  const tail = sideA.concat(sideB.slice(1));
  if (!o.noTail) { I.fill(tail, '#ffffff', { wob: 0 }); line(sideA, 2.1, { taper: [0, 0.05], lin: true }); line(sideB, 2.1, { taper: [0.05, 0], lin: true }); }
  I.fill(body, '#ffffff', { wob: 0 });
  I.ink(body, 2.3, { closed: true, wob: 0.25, vary: 0.22 });
  if (!o.noTail) I.fill(q([base[0] + nx * (hw - 2.4), base[1] + ny * (hw - 2.4)], [base[0] - nx * (hw - 2.4), base[1] - ny * (hw - 2.4)], [base[0] - ux * 10, base[1] - uy * 10]).concat([[base[0] + ux * 5, base[1] + uy * 5]]), '#ffffff', { wob: 0 });
  lines.forEach((l, i) => PG.text(cx, cy - th / 2 + size * 0.92 + i * lh, l, { size, anchor: 'middle' }));
}
// a flour puff cloud with an inked edge (not a soft blur)
function puff(x, y, s, seed = 5, col = K.flour) {
  const r = mk(seed), P = [];
  for (let k = 0; k < 9; k++) P.push([x + (r() - 0.5) * 80 * s, y - r() * 40 * s, (10 + r() * 14) * s]);
  P.forEach(([a, b, rad]) => I.ink(I.ell(a, b, rad, rad * 0.85, 14), 1.8, { closed: true, wob: 0.4 }));
  P.forEach(([a, b, rad]) => I.fill(I.ell(a, b, rad - 0.9, rad * 0.85 - 0.9, 14), col, { wob: 0.4 }));
  P.forEach(([a, b, rad]) => I.fill(I.ell(a + rad * 0.3, b + rad * 0.3, rad * 0.5, rad * 0.3, 10), '#d8d2c4', { op: 0.5, wob: 0.3 }));
  for (let k = 0; k < 12; k++) I.fill(I.ell(x + (r() - 0.5) * 140 * s, y - r() * 80 * s, 2.2 * s, 2.2 * s, 6), col, { wob: 0 });
}

function title() {
  letters(112, 98, 'SEVERAL', { size: 58, color: K.red, anchor: 'start', rot: -4, seed: 11 });
  letters(108, 194, 'THOUSAND THINGS', { size: 92, color: '#f0a83a', anchor: 'start', rot: -2, seed: 23, arc: 6 });
  // a brush underline and a hand-written byline
  line([[118, 222], [300, 216], [560, 220], [690, 214]], 7, { taper: [0.05, 0.5] });
  PG.text(700, 244, 'ART BY CLAUDE', { size: 12, anchor: 'end', color: INK, ls: 2 });
  // title spot: three polaroids under magnets, #1 with its note
  I.grp('translate(852 132)', () => { polaroid(-30, 8, -12, 6, 1.2); polaroid(32, -4, 10, 13, 1.2); polaroid(0, 20, -3, 1, 1.4, { note: 'yeast!' }); });
}

function page() {
  title();
  let y = 270;
  const G = PG.GUT_V;
  let r;

  // 1 — establishing: the kitchen; Maya on a stool in the foreground, tipping the flour bag
  r = PG.row(y, 410, [1]);
  P(r[0], (w, h) => {
    const c = camera(w, h, { x: 520, s: 0.86, fy: h * 0.77, eye: -175, vx: 40 });
    const S = kitchenSet(c, { count: 0, flour: 0.05, magnets: true });
    SC.jar(S.top(190).x, S.top(190).y + 2, S.top(190).s * 1.3, { label: 'SALT' });
    SC.jar(S.top(224).x, S.top(224).y + 2, S.top(224).s * 1.1, { label: 'YEAST', color: '#f2e6c0' });
    SC.kettle(S.top(720).x, S.top(720).y + 2, S.top(720).s * 1.2);
    // Nana's card, propped against the bread bin at the back of the worktop
    const cd = S.top(270, 14);
    I.grp(`translate(${cd.x} ${cd.y - cd.s * 34}) rotate(-7) scale(${cd.s * 0.52})`, () => recipeCard());
    // stool and Maya in front of the counter, leaning into the tip
    const ft = c.at(430, 110), stH = 44 * ft.s;
    stepStool(ft.x, ft.y, 70 * ft.s, stH);
    const pose = { ...F.POSES.stand(), x: ft.x + 3 * ft.s, y: ft.y - stH - 4 * ft.s, s: MS * ft.s, yaw: 62, lean: 12, curve: 10, shadow: false };
    const r0 = F.rig(maya, pose), u = r0.unit;
    const bw = S.top(525, 34), bx = bw.x;
    bowlBack(bx, bw.y + 4, 40 * bw.s);
    const bag = { c: [r0.shN[0] + u * 1.12, r0.shN[1] - u * 0.08], ang: -58, w: u * 0.62, h: u * 0.9 };
    const BL = (lx, ly) => { const t = bag.ang * Math.PI / 180; return [bag.c[0] + lx * Math.cos(t) - ly * Math.sin(t), bag.c[1] + lx * Math.sin(t) + ly * Math.cos(t)]; };
    const pour = BL(bag.w * 0.15, bag.h / 2 + bag.w * 0.08);
    I.fill([[pour[0] - u * 0.08, pour[1] - u * 0.02], [pour[0] + u * 0.06, pour[1]], [bx + u * 0.12, bw.y - 24 * bw.s], [bx - u * 0.14, bw.y - 24 * bw.s]], K.flour, { wob: 0.5 });
    I.ink([[pour[0] - u * 0.08, pour[1] - u * 0.02], [bx - u * 0.14, bw.y - 24 * bw.s]], 1.4, { wob: 0.3 });
    F.fig(maya, { ...pose, front: dust(0.05), reachN: BL(-bag.w * 0.28, -bag.h * 0.32), reachF: BL(-bag.w * 0.46, bag.h * 0.22), bendN: 1, bendF: 1, handN: 'grip', handF: 'clutch', handAngN: -30, handAngF: 40, legacyArms: false,
      behind: () => flourBag(bag), head: { yaw: 58, pitch: -10, look: [0.7, 0.8], mood: 'joy' } });
    puff(bx + u * 0.3, bw.y - 40 * bw.s, bw.s * 0.9, 5);
  });
  y += 410 + G;

  // 2 — loaf #1, over her shoulder: the brick on the board and on her phone screen
  r = PG.row(y, 300, [1.25, 1]);
  P(r[0], (w, h) => {
    const c = camera(w, h, { x: 740, s: 1.3, fy: h * 0.6 + 150 * 1.3 + 30, eye: -230, vx: 60 });
    const S = kitchenSet(c, { count: 0, flour: 0.2 });
    const lb = S.top(730, 30);
    board(lb.x, lb.y, 120 * lb.s);
    loaf(lb.x, lb.y - 9 * lb.s, lb.s * 0.95, 'brick');
    [[1]].forEach(([d]) => { const bx = lb.x + d * 58 * lb.s; [0, 1, 2].forEach((k) => smudge(bx + d * (6 + k * 9) * lb.s, lb.y - (12 + k * 3) * lb.s, (6 - k) * lb.s, (4 - k * 0.8) * lb.s, k + d * 5 + 20)); line([[bx + d * 4 * lb.s, lb.y - 22 * lb.s], [bx + d * 20 * lb.s, lb.y - 32 * lb.s]], 1.8); });
    letters(lb.x + 60, lb.y - 120, 'CLONK!', { size: 34, color: '#ffffff', rot: -6, seed: 4, lines: true });
    // Maya from behind, big in the foreground, phone up in both hands
    const ft = c.at(640, 150);
    const pose = { ...F.POSES.stand(), x: ft.x, y: ft.y, s: MS * ft.s, yaw: 150, lean: 4 };
    const r0 = F.rig(maya, pose), u = r0.unit;
    const pc = [r0.headC[0] + u * 0.85, r0.headC[1] + u * 0.05], pw = u * 0.46, ph = u * 0.76;
    F.fig(maya, { ...pose, reachN: [pc[0] - pw * 0.5, pc[1] + ph * 0.3], reachF: [pc[0] + pw * 0.45, pc[1] + ph * 0.3], bendN: 1, bendF: -1, handN: 'none', handF: 'none', legacyArms: false, front: (rr) => { apronBack(rr); dust(0.15)(rr); }, head: { yaw: 130, pitch: -6, mood: 'focus' } });
    phoneShot(pc, pw, ph, -4, 'brick', r0);
  }, (w, h) => PG.caption(12, 12, ['LOAF #1'], { size: 14 }));
  P(r[1], (w, h) => {
    // photo #1 goes on the fridge: 3/4 back view, the photo pressed flat under her palm with a magnet
    const c = camera(w, h, { x: 830, s: 0.84, fy: h * 0.86, eye: -150, vx: -120 });
    const S = kitchenSet(c, { count: 0, flour: 0.2 });
    const FZ = S.FZ, p1 = photoSlot(1);
    const ph = [S.fr.x + p1.fx * S.fr.w, S.fr.y + p1.fy * S.fr.h];
    const ft = c.at(752, 150);
    const pose = { ...F.POSES.stand(), x: ft.x, y: ft.y, s: MS * ft.s, yaw: 128, lean: 6, reachN: [ph[0] - 2, ph[1] + 14 * FZ.s], bendN: 1, handN: 'flat', handAngN: -88, reachF: 'hipF', handF: 'pen', holdF: 'pen', legacyArms: false, head: { yaw: 112, pitch: 4, mood: 'smile' } };
    F.fig(maya, { ...pose, parts: ['shadow', 'armF', 'legF', 'legN', 'torso', 'head'], front: (rr) => { apronBack(rr); dust(0.2)(rr); } });
    polaroid(ph[0], ph[1], p1.rot, 1, FZ.s * 0.46);
    F.fig(maya, { ...pose, parts: ['armN'] });
  });
  y += 300 + G;

  // 3–5 — three failures, three cameras, three reactions. The fridge fills; the flour spreads.
  r = PG.row(y, 280, [1, 1, 1]);
  // #6 burnt — close on Maya doubled over coughing in the smoke, mitt waving
  P(r[0], (w, h) => {
    const c = camera(w, h, { x: 725, s: 0.95, fy: h * 0.62 + 150 * 0.95, eye: -200, vx: -30 });
    let koff = [0, 0];
    const S = kitchenSet(c, { count: 5, flour: 0.35, ovenOn: true });
    const lb = S.top(730, 30);
    board(lb.x, lb.y, 140 * lb.s); loaf(lb.x, lb.y - 8 * lb.s, lb.s * 0.9, 'burnt');
    const ft = c.at(610, 170);
    F.fig(maya, { ...F.POSES.stand(), x: ft.x, y: ft.y, s: MS * ft.s, yaw: 35, lean: 26, curve: 18, armN: [150, 30, 40], handN: 'open', holdN: mitt, reachF: null, armF: [70, 120, 10], handF: 'fist', front: (rr) => { dust(0.4)(rr); koff = [rr.headC[0] - rr.R * 0.2, rr.headC[1] + rr.R * 2.1]; }, head: { yaw: 20, pitch: -12, mood: 'grimace', blink: true } });
    smoke(lb.x + 10 * lb.s, lb.y - 40 * lb.s, lb.s * 0.95);
    smokeDrift(lb.x - 30 * lb.s, lb.y - 110 * lb.s, lb.s);
    letters(Math.max(koff[0], 90), Math.min(koff[1], 250), 'KOFF! KOFF!', { size: 21, color: '#ffffff', rot: -8, seed: 2 });
  }, (w, h) => PG.caption(10, 10, ['LOAF #6'], { size: 13 }));
  // #13 exploded — low angle: she ducks, the dough goes up
  P(r[1], (w, h) => {
    const c = camera(w, h, { x: 700, s: 0.72, fy: h * 0.96, eye: 30, vx: 20 });
    const S = kitchenSet(c, { count: 12, flour: 0.6, ovenSplat: true });
    const lb = S.top(730, 44);
    burst(lb.x, lb.y - 70 * lb.s, 95 * lb.s, 13);
    board(lb.x, lb.y, 140 * lb.s); loaf(lb.x, lb.y - 8 * lb.s, lb.s * 1.05, 'exploded');
    letters(lb.x + 50 * lb.s, lb.y - 118 * lb.s, 'FWUMP!', { size: 30, color: '#f0c23a', rot: 10, seed: 13 });
    const ft = c.at(640, 150);
    F.fig(maya, { ...F.POSES.stand(), x: ft.x, y: ft.y, s: MS * ft.s, yaw: 30, lean: 18, curve: 22, legN: [30, 40], legF: [10, 30], armN: [165, 60, 50], armF: [150, 70, 40], handN: 'open', handF: 'open', front: (rr) => { dust(0.6)(rr); [[0.5, -0.8], [-0.4, -1.0], [0.9, -0.2]].forEach(([a, b], k) => smudge(rr.headC[0] + a * rr.R, rr.headC[1] + b * rr.R, rr.R * 0.14, rr.R * 0.1, 60 + k, 1)); }, head: { yaw: 25, pitch: -8, mood: 'shock', mouth: 'o', look: [0.5, -0.8] } });
  }, (w, h) => PG.caption(10, 10, ['LOAF #13'], { size: 13 }));
  // #22 raw — 3/4 from the fridge side: chin on her arms on the worktop, eye to eye with a puddle
  P(r[2], (w, h) => {
    const c = camera(w, h, { x: 690, s: 1.0, fy: h * 0.58 + 150, eye: -170, vx: 170 });
    const S = kitchenSet(c, { count: 21, flour: 0.9 });
    const lb = S.top(700, 36);
    board(lb.x, lb.y, 150 * lb.s); loaf(lb.x, lb.y - 7 * lb.s, lb.s * 1.0, 'raw');
    const ft = c.at(560, 110);
    const base = { ...F.POSES.stand(), x: ft.x, y: ft.y, s: MS * ft.s, yaw: 70, lean: 30, curve: 18, neckTilt: -6 };
    // lean until her chin, propped on her stacked hands, sits on the worktop
    const worktop = S.top(600, 20).y;
    let rr0 = F.rig(maya, base);
    for (let lo = 0, hi = 70, k = 0; k < 16; k++) { base.lean = (lo + hi) / 2; rr0 = F.rig(maya, base); if (rr0.headC[1] + rr0.unit * 0.62 < worktop) lo = base.lean; else hi = base.lean; }
    const hc = rr0.headC, uu = rr0.unit;
    F.fig(maya, { ...base, reachN: [hc[0] + uu * 0.3, hc[1] + uu * 0.58], reachF: [hc[0] + uu * 0.16, hc[1] + uu * 0.62], bendN: 1, bendF: 1, handN: 'fist', handF: 'flat', handAngN: -90, handAngF: 0, legacyArms: false, front: dust(0.8), head: { yaw: 72, pitch: -2, look: [0.9, 0.3], mood: 'sad' } });
    letters(lb.x + 30 * lb.s, lb.y + 40 * lb.s, 'splut.', { size: 22, color: '#f2e6c8', rot: 8, seed: 22, tilt: 14 });
  }, (w, h) => PG.caption(10, 10, ['LOAF #22'], { size: 13 }));
  y += 280 + G;

  // 6 — evening. Dad comes in, arms folded; Maya turns from pinning #47. The fridge and the wall buried.
  r = PG.row(y, 400, [1]);
  P(r[0], (w, h) => {
    const c = camera(w, h, { x: 610, s: 0.88, fy: h * 0.84, eye: -200, vx: -20 });
    const S = kitchenSet(c, { eve: true, count: 46, flour: 1, days: 26 });
    PG.glow(c.X(600), c.Y(-380), c.L(320), '#ffe7a0', 0.3);
    // the evidence on the worktop
    const t = (x, z) => S.top(x, z);
    bowlBack(t(450, 30).x, t(450, 30).y + 3, 30 * t(450).s); bowlBack(t(450, 30).x, t(450, 30).y - 13 * t(450).s, 26 * t(450).s);
    flourBag({ c: [t(190, 24).x, t(190, 24).y - 30 * t(190).s], ang: -8, w: 44 * t(190).s, h: 62 * t(190).s });
    flourBag({ c: [t(228, 34).x, t(228, 34).y - 26 * t(228).s], ang: 24, w: 40 * t(228).s, h: 56 * t(228).s });
    loafTin(t(705, 30).x, t(705, 30).y + 2, t(705).s);
    flourSpill(t(470).x, t(470).y, t(470).s, 7, 40);
    // Maya at the fridge, turned back toward him, photo #47 in her hand
    const mf = c.at(760, 150);
    F.fig(maya, { ...F.POSES.stand(), x: mf.x, y: mf.y, s: MS * mf.s, yaw: -40, curve: -4, side: -4, reachN: [mf.x - 60 * mf.s, mf.y - 170 * mf.s], bendN: 1, handN: 'hold', holdN: 'photo', handAngN: -120, armF: [0, 20, 6], handF: 'relaxed', front: dust(1), head: { yaw: -45, pitch: 4, look: [-0.9, -0.2], mood: 'smile' } });
    // Dad, just in from work: arms folded, weight on one leg, jacket over the shoulder
    const df = c.at(470, 150);
    const dr7 = F.rig(dad, { ...F.POSES.stand(), x: df.x, y: df.y, s: DS * df.s, yaw: 45 });
    const nape = [dr7.neck[0] - dr7.dir * dr7.unit * 0.12, dr7.neck[1] - dr7.unit * 0.22];
    const d7 = F.fig(dad, { ...F.POSES.stand(), x: df.x, y: df.y, s: DS * df.s, yaw: 45, weight: 'F', curve: 10, reachN: nape, bendN: -1, handN: 'flat', handAngN: 200, armOver: true, armF: [2, 10, 6], handF: 'grip', holdF: caseObj, head: { yaw: 50, pitch: -4, look: [0.9, 0], mood: 'tired', mouth: 'flat' } });
    SPK = mouthOf(d7);
  }, (w, h) => balloon(SPK[0] + 175, 62, ['MAYA… THAT’S', '47 FAILURES.'], SPK[0], SPK[1], { seed: 3 }));
  y += 400 + G;

  // 7 — Maya, flour on her nose, grinning  |  8 — the notes under the photos
  r = PG.row(y, 350, [1, 1.3]);
  P(r[0], (w, h) => {
    I.rect(0, 0, w, h, '#dc8f30');
    burstRays(w * 0.46, h * 0.6, w, h, 31);
    const hx = w * 0.42, hy = h * 0.6, s = 3.1;
    cel([[hx - 150, h + 10], [hx - 124, hy + 92], [hx - 50, hy + 66], [hx + 50, hy + 66], [hx + 124, hy + 92], [hx + 150, h + 10]], maya.top.color, { w: 3, k: 1.6 });
    line([[hx - 44, hy + 70], [hx, hy + 86], [hx + 44, hy + 70]], 2.2, { color: '#22305a' });
    cel([[hx - 62, h + 10], [hx - 50, hy + 96], [hx + 50, hy + 96], [hx + 62, h + 10]], '#d9493a', { shade: '#a8302a', w: 3, k: 1.2 });
    line([[hx - 50, hy + 96], [hx - 36, hy + 66]], 5, { color: '#d9493a' }); line([[hx + 50, hy + 96], [hx + 36, hy + 66]], 5, { color: '#d9493a' });
    smudge(hx + 22, hy + 126, 16, 9, 71);
    HD.head(maya.head, { x: hx, y: hy, s, yaw: 16, pitch: 4, look: [0.3, 0], mood: 'joy', mouth: 'laugh' });
    // flour: the tip of the nose (a fingertip dab), a swipe on the cheek, a clump in the hair
    smudge(hx + 16, hy + 24, 10, 7, 72, 0.97);
    I.grp(`rotate(-18 ${hx - 38} ${hy + 30})`, () => { smudge(hx - 38, hy + 30, 15, 5, 73, 0.9); line([[hx - 52, hy + 30], [hx - 24, hy + 29]], 3, { color: K.flour, op: 0.8, taper: [0.1, 0.8] }); });
    smudge(hx + 34, hy - 86, 16, 8, 74, 0.9);
    // her arm comes up from the bottom edge, a floury finger pointing to the notes (next panel)
    const wr = [hx + 118, hy + 44];
    cel([[hx + 96, h + 10], [hx + 176, h + 10], [wr[0] + 24, wr[1] + 22], [wr[0] - 16, wr[1] + 12]], maya.top.color, { w: 3, k: 1.2 });
    hand(wr[0] + 2, wr[1] + 4, -22, 3.6, 'point', { skin: maya.head.skin, child: true });
    smudge(wr[0] + 52, wr[1] - 16, 4, 3, 75, 0.9);
    PG.ticks(hx, hy - 30, 118, 5, -160, -20, 16);
    const rf = mk(4);
    for (let k = 0; k < 16; k++) I.fill(I.ell(rf() * w, rf() * h * 0.9, 1.5 + rf() * 2, 1.5 + rf() * 2, 6), K.flour, { op: 0.85, wob: 0 });
  }, (w, h) => balloon(w * 0.42, 54, ['RESULTS! WHY, MAN,', 'I HAVE GOTTEN A', 'LOT OF RESULTS!'], w * 0.4, 150, { seed: 7 }));
  P(r[1], (w, h) => {
    I.rect(0, 0, w, h, K.fridge);
    I.fill([[0, 0], [w, 0], [w, 16], [0, 22]], '#7fa8c2', { lin: true, wob: 0 });
    const cells = [[1, 'yeast was dead'], [6, 'oven too hot!'], [13, 'too much yeast'], [22, 'not baked long'], [31, 'knead 10 min'], [47, 'ALMOST!!']];
    cells.forEach(([n, note], k) => notePhoto(86 + (k % 3) * 160, 60 + Math.floor(k / 3) * 138, [-4, 3, -2, 4, -3, 2][k], n, note));
    stickyNote(w - 40, 196, 8, ['220°', '→190°'], '#fff3a0', 0.62);
  }, (w, h) => PG.caption(w / 2 - 170, h - 56, ['I KNOW SEVERAL THOUSAND THINGS', 'THAT WON’T WORK.'], { size: 15, w: 340 }));
  y += 350 + G;

  // 9 — the turn: Dad has taken #6 off the fridge and reads its note; Maya waits, hands clasped
  r = PG.row(y, 320, [1]);
  P(r[0], (w, h) => {
    const c = camera(w, h, { x: 690, s: 1.2, fy: h * 0.5 + 200 * 1.2 + 60, eye: -250, vx: 120 });
    const S = kitchenSet(c, { eve: true, count: 47, flour: 1, days: 26, skip: [6] });
    PG.glow(c.X(700), c.Y(-240), c.L(300), '#ffe7a0', 0.3);
    const df = c.at(690, 190);
    const dr0 = F.rig(dad, { ...F.POSES.stand(), x: df.x, y: df.y, s: DS * df.s, yaw: -30 });
    const pt = [dr0.shF[0] - dr0.unit * 0.6, dr0.shF[1] + dr0.unit * 0.3];
    F.fig(dad, { ...F.POSES.stand(), x: df.x, y: df.y, s: DS * df.s, yaw: -30, lean: 6, curve: 8, reachF: pt, bendF: 1, handF: 'hold', holdF: photoObj(6), handAngF: -95, armN: [4, 16, 6], handN: 'relaxed', legacyArms: false, front: (rr) => { SPK = mouthOf(rr); }, head: { yaw: -40, pitch: -10, look: [-0.6, 0.6], mood: 'worried', mouth: 'smile' } });
    const mf = c.at(520, 170);
    const mr0 = F.rig(maya, { ...F.POSES.stand(), x: mf.x, y: mf.y, s: MS * mf.s, yaw: 40 });
    const ch = [mr0.neck[0] + mr0.dir * mr0.unit * 0.3, mr0.neck[1] + mr0.unit * 0.3];
    F.fig(maya, { ...F.POSES.stand(), x: mf.x, y: mf.y, s: MS * mf.s, yaw: 40, curve: -6, reachN: ch, reachF: [ch[0] - mr0.unit * 0.06, ch[1] + mr0.unit * 0.04], bendN: 1, bendF: 1, handN: 'clutch', handF: 'clutch', armOver: true, front: dust(1), head: { yaw: 45, pitch: 10, look: [0.6, -0.7], mood: 'worried', mouth: 'smile' } });
  }, (w, h) => balloon(Math.max(130, SPK[0] - 230), 46, ['“#6. OVEN TOO HOT…”'], SPK[0], SPK[1], { size: 14, seed: 12 }));
  y += 320 + G;

  // 10 — splash: loaf #48, golden and steaming, torn open between them; every failure behind them
  const SH = 600;
  r = PG.row(y, SH, [1]);
  P(r[0], (w, h) => {
    const c = camera(w, h, { x: 680, s: 1.28, fy: h * 0.82, eye: -200, vx: -40 });
    const S = kitchenSet(c, { eve: true, count: 47, flour: 1, ovenOn: true, days: 27 });
    // flat warm light: the oven window throws a trapezoid onto the floor; a lit patch on the wall behind
    const oz = c.Z(60);
    I.fill([[oz.X(585), oz.Y(-30)], [oz.X(645), oz.Y(-30)], [c.Z(200).X(700), c.Z(200).Y(0)], [c.Z(200).X(520), c.Z(200).Y(0)]], '#ffd27a', { op: 0.45, lin: true, wob: 0.3 });
    I.fill([[c.X(470), c.Y(-150)], [c.X(760), c.Y(-150)], [c.X(730), c.Y(-330)], [c.X(500), c.Y(-330)]], '#ffe2a0', { op: 0.35, lin: true, wob: 0.3 });
    const mt = S.top(470, 30);
    SC.mug(mt.x, mt.y + 2, mt.s * 1.3, { steam: true });
    const mf = c.at(545, 150), dfp = c.at(745, 150);
    const pm = { ...F.POSES.stand(), x: mf.x, y: mf.y, s: MS * mf.s, yaw: 55, lean: 6, curve: -4 };
    const pd = { ...F.POSES.stand(), x: dfp.x, y: dfp.y, s: DS * dfp.s, yaw: -50, lean: 10, curve: 6, weight: 'F' };
    const rm = F.rig(maya, pm);
    const L = mf.s * 0.92;
    const mid = [(mf.x + dfp.x) / 2 - 4 * L, rm.shN[1] + rm.unit * 0.9];
    // one loaf, torn: two halves just pulled apart, the crumb faces showing
    const half = (sgn) => [[0, 0], [sgn * 6, -36], [sgn * 26, -50], [sgn * 56, -48], [sgn * 76, -30], [sgn * 74, 0], [sgn * 40, 8]].map(([a, b]) => [mid[0] + sgn * 8 * L + a * L, mid[1] + b * L]);
    const lh = half(-1), rh = half(1);
    // hands: the far hand over the top of the crust, the near hand round the outer end
    const grips = (q, sgn) => [[q[3][0] - sgn * 6 * L, q[3][1] + 10 * L], [q[4][0] + sgn * 2 * L, q[4][1] + 14 * L]];
    const gm = grips(lh, -1), gd = grips(rh, 1);
    const PM = { ...pm, reachF: gm[0], reachN: gm[1], bendN: 1, bendF: 1, handN: 'grip', handF: 'reach', handAngF: 35, handAngN: 80, legacyArms: false, head: { yaw: 50, pitch: 2, look: [0.5, 0.3], mood: 'joy', mouth: 'laugh' } };
    const PD = { ...pd, reachF: gd[0], reachN: gd[1], bendN: 1, bendF: 1, handN: 'clutch', handF: 'flat', handAngF: 150, handAngN: 105, legacyArms: false, head: { yaw: -40, pitch: -6, look: [-0.5, 0.5], mood: 'joy' } };
    F.fig(dad, { ...PD, parts: ['shadow', 'legF', 'legN', 'torso', 'head'] });
    F.fig(maya, { ...PM, parts: ['shadow', 'legF', 'legN', 'torso', 'head'], front: dust(1) });
    [[lh, -1], [rh, 1]].forEach(([q, sgn]) => {
      cel(q, LOAF.good, { shade: '#a8601e', w: 3, k: 1.1 });
      I.clipPoly(q, () => I.fill(q.map(([a, b]) => [a + sgn * 4 * L, b - 30 * L]), '#eab05a', { wob: 0 }));
      [[0.36, -40], [0.66, -34]].forEach(([t, yy]) => { const cx = q[0][0] + sgn * 76 * L * t, cy = q[0][1] + yy * L; shape([[cx - sgn * 11 * L, cy + 6 * L], [cx - sgn * 2 * L, cy - 3 * L], [cx + sgn * 10 * L, cy - 8 * L], [cx + sgn * 1 * L, cy + 2 * L]], '#f5d89a', { w: 1.8 }); line([[cx - sgn * 11 * L, cy + 6 * L], [cx + sgn * 10 * L, cy - 8 * L]], 1.6, { color: '#8a4a18' }); });
      for (let k = 0; k < 6; k++) I.fill(I.ell(q[0][0] + sgn * (22 + k * 8) * L, q[0][1] - (45 - (k % 2) * 4) * L, 2 * L, 1.3 * L, 6), '#fff6e0', { op: 0.85, wob: 0 });
      const e0 = q[0], e1 = q[1], rr = mk(sgn > 0 ? 3 : 4);
      const rag = [e0, [e0[0] + sgn * 3 * L, e0[1] - 9 * L], [e0[0] - sgn * 6 * L, e0[1] - 16 * L], [e0[0] - sgn * 2 * L, e0[1] - 25 * L], [e1[0] - sgn * 9 * L, e1[1] + 6 * L], e1, [e1[0] - sgn * 20 * L, e1[1] + 4 * L], [e1[0] - sgn * 24 * L, e1[1] + 18 * L], [e0[0] - sgn * 22 * L, e0[1] - 10 * L], [e0[0] - sgn * 16 * L, e0[1] + 3 * L]];
      cel(rag, '#fbf0d4', { shade: '#ead8ae', w: 2, k: 0.5 });
      for (let k = 0; k < 8; k++) I.fill(I.ell(e0[0] - sgn * (5 + rr() * 16) * L, e0[1] - (5 + rr() * 30) * L, (1.2 + rr() * 1.6) * L, (1.6 + rr() * 2) * L, 8), '#e2c894', { wob: 0 });
    });
    // crumb strands still joining the halves
    for (let k = 0; k < 3; k++) line([[mid[0] - 9 * L, mid[1] - (8 + k * 9) * L], [mid[0], mid[1] - (5 + k * 9) * L], [mid[0] + 9 * L, mid[1] - (8 + k * 9) * L]], 2, { color: '#fbf0d4' });
    // crust dents where the fingers sink in
    [...gm, ...gd].forEach((g) => line([[g[0] - 7 * L, g[1] - 4 * L], [g[0] + 7 * L, g[1] - 3 * L]], 1.4, { color: '#8a4a18' }));
    F.fig({ ...dad, handScale: 1.35 }, { ...PD, parts: ['armF', 'armN'] });
    F.fig({ ...maya, handScale: 1.45 }, { ...PM, parts: ['armF', 'armN'] });
    steam(mid[0], mid[1] - 56 * L, 150 * L, 3, 20 * L, 4);
    PG.ticks(mid[0], mid[1] - 24 * L, 80 * L, 5, -165, -15, 14);
  }, (w, h) => PG.caption(16, 16, ['LOAF #48'], { size: 22 }));
  y += SH;
  // the attribution sits under the splash, on the page, not over the art
  letters(W - PG.MARGIN - 4, y + 34, '– THOMAS EDISON', { size: 24, color: INK, anchor: 'end', seed: 48, extrude: INK, sw: 0.1, jit: 0.06, tilt: 3 });
  y += 44;
  H = y + 44;
  PG.text(PG.MARGIN, H - 22, 'Edison, as reported in Dyer & Martin, Edison: His Life and Inventions (1910). A homage to Zen Pencils by Gavin Aung Than.', { size: 11, anchor: 'start', color: '#8b8497', ls: 0.3 });
  PG.text(W - PG.MARGIN, H - 22, 'No. 4', { size: 11, anchor: 'end', color: '#8b8497', ls: 1 });
}
// a phone seen from behind her: the screen shows the photo she's taking; her fingers wrap the edges
function phoneShot(c, w, h, rot, kind, rr) {
  const skin = maya.head.skin, hsz = rr.unit * 0.027;
  I.grp(`rotate(${rot} ${c[0]} ${c[1]})`, () => {
    // fingers behind the phone (tips peeking round the far edge)
    [[-0.5, -0.1], [-0.5, 0.12], [0.5, -0.05], [0.5, 0.16]].forEach(([a, b]) => cel(I.ell(c[0] + a * w + Math.sign(a) * 3, c[1] + b * h, w * 0.1, h * 0.06, 10), skin, { w: 1.6, k: 0.3 }));
    shape(I.rectPts(c[0] - w / 2, c[1] - h / 2, w, h), '#22242c', { w: 2.2, lin: true });
    I.rect(c[0] - w / 2 + 4, c[1] - h / 2 + 6, w - 8, h - 14, '#dcb468');
    I.clipRect(c[0] - w / 2 + 4, c[1] - h / 2 + 6, w - 8, h - 14, () => { I.rect(c[0] - w / 2, c[1] + h * 0.08, w, h, '#a8683a'); loaf(c[0], c[1] + h * 0.12, w / 190, kind); });
    I.fill(I.ell(c[0], c[1] + h / 2 - 4, 3, 2, 8), '#555', { wob: 0 });
    line([[c[0] - w * 0.3, c[1] - h * 0.1], [c[0] - w * 0.05, c[1] - h * 0.38]], 2.2, { color: '#ffffff', op: 0.35 });
  });
  // thumbs in front, on the lower corners
  hand(c[0] - w * 0.58, c[1] + h * 0.42, -40, hsz, 'hold', { skin, child: true, wrist: false });
  hand(c[0] + w * 0.58, c[1] + h * 0.42, -140, hsz, 'hold', { skin, child: true, flip: true, wrist: false });
}
// photo #n as a held object (for hand 'hold')
const photoObj = (n) => (T, s, A) => { const c = T(A.c); polaroid(c[0], c[1] - s * 3, -10, n, s * 0.2, { bare: true }); };
// jagged starburst behind an explosion
function burst(x, y, r, seed) {
  const q = mk(seed), pts = [];
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, k = i % 2 ? 0.45 + q() * 0.15 : 0.85 + q() * 0.35; pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.8]); }
  shape(pts, '#fff1b8', { w: 2.2, lin: true });
}
// hand-drawn sunburst: wedges of uneven width that don't all start at the same point
function burstRays(cx, cy, w, h, seed) {
  const q = mk(seed);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + q() * 0.08, sp = 0.035 + q() * 0.05, r0 = 30 + q() * 60;
    I.fill([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a - sp) * 800, cy + Math.sin(a - sp) * 800], [cx + Math.cos(a + sp) * 800, cy + Math.sin(a + sp) * 800]], '#eaaa48', { lin: true, wob: 0.6 });
  }
}
function smokeDrift(x, y, s) { const r = mk(8); for (let k = 0; k < 3; k++) line([[x - k * 30 * s, y - k * 10 * s], [x - (k * 30 + 26) * s, y - (k * 10 + 14) * s], [x - (k * 30 + 50) * s, y - (k * 10 + 6) * s]], 2.4, { color: '#6e6a74', op: 0.8 - r() * 0.2 }); }

const caseObj = (T, s, A) => { const c = T(A.c); const k = s * 1.15; cel([[c[0] - 13 * k, c[1] + 3 * k], [c[0] + 13 * k, c[1] + 3 * k], [c[0] + 14 * k, c[1] + 22 * k], [c[0] - 14 * k, c[1] + 22 * k]], '#6a3a24', { w: 2, k: 0.4, lin: true }); I.rect(c[0] - 2 * k, c[1] + 6 * k, 4 * k, 3 * k, '#e0b64a'); };
function loafTin(x, y, s) {
  shape([[x - 40 * s, y - 34 * s], [x + 40 * s, y - 34 * s], [x + 34 * s, y], [x - 34 * s, y]], '#9aa2ac', { w: 2, lin: true });
  I.fill([[x - 38 * s, y - 34 * s], [x + 38 * s, y - 34 * s], [x + 36 * s, y - 26 * s], [x - 36 * s, y - 26 * s]], '#6a7078', { lin: true, wob: 0 });
}
function briefcase(x, y, s) {
  cel([[x - 30 * s, y - 44 * s], [x + 30 * s, y - 44 * s], [x + 32 * s, y], [x - 32 * s, y]], '#6a3a24', { w: 2.2, k: 0.6, lin: true });
  line([[x - 10 * s, y - 44 * s], [x - 10 * s, y - 54 * s], [x + 10 * s, y - 54 * s], [x + 10 * s, y - 44 * s]], 2.4, { taper: [0, 0] });
  I.rect(x - 4 * s, y - 38 * s, 8 * s, 5 * s, '#e0b64a');
}
function stickyNote(x, y, rot, lines, col, sc = 1) {
  I.grp(`translate(${x} ${y}) rotate(${rot}) scale(${sc})`, () => {
    I.fill(I.rectPts(-40, -38, 84, 80), '#000000', { op: 0.14, lin: true, wob: 0 });
    shape(I.rectPts(-44, -42, 84, 80), col, { w: 1.4, lin: true });
    lines.forEach((t, i) => I.text(-2, -14 + i * 24, t, { font: 'Journal', size: 19, color: K.ink }));
  });
}
// a big polaroid for the close-up, its note written under the photo
function notePhoto(x, y, rot, n, note) {
  I.grp(`translate(${x} ${y}) rotate(${rot})`, () => {
    polaroid(0, 0, 0, n, 1.12, { bare: true });
    const nw = PG.textW(`#${n}`, 17, 'Journal', 0.2), tw = PG.textW(note, 16, 'Journal', 0.2);
    const W0 = nw + tw + 22, x0 = -W0 / 2, y0 = 46;
    I.grp(`rotate(${-rot * 0.6 + (n % 2 ? 2 : -2)})`, () => {
      I.fill([[x0, y0], [x0 + W0, y0 + 1], [x0 + W0 - 2, y0 + 25], [x0 + 1, y0 + 24]], '#f2e6c4', { op: 0.95, wob: 0, lin: true });
      [[x0, y0], [x0 + W0, y0 + 1]].forEach(([a, b]) => line([[a, b], [a + (a === x0 ? 2 : -2), b + 24]], 1, { color: '#d8c89a', taper: [0, 0] }));
      I.text(x0 + 8, y0 + 18, `#${n}`, { font: 'Journal', size: 17, color: K.red, anchor: 'start' });
      I.text(x0 + 14 + nw, y0 + 18, note, { font: 'Journal', size: 16, color: K.ink, anchor: 'start' });
      if (n === 47) line([[x0 + 14 + nw, y0 + 22], [x0 + 12 + nw + tw, y0 + 21]], 1.6, { color: K.red, taper: [0, 0] });
    });
  });
}
function bowlBack(x, y, r) { cel([[x - r, y - r * 0.62], [x + r, y - r * 0.62], [x + r * 0.8, y - r * 0.18], [x + r * 0.45, y], [x - r * 0.45, y], [x - r * 0.8, y - r * 0.18]], '#5f9cc8', { w: 2.2, k: r / 30, shade: '#3f78a4' }); shape(I.ell(x, y - r * 0.62, r, r * 0.17, 20), '#f7f1e2', { w: 1.6 }); }
function bowlFront(x, y, r) { void x; void y; void r; }
// a big paper flour bag, tipped (b.c centre, b.ang degrees, mouth at the bottom right)
function flourBag(b) {
  I.grp(`translate(${I.n1(b.c[0])} ${I.n1(b.c[1])}) rotate(${b.ang})`, () => {
    const w = b.w, h = b.h;
    cel([[-w / 2, -h / 2], [w / 2, -h / 2 - w * 0.04], [w / 2 + w * 0.06, h / 2], [w * 0.2, h / 2 + w * 0.12], [-w / 2 - w * 0.05, h / 2]], '#f3ecdc', { w: 2.4, shade: '#d8ccb2', k: w / 40 });
    shape([[-w * 0.36, -h * 0.05], [w * 0.36, -h * 0.07], [w * 0.38, h * 0.26], [-w * 0.38, h * 0.28]], K.red, { w: 1.4 });
    I.text(0, h * 0.18, 'FLOUR', { font: 'Title', size: w * 0.3, color: '#ffffff' });
    line([[-w * 0.4, -h * 0.4], [w * 0.4, -h * 0.42]], 1.2, { color: '#b8ac90' });
    I.fill(I.ell(w * 0.2, h / 2 + w * 0.05, w * 0.36, w * 0.1, 10), K.flour, { wob: 0.4 });
  });
}
function tableCorner(w, h) {
  const top = [[w * 0.64, h + 4], [w * 0.72, h * 0.86], [w + 4, h * 0.83], [w + 4, h + 4]];
  // gingham cloth over a wooden table: the hanging edge shows the table's corner
  const cl = [[w * 0.66, h * 0.97], [w * 0.735, h * 0.855], [w + 4, h * 0.83], [w + 4, h + 4], [w * 0.66, h + 4]];
  cel(cl, '#f6efe2', { shade: '#e0d4c0', w: 2.6, k: 0.8, lin: true, inner: () => {
    for (let i = -12; i < 14; i++) { const x0 = w * 0.735 + i * 22; I.fill([[x0, h * 0.85], [x0 + 11, h * 0.85], [x0 + 11 - 40, h + 10], [x0 - 40, h + 10]], K.red, { op: 0.45, lin: true, wob: 0 }); }
    for (let j = 0; j < 5; j++) { const yy = h * 0.855 + j * 16; I.fill([[w * 0.6, yy], [w + 4, yy - 4], [w + 4, yy + 7], [w * 0.6, yy + 11]], K.red, { op: 0.45, lin: true, wob: 0 }); }
  } });
  // eggs in a bowl, behind the card
  bowlBack(w * 0.72, h * 0.93, 30);
  [[-12, -22], [2, -26], [14, -21]].forEach(([a, b]) => shape(I.ell(w * 0.72 + a, h * 0.93 + b, 9, 11, 12), '#f4e8d8', { w: 1.8 }));
}
function recipeCard() {
  I.fill(I.rectPts(-84, -64, 176, 128), '#000000', { op: 0.18, wob: 0, lin: true });
  shape(I.rectPts(-90, -70, 176, 128), '#fbf6e2', { w: 2.2, lin: true });
  for (let k = 0; k < 6; k++) line([[-84, -34 + k * 17], [80, -34 + k * 17]], 0.9, { color: '#9cc8e0', taper: [0, 0], lin: true });
  line([[-60, -70], [-60, 58]], 0.9, { color: '#e8a0a0', taper: [0, 0], lin: true });
  I.text(-2, -44, "Nana's Loaf", { font: 'Journal', size: 26, color: K.ink });
  ['4 cups flour', '1 spoon yeast', 'salt + warm water', 'knead, wait, bake', 'LOVE (lots!)'].forEach((t, i) => I.text(-54, -21 + i * 17, t, { font: 'Journal', size: 16, anchor: 'start', color: K.ink }));
  I.text(50, 50, '♥', { font: 'Journal', size: 16, color: K.red });
  I.fill(I.ell(-66, 34, 14, 8, 10), '#e8c878', { op: 0.45, wob: 0.5 });
}
function flourCloud(x, y, s) {
  const r = mk(5);
  for (let k = 0; k < 11; k++) {
    const p = I.ell(x + (r() - 0.5) * 90 * s, y - r() * 50 * s, (12 + r() * 18) * s, (9 + r() * 12) * s, 14);
    I.fill(p, K.flour, { op: 0.92, wob: 0.8 });
  }
  const r2 = mk(9);
  for (let k = 0; k < 14; k++) I.fill(I.ell(x + (r2() - 0.5) * 150 * s, y - r2() * 90 * s, 2.5 * s, 2.5 * s, 6), K.flour, { wob: 0 });
}

page();
const out = I.take();
fs.mkdirSync(path.join(__dirname, '..', 'out'), { recursive: true });
fs.writeFileSync(process.env.OUT || path.join(__dirname, '..', 'out', 'several-thousand-things.svg'), PG.svgDoc(W, H, `<rect width="${W}" height="${H}" fill="#ffffff"/>` + out));
console.log('wrote', H);
